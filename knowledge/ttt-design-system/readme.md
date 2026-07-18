# TTT — Design System / Hệ thống đồ hoạ dàn trang

An editorial layout & graphics system for **TTT Corporation** and its architecture arm **TTT Architects**. Built for company profiles (hồ sơ năng lực), brochures, tender/report documents, project-presentation slides, social posts and internal paperwork — bilingual **Việt – Anh**. Reference points: the quiet, spacious minimalism of **SCDA** and **Nikken Sekkei**.

## Company context
TTT Corporation, established **1992** in Ho Chi Minh City, is one of Vietnam's leading firms in **interior, architectural design & construction**, specialising in premium hospitality and offices. Notable projects: Sofitel Legend Metropole, Fairmont Hanoi, Four Seasons, Movenpick, New World Saigon, OCB The Hallmark. TTT Architects is the design member of the group and a National Architecture Award winner. Positioning: high-craft, luxury, internationally-certified execution.

- Source: https://ttt.vn/ — *"Spreading values — creating success."*
- Two-mark brand sharing a pixel/tetromino "T" mosaic glyph: **TTT Corporation** (orange wordmark) and **TTT Architects** (navy wordmark).

## Two brand modes
The two arms share one skeleton (beige ground, grotesque type, hairline devices, generous whitespace) but differ in colour temperament. Apply a mode class on the outermost element; it re-maps `--accent` / `--keyline`:

- **`.ttt-architects` — neutral & restrained.** Navy leads, the accent de-saturates, orange is nearly absent. The palette recedes so *creative design work can shine*. Use for TTTA portfolios, project spreads, competition boards.
- **`.ttt-corporation` — brand-forward.** Orange is present and confident — the voice of a leading construction group. Use for TTTC profiles, covers, capability decks, social.

See `guidelines/brand-modes.html`.

## Visual foundations
- **Colours.** Brand marks sampled from the logos — **TTT Orange `#F06020`** and **TTT Navy `#002850`**. The shared ground is a **soft warm beige** (`--surface-page` `#F1ECE3`) with a warm greige neutral scale (`#FAF7F1 → #1E1B16`) — quiet, gallery-like, never white or clinical gray. Accent is applied *sparingly* and is mode-dependent (see above).
- **Typography — no serif, one superfamily.** The TTT type system is built entirely from **Archivo**: `--font-wide` (Archivo Expanded — wordmark, monumental heads, big numerals) and `--font-sans` (Archivo — body, decks, UI). Character comes from **width · weight · tracking**, not a second face. **Headlines are set UPPERCASE in Archivo Expanded** (weight 400, slight positive tracking ~0.01em) — architectural and global; subheads and decks stay sentence case (lighter weight) for hierarchy contrast; body is Archivo Light/Regular. Labels are tracked uppercase (`0.24em`). Both carry full Vietnamese diacritics. **Never** serif, **never** underline text.
- **Devices.** A **hairline keyline** (1px) and a **fine baseline rule** anchor sections — delicate, never chunky bars. Navy panels carry inverted light type with muted eyebrows.
- **Layout.** 12-column grid, 24px gutter, generous 56–64px page margins, ~68ch measure. Base-4 spacing. Near-square corners (0–4px). Whitespace is intentional and abundant.
- **Imagery.** Photography-led (architecture/interiors), run large and full-bleed. Placeholders here are neutral stone blocks — **drop in real project photography**.
- **Elevation & motion.** Restrained. Soft shadows only; quiet ~.18s fades; no bounce, glow, or gradient-noise.

## Layout standards (dàn trang)
- **`guidelines/layout-board.html`** — presenting a single layout drawing per frame in a presentation file: beige margin, north arrow top-right, scale bar bottom-left, a title block (drawing name · scale · sheet/rev) along the foot.
- **`guidelines/cad-sheet.html`** — CAD sheet standard: outer + inner border, bottom title block with the TTT stamp (`Project · Drawing No. · Scale/Date · Rev`), lineweight ladder (0.13 / 0.25 / 0.50) and layer naming (`A-WALL · A-FURN · A-DIMS · A-TEXT`). Drawing-number pattern: `TTT-<discipline>-<type>-<nnn>`.

## Content fundamentals
- **Bilingual, Vietnamese first.** Lead in Vietnamese, support with English — often a lighter English gloss under a Vietnamese label, joined by `·`. e.g. `Năng lực · Capacity`, `Hồ sơ năng lực · Company Profile`.
- **Tone:** confident, understated, craft-focused ("chúng tôi"). No hype, no exclamation, no emoji.
- **Casing:** tracked UPPERCASE for labels/eyebrows/meta; sentence case for titles and body. Never underline.

## Iconography
The visual language is typographic, not icon-driven — numerals (`01/02/03`), hairline keylines and tracked labels do the work. Emoji are never used. The logo mosaic glyph is the one signature mark — use the supplied PNGs, don't redraw it. If line icons are unavoidable, use a thin single-weight set (e.g. Lucide) in navy, sparingly — flag any such addition.

## Assets (`assets/`)
- `logo-corporation-stacked.png` — TTT Corporation (navy glyph + orange wordmark).
- `logo-architects.png` — TTT Architects (navy).
- `logo-corporation-square.png` — orange square glyph (avatar / stamp).

## ⚠ Substitutions to resolve
- **Fonts.** No bespoke TTT typeface exists yet, and no licensed brand font files were provided. A true *custom, Vietnamese-localized* face — the stated goal — is a **type-design commission**. Until then the system uses **Archivo / Archivo Expanded** (Google Fonts, full Vietnamese, global-neutral, variable width) as the working stand-in. Swap `@font-face` sources in `tokens/fonts.css` once a bespoke or licensed face is ready.
- **Logos.** Low-res web PNGs from ttt.vn (white background). Vector / transparent logos would sharpen every template.

## Index / manifest
- **`Brand-Guideline.html`** — the full brand guideline document (17 printable A4 pages, neutral ground): introduction, brand architecture, logo (marks, construction, clear space, colour versions, misuse), colour, typography, grid, graphic elements, drawing-board & CAD standards, voice, applications.
- **`styles.css`** — entry point. `@import`s `tokens/fonts.css`, `colors.css` (incl. brand-mode scopes), `typography.css`, `spacing.css`.
- **`tokens/`** — all CSS custom properties + webfont import.
- **`guidelines/`** — foundation cards: Colors, Type, Spacing, Brand (+ Brand modes), **Layout Rules** (drawing board, CAD sheet).
- **`components/core/`** — Button, Badge, SectionLabel.
- **`components/layout/`** — StatBlock, ProjectCard.
- **`templates/`** — print/layout pages: `cover`, `project-spread`, `capability`, `letterhead`, `social-post`.
- **`slides/`** — 16:9 slides: `title`, `project`, `stats`, `divider`.
- **`SKILL.md`** — portable Agent-Skill wrapper.
