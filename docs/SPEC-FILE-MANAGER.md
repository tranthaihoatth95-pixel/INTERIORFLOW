# SPEC — FILE MANAGER *(quản lý file toàn app)*

> **[CẦN HOÀ DUYỆT]** · Mảnh còn trống giữa Gateway và Library.
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

---

*v1.0 · 2026-07-26 · Ben soạn theo ý Hoà.*
