# STATUS — InteriorFlow (10/08, dưới 800 từ)

> Lịch sử chi tiết ở `CHANGELOG.md`; báo cáo mẻ ở `docs/M-*-OUT.md`.
> Git + code + DB thật là nguồn kiểm chứng, không lấy brief/GAP cũ làm bằng chứng hoàn thành.
> IF là sản phẩm global, độc lập: **2D Kỹ thuật · 3D Thiết kế · Trình bày**; Brand Kit thuộc từng dự án.

## Đang chạy

- Worktree `interiorflow-wt-obj-mode-separation` chờ commit/merge: importer OBJ/MTL và tách trải
  nghiệm Sơ phác/Chuyên. `main` có 4 file untracked của chủ dự án; không chạm.
- Gateway đã ở `main` (`c408684`): một cửa/chặng, phân biệt chỉnh được · mất mát · tham chiếu ·
  chỉ lưu · chưa hỗ trợ. Lối AI Brief chuyên biệt vẫn giữ nguyên.

## Vừa xong

- Trình bày có màn chọn 6 loại hồ sơ: Deck có Tự dàn/Magic; BOQ mở editor hiện có; Material A3,
  Văn bản, Video, HTML hiện rõ là chưa làm. Đã vá vòng render vô hạn sau nhập PPTX.
- GLB và gói glTF (`.gltf` + `.bin` + texture): kiểm file, lưu nguồn trong Doc/autosave/IDF,
  derive tam giác cho viewer chung, giữ transform/màu nền, báo mesh/tam giác và mất mát.
- OBJ/MTL: chọn gói `.obj` + `.mtl` + texture, kiểm cấu trúc/trùng file, lưu nguồn để mở lại,
  derive mesh vào viewer; báo giả định mét/Y-up và texture chưa hiển thị. Gateway đánh dấu `lossy`.
- Chặng 1: Sơ phác chỉ giữ dựng nhanh, Move/Measure/Markup và thanh chạm. Chuyên giữ bộ lệnh đầy
  đủ, thêm ngữ cảnh MODEL/đơn vị/tờ/tỉ lệ/BIM và mở lớp BIM 2D.
- Nhánh hiện tại: parser OBJ 5/5, Gateway 30/30, typecheck và toàn bộ `npm test` PASS. Đã
  click-through hai mode trên preview, không lỗi console.

## Sự thật dữ liệu

- `prisma/dev.db` có `WorkflowState`, `Task`, `ExternalRef`; `_prisma_migrations` đủ 3 bản ghi đến
  `20260808000002_them_workflowstate_task_externalref`. Migration bù drift/Task đã tồn tại; xem
  `docs/M-NEN-DL-OUT.md`. Không chạy migrate, db push hay VACUUM trong phiên này.

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

1. Làm sâu hai mode: Sơ phác cần radial/gesture, palm rejection và bút; Chuyên cần Model/Paper,
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
