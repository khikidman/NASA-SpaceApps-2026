import { entityAt, tileAt } from "./map";
import { cellKey, inRenderRange } from "./visibility";
import type { ExplorerState, GridPosition, WorldMap } from "./types";
import { atHomeDoor, homeDoorPosition } from "./home";

export const DIRECTIONS: Readonly<Record<string, GridPosition>> = {
  north: { col: 0, row: -1 }, east: { col: 1, row: 0 },
  south: { col: 0, row: 1 }, west: { col: -1, row: 0 },
};
export const gridDistance = (a: GridPosition, b: GridPosition) => Math.hypot(a.col - b.col, a.row - b.row);
export const adjacent = (a: GridPosition, b: GridPosition) => Math.abs(a.col - b.col) + Math.abs(a.row - b.row) === 1;

export function walkable(world: WorldMap, position: GridPosition): boolean {
  const tile = tileAt(world, position);
  return !!tile && tile.terrain !== "rock" && !entityAt(world, position);
}

export function createExplorer(world: WorldMap): ExplorerState {
  return { position: { ...world.spawn }, steps: 0, visitedFacilities: [], activeFacilityId: null };
}

export function moveExplorer(world: WorldMap, state: ExplorerState, target: GridPosition): ExplorerState {
  if (!adjacent(state.position, target)) throw new Error("Move one square at a time.");
  if (!walkable(world, target)) throw new Error("That square is blocked. Choose a clear square.");
  return { ...state, position: { ...target }, steps: state.steps + 1, activeFacilityId: null };
}

/** Route only through the currently visible circle; do not navigate unseen cells. */
export function findVisiblePath(world: WorldMap, start: GridPosition, target: GridPosition): GridPosition[] | null {
  return pathToAny(world, start, [target]);
}

/** One bounded BFS chooses the shortest visible approach to an occupied stop. */
export function findInteractionPath(world: WorldMap, start: GridPosition, target: GridPosition): GridPosition[] | null {
  const entity = entityAt(world, target);
  if (!entity || !inRenderRange(target, start)) return null;
  if (entity.interaction.type === "base") return pathToAny(world, start, [homeDoorPosition(world.home)]);
  return pathToAny(world, start, Object.values(DIRECTIONS).map((d) => ({ col: target.col + d.col, row: target.row + d.row })));
}

function pathToAny(world: WorldMap, start: GridPosition, targets: readonly GridPosition[]): GridPosition[] | null {
  if (!walkable(world, start)) return null;
  const goals = new Set(targets.filter((p) => walkable(world, p) && inRenderRange(p, start)).map(cellKey));
  if (!goals.size) return null;
  const queue: GridPosition[] = [start];
  const parents = new Map<string, GridPosition | null>([[cellKey(start), null]]);
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    if (goals.has(cellKey(current))) {
      const path: GridPosition[] = [];
      let step = current;
      while (parents.get(cellKey(step))) { path.push(step); step = parents.get(cellKey(step))!; }
      return path.reverse();
    }
    for (const direction of Object.values(DIRECTIONS)) {
      const next = { col: current.col + direction.col, row: current.row + direction.row };
      if (!parents.has(cellKey(next)) && inRenderRange(next, start) && walkable(world, next)) {
        parents.set(cellKey(next), current); queue.push(next);
      }
    }
  }
  return null;
}

export function interactWithFacility(world: WorldMap, state: ExplorerState, id: string): ExplorerState {
  const facility = world.entities.find((entity) => entity.id === id);
  if (!facility || !(facility.interaction.type === "base" ? atHomeDoor(state.position, world.home)
    : inRenderRange(facility.position, state.position) && adjacent(facility.position, state.position))) {
    throw new Error("Stand next to the facility to interact.");
  }
  return { ...state, activeFacilityId: id,
    visitedFacilities: state.visitedFacilities.includes(id) ? state.visitedFacilities : [...state.visitedFacilities, id] };
}

export function saveExplorer(world: WorldMap, explorer: ExplorerState): string {
  return JSON.stringify({ version: 1, worldId: world.id, seed: world.seed,
    position: explorer.position, steps: explorer.steps, visitedFacilities: explorer.visitedFacilities });
}

export function restoreExplorer(world: WorldMap, raw: string): ExplorerState {
  if (raw.length > 10_000) throw new Error("Invalid exploration save.");
  const data = JSON.parse(raw) as Record<string, unknown> | null;
  if (!data || data.version !== 1 || data.worldId !== world.id || data.seed !== world.seed
    || !data.position || typeof data.position !== "object") throw new Error("Incompatible exploration save.");
  const position = data.position as GridPosition;
  if (!walkable(world, position) || !Number.isSafeInteger(data.steps) || (data.steps as number) < 0
    || !Array.isArray(data.visitedFacilities) || data.visitedFacilities.length > world.entities.length
    || !data.visitedFacilities.every((id) => typeof id === "string" && world.entities.some((entity) => entity.id === id))) {
    throw new Error("Invalid exploration save.");
  }
  return { position: { col: position.col, row: position.row }, steps: data.steps as number,
    visitedFacilities: [...new Set(data.visitedFacilities as string[])], activeFacilityId: null };
}
