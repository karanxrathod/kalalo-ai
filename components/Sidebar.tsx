"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  User,
  Film,
  SlidersHorizontal,
  Settings as SettingsIcon,
  Activity,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [projectCount, setProjectCount] = useState<number>(0);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.projects) setProjectCount(data.projects.length);
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "My Profile", href: "/profile", icon: User },
    { name: "Presets & Styles", href: "/presets", icon: SlidersHorizontal },
    { name: "Settings & AI Keys", href: "/settings", icon: SettingsIcon },
    { name: "Diagnostics", href: "/diagnostics", icon: Activity },
  ];

  return (
    <aside className="w-56 md:w-60 flex-shrink-0 border-r border-[#1B1E26] bg-[#0E1015] flex flex-col justify-between p-4 min-h-screen select-none z-20 hidden md:flex">
      <div className="space-y-6">
        {/* Brand Header */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-[#161822] transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-[#FF2D55] text-white font-black flex items-center justify-center text-sm shadow-md shadow-[#FF2D55]/30">
            K
          </div>
          <div>
            <div className="font-bold text-white text-base tracking-tight flex items-center gap-1.5">
              <span>Kalalo</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Caption Studio</p>
          </div>
        </Link>

        {/* Primary Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#181B24] text-emerald-400 border border-emerald-500/20 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-[#141720]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                <span>{item.name}</span>
                {item.name === "Home" && projectCount > 0 && (
                  <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {projectCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Session & Logout */}
      <div className="space-y-4 pt-4 border-t border-[#1B1E26]">
        <div className="flex items-center justify-between pt-1 text-xs">

          <Link
            href="/profile"
            className="flex items-center gap-2 hover:text-white text-slate-400 transition-colors truncate"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0">
              P
            </div>
            <span className="truncate text-[11px] font-medium">Creator Profile</span>
          </Link>
          <button
            type="button"
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              } catch {}
            }}
            title="Sign out of Kalalo"
            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 rotate-45" />
          </button>
        </div>
      </div>
    </aside>
  );
}
