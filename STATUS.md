# STATUS — InteriorFlow (11/08)

> Chi tiết lịch sử ở `CHANGELOG.md`. Code, schema và test là nguồn kiểm chứng. IF là sản phẩm global: **2D Kỹ thuật · 3D Thiết kế · Trình bày**; Brand Kit thuộc từng dự án.

## Mục tiêu hiện tại

Đóng gói **bản desktop dùng nội bộ ổn định**, không còn gọi là thử nghiệm. Trung tính tuyệt đối: không brand/asset/dữ liệu khách trong UI, mẫu, output hoặc release; UI song ngữ VI/EN.

## Đang chạy

- **R1 phát hành nội bộ:** local-only, dữ liệu/migration/backup, cài máy sạch, secrets, kiểm tra trung tính và quyết định GPL/DWG. Worktree `internal-release`.
- **Lõi 2D↔3D:** entity có identity/type-instance/provenance và category/level thống nhất cho Wall, Floor, Ceiling, Room. Worktree `core-doc-3d`.
- **M1 3D:** tường hai điểm → push/pull → transform/snap/hotkey → floor/ceiling + lọc category; Edit Mesh là giai đoạn sau. Spec: `docs/SPEC-3D-MVP-MODELING-2026-08-11.md`.
- **Present/output:** chỉ mở khả năng thật; Deck/BOQ/Material A3 hoạt động, Văn bản/Video/HTML không giả. Worktree `present-output`.

## Vừa xong

- Wallpaper mặc định thành aura tím–lam procedural, không cần asset ngoài; Visual Vitals là ba quỹ đạo oval ánh sáng, tắt khi giảm chuyển động.
- Master Library có Khám phá/Nổi bật, spotlight theo ngữ cảnh, kệ định hướng và icon theo nhóm; tạo mới là dấu ＋. “Top tuần này” hiện là dữ liệu minh hoạ, chưa được quảng bá là analytics.
- Photo Editor Crop là thao tác thật, cập nhật raster/mask/document và undo/redo. Perspective/vertical correction chưa có UI.
- 3D shell dọn nhẹ: bỏ checklist che canvas, dock kính lỏng/thu gọn, ViewCube kỹ thuật 76px, Magic đổi cửa vào Vitals. Engine M1 chưa đủ lệnh thật.
- Trình bày vào bằng thư viện 4 ô ngang + ô ＋; không qua form. Camera intent, Material Impact lõi và lighting estimate cùng nguồn Doc đã có.

## Năng lực hiện có — nói đúng mức

- **2D:** mở `.idf/.dwg/.dxf`, backup `.ifpack`, xuất DXF/PDF. IFC chỉ metadata.
- **3D:** ảnh, GLB/glTF/OBJ-MTL `lossy`; chưa có SKP/MAX/FBX/IFC/RVT và chưa đủ dựng hình chuyên nghiệp.
- **Present:** nhập PPTX cơ bản, ảnh, IDFP; BOQ nhận XLSX/CSV; xuất PDF/PPTX/PNG/IDFP/XLSX. Chưa có editor Văn bản/Video/HTML; PDF deck/DOCX chưa nhập.
- **Lighting:** lux/quang thông/độ đồng đều là ước tính, chưa IES/LDT/trắc quang chuẩn.

## P0 trước khi phát hành nội bộ

1. Không bind server `0.0.0.0` mặc định; không public-register vô ý.
2. Migration/backup/rollback rõ ràng; không âm thầm bỏ qua lỗi DB.
3. Smoke máy sạch: cài → đăng nhập → tạo/lưu/mở → import/export → update DB có dữ liệu → gỡ/cài lại.
4. Quyết định GPL/DWG cho đúng phạm vi pháp nhân; không giao source/binary ngoài phạm vi khi chưa chốt.
5. `npm test`, `tsc`, build/package và scan trung tính phải pass trên đúng artifact.
6. Ghi rõ chính sách secret/API key, capability lock và provenance asset.

## Sau R1 / không hứa trong bản nội bộ đầu

Mesh editor, IFC/BIM thật, IES/LDT, realtime collab, marketplace, mobile/cloud, ký/notarize public, SKP/MAX/FBX/RVT native, video editor hoàn chỉnh.

## Rủi ro

- `libredwg-web` GPL và lịch sử Git có material cũ: xem `docs/LICENSE-NOTES.md`, `docs/RESEARCH-DWG-LICENSE.md`, `docs/AUDIT-BRAND-PII.md`.
- `findHatchBoundary` có thể chậm ở bản vẽ rất dày; xem `docs/TECH-DEBT.md`.

## Quy tắc phiên

Không push khi chưa có lệnh; không chạy DB migrate/db push thủ công; code theo worktree `interiorflow-wt-*`; giữ STATUS dưới 800 từ.
