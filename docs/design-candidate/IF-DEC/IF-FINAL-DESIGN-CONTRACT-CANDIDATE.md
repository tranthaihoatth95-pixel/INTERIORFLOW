# InteriorFlow — Final Design Contract

**Version:** 0.9 Candidate  
**Date:** 2026-08-26  
**Authority:** IF UX/UI · Design Authority  
**Status:** `CANDIDATE · EYE REVIEW REQUIRED · NOT RUNTIME-PROVEN`  
**Production writer:** none

This contract consolidates Hoà’s explicit directions, current design proposals, unresolved decisions and proof gates. It does not modify canonical product truth or authorize Production.

## 1. Product intent and non-negotiable laws

1. One global professional app, not a bundle of mini-apps. Canvas/object/work is the main character.
2. Simple entry, expert depth through progressive disclosure. Three levels add function, not enlarged decoration.
3. Interface lives in space and truthful work-time: no dead interaction, teleportation, fake progress or fake activity.
4. AI stands beside the author. It may explain, propose, preview and prepare; it never silently changes project truth, checkpoint, permission or approval.
5. Visual-first hierarchy: real object/image → semantic shape/state → canonical icon → short label → compact metadata → long text on demand.
6. Liquid Glass reduces chrome and preserves canvas. No glass-on-glass, decorative blur, glow wall or reduced readability.
7. Global neutrality: no TTT/client hardcode. Brand Kit is per project; app identity is neutral.
8. Real data only. Missing data disappears or states the truthful cause/recovery.

## 2. Accepted directions from Hoà

These are explicit user directions, not runtime acceptance:

- Left Router has two zones: **WORKSPACE** upper group and **STAGES** lower group, with compact 52px icon-only state and an Optical Hinge/zone accent candidate.
- WORKSPACE vocabulary currently includes Home, Projects, Inspiration, Knowledge and Library. Grouping is now permitted only through explicit review; no silent route deletion.
- STAGES: 2D Design; Visual Rendering + 3D Design; Presenting; canonical `+AI Create` in lower group.
- Top-right owns Personal/Search/Vitals/App Status. Vitals placement is capability-driven: notch Search+Vitals versus no-notch anchor/handrail. Smart Notification Stack is separate.
- Bottom is one cross-Stage Adaptive Work Dock. Top Bar is not a Stage toolbar. User Tool Package/layout overrides win over AI suggestions.
- Context Studio/ToolWindow is hidden by default, intentionally opened, and can dock/pin/move/resize/collapse/remember.
- Home has exactly two persistent states: Factory/Starter Home and Personalized/My Home. Customize is a transient nested mode.
- Living Showcase is Factory-dominant only in Starter Home; in My Home it is a resizable S/M/L feature widget, M landscape recommended. Its visual field is 16:9 where space permits, with focal/crop preview and no stretch.
- Home Dock remains separate: Resume Capsule + Project Reel/Lens + reveal Create.
- Present is Hybrid: direct composition plus structured pages/master/grid/notes/outline and PDF/PPTX/HTML/video targets. Deep Video/3D editing belongs Visual+3D Focused Editors.
- Vitals 023 is visually rejected. Vitals 025 is only a storyboard/animatic candidate.

## 3. Shared App Shell contract

### 3.1 Persistent chrome

- Left Router: stable app map, never a task toolbar.
- Top-right cluster: identity/presence, Search, Vitals, meaningful save/sync/connectivity/render/update state.
- Adaptive Work Dock: stable universal anchors; real running/recent tasks; current Stage package; one morphing dynamic control zone; minimized ToolWindows/support stack.
- Context Studio: coherent right-side work surface; hidden until requested; remembered after user pin/open.

Maximum normal chrome depth is three layers. L3 temporary surfaces cannot become permanent.

### 3.2 Depth

- L0: canvas/content.
- L1: persistent support.
- L2: active contextual tool/Context Studio.
- L3: Lens, popover, Vitals Capsule, preview.
- L4: focused modal/deep work, rare.

Every open/close/minimize/restore operation preserves source, destination, object identity and return path.

## 4. Product Resources candidate

### 4.1 Recommended architecture

