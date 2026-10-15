import { CaptionSegment, SupportedLanguage } from "../../types/index.js";
import { MediaService } from "../media.service.js";
import { KalaloError } from "../../utils/errors.js";
import {
  TranscriptionInput,
  TranscriptionProvider,
  TranscriptionResult,
} from "./provider.interface.js";

export class MockTranscriptionProvider implements TranscriptionProvider {
  public readonly name = "mock";

  public async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    if (input.signal?.aborted) {
      throw new KalaloError({
        code: "PROCESS_CANCELLED",
        message: "Transcription was cancelled",
        retryable: true,
      });
    }

    input.onProgress?.({ stage: "inspecting_media", progress: 10 });
    const meta = await MediaService.inspectMedia(input.inputPath);

    if (input.signal?.aborted) {
      throw new KalaloError({
        code: "PROCESS_CANCELLED",
        message: "Transcription was cancelled",
        retryable: true,
      });
    }

    input.onProgress?.({ stage: "transcribing", progress: 50 });

    const duration = meta.durationSeconds > 0 ? meta.durationSeconds : 6.0;
    const lang = input.language === "auto" ? "hinglish" : input.language;

    // Segment templates tailored to Hindi, Hinglish, and English
    const mockTexts: Record<SupportedLanguage, string[]> = {
      hinglish: [
        "[Mock] Kalalo AI captioning server mein aapka swagat hai!",
        "[Mock] Aaj hum Hinglish aur Hindi subtitles generate karenge.",
        "[Mock] Creators ke liye fast, precise, and beautiful subtitles.",
      ],
      hi: [
        "[Mock] कलालो एआई कैप्शनिंग सर्वर में आपका स्वागत है।",
        "[Mock] यह पूर्ण रूप से देवनागरी लिपि का समर्थन करता है।",
        "[Mock] सुंदर और पठनीय सबटाइटल बनाएँ।",
      ],
      en: [
        "[Mock] Welcome to Kalalo AI captioning server!",
        "[Mock] Real-time, timestamped subtitles for creators.",
        "[Mock] Fully automated styling and video rendering.",
      ],
    };

    const targetList = mockTexts[lang as SupportedLanguage] || mockTexts.hinglish;
    const segmentCount = targetList.length;
    const segmentDuration = duration / segmentCount;

    const segments: CaptionSegment[] = [];

    for (let i = 0; i < segmentCount; i++) {
      if (input.signal?.aborted) {
        throw new KalaloError({
          code: "PROCESS_CANCELLED",
          message: "Transcription was cancelled during segmentation",
          retryable: true,
        });
      }

      const start = Math.round(i * segmentDuration * 100) / 100;
      // Leave a tiny 0.05s buffer before the next segment to avoid overlap
      const end = Math.min(
        duration,
        Math.round(((i + 1) * segmentDuration - 0.05) * 100) / 100
      );

      segments.push({
        id: `mock-seg-${i + 1}`,
        start,
        end: end > start ? end : start + 0.5,
        text: targetList[i],
        language: lang as SupportedLanguage,
        confidence: 0.96,
      });
    }

    input.onProgress?.({ stage: "completed", progress: 100 });

    return {
      segments,
      detectedLanguage: lang,
      provider: "mock",
    };
  }
}
