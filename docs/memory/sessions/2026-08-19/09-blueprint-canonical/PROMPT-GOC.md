# INTERIORFLOW — ARCHITECTURE RECONCILIATION → CANONICAL BLUEPRINT v1.0
# MỤC TIÊU: KHÔNG RƠI Ý · KHÔNG MỖI NGƯỜI NÓI MỘT KIỂU

## MỆNH LỆNH

Final Architecture Audit đã ĐÓNG.

KHÔNG audit lại kiến trúc.
KHÔNG phát minh architecture mới.
KHÔNG code production.
KHÔNG Prisma.
KHÔNG commit.
KHÔNG push.
KHÔNG tự mở Wave 1.

Nhiệm vụ này là RECONCILIATION:

1. Thu toàn bộ vision + decision + architecture hiện có.
2. Dựng COVERAGE MATRIX.
3. Tìm ý bị rơi / bị nén sai / trùng nghĩa / khác tên.
4. Phân tầng đúng.
5. Chỉ sau đó tạo MỘT canonical blueprint:

docs/IF-ARCHITECTURE-BLUEPRINT.md

Blueprint phải đủ để:
- Hoà
- Claude Code
- ChatGPT
- Cursor
- agent phụ
- dev tương lai

đọc và hiểu CÙNG MỘT hệ thống.

==================================================
PHASE A — SOURCE RECONCILIATION
==================================================

## A0 · ĐỌC NGUỒN

Đọc trước:

- docs/memory/LATEST.md
- docs/00-CHOT.md
- docs/CLAUDE.md
- docs/ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md
- docs/AUDIT-Q0-SOURCE-OF-TRUTH-LIBRARY-IDFC-2026-08-19.md
- docs/INTERIORFLOW-ARCHITECTURE-MAP.md
- docs/IF-KIEN-TRUC-OS.md nếu có
- TRIET-LY-IF nếu có
- Final Architecture Audit 19/08
- Architecture Reconciliation Audit nếu có
- Material Slice 1A reports
- Wave 0 reports
- frontier-registry.mjs
- tài liệu ArchiNote vision hiện hành
- các session/memory ngày 18-19/08 liên quan vision/architecture

Khi cần xác nhận hiện trạng:
ĐỌC CODE THẬT.

Không suy từ tên file.

Priority:

1. CHỐT mới hơn
2. Accepted ADR
3. code/data evidence cho CURRENT STATE
4. docs có ngày
5. design direction
6. historical/superseded docs

Nếu conflict:
KHÔNG tự hoà giải.
Ghi DECISION CONFLICT.

---

# A1 · COVERAGE MATRIX — BẮT BUỘC TRƯỚC BLUEPRINT

TRƯỚC KHI viết Blueprint, dựng matrix nội bộ:

| ID | Ý / Concept | Nguồn | Status | Blueprint Section | Coverage | Conflict? |

Coverage chỉ được:

COVERED
PARTIAL
MISSING
DUPLICATE
CONFLICT
SUPERSEDED

Bắt buộc truy đủ các nhóm dưới đây.

Nếu bất kỳ TRỤ LỚN nào = MISSING:
DỪNG.
Không viết Blueprint.
Báo Hoà.

Nếu chỉ còn UNKNOWN implementation detail:
được viết Blueprint và đánh [UNKNOWN]/[GAP].

==================================================
A2 · CHECKLIST CHỐNG RƠI
==================================================

## NHÓM 1 — PRODUCT / INDUSTRY LIFECYCLE

Phải phân biệt:

PRODUCT WORKSPACE
với
INDUSTRY / PROJECT LIFECYCLE.

Không được biến:

2D → 3D → Trình bày

thành lifecycle bắt buộc.

Map được workflow nghề mở, ví dụ:

INPUT
→ RESEARCH
→ BRIEF
→ BRAINSTORM
→ CONCEPT
→ DESIGN DEVELOPMENT
→ REVIEW
→ REVISION
→ TECHNICAL
→ TENDER / PROCUREMENT
→ SHOPDRAWING
→ SITE
→ HANDOVER

Đây KHÔNG phải golden flow.

Project có thể bỏ qua/quay lại/branch/combine.

Future:
Survey
Procurement
Construction
Operation
ArchiNote

phải thêm được mà không phá module cũ.

---

## NHÓM 2 — PROJECT IDENTITY

PROJECT là root semantic.

Không phải Workspace.

Phải map:

Project
├─ Identity
├─ Manifest
├─ Client / Stakeholders
├─ Team / Roles
├─ Brief / Intent
├─ Scope
├─ Location / Site
├─ Requirements
├─ Constraints
├─ Deliverables
├─ Timeline / Milestones
├─ Inputs
├─ Knowledge
├─ Design DNA
├─ Decisions
├─ Revisions
├─ Checkpoints
├─ Issues
└─ Workspaces

