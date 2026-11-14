# Asset experiment → game protocol, v1

## Ownership and traceability

Each asset has a stable lowercase ID. Each saved revision has a new UUID, an author label, a UTC creation time, a change note, and an optional parent UUID. Revision IDs are immutable; importing the same ID with a different digest is rejected. Authors are descriptive labels, not authenticated identities.

A `.assetlab.json` package is self-contained. It carries:

- `format`: `spaceapps.assetlab/v1` and the supported generator version.
- `asset`: stable ID, title, and `lunar-recipe` or `sprite` kind.
- `revision`: UUID, parent UUID, author, timestamp, and reason for the change.
- `lineage`: the ordered ancestor chain with IDs, parent IDs, notes, authors, dates, asset IDs, and previous package digests.
- `source`: Git commit if available, working-tree status, and SHA-256 hashes of the exact painter, settings, recipe, catalog, runtime adapters, preview code, and package protocol.
- `payload`: all recipe or image settings, with preview seed/slot or original-image information.
- `files`: embedded PNGs, dimensions, and individual byte checksums. A recipe has `atlas.png` and `tile.png`; a sprite has `source.png` and `sprite.png`.
- `environment`: Canvas2D and browser information for reproducing rendering differences.
- `digest`: SHA-256 of canonical JSON with sorted object keys, excluding `digest` itself.

Checksums detect accidental edits and corruption; they are not cryptographic signatures or proof of authorship. Ancestor summaries link to earlier packages by digest. Keep/share the ancestor packages or their promotion archives when a reviewer needs to inspect their exact PNGs or settings.

A dirty checkout is allowed because exact file hashes identify it. **Share matching generator/protocol code through the repository first**, so a teammate can reproduce a package. A commit hash alone is insufficient when files were modified after that commit.

## Experiment and review

1. Start from the current game recipe, an imported image, or a saved revision.
2. Keep the source snapshot attached to the experiment. Give a short note explaining the intent, not just “version 2.”
3. Compare at a known seed and game scale. Check dust/crater readability, transparent edges, anchors, sprite-frame boundaries, and the smallest intended display size.
4. Save/export a new immutable revision. Loading an older revision and saving creates a branch; it does not rewrite history.
5. Share the full package. A loose PNG is useful for visual discussion but is not a traceable promotion.

If source hashes differ, the lab blocks a new revision until **Rebase to current source** is chosen explicitly. Rebase keeps the parent link, attaches the current source snapshot, and adds a note. It is not an automatic code merge: compare the regenerated result before saving. For code changes, use the development server or rebuild the production preview first.

## Promotion: dry run, then apply

From the matching project checkout:

```sh
npm run lab:promote -- --bundle /absolute/path/revision.assetlab.json
```

The default is a read-only dry run. It checks format/generator versions, numeric limits, colors, IDs, source fingerprints, parent-chain consistency, package checksum, PNG checksums, and declared image dimensions. It prints the exact target and before/after hashes.

After reviewing the lab preview and dry run:

```sh
npm run lab:promote -- --bundle /absolute/path/revision.assetlab.json --apply
```

The tool checks source fingerprints again before applying. It accepts no destination paths from the package.

### Lunar recipes

Only `src/assets/recipes/lunar-surface.json` changes. The existing `LunarSurfaceAtlas` reads it and calls the shared painter. Frame size, tile scale, atlas layout, collision rules, resource rules, and save rules stay fixed.

The preview PNG seed/slot is a reference specimen. During gameplay the same settings use the world's own seed and normal tile-to-slot mapping. Restart/rebuild a production preview after promotion; development mode reloads the JSON import.

### Imported sprites and sheets

PNG files receive immutable paths:

```text
public/game-assets/lab/<asset-id>/<revision-uuid>/source.png
public/game-assets/lab/<asset-id>/<revision-uuid>/sprite.png
```

Then `src/assets/catalog/lab-assets.json` switches that asset ID to the new revision. The catalog records dimensions, frame size, anchor, display scale, package digest, and promotion record. Existing image revisions are retained.

A sprite is **registered, not automatically substituted into gameplay**. Bind it deliberately in the browser renderer:

```ts
import { createLabSprite } from "@/rendering/lab-sprite";

const visual = await createLabSprite("lunar-rock", 0);
// Set its world position/depth and attach it to the intended entity/container.
objects.addChild(visual);
```

The helper loads the approved catalog URL, selects a valid frame, and applies the exported anchor and scale. The caller owns the sprite/frame texture; keep the shared texture source when destroying an individual frame. Entity footprints, movement blocking, interaction behavior, and animation timing still require explicit game code. A drawing cannot change those rules by itself.

## Audit trail and recovery

Every apply creates:

```text
asset-lab/promotions/<asset-id>-<revision-uuid>.json
asset-lab/promotions/bundles/<asset-id>-<revision-uuid>.assetlab.json
```

The record preserves the prior recipe/catalog content and hashes, the destination, exact package metadata, and new immutable image paths. The full package archive retains the exact PNGs. Records begin as `prepared`, then become `applied` after the atomic recipe/catalog switch. A crash leaving `prepared` is reviewable: compare the current target hash with `beforeHash` / `afterHash` before taking action.

To preview a rollback:

```sh
node asset-lab/tools/rollback.mjs --record /absolute/path/promotion.json
```

Add `--apply` after reviewing it. Rollback verifies the backup and refuses to overwrite later refinements. It restores the prior recipe/catalog, records `rolled-back`, and retains PNGs/packages for history. It can also recover a `prepared` record when the current file matches its recorded before or after state.

Promotion and rollback are local developer commands, not web endpoints. They do not commit, push, publish, message teammates, or alter game saves. `--project-root` is available for isolated testing/CI; the default is this project root.

## Extending the protocol

- Add a generator through a reusable painter, a typed setting schema, bounded controls, and a fixed runtime adapter.
- Add its source paths to `SOURCE_FILES`; never accept arbitrary output paths in package data.
- Change the generator version when rendering semantics change. Change the package format version when its contract becomes incompatible.
- Add validation and a promotion/rollback test in a temporary project before enabling a new output kind.
- Preserve explicit source → settings → revision → PNG → catalog/recipe → promotion links.

V1 is a local asset iteration workflow. Browser storage is not collaboration storage, and these checksums are not a signed supply-chain system.
