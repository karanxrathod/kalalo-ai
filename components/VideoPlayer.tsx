"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Shield, RotateCcw, Move, Layers } from "lucide-react";
import { AspectRatio, CaptionSegment, PresetStyle } from "@/src/types";

interface VideoPlayerProps {
  src: string;
  segments: CaptionSegment[];
  preset?: PresetStyle;
  aspectRatio: AspectRatio;
  onTimeUpdate?: (currentTime: number) => void;
  seekTime?: number | null;
  onPositionChange?: (pos: { x: number; y: number }) => void;
  enablePersonCutout?: boolean;
  personCutoutPreviewUrl?: string | null;
}

export function VideoPlayer({
  src,
  segments,
  preset,
  aspectRatio,
  onTimeUpdate,
  seekTime,
  onPositionChange,
  enablePersonCutout = false,
  personCutoutPreviewUrl = null,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showSafeGuides, setShowSafeGuides] = useState(false);
  const [isDraggingCaption, setIsDraggingCaption] = useState(false);

  // Sync seekTime from external clicks in segment list
  useEffect(() => {
    if (seekTime !== null && seekTime !== undefined && videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  }, [seekTime]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    onTimeUpdate?.(time);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${ms}`;
  };

  // Find active caption segment
  const activeSegment = segments.find(
    (seg) => currentTime >= seg.start && currentTime <= seg.end
  ) || (segments.length > 0 ? segments[0] : null);

  // Aspect ratio container dimensions
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case "9:16":
        return "aspect-[9/16] max-h-[560px] w-auto max-w-[315px]";
      case "1:1":
        return "aspect-square max-h-[500px] w-auto max-w-[500px]";
      case "16:9":
      default:
        return "aspect-[16/9] max-h-[440px] w-full max-w-[700px]";
    }
  };

  // Translate ASS colors (&H00BBGGRR&) to CSS hex/rgba
  const getCssColor = (assColor?: string, fallback = "#ffffff") => {
    if (!assColor) return fallback;
    if (assColor.startsWith("#")) return assColor;
    if (assColor.startsWith("&H")) {
      const hex = assColor.replace(/&H|&/g, "").padStart(8, "0");
      const b = hex.slice(2, 4);
      const g = hex.slice(4, 6);
      const r = hex.slice(6, 8);
      return `#${r}${g}${b}`;
    }
    return fallback;
  };

  const primaryColor = getCssColor(preset?.primaryColor, "#FFFFFF");
  const outlineColor = getCssColor(preset?.outlineColor, "#000000");
  const accentColor = getCssColor(preset?.accentColor, "#38BDF8");

  // Caption drag handlers for interactive positioning directly on preview
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDraggingCaption(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingCaption || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const xPct = Math.round(Math.min(92, Math.max(8, ((e.clientX - rect.left) / rect.width) * 100)));
      const yPct = Math.round(Math.min(94, Math.max(6, ((e.clientY - rect.top) / rect.height) * 100)));
      onPositionChange?.({ x: xPct, y: yPct });
    },
    [isDraggingCaption, onPositionChange]
  );

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingCaption) {
      setIsDraggingCaption(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Compute background treatment styles
  const getBackgroundStyles = (): React.CSSProperties => {
    const treatment = preset?.backgroundTreatment || (preset?.boxColor ? "solid_box" : "none");
    switch (treatment) {
      case "solid_box":
        return {
          backgroundColor: preset?.boxColor ? getCssColor(preset.boxColor, "#000000") : "#000000",
          padding: "6px 14px",
          borderRadius: "10px",
        };
      case "translucent_box":
        const op = typeof preset?.backgroundOpacity === "number" ? preset.backgroundOpacity : 0.65;
        return {
          backgroundColor: `rgba(0, 0, 0, ${op})`,
          backdropFilter: "blur(4px)",
          padding: "6px 14px",
          borderRadius: "10px",
        };
      case "highlight_box":
        return {
          backgroundColor: accentColor,
          color: "#000000",
          padding: "6px 14px",
          borderRadius: "10px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
        };
      case "outline_only":
        return {
          backgroundColor: "transparent",
          padding: "2px 8px",
        };
      default:
        return {
          backgroundColor: "transparent",
          padding: "2px 8px",
        };
    }
  };

  const posX = preset?.positionX ?? 50;
  const posY = preset?.positionY ?? 80;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-2 select-none">
      {/* Video Container (Layers Stack) */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`relative flex items-center justify-center bg-black rounded-2xl overflow-hidden shadow-2xl border border-[#232738] ${getAspectRatioClasses()} transition-all duration-300`}
      >
        {/* Layer 1: Background Video */}
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-contain pointer-events-auto cursor-pointer z-0"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          playsInline
          muted={isMuted}
        />

        {/* Safe Area Guides Overlay (Reels / TikTok / Shorts) */}
        {showSafeGuides && (
          <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 border-2 border-dashed border-emerald-500/40">
            <div className="h-10 border-b border-dashed border-amber-500/50 flex items-center justify-between px-2 text-[9px] text-amber-300 font-mono bg-black/30 backdrop-blur-[2px]">
              <span>Top UI (Status / Nav)</span>
              <span>Safe Zone</span>
            </div>
            <div className="h-24 border-t border-dashed border-red-500/50 flex flex-col justify-end px-2 pb-1 text-[9px] text-red-300 font-mono bg-black/30 backdrop-blur-[2px]">
              <div className="flex justify-between items-center">
                <span>Captions Recommended Zone</span>
                <span>Actions UI Safe Margin</span>
              </div>
            </div>
          </div>
        )}

        {/* Layer 2: Synchronized Caption Overlay (Positionable & Draggable) */}
        {activeSegment && (
          <div
            onPointerDown={handlePointerDown}
            className={`absolute z-10 cursor-grab active:cursor-grabbing transition-shadow ${
              isDraggingCaption ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-black" : "hover:ring-1 hover:ring-white/40"
            }`}
            style={{
              left: `${posX}%`,
              top: `${posY}%`,
              transform: "translate(-50%, -50%)",
              maxWidth: "88%",
              touchAction: "none",
            }}
            title="Drag to reposition caption"
          >
            <div
              className="text-center transition-all leading-tight"
              style={{
                fontFamily: preset?.fontFamily || "Arial, sans-serif",
                fontSize: `${Math.max(14, Math.round((preset?.fontSize || 54) * 0.32))}px`,
                fontWeight: preset?.bold ? "bold" : "normal",
                fontStyle: preset?.italic ? "italic" : "normal",
                textDecoration: preset?.underline ? "underline" : "none",
                color: primaryColor,
                textShadow:
                  preset?.backgroundTreatment === "highlight_box"
                    ? "none"
                    : `
                    -2px -2px 0 ${outlineColor},
                     2px -2px 0 ${outlineColor},
                    -2px  2px 0 ${outlineColor},
                     2px  2px 0 ${outlineColor},
                     0 3px 6px rgba(0,0,0,0.85)
                  `,
                ...getBackgroundStyles(),
              }}
            >
              {activeSegment.text}
            </div>

            {/* Micro coordinate badge on drag */}
            {isDraggingCaption && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-emerald-500 text-black text-[10px] font-mono font-bold whitespace-nowrap shadow-lg">
                X: {posX}% | Y: {posY}%
              </div>
            )}
          </div>
        )}

        {/* Layer 3: Foreground Person Cutout (When Enabled) */}
        {enablePersonCutout && personCutoutPreviewUrl && (
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={personCutoutPreviewUrl}
              alt="Foreground Person Cutout"
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>
        )}

        {/* Center Play Button Overlay on Pause */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/90 text-black shadow-xl backdrop-blur hover:scale-110 hover:bg-emerald-400 transition-all cursor-pointer"
          >
            <Play className="h-6 w-6 fill-current ml-1" />
          </button>
        )}
      </div>

      {/* Media Controller Bar */}
      <div className="w-full max-w-md mt-3 flex flex-col gap-2 rounded-xl border border-[#232738] bg-[#10131B] p-2.5 shadow-lg">
        {/* Progress Scrubber */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-400">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.01}
            value={currentTime}
            onChange={handleScrub}
            className="w-full h-1.5 bg-[#1F2332] rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
          />
          <span className="text-[11px] font-mono text-slate-500">{formatTime(duration)}</span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
            </button>

            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  setCurrentTime(0);
                }
              }}
              className="p-1.5 rounded-lg hover:bg-[#1B2030] text-slate-400 hover:text-slate-200 transition-colors"
              title="Restart"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg hover:bg-[#1B2030] text-slate-400 hover:text-slate-200 transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowSafeGuides(!showSafeGuides)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                showSafeGuides
                  ? "bg-emerald-950/70 border-emerald-800/40 text-emerald-300"
                  : "border-[#252A3C] text-slate-400 hover:text-slate-200"
              }`}
              title="Toggle safe margin guide"
            >
              <Shield className="h-3 w-3" />
              <span>Safe Zone</span>
            </button>

            {enablePersonCutout && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 border border-purple-500/40 text-purple-300">
                <Layers className="h-3 w-3 text-purple-400" />
                Cutout Active
              </span>
            )}

            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#161924] text-slate-400 border border-[#232738]">
              {aspectRatio}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
