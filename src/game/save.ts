import { DATASET_VERSION } from "../data/events";
import { advanceTurn, createGame, getMission, RULESET_VERSION } from "./engine";
import type { GameState } from "./types";

export const SAVE_KEY = "junior-astronaut:mission";
const SAVE_VERSION = 1;

export function serializeGame(state: GameState): string {
  return JSON.stringify({
    version: SAVE_VERSION,
    rulesetVersion: RULESET_VERSION,
    datasetVersion: DATASET_VERSION,
    missionId: state.missionId,
    seed: state.seed,
    choices: state.history.map((turn) => turn.choiceId),
  });
}

export function restoreGame(raw: string): GameState {
  if (raw.length > 20_000) throw new Error("Save is too large.");
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object") throw new Error("Invalid save.");
  const save = data as Record<string, unknown>;
  if (save.version !== SAVE_VERSION || save.rulesetVersion !== RULESET_VERSION || save.datasetVersion !== DATASET_VERSION) {
    throw new Error("This save belongs to a different game version.");
  }
  if (typeof save.missionId !== "string" || typeof save.seed !== "number" || !Array.isArray(save.choices)) {
    throw new Error("Invalid mission save.");
  }
  const mission = getMission(save.missionId);
  if (save.choices.length > mission.duration || !save.choices.every((choice) => typeof choice === "string")) {
    throw new Error("Invalid mission history.");
  }
  // Rebuild from actions rather than trusting stored resource totals.
  return save.choices.reduce<GameState>((state, choice) => advanceTurn(state, choice), createGame(save.seed, save.missionId));
}
