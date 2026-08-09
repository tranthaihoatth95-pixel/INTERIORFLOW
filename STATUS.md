# STATUS — InteriorFlow (10/08, dưới 800 từ)

> Lịch sử ở `CHANGELOG.md`; báo cáo mẻ ở `docs/M-*-OUT.md`.
> Git + code + DB là nguồn kiểm chứng, không lấy brief/GAP cũ làm bằng chứng.
> IF là sản phẩm global: **2D Kỹ thuật · 3D Thiết kế · Trình bày**; Brand Kit theo dự án.

## Đang chạy

- Paper PDF theo viewport đã merge vào `main`; worktree phụ đã dọn an toàn. 4 file untracked của
  chủ dự án được giữ nguyên.

## Vừa xong

- Trình bày chọn 6 hồ sơ; Deck/BOQ vào editor, bốn loại chưa làm ghi rõ. Đã vá vòng render vô hạn
  sau nhập PPTX. 3D nhập GLB, gói glTF và OBJ/MTL ở mức mất mát, giữ nguồn trong Doc/autosave/IDF.
- Chặng 1: Sơ phác chỉ giữ dựng nhanh, Move/Measure/Markup và thanh chạm. Chuyên giữ bộ lệnh đầy
  đủ, thêm ngữ cảnh MODEL/đơn vị/tờ/tỉ lệ/BIM và mở lớp BIM 2D.
- Sơ phác tablet: nhận bút, chống tì, pan/pinch; dock có undo/redo. Tap 2/3 ngón undo/redo;
  giữ 450ms mở radial 8 lệnh. Input 10/10, gesture 15/15 và test PASS; cần test tablet thật.
- Màn hẹp: canvas đo đúng khung chứa; dock Sơ phác cuộn từ trái. Nghiệm thu 592px không tràn,
  lưới phủ kín, console/test sạch; worktree đã dọn.
- Nắn nét Sơ phác đổi bút/ngón thành line, polyline, chữ nhật hoặc tròn chuẩn; snap 5°.
  Nhận dạng 10/10, typecheck/toàn bộ test và preview PASS; cần nghiệm thu trên tablet thật.
- Paper Space Pro: MODEL/PAPER thật; nhiều ô nhìn cùng một Doc, độc lập tỉ lệ/khóa, kéo/resize có
  chặn mép, không xóa ô cuối. Logic 9/9, test/preview PASS; đã sửa nút bị dock che.
- Lưu bền Paper: một Doc duy nhất + `paperSheets` metadata nhẹ đi qua IndexedDB, `.idf`, `.ifpack`
  và backup; file cũ thiếu field vẫn mở về tờ mặc định. UI sửa số tờ, dự án, người vẽ, revision.
  IDF 45/45, IFpack 19/19, typecheck/toàn bộ test PASS sau merge. Nghiệm thu 3015: 2 viewport +
  metadata sống qua reload, console sạch; dữ liệu test đã dọn và autosave lại. Worktree đã dọn.
- Paper Properties: từng ô nhìn có tâm X/Y và bật/tắt layer độc lập, nút về trạng thái Doc chung;
  chỉ tạo Doc nhẹ lúc render, không nhân/mutate hình học. Logic 14/14, typecheck và toàn bộ test
  PASS trên `main`.
- Xuất Paper: PDF một tờ/cả bộ đọc đúng khổ, hướng, rect, tâm, tỉ lệ và layer riêng từng ô nhìn;
  đổi Page Setup ghi vào Sheet và kẹp viewport trong giấy. Đo 5000mm ở 1:50 = 100mm; Paper 5/5,
  sheet-set 19/19, typecheck/toàn bộ test PASS.

## Sự thật dữ liệu

- DB có `WorkflowState`, `Task`, `ExternalRef`; migration đủ 3 bản ghi đến
  `20260808000002_them_workflowstate_task_externalref`. Xem `docs/M-NEN-DL-OUT.md`; không chạy
  migrate, db push hay VACUUM.

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

1. Làm sâu hai mode: nghiệm thu bút/radial trên tablet; Kỹ thuật cần preview PDF và quản lý lớp
   nâng cao. BIM mới là phân loại 2D; chưa có quan hệ mô hình, IFC
   hoặc clash, nên chưa ngang Revit.
2. Định dạng FBX → IFC. SKP dùng SDK/bridge sau kiểm license; `.max/.rvt` dùng bridge/plugin,
   không tự viết parser native.
3. Trình bày: PDF deck → DOCX → media → HTML; tăng fidelity PPTX.
4. Bổ sung báo cáo đơn vị/trục/font/material/asset thiếu; tiếp tục golden flow và release gate.

## Rủi ro

- GPL của `libredwg-web` chưa chốt cho sản phẩm thương mại; xem `docs/RESEARCH-DWG-LICENSE.md`.
- Thương hiệu/PII và asset khách trong lịch sử Git phải xử lý trước khi giao repo ra ngoài.
- Cần cài DMG trên máy sạch để nghiệm thu Prisma đóng gói.
- `findHatchBoundary` có thể treo trên bản vẽ cực dày; xem `docs/TECH-DEBT.md`.

## Quy tắc phiên

Không push khi chưa có lệnh; không chạm DB bằng migrate/db push; việc code dùng worktree
`interiorflow-wt-*`; giữ STATUS dưới 800 từ và chuyển lịch sử sang CHANGELOG.
