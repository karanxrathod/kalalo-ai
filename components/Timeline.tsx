"use client";

import React, { useRef, useState, useMemo } from "react";
import {
  ZoomIn,
  ZoomOut,
  Split,
  Combine,
  Plus,
  Maximize2,
  Minimize2,
  Volume2,
  Film,
  Type,
  Scissors,
} from "lucide-react";
import { CaptionSegment } from "@/src/types";

interface TimelineProps {
  duration: number;
  currentTime: number;
  segments: CaptionSegment[];
  onSeek: (time: number) => void;
  onSplitSegment?: (id: string) => void;
  onAddSegment?: () => void;
  selectedSegmentId?: string | null;
  onSelectSegment?: (id: string) => void;
  trimStart?: number;
  trimEnd?: number;
  trimEnabled?: boolean;
}

export function Timeline({
  duration,
  currentTime,
  segments,
  onSeek,
  onSplitSegment,
  onAddSegment,
  selectedSegmentId,
  onSelectSegment,
  trimStart = 0,
  trimEnd = duration,
  trimEnabled = false,
}: TimelineProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const tracksRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [mode, setMode] = useState<"word" | "line">("line");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Time ruler intervals based on duration and zoom
  const ticks = useMemo(() => {
    const totalSecs = Math.max(duration, 1);
    const rawStep = totalSecs > 60 ? 5 : totalSecs > 20 ? 2 : 1;
    const step = zoom >= 3 ? Math.max(0.25, rawStep / 4) : zoom >= 2 ? Math.max(0.5, rawStep / 2) : rawStep;
    const count = Math.ceil(totalSecs / step) + 1;
    return Array.from({ length: count }, (_, i) => parseFloat((i * step).toFixed(2))).filter(
      (t) => t <= totalSecs
    );
  }, [duration, zoom]);

  // Click / scrub handler
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tracksRef.current) return;
    const rect = tracksRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const target = pct * duration;
    onSeek(target);
  };

  // Keep playhead in view when zoomed in during playback
  React.useEffect(() => {
    if (zoom > 1 && viewportRef.current && tracksRef.current && duration > 0) {
      const playheadPx = (currentTime / duration) * tracksRef.current.scrollWidth;
      const viewport = viewportRef.current;
      const scrollMin = viewport.scrollLeft;
      const scrollMax = scrollMin + viewport.clientWidth;
      if (playheadPx < scrollMin || playheadPx > scrollMax - 60) {
        viewport.scrollLeft = Math.max(0, playheadPx - viewport.clientWidth / 2);
      }
    }
  }, [currentTime, zoom, duration]);

  const formatTimeRuler = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
  };

  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`border-t border-[#1C1F2A] bg-[#0E1015] flex flex-col select-none transition-all ${
        isExpanded ? "h-64" : "h-44 sm:h-48"
      }`}
    >
      {/* Top Toolbar matching Kalakar reference */}
      <div className="h-9 px-4 border-b border-[#1C1F2A] bg-[#12141C] flex items-center justify-between text-xs">
        {/* Left: Mode Toggle & Action tools */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#181B26] p-0.5 rounded-lg border border-[#232736]">
            <button
              onClick={() => setMode("word")}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                mode === "word" ? "bg-emerald-500 text-black shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              WORD
            </button>
            <button
              onClick={() => setMode("line")}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                mode === "line" ? "bg-emerald-500 text-black shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              LINE
            </button>
          </div>

          <div className="h-4 w-px bg-[#232736]" />

          {onAddSegment && (
            <button
              onClick={onAddSegment}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#181B26] hover:bg-[#202434] text-slate-300 hover:text-white text-[11px] font-medium border border-[#232736] transition-colors"
            >
              <Plus className="w-3 h-3 text-emerald-400" />
              <span>+ Caption</span>
            </button>
          )}

          {selectedSegmentId && onSplitSegment && (
            <button
              onClick={() => onSplitSegment(selectedSegmentId)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#181B26] hover:bg-[#202434] text-slate-300 hover:text-white text-[11px] font-medium border border-[#232736] transition-colors"
              title="Split selected caption at current time"
            >
              <Split className="w-3 h-3 text-slate-400" />
              <span className="hidden sm:inline">Split</span>
            </button>
          )}
        </div>

        {/* Right: Functional Zoom in/out, slider & maximize */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#181B26] px-2 py-1 rounded-lg border border-[#232736] text-slate-400">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(1, parseFloat((prev - 0.25).toFixed(2))))}
              className="p-1 rounded hover:bg-[#202534] hover:text-white transition-colors cursor-pointer"
              title="Zoom Out Timeline (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min="1"
              max="4"
              step="0.25"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-800 rounded accent-emerald-400 cursor-pointer"
              title={`Timeline Zoom: ${Math.round(zoom * 100)}%`}
            />
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(4, parseFloat((prev + 0.25).toFixed(2))))}
              className="p-1 rounded hover:bg-[#202534] hover:text-white transition-colors cursor-pointer"
              title="Zoom In Timeline (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-emerald-400 min-w-[32px] text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-[#1C1F2B] text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? "Collapse Timeline" : "Expand Timeline"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Timeline Tracks Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Track Headers */}
        <div className="w-24 flex-shrink-0 border-r border-[#1C1F2A] bg-[#10121A] flex flex-col text-[10px] font-mono font-bold text-slate-400">
          <div className="h-6 border-b border-[#1C1F2A] flex items-center px-2 text-slate-500">
            TIME
          </div>
          <div className="h-10 border-b border-[#1C1F2A] flex items-center gap-1.5 px-2 text-amber-400">
            <Type className="w-3 h-3" />
            <span>Captions</span>
          </div>
          <div className="h-10 border-b border-[#1C1F2A] flex items-center gap-1.5 px-2 text-cyan-400">
            <Film className="w-3 h-3" />
            <span>Video 1</span>
          </div>
          <div className="h-10 flex items-center gap-1.5 px-2 text-emerald-400">
            <Volume2 className="w-3 h-3" />
            <span>Audio 1</span>
          </div>
        </div>

        {/* Right Interactive Tracks Viewport with horizontal scrolling */}
        <div
          ref={viewportRef}
          className="flex-1 relative overflow-x-auto overflow-y-hidden cursor-crosshair bg-[#0A0C10]"
        >
          <div
            ref={tracksRef}
            onClick={handleTimelineClick}
            style={{ width: `${zoom * 100}%`, minWidth: "100%" }}
            className="relative h-full flex flex-col"
          >
            {/* Track 0: Time Ruler */}
            <div className="h-6 border-b border-[#1C1F2A] relative bg-[#0D0F14] text-[9px] font-mono text-slate-400 flex items-center">
              {ticks.map((t) => {
                const leftPct = duration > 0 ? (t / duration) * 100 : 0;
                return (
                  <div
                    key={t}
                    style={{ left: `${leftPct}%` }}
                    className="absolute top-0 bottom-0 flex flex-col justify-between pointer-events-none pl-1 border-l border-[#232736]"
                  >
                    <span>{formatTimeRuler(t)}</span>
                    <div className="w-px h-1.5 bg-[#343A4E]" />
                  </div>
                );
              })}
            </div>

            {/* Track 1: Captions Blocks (matching Kalakar's yellow blocks) */}
            <div className="h-10 border-b border-[#1C1F2A] relative bg-[#11131A] p-0.5">
              {segments.map((seg) => {
                const left = duration > 0 ? (seg.start / duration) * 100 : 0;
                const width = duration > 0 ? Math.max(1, ((seg.end - seg.start) / duration) * 100) : 5;
                const isActive = currentTime >= seg.start && currentTime <= seg.end;
                const isSelected = selectedSegmentId === seg.id;

                return (
                  <div
                    key={seg.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeek(seg.start);
                      onSelectSegment?.(seg.id);
                    }}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    className={`absolute top-1 bottom-1 rounded px-1.5 flex items-center justify-between text-[10px] font-semibold truncate cursor-pointer transition-all border ${
                      isActive
                        ? "bg-[#FDC537] text-black border-yellow-200 shadow-md shadow-yellow-500/20 font-bold z-10 scale-[1.02]"
                        : isSelected
                        ? "bg-amber-600/80 text-white border-amber-400 z-10"
                        : "bg-[#28251B] text-amber-200 border-[#4B4020] hover:bg-[#383323]"
                    }`}
                    title={`${seg.text} (${seg.start.toFixed(2)}s - ${seg.end.toFixed(2)}s)`}
                  >
                    <span className="truncate">{seg.text}</span>
                    <span className="text-[9px] font-mono opacity-70 ml-1">
                      {(seg.end - seg.start).toFixed(1)}s
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Track 2: Video Filmstrip Track */}
            <div className="h-10 border-b border-[#1C1F2A] relative bg-[#0F1219] flex items-center overflow-hidden">
              <div className="w-full h-8 flex items-center gap-1 opacity-70 px-1 pointer-events-none">
                {Array.from({ length: Math.round(16 * zoom) }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 min-w-[32px] h-full rounded bg-[#1A1F2C] border border-[#2B3247] flex items-center justify-center text-[8px] font-mono text-cyan-400/50"
                  >
                    ▶
                  </div>
                ))}
              </div>
            </div>

            {/* Track 3: Audio Waveform Track matching Kalakar reference (#00DF81) */}
            <div className="h-10 relative bg-[#0D1016] flex items-center px-1 overflow-hidden">
              <div className="w-full h-7 flex items-center gap-0.5 pointer-events-none opacity-85">
                {Array.from({ length: Math.min(300, Math.round(90 * zoom)) }).map((_, i) => {
                  const h = Math.max(15, Math.sin(i * 0.4) * 50 + Math.cos(i * 0.7) * 30 + 35);
                  return (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="flex-1 min-w-[2px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-full"
                    />
                  );
                })}
              </div>
            </div>

            {/* Trim Range Overlay */}
            {trimEnabled && duration > 0 && (
              <>
                <div
                  style={{ left: 0, width: `${(trimStart / duration) * 100}%` }}
                  className="absolute top-0 bottom-0 bg-black/80 pointer-events-none border-r-2 border-amber-400 z-20"
                />
                <div
                  style={{
                    left: `${(trimEnd / duration) * 100}%`,
                    width: `${((duration - trimEnd) / duration) * 100}%`,
                  }}
                  className="absolute top-0 bottom-0 bg-black/80 pointer-events-none border-l-2 border-amber-400 z-20"
                />
              </>
            )}

            {/* Playhead Scrubber Line */}
            <div
              style={{ left: `${playheadPct}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-white z-30 pointer-events-none shadow-lg shadow-white/50"
            >
              <div className="w-3 h-3 bg-white -ml-1.5 rotate-45 transform shadow" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
