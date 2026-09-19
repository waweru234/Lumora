// Inline SVG icon set. Stroke-based monoline icons (24x24 viewBox).

type IconProps = { className?: string; size?: number; strokeWidth?: number };

function svg(d: React.ReactNode, props: IconProps) {
  const { className, size = 18, strokeWidth = 1.6 } = props;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
         stroke="currentColor" strokeWidth={strokeWidth}
         strokeLinecap="round" strokeLinejoin="round"
         className={className} aria-hidden="true">
      {d}
    </svg>
  );
}

export const Icon = {
  Menu:      (p: IconProps) => svg(<><line x1="3" y1="6"  x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>, p),
  Close:     (p: IconProps) => svg(<><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></>, p),
  ChevL:     (p: IconProps) => svg(<polyline points="15 6 9 12 15 18"/>, p),
  ChevR:     (p: IconProps) => svg(<polyline points="9 6 15 12 9 18"/>, p),
  ChevD:     (p: IconProps) => svg(<polyline points="6 9 12 15 18 9"/>, p),
  ChevU:     (p: IconProps) => svg(<polyline points="6 15 12 9 18 15"/>, p),
  Bell:      (p: IconProps) => svg(<><path d="M6 8a6 6 0 1 1 12 0c0 6 2 8 2 8H4s2-2 2-8z"/><path d="M10 21a2 2 0 0 0 4 0"/></>, p),
  User:      (p: IconProps) => svg(<><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></>, p),
  Lock:      (p: IconProps) => svg(<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></>, p),
  Eye:       (p: IconProps) => svg(<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>, p),
  EyeOff:    (p: IconProps) => svg(<><path d="M3 3l18 18"/><path d="M10.6 6.2A10.6 10.6 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.3 4"/><path d="M6.3 6.3A17 17 0 0 0 2 12s4 6 10 6c1.7 0 3.3-.4 4.7-1"/></>, p),
  Plus:      (p: IconProps) => svg(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>, p),
  Minus:     (p: IconProps) => svg(<line x1="5" y1="12" x2="19" y2="12"/>, p),
  Check:     (p: IconProps) => svg(<polyline points="5 12 10 17 19 7"/>, p),
  Search:    (p: IconProps) => svg(<><circle cx="11" cy="11" r="6"/><line x1="20" y1="20" x2="16" y2="16"/></>, p),
  Markets:   (p: IconProps) => svg(<><rect x="3" y="14" width="3" height="7"/><rect x="10" y="9" width="3" height="12"/><rect x="17" y="4" width="3" height="17"/></>, p),
  Trade:     (p: IconProps) => svg(<><polyline points="4 17 10 11 14 15 20 7"/><polyline points="15 7 20 7 20 12"/></>, p),
  Wallet:    (p: IconProps) => svg(<><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="16" cy="15" r="1.2" fill="currentColor"/></>, p),
  History:   (p: IconProps) => svg(<><path d="M3 12a9 9 0 1 0 3-7"/><polyline points="3 3 3 9 9 9"/><polyline points="12 7 12 12 15 14"/></>, p),
  Profile:   (p: IconProps) => svg(<><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></>, p),
  Shield:    (p: IconProps) => svg(<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/>, p),
  Verify:    (p: IconProps) => svg(<><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="7 12 11 15 17 9"/></>, p),
  ArrowUp:   (p: IconProps) => svg(<><line x1="12" y1="5" x2="12" y2="19"/><polyline points="6 11 12 5 18 11"/></>, p),
  ArrowDown: (p: IconProps) => svg(<><line x1="12" y1="5" x2="12" y2="19"/><polyline points="6 13 12 19 18 13"/></>, p),
  ArrowR:    (p: IconProps) => svg(<><line x1="3" y1="12" x2="21" y2="12"/><polyline points="14 5 21 12 14 19"/></>, p),
  External:  (p: IconProps) => svg(<><path d="M14 4h6v6"/><path d="M20 4L10 14"/><path d="M20 14v6H4V4h6"/></>, p),
  Logo:      (p: IconProps) => svg(<><circle cx="12" cy="12" r="9"/><path d="M7 14l3-4 3 3 4-6"/></>, p),
  Star:      (p: IconProps) => svg(<polygon points="12 3 14.7 9 21 9.5 16.2 13.7 17.8 20 12 16.8 6.2 20 7.8 13.7 3 9.5 9.3 9"/>, p),
  Phone:     (p: IconProps) => svg(<path d="M6 3h12l-2 14H8L6 3z M10 17a2 2 0 0 0 4 0"/>, p),
  Mail:      (p: IconProps) => svg(<><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></>, p),
  Key:       (p: IconProps) => svg(<><circle cx="9" cy="13" r="4"/><line x1="13" y1="11" x2="21" y2="3"/><line x1="17" y1="7" x2="20" y2="10"/></>, p),
  Globe:     (p: IconProps) => svg(<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>, p),
  Logout:    (p: IconProps) => svg(<><path d="M10 17l-5-5 5-5"/><path d="M5 12h11"/><path d="M14 4h6v16h-6"/></>, p),
  Filter:    (p: IconProps) => svg(<polygon points="3 4 21 4 14 13 14 21 10 19 10 13"/>, p),
  Fullscreen:(p: IconProps) => svg(<><polyline points="4 9 4 4 9 4"/><polyline points="20 9 20 4 15 4"/><polyline points="4 15 4 20 9 20"/><polyline points="20 15 20 20 15 20"/></>, p),
  Exit:      (p: IconProps) => svg(<><polyline points="9 4 4 4 4 9"/><polyline points="15 4 20 4 20 9"/><polyline points="9 20 4 20 4 15"/><polyline points="15 20 20 20 20 15"/></>, p),
  Sparkle:   (p: IconProps) => svg(<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3"/></>, p),
  Play:      (p: IconProps) => svg(<polygon points="6 4 20 12 6 20"/>, p),
  Sun:       (p: IconProps) => svg(<><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2"/></>, p),
  Moon:      (p: IconProps) => svg(<path d="M21 13.5A9 9 0 1 1 10.5 3a7 7 0 0 0 10.5 10.5z"/>, p),

  // Drawing tools
  ToolCursor:    (p: IconProps) => svg(<><path d="M5 3l6 18 2-7 7-2z"/></>, p),
  ToolLine:      (p: IconProps) => svg(<><line x1="4" y1="20" x2="20" y2="4"/><circle cx="4" cy="20" r="2"/><circle cx="20" cy="4" r="2"/></>, p),
  ToolHorizontal:(p: IconProps) => svg(<><line x1="3" y1="12" x2="21" y2="12"/><circle cx="3" cy="12" r="2"/><circle cx="21" cy="12" r="2"/></>, p),
  ToolClear:     (p: IconProps) => svg(<><line x1="3" y1="3" x2="21" y2="21"/><line x1="21" y1="3" x2="3" y2="21"/></>, p),
};
