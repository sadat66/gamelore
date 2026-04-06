import Link from "next/link";
import {
  Shield,
  Swords,
  Scroll,
  Sparkles,
  MessageSquare,
  Brain,
  BookOpen,
  Zap,
  ChevronRight,
  Star,
  Flame,
  Crown,
  Newspaper,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { getLatestNews } from "@/lib/gamespot";
import Navbar from "@/components/landing/navbar";
import { BrandMark } from "@/components/brand/brand-mark";

/** Refresh homepage (including GameSpot news) periodically instead of only at build time. */
export const revalidate = 3600;

function ParticleField() {
  /** Deterministic “random” layout per particle index (pure render; no Math.random). */
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${((i * 37 + 13) % 100)}%`,
    delay: `${(i * 11) % 15}s`,
    duration: `${10 + (i * 7) % 20}s`,
    size: `${2 + (i * 3) % 4}px`,
    opacity: 0.3 + (((i * 5) % 10) / 20),
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            bottom: "-10px",
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

function FloatingOrbs() {
  return (
    <>
      <div
        className="orb"
        style={{
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
          top: "10%",
          left: "-10%",
          animationDelay: "0s",
        }}
      />
      <div
        className="orb"
        style={{
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)",
          top: "50%",
          right: "-8%",
          animationDelay: "-5s",
        }}
      />
      <div
        className="orb"
        style={{
          width: "350px",
          height: "350px",
          background:
            "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)",
          bottom: "10%",
          left: "30%",
          animationDelay: "-10s",
        }}
      />
    </>
  );
}


function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      <FloatingOrbs />
      <ParticleField />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.06)] mb-8 animate-fade-in-up">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-medium tracking-wider uppercase text-purple-300">
            Powered by AI &amp; RAG Technology
          </span>
        </div>

        {/* Main heading */}
        <h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[1.1] animate-fade-in-up"
          style={{
            fontFamily: "'Cinzel', serif",
            animationDelay: "0.15s",
            animationFillMode: "both",
          }}
        >
          <span className="text-white">Unravel the</span>
          <br />
          <span className="gradient-text">Legends Within</span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-lg md:text-xl text-[#8b7faa] max-w-2xl mx-auto mb-10 animate-fade-in-up leading-relaxed"
          style={{ animationDelay: "0.3s", animationFillMode: "both" }}
        >
          An AI lore companion that answers from{" "}
          <span className="text-[#a89bc4]">your indexed library</span>—characters,
          timelines, and secrets as they appear in the documents you trust. Ask in
          plain language, realm by realm.
        </p>

        {/* CTA buttons */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up"
          style={{ animationDelay: "0.45s", animationFillMode: "both" }}
        >
          <Link
            href="/signup"
            className="btn-epic flex items-center gap-2 !text-lg !px-10 !py-4"
          >
            <Swords className="w-5 h-5" />
            Begin Your Quest
            <ChevronRight className="w-5 h-5" />
          </Link>
          <a
            href="#features"
            className="px-8 py-4 text-lg rounded-xl border border-[rgba(139,92,246,0.2)] text-purple-300 hover:bg-[rgba(139,92,246,0.08)] hover:border-[rgba(139,92,246,0.35)] transition-all duration-300"
          >
            Explore Features
          </a>
        </div>

        {/* Chat preview */}
        <div
          className="max-w-2xl mx-auto animate-fade-in-up"
          style={{ animationDelay: "0.6s", animationFillMode: "both" }}
        >
          <div className="glass-card p-6 !rounded-2xl">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[rgba(139,92,246,0.1)]">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium">
                Grimoire
              </span>
              <span className="ml-auto flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400">Online</span>
              </span>
            </div>

            {/* Chat bubbles */}
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="chat-bubble-user max-w-[80%]">
                  <p className="text-sm text-purple-100">
                    Who is the Nameless King in Dark Souls 3 and what&apos;s his
                    connection to Gwyn?
                  </p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="chat-bubble max-w-[85%]">
                  <p className="text-sm text-[#c4b5fd] leading-relaxed">
                    <span className="text-purple-400 font-semibold">⚔ The Nameless King</span>{" "}
                    is the firstborn son of Gwyn, Lord of Sunlight. He was once a
                    fearsome god of war who allied with the ancient dragons,
                    betraying his father. His name was stripped from history, his
                    statues destroyed, and his very existence erased from the
                    annals of Anor Londo...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#06020f] to-transparent" />
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: "Deep Lore Knowledge",
      description:
        "Retrieval-augmented generation (RAG): your lore is chunked, embedded, and matched to each question—so answers lean on what you’ve indexed, not random web noise.",
      color: "text-purple-400",
      glow: "rgba(139,92,246,0.15)",
    },
    {
      icon: MessageSquare,
      title: "Natural Conversations",
      description:
        "Ask in plain language. The model uses chat context to follow up, clarify, and weave together threads from your corpus.",
      color: "text-pink-400",
      glow: "rgba(236,72,153,0.15)",
    },
    {
      icon: BookOpen,
      title: "Multi-Game Library",
      description:
        "Each realm is its own space—add games over time and keep their lore separate. Scale from one passion project to a shelf of worlds.",
      color: "text-cyan-400",
      glow: "rgba(6,182,212,0.15)",
    },
    {
      icon: Scroll,
      title: "Lore Threads",
      description:
        "Start a fresh conversation when you want a clean slate, or keep going in the same thread. Stay focused on the story you’re exploring.",
      color: "text-amber-400",
      glow: "rgba(245,158,11,0.15)",
    },
    {
      icon: Zap,
      title: "Instant Answers",
      description:
        "Skip manual doc-hunting. Get a concise reply in seconds, grounded in the passages the system retrieved for your question.",
      color: "text-emerald-400",
      glow: "rgba(16,185,129,0.15)",
    },
    {
      icon: Shield,
      title: "Curated Canon",
      description:
        "Admins upload the PDFs and documents that define each game’s knowledge base—so answers reflect the canon you choose to include.",
      color: "text-rose-400",
      glow: "rgba(244,63,94,0.15)",
    },
  ];

  return (
    <section id="features" className="relative py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.06)] mb-4">
            <Star className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium tracking-wider uppercase text-purple-300">
              Features
            </span>
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Legendary <span className="gradient-text">Capabilities</span>
          </h2>
          <p className="text-[#8b7faa] text-lg max-w-xl mx-auto">
            Built for teams and fans who want lore Q&amp;A that stays tied to their
            own library—without losing the fantasy.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card p-8 group cursor-default"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                style={{ background: feature.glow }}
              >
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3
                className="text-xl font-semibold text-white mb-3"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {feature.title}
              </h3>
              <p className="text-[#8b7faa] leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      icon: Crown,
      title: "Choose Your Realm",
      description:
        "Pick a game from your library—each one has its own indexed documents and its own chat.",
    },
    {
      step: "02",
      icon: MessageSquare,
      title: "Ask the Oracle",
      description:
        "Ask about characters, events, timelines, or connections. If it’s in your uploaded lore, Grimoire can draw it into the answer.",
    },
    {
      step: "03",
      icon: Scroll,
      title: "Receive Ancient Knowledge",
      description:
        "Get a narrative reply shaped by retrieved passages from your corpus—immersive, without pretending to cite the whole internet.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative py-32 overflow-hidden"
    >
      {/* Subtle divider glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.06)] mb-4">
            <Flame className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium tracking-wider uppercase text-purple-300">
              How It Works
            </span>
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Your Journey <span className="gradient-text">Begins Here</span>
          </h2>
          <p className="text-[#8b7faa] text-lg max-w-xl mx-auto">
            Three steps from login to answers grounded in the lore you’ve loaded.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((item, index) => (
            <div key={index} className="relative text-center group">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-[1px] bg-gradient-to-r from-purple-500/30 to-transparent" />
              )}

              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="w-32 h-32 rounded-full border border-[rgba(139,92,246,0.15)] bg-[rgba(139,92,246,0.05)] flex items-center justify-center transition-all duration-500 group-hover:border-[rgba(139,92,246,0.4)] group-hover:bg-[rgba(139,92,246,0.1)] group-hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]">
                  <item.icon className="w-10 h-10 text-purple-400 transition-all duration-300 group-hover:scale-110" />
                </div>
                <span
                  className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold text-white"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {item.step}
                </span>
              </div>

              <h3
                className="text-xl font-semibold text-white mb-3"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {item.title}
              </h3>
              <p className="text-[#8b7faa] text-sm leading-relaxed max-w-xs mx-auto">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GamesSection() {
  const games = [
    { name: "Dark Souls", genre: "Action RPG", color: "#8b5cf6" },
    { name: "Elden Ring", genre: "Open World RPG", color: "#f59e0b" },
    { name: "The Witcher 3", genre: "Action RPG", color: "#ef4444" },
    { name: "Mass Effect", genre: "Sci-Fi RPG", color: "#06b6d4" },
    { name: "Zelda: TotK", genre: "Adventure", color: "#10b981" },
    { name: "Hollow Knight", genre: "Metroidvania", color: "#8b7faa" },
    { name: "Baldur's Gate 3", genre: "CRPG", color: "#ec4899" },
    { name: "God of War", genre: "Action Adventure", color: "#f97316" },
  ];

  return (
    <section id="games" className="relative py-32 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.06)] mb-4">
            <Swords className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium tracking-wider uppercase text-purple-300">
              Game Library
            </span>
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Realms <span className="gradient-text">like these</span>
          </h2>
          <p className="text-[#8b7faa] text-lg max-w-xl mx-auto">
            Examples of the kinds of worlds Grimoire shines for—your actual games
            come from what you or your team add.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {games.map((game, index) => (
            <div
              key={index}
              className="glass-card p-6 text-center cursor-default group"
            >
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ background: `${game.color}15` }}
              >
                <Swords
                  className="w-7 h-7 transition-all duration-300"
                  style={{ color: game.color }}
                />
              </div>
              <h3
                className="font-semibold text-white mb-1 text-sm"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {game.name}
              </h3>
              <p className="text-xs text-[#8b7faa]">{game.genre}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-[#8b7faa] text-sm mt-8 italic">
          Add new realms anytime—each one is powered by the documents you ingest.
        </p>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="glass-card p-12 md:p-16 shimmer-border">
          <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-6" />
          <h2
            className="text-3xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Ready to Explore the <span className="gradient-text">Unknown?</span>
          </h2>
          <p className="text-[#8b7faa] text-lg max-w-lg mx-auto mb-10">
            Bring your lore files, pick a realm, and start asking—whether you’re
            a small team or a solo archivist.
          </p>
          <Link
            href="/signup"
            className="btn-epic inline-flex items-center gap-3 !text-lg !px-12 !py-5"
          >
            <Crown className="w-5 h-5" />
            Create Free Account
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[rgba(139,92,246,0.1)] py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <BrandMark
            size="sm"
            wordmarkClassName="text-lg font-semibold"
            href="/"
          />

          <div className="flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-[#8b7faa] hover:text-purple-400 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-[#8b7faa] hover:text-purple-400 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#games"
              className="text-sm text-[#8b7faa] hover:text-purple-400 transition-colors"
            >
              Games
            </a>
            <a
              href="#news"
              className="text-sm text-[#8b7faa] hover:text-purple-400 transition-colors"
            >
              News
            </a>
          </div>

          <p className="text-xs text-[#8b7faa]">
            © 2026 Grimoire. All realms reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

async function NewsSection() {
  const news = await getLatestNews(3);

  return (
    <section id="news" className="relative py-32 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.06)] mb-4">
            <Newspaper className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium tracking-wider uppercase text-purple-300">
              Latest Chronicles
            </span>
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            The Realm&apos;s <span className="gradient-text">Whispers</span>
          </h2>
          <p className="text-[#8b7faa] text-lg max-w-xl mx-auto">
            Headlines from the wider gaming world—alongside the lore you explore in
            Grimoire.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {news.map((item) => (
            <div key={item.id} className="group relative flex flex-col h-full">
              {/* Image Container */}
              <div className="relative aspect-video rounded-2xl overflow-hidden mb-6 border border-[rgba(139,92,246,0.15)] group-hover:border-[rgba(139,92,246,0.4)] transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(139,92,246,0.1)]">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  decoding="async"
                  fetchPriority="low"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06020f] to-transparent opacity-60" />
                <div className="absolute top-4 left-4">
                  <div className="px-3 py-1 rounded-full bg-purple-600/80 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1.5 border border-white/10 uppercase tracking-tighter">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.published_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Content */}
              <h3
                className="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors duration-300 line-clamp-2"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {item.title}
              </h3>
              <p className="text-[#8b7faa] text-sm leading-relaxed mb-6 line-clamp-3">
                {item.summary}
              </p>
              
              <div className="mt-auto">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Read Chronicle
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-[#6b5f7d] mt-12">
          Game news data from{" "}
          <a
            href="https://www.gamespot.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400/90 hover:text-purple-300 underline-offset-2 hover:underline"
          >
            GameSpot
          </a>
          . Non-commercial use per{" "}
          <a
            href="https://www.gamespot.com/api/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400/90 hover:text-purple-300 underline-offset-2 hover:underline"
          >
            API terms
          </a>
          .
        </p>
      </div>
    </section>
  );
}

export default async function HomePage() {
  return (
    <main className="relative">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <GamesSection />
      <NewsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
