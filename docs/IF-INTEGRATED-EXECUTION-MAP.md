# IF · INTEGRATED EXECUTION MAP — bản đồ thi công cuối

> **Lập 19/08/2026 khuya** · vai INTEGRATION COORDINATOR · HEAD `c7f3ac8` + working tree 88 dirty.
> **Vai file**: ghép kiến trúc (ADR + Blueprint + MAP) + UX/UI lane + capability reality thành MỘT
> bản đồ thi công — để từ đợt sau, feature chủ yếu là **CONNECT/REUSE/EXTEND primitive có sẵn**.
> Chi tiết từng capability: `IF-CAPABILITY-EXPOSURE-MATRIX.md`. Điều kiện code: `IF-INTEGRATION-GATE-2026-08-19.md`.
> **KHÔNG phải chốt mới** — mọi thứ neo vào 9 ADR + C1-C4 + B25; phần cần Hoà nằm ở Gate.

---

## 1 · NGUYÊN TẮC GHÉP (từ B25 — nhắc để không trôi)

1. **LOOK INSIDE → MAP EXISTING → CLASSIFY → CONNECT → EXTEND → NEW.** NEW đòi negative evidence 6 mục.
2. Memory FIND THE PLACE · code CONFIRM THE REALITY — mọi claim trong map này đã đo lại 19/08 khuya.
3. Vùng DÀY (2D · Present · node canvas · review-luật · DS) = REUSE/CONNECT/TUNE. Vùng MỎNG (Project Context · Workspace · Decision/Revision · pipeline Files→Library) = EXTEND NEAREST CONTRACT.
4. **7 dây đứt user-facing vá TRƯỚC tầng mới** (đề xuất UX lane Hướng A — được reality 19/08 khuya xác nhận còn nguyên cả 7).

---

## 2 · USER FLOWS — trace trọn chuỗi (GAP đánh tại đúng mắt)

Khuôn: `USER INTENT → ROUTE → WORKSPACE/CANVAS → SURFACE → USER ACTION → COMMAND/CONTRACT → CAPABILITY/ENGINE → TRUTH OWNER → PERSISTENCE → AI/CREDIT GATE → OUTPUT → GENEALOGY → REVIEW/EXPORT`

### UF-1 · Vẽ 2D → xuất hồ sơ PDF ✅ THÔNG TRỌN (flow chuẩn của app)

```
"Tôi vẽ mặt bằng" → /projects/[id]/cad → workspace 2D (CadStageScreen)
→ CadEditor + CadToolbar (lai registry) → vẽ tường/cửa/phòng/hatch
→ commonCommandsFor + macro commands.ts → Doc entities
→ TRUTH: đĩa .idf (disk-sync B4) · CACHE: IDB autosave
→ AI gate: không (deterministic) → OUTPUT: PDF/DXF qua CHUAN_DAU_RA gate ✅
→ GENEALOGY: .idf meta modifiedAt (Doc-level; Decision = GAP Q8 Wave 3)
→ REVIEW: ReviewPanel 2D ✅ luật máy · GÓP Ý blocked-by-design (DeBaiDaGhi T5)
```
GAP duy nhất: review chưa gác cửa CHUYỂN CHẶNG (PostGate T4 — Wave 3).

### UF-2 · Thả cấu kiện từ Thư viện → BOQ 🔴 ĐỨT 2 MẮT

```
"Tôi đặt ghế vào bản vẽ" → LibrarySheet (sheet nổi) → kéo món
→ LIBRARY_INSTANTIATE event → components/cad/LibraryDropBridge.tsx:57
→ resolveLibraryItem(item, manifest) ✂ MẮT ĐỨT 1: không truyền specs
   ⇒ entity KHÔNG specId ⇒ BOQ ăn lỗi missing-specId-item
→ nếu món là .idfc nhập: body.geom2d KHÔNG BAO GIỜ thành entity
   ✂ MẮT ĐỨT 2: đi vòng khớp-tên vào BLOCKS/manifest (geom2d 0 reader)
```
**Vá = RECONNECT #1 (1 tham số — LibrarySheet đã fetch specs sẵn :341-348) + #8 (geom2d reader).** Không NEW.

