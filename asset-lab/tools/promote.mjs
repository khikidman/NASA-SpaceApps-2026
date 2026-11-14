#!/usr/bin/env node
import { readFile, writeFile, mkdir, rename, stat, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { decode64, MAX_PACKAGE_BYTES, SOURCE_FILES, verifyPackage } from "../core/package.mjs";
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function atomic(file, data) {
  await mkdir(path.dirname(file), { recursive: true }); const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, data, { flag: "wx" }); await rename(temp, file);
}
export async function planPromotion(pkg, root) {
  await verifyPackage(pkg);
  const expected = new Map(pkg.source.files.map((file) => [file.path, file.sha256]));
  const changed = [];
  for (const file of SOURCE_FILES) {
    let actual;
    try { actual = digest(await readFile(path.join(root, file))); } catch { throw new Error(`Missing source file: ${file}`); }
    if (actual !== expected.get(file)) changed.push(file);
  }
  if (changed.length) throw new Error(`The game source changed since this experiment:\n${changed.join("\n")}\nRefresh the lab source, rebase explicitly, compare the result, and save a new revision.`);
  const recipePath = "src/assets/recipes/lunar-surface.json", catalogPath = "src/assets/catalog/lab-assets.json";
  const target = pkg.asset.kind === "lunar-recipe" ? recipePath : catalogPath;
  const before = await readFile(path.join(root, target), "utf8");
  let after, outputs = [];
  if (pkg.asset.kind === "lunar-recipe") after = JSON.stringify(pkg.payload.recipe, null, 2) + "\n";
  else {
    const directory = `public/game-assets/lab/${pkg.asset.id}/${pkg.revision.id}`;
    try { await access(path.join(root, directory)); throw new Error("That immutable sprite revision already exists in the project."); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    outputs = pkg.files.map((f) => ({ path: `${directory}/${f.name}`, bytes: decode64(f.base64), sha256: f.sha256 }));
    const catalog = JSON.parse(before);
    if (catalog.schemaVersion !== 1 || !catalog.assets || typeof catalog.assets !== "object") throw new Error("Invalid production sprite catalog.");
    const { settings, original } = pkg.payload;
    catalog.assets[pkg.asset.id] = { id: pkg.asset.id, title: pkg.asset.title, revisionId: pkg.revision.id, src: `/game-assets/lab/${pkg.asset.id}/${pkg.revision.id}/sprite.png`, originalSrc: `/game-assets/lab/${pkg.asset.id}/${pkg.revision.id}/source.png`, width: original.width, height: original.height, ...settings, packageDigest: pkg.digest, promotion: `asset-lab/promotions/${pkg.asset.id}-${pkg.revision.id}.json` };
    after = JSON.stringify(catalog, null, 2) + "\n";
  }
  return { target, before, after, outputs, afterHash: digest(after), recordPath: `asset-lab/promotions/${pkg.asset.id}-${pkg.revision.id}.json` };
}
export async function applyPromotion(pkg, root, plan) {
  // Re-check immediately before writing, even if a caller made a plan earlier.
  const checked = await planPromotion(pkg, root);
  if (checked.afterHash !== plan.afterHash) throw new Error("Promotion plan changed. Run a new dry run.");
  try { await access(path.join(root, plan.recordPath)); throw new Error("A promotion record with this revision already exists."); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  const { files, ...manifest } = pkg;
  const archivePath = `asset-lab/promotions/bundles/${pkg.asset.id}-${pkg.revision.id}.assetlab.json`;
  const record = { archivePath, format: "spaceapps.promotion/v1", status: "prepared", preparedAt: new Date().toISOString(), package: { ...manifest, files: files.map((file) => ({ name: file.name, mime: file.mime, width: file.width, height: file.height, sha256: file.sha256 })) }, destination: plan.target, beforeHash: digest(plan.before), afterHash: plan.afterHash, beforeContent: plan.before, outputs: plan.outputs.map((file) => ({ path: file.path, sha256: file.sha256 })) };
  await atomic(path.join(root, plan.recordPath), JSON.stringify(record, null, 2) + "\n");
  await atomic(path.join(root, archivePath), JSON.stringify(pkg) + "\n");
  // Sprite files have immutable UUID paths. The catalog switches only after both are written.
  for (const output of plan.outputs) { await mkdir(path.dirname(path.join(root, output.path)), { recursive: true }); await writeFile(path.join(root, output.path), output.bytes, { flag: "wx" }); }
  await atomic(path.join(root, plan.target), plan.after);
  await atomic(path.join(root, plan.recordPath), JSON.stringify({ ...record, status: "applied", appliedAt: new Date().toISOString() }, null, 2) + "\n");
}
async function main() {
  const args = process.argv.slice(2);
  const allowed = new Set(["--bundle", "--project-root", "--apply"]);
  const values = {};
  for (let i = 0; i < args.length; i++) {
    if (!allowed.has(args[i])) throw new Error(`Unknown argument: ${args[i]}`);
    if (args[i] === "--apply") values.apply = true;
    else { const key = args[i].slice(2); if (!args[i + 1] || args[i + 1].startsWith("--")) throw new Error(`Missing ${key}.`); values[key] = args[++i]; }
  }
  if (!values.bundle) throw new Error("Usage: npm run lab:promote -- --bundle /path/revision.assetlab.json [--apply]");
  const bundlePath = path.resolve(values.bundle);
  if ((await stat(bundlePath)).size > MAX_PACKAGE_BYTES) throw new Error("Asset package exceeds 24 MB.");
  const pkg = await verifyPackage(JSON.parse(await readFile(bundlePath, "utf8")));
  const root = path.resolve(values["project-root"] ?? fileURLToPath(new URL("../../", import.meta.url)));
  const plan = await planPromotion(pkg, root);
  console.log(`${values.apply ? "APPLY" : "DRY RUN"}: ${pkg.asset.title} (${pkg.asset.id})\nRevision: ${pkg.revision.id}\nPackage SHA-256: ${pkg.digest}\nProject: ${root}\nTarget: ${plan.target}\nBefore: ${digest(plan.before)}\nAfter:  ${plan.afterHash}`);
  for (const output of plan.outputs) console.log(`New image: ${output.path}`);
  if (!values.apply) { console.log("No files changed. Review the package and preview, then repeat with --apply to promote."); return; }
  await applyPromotion(pkg, root, plan);
  console.log(`Promotion recorded: ${plan.recordPath}\nRestart/rebuild a production preview, or let the development server reload. Sprite assets still need an explicit scene binding; see asset-lab/PROTOCOL.md.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
