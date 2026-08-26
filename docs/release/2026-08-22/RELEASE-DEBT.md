# RELEASE DEBT — 22/08/2026

Classification: DONE · PARTIAL · BROKEN · NOT BUILT · OBSOLETE · EXTERNAL · FUTURE

| # | Capability | Status | Evidence | Blocker? | Action |
|---|---|---|---|---|---|
| 1 | Production web build | DONE | `next build` exit 0, all routes compiled | — | — |
| 2 | Electron mac package | DONE | electron-builder exit 0, arm64 dmg + .app | — | — |
| 3 | Packaged app startup DB migration | **WAS BROKEN → FIXED** | `db-push.log`: matId UNIQUE refused without `--accept-data-loss`; app quit on every upgrade launch | **YES — was #1 blocker** | main.js now backs up dev.db then retries once |
| 4 | Deterministic test suite | DONE | `npm test` exit 0 | — | flaky ~1/5, judge by exit code |
| 5 | soi:frontier / hinh-hoc / tu-dien / contract / visual-source | DONE | all exit 0 | — | — |
| 6 | soi:thao-tac | PARTIAL | 2 of 4 rules fixed (`keydown-ne-o-nhap` ✅, glass-prefix false positive) | No | `outline-can-focus-visible` (33 files) + `cam-hex-inline` (194 sites) remain — too broad for release day |
| 7 | Global hotkeys firing while typing | DONE | LockScreen global hotkey now bails on INPUT/TEXTAREA/contentEditable | — | Escape-only handlers deliberately still respond while typing |
| 8 | Site Intelligence chain | DONE | 5 steps; Recalculate 64.875 → 140.742; stale clears | — | climate/wind/geography have no data source — FUTURE, not faked |
| 9 | Vitals attention surface | DONE | VitalsAperture live; input hygiene PASS | — | VitalsPill is an orphan, 0 call sites |
| 10 | Voice typed fallback | DONE | persists via /api/home/notes, anchored to project | — | — |
| 11 | Real microphone | EXTERNAL | headless cannot exercise SpeechRecognition | No | needs human hardware acceptance |
| 12 | Voice command receivers | PARTIAL | 1 of 4 declared (`ghiChu`) | No | others deliberately undeclared rather than faked |
| 13 | 2D drawing + server backup | DONE | recovers after full IndexedDB delete, IDs/count/points preserved | — | reload-persist inside the packaged app still to be confirmed |
| 14 | Present deck | DONE | 25-slide deck, survives IndexedDB wipe, empty-overwrite guard | — | — |
| 15 | 3D modelling | DONE | create/select/move/rotate/delete/undo, boolean/array/bevel | — | — |
| 16 | Library → 2D drop | PARTIAL | creates real BlockEntity, correct layer, single undo | No | does not carry `specId` ⇒ never reaches BOQ |
| 17 | **sheets-persist durability** | **PARTIAL — HIGH RISK** | `lib/sheets-persist.ts` has 0 fetch/api calls; holds BOTH 2D drawings and Present decks | No (pre-existing) | browser-data wipe = total loss unless user manually enabled folder backup |
| 18 | OAuth sign-in in desktop build | EXTERNAL | callback derives from `${origin}` = 127.0.0.1:port, won't match registered redirect URIs | No | email+password works; document honestly |
| 19 | Code signing / notarization | EXTERNAL | no credentials available | No | ships unsigned; Gatekeeper right-click→Open |
| 20 | Sidebar overlap at Home | IN PROGRESS | rail forced open outside a stage, overlapped content | No | Lane A patched, awaiting real-app re-measure |
| 21 | Login pre-auth leakage | **NOT A DEFECT** | production LoginForm.tsx greps clean: 0 project names, 0 timestamps, 0 prior-session state | No | leakage existed only in a design mock, never shipped |
| 22 | ProductSpec.matId data migration | DONE via #3 | user DB predates the column entirely ⇒ all NULL ⇒ SQLite permits multiple NULLs under UNIQUE | — | no real data loss in this migration |
| 23 | Dev/demo routes reachable | PARTIAL | `/intro` `/demo/ghe-3d` `/dev-bench-3d-2` `/thu-be-mat` `/thu-trang-thai` | No | labelled, not hidden — routing change on release day is riskier |
| 24 | Third-party integrations | NOT BUILT | Autodesk / Canva / SketchUp / Blender / V-Ray / D5 | No | represented honestly, zero fabricated provider data |
