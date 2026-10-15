import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { aspectRatioSchema, supportedLanguageSchema } from "../schemas/common.schema.js";
import { CaptionsService } from "../services/captions.service.js";
import { PresetsService } from "../presets/presets.js";
import { SubtitleExportService } from "../services/subtitle-export.service.js";
import { KalaloError } from "../utils/errors.js";

export function registerCaptionTools(server: McpServer): void {
  // 1. kalalo_validate_segments
  server.tool(
    "kalalo_validate_segments",
    "Validate and normalize supplied caption segments against canonical timing, ordering, overlap, and media duration rules.",
    {
      segments: z.array(z.record(z.unknown())).describe("Array of caption segment objects to validate"),
      durationSeconds: z
        .number()
        .positive()
        .optional()
        .describe("Optional media duration in seconds to check boundary limits"),
    },
    async ({ segments, durationSeconds }) => {
      const result = CaptionsService.validateSegments(segments, durationSeconds);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // 2. kalalo_list_presets
  server.tool(
    "kalalo_list_presets",
    "List original caption styling presets, optionally filtered by aspect ratio or target language.",
    {
      format: aspectRatioSchema.optional().describe("Optional aspect ratio filter: '9:16', '1:1', or '16:9'"),
      language: supportedLanguageSchema
        .optional()
        .describe("Optional language filter: 'hinglish', 'hi', or 'en'"),
    },
    async ({ format, language }) => {
      const presets = PresetsService.listPresets({ format, language });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ presets }, null, 2),
          },
        ],
      };
    }
  );

  // 3. kalalo_export_subtitles
  server.tool(
    "kalalo_export_subtitles",
    "Export caption segments as standards-compliant SRT or WebVTT files, or return raw subtitle text.",
    {
      segments: z.array(z.record(z.unknown())).describe("Array of validated caption segments"),
      format: z.enum(["srt", "vtt"]).describe("Target subtitle format ('srt' or 'vtt')"),
      outputPath: z.string().optional().describe("Optional destination file path on disk"),
    },
    async ({ segments, format, outputPath }) => {
      try {
        const result = await SubtitleExportService.exportSubtitles(segments, format, outputPath);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err) {
        const kalaloErr =
          err instanceof KalaloError
            ? err
            : new KalaloError({
                code: "INVALID_SEGMENTS",
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
