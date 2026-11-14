import { DATASET_KIND, DATASET_VERSION, EVENTS } from "@/data/events";
import { MISSIONS } from "@/data/missions";
import { TASKS, RESOURCE_NODES } from "@/data/tasks";
import { SOURCES } from "@/data/sources";

export const dynamic = "force-static";

// Public, curated snapshot. Gameplay imports the same dataset without a request per turn.
export async function GET() {
  return Response.json({
    version: DATASET_VERSION,
    provenance: DATASET_KIND,
    note: "Authored training scenarios. No live NASA observations have been imported.",
    worlds: MISSIONS,
    challenges: TASKS,
    resourceNodes: RESOURCE_NODES,
    events: EVENTS,
    sources: SOURCES,
  });
}
