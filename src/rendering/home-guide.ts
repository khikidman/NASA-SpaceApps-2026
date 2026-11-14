import { tileCenter } from "../world/isometric";
import { gridDistance } from "../world/exploration";
import { inRenderRange } from "../world/visibility";
import type { GridPosition } from "../world/types";
import { worldToScreen, type Camera } from "./camera";

/** Screen-space HUD guidance only: never render the remote base's geometry. */
export function homeGuidance(player: GridPosition, home: GridPosition, camera: Camera, width: number, height: number) {
  if (inRenderRange(home, player)) return null;
  const from = worldToScreen(tileCenter(player), camera);
  const to = worldToScreen(tileCenter(home), camera);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const halfWidth = Math.max(1, width / 2 - Math.min(75, width / 4));
  const halfHeight = Math.max(1, height / 2 - Math.min(65, height / 4));
  const scale = Math.min(dx === 0 ? Infinity : halfWidth / Math.abs(dx), dy === 0 ? Infinity : halfHeight / Math.abs(dy));
  return { x: width / 2 + dx * scale, y: height / 2 + dy * scale,
    angle: Math.atan2(dy, dx), distance: gridDistance(player, home) };
}
