import { Assets, Container, Graphics, Sprite, type Texture } from "pixi.js";
import { tileCenter } from "../world/isometric";
import type { WorldEntity, WorldMap } from "../world/types";
import { worldBankAsset, worldBankRegistration } from "../assets/asset-bank";
import { getLabSprite } from "../assets/lab-catalog";

/** The bank's communications beacon uses the same easily changed switch. */
export const LUNAR_BASE_ANTENNA_LIGHT_ON = false;
export const LUNAR_BASE_ASSET = { src: "asset-lab-bank-v2", prefab: "lunar-base", width: 3, height: 3 } as const;
export type BaseTextures = Record<string, Texture>;
export const FLAG_DISPLAY_SCALE = worldBankRegistration("moon-flag").scale;

export async function loadLunarBaseTextures(world: WorldMap): Promise<BaseTextures> {
  const ids = [...new Set(world.entities.map(worldBankAsset).filter((id): id is string => !!id))];
  const entries = await Promise.all(ids.map(async (id) => {
    const asset = getLabSprite(id);
    if (!asset) throw new Error(`Missing promoted world asset: ${id}`);
    return [id, await Assets.load<Texture>(asset.src)] as const;
  }));
  return Object.fromEntries(entries);
}

/** One complete 1×1 volume, mounted at this entity's own ground center. */
export function createLunarBaseModule(entity: WorldEntity, textures: BaseTextures) {
  const id = worldBankAsset(entity), asset = id && getLabSprite(id);
  if (!id || !asset || !textures[id]) throw new Error(`Missing world art for ${entity.id}`);
  const root = new Container(), sprite = new Sprite(textures[id]), center = tileCenter({ col: 0, row: 0 });
  const scale = worldBankRegistration(id).scale;
  sprite.label = `${id}-1x1`;
  sprite.anchor.set(asset.anchorX, asset.anchorY); sprite.scale.set(scale);
  sprite.position.set(center.x, center.y); root.addChild(sprite);
  // Separate render overlay preserves the beacon switch without editing source PNGs.
  if (id === "lunar-v2-base-comms" && !LUNAR_BASE_ANTENNA_LIGHT_ON) {
    const x = center.x + (849 - asset.width * asset.anchorX) * scale;
    const y = center.y + (486 - asset.height * asset.anchorY) * scale;
    const cap = new Graphics().roundRect(x - 28 * scale, y - 30 * scale, 56 * scale, 65 * scale, 22 * scale).fill(0x571c22);
    cap.ellipse(x - 9 * scale, y - 15 * scale, 7 * scale, 5 * scale).fill({ color: 0xc38c8b, alpha: .6 });
    root.addChild(cap);
  }
  return root;
}
