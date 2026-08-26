# Bản đồ kiến trúc IF · 18/08/2026 — vai KTS trưởng

> T đọc code (Prisma schema · store.ts · lib/gateway · lib/ai · cấu trúc `lib/`, `components/`, `app/api/`) rồi mô tả kiến trúc HIỆN TẠI + đối chiếu **hiến pháp OS 18/08**. Không sửa code, không tối ưu, bỏ qua lint/naming/style.

## 1 · BẢN ĐỒ DOMAIN — Prisma schema thật

### 1.1 · 21 model chia làm 5 cụm

```
CUSER (người & tổ chức)          CDATA (dữ liệu ngành)
├── User                         ├── LibraryAsset  (file thô + palette + caption)
├── IntegrationAccount           ├── ProductSpec   (Legend: material/furniture/lighting…)
                                 ├── LarkTaskRef   (mirror pull-only)
CPROJECT (dự án)                 └── LarkPersonRef (mirror pull-only)
├── Project (currentStage,stageLocked)
├── ProjectMember (owner|crea|drafter|bim|viewer)   CWORK (việc)
├── ProjectProfile (loại hình, diện tích…)          ├── WorkflowState  (cột Kanban tự khai)
├── ProjectNotebook (RAG per-project)               ├── Task (stage,workspaceId,entityId — TaskContext Link)
├── NotebookSource                                  └── CreditTransaction
├── NotebookChunk (embedding text)
├── Flow  (graphJson node-editor)                   CBRIDGE (nối ngoài)
├── FlowVersion (snapshot mỗi Run)                  ├── ExternalRef (system+externalId → entityType/entityId, anti-loop)
├── ChatMessage                                     ├── LarkUserMap
├── GuModel (pairwise perceptron per user+kind)
└── ProjectMember
```

### 1.2 · Đối chiếu với hiến pháp OS

| Lớp OS chốt 18/08 | Model có | Model THIẾU |
|---|---|---|
| **PROJECT SYSTEM** — Project · Phase · Deadline · Task · Team · File · Review | Project ✓ · ProjectMember (Team) ✓ · Task ✓ · WorkflowState ✓ · LibraryAsset (File) ✓ · Flow (graph) ✓ | **Phase** model (đang là chuỗi cứng `currentStage`) · **Deadline** dedicated (rải rác: `dueAt` trong Task, `mocBanGiao` trong Profile) · **Review/Approval** (chỉ có `stageLocked` bool, không có bảng lịch sử duyệt) |
| **DESIGN WORKFLOW** — Research · Layout · Moodboard · Concept · 3D · Design Review · Revision · Tender · Shopdrawing · Site · Handover | **Concept** (Project.currentStage='concept') · **3D** ('render') · Layout gián tiếp (Flow) | **9 giai đoạn khác — 0 model độc lập**: Research · Moodboard · Design Review · Revision · Tender · Shopdrawing · Site · Handover · Input |
| **KNOWLEDGE SYSTEM** — Material library · Standards · Company procedures · Past projects · References · Lessons learned | Material (ProductSpec kind='material') · Standards (chỉ nằm trong `lib/cad/standards/*.ts`, KHÔNG lên DB) · Past projects (Project) · References (LibraryAsset usage='ref-render') | **Company procedures** · **Lessons learned** · **Design decisions** — 0 model |
| **COMMUNITY / DEVELOPMENT** — Portfolio · Design sharing · Critique · Trends · Skill development | Portfolio ~ Flow.shareToken (chia sẻ 1 flow) | **Critique · Trends · Skill development · Personal Growth** — 0 model |
| **AI LAYER** — Local · Cloud · Agents · RAG · Automation | ProjectNotebook + NotebookChunk (RAG per-project) | AI Gateway thực sự (chỉ có `lib/gateway/` LÀ GATEWAY ĐỊNH DẠNG FILE, tên trùng nhưng khác nghĩa) · Agent runtime · Automation rules |

### 1.3 · Nợ kiến trúc lộ ngay ở schema

