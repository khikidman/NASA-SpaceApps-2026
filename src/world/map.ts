import { compareEntityDepth, entitySilhouette, pointInPolygon, worldToGrid } from "./isometric";
import type { Footprint, GridPosition, Point, WorldEntity, WorldMap, WorldTile } from "./types";
import { inRenderRange } from "./visibility";

const FACILITIES: readonly WorldEntity[] = [
  { id: "hab-01", name: "Home base", kind: "habitat", position: { col: 12, row: 12 }, footprint: { width: 1, height: 1 }, height: 56 },
  { id: "solar-01", name: "West solar array", kind: "solar", position: { col: 10, row: 11 }, footprint: { width: 1, height: 1 }, height: 12 },
  { id: "solar-02", name: "North solar array", kind: "solar", position: { col: 12, row: 9 }, footprint: { width: 1, height: 1 }, height: 12 },
  { id: "solar-03", name: "East solar array", kind: "solar", position: { col: 15, row: 10 }, footprint: { width: 1, height: 1 }, height: 12 },
  { id: "oxygen-01", name: "Oxygen station", kind: "oxygen", position: { col: 14, row: 13 }, footprint: { width: 1, height: 1 }, height: 42 },
  { id: "lab-01", name: "Science lab", kind: "lab", position: { col: 9, row: 14 }, footprint: { width: 1, height: 1 }, height: 34 },
  { id: "shield-01", name: "Storm shelter", kind: "shield", position: { col: 14, row: 16 }, footprint: { width: 1, height: 1 }, height: 26 },
];

export function containsCell(position: GridPosition, origin: GridPosition, footprint: Footprint): boolean {
  return position.col >= origin.col && position.col < origin.col + footprint.width
    && position.row >= origin.row && position.row < origin.row + footprint.height;
}

export function entityAt(world: WorldMap, position: GridPosition): WorldEntity | undefined {
  return world.entities.find((entity) => containsCell(position, entity.position, entity.footprint));
}

export function tileAt(world: WorldMap, position: GridPosition): WorldTile | undefined {
  if (!Number.isInteger(position.col) || !Number.isInteger(position.row)
    || position.col < 0 || position.row < 0 || position.col >= world.width || position.row >= world.height) return undefined;
  return world.tiles[position.row * world.width + position.col];
}

function tileHash(seed: number, col: number, row: number): number {
  let value = (seed ^ Math.imul(col + 1, 374761393) ^ Math.imul(row + 1, 668265263)) >>> 0;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}

/** A separate seed-derived view of the outpost; never consumes mission RNG. */
export function createOutpost(seed: number): WorldMap {
  const width = 24;
  const height = 24;
  const entities = FACILITIES.map((entity) => ({
    ...entity, position: { ...entity.position }, footprint: { ...entity.footprint },
  }));
  const tiles: WorldTile[] = [];
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const hash = tileHash(seed, col, row);
      const protectedArea = col >= 7 && col <= 17 && row >= 7 && row <= 18;
      const occupied = entities.some((entity) => containsCell({ col, row }, entity.position, entity.footprint));
      const path = row === 13 || col === 13;
      const terrain = occupied ? "pad" : path ? "path" : !protectedArea && hash % 7 === 0 ? "rock" : "sand";
      tiles.push({ col, row, terrain, variant: hash % 4 });
    }
  }
  return { id: "mars-outpost-v2", seed, width, height, tiles, entities,
    home: { col: 12, row: 12 }, spawn: { col: 12, row: 13 } };
}

/** Validation boundary for a future placement command; does not mutate the map. */
export function placementIssue(world: WorldMap, position: GridPosition, footprint: Footprint): "outside" | "occupied" | "terrain" | null {
  if (![position.col, position.row, footprint.width, footprint.height].every(Number.isInteger)
    || footprint.width < 1 || footprint.height < 1
    || position.col < 0 || position.row < 0
    || position.col + footprint.width > world.width || position.row + footprint.height > world.height) return "outside";
  for (let row = position.row; row < position.row + footprint.height; row++) {
    for (let col = position.col; col < position.col + footprint.width; col++) {
      if (entityAt(world, { col, row })) return "occupied";
      if (tileAt(world, { col, row })?.terrain !== "sand") return "terrain";
    }
  }
  return null;
}

/** Test visible facility silhouettes front-to-back before the ground plane. */
export function pickWorldPosition(world: WorldMap, point: Point, player?: GridPosition): GridPosition | null {
  const entities = world.entities.filter((entity) => !player || inRenderRange(entity.position, player)).sort(compareEntityDepth);
  for (let index = entities.length - 1; index >= 0; index--) {
    if (pointInPolygon(point, entitySilhouette(entities[index]))) return { ...entities[index].position };
  }
  const grid = worldToGrid(point);
  const position = { col: Math.floor(grid.col), row: Math.floor(grid.row) };
  return tileAt(world, position) && (!player || inRenderRange(position, player)) ? position : null;
}
