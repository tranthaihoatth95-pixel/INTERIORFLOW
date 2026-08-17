# PHIẾU P-DASHBOARD-DS — dashboard Home theo hệ design system

> Giao: T · 17/08 tối · vùng ghi: `components/home/DongStudioHome.tsx` + `components/home/widgets/*.tsx` + báo cáo. ⛔ KHÔNG đụng `components/HomeScreen.tsx` (P-ROUTER-HOME giữ) · `components/studio/AppShell.tsx` · `app/globals.css` · `--accent*` · KHÔNG THÊM token màu mới.

## ⓪b `git log -1` + `HEAD..main` = 0.
## ⓪ TIỀN ĐỀ (BÁC → DỪNG)
> Hoà chê 17/08 tối *"dashboard sai HOÀN TOÀN hệ design system"*. Đo ảnh chụp thật (Home hiện tại):
> · Card KHÔNG có kính lỏng — nền `--panel` đặc trơn (grep `backdrop-filter` trong widgets = 0)
> · KHÔNG có ambient tint chuyển sắc mép card (chốt REF #5 · 12/08)
> · Chữ số ô "01 PROJECTS" mono khai lộ, không có chữ ký thị giác (chốt `simpleCoChiTiet`)
> · Widget đè nhau không có khoảng thở đủ · thang bo góc lệch
> · Ảnh render (03 THIS WEEK'S FRAME) không có khung, không kính
> Chốt liên quan: NT-1..18 · KB-1..5 · kính lớp vỏ (K1-K4) · ba tầng ánh sáng (nhận sáng · hover · render) · card ba nấc.

## ② ĐỌC TRƯỚC
`docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` (NT-1..18) · `docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` (KB-1..5) · `docs/00-CHOT.md` (các chốt 16/08: kính lớp vỏ · ambient · ba tầng ánh sáng · simple-có-chi-tiết) · `components/home/DongStudioHome.tsx` toàn bộ · `components/home/widgets/*.tsx` · `app/globals.css` (đọc token, KHÔNG SỬA).

## ③ VIỆC — sửa theo hệ, KHÔNG đẻ mới
1. **Card kính lỏng** — dùng class/token đã có (`mat-panel` · `backdrop-filter`); cấm đẻ hệ kính mới. Áp cho MỌI widget card.
2. **Ambient tint** — mép card có gradient nhẹ theo nội dung (dùng token, không hex cứng). Chú ý ranh giới: kính chỉ ở LỚP VỎ, ruột đặc (chốt 16/08).
3. **Thang bo góc** đồng bộ theo `--r-*` đã chốt (6/10/14/20 + concentric).
4. **Khoảng thở** giữa widget theo `--gap` token, không magic number.
5. **Chữ ký "simple-có-chi-tiết-mang-tin"**: số ô 01/02/03 phải mang thông tin (vd đường dọc "hôm nay" trong timeline, chấm trạng thái ở đầu thanh việc), không chỉ label decorative.
6. **Ảnh render** (03 THIS WEEK'S FRAME) — dùng khuôn card kính đồng nhất, không placeholder trơ.
7. Widget thiếu dữ liệu **TỰ ẨN**, không hiển thị số 0/0 khô khan.

## ⑤ RÀNG BUỘC
· KHÔNG git ghi · KHÔNG chạy dev server mới (dùng sẵn port 3000) · KHÔNG đụng `--accent*` (Hoà chưa chốt màu nhấn thứ 2) · KHÔNG thêm token màu · KHÔNG đẻ hệ kính mới (dùng lại `mat-panel` + K1-K4 đã trả giá 4 vòng).
· Bám hiến pháp NT-1..18 làm cửa nghiệm thu.

## ⑥b ĐÍCH trần 5 vòng
`tsc` 0 · `npm test` 0 fail · `soi:hinh-hoc` không thêm lệch · `soi:tu-dien` không thêm lệch · `grep -c backdrop-filter components/home/widgets/*.tsx components/home/DongStudioHome.tsx` ≥ 3 · tự chấm 2 skill design không lỗi chặn · Hoà mở app thật thấy khác hẳn (dev server auto HMR).

## ⑦ báo cáo `docs/bao-cao-phien/2026-08-17-P-DASHBOARD-DS.md`
