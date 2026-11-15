# Day 1 feature contract

Scope: integrate the Research-2 Day 1 tutorial in the existing world, engine,
renderer, HUD, and replay system. Preserve the seven-day Moon/Mars campaign.

Player loop: repair communications → deploy/calibrate detector → collect ice →
repair food machine at home → melt ice at home. A two-hour exercise activity offers
cardio or timing-based weights, with an accessible steady-input option. Skipping
is explicit and lowers the next morning's Energy; it does not alter visibility.

The engine validates ordered tasks, location, inputs, affordability, and once-only
rewards. UI experiments are free until committed. Science gate reuses the current
six earned stars, classified as fictional tuning; all five tasks are also required.
Each task costs one spendable star plus configured supplies/time and rewards stars.

ASSUMPTIONS:
- R2 supplies no complete numeric balance. `DAY1_CONFIG` labels every added value
  as fictional prototype tuning. No numeric claim is attributed to NASA.
- Energy is added for this activity chain; Food is deferred. The food-machine repair
  is a persisted equipment flag, not a new food economy.
- Outside oxygen is charged once per accepted outdoor tile step on Day 1. No real-
  time drain or travel-time charge is added. Existing supply stops support recovery.
- Base tasks validate the existing outdoor door anchor; the current interior remains
  presentation navigation. Entering is not a resource action or an independent save.
- A base air refill is an explicit previewed conversion, not an automatic airlock fee.
- Generic pick/pack/order missions and bonus learning are unavailable on tutorial day.
- Night recap remains the existing night-plan flow with a Day 1 completion summary.
- Save format/ruleset changes use a new save key. Earlier saves are preserved; no
  undocumented migration or replacement of older actions occurs.

Fact scope: F1/F8/F9 only. The moonquake is fictional story context; its cause stays
`[FACT_NEEDED: moonquake cause]` in source notes, with neutral child-facing copy.
Shelter/exposure meters are qualitative game indicators, not measured radiation.

Evidence: focused engine/replay checks of ordered tasks, duplicate rejection, costs,
exercise skip, day transition, and a successful compile. No broad browser test suite.

## Implemented slice

- Engine-validated wire repair/tuning, detector placement/calibration, ice collection, kitchen assembly, and melting; paid confirmation follows free practice.
- Five-mission strip, progressive supply bars, qualitative exposure indicator, contextual station controls, first-use home-arrow hint, and a signed end-of-day recap.
- Kitchen, melter, and exercise equipment in the existing room, activated by walking to the station; the strip also offers the current activity.
- Four repetitions for cardio/weights, steady-mode accessibility, and an explicit skip result. All authoritative task outcomes and the routine choice replay.
- Day 1 task costs total 5.5 work hours; exercise adds 2. Starting with 16 hours leaves 8.5 hours before optional supply actions. Outdoor walking uses Air, not work hours.
- Fact F1 is linked to NASA Weather on the Moon; F8 is linked to NASA The Human Body in Space. Quake cause and radiation dose remain unspecified.

CHANGES TO EXISTING CODE: extended Resource/GameState/GameAction types and pure engine; new ruleset/dataset/save version and preserved old save key; task-aware world presentation; base-station callbacks; mission HUD/dialogs, resource components, and source registry. Existing geometry, camera, terrain transitions, base-entry animation, later-day tasks, and Mars are reused.

Limit: this is the first Day 1 slice, not the eight-day campaign. Energy is restored by the night plan; skipping starts Day 2 at 80 instead of 100. A later-day research-yield modifier has not been invented. The ice cave is a local stylized resource drawing, not a real NASA surface location.

## Three minigame refinement passes

See `day-1-minigame-iterations.md` for the three design audits and scores.
The five missions now use seeded, multi-stage workshop puzzles, versioned
completion proof, free practice saved in session storage, contextual hints,
and task-specific feedback. Exercise reuses the registered astronaut atlas,
with guided input, optional challenge controls, and an optional paused guide.

Standard terms preserve the original budget above. Boost spends 3 extra Power
per mission to save 3 Energy and 0.25 work hours; all five boosted tasks total
4.25 hours, leaving 9.75 after the optional two-hour routine (before supplies).
All five standard tasks cost 34 Energy / 6 Power; all five boosts cost 19 Energy /
21 Power. These are fictional tuning; both plans reward the same knowledge.
The same terms function drives the preview and accepted costs. Invalid practice
and canceled tasks use no resources. Completed work still awards once.

Compatibility: no legacy replay semantics changed. Existing v3 actions without
workshop metadata retain their original validation and standard costs. New
revision-2 inputs validate the seeded setup, manipulation and terminal check.
Local drafts are presentation-only; they cannot write supplies or award rewards.
New accepted actions replay their chosen plan and proof through the engine.

Passes 4–6 add current-action/progress cards, detailed native SVG instruments and
symbols, a symmetric straight-filter connection, and optional field notes for all
five tasks and exercise. See `day-1-learning-connections.md` for verified science,
source IDs, and game limits. Notes do not mutate the journey, cost resources or
add reading gates. The source registry and optional `/about` field guide retain
access after a task closes; game economy and replay rules stay unchanged.
