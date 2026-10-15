import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { AspectRatio, CaptionSegment, PresetStyle } from "../types/index.js";
import { env } from "../config/env.js";
import { KalaloError } from "../utils/errors.js";
import { validateInputPath, validateOutputPath, ensureDir, ensureLocalMediaFile } from "../utils/paths.js";
import { formatAssTimestamp } from "../utils/time.js";
import { spawnSafe, resolveFfmpegPath } from "../utils/process.js";
import { MediaService } from "./media.service.js";
import { PresetsService } from "../presets/presets.js";
import { CaptionsService } from "./captions.service.js";
import { CutoutService } from "./cutout.service.js";

export interface RenderOptions {
  inputPath: string;
  outputPath: string;
  segments: unknown[];
  presetId: string;
  customPreset?: Partial<PresetStyle>;
  aspectRatio?: AspectRatio;
  burnIn?: boolean;
  trimStart?: number;
  trimEnd?: number;
  muteAudio?: boolean;
  resolution?: "1080p" | "720p";
  personCutout?: boolean;
  signal?: AbortSignal;
  onProgress?: (progress: { stage: string; progress: number }) => void;
}

export interface RenderResult {
  outputPath: string;
  durationSeconds: number;
  width: number;
  height: number;
  aspectRatio: AspectRatio;
  presetId: string;
  segmentCount: number;
  personCutout?: boolean;
}

const RESOLUTIONS_1080P: Record<AspectRatio, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "16:9": { width: 1920, height: 1080 },
};

const RESOLUTIONS_720P: Record<AspectRatio, { width: number; height: number }> = {
  "9:16": { width: 720, height: 1280 },
  "1:1": { width: 720, height: 720 },
  "16:9": { width: 1280, height: 720 },
};

