import type { GridPosition } from "./types";

export const HOME_SIZE = 5;
/** Prefab bounds only. Each of the nine constituent objects occupies one tile. */
export const HOME_BASE_FOOTPRINT = { width: 3, height: 3 } as const;
/** The southwest door occupies the center bay of the three-tile-wide front wall. */
export const HOME_BASE_DOOR_OFFSET = { col: 1, row: 2 } as const;
export const homeBuildingPosition = (home: GridPosition): GridPosition => ({
  col: home.col - HOME_BASE_DOOR_OFFSET.col, row: home.row - HOME_BASE_DOOR_OFFSET.row,
});
/** One full square attached to the front edge of the 5×5 room. */
export const HOME_AIRLOCK = { col: 2, row: HOME_SIZE } as const;
export const HOME_EXIT = HOME_AIRLOCK;
/** Only stepping beyond the airlock's outer door leaves home. */
export const HOME_DOORWAY = { col: HOME_AIRLOCK.col, row: HOME_AIRLOCK.row + 1 } as const;
export const HOME_ENTRY = HOME_AIRLOCK;
export const HOME_THRESHOLD = HOME_DOORWAY;
export const isHomeDoorway = (p: GridPosition) => p.col === HOME_DOORWAY.col && p.row === HOME_DOORWAY.row;
export const HOME_TRANSITION_MS = 2200;
export const homeDoorPosition = (home: GridPosition): GridPosition => ({ col: home.col, row: home.row + 1 });
export const atHomeDoor = (position: GridPosition, home: GridPosition) => position.col === home.col && position.row === home.row + 1;
export const isHomeExit = (p: GridPosition) => p.col === HOME_EXIT.col && p.row === HOME_EXIT.row;
export const insideHome = (p: GridPosition) => Number.isInteger(p.col) && Number.isInteger(p.row)
  && ((p.col >= 0 && p.row >= 0 && p.col < HOME_SIZE && p.row < HOME_SIZE) || isHomeExit(p));

/** Every floor tile is ordinary ground. Only the doorway permits an outside step. */
export function homePath(from: GridPosition, to: GridPosition): GridPosition[] | null {
  if (insideHome(from) && isHomeDoorway(to)) {
    const path = homePath(from, HOME_EXIT);
    return path ? [...path, { ...HOME_DOORWAY }] : null;
  }
  if (!insideHome(from) || !insideHome(to)) return null;
  const key = (p: GridPosition) => `${p.col},${p.row}`;
  const queue = [{ ...from }], parents = new Map<string, GridPosition | null>([[key(from), null]]);
  for (const at of queue) {
    if (at.col === to.col && at.row === to.row) {
      const path = []; let step = at;
      while (parents.get(key(step))) { path.push(step); step = parents.get(key(step))!; }
      return path.reverse();
    }
    for (const d of [{ col: 1, row: 0 }, { col: -1, row: 0 }, { col: 0, row: 1 }, { col: 0, row: -1 }]) {
      const next = { col: at.col + d.col, row: at.row + d.row };
      if (!insideHome(next) || parents.has(key(next))) continue;
      parents.set(key(next), at); queue.push(next);
    }
  }
  return null;
}
