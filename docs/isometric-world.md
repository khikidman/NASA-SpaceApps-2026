# Player-centered isometric world

## Boundaries

`src/world` owns spatial data, projection, movement, visible cells, short routes, facility interactions, and exploration-save validation. It has no React, browser, Pixi, or clock dependency. `src/features/world/use-explorer.ts` manages transient selection/routes and sends movement intentions into the authoritative journey engine. Position and accepted node actions share the campaign replay save. Click-to-walk advances after renderer readiness, with a 200 ms cruising stride and eased starts/stops. A one-frame lookahead prepares the next validated step on the same clock. Keyboard movement replaces a clicked route.

`src/rendering` owns the PixiJS WebGL application, scene geometry, input, camera, and home guidance. It receives player/selection snapshots and emits intentions, never changing mission resources. React updates once per completed square, not as a rendering clock.

## Square world and simulated 3D

The seeded 24 × 24 square grid projects tiles as 96 × 48 diamonds: `x = (col - row) * 48`, `y = (col + row) * 24`. Tile centers use half-square offsets. Shaded extruded tile edges, facility prisms, and an astronaut simulate 3D through a fixed isometric projection. There is no perspective rotation, arbitrary terrain elevation, or continuous 3D physics.

Home is the single `hab-01` facility at `(12, 12)`, occupying exactly one square. The astronaut starts next to it at `(12, 13)`. Other facilities are also single-square objects. Facilities and rocks block movement; empty sand and supply-route squares are walkable.

Picking operates in world units and canvas CSS pixels, independently of drawing-buffer resolution. Visible facility silhouettes are tested front-to-back before inverse-projecting the ground. Hidden tiles and facilities cannot be picked.

## Render-distance contract

The render reach is five logical squares, sampled against the outer half-tile boundary to avoid isolated axis tips:

```text
(tile.col - player.col)^2 + (tile.row - player.row)^2 < 5.5^2
```

There are at most 97 active squares, fewer at map edges. Offsets `(5, 0)`, `(3, 4)`, and `(5, 2)` are included; `(5, 3)` and `(4, 4)` are excluded. The circle is measured in the square grid; its isometric projection is not a screen-space circle.

`visibleTiles` checks at most 121 candidate cells. `WorldScene` retains ground, grid, rocks, and facility graphics for overlapping cells rather than rebuilding the scene every step. There is no full-map mesh under a mask. Incoming cells rise 46 projected pixels from below while fading in over 360 ms. Departing cells fall and fade over 280 ms, then their geometry is destroyed. The small departing set is the only temporary exception to the 97-active-square drawing budget: it cannot be selected, walked to by clicking, or used outside the active circle. Rapid reversals reuse an in-flight tile at its current height/opacity.

Moon terrain uses four descending radial rings at 4, 10, 20, and 34 projected pixels. The fully opaque center is controlled by `SOLID_RADIUS = 4` in `src/world/visibility.ts`; beyond it opacity falls smoothly toward 25%. `surfaceOpacity` accepts an optional radius so a future player-state adapter can supply a different value without changing the math. No tiredness detection or automatic radius changes are enabled. Opacity radius and render reach are independent. Height and opacity retarget from their current displayed values, and their clocks pause with the renderer.

Tile side-face culling treats terrain below a tile top as solid even when its displayed opacity is reduced. The two camera-facing walls compare against the current heights of their row+1 and col+1 neighbors. Equal or higher neighbors remove the shared wall entirely; lower neighbors expose only the step, capped at the 14-pixel visual thickness. Missing neighbors retain the outside rim. Neighbor transparency and viewport culling do not expose internal walls. All animated heights are sampled before clipping, including fading-out neighbors, so sides reveal smoothly during entry, departure, and reversal. Side graphics and their dust accents are rebuilt only when exposed depths change. `data-exposed-sides` reports the emitted face count.

