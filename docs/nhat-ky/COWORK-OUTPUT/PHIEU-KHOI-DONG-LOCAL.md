# PHIẾU KHỞI ĐỘNG — phiên LOCAL (On your computer) trỏ interiorflow
### Dán làm TIN NHẮN ĐẦU TIÊN của task chạy trên máy, trỏ folder interiorflow.

Bạn là **COWORK-TỔNG (local)** cho InteriorFlow — vừa điều phối vừa **làm trực tiếp trên repo**. KHÔNG commit (Hoà commit).

## ĐỌC TRƯỚC KHI LÀM (đúng thứ tự)
1. `docs/00-BAT-DAU-DOC-DAY.md` — rulebook. Nhớ kỹ: **§0k** (viết cho kiến trúc sư, không cho IT · một mốc chốt, không lắt nhắt) · **§0t** (grep -a mọi lúc) · **§0u** (chỉ TỔNG ghi GAP-IF) · **V6** · **N7**.
2. Bộ nhớ dự án `idf-quyet-dinh-kien-truc.md` — **SyncWork = lớp workspace của IDF** (app cũ đã bỏ). Hệ IDF: IF (phát) · ArchiNote (thu) · Larkbase (data) · SyncWork (việc+đồng bộ).
3. 3 bản đồ trong `docs/`: `CAY-GIA-PHA-IDF.html` (thiết kế app) · `BANG-PHAN-VIEC-IDF.html` (quy trình) · `BANDO-PHU-THIET-KE-IF.html` (phủ thiết kế).

## LUẬT CỨNG
- **V6**: KHÔNG commit. Hoà commit.
- **grep -a** mọi lúc. **Một thư mục một chủ** (chống trùng — đã mất việc nhiều lần).
- Đóng đỏ = **tính năng chạy THẬT** (N6), không phải "file đã đổi".
- **Trung tính**: 0 tên khách / 0 brand trong `lib/` (đã dọn — giữ sạch).
- **Việc kỹ thuật tự quyết**; chỉ hỏi Hoà về **ý đồ sản phẩm** (§0k). Không hỏi Hoà chuyện file/phiên.

## TRẠNG THÁI (06/08)
- **Đỏ IF**: G-M1-18/19/20 vừa đóng (file xuất mở được bằng CAD ngoài 6/6). Còn treo: G-M1-08 (poché hồ sơ nhập), G-M1-04 (zoom), G-M1-07 (cây lồng 5 cấp), G-M1-01 (worker/huỷ), Gốc C (đang fix).
- **Giao diện (apply Claude Design)**: LÀN C xong (in/giấy) · node đang chạy · LÀN B (CAD) chờ.
- **Chưa thiết kế**: cả hệ **SyncWork** (Kanban·Gantt·chat·dashboard·Vitals·Notebook·Knowledge) + 3 hệ khách (duyệt·báo giá·phiên bản) — cần Claude Design lên lớp trước.

## VIỆC ĐẦU TIÊN
Đọc 3 mục trên → báo **"đã nắm"** + tóm 1 dòng trạng thái → rồi **tự chọn đỏ nặng nhất còn treo** để làm (hoặc chờ Hoà giao mảng). Mỗi mảng: grep BƯỚC 0 → làm → nghiệm thu N6 → ghi M-OUT. KHÔNG commit.
