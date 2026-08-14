# PHIẾU GIAO · CN2 — chỉnh tiếp chuẩn nét: vá 2 lỗi vật liệu + tách vòng tay vịn + nối recipe

## THẺ VAI [Đ4]
- VAI: CN2 — agent hình học vòng 2, vá lỗi T soi mắt bắt được trên `lincoln-327-chuannet.obj` + làm nốt phần CN khai nợ.
- PHẠM VI/TRẦN: `lib/idfc-import/chuan-net.ts` (+test) · script proof scratchpad · báo cáo. ⛔ KHÔNG đụng `components/library/**` (agent CW đang nối UI ở đó) · KHÔNG sửa build-ops ruột (chỉ gọi) · KHÔNG đụng from-photo.ts.
- ĐIỀU KHOẢN RUỘT: [T6] đo bằng số + MỞ FILE ĐẦU RA soi mắt trước khi khai xong · [T0] fit không nổi thì giữ mesh, cấm ép.

## ① BỐI CẢNH — 2 LỖI T SOI MẮT 14/08 (render OBJ bằng three, ảnh trong báo cáo T)
- **CN-F1 · MESH GIỮ LẠI ĐEN BÓNG — HỒI QUY**: GLB gốc render ra nhung mù tạt + gỗ óc chó đúng màu; OBJ sau chuẩn-nét thì thân/nệm/lưng thành ĐEN BÓNG. Texture atlas `lincoln-327-basecolor.png` KHÔNG hỏng (T mở xem: có đủ nhung vàng, gỗ, đồng — nhưng có VÙNG ĐEN LỚN ở giữa atlas). Nghi phạm số 1: bước **dedupe (vị trí,UV) làm lệch chỉ số `vt`** → face tham chiếu nhầm sang vùng đen của atlas. Phải kiểm chính xác: xuất thử OBJ KHÔNG dedupe → nếu màu đúng thì đúng là lỗi index; sửa cho ánh xạ vt/face khớp tuyệt đối, có TEST bảo vệ (fixture: mesh 2 tam giác UV khác nhau → sau dedupe UV mỗi face phải giữ nguyên giá trị).
- **CN-F2 · CHÂN TRỤ MẤT VẬT LIỆU GỖ**: 4 chân fit ra trụ nhưng gán `mat_primitive` Kd xám 0.72/0.70/0.66 → nhìn như nhựa xám, lạc khỏi ghế gỗ óc chó. Phải cho primitive KẾ THỪA vật liệu vùng mesh mà nó thay: lấy **màu trung vị (median) các texel** mà mesh gốc của mảnh đó tham chiếu (qua UV) → gán Kd; nếu sinh được UV trụ (cylindrical unwrap) thì map luôn atlas cho đẹp — không làm nổi thì Kd trung vị là đủ, khai rõ.

## ④ VIỆC
1. Vá CN-F1 + CN-F2 như trên (test cho cả hai).
2. **Tách vòng tay vịn thành torus** (CN cũ khai không tách được vì dính nệm mọi lát cắt): thử đường HÌNH HỌC thuần khác — quét mặt phẳng theo trục NGANG (trục vòng), tìm cụm điểm có bán kính-tới-tâm gần đều (annulus) trong dải góc ≥300°, dùng RANSAC circle fit trên các lát; đạt ngưỡng (RMS <2% + phủ ≥300°) thì tách + fit torus qua build-ops, không đạt thì GIỮ MESH + khai (không ép, đúng CN cũ).
3. **Nối recipe vào `.idfc`**: bổ sung phần `body.component.recipe` (dạng BuildOp union đã có) vào bản ghi idfc — để app đọc lên chỉnh tham số được. CHỈ ghi ra file proof `.idfc` mới trong scratchpad (đừng đụng from-photo.ts của agent khác).
4. Xuất lại bộ file proof: OBJ+MTL(+texture) + recipe.json + `.idfc` — và **RENDER ẢNH KIỂM** (dùng cách T đã làm: viewer three trong public/ đã có sẵn `__objview.html`, chỉ cần copy file mới đè lên `public/lincoln-327-chuannet.*` rồi chụp) — BẮT BUỘC tự soi mắt ảnh render trước khi khai xong: màu phải giống GLB gốc (nhung vàng + gỗ nâu + đồng), chân không được xám nhựa.
5. tsc 0 · chuan-net.test + build-ops + from-photo không vỡ.

## ⑦
Báo cáo `docs/bao-cao-phien/2026-08-14-CN2-va-vat-lieu.md`: nguyên nhân THẬT của CN-F1 (đo, không đoán) · Kd trung vị từng chân · vòng tay vịn tách được không + số đo · poly cuối · ảnh render kiểm (đường dẫn) · phần chưa làm. Trả T ≤12 dòng.
