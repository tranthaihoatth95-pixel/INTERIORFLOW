# PHIẾU COLLAB-LOI — mở ProvenanceInput union cho distiller

> Giao: T · 17/08 · vùng ghi: `lib/distill/**` · `lib/dna/**` (chỉ nếu cần) · báo cáo. ⛔ KHÔNG đụng `components/**` `app/**` `scripts/**` `--accent*`.
> Đây là **phiếu LÕI, không cần Hoà duyệt mắt** — chỉ tsc + test.

## ⓪b `git log -1` + `HEAD..main` = 0.
## ⓪ TIỀN ĐỀ (có quyền BÁC → DỪNG)
> COLLAB-NC báo: `distiller.ts:44` chỉ có `ProvenanceInput = { kind: 'image' }`, cần mở union 4 `kind` để cửa sổ Thảo Luận đưa dữ liệu vào. NC-COLLAB-CHANG-3D.md khai chi tiết ba loại cần thêm: `sticky` (note trên canvas) · `form` (kết quả điền form khung tư duy) · `asset` (item từ Gallery).

## ② ĐỌC TRƯỚC
`docs/nc/NC-COLLAB-CHANG-3D.md` toàn bộ · `lib/distill/engine.ts` · `lib/distill/types.ts` · `lib/dna/distiller.ts` · `lib/dna/distiller.test.ts`.

## ③ VIỆC
1. Mở `ProvenanceInput` thành discriminated union theo `kind`:
   - `image` (giữ nguyên) · `sticky` (nội dung note + tác giả + toạ độ canvas) · `form` (kiểu form + trường điền) · `asset` (assetId + nguồn Gallery)
2. `distill/engine.ts` phân nhánh xử lý cho từng kind, TRẢ VỀ chung `DistilledFacet` (không đẻ trường kết quả mới).
3. `dna/distiller.ts` nhận đầu vào mới, cờ `measured|inferred|verified` giữ luật cũ — `mergeDistilledIntoCard` không xoá `verified` từ người.
4. Test mới cho 3 kind mới, mỗi kind ≥2 ca (đủ dữ liệu · thiếu dữ liệu → null CHO MẢNH ĐÓ, không throw).

## ⑤ RÀNG BUỘC
· KHÔNG git ghi · KHÔNG dev server · KHÔNG đụng schema.prisma · trích mã điều khoản: mở `docs/TRIET-LY-IF.md` đọc số.
· ⚠️ Luật cũ ĐÃ ĐÚNG, không nới: `image` giữ nguyên hình dạng — đó là chỗ `from-photo.ts` đang gọi (`NC` đã bắt bug xFromPhoto mất khi nhập; **KHÔNG sửa bug đó trong phiếu này**, ghi ra §CHƯA CHẮC).

## ⑥b ĐÍCH trần 5 vòng
`tsc` 0 · `npm test` 0 fail · `distiller.test` pass đủ ca cũ + mới · grep chứng minh 3 kind mới XUẤT HIỆN trong types + có test.

## ⑦ báo cáo
`docs/bao-cao-phien/2026-08-17-COLLAB-LOI.md` — khuôn 6 phần + ⑦b + ⑦c.
