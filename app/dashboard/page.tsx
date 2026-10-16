"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  Plus,
  Play,
  Clock,
  Sparkles,
  Search,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Film,
  Trash2,
  Edit3,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Project } from "@/src/types";

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User & Projects state
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Upload & Transcription state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<string>("");
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [uploadedProject, setUploadedProject] = useState<Project | null>(null);

  // Menu popover state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) setCurrentUser(data.user);
      }
    } catch {}
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (e) {
      console.error("Failed to fetch projects:", e);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchProjects();
  }, []);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Full Upload & Automatic Transcription Pipeline
  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setProcessingProgress(10);
    setProcessingStage("Preparing video file...");
    setProcessingError(null);
    setUploadedProject(null);

    // Read client video metadata using HTML5 Video element
    const readVideoMeta = (): Promise<{ duration?: number; width?: number; height?: number }> => {
      return new Promise((resolve) => {
        try {
          const v = document.createElement("video");
          v.preload = "metadata";
          v.onloadedmetadata = () => {
            const meta = {
              duration: v.duration && !isNaN(v.duration) ? v.duration : undefined,
              width: v.videoWidth || undefined,
              height: v.videoHeight || undefined,
            };
            URL.revokeObjectURL(v.src);
            resolve(meta);
          };
          v.onerror = () => resolve({});
          v.src = URL.createObjectURL(file);
        } catch {
          resolve({});
        }
      });
    };

    try {
      const clientMeta = await readVideoMeta();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("autoTranscribe", "true");
      if (clientMeta.duration) formData.append("duration", String(clientMeta.duration));
      if (clientMeta.width) formData.append("width", String(clientMeta.width));
      if (clientMeta.height) formData.append("height", String(clientMeta.height));

      setProcessingStage(`Uploading video bytes (${(file.size / (1024 * 1024)).toFixed(1)}MB)...`);

      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");
        xhr.withCredentials = true;

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && event.total > 0) {
            const pct = Math.round((event.loaded / event.total) * 100);
            const scaledPct = Math.min(65, Math.max(10, Math.round(10 + pct * 0.55)));
            setProcessingProgress(scaledPct);
            setProcessingStage(`Uploading video bytes (${pct}% of ${(event.total / (1024 * 1024)).toFixed(1)}MB)...`);
          }
        };

        xhr.onload = () => {
          setProcessingProgress(75);
          setProcessingStage("Extracting speech & transcribing audio with Gemini AI...");
          try {
            const json = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(json);
            } else {
              reject(new Error(json.error || `Upload failed with HTTP ${xhr.status}`));
            }
          } catch {
            reject(new Error(`Failed to parse upload response: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network connection error during upload. Please verify your internet connection and retry."));
        xhr.ontimeout = () => reject(new Error("Upload request timed out on the server. Please try with a shorter clip or retry."));
        xhr.send(formData);
      });

      setProcessingProgress(95);
      setProcessingStage("Validating generated subtitle segments...");

      const project: Project = data.project;
      setUploadedProject(project);

      // Save to sessionStorage for instant editor load
      const projectSession = {
        id: project.id,
        mediaPath: project.filePath,
        fileName: project.fileName,
        duration: project.durationSeconds,
        streamUrl: project.streamUrl,
        segments: project.segments,
        language: project.language,
        provider: project.provider,
        aspectRatio: project.aspectRatio,
        presetId: project.presetId,
      };
      sessionStorage.setItem("kalalo_current_project", JSON.stringify(projectSession));

      setProcessingProgress(100);

      if (data.transcriptionError) {
        setProcessingStage("Video uploaded! Opening studio editor...");
        setProcessingError(data.transcriptionError);
      } else {
        setProcessingStage("Captions generated successfully! Opening studio editor...");
      }

      setTimeout(() => {
        router.push(`/editor?projectId=${project.id}`);
      }, 800);

      // Refresh recent projects
      fetchProjects();
    } catch (err: unknown) {
      setProcessingError(err instanceof Error ? err.message : "Failed to process video");
      setIsProcessing(false);
    }
  };

  // Open Project in Editor
  const handleOpenProject = (project: Project) => {
    const projectSession = {
      id: project.id,
      mediaPath: project.filePath,
      fileName: project.fileName,
      duration: project.durationSeconds,
      streamUrl: project.streamUrl,
      segments: project.segments,
      language: project.language,
      provider: project.provider,
      aspectRatio: project.aspectRatio,
      presetId: project.presetId,
      customPreset: project.customPreset,
    };
    sessionStorage.setItem("kalalo_current_project", JSON.stringify(projectSession));
    router.push(`/editor?projectId=${project.id}`);
  };

  // Delete Project
  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setActiveMenuId(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered projects
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0C0D11] text-white flex select-none font-sans">
      {/* Sidebar matching Kalakar reference */}
      <Sidebar />

      {/* Main Studio Viewport */}
      <main className="flex-1 px-6 md:px-12 py-6 max-w-7xl mx-auto w-full flex flex-col justify-between">
        <div className="space-y-6">
          {/* Top Bar: Search, Upgrade, Profile */}
          <header className="flex items-center justify-between gap-4 pb-3 border-b border-[#1A1C24]">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#14161E] border border-[#232634] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
              />
            </div>

            {/* Action buttons on top right */}
            <div className="flex items-center gap-3">
              <Link
                href="/settings"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold transition-all shadow-sm shadow-emerald-500/10"
              >
                <span>Upgrade ↗</span>
              </Link>


              {/* Creator Profile Avatar */}
              <Link
                href="/profile"
                className="flex items-center gap-2 pl-1 group hover:opacity-90 transition-opacity"
                title="View Creator Profile"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-black text-xs shadow-sm ring-1 ring-emerald-500/30 group-hover:ring-emerald-400">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "C"}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors truncate max-w-[120px]">
                    {currentUser?.name || "Creator"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Profile ↗</span>
                </div>
              </Link>
            </div>
          </header>

          {/* LARGE DRAG & DROP UPLOAD AREA matching Kalakar Reference */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed p-10 md:p-14 text-center cursor-pointer transition-all duration-300 ${
              isDragging
                ? "border-emerald-400 bg-emerald-500/5 scale-[1.005] shadow-2xl shadow-emerald-500/10"
                : isProcessing
                ? "border-emerald-500/40 bg-[#12151D] cursor-default"
                : "border-[#252836] bg-[#12151E] hover:border-emerald-500/40 hover:bg-[#141822]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!isProcessing ? (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#1B1E29] border border-[#2C3040] flex items-center justify-center text-emerald-400 shadow-md">
                  <Upload className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Drop your videos here or click to upload
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    Max: 2:00 minutes, 1GB • Supports: MP4, MOV, WEBM
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-mono bg-[#1B1E29] text-emerald-400 border border-emerald-500/20 font-bold">
                    Auto Gemini Captions
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-mono bg-[#1B1E29] text-slate-400 border border-[#2A2E3E]">
                    FFmpeg Video Burn-in
                  </span>
                </div>
              </div>
            ) : (
              /* ACTIVE UPLOADING & TRANSCRIBING STATE */
              <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-full border-3 border-emerald-500/20 border-t-emerald-400 animate-spin flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">{processingStage}</h4>
                  <p className="text-xs text-slate-400">
                    Transcribing speech with Google Gemini AI and generating captions...
                  </p>
                </div>

                {/* Real Progress Bar */}
                <div className="w-full bg-[#1A1D28] rounded-full h-2.5 overflow-hidden border border-[#2B2F40]">
                  <div
                    style={{ width: `${processingProgress}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                  />
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {processingProgress}%
                </span>

                {/* Error Banner with Retry / Settings actions */}
                {processingError && (
                  <div className="w-full p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-2 text-left">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Transcription Note:</p>
                        <p className="text-[11px] text-amber-200 mt-0.5">{processingError}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        href="/settings"
                        className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] border border-amber-500/30"
                      >
                        Configure Gemini Key
                      </Link>
                      {uploadedProject && (
                        <button
                          onClick={() => router.push(`/editor?projectId=${uploadedProject.id}`)}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-[11px]"
                        >
                          Open in Editor Anyway
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RECENT VIDEOS SECTION matching Kalakar reference */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Recent Videos</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#161822] text-slate-400 border border-[#262836]">
                  {filteredProjects.length}
                </span>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            </div>

            {loadingProjects ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 rounded-2xl bg-[#12151E] animate-pulse border border-[#202330]" />
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-[#232636] bg-[#12151E]/50">
                <Film className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-300">No projects found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Upload a video above to generate AI captions and start editing.
                </p>
              </div>
            ) : (
              /* Real 3-column video grid matching Kalakar layout */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProjects.map((project) => {
                  const statusColors: Record<string, string> = {
                    ready_to_edit: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                    transcribing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    completed: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                    rendering: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                    uploaded: "bg-slate-500/10 text-slate-400 border-slate-500/20",
                    failed: "bg-red-500/10 text-red-400 border-red-500/20",
                  };

                  return (
                    <div
                      key={project.id}
                      onClick={() => handleOpenProject(project)}
                      className="group rounded-2xl bg-[#13161F] border border-[#212432] overflow-hidden hover:border-emerald-500/40 hover:bg-[#161924] transition-all cursor-pointer shadow-md flex flex-col justify-between"
                    >
                      {/* Video Thumbnail Viewport */}
                      <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
                        <video
                          src={project.streamUrl}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100"
                          muted
                          preload="metadata"
                        />

                        {/* Play Icon Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur border border-white/20 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-black transition-all shadow-xl">
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </div>
                        </div>

                        {/* Duration Badge */}
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/80 text-white border border-white/10">
                          {project.durationSeconds.toFixed(1)}s
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            statusColors[project.status] || statusColors.uploaded
                          }`}
                        >
                          {project.status.replace(/_/g, " ")}
                        </span>
                      </div>

                      {/* Card Content Footer */}
                      <div className="p-4 flex items-center justify-between">
                        <div className="space-y-1 truncate pr-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                              {project.name}
                            </h3>
                            {(project as any).isDemo && (
                              <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wide">
                                Demo Project
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {new Date(project.updatedAt).toLocaleDateString()} • {project.language.toUpperCase()} ({project.segments.length} captions)
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleDeleteProject(project.id, e)}
                            title="Delete project"
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Minimal Footer */}
        <footer className="pt-8 text-center text-[11px] text-slate-500 border-t border-[#161822] mt-10">
          <span>Kalalo AI Caption Studio • Powered by Google Gemini &amp; FFmpeg</span>
        </footer>
      </main>
    </div>
  );
}
