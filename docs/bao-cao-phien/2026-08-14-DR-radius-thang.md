# BÁO CÁO PHIÊN · DR — rút radius ngoài thang về thang 6/10/14/20 + concentric · 14/08/2026

Phiếu: `docs/phieu-giao/ds-r-radius-thang.md` · Thước: `npm run soi:hinh-hoc` · Né 11 file DA (`2026-08-14-DA-ds-bug.md`).
Luật tuân thủ: KHÔNG git · KHÔNG server mới · KHÔNG login (dùng phiên 3000 đã đăng nhập sẵn) · CHỈ đổi radius.

## KHUÔN 2 GIÁ TRỊ
- **Kiến trúc app**: [giao diện] 325 khai báo radius lẻ trong 107 file components/** quy về MỘT thang duyệt 12/08 (6/10/14/20 + capsule 999); cặp lồng pad-4 phổ biến (card 14 chứa nút 10) tự thành concentric đúng công thức rInner = rOuter − pad.
- **Người dùng**: bo góc toàn app "phát triển từ tâm" nhất quán — nút/ô nhập cùng một độ cong, card cùng một độ cong, hết cảm giác lệch rải rác Hoà chê 12/08.

## SỐ TRƯỚC/SAU (soi:hinh-hoc, cùng ngày)
| | Trước | Sau |
|---|---|---|
| Ngoài thang | **334** (13 giá trị lẻ) | **10** (6 giá trị lẻ) |
| Giảm | — | **−97%** (mục tiêu ≥60%) |
| Trong đó sửa-được (ngoài file cấm) | 325 | **0** |
| Còn lại | — | 9 trong file cấm DA/phiếu + 1 giữ chủ đích |

107 file sửa (codemod 3 cú pháp css/jsx/tailwind, mirror đúng regex của `scripts/soi-hinh-hoc.mjs` — không đụng padding/màu/kích thước).

## BẢNG MAP ĐÃ ÁP
| Giá trị | → | Chênh | Ghi chú |
|---|---|---|---|
| 5 · 7 | 6 | 1 | đổi thẳng |
| 8 · 9 | 10 | ≤2 | 8 là tie (6/10 đều chênh 2) — chọn nấc TRÊN, xem lý do dưới |
| 12 · 13* · 16 | 14 | ≤2 | 12 là tie (10/14 đều chênh 2) — cùng lý do |
| 18 · 22* | 20 | 2 | |
| 11* · 13* · 17* | **999** | 0 | * = capsule ĐÃ XÁC MINH code: r = cao/2 (ModeSwitchCell nút 34/r17 + track 22/r11 · VitalsGesture nút 22/r11 ×2 + chip 26/r13) — 999 render Y HỆT, vào thang |
| 24 | 20 | 4 | 1 chỗ `LoginForm.tsx` lq-card — ĐÃ đổi + **vào danh sách duyệt mắt** (đã tự soi browser: ổn) |
| 28 | GIỮ | 8 | >4px — xem nhóm giữ |

**Lý do tie 8→10, 12→14 (chọn nấc trên):** thang duyệt 6/10/14/20 kế thừa nấc 10/14/20 của globals cũ — phần lớn UI hiện hành sinh từ thang đó, lên nấc trên giữ "linh hồn" hiện trạng; 8 mang vai "nút/ô nhập" mà đại diện thang là --r-2=10 (6 đã có vai nút-nhỏ/vi-mô riêng); và cặp lồng phổ biến (12 ngoài · 8 trong · pad 4) thành (14 · 10 · pad 4) = ĐÚNG concentric 14−4=10. Tiền lệ H3 13/08 "đổi theo nấc gần nhất" không phân xử tie — ghi ở đây để phiên sau không mở lại.

## NHÓM GIỮ LẠI — VÌ SAO (10 chỗ)
1. **File cấm DA/phiếu (9 chỗ) → HÀNG ĐỢI, mở khi đợt DA nghiệm thu xong:**
   - `components/BottomToolbar.tsx:75` rounded-[17px] + `:115` borderRadius 22 — cả hai là capsule §2d ĐÚNG CHỐT (nút 34/r17 · bar 44/r22), khi mở file chỉ cần → 999, hình y hệt.
   - `components/filemanager/FilesNavigator.tsx:32,48,62` rounded-[8px] → 10.
   - `components/filemanager/files-mock-css.ts:60` `7px 7px 8px 8px` (icon folder multi-value) · `:149,150` track 5px (cao 5 = capsule → 999) · +1 chỗ 5px cùng file.
2. **`components/avatar/AvatarBuilder.tsx:171` border-radius 28px — GIỮ theo luật biên** (nấc gần nhất 20, chênh 8 > 4px, sheet to đổi hình dáng rõ) → **hàng đợi mắt** cho Hoà quyết 28→20 hay thêm ngoại lệ.

## FILE ĐỔI NHIỀU NHẤT
`components/cad/CadEditor.tsx` (21) · `components/render-studio/Command3DPanel.tsx` (17) · `components/cad/CadCanvas.tsx` (15) · còn lại rải 104 file ≤6 chỗ/file.

## KIỂM MÁY + MẮT
- `npx tsc --noEmit` → **0 lỗi**.
- `npm run soi:hinh-hoc` → 334 → **10** (bảng trên).
- `npm run soi:tu-dien` → **0 lệch**.
- `npm run soi:thao-tac` → 2 lệch **CÓ SẴN, không đổi so baseline DA** (outline-can-focus-visible 31 file · cam-hex-inline đúng 193× như DA ghi — phiên này không thêm hex/outline nào).
- Spot-check browser (tab 3000 sẵn, không login): **/login** (card 24→20 + checkbox 5→6 ổn) · **Tổng quan** (card 16→14 ổn) · **/projects/…/cad** (CadEditor — file nặng nhất: toolbar, empty-state, dock dưới đều lành) · **/projects/…/present** (PresentEditor/GenerateFlow/SlideStrip lành). Ghi chú: `/projects/…/render` ở khổ hẹp 732px bị guard "bản xem nhanh" đẩy về Tổng quan — hành vi có sẵn của khổ hẹp, không liên quan radius; ModeSwitchCell đổi 17/11→999 là hình-y-hệt nên rủi ro 0.

## HÀNG ĐỢI MẮT (duyệt-mắt-gộp)
1. `LoginForm` lq-card 24→20 (chênh 4 — đã tự soi, ổn, chờ mắt Hoà xác nhận).
2. `AvatarBuilder` sheet 28 (giữ nguyên — cần Hoà phán).
3. 9 chỗ file cấm DA (bảng trên) — mở phiếu nhỏ sau khi đợt DA đóng.

Dây máy: entry `dong-bo-ds-mat` phần A4 — chờ T flip khi đợt xong.
