# IF-DEC-IDFC-3D-001 · `.idfc` → 3D visible representation

Version `0.1` · 28/08/2026 · **CANDIDATE / PROVISIONAL** · Design Authority 10  
Scope: visual and interaction contract only. No production/canonical mutation. Runtime status: **NOT ASSESSED**.

## Decision card

**Problem.** A placed `.idfc` is flattened into loose 2D primitives while the 3D scene extrudes only known `BlockEntity` entries. `geom3d.heightMm` is written but not read. The result can disappear silently in 3D.

**Decision.** Introduce one identity-bearing *derived 3D representation* with an explicit allowlist and three honest outcomes. Never extrude every primitive indiscriminately; never choose a universal height; never silently omit a placed object.

**Stable ID.** `IF-DEC-IDFC-3D-001`  
**Safety valve.** Feature flag candidate `ifIdfcDerived3dV1`; preserve the current 2D insertion and source file; no destructive migration. Disabling the flag restores the old reader while retaining an explicit “3D unavailable” status. User overrides are revisions and undoable.

## Evidence ledger

| Status | Evidence |
|---|---|
| OBSERVED | `IdfcGeom3d` declares `heightMm`, `bevelMm`, `matId`, `pbr` (`lib/cad/idfc.ts:160–165`). |
| OBSERVED | The current `.idfc` drop path returns `keepsIdentity:false` and flattens `geom2d.prims` (`library-item-resolve.ts:55–67, 180–181`). |
| OBSERVED | Unknown blocks return no footprint; known furniture uses `furnitureHeightMm(def.id)` (`cad-to-obj.ts:466–468, 728–748`). |
| OBSERVED | The measured gap reports three `geom3d` writers, one PBR reader, and zero `heightMm` readers. |
| INFERENCE | Schema presence proves a possible parameter source, not that every 2D primitive is a solid footprint. |
| DESIGN MISSING | Valid topology rules, identity wrapper, export/BOQ semantics, permission/license behavior and performance limits need Architecture/Product/Quality proof. |

Evidence snapshot SHA-256: gap `894e0524…a33511`; `idfc.ts` `ee33027e…f21bb`; resolver `6875bb26…fa5c53`; scene builder `c7c18e72…384c3d`.

## Content-type contract

| Source content | 3D outcome | Authority shown to user | Downstream rule |
|---|---|---|---|
| Component-like item; validated closed footprint; finite positive declared `geom3d.heightMm` | **Exact parametric solid** extruded from its own footprint | `Declared by source` | Eligible for normal 3D use; BOQ/Present still obey their own verified-field rules. |
| Known existing `BlockEntity` in the built-in map | Existing mapped proxy, unchanged | `Catalog-derived` / existing provenance | Do not generate a second overlapping solid. |
| Valid closed footprint; height missing | **Unresolved footprint proxy** at the correct transform; no guessed volume | `Height required` | Excluded from verified volume/quantity and presented exports until resolved. |
| User enters/approves height | Preview, then derived solid | `User override`, actor/time/source value retained | New reversible revision; never overwrites the source declaration. |
| Open path, annotation, text, dimension, hatch, clearance/guide | **2D-reference representation**, never a solid | `2D only` | Locatable/selectable; excluded from solid/quantity claims. |
| Self-intersecting, non-finite, unsupported multi-loop topology | **Invalid representation marker** at source location | Exact reason + return-to-source action | No silent omission; no auto-repair presented as truth. |
| Raster/image reference | No 3D solid in this contract | `Reference only` | Billboard/plane is a separate future decision, not inferred here. |

Holes and multi-loop footprints are supported only after deterministic topology tests prove the intended result. `bevelMm` and material application remain outside this first slice; a neutral material must not imply manufacturer finish fidelity.

## Missing-height interaction

1. On insert or mode change, the same source object remains selected and grows from its footprint only when the exact-solid gate passes.
2. Missing height remains visible as a restrained footprint/wire proxy. A selection-anchored status says **“Chưa có chiều cao · 2D reference”**; it is not a toast and is not repeated on every object.
3. Primary action: **Set height**. Context Studio shows value, unit, source and impact; canvas provides live preview. `Apply` creates one revision; `Cancel` restores the proxy.
4. For many unresolved objects, show one grouped count and filter, not a warning wall. AI may propose a value with evidence but cannot apply it silently.
5. Keyboard/touch paths reach the same status and action. Reduced motion uses an immediate shape/state change rather than growth animation.

## Identity, provenance and undo

- One placed source item owns its 2D primitives and derived 3D face. Preserve source asset ID/version/hash, insertion ID, transform and `srcBlock/srcInsertId`; Architecture must define the durable wrapper.
- Every derived group records `heightSource = declared | catalog | user | unknown`, value/unit, topology result, source version and generator version.
- Selecting the 3D face exposes **Open source** and returns to the matching 2D selection. Reopen must preserve this return path.
- One insertion is one atomic undo unit. A height override is a separate unit. Undo removes/reverts the derived face without deleting source 2D geometry; redo deterministically recreates it.
- Reimport/update creates a versioned comparison and never silently overwrites a user override.
- Inferred/unresolved representations cannot masquerade as verified geometry in BOQ, Present or export.

## Visible states

`exact` · `catalog-proxy` · `height-missing` · `2d-only` · `invalid-topology` · `stale-source` · `offline` · `permission-denied` · `generating` · `failed`.

Every state uses shape/icon + short label, not color alone. Long diagnostics live in Context Studio. Permission filtering happens before loading geometry/textures; test fixtures must be synthetic or rights-cleared.

## Acceptance evidence — Quality-owned

No item below is currently PASS.

1. **Contract tests:** closed/open/self-intersecting/multi-loop fixtures; zero/negative/NaN/missing height; transforms and units; declared/catalog/user/unknown provenance.
2. **Runtime trace:** real app path `.idfc → 2D → 3D`, selection return, exact warning state, one-step undo/redo, save/reopen, source update and rollback flag.
3. **No silent omission:** every placed item is either an exact solid, an explicit proxy/reference, or an explicit invalid state.
4. **Downstream honesty:** unresolved/inferred geometry is not counted or exported as verified; Present exposes fallback status.
5. **Interaction proof:** desktop pointer/keyboard and tablet/touch; reduced motion/transparency; light/dark/high contrast; VI/EN expansion.
6. **Performance proof:** agreed primitive/loop limits, large-file behavior, cancellation and measured progress; no fake spinner percentage.
7. **Security/license proof:** permission checked before geometry/texture load; embedded PBR/export rights assessed; rights-cleared evidence only.
8. **Visual comparison:** source footprint, exact solid, missing-height proxy and invalid state shown together at useful zoom without covering the scene.

## Independent challenge

`DISS-IF-DEC-IDFC-3D-001` verdict: **UNKNOWN** before this proposal. It identifies both silent invention and silent disappearance as material conflicts. This contract adopts its safer allowlist/three-outcome model. A second independent review must verify this concrete revision before MAIN promotes it.

## Ownership handoff

- **Product 11:** confirm semantic content kinds and downstream verified-vs-proxy meaning.
- **Architecture 20:** identity wrapper, topology contract, representation/version/storage and export boundaries.
- **Quality 13:** independent DISS on this revision, fixtures, runtime gates and PASS authority.
- **Production Control 12:** only after MAIN promotion; implementation packet and live writer lease.

