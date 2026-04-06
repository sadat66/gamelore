"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { LoginCredentialsForm } from "@/components/auth/login-credentials-form";
import { SessionResumeCard } from "@/components/auth/session-resume-card";

export default function LoginPage() {
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!cancelled) setSessionUser(user);
      } catch {
        if (!cancelled) setSessionUser(null);
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    }
    void checkSession();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  if (checkingSession) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-[#8b7faa] text-sm animate-pulse">Sensing your aura…</p>
      </div>
    );
  }

  if (sessionUser) {
    return (
      <div className="animate-fade-in-up">
        <SessionResumeCard
          user={sessionUser}
          onSignedOut={() => setSessionUser(null)}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-8">
      <div className="lg:hidden flex items-center justify-center gap-3">
        <Link href="/" className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-purple-500" />
          <span
            className="text-2xl tracking-wider text-white"
            style={{ fontFamily: "'Cinzel', serif", fontWeight: 700 }}
          >
            GAMELORE
          </span>
        </Link>
      </div>

      <LoginCredentialsForm />
    </div>
  );
}
