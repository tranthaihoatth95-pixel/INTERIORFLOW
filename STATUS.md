# STATUS — InteriorFlow (10/08)

> Lịch sử ở `CHANGELOG.md`.
> Git + code + DB là nguồn kiểm chứng.
> IF là sản phẩm global: **2D Kỹ thuật · 3D Thiết kế · Trình bày**; Brand Kit theo dự án.

## Đang chạy

- Hệ phím tắt toàn app đang triển khai; giữ nguyên 4 file riêng của chủ dự án.
- Material Intelligence: lõi impact/replace đã xong; việc kế là nối hộp xem phạm vi rồi mới áp.
- Camera/Video: lõi 5 ý đồ nghề đã có; việc kế là nối panel đường cam và kiểm scene collision.

## Vừa xong

- Trình bày chọn 6 hồ sơ; Deck/BOQ vào editor, bốn loại chưa làm ghi rõ. 3D nhập GLB, gói glTF và
  OBJ/MTL ở mức mất mát, giữ nguồn trong Doc/autosave/IDF.
- Chặng 1: Sơ phác chỉ giữ dựng nhanh, Move/Measure/Markup và thanh chạm. Chuyên giữ bộ lệnh đầy
  đủ, thêm ngữ cảnh MODEL/đơn vị/tờ/tỉ lệ/BIM và mở lớp BIM 2D.
- Sơ phác tablet: nhận bút, chống tì, pan/pinch; dock có undo/redo. Tap 2/3 ngón undo/redo;
  giữ 450ms mở radial 8 lệnh. Input 10/10, gesture 15/15 và test PASS; cần test tablet thật.
- Paper Space Pro: MODEL/PAPER thật; nhiều ô nhìn chung một Doc, metadata lưu bền, Inspector
  Tờ/Ô nhìn/Lớp và PDF một tờ/cả bộ đúng khổ, hướng, tỉ lệ, layer. Test/preview PASS.
- Mọi lệnh chạy được phải có phím thật, chung nguồn với tooltip/`⌘/`/`⌘K`, guard ô nhập.
  `⌘P`/`Ctrl+P` mở preview/xuất PDF Paper; shortcuts 23/23 PASS.
- Dock Sơ phác gọn, vùng chạm 44px; Hatch overlay 2 cột né dock. Banner mất phiên portal ra body,
  có safe-area. Bàn trống bỏ thẻ giới thiệu/“Vẽ mới”, chỉ còn nút Nhập; click ngoài tự đóng.
  Panel BIM cũ đè toolbar đã bỏ; số liệu BIM vẫn ở thanh Chuyên, gán cấu kiện ở Inspector.
  Icon nơi lưu đổi sang thư mục nét rõ. Preview, typecheck và toàn bộ test PASS.
- Trình bày: Deck vào bằng Magic hoặc Chỉnh tay. Magic dùng Brand Kit; nội dung, ảnh và phong
  cách tham khảo đều không bắt buộc. Thiếu text sinh 7 trang nháp có nhãn; thiếu ảnh có ô giữ chỗ
  sửa được. Bốn tổ hợp input 4/4, content-deck 11/11, typecheck/toàn bộ test và preview PASS.
- Material Impact MVP: quét đúng vùng hatch, furniture, vật liệu mặc định và từng lớp tường;
  thay một entity hoặc toàn Doc bất biến, không tạo undo thừa khi no-op. BOQ tự đọc specId mới.
  Test mới 12/12, typecheck và toàn bộ test PASS. Kế hoạch tổng 10/08 đã ghi riêng.
- Camera Intent MVP: thấp sát sàn, bám theo, reveal, push-in, orbit sinh polyline chỉnh được;
  có chiều cao/lens/tốc độ/easing/look-at. Test lõi PASS; chưa nối UI/scene.

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
