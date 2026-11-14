# Architecture

## Boundaries

`src/game` contains synchronous TypeScript functions with no React, browser, network, or clock dependency. It imports the curated configuration and event catalog. The catalog is trusted, reviewed application content; raw external JSON must be validated before entering this boundary.

`src/features/mission` connects the engine to React and browser storage. Pages use the Next.js App Router. Interactive UI runs in a client component. `/about` and `/api/events` are static server outputs.

The isometric world has separate navigation and presentation boundaries: `src/world` owns spatial data and math, `src/rendering` implements the PixiJS WebGL adapter, and `src/features/world` connects discrete player commands to React. Spatial movement, visibility, routing, interaction, and save validation live in `src/world/exploration.ts` and `src/world/visibility.ts`. The adapter receives a world snapshot and presentation flags, never a mutable mission state. See [isometric world architecture](isometric-world.md).

The public API exposes the same illustrative dataset used locally. Gameplay does not request this endpoint per turn. There is no backend game session or process-local shared state.

## Turn contract

1. Display the current event, its known consequences, and three choices.
2. Validate mission status, choice membership, and available resources. Action costs must be affordable from the current balances; future generation cannot finance an action.
3. Apply action effects and clamp resources to storage capacity.
4. Resolve storm impact: consume shield reserve, then emergency oxygen for unabsorbed points. This is an explicitly fictional mechanic.
5. Combine event effects and daily upkeep, then clamp to resource bounds.
6. Lose if oxygen or power is zero. Otherwise win if this was sol 15.
7. If still playing, advance the sol and pick an eligible event, excluding the immediately previous event.
8. Record a before/after summary. The completed state never advances again.

When no normal action is affordable, a single emergency "Conserve supplies" action replaces the choices so the player can still resolve the turn. It adds no resources; event effects and upkeep still apply. It cannot be selected when normal actions are affordable.

Only the end-of-sol balances determine survival. Shielding and science may be zero without losing. Science is a bonus, not a win requirement. There is no funding resource.

## Determinism and saves

The engine receives an explicit unsigned 32-bit seed. A xorshift generator controls event selection. Seed zero normalizes to one to avoid an absorbing zero state. The simulation never calls `Math.random()`, `Date.now()`, or an external service.

A save records a format version, ruleset version, dataset version, mission ID, initial seed, and the completed choice IDs. Restoring replays the choices through the engine. This rejects malformed or impossible action sequences and prevents resource totals from being trusted blindly. It is not anti-cheat: anyone controlling a browser can create a valid high-scoring replay. Competitive scores would need server validation and an agreed seed.

Any balance, selection, mission, or event change that alters replay results must bump `RULESET_VERSION` or `DATASET_VERSION`. Incompatible or corrupt saves start a fresh mission with a visible notice. Storage failures leave the game playable and display a notice. Local saves are small, but not shared between browsers or devices.

## Real-data ingestion extension

No NASA credentials or live ingestion are configured in this starter. Add a server-only adapter when there is a selected, reviewed source. Preserve:

- Source agency, endpoint, record identifier, observation date, and original link.
- The schema/version of the normalized snapshot.
- The mapping from measured source fields into invented event severity and resource changes.
- Units, missing-data handling, assumptions, and educational review status.

Fetch once during curation or through an independently cached refresh process. Retain the last good dataset and avoid updating the event deck halfway through a mission. Validate untrusted input before publication. Keep credentials on the server and check the chosen service's actual quota. Do not equate a flare classification with an astronaut's received radiation dose.

OSDR content can support educational cards after review; image search results are optional presentation assets. Neither is a physics engine or a replacement for a balanced simulation.

## Scaling choices

The current state is small and updates once per decision. Profile first on the oldest intended classroom or mobile device. Suggested acceptance targets: under 100 ms from a click to resource feedback, no requests per turn, readable controls at 360 px, and correct save/reload behavior.

PixiJS now renders the 2D world with on-demand frames, separately from React dashboard state. The current small map uses procedural Graphics; measure before choosing sprite atlases, spatial indexes, chunk culling, or workers for larger worlds. For cloud saves, add durable storage and explicit session handling. For realtime multiplayer, use an authoritative shared simulation and a deployment supporting persistent connections. Do not assume serverless request handlers retain state between calls.

## Intentional MVP scope

One Mars mission, six sample event templates, local saves, static scientific topic references, and an explorable WebGL isometric outpost with radius-three visibility and home guidance. No construction commands, continuous physics, live NASA observations, 3D scene, real physics, account system, leaderboard, analytics, audio, full offline installation, or multiplayer. These are extension points, not completed capabilities.
