import type { Art } from "@/components/game-art";
export const MISSION_VISUALS: Record<string, { art: Art; label: string }> = {
  samples: { art: "rock", label: "Rocks" }, safety: { art: "sensor", label: "Sensors" }, garden: { art: "plant", label: "Garden" },
};
export const OPTION_VISUALS: Record<string, { art: Art; label: string }> = {
  "craters-0": { art: "rock", label: "Space rocks" }, "craters-1": { art: "rain", label: "Rain" }, "craters-2": { art: "waves", label: "Waves" },
  "quake-0": { art: "rain", label: "Rain bucket" }, "quake-1": { art: "sensor", label: "Shake sensor" }, "quake-2": { art: "wind", label: "Windmill" },
  "plant-0": { art: "rock", label: "Rocks" }, "plant-1": { art: "dark", label: "Darkness" }, "plant-2": { art: "supplies", label: "Plant supplies" },
  "red-0": { art: "rust", label: "Rusty minerals" }, "red-1": { art: "berries", label: "Strawberries" }, "red-2": { art: "lamp", label: "A lamp" },
  "dust-0": { art: "water", label: "More water?" }, "dust-1": { art: "solar", label: "Less sunlight" }, "dust-2": { art: "rock", label: "A rock?" },
  "mars-air-0": { art: "outside", label: "Outside" }, "mars-air-1": { art: "greenhouse", label: "Greenhouse" }, "mars-air-2": { art: "box", label: "Dark box" },
  jar: { art: "jar", label: "Sample jar" }, air: { art: "air", label: "Air tank" }, camera: { art: "camera", label: "Camera" }, battery: { art: "battery", label: "Battery" },
  "moon-plan-0": { art: "air", label: "Check air" }, "moon-plan-1": { art: "sensor", label: "Place sensor" }, "moon-plan-2": { art: "home", label: "Bring home" },
  "moon-garden-0": { art: "tray", label: "Set up tray" }, "moon-garden-1": { art: "water", label: "Seeds + water" }, "moon-garden-2": { art: "lamp", label: "Grow light" },
  "mars-plan-0": { art: "battery", label: "Check power" }, "mars-plan-1": { art: "home", label: "Save power" }, "mars-plan-2": { art: "notes", label: "Study dust" },
  "mars-garden-0": { art: "lamp", label: "Check light" }, "mars-garden-1": { art: "water", label: "Water roots" }, "mars-garden-2": { art: "notes", label: "Record growth" },
};
export const STEP_PROMPTS: Record<string, string> = {
  craters: "What makes a crater?", quake: "Measure a moonquake", plant: "Help this plant grow", red: "Why is Mars red?", dust: "Dust covers a solar panel…", "mars-air": "Choose a home for plants",
  "moon-bag": "Pack for a walk", "mars-bag": "Pack for a walk", "moon-plan": "Plan your sensor trip", "moon-garden": "Build your space garden", "mars-plan": "Plan for dusty skies", "mars-garden": "Care for your plants",
};
