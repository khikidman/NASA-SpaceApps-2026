import type { Bounds, GridPosition, Point, WorldEntity } from "./types";

export const TILE_WIDTH = 96;
export const TILE_HEIGHT = 48;

/** Grid positions refer to tile corners; use +0.5 in each axis for a tile center. */
export function gridToWorld(position: GridPosition): Point {
  return {
    x: (position.col - position.row) * TILE_WIDTH / 2,
    y: (position.col + position.row) * TILE_HEIGHT / 2,
  };
}

export function worldToGrid(point: Point): GridPosition {
  return {
    col: point.x / TILE_WIDTH + point.y / TILE_HEIGHT,
    row: point.y / TILE_HEIGHT - point.x / TILE_WIDTH,
  };
}

export function tileCenter(position: GridPosition): Point {
  return gridToWorld({ col: position.col + 0.5, row: position.row + 0.5 });
}

export function footprintPolygon(position: GridPosition, width = 1, height = 1): Point[] {
  return [
    gridToWorld(position),
    gridToWorld({ col: position.col + width, row: position.row }),
    gridToWorld({ col: position.col + width, row: position.row + height }),
    gridToWorld({ col: position.col, row: position.row + height }),
  ];
}

export function worldBounds(width: number, height: number): Bounds {
  const points = footprintPolygon({ col: 0, row: 0 }, width, height);
  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: -100,
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)) + 20,
  };
}

/** Stable painter order for non-interleaving, footprint-contained placeholders. */
export function compareEntityDepth(left: WorldEntity, right: WorldEntity): number {
  const depth = (entity: WorldEntity) => entity.position.col + entity.footprint.width
    + entity.position.row + entity.footprint.height;
  return depth(left) - depth(right)
    || left.position.col - right.position.col
    || left.id.localeCompare(right.id);
}

/** Convex silhouette of the same extruded footprint used by the renderer. */
export function entitySilhouette(entity: WorldEntity): Point[] {
  const [back, right, front, left] = footprintPolygon(entity.position, entity.footprint.width, entity.footprint.height);
  return [
    { x: back.x, y: back.y - entity.height },
    { x: right.x, y: right.y - entity.height },
    right, front, left,
    { x: left.x, y: left.y - entity.height },
  ];
}

export function pointInPolygon(point: Point, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[j];
    const b = polygon[i];
    const cross = (point.x - a.x) * (b.y - a.y) - (point.y - a.y) * (b.x - a.x);
    if (Math.abs(cross) < 1e-7
      && point.x >= Math.min(a.x, b.x) && point.x <= Math.max(a.x, b.x)
      && point.y >= Math.min(a.y, b.y) && point.y <= Math.max(a.y, b.y)) return true;
    if ((a.y > point.y) !== (b.y > point.y)
      && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
