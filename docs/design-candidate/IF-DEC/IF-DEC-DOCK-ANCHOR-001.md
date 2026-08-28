# IF-DEC-DOCK-ANCHOR-001 · Adaptive Work Dock anchor contract

Version `001.1` · 2026-08-27 · **PROVISIONAL · MATERIAL_CONFLICT RESOLVED BY MODIFICATION**  
Plane `IF` · Owner `10 DESIGN AUTHORITY` · Authority `00 MAIN conflict gate` · Production/canonical **READ-ONLY**

## Decision card

**Problem.** Preserve spatial/muscle memory across 2D, Visual+3D and Present while allowing each professional context to expose the right small working set. Prevent the Dock from becoming either three unrelated toolbars or one overstuffed union toolbar.

### OBSERVED

- `[EV-DOCK-001]` Current target defines one chassis with invariant anchor zone A, one morphing payload zone B, and fixed live-task zone C; it also says 2D payload differs for Sketch versus Pro and Model/Paper context.
- `[EV-DOCK-002]` `CadToolbelt` implements mode/workspace-dependent content and returns `PaperToolbelt` in Paper context.
- `[EV-DOCK-003]` `ToolDock3D` already keeps stable compact coordinates and reads shared command identity through the registry adapter, but its stage bindings remain separate and incomplete.
- `[EV-DOCK-004]` `StageToolbelt` computes its current working set from stage, source availability and selection presence; therefore current code is more context-sensitive than a `stageChanged`-only model.
- `[EV-DOCK-005]` Present has its own Undo/Redo callbacks and selection model; shared spatial roles do not yet prove a shared history execution scope.
- `[EV-DOCK-006]` Runtime coverage is incomplete: the target reports one of three Stages connected to the shell Dock slot and marks Present/mobile unassessed.

### INFERENCE

1. `[EV-DOCK-001..003]` support a stable physical chassis and canonical command identity; they do not support freezing payload B for an entire Stage.
2. `[EV-DOCK-001,002,004]` show that a meaningful workspace transition inside a Stage can change task grammar. Treating all sub-context changes as forbidden would either expose the wrong tools or force a large union set.
3. `[EV-DOCK-003,005]` show that stable **roles and coordinates** for Select/Undo/Redo must be separated from their active editor/history adapters.
4. `[EV-DOCK-006]` caps status at design/code evidence. It cannot establish usability or parity for 3D, Present or mobile.

### PROPOSED / DECIDED PROVISIONALLY

`DA-DOCK-ANCHOR-001.1` — **Fixed chassis + bounded semantic payload**:

```
┌──────────────────────────────────────────────────────────────────┐
│ A · STABLE ANCHORS │ B · BOUNDED WORKING SET │ C · LIVE TASK    │
│ Select Undo Redo   │ max 4–8; one region      │ task/status      │
└──────────────────────────────────────────────────────────────────┘
```

1. **Chassis and zone coordinates never reflow across Stages.** A, B and C retain order, separators and restore point. The Dock may compact responsively but preserves the same reading order.
2. **Zone A is visually invariant:** Select, Undo and Redo keep canonical IDs, icon/label/shortcut and coordinates. Their execution adapter binds to the active editor/document/history scope. Unavailable commands remain at their coordinate with an accessible reason when the absence is a normal state; permission-forbidden actions are filtered before exposure.
3. **Exactly one region—B—may replace its working set.** B changes only on a declared semantic boundary event:
   - `stageChanged`;
   - `workspaceModeChanged` such as Sketch↔Pro or Model↔Paper;
   - `capabilityClassChanged` when the target crosses a declared capability class, not on every raw selection identity;
   - `userPackageActivated`;
   - `permissionCapabilityChanged` after authorization has been resolved.
4. **Raw `selectionId`, hover, camera change and transient sub-tool state may change enabled/disabled/active feedback but must not reorder or rebuild the Dock.** Immediate selection actions belong in Context Action/Action Lens or a transient dynamic control anchored above B.
5. **Zone C keeps its coordinate and reads a real queue/session source.** It may change content for queued/running/paused/error/completed work, but never invent percentage or success. No work means a quiet compact anchor; unreadable queue means Unknown/Retry, not zero/calm. Permission-filter payload before load.
6. **No full-Dock swap.** Context changes preserve A and C, animate only B, and restore focus to the corresponding command identity. Reduced motion replaces morph with an immediate labeled state change.
7. **User ownership wins.** A user-pinned command/package preserves its declared slot. AI may propose a package but cannot reorder, activate or persist it without approval.

### Scope

Allowed: visualization contract, zone/state/motion/responsive semantics, command identity mapping requirements.  
Forbidden: production/repo/canonical writes, new registry, queue engine, persistence schema, writer assignment, runtime PASS.

### Risks and early signals

| Risk | Early signal |
|---|---|
| Semantic boundary list grows into arbitrary adaptation | B rebuilds on raw selection IDs or changes more than once during a single selection sequence |
| Stable A invokes wrong history | Undo changes a different editor/document or view-state than the active work |
| B becomes union toolbar | more than 8 visible actions, multi-row overflow, or command search detours rise |
| C leaks project/client data | task label/team/thumbnail is available before permission filter |
| Mobile loses reach/meaning | target below touch gate, Dock overlaps navigation, or critical action becomes hover-only |

### Safety valve

