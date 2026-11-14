import { describe, expect, it } from "vitest";
import { EVENTS, getEvent } from "../data/events";
import { MARS_MISSION } from "../data/missions";
import { SOURCES } from "../data/sources";
import { advanceTurn, canAfford, createGame, getChoices } from "./engine";
import { RESOURCE_KEYS, type GameState } from "./types";

// A simple survival-oriented policy, independent of the event-selection algorithm.
function survivalChoice(state: GameState) {
  return getChoices(state)
    .filter((choice) => canAfford(state.resources, choice))
    .map((choice) => {
      const next = advanceTurn(state, choice.id);
      const { oxygen, power, shielding, science } = next.resources;
      const value = next.status === "lost" ? -1_000_000
        : Math.min(oxygen, 65) * 2 + Math.min(power, 45) * 1.5 + Math.min(shielding, 24) * 0.3 + science * 0.05;
      return { choice, value };
    })
    .sort((left, right) => right.value - left.value)[0].choice.id;
}

describe("mission simulation", () => {
  it("produces the same sequence and outcomes from the same seed and decisions", () => {
    let first = createGame(1234);
    let second = createGame(1234);
    while (first.status === "playing") {
      const choice = survivalChoice(first);
      first = advanceTurn(first, choice);
      second = advanceTurn(second, choice);
    }
    expect(first).toEqual(second);
  });

  it("leaves the previous state and its resource snapshots unchanged", () => {
    const before = createGame(12);
    const snapshot = structuredClone(before);
    const after = advanceTurn(before, getEvent(before.eventId).choices[0].id);
    after.resources.oxygen = 1;
    expect(before).toEqual(snapshot);
    expect(after.history[0].before).toEqual(snapshot.resources);
    expect(after.history[0].after.oxygen).not.toBe(1);
  });

  it("caps action production before applying daily consumption", () => {
    const state = { ...createGame(1), eventId: "settle-in", resources: { oxygen: 95, power: 70, shielding: 40, science: 0 } };
    const next = advanceTurn(state, "make-oxygen");
    expect(next.resources).toEqual({ oxygen: 94, power: 66, shielding: 40, science: 0 });
  });

  it("absorbs storm impact with shielding and uses oxygen for the remainder", () => {
    const state = { ...createGame(1), day: 3, eventId: "solar-alert", resources: { oxygen: 75, power: 70, shielding: 5, science: 0 } };
    const next = advanceTurn(state, "observe");
    expect(next.resources).toEqual({ oxygen: 53, power: 68, shielding: 0, science: 20 });
    expect(next.history[0]).toMatchObject({ shieldAbsorbed: 5, emergencyOxygen: 13 });
    expect(next.status).toBe("playing");
  });

  it("rejects unavailable choices, unaffordable actions, and invalid seeds", () => {
    expect(() => advanceTurn(createGame(1), "invented-choice")).toThrow("not available");
    const poor = { ...createGame(1), eventId: "settle-in", resources: { oxygen: 75, power: 5, shielding: 0, science: 0 } };
    expect(() => advanceTurn(poor, "make-oxygen")).toThrow("Not enough supplies");
    for (const seed of [-1, 1.5, Number.NaN, Infinity, 0x100000000]) expect(() => createGame(seed)).toThrow();
    expect(createGame(0)).toEqual(createGame(1));
  });

  it("prioritizes survival over victory on the final sol", () => {
    const state = { ...createGame(1), day: 15, eventId: "settle-in", resources: { oxygen: 7, power: 70, shielding: 0, science: 0 } };
    const next = advanceTurn(state, "study-rocks");
    expect(next.status).toBe("lost");
    expect(next.resources.oxygen).toBe(0);
    expect(() => advanceTurn(next, "study-rocks")).toThrow("already ended");
  });

  it("always allows a turn to resolve even when normal choices are unaffordable", () => {
    for (const event of EVENTS) {
      const state = { ...createGame(1), eventId: event.id, resources: { oxygen: 1, power: 1, shielding: 0, science: 0 } };
      const choices = getChoices(state);
      expect(choices.some((choice) => canAfford(state.resources, choice))).toBe(true);
      const available = choices.find((choice) => canAfford(state.resources, choice))!;
      expect(() => advanceTurn(state, available.id)).not.toThrow();
    }
    expect(() => advanceTurn(createGame(1), "emergency-rest")).toThrow("not available");
  });

  it("supports a winning strategy across 200 seeds and keeps resources within bounds", () => {
    for (let seed = 1; seed <= 200; seed++) {
      let state = createGame(seed);
      while (state.status === "playing") {
        const event = getEvent(state.eventId);
        expect(event.minDay).toBeLessThanOrEqual(state.day);
        if (state.history.length) expect(event.id).not.toBe(state.history.at(-1)?.eventId);
        state = advanceTurn(state, survivalChoice(state));
        for (const key of RESOURCE_KEYS) {
          expect(state.resources[key]).toBeGreaterThanOrEqual(0);
          expect(state.resources[key]).toBeLessThanOrEqual(MARS_MISSION.capacity[key]);
        }
      }
      expect(state.status, `seed ${seed}`).toBe("won");
      expect(state.history).toHaveLength(15);
      expect(state.day).toBe(15);
      expect(() => advanceTurn(state, "make-oxygen")).toThrow("already ended");
    }
  });
});

describe("curated content integrity", () => {
  it("has unique event/choice IDs, valid source references, and finite integer game values", () => {
    expect(new Set(EVENTS.map((event) => event.id)).size).toBe(EVENTS.length);
    for (const event of EVENTS) {
      expect(SOURCES.some((source) => source.id === event.sourceId)).toBe(true);
      expect(event.choices.length).toBeGreaterThanOrEqual(2);
      expect(new Set(event.choices.map((choice) => choice.id)).size).toBe(event.choices.length);
      expect(event.radiation).toBeGreaterThanOrEqual(0);
      for (const effects of [event.effects, ...event.choices.map((choice) => choice.effects)]) {
        for (const [key, value] of Object.entries(effects)) {
          expect(RESOURCE_KEYS).toContain(key);
          expect(Number.isInteger(value)).toBe(true);
        }
      }
    }
  });
});
