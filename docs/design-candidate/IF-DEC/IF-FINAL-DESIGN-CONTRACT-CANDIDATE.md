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
- WORKSPACE vocabulary currently includes Home, Projects, Inspiration and **Master Library**. Knowledge Base is contained inside Master Library; it is not a sibling top-level destination. Grouping or route changes require explicit review; no silent route deletion.
- STAGES: 2D Design; Visual Rendering + 3D Design; Presenting; canonical `+AI Create` in lower group.
- Top-right owns Personal/Search/Vitals/App Status. Vitals placement is capability-driven: notch Search+Vitals versus no-notch anchor/handrail. Smart Notification Stack is separate.
- Bottom is one cross-Stage Adaptive Work Dock. Top Bar is not a Stage toolbar. User Tool Package/layout overrides win over AI suggestions.
- Context Studio/ToolWindow is hidden by default, intentionally opened, and can dock/pin/move/resize/collapse/remember.
- Home has exactly two persistent states: Factory/Starter Home and Personalized/My Home. Customize is a transient nested mode.
- **Workspace surfaces are normal application surfaces, not canvases.** Home, Inspiration and Library must not inherit CAD grid, snap language, Stage tools, Inspector or drawing MasterTool. Canvas grammar begins only after entering CAD/2D, 3D or Render. Present is evaluated separately and uses a page/slide editor canvas only where free composition requires it.
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

## 4. Master Library and product resources

### 4.1 Recommended architecture

Canonical Workspace destination: **Master Library / Thư viện tổng**. Implementation may retain `ResourceHub` internally, but the product must not expose a second competing resource shell.

Master Library contains multiple resource domains with truthful type and scope, including:

- **Knowledge Base:** documents, notes, standards, verified decisions, extracted concepts/relations/rules and project knowledge transformed into machine-usable records.
- **Materials and PBR:** physical/spec properties, maps, variants, samples and usage.
- **Furniture and constructed objects:** named 2D/3D representations, dimensions, materials, details, assurance and where-used.
- **CAD/3D/IDFC, images/media, fonts, Present templates and Tool Packages:** reusable assets with type-specific preview and contracts.
- **Saved Inspiration/Collections:** lawful references promoted explicitly from Inspiration with creator/source/license/provenance; Inspiration remains its own Workspace experience for discovery and visual exploration.

Search, ingest, saved filters, provenance, scope, permission and activity are shared services. Results keep semantic domain/type badges.

Existing Inspiration/Knowledge/Library deep links may remain as migration aliases, but Knowledge routes resolve into Master Library context rather than preserving a second product destination. The existing `LibrarySheet` remains the one contextual apply/drag surface. The Hub may orchestrate it; it cannot clone it.

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

### 5.2a Home interaction and Left Bar correction · Hoà 2026-09-03

Home takes the calm, direct-manipulation character of an iPad Home surface, with strong personalization, but desktop remains optimized for pointer and keyboard rather than becoming an enlarged tablet UI.

- The **Floating Left Bar is the stable Workspace controller and the entry to Home customization**. It is a compact liquid-glass/pill rail with a collapsed state; it must not become a large opaque navigation panel. It is not a Stage tool palette.
- Home customization has one canonical entry in the Left Bar: `+ / Customize Home`. Do not add a competing floating pencil inside the Home content field.
- Touch/Pencil enters Customize Mode by long-pressing an empty Home area, a widget or the Left Bar. Desktop enters by the Left Bar control, right-clicking a widget/empty area, or the keyboard command `Cmd/Ctrl+E` while Home owns focus.
- Customize Mode exposes: Widget Gallery; add/remove or hide; move; resize through a visible handle; pin/lock; group/stack; duplicate/configure through `...`; background/theme; Apply, Cancel, Undo and Restore Default.
- A widget may be dragged from the Left Bar/Widget Gallery into a valid Home vacancy. Removal hides the widget instance and never deletes its source data.
- Outside Customize Mode, accidental drag/press cannot move or resize the layout. `Esc` cancels or exits safely; `Done`/Apply commits the personal layout.
- Pointer, keyboard and touch paths must reach equivalent outcomes. Touch targets are at least 44px; keyboard move/resize announces position and size; focus order follows the saved spatial order.

### 5.2b Workspace versus Canvas grammar · Hoà 2026-09-03

