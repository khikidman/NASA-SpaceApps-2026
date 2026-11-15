# Game development playbook for LLMs and agents

Status: project development rules, not a gameplay implementation.
Audience: agents, developers, artists, and reviewers working on the same game.
Entry point: [AGENTS.md](../AGENTS.md). Planning evidence and unresolved decisions:
[planning reference](agent-planning-reference.md).
Reusable assignment: [agent task brief](agent-task-template.md).

## 1. The experience to build

Create an inviting science adventure for ages 7–12. A child explores a small part
of a larger world, helps the base, experiments with equipment, prepares for events,
and learns through the consequences of their choices. Keep the world itself the
main interface.

Use this interaction loop:

**Notice → approach → try → choose → commit → see the result → carry it forward.**

- Notice: an animated object, waypoint, meter, or small rover cue communicates a need.
- Approach: the player can reach and identify the correct interaction point.
- Try: one demonstrated physical action teaches the control without a paragraph.
- Choose: the player sees what they gain, spend, or give up.
- Commit: the engine validates the action once.
- Result: the object changes, the meters move, and the learning becomes visible.
- Carry forward: repairs, samples, crops, and reserves affect later opportunities.

An added feature should improve at least one of exploration, experimentation,
planning, feedback, or discovery. More buttons, resources, and content are not
automatically richer gameplay.

## 2. Establish scope before changing systems

The research PDFs describe a proposed expanded Moon campaign. They are not an
executable backlog and do not override the active request. The current game has
seven-day Moon and Mars levels, pick/pack/order tasks, and a working shared engine.
Day 1 now has five ordered hands-on missions, Energy, an exercise/skip routine, and
a configured per-step outdoor Air cost; see `docs/day-1-implementation.md`. The
eight-day storm campaign, Food, continuous-time outside drain, crop simulation,
and rescue system remain proposals. See the decision log before implementing them.

For a substantial mechanic, create a brief feature contract in the task notes or
the relevant feature document. Scale this to the work; do not write a full design
document for a texture swap.

```text
Feature / scope:
Status: proposed | prototype | integrated | retired
Player goal and physical action:
Learning goal and fact IDs / source status:
World, day, node, prerequisites, and unlocks:
Meaningful alternatives and their opportunity costs:
Requirements / costs / rewards / logical time:
Authoritative state fields read and written:
Later systems that consume the outcome:
Input methods, cancellation, hints, retry, and failure:
Required art, anchors, poses, motion, and sound alternatives:
Save/replay compatibility impact:
Smallest complete slice and evidence needed:
Assumptions, fictional tuning, and unresolved decisions:
```

Numbers must be classified as existing implemented values, proposed source-plan
values, or explicitly fictional tuning. Unknown scientific values remain unknown.
Keep `[TUNE: ...]` and `[FACT_NEEDED: ...]` markers in development records, not in
children's task labels. Hide unfinished content or use a short neutral explanation.

## 3. Agent workflow and ownership

1. Read the current implementation and the relevant plan pages. State the smallest
   authorized change and identify existing behavior it must preserve.
2. Trace the whole path: content → action → state → world interaction → UI → art →
   save. A disconnected widget or a registered PNG alone is not an integrated feature.
3. Implement one playable slice with a real start, action, result, and return to play.
4. Reuse the slice as a shared primitive before adding more days or cosmetic variants.
5. Review the appropriate evidence and update the status/decision notes honestly.
6. Hand back a concrete result, not an offer to implement it later.

Preserve unrelated changes. Avoid unsolicited dependencies, renderer migrations,
renamed resource systems, replacement HUDs, or parallel save stores. Resolve normal
implementation choices without new confirmation steps. If an unresolved campaign
decision blocks only part of a task, finish the independent work first.

Do not delegate unless the user or applicable instructions request delegation.
When multiple agents are authorized, assign bounded files or features, share one
feature contract and source vocabulary, and appoint one integrator for shared
state, content IDs, and save versions. Handoffs must list changed files, assumptions,
asset revisions, integration points, and actual verification. No agent may silently
replace another agent's art contract, thresholds, or state schema.

Use LLMs for drafting, code assistance, research triage, asset briefs, and review.
Generated suggestions enter the same review path as other authored material.
Do not add model calls to the gameplay path or ask a model to grade answers,
invent learning facts, choose resource outcomes, or repair player saves at runtime.

## 4. One authoritative game