Phân biệt:

Project.id
= immutable IF-owned identity

Project code
= business-readable identifier

Project name
= display

External IDs
= adapters

External ID không canonical.

Project identity phải portable đủ để:
IF ↔ ArchiNote
biết đang nói về cùng project.

---

## NHÓM 3 — PROJECT MANIFEST

Phải có Project Manifest.

Manifest KHÔNG phải giant Source of Truth.

Nó là MAP/INDEX của project:

- project identity
- schema/version
- canonical domain references
- portable artifacts
- active/frozen revisions
- relationships
- reconstruction information
- provenance pointers

Manifest trả lời:

"Project này gồm những canonical pieces nào và tìm chúng ở đâu?"

Không duplicate toàn bộ domain data vào Manifest.

---

## NHÓM 4 — PROJECT CONTEXT

Project Context là COMPOSED READ MODEL.

Không phải canonical SoT mới.

Phải compose:

WHO
WHAT
WHY
WHEN
KNOWLEDGE
DESIGN INTELLIGENCE

Khi mở Project ID, IF phải hiểu:

- đang làm cho ai
- project gì
- location/site nào
- mục tiêu gì
- constraints gì
- deliverables gì
- revision nào
- cái gì đã approved
- cái gì rejected
- vì sao thay đổi
- milestone/review tiếp theo
- Design DNA hiện hành
- decisions quan trọng
- issues đang mở

AI/Workspace không phải được kể lại project từ đầu mỗi lần.

---

## NHÓM 5 — CLIENT UNDERSTANDING

Phân biệt:

CLIENT IDENTITY
CLIENT DNA
PROJECT-SPECIFIC CLIENT CONTEXT

Client không chỉ là contact.

Một feedback trong một project:
KHÔNG tự động thành Client DNA toàn cục.

Learning cần evidence.

---

## NHÓM 6 — WORKSPACE ARCHITECTURE

WORKSPACE ≠ PROJECT
WORKSPACE ≠ MODULE
WORKSPACE ≠ MASTER TOOL
WORKSPACE ≠ CANVAS
WORKSPACE ≠ STAGE

Workspace = môi trường làm việc được compose quanh một mục đích.

Ví dụ:

PROJECT
├─ Technical Workspace
├─ Design Workspace(s)
└─ Presentation / Review Workspace

Nhưng đây KHÔNG phải ba workspace bắt buộc.

Một người có thể:
- mở thẳng 2D
- mở thẳng 3D
- chỉ Present
- nhiều Canvas
- nhiều Project
- nhiều Workspace/project
- quay lại Workspace cũ
- mở Master Tool trực tiếp

Workspace giữ CONTEXT.
Không sở hữu canonical domain truth.

---

## NHÓM 7 — WORKSPACE RESTORE

Restore không được chỉ nhớ panel layout.

Thứ tự semantic:

WHO am I working for?
WHAT project?
WHICH revision?
WHAT was I doing?
WHAT is approved?
WHAT is open?
WHAT context matters?

sau đó mới:

Which tool?
Which canvas?
Which panels?

Phân biệt:

DOMAIN STATE
WORKSPACE STATE
UI STATE.

---

## NHÓM 8 — MULTI-PROJECT

Chừa architecture:

USER
├─ Project A
│  ├─ Workspace A1
│  └─ Workspace A2
├─ Project B
│  └─ Workspace B1
└─ Project C

Không lẫn:
selection
revision
context
workspace state

giữa project.

Không copy canonical data để restore Workspace.

---

## NHÓM 9 — STAGE / WORKSPACE / NODE

Phải kiểm chứng khái niệm:

PROJECT
→ STAGE
→ WORKSPACE
→ NODE
→ DECISION
→ OUTPUT
→ MEMORY

Nếu NODE chưa có definition đủ chắc:
[DESIGN DIRECTION] hoặc [UNKNOWN].

Không bịa.

Mục tiêu là có primitive đủ linh hoạt cho:
- unit of work
- branch
- checkpoint
- output
- revisit
- trace

nhưng không build framework chỉ để khớp sơ đồ.

---

## NHÓM 10 — 2D KỸ THUẬT

Tên người dùng:
2D Kỹ thuật.

Không dùng CAD làm product label.

Bao gồm:
- professional drawing
- documentation
- BIM/Revit-related capability
- annotation
- dimensions
- layout
- hatch
- technical export
- page setup

CAD-like editor:
MASTER TOOL.

Không đồng nghĩa toàn chặng.

2D plan còn có thể là spatial interface:
- camera position
- direction
- target
- FOV
- path/sequence

---

