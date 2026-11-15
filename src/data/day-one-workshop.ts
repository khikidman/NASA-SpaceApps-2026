import type { TutorialTask } from "./day-one";
import type { TutorialInput, TutorialPlan } from "../game/types";

/** [TUNE] Authored game targets. These are not instrument readings or NASA data. */
export function workshopPuzzle(seed: number) {
  const pick = (salt: number) => {
    let n = (seed ^ Math.imul(salt, 374761393)) >>> 0;
    n = Math.imul(n ^ n >>> 13, 1274126177) >>> 0;
    return (n ^ n >>> 16) >>> 0;
  };
  // Keep modulo explicit: bitwise coercion is only used for the seed hash.
  const index = (salt: number, count: number) => pick(salt) % count;
  const wireOrder = ["circle", "square", "triangle"];
  for (let i = 2; i > 0; i--) { const j = index(20 + i, i + 1); [wireOrder[i], wireOrder[j]] = [wireOrder[j], wireOrder[i]]; }
  const deposits = ["ice-a", "rock-a", "ice-b", "rock-b", "ice-c"];
  for (let i = 4; i > 0; i--) { const j = index(40 + i, i + 1); [deposits[i], deposits[j]] = [deposits[j], deposits[i]]; }
  return {
    wireOrder, frequency: [30, 50, 70][index(1, 3)], phase: [25, 50, 75][index(2, 3)],
    pad: index(3, 3), feet: [index(4, 3), index(5, 3), index(6, 3)],
    deposits, cuts: [index(7, 4), index(8, 4), index(9, 4)],
    rotations: [index(10, 4), index(11, 4), index(12, 4)],
    temperatures: [[30, 55, 70], [65, 40, 55], [45, 70, 35]][index(13, 3)],
  };
}
export const nearTarget = (value: unknown, target: number, tolerance = 5) => typeof value === "number" && Number.isFinite(value) && Math.abs(value - target) <= tolerance;
/** The filter is a straight teaching connection with no required flow direction. */
export const filterConnected = (rotation: number) => Number.isInteger(rotation) && rotation >= 0 && rotation < 4 && rotation % 2 === 1;
const matches = (actual: unknown, expected: number[]) => Array.isArray(actual) && actual.length === expected.length && actual.every((n, i) => n === expected[i]);
export function validWorkshopProof(input: TutorialInput, seed: number) {
  // Original actions must replay unchanged. Any new metadata opts into full validation.
  if (input.revision === undefined && input.plan === undefined && input.proof === undefined) return true;
  if (input.revision !== 2 || input.plan !== undefined && input.plan !== "standard" && input.plan !== "boost") return false;
  const p = workshopPuzzle(seed);
  switch (input.kind) {
    case "repair": return !!input.proof && nearTarget(input.proof.frequency, p.frequency) && nearTarget(input.proof.phase, p.phase) && input.proof.tested === true;
    case "calibrate": return !!input.proof && input.proof.pad === p.pad && matches(input.proof.feet, p.feet) && input.proof.recorded === true;
    case "collect": {
      const proof = input.proof;
      return !!proof && Array.isArray(proof.scanned) && ["ice-a", "ice-b", "ice-c"].every(id => proof.scanned.includes(id)) && matches(proof.cuts, p.cuts);
    }
    case "assemble": return !!input.proof && matches(input.proof.rotations, p.rotations) && input.proof.tested === true;
    case "convert": return !!input.proof && Array.isArray(input.proof.temperatures) && input.proof.temperatures.length === 3 && input.proof.temperatures.every((n, i) => nearTarget(n, p.temperatures[i])) && input.proof.filtered === true && (input.proof.checked === undefined || input.proof.checked === true);
  }
}

/** Shared preview/commit terms. Defaults preserve every original v3 action. */
export function workshopTerms(task: TutorialTask, plan: TutorialPlan = "standard") {
  if (plan === "standard") return { cost: task.cost, hours: task.hours, reward: task.reward };
  return { cost: { ...task.cost, power: (task.cost.power ?? 0) - 3, energy: (task.cost.energy ?? 0) + 3 }, hours: Math.max(.25, task.hours - .25), reward: task.reward };
}
