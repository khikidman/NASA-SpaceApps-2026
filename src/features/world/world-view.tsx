"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { WorldRenderer } from "@/rendering/types";
import type { GameAction, GameState } from "@/game/types";
import { RESOURCE_NODES, getTask } from "@/data/tasks";
import { GameArt, type Art } from "@/components/game-art";
import { ResourceEffects } from "@/components/resource-effects";
import { canAfford } from "@/game/engine";
import { MISSION_VISUALS } from "@/features/mission/visual-content";
import { HudIcon } from "@/components/hud-icon";
import { entityAt } from "@/world/map";
import { adjacent, DIRECTIONS } from "@/world/exploration";
import { inRenderRange } from "@/world/visibility";
import type { WorldMap, WorldPresentation, MissionTarget } from "@/world/types";
import { useExplorer } from "./use-explorer";
import { Starfield } from "./starfield";

type ViewStatus = "loading" | "ready" | "unavailable" | "recovering";

export function WorldView({ world, presentation, game, act, onOpen, target }: { world: WorldMap; presentation: WorldPresentation; game: GameState; act: (action: GameAction) => void; onOpen: (id: string) => void; target: MissionTarget | null }) {
  const session = useExplorer(world, game, act, onOpen);
  const { explorer, selected, ready: explorerReady, move, select } = session;
  const host = useRef<HTMLDivElement>(null);
  const renderer = useRef<WorldRenderer | null>(null);
  const latestPresentation = useRef(presentation);
  const latestGrid = useRef(true);
  const renderState = useMemo(() => ({ player: explorer.position, selected, route: session.route }), [explorer.position, selected, session.route]);
  const latestRenderState = useRef(renderState);
  const movement = useRef(move);
  const selection = useRef(select);
  const interaction = useRef(session.interact);
  const completion = useRef(session.complete);
  const [status, setStatus] = useState<ViewStatus>("loading");
  const [retry, setRetry] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [gridVisible, setGridVisible] = useState(true);
  const [padVisible, setPadVisible] = useState(false);
  const requested = useRef<MissionTarget | null>(null);
  useEffect(() => {
    if (!target || status !== "ready" || requested.current === target) return;
    const node = world.entities.find((n) => n.id === target.nodeId);
    if (node && inRenderRange(node.position, game.position)) { requested.current = target; selection.current(node.position); }
  }, [target, status, world, game.position]);

  useEffect(() => { movement.current = move; selection.current = select; interaction.current = session.interact; completion.current = session.complete; });
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
        onMoveComplete: (position) => completion.current(position),
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
      completion.current(latestRenderState.current.player);
      if (!document.querySelector("dialog[open]")) element.querySelector("canvas")?.focus({ preventScroll: true });
    }).catch(() => {
      if (!controller.signal.aborted) setStatus("unavailable");
    });

    return () => {
      controller.abort();
      renderer.current = null;
      instance?.destroy();
    };
  }, [world, retry, explorerReady]);

  const ready = status === "ready" && explorerReady;
  const selectedNode = entityAt(world, selected);
  const node = selectedNode ?? world.entities.find((entry) => entry.interaction.type !== "base" && adjacent(explorer.position, entry.position));
  const canInteract = !!node && adjacent(explorer.position, node.position) && !session.pending;
  const supply = node?.interaction.type === "resource" ? RESOURCE_NODES[node.id] : undefined;
  const task = node?.interaction.type === "task" ? getTask(game.missionId, node.interaction.taskId) : undefined;
  const used = !!node && (game.collectedNodes.includes(node.id) || !!task && (game.taskProgress[task.id] ?? 0) >= task.steps.length);
  const full = !!supply && game.resources[supply.resource] >= (supply.resource === "science" ? 10000 : 100);
  const enough = !supply || canAfford(game.resources, supply.effects) && game.timeLeft >= supply.hours;
  const nodeArt: Art = task ? MISSION_VISUALS[task.id].art : supply ? ({ oxygen: "air", water: "water", power: "solar", shielding: "shield", science: "star" } as const)[supply.resource] : "home";
  const label = task ? MISSION_VISUALS[task.id].label : supply ? ({ oxygen: "Air", water: "Water", power: "Power", shielding: "Shield", science: "Discovery" } as const)[supply.resource] : "Home";
  const actual = supply ? Object.fromEntries(Object.entries(supply.effects).map(([key, value]) => [key, value > 0 ? Math.min(value, (key === "science" ? 10000 : 100) - game.resources[key as keyof typeof game.resources]) : value])) : {};

  function worldAction(action: () => void) {
    action();
    if (!document.querySelector("dialog[open]")) host.current?.querySelector("canvas")?.focus({ preventScroll: true });
  }

  return (
    <section className="world-section" aria-labelledby="world-title">
      <h2 id="world-title" className="sr-only">{world.location} exploration world</h2>
      <div className="world-stage" data-ready={ready}>
        <Starfield seed={world.seed} />
        <div className="world-viewport" ref={host} />
        {!ready && <div className="world-loading" role="status">
          <span className="world-loading-mark" aria-hidden="true">✦</span>
          <strong>{status === "loading" ? `Landing on ${world.levelId === "moon" ? "the Moon" : "Mars"}…` : status === "recovering" ? "Reconnecting the world view…" : "The world view is unavailable."}</strong>
          {status !== "loading" && <><p>Your mission controls are still available.</p><button className="primary-button" type="button" onClick={() => { setStatus("loading"); setRetry((value) => value + 1); }}>Retry world view</button></>}
        </div>}
      </div>

      <div className="world-toolbar minimal-camera" role="group" aria-label="World view controls">
        <button type="button" disabled={!ready} onClick={() => worldAction(() => renderer.current?.zoomBy(1.2))} aria-label="Zoom in">+</button>
        <button type="button" disabled={!ready} onClick={() => worldAction(() => renderer.current?.zoomBy(1 / 1.2))} aria-label="Zoom out">−</button>
        <button type="button" disabled={!ready} onClick={() => worldAction(() => renderer.current?.fit())} aria-label="Center player"><HudIcon name="target" size={20} /></button>
        <details className="extra-camera"><summary aria-label="More controls">···</summary><button type="button" disabled={!ready} aria-pressed={gridVisible} onClick={() => worldAction(() => setGridVisible((value) => !value))} aria-label="Toggle grid"><HudIcon name="grid" size={18} /></button><button type="button" aria-pressed={padVisible} onClick={() => setPadVisible((v) => !v)} aria-label="Movement controls">✥</button></details>
        <output className="sr-only" aria-label="World zoom">{Math.round(zoom * 100)}%</output>
      </div>
      {padVisible && <div className="touch-pad" role="group" aria-label="Move astronaut">{([['west', '↖'], ['north', '↗'], ['south', '↙'], ['east', '↘']] as const).map(([direction, arrow]) => <button key={direction} type="button" disabled={!ready} onClick={() => worldAction(() => move(DIRECTIONS[direction]))} aria-label={`Move ${direction}`}>{arrow}</button>)}</div>}
      {node && <aside className={`context-action ${canInteract ? "in-reach" : "on-way"}`} aria-label="Nearby action">
        <GameArt name={used ? "check" : nodeArt} size={42} /><div className="context-summary"><strong>{label}</strong>{supply && !used && <ResourceEffects effects={actual} hours={supply.hours} compact />}{!canInteract && <span className="walking-dots" aria-label="Walk beside this stop"><i /><i /><i /></span>}</div>
        <button type="button" className="context-use" disabled={!ready || !canInteract || used || full || !enough || game.status !== "playing"} onClick={() => worldAction(session.interact)} aria-label={task ? `Play ${task.title}` : supply ? `Collect ${label}` : "Open night plan"}>{used ? "✓" : full ? "Full" : !enough ? "Need supplies" : supply ? "Collect" : task ? "Play" : "Rest"}<kbd>E</kbd></button>
      </aside>}
      <p className="sr-only" id="world-selection" aria-live="polite" data-player-position={`${explorer.position.col},${explorer.position.row}`}>{node?.name ?? "Clear ground"}. Square {explorer.position.col}, {explorer.position.row}.</p>
      <p className="sr-only" id="world-controls-help">Click a stop to walk beside it. Use its action button or E to interact. Arrow keys or WASD move. Drag to pan, scroll to zoom.</p>
      {session.notice && <p className="navigation-hint" role="status">{session.notice}</p>}


    </section>
  );
}
