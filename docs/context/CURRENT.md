# Current project state

Snapshot: 2026-11-15, inspected against commit `14abbe6` (`Day 1 Rev 2`) before
the context-documentation changes. Recheck the code after later changes.

## Product direction

Space Explorer: Moon to Mars is a local educational browser game for ages 7–12.
The campaign has seven Moon days, followed by seven Mars days. The current richer
content slice is Moon Day 1; later days keep the existing shared challenges.

The user selected **A: Living Diorama**, with simplified surrounding controls,
prominent learning, creative graphical experiments, and unambiguous resources.
Key facts belong in the main visual hierarchy. Deeper explanations and sources
remain expandable. Few required words does not mean hiding the educational goal.
The requested professional quality target is an aspiration, not a verified score.

## Working systems and entry points

| Area | Current behavior / source |
| --- | --- |
| Runtime | Next.js, React, TypeScript; PixiJS WebGL world. See `package.json` for actual dependency versions. |
| Game authority | `src/game/engine.ts`, `tutorial.ts`, `types.ts`: deterministic accepted actions, costs, time, rewards, progression and survival. UI emits intentions. |
| Saves | `src/game/save.ts`: v3 action replay at `space-explorer:journey:v3`; earlier v2 key is preserved. Ruleset/dataset mismatches are rejected. |
| World | Shared seeded square grid with fixed 96×48 isometric diamonds. `src/world/visibility.ts`: render radius 5, solid radius 4, dropping/fading lunar rim. Fatigue adjustment remains off. |
| Rendering | `src/rendering/pixi-world-renderer.ts`, `tile-faces.ts`, `camera.ts`: shared world rendering, exposed side geometry, camera and animation. |
| Home | `src/world/base-prefab.ts`, `home.ts`, `airlock.ts`; `src/rendering/home-interior.ts`, `home-transition.ts`, `airlock-visual.ts`. Nine independent 1×1 modules form a 3×3 base; southwest entrance, 1×1 airlock and 5×5 interior. Grid-aligned handoffs and radial fades; no shrinking. |
| Character | Shared four-direction astronaut atlas indoors/outdoors. Door-relative size is configured in `src/assets/characters/astronaut-settings.ts`. |
| Game UI | `src/features/mission/mission-dashboard.tsx`: supplies top-left, missions bottom-center, contextual dialogs. Resource components show names/signs as well as icons. |
| Day 1 | `src/features/mission/day-one-panel.tsx` imports the active `diorama-games.tsx`. Ordered radio → detector → ice → kitchen → melter, then exercise or explicit skip before night. |
| Diorama presentation | `diorama-scene.tsx`: separate vector equipment and hit areas over promoted lunar scenery. `diorama-learning.tsx`, `diorama-forecast.tsx`, `living-diorama.css`: learning hierarchy, signed forecasts and responsive layout. |
| Practice | `workshop-practice.ts`: validated, tab-local session drafts, not authoritative resources. New melter proof includes a sample check; older accepted proofs without that optional field still replay. |
| Sources | `src/data/workshop-lessons.ts`, `sources.ts` and the learning-connections document retain claims, model limitations and NASA links. No live NASA data or runtime LLM is required. |
| Art | `src/assets/catalog/lab-assets.json`, `asset-bank-world.json`, `src/assets/asset-bank.ts`. Lab exports, immutable promotions and originals live under `asset-lab/`; generated stage is UI scenery, not world geometry. |

Paths without a leading directory in the table's Diorama/practice rows are under
`src/features/mission/`. Old `workshop-games.tsx` remains in the tree; it is not
the current Day 1 controller import. Verify imports before refining a screen.

## Economy and vocabulary

- Resources: Air (`oxygen`), Water, Power, Energy, Shield and Research tokens
  (`science`). `knowledgeEarned` is separate permanent Research progress.
- Practice is free. The engine charges/rewards only accepted submissions.
- Standard and Boost share `workshopTerms`; Boost trades Power for Energy/time.
  Read actual values in `src/data/day-one-workshop.ts`, not a historical screenshot.
- Day 1 has per-accepted-outdoor-step Air costs and no walking time charge.
  Later walking remains free. Food and real-time survival drain are not implemented.
- Preserve source-backed science separately from fictional balance and illustrated
  instrument readings. Melting/filter imagery does not establish real water safety.

## Review and local operation

Local setup is in the [README](../../README.md). Main preview convention: port 3100;
lab convention: port 3101. A prior production preview used `npm run build -- --webpack`
then `npm run start -- --hostname 127.0.0.1 --port 3100`. Check the actual listener
and running mode before restarting; do not start competing servers or reset saves.

The [Living Diorama evidence record](../living-diorama-implementation.md) reports
TypeScript, 11 focused workshop/save tests and a production build passing on
2026-11-15, plus one visually observed radio connection. That evidence predates
this documentation task and is not automatically valid after future code changes.
The screenshot is [here](../design/explorer-ux-concepts/living-diorama-implemented.jpg).
All five interactions have not been fully observed in-browser in that record.
Child/educator testing, formal quality scoring and device performance remain
unverified. See the [workboard](WORKBOARD.md) for review gaps and deferred scope.
