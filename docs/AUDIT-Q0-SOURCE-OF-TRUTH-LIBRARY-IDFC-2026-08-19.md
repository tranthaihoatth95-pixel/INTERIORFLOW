# AUDIT Q0 · SOURCE OF TRUTH · MASTER LIBRARY · FILE MANAGER · IDF · IDFC

> Ngày: **19/08/2026** · Mốc code: **`3da4b8c`** (main HEAD) · Vai T: **KHÁM KIẾN TRÚC HIỆN TRẠNG**, không sửa code.
> Nhiệm vụ Hoà giao 19/08: READ → TRACE → MEASURE → RECOVER HISTORY → COMPARE → REPORT.
> Ranh giới: **KHÔNG** refactor, migration, đổi schema, tối ưu, sửa router. Không tự thiết kế thay code hiện tại.

---

## 1 · EXECUTIVE SUMMARY

InteriorFlow **chưa có MỘT Source of Truth duy nhất** — có **NĂM cơ chế persistence** đang cùng lúc chịu trách nhiệm cho các mảnh khác nhau của một dự án:

| # | Surface | Vai chính | Ai quyết định | Đo được |
|---|---|---|---|---|
| ① | **File trên đĩa dự án** (`.idf` · `.idfp` · `.idfc`) | NGUỒN CHÍNH của bản vẽ 2D + Present + kho cấu kiện studio | `disk-sync.ts` `resolveSourceOfTruth()` | ✅ có contract, có test |
| ② | **IndexedDB** (`interiorflow-sheets`, custom-fonts, upscale-cache, auto-backup) | AUTOSAVE + cache nhanh | `sheets-persist.ts` sheetsKey(userId, route, projectId) | ✅ có luật CACHE < NGUỒN |
| ③ | **Prisma SQLite (`dev.db`)** — 21 model | Project metadata, Flow node graph, LibraryAsset, ProductSpec, Task, Notebook | `lib/server/*` | ✅ đo được |
| ④ | **localStorage** — ~20 key khác nhau | Preference + BOQ overrides + kho `.idfc` studio + workspace + AI tier + resume | rải rác trong nhiều file | 🔴 KHÔNG có contract chung |
| ⑤ | **File JSON trên đĩa server** (`uploads/dna/<projectId>/cards.json`) | Design DNA cards | `lib/dna/store.ts` | ✅ có test |

Mỗi surface có luật riêng và không tất cả tuân theo cùng một triết lý. **`disk-sync.ts` đã giải bài "đĩa vs cache" cho CAD và Present (chốt B4, 31/07)** — nhưng luật đó **không phủ** Flow (Prisma), Task (Prisma), Library assets, Design DNA, hay localStorage. Đây là gốc bệnh của nhiều câu hỏi Hoà đặt.

**Ba phát hiện đắt nhất, ba câu hỏi lớn**:

1. **`.idfc` `.idf` `.idfp` là BA format độc lập, KHÔNG có canonical identity xuyên chặng** — mỗi cái do một chặng viết ra, KHÔNG có "canonical object" nào tồn tại trước cả ba. `matId` là dây nối `.idfc` ↔ `ProductSpec`, không phải canonical scene object. → Câu hỏi lớn cho Hoà.
2. **Design DNA hiện chỉ có PROJECT scope, KHÔNG có Person/Studio/Client DNA** — file JSON `uploads/dna/<projectId>/cards.json`. Không learning signal từ correction. → GAP so với vision Hoà nêu.
3. **19 Zustand store rời rạc** — bản đồ tay 18/08 ghi 3, thực tế 19. Không có state authority chung. → E — Terminology / Ownership Ambiguity.

Báo cáo đầy đủ: 35 phần dưới đây, mỗi finding kèm file:line evidence. Kết thúc bằng **9 câu hỏi kiến trúc chờ Hoà quyết định**.

---

## 2 · METHOD / EVIDENCE BOUNDARY

**Nguồn sự thật T dùng trong audit này** (theo thứ tự tin cậy giảm dần):

1. **Code đọc trực tiếp** — 7 file lõi format (`disk-sync.ts` · `cad/idf.ts` · `cad/idfc.ts` · `present-editor/idfp.ts` · `library/idfc-store.ts` · `idfc-import/from-photo.ts` · `rna/types.ts`) + 6 file Prisma+store (`schema.prisma` · `boq-overrides.ts` · `sheets-persist.ts` head · `distill/engine.ts` · `dna/store.ts` + Prisma model shape) + grep persistence surfaces.
2. **Docstring comment trong code** — nhiều file có docstring dài kể lịch sử chốt (ví dụ `idfc.ts:2-42` ghi rõ chốt 07/08 + luật CONTENT). Có timestamp trong comment coi là HISTORICAL DECISION.
3. **`docs/00-CHOT.md`** — sổ chốt append-only đã có sẵn trong context system prompt của T. Trích được nguyên văn có timestamp.
4. **`.ua/knowledge-graph.json`** — 2694 nodes T vừa sinh 19/08. **KHÔNG DÙNG làm nguồn primary** (LLM sinh có thể sai) — chỉ tra thứ đã đọc code.

**Ranh giới bằng chứng**:
- KHÔNG mở app thật lần này (audit T về code, không về UX). Câu hỏi "restart app còn gì" giải bằng đọc code, không chạy thử.
- KHÔNG kiểm tests-suite (có thể có test khai giả định T bỏ sót — được ghi ở phần "unknown").
- KHÔNG đọc components/ (bản đồ tay 18/08 và /understand đều loại) — trạng thái UI có thể khác.
- KHÔNG grep toàn 674 file docs — chỉ 00-CHOT + 3 file bản đồ tay.

**Ba nhãn phân loại T dùng**:
- **FACT** — có file:dòng
- **HISTORICAL DECISION** — có timestamp trong 00-CHOT hoặc docstring
- **UNKNOWN** — không tìm được evidence

---

## 3 · CURRENT PERSISTENCE INVENTORY (§3)

### 3.1 · Surface ① — File trên đĩa dự án (FileSystem API)

**File format**: 3 loại chính, tất cả JSON versioned, migration bảng nâng cấp từng bậc.

| Format | LOC | Version | Chủ sở hữu | Chứa gì |
|---|---|---|---|---|
| `.idf` | 245 | 2 | CAD project (CadSheets.tsx) | `idfVersion` · `meta` (projectName, createdAt, modifiedAt, appVersion) · `sheets[]` (id, name, doc, paperSheets?) |
| `.idfp` | 207 | 1 | Present project (PresentSheets.tsx) | `idfpVersion` · `meta` · `brandKitSnapshot: BrandKit | null` (SNAPSHOT, không tham chiếu sống) · `sheets[]` (id, name, deck: EditorDeck) |
| `.idfc` | 438 | 3 | Kho cấu kiện studio | `idfcVersion` · `meta {id?, name, code, kind, scope?, tags?, room?}` · **`body` discriminated union theo `kind`** · `commerce?` (chỉ 6 kind SELLABLE) |

**Migration**: cả 3 dùng cùng khuôn `Record<number, (f) => Record>` (bảng nâng 1 bậc). `.idf`: v1→v2 (thêm `levels` từ `storey`). `.idfc`: v1→v2 (chuyển `geom2d` vào `body`, gộp `lighting`→`fixture`), v2→v3 (thêm kind `preset`). `.idfp`: chỉ v1, chưa có migration thật.

**File handle**: 3 file dùng FileSystem API:
- `lib/root-folder.ts` — showDirectoryPicker, giữ FileSystemDirectoryHandle trong IndexedDB
- `lib/cad/auto-backup.ts` — auto backup
- `lib/filemanager/real-fs.ts` — file manager thực

Evidence: `grep showDirectoryPicker lib/`

### 3.2 · Surface ② — IndexedDB

**5 database/store** phát hiện được:

| File | Store name | Chứa gì |
|---|---|---|
| `lib/sheets-persist.ts` | `interiorflow-sheets` / store `sheets` | AUTOSAVE bộ sheet CAD + Present, khoá `userId::route::projectId` |
| `lib/present-editor/upscale-cache.ts` | (chưa đọc chi tiết) | Cache ảnh upscale 300dpi |
| `lib/present-editor/custom-fonts.ts` | (chưa đọc chi tiết) | Font nhúng theo deck (dataURL base64) |
| `lib/cad/auto-backup.ts` | (chưa đọc chi tiết) | Backup CAD trước khi ghi đĩa |
| `lib/root-folder.ts` | (chưa đọc chi tiết) | Giữ FileSystemDirectoryHandle |

**Luật cache < nguồn** (docstring `sheets-persist.ts:2-20` + `disk-sync.ts:4-5`):
> "tệp trong thư mục dự án là NGUỒN, IndexedDB tụt xuống CACHE"

Vì sao chọn IDB không localStorage: *"deck Present có thể chứa ảnh dataURL hàng MB — localStorage trần ~5MB là vỡ; IDB trần theo đĩa (hàng trăm MB)"* (`sheets-persist.ts:19-21`).

### 3.3 · Surface ③ — Prisma SQLite

**21 model** phát hiện qua `grep '^model ' prisma/schema.prisma`:

```
User · IntegrationAccount · Project · ProjectMember · ProjectProfile ·
ProjectNotebook · NotebookSource · NotebookChunk · Flow · FlowVersion ·
CreditTransaction · ChatMessage · LibraryAsset · GuModel · LarkTaskRef ·
LarkPersonRef · ProductSpec · LarkUserMap · WorkflowState · Task · ExternalRef
```

Chi tiết trong §9 (Prisma ownership).

### 3.4 · Surface ④ — localStorage

**~20 key** grep được từ `lib/` (không kể test):

| Namespace | Key | File | Chứa gì |
|---|---|---|---|
| **Kho `.idfc` studio** | `if.library.idfc.v1` | `lib/library/idfc-store.ts:17` | Toàn bộ `.idfc` studio nạp qua BulkIngest |
| **Workspace** | `interiorflow.workspace` | `lib/store.ts:465` | Workspace state |
| **Workspace fallback** | `interiorflow.flow.v1` | `lib/workspace.ts:126` | Flow legacy |
| **AI tier** | `interiorflow.aiTier` | `lib/store.ts:472` | Cấu hình tier AI (cloud/local) |
| **oneAI engine/runtime** | `interiorflow.oneAiEngine`, `interiorflow.oneAiRuntime` | `lib/store.ts:478,484` | |
| **Theme/Lang** | (`THEME_KEY`, `LANG_KEY`) | `lib/store.ts:546,561` | Preference |
| **Render mode** | (`RENDER_MODE_KEY`) | `lib/stage-mode.ts:30` | Node/3D mode chặng 2 |
| **Idle minutes** | `IDLE_MINUTES_PREFIX + userId` | `lib/lockscreen.ts:78` | Lock timeout |
| **Resume state** | `RESUME_PREFIX + userId` | `lib/resume.ts:60` | Chặng dở lúc thoát |
| **Last user** | `LAST_USER_KEY` | `lib/resume.ts:99` | User đăng nhập gần nhất |
| **Tour done** | `TOUR_PREFIX + userId` | `lib/resume.ts:131` | Tour onboarding |
| **Stage intro** | `STAGE_INTRO_PREFIX + stage + userId` | `lib/resume.ts:166` | |
| **Coachmark** | `COACHMARK_PREFIX + name + userId` | `lib/resume.ts:201` | |
| **Gallery view** | `GALLERY_VIEW_PREFIX + userId` | `lib/resume.ts:243` | |
| **Gallery items** | (`KEY` trong gallery.ts) | `lib/gallery.ts:16` | Ảnh Gallery user |
| **Ref ingest** | (`STORE_KEY` trong refingest.ts) | `lib/refingest.ts:146` | Ingest ref |

🔴 **KHÔNG có contract chung** — mỗi file tự đặt tên khoá, không centralized. Namespace `interiorflow.*` chỉ dùng ở `store.ts` (workspace), phần còn lại tự do.

### 3.5 · Surface ⑤ — File JSON trên đĩa server

**Design DNA**: `uploads/dna/<projectId>/cards.json` (`lib/dna/store.ts:21`)
- Ghi 1 file JSON mỗi dự án
- Server-only (`fs/promises`)
- Route: `/api/projects/[id]/dna`

**Uploads root**: `./uploads/` — LibraryAsset `path` trỏ vào (Prisma model comment `LibraryAsset:` "URL /api/library/{id}/file")

---

### 3.6 · Zustand stores — 19, KHÔNG phải 3

**Bản đồ tay 18/08 §2.2 ghi 3 store** (`useFlowStore`, `useCadStore`, `useCollabStore`). **Thực tế đo được 19** qua `grep create<`:

```
useProjectPresence    lib/project-presence-ui.ts
useLockScreen         lib/lockscreen.ts
useVitalsUi           lib/vitals-ui.ts
useSaveStatus         lib/save-status.ts
useLeaveConfirm       lib/resume.ts
useRenderModeStore    lib/stage-mode.ts
useCollabStore        lib/collabStore.ts        ← đã ghi
useHomeSearch         lib/home/search-store.ts
useFlowStore          lib/store.ts              ← đã ghi
useSmartSelectStore   lib/smartselect/smartSelectStore.ts
useCuaSoCongCuUi      lib/nodes/cua-so-cong-cu-ui.ts
usePlayStatus         lib/present-editor/play-status.ts
useCadLiveStatus      lib/cad/live-status.ts
useCadStore           lib/cad/store.ts          ← đã ghi
useWarpStore          lib/warp/warpStore.ts
useToolModeUi         lib/render-studio/tool-mode-ui.ts
useTool3D             lib/render-studio/tool3d.ts
useSketchStore        lib/sketch/sketchStore.ts
useTree3DUi           lib/render-studio/tree3d-ui.ts
```

⚠️ **Đính chính bản đồ tay**: 16 store rời không có state authority chung → §11 vẽ lại authority graph.

---

## 4 · SOURCE-OF-TRUTH MATRIX (§5)

Bảng theo domain semantic. Ô ✅ = có contract rõ; 🟡 = có nhưng cần Hoà quyết; 🔴 = conflict; ❓ = chưa kiểm.

