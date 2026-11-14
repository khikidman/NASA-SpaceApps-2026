import { Application, RendererType, type WebGLRenderer } from "pixi.js";
import { tileCenter, worldBounds } from "../world/isometric";
import { pickWorldPosition } from "../world/map";
import { inRenderRange, nearbyBounds } from "../world/visibility";
import type { GridPosition, Point, WorldMap, WorldPresentation, WorldRenderState } from "../world/types";
import { constrainCamera, fitCamera, screenToWorld, zoomAt, type Camera } from "./camera";
import type { WorldRenderer, WorldRendererCallbacks } from "./types";
import { buildHomeMarker, buildWorldScene, drawTileHighlight } from "./world-scene";
import { homeGuidance } from "./home-guide";

class PixiWorldRenderer implements WorldRenderer {
  private scene;
  private readonly homeMarker = buildHomeMarker();
  private readonly bounds;
  private readonly resizeObserver: ResizeObserver;
  private readonly listeners = new AbortController();
  private camera: Camera = { x: 0, y: 0, zoom: 1 };
  private width = 0;
  private height = 0;
  private frame = 0;
  private destroyed = false;
  private contextLost = false;
  private hover: GridPosition | null = null;
  private selected: GridPosition;
  private snapshot: WorldRenderState;
  private presentation: WorldPresentation = { lowPower: false, lowOxygen: false, missionEnded: false };
  private gridVisible = true;
  private lastKeyboardMove = 0;
  private drag: { id: number; start: Point; camera: Camera; moved: boolean } | null = null;

