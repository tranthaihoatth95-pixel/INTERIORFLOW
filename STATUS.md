# STATUS — InteriorFlow (10/08)

> Lịch sử ở `CHANGELOG.md`.
> Git + code + DB là nguồn kiểm chứng.
> IF là sản phẩm global: **2D Kỹ thuật · 3D Thiết kế · Trình bày**; Brand Kit theo dự án.

## Đang chạy

- Hệ phím tắt toàn app đang triển khai; giữ nguyên 4 file riêng của chủ dự án.
- Workspace Chiếu sáng thuộc 3D: viewport nhận `Doc.lighting` và preview trực tiếp; tab Đèn có lux/quang thông/diện tích/đồng đều dạng **ước tính**. IES/LDT + engine trắc quang chuẩn chưa làm.
- Material Intelligence: lõi impact/replace đã xong; việc kế là nối hộp xem phạm vi rồi mới áp.
- Camera/Video: 5 ý đồ đã vào panel 2D và lưu cùng polyline; việc kế là host chặng 2 + scene collision.

## Vừa xong

- Cửa vào Trình bày đã thay theo mock mới: thư viện mẫu, 4 ô ngang hàng không khung kính lồng; ô cuối luôn là ＋ tạo hồ sơ trống. Deck/BOQ đi vào thao tác thật; Bảng vật liệu mở workspace A3 chung và lưu `.idfp`; Văn bản/Video khóa kèm lý do năng lực cụ thể, không CTA giả. Ma trận gate nội bộ: `docs/OUTPUT-CAPABILITY-MATRIX-INTERNAL-2026-08-11.md`.
- Chặng 3D đã có kệ công cụ theo cụm, lighting workspace `Doc.lighting`, camera intent và luồng mock footage; engine quang học/IES cùng editor phim chưa có.
- Master Library là gallery + kệ theo chặng, có Smart Tool/Vitals; Figma Remote MCP đã nối với file UI chung.
- 2D có Sketch/Pro, thao tác bút tablet, MODEL/PAPER và xuất PDF đúng khổ; Material Impact thay theo phạm vi và BOQ đọc `specId`.
- Present Deck có Magic/Chỉnh tay, Brand Kit theo dự án và export; 3D nhập GLB/glTF/OBJ-MTL ở mức `lossy`.

## Năng lực định dạng đã đo

- 2D: mở/nhập `.idf`, `.dwg`, `.dxf`; backup `.ifpack`; xuất `.dxf`, PDF. IFC mới có metadata,
  chưa import/export BIM đầy đủ.
- 3D/Node: nhập ảnh; GLB, glTF bundle, OBJ/MTL bundle ở mức `lossy`. Có hình học, transform,
  màu nền; texture/animation chưa trình diễn. Chưa nhập `.skp`, `.max`, `.fbx`, `.ifc`, `.rvt`.
- Trình bày: nhập `.pptx` cơ bản, ảnh, `.idfp`; nhập `.xlsx/.csv` vào BOQ; xuất PDF, PPTX, PNG,
  `.idfp`, XLSX cho BOQ/FF&E. PDF deck/DOCX chưa nhập; Văn bản/Video/HTML chưa có editor.
- Danh sách đuôi trong prompt/URL không được tính là hỗ trợ. PDF Present là `unsupported`, không
  định tuyến giả.

## Việc kế tiếp

1. Nối Material Impact vào nơi gán vật liệu: xem phạm vi → chọn món/phòng/loại/toàn dự án → commit
   một snapshot; sau đó Element Capture/ảnh→MaterialSpec nháp. Tái dùng single-view metrology.
2. Hợp nhất Vitals; BOQ Form/Magic; Present Magic để nội dung quyết định số slide, không giới hạn 7.
3. Mood/Collab→Thẻ gu + Design DNA; Shape Magic; Render và Camera Intent nối scene thật.
4. FBX→IFC; PDF deck→DOCX→media→HTML; tăng fidelity PPTX. Chi tiết xem
   `docs/KE-HOACH-MVP-TONG-2026-08-10.md`.

## Rủi ro

- GPL của `libredwg-web` chưa chốt cho sản phẩm thương mại; xem `docs/RESEARCH-DWG-LICENSE.md`.
- Thương hiệu/PII và asset khách trong lịch sử Git phải xử lý trước khi giao repo ra ngoài.
- Cần cài DMG trên máy sạch để nghiệm thu Prisma đóng gói.
- `findHatchBoundary` có thể treo trên bản vẽ cực dày; xem `docs/TECH-DEBT.md`.

## Quy tắc phiên

Không push khi chưa có lệnh; không chạm DB bằng migrate/db push; việc code dùng worktree
`interiorflow-wt-*`; giữ STATUS dưới 800 từ và chuyển lịch sử sang CHANGELOG.
