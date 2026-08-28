# IF UX/UI Complete Spec 010

**Version:** 0.10 · **Date:** 2026-08-25 · **Status:** CANDIDATE · **Authority:** Design proposal only  
**Production writer:** NONE · **Approval:** NOT APPROVED · **Runtime proof:** NOT RUN

## 1. Product intent

InteriorFlow is one professional spine, not a bundle of mini-apps. One project object persists across 2D, 3D, render, Present, BOQ, review and knowledge. Humans own intent, judgment and approval; AI proposes, explains and generates; deterministic systems verify truth.

Human-centered gates:

- Every visible element must serve a named human action.
- Canvas/content is primary; shell and system state recede.
- Real data only. Missing data disappears or reports the truth.
- Progressive disclosure: enough to decide, deeper only on demand.
- User layout and package overrides beat machine adaptation.
- No dead interaction; no fake success or progress.

## 2. Terminology

- **WORKSPACE / `WorkspaceNavGroup`:** upper Floating Left Bar group only: Home, Projects, Inspiration, Knowledge, Library.
- **STAGES:** lower group: 2D Design, Visual Rendering & 3D Design, Presenting, + AI Create.
- **Domain `Workspace`:** existing Project→Workspace→Canvas entity. Never use bare “workspace” in implementation/design handoff without qualifier.
- **Canvas / Editor / Stage Surface:** central working region.
- **Shared App Shell:** global shell around all Product/Editor surfaces.

## 3. Shared App Shell

### 3.1 Floating Left Bar

Global navigation only; never task tools.

| Level | Content | Behavior |
|---|---|---|
| Compact | 52px, glyph only | Hover/focus/long-press shows source-anchored label; no canvas shift |
| Open | Persistent labels | Same routes and order |
| Functional | Labels + scoped route context | Adds useful status, never larger decorative icons |

WORKSPACE and STAGES use intentional breathing space. Preferred accent is **Optical Hinge**: one glass body, a non-interactive micro-notch at the gap and subtle edge-density change. Alternative Dual Chamber is clearer but adds chrome. Active route remains stronger through shape, position indicator and `aria-current`; never color alone.

Disabled routes stay focusable when a recovery/read-only path exists and expose an accessible reason. Labels require viewport collision handling.

### 3.2 Top-right cluster

Hierarchy:

1. Meaningful app status: save/sync/connectivity/render/queue/update, compact and event-driven.
2. Search + Vitals according to display capability.
3. Personal/profile/presence.

Top Bar never becomes a Stage toolbar.

**Notch-capable display:** Vitals lives inside Search with GLANCE/CONTEXT/DEEP. Smart Notification Stack occupies the notch separately: IDLE/ONE/MANY/OPEN.  
**No-notch/external display:** tiny Vitals anchor at right edge + 2px interaction rail at Top Bar/Canvas boundary. Rail states IDLE/HOVER-TRACK/CONTEXT/DEEP. Detection uses window/display capability and reserved safe area, not OS string. User override is allowed.

## 4. WORKSPACE surfaces

| Surface | Primary content | Context mechanisms |
|---|---|---|
| Home | Resume or Open/Create Project | Last-exited task; authorized project reel |
| Projects | Project list/identity | Flow, milestones, review, versions, activity, team |
| Inspiration | Real imagery and collections | Capture, filters, collaborative curation |
| Knowledge | Decisions/rules/sources/relationships | Map only when relationships answer the task |
| Library | Real files/assets/list | Upload, filters, where-used, provenance |

Inspiration is not silently renamed Design DNA. Knowledge is not silently renamed Sources. Design DNA and Sources require visible placement within Projects/Knowledge/Library without replacing Hoà’s routes.

## 5. Home

Home does only three jobs:

1. **+ Create Project** — stable left dock anchor.
2. **Resume Capsule** — one last-exited task, last stable frame, Stage, save/sync and one Continue action.
3. **Project Reel** — authorized project covers, horizontal snap/trackpad/swipe.

These must not share the same silhouette. Recommended project motion is Reel; Fan/Stack harms scanning and occludes identity, while magnifying Filmstrip risks reflow and motion load.

**Project Lens (L3):** hover/focus/touch inspection showing authorized cover, human-readable year/code, user role, permitted team/presence, current Stage/status, latest meaningful update, next milestone/action and sync/offline/stale state. Actions: Open Project, Continue task when real, Details. It is temporary and never a full Project window.

Quick Create fields: project name, year/code, type/template; optional cover/client/location. Validate duplicate codes, required fields, create permission and offline errors. `Create Quick` writes real project truth; `Full Setup` opens Projects.

No last task → Resume disappears. No authorized projects → Reel disappears. No create permission → hide `+` or expose policy-approved accessible reason.

## 6. STAGES

### 6.1 2D Design

Precise, flat-first, measured. Canvas dominates. Context tools: Move, Rotate, Replace, Material, Comment. Measurement is deterministic.

### 6.2 Visual Rendering & 3D Design

One Stage with visible pipeline: Model → Scene → Materials → Lighting → Camera → Render → Video. Viewport dominates; deeper material/render/video work enters ToolWindow or deep focus.

### 6.3 Presenting

Recommended **IF Hybrid**:

- Canva-like direct manipulation and flexible templates.
- PPT-like pages, outline, master, grid, notes and predictable export.
- Linked objects from 2D/3D/Library/Project DNA.
- Auto-outline ready but never silently applied.
- Editable PDF/PPTX/HTML/video outputs with provenance.

Present packages existing content; it does not silently manufacture new design content.

## 7. Adaptive Work Dock

One Dock persists across Home and all Stages. Home is a variant, not a separate Dock.

| Zone | Purpose |
|---|---|
| 1 | Stable universal anchors |
| 2 | Recent/running task multitasking strip |
| 3 | Current Stage/task Tool Package |
| 4 | One morphing dynamic control zone |
| 5 | Minimized ToolWindows/support stack |

Recommended persistent visible set: **Select, Undo, real Tasks**. Redo may group with Undo. Command Search stays Top/keyboard. Fit, Review and Import are package/contextual, not persistent. Save is status under autosave, not a manual-looking button.

Tool representation:

- **ICON:** immediate common command; 32px pointer / 44px touch minimum.
- **GROUP:** related command family, last-used face or category preview.
- **PACKAGE:** saved 4–8 command identities; user order persists.
- **MINI-WINDOW:** minimized active ToolWindow with owner context and last stable frame.
- **DYNAMIC CONTROL:** palette, scrubber, numeric/material control for current task.
- **SUPPORT STACK:** infrequent helper; expands without reflow.

Recent/running tasks appear across Stages only when real. Hover/focus opens scoped Exposé-like previews; touch opens a sheet; keyboard cycles. Full history stays in Projects/Activity.

Minimized ToolWindow retains owner task/context, unsaved state, real progress and prior dock/float position. Expensive live previews use the last stable frame. Pin, minimize and close are distinct.

## 8. Tool placement

| Layer | Allowed content |
|---|---|
| Always visible | Very small universal set |
| Context Dock | 4–8 working-set commands and dynamic controls |
| Flyout | Variants and low-frequency choices |
| ToolWindow | Deep, movable/dockable/resizable tool |
| Context Studio | Selection/space work panel, hidden by default |
| Deep focus | Complex material, video timeline, export setup |
| Reject duplicate | Second/third toolbar or local command identity |

Research synthesis: AutoCAD favors customizable top/status tools and can hide chrome for drawing area; Photoshop separates application, tools, options, contextual task bar and customizable panels; 3ds Max combines a top toolbar with a dockable Command Panel and custom toolbars. IF adopts their stable identity and personalization mechanisms, not their skins. Hybrid trade-off: Bottom Dock improves touch/direct manipulation and multitasking but must cap length and prevent canvas occlusion.

## 9. Context Studio

Candidate name for the normally hidden right work panel. Each WORKSPACE surface and Stage supplies its own contextual content through one grammar. It supports open, pin, move, resize, collapse and remembered layout. OPEN/PINNED never auto-hide. Empty selection shows useful surface properties, not a blank panel.

## 10. Personal widgets

Only users create widgets from image, shortcut, link, command, permitted live data, saved view/filter, Project, asset, person or task. Model includes crop/cover/title/action/refresh/source/permission/scope/provenance.

Three functional size levels:

- S: identity + primary action.
- M: adds meaningful status/filter/detail.
- L: adds history/where-used/secondary actions.

