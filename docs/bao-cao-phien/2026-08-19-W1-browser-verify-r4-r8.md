# Báo cáo phiên 19/08 — W1 BROWSER VERIFY nợ R4 + R8

Worker verify (read-only code, chỉ lái browser). Server dùng lại **3001** (PID 20546, không đẻ server mới). ⓪b: HEAD `c7f3ac8` — ĐÚNG mốc phiếu. Dự án dùng để thử: `cmsqu517r0001w9axbunx9m7m` ("Dự án mới"). Đăng nhập sẵn, Home hiện ngay.

## ① Việc được giao
Trả nợ BROWSER-PENDING cho 2 packet xong-máy:
- **R4** — `Tool3DBar` đổi vỏ sang `ToolbarBar`/`ToolbarChip` (chặng 3D, mode Vẽ 3D).
- **R8** — geom2d reader: món `.idfc` thả từ Thư viện thành entity từ CHÍNH `body.geom2d` (chặng 2D, `LibraryDropBridge` + `library-item-resolve` nhánh `via:'idfc'`).

## ② Kết luận

### R4 — **BROWSER-PASS** (kèm 1 finding layout)
Đường đi: Home → "Mở lại →" (việc đang dở) → chặng 3D → gạt "Vẽ 3D" → bấm nút **Chữ nhật** trên dock.
- **Bar hiện đúng khuôn ToolbarBar capsule** — đo bằng `getComputedStyle` phần tử trong `.if-3d-tool-bar`: `border-radius: 999px` (r-full), cao **44px**, nền đặc `rgb(20,20,23)` (= `--panel`, không backdrop-blur — G9 giữ), border `1px solid rgb(42,42,49)`, shadow `rgba(0,0,0,.65) 0 8px 30px -8px`. Ô số bo full tự đồng tâm.
- **Nút "Áp dụng" bấm được**: bấm ✓ với mặc định 3000×2000×2700 → khối dựng thật trong viewport 3D, cây tầng mọc "Sàn + Tường 1", bar tự về Chọn.
- **Hotkey + Enter hoạt động**: phím `c` mở bar Vòng tròn, ô đầu (Tâm X) tự focus + select — gõ `5000` rơi thẳng vào ô; Enter (dispatch KeyboardEvent `key:'Enter'` vào ô đang focus, đi qua đúng listener capture của bar — xem ⑦b về vì sao phải dispatch) → áp + về Chọn, khối trụ "Tường 2" xuất hiện đúng X=5000.
- **Console sạch** — 0 error trong toàn bộ kịch bản.

🔴 **FINDING R4-L1 (layout, không phải hành vi)**: với tool nhiều ô số (Chữ nhật 5 ô, Đường 6 ô), bar rộng **915px** trong khi viewport 3D (offsetParent của bar) chỉ **678px ở cửa sổ 1440×900** khi Command3DPanel mở (518px ở 1280×720). Bar `left:50%` + `white-space:nowrap`, không max-width ⇒ **tràn cả hai bên**: mép phải 1534 > 1440 (dòng nhắc "Enter áp · Esc huỷ · Space về Chọn" bị CẮT khỏi màn), mép trái đè lên Command3DPanel. Đo: `bar {l:619, r:1534, w:915}` / `parentW:678` / `winW:1440`. Nút Áp dụng vẫn trên màn, chức năng không mất — nhưng dòng dạy phím thì người dùng 1440 không bao giờ đọc trọn với tool rect/line. Nghi là bệnh CÓ TỪ TRƯỚC R4 (nowrap + left:50% là hành-vi-giữ-nguyên, R4 chỉ đổi vỏ) — chưa đối chiếu bản trước để khẳng định. Đề xuất: `max-width: min(100%, …)` + cho phép wrap, hoặc ẩn dòng nhắc khi hẹp.

### R8 — **BROWSER-PASS** (đường geom2d exercise ĐƯỢC, qua đường nhập UI thật)
Kho `.idfc` ban đầu **RỖNG** (kệ "Cấu kiện (.idfc)" đếm 0; IDB `interiorflow-sheets` 0 object store; legacy `if.library.idfc.v1` null) — đúng dự đoán phiếu. Nhưng **UI CÓ đường nhập**: empty-state kệ có nút "Nhập vào kho" → mode **Nạp hàng loạt** (`BulkIngestMode`) nhận `.idfc` qua drop. Nên KHÔNG phải khai "không exercise được":
1. Dựng file `.idfc` v3 hợp lệ **trong phiên browser** (kind `furniture`, tên "Ghế Verify R8", mã `VR8-GHE-001`, geom2d = **tam giác poly + vòng tròn** — hình cố tình KHÔNG tồn tại trong kho block nào, tên cũng không khớp block nào ⇒ nếu có hình rơi xuống thì chỉ có thể từ geom2d).
2. Thả vào dropzone Nạp hàng loạt bằng DragEvent + File thật → parse ✓ hiện "Ghế Verify R8 · VR8-GHE-001 · Cấu kiện IF · 402 B" → bấm **"Đưa vào kho"** → kệ Cấu kiện (idfc) = 1 món, badge STUDIO, cột thông số mở đúng.
3. **Bấm đúp món** (hành động "dùng" của kệ) → đóng sheet → **entity xuất hiện giữa bản vẽ: đúng tam giác + vòng tròn** (2 nét, layer l-furniture), status bar + toast: *"Đã thả "Ghế Verify R8" từ hình vẽ của chính mẫu .idfc — 2 nét, bấm một nét là chọn được cả cụm. ⌘Z để lùi."* — đúng nguyên văn nhánh `via:'idfc'` trong `LibraryDropBridge.tsx:116`. **Hình từ geom2d, không phải khớp-tên** — chứng minh kép: hình học tự chế + câu báo của đúng nhánh.
- **Console sạch** — 0 error suốt R8.