1. **`Project.larkProjectCode` DEPRECATED** (self-flagged trong comment) nhưng còn 13 file đọc → `ExternalRef` đã có nhưng chưa backfill xong
2. **Standards** chỉ có trong code (3.074 dòng `lib/cad/standards/`) — không thể **truy vấn**, không thể tuỳ biến theo dự án/vùng (chốt 15/08 nói phải theo vị trí công trình)
3. **`stageLocked: Boolean`** là quyết định 1 chiều, không có lịch sử — không đủ cho Review Gate đầy đủ (chốt 11/08)
4. **`Task.assigneeIds: String` (JSON array)** — không normalize, không query được "việc của tôi" hiệu quả
5. **NotebookChunk.embedding** là text (JSON `number[]`) — cosine trong Node, giới hạn ~vài nghìn chunk trước chậm

---

## 2 · DATA FLOW — bức tranh hiện tại

### 2.1 · Sơ đồ đường đi của DỮ LIỆU

```
NGƯỜI DÙNG
    │
    ├── Chat/Vitals ──▶ /api/chat ─▶ lib/ai/text-tier ─▶ NVIDIA (cloud) / Ollama (local) / oneAI (LAN)
    │                              (chọn theo tier + availability)
    │
    ├── Nhập tệp ──▶ /api/library/ingest ─▶ LibraryAsset (DB metadata + ./uploads file)
    │                                       ↓
    │                                       Auto-extract: palette, caption (nếu ảnh) via lib/idfc-import
    │
    ├── Notebook upload ──▶ /api/notebook/upload ─▶ NotebookSource ─▶ chunk ─▶ NVIDIA embed
    │                                                                          ↓
    │                                                                          NotebookChunk (embedding text)
    │
    ├── CAD vẽ ──▶ lib/cad/store.ts (useCadStore, in-memory) ─▶ .idf JSON (disk-sync.ts)
    │             (KHÔNG lưu DB — 100% file trên đĩa qua handle FileSystem API)
    │
    ├── Node canvas ──▶ Flow.graphJson (Prisma) ─▶ FlowVersion snapshot mỗi Run
    │                   ↓ chạy node
    │                   lib/execution.ts ─▶ AI provider (fal/comfyui/sd) tuỳ node
    │
    ├── Chọn Present ──▶ lib/present-editor/ ─▶ localStorage boq-overrides + slide state
    │
    └── Sync Lark ──▶ /api/lark-tasks ─▶ LarkTaskRef (mirror pull-only)
```

### 2.2 · State đang ở ĐÂU (đếm được)

| Loại state | Nơi lưu | Rủi ro |
|---|---|---|
| Auth session | cookie + Prisma User | OK |
| Project data | Prisma (DB SQLite) | OK |
| **CAD bản vẽ** | `.idf` file trên ĐĨA qua FileSystem API + useCadStore in-memory | **Không đồng bộ máy** — mỗi máy 1 file, không có nguồn chung |
| **Node canvas** | `Flow.graphJson` trong DB | OK, có versioning |
| Task | Prisma | OK |
| UI state (mở panel, nấc sidebar) | localStorage per máy | Đúng luật lưu chung↔máy |
| Grid layout Home bento | code hard-coded + bentoFillPercent tự tính | Vênh chốt 16/08 (widget cỡ định sẵn 1×1/2×1/2×2) |
| BOQ overrides | localStorage per browser | **Không sync giữa máy** — mất khi đổi browser |
| Zustand stores | 3 store: `useFlowStore` (nodes) · `useCadStore` (CAD) · `useCollabStore` (presence) | State chồng lấn: `Flow.graphJson` DB vs `useFlowStore` in-memory |

> ⚠️ ĐÍNH CHÍNH 19/08: đếm đủ là **19 store** (Audit Q0 §3.6) — dòng "3 store" ở trên là số đo thiếu.

### 2.3 · Nợ ở data flow

1. **CAD (.idf) tách rời DB** — chốt cross-platform (chốt 16/08) sẽ vỡ nếu máy khác không có file
2. **BOQ overrides trong localStorage** — trái luật "vật là chung" (chốt 17/08 `IF-KIEN-TRUC §9`)
3. **`useFlowStore` + `Flow.graphJson`** — hai nguồn cùng chứa node graph, cần đồng bộ tay
4. **NotebookChunk cosine trong Node** — không scale, chưa có pgvector/sqlite-vss

---