Resize supports handle, snap/grid, min/max, restore default, keyboard and touch. Layout is personal/local and never changes project truth. Safety states: missing source, offline, revoked permission, stale data and privacy scope.

## 11. Concept Room

Do not add Collaboration Stage 4. Collaboration is cross-cutting capability. Candidate is **Concept Room in Projects**, connecting Inspiration, Knowledge and Library.

Flow: Inputs → Brainstorm/Team Room → Approved Moodboard → Decision Board → Project DNA Candidate → Human Approval Gate → canonical Project DNA.

Proof required before considering Stage promotion: distinct professional output, stable lifecycle, low duplication and clear routing.

## 12. IF Living Interaction System

Candidate name: **Hệ Tương Tác Sống / IF Living Interaction System**.

### No dead interaction

Every valid input acknowledges immediately: hover/focus/press, selection, drag/drop, open/close/resize/dock/pin, command lifecycle, save/sync/offline/conflict, AI/render progress. No silent clicks, fake success or fake percentage.

### Causal continuity

Surfaces expand from sources and close to sources. Objects do not teleport. Reorder uses ghost + insertion target. AI results appear in related regions with provenance.

### Spatial depth

- L0 canvas/content.
- L1 persistent support.
- L2 active contextual tool/inspector.
- L3 temporary preview/popover/Vitals.
- L4 rare focused modal/deep work.

Higher means more temporary; permanent L3 is a depth error. Depth uses position, occlusion, edge, material and focus—not shadow alone.

Motion bands from current law: press 100–160ms; contextual reveal 140–200ms; inspector 180–260ms; Stage 240–380ms; morph 300–700ms. Motion is short, interruptible and token-driven. Living does not mean constant animation.

## 13. Liquid Glass

Glass exists to reduce chrome mass and make canvas/content feel continuous and larger. Use mainly for temporary floating shell, Left Bar, Dock, mini-toolbelt, Vitals, popovers and ToolWindow edges. Precise reading/editing surfaces remain stable and opaque enough.

No glass-on-glass, thick blur, decorative glow or permanent glass wall. Idle panels recede; focused panels become sufficiently solid. Reduced transparency must preserve hierarchy. Acceptance: squint test, usable canvas measurement and blur-off readability.

## 14. Command and custom shortcut system

### Canonical command record

```ts
CommandDef {
  id; labelVi; labelEn; icon; category; scope; availability;
  runAdapter; defaultShortcuts[]; userOverrides[];
}
```

Tool Packages store command IDs, never duplicate implementations. Shortcut profiles are personal settings, separate from project truth.

### Scopes

- Global.
- WORKSPACE surface.
- Stage: 2D / Visual+3D / Present.
- ToolWindow / Context Studio.
- Text-entry guard.
- Optional selection/object-type condition.

One key cannot run two commands in the same active scope/state. `Keep both` is allowed only when scopes provably cannot overlap.

### Shortcut Editor

1. Search command.
2. Show current/default assignments and availability.
3. Press key/chord to record.
4. Detect conflict in effective scope.
5. Choose Replace / Keep both if scopes disjoint / Cancel.
6. Clear/reset one command; reset category/all.
7. Export/import profile.
8. Named profiles by role, workflow and device.
9. Explicit sync policy with local/offline fallback and merge conflict handling.

Support modifier chords, optional two-step sequences and alternatives. Single keys are allowed only outside text entry and where safe. Escape/cancel, Space/pan, Delete and required navigation receive protected/reserved policies. Map Cmd↔Ctrl by platform while storing semantic modifier tokens. Test keyboard layout, IME and Vietnamese input.

Discoverability: shortcuts appear in menus, tooltips, command palette and Dock; editor filters used-recently/unassigned/conflicts; optional Learn Mode. Every meaningful pointer action has a keyboard path. Required cancel/navigation cannot be removed without replacement.

Users may bind `activate Tool Package` and `open recent task`.

### Current fragmentation and migration order

Observed evidence:

- `lib/commands/registry.ts` is the intended central registry.
- `toolbar-source.ts` reads it for shared faces.
- `CadToolbar`, `ToolDock3D`, Present Toolbar/Inspector, material/color/video/review/export still expose fragmented local faces.
- `ToolDock3D` documents disabled/unwired tools; CAD runner is not fully registry-driven.
- `lib/shortcuts.ts`, hardcoded listeners and local tool definitions remain parallel sources.

Candidate migration order:

1. Inventory every executable command and owner; classify dead/unwired/duplicate.
2. Stabilize command IDs, scopes, availability and run adapters.
3. Merge shortcut metadata into semantic command records while preserving required legacy aliases.
4. Make CadToolbar, ToolDock3D and Present faces read the same records.
5. Introduce conflict-safe user overrides and profiles.
6. Bind Tool Packages to command IDs.
7. Remove duplicate listeners only after runtime parity proof.

## 15. Accessibility and responsive behavior

- Pointer, keyboard, touch and stylus have equivalent meaningful paths.
- Touch targets ≥44px; no important hover-only action.
- Compact labels appear on hover, focus and long-press.
- Reduced motion replaces travel/scale/wave with state, shape and static depth.
- Reduced transparency preserves hierarchy.
- Color and motion never act alone.
- 1100px collapses packages/support before hiding primary content.
- Left/right handedness and stylus reach are tested; user placement override wins where safe.

## 16. Truth, permission and recovery

Identity, presence, assignment and permission are separate. Never infer rights from avatar/presence. Authorized data is filtered before preload to prevent project identity, cover, team or status leaks.

Activity records semantic actor–action–object events, not telemetry. Version restore requires compare, affected-object disclosure, recovery version and Undo. Offline, stale, missing source, permission revoked, conflicts and errors must report truth and offer recovery.

## 17. Testing and approval gates

Required proof after Hoà eye approval and writer assignment:

- App runtime, verified source identity.
- Home, five WORKSPACE surfaces and three Stages.
- MacBook notch and no-notch/external display.
- Large desktop, 1100px, touch/stylus, keyboard-only.
- Light/dark, reduced motion and reduced transparency.
- Command accepted/running/success/failure/cancel.
- Drag/drop valid/invalid; Dock minimize/restore; panel pin/move/resize.
- Real progress vs indeterminate; save/sync/offline/conflict.
- Permission filtering and no-data disappearance.
- Shortcut conflict, IME/text guard, import/export profile.
- Squint hierarchy and usable canvas measurement.

No mock counts as runtime proof. Only Hoà can promote CANDIDATE to APPROVED.

## 18. Traceability

- 002B: Vitals display variants.
- 005: WORKSPACE upper-group scope and five surfaces.
- 006: shell, Router, Context Studio, widgets, motion, Optical Hinge.
- 007: Stage docks, Present/Collaboration decisions, Living Interface stateboards.
- 008: one cross-Stage Adaptive Work Dock; supersedes separate Home Dock architecture in 007.
- 009: exact Home correction; supersedes Home content in 007/008 only.
- 003/004: superseded in scope and terminology; research evidence only.

## 19. Executive review

**Strengths:** one mental model, strong content hierarchy, personalized but stable Dock, display-aware Vitals, true-data discipline, cross-Stage command identity, explicit recovery and accessibility.

**Risks:** Dock can become long; Context Studio can duplicate ToolWindows; five WORKSPACE surfaces need domain placement for Design DNA/Sources; shortcut migration can break muscle memory; glass/motion can become ornamental without runtime eye tests.

**Contradictions resolved:** WORKSPACE terminology; Home content; Vitals notch/no-notch; Recent signal/task/preview/history; collaboration capability vs Stage; Present freeform vs structured output.

**Still missing:** exact command inventory and persistent set by Stage; runtime capability detection API; personal layout/package sync owner; permission policy for create Project; detailed lock/offline merge states.

## 20. Minimal decisions for Hoà

| ID | Decision | Recommended |
|---|---|---|
| D1 | Present direction | IF Hybrid |
| D2 | Collaboration placement | Concept Room in Projects, not Stage 4 |
| D3 | Left zone accent | Optical Hinge |
| D4 | Right panel label | Context Studio / Vietnamese label still open |
| D5 | Home project motion | Project Reel |
| D6 | Persistent Dock set | Select + Undo + real Tasks |
| D7 | Default 2D ruler behavior | Needs Hoà choice after visual test |
| D8 | Shortcut profile sync | Personal cloud sync + explicit local fallback |

## Appendix A — Present Multimedia 011 · CANDIDATE

### A1. One shell, multiple editor lenses

