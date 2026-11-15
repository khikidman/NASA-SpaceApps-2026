import { GameArt, type Art } from "./game-art";
import type { Resource } from "@/game/types";
import { WorkshopIcon } from "./workshop-art";
const ARTS: Record<Resource, Art> = { oxygen: "air", water: "water", power: "battery", energy: "sun", shielding: "shield", science: "star" };
const INFO: Record<Resource, { label: string; symbol: string; color: string }> = {
  energy: { label: "Energy", symbol: "☀", color: "#e9aa7f" },
  oxygen: { label: "Air", symbol: "O₂", color: "#91e9d9" }, water: { label: "Water", symbol: "◒", color: "#83bfff" },
  power: { label: "Power", symbol: "ϟ", color: "#f2cf85" }, shielding: { label: "Shield", symbol: "◇", color: "#afbdf7" }, science: { label: "Research tokens", symbol: "✦", color: "#dfc385" },
};
export function ResourceMeter({ resource, value }: { resource: Resource; value: number }) {
  const info = INFO[resource];
  const critical = ["oxygen", "water", "power"].includes(resource) && value <= 20;
  return <div className={`supply-row ${critical ? "is-low" : ""} ${resource === "science" ? "star-bank" : ""}`} style={{ "--meter-color": info.color } as React.CSSProperties} title={`${info.label}: ${value}`}>
    <span className="supply-symbol">{resource === "energy" || resource === "science" ? <WorkshopIcon name={resource === "energy" ? "readiness" : "token"} size={22}/> : <GameArt name={ARTS[resource]} size={20} />}</span>
    <div className="supply-content"><div className="supply-label-row"><span>{info.label}</span><output key={value} className="supply-number" aria-label={`${value}${resource === "science" ? " research tokens" : ` of 100 ${info.label}`}`}>{value}{resource !== "science" && <small>/100</small>}</output></div>{resource !== "science" && <div className="supply-track" role="meter" aria-label={info.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><span className="supply-fill" style={{ width: `${value}%` }} /></div>}</div>
  </div>;
}
