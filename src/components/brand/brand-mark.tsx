import Image from "next/image";
import Link from "next/link";

const SIZE_PX = { sm: 24, md: 32, lg: 40, xl: 48 } as const;

export type BrandMarkSize = keyof typeof SIZE_PX;

type BrandMarkProps = {
  href?: string;
  size?: BrandMarkSize;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  /** Flex gap between mark and wordmark (default gap-3). */
  gapClassName?: string;
  className?: string;
  priority?: boolean;
};

export function BrandMark({
  href = "/",
  size = "md",
  showWordmark = true,
  wordmarkClassName = "",
  gapClassName = "gap-3",
  className = "",
  priority = false,
}: BrandMarkProps) {
  const px = SIZE_PX[size];

  const inner = (
    <>
      <div
        className="relative shrink-0 rounded-lg ring-1 ring-white/5 shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-shadow duration-300 group-hover:shadow-[0_0_28px_rgba(139,92,246,0.25)]"
        style={{ width: px, height: px }}
      >
        <Image
          src="/logo.png"
          alt="Grimoire"
          width={px}
          height={px}
          className="rounded-lg object-contain"
          priority={priority}
        />
      </div>
      {showWordmark ? (
        <span
          className={`tracking-wider text-white ${wordmarkClassName}`}
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          GRIMOIRE
        </span>
      ) : null}
    </>
  );

  const merged = `flex items-center ${gapClassName} group ${className}`;

  if (href) {
    return (
      <Link href={href} className={merged}>
        {inner}
      </Link>
    );
  }

  return <div className={merged}>{inner}</div>;
}
