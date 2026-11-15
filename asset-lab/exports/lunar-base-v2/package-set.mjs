import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { SOURCE_FILES, sha256, sealPackage, verifyPackage } from '../../core/package.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../../..');
const allPorts = ['col-', 'col+', 'row-', 'row+'];
const definitions = [
  ['base-habitat', 'Living habitat', allPorts], ['base-lab', 'Research lab', allPorts],
  ['base-greenhouse', 'Greenhouse', allPorts], ['base-airlock', 'Airlock / logistics', allPorts],
  ['base-solar', 'Solar array', []], ['base-comms', 'Communications', []],
  ['tunnel-col', 'Tunnel · column axis', ['col-', 'col+']],
  ['tunnel-row', 'Tunnel · row axis', ['row-', 'row+']],
  ['tunnel-cross', 'Tunnel · four-way junction', allPorts],
];
const source = {
  gitCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  dirty: !!execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim(),
  files: await Promise.all(SOURCE_FILES.map(async p => ({ path: p, sha256: await sha256(await fs.readFile(path.join(root, p))) }))),
};
const layout = {
  format: 'asset-lab.modular-layout/v1', title: 'Lunar commons · modular base',
  tile: { width: 96, height: 48 },
  spriteContract: { frameWidth: 1254, frameHeight: 1254, anchorX: 0.5, anchorY: 944 / 1254, scale: 96 / 1132,
    padWidthPixels: 1132, footprint: { width: 1, height: 1 }, portHeight: 'Shared collar height; artwork reference only' },
  inspiration: [
    { title: 'ESA Moon Village habitat', url: 'https://www.esa.int/articles/esa-engineers-assess-moon-village-habitat' },
    { title: 'NASA Moon Base Systems', url: 'https://www.nasa.gov/moonbase-systems/' },
  ],
  scope: 'Lab-only game-scale concept; no game integration or engineering-performance claims.',
  assets: [],
  placements: [
    { id: 'living', asset: 'base-habitat', col: 2, row: 4 },
    { id: 'link-living', asset: 'tunnel-col', col: 3, row: 4 },
    { id: 'junction', asset: 'tunnel-cross', col: 4, row: 4 },
    { id: 'link-lab', asset: 'tunnel-col', col: 5, row: 4 },
    { id: 'research', asset: 'base-lab', col: 6, row: 4 },
    { id: 'greenhouse', asset: 'base-greenhouse', col: 4, row: 2 },
    { id: 'link-greenhouse', asset: 'tunnel-row', col: 4, row: 3 },
    { id: 'link-airlock', asset: 'tunnel-row', col: 4, row: 5 },
    { id: 'airlock', asset: 'base-airlock', col: 4, row: 6 },
    { id: 'solar-a', asset: 'base-solar', col: 1, row: 1 },
    { id: 'solar-b', asset: 'base-solar', col: 2, row: 1 },
    { id: 'solar-c', asset: 'base-solar', col: 1, row: 2 },
    { id: 'communications', asset: 'base-comms', col: 7, row: 2 },
  ],
};
for (const [id, title, ports] of definitions) {
  const bytes = await fs.readFile(path.join(directory, `${id}.png`));
  const meta = await sharp(bytes).metadata();
  assert(meta.hasAlpha, `${id} must have an alpha channel`);
  assert.equal(meta.width, 1254, `${id} frame width`); assert.equal(meta.height, 1254, `${id} frame height`);
  const settings = { brightness: 1, contrast: 1, saturation: 1, scale: layout.spriteContract.scale,
    anchorX: layout.spriteContract.anchorX, anchorY: layout.spriteContract.anchorY, frameWidth: meta.width, frameHeight: meta.height };
  const file = { mime: 'image/png', width: meta.width, height: meta.height, base64: bytes.toString('base64'), sha256: await sha256(bytes) };
  const pkg = await sealPackage({ format: 'spaceapps.assetlab/v1', generatorVersion: 'image-v1',
    asset: { id: `lunar-v2-${id}`, title: `Lunar v2 · ${title} · 1×1`, kind: 'sprite' },
    revision: { id: randomUUID(), parentId: null, author: 'Codex', createdAt: new Date().toISOString(),
      note: 'Modular base redesign. Shared 1×1 mounting pad, 2:1 projection, ground anchor, display scale and pressure-collar style. Lab-only handoff.' },
    lineage: [], source, payload: { original: { name: `${id}.png`, width: meta.width, height: meta.height, inputSha256: file.sha256, inputMime: 'image/png' }, settings },
    files: [{ name: 'source.png', ...file }, { name: 'sprite.png', ...file }],
    environment: { renderer: 'Built-in image_gen; original transparent PNG', browser: 'Codex offline asset-lab packaging' },
  });
  await verifyPackage(pkg);
  await fs.writeFile(path.join(directory, `${id}.assetlab.json`), JSON.stringify(pkg, null, 2) + '\n');
  layout.assets.push({ id, title, footprint: { width: 1, height: 1 }, ports, image: `${id}.png`, package: `${id}.assetlab.json`, sha256: file.sha256, settings });
  console.log(`Verified ${id}: shared 1254×1254 RGBA frame and package checksums.`);
}
const occupied = new Set();
for (const p of layout.placements) {
  const key = `${p.col},${p.row}`; assert(!occupied.has(key), `Cell overlap: ${key}`); occupied.add(key);
  assert(layout.assets.some(a => a.id === p.asset), `Unknown asset ${p.asset}`);
}
const directions = { 'col-': [-1,0,'col+'], 'col+': [1,0,'col-'], 'row-': [0,-1,'row+'], 'row+': [0,1,'row-'] };
const seen = new Set(['junction']), queue = [layout.placements.find(p => p.id === 'junction')];
while (queue.length) {
  const p = queue.shift(), asset = layout.assets.find(a => a.id === p.asset);
  for (const port of asset.ports) {
    const [dc, dr, opposite] = directions[port];
    const next = layout.placements.find(n => n.col === p.col + dc && n.row === p.row + dr);
    if (!next || seen.has(next.id)) continue;
    if (layout.assets.find(a => a.id === next.asset).ports.includes(opposite)) { seen.add(next.id); queue.push(next); }
  }
}
for (const id of ['living', 'research', 'greenhouse', 'airlock']) assert(seen.has(id), `Disconnected habitat: ${id}`);
assert.equal(seen.size, 9, 'Four facilities and five tunnel cells must form one connected component');
await fs.writeFile(path.join(directory, 'layout.json'), JSON.stringify(layout, null, 2) + '\n');
console.log('Verified: 13 distinct 1×1 placements; four habitats connected by five compatible tunnel cells.');
