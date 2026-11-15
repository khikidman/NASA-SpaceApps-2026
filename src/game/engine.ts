import { getDailyEvent } from "../data/events";
import { DAILY_KNOWLEDGE_GOAL, MISSIONS, WORK_HOURS } from "../data/missions";
import { getTask, RESOURCE_NODES, TASKS } from "../data/tasks";
import { adjacent, walkable } from "../world/exploration";
import { createOutpost } from "../world/map";
import { RESOURCE_KEYS, type GameAction, type GameState, type ResourceDelta, type Resources, type TaskStep, type WorldId } from "./types";
import { DAY1_CONFIG, DAY1_TASKS, isDayOne, remainingDayOneHours } from "../data/day-one";
import { applyTutorialAction } from "./tutorial";
export const RULESET_VERSION = 3;
export function getMission(id: string) {
  if (id !== "moon" && id !== "mars") throw new Error("Unknown world.");
  return MISSIONS[id];
}
export function createGame(seed: number): GameState {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error("Invalid journey seed.");
  return {
    seed: seed || 1, missionId: "moon", day: 1, resources: { ...MISSIONS.moon.initialResources }, status: "playing",
    position: { col: 12, row: 13 }, steps: 0, timeLeft: WORK_HOURS,
    knowledgeEarned: 0, levelKnowledge: 0, dayKnowledge: 0, collectedNodes: [], taskProgress: {}, learnedToday: false,
    discoveries: [], completedLevels: [], history: [], actions: [],
    tutorial: { completed: [], ice: 0, exercise: "pending", fatigue: false },
    // [FACT_NEEDED: moonquake cause] Authored story event, not a causal science claim.
    feedback: "You landed! A moonquake shook the base. Let’s fix the radio.",
  };
}
export function canAfford(resources: Resources, effects: ResourceDelta): boolean {
  return RESOURCE_KEYS.every((key) => resources[key] + (effects[key] ?? 0) >= 0);
}
export function completedTasks(state: GameState): number {
  if (isDayOne(state)) return state.tutorial.completed.length;
  return TASKS[state.missionId].filter((t) => (state.taskProgress[t.id] ?? 0) >= t.steps.length).length;
}
export function canEndDay(state: GameState): boolean {
  if (isDayOne(state)) return state.status === "playing" && state.tutorial.completed.length === DAY1_TASKS.length && state.dayKnowledge >= DAY1_CONFIG.scienceGoal && state.tutorial.exercise !== "pending";
  return state.status === "playing" && state.dayKnowledge >= DAILY_KNOWLEDGE_GOAL && completedTasks(state) >= 1;
}
export function sumEffects(...effects: ResourceDelta[]): ResourceDelta {
  return Object.fromEntries(RESOURCE_KEYS.map((key) => [key, effects.reduce((total, effect) => total + (effect[key] ?? 0), 0)]));
}
export function taskEffects(step: TaskStep, answers: readonly string[]) {
  return sumEffects(step.cost, ...step.options.filter((o) => answers.includes(o.id)).map((o) => ({ ...o.effects, science: Math.min(0, o.effects?.science ?? 0) })));
}
export function checkAnswer(step: TaskStep, answers: readonly string[]): boolean {
  if (!Array.isArray(answers) || new Set(answers).size !== answers.length || answers.some((a) => !step.options.some((o) => o.id === a))) return false;
  if (step.kind === "order") return answers.length === step.answer.length && answers.every((a, i) => a === step.answer[i]);
  if (step.kind === "pick") return answers.length === 1 && answers[0] === step.answer[0];
  return step.answer.every((a) => answers.includes(a)) && step.options.filter((o) => answers.includes(o.id)).reduce((n, o) => n + (o.weight ?? 0), 0) <= (step.budget ?? 0);
}
export function applyEffects(state: GameState, effects: ResourceDelta, hours: number, reward = 0): GameState {
  if (state.timeLeft < hours) throw new Error("Not enough work hours. Finish a shorter task or get ready for bed.");
  if (!canAfford(state.resources, effects)) throw new Error("You need more supplies or knowledge stars for this plan. Try a supply stop first.");
  const resources = { ...state.resources };
  for (const key of RESOURCE_KEYS) resources[key] = Math.min(MISSIONS[state.missionId].capacity[key], resources[key] + (effects[key] ?? 0) + (key === "science" ? reward : 0));
  const earned = Math.max(0, effects.science ?? 0) + reward;
  return { ...state, resources, timeLeft: state.timeLeft - hours, knowledgeEarned: state.knowledgeEarned + earned,
    levelKnowledge: state.levelKnowledge + earned, dayKnowledge: state.dayKnowledge + earned };
}
export function previewNight(state: GameState, choiceId: string) {
  const event = getDailyEvent(state);
  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) throw new Error("Choose one of tonight’s plans.");
  // Every night: report costs 2 stars; decision costs 1; reflection rewards 2.
  const costs = sumEffects(choice.effects, { science: -3 });
  const resources = { ...state.resources };
  for (const key of RESOURCE_KEYS) resources[key] = Math.min(MISSIONS[state.missionId].capacity[key], Math.max(0, resources[key] + (costs[key] ?? 0) + (key === "science" ? 2 : 0)));
  const absorbed = Math.min(resources.shielding, event.radiation);
  resources.shielding -= absorbed;
  resources.oxygen -= event.radiation - absorbed;
  for (const key of RESOURCE_KEYS) resources[key] = Math.min(MISSIONS[state.missionId].capacity[key], Math.max(0, resources[key] + (event.effects[key] ?? 0) + (MISSIONS[state.missionId].dailyEffects[key] ?? 0)));
  resources.energy = isDayOne(state) && state.tutorial.exercise === "skipped" ? DAY1_CONFIG.fatigueMorningEnergy : 100;
  return { resources, effects: Object.fromEntries(RESOURCE_KEYS.map((k) => [k, resources[k] - state.resources[k]])), affordable: canAfford(state.resources, sumEffects({ science: -3 }, Object.fromEntries(Object.entries(choice.effects).filter(([, value]) => value < 0)))), event, choice };
}
export function applyAction(state: GameState, action: GameAction): GameState {
  let next = state;
  if (action.type === "travel") {
    if (state.status !== "level-complete" || state.missionId !== "moon") throw new Error("Finish all 7 Moon days before flying to Mars.");
    next = { ...state, missionId: "mars", day: 1, status: "playing", resources: { ...MISSIONS.mars.capacity, science: state.resources.science },
      position: { col: 12, row: 13 }, timeLeft: WORK_HOURS, levelKnowledge: 0, dayKnowledge: 0,
      taskProgress: {}, collectedNodes: [], learnedToday: false, feedback: "Welcome to Mars! Your supply tanks are full for a new 7-day trip." };
  } else {
    if (state.status !== "playing") throw new Error("This part of your journey is finished.");
    switch (action.type) {
      case "move": {
        const world = createOutpost(state.seed, state.missionId);
        if (!action.position || !adjacent(state.position, action.position) || !walkable(world, action.position)) throw new Error("Walk one clear square at a time.");
        next = { ...state, position: { ...action.position }, steps: state.steps + 1,
          resources: isDayOne(state) ? { ...state.resources, oxygen: Math.max(0, state.resources.oxygen - DAY1_CONFIG.oxygenPerStep) } : state.resources };
        break;
      }
      case "tutorial-submit": case "tutorial-exercise": case "tutorial-refill": {
        next = applyTutorialAction(state, action, applyEffects); break;
      }
      case "collect": case "submit": {
        if (isDayOne(state) && action.type === "submit") throw new Error("Follow the Day 1 mission strip.");
        const world = createOutpost(state.seed, state.missionId);
        const node = world.entities.find((n) => n.id === action.nodeId);
        if (!node || !adjacent(state.position, node.position)) throw new Error("Move beside this stop first.");
        if (action.type === "collect") {
          const supply = RESOURCE_NODES[node.id];
          if (isDayOne(state) && (supply?.resource === "science" || state.timeLeft - (supply?.hours ?? 0) < remainingDayOneHours(state))) throw new Error("Save these hours for your Day 1 missions.");
          if (node.interaction.type !== "resource" || !supply) throw new Error("This is not a supply stop.");
          if (state.collectedNodes.includes(node.id)) throw new Error("You have used this stop today. It refills tomorrow.");
          if (state.resources[supply.resource] >= MISSIONS[state.missionId].capacity[supply.resource]) throw new Error("Your tank is full. Save this stop for later.");
          next = applyEffects(state, supply.effects, supply.hours);
          next = { ...next, collectedNodes: [...state.collectedNodes, node.id], feedback: "Supplies collected! This stop refills tomorrow." };
        } else {
          if (node.interaction.type !== "task") throw new Error("Find a question-mark challenge stop.");
          const task = getTask(state.missionId, node.interaction.taskId);
          const progress = state.taskProgress[task.id] ?? 0;
          const step = task.steps[progress];
          if (!step) throw new Error("You finished this challenge today. Try a different one!");
          if (!checkAnswer(step, action.answers)) throw new Error(`Try again! ${step.hint} No supplies were used.`);
          const reward = step.reward + step.options.filter((o) => action.answers.includes(o.id)).reduce((n, o) => n + Math.max(0, o.effects?.science ?? 0), 0);
          next = applyEffects(state, taskEffects(step, action.answers), step.hours, reward);
          next = { ...next, taskProgress: { ...state.taskProgress, [task.id]: progress + 1 }, discoveries: [...state.discoveries, { world: state.missionId, day: state.day, fact: step.fact, sourceId: step.sourceId }], feedback: `${step.fact} +${reward} knowledge stars!` };
        }
        break;
      }
      case "learn": {
        if (isDayOne(state)) throw new Error("Try your current hands-on mission first.");
        if (state.learnedToday) throw new Error("You read today’s fact. Find a challenge for more discoveries!");
        next = applyEffects(state, { oxygen: -1 }, 2, 2);
        next = { ...next, learnedToday: true, discoveries: [...state.discoveries, { world: state.missionId, day: state.day, fact: getDailyEvent(state).fact, sourceId: getDailyEvent(state).sourceId }], feedback: `${getDailyEvent(state).fact} +2 knowledge stars!` };
        break;
      }
      case "end-day": {
        if (!canEndDay(state)) throw new Error(isDayOne(state) ? "Finish five missions, then choose your routine." : "Earn 6 stars and finish one whole challenge before bedtime.");
        const night = previewNight(state, action.choiceId);
        if (!night.affordable) throw new Error("You need more supplies or stars for this night plan.");
        const lost = night.resources.oxygen <= 0 || night.resources.water <= 0 || night.resources.power <= 0;
        const complete = state.day === MISSIONS[state.missionId].duration;
        const status = lost ? "lost" : complete ? state.missionId === "moon" ? "level-complete" : "won" : "playing";
        const earned = 2 + Math.max(0, night.choice.effects.science ?? 0);
        next = { ...state, resources: night.resources, status, day: complete || lost ? state.day : state.day + 1,
          timeLeft: status === "playing" ? WORK_HOURS : 0,
          knowledgeEarned: state.knowledgeEarned + earned, levelKnowledge: state.levelKnowledge + earned,
          dayKnowledge: status === "playing" ? 0 : state.dayKnowledge + earned,
          collectedNodes: status === "playing" ? [] : state.collectedNodes,
          taskProgress: status === "playing" ? {} : state.taskProgress, learnedToday: status === "playing" ? false : state.learnedToday,
          completedLevels: complete && !lost ? [...state.completedLevels, state.missionId] : state.completedLevels,
          history: [...state.history, { world: state.missionId, day: state.day, eventTitle: night.event.title, choiceLabel: night.choice.label,
            before: { ...state.resources }, after: { ...night.resources }, knowledge: state.dayKnowledge + earned }],
          feedback: status === "playing" ? "A new day! Supply stops and challenges are ready again." : status === "level-complete" ? "Seven Moon days complete! Next stop: Mars." : status === "won" ? "Two worlds explored. Look at everything you learned!" : "A supply ran out. Let’s use what we learned on a fresh trip.",
        };
        break;
      }
      default: throw new Error("Unknown game action.");
    }
  }
  if (next.resources.oxygen <= 0 || next.resources.water <= 0 || next.resources.power <= 0) next = { ...next, status: "lost" };
  return { ...next, actions: [...state.actions, structuredClone(action)] };
}
// Compatibility entry point for the night decision UI.
export function advanceTurn(state: GameState, choiceId: string) { return applyAction(state, { type: "end-day", choiceId }); }
export function worldName(id: WorldId) { return MISSIONS[id].location; }
