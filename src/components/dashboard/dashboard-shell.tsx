"use client";

import { useState } from "react";
import { useSubmitLock } from "@/hooks/use-submit-lock";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  LogOut,
  MessageSquare,
  Plus,
  Menu,
  X,
  Scroll,
  Settings,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { BrandMark } from "@/components/brand/brand-mark";
import { DASHBOARD_NEW_QUEST_EVENT } from "@/lib/dashboard-events";
import { usePathname } from "next/navigation";

interface DashboardShellProps {
  user: User;
  children: React.ReactNode;
  isAdmin?: boolean;
}

export default function DashboardShell({
  user,
  children,
  isAdmin = false,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const signOutLock = useSubmitLock();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    if (!signOutLock.acquire()) return;
    setIsSigningOut(true);
    let signedOutOk = false;
    try {
      await supabase.auth.signOut();
      toast.success("Until next time, adventurer!");
      signedOutOk = true;
      // Hard navigation so the shell cannot accept another sign-out while SPA routing catches up.
      window.location.assign("/");
    } catch {
      toast.error("The realm refused your departure. Try again.");
    } finally {
      if (!signedOutOk) {
        signOutLock.release();
        setIsSigningOut(false);
      }
    }
  };

  const chatHistory: { id: number; title: string; date: string }[] = [];

  return (
    <div className="flex h-screen overflow-hidden bg-[#06020f]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#0a0518] border-r border-[rgba(139,92,246,0.1)] flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar header */}
        <div className="p-5 border-b border-[rgba(139,92,246,0.1)] flex items-center justify-between">
          <BrandMark
            href="/"
            size="lg"
            wordmarkClassName="text-lg font-bold"
            gapClassName="gap-2.5"
          />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[#8b7faa] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New chat button */}
        <div className="p-4 space-y-2">
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              if (pathname === "/dashboard") {
                window.dispatchEvent(new CustomEvent(DASHBOARD_NEW_QUEST_EVENT));
              } else {
                router.push("/dashboard");
              }
            }}
            disabled={isSigningOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.06)] text-sm text-purple-300 hover:bg-[rgba(139,92,246,0.12)] hover:border-[rgba(139,92,246,0.35)] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            New Quest
          </button>
          {isAdmin ? (
            <Link
              href="/dashboard/admin"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[rgba(234,179,8,0.25)] bg-[rgba(234,179,8,0.06)] text-sm text-amber-200/90 hover:bg-[rgba(234,179,8,0.1)] transition-all duration-200 ${
                isSigningOut ? "pointer-events-none opacity-30" : ""
              }`}
            >
              <Settings className="w-4 h-4" />
              Lore control panel
            </Link>
          ) : null}
        </div>

        {/* Chat history */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {chatHistory.length > 0 && (
            <>
              <div className="mb-2 px-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(139,92,246,0.4)]">
                  Recent Quests
                </span>
              </div>
              <div className="space-y-1">
                {chatHistory.map((chat) => (
                  <button
                    key={chat.id}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm text-[#8b7faa] hover:text-[#c4b5fd] hover:bg-[rgba(139,92,246,0.06)] transition-all duration-200 group"
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-50 group-hover:opacity-80" />
                    <span className="truncate">{chat.title}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sidebar footer - user */}
        <div className="border-t border-[rgba(139,92,246,0.1)] p-4">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[rgba(139,92,246,0.06)] transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {user.email?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm text-white truncate">
                  {user.email?.split("@")[0] || "Adventurer"}
                </p>
                <p className="text-[10px] text-[#8b7faa] truncate">
                  {user.email}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#8b7faa] transition-transform duration-200 ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* User dropdown */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 glass-card p-2 !rounded-xl animate-fade-in-up !bg-[#0f0a1e]">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8b7faa] hover:text-[#c4b5fd] hover:bg-[rgba(139,92,246,0.08)] transition-all duration-200">
                  <Scroll className="w-4 h-4" />
                  My Lore Library
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8b7faa] hover:text-[#c4b5fd] hover:bg-[rgba(139,92,246,0.08)] transition-all duration-200">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <div className="my-1 border-t border-[rgba(139,92,246,0.1)]" />
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all duration-200 disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  {isSigningOut ? "Departing..." : "Sign Out"}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-[rgba(139,92,246,0.1)] bg-[rgba(6,2,15,0.8)] backdrop-blur-xl flex items-center px-4 md:px-6 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[#8b7faa] hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <h1 className="text-sm font-medium text-white">New Quest</h1>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400">Oracle Online</span>
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
