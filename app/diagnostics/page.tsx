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

                {/* 4. Speech-to-Text Engine */}
                <div className="p-5 rounded-2xl bg-surface/70 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h3 className="font-bold text-white text-sm">Speech-to-Text Provider</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                      {data.services.sttProvider.activeProvider.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                    Mode: <strong className="text-white">{data.services.sttProvider.mode}</strong>
                  </p>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-black/60 border border-border flex items-center justify-between">
                      <span className="text-slate-500 text-[11px]">Model:</span>
                      <span className="text-slate-200">{data.services.sttProvider.model}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/60 border border-border flex items-center justify-between">
                      <span className="text-slate-500 text-[11px]">OpenAI API Key:</span>
                      <span
                        className={
                          data.services.sttProvider.hasApiKey
                            ? "text-emerald-400 font-bold"
                            : "text-slate-400"
                        }
                      >
                        {data.services.sttProvider.hasApiKey
                          ? "Configured (Hidden)"
                          : "Not Set (Using Mock Engine)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Storage Directories */}
                <div className="p-5 rounded-2xl bg-surface/70 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-primary" />
                      <h3 className="font-bold text-white text-sm">Storage Directories</h3>
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

                {/* 6. Jobs Execution Stats */}
                <div className="p-5 rounded-2xl bg-surface/70 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      <h3 className="font-bold text-white text-sm">Jobs Engine</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      In-Memory State
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
                    <div className="p-3 rounded-lg bg-black/60 border border-border">
                      <span className="text-slate-500 block text-[10px]">Total Jobs</span>
                      <span className="text-base font-bold text-white">
                        {data.services.jobs.total}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-black/60 border border-border">
                      <span className="text-slate-500 block text-[10px]">Completed</span>
                      <span className="text-base font-bold text-emerald-400">
                        {data.services.jobs.completed}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-black/60 border border-border">
                      <span className="text-slate-500 block text-[10px]">Running</span>
                      <span className="text-base font-bold text-primary">
                        {data.services.jobs.running}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions on Enabling OpenAI Whisper */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <FileCode className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      Switching between Mock and Real OpenAI Whisper
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      By default, Kalalo operates in zero-config offline mode with deterministic mock
                      transcription so you can test all video rendering and subtitle features
                      immediately. To use real OpenAI Whisper transcription:
                    </p>
                    <div className="mt-2.5 p-3 rounded-xl bg-black/80 font-mono text-[11px] text-slate-300 border border-slate-800 space-y-1">
                      <p className="text-slate-500"># In your .env file:</p>
                      <p className="text-primary">KALALO_STT_PROVIDER=openai</p>
                      <p className="text-primary">OPENAI_API_KEY=sk-proj-your-key-here</p>
                      <p className="text-slate-500"># Then restart the dev server: npm run dev</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
    </div>
  );
}