## NHÓM 11 — 3D THIẾT KẾ

Không định nghĩa là màn dựng 3D.

Đây là DESIGN DEVELOPMENT environment/workspace.

Bao gồm:

Project Context
Brainstorm
Discussion
References
Reasoning Frameworks
Canvas
Material/Spec exploration
Project Design DNA
Decision
3D Master Tool
Visual Pipeline
Checkpoint

3D Master Tool sở hữu:
geometry
scene
spatial editing
camera
placement
material assignment

Không sở hữu toàn design process.

---

## NHÓM 12 — PRO / MASTER TOOL

Không dùng "gạt Pro" làm architecture primitive.

Professional depth thuộc Master Tool/capability.

Kiểm:

SKETCH / PRO / REVIT
CONCEPT / RENDER / PRESENT

Nếu là persistence key:
GIỮ CODE KEY.

Tách:

PERSISTENCE KEY
PRODUCT LABEL
ARCHITECTURE CONCEPT

Không rename gây vỡ persist.

---

## NHÓM 13 — CANVAS

Canvas = shared creative surface.

Một Project có thể nhiều Canvas:

Concept
Material Study
Lighting
Option A/B
Detail
Revision
Final Direction
...

Canvas reference:

Material
Asset
Image
Drawing
3D View
Render
Spec
Decision
Sample
Comment

Canvas không sở hữu truth của object được đặt lên nó.

---

## NHÓM 14 — BRAINSTORM / DISTILL / PROJECT DNA

Map:

PROJECT INPUT
→ DISCUSS
→ BRAINSTORM
→ OPTIONS / ARGUMENTS
→ CHECKPOINT
→ DISTILL
→ PROJECT DESIGN DNA

Project Design DNA:
- project-specific
- structured + narrative
- versioned
- provenance
- linked decisions

Có thể chứa:

design principles
spatial intent
material direction
color
lighting
geometry language
reference anchors
things to avoid
priorities
approved decisions

Project DNA ≠ prompt AI.

---

## NHÓM 15 — DNA 4 SCOPE

Phân biệt:

Project DNA
Person DNA
Studio DNA
Client DNA

Project DNA = authority của project hiện tại.

Person/Studio/Client DNA:
context + recommendation/learning.

Không override project truth tự động.

---

## NHÓM 16 — MEMORY / KNOWLEDGE GRAPH

DNA ≠ Memory.

Phải chừa lớp semantic memory/knowledge:

Person
Project
Client
Material
Supplier
Space
Decision
Issue
Feedback
Lesson Learned
Standard
Asset
Revision
Location

Memory lưu evidence/relationship/history.

DNA là pattern/model học từ evidence đó.

Không biến DNA thành kho chứa mọi thứ.

---

## NHÓM 17 — LEARNING LOOP

Map:

GENERATED
→ HUMAN MODIFIED
→ DELTA
→ SELECTED / REJECTED
→ APPROVED
→ CLIENT APPROVED
→ BUILT / DELIVERED
→ FIELD OUTCOME
→ LEARNING SIGNAL
→ MEMORY
→ DNA

Phân biệt:

OUTPUT
= thứ hệ thống tạo

OUTCOME
= điều thực sự xảy ra ngoài đời / quyết định thật

Outcome có trọng lượng học cao hơn raw generation.

---

## NHÓM 18 — REVISION GENEALOGY

Revision không chỉ:

R01 → R02 → R03.

Phải chừa BRANCH/DAG:

R01
├→ R02-A
│   └→ R03-A
└→ R02-B
    └→ rejected

Mỗi checkpoint/revision có thể cần:

identity
parent
createdAt
createdBy
purpose
changed domains
summary
reason
feedback
linked decisions
approval
reviewers
issued/frozen

IF phải trả lời được:

- revision mới nhất?
- tại sao thay đổi?
- ai yêu cầu?
- cái gì giữ?
- cái gì bỏ?
- cái gì đã approved?
- decision nào dẫn tới thay đổi?

---

## NHÓM 19 — NON-DESTRUCTIVE WORK

Quay lại điểm cũ không được mặc định phá downstream.

Chừa khả năng:

Checkpoint
→ branch
→ modify
→ compare
→ select
→ regenerate affected downstream

Không bắt buộc implement full DAG ngay.

Nếu chưa có:
[DESIGN DIRECTION].

---

## NHÓM 20 — VERSION / CHECKPOINT / REVISION / DECISION

Khóa vocabulary:

VERSION
= technical/data evolution

CHECKPOINT
= intentional snapshot for review/compare

REVISION
= professional project state/release identity

DECISION
= reason/intent that authorizes/protects change

ISSUED REVISION
= released externally

FROZEN REVISION
= immutable revision

Không dùng thay nhau.