IF uses one semantic document and one object identity. The **Composition Canvas** supports direct arrangement; **Focused Editor / Chế độ Chuyên sâu** supplies the specialist grammar for video, 3D and page work. Compact ToolWindow → dock/float → focused editor are representations of the same object, never duplicated documents. Enter and return preserve selection, page, camera and playhead.

- Present owns assembly, pages, master/grid/guides, notes, outline and predictable multi-target export.
- Visual+3D owns full video tracks/cuts/keyframes/audio/render and full 3D model/scene/material/light/camera work.
- Present may trim, set volume/poster/captions/timing, embed live 3D or a saved camera/turntable/render derivative. `Open in Video Editor` and `Edit 3D` open the specialist lens with the same media identity.
- Entry paths: object context action, Adaptive Work Dock and shortcut. A corner affordance may aid discovery but is not the only path.

### A2. Output contract

The same presentation document targets PDF, editable PPTX, responsive HTML and video. Capability/fidelity/fallback is previewed before export. Interactive 3D may remain live in HTML; PPTX receives a declared poster/video fallback. External round-trip limits are explicit; the IF source remains editable. Export always exposes accepted/running/progress/succeeded/failed/cancelled states.

## Appendix B — Flow Compass 012 · CANDIDATE

### B1. One source, two representations

`IF-PRODUCT-FLOW` is the single Flow/Checkpoint source. **Checkpoint Beacon** is compact current-state orientation in the top-right cluster; **Flow Compass** is the detailed user-pinned widget or Context Studio/Dock surface. Home Resume Capsule and Project Lens read this source but do not create another Flow widget.

Checkpoint candidate fields: id, project, flow, stage, task, status, owner, timestamps, entry/exit criteria, evidence, blockers, dependencies, approvals, valid transitions, provenance/version/sync. States: not started, active, paused, blocked, review, approved, complete, stale, unknown. Percentage is allowed only when measurable.

- Beacon opens a compact timeline/checkpoint stack; notification means an event/change, while Beacon means current state.
- Compass S shows stage/state; M adds task, last/next checkpoint and save/sync; L adds evidence, blockers, owner, dependencies and actions.
- Jump/resume/request review are permission- and transition-validated. Unknown, stale, offline and denied remain truthful states.
- Vitals reads structured project/domain-workspace/stage/selection/task/checkpoint/evidence/blocker context. AI may explain, suggest, prepare and identify missing evidence; it cannot silently advance, close or rewrite checkpoint/project truth. Suggestions cite source context and impact.

## Appendix C — Visual-First Content Law · REQUIREMENT

Hierarchy: **real image/object → semantic shape/state → canonical icon → short label → compact metadata → paragraph on demand**. Compact/Open/Functional-Deep levels add function, not enlarged decoration.

- Dock/tool: icon plus short discoverable label. Mini-window: title, one state line, one primary action. Lens: three to five concise facts. Error: what happened, why, next action.
- One command identity keeps one icon, label and shortcut across Router/Dock/menu/palette. Rare, destructive or high-stakes actions cannot rely on ambiguous icon-only treatment.
- Use real permitted previews; missing images collapse without empty frames. Images retain provenance, license/privacy and alt text.
- Vietnamese typography, VI/EN expansion and professional translatable terms are verified. Actions use verbs; places/objects use nouns; internal ids stay hidden.
- Keyboard focus text, screen-reader descriptions and touch previews carry the meaning that hover tooltips provide visually.

## Appendix D — Global Product + Standards Law · REQUIREMENT + VERIFICATION

### D1. Requirements

- **Neutrality:** independent global product; no studio/client hardcode. App identity is neutral; Brand Kit is per project. Examples/assets are licensed, replaceable and globally neutral.
- **Locale:** VI/EN first-class, more locales structurally possible; Unicode Vietnamese, locale date/time/timezone/calendar/number/currency/decimal/plurals, text expansion and RTL-ready layout direction.
- **Domain:** metric and imperial; explicit length/area/angle/quantity; ISO A-series plus Letter/Legal; deterministic scale, precision and conversions. Every building/design rule is jurisdiction-, version-, source- and effective-date-scoped. AI advice never masquerades as compliance.
- **Access/input:** WCAG 2.2 AA target where applicable; keyboard, mouse, touch and pen; visible focus, labels, contrast, target size, high contrast, reduced motion/transparency; no hover-, color- or motion-only critical path.
- **Platform:** display-capability detection for notch/no-notch/external displays; 1100px/large display and DPI; semantic Cmd/Ctrl mapping with layout/IME guards; graceful GPU/blur/live-preview degradation.
- **Content/output:** PDF/PPTX/HTML/video and professional formats declare fidelity, fallback and round-trip; font embedding/licensing, media/3D provenance/privacy and export version/units/language/timezone are explicit; no fixture production data.
- **Privacy/security:** least privilege and tenant/project isolation; filter covers/team/activity before load; explicit offline/cache/stale/revoked states; scoped consent for widgets/connectors; no credentials/PII in prompts, logs, templates or screenshots.
- **Reliability:** performance budgets for glass/motion/live thumbnails/3D/video; autosave, sync, conflict and recovery; cancellable long work with measured versus indeterminate progress; explicit cross-device source truth and conflict rules.

### D2. Global compliance matrix

No item may be called global, accessible or standards-compliant without linked proof.

| Requirement | Scope | Standard/source | Design evidence | Code owner | Test | Runtime proof | Status | Exception/expiry |
|---|---|---|---|---|---|---|---|---|
| VI/EN expansion and locale formats | App shell/content | CLDR/BCP 47; product locale list | 013 stateboard | TBD | pseudo-locale + snapshots | Required | NOT ASSESSED | — |
| Keyboard/focus/contrast/targets | App surfaces | WCAG 2.2 AA target | 006/007/013 | TBD | automated + keyboard + screen reader | Required | NOT ASSESSED | — |
| Metric/imperial conversion | Project/domain objects | project unit policy | 013 stateboard | TBD | deterministic round-trip | Required | NOT ASSESSED | — |
| Permission-filtered previews | Home/Dock/Compass/widgets | security/tenant policy | 009/012/013 | TBD | authorization + no-preload test | Required | NOT ASSESSED | — |
| Export fidelity and fallback | Present | format/version profile | 011 matrix | TBD | golden exports + professional review | Required | NOT ASSESSED | — |
| Reduced modes and GPU fallback | Shell/editors | OS capability + product budgets | 002B/006/013 | TBD | device/runtime matrix | Required | NOT ASSESSED | — |

Statuses are only `NOT ASSESSED`, `PARTIAL`, `PASS`, `FAIL`, `NOT APPLICABLE`. Exceptions require accountable owner, rationale and expiry.

### D3. Specialist confirmation required

Legal/privacy/tenant policy; accessibility audit; architecture/interior standards by jurisdiction; licensed fonts/assets/codecs; PDF/PPTX/HTML/video format fidelity; security threat model; retention/offline cache; performance budgets for supported hardware. Design Authority can specify the UX contract but cannot self-certify these domains.

## 21. Added traceability

- 011: Present multimedia and Focused Editor architecture.
- 012: Checkpoint Beacon, Flow Compass and structured AI context boundary.
- 013: Visual-first and global product verification stateboards.

## Appendix E — Spatiotemporal Interface Law · SIGNATURE CANDIDATE

IF is alive in **space and time**, not through decorative animation. Space uses L0–L4, semantic occlusion/edge/scale/material/focus, known ownership and spatial memory. Time appears only through true work: last-exited task, checkpoint, provenance/version, meaningful activity, save/sync, measured progress, media timeline, collaboration change, undo/restore and lifecycle.

Every transition must answer: source, destination, what changed, whether it is the same object, undo/return path, source of time truth, and reduced-motion equivalence. Unanswered movement is dead interaction, teleportation or fake time.

- Project cover slides to expose Create behind it; Reel and Resume do not reflow.
- ToolWindow minimizes into the Dock and restores its prior placement.
- Beacon expands into Compass; Focused Editor opens from an object and returns with selection/camera/page/playhead intact.
- Version restore creates a recovery version; it never erases history.
- Immediate response, current session, recent/day, milestone/checkpoint and version history remain distinct time scales.
- Motion is interruptible and derives from distance, perceived mass and intent. Reduced motion replaces travel with shape/state/static depth.

## Appendix F — Home Create reveal correction 009.4

