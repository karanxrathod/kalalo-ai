import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MediaService } from "../services/media.service.js";
import { KalaloError } from "../utils/errors.js";

export function registerMediaTools(server: McpServer): void {
  server.tool(
    "kalalo_inspect_media",
    "Inspect a video or audio file to retrieve real media metadata, streams, duration, and dimensions using FFprobe.",
    {
      inputPath: z.string().describe("Absolute or relative path to the media file to inspect"),
    },
    async ({ inputPath }) => {
      try {
        const metadata = await MediaService.inspectMedia(inputPath);
        const response = {
          media: metadata,
          video: metadata.video,
          audio: metadata.audio,
          durationSeconds: metadata.durationSeconds,
          hasAudio: metadata.hasAudio,
          hasVideo: metadata.hasVideo,
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
        const kalaloErr =
          err instanceof KalaloError
            ? err
            : new KalaloError({
                code: "UNSUPPORTED_MEDIA",
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
