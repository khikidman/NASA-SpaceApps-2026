import modules from "../buildings/lunar-base-modules.json";

/** Astronaut height as a fraction of the clear exterior airlock doorway height. */
export const ASTRONAUT_DOOR_HEIGHT_RATIO = .82;
const door = modules.airlock;
export const AIRLOCK_OPENING_WORLD_HEIGHT = door.openingHeight * door.displayWidth / door.pixelWidth;
export const ASTRONAUT_WORLD_HEIGHT = AIRLOCK_OPENING_WORLD_HEIGHT * ASTRONAUT_DOOR_HEIGHT_RATIO;
export const ASTRONAUT_WALK_CYCLES_PER_TILE = .5;
export const ASTRONAUT_SHEET_SRC = "/assets/characters/astronaut-sheet-v1.png";
