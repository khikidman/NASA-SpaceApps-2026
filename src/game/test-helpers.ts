import { DAY1_TASKS, isDayOne } from "../data/day-one";
import { getDailyEvent } from "../data/events";
import { getTask, RESOURCE_NODES } from "../data/tasks";
import { adjacent, walkable } from "../world/exploration";
import { createOutpost } from "../world/map";
import type { GridPosition } from "../world/types";
import { applyAction } from "./engine";
import type { GameState, TutorialInput } from "./types";
/** Exercise legal movement and node actions, rather than editing scores or unlocks. */
export function walkToNode(state: GameState, nodeId: string): GameState {
  const world = createOutpost(state.seed, state.missionId);
  const node = world.entities.find((n) => n.id === nodeId)!;
  const queue: { at: GridPosition; path: GridPosition[] }[] = [{ at: state.position, path: [] }];
  const seen = new Set<string>();
  for (let i = 0; i < queue.length; i++) {
    const { at, path } = queue[i];
    if (adjacent(at, node.position)) return path.reduce((game, position) => applyAction(game, { type: "move", position }), state);
    for (const [dc, dr] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const target = { col: at.col + dc, row: at.row + dr }; const key = `${target.col},${target.row}`;
      if (!seen.has(key) && walkable(world, target)) { seen.add(key); queue.push({ at: target, path: [...path, target] }); }
    }
  }
  throw new Error("Node unreachable");
}
export function finishTask(state: GameState, nodeId = "lab-01"): GameState {
  state = walkToNode(state, nodeId);
  const node = createOutpost(state.seed, state.missionId).entities.find((n) => n.id === nodeId)!;
  if (node.interaction.type !== "task") throw new Error("Not a task");
  const task = getTask(state.missionId, node.interaction.taskId);
  for (const step of task.steps.slice(state.taskProgress[task.id] ?? 0)) state = applyAction(state, { type: "submit", nodeId, answers: [...step.answer] });
  return state;
}
export function playDay(state: GameState): GameState {
  if (isDayOne(state)) {
    const inputs: TutorialInput[] = [
      { kind: "repair", pairs: ["triangle", "circle", "square"], tuning: 50 },
      { kind: "calibrate", placed: true, reading: 50 },
      { kind: "collect", pieces: ["ice-a", "ice-b", "ice-c"] },
      { kind: "assemble", parts: ["gear", "filter", "tray"] },
      { kind: "convert", loaded: true, heat: 50 },
    ];
    for (const [index, task] of DAY1_TASKS.entries()) {
      state = walkToNode(state, task.nodeId);
      state = applyAction(state, { type: "tutorial-submit", taskId: task.id, input: inputs[index] });
    }
    state = applyAction(state, { type: "tutorial-exercise", method: "cardio", repetitions: 4 });
    return applyAction(state, { type: "end-day", choiceId: getDailyEvent(state).choices[0].id });
  }
  for (const [nodeId, config] of Object.entries(RESOURCE_NODES)) {
    if (state.resources[config.resource] < (config.resource === "science" ? 10000 : 100)) {
      state = walkToNode(state, nodeId); state = applyAction(state, { type: "collect", nodeId });
    }
  }
  state = finishTask(state);
  return applyAction(state, { type: "end-day", choiceId: getDailyEvent(state).choices[0].id });
}
