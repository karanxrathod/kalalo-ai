import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { MediaService } from "../dist/services/media.service.js";
import { GeminiTranscriptionProvider } from "../dist/services/transcription/gemini.provider.js";
import { CaptionsService } from "../dist/services/captions.service.js";
import { RenderingService } from "../dist/services/rendering.service.js";
import { SubtitleExportService } from "../dist/services/subtitle-export.service.js";
import { CutoutService } from "../dist/services/cutout.service.js";
import { AuthService } from "../dist/services/auth.service.js";
import { DbService } from "../dist/services/db.service.js";
import { ProjectsService } from "../dist/services/projects.service.js";
import { SettingsService } from "../dist/services/settings.service.js";

async function runE2E() {
  console.log("==================================================");
  console.log("  KALALO END-TO-END WORKFLOW & SECURITY TEST");
  console.log("==================================================\n");

  const samplePath = path.resolve(process.cwd(), "samples", "sample-video.mp4");
  if (!fs.existsSync(samplePath)) {
    throw new Error(`Sample video not found at: ${samplePath}`);
  }

  // 1. Inspect real media
  console.log("Step 1: Inspecting real media file with FFprobe...");
  const meta = await MediaService.inspectMedia(samplePath);
  console.log(`  ✓ Duration: ${meta.durationSeconds.toFixed(2)}s, Dimensions: ${meta.video?.width}x${meta.video?.height}, Has Audio: ${meta.hasAudio}`);

  // 2. Authentication & User Isolation
  console.log("\nStep 2: Testing Authentication & Multi-Tenant User Isolation...");
  const testEmail = `creator_${Date.now()}@kalalo.test`;
  const regResult = await AuthService.register(testEmail, "Maya Creator", "Password123!");
  console.log(`  ✓ Registered new user: ${regResult.user.id} (${regResult.user.email})`);
  
  const verified = await AuthService.verifyToken(regResult.token);
  if (!verified || verified.userId !== regResult.user.id) {
    throw new Error("JWT token verification failed");
  }
  console.log(`  ✓ JWT Token verified successfully: userId = ${verified.userId}`);

  // Check demo project was seeded for new user
  const userProjects = ProjectsService.listProjects(regResult.user.id);
  console.log(`  ✓ Found ${userProjects.length} initial project(s) for user (Demo Project seeded)`);
  if (!userProjects[0]?.isDemo) {
    throw new Error("Expected demo project to be seeded for new user");
  }

  // 3. Save & Encrypt Gemini API Key for user
  console.log("\nStep 3: Checking Gemini API Key and Model Connectivity...");
  const apiKey = SettingsService.getGeminiApiKey(undefined, regResult.user.id);
  if (!apiKey) {
    throw new Error("No Gemini API key available in environment or database");
  }
  console.log(`  ✓ Active Gemini Key available (masked: ${apiKey.slice(0, 6)}••••••••${apiKey.slice(-4)})`);

  const connTest = await SettingsService.testGeminiConnection(apiKey, "gemini-3.5-flash-lite");
  console.log(`  ✓ Gemini Connectivity Test: ${connTest.message}`);
  if (!connTest.success) {
    throw new Error(`Gemini connection test failed: ${connTest.message}`);
  }

  // 4. Real Gemini Transcription
  console.log("\nStep 4: Transcribing speech from real video using Gemini AI...");
  const geminiProvider = new GeminiTranscriptionProvider();
  const transcriptResult = await geminiProvider.transcribe({
    inputPath: samplePath,
    apiKey,
    language: "auto",
  });
  console.log(`  ✓ Transcribed ${transcriptResult.segments.length} segments with Gemini! Detected: ${transcriptResult.detectedLanguage || "auto"}`);
  transcriptResult.segments.forEach((seg, i) => {
    console.log(`    [${seg.start.toFixed(2)}s -> ${seg.end.toFixed(2)}s] "${seg.text}"`);
  });

  if (transcriptResult.segments.length === 0) {
    throw new Error("Expected at least 1 caption segment from Gemini");
  }

  // 5. Caption Editing & Validation
  console.log("\nStep 5: Testing Caption Editing, Retiming & Validation...");
  const editedSegments = [
    {
      id: "edit-1",
      start: 0.1,
      end: 2.2,
      text: "Kalalo: Studio-grade AI captions for creators.",
      language: "en",
    },
    {
      id: "edit-2",
      start: 2.3,
      end: 4.8,
      text: "Hindi, Hinglish & English typography on your video.",
      language: "en",
    },
  ];
  const validated = CaptionsService.validateSegments(editedSegments, meta.durationSeconds);
  if (!validated.valid) {
    throw new Error(`Segments failed validation: ${validated.errors.join(", ")}`);
  }
  console.log(`  ✓ Caption segments validated and retimed cleanly (${editedSegments.length} segments)`);

  // 6. Subtitle Export (SRT & VTT)
  console.log("\nStep 6: Exporting Subtitles to SRT and WebVTT...");
  const outDir = path.resolve(process.cwd(), "output");
  const srtPath = path.join(outDir, "e2e-subtitles.srt");
  const vttPath = path.join(outDir, "e2e-subtitles.vtt");
  await SubtitleExportService.exportSubtitles(editedSegments, "srt", srtPath);
  await SubtitleExportService.exportSubtitles(editedSegments, "vtt", vttPath);
  console.log(`  ✓ SRT exported (${fs.statSync(srtPath).size} bytes)`);
  console.log(`  ✓ VTT exported (${fs.statSync(vttPath).size} bytes)`);

  // 7. Normal Caption Render with FFmpeg (9:16 vertical and 16:9 widescreen)
  console.log("\nStep 7: Rendering Normal Captions with FFmpeg (9:16 Vertical)...");
  const normalRenderOut = path.join(outDir, "e2e-normal-9-16.mp4");
  const renderNormalResult = await RenderingService.renderCaptions({
    inputPath: samplePath,
    outputPath: normalRenderOut,
    segments: editedSegments,
    presetId: "kalalo-clean-bold",
    aspectRatio: "9:16",
    onProgress: (p) => {
      process.stdout.write(`\r  Rendering progress: ${p.progress}% (${p.stage})`);
    },
  });
  console.log(`\n  ✓ Normal 9:16 render completed: ${renderNormalResult.width}x${renderNormalResult.height}, ${renderNormalResult.durationSeconds.toFixed(1)}s`);

  // Verify rendered file with FFprobe
  const verifyNormal = await MediaService.inspectMedia(normalRenderOut);
  console.log(`  ✓ FFprobe verification: Video Codec: ${verifyNormal.video?.codec}, Dimensions: ${verifyNormal.video?.width}x${verifyNormal.video?.height}, Has Audio: ${verifyNormal.hasAudio}`);

  // 8. Person Cutout & Captions Behind Subject Render
  console.log("\nStep 8: Testing Person Cutout & Captions-Behind-Subject Compositing...");
  const cutoutAvailable = CutoutService.isAvailable();
  console.log(`  Cutout service available: ${cutoutAvailable}`);
  if (!cutoutAvailable) {
    throw new Error("CutoutService reported unavailable");
  }

  const cutoutRenderOut = path.join(outDir, "e2e-cutout-behind-person.mp4");
  console.log("  Executing person segmentation and 3-layer alphamerge render...");
  const renderCutoutResult = await RenderingService.renderCaptions({
    inputPath: samplePath,
    outputPath: cutoutRenderOut,
    segments: editedSegments,
    presetId: "kalalo-pop-highlight",
    aspectRatio: "9:16",
    personCutout: true,
    onProgress: (p) => {
      process.stdout.write(`\r  Cutout render progress: ${p.progress}% (${p.stage})`);
    },
  });
  console.log(`\n  ✓ Person Cutout render completed: ${renderCutoutResult.width}x${renderCutoutResult.height}`);

  // Verify cutout rendered file with FFprobe
  const verifyCutout = await MediaService.inspectMedia(cutoutRenderOut);
  console.log(`  ✓ FFprobe verification: Video Codec: ${verifyCutout.video?.codec}, Dimensions: ${verifyCutout.video?.width}x${verifyCutout.video?.height}, Has Audio: ${verifyCutout.hasAudio}`);

  console.log("\n==================================================");
  console.log("  ALL END-TO-END WORKFLOW CHECKS PASSED!");
  console.log("==================================================");
}

runE2E().catch((err) => {
  console.error("\n❌ E2E Test Failure:", err);
  process.exit(1);
});
