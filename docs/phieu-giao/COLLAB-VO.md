# PHIẾU COLLAB-VO — Cửa Sổ Thảo Luận trên mode Node

> Giao: T · 17/08 · vùng ghi: `components/collab/**` (mới) · `components/render-studio/**` · nâng cấp `docs/mocks/mock-collab-chang-3d.html` · báo cáo. ⛔ KHÔNG đụng `lib/distill/**` (P-COLLAB-LOI giữ) · `lib/dna/**` · `components/entry/**` · `--accent*` · `app/globals.css`.

## ⓪b `git log -1` + `HEAD..main` = 0.
## ⓪ TIỀN ĐỀ (có quyền BÁC → DỪNG)
> COLLAB-NC đề xuất **(b) TẦNG trên mode Node** — Cửa Sổ Thảo Luận `moiTruong:'ban-bac'`, dùng khuôn `CuaSoCongCu` sẵn có. Không phải mode thứ 3.

## ② ĐỌC TRƯỚC
`docs/nc/NC-COLLAB-CHANG-3D.md` · `docs/mocks/mock-collab-chang-3d.html` · `components/render-studio/ModeSwitchBar.tsx` · `lib/nodes/cua-so-cong-cu.ts` · `components/nodes/CuaSoCongCu.tsx` (khuôn tái dùng) · `components/nodes/NoteNode.tsx` · `components/form/ConceptForm.tsx`.

## ③ VIỆC
1. `components/collab/CuaSoThaoLuan.tsx` — mở rộng khuôn CuaSoCongCu với `moiTruong='ban-bac'`, đầu ra là **QUYẾT ĐỊNH** (không cổng file). Ba tab form:
   - **Moodboard** (mở rộng `ConceptForm`, KHÔNG chép — import + wrap)
   - **Bảng so cực** (2 cột trái/phải, thẻ so sánh)
   - **Câu chuyện 3 hồi** (Mở/Thân/Kết, mỗi hồi 1 khung ảnh + text ngắn)
2. Nút **"Chưng cất → Thẻ DNA"** ở góc cửa sổ — chỉ mờ tới khi P-COLLAB-LOI xong (dùng feature-flag `if (typeof ProvenanceInputSticky !== 'undefined')`); nếu chưa có union mới thì nút hiện mờ + lý do đọc được.
3. Nâng mock `mock-collab-chang-3d.html` — thêm ba tab thật, chấm 2 skill design trước khi nộp.
4. Marker: `[marker: cuaSoThaoLuan]`.

## ⑤ RÀNG BUỘC
· §6 HOP-DONG-CAU-TRUC-DIEU-HUONG · KHÔNG git ghi · KHÔNG dev server · KHÔNG đụng `--accent*` · KHÔNG thêm token màu vào globals.css.
· ⚠️ Cửa sổ THẢO LUẬN ≠ cửa sổ SẢN XUẤT: đầu ra là QUYẾT ĐỊNH (có thể KHÔNG có cổng ra) — không ép mọi phiên phải sinh Thẻ DNA.
· Chưng cất chỉ chạy khi Hoà bấm — không tự chạy sau mỗi thay đổi.

## ⑥b ĐÍCH trần 5 vòng
`tsc` 0 · `npm test` 0 fail · mock render sạch 2 skill design không lỗi chặn · `soi:tu-dien` + `soi:hinh-hoc` không thêm lệch · `soi:cam-dien` không sinh KHO CHƯA MỞ mới.

## ⑦ báo cáo `docs/bao-cao-phien/2026-08-17-COLLAB-VO.md` — khuôn 6 phần + ⑦b + ⑦c.
