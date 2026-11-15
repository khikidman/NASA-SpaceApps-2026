import { Container, Graphics, Text } from "pixi.js";
import { gridToWorld, tileCenter } from "../world/isometric";
import { HOME_AIRLOCK } from "../world/home";
import type { AirlockSample } from "../world/airlock";
import type { Point } from "../world/types";

const flat = (points: readonly Point[]) => points.flatMap((p) => [p.x, p.y]);
const mix = (a: Point, b: Point, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** Cutaway chamber; sliding leaves retract into the two door jambs. */
export class AirlockVisual {
  readonly root = new Container();
  private readonly inner = new Graphics();
  private readonly outer = new Graphics();
  private readonly innerLight = new Graphics();
  private readonly outerLight = new Graphics();
  private readonly gauge = new Graphics();
  private innerValue = -1;
  private outerValue = -1;
  private pressure = -1;
  constructor() {
    const shell = new Graphics(), frames = new Graphics();
    const { col, row } = HOME_AIRLOCK;
    const door = tileCenter(HOME_AIRLOCK); this.root.pivot.set(door.x, door.y);
    // The chamber occupies exactly one tile, with doors on its two grid edges.
    const corners = [{ col, row }, { col: col + 1, row }, { col: col + 1, row: row + 1 }, { col, row: row + 1 }].map(gridToWorld);
    for (const [a, b] of [[corners[3], corners[2]], [corners[2], corners[1]]]) {
      shell.poly(flat([a, b, { x: b.x, y: b.y + 8 }, { x: a.x, y: a.y + 8 }])).fill(0x36535f);
    }
    shell.poly(flat(corners)).fill(0x496b78).stroke({ color: 0xb5d4d0, width: 2 });
    for (let i = 0; i < 5; i++) {
      const a = gridToWorld({ col: col + .08, row: row + .12 + i * .19 }), b = gridToWorld({ col: col + .92, row: row + .12 + i * .19 });
      shell.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ color: 0x87a7ad, alpha: .5, width: 1.5 });
    }
    for (const edgeCol of [col, col + 1]) {
      const a = gridToWorld({ col: edgeCol, row }), b = gridToWorld({ col: edgeCol, row: row + 1 });
      shell.poly(flat([a, b, { x: b.x, y: b.y - 14 }, { x: a.x, y: a.y - 14 }])).fill({ color: 0x8ab8bf, alpha: .7 })
        .stroke({ color: 0xc6e3db, width: 1 });
    }
    for (const [edgeRow, light] of [[row, this.innerLight], [row + 1, this.outerLight]] as const) {
      const a = gridToWorld({ col, row: edgeRow }), b = gridToWorld({ col: col + 1, row: edgeRow });
      frames.moveTo(a.x, a.y).lineTo(a.x, a.y - 47).lineTo(b.x, b.y - 47).lineTo(b.x, b.y).stroke({ color: 0xc4d9d2, width: 4 });
      const middle = mix(a, b, .5); light.circle(middle.x, middle.y - 51, 3).fill(0xffffff);
    }
    const label = new Text({ text: "AIRLOCK", style: { fontFamily: "Arial", fontSize: 10, fontWeight: "bold", fill: 0xe1f0e5 } });
    const center = tileCenter(HOME_AIRLOCK); label.anchor.set(.5); label.position.set(center.x, center.y - 68);
    this.gauge.position.set(center.x - 20, center.y - 60);
    this.root.addChild(shell, this.inner, this.outer, frames, this.innerLight, this.outerLight, this.gauge, label);
  }
  private drawDoor(graphic: Graphics, row: number, openness: number) {
    graphic.clear();
    const a = gridToWorld({ col: HOME_AIRLOCK.col, row }), b = gridToWorld({ col: HOME_AIRLOCK.col + 1, row }), half = .5 * (1 - openness);
    for (const [from, to] of [[0, half], [1 - half, 1]]) {
      if (to - from < .001) continue;
      const p = mix(a, b, from), q = mix(a, b, to);
      graphic.poly(flat([p, q, { x: q.x, y: q.y - 45 }, { x: p.x, y: p.y - 45 }])).fill(0x416575)
        .stroke({ color: 0x9ebcbe, width: 1 });
      graphic.moveTo(p.x, p.y - 31).lineTo(q.x, q.y - 31).stroke({ color: 0x91d2d4, width: 5, alpha: .7 });
    }
  }
  update(sample: AirlockSample) {
    if (sample.innerOpen !== this.innerValue) { this.drawDoor(this.inner, HOME_AIRLOCK.row, sample.innerOpen); this.innerValue = sample.innerOpen; }
    if (sample.outerOpen !== this.outerValue) { this.drawDoor(this.outer, HOME_AIRLOCK.row + 1, sample.outerOpen); this.outerValue = sample.outerOpen; }
    this.innerLight.tint = sample.innerOpen > .95 || sample.phase === "ready" ? 0x88efba : sample.phase === "pressure" ? 0xffd181 : 0xe89389;
    this.outerLight.tint = sample.outerOpen > .95 || sample.phase === "outside" ? 0x88efba : sample.phase === "pressure" ? 0xffd181 : 0xe89389;
    const level = Math.round(sample.pressure * 20);
    if (level !== this.pressure) {
      this.pressure = level; this.gauge.clear().roundRect(0, 0, 40, 6, 2).fill(0x18313d);
      for (let i = 0; i < 5; i++) this.gauge.roundRect(2 + i * 7.4, 1.5, 6, 3, 1).fill(i * 4 < level ? 0x98ebc2 : 0x48616b);
    }
  }
}
