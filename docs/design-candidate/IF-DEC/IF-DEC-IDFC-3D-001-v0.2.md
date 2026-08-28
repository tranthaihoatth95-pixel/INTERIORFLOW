# IF-DEC-IDFC-3D-001 v0.2 · `.idfc` → durable 3D representation

28/08/2026 · **REVISED CANDIDATE / PROVISIONAL** · Owner: Design Authority 10 · Plane: IF  
Runtime: **NOT ASSESSED** · Build gate: **BLOCKED** pending G1–G7 evidence and MAIN promotion.  
Scope: visible behavior, interaction and assurance semantics. No production/canonical mutation.

## Revision receipt

This file revises—but does not overwrite—v0.1. Historical artifacts remain immutable:

- v0.1 contract SHA-256 `0c58d2ba0afd12172a15b8f777a3f1be1b43fe43277514ce7e65dd58361d66b3`
- v0.1 visual SHA-256 `4b1338d897877399510be6972a6184a39091a21172ade5a886e25d92aca8c158`
- measured gap SHA-256 `894e05246a745aa3722765092a6568ac088663f83d2c970ff253f68907a33511`

v0.2 incorporates Product amendments, Architecture's additive placement proposal and Quality's `REVISE` verdict. It keeps the three-outcome safety direction but replaces the ambiguous v0.1 identity, classifier and downstream language.

## Decision card

**Problem.** A `.idfc` placement currently becomes loose 2D primitives while its declared 3D height is unread. Known catalog blocks have a separate 3D path. A naïve reader can either create false solids or silently omit placed content.

**PROPOSED.** Add one durable placement record per insertion and run a total, deterministic classifier. Every `IdfcBody` and every primitive receives exactly one accounted outcome:

1. `3d-exact` — an eligible component with valid transform, units, topology and source-declared height.
2. `3d-unresolved` — eligible component/footprint but missing or insufficiently assured height; visible, selectable, non-volumetric.
3. `3d-unsupported` — content that is not a solid by kind, has rejected representation, or fails the solid contract; visible reference/rejection with a return path.

`invalid topology` is a reason within `3d-unsupported`, not a fourth outcome. `3d-unresolved` is neither 2D-only nor invalid.

**Safety valve.** Candidate flag `ifIdfcDerived3dV1`; additive `Doc.idfcPlacements?`; no mesh persistence, fake `BlockEntity`, BOQ duplication or mutation of the known `BlockEntity` path. Flag-off uses current 2D compatibility projection plus explicit 3D status. No destructive migration.

## OBSERVED / INFERENCE / PROPOSED / UNKNOWN

### OBSERVED

- `EV-030`: `IdfcGeom3d` declares `heightMm`, `bevelMm`, `matId`, `pbr`.
- `EV-033`: measured repo scan found zero readers of `geom3d.heightMm`.
- `EV-034–036`: current furniture scene generation uses known `BLOCK_MAP` footprints and built-in height logic; unknown blocks do not generate a footprint.
- `EV-037`: current `.idfc` placement flattens primitives and explicitly reports `keepsIdentity:false`.
- Product authority confirmed candidate kinds and assurance amendments in the MAIN revision verdict.
- Architecture proposed additive `Doc.idfcPlacements?: IdfcPlacement[]` and compatibility-only `srcInsertId` projection.
- Quality verdict is `REVISE`; G1–G7 are mandatory.

### INFERENCE

- A schema field is a possible source, not proof that arbitrary primitives form a solid.
- Durable cross-representation identity cannot depend on editable primitive metadata.
- A visually plausible proxy is unsafe unless each consumer knows its assurance level.

### PROPOSED

- The UI and scene consume the placement as the identity-bearing object; its 2D and 3D forms are representations of that placement.
- Exact solid is an allowlisted result after all gates pass; failure never falls through to a guessed solid.
- Every non-exact result stays locatable and explains why it is unresolved/unsupported without warning spam.

