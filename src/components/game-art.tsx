import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { uiBankAsset, type GrowLightState } from "@/assets/asset-bank";
export type Art = "rock" | "rain" | "waves" | "sensor" | "wind" | "plant" | "dark" | "supplies" | "rust" | "berries" | "lamp" | "solar" | "water" | "greenhouse" | "outside" | "box" | "air" | "jar" | "camera" | "battery" | "tray" | "notes" | "home" | "shield" | "radio" | "tools" | "moon" | "mars" | "clock" | "star" | "check" | "sun" | "dust" | "bag";
const leaf = <><path d="M50 73V40" stroke="#81dcac" strokeWidth="5" /><path d="M49 56C28 59 25 41 26 36c18 0 25 8 23 20Z" fill="#6ac497" /><path d="M51 48c-2-19 12-24 24-23 1 18-9 26-24 23Z" fill="#a5edbc" /></>;
const rock = <><path d="m28 62 9-22 22-6 16 18-9 21-24 3Z" fill="#acb7ba" /><path d="m37 40 13 17 25-5-16-18Z" fill="#d2dcd6" /><path d="m50 57-8 19 24-3 9-21Z" fill="#748a92" /></>;
const bottle = (color: string) => <><rect x="38" y="20" width="24" height="8" rx="3" fill="#b7cad2" /><rect x="32" y="27" width="36" height="54" rx="12" fill={color} /><path d="M39 40v24" stroke="#fff" opacity=".4" strokeWidth="4" /></>;
const arts: Record<Art, ReactNode> = {
  rock: <><path className="art-streak" d="m23 20 16 19M12 31l16 15m10-34 9 15" stroke="#f6c78c" strokeWidth="5" />{rock}<ellipse cx="51" cy="83" rx="30" ry="6" fill="#b8b4a7" opacity=".3" /></>,
  rain: <><path d="M25 47c-18-2-13-25 1-25 2-20 32-20 35-2 20-4 27 23 8 27Z" fill="#bacbdc" /><g className="art-rain" stroke="#7ac8f1" strokeWidth="5"><path d="m28 59-5 12m25-12-5 12m25-12-5 12" /></g></>,
  waves: <g className="art-wave" stroke="#7ac8f1" strokeWidth="5"><path d="M10 44q10-15 20 0t20 0 20 0 20 0M10 62q10-15 20 0t20 0 20 0 20 0M10 80q10-15 20 0t20 0 20 0 20 0" /></g>,
  sensor: <><path d="m16 76 19-5 10 9 22-6 18 6" stroke="#a8b5b6" strokeWidth="4" /><rect x="30" y="30" width="40" height="43" rx="7" fill="#83a9b4" /><rect x="36" y="38" width="28" height="21" rx="3" fill="#183444" /><path className="art-wave" d="m39 49 5-3 5 10 7-14 5 7" stroke="#a0f4d7" strokeWidth="2" /><path d="M50 30V17m-10 1q10-10 20 0" stroke="#b7ece6" strokeWidth="3" /></>,
  wind: <><path d="M46 44 37 83h22l-9-39" fill="#a5b8c6" /><g className="art-wind"><path d="M49 40V9L37 20Zm0 0L78 53l-6-17Zm0 0L27 64l19 1Z" fill="#c4e5ed" /></g><circle cx="49" cy="40" r="5" fill="#e9bc84" /></>,
  plant: <><path d="m28 68 8 20h30l8-20Z" fill="#c9987a" />{leaf}</>,
  dark: <><circle cx="51" cy="48" r="30" fill="#273949" /><path d="M62 21c-20 6-20 36 2 43-30 12-49-27-24-42" fill="#a9b7d7" /><circle cx="76" cy="27" r="3" fill="#f4d68d" /></>,
  supplies: <><path d="m35 70 5 17h23l6-17Z" fill="#be9578" />{leaf}<circle cx="20" cy="25" r="10" fill="#f5d986" /><path d="M79 45q-16 18 0 23 16-5 0-23Z" fill="#7bcaf1" /><circle cx="76" cy="23" r="6" fill="#b4ddec" /><circle cx="26" cy="65" r="5" fill="#dcb7ee" /></>,
  rust: <><path d="m19 66 18-31 33 7 12 31-37 7Z" fill="#aa684e" /><path d="m37 35 12 22 21-15Z" fill="#df9470" /><path d="m49 57-4 23 37-7-12-31Z" fill="#8a493d" /><circle cx="27" cy="83" r="4" fill="#d58b63" /></>,
  berries: <><path d="M24 37q27-14 51 0-4 44-26 48Q26 66 24 37Z" fill="#e68a8a" /><path d="m31 37-6-15 20 8 7-17 7 17 19-7-7 15" fill="#78bc93" /><g fill="#ffe3a8"><circle cx="37" cy="48" r="2" /><circle cx="59" cy="48" r="2" /><circle cx="48" cy="63" r="2" /></g></>,
  lamp: <><path d="M36 70V57c-27-28 24-56 29-22 1 10-6 16-6 22v13" fill="#f5d58a" /><path d="M37 71h24m-21 8h18" stroke="#b1cad6" strokeWidth="6" /><path d="M15 32h-8m76 0h9M24 12l-6-6m55 6 6-6" stroke="#f5d58a" strokeWidth="3" /></>,
  solar: <><circle cx="79" cy="20" r="12" fill="#f1d48b" /><path d="M48 67v18m-14 0h28" stroke="#9fbbc8" strokeWidth="5" /><path d="m26 31 54 12-10 29-54-13Z" fill="#315d7c" stroke="#adcde0" strokeWidth="3" /><path d="m43 35-9 28m26-24-9 28M21 45l54 12" stroke="#8ebbd7" strokeWidth="2" /></>,
  water: <><path className="art-drop" d="M50 13C40 29 22 48 25 64c7 33 54 27 51-2-1-15-16-33-26-49Z" fill="#81c5ed" /><path d="M36 60q-4 13 8 16" stroke="#d9f2ff" strokeWidth="5" /></>,
  greenhouse: <><path d="M17 82V38l33-25 33 25v44Z" fill="#75b8be" fillOpacity=".23" stroke="#a0e2da" strokeWidth="3" /><path d="M50 14v67M18 41h64" stroke="#a0e2da" strokeWidth="2" />{leaf}<path d="M13 84h74" stroke="#b7c9c9" strokeWidth="5" /></>,
  outside: <><circle cx="50" cy="51" r="36" fill="#a46852" /><path d="M21 70h60" stroke="#e3a582" strokeWidth="4" /><path d="M49 69V45q-14-14-21 0 3 15 21 9" stroke="#c0b884" strokeWidth="4" /><circle cx="72" cy="29" r="8" fill="#87533f" /></>,
  box: <><path d="m20 38 31-12 30 12v42H20Z" fill="#8b9aa7" /><path d="m20 38 31 11 30-11M51 49v31" stroke="#344e61" strokeWidth="3" /><path d="m20 38 8-11 23 10 22-10 8 11-30 11Z" fill="#b6c5d1" /></>,
  air: <>{bottle("#8bdacb")}<path d="M44 51q6-8 12 0t-12 0M44 60h12" stroke="#244d55" strokeWidth="3" /></>,
  jar: <><path d="M31 27h38v8H31Z" fill="#b4c7d1" /><rect x="28" y="35" width="44" height="49" rx="9" fill="#8bced0" fillOpacity=".3" stroke="#b8e6e5" strokeWidth="3" /><path d="m36 69 10-14 16 4 3 17-19 1Z" fill="#c2beb0" /></>,
  camera: <><path d="m30 33 5-10h24l6 10" fill="#b3c9d4" /><rect x="16" y="33" width="70" height="47" rx="9" fill="#809baa" /><circle cx="51" cy="56" r="18" fill="#284553" stroke="#c0e5ec" strokeWidth="4" /><circle cx="51" cy="56" r="9" fill="#78aaa9" /><circle cx="74" cy="42" r="3" fill="#efcb88" /></>,
  battery: <><rect x="39" y="16" width="22" height="8" rx="2" fill="#b7ccd5" /><rect x="27" y="24" width="46" height="61" rx="8" fill="#c5a96b" /><path d="m55 33-18 25h13l-5 18 20-28H52Z" fill="#fff0b0" /></>,
  tray: <><path d="m15 51 34-16 36 15-35 19Z" fill="#899b92" /><path d="m15 51 5 23 31 14 30-15 4-23-35 19Z" fill="#c28e6d" /><path d="m26 51 23-8 22 8-22 11Z" fill="#625647" /><circle cx="47" cy="51" r="3" fill="#e7d0a2" /></>,
  notes: <><rect x="24" y="15" width="53" height="71" rx="7" fill="#a7c9d1" /><path d="M35 34h30m-30 13h20m-20 13h26" stroke="#466679" strokeWidth="4" /><path d="m56 76 24-24 6 6-24 24-9 3Z" fill="#f1cb82" /></>,
  home: <><path d="m15 46 35-29 35 29" stroke="#b5e9df" strokeWidth="5" /><path d="M24 43v41h52V43L50 24Z" fill="#a7c7bb" /><path d="M42 84V57h17v27" fill="#375966" /><circle cx="50" cy="41" r="5" fill="#e9d69c" /></>,
  shield: <><path d="m50 12 31 12v26q-4 24-31 38Q23 74 19 50V24Z" fill="#859dd4" /><path d="m50 23 20 8v20q-5 16-20 25Z" fill="#bdd1f7" /><path d="m35 48 10 10 21-25" stroke="#edfaff" strokeWidth="4" /></>,
  radio: <><rect x="24" y="42" width="54" height="40" rx="7" fill="#93b5bd" /><path d="M33 42 59 13" stroke="#d4e6ed" strokeWidth="3" /><circle cx="44" cy="62" r="11" fill="#335362" /><path d="M63 55h8m-8 12h8M65 18q20 6 19 24" stroke="#f1d18d" strokeWidth="3" /></>,
  tools: <><path d="M32 16q-13 18 7 28L63 80q5 7 13-1 7-6 0-12L43 37q9-19-9-23l4 15-9 4Z" fill="#b4cbd5" /><circle cx="70" cy="74" r="3" fill="#355466" /></>,
  moon: <><circle cx="50" cy="50" r="34" fill="#bbc0b3" /><circle cx="36" cy="35" r="9" fill="#8b978c" /><circle cx="61" cy="62" r="13" fill="#99a498" /><circle cx="64" cy="31" r="5" fill="#969f90" /></>,
  mars: <><circle cx="50" cy="50" r="34" fill="#c48562" /><path d="M22 43q28-18 54 5M32 72q24-14 42-5" stroke="#a2614c" strokeWidth="9" /><circle cx="63" cy="30" r="6" fill="#915b48" /></>,
  clock: <><circle cx="50" cy="51" r="32" fill="#8dabb9" /><circle cx="50" cy="51" r="25" fill="#1e394b" /><path d="M50 32v21l15 9" stroke="#d5e8eb" strokeWidth="4" /><path d="M41 12h18" stroke="#b3d0d6" strokeWidth="5" /></>,
  star: <path d="m50 10 12 26 29 4-21 21 5 29-25-14-26 14 5-29L9 40l29-4Z" fill="#d5b5f7" />,
  check: <><circle cx="50" cy="50" r="35" fill="#81dcb2" fillOpacity=".15" /><path d="m29 49 15 16 30-33" stroke="#9aefc3" strokeWidth="8" /></>,
  sun: <><circle cx="50" cy="50" r="23" fill="#f5cf80" /><path d="M50 9v10m0 62v10M9 50h10m62 0h10M21 21l7 7m44 44 7 7M21 79l7-7m44-44 7-7" stroke="#f5cf80" strokeWidth="4" /></>,
  dust: <><circle cx="66" cy="29" r="12" fill="#d4ab76" /><path className="art-wave" d="M14 48h50q16 0 16-13M20 63h63M11 77h48" stroke="#c5a18a" strokeWidth="5" /><circle cx="30" cy="33" r="3" fill="#d0b39a" /></>,
  bag: <><path d="M33 33V22q17-16 34 0v11" stroke="#b1d5df" strokeWidth="5" /><rect x="21" y="31" width="58" height="56" rx="13" fill="#7198a7" /><rect x="30" y="52" width="40" height="26" rx="5" fill="#a0c7cd" /><path d="M39 44h22" stroke="#d9e9e5" strokeWidth="3" /></>,
};
export function GameArt({ name, size = 64, className = "", style, growLightState }: { name: Art; size?: number; className?: string; style?: CSSProperties; growLightState?: GrowLightState }) {
  const asset = uiBankAsset(name, growLightState);
  if (asset) return <Image unoptimized src={asset.src} alt="" aria-hidden="true" draggable={false} className={`game-art ${className}`} width={size} height={size} style={{ objectFit: "contain", ...style }} />;
  return <svg className={`game-art ${className}`} width={size} height={size} viewBox="0 0 100 100" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>{arts[name]}</svg>;
}
