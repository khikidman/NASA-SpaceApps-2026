"use client";
import { useMemo } from "react";
import type { GameAction, GameState } from "@/game/types";
import type { InteractionFeedback, MissionTarget } from "@/world/types";
import { getTask } from "@/data/tasks";
import { createOutpost } from "@/world/map";
import { WorldView } from "./world-view";
export function MissionWorld({ game, act, onOpen, feedback, target, onHomeChange }: { game: GameState; act: (action: GameAction) => void; onOpen: (id: string) => void; feedback: InteractionFeedback | null; target: MissionTarget | null; onHomeChange: (inside: boolean) => void }) {
  const world = useMemo(() => createOutpost(game.seed, game.missionId), [game.seed, game.missionId]);
  const presentation = useMemo(() => ({ lowPower: game.resources.power <= 20, lowOxygen: game.resources.oxygen <= 20,
    missionEnded: game.status !== "playing", feedback, objectiveNodeId: target?.nodeId, usedNodeIds: [...game.collectedNodes, ...world.entities.filter((n) => n.interaction.type === "task" &&
      (game.taskProgress[n.interaction.taskId] ?? 0) >= getTask(game.missionId, n.interaction.taskId).steps.length).map((n) => n.id)],
  }), [game.resources.power, game.resources.oxygen, game.status, game.collectedNodes, game.taskProgress, game.missionId, world, feedback, target]);
  return <WorldView key={`${game.seed}-${game.missionId}`} world={world} presentation={presentation} game={game} act={act} onOpen={onOpen} target={target} onHomeChange={onHomeChange} />;
}
