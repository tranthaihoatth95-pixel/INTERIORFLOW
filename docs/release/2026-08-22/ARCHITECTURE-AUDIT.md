# ARCHITECTURE AUDIT — InteriorFlow, 22/08/2026
Sources: repository code + the running packaged build on 127.0.0.1:3777.
No documentation was used as evidence. Where docs and code disagreed, code won.

Method notes that changed answers:
- Import counts were computed from real `import … from` statements, separating
  `import type` (erased at compile, not runtime wiring) from runtime imports.
  A plain text grep inflates every number here, because this repo's comments
  frequently name modules they do not import.
- "Reachable" means a runtime import chain exists from `app/` or `components/`.

## 1. Load-bearing engines (live, wired, tested)

| Engine | LOC | Files | Tests | Reach | User-facing value | Code evidence |
|---|---:|---:|---:|---|---|---|
| `lib/server` | 2,213 | 17 | 14 | 92 UI · 83 API | Shared server layer behind nearly every route | most-imported module in the repo |
| `lib/cad` | 26,913 | 92 | 91 | 76 UI | 2D technical drawing — the deepest system present | incl. `standards/` 2,165 LOC, 13 rule modules |
| `lib/present-editor` | 13,381 | 57 | 43 | 48 UI | Deck/report authoring and export | 43 test files, highest test density after cad |
| `lib/nodes` | 5,306 | 29 | 10 | 26 UI | Node-graph workspace | 130 ids in `registry.ts`; 12 extra def modules via `defs/index.ts` barrel |
| `lib/three` | 4,308 | 16 | 13 | 28 UI | 3D viewport, modelling, capture | `/projects/[id]/render` served by this |
| `lib/capabilities` | 3,163 | 12 | 7 | 8 UI | Named capabilities (image→3D, manufacturer import, motion, render) | wired to `manufacturer-import` API + `CuaAnhThanhSpec` |
| `lib/ai` | 2,509 | 16 | 8 | 22 UI · 12 API | AI job execution + provider tiering | runtime `/api/health` reports `fal:true comfyui:true sd:false` |
| `lib/materials` | 2,428 | 15 | 13 | 13 UI | Material semantics, PBR, matId identity | `matid-identity.ts`, `schema.ts` |
| `lib/site` | 1,696 | 11 | 6 | 10 UI · 2 API | Site Intelligence — location/orientation facts, staleness, recalculation | `dan-xuat.ts` + 6 tests |
| `lib/library` | 1,596 | 12 | 4 | 22 UI | Master Library shelves | 22 UI importers, second-widest UI reach |
| `lib/boq` | 1,371 | 5 | 4 | 8 UI · 1 API | Bill of quantities | `from-project.ts` |
| `lib/integrations` | 1,363 | 18 | 2 | 12 UI · 11 API | External account connection | 9 providers registered: google, ms365, zoom, team, zalo, spotify, youtube, applemusic, lark |
| `lib/notebook` | 569 | 6 | 3 | 10 UI · 9 API | Project notebook capture | 9 API routes |

`lib/idfc-seed` (15,803 LOC) is **generated seed data**, not an engine —
15,532 of those lines are `seed.generated.ts`, emitted by
`scripts/seed-library-idfc.mjs`. Counting it as engine code overstates the codebase.

## 2. Thinly wired — built deeper than they are exposed

| Engine | LOC | Tests | Reach | Gap |
|---|---:|---:|---|---|
| `lib/vision` | 2,123 | 6 | 2 UI runtime importers | Largest capability-to-exposure gap after §3. Camera calibration, metrology, Hough line detection — surfaced through only 2 call sites |
| `lib/review` | 751 | 3 | via `ReviewPanel` | The deterministic two-layer checking engine. `ReviewPanel` IS mounted in `AppShell`, `Viewport3D` and `PresentEditor`, so it reaches all three stages — but the engine is 751 LOC against 2,165 LOC of rules in `lib/cad/standards`, i.e. the rulebook is ~3× the harness that presents it |
| `lib/grounded-render` | 408 | 1 | nodes barrel only | Reaches the UI solely through `defs/grounded-render.ts` → `defs/index.ts` → `registry.ts`. No direct UI import |
| `lib/gateway` | 319 | 3 | 5 UI | Format routing |
| `lib/dna` | 359 | 2 | 3 UI | Design DNA |
| `lib/distill` | 154 | 1 | lib-internal only | 3 runtime importers, all inside `lib/` |
| `lib/storage` | 145 | 1 | lib-internal only | 4 runtime importers, all inside `lib/` |

