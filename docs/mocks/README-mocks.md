# README — TÌNH TRẠNG MOCK (COWORK-UI rà 03/08/2026)
**Mục đích:** phiên code CHỈ port mock ✅ HIỆN HÀNH. Mock ⚠️/🕰 KHÔNG port nguyên — token sai chuẩn.
**Chuẩn hợp đồng (LUẬT GIAO DIỆN ②③):** token chép nguyên `app/globals.css` · đủ 2 theme (Tối mặc định) · lucide · cấm hex tự chế/TTT.
**Cách rà:** grep `data-theme` (2 theme) · token globals (`--t1`/`#0c0c0e`) · palette tự chế cũ (`#eceae7`) · hex TTT. Append-only — thêm dòng, không sửa dòng cũ.

## ✅ HIỆN HÀNH — được port
| File | Là gì |
|---|---|
| `mock-cad-shell-v5.html` | Shell chặng Vẽ bản chốt (chuỗi SPEC-CAD-SHELL-V3, bản mới nhất) |
| `mock-cad-revit-2026-08-03.html` | Mode Cấu kiện (Revit) chặng Vẽ — kế thừa CSS v5 (việc 2 COWORK-UI) |
| `mock-mood-collab-g2-2026-08-03.html` | Mood+Collab G2 chặng 2, khung AppShell 6 ổ — THAY `mock-mood-collab.html` cũ (việc 1) |
| `mock-material-sphere-2026-08-03.html` | Thư viện sheet · quả cầu vật liệu + tạo template D5 (việc 4) |
| `mock-if-ve3d.html` | Vẽ 3D chặng 2 (Hoà chốt 02/08 qua mock) — token+2 theme đạt |
| `mock-if-3chang.html` | Khung 3 chặng — token+2 theme đạt |
| `mock-avatar-picker-v2.html` | Trang đổi avatar v2 — ĐÃ PORT (`88566c6`), giữ làm chuẩn đối chiếu |
| `mock-trinh-boq-2026-08-04.html` | BOQ editor theo `SPEC-TRINH-BOQ-EDITOR` — summary-bar·6 kiểu cột·badge sửa-tay·dòng lỗi (đợt 3.①) |
| `mock-trinh-video-2026-08-04.html` | Video editor theo `SPEC-TRINH-VIDEO-EDITOR` — shot có tên·3 tầng·collapsed·beat snap·MP4 0-credit (đợt 3.②) |

## 🕰 LỊCH SỬ — đạt token nhưng đã có bản mới hơn, không port
| File | Bị thay bởi |
|---|---|
| `mock-cad-shell-pro.html` · `-v2` · `-v3` · `-v4` | `mock-cad-shell-v5.html` |
| `avatar-picker.html` | `mock-avatar-picker-v2.html` |
| `vitals-avatar.html` · `vitals-prototype.html` · `vitals-v3.html` | chuỗi thăm dò Vitals (1 theme); glyph chốt theo `SPEC-VITALS-VISUAL` |

## ⚠️ LỖI THỜI — palette tự chế, 1 theme sáng, KHÔNG port nguyên (bố cục tham khảo được)
| File | Ghi chú |
|---|---|
| `mock-mood-collab.html` | bản xem thử trước LUẬT GIAO DIỆN — thay bằng `mock-mood-collab-g2-2026-08-03.html` |
| `mock-render-layout-H3.html` | bố cục H3 Hoà đã duyệt HƯỚNG; token phải làm lại khi port |
| `mock-ve-3d.html` | bản nháp trước `mock-if-ve3d.html` |
| `mock-library.html` | trước khi chốt "Thư viện = MỘT sheet"; xem `mock-material-sphere-2026-08-03.html` cho kệ Vật liệu |
| `mock-bottombar-redesign.html` | trước chốt B + hình học Apple §2d — bar chốt nằm trong mock G2 mới |
| `mock-designsystem-stagemap.html` | bản đồ minh hoạ, không phải mock port |
| `mock-files-polished.html` · `mock-settings-polished.html` | ĐÃ PORT vào app (FM/Settings merged) — giữ lịch sử |
| `tool-window-sketch2photo.html` | mock nguồn `CHOT-RENDER-TOOL-WINDOW` — bố cục còn giá trị, token làm lại khi port |