| Domain | Runtime State | Persistent State | Writer | Reader | **Actual SoT** | Derived/Cache | Sync | Conflict Risk | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| **CAD 2D document** | `useCadStore` (1037 dòng) + `useCadLiveStatus` + `useSmartSelectStore` + `useWarpStore` + `useSketchStore` | `.idf` file trên đĩa · IndexedDB `interiorflow-sheets` autosave · Prisma `Flow.graphJson`? | CadSheets.tsx | CadSheets.tsx + editor | **`.idf` FILE** (via `disk-sync.ts`) | IDB autosave | Throttle write ≥3s + flushNow ⌘S/unload | LOW — `disk-sync.ts` giải bài | `disk-sync.ts:4-5,44-60` |
| **Present deck** | `usePlayStatus` + editor state | `.idfp` file trên đĩa · IndexedDB `interiorflow-sheets` autosave | PresentSheets.tsx | PresentSheets.tsx | **`.idfp` FILE** (via `disk-sync.ts`) | IDB autosave | Y HỆT `.idf` | LOW | `idfp.ts:2-11` + `disk-sync.ts:4` |
| **BOQ overrides** | (immutable map trong component) | **IndexedDB** (`boq-overrides-persist.ts`) | present-editor UI | present-editor UI | **IDB, KHÔNG ghi vào Doc/`.idf`** | live compute từ Doc | Không sync máy khác | 🟡 mất khi đổi browser | `boq-overrides.ts:2-14` |
| **Node graph (Flow chặng 2)** | `useFlowStore` (1257 dòng) | Prisma **`Flow.graphJson: String`** + `FlowVersion[]` | `/api/flows/*` | `/api/flows/*` | **Prisma DB** | `useFlowStore` cache | Autosave qua API + snapshot mỗi Run | 🟡 useFlowStore vs Flow.graphJson (bản đồ tay §2.3 ghi) | `schema.prisma:Flow` + `store.ts:335` |
| **Project metadata** | Không có store trung tâm | Prisma `Project` + `ProjectProfile` | `/api/projects/*` | `/api/projects/*` | **Prisma DB** | (không cache) | Không sync máy khác qua IF (dev.db local) | LOW — không có duplicate | `schema.prisma:Project` |
| **Task** | Không có store trung tâm | Prisma `Task` + `WorkflowState` | `/api/tasks/*` + `/api/lark-tasks` sync | UI Task board | **Prisma `Task`** (canonical) + `LarkTaskRef` mirror pull-only | `LarkTaskRef` | Sync 1 chiều pull từ Lark | 🟡 `assigneeIds: String` JSON (mất normalize) | `schema.prisma:Task` |
| **Library asset (file thô)** | Không có store | Prisma `LibraryAsset` (metadata) + **file vật lý ở `./uploads/`** | `/api/library/ingest` | `/api/library/{id}/file` | **Đôi**: DB canonical cho metadata, file cho binary | Preview cache? ❓ | `deletedAt` soft-delete, KHÔNG xoá file vật lý | 🟡 orphan file khi rev deleteda | `schema.prisma:LibraryAsset:` |
| **Material spec** | Không có store trung tâm | Prisma `ProductSpec` (kind='material') + `larkRecordId` | `/api/atlas-materials/sync` | UI Materials + BOQ | **Prisma `ProductSpec`** | LarkTaskRef mirror | Pull từ Lark | LOW | `schema.prisma:ProductSpec` |
| **Component template (`.idfc` studio)** | (loaded on demand) | **localStorage `if.library.idfc.v1`** | BulkIngest UI | LibrarySheet | **localStorage** (studio scope) | (không cache khác) | 🔴 KHÔNG SYNC MÁY KHÁC | 🔴 mất khi đổi browser + rowsize localStorage | `idfc-store.ts:17` |
| **Design DNA cards** | Loaded via route | **File JSON** `uploads/dna/<projectId>/cards.json` | `/api/projects/[id]/dna` (PUT/POST) | Cùng route (GET) | **File JSON server-side** | (không cache) | Chỉ đọc/ghi qua API | 🟡 KHÔNG Prisma → không query cross-project | `dna/store.ts:21,49-54` |
| **Chat messages** | Không có store | Prisma `ChatMessage` | `/api/chat` | UI Vitals + chat | **Prisma DB** | (không cache) | Không sync | LOW | `schema.prisma:ChatMessage` |
| **Brand Kit** | Không có store trung tâm | **localStorage** (toàn cục, per user) | `lib/present-editor/brand-kit.ts` | Present editor | **localStorage** + SNAPSHOT trong `.idfp` mỗi lần export | (không cache khác) | 🔴 KHÔNG SYNC MÁY KHÁC | 🟡 snapshot vs live có thể lệch | `idfp.ts:20-27` |
| **Notebook RAG** | Không có store | Prisma `ProjectNotebook` + `NotebookSource` + `NotebookChunk` (embedding text) | `/api/notebook/*` | Vitals RAG | **Prisma DB** | (không cache) | Không sync | 🟡 cosine trong Node.js → không scale | `schema.prisma:NotebookChunk` |
| **AI provider config** | (không store) | localStorage `interiorflow.aiTier` + `interiorflow.oneAiEngine` + `interiorflow.oneAiRuntime` | `/settings` UI | AI tier resolver | **localStorage per browser** | (không cache khác) | Không sync | 🟡 config khác nhau giữa máy | `store.ts:472-484` |
| **Presence (multi-tab)** | `useProjectPresence` + `useCollabStore` | (không persist) | `BroadcastChannel` | Component banner | Runtime only, TTL 12s | (không cache) | BroadcastChannel same-origin | LOW | `disk-sync.ts:145-196` |
| **Preferences (theme, lang, resume, tour, coachmark)** | (không store) | ~15 localStorage key `RESUME_PREFIX + userId`, `TOUR_PREFIX + userId`, ... | `resume.ts` scattered | Ditto | **localStorage per browser** | (không cache) | Không sync | 🟡 UX inconsistent cross-device | `resume.ts:60-253` |
| **Save status** | `useSaveStatus` | (không persist) | Editor writes | UI status bar | Runtime only | (không cache) | Không cần | LOW | `save-status.ts:37` |
| **Vitals AI conversation state** | `useVitalsUi` | (không persist) | Vitals UI | Vitals UI | Runtime only | (không cache) | Không cần | LOW | `vitals-ui.ts:37` |
| **Colors** | Không có store trung tâm | localStorage (chưa đọc chi tiết) | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | Cần đọc `lib/colors/store.ts` (chưa) |

---

## 5 · MULTIPLE SOURCES OF TRUTH — findings (§6)

### 5.1 · CAD Doc ↔ `.idf` ↔ IndexedDB autosave — ✅ RESOLVED

**Ba nơi có Doc**: `useCadStore` (in-memory) · IndexedDB `interiorflow-sheets` (autosave) · `.idf` file (nguồn).

**Cách giải**: `disk-sync.ts:44-60` `resolveSourceOfTruth()` — hàm THUẦN + có test. 4 nhánh: `disk-unreadable` · `disk-incomplete` · `tie` (dung sai 2s) · `cache-newer`.

**Phân loại**: **B — INTENTIONAL / SAFE** (có contract, có test, có docstring dài giải thích).

**HISTORICAL DECISION**: 31/07, mã B4/`4.1.d`. Comment `disk-sync.ts:11-30` ghi rõ 4 bổ sung Hoà chốt.

### 5.2 · Node graph (Flow) ↔ `useFlowStore` — 🟡 UNRESOLVED

**Hai nơi**: `Flow.graphJson: String` (Prisma) + `useFlowStore` (Zustand runtime).

Bản đồ tay 18/08 §2.3 nợ #3: *"useFlowStore + Flow.graphJson — hai nguồn cùng chứa node graph, cần đồng bộ tay"*. Xác nhận qua đọc `schema.prisma:Flow` + `store.ts:335`.

**KHÔNG có `resolveSourceOfTruth`-tương-đương cho Flow.** Flow autosave qua REST API (không phải disk-sync).

**Phân loại**: **C — ARCHITECTURAL GAP**. Không có contract như CAD/Present.

### 5.3 · BOQ overrides — 🟡 TRÁI LUẬT LƯU CHUNG

**Chốt 17/08 §9 (00-CHOT):** "VẬT · CẤU TRÚC VIỆC ⇒ CHUNG; CÁCH BÀY TRÊN MÀN CỦA TÔI ⇒ MÁY MÌNH".

**Thực tế**: `boq-overrides-persist.ts` → **IndexedDB per browser** (`boq-overrides.ts:14` "Phần PERSIST xuống IDB"). BOQ overrides là **VẬT** (con số tiền) — theo luật phải CHUNG. Nhưng persist per browser → mất khi đổi browser.

**Phân loại**: **A — PROVEN ARCHITECTURAL CONFLICT**. Luật đã chốt, code trái.

Bản đồ tay 18/08 §5.2 nợ #2 xác nhận đúng: *"BOQ overrides trong localStorage — trái luật vật là chung"* (T ghi tay "localStorage" nhưng đo lại là **IndexedDB**, cùng lỗi: per browser).

### 5.4 · Brand Kit — snapshot + live cùng chạy

**Ba nơi**:
1. **localStorage toàn cục** (Brand Kit "active" khi mở app) — `brand-kit.ts` (chưa đọc chi tiết)
2. **COPY giá trị vào deck** (`seedDeckWithBrandKit` — copy palette/fonts/watermark) — sống trong `EditorDeck`
3. **SNAPSHOT trong `.idfp`** (`brandKitSnapshot: BrandKit | null`) — SNAPSHOT, không tham chiếu sống

**Lý do Hoà chốt snapshot** (`idfp.ts:21-27`): *"sau này mở file có thể đã đổi/xoá kit"*. Xác nhận là **intentional**.

**Phân loại**: **B — INTENTIONAL / SAFE** cho snapshot vs live. **Nhưng**: cross-device, localStorage không sync → theme Brand Kit khác nhau giữa máy → **E — TERMINOLOGY / OWNERSHIP AMBIGUITY** (studio scope chưa rõ).

### 5.5 · Kho `.idfc` studio — localStorage KHÔNG SYNC MÁY

**`if.library.idfc.v1`** (`idfc-store.ts:17`) — **localStorage per browser**.

Comment `idfc-store.ts:8-10`: *"KHÔNG cột DB mới (kho 3 tầng scope='global' chưa có luật duyệt; localStorage đủ cho tầng studio hôm nay, dời lên server là việc riêng)"*.

**Phân loại**: **C — ARCHITECTURAL GAP**. Studio scope không sync là **cố ý tạm thời**, chờ chốt luật duyệt.

### 5.6 · Studio-level ProductSpec — KHAI CỘT, CHƯA CODE

`ProductSpec` shape (`schema.prisma:ProductSpec`, comment 04/08):
> *"Kho vật liệu IF v1 — khai chỗ cho kho 3 tầng (① chung / ② studio / ③ dự án chỉ tham chiếu). CHỈ khai cột, CHƯA code chức năng cho scope='global' — lý do: IF có 0 studio ngoài TTT, chưa phá được vòng con-gà-quả-trứng."*

**Phân loại**: **C — ARCHITECTURAL GAP có khai báo** (Hoà đã biết, cố ý hoãn).

### 5.7 · Preferences — localStorage, không cross-device

**~15 key** `resume.ts` không sync giữa máy. Người dùng đổi máy = phải làm lại tour, mất coachmark, mất resume state.

**Phân loại**: **E — TERMINOLOGY / OWNERSHIP AMBIGUITY** — preferences (theo luật 17/08) là *"máy mình"* nên không sync là đúng. Nhưng đối với **cùng một user, hai máy** → UX không nhất quán. Cần Hoà chốt.

### 5.8 · `larkProjectCode` DEPRECATED nhưng còn 13 file đọc

**`Project.larkProjectCode: String?`** (`schema.prisma:Project:`, comment 07/08):
> *"⚠️ DEPRECATED-ĐANG-CHUYỂN (07/08 §0v 'lõi không mang tên nhà cung cấp'). Đích đến: ExternalRef{system:'lark', entityType:'project'}. KHÔNG xoá cột lúc này (KS4 + còn 13 file đọc nó)."*

**Phân loại**: **A — PROVEN ARCHITECTURAL CONFLICT** tồn tại 12 ngày, có kế hoạch nhưng chưa backfill. Bản đồ tay 18/08 §1.3 #1 xác nhận đúng.

### 5.9 · Design DNA scope — CHỈ project, KHÔNG Person/Client/Studio

**`lib/dna/store.ts:21`**: `path.join(process.cwd(), 'uploads', 'dna', <projectId>, 'cards.json')`.

Hoà vision (bối cảnh 19/08): *"DNA có thể tồn tại theo nhiều scope: Person · Client · Studio · Project"*.

Thực tế: **CHỈ Project**. Không có Person DNA, không có Studio DNA, không có Client DNA.

**Phân loại**: **C — ARCHITECTURAL GAP** so với vision.

---

## 6 · FIVE END-TO-END TRACES (§7)

### 6.1 · Flow A — PROJECT (Create → Open → Save → Reopen)

```
CREATE
  UI /projects/new
    → POST /api/projects (Prisma create Project + ProjectProfile)
    → dev.db canonical

OPEN
  UI /projects/[id]/*
    → GET /api/projects/[id] (Prisma) → return metadata
    → Component load

EDIT
  metadata (name, currentStage, stageLocked):
    → PUT /api/projects/[id] → Prisma update
    → rev tăng (schema.prisma:Project rev Int)

SAVE
  Không có save trung tâm — mỗi domain tự save (CAD → .idf, Present → .idfp, Flow → Prisma, DNA → JSON)

CLOSE / REOPEN
  Metadata: Prisma
  CAD sheets: file .idf + IDB (theo disk-sync)
  Present sheets: file .idfp + IDB
  Node graph: Prisma Flow.graphJson
  Task: Prisma Task
  Notebook: Prisma
  DNA: file JSON server
  Preferences: localStorage per browser
```

**FACT**: KHÔNG có "save project" duy nhất. Mỗi surface tự save độc lập. → GAP §22 identity continuity.

### 6.2 · Flow B — CAD 2D (Open → Edit → Persist → Reopen)

