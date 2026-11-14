"use client";

import { useEffect, useReducer } from "react";
import { adjacent, createExplorer, findVisiblePath, interactWithFacility, moveExplorer, restoreExplorer, saveExplorer } from "@/world/exploration";
import { entityAt } from "@/world/map";
import { inRenderRange } from "@/world/visibility";
import type { ExplorerState, GridPosition, WorldMap } from "@/world/types";

interface Session {
  explorer: ExplorerState;
  selected: GridPosition;
  route: readonly GridPosition[];
  ready: boolean;
  notice: string;
}
type Action =
  | { type: "hydrate"; explorer: ExplorerState; notice: string }
  | { type: "move"; direction: GridPosition }
  | { type: "select"; position: GridPosition }
  | { type: "step" }
  | { type: "interact" }
  | { type: "dismiss" }
  | { type: "storage-error" };

function reduce(world: WorldMap, state: Session, action: Action): Session {
  try {
    switch (action.type) {
      case "hydrate": return { ...state, explorer: action.explorer, selected: action.explorer.position, ready: true, notice: action.notice };
      case "storage-error": return { ...state, notice: "Exploration progress cannot be saved in this browser." };
      case "dismiss": return { ...state, explorer: { ...state.explorer, activeFacilityId: null } };
      case "move": {
        const position = { col: state.explorer.position.col + action.direction.col, row: state.explorer.position.row + action.direction.row };
        const explorer = moveExplorer(world, state.explorer, position);
        return { ...state, explorer, selected: position, route: [], notice: "" };
      }
      case "select": {
        if (!inRenderRange(action.position, state.explorer.position)) return state;
        if (entityAt(world, action.position)) return { ...state, selected: action.position, route: [], notice: "" };
        const route = findVisiblePath(world, state.explorer.position, action.position);
        return { ...state, selected: action.position, route: route ?? [], notice: route ? "" : "There is no clear route to that square." };
      }
      case "step": {
        if (!state.route.length) return state;
        const explorer = moveExplorer(world, state.explorer, state.route[0]);
        return { ...state, explorer, route: state.route.slice(1),
          selected: inRenderRange(state.selected, explorer.position) ? state.selected : explorer.position };
      }
      case "interact": {
        const selectedEntity = entityAt(world, state.selected);
        const entity = selectedEntity && adjacent(state.explorer.position, selectedEntity.position)
          ? selectedEntity : world.entities.find((entry) => adjacent(state.explorer.position, entry.position));
        if (!entity) return { ...state, notice: "Move next to a facility to use it." };
        return { ...state, selected: entity.position,
          explorer: interactWithFacility(world, state.explorer, entity.id), route: [], notice: "" };
      }
    }
  } catch (error) {
    return { ...state, route: [], notice: error instanceof Error ? error.message : "That move is unavailable." };
  }
}

export function useExplorer(world: WorldMap) {
  const [state, dispatch] = useReducer((session: Session, action: Action) => reduce(world, session, action), {
    explorer: createExplorer(world), selected: world.spawn, route: [], ready: false, notice: "",
  });
  const storageKey = `junior-astronaut:explorer:${world.id}:${world.seed}`;

  useEffect(() => {
    let explorer = createExplorer(world);
    let notice = "";
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        try { explorer = restoreExplorer(world, raw); }
        catch { notice = "Your exploration save was reset. You are beside home base."; }
      }
    } catch { notice = "Exploration progress cannot be saved in this browser."; }
    dispatch({ type: "hydrate", explorer, notice });
  }, [world, storageKey]);

  useEffect(() => {
    if (!state.ready) return;
    try { localStorage.setItem(storageKey, saveExplorer(world, state.explorer)); }
    catch { dispatch({ type: "storage-error" }); }
  }, [world, storageKey, state.explorer, state.ready]);

  useEffect(() => {
    if (!state.ready || !state.route.length) return;
    const timer = setTimeout(() => dispatch({ type: "step" }), 150);
    return () => clearTimeout(timer);
  }, [state.ready, state.route]);

  return { ...state,
    move: (direction: GridPosition) => dispatch({ type: "move", direction }),
    select: (position: GridPosition) => dispatch({ type: "select", position }),
    interact: () => dispatch({ type: "interact" }),
    dismiss: () => dispatch({ type: "dismiss" }),
  };
}