## 3 · WORKFLOW hiện tại vs 12 giai đoạn ngành (chốt OS §4b)

### 3.1 · Cây workflow hiện có

```
CONCEPT (2D Kỹ thuật) ─▶ RENDER (3D Thiết kế) ─▶ PRESENT (Trình bày)
     │                        │                        │
     ├── /projects/[id]/cad   ├── render/              ├── present/
     └── notebook (RAG)       └── photo (editor)       └── photo (editor)
                                                       └── share/[token]
```

### 3.2 · 9 giai đoạn OS §4b nói phải có — HIỆN TRẠNG

| Giai đoạn OS | Trạng thái IF | Ghi chú |
|---|---|---|
| **INPUT** — nhận brief | 🟡 Có `ProjectProfile` (hồ sơ 60s) + NotebookSource (tài liệu) | Chưa có "Brief" model độc lập với version + duyệt |
| **RESEARCH** — thu thập ref | 🟡 LibraryAsset usage='ref-render' + Gallery | Chưa có workflow tự động (AI tìm ref theo brief) |
| **LAYOUT** — bố cục sơ | ✅ Concept stage phủ | OK |
| **MOODBOARD** — bảng cảm hứng | 🟡 Có `lib/moodboard-boards.ts` + `moodboard-collage.ts` | Không có route riêng, không có DB model |
| **CONCEPT** | ✅ Concept stage | OK |
| **3D** | ✅ Render stage | OK |
| **DESIGN REVIEW** | 🔴 Chỉ có `stageLocked` — không có bảng lịch sử review | Cần Review Gate đầy đủ (chốt 11/08 đã đưa vào sổ nhưng chưa thi công) |
| **REVISION** | 🔴 0 model | Không có concept version chính thức trong DB |
| **TENDER** | 🔴 0 model | Hoàn toàn thiếu |
| **SHOPDRAWING** | 🔴 0 model | Thiếu |
| **SITE** | 🔴 0 model | Thiếu |
| **HANDOVER** | 🔴 0 model | Thiếu |

⇒ **IF phủ ~4/12 giai đoạn ngành**. 8 giai đoạn còn lại là 0 code hoặc rải rác.

### 3.3 · Non-destructive AI workflow (chốt OS)

**Chốt**: AI sai bước 4-5-6 → RETURN TO STEP 4, giữ 1-3, regenerate 4-6.

**Hiện trạng**: `FlowVersion` snapshot mỗi lần Run — có versioning THEO CẢ FLOW, nhưng KHÔNG có checkpoint từng STEP trong 1 flow. Không có "return to step N".

⇒ **Chưa có non-destructive AI workflow đúng chốt**. Cần bảng CheckpointStep hoặc thay đổi cách versioning.

### 3.4 · Creative Timeline — decision > file

**Chốt**: lịch sử DECISION quan trọng hơn lịch sử FILE.

**Hiện trạng**: `FlowVersion` chỉ có `graphJson` + `createdAt` — không ghi *"vì sao đổi B1 → B2"*, không có Direction A/B/C rejected.

⇒ **Chưa có Creative Timeline**. Cần model `DesignDecision` (rationale + parent + rejected reason + who).

---

## 4 · NAVIGATION — trục điều hướng

```
                          RailDieuHuong.tsx  (sidebar 2 cụm, 3 nấc 28/240/320)
                                │
        ┌───────────────────────┴───────────────────────┐
   CỤM XƯỞNG                                        CỤM DỰ ÁN
        │                                               │
   Overview (/)              This project (/projects/[id]/overview)
   Tasks (/tasks)            Notebook (/projects/[id]/notebook)
   Chat·Meetings (workhub)   2D Design (/projects/[id]/cad)
   Files (/files)            3D Design (/projects/[id]/render)
   Library (SHEET nổi)       Presenting (/projects/[id]/present)
   Settings (/settings)      Photo (/projects/[id]/photo)
```

### Nợ navigation

1. **Không có concept "workspace ngữ cảnh"** — `Task.workspaceId` đã có nhưng chưa mount thật vào navigation
2. **`/library` là REDIRECT** (SHEET nổi, không phải trang) — dễ gây nhầm với `/library/gallery` và `/library/ingest` là trang thật
3. **`/materials` `/colors` là REDIRECT về Library sheet** — đúng chốt 16/08 nhưng người dùng vẫn thấy 2 mục ngoài rail (chưa xoá)
4. **Legacy `/cad-editor` `/present-editor` `/photo-editor`** — cố ý giữ (`LegacyStageRedirect`), OK
5. **Chưa có route Community/Development** — vì lớp này 0 code