- **Home, Inspiration and Library:** ordinary content-led application surfaces—editorial composition, search, shelves, cards, widgets and calm negative space. They must not feel like a drawing canvas and must not show CAD grid, snap cues, Inspector, Stage list or drawing MasterTool.
- **CAD/2D, 3D and Render:** professional canvas/scene grammar—work field, contextual MasterTool, Inspector, selection, precision state and recovery/navigation controls.
- **Present:** a structured page/slide editor first. Canvas-like free placement is allowed only for direct composition, alignment, annotation or media staging; it must not inherit CAD grid/tool semantics by default.
- Entering a Project/Stage performs the grammar transition. Workspace navigation does not display disabled Stage tools as decoration; Stage access is derived from the active project and its truthful capabilities.

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

### 8.1 Project Legacy and project record

**Project Legacy replaces a generic “Project Overview”.** It is the studio’s durable view of completed and evolving work: a timeline plus project covers, with statistics by year, project type and client. Covers sit on a dark image-bearing band as an intentional exception to otherwise calm Workspace surfaces. Cover size and prominence are curated by the studio; the machine does not rank projects or silently turn engagement into prestige.

Selecting a cover opens the **Project Record / Hồ sơ công trình**, retaining inputs and brief, client and permissions, site/location and survey evidence, milestones and decisions, 2D/3D/render outputs, Present decks, BOQ/spec/approvals, learned knowledge and the resources distilled back into Master Library. The record preserves authorship, source, stage, revision, approval and where-used links rather than becoming a folder of disconnected exports.

Project Record navigation mirrors the canonical project stages without exposing the internal builder control-plane numbering as product UI. Visual reverse search traces an image through five inspectable links when evidence exists: project → source file and stage → specified material/object → supplier/catalog source → deck and approver. If the chain cannot be proven, IF states that it does not match; it never guesses provenance.

Project Legacy is permission-filtered, local-first and exportable. Archiving a project does not delete its record, learned decisions, library lineage or audit trail; reuse into a new project creates explicit derivatives rather than rewriting the original legacy.

### 8.2 Checkpoint Beacon and Flow Compass

`IF-PRODUCT-FLOW` is the single source of project progress and checkpoint truth. **Checkpoint Beacon** is its compact orientation signal in the top-right cluster; **Flow Compass** is the detailed surface opened from that signal and may also be pinned as a Home widget or appear contextually from the Adaptive Work Dock. Home Resume and Project Legacy may reflect or link to this same state; they do not create competing progress systems.

Compass scales without changing meaning: **S** shows current stage and state; **M** adds current task, previous/next checkpoint and save/sync truth; **L** adds evidence, blockers, owner, dependencies, decisions and available actions. “My Flow” is a permission-filtered Home representation of the same source, not a separate task database.

Beacon expands into Compass; Compass can open the exact project object, stage or focused editor and return with selection, camera, page or playhead intact. Status is derived only from real receipts/checkpoints. AI may summarize, explain and propose the next action, but cannot mark progress, approval, sync or completion by assertion.

Every view declares freshness, offline/stale state, owner and scope. Permissions filter data before preview. Missing evidence remains missing; blocked work stays visibly blocked; no engagement score, motivational animation or AI confidence may replace project truth.

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

## 18. Full IF capability register · Hoà consolidation 2026-09-03

This register prevents visual work from shrinking IF into a shell redesign. It records the complete product direction Hoà reiterated across the working conversation. An item being listed here means **required product scope or an explicit research/contract obligation**; it does not mean implemented, proven or ready to ship. No item may disappear merely because its screen is not yet designed.

### 18.1 One source, three professional stages

- One shared object and provenance spine runs from Workspace → Project/Site → Inspiration/Knowledge/Library → 2D → 3D → Render → BOQ/Spec → Present. Users must not re-enter the same identity, material, dimension or decision at each stage.
- The exchange format remains portable and local-first; project/workspace data, permissions, history and derived outputs remain distinguishable. Derived geometry, AI inference and catalog facts never masquerade as verified source truth.
- Desktop and tablet/Pencil are two deliberate input grammars, not one responsive hybrid. Both operate on the same project objects, command identities, undo history and provenance.

### 18.2 Workspace and project entry

- Workspace Home, Projects, Inspiration and Library are ordinary content-led application surfaces, not CAD canvases. Home is an iPad-like, highly customizable personal work surface governed by §5.2a–b.
- Project entry carries truthful current work, next action, checkpoint, site/location, permissions, recent evidence and recoverable return state into the professional Stage surface.
- A pinned project location opens a Site Survey/existing-conditions chain and may exchange field evidence with ArchiNote through an explicit adapter. Region-aware assistance may propose local story, climate/context and local materials with cited sources; proposals never silently become Project DNA.

