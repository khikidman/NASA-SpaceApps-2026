import type { GridPosition, Point } from "../world/types";
import { HOME_EXIT, HOME_SIZE } from "../world/home";
import { tileCenter } from "../world/isometric";

const smooth = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
const MAX_DISTANCE = Math.hypot(Math.max(HOME_EXIT.col, HOME_SIZE - 1 - HOME_EXIT.col), HOME_EXIT.row);

/** Sample an eased crossing, with exact grid centers at both handoffs. */
export function gridCrossingPosition(from: GridPosition, to: GridPosition, progress: number): GridPosition {
  if (progress <= 0) return { ...from };
  if (progress >= 1) return { ...to };
  return { col: from.col + (to.col - from.col) * progress,
    row: from.row + (to.row - from.row) * progress };
}

/** A reversible opacity wave: the door appears first and far walls fade in last. */
export function homePartReveal(progress: number, position: GridPosition) {
  const distance = Math.hypot(position.col - HOME_EXIT.col, position.row - HOME_EXIT.row);
  if (distance === 0) return smooth(progress / .22);
  const delay = Math.min(1, distance / MAX_DISTANCE) * .45;
  return smooth((progress - delay) / (1 - delay));
}

/** Fade stationary terrain from the outside inward. Reverse progress restores it. */
export function homeTerrainOpacity(progress: number, position: GridPosition, anchor: GridPosition, radius: number): number {
  if (progress <= 0) return 1;
  if (progress >= 1) return 0;
  const distance = Math.hypot(position.col - anchor.col, position.row - anchor.row);
  const delay = (1 - Math.min(1, distance / Math.max(1, radius))) * .55;
  return 1 - smooth((progress - delay) / .45);
}

/** The same effective feet position used by the single crossing astronaut. */
export function homeWorldFocus(anchor: Point, outsidePlayer: Point, insidePlayer: GridPosition, progress: number): Point {
  const feet = tileCenter(insidePlayer), door = tileCenter(HOME_EXIT);
  return { x: outsidePlayer.x + (anchor.x + feet.x - door.x - outsidePlayer.x) * progress,
    y: outsidePlayer.y + (anchor.y + feet.y - door.y - outsidePlayer.y) * progress };
}
