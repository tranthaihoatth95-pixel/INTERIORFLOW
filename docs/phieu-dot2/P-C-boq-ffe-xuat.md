# PHIẾU C · BOQ · FF&E · XUẤT HỒ SƠ

Vùng sở hữu: `lib/boq/` · `lib/ffe/` · `components/present-editor/boq/` · `components/print/` · `lib/export/`.
**KHÔNG** đụng `lib/cad/`, `lib/three/`, `lib/materials/` (phiếu khác đang mở).
Luật: V6 KHÔNG commit · §0u ghi `docs/M-BOQ-OUT.md`, KHÔNG ghi `docs/GAP-IF.md` · N1 · N5 · N6 (component phải chứng minh có nơi mount) · N8 mọi dòng có `file:dòng`.
⚠️ §0aa — trước khi kết luận "lỗi code" từ lỗi trình duyệt: `grep -rl "<tênHàm>" .next/static/chunks/`. Rỗng ⇒ lỗi build cache.

## VIỆC 1 — kiểu dữ liệu BẢNG cho luồng node (G-M3-02, `GAP-IF.md:22`) · CHẶN
Luồng node chỉ có ảnh/chữ/mặt nạ/số/video — **không có kiểu BẢNG** ⇒ danh sách N món không tồn tại được như dữ liệu chạy giữa các khối, không khối nào xuất ra bảng món.
Đây là nút chặn của G-M3-01 (bốc N món) và G-M5-08. Làm trước.

## VIỆC 2 — nối dây hai bước cuối ảnh→bản vẽ (G-M3-03, dòng 23)
Khớp mẫu block theo tỉ lệ + ba hình chiếu: **đã viết xong, có test, 0 nơi gọi**. Từ món đã đo không có nút nào ra được block/bản vẽ. Tìm nơi mount đúng, nối, **bấm thật** rồi mới báo xong (N6).

## VIỆC 3 — `components/print` chưa mount (G-M13-03, dòng 103)
Grep nơi mount. Nếu không có ⇒ hoặc nối vào đường xuất hồ sơ, hoặc khai thẳng là code chết và đề xuất xoá. **Không để lửng.**

## VIỆC 4 — cột số lượng đếm (cái/bộ) (G-M5-09, dòng 45)
Mock trang hồ sơ trình khách ĐÃ vẽ cột SL + đơn vị "cái/tấm"; trang bảng khối lượng thì không, engine cũng chỉ quét m². G-M3-09 đã đóng phần engine (đếm được 8 cái × 2.450.000). Việc còn lại: **cột SL trên bảng khối lượng**, khớp mock.
⚠️ Mock ĐI TRƯỚC code ở 3 điểm (tự thêm cột · popover ƒx · truy vết sửa-tay↔số-máy). **Code đuổi theo mock, KHÔNG sửa mock theo code.**

## VIỆC 5 — nếu còn thời lượng
- G-C-01/02 (`GAP-IF.md:88,89`)
- G-M3-17 (dòng 90) — đường ghi TỪ CỬA NHẬP xuống DB
- G-M3-11 / G-M3-04: đã đóng mức file + đã bấm nút; **kiểm lại** file .xlsx mở được bằng Excel thật chưa (chưa ai xác nhận)

## CẤM
- Không nhồi giá/NCC/hao hụt vào `MaterialPbr` (luật 2.1.9.i: MaterialDef=thị giác, ProductSpec=thương mại, **cố ý không trộn**). Cần liên kết thì thêm KHOÁ NỐI.
- Không tự chạy `npm run dev` mới — §0aa: một thư mục repo = một server.

## HÀNG ĐỢI (§V7) — bắt buộc cuối lượt
Đã xong (kèm số đo) · còn treo · vì sao treo · cái gì CHƯA VERIFY.
