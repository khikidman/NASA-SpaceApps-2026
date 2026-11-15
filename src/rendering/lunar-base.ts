import { Assets, Container, Graphics, Sprite, type Texture } from "pixi.js";
import { footprintPolygon, gridToWorld, tileCenter } from "../world/isometric";
import { BASE_HULL_HEIGHT } from "../world/base-prefab";
import type { BaseModuleKind, WorldEntity, WorldMap } from "../world/types";
import registrations from "../assets/buildings/lunar-base-modules.json";

/** Change to true to illuminate the antenna's independent beacon overlay. */
export const LUNAR_BASE_ANTENNA_LIGHT_ON = false;
export const LUNAR_BASE_ASSET = { src: "/assets/buildings/lunar-base-modules/", prefab: "lunar-base", width: 3, height: 3 } as const;
export type BaseTextures = Record<BaseModuleKind, Texture>;
export interface BaseModuleVisual { root: Container; setSideDepths(row: number, col: number): void }

export async function loadLunarBaseTextures(): Promise<BaseTextures> {
  const entries = await Promise.all(Object.entries(registrations).map(async ([id, asset]) =>
    [id, await Assets.load<Texture>(asset.src)] as const));
  return Object.fromEntries(entries) as BaseTextures;
}

/** Only translation and uniform scale: source art is never sheared or stretched. */
function componentSprite(kind: BaseModuleKind, textures: BaseTextures, x: number, y: number) {
  const asset = registrations[kind], sprite = new Sprite(textures[kind]);
  sprite.label = `lunar-base-${kind}-1x1`;
  sprite.pivot.set(asset.anchorX, asset.anchorY);
  sprite.scale.set(asset.displayWidth / asset.pixelWidth);
  sprite.position.set(x, y);
  return sprite;
}

/** A single independently sorted, culled, and faded 1×1 prefab member. */
export function createLunarBaseModule(entity: WorldEntity, world: WorldMap, textures: BaseTextures): BaseModuleVisual {
  const root = new Container(), hull = new Graphics(), top = new Graphics(), height = BASE_HULL_HEIGHT;
  const kind = entity.prefab?.module ?? "hull", flat = (points: { x: number; y: number }[]) => points.flatMap((p) => [p.x, p.y]);
  const ground = footprintPolygon({ col: 0, row: 0 }), roof = ground.map((p) => ({ x: p.x, y: p.y - height }));
  const neighbor = (col: number, row: number) => world.entities.some((e) => e.prefab?.id === entity.prefab?.id
    && e.position.col === entity.position.col + col && e.position.row === entity.position.row + row);
  let previousRow = -1, previousCol = -1;
  const setSideDepths = (rowDepth: number, colDepth: number) => {
    if (rowDepth === previousRow && colDepth === previousCol) return;
    previousRow = rowDepth; previousCol = colDepth; hull.clear();
    for (const [a, b, depth, color, edge] of [
      [roof[3], roof[2], rowDepth, 0xcbbfa9, 0x58575a],
      [roof[2], roof[1], colDepth, 0xe0d1b6, 0x68676b],
    ] as const) {
      if (depth <= 0) continue;
      hull.poly(flat([a, b, { x: b.x, y: b.y + depth }, { x: a.x, y: a.y + depth }])).fill(color);
      hull.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ color: 0xffefce, width: 1.5 });
      if (depth > 16) {
        const p = { x: a.x + (b.x - a.x) * .18, y: a.y + (b.y - a.y) * .18 };
        const q = { x: a.x + (b.x - a.x) * .82, y: a.y + (b.y - a.y) * .82 };
        hull.moveTo(p.x, p.y + 9).lineTo(q.x, q.y + 9).stroke({ color: 0xe9aa29, width: 4 });
        const low = Math.min(depth - 2, height - 12);
        if (low > 22) hull.poly(flat([{ x: p.x, y: p.y + 19 }, { x: q.x, y: q.y + 19 },
          { x: q.x, y: q.y + low }, { x: p.x, y: p.y + low }])).stroke({ color: 0xa99e8c, alpha: .35, width: .8 });
      }
      if (depth === height) hull.moveTo(a.x, a.y + height - 4).lineTo(b.x, b.y + height - 4).stroke({ color: edge, width: 8 });
    }
  };
  setSideDepths(neighbor(0, 1) ? 0 : height, neighbor(1, 0) ? 0 : height);
  top.poly(flat(roof)).fill(0xf0e4cd).stroke({ color: 0xd3c6ad, width: .7 });
  root.addChild(hull, top);
  const center = tileCenter({ col: 0, row: 0 }); center.y -= height;
  const roofSkin = componentSprite("hull", textures, center.x, center.y);
  const roofMask = new Graphics().poly(flat(roof)).fill(0xffffff);
  root.addChild(roofSkin, roofMask); roofSkin.mask = roofMask;
  if (kind === "airlock") {
    const door = gridToWorld({ col: .5, row: 1 });
    root.addChild(componentSprite(kind, textures, door.x, door.y));
  } else if (kind !== "hull") {
    const sprite = componentSprite(kind, textures, center.x, center.y); root.addChild(sprite);
    if (kind === "antenna" && LUNAR_BASE_ANTENNA_LIGHT_ON) {
      const asset = registrations.antenna, scale = sprite.scale.x;
      const x = sprite.x + (asset.beaconX - asset.anchorX) * scale;
      const y = sprite.y + (asset.beaconY - asset.anchorY) * scale;
      const light = new Graphics().circle(x, y, 6).fill({ color: 0xf84b34, alpha: .2 })
        .circle(x, y, 3).fill(0xff3d24).circle(x, y, 1.2).fill(0xffedab);
      root.addChild(light);
    }
  }
  return { root, setSideDepths };
}
