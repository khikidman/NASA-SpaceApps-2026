"use client";
import { useEffect, useReducer, useRef } from "react";
import { adjacent, findInteractionPath, findVisiblePath, walkable } from "@/world/exploration";
import { entityAt } from "@/world/map";
import { inRenderRange } from "@/world/visibility";
import type { GridPosition, WorldMap } from "@/world/types";
import type { GameAction, GameState } from "@/game/types";
interface View { selected: GridPosition; route: readonly GridPosition[]; queued: GridPosition | null; pending: boolean; notice: string }
export function useExplorer(world: WorldMap, game: GameState, act: (action: GameAction) => void, onOpen: (id: string) => void) {
  const [view, update] = useReducer((state: View, patch: Partial<View>) => ({ ...state, ...patch }), {
    selected: game.position, route: [], queued: null, pending: false, notice: "",
  });
  const pending = useRef<GridPosition | null>(null);
  const { position } = game;
  function startStep(target: GridPosition, route: readonly GridPosition[]) {
    if (pending.current || game.status !== "playing") return;
    if (!adjacent(position, target) || !walkable(world, target)) { update({ route: [], queued: null, notice: "Find a clear path around the rocks." }); return; }
    pending.current = target;
    update({ route, queued: null, pending: true, notice: "" });
    act({ type: "move", position: target });
  }
  useEffect(() => {
    if (pending.current || game.status !== "playing" || (!view.route.length && !view.queued)) return;
    // The visual completion callback drives the next step. No repeating React movement timer.
    const timer = setTimeout(() => {
      const target = view.queued ? { col: position.col + view.queued.col, row: position.row + view.queued.row } : view.route[0];
      if (!target || pending.current) return;
      if (!adjacent(position, target) || !walkable(world, target)) { update({ route: [], queued: null, notice: "That square is blocked. Try another direction." }); return; }
      pending.current = target;
      update({ route: view.queued ? [] : view.route.slice(1), queued: null, pending: true, notice: "", ...(view.queued ? { selected: target } : {}) });
      act({ type: "move", position: target });
    }, 0);
    return () => clearTimeout(timer);
  }, [view.route, view.queued, view.pending, position, world, game.status, act]);
  function complete(at: GridPosition) {
    if (pending.current?.col !== at.col || pending.current?.row !== at.row) return;
    pending.current = null; update({ pending: false });
  }
  function select(target: GridPosition) {
    if (game.status !== "playing" || !inRenderRange(target, position)) return;
    const node = entityAt(world, target);
    const route = node ? findInteractionPath(world, position, target) : findVisiblePath(world, position, target);
    update({ selected: target, route: route ?? [], queued: null,
      notice: route ? "" : "Find a clear path around the rocks." });
  }
  function move(direction: GridPosition) {
    if (game.status !== "playing") return;
    if (pending.current) { update({ route: [], queued: direction, notice: "" }); return; }
    const target = { col: position.col + direction.col, row: position.row + direction.row };
    update({ route: [], queued: null, selected: target });
    if (!walkable(world, target)) { update({ selected: position, notice: "That square is blocked. Try another direction." }); return; }
    startStep(target, []);
  }
  function interact() {
    if (game.status !== "playing" || pending.current) return;
    const selected = entityAt(world, view.selected);
    const node = selected && adjacent(position, selected.position) ? selected : world.entities.find((n) => adjacent(position, n.position));
    if (!node) { update({ notice: "Walk beside a stop to use it." }); return; }
    update({ selected: node.position, route: [], queued: null, notice: "" }); onOpen(node.id);
  }
  return { ...view, selected: inRenderRange(view.selected, position) ? view.selected : position,
    explorer: { position, steps: game.steps, visitedFacilities: [...game.collectedNodes, ...Object.keys(game.taskProgress)], activeFacilityId: null },
    ready: true, move, select, interact, complete };
}
