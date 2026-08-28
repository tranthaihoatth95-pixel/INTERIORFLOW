# IF Task-first Interaction Contract 028

Version `028.0` · 2026-08-26 · **CANDIDATE / PROVISIONAL** · Design Authority · visualization workspace only

This contract converts research `R-UX-GLOBAL-001` into a reversible UX proposal. It does not modify production or canonical, does not assign a writer, and does not claim approval or runtime proof.

## 1. Premise verdict

| Research premise | DA verdict | Design consequence |
|---|---|---|
| Intent first | **KEEP** | Entry starts with a task and target, never an inventory of components. |
| Work stays visible | **KEEP** | L0 object/canvas/content remains the visual protagonist. |
| Depth follows need | **KEEP + DEFINE** | Quick → Guided → Deep is a capability escalation with explicit thresholds and return path. |
| Editable + traceable result | **KEEP** | Output retains identity, source, version, undo and next-stage links. |
| Seven task families | **MODIFY** | Use as command metadata and task-map filters, never seven routes or permanent navigation groups. |
| Shared grammar | **KEEP + MODIFY** | `Target → Act → Preview → Refine → Commit → Continue`; “Commit” may be immediate with Undo for low-risk actions. |
| Contextual task bar pattern | **KEEP mechanism** | IF uses Context Action near selection and Adaptive Work Dock packages; no Photoshop skin or duplicate toolbar. |
| Saved workspace pattern | **KEEP mechanism** | User-owned Tool Packages and remembered ToolWindow layouts; machine proposes but never silently rearranges. |
| Published-library update pattern | **KEEP mechanism** | Same asset identity/version; consumer reviews updates. Architecture owns the storage contract. |
| Pinterest as design proof | **REJECT** | Discovery evidence only; no provenance/approval/reuse contract inferred. |

## 2. Naming decision

- **Product philosophy:** `DA-PHIL-028.1 PROVISIONAL` — **Ý định thành hình / Intent Takes Form**. This names the experience promise, not a new subsystem.
- **Interaction system:** retain **IF Living Interaction System / Hệ Tương Tác Sống**. No additional system name.
- **Visual direction:** `DA-VIS-028.1 PROVISIONAL` — **Quiet Spatial Editorial / Không gian tĩnh, nội dung có nhịp**.
- **Motion grammar:** `DA-MOTION-028.1 PROVISIONAL` — **Causal Motion / Chuyển động nhân quả**, a grammar inside the Living Interaction System.

Safety valve: names are copy/config tokens until eye approval; prior labels remain available. No schema or object identity depends on them.

## 3. Interaction architecture: Quick → Guided → Deep

### Quick · L2 working set

Use when intent is unambiguous, impact is local, action is reversible, and error is cheap. Carrier: **Context Action** or one Dock command. User chooses a target, sees immediate acknowledgement and a local preview/result. Confirm dialogs are forbidden when Undo is sufficient.

### Guided · L3 temporary flow

Use when the task contains approximately 3–7 dependent decisions, needs comparison/evidence, or benefits from a live preview. Carrier: an anchored **Guided Sheet** inside Context Studio or a temporary ToolWindow. It shows current step, remaining decisions, preview, Back/Cancel and `Open Deep`. It never becomes a new route. Progress represents completed decisions, not fake percentages.

### Deep · L4 focused work

Use when the task needs precision masks, constraints, tracks, batches, variants, history or expert multi-panel work. Carrier: **ToolWindow → Context Studio → Focused Editor** according to space and concentration needs. The same target, draft, selection, camera/time/page and provenance continue inward and return outward. Escape/Back returns to the exact prior context.

### Escalation contract

`Quick result → Refine` preserves the result as an editable draft. `Guided → Deep` carries all choices and previews. `Deep → return` publishes a new revision of the same object, never a detached copy. Collapse restores a concise summary and the next valid action. User may bypass Guided when expertise and permissions allow.

Stable state ID: `DA-DEPTH-028.1`. Feature flags may independently expose Guided and Deep carriers. Rollback returns entry actions to their earlier carrier without migrating or deleting task data.

## 4. Carrier definitions

| Carrier | Job | Lifetime/depth | Must not become |
|---|---|---|---|
| **Context Action** | 3–5 deterministic actions at selection/pointer | L2/L3, temporary | long menu wall, AI chat or second command registry |
| **Tool Package** | user-owned saved working set of 4–8 command identities | L1 Dock package | duplicated tool implementation or AI-reordered toolbar |
| **ToolWindow** | movable/dockable/resizable workshop for one activity | L2; multiple allowed | fixed modal or generic panel containing every task |
| **Context Studio** | coherent inspection, guided decisions, source/history and properties | hidden by default; L2/L3 | permanent right rail or route |
| **Focused Editor** | deep precision work on the same object | L4, explicit | separate document/state or tiny corner editor |

Transition rule: source-anchored expansion, same command/object identity, focus return, layout memory, pin/minimize/close remain distinct.

## 5. Task Map

The seven families are filters in command search, package creation and Context Studio—not navigation:

