# Zone tool — Báo cáo demo · Report

> Nhánh `feat/zone-tool` · 24/07. Tô vùng chức năng mặt bằng (zoning diagram) + mũi tên luồng giao thông, phục vụ trình bày concept — GAP-COLOR-FILL N3.

## Tính năng đã có
- **Zone** (2 kiểu biên): OVAL — click tâm → click góc; POLYGON — click chuỗi điểm, Enter/double-click kết thúc → form nhập nhãn VN + nhãn EN (tuỳ chọn).
- **6 nhóm chức năng** (ZONE_GROUP_META, song ngữ): Khu ướt · Wet area / Khu sinh hoạt chung · Social / Khu riêng tư · Private / Khu làm việc · Work / Ban công · Balcony·Loggia / Phụ trợ · Service·MEP — mỗi nhóm 1 màu cố định.
- **Panel Zone · Diagram**: đổi kiểu biên, nhóm, độ mờ fill (mặc định 40%); điều khiển ảnh aerial site nền (hiện/fit/gỡ, tỉ lệ ±10%, di chuyển, độ mờ).
- **Legend tự sinh** ("Nhóm chức năng · Legend"): gom nhãn zone theo nhóm, click chip = chọn + zoom tới zone.
- **Arrow** — mũi tên luồng giao thông nét đứt, 1 hoặc 2 đầu (arrowBothHeads).
- **Cách gọi**: toolbar nhóm Diagram (cả 2 mode Sketch/Pro) · dòng lệnh `ZONE`, `AW`/`ARROW` (alias mới — `Z` GIỮ nguyên = Zoom Extents).
- **Đầy đủ pipeline**: move/copy/rotate/mirror/scale · undo/redo · lưu .idf round-trip · DXF export (zone→HATCH SOLID+TEXT, ellipse/arrow→LWPOLYLINE) · backward-compat .idf cũ.

## Cách dùng nhanh
1. Gõ `ZONE` (hoặc bấm icon Blend nhóm Diagram) → panel Zone mở.
2. Chọn nhóm chức năng + kiểu biên; click tâm → click góc (oval) → nhập nhãn → ✓.
3. Legend tự cập nhật; `AW` vẽ mũi tên giao thông; `U` undo.

## Verify 24/07 (phiên tiếp sức 2)
- `npx tsc --noEmit` PASS.
- `sucrase-node lib/cad/zone.test.ts` — **33 pass, 0 fail** (schema/render/transform/DXF + mục [2] backward-compat .idf cũ).
- `sucrase-node lib/cad/idf.test.ts` — 31 ok, 0 fail.
- Browser 127.0.0.1:3012 (session demo có sẵn): gõ `ZONE` → autocomplete → tool kích hoạt, panel + hint hiện; vẽ oval → form nhãn → tạo zone "DEMO ZONE" thành công, legend tự thêm chip; `U` gỡ sạch. 3 screenshot demo: `01-canvas-zone-map.png` · `02-canvas-aerial.png` · `03-export-presenting-slide.png`.

## Nợ / ghi chú
- 🟡 Trong phiên verify thấy **1 lần** overlay `IndexSizeError: ellipse radius âm (-37.44)` ở drawPreview (CadCanvas) khi thao tác chuột bất thường (click ngoài viewport + resize cửa sổ). KHÔNG tái hiện được với thao tác thường; đã thêm Math.abs phòng thủ ngay tại preview zone (commit này). Theo dõi thêm.
- 🟡 Zone panel + Legend + Layer panel chiếm nhiều diện tích khi mở cùng lúc trên màn hẹp — cân nhắc collapse legend ở viewport < 900px.
- Aerial site: dùng ảnh tĩnh user tự thả, chưa có fetch bản đồ.
