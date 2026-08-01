# RÀNG BUỘC IF2 — thứ IF1 KHÔNG ĐƯỢC PHÁ

> **Đây KHÔNG phải spec IF2.** Spec IF2 chưa viết được — nó ăn dữ liệu từ ATLAS + ArchiNote, cả
> hai chưa tồn tại; viết bây giờ là đoán, và đoán sẽ hỏng (bằng chứng: spec video viết 24/07 lỗi
> thời sau **8 ngày**).
>
> **Đây là danh sách ngắn những ràng buộc IF1 phải giữ**, để khi tới lượt IF2 thì nó rẻ. Mọi phiên
> code đọc file này trước khi đụng `lib/cad/model.ts`, `dxf.ts`, hoặc thiết kế lược đồ mới.

## Luận điểm gốc — vì sao IF2 rẻ

🔍 `TU-VAN-CHANG-3-VA-IF2-2026-07-30.md` §6: **chặng 3 là HÀM CHIẾU, không phải trình dàn trang.**
Một `.idf` chiếu ra PDF · PPTX · XLSX · phim — và **tablet công trường là ĐÍCH THỨ NĂM**.
⇒ IF2 không phá kiến trúc IF1, nó **thêm một đích**. Giữ được tính chất này thì IF2 rẻ; phá nó thì
IF2 thành sản phẩm viết lại.

## Bảy ràng buộc cứng

| # | Ràng buộc | Neo trong code hôm nay |
|---|---|---|
| 1 | `elementType` + `storey` **luôn optional, không bao giờ bỏ, không bao giờ ép bắt buộc** | 🔍 `model.ts:71 · :160 · :163` — đã đóng dấu *"IF2-nền"*, IFC 4.0 |
| 2 | **XDATA round-trip phải sống**: `IF_STOREY=` · `IF_ELEMTYPE=` (+ khoá mới nếu thêm) đi qua DXF không mất | 🔍 `dxf.ts:359 · :498` (APPID) · `:541` · test `dxf.roundtrip.test.ts:184` · `cad-core-b1.test.ts:110` |
| 3 | **`.idf` cũ luôn mở được.** Mọi trường mới là additive | luật đã áp cho `zone`/`arrow`/`ellipse` (24/07) — giữ nguyên khuôn đó |
| 4 | **Chặng 3 không được hardcode danh sách đích.** Thêm đích mới = thêm một bộ chiếu, không sửa lõi | §6 — tablet là đích #5 |
| 5 | **Ảnh/ghi chú hiện trường gắn vào CẤU KIỆN, không gắn vào dự án** | §7 ④. Ảnh hưởng MỌI lược đồ đính kèm thiết kế từ nay — sai chỗ này là migrate đau |
| 6 | **IFC quan trọng ở chiều NHẬN hơn chiều XUẤT** | §7 ⑥. Đừng dồn công làm IFC export đẹp; ưu tiên đọc được file người khác đưa |
| 7 | **Thời gian là chiều thứ tư của mô hình** — lịch sử phiên bản không phải tính năng phụ | §7 ②. `FlowVersion` + thang lưu giữ (7.1.27) là hạt giống, đừng cắt |

## Cầu 3D — một nền, ba người dùng

🔍 `lib/three/cad-to-obj.ts` (+ test) và `camera.ts` đã có. Ba thứ cùng cưỡi lên nó:
video bậc 2-b (khối 3D thô) · tool **Đổi góc phối cảnh** (`SPEC-RENDER-STUDIO` §6B pha 4) · **cắt
lớp trên tablet IF2**. ⇒ Khi làm bất kỳ cái nào, làm cho **cả ba** dùng được, đừng nhét riêng.

## KHÔNG làm bây giờ

IFC export đầy đủ · phát hiện va chạm · 4D tiến độ · UI tablet. Tất cả thuộc IF2, chưa có dữ liệu
để làm đúng. 🔍 `NGHIEN-CUU-TAM-NHIN-IDF` §4 đã tự đính chính: những thứ này **thị trường có 30 năm
rồi** — không phải chỗ để giành thời gian lúc IF1 chưa ship.

## Khi nào viết spec IF2 thật

Đủ **cả ba** điều kiện, không sớm hơn:

1. IF1 đã ship và có người dùng thật.
2. ATLAS Larkbase chạy — có nguồn vật liệu thật để nối dự toán.
3. ArchiNote đã thu được dữ liệu hiện trường một thời gian — để biết *thật sự* cần gì, thay vì đoán.

---

*Cowork ghi 01/08/2026. File này ngắn có chủ đích. Thấy ràng buộc mới thì thêm 1 dòng vào bảng —
đừng biến nó thành spec.*
