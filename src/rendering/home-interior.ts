import { Container, Graphics } from "pixi.js";
import { HOME_DOORWAY, HOME_ENTRY, HOME_EXIT, HOME_SIZE, HOME_THRESHOLD, HOME_TRANSITION_MS, homePath, insideHome, isHomeDoorway } from "../world/home";
import { footprintPolygon, gridToWorld, tileCenter, worldToGrid } from "../world/isometric";
import type { GridPosition, Point } from "../world/types";
import { beginWalk, heightAt, walkAt, type HeightMotion, type WalkMotion } from "./motion";
import { createAstronaut, type AstronautAtlas } from "./astronaut";
import { gridCrossingPosition, homePartReveal } from "./home-transition";
import { airlockAt, airlockCrossing } from "../world/airlock";
import { AirlockVisual } from "./airlock-visual";

const flat = (points: readonly Point[]) => points.flatMap((p) => [p.x, p.y]);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
interface RoomPart { container: Container; center: Point; position: GridPosition }
interface Placement { home: Point; outsidePlayer: Point }

/** A local presentation level. Interior steps never enter the campaign action log. */
export class HomeInterior {
  readonly root = new Container();
  private readonly astronaut: ReturnType<typeof createAstronaut>;
  private readonly traveler: ReturnType<typeof createAstronaut>;
  readonly crossingAvatar: Container;
  private lastPlayer: GridPosition = { ...HOME_ENTRY };
  private readonly hover = new Graphics();
  private readonly selection = new Graphics();
  private readonly routeGraphic = new Graphics();
  private readonly parts: RoomPart[] = [];
  private readonly airlockVisual = new AirlockVisual();
  private transition: HeightMotion = { from: 0, to: 0, start: 0, duration: 0 };
  private motion: WalkMotion | null = null;
  private route: GridPosition[] = [];
  private position: GridPosition = { ...HOME_ENTRY };
  private visual: GridPosition = { ...HOME_ENTRY };
  private engaged = false;
  private amount = 0;
  private stride = 0;
  private pulse = -Infinity;
  private arriving = false;
  private departing = false;
  private exitQueued = false;
  constructor(private readonly changed: (inside: boolean) => void, atlas?: AstronautAtlas) {
    this.astronaut = createAstronaut(atlas); this.traveler = createAstronaut(atlas);
    this.crossingAvatar = this.traveler.root;
    const back = new Container(), floor = new Container(), front = new Container();
    this.root.eventMode = "none"; this.root.visible = false;
    this.crossingAvatar.eventMode = "none"; this.crossingAvatar.visible = false;
    const door = tileCenter(HOME_EXIT);
    this.root.pivot.set(door.x, door.y);
    const part = (layer: Container, position: GridPosition, center = tileCenter(position)) => {
      const container = new Container(), graphic = new Graphics();
      container.addChild(graphic); container.position.set(center.x, center.y); layer.addChild(container);
      this.parts.push({ container, center, position }); return graphic;
    };
    const wall = (layer: Container, a: GridPosition, b: GridPosition, height: number, color: number, window = false) => {
      const center = gridToWorld({ col: (a.col + b.col) / 2, row: (a.row + b.row) / 2 });
      const graphic = part(layer, { col: (a.col + b.col) / 2 - .5, row: (a.row + b.row) / 2 - .5 }, center);
      const local = (p: Point) => ({ x: p.x - center.x, y: p.y - center.y });
      const p = local(gridToWorld(a)), q = local(gridToWorld(b));
      graphic.poly(flat([p, q, { x: q.x, y: q.y - height }, { x: p.x, y: p.y - height }])).fill(color);
      graphic.moveTo(p.x, p.y - height).lineTo(q.x, q.y - height).stroke({ color: 0xa0ded9, alpha: .7, width: 2 });
      if (window) {
        const x = { x: lerp(p.x, q.x, .18), y: lerp(p.y, q.y, .18) }, y = { x: lerp(p.x, q.x, .82), y: lerp(p.y, q.y, .82) };
        graphic.poly(flat([{ x: x.x, y: x.y - 24 }, { x: y.x, y: y.y - 24 }, { x: y.x, y: y.y - 47 }, { x: x.x, y: x.y - 47 }])).fill(0x78a6ae).stroke({ color: 0xb9e7dd, alpha: .5, width: 1 });
      }
    };
    for (let i = 0; i < HOME_SIZE; i++) {
      wall(back, { col: i, row: 0 }, { col: i + 1, row: 0 }, 66, 0x355765, true);
      wall(back, { col: 0, row: i + 1 }, { col: 0, row: i }, 66, 0x284751, true);
      if (i !== HOME_EXIT.col) wall(front, { col: i, row: 5 }, { col: i + 1, row: 5 }, 12, 0x45656d);
      wall(front, { col: 5, row: i }, { col: 5, row: i + 1 }, 12, 0x64828a);
    }
    for (let row = 0; row < HOME_SIZE; row++) for (let col = 0; col < HOME_SIZE; col++) {
      const tile = { col, row }, center = tileCenter(tile), graphic = part(floor, tile);
      const points = footprintPolygon(tile).map((p) => ({ x: p.x - center.x, y: p.y - center.y }));
      if (row === HOME_SIZE - 1 && col !== HOME_ENTRY.col) graphic.poly(flat([points[3], points[2], { x: points[2].x, y: points[2].y + 8 }, { x: points[3].x, y: points[3].y + 8 }])).fill(0x59747a);
      if (col === HOME_SIZE - 1) graphic.poly(flat([points[2], points[1], { x: points[1].x, y: points[1].y + 8 }, { x: points[2].x, y: points[2].y + 8 }])).fill(0x718b8b);
      graphic.poly(flat(points)).fill((col + row) % 2 ? 0xb9cbc5 : 0xc5d4cc).stroke({ color: 0x769493, width: 1.3 });
      graphic.poly(flat(points.map((p) => ({ x: p.x * .86, y: p.y * .86 })))).stroke({ color: 0xe3efe1, alpha: .3, width: 1 });
    }
    this.parts.push({ container: this.airlockVisual.root, center: door, position: HOME_EXIT });
    this.root.addChild(back, floor, this.airlockVisual.root, this.routeGraphic, this.hover, this.selection, this.astronaut.root, front);
    this.placePlayer(HOME_ENTRY, 0, false);
  }
  get open() { return this.engaged; }
  get progress() { return this.amount; }
  get visiblePartCount() { let count = 0; for (const part of this.parts) if (part.container.visible) count++; return count; }
  get player() { return { ...this.visual }; }
  get moving() { return !!this.motion || this.route.length > 0 || this.arriving || this.departing; }
  get interactive() { return this.engaged && !this.arriving && !this.departing && this.transition.to === 1 && this.amount === 1; }
  get airlock() { return !this.engaged ? airlockAt(1, "exit") : this.departing ? airlockAt(1 - this.amount, "exit") : airlockAt(this.amount, "enter"); }
  enter(now: number) {
    if (this.engaged) return;
    this.engaged = true; this.position = { ...HOME_ENTRY }; this.visual = { ...HOME_THRESHOLD };
    this.arriving = true; this.departing = false; this.exitQueued = false;
    this.route = []; this.motion = null; this.stride = 0;
    this.placePlayer(this.visual, 0, false); this.selection.clear(); this.routeGraphic.clear();
    this.transition = { from: 0, to: 1, start: now, duration: HOME_TRANSITION_MS };
    this.root.visible = true; this.changed(true);
  }
  exit(now: number) {
    if (!this.engaged || this.departing) return;
    if (this.arriving) { this.exitQueued = true; return; }
    if (this.interactive) { this.walkTo(HOME_DOORWAY, now); return; }
  }
  private beginExit(now: number) {
    this.arriving = false; this.departing = true; this.exitQueued = false;
    this.motion = null; this.route = []; this.hover.clear(); this.selection.clear(); this.routeGraphic.clear();
    this.transition = { from: 1, to: 0, start: now, duration: HOME_TRANSITION_MS };
  }
  walkTo(target: GridPosition, now: number) {
    if (!this.interactive) return;
    const path = homePath(this.motion?.to ?? this.position, target); if (!path) return;
    this.route = path; this.pulse = now;
    this.highlight(this.selection, target);
    this.routeGraphic.clear();
    let previous = tileCenter(this.visual);
    for (const step of path) { const p = tileCenter(step); this.routeGraphic.moveTo(previous.x, previous.y).lineTo(p.x, p.y).stroke({ color: 0x397f73, alpha: .5, width: 2 }); previous = p; }
    if (!this.motion) this.beginStep(now, true);
  }
  move(direction: GridPosition, now: number) {
    if (this.motion || !this.interactive) return;
    this.walkTo({ col: this.position.col + direction.col, row: this.position.row + direction.row }, now);
  }
  private beginStep(now: number, accelerate: boolean) {
    const to = this.route.shift();
    if (to && isHomeDoorway(to)) { this.beginExit(now); return; }
    this.motion = to ? beginWalk(this.position, to, now, accelerate, this.route.length === 0) : null;
  }
  pick(screen: Point): GridPosition | null {
    if (!this.interactive) return null;
    const local = { x: (screen.x - this.root.x) / this.root.scale.x + this.root.pivot.x,
      y: (screen.y - this.root.y) / this.root.scale.y + this.root.pivot.y };
    const grid = worldToGrid(local), tile = { col: Math.floor(grid.col), row: Math.floor(grid.row) };
    return insideHome(tile) || isHomeDoorway(tile) ? tile : null;
  }
  private highlight(graphic: Graphics, tile: GridPosition) {
    graphic.clear();
    if (isHomeDoorway(tile)) {
      const a = gridToWorld({ col: HOME_EXIT.col, row: HOME_DOORWAY.row }), b = gridToWorld({ col: HOME_EXIT.col + 1, row: HOME_DOORWAY.row });
      graphic.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ color: 0x65d8b4, width: 3 });
    } else graphic.poly(flat(footprintPolygon(tile))).fill({ color: 0x7ee6ca, alpha: .2 }).stroke({ color: 0x276e67, width: 2 });
  }
  setHover(tile: GridPosition | null) { this.hover.clear(); if (tile && this.interactive) this.highlight(this.hover, tile); }
  private placePlayer(position: GridPosition, stride: number, moving: boolean) {
    const a = this.astronaut, p = tileCenter(position);
    a.root.position.set(p.x, p.y);
    a.pose(stride, moving, { col: position.col - this.lastPlayer.col, row: position.row - this.lastPlayer.row });
    this.lastPlayer = { ...position };
  }
  update(now: number, reduced: boolean, home: Point, outsideZoom: number, outsidePlayer: Point = home,
    follow?: (player: GridPosition, progress: number) => Placement) {
    if (!this.engaged) return false;
    for (let i = 0; this.motion && i < HOME_SIZE * HOME_SIZE; i++) {
      const motion = this.motion, sample = walkAt(motion, now);
      this.visual = reduced ? { ...motion.to } : sample.position;
      this.placePlayer(this.visual, this.stride + sample.progress, !sample.done && !reduced);
      if (!sample.done && !reduced) break;
      this.position = { ...motion.to }; this.stride++;
      this.beginStep(reduced ? now : motion.start + motion.duration, false);
      if (!this.motion) this.routeGraphic.clear();
    }
    this.amount = reduced ? this.transition.to : heightAt(this.transition, now);
    if (this.arriving) {
      this.visual = gridCrossingPosition(HOME_THRESHOLD, HOME_ENTRY, airlockCrossing(this.airlock));
      this.placePlayer(this.visual, 0, false);
      if (this.amount === 1) {
        this.arriving = false; this.position = { ...HOME_ENTRY };
        if (this.exitQueued) this.beginExit(now);
      }
    } else if (this.departing) {
      this.visual = gridCrossingPosition(HOME_ENTRY, HOME_THRESHOLD, airlockCrossing(this.airlock));
      this.placePlayer(this.visual, 0, false);
    }
    const airlock = this.airlock;
    this.airlockVisual.update(airlock);
    // Hold the visible astronaut still while the sealed chamber changes pressure.
    const crossing = this.arriving ? airlockCrossing(airlock) : this.departing ? 1 - airlockCrossing(airlock) : 1;
    const placement = follow?.(this.visual, crossing);
    if (placement) { home = placement.home; outsidePlayer = placement.outsidePlayer; }
    this.root.position.set(home.x, home.y); this.root.scale.set(outsideZoom);
    this.root.alpha = 1; this.root.visible = this.amount > 0;
    for (const part of this.parts) {
      const reveal = homePartReveal(this.amount, part.position);
      part.container.position.set(part.center.x, part.center.y);
      part.container.scale.set(1);
      part.container.alpha = reveal; part.container.visible = reveal > 0;
    }
    // One screen-space astronaut bridges both scenes. It never fades or duplicates.
    const feet = tileCenter(this.visual);
    const indoorFeet = { x: this.root.x + (feet.x - this.root.pivot.x) * this.root.scale.x,
      y: this.root.y + (feet.y - this.root.pivot.y) * this.root.scale.y };
    this.crossingAvatar.position.set(lerp(outsidePlayer.x, indoorFeet.x, crossing), lerp(outsidePlayer.y, indoorFeet.y, crossing));
    this.crossingAvatar.scale.set(outsideZoom);
    this.astronaut.root.visible = this.amount === 1;
    this.crossingAvatar.visible = this.amount < 1;
    const stepping = !reduced && (this.arriving ? airlock.phase === "boarding" : this.departing && airlock.phase === "passing");
    const facing = { col: 0, row: this.departing ? 1 : -1 };
    this.traveler.pose(airlock.walk * 2, stepping, facing);
    if (this.arriving || this.departing) this.astronaut.pose(airlock.walk * 2, stepping, facing);
    const pulse = Math.min(1, Math.max(0, (now - this.pulse) / 620));
    this.selection.alpha = reduced || pulse === 1 ? .65 : .65 + Math.sin(pulse * Math.PI) * .35;
    if (this.amount === 0 && this.transition.to === 0) { this.engaged = false; this.departing = false; this.crossingAvatar.visible = false; this.changed(false); }
    return this.moving || this.amount !== this.transition.to || (!reduced && pulse < 1);
  }
  shiftTime(delta: number) { this.transition.start += delta; if (this.motion) this.motion.start += delta; this.pulse += delta; }
}
