import { z } from "zod";
import { aspectRatioSchema } from "./common.schema.js";
import { singleSegmentSchema } from "./segment.schema.js";

export const renderCaptionsInputSchema = z.object({
  inputPath: z.string().min(1, "inputPath is required"),
  outputPath: z.string().min(1, "outputPath is required"),
  segments: z.union([
    z.array(singleSegmentSchema),
    z.string().min(1, "segments stored reference or JSON string"),
  ]),
  presetId: z.string().min(1, "presetId is required"),
  aspectRatio: aspectRatioSchema.default("9:16"),
  burnIn: z.boolean().default(true),
  trimStart: z.number().min(0).optional(),
  trimEnd: z.number().min(0).optional(),
  muteAudio: z.boolean().optional(),
  resolution: z.enum(["1080p", "720p"]).optional(),
  jobId: z.string().optional(),
});

export const renderCaptionsOutputSchema = z.object({
  jobId: z.string(),
  status: z.string(),
  outputPath: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  message: z.string(),
});

export const exportSubtitlesInputSchema = z.object({
  segments: z.array(singleSegmentSchema).min(1, "At least one segment is required for export"),
  format: z.enum(["srt", "vtt"]),
  outputPath: z.string().optional(),
});

export const exportSubtitlesOutputSchema = z.object({
  format: z.enum(["srt", "vtt"]),
  outputPath: z.string().optional(),
  content: z.string().optional(),
  segmentCount: z.number().int().nonnegative(),
});