## 3. Dead code — complete, tested, and called by nothing

| Engine | LOC | Files | Tests | Status |
|---|---:|---:|---:|---|
| `lib/idfc-import` | 3,341 | 5 | **4** | **Zero runtime importers anywhere** — checked `app/`, `components/`, `lib/`, `app/api/`, `scripts/`, `present-demo/`. Only 3 `import type` references (compile-time only) and comment mentions |
| `lib/lighting` | 135 | 1 | 1 | **Zero references of any kind.** The only 3 hits in the repo are comment text in `materials/schema.ts`, `cad/idfc.ts`, `review/luat/rules-3d.ts` |

`lib/idfc-import` is the single largest finding in this audit. It implements
photo → mesh → parametric `.idfc` component import: `chuan-net.ts` alone exports
`parseGlbGeometry`, `extractGlbImage`, `eigenSym3`, `fitCylinderPts`, `fitTorusPts`,
`circumCircle3`. It has four dedicated test files (`chuan-net`, `from-photo`,
`part-lock`, `surface-graph`). Nothing in the product calls it.

It is also recorded as **complete** in `scripts/frontier-registry.mjs`
(entries `import-ghe-tu-hinh` and `chuan-net-3d`, both `trangThai: 'xong'`),
because that registry's evidence check is a text pattern against the directory
(`{ dir: 'lib/idfc-import', mau: 'chuanNet|chuan-net' }`) — which the files
satisfy by existing. Library completeness is being counted as product completeness.

## 4. Runtime state of the packaged build

Measured against the running app, not inferred.

| Surface | HTTP | Server-rendered content |
|---|---|---|
| `/`, `/login`, `/files`, `/library`, `/library/gallery`, `/materials`, `/colors`, `/tasks`, `/projects`, `/settings`, `/workhub` | 200 | shell renders |
| `/projects/[id]/cad` | 200 | real `<canvas>` + 58 controls + rail |
| `/projects/[id]/present` | 200 | rail + 17 controls, no canvas |
| `/projects/[id]/overview` | 200 | rail + 12 controls |
| `/projects/[id]/render` | 200 | **0 controls, no rail** — consistent with a client-only WebGL view; server HTML cannot confirm either way |
| `/api/health` | 200 | `{"fal":true,"comfyui":true,"sd":false}` |
| `/api/projects` | 401 | auth enforced, no data leak |

API surface: 76 route files. Largest groups: `auth` 9, `projects` 6,
`notebook` 5, `library` 5, `project-files` 4, `integrations` 4.
One route carries a not-implemented marker.

## 5. Gaps, stated as measured

1. **`lib/idfc-import` (3,341 LOC, 4 test files) has no caller.** Complete at the
   library layer, absent from the product.
2. **`lib/lighting` is dead** — referenced only in comments.
3. **`lib/vision` (2,123 LOC) is exposed through 2 runtime call sites.**
4. **The rulebook exceeds the harness.** `lib/cad/standards` holds 2,165 LOC across
   13 rule modules (`vn-fire`, `vn-accessibility`, `vn-electrical`, `vn-lighting`,
   `vn-residential`, `intl-egress`, `intl-occupant-load`, `iso-drafting`, `neufert`);
   `lib/review`, which presents findings, is 751 LOC.
5. **`grounded-render` and `distill`/`storage` are reachable only indirectly** — via
   a node barrel or via other `lib/` modules — so their UI exposure is a side effect
   of another module's wiring rather than a declared surface.
6. **Test coverage is extremely uneven.** `lib/cad` 91 test files, `lib/present-editor`
   43, `lib/three` 13, `lib/materials` 13 — against `lib/integrations` 2 (18 files),
   `lib/studio` 0 (3 files), `lib/images` 0, `lib/auth` 0.
