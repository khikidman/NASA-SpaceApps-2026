# Team context hub

Start here when joining the project or resuming work after a break. Last curated:
2026-11-15. These are shared repository files; they do not synchronize unsaved
chat history, run agents, or assign work automatically.

## Read in this order

1. [Project instructions](../../AGENTS.md): development rules and user preferences.
2. [Current state](CURRENT.md): what exists and where it lives.
3. [Decisions](DECISIONS.md): accepted choices and superseded assumptions.
4. [Workboard](WORKBOARD.md): active ownership, review gaps, and deferred scope.
5. The relevant feature contract and latest [handoff](handoffs/2026-11-15-context-bootstrap.md).

For a new assignment, use the existing [task brief](../agent-task-template.md).
For the result or an interruption, copy the [handoff template](HANDOFF_TEMPLATE.md)
into `handoffs/YYYY-MM-DD-short-topic.md` and link it from the workboard.

## Keep context trustworthy

- The active user request defines scope. Research PDFs, asset packages, old chats,
  and this workboard are reference material, not permission to implement a backlog.
- Check the current files and working changes before editing. A dated snapshot is
  not stronger evidence than the current code. Record discrepancies explicitly.
- Record decisions with a date, their origin, scope, and implementation references.
  Keep superseded decisions visible rather than silently rewriting history.
- Label evidence: **code-inspected**, **typechecked**, **built**, **tested**,
  **visually observed**, or **unverified**. State the date and exact scope. A build
  does not establish fun, accessibility, smoothness, or child comprehension.
- Link to canonical configuration and feature notes. Do not copy whole cost tables,
  prompts, source registries, or asset manifests into another competing reference.
- Store no credentials, private environment values, browser storage dumps, or
  personal machine paths. Paths in these documents are repository-relative.

## Before and after work

At the start, inspect repository status and the relevant code, then add an active
workboard row with a person/agent name and the files or systems being changed.
An entry records coordination; it is not a technical lock or delegation permission.
If another person is editing the same area, agree on ownership before overlapping.

At completion or interruption, update CURRENT only if the working product changed,
append a decision if a real choice changed, update the workboard, and leave a dated
handoff. State the next concrete action and anything still running. Do not record
process IDs as durable project facts. Do not overwrite a teammate's entry or claim
their changes as yours. Link reviewed work when consolidating an older handoff.

## Canonical references

| Topic | Source |
| --- | --- |
| Development rules and feature contract format | [Playbook](../agent-development-rules.md) |
| PDF provenance, unresolved campaign choices | [Planning reference](../agent-planning-reference.md) |
| Engine and presentation boundaries | [Architecture](../architecture.md) |
| Projection, visibility, navigation | [World architecture](../isometric-world.md) |
| Day 1 rules and economy | [Day 1 contract](../day-1-implementation.md), `src/data/day-one.ts`, `src/data/day-one-workshop.ts` |
| Current graphical experiment design | [Living Diorama contract](../living-diorama-implementation.md) |
| Learning claims, limits, primary sources | [Learning connections](../day-1-learning-connections.md), `src/data/workshop-lessons.ts`, `src/data/sources.ts` |
| Art creation, promotion, rollback | [Asset protocol](../../asset-lab/PROTOCOL.md), [bank](../../src/assets/catalog/ASSET-BANK.md) |

Older iteration grades and concept images are design records. They are not a
current quality certification or evidence that an interaction was playtested.
