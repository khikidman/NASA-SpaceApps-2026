import { describe, expect, it } from "vitest";
import { homePartReveal, homeTerrainOpacity, homeWorldFocus } from "./home-transition";
import { HOME_EXIT, HOME_SIZE } from "../world/home";

describe("world-anchored radial home transition", () => {
  it("maps the continuous player focus between the outdoor feet and the interior grid", () => {
    const anchor = { x: 0, y: 600 }, outside = { x: -48, y: 624 }, player = { col: 2, row: 3 };
    expect(homeWorldFocus(anchor, outside, player, 0)).toEqual(outside);
    expect(homeWorldFocus(anchor, outside, player, 1)).toEqual({ x: 96, y: 552 });
    expect(homeWorldFocus(anchor, outside, HOME_EXIT, 1)).toEqual(anchor);
    expect(homeWorldFocus(anchor, outside, player, .5)).toEqual({ x: 24, y: 588 });
  });
  it("fades the outside terrain before the center and reverses cleanly", () => {
    const anchor = { col: 12, row: 12 };
    const outer = homeTerrainOpacity(.4, { col: 12, row: 18 }, anchor, 6.5);
    const middle = homeTerrainOpacity(.4, { col: 12, row: 15 }, anchor, 6.5);
    const center = homeTerrainOpacity(.4, anchor, anchor, 6.5);
    expect(outer).toBeLessThan(middle); expect(middle).toBeLessThan(center); expect(center).toBe(1);
    for (const tile of [anchor, { col: 14, row: 15 }, { col: 12, row: 18 }]) {
      const forward = [0, .25, .5, .75, 1].map((p) => homeTerrainOpacity(p, tile, anchor, 6.5));
      expect(forward[0]).toBe(1); expect(forward.at(-1)).toBe(0);
      expect([1, .75, .5, .25, 0].map((p) => homeTerrainOpacity(p, tile, anchor, 6.5))).toEqual([...forward].reverse());
    }
  });
  it("reveals the door before nearby tiles and the far walls", () => {
    const door = homePartReveal(.3, HOME_EXIT), near = homePartReveal(.3, { col: 2, row: 3 }), far = homePartReveal(.3, { col: 0, row: 0 });
    expect(door).toBe(1); expect(near).toBeGreaterThan(0); expect(near).toBeLessThan(door); expect(far).toBe(0);
  });
  it("uses the same bounded radial profile in both directions and settles every floor tile", () => {
    for (let row = 0; row < HOME_SIZE; row++) for (let col = 0; col < HOME_SIZE; col++) {
      const tile = { col, row }, outward = [0, .25, .5, .75, 1].map((p) => homePartReveal(p, tile));
      expect(outward[0]).toBe(0); expect(outward.at(-1)).toBe(1);
      for (let i = 1; i < outward.length; i++) expect(outward[i]).toBeGreaterThanOrEqual(outward[i - 1]);
      expect([1, .75, .5, .25, 0].map((p) => homePartReveal(p, tile))).toEqual([...outward].reverse());
    }
  });
});