Candidate Router label: **Nguồn & Tri thức / Resources**. Implementation candidate: `ResourceHub`.

One umbrella experience exposes three equally visible modes:

- **Cảm hứng / Inspiration:** lawful images, moodboards, references, creator/source/license/provenance.
- **Tri thức / Knowledge:** readable documents, notes, verified decisions and project knowledge.
- **Thư viện / Library:** reusable material/CAD/3D/IDFC/image/font/Present/template assets and where-used.

Search, ingest, saved filters, provenance, scope, permission and activity are shared services. Results keep semantic mode/type badges.

Existing Inspiration/Knowledge/Library deep links remain valid during migration. The existing `LibrarySheet` remains the one Library implementation and contextual apply/drag surface. The Hub may orchestrate it; it cannot clone it.

### 4.2 Knowledge exclusion

Customer Product Knowledge must exclude builder memory, agent memory, prompts, control-plane files, `_System`, backups, internal checkpoints and hidden implementation instructions. Exclusion must be enforced at indexing/query boundaries and tested for leakage.

### 4.3 Scope and promotion

Every item declares Personal, Project, Studio/Tenant or Public/Licensed scope; owner; permission; provenance/license; freshness; offline state; version and where-used.

Cross-mode movement is explicit:

- Inspiration → Save/Link/Propose; never silent Library/DNA promotion.
- Knowledge → cite/link decision; verification retained.
- Library → apply/use in current Stage; asset identity retained.
- Any DNA distillation creates a candidate requiring human approval.

## 5. Home contract

### 5.1 Factory / Starter

Lawful attributed Living Showcase may be full/dominant. It contains no fake personal/project data. Entry actions: Add Widget, Create Project, Open Project or keep Home minimal.

### 5.2 Personalized / My Home

User explicitly authors widgets, S/M/L sizes, position, pin, group/stack, background and lock. Auto Grid proposes valid vacancies/reflow but never adds/removes/reorders locked content without approval. Personal Home cannot change project truth, DNA, team Home or another user’s layout.

Theme Packs are Home-only bundles of lawful background plus coordinated surfaces/accents and protected semantic tokens. Error/warning/success/focus contrast cannot be overridden. Preview, Apply, Cancel, Undo, Restore and sync/local fallback are required.

### 5.3 Project Reel hierarchy

**DA-REEL-018.3a · PROVISIONAL conflict correction:** Home Bottom Dock uses the **horizontal fan-deck** when horizontal space and collision budget permit. The project cards extend as a horizontal deck, matching Hoà's direct intent and visual evidence. **Vertical slices/accordion** remain the compact fallback for narrow viewports, touch portrait, or failed collision budget—not a competing product model. Both representations preserve the same project identity, real cover and focal anchor, permission filtering, and L1 Cover → L2 Project Lens → L3 Full Project continuity. No autoplay. Keyboard/touch parity and reduced-motion states are required. A feature flag or user setting keeps both renderers available for eye testing and rollback; no data migration is allowed between representations.

- L1: authorized real-cover card/slice in Dock.
- L2: Project Lens with concise cover/name/year-code/phase/checkpoint/status/authorized people/latest update/next milestone/one real signal.
- L3: Full Project page with progressive modules.

Lens is navigation/preview, not editable dashboard. Same cover/focal/project identity persists. Create remains behind Reel head with discoverable reveal.

## 6. Stage contracts

### 6.1 2D

Canvas-centered drawing, deterministic measurement and dimensions. Context Dock provides common commands, optimized packages, numeric/palette controls and support stack. Ruler/calculator behavior remains a visual-test decision.

### 6.2 Visual+3D

Scene owns the field. Deep Focus may suppress nonessential chrome while preserving selection, project/stage, units, save/sync, Undo, Escape/Back and recovery. Context clusters: object/transform, material, light, camera, render/review. UI text remains screen-space; navigation is bounded by Frame Selection, Home View, orientation, scale and camera history.

### 6.3 Present Hybrid

One semantic presentation document supports direct manipulation and structured pages/master/grid/guides/notes/outline. Exports: PDF, editable PPTX, responsive HTML and video, each with capability/fidelity/fallback/round-trip declaration. Live 3D in HTML may fall back to poster/video in PPTX.

