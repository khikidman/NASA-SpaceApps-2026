# Living Diorama lunar stage v1

Integrated as `living-diorama-moonstage-v1` through the normal lab promotion protocol.
`moon-stage.png` is the preserved generated source. `generation.json` records the
prompt and `integration.json` identifies the immutable revision and promotion.

This is a UI backdrop, with no inventory, controls, scientific readings or success
states baked into the image. Interactive equipment is separately authored in
`src/features/mission/diorama-scene.tsx`, with controllers in `diorama-games.tsx`.
The main isometric world and its collision geometry are unchanged.

Refinements should create a child lab revision, validate/promote that package, and
update the explicit stage binding. Preserve this source and promotion history.
