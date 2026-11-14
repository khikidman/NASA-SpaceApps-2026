import type { MissionEvent } from "../game/types";

// Bump this and RULESET_VERSION whenever content changes would invalidate a replay.
export const DATASET_VERSION = "training-1";
export const DATASET_KIND = "illustrative-training-scenarios";

export const EVENTS: readonly MissionEvent[] = [
  {
    id: "settle-in",
    title: "Make the outpost your home",
    category: "operations",
    minDay: 1,
    description: "The habitat is running smoothly. Where will you put your team's energy today?",
    effects: {},
    radiation: 0,
    fact: "Astronauts need systems that supply breathable air, clean water, and a comfortable place to live.",
    sourceId: "life-support",
    choices: [
      { id: "make-oxygen", label: "Refill the air tanks", description: "Use electricity to build an oxygen reserve.", effects: { oxygen: 20, power: -12 } },
      { id: "study-rocks", label: "Study a rock sample", description: "Spend supplies to learn something new.", effects: { science: 12, oxygen: -3, power: -10 } },
      { id: "tune-panels", label: "Tune the solar panels", description: "A short maintenance trip brings in more power.", effects: { oxygen: -3, power: 18 } },
    ],
  },
  {
    id: "greenhouse",
    title: "A little green on the red planet",
    category: "science",
    minDay: 1,
    description: "Your growing experiment is ready for attention. Keep the crew supplied or give the plants extra care.",
    effects: {},
    radiation: 0,
    fact: "Experiments help researchers learn how living things respond to space environments.",
    sourceId: "mars",
    choices: [
      { id: "air-reserve", label: "Top up life support", description: "Give the habitat's air system priority.", effects: { oxygen: 18, power: -10 } },
      { id: "plant-study", label: "Run the plant experiment", description: "Use the grow lights to collect science.", effects: { science: 16, oxygen: -2, power: -14 } },
      { id: "energy-reserve", label: "Charge the batteries", description: "Pause the experiment and save energy.", effects: { power: 16, science: -2 } },
    ],
  },
  {
    id: "solar-alert",
    title: "Space-weather alert",
    category: "weather",
    minDay: 3,
    description: "A fictional solar storm is approaching. After your choice, shield reserve absorbs 18 impact points. Any overflow uses emergency oxygen.",
    effects: {},
    radiation: 18,
    fact: "Solar energetic particles can create radiation hazards. Mission teams monitor space weather to help protect astronauts.",
    sourceId: "donki",
    choices: [
      { id: "reinforce", label: "Strengthen the shelter", description: "Use energy and air to add shielding before the storm.", effects: { shielding: 24, power: -14, oxygen: -2 } },
      { id: "shelter-refill", label: "Stock the shelter with air", description: "Build an air reserve and rely on your existing shields.", effects: { oxygen: 20, power: -12 } },
      { id: "observe", label: "Collect instrument readings", description: "Earn science while relying on your existing shields.", effects: { science: 20, power: -10, oxygen: -3 } },
    ],
  },
  {
    id: "dusty-panels",
    title: "Dust on the solar panels",
    category: "equipment",
    minDay: 3,
    description: "Dust has reduced today's energy supply. The outpost will lose 12 power after your choice.",
    effects: { power: -12 },
    radiation: 0,
    fact: "Dust can affect solar-powered equipment on Mars. Engineers plan for changing energy supplies.",
    sourceId: "mars",
    choices: [
      { id: "clean-panels", label: "Clean the panels", description: "Spend air on a maintenance trip to recover power.", effects: { oxygen: -5, power: 24 } },
      { id: "indoor-air", label: "Focus on the air tanks", description: "Stay inside and use stored electricity to make oxygen.", effects: { oxygen: 22, power: -12 } },
      { id: "dust-study", label: "Measure the dust", description: "Accept the power loss and collect science.", effects: { science: 15, oxygen: -2, power: -3 } },
    ],
  },
  {
    id: "air-filter",
    title: "An air filter needs help",
    category: "equipment",
    minDay: 5,
    description: "A filter fault will use 8 extra oxygen today. Choose how to respond before the daily update.",
    effects: { oxygen: -8 },
    radiation: 0,
    fact: "Life-support equipment needs maintenance. Keeping spare supplies gives a crew more options when something breaks.",
    sourceId: "life-support",
    choices: [
      { id: "replace-filter", label: "Service the air system", description: "Use power to restore a healthy air reserve.", effects: { oxygen: 30, power: -16 } },
      { id: "reserve-power", label: "Protect the power supply", description: "Rely on stored air while charging the batteries.", effects: { power: 20, oxygen: -2 } },
      { id: "inspect-filter", label: "Investigate the fault", description: "Learn from the failure, using some supplies.", effects: { science: 18, power: -6, oxygen: -2 } },
    ],
  },
  {
    id: "rover-discovery",
    title: "The rover spotted something",
    category: "science",
    minDay: 5,
    description: "An interesting rock formation is nearby. Take a science opportunity or prepare the habitat for tomorrow.",
    effects: {},
    radiation: 0,
    fact: "Robotic missions study Martian rocks to learn about the planet's history and past environments.",
    sourceId: "mars",
    choices: [
      { id: "rover-trip", label: "Investigate the discovery", description: "Spend air and energy on a science expedition.", effects: { science: 25, oxygen: -8, power: -15 } },
      { id: "habitat-air", label: "Prepare more oxygen", description: "Build supplies for a future expedition.", effects: { oxygen: 20, power: -12 } },
      { id: "habitat-shield", label: "Prepare the storm shelter", description: "Spend supplies to strengthen your shield reserve.", effects: { shielding: 20, power: -8, oxygen: -2 } },
    ],
  },
];

export function getEvent(id: string): MissionEvent {
  const event = EVENTS.find((entry) => entry.id === id);
  if (!event) throw new Error(`Unknown event: ${id}`);
  return event;
}
