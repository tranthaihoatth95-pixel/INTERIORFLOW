---
name: if-design
description: The durable design brain of InteriorFlow. Load this BEFORE any user-visible UI decision, design brief, mock authoring, visual implementation, or visual QA. Encodes IF's human-centric law, product architecture, material/type/motion/icon grammar, Claude Design governance, the Design Contract gate, and the failure ledger. Use whenever work touches Home, Sidebar, Vitals, ToolWindow, Design DNA, Sources, Library, 2D, 3D, Material, Present, Review, Auth, or any shared primitive.
---

# InteriorFlow — Master Design Skill

> This exists because design law kept dying with the session. Prose docs get re-read
> selectively or not at all; a skill loads. If you are about to make a user-visible
> decision and you have not read this, stop and read it.

## 0 · ROOT LAW — start from the human

Never begin a UI decision from existing components, the DB shape, the CSS already there,
or "what controls do we have". Begin from: who is this person, what are they trying to do,
what deserves attention now, what can disappear, what is frequent, what is dangerous,
what is reversible, what breaks creative flow.

> **The designer should spend attention on the design problem, not on operating InteriorFlow.**

Human owns INTENT · JUDGMENT · APPROVAL · AUTHORSHIP.
AI may interpret · propose · generate · rank · summarise · reason.
Deterministic code validates geometry · constraints · identity · revision · source.
**AI never silently mutates canonical truth.** Standards checking is machine work, never AI.

## 1 · ARCHITECTURE — the words have fixed meanings

| Term | Is | Is NOT |
|---|---|---|
| HOME | personal operating surface | project dashboard, analytics wall, card farm |
| PROJECT | identity + canonical truth | a folder |
| WORKSPACE | resumable working context | a second truth store |
| CANVAS | professional workflow surface | one per stage |
| STAGE | focus / view / mode | a separate app shell |
| TOOLWINDOW | workshop for one activity | a fixed panel |
| SIDEBAR | **map** | launcher |
| VITALS | attention + reasoning | notification feed |
| ACTIVITY | chronology | Vitals |
| REVIEW | contextual human gate | a route/dashboard |
| DESIGN DNA | visual intelligence | social feed |
| SOURCES | project evidence | generic file manager |
| LIBRARY | reusable professional definitions | per-stage silo |

**Stage changes what is focused, not the whole shell.** 2D / 3D / Present differ by which
ToolWindows are open and which environment is protagonist — not by replacing the product.
One pipeline: 2D → 3D → Render/Visual → Present stays connected. No export/import islands.

Never create a second truth source because a screen wants convenient data.

## 2 · GOVERNANCE — who decides what

**Claude Design is the sole authority for all new or changed user-visible visual composition:**
composition, hierarchy, layout, spacing, density, typography, iconography, material, panel
placement, affordances, motion concepts, responsive and touch treatment, state families.

**MAIN implements. MAIN does not redesign while coding.** The forbidden pattern is: request a
mock → glance at it → quietly invent something else in CSS. If a production state is missing
from the design, MAIN marks **DESIGN MISSING** and returns it — MAIN does not fill the gap.

MAIN may decide technical details that do not change visible composition or interaction intent.

Design status vocabulary (canonical locator: `docs/mocks/CLAUDE-DESIGN-CURRENT.md`):
`MISSING · BRIEFED · IN DESIGN · CANDIDATE · INTERNAL PASS · IMPLEMENTED · SUPERSEDED ·
REJECTED · FINAL HUMAN APPROVED`

Only Hoà may set FINAL HUMAN APPROVED. Neither MAIN nor Claude Design self-promotes.
Never pick a mock by filename or mtime — resolve through the index. (mtime is meaningless
here: a bulk token rename once restamped 21 of 36 files.)

## 3 · DESIGN CONTRACT — hard gate

No user-visible production implementation without one. It must carry: system/screen ·
artifact id · design-system version · user job · anatomy · exact layout rules · grid ·
spacing tokens · type tokens · surface tokens · icon tokens · components · **full state
family** · responsive · pointer · keyboard · touch · pen · motion · data requirements ·
**data absence** · accessibility · **what implementation may not change**.

Chain, unbroken: `DESIGN ARTIFACT → CONTRACT → PRIMITIVE → PRODUCTION COMPONENT → RUNTIME
OWNER → TEST → REAL-BROWSER PROOF`. No orphan mock, no orphan user-visible code.

