import { describe, expect, it } from "vitest";
import { EVENTS, getDailyEvent } from "../data/events";
import { MISSIONS } from "../data/missions";
import { TASKS } from "../data/tasks";
import { SOURCES } from "../data/sources";
import { createOutpost } from "../world/map";
import { applyAction, canEndDay, checkAnswer, createGame, previewNight } from "./engine";
import { finishTask, playDay, walkToNode } from "./test-helpers";
import { RESOURCE_KEYS } from "./types";
const regularGame = (seed: number) => ({ ...createGame(seed), day: 2 });
describe("learning journey", () => {
  it("starts on Moon day 1, rejects early travel and finishing without learning", () => {
    const game = createGame(10);
    expect(game).toMatchObject({ missionId: "moon", day: 1, timeLeft: 16, knowledgeEarned: 0 });
    expect(game.resources.science).toBe(6);
    expect(() => applyAction(game, { type: "travel" })).toThrow("7 Moon days");
    expect(() => applyAction(game, { type: "end-day", choiceId: "recycle" })).toThrow("five missions");
    for (const seed of [-1, 1.5, NaN, Infinity, 0x100000000]) expect(() => createGame(seed)).toThrow();
  });
  it("validates movement and collection proximity; caps tanks and prevents farming", () => {
    const original = createGame(2); const snapshot = structuredClone(original);
    expect(() => applyAction(original, { type: "collect", nodeId: "oxygen-01" })).toThrow("beside");
    expect(() => applyAction(original, { type: "move", position: { col: 15, row: 13 } })).toThrow("one clear square");
    expect(() => applyAction(original, { type: "move", position: { col: 12, row: 12 } })).toThrow();
    let game = walkToNode(original, "oxygen-01");
    game = { ...game, resources: { ...game.resources, oxygen: 95 } };
    game = applyAction(game, { type: "collect", nodeId: "oxygen-01" });
    expect(game.resources.oxygen).toBe(100); expect(game.resources.power).toBe(72); expect(game.timeLeft).toBe(15);
    expect(() => applyAction(game, { type: "collect", nodeId: "oxygen-01" })).toThrow("used this stop");
    expect(original).toEqual(snapshot);
  });
  it("charges each successful subtask and counts gross knowledge separately from the bank", () => {
    let game = walkToNode(regularGame(2), "lab-01");
    const before = structuredClone(game);
    expect(() => applyAction(game, { type: "submit", nodeId: "lab-01", answers: ["craters-1"] })).toThrow("No supplies were used");
    expect(game).toEqual(before);
    game = applyAction(game, { type: "submit", nodeId: "lab-01", answers: ["craters-0"] });
    expect(game.resources.science).toBe(10); expect(game.knowledgeEarned).toBe(5); expect(game.timeLeft).toBe(14); expect(canEndDay(game)).toBe(false);
    game = applyAction(game, { type: "submit", nodeId: "lab-01", answers: ["jar", "air", "camera"] });
    expect(game.resources.science).toBe(16); expect(game.knowledgeEarned).toBe(13); expect(canEndDay(game)).toBe(true);
    expect(game.discoveries).toHaveLength(2);
    expect(() => applyAction(game, { type: "submit", nodeId: "lab-01", answers: ["jar", "air"] })).toThrow("finished this challenge");
  });
  it("enforces knowledge and time costs even when an optional item rewards knowledge", () => {
    const game = walkToNode(regularGame(1), "lab-01");
    const step = TASKS.moon[0].steps[1];
    const second = { ...game, taskProgress: { samples: 1 }, resources: { ...game.resources, science: 1 } };
    expect(() => applyAction(second, { type: "submit", nodeId: "lab-01", answers: ["jar", "air", "camera"] })).toThrow("more supplies or knowledge");
    expect(checkAnswer(step, ["jar", "air", "battery"])).toBe(false);
    expect(checkAnswer(step, ["jar", "air", "air"])).toBe(false);
    expect(checkAnswer(step, ["jar", "air", "invented"])).toBe(false);
    expect(() => applyAction({ ...game, timeLeft: 1 }, { type: "submit", nodeId: "lab-01", answers: ["craters-0"] })).toThrow("work hours");
  });
  it("supports all six challenges and validates sequence order", () => {
    for (const missionId of ["moon", "mars"] as const) {
      for (const task of TASKS[missionId]) {
        const game = { ...regularGame(1), missionId };
        const node = createOutpost(1, missionId).entities.find((n) => n.interaction.type === "task" && n.interaction.taskId === task.id)!;
        const after = finishTask(game, node.id);
        expect(after.taskProgress[task.id]).toBe(2); expect(canEndDay(after)).toBe(true);
        for (const step of task.steps) {
          expect(checkAnswer(step, [...step.answer])).toBe(true);
          if (step.kind === "order") expect(checkAnswer(step, [...step.answer].reverse())).toBe(false);
        }
      }
    }
  });
  it("allows a limited daily learning boost and chooses world events from conditions", () => {
    const game = applyAction(regularGame(1), { type: "learn" });
    expect(game.dayKnowledge).toBe(2); expect(game.timeLeft).toBe(14);
    expect(() => applyAction(game, { type: "learn" })).toThrow("read today");
    expect(getDailyEvent({ ...game, day: 2 }).id).toBe("moonquake");
    expect(getDailyEvent({ ...game, missionId: "mars", day: 2 }).id).toBe("mars-dust");
    expect(getDailyEvent({ ...game, resources: { ...game.resources, water: 20 } }).id).toBe("water-low");
    expect(getDailyEvent({ ...game, day: 3, resources: { ...game.resources, shielding: 5 } }).id).toBe("sun-alert");
  });
  it("previews all night changes and resolves survival before a final-day unlock", () => {
    const game = { ...finishTask(regularGame(1)), day: 7 };
    const preview = previewNight(game, "recycle"); const after = applyAction(game, { type: "end-day", choiceId: "recycle" });
    expect(after.resources).toEqual(preview.resources); expect(after.status).toBe("level-complete");
    expect(after.history[0].after).not.toBe(after.resources);
    const noStars = { ...game, day: 2, resources: { ...game.resources, science: 0 } };
    expect(previewNight(noStars, "listen").affordable).toBe(false);
    expect(() => applyAction(noStars, { type: "end-day", choiceId: "listen" })).toThrow("more supplies or stars");
    const low = { ...game, resources: { ...game.resources, oxygen: 4 } };
    expect(applyAction(low, { type: "end-day", choiceId: "recycle" }).status).toBe("lost");
  });
  it("completes exactly seven days per world with a repeatable, legal survival strategy", () => {
    for (const seed of [1, 17, 1234, 4294967295]) {
      let game = createGame(seed);
      for (let i = 0; i < 7; i++) { game = playDay(game); if (i < 6) expect(game.missionId).toBe("moon"); }
      expect(game.status).toBe("level-complete"); expect(game.history).toHaveLength(7); expect(game.day).toBe(7);
      const score = game.knowledgeEarned; const stars = game.resources.science;
      game = applyAction(game, { type: "travel" });
      expect(game).toMatchObject({ missionId: "mars", day: 1, knowledgeEarned: score, resources: { science: stars } });
      for (const key of ["oxygen", "water", "power", "shielding"] as const) expect(game.resources[key]).toBe(100);
      for (let i = 0; i < 7; i++) game = playDay(game);
      expect(game.status).toBe("won"); expect(game.history).toHaveLength(14); expect(game.completedLevels).toEqual(["moon", "mars"]);
      expect(game.discoveries).toHaveLength(28);
      for (const key of RESOURCE_KEYS) expect(game.resources[key]).toBeLessThanOrEqual(MISSIONS.mars.capacity[key]);
      expect(() => applyAction(game, { type: "learn" })).toThrow("finished");
    }
  });
});
describe("educational content integrity", () => {
  it("uses known sources, unique IDs, and positive knowledge costs and rewards", () => {
    for (const event of EVENTS) { expect(SOURCES.some((s) => s.id === event.sourceId)).toBe(true); expect(new Set(event.choices.map((c) => c.id)).size).toBe(event.choices.length); }
    for (const tasks of Object.values(TASKS)) for (const task of tasks) for (const step of task.steps) {
      expect(SOURCES.some((s) => s.id === step.sourceId)).toBe(true);
      expect(step.cost.science).toBeLessThan(0); expect(step.reward).toBeGreaterThan(Math.abs(step.cost.science!));
      expect(new Set(step.options.map((o) => o.id)).size).toBe(step.options.length);
    }
  });
});
