import { footprintPolygon } from "./isometric";
import type { Bounds, GridPosition, WorldMap } from "./types";

export const RENDER_RADIUS = 5;
// Sample tile centers against the outside of the fifth tile band. This gives
// each axis a five-tile arc instead of a single tile at the tip of a cross.
const FOOTPRINT_RADIUS = RENDER_RADIUS + 0.5;
export const MOON_RIM_DROPS = [0, 8, 22] as const;
export const cellKey = (position: GridPosition) => `${position.col},${position.row}`;

/** A rounded five-tile footprint, shared by rendering, paths, and guidance. */
export function inRenderRange(position: GridPosition, player: GridPosition): boolean {
  return (position.col - player.col) ** 2 + (position.row - player.row) ** 2 < FOOTPRINT_RADIUS ** 2;
}

/** Projected visual depth only; logical terrain and movement remain level. */
export function surfaceDrop(world: Pick<WorldMap, "levelId">, position: GridPosition, player: GridPosition): number {
  if (world.levelId !== "moon") return 0;
  const distance = Math.hypot(position.col - player.col, position.row - player.row);
  return distance > RENDER_RADIUS - 0.5 ? MOON_RIM_DROPS[2]
    : distance > RENDER_RADIUS - 1.5 ? MOON_RIM_DROPS[1] : MOON_RIM_DROPS[0];
}

export function visibleTiles(world: WorldMap, player: GridPosition) {
  const tiles = [];
  for (let row = Math.max(0, player.row - RENDER_RADIUS); row <= Math.min(world.height - 1, player.row + RENDER_RADIUS); row++) {
    for (let col = Math.max(0, player.col - RENDER_RADIUS); col <= Math.min(world.width - 1, player.col + RENDER_RADIUS); col++) {
      if (inRenderRange({ col, row }, player)) tiles.push(world.tiles[row * world.width + col]);
    }
  }
  return tiles;
}

export function nearbyBounds(world: WorldMap, player: GridPosition): Bounds {
  const points = visibleTiles(world, player).flatMap((tile) => footprintPolygon(tile)
    .map((point) => ({ x: point.x, y: point.y + surfaceDrop(world, tile, player) })));
  return {
    minX: Math.min(...points.map((point) => point.x)),
    maxX: Math.max(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)) - 90,
    maxY: Math.max(...points.map((point) => point.y)) + 18,
  };
}
