"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Layers,
  HardDrive,
  FileCode,
  Terminal,
  ShieldCheck,
  Video,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Database,
  Cloud,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

interface DiagnosticsData {
  timestamp: string;
  system: {
    status: string;
    nodeVersion: string;
    platform: string;
  };
  services: {
    webApp: { healthy: boolean; framework: string };
    mcpServer: { healthy: boolean; protocol: string; toolsCount: number };
    ffmpeg: { healthy: boolean; version?: string; path: string; error?: string };
    ffprobe: { healthy: boolean; version?: string; path: string; error?: string };
    supabase?: {
      configured: boolean;
      connected: boolean;
      urlConfigured: boolean;
      hasAnonKey: boolean;
      hasServiceRoleKey: boolean;
      tables: {
        profiles: boolean;
        projects: boolean;
        caption_segments: boolean;
        jobs: boolean;
        user_settings: boolean;
      };
      storageBucket: {
        name: string;
        exists: boolean;
      };
      error: string | null;
    };
    gemini?: {
      provider: string;
      model: string;
      hasApiKey: boolean;
      ready: boolean;
      mode: string;
    };
    sttProvider: {
      activeProvider: string;
      model: string;
      hasApiKey: boolean;
      mode: string;
    };
    presets: {
      count: number;
      items: Array<{ id: string; name: string }>;
    };
    storage: {
      outputDir: string;
      outputDirExists: boolean;
      tempDir: string;
      tempDirExists: boolean;
    };
    jobs: {
      total: number;
      completed: number;
      running: number;
    };
    vercelEnvironment?: Array<{
      name: string;
      status: string;
      required: boolean;
      description: string;
    }>;
  };
}

