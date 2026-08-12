# PHIẾU GIAO VIỆC — H3 · dọn giao diện v2 (radius 442 + từ điển mocks + token mật độ) — Đợt 5, 13/08/2026

Ba việc cơ khí cùng một mục đích: ĐỢT GIAO DIỆN THỐNG NHẤT (Hoà chốt 13/08) — hình học một thang, tên gọi một từ điển, mật độ một bộ token. Ba entry registry: `hinh-hoc-v2` · `tu-dien-mocks-sach` · `mat-do-con-tro`.

## ② ĐỌC TRƯỚC
1. `app/globals.css:60-75` (thang bo `--r-1..4` + `--r-full` + concentric) và `:100-165` (token mật độ hiện có `--tap/--tap-lg/--row/--gap` + block override cảm ứng).
2. `docs/SPEC-MAT-DO-CON-TRO.md` §5 (bộ 5 token chốt: `--tap/--row/--gap/--pad-card/--fs-ui`, override qua `(hover:none) and (pointer:coarse)`).
3. `scripts/soi-hinh-hoc.mjs` + chạy `npm run soi:hinh-hoc` lấy danh sách hiện trạng (442 ngoài thang, top: MaterialPbrEditor 10 · FlowCanvas 9 · ExportPdfDialog 9 · ImageEditor 8 · ToolModeForm 8…).
4. `scripts/soi-tu-dien.mjs` + chạy `npm run soi:tu-dien` (77 chỗ lệch trong docs/mocks — tên chặng cũ phải thành bộ tên chốt: "2D Kỹ thuật · 3D Thiết kế · Trình chiếu"; đọc từ điển trong script để biết đủ cặp từ sai→đúng).
5. Quy tắc migrate radius của đợt trước: `git log --oneline --all | grep -i thang` + đọc commit hinh-hoc-ap-thang để theo cùng cách map (giá trị lẻ → nấc gần nhất; lồng nhau → concentric).

## ③ VÙNG FILE
ĐƯỢC: `app/globals.css` · `docs/mocks/**` · các file radius hàng đợi: `components/materials/MaterialPbrEditor.tsx` · `components/FlowCanvas.tsx` · `components/print/ExportPdfDialog.tsx` · `components/present-editor/ImageEditor.tsx` · `components/render-studio/ToolModeForm.tsx` · `components/render-studio/SectionExtractPanel.tsx` · `components/CommentLayer.tsx` · `components/ProjectSelect.tsx` · `components/dashboard/ProjectMembersPanel.tsx` · `components/studio/LightTab.tsx` · file LoginBackdrop (grep định vị) · `components/materials/MaterialImportWizard.tsx`.
CẤM: `components/ui/**` · `components/library/**` · `components/cad/**` · `components/render-studio/Command3DPanel.tsx` · `components/home/**` · `app/page.tsx` · prisma · scripts (chỉ CHẠY soi, không sửa máy soi).

## ④ VIỆC
1. **`mat-do-con-tro`**: bổ 2 token thiếu `--pad-card` `--fs-ui` vào globals.css cạnh cụm :105 (desktop mặc định + override trong block cảm ứng sẵn có); áp 5 token vào các file trong vùng ③ đang hardcode kích thước tap/row/font UI (chỉ trong vùng — chỗ khác ghi vào báo cáo làm hàng đợi). MARKER: `--fs-ui` trong globals.css.
2. **`hinh-hoc-v2`**: đưa radius các file vùng ③ về thang `--r-*` (lẻ → nấc gần nhất; cặp lồng → trong = ngoài − đệm, min 4). Chạy lại `npm run soi:hinh-hoc` — mục tiêu 442 giảm ≥ 60 (đủ các file trong vùng), DÁN số trước/sau vào báo cáo. KHÔNG sửa file ngoài vùng để "kéo số".
3. **`tu-dien-mocks-sach`**: sửa 77 chỗ lệch trong docs/mocks theo từ điển soi-tu-dien (tên chặng cũ → bộ tên chốt; giữ nguyên layout/CSS mock, chỉ đổi CHỮ). Chạy `npm run soi:tu-dien` về **0 lệch**, dán kết quả.
4. tsc sạch; mock là HTML tĩnh — mở 2-3 file mock đã sửa xác nhận không vỡ (đọc lại chuỗi quanh chỗ thay).

## ⑤ RÀNG BUỘC
Không git · không dev server · không prisma · KHÔNG đổi hành vi/logic — đây là phiếu dọn: chỉ radius/chữ/token · không đổi giá trị thị giác ngoài quy tắc map (10px→--r-2 vẫn 10px).

## ⑥ NGHIỆM THU TỰ LÀM
```
npx tsc --noEmit
npm run soi:hinh-hoc   # dán số trước/sau
npm run soi:tu-dien    # phải 0 lệch
grep -n "--fs-ui\|--pad-card" app/globals.css
```

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-13-H3-don-giao-dien.md` — khuôn 2 giá trị; số soi trước/sau dán nguyên văn; danh sách hardcode NGOÀI vùng phát hiện được (hàng đợi kế); CHƯA LÀM nói thẳng.

## ⑧ DÂY MÁY
3 entry: `hinh-hoc-v2` (LightTab var(--r-) · `tu-dien-mocks-sach` (docs/mocks hết "Trình bày") · `mat-do-con-tro` (globals.css --fs-ui). Không tự sửa registry.
