import { RESOURCE_NAMES } from "@/data/missions";
import { RESOURCE_KEYS, type ResourceDelta } from "@/game/types";
const SYMBOLS = { oxygen: "O₂", water: "◒", power: "ϟ", shielding: "◇", science: "✦", energy: "☀" };
export function ResourceEffects({ effects, hours = 0, compact = false }: { effects: ResourceDelta; hours?: number; compact?: boolean }) {
  return <span className={`effects ${compact ? "effects-compact" : ""}`}>{RESOURCE_KEYS.filter((key) => effects[key]).map((key) => {
    const n = effects[key]!;
    return <span key={key} data-resource={key} className={n > 0 ? "effect gain" : "effect loss"} aria-label={`${n > 0 ? "Gain" : "Use"} ${Math.abs(n)} ${RESOURCE_NAMES[key]}`} title={RESOURCE_NAMES[key]}>{n > 0 ? "+" : "−"}{Math.abs(n)} {compact ? <span aria-hidden="true">{SYMBOLS[key]}</span> : RESOURCE_NAMES[key]}</span>;
  })}{hours > 0 && <span className="effect loss" aria-label={`Use ${hours} work hours`}>−{hours} {compact ? "◷" : hours === 1 ? "hour" : "hours"}</span>}</span>;
}
