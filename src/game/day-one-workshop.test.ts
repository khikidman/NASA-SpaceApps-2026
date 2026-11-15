import { describe, expect, it } from "vitest";
import { applyAction, applyEffects, createGame } from "./engine";
import { DAY1_TASKS, validTutorialInput } from "../data/day-one";
import { filterConnected, workshopPuzzle, workshopTerms } from "../data/day-one-workshop";
import { WORKSHOP_LESSONS } from "../data/workshop-lessons";
import { getSource } from "../data/sources";
import { walkToNode } from "./test-helpers";
import { restoreGame, serializeGame } from "./save";
import type { TutorialInput } from "./types";
const inputs = (seed: number): TutorialInput[] => {
  const p = workshopPuzzle(seed);
  return [
    { revision: 2, kind: "repair", pairs: ["triangle", "circle", "square"], tuning: 50, proof: { frequency: p.frequency, phase: p.phase, tested: true } },
    { revision: 2, kind: "calibrate", placed: true, reading: 50, proof: { pad: p.pad, feet: p.feet, recorded: true } },
    { revision: 2, kind: "collect", pieces: ["ice-a", "ice-b", "ice-c"], proof: { scanned: ["ice-a", "ice-b", "ice-c"], cuts: p.cuts } },
    { revision: 2, kind: "assemble", parts: ["gear", "filter", "tray"], proof: { rotations: p.rotations, tested: true } },
    { revision: 2, kind: "convert", loaded: true, heat: 50, proof: { temperatures: p.temperatures, filtered: true } },
  ];
};
describe("Day 1 workshop proof and choices", () => {
  it("accepts both equivalent horizontal filter orientations and no vertical ones", () => {
    expect([0,1,2,3].map(filterConnected)).toEqual([false,true,false,true]);
    expect(filterConnected(NaN)).toBe(false); expect(filterConnected(5)).toBe(false);
  });
  it("gives every mission and the routine a traceable source and game simplification", () => {
    expect(Object.keys(WORKSHOP_LESSONS).sort()).toEqual([...DAY1_TASKS.map(t => t.id), "exercise"].sort());
    for (const note of Object.values(WORKSHOP_LESSONS)) {
      expect(note.sourceIds.length).toBeGreaterThan(0);
      for (const id of note.sourceIds) expect(getSource(id).url).toMatch(/^https:\/\/(science\.|spaceplace\.|www\.)?nasa\.gov\//);
      expect(note.gameNote.length).toBeGreaterThan(0);
    }
  });
  it("keeps layouts deterministic and varies new adventures", () => {
    expect(workshopPuzzle(12)).toEqual(workshopPuzzle(12));
    expect(new Set(Array.from({length: 12}, (_, seed) => JSON.stringify(workshopPuzzle(seed)))).size).toBeGreaterThan(8);
  });
  it("requires every richer task's complete evidence, including terminal tests", () => {
    for (const [i, input] of inputs(12).entries()) {
      expect(validTutorialInput(DAY1_TASKS[i], input, 12)).toBe(true);
      expect(validTutorialInput(DAY1_TASKS[i], { ...input, proof: undefined }, 12)).toBe(false);
    }
    const [radio, detector, ice, kitchen, melt] = inputs(12);
    if (radio.kind !== "repair" || detector.kind !== "calibrate" || ice.kind !== "collect" || kitchen.kind !== "assemble" || melt.kind !== "convert") throw new Error("Fixture mismatch");
    expect(validTutorialInput(DAY1_TASKS[0], { ...radio, proof: { ...radio.proof!, tested: false } }, 12)).toBe(false);
    expect(validTutorialInput(DAY1_TASKS[1], { ...detector, proof: { ...detector.proof!, feet: [9,9,9] } }, 12)).toBe(false);
    expect(validTutorialInput(DAY1_TASKS[2], { ...ice, proof: { ...ice.proof!, scanned: ["rock-a"] } }, 12)).toBe(false);
    expect(validTutorialInput(DAY1_TASKS[3], { ...kitchen, proof: { ...kitchen.proof!, rotations: [-1,0,0] } }, 12)).toBe(false);
    expect(validTutorialInput(DAY1_TASKS[4], { ...melt, proof: { ...melt.proof!, filtered: false } }, 12)).toBe(false);
  });
  it("rejects an invalid plan and a stale workshop result without charging", () => {
    const game = walkToNode(createGame(12), "solar-02"), before = structuredClone(game);
    expect(() => applyAction(game, { type: "tutorial-submit", taskId: "comms", input: { ...inputs(12)[0], plan: "free" } as unknown as TutorialInput })).toThrow();
    const input=inputs(12)[0];
    if(input.kind!=="repair")throw new Error("Fixture mismatch");
    expect(() => applyAction(game, { type: "tutorial-submit", taskId: "comms", input: { ...input, proof: { ...input.proof!, frequency: NaN } } })).toThrow();
    expect(game).toEqual(before);
  });
  it("requires the new sample check while keeping older accepted proofs replayable", () => {
    const melt = inputs(12)[4];
    if (melt.kind !== "convert") throw new Error("Fixture mismatch");
    expect(validTutorialInput(DAY1_TASKS[4], melt, 12)).toBe(true);
    expect(validTutorialInput(DAY1_TASKS[4], { ...melt, proof: { ...melt.proof!, checked: true } }, 12)).toBe(true);
    expect(validTutorialInput(DAY1_TASKS[4], { ...melt, proof: { ...melt.proof!, checked: false } }, 12)).toBe(false);
  });
  it("uses exactly the previewed costs and caps for both plans", () => {
    for (const plan of ["standard", "boost"] as const) {
      let game = createGame(12);
      for (const [i, task] of DAY1_TASKS.entries()) {
        game = walkToNode(game, task.nodeId);
        const terms = workshopTerms(task, plan), preview = applyEffects(game, terms.cost, terms.hours, terms.reward);
        game = applyAction(game, { type: "tutorial-submit", taskId: task.id, input: { ...inputs(12)[i], plan } });
        expect(game.resources).toEqual(preview.resources); expect(game.timeLeft).toBe(preview.timeLeft);
      }
      expect(restoreGame(serializeGame(game))).toEqual(game);
      expect(() => applyAction(game, {type:"tutorial-submit",taskId:"melt",input:inputs(12)[4]})).toThrow();
    }
  });
});