Before each render, Pixi culls cell ground and object groups against the full CSS-pixel viewport with a 24-pixel overscan margin. Cached local culling bounds include tile sides, rocks, rooftops, antennae, and badges. Transforms are updated after camera changes and animation, so culling follows pan, zoom, resize, and tile height. A visible rooftop is kept even if its ground is off-screen. Culled groups are excluded from picking but retained for reuse, while outgoing cells still finish their transitions and are disposed. Canvas diagnostics report `data-culled-tiles` and `data-culled-objects`. This is viewport culling; it does not claim per-pixel building occlusion.

Ground and objects use separate sorted layers, so buildings, walking feet, and tile extrusion retain correct depth. Stable picking polygons and pick order are reused; incoming picking follows the animated height. Remote map metadata stays in memory, but remote geometry is never created. Zoom and pan cannot reveal undiscovered distant terrain.

Home is a 3×3 prefab at `(11,10)` through `(13,12)`, containing nine separate 1×1 full-volume objects. Six image assets provide hull panels, airlock, intake and exhaust vents, antenna, and dome. The southwest airlock occupies `(12,12)` with the approach at `(12,13)`. `src/world/base-prefab.ts` defines the arrangement. Every member owns its own terrain offset, fade, picking, and culling; no shared anchor controls the prefab's displayed height. All images use translation and uniform scale. Grid-aligned hulls fill their entire tile, including the airlock. Visible hull sides are clipped using actual neighboring module heights, so dropping tiles reveal exposed volume without drawing hidden shared faces. See `src/assets/buildings/lunar-base-prefab.md`. The camera tracks the interpolated astronaut displacement while retaining zoom and manual pan offset; Center player refits the local circle, with a CSS-defined minimum starting zoom for readable touch targets on small screens. The renderer reads CSS-defined camera insets to frame the world inside the HUD safe area. Home guidance uses that same area, while pointer picking remains in full-canvas CSS pixels.

## Walk-in home interior

`src/world/home.ts` defines the five-square room size, entry, exit, front-door approach, exterior footprint and door offset, and transition duration. `HomeInterior` is a separate Pixi presentation scene with 25 flat room tiles plus one attached 1×1 airlock tile, tall back walls, and low cutaway front walls. The airlock occupies column 2, row 5, with its inner door on row 5 and outer door on row 6; its floor does not straddle a tile edge. Exterior home clicks route to the front door before automatically entering; movement toward the base and E use the same approach. The renderer queues entry until the last outdoor visual stride has finished.

The room exit tile is mapped exactly onto the base tile: the room pivot is the exit tile center, its screen origin is the projected base center, and its scale matches the shared world camera. Floor tiles and wall sections use a reversible distance-delayed radial reveal from that door. Only their opacity changes: floor tiles and wall sections remain at their normal positions and scale. Outdoor tiles fade sequentially from the outer edge inward, with buildings and rocks sharing their tile opacity. This multiplies the normal surface and entry/exit opacity once, using a stored baseline so repeated frames do not compound the fade. Neighbor side-face visibility is refreshed as tiles become fully hidden. The world container keeps the ordinary camera transform throughout. Exiting evaluates the same profiles backward, restoring the exact outdoor transform. Pan and zoom update the shared camera in both views, with no automatic move to a separate interior screen center. A single opaque screen-space astronaut interpolates position from the outdoor feet to the moving interior feet, then hands off at the identical transform. The exterior and interior avatars are hidden during this crossing. Exit requests route to the airlock; leaving reverses the opacity waves and hands back to the outdoor avatar. Clocks pause with the renderer and reduced motion settles immediately.

`src/world/airlock.ts` defines the reversible, deterministic two-door sequence. Entry opens the outer hatch, admits the astronaut, seals it, changes pressure, opens the inner hatch, and leaves the player centered on the airlock tile. The inner hatch stays open for room access. Exit starts on that same tile, seals the inner door, vents the chamber, and opens the outer door before the player steps outside. The two open intervals never overlap. A cutaway chamber in `AirlockVisual` draws retracting door leaves, a pressure gauge, and readiness lights. Player commands are held during cycling; a mid-entry Escape queues a safe return after entry completes. HUD status updates once per phase while the renderer animates the gauge and doors. Cycle clocks pause with the renderer; reduced motion resolves immediately to the appropriate endpoint, with only the inner door open inside and both doors sealed outside. The 2.2-second cycle is fictional, transient presentation state and does not consume campaign resources.