Create Project belongs behind the head of the Project Reel, not as an independent permanent Dock anchor. Default keeps a small edge-peek; hover/focus or touch reveal slides the front cover group by transform without reflow. Keyboard focus exposes the action and command registry provides `New Project`. Zero projects exposes Create fully. Denied create permission exposes no fake action; offline/draft/error/duplicate states follow Quick Create truth. **Edge-peek is recommended over fully hidden** for discoverability and to distinguish this project-scoped plus from Left Router `+AI`.

## Appendix G — Site Map + Field Data 013 · CANDIDATE

### G1. Placement and coordinate systems

Global Project Map is an optional module/view inside Projects; Project Site Map belongs inside Project full page. No new top-level Router route is justified yet. Geographic coordinates and drawing/site coordinates are separate layers with explicit transform, calibration and source.

- Geographic: authorized project/site, zone/building/floor/area, permitted access/logistics/delivery, provider abstraction and offline tile policy.
- Drawing/site: floor plan or 2D/3D entities with pins/areas/paths linked to real objects.

### G2. Field record and lifecycle

Record candidate: id, project/site/zone/floor, geographic or drawing reference, capturedAt/timezone, capturedBy, device/source, media/provenance, category/status/severity, assignee, checkpoint, due date, permissions, version/sync/offline and links to 2D/3D/material/decision. Created-by is not subject; observation is not verified fact; AI inference is separately labeled.

Capture offline/mobile → sync → classify/link → review/verify → issue/decision/checkpoint → resolution → before/after evidence → close/retain. Vitals/AI may summarize, propose a likely link, detect missing evidence or draft an issue; humans confirm location, measurement, verification and closure.

### G3. UX and device ownership

Desktop owns global map, split map/evidence, comparison, filters/layers/time scrub, bulk review and Context Studio. Tablet supports map/drawing linkage, review, pen markup and capture. Mobile prioritizes permissioned offline capture, media/voice/note/measurement/site diary/issue/checklist and sync recovery. Field Lens is an L3 visual-first preview; Dock field package contains capture, pin, measure, note, issue, filters/layers and sync.

Privacy and reliability require consent for location/camera/mic; tenant filtering before load; site coordinate protection; face/license-plate/PII redaction policy; locale/timezone and metric/imperial; offline/conflict truth; regional provider/data-residency/license/cost review. Safety/compliance observations cite their standard and require professional verification.

### G4. DESIGN / ARCHITECTURE MISSING

Map provider and regional fallback; tile/data licensing and residency; offline storage/expiry; geographic↔drawing calibration; location precision; media redaction; sync/conflict; mobile capture architecture; 360/3D support; safety scope; shared contracts with ArchiNote only after separate product research.

## Appendix H — Home Living Showcase 015.2 · MVP CANDIDATE

**Naming recommendation: Living Showcase / Khung Cảm hứng.** “Living” conveys truthful changing content; “Showcase” avoids implying a project asset, canonical DNA or generic widget. “Inspiration Window” is clearer but more generic.

**Correction:** Living Showcase is one prominent MVP **feature widget**, not the Home body and not a default full-bleed hero. The prior full-body interpretation in visual 015 is `SUPERSEDED`. Home retains an ambient canvas and usable negative space; the widget must not compete with the Bottom Dock. Resume Capsule + Project Reel/Lens + Create revealed behind its head remain intact. Future personal widgets appear only when users add them; Home still rejects a default card wall.

The widget follows the Personal Widget model and stores personal/local size and placement without modifying project truth:

- **S:** image/cover, source mark and Open.
- **M — recommended default:** image, one short AI caption, Explore/My Board, Save and manual navigation.
- **L:** larger image plus board strip, compact metadata and source actions; still not the whole Home.
- **Focus:** user-invoked browsing view. Exit restores the same Home position, size and selection.

Each size adds function rather than merely stretching. Resize supports handle, snap/safe bounds, restore default, touch and keyboard paths. Layout candidates for eye testing are: A) off-center large editorial widget around 40–50% of usable Home, B) medium landscape in calm negative space, C) movable/resizable user placement with a safe default. Percentages remain hypotheses until responsive eye/runtime proof. Candidate B with movable C behavior is recommended for MVP.

### H1. Two explicit modes

- **Explore:** curated external architecture/interior/design images through an approved lawful adapter. On-demand details expose source, creator/project/publication when known, usage/license status, link and fetchedAt. Content is inspiration only and never silently becomes a project asset or Project DNA. Actions: Save to Board, hide, not interested, report/copyright.
- **My Board:** user-selected images in a personal or project-scoped board. A board may be set as the Home Showcase. This does not promote it to canonical Project DNA. `Distill / Propose to DNA` creates a candidate with provenance for human review and explicit approval.

### H2. AI caption and visual contract

Caption budget is one short title/line and, only on demand, one concise paragraph. It uses available metadata/source and labeled visual inference. It must not invent architect, location, material or project facts. With insufficient metadata, it describes only observed visual qualities. User may edit, regenerate, hide, choose tone/language; attribution remains separate and visible on demand. Caption placement respects focal point, readable contrast and alt text.

“Live” means real curated/user-selected content with manual or deliberately slow transition—not perpetual animation. No autoplay by default; Next/Previous/Pause remain available. Reduced motion is static. Responsive crop uses a stored focal point. Data Saver suppresses prefetch and expensive transitions. Offline shows the last approved cached image and its timestamp; no image produces a neutral ambient surface, never a fake fixture.

### H3. MVP acceptance contract

One lawful Explore adapter with complete metadata; one My Board; save/remove/set-as-Home; attribution; editable/hideable short AI caption; manual navigation; board create/select; permission/license/offline/error/reduced-motion/data-saver states. Tenant/project permission is checked before load. Copyright/privacy/moderation/reporting are explicit. Keyboard, touch and screen-reader paths are equivalent.

Later only: additional connectors, collaborative boards, personalization, scheduled rotation and DNA distillation automation. None is implied by the MVP.

The generated image in visual 015.2 is **review-only synthetic imagery**, not proof of an Explore provider, license adapter or runtime dataset. Image remains primary; glass is limited to a light frame and temporary controls. Arbitrary contrast, focal crop, light/dark, 1100px, touch, reduced motion/transparency and Data Saver require verification. Showcase never duplicates Recent Task or Project Lens.

## Appendix I — Action Lens + Habit Memory 016 · CANDIDATE

### I1. Action Lens

Action Lens is a stable-reading L3 context surface opened from the pointer or selection. It exposes depth without creating a second command system: every action resolves to the canonical command registry identity, label, icon, scope, availability and shortcut.

Visible budget is deliberately short: **Primary** 3–5 deterministic actions → object/stage actions → safe compact Quick Adjust → Vitals no-prompt suggestions → Open Deep (`Context Studio`, `Focused Editor`, `More commands`). Recent/custom actions appear only when evidence makes them useful. Long menu walls are rejected.

Common grammar, subject to object/state: Cut/Copy/Paste/Duplicate, Rename, Group/Ungroup, Lock, Hide/Isolate, Delete, Properties, History/Version, Comment/Review and Open source. Destructive actions are separated, named, confirmed when risk requires and undoable where technically valid. Object families extend—not replace—this grammar for image, material, 2D, 3D, video, Present block, site pin and Project/Board card.

Entry parity: right-click, keyboard Context key or Shift+F10, touch/pen long-press, selection mini-toolbelt and command palette. The lens grows from its source, collision-flips toward available space, closes focus back to the object and uses a stable opaque reading layer rather than glass-on-glass. Reduced motion opens statically.

### I2. Vitals no-prompt assistance

Vitals Quick Actions may suggest alternatives, replay a confirmed usual treatment, continue a repeated sequence, check against Project DNA/source/scoped standard, explain a difference, create a non-destructive variation or draft a note/issue/caption. Every proposal states **operation, target, context/source, impact, cost/time where relevant, preview/undo**. It never silently mutates canonical truth.

Risk routing:

- Low-risk and reversible: one-click may be offered with immediate truthful undo.
- Medium: preview and confirmation.
- High-risk, destructive, costly, legal or compliance: explicit confirmation and evidence; never habit auto-run.
- Unknown, stale, offline or denied: unavailable/unknown with recovery; never guessed.

### I3. Habit Memory

Learning is opt-in, inspectable, editable, pausable, resettable and only begins after repeated **confirmed** actions. Eligible evidence: command sequences, tool/package use, representation choice, export settings, layout/panel arrangements and recurring filters/adjustments. The system may propose Pin command, Create shortcut, Create Tool Package, Create macro/recipe or Make default in this context; persistence requires user approval.

