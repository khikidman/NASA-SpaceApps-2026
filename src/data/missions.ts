import type { MissionConfig } from "../game/types";

export const MARS_MISSION: MissionConfig = {
  id: "mars-outpost",
  title: "A home on Mars",
  location: "Mars",
  duration: 15,
  initialResources: { oxygen: 75, power: 70, shielding: 40, science: 0 },
  dailyEffects: { oxygen: -6, power: 8 },
  capacity: { oxygen: 100, power: 100, shielding: 100, science: 1000 },
};

export const MISSIONS: Readonly<Record<string, MissionConfig>> = {
  [MARS_MISSION.id]: MARS_MISSION,
};
