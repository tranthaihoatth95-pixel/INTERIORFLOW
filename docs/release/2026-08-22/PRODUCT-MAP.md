# PRODUCT MAP — 22/08/2026 (29 page routes, 76 API routes)

Spine: PROJECT → CONTEXT/MANIFEST → WORKSPACE → TOOLS → CHECKPOINT → DECISION → OUTPUT → MEMORY → DESIGN DNA

## App-level surfaces (exist without a project)
| Route | Job | Release status |
|---|---|---|
| `/` | Home — personal studio → working studio | SHIP (Living Canvas M2; sidebar overlap open) |
| `/login` | Threshold | SHIP after pre-auth leak removal |
| `/files` | Files — project files + shared raw tier | SHIP |
| `/library` | Master Library | SHIP |
| `/library/gallery` | Gallery / Explore — Design DNA discovery | SHIP |
| `/library/ingest` | Bulk ingest | SHIP |
| `/materials` | Material shelf (a shelf of Library, not a rival truth) | SHIP |
| `/colors` | Colour step inside material selection | SHIP |
| `/tasks` | Task board | SHIP |
| `/settings` `/settings/about` `/settings/avatar` `/settings/licenses` | Account, avatar, legal | SHIP |
| `/workhub` | Assistant + web panes | SHIP |
| `/projects` | Project list | SHIP |
| `/share/[token]` | External share view | SHIP |

## Project-level surfaces
| Route | Job | Release status |
|---|---|---|
| `/projects/[id]/overview` | Project truth + Site Intelligence | SHIP — Site chain verified 5/5 |
| `/projects/[id]/cad` | 2D Technical | SHIP — server backup + IndexedDB recovery verified |
| `/projects/[id]/render` | 3D Design | SHIP — create/select/transform/boolean/array verified |
| `/projects/[id]/present` | Presentation | SHIP — 25-slide deck, recovers after IDB wipe |
| `/projects/[id]/photo` | Photo editor | SHIP |
| `/projects/[id]/notebook` | ArchiNote-style capture | SHIP |

## Dev/demo routes — NOT user-facing, must not ship as product surfaces
`/intro` `/demo/ghe-3d` `/dev-bench-3d-2` `/thu-be-mat` `/thu-trang-thai`
`/cad-editor` `/photo-editor` `/present-editor` (standalone editor entries)
→ These compile and are reachable. They are labelled DEV in KNOWN-LIMITATIONS.md
  rather than hidden, because hiding them is a routing change too risky for release day.

## Canonical truth owners (do not duplicate)
Project truth → Project · Site truth → ProjectSite · discovery → Gallery/Explore ·
preference → Design DNA · attention → Vitals (VitalsAperture, NOT VitalsPill) ·
material semantics → ProductSpec + MaterialPbr joined by `matId` ·
2D↔library link → `ProductSpec.drawingBlock ↔ BlockDef.id`
