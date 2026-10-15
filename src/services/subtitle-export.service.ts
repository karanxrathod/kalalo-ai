import fs from "node:fs/promises";
import { CaptionSegment } from "../types/index.js";
import { formatSrtTimestamp, formatVttTimestamp } from "../utils/time.js";
import { validateOutputPath } from "../utils/paths.js";
import { CaptionsService } from "./captions.service.js";

export interface ExportSubtitlesResult {
  format: "srt" | "vtt";
  outputPath?: string;
  content: string;
  segmentCount: number;
}

export class SubtitleExportService {
  /**
   * Serializes segments into SRT format.
   */
  public static serializeSrt(segments: CaptionSegment[]): string {
    const lines: string[] = [];

    segments.forEach((seg, index) => {
      lines.push(String(index + 1));
      lines.push(`${formatSrtTimestamp(seg.start)} --> ${formatSrtTimestamp(seg.end)}`);
      // Escape accidental empty or newlines
      const cleanText = seg.text.trim();
      lines.push(cleanText);
      lines.push(""); // blank line separating blocks
    });

    return lines.join("\n");
  }

  /**
   * Serializes segments into WebVTT format.
   */
  public static serializeVtt(segments: CaptionSegment[]): string {
    const lines: string[] = ["WEBVTT", ""];

    segments.forEach((seg, index) => {
      // Optional identifier or cue index
      lines.push(`${formatVttTimestamp(seg.start)} --> ${formatVttTimestamp(seg.end)}`);
      const cleanText = seg.text.trim();
      lines.push(cleanText);
      lines.push(""); // blank line separating cues
    });

    return lines.join("\n");
  }

  /**
   * Exports segments to either SRT or WebVTT format, writing to disk if outputPath is supplied.
   */
  public static async exportSubtitles(
    rawSegments: unknown[],
    format: "srt" | "vtt",
    outputPath?: string
  ): Promise<ExportSubtitlesResult> {
    const segments = CaptionsService.ensureValid(rawSegments);

    const content =
      format === "srt"
        ? this.serializeSrt(segments)
        : this.serializeVtt(segments);

    let writtenPath: string | undefined;

    if (outputPath && outputPath.trim().length > 0) {
      writtenPath = validateOutputPath(outputPath);
      await fs.writeFile(writtenPath, content, "utf-8");
    }

    return {
      format,
      outputPath: writtenPath,
      content,
      segmentCount: segments.length,
    };
  }
}
