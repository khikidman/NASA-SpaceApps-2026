# Habitat modules matching the enclosed airlock

Five native SVG designs share the `airlock-tunnel-v1` geometry, palette and scale:

- `dome`: ivory structural hull, charcoal foundation, gold trim and faceted navy observatory dome.
- `oxygen`: matching hull with twin oxygen tanks, regulator panel and ventilation grille.
- `junction`: enclosed hub with matching gold-framed doors and a navy cross skylight.
- `plant`: glass growing canopy, three planting trays and visible greenery in the walls.
- `research`: southeast instrument bay with navy panels, sample vials and a flask skylight.

Each occupies one complete 96×48 grid diamond with independent ground anchoring.
The hull is 42.023339 world pixels tall, matching the new airlock. PNGs are
1024×1024, uniformly displayed at 0.25, with anchor `(0.5, 0.78125)`.
Roof equipment stays within the footprint. The dome's height is included in its
runtime culling and picking registration. These are fictional game props.

Edit the native geometry in `build.mjs`, then run:

```sh
node asset-lab/exports/habitat-modules-v1/build.mjs
node asset-lab/exports/habitat-modules-v1/build-junction.mjs
node asset-lab/exports/habitat-modules-v1/build-plant-research.mjs
```

Regeneration updates lab SVG/PNG previews only. Existing `.assetlab.json` packages
remain immutable snapshots. Make a new revision for another promotion; follow
`asset-lab/PROTOCOL.md`. The initial packages, parent airlock reference, generator
hash and promotion records are linked in
`src/assets/catalog/habitat-modules-integration.json`.

Runtime bindings are explicit in `src/assets/asset-bank.ts`: the dome replaces
habitat art in the home prefab and shielding stop, while oxygen replaces the air
supply stop art. Supply effects, positions, interactions and base entry remain
unchanged by this artwork substitution.
The central prefab member uses `habitat-junction-v1` in its existing location;
it is redesigned rather than removed, per the user's clarification.
The base greenhouse at prefab row 0 / column 1 uses `habitat-plant-v1`; the
southeast research bay at row 1 / column 2 uses `habitat-research-v1`. Both keep
their original tile positions and independent terrain anchors. Standalone
garden and research challenge nodes retain their previous artwork and rules.
