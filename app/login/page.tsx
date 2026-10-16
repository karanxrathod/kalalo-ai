"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Lock, Mail, User, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { getSupabaseBrowserClient } from "@/src/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("provider is not enabled") || msg.includes("Unsupported provider")) {
        setError(
          "Google Sign-In is not enabled in your Supabase Auth dashboard yet (requires Google Cloud Console OAuth Client ID & Secret). Please sign in using Email & Password or use the Demo Creator Account below."
        );
      } else {
        setError(msg || "Failed to initiate Google sign in");
      }
      setIsGoogleLoading(false);
    }
  };

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

            {/* Google Authentication Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full mb-4 flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800/90 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:border-slate-600 disabled:opacity-50 cursor-pointer"
            >
              {isGoogleLoading ? (
                <span className="text-xs">Connecting to Google...</span>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative mb-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <span className="relative bg-[#101318] px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Or with Email
              </span>
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