- Feature flag `ifDockBoundedPayloadV1` (candidate name; Production Control/Architecture may map it) toggles the new projection.
- Preserve current `CadToolbelt`, `ToolDock3D`, Present Toolbar and StageToolbelt adapters until per-context runtime parity.
- Additive command projection only; no data/schema migration.
- Rollback: disable flag and restore previous carrier for the affected Stage; command IDs and task/history data remain unchanged.
- Checkpoint per surface: 2D Sketch → 2D Pro Model → 2D Paper → 3D → Present → tablet/mobile. Failure in one does not force rollout to the next.

### Canonical destination

This file is a visualization-workspace candidate, not canonical. After MAIN provisional routing and Product/Architecture/Quality review, an authorized writer may persist the decision through the canonical writer protocol. Chat alone is not durable truth.

## Evidence ledger

### EV-DOCK-001
Type `design target` · Source `docs/design-candidate/IDF-IF-PACKET-003/ux-target/03-TARGET-DOCK.md:34-63,73-101,126-136` · sha256 `6446b7c2515179dc3585bbfc4fca768f7a081c38972260a7d96e7c44b7310dfd` · Captured 2026-08-27 · Scope: candidate Dock anatomy, tests, Stage/subcontext intent and coverage limits · Sensitivity `internal` · Strength `medium` · Freshness: stale if source hash changes.

### EV-DOCK-002
Type `code` · Source `components/cad/CadToolbelt.tsx:3-18,33-45` · sha256 `663e4973b0687fcc49bbe96d4b2a6605052793376fb7e2f89c8c7a465689f2df` · Captured 2026-08-27 · Scope: current 2D mode/workspace-dependent Dock composition · Sensitivity `internal` · Strength `strong for code presence; not runtime usability` · Freshness: source hash.

### EV-DOCK-003
Type `code` · Source `components/render-studio/ToolDock3D.tsx:82-147,196-280` · sha256 `a0b2b1a1e1f399a223c2dc4427d8ef32db1856db13439d9993a1483a3d432451` · Captured 2026-08-27 · Scope: stable compact 3D coordinates, registry-derived shared commands and stage bindings · Sensitivity `internal` · Strength `strong for code presence; not runtime parity` · Freshness: source hash.

### EV-DOCK-004
Type `code` · Source `components/ui/StageToolbelt.tsx:116-144,171-180` · sha256 `bc4d5c93103d297c73e31eaa80b0fb80d72825a7c1e5d51d091f90a57e811cd4` · Captured 2026-08-27 · Scope: working set depends on Stage/source/selection and provenance input · Sensitivity `internal` · Strength `strong for implementation behavior; not UX quality` · Freshness: source hash.

### EV-DOCK-005
Type `code` · Source `components/present-editor/Toolbar.tsx:710-750` · sha256 `4713ba35d9812a36ea415227ce1388fcb9b7dc2afcb6e8578702b11994b2876b` · Captured 2026-08-27 · Scope: Present owns distinct selection/history adapters · Sensitivity `internal` · Strength `strong for adapter presence; not full Stage parity` · Freshness: source hash.

### EV-DOCK-006
Type `design target + code inventory` · Source `03-TARGET-DOCK.md:13-27,94-101,126-136` · same hash as EV-DOCK-001 · Captured 2026-08-27 · Scope: explicitly PARTIAL/NOT ASSESSED coverage · Sensitivity `internal` · Strength `medium` · Freshness: source hash or new runtime receipt.

## DISS-IF-DEC-DOCK-ANCHOR-001

Independent challenger: sub-agent `/root/dock_diss` · 2026-08-27 · **Verdict: MATERIAL_CONFLICT** against the original absolute trigger rule.

1. **Strongest objection:** Stage-only adaptation freezes the wrong boundary. Sketch/Pro and Model/Paper materially change task grammar inside 2D; either wrong tools remain or a union toolbar grows. Stable Select/Undo/Redo coordinates also do not prove one execution/history scope.
2. **Falsifier:** the absolute rule would require runtime evidence that all tasks remain correctly reachable without intra-Stage B changes, A always targets the correct history, no irrelevant/destructive command appears, and mobile collision/target budgets hold. One Paper-only task missing from frozen B or one wrong-scope Undo falsifies it.
3. **Scope mismatch:** evidence supports stable chassis/coordinates, but explicitly shows intra-Stage context changes and incomplete Stage/mobile coverage. It cannot support `stageChanged` as the only trigger.
4. **Privacy/license:** no direct new dependency, but queue metadata permission filtering is UNKNOWN. Reuse existing icon system; any new icon dependency would require license review.
5. **Safer alternative:** fixed chassis and exactly one adaptive B, with changes limited to explicit auditable semantic transitions; raw selection only changes state unless capability class changes. A binds to active scope. Flag and validate per context.

**Resolution:** accept the challenge and modify the decision to `DA-DOCK-ANCHOR-001.1`. The `MATERIAL_CONFLICT` is routed to MAIN with the safer alternative; no claim of approval, PASS or runtime proof.

## Proof matrix

| Surface | Design/code evidence | Runtime | Status |
|---|---|---|---|
| 2D Sketch | present | missing | `PARTIAL` |
| 2D Pro Model | present | missing | `PARTIAL` |
| 2D Paper | code path present | missing | `PARTIAL` |
| Visual+3D | partial adapters | full Dock parity missing | `NOT ASSESSED` |
| Present | separate toolbar/history adapter | unified Dock missing | `NOT ASSESSED` |
| Tablet/mobile | target notes only | missing | `NOT ASSESSED` |
| Queue privacy/status | source existence asserted by target | payload filtering missing | `NOT ASSESSED` |

Quality must independently define and run runtime proof before any `PASS`.

