# ĐO ENGINE IF THEO CÁC MẢNH CẤU THÀNH — 17/08/2026 (phiên Đ1)

> **Phạm vi:** đo `lib/` toàn bộ, đối chiếu với `app/` + `components/`. CHỈ ĐỌC, không sửa gì.
> **Cách đo cột "đã nối lên giao diện":** dựng **đồ thị import thật** — trích mọi
> `from/import/require`, **resolve đường dẫn** (`@/…` và cả tương đối `../…`) về tệp đích, rồi
> đếm nơi gọi. Loại trừ `.claude/worktrees/`, `node_modules`, `.next`, và mọi `*.test.*`.
> Script đo nằm ở scratchpad phiên, **không ghi vào repo**.

---

## 0 · ĐÍNH CHÍNH TRƯỚC KHI ĐỌC BẢNG — LÀ **8 TRỤ**, KHÔNG PHẢI 7 MẢNH

Phiếu giao việc nói "7 mảnh cấu thành". Mở `docs/HOP-DONG-PHOI-HOP-T.md` **§6** (dòng 208-226):
tiêu đề nguyên văn là **"BẢNG SỨC KHOẺ APP — 8 trụ T phải cân"**, và bảng liệt kê **đúng 8 dòng**.
Không có chỗ nào trong repo khai "7 mảnh".

⇒ Bản đo này dùng **8 trụ, đúng tên §6 khai**, không ép cho vừa 7. Nếu ép xuống 7 thì phải gộp
hai trụ lại — và gộp trụ nào cũng làm hỏng chính công dụng của bảng (trụ nào đói 2 đợt liên tiếp
= cảnh báo đỏ; gộp là mất khả năng chỉ đích danh).

**Tám tên chuẩn:** ①Nền dữ liệu ②Đấu nối ③Luồng nghiệp vụ ④Giao diện & design system
⑤Chất lượng đầu ra ⑥Vận hành & an toàn ⑦Hiệu năng & bền ⑧Tri thức ngành.

---

## 1 · SỐ TỔNG

| | |
|---|---|
| Module `lib/` cấp 1 (thư mục con + tệp rời) | **94** |
| Tệp `.ts/.tsx` trong `lib/` (không test) | **448** |
| Tổng dòng `lib/` (không test) | **90.300** |
| Route trang (`app/**/page.tsx`) | 25 |
| Route API (`app/api/**/route.ts`) | 63 |
| Component (`components/**/*.tsx`) | 268 |

**Trạng thái ở cấp MODULE (94):**

| Trạng thái | Số | % | Dòng |
|---|---|---|---|
| 🟢 **SỐNG** — ≥1 nơi trong `app/` hoặc `components/` gọi | **84** | 89% | ~85.100 |
| 🔵 **CHỈ NỘI BỘ** — chỉ lib khác gọi, không lên tới mặt | **7** | 7% | 2.301 |
| 🔴 **KHO CHƯA MỞ** — 0 nơi gọi ngoài test của chính nó | **3** | 3% | **3.702** |

**Trạng thái ở cấp TỆP** (thô hơn, đây mới là chỗ lộ vấn đề): **21 tệp** có **0 nơi gọi bất kỳ**,
tổng **2.106 dòng** — trong đó 4 tệp là worker/khai báo kiểu (hợp lệ, xem §4).

---

## 2 · BẢNG THEO TỪNG TRỤ

Ghi chú cột: **ui** = số tệp trong `app/`+`components/` import · **lib** = số tệp lib khác import.
Trạng thái: 🟢 SỐNG · 🔵 CHỈ NỘI BỘ · 🔴 KHO CHƯA MỞ.

### TRỤ ① — NỀN DỮ LIỆU (schema · migration · backup · provenance)

| Engine | Dòng | Làm việc gì (nghiệp vụ) | Nhóm tác vụ | TT | Màn |
|---|---|---|---|---|---|
| `lib/cad/model.ts` | 1.466 | Định nghĩa **bản vẽ là gì** — tường/sàn/trần/phòng/cấu kiện, kèm `BuildOp`/`BuildRecipe` | Nguồn sự thật `.idf` | 🟢 ui=33 lib=79 | `/projects/[id]/cad`, `/api/boq` |
| `lib/store.ts` | 1.257 | Trạng thái toàn app (dự án đang mở, chặng, ngôn ngữ, phiên) | Nền toàn app | 🟢 ui=87 | mọi màn |
| `lib/present-editor/model.ts` | 758 | Định nghĩa **hồ sơ trình bày là gì** — slide, element, brand kit | Nguồn sự thật `.idfp` | 🟢 ui=18 lib=28 | `/projects/[id]/present` |
| `lib/cad/idfc.ts` | 438 | Đọc/ghi **một cấu kiện** `.idfc` + bảng nâng cấp phiên bản | Thư viện cấu kiện | 🟢 ui=2 | `/library` |
| `lib/cad/auto-backup.ts` | 341 | Tự sao lưu bản vẽ theo nhịp, chọn thư mục đích | Đường lùi dữ liệu | 🟢 ui=3 | modal khôi phục |
| `lib/cad/backup-diff.ts` | 334 | So hai bản sao lưu, chỉ ra cái gì đã đổi trước khi khôi phục | Đường lùi dữ liệu | 🟢 ui=2 | modal khôi phục |
| `lib/cad/idf.ts` | 245 | Đóng/mở tệp dự án `.idf` + `IDF_MIGRATIONS` | Nguồn sự thật | 🟢 ui=1 lib=5 | `CadSheets` |
| `lib/sheets-persist.ts` | 284 | Giữ bố cục sheet qua các phiên làm việc | Bền dữ liệu | 🟢 ui=3 | `/cad` |
| `lib/cad/ifpack.ts` | 216 | Gói/bung `.ifpack` (ảnh hiện trường kèm bản vẽ) | Trao đổi tệp | 🟢 ui=1 | `CadSheets` |
| `lib/types.ts` | 201 | Kiểu dùng chung xuyên tầng | Hợp đồng dữ liệu | 🟢 ui=12 lib=20 | — |
| `lib/disk-sync.ts` | 196 | Quyết định **đĩa hay DB là nguồn sự thật** khi hai bên lệch | Local-first | 🟢 ui=2 | — |
| `lib/cad/sheet-migrate.ts` | 182 | Nâng cấp bản vẽ cũ sang cấu trúc sheet mới | Migration | 🟢 ui=1 | `CadSheets` |
| `lib/dna/store.ts` + `types.ts` | 177 | Lưu Thẻ DNA thiết kế của dự án | Gu dự án | 🟢 ui=3 | `/api/projects/[id]/dna` |
| `lib/root-folder.ts` | 248 | Thư mục gốc dự án trên đĩa | Local-first | 🟢 ui=4 | `/settings` |
| `lib/ffe/item.ts` | 261 | **Hợp đồng "một món đồ rời"** — chỗ duy nhất mô tả FF&E | Nền cho BOQ/thư viện | 🔵 lib=7 | — |
| `lib/library/db-items.ts` + `idfc-store.ts` | 201 | Đọc/ghi mục thư viện | Master Library | 🟢 ui=3 | `/library` |
| `lib/flow-version-retention.ts` | 51 | Giữ bao nhiêu bản cũ trước khi dọn | Bền dữ liệu | 🟢 ui=1 | — |

