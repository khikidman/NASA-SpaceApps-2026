# Space Explorer: Moon to Mars

An educational browser game for ages 7–12. Explore the Moon for seven crew days, then fly to Mars for another seven. Collect supplies, solve two-step science challenges, prepare for conditional world events, and learn as much as possible while keeping the crew supplied.

For development with LLMs and agents, start with [AGENTS.md](AGENTS.md), the
[game development playbook](docs/agent-development-rules.md), and the
[research planning decisions](docs/agent-planning-reference.md).
Use the [agent task brief](docs/agent-task-template.md) to assign a focused feature.

## Run locally

Requires Node.js 22.12+ and npm. No account or API key is needed.

```sh
npm install
npm run dev -- --port 3100
```

Open [localhost:3100](http://localhost:3100). Gameplay does not request external images, fonts, or NASA data. NASA source links open only when selected.

```sh
npm run check   # lint, types, unit tests, production build
npm run build
npm start -- --port 3100
```

## Play

Moon Day 1 now begins with a hands-on tutorial: repair the radio, place/calibrate a detector, collect ice, fix the kitchen, and melt the ice. The base contains kitchen, melter, and exercise stations; click a station or use the bottom mission strip. Practice is free until you finish an activity. Choose a gentle cardio/weights routine or explicitly skip it before the night plan.

- Walk with arrows, WASD, touch direction buttons, or click/tap clear ground.
- Click a stop to walk beside it, then press E / Enter or use its action button. Click home, or walk toward its door, to enter automatically.
- **+** supply stops collect air, water, power, or shield supplies once per day. **✦** discovery stops add knowledge stars.
- After Day 1, **?** challenges include question cards, packing a bag under a space limit, and arranging steps in order. Each has two steps, free hints, and no penalty for an incorrect answer.
- Finish all five tutorial missions and choose your routine on Day 1. Later days require six knowledge stars and one entire challenge. The bottom-center mission tray shows progress; **Rest** opens the night plans.
- Every accepted challenge step has a fixed star cost and reward. Resource gains show green **+**; costs show red **−**, with words and signs as well as color.
- Each day has 16 work hours, followed by 8 hours of rest. On tutorial day, each accepted outdoor step uses 0.5 Air; it does not spend work hours. Later walking is free. Night reports and decisions also cost stars, with a reflection reward shown separately.
- Keep air, water, and power above zero. Supplies and challenges refill daily. World events depend on the world, day, and supply levels.
- Finish Moon day 7 to unlock **Next stop: Mars!**. Travel refills tanks and carries your stars, total knowledge, and discovery book forward.
- **My book** records discoveries and daily results. Spendable stars and total knowledge earned are separate.
- Drag to pan, scroll/+ /− to zoom, and use Center player / Home to refit the view.

## World and interface

Both levels use one seeded 24×24 square-world generator. Shaded tile edges and buildings simulate 3D with a fixed isometric WebGL view. Moon terrain uses a seeded, detailed lunar regolith texture sheet: shaded impact craters, fine dust, scattered stones, rover ruts, boot marks, and faceted boulders. Forty-eight surface variants share one GPU texture sheet, built once per Moon renderer. Mars keeps its red terrain. Each world fades in when its renderer is ready, with reduced-motion support.

The five-square render footprint samples tile centers inside a circle of radius `5.5`, giving broad rounded arcs instead of single-tile axis tips. There are at most 97 active ground squares. On the Moon, four radial rings sit 4, 10, 20, and 34 projected pixels below the level center to suggest a curved surface. Opacity stays fully solid through radius 4, then eases outward to roughly 25% at the edge. `SOLID_RADIUS` in `src/world/visibility.ts` controls the opaque center independently of the render radius; `surfaceOpacity` also accepts an explicit radius for a future player-state adapter. Automatic fatigue behavior is not enabled. Retained tiles ease between heights and opacity levels as the player moves; objects, picking, highlights, and routes follow the displayed surface. Mars remains level. Shared tile walls are removed regardless of translucency: only boundary walls and the exposed portion of height steps are drawn. Side geometry follows animated neighbor heights, including entering and departing tiles. Viewport culling also skips off-screen ground and object groups, including during pan, zoom, resize, and animation; retained cells stay alive, and tall rooftops are culled independently of their ground. Incoming tiles rise and fade in; a small temporary set of departing tiles falls and fades out before disposal. Departing and hidden squares cannot be picked. A home arrow appears when the single home square is outside this range. The black starfield has independently varying, interpolated brightness. Clicked routes show waypoint trails and a pulsing destination. The astronaut walks smoothly, the camera tracks without per-step snapping, and graphics for overlapping tiles are reused. Animation pauses when hidden and respects reduced-motion preferences.

Home is a 3×3 prefab made from nine independent 1×1 objects, now using the promoted modular asset bank: habitat, research lab, greenhouse, airlock, solar arrays, communications, a tunnel junction, and a Moon flag. Every object drops and fades with its own terrain tile. The complete module sprites use their packaged ground anchors and uniform scale. Matching artwork also appears at mission/resource stops and in pictorial UI; the garden grow-light illustration switches on when placed. Original lab packages and child promotion records remain traceable through `src/assets/catalog/ASSET-BANK.md`. The interior exit square is anchored exactly to the base square at the same grid scale. Entering fades individual terrain tiles sequentially from the outside inward while the 5×5 floor and wall sections fade in outward from the door. Every piece keeps its normal grid position and size. One solid astronaut bridges the outdoor and indoor views. A full 1×1 airlock tile at `(2, 5)` extends from the front of the 5×5 room and is the entry landing square. Its doors sit on the tile edges at rows 5 and 6. Door crossings ease between exact grid centers; exiting settles at `(2, 6)` before handing back to the outdoor square. The inner door stays open after entry so the player can walk into the room. Walk past it through the doorway, use Exit, or press Escape to walk back out: the room fades out inward toward the door and the terrain fades back in outward. The camera follows the animated player inside and throughout door transitions, preserving manual pan and zoom. Pan and zoom share one camera across both views. Rest still opens the night plan. Interior navigation does not spend supplies or add campaign movement actions; the outdoor door position is restored on exit, and refreshing opens the surface. Both worlds share this interior. The entrance has a cutaway airlock with two sliding doors, pressure bars, and readiness lights. A 2.2-second cycle closes one door, changes pressure with both doors sealed, then opens the other. Movement is held during the cycle; reduced motion settles it immediately. Airlock timing is a fictional presentation rule and uses no mission supplies.

The astronaut uses a shared four-direction, 32-frame ivory/gold spritesheet for outdoor walking, the interior, and door crossings. Its feet remain registered to the world grid. `ASTRONAUT_DOOR_HEIGHT_RATIO` in `src/assets/characters/astronaut-settings.ts` sets character height relative to the airlock's clear opening (currently 0.82, about 25.4 world pixels). Sprite frames advance from movement progress, so they pause with movement and honor reduced motion. Artwork, exact generation prompt, and atlas notes are in `src/assets/characters/` and `public/assets/characters/`.

Compact supply bars and the spendable star balance sit in the top left. The title block, objective sidebar, coordinates, scan panel, and large navigation dock are removed. Three picture-based mission buttons sit at the bottom center, alongside daily star progress, remaining work hours, and Rest. Click a mission to approach its stop; an off-screen mission arrow guides you if it is outside the local circle.

Supplies collect directly through a contextual action, with signed cost previews, animated bars, floating changes, and a brief world burst. Challenges use illustrated answer cards, a five-slot packing bag, and numbered sequence slots. Drag-and-drop and click/tap choices share the same engine validation; hints, facts, sources, and the discovery book remain available without interrupting the main play flow. Native dialogs retain keyboard focus containment, Escape dismissal, and internal scrolling. Touch layouts start at a closer camera zoom; zoom out to see more of the local circle. Camera and movement-pad options are tucked into the camera controls.

## Source layout

- `src/game`: pure action validation, costs, progression, survival, scores, and replay saves.
- `src/data`: shared world settings, six two-step challenges, five supply actions, conditional events, and NASA sources.
- `src/world`: shared map generation, grid math, movement, visibility, and picking.
- `src/rendering`: PixiJS WebGL adapter, procedural graphics, camera, and home guidance.
- `src/features/mission`: HUD, minigames, daily decisions, book, and persistence.
- `src/features/world`: renderer lifecycle, routes, input, starfield, and world transition.
- `/about`: scientific background and game assumptions. `/api/events`: static content snapshot.

See [architecture](docs/architecture.md) and [world architecture](docs/isometric-world.md).

## Saves and scope

One action-validated journey save restores movement, collection, task steps, days, resources, discoveries, and world unlocks. New saves use `space-explorer:journey:v3`; earlier prototype saves are left untouched. Saves are local to this browser/device. They are not an anti-cheat mechanism.

All costs, supply units, event timings, and work-day lengths are fictional game rules. Learning facts have linked NASA background; no live NASA observations are imported. This is not a radiation or life-support simulator. Full perspective 3D, construction, multiplayer, cloud saves, audio, and offline installation are outside this prototype.

Content, reading level, and difficulty need playtesting with children and educators. Add worlds through shared configuration, tasks, and event rules; bump save compatibility versions when changing replay results.

## Teammate asset workspace

The [asset lab](asset-lab/README.md) lives in `asset-lab/` and is available at `/asset-lab`. Run `npm run lab` and open [127.0.0.1:3101/asset-lab](http://127.0.0.1:3101/asset-lab), or use that route on the main preview. It provides shared-generator lunar editing, image/sprite refinement, comparison, local revisions, PNG/package exports, and checked promotion/rollback. Follow [the handoff protocol](asset-lab/PROTOCOL.md) to move an experiment into the game without losing its source or revision history.

## Day 1 integration

See [the feature contract](docs/day-1-implementation.md). `src/data/day-one.ts` contains the ordered tasks and explicitly fictional tuning. The five activities and exercise decision are replayed through the shared engine; the older v2 save key is preserved. Days 2–7 and Mars retain their existing challenge content. Energy and skipped-routine status are ready for later day-specific integration; fatigue does not change visibility.
