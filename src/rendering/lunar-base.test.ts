import { describe, expect, it } from "vitest";
import { createLunarBasePrefab, LUNAR_BASE_PREFAB } from "../world/base-prefab";
import { BASE_BANK_ART } from "../assets/asset-bank";
import { getLabSprite } from "../assets/lab-catalog";

describe("modular lunar base", () => {
  it("assembles promoted bank assets into nine independent 1×1 volumes", () => {
    const parts = createLunarBasePrefab({ col: 12, row: 12 });
    expect(parts).toHaveLength(9); expect(new Set(LUNAR_BASE_PREFAB.flat()).size).toBe(8);
    for (const id of Object.values(BASE_BANK_ART)) expect(getLabSprite(id)).toBeDefined();
    expect(new Set(parts.map((part) => part.id)).size).toBe(9);
    for (const part of parts) expect(part.footprint).toEqual({ width: 1, height: 1 });
    expect(parts.find((part) => part.id === "hab-01")).toMatchObject({ position: { col: 12, row: 12 }, prefab: { module: "airlock" } });
  });
});