## 🔴 VI PHẠM — chờ Hoà xử
| File | Vấn đề |
|---|---|
| `mapa-de-zonas.html` (24/07) | Dùng trọn màu TTT `#F1ECE3 #002850 #F06020` — vi phạm LUẬT TRUNG TÍNH + luật mock. Đề nghị dời ra `~/Downloads/_TTT-BRAND/` như các tài sản TTT khác. COWORK-UI không tự xoá file. |

## Khác
`library-mock-note.md` — ghi chú kèm mock library cũ, giữ.

## 🔍 GHI CHÚ AUDIT (phiên UI sau đợt 3 — nhận lại đúng việc đợt 3, kiểm thật trước khi dựng lại)
Trước khi mock, `ls docs/mocks/` + đọc `BAO-CAO-COWORK-UI.md` phát hiện `mock-trinh-boq-2026-08-04.html`
và `mock-trinh-video-2026-08-04.html` **đã có từ đợt 3** — không dựng lại (§0d), chuyển sang audit thật:
- **Nội dung đúng spec nguồn**: đối chiếu trọn `SPEC-TRINH-BOQ-EDITOR.md`/`SPEC-TRINH-VIDEO-EDITOR.md` —
  ① summary-bar/6 kiểu cột/badge sửa-tay và ② shot có tên/3 tầng/timeline collapsed đều đúng.
- **Token đúng `app/globals.css` thật** (grep trực tiếp, không tin CSS trong mock): accent `#6a57f5` ·
  bo 10/14/20/28 · tap/row/gap 32-28-8 (chạm 44-44-12) · danger/warning/success cả 2 theme — khớp chính
  xác, không hex tự chế.
- **Vá 1 lỗ hổng §0c thật**: mảng "phím tắt" — 2 file bản đầu KHÔNG có kbd hint/⌘K/legend nào dù
  `SPEC-TRINH-BOQ-EDITOR §9.1` + `SPEC-TRINH-VIDEO-EDITOR §10.1` liệt kê rõ. Đã thêm nút "Tìm lệnh ⌘K"
  header + khối "Phím tắt" Inspector (pin 9-10) cho cả 2 file, đúng danh sách phím trong spec chữ, không
  bịa thêm. Mảng "lệnh tương tác" (status bar) và mảng "cảm ứng" (token + không giấu sau hover — kiểm
  `.rv`/`.fx`/`.shot .hL/.hR` hiện khi selected không chỉ khi hover) đã đạt từ bản đầu, không cần vá.
- **Đối chiếu 3 spec hạ tầng theo yêu cầu phiếu giao việc**: SPEC-APP-SHELL-CHUNG (khung 42/214/236/26) —
  ĐÚNG. SPEC-MAT-DO-CON-TRO — ĐÚNG (chỉ dùng 3 token THẬT có trong globals.css; ghi chú: spec chữ nói "5
  token --tap/--row/--gap/--pad-card/--fs-ui" nhưng 2 token sau CHƯA vào code — lệch spec-vs-code, không
  phải lỗi mock, xem đề xuất trong `BAO-CAO-COWORK-UI.md` đợt 4). SPEC-PANEL-ROLLOUT-IDF (rollout
  title-toggle/grip/chuột-phải) — Inspector 2 mock này CHƯA áp; spec đó gắn với Inspector CAD
  (`CadInspectorPages.tsx`), tạm coi ngoài phạm vi Present-stage, KHÔNG đánh dấu lỗi thời, cần Hoà/TỔNG
  quyết có đồng nhất mọi Inspector theo rollout hay không.
- 2 điểm nhỏ ghi nhận, KHÔNG chặn: vài bo góc chrome <32px (nút/chip) dùng 6-9px lẻ, không khớp thang
  10/14/20/28 lẫn công thức đồng tâm — lặp lại ở nhiều mock COWORK-UI trước, chưa có thang micro-radius
  chính thức nên chưa sửa; BOQ mock minh hoạ 3/4 loại BoqError (thiếu ví dụ "spec-not-found"), đủ nghiệm
  thu banner+dòng lỗi.

---
*COWORK-UI lập 03/08/2026 (việc 5 hàng đợi). Mock mới thêm vào đây 1 dòng khi tạo.*

---

