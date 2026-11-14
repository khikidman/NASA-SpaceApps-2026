export interface LunarSettings { baseColor: string; rimColor: string; floorColor: string; shadowColor: string; grain: number; craterDensity: number; craterScale: number; pebbleDensity: number; dustOpacity: number; trackOpacity: number }
export const LUNAR_GENERATOR_VERSION: "lunar-v1";
export const LUNAR_DEFAULT_SETTINGS: Readonly<LunarSettings>;
export const LUNAR_CONTROLS: readonly { key: "grain" | "craterDensity" | "craterScale" | "pebbleDensity" | "dustOpacity" | "trackOpacity"; label: string; min: number; max: number; step: number }[];
export function validateLunarSettings(value: unknown): LunarSettings;
