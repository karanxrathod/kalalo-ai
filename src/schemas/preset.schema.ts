import { z } from "zod";
import { aspectRatioSchema, supportedLanguageSchema } from "./common.schema.js";

export const listPresetsInputSchema = z.object({
  format: aspectRatioSchema.optional(),
  language: supportedLanguageSchema.optional(),
});

export const presetStyleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(["Social", "Professional", "Cinematic", "Educational", "Accessibility"]).optional(),
  fontFamily: z.string(),
  fontSize: z.number().positive(),
  primaryColor: z.string(),
  accentColor: z.string().optional(),
  outlineColor: z.string(),
  outlineWidth: z.number().nonnegative(),
  shadowColor: z.string().optional(),
  shadowDepth: z.number().nonnegative(),
  alignment: z.number().int(),
  positionX: z.number().min(0).max(100).optional(),
  positionY: z.number().min(0).max(100).optional(),
  marginV: z.number().nonnegative(),
  marginL: z.number().nonnegative(),
  marginR: z.number().nonnegative(),
  boxColor: z.string().optional(),
  backgroundTreatment: z.enum(["none", "solid_box", "translucent_box", "highlight_box", "outline_only"]).optional(),
  backgroundOpacity: z.number().min(0).max(1).optional(),
  supportedAspectRatios: z.array(aspectRatioSchema),
  targetLanguages: z.array(supportedLanguageSchema).optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
});

export const listPresetsOutputSchema = z.object({
  presets: z.array(presetStyleSchema),
});
