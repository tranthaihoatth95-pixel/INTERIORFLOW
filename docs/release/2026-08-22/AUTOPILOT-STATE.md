# AUTOPILOT STATE — 22/08/2026

## CURRENT P0
Electron mac package → launch → smoke test → artifacts.

## GREEN (verified)
- `next build` production build: **exit 0** (14.2.35, all routes compiled)
- Electron main process audited: contextIsolation on, nodeIntegration off,
  setWindowOpenHandler → shell.openExternal, darwin window-all-closed handled,
  spawns `next start` via ELECTRON_RUN_AS_NODE (no external node dependency),
  userData-writable DB + uploads, `prisma db push` on packaged start.
- Prisma darwin-arm64 query engine AND schema-engine present in node_modules.
- Icon 1024x1024 png present (electron-builder derives .icns).
- Site Intelligence chain (Lane B): 5 steps end-to-end, Recalculate changes real
  value 64.875 → 140.742, stale clears.
- Vitals input hygiene (Lane B): PASS — Vitals does not read raw Project table.
- Voice typed-fallback (Lane B): persists to /api/home/notes, anchored to project.
- Library → 2D drop (Lane A): creates real BlockEntity, correct layer, one undo step.
- Home layout M2 Living Canvas shipped (Lane A), DOM-measured.

## LANE FINDINGS — DO NOT REDISCOVER
- **Project table is polluted**: of 15 rows, 5 are `__nb:` placeholders and 4–5 are
  fixtures. Real user projects ≈ 0. Home counts "21/21" and "19 drafts" are TEST
  DEBRIS. Never trust raw Project counts for user-facing numbers.
- **VitalsPill.tsx is an orphan** — 0 call sites since 17/08. Live Vitals is
  `components/studio/VitalsAperture.tsx`. Do not use VitalsPill as design evidence.
- **36 `.dc.html` files in repo are repo-html, NOT Claude Design.** Claude Design
  project b7dc14ba-1752-4821-8fc7-d519f737ac09 exists but its content stops at 14/08.
  Figma: UNVERIFIED, 0 calls. Do not claim Figma provenance.
- **mtime in docs/mocks is meaningless** (21/36 files share 16/08 mtime from a bulk
  token rename). Never pick a canonical design by mtime.
- **`ls mock-*.html` misses 15 files.** Always `ls *.html`.
- **LibraryDropBridge drops without specId** ⇒ item never reaches BOQ. Real link is
  `ProductSpec.drawingBlock ↔ BlockDef.id`, NOT code↔sku.
- **soi-frontier matches raw text** — a comment naming an entry makes it look
  implemented. Do not strip comments globally to "fix the family": it kills the
  `[marker: …]` convention and false-reds 6 entries.
- **`npm test` is flaky ~1 in 5** with no failing item in the tail. Judge by EXIT
  CODE, never by grepping "FAIL". Root cause unknown.
- Dev server on :3000 has died mid-session before — verify it is alive before
  trusting any browser measurement. Test login: demo@if.local / demo1234.

## OPEN
- Sidebar overlap at Home (RailDieuHuong.tsx:99) — Lane A, in progress.
- Login pre-auth leakage (project names + fabricated timestamps) — Lane A, in progress.
- Real microphone path untested (needs hardware acceptance — EXTERNAL).
- ProductSpec.matId migration needs manual run — EXTERNAL (Hoà).
- Climate/geography site domains have no data source — FUTURE, must not be faked.

## EXTERNAL / NOT CONTROLLABLE TODAY
- Code signing / notarization credentials — absent ⇒ shipping UNSIGNED.
- Third-party integrations requiring user OAuth.

## ACTIVE LANES
- MAIN: release integration, Electron, gates, artifacts.
- interiorflow-f2 (Lane A / UI): sidebar overlap P0, login leakage.
- interiorflow-74 (Lane B / functional): QA-FUNCTIONAL.md matrix.
- interiorflow-47: no reply yet.

## ELECTRON STATUS
next build GREEN → electron-builder --mac running.

---
## RELEASE COMPLETE — 22/08/2026 18:25

next build exit 0 · electron-builder exit 0 · npm test exit 0 · 6 of 7 soi guards exit 0
Packaged app launches, migrates its DB safely, serves 11/11 routes, stable at 0% CPU.
DMG mounts, contains a launchable app, unmounts cleanly, checksum verified at destination.

**Blocker found and fixed:** startup `prisma db push` killed the packaged app on every
upgrade launch (matId UNIQUE). Fixed with backup-then-retry-once, verified end to end.

**Not done, stated plainly:** the full 360° audit of every surface and the visual
implementation of every canonical design were not completed — that is multi-week scope.
This session delivered the release-critical path and an honest debt record.

**Human-only remaining:** signing credentials · the 30-second packaged-app durability
check · Hoà's eye decision on the login variant · authed-flow QA requiring credentials.
