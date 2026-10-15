import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import fs from "node:fs";
import { MediaService } from "../src/services/media.service.js";
import { spawnSafe, resolveFfmpegPath } from "../src/utils/process.js";
import { ensureDir } from "../src/utils/paths.js";

const FIXTURES_DIR = path.resolve(process.cwd(), "tmp", "test-fixtures");
const TEST_VIDEO = path.join(FIXTURES_DIR, "audio-extract-input.mp4");
const TEST_AUDIO_MP3 = path.join(FIXTURES_DIR, "extracted-test.mp3");

describe("Audio Extraction Service", () => {
  beforeAll(async () => {
    ensureDir(FIXTURES_DIR);
    const ffmpegPath = resolveFfmpegPath();

    if (!fs.existsSync(TEST_VIDEO)) {
      await spawnSafe(
        ffmpegPath,
        [
          "-y",
          "-f",
          "lavfi",
          "-i",
          "testsrc=duration=1.0:size=320x240:rate=25",
          "-f",
          "lavfi",
          "-i",
          "sine=frequency=1000:duration=1.0",
          "-c:v",
          "libx264",
          "-c:a",
          "aac",
          TEST_VIDEO,
        ],
        { timeoutMs: 15000 }
      );
    }
  });

  afterAll(async () => {
    if (fs.existsSync(TEST_AUDIO_MP3)) {
      try {
        await fs.promises.unlink(TEST_AUDIO_MP3);
      } catch {}
    }
  });

  it("extracts audio track to MP3 and verifies with FFprobe", async () => {
    const ffmpegPath = resolveFfmpegPath();
    const args = ["-y", "-i", TEST_VIDEO, "-vn", "-acodec", "libmp3lame", "-b:a", "192k", TEST_AUDIO_MP3];
    const { exitCode, stderr } = await spawnSafe(ffmpegPath, args, { timeoutMs: 20000 });

    expect(exitCode).toBe(0);
    expect(fs.existsSync(TEST_AUDIO_MP3)).toBe(true);

    const meta = await MediaService.inspectMedia(TEST_AUDIO_MP3);
    expect(meta.hasAudio).toBe(true);
    expect(meta.hasVideo).toBe(false);
    expect(meta.audio?.codec).toBe("mp3");
    expect(meta.durationSeconds).toBeGreaterThan(0.8);
  });
});
