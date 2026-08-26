# InteriorFlow 0.1.0 — macOS desktop build
**22 August 2026 · Apple Silicon (arm64) · unsigned internal build**

## What this is
The first packaged desktop build of InteriorFlow that launches and runs on its own —
no dev server, no terminal, no `npm run dev`. Double-click and it works.

## Install
1. Open `InteriorFlow-0.1.0-arm64.dmg`, drag InteriorFlow to Applications.
2. **First launch:** the app is unsigned, so macOS will block it. Right-click the app →
   **Open** → **Open**. Or run once:
   `xattr -dr com.apple.quarantine /Applications/InteriorFlow.app`
3. It takes roughly 10 seconds on first launch — it is preparing the local database.

Your projects, uploads and database live in
`~/Library/Application Support/InteriorFlow`, never inside the app bundle. The app
bundle can be deleted and replaced without touching your data.

## The fix that made this release possible
The packaged app previously **quit silently on every launch** against an existing
database. Startup schema sync refused to add a unique constraint on
`ProductSpec.matId` without an explicit data-loss acknowledgement, and the app
treated that refusal as fatal.

It now backs up your database first (`dev.db.backup-<timestamp>`, including
`-wal`/`-journal`/`-shm`) and then retries once. If it still cannot proceed, it
refuses to open your data and tells you where the backup is — rather than writing
into a database it does not understand.

The unconditional shortcut was deliberately **not** taken: forcing the flag on every
migration would disable that safety for future schema changes that really do delete
things.

## What works in this build
- Home, Files, Library, Gallery, Materials, Colours, Tasks, Projects, Settings, WorkHub
- 2D technical drawing — draw, select, edit, server backup, recovery after a full
  local-storage wipe with entity IDs, counts and points preserved
- 3D — create, select, move, rotate, delete, undo, boolean, array, bevel
- Presentation — multi-slide decks that survive a local-storage wipe
- Site Intelligence — location and orientation facts, staleness detection,
  recalculation that produces genuinely new values, and deep-links into context
- Vitals attention surface; Voice with a typed fallback that persists notes
- Library → 2D drop places a real block on the correct layer, in one undo step

## What does not work yet — stated plainly
- **Google / Microsoft sign-in does not work in the desktop build.** The OAuth
  callback is derived from the running origin (`127.0.0.1:<port>`), which does not
  match any registered redirect URI. Email and password sign-in works.
- **Real microphone input is unverified.** Typed voice input is verified and persists.
- **Climate, wind and geography** in Site Intelligence have no data source. They are
  absent rather than filled with plausible-looking numbers.
- **Library → 2D drop does not yet carry `specId`**, so a dropped item does not reach BOQ.
- **No third-party integrations.** Autodesk, Canva, SketchUp, Blender, V-Ray and D5 are
  not connected, and nothing fabricates data on their behalf.
- Development benches remain reachable (`/intro`, `/demo/ghe-3d`, `/dev-bench-3d-2`,
  `/thu-be-mat`, `/thu-trang-thai`). They are listed rather than hidden, because
  changing routing on release day is the riskier choice.

## Please read before a second version ships
`appId` and `productName` are now **immutable**. They determine where your data lives.
Changing either would move the data path and present every user with an apparently
empty application, without a single byte being lost.

Full detail: `KNOWN-LIMITATIONS.md`, `RELEASE-DEBT.md`, `QA-MATRIX.md`, `BUILD-INFO.txt`.
