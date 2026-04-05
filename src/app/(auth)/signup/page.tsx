"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, UserPlus, Loader2, Eye, EyeOff, Mail } from "lucide-react";
import toast from "react-hot-toast";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters!");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setEmailSent(true);
      toast.success("Verification scroll sent! Check your email.");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="animate-fade-in-up">
        <div className="glass-card p-8 md:p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-purple-400" />
          </div>
          <h1
            className="text-2xl font-bold text-white mb-3"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Check Your Scrolls
          </h1>
          <p className="text-[#8b7faa] text-sm mb-2 leading-relaxed">
            We&apos;ve sent a verification link to
          </p>
          <p className="text-purple-300 font-medium mb-6 break-all">{email}</p>
          <p className="text-[#8b7faa] text-sm leading-relaxed mb-8">
            Click the link in the email to activate your account and begin your
            quest. The link will guide you to the realm.
          </p>

          <div className="glass-card p-4 mb-6 !bg-[rgba(139,92,246,0.05)]">
            <p className="text-xs text-[#8b7faa]">
              💡 Don&apos;t see the email? Check your spam folder or{" "}
              <button
                onClick={() => setEmailSent(false)}
                disabled={loading}
                className="text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
              >
                try again
              </button>
            </p>
          </div>

          <Link
            href="/login"
            className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
          >
            ← Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
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

      <div className="glass-card p-8 md:p-10">
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Join the Guild
          </h1>
          <p className="text-[#8b7faa] text-sm">
            Create your account and start exploring
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="signup-email"
              className="text-sm font-medium text-[#c4b5fd]"
            >
              Email Address
            </Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="adventurer@realm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="h-12 rounded-xl disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="signup-password"
              className="text-sm font-medium text-[#c4b5fd]"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a secret rune (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
                className="h-12 rounded-xl pr-12 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b7faa] hover:text-purple-400 transition-colors disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="signup-confirm"
              className="text-sm font-medium text-[#c4b5fd]"
            >
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="signup-confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your secret rune"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
                className="h-12 rounded-xl pr-12 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                disabled={loading}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b7faa] hover:text-purple-400 transition-colors disabled:opacity-50"
              >
                {showConfirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-400 mt-1">
                ⚠ Runes do not match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-epic w-full flex items-center justify-center gap-2 !py-3.5 !rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[#8b7faa] text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
