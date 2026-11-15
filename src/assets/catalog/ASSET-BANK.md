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

## Missions and UI

Habitat, solar, communications, and greenhouse illustrations replace their
matching large pictorial icons. The grow-light fixture replaces the lamp artwork.
In the garden ordering task it changes from off to white-low when placed, making
the action visible without changing answers, costs, or rewards.

All seven LED variants are registered. `DEFAULT_GROW_LIGHT_STATE` in
`src/assets/asset-bank.ts` selects the default illustration. The fixture is a
mission illustration, not a world object: its source 1×2 footprint does not create
a multi-tile object or change the game's 1×1 world-object rule. No research claims
or new power/food rules are inferred from the artwork.