Room navigation has its own bounded routes and never submits campaign `move` actions. The attached airlock tile, `(2, 5)`, is the entry spawn, room pivot, and exit approach. Entry eases from the outside grid square `(2, 6)` onto this tile center before pressure changes; the player stays centered on the tile for the rest of the entry cycle. Exit eases back to that exact outside grid center before the outdoor avatar handoff; endpoint copies avoid fractional-position residue or overshoot. The airlock can be crossed or stood on and connects to the room through `(2, 4)`. Only the extra step to `(2, 6)` is permitted outside the floor; sideways steps from the airlock are blocked. Requesting the outside step starts the outbound airlock cycle; all other outside steps are blocked. Exit-button and Escape requests route through that same opening and cycle. Interior commands cannot move through walls or trigger outdoor actions. The camera tracks the effective world-space player feet every animation frame, including the blended crossing avatar. This keeps the player steady on screen while preserving manual pan and zoom. Tracking pauses during manual drags and resumes without snapping. Exit restores the saved outdoor door position, with camera refitting after a resize. Rest, book, and help remain available; outdoor mission buttons are hidden while inside. Room state is transient and refreshing returns to the campaign surface. No construction or interior task system is included yet.

## Home guidance

When home lies outside radius five, `homeGuidance` computes its projected direction from the player and intersects that ray with a padded viewport rectangle. A WebGL HUD arrow identifies home and shows Euclidean distance. It is separate from world geometry and does not draw the remote home square.

The indicator disappears when home returns within range, including the radius boundary. Pan and zoom preserve its bearing. A DOM status message exposes distance to assistive technology. The arrow does not teleport or route the player home.

## Controls and interaction

- Arrow keys / WASD: one orthogonal square per move, subject to collisions and bounds.
- Click/tap empty ground: find and follow a short clear route through currently visible cells.
- Click/tap a facility: select it and walk to the nearest reachable visible neighboring square. Once beside it, use its button, E, Enter, or Use stop.
- Drag: pan the camera. Scroll / buttons: zoom. Home / Center player: refit the local circle.
- Touch direction controls support movement without a keyboard.

Routes cannot enter occupied, rocky, out-of-bounds, or initially unseen cells. A single bounded BFS finds the shortest empty-ground route or approach to an occupied node. A glowing destination, expanding selection ripple, and waypoint trail make the route visible. Pointer-down records the intended cell so a moving camera cannot change the target before pointer-up. Dragging cancels that click. A keyboard move cancels the route. Node interactions require adjacency. Base opens daily guidance; supply nodes grant bounded resources once each day; task nodes open world-specific two-step minigames. The central journey engine revalidates every accepted action, independently of UI selection.

The shared generator accepts a Moon/Mars level ID. Moon uses gray terrain; Mars uses red terrain. Both have one home, five supply/discovery nodes, three task nodes, and empty walkable cells. Nearby nodes carry +, ✦, ?, or home markers. Used nodes fade and display a check until the next day.

## Persistence

The journey log persists player moves, resource collection, accepted challenge steps, learning cards, day decisions, and travel together. Old standalone explorer helpers remain available for spatial validation tests but are not used by the active UI. Camera offsets, routes, fractional visual positions, selection pulses, tile transitions, hints, and open panels are transient. World metadata derives from the seed without consuming game randomness.

## GPU lifecycle

Pixi is dynamically imported only in the browser, with abort-aware initialization. The application render ticker stays stopped. Input, presentation, resize, and restoration request coalesced frames. A bounded animation loop runs only during walks, tile transitions, a finite 620 ms selection pulse, or a 760 ms interaction burst; settled worlds do not continuously submit GPU draw calls. React updates per accepted square, not per animation frame. The renderer caches HUD insets until resize and only reports changed zoom values. Pixi's independent system ticker may still run resource-maintenance callbacks.

