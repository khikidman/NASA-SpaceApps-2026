import type { GridPosition } from "../world/types";

export const STEP_MS = 200;
export const TILE_ENTER_MS = 360;
export const TILE_EXIT_MS = 280;
export const TILE_DROP = 46;
export const SELECTION_MS = 620;
export const RIM_SHIFT_MS = 300;
export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const easeOut = (value: number) => 1 - (1 - clamp01(value)) ** 3;

export interface Presence { from: number; to: number; start: number; duration: number }
export function presenceAt(tween: Presence, now: number): number {
  const t = tween.duration === 0 ? 1 : clamp01((now - tween.start) / tween.duration);
  const eased = tween.to > tween.from ? easeOut(t) : t ** 2;
  return tween.from + (tween.to - tween.from) * eased;
}
/** Capture the displayed value, including during a reversal. Never jump to an endpoint. */
export function retargetPresence(tween: Presence, to: number, now: number): Presence {
  const from = presenceAt(tween, now);
  return { from, to, start: now, duration: Math.abs(to - from) * (to ? TILE_ENTER_MS : TILE_EXIT_MS) };
}

export interface HeightMotion { from: number; to: number; start: number; duration: number }
export function heightAt(tween: HeightMotion, now: number): number {
  const t = tween.duration === 0 ? 1 : clamp01((now - tween.start) / tween.duration);
  return tween.from + (tween.to - tween.from) * t * t * (3 - 2 * t);
}
/** Retarget from the displayed height so a quick reversal cannot snap the rim. */
export function retargetHeight(tween: HeightMotion, to: number, now: number): HeightMotion {
  if (tween.to === to) return tween;
  const from = heightAt(tween, now);
  return { from, to, start: now, duration: from === to ? 0 : RIM_SHIFT_MS };
}

export interface WalkMotion {
  from: GridPosition; to: GridPosition; start: number; duration: number; accelerate: boolean; decelerate: boolean;
}
function rampArea(accelerate: boolean, decelerate: boolean) { return 1 - ((accelerate ? 0.3 : 0) + (decelerate ? 0.3 : 0)) / 2; }
export function beginWalk(from: GridPosition, to: GridPosition, start: number, accelerate: boolean, decelerate: boolean): WalkMotion {
  // Longer starting/stopping steps preserve the same cruising speed between squares.
  return { from: { ...from }, to: { ...to }, start, accelerate, decelerate, duration: STEP_MS / rampArea(accelerate, decelerate) };
}
export function walkAt(motion: WalkMotion, now: number) {
  const t = clamp01((now - motion.start) / motion.duration);
  const a = motion.accelerate ? 0.3 : 0;
  const d = motion.decelerate ? 0.3 : 0;
  const area = rampArea(motion.accelerate, motion.decelerate);
  const distance = t < a ? t * t / (2 * a)
    : d && t > 1 - d ? area - (1 - t) ** 2 / (2 * d) : t - a / 2;
  const progress = clamp01(distance / area);
  return { position: { col: motion.from.col + (motion.to.col - motion.from.col) * progress,
    row: motion.from.row + (motion.to.row - motion.from.row) * progress }, progress, done: t >= 1 };
}

/** Change the stopping profile while keeping the exact displayed location. */
export function retimeWalk(motion: WalkMotion, decelerate: boolean, now: number): WalkMotion {
  const progress = walkAt(motion, now).progress;
  const next = beginWalk(motion.from, motion.to, now, motion.accelerate, decelerate);
  const a = next.accelerate ? 0.3 : 0, d = next.decelerate ? 0.3 : 0;
  const area = rampArea(next.accelerate, next.decelerate), distance = progress * area;
  const t = a && distance < a / 2 ? Math.sqrt(2 * a * distance)
    : d && distance > area - d / 2 ? 1 - Math.sqrt(2 * d * (area - distance)) : distance + a / 2;
  next.start = now - t * next.duration;
  return next;
}
