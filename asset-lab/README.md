# Asset lab

A local teammate workspace for creating, refining, comparing, and handing off game art. The lab uses the **same lunar painter as the game**; it does not maintain a separate approximation.

## Open it

From the project root:

```sh
npm install
npm run lab
```

The lab runner uses a separate `.next-lab` build directory, so it can run alongside the main development server.

Open [127.0.0.1:3101/asset-lab](http://127.0.0.1:3101/asset-lab). You can also use `/asset-lab` on the main development or production preview, including [127.0.0.1:3100/asset-lab](http://127.0.0.1:3100/asset-lab).

Use a consistent browser origin/port: revision storage belongs to that origin. Packages are portable between browsers, ports, teammates, and checkouts. The lab has no accounts, uploads, external image services, or write-to-project web endpoint.

## A short first session

1. Choose **Lunar surface** or **Import an image**. Try a starting preset, then refine the controls.
2. Compare the working preview against the game baseline or the original image. Inspect a single tile, the 48-frame atlas, and the game-scale patch.
3. For sprites, set frame dimensions, anchor, and display scale. Frame dimensions must divide the image dimensions. The green crosshair is the game anchor.
4. Give the asset a stable lowercase ID, enter your name, and add a change note.
5. **Save revision** keeps an immutable snapshot in this browser. **Export package** downloads the complete handoff. Exporting an unchanged saved revision does not make a duplicate.
6. Import a teammate's package to continue from that revision. Loading an older shelf item and saving creates a branch, preserving the parent.
7. Follow [PROTOCOL.md](PROTOCOL.md) to preview and promote the asset into the game.

**Unsaved drafts are in memory.** Save named revisions before leaving. Browser storage is local, can be cleared, and is not a team backup. Export packages for sharing and long-term retention. If revision storage fails, Save falls back to a package download.

## What v1 supports

- Lunar dust, crater, rock, lighting, and track settings, with two starter presets.
- One shared 1536×576 atlas: 48 frames of 192×96 pixels for 96×48 logical tiles.
- PNG/JPEG/WebP import up to 8 MB and 2048×2048 pixels. Images normalize to PNG; transparent pixels remain transparent.
- Brightness, contrast, saturation, game display scale, anchors, and sprite-sheet frame dimensions.
- Revision notes, source-file fingerprints, parent chains, baseline differences, PNG exports, and self-contained packages.
- Checked promotion, archived packages, change records, and guarded rollback.

The source PNG in a sprite package preserves the normalized original. For JPEG/WebP, retain the original file separately if you need its exact compressed bytes; the package records its filename and input checksum. The preview seed is a visual reference, not a command to change the player's mission seed.

Existing SVG UI art and building geometry remain code assets. Add another supported generator deliberately; don't label an arbitrary experiment as a lunar recipe. Raster painting, cloud sync, animation authoring, and automatic gameplay/collision generation are outside this small lab.

## Directory map

```text
asset-lab/
  AssetLab.tsx              Workbench UI
  lab.module.css            Styles isolated from the game
  core/package.mjs          Shared package validation / checksums / lineage
  core/storage.ts           Browser revision shelf
  core/preview.ts           PNG normalization and game-scale previews
  tools/promote.mjs         Dry-run-first project promotion
  tools/rollback.mjs        Guarded restoration from a promotion record
  presets/                  Example lunar settings
  exports/                  Optional shared handoff folder
  promotions/               Created by promotion: audit records + archived bundles
  PROTOCOL.md               Teammate handoff and integration contract
```

The reusable painter/settings live in `src/assets/`. `src/rendering/lunar-surface.ts` remains the Pixi adapter. The read-only `/api/asset-lab/source` endpoint reports exact local file hashes and the current recipe. No game save is changed by lab edits; “Use current game seed” only reads its seed.

Use `npm run dev` / `npm run lab` when editing generator code. Rebuild/restart production previews after code or recipe changes. A working-tree fingerprint records what is on disk, not an attestation that an old running bundle has reloaded. Refresh/rebase and compare after changing generator code.

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. In environments where Turbopack cannot start its helper, use `npm run build -- --webpack`.
