import type { GridPosition } from "../world/types";
export const RESOURCE_KEYS = ["oxygen", "water", "power", "energy", "shielding", "science"] as const;
export type Resource = (typeof RESOURCE_KEYS)[number];
export type Resources = Record<Resource, number>;
export type ResourceDelta = Partial<Resources>;
export type WorldId = "moon" | "mars";
export interface Choice { id: string; label: string; description: string; effects: ResourceDelta }
export interface MissionEvent {
  id: string; title: string; description: string; fact: string; sourceId: string;
  effects: ResourceDelta; radiation: number; choices: readonly Choice[];
}
export interface MissionConfig {
  id: WorldId; title: string; location: "Moon" | "Mars"; duration: number;
  initialResources: Resources; dailyEffects: ResourceDelta; capacity: Resources;
}
export interface TurnSummary {
  world: WorldId; day: number; eventTitle: string; choiceLabel: string;
  before: Resources; after: Resources; knowledge: number;
}
export type GameAction =
  | { type: "tutorial-submit"; taskId: TutorialTaskId; input: TutorialInput }
  | { type: "tutorial-exercise"; method: "cardio" | "weights" | "skip"; repetitions: number }
  | { type: "tutorial-refill" }
  | { type: "move"; position: GridPosition }
  | { type: "collect"; nodeId: string }
  | { type: "submit"; nodeId: string; answers: string[] }
  | { type: "learn" }
  | { type: "end-day"; choiceId: string }
  | { type: "travel" };
export interface GameState {
  missionId: WorldId; seed: number; day: number; resources: Resources;
  status: "playing" | "level-complete" | "won" | "lost";
  position: GridPosition; steps: number; timeLeft: number;
  knowledgeEarned: number; levelKnowledge: number; dayKnowledge: number;
  collectedNodes: readonly string[]; taskProgress: Readonly<Record<string, number>>; learnedToday: boolean;
  discoveries: readonly { world: WorldId; day: number; fact: string; sourceId: string }[];
  completedLevels: readonly WorldId[]; history: readonly TurnSummary[];
  actions: readonly GameAction[]; feedback: string;
  tutorial: { completed: readonly TutorialTaskId[]; ice: number; exercise: "pending" | "cardio" | "weights" | "skipped"; fatigue: boolean };
}
export type TutorialTaskId = "comms" | "detector" | "ice" | "food" | "melt";
export type TutorialPlan = "standard" | "boost";
export type TutorialInput = (
  | { kind: "repair"; pairs: string[]; tuning: number; proof?: { frequency: number; phase: number; tested: boolean } }
  | { kind: "calibrate"; placed: boolean; reading: number; proof?: { pad: number; feet: number[]; recorded: boolean } }
  | { kind: "collect"; pieces: string[]; proof?: { scanned: string[]; cuts: number[] } }
  | { kind: "assemble"; parts: string[]; proof?: { rotations: number[]; tested: boolean } }
  | { kind: "convert"; loaded: boolean; heat: number; proof?: { temperatures: number[]; filtered: boolean; checked?: boolean } }
) & { revision?: 2; plan?: TutorialPlan };
export interface TaskOption { id: string; label: string; weight?: number; effects?: ResourceDelta }
export interface TaskStep {
  id: string; kind: "pick" | "pack" | "order"; prompt: string; hint: string; fact: string; sourceId: string;
  cost: ResourceDelta; hours: number; reward: number; options: readonly TaskOption[];
  answer: readonly string[]; budget?: number;
}
export interface LearningTask { id: string; title: string; description: string; steps: readonly TaskStep[] }
