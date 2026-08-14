# PHIẾU GIAO · PL — PartLock: cấu kiện lắp ghép có tên thật + khoá từng phần (LUẬT NGÀNH thứ 6)

## THẺ VAI [Đ4]
- VAI: PL — agent lõi idfc-import, thi công luật Hoà chốt 14/08.
- PHẠM VI: `lib/idfc-import/part-lock.ts` (MỚI) + test + script proof scratchpad + báo cáo.
  ⛔ KHÔNG đụng chuan-net.ts/surface-graph.ts ruột (CHỈ GỌI kết quả, không sửa thuật toán của chúng)
  · KHÔNG đụng from-photo.ts, components/**.
- ĐIỀU KHOẢN RUỘT: [T2] mở rộng RegionId, không đẻ engine mới · [T6] khoá = ĐO ĐƯỢC (byte-identical,
  không "gần giống") · [T5] người chọn khoá cái gì, máy không tự quyết cấu kiện nào bất khả xâm phạm.

## ① BỐI CẢNH — nguyên văn luật Hoà
*"Chi tiết fur đều là 1 cấu kiện vật lý được ghép rời như 1 chiếc ghế thực tế. Việc tinh chỉnh vật
liệu ở cấp độ chi tiết sản phẩm là có, không thể cấm khách hàng comment. Luật chung: khi tạo sinh
sản phẩm phải có cách trực tiếp/gián tiếp cho phép thay đổi, tinh chỉnh thiết kế, khoá cái không đổi.
Đổi điều cần đổi thôi, không phải cả khối render là chốt cứng."*
→ Đẳng cấu với Grounded Render: 2D dùng mask ảnh khoá vùng không sửa; đây là **bản 3D của cùng
nguyên tắc** — mask hình học + vật liệu, khoá cấu kiện không sửa.

## ② NỘI LỰC ĐÃ CÓ (Đ2 — chỉ nối, không viết lại)
`lib/idfc-import/surface-graph.ts` — ĐÃ phân 62 diện + gộp 21 cụm vật liệu (gỗ 75,3%/vải 23,4%/
kim loại 1,3%) trên Lincoln, mỗi diện có frame/tham số/màu. `chuan-net.ts` — ĐÃ tách 4 chân + 2 vòng
thành primitive tham số qua build-ops. Cái THIẾU: (a) đặt TÊN cấu kiện theo giải phẫu ghế thật thay
vì "diện #N" (b) cờ `khoa` per-cấu-kiện (c) hàm tái sinh CHỈ phần chưa khoá, chứng minh phần khoá
giữ nguyên byte.

## ④ VIỆC (marker `PartLock`)
1. **Đặt tên cấu kiện theo giải phẫu**: từ output surface-graph (62 diện/21 cụm) + chuan-net (6 primitive),
   ánh xạ sang danh sách cấu kiện CÓ TÊN NGHỀ cho ghế bar có tay vịn: `mat-ngoi` (seat) · `tua-lung`
   (backrest) · `chan-trai-truoc/chan-phai-truoc/chan-trai-sau/chan-phai-sau` (4 legs, từ 4 cylinder
   CN đã fit) · `vong-tay-trai/vong-tay-phai` (2 torus CN đã fit) · `thanh-giang` (stretcher — từ cụm
   freeform lớn nhất phủ đúng vị trí ngang dưới chân, theo toạ độ Y thấp). Việc GOM diện→cấu-kiện
   dùng luật: diện liền kề (chia sẻ biên) + cùng vật liệu + cùng vùng không gian (bbox) → 1 cấu kiện.
   Cấu kiện nào không khớp tên nghề nào → giữ tên kỹ thuật `phan-YY` + khai (không ép đặt tên sai).
2. Type `PartLockAsset`: `{ parts: [{ id, tenNghe:{vi,en}, geomRef (mesh subset | buildOp tham số),
   matHex, matId?, khoa: boolean, provenance }], lienKet: [{a,b}] (cấu kiện nào chạm cấu kiện nào —
   để tinh chỉnh 1 phần không làm rách mối nối) }`.
3. `buildPartLockFromChuanNet(surfaceGraph, chuanNetResult): PartLockAsset` — hàm thuần ghép 2 nguồn
   trên thành cây cấu kiện đặt tên.
4. `regenerateUnlocked(asset, khoaIds: string[], tinhChinh: fn): PartLockAsset` — CHỈ gọi `tinhChinh`
   trên cấu kiện KHÔNG nằm trong `khoaIds`; cấu kiện bị khoá copy y nguyên (test: hash mesh/tham số
   TRƯỚC = SAU tuyệt đối với phần khoá).
5. **Proof thật trên Lincoln**: build cây cấu kiện từ 2 báo cáo agent sáng nay (dùng lại
   `scratchpad/lincoln-surface-graph.json` + `lincoln-327-chuannet-recipe.json` nếu còn, không thì
   chạy lại 2 hàm CHỈ-GỌI để tái sinh input) → in DANH SÁCH cấu kiện có tên + số diện mỗi cụm →
   demo khoá `[mat-ngoi, tua-lung]` (giữ nhung nguyên) + "tinh chỉnh" giả lập đổi `matHex` của
   `vong-tay-trai/phai` (đồng bóng → đồng đen mờ) → chứng minh 2 cấu kiện khoá HASH KHÔNG ĐỔI,
   2 cấu kiện tinh chỉnh có đổi, phần còn lại (chân, giằng) cũng giữ nguyên vì không nằm trong lệnh sửa.
6. Xuất `scratchpad/lincoln-part-lock.json` + bảng ASCII cây cấu kiện (tên · loại · khoá?) để soi mắt.
7. Test: fixture 3 cấu kiện giả → khoá 1, sửa 2 → hash phần khoá bất biến; gom diện thành cấu kiện
   đúng số lượng kỳ vọng trên input tổng hợp.

## ⑥
tsc 0 · test mới pass · surface-graph.test + chuan-net.test không vỡ · in cây cấu kiện Lincoln thật
ra console + lưu file, T sẽ đọc trực tiếp (không cần ảnh).

## ⑦
Báo cáo `docs/bao-cao-phien/2026-08-14-PL-part-lock.md`: danh sách cấu kiện đặt tên được (bao nhiêu/
tổng), cấu kiện nào phải giữ tên kỹ thuật (vì sao), kết quả chứng minh khoá-bất-biến, phần chưa làm
(UI chọn khoá = phiếu sau). Trả T ≤12 dòng.

## ⑧
Entry `part-lock-cau-kien` — T flip sau audit.