### 18.3 Inspiration and visual understanding

- Inspiration supports lawful high-quality sources, search by project name and semantic filters including Furniture, Wall, Ceiling, Floor, Lighting, Material, Detail and Spatial Context.
- Every image can be viewed as Context, Isolate or Cutout/background-removed where technically and legally allowed. Intake has quality, privacy, permission, license, provenance and duplication gates before promotion.
- Vision analysis reads composition, geometry cues, object boundaries, construction/detail cues, palette, material appearance, light, camera/perspective and style. It records confidence and uncertainty, not just tags.
- A group of references becomes an editable visual-DNA proposal/recipe with traceable sources. Applying references must constrain intent while minimizing semantic, dimensional and material drift; it must not flatten the design into an uneditable image.

### 18.4 Image to Spec and machine vision

- The target chain is image/perspective/sketch/document → identify and segment room, background, furniture, ceiling, wall, floor, openings, lighting and details → name/classify objects → associate material/PBR candidates → create editable native objects and separated technical/detail views → dimensions/spec/BOQ with provenance.
- IF should make useful sense of any admitted visual input, but admission does not imply certainty. Measured, declared, catalog, user-overridden and inferred values remain visibly different. Unknown dimensions remain unresolved until calibrated or confirmed.
- Image-to-Spec must preserve the source, masks, detected objects, confidence, corrections and reversible promotion. Human correction improves later suggestions without rewriting the original evidence.
- **Brief/Text to Space to Detail to Furniture** is a first-class path alongside Image-to-Spec: description + project brief → spatial program and relationships → each space's architectural/detail requirements → furniture, fixtures, equipment and materials → dimensionally valid 2D layout. IF uses canonical 2D asset definitions already present in Master Library; it must not draw anonymous placeholder furniture when a governed asset is required.
- Generation keeps four inspectable, revisable layers rather than collapsing everything into one AI image: (1) program—users, activities, room list, areas and priorities; (2) space—zones, adjacency, circulation, orientation, openings and project/code constraints; (3) space detail—ceiling, wall, floor, built-in, lighting, services, clearances and construction intent; (4) FF&E/material realization—rank compatible furniture/fixtures/materials from the authorized Master Library by dimensions, function, style/DNA, material, availability, provenance and budget. A beautiful match never overrides geometric fit, constructability or access rights.
- Each placed object retains the Library asset identity and declared dimensions, plus why it was selected, alternative candidates and confidence. Users may lock rooms/objects, replace one item, regenerate only a zone, or compare variants without moving approved geometry. Unavailable or missing assets remain explicit unresolved slots; IF never invents catalog facts.

### 18.5 2D system

- **2D Sketch:** rapid ideation optimized for touch and Pencil, gestures, palm rejection, direct manipulation and large reachable controls.
- **2D Pro:** professional CAD drafting comparable in depth to current AutoCAD/Revit workflows: precision input, snaps/constraints, layers, blocks/components, annotation, dimensions, hatches, sheets, scale and reliable undo/recovery.
- The same plan supports two truthful representations: Technical Drawing with disciplined line hierarchy/poché/dimensions, and Schematic + Materials with zoning, hatch and material fills. They are views of one source, not duplicated drawings.
- Geometry and presentation follow professional drawing conventions while MasterTool packages recurring domain operations into fewer steps without sacrificing numeric control or editability.

### 18.6 3D system and MasterTool

- 3D targets professional modeling depth associated with 3ds Max/Blender, while direct creation and manipulation should approach SketchUp’s learnability. Scope includes precise solids/surfaces, transforms, components, modifiers/operations, materials, cameras, lighting, animation/motion and construction-level detail.
- MasterTool groups characteristic workflows by human intent. A complex operation that conventionally takes about twenty actions should target roughly five meaningful steps: choose intent/context → place or sketch → constrain/parameterize → preview/refine → confirm. Reduction must not remove expert access, precision, undo or source identity.
- Human and Vitals use the same canonical command/object system. AI may prepare, operate, compare and propose through those tools; it cannot mutate verified project truth silently.

### 18.7 Render, image and movie flow

