import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { CaptionSegment, SupportedLanguage } from "../../types/index.js";
import { KalaloError } from "../../utils/errors.js";
import { ensureDir, ensureLocalMediaFile } from "../../utils/paths.js";
import { env } from "../../config/env.js";
import { resolveFfmpegPath, spawnSafe } from "../../utils/process.js";
import { CaptionsService } from "../captions.service.js";
import { MediaService } from "../media.service.js";
import { SettingsService } from "../settings.service.js";
import {
  TranscriptionInput,
  TranscriptionProvider,
  TranscriptionResult,
} from "./provider.interface.js";

interface RawGeminiSegment {
  start: number;
  end: number;
  text: string;
  language?: string;
}

export class GeminiTranscriptionProvider implements TranscriptionProvider {
  public readonly name = "gemini";

  public async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    if (input.signal?.aborted) {
      throw new KalaloError({
        code: "PROCESS_CANCELLED",
        message: "Transcription was cancelled",
        retryable: true,
      });
    }

    const apiKey = SettingsService.getGeminiApiKey(input.apiKey);
    if (!apiKey || apiKey.trim().length === 0) {
      throw new KalaloError({
        code: "STT_PROVIDER_NOT_CONFIGURED",
        message:
          "Google Gemini API key is not configured. Please enter your personal Gemini API key in Settings (/settings) or add GEMINI_API_KEY to your .env file.",
        retryable: false,
        details: { provider: "gemini" },
      });
    }

    input.onProgress?.({ stage: "inspecting_media", progress: 10 });
    const mediaMeta = await MediaService.inspectMedia(input.inputPath);
    if (!mediaMeta.hasAudio) {
      throw new KalaloError({
        code: "UNSUPPORTED_MEDIA",
        message: "Input media does not contain an audio stream for transcription.",
        retryable: false,
        details: { inputPath: input.inputPath },
      });
    }

    const duration = mediaMeta.durationSeconds > 0 ? mediaMeta.durationSeconds : 1.0;
    const tempDir = ensureDir(env.tempDir);
    const tempAudioPath = path.join(tempDir, `gemini-audio-${crypto.randomUUID()}.mp3`);

    const { localPath, cleanup: cleanupMedia } = await ensureLocalMediaFile(input.inputPath);

