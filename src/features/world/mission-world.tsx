"use client";

import { useMemo } from "react";
import type { GameState } from "@/game/types";
import { createOutpost } from "@/world/map";
import { WorldView } from "./world-view";

/** One-way adapter from mission data into a spatial, read-only presentation. */
export function MissionWorld({ game }: { game: GameState }) {
  const world = useMemo(() => createOutpost(game.seed), [game.seed]);
  const presentation = useMemo(() => ({
    lowPower: game.resources.power <= 20,
    lowOxygen: game.resources.oxygen <= 20,
    missionEnded: game.status !== "playing",
  }), [game.resources.power, game.resources.oxygen, game.status]);

  return <WorldView key={game.seed} world={world} presentation={presentation} />;
}