---

## NHÓM 21 — PRESENT

Present ≠ slide editor.

Present =
COMMUNICATION
+ REVIEW
+ ISSUE

Nhận:

2D
3D
Canvas
Render
Material
Spec
BOQ
Photo
Video
Decision

Tạo:

Drawing Set
Deck
Presentation
Movie
Interactive Review
4D
Client Package
Technical Package
Issued Revision

Technical export vẫn được phép ở nguồn 2D.

---

## NHÓM 22 — CHECKPOINT / BOSS / CLIENT REVIEW

Map:

WIP
→ CHECKPOINT
→ FROZEN REVIEW REVISION
→ REVIEW PACKAGE
→ REVIEWER
→ APPROVE / COMMENT / REJECT
→ DECISION
→ REVISION

Review có thể:

A. đăng nhập IF xem trực tiếp
B. nhận file/package + summary

Hai delivery channels.
Một checkpoint truth.

Milestone/review date thuộc Project Context.

---

## NHÓM 23 — FILE HISTORY / STATE HISTORY / DECISION HISTORY

Phải tách ba loại.

Creative Timeline tương lai:
semantic chính là Decision History,
không chỉ list file revisions.

---

## NHÓM 24 — FILES ↔ MASTER LIBRARY

Map:

RAW SOURCE
→ FILES
→ UNDERSTAND
→ NORMALIZE
→ CURATE / PROMOTE
→ MASTER LIBRARY
→ PROJECT INSTANCE

FILES:
raw/project input

MASTER LIBRARY:
understood
normalized
reusable
canonical content

Upload ≠ knowledge.

---

## NHÓM 25 — IDF / IDFC / IDFP

Tách:

IDF
= portable design/project representation hiện tại theo code

IDFC
= reusable canonical content definition

IDFP
= portable presentation state

Không nói IDF là toàn bộ IF project nếu code chưa chứng minh.

Mỗi format ghi:

scope
identity
owner
version
migration
references
embedded snapshot
reconstruction capability

---

## NHÓM 26 — MATERIAL

Canonical:

matId = IF-owned immutable UUID [CHỐT]

Phân biệt:

matId
ProductSpec.id
ProductSpec.sku
larkRecordId

Material một identity nhiều representation:

Material
├─ Semantic
├─ 2D Hatch
├─ PBR
├─ Commerce
├─ Source Binary
├─ Provenance
├─ Supplier Offer
└─ Instance Override

2D / 3D / Present / BOQ:
đọc representation phù hợp từ cùng semantic material.

Legacy migration phải ghi đúng status.

---

## NHÓM 27 — COMPONENT / IDFC

Map:

Canonical Component / IDFC
→ Project Instance
→ Variant
→ Override

VARIANT:
predefined state

OVERRIDE:
per-instance delta

Không nhập hai nghĩa.

---

## NHÓM 28 — REPRESENTATION PRINCIPLE

Một semantic object:
có thể nhiều representations.

Ví dụ Material:

Material
→ Hatch
→ PBR
→ Spec
→ BOQ
→ Present Sample

Không tạo 5 Material truths.

Shared representation ≠ shared ownership.

---

## NHÓM 29 — PATTERN / HỌA VĂN

Pattern là shared capability:

Pattern Definition
├→ 2D Hatch
├→ Tile/Floor Layout
├→ 3D Mapping
├→ Render Texture
└→ Present Sample

Không nhốt semantic vào CAD.

---

## NHÓM 30 — CAMERA

Map:

Canonical Spatial State
→ 2D Camera Placement
→ Camera Definition
→ 3D View
→ Render
→ Sequence
→ Movie
→ Present

Camera cần identity/state đủ để giữ nhất quán.

---

## NHÓM 31 — VISUAL PIPELINE

Render không là con riêng của 3D.

Map:

Canvas ─┐
3D ─────┼→ VISUAL PIPELINE
Present ┤        ↓
Movie ──┘  Image / Render / Sequence

Inputs:
scene
image
sketch
photo
render
composite
video frame

Capabilities:
preview
image-to-image
relight
control guidance
upscale
composite
high-quality render
video/frame generation

ComfyUI:
[OPTIONAL ADAPTER].

---

## NHÓM 32 — FAST ↔ ACCURATE

Không binary AI render / real render.

Map continuum:

CONCEPT PREVIEW
→ AI-ASSISTED VISUALIZATION
→ HYBRID
→ HIGH QUALITY
→ SPATIAL/MATERIAL FAITHFUL

---

## NHÓM 33 — MOVIE

Movie là first-class output/capability.

Có thể compose:

camera path
3D render
still
AI frame
video
diagram
text
audio
design state
construction state
field state

Không build movie engine trong nhiệm vụ này.

