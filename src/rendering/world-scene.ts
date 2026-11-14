import { Container, Graphics, Text, Sprite } from "pixi.js";
import { compareEntityDepth, footprintPolygon, gridToWorld, tileCenter, pointInPolygon, entitySilhouette } from "../world/isometric";
import type { FacilityKind, GridPosition, Point, WorldEntity, WorldMap, WorldTile, WorldPresentation } from "../world/types";
import { cellKey, visibleTiles } from "../world/visibility";
import { entityAt } from "../world/map";
import type { LunarSurfaceAtlas } from "./lunar-surface";
import { TILE_DROP, TILE_ENTER_MS, SELECTION_MS, presenceAt, retargetPresence, easeOut, type Presence } from "./motion";

const flat = (points: readonly Point[]) => points.flatMap((point) => [point.x, point.y]);
const SAND = [0xc98d65, 0xc58a63, 0xcf946c, 0xc38a66];

function prism(graphic: Graphics, width: number, depth: number, height: number, colors: readonly number[]) {
  const base = footprintPolygon({ col: 0, row: 0 }, width, depth);
  const roof = base.map((point) => ({ x: point.x, y: point.y - height }));
  graphic.poly(flat([base[3], base[2], roof[2], roof[3]])).fill(colors[1]);
  graphic.poly(flat([base[2], base[1], roof[1], roof[2]])).fill(colors[2]);
  graphic.poly(flat(roof)).fill(colors[0]).stroke({ color: 0x493e35, alpha: 0.18, width: 1 });
}

function roofPanel(graphic: Graphics, entity: WorldEntity, color: number) {
  const points = footprintPolygon({ col: 0.16, row: 0.16 }, entity.footprint.width - 0.32, entity.footprint.height - 0.32)
    .map((point) => ({ x: point.x, y: point.y - entity.height - 1 }));
  graphic.poly(flat(points)).fill(color).stroke({ color: 0xf3e9d4, alpha: 0.7, width: 1.5 });
}

function facility(entity: WorldEntity): { graphic: Graphics; light: Graphics } {
  const graphic = new Graphics();
  const { width, height } = entity.footprint;
  const palettes: Record<FacilityKind, readonly number[]> = {
    habitat: [0xf0e6ce, 0xb0aa96, 0xd0c6ad],
    solar: [0x35586e, 0x536475, 0x798790],
    oxygen: [0xe3e2d0, 0x96aa9f, 0xbdcbbf],
    lab: [0xe3c58e, 0xa38a65, 0xc4ab7f],
    shield: [0x919aa8, 0x5f6f80, 0x7c8999],
  };
  prism(graphic, width, height, entity.height, palettes[entity.kind]);
  if (entity.kind === "solar") {
    roofPanel(graphic, entity, 0x244d69);
    for (let step = 1; step <= 3; step++) {
      const offset = step / 4;
      const a = gridToWorld({ col: offset, row: 0.16 });
      const b = gridToWorld({ col: offset, row: 0.84 });
      const c = gridToWorld({ col: 0.16, row: offset });
      const d = gridToWorld({ col: 0.84, row: offset });
      graphic.moveTo(a.x, a.y - entity.height - 1).lineTo(b.x, b.y - entity.height - 1)
        .moveTo(c.x, c.y - entity.height - 1).lineTo(d.x, d.y - entity.height - 1)
        .stroke({ color: 0xb1d3d8, alpha: 0.65, width: 0.8 });
    }
  } else {
    const glass = entity.kind === "lab" ? 0x658b8f : entity.kind === "shield" ? 0xb6c1cf : 0x739fa0;
    roofPanel(graphic, entity, glass);
    const center = gridToWorld({ col: width / 2, row: height / 2 });
    graphic.moveTo(center.x, center.y - entity.height - 2)
      .lineTo(center.x, center.y - entity.height - 21)
      .stroke({ color: 0xe9dfc9, width: 2 });
    if (entity.kind === "habitat") {
      // An airlock on the near-left face, contained within the building footprint.
      const front = gridToWorld({ col: width, row: height });
      graphic.poly([front.x - 40, front.y - 20, front.x - 20, front.y - 10,
        front.x - 20, front.y - 35, front.x - 40, front.y - 45]).fill(0x3c5756);
    }
  }
  const center = gridToWorld({ col: width / 2, row: height / 2 });
  const light = new Graphics().circle(center.x, center.y - entity.height - (entity.kind === "solar" ? 0 : 21), 3).fill(0xffffff);
  return { graphic, light };
}

