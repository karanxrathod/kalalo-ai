import { NextResponse } from "next/server";
import fs from "node:fs";
import { resolveFfmpegPath, resolveFfprobePath, spawnSafe } from "@/src/utils/process";
import { PresetsService } from "@/src/presets/presets";
import { JobsService } from "@/src/services/jobs.service";
import { env } from "@/src/config/env";

export async function GET() {
  const timestamp = new Date().toISOString();

  // 1. Check FFmpeg
  let ffmpegStatus: { healthy: boolean; version?: string; path: string; error?: string } = {
    healthy: false,
    path: resolveFfmpegPath(),
  };
  try {
    const ffmpegRes = await spawnSafe(ffmpegStatus.path, ["-version"], { timeoutMs: 5000 });
    const firstLine = ffmpegRes.stdout.split("\n")[0].trim();
    ffmpegStatus = {
      healthy: true,
      version: firstLine,
      path: ffmpegStatus.path,
    };
  } catch (err: unknown) {
    ffmpegStatus.error = err instanceof Error ? err.message : String(err);
  }

  // 2. Check FFprobe
  let ffprobeStatus: { healthy: boolean; version?: string; path: string; error?: string } = {
    healthy: false,
    path: resolveFfprobePath(),
  };
  try {
    const ffprobeRes = await spawnSafe(ffprobeStatus.path, ["-version"], { timeoutMs: 5000 });
    const firstLine = ffprobeRes.stdout.split("\n")[0].trim();
    ffprobeStatus = {
      healthy: true,
      version: firstLine,
      path: ffprobeStatus.path,
    };
  } catch (err: unknown) {
    ffprobeStatus.error = err instanceof Error ? err.message : String(err);
  }

  // 3. Check Presets
  const presets = PresetsService.listPresets();

  // 4. Check Provider & Keys
  const provider = env.KALALO_STT_PROVIDER;
  const hasOpenAiKey = Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 0);

  // 5. Check Directories
  const outputDirWritable = fs.existsSync(env.outputDir);
  const tempDirWritable = fs.existsSync(env.tempDir);

  // 6. Check Jobs
  const jobs = JobsService.listJobs();

  return NextResponse.json({
    timestamp,
    system: {
      status: ffmpegStatus.healthy && ffprobeStatus.healthy ? "HEALTHY" : "DEGRADED",
      nodeVersion: process.version,
      platform: process.platform,
    },
    services: {
      webApp: { healthy: true, framework: "Next.js 14 App Router" },
      mcpServer: {
        healthy: true,
        protocol: "Model Context Protocol STDIO",
        toolsCount: 9,
      },
      ffmpeg: ffmpegStatus,
      ffprobe: ffprobeStatus,
      sttProvider: {
        activeProvider: provider,
        model: env.KALALO_STT_MODEL || (provider === "openai" ? "whisper-1" : "mock-engine"),
        hasApiKey: hasOpenAiKey,
        mode: provider === "mock" ? "Offline Demo (No API key needed)" : "Real OpenAI API",
      },
      presets: {
        count: presets.length,
        items: presets.map((p) => ({ id: p.id, name: p.name })),
      },
      storage: {
        outputDir: env.outputDir,
        outputDirExists: outputDirWritable,
        tempDir: env.tempDir,
        tempDirExists: tempDirWritable,
      },
      jobs: {
        total: jobs.length,
        completed: jobs.filter((j) => j.status === "completed").length,
        running: jobs.filter((j) => j.status === "running").length,
      },
    },
  });
}
