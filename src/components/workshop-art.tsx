import type { ReactNode } from "react";
import type { TutorialTaskId } from "@/game/types";

export type WorkshopSymbol = "check" | "tap" | "wire" | "wave" | "send" | "moon" | "earth" | "detector" | "level" | "trace" | "scan" | "ice" | "rock" | "drill" | "bucket" | "gear" | "filter" | "tray" | "pipe" | "heat" | "drop" | "valve" | "book" | "hint" | "reset" | "foot" | "lift" | "play" | "pause" | "readiness" | "token" | "clock" | "battery";
const symbols: Record<WorkshopSymbol, ReactNode> = {
  readiness: <><path d="M13 35V23a19 19 0 0 1 38 0v12" fill="#e4d7b9" stroke="#f0dfba" strokeWidth="2"/><rect x="18" y="13" width="28" height="22" rx="10" fill="#233d57" stroke="#a8c4cd" strokeWidth="2"/><path d="M12 42Q32 29 52 42v15H12Z" fill="#d3c4a5" stroke="#e8d6ae"/><path d="M19 48H45" stroke="#4b6b69" strokeWidth="7"/><path d="M19 48H38" stroke="#b4d89d" strokeWidth="5"/></>,
  token: <><circle cx="32" cy="32" r="25" fill="#c89d4e" stroke="#f1d79a" strokeWidth="3"/><circle cx="32" cy="32" r="19" fill="#e2bc6c" stroke="#a67a35"/><path d="m32 17 4 10 11 1-9 8 3 11-9-6-10 6 3-11-8-8 11-1Z" fill="#fff0ba" stroke="#a37a3a"/></>,
  clock: <><circle cx="32" cy="33" r="24" fill="#344e64" stroke="#d5d7bf" strokeWidth="4"/><path d="M32 16V34L44 41" stroke="#efd19a" strokeWidth="4"/><path d="M26 4H38" stroke="#b9c6c4" strokeWidth="4"/></>,
  battery: <><rect x="24" y="3" width="16" height="7" rx="2" fill="#a8babd"/><rect x="15" y="10" width="34" height="48" rx="7" fill="#d2b377" stroke="#eee1b9" strokeWidth="2"/><path d="m35 19-13 19h10l-4 16 16-23H33Z" fill="#fff0b9"/></>,
  check: <path d="M13 33 26 46 51 18" stroke="#b4e8c7" strokeWidth="5" />,
  tap: <><path d="M26 33V15a5 5 0 0 1 10 0v17l7-9c5-4 9 0 7 5l-4 21c-1 6-7 10-13 10-7 0-11-4-14-9l-8-13c-3-6 3-10 7-5l8 8" fill="#e9dfc5" /><path d="M15 17 9 14 M19 8 16 3 M44 15 50 11" stroke="#efc576" strokeWidth="3" /></>,
  wire: <><rect x="6" y="21" width="13" height="22" rx="4" fill="#e3d5b7" /><rect x="45" y="21" width="13" height="22" rx="4" fill="#e3d5b7" /><path d="M19 32H45" stroke="#e5b75e" strokeWidth="6" /><path d="M11 25V39 M52 25V39" stroke="#4f626e" strokeWidth="3" /></>,
  wave: <><path d="M5 33 Q13 7 21 33 T37 33 T53 33 T69 33" stroke="#e7bf76" strokeWidth="3" /><path d="M5 43H59" stroke="#87afbb" strokeWidth="1" /></>,
  send: <><path d="m8 28 48-18-16 47-10-18Z" fill="#e8ddc2" stroke="#f4cf81" /><path d="m30 39 14-16 M30 39l-2 13 10-8" stroke="#6c9fb0" strokeWidth="3" /></>,
  moon: <><circle cx="32" cy="32" r="25" fill="#c9c9bc" /><path d="M39 8a25 25 0 0 1 0 48A25 25 0 0 0 52 13Z" fill="#939c99" /><circle cx="22" cy="23" r="6" fill="#969f9b" /><circle cx="37" cy="40" r="8" fill="#a2aaa2" /><circle cx="19" cy="43" r="3" fill="#a5ada5" /></>,
  earth: <><circle cx="32" cy="32" r="25" fill="#638da9" /><path d="m18 12 6 5-3 8 7 2 2 8-8 4-2 11a25 25 0 0 1-2-38ZM42 9l-4 10 10 7-1 10-9 5-5-8 2-8-8-8 8-10Z" fill="#a4bea0" /><path d="M17 19q17-9 33 8 M11 35q16 11 40 5" stroke="#e7efdf" strokeWidth="3" opacity=".5" /></>,
  detector: <><path d="m31 32-18 22 M33 33l18 21 M32 34v24" stroke="#c4c3b0" strokeWidth="4" /><rect x="17" y="16" width="30" height="25" rx="5" fill="#e6ddc3" /><rect x="22" y="21" width="20" height="12" rx="2" fill="#3b566c" /><path d="m24 28 4-4 4 6 4-5 4 3" stroke="#8bd2ce" strokeWidth="2" /><path d="M32 16V7" stroke="#efbe66" strokeWidth="3" /></>,
  level: <><rect x="6" y="22" width="52" height="22" rx="5" fill="#dfd5b8" /><rect x="20" y="26" width="24" height="14" rx="5" fill="#4d7b83" /><circle cx="32" cy="33" r="5" fill="#c4e4bc" /><path d="M25 26V40 M39 26V40" stroke="#e8e5c7" /></>,
  trace: <><rect x="5" y="10" width="54" height="43" rx="5" fill="#d5ccb4" /><rect x="10" y="15" width="44" height="31" rx="2" fill="#243d52" /><path d="M12 32H22l4-8 5 15 6-22 5 15H52" stroke="#94d7c4" strokeWidth="2.5" /></>,
  scan: <><circle cx="27" cy="27" r="17" stroke="#dcd5be" strokeWidth="6" /><path d="m40 40 15 15" stroke="#efbf68" strokeWidth="8" /><path d="M17 27H37 M27 17V37" stroke="#8ac6d2" strokeWidth="2" /></>,
  ice: <><path d="m32 5 22 15-5 31-27 8L8 33 17 13Z" fill="#9ecbd9" stroke="#d2e8e3" /><path d="m32 5 2 26 20-11 M34 31l15 20 M34 31 22 59 8 33Z" fill="#6fa4bf" stroke="#c2e0e4" /><path d="m17 13 17 18" stroke="#e3f1e9" /></>,
  rock: <><path d="m8 40 9-23 23-8 17 22-5 23-28 4Z" fill="#8d949d" stroke="#b5b6b0" /><path d="m17 17 13 21 27-7L40 9Z" fill="#aeb1b0" /><path d="m30 38-6 20 28-4 5-23Z" fill="#626d7f" /></>,
  drill: <><path d="M12 11H43l10 9-10 12H21Z" fill="#dbd0b4" stroke="#eee2c6" /><path d="m18 28-3 25h13l6-22" fill="#535f70" /><path d="M45 21H59 M54 17l6 8" stroke="#e7bc69" strokeWidth="4" /><rect x="16" y="15" width="17" height="8" rx="2" fill="#4c697d" /></>,
  bucket: <><path d="M13 23 19 56h27l6-33Z" fill="#85909a" stroke="#d7d3c2" strokeWidth="2" /><ellipse cx="32" cy="23" rx="20" ry="7" fill="#3f5568" stroke="#d7d3c2" strokeWidth="2" /><path d="M16 23V14c0-12 32-12 32 0v9" stroke="#e9be6b" strokeWidth="3" /><path d="M25 33v15" stroke="#b6c3c8" strokeWidth="2" /></>,
  gear: <><path d="m27 6 10 0 2 9 8 4 8-2 5 9-7 7-1 8 4 7-8 7-8-5-8 1-6 7-9-5 1-9-4-7-9-3 1-10 9-2 5-6Z" fill="#d2c7ae" stroke="#f2dbab" /><circle cx="32" cy="32" r="11" fill="#4b6477" stroke="#8eb2bb" strokeWidth="2" /></>,
  filter: <><rect x="13" y="8" width="38" height="48" rx="7" fill="#ded4b9" stroke="#f1e5c6" /><rect x="20" y="15" width="24" height="34" rx="3" fill="#4b6b7e" /><path d="M24 17V47 M32 17V47 M40 17V47 M22 24H42 M22 32H42 M22 40H42" stroke="#b0d0d1" strokeWidth="1.5" /></>,
  tray: <><path d="m5 30 26-15 28 15-27 17Z" fill="#c5c0af" /><path d="M5 30v13l27 16 27-16V30L32 47Z" fill="#717b88" stroke="#d9cfb7" /><path d="m15 29 16-8 17 9-16 9Z" fill="#394f62" /></>,
  pipe: <><path d="M12 48H35V15" stroke="#d5c7a9" strokeWidth="15" /><path d="M12 48H35V15" stroke="#77becb" strokeWidth="7" /><path d="M7 40V56 M27 9H43" stroke="#e5be72" strokeWidth="4" /></>,
  heat: <><path d="M31 5c4 17-17 20-17 35a18 18 0 0 0 36 0c0-11-7-16-9-20-3 7-6 10-7 10 2-9 3-16-3-25Z" fill="#e5b566" /><path d="M31 31c1 9-8 12-7 19 3 10 15 5 15-2 0-6-4-11-8-17Z" fill="#fff0be" /></>,
  drop: <><path d="M32 5C23 20 10 32 13 44c4 22 36 22 39 0 2-13-12-27-20-39Z" fill="#82bdd6" stroke="#bddde4" /><path d="M22 37c-3 10 1 13 6 15" stroke="#e1f4e9" strokeWidth="3" /></>,
  valve: <><path d="M5 43H59" stroke="#a8afb1" strokeWidth="12" /><path d="M32 43V25" stroke="#cfc8b3" strokeWidth="7" /><circle cx="32" cy="20" r="13" stroke="#e7b963" strokeWidth="5" /><path d="M19 20H45 M32 7V33" stroke="#e7b963" strokeWidth="3" /></>,
  book: <><path d="M5 13q14-5 27 3 13-8 27-3v39q-14-5-27 3-13-8-27-3Z" fill="#c6d4ce" stroke="#f1dfb7" /><path d="M32 16V55 M12 24H23 M12 31H23 M40 23H51 M40 30H51" stroke="#506d7f" strokeWidth="2" /></>,
  hint: <><path d="M20 41c-22-22 6-44 23-29 13 12 0 22-2 29Z" fill="#e8bf74" /><path d="M22 45H41 M25 52H38 M29 58H34" stroke="#d4d9c9" strokeWidth="4" /></>,
  reset: <><path d="M49 16a23 23 0 1 1-32-2" stroke="#bdd4d5" strokeWidth="4" /><path d="M8 11H23V27" stroke="#efc578" strokeWidth="4" /></>,
  foot: <><ellipse cx="34" cy="13" rx="11" ry="9" fill="#dfd3b8" transform="rotate(-18 34 13)" /><path d="M25 26c16-5 19 6 15 16s-3 17-13 17c-12-1-11-16-10-22s3-9 8-11Z" fill="#d4c5a5" stroke="#f1d494" /></>,
  lift: <><path d="M13 33H51" stroke="#c5d0cc" strokeWidth="7" /><rect x="6" y="17" width="13" height="32" rx="3" fill="#777e8b" stroke="#e5bc70" /><rect x="45" y="17" width="13" height="32" rx="3" fill="#777e8b" stroke="#e5bc70" /></>,
  play: <path d="m22 12 28 20-28 20Z" fill="#c1ddcf" />,
  pause: <><path d="M21 13V51 M43 13V51" stroke="#c1ddcf" strokeWidth="9" /></>,
};
export function WorkshopIcon({ name, size = 24, className = "" }: { name: WorkshopSymbol; size?: number; className?: string }) {
  return <svg className={`workshop-icon ${className}`} width={size} height={size} viewBox="0 0 64 64" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{symbols[name]}</svg>;
}
export function CircuitShape({ shape, checked = false }: { shape: string; checked?: boolean }) {
  return checked ? <WorkshopIcon name="check" size={27} /> : <svg className="circuit-shape" width="25" height="25" viewBox="0 0 32 32" aria-hidden="true">{shape === "circle" ? <circle cx="16" cy="16" r="10" /> : shape === "square" ? <rect x="6" y="6" width="20" height="20" rx="2" /> : <path d="M16 4 29 27H3Z" />}</svg>;
}

