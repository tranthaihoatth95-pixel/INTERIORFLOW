# SPEC — FILE MANAGER *(quản lý file toàn app)*

> Duyệt 01/08/2026 — xem `CHOT-DUYET-SPEC-DOT2-2026-08-01.md`.
> Mảnh còn trống giữa Gateway và Library.
> Đọc cùng `IF-ARCHITECTURE-BLUEPRINT-v1.md` §5B, `SPEC-IF-LIBRARY.md`.

---

## 1. Ba lớp khác nhau — đừng lẫn

| Lớp | Lo việc gì | Đã có? |
|---|---|---|
| **Gateway** | Định dạng vào/ra · adapter · nén ngữ nghĩa | ✅ blueprint §5B |
| **Library** | Kho tài sản có thẻ · tìm kiếm · phân loại | ✅ spec riêng |
| **File Manager** | **File nằm đâu trên đĩa · đặt tên gì · dọn khi nào · sao lưu ra sao** | ⬜ **file này** |

> **File Manager là cái xương · Gateway là cái cổng · Library là cái đầu.**
> Thiếu xương thì hai cái kia treo lơ lửng.

## 2. ⚠️ RỦI RO SỐNG CÒN của local-first

`dev.db` 143 MB + `uploads/` 185 MB nằm trên **một ổ cứng**:

> **Ổ cứng hỏng = mất toàn bộ dự án. Không có bản nào khác.**

Cloud app không có vấn đề này. Local-first thì **backup không phải tính năng phụ — nó là điều
kiện sống**. Đây là cái giá của việc chọn local-first, và phải trả.

## 3. Nguyên tắc gốc: **mở Finder ra vẫn hiểu**

Designer quen làm việc với file — họ muốn *thấy* file, copy được, gửi được.
**Tuyệt đối không giấu file trong app data với tên băm.**

```
~/InteriorFlow/
├── Projects/
│   └── 2026-07 Nord Villa/
│       ├── Nord Villa.idf        ← nhấp đúp từ Finder là mở app
│       ├── 01-input/             ← DXF · ảnh hiện trạng · brief khách
│       ├── 02-cad/
│       ├── 03-render/            ← ảnh render, tên đọc được
│       ├── 04-present/
│       ├── 05-output/            ← PDF · PPTX · video đã xuất
│       └── _archive/             ← bản cũ
├── Library/                      ← dùng chung mọi dự án
│   ├── Materials/  Blocks/  Templates/  Images/  Fonts/
└── _Backups/
```

Nhấp đúp `.idf` mở được app — chi tiết nhỏ nhưng là thứ khiến người dùng cảm thấy **"app thật"**,
không phải website.

## 4. Sáu việc File Manager phải làm

| # | Việc | Vì sao |
|---|---|---|
| 1 | **Cây thư mục theo dự án** | Mở Finder vẫn hiểu · copy/gửi được |
| 2 | **Đặt tên đọc được** — `Nord-phongkhach-v3.jpg`, không phải `a8k2f.jpg` | ⚠️ `img_` id nằm trong **metadata**, KHÔNG nằm trong tên file |
| 3 | **Thả file vào là tự nhận** *(watch folder)* — bỏ vào `01-input/` → app tự phân loại | Nối thẳng vào **tầng 1 tự phân loại** của Library |
| 4 | **Vòng đời file**: nháp → chính thức → lưu trữ; file tạm tự dọn sau N ngày | Render tạm phình rất nhanh |
| 5 | **Bảng dung lượng** — dự án nào nặng · cái gì xoá được | 185 MB hôm nay, 50 GB sau một năm |
| 6 | **Sao lưu + đóng gói** — `.ifpack` một file gửi được · tự backup định kỳ | **Điều kiện sống của local-first** |

## 5. Cầu nối ba lớp

```
File vào 01-input/ → Gateway đọc định dạng → Library gắn thẻ → dùng trong 3 chặng
                                                    ↓
Sản phẩm xuất ra ← 05-output/ ← gắn img_/deck_ id ← KnowledgePack → não T5
```

## 6. Thứ tự

| Pha | Làm gì |
|---|---|
| **1** | Cây thư mục + quy ước tên + `.idf` mở từ Finder |
| **2** | **Backup tự động + `.ifpack`** — làm sớm, đừng đợi mất dữ liệu mới làm |
| **3** | Watch folder `01-input/` → tự phân loại vào Library |
| **4** | Vòng đời file · bảng dung lượng · dọn file tạm |

## 7. QUAN HỆ VỚI LIBRARY — cửa hàng ↔ chợ đầu mối

| | LIBRARY (cửa hàng) | FILE MANAGER (chợ đầu mối) |
|---|---|---|
| Sắp xếp theo | Ý NGHĨA — nhóm · thẻ · gu · dự án | CẤU TRÚC THƯ MỤC trên đĩa |
| Nội dung | ĐÃ TUYỂN CHỌN, có thẻ, chưng đẹp | TẤT CẢ — kể cả file thô, tạm, khoá |
| Ai vào | Designer, hằng ngày | Khi cần biết file nằm đâu |
| Vai trò | Mặt tiền | LỚP TRUNG GIAN app ↔ máy tính |

### Ba tầng + phân quyền

```
LIBRARY (đã duyệt, lọc theo chặng)
  ▲
FILE MANAGER: Projects/ đọc-ghi · Library/ đọc-ghi
             · Knowledge/ 🔒 CHỈ ĐỌC (quy chuẩn · sách · .md của Vitals)
             · _System/ 🔒 KHOÁ (.idf gốc · cache · backup)
  ▲
Ổ ĐĨA
```

**Vì sao khoá `Knowledge/`**: xoá nhầm file quy chuẩn → checker im lặng bỏ qua lỗi (nguy hiểm hơn
báo sai) · sửa nội dung TCVN → Vitals trích dẫn sai mà vẫn tự tin · đổi tên → trích dẫn gãy.

**KHOÁ ≠ GIẤU**: vẫn cho XEM (biết Vitals dựa vào gì) và THÊM (studio nạp sách của mình), chỉ chặn
sửa/xoá. Đúng luật kệ sách: app là tủ rỗng, tenant tự nạp.

### Đường một chiều chợ → cửa hàng

```
File vào Projects/01-input/ → máy đọc + gắn thẻ → "CHỜ DUYỆT" trong Library
→ người bấm duyệt → lên kệ Library.
```

Bước "chờ duyệt" giữ cho cửa hàng không thành kho lộn xộn thứ hai — đây là điều phân biệt 2 lớp.

**NGOẠI LỆ**: thứ do chính IF sinh ra (ảnh render, deck xuất) TỰ LÊN KỆ, vì đã sạch sẵn.

---

*v1.1 (thêm §7 quan hệ Library ↔ File Manager) · 2026-07-27 · Ben soạn theo ý Hoà.*
*v1.0 · 2026-07-26 · Ben soạn theo ý Hoà.*
