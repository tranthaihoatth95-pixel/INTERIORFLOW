# IF · CAPABILITY EXPOSURE MATRIX

> **Lập 19/08/2026 khuya** · vai INTEGRATION COORDINATOR · Last verified HEAD: **`c7f3ac8`** + working tree **88 mục dirty** (re-verify độc lập, không chép audit).
>
> ⚠️ **DELTA 19/08 khuya muộn — MAIN Batch 0A-2 đóng 8/11 RECONNECT, bảng dưới CHƯA phản ánh** (chi tiết:
> `IF-INTEGRATION-GATE-2026-08-19.md` §5b). Đọc bảng dưới kèm ghi đè này: **specId-drop** (R1) ·
> **thao-tac-glyph** (R3) · **Tool3DBar/ToolbarChip** (R4+L1) · **LightBar+ResumeWork** (R5) ·
> **2-đường-upload** (R6) · **reviewDeck-nguồn-rỗng** (R7) · **geom2d-reader** (R8) · **4 nhãn +
> lux** (R9a) — tất cả chuyển **LIVE**, sống trên `backup/2026-08-19-batch0a` (14 commit, remote đã
> push), CHƯA vào `main` (chờ H7). **Frame.rotation KHÔNG DISCONNECTED — ĐÃ CÓ handle xoay từ trước**
> (R9b REFUSE phát hiện DRIFT chính bảng này — sửa dòng LANE 6 bên dưới). ORPHAN còn lại thật:
> VitalsGesturePanel · web-lookup · lib/idfc-import (3 trong 7, không phải 7).
> Trả lời MỘT câu hỏi: **mỗi capability đang ĐỨNG Ở ĐÂU trên dây ENGINE → CONTRACT → CALLER → SURFACE → USER ACTION → OUTPUT** — và nếu đứt, đứt ở mắt nào.
>
> **Status legend**: `LIVE` đủ dây tới người dùng · `PARTIAL` sống nhưng thiếu mảnh · `DISCONNECTED` engine + UI đều có, dây giữa đứt · `ORPHAN` engine có, 0 caller/0 mount · `BLOCKED` chờ quyết định/hạ tầng ngoài code · `TRUE-MISSING` chưa xây (có negative evidence) · `HEADLESS-OK` cố ý không UI (intentional).
> **Action legend**: REUSE · RECONNECT · EXTEND · NEW (cấm khi chưa đủ negative evidence B25) · DEPRECATE · INVESTIGATE · WAIT-HOÀ.
>
> Nguồn đối chiếu: `AUDIT-ORPHAN-CAPABILITIES-2026-08-19.md` (38 orphan) · UX lane report (`bao-cao-phien/2026-08-19-prompt01-ux-workspace-files-flow.md`) · Lane 4 model (`IF-FILE-MASTER-LIBRARY-IDFC-MODEL.md`) · Blueprint B25. **Mọi claim caller/mount đã ĐO LẠI 19/08 khuya tại HEAD hiện tại** — 2 path đã đổi so audit (ghi ở dòng tương ứng).

---

## 0 · CÁCH ĐỌC

Mỗi dòng = 1 capability. Cột:
**Capability · Engine (file:line) · Contract · Caller hiện tại · Surface hiện tại · User action · Output · Truth owner · Persistence · Status · Gap (mắt đứt) · Action · Owner lane · Dependency · Evidence verify**

Bảng chia theo LANE. Mức chi tiết: chỉ capability CÓ Ý NGHĨA tích hợp (không liệt kê helper thuần).

---

## LANE 1 · MATERIAL / BOQ

