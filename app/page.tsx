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
  Terminal,
  Cpu,
} from "lucide-react";

export default function LandingPage() {
  const languages = [
    { name: "Hinglish", tag: "Primary", desc: "Colloquial mixed Hindi & English" },
    { name: "Hindi (हिंदी)", tag: "Native", desc: "Devanagari script preservation" },
    { name: "English", tag: "Global", desc: "High-accuracy clean subtitles" },
    { name: "Auto-Detect", tag: "AI", desc: "Automatic speech recognition" },
  ];

  const presets = [
    { name: "Clean Bold", id: "kalalo-clean-bold", style: "High contrast white with thick black outline" },
    { name: "Cinema", id: "kalalo-cinema", style: "Letter-spaced off-white with subtle drop shadow" },
    { name: "Pop Highlight", id: "kalalo-pop-highlight", style: "Vibrant yellow accents for fast social feeds" },
    { name: "Devanagari Clear", id: "kalalo-devanagari-clear", style: "Engineered specifically for Hindi glyph metrics" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#090B0E]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-32">
        {/* Ambient gradient glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-purple-900/30 via-indigo-900/20 to-emerald-900/10 blur-[130px]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-950/40 px-3 py-1.5 text-xs font-semibold text-purple-300 shadow-sm backdrop-blur mb-6">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>AI-Powered Captioning Studio & MCP Server</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl max-w-4xl mx-auto leading-[1.1]">
            Accurate captions for{" "}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              Hinglish, Hindi & English
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Auto-generate timestamped subtitles, apply original social media typography presets, preview vertical 9:16 videos, and burn captions with FFmpeg.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-purple-600/25 hover:from-purple-500 hover:to-indigo-500 transition-all hover:scale-105"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/editor?sample=true"
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all backdrop-blur"
            >
              <Video className="h-4 w-4 text-emerald-400" />
              <span>Try Demo Walkthrough</span>
            </Link>

            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#101318] px-5 py-3.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <span>Sign In</span>
            </Link>

            <Link
              href="/diagnostics"
              className="hidden sm:flex items-center gap-2 rounded-xl border border-border bg-[#101318] px-4 py-3.5 text-sm font-medium text-slate-400 hover:text-purple-300 transition-colors"
            >
              <Cpu className="h-4 w-4 text-purple-400" />
              <span>Diagnostics</span>
            </Link>
          </div>

          {/* Visual Preview Card */}
          <div className="mt-16 rounded-2xl border border-border bg-[#101318]/90 p-3 sm:p-5 shadow-2xl backdrop-blur max-w-4xl mx-auto text-left">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-sans font-semibold text-slate-300">Kalalo Studio — Live Caption Editor</span>
              </div>
              <span className="text-purple-400 font-semibold">9:16 Vertical Preview</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Segments Preview */}
              <div className="rounded-xl border border-border bg-[#0B0D11] p-3 space-y-2">
                <p className="text-[10px] font-bold uppercase text-slate-500">Caption Segments</p>
                <div className="rounded-lg border border-purple-500/40 bg-purple-950/20 p-2 text-xs">
                  <div className="flex justify-between text-[10px] font-mono text-purple-300 mb-1">
                    <span>00:00:00.00</span>
                    <span>00:00:01.50</span>
                  </div>
                  <p className="font-medium text-slate-100">Namaste! Welcome to Kalalo AI.</p>
                </div>
                <div className="rounded-lg border border-border bg-slate-900/40 p-2 text-xs">
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
                    <span>00:00:01.60</span>
                    <span>00:00:03.20</span>
                  </div>
                  <p className="text-slate-300">Aaj hum Hinglish captions banayenge.</p>
                </div>
              </div>

              {/* Video Mockup Preview */}
              <div className="rounded-xl border border-border bg-[#0B0D11] flex flex-col items-center justify-center p-4 relative min-h-[220px]">
                <div className="h-36 w-20 rounded-lg bg-slate-900 border border-slate-700/60 relative flex flex-col justify-end p-2 items-center">
                  <span className="text-[7px] text-center font-bold text-white bg-black/60 px-1 py-0.5 rounded shadow">
                    Namaste! Welcome to Kalalo.
                  </span>
                </div>
                <p className="mt-2 text-[11px] font-mono text-slate-500">Preset: Clean Bold (9:16)</p>
              </div>

              {/* Presets Preview */}
              <div className="rounded-xl border border-border bg-[#0B0D11] p-3 space-y-2">
                <p className="text-[10px] font-bold uppercase text-slate-500">Original Presets</p>
                {presets.slice(0, 3).map((p) => (
                  <div key={p.id} className="rounded-lg border border-border p-2 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-200">{p.name}</p>
                      <p className="text-[10px] text-slate-500">{p.style}</p>
                    </div>
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Languages & Dialects Section */}
      <section className="border-t border-border bg-[#0D1015] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Built for South Asian Languages First
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Preserves script integrity, mixed Romanized phrases, and colloquial vocabulary without forced translations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {languages.map((lang) => (
              <div
                key={lang.name}
                className="rounded-xl border border-border bg-[#12161E] p-4 hover:border-purple-500/40 transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white">{lang.name}</span>
                  <span className="rounded bg-purple-950/80 border border-purple-800/40 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                    {lang.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{lang.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 border-t border-border bg-[#090B0E]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              The 5-Step Creator Workflow
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              From raw footage to rendered video in under 60 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: "01", title: "Upload Media", desc: "Drag & drop MP4, MOV, or audio file" },
              { step: "02", title: "Transcribe Speech", desc: "Fast STT with auto or manual language" },
              { step: "03", title: "Edit & Time", desc: "Split, merge, or adjust timestamp bounds" },
              { step: "04", title: "Select Preset", desc: "Choose from 6 original visual styles" },
              { step: "05", title: "Render & Export", desc: "Burn in captions with FFmpeg or export SRT" },
            ].map((s) => (
              <div key={s.step} className="rounded-xl border border-border bg-[#101318] p-4 text-center">
                <span className="text-2xl font-black text-purple-500/50">{s.step}</span>
                <h3 className="mt-2 text-sm font-bold text-slate-100">{s.title}</h3>
                <p className="mt-1 text-xs text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-[#0B0D11] py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Kalalo Studio. Open Model Context Protocol & Creator Toolkit.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/dashboard" className="hover:text-purple-300">Dashboard</Link>
            <Link href="/editor" className="hover:text-purple-300">Editor</Link>
            <Link href="/presets" className="hover:text-purple-300">Presets</Link>
            <Link href="/diagnostics" className="hover:text-purple-300">Diagnostics</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