| Responsibility | Existing home | Rule |
| --- | --- | --- |
| Accepted actions, resources, progression, survival | `src/game/engine.ts`, `types.ts` | Pure, immutable, deterministic transitions |
| Replay and compatibility | `src/game/save.ts`, ruleset/dataset versions | Restore accepted actions; never trust client totals |
| World content, tasks, events, sources | `src/data/` | Stable IDs and shared typed definitions |
| Tile geometry, paths, collision, visibility | `src/world/` | One shared spatial contract |
| Scene, sprites, camera, animation | `src/rendering/` | Render state; emit intentions; no resource authority |
| HUD, dialogs, minigame interaction | `src/features/`, `src/components/` | Transient input and presentation only |
| Experiments and art provenance | `asset-lab/`, `src/assets/` | Promote deliberately and bind explicitly |

Extend these boundaries as needed. A planned `GAME_CONFIG.js` means centralized
configuration; it does not justify creating a second JavaScript configuration
system alongside the current TypeScript data.

For every accepted subtask, use this sequence:

1. Validate world, day, location, prerequisites, input, and completion status.
2. Check requirements and affordability before awarding anything.
3. Compute cost, elapsed logical time, result, reward, caps, and applicable modifiers.
4. Apply them atomically and record the accepted outcome.
5. Update presentation from the result; animate the confirmed changes.

Previews and commits must call the same calculation. Show the actual capped gain,
not a nominal reward that a nearly full tank cannot receive. List meaningful costs
and rewards separately when their net value would hide the choice.

An unlock threshold is not automatically a currency deduction. Spendable science,
total knowledge earned, day knowledge, and completion gates stay distinct. Define
which quantity a proposed gate reads before implementing it. Failed practice,
wrong answers, cancellation, and retries do not spend resources unless a clearly
requested and previewed rule says otherwise.

Longer minigames may need checkpoints. In that case, each paid checkpoint is an
engine action with its own committed state, not a charge inside a pointer handler.
Never reward the same checkpoint again after remount, retry, animation completion,
rapid input, or reload.

Use the seeded random source only where a design explicitly calls for randomness.
Harvests derived from earlier choices, forecasts, thresholds, and task validation
are deterministic. No `Math.random()`, wall clock, GPU timing, or LLM output inside
the authoritative rule path.

## 5. A fair economy and recoverable progression

Maintain a per-day ledger: starting reserves, reachable rewards, mandatory costs,
travel and return costs, routine costs, knowledge gates, and optional opportunities.
Calculate it from the same configuration the game uses. Do not trust the draft
PDF's printed time buffers without recalculating them.

- Provide at least one reachable baseline route through each mandatory chain.
- Leave room for learning, a retry, and returning home; do not budget only a perfect run.
- Ensure no prerequisite consumes the only resource needed to earn that prerequisite.
- Provide a meaningful reason to choose between research now and reserves later.
- Avoid a universally dominant choice, infinite repeatable rewards, and compulsory busywork.
- Explain why an action is unavailable and point to a reachable way to resolve it.
- A low-energy modifier must not make the knowledge needed for recovery unreachable.

Optional preparation and failure are compatible: a player may reach the finale
underprepared and lose with a helpful recap. Being unable to advance, retry, or
recover because of a circular gate is a soft lock and is not acceptable.

If time-based survival is authorized, represent it with one logical clock and a
declared resolution. Account for outside exposure, travel, uploads, day changes,
and saves on that clock. Browser frame rate, pointer event frequency, hidden-tab
time, and an animation's duration must not alter the cost of an identical action.
The present game does not charge walking time; adding that is a ruleset change.

Future crop progression must store the accepted LED choice, planter state, watering
result, and harvest status centrally. Day 6 reads those results; it does not reroll
them. Missing results require an explicit migration/recovery decision, not a
convenient silent default. The same rule applies to repairs and radiation-log rewards.

## 6. Minigames that feel like doing science

The current engine supports `pick`, `pack`, and `order`. Richer continuous
interactions are planned extensions, not an already implemented minigame registry.
Build reusable interaction primitives and declarative task definitions when needed;
do not make a separate engine for each day.

A minigame should contain:

- One clear active verb, a small visible goal, and an optional animated example.
- A safe first attempt or practice interaction before a paid commitment.
- A perceptible response to input: dust clears, a wire connects, a gauge settles.
- A decision or skill that matters to the task, with a reason beyond filling a timer.
- A short completion beat and one visible consequence in the world or resources.
- Retry, hint, cancellation, keyboard/touch operation, and reduced-motion behavior.

Use these families when their day is authorized:

