# KNOWN LIMITATIONS — InteriorFlow 0.1.0, 22/08/2026

Honest list. Nothing here is hidden behind a fake success state.

## Packaging
- **UNSIGNED and NOT NOTARIZED.** No Apple Developer signing credentials were
  available to this session (`mac.identity: null`). On first launch macOS Gatekeeper
  will refuse the app: open with right-click → Open, or
  `xattr -dr com.apple.quarantine /Applications/InteriorFlow.app`.
  Signing is a credential blocker, not an engineering one.
- **arm64 only.** Built for Apple Silicon, matching the build machine. No Intel or
  universal build — chasing a second target risked the release date.
- **Large package (~360 MB dmg).** `asar: false` plus a full `node_modules` bundle.
  This is deliberate: it is what makes Prisma/SQLite and the `next start` runtime work
  reliably. Reducing it means moving to `output: 'standalone'`, which is a real
  architecture change and not release-day work.

## Runtime architecture
- The packaged app runs a local Next.js server on 127.0.0.1 (port 3777 or next free)
  and points a BrowserWindow at it. It does **not** need `npm run dev` or a terminal.
- On first packaged launch it runs `prisma db push` against a SQLite DB in userData.
  Project data and uploads live in userData, never inside the app bundle.

## Data honesty
- **The dev database contains test debris**: of 15 Project rows, ~5 are `__nb:`
  placeholders and ~4–5 are fixtures. Home-style raw project counts are therefore
  not trustworthy on a seeded database. A fresh install starts empty and is unaffected.
- `ProductSpec.matId` migration has not been run — requires a manual DB step.

## Capability status
- **Microphone / speech recognition: UNVERIFIED.** Typed voice fallback is verified
  and persists correctly. The real microphone path needs hardware acceptance on a
  human-attended machine; headless verification cannot exercise `SpeechRecognition`.
- **Voice command receivers**: only 1 of 4 declared (`ghiChu`). `soatDuyet`,
  `timKiem`, `yDinhThietKe` are deliberately not declared rather than faked.
- **Site Intelligence**: location/orientation/solar chain is live and verified.
  Climate, wind and geography domains have **no data source yet** and are not
  presented as if they do.
- **Library → 2D drop** places a real block but does not yet carry `specId`, so the
  dropped item does not reach BOQ. Link path is known
  (`ProductSpec.drawingBlock ↔ BlockDef.id`) — deliberately not rushed on release day.
- Third-party integrations (Autodesk, Canva, SketchUp, Blender, V-Ray, D5) are
  **not connected**. They are represented honestly, with no fabricated provider data.

## Dev / demo routes
`/intro` `/demo/ghe-3d` `/dev-bench-3d-2` `/thu-be-mat` `/thu-trang-thai` are
development benches that remain reachable. They are labelled here rather than hidden,
because changing routing on release day carries more risk than the confusion it avoids.

## Test suite
- `npm test` is intermittently flaky (~1 in 5 runs) with no failing item in the output.
  Root cause is not yet found. Judge by exit code, never by grepping for "FAIL".

## Working tree
- The repository has ~429 modified/untracked paths. This is **not lost work**: a prior
  session committed its output to branch `backup/2026-08-19-batch0a` (tip `fbd6521`)
  using a temporary index, so those files are both committed on that branch and present
  on disk. `git status` reports them relative to `main`, which has not been switched.
  Do not "clean" the tree. Verify with `git ls-tree fbd6521 -- <path>`.
- This release was packaged **from the working tree**, which is the state that was
  tested. Nothing was committed by the release session.

## Data durability — read this before shipping a second version

### `appId` and `productName` are now IMMUTABLE
The packaged app derives its writable location from `productName`:
`~/Library/Application Support/InteriorFlow`. Three things share that fate —
the SQLite `dev.db`, `uploads/`, and **Chromium's IndexedDB**, which is where 2D
drawings and Present decks live.

