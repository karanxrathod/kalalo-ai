import { describe, it, expect } from "vitest";
import { singleSegmentSchema, segmentListSchema } from "../src/schemas/segment.schema.js";
import { CaptionsService } from "../src/services/captions.service.js";

describe("Caption Segment Schema Validation", () => {
  it("should accept valid segments with English text", () => {
    const valid = {
      id: "seg-1",
      start: 0,
      end: 2.5,
      text: "Hello creators, welcome to Kalalo!",
      language: "en" as const,
      confidence: 0.95,
      speakerId: "spk-1",
    };
    const result = singleSegmentSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.text).toBe("Hello creators, welcome to Kalalo!");
    }
  });

  it("should preserve Hindi (Devanagari) and Hinglish mixed-script text", () => {
    const hindiSeg = {
      id: "seg-hi",
      start: 2.5,
      end: 5.0,
      text: "नमस्ते दोस्तों, आज हम AI captions बनाएंगे!",
      language: "hinglish" as const,
      confidence: 0.98,
    };
    const result = singleSegmentSchema.safeParse(hindiSeg);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.text).toBe("नमस्ते दोस्तों, आज हम AI captions बनाएंगे!");
    }
  });

  it("should reject negative start time", () => {
    const invalid = {
      id: "seg-neg",
      start: -1.5,
      end: 3.0,
      text: "Invalid start",
    };
    const result = singleSegmentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject end time less than or equal to start time", () => {
    const equalTimes = {
      id: "seg-eq",
      start: 2.0,
      end: 2.0,
      text: "Zero duration",
    };
    expect(singleSegmentSchema.safeParse(equalTimes).success).toBe(false);

    const reversedTimes = {
      id: "seg-rev",
      start: 4.0,
      end: 2.0,
      text: "Reversed duration",
    };
    expect(singleSegmentSchema.safeParse(reversedTimes).success).toBe(false);
  });

  it("should reject empty or whitespace-only text", () => {
    const emptyText = {
      id: "seg-empty",
      start: 1.0,
      end: 2.0,
      text: "   ",
    };
    expect(singleSegmentSchema.safeParse(emptyText).success).toBe(false);
  });

  it("should reject confidence out of [0, 1] range", () => {
    const tooHigh = {
      id: "seg-conf-high",
      start: 1.0,
      end: 2.0,
      text: "High confidence",
      confidence: 1.5,
    };
    expect(singleSegmentSchema.safeParse(tooHigh).success).toBe(false);

    const tooLow = {
      id: "seg-conf-low",
      start: 1.0,
      end: 2.0,
      text: "Negative confidence",
      confidence: -0.1,
    };
    expect(singleSegmentSchema.safeParse(tooLow).success).toBe(false);
  });

  it("should reject non-finite numbers (NaN, Infinity)", () => {
    const nanSeg = {
      id: "seg-nan",
      start: NaN,
      end: 2.0,
      text: "NaN start",
    };
    expect(singleSegmentSchema.safeParse(nanSeg).success).toBe(false);

    const infSeg = {
      id: "seg-inf",
      start: 0,
      end: Infinity,
      text: "Infinite end",
    };
    expect(singleSegmentSchema.safeParse(infSeg).success).toBe(false);
  });

  it("should reject duplicate segment IDs in a list", () => {
    const list = [
      { id: "same-id", start: 0, end: 1, text: "First" },
      { id: "same-id", start: 1.5, end: 2.5, text: "Second" },
    ];
    const result = segmentListSchema.safeParse(list);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("Duplicate segment ID"))).toBe(true);
    }
  });

  it("should reject chronological inversions in a list", () => {
    const list = [
      { id: "seg-1", start: 5, end: 7, text: "First" },
      { id: "seg-2", start: 2, end: 4, text: "Second" },
    ];
    const result = segmentListSchema.safeParse(list);
    expect(result.success).toBe(false);
  });

  it("should reject overlapping segments in a list", () => {
    const list = [
      { id: "seg-1", start: 1, end: 3, text: "First" },
      { id: "seg-2", start: 2.5, end: 4, text: "Second overlaps first" },
    ];
    const result = segmentListSchema.safeParse(list);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("overlaps previous segment"))).toBe(true);
    }
  });

  it("should accept valid ordered non-overlapping segment list", () => {
    const list = [
      { id: "seg-1", start: 0.0, end: 2.0, text: "Namaste" },
      { id: "seg-2", start: 2.1, end: 4.5, text: "Welcome to Kalalo" },
      { id: "seg-3", start: 4.6, end: 6.0, text: "Enjoy captioning" },
    ];
    const result = segmentListSchema.safeParse(list);
    expect(result.success).toBe(true);
  });

  it("should normalize string timestamps, clamp duration, and smooth micro-overlaps", () => {
    const raw = [
      { id: "seg-1", start: "0.00", end: "2.50", text: "Part one" },
      // Micro-overlap by 20ms (starts at 2.48s, prior ends at 2.50s)
      { id: "seg-2", start: 2.48, end: 5.20, text: "Part two" },
      // Exceeds 6.0s duration
      { id: "seg-3", start: 5.20, end: 6.45, text: "Part three" },
    ];
    const normalized = CaptionsService.normalizeSegments(raw, 6.0);
    expect(normalized).toHaveLength(3);
    expect(normalized[0].start).toBe(0);
    expect(normalized[1].start).toBe(2.48);
    expect(normalized[0].end).toBe(2.48); // Micro-overlap smoothed
    expect(normalized[2].end).toBe(6.0); // Clamped to duration
  });

  it("should return detailed segment ID and index in validateSegments when invalid", () => {
    const invalidList = [
      { id: "bad-seg-1", start: 3.0, end: 2.0, text: "Reversed timestamps" },
      { id: "bad-seg-2", start: 4.0, end: 5.0, text: "   " },
    ];
    const res = CaptionsService.validateSegments(invalidList);
    expect(res.valid).toBe(false);
    expect(res.errors).toBeDefined();
    expect(res.errors?.some((e) => e.includes("bad-seg-1"))).toBe(true);
    expect(res.errors?.some((e) => e.includes("bad-seg-2"))).toBe(true);
  });
});