**Đọc trụ ①: NO.** Mọi engine nền đều có mặt tiền. Chỗ duy nhất đứng lửng là `lib/ffe/item.ts`
(261 dòng, hợp đồng "món rời") — nó *có* nơi gọi trong lib nhưng chưa lên tới màn nào.

---

### TRỤ ② — ĐẤU NỐI (dây ĐỌC/NUÔI giữa các tính năng)

| Engine | Dòng | Làm việc gì | Nhóm tác vụ | TT | Màn |
|---|---|---|---|---|---|
| `lib/nodes/registry.ts` | 1.129 | Sổ node — mỗi việc sáng tạo là gì, ăn gì, đẻ ra gì, tốn bao nhiêu credit | Sổ lệnh node | 🟢 ui=10 | `/projects/[id]/render` |
| `lib/commands/registry.ts` | 550 | **Sổ lệnh chung** — một nguồn cho tooltip/⌘K/toolbar | Sổ lệnh chung | 🟢 ui=1 | `AppCommandPalette` |
| `lib/commands/toolbar-source.ts` | 268 | Thanh công cụ **đọc từ** sổ lệnh thay vì tự khai danh sách | Sổ lệnh chung | 🟢 ui=3 | `CadToolbar` |
| `lib/three/cad-to-obj.ts` | 834 | Biến bản vẽ 2D thành cảnh 3D — **cây cầu chặng 1↔2** | Liên chặng | 🟢 ui=8 lib=10 | `/render`, dev-bench |
| `lib/cad/handoff.ts` + `present-handoff.ts` | 266 | Chuyển việc từ chặng này sang chặng kia mang theo ngữ cảnh | Liên chặng | 🟢 ui=6 | `ProjectSelect`, `CadEditor` |
| `lib/present-editor/handoff.ts` | 189 | Nhận kết quả node vào deck | Liên chặng | 🟢 ui=3 | `NodeExtras` |
| `lib/photo-editor/handoff.ts` | 132 | Ảnh sửa xong quay lại luồng chính | Liên chặng | 🟢 ui=2 | `PhotoEditorScreen` |
| `lib/materials/impact.ts` | 180 | **Đổi một vật liệu thì những đâu đổi theo** | Đồng bộ vật liệu | 🟢 ui=1 | `MaterialImpactPreview` |
| `lib/materials/resolve.ts` | 61 | Từ `matId` tra ra vật liệu thật | Đồng bộ vật liệu | 🟢 ui=1 lib=1 | `/materials` |
| `lib/boq/from-project.ts` | 73 | Bản vẽ → khối lượng → BOQ | Liên chặng | 🟢 ui=1 | `/api/boq/[projectId]` |
| `lib/tasks/focus-entity.ts` | 79 | Bấm một việc thì nhảy đúng đối tượng trong bản vẽ | Dây việc–ngữ cảnh | 🟢 ui=4 | `CadCanvas` |
| `lib/tasks/context.ts` | 47 | Tạo việc từ nơi đang đứng, tự gắn ngữ cảnh | Dây việc–ngữ cảnh | 🟢 ui=1 | `TaskBoardScreen` |
| `lib/gateway/detect.ts` + `route.ts` | 181 | Nhận tệp lạ, định tuyến về đúng đường xử lý | Cửa nhập | 🟢 ui=8 | `CadEditor` |
| `lib/integrations/*` (18 tệp) | 1.356 | Nối Lark/OAuth ngoài, chống vòng lặp đồng bộ | Hệ ngoài | 🟢 ui=11 | `/api/atlas-materials`, `/api/colors` |
| `lib/nodes/dinh-nghia-ket-qua.ts` | 90 | **Kết quả node mang sẵn định nghĩa** để nối tiếp | Cửa sổ công cụ | 🟢 ui=2 | `InteriorNode` |
| `lib/rna/material-pbr.rna.ts` + `types.ts` | 199 | Panel **tự sinh từ định nghĩa** (IF-RNA v0) | Lan-một-chỗ | 🟢 ui=3 | `MaterialPbrEditor` |
| `lib/distill/engine.ts` | 60 | **Máy chưng cất chung** — nhiều nguồn có gốc → dữ liệu có cấu trúc + cờ | Engine dùng chung | 🔵 lib=2 | — |
| `lib/shell/last-stage.ts` | 42 | Nhớ chặng đang dở của từng dự án | Điều hướng | 🟢 ui=2 | `ProjectSelect` |
| `lib/execution.ts` | 307 | Chạy chuỗi node theo dây | Máy chạy flow | 🟢 ui=9 | `FlowCanvas` |