export class RenderingService {
  /**
   * Generates ASS subtitle format string from segments and preset styling.
   * Accurately supports ASS positioning (\pos, \an), box backgrounds (BorderStyle 3),
   * outlines, shadows, and Devanagari/Hindi/Unicode scripts.
   */
  public static generateAssContent(
    segments: CaptionSegment[],
    preset: PresetStyle,
    targetWidth: number,
    targetHeight: number
  ): string {
    // Scale font size and margins proportionally based on 1920 reference height
    const scaleFactor = targetHeight / 1920;
    const scaledFontSize = Math.max(16, Math.round(preset.fontSize * scaleFactor));
    const scaledMarginV = Math.max(20, Math.round(preset.marginV * scaleFactor));
    const scaledMarginL = Math.max(20, Math.round(preset.marginL * scaleFactor));
    const scaledMarginR = Math.max(20, Math.round(preset.marginR * scaleFactor));
    const scaledOutline = Math.max(1, Math.round(preset.outlineWidth * scaleFactor));
    const scaledShadow = Math.max(0, Math.round(preset.shadowDepth * scaleFactor));

    const boldVal = preset.bold ? -1 : 0;
    const italicVal = preset.italic ? -1 : 0;
    const underlineVal = preset.underline ? -1 : 0;

    // Background treatment configuration
    let borderStyle = 1;
    let outlineVal = scaledOutline;
    let shadowVal = scaledShadow;
    let backColour = preset.shadowColor || "&H80000000&";

    if (preset.backgroundTreatment === "solid_box" || preset.boxColor) {
      borderStyle = 3;
      outlineVal = Math.max(6, Math.round(14 * scaleFactor));
      backColour = preset.boxColor || "&H00000000&"; // Solid black box
    } else if (preset.backgroundTreatment === "translucent_box") {
      borderStyle = 3;
      outlineVal = Math.max(6, Math.round(14 * scaleFactor));
      const opacityHex = typeof preset.backgroundOpacity === "number"
        ? Math.round((1 - preset.backgroundOpacity) * 255).toString(16).padStart(2, "0").toUpperCase()
        : "80";
      backColour = `&H${opacityHex}000000&`;
    } else if (preset.backgroundTreatment === "highlight_box") {
      borderStyle = 3;
      outlineVal = Math.max(6, Math.round(16 * scaleFactor));
      backColour = preset.accentColor || "&H0033CCFF&";
    } else if (preset.backgroundTreatment === "outline_only") {
      borderStyle = 1;
      outlineVal = Math.max(2, Math.round(preset.outlineWidth * 1.5 * scaleFactor));
      shadowVal = 0;
    }

    // Explicit position coordinates calculation (X% & Y%)
    const hasExplicitPos = typeof preset.positionX === "number" || typeof preset.positionY === "number";
    const posX = Math.round(((preset.positionX ?? 50) / 100) * targetWidth);
    const posY = Math.round(((preset.positionY ?? 80) / 100) * targetHeight);
    const alignment = preset.alignment || 2;

    const lines: string[] = [
      "[Script Info]",
      "Title: Kalalo Captions",
      "ScriptType: v4.00+",
      "WrapStyle: 0",
      `PlayResX: ${targetWidth}`,
      `PlayResY: ${targetHeight}`,
      "ScaledBorderAndShadow: yes",
      "",
      "[V4+ Styles]",
      "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
      `Style: Default,${preset.fontFamily},${scaledFontSize},${preset.primaryColor},&H000000FF,${preset.outlineColor},${backColour},${boldVal},${italicVal},${underlineVal},0,100,100,0,0,${borderStyle},${outlineVal},${shadowVal},${alignment},${scaledMarginL},${scaledMarginR},${scaledMarginV},1`,
      "",
      "[Events]",
      "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ];

    for (const seg of segments) {
      const startAss = formatAssTimestamp(seg.start);
      const endAss = formatAssTimestamp(seg.end);

      // Safe ASS text escaping: prevent formatting or command injection
      const safeText = seg.text
        .replace(/\\/g, "\\\\")
        .replace(/\{/g, "\\{")
        .replace(/\}/g, "\\}")
        .replace(/\r?\n/g, "\\N")
        .trim();

      const dialoguePrefix = hasExplicitPos
        ? `{\\an${alignment}\\pos(${posX},${posY})}`
        : "";

      lines.push(`Dialogue: 0,${startAss},${endAss},Default,,0,0,0,,${dialoguePrefix}${safeText}`);
    }

    lines.push("");
    return lines.join("\n");
  }

  /**
   * Renders captions directly onto video using FFmpeg with real machine-readable progress.
   * Seamlessly supports Person Cutout / Captions Behind Subject compositing.
   */
  public static async renderCaptions(options: RenderOptions): Promise<RenderResult> {
    const inputPath = validateInputPath(options.inputPath);
    const outputPath = validateOutputPath(options.outputPath, inputPath);
    const aspectRatio: AspectRatio = options.aspectRatio || (env.KALALO_DEFAULT_ASPECT_RATIO as AspectRatio) || "9:16";

    const localInput = await ensureLocalMediaFile(inputPath);
    try {
      const effectiveInputPath = localInput.localPath;
      options.onProgress?.({ stage: "inspecting_media", progress: 5 });
      const mediaMeta = await MediaService.inspectMedia(effectiveInputPath);
      if (!mediaMeta.hasVideo) {
        throw new KalaloError({
          code: "UNSUPPORTED_MEDIA",
          message: "Input media has no video stream. Subtitle rendering requires a video source.",
          retryable: false,
          details: { inputPath },
        });
      }

    const duration = mediaMeta.durationSeconds > 0 ? mediaMeta.durationSeconds : 1.0;

    options.onProgress?.({ stage: "validating_segments", progress: 10 });
    const segments = CaptionsService.ensureValid(options.segments, duration);
    const basePreset = PresetsService.getPreset(options.presetId);
    const preset: PresetStyle = options.customPreset
      ? { ...basePreset, ...options.customPreset, id: basePreset.id }
      : basePreset;

    const resMap = options.resolution === "720p" ? RESOLUTIONS_720P : RESOLUTIONS_1080P;
    const { width: targetWidth, height: targetHeight } = resMap[aspectRatio];

    // Trimming and segment shifting calculation
    let effectiveDuration = duration;
    let isTrimmed = false;
    let trimStart = 0;
    let trimEnd = duration;

    if (
      typeof options.trimStart === "number" &&
      typeof options.trimEnd === "number" &&
      options.trimEnd > options.trimStart
    ) {
      isTrimmed = true;
      trimStart = Math.max(0, options.trimStart);
      trimEnd = Math.min(duration, options.trimEnd);
      effectiveDuration = Math.max(0.1, trimEnd - trimStart);
    }

    let renderSegments = segments;
    if (isTrimmed) {
      renderSegments = segments
        .filter((s) => s.end > trimStart && s.start < trimEnd)
        .map((s) => ({
          ...s,
          start: Math.max(0, parseFloat((s.start - trimStart).toFixed(2))),
          end: Math.min(effectiveDuration, parseFloat((s.end - trimStart).toFixed(2))),
        }))
        .filter((s) => s.end > s.start);
    }

    options.onProgress?.({ stage: "preparing_subtitles", progress: 15 });
    const tempDir = ensureDir(env.tempDir);
    const tempAssPath = path.join(tempDir, `kalalo-${crypto.randomUUID()}.ass`);
    let tempMaskPath: string | undefined = undefined;

    const assContent = this.generateAssContent(renderSegments, preset, targetWidth, targetHeight);
    await fs.writeFile(tempAssPath, assContent, "utf-8");

    try {
      const ffmpegPath = resolveFfmpegPath();
      const scalePad = `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:black`;

      const normalizedAssPath = tempAssPath
        .replace(/\\/g, "/")
        .replace(/:/g, "\\:")
        .replace(/'/g, "\\'");

      const usePersonCutout = options.personCutout === true && CutoutService.isAvailable();

      if (usePersonCutout) {
        options.onProgress?.({ stage: "generating_person_mask", progress: 18 });
        tempMaskPath = path.join(tempDir, `kalalo-mask-${crypto.randomUUID()}.mp4`);

        await CutoutService.generateMaskVideo({
          inputPath: effectiveInputPath,
          outputPath: tempMaskPath,
          trimStart: isTrimmed ? trimStart : undefined,
          trimEnd: isTrimmed ? trimEnd : undefined,
          signal: options.signal,
          onProgress: (p) => {
            // Map cutout progress to 18% - 50%
            const mapped = Math.round(18 + (p.progress / 100) * 32);
            options.onProgress?.({ stage: "generating_person_cutout", progress: mapped });
          },
        });
      }

      options.onProgress?.({ stage: "rendering", progress: usePersonCutout ? 52 : 20 });

      const args = ["-y"];

      if (usePersonCutout && tempMaskPath) {
        // Multi-input compositing filter:
        // [0:v] -> scale & pad background
        // [bg] -> burn subtitles
        // [0:v] -> scale & pad original foreground frame
        // [scaled_fg][1:v]alphamerge -> extract foreground person with alpha mask
        // [bg_sub][fg_person]overlay -> overlay person over subtitles (captions behind subject)
        if (isTrimmed) {
          args.push("-ss", trimStart.toFixed(3), "-to", trimEnd.toFixed(3));
        }
        args.push("-i", effectiveInputPath);
        // Mask is already trimmed
        args.push("-i", tempMaskPath);

        const filterComplex = `[0:v]${scalePad}[bg];[bg]subtitles='${normalizedAssPath}'[bg_sub];[0:v]${scalePad}[scaled_fg];[1:v]${scalePad},format=gray[scaled_mask];[scaled_fg][scaled_mask]alphamerge[fg_person];[bg_sub][fg_person]overlay=0:0[outv]`;
        args.push("-filter_complex", filterComplex, "-map", "[outv]");

        if (options.muteAudio) {
          args.push("-an");
        } else if (mediaMeta.hasAudio) {
          args.push("-map", "0:a", "-c:a", "aac", "-b:a", "128k");
        } else {
          args.push("-an");
        }
      } else {
        // Standard single input rendering
        const subtitlesFilter = `subtitles='${normalizedAssPath}'`;
        const videoFilter = `${scalePad},${subtitlesFilter}`;

        if (isTrimmed) {
          args.push("-ss", trimStart.toFixed(3), "-to", trimEnd.toFixed(3));
        }
        args.push("-i", effectiveInputPath, "-vf", videoFilter);

        if (options.muteAudio) {
          args.push("-an");
        } else if (mediaMeta.hasAudio) {
          args.push("-c:a", "aac", "-b:a", "128k");
        } else {
          args.push("-an");
        }
      }

      args.push(
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "22",
        "-pix_fmt",
        "yuv420p"
      );

      // Progress reporting
      args.push("-progress", "pipe:1", "-nostats", outputPath);

      const renderBaseProgress = usePersonCutout ? 52 : 20;
      const renderProgressSpan = usePersonCutout ? 42 : 72;

      await spawnSafe(ffmpegPath, args, {
        signal: options.signal,
        onStdoutLine: (line) => {
          if (line.startsWith("out_time_us=")) {
            const us = parseInt(line.split("=")[1], 10);
            if (!isNaN(us) && us > 0) {
              const currentSeconds = us / 1000000;
              const ratio = Math.min(1, currentSeconds / effectiveDuration);
              const currentProgress = Math.round(renderBaseProgress + ratio * renderProgressSpan);
              options.onProgress?.({
                stage: "rendering",
                progress: Math.min(94, currentProgress),
              });
            }
          }
        },
      });

      options.onProgress?.({ stage: "verifying_output", progress: 96 });

      // Verification checks: ensure file exists and is non-empty
      try {
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
          throw new Error("Output video file is 0 bytes");
        }

        const outMeta = await MediaService.inspectMedia(outputPath);
        if (!outMeta.hasVideo) {
          throw new Error("Rendered video file is missing a valid video stream");
        }
      } catch (verifyErr) {
        throw new KalaloError({
          code: "OUTPUT_VERIFICATION_FAILED",
          message: `Rendered output verification failed: ${verifyErr instanceof Error ? verifyErr.message : String(verifyErr)}`,
          retryable: false,
          details: { outputPath },
        });
      }

      options.onProgress?.({ stage: "completed", progress: 100 });

      return {
        outputPath,
        durationSeconds: effectiveDuration,
        width: targetWidth,
        height: targetHeight,
        aspectRatio,
        presetId: preset.id,
        segmentCount: renderSegments.length,
        personCutout: usePersonCutout,
      };
    } finally {
      // Clean up temporary ASS file and mask video
      await fs.unlink(tempAssPath).catch(() => {});
      if (tempMaskPath) {
        await fs.unlink(tempMaskPath).catch(() => {});
      }
    }
    } finally {
      await localInput.cleanup();
    }
  }
}