### BLOCKING / UNKNOWN

- Exact topology tolerances, numeric bounds and performance budgets have no accepted evidence.
- Security policy for offline cache revocation and safe denial metadata is unresolved.
- Product/Architecture must define mixed-body authoring semantics and whether a rejected raster/model/binary body can be placed as reference or must be rejected before placement.
- Catalog approval/version authority and consumer-specific export policy require durable contracts.

## Durable placement boundary — Architecture candidate

`Doc.idfcPlacements?: IdfcPlacement[]` is additive and owns:

- stable placement UUID; copy always creates a new UUID;
- source asset reference, source version/hash and permission scope;
- authoritative `memberEntityIds`;
- transform including translation, rotation, scale/mirror, unit and base elevation;
- `derived3d` descriptor: classifier outcome, topology result, assurance, generator version and diagnostic reasons;
- overrides, state and revision history.

Existing primitives carry `srcInsertId = placement.id` only as a compatibility projection. Removing or editing that field must not destroy placement identity. The same asset may have many independent placements. Scene geometry is derived from the placement; mesh is never product truth.

## G1 · Total content classifier

### Eligibility preconditions

An exact/unresolved solid candidate must satisfy all applicable conditions:

- body kind is `furniture`, `millwork`, `fitout`, `fixture` or `soft`, **or** `body.type = component`;
- placement transform and unit are valid;
- geometry is attributable to that placement;
- there is no existing catalog representation for the same insertion;
- topology passes G2 before `3d-exact`.

### Kind outcomes

| Body/content | Outcome contract |
|---|---|
| Eligible candidate + topology pass + finite positive declared height | `3d-exact` |
| Eligible candidate + usable footprint + height missing/unknown/not sufficiently assured | `3d-unresolved` |
| Eligible kind but topology/transform/unit fails | `3d-unsupported` with exact reason |
| `material`, `page`, `video`, `doc`, `asset`, `brandkit`, `preset` | `3d-unsupported`; never solid by kind |
| raster/model/binary | Explicit product rule required: rejected-before-place **or** visible reference/unsupported. Never silently reinterpret as component. |
| annotation, text, dimension, hatch, clearance, guide | `3d-unsupported` reference primitives; never solid |
| Known catalog representation for the same insertion | Existing catalog path only; IDFC derived solid suppressed to prevent overlap/duplicate identity |

For mixed `Prim[]`, each primitive must be accounted exactly once as `solid-boundary`, `hole`, `reference`, or `rejected`. The placement receives one aggregate outcome. Outline + clearance + text/dimension must not sweep all primitives into the solid. The classifier must emit a machine-verifiable accounting ledger: `inputCount = solidBoundary + hole + reference + rejected` with no double membership.

## G2 · Deterministic topology and numerics

`3d-exact` is forbidden until a versioned topology contract defines and tests:

- closure epsilon and unit-normalized comparison, including a `0.01 mm` gap case;
- winding normalization, same-winding hole detection/repair policy, holes and multiple islands;
- degeneracy, self-intersection, duplicate/coincident segments and zero-area loops;
- transform order, `sx = -1` mirror, rotation, non-uniform scale policy and base elevation;
- supported units and deterministic conversion/precision;
- finite numeric bounds, including rejection of `heightMm = 1e12` and NaN/Infinity;
- whether two islands form one placement with multiple solids or an unsupported mixed result.

All numeric values and tolerances are **BLOCKING / UNKNOWN** until Architecture and Quality provide evidence. The UI must never expose “Exact” before these tests pass.

## Height and assurance contract

