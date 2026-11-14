import { Assets, Rectangle, Sprite, Texture } from "pixi.js";
import { getLabSprite } from "../assets/lab-catalog";
/** Call inside a browser renderer. Promoted images do not change gameplay/collisions. */
export async function createLabSprite(id: string, frame = 0): Promise<Sprite> {
  const asset = getLabSprite(id);
  if (!asset) throw new Error(`No promoted sprite named ${id}.`);
  const columns = asset.width / asset.frameWidth, count = columns * asset.height / asset.frameHeight;
  if (!Number.isInteger(frame) || frame < 0 || frame >= count) throw new Error("Invalid sprite frame.");
  const base = await Assets.load<Texture>(asset.src);
  const texture = new Texture({ source: base.source, frame: new Rectangle(frame % columns * asset.frameWidth, Math.floor(frame / columns) * asset.frameHeight, asset.frameWidth, asset.frameHeight) });
  const sprite = new Sprite(texture); sprite.anchor.set(asset.anchorX, asset.anchorY); sprite.scale.set(asset.scale);
  return sprite;
}
