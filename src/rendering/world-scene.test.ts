import { describe, expect, it } from "vitest";
import { createOutpost } from "../world/map";
import { tileCenter, gridToWorld } from "../world/isometric";
import { WorldScene } from "./world-scene";

describe("retained local world", () => {
  it("reuses overlapping tile geometry and releases departing tiles after their animation", () => {
    const world = createOutpost(1); const scene = new WorldScene(world, world.spawn);
    const kept = scene.cells.get("12,13")!;
    const leaving = scene.cells.get("12,8")!;
    scene.syncVisible({ col: 12, row: 14 }, 1000, false);
    expect(scene.tileKeys).toHaveLength(81); expect(scene.cells.get("12,13")).toBe(kept);
    expect(leaving.active).toBe(false); expect(leaving.ground.destroyed).toBe(false);
    expect(scene.cells.size).toBeGreaterThan(81);
    scene.update(1100, false);
    expect(leaving.ground.y).toBeGreaterThan(0); expect(leaving.ground.alpha).toBeLessThan(1);
    const entering = scene.cells.get("12,19")!;
    expect(entering.ground.y).toBeGreaterThan(0); expect(entering.ground.alpha).toBeLessThan(1);
    scene.update(1400, false);
    expect(scene.cells.size).toBe(81); expect(leaving.ground.destroyed).toBe(true); expect(entering.ground.y).toBe(0);
    scene.root.destroy({ children: true, context: true });
  });
  it("does not pick fading-out cells and reuses them on a quick reversal", () => {
    const world = createOutpost(1); const scene = new WorldScene(world, world.spawn);
    const old = scene.cells.get("12,8")!;
    scene.syncVisible({ col: 12, row: 14 }, 1000, false); scene.update(1100, false);
    expect(scene.pick(tileCenter({ col: 12, row: 8 }))).not.toEqual({ col: 12, row: 8 });
    const y = old.ground.y, opacity = old.ground.alpha;
    scene.syncVisible(world.spawn, 1100, false);
    expect(scene.cells.get("12,8")).toBe(old); expect(old.ground.y).toBeCloseTo(y); expect(old.ground.alpha).toBeCloseTo(opacity);
    scene.update(1500, false); expect(scene.cells.size).toBe(81); expect(old.ground.alpha).toBe(1);
    scene.root.destroy({ children: true, context: true });
  });
  it("keeps a celebrating building clickable at its animated rooftop", () => {
    const world = createOutpost(1), scene = new WorldScene(world, world.spawn);
    const home = world.entities.find((e) => e.id === "hab-01")!;
    scene.celebrate(home.id, true, 1000); scene.update(1200, false);
    const cell = scene.cells.get("12,12")!;
    const roof = gridToWorld(home.position);
    roof.y += 1 - home.height + cell.object!.y - cell.objectY;
    expect(scene.pick(roof)).toEqual(home.position);
    scene.root.destroy({ children: true, context: true });
  });
  it("settles transitions immediately for reduced motion", () => {
    const world = createOutpost(1); const scene = new WorldScene(world, world.spawn);
    scene.syncVisible({ col: 12, row: 14 }, 1000, true);
    expect(scene.cells.size).toBe(81); expect(scene.outgoingCount).toBe(0);
    for (const cell of scene.cells.values()) { expect(cell.ground.y).toBe(0); expect(cell.ground.alpha).toBe(1); }
    scene.root.destroy({ children: true, context: true });
  });
});
