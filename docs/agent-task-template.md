# Reusable game-integration task brief

Copy the brief below into a development task and replace the bracketed fields.
The brief grants only the scope written into it; linked plans remain reference
material. For a small visual fix, use only the relevant fields.

---

Implement **[one feature or playable slice]** in the existing Space Explorer game.

Read `AGENTS.md`, the relevant sections of `docs/agent-development-rules.md`, and
the applicable rows of `docs/agent-planning-reference.md`. Inspect the current
implementation before editing. Reuse its engine, world, HUD, animation system,
asset catalog, and saves. Preserve unrelated work.

## Requested scope

- Player goal: [what the child is trying to accomplish].
- Core action: [one physical verb, demonstrated visually].
- World/day/node: [where this belongs].
- Learning objective: [fact IDs, source IDs, or explicitly fictional lesson].
- Meaningful choice: [alternatives and the visible consequence of each].
- Entry and exit: [how the child starts and returns to exploration].
- Later consequence: [which accepted outcome another task/day reads].
- Included changes: [content, state, mechanic, art binding, UI, persistence].
- Outside this task: [explicit scope boundaries, if needed].

## Rules and decisions

- Existing rules to preserve: [relevant current behavior].
- Planning decisions resolved by this request: [decision-log row and chosen result].
- Requirements, costs, rewards, and logical time: [existing values or explicitly
  fictional tuning; leave unknown science values unresolved].
- Save/replay handling: [compatibility impact and intended strategy].
- Unresolved items: [what can proceed independently and what depends on an answer].

Do not infer eight-day progression, new resources, fatigue, rescue, or different
Mars scope merely from the PDFs. Do not invent defaults for missing earlier-day
crop decisions or scientific measurements.

## Gameplay and presentation requirements

Build a complete small loop: approach → demonstrate/try → choose → commit → see
the result → return to play. Prefer manipulating an object to answering another
quiz. Use short prompts, contextual controls, signed resource previews, and a
visible object/meter change. Keep science explanations optional.

Provide retry, hints, cancellation, keyboard/touch alternatives, and reduced-motion
behavior. Avoid rapid-input or audio-only gates. Show one clear next action when a
resource or prerequisite is missing. Include a recoverable path through the slice.

Match the promoted ivory/charcoal/gold/navy isometric art. Reuse existing assets
before generating new ones. Respect 1×1 world-object footprints, full 3D volume,
independent tile drops/fades, ground/foot anchors, doorway-relative character
scale, and the shared camera. Preserve the base/interior handoff when relevant.

## Implementation contract

Before substantial implementation, record a short feature contract identifying:

1. The accepted action(s), authoritative fields, and prerequisites.
2. The shared calculation used by preview and commit.
3. Once-only completion/reward rules and resume behavior.
4. Inputs, visual states, motion, and failure/cancel transitions.
5. Source status, asset revisions, assumptions, and later consumers.

Keep resource and progression changes in the engine. UI and animations emit
intentions and display confirmed outcomes. Do not introduce a runtime LLM, a second
state store, an independent game clock, or a separate engine for this day.

## Handoff

Deliver the integrated slice with a concise account of:

- Result and where to review it.
- Relevant files and existing systems changed.
- Decisions, fictional tuning, and unresolved items.
- Evidence actually obtained, distinguishing compilation from observed play.
- Asset/source provenance and save compatibility, when affected.

Use focused verification appropriate to the change and respect the request to
avoid complex checks. Do not run a broad test campaign or browser automation by
default. Never claim the mechanic was playtested or is enjoyable without observation.

---

## Lightweight example

For an art-only task, a brief can be as small as:

> Replace the solar stop's illustration with the promoted solar asset. Preserve
> its node ID, 1×1 footprint, resource rules, interaction point, and independent
> tile animation. Use the exported ground anchor and uniform scale. Record the
> asset revision and the binding changed. Refresh the preview only as needed;
> do not add gameplay or run a broad check suite.
