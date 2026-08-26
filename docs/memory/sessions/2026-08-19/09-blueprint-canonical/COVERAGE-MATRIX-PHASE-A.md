# COVERAGE MATRIX — PHASE A đầy đủ (19/08, trước khi sinh Blueprint)

> Bản lưu full của matrix Phase A (trước nằm trong transcript phiên phụ — cứu ra file theo
> ANTI-LOSS contract). Bản nén thi hành: Blueprint B22. Gate: **MISSING = 0 → PASS**.

## A5 · GATE (hai mốc)
```
Phase A (trước chốt):  TOTAL 52 · COVERED 27 · PARTIAL 18 · MISSING 0 · CONFLICT 1 · SUPERSEDED 5 · AMBIGUOUS 1
Sau Hoà chốt C1-C4:    COVERED 30 · PARTIAL 15 · CONFLICT 0 · SUPERSEDED 6 · AMBIGUOUS 1 (NODE)
```

## Khối COVERED (27 nhóm lúc Phase A — 1 dòng/nhóm)

| N | Concept | Nguồn chính | Status | § |
|---|---|---|---|---|
| 3 | Project Manifest = MAP/INDEX, không giant SoT | ADR-Q1; file `PROJECT-MANIFEST.md` chưa tồn tại (ls xác nhận) | [CHỐT][GAP] | B5·B8 |
| 10 | 2D Kỹ thuật ≠ CAD label; CAD editor = một tool | chốt 07/08 bỏ CAD (14 chỗ) · direction #2 | [CHỐT] nhãn; tool≠chặng [DD] | B7 |
| 11 | 3D = Design Development environment rộng | direction #4 · CuaSoThaoLuan 17/08 · DistillEngine 2 caller | [DD][ĐANG CÓ một phần] | B6·B7 |
| 12 | Pro ≠ primitive; persistence key GIỮ | chốt 03/08 sketch/pro/revit · concept/render/present | [CHỐT] key | B3·B7 |
| 14 | Brainstorm→Distill→Project DNA | direction #6 · DistillEngine 2 production caller | [ĐANG CÓ] | B13 |
| 15 | DNA ≠ prompt; versioned/provenance | ADR-Q9 (Option B DnaCard, Wave 4 SAU Q8) | [CHỐT][CHƯA CẮM] | B13 |
| 17 | Learning loop; outcome > raw gen | direction #22 · 5 signal sống rời | [DD][CHƯA CẮM] | B13 |
| 20 | Version/Checkpoint/Revision/Decision/Issued/Frozen | Q6+Q8; code mới có FlowVersion | [CHỐT] vocab; 3/6 khái niệm 0 code [GAP] | B3·B11 |
| 22 | WIP→Checkpoint→Frozen→Review; 2 kênh 1 truth | Review Gate 11/08 · Q6 | [CHỐT][GAP] | B16 |
| 23 | File ≠ State ≠ Decision history | OS Creative Timeline · #18 | [CHỐT vision][GAP] | B11 |
| 24 | FILES→UNDERSTAND→…→LIBRARY | Q5 · Files hai TẦNG 17/08 | [CHỐT][GAP] (code: Files=LibraryAsset ngay) | B12 |
| 25 | IDF/IDFC/IDFP tách vai + version/migration | Gate A3 verified; +`.ifpack`, `.idfnotes` MA | [ĐANG CÓ]; validate nông = điểm mềm | B12 |
| 26 | matId=UUID; 1 identity nhiều representation | chốt 19/08 SUPERSEDES 07/08 · W0.2 xong-máy · drift DB = 1 cột chờ push | [CHỐT][MIGRATING] | B10·B8 |
| 28 | Representation principle, shared ≠ owned | Q6 · map §2.5 · #23 | [CHỐT] | B10 |
| 31 | Visual Pipeline chung, render không con 3D | #11 · blocker ④ 2,5 gateway · Wave 2 facade | [DD][GAP có địa chỉ] | B15 |
| 32 | FAST↔ACCURATE continuum | #13 · AiTier/fidelity · Grounded↔3D 13/08 | [ĐANG CÓ một phần] | B15 |
| 35 | ArchiNote qua shared contracts; Lark không giữa | #20 [CHỐT 19/08] · Gate D 0 BLOCKED · ExternalRef.system | [CHỐT][ĐANG CÓ] boundary; ArchiNote 0 code | B16·B18 |
| 36 | AI Layers L0-L5 evidence-based | Gate C: L0-L3 có, L4/L5 KHÔNG đúng thiết kế | [ĐANG CÓ] | B14 |
| 37 | Adaptive ML không thành authority | Q9 guardrails · Perceptron tất định | [CHỐT nguyên tắc][CHƯA CẮM] | B13·B14 |
| 39 | Human control points | OS 4 mức per-giai-đoạn · Why-this · luật 6/8 | [CHỐT] | B14 |
| 40 | AI mutation boundary | luật 8 · Gate C 0 RED · 2 đường persist không cờ | [CHỐT][ĐANG CÓ] | B14 |
| 41 | AI Gateway ≠ Intelligence Policy | cost-gate/whitelist CÓ · privacy 0 code · M-01 collision | [CHỐT phân biệt][GAP policy] | B14 |
| 42 | Deterministic core không giao AI | Gate C L0 dày · chốt 15/08 kiểm-chuẩn=MÁY | [CHỐT][ĐANG CÓ] | B14 |
| 43 | Domain Authority, không "Prisma là SoT" | Q1 · Audit Q0 §3-4 | [CHỐT]; bảng = B8 | B8 |
| 44 | Persistence map + tag; Wave 0 status THỰC | registry ĐỢT 12 · A-4 MIGRATING · machine ≠ browser-verified | [ĐANG CÓ][MIGRATING] | B17 |
| 45 | Optional adapters; tool OK, data ownership KHÔNG | chốt 19/08 · ArchiNote §8.4 · ATLAS UNKNOWN · GPL treo | [CHỐT] | B18 |
| 46 | Update locality B-1/B-2 | FINAL-AUDIT §24 · 12-future-changes 2🔴 · soi-ranh-gioi chưa build | [CHỐT audit-accept][COUPLING GAP định lượng] | B19 |