| Capability | Engine | Contract | Caller | Surface | User action | Output | Truth owner | Persistence | Status | Gap | Action | Dep | Evidence (19/08 khuya) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **getMaterial 3 mặt** | `lib/materials/resolve.ts:88` | `getMaterial(matId, sources) → {pbr,commercial,flat}` 2 đường uuid\|legacy-sku | 2 thật: `MaterialsScreen.tsx:98` · `app/files/_lib/ngan-tho.ts:142` | /materials + /files ngăn ② | xem 3 mặt + chỉ báo thiếu | BaMat indicator | matId (per B8) | — (resolver thuần) | **LIVE** | PBR còn localStorage (per máy) | REUSE | matId DB migration | RETRIEVAL-MAP đã đính chính "0 caller" sai |
| **matId = UUID canonical** | `lib/materials/matid-identity.ts` | isMatIdUuid · resolveInputMatId · generateMatId | resolver + backfill script | — | — | — | ProductSpec.matId [MIGRATING] | Prisma (cột CHƯA push) | **BLOCKED** | DB thật 34 cột chưa matId — chờ Hoà chạy runbook | WAIT-HOÀ | runbook DB | `pragma_table_info` đo lane 4 |
| **specId lúc drop Thư viện** | `lib/cad/library-item-resolve.ts:136` (tham số 3 `specs` ĐÃ biết tra) | resolveLibraryItem(item, manifest, specs?) | 2 call site — **KHÔNG truyền specs** | LibrarySheet drag + drop bridge | thả món xuống bản vẽ | BlockEntity **thiếu specId** | — | Doc | **DISCONNECTED** 🔴 P0 | mắt CALLER→ENGINE: `components/cad/LibraryDropBridge.tsx:57` (⚠️ path MỚI — audit ghi components/library/) truyền `(item, manifest)` 2 tham số; LibrarySheet:789 truyền `null` | **RECONNECT #1** — 1 tham số, LibrarySheet đã fetch specs sẵn (`:341-348`) | không | re-verify 19/08 khuya: còn nguyên |
| **BOQ compute** | `lib/boq/compute.ts` | compute→cache→from-project→api/boq | 3 UI | BoqScreen + Present | xem/sửa/xuất BOQ | bảng + XLSX | specId required (W0.2) | IDB overrides | **LIVE** | món thả từ Thư viện lỗi `missing-specId-item` (hệ quả dòng trên) | REUSE | RECONNECT #1 | RETRIEVAL-MAP MATERIAL |
| **BOQ overrides** | `lib/present-editor/boq-overrides.ts` | delta overlay, specId-keyed | Present UI | BOQ editor | sửa tay m²/đơn giá | số người thắng số máy | người sửa | IDB (migration-on-read W0.2) | **LIVE** | freeze vào revision = Q6 [GAP] | REUSE | Q6 Wave 3 | — |
| **hatchOverride entity** | chốt hòa giải 19/08 mục 5 | entity.matId + hatchOverride delta | — | — | — | — | — | Doc | **TRUE-MISSING** (đã có ADR, chưa code) | thi công cùng Slice 1A bước 2B | EXTEND | matId migration | — |
| **ATLAS material sync** | `app/api/atlas-materials/sync` route hoàn chỉnh | ATLAS→ProductSpec upsert | 0 caller code | — | — | — | ProductSpec | Prisma | **BLOCKED** | quyền Lark 131006 + Lark nay OPTIONAL (chốt 19/08) | WAIT-HOÀ (hạ ưu tiên được) | Lark creds | audit §2 giữ nguyên |

## LANE 2 · VITALS / AI / CREDIT