- Render must support high-quality interior visualization: geometry/camera preservation, lighting and material control, clay/sketch/depth guidance, photoreal generation, local mask/inpaint editing, relight, material/furniture variation, upscale, comparison, batch variants and provenance.
- Node workflows are classified by user intent and media transition—Image, Geometry/3D, Material, Light, Camera, Enhance, Composite, Review and Movie—rather than exposing an undifferentiated technical node catalog.
- Image-to-movie and text-to-movie remain part of the same traceable flow. Every generated result points back to inputs, model/provider/settings, masks and accepted revisions; mock or unavailable providers are explicitly labeled.

### 18.8 Library and reusable knowledge

- **Master Library is IF’s total resource system**, not merely a material browser. It contains Knowledge Base, Collections, furniture, materials/PBR, CAD blocks, 3D components, IDFC packages, images/media, fonts, Present templates and reusable Tool Packages.
- Every asset needs stable identity, preview appropriate to type, source/author/license, physical/spec metadata, assurance grade, versions, variants, offline state, permissions and where-used. Promotion from Files/Inspiration is explicit and reversible.
- Furniture and construction items retain names, dimensions, materials, PBR maps, 2D/3D representations and downstream BOQ/Present meaning. Missing representations remain explicit rather than invented or silently omitted.
- Files do not become knowledge merely by being stored. Each admitted source preserves an immutable original, then passes a type-specific pipeline: structural parse → semantic units → entities/relations/rules → source spans and version → permission/scope/freshness/assurance → searchable index and graph/schema records. Vitals retrieves those records with citations and uncertainty; unreadable or ambiguous content remains `UNKNOWN`.
- Vitals memory and Knowledge Base remain related but distinct. Knowledge Base stores governed reusable knowledge; Vitals memory stores learned personal/project/studio/system patterns with consent, provenance, edit/forget/export controls and model-replacement portability.
- **Collection+ is an existing two-level Files/Master Library mechanism, not a generic moodboard label.** Its eight established packs are Materials, Furniture, Typical Details, Plants·People, Design DNA, Learned from Projects, Presentation Templates and Know-how. Stable codes use `COL-<TYPE>-NNN`; filters cover type/source/status/update; sharing scope is Personal, Team or Studio. A pack with no connected store remains explicitly empty rather than fabricated.
- Collection+ Furniture accepts authorized manufacturer 3D models and catalog feeds from recognized brands. Every imported item keeps manufacturer, product line/SKU, model/version, source URL or package, real dimensions/units, material/finish options, geometry/LOD, update date, territory and license/redistribution rights. IF validates files before indexing and links 2D symbol, 3D geometry, specification, BOQ and Present representations under one asset identity. Reference-only rights store a link and permitted metadata rather than copying protected geometry into shared/exported packages; revoked or expired rights remain explicit instead of silently substituting another model.
- **Design DNA distillation already has a rule-based, zero-key foundation.** User-selected sources feed eight provenance-bearing layers: source imagery, spatial language, palette/ratio, material ids, lighting, framing, intent and constraints/confidence. Machine-derived fields remain `inferred`; human-confirmed fields become `verified` and are preserved during later re-distillation. Missing sources leave fields empty. AI enrichment is a later, separately governed layer—not permission to overwrite verified taste.

### 18.9 BOQ, specifications and Present

- BOQ consumes verified/shared objects and reports quantity provenance, drawing mismatch, manual overrides and recalculation after source change. Area, length and count are first-class where appropriate; inferred quantities cannot appear verified.
- Specifications bind project objects, materials, construction details, images, dimensions and approval state. Image-to-Spec outputs enter as candidates until reviewed.
- Present is a professional structured document/page/slide editor with masters, grid/guides, notes/outline, live project content and direct composition where needed. It supports client decks, boards, schedules/specs and truthful PDF/PPTX/HTML/video export fallbacks.

### 18.10 Vitals, learning and professional judgment

- Vitals is an AI design colleague using IF’s real tools, current selection, project brief, approved taste/DNA, constraints, site evidence and history. It explains sources, proposes reversible operations, asks only material questions and never fabricates progress or approval.
- Its training/knowledge plan covers basic-to-advanced professional practice in AutoCAD, Revit-like 2D/BIM reasoning, 3ds Max, Blender, SketchUp-like direct modeling, rendering, filmmaking/camera/editing, presentation, graphic composition, typography, proportion, color, light, material and construction/detail logic.
- The quality brain must judge with measurable composition, proportion, hierarchy, palette, contrast, lighting, material plausibility, construction logic and brief fit. “Beautiful/ugly” is never an unsupported score; judgment carries criteria, evidence, confidence and alternatives.
- Learning distinguishes personal habit, project rule, studio policy, catalog fact and general professional pattern. Users can inspect, correct, pause, forget and replace the AI/model without losing project data or workflow memory.

