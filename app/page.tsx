"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  Sparkles,
  Video,
  Languages,
  Palette,
  Download,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Clock,
  Play,
  Sliders,
  FileText,
  ChevronRight,
  ExternalLink,
  Flame,
  Check,
  Code2,
} from "lucide-react";

export default function LandingPage() {
  const [selectedLang, setSelectedLang] = useState<"hinglish" | "hindi" | "english">("hinglish");
  const [activePreset, setActivePreset] = useState<string>("kalalo-pop-highlight");
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const demoLanguages = [
    {
      id: "hinglish" as const,
      label: "Hinglish",
      sublabel: "Bilingual Social Mix",
      sample: [
        { word: "Yeh", start: "00:00.20", highlight: false },
        { word: "feature", start: "00:00.60", highlight: true },
        { word: "aapke", start: "00:01.10", highlight: false },
        { word: "editing", start: "00:01.40", highlight: false },
        { word: "time", start: "00:01.80", highlight: true },
        { word: "ko", start: "00:02.10", highlight: false },
        { word: "80%", start: "00:02.40", highlight: true },
        { word: "save", start: "00:02.80", highlight: false },
        { word: "karega!", start: "00:03.20", highlight: false },
      ],
      fullText: "Yeh feature aapke editing time ko 80% save karega!",
    },
    {
      id: "hindi" as const,
      label: "हिंदी (Hindi)",
      sublabel: "Devanagari Script",
      sample: [
        { word: "अपने", start: "00:00.20", highlight: false },
        { word: "वीडियो", start: "00:00.70", highlight: true },
        { word: "को", start: "00:01.10", highlight: false },
        { word: "स्मार्ट", start: "00:01.50", highlight: true },
        { word: "कैप्शन", start: "00:01.90", highlight: true },
        { word: "के", start: "00:02.30", highlight: false },
        { word: "साथ", start: "00:02.60", highlight: false },
        { word: "वायरल", start: "00:03.00", highlight: true },
        { word: "बनाएं।", start: "00:03.40", highlight: false },
      ],
      fullText: "अपने वीडियो को स्मार्ट कैप्शन के साथ वायरल बनाएं।",
    },
    {
      id: "english" as const,
      label: "English",
      sublabel: "Clean International",
      sample: [
        { word: "Turn", start: "00:00.15", highlight: false },
        { word: "raw", start: "00:00.45", highlight: false },
        { word: "footage", start: "00:00.80", highlight: false },
        { word: "into", start: "00:01.10", highlight: false },
        { word: "scroll-stopping", start: "00:01.50", highlight: true },
        { word: "captions", start: "00:02.10", highlight: true },
        { word: "in", start: "00:02.50", highlight: false },
        { word: "seconds.", start: "00:02.85", highlight: false },
      ],
      fullText: "Turn raw footage into scroll-stopping captions in seconds.",
    },
  ];

  const presets = [
    {
      id: "kalalo-clean-bold",
      name: "Clean Bold",
      category: "Social Viral",
      font: "Montserrat / Arial Black",
      colorBadge: "White + Thick Black Shadow",
      previewText: "CLEAN BOLD CAPTION",
      previewStyle: "font-black uppercase text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] tracking-tight",
      description: "High-contrast bold font engineered for maximum readability on fast-scrolling mobile feeds.",
    },
    {
      id: "kalalo-cinema",
      name: "Cinema Subtitle",
      category: "Documentary & Film",
      font: "Inter / Roboto",
      colorBadge: "Soft Off-White + Subtle Shadow",
      previewText: "Cinema Subtitle Format",
      previewStyle: "font-medium text-slate-100 tracking-wider text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]",
      description: "Elegant, letter-spaced film aesthetic with restrained contrast for long-form narrative content.",
    },
    {
      id: "kalalo-pop-highlight",
      name: "Pop Word Highlight",
      category: "Shorts & Reels",
      font: "Poppins / Outfit",
      colorBadge: "Vibrant Yellow Accent",
      previewText: "POP WORD HIGHLIGHT",
      previewStyle: "font-extrabold uppercase text-yellow-400 drop-shadow-[0_3px_10px_rgba(234,179,8,0.4)]",
      description: "Dynamic word-by-word coloration that emphasizes punch words to retain viewer retention.",
    },
    {
      id: "kalalo-devanagari-gold",
      name: "Devanagari Gold",
      category: "Hindi Regional",
      font: "Noto Sans Devanagari",
      colorBadge: "Warm Gold + Dark Stroke",
      previewText: "देवनागरी गोल्डन स्टाइल",
      previewStyle: "font-bold text-amber-300 drop-shadow-[0_3px_8px_rgba(217,119,6,0.5)]",
      description: "Fine-tuned glyph metric spacing and baselines specifically designed for Hindi Unicode typography.",
    },
    {
      id: "kalalo-neon-glow",
      name: "Cyber Neon",
      category: "Gaming & Tech",
      font: "Space Grotesk",
      colorBadge: "Mint Emerald Glow",
      previewText: "CYBER NEON GLOW",
      previewStyle: "font-black uppercase text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]",
      description: "Vibrant emerald neon aesthetic designed for tech creators, podcast clips, and high-energy shorts.",
    },
    {
      id: "kalalo-minimal-box",
      name: "Minimal Dark Box",
      category: "Clean Contrast",
      font: "System Sans",
      colorBadge: "Semi-Transparent Dark Card",
      previewText: "Minimal Dark Box",
      previewStyle: "font-semibold text-white bg-black/80 px-3 py-1 rounded-md text-xs",
      description: "Encapsulates subtitle lines inside an opaque dark pill, guaranteeing contrast over busy backgrounds.",
    },
  ];

  const currentLangData = demoLanguages.find((l) => l.id === selectedLang) || demoLanguages[0];

  return (
    <div className="flex min-h-screen flex-col bg-[#090B0E] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      <Navbar />

      {/* SECTION B: HERO */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-32 border-b border-slate-900">
        {/* Subtle emerald grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b9810a_1px,transparent_1px),linear-gradient(to_bottom,#10b9810a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Ambient mint/emerald glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[860px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-emerald-600/20 via-teal-900/15 to-purple-900/10 blur-[140px]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1.5 text-xs font-medium text-emerald-300 shadow-sm shadow-emerald-950/50 backdrop-blur mb-8">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI-Assisted Video Caption Studio</span>
            <span className="text-emerald-500 font-mono">v0.1.0</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl max-w-4xl mx-auto leading-[1.08]">
            Your Videos.{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
              Better Captions.
            </span>{" "}
            Less Editing.
          </h1>

          {/* Supporting Text */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Turn your videos into editable, caption-ready content with AI-assisted transcription, Hinglish & Hindi accuracy, and creator-friendly styling.
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/editor"
              className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-7 py-3.5 text-sm font-semibold text-slate-950 shadow-xl shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all hover:scale-105 active:scale-95"
            >
              <span>Start Creating</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#features"
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-6 py-3.5 text-sm font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all backdrop-blur"
            >
              <span>Explore Features</span>
              <ChevronRight className="h-4 w-4 text-emerald-400" />
            </a>

            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl border border-slate-800/80 bg-[#101318] px-5 py-3.5 text-sm font-medium text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
            >
              <span>Sign In</span>
            </Link>
          </div>

          {/* Genuine Studio Preview Interface */}
          <div className="mt-16 rounded-2xl border border-slate-800 bg-[#101318]/95 p-4 sm:p-6 shadow-2xl backdrop-blur max-w-4xl mx-auto text-left relative overflow-hidden">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-4 mb-5 gap-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs font-mono text-slate-400">Kalalo Studio — Project: Hinglish_Reel_01.mp4</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-md bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 text-emerald-400 font-mono">
                  Gemini Flash 2.5
                </span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-slate-300 font-mono">9:16 Vertical</span>
              </div>
            </div>

            {/* Editor Two-Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
              {/* Left Column: Vertical 9:16 Video Canvas Mockup */}
              <div className="md:col-span-5 flex flex-col items-center justify-center rounded-xl border border-slate-800/90 bg-[#090B0E] p-4 relative min-h-[360px] overflow-hidden">
                <div className="w-full max-w-[210px] aspect-[9/16] rounded-lg border border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-3 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                  {/* Subtle video backdrop simulation */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1e293b_0%,#090b0e_100%)] opacity-80" />
                  
                  {/* Top video tag */}
                  <div className="relative z-10 flex items-center justify-between text-[9px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      REC 00:02.40
                    </span>
                    <span>1080x1920</span>
                  </div>

                  {/* Centered Burn-In Subtitle Preview */}
                  <div className="relative z-10 my-auto text-center px-1">
                    <div className="inline-block px-2 py-1 rounded bg-black/60 backdrop-blur-sm border border-black/40">
                      <p className="text-xs font-black uppercase text-yellow-400 drop-shadow-[0_2px_8px_rgba(234,179,8,0.5)] tracking-tight">
                        {currentLangData.fullText}
                      </p>
                    </div>
                  </div>

                  {/* Bottom playback indicator */}
                  <div className="relative z-10 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-800/60 pt-2">
                    <span className="font-mono text-emerald-400">00:02.40 / 00:15.00</span>
                    <button
                      type="button"
                      onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      aria-label="Toggle playback preview"
                    >
                      <Play className="h-2.5 w-2.5 fill-current" />
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-slate-500 font-mono">Live ASS Subtitle Renderer Preview</p>
              </div>

              {/* Right Column: Segment Timeline & Preset Controls */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-emerald-400" />
                      AI Transcript Timestamps
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400">Sync: Word-Level Accurate</span>
                  </div>

                  {/* Timed Segments */}
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {currentLangData.sample.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between rounded-lg p-2 text-xs border transition-colors ${
                          item.highlight
                            ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
                            : "border-slate-800/80 bg-slate-900/40 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-500">{item.start}</span>
                          <span className={item.highlight ? "font-bold text-emerald-300" : ""}>{item.word}</span>
                        </div>
                        {item.highlight && (
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
                            Key Word
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Preset:</span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-200">
                      Pop Word Highlight
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/editor?sample=true"
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition-colors"
                    >
                      Open in Editor
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C: LANGUAGE SELECTION & CAPTION DEMONSTRATION */}
      <section className="py-20 md:py-28 border-b border-slate-900 bg-[#07090C] relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-400 mb-4">
              <Languages className="h-3.5 w-3.5" />
              <span>Multi-Language Caption Engine</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Captions tuned for Indian & Global Creators
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
              Kalalo accurately detects mixed Hinglish phrasing, preserves pure Devanagari script for Hindi, and delivers crisp English subtitle timing.
            </p>
          </div>

          {/* Language Switch Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto mb-10 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
            {demoLanguages.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setSelectedLang(lang.id)}
                className={`flex-1 min-w-[110px] rounded-lg py-2.5 px-3 text-xs font-semibold transition-all ${
                  selectedLang === lang.id
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <div>{lang.label}</div>
                <div className={`text-[10px] opacity-80 ${selectedLang === lang.id ? "text-slate-900 font-normal" : "text-slate-500"}`}>
                  {lang.sublabel}
                </div>
              </button>
            ))}
          </div>

          {/* Interactive Demo Card */}
          <div className="max-w-3xl mx-auto rounded-2xl border border-slate-800 bg-[#101318] p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-medium text-slate-300">
                  Interactive Demonstration — {currentLangData.label}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Sample transcript preview</span>
            </div>

            {/* Caption Display Box */}
            <div className="rounded-xl border border-slate-800 bg-[#090B0E] p-6 sm:p-10 text-center mb-6 relative overflow-hidden">
              <div className="text-xs uppercase tracking-wider text-slate-500 font-mono mb-3">Live Stylized Caption</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {currentLangData.sample.map((wordObj, i) => (
                  <span
                    key={i}
                    className={`inline-block mx-1 transition-all duration-200 ${
                      wordObj.highlight
                        ? "text-yellow-400 scale-105 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]"
                        : "text-slate-200"
                    }`}
                  >
                    {wordObj.word}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Word-level timestamps allow dynamic highlighting, color animation, and easy text edits.
              </p>
            </div>

            {/* Features check list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Zero audio hallucination</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Devanagari Unicode support</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Exportable to SRT & VTT</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION D: CAPTION STYLES & PRESETS GALLERY */}
      <section id="presets" className="py-20 md:py-28 border-b border-slate-900 relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-400 mb-4">
              <Palette className="h-3.5 w-3.5" />
              <span>28 Production Presets</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Creator Presets Built for Every Aesthetic
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
              Every preset is mathematically calibrated with exact font metrics, shadow offsets, and ASS subtitle directives so your burned captions look pixel-perfect.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#101318] p-6 hover:border-emerald-500/40 hover:bg-[#13171e] transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                      {preset.category}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">{preset.colorBadge}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {preset.name}
                  </h3>

                  {/* Visual Style Preview Card */}
                  <div className="my-4 h-24 rounded-xl border border-slate-800 bg-[#090B0E] p-3 flex items-center justify-center text-center overflow-hidden">
                    <p className={preset.previewStyle}>{preset.previewText}</p>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{preset.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">{preset.font}</span>
                  <Link
                    href={`/editor?preset=${preset.id}&sample=true`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <span>Use Preset</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/presets"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-300 transition-colors"
            >
              <span>Explore all 28 Typography Presets in Library</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION E: PRODUCT WORKFLOW */}
      <section className="py-20 md:py-28 border-b border-slate-900 bg-[#07090C] relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-400 mb-4">
              <Layers className="h-3.5 w-3.5" />
              <span>Authentic 4-Step Pipeline</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              From Raw Media to Export in Minutes
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
              No complicated timelines or clunky software. Complete your entire caption workflow in four seamless steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="rounded-2xl border border-slate-800 bg-[#101318] p-6 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-sm mb-4">
                01
              </div>
              <h3 className="text-base font-bold text-white mb-2">Upload Video</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload your MP4, MOV, WebM, or audio file directly. Media is stored securely with your user account in Supabase.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-slate-800 bg-[#101318] p-6 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-sm mb-4">
                02
              </div>
              <h3 className="text-base font-bold text-white mb-2">AI Transcription</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Google Gemini analyzes the audio track with Hinglish/Hindi dialect awareness and generates exact word timestamps.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-slate-800 bg-[#101318] p-6 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-sm mb-4">
                03
              </div>
              <h3 className="text-base font-bold text-white mb-2">Edit & Style</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fine-tune spellings, shift timings, select from 28 visual presets, and adjust font sizes with real-time video preview.
              </p>
            </div>

            {/* Step 4 */}
            <div className="rounded-2xl border border-slate-800 bg-[#101318] p-6 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-sm mb-4">
                04
              </div>
              <h3 className="text-base font-bold text-white mb-2">Export or Burn-In</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Download clean SRT or VTT subtitle tracks instantly, or render a burned-in video in 1080p using high-speed FFmpeg.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION F: FEATURE CARDS */}
      <section id="features" className="py-20 md:py-28 border-b border-slate-900 relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-400 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Full-Stack Capabilities</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Engineered for Modern Content Creation
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
              Every capability is genuinely implemented and backed by real AI models, processing engines, and persistent cloud storage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-800 bg-[#101318] p-6 hover:border-slate-700 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">AI-Assisted Transcription</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Powered by Google Gemini 2.5 models. Real speech analysis that accurately distinguishes conversational Hinglish and technical vocabulary.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-800 bg-[#101318] p-6 hover:border-slate-700 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
                <Sliders className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Interactive Caption Studio</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Edit text, split or merge segments, nudge timestamps in milliseconds, and immediately see rendered results on the video player.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-800 bg-[#101318] p-6 hover:border-slate-700 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
                <Palette className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">28 Typography Presets</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                From Cinema subtitles to Devanagari Gold and Pop Highlights. Fully customizable font sizes, colors, and positioning presets.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-800 bg-[#101318] p-6 hover:border-slate-700 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
                <Download className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">SRT, VTT & ASS Subtitle Export</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Standard subtitle export ready for YouTube, Premiere Pro, Final Cut Pro, and DaVinci Resolve. Full Unicode compliance.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-slate-800 bg-[#101318] p-6 hover:border-slate-700 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
                <Video className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">High-Def FFmpeg Video Burn-In</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Renders styled captions directly into the video stream in 1080p or 720p with crisp anti-aliased font rendering and fast audio encoding.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-slate-800 bg-[#101318] p-6 hover:border-slate-700 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Supabase Cloud Persistence</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                PostgreSQL database with Row-Level Security, Supabase Auth, and Storage. Your projects and captions stay protected and synced.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION G: CREATOR SHOWCASE / MULTI-FORMAT */}
      <section className="py-20 md:py-28 border-b border-slate-900 bg-[#07090C] relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Optimized for Every Platform & Aspect Ratio
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
              Whether you create Reels, YouTube tutorials, or LinkedIn clips, Kalalo adapts to your canvas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-[#101318] p-6 text-center">
              <div className="mx-auto w-24 h-36 rounded-lg border-2 border-emerald-500/40 bg-slate-900 flex items-center justify-center text-xs font-mono text-emerald-300 mb-4">
                9:16
              </div>
              <h3 className="text-base font-bold text-white">Shorts & Reels</h3>
              <p className="mt-1 text-xs text-slate-400">Vertical format with safe margin padding for UI overlays</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#101318] p-6 text-center">
              <div className="mx-auto w-36 h-20 rounded-lg border-2 border-emerald-500/40 bg-slate-900 flex items-center justify-center text-xs font-mono text-emerald-300 mb-4">
                16:9
              </div>
              <h3 className="text-base font-bold text-white">YouTube & Landscape</h3>
              <p className="mt-1 text-xs text-slate-400">Horizontal standard cinema and educational tutorial layout</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#101318] p-6 text-center">
              <div className="mx-auto w-24 h-24 rounded-lg border-2 border-emerald-500/40 bg-slate-900 flex items-center justify-center text-xs font-mono text-emerald-300 mb-4">
                1:1
              </div>
              <h3 className="text-base font-bold text-white">Square Social Feed</h3>
              <p className="mt-1 text-xs text-slate-400">Square dimension ideal for LinkedIn, Instagram feed, and Twitter</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION H & I: HONEST EARLY ACCESS / STATUS */}
      <section className="py-20 md:py-28 border-b border-slate-900 relative">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-[#101720] to-[#0c0f14] p-8 sm:p-14 shadow-2xl relative overflow-hidden">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1.5 text-xs font-medium text-emerald-300 mb-6">
              <Flame className="h-3.5 w-3.5 text-emerald-400" />
              <span>Public Beta & Creator Access</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Honest Software Built for Creators
            </h2>

            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
              We do not fabricate fake reviews or claim millions of users. Kalalo is an active, open-source-aligned startup product built for creators who want clean, accurate subtitles without exorbitant recurring fees.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-xl mx-auto">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-emerald-400 font-bold text-base">Open Beta</div>
                <div className="text-[11px] text-slate-400 mt-1">Full access to Gemini AI transcription & presets</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-emerald-400 font-bold text-base">Self-Hostable</div>
                <div className="text-[11px] text-slate-400 mt-1">Deploy on Vercel with your own Supabase project</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-emerald-400 font-bold text-base">Active Feedback</div>
                <div className="text-[11px] text-slate-400 mt-1">Direct development driven by creator requests</div>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/editor"
                className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-7 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
              >
                <span>Launch Caption Studio</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://github.com/karanxrathod/kalalo-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3 text-sm font-medium text-slate-200 hover:text-white transition-colors"
              >
                <Code2 className="h-4 w-4 text-emerald-400" />
                <span>GitHub Repository</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION J: FINAL CTA & PROFESSIONAL FOOTER */}
      <footer className="bg-[#050608] border-t border-slate-900 text-slate-400 text-xs">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 p-0.5">
                  <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#090B0E]">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                </div>
                <span className="text-base font-bold text-white tracking-tight">Kalalo</span>
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                AI-assisted video captioning studio & MCP server. High-accuracy subtitles for Hinglish, Hindi, and English.
              </p>
            </div>

            {/* Product Column */}
            <div>
              <h4 className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">Product</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/editor" className="hover:text-emerald-400 transition-colors">
                    Caption Editor
                  </Link>
                </li>
                <li>
                  <Link href="/presets" className="hover:text-emerald-400 transition-colors">
                    Preset Gallery
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-emerald-400 transition-colors">
                    User Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/diagnostics" className="hover:text-emerald-400 transition-colors">
                    System Diagnostics
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h4 className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://github.com/karanxrathod/kalalo-ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                  >
                    <span>GitHub Repository</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-emerald-400 transition-colors">
                    Creator Sign In
                  </Link>
                </li>
                <li>
                  <a href="#features" className="hover:text-emerald-400 transition-colors">
                    Features Overview
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h4 className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">Legal & Privacy</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-emerald-400 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li className="text-slate-600 text-[10px] pt-1">
                  Protected under PostgreSQL Row-Level Security
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px] gap-4">
            <p>© {new Date().getFullYear()} Kalalo. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <span>Engineered with Gemini & Next.js</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