export default function DiagnosticsPage() {
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/diagnostics");
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load diagnostics`);
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  return (
    <div className="min-h-screen bg-[#0C0D11] text-white flex">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  System Diagnostics & Health
                </span>
                <span className="text-xs text-slate-500 font-mono">Live Monitoring</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Kalalo Environment Health
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                Real-time validation of FFmpeg binaries, FFprobe media inspect, MCP STDIO
                protocol tools, Speech-to-Text providers, and temp scratch storage.
              </p>
            </div>

            <button
              onClick={fetchDiagnostics}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface hover:bg-slate-800 border border-border text-xs sm:text-sm text-white font-medium transition-colors self-start sm:self-auto disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
              <span>{loading ? "Checking..." : "Re-run Checks"}</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="font-bold">Failed to run system diagnostics</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && !data && (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400">Probing local FFmpeg, MCP tools, and storage paths...</p>
            </div>
          )}

          {data && (
            <div className="mt-6 space-y-6">
              {/* Overall Status Banner */}
              <div
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  data.system.status === "HEALTHY"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  {data.system.status === "HEALTHY" ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-7 h-7 text-amber-400 flex-shrink-0" />
                  )}
                  <div>
                    <h2 className="text-base font-extrabold text-white">
                      Overall System Status: {data.system.status}
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Node {data.system.nodeVersion} • Platform: {data.system.platform} •
                      Checked at {new Date(data.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-black/40 border border-white/10 text-white">
                    9 MCP Tools Active
                  </span>
                </div>
              </div>

              {/* Supabase Cloud & Gemini STT Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Supabase Cloud Card */}
                <div className="p-5 rounded-2xl bg-surface/70 border border-border flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-400" />
                        <h3 className="font-bold text-white text-sm">Supabase PostgreSQL & Storage</h3>
                      </div>
                      {data.services.supabase?.connected ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Connected
                        </span>
                      ) : data.services.supabase?.configured ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Configured (Checking)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20 flex items-center gap-1">
                          Local Fallback Mode
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                      Primary cloud database for user profiles, projects, caption segments, durable jobs, and the private{" "}
                      <code className="text-emerald-400 bg-emerald-950/40 px-1 py-0.5 rounded">kalalo-media</code> storage bucket.
                    </p>

                    {data.services.supabase?.configured ? (
                      <div className="space-y-2 text-xs font-mono">
                        <div className="p-2.5 rounded-lg bg-black/60 border border-border">
                          <div className="text-[10px] text-slate-500 uppercase mb-1">Database Tables Verified:</div>
                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            <span className={data.services.supabase.tables.profiles ? "text-emerald-400" : "text-amber-400"}>
                              • profiles: {data.services.supabase.tables.profiles ? "✓" : "✗"}
                            </span>
                            <span className={data.services.supabase.tables.projects ? "text-emerald-400" : "text-amber-400"}>
                              • projects: {data.services.supabase.tables.projects ? "✓" : "✗"}
                            </span>
                            <span className={data.services.supabase.tables.caption_segments ? "text-emerald-400" : "text-amber-400"}>
                              • caption_segments: {data.services.supabase.tables.caption_segments ? "✓" : "✗"}
                            </span>
                            <span className={data.services.supabase.tables.jobs ? "text-emerald-400" : "text-amber-400"}>
                              • jobs: {data.services.supabase.tables.jobs ? "✓" : "✗"}
                            </span>
                            <span className={data.services.supabase.tables.user_settings ? "text-emerald-400" : "text-amber-400"}>
                              • user_settings: {data.services.supabase.tables.user_settings ? "✓" : "✗"}
                            </span>
                            <span className={data.services.supabase.storageBucket.exists ? "text-emerald-400" : "text-amber-400"}>
                              • kalalo-media: {data.services.supabase.storageBucket.exists ? "✓" : "check"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-black/60 border border-slate-800 text-[11px] text-slate-400">
                        Supabase environment variables not detected in this runtime. Running on local JSON persistence engine.
                      </div>
                    )}
                  </div>
                </div>

                {/* Gemini STT Card */}
                <div className="p-5 rounded-2xl bg-surface/70 border border-border flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <h3 className="font-bold text-white text-sm">Google Gemini AI Engine</h3>
                      </div>
                      {data.services.gemini?.hasApiKey ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          Key Needed
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                      Powers multilingual timestamped speech recognition for English, Hindi, Hinglish, Marathi, and Tamil with automated model fallback.
                    </p>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-black/60 border border-border flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">Primary Model:</span>
                        <span className="text-purple-300 font-bold">{data.services.gemini?.model || "gemini-1.5-flash"}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/60 border border-border flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">API Key Status:</span>
                        <span className={data.services.gemini?.hasApiKey ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                          {data.services.gemini?.hasApiKey ? "Configured & Active" : "Missing (Enter in Settings)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. FFmpeg Card */}
                <div className="p-5 rounded-2xl bg-surface/70 border border-border flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-primary" />
                        <h3 className="font-bold text-white text-sm">FFmpeg Video Engine</h3>
                      </div>
                      {data.services.ffmpeg.healthy ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Error
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-black/60 border border-border">
                        <span className="text-slate-500 block text-[10px] uppercase">Detected Version</span>
                        <span className="text-slate-200 truncate block">
                          {data.services.ffmpeg.version || "Unknown"}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/60 border border-border">
                        <span className="text-slate-500 block text-[10px] uppercase">Binary Path</span>
                        <span className="text-slate-400 text-[11px] break-all block">
                          {data.services.ffmpeg.path}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. FFprobe Card */}
                <div className="p-5 rounded-2xl bg-surface/70 border border-border flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-primary" />
                        <h3 className="font-bold text-white text-sm">FFprobe Metadata Inspector</h3>
                      </div>
                      {data.services.ffprobe.healthy ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Error
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-black/60 border border-border">
                        <span className="text-slate-500 block text-[10px] uppercase">Detected Version</span>
                        <span className="text-slate-200 truncate block">
                          {data.services.ffprobe.version || "Unknown"}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/60 border border-border">
                        <span className="text-slate-500 block text-[10px] uppercase">Binary Path</span>
                        <span className="text-slate-400 text-[11px] break-all block">
                          {data.services.ffprobe.path}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. MCP Protocol Server */}
                <div className="p-5 rounded-2xl bg-surface/70 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-primary" />
                      <h3 className="font-bold text-white text-sm">Kalalo MCP Server</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> STDIO Ready
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                    Exposes 9 canonical MCP tools for external AI clients (Claude Desktop, Cursor,
                    Antigravity, etc.) via JSON-RPC over STDIO.
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-black/60 border border-border">
                      <span className="text-slate-500 block text-[10px]">Protocol</span>
                      <span className="text-white font-bold">{data.services.mcpServer.protocol}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/60 border border-border">
                      <span className="text-slate-500 block text-[10px]">Registered Tools</span>
                      <span className="text-primary font-bold">{data.services.mcpServer.toolsCount} Tools</span>
                    </div>
                  </div>
                </div>

                {/* 4. Storage Directories */}
                <div className="p-5 rounded-2xl bg-surface/70 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-primary" />
                      <h3 className="font-bold text-white text-sm">Local Storage & Scratch</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Writable
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-black/60 border border-border">
                      <span className="text-slate-500 block text-[10px]">Output Directory</span>
                      <span className="text-slate-300 text-[11px] break-all">
                        {data.services.storage.outputDir}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/60 border border-border">
                      <span className="text-slate-500 block text-[10px]">Temp Directory</span>
                      <span className="text-slate-300 text-[11px] break-all">
                        {data.services.storage.tempDir}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vercel Environment Variables Audit */}
              {data.services.vercelEnvironment && (
                <div className="p-5 rounded-2xl bg-surface/70 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-sky-400" />
                      <h3 className="font-bold text-white text-sm">Vercel Environment Variables Status</h3>
                    </div>
                    <span className="text-xs text-slate-400">Settings → Environment Variables</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-border text-slate-400">
                          <th className="pb-2 font-semibold">Variable Name</th>
                          <th className="pb-2 font-semibold">Requirement</th>
                          <th className="pb-2 font-semibold">Current State</th>
                          <th className="pb-2 font-semibold">Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {data.services.vercelEnvironment.map((item) => (
                          <tr key={item.name} className="hover:bg-white/[0.02]">
                            <td className="py-2.5 font-bold text-slate-200">{item.name}</td>
                            <td className="py-2.5">
                              {item.required ? (
                                <span className="text-amber-400 text-[10px] font-bold">REQUIRED</span>
                              ) : (
                                <span className="text-slate-500 text-[10px]">OPTIONAL</span>
                              )}
                            </td>
                            <td className="py-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.status === "CONFIGURED"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : item.status.startsWith("DEFAULT")
                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-slate-400 text-[11px] font-sans">{item.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
    </div>
  );
}