/** Detailed native vector assets use the active ivory/charcoal/gold/navy palette. */
export function EquipmentArtwork({ task, size = 72 }: { task: TutorialTaskId; size?: number }) {
  const symbol: Record<TutorialTaskId, WorkshopSymbol> = { comms: "wave", detector: "trace", ice: "ice", food: "gear", melt: "drop" };
  return <svg className={`workshop-equipment equipment-${task}`} width={size} height={size} viewBox="0 0 120 120" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <ellipse cx="60" cy="104" rx="41" ry="9" fill="#08121d" opacity=".45" />
    <path d="m18 39 46-22 40 21-45 25Z" fill="#f0e5cc" stroke="#d1c3a7" />
    <path d="M18 39v48l41 23V63Z" fill="#bcb29b" stroke="#8b8b81" />
    <path d="m59 63 45-25v49l-45 23Z" fill="#d8ceb4" stroke="#a49c88" />
    <path d="M18 82 59 105l45-23v7l-45 24-41-24Z" fill="#465163" />
    <path d="m25 47 26 15 M67 63l29-16" stroke="#e8b85b" strokeWidth="4" />
    <path d="M27 59v15l23 13V72Z" fill="#334e64" stroke="#8badaf" />
    <path d="M69 77v13l24-13V64Z" fill="#4c6579" />
    <path d="m31 67 4 2 M39 72l6 3 M75 77l12-7" stroke="#9ed4d2" strokeWidth="2" />
    <circle cx="26" cy="84" r="1.7" fill="#ddd5bd" /><circle cx="94" cy="84" r="1.7" fill="#ddd5bd" />
    <svg x="39" y="23" width="46" height="40" viewBox="0 0 64 64">{symbols[symbol[task]]}</svg>
    {task === "comms" && <><path d="M91 36V8" stroke="#657a87" strokeWidth="4" /><circle cx="91" cy="7" r="3" fill="#efbd65" /><path d="M99 12q9 9 0 17" stroke="#9dc7cc" strokeWidth="2" /></>}
    {task === "detector" && <><path d="m36 99-12 12 M84 98l12 12" stroke="#eadfc3" strokeWidth="4" /><path d="M41 35q20-16 40-1" stroke="#9ed4d2" strokeWidth="2" /></>}
    {task === "ice" && <path d="M9 87 17 73l13 4 3 15-13 6Z" fill="#86b7cd" stroke="#cee8e5" />}
    {task === "food" && <path d="m72 91 20-11v8L72 99Z" fill="#91b3b5" stroke="#d0d4bf" />}
    {task === "melt" && <><path d="M45 18V10q15-7 29 0v8" stroke="#d7c5a2" strokeWidth="3" /><path d="M96 66v17" stroke="#8ecbd7" strokeWidth="3" /></>}
  </svg>;
}
