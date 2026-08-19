# AUDIT ORPHAN CAPABILITIES — khảo cổ repo 19/08/2026

> **READ-ONLY AUDIT.** Không sửa code sản xuất, không xoá, không revive, không commit.
> Mốc đo: HEAD `c7f3ac8` + **working tree 85 mục dirty** (audit trạng thái working tree, vì
> Wave 0 chưa commit). Phương pháp: 5 lượt quét song song (lib · components · routes/prisma/config
> · git archaeology · docs↔code) + T đo lại tay 3 ca hai lượt quét mâu thuẫn nhau.
> Chi tiết phương pháp + phân xử mâu thuẫn: `docs/memory/sessions/2026-08-19/11-repo-archaeology/`.
>
> **Định nghĩa "có thật":** một feature chỉ được coi là có thật khi đi đủ dây
> ENGINE → CONTRACT → CALLER → SURFACE → USER ACTION → OUTPUT. Đứt ở đâu, ghi ở đó.
>
> Taxonomy: **A** engine no caller · **B** caller no UI · **C** UI no backend · **D** contract
> disconnected · **E** route no consumer · **F** component 0 mount · **G** flag hides ·
> **H** duplicate concept · **I** stale doc (code ahead) · **J** stale doc (doc ahead) ·
> **K** unknown owner · **L** dead intentional · **M** unknown.
> Action chỉ được: KEEP · RECONNECT · EXTEND · DEPRECATE · INVESTIGATE · IGNORE. **Không NEW.**

---

## 0 · Số đo nền

| Chỉ số | Giá trị |
|---|---|
| Repo | 1611 commit, 03/07 → 19/08 (~48 ngày), 248 file từng bị xoá |
| Working tree | 85 mục dirty (41 sửa + ~20 untracked) — **chưa commit ở đâu cả** |
| Máy soi | `soi:frontier` 0 lệch (👁1 · ✅76 xong-máy · ⬜57 chờ) · `soi:contract` 21 dây/1 chờ · `soi:tu-dien` 4 lệch nhãn (đều trong 1 mock) + 316 chữ trần |
| Nhánh chưa merge | **1**: `fix/hatch-t-junction` (1 commit thật, treo 39 ngày) + 1 commit remote mồ côi `origin/worktree-agent-a9a70ede` |
| Worktree | 2 vỏ rỗng (0 commit riêng, đã merge hết) |
| Stash | 0 |
| Nút giả toàn repo | **đúng 1 ca** (WorkHubShell) — phần còn lại kỷ luật §9 rất cao: mọi nút chưa nối đều `disabled` + lý do đọc được |

---

## 1 · P0 — UI nói dối / mất chức năng thật / rủi ro mất dữ liệu

### P0-1 · `VitalsGesturePanel` — 675 dòng chat Vitals MẤT HẲN LỐI VÀO (F)
- Definition: `components/studio/VitalsGesture.tsx:251`. Importer duy nhất: `StageSwitcher.tsx:47` (render `:446`).
- Chuỗi đứt: `StageSwitcher` bị gỡ mount 17/08 **trong working tree chưa commit** (`AppChrome.tsx:334` comment tự khai, giữ file để quay đầu). Mount site thứ hai đã gỡ từ 05/08 (`StatusBar.tsx:288` "giữ MỘT bản ở header"). **Cả hai cửa đều đóng** → panel chat Vitals không mở được bằng bất kỳ đường nào; `VitalsPill` chỉ có ở Home, không thay thế.
- Liên đới: `VitalsStateBadge.tsx:17` đọc `sending` của VitalsGesture — nguồn nay không chạy. 7 file khác vẫn comment như StageSwitcher còn sống (`StatusBar.tsx:12,13,97` · `Tooltip.tsx:87` · `ResumeWork.tsx:36` · `AppChromeTypes.ts:9` · `UploadButton.tsx:4` · `VitalsGesture.tsx:5,268,410`).
- **Action: RECONNECT** — quyết cửa mới cho Vitals trong RailDieuHuong/AppChrome trước khi commit đợt gỡ StageSwitcher. Đây là hệ quả chưa ai kiểm của chốt "sidebar = router".