Memory scopes are explicit: personal/device, personal synced, project preference, studio/team policy. A preference never becomes Project DNA, canonical project truth or builder memory. It never crosses tenant/client/project without an explicit portable rule. `Why suggested?` discloses learned pattern, source scope and recency. Controls include pause learning, private mode, forget this, reset category/all and policy-governed export/import.

Lifecycle: repeated confirmed actions → candidate pattern → proposal with evidence → user approves scope → memory rule → contextual suggestion → user edits/pauses/forgets. Rejection does not silently return as a default. Habit ranking cannot override permission, registry availability, user Tool Package order or protected shortcuts.

### I4. Registry integration and verification

Action Lens stores command ids, not duplicated implementations. Shortcuts render from the active profile; packages reference the same ids; macros store ordered ids plus guarded parameters and preconditions. Verification requires registry identity consistency across Lens/Dock/palette/menu, scope conflict tests, text-entry guards, permission filtering before display, preview/undo truth, keyboard/touch/screen-reader parity, collision tests and cross-tenant memory isolation. Visual 016 remains design evidence only.

## Appendix J — Home Bento Auto Grid 017 · CANDIDATE

Home is an ambient living surface with exactly **two persistent states**—`Factory / Starter Home` and `Personalized / My Home`—not a generic dashboard. `Customize Mode` is a transient nested editing mode inside My Home, never a third Home state. The same Living Showcase identity changes representation between the two persistent states. Bottom Dock remains a separate working layer—Resume Capsule + Project Reel/Lens + reveal Create—and its functions are not duplicated in the grid.

### J1. Factory / Empty Home

When the user has no project, personal content or widgets, Living Showcase may be full/dominant as progressive onboarding. This restores the original visual 015 interpretation **only for Factory/Empty scope**; it is not the populated default. Content is lawful Explore or licensed/attributed curated starter material, never fabricated personal/project data. Clear paths are `+ Thêm widget`, Create Project and Open Project; they may explain or invoke the same canonical commands as the Dock but cannot create parallel project state. The user may begin with Showcase, add a widget, create/open a Project or deliberately keep Home minimal.

### J2. User-Customized Home

State 2 begins through explicit user authorship, not automatic population. Factory transitions to My Home when the user chooses Add Widget or begins personalization. Inside My Home, `Chỉnh sửa Home` opens transient Customize Mode: add/remove, S/M/L preview, pin/move/resize, group/stack, background, undo, Apply or Cancel. Apply commits the personal layout and closes the mode; Cancel restores its entry snapshot and closes it. Both return to the same persistent My Home state. Bento Auto Grid proposes valid vacancies and continuity-preserving reflow, but cannot seize authorship. User override and spatial memory win.

Showcase returns to S/M/L—M landscape recommended—and participates in the chosen composition. Transition Factory→Customized keeps the Showcase object, focal crop and interaction state, morphing into its assigned cell. No teleport and no silent reset. Focus remains user-invoked and exits to the saved placement; Home never automatically returns to Factory full view.

**Aligned 16:9 law:** the Living Showcase image/media viewport is 16:9 in Factory dominant and Personalized M/L wherever available space permits. S/M/L change information density and placement, never stretch or arbitrarily distort media. The user may preview crop and set a focal anchor; the renderer uses proportional cover/contain behavior. Caption and metadata overlay a protected contrast region or occupy an adjacent/footer area without altering the 16:9 field. Narrow/touch layouts may letterbox or invoke an explicitly named compact derivative with its own preview; they cannot silently redefine the canonical crop.

Customization flow: My Home → deliberate `Chỉnh sửa Home` → Widget Gallery filtered by source/scope/permission → size/content and placement preview → Apply or Cancel → My Home. Undo remains available. Lock is a My Home property. Restore Default previews what will move/remove, requires confirmation, returns to My Home and never deletes personal source content; it does not create another conceptual state.

Background supports user-selected lawful image, color, gradient or safe ambient media. It is personal layout state only: never project truth, Project DNA, team surface or another user's Home. It stores provenance/license, focal crop, contrast treatment, data-saver behavior, reduced motion/transparency alternative and explicit personal-sync/local fallback. Reading surfaces must remain stable over arbitrary backgrounds.

Stacks may conserve space for non-critical related widgets. Rotation is manual; stack membership and current face are visible. Critical alerts, blockers or permission changes cannot be hidden behind a rotated face.

### J3. Widget taxonomy

| Widget | Class | Default | Job / boundary |
|---|---|---:|---|
| Living Showcase | Lifecycle feature | Factory dominant 16:9; My Home M 16:9 | Inspiration/board; never Recent or Project Lens |
| Project Pulse | Conditional priority | M 2×1 | Cover/code/year/stage/checkpoint/update; no Resume duplicate |
| My Flow | Conditional priority | M 2×1 | Current/next checkpoint, blocker, true deadline; links Flow Compass |
| Site & Field | Conditional | M 2×1 | Authorized map/evidence/issue/sync only with data |
| Team Presence | Conditional | S/M | Collaboration and action-needed; presence ≠ permission |
| Milestones | Conditional | S/M | Work-impacting dates only, not a decorative calendar |
| Recent Assets | Conditional | M | Image/CAD/3D/material/presentation with provenance; not task history |
| Saved Boards | Conditional | M | Saved collections; adapts or hides if Showcase already shows My Board |
| Personal widget | User-created | S/M/L | Consented shortcut/image/link/command/live source |
| Add Widget | Intentional utility | S or Factory CTA | The only durable empty affordance |

Recommended Populated hierarchy: Showcase first; Project Pulse and My Flow when true; at most two situational widgets initially. Site, Presence, Milestones, Assets and Boards enter by permissions, data and user relevance—not because a dashboard slot exists.

### J4. Auto Grid law

- Auto-fit uses viewport, permission, true data, priority and state. It may fill vacancies but cannot reorder pinned/locked widgets or override user size/placement.
- Layout memory stores stable widget id, S/M/L, position intent, pin and lock. Reflow is source-continuous; newly eligible widgets enter an unreserved vacancy with visible proposal.
- No real data means hide. Loading, stale, offline, revoked, error and permission states are truthful. Add Widget is the only intentional empty tile.
- AI may recommend a layout but user approval is required. It cannot add/remove/group/resize/change background on its own. User override wins.
- Desktop supports resize/reorder and keyboard move mode. Touch uses handles, long-press, ≥44px targets and preview-before-drop. Reduced motion uses immediate placement plus insertion outline.
- S provides identity/state/open; M adds primary visual/core actions; L adds comparison/history/secondary controls. Detail belongs in Lens/Context Studio.

### J5. Visual/data contract and missing proof

Real covers, thumbnails, maps, avatar/presence shapes and checkpoint semantics precede prose. Glass is limited to edges, move/resize controls and temporary overlays; reading surfaces remain stable. Every widget declares source, owner, scope, permission prefilter, freshness, offline behavior, size-specific content, primary action and linked deep surface. Vitals, Flow Compass and App Status may be reflected only via canonical links/state.

Runtime proof required: Factory eligibility and lawful starter adapter; Factory→Customized continuity; 16:9 geometry, focal-anchor persistence, crop preview and named compact derivative; gallery source/scope filtering; preview/apply/cancel/undo/restore; grid packing/collision at 1100px/large/tablet; personal-only layout/background isolation; sync/local fallback; permission-before-load; source freshness; offline/stale/error recovery; keyboard/touch/screen-reader customization; stack critical-state visibility; reduced modes; VI/EN expansion; arbitrary-background contrast/crop; live-preview/map performance; non-duplication of Dock/Beacon/Vitals.

### J6. Personal Home Theme Packs 020 · SCOPED CANDIDATE

IF may ship approximately five curated Home Theme Packs. A pack is a semantic bundle: lawful background image/gradient/optional safe ambient media; coordinated Home-only surface/tint/accent palette; light/dark/readability variant; protected contrast-safe semantic text/status tokens; and imagery provenance/license metadata.

Gallery cards are visual-first: background preview, palette swatches and compact name. Selecting a card opens a Before/After preview; only explicit Apply changes Personal Home. Scope excludes project documents, Brand Kit, Project DNA, team Home, exports and canonical product truth. Error/warning/success/focus semantics and minimum contrast are protected system constraints, never user-overridable decoration.

