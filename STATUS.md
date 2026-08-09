# STATUS — InteriorFlow (09/08, dưới 800 từ)

> Lịch sử chi tiết ở `CHANGELOG.md`; báo cáo từng mẻ ở `docs/M-*-OUT.md`.
> Git + code + DB thật là nguồn kiểm chứng; không lấy brief hoặc GAP cũ làm bằng chứng hoàn thành.
> IF là sản phẩm global, độc lập: **2D Kỹ thuật · 3D Thiết kế · Trình bày**; Brand Kit thuộc từng dự án.

## Đang chạy

- Không còn worktree phụ. `main` có 4 file untracked của chủ dự án: `AGENTS.md` và 3 mock ngày
  09/08; không sửa, không commit.
- Registry định dạng đã làm trên nhánh `codex/format-registry`: phân biệt chỉnh được · mất mát ·
  tham chiếu · chỉ lưu · chưa hỗ trợ; chờ duyệt merge rồi mới nối lần lượt vào UI ba chặng.

## Vừa xong 09/08

- Merge màn chọn 6 loại hồ sơ Trình bày: Deck có **Tự dàn/Magic**; BOQ mở editor hiện có;
  Material A3, Văn bản, Video, HTML hiện rõ là chưa làm và có lý do. Commit gốc `0e8355c`,
  merge `d23643f`.
- Vá vòng render vô hạn `EditorCanvas` sau nhập PPTX bằng cách ổn định vị trí toolbar. Commit gốc
  `8412356`, merge `17f63e2`.
- Sau merge: `npx tsc --noEmit --incremental false` PASS; toàn bộ `npm test` PASS, gồm kiểm license
  và `check:chot` 0 lỗi chặn.
- Đã dọn hai worktree trên theo đủ 4 điều kiện: đã merge, sạch, không server, không commit độc nhất.
- Browser click-through chưa nghiệm thu: môi trường browser chặn URL localhost `:3008`; không lách
  bằng công cụ khác. Kiểm chứng hiện tại là typecheck + test, chưa tuyên bố UI chạy tay.

## Sự thật dữ liệu

- `prisma/dev.db` hiện có đủ `WorkflowState`, `Task`, `ExternalRef`; `_prisma_migrations` có đủ 3
  bản ghi đến `20260808000002_them_workflowstate_task_externalref`.
- Migration bù drift và migration Task đã tồn tại; xem `docs/M-NEN-DL-OUT.md`. Không còn đúng khi
  nói “schema 20 model nhưng DB chỉ 17 bảng”.
- Không chạy `prisma db push`, `migrate` hay `VACUUM` trong phiên này.

## Năng lực định dạng đã đo

- 2D: mở/nhập `.idf`, `.dwg`, `.dxf`; backup `.ifpack`; xuất `.dxf`, PDF. IFC mới có metadata,
  chưa import/export BIM đầy đủ.
- 3D/Node: nhập ảnh; chưa có importer thực cho `.skp`, `.max`, `.fbx`, `.obj`, `.glb/.gltf`,
  `.ifc`, `.rvt`. Danh sách đuôi trong prompt/URL không được tính là hỗ trợ.
- Trình bày: nhập `.pptx` (mức cơ bản), ảnh, `.idfp`; nhập `.xlsx/.csv` vào BOQ; xuất PDF, PPTX,
  PNG, `.idfp`, XLSX cho BOQ/FF&E. PDF deck và DOCX chưa nhập; Văn bản/Video/HTML chưa có editor.
- Gateway nhận diện/định tuyến file đã có nhưng chưa nối UI, nên chưa tính là import dùng được.
- Nhánh registry nhận thêm GLB/glTF/OBJ/FBX/SKP/MAX/IFC/RVT/DOCX/video/audio/HTML nhưng vẫn đánh
  dấu `unavailable`; sửa PDF Present về `unsupported`, không còn định tuyến sai thành import deck.

## Việc kế tiếp

1. Chốt registry năng lực file theo 4 mức: chỉnh được · nhập có mất mát · liên kết tham chiếu · chỉ lưu.
2. Ưu tiên 3D mở: GLB/glTF → OBJ/MTL → FBX; sau đó IFC. SKP dùng SDK/bridge sau kiểm license;
   `.max/.rvt` dùng bridge/plugin, không tự viết parser native.
3. Hoàn thiện Trình bày theo thứ tự: PDF deck → DOCX → media video/audio → HTML; tăng fidelity PPTX.
4. Nối gateway thật vào UI kèm báo cáo đơn vị/trục/font/material/asset bị thiếu và giữ file nguồn để refresh.
5. Tiếp tục golden flow, nghiệm thu 3D/Trình bày và release gate; không push khi chưa có lệnh.

## Rủi ro còn hiệu lực

- GPL của `libredwg-web` chưa chốt cho sản phẩm thương mại global; xem `docs/RESEARCH-DWG-LICENSE.md`.
- Dấu thương hiệu/PII và asset khách trong lịch sử Git cần xử lý trước khi giao repo ra ngoài.
- Cần cài DMG trên máy sạch để nghiệm thu Prisma đóng gói; dev machine không đủ chứng minh.
- `findHatchBoundary` có thể treo trên bản vẽ mật độ cực cao; xem `docs/TECH-DEBT.md`.

## Quy tắc phiên

Không push hoặc merge tiếp khi chưa được phép; không chạm DB bằng migrate/db push; mỗi việc code dùng
worktree `interiorflow-wt-*`; giữ STATUS dưới 800 từ và chuyển lịch sử đã xong sang CHANGELOG.
