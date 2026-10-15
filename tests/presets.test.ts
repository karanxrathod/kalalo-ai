import { describe, it, expect } from "vitest";
import { PresetsService, ORIGINAL_PRESETS } from "../src/presets/presets.js";
import { presetStyleSchema } from "../src/schemas/preset.schema.js";
import { KalaloError } from "../src/utils/errors.js";

describe("Caption Presets Service", () => {
  it("loads all original presets and validates their schema", () => {
    expect(ORIGINAL_PRESETS.length).toBeGreaterThanOrEqual(6);

    for (const preset of ORIGINAL_PRESETS) {
      const parsed = presetStyleSchema.safeParse(preset);
      expect(parsed.success).toBe(true);
      expect(preset.fontSize).toBeGreaterThan(0);
      expect(preset.outlineWidth).toBeGreaterThan(0);
      expect(preset.fontFamily).toBeDefined();
    }
  });

  it("ensures all preset IDs are unique", () => {
    const ids = ORIGINAL_PRESETS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("includes all required original concept presets", () => {
    const expectedIds = [
      "kalalo-clean-bold",
      "kalalo-cinema",
      "kalalo-pop-highlight",
      "kalalo-editorial",
      "kalalo-devanagari-clear",
      "kalalo-minimal-white",
    ];

    for (const id of expectedIds) {
      const preset = PresetsService.getPreset(id);
      expect(preset).toBeDefined();
      expect(preset.id).toBe(id);
    }
  });

  it("throws PRESET_NOT_FOUND when requesting an invalid preset ID", () => {
    expect(() => PresetsService.getPreset("non-existent-preset")).toThrow(KalaloError);
    try {
      PresetsService.getPreset("non-existent-preset");
    } catch (err) {
      expect(err instanceof KalaloError).toBe(true);
      if (err instanceof KalaloError) {
        expect(err.code).toBe("PRESET_NOT_FOUND");
      }
    }
  });

  it("filters presets by supported aspect ratio", () => {
    const portrait = PresetsService.listPresets({ format: "9:16" });
    expect(portrait.length).toBe(ORIGINAL_PRESETS.length);

    const square = PresetsService.listPresets({ format: "1:1" });
    expect(square.length).toBe(ORIGINAL_PRESETS.length);

    const landscape = PresetsService.listPresets({ format: "16:9" });
    expect(landscape.length).toBe(ORIGINAL_PRESETS.length);
  });

  it("filters presets by supported language", () => {
    const hindiPresets = PresetsService.listPresets({ language: "hi" });
    expect(hindiPresets.some((p) => p.id === "kalalo-devanagari-clear")).toBe(true);
  });
});
