"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Save,
  Trash2,
  Sparkles,
  Sliders,
  ShieldAlert,
  ArrowRight,
  Cpu,
  Layers,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { ORIGINAL_PRESETS } from "@/src/presets/presets";

interface SettingsData {
  provider: "mock" | "gemini" | "openai";
  model: string;
  language: string;
  aspectRatio: string;
  defaultPreset: string;
  gemini: {
    hasKey: boolean;
    maskedKey: string;
    model: string;
  };
  openai: {
    hasKey: boolean;
    maskedKey: string;
    model: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Gemini Key state
  const [geminiKeyInput, setGeminiKeyInput] = useState<string>("");
  const [showKey, setShowKey] = useState<boolean>(false);
  const [testingKey, setTestingKey] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Default Preferences state
  const [selectedProvider, setSelectedProvider] = useState<string>("gemini");
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.5-flash-lite");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("auto");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>("9:16");
  const [selectedPreset, setSelectedPreset] = useState<string>("kalalo-clean-bold");

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data: SettingsData = await res.json();
        setSettings(data);
        setSelectedProvider(data.provider);
        setSelectedModel(data.gemini?.model || "gemini-3.5-flash-lite");
        setSelectedLanguage(data.language);
        setSelectedAspectRatio(data.aspectRatio);
        setSelectedPreset(data.defaultPreset);
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveGeminiKey = async () => {
    if (!geminiKeyInput.trim()) return;
    setSaving(true);
    setSaveSuccess(false);
    setTestResult(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiApiKey: geminiKeyInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeminiKeyInput("");
        setSaveSuccess(true);
        loadSettings();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(data.error || "Failed to save key");
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error saving key");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveGeminiKey = async () => {
    if (!confirm("Are you sure you want to remove your Google Gemini API key?")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", { method: "DELETE" });
      if (res.ok) {
        setGeminiKeyInput("");
        setTestResult(null);
        loadSettings();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleTestGeminiKey = async () => {
    setTestingKey(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/settings/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: geminiKeyInput.trim() || undefined,
          model: selectedModel || undefined,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e) {
      setTestResult({
        success: false,
        message: e instanceof Error ? e.message : "Failed to connect to Gemini API",
      });
    } finally {
      setTestingKey(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultProvider: selectedProvider,
          defaultModel: selectedModel,
          defaultLanguage: selectedLanguage,
          defaultAspectRatio: selectedAspectRatio,
          defaultPreset: selectedPreset,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      alert("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0D11] text-white flex">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-[#1E2028]">
          <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure your AI transcription credentials, speech models, and default rendering preferences.
          </p>
        </div>

        {/* SECTION 1: AI Providers & API Keys */}
        <section className="mb-10 bg-[#14151C] rounded-2xl border border-[#21232E] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#21232E] mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#FDC537]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">AI Providers & API Keys</h2>
                <p className="text-[11px] text-slate-400">
                  Use your personal Google Gemini API key for transcription.
                </p>
              </div>
            </div>

            {settings?.gemini.hasKey ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Configured
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Key Required
              </span>
            )}
          </div>

          {/* Gemini Key Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Google Gemini API Key
              </label>

              {settings?.gemini.hasKey && (
                <div className="mb-2.5 flex items-center justify-between p-2.5 rounded-xl bg-[#0C0D11] border border-[#21232E] text-xs">
                  <div className="flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-slate-300">{settings.gemini.maskedKey}</span>
                  </div>
                  <button
                    onClick={handleRemoveGeminiKey}
                    title="Remove saved key"
                    className="text-red-400 hover:text-red-300 text-[11px] font-medium flex items-center gap-1 hover:underline"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              )}

              <div className="relative flex items-center">
                <input
                  type={showKey ? "text" : "password"}
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder={
                    settings?.gemini.hasKey
                      ? "Enter new key to replace existing..."
                      : "AIzaSy..."
                  }
                  className="w-full pr-20 pl-3.5 py-2.5 rounded-xl bg-[#0C0D11] border border-[#262834] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FDC537]/80 font-mono transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 p-1 text-slate-400 hover:text-white transition-colors"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Test & Save buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleSaveGeminiKey}
                disabled={saving || !geminiKeyInput.trim()}
                className="px-4 py-2 rounded-xl bg-[#FDC537] hover:bg-[#FBBF24] text-black font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save API Key</span>
              </button>

              <button
                type="button"
                onClick={handleTestGeminiKey}
                disabled={testingKey || (!settings?.gemini.hasKey && !geminiKeyInput.trim())}
                className="px-4 py-2 rounded-xl bg-[#1C1E26] hover:bg-[#252834] text-white font-medium text-xs border border-[#2D303E] flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingKey ? "animate-spin text-[#FDC537]" : ""}`} />
                <span>Test Connection</span>
              </button>

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-400 hover:text-[#FDC537] flex items-center gap-1 transition-colors ml-auto"
              >
                <span>Get a free Gemini API key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Test result alert */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{testResult.message}</p>
                </div>
              </div>
            )}

            {/* User Billing Responsibility Notice */}
            <div className="p-3.5 rounded-xl bg-[#0E0F14] border border-[#21232E] text-[11px] text-slate-400 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-slate-300 font-semibold">
                  Personal API Key & Billing Notice
                </p>
                <p className="leading-relaxed">
                  Your Google Gemini API key is stored securely on your local server. All API requests,
                  token consumption, and billing are charged directly to your own Google Cloud / Google AI
                  Studio account under Google's published rates. Kalalo does not charge platform markups.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Default Transcription & Rendering Preferences */}
        <section className="bg-[#14151C] rounded-2xl border border-[#21232E] p-6 shadow-sm space-y-5">
          <div className="pb-4 border-b border-[#21232E]">
            <h2 className="text-sm font-bold text-white">Default Studio Preferences</h2>
            <p className="text-[11px] text-slate-400">
              Customize default behavior for new captioning projects.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Preferred Provider */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Default STT Provider
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0C0D11] border border-[#262834] text-xs text-white focus:outline-none focus:border-[#FDC537]"
              >
                <option value="gemini">Google Gemini (Using your key)</option>
                <option value="mock">Offline Mock Engine (Fast zero-cost demo)</option>
                <option value="openai">OpenAI Whisper (If OPENAI_API_KEY configured)</option>
              </select>
            </div>

            {/* Gemini Model */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Gemini Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0C0D11] border border-[#262834] text-xs text-white focus:outline-none focus:border-[#FDC537]"
              >
                <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Recommended — Fast & Audio-Optimized)</option>
                <option value="gemini-3.8-flash">gemini-3.8-flash (Latest Generation High Precision)</option>
                <option value="gemini-3.5-flash">gemini-3.5-flash (Standard Multimodal Flash)</option>
                <option value="gemini-flash-latest">gemini-flash-latest (Auto-track Latest Flash)</option>
              </select>
            </div>

            {/* Default Language */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Default Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0C0D11] border border-[#262834] text-xs text-white focus:outline-none focus:border-[#FDC537]"
              >
                <option value="auto">Auto-Detect</option>
                <option value="hinglish">Hinglish (Hindi + English blend)</option>
                <option value="hi">Hindi (Devanagari)</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* Default Aspect Ratio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Default Video Format
              </label>
              <select
                value={selectedAspectRatio}
                onChange={(e) => setSelectedAspectRatio(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0C0D11] border border-[#262834] text-xs text-white focus:outline-none focus:border-[#FDC537]"
              >
                <option value="9:16">9:16 Vertical (Reels, Shorts, TikTok)</option>
                <option value="1:1">1:1 Square (Instagram Posts)</option>
                <option value="16:9">16:9 Landscape (YouTube, Desktop)</option>
              </select>
            </div>

            {/* Default Caption Preset */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Default Caption Preset ({ORIGINAL_PRESETS.length} Available)
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0C0D11] border border-[#262834] text-xs text-white focus:outline-none focus:border-[#FDC537]"
              >
                {ORIGINAL_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.description.slice(0, 70)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#21232E]">
            {saveSuccess ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Preferences saved!
              </span>
            ) : (
              <span className="text-xs text-slate-500">Settings apply across all studio pages</span>
            )}

            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#FDC537] hover:bg-[#FBBF24] text-black font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
