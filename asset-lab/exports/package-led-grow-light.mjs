import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { SOURCE_FILES, sha256, sealPackage, verifyPackage } from '../core/package.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../..');
const states = ['off', 'white-low', 'white-high', 'warm-low', 'warm-high', 'red-blue-low', 'red-blue-high'];
const source = {
  gitCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  dirty: !!execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim(),
  files: await Promise.all(SOURCE_FILES.map(async p => ({ path: p, sha256: await sha256(await fs.readFile(path.join(root, p))) }))),
};
const manifest = {
  format: 'asset-lab.object-state-set/v1', id: 'led-grow-light', title: 'LED grow light — Day 2',
  footprint: { width: 1, height: 2 }, logicalTile: { width: 96, height: 48 },
  projectedFootprint: { width: 144, height: 72, verticesFromCenter: [[24,-36],[72,-12],[-24,36],[-72,12]] },
  defaultState: 'white-low',
  research: 'NASA-SpaceApps-Research.pdf, Day 2',
  note: 'Qualitative power/food game states only. No numeric costs, yields, or spectrum superiority asserted. Lab-only placement metadata; no gameplay code modified.',
  researchVerification: 'TODO: verify against NASA OSD-766 study before claiming a result.',
  states: [],
};
let commonDimensions;
for (const state of states) {
  const id = `led-grow-${state}`, filename = `${id}.png`;
  const bytes = await fs.readFile(path.join(directory, filename));
  const { width, height, hasAlpha } = await sharp(bytes).metadata();
  if (!hasAlpha || width > 2048 || height > 2048) throw new Error(`Invalid transparent sprite: ${filename}`);
  if (commonDimensions && (width !== commonDimensions[0] || height !== commonDimensions[1])) throw new Error(`Frame dimensions changed: ${filename}`);
  commonDimensions = [width, height];
  const settings = { brightness: 1, contrast: 1, saturation: 1, scale: 0.12, anchorX: 0.5, anchorY: 0.68, frameWidth: width, frameHeight: height };
  const file = { mime: 'image/png', width, height, base64: bytes.toString('base64'), sha256: await sha256(bytes) };
  const power = state === 'off' ? 'off' : state.endsWith('high') ? 'high' : 'low';
  const spectrum = state === 'off' ? 'none' : state.replace(/-(low|high)$/, '');
  const pkg = await sealPackage({
    format: 'spaceapps.assetlab/v1', generatorVersion: 'image-v1',
    asset: { id, title: `LED grow light · 1×2 · ${state}`, kind: 'sprite' },
    revision: { id: randomUUID(), parentId: null, author: 'Codex', createdAt: new Date().toISOString(),
      note: `Day 2 LED fixture: ${spectrum} spectrum, ${power} power. Shared 1×2 footprint, framing, scale and ground anchor. Qualitative food trade-off only; no research result claimed. Lab-only asset.` },
    lineage: [], source,
    payload: { original: { name: filename, width, height, inputSha256: file.sha256, inputMime: 'image/png' }, settings },
    files: [{ name: 'source.png', ...file }, { name: 'sprite.png', ...file }],
    environment: { renderer: 'Built-in image_gen; transparent PNG; no Canvas2D filters applied', browser: 'Codex offline asset-lab packaging' },
  });
  await verifyPackage(pkg);
  await fs.writeFile(path.join(directory, `${id}.assetlab.json`), JSON.stringify(pkg, null, 2) + '\n');
  manifest.states.push({ state, assetId: id, spectrum, power, food: power === 'off' ? 'inactive' : power === 'high' ? 'more' : 'less',
    image: filename, package: `${id}.assetlab.json`, sha256: file.sha256, revisionId: pkg.revision.id, ...settings });
  console.log(`Verified ${state}: ${width}×${height}, RGBA, package + PNG checksums.`);
}
await fs.writeFile(path.join(directory, 'led-grow-light.states.json'), JSON.stringify(manifest, null, 2) + '\n');
