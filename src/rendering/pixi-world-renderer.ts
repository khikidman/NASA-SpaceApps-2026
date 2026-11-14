import { Application, RendererType, type WebGLRenderer } from "pixi.js";
import { tileCenter, worldBounds } from "../world/isometric";
import { nearbyBounds } from "../world/visibility";
import type { GridPosition, Point, WorldMap, WorldPresentation, WorldRenderState } from "../world/types";
import { constrainCamera, fitCamera, screenToWorld, zoomAt, type Camera } from "./camera";
import type { WorldRenderer, WorldRendererCallbacks } from "./types";
import { buildHomeMarker, buildWorldScene } from "./world-scene";
import { homeGuidance } from "./home-guide";
import { LunarSurfaceAtlas } from "./lunar-surface";
import { beginWalk, walkAt, retimeWalk, presenceAt, STEP_MS, type WalkMotion } from "./motion";

class PixiWorldRenderer implements WorldRenderer {
  private scene;
  private readonly lunar: LunarSurfaceAtlas | undefined;
  private readonly homeMarker = buildHomeMarker();
  private readonly objectiveMarker = buildHomeMarker("MISSION");
  private objective: GridPosition | null = null;
  private objectiveId: string | undefined;
  private feedbackId: number | null = null;
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
  private snapshot: WorldRenderState;
  private held: { key: string; direction: GridPosition } | null = null;
  private drag: { id: number; start: Point; camera: Camera; moved: boolean; picked: GridPosition | null } | null = null;
  private visualPlayer: GridPosition;
  private motion: WalkMotion | null = null;
  private queuedMotion: WalkMotion | null = null;
  private motionNotified = false;
  private stride = 0;
  private handoff: { at: number; target: GridPosition } | null = null;
  private pointer: Point | null = null;
  private readonly motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  private reduced = this.motionPreference.matches;
  private pausedAt: number | null = null;
  private completionTimer: ReturnType<typeof setTimeout> | null = null;
  private timedStep: { target: GridPosition; due: number; remaining: number } | null = null;
  private reportedZoom = -1;
  private minimumZoom = 0;
  private area = { left: 0, top: 0, width: 80, height: 80 };
  private renderedFrames = 0;

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
    this.visualPlayer = { ...initialState.player };
    this.lunar = world.levelId === "moon" ? new LunarSurfaceAtlas(world.seed) : undefined;
    this.scene = buildWorldScene(world, initialState.player, this.lunar);
    this.app.stage.addChild(this.scene.root, this.homeMarker.root, this.objectiveMarker.root);
    this.scene.setSelection(initialState.selected, performance.now(), false);

