import { describe, expect, it } from "vitest";
import { airlockAt, airlockCrossing } from "./airlock";

describe("airlock interlock", () => {
  it("never opens both doors together in either direction", () => {
    for (const direction of ["enter", "exit"] as const) for (let i = 0; i <= 1000; i++) {
      const sample = airlockAt(i / 1000, direction);
      expect(sample.innerOpen * sample.outerOpen).toBe(0);
      expect(sample.innerOpen).toBeGreaterThanOrEqual(0); expect(sample.innerOpen).toBeLessThanOrEqual(1);
      expect(sample.outerOpen).toBeGreaterThanOrEqual(0); expect(sample.outerOpen).toBeLessThanOrEqual(1);
    }
  });
  it("holds the astronaut between closed doors while pressure changes", () => {
    for (const direction of ["enter", "exit"] as const) {
      const a = airlockAt(.4, direction), b = airlockAt(.6, direction);
      expect(a.phase).toBe("pressure"); expect(b.phase).toBe("pressure");
      expect(a.innerOpen + a.outerOpen + b.innerOpen + b.outerOpen).toBe(0);
      expect(a.walk).toBe(.5); expect(b.walk).toBe(.5); expect(a.pressure).not.toBe(b.pressure);
      expect(airlockCrossing(a)).toBe(direction === "enter" ? 1 : 0);
      expect(airlockCrossing(b)).toBe(direction === "enter" ? 1 : 0);
    }
  });
  it("opens the correct door for each crossing and reaches the proper pressure", () => {
    expect(airlockAt(.2, "enter").outerOpen).toBe(1); expect(airlockAt(.8, "enter").innerOpen).toBe(1);
    expect(airlockAt(.2, "exit").innerOpen).toBe(1); expect(airlockAt(.8, "exit").outerOpen).toBe(1);
    expect(airlockAt(1, "enter")).toMatchObject({ phase: "ready", pressure: 1, walk: 1, cycling: false, innerOpen: 1, outerOpen: 0 });
    expect(airlockAt(1, "exit")).toMatchObject({ phase: "outside", pressure: 0, walk: 1, cycling: false, innerOpen: 0, outerOpen: 0 });
  });
});
