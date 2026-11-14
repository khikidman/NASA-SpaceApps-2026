import type { CSSProperties } from "react";

type IconName = "explore" | "mission" | "journal" | "guide" | "fullscreen" | "close" | "target" | "grid" | "home" | "check";

const paths: Record<IconName, React.ReactNode> = {
  explore: <><circle cx="12" cy="12" r="8.5" /><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z" /></>,
  mission: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 3h6v4H9zM9 11h6M9 15h4" /></>,
  journal: <><path d="M5 4h13a1 1 0 0 1 1 1v15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM5 17h14M9 8h6M9 12h4" /></>,
  guide: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.6 2.6 0 1 1 4.1 2.2c-1 .6-1.6 1.1-1.6 2.8M12 17h.01" /></>,
  fullscreen: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  target: <><circle cx="12" cy="12" r="6" /><path d="M12 2v5m0 10v5M2 12h5m10 0h5" /></>,
  grid: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18m6-18v18M3 9h18M3 15h18" /></>,
  home: <><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7" /></>,
  check: <path d="m5 12 4 4L19 6" />,
};

export function HudIcon({ name, size = 20, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>{paths[name]}</svg>;
}