```
OPEN
  CadSheets.tsx mount
    → sheetsKey(userId, route, projectId)
    → loadSheets() from IDB (cache)
    → nếu có Root Folder Handle → đọc .idf file
    → resolveSourceOfTruth({diskModifiedAtMs, cacheTs, diskSheetCount, cacheSheetCount})
    → chọn disk|cache
    → hydrate useCadStore

EDIT
  UI action → command → useCadStore.setState(...)
    → useSaveStatus set 'saving'
    → cadLiveStatus update

WRITE
  Cache: saveSheets() → IDB (debounce ≥1s) — sheets-persist.ts
  Disk: diskWriter.touch() → throttle ≥10s (disk-sync.ts:84) → exportIdf(sheets, meta) → writeTextFile
  Manual save: diskWriter.flushNow() (⌘S / beforeunload)

REOPEN
  Y hệt OPEN
```

**FACT**: 2 layer autosave (IDB fast + disk slow), quyết định bởi `resolveSourceOfTruth` lúc mount.

### 6.3 · Flow C — 3D (Receive → Transform → Persist)

```
INPUT
  Chặng 2 node graph (useFlowStore)
    → BuildRecipe (lib/three/build-recipe.ts) — non-destructive stack
    → BuildOp[] = extrude|boolean|arrayLinear|arrayRadial|mirror|bevelEx|taper|sweep|revolve|loft

TRANSFORM
  docToObjScene(Doc, options) → Three.js scene
  BuildRecipe eval → mesh

PERSIST
  KHÔNG có "3D save" độc lập — 3D là DERIVED từ Doc (CAD .idf) + BuildRecipe (Flow node)

REOPEN
  Ditto: derive lại từ Doc + BuildRecipe
```

**FACT**: 3D KHÔNG có persist riêng. Là derived. Nếu Doc còn + BuildRecipe còn thì 3D reconstruct được.

**Bản đồ tay 18/08 §3.3 §3.4 nói đúng**: *"Non-destructive AI workflow chưa có non-destructive AI ở STEP-level"*. Xác nhận qua evidence: BuildRecipe có non-destructive nhưng KHÔNG có "return to step N" giữa nhiều Run.

### 6.4 · Flow D — PRESENT (Compose → Save → Export)

```
RECEIVE
  Chặng 2D (CAD linked-assets) + 3D render (LibraryAsset) + Chặng 2 (moodboard/mood-collage)
    → PresentSheets.tsx build EditorDeck

COMPOSE
  useEditorDeck state (per component)
  Brand Kit copy từ localStorage → EditorDeck.customFonts + palette

SAVE
  Cache: IDB (sheets-persist) — debounce ≥1s
  Disk: diskWriter → exportIdfp(sheets, brandKitSnapshot, meta) → .idfp
  BOQ overrides: IDB riêng (boq-overrides-persist)

EXPORT
  PPTX/PDF/PNG (lib/present-editor/export.ts + pptx-*.ts)
```

**FACT**: Present song song với CAD (cùng khuôn disk-sync).

**Nợ**: BOQ overrides không đi vào `.idfp` — mất khi share file. Đây là 🟡 5.3 §5.3.

### 6.5 · Flow E — AI / NODE / GENERATED ASSET

```
INPUT
  Node canvas (Flow.graphJson) + params

CHẠY NODE
  lib/execution.ts → runNode(nodeId, ctx)
    → lookup node def in NODE_DEFINITIONS
    → call AI provider (fal|comfyui|sd|nvidia|ollama) — GỌI THẲNG, không qua Gateway

GENERATED RESULT
  Output ảnh → lưu vào ./uploads → LibraryAsset created
  Output text → hiển thị

USER ACTION
  Edit → mở photo-editor (canvas riêng, không apply lại)
  Keep → LibraryAsset đã có
  Reject → không tự động delete (chỉ khi user explicit)
  Approve → KHÔNG có concept này trong code

PERSIST
  LibraryAsset (Prisma) + file ./uploads
  Provenance: KHÔNG lưu (không có DesignDecision model)
  Correction signal: KHÔNG capture (bản đồ tay 18/08 §3.4 xác nhận GAP)
```

**FACT**: 
- Provider gọi thẳng — `from-photo.ts:195` `process.env.NVIDIA_VLM_MODEL`, `from-photo.ts:209` `process.env.FAL_KEY`. 
- Không có "user correction" persistence.
- Không có DesignDecision model.

**HISTORICAL DECISION**: `docs/IF-KIEN-TRUC-OS.md:302` (18/08) ghi 5 rủi ro OS §Đối chiếu — 2 rủi ro về NVIDIA/gateway trỏ vào đúng file này. Xác nhận evidence.

---

## 7 · STATE AUTHORITY GRAPH (§11)

Vẽ theo code THẬT, không beautify:

```
USER ACTION (component)
  │
  ├─→ COMMAND (lib/commands/registry.ts) ────→ useCadStore.setState (nếu CAD)
  │                                     ────→ useFlowStore.setState (nếu Flow)
  │                                     ────→ useCollabStore (nếu presence)
  │
  ├─→ REST API (/api/*)  ─────────────────────→ Prisma (canonical for DB-owned domains)
  │
  ├─→ diskWriter.touch() ─────────────────────→ file .idf / .idfp (throttle ≥10s)
  │
  └─→ localStorage.setItem ────────────────────→ ~20 key rời rạc

PERSISTENCE READ (reload):
  ├─→ resolveSourceOfTruth({disk, cache}) → disk OR IDB cache
  ├─→ Prisma reads (metadata/task/flow/library)
  ├─→ localStorage reads (preferences/BOQ/theme/aiTier)
  └─→ file JSON reads (DNA)

RUNTIME:
  ├─→ 19 Zustand stores (không có state authority chung)
  ├─→ React Context (không đo trong audit này)
  └─→ Component local state (không đo)

BroadcastChannel (multi-tab):
  └─→ useProjectPresence + watchProjectPresence (TTL 12s)
```

**FACT**: Không có "state authority" trung tâm. Có `disk-sync.ts` là contract cho 2 domain (CAD/Present) — đó là mảnh đẹp nhất.

---

## 8 · PRISMA OWNERSHIP (§9)

### 8.1 · 21 model chia theo vai

**Canonical domain** (Prisma là SoT):
- `User`, `IntegrationAccount` — auth
- `Project`, `ProjectMember`, `ProjectProfile` — metadata dự án
- `ProjectNotebook`, `NotebookSource`, `NotebookChunk` — RAG (embedding text)
- `Flow`, `FlowVersion` — node graph
- `Task`, `WorkflowState` — task board
- `LibraryAsset` — file metadata (binary ở `./uploads`)
- `ProductSpec` — material spec + Larkbase sync
- `ChatMessage` — chat messages
- `GuModel` — pairwise perceptron per user+kind
- `CreditTransaction` — credit
- `WorkflowState` — Kanban column

**Mirror pull-only** (Prisma cache, source ở ngoài):
- `LarkTaskRef` — mirror Task từ Larkbase
- `LarkPersonRef` — mirror Person
- `LarkUserMap` — map Lark user

**Bridge**:
- `ExternalRef` — map `system + externalId → entityType + entityId` với anti-loop (`lastWriteBy`)

### 8.2 · Field chứa JSON serialized state

| Model | Field | Kiểu | Nội dung |
|---|---|---|---|
| `Flow` | `graphJson` | String | Node graph `{nodes, edges}` |
| `FlowVersion` | `graphJson` | String | Snapshot |
| `Task` | `assigneeIds` | String default `""` | JSON `string[]` User.id — **KHÔNG normalize** |
| `LibraryAsset` | `palette` | String default `""` | JSON `string[]` hex |
| `LibraryAsset` | `tags` | String default `""` | Tags |
| `ProductSpec` | `materials` | String default `""` | JSON string[] |
| `ProductSpec` | `finishes` | String default `""` | JSON string[] |
| `ProductSpec` | `styleTags` | String default `""` | JSON string[] |
| `ProductSpec` | `raw` | String? | JSON raw Larkbase |
| `ExternalRef` | ... | ... | có `lastWriteBy` field |

**FACT**: Task.assigneeIds là JSON string — bản đồ tay 18/08 §1.3 #4 xác nhận đúng. Không query hiệu quả *"việc của tôi"* nếu không parse JSON.

### 8.3 · Field FK MỀM (không có Prisma `@relation`)

| Model | Field | FK mềm tới | Ghi chú |
|---|---|---|---|
| `ProductSpec` | `imageAssetId` | `LibraryAsset.id` | Comment: *"FK mềm LibraryAsset — lưu-theo-tham-chiếu"* |
| `ProductSpec` | `larkRecordId` | Lark record id | `@unique` |
| `Task` (nếu có `larkTaskId`) | ... | Lark | (chưa kiểm) |

**FACT**: FK mềm cố ý — để tránh cascade delete từ Prisma khi asset bên ngoài đổi. Nhưng KHÔNG referential integrity → orphan có thể xảy ra.

### 8.4 · Domain có "write path bypass Prisma"

| Domain | Bypass |
|---|---|
| CAD Doc | File `.idf` trên đĩa + IndexedDB (KHÔNG qua Prisma) |
| Present Deck | File `.idfp` + IDB |
| Kho `.idfc` studio | localStorage |
| Design DNA | File JSON server `uploads/dna/` |
| BOQ overrides | IndexedDB |
| Preferences | localStorage |
| Brand Kit | localStorage + snapshot trong `.idfp` |

**FACT**: Ít nhất **7 domain** không đi qua Prisma.

### 8.5 · DB có reconstruct toàn project được không?

**KHÔNG.** Nếu chỉ còn Prisma (mất file `.idf`, `.idfp`, `uploads/`):
- Metadata project: ✅ còn
- Node graph Flow: ✅ còn (`graphJson`)
- Task: ✅ còn
- Notebook chunks: ✅ còn
- LibraryAsset **metadata**: ✅ còn nhưng `path` không dùng được (file mất)
- ProductSpec: ✅ còn
- **CAD sheets**: 🔴 MẤT (Doc chỉ ở `.idf` + IDB)
- **Present deck**: 🔴 MẤT (`.idfp` + IDB)
- **Design DNA**: 🔴 MẤT
- **BOQ overrides**: 🔴 MẤT
- **Brand Kit**: 🔴 MẤT (chỉ localStorage + snapshot trong `.idfp`)

### 8.6 · Project có reconstruct được nếu chỉ còn `.idf`?

**KHÔNG.** `.idf` chỉ chứa `meta {projectName, createdAt, modifiedAt, appVersion}` + `sheets[]`. KHÔNG chứa:
- Prisma Project.id
- ProjectMember (team)
- Task
- Flow node graph
- Notebook
- LibraryAsset
- Design DNA
- ProductSpec references

Chỉ CAD sheets. Reconstruct được sheet + doc, không phải toàn project.

---

## 9 · IDF CURRENT REALITY (§8)

### 9.1 · `.idf` là gì?

**FACT** (`idf.ts:1-14`): 
- **CAD file** (project CAD file, KHÔNG phải project-level file toàn app)
- Vai tương đương `.dwg` của AutoCAD
- File rời để **export/tải/chia sẻ/backup** — KHÁC autosave nội bộ IndexedDB (`sheets-persist.ts`)

### 9.2 · Chứa gì

```typescript
interface IdfFile {
  idfVersion: 2;
  meta: {
    projectName: string;
    createdAt: string;  // ISO 8601
    modifiedAt: string; // ISO 8601
    appVersion: string;
  };
  sheets: IdfSheetData[];  // mỗi sheet: id, name, doc: Doc, paperSheets?: Sheet[]
}
```

### 9.3 · KHÔNG chứa

- Prisma metadata (Project.id, member, task, notebook)
- 3D scene (là derived)
- Present deck (đó là `.idfp`)
- Component library (là `.idfc` rời hoặc localStorage)
- ProductSpec references (đi qua matId trong entity)
- Material assets (chỉ giữ matId)
- Version history NGƯỜI DÙNG SỬA (undo có, decision history không)
- Design decision / rejected alternatives

### 9.4 · Ai đọc / ai ghi / khi nào

**Ghi**: `CadSheets.tsx` (component đưa vào disk-sync qua `exportIdf`). Throttle ≥10s hoặc `⌘S`/`beforeunload`.

**Đọc**: `CadSheets.tsx` lúc mount — resolve với IDB cache.

**Stable IDs**: `IdfSheetData.id: string` — cuid.

**Schema/version**: `idfVersion: 2`. Có migration bảng v1→v2.

**Backward compatibility**: File `.idf` v1 mở được (migrate on load). File `.idf` v2 KHÔNG mở được trên app v1 (từ chối, lastImportError kể lý do).

**Integrity/checksum**: KHÔNG có.

**Embedded assets**: có `photos` field trong Doc (chưa kiểm chi tiết — nằm trong Doc).

**History/decision**: KHÔNG.

### 9.5 · Đối chiếu với vision "PORTABLE DESIGN STATE"

| Vision (Hoà nêu 19/08) | Thực tế `.idf` |
|---|---|
| Portable | ✅ File rời, chia sẻ được |
| Editable | ✅ JSON, đọc được |
| Versioned | ✅ v2, migration |
| Contains geometry | ✅ Doc.entities |
| Contains semantic metadata | 🟡 Doc chứa layer + entity metadata, không có ontology chung |
| Contains materials | 🟡 chỉ matId (không nhúng PBR) |
| Contains assets | 🟡 chỉ photo dataURL |
| Portable design STATE | 🟡 **CAD state only, không phải project state** |

**FACT**: `.idf` là **CAD project file**, không phải **IF project file**. Chưa có "IF project file" gộp mọi thứ.

---

## 10 · LOCAL-FIRST REALITY (§10)

**Đo bằng code (không chạy app):**

### 10.1 · Khi mất Internet

