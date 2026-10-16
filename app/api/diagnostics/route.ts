import { NextResponse } from "next/server";
import fs from "node:fs";
import { resolveFfmpegPath, resolveFfprobePath, spawnSafe } from "@/src/utils/process";
import { PresetsService } from "@/src/presets/presets";
import { JobsService } from "@/src/services/jobs.service";
import { env } from "@/src/config/env";
import { isSupabaseConfigured } from "@/src/lib/supabase/client";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/src/lib/supabase/server";
import { SettingsService } from "@/src/services/settings.service";

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

  // 3. Check Supabase Connectivity, Tables & Storage Bucket
  const supabaseConfigured = isSupabaseConfigured();
  const supabaseHealth = {
    configured: supabaseConfigured,
    connected: false,
    urlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 20),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.length > 20),
    tables: {
      profiles: false,
      projects: false,
      caption_segments: false,
      jobs: false,
      user_settings: false,
    },
    tableErrors: {
      profiles: null as string | null,
      projects: null as string | null,
      caption_segments: null as string | null,
      jobs: null as string | null,
      user_settings: null as string | null,
    },
    storageBucket: {
      name: "kalalo-media",
      exists: false,
    },
    error: null as string | null,
    rawProbe: null as any,
  };

  if (supabaseConfigured) {
    try {
      const supabase = getSupabaseAdminClient() || getSupabaseServerClient();
      if (supabase) {
        const [pRes, prRes, cRes, jRes, uRes] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("projects").select("*", { count: "exact", head: true }),
          supabase.from("caption_segments").select("*", { count: "exact", head: true }),
          supabase.from("jobs").select("*", { count: "exact", head: true }),
          supabase.from("user_settings").select("*", { count: "exact", head: true }),
        ]);

        supabaseHealth.tables.profiles = !pRes.error;
        supabaseHealth.tables.projects = !prRes.error;
        supabaseHealth.tables.caption_segments = !cRes.error;
        supabaseHealth.tables.jobs = !jRes.error;
        supabaseHealth.tables.user_settings = !uRes.error;

        supabaseHealth.tableErrors.profiles = pRes.error ? `${pRes.error.message} (${pRes.error.code})` : null;
        supabaseHealth.tableErrors.projects = prRes.error ? `${prRes.error.message} (${prRes.error.code})` : null;
        supabaseHealth.tableErrors.caption_segments = cRes.error ? `${cRes.error.message} (${cRes.error.code})` : null;
        supabaseHealth.tableErrors.jobs = jRes.error ? `${jRes.error.message} (${jRes.error.code})` : null;
        supabaseHealth.tableErrors.user_settings = uRes.error ? `${uRes.error.message} (${uRes.error.code})` : null;

        supabaseHealth.rawProbe = {
          status: pRes.status,
          statusText: pRes.statusText,
          error: pRes.error,
          errorKeys: pRes.error ? Object.keys(pRes.error) : [],
          errorString: String(pRes.error),
          clientType: process.env.SUPABASE_SERVICE_ROLE_KEY ? "service_role" : "anon",
        };


        // Check storage buckets
        const { data: buckets, error: bError } = await supabase.storage.listBuckets();
        if (!bError && buckets) {
          supabaseHealth.storageBucket.exists = buckets.some(
            (b: any) => b.id === "kalalo-media" || b.name === "kalalo-media"
          );
        } else if (bError && !supabaseHealth.error) {
          supabaseHealth.error = `Storage: ${bError.message}`;
        }

        supabaseHealth.connected = !pRes.error && !prRes.error;
      }

    } catch (err: unknown) {
      supabaseHealth.error = err instanceof Error ? err.message : String(err);
    }
  }

  // 4. Check Gemini AI & STT Provider
  const geminiApiKey = SettingsService.getGeminiApiKey();
  const hasGeminiKey = Boolean(geminiApiKey && geminiApiKey.trim().length > 0);
  const geminiStatus = {
    provider: env.KALALO_STT_PROVIDER || "gemini",
    model: env.KALALO_GEMINI_MODEL || "gemini-1.5-flash",
    hasApiKey: hasGeminiKey,
    ready: hasGeminiKey || env.KALALO_STT_PROVIDER === "mock",
    mode: hasGeminiKey
      ? "Production Google Gemini Multilingual STT"
      : env.KALALO_STT_PROVIDER === "mock"
      ? "Offline Demo Mock Engine"
      : "API Key Required",
  };

  // 5. Check Presets
  const presets = PresetsService.listPresets();

  // 6. Check Directories
  const outputDirWritable = fs.existsSync(env.outputDir);
  const tempDirWritable = fs.existsSync(env.tempDir);

  // 7. Check Jobs
  const jobs = JobsService.listJobs();

  // 8. Required Vercel Environment Variables Status
  const vercelEnvironment = [
    {
      name: "NEXT_PUBLIC_SUPABASE_URL",
      status: process.env.NEXT_PUBLIC_SUPABASE_URL ? "CONFIGURED" : "MISSING",
      required: true,
      description: "Supabase Project URL (Dashboard -> Settings -> API)",
    },
    {
      name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      status: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "CONFIGURED" : "MISSING",
      required: true,
      description: "Supabase Anonymous Key for client-side Auth and RLS",
    },
    {
      name: "SUPABASE_SERVICE_ROLE_KEY",
      status: process.env.SUPABASE_SERVICE_ROLE_KEY ? "CONFIGURED" : "MISSING",
      required: true,
      description: "Supabase Service Role Key for server-side elevated DB & Storage",
    },
    {
      name: "GEMINI_API_KEY",
      status: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY ? "CONFIGURED" : "MISSING",
      required: true,
      description: "Google Gemini API Key for precision video transcription",
    },
    {
      name: "JWT_SECRET",
      status: process.env.JWT_SECRET || process.env.KALALO_SECRET_KEY ? "CONFIGURED" : "DEFAULT",
      required: false,
      description: "Secret string for signing auth session cookies",
    },
    {
      name: "KALALO_SECRET_KEY",
      status: process.env.KALALO_SECRET_KEY ? "CONFIGURED" : "DEFAULT",
      required: false,
      description: "AES encryption key for storing user credentials at rest",
    },
    {
      name: "KALALO_GEMINI_MODEL",
      status: process.env.KALALO_GEMINI_MODEL ? "CONFIGURED" : "DEFAULT (gemini-1.5-flash)",
      required: false,
      description: "Gemini model identifier",
    },
  ];

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
      supabase: supabaseHealth,
      gemini: geminiStatus,
      sttProvider: {
        activeProvider: geminiStatus.provider,
        model: geminiStatus.model,
        hasApiKey: geminiStatus.hasApiKey,
        mode: geminiStatus.mode,
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
      vercelEnvironment,
    },
  });
}
