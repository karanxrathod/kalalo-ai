"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Save,
  LogOut,
  FolderOpen,
  Settings,
  ShieldCheck,
  Calendar,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { getSupabaseBrowserClient } from "@/src/lib/supabase/client";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  createdAt?: string;
  role?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Projects count
  const [projectsCount, setProjectsCount] = useState<number>(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setProfile(data.user);
        setDisplayName(data.user.name || "");
      } else {
        // Not authenticated, redirect to login
        router.push("/login");
        return;
      }

      // Fetch projects count
      const projRes = await fetch("/api/projects");
      if (projRes.ok) {
        const projData = await projRes.json();
        if (Array.isArray(projData.projects)) {
          setProjectsCount(projData.projects.length);
        }
      }
    } catch (err: unknown) {
      setErrorMessage("Failed to load user profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);

    if (!displayName.trim()) {
      setErrorMessage("Display name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setProfile((prev) => (prev ? { ...prev, name: displayName } : null));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      // Also sync browser-side client session if present
      try {
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          await supabase.auth.updateUser({ password: newPassword });
        }
      } catch {}

      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        await supabase.auth.signOut().catch(() => {});
      }
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090B0E] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-sm font-medium">Loading creator profile...</p>
        </div>
      </div>
    );
  }

  const initial = (profile?.name || profile?.email || "C").charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-[#090B0E] text-slate-100 font-sans">
      <Navbar />

      <main className="relative flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-950/20 text-xs font-semibold text-red-400 hover:bg-red-900/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Profile Header Hero Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#12151D] p-6 shadow-xl flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0D0F14] rounded-[14px] flex items-center justify-center text-2xl font-black text-white">
                {initial}
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#090B0E]">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">{profile?.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                PRO CREATOR
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>{profile?.email}</span>
            </p>
            {profile?.createdAt && (
              <p className="text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              </p>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-5">
            <div className="text-center px-3 py-1 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-lg font-black text-emerald-400 font-mono block">
                {projectsCount}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">Projects</span>
            </div>
            <div className="text-center px-3 py-1 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-lg font-black text-cyan-400 font-mono block">Active</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">Cloud Sync</span>
            </div>
          </div>
        </div>

        {/* 2-Column Forms: Personal Details & Security */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Profile Information */}
          <div className="rounded-2xl border border-slate-800 bg-[#12151D] p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <User className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Profile Details</h2>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Profile saved successfully to cloud!</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Maya Sharma"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address (Verified)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    disabled
                    value={profile?.email || ""}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/30 py-2.5 pl-10 pr-4 text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-extrabold text-black transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Security & Password */}
          <div className="rounded-2xl border border-slate-800 bg-[#12151D] p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Lock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Account Security</h2>
            </div>

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Password updated successfully!</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword || !newPassword}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-bold text-white border border-slate-700 transition-all disabled:opacity-40 cursor-pointer"
                >
                  {isUpdatingPassword ? (
                    <span>Updating Password...</span>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Fast Action Shortcuts */}
        <div className="rounded-2xl border border-slate-800 bg-[#12151D] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Supabase Cloud PostgreSQL &amp; Storage Isolated Tenant Security</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>AI Settings</span>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold hover:bg-emerald-500/20 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Open Dashboard</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
