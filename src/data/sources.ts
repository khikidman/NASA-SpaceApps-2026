export const SOURCES = [
  { id: "space-radio", name: "NASA Space Place: Talking to spacecraft", url: "https://spaceplace.nasa.gov/dsn-antennas/en/", description: "Radio signals, spacecraft messages and the Deep Space Network. Wave matching is an authored puzzle." },
  { id: "moon-water", name: "NASA: Moon water and ices", url: "https://science.nasa.gov/moon/moon-water-and-ices/", description: "Evidence for water ice in some permanently shadowed polar regions. The game cave and blue crystals are fictional." },
  { id: "space-food", name: "NASA: Orion crew systems", url: "https://www.nasa.gov/reference/crew-systems/", description: "Water for rehydrating food and drink packages, and equipment for warming food. The kitchen repair puzzle is fictional." },
  { id: "moon-weather", name: "NASA: Weather on the Moon", url: "https://science.nasa.gov/moon/weather-on-the-moon/", description: "The Moon lacks wind and rain like Earth's weather. The story's quake and resource locations are fictional." },
  { id: "exercise", name: "NASA: The human body in space", url: "https://www.nasa.gov/humans-in-space/the-human-body-in-space/", description: "Exercise and astronaut bones and muscles. All Energy modifiers are fictional game tuning." },
  { id: "moon", name: "NASA: Moon facts", url: "https://science.nasa.gov/moon/facts/", description: "Craters and the Moon’s very thin atmosphere." },
  { id: "moonquakes", name: "NASA: Moonquakes", url: "https://science.nasa.gov/moon/moonquakes/", description: "How scientists study a shaking Moon." },
  { id: "mars", name: "NASA: Mars facts", url: "https://science.nasa.gov/mars/facts/", description: "Rusty dust, a cold surface, and a thin atmosphere." },
  { id: "mars-power", name: "NASA: Mars surface power", url: "https://www.nasa.gov/wp-content/uploads/2024/01/mars-surface-power-generation-challenges-and-considerations.pdf", description: "How dust affects sunlight and solar power." },
  { id: "plants", name: "NASA: Growing plants in space", url: "https://science.nasa.gov/biological-physical/the-challenges-of-growing-plants-in-space/", description: "Plants need light, water, air, nutrients, and space to grow." },
  { id: "radiation", name: "NASA: Protecting astronauts from space radiation", url: "https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/", description: "Why future Moon explorers need protection." },
  { id: "life-support", name: "NASA: Life support systems", url: "https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/", description: "Air, water, and equipment for astronauts. All game units are invented." },
] as const;
export function getSource(id: string) { const source = SOURCES.find((s) => s.id === id); if (!source) throw new Error(`Unknown source: ${id}`); return source; }
