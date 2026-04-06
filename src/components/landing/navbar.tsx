"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Swords } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/spinner";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [realmNavigating, setRealmNavigating] = useState(false);
  const supabase = createClient();

  const goToRealm = () => {
    if (realmNavigating) return;
    setRealmNavigating(true);
    window.location.assign("/dashboard");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    async function checkUser() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch {
        setUser(null);
      }
    }
    checkUser();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [supabase]);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
      isScrolled 
        ? "bg-[rgba(6,2,15,0.9)] backdrop-blur-2xl py-3 border-[rgba(139,92,246,0.2)]" 
        : "bg-transparent py-5 border-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <BrandMark
          size="md"
          wordmarkClassName="text-xl font-bold"
          priority
        />

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-[#8b7faa] hover:text-purple-400 transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-[#8b7faa] hover:text-purple-400 transition-colors">How It Works</a>
          <a href="#games" className="text-sm text-[#8b7faa] hover:text-purple-400 transition-colors">Games</a>
          <a href="#news" className="text-sm text-[#8b7faa] hover:text-purple-400 transition-colors">News</a>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <button
              type="button"
              onClick={goToRealm}
              disabled={realmNavigating}
              aria-busy={realmNavigating}
              className="btn-epic !py-2.5 !px-6 !text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-70 disabled:pointer-events-none disabled:cursor-wait"
            >
              {realmNavigating ? (
                <Spinner size="sm" />
              ) : (
                <Swords className="w-4 h-4 shrink-0" aria-hidden />
              )}
              {realmNavigating ? "Entering…" : "Return to Realm"}
            </button>
          ) : (
            <>
              <Link href="/login" className="text-sm text-[#c4b5fd] hover:text-white transition-colors">Sign In</Link>
              <Link href="/signup" className="btn-epic !py-2.5 !px-6 !text-sm">Start Quest</Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button onClick={toggleMenu} className="md:hidden text-purple-400 p-2 hover:bg-white/5 rounded-lg transition-colors">
          {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-x-0 top-0 bottom-0 bg-[rgba(6,2,15,0.98)] backdrop-blur-3xl transition-transform duration-500 md:hidden z-[-1] ${
        isOpen ? "translate-y-0" : "-translate-y-full"
      }`}>
        <div className="flex flex-col h-full pt-32 px-8 space-y-8 text-center pb-12 overflow-y-auto">
          <a href="#features" onClick={toggleMenu} className="text-2xl font-bold text-white hover:text-purple-400 transition-colors" style={{ fontFamily: "'Cinzel', serif" }}>Features</a>
          <a href="#how-it-works" onClick={toggleMenu} className="text-2xl font-bold text-white hover:text-purple-400 transition-colors" style={{ fontFamily: "'Cinzel', serif" }}>How It Works</a>
          <a href="#games" onClick={toggleMenu} className="text-2xl font-bold text-white hover:text-purple-400 transition-colors" style={{ fontFamily: "'Cinzel', serif" }}>Games</a>
          <a href="#news" onClick={toggleMenu} className="text-2xl font-bold text-white hover:text-purple-400 transition-colors" style={{ fontFamily: "'Cinzel', serif" }}>News</a>
          
          <div className="pt-10 flex flex-col gap-4">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  goToRealm();
                }}
                disabled={realmNavigating}
                aria-busy={realmNavigating}
                className="btn-epic py-5 rounded-2xl text-xl flex items-center justify-center gap-3 w-full disabled:opacity-70 disabled:pointer-events-none disabled:cursor-wait"
              >
                {realmNavigating ? (
                  <Spinner size="lg" />
                ) : (
                  <Swords className="w-6 h-6 shrink-0" aria-hidden />
                )}
                {realmNavigating ? "Entering…" : "Return to Realm"}
              </button>
            ) : (
              <>
                <Link href="/login" onClick={toggleMenu} className="text-purple-300 font-medium py-3 text-lg">Sign In</Link>
                <Link href="/signup" onClick={toggleMenu} className="btn-epic py-5 rounded-2xl text-xl">Start Your Quest</Link>
              </>
            )}
          </div>
          
          <p className="text-[#4a3a6b] text-xs uppercase tracking-widest pt-12">
            © 2026 Grimoire. All realms reserved.
          </p>
        </div>
      </div>
    </nav>
  );
}
