import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { SOURCE_FILES, sha256, sealPackage, verifyPackage } from '../core/package.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../..');
const bytes = await fs.readFile(path.join(directory, 'moon-flag.png'));
const { width, height, hasAlpha } = await sharp(bytes).metadata();
if (!hasAlpha) throw new Error('Sprite requires transparency.');
const settings = { brightness: 1, contrast: 1, saturation: 1, scale: 0.1,
  anchorX: 510 / width, anchorY: 1040 / height, frameWidth: width, frameHeight: height };
const file = { mime: 'image/png', width, height, base64: bytes.toString('base64'), sha256: await sha256(bytes) };
const pkg = await sealPackage({
  format: 'spaceapps.assetlab/v1', generatorVersion: 'image-v1',
  asset: { id: 'moon-flag', title: 'Moon flag · 1×1 isometric object', kind: 'sprite' },
  revision: { id: randomUUID(), parentId: null, author: 'Codex', createdAt: new Date().toISOString(),
    note: 'Reference-matched lunar flag with transparent background. Fits 1×1 logical 96×48 tile; ground-center anchor and 0.1 display scale. Lab-only handoff; no gameplay promotion.' },
  lineage: [],
  source: { gitCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    dirty: !!execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim(),
    files: await Promise.all(SOURCE_FILES.map(async p => ({ path: p, sha256: await sha256(await fs.readFile(path.join(root, p))) }))) },
  payload: { original: { name: 'moon-flag.png', width, height, inputSha256: file.sha256, inputMime: 'image/png' }, settings },
  files: [{ name: 'source.png', ...file }, { name: 'sprite.png', ...file }],
  environment: { renderer: 'Built-in image_gen; unmodified transparent PNG', userAgent: 'Codex asset-lab offline packaging; no Canvas2D filters applied' },
});
await verifyPackage(pkg);
await fs.writeFile(path.join(directory, 'moon-flag.assetlab.json'), JSON.stringify(pkg, null, 2) + '\n');
await fs.writeFile(path.join(directory, 'moon-flag.object.json'), JSON.stringify({
  assetId: 'moon-flag', footprint: { width: 1, height: 1 }, logicalTile: { width: 96, height: 48 },
  sprite: 'moon-flag.png', package: 'moon-flag.assetlab.json', ...settings,
  groundAnchorPixels: { x: 510, y: 1040 },
  note: 'Lab placement metadata only; gameplay collision and binding are not applied.',
}, null, 2) + '\n');
console.log(`Verified ${width}×${height} RGBA sprite and package; scale ${settings.scale}; anchor ${settings.anchorX}, ${settings.anchorY}.`);
