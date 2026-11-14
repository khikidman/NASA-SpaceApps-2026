import type { GameState, MissionEvent } from "../game/types";
export const DATASET_VERSION = "learning-journey-2";
export const DATASET_KIND = "authored-educational-scenarios";
export const EVENTS: readonly MissionEvent[] = [
  { id: "quiet", title: "A peaceful evening", description: "Your team is ready to rest. How will you help the base tonight?", fact: "Space crews need supplies, careful planning, and rest as well as discoveries.", sourceId: "life-support", effects: {}, radiation: 0, choices: [
    { id: "recycle", label: "Recycle water", description: "Run the water cleaner while the crew rests.", effects: { water: 10, power: -5 } },
    { id: "notes", label: "Send our discoveries", description: "Use the radio to share a little extra science.", effects: { science: 3, power: -5 } },
  ] },
  { id: "water-low", title: "Water check!", description: "Our water meter is low. Let’s choose a plan before bed.", fact: "Space-station equipment recycles water so astronauts can use it again.", sourceId: "life-support", effects: {}, radiation: 0, choices: [
    { id: "clean", label: "Clean extra water", description: "Use more power to refill the tank.", effects: { water: 20, power: -8 } },
    { id: "careful", label: "Use the small cleaner", description: "Save power and clean a smaller amount.", effects: { water: 12, power: -3 } },
  ] },
  { id: "power-low", title: "Battery check!", description: "Our batteries are getting low. Which backup should we use?", fact: "Spacecraft use power to run equipment that helps their crews live and work.", sourceId: "life-support", effects: {}, radiation: 0, choices: [
    { id: "backup", label: "Use the backup kit", description: "Trade shelter supplies for a battery boost.", effects: { power: 18, shielding: -6 } },
    { id: "small", label: "Use a small backup", description: "Get less power and keep more shelter supplies.", effects: { power: 12, shielding: -2 } },
  ] },
  { id: "moonquake", title: "The Moon gave a wobble!", description: "A small moonquake was recorded. Choose what the team checks tonight.", fact: "The Moon has quakes. Instruments left by Apollo astronauts helped scientists study them.", sourceId: "moonquakes", effects: { power: -2 }, radiation: 0, choices: [
    { id: "secure", label: "Check the shelter", description: "Use tools to strengthen our game’s shelter.", effects: { shielding: 10, power: -5 } },
    { id: "listen", label: "Read the shake sensor", description: "Learn more, using a little air and power.", effects: { science: 4, oxygen: -3, power: -3 } },
  ] },
  { id: "sun-alert", title: "A message about the Sun", description: "Our game’s Sun alert is on. Shelter supplies help protect the team.", fact: "Radiation from space is a challenge for astronauts beyond Earth’s protective environment.", sourceId: "radiation", effects: {}, radiation: 12, choices: [
    { id: "shelter", label: "Prepare the shelter", description: "Use power to add protection before the alert.", effects: { shielding: 15, power: -7 } },
    { id: "observe", label: "Study from inside", description: "Use existing protection and collect readings.", effects: { science: 4, power: -4 } },
  ] },
  { id: "mars-dust", title: "Dusty skies on Mars", description: "Dust is blocking some sunlight. The base will use 8 extra power tonight.", fact: "Mars has dust storms. Dust can reduce the sunlight that reaches solar panels.", sourceId: "mars-power", effects: { power: -8 }, radiation: 0, choices: [
    { id: "panels", label: "Care for the panels", description: "Spend air on a panel check to recover some power.", effects: { power: 14, oxygen: -5 } },
    { id: "weather", label: "Study the dust", description: "Keep working indoors and learn from the readings.", effects: { science: 4, power: -2 } },
  ] },
];
export function getEvent(id: string): MissionEvent {
  const event = EVENTS.find((e) => e.id === id);
  if (!event) throw new Error("Unknown evening event.");
  return event;
}
export function getDailyEvent(state: GameState): MissionEvent {
  const id = state.resources.water < 25 ? "water-low" : state.resources.power < 30 ? "power-low"
    : state.missionId === "moon" && [2, 5].includes(state.day) ? "moonquake"
    : state.missionId === "mars" && [2, 5].includes(state.day) ? "mars-dust"
    : [3, 6].includes(state.day) && state.resources.shielding < 35 ? "sun-alert" : "quiet";
  return getEvent(id);
}
