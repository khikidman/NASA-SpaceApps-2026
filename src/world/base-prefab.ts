import { homeBuildingPosition } from "./home";
import type { BaseModuleKind, GridPosition, WorldEntity } from "./types";

export const BASE_HULL_HEIGHT = 60;
export const BASE_MODULE_HEIGHT: Record<BaseModuleKind, number> = {
  hull: BASE_HULL_HEIGHT, airlock: BASE_HULL_HEIGHT,
  "vent-intake": 105, "vent-exhaust": 115, antenna: 145, dome: 115,
};

/** Six reusable asset types, arranged into nine independent 1×1 tile objects. */
export const LUNAR_BASE_PREFAB: readonly (readonly BaseModuleKind[])[] = [
  ["vent-intake", "hull", "antenna"],
  ["hull", "dome", "hull"],
  ["vent-exhaust", "airlock", "hull"],
];

export function createLunarBasePrefab(home: GridPosition): WorldEntity[] {
  const origin = homeBuildingPosition(home);
  return LUNAR_BASE_PREFAB.flatMap((row, r) => row.map((module, c) => ({
    id: module === "airlock" ? "hab-01" : `hab-${r}-${c}`,
    name: "Home base", kind: "habitat" as const, interaction: { type: "base" as const },
    prefab: { id: "lunar-base" as const, module },
    position: { col: origin.col + c, row: origin.row + r },
    footprint: { width: 1, height: 1 }, height: BASE_MODULE_HEIGHT[module],
  })));
}
