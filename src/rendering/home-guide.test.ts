import { describe, expect, it } from "vitest";
import { gridToWorld } from "../world/isometric";
import { homeGuidance } from "./home-guide";

describe("home base navigation marker", () => {
  const home = { col: 12, row: 12 };
  const camera = { x: 420, y: -300, zoom: 1.2 };

  it("is hidden within the render radius and appears immediately beyond it", () => {
    expect(homeGuidance({ col: 12, row: 17 }, home, camera, 1000, 510)).toBeNull();
    expect(homeGuidance({ col: 15, row: 16 }, home, camera, 1000, 510)).toBeNull();
    expect(homeGuidance({ col: 14, row: 17 }, home, camera, 1000, 510)).toBeNull();
    expect(homeGuidance({ col: 15, row: 17 }, home, camera, 1000, 510)).not.toBeNull();
    expect(homeGuidance({ col: 12, row: 18 }, home, camera, 1000, 510)?.distance).toBe(6);
  });

  it("points back home in every direction and stays in the viewport on desktop and mobile", () => {
    for (const offset of [{ col: 6, row: 0 }, { col: -6, row: 0 }, { col: 0, row: 6 }, { col: 0, row: -6 }, { col: 6, row: 6 }, { col: -6, row: -6 }]) {
      const player = { col: home.col + offset.col, row: home.row + offset.row };
      const projectedDelta = gridToWorld({ col: -offset.col, row: -offset.row });
      for (const [width, height] of [[1158, 510], [310, 350]]) {
        const guide = homeGuidance(player, home, camera, width, height)!;
        expect(guide.angle).toBeCloseTo(Math.atan2(projectedDelta.y, projectedDelta.x));
        expect(guide.x).toBeGreaterThanOrEqual(74.9);
        expect(guide.x).toBeLessThanOrEqual(width - 74.9);
        expect(guide.y).toBeGreaterThanOrEqual(64.9);
        expect(guide.y).toBeLessThanOrEqual(height - 64.9);
        expect(Number.isFinite(guide.distance)).toBe(true);
      }
    }
  });

  it("keeps the bearing correct after camera pan and zoom", () => {
    const player = { col: 18, row: 17 };
    const first = homeGuidance(player, home, camera, 1000, 510)!;
    const second = homeGuidance(player, home, { x: -900, y: 670, zoom: 0.4 }, 1000, 510)!;
    expect(second.angle).toBeCloseTo(first.angle);
    expect(second.distance).toBe(first.distance);
    expect(second.x).toBeCloseTo(first.x);
    expect(second.y).toBeCloseTo(first.y);
  });
});
