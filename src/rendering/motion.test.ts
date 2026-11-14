import { describe, expect, it } from "vitest";
import { beginWalk, presenceAt, retargetPresence, STEP_MS, TILE_DROP, walkAt, retimeWalk } from "./motion";

describe("continuous world motion", () => {
  it("moves through fractional positions, eases to rest, and never overshoots", () => {
    const motion = beginWalk({ col: 12, row: 13 }, { col: 12, row: 14 }, 100, true, true);
    expect(walkAt(motion, 100).position).toEqual(motion.from);
    let last = 13;
    for (let elapsed = 0; elapsed <= motion.duration + 30; elapsed += 8) {
      const sample = walkAt(motion, 100 + elapsed);
      expect(sample.position.row).toBeGreaterThanOrEqual(last);
      expect(sample.position.row).toBeLessThanOrEqual(14); last = sample.position.row;
    }
    expect(walkAt(motion, 100 + motion.duration).position).toEqual(motion.to);
    expect(walkAt(motion, 100 + motion.duration / 2).position.row).toBeCloseTo(13.5);
  });
  it("keeps the same cruise speed across accelerated, middle, and stopping steps", () => {
    for (const [accelerate, decelerate] of [[true, false], [false, false], [false, true]]) {
      const motion = beginWalk({ col: 0, row: 0 }, { col: 1, row: 0 }, 0, accelerate, decelerate);
      const mid = motion.duration / 2;
      const speed = (walkAt(motion, mid + 1).position.col - walkAt(motion, mid).position.col);
      expect(speed).toBeCloseTo(1 / STEP_MS, 8);
    }
  });
  it("changes a route's stopping profile without changing the displayed position", () => {
    for (const elapsed of [1, 40, 100, 180, 220]) {
      const motion = beginWalk({ col: 10, row: 10 }, { col: 11, row: 10 }, 0, true, false);
      const next = retimeWalk(motion, true, elapsed);
      expect(walkAt(next, elapsed).position.col).toBeCloseTo(walkAt(motion, elapsed).position.col, 10);
      expect(walkAt(retimeWalk(next, false, elapsed), elapsed).position.col).toBeCloseTo(walkAt(motion, elapsed).position.col, 10);
    }
  });
  it("reverses a partially emerging or departing tile without snapping its height or opacity", () => {
    const arriving = { from: 0, to: 1, start: 10, duration: 360 };
    const value = presenceAt(arriving, 100);
    const leaving = retargetPresence(arriving, 0, 100);
    expect(presenceAt(leaving, 100)).toBe(value);
    expect(TILE_DROP * (1 - presenceAt(leaving, 100))).toBe(TILE_DROP * (1 - value));
    const returning = retargetPresence(leaving, 1, 140);
    expect(presenceAt(returning, 140)).toBe(presenceAt(leaving, 140));
    expect(presenceAt(returning, 10000)).toBe(1);
    expect(presenceAt(leaving, 10000)).toBe(0);
  });
});
