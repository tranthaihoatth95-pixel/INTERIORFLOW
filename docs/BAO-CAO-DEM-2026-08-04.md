# BÁO CÁO ĐÊM 03→04/08 — COWORK-TỔNG trực
*(Hoà đọc file này khi dậy — mọi quyết định đêm có lý do tại đây)*

## 23:1x · Hoà gửi ảnh chặng Rendering trước khi ngủ: "UI kì kì" — chẩn đoán 6 điểm
Ảnh: theme Sáng, sau merge 3c8dae6. Đối chiếu mock-if-3chang.html + SPEC-NGON-NGU + ảnh cũ 22:5x (còn panel "Thư viện khối" đầy đủ):
1. **Navigator chặng Render gần rỗng** — chỉ "ĐẦU VÀO 2", mất các nhóm node (phải là Nguồn·Xử lý·Bảng cảm hứng·Xuất theo mock). Nghi: Navigator mới của AppShell đang đổ node-instances thay vì nối NodeLibraryPanel. → giao CHINH.
2. **Toolbar bút dọc nổi lơ lửng** giữa canvas trái (chọn/bút/mực/marker/tẩy) — toolbar Mood+Collab đứng thường trực sai chỗ, trong khi dock dưới cũng đầy công cụ = 2 toolbar cùng lúc. → giao G4: chỉ hiện khi công cụ vẽ tay active, neo mép trái có lề, không đè canvas thường trực.
3. **Zoom 15% + canvas trống trơn** — fitView chạy khi chưa có node → tụt về min-zoom. → G4: canvas trống thì zoom 100%, có node mới fitView.
4. **Banner "Còn công cụ khác chưa hiện. Xem tất cả"** — chữ mơ hồ, không đúng khuôn SPEC-NGON-NGU (thiếu hành động rõ, nghe như debug). → G4: đổi thành khuôn "mách nước" có NÚT, hoặc bỏ.
5. **Empty state không mách gì** — màn trống không có "Kéo khối từ Thư viện / bấm + để bắt đầu" (khuôn trống của SPEC-NGON-NGU). → G4.
6. Minimap trống + chữ "React Flow" attribution lộ góc phải. → G4: attribution giữ theo license nhưng đặt gọn; minimap ẩn khi canvas trống.
**Quyết TỔNG (đêm, có căn cứ):** đây là regression trải nghiệm sau merge, KHÔNG phải mất tính năng (NodeLibraryPanel còn nguyên — grep sống, vào được qua Command Palette). Xếp ưu tiên: mục 1 = CHINH việc 1b GẤP (trước panel thò thụt); mục 2-6 = G4 việc 1b (trước MaterialSphere vì đây là mặt tiền chặng 2).

## 23:3x · Hoà chốt trước khi ngủ: "DUYỆT HẾT — cho lên tổng thể, sai đâu sửa đó"
Đã chuyển cơ chế sang ship-trước-sửa-sau (ghi đầu §3 sổ tổng). Gỡ chốt chờ-mock của G4-G2. Lưới an toàn giữ nguyên. COWORK-UI chuyển vai: mock = tài liệu polish hậu kiểm, không còn là cổng chặn.

## 23:5x · Duyệt 2 đề xuất COWORK-TRÌNH (căn cứ: rà 18 mục có bằng chứng git)
1 dòng vào 00-CHOT (Present sống/chết, vùng G4). #3 gộp H4 ✅. Bơm 3 việc mới cho TRÌNH (phiếu G4 · verify 3 mục · spec Material A3) — hết cảnh ngồi chờ NC.

## 00:0x · COWORK-VẼ xong SPEC-VE-INFERENCE — TỔNG duyệt cho chạy tiếp
Căn cứ duyệt: tự kiểm trùng trước khi viết · khảo sát code thật có điểm móc từng dòng (effectivePoint:447, commitEnter:928...) · 9 mục nghiệm thu đo được · không lấn vùng. Theo cơ chế ship-trước: duyệt, hậu kiểm trong ca audit. VẼ tiếp SPEC-VE-REVIT-MODE. Token --snap-*/--axis-* bơm cho COWORK-UI việc 0.

## 23:17 · KIỂM CUỐI TRƯỚC KHI HOÀ NGỦ — 7/7 phiên có dấu sống trong 17 phút (mtime báo cáo)
CHINH 16:09 · PHU 16:12 · G4 16:00 · UI 16:17 · NC 16:16 · TRÌNH 16:06 · VẼ 16:06+spec 16:09. Tất cả đã nhận lệnh.
⚠️ VIỆC CA AUDIT #1: CHINH abort merge nhanh-phu vì "mìn thật vùng PHU" (46f559b) — đọc BAO-CAO-CHINH
mục mới, xác định mìn, soạn phiếu sửa cho PHU (đúng vùng), rồi CHINH merge lại. BOQ chưa lên main tới lúc đó.
Luật trung thực đã ghi thành §0 sổ tổng theo lệnh Hoà.

## 23:2x · Hoà thêm §0b: luật SEARCH → NGHIÊN CỨU → NGHĨ-NHƯ-NGƯỜI-DÙNG trước mọi đề xuất/quyết. Đã ghi sổ, áp từ ca audit đầu tiên (checklist A4 mở rộng: kiểm cả 3 bước §0b).