**Đọc trụ ②: NO nhưng có một lỗ tên tuổi.** Dây liên chặng đủ và sống. Nhưng
`lib/distill/engine.ts` — cỗ máy chưng cất mà `00-CHOT` 12/08 khai là **lõi chung cho 3-5 mặt tiền**
(Thẻ DNA · auto-define · Company DNA Pack · dàn ý chờ sẵn · slot furniture) — hiện **chỉ có
1 mặt tiền thật** (`lib/dna/distiller.ts` → `DesignDnaCardPanel`). Bốn mặt tiền còn lại vẫn là chữ.

---

### TRỤ ③ — LUỒNG NGHIỆP VỤ (người dùng đi trọn kịch bản)

| Engine | Dòng | Làm việc gì | Nhóm tác vụ | TT | Màn |
|---|---|---|---|---|---|
| `lib/cad/store.ts` | 1.037 | Trạng thái phiên vẽ — công cụ đang chọn, lớp, mode, undo | Vẽ 2D | 🟢 ui=43 | `/cad` |
| `lib/cad/commands.ts` | 875 | Lệnh vẽ: tường, cửa, kích thước, ghi chú | Vẽ 2D | 🟢 ui=4 | `CadCanvas` |
| `lib/cad/modify.ts` | 679 | Sửa hình: dời/xoay/chép/lặp lưới/đối xứng | Vẽ 2D | 🟢 ui=1 | `CadCanvas` |
| `lib/cad/query.ts` | 398 | Bắt điểm, dò đối tượng dưới con trỏ | Vẽ 2D | 🟢 ui=1 | `CadCanvas` |
| `lib/cad/plan-present.ts` | 681 | Mặt bằng thành hình trình bày được | Vẽ 2D → Trình bày | 🟢 ui=2 | `CadCanvas` |
| `lib/cad/ai-assist.ts` | 652 | Đề bài chữ → phương án bố trí nháp | Vào việc | 🟢 ui=1 | `AiBriefPanel` |
| `lib/cad/workstation-clusters.ts` | 645 | Cụm bàn làm việc dựng sẵn theo tham số | Bố trí nhanh | 🟢 ui=2 | `ClusterPanel` |
| `lib/present-editor/templates.ts` | 1.471 | Kho mẫu trang hồ sơ | Trình bày | 🟢 ui=2 | `LayoutShelf` |
| `lib/present-editor/pdf-import.ts` | 1.077 | **PDF → deck sửa được 3 lớp** (Smart Convert bậc 1) | Nhập hồ sơ | 🟢 ui=1 | `Toolbar` |
| `lib/present-editor/pptx-import.ts` | 860 | PPTX → deck IF | Nhập hồ sơ | 🟢 ui=1 | `Toolbar` |
| `lib/present-editor/story-set.ts` | 607 | **Bộ hồ sơ kể chuyện** (hero output) | Trình bày | 🟢 ui=1 | `PresentSheets` |
| `lib/present-editor/reflow.ts` | 269 | Đổi khổ A3↔A4, ngang↔dọc thì bố cục tự chạy lại | Trình bày | 🟢 ui=1 | `PresentEditor` |
| `lib/nodes/cua-so-cong-cu.ts` + `-ui.ts` | 473 | **Cửa sổ công cụ trên canvas** — 3 nấc, nhiều cụm cùng lúc | Chặng 3D/Node | 🟢 ui=8 | `HopCongCuBamVat`, `CuaSoCongCu` |
| `lib/nodes/macro.ts` | 146 | Gói một chuỗi node thành một lệnh | Chặng 3D/Node | 🟢 ui=2 | `MacroCreateDialog` |
| `lib/photo-editor/*` (7 tệp) | 1.033 | Sửa ảnh trong app: lớp, mask, chỉnh sáng | Chặng 3D | 🟢 ui=8 | `/photo` |
| `lib/home/*` (6 tệp) | 747 | Dòng Studio: tổng hợp, chào theo giờ, ghi chú, ảnh tuần | Tổng quan | 🟢 ui=11 | `/` |
| `lib/library/use-library-sheet.ts` | 113 | Mở/đóng/lọc tấm Thư viện | Thư viện | 🟢 ui=10 | `/library` |
| `lib/notebook/*` (6 tệp) | 569 | Nạp tài liệu dự án → hỏi đáp có trích nguồn | Vitals RAG | 🟢 ui=10 | `/api/notebook` |
| `lib/filemanager/*` (6 tệp) | 640 | Duyệt tệp thật trên đĩa | Files | 🟢 ui=5 | `/files`, `/settings` |
| `lib/tasks/board.ts` + `scaffolder.ts` | 201 | Bảng việc + dựng khung việc cho dự án mới | Bảng việc | 🟢 ui=2 | `/tasks` |
| `lib/vision/single-view-metrology.ts` | 966 | **Đo vật thật từ MỘT tấm ảnh** (tiêu cự, điểm tụ, chân trời) | Đo từ ảnh | 🟢 ui=1 | `ToolModeForm` |
| `lib/vision/match-template.ts` | 496 | So khớp mẫu trên ảnh | Đo từ ảnh | 🟢 ui=1 | `ToolModeForm` |
| `lib/ho-so-song/pack.ts` | 167 | Gói hồ sơ sống `.zip` 3 tầng thoái lui | Bàn giao | 🟢 ui=2 | `Toolbar` |
| **`lib/idfc-import/*` (5 tệp)** | **3.339** | **Ảnh sản phẩm → mesh 3D → cấu kiện `.idfc` có tham số** | Cấu kiện từ ảnh | 🔴 **ui=0 lib=0** | **KHÔNG CÓ** |
| `lib/grounded-render/*` (3 tệp) | 408 | Render bám ý: phiếu 4 cấp + sinh từng mảng qua mask | Chặng 3D | 🔵 lib=1 | chỉ tới node def |

**Đọc trụ ③: ĐÓI Ở ĐÚNG CHỖ ĐẮT NHẤT.** Xem §3.

