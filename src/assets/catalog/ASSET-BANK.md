# Asset-bank integration

Source bank: `asset-lab/exports/`. The original PNGs, packages, prompts, and lab
layouts are retained. All 17 sprite packages were validated, explicitly rebased
to the current source as child revisions, and promoted through the existing lab
promotion tool. No source PNG was changed. The new parent links preserve the
original package digests and revision IDs.

`asset-bank-integration.json` maps each original package to its promoted child
revision and audit record. `lab-assets.json` holds immutable runtime URLs.
`asset-bank-world.json` records the world height and scale used by picking,
culling, and placement. Standard promotion records and complete archived child
packages are in `asset-lab/promotions/`; use `asset-lab/PROTOCOL.md` for rollback.

## Main world

The existing 3×3 home bounds and southwest door remain in place. Every constituent
still occupies one cell and owns its own drop, fade, and culling animation.

| Row / column | 0 | 1 | 2 |
| --- | --- | --- | --- |
| 0 | Solar | Greenhouse | Communications |
| 1 | Habitat | Tunnel junction | Research lab |
| 2 | Moon flag | Airlock | Solar |

This compact arrangement adapts the bank's example to the game's existing 3×3
footprint. The lab's larger example layout is preserved as a reference. Straight
column/row tunnels are registered for future layouts; they are not forced into
the smaller current base.

Power stops use the solar array; the safety challenge uses communications art;
the garden challenge uses the greenhouse; research/discovery stops use the lab;
the air stop uses the pressure module; shielding uses the habitat. Node IDs,
positions, resource effects, mission steps, entrance routing, and the indoor
level are unchanged. The water stop keeps its existing art because the bank does
not include a water-specific object.

The source sprites already contain complete 3D modules and their mounting pads.
They replace the old hull-plus-prop drawings; an extra hull is not drawn beneath
them. The packaged ground anchors and uniform scale are applied at each tile's
own center. The flag uses uniform scale 0.065 to fit the surrounding structures.
The existing antenna-light switch controls a separate beacon overlay, leaving
the source communications PNG intact. Terrain side-face culling is unchanged.

## Enclosed airlock replacement

The home airlock now uses `asset-lab/exports/airlock-tunnel-v1/`: its solid
exterior replaces the old pressure-module sprite in the southwest prefab cell.
Six supplied SVG layers are rendered to transparent PNGs for the indoor chamber.
They retain the design's 96×48 diamond, uniform 0.25 scale, common ground anchor,
42.0233 shell height, and 31.0233 doorway clearance matching the shared astronaut.
Other prefab modules and the air supply stop retain their existing artwork.

`airlock-tunnel-integration.json` records original SVG hashes, parent package,
child revisions, and standard promotion records. The original exports are
untouched. Each new image was validated and promoted through the lab protocol;
the source rebase is explicit in its child revision. Full packages and previous
catalog snapshots remain in `asset-lab/promotions/` for rollback.

`src/assets/buildings/airlock-tunnel.json` carries the supplied layer settings and
visibility states. The indoor renderer fades the shell from solid to chamber
cutaway to unobstructed interior, then reverses that progression on exit.
Sliding leaves use the existing interlocked pressure samples, while visibility
is independent of physical door state. Near shell parts render in front of the
indoor actor; far parts render behind it. The actor remains fully opaque.
The 1×1 landing, 5×5 room, grid handoffs, pressure timing, camera follow, and
radial world fades are preserved. No resource or save rules change.

## Missions and UI

The habitat dome and oxygen stop now use the native designs in
`asset-lab/exports/habitat-modules-v1/`, sharing the enclosed airlock's shell,
palette, 1×1 footprint and common frame anchor. `habitat-dome-v1` replaces the
habitat prefab member and shielding-stop illustration; `habitat-oxygen-v1`
replaces the air-stop illustration. Their complete heights are registered for
world picking and culling. Original vectors, PNGs, packages, generator hashes
and rollback records are linked by `habitat-modules-integration.json`.
Resources and entry behavior are unchanged by these substitutions.
The central prefab junction also uses `habitat-junction-v1`: an enclosed ivory
cell with matching door proportions and a cross skylight. Its original 1×1
position, independent terrain animation, and base interaction remain intact.
The native junction generator and promotion record are included in the same
habitat integration log. No tiles are removed in this redesign.
The base's plant bay (prefab row 0, column 1) and southeast research bay
(row 1, column 2) now use `habitat-plant-v1` and `habitat-research-v1`.
Their glass growing canopy and instrument skylight share the same 42.0233-height
ivory hull. Complete sprite heights, including rooftop equipment, are registered
for picking and culling. Sources and promotion lineage are in the habitat log;
independent 1×1 drop/fade behavior and base interactions are preserved.
This substitution applies to base members; standalone challenge nodes retain
their existing artwork and gameplay.

Habitat, solar, communications, and greenhouse illustrations replace their
matching large pictorial icons. The grow-light fixture replaces the lamp artwork.
In the garden ordering task it changes from off to white-low when placed, making
the action visible without changing answers, costs, or rewards.

All seven LED variants are registered. `DEFAULT_GROW_LIGHT_STATE` in
`src/assets/asset-bank.ts` selects the default illustration. The fixture is a
mission illustration, not a world object: its source 1×2 footprint does not create
a multi-tile object or change the game's 1×1 world-object rule. No research claims
or new power/food rules are inferred from the artwork.
