# Accepted decisions

Curated 2026-11-15 from the user's requests, current code and linked feature records.
These summaries preserve existing choices; this documentation task makes no new
gameplay decision. Add a dated entry when an authorized choice changes. Older
planning alternatives remain in the [planning log](../agent-planning-reference.md).

| ID | Decision / origin | Scope and reference |
| --- | --- | --- |
| D01 | Seven Moon days, then Mars, both playable. User's world structure; retained by Day 1 integration. | An eight-day storm finale/Mars-unlock-only plan is still a proposal. [Day 1 contract](../day-1-implementation.md). |
| D02 | One authoritative deterministic engine; UI and motion cannot award supplies. Existing architecture. | `src/game/engine.ts`, `tutorial.ts`; [playbook](../agent-development-rules.md). |
| D03 | Rounded radius 5, fully opaque center radius 4; each tile drops/fades independently and hidden shared sides are removed. User's world refinements. | `src/world/visibility.ts`, `src/rendering/tile-faces.ts`. Automatic fatigue adaptation was explicitly deferred. |
| D04 | Base uses nine independent 1×1 modules in a 3×3 footprint, southwest doorway, full-tile airlock and 5×5 interior. User's modularity/entrance requests. | Preserve per-tile anchors, full volume, shared camera, radial tile fades and exact handoffs. Do not restore the shrinking transition. |
| D05 | Match the softly faceted ivory/charcoal/gold/navy bank; scale the shared astronaut against the airlock opening. User's art direction. | `src/assets/asset-bank.ts`, `src/assets/characters/astronaut-settings.ts`; [asset protocol](../../asset-lab/PROTOCOL.md). |
| D06 | Implement five ordered Day 1 missions and an exercise-or-skip choice within the current campaign. User authorized Day 1. | Energy and deterministic outdoor Air costs were integrated; Food, crop dependencies, rescue and real-time drain were deferred. [Contract](../day-1-implementation.md). |
| D07 | Standard keeps original terms; Boost spends extra Power to save Energy/time. Prior refinement implementation. | One `workshopTerms` calculation feeds preview/commit; free drafts never spend resources. `src/data/day-one-workshop.ts`. |
| D08 | Lead with A: Living Diorama, simplified UI and creative graphical interaction. User's explicit selection, 2026-11-15. | Active controllers are `diorama-games.tsx`. Earlier recommendation to lead with B is historical. [Contract](../living-diorama-implementation.md). |
| D09 | Learning facts are high visual priority. User's clarification, 2026-11-15. | Supersedes optional-only learning guidance. Show a short sourced takeaway prominently; keep deeper explanation/citations expandable. |
| D10 | Use visible resource names, current→after amounts and separate signed costs/gains. Separate spendable tokens from permanent progress. User's clarity request and selected implementation. | `resource-meter.tsx`, `resource-effects.tsx`, `diorama-forecast.tsx`. Do not create two spendable science currencies. Some older copy still says stars. |
| D11 | New melter results include model sample checking; older accepted revision-2 proofs without the optional `checked` field remain compatible. Diorama integration compatibility decision. | `src/game/types.ts`, `src/data/day-one-workshop.ts`. `checked:false` rejects; omission supports old replay. No claim of real potability. |
| D12 | Use focused verification and let the user report gameplay issues. Explicit user preference: “stop running complex checks; I will tell you what's wrong.” | No default full check chain, repeated builds, browser campaigns or save resets. Documentation requires document/link review only. Never call an internal grade child testing or a certified 10/10. |

## Entry format for future changes

```text
ID / date / status (accepted or superseded):
Origin (user request, reviewed implementation, or linked decision):
Decision and scope:
Supersedes / related unresolved planning row:
Code / contract / source references:
Save, asset, or later-day consequences:
Evidence and remaining uncertainty:
```

If a new user instruction supersedes an entry, link the replacement. If code and
the stated decision disagree, record the discrepancy on the workboard; do not
silently treat the discrepancy as permission to change gameplay.
