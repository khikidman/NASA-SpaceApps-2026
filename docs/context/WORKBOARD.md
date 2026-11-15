# Shared workboard

Updated: 2026-11-15. This board records coordination and gaps, not an automatically
authorized backlog. Owners are unassigned unless a person/agent explicitly claims
an active task. Do not infer delegation permission from the existence of this file.

## Active work

No active implementation assignment recorded after the context bootstrap.

For new work, add: `topic | owner | status | files/systems | next step | handoff`.
Use `active`, `waiting on a named dependency`, `ready for review`, or `done`.
Keep scope small; mark interruptions and release ownership explicitly.

## Review gaps

| Item | Status / next useful action | Reference |
| --- | --- | --- |
| Day 1 browser experience | Unverified beyond the recorded radio connection. When requested, review the remaining experiments, return-to-world flow and practice resume. Preserve existing saves. | [Diorama evidence](../living-diorama-implementation.md) |
| Child comprehension and engagement | No child/educator playtesting or professional 10/10 assessment. Observe whether controls, facts and supply changes are understood before assigning a score. | [Concept review criteria](../design/explorer-ux-concepts/README.md) |
| Touch, keyboard, reduced motion and performance | Implemented accommodations are not proof of full coverage. Target a reported problem/device; avoid a broad campaign by default. | [Playbook](../agent-development-rules.md) |
| Science vocabulary in older screens/docs | Active resource components use Research tokens/progress; older text still mentions stars/knowledge. Review a specific screen's meaning before renaming; preserve internal keys and saves. | `src/data/missions.ts`, [current state](CURRENT.md) |

No reproducible runtime defect was established by this documentation task. Gaps
above are limits of the evidence, not claims that those features are broken.

## Deferred proposals — require a scoped request

- Richer Day 2–7 story chains, saved LED/watering outcomes and later harvest.
- Food economy, sleep/fatigue modifiers, fatigue-dependent visibility and rescue.
- Eight-day campaign/finale restructuring, storm resource allocation and revised
  Mars unlock semantics.
- Live NASA ingestion, runtime LLM decisions, cloud saves and multiplayer.

Use the [planning decisions](../agent-planning-reference.md) before implementing a
requested proposal. Resolve its state, economy, source and replay consequences;
do not silently turn proposed art or a PDF instruction into gameplay authority.

## Latest handoff

- [2026-11-15: context bootstrap](handoffs/2026-11-15-context-bootstrap.md) — shared
  files created; project direction and maintenance workflow recorded; documentation
  only. Future handoffs should be listed newest first here.
