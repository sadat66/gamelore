import { BrandMark } from "@/components/brand/brand-mark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background effects */}
      <div
        className="orb"
        style={{
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          top: "5%",
          left: "-15%",
        }}
      />
      <div
        className="orb"
        style={{
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)",
          bottom: "5%",
          right: "-10%",
          animationDelay: "-7s",
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Left panel - branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative p-12">
        <div className="max-w-md text-center">
          <BrandMark
            href="/"
            size="xl"
            wordmarkClassName="text-3xl font-bold"
            className="inline-flex mb-8"
            priority
          />

          <h2
            className="text-2xl font-bold text-white mb-4"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Every Legend Has a <span className="gradient-text">Story</span>
          </h2>
          <p className="text-[#8b7faa] leading-relaxed">
            Unlock the ancient knowledge hidden within the worlds of your
            favorite games. Your AI lore companion awaits.
          </p>

          {/* Decorative chat preview */}
          <div className="mt-10 glass-card p-5 text-left">
            <div className="chat-bubble mb-3">
              <p className="text-xs text-[#c4b5fd]">
                <span className="text-purple-400 font-semibold">⚔</span>{" "}
                &quot;Tell me about the Age of Fire in Dark Souls...&quot;
              </p>
            </div>
            <div className="chat-bubble-user p-3">
              <p className="text-xs text-purple-100">
                The Age of Fire began when Gwyn, the Lord of Sunlight, discovered
                the Lord Souls within the First Flame...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