---

### TRỤ ④ — GIAO DIỆN & DESIGN SYSTEM

| Engine | Dòng | Làm việc gì | Nhóm tác vụ | TT | Màn |
|---|---|---|---|---|---|
| `lib/adaptive-contrast.ts` | 631 | Giữ chữ đọc được trên mọi nền | a11y màu | 🟢 ui=5 | `SystemWallpaper` |
| `lib/wallpaper/*` (6 tệp) | 819 | Nền ảnh theo giờ, đọng sáng, tuỳ chọn | Nền app | 🟢 ui=2 | `SystemWallpaper` |
| `lib/colors/*` (8 tệp) | 881 | Kho màu hãng: nhập, đăng ký, xu hướng, khai giới hạn độ chính xác | Kho màu | 🟢 ui=5 | `/colors` |
| `lib/motion.ts` | 243 | Nhịp chuyển động chung (spring, reduce-motion) | Motion | 🟢 ui=49 | mọi màn |
| `lib/motion-apple.ts` | 141 | Ba preset spring theo chuẩn Apple | Motion | 🟢 ui=3 | — |
| `lib/ui/tien-trinh.ts` | 182 | **Thanh tiến trình 2 loại** — bịa % là `tsc` đỏ | Trạng thái | 🟢 ui=3 | `CameraExportTab` |
| `lib/ui/tooltip-position.ts` | 40 | Ô giải nghĩa đặt bên cạnh, tự lật khi hết chỗ | Ô giải nghĩa | 🟢 ui=1 | `Tooltip` |
| **`lib/ui/thao-tac-glyph.tsx`** | **240** | **Kho 6 hình minh hoạ thao tác** cho ô giải nghĩa | Ô giải nghĩa | 🔴 **ui=0 lib=0** | **KHÔNG CÓ** |
| `lib/i18n.ts` + `lang.ts` | 50 | Song ngữ VI/EN | Toàn app | 🟢 ui=135 | mọi màn |
| `lib/useDismissable.ts` | 100 | Một họ sự kiện đóng lớp cho toàn app | Hạ tầng UI | 🟢 ui=33 | mọi màn |
| `lib/input/wheel.ts` + `stage-drop.ts` | 334 | Cuộn/zoom/thả giữa các chặng | Con trỏ | 🟢 ui=5 | `FlowCanvas` |
| `lib/kbd.ts` + `shortcuts.ts` | 268 | Phím tắt | Bàn phím | 🟢 ui=7 | — |
| `lib/shell/mode-registry.ts` | 72 | Sổ mode theo chặng | Vỏ app | 🟢 ui=2 | `HomeScreen` |
| `lib/avatar.ts` | 334 | Dựng ảnh đại diện | Cá nhân | 🟢 ui=6 | `/settings/avatar` |
| `lib/breakpoints.ts` | 82 | Ngưỡng khổ màn | Mật độ | 🟢 ui=1 | — |
| **`lib/wallpaper/contrast.ts`** | **171** | **Đo tương phản TẠI CHÂN CHỮ** (không đo trung bình cả thẻ) | a11y màu | 🔴 **0 nơi gọi** | **KHÔNG CÓ** |

**Đọc trụ ④: NO về số lượng, nhưng hai kho vừa dựng xong chưa cắm điện** — `thao-tac-glyph.tsx`
(240 dòng, dựng 16/08) và `wallpaper/contrast.ts` (171 dòng). Cả hai đúng loại "dây đã nối, chưa có
dòng điện" mà `00-CHOT` đã tự khai — bản đo này xác nhận bằng số.

---

### TRỤ ⑤ — CHẤT LƯỢNG ĐẦU RA (LUẬT `CHUAN-DAU-RA-NGHE`)

| Engine | Dòng | Làm việc gì | Nhóm tác vụ | TT | Màn |
|---|---|---|---|---|---|
| `lib/cad/dxf.ts` | 1.802 | Đọc/ghi DXF — trao đổi với AutoCAD | Xuất/nhập CAD | 🟢 ui=1 lib=5 | `CadEditor` |
| `lib/cad/pdf.ts` | 748 | Xuất bản vẽ ra PDF đúng khung tên, tỉ lệ, font có dấu | Xuất bản vẽ | 🟢 ui=2 | `CadEditor` |
| `lib/cad/render.ts` | 705 | Vẽ bản vẽ lên màn/giấy | Xuất bản vẽ | 🟢 ui=4 | `CadCanvas` |
| `lib/cad/dxf-plan.ts` | 432 | Mặt bằng ra DXF | Xuất/nhập CAD | 🟢 ui=1 | `CadEditor` |
| **`lib/cad/label-placer.ts`** | **642** | **Nhãn không đè hình, không đè nhau** — LUẬT §1 "Chữ & nhãn" | Cổng chuẩn đầu ra | 🔵 lib=3 | qua `pdf.ts` |
| `lib/print/export-checks.ts` | 180 | **Cổng `CHUAN_DAU_RA`** — chặn lúc xuất nếu sai chuẩn | Cổng chuẩn đầu ra | 🟢 ui=1 | `CadSheets` |
| `lib/boq/xlsx.ts` | 429 | BOQ ra Excel có công thức thật | Xuất BOQ | 🟢 ui=2 | `Toolbar` |
| `lib/present-editor/export.ts` | 418 | Xuất deck ra PDF/PPTX/PNG | Xuất hồ sơ | 🟢 ui=2 | `PresentEditor` |
| `lib/present-editor/print-upscale.ts` | 279 | Phóng ảnh đạt ≥300dpi khi in | Xuất hồ sơ | 🟢 ui=1 | `PresentEditor` |
| `lib/present-editor/text-contrast.ts` | 214 | Chữ trên ảnh phải đọc được | Xuất hồ sơ | 🟢 ui=2 | `EditorCanvas` |
| `lib/present-editor/layout-check.ts` | 100 | Soi bố cục trước khi xuất | Cổng chuẩn đầu ra | 🟢 ui=1 | `PresentEditor` |
| `lib/pptx.ts` | 375 | Dựng tệp PPTX chữ sửa được | Xuất hồ sơ | 🟢 ui=2 | — |
| **`lib/pptx-font-embed.ts`** | **417** | Nhúng font có dấu vào PPTX | Xuất hồ sơ | 🔵 lib=2 | qua `pptx.ts` |
| **`lib/pptx-zip-fonts.ts`** | **178** | Ghép font vào ruột zip của PPTX | Xuất hồ sơ | 🔵 lib=1 | qua `pptx-font-embed` |
| **`lib/pdf-font.ts`** | **243** | Nhúng font tiếng Việt vào PDF | Xuất bản vẽ | 🔵 lib=2 | qua `cad/pdf.ts` |
| `lib/slides.ts` | 358 | Dựng slide từ nội dung | Xuất hồ sơ | 🟢 ui=3 lib=12 | — |
| **`lib/slide-templates.ts`** | **228** | **Bộ preset trình bày khai bằng token** (chống slide lệch) | Xuất hồ sơ | 🔴 **ui=0 lib=0** | **KHÔNG CÓ** |
| `lib/three/capture.ts` | 347 | Chụp chuỗi PNG từ cảnh 3D | Xuất ảnh | 🟢 ui=3 | dev-bench, `CameraExportTab` |
| `lib/ho-so-song/viewer-template.ts` | 219 | Trình xem HTML tự chứa trong gói hồ sơ | Bàn giao | 🔵 lib=1 | qua `pack.ts` |
| **`lib/moodboard-collage.ts`** | **418** | Dựng trang moodboard editorial ngay trong trình duyệt | Xuất hồ sơ | 🔵 lib=1 | qua node def |

