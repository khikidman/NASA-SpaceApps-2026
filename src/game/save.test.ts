import { describe, expect, it } from "vitest";
import { advanceTurn, canAfford, createGame, getChoices } from "./engine";
import { restoreGame, serializeGame } from "./save";

describe("versioned mission saves", () => {
  it("restores an in-progress mission with identical future behavior", () => {
    let original = createGame(42);
    for (let turn = 0; turn < 4; turn++) {
      const choice = getChoices(original).find((entry) => canAfford(original.resources, entry))!;
      original = advanceTurn(original, choice.id);
    }
    const restored = restoreGame(serializeGame(original));
    expect(restored).toEqual(original);
    const choice = getChoices(original).find((entry) => canAfford(original.resources, entry))!;
    expect(advanceTurn(restored, choice.id)).toEqual(advanceTurn(original, choice.id));
  });

  it("rejects malformed, oversized, incompatible, or unknown mission saves", () => {
    const valid = JSON.parse(serializeGame(createGame(1)));
    for (const raw of ["broken json", "null", "[]", " ".repeat(20_001), JSON.stringify({ ...valid, version: 99 }), JSON.stringify({ ...valid, datasetVersion: "old" }), JSON.stringify({ ...valid, rulesetVersion: 99 }), JSON.stringify({ ...valid, missionId: "unknown" }), JSON.stringify({ ...valid, missionId: "__proto__" }), JSON.stringify({ ...valid, missionId: "constructor" }), JSON.stringify({ ...valid, seed: -1 }), JSON.stringify({ ...valid, choices: [42] }), JSON.stringify({ ...valid, choices: ["invented-choice"] }), JSON.stringify({ ...valid, choices: Array(16).fill("make-oxygen") })]) {
      expect(() => restoreGame(raw)).toThrow();
    }
  });

  it("ignores forged resource totals and reconstructs the state from legal actions", () => {
    const initial = createGame(123);
    const payload = { ...JSON.parse(serializeGame(initial)), resources: { oxygen: 9999, power: 9999, shielding: 9999, science: 9999 } };
    expect(restoreGame(JSON.stringify(payload))).toEqual(initial);
  });

  it("restores a finished mission and rejects actions after its ending", () => {
    let state = createGame(24);
    while (state.status === "playing") {
      const choice = getChoices(state).find((entry) => canAfford(state.resources, entry))!;
      state = advanceTurn(state, choice.id);
    }
    expect(restoreGame(serializeGame(state))).toEqual(state);
    const payload = JSON.parse(serializeGame(state));
    payload.choices.push(state.history.at(-1)!.choiceId);
    expect(() => restoreGame(JSON.stringify(payload))).toThrow();
  });
});