### UF-3 · Upload file → hiểu → Thư viện → dùng 🔴 ĐỨT PIPELINE (Q5)

```
"Tôi có PDF/DWG/ảnh khách gửi" → /files HOẶC /library/ingest
   ✂ 2 đường KHÔNG gặp nhau: /files ghi đĩa (0 DB) · ingest ghi IDB manifest (0 POST)
→ UNDERSTAND: mảnh rời có sẵn (captionImage · PDF extract · DWG parser · from-photo)
   ✂ pipeline promote/normalize = 0 code (TRUE-MISSING theo Q5, mảnh = REUSE)
→ MASTER LIBRARY: LibraryAsset chỉ nhận ảnh raster qua /api/library
→ dùng trong dự án: UF-2
```
**Vá đợt 1 = RECONNECT #6** (một cửa nhận qua Format Router — capabilityFor đang 0 caller). Pipeline đầy đủ = Wave theo Q5 sau khi MAIN chốt M1-M4 (lane 4 đã soạn TARGET).

### UF-4 · Brainstorm 3D → distill DNA 🟡 SỐNG 1 TRONG 2 MẶT TIỀN

```
"Tôi thảo luận concept" → /projects/[id]/render (workspace 3D)
→ mặt tiền A: DesignDnaCardPanel (overview:308) → DistillEngine ✅ SỐNG
→ mặt tiền B: CuaSoThaoLuan (856 dòng, 2 form lập luận)
   ✂ 0 mount — nút Chưng cất mờ vì !onChungCat; cờ CHUNG_CAT_SAN_SANG=true đã bật
→ TRUTH: uploads/dna/<projectId>/cards.json → cờ inferred, người duyệt thắng máy ✅
```
**Vá = RECONNECT #10** (mount vào FlowCanvas + mergeDistilledIntoCard) — **chờ Hoà ✓ mock Ca D** (đã 2 lần trong LATEST).

### UF-5 · Hỏi Vitals trong chặng 🔴 NÚT GIẢ ĐANG SỐNG

```
"Tôi bí, hỏi AI" → đang ở chặng bất kỳ → StatusBar chip Vitals
→ bấm → openVitals() vào store ✂ KHÔNG NƠI NÀO RENDER PANEL
   (VitalsGesturePanel 675 dòng — importer duy nhất StageSwitcher đã thành code chết)
→ đường sống duy nhất: VitalsPill ở Home (không thay thế ngữ cảnh chặng)
```
**Vá = RECONNECT #2** — quyết cửa mount theo chốt Vitals 16/08 (chấm cạnh ô tìm · nút RỜI cạnh trục phải) **TRƯỚC khi commit đợt gỡ StageSwitcher**. Đây là vi phạm luật "cấm nút giả" duy nhất đang sống trên UI chính.

### UF-6 · Present deck → review → export 🟡 THÔNG TRỪ REVIEW

```
"Tôi đóng hồ sơ" → /projects/[id]/present → H4 chọn 6 loại ✅
→ deck editor .idfp disk-sync ✅ → BOQ specId required ✅ → XLSX/PDF/PPTX/300dpi ✅
→ Gói Hồ Sơ Sống zip ✅
→ REVIEW: reviewDeck ✅ **LIVE 19/08 (R7 xong)** — PresentEditor phát `present:deck-review-state`
   (tham chiếu slides, reducer clone-mỗi-mutate nên bất biến) + trả lời `present:deck-review-request`
   + `present:goto-slide` nhảy đúng slide; ReviewPanel nghe → `reviewDeck({slides})`. 3 trạng thái UI
   phân biệt thật (chưa-kiểm ≠ 0-trang ≠ 0-vi-phạm). Browser 5 kịch bản console sạch (agent verify,
   T spot-check code+test) — report `bao-cao-phien/2026-08-19-R7-reviewdeck-slides.md`
→ Frame.rotation: render sẵn, 0 handle xoay ✂
```
**Vá = RECONNECT #7 (nối slides vào panel) + #9b (1 handle xoay).**