## Khối PARTIAL (18 nhóm lúc Phase A)

| N | Concept | Hiện trạng đo | Thiếu / vì sao PARTIAL |
|---|---|---|---|
| 1 | Lifecycle nghề mở ≠ product workspace | 3 chặng là khung nhìn không chặn (X1-X4); Gate B không stage-gate | 0 model lifecycle (Phase/Research/Tender/Site/Handover 0 code) → vẽ [DD] + extension point |
| 2 | Project identity tách id/code/name/external, portable | cuid ✅ · larkProjectCode còn bảng lõi 13 file · `.idf` không projectId · ExternalRef 0 bản ghi cờ stale | Client/Stakeholders 0 model · Location 0 trường · Requirements/Constraints/Deliverables 0 model |
| 4 | Project Context = composed read model | không composer nào; mở project = route + store hydrate | toàn [DD]; nhiều field nguồn chưa có domain (Q6/Q8) |
| 5 | Client identity ≠ DNA ≠ context | 0 Client model (21 model kiểm) | identity/contact = [GAP] không ADR nhận |
| 6 | Workspace ≠ 5 thứ kia; giữ context | bốn-bề-mặt chốt; code = danh mục màn + TaskContext.workspaceId | 2 nghĩa chưa hoà → C3 (SAU: Hoà chốt (a) hai-là-một) |
| 7 | Restore semantic-first; DOMAIN/WORKSPACE/UI state | lastStage + panel layout | semantic-first [DD] phụ thuộc Q6/Q8 |
| 8 | Multi-project isolation | mọi domain scope theo projectId | workspace-state đa dự án song song [UNKNOWN] không chặn |
| 13 | Canvas shared surface, nhiều canvas | Flow.graphJson mất-DB-mất-trắng (A-5) · node ghi ngược store 2D (B-1) | số lượng → C4 (SAU: Hoà chốt Project→Workspaces→Canvases + Project Flow/Timeline) |
| 16 | Memory/Knowledge ≠ DNA, 13 loại node | Notebook RAG gần nhất — kho RỖNG; embeddings không cờ origin | semantic memory 0 code 0 ADR → [DD] |
| 18 | Revision genealogy DAG | Q6 model phẳng không parent; Decision có parentDecisionId | DAG cấp revision chưa chốt → branch [DD] |
| 19 | Non-destructive regenerate downstream | OS return-to-step · BuildRecipe · FlowVersion | regenerate-downstream 0 code — prompt cho phép [DD] |
| 21 | Present = Communication+Review+Issue | 6 loại hồ sơ có spec · video chặng 2 (13/08 đè 02/08) · technical export 2D [ĐANG CÓ] | Review Gate chưa build · Issue 0 model · Interactive/4D [DD] |
| 29 | Pattern shared capability | entry xuong-hoa-van-parametric; hatch nhốt lib/cad | 0 code → [DD][GAP] |
| 30 | Camera canonical → sequence | IF_CAMPATH + camera intent 10/08 · 3 CamPath component có | chưa wire editor 2D · camera identity xuyên chặng 0 model |
| 33 | Movie first-class | video 2 tầng → 13/08 · Gate C Video PARTIAL | timeline model = [GAP] có tên |
| 34 | 4D Expected ↔ Field | ArchiNote vision §8.1 | ArchiNote 0 code — chỉ chừa boundary [DD] |
| 38 | AI context contract compose theo task | docContext + ThinkDial [ĐANG CÓ] · RAG gửi project lên NVIDIA không policy | công thức compose [DD]; nửa nguyên liệu chưa tồn tại |
| 47 | Management ↔ Design ↔ Development | OS §4e; Community 0 code | extension boundary [DD], không build |

