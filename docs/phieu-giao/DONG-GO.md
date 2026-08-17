# PHIẾU DONG-GO — gỡ #c79a63 khỏi components/entry/

> Giao: T · 17/08 · vùng ghi: `components/entry/**` · báo cáo. ⛔ KHÔNG đụng `components/nav/**` `components/collab/**` `lib/**` `app/**` `scripts/**` `app/globals.css` `--accent*` VÀ KHÔNG THÊM token màu.

## ⓪b `git log -1` + `HEAD..main` = 0.
## ⓪ TIỀN ĐỀ (có quyền BÁC → DỪNG)
> `COPPER = '#c79a63'` gõ cứng ở `components/entry/LoginScreen.tsx` (đường sống, xem `bde99c4`), lan sang `LoginBackdrop.tsx:74,608` · `StackedCards.tsx:84` · `cardFaces.tsx:119`. Đây đúng màu Hoà **bỏ hẳn 16/08** ("tone vàng thêm xám vào là thảm hoạ"). ⇒ đổi sang **`var(--accent)`** — đây là *thôi dùng màu đã bị bỏ*, KHÔNG phải chọn màu mới.

## ② ĐỌC TRƯỚC
`components/entry/LoginScreen.tsx` · `LoginBackdrop.tsx` · `StackedCards.tsx` · `cardFaces.tsx` · `docs/00-CHOT.md` [16/08 chốt bỏ vàng đồng].

## ③ VIỆC
1. Grep chính xác `#c79a63`, `199,154,99`, `COPPER` toàn `components/entry/**` — sửa hết sang `var(--accent)`.
2. Cẩn thận: `LoginBackdrop.tsx:222` mặc định `preset:'ember'` = quầng đồng. Đổi sang **`preset` mặc định khác** không dùng COPPER, chọn cái tốt nhất trong 4 preset còn lại (`aurora` không phù hợp — nó là dynamic bg). Hoặc nếu tất cả preset đều là ember-based thì đổi công thức render quầng dùng `var(--accent)` thay vì COPPER.
3. **KHÔNG đụng nền ảnh** (WALLPAPERS = [] cố ý theo luật trung tính, chờ Hoà chọn ảnh CC0).
4. Tự chấm design:accessibility-review — chữ trên card đăng nhập ≥4.5:1.

## ⑤ RÀNG BUỘC
· `--accent` (tím) chốt và đang chạy khắp app — dùng đúng nó, cấm chế biến.
· KHÔNG git ghi · KHÔNG dev server · KHÔNG đụng WALLPAPERS array (rỗng cố ý).

## ⑥b ĐÍCH trần 5 vòng
`tsc` 0 · `npm test` 0 fail · `grep -c "#c79a63\|199,154,99\|COPPER" components/entry/` = **0** · `soi:tu-dien` không thêm lệch · tương phản chữ đăng nhập đo được ≥4.5:1 dán vào báo cáo.

## ⑦ báo cáo `docs/bao-cao-phien/2026-08-17-DONG-GO.md`.