### UF-7 · Material 3 mặt xuyên chặng 🟡 SỐNG — chờ DB migration để trọn

```
"Đổi vật liệu 1 chỗ, mọi chỗ đổi" → getMaterial() 2 caller thật ✅
→ matId UUID canonical: code sẵn · DB thật CHƯA CÓ CỘT ✂ BLOCKED chờ Hoà chạy runbook
→ 2D hatch ✅ · 3D PBR (localStorage per máy — MIGRATING W0.3) · BOQ specId ✅
→ entity.matId + hatchOverride: ADR chốt, chưa code (Slice 1A bước 2B sau runbook)
```

### UF-8 · Ảnh → cấu kiện 3D ⚫ ORPHAN CHỜ HOÀ

```
"Tôi có ảnh ghế, muốn thành cấu kiện" → KHÔNG CÓ CỬA UI NÀO
→ engine đủ: from-photo (①classify ②mesh Trellis ③spec verified, cờ 3 nấc per-trường)
   + chuan-net (GLB→OBJ+recipeJson) = 3.341 dòng + 986 test, 0 caller
→ proof 14/08 đi đường script, không qua app; món 3D duy nhất = hardcode /lincoln 327/i
```
**= WAIT-HOÀ #11**: sống → RECONNECT vào kệ Cấu kiện (cửa UI + nối recipeJson↔BuildRecipe) · chết → DEPRECATE 3.3k dòng. Không để treo tiếp.

### UF-9 · Mở dự án → hiểu ngữ cảnh 🟡 FLOW-CENTRIC (bệnh IA gốc — Wave 1)

```
"Tôi mở dự án XYZ" → ProjectSelect card → lastStage ✅ nhảy chặng dở
→ openFlow: CHỈ graph + tên ✂ không context (WHO/WHAT/revision/decisions)
→ không route gốc /projects/[id] · overview NGOÀI AppShell (lệch khuôn)
→ Manifest Q1 = GAP Wave 1 (chờ U-Q1-01 hình thù — Hoà)
```
Đúng Wave 1 plan — không vá lẻ, đi cùng Manifest.

---

## 3 · THỨ TỰ THI CÔNG — DEPENDENCY THẬT

### ĐỢT 0 — "CẮM ĐIỆN" (7 phiếu CONNECT nhỏ, mỗi phiếu độc lập, rollback từng cái)

Điều kiện chung: mỗi dây đứt MỘT phiếu có ô ⓪, cấm nhân tiện refactor vùng dày. Không phiếu nào phụ thuộc phiếu nào — chạy song song được, trừ ghi chú.

> ⚠️ **DELTA 19/08 khuya muộn — 8/11 R ĐÃ XONG, CHECKPOINTED trên `backup/2026-08-19-batch0a`
> (chưa vào `main`)**. Bảng dưới GIỮ NGUYÊN làm hồ sơ gốc — trạng thái thật xem Gate §5b:
> R1 `bcb13c5` · R3 `f25716e` · R4 `a1a8533`+R4-L1 `0be972e` · R5 `073881e` · R6 `bf14485`
> · R7 `355459d` (✅ đã đánh dấu dưới) · R8 `388a893` · R9a `3ba7b9e` · R9b **HUỶ** (tiền đề
> map sai, đóng dấu). Còn treo: R2 (chờ H2) · R10 (chờ H3) · R11 (chờ H4).

