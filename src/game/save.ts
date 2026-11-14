import { DATASET_VERSION } from "../data/events";
import { applyAction, createGame, RULESET_VERSION } from "./engine";
import type { GameAction, GameState } from "./types";
export const SAVE_KEY = "space-explorer:journey:v2";
const MAX_ACTIONS = 10000;
export function serializeGame(state: GameState): string {
  return JSON.stringify({ version: 2, rulesetVersion: RULESET_VERSION, datasetVersion: DATASET_VERSION, seed: state.seed, actions: state.actions });
}
export function restoreGame(raw: string): GameState {
  if (raw.length > 1000000) throw new Error("Save is too large.");
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object") throw new Error("Invalid journey save.");
  const save = data as Record<string, unknown>;
  if (save.version !== 2 || save.rulesetVersion !== RULESET_VERSION || save.datasetVersion !== DATASET_VERSION) throw new Error("This save uses different game rules.");
  if (typeof save.seed !== "number" || !Array.isArray(save.actions) || save.actions.length > MAX_ACTIONS) throw new Error("Invalid journey history.");
  // Never trust saved positions, supplies, scores, or unlock flags. Replay validated actions.
  return save.actions.reduce<GameState>((game, action: unknown) => {
    if (!action || typeof action !== "object" || !("type" in action)) throw new Error("Invalid saved action.");
    return applyAction(game, action as GameAction);
  }, createGame(save.seed));
}
