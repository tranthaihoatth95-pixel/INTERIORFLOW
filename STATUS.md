# STATUS — InteriorFlow (10/08, dưới 800 từ)

> Lịch sử ở `CHANGELOG.md`; báo cáo mẻ ở `docs/M-*-OUT.md`.
> Git + code + DB là nguồn kiểm chứng, không lấy brief/GAP cũ làm bằng chứng.
> IF là sản phẩm global: **2D Kỹ thuật · 3D Thiết kế · Trình bày**; Brand Kit theo dự án.

## Đang chạy

- Không còn worktree phụ. Paper Space Pro đã merge vào `main` (`176a3a2`); `main` có 4 file
  untracked của chủ dự án, không chạm.
- Gateway là một cửa/chặng, phân biệt chỉnh được · mất mát · tham chiếu · chỉ lưu · chưa hỗ trợ.

## Vừa xong

- Trình bày chọn 6 hồ sơ; Deck/BOQ vào editor, bốn loại chưa làm ghi rõ. Đã vá vòng render vô hạn
  sau nhập PPTX. 3D nhập GLB, gói glTF và OBJ/MTL ở mức mất mát, giữ nguồn trong Doc/autosave/IDF.
- Chặng 1: Sơ phác chỉ giữ dựng nhanh, Move/Measure/Markup và thanh chạm. Chuyên giữ bộ lệnh đầy
  đủ, thêm ngữ cảnh MODEL/đơn vị/tờ/tỉ lệ/BIM và mở lớp BIM 2D.
- Sơ phác tablet: nhận bút, chống tì tay, ngón pan/pinch hoặc bật “Ngón vẽ”; dock có undo/redo.
  Tap 2/3 ngón undo/redo; giữ 450ms mở radial 8 lệnh theo ngữ cảnh, có kẹp mép. Input 10/10,
  gesture 15/15, typecheck/toàn bộ test và preview PASS; radial cần test tay trên tablet.
- Màn hẹp: canvas dùng ResizeObserver trên chính khung chứa, đo sau layout và CSS phủ 100%; dock
  Sơ phác cuộn ngang từ trái. Nghiệm thu viewport 592px: canvas 542/542px, DPR backing đúng,
  body không tràn, lưới phủ kín; console sạch, typecheck/toàn bộ test PASS sau merge; worktree
  và nhánh đã dọn an toàn.
- Nắn nét Sơ phác: công cụ “Nét tay” chỉ hiện ở Sketch, nhận bút/ngón rồi chuyển nét thành line,
  polyline, chữ nhật hoặc tròn chuẩn của Doc; snap ngang/dọc 5°. Không tạo loại entity riêng nên
  vẫn chọn/sửa/xuất theo flow cũ. Bỏ pen hover/áp lực gần 0; ellipse và nét nguệch ngoạc không bị
  nhận nhầm. Bộ nhận dạng 10/10, typecheck và toàn bộ test PASS. Bản worktree biên dịch/trả CAD;
  sau merge typecheck/toàn bộ test và preview cổng 3015 PASS, console sạch; worktree/nhánh đã
  dọn an toàn. Tương tác bút/ngón thật còn cần nghiệm thu trên tablet.
- Paper Space Pro mẻ 1: MODEL/PAPER là chuyển không gian thật. PAPER dựng tờ theo khổ/hướng,
  khung tên và ô nhìn từ cùng `Sheet/Viewport2D`; preview đọc trực tiếp một Doc chung. Đổi tỉ lệ
  1:20…1:200, khóa ô nhìn, và mở đúng vùng đó trong Model. Logic 4/4, typecheck/toàn bộ test PASS;
  sau merge typecheck/toàn bộ test PASS. Nghiệm thu cổng 3015: chuyển Pro→PAPER, đổi 1:50,
  khóa/mở khóa và quay về Model đúng vùng; console sạch. Worktree/nhánh đã dọn. Mẻ sau: nhiều
  viewport, đặt/resize ô nhìn, metadata tờ.

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

1. Làm sâu hai mode: nghiệm thu bút/radial trên tablet; Chuyên cần Model/Paper,
   viewport/tờ in, property/layer workflow. BIM mới là phân loại 2D; chưa có quan hệ mô hình, IFC
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
