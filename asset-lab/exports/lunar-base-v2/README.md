# Modular lunar base v2

All buildings and all tunnel pieces occupy exactly **1×1** grid cells. Each tile uses a common 2:1 isometric mounting pad, camera, ground-center anchor, and display scale. Tall artwork extends vertically above its own cell; no object acquires a multi-cell footprint.

## Layout

A compact pressurized cross connects living quarters, a research lab, a greenhouse, and an airlock. Straight tunnel segments occupy the cells between the central junction and the buildings. Solar units and the communications dish occupy separate utility cells outside the pressurized cluster. Each repeated solar unit is still one cell.

This is a game-scale interpretation of proposed architectures, not a reconstruction of an operating lunar settlement. Inspiration:

- ESA Moon Village: separately delivered modules customised for different functions and linked into an expanding settlement. https://www.esa.int/articles/esa-engineers-assess-moon-village-habitat
- NASA Moon Base Systems: modular habitats, airlocks, aggregation nodes and supporting surface infrastructure. https://www.nasa.gov/moonbase-systems/

The cross arrangement, 1×1 cell constraint, palette, and connector shapes are art-direction choices. Physical separation distances, radiation protection performance, and engineering suitability are not asserted.

## Deliverables

- Nine transparent PNG sprites: six facility modules and three tunnel pieces.
- One validated `.assetlab.json` import package per sprite.
- `layout.json`: asset definitions, anchors, 1×1 footprints, compatible ports, and example placement.
- `preview.html`: lab-only layout/catalog viewer. Serve this directory locally to review it.
- `prompts.json`: built-in image_gen prompts and source references.

Tunnel ports use `col-`, `col+`, `row-`, `row+` in the project's coordinate system. These mean grid directions, not compass bearings. The two straight pieces and cross piece cover this layout. Module collars support attachment on all sides; unused collars are sealed.

Main game code, catalogs, world generation, collision behavior, and original assets are unchanged. The lab package protocol registers artwork only; the JSON layout is a review artifact, not a game integration.