interface TileVisual {
  tile: WorldTile; polygon: readonly Point[]; ground: Container; grid: Graphics;
  object: Container | null; objectY: number; active: boolean; presence: Presence; offset: number;
  entity?: WorldEntity; silhouette?: readonly Point[];
  node?: { badge: Text; symbol: string; color: number }; light?: Graphics;
}
function createAstronaut() {
  const root = new Container();
  const shadow = new Graphics().ellipse(0, 1, 13, 6).fill({ color: 0x23353f, alpha: 0.28 });
  shadow.ellipse(0, 0, 16, 8).stroke({ color: 0xdef4e7, alpha: 0.9, width: 2 });
  const body = new Container();
  const leftLeg = new Graphics().roundRect(-3, 0, 6, 17, 2).fill(0x3d5556);
  const rightLeg = new Graphics().roundRect(-3, 0, 6, 17, 2).fill(0x3d5556);
  leftLeg.position.set(-5, -17); rightLeg.position.set(5, -17);
  const suit = new Graphics().roundRect(-14, -32, 9, 21, 3).fill(0xb8b5a1);
  suit.roundRect(-10, -34, 20, 23, 6).fill(0xeee8d6).stroke({ color: 0xa3aaa1, width: 1 });
  suit.circle(0, -44, 12).fill(0xf3eedb).stroke({ color: 0xa3aaa1, width: 1 });
  suit.roundRect(-8, -49, 16, 11, 5).fill(0x36596a);
  suit.moveTo(-4, -46).lineTo(3, -46).stroke({ color: 0xaccbca, width: 2 });
  suit.roundRect(-6, -29, 12, 5, 2).fill(0xc06d4c);
  const leftArm = new Graphics().roundRect(-3, 0, 6, 15, 3).fill(0xe0ddcc);
  const rightArm = new Graphics().roundRect(-3, 0, 6, 15, 3).fill(0xe0ddcc);
  leftArm.position.set(-12, -30); rightArm.position.set(12, -30);
  body.addChild(leftLeg, rightLeg, suit, leftArm, rightArm);
  root.addChild(shadow, body);
  return { root, shadow, body, leftLeg, rightLeg, leftArm, rightArm };
}

