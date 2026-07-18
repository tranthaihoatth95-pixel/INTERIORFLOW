---
name: ttt-design
description: Use this skill to generate well-branded interfaces, layouts and print assets for TTT Corporation / TTT Architects (Vietnamese luxury interior · architecture · construction firm), for production or throwaway prototypes/mocks. Contains brand colors, two brand modes, bilingual Việt–Anh grotesque type system, fonts, logos, layout grid, CAD/board standards, UI components and page/slide templates.
user-invocable: true
---

Read `readme.md` first, then explore the other files. Key facts:
- Two brand modes: `.ttt-architects` (neutral, navy leads, orange nearly absent — lets design work shine) and `.ttt-corporation` (brand-forward, confident orange). Apply the class on the outer element; it re-maps `--accent`/`--keyline`.
- Colours: TTT Orange `#F06020` + TTT Navy `#002850`, applied sparingly, on a soft warm **beige** ground (`#F1ECE3`).
- Type: ONE grotesque superfamily — **Archivo** (`--font-sans`) + **Archivo Expanded** (`--font-wide`). **No serif, no underline.** Headlines are light-weight (200–300), large, sentence case, tight tracking. Labels tracked uppercase.
- Bilingual Việt–Anh, Vietnamese first, joined by `·`. Confident, understated. No emoji.
- Minimal & spacious in the spirit of SCDA / Nikken. Hairline (1px) keylines, never chunky bars. Generous whitespace.
- Layout standards for presentation drawing boards and CAD sheets live in `guidelines/layout-board.html` and `guidelines/cad-sheet.html`.

Link `styles.css` for tokens. Reuse `components/` (Button, Badge, SectionLabel, StatBlock, ProjectCard) and start from `templates/` (cover, project spread, capability, letterhead, social post) or `slides/`.

If creating visual artifacts (slides, mocks, brochures, prototypes), copy assets out and produce static HTML files for the user to view. If working on production code, copy assets and apply the rules here. If invoked with no other guidance, ask what to build, ask a few questions, and act as an expert designer outputting HTML artifacts or production code. Use real project photography where templates show neutral image placeholders.
