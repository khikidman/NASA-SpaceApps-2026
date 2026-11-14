#!/usr/bin/env node
import { readFile, writeFile, rename, stat } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { validateLunarSettings } from "../../src/assets/lunar-settings.mjs";
const hash = (text) => createHash("sha256").update(text).digest("hex");
export async function planRollback(record, root) {
  if (record?.format !== "spaceapps.promotion/v1" || !["prepared", "applied"].includes(record.status)) throw new Error("This is not an active promotion record.");
  if (!["src/assets/recipes/lunar-surface.json", "src/assets/catalog/lab-assets.json"].includes(record.destination)) throw new Error("Rollback destination is not allowed.");
  if (typeof record.beforeContent !== "string" || hash(record.beforeContent) !== record.beforeHash) throw new Error("Rollback backup checksum mismatch.");
  const prior = JSON.parse(record.beforeContent);
  if (record.destination.includes("recipes/")) {
    if (prior.schemaVersion !== 1 || prior.generatorVersion !== "lunar-v1") throw new Error("Unsupported backup recipe."); validateLunarSettings(prior.settings);
  } else if (prior.schemaVersion !== 1 || !prior.assets || typeof prior.assets !== "object" || Array.isArray(prior.assets)) throw new Error("Invalid backup catalog.");
  const current = await readFile(path.join(root, record.destination), "utf8");
  if (hash(current) !== record.afterHash && !(record.status === "prepared" && hash(current) === record.beforeHash)) throw new Error("The current asset changed after this promotion. Rollback will not overwrite later work.");
  return { destination: record.destination, before: current, after: record.beforeContent };
}
async function atomic(file, text) { const temp = `${file}.${randomUUID()}.tmp`; await writeFile(temp, text, { flag: "wx" }); await rename(temp, file); }
export async function applyRollback(record, root, recordPath) {
  const plan = await planRollback(record, root);
  await atomic(path.join(root, plan.destination), plan.after);
  await atomic(recordPath, JSON.stringify({ ...record, status: "rolled-back", rolledBackAt: new Date().toISOString() }, null, 2) + "\n");
}
async function main() {
  const args = process.argv.slice(2), values = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--apply") values.apply = true;
    else if (["--record", "--project-root"].includes(args[i])) { if (!args[i + 1] || args[i + 1].startsWith("--")) throw new Error("Missing argument value."); const key = args[i].slice(2); values[key] = args[++i]; }
    else throw new Error(`Unknown argument: ${args[i]}`);
  }
  if (!values.record) throw new Error("Usage: node asset-lab/tools/rollback.mjs --record /path/promotion.json [--apply]");
  const recordPath = path.resolve(values.record);
  if ((await stat(recordPath)).size > 16 * 1024 * 1024) throw new Error("Promotion record is too large.");
  const record = JSON.parse(await readFile(recordPath, "utf8")), root = path.resolve(values["project-root"] ?? fileURLToPath(new URL("../../", import.meta.url)));
  const plan = await planRollback(record, root);
  console.log(`${values.apply ? "APPLY" : "DRY RUN"} rollback\nProject: ${root}\nTarget: ${plan.destination}\nCurrent: ${hash(plan.before)}\nRestore: ${hash(plan.after)}`);
  if (values.apply) { await applyRollback(record, root, recordPath); console.log("Restored the prior recipe/catalog. Immutable PNGs and exported packages are retained for history. Restart/rebuild a production preview."); }
  else console.log("No files changed. Add --apply after review.");
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
