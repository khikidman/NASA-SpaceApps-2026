# Space Explorer: Moon to Mars

An educational browser game for ages 7–12. Explore the Moon for seven crew days, then fly to Mars for another seven. Collect supplies, solve two-step science challenges, prepare for conditional world events, and learn as much as possible while keeping the crew supplied.

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

- Walk with arrows, WASD, touch direction buttons, or click/tap clear ground.
- Click a stop to walk beside it, then press E / Enter or **Use stop**.
- **+** supply stops collect air, water, power, or shield supplies once per day. **✦** discovery stops add knowledge stars.
- **?** challenges include question cards, packing a bag under a space limit, and arranging steps in order. Each has two steps, free hints, and no penalty for an incorrect answer.
- Earn at least six knowledge stars and complete one entire challenge each day. The bottom-center mission tray shows progress; **Rest** opens the night plans.
- Every accepted challenge step has a fixed star cost and reward. Resource gains show green **+**; costs show red **−**, with words and signs as well as color.
- Each day has 16 work hours, followed by 8 hours of rest. Walking is free. Night reports and decisions also cost stars, with a reflection reward shown separately.
- Keep air, water, and power above zero. Supplies and challenges refill daily. World events depend on the world, day, and supply levels.
- Finish Moon day 7 to unlock **Next stop: Mars!**. Travel refills tanks and carries your stars, total knowledge, and discovery book forward.
- **My book** records discoveries and daily results. Spendable stars and total knowledge earned are separate.
- Drag to pan, scroll/+ /− to zoom, and use Center player / Home to refit the view.

## World and interface

Both levels use one seeded 24×24 square-world generator. Shaded tile edges and buildings simulate 3D with a fixed isometric WebGL view. Moon terrain uses a seeded, detailed lunar regolith texture sheet: shaded impact craters, fine dust, scattered stones, rover ruts, boot marks, and faceted boulders. Forty-eight surface variants share one GPU texture sheet, built once per Moon renderer. Mars keeps its red terrain. Each world fades in when its renderer is ready, with reduced-motion support.

Only a circular radius of five logical squares is rendered: `(col-playerCol)² + (row-playerRow)² <= 25`. There are at most 81 active ground squares. Incoming tiles rise and fade in; a small temporary set of departing tiles falls and fades out before disposal. Departing and hidden squares cannot be picked. A home arrow appears when the single home square is outside this range. The black starfield has independently varying, interpolated brightness. Clicked routes show waypoint trails and a pulsing destination. The astronaut walks smoothly, the camera tracks without per-step snapping, and graphics for overlapping tiles are reused. Animation pauses when hidden and respects reduced-motion preferences.

Four compact supply bars and the spendable star balance sit in the top left. The title block, objective sidebar, coordinates, scan panel, and large navigation dock are removed. Three picture-based mission buttons sit at the bottom center, alongside daily star progress, remaining work hours, and Rest. Click a mission to approach its stop; an off-screen mission arrow guides you if it is outside the local circle.

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

One action-validated journey save restores movement, collection, task steps, days, resources, discoveries, and world unlocks. New saves use `space-explorer:journey:v2`; earlier prototype saves are left untouched. Saves are local to this browser/device. They are not an anti-cheat mechanism.

All costs, supply units, event timings, and work-day lengths are fictional game rules. Learning facts have linked NASA background; no live NASA observations are imported. This is not a radiation or life-support simulator. Full perspective 3D, construction, multiplayer, cloud saves, audio, and offline installation are outside this prototype.

Content, reading level, and difficulty need playtesting with children and educators. Add worlds through shared configuration, tasks, and event rules; bump save compatibility versions when changing replay results.