**Đọc trụ ⑤: NO về đường chính, ĐÓI về mặt tiền.** Đường xuất PDF/PPTX/XLSX đều sống. Nhưng
**5/20 engine của trụ này không có nút nào** — trong đó `slide-templates.ts` là **kho chưa mở
tuyệt đối**, và nó chính là thứ sinh ra để chống lỗi *"bố cục tự chuyển khổ đang bị lỗi"*
(Hoà báo 07/08 mục 4).

---

### TRỤ ⑥ — VẬN HÀNH & AN TOÀN

| Engine | Dòng | Làm việc gì | Nhóm tác vụ | TT | Màn |
|---|---|---|---|---|---|
| `lib/server/auth.ts` | 234 | Xác thực mọi route API | Bảo mật | 🟢 ui=57 | 63 route API |
| `lib/server/access.ts` | 87 | Ai được đọc/sửa dự án nào | Phân quyền | 🟢 ui=10 | route API |
| `lib/server/access-policy.ts` | 49 | Luật phân quyền thuần (test được) | Phân quyền | 🔵 lib=1 | — |
| `lib/server/auth-policy.ts` | 43 | Luật xác thực thuần | Bảo mật | 🔵 lib=1 | — |
| `lib/server/oauth.ts` | 31 | Đăng nhập Apple/Microsoft | Bảo mật | 🟢 ui=6 | `/api/auth/*` |
| `lib/server/credits.ts` | 98 | Đếm và chặn credit trước khi chạy job | Chi phí | 🟢 ui=3 | `/api/credits` |
| `lib/server/mime-sniff.ts` | 66 | Ngửi kiểu tệp thật, không tin phần mở rộng | An toàn tệp | 🟢 ui=4 | `/api/library/[id]/file` |
| `lib/legal/gpl-3-0-text.ts` + `third-party-licenses.ts` | 765 | Trang giấy phép trong app | Pháp lý phát hành | 🟢 ui=1 | `/settings/licenses` |
| `lib/integrations/crypto.ts` | 48 | Mã hoá token hệ ngoài | Bảo mật | 🔵 lib=1 | — |
| `lib/integrations/anti-loop.ts` | 59 | Chặn vòng lặp đồng bộ hai chiều | Hệ ngoài | 🔵 lib=1 | — |
| `lib/library/gallery-source-guard.ts` | 51 | Chặn ảnh không rõ nguồn vào Gallery | Trung tính | 🟢 ui=1 | `GalleryLienNganh` |
| `lib/gateway/capabilities.ts` | 96 | Khai máy này làm được gì (Electron/web) | Nền tảng | 🔵 lib=1 | — |
| **`lib/ai/web-lookup.ts`** | **355** | **Tra web theo DOMAIN TRẮNG** — không đẩy nội dung dự án ra ngoài khi chưa khai | NDA/bảo mật | 🔴 **0 nơi gọi** | **KHÔNG CÓ** |
| **`lib/integrations/providers/*`** (7 tệp: google · ms365 · youtube · zalo · zoom · spotify · applemusic · team) | **213** | Khai nhà cung cấp ngoài | Hệ ngoài | 🔴 **0 nơi gọi** | **KHÔNG CÓ** |
| **`lib/integrations/providers/lark-write.ts`** | **65** | Ghi ngược vào Lark | Hệ ngoài | 🔴 **0 nơi gọi** | **KHÔNG CÓ** |

**Đọc trụ ⑥: NO ở phần sống còn** (auth phủ 57 nơi, access phủ 10). Phần đói là các nhà cung cấp
ngoài khai sẵn mà chưa nối — thấp rủi ro, nhưng `web-lookup.ts` (355 dòng, cơ chế NDA) nằm không
là đáng tiếc vì nó là **rào an toàn**, không phải tính năng.

---

### TRỤ ⑦ — HIỆU NĂNG & BỀN