7. **`lib/integrations` declares 9 providers with 2 test files.** Provider auth is
   `oauth` ×3 / `apikey` ×1 in the registry.
8. **The completeness tracker cannot distinguish a built library from a shipped
   feature**, because its evidence test is a text match against a directory.
   This is the mechanism by which gap 1 stayed invisible.

---

# FOLLOW-UP — 22/08/2026, same day
Measurement-system repair. Sections 1–5 above are preserved as originally measured,
including the parts this section corrects.

## C1 · CORRECTION — `lib/lighting` is NOT dead
§3 called it "zero references of any kind". **Wrong.**
`lib/review/luat/rules-3d.ts:31` imports it at runtime:
`import { roomLuxEstimate, DEFAULT_UTILIZATION_FACTOR, DEFAULT_MAINTENANCE_FACTOR } from '../../lighting/lux'`
and calls `roomLuxEstimate(inRoom, areaM2)` at `:151`.

Why the audit missed it: the specifier is `'../../lighting/lux'` — no `lib/` substring —
and the ad-hoc scan matched on `lib/<name>`. This is **exactly the trap already documented
in `scripts/soi-cam-dien.mjs`'s own docstring** (cạm bẫy ①, the `lib/pdf-font.ts` case).
The existing machine was right; the hand-rolled script was wrong.

Correct status: **runtime-wired, transitively user-reachable** (via `lib/review`, which has
a UI caller). Nothing to do. Do not "connect" it — it is already connected.

## C2 · The real defect was a measurement bug in an existing machine
`scripts/soi-cam-dien.mjs` (371 lines, built 17/08) already existed to catch precisely this,
and its docstring names `lib/idfc-import` as the motivating case. It was not missing.
It was **miscounting**, in two compounding ways:

1. **Type-only imports were counted as callers.** `MAU_IMPORT` pattern ① matches the `from`
   clause, so `import type { ProvenanceFlag } from '../idfc-import/from-photo'` scored as a
   real call. All three of `idfc-import`'s "callers" were that one type alias. It was
   therefore classified CHỈ NỘI BỘ instead of KHO CHƯA MỞ.
2. **The frontier cross-check only fired on one bucket** —
   `ds.every(t => status(t) === CHUA_MO)` — so anything mislabelled CHỈ NỘI BỘ escaped,
   even though that bucket is equally unreachable by users.

Result: the cross-check printed **`⚡ 0 frontier chưa cắm điện`** while four entries were
overcounted. A guard reporting zero looks identical to a guard finding nothing wrong.

### Fixes applied to `soi-cam-dien.mjs`
- Type-only imports counted in a separate `kieu` bucket, never as callers. Conservative by
  design: only unambiguous `import type` / `export type` statement heads are excluded;
  mixed `import { type A, b }` still counts as runtime, because a false "dead" claim is far
  more expensive than a missed type-only.
- **Transitive user reachability** (`TOI_DUOC`) by fixpoint: seeds are modules with a real
  UI caller, then propagated along module→module edges. Direct `ui > 0` was wrong in both
  directions — a module used only by a reachable module IS reachable; a module used only by
  an unreachable one is NOT.
- Cross-check now asks the question that matters — *is this evidence on a path to a user* —
  instead of matching a bucket label.
- New **mixed-evidence** warning for entries whose evidence straddles reachable and
  unreachable modules. Not auto-red: a loose grep can legitimately hit a live module.
- Exit code 1 **only** on declared frontier contract violations. Dead helpers and orphan
  files stay informational — a guard that reds on things nobody will fix gets ignored.
- Output now prints the completion ladder and states plainly that it can only judge 3 of 5
  levels.

## A · Completion ladder, now machine-enforced
| Level | Who judges | Current |
|---|---|---|
| ① engine exists | `soi:cam-dien` | 101 lib modules |
| ② runtime wired | `soi:cam-dien` (type-only excluded) | 99 |
| ③ user reachable (transitive) | `soi:cam-dien` | 99 |
| ④ verified in the real app | **no machine** — must open the app | not machine-decidable |
| ⑤ approved by eye | **no machine** — separate design record | not machine-decidable |

