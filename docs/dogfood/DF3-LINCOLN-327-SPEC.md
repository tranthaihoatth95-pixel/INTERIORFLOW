# DF3 · Lincoln Bar Chair 327 (Mezzo Collection) — spec VERIFIED từ hãng, proof cho import-ghe-tu-hinh

> Nguồn: mezzocollection.com/en/products/upholstery/bar-chair/lincoln-327 (T fetch 14/08).
> Vai trò: cột VERIFIED đối chiếu tham số máy suy (inferred) trong pipeline ảnh→3D-có-tham-số.

| Trường | Giá trị hãng (verified) | Máy suy từ ảnh (inferred, T ước 14/08) | Lệch |
|---|---|---|---|
| Tên/mã | Lincoln Bar Chair · 327 · Mezzo Collection | "ghế bar" | — |
| Rộng | 580 mm | ~450 | −22% |
| Sâu | 600 mm | ~500 | −17% |
| Cao tổng | 1110 mm | ~1100 | ✓ |
| Cao mặt ngồi | 850 mm (bản counter 650) | — | thiếu |
| Khung | Matte Walnut Wood | gỗ óc chó | ✓ |
| Kim loại | Polished Brass (2 vòng tay vịn tròn) | đồng bóng | ✓ |
| Bọc | Fabric (hãng không nêu loại; ảnh: nhung mù tạt) | nhung mù tạt | ✓ (ảnh) |
| Nặng | 16 kg | — | thiếu |
| Tuỳ chọn | custom sizes/finishes | — | — |
| Không có trên trang | COM/COL yardage · designer · tên vải | | |

Bài học cho auto-define: vật liệu suy từ ảnh ĐÚNG cả 3 lớp; kích thước ước theo "chuẩn ghế bar
chung" lệch −17..22% vì Lincoln là ghế CÓ TAY VỊN bệ rộng → luật suy phải phân loại
có-tay/không-tay trước khi áp bảng chuẩn. Cao mặt ngồi + trọng lượng KHÔNG suy được từ ảnh
đơn — đúng vùng phải hỏi/tra (measured/verified), máy không được đoán bừa [T0].

Dùng cho proof: bước ② pipeline điền cột verified này vào PHIẾU thay vì bắt người gõ; bước ④
.idfc params = bảng trên + provenance {nguon: 'mezzocollection.com', luc}.
