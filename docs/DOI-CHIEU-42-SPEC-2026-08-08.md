# ĐỐI CHIẾU 42 SPEC ↔ CODE THẬT — 08/08/2026

> Thực hiện: 4 agent đọc-tay song song (phiên "Bàn giao tất cả"), mỗi spec đọc trọn + grep code,
> mỗi dòng có file:dòng. Đây là việc PHẦN 2 của `BAN-GIAO-TAT-CA-2026-08-08.md` — "kho quặng
> lớn nhất". Luật §0ae: sổ này cũng là ảnh chụp — nghi ngờ thì grep lại.
>
> **Kết quả đếm được: ~40 khẳng định ✅ đúng · 14 kho-chưa-mở 🟡 · ~25 ❌ thật · 12 chỗ SPEC
> NÓI SAI hiện trạng (cả 2 chiều).**

---

## §1 · 🟡 KHO CHƯA MỞ — code + test XONG, 0 nơi gọi (việc rẻ nhất, xếp theo đòn bẩy)

| # | Kho | Ở đâu | Mở khoá gì |
|---|---|---|---|
| 1 | **9 hàm build-ops + 60 test** (sweep·revolve/lathe·loft·bevelEx·chamfer·taper·fillet·arrayRadial·mirror) | `lib/three/build-ops.ts:285-626` | Chặn DUY NHẤT: `BuildOp` union `lib/cad/model.ts:449` chỉ có 3 biến thể. Thêm 4-5 biến thể + case trong `resolveGroupGeometry` (`build-ops.ts:96`) = mở TRỌN tầng ③④ SPEC-DUNG-BO-LENH-3D — chân bàn tiện, phào chỉ, ghế cong. **Đòn bẩy cao nhất toàn repo.** |
| 2 | **docContext + violations cho Vitals** — engine + cửa server + sanitize + test đủ | `lib/ai/doc-context.ts:89,161,203` · `lib/ai/violations-context.ts:75,104,127` · route `ai-assist-chat/route.ts:52-53` đã nhận | Client chỉ việc gửi thêm 2 field payload (`VitalsGesture.tsx:155` · `ProjectSelect.tsx:462`). Đây chính là "selection-aware" mà SPEC-VITALS-ROLE §3 gọi là *phần đáng giá nhất còn thiếu* — đã xây xong rồi. Chú thích `VitalsGesture.tsx:47-49` lỗi thời. |
| 3 | **`captureSequence()` xuất PNG sequence** | `lib/three/capture.ts:276` (+`planCaptureSequenceFrames:215`, campath đủ duration) | 1 nút Xuất = mở tầng ① SPEC-TRINH-VIDEO-EDITOR. SPEC-DUNG-CAMERA gọi là "khoảng trống thật lớn nhất". |
| 4 | **`/api/tasks` + `lib/server/tasks.ts`** — bảng ĐÃ migrate (`20260808000002`), cờ `TASK_TABLES_READY=true`, CRUD có test | `lib/server/tasks.ts:19,103+` · `app/api/tasks/` | 0 client gọi. Nền Gantt/Kanban/Lịch việc SẴN — thiếu đúng màn UI. (SPEC-GANTT-DATA §0 nói "chưa có model Task" là SAI từ 08/08.) |
| 5 | **`lib/cad/eyedropper.ts`** — ống hút thuộc tính MATCHPROP + test | cả module | SPEC-LENH-VE-IF §4 khuyết ① "rẻ mà được yêu nhất". Thiếu 1 nút dock + 2 click. |
| 6 | **`lib/commands/vcb.ts`** — gõ số sau thao tác, `3x` `/3`, 14 test | `parseVcbToken`+`applyVcbToMoveCopy` | Khuyết ② SPEC-LENH-VE-IF; thiếu wiring `lastOp` trong CadCanvas. |
| 7 | **Xuất V-Ray / D5 từ matId** | `lib/materials/export-vray.ts:87` · `export-d5.ts:53` (+2 file test) | 1 nút trong MaterialsScreen/tab Vật liệu = đóng SPEC-MATERIAL-PIPELINE §5 + VAT-LIEU-PBR §4.3. Moat matId. |
| 8 | **Lux/độ rọi L6** — tử số + mẫu số ĐỀU sẵn: `RoomLight.lumens` (`lighting.ts:87`) + `roomAreaM2` (`room.ts:30`) | thiếu đúng 1 hàm thuần `E=(Φ·n·UF·MF)/A` + hệ số phản xạ trên MaterialPbr | 2 spec gọi đây là moat và cả 2 đang ghi SAI rằng "đèn ngữ nghĩa chưa có" (có từ 05/08). |
| 9 | **Trích PDF cho brief** — `lib/notebook/extract.ts:30` (unpdf) chạy được | `AiBriefPanel.tsx` vẫn ô gõ tay | Bước ② SPEC-BRIEF-INTAKE = trỏ input file vào đường extract sẵn. |
| 10 | **`lib/commands/registry.ts` 97 alias, 4/6 mặt treo** | `registry.ts` (398 dòng) | Điền `icon` + `surfaces` = có dock/contextmenu/llm miễn phí; `CadEditor.run()` còn bản dispatch thứ hai. |
| 11 | **T2 ảnh dẫn xuất recipe** — 3 mảnh phụ thuộc đều sẵn (`setLinkedAssetSrc` · `boqFingerprint` · `ImageElement.assetId`) | thiếu field `recipe` + 1 nút "Làm mới từ bản vẽ" | SPEC-TRINH-ONG-KINH-DU-LIEU §3-T2. |
| 12 | **Thư viện + File Manager ruột mock** — `LIBRARY_DATA_IS_MOCK=true` (`shelves.ts:25`) · FM đọc `mock-data.ts` | trong khi `LibraryAsset` DB + `/api/library/[id]/file` + `real-fs.ts:136` đều chạy được | Đổi nguồn dữ liệu, không phải xây UI. |
| 13 | **`--accent-warm #c79a63`** chưa nối trạng thái cảnh báo Vitals | `globals.css:26` · `VitalsStateBadge.tsx` khung 4 trạng thái sẵn | 1 dây CSS. |
| 14 | **GuProfile** (`lib/gu.ts:132,192,210`) — cố ý chặn chờ Reference có projectId | giữ nguyên, ghi sổ để khỏi xây lại | — |

