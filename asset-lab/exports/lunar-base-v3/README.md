# Lunar base v3 — character-scaled structural modules

This revision supersedes the v2 miniature whole-building approach for design review. All new files remain in the asset lab. The main game is read-only input; no runtime asset or code is replaced.

## Measured scale

| Reference | World pixels | Source |
| --- | ---: | --- |
| Ground tile | 96 × 48 | `src/world/isometric.ts` |
| Exterior clear doorway height | 31.023339 | `360 × 48 / 557` from `src/assets/buildings/lunar-base-modules.json` |
| Astronaut height | 25.439138 | clear doorway height × 0.82, `src/assets/characters/astronaut-settings.ts` |
| Clear vertical headroom | 5.584201 | door height minus astronaut height |
| Structural wall | 60 | `BASE_HULL_HEIGHT`, `src/world/base-prefab.ts` |
| Clear projected door width | 22 | New design choice, not a measurement of the existing PNG |

These are world-space art units, not meters or fixed screen pixels. Camera zoom scales the actor and environment together. The 192×256 astronaut frame is transparent padding and is **not** the actor's world height; its frame-specific `referenceHeight` and foot pivot must be used.

The authoritative actor stays unchanged. All modules use its established ivory, charcoal, amber and dark-glass palette. Existing hull and equipment textures are composed at their runtime registrations on exact native grid geometry. These are structural cells, not tiny complete buildings each with miniature doors.

## Airlock = one full 1×1 tile

The chamber floor spans exactly one 96×48 diamond. Opposite inner/outer threshold centers are `(24,-12)` and `(-24,12)` relative to the ground-center anchor. Both clear openings are 31.023339 world pixels vertically. The row-axis crossing is outside → chamber center → inside. The adjacent `entry-hull` module has a real transparent aperture at the matching threshold, rather than an open frame drawn over a solid wall.

Four static states have identical frame, scale and anchor: closed, outer open, sealed pressure hold, and inner open. The closed and pressure states share closed geometry; their indicator colors differ. The supplied sequence never requires both doors open simultaneously.

Nine separate SVG layers provide the floor, two frames, two paired-door layers, and four individual leaf layers. Animate a leaf's inner `[data-leaf]` group by `translate(±11 * openness, 0)` in its portal plane, keeping the aperture clip fixed. The portal's plane transform projects that motion into `(±11, ±5.5)` world pixels. Draw the astronaut between the inner and outer assemblies. The cutaway is deliberate: the actor remains readable during the pressure cycle.

`airlock-cycle.svg` is a looping 2.2-second entry prototype using the existing phase boundaries and the actual astronaut atlas frame. It shows the full-tile boarding stop and mutually exclusive doors. Its actor pose is a static reference; gameplay should continue using the existing walking atlas and authoritative airlock state. The loop resets after entry for demonstration.

**Integration mismatch found:** the current interior renderer uses 45 world pixels for its sliding leaves and 47 for its frame, while the exterior-derived opening is 31.023339. These lab assets standardize on the existing actor/exterior relationship. When integrating, use the shared clear-height value in both scenes. This revision does not claim that runtime integration or animation has been changed or tested.

## Simplified layout and exports

A 2×2 structural core connects to one dedicated airlock tile on its row+ side. A single tunnel connects the research cell to a greenhouse; one solar rack sits outside. Every placed object has a 1×1 footprint. There are eight placements, eight distinct structural/utility designs plus the entry-hull variant, and four airlock states; thirteen importable PNGs in total.

`scale-contract.json` carries measured scale, exact anchors, baseline file hashes, layout, crossing path and layer order. All PNG frames are 1024×1024; display scale is 0.25, anchor `(0.5, 0.78125)`. This gives a 256×256 logical canvas with the tile center at `(128,200)`. Its actual ground diamond is 96×48; transparent frame dimensions are not a footprint.

Import any `.assetlab.json` using **Import package**. Each has verified PNG and package checksums. `scale-and-layout-preview.png` compares the actual project astronaut, door and walls, then shows the layout and airlock states. The top three scale-reference groups share the same 3.2× presentation zoom and baseline.

Run `node asset-lab/exports/lunar-base-v3/build.mjs` from the project root to regenerate. Native SVG geometry preserves exact dimensions; original project PNG textures are embedded without editing their artwork. No new ImageGen call is needed for this deterministic structural revision.
