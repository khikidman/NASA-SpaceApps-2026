# Junior Astronaut Mission Trainer

A Next.js framework and playable starter for the NASA Space Apps project: manage a Mars outpost for 15 sols, balancing oxygen, power, shield reserve, and science.

The outpost now uses a browser-only PixiJS WebGL renderer with a player-centered, simulated 3D isometric grid. React owns the dashboard; the spatial world and camera have separate modules.

## Run locally

Requires Node.js 22.12+ (Node.js 24 LTS recommended) and npm.

```sh
npm install
npm run dev
```

Open http://localhost:3000. No API key or account is required. The application does not load fonts, images, or data from external services during gameplay.

```sh
npm run check       # lint, types, simulation/save tests, production build
npm run build
npm start          # serve the production build
```

## Source layout

```text
src/
  app/                     Next.js App Router pages and global styles
    api/events/route.ts    Public, static snapshot of the curated dataset
    about/page.tsx        Sources and scientific assumptions
  components/              Reusable resource meters
  data/                    Typed mission settings, events, source references
  features/mission/        Dashboard and browser persistence integration
  features/world/          React canvas lifecycle and mission-to-world adapter
  game/                    Framework-independent simulation, types, save/replay
  world/                   Grid data, projection, footprints, and tile picking
  rendering/               WebGL adapter, scene graphics, camera, renderer port
docs/
  architecture.md          Boundaries, turn rules, and extension guidance
```

## Included

- Responsive mission dashboard, event decisions, a sol summary, and win/lose screens.
- One 15-sol Mars mission and six illustrative event templates, each with three choices.
- Seeded randomness, event eligibility, and no immediately repeated event.
- Pure, immutable turn resolution with resource caps and affordability checks.
- Versioned local saves restored by replaying validated choices.
- An attribution page that distinguishes scientific background from invented game rules.
- Unit tests covering simulation correctness, achievable missions, and save validation.
- A seeded 24 × 24 square grid with a movable astronaut, volumetric tiles, empty squares, and interactive facilities.
- A strict circular render radius of three squares: at most 29 ground squares and only their nearby contents are drawn.
- One home-base square, with a screen-edge direction arrow and distance when it leaves the visible circle.
- Arrow/WASD movement, click/tap-to-walk routes, touch movement controls, nearby-facility interaction, zoom, and player-centered camera controls.
- WebGL context recovery, resize/DPR handling, on-demand rendering, and a readable unavailable-renderer state that leaves the mission playable.
- Tests for projection/picking, camera transforms, map generation, and placement boundaries.

## World controls and scope

Use the arrow keys or WASD to move one square at a time, or click/tap clear ground to walk a short route through visible squares. Rocks and occupied facility squares block movement. Select a facility and use it from an adjacent square, or press E / Enter to use a nearby facility. Touch controls provide the same movement and interaction actions.

Only squares with `(col - playerCol)^2 + (row - playerRow)^2 <= 9` are rendered. This is a circle of radius three in the logical grid, not a 3 × 3 block or a screen-space circle. Out-of-range ground, rocks, and facilities are absent from the scene and cannot be picked. The player camera follows movement; zooming out never reveals hidden squares.

Home base occupies one square. When its distance exceeds three squares, a HUD arrow points toward home and shows its distance. It disappears as soon as base reenters range. The arrow is guidance, not a teleport control.

Scroll or use + / − to zoom, drag to pan, toggle Grid to show square boundaries, and use Center player (or Home on the keyboard) to reset the local view. The map has a fixed isometric projection and shaded extruded geometry to simulate 3D; it is not a rotating perspective camera or physics engine.

Facility visits open a local information panel and are recorded once in an exploration log. They do not grant invented mission-resource rewards. Mission decisions below continue to control oxygen, power, shielding, and science. Player position and visits use an independently validated local save; the mission save format remains unchanged.

The scene is rendered by WebGL. When WebGL is unavailable, the mission dashboard remains playable. Construction, resource production tied to spatial facilities, terrain elevation changes, and multiplayer remain future systems.

## Game rules

Read the event, select one action, then resolve the action, storm impact, event effects, daily upkeep, and survival check. Oxygen and power must both remain above zero at the end of the sol. Survive all 15 sols to win; science is your bonus score.

Every sol consumes 6 oxygen and generates 8 power. Oxygen, power, and shielding are capped at 100. Shield reserve is consumed by storms; any impact beyond that reserve costs emergency oxygen. This relationship is a fictional game abstraction, not a radiation or life-support model.

Progress is saved on this browser and device. No accounts, database, competitive score validation, multiplayer, or service worker are included. A loaded mission can continue without network requests, but loading the website offline is not yet supported.

## NASA data status

**The initial dataset contains authored training scenarios, not downloaded NASA observations.** Topic references are linked on `/about`. The scaffold does not implement live DONKI ingestion, OSDR processing, or a NASA Images integration. Never present sample events as actual historical observations.

To add real data, curate a snapshot with original source URLs and dates, validate it, and document the conversion to game values. Keep refreshes off the turn path. See [architecture guidance](docs/architecture.md).

## Develop next

1. Review the educational content and play-test the resource economy with the intended age group.
2. Add more reviewed event templates and mission objectives.
3. Import a small, attributed historical NASA dataset with explicit conversion rules.
4. Add a Moon ruleset with separate environment settings and eligible events.
5. Add validated construction commands and version mutable facilities alongside the exploration save.
6. Add sprite assets, richer facility actions, longer-range navigation, or hosted persistence when a feature needs them.

Keep simulation changes in `src/game`, content changes in `src/data`, and UI changes in `src/features/mission`. Bump save compatibility versions when changing rules or event content. Do not put API keys in client components or public environment variables.

Keep spatial rules in `src/world` and graphics/input in `src/rendering`. See [the isometric world architecture](docs/isometric-world.md) before adding tile or entity features.
