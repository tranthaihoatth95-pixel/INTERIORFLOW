# PHIẾU A · DESIGN VẼ MOCK — 14 màn thiếu hợp đồng giao diện

**KHÔNG PHẢI PHIÊN CODE.** Đây là việc của Claude Design. Không tốn slot worktree / dev server.
Đầu ra: file `.html` trong `docs/mocks/`, mỗi màn một file, **dựng ĐỦ 2 THEME** (sáng + tối).

## LUẬT VẼ (bắt buộc — 44/67 trang cũ ĐỎ vì phạm mấy điều này)
- **G2** panel nền đặc ≥92%, popover ≥96%, chữ tương phản ≥4,5:1
- **G4** line-height ≥1,5 — thấp hơn là **cắt mất dấu tiếng Việt**
- **G6** nút quyết định phải có **CHỮ**, không chỉ icon
- **G8** kéo-thả không được là đường duy nhất — luôn có nút thay thế
- **G9** hiệu ứng kính lỏng chỉ dùng ở 4 chỗ đã chốt
- **G1** cấm animate `opacity` trên `backdrop-filter`
- Tự đủ: **KHÔNG** nạp icon/phông từ Internet (mất mạng = mất 44 icon / rơi phông Việt)
- Chữ mẫu phải viết `{{ }}` — không gõ thẳng "PLACEHOLDER" ra màn
- Thumbnail phải **vẽ thật**, không in tên component ra màn
- Mỗi trang ghi rõ **"BẢN CHỐT"** hay **"đã thay thế"** (G-M5-03: 6 trang cùng tả một màn, không trang nào ghi)
- **Trung tính**: 0 tên khách, 0 brand studio nào. IF là sản phẩm global.
- Nhãn chặng theo chốt 07/08: `Thiết kế 2D` · `Thiết kế 3D` · `Trình chiếu` (song ngữ VI/EN), **bỏ chữ "CAD"**

## 14 MÀN CẦN VẼ (`docs/GAP-IF.md` dòng trong ngoặc)
| # | Mã | Màn |
|---|---|---|
| 1 | G-M5-01 (37) | **Nhập bản vẽ có sẵn**: chọn tệp → thanh tiến độ → nút Huỷ → báo cáo nạp (đọc được / bỏ qua / cảnh báo). Năng lực đã có ở code nhưng **chưa từng được vẽ** |
| 2 | G-M5-03 (39) | **Chặng 2D bản chốt** — 6 trang cũ cùng tả màn này, chọn/gộp thành MỘT, đóng dấu bản hiệu lực |
| 3 | G-M5-04 (40) | **Cụm xuất in**: hộp xuất PDF · tờ giấy · bảng nét in. 4 trang cũ còn nguyên `{{ }}` rỗng |
| 4 | G-M5-05 (41) | **Thư viện** — trang cũ trỏ tới 4 trang con **không tồn tại**, mở ra kệ trống |
| 5 | G-M5-06 (42) | **Phiên bản hồ sơ**: so trước–sau bản vẽ · đánh dấu chỗ vừa sửa · đóng dấu bản phát hành |
| 6 | G-M5-07 (43) | **Cửa sổ bốc tách / đo món** (trục chính của luồng ảnh→bảng) |
| 7 | G-M5-08 (44) | **Bảng N món** + hồ sơ FF&E chuẩn ngành (mã · ảnh · hoàn thiện · NCC · SL · ô duyệt) |
| 8 | G-M5-10 (46) | **3 màn đã CODE mà chưa có mock**: kho vật liệu · cửa nhập bảng tính (ghép cột / xem trước / báo dòng hỏng) · bảng màu sơn |
| 9 | G-M5-11 (47) | **Màn nhận ĐỀ BÀI** — bước mở đầu, hiện chỉ là panel lọt trong màn vẽ |
| 10 | G-M5-12 (48) | **Zoning theo chương trình**: chia khu · bảng diện tích từng khu · đối chiếu số người ↔ diện tích · xếp bộ phận theo tầng. **Khoảng trống lớn nhất** |
| 11 | G-M5-14 (50) | 19 trang cũ chỉ dựng MỘT theme → dựng lại đủ 2 |
| 12 | G-M5-16 (51) | 5 kiểu hỏng cửa kiểm cho lọt — xem mô tả chi tiết ở dòng 51 |
| 13 | G-M5-17 (52) | Hợp đồng nằm NGOÀI vùng cửa kiểm (4 tài sản: seed hệ thiết kế · 2 trang đề xuất ở gốc repo · hệ thiết kế PDF) |
| 14 | G-M5-15 (53) | 10 trang là màn của **app song song** — tách hai sản phẩm, đặt quy ước tiền tố |

## THỨ TỰ ĐỀ NGHỊ
1 → 9 → 10 (ba màn mở đầu luồng, chặn nhiều thứ nhất) → 7 → 6 → 3 → 5 → còn lại.

## VERIFY
Mở thật bằng trình duyệt, **cả 2 theme**. Chạy `npm run check:mocks`. Không đếm "đã có mock" mà không mở ra xem tả gì (bệnh G-M5-05).