| Family | Physical interaction | Decision / learning | Durable result |
| --- | --- | --- | --- |
| Repairs | Match wire shapes, fit panels, tune a dial | Restore a function with a visible repair cost | Device repaired; calls or task unlocked |
| Seismometer | Place the detector, hold calibration in a target band | Careful setup produces a reading | Detector installed; reading accepted |
| Solar cleaning | Sweep a brush over dusty regions | Spend effort to recover power | Cleaned coverage and one accepted recovery |
| Ice and samples | Drill/collect, mark, photograph, bag, analyze | Plan the trip and complete the relevant sequence | Inventory/sample identity; science after analysis |
| Plant station | Place tray, seed medium, light, and watering control | Trade power and water against configured later output | LED and per-planter outcomes |
| Exercise | Guided hold or forgiving timing action | Use routine time to manage readiness | Completed/skipped routine state |
| Weather toybox | Place gadgets and compare their responses | Observe differences between environments | Experiment recorded, with source-limited explanation |
| Meal assembly | Sort or assemble food groups on a tray | Make a balanced meal from available options | Accepted meal outcome and configured modifier |
| Rest and preparation | Dim lights, review the clock, fill readiness gaps | Trade working time against tomorrow's condition | Sleep duration, reserves, next-day effects |
| Storm management | Observe reserves and choose allocation intervals | Balance survival needs and optional comfort | Deterministic consumption, win/loss recap |

These are design mappings, not permission to implement all of them at once.

Do not require rapid clicking or perfect reflexes. Provide a hold/toggle alternative
to repeated input, forgiving target bands, adjustable pacing when relevant, and a
non-audio equivalent to listening tasks. Keep challenge difficulty separate from
motor demands. Real-time waiting must not substitute for an interesting choice;
brief visuals can represent long fictional work without forcing a child to wait.

## 7. Scientific content and uncertainty

Every learning statement needs a source ID and context. Use the numbered Fact
Bank as planning provenance, not proof that a statement has been independently
verified. Its image table is on Research-2 PDF page 6; the per-day permitted IDs
are in the planning reference.

Separate three layers in content records:

| Layer | Example | Treatment |
| --- | --- | --- |
| Scientific claim | A sourced explanation of an instrument or environment | Verify against an appropriate primary source and retain its context |
| Game simplification | A green shelter indicator inside a cave | Label as a teaching simplification; do not promise real safety |
| Fictional tuning | Water cost, resource cap, storm waves, harvest bonus | Clearly authored configuration; never attribute the number to NASA |

Do not extrapolate an ISS plant result into a universal Moon-growing rule. Do not
claim that a spectrum, lunar soil, crop, cave, or shield behaves a particular way
without evidence that actually supports that conclusion. Avoid absolute statements
such as all moonquakes having one cause, lunar soil never supporting plants, or
green meters proving a place is radiation-safe.

Keep unverified DONKI descriptions, OSD-766 outcomes, radiation multipliers,
temperature measurements, lunar-cave shielding, space-specific diet claims, and
sample-container history marked for review. Do not invent data access or live
NASA conditions. Future source ingestion stays outside the turn path and requires
provenance, dates, units, and a documented conversion to fictional game values.

Production copy uses a short neutral line when a claim is pending. Explanations,
study limitations, and source links belong in the discovery book or optional help.
Do not display development markers as if they were a lesson.

## 8. One visual world and a traceable asset pipeline

Use the promoted lunar bank and astronaut as the current visual reference:
orthographic 2:1 isometric camera; softly faceted, substantial volumes; ivory
surfaces; charcoal equipment; gold accents; navy glass; consistent lighting and
scale. Moon and Mars may differ in terrain and atmosphere treatment without
becoming different illustration styles.

Before generating art, search the catalog. Asset briefs must specify the role,
logical footprint, camera, material palette, light direction, ground/foot anchor,
transparent padding, dimensions, states, and animation requirements. A reference
image is not an instruction to reproduce a whole building for a single component.

The current spatial contract is 96×48 ground diamonds, a 3×3 home prefab made of
independent 1×1 members, and doorway-relative character scale. Each object follows
its own tile's animated offset and opacity. Full-volume sprites mount directly
to the ground; roof props need a real supporting hull. No shared dropping anchor,
nonuniform scale, shear transform, or double-drawn body.

Preserve actual exposed terrain faces as neighboring tiles move. Culling must not
make an off-screen neighbor stop occluding. New sprites need matching pick and
culling bounds, including tall props. Hidden or departing ground cannot be picked.