| # | Phiếu | Cỡ | Phụ thuộc | Blast radius | Rollback |
|---|---|---|---|---|---|
| R1 | ✅ **XONG** `bcb13c5` — specId lúc drop (`LibraryDropBridge.tsx:57` + LibrarySheet:789 truyền specs) | ~5 dòng | không | BOQ nhận món thả — kiểm `missing-specId-item` biến mất | revert 1 commit |
| R2 | Vitals cửa mới (mount VitalsGesturePanel theo chốt 16/08 + sửa/gỡ chip StatusBar) | ~1 ngày | **Hoà chốt vị trí mount** (đã có chốt 16/08 — chấm Home + nút RỜI trục phải; chỉ cần Hoà gật áp dụng) | AppChrome/AppShell | revert |
| R3 | ✅ **XONG** `f25716e` — thao-tac-glyph → khai `hinh` một chỗ ở `lib/commands/registry.ts` | ~nửa ngày | không | Tooltip mọi toolbar | revert |
| R4 | ✅ **XONG** `a1a8533`+`0be972e` (R4-L1 hết tràn bar) — Tool3DBar lắp ToolbarChip (mảnh cuối toolbar-mot-khuon) | ~nửa ngày | không | thanh 3D | revert |
| R5 | ✅ **XONG** `073881e` — LightBar mount (hàng đợi render — luật "gì chạy cũng có thanh") + ResumeWork vào DongStudioHome | ~nửa ngày | không | Home + queue panel | revert |
| R6 | ✅ **XONG** `bf14485` — Hợp nhất 2 đường upload qua Format Router (capabilityFor hết 0-caller; bỏ "ĐẶC CÁCH GATEWAY" Toolbar:268) | ~2-3 ngày | shape tối thiểu — KHÔNG chờ full Q5 | /files + ingest | revert |
| R7 | ✅ **XONG 19/08** — reviewDeck nhận slides (CustomEvent `present:*`, 0 store mới; +13 test; browser 5 kịch bản) | đã xong | không | panel Present | revert (event thuần, gỡ là về cũ) |
| R8 | ✅ **XONG** `388a893` — geom2d reader (.idfc → entity khi thả; nhánh `via:'idfc'`, xây trên R1) | ~1-2 ngày | R1 (cùng vùng — làm SAU R1) | drop path | revert |
| R9a | ✅ **XONG** `3ba7b9e` — 4 nhãn nói thật + lux về MỘT nguồn + 3 DRIFT sổ đóng dấu | ~1 ngày | R2 (comment StageSwitcher — phần đó vẫn treo) | text-only | revert |
| R9 | Lô nhãn nói thật: spotlight items[0] · "Top tuần" · PPTX 16:9 · toast BulkIngest + lô comment stale (7 file trỏ StageSwitcher, `resolve.ts` 0-caller note…) | ~1 ngày | R2 (comment StageSwitcher) | text-only | revert |
| R9b | ⛔ **HUỶ 19/08 tối — TIỀN ĐỀ SAI, worker REFUSE đúng**: handle xoay ĐÃ TỒN TẠI (`Element.tsx:381-400` chấm tròn 14px, xoay quanh tâm `:266-270` snap 5°, undo qua `onFrame`). Dòng "0 handle xoay" là DRIFT của chính map này. Ý mới (Shift=bậc/tự do) → IDEAS-BACKLOG, không thuộc Đợt 0 | 0 | — | — | — |
| R10 | CuaSoThaoLuan mount FlowCanvas + mergeDistilledIntoCard | ~1 ngày | **Hoà ✓ mock Ca D** | FlowCanvas 3D | revert |
| R11 | lib/idfc-import: quyết sống/chết | tùy | **Hoà bấm** | 3.3k dòng | — |

