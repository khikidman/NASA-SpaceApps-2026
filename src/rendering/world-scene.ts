import { Container, Graphics, Text } from "pixi.js";
import { compareEntityDepth, footprintPolygon, gridToWorld, tileCenter } from "../world/isometric";
import type { FacilityKind, GridPosition, Point, WorldEntity, WorldMap } from "../world/types";
import { cellKey, inRenderRange, visibleTiles } from "../world/visibility";

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

export function buildWorldScene(world: WorldMap, player: GridPosition) {
  const root = new Container();
  root.eventMode = "none";
  const ground = new Graphics();
  const grid = new Graphics();
  const hover = new Graphics();
  const selection = new Graphics();
  const objects = new Container();
  objects.sortableChildren = true;
  const lights: { kind: FacilityKind; graphic: Graphics }[] = [];

  const tiles = visibleTiles(world, player);
  const keys = new Set(tiles.map(cellKey));
  // Build only nearby geometry. Exposed tile edges give the flat grid volume.
  for (const tile of [...tiles].sort((a, b) => a.col + a.row - b.col - b.row)) {
    const corners = footprintPolygon(tile);
    if (!keys.has(cellKey({ col: tile.col, row: tile.row + 1 }))) {
      const [a, b] = [corners[3], corners[2]];
      ground.poly(flat([a, b, { x: b.x, y: b.y + 14 }, { x: a.x, y: a.y + 14 }])).fill(0x946548);
    }
    if (!keys.has(cellKey({ col: tile.col + 1, row: tile.row }))) {
      const [a, b] = [corners[2], corners[1]];
      ground.poly(flat([a, b, { x: b.x, y: b.y + 14 }, { x: a.x, y: a.y + 14 }])).fill(0xaa7451);
    }
    const color = tile.terrain === "path" ? 0xdfb78b : tile.terrain === "pad" ? 0xbba58b
      : tile.terrain === "rock" ? 0xb47b58 : SAND[tile.variant];
    ground.poly(flat(footprintPolygon(tile))).fill(color);
    grid.poly(flat(footprintPolygon(tile))).stroke({ color: 0x76573e, alpha: 0.28, width: 1 });
    if (tile.terrain === "sand" && tile.variant === 0) {
      const center = tileCenter(tile);
      ground.ellipse(center.x + 9, center.y + 4, 6, 2).fill({ color: 0xa66949, alpha: 0.35 });
    }
    if (tile.terrain === "rock") {
      const rock = new Graphics();
      prism(rock, 0.48, 0.48, 8 + tile.variant * 2, [0xb79b80, 0x826954, 0x9c7c60]);
      const point = gridToWorld({ col: tile.col + 0.26, row: tile.row + 0.26 });
      rock.position.set(point.x, point.y);
      rock.zIndex = tile.col + tile.row + 2;
      objects.addChild(rock);
    }
  }
  const entities = world.entities.filter((entity) => inRenderRange(entity.position, player)).sort(compareEntityDepth);
  for (const entity of entities) {
    const group = new Container();
    const point = gridToWorld(entity.position);
    group.position.set(point.x, point.y);
    group.zIndex = entity.position.col + entity.position.row + entity.footprint.width + entity.footprint.height;
    const { graphic, light } = facility(entity);
    group.addChild(graphic, light);
    lights.push({ kind: entity.kind, graphic: light });
    objects.addChild(group);
  }

  const astronaut = new Graphics();
  astronaut.ellipse(0, 1, 13, 6).fill({ color: 0x3f4540, alpha: 0.25 });
  astronaut.ellipse(0, 0, 16, 8).stroke({ color: 0xdef4e7, alpha: 0.9, width: 2 });
  astronaut.roundRect(-8, -15, 6, 16, 2).roundRect(2, -15, 6, 16, 2).fill(0x3d5556);
  astronaut.roundRect(-14, -32, 9, 21, 3).fill(0xb8b5a1);
  astronaut.roundRect(-10, -34, 20, 23, 6).fill(0xeee8d6).stroke({ color: 0xa3aaa1, width: 1 });
  astronaut.circle(0, -44, 12).fill(0xf3eedb).stroke({ color: 0xa3aaa1, width: 1 });
  astronaut.roundRect(-8, -49, 16, 11, 5).fill(0x36596a);
  astronaut.moveTo(-4, -46).lineTo(3, -46).stroke({ color: 0xaccbca, width: 2 });
  astronaut.roundRect(-6, -29, 12, 5, 2).fill(0xc06d4c);
  const feet = tileCenter(player);
  astronaut.position.set(feet.x, feet.y);
  astronaut.zIndex = player.col + player.row + 2.1;
  objects.addChild(astronaut);
  root.addChild(ground, grid, hover, selection, objects);
  return { root, grid, hover, selection, lights, tileKeys: [...keys], entityIds: entities.map((entity) => entity.id) };
}

export function buildHomeMarker() {
  const root = new Container();
  root.eventMode = "none";
  const ring = new Graphics().circle(0, 0, 19).fill(0xfff5dd).stroke({ color: 0xb86a42, width: 1.5 });
  const arrow = new Graphics().poly([11, 0, -1, -9, -1, -3, -11, -3, -11, 3, -1, 3, -1, 9]).fill(0x9a4d31);
  const label = new Text({ text: "HOME BASE", style: { fontFamily: "Arial", fontSize: 10, fontWeight: "bold", fill: 0x704d35 } });
  label.anchor.set(0.5, 0);
  label.y = 24;
  const distance = new Text({ text: "", style: { fontFamily: "Arial", fontSize: 10, fill: 0x704d35 } });
  distance.anchor.set(0.5, 0);
  distance.y = 38;
  root.addChild(ring, arrow, label, distance);
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
