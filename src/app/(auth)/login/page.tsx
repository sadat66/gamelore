"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { LoginCredentialsForm } from "@/components/auth/login-credentials-form";
import { SessionResumeCard } from "@/components/auth/session-resume-card";
import { SpinnerBlock } from "@/components/ui/spinner";

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
      <SpinnerBlock
        label="Sensing your aura…"
        className="p-12"
      />
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
