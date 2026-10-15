import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import fs from "node:fs";
import { RenderingService } from "../src/services/rendering.service.js";
import { MediaService } from "../src/services/media.service.js";
import { spawnSafe, resolveFfmpegPath } from "../src/utils/process.js";
import { ensureDir } from "../src/utils/paths.js";
import { CaptionSegment } from "../src/types/index.js";

const FIXTURES_DIR = path.resolve(process.cwd(), "tmp", "test-fixtures");
const INPUT_VIDEO_PATH = path.join(FIXTURES_DIR, "render-test-input.mp4");
const OUTPUT_VIDEO_PATH = path.join(FIXTURES_DIR, "render-test-output.mp4");

describe("RenderingService FFmpeg Integration", () => {
  beforeAll(async () => {
    ensureDir(FIXTURES_DIR);
    const ffmpegPath = resolveFfmpegPath();

    if (!fs.existsSync(INPUT_VIDEO_PATH)) {
      await spawnSafe(
        ffmpegPath,
        [
          "-y",
          "-f",
          "lavfi",
          "-i",
          "testsrc=duration=1.2:size=320x240:rate=25",
          "-f",
          "lavfi",
          "-i",
          "sine=frequency=800:duration=1.2",
          "-c:v",
          "libx264",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "aac",
          INPUT_VIDEO_PATH,
        ],
        { timeoutMs: 15000 }
      );
    }
  });

  afterAll(async () => {
    if (fs.existsSync(OUTPUT_VIDEO_PATH)) {
      try {
        await fs.promises.unlink(OUTPUT_VIDEO_PATH);
      } catch {}
    }
  });

  it("renders styled captions into a video and verifies with FFprobe", async () => {
    const segments: CaptionSegment[] = [
      {
        id: "seg-1",
        start: 0.1,
        end: 1.0,
        text: "Namaste! Kalalo render test.",
        language: "hinglish",
      },
    ];

    const progressUpdates: number[] = [];

    const result = await RenderingService.renderCaptions({
      inputPath: INPUT_VIDEO_PATH,
      outputPath: OUTPUT_VIDEO_PATH,
      segments,
      presetId: "kalalo-clean-bold",
      aspectRatio: "9:16",
      onProgress: (p) => {
        progressUpdates.push(p.progress);
      },
    });

    expect(result.outputPath).toBe(OUTPUT_VIDEO_PATH);
    expect(result.width).toBe(1080);
    expect(result.height).toBe(1920);
    expect(result.aspectRatio).toBe("9:16");
    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates[progressUpdates.length - 1]).toBe(100);

    // Verify output file exists and has video stream
    const outMeta = await MediaService.inspectMedia(OUTPUT_VIDEO_PATH);
    expect(outMeta.hasVideo).toBe(true);
    expect(outMeta.video?.width).toBe(1080);
    expect(outMeta.video?.height).toBe(1920);
  });

  it("fails gracefully and reports accurate error when input media is missing", async () => {
    const nonExistent = path.join(FIXTURES_DIR, "missing.mp4");
    const badOutput = path.join(FIXTURES_DIR, "bad-out.mp4");

    await expect(
      RenderingService.renderCaptions({
        inputPath: nonExistent,
        outputPath: badOutput,
        segments: [{ id: "1", start: 0, end: 1, text: "Fail" }],
        presetId: "kalalo-clean-bold",
      })
    ).rejects.toThrow("Media file does not exist");
  });

  it("renders with trimming, muting, and custom 720p resolution", async () => {
    const trimmedOutput = path.join(FIXTURES_DIR, "render-test-trimmed.mp4");
    try {
      const result = await RenderingService.renderCaptions({
        inputPath: INPUT_VIDEO_PATH,
        outputPath: trimmedOutput,
        segments: [
          {
            id: "seg-trim-1",
            start: 0.3,
            end: 0.9,
            text: "Trimmed subtitle test",
            language: "en",
          },
        ],
        presetId: "kalalo-cinema",
        aspectRatio: "16:9",
        resolution: "720p",
        trimStart: 0.2,
        trimEnd: 1.0,
        muteAudio: true,
      });

      expect(result.width).toBe(1280);
      expect(result.height).toBe(720);
      expect(fs.existsSync(trimmedOutput)).toBe(true);

      const outMeta = await MediaService.inspectMedia(trimmedOutput);
      expect(outMeta.hasVideo).toBe(true);
      expect(outMeta.video?.width).toBe(1280);
      expect(outMeta.video?.height).toBe(720);
      expect(outMeta.hasAudio).toBe(false); // muted!
      expect(outMeta.durationSeconds).toBeLessThanOrEqual(1.0);
    } finally {
      if (fs.existsSync(trimmedOutput)) {
        try {
          await fs.promises.unlink(trimmedOutput);
        } catch {}
      }
    }
  });

  it("generates ASS with custom positioning tags and box background style", () => {
    const segments: CaptionSegment[] = [
      { id: "seg-pos", start: 0.1, end: 1.0, text: "Upper Middle Subtitle", language: "en" },
    ];
    const assContent = RenderingService.generateAssContent(
      segments,
      {
        id: "test-pos",
        name: "Test Pos",
        description: "Test",
        fontFamily: "Arial",
        fontSize: 60,
        primaryColor: "&H00FFFFFF&",
        outlineColor: "&H00000000&",
        outlineWidth: 4,
        shadowDepth: 2,
        alignment: 5,
        positionX: 50,
        positionY: 35,
        marginV: 100,
        marginL: 40,
        marginR: 40,
        backgroundTreatment: "solid_box",
        supportedAspectRatios: ["9:16"],
      },
      1080,
      1920
    );
    expect(assContent).toContain("\\an5\\pos(540,672)");
    expect(assContent).toContain("Upper Middle Subtitle");
  });
});
