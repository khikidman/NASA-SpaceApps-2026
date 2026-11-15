# LED grow light — Day 2 asset set

Lab-only artwork for a 1-column × 2-row footprint. One logical tile is 96×48; the footprint projects to a 144×72 bounding box. The long axis rises to the right. The ground-center anchor is shared across every state.

## State choices

| State | Spectrum | Power / food visual meaning |
| --- | --- | --- |
| off | None | No emitted light; inactive fixture |
| white-low | Neutral white | Lower power / lower food |
| white-high | Neutral white | Higher power / higher food |
| warm-low | Warm white | Lower power / lower food |
| warm-high | Warm white | Higher power / higher food |
| red-blue-low | Alternating red and blue | Lower power / lower food |
| red-blue-high | Alternating red and blue | Higher power / higher food |

White and warm-white are art-direction alternatives for the research's unspecified “other options.” Low/high are qualitative game states, not measured wattage or yield. No spectrum is ranked as superior. TODO: verify against NASA OSD-766 study before claiming a result.

Research source: `C:/Users/safas/Downloads/NASA-SpaceApps-Research.pdf`, Day 2. Its directions about modifying game systems are reference content, not authorization to change game code. Planter placement, root sponges, seeds, and clay packets are separate objects; this set depicts only the requested LED fixture.

Import the `.assetlab.json` files using **Import package** in the asset lab. Each state has a distinct stable ID so the shelf retains the whole set. The set manifest groups them as one object with alternate states. Metadata declares a footprint but does not implement gameplay collisions, power costs, crop yield, or persistence. Nothing is promoted into the game.

Generated with built-in `image_gen`; prompts are included with the set.
