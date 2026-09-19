"use client";
import { useEffect, useRef } from "react";

/** Toggles `.is-visible` on observed elements with the `[data-reveal]` attribute
 *  so CSS keyframes can fire when the element enters the viewport.
 *
 *  Usage: place a `<ScrollReveal />` once near the top of the page (it's invisible)
 *  and tag elements with `data-reveal`. The directive respects accessibility — if
 *  the user has reduced motion enabled, elements show up immediately.
 */
export function ScrollReveal() {
  const seenRef = useRef<Set<Element>>(new Set());

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (reduced) {
      targets.forEach(el => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !seenRef.current.has(e.target)) {
            seenRef.current.add(e.target);
            e.target.classList.add("is-visible");
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );
    targets.forEach(t => io.observe(t));
    return () => io.disconnect();
  }, []);

  return null;
}

/** Optional per-element direction override via `data-reveal-direction="left|right"`. */
export function useReveal({ delay = 0 }: { delay?: number } = {}) {
  return {
    "data-reveal": "",
    style: delay ? { transitionDelay: `${delay}ms` } : undefined,
  } as const;
}
