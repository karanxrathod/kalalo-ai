"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, Video, Settings, Palette, Activity, Plus, LogOut, User, LogIn } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setUser(data.user);
        }
      } catch {
        // Unauthenticated or network error
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchUser();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch {}
  };

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: Video },
    { href: "/editor", label: "Caption Editor", icon: Sparkles },
    { href: "/presets", label: "Presets", icon: Palette },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/diagnostics", label: "Diagnostics", icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-[#090B0E]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-400 p-0.5 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#090B0E]">
                <Sparkles className="h-4 w-4 text-purple-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-purple-300 transition-colors">
                Kalalo
              </span>
              <span className="ml-1.5 rounded-md bg-purple-950/70 border border-purple-800/40 px-1.5 py-0.5 text-[10px] font-semibold text-purple-300">
                Studio
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-purple-950/60 text-purple-200 border border-purple-800/30 shadow-inner"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-purple-400" : "text-slate-400"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/30 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>MCP Ready</span>
          </div>

          <Link
            href="/create"
            className="hidden sm:flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-purple-600/25 hover:from-purple-500 hover:to-indigo-500 transition-all hover:scale-[1.02]"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>New Project</span>
          </Link>

          {/* User Profile or Login CTA */}
          {!loading && (
            user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="flex items-center gap-2 rounded-lg bg-slate-900/60 border border-slate-800 px-2.5 py-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white uppercase">
                    {user.name.slice(0, 2)}
                  </div>
                  <span className="hidden sm:inline text-xs font-medium text-slate-300 max-w-[120px] truncate">
                    {user.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign Out"
                  className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-all"
                >
                  <LogIn className="h-3.5 w-3.5 text-slate-400" />
                  <span>Log In</span>
                </Link>
                <Link
                  href="/login"
                  className="sm:hidden flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 transition-colors"
                >
                  <span>Sign Up</span>
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </header>
  );
}
