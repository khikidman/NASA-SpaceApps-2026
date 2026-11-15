import { Assets, Container, Graphics, Rectangle, Sprite, Texture } from "pixi.js";
import frames from "../assets/characters/astronaut-atlas.json";
import { ASTRONAUT_SHEET_SRC, ASTRONAUT_WALK_CYCLES_PER_TILE, ASTRONAUT_WORLD_HEIGHT } from "../assets/characters/astronaut-settings";
import type { GridPosition } from "../world/types";

interface Frame { x: number; y: number; width: number; height: number; anchorX: number; anchorY: number; referenceHeight: number }
export type AstronautFacing = 0 | 1 | 2 | 3;

export class AstronautAtlas {
  readonly textures: Texture[];
  readonly frames: readonly Frame[] = frames.frames;
  constructor(source: Texture) {
    this.textures = this.frames.map((frame) => new Texture({ source: source.source,
      frame: new Rectangle(frame.x, frame.y, frame.width, frame.height) }));
  }
  destroy() { for (const texture of this.textures) texture.destroy(false); }
}
export async function loadAstronautAtlas() {
  return new AstronautAtlas(await Assets.load<Texture>(ASTRONAUT_SHEET_SRC));
}

/** One shared atlas supplies outdoor, indoor, and crossing actors at the same scale. */
export function createAstronaut(atlas?: AstronautAtlas) {
  const root = new Container(), shadow = new Graphics();
  shadow.ellipse(0, 1, ASTRONAUT_WORLD_HEIGHT * .24, ASTRONAUT_WORLD_HEIGHT * .105).fill({ color: 0x30323c, alpha: .3 });
  root.addChild(shadow);
  const sprite = atlas ? new Sprite(atlas.textures[0]) : null;
  if (sprite) root.addChild(sprite);
  let facing: AstronautFacing = 0, current = -1;
  const face = (direction: GridPosition) => {
    if (Math.abs(direction.col) + Math.abs(direction.row) < .00001) return;
    facing = Math.abs(direction.col) > Math.abs(direction.row)
      ? direction.col > 0 ? 1 : 3 : direction.row > 0 ? 0 : 2;
  };
  const pose = (stride: number, moving: boolean, direction?: GridPosition) => {
    if (direction) face(direction);
    const cycle = ((stride * ASTRONAUT_WALK_CYCLES_PER_TILE) % 1 + 1) % 1;
    const index = facing * frames.columns + (moving ? 1 + Math.floor(cycle * (frames.columns - 1)) : 0);
    if (!atlas || !sprite || index === current) return;
    current = index;
    const frame = atlas.frames[index];
    sprite.texture = atlas.textures[index]; sprite.pivot.set(frame.anchorX, frame.anchorY);
    sprite.scale.set(ASTRONAUT_WORLD_HEIGHT / frame.referenceHeight);
  };
  pose(0, false);
  return { root, shadow, face, pose };
}
