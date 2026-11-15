# Lunar astronaut

`public/assets/characters/astronaut-sheet-v1.png` is a transparent 1536×1024
spritesheet created with built-in ImageGen to match the supplied lunar asset
package: ivory suit, gold fittings, charcoal boots and joints, navy visor, and a
compact backpack. The exact prompt is saved in `astronaut-generation.json`.

The sheet contains eight columns and four rows: southwest, southeast, northeast,
and northwest. Column zero is idle; columns one through seven form the walking
loop. `astronaut-atlas.json` contains source frame rectangles, foot anchors, and
one common reference height. Foot registration keeps the sprite grounded without
changing the source art. Frames use uniform scaling only.

## Scale

`astronaut-settings.ts` defines `ASTRONAUT_DOOR_HEIGHT_RATIO` (currently `0.82`).
The measured clear airlock opening is 360 source pixels. Its existing display
scale is `48 / 557`, giving a clear opening of approximately 31 world pixels.
The astronaut is therefore approximately 25.4 world pixels tall, compared with
the former 56-pixel character. Change the ratio to tune the character size.
Changing the airlock's display scale also updates the character automatically.

The same cached atlas and sizing rules supply the surface player, room player,
and screen-space airlock crossing player. Their root always represents the feet;
camera zoom does not change their proportions relative to the tiles or doorway.
Four facing directions follow the isometric grid. Walking frames advance with
the existing continuous movement progress, preserving pause and reduced-motion
behavior without adding a separate animation timer. Idle poses hold still.

## Teammate iteration

Follow `asset-lab/PROTOCOL.md` to retain originals, notes, named revisions, and
export packages. Import the sheet with 192×256 frame dimensions. For replacements,
preserve the eight-column/four-row ordering, transparent gutters, consistent body
size, and foot baseline. Update the frame registrations if the artwork moves.
Keep the world-height ratio separate from image pixel dimensions. Do not scale
individual frames independently or change movement/collision rules when revising
the character art.
