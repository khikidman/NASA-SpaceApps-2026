# Player-centered isometric world

## Boundaries

`src/world` owns spatial data, projection, movement, visible cells, short routes, facility interactions, and exploration-save validation. It has no React, browser, Pixi, or clock dependency. `src/features/world/use-explorer.ts` applies discrete commands and persists exploration independently of mission saves. Click-to-walk routes advance one validated square every 150 ms; keyboard moves cancel a queued route.

`src/rendering` owns the PixiJS WebGL application, scene geometry, input, camera, and home guidance. It receives player/selection snapshots and emits intentions, never changing mission resources. React updates once per completed square, not as a rendering clock.

## Square world and simulated 3D

The seeded 24 × 24 square grid projects tiles as 96 × 48 diamonds: `x = (col - row) * 48`, `y = (col + row) * 24`. Tile centers use half-square offsets. Shaded extruded tile edges, facility prisms, and an astronaut simulate 3D through a fixed isometric projection. There is no perspective rotation, arbitrary terrain elevation, or continuous 3D physics.

Home is the single `hab-01` facility at `(12, 12)`, occupying exactly one square. The astronaut starts next to it at `(12, 13)`. Other facilities are also single-square objects. Facilities and rocks block movement; empty sand and supply-route squares are walkable.

Picking operates in world units and canvas CSS pixels, independently of drawing-buffer resolution. Visible facility silhouettes are tested front-to-back before inverse-projecting the ground. Hidden tiles and facilities cannot be picked.

## Render-distance contract

The radius is exactly three logical squares:

```text
(tile.col - player.col)^2 + (tile.row - player.row)^2 <= 9
```

This includes the center and boundary: at most 29 squares, fewer at map edges. Offsets `(3, 0)` and `(2, 2)` are included; `(3, 1)` and `(3, 3)` are excluded. The circle is measured in the square grid; its isometric projection is not a screen-space circle.

`visibleTiles` checks at most 49 candidate cells. `buildWorldScene` creates ground, grid, rocks, and facilities only for the resulting subset. There is no full-map mesh under a mask. Each player step destroys the old local geometry and builds a new bounded scene. World metadata remains in memory; remote geometry is neither created nor drawn. Hover/selection use the same visibility boundary. Zoom and camera pan cannot reveal hidden squares.

All current facilities occupy one square, so none crosses the visibility boundary. Future multi-square buildings need an explicit clipping/visibility policy. The camera follows player movement while retaining zoom; Center player refits the local circle.

## Home guidance

When home lies outside radius three, `homeGuidance` computes its projected direction from the player and intersects that ray with a padded viewport rectangle. A WebGL HUD arrow identifies home and shows Euclidean distance. It is separate from world geometry and does not draw the remote home square.

The indicator disappears when home returns within range, including the radius boundary. Pan and zoom preserve its bearing. A DOM status message exposes distance to assistive technology. The arrow does not teleport or route the player home.

## Controls and interaction

- Arrow keys / WASD: one orthogonal square per move, subject to collisions and bounds.
- Click/tap empty ground: find and follow a short clear route through currently visible cells.
- Click/tap a facility: select it. Stand adjacent to use its button, E, Enter, or Use nearby facility.
- Drag: pan the camera. Scroll / buttons: zoom. Home / Center player: refit the local circle.
- Touch direction controls support movement without a keyboard.

Routes cannot enter occupied, rocky, out-of-bounds, or initially unseen cells. A new move cancels the route. Interactions require adjacency, open an information panel, and record each facility visit once. They do not award fictional oxygen, power, or science; mission decisions remain responsible for those resource changes.

## Persistence

Exploration uses a separate save key containing world version and mission seed. Player position, step count, and known facility visits are validated. Unwalkable positions, malformed payloads, incompatible versions/seeds, invalid counts, or unknown facility IDs are rejected. Corrupt exploration saves reset the astronaut beside home without resetting the mission.

Camera offsets, routes, and open information panels are transient. Existing mission replay saves are unchanged. Spatial generation uses a separate seed hash and does not consume mission randomness.

## GPU lifecycle

Pixi is dynamically imported only in the browser, with abort-aware initialization. The application render ticker stays stopped. Input, player steps, presentation changes, resize, or restoration request coalesced frames; idle worlds do not continuously submit GPU draw calls. Pixi's independent system ticker may still run resource-maintenance callbacks.

Native canvas listeners own input; the unused Pixi event target is detached. ResizeObserver tracks the viewport, with drawing-buffer resolution capped at 2× DPR. Cleanup cancels frames, aborts listeners, disconnects the observer, and destroys private resources. Scene replacement preserves the separate HUD and its text resources.

WebGL context loss pauses frames and shows recovery. If WebGL is unavailable, DOM mission controls remain usable. There is no automatic WebGPU or Canvas2D substitute.

The radius bounds current scene complexity, but it is not a target-device benchmark. Future animation, textures, larger footprints, and changing terrain need their own performance and occlusion checks.

## Verification

Unit tests cover exact radius boundaries, the 29-square maximum, every map edge, hidden picking, one-square home occupancy, movement/collision, routes, interaction proximity, independent saves, camera transforms, and home-marker bearings. Browser checks cover actual drawing, scene contents while moving away/returning, home-marker transitions, keyboard/click/touch navigation, persistence, zoom, resize, graphics recovery, and mission play.
