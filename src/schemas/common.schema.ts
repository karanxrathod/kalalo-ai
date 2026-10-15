import { z } from "zod";

export const supportedLanguageSchema = z.enum(["hinglish", "hi", "en"]);
export const transcriptionLanguageSchema = z.enum(["auto", "hinglish", "hi", "en"]);
export const aspectRatioSchema = z.enum(["9:16", "1:1", "16:9"]);

export const kalaloErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  retryable: z.boolean(),
  details: z.record(z.unknown()).optional(),
});