Sufficiency test: if two competent designers could read the spec and produce visibly
different compositions, it is not a spec yet.

## 4 · VISUAL CHARACTER

Quiet · architectural · editorial · precise · tactile · professional · calm · premium · human.

> QUIET FIELD + ONE MEANINGFUL SIGNAL + LOCAL LIGHT + PRECISION AT THE POINT OF ACTION

Forbidden: rainbow UI · neon · startup gradients · card farms · blur everywhere · giant glossy
glass · glow on everything · fake "AI magic" decoration · sci-fi dashboards · generic SaaS.

Apple is a **quality lens, not a skin** — study clarity, deference to content, continuity,
direct manipulation, progressive disclosure, restraint. Do not import iOS cards, consumer
density, or visionOS decoration. Professional productivity beats aesthetic imitation.

## 5 · MATERIAL — G0 to G3

- **G0 ambient/matte** — large fields, canvas surround, background.
- **G1 flat environmental glass** — floating sidebar map, utility ToolWindows, transient
  controls. Flat, restrained transparency and blur, thin edge, shallow depth. No convex lens.
- **G2 active flat glass** — active/selected/focused. Slightly stronger. Still not a block.
- **G3 rare optical glass** — signature actions only. Real optical relationship to the violet
  base: refraction, edge thickness, displacement where appropriate.

**Intensity follows meaning, not component size.** A large widget may be matte; a small
critical action may be stronger.

**G3 ≠ glow.** Forbidden on G3: outer glow, neon halo, emissive bloom, purple aura, milky
plastic, purple gel, visible refraction test stripes, checker/grid proof artifacts.
G3 with zero external glow is still G3.

## 6 · TOKENS — status: **OWED BY CLAUDE DESIGN**

Base grid 4px micro / 8px rhythm. Spacing scale 4·8·12·16·20·24·32·40·48·64·80 — hierarchy is
communicated by step: 4–8 internal · 12–16 group · 20–32 section · 40+ major.

🔴 **These do not exist yet in production-ready form and MAIN must not invent them:**
exact type scale (display/title/body/label/technical/caption with family, size, weight,
line-height, tracking, case rule), colour role tokens, component dimension tables, icon metrics.
Until Claude Design issues them: **DESIGN MISSING**.

Known-good anchors already decided: radius scale `6 / 10 / 14 / 20` + `--r-full`, concentric
rule `rInner = max(4, rOuter − pad)`; sidebar rail **52px**; touch target **≥44px class**.

**Colour must never be the only carrier of meaning.** The violet is an accent, not a fill.

## 7 · ICONOGRAPHY — status: **MISSING, must be built**

Measured: the 2D toolbar is 11/11 lucide; professional drawing symbols exist only as drawing
geometry, never as interface icons. There is no IF icon grammar.

Required before icon work: grid · stroke weight · optical size · corner and terminal character ·
fill/outline law · states (active, selected, running, attention, disabled). Do not mix icon
libraries without optical normalisation. Custom icons only where they improve meaning — never
merely to look unique.

## 8 · MOTION — motion is information

Every animation answers: where did this come from, where did it go, what changed, what caused
it, what is active. Purposes: continuity · causality · hierarchy · focus · state · orientation.

Starting ranges (Claude Design owns final tokens): micro 120–180ms · panel/reveal 180–260ms ·
large continuous 260–420ms. Motion must never slow professional interaction.
`prefers-reduced-motion` must be honoured, and continuous/looping motion is the first thing to
drop. Surfaces expand **from their own anchor** — a thing that opens must appear to come from
where it lives.

## 9 · TOUCH IS FIRST-CLASS

Never scale desktop controls down and call it touch. Every stage needs its own spec for tap,
double tap, long press, drag, swipe, pinch, two-finger, edge gesture, selection, multi-select,
context, undo, pen. Larger targets, no hover-only discoverability, forgiving docking zones,
transient panels, controls near the object, never covering the canvas.

Responsive means **recompose, not shrink**: FULL → ICON+LABEL → ICON → GROUP → OVERFLOW for
tools; DOCKED → NARROW → COLLAPSED EDGE → TRANSIENT for panels. **Never add a toolbar row.**
Protect the protagonist.

## 10 · TOOLWINDOW — IF must not be less flexible than professional tools

