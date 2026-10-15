"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Pause,
  Download,
  Share2,
  Sparkles,
  Plus,
  Trash2,
  Split,
  Combine,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Type,
  Palette,
  Eye,
  Film,
  FileText,
  Clock,
  Layers,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  X,
  Volume2,
  VolumeX,
  Undo2,
  Redo2,
  ChevronUp,
  ChevronDown,
  Scissors,
  Music,
  Video,
  Settings2,
  SlidersHorizontal,
  FolderOpen,
  Move,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Underline as UnderlineIcon,
  Shield,
  Layers3,
  RotateCcw,
  Sparkle,
  Search,
} from "lucide-react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Timeline } from "@/components/Timeline";
import { AspectRatio, CaptionSegment, PresetStyle, SupportedLanguage, Project } from "@/src/types";
import { ORIGINAL_PRESETS, PresetsService } from "@/src/presets/presets";
import { CaptionsService } from "@/src/services/captions.service";

// Helper: Convert ASS color &H[AA]BBGGRR& to #RRGGBB
function assToHex(assColor?: string, fallback = "#ffffff"): string {
  if (!assColor) return fallback;
  if (assColor.startsWith("#")) return assColor;
  if (assColor.startsWith("&H")) {
    const raw = assColor.replace(/&H|&/g, "");
    if (raw.length >= 6) {
      const bgr = raw.slice(-6);
      const bb = bgr.slice(0, 2);
      const gg = bgr.slice(2, 4);
      const rr = bgr.slice(4, 6);
      return `#${rr}${gg}${bb}`;
    }
  }
  return fallback;
}

// Helper: Convert #RRGGBB to ASS &H00BBGGRR&
function hexToAss(hex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length === 6) {
    const rr = clean.slice(0, 2).toUpperCase();
    const gg = clean.slice(2, 4).toUpperCase();
    const bb = clean.slice(4, 6).toUpperCase();
    return `&H00${bb}${gg}${rr}&`;
  }
  return "&H00FFFFFF&";
}

// Helper: Format seconds to mm:ss.ms
function formatTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00.00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
}

// Helper: Parse mm:ss.ms to seconds
function parseTimestamp(timeStr: string, fallback: number): number {
  try {
    const parts = timeStr.trim().split(":");
    if (parts.length === 2) {
      const mins = parseFloat(parts[0]);
      const secs = parseFloat(parts[1]);
      if (!isNaN(mins) && !isNaN(secs)) {
        return Math.max(0, mins * 60 + secs);
      }
    } else if (parts.length === 1) {
      const secs = parseFloat(parts[0]);
      if (!isNaN(secs)) return Math.max(0, secs);
    }
  } catch {
    // fallback
  }
  return fallback;
}

