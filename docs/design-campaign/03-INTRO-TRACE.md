# COLD OPEN / INTRO — RUNTIME TRACE (§45)
Measured on current source. MAIN's deliverable; art direction is Claude Design's.

## Runtime owner
| | |
|---|---|
| Route | `app/intro/page.tsx` — **public**, no auth |
| Component | `components/intro/IntroSequence.tsx` · **365 lines** |
| Mount | `app/intro/page.tsx:32` → `<IntroSequence />` |
| Entry condition | `HomeScreen.tsx:360` — `if (user === null && !introSeen) router.replace('/intro')` |
| Skip condition | `localStorage.if_intro_seen_v1 === '1'` → `router.replace('/login')` |
| Exit | `IntroSequence.tsx:74` — `setTimeout(() => router.push('/login'), 300)` |
| Motion stack | **framer-motion** (`motion`, `AnimatePresence`, `useReducedMotion`) |
| Assets | **none** — no mp4/webm/png/svg referenced. Already realtime, not video |
| State | `useReducer`, `Phase` 0–4, actions `advance / set / finish` |

## 🔴 THE DECIDING NUMBER
```
IntroSequence.tsx:45  SCENE_DURATIONS = [15000, 10000, 25000, 10000]
```
**= 60 seconds** before a professional can reach Login.

That single line settles the direction. It is not a taste problem: it is a one-minute gate in
front of a tool people open many times a day. §48 asks for short; §53 forbids delaying Login
usability for animation. Any redesign that keeps this pacing fails regardless of how it looks.

## What is already right — keep, do not rebuild
- **Realtime, not video.** §49 prefers realtime and the current implementation already is. No
  prerender/decode/aspect-ratio/black-frame problems to solve.
- **`useReducedMotion` already imported** — the accessibility hook exists; the mapping is what
  needs design.
- **A real state machine already exists** (`useReducer`), not scattered booleans.

## What is structurally wrong
1. **60s pacing** (above).
2. **Phase advance is `setTimeout(…, SCENE_DURATIONS[phase])`** (`:67`) — time-driven, not
   readiness- or interaction-driven. A fast machine waits exactly as long as a slow one, and the
   user cannot overtake it.
3. **Exit is a hard route push** (`:74`) — `/intro` → `/login` is a navigation, so Cold Open and
   Login are two independent screens. §46 asks for one environment waking; a `router.push` is the
   opposite of continuity by construction.
4. **`components/intro/TitleSequence.tsx` (16.7 KB) is ORPHAN** — zero imports; the only mentions
   are prose references in `ProjectSelect.tsx:105-137`. Dead weight, or an unused earlier take.

## Reachability (§45 requires proof, not a flag)
- **`/intro` IS reachable** — public route, and unauthenticated `/` actively redirects into it.
- `components/IntroSequence.tsx` (the older top-level file) is **deleted** from the working tree;
  the live one is `components/intro/IntroSequence.tsx`. Two similarly-named files existed — do not
  conclude "intro is gone" from the deleted one.
- ⚠️ **Not yet unreachable, and must not be** until a replacement exists. Marking the design
  SUPERSEDED is a design-status change; removing the render path is a separate, later step that
  needs its own proof.

## Boundary — do not conflate
`WelcomeIntro` (`components/entry/WelcomeIntro.tsx`, used by `HomeScreen.tsx:22,211`) is
**first-run onboarding inside Home**, a different thing from Cold Open. Changing one must not
silently change the other.

## Handoff
Design status → **SUPERSEDED (pending replacement)** in `CLAUDE-DESIGN-CURRENT.md`.
Art direction, storyboard, motion language, timing hierarchy, mark treatment and the
Login/Home continuity are **Claude Design's** (§47). MAIN owns the state machine, integration,
Electron behaviour, performance budget, reduced-motion implementation and visual match.
