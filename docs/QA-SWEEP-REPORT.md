# QA SWEEP — Soi lỗi/flow/hiển thị toàn app (chốt chặn trước tinh chỉnh UI)

Mô phỏng người dùng thật (click, layer ẩn/khoá, kéo-thả, phím tắt) trên dev server `:3000`,
lái qua `window.__flowStore`/`__cadStore` + click thật + kiểm code. Ngày: 11/07/2026, HEAD `b7ed2d6`.
**Không sửa code** — chỉ báo cáo. Xếp P0 (chặn dùng) / P1 (khó chịu rõ) / P2 (đánh bóng).

## ✅ Đã kiểm — ĐẠT (xác nhận hoạt động đúng)
- **CAD tương tác** (AutoCAD-habit): chuột phải = Enter/kết thúc lệnh · window(trái→phải)/crossing(phải→trái) đúng chiều · F8 ortho lock · Zoom Extents (F) · crosshair + toạ độ live · snap/OSNAP · dynamic input số.
- **CAD "AI mô tả"** (bản mới): ra phòng có tường + nhãn diện tích + nội thất **đúng công năng, đúng layer `l-furniture`**, không tràn/nhảy.
- **CAD khác**: Mở bản demo, WALL/ROOM, Offset tường, thư viện block 2 tab (Cơ bản 16 / Thư viện 46), EXPLODE, panel Kiểm chuẩn (đo được, 0 vi phạm demo hợp lý), xuất DXF/PNG, theme sáng/tối redraw đúng.
- **Render canvas**: **nối dây validate dataType** trên đường kéo thật (`isValidConnection` FlowCanvas.tsx:89-101 báo lỗi VN rõ) · phím ⌘/Ctrl+Z/⌘⇧Z/Ctrl+Y · Sketch Studio vẽ→lưu node · phase tự đồng bộ khi mở flow.
- **Present**: `/present` + `/report` render editorial (serif, dấu TV sắc), điều hướng bàn phím; Present-mode in-app gom slide.composer; deck báo cáo 14 slide + PDF.
- **Reference**: tìm kiếm nâng cấp (tên·tag·mô tả·màu, không dấu VI, xuyên category) + hiển thị ưu tiên theo chặng.
- **Phím tắt đồng bộ Mac ↔ Windows** (⌘/Ctrl, thêm Ctrl+Y; tooltip đúng nền).

## 🔴 P0 — chặn dùng
- *(Không phát hiện P0 mới trong luồng non-AI.)* Nghẽn lớn nhất là **AI cloud đang mock** (fal hết balance, ComfyUI tuỳ máy) → node sinh ảnh trả mock. Đây là hạ tầng, không phải bug code (xem Rủi ro).

## 🟠 P1 — khó chịu rõ, nên sửa trước khi polish
1. **Khoá layer KHÔNG chặn sửa/xoá** (CAD). Tái hiện: mở demo → khoá layer "Tường" → click chọn 1 tường → Delete ⇒ **xoá được** (117→116). Chuẩn AutoCAD: layer khoá = thấy nhưng không chọn/sửa/xoá. Marquee (`idsInRect` trong `lib/cad/query.ts`) ĐÃ loại layer khoá, nhưng **click-chọn + `select()`/`deleteSelected()` chưa kiểm khoá**. Sửa ở `lib/cad/store.ts` (select/deleteSelected/updateEntities bỏ qua entity thuộc layer locked) + `hitTest` (`query.ts` — ⚠ file phiên hatchfix đang giữ, phối hợp). 
2. **"AI mô tả" quá thận trọng**: phòng 4×3.5 có "giường đôi + tủ áo" → solver đặt giường, **bỏ tủ** để tránh chồng (thực tế phòng này thừa chỗ cho cả hai). Cần cải packing (thử nhiều mặt tường trước khi bỏ). File `lib/cad/ai-assist.ts` (`layoutToEntities`/`placeFurniture`).
3. **"Dự án mới" đôi khi phải bấm 2 lần** (doc CONTENT/handoff ghi) — cần xác nhận + fix ProjectSelect.

## 🟡 P2 — đánh bóng
- `store.onConnect` **không tự validate dataType** (chỉ tầng UI `isValidConnection` chặn) → gọi store trực tiếp/edge-case tạo được dây sai. Defense-in-depth: validate trong `onConnect`.
- **Crossing chỉ xét đầu mút** (không bắt đoạn xuyên khung) — `query.ts idsInRect` (hatchfix territory).
- **Rule PCCC nghi lẫn cao/rộng**: `vn-fire-exit-door-height-min` `verified:false` (`docs/CAD-STANDARDS.md:99`).
- **`setPanel` là toggle** (click icon rail lần 2 = đóng) — trực giác một số người dùng mong "chuyển panel", dễ tưởng lỗi. Cân nhắc chỉ-mở / có chỉ báo panel đang mở.
- **Reference P1 còn (từ agent gu-ml)**: thiếu trục SUBJECT/room trong `gu.ts`; VLM caption không gọi lúc upload; classify dồn 'space' conf 0.35.
- **i18n**: soi chuỗi hardcode/lẫn demo theo `CONTENT-RULES.md` (chưa quét toàn bộ).
- **Responsive mobile**: header/panel còn thô ở màn hẹp (đã có cover <480px read-only, nhưng khoảng 480–900px cần rà).
- **Hydration**: cổng `/` nhiều nhánh (loader/login/ProjectSelect/cover/stageDone) — cần bảo đảm không nhấp nháy sai màn.

## 🔐 Rủi ro
- **AI cloud không chạy** (fal balance, Gemini/NVIDIA free giới hạn) → mọi node sinh ảnh = mock; demo "chất lượng ảnh" phụ thuộc ComfyUI local (chậm MPS ~15ph/ảnh) hoặc nạp balance.
- **uploads/ = dữ liệu sống KHÔNG backup** (từng mất 38 file) → nên đưa vào routine backup.
- **Desktop/LAN + SQLite**: chưa nhận webhook/redirect công khai → ảnh hưởng tầng tích hợp sắp làm (xem docs/INTEGRATIONS.md).
- **Drag-drop native HTML5**: khó test tự động (synthetic pointer không kích hoạt) → cần DataTransfer đúng MIME khi dựng E2E sau.

## Phạm vi & độ tin
Đã lái tay + kiểm code các khu CAD / Render / Present / Reference / phím tắt. **Chưa** đào sâu:
photo-editor, chat team 2 chiều thật, share link end-to-end với tài khoản thứ 2, luồng OAuth Google thật.
Khuyến nghị đợt sau: dựng **Playwright** (mock AI) để phủ regression các luồng trên + drag-drop DataTransfer.
