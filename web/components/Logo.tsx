"use client";
import Image from "next/image";
import { type CSSProperties } from "react";

// Branded logo with variants for dark and light contexts.
export function Logo({ size = 28, withWord = false, tone = "dark" }: { size?: number; withWord?: boolean; tone?: "dark" | "light" }) {
  // For a "light" variant we drop saturation so the mark recedes on light backgrounds.
  // The chatgpt-hero image itself is dark, so on light contexts it shows as a dark mark.
  const toneStyle: CSSProperties = tone === "light"
    ? { filter: "invert(0)" }                 // mark shows solid on light
    : { mixBlendMode: "luminosity" };          // existing behaviour on dark

  return (
    <span className="inline-flex items-center gap-2 select-none">
      <span className="relative" style={{ width: size, height: size }}>
        <Image src="/chatgpt-hero.png" alt="Lumora mark" fill sizes={`${size}px`}
               className="object-cover rounded-md"
               style={toneStyle} priority />
        <span className="absolute inset-0 rounded-md ring-1 ring-line pointer-events-none" />
      </span>
      {withWord && (
        <span className="font-display font-semibold tracking-[0.18em] text-[15px] leading-none">
          LUMORA
        </span>
      )}
    </span>
  );
}

export function LogoScript({ size = 32, tone = "dark" }: { size?: number; tone?: "dark" | "light" }) {
  return (
    <span className={`inline-flex items-center gap-2 select-none ${tone === "light" ? "text-bg-950" : ""}`}>
      <span className="relative" style={{ width: size, height: size }}>
        <Image src="/chatgpt-hero.png" alt="Lumora mark" fill sizes={`${size}px`} className="object-cover rounded-md" priority />
      </span>
      <span className="font-script text-3xl leading-none">Lumora</span>
    </span>
  );
}
