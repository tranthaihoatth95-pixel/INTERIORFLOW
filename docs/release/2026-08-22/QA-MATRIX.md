# QA MATRIX — InteriorFlow 0.1.0, 22/08/2026

Legend: GREEN verified · YELLOW works with caveat · RED broken · EXTERNAL needs
credentials/hardware · HUMAN needs a person at the keyboard · N/A

## Build & package
| Area | Status | Evidence |
|---|---|---|
| Production web build | GREEN | `next build` exit 0, all 29 page routes compiled |
| Mac package | GREEN | `electron-builder --mac` exit 0, arm64 dmg 354,133,978 bytes |
| Package is genuine production output | GREEN | packaged `BUILD_ID` = repo `BUILD_ID` = `aY7nxzHdPS5uRDrLTkIry`; production-only manifests present (a dev server would write `development`) |
| Brand neutrality | GREEN | `appId com.interiorflow.app`; 0 TTT strings in shipping code |
| Deterministic tests | GREEN | `npm test` exit 0 (flaky ~1/5 — judge by exit code) |
| Guards frontier/hinh-hoc/tu-dien/contract/visual-source/cam-dien | GREEN | all exit 0 |
| Guard soi:thao-tac | YELLOW | 2 of 4 rules closed; `outline-can-focus-visible` (33 files) and `cam-hex-inline` (194 sites) remain — too broad for release day, not faked green |

## Packaged app runtime
| Area | Status | Evidence |
|---|---|---|
| Launches without dev server or terminal | GREEN | `open InteriorFlow.app` → server up on 127.0.0.1:3777 in ~10s |
| Startup DB migration | GREEN | push refused → `dev.db.backup-2026-08-22T11-21-23-218Z` (1,019,904 bytes, intact) → retry OK → `matId` column created |
| Data written outside app bundle | GREEN | db + uploads + IndexedDB all under `~/Library/Application Support/InteriorFlow` |
| App routes | GREEN | 11/11 return 200: `/` `/login` `/files` `/library` `/library/gallery` `/materials` `/colors` `/tasks` `/projects` `/settings` `/workhub` |
| API health | GREEN | `/api/health` 200 |
| Auth enforcement | GREEN | `/api/projects` returns 401 unauthenticated — no data leak |
| External links | GREEN | `setWindowOpenHandler` → `shell.openExternal` |
| Renderer hardening | GREEN | `contextIsolation: true`, `nodeIntegration: false` |
| Origin-dependent navigation | GREEN | all 7 `window.location` sites relative, incl. 2 via variables — safe under any origin |
| OAuth sign-in (Google/Microsoft) | EXTERNAL | callback derives from `${origin}` = 127.0.0.1:port, no matching redirect URI. Email+password works |
| Code signing / notarization | EXTERNAL | no credentials available; ships unsigned |

## Product flows

**Read the Layer column.** `dev` = verified on the development server, NOT re-verified
inside the packaged app. `pkg` = verified on the packaged build. Dev evidence is real
evidence, but it is deliberately not promoted to a packaged-build claim.

| Flow | Status | Layer | Evidence |
|---|---|---|---|
| Site Intelligence chain | GREEN | dev | 5 steps; recalculation 64.875 → 140.742; stale clears |
| Vitals attention surface | GREEN | dev | VitalsAperture live; input hygiene PASS |
| Voice typed fallback | GREEN | dev | persists via `/api/home/notes`, anchored to project |
| 2D draw / select / edit | GREEN | dev | server backup via `.idf`; recovers after full IndexedDB delete, IDs/count/points preserved |
| 3D create / transform / undo | GREEN | dev | box/wall/cylinder, move/rotate/delete/undo, boolean/array/bevel |
| Presentation deck | GREEN | dev | 25-slide deck survives IndexedDB wipe; empty-overwrite guard |
| Library → 2D drop | YELLOW | dev | real BlockEntity, correct layer, one undo — no `specId`, never reaches BOQ |
| Sidebar overlap at Home | GREEN | **pkg** | railRight 239 vs contentLeft 286 ⇒ **0px**, both themes; in-stage railW 51, canvasLeft 88, canvas not squeezed |
| App writes to userData | GREEN | **pkg** | `IndexedDB/http_127.0.0.1_3777…leveldb` holds `interiorflow-sheets`/`-backup`/`-root` + 311 entity traces |
| Login (production, pre-auth) | GREEN | **pkg** | 0 project names, 0 timestamps, 0 prior-session state |
| Unauthenticated deep routes | YELLOW | **pkg** | `/files` + 7 siblings render full shell while data 401s. First run unaffected — window always opens at `/`, which is gated |
| Project surfaces render in the package | GREEN | **pkg** | 4/4 serve 200 with the real project id: `/cad` renders a real `<canvas>` + 58 controls in server HTML; `/present` rail + 17 controls; `/overview` rail + 12 controls |
| `/projects/[id]/render` (3D) | YELLOW | **pkg** | 200 but server HTML has 0 controls and no rail — consistent with a client-only WebGL view, NOT evidence of a defect. Needs a browser to confirm either way; not claimed as green |
| Present surface | RETRACTED-RED → BLOCKED-NEEDS-HUMAN | **pkg** | earlier RED was a route mis-map (`/present-editor` is a dev bench). Real route renders normally; measuring an actual deck needs a session |
| Authed flows (open project, import/check, 3D-in-package, settings persistence) | BLOCKED-NEEDS-HUMAN | — | require a signed-in session; entering credentials is not automated by policy |
| Drawing survives quit + relaunch in the packaged app | BLOCKED-NEEDS-HUMAN | — | drivers control browsers, not Electron windows; single-instance lock. 30-second manual check documented |
| Real microphone | EXTERNAL | — | headless cannot exercise SpeechRecognition |
| OAuth sign-in in desktop build | EXTERNAL | — | callback origin 127.0.0.1:port has no matching redirect URI |
| Third-party integrations | N/A | — | not built; no fabricated provider data |

## Summary
Build & package: **GREEN 6 · YELLOW 1 · RED 0**
Packaged runtime: **GREEN 9 · EXTERNAL 2 · RED 0**
Product flows: **GREEN 10 (6 dev-only, 4 package-verified) · YELLOW 4 · BLOCKED-NEEDS-HUMAN 3 · EXTERNAL 2 · RED 0**

**No controllable RED.** The honest caveat: six product-flow greens were measured on the
development server and were deliberately not re-verified inside the packaged app,
because the flows that would prove them need a signed-in session and this session does
not enter credentials. That gap is stated rather than papered over — it is the main
thing a human should close before calling the build fully exercised.


## A note on how the reds were handled
One RED in this matrix was retracted after the flow was re-measured on the correct
route — a dev bench had been mistaken for the product surface. It is recorded as
retracted rather than deleted.

A wrong RED is worse than an honest BLOCKED: it blames something that is not broken
and it costs confidence in every other row. The counterpart rule also held today —
nothing was promoted to GREEN because it merely rendered. `/projects/[id]/render`
returns 200 and is still YELLOW, because server HTML cannot prove a WebGL view works.
