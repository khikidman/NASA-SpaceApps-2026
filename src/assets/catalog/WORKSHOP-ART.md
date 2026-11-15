# Workshop vector artwork

`src/components/workshop-art.tsx` is the source for the native SVG workshop
symbol system and five instrument illustrations. It extends the existing SVG
UI design; no generated raster sprite, external font, emoji renderer, stretched
world image or new runtime dependency is used.

Style contract: ivory casing, charcoal recesses, gold controls, navy screens,
softly faceted volumes, consistent strokes and light from the upper left.
Equipment illustrations share a 120×120 view; symbols use 64×64. Circuit marks
use 32×32. These are UI assets with no world occupancy or collision meaning.
The existing astronaut atlas and registered feet remain the exercise character.

Symbol families:

- Observe: scanner, wave, detector, level, trace.
- Manipulate: wire, drill, gear, filter, tray, pipe, heat, valve.
- Carry/results: ice, rock, bucket, drop, Earth, Moon, send.
- Navigation/learning: check, tap, reset, hint, book, play/pause, foot, lift.

Use icons beside short labels or accessible control names. Icons cannot be the
only source of instruction or state. Shapes, outlines, counts and text preserve
meaning without color. Decorative SVGs are hidden from assistive technology;
control labels carry their names. Color and movement never decide success.

For raster assets and world replacements, continue to use the immutable lab
promotion protocol. These SVGs remain editable repository-native UI source.
