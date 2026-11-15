import { Assets, Container, Graphics, Sprite, Texture } from "pixi.js";
import { tileCenter } from "../world/isometric";
import { HOME_AIRLOCK } from "../world/home";
import type { AirlockSample } from "../world/airlock";
import type { Point } from "../world/types";
import { AIRLOCK_OPENING_WORLD_HEIGHT } from "../assets/characters/astronaut-settings";
import { getLabSprite } from "../assets/lab-catalog";
import design from "../assets/buildings/airlock-tunnel.json";

const LAYERS = ["floor", "far-enclosure", "near-enclosure", "ceiling", "inner-frame", "outer-frame"] as const;
type Layer = typeof LAYERS[number];
export type AirlockTextures = Record<Layer, Texture>;
export async function loadAirlockTextures(): Promise<AirlockTextures> {
  return Object.fromEntries(await Promise.all(LAYERS.map(async layer => {
    const asset = getLabSprite(`airlock-tunnel-${layer}`);
    if (!asset) throw new Error(`Missing promoted airlock layer: ${layer}`);
    return [layer, await Assets.load<Texture>(asset.src)];
  }))) as AirlockTextures;
}
const flat = (points: readonly Point[]) => points.flatMap(p => [p.x, p.y]);
const smooth = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Supplied enclosed tunnel: one tile, with separately fading cutaway layers. */
export class AirlockVisual {
  readonly root = new Container();
  readonly foreground = new Container();
  private readonly layers: Record<Layer, Sprite>;
  private readonly inner = new Graphics();
  private readonly outer = new Graphics();
  private readonly innerLight = new Graphics();
  private readonly outerLight = new Graphics();
  private innerValue = -1;
  private outerValue = -1;

  constructor(textures?: AirlockTextures) {
    const center = tileCenter(HOME_AIRLOCK), settings = design.settings;
    this.root.pivot.set(center.x, center.y); this.foreground.pivot.set(center.x, center.y);
    this.layers = Object.fromEntries(LAYERS.map(layer => {
      const sprite = new Sprite(textures?.[layer] ?? Texture.EMPTY);
      sprite.label = `airlock-tunnel-${layer}`;
      sprite.anchor.set(settings.anchorX, settings.anchorY); sprite.scale.set(settings.scale);
      sprite.position.set(center.x, center.y); return [layer, sprite];
    })) as Record<Layer, Sprite>;
    for (const [side, light] of [["inner", this.innerLight], ["outer", this.outerLight]] as const) {
      const [x, y] = design.thresholds[side];
      light.poly(flat([[-6, -6.5], [6, -.5], [6, 1.5], [-6, -4.5]].map(([dx, dy]) => ({ x: center.x + x + dx, y: center.y + y - AIRLOCK_OPENING_WORLD_HEIGHT + dy })))).fill(0xffffff);
    }
    this.root.addChild(this.layers.floor, this.layers["far-enclosure"], this.inner, this.layers["inner-frame"], this.innerLight);
    this.foreground.addChild(this.layers["near-enclosure"], this.outer, this.layers["outer-frame"], this.outerLight, this.layers.ceiling);
  }

  private drawDoor(graphic: Graphics, side: "inner" | "outer", openness: number) {
    graphic.clear();
    const center = tileCenter(HOME_AIRLOCK), [x, y] = design.thresholds[side];
    const half = design.clearDoor.projectedWidth / 2, height = AIRLOCK_OPENING_WORLD_HEIGHT;
    const point = (u: number, v: number) => ({ x: center.x + x + u, y: center.y + y + u * .5 + v });
    // Sliding leaves are clipped to the aperture. Windows travel with each leaf.
    for (const left of [true, false]) {
      const offset = (left ? -half : half) * openness;
      const lo = Math.max(-half, (left ? -half : 0) + offset), hi = Math.min(half, (left ? 0 : half) + offset);
      if (hi - lo < .001) continue;
      graphic.poly(flat([point(lo, -height), point(hi, -height), point(hi, 0), point(lo, 0)]))
        .fill(0x494b56).stroke({ color: 0x797b86, width: .5 });
      const windowLo = Math.max(lo, (left ? -9 : 2) + offset), windowHi = Math.min(hi, (left ? -2 : 9) + offset);
      if (windowHi > windowLo) graphic.poly(flat([point(windowLo, -height + 6), point(windowHi, -height + 6), point(windowHi, -height + 13), point(windowLo, -height + 13)])).fill(0x729db4);
    }
  }

  update(sample: AirlockSample, progress: number) {
    if (sample.innerOpen !== this.innerValue) { this.drawDoor(this.inner, "inner", sample.innerOpen); this.innerValue = sample.innerOpen; }
    if (sample.outerOpen !== this.outerValue) { this.drawDoor(this.outer, "outer", sample.outerOpen); this.outerValue = sample.outerOpen; }
    // Shell visibility follows the reversible entry amount, independently of the
    // physical interlock. The actor and the rest of the room never share this fade.
    const chamber = smooth((progress - .08) / .22), interior = smooth((progress - .62) / .26);
    const [solid, hold, inside] = design.states;
    const alpha = (key: "floor" | "far" | "near" | "ceiling" | "innerFrame" | "outerFrame" | "innerDoor" | "outerDoor") => lerp(lerp(solid[key], hold[key], chamber), inside[key], interior);
    this.layers.floor.alpha = alpha("floor"); this.layers["far-enclosure"].alpha = alpha("far");
    this.layers["near-enclosure"].alpha = alpha("near"); this.layers.ceiling.alpha = alpha("ceiling");
    this.layers["inner-frame"].alpha = this.innerLight.alpha = alpha("innerFrame");
    this.layers["outer-frame"].alpha = this.outerLight.alpha = alpha("outerFrame");
    this.inner.alpha = alpha("innerDoor"); this.outer.alpha = alpha("outerDoor");
    this.innerLight.tint = sample.innerOpen > .95 ? 0x88d5af : sample.phase === "pressure" ? 0xedbe63 : 0x87cdd4;
    this.outerLight.tint = sample.outerOpen > .95 ? 0x88d5af : sample.phase === "pressure" ? 0xedbe63 : 0x87cdd4;
  }
}