1. Nhận & hiểu — ingest, rights/source check, extract, analyze.
2. Khám phá & định hướng — shortlist, compare, moodboard, DNA candidate.
3. Tạo & bố cục — generate, sketch, compose, 2D/3D/present assembly.
4. Chi tiết & định nghĩa — dimensions, constraints, ProductSpec, standards, BOQ.
5. Biến đổi & tinh chỉnh — transform, crop/mask, replace, batch.
6. Soát & quyết — compare, check, comment, approve, checkpoint/version.
7. Trình bày & phát hành — narrative, fidelity review, PDF/PPTX/HTML/video, revision.

Shared command metadata candidate: `taskFamily`, `depthEntry`, `risk`, `reversibility`, `inputModes`, `requiredEvidence`, `outputType`, `nextActions`. Product owns capability semantics; Architecture owns persistence/contracts.

## 6. Three designed flows

### FLOW-IMG-028 · Chuẩn hóa ảnh sản phẩm

Import/choose image → source/rights status → **Quick Remove** local preview → Refine opens Guided mask decisions → Deep opens Focused Image Editor for edge/alpha/perspective → identity + ProductSpec → publish candidate to Project/Org Library → linked use in 2D/3D/Present/BOQ. Original and editable mask remain. Tablet: pen keep/remove strokes, two-finger pan/zoom, explicit Apply/Cancel.

### FLOW-CONCEPT-028 · Từ đề bài tới concept

Brief in Resources/Project → extraction with observed/inferred labels → unanswered questions → Inspiration shortlist → Concept Room compare → 2–4 directions → moodboard review → human approval → DNA candidate → professional approval → apply. Guided is primary; Deep opens Sources/Knowledge or comparison canvas without losing the active direction. Touch uses bottom sheet and full-height comparison rather than hover.

### FLOW-ISSUE-028 · Hoàn thiện khu vực để phát hành

Select area → Action Lens `Kiểm để phát hành` → Guided checklist: layout, dimension/constraint, material/ProductSpec, conflicts, revision compare → fix in linked Focused Editors → human review/checkpoint → Present/BOQ fidelity preview → issue revision/transmittal. Deterministic failures identify object/evidence; AI critique is separately labeled. Release is explicit and permission-gated.

## 7. Visual and motion contract

- One screen, one protagonist. Squint test must reveal work before Router/Dock/Search/glass.
- L0 work; L1 orientation/persistent support; L2 working set; L3 temporary inspection; L4 deep focus. A permanent L3 is a depth error.
- G0–G3 follow meaning. Glass belongs to temporary shells and edges, never reading-heavy content or glass-on-glass.
- One app accent. Selection, active tool, approved status and AI-generated provenance use different shape/icon/label semantics, not four accent colors.
- Motion vocabulary: acknowledge, reveal, transfer, transform, continuity and truthful state. It is short, interruptible and source-anchored. No idle breathing, particle wallpaper, floating chrome or decorative glow.
- Reduced motion replaces travel/morph with static depth and state changes. Reduced transparency retains hierarchy on solid surfaces.

## 8. Honest states and input parity

Every carrier covers default, hover, keyboard focus, press, selected, unavailable-with-reason, loading, empty, fewer-than-expected, read failure, unknown/stale, offline, permission, conflict, running/cancelled/succeeded/failed and recovery. Unknown never maps to calm or success. Measured work gets measured progress; other work gets milestone/indeterminate state.

Mouse, keyboard, touch, pen and command palette reach every meaningful action. Drag always has a pointer/keyboard alternative. Touch does not require hover; targets meet the product accessibility gate. Text-entry guard protects shortcuts and Vietnamese IME. Reduced modes preserve the same information.

## 9. Command identity examples

Candidate IDs (Architecture/Production must map to the canonical registry, not duplicate them):

- `image.removeBackground.quick`
- `image.removeBackground.refine`
- `image.openFocusedEditor`
- `concept.extractBrief`
- `concept.compareDirections`
- `concept.proposeDnaCandidate`
- `review.checkAreaForIssue`
- `review.compareRevision`
- `issue.publishRevision`
- `toolPackage.activate`
- `task.resumeContext`

Each command exposes VI/EN label, canonical icon, scope, availability/reason, shortcut, risk, preview/undo adapter and run state. Exact registry names remain an implementation mapping dependency—not proof these IDs exist.

## 10. Acceptance and proof gates

- Visual proof: desktop ≥1440, 1100px, landscape/portrait tablet, light/dark, reduced motion/transparency; real-content and no-data versions.
- Interaction proof: Quick → Guided → Deep preserves target/draft/selection and returns to source; cancellation and Undo work at every reversible boundary.
- Accessibility proof: keyboard-only, screen reader, touch/pen, drag alternative, focus restoration, error announcement.
- Truth proof: source/provenance/version/permission remain attached; AI result is editable and never silently advances approval.
- Runtime proof: implementation owner supplies recordings and data evidence. Design mock is not runtime proof. Quality alone declares gate status.

## 11. Ownership and rollout

Design Authority owns this interaction/visual contract. Product reviews capability semantics; Architecture reviews state/storage/command contracts; Quality defines and audits runtime evidence; Production Control creates the packet and writer lease. Proposed rollout is additive: one flow behind a flag, runtime parity, then the next flow. Prior carriers remain until parity. No destructive migration.

