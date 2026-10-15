import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

// Load .env if present
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  KALALO_OUTPUT_DIR: z.string().default("./output"),
  KALALO_TEMP_DIR: z.string().default("./tmp"),
  KALALO_DEFAULT_ASPECT_RATIO: z.enum(["9:16", "1:1", "16:9"]).default("9:16"),
  KALALO_STT_PROVIDER: z.enum(["mock", "openai", "gemini"]).default("gemini"),
  KALALO_STT_MODEL: z.string().optional(),
  KALALO_GEMINI_MODEL: z.string().default("gemini-1.5-flash"),
  KALALO_STT_LANGUAGE: z.enum(["auto", "hinglish", "hi", "en"]).default("auto"),
  KALALO_FFMPEG_PATH: z.string().optional(),
  KALALO_FFPROBE_PATH: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Safe logging to stderr to prevent stdio transport corruption
  process.stderr.write(`[Kalalo Config Error] Invalid environment configuration: ${JSON.stringify(parsed.error.format())}\n`);
  throw new Error("Invalid environment configuration");
}

export const env = {
  ...parsed.data,
  outputDir: path.resolve(process.env.VERCEL ? "/tmp/kalalo-output" : process.cwd(), parsed.data.KALALO_OUTPUT_DIR),
  tempDir: path.resolve(process.env.VERCEL ? "/tmp/kalalo-tmp" : process.cwd(), parsed.data.KALALO_TEMP_DIR),
};