/** Retain the overlap between circles; only entering/leaving cells allocate or dispose geometry. */
export class WorldScene {
  readonly root = new Container();
  private readonly ground = new Container();
  private readonly objects = new Container();
  private readonly route = new Graphics();
  readonly hover = new Graphics();
  private readonly selection = new Graphics();
  private readonly ripple = new Graphics();
  private readonly astronaut = createAstronaut();
  private readonly celebration = new Container();
  private readonly celebrationRing = new Graphics();
  private readonly sparks: Graphics[] = [];
  private celebrationStart = -Infinity;
  private celebratedNode: string | null = null;
  readonly cells = new Map<string, TileVisual>();
  private readonly orderedEntities: readonly WorldEntity[];
  private pickCells: TileVisual[] = [];
  private selected: GridPosition;
  private hovered: GridPosition | null = null;
  private pulseStart = -Infinity;
  private gridVisible = true;
  private presentation: WorldPresentation = { lowPower: false, lowOxygen: false, missionEnded: false };
  constructor(private readonly world: WorldMap, player: GridPosition, private readonly lunar?: LunarSurfaceAtlas) {
    this.root.eventMode = "none";
    this.ground.sortableChildren = true; this.objects.sortableChildren = true;
    this.orderedEntities = [...world.entities].sort(compareEntityDepth).reverse();
    this.selected = { ...player };
    for (const tile of visibleTiles(world, player)) this.addCell(tile, 0, false);
    this.refreshPickOrder();
    this.objects.addChild(this.astronaut.root);
    this.celebration.addChild(this.celebrationRing);
    for (let i = 0; i < 10; i++) { const spark = new Graphics().poly([0,-4,1,-1,4,0,1,1,0,4,-1,1,-4,0,-1,-1]).fill(i % 2 ? 0xb6f6da : 0xe7c7ff); this.sparks.push(spark); this.celebration.addChild(spark); }
    this.celebration.visible = false;
    this.root.addChild(this.ground, this.route, this.hover, this.selection, this.ripple, this.objects, this.celebration);
    this.setSelection(player, 0, false); this.setPlayer(player, 0, false);
  }
  get tileKeys() { return [...this.cells].filter(([, c]) => c.active).map(([key]) => key); }
  get entityIds() { return this.orderedEntities.filter((e) => this.cells.get(cellKey(e.position))?.active).map((e) => e.id); }
  get outgoingCount() { let count = 0; for (const c of this.cells.values()) if (!c.active) count++; return count; }
  private addCell(tile: WorldTile, now: number, animate: boolean) {
    const moon = this.world.levelId === "moon";
    const sand = moon ? [0x9c9e95, 0xa6a79e, 0x969b90, 0xaaa99e] : SAND;
    const corners = footprintPolygon(tile);
    const group = new Container(); group.zIndex = tile.col + tile.row;
    const ground = new Graphics();
    // Full side faces reveal naturally as neighboring tiles drop away.
    const [a, b, c] = [corners[3], corners[2], corners[1]];
    ground.poly(flat([a, b, { x: b.x, y: b.y + 14 }, { x: a.x, y: a.y + 14 }])).fill(moon ? 0x595b54 : 0x946548);
    ground.poly(flat([b, c, { x: c.x, y: c.y + 14 }, { x: b.x, y: b.y + 14 }])).fill(moon ? 0x77796f : 0xaa7451);
    const color = tile.terrain === "path" ? (moon ? 0xa6a79a : 0xdfb78b) : tile.terrain === "pad" ? (moon ? 0xa2a498 : 0xbba58b)
      : tile.terrain === "rock" ? (moon ? 0x8f9587 : 0xb47b58) : sand[tile.variant];
    ground.poly(flat(corners)).fill(color);
    group.addChild(ground);
    if (this.lunar) {
      const surface = new Sprite(this.lunar.texture(tile));
      const origin = gridToWorld(tile);
      surface.position.set(origin.x - 48, origin.y); surface.scale.set(0.5);
      group.addChild(surface);
      // A dusty lip and fragments in the exposed regolith sides.
      ground.moveTo(a.x, a.y + 3).lineTo(b.x, b.y + 3).lineTo(c.x, c.y + 3).stroke({ color: 0xa5aa98, alpha: 0.25, width: 1 });
      for (let i = 1; i < 7; i++) {
        const t = i / 7, depth = 5 + (i * 7 + tile.variant * 3) % 7;
        ground.ellipse(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t + depth, 1.3, .6).fill({ color: i % 2 ? 0xb5b7a6 : 0x333f32, alpha: .35 });
      }
    } else if (tile.terrain === "sand" && tile.variant === 0) {
      const center = tileCenter(tile);
      ground.ellipse(center.x + 9, center.y + 4, 6, 2).fill({ color: moon ? 0x596b7a : 0xa66949, alpha: 0.35 });
    }
    const grid = new Graphics().poly(flat(corners)).stroke({ color: moon ? 0x484b44 : 0x76573e, alpha: moon ? 0.19 : 0.28, width: .8 });
    grid.visible = this.gridVisible;
    group.addChild(grid); this.ground.addChild(group);
    const entity = entityAt(this.world, tile);
    const visual: TileVisual = { tile, polygon: corners, ground: group, grid, object: null, objectY: 0,
      active: true, presence: { from: animate ? 0 : 1, to: 1, start: now, duration: animate ? TILE_ENTER_MS : 0 }, offset: 0, entity };
    if (entity) {
      const object = new Container(); const origin = gridToWorld(entity.position);
      object.position.set(origin.x, origin.y);
      object.zIndex = entity.position.col + entity.position.row + 2;
      const { graphic, light } = facility(entity);
      const symbol = entity.interaction.type === "task" ? ({ samples: "◆", safety: "≋", garden: "✿" }[entity.interaction.taskId] ?? "?") : entity.interaction.type === "base" ? "⌂" : ({ "oxygen-01": "O₂", "water-01": "◒", "solar-01": "ϟ", "shield-01": "◇", "sample-01": "✦" }[entity.id] ?? "+");
      const color = entity.interaction.type === "task" ? 0xdbb2ff : entity.id === "water-01" ? 0x78bbff : entity.id === "solar-01" ? 0xffdb85 : 0x93f1d7;
      const center = gridToWorld({ col: 0.5, row: 0.5 });
      const marker = new Graphics().circle(center.x, center.y - entity.height - 22, 13).fill(0x10202e).stroke({ color, width: 2 });
      const badge = new Text({ text: symbol, style: { fontFamily: "Arial", fontSize: 19, fontWeight: "bold", fill: color } });
      badge.anchor.set(0.5); badge.position.set(center.x, center.y - entity.height - 22);
      object.addChild(graphic, light, marker, badge); this.objects.addChild(object);
      Object.assign(visual, { object, objectY: origin.y, node: { badge, symbol, color }, light, silhouette: entitySilhouette(entity) });
    } else if (tile.terrain === "rock") {
      const object = new Container(); const rock = new Graphics();
      if (moon) {
        rock.ellipse(4, 10, 21, 8).fill({ color: 0x343833, alpha: .28 });
        rock.poly([-19, 5, -15, -8, -3, -16, 12, -12, 20, 1, 10, 13, -4, 16]).fill(0x777974);
        rock.poly([-19, 5, -15, -8, -3, -16, 12, -12, 1, -1]).fill(0xb7b6ab);
        rock.poly([1, -1, 12, -12, 20, 1, 10, 13]).fill(0x96988e);
        rock.moveTo(-3, -16).lineTo(-2, -5).lineTo(4, 1).lineTo(0, 10).stroke({ color: 0x53574f, width: 1, alpha: .7 });
        rock.poly([-25, 12, -20, 7, -15, 13, -19, 17]).fill(0xa1a497);
        rock.poly([20, 11, 26, 6, 30, 12, 25, 15]).fill(0xaaa99c);
      } else prism(rock, 0.48, 0.48, 8 + tile.variant * 2, [0xb79b80, 0x826954, 0x9c7c60]);
      const point = moon ? tileCenter(tile) : gridToWorld({ col: tile.col + 0.26, row: tile.row + 0.26 });
      object.position.set(point.x, point.y); object.zIndex = tile.col + tile.row + 2;
      object.addChild(rock); this.objects.addChild(object); visual.object = object; visual.objectY = point.y;
    }
    this.cells.set(cellKey(tile), visual);
    this.presentCell(visual);
    return visual;
  }
  syncVisible(player: GridPosition, now: number, reduced: boolean) {
    const tiles = visibleTiles(this.world, player); const wanted = new Set(tiles.map(cellKey));
    for (const [key, cell] of this.cells) {
      const active = wanted.has(key);
      if (cell.active !== active) { cell.active = active; cell.presence = retargetPresence(cell.presence, active ? 1 : 0, now); }
    }
    for (const tile of tiles) if (!this.cells.has(cellKey(tile))) this.addCell(tile, now, !reduced);
    this.refreshPickOrder();
    this.update(now, reduced);
  }
  private refreshPickOrder() { this.pickCells = [...this.cells.values()].filter((c) => c.active).sort((a, b) => b.tile.col + b.tile.row - a.tile.col - a.tile.row); }
  private presentCell(cell: TileVisual) {
    const used = !!cell.entity && this.presentation.usedNodeIds?.includes(cell.entity.id);
    if (cell.node) { cell.node.badge.text = used ? "✓" : cell.node.symbol; cell.node.badge.style.fill = cell.entity?.id === this.presentation.objectiveNodeId ? 0xffffff : cell.node.color; cell.node.badge.scale.set(cell.entity?.id === this.presentation.objectiveNodeId ? 1.15 : 1); }
    if (cell.light) cell.light.tint = this.presentation.missionEnded || this.presentation.lowPower || (cell.entity?.kind === "oxygen" && this.presentation.lowOxygen) ? 0xf2af54 : 0x91d4bc;
    if (cell.object) cell.object.alpha = presenceAt(cell.presence, performance.now()) * (used ? 0.5 : 1);
  }
  setPresentation(presentation: WorldPresentation) { this.presentation = presentation; for (const cell of this.cells.values()) this.presentCell(cell); }
  celebrate(nodeId: string, success: boolean, now: number) {
    const cell = [...this.cells.values()].find((c) => c.entity?.id === nodeId && c.active);
    if (!cell) return;
    const center = tileCenter(cell.tile);
    this.celebration.position.set(center.x, center.y - (cell.entity?.height ?? 0) - 20);
    this.celebrationStart = now; this.celebratedNode = nodeId;
    this.celebrationRing.clear().circle(0, 0, 15).stroke({ color: success ? 0x9bf2d4 : 0xf5acb5, width: 2.5 });
    for (const spark of this.sparks) spark.tint = success ? 0xffffff : 0xffa4ae;
  }
  setGridVisible(visible: boolean) { this.gridVisible = visible; for (const cell of this.cells.values()) cell.grid.visible = visible; }
  setHover(position: GridPosition | null) {
    this.hovered = position;
    drawTileHighlight(this.hover, this.world, position, 0xffffff);
    const cell = position && this.cells.get(cellKey(position));
    this.hover.visible = !!cell?.active; this.hover.y = cell?.offset ?? 0;
  }
  setSelection(position: GridPosition, now: number, animate = true) {
    this.selected = { ...position }; this.pulseStart = animate ? now : -Infinity;
    const blocked = this.cells.get(cellKey(position))?.tile.terrain === "rock";
    const color = blocked ? 0xffa1a9 : 0x91f4df;
    const center = tileCenter(position);
    const points = footprintPolygon(position).map((p) => ({ x: p.x - center.x, y: p.y - center.y }));
    this.selection.clear().poly(flat(points)).fill({ color, alpha: 0.21 }).stroke({ color, width: 2.5, alpha: 0.95 });
    this.selection.poly(flat(points.map((p) => ({ x: p.x * 0.84, y: p.y * 0.84 })))).stroke({ color: 0xf1fff9, alpha: 0.65, width: 1 });
    this.ripple.clear().poly(flat(points)).stroke({ color, width: 2, alpha: 0.85 });
    this.updateSelection(now, false);
  }
  pulse(now: number) { this.pulseStart = now; }
  private updateSelection(now: number, reduced: boolean) {
    const cell = this.cells.get(cellKey(this.selected));
    const center = tileCenter(this.selected);
    this.selection.visible = this.ripple.visible = !!cell?.active;
    if (!cell?.active) return false;
    this.selection.position.set(center.x, center.y + cell.offset);
    this.ripple.position.copyFrom(this.selection.position);
    const t = Math.max(0, Math.min(1, (now - this.pulseStart) / SELECTION_MS));
    const pop = reduced || t >= 1 ? 1 : 0.84 + 0.16 * easeOut(Math.min(1, t * 3)) + Math.sin(Math.min(1, t * 2) * Math.PI) * 0.08;
    this.selection.scale.set(pop); this.selection.alpha = presenceAt(cell.presence, now);
    this.ripple.visible = !reduced && t < 1;
    this.ripple.scale.set(0.9 + t * 0.8); this.ripple.alpha = (1 - t) ** 2;
    return !reduced && t < 1;
  }
  drawRoute(from: GridPosition, target: GridPosition, route: readonly GridPosition[]) {
    this.route.clear();
    const points = [from, target, ...route].filter((p, i, all) => this.cells.get(cellKey({ col: Math.round(p.col), row: Math.round(p.row) }))?.active && (!i || p.col !== all[i - 1].col || p.row !== all[i - 1].row));
    if (points.length < 2) return;
    const start = tileCenter(points[0]); this.route.moveTo(start.x, start.y);
    for (const p of points.slice(1)) { const center = tileCenter(p); this.route.lineTo(center.x, center.y); }
    this.route.stroke({ color: 0xb5fff0, alpha: 0.6, width: 2 });
    for (const p of points.slice(1)) { const center = tileCenter(p); this.route.ellipse(center.x, center.y, 4, 2).fill({ color: 0xcaffed, alpha: 0.8 }); }
  }
  setPlayer(position: GridPosition, stride: number, moving: boolean) {
    const feet = tileCenter(position); const a = this.astronaut;
    a.root.position.set(feet.x, feet.y); a.root.zIndex = position.col + position.row + 2.1;
    const swing = moving ? Math.sin(stride * Math.PI * 2) : 0;
    a.leftLeg.rotation = swing * 0.3; a.rightLeg.rotation = -swing * 0.3;
    a.leftArm.rotation = -swing * 0.22; a.rightArm.rotation = swing * 0.22;
    a.body.y = moving ? -(Math.sin(stride * Math.PI * 4) ** 2) * 2 : 0;
    a.shadow.scale.x = moving ? 1 - Math.abs(swing) * 0.08 : 1;
  }
  update(now: number, reduced: boolean): boolean {
    let active = false;
    for (const [key, cell] of this.cells) {
      if (reduced) cell.presence = { from: cell.presence.to, to: cell.presence.to, start: now, duration: 0 };
      const value = presenceAt(cell.presence, now);
      if (!cell.active && value <= 0) {
        cell.ground.destroy({ children: true, context: true }); cell.object?.destroy({ children: true, context: true }); this.cells.delete(key); continue;
      }
      cell.offset = TILE_DROP * (1 - value); cell.ground.y = cell.offset; cell.ground.alpha = value;
      if (cell.object) { cell.object.y = cell.objectY + cell.offset; cell.object.alpha = value * (cell.entity && this.presentation.usedNodeIds?.includes(cell.entity.id) ? 0.5 : 1); }
      active ||= now < cell.presence.start + cell.presence.duration;
    }
    const hovered = this.hovered && this.cells.get(cellKey(this.hovered));
    this.hover.visible = !!hovered?.active; this.hover.y = hovered?.offset ?? 0;
    const t = Math.max(0, Math.min(1, (now - this.celebrationStart) / 760));
    this.celebration.visible = !reduced && t < 1;
    if (this.celebration.visible) {
      this.celebrationRing.scale.set(1 + t * 2); this.celebrationRing.alpha = (1 - t) ** 2;
      for (let i = 0; i < this.sparks.length; i++) { const angle = i / this.sparks.length * Math.PI * 2; this.sparks[i].position.set(Math.cos(angle) * t * 46, Math.sin(angle) * t * 28 - t * 24); this.sparks[i].alpha = 1 - t; this.sparks[i].rotation = t * 2; }
      const cell = [...this.cells.values()].find((c) => c.entity?.id === this.celebratedNode);
      if (cell?.object) cell.object.y -= Math.sin(t * Math.PI) * 7;
    }
    return this.updateSelection(now, reduced) || active || this.celebration.visible;
  }
  pick(point: Point): GridPosition | null {
    for (const entity of this.orderedEntities) {
      const cell = this.cells.get(cellKey(entity.position));
      if (cell?.active && cell.ground.alpha > 0.2 && cell.silhouette && pointInPolygon({ x: point.x, y: point.y - (cell.object ? cell.object.y - cell.objectY : cell.offset) }, cell.silhouette)) return { ...entity.position };
    }
    for (const cell of this.pickCells) if (cell.ground.alpha > 0.2 && pointInPolygon({ x: point.x, y: point.y - cell.offset }, cell.polygon)) return { col: cell.tile.col, row: cell.tile.row };
    return null;
  }
  shiftTime(delta: number) { for (const cell of this.cells.values()) cell.presence.start += delta; this.pulseStart += delta; this.celebrationStart += delta; }
}
export function buildWorldScene(world: WorldMap, player: GridPosition, lunar?: LunarSurfaceAtlas) { return new WorldScene(world, player, lunar); }

