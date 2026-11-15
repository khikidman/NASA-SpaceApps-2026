import { homeBuildingPosition } from "./home";
import type { BaseModuleKind, GridPosition, WorldEntity } from "./types";
import { BASE_BANK_ART, worldBankRegistration } from "../assets/asset-bank";

export const BASE_MODULE_HEIGHT = Object.fromEntries(Object.entries(BASE_BANK_ART)
  .map(([module, id]) => [module, worldBankRegistration(id).height])) as Record<BaseModuleKind, number>;

/** The lab bank fits the existing nine independent 1×1 base cells. */
export const LUNAR_BASE_PREFAB: readonly (readonly BaseModuleKind[])[] = [
  ["solar", "greenhouse", "comms"],
  ["habitat", "junction", "research"],
  ["flag", "airlock", "solar"],
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
