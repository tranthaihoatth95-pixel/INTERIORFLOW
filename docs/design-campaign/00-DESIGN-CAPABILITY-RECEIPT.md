# DESIGN CAPABILITY RECEIPT — 22/08/2026
Inspected, not guessed. Sources: `ListSkills`, `~/.claude/skills/`, harness skill registry,
live `DesignSync` call. Anything unverified is marked so.

## CLAUDE DESIGN AUTHORITY — **ACTIVE**
Verified live this session, not assumed: `DesignSync list_files` succeeded against project
`b7dc14ba-1752-4821-8fc7-d519f737ac09` ("InteriorFlow · Design System"), `canEdit: true`.
Canonical current folder in that project: `2026-08-22-current-direction/`
(`home/`, `auth/`, `workspace/`, `gallery-explore/`, `review/`, `settings/`, `system-material/`).

⚠️ Known constraint, measured earlier: **sub-sessions do not have `DesignSync`.** Both design
lanes independently reported `ToolSearch select:DesignSync` → no match. So the working split is:
design lane authors mocks into `docs/mocks/`, MAIN pushes them to Claude Design. That is a
tooling fact, not a governance choice.

## AVAILABLE — design-relevant
| Capability | Where | Relevance |
|---|---|---|
| `DesignSync` | MAIN session only | **design authority channel** |
| `design:design-critique` | plugin | structured visual critique (5 axes) |
| `design:accessibility-review` | plugin | a11y audit |
| `design:design-system` | plugin | design-system construction |
| `design:design-handoff` | plugin | design→code handoff format |
| `design:ux-copy` | plugin | interface language |
| `design:user-research` · `design:research-synthesis` | plugin | §12 precedent research |
| `frontend-design` | `~/.claude/skills/frontend-design` (55 ln) | anti-templated visual direction |
| `dinh-huong-thiet-ke` | `~/.claude/skills/` (33 ln) | **interior-design domain** direction (project brief → concept → materials). Domain, NOT product UI |
| `webapp-testing` | `~/.claude/skills/` | real-browser QA |
| `canvas-design`, `artifact-design`, `dataviz` | Anthropic | static composition / charts |

## LOADED FOR THIS CAMPAIGN
- `frontend-design` — read in full. Core usable law: *structure must encode something true about
  the content, not decorate it*; typography carries personality; match complexity to vision.
- `dinh-huong-thiet-ke` — read in full. **Domain skill, not a UI skill.** Valuable input to
  §41–47 Design DNA (its 3-phase gather → analyse → direct maps closely onto the DNA Engine),
  but it must not be mistaken for product-interface guidance.

## NOT RELEVANT — named so nobody wastes a load
- `brand-guidelines` — applies **Anthropic's** brand colours/typography. Using it on IF would
  directly violate IF's neutrality law (no third-party brand baked into the product).
- `signage-designer`, `signage-vietsing` — physical wayfinding signage; also carries TTT/Vietsing
  brand material, which IF must stay clear of.
- `web-artifacts-builder`, `mcp-builder`, `doc-coauthoring`, `document-skills`, `learn` — wrong domain.

## MISSING — must be built (§9)
- 🔴 **IF MASTER DESIGN SKILL — DOES NOT EXIST **← 🔴 SAI TỪ 23/08: skill ĐÃ TỒN TẠI. Dòng này viết TRƯỚC khi dựng, được giải quyết trong CÙNG phiên, không ai quay lại đóng dấu — đúng bệnh mà chính repo đã ban luật để chống. Sự thật: `.claude/skills/if-design/` và `if-design-review/` đều có thật, xem `docs/control/IF-TOOLING-RECEIPT.md`.**.** `ls .claude/skills/` in the repo returns
  nothing; there is no repo-level skill directory at all. Every design law currently lives in
  prose docs that a new session must be told to read. §9 requires a durable skill that survives
  a fresh session. **This is the single largest capability gap in the campaign.**
