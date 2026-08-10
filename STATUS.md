# STATUS — InteriorFlow (11/08)

> Lịch sử ở `CHANGELOG.md`. Code, schema và test là nguồn kiểm chứng. IF là sản phẩm global: **2D Kỹ thuật · 3D Thiết kế · Trình bày**; Brand Kit thuộc từng dự án.

## Mục tiêu hiện tại

Đóng gói **bản desktop dùng nội bộ ổn định**, không gọi là thử nghiệm. Trung tính tuyệt đối: không brand/asset/dữ liệu khách trong UI, mẫu, output hay release; UI song ngữ VI/EN.

## Đang chạy

- **R1 nội bộ:** desktop local-first; nghiệm thu máy sạch cài/mở/lưu/nâng cấp/khôi phục; quyết định GPL/DWG theo phạm vi pháp nhân.
- **Lõi 2D↔3D:** entity có identity/type-instance/provenance và category/level thống nhất cho Wall, Floor, Ceiling, Room.
- **M1 3D:** tường hai điểm → push/pull → transform/snap/hotkey → floor/ceiling + lọc category; Edit Mesh là giai đoạn sau. Spec: `docs/SPEC-3D-MVP-MODELING-2026-08-11.md`.
- **Present/output:** chỉ mở khả năng thật; Deck/BOQ/Material A3 hoạt động, Văn bản/Video/HTML không giả.

## Vừa xong

- R1 hardening: Electron chỉ bind `127.0.0.1`; khi phiên bản đổi, DB + uploads được snapshot trước schema; lỗi kiểm tra schema chặn khởi động và ghi log; auto-update là opt-in; key/config chỉ trong userData. Có `npm run release:preflight` và `docs/RELEASE-CHECKLIST-INTERNAL.md`.
- Build không còn phụ thuộc Google Fonts: font UI dùng file cục bộ + fallback hệ điều hành. Cảnh báo `unpdf` còn theo dõi riêng khi nghiệm thu artifact production.
- Metadata desktop/PWA đổi sang mô tả trung tính, không định vị app như một “AI canvas” hay gắn với studio cụ thể.
- Sửa giật viewport 3D: LightRig memo theo Doc; khung 3D chỉ render khi cảnh/camera đổi (video/walk vẫn realtime), ViewCube chỉ redraw khi xoay và DPR được giới hạn cho màn Retina.
- 3D Scene giữ `entityId`, `levelId`, `typeId`, provenance; `RoomEntity` là nguồn phòng ưu tiên; preview floor/ceiling được đánh dấu dẫn xuất.
- Present: Material A3 vào editor thật và lưu `.idfp`; Deck/BOQ giữ lối vào thật; Văn bản/Video bị khoá bằng lý do năng lực, không còn CTA giả. Ma trận: `docs/OUTPUT-CAPABILITY-MATRIX-INTERNAL-2026-08-11.md`.
- Wallpaper aura tím–lam procedural; Visual Vitals là ba quỹ đạo oval ánh sáng, tắt khi giảm chuyển động.
- Master Library có Khám phá/Nổi bật, spotlight theo ngữ cảnh, kệ định hướng và icon theo nhóm; tạo mới là dấu ＋. “Top tuần này” là dữ liệu minh hoạ, chưa được quảng bá là analytics.
- Photo Editor Crop là thao tác thật, cập nhật raster/mask/document và undo/redo. Perspective/vertical correction chưa có UI.
- 3D shell dọn nhẹ: bỏ checklist che canvas, dock kính lỏng/thu gọn, ViewCube kỹ thuật 76px, Magic đổi cửa vào Vitals. Lệnh Tường hai điểm đã có từ dock/phím W, nhập điểm–dày–cao thật; gizmo X/Y/Z ghi về Doc và giữ cặp tường liên kết; các lệnh M1 còn lại tiếp tục.

## Năng lực hiện có — nói đúng mức

- **2D:** mở `.idf/.dwg/.dxf`, backup `.ifpack`, xuất DXF/PDF. IFC chỉ metadata.
- **3D:** ảnh, GLB/glTF/OBJ-MTL `lossy`; chưa native SKP/MAX/FBX/IFC/RVT và chưa đủ dựng hình chuyên nghiệp.
- **Present:** nhập PPTX cơ bản, ảnh, IDFP; BOQ nhận XLSX/CSV; xuất PDF/PPTX/PNG/IDFP/XLSX. Chưa có editor Văn bản/Video/HTML; PDF deck/DOCX chưa nhập.
- **Lighting:** lux/quang thông/độ đồng đều là ước tính, chưa IES/LDT/trắc quang chuẩn.

## Cổng R1 nội bộ còn lại

1. Pass test/type/build/package và smoke máy sạch; backup, nâng cấp, khôi phục DB có dữ liệu.
2. Quyết giấy phép `libredwg-web` GPL cho phạm vi nội bộ; chưa chốt thì không phân phối DWG trong installer.
3. Hoàn thiện 3D M1 và cùng một Doc 2D↔3D, không chặn khi thiếu bước trước.
4. Library có metadata/provenance thật; Material Impact preview; Vitals chỉ gọi hành động có preview/undo.
5. Không mở route/file/output app chưa hỗ trợ; revision/version output rõ ràng.
6. Quét trung tính cuối: không tên/logo/asset/dữ liệu khách hay studio trong UI, mẫu, output, config, installer. Lịch sử Git chỉ cần dọn trước khi giao repo ra ngoài.

## Sau R1

Mesh editor, IFC/BIM thật, IES/LDT, realtime collab, marketplace, cloud/mobile, ký/notarize public, SKP/MAX/FBX/RVT native và video editor hoàn chỉnh.

## Rủi ro / quy tắc

- `libredwg-web` GPL và lịch sử Git: xem `docs/LICENSE-NOTES.md`, `docs/RESEARCH-DWG-LICENSE.md`, `docs/AUDIT-BRAND-PII.md`.
- `findHatchBoundary` có thể chậm ở bản vẽ dày; xem `docs/TECH-DEBT.md`.
- Không push khi chưa có lệnh; không chạy Prisma/SQLite repair trực tiếp; code theo worktree `interiorflow-wt-*`; STATUS dưới 800 từ.
