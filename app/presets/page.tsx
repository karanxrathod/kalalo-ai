"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  Sliders,
  Type,
  Maximize2,
  Info,
  Play,
  RotateCcw,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { ORIGINAL_PRESETS } from "@/src/presets/presets";
import { AspectRatio, SupportedLanguage, PresetStyle } from "@/src/types";

// Convert ASS color to CSS hex
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
      return `#${rr}${gg}${bb}`.toLowerCase();
    }
  }
  return fallback;
}

export default function PresetsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [selectedAspect, setSelectedAspect] = useState<string>("all");
  const [customPreviewText, setCustomPreviewText] = useState<string>(
    "Kalalo AI Captions: वायरल वीडियोज के लिए असली स्टाइल!"
  );
  const [activeModalPreset, setActiveModalPreset] = useState<PresetStyle | null>(null);

  // Filter presets
  const filteredPresets = ORIGINAL_PRESETS.filter((preset) => {
    if (
      selectedLanguage !== "all" &&
      preset.targetLanguages &&
      !preset.targetLanguages.includes(selectedLanguage as SupportedLanguage)
    ) {
      return false;
    }
    if (
      selectedAspect !== "all" &&
      !preset.supportedAspectRatios.includes(selectedAspect as AspectRatio)
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0C0D11] text-white flex">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  Original Typography Engine
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {ORIGINAL_PRESETS.length} Verified Styles
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Caption Presets Gallery
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Curated typography presets designed specifically for high-retention vertical
                short-form content, Reels, Shorts, and cinematic interviews. Tested for Hindi,
                Hinglish, and English scripts.
              </p>
            </div>

            <Link
              href="/editor?sample=true"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-black font-bold text-xs sm:text-sm transition-all shadow-lg shadow-primary/20 self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Studio Editor</span>
            </Link>
          </div>

          {/* Interactive Controls & Filters */}
          <div className="mt-6 p-4 rounded-2xl bg-surface/80 border border-border flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Live Custom Text Tester */}
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Type text to test live across all styles:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customPreviewText}
                  onChange={(e) => setCustomPreviewText(e.target.value)}
                  placeholder="Type any caption text here in Hindi, Hinglish, or English..."
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/60"
                />
                {customPreviewText && (
                  <button
                    onClick={() =>
                      setCustomPreviewText(
                        "Kalalo AI Captions: वायरल वीडियोज के लिए असली स्टाइल!"
                      )
                    }
                    title="Reset to default text"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Language Filter */}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Language
                </span>
                <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border text-xs">
                  {[
                    { id: "all", label: "All" },
                    { id: "hinglish", label: "Hinglish" },
                    { id: "hi", label: "Hindi" },
                    { id: "en", label: "English" },
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setSelectedLanguage(l.id)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        selectedLanguage === l.id
                          ? "bg-primary text-black font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio Filter */}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Aspect Ratio
                </span>
                <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border text-xs">
                  {[
                    { id: "all", label: "All" },
                    { id: "9:16", label: "9:16" },
                    { id: "1:1", label: "1:1" },
                    { id: "16:9", label: "16:9" },
                  ].map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAspect(a.id)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        selectedAspect === a.id
                          ? "bg-primary text-black font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Presets Grid */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPresets.map((preset) => {
              const primaryHex = assToHex(preset.primaryColor);
              const outlineHex = assToHex(preset.outlineColor, "#000000");

              return (
                <div
                  key={preset.id}
                  className="rounded-2xl border border-border bg-[#0D1117] overflow-hidden flex flex-col hover:border-slate-700 transition-all shadow-md group"
                >
                  {/* Visual Simulation Canvas */}
                  <div className="h-44 bg-gradient-to-b from-[#161B22] to-[#0A0D12] relative flex items-center justify-center p-6 text-center border-b border-border overflow-hidden">
                    {/* Dark stage grid lines */}
                    <div className="absolute inset-0 bg-[radial-gradient(#1f293d_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

                    {/* Safe Area Guides visualization */}
                    <div className="absolute inset-x-4 inset-y-3 border border-dashed border-slate-700/40 rounded pointer-events-none" />

                    {/* Styled Caption Simulation */}
                    <p
                      style={{
                        fontFamily: preset.fontFamily,
                        color: primaryHex,
                        fontWeight: preset.bold ? 800 : 500,
                        fontStyle: preset.italic ? "italic" : "normal",
                        textShadow: `${preset.shadowDepth || 2}px ${preset.shadowDepth || 2}px 0px ${outlineHex}`,
                        letterSpacing: preset.id === "kalalo-cinema" ? "0.08em" : "normal",
                      }}
                      className="text-lg sm:text-xl relative z-10 select-none max-w-xs transition-transform group-hover:scale-105 duration-200"
                    >
                      {customPreviewText}
                    </p>

                    {/* Top right badge */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/60 backdrop-blur border border-slate-800 text-slate-300">
                        {preset.fontFamily}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="font-extrabold text-white text-base">
                          {preset.name}
                        </h3>
                        <span className="font-mono text-[10px] text-slate-500">
                          {preset.id}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        {preset.description}
                      </p>

                      {/* Technical Specs Pills */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] mb-4">
                        <div className="p-2 rounded-lg bg-surface border border-border">
                          <span className="text-slate-500 block text-[10px]">Font Size</span>
                          <span className="font-mono font-bold text-slate-200">
                            {preset.fontSize} pt
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-surface border border-border">
                          <span className="text-slate-500 block text-[10px]">Outline</span>
                          <span className="font-mono font-bold text-slate-200">
                            {preset.outlineWidth} px
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-surface border border-border">
                          <span className="text-slate-500 block text-[10px]">Vertical Margin</span>
                          <span className="font-mono font-bold text-slate-200">
                            {preset.marginV} px
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-surface border border-border">
                          <span className="text-slate-500 block text-[10px]">Aspects</span>
                          <span className="font-mono font-bold text-primary">
                            {preset.supportedAspectRatios.join(", ")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <button
                        onClick={() => setActiveModalPreset(preset)}
                        className="px-3 py-2 rounded-xl bg-surface hover:bg-slate-800 border border-border text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Specs</span>
                      </button>

                      <Link
                        href={`/editor?preset=${preset.id}&sample=true`}
                        className="flex-1 py-2 px-3 rounded-xl bg-primary hover:bg-primary-hover text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-primary/10 hover:shadow-primary/20"
                      >
                        <span>Apply in Editor</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {filteredPresets.length === 0 && (
            <div className="text-center py-16 bg-surface/30 rounded-2xl border border-dashed border-border mt-6">
              <Filter className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white">No matching presets found</h3>
              <p className="text-xs text-slate-400 mt-1">
                Try selecting "All" in the language and aspect ratio filters above.
              </p>
            </div>
          )}
        </main>

      {/* SPECS MODAL */}
      {activeModalPreset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#12171F] border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-base text-white">
                  {activeModalPreset.name} (ASS Specifications)
                </h3>
                <span className="font-mono text-xs text-primary">{activeModalPreset.id}</span>
              </div>
              <button
                onClick={() => setActiveModalPreset(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">{activeModalPreset.description}</p>

            {/* Code / Table */}
            <div className="bg-black p-3.5 rounded-xl border border-border font-mono text-xs text-slate-300 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Fontname:</span>
                <span className="text-white font-bold">{activeModalPreset.fontFamily}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fontsize (base):</span>
                <span>{activeModalPreset.fontSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PrimaryColour (ASS):</span>
                <span className="text-emerald-400">{activeModalPreset.primaryColor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">OutlineColour (ASS):</span>
                <span>{activeModalPreset.outlineColor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Outline Width:</span>
                <span>{activeModalPreset.outlineWidth}px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shadow Depth:</span>
                <span>{activeModalPreset.shadowDepth}px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Alignment:</span>
                <span>{activeModalPreset.alignment} (Bottom-Center)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MarginV:</span>
                <span>{activeModalPreset.marginV}px</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModalPreset(null)}
                className="px-4 py-2 rounded-lg bg-surface hover:bg-slate-800 text-xs text-slate-300 font-medium"
              >
                Close
              </button>
              <Link
                href={`/editor?preset=${activeModalPreset.id}&sample=true`}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-black text-xs font-bold"
              >
                Open in Studio Editor
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