③ is necessary, not sufficient: a wire is not a button. The tool says so on every run
rather than leaving the reader to infer it.

New registry status **`'engine'`** added: engine real, tests may be green, no path to a user.
Not `xong` (that lies about the product) and not `chua` (that erases work done).

## B · `idfc-import` reclassified — mechanically
Four entries were flipped `xong` → `engine`, driven by the machine's own flagged list, not
by hand: `chuan-net-3d`, `wireframe-dinh-bien-dien`, `part-lock-cau-kien`,
`mirror-doi-xung-chuan-net`.

Board before: **76 xong**. After: **72 xong + 4 engine**. Both guards now agree, 0 conflicts.

`lib/idfc-import` measured state: **3,346 lines · ui=0 · lib=0 · phụ=0 · type-only=3 ·
4 self-tests · CHƯA-TỚI.** Kept, not deleted. Its canonical product entry is undetermined
by code alone — nothing imports it, so the code cannot say where it was meant to attach.
That is a product-ownership decision, not a measurement.

A fifth entry, `import-ghe-tu-hinh`, is flagged **mixed-evidence** rather than reclassified:
its pattern `importFromPhoto|ghe-tu-hinh|imageTo3d` also matches a task-name constant in
`lib/ai/models.ts`, a reachable module. The evidence pattern is too loose to conclude either
way. Left for a human to tighten — the machine does not guess intent.

## D · `lib/vision` — what the two callers actually cover
Both UI call sites are the same file, `components/render-studio/ToolModeForm.tsx`:
- `:31` → `lib/vision/to-cad`: `buildFurnitureFromMeasurement`, `orthoViewsToEntities`, `measurementToTarget`
- `:32` → `lib/vision/match-template`: `matchTemplate`, `readTemplateQueue`, `writeTemplateQueue`, `mergeTemplateRequests`

So the covered surface is measurement→CAD conversion and template matching, from one tool form.

`single-view-metrology.ts` — the largest file in the subsystem — reaches the UI only
indirectly: `lib/capabilities/image-to-3d.ts:74` imports `measureObjectTiered` at runtime,
and that file is not in the orphan list, so it has a user caller. Every other reference to
it (`lib/render-studio/measurement-spec-sheet.ts:14`, two capability test files) is
`import type` and disappears at compile.

Low exposure confirmed as a fact, not as a defect. Vision is infrastructure; no screen is implied.

## E · Standards → Review reachability, measured per stage
The LOC comparison in §5 was a weak inference and is withdrawn. The chain is connected:
9 rule modules → `standards/registry.ts` → `lib/review/luat/*` → `<ReviewPanel stage={active}/>`
rendered at `components/studio/AppShell.tsx:199`, with `CHANG_OF_STAGE` mapping
`cad→2d`, `render→3d`, `present→deck`.

Coverage is **not** uniform across stages:

| Stage | Entry | Rules reachable |
|---|---|---|
| 2D | `luat/cad.ts` — `getRulesEffectiveOn` + `checkStandards` | **full rulebook**, all 9 modules |
| 3D | `luat/rules-3d.ts` — imports `VN_LIGHTING` only | **3 of ~73 rules** |
| Present | `luat/deck.ts` — imports no standards module | **0** |

Rule inventory: vn-accessibility 15 · intl-occupant-load 16 · intl-egress 9 · vn-fire 8 ·
neufert 8 · vn-residential 7 · iso-drafting 5 · vn-lighting 3 · vn-electrical 2 (≈73).

So the accurate statement is not "the rulebook exceeds the harness" — it is that **the 2D
stage consumes the whole rulebook while 3D consumes lighting only and Present consumes none.**
Whether that is correct is a product decision; ISO drafting rules plausibly do not belong in
a deck. It is recorded as measured, not as a defect.

## Additional measured facts
- **`lib/slide-templates.ts` (229 lines) is unreached** — ui=0, lib=0, no tests. Second
  unreached module alongside `idfc-import`.
