import type { GameState, ResourceDelta, TutorialInput, TutorialTaskId } from "../game/types";
import { validWorkshopProof } from "./day-one-workshop";

/** [TUNE] Fictional prototype balance, not NASA measurements or study findings. */
export const DAY1_CONFIG = {
  scienceGoal: 6, oxygenPerStep: .5, exerciseHours: 2,
  exerciseCost: { energy: -5, water: -2, science: -1 } as ResourceDelta,
  exerciseReward: 2, fatigueMorningEnergy: 80,
  refillCost: { power: -1 } as ResourceDelta,
};
export interface TutorialTask {
  id: TutorialTaskId; title: string; prompt: string; nodeId: string; inside: boolean;
  kind: TutorialInput["kind"]; cost: ResourceDelta; hours: number; reward: number;
}
export const DAY1_TASKS: readonly TutorialTask[] = [
  { id: "comms", title: "Fix the radio", prompt: "Connect shapes. Tune the signal.", nodeId: "solar-02", inside: false, kind: "repair", cost: { science: -1, energy: -8 }, hours: 1, reward: 3 },
  { id: "detector", title: "Place the detector", prompt: "Place it. Center the needle.", nodeId: "lab-01", inside: false, kind: "calibrate", cost: { science: -1, energy: -8 }, hours: 1.5, reward: 3 },
  { id: "ice", title: "Bring home ice", prompt: "Drill each chunk into your bucket.", nodeId: "water-01", inside: false, kind: "collect", cost: { science: -1, energy: -6 }, hours: 1.5, reward: 3 },
  { id: "food", title: "Fix the kitchen", prompt: "Fit the machine parts.", nodeId: "hab-01", inside: true, kind: "assemble", cost: { science: -1, energy: -8 }, hours: 1, reward: 3 },
  { id: "melt", title: "Melt the ice", prompt: "Load ice. Warm it gently.", nodeId: "hab-01", inside: true, kind: "convert", cost: { science: -1, energy: -4, power: -6, water: 12 }, hours: .5, reward: 3 },
];
export const isDayOne = (game: Pick<GameState, "missionId" | "day">) => game.missionId === "moon" && game.day === 1;
export const nextDayOneTask = (game: GameState) => DAY1_TASKS.find((task) => !game.tutorial.completed.includes(task.id));
export const remainingDayOneHours = (game: GameState) => DAY1_TASKS.filter((task) => !game.tutorial.completed.includes(task.id)).reduce((sum, task) => sum + task.hours, 0);
const exact = (actual: unknown, expected: string[]) => Array.isArray(actual) && actual.length === expected.length && new Set(actual).size === actual.length && expected.every((id) => actual.includes(id));
const centered = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 45 && value <= 55;
export function validTutorialInput(task: TutorialTask, input: TutorialInput, seed = 0) {
  if (!input || input.kind !== task.kind) return false;
  if (!validWorkshopProof(input, seed)) return false;
  switch (input.kind) {
    case "repair": return exact(input.pairs, ["triangle", "circle", "square"]) && centered(input.tuning);
    case "calibrate": return input.placed === true && centered(input.reading);
    case "collect": return exact(input.pieces, ["ice-a", "ice-b", "ice-c"]);
    case "assemble": return exact(input.parts, ["gear", "filter", "tray"]);
    case "convert": return input.loaded === true && centered(input.heat);
  }
}
