import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { transcriptionLanguageSchema } from "../schemas/common.schema.js";
import { JobsService } from "../services/jobs.service.js";
import { ProviderFactory } from "../services/transcription/provider.factory.js";
import { KalaloError } from "../utils/errors.js";
import { CaptionSegment } from "../types/index.js";

export function registerTranscriptionTools(server: McpServer): void {
  server.tool(
    "kalalo_transcribe_media",
    "Transcribe speech in an audio or video file into timestamped caption segments. Supports Hinglish, Hindi, English, and auto-detection.",
    {
      inputPath: z.string().describe("Path to audio or video file to transcribe"),
      language: transcriptionLanguageSchema
        .default("auto")
        .describe("Language preference: 'auto', 'hinglish', 'hi', or 'en'"),
      provider: z.string().optional().describe("Transcription provider override (e.g. 'mock' or 'openai')"),
      jobId: z.string().optional().describe("Optional existing job ID to associate with this task"),
    },
    async ({ inputPath, language, provider, jobId }) => {
      const job = JobsService.createJob<{ segments: CaptionSegment[]; detectedLanguage?: string }>(
        "transcription",
        jobId
      );

      try {
        JobsService.startJob(job.id, "transcribing");
        const signal = JobsService.getJobSignal(job.id);
        const sttProvider = ProviderFactory.getProvider(provider);

        const result = await sttProvider.transcribe({
          inputPath,
          language,
          signal,
          onProgress: (p: { stage?: string; progress?: number }) => {
            if (p.progress !== undefined) {
              JobsService.updateProgress(job.id, p.progress, p.stage);
            }
          },
        });

        const completed = JobsService.completeJob(job.id, {
          segments: result.segments,
          detectedLanguage: result.detectedLanguage,
        });

        const response = {
          jobId: completed.id,
          status: completed.status,
          segments: result.segments,
          detectedLanguage: result.detectedLanguage,
          message: `Transcription completed successfully with ${result.segments.length} segments using provider '${result.provider}'`,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (err) {
        JobsService.failJob(job.id, err instanceof Error ? err : new Error(String(err)));

        const kalaloErr =
          err instanceof KalaloError
            ? err
            : new KalaloError({
                code: "STT_PROVIDER_ERROR",
                message: err instanceof Error ? err.message : String(err),
                retryable: false,
              });

        return {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify(kalaloErr.toJSON(), null, 2),
            },
          ],
        };
      }
    }
  );
}
