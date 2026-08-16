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
| `mock-video-sinh-phim-3d-2026-08-10.html` | Chặng 3D: camera path → footage; nhóm công cụ nghề nghiệp thu gọn và handoff một-nguồn sang Dựng phim |

## ✅ CẬP NHẬT 08/08 (phiên đối chiếu-port, phát hiện dòng ⬆️ lỗi thời)
- **`mock-cad-shell-v5.html` KHÔNG còn hiện hành** — đã đổi tên `mock-cad-shell-v5_cu.html` từ 06/08
  (`8a850f5`), chính file đó tự ghi *"ĐỪNG PORT file này"*. **Thay bằng 3 file `.dc.html` mới hơn
  (07/08, `7303aee`)**: `2D Kỹ thuật.dc.html` · `Chế độ Chuyên.dc.html` · `Chế độ Phác thảo.dc.html`
  — 3 trạng thái của CÙNG một shell (khoá kỹ thuật sketch/pro), mỗi file tự ghi rõ "Thay thế: …".
- `mock-cad-revit-2026-08-03.html` — README dòng 176 (mục RÀ NHÃN, còn nguyên) đã tự nhận **không
  tự quyết được** vì mode "Cấu kiện" nó vẽ nay không còn tồn tại (chốt 07/08: chặng 2D chỉ 2 mode
  Sơ phác/Chuyên). Quyết định 08/08: **coi là tham khảo lịch sử, KHÔNG port** — nội dung Revit summary
  panel còn giá trị nào thì đã/sẽ nằm trong 3 file mới ở trên, không cần port file gốc riêng.

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

## ✅ ĐÃ XỬ LÝ — vi phạm cũ, không còn trong repo
| File | Vấn đề | Xử lý |
|---|---|---|
| `mapa-de-zonas.html` (24/07) | Dùng trọn màu TTT `#F1ECE3 #002850 #F06020` — vi phạm LUẬT TRUNG TÍNH + luật mock. Treo cờ 🔴 từ 24/07, COWORK-UI không tự xoá file. | **05/08 — đã gỡ khỏi working tree**, bản gốc nằm ở `~/Downloads/_TTT-BRAND/from-if-repo/mocks/mapa-de-zonas.html` (đối chiếu shasum khớp trước khi gỡ). Xoá khỏi git là việc của Hoà (luật V6 — phiên code không commit): `git rm docs/mocks/mapa-de-zonas.html`. ⚠️ File vẫn còn trong LỊCH SỬ git — cần `filter-repo` trước khi phát hành, cùng đợt với `public/wallpapers/ttt-*` và `pantone-tcx.json`. |

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

---

## 🔍 AUDIT A4 · 7 MOCK MÀN PHỤ (COWORK-UI 03/08/2026) — chi tiết ở `docs/AUDIT-MOCK-MANPHU-2026-08-03.md`
Append-only. Mỗi ô là số đo bằng lệnh. **Chưa file nào port được ngay.**