Restore and Undo are first-class. Theme state declares personal sync/local fallback, missing/revoked source, reduced transparency/motion and Data Saver behavior. A user may create a personal pack from their own lawful image. `Match from wallpaper` is optional and user-invoked: derived palette is `PROPOSED`, previewed and editable before Save. It is never silently promoted to DNA or applied to project content.

Runtime proof: five licensed starter records; arbitrary-background contrast tests; protected semantic-token enforcement; light/dark/high-contrast and reduced variants; preview/cancel/apply/undo/restore; personal isolation; image permission/revocation; sync/local conflict; Data Saver media fallback; user-image provenance and palette-review flow.

## Appendix K — Project Cover Reel + Guided Background Removal · SCOPED CANDIDATES

Conflict gate: **ALIGNED**, but the mechanisms belong to two different product surfaces and must not be merged.

### K1. Home Bottom Dock — Project Cover Reel 018

Project Reel/Lens remains inside the Home Bottom Dock and is never duplicated as a Bento widget. Under `DA-REEL-018.3a PROVISIONAL`, authorized Projects form a horizontal fan-deck when width and collision budget permit. Narrow real-cover slices/accordion are the compact fallback for constrained width and touch portrait. Hover, focus, click or first touch expands one selected Project with source-anchored width/depth continuity; adjacent Projects remain legible and reachable. There is no autoplay.

The expanded cover shows only concise truth: real cover, project name, human-readable year + project code, authorized team/presence, current stage/checkpoint and latest meaningful update. The active Project is dominant but cannot obscure the stable Reel track or permanently cover Create Project. The previous behind-cover Create mechanism remains: a project-scoped edge-peek reveals `New Project` at the Reel head.

Keyboard arrows cycle covers; Enter opens Project Lens; the context command reveals Create. Touch uses tap-to-expand then explicit action, and horizontal drag/swipe is bounded and snap-based. Pointer leave has grace and focus-inside remains open. Missing cover uses a neutral project-generated placeholder derived from project identity—not a customer, TTT or fixture asset. Permission filtering happens before cover/team/update load.

Runtime proof: real cover source and placeholder generator; permission-before-load; cover accordion geometry; focus/touch parity; Create reveal collision; reduced-motion static expansion; 1100px overflow; Project Lens handoff; no Bento duplication.

### K2. AI Create / Image Editor — Background Removal 019

This mechanism does **not** belong to Home. It is queued for AI Create/Image Editor and keeps one non-destructive source image plus an editable mask.

- **Quick Remove:** automatic segmentation → mask preview → confidence/edge warnings → before/after inspection → user Apply or Refine → undo.
- **Guided Remove:** click object, keep/remove strokes, lasso/brush and edge tools produce iterative AI proposals. Hair, glass/translucency and ambiguous intersections receive targeted visual warnings and zoomed refine views. AI asks only a specific question needed to resolve the uncertain region.

The editor always exposes visible mask overlay, Before/After, zoom edge inspection, target/source, provenance, estimated cost/time where relevant and the distinction between subject extraction and destructive deletion. User confirms the final mask; original and editable mask remain. Manual refine and alpha export are explicit fallbacks. No claim of perfect segmentation is permitted.

Input equivalence covers mouse, touch, stylus pressure where supported and keyboard-accessible tool/parameter paths. Reduced motion replaces animated mask propagation with static changed-region indicators. Verification requires mask persistence/versioning, undo/redo, edge-quality review at zoom, transparent export, offline/error/cancel/retry and truthful model confidence calibration.

## Appendix L — Document Page Stack + Project Lens Layer 2 · SCOPED CANDIDATES

Conflict gate: **ALIGNED** with the Spatiotemporal Interface Law, scoped to document browsing and Home project navigation.

### L1. Library / Knowledge / Recent Assets — Page Stack Preview 021

Text-heavy DOC/PDF/readable documents may use a restrained spatial page stack in browse/overview. The stack exposes the cover or first meaningful authorized page, document type, title, source, last edit and page count. Hover/focus or deliberate drag may fan/peel only 2–4 representative page thumbnails; scrub selects a page. This mechanism belongs to Library, Knowledge and document-type Recent Assets—not generic Home decoration.

Opening the document resolves into a stable flat reading surface with typography, search, outline, selectable text and accessibility. Long text never flies or animates while reading. AI-selected representative pages or summaries require provenance and an explicit generated label; they cannot invent content.

Large, remote and sensitive files expose measured loading where possible, permission/redaction, offline and stale states. Reduced motion/transparency uses static offset thumbnails and solid surfaces. Performance budgets limit rendered thumbnails and remote prefetch; page identity and selection persist from stack to reader and back.

Verification: representative-page provenance; page-count/source truth; permission-before-thumbnail; redaction; large/remote loading and cancellation; offline cache; static reduced mode; keyboard/touch scrubbing; screen-reader document/page labels; reader handoff preserving selected page; no text animation in reading mode.

### L2. Home Project Reel — L1/L2/L3 hierarchy 018.2

- **L1 Project Cover Card:** compact authorized real-cover slice in Bottom Dock/Reel.
- **L2 Project Lens:** expanded preview/navigation showing cover, name/year/code, current phase/checkpoint, meaningful status, authorized people, latest update, next milestone and at most one real key visual/map/site signal.
- **L3 Full Project page:** progressive modules for overview, calendar/chart, kanban, team/permissions, files/sources, activity/version, decisions and DNA.

L2 is not a miniature dashboard and cannot edit project truth except explicitly safe quick actions. `Open Project` is explicit. The same project identity, cover and focal position morph L1→L2→L3; Back returns to the previous spatial source. Permission filtering occurs before each field/media load. Lens does not duplicate Home Bento widgets, Resume Capsule or Dock state.

Verification: cover/focal identity continuity; L1 keyboard/touch expansion; L2 field budget and source truth; permission-filtered team/map/update; graceful missing signal; explicit Open Project; Back spatial return; no inline canonical edit; Full Project route handoff; 1100px collision with Dock/Create.

## Appendix M — Fifteen Eye Comments Conflict-Gate Map 022 · CANDIDATE

The references are mechanism evidence, not a single surface or skin. Classification:

| # | Mechanism | Gate | Product placement / action |
|---:|---|---|---|
| 1 | Add Member / Manage Team | ALIGNED | Project Collaboration compact ToolWindow; explicit confirm |
| 2 | Flow avatars | SCOPED | Meaningful ownership/review/contribution points only |
| 3 | Modular Avatar Builder | NEW SCOPED | Personal Profile focused candidate; coordinate-safe asset system |
| 4–5 | Master Editor + support tools | ALIGNED | Shared Editor Shell + ToolWindow/Context Studio/Focused Editor |
| 6,10 | Quick Voice Note + aftertool | CONFLICT/SCOPED | Separate capture artifact from Vitals conversation; awaiting placement preference |
| 7 | Tool taxonomy | ALIGNED | Registry-backed persistent/context/package split; evidence below |
| 8–9 | Three-stroke orbital identity | TERMINOLOGY MISSING | Candidate for existing Vitals/AI core only after Hoà confirms name |
| 11 | “Tender + Ademark” | REFERENCE UNCERTAIN | No research until exact official product names/URLs |
| 12 | Personalization/Profile | ALIGNED | Personal-only avatar/theme/access/language surface |
| 13 | Concave +AI identity | CONFLICT/SCOPED | Existing lower STAGES `+AI` only; visual treatment needs Hoà approval |
| 14 | Factory dynamic typography | CONFLICT/SCOPED | Optional overlay/Minimal Theme; must not become state/activity system |
| 15 | User-authored My Home | ALIGNED | Confirms 017.3 two-state law and nested Customize Mode |

### M1. Team collaboration

Add Member / Manage Team is a compact, single-task Project Collaboration window. Identity/presence, membership, role, permission and invitation state are separate fields. Search previews the exact role/scope impact; pending/expired/revoked are truthful. No membership mutation occurs until explicit confirmation, and revoke/remove names impact and recovery policy.

Flow avatars appear only at semantic contribution, ownership, approval or review points. Focus reveals actor, action, time and evidence. Avatar is neither permission nor online state.

### M2. Modular Avatar Builder

Candidate asset contract: base head/face geometry and independent hair, eyes, accessories, clothing and background. Every asset declares coordinate anchors, bounding box, occlusion order, compatibility and collision tests. Inclusive global assets avoid broken silhouettes and accidental overlap. Photo upload remains a separate consent/privacy path. Profile avatar is personal identity presentation, not project role, membership or customer inference.

### M3. Voice boundary