  constructor(
    private readonly app: Application<WebGLRenderer>,
    private readonly host: HTMLElement,
    private readonly world: WorldMap,
    initialState: WorldRenderState,
    private readonly callbacks: WorldRendererCallbacks,
  ) {
    this.bounds = worldBounds(world.width, world.height);
    // Native canvas input owns picking; detach Pixi's duplicate event listeners.
    // @ts-expect-error Pixi 8.23 documents null for detachment but types only HTMLElement.
    this.app.renderer.events.setTargetElement(null);
    this.snapshot = initialState;
    this.scene = buildWorldScene(world, initialState.player);
    this.app.stage.addChild(this.scene.root, this.homeMarker.root);
    this.selected = initialState.selected;
    drawTileHighlight(this.scene.selection, world, this.selected, 0xf5e6b7);

    const canvas = this.app.canvas;
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "group");
    canvas.setAttribute("aria-label", "Mars exploration world. Arrow keys or WASD move your astronaut. E or Enter uses a nearby facility. Click clear ground to walk. Plus and minus zoom. Home centers the player.");
    canvas.setAttribute("aria-describedby", "world-controls-help world-selection");
    canvas.dataset.renderer = "webgl";
    this.reportVisibleScene();
    this.host.appendChild(canvas);
    this.bindInput();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
  }

  private resize() {
    if (this.destroyed) return;
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    const first = this.width === 0;
    this.camera = first ? fitCamera(nearbyBounds(this.world, this.snapshot.player), width, height) : {
      ...this.camera, x: this.camera.x + (width - this.width) / 2, y: this.camera.y + (height - this.height) / 2,
    };
    this.width = width;
    this.height = height;
    this.app.renderer.resize(width, height, Math.min(window.devicePixelRatio || 1, 2));
    this.applyCamera();
  }

  private applyCamera() {
    this.camera = constrainCamera(this.camera, this.bounds, this.width, this.height);
    this.scene.root.position.set(this.camera.x, this.camera.y);
    this.scene.root.scale.set(this.camera.zoom);
    const guide = homeGuidance(this.snapshot.player, this.world.home, this.camera, this.width, this.height);
    this.homeMarker.root.visible = !!guide;
    this.app.canvas.dataset.homeGuide = String(!!guide);
    if (guide) {
      this.homeMarker.root.position.set(guide.x, guide.y);
      this.homeMarker.arrow.rotation = guide.angle;
      this.homeMarker.distance.text = `${guide.distance.toFixed(1)} squares`;
    }
    this.callbacks.onZoom(this.camera.zoom);
    this.requestRender();
  }

  /** Coalesced, on-demand frames: idle worlds and hidden tabs do no rendering. */
  private requestRender() {
    if (this.destroyed || this.contextLost || document.hidden || this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      if (!this.destroyed && !this.contextLost) this.app.render();
    });
  }

  private localPoint(event: { clientX: number; clientY: number }): Point {
    const rect = this.app.canvas.getBoundingClientRect();
    // Canvas backing pixels/DPR must not enter camera or picking math.
    return { x: (event.clientX - rect.left) * this.width / rect.width, y: (event.clientY - rect.top) * this.height / rect.height };
  }

  private pick(point: Point) {
    return pickWorldPosition(this.world, screenToWorld(point, this.camera), this.snapshot.player);
  }

  private select(position: GridPosition) {
    this.selected = position;
    this.callbacks.onSelect(position);
    this.requestRender();
  }

  private bindInput() {
    const canvas = this.app.canvas;
    const signal = this.listeners.signal;
    canvas.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || this.drag || this.contextLost) return;
      canvas.focus({ preventScroll: true });
      canvas.setPointerCapture(event.pointerId);
      this.drag = { id: event.pointerId, start: this.localPoint(event), camera: { ...this.camera }, moved: false };
    }, { signal });
    canvas.addEventListener("pointermove", (event) => {
      if (this.contextLost) return;
      const point = this.localPoint(event);
      if (this.drag) {
        if (event.pointerId !== this.drag.id) return;
        const dx = point.x - this.drag.start.x;
        const dy = point.y - this.drag.start.y;
        this.drag.moved ||= Math.hypot(dx, dy) > 6;
        if (this.drag.moved) {
          this.camera = { ...this.drag.camera, x: this.drag.camera.x + dx, y: this.drag.camera.y + dy };
          canvas.classList.add("is-panning");
          this.applyCamera();
        }
        return;
      }
      const hover = this.pick(point);
      if (hover?.col !== this.hover?.col || hover?.row !== this.hover?.row) {
        this.hover = hover;
        drawTileHighlight(this.scene.hover, this.world, hover, 0xffffff);
        this.requestRender();
      }
    }, { signal });
    canvas.addEventListener("pointerup", (event) => {
      if (this.drag?.id !== event.pointerId) return;
      const dragged = this.drag.moved;
      this.drag = null;
      canvas.classList.remove("is-panning");
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      if (!dragged) {
        const position = this.pick(this.localPoint(event));
        if (position) this.select(position);
      }
    }, { signal });
    const cancelDrag = () => { this.drag = null; canvas.classList.remove("is-panning"); };
    canvas.addEventListener("pointercancel", cancelDrag, { signal });
    canvas.addEventListener("lostpointercapture", cancelDrag, { signal });
    canvas.addEventListener("pointerleave", () => {
      this.hover = null;
      drawTileHighlight(this.scene.hover, this.world, null, 0xffffff);
      this.requestRender();
    }, { signal });
    canvas.addEventListener("wheel", (event) => {
      if (this.contextLost) return;
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? this.height : 1);
      this.camera = zoomAt(this.camera, this.localPoint(event), this.camera.zoom * Math.exp(-Math.max(-200, Math.min(200, delta)) * 0.002));
      this.applyCamera();
    }, { signal, passive: false });
    canvas.addEventListener("keydown", (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey || this.contextLost) return;
      const directions: Record<string, GridPosition> = {
        ArrowLeft: { col: -1, row: 0 }, ArrowRight: { col: 1, row: 0 },
        ArrowUp: { col: 0, row: -1 }, ArrowDown: { col: 0, row: 1 },
        a: { col: -1, row: 0 }, d: { col: 1, row: 0 }, w: { col: 0, row: -1 }, s: { col: 0, row: 1 },
      };
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (Object.hasOwn(directions, key)) {
        event.preventDefault();
        if (event.shiftKey) {
          const direction = directions[key];
          this.camera = { ...this.camera, x: this.camera.x - direction.col * 40, y: this.camera.y - direction.row * 40 };
        } else {
          if (!event.repeat || performance.now() - this.lastKeyboardMove >= 140) {
            this.lastKeyboardMove = performance.now();
            this.callbacks.onMove(directions[key]);
          }
        }
        this.applyCamera();
      } else if (key === "e" || event.key === "Enter") {
        event.preventDefault();
        this.callbacks.onInteract();
      } else if (["+", "=", "-", "Home"].includes(event.key)) {
        event.preventDefault();
        if (event.key === "Home") this.fit();
        else this.zoomBy(event.key === "-" ? 1 / 1.2 : 1.2);
      }
    }, { signal });
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      this.contextLost = true;
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      cancelDrag();
      this.callbacks.onContextChange(false);
    }, { signal });
    canvas.addEventListener("webglcontextrestored", () => {
      this.contextLost = false;
      this.callbacks.onContextChange(true);
      this.requestRender();
    }, { signal });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { cancelAnimationFrame(this.frame); this.frame = 0; }
      else this.requestRender();
    }, { signal });
  }

  setPresentation(presentation: WorldPresentation) {
    this.presentation = presentation;
    for (const light of this.scene.lights) {
      const warning = presentation.missionEnded || presentation.lowPower || (light.kind === "oxygen" && presentation.lowOxygen);
      light.graphic.tint = warning ? 0xf2af54 : 0x91d4bc;
    }
    this.requestRender();
  }

  setGridVisible(visible: boolean) {
    this.gridVisible = visible;
    this.scene.grid.visible = visible;
    this.requestRender();
  }

  zoomBy(factor: number) {
    this.camera = zoomAt(this.camera, { x: this.width / 2, y: this.height / 2 }, this.camera.zoom * factor);
    this.applyCamera();
  }

  fit() {
    this.camera = fitCamera(nearbyBounds(this.world, this.snapshot.player), this.width, this.height);
    this.applyCamera();
  }

  private reportVisibleScene() {
    const canvas = this.app.canvas;
    canvas.dataset.visibleTiles = this.scene.tileKeys.join(";");
    canvas.dataset.visibleEntities = this.scene.entityIds.join(";");
    canvas.dataset.player = `${this.snapshot.player.col},${this.snapshot.player.row}`;
  }

  setExplorer(state: WorldRenderState) {
    const moved = state.player.col !== this.snapshot.player.col || state.player.row !== this.snapshot.player.row;
    this.snapshot = state;
    this.selected = state.selected;
    if (moved) {
      const old = this.scene;
      this.app.stage.removeChild(old.root);
      old.root.destroy({ children: true, context: true });
      this.scene = buildWorldScene(this.world, state.player);
      this.scene.grid.visible = this.gridVisible;
      this.app.stage.addChildAt(this.scene.root, 0);
      this.hover = null;
      this.setPresentation(this.presentation);
      const center = tileCenter(state.player);
      this.camera = { ...this.camera, x: this.width / 2 - center.x * this.camera.zoom,
        y: this.height / 2 - center.y * this.camera.zoom + 24 * this.camera.zoom };
    }
    drawTileHighlight(this.scene.selection, this.world,
      inRenderRange(state.selected, state.player) ? state.selected : null, 0xf5e6b7);
    this.reportVisibleScene();
    this.applyCamera();
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.listeners.abort();
    this.resizeObserver.disconnect();
    this.app.destroy({ removeView: true }, { children: true, context: true, texture: true, textureSource: true });
  }
}

export async function createWorldRenderer(
  host: HTMLElement,
  world: WorldMap,
  initialState: WorldRenderState,
  callbacks: WorldRendererCallbacks,
  signal: AbortSignal,
): Promise<WorldRenderer> {
  const app = new Application<WebGLRenderer>();
  try {
    await app.init({
      width: Math.max(1, host.clientWidth), height: Math.max(1, host.clientHeight),
      preference: ["webgl"], background: 0xead3b6, antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true,
      autoStart: false, sharedTicker: false,
    });
    if (signal.aborted) throw new DOMException("World initialization cancelled.", "AbortError");
    if (app.renderer.type !== RendererType.WEBGL) throw new Error("A WebGL renderer is required.");
    return new PixiWorldRenderer(app, host, world, initialState, callbacks);
  } catch (error) {
    if (app.renderer) app.destroy({ removeView: true }, { children: true, context: true });
    throw error;
  }
}
