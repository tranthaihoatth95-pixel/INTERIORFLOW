# ĐƯỜNG VỀ ĐÍCH — **ĐÃ MỞ KHOÁ** (Hoà quyết 04/08 chiều)

⚠️ **THAY THẾ bản "3 đợt khoá" sáng 04/08.** Hoà chốt: **mở khoá toàn bộ IF (cả chặng 2D
lẫn 3D), làm HẾT rồi ship MỘT LẦN.** Không ship bản tối thiểu trước.

Bản cũ giữ trong lịch sử git (`a40adf2`) — không xoá, để về sau đối chiếu quyết định.

## Đích mới
Một studio nội thất làm trọn dự án thật **bằng bộ công cụ đầy đủ**:
```
mở .dwg cũ → vẽ 2D đủ lệnh → dựng 3D đủ cấu kiện → gán vật liệu thật →
render AI có số đo → in hồ sơ đúng tỉ lệ → ra BOQ có giá → trình chiếu
```

---
## ĐÃ XONG (11 việc, 03-04/08)
Nhập DWG (timeout·tiến độ·huỷ) · xuất PDF đúng khổ+tỉ lệ · multi-sheet D1+D2 (bỏ trần 5) ·
kho vật liệu (schema 4 cột · màn quản lý · nhập Excel qua gateway) · BOQ editor ·
boolean 3D `ops[]` · cửa/cửa sổ hosted khoét lỗ thật · ViewCube 3D 26 vùng ·
autosave chặng 3D · phím tắt tập trung + lockscreen · kính lỏng + EmptyState toàn app ·
nhãn nhóm thanh tool 2D · đổi tên 3 chặng

---
## CÒN LÀM — 13 VIỆC, xếp theo GIÁ TRỊ/CÔNG

### Nhóm A · Chặng 2D cho đủ nghề
| # | Việc | Ghi chú |
|---|---|---|
| A1 | **Mode Revit đầy đủ** | 6/6 cơ chế đều thiếu (`SO-KIEM-TONG §7`): location line · hosted · type/instance · tham số cụm · Level object · constraint cao độ |
| A2 | **10 khuyết AutoCAD** ①-⑩ | `docs/SPEC-LENH-VE §4` — eyedropper, guide… |
| A3 | **Inference + VCB gõ-số-sau** (`3x` `/3`) | `VE-INFERENCE` |
| A4 | **Mode Phác thảo tablet** (bút·cử chỉ·radial) | `VE-SKETCH-TOUCH` 112d |

### Nhóm B · Chặng 3D cho đủ dựng
| # | Việc | Ghi chú |
|---|---|---|
| B1 | **114 lệnh dựng hình 3D** | 6 tầng `SPEC-DUNG-BO-LENH-3D`. `ops[]` mới nối `boolean`; `extrude`/`arrayLinear` khai type chưa derive |
| B2 | **Camera mức V-Ray** | tiêu cự mm · 2 điểm tụ · DOF · safe frame · lưu điểm nhìn · đường quay |
| B3 | **Material Editor** | D5-style + sphere live + per-map + publish (`VAT-LIEU §3b`) |
| B4 | **8 tính năng AI chặng 3D** | ①trước/sau ②chọn model ③Concept↔Precision ④thư viện mẫu ⑤viết đậm prompt ⑥mặt bằng→phối cảnh ⑦**callout số đo từ Doc** ⑧**ảnh→bản vẽ có keynote**. ⑦⑧ = MOAT |

### Nhóm C · Kho & dữ liệu
| # | Việc | Ghi chú |
|---|---|---|
| C1 | **Đổ 1449 món ATLAS** | qua cửa Excel đã có — Hoà tự làm 10 phút |
| C2 | **Thư viện block CAD** kiểu 3dsky | bàn ghế cây xe người 2D + model 3D. Mock thư viện trống đã có |
| C3 | **Web Clipper** | dán link web NCC → bóc tên/ảnh/giá. NCC Việt Nam có web, không có API |
| C4 | **Tầng ① nhà cung cấp** | `scope='global'` — 4 cột schema đã khai sẵn |

### Nhóm D · Trình chiếu & xuất
| # | Việc | Ghi chú |
|---|---|---|
| D1 | **Video editor** timeline | `SPEC-TRINH-VIDEO-EDITOR` 67d. KHÔNG viết engine |
| D2 | **Văn bản song ngữ** (hồ sơ thứ 5) | |
| D3 | **Multi-sheet D3** | bump `IDF_VERSION` + đổi shape persist + offset bbox. HOÃN tới trước ngày ship |

### Nhóm E · Trải nghiệm
| # | Việc | Ghi chú |
|---|---|---|
| E1 | **Intro** | Claude Design đang dựng (5 cú máy, cái ghế) |
| E2 | **Collab G2** | mock `mock-if-cong-tac.html` đã có, chưa code |
| E3 | **Trang chia sẻ** `/share/[token]` | mock chưa có — bộ mặt studio đưa ra ngoài |

---
## LUẬT VẬN HÀNH GIỮ NGUYÊN
- **Tối đa 4 phiên code cùng lúc.** Vùng file độc quyền, không chồng lấn.
- Mỗi phiên tự xưng tên `[P#]` ở đầu báo cáo.
- Luật N1-N7 (`§5`) và §9 (thiết kế trước, fill sau) không đổi.
- **D3 làm SAU CÙNG**, ngay trước ngày ship — nó đổi định dạng file người dùng lưu ra đĩa.

## RỦI RO ĐÃ BÁO, HOÀ CHẤP NHẬN
Ship một lần sau 13 việc ⇒ không có phản hồi studio thật cho tới cuối. COWORK-TỔNG đã
khuyến nghị ship sớm cho 1 studio song song; Hoà chọn làm hết rồi ship. Ghi lại để về sau
đối chiếu, không phải để cản.

---
## HOÃN (append-only — ghi để không quên, KHÔNG nằm trong 13 việc)

### AI chặng 3D — 8 tính năng rút từ tham chiếu Hoà gửi 04/08 (làm SAU đợt 12)
① thanh trượt trước/sau (khối trắng ↔ render) · ② chọn model AI kèm mô tả khi nào dùng ·
③ chế độ Concept ↔ Precision (giữ đúng hình học) · ④ thư viện mẫu phong cách ·
⑤ viết đậm prompt · ⑥ mặt bằng → phối cảnh một cú ·
⑦ CALLOUT KÍCH THƯỚC + SWATCH VẬT LIỆU đè lên ảnh render — đọc từ Doc thật ·
⑧ ảnh 3D → bản vẽ có keynote + tỉ lệ + chú giải vật liệu

⑦⑧ là MOAT: tool AI khác chỉ có ảnh, IF có Doc — biết kích thước thật, mã vật liệu thật,
giá thật; callout tự cập nhật khi bản vẽ đổi. Làm sau đợt 12.