- **21 orphan files** inside otherwise-reachable modules, including
  `lib/site/dia-ly.ts` (160, geography), `lib/site/chinh-sach.ts` (104),
  `lib/ai/web-lookup.ts` (356), `lib/voice/sang-ghi-chu.ts` (61).
- **Integrations already carry a self-declared honesty tier**
  (`tier: 1 = built · 2 = gated frame · 3 = stub`):
  tier 1 — google, ms365, zoom, team, lark · tier 2 — zalo, spotify, youtube ·
  tier 3 — applemusic. The nine `providers/*.ts` adapter files have **zero importers**;
  `registry.ts` is the source of truth and does not import them.

---

# CLASSIFICATIONS — closing the audit as a guardrail

## §2 · Evidence scoping is now machine-checked
20 entries marked `xong` prove themselves with a repo-wide pattern (`dir: 'lib'`,
`dir: 'components'`, `dir: 'app'`). That is the false-green class `import-ghe-tu-hinh`
exposed: one broad regex can match the real implementation directory AND an unrelated
constant in a live module.

`soi-cam-dien` now prints a **BẰNG CHỨNG QUÁ RỘNG** tier listing them, with the scoping
rule stated: exact runtime import path · exact exported symbol · exact registered
capability id · route/component ownership. **Warning only, not exit-failing** — 20
unfixable reds would train people to ignore the guard, which is how the original bug survived.

`import-ghe-tu-hinh` evidence tightened from
`{ dir: 'lib', mau: 'importFromPhoto|ghe-tu-hinh|imageTo3d' }` to
`{ dir: 'lib/idfc-import', mau: 'importFromPhoto' }`.
The machine then flagged it, and it was reclassified `xong` → `engine`.

**Board: 76 xong → 71 xong + 5 engine.** All guards green, tsc 0.

## §8 · `lib/slide-templates.ts` — CLASSIFIED: superseded by divergence
Not built, not deleted. Evidence:
- Its own docstring states the intent — *"CHỈ THÊM export mới — không đụng lib/slides.ts"*
  and *"Pipeline **có thể** map preset.layout sang renderer sẵn có"*. Written against an
  integration that was optional and never happened.
- `lib/slides.ts` (11.5 KB) **is** live — consumed by `lib/pptx.ts`,
  `lib/present-render.ts`, `lib/nodes/registry.ts`, `lib/present-editor/reference-layout.ts`.
- Present templates consolidated elsewhere: `lib/present-editor/templates.ts` +
  `custom-templates.ts` + `components/present-editor/LayoutShelf.tsx`.
- `SLIDE_FONTS` and `SLIDE_GRID` appear in **no other file**.

⇒ A parallel preset declaration that the shipped template system grew past.
**No second Present template stack.** Dormant, labelled.

## §9 · Integrations — mechanism verified before classifying
Checked for barrel registration, dynamic `import()`, `require()`, lazy lookup and indirect
imports before concluding anything — the direct-import mistake is not repeated here.
Result: **none exist.** `registry.ts` declares providers; it does not import the adapters.

The subsystem splits cleanly in two:

| Half | State | Evidence |
|---|---|---|
| **Connection flow** | **REAL / wired** | `registry.ts` + `oauth-core` consumed by 6 API routes: `integrations/[provider]/connect·callback·disconnect`, `auth/microsoft/callback`, `lark-tasks/sync`, `colors/lark` |
| **Provider capabilities** | **UNREACHABLE** | `listCalendarEvents`, `sendMail`, `listFiles`, `nowPlaying`, `listVideos` → **0 call sites** in `app/` or `components/` |

So a user can connect an account; nothing yet consumes the data. Per-provider tiers are
already self-declared and honest — tier 1 google · ms365 · zoom · team · lark ·
tier 2 zalo · spotify · youtube · tier 3 applemusic (stub).
The nine `providers/*.ts` are adapters written ahead of their consumer, not dead code to remove.

## Audit status: CLOSED as guardrail
Run `soi:cam-dien` and `soi:frontier` at checkpoints. Do not re-audit the engine tree
unless a new contradiction appears.
