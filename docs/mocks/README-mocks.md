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

---
*COWORK-UI lập 03/08/2026 (việc 5 hàng đợi). Mock mới thêm vào đây 1 dòng khi tạo.*
