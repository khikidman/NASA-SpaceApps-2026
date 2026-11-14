import { CanvasSource, Rectangle, Texture } from "pixi.js";
import activeRecipe from "../assets/recipes/lunar-surface.json";
import { buildLunarSheet } from "../assets/lunar-painter";
import { validateLunarSettings } from "../assets/lunar-settings.mjs";
import type { WorldTile } from "../world/types";

const TILE_W = 192, TILE_H = 96;
const COUNT = 48, COLUMNS = 8;

function hash(seed: number, tile: WorldTile) {
  let n = seed ^ Math.imul(tile.col + 1, 374761393) ^ Math.imul(tile.row + 1, 668265263);
  n = Math.imul(n ^ n >>> 13, 1274126177); return (n ^ n >>> 16) >>> 0;
}
function surfaceSlot(tile: WorldTile, seed: number) {
  const n = hash(seed, tile);
  if (tile.terrain === "pad") return 36 + n % 4;
  if (tile.terrain === "rock") return 40 + n % 8;
  if (tile.terrain === "path") return tile.row === 13 && tile.col === 13 ? 32 + n % 4 : tile.row === 13 ? 16 + n % 8 : 24 + n % 8;
  return n % 16;
}

/** One shared texture sheet, made once per Moon renderer; no per-step texture generation. */
export class LunarSurfaceAtlas {
  readonly source: CanvasSource;
  readonly textures: readonly Texture[];
  constructor(private readonly seed: number) {
    const sheet = buildLunarSheet(seed, validateLunarSettings(activeRecipe.settings));
    this.source = new CanvasSource({ resource: sheet, scaleMode: "linear" });
    this.textures = Array.from({ length: COUNT }, (_, i) => new Texture({ source: this.source, frame: new Rectangle(i % COLUMNS * TILE_W, Math.floor(i / COLUMNS) * TILE_H, TILE_W, TILE_H), label: `lunar-surface-${i}` }));
  }
  texture(tile: WorldTile) { return this.textures[surfaceSlot(tile, this.seed)]; }
  destroy() { for (const texture of this.textures) texture.destroy(false); this.source.destroy(); }
}
