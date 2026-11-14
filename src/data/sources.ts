export const SOURCES = [
  {
    id: "donki",
    name: "NASA DONKI",
    url: "https://ccmc.gsfc.nasa.gov/tools/DONKI/",
    description: "A source for future space-weather event curation. The sample storms are fictional, not downloaded observations.",
  },
  {
    id: "mars",
    name: "NASA Mars exploration",
    url: "https://science.nasa.gov/mars/",
    description: "Background reading for the Mars setting and educational content.",
  },
  {
    id: "life-support",
    name: "NASA life support systems",
    url: "https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/",
    description: "Background reading about supporting astronauts. Resource units and costs in this prototype are invented.",
  },
] as const;

export function getSource(id: string) {
  const source = SOURCES.find((entry) => entry.id === id);
  if (!source) throw new Error(`Unknown source: ${id}`);
  return source;
}
