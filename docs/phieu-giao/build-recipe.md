# PHIẾU GIAO VIỆC — D2 · `build-recipe` (Công Thức Khối) — Đợt 4, 12/08/2026

## ① BỐI CẢNH NGÀNH
KTS/3D artist dựng nội thất luôn phải SỬA LẠI sau khi dựng: chân bàn tiện, phào chỉ, nan chớp, tay vịn — đồ nội thất là thứ hình phức tạp nhất (Hoà chốt 03/08: "dựng nội thất mà không có mấy cái đó là vứt"). Hiện các lệnh dựng (Array/Bevel/Sweep/Revolve/Loft…) áp MỘT LẦN là "nướng chết" vào geometry — sai một tham số phải dựng lại từ đầu. 3ds Max sống 30 năm nhờ modifier stack. BuildRecipe = BuildOp thành STACK NON-DESTRUCTIVE, là hệ CẤP 1 "Công Thức Khối" (00-CHOT 11/08). Đây là XƯƠNG cho `.idfc` "đổi 1 lan 5" về sau.

## ② ĐỌC TRƯỚC (bắt buộc, theo thứ tự)
1. `lib/cad/model.ts:483` — `type BuildOp` union (kho 9+ op đã khai).
2. `lib/three/build-ops.ts` — hàm thuần đã có: `prismBeveledEx` `prismChamfered` `arrayGrid` `arrayRadial` `mirrorGeometry` `sweepProfile` `revolveProfile` `loftSections` `offsetPolygonInwardMm` `filletPolygonMm` `resolveGroupGeometry` (+ `build-ops.test.ts` xem khuôn test).
3. `lib/three/cad-to-obj.ts` — `docToObjScene`, nơi tiêu thụ geometry (luật X1: mọi thứ ghi vào MỘT Doc).
4. `components/render-studio/useTool3D.ts` + `Tool3DBar.tsx` + `Command3DPanel.tsx` — máy trạng thái công cụ + khuôn nhập số đợt 3.
5. `docs/bao-cao-phien/2026-08-12-D-tool-state.md` — agent D đợt 3 để lại gì.
6. `docs/SPEC-3D-MVP-MODELING-2026-08-11.md` §liên quan modeling stack.

## ③ VÙNG FILE (ngoài vùng = vi phạm dù sửa đúng)
ĐƯỢC: `lib/three/**` · `lib/cad/model.ts` (CHỈ thêm field/type quanh vùng BuildOp — additive, optional) · `components/render-studio/**`.
CẤM: `prisma/schema.prisma` · `lib/present-editor` · `lib/library` · `components/library` · `components/present-editor` · `app/**` (trừ đọc).

## ④ VIỆC (interface T đã thiết kế — đây là hợp đồng, KHÔNG tự đổi hình dạng)
1. **Type** trong `lib/three/build-recipe.ts`: `BuildRecipeStep = { id: string; op: BuildOp; enabled: boolean; label?: string }` · `BuildRecipe = { steps: BuildRecipeStep[] }`. Entity/group 3D trong Doc nhận field additive `recipe?: BuildRecipe` (OPTIONAL — file cũ mở bình thường, không migrate). MARKER: `BuildRecipe`.
2. **Evaluator thuần** `evalRecipe(base, steps)` → geometry: gọi các hàm build-ops SẴN CÓ (không viết lại toán); bước `enabled:false` bỏ qua; bước tham số sai → bỏ qua + trả cờ lỗi từng bước (`stepErrors`), KHÔNG crash, KHÔNG ship geometry sai âm thầm (luật vận hành 8).
3. **Nối nơi tiêu thụ**: `docToObjScene`/`resolveGroupGeometry` đọc `recipe` khi có — kết quả 3D LUÔN suy từ Doc, không giữ mesh riêng.
4. **UI stack** trong Command3DPanel (tab Sửa): danh sách bước — tên lệnh TIẾNG ANH dòng chính + dòng nhỏ giải thích Việt (luật 08/08: Array/Bevel/Chamfer/Mirror… giữ tên Anh); mỗi bước: toggle mắt (enabled) · xoá · sửa tham số (tái dùng khuôn nhập số Tool3DBar) · mũi tên lên/xuống đổi thứ tự. Thêm bước mới từ các op đã chạy được (tối thiểu Array grid/radial · Mirror · Bevel · Chamfer). Bước lỗi hiện đỏ kèm lý do ngắn.
5. **Undo**: mọi sửa recipe đi qua đường ghi Doc hiện có → undo/redo sẵn chạy, không cơ chế riêng.
6. **Test**: `lib/three/build-recipe.test.ts` — evalRecipe đủ nhánh (thứ tự, disabled, lỗi tham số, recipe rỗng), round-trip Doc có recipe qua serialize/deserialize hiện có.

## ⑤ RÀNG BUỘC
Không git · không mở dev server · không prisma (generate/migrate/db push) · đơn vị mm · token màu qua CSS var, bo góc theo thang `--r-*` · nhãn hiển thị không lộ jargon nội bộ (trừ tên lệnh Anh theo luật 08/08) · reduce-motion thắng.

## ⑥ NGHIỆM THU TỰ LÀM (dán kết quả THẬT vào báo cáo)
```
npx tsc --noEmit
node_modules/.bin/sucrase-node lib/three/build-recipe.test.ts
node_modules/.bin/sucrase-node lib/three/build-ops.test.ts
grep -rn "BuildRecipe" lib/three | head -5
```

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-12-D2-build-recipe.md` — khuôn 2 GIÁ TRỊ (§1c HOP-DONG): kiến trúc + vận hành-sử dụng, mỗi lớp phân [tính năng]/[giao diện]; file sửa/tạo; kết quả lệnh dán nguyên văn; quyết định tự chọn + lý do; CHƯA LÀM nói thẳng; chạm biên liên chặng thì DỪNG + đề xuất lên T.

## ⑧ DÂY MÁY
Entry registry `build-recipe` (bangChung: dir `lib/three`, mẫu `BuildRecipe`). Agent KHÔNG tự sửa registry — T flip sau audit.
