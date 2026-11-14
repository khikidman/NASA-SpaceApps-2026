import type { LearningTask, Resource, ResourceDelta, TaskStep, WorldId } from "../game/types";
const pick = (id: string, prompt: string, labels: string[], answer: number, hint: string, fact: string, sourceId: string): TaskStep => ({
  id, kind: "pick", prompt, hint, fact, sourceId, cost: { science: -1, power: -2 }, hours: 2, reward: 5,
  options: labels.map((label, i) => ({ id: `${id}-${i}`, label })), answer: [`${id}-${answer}`],
});
const pack = (id: string, prompt: string, fact: string, sourceId: string): TaskStep => ({
  id, kind: "pack", prompt, fact, sourceId, hint: "Pack the sample jar and air tank. Keep the bag at 5 spaces or fewer.",
  cost: { science: -2, oxygen: -2 }, hours: 2, reward: 6, budget: 5,
  options: [
    { id: "jar", label: "Sample jar", weight: 2, effects: { power: -1 } },
    { id: "air", label: "Air tank", weight: 2, effects: { oxygen: 4, power: -2 } },
    { id: "camera", label: "Tiny camera", weight: 1, effects: { science: 2, power: -2 } },
    { id: "battery", label: "Big battery", weight: 3, effects: { power: 8, water: -2 } },
  ], answer: ["jar", "air"],
});
const order = (id: string, prompt: string, labels: string[], fact: string, sourceId: string): TaskStep => ({
  id, kind: "order", prompt, fact, sourceId, hint: `Start with “${labels[0]}”. Then “${labels[1]}”. Finish with “${labels[2]}”.`,
  cost: { science: -1, water: -2, power: -1 }, hours: 2, reward: 5,
  // Deliberately displayed out of order. Answers are checked by id, not screen position.
  options: [2, 0, 1].map((i) => ({ id: `${id}-${i}`, label: labels[i] })), answer: labels.map((_, i) => `${id}-${i}`),
});
export const TASKS: Readonly<Record<WorldId, readonly LearningTask[]>> = {
  moon: [
    { id: "samples", title: "Moon rock detective", description: "Learn about craters. Pack a small rock-collecting bag.", steps: [
      pick("craters", "What made many of the Moon’s round craters?", ["Space rocks hitting the ground", "Rain falling", "Ocean waves"], 0, "Think about rocks arriving from space.", "Space rocks can hit the Moon and leave bowl-shaped craters.", "moon"),
      pack("moon-bag", "Pack a jar and air tank for a sample walk. You have 5 bag spaces.", "The Moon has very little atmosphere. Explorers need a protected supply of air.", "moon"),
    ] },
    { id: "safety", title: "Moonquake team", description: "Find out how scientists listen to a shaking Moon.", steps: [
      pick("quake", "Which tool would help us measure a moonquake?", ["A rain bucket", "A shake sensor", "A windmill"], 1, "A shake sensor measures movement in the ground.", "The Moon has quakes. Some deep quakes are linked to Earth’s gravity pulling on the Moon.", "moonquakes"),
      order("moon-plan", "Put our game’s safe sensor trip in order.", ["Check the air tank", "Place the shake sensor", "Bring the readings home"], "Scientists use instruments to learn about places they cannot see deep underground.", "moonquakes"),
    ] },
    { id: "garden", title: "Space garden", description: "Plan a plant’s home inside your Moon base.", steps: [
      pick("plant", "Which set helps a plant grow?", ["Only rocks", "Only darkness", "Light, water, air, and nutrients"], 2, "Plants need several things, including light and water.", "NASA studies how to give plants the light, water, air, and nutrients they need in space.", "plants"),
      order("moon-garden", "Build our game’s plant experiment in order.", ["Set up the plant tray", "Add seeds and a little water", "Switch on the grow light"], "Space gardens need careful checks so plant roots get water and air.", "plants"),
    ] },
  ],
  mars: [
    { id: "samples", title: "Red rock detective", description: "Explore rusty dust and pack a sample bag.", steps: [
      pick("red", "Why does Mars look red?", ["Its dust contains rusty iron minerals", "It is covered in strawberries", "It glows like a lamp"], 0, "Think of the red-brown color of rusty iron.", "Iron minerals in Martian rocks and dust have rusted, giving Mars its red color.", "mars"),
      pack("mars-bag", "Pack a jar and air tank for a Mars sample walk. You have 5 bag spaces.", "Mars has a very thin atmosphere. Its air is mostly carbon dioxide, not the air we breathe.", "mars"),
    ] },
    { id: "safety", title: "Dust detective", description: "Help the base when dusty skies block sunlight.", steps: [
      pick("dust", "Dust covers a solar panel. What could happen?", ["It makes more water", "It collects less sunlight", "It turns into a rock"], 1, "Solar panels need light to make electricity.", "Martian dust in the sky or on solar panels can reduce the sunlight available for power.", "mars-power"),
      order("mars-plan", "Put our game’s dust plan in order.", ["Check the power meter", "Save power at the base", "Study the dust readings"], "Mars has dust storms. Watching the weather helps teams plan their work.", "mars"),
    ] },
    { id: "garden", title: "Mars greenhouse", description: "Make a tiny indoor garden on a cold, dry world.", steps: [
      pick("mars-air", "Where should our space garden grow?", ["Outside with no protection", "Inside a protected greenhouse", "In a dark storage box"], 1, "Mars is cold and its air is very thin. Give plants a protected home.", "Mars is a cold world with a thin atmosphere. A space garden needs a carefully controlled home.", "mars"),
      order("mars-garden", "Build our game’s greenhouse check in order.", ["Check the grow light", "Give roots a little water", "Record how the plants grow"], "NASA experiments test how plants grow with different amounts of water and light.", "plants"),
    ] },
  ],
};
export const RESOURCE_NODES: Readonly<Record<string, { resource: Resource; description: string; effects: ResourceDelta; hours: number }>> = {
  "oxygen-01": { resource: "oxygen", description: "Run the air maker. It uses a little power.", effects: { oxygen: 20, power: -3 }, hours: 1 },
  "water-01": { resource: "water", description: "Clean stored water so we can use it again.", effects: { water: 18, power: -2 }, hours: 1 },
  "solar-01": { resource: "power", description: "Check the solar panels and charge our batteries.", effects: { power: 20, water: -2 }, hours: 1 },
  "shield-01": { resource: "shielding", description: "Use powered tools to add shelter supplies.", effects: { shielding: 15, power: -4 }, hours: 1 },
  "sample-01": { resource: "science", description: "Study a fresh sample and add a discovery to your book.", effects: { science: 3, oxygen: -1, power: -1 }, hours: 1 },
};
export function getTask(world: WorldId, id: string) {
  const task = TASKS[world].find((t) => t.id === id);
  if (!task) throw new Error("That challenge is not in this world.");
  return task;
}
