"use client";
import { useEffect, useReducer } from "react";
import { applyAction, createGame } from "@/game/engine";
import { restoreGame, SAVE_KEY, serializeGame } from "@/game/save";
import { RESOURCE_KEYS } from "@/game/types";
import type { InteractionFeedback } from "@/world/types";
import type { GameAction, GameState } from "@/game/types";
interface ViewState { game: GameState; ready: boolean; notice: string; error: string; feedback: InteractionFeedback | null }
type Action = { type: "hydrate"; game: GameState; notice: string } | { type: "act"; action: GameAction } | { type: "restart"; seed: number } | { type: "storage-error" } | { type: "clear-error" };
function reducer(state: ViewState, action: Action): ViewState {
  switch (action.type) {
    case "hydrate": return { game: action.game, ready: true, notice: action.notice, error: "", feedback: null };
    case "restart": return { ...state, game: createGame(action.seed), error: "", feedback: null };
    case "storage-error": return { ...state, notice: "Saving is not available here. You can still play." };
    case "clear-error": return { ...state, error: "" };
    case "act": {
      const id = (state.feedback?.id ?? 0) + 1;
      const nodeId = "nodeId" in action.action ? action.action.nodeId : undefined;
      try {
        const game = applyAction(state.game, action.action);
        const feedback = action.action.type === "move" ? state.feedback : {
          id, nodeId, success: true, kind: action.action.type, message: action.action.type === "submit" ? "Nice!" : action.action.type === "collect" ? "Collected!" : action.action.type === "end-day" ? "New day!" : "Ready!",
          effects: Object.fromEntries(RESOURCE_KEYS.map((key) => [key, game.resources[key] - state.game.resources[key]])),
        };
        return { ...state, game, error: "", feedback };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Try another plan.";
        return { ...state, error: message, feedback: { id, nodeId, success: false, kind: action.action.type, message: "Try again", effects: {} } };
      }
    }
  }
}
const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
export function useMission() {
  const [state, dispatch] = useReducer(reducer, { game: createGame(1), ready: false, notice: "Your adventure saves on this device.", error: "", feedback: null });
  useEffect(() => {
    let game = createGame(randomSeed());
    let notice = "Your adventure saves on this device.";
    try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { try { game = restoreGame(raw); } catch { notice = "That save could not open. A fresh Moon trip is ready."; } } }
    catch { notice = "Saving is not available here. You can still play."; }
    dispatch({ type: "hydrate", game, notice });
  }, []);
  useEffect(() => {
    if (!state.ready) return;
    try { localStorage.setItem(SAVE_KEY, serializeGame(state.game)); } catch { dispatch({ type: "storage-error" }); }
  }, [state.game, state.ready]);
  return { ...state, act: (action: GameAction) => dispatch({ type: "act", action }),
    clearError: () => dispatch({ type: "clear-error" }), restart: () => dispatch({ type: "restart", seed: randomSeed() }) };
}