| Height source | Meaning | UI assurance | Consumer restriction |
|---|---|---|---|
| `declared` | Value declared by the source asset/version | “Source-declared” + source/version | Not automatically manufacturer-verified; each consumer applies its own rule. |
| `catalog` | Versioned, approved catalog representation/value | “Approved catalog” + catalog/version/approval | Only valid while approval/version resolves; inferred catalog height is not `catalog`. |
| `user` | Project user override with actor/time/reason; project approval if required | “Project-approved override” | Never labelled manufacturer fact; consumer decides whether project approval is sufficient. |
| `unknown` | Missing, stale, unapproved, inferred-only or inaccessible | “Height unresolved” | Excluded from verified quantity, volume and verified export. |

No universal fallback height exists. A legacy/type inference may be shown only as a proposal inside preview and remains `unknown` until a human-approved override is recorded; it cannot enter verified consumers as `catalog`.

### Missing-height experience

- Render `3d-unresolved` as a restrained footprint/wire reference at the correct placement and base elevation—never a volumetric ghost with implied height.
- Selection shows **“Chưa xác nhận chiều cao”** and source/assurance, with **Set height** and **Open source**.
- Context Studio previews a user value with units and downstream impact. Apply creates a new revision; Cancel preserves unresolved state.
- Grouped warnings summarize multiple placements and provide filter/navigation. They do not duplicate one toast per primitive.
- AI may propose a value and evidence; it cannot change outcome/approval silently.

## G3 · Identity, revision and undo

- Placement UUID—not `srcInsertId`—is the durable identity across edit, height override, undo/redo, reopen, Open source and reimport.
- One insertion transaction creates placement + member entities atomically. Copy creates a new placement ID while retaining source reference.
- A height override is a separate atomic revision. Undo restores the prior descriptor/representation without deleting the source or unrelated primitives.
- Reimport/source update stores old/new source versions and an impact preview. User overrides remain versioned and reversible; overwrite requires explicit resolution.
- Scene failure/cancel cannot leave a half-face or mixed descriptor. Commit derived descriptor only after a complete stage succeeds.

Counterproof required: delete/change all `srcInsertId` compatibility fields, reopen, then prove Open source, selection, update and undo still resolve by placement identity.

## G4 · Downstream assurance matrix

| State | 3D scene | BOQ | Present | Export/package |
|---|---|---|---|---|
| `3d-exact / declared` | Solid with source-declared badge on inspection | Identity/spec allowed; volume/quantity only if BOQ rule accepts source-declared assurance | Visual allowed with provenance/fidelity status | Geometry export allowed only under target/rights policy; metadata states source-declared |
| `3d-exact / catalog` | Existing approved catalog representation | Catalog fields only while version/approval valid | Visual allowed | Target policy + catalog redistribution rights |
| `3d-exact / user` | Solid with project-approved override badge | Never manufacturer fact; consumer may accept project quantity by explicit rule | Visual allowed with project-override disclosure on inspection | Metadata preserves override; no false manufacturer fidelity |
| `3d-unresolved / unknown` | Non-volumetric footprint reference | Identity may remain; verified volume/quantity excluded | Reference/fallback only, visibly unresolved | Verified 3D export excluded; source/reference package policy explicit |
| `3d-unsupported` | Reference/rejection marker at location | No derived solid quantity | Explicit fallback/omission reason | Only original source/reference if target and permission allow |
| stale/offline/permission-denied | Last safe representation only if policy permits; state visible | No new verified computation | No hidden stale claim | Export blocked or clearly policy-defined; never leak protected metadata |
| generating/failed | Previous stable representation + work state | Previous committed revision only | Previous committed revision only | No partial representation |

BOQ, Present and exporters must consume the placement assurance descriptor, not infer validity from mesh presence.

## G5 · Permission, offline and rights

- Authorize tenant, project, asset and exact source version **before bytes load**.
- Denial UI exposes only safe metadata approved by Security; no cover, dimensions, names, team or texture leak.
- Offline use requires an explicit cache policy; stale state and last verified source version are visible.
- Revocation must define cache purge/lock behavior and prevent stale protected data from export or preview.
- Embedded PBR/texture/geometry redistribution rights are separate from permission to view/use inside IF.
- Runtime fixtures/screenshots must be synthetic or rights-cleared.

