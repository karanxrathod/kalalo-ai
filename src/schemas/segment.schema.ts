import { z } from "zod";
import { supportedLanguageSchema } from "./common.schema.js";

export const singleSegmentSchema = z
  .object({
    id: z.string().min(1, "Segment ID must not be empty"),
    start: z
      .number({ invalid_type_error: "Start time must be a number" })
      .refine(Number.isFinite, "Start time must be a finite number")
      .refine((v) => v >= 0, "Start time must be greater than or equal to 0"),
    end: z
      .number({ invalid_type_error: "End time must be a number" })
      .refine(Number.isFinite, "End time must be a finite number"),
    text: z
      .string({ invalid_type_error: "Segment text must be a string" })
      .refine((txt) => txt.trim().length > 0, "Segment text must not be empty"),
    language: z.string().nullable().optional(),
    confidence: z
      .number({ invalid_type_error: "Confidence must be a number" })
      .refine(Number.isFinite, "Confidence must be finite")
      .refine((v) => v >= 0 && v <= 1, "Confidence must be between 0 and 1")
      .nullable()
      .optional(),
    speakerId: z.string().nullable().optional(),
  })
  .refine((seg) => seg.end > seg.start, {
    message: "End time must be strictly greater than start time",
    path: ["end"],
  });

export const segmentListSchema = z
  .array(singleSegmentSchema)
  .superRefine((segments, ctx) => {
    const idSet = new Set<string>();

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];

      // Duplicate ID check
      if (idSet.has(seg.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate segment ID found: "${seg.id}" at index ${i}`,
          path: [i, "id"],
        });
      }
      idSet.add(seg.id);

      // Chronological order & overlap check with previous segment
      if (i > 0) {
        const prev = segments[i - 1];
        if (seg.start < prev.start) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Segment at index ${i} starts at ${seg.start}s, which is earlier than previous segment start at ${prev.start}s`,
            path: [i, "start"],
          });
        }
        if (seg.start < prev.end) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Segment at index ${i} overlaps previous segment (starts at ${seg.start}s, prior ends at ${prev.end}s)`,
            path: [i, "start"],
          });
        }
      }
    }
  });

export const validateSegmentsInputSchema = z.object({
  segments: z.array(z.unknown()),
  durationSeconds: z.number().positive().optional(),
});