## 🏷 RÀ NHÃN CHẶNG/MODE TOÀN BỘ MOCK — 03/08/2026 (COWORK-UI, việc 2)
**Căn cứ:** bộ tên VÒNG CUỐI `CHOT-TEN-CHANG-MODE-2026-08-03.md` → đã khoá vào `SPEC-NGON-NGU-CHI-DAN.md §6`.
**Cách rà:** `grep -rn` trong `docs/mocks/*.html` với 7 chữ được giao (`Rendering` · `Presenting` · `Dựng ảnh` · `CAD ·` · `Phác thảo` · `Cấu kiện` · `Vẽ` khi là tên chặng), cộng thêm `Vẽ 3D` (nhãn mode chặng 2) và `Present` (tiếng Anh cùng họ) vì cùng một lỗi.
**⛔ KHÔNG SỬA FILE MOCK — chỉ liệt kê, chờ TỔNG duyệt.** Sửa hàng loạt 19 file trước khi duyệt là đập cái đang dùng được (§0d).

### Kết quả tổng
- **19 file mock dính nhãn cũ** (trên 27 file `.html` trong thư mục) + **1 file chờ export** = 20.
- **78 dòng** khớp grep, trong đó **72 dòng thật sự phải đổi**; **6 dòng là dương tính giả** (liệt kê ở cuối, KHÔNG đổi).
- Nặng nhất: `mock-designsystem-stagemap.html` (10 dòng) · `mock-ve-3d.html` (9) · `mock-render-layout-H3.html` (9) · `mock-if-3chang.html` (8 — 5 thật) · `mock-mood-collab-g2-2026-08-03.html` (8).

