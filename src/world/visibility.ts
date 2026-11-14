import { footprintPolygon } from "./isometric";
import type { Bounds, GridPosition, WorldMap } from "./types";

export const RENDER_RADIUS = 3;
export const cellKey = (position: GridPosition) => `${position.col},${position.row}`;

/** A Euclidean circle in the square grid, including its boundary and center. */
export function inRenderRange(position: GridPosition, player: GridPosition): boolean {
  return (position.col - player.col) ** 2 + (position.row - player.row) ** 2 <= RENDER_RADIUS ** 2;
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
  const points = visibleTiles(world, player).flatMap((tile) => footprintPolygon(tile));
  return {
    minX: Math.min(...points.map((point) => point.x)),
    maxX: Math.max(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)) - 90,
    maxY: Math.max(...points.map((point) => point.y)) + 18,
  };
}