### P0-2 · `WorkHubShell` — trợ lý AI trả lời GIẢ, ca nút-giả duy nhất toàn repo (C + E)
- Definition: `components/workhub/WorkHubShell.tsx:108` (283 dòng, untracked, phiên Claude khác dựng 17/08).
- Evidence: `submitMessage` (`:140-155`) đẩy câu trả lời assistant **hard-code**; `fetch(` trong file = 0; công tắc "Dùng ngữ cảnh cửa sổ" chỉ đổi câu chữ chuỗi giả; 6 iframe ngoài (Outlook/Zalo/M365) sẽ trống vì X-Frame-Options. Route `/workhub` **0 link** từ mọi file code, không có trong nav registry (`muc-dieu-huong.ts`).
- **Action: INVESTIGATE (Hoà bấm hướng)** — hoặc gỡ, hoặc dán nhãn mock + đưa vào nav, hoặc chờ Electron `WebContentsView`. LATEST đã 2 lần ghi "chờ Hoà bấm hướng" — chốt mồ côi.

### P0-3 · `specId` đứt ở mắt CUỐI khi thả từ Thư viện → BOQ lỗi (D — identity mismatch)
- Definition: `lib/cad/library-item-resolve.ts:136` — hàm ĐÃ biết tra `specId` (tham số 3 `specs`).
- Evidence: cả 2 call site đều KHÔNG truyền tham số 3 — `LibraryDropBridge.tsx:57` và `LibrarySheet.tsx:789`; entity tạo ra không set `specId` → mọi món thả từ Thư viện ra BOQ với lỗi `missing-specId-item` (`lib/boq/model.ts:102`). Trớ trêu: `LibrarySheet.tsx:341-348` **đã fetch `/api/specs` vào state** trong cùng component.
- **Action: RECONNECT** — 1 tham số. Rẻ nhất toàn audit so với giá trị (BOQ là hào của IF).

### P0-4 · 85 mục working tree chưa commit — rủi ro mất trắng (K)
- `exportIdfcStoreJson` (`lib/library/idfc-store.ts:84`) **chưa từng có trong commit nào** (`git log -S` = rỗng), 0 caller; việc gỡ StageSwitcher; 20 file docs 19/08; 4 file chờ cột `matId` — tất cả sẽ biến mất nếu ai đó checkout.
- **Action: Hoà commit theo nhịp riêng** (đã nằm trong "CHỜ HOÀ" của LATEST — audit này chỉ nhấn lại mức rủi ro).

---

## 2 · P1 — Engine lớn có sẵn nhưng 0 caller / workflow đứt

