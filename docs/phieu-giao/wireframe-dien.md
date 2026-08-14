# PHIẾU GIAO · WF — WIREFRAME + ĐỊNH BIÊN THEO DIỆN → hệ giá trị định vị → nét·màu·vật liệu

> Hoà chỉ đạo 14/08 (khoanh view profile point-cloud): *"áp dụng thuật toán wireframe, định biên
> theo diện. Chia lưới xác định lại hệ giá trị cần để định vị đúng. Phần cấu kiện vật liệu định
> nghĩa NÉT → MÀU → VẬT LIỆU."* — đây là tầng THAY THẾ cách cắt-lát mù của chuẩn-nét v1.

## THẺ VAI [Đ4]
- VAI: WF — agent hình học, dựng tầng "đồ thị diện" (surface graph) cho mesh máy sinh.
- PHẠM VI/TRẦN: `lib/idfc-import/surface-graph.ts` (MỚI) + test + script proof scratchpad + báo cáo.
  ⛔ KHÔNG đụng `chuan-net.ts` (agent CN2 đang sửa) · KHÔNG đụng `from-photo.ts` · KHÔNG đụng
  `components/**` (agent CW đang làm) · build-ops + lib/materials CHỈ GỌI.
- ĐIỀU KHOẢN RUỘT: [T6] mọi bước ra SỐ (số diện, RMS fit, % phủ) · [T0] diện nào không phân loại
  nổi ghi `freeform` + khai, cấm ép · [T1] output nối được vào matId/geom2d của IF, không đẻ hệ riêng.

## ① ĐẦU VÀO
`scratchpad/lincoln-327.glb` (mesh Trellis gốc, 15.538 tris, 1 khối liền, có atlas UV) — bản GỐC,
KHÔNG lấy bản chuẩn-nét v1 (đang được CN2 vá).

## ④ THUẬT TOÁN — 6 bước, mỗi bước có test
1. **CHUẨN HOÁ**: weld đỉnh trùng (giữ ĐÚNG UV index — bài học CN-F1), bỏ tam giác suy biến, tính
   pháp tuyến/diện tích từng tam giác, dựng bảng cạnh↔tam giác (half-edge hoặc map cạnh).
2. **PHÂN VÙNG THEO DIỆN** (region growing): gộp tam giác kề nhau có góc pháp tuyến < ngưỡng
   (mặc định 15°, tham số hoá) thành PATCH; lọc patch vụn (< 0,3% tổng diện tích) gộp vào hàng xóm
   lớn nhất. Ra: danh sách diện + diện tích + số tam giác.
3. **PHÂN LOẠI DIỆN**: mỗi patch thử fit — `planar` (fit mặt phẳng, RMS/bbox < 1%) · `cylindrical`
   (trục PCA + bán kính) · `toroidal` (tâm + R lớn/nhỏ, phủ góc ≥ 240°) · còn lại `freeform`.
   Ghi tham số + RMS + độ phủ cho từng loại.
4. **WIREFRAME = BIÊN DIỆN** (đúng chữ Hoà "định biên theo diện"): cạnh có 2 tam giác thuộc 2 patch
   KHÁC nhau (hoặc cạnh hở) = feature edge → nối thành polyline khép kín theo từng diện → đơn giản
   hoá Douglas-Peucker (dung sai 0,5% bbox). Đây là NÉT. Xuất được ra SVG/DXF-like polyline 3D.
5. **HỆ GIÁ TRỊ ĐỊNH VỊ + CHIA LƯỚI**: mỗi diện có local frame {origin = centroid, trục = pháp
   tuyến + 2 trục PCA}, bbox cục bộ (u×v), và tham số hình học nếu là primitive. Chia lưới CÓ CẤU
   TRÚC trên diện phẳng/trụ (grid theo local frame, mật độ tham số hoá) → topology đều, dễ chỉnh;
   diện freeform giữ tam giác nhưng gắn frame + bbox để định vị.
6. **NÉT → MÀU → VẬT LIỆU** (chuỗi Hoà chốt): với mỗi diện — ①NÉT đã có ở B4 ②MÀU: lấy median
   texel atlas theo UV các tam giác trong diện (bỏ 10% ngoài rìa tránh viền), ra hex + độ lệch
   ③VẬT LIỆU: ánh xạ hex + đặc trưng hình học sang matId của IF (dùng `lib/materials` sẵn có —
   `inferPbrFromCategory`/kho matId; grep trước khi tự chế) → gán {matId?, MaterialPbr nháp,
   cờ `inferred`}. Diện cùng màu+cùng loại kề nhau thì GỘP thành 1 cấu kiện vật liệu.

## ⑤ OUTPUT (scratchpad, để T soi mắt)
`lincoln-surface-graph.json` {dien: [{id, loai, frame, thamSo, bienPolyline, mauHex, matId?, cờ}],
tomTat} · `lincoln-wireframe.svg` (chiếu 3 hình: đứng/cạnh/bằng — nét biên diện, để soi bằng mắt) ·
`lincoln-dien.obj` (group theo diện, material theo màu diện) · in BẢNG: số diện theo loại, top 8
diện lớn nhất kèm màu + vật liệu suy ra.

## ⑥ NGHIỆM THU
tsc 0 · test mới (fixture hộp + trụ + torus tổng hợp: phải ra đúng số diện + đúng loại + tham số
±1%) · các test cũ trong lib/idfc-import KHÔNG chạm (file khác) · **tự mở SVG wireframe soi mắt**:
nét phải đọc ra hình ghế, không rối như point cloud.

## ⑦
Báo cáo `docs/bao-cao-phien/2026-08-14-WF-surface-graph.md` — bảng số + ảnh/SVG + đánh giá thật:
diện nào ra đẹp, diện nào freeform vì sao, chuỗi nét→màu→vật liệu ra kết quả gì trên ghế Lincoln.
Trả T ≤12 dòng.
