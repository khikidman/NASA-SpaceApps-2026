# Modular lunar base

The current artwork uses the promoted bank in `../catalog/ASSET-BANK.md`.
The six-component set below is retained as the previous version for rollback.
Both versions use the same 3×3 bounds and independent 1×1 world objects.

The current base is a **3×3 prefab containing nine independent 1×1 volumes**.
The earlier complete-building PNGs are archived references, not runtime assets.

Six transparent images in `public/assets/buildings/lunar-base-modules/` provide
the hull panel, airlock facade, intake vent, exhaust vent, antenna, and dome.
They were created with built-in ImageGen. Exact prompts are retained in
`lunar-base-module-prompts.json`; anchors and uniform display sizes live in
`lunar-base-modules.json`. Every image remains at its original generated size.
No shearing, nonuniform scaling, or whole-building transform is used.

## Prefab layout

Edit `LUNAR_BASE_PREFAB` in `src/world/base-prefab.ts`:

| Row / column | 0 | 1 | 2 |
| --- | --- | --- | --- |
| 0 | Intake vent | Hull | Antenna |
| 1 | Hull | Dome | Hull |
| 2 | Exhaust vent | Airlock | Hull |

The prefab's origin is `(11,10)`. Its southwest airlock remains at `(12,12)`,
with the outdoor approach at `(12,13)`. All members share a prefab ID and route
base interactions through that doorway. The existing interior, entrance landing,
airlock cycle, camera follow, and exit behavior stay connected there.

## Full-volume tiles and independent movement

Each member has its own world entity, 1×1 footprint, hull, render container,
surface offset, opacity, presence animation, pick silhouette, and culling area.
There is no shared render parent positioned at the door or another dropping tile.
Each member follows only its own terrain tile as that tile drops or fades.

The hull is a solid grid-aligned prism covering the complete 96×48 diamond,
60 projected pixels tall. This includes the airlock module: the door image is
mounted on a complete hull volume rather than standing alone in empty space.
The roof panel is clipped to its tile; roof equipment stays within one tile.
The individual source images receive only translation and uniform scaling.

Adjacent hull side faces are clipped to their actual exposed height, recalculated
as the tiles animate. Equal-height neighbors hide the shared wall. A dropping
neighbor reveals the newly exposed upper wall. Missing neighbors reveal the full
side. Viewport culling does not change this neighbor relationship.

`LUNAR_BASE_ANTENNA_LIGHT_ON` in `src/rendering/lunar-base.ts` still defaults to
`false`. Set it to `true` to add the separate illuminated beacon overlay. It moves
with the antenna tile only.

## Teammate iteration

Follow `asset-lab/PROTOCOL.md`: import a component PNG, retain the original and
named revisions, record notes, and export the package. Replace one module at a
time and update its registration if its transparent padding changes. Preserve
uniform scale, the 1×1 occupancy contract, and the common camera angle. The layout
is gameplay data; generating a new image must not change collision footprints,
campaign supplies, or the indoor level. Keep versioned originals for rollback.
