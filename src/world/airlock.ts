export type AirlockDirection = "enter" | "exit";
export type AirlockPhase = "outer-opening" | "inner-opening" | "boarding" | "sealing" | "pressure" | "passing" | "closing" | "ready" | "outside";
export interface AirlockStatus { phase: AirlockPhase; direction: AirlockDirection; cycling: boolean }
export interface AirlockSample extends AirlockStatus { innerOpen: number; outerOpen: number; pressure: number; walk: number }
export const AIRLOCK_LABELS: Record<AirlockPhase, string> = {
  "outer-opening": "Outer door opening", "inner-opening": "Inner door opening", boarding: "Step into the airlock",
  sealing: "Sealing the door", pressure: "Changing air pressure", passing: "Door ready — walking through",
  closing: "Closing the door", ready: "Walk through the airlock to leave", outside: "Outside",
};
const ramp = (p: number, a: number, b: number) => { const t = Math.max(0, Math.min(1, (p - a) / (b - a))); return t * t * (3 - 2 * t); };

/** A short fictional pressure cycle, with mutually exclusive door openings. */
export function airlockAt(progress: number, direction: AirlockDirection): AirlockSample {
  const p = Math.max(0, Math.min(1, progress)), entering = direction === "enter";
  // The inner door stays open at rest so the arrival square leads into the room.
  const first = (entering ? ramp(p, 0, .1) : 1) * (1 - ramp(p, .27, .37));
  const second = ramp(p, .62, .72) * (entering ? 1 : 1 - ramp(p, .88, 1));
  const pressure = ramp(p, .37, .62);
  const walk = .5 * ramp(p, .1, .27) + .5 * ramp(p, .72, .88);
  const phase: AirlockPhase = p >= 1 ? entering ? "ready" : "outside"
    : p < .1 ? entering ? "outer-opening" : "inner-opening" : p < .27 ? "boarding"
    : p < .37 ? "sealing" : p < .62 ? "pressure" : p < .72 ? entering ? "inner-opening" : "outer-opening"
    : p < .88 ? "passing" : "closing";
  return { direction, phase, cycling: p < 1, innerOpen: entering ? second : first,
    outerOpen: entering ? first : second, pressure: entering ? pressure : 1 - pressure, walk };
}

/** Board the full airlock square before pressurizing; leave it only after venting. */
export function airlockCrossing(sample: AirlockSample): number {
  return sample.direction === "enter" ? Math.min(1, sample.walk * 2) : Math.max(0, sample.walk * 2 - 1);
}
