import { EVENTS, getEvent } from "../data/events";
import { MARS_MISSION, MISSIONS } from "../data/missions";
import { RESOURCE_KEYS, type Choice, type GameState, type Resources } from "./types";

export const RULESET_VERSION = 1;

function nextRandom(state: number): number {
  let value = state;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return value >>> 0;
}

function selectEvent(day: number, randomState: number, previousId?: string) {
  const eligible = EVENTS.filter((event) => event.minDay <= day && event.id !== previousId);
  const next = nextRandom(randomState);
  return { eventId: eligible[next % eligible.length].id, randomState: next };
}

export function getMission(id: string) {
  if (!Object.hasOwn(MISSIONS, id)) throw new Error(`Unknown mission: ${id}`);
  const mission = MISSIONS[id];
  if (!mission) throw new Error(`Unknown mission: ${id}`);
  return mission;
}

export function createGame(seed: number, missionId = MARS_MISSION.id): GameState {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new Error("Mission seed must be an unsigned 32-bit integer.");
  }
  const mission = getMission(missionId);
  const normalizedSeed = seed || 1;
  return {
    missionId,
    seed: normalizedSeed,
    day: 1,
    resources: { ...mission.initialResources },
    status: "playing",
    history: [],
    ...selectEvent(1, normalizedSeed),
  };
}

export function canAfford(resources: Resources, choice: Choice): boolean {
  return RESOURCE_KEYS.every((key) => resources[key] + (choice.effects[key] ?? 0) >= 0);
}

export function getChoices(state: GameState): readonly Choice[] {
  const choices = getEvent(state.eventId).choices;
  if (choices.some((choice) => canAfford(state.resources, choice))) return choices;
  return [{
    id: "emergency-rest",
    label: "Conserve supplies",
    description: "Supplies are too low for today's work. Skip the action; the event and daily upkeep still apply.",
    effects: {},
  }];
}

export function advanceTurn(state: GameState, choiceId: string): GameState {
  if (state.status !== "playing") throw new Error("This mission has already ended.");
  const mission = getMission(state.missionId);
  const event = getEvent(state.eventId);
  const choice = getChoices(state).find((entry) => entry.id === choiceId);
  if (!choice) throw new Error("That choice is not available for this event.");
  if (!canAfford(state.resources, choice)) throw new Error("Not enough supplies for that choice.");

  // Production/storage is capped before storm resolution and daily upkeep.
  const resources = { ...state.resources };
  for (const key of RESOURCE_KEYS) {
    resources[key] = Math.min(mission.capacity[key], Math.max(0, resources[key] + (choice.effects[key] ?? 0)));
  }
  const shieldAbsorbed = Math.min(resources.shielding, event.radiation);
  const emergencyOxygen = event.radiation - shieldAbsorbed;
  resources.shielding -= shieldAbsorbed;
  resources.oxygen -= emergencyOxygen;
  for (const key of RESOURCE_KEYS) {
    resources[key] = Math.min(mission.capacity[key], Math.max(0,
      resources[key] + (event.effects[key] ?? 0) + (mission.dailyEffects[key] ?? 0),
    ));
  }

  // Resolve survival before victory, including on the final day.
  const status = resources.oxygen <= 0 || resources.power <= 0
    ? "lost"
    : state.day === mission.duration ? "won" : "playing";
  const day = status === "playing" ? state.day + 1 : state.day;
  const selected = status === "playing"
    ? selectEvent(day, state.randomState, state.eventId)
    : { eventId: state.eventId, randomState: state.randomState };

  return {
    ...state,
    ...selected,
    day,
    resources,
    status,
    history: [...state.history, {
      day: state.day,
      eventId: event.id,
      eventTitle: event.title,
      choiceId,
      choiceLabel: choice.label,
      before: { ...state.resources },
      after: { ...resources },
      shieldAbsorbed,
      emergencyOxygen,
    }],
  };
}
