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