---

## 5 · TECHNICAL DEBT (chiến lược, không lint)

### 5.1 · 5 nợ cấp KIẾN TRÚC

1. **AI Gateway CHƯA CÓ theo hiến pháp OS** — `lib/gateway/` là gateway định dạng file, không phải AI Gateway. Mọi provider (`lib/ai/providers/nvidia|ollama|fal|comfyui|sd`) được gọi thẳng ở nhiều chỗ. Sửa Ollama biến mất = phải sửa nhiều điểm.
2. **Privacy mode 0 code** — mọi tệp nhạy cảm có thể bị gửi cloud khi dùng NVIDIA. Chưa có toggle Fully Local / Hybrid / Cloud.
3. **Phase là chuỗi cứng** — `currentStage: String` với 3 giá trị hard-coded. Không thể thêm giai đoạn Research/Moodboard/Tender/Handover mà không đổi code.
4. **Standards ở code, không ở DB** — không thể **tuỳ biến theo dự án/vùng địa lý** như chốt 15/08 yêu cầu (biến số ngữ cảnh).
5. **IF Memory schema chưa gộp** — 11 khái niệm OS §4d yêu cầu (Person · Project · Client · Material · Supplier · Space · Design decision · Issue · Feedback · Lesson learned · Standard) hiện có 5 (Person=User · Project · Material=ProductSpec · Standard qua code · Issue phần nào qua Task). Thiếu 6.

### 5.2 · 5 nợ cấp CƠ CHẾ

1. **CAD .idf tách rời DB** — không đồng bộ máy được (vỡ Own your data ở multi-device)
2. **BOQ overrides localStorage** — trái luật lưu chung
3. **useFlowStore + Flow.graphJson** — hai nguồn cùng chứa node graph
4. **NotebookChunk cosine Node.js** — không scale, chưa vector index thật
5. **assigneeIds JSON string** — không query hiệu quả

### 5.3 · 3 điểm CHỒNG CHÉO KHÁI NIỆM

1. **"Gateway"** trùng tên: `lib/gateway/` (định dạng file) vs `AI Gateway` (hiến pháp OS). Cần đặt lại 1 tên.
2. **"Flow"** dùng cho: (a) file dự án (Flow.graphJson) (b) workflow ngành (12 giai đoạn OS). Cần tách.
3. **"Stage"** dùng cho: (a) chặng UI (concept/render/present) (b) phase ngành (12 giai đoạn). Cần tách.

---

## 6 · ĐIỂM QUYẾT ĐỊNH KIẾN TRÚC — chờ Hoà chốt

Đây là các quyết định T KHÔNG tự quyết được (chạm hiến pháp OS, chạm chốt cũ):

### Q1 · Có xây `Phase` model độc lập không?
- **Cách A**: giữ `currentStage: String` — rẻ, không migrate. Đổi tên `render` → `render-3d` mà không phải migrate DB.
- **Cách B**: model `Phase(id, projectId, name, order, done)` + link Task/Doc/Decision vào Phase. Đúng OS §4b.
- Ảnh hưởng: 8 giai đoạn thiếu (Research/Moodboard/Review/Revision/Tender/Shopdrawing/Site/Handover)

### Q2 · AI Gateway — xây bây giờ hay sau?
- **A**: xây 1 lần cho đúng OS §3, mọi call qua Gateway. Refactor ~20 file.
- **B**: giữ nguyên, note nợ.
- **C**: hybrid — file mới bắt buộc qua Gateway, file cũ refactor dần.
- Không xây = **Own your AI** chỉ là văn bản.

### Q3 · Standards vào DB hay giữ code?
- Chốt 15/08 nói **Biến số ngữ cảnh** (theo vị trí công trình) — cần queryable.
- **A**: giữ code + thêm layer "profile overrides" (VD `vn-lighting-hanoi.ts`).
- **B**: DB model `Standard(id, region, category, rule, source)` — tuỳ biến trong app.

