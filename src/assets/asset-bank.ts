import { getLabSprite } from "./lab-catalog";
import type { BaseModuleKind, WorldEntity } from "../world/types";
import registrations from "./catalog/asset-bank-world.json";

export const BASE_BANK_ART: Record<BaseModuleKind, string> = {
  habitat: "lunar-v2-base-habitat", research: "lunar-v2-base-lab",
  greenhouse: "lunar-v2-base-greenhouse", airlock: "lunar-v2-base-airlock",
  solar: "lunar-v2-base-solar", comms: "lunar-v2-base-comms",
  junction: "lunar-v2-tunnel-cross", flag: "moon-flag",
};
export const NODE_BANK_ART: Readonly<Record<string, string>> = {
  "solar-01": "lunar-v2-base-solar", "solar-02": "lunar-v2-base-comms",
  "solar-03": "lunar-v2-base-greenhouse", "oxygen-01": "lunar-v2-base-airlock",
  "lab-01": "lunar-v2-base-lab", "sample-01": "lunar-v2-base-lab",
  "shield-01": "lunar-v2-base-habitat",
};
export function worldBankAsset(entity: WorldEntity) {
  if (entity.artId) return entity.artId;
  return entity.prefab ? BASE_BANK_ART[entity.prefab.module] : NODE_BANK_ART[entity.id];
}
export function worldBankRegistration(id: string) {
  return (registrations as Record<string, { height: number; scale: number; footprint: { width: number; height: number } }>)[id];
}

export type GrowLightState = "off" | "white-low" | "white-high" | "warm-low" | "warm-high" | "red-blue-low" | "red-blue-high";
/** Artwork only; the existing garden tasks continue to define costs and rewards. */
export const DEFAULT_GROW_LIGHT_STATE: GrowLightState = "white-low";
export function uiBankAsset(name: string, light: GrowLightState = DEFAULT_GROW_LIGHT_STATE) {
  const id = name === "lamp" ? `led-grow-${light}` : ({
    home: "lunar-v2-base-habitat", solar: "lunar-v2-base-solar",
    radio: "lunar-v2-base-comms", greenhouse: "lunar-v2-base-greenhouse",
  } as Record<string, string>)[name];
  return id ? getLabSprite(id) : undefined;
}