## §2 · 🔴 SPEC NÓI SAI HIỆN TRẠNG — phải gạch/cập nhật để khỏi "xây bản thứ hai"

**Chiều "spec nói CHƯA có → code ĐÃ có"** (nguy cơ xây lại):
1. `SPEC-3D-CORE:11` "three CHƯA trong package.json" → `three@0.185.1`; viewer **5 mode** (kể cả massing = 3D-5 push-pull đã xong).
2. `SPEC-MATERIAL-PIPELINE:100` "đèn ngữ nghĩa ⬜ CHƯA — thứ chặn" → `RoomLight` đủ kind/posMm/lumens/colorK từ 05/08.
3. `SPEC-TRINH-ONG-KINH-DU-LIEU` T1 "đề xuất chờ duyệt" → `getProjectDoc` (`project-doc.ts:52`) + BoqScreen đã làm y hệt.
4. `SPEC-EDITOR-TOOLKIT` §3 (+`AUDIT-EDITOR-TOOLKIT`) — align/distribute · mask ảnh · gradient/overlay · blend · shadow đều ghi ⬜ → **TẤT CẢ đã có + có UI gọi** (`align.ts:50,82` · `model.ts:217,318` · `text-fx.ts:69,79`).
5. `SPEC-VITALS-AI` §1.1 "⌘J ⬜ grep 0" → `StageSwitcher.tsx:207` đã làm.
6. `SPEC-VITALS-ROLE` §1 "thiếu trích dẫn RAG" → `rag.ts:129-144` + NotebookChatPanel đã có.
7. `SPEC-GANTT-DATA` §0 "CHƯA model Task / ExternalRef chưa migrate" → cả hai đã vào DB (migration `20260808000002`), schema nay 20 model.
8. `SPEC-BRIEF-INTAKE` §2⑥ perceptron — đúng là ĐÃ có (xác nhận), nhưng §5.3 "hạ tầng kệ sách đã có" là **SAI** (0 code).

**Chiều "spec chốt A → code đã đi B, spec chưa ghi"** (spec chết):
9. `SPEC-UI-SHELL` §1 + `SPEC-NAVIGATION-MODEL` sơ đồ: "Rail icon" — rail ĐÃ XOÁ 03/08 theo CAD-SHELL-V3 §2.1. Ai đọc UI-SHELL trước sẽ dựng lại rail.
10. `SPEC-NGON-NGU-CHI-DAN` §6.1 chốt tên "2D Kỹ thuật·3D Thiết kế·Trình bày" — code đã sang "Thiết kế 2D·Thiết kế 3D·Trình chiếu" (chốt 07/08 mới hơn); §6.2 chưa ghi vòng 5.
11. `SPEC-RENDER-STUDIO` §6 "thẻ = workflow.json+manifest.yaml" — kiến trúc đã đổi sang object TS (`task-cards.ts`, 11 thẻ).
12. `SPEC-CAD-SHELL-V3` trỏ mock `mock-cad-shell-v3.html` — file đã đổi tên `_cu`.

