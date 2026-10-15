import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMediaTools } from "./media-tools.js";
import { registerTranscriptionTools } from "./transcription-tools.js";
import { registerCaptionTools } from "./caption-tools.js";
import { registerRenderTools } from "./render-tools.js";
import { registerJobTools } from "./job-tools.js";

export function registerAllTools(server: McpServer): void {
  registerMediaTools(server);
  registerTranscriptionTools(server);
  registerCaptionTools(server);
  registerRenderTools(server);
  registerJobTools(server);
}
