import { describe, it, expect, beforeAll } from "vitest";
import path from "node:path";
import fs from "node:fs";
import { MediaService } from "../src/services/media.service.js";
import { spawnSafe, resolveFfmpegPath } from "../src/utils/process.js";
import { ensureDir } from "../src/utils/paths.js";

const FIXTURES_DIR = path.resolve(process.cwd(), "tmp", "test-fixtures");
const TEST_VIDEO_PATH = path.join(FIXTURES_DIR, "test-sample.mp4");

describe("MediaService and FFprobe inspection", () => {
  beforeAll(async () => {
    ensureDir(FIXTURES_DIR);
    const ffmpegPath = resolveFfmpegPath();

    // Generate a 1.5 second valid mp4 clip with video and audio streams
    // Using lavfi synthetic sources: testsrc for video, sine for audio
    if (!fs.existsSync(TEST_VIDEO_PATH)) {
      await spawnSafe(
        ffmpegPath,
        [
          "-y",
          "-f",
          "lavfi",
          "-i",
          "testsrc=duration=1.5:size=320x240:rate=25",
          "-f",
          "lavfi",
          "-i",
          "sine=frequency=1000:duration=1.5",
          "-c:v",
          "libx264",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "aac",
          TEST_VIDEO_PATH,
        ],
        { timeoutMs: 15000 }
      );
    }
  });

  it("inspects a valid media file and extracts real metadata", async () => {
    const meta = await MediaService.inspectMedia(TEST_VIDEO_PATH);

    expect(meta.hasVideo).toBe(true);
    expect(meta.hasAudio).toBe(true);
    expect(meta.durationSeconds).toBeGreaterThan(1.0);
    expect(meta.durationSeconds).toBeLessThanOrEqual(2.0);

    expect(meta.video).toBeDefined();
    expect(meta.video?.width).toBe(320);
    expect(meta.video?.height).toBe(240);
    expect(meta.video?.codec).toContain("h264");

    expect(meta.audio).toBeDefined();
    expect(meta.audio?.codec).toContain("aac");
  });

  it("throws MEDIA_NOT_FOUND when inspecting a non-existent file", async () => {
    const nonExistent = path.join(FIXTURES_DIR, "non-existent.mp4");
    await expect(MediaService.inspectMedia(nonExistent)).rejects.toThrow("Media file does not exist");
  });

  it("throws INVALID_INPUT when given an empty path", async () => {
    await expect(MediaService.inspectMedia("")).rejects.toThrow("non-empty string");
  });
});
