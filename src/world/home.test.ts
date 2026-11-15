import { describe, expect, it } from "vitest";
import { HOME_AIRLOCK, HOME_DOORWAY, HOME_ENTRY, HOME_EXIT, HOME_SIZE, atHomeDoor, homeDoorPosition, homePath, insideHome, isHomeDoorway } from "./home";

describe("home floor and airlock", () => {
  it("locates the exterior front door without admitting entry through another wall", () => {
    const home = { col: 12, row: 12 };
    expect(homeDoorPosition(home)).toEqual({ col: 12, row: 13 });
    expect(atHomeDoor({ col: 12, row: 13 }, home)).toBe(true);
    for (const position of [{ col: 11, row: 12 }, { col: 13, row: 12 }, { col: 12, row: 11 }]) expect(atHomeDoor(position, home)).toBe(false);
  });
  it("adds exactly one walkable airlock square in front of the 25-square room", () => {
    let floors = 0, exits = 0;
    for (let row = -1; row <= HOME_SIZE + 1; row++) for (let col = -1; col <= HOME_SIZE; col++) {
      if (insideHome({ col, row })) floors++;
      if (isHomeDoorway({ col, row })) exits++;
    }
    expect(floors).toBe(26); expect(exits).toBe(1); expect(insideHome(HOME_EXIT)).toBe(true); expect(insideHome(HOME_DOORWAY)).toBe(false);
    expect(HOME_AIRLOCK).toEqual({ col: 2, row: 5 }); expect(HOME_ENTRY).toEqual(HOME_AIRLOCK);
    expect(homePath(HOME_ENTRY, { col: -1, row: 3 })).toBeNull();
    expect(homePath(HOME_ENTRY, { col: 2.5, row: 3 })).toBeNull();
  });
  it("crosses the doorway floor normally and only routes outside through the wall opening", () => {
    for (let row = 0; row < HOME_SIZE; row++) for (let col = 0; col < HOME_SIZE; col++) {
      const target = { col, row }, path = homePath({ col: 0, row: 4 }, target)!;
      let previous = { col: 0, row: 4 };
      for (const step of path) {
        expect(insideHome(step)).toBe(true);
        expect(Math.abs(previous.col - step.col) + Math.abs(previous.row - step.row)).toBe(1);
        previous = step;
      }
      expect(previous).toEqual(target);
    }
    expect(HOME_ENTRY).toEqual(HOME_EXIT);
    expect(homePath(HOME_ENTRY, HOME_EXIT)).toEqual([]);
    expect(homePath({ col: 0, row: 4 }, { col: 4, row: 4 })).toEqual([{ col: 1, row: 4 }, { col: 2, row: 4 }, { col: 3, row: 4 }, { col: 4, row: 4 }]);
    expect(homePath(HOME_ENTRY, HOME_DOORWAY)).toEqual([HOME_DOORWAY]);
    expect(homePath(HOME_EXIT, { col: 1, row: 5 })).toBeNull();
    expect(homePath(HOME_ENTRY, { col: 2, row: 4 })).toEqual([{ col: 2, row: 4 }]);
    expect(homePath({ col: 2, row: 4 }, HOME_DOORWAY)).toEqual([HOME_AIRLOCK, HOME_DOORWAY]);
    expect(homePath(HOME_ENTRY, { col: 3, row: 5 })).toBeNull();
  });
});
