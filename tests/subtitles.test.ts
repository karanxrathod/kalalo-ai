import { describe, it, expect } from "vitest";
import { SubtitleExportService } from "../src/services/subtitle-export.service.js";
import { formatSrtTimestamp, formatVttTimestamp } from "../src/utils/time.js";

describe("Subtitle Formatting and Export", () => {
  it("formats SRT and WebVTT timestamps correctly with millisecond rounding", () => {
    // 1 hour, 2 minutes, 3.456 seconds
    const seconds = 3600 + 120 + 3.456;
    expect(formatSrtTimestamp(seconds)).toBe("01:02:03,456");
    expect(formatVttTimestamp(seconds)).toBe("01:02:03.456");

    // Boundary at 0
    expect(formatSrtTimestamp(0)).toBe("00:00:00,000");
    expect(formatVttTimestamp(0)).toBe("00:00:00.000");

    // Millisecond rounding check: 1.9998 -> 2.000
    expect(formatSrtTimestamp(1.9998)).toBe("00:00:02,000");
  });

  it("exports valid SRT with correct numbering, timestamps, and trailing newline", async () => {
    const segments = [
      { id: "1", start: 1.2, end: 3.5, text: "Namaste! Welcome to Kalalo." },
      { id: "2", start: 3.6, end: 5.2, text: "Aaj hum captions banayenge." },
    ];

    const result = await SubtitleExportService.exportSubtitles(segments, "srt");
    expect(result.format).toBe("srt");
    expect(result.segmentCount).toBe(2);

    const expected = [
      "1",
      "00:00:01,200 --> 00:00:03,500",
      "Namaste! Welcome to Kalalo.",
      "",
      "2",
      "00:00:03,600 --> 00:00:05,200",
      "Aaj hum captions banayenge.",
      "",
    ].join("\n");

    expect(result.content).toBe(expected);
  });

  it("exports valid WebVTT with WEBVTT header and correct period timestamp separators", async () => {
    const segments = [
      { id: "1", start: 1.2, end: 3.5, text: "Namaste! Welcome to Kalalo." },
      { id: "2", start: 3.6, end: 5.2, text: "Aaj hum captions banayenge." },
    ];

    const result = await SubtitleExportService.exportSubtitles(segments, "vtt");
    expect(result.format).toBe("vtt");
    expect(result.segmentCount).toBe(2);

    expect(result.content.startsWith("WEBVTT\n\n")).toBe(true);
    expect(result.content).toContain("00:00:01.200 --> 00:00:03.500\nNamaste! Welcome to Kalalo.");
    expect(result.content).toContain("00:00:03.600 --> 00:00:05.200\nAaj hum captions banayenge.");
  });

  it("preserves Devanagari Hindi and Hinglish text without corruption", async () => {
    const segments = [
      {
        id: "hi-1",
        start: 0,
        end: 2.5,
        text: "कलालो में आपका स्वागत है। (Welcome to Kalalo!)",
        language: "hinglish" as const,
      },
    ];

    const srtResult = await SubtitleExportService.exportSubtitles(segments, "srt");
    expect(srtResult.content).toContain("कलालो में आपका स्वागत है। (Welcome to Kalalo!)");

    const vttResult = await SubtitleExportService.exportSubtitles(segments, "vtt");
    expect(vttResult.content).toContain("कलालो में आपका स्वागत है। (Welcome to Kalalo!)");
  });

  it("rejects invalid segments before serialization", async () => {
    const invalidSegments = [
      { id: "bad", start: 5, end: 2, text: "Invalid timing" },
    ];

    await expect(SubtitleExportService.exportSubtitles(invalidSegments, "srt")).rejects.toThrow();
  });
});