Native canvas listeners own input; the unused Pixi event target is detached. ResizeObserver tracks the viewport, with drawing-buffer resolution capped at 2× DPR. Cleanup cancels frames, aborts listeners, disconnects the observer, and destroys private resources. Scene replacement preserves the separate HUD and its text resources.

The black backdrop has a seeded, screen-space star layer behind the transparent WebGL canvas. Individual star opacity interpolates between different dim/bright endpoints with independent durations and phases. CSS handles this decoration without requesting world-render frames. Animation pauses when the viewport is offscreen or the document is hidden, and reduced-motion preferences keep the stars at a steady intermediate brightness. Star animation never updates mission or exploration state.

WebGL context loss or a hidden tab pauses motion clocks and shows recovery where appropriate. Restore shifts the clocks instead of fast-forwarding through a route. Reduced-motion preferences disable tile/character/pulse animation and use discrete paced steps. Keyboard hold/release, focus loss, and pointer cancellation are handled separately from operating-system key repeat. If WebGL is unavailable, a readable retry message appears; the HUD, help, and saved journey remain available. There is no automatic WebGPU or Canvas2D substitute.

The radius bounds current scene complexity, but it is not a target-device benchmark. Additional effects, textures, larger footprints, and changing terrain need their own performance and occlusion checks.

## Verification

Unit tests cover exact radius boundaries, the 97-square maximum, every map edge, hidden picking, one-square home occupancy, movement/collision, routes, interaction proximity, spatial save validation helpers and unified journey replay, camera transforms, and home-marker bearings. Additional tests cover motion continuity, retiming, tile identity retention, reversal, disposal, reduced motion, and shortest node approaches. Browser checks cover fractional movement, steady camera tracking, bounded departing geometry, idle frame counts, click retargeting, held keys, and actual drawing, scene contents while moving away/returning, home-marker transitions, keyboard/click/touch navigation, persistence, zoom, resize, graphics recovery, and mission play.

## Full-screen game shell

The game root is a fixed 100dvh viewport. The upper-left HUD uses four supply bars and a star counter; bottom-center mission buttons select a world target and show two-step completion. Selecting a visible target uses the same bounded path planner as a world click. An out-of-range target has a separate direction marker, and begins a visible approach when the player reaches its vicinity. Home guidance remains independent.

A small contextual action shows an icon, signed supply changes, and Collect/Play/Rest. Collection no longer opens a prose dialog. View-only feedback is derived from accepted actions and resource differences; it does not enter saves or modify engine rules. Feedback IDs prevent replaying old rewards on reload. World bursts, counter pops, and floating resource deltas settle after a short duration; reduced-motion users get static feedback that still dismisses.

Challenge dialogs use code-drawn SVG illustrations, click/tap cards, drag-to-pack slots, and numbered sequence drop targets. Sequence slots preserve gaps and chosen positions. Partial sequences cannot submit, and all completed answers still pass through the original engine validator. Keyboard button operation, free hints, optional learning facts, and a discovery book remain available. Phone layouts start closer to the astronaut for larger world targets. Extra camera controls and an optional movement pad stay folded away by default. Supporting reading pages keep normal document scrolling.

The world viewport fades in after renderer readiness on each level transition. Reduced-motion preferences skip this animation. Stars remain a separate CSS background layer.

## Lunar surface detail

The Moon renderer creates one 1536×576 texture sheet containing 48 two-times-resolution isometric surfaces. A seeded canvas generator paints multi-scale dust grain, soft regolith patches, crater bowls with directional rim light/shadow, ejecta, small stones, and wheel/boot tracks. Ground, track direction, intersections, compacted pads, and rubble choose stable atlas slots from world seed and tile coordinates. The atlas is generated once, shared by all Moon tile sprites, reused on reversals, and explicitly disposed with the renderer. No textures are generated per animation frame or player step. The atlas is local procedural art, not downloaded imagery or a scientific elevation model.

Prism sides have dusty lips and embedded fragments. Larger obstacle rocks use irregular shaded facets instead of cubes. Surface detail changes no collision, selection, cost, or save rules. Mars retains its existing palette and terrain presentation. Optional grid lines are subdued so craters remain legible.