| File | Hạng | Số thật | Phải sửa gì trước khi port |
|---|---|---|---|
| `mock-if-du-an.html` | 🔴 | 22 dòng · 572B · `var(--`=**0** · hex TTT 0 | **EXPORT HỎNG** — cắt cụt giữa token `--t3:#9e` (dòng 19), 0 dòng giao diện. Không audit nội dung được. Export lại. |
| `mock-if-cai-dat.html` | 🔴 | 26 dòng · 904B · `var(--`=**0** · hex TTT 0 | **EXPORT HỎNG** — cắt giữa `--hatch:repeating-linear-gradient(...` (dòng 23). Thêm: dòng 14 `--row:44px` sai mặc định (globals = 28px). Export lại. |
| `mock-if-anh-dai-dien.html` | 🔴 | 60 dòng · `var(--`=19 · hex ngoài `:root`=**0** (sạch nhất) · 2 theme khai đủ | **RỖNG RUỘT** — có header + khung 1180×820, 0 ô ghép avatar, 0 nút Lưu. Export lại phần ruột; thêm `/1.5` cho `font:600 12px inherit` (dòng 55). |
| `mock-if-thu-vien.html` | 🔴 | 545 dòng · `var(--`=407 · hex ngoài `:root`=**51** (22 trùng token) · PLACEHOLDER 3 | Cụt đuôi dòng 543 + **thiếu `<script>`** · G2: tấm nổi dòng 92 `--nen-mo-panel` **78%** → ≥92% · token `--nen-mo-panel` .78/.82 lệch globals (.68/.7) · 44 `font:` thiếu `/1.5` · `#f5f5f7`→`var(--t1)`, `#c79a63`→`var(--accent-warm)` · khai `--swatch-bg/--ink/--scrim` vào globals. |
| `mock-if-nut-tong.html` | 🔴 | 513 dòng · `var(--`=447 · hex ngoài `:root`=17 · PLACEHOLDER 6 · khung: chỉ 236px, **0 lần 42px** | **G2 nặng nhất:** modal dòng 165 `--nen-mo-panel` **72%** + 13 card node `--nen-mo-card` **62%** (dòng 79·87·95·103·111·293·302·349·414·422·430·442·451) → tất cả ≥92%/≥82% · 4 hàng `opacity:.5` trong modal (226·240·254·261) chữ mờ trên kính · **19 lần hardcode `44px`, `var(--row)`=0** → đổi hết · thiếu khung 6 ổ + thiếu bộ chuyển chặng · 17 `font:` thiếu `/1.5`. |
| `mock-if-bang-nut.html` | 🟡 | 562 dòng · `var(--`=**465** · hex ngoài `:root`=9 · PLACEHOLDER 6 · **khung 6 ổ đủ 4/4** (dòng 68) · chặng `2D·3D·Trình bày` ✅ | Sửa lúc port: `--nen-mo-card` .62→.82 (14 card, dòng 151·165·183·204·219·235·260·350·366·387·411·424·445·469) · bảng lệnh dòng 479 (68%) → ≥92% · 24 `font:` thiếu `/1.5` · bỏ 4 bí danh `--p-img/-mask/-mat/-num` (= accent/warning/success/t3) · 7 hex → `var()` · thêm phím tắt (`<kbd>`=0). |
| `mock-if-tep.html` | 🟡 | 783 dòng · `var(--`=**649** (nhiều nhất) · hex ngoài `:root`=**9** (ít nhất trong nhóm có ruột) · PLACEHOLDER 7 · **khung 6 ổ đủ 4/4 ở CẢ 4 trạng thái** (dòng 64·346·537·623) · `--nen-mo-*` khớp globals | Gần port được nhất. Sửa: **76** `font:` thiếu `/1.5` (nhiều nhất bộ, nặng ở mono 10px) · popover dòng 701 `--nen-mo-panel` 68% → ≥92% · 8 hex → `var()` · khai `--hatch`/`--ink` vào globals · thêm gợi ý phím + ⌘K (`⌘`=0, `Esc`=0). |

### Đạt chung cả 7
- **Hex TTT `#F06020` `#002850` `#1B1512` `#F1ECE3` = 0/0/0/0** — sạch tuyệt đối.
- **Nhãn chặng cũ = 0** (`Rendering`·`Presenting`·`CAD ·`·`>Vẽ<`). 12 khớp `Dựng ảnh` ở `bang-nut`(7)/`nut-tong`(5) là **tên NODE**, dương tính giả theo §6.4 — **giữ nguyên**, cùng loại với `mock-if-3chang:376·464·661`.
- **K4 ✅** — `Xoá` (tep:320·511) có chữ; 2 nút chỉ-icon đều là "Đóng" kèm `title` + Esc.
- **G1 ✅** — 4 keyframes duy nhất (`bn-spin`·`bn-dash`·`bn-halo`·`nt-halo`) đều transform/stroke-dashoffset/box-shadow, **0 animate opacity** trên kính.
- **Accent ✅** — chỉ `#6a57f5`; `#c79a63` = `--accent-warm` thật của globals (dòng 26), không phải accent lạ.