### 18.11 Interaction, design system and visual identity

- IF retains a coherent design system: semantic tokens, typography, spacing, radii, elevation/glass, iconography, states, motion, accessibility and desktop/tablet input patterns. Project Brand Kit never recolors protected product semantics.
- App chrome remains calm and mostly monochrome with theme-appropriate accent. Multicolor is reserved for AI Create and unmistakable AI status/signifiers, not scattered decoration.
- Left Bar, Adaptive MasterTool/Dock, Context Studio/Inspector, Action Lens and object selection share canonical commands while adapting to surface and input mode. CAD/3D/Render own canvas grammar; Workspace does not. Present uses its own page-editor judgment.
- Motion is causal: it shows source, destination, continuity, tool state, object identity and recovery. Decorative animation cannot delay work, hide state or compete with the design content.

### 18.12 Shipping and non-loss gate

For each capability above the maintained implementation view must record: `NOT STARTED | RESEARCHED | CONTRACTED | IMPLEMENTED | TARGET-TESTED | RUNTIME-PROVEN | SHIPPED`, plus owner, canonical source, dependency, safety valve and latest evidence. “Designed” cannot be reported as “implemented”; targeted tests cannot be reported as full-system PASS.

Before release, an end-to-end professional loop must be replayable on real project data: create/open project → site/reference intake → 2D → 3D → materials/library → render/edit → BOQ/spec → Present/export → reopen/undo/where-used/provenance. Every unsupported or unresolved branch remains visible and recoverable. This register is the non-loss checklist; later packets may refine an item but cannot silently delete it.

### 18.13 Identity, teams, assignment and access control

- IF requires enforceable access control at Account, Studio/Tenant, Project, Stage, folder/collection, asset, document/object and action levels. Hiding a control is not authorization; every read, search/index, preview, download/export, mutation, AI retrieval and background job checks permission before loading protected bytes or metadata.
- Project membership is distinct from presence and task assignment. The system records who is a member, their role, which projects/stages/assets they may see or edit, what work is assigned to them, who assigned it, due/checkpoint state and the evidence/history of completion. An avatar or “online” state never grants access.
- Existing project roles are `owner | crea | drafter | bim | viewer`, with one membership row per user/project and owner/viewer boundaries. This is an implemented foundation, not proof that every route is protected. Role labels and stage ownership may be refined through a migration contract, but enforcement must default deny and preserve the last-owner guard.
- Required project operations include invite/accept/decline/expire/revoke, change role, remove and re-invite, temporary/guest access, team/group assignment, transfer ownership, leave project, read-only review and explicit external-client sharing. Every operation is auditable and conflict/version aware.
- Collections and Master Library resources support Personal, Project, Team and Studio scopes plus lawful Public/Licensed sources. Promotion or sharing previews exactly who gains which capability; revocation handles cached/offline copies according to declared policy.
- Vitals can see and act only within the invoking human/service identity and the current project scope. It cannot use inaccessible Knowledge, infer membership from content, broaden sharing, approve its own proposal or assign work beyond delegated authority. Every AI action records actor, human sponsor, target, source and undo/recovery status.
- Current evidence also exposes an architectural mismatch to resolve: File Manager models `knowledge` as a separate read-only root while Hoà’s current product direction places Knowledge Base inside Master Library. Migration must preserve existing data and aliases while unifying the product surface; it cannot silently move, expose or delete protected knowledge.

### 18.14 Calendar, meetings and optional personal services

- IF may connect Microsoft 365 through the user’s own identity to read Outlook calendar, Teams/meeting context and mail metadata under least-privilege scopes. It must distinguish meetings, project milestones, focus time, room/resource bookings, personal busy blocks and leave/vacation. Private event content is not exposed merely because free/busy time is visible.
- Calendar items may link to Projects, Tasks, people, meeting notes and decisions. A meeting pipeline may capture authorized notes/transcript → draft minutes → chairperson review → approved decisions, assigned tasks and change requests with source/time provenance. IF does not build a replacement video-call engine.
- Writing invitations, changing meetings, booking rooms or submitting/approving leave requires a separate write permission and explicit confirmation. Read-only connection remains useful and must not be silently upgraded.
- Existing implementation evidence is partial: Microsoft identity/token reuse and `Calendars.Read` plus an MS Graph event reader exist; full calendar/team/vacation product flow and UI are not runtime-proven.
- Home’s optional Personal/Relax layer may connect **Spotify, YouTube and Apple Music**. It provides glanceable now-playing/search/playlist or compact playback controls appropriate to each provider; it does not rebuild those services inside IF. Widgets appear only when the user adds and connects them, and disappear cleanly when unavailable.
- Listening history remains personal and cannot feed Project DNA, studio analytics or Vitals learning without separate, informed consent. Provider scopes, subscription requirements, quota, attribution, offline behavior and disconnect/delete controls are explicit.
- Existing implementation evidence is tiered: Spotify currently reads now-playing metadata; YouTube has quota-limited search/embed support; Apple Music remains a MusicKit/JWT stub. None may be presented as complete playback integration.