export function buildHomeMarker(title = "HOME BASE") {
  const root = new Container();
  root.eventMode = "none";
  const ring = new Graphics().circle(0, 0, 19).fill(title === "HOME BASE" ? 0xfff5dd : 0xdac8f4).stroke({ color: 0xb86a42, width: 1.5 });
  const arrow = new Graphics().poly([11, 0, -1, -9, -1, -3, -11, -3, -11, 3, -1, 3, -1, 9]).fill(0x9a4d31);
  const labelBacking = new Graphics().roundRect(-45, 20, 90, 34, 5).fill({ color: 0x071018, alpha: 0.9 });
  const label = new Text({ text: title, style: { fontFamily: "Arial", fontSize: 10, fontWeight: "bold", fill: 0xf5dfb0 } });
  label.anchor.set(0.5, 0);
  label.y = 24;
  const distance = new Text({ text: "", style: { fontFamily: "Arial", fontSize: 10, fill: 0xb8c6d8 } });
  distance.anchor.set(0.5, 0);
  distance.y = 38;
  root.addChild(ring, arrow, labelBacking, label, distance);
  return { root, arrow, distance };
}

export function drawTileHighlight(graphic: Graphics, world: WorldMap, position: { col: number; row: number } | null, color: number) {
  graphic.clear();
  if (!position) return;
  const entity = world.entities.find((entry) => position.col >= entry.position.col
    && position.col < entry.position.col + entry.footprint.width
    && position.row >= entry.position.row && position.row < entry.position.row + entry.footprint.height);
  const points = footprintPolygon(entity?.position ?? position, entity?.footprint.width ?? 1, entity?.footprint.height ?? 1);
  graphic.poly(flat(points)).fill({ color, alpha: 0.2 }).stroke({ color, alpha: 0.95, width: 2.5 });
}