| Thứ | Còn hoạt động? | Evidence |
|---|---|---|
| Project mở | ✅ Còn (Prisma local SQLite) | `dev.db` local |
| CAD 2D vẽ | ✅ Còn (disk-sync `.idf` + IDB) | `disk-sync.ts` |
| 3D dựng (BuildRecipe) | ✅ Còn (là derived, tính client) | `lib/three/build-recipe.ts` |
| Present | ✅ Còn (`.idfp` + IDB) | `idfp.ts` |
| Library asset thô | ✅ Còn (`./uploads/` local) | `LibraryAsset.path` |
| Materials (ProductSpec) | ✅ Còn (Prisma local) | `ProductSpec` |
| `.idf` `.idfp` `.idfc` | ✅ Còn (file local) | (đã đọc) |
| Save/export PDF/PPTX/PNG | ✅ Còn (jsPDF/pptx-* local libs) | `lib/present-editor/export.ts` |
| **Ingest AI classify** | 🔴 CHẾT — cần NVIDIA `captionImage` | `from-photo.ts:195` |
| **Ingest mesh generation** | 🔴 CHẾT — cần fal Trellis | `from-photo.ts:209` |
| **Vitals chat AI** | 🟡 CHẾT nếu chỉ cloud NVIDIA; còn nếu có Ollama local | `lib/ai/text-tier.ts` (chưa đọc) |
| Grounded Render / Node AI | 🔴 CHẾT nếu cần fal/comfyui/sd | `lib/nodes/defs/grounded-render.ts` (chưa đọc chi tiết) |
| Node graph edit | ✅ Còn (edit + save local Prisma) |  |

### 10.2 · Khi AI provider biến mất

**Core còn hoạt động**: CAD · Present · 3D dựng · Save/export · Task board · Notebook (đọc, không embed mới) · BOQ · Material.

**Chết**: mọi tính năng AI generative (Grounded Render, Vitals chat cloud, Ingest classify photo, mesh generation, embed mới).

**Đúng nguyên tắc "AI biến mất thì core còn"** — có evidence.

**Nhưng**: Ingest photo → `.idfc` phụ thuộc AI hoàn toàn (`from-photo.ts:194-234`). Không có degrade path.

### 10.3 · Khi sang device khác

**Xuất hiện** (đã sync qua Prisma):
- Project metadata
- Task
- Notebook chunks
- LibraryAsset metadata (nhưng file binary ở uploads local, cần copy)
- Flow.graphJson

**MẤT**:
- BOQ overrides (IDB per browser)
- Kho `.idfc` studio (localStorage)
- Brand Kit (localStorage)
- Preferences (~15 localStorage keys)
- IndexedDB autosave (sheets)
- FileSystemDirectoryHandle (mất — phải chọn lại thư mục)

**Khác version**:
- `.idf` / `.idfp` local — sync qua đâu? Prisma? Không. **File local per machine.**

**FACT**: IF **CHƯA phải local-first sync-ready**. Là local-first single-device. Multi-device chưa giải.

Bản đồ tay 18/08 §5.2 nợ #1 xác nhận: *"CAD .idf tách rời DB — vỡ multi-device"*.

### 10.4 · Phân loại

| Domain | Category |
|---|---|
| CAD 2D · Present · 3D dựng · Task · BOQ · Material spec | **LOCAL-CAN-RUN** offline |
| Project metadata · Notebook (read) · Library (read) | **LOCAL-CAN-RUN** |
| Ingest photo · Vitals cloud · Grounded Render · Node AI | **CLOUD-DEPENDENT** |
| Vitals local (Ollama) | **LOCAL-FIRST** (nếu Ollama) |
| Multi-device sync | **UNKNOWN** — chưa giải |

---

## 11 · RESTART / LOSS ANALYSIS (§12)

**Trace bằng code, không phá data thật.**

### 11.1 · Restart app

**Reconstruct được** (từ persist surface ①②③⑤):
- CAD sheets (từ `.idf` file + IDB)
- Present deck (từ `.idfp` + IDB)
- Prisma domains
- DNA cards (file JSON server)

**Mất** (chỉ runtime):
- 19 Zustand stores (nếu không hydrate từ persist)
- Vitals UI conversation state (`useVitalsUi` runtime only)
- Save status (`useSaveStatus` runtime only)
- Presence (`useProjectPresence` runtime, TTL 12s)

### 11.2 · Clear localStorage

**Mất**:
- Kho `.idfc` studio (`if.library.idfc.v1`)
- Workspace + AI tier + oneAI config (`interiorflow.*`)
- Theme/Lang
- Resume state (chặng dở lúc thoát)
- Tour done + coachmark + stage intro
- Idle minutes
- Last user
- Gallery items (chưa xác nhận key)
- Brand Kit

**Còn**:
- CAD `.idf` + IDB autosave (surface ①②)
- Present `.idfp` + IDB
- Prisma domains
- File `./uploads/` + DNA cards

### 11.3 · Mất filesystem local (`.idf`, `.idfp`, `./uploads/`)

**Đo tại §8.5**:
- Metadata project + task + node graph + notebook + LibraryAsset metadata + ProductSpec → còn qua Prisma
- Nhưng CAD sheets, Present deck, DNA cards, file assets → **MẤT**

**Phần còn lại KHÔNG đủ để reconstruct project.**

### 11.4 · DB không có nhưng `.idf` còn

**Không mở được với UI hiện tại.** Vì:
- CadSheets.tsx cần `userId` (từ Prisma User)
- Không có Project.id → route `/projects/[id]` chết
- Nhưng file `.idf` chỉ chứa CAD sheets, không có Prisma

**Muốn dùng lại**: phải khởi tạo Prisma project mới + import file `.idf`. `importIdf` chấp nhận string JSON → parse được.

### 11.5 · AI provider không dùng được

**Đo tại §10.2** — core còn, AI generative chết. Nhưng KHÔNG bị "core cũng chết":
- App bootstrap không phụ thuộc AI
- Save/read `.idf` không phụ thuộc AI
- Prisma không phụ thuộc AI

**Nguyên tắc OS 18/08 §1 (Core hoạt động khi AI mất) — TUÂN**.

---

## 12 · DECISION / HISTORY REALITY (§13)

**Câu hỏi Hoà**: IF hiện có phân biệt được: AI GENERATED → HUMAN MODIFIED → SELECTED → REJECTED → APPROVED → CLIENT APPROVED không?

**FACT**:

| Level | Có / Không | Evidence |
|---|---|---|
| **Undo history** | ✅ (CAD, có `commands` với undo) | `lib/cad/commands.ts` (chưa đọc chi tiết) |
| **Command history** | ✅ (rải rác — nhiều store có `history` field?) | Chưa kiểm |
| **Version history file** | ✅ CAD (`meta.modifiedAt` mỗi export), Flow (`FlowVersion[]` snapshot mỗi Run) | `schema.prisma:FlowVersion` |
| **Project version history** | 🔴 KHÔNG có "project version" chung | (không tìm được model) |
| **AI Generated vs Human Modified flag** | 🟡 CÓ nhưng chỉ ở `.idfc` from-photo (cờ `measured/inferred/verified`) và `MaterialPbr.suyDoan` | `from-photo.ts:34-42`, `rna/types.ts:11-13` |
| **Selected vs Rejected alternatives** | 🔴 KHÔNG có model | (không tìm được) |
| **Approved vs Client Approved** | 🔴 KHÔNG có model DesignDecision | (không tìm được) |

**HISTORICAL DECISION** trong 00-CHOT: "AI GENERATES → DESIGNER MODIFIES → IF LEARNS THE DELTA" là VISION, chưa implement.

**Phân loại**: **C — ARCHITECTURAL GAP**. Có non-destructive edit (Undo + BuildRecipe stack + `.idf` per-save), KHÔNG có Decision persistence.

**Không được gọi Undo = Creative Timeline** (Hoà cấm). Undo là edit history, Creative Timeline theo vision là DECISION history. Khác nhau.

---

## 13 · DESIGN DNA REALITY (§14)

### 13.1 · Input DNA đang học từ gì?

**Đọc `lib/dna/store.ts` + `lib/distill/engine.ts`**:

**Input** (`DistillEngine.distill(sources, specs)`):
- `sources: readonly ProvenanceInput[]` — bất kỳ nguồn nào có provenance
- `specs: readonly DistillFieldSpec<TField>[]` — field cần chưng cất

**FieldExtractor**: rút giá trị ứng viên từ 1 nguồn. **KHÔNG được đoán/bịa trong hàm này** (comment `engine.ts:20-22`).

**Kết quả**: mọi trường không đóng góp → `emptyField()`. ≥1 đóng góp → `'inferred'` (chờ người duyệt).

**Từ 00-CHOT 12/08 group-by (comment `engine.ts:7-8`) — 3 mặt tiền**:
1. Thẻ DNA (Design DNA card per project)
2. Auto-define cấu kiện
3. Company DNA Pack

**FACT**: DistillEngine là GENERIC engine, không biết gì về Thẻ DNA. Bản đồ tay 18/08 xác nhận đúng "cụm đẳng cấu §9".

### 13.2 · Output DNA tạo ra cái gì?

**FACT**: `DistilledField<string>` với `values[]` + `trangThai: 'inferred'|'verified'` + `nguon: string[]` (source IDs).

KHÔNG có: embedding, preference profile, rules, prompt context, ranking, weights.

**Phân loại**: **C — ARCHITECTURAL GAP** — Vision Hoà nêu (ranking/weights) chưa có.

### 13.3 · Persistence

**File JSON server**: `uploads/dna/<projectId>/cards.json`.

**Server-only** (fs/promises, không tự đụng client).

Route: `/api/projects/[id]/dna`.

**KHÔNG dùng Prisma**. Comment `dna/store.ts:2-3`: *"KHÔNG BẢNG DB MỚI (phiếu ④.3, CẤM tuyệt đối sửa `prisma/schema.prisma`)"*.

### 13.4 · Scope

**CHỈ Project** (`fileFor(projectId)`).

**KHÔNG có**: Person DNA, Client DNA, Studio DNA, Global DNA.

**Phân loại**: **C — ARCHITECTURAL GAP** so với vision.

### 13.5 · Learning signal (generated vs corrected)

**Đo**: `DistilledField.trangThai` chỉ có 2 nấc `inferred`|`verified`. Không có nhãn "corrected" trong `types.ts` (chỉ giả định từ `dna/types.ts` — chưa đọc chi tiết file này).

Cờ 3 nấc `measured|inferred|verified` **CÓ** ở `from-photo.ts:34-35` cho ProvenanceFlag → nhưng đó là cấu kiện, không phải DNA card.

**KHÔNG có "delta learning"**. Người correction rồi thì máy KHÔNG biết delta.

**Phân loại**: **C — ARCHITECTURAL GAP** — Vision "IF LEARNS THE DELTA" chưa implement.

---

## 14 · MASTER LIBRARY — RECOVERED VISION (§15)

### 14.1 · Historical decisions từ 00-CHOT

**Trích nguyên văn** (00-CHOT.md, có trong system prompt context):

| Ngày | Nguồn | Câu chốt |
|---|---|---|
| 02/08 | `SPEC-MODE-PER-STAGE.md §3` | *"Master Library (cửa hàng, chứa Thư viện Template) — hạ tầng XUYÊN 3 chặng"* |
| 07/08 chiều | `SPEC-STAGE-LIBRARIES.md` | *"Kệ Thư viện theo chặng: 1 Master Library, kệ **tự lọc theo chặng**"* |
| 10/08 | Hoà chốt | *"Master Library có 2 mặt: trang tổng là gallery/collection; trong mỗi chặng là sidebar hai nấc tự lọc theo ngữ cảnh + nút nhập từ Kho chung"* |
| 07/08 khuya | `00-CHOT §11` | *"MỌI THỨ TRONG THƯ VIỆN ĐỀU LÀ `.idfc`... như vậy mới liên kết mật thiết với nhau, và đúng tinh thần dữ liệu linh hoạt"* |
| 07/08 khuya | `00-CHOT §11.2` | *"VỎ CHUNG + RUỘT THEO LOẠI — meta chung, body discriminated union theo kind"* |
| 07/08 khuya | `00-CHOT §11.4` | *"HAI TRỤC PHÂN LOẠI: ① `meta.kind` (nó là cái gì) — 6+6 = 11 loại · ② BlockGroup (dùng ở đâu) — 10 nhóm phòng"* |
| 08/08 | `00-CHOT` | *"⭐ v3 IDFC — thêm kind `preset`"* |
| 16/08 | `00-CHOT` | *"Master Library có 2 cấp — cấp DỰ ÁN (Thẻ DNA) + cấp STUDIO — chưng cả gói áp cho nhiều dự án. Đúng cụm đẳng cấu §9"* |

### 14.2 · Vision đã CHỐT

Master Library = **cửa hàng thư viện studio + template**, có:
- Kệ theo chặng (tự lọc theo ngữ cảnh)
- 2 mặt: trang tổng gallery + sidebar hai nấc
- Mọi thứ là `.idfc` (cùng format duy nhất)
- Vỏ chung + ruột theo loại
- 2 trục phân loại: kind × BlockGroup

### 14.3 · Đã implement bao xa

**FACT** (đọc code):

| Vision | Implement? | Evidence |
|---|---|---|
| Mọi thứ là `.idfc` | ✅ v3, 12 kind | `idfc.ts` |
| Vỏ chung + ruột theo loại | ✅ discriminated union | `idfc.ts:151-180` |
| Migration versioned | ✅ v1→v2→v3 | `idfc.ts:263-266` |
| Kệ theo chặng | ✅ `lib/library/shelves.ts` (đã có shelves definitions từ `.ua/`) | `.ua/knowledge-graph.json` batch 23 |
| Trang tổng gallery | 🟡 CÓ `/library/gallery` route, chưa kiểm chi tiết | Bản đồ tay 18/08 §4 route |
| Sidebar hai nấc | 🟡 Có `components/library/library-sheet-css.ts` — chưa kiểm chi tiết | (out of scope) |
| Nhập từ Kho chung | ✅ BulkIngest → `idfc-store.ts` | `idfc-store.ts:2-6` |
| Sync studio scope | 🔴 CHỈ localStorage per browser | `idfc-store.ts:17` |
| Kho 3 tầng (chung/studio/dự án) | 🟡 KHAI CỘT `ProductSpec`, CHƯA CODE cho global | `schema.prisma:ProductSpec` |
| Cấp Studio DNA (Company DNA Pack) | 🔴 CHỈ khai concept, chưa implement | `engine.ts:7-9` |

**Phân loại**: **C — ARCHITECTURAL GAP** cho phần chưa implement. Vision đã chốt rõ. Code đi đúng hướng nhưng chưa hoàn thành phần server-level + Studio scope + Company DNA.