| Capability | Engine | Contract | Caller | Surface | User action | Output | Truth owner | Persistence | Status | Gap | Action | Dep | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **VitalsPill (Home)** | `AppChrome.tsx:345-347` | → /api/ai-assist-chat | mount thật | Home cạnh ô tìm | hỏi AI | trả lời | — | — | **LIVE** | — | REUSE | — | UX P4 |
| **VitalsGesturePanel** | `components/studio/VitalsGesture.tsx:251` (675 dòng, có nấc research→RAG) | panel 3 nấc | importer DUY NHẤT = `StageSwitcher.tsx` (code chết, unmount 17/08 uncommitted) | KHÔNG CÓ | — | — | — | — | **ORPHAN** 🔴 P0 | mắt SURFACE: mount site chết; StatusBar:288 đã gỡ từ 05/08 | **RECONNECT #2** — quyết cửa mới theo chốt Vitals 16/08 (neo ngữ cảnh: chấm cạnh ô tìm ở Home · nút RỜI cạnh trục phải trong chặng) TRƯỚC khi commit đợt gỡ StageSwitcher | Hoà chốt vị trí | re-verify: StageSwitcher vẫn importer duy nhất |
| **StatusBar chip Vitals** | `StatusBar.tsx:101,128` gọi `openVitals()` | store call | mount thật trong chặng | StatusBar | bấm chip | **KHÔNG RA GÌ** — panel không mount | — | — | **DISCONNECTED** 🔴 nút giả | mắt ACTION→OUTPUT | RECONNECT #2 (cùng phiếu trên) hoặc gỡ chip tạm | — | UX §2.8 xác nhận |
| **text-tier (chữ 2 tầng)** | `lib/ai/text-tier.ts` | NVIDIA→Ollama→ném typed | các route text | Vitals + concept-writer | — | text + tier badge | — | — | **LIVE** | — | REUSE (nền AI Gateway facade Wave 2) | — | — |
| **Notebook RAG** | `lib/.../rag.ts:64-69` cosine | query per-project | api/notebook query | /projects/[id]/notebook | hỏi tài liệu | trả lời + nguồn | NotebookChunk | Prisma | **PARTIAL** | embedding gửi cloud NVIDIA **0 policy/credit gate** (GAP C-3 Blueprint có bằng chứng dòng) · kho RỖNG (0 source) | EXTEND (policy gate Wave 4) + việc-có-thứ-để-nạp | Privacy mode Wave 4 | UX §2.8 |
| **web-lookup** | `lib/ai/web-lookup.ts:337` (355 dòng) | lookupFurniture domain-trắng | 0 ngoài test | — (màn Cài đặt hứa trong docstring) | — | — | — | — | **ORPHAN** | mắt CALLER | INVESTIGATE (giữ chờ màn Cài đặt — không nối vội) | — | audit giữ nguyên |
| **Lớp góp ý (gopy)** | `lib/review/gopy` | FindingGopy (type cấm mức đỏ) | ReviewPanel | panel 3 chặng | — | luôn RỖNG | — | — | **BLOCKED có chủ đích** | `deBai: null` hằng — không nơi nào dựng `DeBaiDaGhi` (màn đề bài = TRUE-MISSING #5) | WAIT (đúng thiết kế — chặn tới khi có màn đề bài) | DeBaiDaGhi | `gopy.ts:34-40` tự khai |
| **Credit gate** | server nguyên tử + refund jobRef | estimateRunCredit | node run | node canvas | chạy node AI | trừ/hoàn credit | CreditTransaction | Prisma | **LIVE** | "nói giá trước" = badge tĩnh, chưa dialog | REUSE | — | UX §2.8 |
| **SmartSelect SAM2** | `SmartSelectModal.tsx:288-318` | fallback hình học | mount thật | photo editor | chọn vùng | mask | — | — | **LIVE** | — | REUSE | — | UX P4 |

## LANE 3 · FILES / LIBRARY / IDFC

| Capability | Engine | Contract | Caller | Surface | User action | Output | Truth owner | Persistence | Status | Gap | Action | Dep | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **LibrarySheet (1 thư viện)** | `components/library/LibrarySheet.tsx` mount `AppShell:202` | 16+1 kệ, 6 kệ dữ liệu thật | mount thật | sheet nổi | duyệt/thả/xuất | items | per-kệ | IDB (W0.3 MIGRATING) | **LIVE** | spotlight = `items[0]` (nhãn hứa quá code) · "Top tuần" thứ tự nguyên bản | REUSE + sửa nhãn (RECONNECT #9) | — | lane 4 spot-check |
| **Format Router detect** | `lib/gateway/detect.ts` 23 format magic-byte | detectFormat | 5 caller thật | — | — | format | — | — | **LIVE** | — | REUSE | — | lane 4 |
| **Format Router capability** | `lib/gateway/capabilities.ts` | capabilityFor | **0 caller** + bị bypass hard-code (`Toolbar.tsx:268-273` "ĐẶC CÁCH GATEWAY") | — | — | — | — | — | **ORPHAN** | mắt CALLER | RECONNECT #6 (hợp nhất 2 đường upload đi qua nó) | — | lane 4 |
| **2 đường upload** | `/files` FS Access (0 DB) ↔ `/library/ingest` IDB manifest (0 POST /api/library) | — | 2 đường KHÔNG gặp nhau | 2 route | upload | file rơi 2 chỗ khác nhau | — | đĩa ↔ IDB | **DISCONNECTED** | mắt SURFACE→TRUTH: không đường nào là pipeline Q5 | **RECONNECT #6** — một cửa nhận qua Format Router | Q5 shape (M3 chờ MAIN) | lane 4 sự thật #1 |
| **UNDERSTAND/NORMALIZE/PROMOTE** | mảnh rời: captionImage 3 caller · PDF extract · DWG parser · from-photo classify 0 caller | — | — | — | — | — | — | — | **TRUE-MISSING** (pipeline; mảnh = REUSE) | grep `promote\|normalize` nghĩa pipeline = 0 | EXTEND theo lane-4 TARGET (understander per-format qua Format Router; proposal cờ inferred qua DistillEngine) | Q5 + M1-M4 chờ MAIN | lane 4 |
| **geom2d reader (.idfc → Doc)** | `.idfc` body.geom2d tự chứa + validate | writer 2 · reader 0 | thả món đi vòng KHỚP-TÊN vào BLOCKS/manifest | LibrarySheet | thả .idfc nhập | **KHÔNG thành entity** | — | — | **DISCONNECTED** | mắt ENGINE→CALLER: `library-item-resolve.ts` không import idfc; DROPPABLE_ITEM_KINDS không có kind kệ idfc | **RECONNECT #8** | RECONNECT #1 (cùng vùng code) | re-verify: còn nguyên |
| **exportIdfc từ kệ** | `LibrarySheet.tsx:975` gói đủ 3 mặt | exportIdfc + tải file | mount thật (nút hiện khi resolve được) | LibrarySheet thẻ lg | tải .idfc | file .idfc | — | — | **LIVE** | — | REUSE | — | re-verify 19/08 khuya — điểm SÁNG mới so audit |
| **BulkIngestMode** | nhập .idfc → idfc-store | importIdfc + saveIdfcItems | mount thật | Library ingest | kéo file | kho cập nhật | idfc-store | IDB | **PARTIAL** | toast "đã đưa N tệp" cho file KHÔNG-idfc mà không ghi gì (nói dối) | sửa toast nói thật (RECONNECT #9) | — | lane 4 sự thật #9 |
| **lib/idfc-import 3.341 dòng** | `surface-graph.ts:89` · `chuan-net.ts:732` · `part-lock.ts:163` · `from-photo.ts:89` (+986 test) | ảnh→GLB→OBJ+recipeJson, cờ 3 nấc | **0 caller runtime** (re-verify: chỉ comment nhắc) | — | — | — | — | — | **ORPHAN lớn nhất repo** | mắt CALLER: món 3D duy nhất trong app là hardcode `/lincoln 327/i` | **WAIT-HOÀ #11** (quyết sống→RECONNECT vào kệ Cấu kiện / chết→DEPRECATE) | Hoà bấm hướng | re-verify: còn nguyên |
| **chuanNet.recipeJson ↔ BuildRecipe** | recipeJson hình dạng khớp BuildRecipe | — | 0 đường đọc | — | — | — | — | — | **DISCONNECTED** | khớp ④ lane 4 | RECONNECT (trong gói #11 nếu Hoà chọn sống) | #11 | lane 4 |
| **idfc-store (kho studio)** | `lib/library/idfc-store.ts` | load/save/remove theo code | LibrarySheet kệ | kệ Cấu kiện | duyệt | items | kho studio | IDB bridge W0.3 | **LIVE** | `exportIdfcStoreJson` 0 caller uncommitted (DEPRECATE rẻ) | REUSE | — | — |

## LANE 4 · 2D KỸ THUẬT (vùng DÀY — đúng vision nhất)

| Capability | Engine | Status | Gap | Action | Evidence |
|---|---|---|---|---|---|
| CAD editor + Doc 13 entity + disk-sync `.idf` | `lib/cad/` + `lib/disk-sync.ts:44-60` | **LIVE** | — | REUSE | UX §2.5 |
| Mode Sơ phác↔Chuyên | `CadToolbar.tsx:435` | **LIVE** | — | REUSE | — |
| Toolbar lai registry | `commonCommandsFor` (`CadToolbar.tsx:255-269`) | **PARTIAL** | phần vẽ/biến đổi tự khai — hoàn thiện B2-B5 ticket lệnh | EXTEND (theo ticket có sẵn) | — |
| CamPath (camera 2D) | `CadEditor.tsx:866` CamPathPanel → CameraExportTab | **LIVE** | MAP direction #8 tag [CHƯA CẮM] **LỖI THỜI** — DRIFT D4 cần sửa tag | REUSE + sửa MAP | UX D4 |
| Hatch/MaterialPalette + MaterialImpactPreview | `MaterialPalette.tsx` | **LIVE** | — | REUSE | — |
| review2d + CHUAN_DAU_RA export gate | `lib/review` + `lib/print/export-checks.ts:124` | **LIVE** | review chưa gác cửa CHUYỂN CHẶNG (PostGate 13/08 = TRUE-MISSING #4) | EXTEND | — |
| pickHatchFace O(N²) | `lib/cad/hatch.ts` | **LIVE (chậm)** | lời hứa sửa trong registry chưa thành entry (TRUE-MISSING #6) | EXTEND khi mở entry | RETRIEVAL-MAP 2D/3D |
| Line extraction (ảnh→nét) | — | **TRUE-MISSING** (spec 13 bước mới commit `c7f3ac8` — form NO-REBUILD) | — | theo spec mới, chưa mở phiếu | HEAD hiện tại |

## LANE 5 · 3D / DESIGN DEVELOPMENT

| Capability | Engine | Status | Gap | Action | Evidence |
|---|---|---|---|---|---|
| BuildRecipe 10 op + evaluator | `lib/three/build-recipe.ts:93` → `Command3DPanel.tsx:1262-1285` | **LIVE** | UI chỉ 5 nút thêm bước; sweep/revolve/loft/taper/boolean vào qua `ops[]` cũ | EXTEND (UI 5 op còn lại) | UX §2.6 |
| docToObjScene (derived scene) | `lib/three/cad-to-obj.ts` | **LIVE** | scene không persist = ĐÚNG chốt Q6 | REUSE | — |
| **CuaSoThaoLuan (+2 form)** | `components/collab/CuaSoThaoLuan.tsx:106` (856 dòng cụm) | **ORPHAN** 🔴 | 0 mount (re-verify còn nguyên); cờ `CHUNG_CAT_SAN_SANG=true` đã bật; nút Chưng cất mờ vì `!onChungCat` | **RECONNECT #10** — mount vào FlowCanvas + truyền `mergeDistilledIntoCard` (chờ Hoà ✓ mock Ca D — đã 2 lần trong LATEST) | re-verify 19/08 khuya |
| DistillEngine | `lib/distill/engine.ts` | **LIVE (1 caller)** | caller 2 (`CuaSoThaoLuan:182`) chết theo dòng trên — sổ ghi "2 caller" cần chú thích (DRIFT D2) | REUSE | UX D2 |
| Tool3DBar | `components/render-studio/Tool3DBar.tsx` | **PARTIAL** | ToolbarChip = 0 trong file (re-verify) — mảnh cuối toolbar-mot-khuon | **RECONNECT #4** | re-verify |
| Node↔3D mode switch | `lib/stage-mode.ts:21-44` | **LIVE** | đổi cả shell — registry không phân biệt 2 mode; hoà giải với "một bộ lệnh hai lối" khi làm ticket lệnh | EXTEND sau | UX §2.6 |
| 2 ⌘K cùng nghe trên /render | CommandPalette (HomeScreen:699) + AppCommandPalette (AppShell:206) | **PARTIAL** | duplicate — cần bấm thử rồi hợp nhất về AppCommandPalette | INVESTIGATE | audit §2 |

## LANE 6 · PRESENT

| Capability | Engine | Status | Gap | Action | Evidence |
|---|---|---|---|---|---|
| PresentEditor + H4 6 loại + `.idfp` disk-sync | `PresentDocTypePicker.tsx` + `PresentSheets.tsx:136-419` | **LIVE** | 3 loại khoá kèm lý do = UI trung thực chuẩn | REUSE | UX §2.7 |
| **reviewDeck nguồn rỗng** | `lib/review` evaluateDeck có thật | **DISCONNECTED** | `components/review/ReviewPanel.tsx:100` (⚠️ path MỚI — audit ghi components/studio/) vẫn `reviewDeck({deBai:null})` không slides — luatDeck không bao giờ chạy qua panel | **RECONNECT #7** | re-verify 19/08 khuya |
| **Frame.rotation** | `Element.tsx:266-270,381-400` handle 'rot' chấm tròn, xoay quanh tâm, snap 5°, undo qua `onFrame` | **LIVE** | ⛔ dòng cũ "DISCONNECTED/0 UI setter" là DRIFT chính bảng này — R9b REFUSE 19/08 khuya muộn phát hiện, worker đo thấy `EditorCanvas.tsx:492` KHÔNG phải nơi sống (nhầm file) | REUSE — ý mới "Shift=bậc/tự do" vào IDEAS-BACKLOG | — |
| BOQ XLSX + Gói Hồ Sơ Sống | `lib/ho-so-song/pack.ts:159` | **LIVE** | — | REUSE | — |
| Brand Kit | `brand-kit.ts:8-11` | **PARTIAL** | per-máy, chưa per-project (lệch chốt 01/08) | EXTEND (Wave theo Q6) | UX P2 |
| Nhãn PPTX "luôn 16:9" | `Toolbar.tsx:613` | **PARTIAL** | nhãn lệch code (code đã đọc stagePreset — DRIFT D6) | sửa nhãn (RECONNECT #9) | UX D6 |

## LANE 7 · DESIGN SYSTEM / UI PRIMITIVES

| Capability | Engine | Status | Gap | Action | Evidence |
|---|---|---|---|---|---|
| 148 token + thang bo + mật độ | `app/globals.css` | **LIVE** | — | REUSE | UX P3 |
| ToolbarChip | `components/ui/ToolbarChip.tsx` | **PARTIAL** | 2/3 thanh (Tool3DBar chưa — RECONNECT #4) | RECONNECT #4 | re-verify |
| Tooltip prop `hinh` | `components/ui/Tooltip.tsx` | **PARTIAL** | dây có 0 điện — 0 lệnh nào truyền `hinh` | RECONNECT #3 | re-verify |
| **thao-tac-glyph (6 hình)** | `lib/ui/thao-tac-glyph.tsx` (240 dòng) | **ORPHAN** | re-verify: ToolbarChip/Tooltip chỉ NHẮC trong comment, không import | **RECONNECT #3** — khai `hinh` MỘT chỗ ở `lib/commands/registry.ts` (theo nợ ghi sẵn), cấm rải 3 toolbar | re-verify 19/08 khuya |
| LightArc | `components/ui/LightArc.tsx` | **LIVE** (3-4 mount) | — | REUSE | — |
| **LightBar** | `components/ui/LightBar.tsx:107` (353 dòng) | **ORPHAN** | 0 import (re-verify) — luật 16/08 "cái gì chạy cũng phải có thanh" chưa thi hành mặt THANH | **RECONNECT #5a** | re-verify |
| **ResumeWork widget** | `components/home/widgets/ResumeWork.tsx:50` | **ORPHAN** | DongStudioHome import 9 widget, không nó (re-verify 0 import) | **RECONNECT #5b** | re-verify |
| PanelFlank | `components/ui/PanelFlank.tsx` (đang M trong working tree) | **LIVE** | mới 2 key dùng — tay cầm thu/mở chung (chốt 07/08) lắp qua nó | REUSE + EXTEND | UX P3 |
| Checkpoint | `components/.../Checkpoint` 4 mount | **LIVE** | state không persist; là primitive gần nhất cho ProposalSheet Wave 3 | REUSE → EXTEND Wave 3 | UX §2.9 |

## LANE 8 · REVIEW / DECISION / REVISION (vùng MỎNG — đúng Wave 3)

| Capability | Status | Gap | Action |
|---|---|---|---|
| review 2 lớp LUẬT/GÓP Ý | **LIVE** (luật) + BLOCKED-có-chủ-đích (góp ý) | — | REUSE |
| ProposalSheet | **TRUE-MISSING** (0 dòng code — negative evidence: Checkpoint là primitive gần nhất → EXTEND, đừng NEW) | Wave 3 | EXTEND từ Checkpoint |
| DesignDecision model | **TRUE-MISSING** (Q8 ACCEPTED, Wave 3) | — | theo ADR |
| ProjectRevision/Frozen | **TRUE-MISSING** (Q6 ACCEPTED, Wave 3; REUSE FlowVersion retention + auto-backup) | — | theo ADR |
| `rev` token | **PARTIAL** — 4 model có field, 8 route tự tăng tay, 0 enforcement (blocker ⑤) | Wave 3 | EXTEND |
| FfeApproval | **PARTIAL** — TS type, không Prisma, 0 caller truyền (sổ "mới có FfeApproval" hơi vống — DRIFT D3) | Wave 3 | ghi nhận DRIFT |

## LANE 9 · UNKNOWN-OWNER (6 — đúng danh sách audit, re-verify giữ nguyên)

| # | Item | Trạng thái | Cần |
|---|---|---|---|
| U1 | `app/workhub/` — WorkHubShell nút giả duy nhất toàn repo (283 dòng, route 0 link, 0 trong nav registry) | **BLOCKED** | Hoà bấm hướng: gỡ / dán nhãn mock / chờ Electron WebContentsView |
| U2 | `fix/hatch-t-junction` nhánh treo 39+ ngày, tụt >1453 commit | **BLOCKED** | Hoà quyết cứu/chôn (entry `hatch-t-junction-cay-lai` có sẵn) |
| U3 | GPL `libredwg-web` UNRESOLVED với định vị global | **BLOCKED** | Hoà + pháp lý, trước phát hành (đã có RESEARCH-DWG-LICENSE) |
| U4 | `CHOT-INTRO-VIDEO-2026-08-02` 17 ngày không thi hành | **BLOCKED** | thi hành hoặc đóng chốt |
| U5 | `exportIdfcStoreJson` uncommitted 0 caller | DEPRECATE rẻ | trong lô dọn Hoà duyệt |
| U6 | commit remote mồ côi `origin/worktree-agent-a9a70ede` | IGNORE/dọn | trong lô dọn |

## TRUE-MISSING (6 — negative evidence đủ, không phải orphan)

| # | Capability | Negative evidence | Wave |
|---|---|---|---|
| T1 | Máy canh mount-chain + sổ↔code (P-S) | 4 máy soi hiện có mù loại lỗi "engine sống, mount đứt" — xem đề xuất P-S trong `IF-INTEGRATION-GATE-2026-08-19.md` §5 | trước Wave 1 |
| T2 | `soi-dong-dang.mjs` | registry khai `chua`, khớp | theo entry |
| T3 | Grounded Render v1 (bảng ánh xạ + núm per-mảng) | v0 575 dòng mtime 13/08; v1 chưa có — registry khai đúng | theo entry |
| T4 | PostGate (review gác cửa xuất/chuyển chặng) | engine `lib/review` có; ExportPdfDialog · StageTransition = 0 hit review | Wave 3 |
| T5 | Màn đề bài `DeBaiDaGhi` | 0 nơi dựng — lớp góp ý 0% chạy vì thiếu nó | chưa xếp |
| T6 | Entry sửa `pickHatchFace` O(N²) | lời hứa trong registry chưa thành entry | mở entry |

---

## TỔNG KẾT SỐ

- **LIVE**: 28 capability chính đủ dây.
- **DISCONNECTED**: 6 (specId-drop · StatusBar-Vitals-chip · 2-đường-upload · geom2d-reader · reviewDeck-nguồn-rỗng · Frame.rotation · chuanNet↔BuildRecipe) — toàn CONNECT.
- **ORPHAN (con số gốc 19/08 khuya, TRƯỚC batch MAIN)**: 8 mục liệt kê (không phải 7 — tự mâu
  thuẫn cũ, Guardian bắt 19/08 khuya muộn): VitalsGesturePanel · CuaSoThaoLuan · LightBar ·
  ResumeWork · thao-tac-glyph · web-lookup · lib/idfc-import · Format-Router-capability.
  **Sau batch MAIN (xem delta banner đầu file): chỉ còn 3 ORPHAN thật** — VitalsGesturePanel
  (chờ H2) · CuaSoThaoLuan (chờ H3) · lib/idfc-import (chờ H4/WAIT-HOÀ #11). 5 mục còn lại đã LIVE.
- **BLOCKED/WAIT-HOÀ**: 8 (matId DB · ATLAS · workhub · hatch-t-junction · GPL · intro-video · gopy-có-chủ-đích · mock Ca D).
- **TRUE-MISSING**: 6 (đều có negative evidence — không cái nào bị đề xuất NEW sai luật).
- **11 HIGH-VALUE RECONNECT: cả 11 còn nguyên tại HEAD `c7f3ac8`** — 0 cái đã được vá bởi phiên khác; 2 path file đổi (LibraryDropBridge → `components/cad/` · ReviewPanel → `components/review/`).

## HẠN DÙNG

Đo tại HEAD `c7f3ac8` + working tree 88 dirty, 19/08 khuya. Hết hạn khi: Hoà commit/dọn working tree · bất kỳ RECONNECT nào thi công · runbook DB chạy. **Không trích ma trận này làm tiền đề phiếu mới mà không grep lại** (luật CODE REALITY).
