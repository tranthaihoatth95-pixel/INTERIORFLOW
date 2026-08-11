# HANDOFF — InteriorFlow — 11/08/2026

## 1. Đọc trước khi làm

1. `AGENTS.md`
2. `STATUS.md`
3. `docs/00-CHOT.md`
4. Tài liệu này

Không đọc toàn bộ `docs/`. Không tìm tài liệu trong `knowledge/` vì thư mục đó rỗng. IF là sản phẩm độc lập/global, không được nhúng TTT hay dữ liệu khách.

## 2. Ý định sản phẩm đã chốt

InteriorFlow là một hệ làm việc thiết kế nội thất/kiến trúc xuyên suốt, nhưng mỗi chặng vẫn dùng độc lập được:

- Luồng pipeline: ý tưởng/brief → 2D kỹ thuật → 3D/visual/render → trình bày/hồ sơ.
- Luồng tác vụ lẻ: người dùng có file sẵn thì nhập thẳng đúng chặng để xem, chỉnh, bổ sung hoặc xuất lại; không ép đi qua bước trước.
- Một nguồn dữ liệu chung: cấu kiện, vật liệu, thông số, hình ảnh, BOQ, spec và slide liên kết bằng ID/provenance; sửa một nơi thì các nơi tiêu thụ phải biết thay đổi.
- Vitals là trợ lý toàn app, không được xuất hiện thành hai sản phẩm cạnh tranh nhau. Một Vitals có ngữ cảnh theo app/dự án/chặng/tác vụ; mọi hành động ghi phải có preview và undo.
- Mỗi nhóm lớn có ít tính năng hơn nhưng phải thật, hữu ích và đủ chất lượng chuyên nghiệp; không mở CTA giả.

## 3. Logic các chặng

### Chặng 0 — Ý tưởng/brief/collab

- Canvas cộng tác kiểu Miro: brainstorm, sticky, frame, moodboard, mind map và hệ khung lập luận thiết kế.
- Vitals/Magic hỗ trợ tổng hợp brief, nhận diện pattern/phong cách/màu/vật liệu, đề xuất cấu trúc thảo luận.
- Kết quả được chốt thành **Thẻ gu draft** có provenance: ảnh tham khảo, layout, palette, vật liệu, motif, nguyên tắc; phải tái dùng cho 3D AI, render AI và các trang concept ở Present.

### Chặng 1 — Thiết kế 2D

- Sketch: tablet-first, thao tác bút/ngón nhanh như app CAD trên tablet.
- Pro/BIM: hướng AutoCAD + Revit nhưng dễ hơn; lưu hình học và ngữ nghĩa thật, type/instance/category/level/provenance.
- Đầu ra đắt giá: zoning/layout; mặt bằng/mặt đứng/chi tiết có mã; hatch liên kết vật liệu; thống kê vật liệu/furniture/MEP/đèn; khung tên đọc Brand Kit dự án.
- Nhập hiện có: IDF/DWG/DXF; DWG còn rủi ro GPL. IFC mới metadata, chưa BIM thật. Cần tiếp tục kiểm độ trung thực DXF/DWG (block/text/hatch/line type/arc/spline/layer và hiệu năng).

### Chặng 2 — 3D, visual, render, camera/video nguồn

- Hai shell: Render + Mood + Collab và Vẽ 3D.
- Vẽ 3D phải tiến tới dễ như SketchUp, sức mạnh theo hướng 3ds Max/Revit nhưng thao tác mô tả → dựng khối → sửa tay; hình học AI chỉ là đề xuất có ràng buộc/kiểm chứng, không giả chính xác.
- Cùng Doc 2D↔3D; wall/floor/ceiling/room/type-instance/material ID thống nhất.
- Magic: mô tả khối/cụm furniture để dựng; đưa reference/Thẻ gu draft vào tone, vật liệu và bố cục.
- Render MVP: sketch/clay/image→render, đổi vật liệu/ánh sáng, vùng render, khóa hình học/vùng/seed, nhiều phương án, upscale, lịch sử/checkpoint.
- Element extraction: tách furniture/decor/tường/trần/sàn/cụm khỏi ảnh; tạo asset riêng, góc nhìn khác, front/side/top; chỉ sinh kích thước khi có mốc chuẩn và phải ghi confidence.
- Material extraction hai chiều: ảnh → swatch/map/thuộc tính/đối tượng; đổi material ID → cập nhật 3D, mặt bằng, mặt đứng, material board, spec và BOQ.
- Camera/video: bookmark góc máy, camera path, eye-level và low-angle/tracking; video nguồn thuộc chặng 2, editor dựng video thuộc chặng 3.