---

## 15 · FILE MANAGER — RECOVERED VISION (§16)

### 15.1 · Historical decisions từ 00-CHOT

| Ngày | Nguồn | Câu chốt |
|---|---|---|
| 02/08 | `SPEC-MODE-PER-STAGE §3` | *"File Manager (chợ đầu mối)"* |
| 16/08 | Hoà chốt | *"⛔ BỎ nghĩa 'CHỢ ĐẦU MỐI'. File Manager thu lại thành PHẦN THÔ của thông tin — chưa đủ để tạo sinh hình ảnh; là một mục của File; chứa thông tin chưng cất của hệ thống, của NHIỀU NGƯỜI DÙNG"* |
| 17/08 | Hoà chốt | *"Files có HAI NGĂN khác BẢN CHẤT: ① tệp của dự án này · ② phần thô DÙNG CHUNG, nhiều người góp (map texture · nhà cung cấp · range giá)"* |
| 17/08 tối | Hoà chốt | *"Files có hai TẦNG: tầng ① thư mục hệ thống 5 loại có quyền (Dự án · Studio · NCC · Đã duyệt · Lưu trữ) + tầng ② Collection+ 8 gói component"* → **CẤU TRÚC HAI TẦNG THAY HAI NGĂN** |

### 15.2 · Vision đã CHỐT (bản mới nhất 17/08)

File Manager = **Files**, có **HAI TẦNG**:
- **Tầng ① — 5 loại thư mục hệ thống**: Dự án · Studio · Nhà cung cấp · Đã duyệt · Lưu trữ
- **Tầng ② — Collection+ 8 gói component**: Vật liệu · Furniture · Chi tiết điển hình · Cây·người · Design DNA · Gói học từ dự án · Mẫu trình bày · Cách làm

### 15.3 · Đã implement bao xa

**FACT** (đọc code + .ua/):

| Vision | Implement? | Evidence |
|---|---|---|
| Files có route `/files` | ✅ | `app/files/` |
| 5 loại thư mục hệ thống | 🔴 Chưa có bằng chứng — cần kiểm `components/files/` (out of scope audit) | (unknown) |
| Collection+ 8 gói | 🔴 Chưa có bằng chứng | (unknown) |
| Real filesystem access | ✅ `lib/filemanager/real-fs.ts` | grep FileSystemHandle |
| Nhà cung cấp (NCC) — phần thô dùng chung | 🔴 Chưa có model DB "Supplier" — bản đồ tay 18/08 §1.2 xác nhận 0 model | `schema.prisma` |

**Phân loại**: **C — ARCHITECTURAL GAP**. Vision chốt 17/08 (mới) chưa implement kịp.

---

## 16 · MASTER LIBRARY ↔ FILE MANAGER (§17)

**Câu hỏi trọng tâm Hoà**:

### 16.1 · Một file được đưa vào IF...

Trace pipeline theo code:

```
IMPORT (user upload)
  → /library/ingest UI
  → POST /api/library/ingest
  → LibraryAsset created (Prisma)
    · id = cuid
    · path = ./uploads/<random>
    · palette + caption sinh tự động qua idmask/VLM

CLASSIFICATION (nếu ảnh)
  → gu-features.ts trích features
  → refingest.ts với STORE_KEY (localStorage)

INGEST (nếu là `.idfc`)
  → BulkIngestMode UI
  → importIdfc(json) → ParsedIdfc
  → saveIdfcItems(items) → localStorage `if.library.idfc.v1`
  → LibrarySheet đọc ra hiện thật

PROJECT USE
  → CAD/Present drag từ LibrarySheet
  → BlockEntity.specId = idfc.meta.id (FK MỀM)
```

### 16.2 · Trả lời 11 câu hỏi Hoà (§17)

