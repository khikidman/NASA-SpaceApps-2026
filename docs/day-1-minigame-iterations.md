# Day 1 minigames: three iteration review

Scope: five ordered Day 1 missions and the optional exercise routine. Preserve
world geometry, base entry, campaign length, knowledge gates, and existing saves.
Audience: ages 7–12; actions and pictures before reading; no reflex gate.

Review rubric (equal weight): depth/agency, variety/replay, clarity/recovery,
visual feedback/motion, accessibility/integration. Scores are an internal design
and implementation audit, not an independent professional certification or a
child playtest. An 8 means a coherent, polished prototype with remaining player-
testing uncertainty; a 10 requires observed player evidence and device coverage.

Baseline: 5.2/10. Matching is clear, but three similar sliders, little agency,
minimal task identity, lost practice on close, and weak exercise representation.

## Pass 1 contract — distinct manipulation

Radio: connect shaped circuits, align two signal controls, send a test pulse.
Detector: choose firm ground, level three feet, record a test trace.
Ice: inspect five deposits, identify ice, align the drill with each seam.
Kitchen: fit three parts, rotate the feed path, run a diagnostic flow.
Melter: process three temperature bands, filter the finished water.
Exercise: visual astronaut poses and a forgiving alternating step/lift routine.

New versioned completion evidence is validated by the shared pure engine. Legacy
Day 1 inputs remain accepted for exact replay of existing v3 saves. New inputs
are deterministic from the existing seed. No scientific measurements are
invented: signal targets, pad stability, seam angles, heat targets, and resource
values are authored game puzzles/tuning. Practice costs nothing.

## Pass 2 contract — variation and agency

Seeded layouts/targets vary across adventures. Choose standard or boosted work:
boost trades Power for less Energy and work time. One shared calculation drives
preview and commit. Resource caps, once-only outcomes and replay remain intact.

## Pass 3 contract — cohesive interaction and motion

Shared stage rail, task-specific pictorial feedback, hint/retry controls, saved
practice, keyboard/tap alternatives, visible reasons for disabled controls,
reduced motion, and hidden-tab-safe exercise motion. No new dependencies,
full test campaign, or browser automation by default. Use targeted evidence and
one final preview build. No claim that a build proves enjoyment.

## Pass 1 review — 7.0 / 10

| Criterion | Score | Evidence / gap |
| --- | ---: | --- |
| Depth / agency | 7.0 | Five complete multi-stage tasks with engine-checked evidence; resource plans are not exposed yet. |
| Variety / replay | 7.8 | Distinct waveform, footing, geology scan, pipe and batch puzzles; seeded targets and layouts. |
| Clarity / recovery | 6.6 | Visible stage rail and safe retries; no saved practice or contextual hint layer yet. |
| Feedback / motion | 6.2 | Pictorial state and causal previews; transitions and reward beats remain basic. |
| Accessibility / integration | 7.2 | Click, keyboard-native buttons/ranges, no mandatory timing; exercise still uses an abstract icon. |

Audit basis: implementation walk-through and TypeScript check. No child or browser
playtest. Next priority: expose real resource choices, explain unavailable actions,
and make the result of each stage satisfying and understandable.

## Pass 2 review — 7.7 / 10

| Criterion | Score | Evidence / gap |
| --- | ---: | --- |
| Depth / agency | 8.0 | Standard saves Power; Boost spends 3 more Power to save 3 Energy and 0.25 work hours. The choice changes accepted resources/time. |
| Variety / replay | 8.0 | Seeds vary socket order, signal pair, terrain pad, feet, deposit layout, seam directions, pipe turns and batch targets. |
| Clarity / recovery | 7.2 | Contextual hint, stage navigation, shortage explanation, capped-gain preview; practice still resets when closed. |
| Feedback / motion | 7.7 | Test transmission, trace reveal, deposited ice, machine flow, rising water, completion stars. |
| Accessibility / integration | 7.6 | Every action supports click/keyboard; no mandatory drag; exercise/motion handling still needs the final pass. |

Next priority: resume practice, readable mobile layouts, a real astronaut routine,
explicit reduced-motion/hidden-tab handling, and restrained motion/focus feedback.
Compatibility decision: old actions without workshop metadata keep their exact
original validation and costs; revision-2 inputs validate full task proof. All
new outcomes use the existing central engine and accepted-action replay. The
Power/Energy/time alternatives are fictional tuning, not physiological claims.

## Pass 3 review — 8.3 / 10

| Criterion | Score | Evidence / remaining limitation |
| --- | ---: | --- |
| Depth / agency | 8.1 | Each mission has setup, manipulation and verification; real Power/Energy/time choice. Puzzles still have a single setup solution. |
| Variety / replay | 8.2 | Five distinct task families, seeded configurations, two exercise modes, optional challenge versus guided input. Narrative content remains Day 1 only. |
| Clarity / recovery | 8.6 | Stage focus, pictorial state, contextual hints, free reset, resumable task/routine practice, clear completion and shortages. |
| Feedback / motion | 8.4 | Anchored shared astronaut, connected circuits, test pulses, planted detector, scan reveals, ice bucket, machine flow, batch water rise, completion stars. |
| Accessibility / integration | 8.2 | Native buttons/ranges, keyboard alternatives to dragging, announced targets, large controls, mobile layout, reduced motion, actual-marker timing, hidden-tab pause; assistive-device testing remains open. |

Equal-weight average: **8.3/10**, meeting the requested internal review target
within three passes. This is an implementation/design audit, not an independent
review or evidence that children rate the game 8.3. No child playtest, browser
interaction run, performance benchmark or device-coverage claim is made.

Final refinements: practice is namespaced by seed/task and stored only in this
tab; malformed drafts fall back safely, completed drafts are cleared, and paid
proof is revalidated. Motion never awards resources. Optional guided exercise
advances only visible-tab practice; hidden-tab CSS animations pause. Reduced
motion presents a stationary centered timing marker, preserving completion.

Validation: focused legacy/new task, seeded-proof, rejected-plan, capped-cost,
replay and once-only tests; TypeScript and one final production preview build.
No dependencies added, broad checks, browser automation or campaign expansion.

Recorded result: all **13 focused checks passed** across Day 1, workshop and save
files; TypeScript and the production build passed. Local preview refreshed.

## Further requested iterations

[Passes 4–6](day-1-refinement-4-6.md) continue the same rubric: clearer current
actions (8.4), a shared detailed SVG artwork/symbol system (8.5), then unobtrusive
source-backed learning and final clarity refinements (8.6). See
[the learning connections](day-1-learning-connections.md) for facts, primary
sources and deliberate game simplifications.