### Chặng 3 — Present/output

- Magic giống Canva: nhận Brand Kit + nội dung + hình ảnh; AI tự chọn số slide theo nội dung, không giới hạn 7 slide.
- Có đủ content + ảnh: sinh deck nguyên vẹn. Thiếu ảnh: dùng placeholder có note. Thiếu content: sinh dàn ý, tiêu đề và text mẫu có thể sửa.
- Editor tay phải có group, mask, fill overlay, filter, màu nền tùy chỉnh và thao tác bố cục thiết yếu.
- Năm loại hồ sơ: Deck, Material board, BOQ/bảng tính, Word/biểu mẫu, Video. Chỉ mở loại thật sự hoạt động.
- Hiện thật: nhập PPTX cơ bản, ảnh, IDFP; BOQ nhập XLSX/CSV; xuất PDF/PPTX/PNG/IDFP/XLSX. DOCX/PDF deck và editor Word/Video/HTML chưa hoàn chỉnh.

## 4. Library, cấu kiện và định dạng

- Một **Master Library**, lọc theo chặng; File Manager là nơi chứa file, Library là nơi chứa món đã có ngữ nghĩa/tái sử dụng.
- Mỗi món là cấu kiện nhiều ngữ nghĩa: identity, category, type/instance, geometry, 2D symbol/hatch, 3D asset, materials, dimensions, vendor, price, spec, provenance, revisions và usages.
- Hatch không phải vật liệu và không phải IFC: hatch chỉ là một biểu diễn 2D của material/assembly; phải tham chiếu `materialId`, không tạo kho vật liệu riêng.
- Furniture mua sẵn cần form spec: mã, tên, ảnh/góc, khu vực, số lượng, model/vendor/contact/link, kích thước, finish/material, giá, ownership/procurement flags, notes, approval/certification.
- Furniture custom cần thêm bản vẽ front/side/top/section, kích thước kiểm soát, cấu tạo/lớp vật liệu, hardware/joinery, shop drawing/prototype/approval và revision.
- Định dạng dài hạn: 3D native SKP/MAX/FBX/IFC/RVT là mục tiêu sau R1; hiện GLB/glTF/OBJ-MTL là lossy. Present cần import/export văn phòng tương ứng nhưng phải ghi đúng mức hiện có.

## 5. BOQ/spec logic đã chốt

- Không bắt người dùng bắt đầu từ bảng trống khó hiểu.
- Có form/template trung tính theo tác vụ: room finish, furniture, lighting, material, procurement, quotation/spec.
- Người dùng điền form → bảng BOQ thật tự sinh; hoặc nhập XLSX/CSV có sẵn → map cột → liên kết cấu kiện.
- “BOQ Magic” qua Vitals: mô tả task lẻ để tạo cấu trúc bảng, hỏi giá/spec/khối lượng; mọi con số có nguồn và trạng thái ước tính/xác nhận.
- Nguồn làm việc nên là dữ liệu IDF/JSON có schema; XLSX là định dạng trao đổi/xuất phổ biến, không nên dùng Excel làm nguồn chân lý duy nhất.

## 6. Intro IF cần truyền đạt

Thông điệp cốt lõi: “Từ ý tưởng đến bản vẽ, từ bản vẽ đến không gian, từ không gian đến hồ sơ trình bày — trong một dòng dữ liệu.” IF vừa chạy trọn quy trình, vừa cho mở từng chặng độc lập; file, vật liệu, cấu kiện, BOQ, render và slide không bị đứt liên kết.