Vitals Voice converses or commands at canonical Vitals placement. Quick Voice Note captures an audio artifact: visible record → stop/cancel → transcript draft → compact aftertool for trim, transcript edit, attach/link, tag, privacy/scope, save/discard. It is user-added Home personal widget or contextual Project tool only. The two paths use distinct icon/state language and permission disclosures.

### M4. Persistent-tool evidence and candidate

**Observed in repo:** `lib/commands/registry.ts` marks 10 shared `CommandDef`s across CAD/render/present: Select, Delete, Undo, Redo, Move, Copy, Rotate, Mirror, Measure and Text. `toolbar-source.ts` retains disabled reasons. Runtime bindings are not equivalent: `ToolDock3D` binds Select/Move/Rotate/Copy/Measure; Present Toolbar binds Undo/Redo; CAD owns the complete working implementations. Pan exists in `BottomToolbar`/touch surfaces but is not a shared registry command. Tasks/Recent sessions are product working-state objects, not yet a registry command proven by this audit.

**Persistent Dock candidate:** Select plus Undo/Redo cluster, shown only through a working stage adapter; Recent/Running Tasks remains a stable multitasking anchor when real. Pan is a shortcut/gesture and contextual touch affordance until unified command evidence exists. Delete, Move, Copy, Rotate, Mirror, Measure and Text remain registry-common but contextual/package tools, not permanent anchors. This minimizes persistent width and does not misrepresent “declared common” as “runtime-equivalent.”

### M5. Existing editor architecture

One master work surface remains the Canvas/Editor. Supporting tools use single-task ToolWindows, contextual mini-toolbelts or Context Studio with dock/pin/move/resize/collapse/layout memory. Deep image work uses Focused Image Editor. No extra floating rail or uncontrolled spatial ornament is created.

### M6. Pending identity and Home conflicts

Three-stroke static monochrome + gradient AI mark and orbital motion states remain a **Vitals/AI core identity candidate**, not a new assistant. Proposed states are Idle, Available, Listening, Thinking, Acting, Awaiting confirmation, Success, Warning and Offline with reduced-motion glyph equivalents. Naming “Pitas/Phitas/Vitals” must be confirmed before adoption.

Concave circular glass/edge light can only restyle the canonical lower-STAGES `+AI`; it cannot add a Home +AI. Dynamic Factory typography may show a short truthful greeting/time and 1–2 real next items as optional overlay or Minimal Theme, but requires Hoà choice and must not compete with Living Showcase, fabricate urgency or create a third Home state.

### M7. Minimal decisions required from Hoà

1. Confirm the core name: is the three-stroke/orbital symbol the existing **Vitals** identity?
2. Confirm Quick Voice Note availability: user-added Home widget, contextual Project tool, or both?
3. Approve/reject concave treatment for the existing canonical `+AI` control.
4. Choose Factory typography: lawful Showcase overlay, optional Minimal Theme Pack, or defer.
5. Provide exact official names/URLs for “Tender” and “Ademark” before research.

Runtime proof remains missing for invitation/role impact; semantic flow attribution; avatar anchors/collision/inclusivity; voice recording/privacy/transcript; cross-stage command adapters; Vitals mark legibility/motion/reduced states; +AI distinction; Factory typography truth and readability.

## Appendix N — Vitals requirements from 023 · VISUAL REJECTED

**Hoà verdict:** visual prototype 023 is `REJECTED AS VISUAL`. It is too diagrammatic, the mark is weak, the natural braid is unclear, internal light lacks force and the spatial pull is insufficient. It must not be used as current visual direction or implementation target. The requirements below remain evidence only and are superseded visually by storyboard/animatic 025.

Terminology is resolved: the three-stroke/orbital identity is **Vitals**, not a new assistant or system.

### N1. Summon motion

Summon begins with only 2–3 seeds/filaments entering from the outer perimeter. They move with asymmetric phase, unequal velocity and restrained gravitational tension; they braid inward and condense into the Vitals sphere/core. The resolved core briefly expands/breathes and emits volumetric light from internal energy. Dense particle clouds, dust halos, uniform globe scans and spectacle competing with work are rejected.

Prototype phases are measurable hypotheses, not fixed law: `attract → braid → resolve → ready`. The total should feel immediate, remain interruptible and settle into meaningful silence. Prototype must measure perceived acknowledgement, phase legibility, dropped frames/GPU cost and whether users can distinguish state without text. Static identity retains light-on-dark, dark-on-light and AI-gradient variants.

State mapping:

- Dormant: static mark. Offline: monochrome dormant.
- Summoning: 2–3 seeds braid inward. Ready: coherent self-lit core with one restrained breath.
- Listening: directional opening toward input. Thinking: internal strands exchange depth without external noise.
- Acting: controlled outward directional pulse. Awaiting confirmation: visibly held open orbit.
- Success: clean resolve and settle. Warning/error: asymmetric or broken phase plus shape and label, never red alone.

Reduced motion uses direct crossfade/shape resolution with no orbit. Optional sound/haptic obeys user/platform settings and never carries required meaning.

### N2. Vitals Speech / Utterance Capsule

The concave/inset capsule contains only a short acknowledgement, one focused question, confirmation, concise status or next-action prompt. It is anchored to the canonical Vitals core: notch-capable displays associate it with Search+Vitals without entering Smart Notification Stack; no-notch displays grow from the Vitals anchor or handrail click context.

It is not Notification Island, persistent chat, Action Lens or the main command input. States are hidden → listening transcript draft → Vitals utterance → awaiting response → resolved/dismissed. Action-affecting messages expose target and context/source. Long results open a linked card near the affected object/canvas or Context Studio.

Users can dismiss, pause voice, switch voice/text and inspect Why/context. Critical confirmation cannot auto-hide. Placement avoids the primary selection/tool target and collision-flips while preserving its Vitals anchor. Reduced transparency uses a solid high-contrast surface; reduced motion uses a short fade. Keyboard focus order, screen-reader labels and live-region priority must avoid repeated or interruptive announcements.

### N3. Unknowns and proof gates

Timing bands per phase; input latency and interrupt behavior; GPU/energy budget; blur/refraction fallback; state recognition; speech transcript latency/accuracy; critical-confirmation persistence; live-region politeness; notch/no-notch collision matrices; touch and keyboard response; reduced modes; audio/haptic preference; core/capsule contrast over arbitrary canvas. Visual 023 is storyboard evidence, not runtime proof.

## Appendix P — Vitals Redesign 025 + Final Review Room 026 · CANDIDATE

### P1. Vitals 025 target

The static mark uses exactly three strong organic orbital strokes forming one recognizable spherical core. Required proofs: light-on-dark, dark-on-light and restrained AI-gradient versions; small-icon legibility; consistent identity across every state.

Summon begins with 2–3 distinct luminous filaments far at the perimeter, each with different path, timing, width and energy. They are pulled inward, braid/twist, compress and resolve into the exact three-stroke static sphere. The sphere blooms from internal light; external fog, particle dust, dotted globe and equal-speed rings are rejected.

025 contains large consecutive frames and an illustrative playable animatic for Dormant → Summon → Ready → Listening → Thinking → Acting → Awaiting confirmation → Success → Warning → Offline. It also shows Speech Capsule growing from Vitals, deliberate expansion into the same Conversation Workspace thread, notch and no-notch placements, scrub/slow mode, reduced-motion equivalent, light/dark, small icon and low-GPU fallback.

025 is labeled `STORYBOARD / ANIMATIC · DESIGN MISSING`. It is not final motion or runtime proof. Final curve geometry, stroke pressure, volumetric internal-light shader, phase timing/easing, audio/haptic, performance budget and production assets require specialist motion prototyping and eye approval.

### P2. Final Review Room 026

One interactive review page composes all current candidates in eleven ordered chapters with embedded frames, status, current/prior relationship, a concise review question and local approve/comment controls. Sticky progress records only browser-local review state and does not write canonical approval. Old/rejected/superseded artifacts are visibly marked so they cannot be mistaken for targets.

Resolved provisionally by direct user evidence: `DA-REEL-018.3a` uses horizontal fan-deck by default and vertical slices as compact fallback, with feature-flag rollback and final eye approval pending. Preserved gates: final visual treatment, uncertain Tender/Ademark official references, and any legal/cost/privacy choice. No approval or runtime proof is inferred.

## Appendix Q — Product Resource Experience 027 · CANDIDATE

### Q1. Targeted app evidence