Lô lux (#6 audit — xoá công thức chép tay `rules-3d.ts:149`, gọi engine `lux.ts`): gộp vào R9 hoặc phiếu riêng ~nửa ngày.

### ĐỢT 1 — WAVE 1 nguyên bản (sau khi Hoà chạy runbook DB)

- Manifest Q1 (chờ **U-Q1-01** hình thù — Hoà) + route gốc dự án + Project Context composer (EXTEND từ openFlow, không NEW store)
- Material wiring trọn: Slice 1A bước 2B (entity.matId + hatchOverride) — sau cột `ProductSpec.matId` push
- `.idf` mang projectId (GAP D-4) — additive v2, không bump

### ĐỢT 2+ — theo Wave plan đã chốt (không nhắc lại ở đây)

Wave 2 AI Gateway facade (2,5 gateway → 1) · Wave 3 Q7-hẹp + Q8 Decision + Q6 Revision (ProposalSheet EXTEND từ Checkpoint) · Wave 4 DNA 4-scope + Privacy · Wave 5 ArchiNote contracts.

### Sơ đồ phụ thuộc

```
        [Hoà: runbook DB]──────────────┐
        [Hoà: mock Ca D]──► R10        │
        [Hoà: vị trí Vitals]──► R2     ▼
R1 ──► R8                        Slice 1A-2B ──► UF-7 trọn
R2 ──► R9(comment)               Manifest Q1 (chờ U-Q1-01) ──► Wave 1 IA
R3, R4, R5, R6, R7, R9b: độc lập
[Hoà: quyết #11] ──► RECONNECT idfc-import HOẶC DEPRECATE
Wave 3 (Q7+Q8+Q6) ◄── T4 PostGate · T5 DeBaiDaGhi (mở khoá gopy) · ProposalSheet(EXTEND Checkpoint)
```

---

## 4 · RANH GIỚI LANE + GUARDIAN CONTRACT

Mỗi phiếu Đợt 0 mang sẵn khối guardian trong ô ⓪:

> Agent có quyền REFUSE nếu phiếu: ①trái ADR/Blueprint/chốt canonical ②xây lại primitive có sẵn chưa chứng minh REUSE/CONNECT/EXTEND không đủ ③tạo truth/store/router/DS thứ hai ④UI giả/nút không backend ⑤phá provenance/genealogy ⑥evidence stale chưa đo lại.
> Khi REFUSE ghi đủ: **Conflict → Evidence → Canonical owner → Existing primitive → Safer alternative.**

| Lane | Owner vùng | Cấm |
|---|---|---|
| Material/BOQ | `lib/materials` `lib/boq` | đẻ namespace matId thứ 5 · chép giá vào PBR |
| Vitals/AI | `components/studio/Vitals*` `lib/ai` | gateway thứ 4 (đã 2,5 + format router) · AI ghi canonical |
| Files/Library | `lib/library` `lib/filemanager` `lib/gateway` `app/files` | kho thứ hai · taxonomy phân loại file thứ 4 |
| 2D | `lib/cad` `components/cad` | đổi persistence key · store mới |
| 3D | `lib/three` `components/render-studio` `components/collab` | persist scene (trái Q6) |
| Present | `lib/present-editor` `components/present-editor` `components/review` | sản xuất nội dung mới trong chặng 3 (trái 13/08) |
| DS | `components/ui` `app/globals.css` | đụng `--accent*` (chờ Hoà chọn mòng két↔mận) · token ngoài thang |

---

## 5 · GHI CHÚ CHO PHIÊN SAU

1. **Đọc GATE trước khi mở phiếu**: `IF-INTEGRATION-GATE-2026-08-19.md` — đợt 0 chỉ được chạy phiếu trong danh sách R1-R11; việc mới ngoài danh sách phải qua B25 + T.
2. Path đã đổi so audit: `LibraryDropBridge` ở `components/cad/` · `ReviewPanel` ở `components/review/` — đừng tin path trong audit cũ.
3. Working tree 88 dirty chưa commit — **mọi phiếu phải ô ⓪b đo HEAD + git status trước**.
4. 3 DRIFT sổ đã ghi nhận cần sửa cùng R9: MAP #8 camera tag lỗi thời (D4) · MAP #6 "2 caller" (D2) · Blueprint #17 FfeApproval (D3).

## HẠN DÙNG

Map này hết hạn khi: Hoà commit working tree · bất kỳ R nào thi công · runbook DB chạy · Hoà quyết #11/workhub. Mọi số grep phải đo lại trước khi làm tiền đề phiếu (luật CODE REALITY).