## 7. Phát sinh UI cuối phiên — trạng thái chính xác

Yêu cầu mới nhất của Hoà:

- Các chặng **không dùng hình nền trang trí/ảnh/aura**.
- Canvas **vẫn phải có pattern kỹ thuật của canvas** để định hướng không gian. Câu “PATTERN CANVAS ĐÂU?” nghĩa là phiên vừa rồi đã hiểu quá tay: đã tắt luôn pattern, đây là lỗi cần sửa ngay.
- Pattern đề xuất: dot grid hoặc line grid rất nhẹ, dựa token theme, không gradient, không ảnh, không quầng tím; đủ thấy ở zoom thường nhưng không cạnh tranh node.
- Minimap/ô Tổng quan đặt góc trên bên phải.
- Toolbar đáy hiện vẫn cần rà lại hình học/responsive; không được che node, minimap, Vitals hay status bar.

Code chưa commit của phiên này:

- `app/settings/_lib/wallpaper.ts`: hiện đã khóa `WallpaperId='none'` và tắt cả React Flow background — **cần sửa lại để trả pattern canvas trung tính**, nhưng không khôi phục aura/warm/cool/image wallpaper.
- `app/settings/_lib/local-state.ts`: mặc định `none`.
- `app/settings/_components/AppearanceCard.tsx`: đã bỏ bộ chọn wallpaper, thay bằng giải thích nền trung tính.
- `components/FlowCanvas.tsx`: minimap đã chuyển `top-right`; Background hiện `transparent` — cần đổi thành pattern nhẹ.
- `components/BottomToolbar.tsx`: bottom 12px và max-width theo canvas.
- `STATUS.md`: đã ghi thay đổi nhưng cần sửa câu “nền trơn” thành “pattern canvas trung tính” sau khi hoàn tất.

## 8. Server và Git tại lúc bàn giao

- Repo: `/Users/tranben/Downloads/interiorflow`
- Branch: `main`
- HEAD: `fc3036d docs: record staged 3d build mock`
- Chỉ có một worktree: repo chính.
- Dev server đúng mã nguồn đang chạy ở `http://localhost:3000` (PID lúc bàn giao: 28293).
- Server 3015 đã dừng. Nếu tab 3015 còn mở thì đóng hoặc đổi sang 3000.
- `npx tsc --noEmit` PASS sau các sửa UI.
- Chưa commit các sửa UI cuối phiên.
- Untracked thuộc người dùng, không được đụng: `AGENTS.md` và bốn file `docs/mocks/mock-*2026-08-09/10.html` đang hiện trong `git status`.

## 9. Việc tiếp theo theo thứ tự

1. Sửa ngay pattern canvas: nền trung tính + dot/line grid nhẹ; kiểm light/dark và nhiều zoom.
2. Chụp/kiểm Render ở desktop và tablet: minimap top-right; toolbar không che nội dung/status/Vitals.
3. Commit riêng nhóm sửa UI khi Hoà yêu cầu hoặc sau khi nghiệm thu.
4. Tiếp M1 3D theo `STATUS.md`: same Doc, wall/floor/ceiling/room, transform/snap/hotkey, Library contract.
5. Sau đó triển khai Material/Element Impact MVP: extraction → asset/material identity → preview impact → apply/undo → cập nhật usages.
6. Tiếp Present Magic + BOQ form/Magic theo logic ở trên, không mở output giả.
7. Trước R1: test/build/package/smoke, license DWG, neutral/PII audit, backup/restore/versioning.

## 10. Quy tắc không được làm sai

- Không hardcode thương hiệu studio; Brand Kit thuộc từng dự án.
- Không gọi AI là chính xác nếu thiếu scale/constraint/evidence.
- Không tách hatch thành thư viện vật liệu thứ hai.
- Không tạo hai Vitals.
- Không ép pipeline; mọi chặng phải mở độc lập bằng import/handoff.
- Không mở nút hay định dạng chưa làm thật.
- Không sửa/xóa file dirty hoặc untracked không thuộc task.
