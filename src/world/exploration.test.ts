import { describe, expect, it } from "vitest";
import { createExplorer, findVisiblePath, findInteractionPath, interactWithFacility, moveExplorer, restoreExplorer, saveExplorer, walkable } from "./exploration";
import { createOutpost, entityAt, pickWorldPosition } from "./map";
import { gridToWorld, tileCenter } from "./isometric";
import { cellKey, inRenderRange, RENDER_RADIUS, visibleTiles } from "./visibility";

describe("player-centered render distance", () => {
  it("rounds the five-square footprint into broad arcs without isolated axis tips", () => {
    const world = createOutpost(1);
    const player = world.spawn;
    expect(RENDER_RADIUS).toBe(5);
    expect(visibleTiles(world, player)).toHaveLength(97);
    expect(inRenderRange({ col: player.col + 5, row: player.row }, player)).toBe(true);
    expect(inRenderRange({ col: player.col + 3, row: player.row + 4 }, player)).toBe(true);
    expect(inRenderRange({ col: player.col + 4, row: player.row + 3 }, player)).toBe(true);
    expect(inRenderRange({ col: player.col + 4, row: player.row + 4 }, player)).toBe(false);
    expect(inRenderRange({ col: player.col + 5, row: player.row + 2 }, player)).toBe(true);
    expect(inRenderRange({ col: player.col + 5, row: player.row + 3 }, player)).toBe(false);
    expect(inRenderRange({ col: player.col + 6, row: player.row }, player)).toBe(false);
    for (const axis of ["col", "row"] as const) for (const sign of [-1, 1]) {
      const arc = visibleTiles(world, player).filter((tile) => tile[axis] === player[axis] + sign * 5);
      expect(arc).toHaveLength(5);
    }
  });

  it("stays within the circle and world bounds at every square, including corners", () => {
    const world = createOutpost(22);
    for (const player of world.tiles) {
      const tiles = visibleTiles(world, player);
      expect(tiles.length).toBeLessThanOrEqual(97);
      expect(new Set(tiles.map(cellKey)).size).toBe(tiles.length);
      for (const tile of tiles) {
        expect(inRenderRange(tile, player)).toBe(true);
        expect(tile.col).toBeGreaterThanOrEqual(0);
        expect(tile.row).toBeGreaterThanOrEqual(0);
        expect(tile.col).toBeLessThan(world.width);
        expect(tile.row).toBeLessThan(world.height);
      }
    }
    expect(visibleTiles(world, { col: 0, row: 0 })).toHaveLength(30);
  });

  it("never picks hidden ground or hidden facility geometry", () => {
    const world = createOutpost(1);
    const player = { col: 3, row: 3 };
    for (const tile of world.tiles) {
      if (!inRenderRange(tile, player)) {
        const picked = pickWorldPosition(world, tileCenter(tile), player);
        if (picked) expect(inRenderRange(picked, player)).toBe(true);
      }
    }
    const home = world.entities.find((entity) => entity.id === "hab-01")!;
    const roof = gridToWorld({ col: home.position.col + 0.5, row: home.position.row + 0.5 });
    roof.y -= home.height;
    expect(pickWorldPosition(world, roof, player)).toBeNull();
  });

  it("puts exactly one home base on exactly one interactive square", () => {
    const world = createOutpost(1);
    expect(world.entities.filter((entity) => entity.kind === "habitat")).toHaveLength(1);
    expect(entityAt(world, world.home)).toMatchObject({ id: "hab-01", footprint: { width: 1, height: 1 } });
    expect(entityAt(world, world.spawn)).toBeUndefined();
    expect(walkable(world, world.spawn)).toBe(true);
  });
});