### 18.15 Settings and replaceable AI

- Settings is the single product surface for the existing four AI levels: **1 No AI / deterministic core; 2 local or user-selected oneAI; 3 medium cloud AI; 4 high-quality cloud AI**. Cost, privacy boundary, locality, expected capability, availability and fallback are visible before selection. Method-quality tiers inside vision/metrology are a different scale and must not reuse the same wording ambiguously.
- Users can replace provider/model/runtime through one adapter registry rather than editing workflows or nodes. Capability negotiation maps each task to compatible text, vision, image, embedding, segmentation, render or local models; an incompatible model is rejected with a reason and an available alternative.
- Provider changes preserve canonical command ids, project objects, Knowledge Base, Design DNA, Vitals memory, prompts/recipes, provenance and accepted outputs. Provider-specific job ids/settings remain attached to the historical result but do not own product truth.
- Secrets remain in OS keychain/secure local configuration and are never placed in project files, logs, exports or shared memory. Connections support test, health/status, rate/cost limits, disconnect, revoke and deletion.
- Fallback is explicit and truthful: deterministic/local core remains available where supported; a provider failure cannot silently return mock output as real AI. Every result states the capability/tier that actually ran without forcing technical provider jargon into the main creative flow.
- Existing implementation evidence is partial but material: `AiTier` 1–4, Settings UI, tier resolver, provider registry and persisted selection exist. Current selection is browser-local in places and provider replacement is not yet complete across all direct callers; therefore “Replace your AI” remains an architectural target, not a shipped claim.

### 18.16 Library acquisition, normalization and ready-made model packs

- IF avoids redrawing commodity assets by operating a governed acquisition pipeline for ready-made 2D symbols, colored entourage, technical details, furniture, vegetation, PBR materials, HDRI and 3D/BIM models. Search quality never overrides license, provenance, geometry or metadata quality.
- One logical `.idfc` family may contain `plan-line`, `plan-color`, elevation/section, preview, runtime 3D, collision/bounds, multiple LODs, material/PBR representations and specification/catalog links. These are representations of one asset identity, not unrelated files.
- The shipped starter library is deliberately small and complete. Raw assets may be bundled only when commercial use and redistribution are demonstrably allowed per asset; CC0 is preferred. Every item records source, author/manufacturer, SKU when applicable, license and license snapshot/hash, attribution, allowed uses, redistribution status, retrieval/update time, checksum, native format/version, units, dimensions, insertion anchor, region and derived representations.
- Manufacturer and marketplace libraries default to `reference-only` or `user-import` unless IF has an explicit distribution/partner agreement. Reference-only assets are not embedded into shared `.idf`/`.idfc` exports. Upstream revocation or expiry is visible; it never silently deletes a project-used representation or substitutes another product.
- Approved starter sources may include a curated CC0 subset from Poly Haven, ambientCG, Openclipart, Open Peeps, Smithsonian Open Access and selected CC0 packs, with per-item verification. Sources such as BIMobject, NBS, ARCAT, CADdetails, pCon, Configura and manufacturer download centers enter through lawful connectors, deep links, user-authorized import or partnership—not scraping or bulk mirroring.
- Acquisition runs metadata and thumbnail first. Heavy geometry/textures download on demand into a bounded cache; only reproducible cache may be evicted automatically. User originals, project-used assets, source evidence and unique derived work are never cache-cleanup targets.
- Import validation covers MIME/format, malware/archive traversal, unit and coordinate sanity, bounding box, polygon/triangle/material/texture budgets, missing links, duplicate identity, LOD quality and visual/technical review. Low-detail open models may serve as explicit proxy/preview assets; they cannot masquerade as production-quality furniture.