- 🔴 **No production-ready Design System in the §17–23 sense.** What exists is thin prose:
  `SPEC-DESIGN-SYSTEM-IF.md` 114 lines · `IF-MOTION-VISUAL-LAW.md` 163 · 
  `CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` 55. There are no exact token tables for type scale,
  spacing scale, colour roles, component dimensions, or icon metrics — the things §18–22 demand
  before any implementation.
- 🔴 **No icon grammar.** Measured earlier: the 2D toolbar is 11/11 lucide; "professional
  drawing symbols as icons" exists only as drawing geometry (`lib/cad/commands.ts`), never as
  interface iconography.
- 🟡 **No Failure Ledger artifact** (§10). The failures exist, scattered across `00-CHOT.md`
  and session notes; none is in the compact FAILURE→ROOT CAUSE→CORRECTED LAW→REGRESSION form.

## HONEST NOTE ON PRIOR SESSIONS
Earlier work in this campaign was reviewed with `design:design-critique` and
`design:accessibility-review` by a design lane, and those found 4 real defects. I have **not**
personally re-run them this session. Where a document says a skill was used, it refers to that
lane's run, not mine.

---

## A2 · IS THERE AN "IMAGE → DESIGN LANGUAGE" PIPELINE? — **Two different things, do not conflate**

**EXISTS — but for the PRODUCT, not for IF's own interface:**
`lib/dna/distiller.ts` + `lib/distill/engine.ts` + `lib/gu/*` take **interior reference photos**
(assetId, caption, `style:*` tags, form poles) and distil **project Design DNA** — spatial
language, material character, proportion. That is an IF *product feature* (§41–47) and it works.

🔴 **DOES NOT EXIST — reference image → IF's own UI design language.** Nothing takes an interface
reference and produces IF interface tokens (density, hierarchy, icon optical size, stroke, radius,
panel depth, elevation, focus, hover, motion, docking, disclosure).

**These must never be merged.** One reasons about *rooms*, the other about *interfaces*. Wiring
UI-token extraction into the interior DNA engine would create exactly the second-truth error the
architecture forbids. Whatever serves A2 is a separate, additive path.

**Current honest state of A2:** capability is *"look at an image and describe it"* — a model
reading a picture. Under §2 of the directive that is **NOT a pipeline** and is recorded as such.

## A4 · CANONICAL DESIGN SYSTEM OWNER
No new markdown was created. Canonical owners, reused:
| Layer | Owner | State |
|---|---|---|
| Design law + governance + process | `.claude/skills/if-design/SKILL.md` | **NEW** — durable, session-surviving |
| Current design target locator | `docs/mocks/CLAUDE-DESIGN-CURRENT.md` | existing, corrected this session |
| Visual/material/motion prose | `SPEC-DESIGN-SYSTEM-IF.md` · `IF-MOTION-VISUAL-LAW.md` · `CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` | existing, thin |
| Failure learning | `docs/design-campaign/02-FAILURE-LEDGER.md` | **NEW** — 11 entries |
| Exact tokens (type/colour/dimension/icon) | — | 🔴 **DESIGN MISSING**, owed by Claude Design |

## A7 · GUARDS — what stops the return of "every screen its own way"
Reused, not rebuilt:
- `soi:visual-source` — design-source contract: canonical target exists · artifact exists ·
  production mapping real · provenance honest · superseded not still canonical.
- `soi:cam-dien` — reachability ladder + frontier contract (exits 1 on violation; proven to fire).
- `soi:tu-dien` — terminology drift.
- `soi:hinh-hoc` — radius/geometry scale.
- `.claude/skills/if-design` — loads the law into any new session automatically.

🔴 Not yet guarded: **icon-source mixing** (measured 13/13 surfaces) and **type-scale drift**
(4 → 11 sizes on one screen). Both need the token tables that do not exist yet — a guard cannot
check conformance to a scale nobody has written.
