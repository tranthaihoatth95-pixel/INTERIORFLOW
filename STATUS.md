# STATUS — InteriorFlow (13/08)

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

- **13/08 — ĐỢT 5 (Hoà chốt kép: GIAO DIỆN THỐNG NHẤT + HOME; 4 agent, T audit từng cụm):** ⭐**HOME "Dòng Studio"** — 2 trang cuộn: ①ánh sáng theo giờ thật + lời chào dữ liệu thật + Vitals pill + card dự án ②6 widget live (hôm-nay · biểu đồ chặng · lưới tích luỹ KHÔNG streak · ghi chú Tot · tin tự sinh · mốc DayTicker), 0 bảng DB mới, widget trống tự ẩn (cf3b5ec; NC nền: `docs/nc/NC-HOME-CAM-NHAN` + `NC-HOME-DELIGHT`) · **Dọn giao diện v2** — radius 442→**335**, từ điển mocks 77→**0**, đủ 5 token mật độ (d00de01) · **Phát hiện quý H2**: tay cầm panel ĐÃ CÓ từ 07/08 (`PanelFlank`, 3 chỗ) — sổ ghi sai marker nên soi lọt, đã sửa sổ, 0 dòng code thừa; Navigator 2D khác biệt CÓ CHỦ ĐÍCH · 🔴→✅ **Trụ hiệu năng có số đầu tiên** — bench tất định: điểm gãy `pickHatchFace` O(N²) (hatch.ts:502), recipe 10 bước nhân 660× tam giác/cấu kiện (e16546f; việc SỬA = entry đợt kế). Sổ: 40 xong-MÁY · 25 chờ · 0 lệch. **LÔ DUYỆT MẮT #1 + #2 chờ Hoà** (`docs/duyet-mat/` — app giờ ở cổng 3000, cần login tay). Va chạm ghi nhận: `ProjectSelect.tsx` nằm 2 vùng phiếu (H3 radius + H1 mount) → commit d00de01 cuốn theo phần H1 — lỗi chia vùng của T, vô hại, rút kinh nghiệm khai vùng loại trừ file cụ thể.
- 12/08 khuya — ĐỢT 4: build-recipe · dna-card · gallery-lien-nganh · editor-bang-bieu-mau (4 commit, chi tiết chuyển CHANGELOG). 12/08 chiều — ĐỢT 3: tool-state 3D · thang bo v1 · TaskContext 2 chiều · Home=Tổng quan · backup offsite.

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
