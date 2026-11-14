import { describe, expect, it } from "vitest";
import { createOutpost } from "../world/map";
import { tileCenter, gridToWorld } from "../world/isometric";
import { WorldScene } from "./world-scene";
import { SOLID_RADIUS, surfaceDrop, surfaceOpacity } from "../world/visibility";

describe("retained local world", () => {
  it("reuses overlapping tile geometry and releases departing tiles after their animation", () => {
    const world = createOutpost(1); const scene = new WorldScene(world, world.spawn);
    const kept = scene.cells.get("12,13")!;
    const leaving = scene.cells.get("12,8")!;
    scene.syncVisible({ col: 12, row: 14 }, 1000, false);
    expect(scene.tileKeys).toHaveLength(97); expect(scene.cells.get("12,13")).toBe(kept);
    expect(leaving.active).toBe(false); expect(leaving.ground.destroyed).toBe(false);
    expect(scene.cells.size).toBeGreaterThan(97);
    scene.update(1100, false);
    expect(leaving.ground.y).toBeGreaterThan(0); expect(leaving.ground.alpha).toBeLessThan(1);
    const entering = scene.cells.get("12,19")!;
    expect(entering.ground.y).toBeGreaterThan(34); expect(entering.ground.alpha).toBeLessThan(surfaceOpacity(world, entering.tile, { col: 12, row: 14 }));
    scene.update(1400, false);
    expect(scene.cells.size).toBe(97); expect(leaving.ground.destroyed).toBe(true); expect(entering.ground.y).toBe(34);
    expect(entering.ground.alpha).toBeCloseTo(surfaceOpacity(world, entering.tile, { col: 12, row: 14 }));
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
    scene.update(1500, false); expect(scene.cells.size).toBe(97); expect(old.ground.alpha).toBeCloseTo(surfaceOpacity(world, old.tile, world.spawn));
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
    expect(scene.cells.size).toBe(97); expect(scene.outgoingCount).toBe(0);
    for (const cell of scene.cells.values()) { expect(cell.ground.y).toBe(surfaceDrop(world, cell.tile, { col: 12, row: 14 })); expect(cell.ground.alpha).toBeCloseTo(surfaceOpacity(world, cell.tile, { col: 12, row: 14 })); }
    scene.root.destroy({ children: true, context: true });
  });
  it("lowers four Moon rings around a solid center and keeps Mars level", () => {
    for (const level of ["moon", "mars"] as const) {
      const world = createOutpost(1, level), scene = new WorldScene(world, world.spawn);
      const heights = [...scene.cells.values()].map((cell) => cell.ground.y);
      if (level === "moon") {
        expect(heights.filter((y) => y === 0)).toHaveLength(9);
        expect(heights.filter((y) => y === 4)).toHaveLength(12);
        expect(heights.filter((y) => y === 10)).toHaveLength(16);
        expect(heights.filter((y) => y === 20)).toHaveLength(32);
        expect(heights.filter((y) => y === 34)).toHaveLength(28);
      } else { expect(heights.every((y) => y === 0)).toBe(true); expect([...scene.cells.values()].every((cell) => cell.ground.alpha === 1)).toBe(true); }
      expect(scene.cells.get("12,13")!.offset).toBe(0);
      scene.root.destroy({ children: true, context: true });
    }
  });
  it("eases retained rim tiles without snapping on a quick reversal", () => {
    const world = createOutpost(1), scene = new WorldScene(world, world.spawn);
    const cell = scene.cells.get("12,9")!;
    expect(cell.offset).toBe(20);
    const startingOpacity = cell.ground.alpha;
    scene.syncVisible({ col: 12, row: 14 }, 1000, false);
    expect(cell.offset).toBe(20); expect(cell.ground.alpha).toBe(startingOpacity);
    scene.update(1120, false);
    expect(cell.offset).toBeGreaterThan(20); expect(cell.offset).toBeLessThan(34);
    expect(cell.ground.alpha).toBeLessThan(startingOpacity);
    const height = cell.offset, opacity = cell.ground.alpha;
    scene.syncVisible(world.spawn, 1120, false);
    expect(cell.offset).toBe(height); expect(cell.ground.alpha).toBe(opacity);
    scene.shiftTime(500);
    scene.update(1620, false); expect(cell.offset).toBe(height); expect(cell.ground.alpha).toBe(opacity);
    scene.update(2000, false); expect(cell.offset).toBe(20); expect(cell.ground.alpha).toBeCloseTo(startingOpacity);
    scene.root.destroy({ children: true, context: true });
  });
  it("keeps lowered ground, buildings, hover, and selection at the same surface height", () => {
    const world = createOutpost(1), player = { col: 12, row: 17 };
    const scene = new WorldScene(world, player), home = scene.cells.get("12,12")!;
    expect(home.offset).toBe(34);
    expect(home.object!.y - home.objectY).toBe(34);
    expect(home.object!.alpha).toBe(home.ground.alpha);
    scene.setPresentation({ lowPower: true, lowOxygen: false, missionEnded: false });
    expect(home.object!.alpha).toBe(home.ground.alpha);
    const roof = gridToWorld(home.tile); roof.y += 1 - home.entity!.height + home.offset;
    expect(scene.pick(roof)).toEqual(home.entity!.position);
    const ground = scene.cells.get("12,22")!, center = tileCenter(ground.tile);
    center.y += ground.offset;
    expect(scene.pick(center)).toEqual({ col: 12, row: 22 });
    scene.setHover(ground.tile); expect(scene.hover.y).toBe(34); expect(scene.hover.alpha).toBe(ground.ground.alpha);
    scene.setSelection(ground.tile, 100, false); scene.update(100, false);
    const selection = scene.root.children[3];
    expect(selection.y).toBe(center.y);
    expect(selection.alpha).toBe(ground.ground.alpha);
    scene.root.destroy({ children: true, context: true });
  });
  it("fades outward smoothly and symmetrically while keeping rim tiles visible and clickable", () => {
    const world = createOutpost(1), scene = new WorldScene(world, world.spawn);
    const sorted = [...scene.cells.values()].sort((a, b) => Math.hypot(a.tile.col - 12, a.tile.row - 13) - Math.hypot(b.tile.col - 12, b.tile.row - 13));
    expect(sorted[0].ground.alpha).toBe(1);
    expect(SOLID_RADIUS).toBe(4);
    expect(sorted.filter((cell) => cell.ground.alpha === 1)).toHaveLength(49);
    for (const cell of sorted) if (Math.hypot(cell.tile.col - 12, cell.tile.row - 13) <= 4) expect(cell.ground.alpha).toBe(1);
    expect(sorted.at(-1)!.ground.alpha).toBeGreaterThanOrEqual(0.25);
    expect(sorted.at(-1)!.ground.alpha).toBeLessThan(0.3);
    for (let i = 1; i < sorted.length; i++) expect(sorted[i].ground.alpha).toBeLessThanOrEqual(sorted[i - 1].ground.alpha);
    expect(scene.cells.get("7,13")!.ground.alpha).toBe(scene.cells.get("17,13")!.ground.alpha);
    scene.root.destroy({ children: true, context: true });
  });
  it("accepts a different solid radius without mutating the default or enabling automatic changes", () => {
    const world = createOutpost(1), position = { col: 12, row: 16 };
    expect(surfaceOpacity(world, position, world.spawn)).toBe(1);
    expect(surfaceOpacity(world, position, world.spawn, 2)).toBeLessThan(1);
    expect(surfaceOpacity(world, position, world.spawn)).toBe(1);
    expect(surfaceOpacity(world, { col: 12, row: 18 }, world.spawn, 5.5)).toBe(1);
    expect(() => surfaceOpacity(world, position, world.spawn, NaN)).toThrow();
    expect(() => surfaceOpacity(world, position, world.spawn, -1)).toThrow();
  });
  it("culls off-screen ground and objects, excludes them from picking, and reuses them when panning back", () => {
    const world = createOutpost(1), scene = new WorldScene(world, world.spawn), retained = [...scene.cells.values()];
    scene.root.position.set(-10000, -10000); scene.cull(1000, 700);
    expect(scene.culledGroundCount).toBe(97);
    expect(scene.culledObjectCount).toBe(retained.filter((cell) => !!cell.object).length);
    expect(scene.pick(tileCenter(world.spawn))).toBeNull();
    scene.syncVisible({ col: 12, row: 14 }, 1000, false);
    scene.update(1500, false); scene.cull(1000, 700);
    expect(scene.outgoingCount).toBe(0); expect(scene.cells.size).toBe(97);
    scene.root.position.set(1000, -100); scene.root.scale.set(0.8); scene.cull(2000, 2000);
    expect(scene.culledGroundCount).toBe(0); expect(scene.culledObjectCount).toBe(0);
    expect(scene.cells.get("12,13")).toBe(retained.find((cell) => cell.tile.col === 12 && cell.tile.row === 13));
    expect([...scene.cells.values()].every((cell) => !cell.ground.destroyed)).toBe(true);
    scene.root.destroy({ children: true, context: true });
  });
  it("keeps an on-screen rooftop drawable and clickable when its ground is below the viewport", () => {
    const world = createOutpost(1), scene = new WorldScene(world, world.spawn), home = scene.cells.get("12,12")!;
    const roof = gridToWorld(home.tile); roof.y -= home.entity!.height;
    scene.root.position.set(100 - roof.x, 8 - roof.y); scene.cull(200, 30);
    expect(home.ground.culled).toBe(true); expect(home.object!.culled).toBe(false);
    expect(scene.pick({ x: roof.x, y: roof.y + 1 })).toEqual(home.entity!.position);
    scene.root.destroy({ children: true, context: true });
  });
  it("removes shared side geometry on flat terrain while preserving the outside rim", () => {
    const world = createOutpost(1, "mars"), scene = new WorldScene(world, world.spawn);
    const inside = scene.cells.get("12,13")!;
    expect(inside.sideDepths).toEqual({ row: 0, col: 0 });
    expect(inside.sides.visible).toBe(false); expect(inside.sides.context.instructions).toHaveLength(0);
    expect(scene.cells.get("12,18")!.sideDepths.row).toBe(14);
    expect(scene.cells.get("17,13")!.sideDepths.col).toBe(14);
    expect(scene.exposedSideCount).toBe(22);
    scene.root.destroy({ children: true, context: true });
  });
  it("clips Moon steps and removes shared walls regardless of partial opacity or viewport culling", () => {
    const world = createOutpost(1), scene = new WorldScene(world, world.spawn);
    const step = scene.cells.get("12,15")!;
    expect(step.sideDepths).toEqual({ row: 6, col: 0 });
    const faded = scene.cells.get("12,18")!;
    expect(faded.ground.alpha).toBeLessThan(1);
    expect(faded.sideDepths).toEqual({ row: 14, col: 0 });
    scene.root.position.set(-10000, -10000); scene.cull(1000, 700); scene.update(500, false);
    expect(faded.sideDepths).toEqual({ row: 14, col: 0 });
    expect(scene.exposedSideCount).toBeLessThan(scene.cells.size * 2);
    scene.root.destroy({ children: true, context: true });
  });
  it("clips sides after all neighboring heights update, including reversals and departing cells", () => {
    const world = createOutpost(1), scene = new WorldScene(world, world.spawn);
    const check = () => {
      for (const cell of scene.cells.values()) for (const axis of ["row", "col"] as const) {
        const neighbor = scene.cells.get(`${cell.tile.col + (axis === "col" ? 1 : 0)},${cell.tile.row + (axis === "row" ? 1 : 0)}`);
        const depth = cell.sideDepths[axis];
        expect(depth).toBeGreaterThanOrEqual(0); expect(depth).toBeLessThanOrEqual(14);
        if (neighbor && neighbor.ground.alpha > 0) {
          expect(depth + cell.offset).toBeLessThanOrEqual(Math.max(cell.offset, neighbor.offset) + 1e-9);
          if (neighbor.offset <= cell.offset) expect(depth).toBe(0);
        } else expect(depth).toBe(14);
      }
    };
    scene.syncVisible({ col: 12, row: 14 }, 1000, false); check();
    scene.update(1120, false); check();
    scene.syncVisible(world.spawn, 1120, false); check();
    scene.update(1250, false); check();
    scene.update(1600, false); check();
    expect(scene.outgoingCount).toBe(0);
    scene.root.destroy({ children: true, context: true });
  });
});
