import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, writeFile, access, rm } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LUNAR_DEFAULT_SETTINGS } from "../../src/assets/lunar-settings.mjs";
import { ancestorOf, canonical, PACKAGE_FORMAT, sealPackage, sha256, SOURCE_FILES, validatePackage, verifyPackage, type AssetPackage, type PackageFile, type SourceSnapshot } from "./package.mjs";
import { planPromotion, applyPromotion } from "../tools/promote.mjs";
import { applyRollback, planRollback } from "../tools/rollback.mjs";
const project = fileURLToPath(new URL("../../", import.meta.url));
function crc32(bytes: Buffer) { let crc = 0xffffffff; for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ crc >>> 1 : crc >>> 1; } return (crc ^ 0xffffffff) >>> 0; }
function png(width: number, height: number) {
  const chunk = (name: string, data: Buffer) => { const type = Buffer.from(name), length = Buffer.alloc(4), crc = Buffer.alloc(4); length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([type, data]))); return Buffer.concat([length, type, data, crc]); };
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk("IHDR", header), chunk("IDAT", deflateSync(Buffer.alloc((width * 4 + 1) * height))), chunk("IEND", Buffer.alloc(0))]);
}
async function image(name: string, width: number, height: number): Promise<PackageFile> { const bytes = png(width, height); return { name, width, height, mime: "image/png", base64: bytes.toString("base64"), sha256: await sha256(bytes) }; }
async function snapshot(root: string): Promise<SourceSnapshot> { return { gitCommit: null, dirty: true, files: await Promise.all(SOURCE_FILES.map(async (file) => ({ path: file, sha256: await sha256(await readFile(path.join(root, file))) }))) }; }
async function fixture(kind: "lunar-recipe" | "sprite", root = project): Promise<AssetPackage> {
  return sealPackage({ format: PACKAGE_FORMAT, asset: { id: kind === "sprite" ? "test-rock" : "lunar-surface", title: "Test asset", kind }, revision: { id: crypto.randomUUID(), parentId: null, author: "Test teammate", note: "Controlled experiment.", createdAt: "2026-11-14T20:00:00.000Z" }, source: await snapshot(root), generatorVersion: kind === "sprite" ? "image-v1" : "lunar-v1", lineage: [], environment: { renderer: "Canvas2D", browser: "test" },
    payload: kind === "sprite" ? { original: { name: "rock.png", width: 2, height: 2 }, settings: { brightness: 1, contrast: 1, saturation: 1, scale: 1, anchorX: .5, anchorY: 1, frameWidth: 1, frameHeight: 1 } } : { recipe: { schemaVersion: 1, generatorVersion: "lunar-v1", settings: { ...LUNAR_DEFAULT_SETTINGS, grain: 17 } }, seed: 42, slot: 7 },
    files: kind === "sprite" ? await Promise.all([image("source.png", 2, 2), image("sprite.png", 2, 2)]) : await Promise.all([image("atlas.png", 1536, 576), image("tile.png", 192, 96)]),
  });
}
async function sandbox() { const root = await mkdtemp(path.join(tmpdir(), "spaceapps-asset-lab-")); for (const file of SOURCE_FILES) { await mkdir(path.dirname(path.join(root, file)), { recursive: true }); await writeFile(path.join(root, file), await readFile(path.join(project, file))); } return root; }
describe("portable asset package", () => {
  it("canonicalizes object keys without changing meaningful array order", () => { expect(canonical({ b: 2, a: [1, 2] })).toBe(canonical({ a: [1, 2], b: 2 })); expect(canonical([1, 2])).not.toBe(canonical([2, 1])); });
  it("round-trips recipe and sprite packages with checksummed PNGs", async () => { for (const kind of ["lunar-recipe", "sprite"] as const) { const pkg = await fixture(kind); expect(await verifyPackage(JSON.parse(JSON.stringify(pkg)))).toEqual(pkg); } });
  it("rejects setting tampering and mismatched file bytes", async () => {
    const recipe = await fixture("lunar-recipe"); recipe.payload.recipe!.settings.grain = 20; await expect(verifyPackage(recipe)).rejects.toThrow("fingerprint");
    const sprite = await fixture("sprite"), bytes = Buffer.from(sprite.files[0].base64, "base64"); bytes[bytes.length - 1] ^= 1; sprite.files[0].base64 = bytes.toString("base64");
    const { digest: _digest, ...unsigned } = sprite; void _digest;
    await expect(verifyPackage(await sealPackage(unsigned))).rejects.toThrow("checksum");
  });
  it("rejects unsafe paths, extra settings, unsupported generators, and malformed frames", async () => {
    const original = await fixture("sprite");
    for (const mutate of [
      (p: AssetPackage) => { p.asset.id = "../../outside"; },
      (p: AssetPackage) => { p.files[0].name = "../outside.png"; },
      (p: AssetPackage) => { p.generatorVersion = "image-v99"; },
      (p: AssetPackage) => { p.payload.settings!.frameWidth = 3; },
      (p: AssetPackage) => { Object.assign(p.payload.settings!, { src: "https://example.invalid/image.png" }); },
      (p: AssetPackage) => { p.source.files[0].path = "../../private"; },
    ]) { const pkg = structuredClone(original); mutate(pkg); expect(() => validatePackage(pkg)).toThrow(); }
    const recipe = await fixture("lunar-recipe"); recipe.payload.recipe!.settings.craterDensity = 999; expect(() => validatePackage(recipe)).toThrow();
  });
  it("requires a connected ancestry and keeps the parent fingerprint", async () => {
    const parent = await fixture("lunar-recipe"), { digest: _digest, ...rest } = parent; void _digest;
    const child = await sealPackage({ ...rest, revision: { ...parent.revision, id: crypto.randomUUID(), parentId: parent.revision.id, note: "Smaller craters." }, lineage: [ancestorOf(parent)] });
    expect((await verifyPackage(child)).lineage[0].digest).toBe(parent.digest);
    child.revision.parentId = crypto.randomUUID(); expect(() => validatePackage(child)).toThrow("parent");
  });
});
describe("promotion and rollback in an isolated project", () => {
  it("dry-runs without writes, then promotes a recipe and preserves its audit trail", async () => {
    const root = await sandbox();
    try {
      const pkg = await fixture("lunar-recipe", root), before = await readFile(path.join(root, "src/assets/recipes/lunar-surface.json"), "utf8");
      const plan = await planPromotion(pkg, root);
      expect(await readFile(path.join(root, plan.target), "utf8")).toBe(before);
      await expect(access(path.join(root, plan.recordPath))).rejects.toThrow();
      await applyPromotion(pkg, root, plan);
      expect(JSON.parse(await readFile(path.join(root, plan.target), "utf8")).settings.grain).toBe(17);
      const record = JSON.parse(await readFile(path.join(root, plan.recordPath), "utf8")); expect(record.status).toBe("applied"); expect(record.beforeContent).toBe(before);
      expect(await verifyPackage(JSON.parse(await readFile(path.join(root, record.archivePath), "utf8")))).toEqual(pkg);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  it("promotes immutable sprite paths, restores the catalog, and keeps the PNG history", async () => {
    const root = await sandbox();
    try {
      const pkg = await fixture("sprite", root), plan = await planPromotion(pkg, root); await applyPromotion(pkg, root, plan);
      const catalog = JSON.parse(await readFile(path.join(root, plan.target), "utf8"));
      expect(catalog.assets[pkg.asset.id]).toMatchObject({ revisionId: pkg.revision.id, frameWidth: 1, anchorX: .5, anchorY: 1 });
      for (const output of plan.outputs) expect(await sha256(await readFile(path.join(root, output.path)))).toBe(output.sha256);
      const recordPath = path.join(root, plan.recordPath), record = JSON.parse(await readFile(recordPath, "utf8")); await applyRollback(record, root, recordPath);
      expect(await readFile(path.join(root, plan.target), "utf8")).toBe(plan.before);
      expect(JSON.parse(await readFile(recordPath, "utf8")).status).toBe("rolled-back");
      for (const output of plan.outputs) await expect(access(path.join(root, output.path))).resolves.toBeUndefined();
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  it("rejects source drift both before planning and between plan and apply", async () => {
    const root = await sandbox();
    try {
      const pkg = await fixture("lunar-recipe", root), plan = await planPromotion(pkg, root);
      const painter = path.join(root, "src/assets/lunar-painter.ts"); await writeFile(painter, "changed generator\n");
      await expect(planPromotion(pkg, root)).rejects.toThrow("source changed");
      await expect(applyPromotion(pkg, root, plan)).rejects.toThrow("source changed");
      await expect(access(path.join(root, plan.recordPath))).rejects.toThrow();
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  it("will not roll back over a later refinement", async () => {
    const root = await sandbox();
    try {
      const pkg = await fixture("lunar-recipe", root), plan = await planPromotion(pkg, root); await applyPromotion(pkg, root, plan);
      const record = JSON.parse(await readFile(path.join(root, plan.recordPath), "utf8")); await writeFile(path.join(root, plan.target), plan.after + " \n");
      await expect(planRollback(record, root)).rejects.toThrow("later work");
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});
