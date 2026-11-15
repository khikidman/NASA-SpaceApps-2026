import type { TutorialTaskId } from "../game/types";
export type WorkshopLessonId = TutorialTaskId | "exercise";
export interface WorkshopLesson {
  title: string;
  takeaway: string;
  more: string;
  gameNote: string;
  sourceIds: readonly string[];
}
/** Primary-source learning, separate from the fictional puzzle answers and costs. */
export const WORKSHOP_LESSONS: Record<WorkshopLessonId, WorkshopLesson> = {
  comms: {
    title: "Messages across space",
    takeaway: "Radio waves carry messages between spacecraft and Earth.",
    more: "NASA uses large dish antennas to receive spacecraft signals and send instructions.",
    gameNote: "Matching wires and waves is a puzzle, not a real radio setup. Our test message skips the real travel delay.",
    sourceIds: ["space-radio"],
  },
  detector: {
    title: "A Moon that can shake",
    takeaway: "Apollo astronauts used seismometers to study moonquakes.",
    more: "These instruments helped scientists discover shaking beneath the lunar surface.",
    gameNote: "The feet and test pulse are practice controls. The trace is drawn for this game; it is not a NASA measurement or the cause of our story quake.",
    sourceIds: ["moonquakes"],
  },
  ice: {
    title: "Frozen water in shadow",
    takeaway: "Water ice has been found in some permanently shadowed places near the Moon’s poles.",
    more: "Some polar crater floors receive no direct sunlight and stay very cold.",
    gameNote: "Blue crystals, this cave, and the scanner marks are game clues. Real ice is not always obvious, and not every shadow contains ice.",
    sourceIds: ["moon-water"],
  },
  food: {
    title: "Water helps prepare meals",
    takeaway: "Astronauts add water to prepare some space foods and drinks.",
    more: "Orion has a drinking-water dispenser for food and drink packages, as well as a food warmer.",
    gameNote: "Our gear, filter and tray machine is fictional. This repair is not a model of Orion’s food system.",
    sourceIds: ["space-food"],
  },
  melt: {
    title: "Treat water, then check it",
    takeaway: "Space-station equipment cleans recovered water and checks its purity before reuse.",
    more: "NASA’s water processor uses several treatment steps. Water that fails its checks is processed again.",
    gameNote: "Our heater targets and filter are simplified puzzles. Warming lunar ice or passing it through one filter would not by itself make it safe to drink.",
    sourceIds: ["life-support"],
  },
  exercise: {
    title: "Move to stay strong",
    takeaway: "Astronaut exercise helps keep bones and muscles strong.",
    more: "NASA uses both aerobic and resistance exercise to help astronauts during spaceflight.",
    gameNote: "Four moves, two game hours and tomorrow’s Energy are fictional tuning, not a workout prescription or a health measurement.",
    sourceIds: ["exercise"],
  },
};
