# DESIGN DNA — RUNTIME AUDIT (addendum §3–§6)
Measured on current source with `soi:cam-dien` (resolves `../` specifiers). Additive: no active
frontier was stopped, no ownership changed, nothing rebuilt.

## ✅ THE CORE §28 ASKS FOR ALREADY EXISTS AND IS WIRED

```
lib/distill  ← GENERIC CORE, provenance-first, domain-agnostic   156 lines · reachable
   ├── lib/dna              INTERIOR domain adapter   362 lines · ui=3 · LIVE
   └── lib/grounded-render  second adapter            411 lines · reachable
```

**Two independent adapters on one core is the evidence that matters** — genericity is
demonstrated, not merely claimed in a docstring.

| Piece | Path | Reality |
|---|---|---|
| Core engine | `lib/distill/engine.ts` · `types.ts` | `distill()`, `DistillFieldSpec`, `DistilledField`, `emptyField` |
| Evidence flags | `lib/distill/types.ts:15` | `TrangThaiNguon = 'measured' \| 'inferred' \| 'verified'` — **already the model §8 requires**, and deliberately reuses names from `lib/ffe/item.ts` + `lib/materials/warehouse/dto.ts` rather than coining a fourth |
| Source union | `lib/distill/types.ts` | `ProvenanceInput` = image · text · sticky · form · asset — open union, ids must be traceable |
| Interior grammar | `lib/dna/distiller.ts` | rule-based, **0 API key**, reads tags/palette/captions |
| Layers | `lib/dna/types.ts` | `DNA_LAYER_KEYS`, `DesignDnaLayers` |
| Persistence | `lib/dna/store.ts` | per-project JSON: `readDnaCards` · `upsertDnaCard` · `deleteDnaCard` |
| Live surfaces | `app/api/projects/[id]/dna/route.ts` · `components/dna/DesignDnaCardPanel.tsx` · `components/collab/CuaSoThaoLuan.tsx` | ui=3 |

⇒ **Reuse. Do not build a second engine.** §28 satisfied by what is on disk.

## 🔴 GAPS — §29 machine contract
Grep for each declared type. **Nine of nine are absent:**
`Board` · `BoardItem` · `DNAAnalysis` · `DNARevision` · `DNAAcceptance` · `PersonalPreference` ·
`ProjectDNA` · `DNATrait` · `DNAEvidence` — none exist as a type anywhere.

Consequences, stated precisely:
- **No Boards.** The only "collection" concept is Gallery tag/filter code
  (`lib/library/gallery-*.ts`), which is browsing, not curation. §12 is unbuilt.
- **Personal Preference vs Project DNA is not representable.** Today there is one per-project
  DNA card store and no personal layer, so §7's canonical separation cannot be violated *or*
  honoured yet — it simply has no home. Building the personal layer without that separation
  designed in would create exactly the silent-overwrite the law forbids.
- **No acceptance/revision record.** `upsertDnaCard` writes; nothing records *who promoted a
  trait, from what evidence, when*. §16 and §30 both depend on that record existing.

## Gallery / Explore (§33)
- **Gallery is real and substantial** — `app/library/gallery/page.tsx` → `GalleryNavigator` +
  `GalleryLienNganh`, rendering **1,634 real assets** from `/api/library`. Do not rebuild it.
- **Explore does not exist** — there is no `/explore` route. Genuinely missing, design-first.

## Boundary held (§4)
Design DNA reasons about rooms, materials, light, form. It **must not** become the authority for
IF typography/spacing/icon/motion tokens — those belong to Claude Design + the Master Design
Skill + the canonical Design System. A UI-reference analyser, if built, is **design-time research
evidence only**, never a generator of production tokens. No second design authority.

## Measurement note — I fell into a trap I had already documented
My first scan reported `lib/distill: runtime = 0` and I nearly recorded the core as a dead
island. Wrong: the real specifier is `'../distill/engine'`, with no `lib/` in it, so a
path-substring regex misses it. This is **exactly failure F-03**, which I wrote into the ledger
earlier the same session. By the ledger's own rule — *same class twice = process failure* —
the corrected law is not "be careful" but: **reachability questions go through `soi:cam-dien`,
never through an ad-hoc grep.** Logged as F-12.

## C1 · INTERIOR GRAMMAR — PARTIAL, measured exactly
`DNA_LAYER_KEYS` declares **8 layers**. Only **4 have extractors** in `lib/dna/distiller.ts`:

| Layer | Label | Extractor |
|---|---|---|
| `yDo` | Design intent | ✅ `:113` |
| `anhNguon` | Sourced images | ✅ `:80` |
| `ngonNguKhongGian` | Spatial language | ✅ `:88` |
| `vatLieuMatId` | Materials (matId) | ✅ `:103` |
| `mauTyLe` | Colour & proportion | ❌ declared, no extractor |
| `anhSang` | Lighting | ❌ declared, no extractor |
| `khungHinh` | Framing / composition | ❌ declared, no extractor |
| `rangBuocDoTin` | Confidence constraints | ❌ declared, no extractor |

Absent from the grammar entirely (not even declared) vs the addendum §9 list: contrast · texture /
tactility · form language · curvature · craft / detailing · joinery · metal & stone language ·
pattern · rhythm · symmetry · decorative density · era / influence · atmosphere · visual noise ·
architectural order · furniture language · shadow character.

⛔ **Not adding them now, deliberately.** Writing 30 traits before knowing what the product must
express would be building an answer to an unasked question. The product contract comes from
Claude Design first; the adapter follows it.

## 🚫 C3 · UI/UX GRAMMAR INSIDE THE DNA ENGINE — REJECTED, will not be built
An earlier recommendation of mine proposed extending the distill engine with a UI/UX grammar
"to unblock the token tables". **That contradicted the boundary stated in this very document**,
and it is rejected.

Deriving IF spacing / typography / icon metrics / motion / UI material from a DNA engine would
create **a second design authority living in code**. Token tables are owed by Claude Design.
A UI-reference analyser may exist only as design-time research evidence, never as a generator of
production tokens.

> **Locked principle.** Claude Design decides what Design DNA must *express* for a human.
> The DNA engine supplies the *evidence* to express it. The engine does not decide the interface,
> and the interface does not fabricate intelligence the engine does not have.

## Smallest next step that is not a rebuild
Extend the existing core rather than parallel it:
1. `Board` / `BoardItem` identity on top of existing `LibraryAsset` image identity (one identity,
   many relationships — §13), not a new image store.
2. Split the DNA layer into `PersonalPreference` and `ProjectDNA` with explicit promotion
   (`DNAAcceptance`: who, from which evidence, when) — §7 + §30.
3. `DNAAnalysis` as a record over existing `distill()` output, carrying trait → supporting
   evidence so §14's "inspect the evidence" is answerable.
Everything else (Create, Inline Review, Accept → Stage) depends on these three.