describe("exploration commands and persistence", () => {
  it("moves one square without mutating the original state and updates visibility", () => {
    const world = createOutpost(1);
    const before = createExplorer(world);
    const snapshot = structuredClone(before);
    const after = moveExplorer(world, before, { col: 13, row: 13 });
    expect(before).toEqual(snapshot);
    expect(after.position).toEqual({ col: 13, row: 13 });
    expect(after.steps).toBe(1);
    expect(visibleTiles(world, before.position).map(cellKey)).not.toEqual(visibleTiles(world, after.position).map(cellKey));
  });

  it("rejects teleporting, occupied facilities, rocks, and map boundaries", () => {
    const world = createOutpost(1);
    const explorer = createExplorer(world);
    expect(() => moveExplorer(world, explorer, world.home)).toThrow("blocked");
    expect(() => moveExplorer(world, explorer, { col: 15, row: 13 })).toThrow("one square");
    expect(() => moveExplorer(world, { ...explorer, position: { col: 0, row: 0 } }, { col: -1, row: 0 })).toThrow("blocked");
    const rock = world.tiles.find((tile) => tile.terrain === "rock")!;
    expect(walkable(world, rock)).toBe(false);
    expect(() => moveExplorer(world, { ...explorer, position: { col: rock.col - 1, row: rock.row } }, rock)).toThrow("blocked");
  });

  it("finds stepwise routes within visible clear terrain and rejects hidden destinations", () => {
    const world = createOutpost(1);
    const start = world.spawn;
    const target = { col: 12, row: 17 };
    const path = findVisiblePath(world, start, target)!;
    expect(path).toHaveLength(4);
    let explorer = createExplorer(world);
    for (const step of path) {
      expect(inRenderRange(step, start)).toBe(true);
      explorer = moveExplorer(world, explorer, step);
    }
    expect(explorer.position).toEqual(target);
    expect(findVisiblePath(world, start, { col: 12, row: 18 })).toHaveLength(5);
    expect(findVisiblePath(world, start, { col: 12, row: 19 })).toBeNull();
    expect(findVisiblePath(world, start, world.home)).toBeNull();
    expect(findVisiblePath(world, start, start)).toEqual([]);
  });

  it("finds the shortest clear approach to a clicked stop without entering its square", () => {
    const world = createOutpost(1);
    expect(findInteractionPath(world, world.spawn, world.home)).toEqual([]);
    const path = findInteractionPath(world, world.spawn, { col: 9, row: 14 })!;
    expect(path).toHaveLength(3);
    let explorer = createExplorer(world);
    for (const target of path) {
      expect(inRenderRange(target, world.spawn)).toBe(true);
      explorer = moveExplorer(world, explorer, target);
    }
    expect(interactWithFacility(world, explorer, "lab-01").activeFacilityId).toBe("lab-01");
    expect(findInteractionPath(world, { col: 0, row: 0 }, world.home)).toBeNull();
    expect(findInteractionPath(world, world.spawn, world.spawn)).toBeNull();
  });

  it("requires adjacency for interaction, records a visit once, and leaves mission resources separate", () => {
    const world = createOutpost(1);
    const explorer = createExplorer(world);
    const interacted = interactWithFacility(world, explorer, "hab-01");
    expect(interacted.activeFacilityId).toBe("hab-01");
    expect(interacted.visitedFacilities).toEqual(["hab-01"]);
    expect(interacted.position).toEqual(explorer.position);
    expect(explorer.visitedFacilities).toEqual([]);
    expect(interactWithFacility(world, interacted, "hab-01").visitedFacilities).toEqual(["hab-01"]);
    expect(() => interactWithFacility(world, explorer, "shield-01")).toThrow("next to");
    expect(() => interactWithFacility(world, explorer, "fake-id")).toThrow("next to");
  });

  it("restores player position and visits independently of mission saves", () => {
    const world = createOutpost(1);
    const explorer = moveExplorer(world, interactWithFacility(world, createExplorer(world), "hab-01"), { col: 13, row: 13 });
    expect(restoreExplorer(world, saveExplorer(world, explorer))).toEqual(explorer);
    const payload = JSON.parse(saveExplorer(world, explorer));
    for (const changed of [
      { ...payload, version: 2 }, { ...payload, seed: 5 }, { ...payload, worldId: "unknown" },
      { ...payload, position: world.home }, { ...payload, position: { col: -1, row: 0 } },
      { ...payload, position: { col: 0.5, row: 0 } }, { ...payload, steps: -1 },
      { ...payload, visitedFacilities: ["fake-id"] },
    ]) expect(() => restoreExplorer(world, JSON.stringify(changed))).toThrow();
    expect(() => restoreExplorer(world, "null")).toThrow();
    expect(() => restoreExplorer(world, "broken-json")).toThrow();
    expect(() => restoreExplorer(world, "x".repeat(10_001))).toThrow();
  });
});
