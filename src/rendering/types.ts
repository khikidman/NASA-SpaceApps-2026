import type { GridPosition, WorldPresentation, WorldRenderState } from "../world/types";
import type { AirlockStatus } from "../world/airlock";

/** The React integration depends on this port, not the Pixi scene graph. */
export interface WorldRenderer {
  setPresentation(presentation: WorldPresentation): void;
  setExplorer(state: WorldRenderState): void;
  setGridVisible(visible: boolean): void;
  enterHome(): void;
  exitHome(): void;
  moveHome(direction: GridPosition): void;
  zoomBy(factor: number): void;
  fit(): void;
  destroy(): void;
}

export interface WorldRendererCallbacks {
  onMoveComplete(position: GridPosition): void;
  onSelect(position: GridPosition): void;
  onMove(direction: GridPosition): void;
  onInteract(): void;
  onZoom(zoom: number): void;
  onContextChange(available: boolean): void;
  onHomeChange(inside: boolean): void;
  onAirlockChange(status: AirlockStatus): void;
  onHomeStation?(id: "food" | "melt" | "exercise"): void;
  onHomeGuidance?(): void;
}