---

## NHÓM 34 — 4D / FIELD REALITY

Present extension:

EXPECTED DESIGN
↔
ACTUAL FIELD STATE

Layers:

Architecture
Structure
MEP
Ceiling
Lighting
Furniture
Material
Observation
Issue

ArchiNote cung cấp field reality.

Không gọi IF là BIM clone.

---

## NHÓM 35 — ARCHINOTE BOUNDARY

Map:

ARCHINOTE
→ SHARED DOMAIN CONTRACTS
→ IF

Shared candidates:

Project
Asset
Material
Location
Observation
Issue
Decision
Revision

ArchiNote:
Photo
Video
Voice
Measurement
Observation
Issue
Location
Field State

IF:
Design Intent
Expected State
Issued Revision
Material Identity
Decision History

Lark không bắt buộc nằm giữa.

---

## NHÓM 36 — AI LAYERS

Map:

L0 Deterministic
L1 Adaptive ML
L2 Assist
L3 Collaborate
L4 Delegate
L5 Autopilot

Current state phải dựa evidence.

Không gọi mọi automation là AI.

---

## NHÓM 37 — ADAPTIVE ML / DNA LEARNING

Phải giữ ý:

Sản phẩm dùng càng lâu
→ hiểu correction/selection/outcome
→ đề xuất càng gần DNA người/studio/client/project.

Nhưng:

ML không tự trở thành canonical authority.

Learning phải:
- evidence-backed
- scoped
- versionable
- inspectable khi cần
- không silently rewrite project truth.

---

## NHÓM 38 — AI CONTEXT CONTRACT

AI không nhận dump mù toàn project.

Context compose theo task:

GLOBAL RULES
+ PROJECT IDENTITY
+ CURRENT REVISION
+ PROJECT DESIGN DNA
+ RELEVANT DECISIONS
+ RELEVANT DOMAIN DATA
+ WORKSPACE CONTEXT
+ USER INTENT

Output giữ provenance khi phù hợp.

---

## NHÓM 39 — HUMAN CONTROL POINTS

Phải thể hiện:

INTENT
→ REASONING
→ CONTROL POINT
→ REASONING
→ CONTROL POINT
→ OUTPUT
→ HUMAN CORRECTION
→ DECISION

Mục tiêu:
con người có thể tác động tại các nút quyết định quan trọng,
không chỉ prompt đầu/output cuối.

---

## NHÓM 40 — AI MUTATION BOUNDARY

Đây là invariant quan trọng.

AI/ML KHÔNG ghi thẳng canonical domain truth.

Map:

AI / ML
→ PROPOSAL / OPERATION
→ INTELLIGENCE POLICY
→ CONTRACT
→ DETERMINISTIC VALIDATION
→ COMMAND / MUTATION LAYER
→ CANONICAL DOMAIN

Nếu current code vi phạm:
[GAP].

Không sửa code trong nhiệm vụ Blueprint.

---

## NHÓM 41 — AI GATEWAY VS INTELLIGENCE POLICY

AI Gateway:
- provider
- model
- local/cloud
- fallback
- execution

Intelligence Policy:
- được gọi không
- privacy
- scope
- AI level
- authority
- checkpoint
- mutation permission

Không nhập hai khái niệm.

---

## NHÓM 42 — DETERMINISTIC CORE

Phải map rõ những gì không giao AI làm authority:

identity
schema
geometry
numeric rules
validation
versioning
mutation contracts
conflict rules
domain invariants

AI có thể hỗ trợ suy luận.
Máy deterministic kiểm chuẩn.

---

## NHÓM 43 — SOURCE OF TRUTH / DOMAIN AUTHORITY

Không có câu:

"Prisma là SoT toàn app."

Mỗi domain phải có authority.

Tạo table:

| Domain | Identity | Canonical Authority | Writers | Readers | Runtime | Portable | Cache | External |

Bao gồm tối thiểu:

Project
Material
Component
Asset
File
2D
3D
Present
BOQ/Spec
Decision
DNA
Location
Issue/Observation

---

## NHÓM 44 — PERSISTENCE

Map:

Prisma
Disk
IDB
localStorage
IDF
IDFC
IDFP

Tag:

CANONICAL
CACHE
PORTABLE
SNAPSHOT
LEGACY
MIGRATING

Wave 0 status phải phản ánh THỰC:
machine-complete ≠ human/browser verified.

---

## NHÓM 45 — OPTIONAL ADAPTERS

Map ngoài core:

Lark/ATLAS
CSV
Excel
Supplier API
Website ingest
AI Provider
ComfyUI
Cloud Storage
future integrations

Rule:

DEPEND ON TOOL = acceptable.
DEPEND ON EXTERNAL DATA OWNERSHIP = not acceptable.

