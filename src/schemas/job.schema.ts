import { z } from "zod";
import { transcriptionLanguageSchema, kalaloErrorSchema } from "./common.schema.js";
import { singleSegmentSchema } from "./segment.schema.js";

export const jobTypeSchema = z.enum(["transcription", "rendering"]);

export const jobStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "failed",
  "cancel_requested",
  "cancelled",
]);

export const transcribeMediaInputSchema = z.object({
  inputPath: z.string().min(1, "inputPath is required"),
  language: transcriptionLanguageSchema.default("auto"),
  provider: z.string().optional(),
  jobId: z.string().optional(),
});

export const transcribeMediaOutputSchema = z.object({
  jobId: z.string(),
  status: jobStatusSchema,
  segments: z.array(singleSegmentSchema).optional(),
  message: z.string(),
});

export const getJobStatusInputSchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
});

export const jobDetailSchema = z.object({
  id: z.string(),
  type: jobTypeSchema,
  status: jobStatusSchema,
  progress: z.number().min(0).max(100),
  stage: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  error: kalaloErrorSchema.optional(),
  result: z.unknown().optional(),
});

export const listJobsInputSchema = z.object({
  status: jobStatusSchema.optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export const listJobsOutputSchema = z.object({
  jobs: z.array(jobDetailSchema),
});

export const cancelJobInputSchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
});

export const cancelJobOutputSchema = z.object({
  jobId: z.string(),
  status: jobStatusSchema,
  cancelled: z.boolean(),
  message: z.string(),
});
