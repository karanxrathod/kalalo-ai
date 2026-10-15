import { z } from "zod";

export const inspectMediaInputSchema = z.object({
  inputPath: z.string().min(1, "inputPath is required"),
});

export const videoStreamInfoSchema = z.object({
  codec: z.string(),
  width: z.number().int().nonnegative(),
  height: z.number().int().nonnegative(),
  aspectRatio: z.string().optional(),
  fps: z.number().positive().optional(),
  bitrate: z.number().nonnegative().optional(),
});

export const audioStreamInfoSchema = z.object({
  codec: z.string(),
  channels: z.number().int().nonnegative(),
  sampleRate: z.number().int().nonnegative(),
  bitrate: z.number().nonnegative().optional(),
});

export const mediaMetadataSchema = z.object({
  format: z.string(),
  durationSeconds: z.number().nonnegative(),
  hasAudio: z.boolean(),
  hasVideo: z.boolean(),
  sizeBytes: z.number().nonnegative().optional(),
  bitrate: z.number().nonnegative().optional(),
  video: videoStreamInfoSchema.optional(),
  audio: audioStreamInfoSchema.optional(),
});

export const inspectMediaOutputSchema = z.object({
  media: mediaMetadataSchema,
  video: videoStreamInfoSchema.optional(),
  audio: audioStreamInfoSchema.optional(),
  durationSeconds: z.number().nonnegative(),
  hasAudio: z.boolean(),
  hasVideo: z.boolean(),
});
