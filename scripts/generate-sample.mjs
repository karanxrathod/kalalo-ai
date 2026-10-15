import fs from "node:fs";
import path from "node:path";
import { spawnSafe, resolveFfmpegPath, resolveFfprobePath } from "../dist/utils/process.js";
import { ensureDir } from "../dist/utils/paths.js";
import { MediaService } from "../dist/services/media.service.js";

async function main() {
  console.log("[Sample Generator] Starting sample video generation...");

  const ffmpegPath = resolveFfmpegPath();
  const ffprobePath = resolveFfprobePath();

  console.log(`[Sample Generator] FFmpeg binary:  ${ffmpegPath}`);
  console.log(`[Sample Generator] FFprobe binary: ${ffprobePath}`);

  if (!fs.existsSync(ffmpegPath)) {
    throw new Error(`FFmpeg binary not found at: ${ffmpegPath}`);
  }
  if (!fs.existsSync(ffprobePath)) {
    throw new Error(`FFprobe binary not found at: ${ffprobePath}`);
  }

  const samplesDir = path.resolve(process.cwd(), "samples");
  ensureDir(samplesDir);

  const samplePath = path.join(samplesDir, "sample-video.mp4");

  const speechWavPath = path.join(samplesDir, "speech-sample.wav");
  let args = [];

  if (fs.existsSync(speechWavPath)) {
    console.log(`[Sample Generator] Using real spoken audio from: ${speechWavPath}`);
    args = [
      "-y",
      "-f", "lavfi", "-i", "testsrc=duration=5.4:size=720x1280:rate=25",
      "-i", speechWavPath,
      "-c:v", "libx264", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "128k",
      "-shortest",
      samplePath
    ];
  } else {
    // Fallback: 2.0s valid MP4 with H.264 video testsrc (640x360, 25fps) and AAC 1kHz sine audio
    console.log(`[Sample Generator] Generating video to: ${samplePath}`);
    args = [
      "-y",
      "-f", "lavfi", "-i", "testsrc=duration=2.0:size=640x360:rate=25",
      "-f", "lavfi", "-i", "sine=frequency=1000:duration=2.0",
      "-c:v", "libx264", "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      samplePath
    ];
  }

  const result = await spawnSafe(ffmpegPath, args, { timeoutMs: 30000 });
  if (result.exitCode !== 0) {
    throw new Error(`FFmpeg failed with exit code ${result.exitCode}: ${result.stderr}`);
  }

  if (!fs.existsSync(samplePath)) {
    throw new Error(`Generated file does not exist at: ${samplePath}`);
  }

  const stats = fs.statSync(samplePath);
  console.log(`[Sample Generator] Generated file size: ${stats.size} bytes`);
  if (stats.size === 0) {
    throw new Error(`Generated file is 0 bytes`);
  }

  // Verify using MediaService / FFprobe
  console.log(`[Sample Generator] Verifying file streams with FFprobe...`);
  const meta = await MediaService.inspectMedia(samplePath);
  console.log(`[Sample Generator] Verification Success!`);
  console.log(`- Format:   ${meta.format}`);
  console.log(`- Duration: ${meta.durationSeconds}s`);
  console.log(`- Video:    ${meta.hasVideo ? `${meta.video?.codec} (${meta.video?.width}x${meta.video?.height} @ ${meta.video?.fps}fps)` : "None"}`);
  console.log(`- Audio:    ${meta.hasAudio ? `${meta.audio?.codec} (${meta.audio?.channels}ch, ${meta.audio?.sampleRate}Hz)` : "None"}`);
}

main().catch((err) => {
  console.error(`[Sample Generator Error]`, err);
  process.exit(1);
});