Permission-denied, offline and cache-revocation tests are mandatory. Exact safe denial fields and revocation timing remain **BLOCKING / UNKNOWN** for Security/Architecture.

## G6 · Atomic work and performance

Stages: authorize → parse/classify → normalize topology → derive → validate/account → atomic commit. Each long stage is cancellable where technically safe; cancel/failure retains the previous stable representation and records no half-face.

Progress is work-based (for example primitives/loops validated when that denominator is truthful), otherwise indeterminate with current stage text. No invented percentage.

Numeric budgets for file bytes, primitive count, loop count, topology time, main-thread blocking, memory/GPU cost and cancellation latency are **BLOCKING / UNKNOWN** pending measured runtime evidence. Production must not invent them in implementation.

## G7 · Runtime and rollback proof

The execution gate stays blocked until Quality independently records:

1. Real app trace: authorized `.idfc` placement → 2D → 3D → source selection → height revision → undo/redo → save/reopen → reimport.
2. All G1 counterexamples: mixed outline+clearance+text/dimension; raster/non-component contradiction; all primitives accounted once.
3. All G2 counterexamples: removed `srcInsertId`, `sx=-1`, two islands, same-winding hole, `0.01 mm` gap, `1e12 mm` height.
4. Assurance counterexample: inferred catalog height cannot become approved catalog fact.
5. Permission/offline/cache-revocation matrix and rights boundary.
6. Visual states: exact, unresolved, unsupported, grouped warnings, stale, offline, denied, generating and failed.
7. Flag-on/flag-off rollback with no data loss; known `BlockEntity` scene and BOQ remain unchanged.
8. Measured performance against accepted budgets, cancellation and atomicity.

No Design/Main/Production actor may call this PASS. Quality owns runtime status.

## Visual/state contract

- **Exact:** grows causally from its validated footprint after the stage commits; no premature half-solid.
- **Unresolved:** flat/wire reference plus compact shape+label; never presented as a translucent “almost real” volume.
- **Unsupported/invalid:** stable source-location marker/reference and concise reason with Open source.
- **Stale/offline/denied:** distinct shape/icon/text; permission denial never previews protected geometry.
- **Generating:** previous stable state remains; stage and cancel are visible.
- **Failed:** previous stable state remains; exact failure reason and retry/open-source route.
- Group warnings by placement, not primitive. Keyboard/touch/reduced-motion/reduced-transparency provide equivalent state and action.

## Unresolved authority decisions

| Decision | Owner | Status |
|---|---|---|
| Mixed-body aggregate semantics and raster/model/binary place-vs-reject | Product 11 + Architecture 20 | **BLOCKING / UNKNOWN** |
| Topology algorithm, tolerances, unit/numeric bounds, two-island result | Architecture 20 + Quality 13 | **BLOCKING / UNKNOWN** |
| Catalog approval/version contract and consumer assurances | Product 11 + Architecture 20 | **BLOCKING / UNKNOWN** |
| Safe denial metadata, cache revocation, redistribution rights | Security/Architecture + legal owner where required | **BLOCKING / UNKNOWN** |
| Performance/cancellation budgets | Architecture/Production Control + Quality | **BLOCKING / UNKNOWN** |
| Final appearance and motion | Hoà eye approval after runtime visual proof | **NOT ASSESSED** |

## Transfer and execution status

- **KEEP:** three-outcome direction; no guessed height; no silent omission; reversible provenance.
- **MODIFY:** durable identity is `IdfcPlacement`; `srcInsertId` is compatibility only; exact eligibility and assurance are total/consumer-specific.
- **REJECT:** extrude-all-primitives, universal height fallback, mesh-as-truth, fake `BlockEntity`, duplicate known-block geometry, partial commit.
- **Build:** blocked. MAIN may route remaining Product/Architecture/Security choices and Quality review; Production Control may packet only after promotion and live writer lease.

