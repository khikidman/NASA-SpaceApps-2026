import { DAY1_CONFIG, DAY1_TASKS, isDayOne, nextDayOneTask, validTutorialInput } from "../data/day-one";
import { adjacent } from "../world/exploration";
import { atHomeDoor } from "../world/home";
import { createOutpost } from "../world/map";
import type { GameAction, GameState, ResourceDelta } from "./types";

type TutorialAction = Extract<GameAction, { type: "tutorial-submit" | "tutorial-exercise" | "tutorial-refill" }>;
type ApplyEffects = (state: GameState, effects: ResourceDelta, hours: number, reward?: number) => GameState;
/** Called only through the shared accepted-action boundary. No clock or UI state. */
export function applyTutorialAction(state: GameState, action: TutorialAction, effects: ApplyEffects): GameState {
  if (!isDayOne(state)) throw new Error("This tutorial is for your first Moon day.");
  const world = createOutpost(state.seed, state.missionId), atBase = atHomeDoor(state.position, world.home);
  if (action.type === "tutorial-refill") {
    if (!atBase) throw new Error("Refill at your base door.");
    if (state.resources.power <= 1) throw new Error("Keep a little power for life support.");
    if (state.resources.oxygen >= 100) throw new Error("Your air tank is full.");
    return { ...effects(state, { ...DAY1_CONFIG.refillCost, oxygen: 100 - state.resources.oxygen }, 0), feedback: "Air tank filled." };
  }
  if (action.type === "tutorial-exercise") {
    if (!atBase || state.tutorial.completed.length !== DAY1_TASKS.length || state.tutorial.exercise !== "pending") throw new Error("Finish five missions, then return home for your routine.");
    if (!["skip", "cardio", "weights"].includes(action.method)) throw new Error("Choose a routine.");
    if (action.method === "skip") return { ...state, tutorial: { ...state.tutorial, exercise: "skipped", fatigue: true }, feedback: "Tomorrow starts with less Energy." };
    if (action.repetitions !== 4) throw new Error("Complete four gentle repetitions first.");
    const next = effects(state, DAY1_CONFIG.exerciseCost, DAY1_CONFIG.exerciseHours, DAY1_CONFIG.exerciseReward);
    return { ...next, tutorial: { ...state.tutorial, exercise: action.method, fatigue: false },
      discoveries: [...next.discoveries, { world: "moon", day: 1, fact: "Exercise helps astronauts keep their bones and muscles strong.", sourceId: "exercise" }], feedback: "Routine complete!" };
  }
  const task = nextDayOneTask(state);
  if (!task || task.id !== action.taskId) throw new Error("Follow your current mission first. Completed work is saved.");
  const node = world.entities.find((n) => n.id === task.nodeId)!;
  if (task.inside ? !atBase : !adjacent(state.position, node.position)) throw new Error(task.inside ? "Return to the base door first." : "Walk beside your mission marker first.");
  if (!validTutorialInput(task, action.input)) throw new Error("Try again. Aim for the center. No supplies were used.");
  if (task.id === "melt" && state.tutorial.ice !== 3) throw new Error("Bring your ice bucket home first.");
  const next = effects(state, task.cost, task.hours, task.reward);
  return { ...next, discoveries: task.id === "ice" ? [...next.discoveries, { world: "moon", day: 1, fact: "The Moon has no wind or rain.", sourceId: "moon-weather" }] : next.discoveries, tutorial: { ...state.tutorial, completed: [...state.tutorial.completed, task.id],
    ice: task.id === "ice" ? 3 : task.id === "melt" ? 0 : state.tutorial.ice },
    feedback: task.id === "comms" ? "Radio ready! Place the detector." : task.id === "detector" ? "Detector ready! Find the ice." : task.id === "ice" ? "Bring your ice home." : task.id === "food" ? "Kitchen ready! Melt your ice." : "Your base is working!" };
}
