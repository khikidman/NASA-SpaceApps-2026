export const TILE_THICKNESS = 14;

/** Terrain is a solid column below its top, even when its appearance is faded.
 * A front neighbor hides the shared wall up to its displayed surface. Only
 * the exposed step (or the full outside edge) needs side-face geometry.
 */
export function exposedSideDepth(offset: number, neighborOffset?: number): number {
  return neighborOffset === undefined ? TILE_THICKNESS
    : Math.max(0, Math.min(TILE_THICKNESS, neighborOffset - offset));
}
