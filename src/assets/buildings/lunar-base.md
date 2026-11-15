# Lunar base · version 1

Archived complete-building art. The active implementation is documented in
`lunar-base-prefab.md` and uses six modular assets across a 3×3 footprint.

Game asset: `public/assets/buildings/lunar-base-v1.png` (1536×1024, transparent PNG).
SHA-256: `88c9eba44392b5cd648efe8e9f0c84d85b6993c9a70985a8ef934242da89b7a9`.

Created with the built-in image generation tool on 2026-11-14. The user-supplied
`lunar-base.png` was the concept reference; it is not required at runtime.

The building occupies two columns by three rows. Its southwest-facing entrance
is in the second front bay. `HOME_BASE_FOOTPRINT` and `HOME_BASE_DOOR_OFFSET` in
`src/world/home.ts` define occupancy and the door anchor. Existing outdoor spawn,
airlock landing, 5×5 interior, pressure cycle, and exit remain connected to that
door. Footprint dimensions are gameplay data, not image-generation metadata.

`src/rendering/lunar-base.ts` registers three foundation contact corners in the
source image and fits them to the game's 96×48 isometric grid. The asset is loaded
once through Pixi's shared texture cache. All six occupied cells share one visual.

## Antenna light switch

`LUNAR_BASE_ANTENNA_LIGHT_ON` in `src/rendering/lunar-base.ts` selects the sprite:
`false` (the default) uses `public/assets/buildings/lunar-base-light-off-v1.png`;
`true` uses the original glowing version. Change the boolean and reload the dev
preview, or rebuild/restart a production preview. Both states use the same canvas,
foundation registration, footprint, entrance, and interior behavior.

The off state was created with the built-in image generation tool, using the
original generated PNG as the edit target. It is a sibling asset, preserving the
original on state.

### Light-off edit prompt

Use case: precise-object-edit. Edit target: the attached transparent 1536×1024 lunar base game sprite. Create its antenna-light-OFF alternate state. Change ONLY the small red beacon lamp at the very top of the antenna: turn off its emissive light, remove the bright white/yellow central hotspot and orange illumination, and make the lens an unlit dark ruby red glass cap with a subtle natural non-emissive reflection. Remove the beacon's red glow/halo from surrounding transparent pixels. Preserve the exact physical silhouette and size of that lamp. STRICT invariants: keep every other part of the source exactly unchanged, including the dome, ribs, roof, antenna shaft, cream and gold materials, entrance, vents, foundation, framing, source canvas dimensions 1536×1024, object placement, scale, ground corners and transparent alpha background. This is an interchangeable on/off sprite state, so do not move, recenter, crop, resize, rotate or redraw the building. No background, scene, shadow, text or other additions. Output a true transparent PNG with the same dimensions and registration as the source.

## Teammate iteration

Import the PNG into the asset lab as a sprite and follow `asset-lab/PROTOCOL.md`
to preserve the original, named revisions, notes, source fingerprints, and export
packages. Create a sibling `lunar-base-v2.png` when replacing the art. The lab's
simple anchor/scale preview does not apply the game's three-corner registration.
After promotion, update the source path and measured west/south/east contact
corners in `lunar-base.ts`; keep the footprint and southwest door contract unless
deliberately changing gameplay. Verify footprint picking, walking around the
building, entering from the front, airlock cycling, and leaving on both desktop
and phone. Never change campaign supplies when iterating art.

## Generation prompt

Use case: stylized-concept. Asset type: production transparent isometric game building sprite. Reference image: design and material reference only. Create a new lunar home base inspired by the attached reference: chunky warm ivory modular walls, dark blue faceted geodesic glass dome with pale ribs, mustard gold door trim, small charcoal vents, a slim antenna with red beacon, sturdy dark grey foundation. Friendly polished low-poly 3D style for children aged 7–12. Ground footprint MUST be a single elongated 2 by 3 tile rectangular building. Orthographic 2:1 isometric projection: ground axis slopes exactly +0.5 and -0.5 on screen; no perspective. See the north/back corner at the top, east corner to right, south corner at bottom, west corner at left. Width along the down-right ground axis = 2 tiles; length along the down-left ground axis = 3 tiles. The main entrance MUST be on the southwest facing wall, the visible wall on the lower LEFT side of the image, NOT the lower right wall in the reference. Place the gold-framed entrance near the south/bottom corner on that lower-left wall, at the center of its rightmost one-tile-wide bay (75% along this wall from west corner to south corner). Its threshold stays within the footprint: tiny inset steps, no protruding ramp. The lower right visible wall has only vents/windows, NO entrance. The dome is centrally mounted on an elongated one-story rectangular base; antenna at rear right. All structure fits inside exact 2x3 rhombus footprint with straight clean foundation edges; foundation outline has no extra platforms. Isolated entire building fully visible with generous transparent padding, crisp antialiased edges, subtle self shading, soft upper-left light. Genuine transparent alpha background, no surrounding scene or terrain, no backdrop, no drop shadow outside the foundation, no grids, no text, no labels, no logos, no characters. Do not create a square building. A single complete production sprite.

## Refinement prompt (selected output)

Refine this production game sprite. Preserve the building design, southwest (lower-left wall) gold doorway near south corner, dome, antenna, ivory panels and gold details. Remove ALL atmosphere, glow, haze, backdrop, soft drop shadow and dark/grey halo surrounding the silhouette: every pixel outside the physical building must be fully transparent. Keep only the physical red beacon lens, no red glow outside it. Clear crisp opaque building interior, antialiased transparent edges. The rectangular foundation footprint must align to a 2 columns by 3 rows orthographic 2:1 isometric grid, slopes precisely +0.5 and -0.5. Lower-left facing front wall has TWO tile bays; lower-right facing side wall has THREE tile bays, so this side is 1.5 times the other on the ground plane. Door center at 75% along the TWO bay southwest wall from west to south corner. Straight rectangular rhombus foundation entirely inside its 2x3 footprint, no projecting ramp. Single whole asset with transparent padding. No background or cast shadow. Do not add any text, floor grid, terrain or other objects.
