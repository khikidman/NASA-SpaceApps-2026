import { describe, expect, it } from "vitest";
import { compareEntityDepth, entitySilhouette, gridToWorld, pointInPolygon, tileCenter, worldToGrid } from "./isometric";
import { createOutpost, entityAt, pickWorldPosition, placementIssue, tileAt } from "./map";

describe("isometric projection and picking", () => {
  it("round-trips fractional, negative, and large world coordinates", () => {
    for (const col of [-10, -0.5, 0, 0.5, 13.9, 1000]) {
      for (const row of [-10, -0.5, 0, 0.5, 13.9, 1000]) {
        const roundTrip = worldToGrid(gridToWorld({ col, row }));
        expect(roundTrip.col).toBeCloseTo(col, 8);
        expect(roundTrip.row).toBeCloseTo(row, 8);
      }
    }
  });

  it("picks clear tile centers and rejects positions outside every map edge", () => {
    const world = { ...createOutpost(23), entities: [] };
    for (const tile of world.tiles) expect(pickWorldPosition(world, tileCenter(tile))).toEqual({ col: tile.col, row: tile.row });
    for (const position of [{ col: -0.1, row: 2 }, { col: 2, row: -0.1 }, { col: world.width + 0.1, row: 2 }, { col: 2, row: world.height + 0.1 }]) {
      expect(pickWorldPosition(world, gridToWorld(position))).toBeNull();
    }
  });

  it("selects visible rooftops instead of the ground tile behind them", () => {
    const world = createOutpost(1);
    for (const entity of world.entities) {
      const roofCenter = gridToWorld({ col: entity.position.col + entity.footprint.width / 2, row: entity.position.row + entity.footprint.height / 2 });
      roofCenter.y -= entity.height;
      expect(pointInPolygon(roofCenter, entitySilhouette(entity))).toBe(true);
      expect(pickWorldPosition(world, roofCenter)).toEqual(entity.position);
    }
  });

  it("uses the frontmost silhouette for overlapping visible structures", () => {
    const base = createOutpost(1);
    const back = { ...base.entities[0], id: "back", position: { col: 1, row: 1 }, footprint: { width: 1, height: 1 }, height: 50 };
    const front = { ...back, id: "front", position: { col: 2, row: 2 }, height: 90 };
    const world = { ...base, entities: [front, back] };
    const point = { x: 0, y: 65 };
    expect(pointInPolygon(point, entitySilhouette(back))).toBe(true);
    expect(pointInPolygon(point, entitySilhouette(front))).toBe(true);
    expect(pickWorldPosition(world, point)).toEqual(front.position);
    expect([front, back].sort(compareEntityDepth)).toEqual([back, front]);
  });
});

describe("world generation and footprints", () => {
  it("generates a reproducible, complete map without sharing mutable templates", () => {
    const first = createOutpost(124);
    const second = createOutpost(124);
    expect(first).toEqual(second);
    expect(first.tiles).toHaveLength(first.width * first.height);
    expect(createOutpost(125).tiles).not.toEqual(first.tiles);
    first.entities[0].position.col = 0;
    expect(createOutpost(124)).toEqual(second);
  });

  it("resolves every occupied cell, with no overlaps or out-of-bounds facilities", () => {
    const world = createOutpost(1);
    const occupied = new Set<string>();
    for (const entity of world.entities) {
      for (let row = entity.position.row; row < entity.position.row + entity.footprint.height; row++) {
        for (let col = entity.position.col; col < entity.position.col + entity.footprint.width; col++) {
          expect(occupied.has(`${col},${row}`)).toBe(false);
          occupied.add(`${col},${row}`);
          expect(tileAt(world, { col, row })?.terrain).toBe("pad");
          expect(entityAt(world, { col, row })).toBe(entity);
        }
      }
    }
  });

  it("validates whole footprints against edges, obstacles, routes, and occupancy", () => {
    const world = createOutpost(1);
    expect(placementIssue(world, { col: world.width - 1, row: world.height - 1 }, { width: 2, height: 2 })).toBe("outside");
    expect(placementIssue(world, { col: -1, row: 0 }, { width: 1, height: 1 })).toBe("outside");
    expect(placementIssue(world, { col: 0.5, row: 0 }, { width: 1, height: 1 })).toBe("outside");
    expect(placementIssue(world, { col: 0, row: 0 }, { width: 0, height: 1 })).toBe("outside");
    expect(placementIssue(world, { col: world.home.col - 1, row: world.home.row }, { width: 2, height: 1 })).toBe("occupied");
    for (const tile of world.tiles) {
      const result = placementIssue(world, tile, { width: 1, height: 1 });
      expect(result).toBe(entityAt(world, tile) ? "occupied" : tile.terrain === "sand" ? null : "terrain");
    }
  });
});