### Bảng: file → dòng → chữ sai → chữ đúng
| File | Dòng | Chữ sai | Chữ đúng |
|---|---|---|---|
| `mock-designsystem-stagemap.html` | 146 | `Vẽ 3D` (mode toggle) | `3D` (cặp Node ↔ 3D) |
| " | 157 | `CAD · Phác thảo` · `Rendering` · `Present` | `2D Kỹ thuật · Sơ phác` · `3D Thiết kế` · `Trình bày` |
| " | 165 | `CAD` · `Rendering` · `Present` | `2D` · `3D Thiết kế` · `Trình bày` |
| " | 166 | pill `Vẽ 3D ⚪` | pill `3D` |
| " | 173 | `CAD` · `Rendering` · `Present` | `2D` · `3D Thiết kế` · `Trình bày` |
| " | 174 | pill `Vẽ 3D ●` | pill `3D` |
| " | 176 | tiêu đề `② Render · Vẽ 3D` | `② 3D Thiết kế · mode 3D` |
| " | 181 | `CAD` · `Rendering` · `Presenting` | `2D` · `3D Thiết kế` · `Trình bày` |
| " | 184 | tiêu đề `③ Present` | `③ Trình bày` |
| `mock-ve-3d.html` | 6 | title `Vẽ 3D mode` | `mode 3D` |
| " | 91 | `IF · Rendering › gạt Vẽ 3D` | `IF · 3D Thiết kế › gạt 3D` |
| " | 94 | pin `Toggle Vẽ 3D` | `Toggle 3D` |
| " | 106 | `◱ CAD · Phác thảo` | `2D Kỹ thuật` |
| " | 107 | `◈ Rendering` | `3D Thiết kế` |
| " | 108 | `▭ Presenting` | `Trình bày` |
| " | 213 | comment `Vẽ 3D toggle` | `3D toggle` |
| " | 224 | modetoggle `Vẽ 3D` | `3D` |
| " | 231 | phần "Đọc mock" `gạt Vẽ 3D` | `gạt 3D` |
| `mock-render-layout-H3.html` | 6 | title `IF · Rendering` | `IF · 3D Thiết kế` |
| " | 95 | `InteriorFlow · chặng Rendering` | `InteriorFlow · chặng 3D Thiết kế` (giữ `InteriorFlow`) |
| " | 96 | `1 nút rời bật/tắt "Vẽ 3D"` | `… "3D"` |
| " | 100 | pin `1 nút rời bật/tắt "Vẽ 3D"` | `… "3D"` |
| " | 111 | `◱ CAD · Phác thảo` | `2D Kỹ thuật` |
| " | 112 | `◈ Rendering` | `3D Thiết kế` |
| " | 113 | `▭ Presenting` | `Trình bày` |
| " | 193 | nhãn `Vẽ 3D` | `3D` |
| " | 203 | "Đọc mock" `gạt bật/tắt "Vẽ 3D"` | `… "3D"` |
| `mock-mood-collab-g2-2026-08-03.html` | 6 | title `IF · Dựng ảnh · Mood+Collab` | `IF · 3D Thiết kế · Mood+Collab` |
| " | 18 | ghi chú `switch "Vẽ 3D"` | `switch "3D"` |
| " | 352 | h1 `Dựng ảnh · mode Render+Mood+Collab` | `3D Thiết kế · mode Node` |
| " | 368 | pin `gạt "Vẽ 3D"` | `gạt "3D"` |
| " | 379 | seg `Vẽ` · `Dựng ảnh` | `2D Kỹ thuật` · `3D Thiết kế` |
| " | 572 | title `Gạt sang mode Vẽ 3D` | `Gạt sang mode 3D` |
| " | 573 | nhãn `Vẽ 3D` | `3D` |
| " | 596 | ihint `Sang mode Vẽ 3D` | `Sang mode 3D` |
| `mock-if-3chang.html` | 334 | nút chặng `Vẽ` | `2D Kỹ thuật` (hẹp: `2D`) |
| " | 335 | nút chặng `Dựng ảnh` | `3D Thiết kế` (hẹp: `3D`) |
| " | 424 | tab `Vẽ 3D` | `3D` |
| " | 553 | `Lấy từ: Dựng ảnh · Phòng khách` | `Lấy từ: 3D Thiết kế · Phòng khách` |
| " | 583 | `Kệ chặng Dựng ảnh` | `Kệ chặng 3D Thiết kế` |
| `mock-mood-collab.html` | 120 | h1 `IF · Rendering › Mood + Collab` | `IF · 3D Thiết kế › Mood + Collab` |
| " | 135 | `◱ CAD · Phác thảo` | `2D Kỹ thuật` |
| " | 136 | `◈ Rendering` | `3D Thiết kế` |
| " | 137 | `▭ Presenting` | `Trình bày` |
| " | 252 | modetoggle `Vẽ 3D` | `3D` |
| `mock-bottombar-redesign.html` | 62 | oldpill `◳ Vẽ 3D` | `3D` |
| " | 68 | thuyết minh `segmented [Node · Vẽ 3D]` | `[Node · 3D]` |
| " | 80 | nút `◳ Vẽ 3D` | `3D` |
| " | 95 | nút `◳ Vẽ 3D` (on3d) | `3D` |
| " | 102 | thuyết minh `nhãn "Vẽ 3D"` | `nhãn "3D"` |
| " | 113 | modecell `Vẽ 3D` | `3D` |
| `mock-cad-revit-2026-08-03.html` | 13 | ghi chú `(Phác · Kỹ thuật · Cấu kiện) = ĐỀ XUẤT` | **bộ 3-mode này ĐÃ BỎ** → mode chặng 2D chỉ còn `Sơ phác ↔ Kỹ thuật` |
| " | 272 | seg `Vẽ` · `Dựng ảnh` | `2D Kỹ thuật` · `3D Thiết kế` |
| " | 285 | modeseg `Phác` · `Kỹ thuật` · `Cấu kiện` | `Sơ phác` · `Kỹ thuật` — **bỏ hẳn nút thứ ba** |
| " | 287 | comment `mode Cấu kiện` | `mode Kỹ thuật (phần cấu kiện)` |
| " | 385 | comment `DOCK — lệnh mode Cấu kiện` | `DOCK — lệnh mode Kỹ thuật` |
| `mock-cad-shell-pro.html` | 179 | stageseg `Vẽ` | `2D Kỹ thuật` (hẹp: `2D`) |
| " | 180 | stageseg `Dựng ảnh` | `3D Thiết kế` (hẹp: `3D`) |
| " | 277 | modeseg `Phác thảo` · `Chuyên` · `Revit` | `Sơ phác` · `Kỹ thuật` — bỏ nút thứ ba |
| `mock-if-ve3d.html` | 453 | seg `Vẽ` · `Dựng ảnh` | `2D Kỹ thuật` · `3D Thiết kế` |
| " | 456 | mode `Vẽ 3D` | `3D` |
| " | 702 | `Kệ chặng Dựng ảnh` | `Kệ chặng 3D Thiết kế` |
| " | 750 | alert `mode Vẽ 3D` / `mode Bảng dựng` | `mode 3D` / `mode Node` |
| `mock-cad-shell-v5.html` | 277 | seg `Vẽ` · `Dựng ảnh` | `2D Kỹ thuật` · `3D Thiết kế` |
| `mock-cad-shell-v4.html` | 262 | seg `Vẽ` · `Dựng ảnh` | như trên |
| `mock-cad-shell-v3.html` | 259 | seg `Vẽ` · `Dựng ảnh` | như trên |
| `mock-cad-shell-v2.html` | 207 | seg `Vẽ` · `Dựng ảnh` | như trên |
| `mock-trinh-boq-2026-08-04.html` | 249 | seg `Vẽ` · `Dựng ảnh` | như trên (`Trình bày` đã đúng) |
| `mock-trinh-video-2026-08-04.html` | 225 | seg `Vẽ` · `Dựng ảnh` | như trên (`Trình bày` đã đúng) |
| `mock-material-sphere-2026-08-03.html` | 13 | ghi chú `ở mode Vẽ 3D` | `ở mode 3D` |
| `mock-library.html` | 134 | `Present` | `Trình bày` |
| `vitals-prototype.html` | 138 | ctx `đang ở · CAD Phác thảo` | `đang ở · 2D Kỹ thuật · Sơ phác` |
| **`mock-3d-thong-nhat.html`** | — | `Vẽ · Dựng ảnh · Trình bày` (theo mô tả phiếu giao việc) | `2D Kỹ thuật · 3D Thiết kế · Trình bày` — **⏳ CHỜ EXPORT** |

