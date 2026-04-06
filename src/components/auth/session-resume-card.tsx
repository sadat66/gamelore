"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/spinner";
import type { User } from "@supabase/supabase-js";
import { Shield } from "lucide-react";
import toast from "react-hot-toast";

interface SessionResumeCardProps {
  user: User;
  onSignedOut?: () => void;
}

/**
 * Shown when a session already exists. Primary action uses a hard navigation so
 * the button cannot be spammed while the client router catches up.
 */
export function SessionResumeCard({ user, onSignedOut }: SessionResumeCardProps) {
  const [switching, setSwitching] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function goToDashboard() {
    if (navigating) return;
    setNavigating(true);
    window.location.assign("/dashboard");
  }

  async function switchAccount() {
    if (switching || navigating) return;
    setSwitching(true);
    try {
      await supabase.auth.signOut();
      onSignedOut?.();
      router.refresh();
    } catch {
      toast.error("Could not switch account. Try again.");
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="rounded-3xl border border-[rgba(139,92,246,0.12)] bg-[rgba(12,6,24,0.65)] backdrop-blur-xl p-8 md:p-10 text-center shadow-[0_0_0_1px_rgba(139,92,246,0.06)_inset] relative overflow-hidden">
      {navigating ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#06020f]/90 backdrop-blur-sm">
          <Spinner size="xl" />
          <p className="text-sm text-[#c4b5fd]">Opening the dashboard…</p>
        </div>
      ) : null}

      <div className="w-20 h-20 rounded-full bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center mx-auto mb-6">
        <Shield className="w-10 h-10 text-purple-400" />
      </div>
      <h1
        className="text-2xl font-bold text-white mb-3"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        Session found
      </h1>
      <p className="text-[#8b7faa] text-sm mb-8 leading-relaxed">
        Signed in as{" "}
        <span className="text-purple-300 font-medium break-all">{user.email}</span>
      </p>

      <button
        type="button"
        onClick={goToDashboard}
        disabled={navigating || switching}
        className="btn-epic w-full flex items-center justify-center gap-2 !py-4 !rounded-xl disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
      >
        {navigating ? <Spinner size="md" /> : null}
        {navigating ? "Opening…" : "Enter the Dashboard"}
      </button>

      <button
        type="button"
        onClick={() => void switchAccount()}
        disabled={switching || navigating}
        className="mt-6 text-[10px] text-[#6b5f7d] hover:text-red-400 uppercase tracking-widest transition-colors font-bold disabled:opacity-40 disabled:pointer-events-none"
      >
        {switching ? "Signing out…" : "Use a different account"}
      </button>
    </div>
  );
}