Regression fallback (món thường):
- "Sofa 3 chỗ" bấm đúp → *"Đã thả "Sofa 3 chỗ" vào giữa màn hình — ⌘Z để lùi."* = nhánh `blockdef` (BlockEntity thật, không "nét rời", không "gần đúng") — đường cũ còn sống.
- Ghi nhận thêm (ngoài phạm vi, không phải lỗi R8): "Cửa 1 cánh 800" bấm đúp → *"Chưa có hình vẽ cho 'Cửa 1 cánh 800' — kho block chưa có món này…"* — unresolvedMessage trung thực, không thả bừa; món cửa vốn không có trong BLOCKS/manifest.

## ③ Bằng chứng
- Đo DOM sống (JS trong page): khuôn capsule + số tràn R4-L1 như trên.
- Status/toast nguyên văn hai nhánh `idfc` và `blockdef` (đọc trên status bar app thật).
- Screenshot đã chụp trong phiên browser (bar Chữ nhật ở 1280 và 1440 · khối dựng sau Áp dụng · khối trụ sau Enter · kệ idfc 0 món → 1 món · cụm tam giác+tròn trên bản vẽ · sofa blockdef). Ảnh nằm trong transcript phiên; chưa đổ ra Drive/IF-duyet-mat (worker không có quyền ghi ngoài file report này).

## ④ Dữ liệu thử để lại (khai để dọn)
- Kho studio (IDB): 1 mẫu `.idfc` "Ghế Verify R8 / VR8-GHE-001" — xoá bằng nút xoá trên kệ nếu không muốn giữ.
- Doc dự án "Dự án mới": 2 khối 3D (Tường 1 hộp 3000×2000×2700 · Tường 2 trụ r600 tại X=5000) + trên bản vẽ 2D: cụm idfc 2 nét + 1 block Sofa 3 chỗ. Dọn = mở dự án ⌘Z vài nấc hoặc xoá tay.

## ⑤ Việc không làm
- Không sửa file code nào. Không git. File duy nhất ghi = report này.
- Không kiểm `missing-specId-item` ở BOQ thật (xem ⑦b).

## ⑥ Đề xuất
1. Mở phiếu nhỏ sửa **R4-L1** (bar tràn với tool ≥5 ô số ở mọi cỡ màn khi panel mở) — một dòng CSS max-width/wrap, kèm quyết định giấu/thu dòng nhắc phím khi hẹp.
2. R8 UF-2 mắt đứt 2 coi như **ĐÓNG qua mắt-máy-browser**; mắt Hoà chỉ còn cần liếc ảnh nếu muốn.

## ⑦b CHƯA CHẮC / CHƯA KIỂM
- **Enter qua bàn phím OS thật chưa kiểm được**: tool browser (CDP `key: Return`) gửi keydown với `key: ""` (đo bằng listener cài tạm — artifact của tool, không phải của app). Đã vòng qua bằng dispatch `KeyboardEvent{key:'Enter'}` vào đúng ô đang focus — đi qua đúng listener capture của Tool3DBar (defaultPrevented=true, bar đóng, khối sinh) — nhưng đó là sự kiện tổng hợp, không phải phím vật lý. Bàn phím thật gần chắc chắn OK (listener chỉ đọc `e.key`), chưa phải bằng chứng tuyệt đối.
- **Nhánh nhập .idfc qua file-picker OS chưa thử** (browser tool không mở được hộp thoại tệp); đã thử qua drop-event với File thật — cùng hàm `add(FileList)`.
- **`missing-specId-item` ở BOQ**: chưa mở chặng Trình chiếu/BOQ để kiểm — cần deck + bảng BOQ của dự án có món mã, ngoài đường đi phiên này. Console suốt phiên 0 log nào chứa chuỗi đó, nhưng đó không phải phép kiểm BOQ thật.
- **specId trên block Sofa**: nhánh blockdef chạy, nhưng không đọc được store từ console để xác nhận entity mang `specId` — cần kiểm ở tầng BOQ (mục trên).
- Danh sách tệp `.idfc` bị nhân đôi trong bảng Nạp hàng loạt (2 dòng cùng 1 file — do cả input-change lẫn drop cùng bắn trong lúc thử); store upsert theo `code` nên kết quả đúng 1 món. Chưa kiểm người dùng thật thả 1 file có bị 2 dòng không (nghi là không — đây là artifact cách bơm file của phiên thử).
- Chỉ đo Chromium (pane browser); Safari/Firefox là suy.

## ⑦c HẠN DÙNG
Kết luận đúng cho HEAD `c7f3ac8` + server dev 3001 ngày 19/08, theme tối, 1280×720 và 1440×900. Sửa `Tool3DBar`/`ToolbarBar`/`LibraryDropBridge`/`library-item-resolve`/`idfc-store` hoặc đổi khuôn LibrarySheet là phải verify lại. Số đo R4-L1 phụ thuộc bề rộng Command3DPanel — panel thu lại thì con số parentW đổi (bệnh vẫn còn ở tool 5-6 ô).
