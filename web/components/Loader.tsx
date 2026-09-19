"use client";
import Image from "next/image";
import { type CSSProperties } from "react";

// Reusable loader components. All use the brand pulse + scale keyframes
// defined in globals.css.

/** Plain ring spinner. */
export function Spinner({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-block animate-spin align-[-2px] ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" opacity="0.25" />
        <path d="M21 12a9 9 0 0 0-9-9" />
      </svg>
    </span>
  );
}

/** Three-dot pulse loader. Use for inline state/spinner replacements. */
export function Dots({ className = "", size = 6 }: { className?: string; size?: number }) {
  return (
    <span className={`inline-flex items-center gap-1 align-middle ${className}`} aria-hidden>
      <span className="rounded-full bg-current animate-pulse-soft" style={{ width: size, height: size, animationDelay: "0ms" }} />
      <span className="rounded-full bg-current animate-pulse-soft" style={{ width: size, height: size, animationDelay: "150ms" }} />
      <span className="rounded-full bg-current animate-pulse-soft" style={{ width: size, height: size, animationDelay: "300ms" }} />
    </span>
  );
}

/** Branded loader: the Lumora mark, gently pulsing while a state is pending. */
export function LoaderLogo({ size = 56, label = "Working…" }: { size?: number; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-muted text-xs animate-fade-in">
      <div
        className="relative rounded-md overflow-hidden ring-1 ring-line animate-pulse-soft"
        style={{ width: size, height: size }}
      >
        <Image src="/chatgpt-hero.png" alt="Lumora" fill sizes={`${size}px`} className="object-cover" priority />
        <div className="absolute inset-0 bg-bg-900/30 animate-pulse-soft" />
        {/* hairline accent that sweeps during loading */}
        <div
          className="absolute inset-x-0 top-1/2 h-px bg-green/60"
          style={{ animation: "shimmer 1.4s linear infinite" }}
        />
      </div>
      <p className="text-[11px] uppercase tracking-[0.25em] text-muted">{label}</p>
    </div>
  );
}

/** Card-style wrap: shows the LoaderLogo plus an optional message; centered. */
export function LoaderCard({
  title = "Just a moment",
  detail = "Lumora is connecting you to the next step.",
  minHeight = 320,
}: { title?: string; detail?: string; minHeight?: number }) {
  return (
    <div className="grid place-items-center" style={{ minHeight }}>
      <div className="rounded-md border border-line bg-bg-900 p-8 flex flex-col items-center gap-4 animate-fade-in">
        <LoaderLogo size={56} label={title} />
        <p className="text-sm text-muted max-w-sm text-center">{detail}</p>
      </div>
    </div>
  );
}

/** Skeleton block: shimmering placeholder for content. */
export function Skeleton({ className = "", height = 16, width = "100%" }: { className?: string; height?: number | string; width?: number | string }) {
  const style: CSSProperties = { height: typeof height === "number" ? `${height}px` : height, width: typeof width === "number" ? `${width}px` : width };
  return <div className={`rounded bg-bg-700/70 animate-pulse-soft ${className}`} style={style} aria-hidden />;
}

/** Card-level skeleton. */
export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-md border border-line bg-bg-900 p-5 animate-fade-in">
      <Skeleton height={14} width="40%" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} height={12} width={`${70 - i * 8}%`} />
        ))}
      </div>
    </div>
  );
}
