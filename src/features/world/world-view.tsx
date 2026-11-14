"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { WorldRenderer } from "@/rendering/types";
import { entityAt, placementIssue, tileAt } from "@/world/map";
import { adjacent, DIRECTIONS, gridDistance } from "@/world/exploration";
import { inRenderRange, RENDER_RADIUS, visibleTiles } from "@/world/visibility";
import type { FacilityKind, Terrain, WorldMap, WorldPresentation } from "@/world/types";
import { useExplorer } from "./use-explorer";

type ViewStatus = "loading" | "ready" | "unavailable" | "recovering";

const TERRAIN_NAMES: Record<Terrain, string> = {
  sand: "Open terrain", rock: "Rocky terrain", path: "Supply route", pad: "Facility pad",
};
const FACILITY_DESCRIPTIONS: Record<FacilityKind, string> = {
  habitat: "Your home base: crew quarters, supplies, and mission control.",
  solar: "A solar array for collecting energy from sunlight.",
  oxygen: "Equipment for the outpost's breathable air supply.",
  lab: "A place to study samples and make discoveries.",
  shield: "A protected space for the crew during space-weather alerts.",
};

export function WorldView({ world, presentation }: { world: WorldMap; presentation: WorldPresentation }) {
  const session = useExplorer(world);
  const { explorer, selected, ready: explorerReady, move, select } = session;
  const host = useRef<HTMLDivElement>(null);
  const renderer = useRef<WorldRenderer | null>(null);
  const latestPresentation = useRef(presentation);
  const latestGrid = useRef(true);
  const renderState = useMemo(() => ({ player: explorer.position, selected }), [explorer.position, selected]);
  const latestRenderState = useRef(renderState);
  const movement = useRef(move);
  const selection = useRef(select);
  const interaction = useRef(session.interact);
  const [status, setStatus] = useState<ViewStatus>("loading");
  const [retry, setRetry] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [gridVisible, setGridVisible] = useState(true);

  useEffect(() => { movement.current = move; selection.current = select; interaction.current = session.interact; });
  useEffect(() => {
    latestRenderState.current = renderState;
    renderer.current?.setExplorer(renderState);
  }, [renderState]);

  useEffect(() => {
    latestPresentation.current = presentation;
    renderer.current?.setPresentation(presentation);
  }, [presentation]);

  useEffect(() => {
    latestGrid.current = gridVisible;
    renderer.current?.setGridVisible(gridVisible);
  }, [gridVisible]);

  useEffect(() => {
    const element = host.current;
    if (!element || !explorerReady) return;
    const controller = new AbortController();
    let instance: WorldRenderer | null = null;

    // This boundary keeps Pixi, the DOM, and GPU initialization out of SSR.
    void import("@/rendering/pixi-world-renderer").then(async ({ createWorldRenderer }) => {
      if (controller.signal.aborted) return;
      instance = await createWorldRenderer(element, world, latestRenderState.current, {
        onSelect: (position) => selection.current(position),
        onMove: (direction) => movement.current(direction),
        onInteract: () => interaction.current(),
        onZoom: setZoom,
        onContextChange: (available) => setStatus(available ? "ready" : "recovering"),
      }, controller.signal);
      if (controller.signal.aborted) { instance.destroy(); return; }
      renderer.current = instance;
      instance.setPresentation(latestPresentation.current);
      instance.setExplorer(latestRenderState.current);
      instance.setGridVisible(latestGrid.current);
      setStatus("ready");
    }).catch(() => {
      if (!controller.signal.aborted) setStatus("unavailable");
    });

    return () => {
      controller.abort();
      renderer.current = null;
      instance?.destroy();
    };
  }, [world, retry, explorerReady]);

  const tile = tileAt(world, selected)!;
  const entity = entityAt(world, selected);
  const openGround = placementIssue(world, selected, { width: 1, height: 1 }) === null;
  const ready = status === "ready" && explorerReady;
  const visible = visibleTiles(world, explorer.position);
  const homeVisible = inRenderRange(world.home, explorer.position);
  const canInteract = !!entity && adjacent(explorer.position, entity.position);
  const activeFacility = world.entities.find((entry) => entry.id === explorer.activeFacilityId);
  const nearbyFacility = world.entities.some((entry) => adjacent(explorer.position, entry.position));
  const missionStatus = presentation.missionEnded ? "Mission archived" : presentation.lowPower
    ? "Power running low" : presentation.lowOxygen ? "Oxygen running low" : "Crew on station";

  return (
    <section className="world-section panel" aria-labelledby="world-title">
      <header className="world-header">
        <div><p className="eyebrow">SURFACE EXPLORATION / RANGE {RENDER_RADIUS}</p><h2 id="world-title">One small step.</h2></div>
        <div className="world-toolbar" role="group" aria-label="World view controls">
          <button type="button" onClick={() => renderer.current?.zoomBy(1 / 1.2)} disabled={!ready} aria-label="Zoom out">−</button>
          <output aria-label="World zoom">{Math.round(zoom * 100)}%</output>
          <button type="button" onClick={() => renderer.current?.zoomBy(1.2)} disabled={!ready} aria-label="Zoom in">+</button>
          <span className="toolbar-divider" />
          <button type="button" className="world-text-control" onClick={() => setGridVisible((visible) => !visible)} disabled={!ready} aria-pressed={gridVisible}>Grid</button>
          <button type="button" className="world-text-control" onClick={() => renderer.current?.fit()} disabled={!ready}>Center player</button>
        </div>
      </header>

      <div className="world-stage">
        <div className="world-viewport" ref={host} />
        <div className="world-top-overlay" aria-hidden="true"><span>EXPLORER / MARS</span><span className="world-compass">N ↗</span></div>
        <div className="world-bottom-overlay" aria-hidden="true"><span>{visible.length} NEARBY SQUARES</span><span>3-SQUARE RADIUS</span></div>
        {!ready && <div className="world-loading" role="status">
          <span className="world-loading-mark" aria-hidden="true">✦</span>
          <strong>{status === "loading" ? "Opening your outpost…" : status === "recovering" ? "Reconnecting the world view…" : "The world view is unavailable."}</strong>
          {status !== "loading" && <><p>You can continue your mission below.</p><button className="primary-button" type="button" onClick={() => { setStatus("loading"); setRetry((value) => value + 1); }}>Retry world view</button></>}
        </div>}
      </div>

      <div className="explorer-controls">
        <div className="explorer-position"><p className="eyebrow">YOUR ASTRONAUT</p><strong data-player-position={`${explorer.position.col},${explorer.position.row}`}>Square {explorer.position.col} / {explorer.position.row}</strong><p>{explorer.steps} steps · {explorer.visitedFacilities.length} facilities visited</p></div>
        <div className="movement-pad" role="group" aria-label="Move astronaut">
          {([['west', '↖'], ['north', '↗'], ['south', '↙'], ['east', '↘']] as const).map(([direction, arrow]) => <button key={direction} type="button" disabled={!ready || !!activeFacility} onClick={() => move(DIRECTIONS[direction])} aria-label={`Move ${direction}`}>{arrow}</button>)}
        </div>
        <button type="button" className="primary-button nearby-interact" disabled={!ready || !nearbyFacility} onClick={session.interact}>Use nearby facility <span aria-hidden="true">E</span></button>
        <p className="home-status" role="status">{homeVisible ? "⌂ Home base is nearby" : `⌂ Home base: ${gridDistance(explorer.position, world.home).toFixed(1)} squares away — follow the arrow`}</p>
      </div>

      <div className="world-inspector" id="world-selection" aria-live="polite" aria-atomic="true">
        <span className="tile-coordinate">TILE {String(selected.col).padStart(2, "0")} / {String(selected.row).padStart(2, "0")}</span>
        <div><h3>{entity?.name ?? TERRAIN_NAMES[tile.terrain]}</h3><p>{entity ? FACILITY_DESCRIPTIONS[entity.kind] : openGround ? "Empty square. Click clear ground to walk there." : tile.terrain === "path" ? "An empty, walkable square on the supply route." : "Rocks block this square."}</p>{entity && !canInteract && <p>Stand next to this facility to use it.</p>}</div>
        {entity ? <button className="primary-button facility-interact" disabled={!ready || !canInteract} onClick={session.interact}>Use {entity.kind === "habitat" ? "home base" : "facility"}</button> : <span className="world-facility-tag">{tile.terrain === "rock" ? "Blocked" : "Empty square"}</span>}
      </div>
      {session.notice && <p className="exploration-notice" role="status">{session.notice}</p>}
      {activeFacility && <section className="facility-panel" aria-label={`${activeFacility.name} interaction`}>
        <div><p className="eyebrow">{activeFacility.kind === "habitat" ? "WELCOME HOME" : "FACILITY LOG"}</p><h3>{activeFacility.name}</h3><p>{FACILITY_DESCRIPTIONS[activeFacility.kind]}</p><p>{activeFacility.kind === "habitat" ? "You are safe beside base. Mission decisions and crew resources are available below." : "Your visit has been recorded in your exploration log. Mission decisions below control your resource supplies."}</p></div>
        <button type="button" className="text-button" onClick={session.dismiss}>Continue exploring</button>
      </section>}
      <footer className="world-help"><p id="world-controls-help">Arrow keys / WASD to move · E to use facilities · Click empty squares to walk · Scroll to zoom</p><span><span className="status-dot" />{missionStatus}</span></footer>
    </section>
  );
}
