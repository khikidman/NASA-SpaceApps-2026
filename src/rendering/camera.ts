import type { Bounds, Point } from "../world/types";

export interface Camera extends Point {
  zoom: number;
}

export const MIN_ZOOM = 0.15;
export const MAX_ZOOM = 2.5;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function worldToScreen(point: Point, camera: Camera): Point {
  return { x: point.x * camera.zoom + camera.x, y: point.y * camera.zoom + camera.y };
}

export function screenToWorld(point: Point, camera: Camera): Point {
  return { x: (point.x - camera.x) / camera.zoom, y: (point.y - camera.y) / camera.zoom };
}

/** Follow a displayed world point while preserving the current pan and zoom. */
export function followCamera(camera: Camera, previous: Point, next: Point): Camera {
  return { ...camera, x: camera.x + (previous.x - next.x) * camera.zoom,
    y: camera.y + (previous.y - next.y) * camera.zoom };
}

export function zoomAt(camera: Camera, anchor: Point, requestedZoom: number): Camera {
  const zoom = clamp(requestedZoom, MIN_ZOOM, MAX_ZOOM);
  const point = screenToWorld(anchor, camera);
  return { x: anchor.x - point.x * zoom, y: anchor.y - point.y * zoom, zoom };
}

export function fitCamera(bounds: Bounds, width: number, height: number, padding = 36): Camera {
  const zoom = clamp(Math.min(
    Math.max(1, width - padding * 2) / (bounds.maxX - bounds.minX),
    Math.max(1, height - padding * 2) / (bounds.maxY - bounds.minY),
  ), MIN_ZOOM, MAX_ZOOM);
  return {
    x: width / 2 - (bounds.minX + bounds.maxX) / 2 * zoom,
    y: height / 2 - (bounds.minY + bounds.maxY) / 2 * zoom,
    zoom,
  };
}

/** Always keep some of the world reachable inside the viewport. */
export function constrainCamera(camera: Camera, bounds: Bounds, width: number, height: number): Camera {
  const margin = Math.min(80, width / 4, height / 4);
  return {
    ...camera,
    x: clamp(camera.x, margin - bounds.maxX * camera.zoom, width - margin - bounds.minX * camera.zoom),
    y: clamp(camera.y, margin - bounds.maxY * camera.zoom, height - margin - bounds.minY * camera.zoom),
  };
}