## 7. Vitals contract

Vitals consumes structured project/stage/selection/task/checkpoint/evidence context. It never silently mutates truth.

Hierarchy: L1 core → L2 short Speech Capsule → explicit L3 Conversation Workspace. Thread, target, sources, attachments, proposals and approvals persist across expansion/collapse.

025 target: exactly three strong organic strokes; light/dark/AI-gradient variants; 2–3 distinct perimeter filaments braid/compress into the exact mark and bloom internally. No particle cloud/equal ring/external fog spectacle. All states retain identity: Dormant, Summon, Ready, Listening, Thinking, Acting, Awaiting confirmation, Success, Warning and Offline.

Speech Capsule is not Notification Stack, chat panel, Action Lens or main command input. Critical confirmation never auto-hides. Long output opens linked object/context result or Conversation Workspace.

025 remains `STORYBOARD/ANIMATIC · DESIGN MISSING` until mark geometry, motion curves, timing, shader, performance, reduced modes and eye approval exist.

## 8. Collaboration, people and field

Identity, presence, membership, assignment, role, permission and invitation are distinct.

Manage Team previews role/permission impact and requires explicit confirmation. Existing owner-only management, revision conflict and last-owner guard remain. Invitation lifecycle is architecture-missing.

Personnel Profile is permission-filtered L2: personal fields allowed by policy; distinct project membership/role/presence; meaningful contribution; authored templates/assets/knowledge. Avatar never implies permission.

Site/Field supports separate geographic and drawing coordinates, offline capture, evidence, review/verification, issue/checkpoint/resolution and before/after retention. AI may draft or suggest links; humans verify location, measurement and closure.

## 9. AI Create and editor inference

All generation produces editable, provenance-bearing output. Quick and Guided Background Removal retain original plus editable mask. Visible mask, Before/After, uncertainty, zoom edge inspection, user confirmation, manual refine, alpha export and undo are mandatory.

Action Lens resolves canonical command ids. Vitals no-prompt actions disclose target/context/source/impact/cost-time/preview/undo. Habit Memory is opt-in, repeated-confirmation based, scoped, inspectable and resettable.

## 10. Command and input contract

Canonical command record: id; VI/EN label; icon; category; scope; availability; run adapter; default shortcuts; user overrides.

Observed shared registry ids:

| ID | Command | Current evidence |
|---|---|---|
| `cad.sel.select` | Select | CAD; 3D bound; Present unavailable |
| `cad.sel.delete` | Delete | CAD; 3D selection-aware; Present unavailable |
| `cad.sel.undo` | Undo | CAD/3D; Present locally bound |
| `cad.sel.redo` | Redo | CAD/3D; Present locally bound |
| `cad.edit.move` | Move | CAD; 3D bound; Present unavailable |
| `cad.edit.copy` | Copy | CAD; 3D bound; Present unavailable |
| `cad.edit.rotate` | Rotate | CAD; 3D bound; Present unavailable |
| `cad.edit.mirror` | Mirror | CAD; adapters incomplete |
| `cad.dim.measure` | Measure | CAD; 3D bound; Present unavailable |
| `cad.draw.text` | Text | CAD; adapters incomplete |

Persistent Dock candidate: Select + Undo/Redo cluster + true Recent/Running Tasks. Pan remains gesture/shortcut/contextual touch affordance until a unified registry adapter exists. Other commands are contextual/package tools.

Input states for every command: hidden only by permission/security; visible enabled; visible unavailable with reason; active; accepted; running with measured/indeterminate truth; succeeded; failed; cancelled. No silent click.

Shortcut editor must support scoped conflicts, text-entry/IME guard, protected navigation/cancel paths, Cmd/Ctrl semantic mapping, profile import/export and package activation by command identity.

## 11. Empty, loading, offline, error and permission

Every surface specifies:

- no-data behavior: disappear, lawful starter state or concise creation path;
- loading: measured when measurable, cancellable for long work;
- stale/offline: last verified time and available local actions;
- permission denied/revoked: filter before load, no leaked thumbnail/team/activity/location;
- conflict: compare, owner/source, recovery and non-destructive resolution;
- missing source/license: stop display/use, retain provenance and recovery/report path;
- error: what happened, why if known, next action; never fake success.

