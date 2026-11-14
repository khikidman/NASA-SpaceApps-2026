import type { GridPosition, WorldPresentation, WorldRenderState } from "../world/types";

/** The React integration depends on this port, not the Pixi scene graph. */
export interface WorldRenderer {
  setPresentation(presentation: WorldPresentation): void;
  setExplorer(state: WorldRenderState): void;
  setGridVisible(visible: boolean): void;
  zoomBy(factor: number): void;
  fit(): void;
  destroy(): void;
}

export interface WorldRendererCallbacks {
  onSelect(position: GridPosition): void;
  onMove(direction: GridPosition): void;
  onInteract(): void;
  onZoom(zoom: number): void;
  onContextChange(available: boolean): void;
}
