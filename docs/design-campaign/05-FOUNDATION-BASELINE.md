# FOUNDATION RED BASELINE — 23/08/2026
Captured by `npm run soi:foundation` against **untouched production**. Nothing was fixed first —
the scanner had to prove it could see the problem before anything was allowed to change.

## Scanner trust — established before trusting any number
| Check | Result |
|---|---|
| Files scanned | **988** (`.ts/.tsx/.css` in `app`/`components`/`lib`, tests excluded) |
| Candidates observed | stroke 143 · size 1 237 · viewBox 83 · motion 84 · material 988 |
| Fails on a known violation | **YES** — probe delta exactly **4/4** |
| Returns to baseline after probe removal | **YES** — 1164 → 1168 → 1164 |
| Refuses to PASS on zero candidates | yes — exit **2** = *measurement broken*, distinct from exit 1 = *real violations* |

### The scanner caught its own false PASS
First run reported `F-MAT-VOCAB` **PASS**, contradicting known evidence that G0–G3 appear zero
times. Investigated rather than accepted. The rule's `\bG[0-3]\b` branch was matching the words
*"luật G1"/"G2"* inside Vietnamese comments in `app/globals.css` — where "G1" is an unrelated
**performance** rule (do not animate opacity), nothing to do with the material ladder. The rule
now strips comments and accepts only real token forms. **Real G0–G3 token usage: 0.**
This is why a first green against a known-bad baseline must be treated as suspect.

## BASELINE — 1 164 violations
| Rule | Count | Most common observed |
|---|---:|---|
| `F-ICON-SIZE` | **870** | 13×332 · 15×186 · 12×183 · 11×83 · 10×31 · 22×21 |
| `F-ICON-STROKE` | **135** | 2×32 · 1.8×26 · 1.75×21 · 1.9×8 · 2.2×8 · 1.7×8 |
| `F-ICON-VIEWBOX` | **74** | `0 0 16 16`×42 · `0 0 200 200`×7 · `0 0 768 512`×3 |
| `F-MOTION-TOKEN` | **84** | 120ms×34 · `--dur-fast`×14 · `--dur-base`×12 · 200ms×6 |
| `F-MAT-VOCAB` | **1** | G0–G3 absent as tokens (systemic, not 1 line) |

## Classification by systemic root (§7)
**1 079 of 1 164 — 93% — are icon violations with a single root cause.**
The distribution is the proof: 13, 15, 12, 11 are not random noise, they are *consistent
alternative scales*. Many hands each chose sensibly; nothing held one scale. Root cause is the
absence of a canonical Icon primitive, not 213 careless files. **One primitive retires ~93% of
the baseline** — this is the highest-leverage migration in the campaign.

| Root | Rules | Fix layer |
|---|---|---|
| No canonical Icon primitive | SIZE · STROKE · VIEWBOX | one shared primitive normalising size/stroke/colour/state |
| Two competing motion scales | MOTION-TOKEN | converge `--dur-*` → `--nhip-*` (130/170/220/300/460, one easing `--ease-apple`) |
| Material law absent from code vocabulary | MAT-VOCAB | Claude Design confirms G0–G3 naming, then migrate |

`--dur-fast`/`--dur-base` (26 uses) are the older scale; the Foundation Sheet settles
`--nhip-bam/vien/bang/ngu-canh/bien-hinh`. The 120ms×34 cluster is a third, undeclared value.

## Rules sourced, not invented
All thresholds come verbatim from `docs/mocks/claude-foundation-system.dc.html`:
grid `0 0 24 24`; stroke `1.5` ("no exceptions"); optical sizes {14,16,18,20}; round caps/joins;
outline at rest with fill reserved for selected/on; five motion durations on one easing.

⚠️ **The Sheet defines no `F-*` rule IDs and has no §09 section.** The IDs above were created here
so CI, the ledger and exceptions can reference one stable name. If Claude Design later publishes
canonical IDs, these map across — they are not a competing numbering.

## Not yet enforced — stated rather than faked
- **Typography** — the Sheet gives contrast verdicts per role, not a machine-checkable size/
  line-height/tracking contract. The Vietnamese rules (no ALL CAPS running copy, safe
  line-height, technical-string exemption for `2400 × 750 mm`, `36.7 m²`, `Ø25`, `±0.000`)
  need the canonical scale first. Building a matcher now would enforce a scale nobody has written.
- **Spacing** — deliberately not linted. This repo is full of legitimate non-UI numbers (CAD
  coordinates, SVG paths, 3D transforms). Naive linting would drown the team in false positives.
  **PARTIAL AUTOMATION** at best, once UI-context detection is reliable.
- **Contrast** — the Sheet already measured it; encoding it needs the token table.
- **G3** — remains **NEEDS HUMAN REVIEW**. Not resolved during migration.
