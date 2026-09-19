"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

export type ThemeName = "dark" | "light";

export function applyTheme(theme: ThemeName) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName>("dark");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("lumora-theme") as ThemeName | null;
    const t: ThemeName = stored === "light" || stored === "dark" ? stored : "dark";
    setTheme(t);
    applyTheme(t);
  }, []);

  function toggle() {
    const next: ThemeName = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    if (typeof window !== "undefined") window.localStorage.setItem("lumora-theme", next);
  }

  return (
    <button onClick={toggle} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className="press p-1.5 rounded hover:bg-bg-800/60 text-muted hover:text-ink"
            aria-label="Toggle theme">
      {theme === "dark" ? <Icon.Sun size={16} className="text-amber/90" /> : <Icon.Moon size={16} />}
    </button>
  );
}