| Capability | Loại | Definition | Caller | UI | E2E | Status | Evidence | Action |
|---|---|---|---|---|---|---|---|---|
| **`lib/idfc-import/**`** (chuẩn hoá mesh · fit RANSAC · mirror-complete · part-lock · from-photo) | A | `surface-graph.ts:89` `chuan-net.ts:732` `part-lock.ts:163` `from-photo.ts:89` | 0 ngoài nội bộ module + test | không | ✗ | **Orphan lớn nhất repo: 3.341 dòng + 986 test** | grep import 4 hit đều nội bộ; `LibrarySheet.tsx:87` chỉ comment | **INVESTIGATE** → quyết RECONNECT (nối vào kệ Cấu kiện/GHẾ-3D-TỪ-ẢNH đã demo 14/08) hay DEPRECATE |
| `CuaSoThaoLuan` + `BangSoCucForm` + `BaHoiStorylineForm` | F | `components/collab/CuaSoThaoLuan.tsx:106` (856 dòng cả cụm) | 0 mount (T verify 19/08) | không | ✗ | Cờ `CHUNG_CAT_SAN_SANG=true` đã bật nhưng cửa sổ chưa cắm vào FlowCanvas; tự khai `:142` "nơi mount phải truyền onChungCat" | phiếu COLLAB 17/08 dừng trước bước cuối | **RECONNECT** (chờ Hoà ✓ mock Ca D — đã ghi LATEST nợ #4) |
| `LightBar` | F | `components/ui/LightBar.tsx:107` (353 dòng) | 0 (T verify — anh em `LightArc` có 3-4 nơi dùng thật) | không | ✗ | Mặt tiền THANH của `lib/ui/tien-trinh.ts` chưa nơi nào gọi | grep import = 0 | **RECONNECT** (luật 16/08 "cái gì chạy cũng phải có thanh") |
| `lib/ai/web-lookup.ts` | A | `:337 lookupFurniture` (355 dòng) | 0 ngoài test | không (màn Cài đặt hứa trong docstring chưa có) | ✗ | Engine domain-trắng + chống rò NDA viết đủ | grep = 0 | **INVESTIGATE** |
| `lib/lighting/lux.ts` | A+H | `:66 roomLuxEstimate` | 0 ngoài test | không | ✗ | **Đường tính lux THỨ HAI đang chạy thay nó**: `lib/review/luat/rules-3d.ts:149` tự tính `lumens×UF/area`, thiếu MF | grep import = 0 | **RECONNECT** (xoá bản sao trong rules-3d, gọi engine) |
| `ResumeWork` widget | F | `components/home/widgets/ResumeWork.tsx:50` + `resume-card.ts` + test | 0 | không | ✗ | `DongStudioHome.tsx:50-58` import đúng 9 widget, không có nó | grep = 0 | **RECONNECT** |
| `lib/ui/thao-tac-glyph.tsx` (6 hình minh hoạ thao tác) | A | 240 dòng | 0 ngoài test | không | ✗ | Tooltip/ToolbarChip chỉ **nhắc trong comment**, không import — ô giải nghĩa có hình dựng 16/08 chưa cắm kho hình | grep = 0 | **RECONNECT** (1 dòng import tại call site) |
| `Tool3DBar` chưa lắp `ToolbarChip` | H | `components/render-studio/Tool3DBar.tsx` | mount thật | có | — | 2/3 thanh đã đổi ruột (CadToolbar 23 · present Toolbar 5), thanh 3D = 0 | grep ToolbarChip = 0 trong file | **RECONNECT** (mảnh cuối của toolbar-mot-khuon) |
| `reviewDeck` không nhận `slides` | D | `lib/review/index.ts` → `luatDeck` | `ReviewPanel.tsx:100` gọi `{deBai:null}` không slides | có panel | ✗ | Chặng deck của bảng kiểm là vỏ rỗng — `luatDeck` không bao giờ chạy | comment `:97-99` tự thú | **RECONNECT** |
| `lib/review` chưa gác cửa xuất/chuyển chặng | B | `review2d/3d/deck` | chỉ ReviewPanel | panel | — | ExportPdfDialog · StageTransition = 0 hit | grep = 0 | **EXTEND** (PostGate đã chốt 13/08, chưa thi hành) |
| `geom2d` trong `.idfc` — write-only | D | `lib/cad/idfc.ts:171`, validate `:348` | writer 2 · **reader 0** | nhập được, không thả xuống bản vẽ được | ✗ | `DROPPABLE_ITEM_KINDS` không có kind kệ `common-idfc`; resolveLibraryItem không tra idfc-store | grep `.geom2d` ngoài def = 0 | **RECONNECT** |
| `SELLABLE_KINDS` | D | `lib/cad/idfc.ts:81` | 0 ngoài test | — | ✗ | luật "chỉ loại bán được mới có giá" chưa thi hành ở đâu | grep = 5 hit đều def/comment/test | **RECONNECT hoặc DEPRECATE** |
| `Frame.rotation` + `flip/mirror` (Present) | A/F | `lib/present-editor/model.ts:144`; render sẵn `EditorCanvas.tsx:492` | render có, **0 UI set giá trị** (mọi khởi tạo `rotation: 0` cứng) | thiếu handle | ✗ | audit toolkit 28/07 đã bắt, vẫn nguyên; `flip/mirror` = 0 toàn app | `PresentEditor.tsx:309,314,873,1963` | **RECONNECT** (rẻ: backend+render xong, thiếu 1 handle xoay) |
| `api/atlas-materials/sync` | A | route hoàn chỉnh ATLAS→ProductSpec | 0 caller code | không | ✗ | chặn ở quyền Lark `131006` (App ID chưa được mời) — nợ vận hành không phải nợ code | docstring route tự khai | **KEEP + INVESTIGATE** (nay Lark = optional adapter theo chốt 19/08 — cân nhắc hạ ưu tiên) |
| `NEXT_PUBLIC_COMMENT_LAYER` che TRỌN backend comment | G | `components/CommentLayer.tsx:158` return null khi ≠'1' | backend đầy đủ (`api/comments` + store) | UI tắt mặc định | ✗ | lý do UX có ghi (`:157` "vướng khi thao tác") | grep flag | **KEEP (có tài liệu)** — chỗ bật khi cần Review Gate |
| `fix/hatch-t-junction` | K | nhánh, `ed002ec` 11/07 — DCEL dò biên hatch vách chữ T | — | — | — | nhánh DUY NHẤT chưa merge, tụt 1453 commit | `git branch --no-merged` | **INVESTIGATE** (cứu hay chôn — entry `hatch-t-junction-cay-lai` đã có từ 12/08, chưa làm) |
| Hai ⌘K cùng nghe trên `/projects/[id]/render` | H | `CommandPalette` (HomeScreen:699) + `AppCommandPalette` (AppShell:206) | cả hai mount trên cùng route | có | — | HomeScreen mount ở 2 route, AppShell cùng sống trên render | cần bấm thử đếm panel | **INVESTIGATE → hợp nhất về AppCommandPalette** |

---

## 3 · P2 — Stale docs / terminology / duplicate

### 3a · Loại I — docs nói "chưa có", code ĐÃ có

| Doc | Nói gì | Thực tế | Action |
|---|---|---|---|
| `docs/SPEC-GANTT-DATA.md:6,40` | "CHƯA có model Task" | `schema.prisma:574` Task + WorkflowState, API + UI thật (`TaskBoardScreen`, 9 caller) — **sai 11 ngày** | RECONNECT (sửa doc) |
| `prisma/schema.prisma:538,552` | comment "chỉ có LarkTaskRef… CHƯA CHẠY MIGRATE" | đã migrate 08/08, `TASK_TABLES_READY=true` có test khoá | RECONNECT |
| `docs/DOI-CHIEU-42-SPEC-2026-08-08.md` §1 | "14 kho chưa mở, 0 nơi gọi" | 12/14 đã mở (soi:contract: 21 dây/1 chờ) | RECONNECT (đóng bảng, trỏ soi:contract) |
| `DOI-CHIEU-42` §1 item 12 | `LIBRARY_DATA_IS_MOCK=true` | `shelves.ts:25` = **false** | RECONNECT |
| `DOI-CHIEU-42` §2#9 | "rail ĐÃ XOÁ — đừng dựng lại" | rail đã dựng lại 17/08 theo chốt sidebar=router (`RailDieuHuong.tsx`) | RECONNECT |
| `docs/SPEC-DUNG-3D-THONG-NHAT.md:48,575` | bảo vệ `CommandPanel.tsx` "chưa mount, đừng xoá" | file **đã bị xoá**; bản sống là `Command3DPanel.tsx` | RECONNECT (đóng H5) |
| `docs/RESEARCH-TEAM-COLLABORATION.md:344` | "chưa mount ExportPdfDialog" | đã mount qua `present-editor/Toolbar.tsx:82` | RECONNECT |
| `docs/FIGMA-HANDOFF.md:44-48` | bảng token `--mat-*` chết | token đã đổi 16/08 — đây là **nguồn gieo lại tên chết sang Figma** | RECONNECT (5 dòng) |
| Comment code lỗi thời | `lib/gateway/route.ts:5` "CHƯA tích hợp UI" (đã 4 UI) · `CamPathControlPanel` "chưa nối store" (đã nối) · `lib/materials/resolve.ts` ghi chú 0-caller (đã 2 caller) · `HopCongCuBamVat.tsx:8` "NodeToolbar grep 0" (chính file đó đã dùng) · 7 comment trỏ StageSwitcher như còn sống | — | RECONNECT (dọn 1 lượt) |

### 3b · Loại J — docs nói xong / tự xưng nguồn duy nhất, thực tế đã bị thay

| Doc | Vấn đề | Action |
|---|---|---|
| `docs/SPEC-MODE-PER-STAGE.md` | vẫn tự xưng "Nguồn DUY NHẤT", §1 "đổi cả shell" — đã bị `SPEC-HA-TANG-UI-IF` thay, **0 dấu ⛔**, 12 file còn trỏ vào | RECONNECT (đóng dấu §1) |
| `docs/IF1_IF2_BIGPICTURE.md` | chỉ có đính chính từ vựng, **chưa ⛔** dù §22-25 bị huỷ; `docs/README.md:21` vẫn quảng cáo; `lib/cad/store.ts:145` docstring còn trích nó | RECONNECT (⛔ + sửa README) |
| `docs/CHOT-INTRO-VIDEO-2026-08-02.md` 🔴 | chốt "bỏ intro code → video" **17 ngày không thi hành**, không ai nhận | INVESTIGATE (thi hành hoặc đóng chốt) |

### 3c · Loại H — duplicate concept khác tên (ca mới, kiểu "master tool ↔ ToolWindow")

| Ca | Evidence | Action |
|---|---|---|
| **HAI BỘ "CHẶNG" trong code**: `CadStage='sketch'\|'technical'\|'bim'` (`lib/cad/store.ts:145` — tự gọi là "CHẶNG", trích BIGPICTURE đã huỷ) vs `phases` `concept/render/present` vs `GatewayStage='cad'\|…` | máy soi tu-dien không quét lib/ cho luật chặng → không bắt được | INVESTIGATE (nạp vào từ điển máy) |
| "Gateway" vs "Format Router" (chốt C1 mới 19/08) | 5 docs còn dùng lẫn: `IF-FEATURE-TREE.md:186,486,544` · `FILEMANAGER-SPRINT-v2:33,60` · `IF-CORE-SCHEMA:404` · `IF-ARCHITECTURE-BLUEPRINT-v1.md:172` — nguy cơ phiên sau "nối AI Gateway vào IOMenu" | RECONNECT (đổi chữ 5 file) |
| `lib/slide-templates.ts` (228 dòng, 0 caller) vs `lib/slides.ts` (358 dòng, sống) | hai bộ preset slide song song | DEPRECATE bản orphan |
| `widget·element·node·module` = 4 tên 1 thứ | `WidgetCard.tsx` dùng token `--shadow-node` — lệch đã lan vào token | INVESTIGATE (chờ Hoà chốt tên, §V5 #13) |
| Settings cũ ×3: `AccountSettings`/`AppearanceSettings`/`StorageSettings` (components/settings) vs bản `app/settings/_components/*Card.tsx` | 0 mount cả 3, 2 file sống còn comment trỏ về bản chết | DEPRECATE + dọn comment |
| `StageSelect` vs `ProjectSelect` | `ProjectSelect.tsx:98` tự khai "THAY cho StageSelect cũ" | DEPRECATE |
| Project vs Workspace | **KHÔNG duplicate**: schema không có model Workspace; 152 ref code đều là `WorkspaceMode` (chặng đang mở) — khớp chốt C3 19/08 | IGNORE (chỉ là rủi ro từ vựng) |

### 3d · Sổ ghi SAI — 5 ca (memory nhớ hộ code, audit này đính chính)

| Sổ ghi | Thực tế đo 19/08 |
|---|---|
| "`LibraryItem` dead model" | **chưa từng là Prisma model** — DTO TS, 34 ref sống ở 5 file; model DB là `LibraryAsset` (17 usage) |
| "Chat có API không có trang" → hiểu thành orphan | `api/chat` có **4 caller** (`ChatPanel` render ở HomeScreen + PresentStageScreen); "không có trang" là thiết kế panel có chủ ý (`muc-dieu-huong.ts:136`) |
| "`public/cad-library/manifest.json` ai đọc?" | sống mạnh: loader `block-library.ts:61` + tab UI CadEditor + 2 test đọc file thật |
| "`/demo-amanoi`, `/present` route mẫu công khai" (AUDIT-BRAND-PII) | **không còn tồn tại** — đã xoá |
| "sổ 17/08: getMaterial 0 caller ngoài test" | đã 2 caller thật (`MaterialsScreen.tsx:98`, `ngan-tho.ts:142`) — reconnect xong nhưng sổ chưa cập nhật |

---

## 4 · P3 — Dead / dọn rẻ

| Thứ | Loại | Evidence | Action |
|---|---|---|---|
| `components/IntroSequence.tsx` (493 dòng, bản gốc bị bỏ lại khi tách `components/intro/`) | F | 0 importer; vẫn ăn suất trong refactor token 16/08 | DEPRECATE |
| `app/dev-bench-3d-2/` (137 dòng) | L | tự khai "xoá sau khi đo"; CHANGELOG ra lệnh xoá 3 lần | DEPRECATE |
| `_shot.mjs` (root, untracked) | L | script chụp 1 phiên, trùng `scripts/audit-routes.mjs`; hard-code port 3001 lệch launch.json 3000 | DEPRECATE |
| `public/__lincoln-viewer.html` + `__lincoln.glb` (1,6MB) | L | proof 14/08, sản phẩm thật là `Object3DWindow` + `/library-assets/lincoln-327/*`; đã nằm danh sách "dọn" 15/08 | DEPRECATE |
| `public/InteriorFlow.apk` (3,6MB) · `public/test-assets/` (2,3MB) | E | 0 ref, serve công khai | INVESTIGATE trước khi xoá |
| `DrawOnPreview` (303 dòng) + 2 lib phụ (`plan-drawon.ts:173`, `entity-path.ts:4`) | F | 0 mount | INVESTIGATE |
| `RevitSummaryPanel` (86 dòng) | F | 0 mount, tự khai "IFC chưa làm" | DEPRECATE |
| `NotebookButton` (50 dòng) | F | route notebook sống nhưng mất nút vào từ header | RECONNECT hoặc DEPRECATE |
| `lib/cad/plan-depth.ts` (178 dòng aerial-perspective) | A | 0 caller, có test | INVESTIGATE |
| `exportIdfcStoreJson` | A | 0 caller tuyệt đối, uncommitted, trùng ý đường xuất-một-món | DEPRECATE |
| `lib/vision/hough-line.test.ts` | — | test mồ côi tên (không có module hough-line — test hồi quy cho `single-view-metrology.ts:605`) | IGNORE (hoặc đổi tên) |
| `api/auth/apple` | C/G | route có, nút UI không | INVESTIGATE |
| 2 worktree vỏ rỗng + ~15 nhánh remote đã merge | L | 0 commit riêng | Hoà chạy `git worktree remove` (đã trong hàng CHỜ HOÀ) |
| `framer-motion` commit gốc `26ba7a8` tự khai "STALL giữa chừng" | K | gói vẫn dùng thật (AppChrome) nhưng "restyle vỏ" dở dang 6 tuần không ai đóng | IGNORE (ghi nhận) |

**Mẫu quy trình ĐÚNG đáng nhân rộng** (đã kiểm, không cần hành động): `a3af930` xoá TemplatePicker kèm bằng chứng grep=0 · `544999f` migration token kèm regex canh gác chống tái phát · `6d6b063` gỡ TTT kèm test chặn (`content-deck.test.ts:53` banned list) · gỡ wallpapers/covers/detech sạch kèm đường bật lại có tài liệu · `PresentDocTypePicker` 10 loại disabled kèm `unavailableReason` song ngữ — **UI trung thực làm chuẩn**.

---

## 5 · Genealogy các ca đắt (ORIGIN → DISCONNECTED)

| Capability | FIRST SEEN | LAST LIVE | DISCONNECTED | WHY |
|---|---|---|---|---|
| StageSwitcher → VitalsGesturePanel | ≤21/07 (`8d68b50`) | `544999f` 16/08 | **17/08, uncommitted** | chốt sidebar=router; Vitals chết theo không ai kiểm |
| IntroSequence (bản gốc) | `4652df0` 04/07 | — | khi tách `components/intro/` | bỏ lại, chưa dọn |
| TemplatePicker | `973d20a` 09/07 | 17/07 | `a3af930` 01/08 | xoá có kiểm chứng (mẫu đúng) |
| StageShell + LeftRail | — | — | `3a92170` 02/08 | AppShell thay, sạch |
| VitalsStageDrop | ≤21/07 | — | `c972572` 23/07 | bỏ visual giọt kính, có bản thay hôm sau |
| DWG/libredwg | `b44fb65` | gỡ `c501c89`+`f8bc03d` 17/07 | khôi phục `6f3f15d` | Worker cô lập GPL; **licenseNotes UNRESOLVED** với định vị global — chưa có owner |
| fix/hatch-t-junction | `ed002ec` 11/07 | — | chưa từng merge | treo 39 ngày, 1453 commit tụt |
| lib/idfc-import | ~13-15/08 (chuỗi chuan-net/mirror) | test xanh | **chưa từng có caller** | demo GHẾ-3D 14/08 đi đường proof script, không đi qua app |

---

## 6 · Tổng kết theo khuôn STOP

**ORPHAN CAPABILITIES FOUND: 38** (12 loại A · 6 D · 2 C · 11 F · 2 E · 5 G · 7 H — một ca mang nhiều loại đếm theo loại chính; bảng đầy đủ §1–§4)

**HIGH-VALUE RECONNECT (xếp theo giá trị/chi phí):**
1. `specId` lúc drop — 1 tham số, cứu BOQ (P0-3)
2. `VitalsGesturePanel` — 675 dòng chat mất lối vào (P0-1)
3. `thao-tac-glyph` → Tooltip — 1 dòng import, mở khoá ô giải nghĩa có hình
4. `Tool3DBar` lắp ToolbarChip — mảnh cuối toolbar-mot-khuon
5. `LightBar` + `ResumeWork` — 2 mặt tiền đã có lõi
6. `lux.ts` thay công thức chép tay trong rules-3d
7. `reviewDeck` nhận slides + `lib/review` gác cửa xuất (PostGate 13/08)
8. `geom2d` reader — cho `.idfc` nhập vào thả xuống bản vẽ được
9. `Frame.rotation` — thiếu đúng 1 handle xoay
10. `CuaSoThaoLuan` cắm FlowCanvas (chờ Hoà ✓ mock)
11. Quyết sống/chết `lib/idfc-import` 3.3k dòng — nếu sống, nối kệ Cấu kiện

**STALE DOCS: 14 ca** (§3a 9 + §3b 3 + comment code 1 lượt dọn + FIGMA-HANDOFF) — ưu tiên: SPEC-MODE-PER-STAGE đóng dấu · Gateway→Format Router 5 file · SPEC-GANTT-DATA §0 · BIGPICTURE ⛔.

**UNKNOWN OWNER: 6** — `app/workhub/` (chờ Hoà bấm hướng) · `fix/hatch-t-junction` · GPL libredwg UNRESOLVED · CHOT-INTRO-VIDEO không thi hành · `exportIdfcStoreJson` uncommitted · commit remote mồ côi `9369d6b`.

**DEAD INTENTIONAL: 11** — StageShell/LeftRail · TemplatePicker · VitalsStageDrop · TTT assets (đóng bằng test) · lark-write flag · LiveCursors (tạm ẩn có ghi chú) · gopy `deBai:null` (chết có chủ ý, có lý do hiện cho user) · dev-bench-3d-2 (lệnh xoá đã ra) · `_shot.mjs` · cặp `__lincoln` · `slide-templates.ts`.

**TRUE MISSING CAPABILITIES** (không phải orphan — thật sự chưa xây, đối chiếu sổ):
- Máy đối chiếu sổ↔code (P-S) — gap giữ audit này khỏi mốc
- `soi-dong-dang.mjs` (registry khai `chua`, khớp)
- Grounded Render v1 (bảng ánh xạ + núm per-mảng) — v0 575 dòng, mtime 13/08
- Review Gate ở cửa xuất/chuyển chặng (PostGate) — engine có, gate chưa
- Trang/panel đề bài (`DeBaiDaGhi`) — không nơi nào dựng được nó → lớp góp ý 0% chạy
- Entry sửa `pickHatchFace` O(N²) — lời hứa trong registry chưa thành entry

**PRODUCTION CODE MODIFIED: NO**
**COMMIT: NO**

---
*Session: `docs/memory/sessions/2026-08-19/11-repo-archaeology/`. Chỉ mục tra lại theo capability: `docs/memory/RETRIEVAL-MAP.md` topic ORPHAN CAPABILITIES. Hạn dùng: mọi con số đo trên working tree 19/08 — qua 1 đợt refactor lớn hoặc sau khi Hoà commit/dọn, phải đo lại (luật CODE REALITY).*
