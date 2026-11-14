"use client";
import Link from "next/link";
import { useEffect, useReducer, useRef, useState } from "react";
import fineDust from "./presets/fine-dust.json";
import impactField from "./presets/impact-field.json";
import activeRecipe from "../src/assets/recipes/lunar-surface.json";
import { LUNAR_CONTROLS, LUNAR_DEFAULT_SETTINGS, LUNAR_GENERATOR_VERSION, validateLunarSettings } from "../src/assets/lunar-settings.mjs";
import { familyAt } from "../src/assets/lunar-painter";
import { SAVE_KEY } from "../src/game/save";
import { ancestorOf, canonical, sha256, decode64, MAX_PACKAGE_BYTES, PACKAGE_FORMAT, sealPackage, settingsDiff, validateImageSettings, validateSource, verifyPackage, type AssetPackage, type ImageSettings, type SourceSnapshot } from "./core/package.mjs";
import { listRevisions, storeRevision } from "./core/storage";
import { buildLunarSheet, download, normalizeImage, patchFromSheet, pngFile, processImage, spriteScene, tileFromSheet, type LunarSettings } from "./core/preview";
import styles from "./lab.module.css";
interface Original { data: string; name: string; width: number; height: number; inputSha256?: string; inputMime?: string }
interface Workspace { kind: "lunar-recipe" | "sprite"; assetId: string; title: string; author: string; note: string; seed: number; slot: number; settings: LunarSettings; imageSettings: ImageSettings; original: Original | null; parent: AssetPackage | null; source: SourceSnapshot | null }
const imageDefaults: ImageSettings = { brightness: 1, contrast: 1, saturation: 1, scale: 1, anchorX: .5, anchorY: 1, frameWidth: 64, frameHeight: 64 };
const initial: Workspace = { kind: "lunar-recipe", assetId: "lunar-surface", title: "Moon regolith", author: "", note: "", seed: 1, slot: 0, settings: { ...LUNAR_DEFAULT_SETTINGS }, imageSettings: imageDefaults, original: null, parent: null, source: null };
const time = (value: string) => new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", dateStyle: "short", timeStyle: "short" }).format(new Date(value));
const sameSource = (a: SourceSnapshot | null, b: SourceSnapshot | null) => !!a && !!b && canonical(a.files) === canonical(b.files);
function matchesSavedRevision(work: Workspace) {
    const parent = work.parent;
    return parent && !work.note.trim() && parent.asset.id === work.assetId && parent.asset.title === work.title.trim() && parent.asset.kind === work.kind && parent.revision.author === work.author.trim()
      && (work.kind === "lunar-recipe" ? parent.payload.seed === work.seed && parent.payload.slot === work.slot && canonical(parent.payload.recipe?.settings) === canonical(work.settings)
        : parent.payload.original?.name === work.original?.name && parent.files.find((f) => f.name === "source.png")?.base64 === work.original?.data.split(",")[1] && canonical(parent.payload.settings) === canonical(work.imageSettings));
}
async function fetchSource() {
  const response = await fetch("/api/asset-lab/source", { cache: "no-store" });
  const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Could not read the game source.");
  return { source: validateSource(result.source), settings: validateLunarSettings(result.recipe.settings) };
}
export function AssetLab() {
  const [work, edit] = useReducer((state: Workspace, patch: Partial<Workspace>) => ({ ...state, ...patch }), initial);
  const [history, setHistory] = useState<AssetPackage[]>([]), [currentSource, setCurrentSource] = useState<SourceSnapshot | null>(null);
  const [baseline, setBaseline] = useState<LunarSettings>(() => validateLunarSettings(activeRecipe.settings));
  const [view, setView] = useState<"tile" | "patch" | "atlas">("patch"), [compare, setCompare] = useState(false), [frame, setFrame] = useState(0);
  const [status, setStatus] = useState("Loading local workspace…"), [busy, setBusy] = useState(false), [storageReady, setStorageReady] = useState(true);
  const [revisionCount, refreshPreview] = useReducer((n: number) => n + 1, 0);
  const cachedBaseline = useRef<{ key: string; sheet: HTMLCanvasElement } | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null), baseCanvas = useRef<HTMLCanvasElement>(null), importInput = useRef<HTMLInputElement>(null), imageInput = useRef<HTMLInputElement>(null);
  const [previewInfo, setPreviewInfo] = useState(""), [previewError, setPreviewError] = useState("");
  useEffect(() => {
    let live = true;
    void fetchSource().then(({ source, settings }) => { if (live) { setCurrentSource(source); setBaseline(settings); edit({ source, settings }); setStatus("Ready. Save named revisions; exports are the shareable handoff."); } }).catch((error) => { if (live) setStatus(error.message); });
    void listRevisions().then((items) => { if (live) setHistory(items); }).catch(() => { if (live) { setStorageReady(false); setStatus("Browser storage is unavailable. Export packages to keep your work."); } });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    let live = true;
    const timer = setTimeout(() => {
      void (async () => {
        const settings = validateLunarSettings(work.settings);
        const baseKey = `${work.seed}:${canonical(baseline)}`;
        if (cachedBaseline.current?.key !== baseKey) cachedBaseline.current = { key: baseKey, sheet: buildLunarSheet(work.seed, baseline) };
        const base = cachedBaseline.current.sheet;
        const sheet = work.kind === "sprite" || canonical(settings) === canonical(baseline) ? base : buildLunarSheet(work.seed, settings);
        let working: HTMLCanvasElement, original: HTMLCanvasElement;
        if (work.kind === "sprite" && work.original) {
          validateImageSettings(work.imageSettings, work.original.width, work.original.height);
          const processed = await processImage(work.original.data, work.imageSettings);
          working = view === "patch" ? await spriteScene(processed, work.imageSettings, base, frame) : processed;
          if (view === "atlas") {
            const guides = document.createElement("canvas"); guides.width = processed.width; guides.height = processed.height;
            const guide = guides.getContext("2d")!; guide.drawImage(processed, 0, 0); guide.strokeStyle = "#80dbc999"; guide.lineWidth = 1;
            for (let x = 0; x <= guides.width; x += work.imageSettings.frameWidth) { guide.moveTo(x, 0); guide.lineTo(x, guides.height); }
            for (let y = 0; y <= guides.height; y += work.imageSettings.frameHeight) { guide.moveTo(0, y); guide.lineTo(guides.width, y); }
            guide.stroke(); working = guides;
          }
          const raw = await processImage(work.original.data, { ...work.imageSettings, brightness: 1, contrast: 1, saturation: 1 });
          original = view === "patch" ? await spriteScene(raw, work.imageSettings, base, frame) : raw;
        } else {
          working = view === "atlas" ? sheet : view === "tile" ? tileFromSheet(sheet, work.slot) : patchFromSheet(sheet, work.slot);
          original = view === "atlas" ? base : view === "tile" ? tileFromSheet(base, work.slot) : patchFromSheet(base, work.slot);
        }
        if (!live) return;
        for (const [host, image] of [[canvas.current, working], [baseCanvas.current, original]] as const) if (host) { host.width = image.width; host.height = image.height; host.getContext("2d")!.drawImage(image, 0, 0); }
        setPreviewInfo(`${working.width} × ${working.height} preview · ${work.kind === "lunar-recipe" ? "48 variants / one shared atlas" : `${work.original!.width} × ${work.original!.height} source`}`); setPreviewError("");
      })().catch((error) => { if (live) setPreviewError(error.message); });
    }, 75);
    return () => { live = false; clearTimeout(timer); };
  }, [work.settings, work.seed, work.slot, work.kind, work.original, work.imageSettings, baseline, view, frame, revisionCount]);
  function lunar(key: keyof LunarSettings, value: number | string) { edit({ settings: { ...work.settings, [key]: value } }); }
  function imageSetting(key: keyof ImageSettings, value: number) { edit({ imageSettings: { ...work.imageSettings, [key]: value } }); }
  async function refreshSource(rebase: boolean) {
    try {
      const next = await fetchSource(); setCurrentSource(next.source); setBaseline(next.settings);
      if (rebase) { edit({ source: next.source, note: work.note ? `${work.note}\nRebased onto the current game source.` : "Rebased onto the current game source." }); setStatus("Rebased. Compare the current generator output before saving a new revision."); }
      else setStatus("Source fingerprints refreshed. Your experiment keeps its existing source until you rebase.");
    } catch (error) { setStatus((error as Error).message); }
  }
  async function makeRevision() {
    if (!work.source) throw new Error("Wait for the source snapshot, then try again.");
    if (!work.author.trim() || !work.note.trim()) throw new Error("Add your name and a change note before saving or exporting.");
    const latest = await fetchSource(); setCurrentSource(latest.source); setBaseline(latest.settings);
    if (!sameSource(work.source, latest.source)) throw new Error("The game source changed. Use Rebase to current source, compare the preview, and save a new revision.");
    let files, payload;
    if (work.kind === "lunar-recipe") {
      const settings = validateLunarSettings(work.settings), sheet = buildLunarSheet(work.seed, settings);
      files = await Promise.all([pngFile("atlas.png", sheet), pngFile("tile.png", tileFromSheet(sheet, work.slot))]);
      payload = { recipe: { schemaVersion: 1 as const, generatorVersion: LUNAR_GENERATOR_VERSION, settings }, seed: work.seed, slot: work.slot };
    } else {
      if (!work.original) throw new Error("Import an image first.");
      const settings = validateImageSettings(work.imageSettings, work.original.width, work.original.height), processed = await processImage(work.original.data, settings);
      const original64 = work.original.data.split(",")[1];
      const sourceFile = { name: "source.png", mime: "image/png" as const, width: work.original.width, height: work.original.height, base64: original64, sha256: await sha256(decode64(original64)) };
      files = [sourceFile, await pngFile("sprite.png", processed)];
      payload = { original: { name: work.original.name, width: work.original.width, height: work.original.height, ...(work.original.inputSha256 ? { inputSha256: work.original.inputSha256, inputMime: work.original.inputMime ?? "image/png" } : {}) }, settings };
    }
    const pkg = await sealPackage({ format: PACKAGE_FORMAT, asset: { id: work.assetId, title: work.title.trim(), kind: work.kind }, revision: { id: crypto.randomUUID(), parentId: work.parent?.revision.id ?? null, createdAt: new Date().toISOString(), author: work.author.trim(), note: work.note.trim() }, source: work.source, generatorVersion: work.kind === "lunar-recipe" ? LUNAR_GENERATOR_VERSION : "image-v1", lineage: work.parent ? [...work.parent.lineage, ancestorOf(work.parent)] : [], payload, files, environment: { renderer: "Canvas2D", browser: navigator.userAgent } });
    await verifyPackage(pkg);
    return pkg;
  }
  async function save(exportFile: boolean) {
    const parent = work.parent;
    const unchanged = matchesSavedRevision(work);
    if (exportFile && unchanged && parent) { download(`${parent.asset.id}--${parent.revision.id}.assetlab.json`, JSON.stringify(parent, null, 2)); setStatus(`Exported saved revision ${parent.revision.id.slice(0, 8)}. No duplicate revision created.`); return; }
    setBusy(true);
    try {
      const pkg = await makeRevision();
      let persisted = true;
      try { await storeRevision(pkg); setHistory(await listRevisions()); setStorageReady(true); } catch { persisted = false; setStorageReady(false); }
      edit({ parent: pkg, note: "" });
      if (exportFile || !persisted) download(`${pkg.asset.id}--${pkg.revision.id}.assetlab.json`, JSON.stringify(pkg, null, 2));
      setStatus(`Revision ${pkg.revision.id.slice(0, 8)} saved${exportFile ? " and exported" : ""}. ${persisted ? "Browser-only until exported." : "Storage unavailable: keep the downloaded package."}`);
    } catch (error) { setStatus((error as Error).message); }
    finally { setBusy(false); }
  }
  function loadRevision(pkg: AssetPackage) {
    const source = pkg.files.find((file) => file.name === "source.png");
    edit({ kind: pkg.asset.kind, assetId: pkg.asset.id, title: pkg.asset.title, author: pkg.revision.author, note: "", seed: pkg.payload.seed ?? 1, slot: pkg.payload.slot ?? 0,
      settings: pkg.payload.recipe?.settings ?? { ...LUNAR_DEFAULT_SETTINGS }, imageSettings: pkg.payload.settings ?? imageDefaults,
      original: source && pkg.payload.original ? { ...pkg.payload.original, data: `data:image/png;base64,${source.base64}` } : null, parent: pkg, source: pkg.source });
    setFrame(0); setStatus(`Editing from ${pkg.revision.id.slice(0, 8)}. A save creates a child revision; the original stays intact.`);
  }
  async function importPackage(file: File) {
    setBusy(true);
    try {
      if (file.size > MAX_PACKAGE_BYTES) throw new Error("Packages must be under 24 MB.");
      const pkg = await verifyPackage(JSON.parse(await file.text()));
      try { await storeRevision(pkg); setHistory(await listRevisions()); } catch (error) { if ((error as Error).message.includes("collision")) throw error; setStorageReady(false); }
      loadRevision(pkg);
    } catch (error) { setStatus((error as Error).message); }
    finally { setBusy(false); }
  }
  async function importImage(file: File) {
    setBusy(true);
    try {
      const original = await normalizeImage(file), stem = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
      const assetId = /^[a-z]/.test(stem) ? stem : `sprite-${stem}`;
      edit({ kind: "sprite", assetId: assetId.slice(0, 64).padEnd(3, "x"), title: file.name.replace(/\.[^.]+$/, ""), original, parent: null, source: currentSource, note: "Imported original image.", imageSettings: { ...imageDefaults, frameWidth: original.width, frameHeight: original.height, scale: Math.max(.05, Math.min(1, 96 / original.width)) } });
      setView("patch"); setFrame(0); setStatus("Image normalized to PNG. The source and refined output will both be retained in the package.");
    } catch (error) { setStatus((error as Error).message); }
    finally { setBusy(false); }
  }
  async function exportPng() {
    setBusy(true);
    try {
      const output = work.kind === "lunar-recipe" ? view === "atlas" ? buildLunarSheet(work.seed, work.settings) : tileFromSheet(buildLunarSheet(work.seed, work.settings), work.slot) : await processImage(work.original!.data, validateImageSettings(work.imageSettings, work.original!.width, work.original!.height));
      const png = await pngFile("preview.png", output);
      download(`${work.assetId}-${work.kind === "lunar-recipe" && view === "atlas" ? "atlas" : "asset"}.png`, new Blob([Uint8Array.from(atob(png.base64), (c) => c.charCodeAt(0))], { type: "image/png" }));
      setStatus("PNG downloaded. Use Export package for a traceable, promotable handoff.");
    } catch (error) { setStatus((error as Error).message); }
    finally { setBusy(false); }
  }
  function newLunar() { edit({ ...initial, author: work.author, settings: { ...baseline }, source: currentSource }); setView("patch"); setStatus("New lunar experiment based on the current game recipe."); }
  const differences = settingsDiff(work.parent ? work.kind === "lunar-recipe" ? work.parent.payload.recipe?.settings ?? baseline : work.parent.payload.settings ?? imageDefaults : work.kind === "lunar-recipe" ? baseline : imageDefaults, work.kind === "lunar-recipe" ? work.settings : work.imageSettings);
  const canExport = !!work.source && !busy && !previewError;
  return <main className={styles.lab}>
    <header className={styles.header}><div><span className={styles.mark}>◈</span><div><h1>Asset lab</h1><p>Experiment → compare → hand off</p></div></div><nav><Link href="/" target="_blank">Open game ↗</Link><button onClick={() => importInput.current?.click()} disabled={busy}>Import package</button><button onClick={() => save(false)} disabled={!canExport}>Save revision</button><button className={styles.primary} onClick={() => save(true)} disabled={!canExport}>Export package ↗</button></nav></header>
    <input ref={importInput} type="file" accept=".json,.assetlab.json,application/json" className={styles.hidden} aria-label="Import asset package file" onChange={(e) => { const file = e.target.files?.[0]; if (file) void importPackage(file); e.target.value = ""; }} />
    <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp" className={styles.hidden} aria-label="Import image file" onChange={(e) => { const file = e.target.files?.[0]; if (file) void importImage(file); e.target.value = ""; }} />
    <div className={styles.workspace}>
      <aside className={styles.library}><p className={styles.eyebrow}>WORKSPACE</p><button className={styles.libraryButton} onClick={newLunar} disabled={busy}><span>◈</span><strong>Lunar surface</strong><small>Shared game generator</small></button><button className={styles.libraryButton} onClick={() => imageInput.current?.click()} disabled={busy}><span>＋</span><strong>Import an image</strong><small>PNG · WebP · JPEG</small></button>
        <div className={styles.sectionHeading}><h2>Revision shelf</h2><span>{history.length}</span></div>{!history.length && <p className={styles.empty}>Saved experiments appear here. Export a package to share one with a teammate.</p>}
        <div className={styles.revisions}>{history.map((pkg) => <button key={pkg.revision.id} disabled={busy} className={work.parent?.revision.id === pkg.revision.id ? styles.selected : ""} onClick={() => loadRevision(pkg)}><strong>{pkg.asset.title}</strong><span>{pkg.revision.id.slice(0, 8)} · {pkg.revision.author}</span><small>{pkg.revision.note}</small></button>)}</div>
        <details className={styles.source}><summary>Source &amp; backtrace</summary><p>{work.source?.gitCommit ? `Git ${work.source.gitCommit.slice(0, 10)}` : "No Git commit available"}{work.source?.dirty ? " · working tree snapshot" : ""}</p>{work.source?.files.map((f) => <p key={f.path}><code>{f.path}</code><small>{f.sha256.slice(0, 16)}</small></p>)}<button onClick={() => refreshSource(false)} disabled={busy}>Refresh source</button><button onClick={() => refreshSource(true)} disabled={!currentSource || busy}>Rebase to current source</button></details>
      </aside>
      <section className={styles.stage}>
        <div className={styles.stageHeading}><div><p className={styles.eyebrow}>{work.kind === "lunar-recipe" ? "PROCEDURAL TEXTURE" : "SPRITE / IMAGE"}</p><h2>{work.title || "Untitled experiment"}</h2></div><span className={styles.localBadge}>{matchesSavedRevision(work) ? "Saved locally" : "Unsaved draft"}</span></div>
        {work.source && currentSource && !sameSource(work.source, currentSource) && <p className={styles.warning}>Different source snapshot. Rebase explicitly before saving a new revision.</p>}
        <div className={styles.previewToolbar}><div className={styles.tabs}>{(["tile", "patch", "atlas"] as const).map((name) => <button key={name} aria-pressed={view === name} onClick={() => setView(name)}>{work.kind === "sprite" ? name === "patch" ? "In world" : name === "tile" ? "Image" : "Sheet" : name === "patch" ? "In world" : name === "tile" ? "Tile" : "Atlas"}</button>)}</div><label><input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> Compare baseline</label><button title={work.kind === "lunar-recipe" ? view === "atlas" ? "Download the full atlas PNG" : "Download the selected tile PNG; use Export package for the atlas and recipe" : "Download the refined image without preview guides"} onClick={exportPng} disabled={busy || !!previewError}>PNG ↓</button></div>
        <div className={`${styles.previews} ${compare ? styles.comparing : ""}`}><figure><div className={styles.canvasHost}><canvas ref={canvas} aria-label="Working asset preview" /></div><figcaption>Working {work.kind === "sprite" && view === "patch" ? "· crosshair = anchor" : ""}</figcaption></figure><figure className={!compare ? styles.hidden : ""}><div className={styles.canvasHost}><canvas ref={baseCanvas} aria-label="Baseline asset preview" /></div><figcaption>{work.kind === "sprite" ? "Original image" : "Current game recipe"}</figcaption></figure></div>
        <p className={styles.previewInfo}>{previewError || previewInfo}</p>
        {work.kind === "lunar-recipe" && <div className={styles.variantPicker} aria-label="Atlas variants">{Array.from({ length: 48 }, (_, i) => <button key={i} title={`${i}: ${familyAt(i)}`} aria-label={`Variant ${i}, ${familyAt(i)}`} aria-pressed={work.slot === i} onClick={() => edit({ slot: i })}>{i + 1}</button>)}</div>}
        <section className={styles.changes}><div className={styles.sectionHeading}><h2>Changes from {work.parent ? "parent revision" : "game baseline"}</h2><span>{differences.length}</span></div>{differences.length ? <dl>{differences.map((d) => <div key={d.key}><dt>{d.key}</dt><dd><del>{String(d.before)}</del><span>→</span><strong>{String(d.after)}</strong></dd></div>)}</dl> : <p>No setting changes yet.</p>}</section>
        <section className={styles.handoff}><h2>Hand-off protocol</h2><ol><li>Compare at game scale and save a named revision.</li><li>Export the package. It includes both PNGs, settings, source hashes, and ancestry.</li><li>Preview the promotion in your checkout:</li></ol><code>npm run lab:promote -- --bundle /path/revision.assetlab.json</code><p>Add <code>--apply</code> only after reviewing the dry run. Lunar recipes feed the existing renderer; sprites enter the catalog for an explicit scene binding.</p><p>Full protocol: <code>asset-lab/PROTOCOL.md</code></p></section>
      </section>
      <aside className={styles.inspector}><p className={styles.eyebrow}>REFINE</p>{work.kind === "lunar-recipe" && <label className={styles.presetLabel}>Starting preset<select defaultValue="" onChange={(e) => { const preset = e.target.value === "fine" ? fineDust : e.target.value === "impact" ? impactField : null; edit({ settings: preset ? validateLunarSettings(preset.settings) : { ...baseline }, note: preset ? `Applied ${preset.title} preset.` : "Reset to game baseline." }); }}><option value="" disabled>Choose a starting point</option><option value="baseline">Game baseline</option><option value="fine">Fine dust</option><option value="impact">Impact field</option></select></label>}{work.kind === "lunar-recipe" ? <><label>Preview seed<input type="number" min={0} max={4294967295} value={work.seed} onChange={(e) => { const seed = Number(e.target.value); if (Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff) edit({ seed }); }} /></label><button className={styles.subtle} onClick={() => { try { const seed = JSON.parse(localStorage.getItem(SAVE_KEY) ?? "{}").seed; if (Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff) edit({ seed }); else setStatus("Start a game on this browser origin first, or enter a seed manually."); } catch { setStatus("Game seed unavailable."); } }}>Use current game seed</button><div className={styles.colors}>{([['baseColor','Dust'], ['rimColor','Crater rim'], ['floorColor','Bowl light'], ['shadowColor','Bowl shadow']] as const).map(([key, label]) => <label key={key}>{label}<input type="color" value={work.settings[key]} onChange={(e) => lunar(key, e.target.value)} /></label>)}</div>{LUNAR_CONTROLS.map((field) => <label key={field.key}>{field.label}<output>{work.settings[field.key]}</output><input type="range" min={field.min} max={field.max} step={field.step} value={work.settings[field.key]} onChange={(e) => lunar(field.key, Number(e.target.value))} /></label>)}<button className={styles.subtle} onClick={() => edit({ settings: { ...baseline } })}>Reset settings to game baseline</button></> : <>{([['brightness','Brightness',.5,1.5,.05],['contrast','Contrast',.5,1.5,.05],['saturation','Color',0,2,.05],['scale','Game scale',.05,4,.05],['anchorX','Anchor X',0,1,.05],['anchorY','Anchor Y',0,1,.05]] as const).map(([key,label,min,max,step]) => <label key={key}>{label}<output>{work.imageSettings[key].toFixed(2)}</output><input type="range" min={min} max={max} step={step} value={work.imageSettings[key]} onChange={(e) => imageSetting(key, Number(e.target.value))} /></label>)}{([['frameWidth','Frame width'],['frameHeight','Frame height']] as const).map(([key,label]) => <label key={key}>{label}<input type="number" min={1} max={work.original?.[key === "frameWidth" ? "width" : "height"] ?? 2048} value={work.imageSettings[key]} onChange={(e) => imageSetting(key, Number(e.target.value))} /></label>)}<label>Preview frame<input type="number" min={0} value={frame} onChange={(e) => setFrame(Math.max(0, Number(e.target.value) || 0))} /></label><p className={styles.empty}>Frame sizes must divide the image. The green crosshair is the position used by the game adapter.</p></>}
        <div className={styles.metadata}><p className={styles.eyebrow}>REVISION DETAILS</p><label>Asset ID<input value={work.assetId} maxLength={64} onChange={(e) => edit({ assetId: e.target.value })} /></label><label>Title<input value={work.title} maxLength={100} onChange={(e) => edit({ title: e.target.value })} /></label><label>Your name<input value={work.author} maxLength={100} onChange={(e) => edit({ author: e.target.value })} placeholder="Teammate name" /></label><label>Change note<textarea value={work.note} maxLength={1000} onChange={(e) => edit({ note: e.target.value })} placeholder="What changed, and why?" rows={3} /></label>{work.parent && <p className={styles.empty}>Parent: <code>{work.parent.revision.id.slice(0, 8)}</code><br />{time(work.parent.revision.createdAt)} · Chicago time<button className={styles.subtle} onClick={() => download(`${work.parent!.asset.id}--${work.parent!.revision.id}.assetlab.json`, JSON.stringify(work.parent, null, 2))}>Export this saved revision</button></p>}</div>
        <button className={styles.subtle} onClick={() => { refreshPreview(); setStatus("Preview rebuilt using the current in-memory settings."); }}>Rebuild preview</button>
      </aside>
    </div><footer className={styles.status} role="status"><span className={busy ? styles.busy : styles.ready} />{busy ? "Working…" : status}{!storageReady && <b> · Export to keep this work</b>}</footer>
  </main>;
}
