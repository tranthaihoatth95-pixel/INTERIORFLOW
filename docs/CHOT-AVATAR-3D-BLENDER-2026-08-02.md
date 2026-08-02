# CHỐT — AVATAR 3D DỰNG BẰNG BLENDER (đường ra cho bài toán "đẹp như Apple")

> Hoà 02/08 chiều: *"vì sao OPPO họ làm được? họ cũng làm giống Apple đó"* + *"dựng blender cho tôi xem thử 1 mockup"*.
> Cowork đã **cài `bpy` (Blender 5.0.1) chạy headless trong sandbox** và render thử 3 vòng — **CHẠY ĐƯỢC**.

## 1 · Vì sao SVG không bao giờ đạt, mà cách này đạt
| | SVG tự vẽ (`AvatarRenderer` 1271 dòng) | Blender render |
|---|---|---|
| Khối/volume | giả bằng gradient — luôn "bẹt" | **thật**, ánh sáng tự tính |
| Da | màu phẳng | **tán xạ dưới bề mặt** (subsurface), hồng hào như da người |
| Mũi | vẽ hình bầu dục, không nổi | **khối nhô ra có bóng đổ thật** |
| Ánh sáng | phải vẽ tay từng vệt sáng | 3 đèn studio, tự đổ bóng nhất quán |
| Sửa kiểu tóc | tính lại toạ độ tay | đổi tham số, render lại |

⇒ Đây **chính là cách Apple/OPPO làm**: hoạ sĩ dựng 3D → render mỗi mảnh thành PNG cùng góc máy +
cùng nguồn sáng → app chỉ **xếp chồng lớp**. Chất 3D đến từ khâu RENDER, không từ code app.

## 2 · Đã chứng minh (3 vòng, mỗi vòng render ~90 giây)
- v1: khối đầu + mũi + mắt + tóc + má; đã ra chất 3D thật nhưng tóc mỏng, lọn mái đặt sai.
- v2: tóc dày phủ trán, thêm má ửng, mắt bớt lồi; lông mày bị xoay sai trục thành 2 chấm.
- v3: sửa trục lông mày, tóc ôm thái dương, mắt lún vào — **đạt mức dùng được làm mẫu**.
- File script: `/tmp/avatar3d_v3.py` (Cycles, 64 samples, 640×640, nền trong suốt, Principled BSDF
  có subsurface cho da). Cần đưa vào repo khi chốt hướng.

## 3 · Nếu chốt hướng này thì làm gì
1. **Dựng bộ phận rời** trong Blender: 1 đầu + N kiểu tóc + N kính + N áo + biểu cảm.
2. **Render mỗi mảnh** thành PNG trong suốt — CÙNG góc máy, CÙNG ánh sáng, nhiều tông da.
3. App **xếp chồng lớp** ảnh theo lựa chọn (nhẹ hơn nhiều so với vẽ SVG runtime).
4. Hoặc gọn hơn: render sẵn **24–40 avatar hoàn chỉnh**, người dùng chọn 1 — bỏ builder tham số.

⚠️ Chi phí thật: render là **việc một lần** (offline, lúc build), app chạy chỉ hiện ảnh — nhanh hơn SVG hiện tại.

## 4 · Còn phải chỉnh (v3 chưa hoàn hảo)
Lông mày còn vuông cứng (nên bo tròn hai đầu) · mắt hơi cao · tai chưa có vành · chưa có kính/áo ·
chưa thử tông da khác. Đây là mẫu chứng minh hướng đi, chưa phải asset cuối.

---
*Cowork dựng + ghi 02/08/2026. Thay thế hướng "vẽ SVG bằng tay" trong `CHOT-AVATAR-MEMOJI` §5.*