| Engine | Dòng | Làm việc gì | Nhóm tác vụ | TT | Ghi chú |
|---|---|---|---|---|---|
| `lib/cad/dwg-worker.ts` | 349 | Đọc DWG trong luồng riêng, cô lập GPL | Nhập nặng | ⚪ nạp qua `new Worker(new URL)` | **không phải kho chết** |
| `lib/cad/dxf-worker.ts` | 37 | Đọc DXF trong luồng riêng | Nhập nặng | ⚪ nạp từ `dxf-open.ts:40` | **không phải kho chết** |
| `lib/cad/dwg-map.ts` | 782 | Ánh xạ DWG thô → `Doc`, bung block | Nhập nặng | 🔵 lib=1 | tách để test được |
| `lib/three/bvh.ts` | 58 | Tăng tốc dò tia trong cảnh 3D | 3D nặng | 🟢 ui=1 | `Scene3DViewer` |
| `lib/three/build-ops.ts` | 702 | Chạy ngăn xếp lệnh dựng + **cache trong module, không ghi vào `.idf`** | 3D dựng | 🔵 lib=3 | qua `build-recipe.ts` |
| `lib/boq/cache.ts` | 104 | Nhớ kết quả BOQ, không tính lại | Tính nặng | 🔵 lib=2 | — |
| `lib/present-editor/upscale-cache.ts` | 82 | Nhớ ảnh đã phóng | Xuất nặng | 🔵 lib=1 | — |
| `lib/images/smart-ingest.ts` | 272 | Gốc bất biến + proxy nhẹ để hiển thị | Nhập nặng | 🟢 ui=3 | `FlowCanvas` |
| `lib/cad/cad3d-autosave.ts` + `-core.ts` | 204 | Tự lưu cảnh 3D | Bền | 🟢 ui=1 | `Render3DModeSkeleton` |
| `lib/usePageVisible.ts` | 30 | Dừng việc nền khi tab ẩn | Hiệu năng | 🟢 ui=3 | — |

**Đọc trụ ⑦: MỎNG NHẤT VỀ SỐ LƯỢNG (10 engine, ~2.600 dòng) nhưng không phải đói —** đây là trụ
mà ít code là bình thường. ⚠️ Lưu ý đo: **2 worker KHÔNG phải kho chết**, chúng nạp qua
`new Worker(new URL(...))` nên đồ thị import tĩnh không thấy. Ai đọc bản đo này mà cắt chúng đi
là làm hỏng đường nhập DWG/DXF.

---

### TRỤ ⑧ — TRI THỨC NGÀNH

| Engine | Dòng | Làm việc gì | Nhóm tác vụ | TT | Màn |
|---|---|---|---|---|---|
| `lib/cad/standards/` (13 tệp) | **2.165** | 13 bộ luật ngành: PCCC · thoát hiểm · tiếp cận · điện · chiếu sáng · nhà ở · ISO · Neufert · quốc tế | Kiểm chuẩn | 🟢 qua `checker.ts` | `AiBriefPanel` |
| ├ `standards/checker.ts` | 577 | Chạy luật lên bản vẽ, **chỉ trả đề xuất, không tự sửa** | Kiểm chuẩn | 🟢 ui=5 lib=14 | `AiBriefPanel` |
| ├ `standards/registry.ts` | 288 | Sổ luật + đè theo vùng miền | Kiểm chuẩn | 🟢 ui=2 lib=15 | — |
| ├ `standards/fix-suggest.ts` | 153 | Gợi cách sửa cho từng vi phạm | Kiểm chuẩn | 🟢 ui=1 | `CadEditor` |
| └ 10 bộ luật con (`vn-fire`, `vn-accessibility`, `neufert`, `intl-egress`…) | ~1.100 | Điều khoản có mã, nguồn, ngày hiệu lực | Kiểm chuẩn | 🔵 qua registry | — |
| `lib/cad/standards-report.ts` | 412 | Báo cáo kiểm chuẩn cho hồ sơ | Kiểm chuẩn | 🟢 ui=1 | `CadEditor` |
| `lib/review/` (7 tệp) | 747 | **Khung kiểm 2 lớp** — luật (đỏ, dẫn điều khoản) tách khỏi góp ý (tím, không chặn) | Kiểm 3 chặng | 🟢 ui=1 (chỉ `index.ts`) | `ReviewPanel` |
| ├ `review/hien-thi-luat.ts` | 244 | Hai chế độ Ngắn ↔ Đầy đủ + trục nguồn | Kiểm 3 chặng | 🔵 lib=1 | — |
| ├ `review/luat/rules-3d.ts` | 201 | Luật đo được cho chặng 3D | Kiểm 3 chặng | 🔵 lib=1 | — |
| └ `review/luat/cad.ts` · `deck.ts` · `gopy/` | 122 | Luật 2D · luật deck · lớp góp ý AI | Kiểm 3 chặng | 🔵 lib=1 | — |
| `lib/materials/schema.ts` | 144 | 14 thông số PBR chuẩn glTF | Vật liệu | 🟢 ui=3 lib=11 | `MaterialPbrEditor` |
| `lib/materials/pbr-from-category.ts` | 89 | Suy PBR từ loại vật liệu | Vật liệu | 🟢 ui=1 | `MaterialPbrEditor` |
| `lib/materials/export-vray.ts` + `export-d5.ts` | 200 | Dịch vật liệu sang V-Ray/D5 | Vật liệu | 🟢 ui=2 | `MaterialPbrEditor` |
| `lib/materials/ba-mat.ts` | 214 | Ba mặt của một vật liệu | Vật liệu | 🟢 ui=4 | `BaMatPanel` |
| `lib/gu/pairwise-perceptron.ts` | 183 | Học gu bằng so từng cặp | Gu | 🟢 ui=3 | `AiBriefPanel` |
| `lib/gu/color-psychology.ts` | 360 | Tri thức màu theo công năng phòng | Gu | 🔵 lib=6 | — |
| `lib/gu/pantone.ts` | 131 | Tra mã màu hãng | Gu | 🟢 ui=1 | `ColorMatchPanel` |
| `lib/cad/mep-suggest.ts` | 366 | Gợi ý điện nước theo bố trí | Kỹ thuật | 🟢 ui=1 | `CadEditor` |
| `lib/cad/dossier-check.ts` | 169 | Soi hồ sơ đủ chưa | Kiểm hồ sơ | 🟢 ui=1 | `AiBriefPanel` |
| `lib/cad/element-infer.ts` | 164 | Suy loại cấu kiện khi người dùng chưa khai | Cờ 3 nấc | 🔵 lib=1 | — |
| `lib/boq/compute.ts` | 588 | Quét bản vẽ → gộp vùng theo vật liệu → thành tiền | BOQ | 🔵 lib=1 | qua `from-project` |
| `lib/ffe/*` (5 tệp) | 880 | Món rời: bảng, cổng, đo, tách số | FF&E | 🟢 ui=1 (chỉ `sheet.ts`) | `MaterialImportWizard` |
| **`lib/lighting/lux.ts`** | **135** | **Ước độ rọi phòng bằng phương pháp quang thông** `E=(Φ·UF·MF)/A` | Chiếu sáng | 🔴 **ui=0 lib=0** | **KHÔNG CÓ** |

