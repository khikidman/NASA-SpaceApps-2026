import { LUNAR_DEFAULT_SETTINGS, type LunarSettings } from "./lunar-settings.mjs";
export const SURFACE_SIZE = 256;
const SIZE = SURFACE_SIZE;
export const LUNAR_LAYOUT = Object.freeze({ frameWidth: 192, frameHeight: 96, columns: 8, rows: 6, count: 48, logicalWidth: 96, logicalHeight: 48, resolution: 2 });
export const SURFACE_FAMILIES = ["dust", "row", "column", "cross", "pad", "rubble"] as const;
export type Surface = (typeof SURFACE_FAMILIES)[number];
export function familyAt(index: number): Surface { return index < 16 ? "dust" : index < 24 ? "row" : index < 32 ? "column" : index < 36 ? "cross" : index < 40 ? "pad" : "rubble"; }
function randomFor(seed: number) {
  let state = seed >>> 0;
  return () => { state += 0x6d2b79f5; let t = state; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function crater(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, random: () => number, settings: LunarSettings) {
  // Low-contrast ejecta and an irregular raised rim around a shaded, concave bowl.
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 9; i++) {
    const angle = random() * Math.PI * 2;
    ctx.strokeStyle = "rgba(211,208,192,.12)"; ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * r * 1.08, y + Math.sin(angle) * r * 1.08);
    ctx.lineTo(x + Math.cos(angle) * r * (1.3 + random() * .5), y + Math.sin(angle) * r * (1.3 + random() * .5)); ctx.stroke();
  }
  const rim = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r * 1.15);
  rim.addColorStop(0, settings.rimColor); rim.addColorStop(.7, "#a3a59b"); rim.addColorStop(1, "rgba(112,116,108,.1)");
  ctx.fillStyle = rim; ctx.beginPath();
  for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, radius = r * (1.07 + random() * .09); const px = x + Math.cos(a) * radius, py = y + Math.sin(a) * radius; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
  ctx.closePath(); ctx.fill();
  const bowl = ctx.createRadialGradient(x + r * .34, y + r * .28, r * .08, x - r * .13, y - r * .16, r);
  bowl.addColorStop(0, settings.floorColor); bowl.addColorStop(.44, "#888980"); bowl.addColorStop(.78, "#686963"); bowl.addColorStop(1, settings.shadowColor);
  ctx.fillStyle = bowl; ctx.beginPath(); ctx.arc(x, y, r * .88, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(226,223,206,.68)"; ctx.lineWidth = Math.max(1.3, r * .055); ctx.beginPath(); ctx.arc(x, y, r * .98, Math.PI * .94, Math.PI * 1.77); ctx.stroke();
  ctx.strokeStyle = "rgba(190,191,173,.55)"; ctx.lineWidth = r * .08; ctx.beginPath(); ctx.arc(x + r * .06, y + r * .08, r * .71, -.15, Math.PI * .64); ctx.stroke();
  // Fine fragments on the crater floor make large bowls read as dust, rather than holes.
  ctx.fillStyle = "rgba(199,199,181,.2)";
  for (let i = 0; i < 16; i++) { const a = random() * Math.PI * 2, d = Math.sqrt(random()) * r * .6; ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, .8, .8); }
}
function pebble(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.fillStyle = "rgba(43,48,43,.26)"; ctx.beginPath(); ctx.ellipse(x + size * .6, y + size * .6, size, size * .55, .3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#737a70"; ctx.beginPath(); ctx.moveTo(x - size, y); ctx.lineTo(x - size * .5, y - size * .7); ctx.lineTo(x + size * .45, y - size * .8); ctx.lineTo(x + size, y + size * .3); ctx.lineTo(x, y + size * .7); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#b9bdb0"; ctx.beginPath(); ctx.moveTo(x - size, y); ctx.lineTo(x - size * .5, y - size * .7); ctx.lineTo(x + size * .45, y - size * .8); ctx.lineTo(x, y + size * .1); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(50,59,51,.45)"; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x, y + size * .1); ctx.lineTo(x + size, y + size * .3); ctx.stroke();
}
function tracks(ctx: CanvasRenderingContext2D, vertical: boolean, opacity: number) {
  ctx.save(); ctx.globalAlpha = Math.min(1, opacity); if (vertical) { ctx.translate(SIZE, 0); ctx.rotate(Math.PI / 2); }
  for (const y of [SIZE * .32, SIZE * .68]) {
    ctx.lineWidth = 15; ctx.strokeStyle = "rgba(202,198,178,.12)"; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SIZE, y); ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = "rgba(61,68,58,.24)"; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SIZE, y); ctx.stroke();
    ctx.lineWidth = 1.4; ctx.strokeStyle = "rgba(55,63,53,.27)";
    for (let x = 4; x < SIZE; x += 8) { ctx.beginPath(); ctx.moveTo(x - 2, y - 5); ctx.lineTo(x + 2, y + 5); ctx.stroke(); }
  }
  // Small paired boot marks between the wheel ruts.
  for (let i = 0; i < 5; i++) {
    const x = 20 + i * 48, y = SIZE * .5 + (i % 2 ? 8 : -8);
    ctx.fillStyle = "rgba(67,75,64,.25)"; ctx.beginPath(); ctx.ellipse(x, y, 5, 2.6, .15, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(212,207,188,.3)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 3, y - 2); ctx.lineTo(x + 3, y - 2); ctx.stroke();
  }
  ctx.restore();
}
export function paintLunarSurface(ctx: CanvasRenderingContext2D, family: Surface, seed: number, settings: LunarSettings = LUNAR_DEFAULT_SETTINGS) {
  const random = randomFor(seed);
  const variation = Math.floor(random() * 15), noise = (family === "pad" ? 5 : 11) * settings.grain / 11;
  const rgb = [1, 3, 5].map((start) => parseInt(settings.baseColor.slice(start, start + 2), 16));
  const image = ctx.createImageData(SIZE, SIZE);
  for (let i = 0; i < image.data.length; i += 4) {
    const grain = (random() + random() - 1) * noise;
    image.data[i] = rgb[0] + variation + grain; image.data[i + 1] = rgb[1] + variation + grain; image.data[i + 2] = rgb[2] + variation + grain; image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  // Soft, overlapping regolith patches prevent a tiled checkerboard appearance.
  ctx.save(); ctx.globalAlpha = Math.min(1, settings.dustOpacity);
  for (let i = 0; i < Math.round(7 * Math.max(1, settings.dustOpacity)); i++) {
    const x = random() * SIZE, y = random() * SIZE, radius = 35 + random() * 130;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, i % 2 ? "rgba(69,79,68,.10)" : "rgba(218,210,184,.12)"); gradient.addColorStop(1, "rgba(145,145,130,0)");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, SIZE, SIZE);
  }
  ctx.restore();
  const track = family === "row" || family === "column" || family === "cross";
  const count = family === "pad" ? 2 : track ? 4 : 5 + Math.floor(random() * 4);
  for (let i = 0; i < Math.round(count * settings.craterDensity); i++) {
    const large = !track && family !== "pad" && i === 0 && random() > .25;
    const r = Math.min(88, (large ? 24 + random() ** 2 * 64 : 3 + random() * (family === "pad" ? 4 : 13)) * settings.craterScale);
    const margin = r * 1.3 + 5;
    let x = margin + random() * (SIZE - margin * 2), y = margin + random() * (SIZE - margin * 2);
    if (track) { if (family === "row") y = random() > .5 ? SIZE - margin : margin; else x = random() > .5 ? SIZE - margin : margin; }
    crater(ctx, x, y, r, random, settings);
  }
  for (let i = 0; i < 500; i++) {
    const x = random() * SIZE, y = random() * SIZE;
    ctx.fillStyle = i % 2 ? "rgba(54,64,53,.17)" : "rgba(227,224,202,.24)";
    ctx.fillRect(x, y, random() * 1.5 + .3, random() * 1.2 + .3);
  }
  const rocks = family === "rubble" ? 22 : family === "pad" ? 3 : 7;
  for (let i = 0; i < Math.round(rocks * settings.pebbleDensity); i++) pebble(ctx, 8 + random() * (SIZE - 16), 8 + random() * (SIZE - 16), 1 + random() * (family === "rubble" ? 7 : 3.5));
  if (family === "row" || family === "cross") tracks(ctx, false, settings.trackOpacity);
  if (family === "column" || family === "cross") tracks(ctx, true, settings.trackOpacity);
  if (family === "pad") {
    ctx.strokeStyle = "rgba(212,209,191,.22)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(SIZE / 2, SIZE / 2, SIZE * .41, .1, Math.PI * 1.8); ctx.stroke();
  }
}

export function buildLunarSheet(seed: number, settings: LunarSettings = LUNAR_DEFAULT_SETTINGS): HTMLCanvasElement {
  const { frameWidth, frameHeight, columns, rows, count } = LUNAR_LAYOUT;
  const sheet = document.createElement("canvas"); sheet.width = frameWidth * columns; sheet.height = frameHeight * rows;
  const ctx = sheet.getContext("2d");
  const square = document.createElement("canvas"); square.width = square.height = SIZE;
  const surface = square.getContext("2d");
  if (!ctx || !surface) throw new Error("A 2D canvas is required to build lunar textures.");
  for (let index = 0; index < count; index++) {
    paintLunarSurface(surface, familyAt(index), (seed ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0, settings);
    ctx.setTransform(frameWidth / 2 / SIZE, frameHeight / 2 / SIZE, -frameWidth / 2 / SIZE, frameHeight / 2 / SIZE,
      (index % columns) * frameWidth + frameWidth / 2, Math.floor(index / columns) * frameHeight);
    ctx.drawImage(square, 0, 0);
  }
  return sheet;
}