## 12. Responsive and accessibility

- Desktop, 1100px, large/DPI, tablet landscape/portrait/split view and external displays.
- Keyboard, mouse, touch and pen; no hover-only critical path.
- WCAG 2.2 AA target where applicable; visible focus, screen-reader labels/order, semantic status, contrast and touch targets.
- Reduced motion replaces travel with shape/static depth; reduced transparency uses solid hierarchy; high contrast preserves semantic states.
- Tablet Pen-first: pen edits, finger navigates under explicit mode; palm rejection; configurable supported stylus controls; magnified precision/snap; non-dominant-hand modifiers; units/selection/constraints remain visible.
- VI/EN expansion, Unicode Vietnamese, locale formats, metric/imperial, timezone and RTL-ready layout direction.

## 13. Provenance, privacy and global scope

Tenant/project isolation and least privilege apply before fetch/render. Personal connector/widget/background consent and scope are explicit. No credentials or PII in prompts/logs/templates/screenshots.

Media/document/template records retain owner/source/license/version/freshness/where-used. AI-generated caption/summary/page selection is labeled. Standards advice is jurisdiction/version/source/effective-date scoped and requires professional verification.

## 14. Unresolved Hoà decisions

1. Approve Resource umbrella `Nguồn & Tri thức / Resources` with three visible modes, or choose 3 top-level / 2-route model.
2. Project Reel final eye approval: horizontal fan-deck default and vertical compact fallback; architecture is provisionally decided under `DA-REEL-018.3a`.
3. Vitals 025 static mark/storyboard direction.
4. Quick Voice Note: Home, Project or both.
5. Concave treatment for existing canonical `+AI`.
6. Factory typography: Showcase overlay, Minimal Theme or defer.
7. Exact official Tender/Ademark product names/URLs.
8. Default 2D ruler behavior and final persistent Dock set after runtime tool adapter proof.

## 15. Implementation dependencies

- Resource search/permission index; Inspiration repository; Knowledge verification; Hub orchestration of existing LibrarySheet.
- Invitation service/schema; Personnel privacy fields; template ownership/version/compatibility.
- Cross-Stage command adapters and shortcut-profile persistence.
- Vitals production mark/motion/shader and performance/accessibility prototypes.
- Lawful Explore and Theme providers; map provider/license/residency/calibration; field mobile sync/redaction.
- Present export fidelity engines and format fallbacks.
- Personal Home layout/background isolation and sync conflict policy.

## 16. Runtime proof and approval gate

Required evidence includes:

- screenshots/video from real Electron/runtime at target displays and input modes;
- machine tests for permissions, command identity, shortcut conflicts, conversion/locale, persistence and no-preload leakage;
- keyboard/touch/pen/screen-reader and reduced-mode human checks;
- performance measurements for motion, blur, live preview, maps, 3D and video;
- golden exports for PDF/PPTX/HTML/video and specialist fidelity review;
- professional/legal/accessibility/security review where required;
- no fixture data and no mock counted as runtime proof.

Promotion sequence: Hoà eye-review direction → resolve/defer conflicts → name current target artifacts → assign one Production writer → implementation → machine verification → real runtime proof → Design Authority comparison → Hoà acceptance. This document cannot self-promote.

## 17. Current review pointers

- Final Review Room: `if-final-review-room-026.html`
- Resource Experience: `if-resource-experience-027.html`
- Vitals storyboard: `if-vitals-redesign-025.html`
- Consolidated research/spec history: `IF-UX-COMPLETE-SPEC-010.md`
# Decision Autonomy Protocol · Candidate addendum 2026-08-26

> Task-first interaction extension: [`IF-TASK-FIRST-INTERACTION-CONTRACT-028.md`](./IF-TASK-FIRST-INTERACTION-CONTRACT-028.md) and visual [`if-task-first-interaction-028.html`](./if-task-first-interaction-028.html). It adopts `DA-PHIL-028.1`, `DA-VIS-028.1`, `DA-MOTION-028.1` and `DA-DEPTH-028.1` as reversible candidates.