Changing `productName` or `appId` in a later release moves userData to a new path.
Users would open the app and find it **completely empty** without a single byte
being lost. No test catches this; it is not a code defect.
⇒ **`appId: com.interiorflow.app` and `productName: InteriorFlow` must never change.**

### IndexedDB durability — real, but partially mitigated
`lib/sheets-persist.ts` performs **0** network calls, and `sheets` is where both
2D drawings and Present decks live. Clearing browser data, switching Electron
profiles, or wiping userData therefore destroys them locally.

This is **mitigated but not eliminated**: `lib/cad/luu-len-may-chu.ts` and
`lib/present-editor/luu-len-may-chu.ts` (added 21/08) do back drawings and decks
up to the server via `POST /api/project-files`, and they are genuinely wired in
(`CadSheets.tsx:53,529`, `PresentSheets.tsx:73`) — not orphaned. Recovery after a
full IndexedDB delete has been verified with entity IDs, counts and points preserved.

**But the backup is gated on `bucketId`** (`CadSheets.tsx:528`:
`if (!active || !bucketId) return;`). So the accurate statement is: a drawing has a
server copy **when it belongs to a project**. A drawing that belongs to no project
has no server copy at all, and for it the IndexedDB risk above is total.

Disk-level confirmation that the packaged app really does write to userData:
`~/Library/Application Support/InteriorFlow/IndexedDB/http_127.0.0.1_3777.indexeddb.leveldb`
contains `interiorflow-sheets`, `interiorflow-backup`, `interiorflow-root` and 311
`entities|layers|viewport` traces.

Additional stores with the same exposure: `interiorflow-fonts`,
`interiorflow-backup/root` (stores only a directory *handle*, which does not
survive a profile change), and the four studio asset stores
(`colors`, `idfc-store`, `brand-kit`, `refingest`).

### One durability check still requires human hands
Automated drivers here control browsers, not Electron windows, and the app holds a
single-instance lock — so this could not be automated today:

> Open InteriorFlow.app → draw one line → quit fully (⌘Q) → reopen → is the line there?

Roughly 30 seconds. Note that a drawing made in a dev browser will **not** appear in
the packaged app — those are two different IndexedDB stores, and that is correct
behaviour, not a bug. The test is only meaningful when performed entirely inside the
packaged app.


## Unauthenticated deep routes render an empty shell
Measured on the packaged build with a clean browser profile.

Navigating **directly** to a deep route while signed out (`/files`, `/library`,
`/materials`, `/colors`, `/tasks`, `/projects`, `/settings`, `/library/gallery`)
returns 200 and renders the full application shell — rail and all — while every data
call returns 401. The result is an app that looks complete but is empty, with no
sign-in prompt.

**Correctly ranked: this is a polish defect, not a release blocker.** The packaged
window always opens at `/` (`electron/main.js:426` loads `getAppUrl()`, which is the
root), and `/` *is* gated — it hands off to `/intro` and on to sign-in. A first-run
user therefore never lands in the empty shell. The state is reachable only by
in-app navigation after a session is lost or expires mid-use.

It is worth fixing — an expired session should say so rather than presenting an empty
studio, which reads as "the app lost my work". It was not fixed today because changing
route gating after the package is built and checksummed is the riskier trade.

Note for whoever measures this next: server HTML and browser behaviour disagree here
by design. `curl` sees `/files` serve the shell markup; a browser additionally runs a
client-side gate. Both readings are correct — state which layer you measured.

## Two measurement traps that produced wrong answers today
- **Playwright's `colorScheme` does not change this app's theme.** The app owns theme
  via `localStorage['interiorflow.theme']` → `documentElement.dataset.theme`
  (`lib/store.ts:321,568`). A light/dark comparison done the naive way produced two
  byte-identical screenshots. Set the key and reload, then verify the two images
  differ by hash before trusting them.
- **The packaged app has its own database.** Project IDs from the dev database return
  "project not found" on `:3777`. Take IDs from the running packaged app; never carry
  them across.