**Mâu thuẫn code-cãi-spec cần Hoà/TỔNG chốt lại:**
- `SPEC-COLLABORATION` §1 khẳng định ChatPanel "gắn theo flow, không phải kênh toàn công ty" → schema `ChatMessage` (prisma:246) **không có projectId/flowId**, API đọc toàn bộ — đúng thứ §1 cấm. Quyết: thêm projectId hay chấp nhận kênh chung.
- `SPEC-KNOWLEDGE-BASE` §5 "Neufert KHÔNG ship kèm app" → `lib/cad/standards/neufert.ts` ĐANG trong repo + registry. Cùng họ rủi ro GPL/Pantone — cần quyết trước phát hành.

## §3 · ❌ THẬT — chưa khởi công (không phải nối dây, là XÂY)

| Mảng | Chi tiết | Ghi chú |
|---|---|---|
| **3 editor hồ sơ** (Bảng vật liệu A3 · Văn bản · Video) | `docType` không tồn tại (`model.ts:474`) · `materialCard`=0 · màn chọn 5 loại = TODO(H4) (`PresentNavigator.tsx:16`) · video 0 component 0 dependency | Điểm chặn CHUNG = `docType` union + H4. Chốt 07/08 mục 8 đã bảo BỎ HOÃN H4. |
| **Chặng 0 Ý tưởng** | `lib/phases.ts:7` chỉ 3 chặng; route ideation không có; 6 template moodboard = 0 | Khoảng cách lớn nhất về khối lượng. Cần Hoà chốt: làm hay hạ backlog (3 spec khác đang tham chiếu như đã có). |
| **Camera mức V-Ray** | 2 điểm tụ·shift/tilt·DOF·safe frame·lưu view có tên = 0; tab Camera = PlaceholderTab; thiếu lens 18mm; khổ khung lệch chốt | Vùng phiếu p7 đang chạy — chuyển danh sách này cho p7. |
| **Cấu kiện tham số ⑥** | cầu thang 3 loại·trần thả·tủ bếp = nút mờ có lý do | Sau khi mở BuildOp union (§1#1). |
| **Inference màu + khoá ràng buộc** (SPEC-VE-INFERENCE) | 6 token `--snap-*`/`--axis-*` không có trong globals; `lockedSnap`/`axisLock`/`drawGuides`/`LastOp` = 0 | Phần lib xong nửa (vcb.ts §1#6), phần canvas 0%. Lưu ý: snap3d (3D) ĐÃ có token+khoá trục — 2D chưa. |
| **Cộng tác thật** | Comment đang ghi `comments-review.json` gốc repo (công cụ DEV), không model Prisma, không @mention, không "Việc của tôi", khách-qua-link bị chặn auth | Cả bậc N lẫn P của SPEC-COLLABORATION còn nguyên. |
| **§6C diện đồ nội thất** | smart mirror·symmetry·rectification·FurnitureShapeMemory = 0 | `single-view-metrology.ts` là việc KHÁC, đừng nhầm "đã có". |
| **4 chế độ hiển thị vùng tô** · **Triplanar/normal-from-photo/batch-PBR** · **glTF/OBJ import** · **Function-calling/voice cho Vitals** · **Coach mark seen:*** | đều 0 hit | Nhỏ hơn, xếp sau. |
| **FM/Files desktop-idiom** | `onContextMenu`/`shiftKey`/`onKeyDown` vẫn 0 hit · `max-width:1440px` còn (`files-mock-css.ts:18`) · view mặc định 'grid' trái chốt §5 | 3 lỗi "1 dòng" spec tự nêu từ 01/08, chưa chữa. |

## §4 · Đính chính sổ cũ (đã vá trong phiên này)

- `soi-that.mjs` đã vá 2 lỗi (dòng ⬜/❌/THÊM + nơi gọi cùng file) → nay **26 ✅ / 0 🟡 / 5 ❌** (5 ❌ đều giải thích xong: đổi tên/chữ bảng; `openingsWidthOnBoundary` đã VIẾT hôm 08/08).
- `BAN-GIAO-TAT-CA` PHẦN 1: 3 dòng 🟡 đều là báo động giả (`drawSnap` gọi tại `CadCanvas.tsx:2360`, `DRAG_ACTIVE_THRESHOLD_PX` tại `Element.tsx:205`); dòng `DUONG-VE-DICH-3-DOT.md:73` "114 lệnh ❌" đã xác nhận SAI từ bàn giao.

> Bảng chi tiết từng dòng của 4 nhóm nằm trong transcript phiên 08/08 (4 agent). File này giữ
> phần TỔNG HỢP đủ hành động; cần bằng chứng dòng nào thì grep theo file:dòng đã ghi.
