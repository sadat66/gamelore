"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { LogIn, Eye, EyeOff, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

type Phase = "idle" | "submitting";

/**
 * Email/password sign-in. On success, uses a hard navigation so the page cannot
 * accept another submit after the toast (no `finally` re-enabling the button).
 */
export function LoginCredentialsForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const supabase = createClient();

  const locked = phase !== "idle";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (locked) return;

    setPhase("submitting");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        setPhase("idle");
        return;
      }

      toast.success("Welcome back, adventurer!");
      // Full navigation — unloads this document so no further clicks or Enter can fire here.
      window.location.assign("/dashboard");
    } catch {
      toast.error("An unexpected error occurred");
      setPhase("idle");
    }
  }

  return (
    <div className="relative rounded-3xl border border-[rgba(139,92,246,0.12)] bg-[rgba(12,6,24,0.65)] backdrop-blur-xl shadow-[0_0_0_1px_rgba(139,92,246,0.06)_inset] overflow-hidden">
      {locked ? (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#06020f]/85 backdrop-blur-md"
          aria-hidden
        >
          <Spinner size="xl" />
          <p className="text-sm text-[#c4b5fd]">Signing you in…</p>
        </div>
      ) : null}

      <div className="p-8 md:p-10">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[rgba(139,92,246,0.12)] border border-[rgba(139,92,246,0.2)] mb-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <h1
            className="text-2xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Welcome back
          </h1>
          <p className="text-[#8b7faa] text-sm">
            Sign in to continue your quest
          </p>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="space-y-5"
          aria-busy={locked}
        >
          <div className="space-y-2">
            <Label
              htmlFor="login-email"
              className="text-sm font-medium text-[#c4b5fd]"
            >
              Email
            </Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="adventurer@realm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={locked}
              required
              className="h-12 rounded-xl border-[rgba(139,92,246,0.15)] bg-[rgba(6,2,15,0.5)] focus-visible:ring-2 focus-visible:ring-purple-500/40 disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="login-password"
              className="text-sm font-medium text-[#c4b5fd]"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Your secret rune"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={locked}
                required
                className="h-12 rounded-xl pr-12 border-[rgba(139,92,246,0.15)] bg-[rgba(6,2,15,0.5)] focus-visible:ring-2 focus-visible:ring-purple-500/40 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#8b7faa] hover:text-purple-300 hover:bg-white/5 transition-colors disabled:opacity-40"
                disabled={locked}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={locked}
            className="btn-epic w-full flex items-center justify-center gap-2 !py-3.5 !rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            {locked ? (
              <Spinner size="md" />
            ) : (
              <LogIn className="w-5 h-5" aria-hidden />
            )}
            {locked ? "Signing in…" : "Enter the Realm"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[#8b7faa] text-sm">
            New to GameLore?{" "}
            <Link
              href="/signup"
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
