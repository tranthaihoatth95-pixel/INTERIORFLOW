# PROMPT gửi Mia — Increment 2 (UI): Material Tag / Bảng vật liệu

> Copy toàn bộ phần dưới gửi Mia (Cowork). Tính năng self-contained, 0 AI, khớp pattern sẵn có.

---

Bạn xây tính năng **Material Tag / Bảng vật liệu (material schedule)** cho InteriorFlow (Next.js 14, TypeScript, TailwindCSS, @xyflow/react, Zustand) tại `~/Downloads/interiorflow`. Đây là tính năng **thủ công 100%, không gọi AI** — chú thích vật liệu lên ảnh phối cảnh (từ AI hoặc từ Vray/D5) bằng **mã vật liệu có sẵn trong thư viện**.

**Mục đích nghiệp vụ (quan trọng):** đây là bước tiến tới **khâu thi công/build** — phối cảnh dùng vật liệu gì thì note ra thành **bảng spec** (mã + ảnh) để khách duyệt và xưởng đặt hàng. App chỉ **đối chiếu + lập bảng**, không sinh ảnh. Nên output phải là **bảng vật liệu chuyên nghiệp** (số thứ tự → swatch → tên → mã NCC), không phải chỉ chú thích rời.

## Bối cảnh & pattern PHẢI theo (đọc trước khi code)
- **Node modal có sẵn để bắt chước 1:1**: `components/MaskPainterModal.tsx` và `components/AnnotateModal.tsx` (canvas, click/vẽ, save → dataURL vào param node). Store dùng `maskEditorNodeId`/`annotateNodeId` + setter — LÀM Y HỆT với `materialTagNodeId`.
- **Node registry**: `lib/nodes/registry.ts` — mỗi node là 1 object (type/category/inputs/outputs/params/execute). Node util 0-credit ví dụ: `util.annotate`, `util.palette`. ParamDef có kind `annotate`/`mask` (nút mở modal) trong `lib/types.ts` — thêm kind `materialtag` tương tự.
- **Thư viện vật liệu**: gọi `GET /api/library` → trả `{assets:[{id,name,category,tags,url,...}]}`. Lọc `category === 'Vật liệu / Texture'`. (Xem cách `components/LibraryPanel.tsx` fetch.)
- **Design Apple**: dùng token CSS `var(--card/--field/--border/--t1..t5/--hover/--accent/--accent-strong/--radius-md/--shadow-pop)`, class material `.mat-card/.mat-overlay`, motion từ `lib/motion.ts` (`modalScale`, `easeApple`, `pressable`). Modal nền `.mat-overlay`. Comment tiếng Việt.

## Chức năng
1. **Node mới `util.materialtag`** (category `UTILITY`, creditCost 0):
   - input: `image` (dataType image).
   - output: `image` (dataType image) — ảnh đã ghép callout + bảng chú thích.
   - param kind `materialtag` (nút "Gắn vật liệu" mở modal).
   - `execute`: nếu chưa gắn tag → trả nguyên ảnh input; nếu có → trả ảnh đã composite (dataURL đã lưu ở param).
2. **Modal `MaterialTagModal.tsx`** (mở từ store `materialTagNodeId`):
   - Hiện ảnh nguồn (lấy như MaskPainterModal: từ output upstream đã chạy, hoặc file Import Image).
   - **Click lên ảnh** → mở picker chọn vật liệu từ thư viện (grid ảnh swatch + tên + mã, có search) → đặt **callout đánh số** (①②③…) tại điểm click. Kéo callout để chỉnh vị trí. Xoá callout.
   - **Bảng chú thích (legend)** bên cạnh: số → swatch nhỏ + tên + mã NCC (tags). Tự đánh số lại khi xoá.
   - **Lưu**: composite ảnh + callout + legend thành 1 ảnh (canvas `toDataURL('image/jpeg')`, xử lý CORS như MaskPainter/Annotate) → `updateParam(nodeId,'tags', JSON)` và param ảnh output. Lưu cả JSON các tag (để mở lại sửa được) + ảnh đã ghép.
   - Esc/backdrop đóng. Style Apple, motion `modalScale`.
3. **Store** (`lib/store.ts`): thêm `materialTagNodeId: string|null` + `setMaterialTagNodeId` (y hệt annotateNodeId).
4. **Nối UI**: render `<MaterialTagModal/>` trong `app/page.tsx` (cạnh AnnotateModal). Trong `components/nodes/InteriorNode.tsx`, xử lý ParamField kind `materialtag` = nút mở modal (giống kind `annotate`).

## RÀNG BUỘC (quan trọng — tránh giẫm chân Claude Code)
- Làm trên branch riêng: `git checkout -b feat/material-tags`. **Commit path-scoped** (chỉ stage đúng file mình sửa, KHÔNG `git add -A` — có nhiều thứ đang chạy song song).
- File được phép đụng: **thêm mới** `components/MaterialTagModal.tsx`; **sửa** `lib/types.ts` (thêm kind), `lib/nodes/registry.ts` (thêm 1 node + kind materialtag ở defaultParams), `lib/store.ts` (thêm state modal-id), `components/nodes/InteriorNode.tsx` (thêm nhánh ParamField), `app/page.tsx` (mount modal). KHÔNG đụng Header/LoginScreen/IntroSequence/entry/*, KHÔNG đụng adapter AI, KHÔNG đổi theme tokens.
- **Verify bằng `npm run build` THẬT** (không chỉ `tsc --noEmit` — lint bắt được lỗi tsc bỏ qua, ví dụ import thừa). Dừng dev server trước khi build (`next build` khi dev chạy sẽ hỏng `.next`).
- Nếu `git` báo `HEAD.lock`: `rm -f .git/*.lock` rồi thử lại.
- Xong: bàn giao doc ngắn (file nào, cách test, lưu ý merge) — đừng tự merge vào main.

## Tiêu chí nghiệm thu
- [ ] Kéo node Material Tag, nối ảnh vào, mở modal, click 3 điểm gắn 3 vật liệu từ thư viện → 3 callout ①②③ + legend đúng.
- [ ] Lưu → node xuất ảnh đã ghép callout + bảng; mở lại sửa được.
- [ ] `npm run build` xanh. Không đụng file ngoài phạm vi.
