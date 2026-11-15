"use client";
import { useEffect, useReducer, useRef } from "react";
import { adjacent, findInteractionPath, findVisiblePath, walkable } from "@/world/exploration";
import { entityAt } from "@/world/map";
import { inRenderRange } from "@/world/visibility";
import type { GridPosition, WorldMap } from "@/world/types";
import type { GameAction, GameState } from "@/game/types";
import { atHomeDoor, homeDoorPosition } from "@/world/home";
interface View { selected: GridPosition; route: readonly GridPosition[]; queued: GridPosition | null; pending: boolean; notice: string }
export function useExplorer(world: WorldMap, game: GameState, act: (action: GameAction) => void, onOpen: (id: string) => void) {
  const [view, update] = useReducer((state: View, patch: Partial<View>) => ({ ...state, ...patch }), {
    selected: game.position, route: [], queued: null, pending: false, notice: "",
  });
  const pending = useRef<GridPosition | null>(null);
  const autoHome = useRef<string | null>(null);
  const opening = useRef(onOpen);
  useEffect(() => { opening.current = onOpen; });
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
      const node = entityAt(world, target);
      if (node?.interaction.type === "base" && adjacent(position, target)) {
        const approach = findVisiblePath(world, position, homeDoorPosition(world.home));
        autoHome.current = approach ? node.id : null;
        update({ selected: node.position, route: approach ?? [], queued: null, notice: approach ? "" : "Find a clear path to the door." });
        if (approach?.length === 0) { autoHome.current = null; opening.current(node.id); }
        return;
      }
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
    if (autoHome.current && !view.route.length && !view.queued) {
      const node = world.entities.find((n) => n.id === autoHome.current);
      autoHome.current = null;
      if (node && atHomeDoor(at, world.home)) onOpen(node.id);
      else if (node) select(node.position);
    }
  }
  function select(target: GridPosition) {
    if (game.status !== "playing" || !inRenderRange(target, position)) return;
    const node = entityAt(world, target);
    const route = node?.interaction.type === "base"
      ? findVisiblePath(world, position, homeDoorPosition(world.home))
      : node ? findInteractionPath(world, position, target) : findVisiblePath(world, position, target);
    autoHome.current = node?.interaction.type === "base" && route ? node.id : null;
    update({ selected: target, route: route ?? [], queued: null,
      notice: route ? "" : "Find a clear path around the rocks." });
    if (autoHome.current && !route?.length && !pending.current && atHomeDoor(position, world.home)) { autoHome.current = null; onOpen(node!.id); }
  }
  function move(direction: GridPosition) {
    if (game.status !== "playing") return;
    autoHome.current = null;
    if (pending.current) { update({ route: [], queued: direction, notice: "" }); return; }
    const target = { col: position.col + direction.col, row: position.row + direction.row };
    update({ route: [], queued: null, selected: target });
    const node = entityAt(world, target);
    if (node?.interaction.type === "base") { select(target); return; }
    if (!walkable(world, target)) { update({ selected: position, notice: "That square is blocked. Try another direction." }); return; }
    startStep(target, []);
  }
  function interact() {
    if (game.status !== "playing" || pending.current) return;
    const selected = entityAt(world, view.selected);
    const nearby = (node: WorldMap["entities"][number]) => node.interaction.type === "base" ? atHomeDoor(position, world.home) : adjacent(position, node.position);
    const node = selected && nearby(selected) ? selected : world.entities.find(nearby);
    if (!node) { update({ notice: "Walk beside a stop to use it." }); return; }
    autoHome.current = null;
    if (node.interaction.type === "base") { select(node.position); return; }
    update({ selected: node.position, route: [], queued: null, notice: "" }); onOpen(node.id);
  }
  return { ...view, selected: inRenderRange(view.selected, position) ? view.selected : position,
    explorer: { position, steps: game.steps, visitedFacilities: [...game.collectedNodes, ...Object.keys(game.taskProgress)], activeFacilityId: null },
    ready: true, move, select, interact, complete };
}