External adapter không sở hữu IF canonical identity.

---

## NHÓM 46 — UPDATE LOCALITY

Invariant:

NEW CAPABILITY MUST ENTER THROUGH A CONTRACT.

REPLACING A MODULE MUST NOT REQUIRE EDITING UNRELATED MODULES.

Map replacement impact:

3D renderer
AI provider
Lark
Visual backend
Material facet
Movie backend
ArchiNote connector

Nếu thay một module phải sửa module không liên quan:
[COUPLING GAP].

---

## NHÓM 47 — MANAGEMENT / DESIGN / DEVELOPMENT

Chừa extension boundary cho bức tranh lớn hơn tool thiết kế:

MANAGEMENT
↔ DESIGN
↔ DEVELOPMENT

Không build tính năng mới.

Chỉ xác định:
Design không phải isolated island.

Future có thể nối:
team/project management
professional learning
portfolio
career intelligence
studio knowledge
resource planning

Nếu vision source chưa đủ:
[DESIGN DIRECTION].

---

# A3 · TERMINOLOGY COLLISION AUDIT

Trước Blueprint, tìm các từ đang có >1 nghĩa:

Flow
Stage
Workspace
Project
Library
Files
Gateway
Revision
Version
Snapshot
Checkpoint
Decision
DNA
Memory
Asset
Material
Component
Scene
Canvas
Pro
Render
Present
Node

Tạo bảng:

| Term | Meaning A | Meaning B | Canonical Meaning | Code Compatibility |

Nếu rename code làm vỡ persist:
KHÔNG rename.
Ghi alias/code term.

---

# A4 · LAYER TEST

Mọi concept phải được đặt vào một trong các tầng:

L0 PRODUCT / INDUSTRY LIFECYCLE

L1 PROJECT IDENTITY / MANIFEST / CONTEXT

L2 STAGE / WORKSPACE / NODE

L3 DOMAIN / MODULE / MASTER TOOL / CAPABILITY

L4 CHECKPOINT / DECISION / REVISION / OUTPUT

L5 MEMORY / DNA / LEARNING

Cross-cutting:

CANONICAL DATA / AUTHORITY
DETERMINISTIC CORE
AI / ML
HUMAN CONTROL
PERSISTENCE / PORTABILITY
OPTIONAL ADAPTERS
VERSION / PROVENANCE
PERMISSIONS
CONFLICT / MERGE

Nếu concept không đặt được:
ghi AMBIGUOUS.
Không nhét đại.

---

# A5 · RECONCILIATION GATE

Trước khi viết Blueprint, báo nội bộ:

TOTAL CONCEPTS:
COVERED:
PARTIAL:
MISSING:
CONFLICT:
SUPERSEDED:
AMBIGUOUS:

Điều kiện:

MISSING major concept = 0

Nếu >0:
DỪNG và báo Hoà.

Không hỏi từng câu rải rác.

Nếu cần Hoà:
gom tối đa 4 DECISION CONFLICT lớn,
mỗi câu 2-4 phương án.

==================================================
PHASE B — CREATE CANONICAL BLUEPRINT
==================================================

Chỉ chạy Phase B khi Gate A đạt.

Tạo đúng:

docs/IF-ARCHITECTURE-BLUEPRINT.md

Không tạo blueprint phụ.

---

# B1 · VAI TRÒ FILE

Đầu file ghi:

IF-ARCHITECTURE-BLUEPRINT
= kiến trúc hiện hành ghép thành hệ thống như thế nào.

Không thay:

00-CHOT
= đã quyết gì

ADR
= vì sao quyết

frontier-registry
= code có theo không

LATEST
= đang thi công tới đâu

INTERIORFLOW-ARCHITECTURE-MAP
= living direction / transition map

Nếu Blueprint conflict Accepted ADR:
ADR thắng.
Báo DRIFT.

---

# B2 · STATUS LEGEND

Dùng:

[CHỐT]
[DESIGN DIRECTION]
[ĐANG CÓ]
[CHƯA CẮM]
[GAP]
[LEGACY]
[OPTIONAL ADAPTER]
[UNKNOWN]
[SUPERSEDED]
[MIGRATING]

Không nâng status không evidence.

---

# B3 · CANONICAL VOCABULARY

Tạo từ điển chính thức.

Mỗi term:

TERM
MEANING
LAYER
OWNER
NOT-TO-BE-CONFUSED-WITH
CODE ALIAS nếu có.

Đây là nguồn để mọi agent nói cùng ngôn ngữ.

---

# B4 · MASTER ARCHITECTURE SPINE

Vẽ Mermaid lớn:

