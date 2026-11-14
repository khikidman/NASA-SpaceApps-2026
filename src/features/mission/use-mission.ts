"use client";

import { useEffect, useReducer } from "react";
import { advanceTurn, createGame } from "@/game/engine";
import { restoreGame, SAVE_KEY, serializeGame } from "@/game/save";
import type { GameState } from "@/game/types";

interface MissionViewState {
  game: GameState;
  ready: boolean;
  notice: string;
  error: string;
}

type Action =
  | { type: "hydrate"; game: GameState; notice: string }
  | { type: "choose"; choiceId: string }
  | { type: "restart"; seed: number }
  | { type: "storage-error" };

function reducer(state: MissionViewState, action: Action): MissionViewState {
  switch (action.type) {
    case "hydrate": return { game: action.game, ready: true, notice: action.notice, error: "" };
    case "restart": return { ...state, game: createGame(action.seed), error: "" };
    case "storage-error": return { ...state, notice: "Saving is unavailable in this browser. You can still play." };
    case "choose": {
      try {
        return { ...state, game: advanceTurn(state.game, action.choiceId), error: "" };
      } catch (error) {
        return { ...state, error: error instanceof Error ? error.message : "That action could not be completed." };
      }
    }
  }
}

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

export function useMission() {
  const [state, dispatch] = useReducer(reducer, {
    game: createGame(1), ready: false, notice: "Saved automatically on this device.", error: "",
  });

  useEffect(() => {
    let game = createGame(randomSeed());
    let notice = "Saved automatically on this device.";
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        try { game = restoreGame(raw); }
        catch { notice = "The previous save could not be restored. A new mission is ready."; }
      }
    } catch {
      notice = "Saving is unavailable in this browser. You can still play.";
    }
    dispatch({ type: "hydrate", game, notice });
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    try { localStorage.setItem(SAVE_KEY, serializeGame(state.game)); }
    catch { dispatch({ type: "storage-error" }); }
  }, [state.game, state.ready]);

  return {
    ...state,
    choose: (choiceId: string) => dispatch({ type: "choose", choiceId }),
    restart: () => dispatch({ type: "restart", seed: randomSeed() }),
    replay: () => dispatch({ type: "restart", seed: state.game.seed }),
  };
}
