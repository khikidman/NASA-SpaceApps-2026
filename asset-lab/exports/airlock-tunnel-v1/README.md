# Enclosed 1×1 airlock tunnel — three views

Three alternate visibility states of **one physical enclosed chamber**, at the character scale established in lunar-base-v3. All work is confined to the asset lab.

| File / state | Presentation |
| --- | --- |
| `exterior-solid` | Solid four-wall enclosure and solid roof; closed exterior door. |
| `interior-phase-1` | Ceiling and two camera-facing near walls at 6% opacity. Far enclosure stays solid. Outer frame fades to 16%; both doors remain physically closed for the pressure hold. |
| `interior-phase-2` | Ceiling and near walls hidden; far walls 3.5%, frames 6–8%, floor 25%. The inner door is open; the closed outer door is visually hidden. The chamber stops obstructing the base interior. |

These are visibility states, not different collision objects. Transparency does not open a wall or disable the airlock interlock. Phase 2 does not physically open both doors. Apply the visibility state separately from authoritative pressure/door timing, and reverse the visibility progression when exiting.

## Exact common scale

- Footprint: **1 column × 1 row**. Logical ground diamond: **96×48 world pixels**.
- Ground center anchor: `(0,0)`. Row-axis inner threshold `(24,-12)`, outer threshold `(-24,12)`.
- Astronaut world height: **25.439138**; actual project atlas used in the review illustration.
- Clear doorway vertical height: **31.023339**; same formula as runtime, `360 × 48 / 557`.
- Clear doorway projected width: **22**; retained v3 art-direction choice.
- Roof height above floor: **42.023339**. Enclosed headroom exceeds the 25.44-pixel astronaut height.
- Every PNG: **1024×1024 RGBA**, display scale **0.25**, anchor **(0.5, 0.78125)**. Transparent padding is not additional occupied ground.

The native SVG geometry is shared exactly between states. Only part opacity, light color and the inner door's presentation change. Ivory walls, amber jambs, charcoal leaves and blue-gray windows match the prior design. The roof closes the complete tile, not a decorative canopy over an open room.

## Files and integration

Each state has an editable `.svg`, transparent `.png`, and validated `.assetlab.json` package. Import the package through the lab's **Import package** control. `airlock-tunnel.states.json` includes geometry, scale, opacities, threshold coordinates and draw order. `three-state-preview.png` shows all three states; the astronaut and colored base floor are review context and are not baked into any asset.

Eight `layer-*.svg` files separate floor, far enclosure, near enclosure, ceiling, inner/outer frames, and inner/outer closed door pairs. Keep the actor and base interior fully opaque on their own layers; fade the shell parts independently. Draw the far enclosure and inner assembly behind the actor, then near enclosure, outer assembly and roof in front. For SVG leaf motion, translate each internal `[data-leaf]` group ±11×openness in portal-local X, keeping the aperture clip fixed. The renderer may instead use its existing dynamic door primitives with the supplied dimensions.

The live game's existing interior opening is 45 world pixels, while the actor/exterior baseline uses 31.023339. Reconcile this when integrating. **No main game code, animation logic, collision rules or runtime assets are modified here.**

Regenerate from the project root with `node asset-lab/exports/airlock-tunnel-v1/build.mjs`. The build verifies package/file checksums and forbids simultaneous physical door openings. This is a native geometry revision using the existing design system, not a new generative-image approximation.
