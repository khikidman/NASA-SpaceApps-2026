import { describe, expect, it } from "vitest";
import { createLunarBasePrefab, LUNAR_BASE_PREFAB } from "../world/base-prefab";
import registrations from "../assets/buildings/lunar-base-modules.json";

describe("modular lunar base", () => {
  it("assembles six reusable assets into nine independent 1×1 volumes", () => {
    const parts = createLunarBasePrefab({ col: 12, row: 12 });
    expect(parts).toHaveLength(9); expect(Object.keys(registrations)).toHaveLength(6);
    expect(new Set(LUNAR_BASE_PREFAB.flat()).size).toBe(6);
    expect(new Set(parts.map((part) => part.id)).size).toBe(9);
    for (const part of parts) expect(part.footprint).toEqual({ width: 1, height: 1 });
    expect(parts.find((part) => part.id === "hab-01")).toMatchObject({ position: { col: 12, row: 12 }, prefab: { module: "airlock" } });
  });
});
