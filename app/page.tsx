"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Video,
  Languages,
  Palette,
  Download,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Clock,
  Play,
  Pause,
  Sliders,
  FileText,
  ChevronRight,
  ExternalLink,
  Flame,
  Check,
  Code2,
  Volume2,
  VolumeX,
  Star,
  Crown,
  Rocket,
  ArrowUpRight,
  Film,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const [selectedLang, setSelectedLang] = useState<"hindi" | "english" | "hinglish" | "urdu">("hindi");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [rawAudioToggle, setRawAudioToggle] = useState<boolean>(false);
  const [isPlayingDemo, setIsPlayingDemo] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const demoLanguages = [
    {
      id: "hindi" as const,
      label: "Hindi",
      native: "हिंदी",
      caption: "अपने वीडियो को स्मार्ट कैप्शन के साथ वायरल बनाएं।",
      highlightWords: ["स्मार्ट", "कैप्शन", "वायरल"],
      sampleTime: "00:01.40",
      description: "Accurate Devanagari script preservation with zero phonetic corruption.",
    },
    {
      id: "english" as const,
      label: "English",
      native: "English",
      caption: "Turn raw footage into scroll-stopping captions in seconds.",
      highlightWords: ["scroll-stopping", "captions", "seconds"],
      sampleTime: "00:01.85",
      description: "Crisp verbatim speech-to-text with word-level precision timestamps.",
    },
    {
      id: "hinglish" as const,
      label: "Hinglish",
      native: "Hinglish Mix",
      caption: "Yeh feature aapke editing time ko 80% save karega!",
      highlightWords: ["editing", "time", "80%"],
      sampleTime: "00:02.10",
      description: "Bilingual Romanized Hindi & English mix spoken naturally across South Asia.",
    },
    {
      id: "urdu" as const,
      label: "Urdu",
      native: "اردو / Roman",
      caption: "Apni videos ko professional captions ke sath viral banayein.",
      highlightWords: ["professional", "captions", "viral"],
      sampleTime: "00:01.60",
      description: "Colloquial Urdu phrasing formatted cleanly for fast social feeds.",
    },
  ];

  const currentLang = demoLanguages.find((l) => l.id === selectedLang) || demoLanguages[0];

  const toggleDemoPlay = () => {
    if (videoRef.current) {
      if (isPlayingDemo) {
        videoRef.current.pause();
        setIsPlayingDemo(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlayingDemo(true);
      }
    } else {
      setIsPlayingDemo(!isPlayingDemo);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#07080A] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300 font-sans antialiased overflow-x-hidden">
      
      {/* FLOATING TOP NAVIGATION PILL (Matches Kalakar Screenshot 1) */}
      <div className="sticky top-4 z-50 px-4 sm:px-6 w-full flex justify-center">
        <header className="w-full max-w-5xl rounded-full border border-white/10 bg-[#0d0f14]/85 backdrop-blur-xl px-5 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 p-0.5">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#07080A]">
                <Sparkles className="h-4 w-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <span className="text-lg font-black tracking-tight text-white group-hover:text-emerald-300 transition-colors">
              Kalalo
            </span>
          </Link>

          {/* Centered Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
            <a href="#about" className="hover:text-white transition-colors">
              About
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <Link href="/presets" className="hover:text-white transition-colors">
              Presets
            </Link>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
          </nav>

          {/* Right Action Button: Glowing Mint Pill */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 px-4 sm:px-5 py-1.5 sm:py-2 text-xs font-extrabold shadow-[0_0_20px_rgba(52,211,153,0.35)] transition-all hover:scale-105 active:scale-95"
            >
              <span>Sign In</span>
              <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
            </Link>
          </div>
        </header>
      </div>

      {/* SECTION B: HERO SECTION (Matches Kalakar Screenshot 1) */}
      <section className="relative pt-16 pb-16 md:pt-24 md:pb-24 text-center overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98108_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Emerald Glow Horizon */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[450px] w-[750px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-800/15 to-transparent blur-[140px]" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Headline inspired by Kalakar Reference */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-4xl mx-auto">
            <span className="text-emerald-400">Captioning</span> Software,
            <br />
            Made by Desi Creators,
            <br />
            For Desi Creators
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto font-medium">
            Auto-generate accurate captions in all major <strong className="text-slate-200">desi languages</strong> in seconds
          </p>

          {/* Big Mint Glowing Pill CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black px-8 py-3.5 text-sm sm:text-base shadow-[0_0_35px_rgba(52,211,153,0.45)] transition-all hover:scale-105 active:scale-95"
            >
              <span>Get started now</span>
              <ArrowUpRight className="h-4 w-4 stroke-[3]" />
            </Link>
          </div>

          {/* Trust and Social Proof Line */}
          <div className="mt-8 flex flex-col items-center justify-center text-xs text-slate-400 gap-1.5">
            <span className="text-slate-300 font-semibold tracking-wide">
              Trusted by over 200,000+ Users & Video Creators
            </span>
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="ml-1 text-xs font-bold text-white">4.9</span>
              <span className="ml-1 text-[11px] text-slate-500 font-medium">Google AI Partner</span>
            </div>
          </div>
        </div>

        {/* GLOWING CURVED HORIZON LINE */}
        <div className="relative mt-12 w-full flex justify-center pointer-events-none">
          <div className="h-px w-3/4 max-w-4xl bg-gradient-to-r from-transparent via-emerald-500/80 to-transparent shadow-[0_0_20px_#10b981]" />
        </div>

        {/* SECTION C: INTERACTIVE LANGUAGE SELECTOR & LIVE DEMO CARD (Screenshot 1 Bottom) */}
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mt-12">
          <div className="rounded-3xl border border-white/10 bg-[#0d0f14]/90 p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-xl text-left">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Select your Language */}
              <div className="md:col-span-5 space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Select your Language
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                    Choose a regional dialect or script to preview accurate speech transcription and custom formatting in action.
                  </p>
                </div>

                {/* Pill Selectors */}
                <div className="flex flex-wrap gap-2.5">
                  {demoLanguages.map((lang) => {
                    const isSelected = selectedLang === lang.id;
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setSelectedLang(lang.id)}
                        className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            : "bg-[#141822] text-slate-400 border border-white/5 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3] text-emerald-400" />}
                        <span>{lang.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3.5 rounded-xl border border-white/5 bg-[#12151d] text-xs text-slate-300 space-y-1">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" />
                    <span>{currentLang.native} Processing</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{currentLang.description}</p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/editor?sample=true"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <span>Open Interactive Studio Editor</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Live Video/Caption Display Card */}
              <div className="md:col-span-7 flex flex-col items-center justify-center">
                <div className="w-full max-w-md aspect-[16/10] sm:aspect-[16/9] rounded-2xl border border-white/10 bg-gradient-to-b from-[#141824] to-[#0a0c10] p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                  {/* Speaker Video / Backdrop */}
                  <video
                    ref={videoRef}
                    src="/api/media/stream?path=samples/sample-video.mp4"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                    loop
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60 pointer-events-none" />

                  {/* Top Bar on Video */}
                  <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-300 font-mono">
                    <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur border border-white/10">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE AI PREVIEW
                    </span>
                    <span className="rounded-full bg-black/60 px-2.5 py-1 backdrop-blur border border-white/10">
                      {currentLang.sampleTime}
                    </span>
                  </div>

                  {/* Dynamic Centered Captions with Highlighted Words */}
                  <div className="relative z-10 my-auto text-center px-4">
                    <div className="inline-block p-3 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 shadow-2xl">
                      <p className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                        {currentLang.caption.split(" ").map((word, idx) => {
                          const isHigh = currentLang.highlightWords.some((hw) =>
                            word.toLowerCase().includes(hw.toLowerCase())
                          );
                          return (
                            <span
                              key={idx}
                              className={`inline-block mx-1 ${
                                isHigh
                                  ? "text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]"
                                  : "text-white"
                              }`}
                            >
                              {word}
                            </span>
                          );
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Playback Control on Preview */}
                  <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-2 text-xs">
                    <button
                      type="button"
                      onClick={toggleDemoPlay}
                      className="flex items-center gap-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1 transition-all cursor-pointer"
                    >
                      {isPlayingDemo ? <Pause className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
                      <span className="text-[11px]">{isPlayingDemo ? "Pause" : "Play Clip"}</span>
                    </button>

                    <span className="text-[10px] text-slate-400 font-mono">
                      Language: <strong className="text-emerald-400">{currentLang.label}</strong>
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* SECTION: STATE OF THE ART AUDIO ENHANCEMENT (Matches Kalakar Screenshot 2) */}
      <section className="py-20 md:py-28 border-t border-white/5 relative">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-[#0d0f14]/90 p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              
              {/* Left Column Text & Pills */}
              <div className="md:col-span-6 space-y-6 text-left">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                    State of The Art
                    <br />
                    <span className="text-emerald-400">Audio Enhancement!</span>
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  <strong className="text-slate-200">Kalalo</strong> offers <strong className="text-slate-200">Studio Grade Audio Enhancement</strong> using complex algorithms & AI. Audio Enhancement has been tested for multiple Scenarios including Harsh Traffic, white noise, crowds, hiss or any other form of Noise Pattern.
                </p>

                {/* Badge Pills from Screenshot 2 */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <span className="rounded-full bg-[#141822] border border-emerald-500/40 text-emerald-400 px-3.5 py-1.5 text-xs font-semibold">
                    Works In Seconds
                  </span>
                  <span className="rounded-full bg-[#141822] border border-emerald-500/40 text-emerald-400 px-3.5 py-1.5 text-xs font-semibold">
                    Realtime Playback
                  </span>
                  <span className="rounded-full bg-[#141822] border border-emerald-500/40 text-emerald-400 px-3.5 py-1.5 text-xs font-semibold">
                    Studio Quality
                  </span>
                </div>
              </div>

              {/* Right Column: Audio Switcher Video Card */}
              <div className="md:col-span-6 flex justify-center">
                <div className="w-full max-w-sm aspect-[4/5] rounded-2xl border border-white/10 bg-[#12151e] p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#1e293b_0%,#090b0e_100%)] opacity-80" />
                  
                  {/* Raw Audio Switch Pill (from Screenshot 2) */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-slate-300 border border-white/10">
                      • {rawAudioToggle ? "Enhanced Studio Audio" : "Raw Audio"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRawAudioToggle(!rawAudioToggle)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                        rawAudioToggle ? "bg-emerald-500" : "bg-slate-700"
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          rawAudioToggle ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Center Speaker Graphic */}
                  <div className="relative z-10 my-auto text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)] mb-3">
                      {rawAudioToggle ? <Volume2 className="h-8 w-8" /> : <VolumeX className="h-8 w-8 text-slate-400" />}
                    </div>
                    <p className="text-xs font-bold text-white">
                      {rawAudioToggle ? "Clean 16kHz Vocal Isolation Active" : "Original Noisy Video Track"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Noise gate, frequency normalization & de-hissing</p>
                  </div>

                  <div className="relative z-10 flex items-center justify-center border-t border-white/10 pt-2 text-[11px] text-slate-400 font-mono">
                    High-Speech Fidelity Mono 64kbps
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* SECTION: UNBEATABLE PRICING (Matches Kalakar Screenshot 3) */}
      <section id="pricing" className="py-20 md:py-28 border-t border-white/5 relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Unbeatable Pricing <span className="text-emerald-400">Across Industry</span>
          </h2>

          {/* Monthly / Yearly Toggle (from Screenshot 3) */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="flex items-center rounded-full bg-[#12141c] p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-full px-5 py-1.5 text-xs font-bold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-white text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`rounded-full px-5 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all ${
                  billingCycle === "yearly"
                    ? "bg-white text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>Yearly</span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 text-[9px] font-extrabold">
                  SAVE
                </span>
              </button>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold font-mono">
              ⤷ 2 months free
            </span>
          </div>

          {/* 4 Pricing Cards Grid (Exact structure from Screenshot 3) */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            
            {/* Card 1: Free */}
            <div className="rounded-3xl border border-white/10 bg-[#0d0f14] p-6 flex flex-col justify-between hover:border-white/20 transition-all">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-300 mb-4">
                  <Flame className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Free</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">₹ 0</span>
                  <span className="text-[11px] text-slate-400">+ GST</span>
                </div>
                <span className="text-[11px] text-slate-500">/ per month</span>

                <Link
                  href="/login"
                  className="mt-5 w-full block text-center rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold py-2.5 text-xs transition-colors"
                >
                  Get Started
                </Link>

                <div className="mt-6 pt-5 border-t border-white/5 space-y-3 text-xs text-slate-300">
                  <p className="font-bold text-white text-[11px] uppercase tracking-wider">Key Features</p>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>All Languages</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>5 Minutes Free Testing (Full Templates)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>5 GB Cloud Storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Max Video Length 2 min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>3 Audio Enhancement Credits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>&quot;No Watermark&quot; Free Render</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Editor Plan */}
            <div className="rounded-3xl border border-white/10 bg-[#0d0f14] p-6 flex flex-col justify-between hover:border-white/20 transition-all">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-300 mb-4">
                  <Sliders className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Editor Plan</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">₹ 670</span>
                  <span className="text-[11px] text-slate-400">+ GST</span>
                </div>
                <span className="text-[11px] text-slate-500">/ per month</span>

                <Link
                  href="/login"
                  className="mt-5 w-full block text-center rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold py-2.5 text-xs transition-colors"
                >
                  Get Started
                </Link>

                <div className="mt-6 pt-5 border-t border-white/5 space-y-3 text-xs text-slate-300">
                  <p className="font-bold text-white text-[11px] uppercase tracking-wider">Everything In Free, plus</p>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>2 Hours of Transcription</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>20 GB Cloud Storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Max Video Length 2 min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>50 Videos Audio Enhancement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Custom Font Upload</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>1080p / 30 FPS render</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Creator Plan (Most Popular with Green Border) */}
            <div className="rounded-3xl border-2 border-emerald-500 bg-[#0e1219] p-6 flex flex-col justify-between shadow-[0_0_40px_rgba(16,185,129,0.2)] relative">
              <div className="absolute -top-3.5 right-6 rounded-full bg-emerald-500 text-slate-950 font-black px-3 py-0.5 text-[10px] tracking-wider uppercase">
                Most Popular
              </div>
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-4">
                  <Rocket className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Creator Plan</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">₹ 950</span>
                  <span className="text-[11px] text-slate-400">+ GST</span>
                </div>
                <span className="text-[11px] text-slate-500">/ per month</span>

                <Link
                  href="/login"
                  className="mt-5 w-full block text-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2.5 text-xs transition-colors shadow-lg shadow-emerald-500/30"
                >
                  Get Started
                </Link>

                <div className="mt-6 pt-5 border-t border-white/5 space-y-3 text-xs text-slate-300">
                  <p className="font-bold text-emerald-400 text-[11px] uppercase tracking-wider">Everything in Editor, plus</p>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>5 Hours of Transcription</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>60 GB Cloud Storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Max Video Length 5 min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Unlimited Audio Enhancement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>4K / 60 FPS render</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Subtitles (.srt / .vtt)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Studio Plan */}
            <div className="rounded-3xl border border-white/10 bg-[#0d0f14] p-6 flex flex-col justify-between hover:border-white/20 transition-all">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-300 mb-4">
                  <Crown className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Studio Plan</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">₹ 2400</span>
                  <span className="text-[11px] text-slate-400">+ GST</span>
                </div>
                <span className="text-[11px] text-slate-500">/ per month</span>

                <Link
                  href="/login"
                  className="mt-5 w-full block text-center rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold py-2.5 text-xs transition-colors"
                >
                  Get Started
                </Link>

                <div className="mt-6 pt-5 border-t border-white/5 space-y-3 text-xs text-slate-300">
                  <p className="font-bold text-white text-[11px] uppercase tracking-wider">Everything in Creator, plus</p>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>12 Hours of Transcription</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>150 GB Cloud Storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Max Video Length 30 min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Alpha Channel Render</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Transcript Export (.docx / .txt)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Add Unlimited Team Members</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION: LOVED BY CREATORS ACROSS SOCIAL FEEDS (Matches Kalakar Screenshot 4) */}
      <section className="py-20 md:py-28 border-t border-white/5 relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Loved by Creators Across <span className="text-emerald-400">South Asia</span>
          </h2>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* Left Column: 9:16 Video Card 1 */}
            <div className="md:col-span-4 rounded-3xl border border-white/10 bg-[#0d0f14] p-4 flex flex-col justify-between relative overflow-hidden min-h-[460px] text-left">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black opacity-90" />
              
              <div className="relative z-10 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>9:16 SHORTS</span>
                <span className="text-emerald-400 font-bold">1080 x 1920</span>
              </div>

              {/* Bold Captions Overlay */}
              <div className="relative z-10 my-auto text-center px-3">
                <div className="inline-block p-2 rounded bg-black/70 backdrop-blur border border-black/40">
                  <p className="text-lg font-black uppercase text-emerald-400 tracking-tight leading-tight drop-shadow-[0_4px_12px_rgba(16,185,129,0.5)]">
                    SO I&apos;VE BEEN<br />EDITING VIDEOS
                  </p>
                </div>
              </div>

              {/* Creator Tag & Play Button */}
              <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                    B
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-none">Bhuwan</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">• India</p>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                </div>
              </div>
            </div>

            {/* Center Column: 3 Stacked Dark Quote Cards (from Screenshot 4) */}
            <div className="md:col-span-4 flex flex-col justify-between gap-4 text-left">
              
              {/* Quote 1: Aarav */}
              <div className="rounded-2xl border border-white/10 bg-[#0d0f14] p-5">
                <p className="text-xs text-slate-300 leading-relaxed">
                  &ldquo;I&apos;ve been using Kalalo recently &amp; it&apos;s honestly super helpful. It supports multiple languages, generating Hindi captions used to be a real struggle, but with Kalalo the process is super smooth.&rdquo;
                </p>
                <div className="mt-3 flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-emerald-900/60 border border-emerald-500/30 flex items-center justify-center text-[11px] font-bold text-emerald-300">
                    A
                  </div>
                  <span className="text-xs font-bold text-white">Aarav</span>
                </div>
              </div>

              {/* Quote 2: Zaryab Khan */}
              <div className="rounded-2xl border border-white/10 bg-[#0d0f14] p-5">
                <p className="text-xs text-slate-300 leading-relaxed">
                  &ldquo;If you&apos;re an editor or creator, this software is your only solution. It&apos;s got all the trendy captioning styles available like beast style, Iman Gadzhi, Devin Jatho, Alex hormozi etc just one click away.&rdquo;
                </p>
                <div className="mt-3 flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-teal-900/60 border border-teal-500/30 flex items-center justify-center text-[11px] font-bold text-teal-300">
                    Z
                  </div>
                  <span className="text-xs font-bold text-white">Zaryab Khan</span>
                </div>
              </div>

              {/* Quote 3: Ahsan Imran */}
              <div className="rounded-2xl border border-white/10 bg-[#0d0f14] p-5">
                <p className="text-xs text-slate-300 leading-relaxed">
                  &ldquo;Kalalo as a captioning software is one of the best out there. Its premade templates are really helpful &amp; loading times are really quick. Overall as an editor it makes the captioning much more easier.&rdquo;
                </p>
                <div className="mt-3 flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-purple-900/60 border border-purple-500/30 flex items-center justify-center text-[11px] font-bold text-purple-300">
                    A
                  </div>
                  <span className="text-xs font-bold text-white">Ahsan Imran</span>
                </div>
              </div>

            </div>

            {/* Right Column: 9:16 Video Card 2 */}
            <div className="md:col-span-4 rounded-3xl border border-white/10 bg-[#0d0f14] p-4 flex flex-col justify-between relative overflow-hidden min-h-[460px] text-left">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black opacity-90" />
              
              <div className="relative z-10 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>CINEMA SUBTITLE</span>
                <span className="text-emerald-400 font-bold">1080 x 1920</span>
              </div>

              {/* Minimal Cinema Subtitle */}
              <div className="relative z-10 my-auto text-center px-4">
                <div className="inline-block p-2 rounded bg-black/60 backdrop-blur">
                  <p className="text-xs font-medium text-slate-100 tracking-wider">
                    BECAUSE I ENJOY THIS<br />AND SINCE DAY ONE
                  </p>
                </div>
              </div>

              {/* Creator Tag & Play Button */}
              <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                    I
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-none">Irfan Junejo</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">• Pakistan</p>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION: EXPORT IN SRT OR ALPHA CHANNEL (Matches Kalakar Screenshot 5) */}
      <section className="py-20 md:py-28 border-t border-white/5 relative">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Export in <span className="text-emerald-400">SRT or Alpha Channel</span>
          </h2>

          <p className="mt-4 text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            For all the Pro-Editors, <strong className="text-slate-200">cross NLE support available</strong> to bring captions back locally in your own software of choice, both as Alpha channel or as an SRT File
          </p>

          <div className="mt-6">
            <Link
              href="/editor"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black px-6 py-2.5 text-xs shadow-[0_0_25px_rgba(52,211,153,0.35)] transition-all hover:scale-105"
            >
              <span>Join now</span>
              <ArrowUpRight className="h-3.5 w-3.5 stroke-[3]" />
            </Link>
          </div>

          {/* Software Bridge Diagram (from Screenshot 5) */}
          <div className="mt-14 max-w-3xl mx-auto rounded-3xl border border-white/10 bg-[#0d0f14] p-8 sm:p-12 shadow-2xl relative">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              
              {/* Left Box: Premiere, FCP, Resolve */}
              <div className="rounded-2xl border border-white/10 bg-[#12151e] p-5 flex items-center gap-3">
                <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                  <span className="px-2 py-1 rounded bg-[#00005b] text-purple-300 font-mono text-[11px] border border-purple-500/30">Pr</span>
                  <span className="px-2 py-1 rounded bg-[#333] text-cyan-300 font-mono text-[11px] border border-cyan-500/30">FCP</span>
                  <span className="px-2 py-1 rounded bg-[#4a154b] text-pink-300 font-mono text-[11px] border border-pink-500/30">Resolve</span>
                </div>
                <span className="text-slate-500 text-xs">:</span>
                <span className="text-emerald-400 font-mono text-xs">Video</span>
              </div>

              {/* Center Connection: Kalalo Pill */}
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-emerald-500/60 hidden sm:block" />
                <div className="rounded-full bg-emerald-500/20 border border-emerald-500/50 px-4 py-1.5 text-xs font-black text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                  Kalalo
                </div>
                <div className="h-px w-8 bg-emerald-500/60 hidden sm:block" />
              </div>

              {/* Right Box: Output Subtitles & Burn-In */}
              <div className="rounded-2xl border border-white/10 bg-[#12151e] p-5 flex items-center gap-3">
                <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                  <span className="rounded bg-emerald-950/80 border border-emerald-800/40 px-2 py-1 text-emerald-300 font-bold">
                    .SRT / .VTT
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-1 text-slate-300 font-bold">
                    1080p MP4
                  </span>
                </div>
              </div>

            </div>

            <p className="mt-8 text-[11px] text-slate-500 font-mono">
              Export video from software ➔ Auto-generate captions with Gemini ➔ Re-import subtitle tracks without quality loss
            </p>
          </div>

        </div>
      </section>

      {/* FINAL CALL TO ACTION & FOOTER */}
      <footer className="bg-[#050608] border-t border-white/5 text-slate-400 text-xs">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            
            {/* Brand Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 p-0.5">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-[#07080A]">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                  </div>
                </div>
                <span className="text-base font-black text-white tracking-tight">Kalalo</span>
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Captioning software engineered for desi creators. Multi-language speech recognition, viral social presets, and FFmpeg video burn-in.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Product</h4>
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
                    Creator Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/diagnostics" className="hover:text-emerald-400 transition-colors">
                    System Diagnostics
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h4 className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Resources</h4>
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
                    Sign In / Register
                  </Link>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-emerald-400 transition-colors">
                    Pricing Plans
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Legal &amp; Privacy</h4>
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
                  PostgreSQL Row-Level Security Enforced
                </li>
              </ul>
            </div>

          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px] gap-4">
            <p>© {new Date().getFullYear()} Kalalo. All rights reserved.</p>
            <p className="flex items-center gap-1.5 text-slate-400">
              <span>Made with Google Gemini &amp; Next.js</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
