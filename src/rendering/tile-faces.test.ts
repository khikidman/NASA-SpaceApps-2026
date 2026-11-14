import { describe, expect, it } from "vitest";
import { exposedSideDepth, TILE_THICKNESS } from "./tile-faces";

describe("shared terrain wall removal", () => {
  it("removes the entire wall beside equal or higher terrain", () => {
    expect(exposedSideDepth(20, 20)).toBe(0);
    expect(exposedSideDepth(20, 10)).toBe(0);
  });
  it("draws only the exposed step beside lower terrain", () => {
    expect(exposedSideDepth(4, 10)).toBe(6);
    expect(exposedSideDepth(20, 34)).toBe(14);
    expect(exposedSideDepth(0, 46)).toBe(TILE_THICKNESS);
  });
  it("keeps the full rim when the adjacent tile is absent", () => {
    expect(exposedSideDepth(0)).toBe(TILE_THICKNESS);
    expect(exposedSideDepth(34)).toBe(TILE_THICKNESS);
  });
  it("clips at fractional animation heights without rounding or revealing hidden lower strips", () => {
    expect(exposedSideDepth(10.25, 13.5)).toBe(3.25);
    expect(exposedSideDepth(13.5, 10.25)).toBe(0);
  });
});