Support unless genuinely inappropriate: move · dock · undock · resize · collapse · pin ·
auto-hide · focus · close · restore · persist. States: COLLAPSED / NORMAL / FOCUSED
(+ floating, docked, auto-hide, pinned). Dock preview appears only during drag.
**The user owns final arrangement**; IF may recommend, never override.

Workspace remembers: stage · selection · camera · zoom · open ToolWindows · position · size ·
dock state · references · current task.

Task-adaptive: when a task becomes active the task comes forward, relevant tools gather,
unrelated tools recede — predictable, reversible, explainable, overridable, persisted.
**Never randomly rearrange the user's workspace.**

Reuse existing infrastructure (`@xyflow/react`, `FlowCanvas`, `InteriorNode`, `ToolWindow`).
Do not build a new canvas framework to redesign chrome.

## 11 · DATA TRUTH

Never use demo/test content to make the product look alive. No fake counts, drafts, activity,
weather, tasks, materials, collaborators, timestamps, images, health, trending.
**If data is absent: hide it, or show an honest empty state. Silence beats fabrication.**

Classify Home content as REAL / DEMO / FIXTURE / PLACEHOLDER. Only REAL defines layout.

Measured trap: 15 `Project` rows = 5 `__nb:` placeholders + ~4–5 fixtures ⇒ real user projects
≈ 0. "21/21" and "19 drafts" are debris. **Measured on the running app ≠ product truth** —
that is exactly how fixtures climb into design requirements.

## 12 · LANGUAGE

One terminology table: KEY · VI · EN · CONTEXT · DO NOT USE. Navigation and status localise
naturally. Established professional geometry commands (Mirror, Array, Offset, Fillet) may stay
English where that reads more professional. **Never mix VI and EN randomly**, never ship
literal machine translation, developer vocabulary, internal IDs, or placeholder identity as
product identity. An unnamed thing is unnamed — not "Untitled flow" promoted to a title.

## 13 · TEST HONESTY — separate axes, never one green

`DESIGN · IMPLEMENTATION · FUNCTION · REAL BROWSER · VISUAL MATCH · INTERACTION · TOUCH ·
MOTION · TERMINOLOGY · DATA TRUTH · LEGACY REMOVAL`

FUNCTION PASS cannot hide VISUAL FAIL. MOCK EXISTS ≠ IMPLEMENTED. SOURCE FIXED ≠ REAL APP PASS.

Build honesty: distinguish CURRENT SOURCE · CURRENT DEV SERVER · PRODUCTION BUILD · FROZEN
REFERENCE. A frozen build cannot prove new source; that state is **PENDING-REBUILD**, not green.
One dev server per tree — two writing the same `.next` corrupts it (symptoms differ: 404 here,
500 there). A red test is evidence; never delete or weaken one to reach green. Judge by exit
code — passing test *names* can contain "FAIL".

Legacy death needs **structural proof** (runtime owner gone/unreachable), not string absence.
Bundle absence is strong supporting evidence — it proves every state, where a screenshot proves
one — but it is not by itself proof an architecture is dead.

## 14 · RESEARCH METHOD

One excellent product doing something = inspiration. **Several converging = a durable law.**
For each reference record: user problem solved · what works · why · shared common law ·
product-specific part · what IF adopts · what IF must not copy · how IF improves it for
interior design. Research enough to decide; do not browse forever.

## 15 · FAILURE LEDGER — turn wrong into law

Record: FAILURE · SYMPTOM · ROOT CAUSE · WRONG ASSUMPTION · CORRECTED LAW · SYSTEM-OR-LOCAL ·
REGRESSION CHECK · SKILL UPDATE. **Same class twice = process failure**; fix the system.
Live ledger: `docs/design-campaign/02-FAILURE-LEDGER.md`.

## 16 · ACCEPTANCE — before claiming INTERNAL PASS

Is the human's job obvious? Is the protagonist obvious? Does content dominate chrome? Could one
fewer panel be visible? Are frequent actions fastest, infrequent ones still discoverable? Does
the user control arrangement? Does the workspace remember them? Does it adapt to touch? Does
motion explain state? One icon grammar? Does the language sound like a global professional
product? Any fake data? Any internal terminology? Is AI proposing rather than deciding? Can the
user reverse things and trace results to sources? Does it feel like IF — and credible beside
serious professional tools?

If not: continue.
