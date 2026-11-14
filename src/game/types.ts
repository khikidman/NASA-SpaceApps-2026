export const RESOURCE_KEYS = ["oxygen", "power", "shielding", "science"] as const;
export type Resource = (typeof RESOURCE_KEYS)[number];
export type Resources = Record<Resource, number>;
export type ResourceDelta = Partial<Resources>;

export interface Choice {
  id: string;
  label: string;
  description: string;
  effects: ResourceDelta;
}

export interface MissionEvent {
  id: string;
  title: string;
  category: "operations" | "weather" | "equipment" | "science";
  minDay: number;
  description: string;
  effects: ResourceDelta;
  radiation: number;
  fact: string;
  sourceId: string;
  choices: readonly Choice[];
}

export interface MissionConfig {
  id: string;
  title: string;
  location: "Mars";
  duration: number;
  initialResources: Resources;
  dailyEffects: ResourceDelta;
  capacity: Resources;
}

export interface TurnSummary {
  day: number;
  eventId: string;
  eventTitle: string;
  choiceId: string;
  choiceLabel: string;
  before: Resources;
  after: Resources;
  shieldAbsorbed: number;
  emergencyOxygen: number;
}

export interface GameState {
  missionId: string;
  seed: number;
  randomState: number;
  day: number;
  resources: Resources;
  eventId: string;
  status: "playing" | "won" | "lost";
  history: readonly TurnSummary[];
}
