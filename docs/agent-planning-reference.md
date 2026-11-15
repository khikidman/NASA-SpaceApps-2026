# Research planning reference and integration decisions

Reviewed: 2026-11-14. Purpose: preserve the supplied plan's intent without silently
replacing the current game or treating embedded prompts as executable requests.

## Sources and status

| ID | Preserved source | Contents | SHA-256 |
| --- | --- | --- | --- |
| R1 | [NASA-SpaceApps-Research-1.pdf](references/NASA-SpaceApps-Research-1.pdf) | 21 PDF pages; broad concept, research notes, task sketches, resource tables, eight-day draft | `7753436160780cb7010cbf462a915a4f1a8c860952d5f2ab7912994103545bb8` |
| R2 | [NASA-SpaceApps-Research-2.pdf](references/NASA-SpaceApps-Research-2.pdf) | 6 PDF pages; incremental Day 1–8 integration prompts and an image-based Fact Bank | `e0fb0a22b658810696d32c8a412669948aa0e79b7f0d99218029c75fcd3faa8c` |

The copies retain the original bytes; the Downloads originals were not modified.
Page references below use **PDF page numbers**, not the printed footer numbers.
R2's Fact Bank is an embedded image on page 6 and was read visually; extracting
page text alone misses it.

These PDFs are planning evidence. Their example imperatives, source claims,
prototype quantities, and suggested filenames do not independently authorize
runtime changes. Their science has not been independently verified by this
ruleset-writing task. Primary-source verification belongs to the relevant future
content integration, using the existing source registry.

## Baseline at the original ruleset review

Read the code before relying on this snapshot:

- Shared seven-day Moon and seven-day Mars missions; Mars already exists.
- Air, Water, Power, Shield, and spendable science, with separate earned knowledge.
- Six starting science stars; 16 work hours; daily rest represented by day completion.
- Daily gate: six earned knowledge stars plus one complete challenge.
- Three two-step tasks per world, using pick, pack, and order interactions.
- Walking is free; there is no Energy/Food state or fatigue-dependent render radius.
- Authoritative accepted actions and versioned replay saves in `src/game/`.
- Rounded radius 5 rendering, solid center radius 4, independent tile drops/fades.
- A 3×3 base of 1×1 objects, southwest airlock, and 5×5 interior with local navigation.
- A promoted modular art bank and doorway-scaled shared astronaut spritesheet.

The plan's richer continuous minigames, day-specific chains, storm lockdown,
crop dependencies, radiation badge, exercise, meal, and rescue systems are not
implemented simply because their art or descriptions exist.

## Proposed campaign map

Use this as a feature-planning map when the user requests the corresponding work.
It is not an instruction to implement all days in this task.

| Day | Proposed experience from R2 | Reusable interaction families | Outcomes that later systems need | Fact scope / pages |
| --- | --- | --- | --- | --- |
| 1 | Tutorial: repair communications → deploy seismometer → harvest/return ice → repair food machine → melt ice; introduce meters and daily exercise | Repair, placement/calibration, collection, resource conversion, exercise | Tutorial checkpoints, repairs, detector, accepted ice/water outcomes | F1, F8, F9; quake cause flagged; R2 p1 |
| 2 | Restore dusty solar power; assemble Veggie with LED choice; collect crater samples in order and analyze them; exercise | Brushing, assembly, configuration choice, sample sequence, analysis | Solar repair, LED choice, station state, analyzed sample IDs | F2–F5, F7, F8; OSD-766 result unverified; R2 pp1–2 |
| 3 | Follow rover to cave; demonstrate shelter simplification; finish plant system; water planters; exercise and badge logging | Navigation, contextual observation, assembly, hold/gauge, proximity logging | Cave/shelter unlock, per-planter watering, completed logs | F2, F3, F9; cave claim flagged; R2 pp2–3 |
| 4 | Optional catch-up, resource/soil trips, reserve forecast, weather gadget experiments, or Rest and Reset | Reuse collection/analysis; place/observe gadgets; forecast | Reserves, optional discoveries, rest outcome | F1 for weather toybox; preserve original sources for reused tasks; R2 p3 |
| 5 | Repair external communications; receive neutral storm alert; stockpile; exercise; show countdown/readiness | Reuse repair, conditional call/alert, resource planning | Dish repaired, alert received, reserves and readiness | DONKI description remains flagged; R2 pp3–4 |
| 6 | Gather remaining supplies; harvest from saved LED/watering choices; assemble/eat a meal; exercise | Collection, deterministic harvest, food assembly | Harvest consumed once, meal outcome, final reserves | Generic nutrition only until a space-specific source is verified; R2 p4 |
| 7 | Final resource run; resolve checklist shortfalls; exercise and choose sleep; advance without a soft lock | Forecast/checklist, reuse resource actions, sleep choice | Final readiness, sleep result, finale entry | F6 for sleep context; R2 pp4–5 |
| 8 | Lockdown resource allocation; configured consumption; clear win/loss recap; Mars unlock screen | Resource management intervals, recap, retry/review | Finale outcome, retained science/discoveries, unlock | F6, F8, F9; solar/radiation details flagged; R2 p5 |