PRODUCT / INDUSTRY LIFECYCLE
             │
             ▼
      PROJECT IDENTITY
             │
        PROJECT MANIFEST
             │
       PROJECT CONTEXT
             │
             ▼
    STAGE / WORKSPACE / NODE
             │
             ▼
 DOMAIN / MODULE / MASTER TOOL
             │
             ▼
      CHECKPOINT / REVIEW
             │
             ▼
     DECISION / REVISION
             │
             ▼
          OUTPUT
             │
             ▼
    OUTCOME / FIELD REALITY
             │
             ▼
      MEMORY / LEARNING
             │
             ▼
             DNA
             │
             └──── feedback/context ────→ PROJECT

Cross-cutting:
Canonical Data
Deterministic Core
AI/ML
Human Control
Persistence
Version/Provenance
Conflict/Merge
Optional Adapters

---

# B5 · PROJECT OPEN SEQUENCE

Vẽ riêng:

OPEN PROJECT ID
→ RESOLVE MANIFEST
→ COMPOSE CURRENT PROJECT CONTEXT
→ CURRENT REVISION
→ CURRENT PROJECT DNA
→ APPROVED DECISIONS
→ OPEN ISSUES
→ MILESTONES
→ RESTORE WORKSPACE(S)
→ OPEN SURFACE / MASTER TOOL

Mục đích:
IF hiểu dự án trước khi restore panel.

---

# B6 · WORKSPACE MAP

Vẽ:

PROJECT
├─ Technical Workspace(s)
├─ Design Workspace(s)
├─ Presentation/Review Workspace(s)
└─ future Workspace(s)

Mỗi Workspace:
- references Project Context
- references canonical domains
- composes capabilities
- can host/open Master Tools
- can host Canvas
- can restore context

Không sở hữu project truth.

---

# B7 · MODULE / MASTER TOOL / CAPABILITY TABLE

Bắt buộc phân biệt ba khái niệm.

Cho:

Files
Master Library
2D
Design Workspace
3D Master Tool
Canvas
Visual Pipeline
Present
BOQ
Knowledge/Memory
AI
ArchiNote Boundary

Table:

| Unit | Type | Accepts | Produces | Reads | Owns | Must NOT Own |

---

# B8 · DOMAIN AUTHORITY MAP

Từ Phase A đưa thành canonical table.

Không được có domain ownership mơ hồ mà không tag.

---

# B9 · DATA LIFECYCLE

Vẽ:

RAW
→ UNDERSTOOD
→ CANONICAL
→ DERIVED
→ PROJECT INSTANCE
→ OVERRIDE
→ CHECKPOINT
→ FROZEN / ISSUED
→ ARCHIVE

Map domain nào áp dụng đoạn nào.

---

# B10 · REPRESENTATION MAP

Material
Component
Image/Render
Drawing
Scene
Present
Decision

Phải thể hiện:
semantic object vs representation.

---

# B11 · REVISION / DECISION DAG

Vẽ branch example.

Tách:

Version
Checkpoint
Revision
Decision
Issued
Frozen

---

# B12 · FILES / LIBRARY / FORMAT MAP

Map:

FILES
MASTER LIBRARY
IDF
IDFC
IDFP
LibraryAsset
raw binary
canonical content
project instance

Không nhập các khái niệm.

---

# B13 · DESIGN INTELLIGENCE MAP

Map:

Project Context
→ Brainstorm
→ Distill
→ Project DNA
→ Workspace/Tool Outputs
→ Human Corrections
→ Decisions
→ Outcomes
→ Memory
→ Person/Studio/Client learning

---

# B14 · AI CONTROL MAP

Vẽ:

TASK
→ CONTEXT COMPOSER
→ AI/ML
→ PROPOSAL
→ HUMAN CONTROL POINT
→ POLICY
→ DETERMINISTIC VALIDATION
→ COMMAND
→ DOMAIN MUTATION

Không cho AI arrow trực tiếp vào canonical DB/domain.

Nếu code hiện có direct path:
[GAP].

---

# B15 · VISUAL / CAMERA / MOVIE MAP

Gộp đúng relationship:

2D Spatial State
→ Camera
→ 3D
→ Visual Pipeline
→ Render/Sequence
→ Movie
→ Present

Canvas/Photo/Image cũng có thể đi vào Visual Pipeline.

ComfyUI outside core.

---

# B16 · PRESENT / REVIEW / ARCHINOTE MAP

Map:

DESIGN EXPECTED STATE
→ CHECKPOINT
→ PRESENT / REVIEW
→ ISSUED REVISION
↕
ARCHINOTE FIELD REALITY
→ OBSERVATION / ISSUE
→ DECISION
→ REVISION

Chừa 4D/layer comparison.

---

# B17 · PERSISTENCE / PORTABILITY

