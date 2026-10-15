import fs from "node:fs";
import { Blob } from "node:buffer";
import { CaptionSegment, SupportedLanguage } from "../../types/index.js";
import { KalaloError } from "../../utils/errors.js";
import { env } from "../../config/env.js";
import {
  TranscriptionInput,
  TranscriptionProvider,
  TranscriptionResult,
} from "./provider.interface.js";

export class OpenAITranscriptionProvider implements TranscriptionProvider {
  public readonly name = "openai";

  public async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      throw new KalaloError({
        code: "STT_PROVIDER_NOT_CONFIGURED",
        message: "OPENAI_API_KEY environment variable is missing. Configure it in your .env or environment to use OpenAI transcription.",
        retryable: false,
      });
    }

    if (input.signal?.aborted) {
      throw new KalaloError({
        code: "PROCESS_CANCELLED",
        message: "Transcription was cancelled",
        retryable: true,
      });
    }

    input.onProgress?.({ stage: "preparing_audio", progress: 15 });

    const fileBuffer = await fs.promises.readFile(input.inputPath);
    const fileBlob = new Blob([fileBuffer]);

    const formData = new FormData();
    formData.append("file", fileBlob as any, "media.mp3");
    formData.append("model", env.KALALO_STT_MODEL || "whisper-1");
    formData.append("response_format", "verbose_json");

    if (input.language === "hi") {
      formData.append("language", "hi");
    } else if (input.language === "en") {
      formData.append("language", "en");
    } else if (input.language === "hinglish") {
      // Prompt Whisper with Hinglish context to bias token generation toward Romanized Hindi / mixed Hindi-English
      formData.append(
        "prompt",
        "Aapka swagat hai, ye conversation Hinglish aur Hindi mein hai. Please preserve Hindi and English phrases naturally."
      );
    }

    input.onProgress?.({ stage: "uploading_and_transcribing", progress: 40 });

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: formData,
      signal: input.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new KalaloError({
        code: "STT_PROVIDER_ERROR",
        message: `OpenAI transcription failed with HTTP ${response.status}: ${errText}`,
        retryable: response.status >= 500,
        details: { status: response.status },
      });
    }

    const data = (await response.json()) as {
      text: string;
      language?: string;
      segments?: Array<{
        id: number;
        start: number;
        end: number;
        text: string;
      }>;
    };

    input.onProgress?.({ stage: "normalizing_segments", progress: 85 });

    const rawSegments = data.segments || [];
    const segments: CaptionSegment[] = [];

    rawSegments.forEach((seg, idx) => {
      const cleanText = seg.text?.trim();
      if (!cleanText) return;

      const start = Math.max(0, seg.start);
      const end = seg.end > start ? seg.end : start + 0.5;

      segments.push({
        id: `seg-${seg.id ?? idx + 1}`,
        start: Math.round(start * 100) / 100,
        end: Math.round(end * 100) / 100,
        text: cleanText,
        language: (input.language !== "auto" ? input.language : undefined) as SupportedLanguage | undefined,
        confidence: 0.95,
      });
    });

    input.onProgress?.({ stage: "completed", progress: 100 });

    return {
      segments,
      detectedLanguage: data.language,
      provider: "openai",
    };
  }
}