### ⏳ Chờ export — chưa grep được
`mock-3d-thong-nhat.html` (màn "Không gian 3D" 4 trạng thái, Claude Design dựng, Hoà rất ưng) **CHƯA có trong `docs/mocks/`** — `ls` xác nhận không tồn tại tại thời điểm rà. Việc nó mang nhãn cũ "Vẽ · Dựng ảnh · Trình bày" là **theo phiếu giao việc, COWORK-UI chưa tự kiểm được**. Khi file về: grep lại theo `SPEC-NGON-NGU-CHI-DAN §6.5` rồi cập nhật dòng cuối bảng trên.

### ✅ Dương tính giả — KHỚP GREP NHƯNG KHÔNG ĐỔI (6 dòng)
| File | Dòng | Vì sao giữ |
|---|---|---|
| `mock-if-3chang.html` | 376 · 464 · 661 | `Dựng ảnh AI` là **tên khối/node** (chức năng), không phải tên chặng — §6.4 nói rõ. |
| `mock-cad-shell-pro.html` | 201 · 279 | `Vẽ` là **nhãn nhóm công cụ** trong toolbar (caption + tglabel), không phải tên chặng. |
| `mock-designsystem-stagemap.html` | 158 | `Vẽ` là **nhãn vùng sidebar** (Vẽ · Ký hiệu · Layer), không phải tên chặng. Cùng dòng có `Sketch↔Pro↔Revit` — chuỗi mode kỹ thuật, nếu hiện ra UI thì phải đổi thành `Sơ phác ↔ Kỹ thuật`; đây là mock bản đồ minh hoạ nên để TỔNG quyết. |

### Ghi chú trung thực
- Bảng trên **chỉ khẳng định cái grep ra được**. Cột "chữ đúng" là **áp dụng §6.4**, một số dòng (comment HTML, thuyết minh "Đọc mock", tên biến JS) **không phải nhãn hiển thị** — sửa hay không do TỔNG quyết; liệt kê ở đây để không sót.
- Nhiều mock trong bảng đã nằm mục **🕰 LỊCH SỬ** hoặc **⚠️ LỖI THỜI** phía trên (`mock-ve-3d`, `mock-mood-collab`, `mock-cad-shell-pro/v2/v3/v4`, `mock-bottombar-redesign`, `mock-library`, `mock-designsystem-stagemap`, `vitals-prototype`) → **ưu tiên sửa thấp**, không ai port. Ưu tiên cao là 8 file trong mục ✅ HIỆN HÀNH: `mock-cad-shell-v5` · `mock-cad-revit-2026-08-03` · `mock-mood-collab-g2-2026-08-03` · `mock-material-sphere-2026-08-03` · `mock-if-ve3d` · `mock-if-3chang` · `mock-trinh-boq-2026-08-04` · `mock-trinh-video-2026-08-04` (+ `mock-3d-thong-nhat` khi về).
- `mock-cad-revit-2026-08-03.html` là **ca nặng nhất về ngữ nghĩa, không phải về số dòng**: cả mock dựng quanh một mode "Cấu kiện" nay **không còn tồn tại**. Đổi chữ không đủ — cần TỔNG quyết: giữ làm tài liệu tham khảo phần Revit rồi **cắt đôi theo chiều** (mặt bằng/ký hiệu/thống kê → 2D Kỹ thuật; khối/đặt đồ/vật liệu → 3D Thiết kế), hay dựng lại. **COWORK-UI không tự quyết.**

---
*COWORK-UI rà 03/08/2026 (việc 2). Append-only.*