> Dock anchor decision: [`IF-DEC-DOCK-ANCHOR-001.md`](./IF-DEC-DOCK-ANCHOR-001.md). `DA-DOCK-ANCHOR-001.1 PROVISIONAL` keeps fixed A/B/C chassis and one bounded payload B, but accepts independent `DISS` that rejects `stageChanged` as the only trigger. B may change only on declared semantic boundaries; raw selection identity cannot rebuild the Dock.

Design and implementation authorities decide reversible professional details by default after checking IF Canonical, global/human-centered intent, repository/runtime evidence, and relevant primary research. Decisions use stable IDs and remain **PROVISIONAL** until their applicable approval/proof gate is passed. Hoà is not asked to arbitrate micro-decisions that the evidence and product vision already resolve.

Every autonomous decision must preserve a safety valve appropriate to its risk: versioned decision ID, feature flag or user setting where meaningful, small checkpoint, undo/rollback, non-destructive migration, retained provenance, and preservation of the prior implementation until runtime parity. Chat is not durable truth; accepted outcomes must later enter canonical/decision/evidence artifacts through the authorized writer protocol.

Only Hoà gates final eye/brand approval, business intent, material cost/legal/privacy choices, destructive or hard-to-reverse actions, and genuinely product-defining alternatives that remain equally valid after research. A blocked decision must carry a recommended default, reason, impact of silence, reversible work that can continue, and rollback path. No writer, approval, PASS, or runtime proof is inferred from this protocol.

## Authority reset and Design Authority backlog routing · 2026-08-26

This candidate follows the active authority map: MAIN coordinates/conflict-gates; Design Authority owns UX/UI/interaction/visual contracts and writes only in the visualization workspace; Product owns domain/value/capability/acceptance semantics; Architecture owns ADR, boundaries, storage, sync and technical contracts; Quality owns audit/gates/evidence; Research supplies primary evidence; Production Control packages implementation and verifies writer lease. Placement claims from older Product/Production reports are superseded by this Design Authority contract plus MAIN conflict gates.

### KEEP — Design Authority

- `DA-RESOURCE-027.1`: one product-facing **Resources / Nguồn & Tri thức** umbrella with visible Inspiration, Knowledge and Library modes; legacy routes/deep links remain.
- `DA-REEL-018.3a`: horizontal fan-deck default; vertical slices compact fallback.
- Shell, Home two-state visual system, Router zones, Vitals placements/storyboards, Adaptive Work Dock, Context Studio, Action Lens, Focused Editor transitions, responsive/input/accessibility visual behavior, and all eye-review artifacts.
- Product-facing distinction in the interface: Knowledge is a visible Resources mode while remaining cross-cutting as a capability; **Sources / Nguồn** is object/ingest vocabulary and not a route or umbrella replacement.
- `.idfc` is represented only as an existing content-item package. No EFCS surface or claim exists without evidence.

### TRANSFER — retained as dependency, not decided here

- To Product: jobs/value flow, capability boundaries, backlog priority and acceptance semantics for Resources, Knowledge, personnel, templates, Flow, Site/Field and AI.
- To Architecture: tenant/project/personal data boundaries, storage/indexing, route aliases, sync/offline/conflict, invitations, provenance schemas, connectors and migrations.
- To Quality: runtime proof matrix, permission-before-load evidence, accessibility conformance, performance budgets, export fidelity and PASS/FAIL gates.
- To Research: verified primary evidence for named external products, lawful sources, map providers, licensing and professional patterns.
- To Production Control: implementation packet, stable IDs/flags, writer lease, scope and evidence plan after eye approval where required.

### DROP-DUPLICATE / SUPERSEDED

- Any second Library shell, duplicate Knowledge store, top-level Sources route, builder-memory-as-product-Knowledge model, EFCS assumption, second Home `+AI`, notification/Vitals conflation, or stage toolbar in Top Bar.
- Older Product/Production placement proposals that conflict with this contract.
- Vertical-slices-as-default, three-route A/B indecision, and micro-decisions already resolved provisionally.

Transferred work remains visible only as a dependency pointer. Design Authority does not author its domain/ADR/gate conclusion and does not infer canonical persistence from chat.
