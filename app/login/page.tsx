"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Lock, Mail, User, ArrowRight, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister ? { name, email, password } : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Successful login/register
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setIsRegister(false);
    setEmail("creator@kalalo.ai");
    setPassword("Creator123!");
    setError(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#090B0E]">
      <Navbar />

      <main className="relative flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-[450px] w-[650px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-purple-900/30 via-indigo-900/20 to-emerald-900/10 blur-[130px]" />

        <div className="relative w-full max-w-md">
          {/* Card Container */}
          <div className="rounded-2xl border border-slate-800 bg-[#101318]/90 p-8 shadow-2xl backdrop-blur-xl">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-400 p-0.5 shadow-lg shadow-purple-500/25 mb-4">
                <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#090B0E]">
                  <Sparkles className="h-6 w-6 text-purple-400" />
                </div>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {isRegister ? "Create your Kalalo account" : "Welcome back to Kalalo"}
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                {isRegister
                  ? "Sign up to start auto-captioning Hinglish, Hindi & English videos"
                  : "Sign in to access your projects, custom presets, and export renders"}
              </p>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                  !isRegister
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                  isRegister
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Maya Sharma"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  {isRegister && (
                    <span className="text-[11px] text-slate-500">Min 6 characters</span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 hover:bg-right transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>{isRegister ? "Create Account & Get Started" : "Sign In to Studio"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Pre-fill */}
            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400 mb-2">Want to test with our pre-configured creator account?</p>
              <button
                type="button"
                onClick={handleFillDemo}
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-950/30 px-3 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-900/40 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
                <span>Fill Demo Creator Account (creator@kalalo.ai)</span>
              </button>
            </div>

            {/* Security Assurance */}
            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Encrypted credentials & isolated project tenant data</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
