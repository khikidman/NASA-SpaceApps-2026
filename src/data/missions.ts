import type { MissionConfig, WorldId } from "../game/types";
const common = {
  duration: 7,
  initialResources: { oxygen: 80, water: 75, power: 75, shielding: 40, science: 6 },
  dailyEffects: { oxygen: -8, water: -6, power: -4 },
  capacity: { oxygen: 100, water: 100, power: 100, shielding: 100, science: 10000 },
};
export const MOON_MISSION: MissionConfig = { ...common, id: "moon", title: "Moon explorers", location: "Moon" };
export const MARS_MISSION: MissionConfig = { ...common, id: "mars", title: "Mars explorers", location: "Mars" };
export const MISSIONS: Readonly<Record<WorldId, MissionConfig>> = { moon: MOON_MISSION, mars: MARS_MISSION };
export const DAILY_KNOWLEDGE_GOAL = 6;
export const WORK_HOURS = 16;
export const RESOURCE_NAMES = { oxygen: "Air", water: "Water", power: "Power", shielding: "Shield", science: "Stars" } as const;
