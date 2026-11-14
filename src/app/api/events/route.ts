import { DATASET_KIND, DATASET_VERSION, EVENTS } from "@/data/events";
import { SOURCES } from "@/data/sources";

export const dynamic = "force-static";

// Public, curated snapshot. Gameplay imports the same dataset without a request per turn.
export async function GET() {
  return Response.json({
    version: DATASET_VERSION,
    provenance: DATASET_KIND,
    note: "Authored training scenarios. No live NASA observations have been imported.",
    events: EVENTS,
    sources: SOURCES,
  });
}