**Đọc trụ ⑧: GIÀU NHẤT VỀ LƯỢNG (≈6.400 dòng), ĐÓI NHẤT VỀ MẶT TIỀN.** Xem §3.

---

## 3 · MẢNH NÀO ĐÓI NHẤT

Xếp theo **tỉ lệ engine lên tới được người dùng**, không theo số dòng:

| Hạng | Trụ | Engine | Lên tới mặt | Đói ở đâu |
|---|---|---|---|---|
| 🥇 **đói nhất** | **⑧ Tri thức ngành** | ~24 | **~12 (50%)** | 13 bộ luật + `lux.ts` + `boq/compute` + `color-psychology` + `element-infer` — **luật ngành có, nút bấm không** |
| 🥈 | **③ Luồng nghiệp vụ** | ~25 | 23 (92%) — nhưng **3.747 dòng đứt hẳn** | `idfc-import` 3.339 + `grounded-render` 408: hai kịch bản MVP **không có cửa vào** |
| 🥉 | **⑤ Chất lượng đầu ra** | 20 | 15 (75%) | `slide-templates` · `label-placer` · 3 engine font · `moodboard-collage` |
| 4 | ④ Giao diện | ~16 | 14 (88%) | `thao-tac-glyph` + `wallpaper/contrast` — vừa dựng 16/08, chưa cắm |
| 5 | ⑥ Vận hành | ~15 | 8 | phần đói là provider ngoài (rủi ro thấp) + `web-lookup` |
| — | ①②⑦ | | **no** | ① chỉ `ffe/item` lửng · ② `distill` mới 1/5 mặt tiền · ⑦ ít code là đúng bản chất |

### Vì sao ⑧ đói nhất — con số

`lib/cad/standards/` **2.165 dòng, 13 bộ luật**, nhưng **10/13 bộ chỉ được `registry.ts` đọc**; toàn
bộ khối này ra tới người dùng qua **đúng một cửa**: `checker.ts` → `AiBriefPanel` ở chặng 2D.
`lib/review/` (747 dòng, khung 2 lớp cho **cả 3 chặng**) ra mặt qua **đúng một tệp** `index.ts` →
`ReviewPanel`; `luat/rules-3d.ts` (201 dòng, luật đo được cho 3D) và `hien-thi-luat.ts`
(244 dòng, hai chế độ Ngắn↔Đầy đủ — **đã đánh dấu ✅ xong-máy trong frontier**) chưa có màn nào gọi.

⇒ Đúng **anti-pattern #2** của §6: *"lý thuyết/spec nhiều, sử dụng không được"*. Và đây là trụ
`00-CHOT` 15/08 vừa nâng thành luật (*"kiểm chuẩn = việc của MÁY"*) — luật đã có, máy đã viết,
**đường tới tay người dùng thì chưa**.

---

## 4 · NĂM PHÁT HIỆN ĐÁNG CHÚ Ý NHẤT

### ① `lib/idfc-import` — **3.339 dòng, 0 NƠI GỌI TỪ BẤT KỲ ĐÂU**, kho lớn nhất repo

| Tệp | Dòng | Trạng thái |
|---|---|---|
| `surface-graph.ts` | 1.300 | chỉ `chuan-net.ts` gọi |
| `chuan-net.ts` | 1.242 | chỉ `surface-graph.ts` gọi |
| `part-lock.ts` | 454 | **0 nơi gọi** |
| `from-photo.ts` | 266 | **0 nơi gọi** |
| `glb-stats.ts` | 77 | **0 nơi gọi** |

Cả cụm **chỉ gọi lẫn nhau** — một hòn đảo. Đây là pipeline *ảnh sản phẩm → mesh 3D → cấu kiện
`.idfc` có tham số*, hai entry `import-ghe-tu-hinh` và `chuan-net-3d` đều **đã đánh dấu ✅ xong**
trong `frontier-registry`, có proof thật (ghế Lincoln 327). Registry cũng tự khai *"CÒN CHỜ PHIẾU
SAU: mặt tiền UI"* — nên đây **không phải sổ nói dối**, nhưng nó là bằng chứng số cho việc
**xong-máy ≠ tới được người dùng**: 3.339 dòng, 26+38 test xanh, và **không một KTS nào chạm được**.

### ② `lib/grounded-render` + `lib/render-core` + 12 node def — **tầng lõi render đứt khỏi mặt**

`lib/render-core/*` (620 dòng, lõi tất định 4 việc render) và `lib/grounded-render/*` (408 dòng)
đều **0 nơi gọi từ UI** — chúng chỉ tới được `lib/nodes/defs/*`. Mà **12/28 tệp trong
`lib/nodes/defs/` cũng là CHỈ NỘI BỘ** (`render-v2` 528 · `pattern-warp` 343 · `grounded-render` 197
· `crop-composite` 195 · `metrology` 174 · `ffe-table` 148 …), chỉ vào `defs/index.ts` → `registry.ts`.