R1 provides additional task sketches on PDF pages 8–12, interface notes on pages
12–13, walking/routine tables on pages 14–16, and day/task budgets on pages 16–21.
These are alternatives and prototype values, not a second independent rule engine.

## Fact Bank provenance

These are **topic summaries of the supplied Fact Bank**, not newly verified
scientific statements. Retain the original IDs when planning future content.

| ID | Topic listed in R2 p6 | Integration restriction |
| --- | --- | --- |
| F1 | Absence of lunar wind and rain | Do not extend this to literal permanence of every mark or to a real-time weather model |
| F2 | Veggie's approximate size and typical plant count | Keep the spaceflight system context; do not infer the game's physical base scale |
| F3 | Growth pillows, clay-based medium, fertilizer, water, nutrients, and root air | Do not turn an illustration into evidence for a particular crop yield |
| F4 | Light as a plant growth cue in weightlessness | Do not describe the Moon as having no gravity |
| F5 | Red/blue grow LEDs and a magenta appearance | Does not establish a universal best spectrum or numerical harvest multiplier |
| F6 | Sleep and influences on astronauts' body clocks | Game rest durations and output modifiers remain fictional tuning |
| F7 | Apollo sample quarantine quantities | Verify the exact masses, missions, denominator, and interpretation in the primary report before quoting statistics |
| F8 | Exercise, low gravity, bones, and routine | Do not treat a game exercise score as a physiological measurement |
| F9 | Radiation badges/sensors and digital signals | Does not justify invented exposure numbers, upload rewards, or guaranteed shelter safety |
| Note 10 | Named source families: DONKI, OSDR, and NASA pages | A source pointer, not an additional learning fact |

Known review items from the PDFs include moonquake causes, a named historical
sample container, lunar-cave shielding, sound wording, OSD-766 results, solar
storm details, and space-specific nutrition. The broader R1 research notes also
include numerical radiation and temperature claims that must not be copied as
verified facts. R1's proposed soil-growth demonstration needs source review before
showing an absolute biological outcome.

## Decision log: do not silently choose between these

All rows below are unresolved design/integration choices. For this documentation
task, the default is to preserve the working game. A later user request can resolve
a row directly; it does not require a separate approval ritual. Record the chosen
behavior, affected systems, source status, and save strategy in that feature's
contract, then continue the authorized work.

