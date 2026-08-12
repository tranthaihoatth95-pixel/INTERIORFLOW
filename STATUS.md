# STATUS — InteriorFlow (12/08 khuya)

> Lịch sử ở `CHANGELOG.md`. Code, schema và test là nguồn kiểm chứng. IF là sản phẩm global: **2D Kỹ thuật · 3D Thiết kế · Trình bày**; Brand Kit thuộc từng dự án.

## Mục tiêu hiện tại

Đóng gói **bản desktop dùng nội bộ ổn định**, không gọi là thử nghiệm. Trung tính tuyệt đối: không brand/asset/dữ liệu khách trong UI, mẫu, output hay release; UI song ngữ VI/EN.

## Đang chạy

- **R1 nội bộ:** desktop local-first; nghiệm thu máy sạch cài/mở/lưu/nâng cấp/khôi phục; quyết định GPL/DWG theo phạm vi pháp nhân.
- **Lõi 2D↔3D:** entity có identity/type-instance/provenance và category/level thống nhất cho Wall, Floor, Ceiling, Room.
- **M1 3D:** tường hai điểm → push/pull → transform/snap/hotkey → floor/ceiling + lọc category; Library contract chung cho 2D–3D–BOQ–Present. Specs: `docs/SPEC-3D-MVP-MODELING-2026-08-11.md`, `docs/SPEC-MASTER-LIBRARY-3D-CONTRACT-2026-08-11.md`.
- **Mock 3D Library:** type/instance → editor → FlowRender → ảnh/BOQ/board; Reference Canvas có provenance. Specs: `docs/SPEC-FLOWRENDER-ELEMENT-TOOLS-2026-08-11.md`, `docs/SPEC-REFERENCE-CANVAS-3D-2026-08-11.md`.
- **Vitals V1:** toàn app: 2D kiểm/vẽ; 3D recipe/preview; Present kiểm/xuất; Library tra/import; mọi ghi có undo. Spec: `docs/SPEC-VITALS-UNIFIED-2026-08-11.md`.
- **Present/output:** chỉ mở khả năng thật; Deck/BOQ/Material A3 hoạt động, Văn bản/Video/HTML không giả.

## Vừa xong

- **12/08 khuya — ĐỢT 4 (T điều phối, 4 agent song song ~15-19ph, audit + verify browser từng cụm):** ⭐**Công Thức Khối** `build-recipe` — BuildRecipe stack non-destructive trên 9 hàm build-ops sẵn có, `Base.recipe` additive không vỡ `.idf` cũ, UI ngăn xếp tab Sửa (d0b0c13) · ⭐**Thẻ DNA Thiết kế** — DistillEngine generic (dùng chung cho auto-define/company-dna-pack sau) + 8 lớp đúng NC + cờ 3 nấc + lưu JSON per-project KHÔNG bảng DB mới + panel Tổng quan dự án, tạo thẻ verify trọn đường nút→API→đĩa (b0327cc) · ⭐**Gallery liên ngành** `/library/gallery` — quy ước tag nganh/license/nguon/bosuutap trên LibraryAsset 0 cột mới, bộ sưu tập bắt buộc có nguồn, chặn Pinterest (5662b9f) · ⭐**Engine bảng** TableDocEngine + docType "Bảng thống kê" đọc Doc 2D thật (cửa/phòng giữ entityId, re-sync không đè ô tay), thẻ thật trong picker, BOQ 0 hồi quy (b5feacb). tsc toàn cây 0 · soi:frontier 34 xong/25 chờ/0 lệch · soi:hinh-hoc giữ 442 (vá 2 nợ mới của agent ngay trong phiên). **LÔ DUYỆT MẮT #1 đã soạn** `docs/duyet-mat/LO-1-2026-08-12.md` (30 mục/8 trạm) — chờ Hoà tick; 2 nghi vấn cần tay Hoà: đường ＋ Dự án mới → Bảng khởi tạo, click card Home. Dọn 3 dev server cùng thư mục về 1 (3002).
- 12/08 chiều — ĐỢT 3 mô hình T trọn 8 bước (5 agent, V bắt 1 lệch đã vá): tool-state 3D · thang bo v1 · TaskContext 2 chiều 3 chặng · Home = Tổng quan · backup offsite. Chi tiết đợt 2-3 đã chuyển CHANGELOG.

- Nền 11/08 (R1 hardening · Present ma trận năng lực · 3D scene provenance · Master Library · Photo Editor Crop…) đã chuyển CHANGELOG mục 11/08.

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
