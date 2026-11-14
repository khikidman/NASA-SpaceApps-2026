import type { Resource } from "@/game/types";

const INFO: Record<Resource, { label: string; symbol: string; color: string; description: string }> = {
  oxygen: { label: "Oxygen", symbol: "O₂", color: "var(--oxygen)", description: "Air for your crew" },
  power: { label: "Power", symbol: "↯", color: "var(--power)", description: "Energy for your outpost" },
  shielding: { label: "Shield reserve", symbol: "◇", color: "var(--shield)", description: "Supplies for storm protection" },
  science: { label: "Science", symbol: "✧", color: "var(--science)", description: "Discoveries along the way" },
};

export function ResourceMeter({ resource, value }: { resource: Resource; value: number }) {
  const info = INFO[resource];
  const critical = (resource === "oxygen" || resource === "power") && value <= 20;
  return (
    <div className={`resource-card ${critical ? "resource-critical" : ""}`} style={{ "--meter-color": info.color } as React.CSSProperties}>
      <div className="resource-top"><span className="resource-symbol" aria-hidden="true">{info.symbol}</span><span>{info.label}</span></div>
      <div className="resource-value">{value}<span>{resource === "science" ? " pts" : " / 100"}</span></div>
      {resource !== "science" && <meter min={0} max={100} value={value} aria-label={`${info.label}: ${value} out of 100`} />}
      <p>{critical ? "Running low — plan your next move." : info.description}</p>
    </div>
  );
}
