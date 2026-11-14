import { buildLunarSheet, LUNAR_LAYOUT, familyAt } from "../../src/assets/lunar-painter";
import type { LunarSettings } from "../../src/assets/lunar-settings.mjs";
import type { ImageSettings, PackageFile } from "./package.mjs";
import { sha256 } from "./package.mjs";
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error("That image could not be opened.")); img.src = src; });
}
export async function normalizeImage(file: File) {
  if (file.size > 8 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Choose a PNG, JPEG, or WebP image up to 8 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    if (img.width > 2048 || img.height > 2048) throw new Error("Images must be 2048 × 2048 pixels or smaller.");
    const canvas = document.createElement("canvas"); canvas.width = img.width; canvas.height = img.height;
    canvas.getContext("2d")!.drawImage(img, 0, 0);
    const data = canvas.toDataURL("image/png");
    if (data.length > 11 * 1024 * 1024) throw new Error("The normalized PNG is too large. Resize it and try again.");
    return { data, name: file.name, width: img.width, height: img.height, inputSha256: await sha256(new Uint8Array(await file.arrayBuffer())), inputMime: file.type };
  } finally { URL.revokeObjectURL(url); }
}
export async function processImage(data: string, settings: ImageSettings) {
  const img = await loadImage(data), canvas = document.createElement("canvas"); canvas.width = img.width; canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.filter = `brightness(${settings.brightness}) contrast(${settings.contrast}) saturate(${settings.saturation})`;
  ctx.drawImage(img, 0, 0); return canvas;
}
export function tileFromSheet(sheet: HTMLCanvasElement, slot: number) {
  const tile = document.createElement("canvas"); tile.width = LUNAR_LAYOUT.frameWidth; tile.height = LUNAR_LAYOUT.frameHeight;
  tile.getContext("2d")!.drawImage(sheet, slot % 8 * 192, Math.floor(slot / 8) * 96, 192, 96, 0, 0, 192, 96);
  return tile;
}
export function patchFromSheet(sheet: HTMLCanvasElement, slot: number, zoom = 1) {
  const canvas = document.createElement("canvas"); canvas.width = 720; canvas.height = 440;
  const ctx = canvas.getContext("2d")!; ctx.translate(360, 95); ctx.scale(zoom, zoom);
  const family = familyAt(slot);
  const slots = Array.from({ length: 48 }, (_, i) => i).filter((i) => familyAt(i) === family);
  for (let depth = 0; depth <= 8; depth++) for (let row = 0; row < 5; row++) {
    const col = depth - row; if (col < 0 || col >= 5) continue;
    const x = (col - row) * 48, y = (col + row) * 24;
    ctx.fillStyle = "#555b52"; ctx.beginPath(); ctx.moveTo(x - 48, y + 24); ctx.lineTo(x, y + 48); ctx.lineTo(x + 48, y + 24); ctx.lineTo(x + 48, y + 35); ctx.lineTo(x, y + 59); ctx.lineTo(x - 48, y + 35); ctx.closePath(); ctx.fill();
    const index = slots[(row * 7 + col * 3) % slots.length];
    ctx.drawImage(sheet, index % 8 * 192, Math.floor(index / 8) * 96, 192, 96, x - 48, y, 96, 48);
  }
  return canvas;
}
export async function spriteScene(image: HTMLCanvasElement, settings: ImageSettings, sheet: HTMLCanvasElement, frame: number) {
  const canvas = patchFromSheet(sheet, 0, 1), ctx = canvas.getContext("2d")!;
  const columns = image.width / settings.frameWidth, count = columns * image.height / settings.frameHeight;
  const index = Math.min(Math.max(0, frame), count - 1), x = 360, y = 95 + 5 * 24;
  const width = settings.frameWidth * settings.scale, height = settings.frameHeight * settings.scale;
  ctx.drawImage(image, index % columns * settings.frameWidth, Math.floor(index / columns) * settings.frameHeight, settings.frameWidth, settings.frameHeight,
    x - width * settings.anchorX, y - height * settings.anchorY, width, height);
  ctx.strokeStyle = "#9be5cf"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y); ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8); ctx.stroke();
  return canvas;
}
export async function pngFile(name: string, canvas: HTMLCanvasElement): Promise<PackageFile> {
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("PNG export failed.")), "image/png"));
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes.length > 8 * 1024 * 1024) throw new Error("An exported PNG exceeds the 8 MB limit.");
  let binary = ""; for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return { name, mime: "image/png", width: canvas.width, height: canvas.height, base64: btoa(binary), sha256: await sha256(bytes) };
}
export function download(name: string, data: Blob | string, type = "application/json") {
  const blob = typeof data === "string" ? new Blob([data], { type }) : data, url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export { buildLunarSheet };
export type { LunarSettings };
