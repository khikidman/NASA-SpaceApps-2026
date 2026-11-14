# Learning journey architecture

## Authority and boundaries

`src/game/engine.ts` is a synchronous, immutable action boundary. It has no browser, network, clock, or React dependency. Movement, adjacency, supply collection, task answers, time, knowledge, night decisions, survival, and travel are validated here. `src/data` contains trusted authored content; external datasets would need validation before entering this boundary.

React owns transient selection, routes, panels, and hints. `use-mission` owns the single authoritative game state. `use-explorer` emits movement intentions; it no longer persists an independent player position. The renderer sees read-only spatial snapshots and presentation flags, and cannot grant supplies or unlock worlds.

Both worlds use `MissionConfig`, the same map generator, and the same action rules. World-specific task/fact/event content and terrain colors are data or presentation differences. The public static content API is not called on the gameplay path.

## Daily loop

1. Begin Moon day 1 with six spendable stars and 16 work hours. Starting stars do not count as earned knowledge.
2. Move one walkable square at a time, without charging work hours.
3. Collect adjacent supply nodes once per day. Positive supplies are capped; costs must be affordable before rewards.
4. Complete adjacent two-step challenges. Pick, pack, and order answers are validated by IDs. Duplicate/unknown items, overweight bags, and wrong sequences are rejected without spending supplies. Each accepted step pays a predetermined cost and earns knowledge.
5. Unlock bedtime after six earned stars and at least one complete challenge. A limited daily learning card helps beginners; it cannot replace the challenge goal.
6. Choose a conditional night plan. Report costs two stars, decision costs one, reflection rewards two. Apply plan effects/caps, then fictional shield impact, then event effects and daily upkeep. The UI previews the complete change.
7. Resolve survival before completion: zero air, water, or power ends the trip. Otherwise reset daily tasks, nodes, and hours, or finish the seventh day.
8. Moon day 7 unlocks explicit travel. Travel refills physical supply tanks to capacity, keeps the bank/total score/book/history, and resets local daily progress. Mars day 7 completes the journey.

Total knowledge earned counts gross rewards and never decreases from spending. The spendable science balance can decrease. Day knowledge and completed challenge gates are separate from the bank. Discovery cards persist across both worlds.

Conditional event priority is low water, low power, world/day events, Sun alert when shielding is low, then a quiet evening. No lunar dust storms or Martian moonquakes are generated. These are authored conditions, not live observations or forecasts.

## Saves and replay

The new `space-explorer:journey:v2` save records seed, format/ruleset/dataset versions, and accepted typed actions. Restore begins on the Moon and replays every validated action. Resource totals, positions, unlock flags, and scores supplied alongside the log are ignored. Invalid sequences, incompatible versions, payloads over 1 MB, and histories over 10,000 actions are rejected visibly.

Old prototype keys remain untouched. Browser storage failures leave play available with a notice. Camera, routes, panels, wrong answers, and hints are transient. Reload closes panels but restores accepted subtask progress.

Replay validation is not competitive anti-cheat. Hosted scores/cloud saves would require an authoritative service and durable storage. Any content or balance change affecting replay must bump compatibility versions.

## Content and testing

NASA links support educational topics. Numerical costs, packing weights, safe-trip sequences, shelter points, crew-day durations, and weather schedules are fictional teaching rules. No credentials or external calls are needed. Keep any future live data ingestion outside the turn path with provenance, dates, validated schemas, and documented conversions.

Unit tests exercise legal paths and actions through both full worlds, each minigame type, gates, knowledge/time costs, no repeated rewards, conditional events, replay, caps, final-day survival, spatial culling, picking, camera math, and home guidance. Browser checks cover WebGL, actual controls/dialogs, collection, task feedback, persistence, responsive layouts, and world transitions.

This remains a local educational prototype. Child/educator playtesting and target-device performance measurement remain necessary. Construction, cloud saves, multiplayer, arbitrary 3D physics, and live NASA ingestion are not implemented.
