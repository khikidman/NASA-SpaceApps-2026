import { describe, expect, it } from "vitest";
import { applyAction, createGame } from "./engine";
import { restoreGame, serializeGame } from "./save";
import { playDay } from "./test-helpers";
describe("journey replay saves", () => {
  it("restores position, collection, subtasks, scores, days, and future behavior", () => {
    let game = createGame(42); game = playDay(game);
    const restored = restoreGame(serializeGame(game));
    expect(restored).toEqual(game); expect(playDay(restored)).toEqual(playDay(game));
  });
  it("restores a complete Moon-to-Mars journey and its discovery book", () => {
    let game = createGame(5);
    for (let i = 0; i < 7; i++) game = playDay(game);
    expect(restoreGame(serializeGame(game))).toEqual(game);
    game = applyAction(game, { type: "travel" });
    for (let i = 0; i < 7; i++) game = playDay(game);
    expect(restoreGame(serializeGame(game))).toEqual(game);
  });
  it("rejects malformed, incompatible, oversized, and illegal action histories", () => {
    const valid = JSON.parse(serializeGame(createGame(1)));
    for (const raw of ["null", "oops", "[]", "x".repeat(1000001), ...[
      { version: 99 }, { rulesetVersion: 1 }, { datasetVersion: "old" }, { seed: -1 }, { actions: [null] },
      { actions: [{ type: "travel" }] }, { actions: [{ type: "unknown" }] },
      { actions: [{ type: "move", position: { col: 0, row: 0 } }] },
      { actions: Array(10001).fill({ type: "learn" }) },
    ].map((patch) => JSON.stringify({ ...valid, ...patch }))]) expect(() => restoreGame(raw)).toThrow();
  });
  it("ignores forged supplies, location, and unlock flags", () => {
    const game = createGame(5);
    const payload = { ...JSON.parse(serializeGame(game)), resources: { science: 99999 }, missionId: "mars", status: "won", position: { col: 1, row: 1 } };
    expect(restoreGame(JSON.stringify(payload))).toEqual(game);
  });
});
