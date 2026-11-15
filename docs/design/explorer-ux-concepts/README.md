# Educational game UX: three directions for selection

Status: concept exploration requested by the user; these are proposals, not
implemented game screens. Preserve the current game while the direction is chosen.

The user supersedes the previous quiet-notes hierarchy: the main fact and the
experiment's cause/effect now deserve primary visual attention. Expandable
references supplement the lesson; they do not hide it.

## Common contract

- A short learning headline is a major part of the scene, paired with an actual
  illustrated cause/effect. No required paragraph or reading quiz.
- Each resource has a stable object/icon, plain name, current amount and capacity.
  Air = tank; Water = reservoir; Power = battery; Energy = astronaut readiness.
- Before commitment, show current → after plus separately labeled signed costs
  and gains. Example from current standard melt terms: Water 42 → 54, Power
  75 → 69, Energy 80 → 76, Research tokens 16 → 18; spend 1 token and earn 3.
  Work time costs 0.5 game hours. All quantities are fictional game units.
- Separate spendable research tokens from permanent research progress. The
  current engine already distinguishes resources.science and knowledgeEarned.
  Do not visually imply that learning disappears when a token is spent.
- Effects visibly travel between the manipulated object and its reservoir; labels,
  signs and amounts carry meaning without relying on movement or color.
- One primary physical verb per phase. Provide click/keyboard equivalents to
  dragging, persistent outcomes, reduced motion and no reflex gate.
- The experiment demonstrates an authored model. It must not promise potable
  lunar water, show invented NASA instrument readings, or teach the drawn
  apparatus as actual spacecraft hardware.

## A. Living Diorama

A tangible miniature lunar laboratory fills the screen. The player handles
ice, equipment and samples directly in a detailed isometric scene. A cutaway
reveals what happens inside. Illustrated annotation ribbons deliver the central
fact alongside the object it explains. Top-left supplies are recognizable tanks
and batteries with levels, labels and numbers.

Ingenuity: a "see inside" lens reveals flow and test results while preserving the
world's geography; costs leave the actual supply objects as the action is previewed.
Strength: immersion and continuity with the world. Risk: occlusion, mobile picking
and zoom need deliberate design; visual density must be controlled.

## B. Inventor's Workbench

The apparatus is the interface. Chunky components snap onto a physical workbench;
visible water paths, test windows and mechanical connections show consequences.
The headline and a big illustrated process make the learning unmistakable.
A supply dock makes consumed inputs and produced outputs physically distinct.

Ingenuity: a reversible "prediction ghost" shows the expected output before the
player runs the machine; the real run then makes the difference visible.
Strength: the clearest manipulation and resource literacy. Risk: needs a modular
art/animation kit and varied behaviors to avoid five versions of pipe matching.

## C. Discovery Atlas

A living illustrated scientific field journal opens around a playable experiment.
The page fills with a three-beat observation → prediction → evidence sequence.
A large illustrated fact becomes a permanent discovery entry. Supplies remain a
clearly labeled, consistent margin inventory; gains and costs stamp in place.

Ingenuity: the player's evidence assembles the fact illustration, making the
journal a record of what they actually did rather than a gallery of reading cards.
Strength: strongest learning recall and revisit structure. Risk: it can become
text-heavy or feel detached from exploration; the experiment must dominate.

## Recommendation

Use B for the minigame interaction grammar, A for the setting and world continuity,
and C for the lasting evidence/knowledge record. Choose one leading direction
before implementation so the resulting game does not become three UI systems.

## Creative translations for the existing tasks

| Task | More graphical abstraction | What stays clear |
| --- | --- | --- |
| Radio | Carry a message through a sculptural constellation of signal relays; tune an illustrated link and watch it reach Earth | Radio carries information; route geometry is a game model |
| Detector | Tap a miniature lunar cross-section and watch a pulse reach placed instruments | Seismometers record ground shaking; the pulse is authored |
| Ice | Explore an illustrated light/shadow cross-section and reveal evidence before extracting a core | Some polar shadows preserve ice; blue crystals and locations are game clues |
| Kitchen | Build a visible food/water preparation assembly and run a sample packet through it | Some space foods use added water; machine design is fictional |
| Melter | Handle ice, heat, treatment and testing as tangible objects with visible input/output | Melting alone does not establish water safety |
| Exercise | Operate an illustrated training station with the shared astronaut and forgiving body-motion cues | Exercise supports astronaut health; game repetitions are not a prescription |

## Evidence needed for a 10/10 claim

Do not award a perfect score from mockups. Observe whether children can identify
the goal and first action unaided, predict resource changes correctly, describe
the main fact in their own words, recover from mistakes, and distinguish game
models from real science. Verify keyboard/touch/reduced motion, legibility at the
smallest target screen, smooth frame delivery, and educator review. These are
acceptance areas for a selected direction, not completed testing claims.

Science context is sourced in ../../day-1-learning-connections.md. Concept art
is visual exploration, not evidence of scientific hardware or final typography.