## CONFLICT / AMBIGUOUS
- **N27** variant vs override (M-03) → **RESOLVED 19/08**: overrides thắng variant (C2).
- **N9 NODE** unit-of-work: AMBIGUOUS/[UNKNOWN] — code "node" = node đồ thị; unit-of-work chưa ai
  định nghĩa; CẤM mượn chữ Node tới khi chốt. (Vẫn treo sau chốt.)

## SUPERSEDED (6 sau chốt)
1. matId=sku (07/08) 2. Lark hạ tầng lõi (03/08) 3. video dựng chặng 3 (02/08) 4. chợ đầu mối +
hai NGĂN (02/08 + 17/08 sáng) 5. auto mode-switch (BIGPICTURE 20/07) 6. một-canvas-duy-nhất
(T 16/08 — đè bởi C4).

## A3 · TERMINOLOGY (23 từ — bản đầy đủ nằm Blueprint B3; đáng nhớ)
Gateway (Format Router ↔ AI Gateway — C1) · Workspace (C3) · Canvas (C4) · Revision ≠ `rev` token ·
matId ≠ sku ≠ specId (W0.2 giải) · Node (nghĩa unit-of-work CẤM dùng chữ này) · Flow (model đồ thị;
nghĩa quy trình = "workflow") · cảnh báo Q5: đừng đặt tên cột `stage` cho raw|library · Checkpoint
(N20) ≠ control point (OS) · "chốt" của Hoà = từ quy trình build, không vào schema.

## A4 · LAYER TEST — ca khó
NODE AMBIGUOUS L2/L4 · Flow.graphJson L3 [GAP-OWNERSHIP A-5] · TaskContext = cầu L1↔L2 · `rev` thuần
cross-cutting CONFLICT/MERGE · Privacy mode cross-cutting kép [GAP] · Company DNA Pack L5 + PORTABILITY
· kho quy-trình-build (docs/memory, registry, Kho Hoà nói) LOẠI khỏi layer test có chủ đích.

## 4 DECISION CONFLICT + đáp án Hoà (19/08)
C1 Gateway → (a) giữ code, chốt từ điển · C2 → (a) overrides thắng variant · C3 → (a) hai-chốt-là-một
· C4 → LAI **bản Hoà tự sửa**: Project → nhiều Workspace → mỗi Workspace nhiều Canvas/Board + MỘT
Project Flow/Timeline xuyên suốt; Canvas=working surface · Workspace=working context ·
Project=identity+truth+genealogy; ⛔ không phải "1 canvas chính + phụ".

## CHƯA CHẮC (của Phase A, giữ nguyên)
Chưa chạy app/DB thật · session-memory 18-19/08 folders chưa đọc hết (chốt miệng có thể sống ở đó) ·
ArchiNote §8.2 "ghi thẳng Lark" đọc là tương-thích (Lark = một kênh optional) — nếu Hoà đọc khác là
câu hỏi thứ 5 · biên mềm ±2 ở N21/N31/N41 · A3 chỉ 23 từ đề bài, chưa quét máy.