| # | Câu hỏi | Đáp |
|---|---|---|
| 1 | Ban đầu thuộc ai? | `LibraryAsset.userId` (Prisma) |
| 2 | Có nằm trong project Files? | ❓ — `LibraryAsset` KHÔNG có `projectId` field. Là user-scope, không project-scope. **UNKNOWN** — có thể có project-tie qua khác (chưa kiểm) |
| 3 | Khi nào trở thành Library asset? | Ngay lúc `POST /api/library/ingest` |
| 4 | Copy hay reference? | **File COPY** vào `./uploads/`, `path` trỏ vào (không reference file gốc) |
| 5 | Canonical ID? | ✅ `LibraryAsset.id` cuid, dẫn xuất `img_<cuid>` via `imgIdFromKey` (`schema.prisma:LibraryAsset:` comment Task #19) |
| 6 | Deduplicate? | ❓ **UNKNOWN** — chưa tìm được logic dedupe. Có thể là hash-content không? |
| 7 | File source đổi thì asset đổi? | ❌ Không — file đã copy vào `./uploads/`, không watch source |
| 8 | Project xóa thì Library asset còn? | ✅ Còn — `LibraryAsset` không có `projectId` FK (không cascade) |
| 9 | Library asset được nhiều project dùng → ownership? | `LibraryAsset.userId` — user-scope, không có ownership tracking cross-project |
| 10 | Generated asset có được promote vào Library? | ✅ — job output ảnh tự tạo `LibraryAsset` (chưa kiểm chi tiết `/api/jobs/`) |
| 11 | Imported vs generated khác provenance? | 🟡 `LibraryAsset.usage: string` phân biệt (`ref-render` · `slide` · `material` · `layout` · `cad` · `brief`) — nhưng KHÔNG phân biệt "human upload" vs "AI generated" trong field riêng |

**Kết luận**: File Manager (Files) và Master Library **chồng semantics** — file đưa vào `./uploads/` là LibraryAsset (một mục Library) NGAY LẬP TỨC. Không có phase "raw file → curated library".

Vision 17/08 nói: *"Files chứa PHẦN THÔ chưa đủ tạo sinh"* — thực tế **CHƯA IMPLEMENT** distinction đó. Files hiện tại = LibraryAsset immediate.

**Phân loại**: **E — TERMINOLOGY / OWNERSHIP AMBIGUITY** + **C — ARCHITECTURAL GAP**.

---

## 17 · MATERIALS RELATIONSHIP (§18)

### 17.1 · Materials là gì trong code

**Ba mảnh** (bản đồ tay 18/08 §1.3 đo đúng):

1. **Thị giác** — `lib/materials/schema.ts` `MaterialPbr` (14 thông số PBR chuẩn glTF)
2. **Thương mại** — `ProductSpec` (Prisma): brand, sku, priceVnd, wastagePercent, ...
3. **2D symbol** — `lib/cad/materials.ts` `MaterialDef` (hatch, color, tones)

**Đây có phải "một vật ba mặt"?** — VISION có (00-CHOT chốt "vật liệu một vật ba mặt" nhiều lần). **THỰC HIỆN**: có dây `matId = ProductSpec.sku` (`idfc.ts:137`) nối `.idfc` ↔ `ProductSpec`.

### 17.2 · `lib/materials/resolve.ts:52` — trả về đủ ba mặt

Từ báo cáo /understand đêm 19/08 (mục 3.1): *"`lib/materials/resolve.ts:52` `getMaterial()` **có thật** từ 07/08 (commit `ad2d23b`, 3.070 byte), trả **đủ ba mặt** PBR·thương mại·hatch 2D, khoá nối `matId = ProductSpec.sku`, có 5 ca test. **NHƯNG grep toàn repo: 0 nơi gọi ngoài chính test của nó**"*.

**Phân loại**: **C — ARCHITECTURAL GAP** — có engine (resolve.ts), chưa CẮM ĐIỆN. Bản đồ tay 18/08 xác nhận đúng.

### 17.3 · Materials là một collection trong Library?

**FACT**: `IdfcKind` có 12 giá trị, `'material'` là 1 trong 12. Nên **`material` là một KIND trong `.idfc`**. Kho `.idfc` studio (`if.library.idfc.v1` localStorage) chứa được cả `material` lẫn 11 loại khác.

Vision 10/08: *"Materials khác Master Library thế nào?"* — Answer: **Materials là một KIND của `.idfc`, và `.idfc` là format của Master Library**. Nên Material ⊂ `.idfc` ⊂ Master Library.

**Nhưng**: `MaterialPbr` (schema.ts) là kiểu KHÁC — nằm ở `lib/materials/`, không chỉ trong `.idfc`. Còn `ProductSpec` là Prisma model độc lập. Có **CHỒNG CHÉO**.

**Phân loại**: **E — TERMINOLOGY / OWNERSHIP AMBIGUITY** — Material vừa là type `.idfc` vừa là schema riêng vừa là Prisma model.

### 17.4 · ProductSpec đóng vai gì?

**FACT** (`schema.prisma:ProductSpec`):
- Prisma model canonical cho **material + furniture + lighting + millwork + fixture** (5 kind — không đủ 6 SELLABLE_KINDS)
- Sync qua Larkbase (`larkRecordId`)
- Số thật `priceVnd Decimal`, `wastagePercent Decimal`, `packagingSpec`
- Comment 2.1.9.r (30/07): *"ProductSpec{kind:'material'} đã là 1 bảng duy nhất theo Q-L2 trước đó, thêm field còn thiếu thay vì tạo bảng cạnh tranh"*

**Nên**: ProductSpec = **kho phần thương mại** của material/furniture/... — không cần AtlasMaterial riêng.

### 17.5 · Colors là gì?

**FACT** (chưa đọc `lib/colors/store.ts`): 
- Bản đồ tay 18/08 §4 gợi ý `/colors` route redirect về Library sheet (nhóm Materials)
- Colors có thể là attribute của material (`ProductSpec.colorHex`) hoặc filter (chọn palette) hoặc surface (bảng màu Pantone/RAL nạp packs)

**UNKNOWN** — cần đọc `lib/colors/store.ts` để chốt.

---

## 18 · IDFC — RECOVERED DEFINITION (§19)

### 18.1 · IDFC là gì (từ code + comment)

**FACT** (`idfc.ts:2-3`, chốt 07/08 khuya):
> *"lib/cad/idfc.ts — định dạng `.idfc`: MỘT tệp = MỘT MẪU THƯ VIỆN (chữ C đọc là **CONTENT** từ chốt 07/08 khuya — không còn là Component; giữ nguyên phần mở rộng tệp, chỉ đổi nghĩa trong sổ)"*

**Nghĩa**: `.idfc` = **content item** trong Master Library — một mẫu, có thể là cấu kiện · vật liệu · mẫu trang · video · brand kit · preset · v.v.

Không phải "component" theo nghĩa hẹp (không chỉ đồ vật lý).

### 18.2 · Định nghĩa acronym

**FACT** (từ comment 07/08 khuya + 08/08):
- Chữ **"C"** đọc là **CONTENT** (đổi nghĩa 07/08, phần mở rộng tệp giữ nguyên)
- Trước đó gọi "Component" nhưng đã đổi
- "I" và "D" và "F" — 00-CHOT KHÔNG có định nghĩa nguyên văn cho các chữ khác. **UNKNOWN** — không đoán acronym nếu không có bằng chứng.

Nhiều khả năng: **I**nterior**D**esign**F**low**C**ontent, nhưng KHÔNG có evidence khẳng định.

### 18.3 · Phân loại

- KHÔNG phải: format khác, container.
- LÀ: **normalized design asset** (đúng — cùng vỏ meta, ruột theo type)
- LÀ: **canonical asset** trong Master Library (đúng — một mẫu = một `.idfc`)
- LÀ: **interchange format** (đúng — file rời, chia sẻ được, versioned migration)
- LÀ: **multi-representation design object** (đúng qua discriminated union — component có `geom2d + geom3d`, material có `pbr + hatch2d`)
- **CÓ THỂ** là: scene fragment (nhưng chưa có nhiều evidence — `.idfc` chứa MỘT vật, không phải cả scene)

---

## 19 · IDFC CONTAINS WHAT (§20)

Bảng đầy đủ từ `idfc.ts`:

| Property | Có? | Location trong `.idfc` |
|---|---|---|
| Source asset (raw file gốc) | 🟡 | Không có field — có `sourceImageUrl` trong `xFromPhoto` extension (`from-photo.ts:147`) |
| Semantic identity | ✅ | `meta.name` + `meta.code` + `meta.id?` |
| Geometry 2D | ✅ (chỉ component/material) | `body.geom2d` hoặc `body.symbol2d` (material) |
| Geometry 3D | 🟡 (không mesh; chỉ tham số) | `body.geom3d {heightMm, bevelMm, matId, pbr?}` — không lưu mesh rời |
| 2D representation | ✅ | `body.geom2d` |
| 3D representation | 🟡 (parametric, không mesh) | `body.geom3d` |
| Presentation representation | 🔴 | Không có "presentation" body type. `page` type có `slide: Record<string, unknown>` (K4, chưa consumer thật) |
| Material | ✅ (nếu kind material) | `body.pbr: MaterialPbr` |
| Texture | 🟡 | Bên trong `MaterialPbr` (`lib/materials/schema.ts` — chưa đọc) |
| Preview thumbnail | 🔴 | Không có `preview` field trong meta. Có `lib/library/thumb-kinds.ts` sinh preview riêng |
| Metadata | ✅ | `meta` block |
| Provenance | 🟡 | `meta.sourceLibraryId?` (chỉ display) + `xFromPhoto` extension với `flag: 'inferred'\|'verified'\|'measured'` cho từng field |
| Transforms | 🔴 | Không lưu trong `.idfc` — bản chèn giữ trong Doc |
| Bounding box | 🟡 | `geom2d.w × geom2d.h`, `geom3d.heightMm` |
| Dimensions | ✅ | `geom2d.w, h` + `geom3d.heightMm` |
| Category | ✅ | `meta.kind` (12 giá trị) + `geom2d.group` (BlockGroup 10 phòng) |
| AI interpretation | 🟡 | `xFromPhoto.classification` (từ VLM), `xFromPhoto.mesh` (từ fal Trellis) — extension, không core |
| Confidence | 🟡 | `xFromPhoto` cờ `inferred\|verified\|measured` — extension |
| Source history | 🟡 | `xFromPhoto.source` (URL/model+requestId) — extension |
| Stable identity | ✅ | `meta.code` (không đổi theo file, dùng làm upsert key `idfc-store.ts:41`) + `meta.id?` (id kho) |
| Version | ✅ | `idfcVersion: 3` file-level |
| Migration | ✅ | v1→v2→v3, `IDFC_MIGRATIONS` bảng |
| Checksum | 🔴 | Không |
| Standalone | ✅ | Toàn bộ tự chứa (không phụ thuộc registry `BLOCKS` của app đích, `idfc.ts:120-121`) |
| Linked | 🟡 | `matId` link tới `ProductSpec` (nếu có), `meta.sourceLibraryId?` |
| Embedded | 🟡 | Ảnh embedded dạng dataURL trong `asset.imageUrl` (data:) hoặc `xFromPhoto.mesh.glbUrl` |
| Có nằm trong `.idf`? | 🔴 | **KHÔNG**. `.idf` chỉ chứa Doc + entity với `BlockEntity.specId` (FK MỀM). `.idfc` là file RỜI |

---

## 20 · IDF VS IDFC (§21)

| Property | `.idf` | `.idfc` |
|---|---|---|
| Scope | Project CAD | 1 mẫu Thư viện |
| Project-level | ✅ | ❌ |
| Asset-level | ❌ | ✅ |
| Canonical identity | ❌ (là project instance) | ✅ (`meta.code`) |
| Portable | ✅ | ✅ |
| Editable | ✅ (Doc entities) | ⛔ 1 chiều (`idfc.ts:35` ràng buộc 1) |
| Versioned | ✅ v2 | ✅ v3 |
| Geometry | ✅ (Doc entities) | ✅ (geom2d + geom3d parametric) |
| Semantic metadata | 🟡 (layer + entity metadata; không ontology chung) | ✅ (meta.kind + BlockGroup) |
| Materials | 🟡 (chỉ matId) | ✅ (kind material full body) |
| Assets | 🟡 (chỉ photo dataURL) | ✅ (kind asset, brandkit) |
| 2D use | ✅ | ✅ (khi kind material/component/asset) |
| 3D use | 🟡 (derived scene) | ✅ (geom3d parametric) |
| Present use | ❌ (là `.idfp`) | 🟡 (kind page/video/doc/brandkit — K4 chưa hoàn thiện) |
| Contains other format | 🔴 | 🟡 (asset.imageUrl có thể là data URI GLB, mesh) |
| Source of Truth role | ✅ CAD project | ✅ Thư viện mẫu (1 chiều — read from) |

**FACT**: `.idf` và `.idfc` **không phải cùng loại vật** — `.idf` là project instance (có multiple sheet), `.idfc` là template/mẫu (1 mẫu = 1 file). Bản chất khác nhau: instance vs template.

---

## 21 · ASSET LIFECYCLE (§22)

### 21.1 · Một canonical object có tồn tại xuyên 2D/3D/Present không?

**FACT**: **KHÔNG có canonical object duy nhất**.

Có 3 vật khác nhau:
- **CAD entity** trong Doc (`.idf`) — có `id`, `layerId`, và optional `specId` (`BlockEntity.specId`)
- **3D mesh** sinh từ `docToObjScene(Doc)` — mesh runtime, không persist
- **Present slide element** — trong `EditorDeck.slides` (`.idfp`)

**Identity link giữa 3D**: qua `matId` (2D entity có matId → 3D mesh mang matId → Present bảng vật liệu tra matId)

**Nhưng KHÔNG có "asset X ở 2D, cùng asset X ở 3D, cùng asset X ở Present"** — mỗi chặng có object riêng.

**Ví dụ**: Chèn 1 ghế Volumen vào bản vẽ CAD → `BlockEntity` với `specId` trong Doc. Vào 3D → mesh sinh từ Doc via `docToObjScene`, cùng specId. Vào Present → bảng vật liệu tra `matId`, hiển thị ảnh ghế. **Nhưng ghế trong 3D không phải "cùng" ghế trong Doc** — nó là mesh derived, không có identity link.

**Phân loại**: **C — ARCHITECTURAL GAP** — Vision "một vật ba mặt" chưa có canonical identity xuyên chặng.

---

## 22 · ONE OBJECT — MULTIPLE REPRESENTATIONS (§22)

Trace: chọn 1 ghế `.idfc` Lincoln 327 → insert vào chặng 2D → dùng ở 3D → hiển thị trong Present.

### 22.1 · CAD 2D — insert `.idfc` → BlockEntity

Từ `idfc.ts:36-37`: *"Bản chèn giữ liên kết qua FK MỀM (`BlockEntity.specId`/`HatchEntity.specId` đã có sẵn trong `model.ts`)"*.

**Insert flow** (đoán từ code, chưa đọc chi tiết `lib/cad/library-item-resolve.ts`):
```
User drag `.idfc` Lincoln 327 từ LibrarySheet
  → BlockEntity {type, specId: idfc.meta.id, transform, ...}
  → Doc.entities.push(entity)
```

Ở đây `specId` = `idfc.meta.id` (FK MỀM tới kho `.idfc`).

**Chỉnh sửa tại chỗ**: `BlockEntity` có transform (rotation, scale, position). Không đổi `.idfc` gốc.

**Ràng buộc 1 (`idfc.ts:35`)**: KHÔNG có hàm ghi ngược từ bản chèn về `.idfc` gốc.

### 22.2 · 3D — derive từ Doc + BuildRecipe

`docToObjScene(Doc)` (chưa đọc chi tiết) — build mesh từ entities.

Cho `BlockEntity` với `specId`, mesh sinh từ:
- `body.geom2d.prims` (từ `.idfc`) — extrude với `body.geom3d.heightMm`
- `body.geom3d.matId` áp lên mesh

**KHÔNG có 3D "asset" persistent** — 3D là derived.

### 22.3 · Present — chọn ảnh/render, tra `matId`

**Present dùng LibraryAsset** (ảnh render) — không phải `.idfc` trực tiếp. Slide element `ImageElement` có `src` (dataURL trong `.idfp` hoặc URL LibraryAsset).

Bảng vật liệu Present tra `matId` — qua `ProductSpec`.

### 22.4 · Identity continuity

**FACT**: Identity qua `specId` (Doc → Doc chứa specId — nếu insert same `.idfc` nhiều lần thì cùng `specId`). Identity qua `matId` (entity → material spec).

**Nhưng KHÔNG có "canonical Object X"** đứng ngang hàng với 3 representations. Chỉ có dây link qua id.

**Nếu Doc.entity với `specId` A bị xoá** → 3D mesh mất → Present tra `matId` vẫn được (còn qua LibraryAsset).

**Phân loại**: **C — ARCHITECTURAL GAP** — dây link qua id, không có canonical.

---

## 23 · IDFC → 2D (§23)

`.idfc` **giữ live-reference** (`specId`) qua FK MỀM — KHÔNG convert thành dữ liệu mới.

**Chèn**: 
- Insert entity với `specId = idfc.meta.id`, transform mặc định
- Nếu component: entity type = 'block', geom2d.prims được reference (không copy vào entity)
- Nếu material: đổi Doc via `HatchEntity.specId`

**Preview**: `.idfc` có thumbnail sinh runtime (chưa kiểm chi tiết `lib/library/thumb-kinds.ts`).

**Explode** (nếu có): UNKNOWN — không tìm được explode trong idfc.

---

## 24 · IDFC → 3D (§24)

**Instantiate**: `.idfc` KHÔNG được instantiate trực tiếp trong 3D. Vào 3D qua Doc → docToObjScene.

**Mesh**: derive từ `body.geom2d.prims` + `body.geom3d.heightMm` (chỉ parametric, không lưu mesh rời).

**Material**: `matId` → resolve qua `getMaterial()` → PBR + hatch + thương mại (nhưng resolve.ts chưa CẮM ĐIỆN — §17.2).

**BuildRecipe**: `.idfc` KHÔNG mang BuildRecipe — recipe là thuộc Doc/scene level.

**Identity link**: qua `specId`. `.idfc.meta.id` = `Doc.entities[].specId` (FK MỀM).

---

## 25 · IDFC → PRESENT (§25)

**FACT**: `.idfc` KHÔNG được dùng trực tiếp trong Present.

Present dùng:
- LibraryAsset (ảnh, render) — qua Prisma DB
- Bảng vật liệu — qua matId → ProductSpec

`.idfc` kind `page` có `body.slide: Record<string, unknown>` — nhưng comment K4 (`idfc.ts:151-156`): *"CHƯA có producer/consumer thật cho payload chi tiết (mẫu trang sống trong deck editor p12)"*.

**Nghĩa**: Present chưa dùng `.idfc` kind `page` thật. Present dùng ảnh + LibraryAsset + Prisma material.

**Phân loại**: **C — ARCHITECTURAL GAP** — Vision "mọi thứ trong thư viện là `.idfc`" chưa hoàn thành cho page/video/doc/brandkit.

---

## 26 · IDENTITY CONTINUITY (§25 tiếp)

**FACT**: Present dùng canonical design object hay chỉ output pixels?

Present dùng:
- **Output pixels** (ảnh, render, thumbnail) là chính
- **Reference qua matId** (bảng vật liệu)
- **KHÔNG** có "canonical scene object" từ 2D/3D

Bản đồ tay 18/08 §3.4: *"Chưa có Creative Timeline: FlowVersion chỉ có graphJson + createdAt — không ghi vì sao đổi B1 → B2, không có Direction A/B/C rejected."*

**Xác nhận đúng**. Không có `DesignDecision` model.

---

## 27 · FORMAT ADAPTATION (§26)

**Câu hỏi Hoà**: "Một dữ liệu gốc được giữ thế nào và được định dạng phù hợp cho từng chặng ra sao?"

### 27.1 · Architecture hiện tại

```
SOURCE (raw file người dùng upload)
   ↓
[Không có NORMALIZE step chính thức]
   ↓
LibraryAsset (Prisma) + ./uploads/ (COPY file)
   ↓
(Ngã 3)
   ├→ Chặng 2D: refingest → gu-features → BlockEntity/HatchEntity
   ├→ Chặng 3D: LibraryAsset.usage='ref-render' → grounded render/moodboard
   └→ Chặng Present: LibraryAsset URL trực tiếp
```

**Không có "canonical asset" step** giữa SOURCE và các chặng. Mỗi chặng đọc thẳng từ LibraryAsset + tự interpret.

### 27.2 · Vision đối chiếu

Vision Hoà (§26):
```
SOURCE → NORMALIZE → CANONICAL ASSET → STAGE ADAPTERS (2D/3D/PRESENT)
```

**FACT**: chưa có NORMALIZE step. LibraryAsset ≈ canonical asset **cho ẢNH THÔ** (một bảng, mọi chặng đọc), nhưng KHÔNG có adapter chuẩn chuyển thành entity 2D/3D/present.

Ingest photo → `.idfc` (`from-photo.ts`) là adapter DUY NHẤT hiện có, chỉ cho **1 chiều: raw photo → `.idfc` furniture** — không tổng quát.

**Phân loại**: **C — ARCHITECTURAL GAP**.

---

## 28 · INGEST PIPELINE (§27)

### 28.1 · Nhận gì

**FACT** (chưa đọc `/library/ingest` UI chi tiết — grep):
- File types: PDF · ảnh (JPG/PNG/WEBP) · DWG · IFC · GLB · `.idf` · `.idfc` · text · xlsx
- Metadata: LibraryAsset (name, category, tags, mime, palette, caption, w, h, content)

### 28.2 · Pipeline

**Trace từ code đọc được**:

```
UPLOAD (multipart form)
  → POST /api/library/ingest
  → save file vào ./uploads/<random>
  → detect format (lib/import/*, lib/dwg-import/*, lib/ffe-import/*)
  → LibraryAsset created (Prisma)

CLASSIFY (nếu ảnh — từ code /understand đã đọc batch 8):
  → refingest → gu-features
  → palette trích từ image
  → caption VLM tự động (nếu bật)

VLM CALL (nếu classify photo → .idfc):
  → captionImage() → NVIDIA VLM (from-photo.ts:195)
  → GỌI THẲNG, KHÔNG QUA GATEWAY (bản đồ tay OS 18/08 xác nhận đúng)

MESH GEN (nếu image → 3D):
  → fal Trellis (from-photo.ts:209)
  → FAL_KEY env
  → GỌI THẲNG

NORMALIZE:
  Nếu `.idfc` → importIdfc + saveIdfcItems (localStorage)
  Nếu `.dwg` → dwg parser → Doc
  Nếu ảnh → chỉ LibraryAsset

STORE:
  LibraryAsset (Prisma) + file ./uploads/
  `.idfc` studio kho: localStorage
  Prisma cho metadata
```

### 28.3 · Đủ vision?

| Vision | Có | Ghi chú |
|---|---|---|
| Nhận gì | ✅ | Nhiều format |
| Classify | ✅ | Palette + VLM caption |
| VLM | ✅ | NVIDIA (cloud) |
| Deterministic parsing | 🟡 | DWG có tất định; ảnh dùng VLM |
| AI provider | ✅ | NVIDIA, fal, comfyui |
| Metadata | ✅ | LibraryAsset |
| Geometry | 🟡 | Chỉ DWG/`.idfc`/`.idf` nhập được geometry |
| Material | 🟡 | Chỉ `.idfc` kind material đầy đủ |
| Preview | ✅ | Palette + thumbnail |
| IDFC output | 🟡 | Chỉ from-photo (1 pipeline duy nhất) |
| Reuse | 🟡 | Master Library sidebar |

**Kết luận**: Ingest có, nhưng KHÔNG generic. `.idfc` chỉ sinh từ 1 pipeline (photo → furniture). Các đường khác (DWG → `.idfc`, IFC → `.idfc`) chưa có.

**Phân loại**: **C — ARCHITECTURAL GAP** — Ingest hiện tại là point-solutions, không phải pipeline chuẩn hoá thành canonical asset.

---

## 29 · VISION / IMAGE / IDFC CURRENT ARCHITECTURE (§28)

### 29.1 · Vision pipeline

**FACT** (`from-photo.ts` + `lib/vision/` batch 23 /understand):
- `single-view-metrology.ts` — hình học đo từ 1 ảnh
- `hough-line.ts` — line detection
- `match-template.ts` — template matching
- `ortho-projection.ts` — chỉnh 2 điểm tụ
- `horizon.ts` — đường chân trời
- `to-cad.ts` — chuyển tới CAD

**FACT VLM**: `captionImage()` → NVIDIA cloud (`from-photo.ts:196`). KHÔNG có local VLM tại chỗ.

**FACT mesh**: fal Trellis (`from-photo.ts:209`). Cloud.

**FACT segmentation**: idmask (deterministic K-means), BiRefNet (nghiên cứu, chưa deploy). Grounded Render dùng SAM2 (bản đồ tay 18/08 §5.1 — bản mới hơn còn "vision-backbone-cuc-bo" chỉ trong registry, chưa build).

### 29.2 · Semantic object

**Chưa có "Scene" primitive chung** (bản đồ 18/08 §5.3 xác nhận). Có:
- `lib/cad/` — 2D entities (wall, door, room, ...)
- `lib/three/` — 3D mesh derive
- `lib/vision/` — metrology từ ảnh
- `lib/grounded-render/` — semantic regions (mask + phiếu ánh xạ mảng)

**KHÔNG có common Scene model** — mỗi mảng có primitive riêng.

**Phân loại**: **C — ARCHITECTURAL GAP** — Vision 19/08 nêu Scene primitive, code chưa có.

---

## 30 · SCENE-RELATED EXISTING PRIMITIVES (§29)

**Không implement Scene mới. Chỉ audit code hiện có:**

| Vision Scene component | Code hiện tại nào tương đương? | File |
|---|---|---|
| source | LibraryAsset (ảnh gốc) | `schema.prisma:LibraryAsset` |
| context | Doc.metadata + ProjectProfile | Doc |
| camera | Camera intent (chốt 10/08) — `lib/cad/campath.ts`, `cinematic-shot.ts` | batch 9 /understand |
| semantic regions | Grounded Render mask (nghiên cứu) + idmask palette | `lib/grounded-render/` batch 2 |
| objects | Doc.entities (2D) + LibraryAsset (ref) + `.idfc` (template) | 3 nơi khác nhau |
| spatial/depth | single-view-metrology depth (nghiên cứu) | `lib/vision/single-view-metrology.ts` |
| materials | ProductSpec + MaterialPbr + MaterialDef | 3 mảnh |
| appearance | Doc entity style + material | rải rác |
| confidence | ProvenanceFlag ở `from-photo.ts` (1 nơi) | không tổng quát |

**Kết luận**: Có mảnh, KHÔNG có Scene model chung.

**Phân loại**: **C — ARCHITECTURAL GAP**.

---

## 31 · TERMINOLOGY COLLISIONS (§30)

Bảng theo bản đồ tay 18/08 §5.3 + evidence bổ sung:

| Từ | Meaning A | Meaning B (nếu có) | Files sử dụng | Risk |
|---|---|---|---|---|
| **Gateway** | `lib/gateway/` — format router (định dạng file) | Vision "AI Gateway" (OS §3) | `lib/gateway/*` code · `docs/IF-KIEN-TRUC-OS.md` vision | HIGH — bản đồ tay 18/08 §5.3 #1 xác nhận |
| **Flow** | `Flow.graphJson` Prisma (node graph) | Vision "workflow ngành" (12 giai đoạn OS §4b) | `schema.prisma:Flow` · `useFlowStore` · `docs/IF-KIEN-TRUC-OS.md` §4b | HIGH — bản đồ 18/08 §5.3 #2 |
| **Stage** | UI chặng (`concept\|render\|present`) | Vision "phase ngành" (12 giai đoạn) | `Project.currentStage` · `lib/phases.ts` · `lib/stage-mode.ts` | HIGH — bản đồ 18/08 §5.3 #3 |
| **Phase** | 12 giai đoạn ngành (vision, chưa có model) | (chưa dùng trong code) | Vision only | LOW hiện tại, HIGH khi implement Phase model |
| **Library** | Master Library (Kho `.idfc`) | `LibraryAsset` (Prisma, file asset) | `lib/library/` · `schema.prisma:LibraryAsset` · `idfc.ts` | MEDIUM — chưa có collision code, có collision khái niệm |
| **Materials** | `.idfc` kind material | Prisma ProductSpec kind='material' | `lib/materials/` · `ProductSpec` · `idfc.ts` | MEDIUM |
| **Files** | Route `/files` (UI) | LibraryAsset (backend) | `app/files/` · `LibraryAsset` | MEDIUM |
| **Asset** | LibraryAsset (Prisma) | `.idfc` kind asset | 2 nơi khác | LOW |
| **Object** | Three.js Object3D | `.idfc` mẫu | 3D vs library | LOW |
| **Node** | React Flow node (chặng 2 canvas) | node in graph theory | `useFlowStore` | LOW |
| **Scene** | Three.js Scene | Vision "Scene primitive" | Three.js runtime vs vision | MEDIUM |
| **IDF** | `.idf` project CAD file | InteriorFlow (app name) | `lib/cad/idf.ts` vs app name | LOW |
| **IDFC** | `.idfc` content item (đọc "CONTENT" 07/08) | Trước kia là "Component" | Docstring 07/08 đổi nghĩa | LOW — đã đổi nghĩa chính thức |
| **Project** | Prisma Project | Filesystem project folder (root-folder handle) | `schema.prisma:Project` + `lib/root-folder.ts` | LOW |
| **Workspace** | Route/UI workspace | localStorage `interiorflow.workspace` | | LOW |

**KHÔNG rename trong audit này** (Hoà cấm).

---

## 32 · FINDINGS — A/B/C/D/E (§31)

**Mỗi finding**: ID · Classification · Domain · Claim · Evidence · Current Behavior · Risk · Confidence.

### F-A-01 · BOQ overrides persist per browser (Class A)

- **Domain**: BOQ / Materials
- **Claim**: BOQ overrides ghi vào IndexedDB per browser, trái luật 17/08 "vật là chung".
- **Evidence**: `boq-overrides.ts:2-14` + `boq-overrides-persist.ts`. Luật: 00-CHOT 17/08 §9 luật LƯU CHUNG↔MÁY.
- **Current behavior**: Người dùng đổi browser = mất BOQ đã sửa tay.
- **Risk**: HIGH — mất dữ liệu tiền thật.
- **Confidence**: HIGH.

### F-A-02 · `larkProjectCode` DEPRECATED, còn 13 file đọc (Class A)

- **Domain**: Project metadata
- **Claim**: Cột đã đánh dấu deprecated 07/08 nhưng chưa backfill sang ExternalRef.
- **Evidence**: `schema.prisma:Project:` comment.
- **Current behavior**: Song song hai bảng lưu cùng một thứ.
- **Risk**: MEDIUM — có kế hoạch, chưa nợ nguy hiểm.
- **Confidence**: HIGH.

### F-A-03 · AI provider gọi thẳng, không qua Gateway (Class A)

- **Domain**: AI Layer
- **Claim**: `from-photo.ts:195` gọi `NVIDIA_VLM_MODEL`, `from-photo.ts:209` gọi `FAL_KEY` trực tiếp. Trái nguyên tắc OS §5.1.
- **Evidence**: file:line ghi rõ.
- **Current behavior**: Đổi provider = phải sửa nhiều điểm.
- **Risk**: MEDIUM — chưa vỡ nhưng vỡ nguyên tắc Own your AI.
- **Confidence**: HIGH.

### F-B-01 · disk-sync `.idf`/`.idfp` contract SAFE (Class B)

- **Domain**: CAD + Present persistence
- **Claim**: `resolveSourceOfTruth` là contract rõ, có test, có docstring giải thích 4 nhánh.
- **Evidence**: `disk-sync.ts:44-60`.
- **Current behavior**: Cache < Nguồn contract tuân đúng.
- **Risk**: LOW.
- **Confidence**: HIGH.

### F-B-02 · Brand Kit snapshot trong `.idfp` (Class B)

- **Domain**: Present + Brand Kit
- **Claim**: Snapshot chủ đích khác live localStorage — cố ý để file mở lại đúng trạng thái lúc xuất.
- **Evidence**: `idfp.ts:20-27`.
- **Current behavior**: Snapshot và live tồn tại song song.
- **Risk**: LOW — cross-device studio kit chưa giải.
- **Confidence**: HIGH.

### F-B-03 · Task assigneeIds JSON là INTENTIONAL nhưng LOW-QUERY (Class B/A trung gian)

- **Domain**: Task
- **Claim**: `assigneeIds: String @default("")` là JSON string[] — cố ý không normalize (comment).
- **Evidence**: `schema.prisma:Task:assigneeIds`.
- **Current behavior**: Query "task của user X" phải parse JSON.
- **Risk**: MEDIUM — không scale.
- **Confidence**: HIGH.

### F-C-01 · Flow.graphJson ↔ useFlowStore không có SoT resolver (Class C)

- **Domain**: Node graph
- **Claim**: Không có `resolveSourceOfTruth`-tương-đương cho Flow như disk-sync có cho CAD/Present.
- **Evidence**: `schema.prisma:Flow` + `store.ts:335`. Bản đồ tay 18/08 §2.3.
- **Current behavior**: Đồng bộ tay giữa Zustand và Prisma.
- **Risk**: MEDIUM.
- **Confidence**: HIGH.

### F-C-02 · Kho `.idfc` studio là localStorage, không sync (Class C, tạm thời chủ ý)

- **Domain**: Master Library studio
- **Claim**: `if.library.idfc.v1` per browser. Vision "kho 3 tầng" chỉ mới khai cột `ProductSpec`.
- **Evidence**: `idfc-store.ts:8-10`, `schema.prisma:ProductSpec` comment 04/08.
- **Current behavior**: Studio scope = per browser.
- **Risk**: LOW hiện tại (chỉ TTT dùng), HIGH khi bán studio khác.
- **Confidence**: HIGH.

### F-C-03 · Design DNA chỉ Project scope (Class C)

- **Domain**: Design DNA
- **Claim**: `uploads/dna/<projectId>/cards.json` — chỉ project. Vision cần Person/Studio/Client/Project.
- **Evidence**: `dna/store.ts:21,49-54`.
- **Current behavior**: Không cross-project learning.
- **Risk**: HIGH so với vision, LOW hiện tại (dogfood 1 dự án).
- **Confidence**: HIGH.

### F-C-04 · Không có DesignDecision model (Class C)

- **Domain**: Decision history / Creative Timeline
- **Claim**: Vision "AI generated → Human modified → Selected → Rejected → Approved → Client approved" chưa có model.
- **Evidence**: Bản đồ tay 18/08 §3.4. Grep = 0.
- **Current behavior**: Undo cho edit, KHÔNG có decision persistence.
- **Risk**: HIGH so với vision (chưa vỡ vì chưa có ai dùng vẫn OK).
- **Confidence**: HIGH.

### F-C-05 · Materials resolve.ts CÓ MÀ CHƯA CẮM ĐIỆN (Class C)

- **Domain**: Materials
- **Claim**: `lib/materials/resolve.ts:52` `getMaterial()` trả đủ ba mặt, KHÔNG nơi gọi ngoài test.
- **Evidence**: bản đồ tay 18/08 §Đo được từ /understand (chi tiết ở entry mirror-completion, DF3 flow).
- **Current behavior**: 2D/3D/Present đọc 3 mảnh riêng biệt.
- **Risk**: MEDIUM — "một vật ba mặt" chỉ là intent, chưa thi công.
- **Confidence**: HIGH.

### F-C-06 · No canonical scene object xuyên chặng (Class C)

- **Domain**: Identity continuity
- **Claim**: 2D entity, 3D mesh, Present element không có canonical object chung.
- **Evidence**: §21, §22.
- **Current behavior**: Identity qua id links (specId, matId), không có "Object X" cross-stage.
- **Risk**: HIGH so với vision.
- **Confidence**: HIGH.

### F-C-07 · Ingest pipeline point-solutions (Class C)

- **Domain**: Ingest / Vision
- **Claim**: `from-photo.ts` là pipeline DUY NHẤT sinh `.idfc` từ raw. Không có pipeline generic.
- **Evidence**: §28.
- **Current behavior**: 1 flow cho furniture photo, không tổng quát.
- **Risk**: MEDIUM.
- **Confidence**: HIGH.

### F-C-08 · 19 Zustand store không có state authority (Class C, thiếu hierarchy)

- **Domain**: Runtime state
- **Claim**: 19 store rời rạc, không centralized.
- **Evidence**: §3.6.
- **Current behavior**: Mỗi component tự chọn store.
- **Risk**: LOW hiện tại, MEDIUM khi refactor.
- **Confidence**: HIGH.

### F-D-01 · Colors ownership (Class D)

- **Domain**: Colors
- **Claim**: KHÔNG đủ bằng chứng để định vị Colors thuộc materials hay riêng.
- **Evidence**: `lib/colors/store.ts` chưa đọc trong audit này.
- **Current behavior**: UNKNOWN.
- **Risk**: UNKNOWN.
- **Confidence**: LOW — cần đọc thêm.

### F-D-02 · Custom fonts, upscale cache (Class D)

- **Domain**: Present
- **Claim**: IDB stores chưa kiểm chi tiết.
- **Evidence**: `lib/present-editor/custom-fonts.ts`, `lib/present-editor/upscale-cache.ts` chưa đọc.
- **Risk**: LOW.
- **Confidence**: LOW.

### F-E-01 · Gateway trùng nghĩa (Class E)

- **Domain**: Terminology
- **Claim**: `lib/gateway/` (format) ≠ "AI Gateway" (OS §3). Rename cần cân nhắc.
- **Evidence**: §31 bảng.
- **Current behavior**: 2 nghĩa chồng.
- **Risk**: MEDIUM (khi thêm AI Gateway thật).
- **Confidence**: HIGH.

### F-E-02 · Flow trùng nghĩa (Class E)

- **Domain**: Terminology
- **Claim**: `Flow` (Prisma node graph) ≠ workflow ngành (12 giai đoạn OS).
- **Evidence**: §31 bảng.
- **Current behavior**: 2 nghĩa chồng.
- **Risk**: HIGH khi implement Phase.
- **Confidence**: HIGH.

### F-E-03 · Stage trùng nghĩa (Class E)

- **Domain**: Terminology
- **Claim**: `Stage` UI (`concept|render|present`) ≠ Phase ngành (12 giai đoạn).
- **Evidence**: §31 bảng.
- **Risk**: HIGH khi implement Phase.
- **Confidence**: HIGH.

### F-E-04 · Library ownership (Class E)

- **Domain**: Terminology + ownership
- **Claim**: LibraryAsset (Prisma) không có `projectId` — user-scope. Master Library scope studio/global. Chồng semantic.
- **Evidence**: `schema.prisma:LibraryAsset`.
- **Risk**: MEDIUM.
- **Confidence**: HIGH.

### F-E-05 · Materials 3 mảnh (Class E)

- **Domain**: Terminology + integration
- **Claim**: Material vừa là `.idfc` kind vừa là `MaterialPbr` vừa là `ProductSpec` Prisma.
- **Evidence**: §17.
- **Risk**: MEDIUM (resolve.ts chưa cắm điện).
- **Confidence**: HIGH.

**Tổng**: 3 A · 3 B · 8 C · 2 D · 5 E = **21 findings**.

---

## 33 · UNKNOWNS (§32)

| # | Chưa kiểm | Vì sao |
|---|---|---|
| U01 | `lib/colors/store.ts` shape | Chưa đọc trong audit, cần Read |
| U02 | `lib/present-editor/custom-fonts.ts` — font embedding contract | Chưa đọc |
| U03 | `lib/present-editor/upscale-cache.ts` — cache eviction | Chưa đọc |
| U04 | `lib/cad/auto-backup.ts` — backup strategy | Chưa đọc |
| U05 | `lib/root-folder.ts` — FileSystemDirectoryHandle persistence | Chưa đọc |
| U06 | `lib/ai/text-tier.ts` — tier resolve logic (Ollama/NVIDIA) | Chưa đọc |
| U07 | `lib/gateway/` shape — format detect (vs "AI Gateway") | Chưa đọc, bản đồ tay 18/08 ghi "format router" |
| U08 | LibraryAsset dedupe by content hash? | Không tìm được rõ |
| U09 | ExternalRef backfill status | Comment nói còn 13 file đọc `larkProjectCode` |
| U10 | Prisma migration lịch sử — có `assigneeIds` từng là relation không? | Không kiểm migration folder |
| U11 | Access-control M1 shape (`ProjectMember` role permissions detail) | Chưa đọc |
| U12 | Cross-tab BOQ overrides collision | Không có logic multi-tab, chỉ same-browser IDB |
| U13 | Node graph autosave — có phải qua REST không, hay realtime? | Chưa xác nhận |
| U14 | Server-side rendering vs client-only ranh giới | Chưa audit |
| U15 | `.ua/knowledge-graph.json` chính xác về function coverage? | LLM sinh, sample-check chưa full |

---

## 34 · HISTORICAL DECISIONS RECOVERED (§33)

Bảng tổng hợp historical decisions liên quan Q0/Master Library/File Manager/IDF/IDFC:

| Ngày | Decision | Nguồn |
|---|---|---|
| 26/07 | Local-first sync: thêm `rev`, `deletedAt`, `lastEditedBy`, `lastEditedDevice` vào Project/Flow/LibraryAsset | `schema.prisma:Project:` §"MỚI (26/07, local-first · IF-CORE-SCHEMA §1D/§2C)" |
| 28/07 | `IF-MASTER-BLUEPRINT.md` → đổi tên `IF-KIEN-TRUC.md` (bản đồ 18/08 §Mở đầu) | `docs/CLAUDE.md` |
| 30/07 | `ProductSpec` mở rộng cho BOQ (`unit`, `priceVnd Decimal`, `wastagePercent`, `packagingSpec`, `altSku`, `styleTags`) — không tạo bảng AtlasMaterial riêng | `schema.prisma:ProductSpec` comment 2.1.9.r |
| 31/07 (B2) | `.idfp` format ra đời — trước đó Present không có file rời (chỉ IndexedDB) | `idfp.ts:9-11` |
| 31/07 (B4, `4.1.d`) | `disk-sync.ts` — "tệp là NGUỒN, IndexedDB tụt xuống CACHE" cho CAD + Present | `disk-sync.ts:4-30` |
| 04/08 | Kho vật liệu IF v1 — khai cột `scope` cho `ProductSpec`, chưa code global | `schema.prisma:ProductSpec` comment 04/08 |
| 07/08 khuya | "MỌI THỨ TRONG THƯ VIỆN ĐỀU LÀ `.idfc`" — v2 vỏ chung + ruột discriminated union | `00-CHOT §11`, `idfc.ts:5-9` |
| 07/08 khuya | Chữ "C" trong `.idfc` = "CONTENT" (không còn Component) | `idfc.ts:2-3` |
| 07/08 khuya | 11 kind + 6 SELLABLE_KINDS. Hai trục phân loại `kind × BlockGroup` | `00-CHOT §11.2, §11.4` |
| 07/08 | `larkProjectCode` DEPRECATED-ĐANG-CHUYỂN sang `ExternalRef` | `schema.prisma:Project` comment |
| 07/08 | `lib/library/idfc-store.ts` — Kho `.idfc` studio localStorage (M-IDFC VIỆC 1) | `idfc-store.ts:1-14` |
| 08/08 | `.idfc` v3 — thêm kind `preset` | `idfc.ts:19-23`, `00-CHOT 08/08` |
| 10/08 | Master Library có 2 mặt: trang tổng gallery + sidebar hai nấc theo chặng | `00-CHOT` |
| 10/08 | Element/MaterialSpec — 3 nấc `measured|inferred|verified` | `00-CHOT`, `from-photo.ts:34-35` |
| 11/08 | TaskContext Link — `Task` thêm `stage`, `workspaceId`, `entityId` | `schema.prisma:Task` |
| 12/08 | DistillEngine group-by: 1 cỗ máy chưng cất, 3 mặt tiền (DNA · auto-define · Company DNA Pack) | `engine.ts:7-9` |
| 13/08 | Chặng 2 chỉ Canvas + Vẽ 3D (2 mode); video dựng ở chặng 2, không chặng 3 | `00-CHOT` |
| 14/08 | RNA v0 — IfRna proof trên MaterialPbr, cấm nới BuildOp/`.idfc` chưa đo | `rna/types.ts:1-16` |
| 15/08 | HAI LỚP KIỂM: LUẬT (máy tất định) vs GÓP Ý (AI, không chặn) | `00-CHOT §12` |
| 15/08 | AI đơn vị/tỉ lệ toàn app — chưa có, entry `don-vi-ty-le-toan-app` | `00-CHOT §15/08` |
| 16/08 | 3 nấc cho card/sidebar/tool = 3 CÔNG NĂNG khác nhau, không phải 3 cỡ | `00-CHOT §16/08` |
| 17/08 | Files có 2 tầng: 5 loại + Collection+ (17/08 tối) — thay bản 2 ngăn | `00-CHOT §17/08` |
| 17/08 | Luật lưu chung ↔ máy: VẬT + DÂY CHUYỀN → chung; CÁCH BÀY → máy | `00-CHOT §17/08` |
| 18/08 | Hiến pháp OS: 4 nguyên tắc Own your data/workflow/memory/AI. IF là Local-first Design OS. | `docs/IF-KIEN-TRUC-OS.md` |

---

## 35 · QUESTIONS REQUIRING HOÀ DECISION (§35)

**T KHÔNG tự trả lời.** Đây là 9 câu evidence dẫn tới, chỉ Hoà quyết.

### Q1 · Source of Truth của Project là gì?

Hiện tại KHÔNG có SoT duy nhất. Metadata ở Prisma, CAD ở `.idf`, Present ở `.idfp`, DNA ở file JSON, BOQ overrides ở IDB, Brand Kit ở localStorage, `.idfc` studio ở localStorage. 

**Hoà quyết**: 
- (A) Giữ nguyên — mỗi domain tự SoT (đơn giản, chấp nhận scattered)
- (B) Xây "IF project file" trọn — 1 file container gộp tất cả (portable nhưng cần migration)
- (C) Prisma DB là canonical, các surface khác là cache (unified nhưng cần sync)
- (D) Khác

### Q2 · Prisma vs `.idf` sở hữu phần nào?

Hiện tại Prisma sở hữu metadata, `.idf` sở hữu CAD Doc. Nhưng CAD entity có `specId` FK MỀM về `ProductSpec` (Prisma), tức Doc phụ thuộc Prisma.

**Hoà quyết**: 
- (A) Prisma sở hữu spec, `.idf` sở hữu instance — giữ như hiện tại
- (B) `.idf` snapshot chứa embedded ProductSpec (self-contained, share được không cần DB)
- (C) Prisma sở hữu tất cả, `.idf` chỉ là export snapshot
- (D) Khác

### Q3 · IDFC là canonical asset hay component instance?

Hiện tại `.idfc` là **template/mẫu** (1 file = 1 mẫu tái dùng). Bản chèn (`BlockEntity.specId`) là instance.

**Hoà quyết**: 
- (A) Giữ nguyên — template ≠ instance
- (B) Merge — mỗi lần chèn tạo `.idfc` mới (mất reuse)
- (C) Instance có "override layer" so với template gốc
- (D) Khác

### Q4 · Master Library có sở hữu binary/source không?

Hiện tại LibraryAsset copy file vào `./uploads/`. `.idfc` là JSON tự chứa (embed dataURL nếu có).

**Hoà quyết**: 
- (A) Sở hữu binary copy (hiện tại) — độc lập với file gốc
- (B) Reference file gốc (link) — không copy, phụ thuộc source
- (C) Content-addressable (hash) — dedupe cross-project
- (D) Khác

### Q5 · File Manager và Master Library chia ownership thế nào?

Hiện tại chồng — file upload → LibraryAsset ngay, KHÔNG có phase "Files thô → Library sạch". Vision 17/08 tách 2 tầng.

**Hoà quyết**: 
- (A) Files = LibraryAsset (hiện tại)
- (B) Files là raw stage, Library là curated (thêm workflow duyệt)
- (C) 2 tầng như chốt 17/08 tối (5 loại + Collection+)
- (D) Khác

### Q6 · Stage representation là derived hay canonical?

Present slide reference LibraryAsset (ảnh render). Ảnh render là derived từ node graph (Flow) + LibraryAsset input. Ảnh là canonical trong LibraryAsset nhưng derived trong workflow.

**Hoà quyết**: 
- (A) Present dùng ảnh (canonical asset), không nhớ workflow sinh
- (B) Present nhớ workflow (derived chain) — regenerate được
- (C) 2 mode song song
- (D) Khác

### Q7 · Runtime store (Zustand) có quyền mutate canonical state trực tiếp không?

Hiện tại `useCadStore.setState()` → change Doc → write `.idf` (through diskWriter). Runtime là ĐƯỜNG DUY NHẤT sửa Doc.

**Hoà quyết**: 
- (A) Runtime = editor duy nhất, mutate được (hiện tại)
- (B) Runtime chỉ đọc, mutation qua "command" pattern
- (C) 2 mode: online (mutate) + offline (read-only viewer)
- (D) Khác

### Q8 · Decision có cần canonical persistence?

Vision: DesignDecision cho Creative Timeline. Hiện tại chỉ Undo + FlowVersion (per Run) + `.idf`/`.idfp` (per save).

**Hoà quyết**: 
- (A) Thêm `DesignDecision` Prisma model — track selections/rejects/approvals
- (B) Store trong `.idf`/`.idfp` (append-only log)
- (C) Chỉ nếu user bật explicit
- (D) Chưa cần

### Q9 · Design DNA scope?

Hiện tại chỉ Project. Vision: Person · Client · Studio · Project.

**Hoà quyết**: 
- (A) Bổ sung 3 scope còn lại (Person/Client/Studio) — cần model
- (B) Chỉ thêm Studio DNA (cấp Company DNA Pack đã chốt 12/08)
- (C) Giữ Project only, per-user layer add-on
- (D) Chưa cần

---

## APPENDIX — Files đọc trực tiếp trong audit này (evidence primary)

1. `lib/disk-sync.ts` (196) — Source of Truth resolver cho CAD/Present
2. `lib/cad/idf.ts` (245) — `.idf` project CAD format
3. `lib/cad/idfc.ts` (438) — `.idfc` content item format
4. `lib/present-editor/idfp.ts` (207) — `.idfp` present format
5. `lib/library/idfc-store.ts` (54) — Kho `.idfc` studio localStorage
6. `lib/rna/types.ts` (79) — IfRna v0 hệ tự mô tả
7. `lib/idfc-import/from-photo.ts` (266) — Pipeline ảnh → `.idfc` furniture
8. `lib/present-editor/boq-overrides.ts` (112) — BOQ overrides
9. `lib/distill/engine.ts` (60) — DistillEngine generic
10. `lib/dna/store.ts` (86) — Design DNA persistence JSON file
11. `prisma/schema.prisma` — 21 model (đọc: Project, Flow, FlowVersion, Task, LibraryAsset, ProductSpec, ExternalRef, ProjectMember shape via head + grep)
12. `lib/sheets-persist.ts` head 60 dòng — IndexedDB autosave contract

**Grep operations**:
- 19 Zustand store (`create<`)
- ~20 localStorage keys
- 5 IndexedDB usages
- 3 FileSystem API usages

**Không đọc trong audit** (ghi ở §33 Unknown):
- `lib/cad/store.ts` (1037 dòng) full
- `lib/store.ts` (1257 dòng) full
- `lib/colors/*`
- `lib/ai/text-tier.ts`
- `lib/gateway/*` shape
- Prisma migrations folder
- `components/*` (out of scope)
- Test files
- `.ua/knowledge-graph.json` chi tiết mỗi node

**Bằng chứng phụ**:
- `docs/00-CHOT.md` (có trong context system prompt)
- `docs/BAN-DO-KIEN-TRUC-2026-08-18.md` (bản đồ tay T viết đêm 18/08)
- `docs/IF-KIEN-TRUC-OS.md` (hiến pháp OS Hoà chốt 18/08)
- `.ua/knowledge-graph.json` (T sinh 19/08 lúc chạy /understand)

---

**HẾT AUDIT Q0.** Không sửa code, không tự thiết kế thay code. Chờ Hoà + ChatGPT chốt kiến trúc rồi mới bước sang DESIGN/MIGRATION.
