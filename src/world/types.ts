export interface Point {
  x: number;
  y: number;
}

export interface GridPosition {
  col: number;
  row: number;
}

export interface Footprint {
  width: number;
  height: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export type Terrain = "sand" | "rock" | "path" | "pad";
export type FacilityKind = "habitat" | "solar" | "oxygen" | "lab" | "shield";

export interface WorldTile extends GridPosition {
  terrain: Terrain;
  variant: number;
}

export interface WorldEntity {
  id: string;
  kind: FacilityKind;
  name: string;
  position: GridPosition;
  footprint: Footprint;
  /** Visual height in projected world pixels, not a physical measurement. */
  height: number;
}

export interface WorldMap {
  id: string;
  seed: number;
  width: number;
  height: number;
  tiles: readonly WorldTile[];
  entities: readonly WorldEntity[];
  home: GridPosition;
  spawn: GridPosition;
}

export interface ExplorerState {
  position: GridPosition;
  steps: number;
  visitedFacilities: readonly string[];
  activeFacilityId: string | null;
}

export interface WorldRenderState {
  player: GridPosition;
  selected: GridPosition;
}

/** Presentation only. The renderer cannot change mission resources. */
export interface WorldPresentation {
  lowPower: boolean;
  lowOxygen: boolean;
  missionEnded: boolean;
}
