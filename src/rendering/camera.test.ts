import { describe, expect, it } from "vitest";
import { worldBounds } from "../world/isometric";
import { constrainCamera, fitCamera, MAX_ZOOM, MIN_ZOOM, screenToWorld, worldToScreen, zoomAt } from "./camera";

describe("world camera", () => {
  it("round-trips picking coordinates after panning and zooming", () => {
    for (const zoom of [MIN_ZOOM, 0.7, 1, MAX_ZOOM]) {
      const camera = { x: 145, y: -67, zoom };
      const worldPoint = { x: -524, y: 319 };
      const restored = screenToWorld(worldToScreen(worldPoint, camera), camera);
      expect(restored.x).toBeCloseTo(worldPoint.x);
      expect(restored.y).toBeCloseTo(worldPoint.y);
    }
  });

  it("keeps the cursor's world point stationary during zoom and clamps zoom limits", () => {
    const camera = { x: 500, y: 120, zoom: 0.5 };
    const anchor = { x: 245, y: 310 };
    const point = screenToWorld(anchor, camera);
    for (const requested of [0.001, 0.9, 4]) {
      const next = zoomAt(camera, anchor, requested);
      const screen = worldToScreen(point, next);
      expect(screen.x).toBeCloseTo(anchor.x);
      expect(screen.y).toBeCloseTo(anchor.y);
      expect(next.zoom).toBeGreaterThanOrEqual(MIN_ZOOM);
      expect(next.zoom).toBeLessThanOrEqual(MAX_ZOOM);
    }
  });

  it("fits the entire map into desktop and mobile viewports", () => {
    const bounds = worldBounds(14, 14);
    for (const [width, height] of [[1160, 480], [328, 350]]) {
      const camera = fitCamera(bounds, width, height);
      const upper = worldToScreen({ x: bounds.minX, y: bounds.minY }, camera);
      const lower = worldToScreen({ x: bounds.maxX, y: bounds.maxY }, camera);
      expect(upper.x).toBeGreaterThanOrEqual(35.9);
      expect(upper.y).toBeGreaterThanOrEqual(35.9);
      expect(lower.x).toBeLessThanOrEqual(width - 35.9);
      expect(lower.y).toBeLessThanOrEqual(height - 35.9);
    }
  });

  it("prevents panning the entire world out of reach", () => {
    const bounds = worldBounds(14, 14);
    for (const offset of [-100_000, 100_000]) {
      const camera = constrainCamera({ x: offset, y: offset, zoom: 1 }, bounds, 1000, 480);
      const upper = worldToScreen({ x: bounds.minX, y: bounds.minY }, camera);
      const lower = worldToScreen({ x: bounds.maxX, y: bounds.maxY }, camera);
      expect(upper.x).toBeLessThanOrEqual(920);
      expect(upper.y).toBeLessThanOrEqual(400);
      expect(lower.x).toBeGreaterThanOrEqual(80);
      expect(lower.y).toBeGreaterThanOrEqual(80);
    }
  });
});
