"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import {
  Upload,
  Video,
  FileVideo,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Info,
} from "lucide-react";
import { MediaMetadata } from "@/src/types";

export default function CreateProjectPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [mediaInfo, setMediaInfo] = useState<{
    filePath: string;
    fileName: string;
    streamUrl?: string;
    media: MediaMetadata;
  } | null>(null);

  const [language, setLanguage] = useState<"auto" | "hinglish" | "hi" | "en">("hinglish");
  const [provider, setProvider] = useState<"mock" | "gemini" | "openai">("gemini");
  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.gemini?.hasKey) {
          setGeminiConfigured(true);
          setProvider("gemini");
        } else {
          setProvider("mock");
        }
      })
      .catch(() => {});
  }, []);

  // Load pre-generated verified sample video
  const handleLoadSample = async () => {
    setErrorMessage(null);
    setIsUploading(true);
    try {
      const res = await fetch("/api/sample");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load sample video");
      }
      setMediaInfo({
        filePath: data.samplePath,
        fileName: data.fileName,
        streamUrl: data.streamUrl,
        media: data.media,
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUploading(false);
    }
  };

  // Upload local file from drag-and-drop or input
  const handleFileUpload = async (selectedFile: File) => {
    setErrorMessage(null);

    const validTypes = ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska", "audio/mpeg", "audio/wav"];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp4|mov|webm|mkv|mp3|wav)$/i)) {
      setErrorMessage("Unsupported file type. Please upload MP4, MOV, WebM, MKV, MP3, or WAV.");
      return;
    }

    if (selectedFile.size > 150 * 1024 * 1024) {
      setErrorMessage("File exceeds the 150MB maximum upload limit.");
      return;
    }

    setFile(selectedFile);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setMediaInfo({
        filePath: data.filePath,
        fileName: data.fileName,
        streamUrl: data.streamUrl,
        media: data.media,
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUploading(false);
    }
  };

  // Start transcription and redirect to editor
  const handleStartTranscription = async () => {
    if (!mediaInfo) return;
    setErrorMessage(null);
    setIsTranscribing(true);

    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputPath: mediaInfo.filePath,
          language,
          provider,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.error || "Transcription failed");
      }

      // Store project in sessionStorage for the Editor
      const projectSession = {
        mediaPath: mediaInfo.filePath,
        fileName: mediaInfo.fileName,
        duration: mediaInfo.media.durationSeconds,
        streamUrl: mediaInfo.streamUrl,
        segments: data.segments,
        language: data.detectedLanguage || language,
        provider: data.provider || provider,
      };

      sessionStorage.setItem("kalalo_current_project", JSON.stringify(projectSession));
      router.push("/editor");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setIsTranscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0D11] text-white flex">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="pb-6 border-b border-border">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Create New Caption Project
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Upload footage or test with sample media, configure language preferences, and generate timestamped captions.
            </p>
          </div>

          {errorMessage && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-800/40 bg-red-950/30 p-4 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Upload Area */}
          <div className="mt-6 space-y-6">
            {!mediaInfo ? (
              <div className="space-y-4">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className="rounded-2xl border-2 border-dashed border-slate-700 bg-[#101318] p-8 sm:p-12 text-center hover:border-purple-500/60 transition-colors cursor-pointer relative"
                >
                  <input
                    type="file"
                    accept="video/*,audio/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-950/50 border border-purple-800/30 text-purple-400 mb-4">
                    <Upload className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {isUploading ? "Uploading & Inspecting Media..." : "Drag and drop your video file here"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Supports MP4, MOV, WebM, MKV, and audio tracks up to 150MB.
                  </p>
                  <button
                    type="button"
                    className="mt-5 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white pointer-events-none"
                  >
                    Select Local File
                  </button>
                </div>

                {/* Instant Sample Button */}
                <div className="flex items-center justify-between rounded-xl border border-purple-900/30 bg-purple-950/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-900/30 text-purple-300">
                      <FileVideo className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Want to test without uploading a file?</p>
                      <p className="text-[11px] text-slate-400">Load the pre-generated verified 2.0s sample video instantly.</p>
                    </div>
                  </div>

                  <button
                    onClick={handleLoadSample}
                    disabled={isUploading}
                    className="rounded-lg bg-emerald-600/90 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
                  >
                    {isUploading ? "Loading..." : "Load Sample Video"}
                  </button>
                </div>
              </div>
            ) : (
              /* Media Details Preview */
              <div className="rounded-2xl border border-border bg-[#101318] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-950 border border-purple-800/40 text-purple-400">
                      <Video className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{mediaInfo.fileName}</h4>
                      <p className="text-xs text-slate-400">
                        {mediaInfo.media.durationSeconds}s duration • {mediaInfo.media.format}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMediaInfo(null);
                      setFile(null);
                    }}
                    className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                  >
                    Change File
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-lg bg-[#0B0D11] border border-border p-2.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Video Stream</span>
                    <p className="font-semibold text-slate-200 mt-1">
                      {mediaInfo.media.hasVideo ? `${mediaInfo.media.video?.codec} (${mediaInfo.media.video?.width}x${mediaInfo.media.video?.height})` : "None"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#0B0D11] border border-border p-2.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Audio Stream</span>
                    <p className="font-semibold text-slate-200 mt-1">
                      {mediaInfo.media.hasAudio ? `${mediaInfo.media.audio?.codec} (${mediaInfo.media.audio?.channels}ch)` : "None"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#0B0D11] border border-border p-2.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Duration</span>
                    <p className="font-semibold text-slate-200 mt-1">{mediaInfo.media.durationSeconds}s</p>
                  </div>
                  <div className="rounded-lg bg-[#0B0D11] border border-border p-2.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Status</span>
                    <p className="font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Inspected</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Language & Transcription Settings */}
            <div className="rounded-2xl border border-border bg-[#101318] p-5 space-y-5">
              <h3 className="text-sm font-bold text-white">Speech-to-Text Configuration</h3>

              {/* Language Radio Chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Target Speech Language
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "hinglish", label: "Hinglish", desc: "Mixed Hindi-English" },
                    { id: "hi", label: "Hindi (हिंदी)", desc: "Devanagari script" },
                    { id: "en", label: "English", desc: "Standard English" },
                    { id: "auto", label: "Auto-Detect", desc: "Model decides" },
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLanguage(l.id as any)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        language === l.id
                          ? "border-purple-500 bg-purple-950/40 text-purple-200 shadow-inner"
                          : "border-border bg-[#0B0D11] text-slate-400 hover:text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      <p className="text-xs font-bold text-white">{l.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{l.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Speech-to-Text Provider
                  </label>
                  <Link
                    href="/settings"
                    className="text-[11px] text-[#FDC537] hover:underline"
                  >
                    Manage Keys in Settings &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setProvider("gemini")}
                    className={`rounded-xl border p-3.5 text-left transition-all ${
                      provider === "gemini"
                        ? "border-[#FDC537] bg-[#FDC537]/10 text-white"
                        : "border-[#21232E] bg-[#0C0D11] text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Google Gemini</span>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${
                        geminiConfigured
                          ? "text-emerald-400 bg-emerald-950/60 border-emerald-800/40"
                          : "text-amber-400 bg-amber-950/60 border-amber-800/40"
                      }`}>
                        {geminiConfigured ? "Key Active" : "Requires Key"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      User-owned API key. Multimodal speech recognition with JSON segment schema.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProvider("mock")}
                    className={`rounded-xl border p-3.5 text-left transition-all ${
                      provider === "mock"
                        ? "border-[#FDC537] bg-[#FDC537]/10 text-white"
                        : "border-[#21232E] bg-[#0C0D11] text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Deterministic Mock</span>
                      <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                        Offline Ready
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Instant verification without external API charges or network delays.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProvider("openai")}
                    className={`rounded-xl border p-3.5 text-left transition-all ${
                      provider === "openai"
                        ? "border-[#FDC537] bg-[#FDC537]/10 text-white"
                        : "border-[#21232E] bg-[#0C0D11] text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">OpenAI Whisper</span>
                      <span className="text-[9px] font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700">
                        Platform Key
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Uses whisper-1 with word timestamps. Requires server OPENAI_API_KEY.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* Launch Action */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleStartTranscription}
                disabled={!mediaInfo || isTranscribing}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-purple-600/25 hover:from-purple-500 hover:to-indigo-500 transition-all hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isTranscribing ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Transcribing Media...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Captions & Open Editor</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
    </div>
  );
}