Map từng store:

Prisma
Disk
IDB
localStorage
IDF
IDFC
IDFP

Ghi:
authority
cache
portable
legacy
migration.

---

# B18 · EXTERNAL ADAPTER RING

Vẽ vòng ngoài:

Lark/ATLAS
AI providers
ComfyUI
Supplier
CSV/Excel
Cloud
Website ingest
future connectors

Không external nào làm core truth.

---

# B19 · UPDATE LOCALITY / EXTENSION TEST

Cho từng extension:

NEW WORKSPACE
NEW MASTER TOOL
NEW MATERIAL FACET
NEW AI PROVIDER
NEW RENDER BACKEND
NEW OUTPUT TYPE
NEW MOVIE BACKEND
NEW ARCHINOTE CAPABILITY

ghi:

WHAT CONTRACT?
WHAT MODULE CHANGES?
WHAT MUST NOT CHANGE?

Mục tiêu:
update mới gọn,
không conflict unrelated old module.

---

# B20 · "KHÔNG PHẢI LÀ" TABLE

Ít nhất:

Workspace ≠ Project
Workspace ≠ Stage
Master Tool ≠ Workspace
Canvas ≠ Workspace
3D Thiết kế ≠ 3D editor
Present ≠ slide editor
Project DNA ≠ prompt
DNA ≠ Memory
Master Library ≠ Files
IDFC ≠ Project Instance
matId ≠ SKU
Revision ≠ Version
Checkpoint ≠ Revision
Decision ≠ Revision
AI Gateway ≠ Intelligence Policy
Lark ≠ database core
ComfyUI ≠ IF architecture
Pro ≠ architecture mode
Movie ≠ gimmick
ArchiNote ≠ mobile IF

---

# B21 · MACHINE-READABLE SUMMARY

Cuối file:

```yaml
architecture:
  layers:
  invariants:
  vocabulary:
  domains:
  modules:
  workspaces:
  master_tools:
  capabilities:
  formats:
  persistence:
  intelligence_layers:
  adapters:
  extension_points:
  legacy_aliases:
  migration_status:
```

Không phải runtime config.

---

# B22 · COVERAGE APPENDIX

Cuối Blueprint thêm compact coverage appendix:

- source concept
- blueprint section
- status

Mục tiêu:
sau này biết một ý đã được đưa vào đâu.

Không cần nhét toàn matrix dài nếu file quá lớn.
Nhưng phải trace được.

---

# B23 · LAST VERIFIED

BLUEPRINT VERSION: 1.0
LAST VERIFIED DATE: 2026-08-19
LAST VERIFIED COMMIT: <HEAD>
FINAL ARCHITECTURE AUDIT: 2026-08-19

---

# B24 · DRIFT RULE

Nếu code khác Blueprint:
→ DRIFT.

Nếu ADR mới khác Blueprint:
→ ADR thắng.
→ update Blueprint.

Nếu Design Direction thay đổi:
→ không tự nâng thành Decision.

Nếu terminology mới xuất hiện:
→ kiểm dictionary trước khi tạo term mới.

---

==================================================
PHASE C — VERIFY
==================================================

Sau khi tạo:

1. Validate Mermaid.
2. Grep toàn bộ canonical terms.
3. Tìm duplicate terms/meaning.
4. Đối chiếu 00-CHOT.
5. Đối chiếu ADR.
6. Đối chiếu frontier-registry.
7. Đối chiếu current architecture map.
8. Chạy soi:tu-dien.
9. Nếu soi:tu-dien không cover Blueprint:
   khai rõ, không giả pass.
10. git diff audit.

Không sửa production code để làm Blueprint "đúng".

Nếu Blueprint và code khác:
ghi DRIFT/GAP.

==================================================
OUTPUT
==================================================

Báo cáo theo đúng 6 phần:

1. TỔNG QUAN
2. CHI TIẾT
3. TỔNG KẾT BỨC TRANH
4. ĐÁNH GIÁ KHÁCH QUAN
5. ≥2 HƯỚNG DUY TRÌ
6. ĐỀ XUẤT

Bắt buộc thêm:

## COVERAGE RESULT
Total concepts:
Covered:
Partial:
Missing:
Conflict:
Ambiguous:
Superseded:

## TERMINOLOGY COLLISIONS

## DRIFT FOUND

## CHƯA CHẮC

## HẠN DÙNG

Cuối báo cáo ghi:

BLUEPRINT:
READY / BLOCKED

MAJOR MISSING CONCEPTS:
0 / <number>

ARCHITECTURE AUDIT:
CLOSED — NOT REOPENED

WAVE 1:
NOT STARTED

Sau đó DỪNG.

Không commit.
Không push.
Không tự mở Wave 1.