    try {
      input.onProgress?.({ stage: "extracting_audio", progress: 20 });
      const ffmpegPath = resolveFfmpegPath();

      // Safely extract audio as lightweight, high-speech-fidelity mono MP3
      await spawnSafe(
        ffmpegPath,
        [
          "-y",
          "-i",
          localPath,
          "-vn",
          "-acodec",
          "libmp3lame",
          "-ac",
          "1",
          "-ar",
          "16000",
          "-b:a",
          "64k",
          tempAudioPath,
        ],
        {
          signal: input.signal,
          timeoutMs: 60000,
        }
      );

      input.onProgress?.({ stage: "uploading_to_gemini", progress: 40 });
      const audioBuffer = await fs.readFile(tempAudioPath);
      const audioBase64 = audioBuffer.toString("base64");

      const model = input.model || SettingsService.getPublicSettings().gemini.model || env.KALALO_GEMINI_MODEL || "gemini-3.5-flash-lite";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      // Language context bias
      let languageInstructions = "Transcribe all spoken words accurately in their original language.";
      if (input.language === "hi") {
        languageInstructions = "The audio is spoken primarily in Hindi. Output captions in clear Devanagari script.";
      } else if (input.language === "en") {
        languageInstructions = "The audio is spoken in English. Output captions in standard English spelling.";
      } else if (input.language === "hinglish") {
        languageInstructions =
          "The audio contains Hinglish (colloquial blend of Hindi and English). Preserve the natural spoken phrasing in Latin/Romanized script exactly as spoken without converting English words to Hindi or vice versa.";
      }

      const prompt = `You are an expert, precision-grade captioning system.
Listen to this audio track and generate exact timestamped subtitle segments for video creators.

ACCURACY RULES:
1. Transcribe ONLY the actual words spoken by speakers.
2. DO NOT hallucinate, invent, or extrapolate dialogue when there is silence, music, laughing, or noise.
3. DO NOT output conversational filler, introductions, or apologies (e.g., "Here is the transcription").
4. Preserve the speaker's exact words, terminology, and colloquial expressions.
5. Split dialogue into short, natural phrases suitable for social media captions (roughly 3 to 8 words per segment).
6. Timestamps must be realistic numerical seconds corresponding accurately to speech pauses.
7. ${languageInstructions}

Return ONLY a structured JSON array of subtitle segments.`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: "audio/mp3",
                  data: audioBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                start: { type: "NUMBER" },
                end: { type: "NUMBER" },
                text: { type: "STRING" },
                language: { type: "STRING" },
              },
              required: ["start", "end", "text"],
            },
          },
        },
      };

      input.onProgress?.({ stage: "generating_captions", progress: 65 });

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: input.signal,
      });

      const responseJson = (await res.json()) as any;

      if (!res.ok) {
        const errorMsg =
          responseJson.error?.message || `Google Gemini API returned HTTP ${res.status}`;
        if (res.status === 404) {
          throw new KalaloError({
            code: "MODEL_NOT_FOUND",
            message: `Gemini model "${model}" is not found or is no longer supported on API v1beta. Please update your model to "gemini-3.5-flash-lite" in Settings (/settings).`,
            retryable: false,
            details: { model, error: responseJson.error },
          });
        }
        if (res.status === 503) {
          throw new KalaloError({
            code: "SERVICE_UNAVAILABLE",
            message: `Google Gemini servers are temporarily experiencing high demand on "${model}". Spikes in demand are temporary. Please retry in a few moments or switch to "gemini-3.5-flash-lite" in Settings.`,
            retryable: true,
            details: { model, error: responseJson.error },
          });
        }
        if (res.status === 400 || res.status === 403) {
          throw new KalaloError({
            code: "INVALID_CREDENTIALS",
            message: `Gemini API authentication failed: ${errorMsg}. Check your API key in Settings.`,
            retryable: false,
            details: { status: res.status, error: responseJson.error },
          });
        }
        if (res.status === 429) {
          throw new KalaloError({
            code: "RATE_LIMITED",
            message: `Gemini API quota or rate limit exceeded: ${errorMsg}`,
            retryable: true,
            details: { status: res.status, error: responseJson.error },
          });
        }
        throw new KalaloError({
          code: "TRANSCRIPTION_FAILED",
          message: `Gemini transcription failed: ${errorMsg}`,
          retryable: false,
          details: { error: responseJson.error },
        });
      }

      input.onProgress?.({ stage: "validating_segments", progress: 85 });

      const candidate = responseJson.candidates?.[0];
      const textOutput = candidate?.content?.parts?.[0]?.text;

      if (!textOutput) {
        throw new KalaloError({
          code: "TRANSCRIPTION_FAILED",
          message: "Gemini did not return any transcription content.",
          retryable: false,
        });
      }

      let parsedSegments: RawGeminiSegment[] = [];
      try {
        parsedSegments = JSON.parse(textOutput);
      } catch (parseErr) {
        throw new KalaloError({
          code: "TRANSCRIPTION_FAILED",
          message: `Failed to parse structured JSON from Gemini response: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
          retryable: false,
          details: { rawText: textOutput.slice(0, 500) },
        });
      }

      if (!Array.isArray(parsedSegments) || parsedSegments.length === 0) {
        // No speech detected in audio
        return {
          segments: [],
          detectedLanguage: input.language === "auto" ? "en" : input.language,
          provider: "gemini",
        };
      }

      // Format segments into canonical Kalalo segments
      const formatted: CaptionSegment[] = parsedSegments.map((item, idx) => ({
        id: `gemini-seg-${idx + 1}-${crypto.randomUUID().slice(0, 6)}`,
        start: Math.max(0, parseFloat(item.start.toFixed(2))),
        end: Math.min(duration, Math.max(item.start + 0.1, parseFloat(item.end.toFixed(2)))),
        text: (item.text || "").trim(),
        language: (item.language as SupportedLanguage) || (input.language !== "auto" ? input.language : "en"),
        confidence: 0.98,
      }));

      // Validate through canonical CaptionsService
      const validSegments = CaptionsService.ensureValid(formatted, duration);

      input.onProgress?.({ stage: "completed", progress: 100 });

      return {
        segments: validSegments,
        detectedLanguage: validSegments[0]?.language || (input.language !== "auto" ? input.language : "en"),
        provider: "gemini",
      };
    } finally {
      // Ensure temp audio file cleanup
      await fs.unlink(tempAudioPath).catch(() => {});
      await cleanupMedia();
    }
  }
}
