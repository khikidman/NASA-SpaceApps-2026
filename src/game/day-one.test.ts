import { describe, expect, it } from "vitest";
import { applyAction, canEndDay, createGame } from "./engine";
import { DAY1_TASKS } from "../data/day-one";
import { walkToNode } from "./test-helpers";
import { getDailyEvent } from "../data/events";
import { restoreGame, serializeGame, SAVE_KEY, PREVIOUS_SAVE_KEY } from "./save";
import type { GameState, TutorialInput } from "./types";

const INPUTS: TutorialInput[] = [
  { kind: "repair", pairs: ["triangle", "circle", "square"], tuning: 50 },
  { kind: "calibrate", placed: true, reading: 50 },
  { kind: "collect", pieces: ["ice-a", "ice-b", "ice-c"] },
  { kind: "assemble", parts: ["gear", "filter", "tray"] },
  { kind: "convert", loaded: true, heat: 50 },
];
function completeMissions() {
  let game = createGame(1);
  for (const [index, task] of DAY1_TASKS.entries()) {
    game = walkToNode(game, task.nodeId);
    game = applyAction(game, { type: "tutorial-submit", taskId: task.id, input: INPUTS[index] });
    if (task.id === "ice") expect(game.tutorial.ice).toBe(3);
  }
  return game;
}
function rest(game: GameState) { return applyAction(game, { type: "end-day", choiceId: getDailyEvent(game).choices[0].id }); }

describe("Day 1 accepted-action integration", () => {
  it("completes the five ordered missions, converts ice once, and reaches Day 2 after exercise", () => {
    let game = completeMissions();
    expect(game.tutorial.completed).toEqual(DAY1_TASKS.map(t => t.id));
    expect(game.tutorial.ice).toBe(0); expect(game.dayKnowledge).toBe(15);
    expect(game.resources.science).toBe(16); expect(game.timeLeft).toBe(10.5);
    expect(canEndDay(game)).toBe(false);
    game = applyAction(game, { type: "tutorial-exercise", method: "cardio", repetitions: 4 });
    expect(game.timeLeft).toBe(8.5); expect(canEndDay(game)).toBe(true);
    expect(rest(game)).toMatchObject({ day: 2, resources: { energy: 100 }, tutorial: { exercise: "cardio" } });
  });
  it("rejects early missions, invalid input, generic bypasses, and duplicate rewards", () => {
    let game = createGame(1);
    expect(() => applyAction(game, { type: "tutorial-submit", taskId: "melt", input: INPUTS[4] })).toThrow();
    game = walkToNode(game, "solar-02"); const before = structuredClone(game);
    expect(() => applyAction(game, { type: "tutorial-submit", taskId: "comms", input: { kind: "repair", pairs: ["circle", "circle", "square"], tuning: 50 } })).toThrow();
    expect(game).toEqual(before);
    expect(() => applyAction(game, { type: "submit", nodeId: "solar-02", answers: [] })).toThrow();
    game = applyAction(game, { type: "tutorial-submit", taskId: "comms", input: INPUTS[0] });
    expect(() => applyAction(game, { type: "tutorial-submit", taskId: "comms", input: INPUTS[0] })).toThrow();
  });
  it("records an explicit skipped routine and applies the visible next-morning penalty", () => {
    const game = applyAction(completeMissions(), { type: "tutorial-exercise", method: "skip", repetitions: 0 });
    expect(canEndDay(game)).toBe(true);
    expect(rest(game)).toMatchObject({ day: 2, resources: { energy: 80 }, tutorial: { fatigue: true } });
    expect(() => applyAction(game, { type: "tutorial-exercise", method: "cardio", repetitions: 4 })).toThrow();
  });
  it("replays task outcomes exactly under a separate save key", () => {
    const game = completeMissions();
    expect(restoreGame(serializeGame(game))).toEqual(game);
    expect(SAVE_KEY).not.toBe(PREVIOUS_SAVE_KEY);
    expect(() => restoreGame(JSON.stringify({ version: 2, seed: 1, actions: [] }))).toThrow();
  });
  it("refills only at home, charges actual conversion cost, and rejects a full-tank repeat", () => {
    const game = applyAction(createGame(1), { type: "tutorial-refill" });
    expect(game.resources).toMatchObject({ oxygen: 100, power: 74 });
    expect(() => applyAction(game, { type: "tutorial-refill" })).toThrow();
    const away = applyAction(game, { type: "move", position: { col: 13, row: 13 } });
    expect(() => applyAction(away, { type: "tutorial-refill" })).toThrow();
  });
});