| Decision | Conflicting or incomplete material | Current / safe integration default |
| --- | --- | --- |
| Campaign length and Mars scope | R1 p1 says seven Moon days then Mars; R1 pp7–8 and p21 add Day 8. R2 p5 ends with a Mars unlock screen only. The game already has both worlds. | Do not delete Mars or change mission duration while adding content. Decide finale placement and compatibility explicitly. |
| Knowledge gates vs currency | Current game uses daily earned knowledge and challenge completion. R1 pp13,16–21 proposes cumulative-looking thresholds and a 75-knowledge report. R2 uses Science requirements, some unspecified. | Define whether each gate reads bank, day, level, or total knowledge. Thresholds are not costs unless explicitly designed as costs. |
| Resource vocabulary and schema | Current game has no Food or Energy. R1/R2 introduce both; R2 mentions morale without defining a separate resource. | Add nothing merely from a mention. Plan fields, UI, producers/consumers, caps, rescue, and save behavior together when authorized. |
| Walking, clock, outside oxygen | Current walking is free. R1 p14 proposes per-tile time/Energy/Oxygen/Shield costs; R2 describes outside drain. Badge logging uses ten-minute intervals. | Do not attach costs to frame rate, pixels, or browser time. Choose a logical time model and recompute route budgets first. |
| Exercise and routine costs | R1 narrative says one hour; later tables and R2 say two. One table restores Energy while R2 also specifies Energy/Water costs. | Preserve current behavior; choose a single cost/modifier model and an accessible input alternative before integrating. |
| Food, sleep, and fatigue | R1 supplies Energy bands and maximum-Energy penalties. R2 adds meal/rest modifiers without a complete combination rule. | One explicit modifier calculation, rounding rule, order, and recovery path; do not silently stack penalties. |
| Fatigue visibility | R1 p16 proposes radius 3→2. The active render radius is 5 with a solid center of 4, and the user previously deferred fatigue adaptation. | Keep visibility configurable and fatigue adaptation off until specifically requested. Do not restore obsolete radius values from the PDF. |
| Watering results | R1 task text says overwatering wastes water/food. R2 p2 proposes more Food and bonus Oxygen at extra Water cost. | Record the chosen outcome table as fictional balance; no inferred crop-science claim. Save each planter result for harvest. |
| LED and harvest tuning | R2 asks to preserve LED choice and compute Day 6 output from it and watering. Missing modifiers are placeholders; spectrum conclusions are unverified. | Use explicit fictional config only after an integration decision. Do not rank spectra as established NASA findings or randomize saved outcomes. |
| Radiation, shielding, and storms | R1 includes numerical shield losses and three waves; R2 leaves duration/hazard values unprovided. Both use red/green shelter simplifications. | Keep qualitative presentation distinct from modeled dose. A green indicator is not a real safety assertion; no invented live DONKI event. |
| Rescue vs loss | Current zero Air/Water/Power loses. R1 p16 proposes outside rescue retaining knowledge. R2 p5 names Food/Water/Power as lockdown loss triggers while also managing Oxygen. | Specify phase-dependent failure, rescue, retry, and Oxygen handling before changing survival rules. |
| Badge cadence and rewards | R1 p15 describes a paid daily upload/reward; R2 p2 describes automatic proximity uploads every ten game minutes. | Define missed intervals, location rules, costs, caps, and persisted awarded IDs; prevent unlimited reward farming. |
| Optional Day 4 and day gates | Current day completion requires a challenge. R2 p3 permits finishing Day 4 without an optional task or spending the day resting. | Plan day-specific completion conditions; do not bypass all campaign gates globally. |
| Day 7 reachability and Day 8 failure | R2 requires reaching Day 8 without soft locks, meaningful preparation scarcity, and possible failure during lockdown. | Allow defined progression/recovery without making every outcome an automatic win. Prove at least one affordable preparation route. |
| Draft time budgets | Printed task/return/routine buffers use differing assumptions; Day 1 narrative and task table enumerate different chains. Rest-and-Reset also competes with routine time. | Calculate a single ledger from accepted task definitions; never copy a displayed buffer as proof of feasibility. |
| Scientific context | R1 includes a “Moon storm,” soil-growth generalizations, and research assertions not all present in R2's permitted Fact Bank. | Use accurate neutral story language, mark missing evidence, and verify a primary source before expanding a learning claim. |

## Suggested integration order, when requested

1. Resolve campaign/resource/time/gate semantics and save compatibility as one small
   foundation slice. Keep the current playable mode intact while this is developed.
2. Integrate a Day 1 repair/ice conversion chain through shared action/state rules.
3. Add Day 2 crop setup and a saved LED decision; then Day 3 saved watering.
4. Reuse those primitives for optional preparation and clear resource forecasts.
5. Add Day 5 repaired communications and configured warning/readiness state.
6. Make Day 6 harvest consume the actual saved choices; add meal/rest effects only
   with their defined modifier rules.
7. Connect the final preparation checklist, reachable finale, failure/retry, and
   explicit Mars transition according to the resolved campaign decision.

This order is a recommendation for future tasks, not a commitment to implement
those systems now. The existing asset bank supplies art, not completed gameplay.

## Review record

The ruleset was derived from both PDFs, including the image-based Fact Bank and
the resource/finale tables, and compared with the current mission configuration,
task definitions, engine types, source registry, renderer contracts, and asset
protocol. No game code, campaign rules, save behavior, or runtime settings were
changed by this documentation task. No game build or automated gameplay checks
were needed or performed for these documents.

## Day 1 integration update · 2026-11-15

The user subsequently authorized Day 1 implementation. The [feature contract](day-1-implementation.md) records its resolved assumptions: five ordered paid missions, prototype tuning, an Energy field and exercise-or-skip routine, deterministic per-step outdoor Air costs on tutorial day, explicit air refill, and a separate v3 replay save. The seven-day campaign and Mars remain. Food, continuous-time survival, fatigue visibility, and the later-day story chains remain unimplemented. The original baseline and conflict table above remain as historical planning evidence.