- `/library` is intentionally not a standalone page: it returns to the prior work and opens the single `LibrarySheet`. The sheet already supports Browse/Bulk Add, stage-aware shelves, real `LibraryAsset` records, search, contextual drag/apply and gallery exit. A Resource proposal must reuse it, not create a second Library implementation.
- `LibraryAsset` contains identity, owner, category/tags, MIME/path, usage, palette/caption/content, dimensions, version/revision and where-used linkage. Existing scope grammar includes common/studio/stage/project, but permission and tenant semantics need convergence.
- File Manager currently exposes Projects, Library, Knowledge, System and Backups roots. `_System`, backups, builder/control memory and internal agent memory are not product Knowledge and must never surface in customer search, ingest or Vitals context.
- Inspiration mechanisms exist through Gallery, moodboard boards/collage and Library image/reference flows, but there is no verified unified product-facing Inspiration repository model.
- Project membership truth exists in `ProjectMember` with roles owner/crea/drafter/bim/viewer, revision checks, soft delete and last-owner guards. Current API proves membership/role management, not invitation lifecycle, online presence or a finished personnel-profile experience.
- Templates exist across Library shelves, slide templates, CAD templates and custom Present templates. Their UI ownership is fragmented but their destination is reusable Library content, linked to creator/owner and where-used.

### Q2. Route comparison

| Model | Desktop click depth | Tablet/mobile | Strength | Cost/risk |
|---|---:|---|---|---|
| Keep 3 top-level routes | 1 | direct icons/menu | Maximum directness and old muscle memory | Router load; duplicated search/ingest/filter logic |
| One umbrella + 3 visible modes | 1 to hub, mode visible immediately; deep links remain 1 | one full-height hub with mode switch | Shared search/ingest/scope; clearest provenance boundary | Library contextual-sheet behavior must be preserved; migration needed |
| Two routes | 1–2 | simpler menu | Compromise density | Artificial split; shared source/filter model still duplicated |

**Recommendation:** one top-level umbrella labeled **Nguồn & Tri thức / Resources** (implementation candidate `ResourceHub`), with three equally visible modes: **Cảm hứng / Inspiration**, **Tri thức / Knowledge**, **Thư viện / Library**. Existing route names and deep links remain valid entry aliases during migration; no route is silently deleted. Entering Library from a Stage invokes the existing contextual `LibrarySheet`; entering from the umbrella opens the same component/state in Resource context, never a fork.

Click behavior: desktop Router opens the Hub with last authorized mode; hover/focus label exposes the three direct mode shortcuts. Tablet/mobile opens a full-height Resource surface with a pinned three-mode segmented switch; contextual `Use in current work` returns to the originating Stage. Keyboard command/search can deep-link directly to a mode.

### Q3. Mode boundaries and shared services

- **Knowledge:** readable documents, notes, verified decisions and project knowledge. It excludes `_System`, backups, builder checkpoints, agent memory, control-plane docs and hidden implementation instructions.
- **Library:** reusable materials, CAD/3D/IDFC, images, fonts, Present/templates and reusable professional assets. Contextual apply/drag and where-used remain.
- **Inspiration:** lawful images, references, moodboards and saved boards with creator/source/license/provenance. It never silently becomes Library, Knowledge or Project DNA.
- Shared: search, ingest queue, source/provenance, filters, saved views, permissions, scope and activity. Cross-mode results retain type/mode badges and never flatten semantic differences.

Every item declares scope: Personal, Project, Studio/Tenant or Public/Licensed; owner; permission; freshness; source/license; where-used; offline state. Search is filtered before fetch/result rendering. Promotion across modes is an explicit copy/link/propose workflow with preview and human confirmation.

### Q4. Personnel and template connections

Personnel Profile is a project-authorized L2 surface: personal identity/skills/contact allowed by policy; distinct membership, role, permission, invitation and presence; current meaningful contributions; authored templates/assets/knowledge; where-used and scope. It does not infer authority from avatar or activity.

Manage Team uses existing membership truth and adds only candidate invitation states after architecture work: draft/pending/expired/revoked/accepted. Role impact previews exact capabilities before confirmation. Last-owner guard and revision conflict remain mandatory.

Template cards live in Library with type, compatible Stage/editor, author/owner, version, scope/license and preview. A Member Profile may link `Templates by this person`; the template remains Library-owned and permission-filtered. Knowledge decisions may cite a template; Inspiration may feed a template proposal; neither silently changes the reusable asset.

### Q5. Design/runtime missing

Unified Resource search index and permission query; Inspiration repository contract; Knowledge verification/source model; LibrarySheet orchestration in hub context; mode deep-link migration; invitation schema/service; personnel privacy fields; template ownership/version compatibility; cross-mode promotion/link semantics; offline cache and revocation; mobile return-to-origin; builder-memory exclusion tests; search leakage tests; performance and accessibility proof. Visual 027 is proposal evidence only.

## Appendix O — Conversation Extension + 3D Deep Space + Tablet Pen-first 024 · CANDIDATE

Conflict gate: **ALIGNED**, scoped into three related representations of existing systems. No new route or duplicate shell/tool/chat system is introduced.

### O1. Vitals Conversation extension

The hierarchy is `L1 Vitals core → L2 Speech Capsule → L3 Conversation Workspace`. Expansion is explicit and retains the same thread, utterance, target, structured context, attachments, sources, proposals, approvals and provenance. L3 uses Context Studio or a focused floating Conversation ToolWindow; it is not Smart Notification Stack and does not obscure the canvas by default.

Conversation Workspace can dock, pin, move, resize and collapse. Collapse returns to a capsule summary containing the last actionable state—not a disconnected new chat. Proposed actions use the same risk contract: preview/confirm/undo where valid, and never silently mutate project truth. Long results link affected objects and source evidence.

Tablet/mobile uses a sheet or full-height panel with explicit return to canvas, preserving selection and thread. Keyboard focus, screen-reader reading order, attachment alternatives, live-region discipline and offline/stale/source-revoked states remain explicit.

### O2. Visual+3D Master Workspace / Deep Focus

Visual+3D remains one Focused Editor representation inside the Shared App Shell. The scene/object owns the field; supportive tools appear only for semantic task clusters: object/transform, material, light, camera and render/review. Context Studio remains the coherent panel grammar—tools do not become uncontrolled decorative orbiters.

Deep Focus may suppress nonessential shell chrome while preserving Escape/Back, selection, stage/project identity, units, save/sync, undo and recovery. Tool text stays screen-space aligned and readable; no perspective-distorted UI. Perceived infinity comes from grid, fog, scale and depth continuity, while navigation remains bounded by Frame Selection, Home View, orientation cue, scale reference and recoverable camera history.

Ordinary 2D displays are the baseline. Multi-monitor/AR references may inform perceived depth but cannot be required for core operation. Performance degradation reduces fog/live previews/reflections before sacrificing selection, scale or tool feedback.

### O3. Tablet Pen-first Canvas Mode

Pen-first is an input/layout mode of 2D and Visual+3D Stages, not a new route. It uses compact icon-only Router and a contextually retracting Bottom Dock; critical stage, selection, units, sync and constraint state never disappear.

- Pen draws/edits. One/two-finger gestures pan/orbit/zoom under an explicit gesture mode to prevent conflicts. Pencil hover is enhancement only.
- Barrel/double-tap/squeeze mappings are user-configurable when supported. Palm rejection is required; pressure/tilt only affect meaningful tools. Cursor/brush/constraint previews are visible.
- Touch targets meet minimum size; precision handles support magnification and deterministic snap. A temporary modifier palette/radial tool appears near the non-dominant hand. Undo/Redo remain reachable.
- 3D pen workflow: choose/lock sketch plane or face → draw with axis/constraint snap → extrusion preview → numeric/gesture adjustment → explicit Confirm/Cancel. Frame Selection/Home View recover orientation.
- Keyboard/trackpad interoperate. Landscape, portrait, split view, safe areas, reduced motion, offline/site conditions and left/right-handed placement require distinct proofs.

### O4. Runtime proof gates

Conversation identity/collapse summary and source retention; Context Studio/floating-window collision; action-risk enforcement; tablet sheet return; 3D camera recovery and bounded navigation; screen-space panel readability; scale/unit persistence; low-GPU fallback; pen/finger arbitration; palm rejection; stylus capability mapping; precision snap; handedness; orientation/split-view/safe areas; critical-state persistence; reduced mode; offline/site recovery. Visual 024 is design evidence only.