### 🔴 CHẶN CHUNG — `support.js` KHÔNG TỒN TẠI
`ls docs/mocks/support.js` → không có, nhưng **16 file** khai `<script src="./support.js">`: 7 mock trên + `mock-2d-ky-thuat` · `mock-3d-frame` · `mock-3d-thong-nhat` · `mock-trinh-bay` · `mock-an-bang-theo-doi` · `mock-an-ghi-chu-viet-tay` · `mock-an-so-tay` · `mock-an-thu-vien-tri-thuc` · `Vitals v2.dc`.
⇒ nút đổi theme không chạy · **131 `style-hover` chết** · `{{ project }}`/`{{ themeLabel }}` in ra nguyên ngoặc.
⇒ **Tiêu chí "đủ 2 theme" của mọi mock export Claude Design mới verify ở mức KHAI BÁO CSS — CHƯA VERIFY được bằng mắt.** Cần TỔNG/Hoà xin lại `support.js` cùng lúc với 3 file export hỏng.

---

## ✅ ĐÃ PORT VÀO APP — cụm IN / GIẤY / XUẤT (làn C, 06/08/2026)
**Đừng port lại 4 file này.** Đây là câu trả lời cho G-M5-03 ("nhiều mock cùng tả một màn, không bản
nào ghi bản chốt"): 4 mock dưới là **bản chốt ĐÃ THÀNH CODE**, muốn đổi giao diện thì sửa component,
không dựng mock mới chồng lên. Append-only, không sửa dòng cũ.

| Mock | Đã thành | Ghi chú port |
|---|---|---|
| `HopXuatPDF.dc.html` | `components/print/ExportPdfDialog.tsx` | Render đủ **5 khổ A0–A4** (mock chỉ vẽ 4). Cột "Khổ giấy" **mở khoá ở chặng 2D** (khổ là thật trong `Doc`), **khoá kèm lý do ở chặng Trình chiếu** (khổ do "Khổ trình bày" của hồ sơ quyết). 5 dòng kiểm cứng của mock **thay bằng đo thật** — `lib/print/export-checks.ts` |
| `BangNetIn.dc.html` | `components/print/LineweightTable.tsx` | **Bỏ chữ "Checklist TTT"** khỏi dòng mô tả (LUẬT TRUNG TÍNH — mock chép lại lỗi thương hiệu, giữ nguyên ý lời nhắc). 7 hàng của mock là dữ liệu mẫu `DEMO_LINEWEIGHT_ROWS` |
| `BangTron.dc.html` | `components/print/RadialToolMenu.tsx` | Glyph `✎ ▱ ⌫ ↺ ⤢` → **icon lucide** (LUẬT GIAO DIỆN ②). ⚠️ `@keyframes` của mock chỉ có `scale()` — **bản mock ĐÚNG NHƯNG SAI KHI ĐƯA VÀO REACT**: animation thắng inline style nên nuốt mất `translate(-50%,-50%)`, đĩa nhảy lệch 118px. Code đã vá + `lib/print/radial.test.ts` chặn hồi quy |
| `ToGiay.dc.html` | `components/print/PaperSheetFrame.tsx` | Tỉ lệ giấy tính từ `paperSizeMm` thật (mock hardcode `420/297`). **Bỏ câu "Nội dung do titleBlockPro() sinh — lib/cad/commands.ts"** khỏi UI (jargon nội bộ, `SPEC-NGON-NGU-CHI-DAN`). Ô "chỗ trống" thành prop, không vẽ cứng |

**Token 4 mock này đã vào `app/globals.css`**: `--paper*` (5 biến) · `--tap-lg` · `--on-accent`; còn
`--ok/--warn/--vp-lock/--vp-open/--pen` khai **bí danh** của `--success/--warning/--t1` để nền Kem tự
lấy bản đủ tương phản. Mock nào sau này dùng lại các biến đó thì **đã có sẵn**, đừng khai lại cục bộ.

Chi tiết port + nghiệm thu: `docs/M-APPLY-C-OUT.md`.

---

## ✅ CẬP NHẬT 08/08 (phiên kiểm bàn giao) — 2 mục 🔴 phía trên ĐÃ HẾT HIỆU LỰC
- **`support.js` ĐÃ CÓ** (10KB, 07/08 22:41, commit `7303aee`) — mục "🔴 CHẶN CHUNG: support.js KHÔNG TỒN TẠI" lỗi thời. 24 tệp khai `support.js` (tăng từ 16 do thêm export `.dc.html` mới).
- **3 export hỏng ĐÃ export lại đủ ruột**: `_archinote/mock-if-du-an.html` 22→422 dòng · `mock-if-cai-dat.html` 26→271 · `mock-if-anh-dai-dien.html` 60→265. Mục 🔴 EXPORT HỎNG trong AUDIT A4 lỗi thời cho 3 file này (nội dung ruột chưa audit lại token — việc riêng).
- Đếm máy 08/08: **80 tệp `.html` ở `docs/mocks/` (30 là `.dc.html`) + 10 tệp trong `_archinote/` = 90**. Verify browser thật `Thư viện.dc.html`: render đủ 2 lớp, không lộ `{{ }}`.

## ✅ THÊM 10/08 — cửa vào Trình bày

- `mock-trinh-chon-ho-so-tablet-2026-08-10.html` — Thư viện hồ sơ khi dự án chưa có hồ sơ, theo gallery template: danh mục ngang Deck/A3/BOQ/Văn bản/Video → lưới mẫu → thanh xác nhận tạo từ mẫu; không dùng sidebar kỹ thuật trước khi vào editor. Tablet chuyển danh mục thành dải cuộn + thanh tạo cố định, đủ hai theme. Bản xem concept không phản ánh trạng thái hoàn tất editor trong app.

## ✅ THÊM 11/08 — Chat nhóm + AI tham vấn
- `mock-chat-nhom-ai-2026-08-11.html` — Kênh chat dự án 3 cột kiểu NotebookLM (Hoà đặt bài 11/08): TRÁI nguồn cho AI (checkbox) · GIỮA chat nhóm (tin AI = glyph Vitals + viền accent, @Vitals mới nói; card DWG tiến độ ref #10 → kết quả "Mở trong Thiết kế 2D"; avatar online màu/offline grayscale; dải đang họp thu nhỏ; voice capsule ref #4) · PHẢI Chưng cất AI gom, người duyệt. Token globals + 2 theme (phím D), khung 1440. Spec nguồn: `docs/SPEC-CHAT-NHOM-AI-2026-08-11.md` (id chat-ai-notebook).

## ✅ THÊM 12/08 — Vitals 3 cấp window + gradient kem
- `mock-vitals-3-window-2026-08-12.html` — Bảng trạng thái 3 cấp window Vitals học visual Siri mới (Hoà giao 5 ref 12/08, REF-VISUAL #14-15): ① pill kính kết quả tại chỗ (glyph cầu+quỹ đạo, không orb) → ② thẻ hội thoại nổi (hỏi-đáp vật liệu ốp bếp, ô nhập + ＋ + mic capsule, vẽ CẠNH NHAU 2 trạng thái kính/giảm chói theo bài học Reduce Bright Effects) → ③ trang phiên đầy đủ theo tone canvas (trả lời dài + chip trích nguồn + lưới phiên cũ + ＋). Kèm demo highlight gradient kem ấm (radial pha --accent-warm + kem, chỉ phần tử CHỌN ĐƯỢC, chrome không áp, reduced-motion tức thì). Canvas gạt 2 tone Be/Xám-đen ĐỘC LẬP 2 theme app (phím D); G1 giữ — kính không animate opacity. Chốt nguồn: 00-CHOT "[12/08 Hoà giao 5 ref Siri mới]" (id vitals-3-window · hover-gradient-kem).