⇒ Đây là **kiến trúc đúng** (một sổ node, UI đọc sổ), nhưng nó làm cột "ui=" mất khả năng phân biệt
*node có nút bấm thật* với *node khai rồi để đó*. **Phép đo import tĩnh không kết luận được ở đây** —
xem §5.

### ③ Hai engine vừa dựng 16/08 chưa cắm điện — và một trong hai đã được sổ tự khai

`lib/ui/thao-tac-glyph.tsx` (**240 dòng**, kho 6 hình minh hoạ thao tác) và
`lib/wallpaper/contrast.ts` (**171 dòng**, đo tương phản tại chân chữ) đều **0 nơi gọi**.
`00-CHOT` đã tự khai với cái đầu: *"chưa lệnh nào trong app truyền `hinh` — dây đã nối, chưa có
dòng điện"*. Cái thứ hai (`contrast.ts`) **chưa được khai ở đâu**.

⇒ Điểm đáng ghi: **hai tệp dựng cùng một ngày, cùng trạng thái, mà chỉ một cái vào sổ.** Máy đo
bắt được cả hai; mắt người chỉ bắt được cái mình vừa làm.

### ④ **KHÔNG có engine "sống giả"** — kiểm chéo qua 12 component mồ côi

Repo có **12/268 component không ai import** (`IntroSequence` 493 · `LightBar` 353 ·
`DrawOnPreview` 303 · `LoginScreen` 288 · `StageSelect` 216 · `ResumeWork` 185 …).
Đã kiểm: **không engine nào có toàn bộ nơi-gọi-UI nằm trong nhóm mồ côi này.** Tức cột 🟢 SỐNG
trong bảng trên **không bị bơm** bởi mã chết.

⚠️ Nhưng lưu ý ngược: `components/ui/LightBar.tsx` (353 dòng, thanh tiến trình vừa dựng 16/08,
frontier đánh ✅) **chính nó là component mồ côi** — engine `lib/ui/tien-trinh.ts` sống nhờ
`CameraExportTab`, còn cái thanh vẽ ra thì chưa màn nào dùng.

### ⑤ Hai lỗ hổng của chính phép đo — khai để không ai tin quá tay

**(a) Worker không đi qua import tĩnh.** `lib/cad/dwg-worker.ts` (349 dòng) và `dxf-worker.ts`
(37 dòng) hiện "0 nơi gọi" nhưng **sống thật**, nạp qua `new Worker(new URL('./dxf-worker.ts',
import.meta.url))` (`lib/cad/dxf-open.ts:40`). Ai đọc bảng mà cắt là **giết đường nhập DWG/DXF**.

**(b) Phép đo đầu tiên của phiên này đã SAI và phải làm lại.** Bản đo v1 grep chuỗi `lib/<tên>` →
báo `lib/pdf-font.ts` là kho chết. Thật ra `lib/cad/pdf.ts:43` import nó bằng **`'../pdf-font'`** —
không có chữ "lib/" trong chuỗi. Bản v2 mới resolve đường dẫn thật. ⇒ **Bài học cho mọi máy soi
sau: grep chuỗi đường dẫn KHÔNG đủ để kết luận "0 nơi gọi"; phải resolve.** Nếu không phát hiện,
bản đo này đã báo oan 4 module.

---

## 5 · CHƯA CHẮC — khai thẳng cái gì đang SUY chứ không ĐO

1. **"SỐNG" chỉ chứng minh CÓ IMPORT, không chứng minh CÓ NÚT BẤM.** Một engine được import vào
   component sống vẫn có thể nằm sau nhánh `if` không bao giờ chạy, hoặc sau một nút chưa gắn.
   Kết luận đúng của cột này là *"có đường dây từ mặt tiền tới đây"*, **không phải** *"người dùng
   dùng được"*. Muốn biết cái sau phải **mở app bấm thật** — phiên này không chạy dev server.

2. **12 node def "CHỈ NỘI BỘ" có thể đang sống hoặc đang chết, đo tĩnh không phân biệt được.**
   Chúng vào `registry.ts` bằng bảng khai, UI đọc bảng đó bằng khoá chuỗi. Muốn biết node nào
   thật sự bấm được phải đối chiếu **danh sách node UI bày ra** với **danh sách trong registry** —
   việc riêng, chưa làm.

3. **Số dòng gộp cả docstring**, mà docstring trong repo này rất dày (nhiều tệp 20-40 dòng đầu là
   lập luận). Nên "dòng" ở đây là *khối lượng tệp*, không phải *khối lượng logic*. Không quy đổi
   sang công sức.

4. **Chỉ đếm 1 tầng khi kiểm "sống giả".** Một engine → component sống → nhưng component đó chỉ
   được component mồ côi gọi ⇒ vẫn báo SỐNG. Chuỗi 2 tầng chưa quét.

5. **Ranh giới "engine" là do phiên này chọn**, không có định nghĩa sẵn trong repo. Ở đây lấy
   **module `lib/` cấp 1** làm đơn vị chính (94), có chia nhỏ tới tệp ở các thư mục lớn. Chọn khác
   (vd theo `marker` trong frontier-registry) sẽ ra con số khác — con số 94 không phải hằng số của
   dự án.

6. **Việc gán engine vào trụ là PHÁN ĐOÁN của phiên này**, không phải nhãn có sẵn trong code.
   Nhiều engine đứng hai trụ (`auto-backup` vừa ① vừa ⑥; `label-placer` vừa ⑤ vừa ⑧). Đã chọn trụ
   *chính* theo mục đích tồn tại; ai đọc thấy sai chỗ nào thì sửa được mà không đổ vỡ phần số.

7. **Không kiểm `electron/` và `scripts/` như một "mặt tiền".** Chúng có trong đồ thị (cột `oth`)
   nhưng bảng không tách riêng. Vài engine có thể sống qua đường CLI/build mà bản đo xếp là nội bộ.

---

*Phiên Đ1 · 17/08/2026 · chỉ đọc, không sửa repo ngoài chính tệp này.*
