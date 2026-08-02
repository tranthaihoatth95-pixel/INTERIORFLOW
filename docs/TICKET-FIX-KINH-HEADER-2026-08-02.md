# TICKET — KÍNH LỒNG KÍNH Ở HEADER (K4 · code chính)

> Hoà chụp 02/08: menu avatar (Demo Tour · Đổi avatar · Đăng xuất) bị nút "Đưa sang Presenting →"
> của node canvas xuyên qua RÕ NÉT. KHÔNG phải z-index.

## Gốc
`<header class="mat-header">` (AppChrome.tsx:152) có backdrop-filter → tạo **backdrop root**.
2 dropdown `mat-panel` (AppChrome.tsx:313 · :465) là CON của header → blur của menu chỉ sample
trong phạm vi header, không thấy canvas dưới ⇒ nền alpha 0.68/0.7 mà blur không ăn = xuyên thấu.
(Cùng họ với K1-K3 code phụ — TICKET-FIX-KINH-LONG, worktree.)

## Sửa (chọn 1, ưu tiên a)
a) **Portal 2 dropdown ra document.body** (giữ Liquid Glass đúng chốt SPEC-DESIGN-SYSTEM-IF §2b):
   anchor theo nút (getBoundingClientRect), z-[80], đóng theo useDismissable như cũ.
b) Fallback nếu portal kẹt: dropdown dùng NỀN ĐẶC var(--panel) (bỏ kính riêng menu) — hết xuyên.

## Điều kiện xong
Mở menu avatar + menu ··· đè lên node có nút "Đưa sang Presenting" → sau menu là BLUR mờ, không
còn chữ nét xuyên qua. Cả light/dark theme. tsc/eslint/test sạch · verify browser · 1 commit riêng.

## Bài học (chung với K1-K3)
1. **Fade kính = self-opacity**, không fade wrapper cha.
2. **Kính không được lồng trong kính** — panel nổi kính phải PORTAL ra body, không làm con của
   header/toolbar kính. Áp cho MỌI popover về sau (Vitals LM, node inspector, camera panel...).