Asset experiments follow [the lab protocol](../asset-lab/PROTOCOL.md): retain
source art and prompts, save immutable revisions, validate packages, promote,
bind explicitly, and record rollback information. Never hand-edit a checksummed
package. A source rebase creates a child revision and preserves its parent.

Animated characters need stable direction ordering, consistent proportions,
transparent gutters, one shared reference scale, foot anchors, and named states.
Do not normalize each frame's size independently or use unrelated astronaut
designs for indoor, outdoor, and crossing views. An asset file, catalog entry,
collision footprint, interaction point, and game-state outcome are different things.

## 9. Motion that explains and rewards

Motion has a job: confirm selection, show travel, reveal a tile, connect a repair,
communicate a transfer, or help the player follow a change. Avoid perpetual motion
that competes with the current decision.

- Use the current smooth camera and shared animation clock. Do not update React
  state every frame or introduce a timer per tile, prop, or resource counter.
- Retarget from the displayed value. Reversing a route or fade must not jump back
  to an old start value, recreate overlapping tiles, or snap the camera to a tile.
- Register feet and door endpoints exactly. Coordinate animation frames with
  movement progress; do not let a sprite's transparent padding shift the actor.
- Keep the world-to-interior transition as stationary, sequential radial fades.
  Maintain one visible astronaut and the shared camera; do not shrink the terrain.
- Animate confirmed resource changes with their true amounts. Cosmetic counters
  cannot be the source of truth or award a reward at animation completion.
- Pause presentation when hidden. Reduced motion settles or simplifies animation
  while preserving feedback, controls, and the exact resulting state.
- Do not lock input for cosmetic celebration. A deliberate airlock cycle or task
  commitment may hold conflicting input, with a clear visible status and safe cancellation.

Reuse cached textures, retained cells, and current culling. Run a frame loop only
while something needs animation. Performance targets are design targets until
measured on a stated device; do not claim smoothness from a successful build.

## 10. Low-reading, intuitive, accessible UI

Keep resource bars top-left, mission goals bottom-center, and context actions near
the active task. Preserve room for the world and the player's next reachable tile.
Introduce one HUD concept at a time during a tutorial; do not open a wall of text.

Default copy budget, as a project design target:

- Task title: two to five familiar words.
- Active prompt: one short action sentence, preferably twelve words or fewer.
- Button: a clear verb or verb/object pair, not an abstract system name.
- Immediate result: a meter/object change plus a brief optional sentence.
- Background science: optional book/help content, with sources available there.

Use one player-facing vocabulary. Internal `oxygen` can be “Air”; `science` can be
“Science stars,” but do not make one balance look like separate currencies. Explain
earned knowledge versus spendable stars visually wherever that distinction matters.

Use signed numbers, shapes, progress, and placement alongside color. Large tap
targets should aim for at least 44 CSS pixels as a project layout target. Pair drag
with tap-to-select/place and keyboard operation; pair hold with a usable toggle
when needed. Preserve visible focus, dialog focus handling, labels for assistive
technology, and layouts that do not hide the goal behind the HUD.

Warnings should name the problem and the next action. Failure should explain the
decisive resource change and offer a kind retry/review route. Avoid shame, surprise
costs, illegible flashing alarms, and repeated modal interruptions. A planned HUD
toggle must not remove essential navigation, emergency feedback, or input access.

## 11. Integration evidence and handoff

Use the smallest evidence needed for the actual change. The user has asked to
avoid complex checking by default. Documentation needs link/content review, not
a game build. Art binding may need package validation and one necessary compile.
Changed authoritative logic may need a focused test of the changed invariant.
Do not automatically run the full check chain, browser automation, or repeated
builds. Stop broadening checks when the relevant question is answered.

Before calling a feature integrated, establish the relevant facts:

- The intended node or context can start it, and it returns to the game cleanly.
- Preview, commit, rewards, and persisted outcomes agree.
- Retry/cancel/resume and later-day consumers have defined behavior.
- Graphics, anchors, movement, and context UI follow the shared contracts.
- Sources and fictional numbers are labeled correctly.
- Any changed replay behavior has an explicit compatibility strategy.

Mark what is inferred from code, compiled, manually observed, or still unverified.
Do not describe a prototype or visual effect as implemented survival logic.
Child/educator playtesting is the evidence for comprehension and enjoyment; do
not claim it without actual observation.

For a handoff, report the result, relevant files or preview, changed existing
systems, assumptions/decisions, and the evidence actually obtained. Link the
feature record and asset/source provenance when useful. Keep the conversation
concise; keep the durable details in the repository.