    const canvas = this.app.canvas;
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "group");
    canvas.setAttribute("aria-label", `${world.location} exploration world. Arrow keys or WASD move your astronaut. E or Enter uses a nearby facility. Click clear ground to walk. Plus and minus zoom. Home centers the player.`);
    canvas.setAttribute("aria-describedby", "world-controls-help world-selection");
    canvas.dataset.renderer = "webgl";
    canvas.dataset.surface = this.lunar ? "lunar-regolith-atlas" : "mars";
    canvas.dataset.surfaceVariants = String(this.lunar?.textures.length ?? 0);
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
    this.width = width;
    this.height = height;
    this.app.renderer.resize(width, height, Math.min(window.devicePixelRatio || 1, 2));
    this.area = this.readViewArea();
    this.fit();
  }

  /** CSS defines the HUD safe area; picking still uses the full canvas. */
  private readViewArea() {
    const style = getComputedStyle(this.host);
    this.minimumZoom = Math.max(0, parseFloat(style.getPropertyValue("--camera-min-zoom")) || 0);
    const inset = (edge: string) => Math.max(0, parseFloat(style.getPropertyValue(`--camera-${edge}`)) || 0);
    const left = Math.min(inset("left"), this.width / 3);
    const top = Math.min(inset("top"), this.height / 3);
    return { left, top,
      width: Math.max(80, this.width - left - Math.min(inset("right"), this.width / 3)),
      height: Math.max(80, this.height - top - Math.min(inset("bottom"), this.height / 2)),
    };
  }

  private viewArea() { return this.area; }

  private applyCamera() {
    this.camera = constrainCamera(this.camera, this.bounds, this.width, this.height);
    this.scene.root.position.set(this.camera.x, this.camera.y);
    this.scene.root.scale.set(this.camera.zoom);
    this.scene.cull(this.width, this.height);
    const area = this.viewArea();
    const guide = homeGuidance(this.snapshot.player, this.world.home,
      { ...this.camera, x: this.camera.x - area.left, y: this.camera.y - area.top }, area.width, area.height);
    this.homeMarker.root.visible = !!guide;
    this.app.canvas.dataset.homeGuide = String(!!guide);
    if (guide) {
      this.homeMarker.root.position.set(guide.x + area.left, guide.y + area.top);
      this.homeMarker.arrow.rotation = guide.angle;
      this.homeMarker.distance.text = `${guide.distance.toFixed(1)} squares`;
    }
    const goal = this.objective && homeGuidance(this.snapshot.player, this.objective,
      { ...this.camera, x: this.camera.x - area.left, y: this.camera.y - area.top }, area.width, area.height);
    this.objectiveMarker.root.visible = !!goal;
    if (goal) {
      let x = goal.x + area.left;
      if (guide && Math.hypot(goal.x - guide.x, goal.y - guide.y) < 95) x = Math.max(area.left + 75, Math.min(area.left + area.width - 75, x + (goal.x > area.width / 2 ? -95 : 95)));
      this.objectiveMarker.root.position.set(x, goal.y + area.top); this.objectiveMarker.arrow.rotation = goal.angle;
      this.objectiveMarker.distance.text = `${goal.distance.toFixed(0)} squares`;
    }
    if (Math.abs(this.reportedZoom - this.camera.zoom) > 0.0001) { this.reportedZoom = this.camera.zoom; this.callbacks.onZoom(this.camera.zoom); }
    this.requestRender();
  }

  /** A frame loop exists only while a walk, tile transition, or feedback pulse is active. */
  private requestRender() {
    if (this.destroyed || this.contextLost || document.hidden || this.frame) return;
    this.frame = requestAnimationFrame((now) => {
      // Keep the id set during the frame so camera updates cannot schedule duplicate loops.
      let walking = false;
      // Prepare the following validated step one frame before arrival, then sample
      // both sides of the boundary on the same clock. No stop-and-catch-up frame.
      for (let segment = 0; this.motion && segment < 2; segment++) {
        const motion = this.motion;
        const sample = walkAt(motion, now);
        this.moveVisual(sample.position, this.stride + sample.progress, !sample.done);
        walking = !sample.done;
        if (!this.motionNotified && now >= motion.start + motion.duration - 32) {
          this.motionNotified = true;
          this.callbacks.onMoveComplete({ ...motion.to });
          if (this.held && document.activeElement === this.app.canvas) this.callbacks.onMove(this.held.direction);
        }
        if (!sample.done) break;
        this.stride += 1;
        if (this.queuedMotion) {
          this.motion = this.queuedMotion; this.queuedMotion = null; this.motionNotified = false;
          walking = true;
        } else {
          this.motion = null;
          const target = this.snapshot.route?.[0];
          this.handoff = target ? { at: motion.start + motion.duration, target } : null;
          if (!target) this.scene.pulse(now);
        }
      }
      const animating = this.scene.update(now, this.reduced);
      this.scene.drawRoute(this.visualPlayer, this.snapshot.player, this.snapshot.route ?? []);
      this.applyCamera();
      if (this.pointer && !this.drag?.moved) {
        const hovered = this.pick(this.pointer);
        if (hovered?.col !== this.hover?.col || hovered?.row !== this.hover?.row) {
          this.hover = hovered; this.scene.setHover(hovered);
        }
      }
      this.reportAnimation(now);
      if (!this.destroyed && !this.contextLost) { this.app.render(); this.renderedFrames++; }
      this.frame = 0;
      if (walking || animating) this.requestRender();
    });
  }

  private moveVisual(position: GridPosition, stride: number, walking: boolean) {
    const old = tileCenter(this.visualPlayer); const next = tileCenter(position);
    if (!this.drag?.moved) {
      const dx = (old.x - next.x) * this.camera.zoom; const dy = (old.y - next.y) * this.camera.zoom;
      this.camera.x += dx; this.camera.y += dy;
      if (this.drag) { this.drag.camera.x += dx; this.drag.camera.y += dy; }
    }
    this.visualPlayer = { ...position };
    this.scene.setPlayer(position, stride, walking && !this.reduced);
  }
  private reportAnimation(now: number) {
    const canvas = this.app.canvas;
    canvas.dataset.motionTime = now.toFixed(3);
    canvas.dataset.visualPlayer = `${this.visualPlayer.col.toFixed(4)},${this.visualPlayer.row.toFixed(4)}`;
    canvas.dataset.moving = String(!!this.motion || !!this.queuedMotion || !!this.timedStep);
    canvas.dataset.outgoingTiles = String(this.scene.outgoingCount);
    canvas.dataset.retainedTiles = String(this.scene.cells.size);
    canvas.dataset.culledTiles = String(this.scene.culledGroundCount);
    canvas.dataset.culledObjects = String(this.scene.culledObjectCount);
    canvas.dataset.exposedSides = String(this.scene.exposedSideCount);
    canvas.dataset.enteringTiles = String([...this.scene.cells.values()].filter((c) => c.active && presenceAt(c.presence, now) < 1).length);
    canvas.dataset.renderedFrames = String(this.renderedFrames);
    canvas.dataset.camera = `${this.camera.x.toFixed(3)},${this.camera.y.toFixed(3)},${this.camera.zoom.toFixed(4)}`;
  }
  private scheduleCompletion(target: GridPosition, remaining = STEP_MS) {
    if (this.completionTimer) clearTimeout(this.completionTimer);
    this.timedStep = { target: { ...target }, remaining, due: performance.now() + remaining };
    if (!document.hidden && !this.contextLost) this.completionTimer = setTimeout(() => {
      this.completionTimer = null; this.timedStep = null;
      if (!this.destroyed) { this.callbacks.onMoveComplete(target); this.requestRender(); }
    }, remaining);
  }
  private refreshPause() {
    const now = performance.now();
    if (document.hidden || this.contextLost) {
      this.stopHeld();
      this.pausedAt ??= now;
      cancelAnimationFrame(this.frame); this.frame = 0;
      if (this.completionTimer) {
        clearTimeout(this.completionTimer); this.completionTimer = null;
        if (this.timedStep) this.timedStep.remaining = Math.max(0, this.timedStep.due - now);
      }
    } else {
      if (this.pausedAt !== null) {
        const delta = now - this.pausedAt;
        if (this.motion) this.motion.start += delta;
        if (this.queuedMotion) this.queuedMotion.start += delta;
        this.scene.shiftTime(delta); this.handoff = null; this.pausedAt = null;
      }
      if (this.timedStep) this.scheduleCompletion(this.timedStep.target, this.timedStep.remaining);
      this.requestRender();
    }
  }

  private stopHeld() {
    if (!this.held) return;
    this.held = null;
    if (!this.snapshot.route?.length) {
      if (this.queuedMotion) this.queuedMotion = beginWalk(this.queuedMotion.from, this.queuedMotion.to, this.queuedMotion.start, false, true);
      else if (this.motion) this.motion = retimeWalk(this.motion, true, performance.now());
    }
    this.requestRender();
  }

  private localPoint(event: { clientX: number; clientY: number }): Point {
    const rect = this.app.canvas.getBoundingClientRect();
    // Canvas backing pixels/DPR must not enter camera or picking math.
    return { x: (event.clientX - rect.left) * this.width / rect.width, y: (event.clientY - rect.top) * this.height / rect.height };
  }

  private pick(point: Point) {
    return this.scene.pick(screenToWorld(point, this.camera));
  }

  private select(position: GridPosition) {
    this.scene.setSelection(position, performance.now(), !this.reduced);
    this.callbacks.onSelect(position);
    this.requestRender();
  }

  private bindInput() {
    const canvas = this.app.canvas;
    const signal = this.listeners.signal;
    canvas.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || this.drag || this.contextLost) return;
      this.stopHeld();
      canvas.focus({ preventScroll: true });
      canvas.setPointerCapture(event.pointerId);
      this.drag = { id: event.pointerId, start: this.localPoint(event), camera: { ...this.camera }, moved: false, picked: this.pick(this.localPoint(event)) };
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
      this.pointer = point;
      this.requestRender();
    }, { signal });
    canvas.addEventListener("pointerup", (event) => {
      if (this.drag?.id !== event.pointerId) return;
      const dragged = this.drag.moved;
      const picked = this.drag.picked;
      this.drag = null;
      canvas.classList.remove("is-panning");
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      if (!dragged) {
        if (picked) this.select(picked);
      }
    }, { signal });
    const cancelDrag = () => { this.drag = null; canvas.classList.remove("is-panning"); };
    canvas.addEventListener("pointercancel", cancelDrag, { signal });
    canvas.addEventListener("lostpointercapture", cancelDrag, { signal });
    canvas.addEventListener("pointerleave", () => {
      this.pointer = null; this.hover = null;
      this.scene.setHover(null);
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
          this.stopHeld();
          const direction = directions[key];
          this.camera = { ...this.camera, x: this.camera.x - direction.col * 40, y: this.camera.y - direction.row * 40 };
        } else {
          if (!event.repeat) {
            this.held = { key, direction: directions[key] };
            this.callbacks.onMove(directions[key]);
          }
        }
        this.applyCamera();
      } else if (key === "e" || event.key === "Enter") {
        event.preventDefault();
        if (!event.repeat) this.callbacks.onInteract();
      } else if (["+", "=", "-", "Home"].includes(event.key)) {
        event.preventDefault();
        if (event.key === "Home") this.fit();
        else this.zoomBy(event.key === "-" ? 1 / 1.2 : 1.2);
      }
    }, { signal });
    window.addEventListener("keyup", (event) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === this.held?.key) this.stopHeld();
    }, { signal });
    canvas.addEventListener("blur", () => this.stopHeld(), { signal });
    window.addEventListener("blur", () => this.stopHeld(), { signal });
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      this.contextLost = true;
      this.refreshPause();
      cancelDrag(); this.stopHeld();
      this.callbacks.onContextChange(false);
    }, { signal });
    canvas.addEventListener("webglcontextrestored", () => {
      this.contextLost = false;
      this.callbacks.onContextChange(true);
      this.refreshPause();
    }, { signal });
    document.addEventListener("visibilitychange", () => this.refreshPause(), { signal });
    this.motionPreference.addEventListener("change", () => {
      this.reduced = this.motionPreference.matches;
      if (this.reduced && this.motion) {
        const target = this.queuedMotion?.to ?? this.motion.to; this.motion = null; this.queuedMotion = null; this.handoff = null;
        this.moveVisual(target, 0, false); this.scheduleCompletion(target);
      }
      this.scene.update(performance.now(), this.reduced); this.requestRender();
    }, { signal });
  }

  setPresentation(presentation: WorldPresentation) {
    this.scene.setPresentation(presentation);
    if (presentation.objectiveNodeId !== this.objectiveId) {
      this.objectiveId = presentation.objectiveNodeId; this.objective = this.world.entities.find((e) => e.id === this.objectiveId)?.position ?? null;
    }
    if (presentation.feedback && this.feedbackId !== null && presentation.feedback.id !== this.feedbackId && presentation.feedback.nodeId) this.scene.celebrate(presentation.feedback.nodeId, presentation.feedback.success, performance.now());
    this.feedbackId = presentation.feedback?.id ?? this.feedbackId ?? 0;
    this.applyCamera();
  }
  setGridVisible(visible: boolean) {
    this.scene.setGridVisible(visible); this.requestRender();
  }

  zoomBy(factor: number) {
    const area = this.viewArea();
    this.camera = zoomAt(this.camera, { x: area.left + area.width / 2, y: area.top + area.height / 2 }, this.camera.zoom * factor);
    this.applyCamera();
  }

  fit() {
    const area = this.viewArea();
    const fitted = fitCamera(nearbyBounds(this.world, this.snapshot.player), area.width, area.height, 24);
    const framed = zoomAt(fitted, { x: area.width / 2, y: area.height / 2 }, Math.max(fitted.zoom, this.minimumZoom));
    this.camera = { ...framed, x: framed.x + area.left, y: framed.y + area.top };
    this.applyCamera();
  }

  private reportVisibleScene() {
    const canvas = this.app.canvas;
    canvas.dataset.visibleTiles = this.scene.tileKeys.join(";");
    canvas.dataset.visibleEntities = this.scene.entityIds.join(";");
    canvas.dataset.player = `${this.snapshot.player.col},${this.snapshot.player.row}`;
    canvas.dataset.route = (this.snapshot.route ?? []).map((p) => `${p.col},${p.row}`).join(";");
  }

  setExplorer(state: WorldRenderState) {
    const previous = this.snapshot;
    const moved = state.player.col !== previous.player.col || state.player.row !== previous.player.row;
    const selectionChanged = state.selected.col !== previous.selected.col || state.selected.row !== previous.selected.row;
    this.snapshot = state;
    const now = performance.now();
    if (moved) {
      this.scene.syncVisible(state.player, now, this.reduced);
      const distance = Math.abs(state.player.col - previous.player.col) + Math.abs(state.player.row - previous.player.row);
      if (this.reduced || distance > 1) {
        this.motion = null; this.queuedMotion = null; this.moveVisual(state.player, 0, false); this.scheduleCompletion(state.player);
      } else {
        if (this.motion && now < this.motion.start + this.motion.duration) {
          this.queuedMotion = beginWalk(this.motion.to, state.player, this.motion.start + this.motion.duration, false, (!state.route?.length && !this.held));
        } else {
          const handoff = this.handoff;
          const continuous = handoff && now - handoff.at < 80 && handoff.target.col === state.player.col && handoff.target.row === state.player.row;
          this.motion = beginWalk(this.visualPlayer, state.player, continuous ? handoff.at : now, !continuous, (!state.route?.length && !this.held));
          this.motionNotified = false; this.handoff = null;
        }
      }
      this.hover = null; this.scene.setHover(null);
    } else {
      const motion = this.queuedMotion ?? this.motion;
      if (motion && motion.to.col === state.player.col && motion.to.row === state.player.row && motion.decelerate !== (!state.route?.length && !this.held)) {
        if (this.queuedMotion) {
          this.queuedMotion = beginWalk(motion.from, motion.to, motion.start, motion.accelerate, (!state.route?.length && !this.held));
        } else {
          this.motion = retimeWalk(motion, (!state.route?.length && !this.held), now);
        }
      }
    }
    if (selectionChanged) this.scene.setSelection(state.selected, now, !this.reduced);
    this.scene.drawRoute(this.visualPlayer, state.player, state.route ?? []);
    this.reportVisibleScene(); this.applyCamera();
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    if (this.completionTimer) clearTimeout(this.completionTimer);
    this.listeners.abort();
    this.resizeObserver.disconnect();
    this.app.destroy({ removeView: true }, { children: true, context: true });
    this.lunar?.destroy();
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
      preference: ["webgl"], background: 0x000000, backgroundAlpha: 0, antialias: true,
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
