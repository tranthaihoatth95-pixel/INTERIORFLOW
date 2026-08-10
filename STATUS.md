# STATUS — InteriorFlow (11/08)

> Lịch sử ở `CHANGELOG.md`. Git + code + DB là nguồn kiểm chứng. IF là sản phẩm global: **2D Kỹ thuật · 3D Thiết kế · Trình bày**; Brand Kit theo từng dự án.

## Đang chạy

- Đóng gói **R1 nội bộ**: desktop local-first, không LAN ngầm; cần máy sạch Windows x64 (và macOS arm64 nếu phát hành) nghiệm thu cài/mở/lưu/nâng cấp/khôi phục.
- 3D M1: tường hai điểm, profile/đùn, transform/snap/phím tắt, sàn-trần, cây `Level → category`, undo/persist vào cùng `Doc` 2D/3D. Tham chiếu `docs/SPEC-3D-MVP-MODELING-2026-08-11.md`.
- Material Intelligence: nối impact preview trước khi áp; Element Capture ảnh→MaterialSpec nháp sau đó.
- Chiếu sáng trong 3D đã có `Doc.lighting`, layout↔phối cảnh và chỉ số **ước tính**; IES/LDT/engine trắc quang chuẩn chưa làm.
- Camera/video: Camera Intent lưu cùng polyline; cần host scene thật, collision và luồng footage→dựng phim.

## Vừa xong

- R1 hardening: Electron chỉ bind `127.0.0.1`; lỗi `prisma db push` dừng app và ghi log thay vì mở tiếp; auto-update là opt-in; config key chỉ ở userData. Có `npm run release:preflight` + `docs/RELEASE-CHECKLIST-INTERNAL.md`.
- Cửa vào Trình bày theo mock: 4 mẫu ngang hàng không kính lồng, ô cuối **＋** tạo hồ sơ trống. Deck/BOQ vào editor; Material/Văn bản/Video minh hoạ và khoá “Sắp có” khi chưa có editor thật.
- Master Library: trang gallery/collection và kệ theo ngữ cảnh; thao tác chung Slide/BOQ/Văn bản/Video/Ảnh, tác vụ riêng qua Smart Tool + Vitals. Không tuyên bố trending/marketplace nếu chưa có dữ liệu thật.
- 3D UI: tool được gom theo nhóm nghiệp vụ, Vitals thay Magic giả; ViewCube nhỏ hơn. Engine M1 vẫn chưa hoàn thành.
- Photo editor: crop raster/mask làm thật, undoable; Perspective/vertical correction chưa có UI.
- Paper Space, Deck Magic, Material Impact, Camera Intent và tablet sketch đã có kiểm thử cục bộ; cần smoke test trên máy thật theo R1.

## Năng lực định dạng đã đo

- 2D: mở `.idf/.dwg/.dxf`, backup `.ifpack`; xuất DXF/PDF. IFC chỉ metadata.
- 3D: GLB/glTF/OBJ-MTL là **lossy**; chưa có native SKP/MAX/FBX/RVT/IFC.
- Trình bày: PPTX cơ bản, ảnh, IDFP; XLSX/CSV BOQ; xuất PDF/PPTX/PNG/IDFP/XLSX. Chưa có editor DOCX, video, HTML hoặc PDF deck.

## Cổng R1 nội bộ còn lại

1. Đạt test/type/build + package + smoke máy sạch, backup/nâng cấp/khôi phục DB.
2. Quyết giấy phép `libredwg-web` GPL cho phạm vi nội bộ; chưa chốt thì không phân phối DWG trong installer.
3. Hoàn thiện 3D M1 và bảo đảm 2D↔3D cùng một Doc, không chặn khi thiếu bước trước.
4. Library có provenance/metadata thật, Material Impact preview; Vitals chỉ trả hành động có preview/undo.
5. Capability truth: không mở file/route hay xuất kết quả mà app chưa hỗ trợ; cập nhật version/revision output.
6. Rà trung tính cuối: không tên/logo/asset/dữ liệu khách hay studio trong UI, mẫu, output, config, installer. Lịch sử Git cần xử lý trước khi giao repo ra ngoài.

## Rủi ro / để sau R1

- Chưa có mesh editor Blender-level, BIM/IFC đầy đủ, IES, cộng tác realtime, marketplace, cloud sync, ký/notarize/OTA public.
- `findHatchBoundary` có thể chậm với bản vẽ cực dày; xem `docs/TECH-DEBT.md`.
- Không chạy Prisma/SQLite repair trực tiếp qua sandbox; sao lưu nhất quán trước thay đổi dữ liệu.
