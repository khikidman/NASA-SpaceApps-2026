import { LUNAR_GENERATOR_VERSION, validateLunarSettings } from "../../src/assets/lunar-settings.mjs";
export const PACKAGE_FORMAT = "spaceapps.assetlab/v1";
export const MAX_PACKAGE_BYTES = 24 * 1024 * 1024;
export const SOURCE_FILES = Object.freeze(["src/assets/lunar-painter.ts", "src/assets/lunar-settings.mjs", "src/assets/recipes/lunar-surface.json", "src/assets/catalog/lab-assets.json", "src/rendering/lunar-surface.ts", "asset-lab/core/package.mjs", "asset-lab/core/preview.ts", "src/rendering/lab-sprite.ts"]);
const hashPattern = /^[a-f0-9]{64}$/;
const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function object(value, name) { if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Invalid ${name}.`); return value; }
function string(value, name, max = 200) { if (typeof value !== "string" || !value.trim() || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new Error(`Invalid ${name}.`); return value; }
function integer(n, min, max, name) { if (!Number.isInteger(n) || n < min || n > max) throw new Error(`Invalid ${name}.`); }
function number(n, min, max, name) { if (typeof n !== "number" || !Number.isFinite(n) || n < min || n > max) throw new Error(`Invalid ${name}.`); }
function uuid(value, name) { if (typeof value !== "string" || !uuidPattern.test(value)) throw new Error(`Invalid ${name}.`); }
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  if (value === undefined || typeof value === "number" && !Number.isFinite(value)) throw new Error("Non-portable JSON value.");
  return JSON.stringify(value);
}
export async function sha256(value) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (n) => n.toString(16).padStart(2, "0")).join("");
}
export function decode64(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4) throw new Error("Invalid PNG encoding.");
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}
export function validateImageSettings(settings, width, height) {
  object(settings, "image settings");
  if (Object.keys(settings).sort().join() !== ["brightness", "contrast", "saturation", "scale", "anchorX", "anchorY", "frameWidth", "frameHeight"].sort().join()) throw new Error("Unexpected image setting names.");
  for (const key of ["brightness", "contrast"]) number(settings[key], .5, 1.5, key);
  number(settings.saturation, 0, 2, "saturation"); number(settings.scale, .05, 4, "display scale");
  number(settings.anchorX, 0, 1, "anchor X"); number(settings.anchorY, 0, 1, "anchor Y");
  integer(settings.frameWidth, 1, width, "frame width"); integer(settings.frameHeight, 1, height, "frame height");
  if (width % settings.frameWidth || height % settings.frameHeight) throw new Error("Frame dimensions must divide the image dimensions exactly.");
  return { ...settings };
}
export function validateSource(source) {
  object(source, "source snapshot");
  if (source.gitCommit !== null && (typeof source.gitCommit !== "string" || !/^[a-f0-9]{40,64}$/.test(source.gitCommit))) throw new Error("Invalid source commit.");
  if (typeof source.dirty !== "boolean" || !Array.isArray(source.files) || source.files.length !== SOURCE_FILES.length) throw new Error("Incomplete source snapshot.");
  if (new Set(source.files.map((f) => f.path)).size !== SOURCE_FILES.length) throw new Error("Duplicate source paths.");
  for (const file of source.files) if (!SOURCE_FILES.includes(file.path) || !hashPattern.test(file.sha256)) throw new Error("Invalid source file fingerprint.");
  return source;
}
export function validatePackage(value) {
  const pkg = object(value, "asset package");
  if (pkg.format !== PACKAGE_FORMAT) throw new Error("Unsupported asset package version.");
  const asset = object(pkg.asset, "asset");
  if (typeof asset.id !== "string" || !/^[a-z][a-z0-9-]{2,63}$/.test(asset.id)) throw new Error("Asset ID must be a lowercase slug, 3–64 characters.");
  string(asset.title, "asset title", 100);
  if (!["lunar-recipe", "sprite"].includes(asset.kind)) throw new Error("Unsupported asset kind.");
  const rev = object(pkg.revision, "revision"); uuid(rev.id, "revision ID"); if (rev.parentId !== null) uuid(rev.parentId, "parent revision");
  string(rev.author, "author", 100); string(rev.note, "revision note", 1000);
  if (typeof rev.createdAt !== "string" || !Number.isFinite(Date.parse(rev.createdAt))) throw new Error("Invalid revision date.");
  validateSource(pkg.source);
  if (!Array.isArray(pkg.lineage) || pkg.lineage.length > 200) throw new Error("Invalid revision lineage (maximum 200 ancestors).");
  const ids = new Set(); let parent = null;
  for (const entry of pkg.lineage) {
    object(entry, "ancestor"); uuid(entry.id, "ancestor ID");
    if (entry.parentId !== parent || ids.has(entry.id) || entry.id === rev.id || !hashPattern.test(entry.digest)) throw new Error("Broken or cyclic revision ancestry.");
    string(entry.author, "ancestor author", 100); string(entry.note, "ancestor note", 1000); string(entry.assetId, "ancestor asset ID", 64);
    if (!Number.isFinite(Date.parse(entry.createdAt))) throw new Error("Invalid ancestor date.");
    ids.add(entry.id); parent = entry.id;
  }
  if (rev.parentId !== parent) throw new Error("The parent revision does not match the exported history.");
  const payload = object(pkg.payload, "asset payload");
  if (asset.kind === "lunar-recipe") {
    if (pkg.generatorVersion !== LUNAR_GENERATOR_VERSION || payload.recipe?.schemaVersion !== 1 || payload.recipe?.generatorVersion !== LUNAR_GENERATOR_VERSION) throw new Error("Unsupported lunar generator version.");
    validateLunarSettings(payload.recipe.settings); integer(payload.seed, 0, 0xffffffff, "preview seed"); integer(payload.slot, 0, 47, "atlas slot");
  } else {
    if (pkg.generatorVersion !== "image-v1") throw new Error("Unsupported image generator version.");
    object(payload.original, "original image"); string(payload.original.name, "original filename", 200);
    if (payload.original.inputSha256 !== undefined && !hashPattern.test(payload.original.inputSha256)) throw new Error("Invalid original image checksum.");
    integer(payload.original.width, 1, 2048, "image width"); integer(payload.original.height, 1, 2048, "image height");
    validateImageSettings(payload.settings, payload.original.width, payload.original.height);
  }
  const expected = asset.kind === "lunar-recipe" ? { "atlas.png": [1536, 576], "tile.png": [192, 96] } : { "source.png": [payload.original.width, payload.original.height], "sprite.png": [payload.original.width, payload.original.height] };
  if (!Array.isArray(pkg.files) || pkg.files.length !== 2 || new Set(pkg.files.map((f) => f.name)).size !== 2) throw new Error("The package must contain its two PNG outputs.");
  for (const f of pkg.files) {
    if (!Object.hasOwn(expected, f.name) || f.mime !== "image/png" || !hashPattern.test(f.sha256) || typeof f.base64 !== "string" || f.base64.length > 12 * 1024 * 1024) throw new Error("Invalid packaged image.");
    if (f.width !== expected[f.name][0] || f.height !== expected[f.name][1]) throw new Error("Packaged image dimensions do not match the recipe.");
  }
  if (!hashPattern.test(pkg.digest)) throw new Error("Missing package fingerprint.");
  return pkg;
}
export async function sealPackage(unsigned) { return { ...unsigned, digest: await sha256(canonical(unsigned)) }; }
export async function verifyPackage(value) {
  const pkg = validatePackage(value), { digest, ...unsigned } = pkg;
  if (await sha256(canonical(unsigned)) !== digest) throw new Error("Package fingerprint mismatch. Re-export the revision; do not hand-edit checksummed packages.");
  for (const file of pkg.files) {
    const bytes = decode64(file.base64);
    if (bytes.length > 8 * 1024 * 1024 || bytes.length < 24 || [...bytes.slice(0, 8)].join() !== "137,80,78,71,13,10,26,10") throw new Error("A packaged file is not a supported PNG.");
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (view.getUint32(16) !== file.width || view.getUint32(20) !== file.height) throw new Error("PNG header dimensions do not match its manifest.");
    if (await sha256(bytes) !== file.sha256) throw new Error(`File checksum mismatch: ${file.name}`);
  }
  return pkg;
}
export function ancestorOf(pkg) { return { id: pkg.revision.id, parentId: pkg.revision.parentId, author: pkg.revision.author, note: pkg.revision.note, createdAt: pkg.revision.createdAt, assetId: pkg.asset.id, digest: pkg.digest }; }
export function settingsDiff(before, after) { return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((key) => canonical(before[key] ?? null) !== canonical(after[key] ?? null)).map((key) => ({ key, before: before[key] ?? null, after: after[key] ?? null })); }