### Q4 · CAD .idf — sync DB hay giữ file?
- **A**: giữ file trên đĩa (hiện tại) → không đồng bộ máy được.
- **B**: đồng bộ vào Prisma → có thể sync qua network sau này.
- **C**: hybrid — file là nguồn thật, DB mirror để search + list.

### Q5 · IF Memory — bổ sung 6 model thiếu?
- OS §4d cần: Client · Supplier · Space · **Design decision** · Feedback · **Lesson learned**.
- **A**: bổ sung dần theo cần (Client trước, Lesson sau).
- **B**: bổ sung 1 lần → schema to nhưng gọn.
- Trong 6, **Design decision** và **Lesson learned** là **tài sản lớn nhất** (chốt OS §4c *"data > model"*).

### Q6 · Non-destructive AI workflow + Creative Timeline
- Model `DesignDecision(id, parent, rationale, rejectedReason, evidence, who, at)` — trở thành **cây quyết định**, không phải cây file.
- Ảnh hưởng: Present editor · Flow versioning · Vitals AI (mọi đề xuất phải ghi rationale).

### Q7 · Đổi tên chồng chéo — chọn từ dùng
- `lib/gateway/` → `lib/format-router/`?
- `Flow` → `NodeGraph` (giữ cho ngữ cảnh node-editor)?
- `Stage` → `WorkspaceView` (UI) vs `Phase` (workflow ngành)?

### Q8 · Community / Development lớp
- OS chốt phải có Portfolio · Critique · Trends · Skill development.
- Trong 6 tháng đầu: **có xây không**, hay hoãn tới v2?

---

## 7 · TÓM

| Khía cạnh | Trạng thái so với hiến pháp OS |
|---|---|
| Project System | ✅ ~80% (thiếu Phase model + Review model đầy đủ) |
| Design Workflow (12 giai đoạn) | 🔴 ~35% (chỉ 4/12 giai đoạn) |
| Knowledge System | 🟡 ~50% (Standards ở code, Lesson learned chưa có) |
| Community / Development | 🔴 0% |
| AI Layer + Gateway | 🔴 ~20% (có tier + provider adapter nhưng KHÔNG có gateway thật, không có Privacy) |
| Own your data | 🟡 ~60% (DB ok, .idf tách máy) |
| Own your workflow | 🟡 ~70% (Prisma là mở, nhưng phase cứng) |
| Own your memory | 🔴 ~40% (schema có phần, chưa đủ 11 khái niệm) |
| Replace your AI | 🔴 ~30% (đổi provider = sửa nhiều điểm) |

**IF hiện tại là APP THIẾT KẾ CÓ TÍCH HỢP AI, chưa phải LOCAL-FIRST DESIGN OS theo hiến pháp OS 18/08**. Khoảng cách lớn nhất: (1) 8/12 giai đoạn workflow ngành, (2) AI Gateway, (3) Community/Development lớp, (4) IF Memory schema đầy đủ.

---

## 8 · CHƯA CHẮC / CHƯA KIỂM

- T đọc **21 model Prisma** + đọc **cấu trúc lib/ (110 mục) và app/api/ (33 mục)** — KHÔNG đọc từng file. Kết luận "ai provider được gọi thẳng ở nhiều chỗ" dựa vào grep, không đọc từng call site.
- **Không mở app thật** để chứng minh state flow — dựa trên đọc code.
- **Không kiểm hết feature branches** — chỉ đọc main branch tại HEAD `3da4b8c`.
- **Không đo chi tiết hiệu năng** — Hoà đã cấm.
- **Chưa đọc tests** — có thể có test khai giả định kiến trúc mà T bỏ sót.
- **Các con số phần trăm cuối** là ước lượng dựa trên tỉ lệ model có/thiếu — không phải đo lường chính xác.

## 9 · Hạn dùng kết luận

Bản đồ này hết đúng khi:
1. Hiến pháp OS được lật (không được lật trừ khi Hoà quyết)
2. Có model mới bổ sung (Phase, Client, DesignDecision…)
3. AI Gateway được xây
4. Community lớp bắt đầu code
5. Có thêm giai đoạn workflow được thi công (Moodboard/Tender/Handover…)