type EditorTab = "captions" | "styles" | "position" | "design" | "layers" | "video" | "audio" | "export";
type PresetCategory = "All" | "Social" | "Professional" | "Cinematic" | "Educational" | "Accessibility";

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Project state
  const [projectId, setProjectId] = useState<string | null>(null);
  const [mediaPath, setMediaPath] = useState<string>("");
  const [fileName, setFileName] = useState<string>("sample-video.mp4");
  const [duration, setDuration] = useState<number>(5.4);
  const [streamUrl, setStreamUrl] = useState<string>("");
  const [segments, setSegments] = useState<CaptionSegment[]>([]);

  // Transcription state
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState<number>(0);
  const [transcriptionStage, setTranscriptionStage] = useState<string>("");
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  // Undo / Redo History state
  const [history, setHistory] = useState<CaptionSegment[][]>([]);
  const [future, setFuture] = useState<CaptionSegment[][]>([]);

  // Player & UI state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [activeTab, setActiveTab] = useState<EditorTab>("styles");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [templateFilter, setTemplateFilter] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory>("All");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  // Video Editing Controls state
  const [trimEnabled, setTrimEnabled] = useState<boolean>(false);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(5.4);
  const [muteAudio, setMuteAudio] = useState<boolean>(false);
  const [resolution, setResolution] = useState<"1080p" | "720p">("1080p");

  // Person Cutout / Captions Behind Subject state
  const [enablePersonCutout, setEnablePersonCutout] = useState<boolean>(false);
  const [cutoutPreviewUrl, setCutoutPreviewUrl] = useState<string | null>(null);
  const [isGeneratingCutoutPreview, setIsGeneratingCutoutPreview] = useState<boolean>(false);
  const [cutoutError, setCutoutError] = useState<string | null>(null);

  // Audio Extraction state
  const [isExtractingAudio, setIsExtractingAudio] = useState<boolean>(false);
  const [extractedAudio, setExtractedAudio] = useState<{
    streamUrl: string;
    downloadUrl: string;
    format: string;
    sizeBytes?: number;
    durationSeconds?: number;
  } | null>(null);
  const [audioExtractError, setAudioExtractError] = useState<string | null>(null);

  // Presets & Style state
  const [selectedPresetId, setSelectedPresetId] = useState<string>("kalalo-clean-bold");
  const [currentStyle, setCurrentStyle] = useState<PresetStyle>({
    ...ORIGINAL_PRESETS[0],
    positionX: 50,
    positionY: 82,
    alignment: 2,
    backgroundTreatment: "none",
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // Export Subtitle Modal state
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<"srt" | "vtt">("srt");
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportedContent, setExportedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Render Modal state
  const [renderModalOpen, setRenderModalOpen] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderStage, setRenderStage] = useState<string>("Initializing...");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [renderResult, setRenderResult] = useState<{
    streamUrl?: string;
    downloadUrl?: string;
    outputPath?: string;
    width?: number;
    height?: number;
    durationSeconds?: number;
    personCutout?: boolean;
  } | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  // History Helper to record state transitions
  const commitSegmentsChange = useCallback((newSegments: CaptionSegment[] | ((prev: CaptionSegment[]) => CaptionSegment[])) => {
    setSegments((prev) => {
      const next = typeof newSegments === "function" ? newSegments(prev) : newSegments;
      setHistory((h) => [...h.slice(-29), prev]);
      setFuture([]);
      return next;
    });
  }, []);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [segments, ...f]);
    setSegments(prev);
  }, [history, segments]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h, segments]);
    setSegments(next);
  }, [future, segments]);

  // Keyboard shortcuts (Ctrl+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Execute Auto-Transcription
  const triggerTranscription = async (path: string, pid?: string) => {
    setIsTranscribing(true);
    setTranscriptionProgress(25);
    setTranscriptionStage("Extracting audio and transcribing with Gemini AI...");
    setTranscriptionError(null);

    try {
      let res;
      if (pid) {
        res = await fetch(`/api/projects/${pid}/transcribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: "auto", provider: "gemini" }),
        });
      } else {
        res = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputPath: path, language: "auto", provider: "gemini" }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.error || "Transcription failed");
      }

      const generatedSegments = data.segments || [];
      const normalized = CaptionsService.normalizeSegments(generatedSegments, duration);
      setSegments(normalized);
      if (normalized.length > 0) {
        setSelectedSegmentId(normalized[0].id);
      }
      setIsTranscribing(false);
      setTranscriptionProgress(100);
      setTranscriptionStage("Captions ready!");
    } catch (err: unknown) {
      setIsTranscribing(false);
      setTranscriptionError(err instanceof Error ? err.message : String(err));
    }
  };

  // Load project on mount
  useEffect(() => {
    const urlProjectId = searchParams.get("projectId");
    const isSampleParam = searchParams.get("sample") === "true";

    if (urlProjectId) {
      setProjectId(urlProjectId);
      fetch(`/api/projects/${urlProjectId}`)
        .then((res) => res.json())
        .then((data: any) => {
          const p: Project | undefined = data?.project || data;
          if (p && p.filePath) {
            setMediaPath(p.filePath);
            setFileName(p.fileName);
            setDuration(p.durationSeconds);
            setTrimEnd(p.durationSeconds);
            setStreamUrl(p.streamUrl || `/api/media/stream?path=${encodeURIComponent(p.filePath)}`);
            if (p.aspectRatio) setAspectRatio(p.aspectRatio);

            if (Array.isArray(p.segments) && p.segments.length > 0) {
              const normalized = CaptionsService.normalizeSegments(p.segments, p.durationSeconds);
              setSegments(normalized);
              setSelectedSegmentId(normalized[0].id);
            } else {
              triggerTranscription(p.filePath, p.id);
            }
          }
        })
        .catch((e) => console.error(e));
      return;
    }

    // Try reading project from sessionStorage
    const stored = typeof window !== "undefined" ? sessionStorage.getItem("kalalo_current_project") : null;
    if (stored && !isSampleParam) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.id) setProjectId(parsed.id);
        if (parsed.mediaPath) setMediaPath(parsed.mediaPath);
        if (parsed.fileName) setFileName(parsed.fileName);
        if (parsed.duration) {
          setDuration(parsed.duration);
          setTrimEnd(parsed.duration);
        }
        if (parsed.streamUrl) setStreamUrl(parsed.streamUrl);
        if (parsed.aspectRatio) setAspectRatio(parsed.aspectRatio);

        if (Array.isArray(parsed.segments) && parsed.segments.length > 0) {
          const normalized = CaptionsService.normalizeSegments(parsed.segments, parsed.duration);
          setSegments(normalized);
          setSelectedSegmentId(normalized[0].id);
        } else if (parsed.mediaPath) {
          triggerTranscription(parsed.mediaPath, parsed.id);
        }
        return;
      } catch (e) {
        console.error("Failed to parse sessionStorage project:", e);
      }
    }

    // Fallback: Fetch verified sample video from /api/sample
    fetch("/api/sample")
      .then((res) => res.json())
      .then((data) => {
        if (data.samplePath) {
          setMediaPath(data.samplePath);
          setFileName(data.fileName || "sample-video.mp4");
          setStreamUrl(data.streamUrl || `/api/media/stream?path=${encodeURIComponent(data.samplePath)}`);
          if (data.media?.durationSeconds) {
            setDuration(data.media.durationSeconds);
            setTrimEnd(data.media.durationSeconds);
          }
          const defaultSegments: CaptionSegment[] = [
            {
              id: "gemini-seg-1",
              start: 0.05,
              end: 1.80,
              text: "Welcome to Kalalo.",
              language: "en",
              confidence: 0.98,
            },
            {
              id: "gemini-seg-2",
              start: 2.10,
              end: 4.80,
              text: "Create crisp captions with Google Gemini AI.",
              language: "en",
              confidence: 0.98,
            },
          ];
          setSegments(defaultSegments);
          setSelectedSegmentId("gemini-seg-1");
        }
      })
      .catch((e) => console.error("Failed to load sample:", e));
  }, [searchParams]);

  // Select Preset Handler (Preserves existing customized position!)
  const handleSelectPreset = (preset: PresetStyle) => {
    setSelectedPresetId(preset.id);
    setCurrentStyle((prev) => ({
      ...preset,
      positionX: prev.positionX ?? preset.positionX ?? 50,
      positionY: prev.positionY ?? preset.positionY ?? 82,
      alignment: prev.alignment ?? preset.alignment ?? 2,
    }));
  };

  // Live Position Update from interactive dragging on video
  const handlePositionChange = ({ x, y }: { x: number; y: number }) => {
    setCurrentStyle((prev) => ({
      ...prev,
      positionX: x,
      positionY: y,
    }));
  };

  // Quick Vertical Placement Buttons
  const handleSetVerticalPos = (yPct: number) => {
    setCurrentStyle((prev) => ({ ...prev, positionY: yPct }));
  };

  // Quick Horizontal Placement Buttons
  const handleSetHorizontalPos = (xPct: number) => {
    setCurrentStyle((prev) => ({ ...prev, positionX: xPct }));
  };

  // Position Nudge (+/- 1%)
  const handleNudgePosition = (axis: "x" | "y", delta: number) => {
    setCurrentStyle((prev) => {
      if (axis === "x") {
        const cur = prev.positionX ?? 50;
        return { ...prev, positionX: Math.min(95, Math.max(5, cur + delta)) };
      } else {
        const cur = prev.positionY ?? 80;
        return { ...prev, positionY: Math.min(95, Math.max(5, cur + delta)) };
      }
    });
  };

  // Reset to Default Position
  const handleResetPosition = () => {
    setCurrentStyle((prev) => ({
      ...prev,
      positionX: 50,
      positionY: 82,
      alignment: 2,
    }));
  };

  // Person Cutout Toggle & Preview Generator
  const handleTogglePersonCutout = async (enabled: boolean) => {
    setEnablePersonCutout(enabled);
    if (enabled && !cutoutPreviewUrl && mediaPath) {
      setIsGeneratingCutoutPreview(true);
      setCutoutError(null);
      try {
        const res = await fetch("/api/media/cutout-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputPath: mediaPath }),
        });
        const data = await res.json();
        if (data.success && data.previewUrl) {
          setCutoutPreviewUrl(data.previewUrl);
        } else if (data.available === false) {
          setCutoutError(data.message || "Person cutout is currently unavailable.");
        }
      } catch {
        setCutoutError("Failed to generate person cutout preview.");
      } finally {
        setIsGeneratingCutoutPreview(false);
      }
    }
  };

  // Live Segment Validation (Debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsValidating(true);
      try {
        const res = await fetch("/api/segments/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ segments, durationSeconds: duration }),
        });
        const data = await res.json();
        if (data.valid) {
          setValidationErrors([]);
        } else {
          setValidationErrors(data.errors || []);
        }
      } catch {
        // network fallback
      } finally {
        setIsValidating(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [segments, duration]);

  // Segment Edit Handlers
  const handleUpdateSegment = (id: string, updates: Partial<CaptionSegment>) => {
    commitSegmentsChange((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, ...updates } : seg))
    );
  };

  const handleAddSegment = () => {
    const newStart = Math.min(currentTime, Math.max(0, duration - 1));
    const newEnd = Math.min(newStart + 1.2, duration);
    const newSeg: CaptionSegment = {
      id: `seg-${Date.now()}`,
      start: parseFloat(newStart.toFixed(2)),
      end: parseFloat(newEnd.toFixed(2)),
      text: "Naya caption segment...",
      language: "en",
    };

    commitSegmentsChange((prev) => {
      const next = [...prev, newSeg].sort((a, b) => a.start - b.start);
      return next;
    });
    setSelectedSegmentId(newSeg.id);
    setSeekTime(newStart);
  };

  const handleDeleteSegment = (id: string) => {
    if (segments.length <= 1) {
      alert("At least one caption segment is required.");
      return;
    }
    commitSegmentsChange((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSplitSegment = (id: string) => {
    const target = segments.find((s) => s.id === id);
    if (!target) return;

    let splitAt = currentTime;
    if (splitAt <= target.start || splitAt >= target.end) {
      splitAt = (target.start + target.end) / 2;
    }
    splitAt = parseFloat(splitAt.toFixed(2));

    const words = target.text.split(" ");
    const half = Math.ceil(words.length / 2);
    const part1 = words.slice(0, half).join(" ") || target.text;
    const part2 = words.slice(half).join(" ") || "...";

    const seg1: CaptionSegment = {
      ...target,
      end: splitAt,
      text: part1,
    };
    const seg2: CaptionSegment = {
      id: `seg-${Date.now()}`,
      start: splitAt,
      end: target.end,
      text: part2,
      language: target.language,
    };

    commitSegmentsChange((prev) => {
      const index = prev.findIndex((s) => s.id === id);
      const next = [...prev];
      next.splice(index, 1, seg1, seg2);
      return next;
    });
  };

  const handleMergeNext = (id: string) => {
    const index = segments.findIndex((s) => s.id === id);
    if (index === -1 || index >= segments.length - 1) return;

    const current = segments[index];
    const nextSeg = segments[index + 1];

    const merged: CaptionSegment = {
      id: current.id,
      start: current.start,
      end: nextSeg.end,
      text: `${current.text} ${nextSeg.text}`.trim(),
      language: current.language,
    };

    commitSegmentsChange((prev) => {
      const next = [...prev];
      next.splice(index, 2, merged);
      return next;
    });
  };

  const handleMoveSegment = (id: string, direction: "up" | "down") => {
    const idx = segments.findIndex((s) => s.id === id);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === segments.length - 1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    commitSegmentsChange((prev) => {
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
  };

  // Audio Extraction via FFmpeg
  const handleExtractAudio = async (format: "mp3" | "wav" = "mp3") => {
    if (!mediaPath) return;
    setIsExtractingAudio(true);
    setAudioExtractError(null);
    try {
      const res = await fetch("/api/media/extract-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputPath: mediaPath, mediaPath, format }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audio extraction failed");
      setExtractedAudio(data);
    } catch (err: unknown) {
      setAudioExtractError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExtractingAudio(false);
    }
  };

  // Subtitle Export (SRT / WebVTT)
  const handleOpenExportSubtitles = async () => {
    setExportModalOpen(true);
    setExporting(true);
    try {
      const res = await fetch("/api/subtitles/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segments,
          format: exportFormat,
          language: "en",
        }),
      });
      const data = await res.json();
      if (data.content) {
        setExportedContent(data.content);
      }
    } catch (err) {
      console.error("Subtitle export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleFormatChange = async (format: "srt" | "vtt") => {
    setExportFormat(format);
    setExporting(true);
    try {
      const res = await fetch("/api/subtitles/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segments,
          format,
          language: "en",
        }),
      });
      const data = await res.json();
      if (data.content) {
        setExportedContent(data.content);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadSubtitle = () => {
    if (!exportedContent) return;
    const blob = new Blob([exportedContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName.replace(/\.[^/.]+$/, "")}.${exportFormat}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySubtitle = () => {
    if (!exportedContent) return;
    navigator.clipboard.writeText(exportedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Video Caption Burn-In Render
  const handleStartRender = async () => {
    setRenderModalOpen(true);
    setIsRendering(true);
    setRenderProgress(10);
    setRenderStage("Normalizing segments and starting FFmpeg engine...");
    setRenderError(null);
    setRenderResult(null);

    if (!mediaPath) {
      setRenderError("No video media loaded. Please ensure a video is selected before exporting.");
      setIsRendering(false);
      return;
    }

    // Normalize segments before dispatching to backend
    const normalized = CaptionsService.normalizeSegments(segments, duration);

    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputPath: mediaPath,
          segments: normalized,
          presetId: selectedPresetId,
          customPreset: currentStyle,
          aspectRatio,
          trimStart: trimEnabled ? trimStart : undefined,
          trimEnd: trimEnabled ? trimEnd : undefined,
          muteAudio,
          resolution,
          personCutout: enablePersonCutout,
          async: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorDetails = data.details?.errors?.length
          ? `Validation failed:\n• ${data.details.errors.join("\n• ")}`
          : data.error?.message || data.error || "Rendering failed to start";
        throw new Error(errorDetails);
      }

      const jobId = data.jobId;
      setActiveJobId(jobId);

      const pollInterval = setInterval(async () => {
        try {
          const jobRes = await fetch(`/api/jobs/${jobId}`);
          if (!jobRes.ok) return;
          const jobData = await jobRes.json();

          if (jobData.progress !== undefined) {
            setRenderProgress(jobData.progress);
          }
          if (jobData.stage) {
            setRenderStage(jobData.stage.replace(/_/g, " "));
          }

          if (jobData.status === "completed") {
            clearInterval(pollInterval);
            setIsRendering(false);
            setRenderProgress(100);
            setRenderStage("Render complete!");
            const outPath = jobData.result?.outputPath;
            setRenderResult({
              streamUrl: jobData.result?.streamUrl || `/api/media/stream?path=${encodeURIComponent(outPath)}`,
              downloadUrl: jobData.result?.downloadUrl || `/api/media/stream?path=${encodeURIComponent(outPath)}&download=true&filename=kalalo-captioned.mp4`,
              outputPath: outPath,
              width: jobData.result?.width,
              height: jobData.result?.height,
              durationSeconds: jobData.result?.durationSeconds,
              personCutout: jobData.result?.personCutout,
            });
          } else if (jobData.status === "failed") {
            clearInterval(pollInterval);
            setIsRendering(false);
            const errDetails = jobData.error?.details?.errors?.length
              ? `Validation failed:\n• ${jobData.error.details.errors.join("\n• ")}`
              : jobData.error?.message || "FFmpeg rendering failed";
            setRenderError(errDetails);
          } else if (jobData.status === "cancelled") {
            clearInterval(pollInterval);
            setIsRendering(false);
            setRenderError("Rendering was cancelled by user.");
          }
        } catch {
          // ignore intermittent glitches
        }
      }, 500);
    } catch (err: unknown) {
      setIsRendering(false);
      setRenderError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleCancelRender = async () => {
    if (activeJobId) {
      await fetch(`/api/jobs/${activeJobId}`, { method: "POST" }).catch(() => {});
      setIsRendering(false);
      setRenderModalOpen(false);
    }
  };

  // Filtered Segments for search
  const filteredSegments = useMemo(() => {
    if (!searchFilter.trim()) return segments;
    const q = searchFilter.toLowerCase();
    return segments.filter((s) => s.text.toLowerCase().includes(q));
  }, [segments, searchFilter]);

  // Filtered Presets for category and search
  const filteredPresets = useMemo(() => {
    let list = [...ORIGINAL_PRESETS];
    if (selectedCategory !== "All") {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (templateFilter.trim()) {
      const q = templateFilter.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return list;
  }, [selectedCategory, templateFilter]);

  return (
    <div className="flex flex-col h-screen bg-[#0C0D11] text-slate-100 font-sans overflow-hidden">
      {/* STUDIO HEADER */}
      <header className="h-14 px-4 border-b border-[#1B1E26] bg-[#0E1015] flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#181B24] text-slate-400 hover:text-white transition-colors text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-[#262A38]" />

          <div className="flex items-center gap-2">
            <span className="text-base font-black tracking-tight text-white flex items-center gap-1">
              Kalalo <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">Studio</span>
            </span>
            <span className="text-xs text-slate-400 font-medium truncate max-w-[200px]" title={fileName}>
              / {fileName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtitles Export (SRT / VTT) */}
          <button
            onClick={handleOpenExportSubtitles}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#262A38] bg-[#12141C] hover:bg-[#181B26] text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Subtitles</span>
          </button>

          {/* Export Video Burn-In Render Button */}
          <button
            onClick={handleStartRender}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Export Video</span>
          </button>
        </div>
      </header>

      {/* TRANSCRIPTION IN-PROGRESS / RETRY BANNER */}
      {isTranscribing && (
        <div className="bg-blue-500/10 border-b border-blue-500/30 px-4 py-2 text-xs flex items-center justify-between text-blue-300">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span className="font-bold">{transcriptionStage}</span>
            <span className="font-mono text-[11px] text-blue-400">({transcriptionProgress}%)</span>
          </div>
          <span className="text-[11px] text-slate-400">Generating verbatim speech segments with Gemini AI...</span>
        </div>
      )}

      {transcriptionError && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 text-xs flex items-center justify-between text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Transcription Notice:</strong> {transcriptionError}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerTranscription(mediaPath, projectId || undefined)}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 text-[11px] cursor-pointer"
            >
              Retry Transcription
            </button>
            <Link
              href="/settings"
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium text-[11px]"
            >
              Settings
            </Link>
          </div>
        </div>
      )}

      {/* Main 3-Panel Studio Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* PANEL 1: CAPTIONS LIST (LEFT) */}
        <section className="w-full lg:w-[380px] xl:w-[410px] border-b lg:border-b-0 lg:border-r border-[#1B1E26] bg-[#0E1015] flex flex-col h-[380px] lg:h-[calc(100vh-232px)]">
          {/* Panel Header */}
          <div className="p-3 border-b border-[#1B1E26] bg-[#12141C] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Captions ({segments.length})
                </h2>
                {isValidating ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
                ) : validationErrors.length === 0 ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Valid
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <AlertTriangle className="w-3 h-3" /> {validationErrors.length}
                  </span>
                )}
              </div>

              {/* Action Tools: Undo, Redo, Add Segment */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  title="Undo (Ctrl+Z)"
                  className="p-1.5 rounded-lg bg-[#181B24] hover:bg-[#202434] text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-[#262A3A]"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={future.length === 0}
                  title="Redo (Ctrl+Y)"
                  className="p-1.5 rounded-lg bg-[#181B24] hover:bg-[#202434] text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-[#262A3A]"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleAddSegment}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-white text-xs font-bold transition-colors border border-emerald-500/30 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Search Transcript */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search transcript..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#0A0C10] border border-[#232636] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Granular Validation Error Banner */}
          {validationErrors.length > 0 && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 p-2.5 text-xs text-amber-300 flex flex-col gap-1 max-h-24 overflow-y-auto">
              <div className="font-bold flex items-center gap-1 text-[11px] text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" /> Segment Validation Warnings:
              </div>
              {validationErrors.map((err, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px]">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          {/* Segment Cards List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {filteredSegments.map((seg, idx) => {
              const isActive = currentTime >= seg.start && currentTime <= seg.end;
              const isSelected = selectedSegmentId === seg.id;

              return (
                <div
                  key={seg.id}
                  onClick={() => {
                    setSelectedSegmentId(seg.id);
                    setSeekTime(seg.start);
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-500/10 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                      : isSelected
                      ? "bg-[#181B26] border-[#303648]"
                      : "bg-[#12141D] border-[#202330] hover:border-[#2C3246] hover:bg-[#151824]"
                  }`}
                >
                  {/* Card Top: Index, Time range, and Action Tools */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#181B24] text-[10px] font-mono text-slate-400 flex items-center justify-center font-bold border border-[#282C3C]">
                        {idx + 1}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-300">
                        <input
                          type="text"
                          value={formatTimestamp(seg.start)}
                          onChange={(e) => {
                            const newStart = parseTimestamp(e.target.value, seg.start);
                            handleUpdateSegment(seg.id, { start: newStart });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-16 px-1.5 py-0.5 rounded bg-[#0A0C10] border border-[#232636] text-center text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-slate-500">→</span>
                        <input
                          type="text"
                          value={formatTimestamp(seg.end)}
                          onChange={(e) => {
                            const newEnd = parseTimestamp(e.target.value, seg.end);
                            handleUpdateSegment(seg.id, { end: newEnd });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-16 px-1.5 py-0.5 rounded bg-[#0A0C10] border border-[#232636] text-center text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Actions: Reorder, Split, Merge, Delete */}
                    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        title="Move Earlier"
                        disabled={idx === 0}
                        onClick={() => handleMoveSegment(seg.id, "up")}
                        className="p-1 rounded hover:bg-[#202434] text-slate-400 hover:text-white transition-colors disabled:opacity-20"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Move Later"
                        disabled={idx === segments.length - 1}
                        onClick={() => handleMoveSegment(seg.id, "down")}
                        className="p-1 rounded hover:bg-[#202434] text-slate-400 hover:text-white transition-colors disabled:opacity-20"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Split Segment"
                        onClick={() => handleSplitSegment(seg.id)}
                        className="p-1 rounded hover:bg-[#202434] text-slate-400 hover:text-white transition-colors"
                      >
                        <Split className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Merge with Next"
                        disabled={idx === segments.length - 1}
                        onClick={() => handleMergeNext(seg.id)}
                        className="p-1 rounded hover:bg-[#202434] text-slate-400 hover:text-white transition-colors disabled:opacity-20"
                      >
                        <Combine className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Delete Segment"
                        onClick={() => handleDeleteSegment(seg.id)}
                        className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Caption Text Input Field */}
                  <textarea
                    rows={2}
                    value={seg.text}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleUpdateSegment(seg.id, { text: e.target.value })}
                    className="w-full p-2 rounded-lg bg-[#0A0C10] border border-[#232636] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none transition-colors"
                    placeholder="Enter verbatim caption text..."
                  />

                  {/* Card Bottom Meta */}
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span className="uppercase tracking-wider font-mono text-emerald-400/80">
                      {seg.language || "en"}
                    </span>
                    <span className="font-mono">{(seg.end - seg.start).toFixed(2)}s</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* PANEL 2: VIDEO CANVAS & TIMELINE (CENTER) */}
        <section className="flex-1 bg-black/50 flex flex-col justify-between overflow-hidden">
          {/* Top Canvas Toolbar */}
          <div className="h-11 px-4 border-b border-[#1C1F2A] bg-[#10121A] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">Aspect Ratio:</span>
              {(["9:16", "1:1", "16:9"] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    aspectRatio === ratio
                      ? "bg-emerald-500 text-black shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-[#181B26]"
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              {enablePersonCutout && (
                <span className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/40 text-purple-300 flex items-center gap-1 font-sans text-[11px]">
                  <Layers className="w-3 h-3 text-purple-400" /> Cutout Active
                </span>
              )}
              <span className="px-2.5 py-1 rounded-md bg-[#181B24] border border-[#282C3C] text-slate-300">
                Preset: <span className="text-emerald-400 font-bold">{currentStyle.name}</span>
              </span>
            </div>
          </div>

          {/* Video Player Display Container */}
          <div className="flex-1 w-full flex items-center justify-center p-3 overflow-hidden my-auto">
            {streamUrl ? (
              <VideoPlayer
                src={streamUrl}
                segments={segments}
                preset={currentStyle}
                aspectRatio={aspectRatio}
                onTimeUpdate={(t) => setCurrentTime(t)}
                seekTime={seekTime}
                onPositionChange={handlePositionChange}
                enablePersonCutout={enablePersonCutout}
                personCutoutPreviewUrl={cutoutPreviewUrl}
              />
            ) : (
              <div className="text-center p-8 rounded-2xl border border-dashed border-[#232736] bg-[#12141C]">
                <Film className="w-10 h-10 text-slate-500 mx-auto mb-3 animate-pulse" />
                <p className="text-sm font-medium text-slate-300">Loading video...</p>
              </div>
            )}
          </div>

          {/* FULL INTERACTIVE MULTI-TRACK TIMELINE */}
          <Timeline
            duration={duration}
            currentTime={currentTime}
            segments={segments}
            onSeek={(t) => setSeekTime(t)}
            onSplitSegment={(id) => handleSplitSegment(id)}
            onAddSegment={handleAddSegment}
            selectedSegmentId={selectedSegmentId}
            onSelectSegment={(id) => setSelectedSegmentId(id)}
            trimStart={trimStart}
            trimEnd={trimEnd}
            trimEnabled={trimEnabled}
          />
        </section>

        {/* PANEL 3: DEDICATED TABS (RIGHT) */}
        <section className="w-full lg:w-[380px] xl:w-[410px] border-t lg:border-t-0 lg:border-l border-[#1B1E26] bg-[#0E1015] flex flex-col h-[400px] lg:h-[calc(100vh-232px)]">
          {/* Studio Navigation Tabs Header */}
          <div className="p-2 border-b border-[#1B1E26] bg-[#12141C] flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("styles")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                activeTab === "styles"
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-[#181B26]"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Styles</span>
            </button>

            <button
              onClick={() => setActiveTab("position")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                activeTab === "position"
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-[#181B26]"
              }`}
            >
              <Move className="w-3 h-3" />
              <span>Position</span>
            </button>

            <button
              onClick={() => setActiveTab("design")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                activeTab === "design"
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-[#181B26]"
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Design</span>
            </button>

            <button
              onClick={() => setActiveTab("layers")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                activeTab === "layers"
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-[#181B26]"
              }`}
            >
              <Layers3 className="w-3 h-3" />
              <span>Layers</span>
            </button>

            <button
              onClick={() => setActiveTab("video")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                activeTab === "video"
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-[#181B26]"
              }`}
            >
              <Scissors className="w-3 h-3" />
              <span>Video</span>
            </button>

            <button
              onClick={() => setActiveTab("audio")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                activeTab === "audio"
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-[#181B26]"
              }`}
            >
              <Music className="w-3 h-3" />
              <span>Audio</span>
            </button>

            <button
              onClick={() => setActiveTab("export")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                activeTab === "export"
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-[#181B26]"
              }`}
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>
          </div>

          {/* TAB 1: STYLES GALLERY WITH CATEGORIES */}
          {activeTab === "styles" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                {(["All", "Social", "Professional", "Cinematic", "Educational", "Accessibility"] as PresetCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-emerald-500 text-black"
                        : "bg-[#181B26] text-slate-400 hover:text-white hover:bg-[#202534]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Templates */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Find styles..."
                  value={templateFilter}
                  onChange={(e) => setTemplateFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#0A0C10] border border-[#232636] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              {/* Template Cards List */}
              <div className="space-y-2.5">
                {filteredPresets.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;

                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-500/10"
                          : "bg-[#13161F] border-[#212432] hover:border-[#303548] hover:bg-[#161A26]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>{preset.name}</span>
                          {preset.category && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#1B2030] text-slate-400 border border-[#282E44]">
                              {preset.category}
                            </span>
                          )}
                        </span>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500 text-black">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                        {preset.description}
                      </p>

                      {/* Live Preview Pill */}
                      <div className="p-2.5 rounded-lg bg-black/70 border border-[#232736] flex items-center justify-center text-center">
                        <span
                          style={{
                            fontFamily: preset.fontFamily,
                            color: assToHex(preset.primaryColor),
                            fontWeight: preset.bold ? "bold" : "normal",
                            fontStyle: preset.italic ? "italic" : "normal",
                            textShadow: `${preset.shadowDepth || 2}px ${preset.shadowDepth || 2}px 0px ${assToHex(preset.outlineColor, "#000")}`,
                          }}
                          className="text-xs tracking-wide"
                        >
                          Hello &amp; Welcome to Kalalo.
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CAPTION POSITIONING CONTROLS */}
          {activeTab === "position" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
                <Move className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Interactive Dragging:</strong> Drag the caption directly on the video player, or use the precision controls below.
                </span>
              </div>

              {/* Quick Vertical Placement */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-2">
                  Vertical Placement
                </label>
                <div className="grid grid-cols-5 gap-1.5 text-xs">
                  {[
                    { label: "Top", y: 15 },
                    { label: "Up-Mid", y: 35 },
                    { label: "Center", y: 50 },
                    { label: "Low-Mid", y: 68 },
                    { label: "Bottom", y: 82 },
                  ].map((pos) => (
                    <button
                      key={pos.label}
                      onClick={() => handleSetVerticalPos(pos.y)}
                      className={`py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                        currentStyle.positionY === pos.y
                          ? "bg-emerald-500 text-black border-emerald-400"
                          : "bg-[#141620] border-[#242738] text-slate-300 hover:bg-[#1A1D2B]"
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Horizontal Placement */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-2">
                  Horizontal Placement
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { label: "Left (20%)", x: 20 },
                    { label: "Center (50%)", x: 50 },
                    { label: "Right (80%)", x: 80 },
                  ].map((pos) => (
                    <button
                      key={pos.label}
                      onClick={() => handleSetHorizontalPos(pos.x)}
                      className={`py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                        currentStyle.positionX === pos.x
                          ? "bg-emerald-500 text-black border-emerald-400"
                          : "bg-[#141620] border-[#242738] text-slate-300 hover:bg-[#1A1D2B]"
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Precision Sliders */}
              <div className="space-y-3 pt-1">
                {/* Y Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-300">Vertical Offset (Y)</span>
                    <div className="flex items-center gap-1 font-mono text-emerald-400 text-xs">
                      <span>{currentStyle.positionY ?? 82}%</span>
                      <button
                        onClick={() => handleNudgePosition("y", -1)}
                        className="px-1.5 py-0.5 rounded bg-[#181B24] border border-[#262B3C] hover:bg-[#202534] text-slate-200"
                        title="Nudge up (-1%)"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleNudgePosition("y", 1)}
                        className="px-1.5 py-0.5 rounded bg-[#181B24] border border-[#262B3C] hover:bg-[#202534] text-slate-200"
                        title="Nudge down (+1%)"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={95}
                    step={1}
                    value={currentStyle.positionY ?? 82}
                    onChange={(e) => handleSetVerticalPos(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-[#1E2230] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* X Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-300">Horizontal Offset (X)</span>
                    <div className="flex items-center gap-1 font-mono text-emerald-400 text-xs">
                      <span>{currentStyle.positionX ?? 50}%</span>
                      <button
                        onClick={() => handleNudgePosition("x", -1)}
                        className="px-1.5 py-0.5 rounded bg-[#181B24] border border-[#262B3C] hover:bg-[#202534] text-slate-200"
                        title="Nudge left (-1%)"
                      >
                        ◀
                      </button>
                      <button
                        onClick={() => handleNudgePosition("x", 1)}
                        className="px-1.5 py-0.5 rounded bg-[#181B24] border border-[#262B3C] hover:bg-[#202534] text-slate-200"
                        title="Nudge right (+1%)"
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    step={1}
                    value={currentStyle.positionX ?? 50}
                    onChange={(e) => handleSetHorizontalPos(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-[#1E2230] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-2">
                  Text Alignment
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Left", align: 1, icon: AlignLeft },
                    { label: "Center", align: 2, icon: AlignCenter },
                    { label: "Right", align: 3, icon: AlignRight },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={() => setCurrentStyle((prev) => ({ ...prev, alignment: item.align }))}
                        className={`py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                          currentStyle.alignment === item.align
                            ? "bg-emerald-500 text-black border-emerald-400"
                            : "bg-[#141620] border-[#242738] text-slate-300 hover:bg-[#1A1D2B]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reset to Default */}
              <div className="pt-2">
                <button
                  onClick={handleResetPosition}
                  className="w-full py-2 rounded-xl bg-[#141724] border border-[#262B3C] hover:bg-[#1B1F30] text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset to Default Placement</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: DESIGN AND STYLING CONTROLS */}
          {activeTab === "design" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Font Family & Size */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Typography</label>
                <select
                  value={currentStyle.fontFamily}
                  onChange={(e) => setCurrentStyle((prev) => ({ ...prev, fontFamily: e.target.value }))}
                  className="w-full p-2 rounded-xl bg-[#131620] border border-[#262A3A] text-xs text-white focus:outline-none focus:border-emerald-500 mb-2"
                >
                  <option value="Arial">Arial (Universal Social)</option>
                  <option value="Montserrat">Montserrat (Modern Clean)</option>
                  <option value="Trebuchet MS">Trebuchet MS (High Impact)</option>
                  <option value="Impact">Impact (Viral Hooks)</option>
                  <option value="Georgia">Georgia (Editorial Serif)</option>
                  <option value="Nirmala UI">Nirmala UI (Hindi / Marathi Clear)</option>
                  <option value="Palatino Linotype">Palatino (Cinematic Dialogue)</option>
                  <option value="Courier New">Courier New (Monospace Script)</option>
                </select>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Font Size</span>
                    <input
                      type="range"
                      min={24}
                      max={110}
                      value={currentStyle.fontSize}
                      onChange={(e) => setCurrentStyle((prev) => ({ ...prev, fontSize: parseInt(e.target.value, 10) }))}
                      className="w-full h-1.5 bg-[#1E2230] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                  <span className="font-mono text-xs text-emerald-400 font-bold w-8 text-right">
                    {currentStyle.fontSize}px
                  </span>
                </div>
              </div>

              {/* Formatting Toggles: Bold, Italic, Underline */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Style Toggles</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setCurrentStyle((prev) => ({ ...prev, bold: !prev.bold }))}
                    className={`py-1.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                      currentStyle.bold ? "bg-emerald-500 text-black border-emerald-400" : "bg-[#141620] border-[#242738] text-slate-300 hover:bg-[#1A1D2B]"
                    }`}
                  >
                    <span>Bold</span>
                  </button>
                  <button
                    onClick={() => setCurrentStyle((prev) => ({ ...prev, italic: !prev.italic }))}
                    className={`py-1.5 rounded-lg border text-xs italic flex items-center justify-center gap-1 cursor-pointer ${
                      currentStyle.italic ? "bg-emerald-500 text-black border-emerald-400" : "bg-[#141620] border-[#242738] text-slate-300 hover:bg-[#1A1D2B]"
                    }`}
                  >
                    <span>Italic</span>
                  </button>
                  <button
                    onClick={() => setCurrentStyle((prev) => ({ ...prev, underline: !prev.underline }))}
                    className={`py-1.5 rounded-lg border text-xs underline flex items-center justify-center gap-1 cursor-pointer ${
                      currentStyle.underline ? "bg-emerald-500 text-black border-emerald-400" : "bg-[#141620] border-[#242738] text-slate-300 hover:bg-[#1A1D2B]"
                    }`}
                  >
                    <span>Underline</span>
                  </button>
                </div>
              </div>

              {/* Text & Outline Colors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={assToHex(currentStyle.primaryColor)}
                      onChange={(e) => setCurrentStyle((prev) => ({ ...prev, primaryColor: hexToAss(e.target.value) }))}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <span className="font-mono text-xs text-slate-300 uppercase">
                      {assToHex(currentStyle.primaryColor)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Outline Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={assToHex(currentStyle.outlineColor)}
                      onChange={(e) => setCurrentStyle((prev) => ({ ...prev, outlineColor: hexToAss(e.target.value) }))}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <span className="font-mono text-xs text-slate-300 uppercase">
                      {assToHex(currentStyle.outlineColor)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Outline Thickness */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-300">Outline Thickness</span>
                  <span className="font-mono text-emerald-400">{currentStyle.outlineWidth}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={12}
                  value={currentStyle.outlineWidth}
                  onChange={(e) => setCurrentStyle((prev) => ({ ...prev, outlineWidth: parseInt(e.target.value, 10) }))}
                  className="w-full h-1.5 bg-[#1E2230] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Background Treatments */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Background Treatment</label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { id: "none", label: "None (Shadow)" },
                    { id: "solid_box", label: "Solid Box" },
                    { id: "translucent_box", label: "Translucent Box" },
                    { id: "highlight_box", label: "Highlight Badge" },
                    { id: "outline_only", label: "Outline Only" },
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setCurrentStyle((prev) => ({ ...prev, backgroundTreatment: b.id as any }))}
                      className={`p-2 rounded-lg border text-left text-[11px] font-semibold transition-colors cursor-pointer ${
                        (currentStyle.backgroundTreatment || "none") === b.id
                          ? "bg-emerald-500 text-black border-emerald-400 font-bold"
                          : "bg-[#141620] border-[#242738] text-slate-300 hover:bg-[#1A1D2B]"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Opacity (if translucent) */}
              {currentStyle.backgroundTreatment === "translucent_box" && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-300">Box Opacity</span>
                    <span className="font-mono text-emerald-400">
                      {Math.round((currentStyle.backgroundOpacity ?? 0.65) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.95}
                    step={0.05}
                    value={currentStyle.backgroundOpacity ?? 0.65}
                    onChange={(e) => setCurrentStyle((prev) => ({ ...prev, backgroundOpacity: parseFloat(e.target.value) }))}
                    className="w-full h-1.5 bg-[#1E2230] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LAYERS (PERSON CUTOUT & COMPOSITING STACK) */}
          {activeTab === "layers" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-200">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-purple-300">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Person Cutout / Captions Behind Subject</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Automatically extracts the speaker silhouette to composite captions behind the person.
                </p>
              </div>

              {/* Visual Compositing Layers Stack */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Compositing Order (Top to Bottom)
                </span>

                {/* Layer 1: Foreground Cutout */}
                <div
                  className={`p-3 rounded-xl border transition-all ${
                    enablePersonCutout
                      ? "bg-purple-950/20 border-purple-500/50 shadow-md shadow-purple-500/10"
                      : "bg-[#12141D] border-[#222636]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] flex items-center justify-center font-bold">
                        1
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          Foreground Person Cutout
                          {enablePersonCutout && (
                            <span className="text-[9px] bg-purple-500/30 text-purple-300 px-1.5 py-0.2 rounded font-mono font-bold">
                              ACTIVE
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-400">Foreground mask layer</p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enablePersonCutout}
                        onChange={(e) => handleTogglePersonCutout(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* Cutout Generation / Preview status */}
                  {isGeneratingCutoutPreview && (
                    <div className="mt-2.5 pt-2.5 border-t border-purple-500/20 flex items-center gap-2 text-xs text-purple-300 font-medium">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                      <span>Generating foreground person cutout mask...</span>
                    </div>
                  )}

                  {cutoutPreviewUrl && (
                    <div className="mt-2.5 pt-2.5 border-t border-purple-500/20 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-black border border-[#2B3044] overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cutoutPreviewUrl} alt="Cutout Preview" className="w-full h-full object-contain" />
                      </div>
                      <div className="text-[11px] text-slate-300">
                        <span className="text-emerald-400 font-bold block">✓ Alpha Matte Extracted</span>
                        <span className="text-slate-400">Captions will render behind the speaker silhouette.</span>
                      </div>
                    </div>
                  )}

                  {cutoutError && (
                    <div className="mt-2 text-[11px] text-amber-300">
                      {cutoutError}
                    </div>
                  )}
                </div>

                {/* Layer 2: Caption Layer */}
                <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] flex items-center justify-center font-bold">
                      2
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">Captions &amp; Subtitle Layer</h4>
                      <p className="text-[10px] text-slate-400">{segments.length} segments • {currentStyle.name}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                    Middle
                  </span>
                </div>

                {/* Layer 3: Original Background Video */}
                <div className="p-3 rounded-xl border border-[#222636] bg-[#12141D] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px] flex items-center justify-center font-bold">
                      3
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">Original Background Video</h4>
                      <p className="text-[10px] text-slate-400">{fileName} • {aspectRatio}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Base</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: VIDEO TOOLS (TRIMMING, RESOLUTION) */}
          {activeTab === "video" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Video Trimming */}
              <div className="p-3 rounded-xl border border-[#232738] bg-[#12141D] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Video Trimming</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={trimEnabled}
                    onChange={(e) => setTrimEnabled(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>

                {trimEnabled && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Trim Start</span>
                        <span className="font-mono text-emerald-400">{trimStart.toFixed(2)}s</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0, trimEnd - 0.5)}
                        step={0.1}
                        value={trimStart}
                        onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-[#1E2230] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Trim End</span>
                        <span className="font-mono text-emerald-400">{trimEnd.toFixed(2)}s</span>
                      </div>
                      <input
                        type="range"
                        min={trimStart + 0.5}
                        max={duration}
                        step={0.1}
                        value={trimEnd}
                        onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-[#1E2230] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Output Resolution */}
              <div className="p-3 rounded-xl border border-[#232738] bg-[#12141D]">
                <label className="text-xs font-bold text-white block mb-2">Export Resolution</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(["1080p", "720p"] as const).map((res) => (
                    <button
                      key={res}
                      onClick={() => setResolution(res)}
                      className={`py-2 rounded-lg border font-bold transition-colors cursor-pointer ${
                        resolution === res
                          ? "bg-emerald-500 text-black border-emerald-400"
                          : "bg-[#181B26] border-[#2A2E40] text-slate-300 hover:bg-[#202534]"
                      }`}
                    >
                      {res} ({res === "1080p" ? "Full HD" : "Fast Export"})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AUDIO TOOLS */}
          {activeTab === "audio" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Mute Audio Option */}
              <div className="p-3 rounded-xl border border-[#232738] bg-[#12141D] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Mute Output Audio</h4>
                  <p className="text-[10px] text-slate-400">Strip audio track from final MP4</p>
                </div>
                <input
                  type="checkbox"
                  checked={muteAudio}
                  onChange={(e) => setMuteAudio(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Audio Extraction */}
              <div className="p-3 rounded-xl border border-[#232738] bg-[#12141D] space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Extract Audio Track</span>
                  </h4>
                  <p className="text-[10px] text-slate-400">Save original audio as high-quality MP3 or WAV</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleExtractAudio("mp3")}
                    disabled={isExtractingAudio}
                    className="py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isExtractingAudio ? "Extracting..." : "Extract MP3"}
                  </button>
                  <button
                    onClick={() => handleExtractAudio("wav")}
                    disabled={isExtractingAudio}
                    className="py-2 rounded-lg bg-[#181B26] hover:bg-[#202534] text-slate-300 border border-[#2A2E40] text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isExtractingAudio ? "Extracting..." : "Extract WAV"}
                  </button>
                </div>

                {extractedAudio && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between">
                    <span className="text-emerald-300 font-mono text-[11px]">Audio ready!</span>
                    <a
                      href={extractedAudio.downloadUrl}
                      className="px-2 py-1 rounded bg-emerald-500 text-black font-bold text-[10px] hover:bg-emerald-400 transition-colors"
                    >
                      Download {extractedAudio.format.toUpperCase()}
                    </a>
                  </div>
                )}

                {audioExtractError && (
                  <div className="text-xs text-red-400">{audioExtractError}</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: EXPORT */}
          {activeTab === "export" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Video Burn-in Export Card */}
              <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Burn-in Video Export</h3>
                    <p className="text-[11px] text-slate-400">Renders styled ASS subtitles into standalone MP4</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-black/40 border border-[#232738]">
                    <span className="text-[10px] text-slate-400 block font-sans">Resolution</span>
                    <span className="text-emerald-300 font-bold">{resolution}</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-[#232738]">
                    <span className="text-[10px] text-slate-400 block font-sans">Aspect Ratio</span>
                    <span className="text-emerald-300 font-bold">{aspectRatio}</span>
                  </div>
                </div>

                <button
                  onClick={handleStartRender}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start Video Render</span>
                </button>
              </div>

              {/* Subtitles Download Card */}
              <div className="p-4 rounded-xl border border-[#232738] bg-[#12141D] space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <h3 className="text-xs font-bold text-white">Subtitle Files</h3>
                    <p className="text-[11px] text-slate-400">Export timed text for YouTube, Premiere, or Final Cut</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setExportFormat("srt");
                      handleOpenExportSubtitles();
                    }}
                    className="py-2 rounded-lg bg-[#181B26] hover:bg-[#202534] text-slate-200 border border-[#282C3C] text-xs font-bold cursor-pointer"
                  >
                    Export SRT
                  </button>
                  <button
                    onClick={() => {
                      setExportFormat("vtt");
                      handleOpenExportSubtitles();
                    }}
                    className="py-2 rounded-lg bg-[#181B26] hover:bg-[#202534] text-slate-200 border border-[#282C3C] text-xs font-bold cursor-pointer"
                  >
                    Export WebVTT
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* MODAL: SUBTITLE EXPORT MODAL */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#11131B] border border-[#262B3C] p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#202434] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Export Subtitles ({exportFormat.toUpperCase()})</span>
              </h3>
              <button
                onClick={() => setExportModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#1C2030] text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFormatChange("srt")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  exportFormat === "srt" ? "bg-emerald-500 text-black" : "bg-[#181B24] text-slate-400"
                }`}
              >
                SubRip (.SRT)
              </button>
              <button
                onClick={() => handleFormatChange("vtt")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  exportFormat === "vtt" ? "bg-emerald-500 text-black" : "bg-[#181B24] text-slate-400"
                }`}
              >
                WebVTT (.VTT)
              </button>
            </div>

            {/* Preview Box */}
            <div className="relative">
              <textarea
                readOnly
                rows={10}
                value={exporting ? "Generating subtitle script..." : exportedContent || ""}
                className="w-full p-3 rounded-xl bg-[#090B10] border border-[#202434] text-xs font-mono text-emerald-300 resize-none focus:outline-none"
              />
              <button
                onClick={handleCopySubtitle}
                className="absolute top-3 right-3 px-2 py-1 rounded bg-[#181B24] border border-[#282C3C] text-[11px] text-slate-300 hover:text-white flex items-center gap-1 shadow-sm"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#202434]">
              <button
                onClick={() => setExportModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-[#181B24]"
              >
                Close
              </button>
              <button
                onClick={handleDownloadSubtitle}
                disabled={!exportedContent}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 text-black font-extrabold text-xs hover:bg-emerald-400 transition-colors cursor-pointer disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .{exportFormat.toUpperCase()}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FFMPEG VIDEO CAPTION BURN-IN RENDER */}
      {renderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-xl rounded-2xl bg-[#11131B] border border-[#262B3C] p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#202434] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>FFmpeg Caption Burn-In Render</span>
              </h3>
              {!isRendering && (
                <button
                  onClick={() => setRenderModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-[#1C2030] text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Error Display */}
            {renderError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-red-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Render Notice:</span>
                </div>
                <pre className="whitespace-pre-wrap font-mono text-[11px] bg-black/40 p-2.5 rounded-lg border border-red-500/20 max-h-40 overflow-y-auto">
                  {renderError}
                </pre>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setRenderModalOpen(false)}
                    className="px-3 py-1 rounded bg-[#181B24] hover:bg-[#202434] text-xs text-slate-300"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* In-Progress Progress Bar & Stage */}
            {isRendering && (
              <div className="py-6 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-12 h-12 rounded-full border-3 border-emerald-400 border-t-transparent animate-spin" />
                <div>
                  <h4 className="font-bold text-white text-sm">{renderStage}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Burning ASS subtitles onto video at {aspectRatio} ({resolution})
                    {enablePersonCutout ? " with Person Cutout compositing..." : "..."}
                  </p>
                </div>

                <div className="w-full max-w-md bg-[#181B24] rounded-full h-3 overflow-hidden border border-[#282C3C]">
                  <div
                    style={{ width: `${renderProgress}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                  />
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">{renderProgress}%</span>

                <button
                  type="button"
                  onClick={handleCancelRender}
                  className="px-4 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/30 transition-colors"
                >
                  Cancel Render
                </button>
              </div>
            )}

            {/* Completed Result Display */}
            {!isRendering && renderResult && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    Video rendered successfully!
                    {renderResult.personCutout && " (Captions placed behind subject)"}
                  </span>
                </div>

                <div className="w-full rounded-xl overflow-hidden bg-black border border-[#212432] flex items-center justify-center max-h-[280px]">
                  <video src={renderResult.streamUrl} controls autoPlay className="max-h-[280px] w-auto mx-auto object-contain" />
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-[#181B24] border border-[#282C3C]">
                    <span className="text-slate-400 block text-[10px]">Dimensions</span>
                    <span className="font-bold text-white font-mono">{renderResult.width}x{renderResult.height}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#181B24] border border-[#282C3C]">
                    <span className="text-slate-400 block text-[10px]">Duration</span>
                    <span className="font-bold text-white font-mono">{renderResult.durationSeconds?.toFixed(1)}s</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#181B24] border border-[#282C3C]">
                    <span className="text-slate-400 block text-[10px]">Aspect Ratio</span>
                    <span className="font-bold text-emerald-400 font-mono">{aspectRatio}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#181B24] border border-[#282C3C]">
                    <span className="text-slate-400 block text-[10px]">Resolution</span>
                    <span className="font-bold text-emerald-400 font-mono">{resolution}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setRenderModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[#181B24] hover:bg-[#202534] text-xs font-medium text-slate-300 transition-colors"
                  >
                    Close
                  </button>

                  <a
                    href={renderResult.downloadUrl || `${renderResult.streamUrl}&download=true&filename=kalalo-captioned.mp4`}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold transition-all shadow-md shadow-emerald-500/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download MP4</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditorPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#0C0D11] flex items-center justify-center text-slate-400">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Loading Kalalo Studio...</p>
          </div>
        </div>
      }
    >
      <EditorContent />
    </React.Suspense>
  );
}
