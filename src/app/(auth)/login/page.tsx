"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, LogIn, Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setSessionUser(user);
      } catch {
        setSessionUser(null);
      } finally {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, [supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Welcome back, adventurer!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-[#8b7faa] text-sm animate-pulse">Sensing your aura...</p>
      </div>
    );
  }

  if (sessionUser) {
    return (
      <div className="animate-fade-in-up">
        <div className="glass-card p-8 md:p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-purple-400" />
          </div>
          <h1
            className="text-2xl font-bold text-white mb-3"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Session Found
          </h1>
          <p className="text-[#8b7faa] text-sm mb-6 leading-relaxed">
            We recognize your presence as <span className="text-purple-300 font-medium">{sessionUser.email}</span>.<br />
            No need to re-enter your runes.
          </p>

          <Link
            href="/dashboard"
            className="btn-epic w-full flex items-center justify-center gap-2 !py-4 !rounded-xl"
          >
            Enter the Dashboard
          </Link>
          
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              setSessionUser(null);
              router.refresh();
            }}
            className="mt-6 text-[10px] text-[#6b5f7d] hover:text-red-400 uppercase tracking-widest transition-colors font-bold"
          >
            Use a different account
          </button>
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
            Welcome Back
          </h1>
          <p className="text-[#8b7faa] text-sm">
            Sign in to continue your quest
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="login-email"
              className="text-sm font-medium text-[#c4b5fd]"
            >
              Email Address
            </Label>
            <Input
              id="login-email"
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
            <div className="flex items-center justify-between">
              <Label
                htmlFor="login-password"
                className="text-sm font-medium text-[#c4b5fd]"
              >
                Password
              </Label>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your secret rune"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="h-12 rounded-xl pr-12 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b7faa] hover:text-purple-400 transition-colors"
                disabled={loading}
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
            disabled={loading}
            className="btn-epic w-full flex items-center justify-center gap-2 !py-3.5 !rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Enter the Realm
              </>
            )}
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
