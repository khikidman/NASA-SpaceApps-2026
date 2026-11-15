import { describe, expect, it } from "vitest";
import { HomeInterior } from "./home-interior";
import { HOME_DOORWAY, HOME_ENTRY, HOME_EXIT, HOME_SIZE, HOME_TRANSITION_MS as CYCLE } from "../world/home";
import { tileCenter } from "../world/isometric";

const home = { x: 730, y: 420 }, outside = { x: 700, y: 470 };
const update = (room: HomeInterior, now: number, reduced = false) => room.update(now, reduced, home, 1.3, outside);
const dispose = (room: HomeInterior) => { room.root.destroy({ children: true, context: true }); room.crossingAvatar.destroy({ children: true, context: true }); };
describe("home airlock and navigation", () => {
  it("holds movement and the visible astronaut steady during pressurization", () => {
    const room = new HomeInterior(() => {}); room.enter(0); update(room, CYCLE * .44);
    expect(room.airlock.phase).toBe("pressure"); expect(room.interactive).toBe(false); expect(room.player).toEqual(HOME_ENTRY);
    const x = room.crossingAvatar.x, y = room.crossingAvatar.y;
    room.walkTo({ col: 4, row: 1 }, CYCLE * .45); update(room, CYCLE * .52);
    expect(room.airlock.phase).toBe("pressure"); expect(room.player).toEqual(HOME_ENTRY);
    expect(room.crossingAvatar.x).toBe(x); expect(room.crossingAvatar.y).toBe(y);
    expect(room.airlock.innerOpen + room.airlock.outerOpen).toBe(0);
    update(room, CYCLE); expect(room.interactive).toBe(true); expect(room.player).toEqual(HOME_ENTRY); dispose(room);
  });
  it("queues an exit request until the entry cycle has sealed safely", () => {
    const changes: boolean[] = [], room = new HomeInterior((v) => changes.push(v)); room.enter(0); update(room, CYCLE * .44);
    room.exit(CYCLE * .44); update(room, CYCLE * .6); expect(room.airlock.direction).toBe("enter");
    update(room, CYCLE); expect(room.airlock.direction).toBe("exit"); expect(room.interactive).toBe(false);
    update(room, CYCLE * 1.5); expect(room.airlock.phase).toBe("pressure");
    update(room, CYCLE * 2); expect(room.open).toBe(false); expect(room.player).toEqual(HOME_DOORWAY);
    expect(changes).toEqual([true, false]); dispose(room);
  });
  it("picks all floor centers correctly after shared pan and zoom", () => {
    const room = new HomeInterior(() => {}); room.enter(0); update(room, CYCLE);
    for (const [x, y, zoom] of [[180, 350, .5], [730, 420, 1.3], [300, 100, 2.5]]) {
      room.update(CYCLE + 50, false, { x, y }, zoom, outside);
      expect(room.pick({ x, y })).toEqual(HOME_EXIT);
      for (let row = 0; row < HOME_SIZE; row++) for (let col = 0; col < HOME_SIZE; col++) {
        const tile = { col, row }, p = tileCenter(tile);
        expect(room.pick({ x: x + (p.x - room.root.pivot.x) * zoom, y: y + (p.y - room.root.pivot.y) * zoom })).toEqual(tile);
      }
    }
    dispose(room);
  });
  it("keeps the doorway floor normal and cycles only after stepping toward the outside", () => {
    const changes: boolean[] = [], room = new HomeInterior((v) => changes.push(v)); room.enter(0); update(room, CYCLE);
    room.walkTo({ col: 4, row: 1 }, CYCLE + 100); update(room, CYCLE + 200);
    expect(Number.isInteger(room.player.row)).toBe(false);
    update(room, CYCLE + 2000); expect(room.player).toEqual({ col: 4, row: 1 });
    room.walkTo({ col: 5, row: 1 }, CYCLE + 2100); update(room, CYCLE + 2200); expect(room.player).toEqual({ col: 4, row: 1 });
    room.walkTo(HOME_EXIT, CYCLE + 2300); update(room, CYCLE + 4000);
    expect(room.player).toEqual(HOME_EXIT); expect(room.interactive).toBe(true);
    room.move({ col: 0, row: 1 }, CYCLE + 4100); update(room, CYCLE + 4100);
    expect(room.airlock.direction).toBe("exit"); expect(room.airlock.phase).toBe("inner-opening");
    update(room, CYCLE * 2 + 4100); expect(room.open).toBe(false); expect(room.player).toEqual(HOME_DOORWAY);
    expect(changes).toEqual([true, false]); dispose(room);
  });
  it("pauses the cycle clock and settles immediately for reduced motion", () => {
    const room = new HomeInterior(() => {}); room.enter(0); update(room, CYCLE * .44); const pressure = room.airlock.pressure;
    room.shiftTime(500); update(room, CYCLE * .44 + 500); expect(room.airlock.pressure).toBe(pressure);
    update(room, CYCLE * .44 + 500, true); expect(room.interactive).toBe(true); expect(room.airlock.pressure).toBe(1);
    room.exit(CYCLE + 1000); update(room, CYCLE + 1000, true); expect(room.open).toBe(false); expect(room.airlock.pressure).toBe(0); dispose(room);
  });
  it("fades room parts without shrinking and keeps exact grid handoffs", () => {
    const room = new HomeInterior(() => {}); room.enter(0); update(room, CYCLE * .3);
    const floor = room.root.children[1]; expect(floor.children).toHaveLength(25);
    for (const [i, tile] of floor.children.entries()) {
      const p = tileCenter({ col: i % HOME_SIZE, row: Math.floor(i / HOME_SIZE) });
      expect(tile.x).toBe(p.x); expect(tile.y).toBe(p.y); expect(tile.scale.x).toBe(1);
    }
    update(room, CYCLE); expect(room.player).toEqual(HOME_ENTRY); expect(room.crossingAvatar.visible).toBe(false);
    room.exit(CYCLE + 100); update(room, CYCLE * 2 + 100);
    expect(room.player).toEqual(HOME_DOORWAY); expect(room.crossingAvatar.visible).toBe(false);
    expect(room.crossingAvatar.x).toBe(outside.x); expect(room.crossingAvatar.y).toBe(outside.y);
    dispose(room);
  });
});
