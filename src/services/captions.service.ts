import { segmentListSchema, singleSegmentSchema } from "../schemas/segment.schema.js";
import { CaptionSegment, SupportedLanguage } from "../types/index.js";
import { KalaloError } from "../utils/errors.js";

export interface SegmentValidationResult {
  valid: boolean;
  segments?: CaptionSegment[];
  errors?: string[];
  warnings?: string[];
}

export class CaptionsService {
  /**
   * Normalizes raw or edited caption segments into canonical Kalalo contract.
   * Handles string-to-number coercions, float precision rounding, ID generation,
   * Unicode/Hindi/Marathi script preservation, micro-overlap smoothing, and media duration clamping.
   */
  public static normalizeSegments(
    rawSegments: unknown[],
    durationSeconds?: number
  ): CaptionSegment[] {
    if (!Array.isArray(rawSegments)) return [];

    const normalized: CaptionSegment[] = [];
    const usedIds = new Set<string>();

    for (let i = 0; i < rawSegments.length; i++) {
      const item = rawSegments[i] as any;
      if (!item || typeof item !== "object") continue;

      let id = typeof item.id === "string" && item.id.trim().length > 0 ? item.id.trim() : `seg-${i + 1}`;
      if (usedIds.has(id)) {
        id = `${id}-${i + 1}`;
      }
      usedIds.add(id);

      // Numeric coercion and rounding to 2 decimal places to prevent float precision issues
      const rawStart = typeof item.start === "number" ? item.start : parseFloat(String(item.start));
      const rawEnd = typeof item.end === "number" ? item.end : parseFloat(String(item.end));

      let start = Number.isFinite(rawStart) ? Math.max(0, parseFloat(rawStart.toFixed(2))) : 0;
      let end = Number.isFinite(rawEnd) ? parseFloat(rawEnd.toFixed(2)) : start + 1.0;

      // Clamp to duration if media duration is provided
      if (typeof durationSeconds === "number" && durationSeconds > 0) {
        const roundedDuration = parseFloat(durationSeconds.toFixed(2));
        if (start < roundedDuration && end > roundedDuration) {
          end = roundedDuration;
        }
      }

      const text = typeof item.text === "string" ? item.text.trim() : "";
      const language = item.language ? String(item.language).toLowerCase() : undefined;
      const confidence = typeof item.confidence === "number" && Number.isFinite(item.confidence)
        ? Math.min(1, Math.max(0, parseFloat(item.confidence.toFixed(2))))
        : undefined;
      const speakerId = typeof item.speakerId === "string" && item.speakerId.trim().length > 0
        ? item.speakerId.trim()
        : undefined;

      normalized.push({
        id,
        start,
        end,
        text,
        language: language as SupportedLanguage | undefined,
        confidence,
        speakerId,
      });
    }

    // Sort chronologically by start time
    normalized.sort((a, b) => a.start - b.start);

    // Resolve micro-overlaps between consecutive segments (up to 80ms)
    for (let i = 1; i < normalized.length; i++) {
      const prev = normalized[i - 1];
      const curr = normalized[i];
      if (curr.start < prev.end) {
        const overlap = prev.end - curr.start;
        if (overlap <= 0.08) {
          // Adjust previous segment end to seamlessly meet current segment start
          prev.end = parseFloat(curr.start.toFixed(2));
        }
      }
    }

    return normalized;
  }

  /**
   * Validates and normalizes caption segments according to Kalalo canonical contracts.
   * Preserves Hindi, Hinglish, Marathi, and Unicode scripts without destructive mutations.
   */
  public static validateSegments(
    rawSegments: unknown[],
    durationSeconds?: number
  ): SegmentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(rawSegments) || rawSegments.length === 0) {
      return {
        valid: false,
        errors: ["Segments must be a non-empty array"],
      };
    }

    // First attempt to normalize segments for friendly error recovery
    const normalized = this.normalizeSegments(rawSegments, durationSeconds);

    // Validate each segment individually to collect granular, actionable error messages
    for (let i = 0; i < normalized.length; i++) {
      const seg = normalized[i];
      const singleCheck = singleSegmentSchema.safeParse(seg);
      if (!singleCheck.success) {
        for (const issue of singleCheck.error.issues) {
          errors.push(
            `Segment #${i + 1} ("${seg.id}"): ${issue.message} at ${issue.path.join(".")}`
          );
        }
      }
    }

    // Validate segment list relationships (chronological order, duplicate IDs, overlaps)
    const listCheck = segmentListSchema.safeParse(normalized);
    if (!listCheck.success) {
      for (const issue of listCheck.error.issues) {
        // Only add list-level issues if not already covered
        const msg = issue.message;
        if (!errors.some((e) => e.includes(msg))) {
          errors.push(msg);
        }
      }
    }

    // Check media duration boundary if duration is provided
    if (typeof durationSeconds === "number" && durationSeconds > 0) {
      const tolerance = 0.1; // 100ms tolerance
      const maxAllowed = durationSeconds + tolerance;

      for (let i = 0; i < normalized.length; i++) {
        const seg = normalized[i];
        if (seg.end > maxAllowed) {
          errors.push(
            `Segment #${i + 1} ("${seg.id}") ends at ${seg.end}s, which exceeds media duration ${durationSeconds.toFixed(2)}s`
          );
        }
      }
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors,
      };
    }

    // Check for large gaps (warnings only)
    for (let i = 1; i < normalized.length; i++) {
      const prev = normalized[i - 1];
      const curr = normalized[i];
      const gap = curr.start - prev.end;
      if (gap > 10) {
        warnings.push(`Large gap of ${gap.toFixed(2)}s between segment "${prev.id}" and "${curr.id}"`);
      }
    }

    return {
      valid: true,
      segments: normalized,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Enforces validation or throws a structured KalaloError with granular segment errors
   */
  public static ensureValid(
    rawSegments: unknown[],
    durationSeconds?: number
  ): CaptionSegment[] {
    const result = this.validateSegments(rawSegments, durationSeconds);
    if (!result.valid || !result.segments) {
      const errorSummary = result.errors && result.errors.length > 0
        ? `Supplied caption segments failed validation:\n${result.errors.map((e) => `• ${e}`).join("\n")}`
        : "Supplied caption segments failed validation";

      throw new KalaloError({
        code: "INVALID_SEGMENTS",
        message: errorSummary,
        retryable: false,
        details: { errors: result.errors },
      });
    }
    return result.segments;
  }
}
