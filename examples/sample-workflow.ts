/**
 * Example Workflow: Kalalo AI Captioning
 * Demonstrates inspecting media, generating mock or OpenAI subtitles,
 * exporting SRT/VTT, and rendering vertical 9:16 captions with FFmpeg.
 */
import path from "node:path";
import { MediaService } from "../src/services/media.service.js";
import { ProviderFactory } from "../src/services/transcription/provider.factory.js";
import { SubtitleExportService } from "../src/services/subtitle-export.service.js";
import { PresetsService } from "../src/presets/presets.js";
import { RenderingService } from "../src/services/rendering.service.js";

async function runDemo() {
  const inputVideo = path.resolve("./tmp/test-fixtures/mcp-test-sample.mp4");
  const outputVideo = path.resolve("./output/demo-captioned.mp4");

  console.log("1. Inspecting Media...");
  const meta = await MediaService.inspectMedia(inputVideo);
  console.log(`- Format: ${meta.format}, Duration: ${meta.durationSeconds}s, Video: ${meta.hasVideo}`);

  console.log("\n2. Transcribing with Mock Provider...");
  const provider = ProviderFactory.getProvider("mock");
  const result = await provider.transcribe({
    inputPath: inputVideo,
    language: "hinglish",
    onProgress: (p: { stage?: string; progress?: number }) => console.log(`  [Progress] ${p.stage}: ${p.progress}%`),
  });
  console.log(`- Detected language: ${result.detectedLanguage}, Segments count: ${result.segments.length}`);

  console.log("\n3. Exporting Subtitles...");
  const srtExport = await SubtitleExportService.exportSubtitles(result.segments, "srt");
  console.log("- SRT Sample:\n" + srtExport.content.trim());

  console.log("\n4. Listing Presets...");
  const presets = PresetsService.listPresets({ format: "9:16" });
  console.log(`- Available 9:16 Presets: ${presets.map((p) => p.id).join(", ")}`);

  console.log("\n5. Rendering Captions (9:16 portrait)...");
  const renderRes = await RenderingService.renderCaptions({
    inputPath: inputVideo,
    outputPath: outputVideo,
    segments: result.segments,
    presetId: "kalalo-clean-bold",
    aspectRatio: "9:16",
    onProgress: (p) => console.log(`  [Rendering] ${p.stage}: ${p.progress}%`),
  });
  console.log(`- Render completed successfully: ${renderRes.outputPath}`);
}

runDemo().catch(console.error);
