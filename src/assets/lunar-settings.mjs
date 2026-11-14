export const LUNAR_GENERATOR_VERSION = "lunar-v1";
export const LUNAR_DEFAULT_SETTINGS = Object.freeze({ baseColor: "#999895", rimColor: "#d0cec0", floorColor: "#a8a79b", shadowColor: "#52534f", grain: 11, craterDensity: 1, craterScale: 1, pebbleDensity: 1, dustOpacity: 1, trackOpacity: 1 });
export const LUNAR_CONTROLS = Object.freeze([
  { key: "grain", label: "Dust grain", min: 0, max: 30, step: 1 },
  { key: "craterDensity", label: "Crater density", min: 0, max: 2.5, step: .1 },
  { key: "craterScale", label: "Crater size", min: .4, max: 1.8, step: .05 },
  { key: "pebbleDensity", label: "Scattered rocks", min: 0, max: 3, step: .1 },
  { key: "dustOpacity", label: "Dust patches", min: 0, max: 2, step: .1 },
  { key: "trackOpacity", label: "Wheel / boot tracks", min: 0, max: 1, step: .05 },
]);
export function validateLunarSettings(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Missing lunar settings.");
  if (Object.keys(value).sort().join() !== Object.keys(LUNAR_DEFAULT_SETTINGS).sort().join()) throw new Error("The lunar setting names do not match this generator.");
  for (const key of ["baseColor", "rimColor", "floorColor", "shadowColor"]) if (typeof value[key] !== "string" || !/^#[0-9a-f]{6}$/i.test(value[key])) throw new Error(`Invalid ${key}. Use a six-digit hex color.`);
  for (const field of LUNAR_CONTROLS) if (typeof value[field.key] !== "number" || !Number.isFinite(value[field.key]) || value[field.key] < field.min || value[field.key] > field.max) throw new Error(`${field.label} must be between ${field.min} and ${field.max}.`);
  return { ...value };
}
