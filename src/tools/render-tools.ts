import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { aspectRatioSchema } from "../schemas/common.schema.js";
import { JobsService } from "../services/jobs.service.js";
import { RenderingService, RenderResult } from "../services/rendering.service.js";
import { KalaloError } from "../utils/errors.js";

export function registerRenderTools(server: McpServer): void {
  server.tool(
    "kalalo_render_captions",
    "Render styled captions directly onto a video using FFmpeg with aspect-ratio letterboxing, ASS burn-in, and real progress tracking.",
    {
      inputPath: z.string().describe("Path to source input video"),
      outputPath: z.string().describe("Path to destination rendered video"),
      segments: z
        .union([z.array(z.record(z.unknown())), z.string()])
        .describe("Array of caption segments, or a prior transcription jobId / JSON string"),
      presetId: z.string().describe("Original styling preset identifier (e.g. 'kalalo-clean-bold')"),
      aspectRatio: aspectRatioSchema.default("9:16").describe("Target aspect ratio ('9:16', '1:1', or '16:9')"),
      burnIn: z.boolean().default(true).describe("Whether to burn subtitles permanently into the video stream"),
      jobId: z.string().optional().describe("Optional existing job ID to associate with this render task"),
    },
    async ({ inputPath, outputPath, segments, presetId, aspectRatio, burnIn: _, jobId }) => {
      let resolvedSegments: unknown[] = [];

      if (typeof segments === "string") {
        const trimmed = segments.trim();
        // Check if string is a job ID referencing a completed transcription job
        try {
          const priorJob = JobsService.getJob<{ segments?: unknown[] }>(trimmed);
          if (priorJob?.result?.segments && Array.isArray(priorJob.result.segments)) {
            resolvedSegments = priorJob.result.segments;
          }
        } catch {
          // If not a job ID, attempt JSON parse
          try {
            resolvedSegments = JSON.parse(trimmed);
          } catch {
            throw new KalaloError({
              code: "INVALID_INPUT",
              message: `Could not resolve segments from string "${trimmed}". Must be a valid JSON array or completed jobId.`,
              retryable: false,
            });
          }
        }
      } else {
        resolvedSegments = segments;
      }

      const job = JobsService.createJob<RenderResult>("rendering", jobId);

      try {
        JobsService.startJob(job.id, "rendering");
        const signal = JobsService.getJobSignal(job.id);

        const result = await RenderingService.renderCaptions({
          inputPath,
          outputPath,
          segments: resolvedSegments,
          presetId,
          aspectRatio,
          signal,
          onProgress: (p) => {
            JobsService.updateProgress(job.id, p.progress, p.stage);
          },
        });

        const completed = JobsService.completeJob(job.id, result, "render_completed");

        const response = {
          jobId: completed.id,
          status: completed.status,
          outputPath: result.outputPath,
          progress: 100,
          message: `Captions rendered successfully to ${result.outputPath} (${result.width}x${result.height}, ${result.aspectRatio})`,
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
                code: "RENDER_FAILED",
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
