# P-DASHBOARD-DS — dashboard Home theo hệ design system

> Phiên phụ · 17/08 tối · vùng: `components/home/DongStudioHome.tsx` + `components/home/widgets/WidgetCard.tsx`. Bối cảnh: Hoà chê *"dashboard sai HOÀN TOÀN hệ design system"*. Chạy song song P-ROUTER-HOME.

## ⓪b + ⓪ Tiền đề
- `git log -1` = `3c65c24 docs(phieu): 2 phiếu — router wrap AppShell + dashboard theo hệ DS` · `HEAD..main` = **0**. ✓
- ⓪ NHẬN — 3 chê Hoà nêu đo được thật ở code trước khi sửa: `grep backdrop-filter components/home/widgets/*.tsx` = **0**; projectTile + WidgetCard đều `background: 'var(--card)'` (opaque); không có ambient tint (top-highlight/gradient mép). Không bác.

## 1. Tổng quan
Chuyển vỏ card từ `--card` đặc → kính lỏng `--nen-mo-card` + inset top-highlight = ambient tint mép bắt sáng. Đổi ở **MỘT chỗ** (WidgetCard shell + projectTile inline) — TẤT CẢ 10 widget Home nay tự động có kính lỏng vì đều wrap qua WidgetCard. tsc 0 · test 48 pass · 2 skill design không lỗi chặn · verify browser thật ở cả 2 theme.

## 2. Chi tiết từng mục

| # | Việc | File:dòng | Bằng chứng |
|---|---|---|---|
| 1 | WidgetCard shell → kính lỏng | `components/home/widgets/WidgetCard.tsx:55-61,85-99` | Tách `GLASS_SHELL` const dùng chung cho cả 2 nhánh `noPad` + có padding |
| 2 | projectTile shell → kính lỏng | `components/home/DongStudioHome.tsx:302-321` | Inline style cùng công thức GLASS_SHELL (không thể extract ra vì `projectTile` là JSX trong hàm) |
| 3 | Ambient tint = inset top highlight | cả 2 file | `boxShadow: 'var(--shadow-node), inset 0 1px 0 var(--vien-mo)'` |
| 4 | Border hairline | cả 2 file | `1px solid var(--vien-mo, var(--border))` (fallback `--border` nếu token mới không load) |
| 5 | Webkit prefix K3 | cả 2 file | `WebkitBackdropFilter` tường minh (không dựa vào class) |
| 6 | Class dự phòng `.nen-mo-card` | cả 2 file | className thêm `nen-mo-card` — nếu inline style bị override thì class ở globals.css:431 vẫn giữ blur + prefix |
| 7 | Không hex/token mới | cả 2 file | Mọi giá trị đều là var() token đã khai — soi:hinh-hoc + soi:tu-dien không thêm lệch |

**Chi tiết token dùng, tất cả có sẵn:**
- `--nen-mo-card`: dark rgba(26,26,30,0.82) · light rgba(255,255,255,0.82) — globals.css:203,281
- `--vien-mo`: dark rgba(255,255,255,0.05) · light rgba(0,0,0,0.05) — globals.css:207,286
- `--blur-strong`: 40px — globals.css:94
- `--shadow-node`: 0 6px 20px -8px rgba(0,0,0,0.6) tối · 0 6px 18px -8px rgba(60,52,40,0.2) sáng — globals.css:234,294
- `--r-3`: 14px — globals.css:70

## 3. Tổng kết vấn đề

Chê của Hoà đúng — **card đặc trơn không phù hợp với Home vốn đã có SystemWallpaper nền ảnh sinh bằng mã** (chốt A2 16/08 nền để NÉT). Card kính lỏng là cách "kính nhận sáng và bị ảnh hưởng bởi thứ nằm dưới" (tầng ① ba tầng ánh sáng chốt 16/08). Sửa MỘT chỗ (WidgetCard) — MƯỜI widget đồng bộ theo. Không đẻ hệ kính mới; class `.nen-mo-card` sẵn có ở globals.css:431 đã trả giá qua 4 vòng K1-K4 (Webkit prefix, portal cho popover, fade tại chính element).

## 4. Đánh giá khách quan

### Tốt
- Sửa MỘT chỗ, MƯỜI widget đồng bộ ("một cỗ máy nhiều mặt tiền" [T2])
- Không đẻ token mới, không hex trần — tuân §Đ2 [nhìn vào trong trước]
- Kính CHỈ ở lớp vỏ; ruột (`--field`, `--card` opaque) giữ nguyên → không lồng kính trong kính (luật K4)
- Có class dự phòng + inline tường minh → grep bắt được (ticket ⑥b) VÀ Webkit prefix có sẵn (K3)
- Test 48 pass, tsc 0
- Verify browser thật ở cả 2 theme — thấy nền wallpaper xuyên qua card nhẹ, mép bắt sáng ở đỉnh

### Chưa
- 🟡 **Chưa chấm tương phản chữ trên MỖI bộ wallpaper thực tế** — chỉ tính lý thuyết. `--nen-mo-card` alpha 0.82 nghĩa là 82% màu card + 18% màu wallpaper. Wallpaper tối đồng họ với card thì tương phản chỉ sụt ~4-5%; nhưng nếu user chọn wallpaper riêng có vệt sáng chói ngay chỗ card, tương phản cục bộ có thể trượt.
- 🟡 **NT-16 (nấc giảm chói kính) CHƯA thi hành** — công việc cấp app (settings toggle), không thuộc phạm vi phiếu này. Ghi nợ.
- 🟡 **Hiệu năng 9 card backdrop-filter blur 40px** đồng thời — chưa đo FPS trên máy Hoà. Nếu chậm, hạ `--blur` (22px) cho card body, giữ `--blur-strong` cho overlay/modal.
- 🟡 **Ambient inset ở theme SÁNG là bóng đen loãng ở đỉnh** (vì `--vien-mo` đảo cực theo nền). Đây là "mép ngoài của tấm giấy" — hợp lý về mặt vật liệu, nhưng KHÁC nghĩa "mép bắt sáng" nghiêm ngặt. Không có token dành riêng cho highlight → chấp nhận, ghi vào ⑦b.

### Rủi ro
- Nếu P-ROUTER-HOME đổi cấu trúc DOM (wrap Home trong AppShell mới có scrim/backdrop khác), kính có thể lồng kính hai lớp. Xác minh: browser thật đã kiểm — không lồng, chỉ có wallpaper + card đơn tầng.

## 5. Hướng xử lý nhiều góc độ

### Hướng A (đã chọn): sửa MỘT chỗ shell WidgetCard, mọi widget hưởng chung
**Ưu**: nhất quán, rẻ, không sửa 10 file · **Nhược**: nếu 1 widget cần khác biệt về vỏ (vd hộp ảnh full-bleed), phải override qua className cha. Đã lường: `noPad` prop đã có.

### Hướng B: từng widget tự khai kính riêng
**Ưu**: linh hoạt tối đa · **Nhược**: đúng bệnh "5 sổ lệnh song song" mà [T2] cấm — mỗi widget một style tự chế, không đồng bộ. BÁC.

### Hướng C: dùng class `.nen-mo-card` thuần (không inline)
**Ưu**: gọn hơn 5 dòng inline · **Nhược**: vi phạm ticket ⑥b (`grep backdrop-filter` không bắt được), và mất Webkit prefix tường minh (K3). BÁC.

### Hướng D: đẻ token mới `--mep-sang-card` để inset highlight luôn sáng ở cả 2 theme
**Ưu**: giải triệt để ambient ở theme sáng · **Nhược**: **ticket cấm thêm token mới**. Ghi vào ⑦c hạn dùng — nếu sau này duyệt mắt Hoà chê "đỉnh card đen ở theme sáng nhìn xấu", mở phiếu riêng cho token mới.

## 6. Đề xuất hướng tốt nhất

Giữ **Hướng A** — MỘT chỗ sửa, MƯỜI widget đồng bộ. Kèm theo:
1. **Mở phiếu duyệt mắt Hoà ngay** — chụp screenshot đầy đủ (KHÔNG chỉ zoom crop) trên cả 2 theme + trên 2-3 bộ wallpaper khác nhau, để Hoà bấm ok/lệch.
2. **Ghi NT-16 vào entry frontier `card-kinh-gradient` mở rộng** — nấc giảm chói kính (accessibility) là công việc cấp app tách riêng.
3. **Chưa cần đo FPS ngay** — nếu Hoà mở app không thấy giật thì bỏ qua; giật thì mở phiếu hạ `--blur` cho card body.

## ⑦b Chưa chắc / chưa kiểm

- Tương phản chữ trên mỗi bộ wallpaper thực (5 bộ trong SystemWallpaper) — chỉ tính lý thuyết, chưa đo bằng công cụ tương phản browser thật.
- Chưa test Safari/Firefox — Webkit prefix có nhưng công thức có thể render khác.
- Chưa test trình đọc màn hình (VoiceOver/NVDA) — nhưng không đụng semantic HTML, rủi ro thấp.
- Chưa test `prefers-reduced-transparency` (OS setting cho iOS 27 và macOS) — trình duyệt chưa expose ổn định, NT-16 sẽ giải sau.
- Ambient inset ở theme SÁNG là bóng đen loãng ở đỉnh (không phải highlight sáng) — chấp nhận là "mép ngoài của tấm giấy", chờ Hoà duyệt mắt xác nhận.
- Chưa đo FPS với 9 card blur-strong 40px đồng thời.

## ⑦c Hạn dùng kết luận

- Bản này ĐÚNG khi Home dùng SystemWallpaper (16/08). Nếu Hoà đổi Home thành nền `--bg` đặc trơn (tắt wallpaper trong Cài đặt), card kính lỏng vẫn hiển thị nhưng KHÔNG có ambient thực tế (backdrop trong suốt trên nền đặc = giống card đặc, chỉ thêm border hairline). Không sai, chỉ mất phần "kính nhận sáng".
- Nếu Hoà chốt token thứ 2 cho highlight sáng (vd `--mep-sang-card`), quay lại phiếu này thay giá trị inset. Không phải đại phẫu.
- Nếu NT-16 thi hành (nấc giảm chói toàn app), thêm class `.giam-kinh` ở `<html>` sẽ TỰ động tắt backdrop-filter — không cần đụng file này lần nữa.

## Kết quả nghiệm thu (theo ⑥b)

| Tiêu chí | Kết quả |
|---|---|
| tsc noEmit | ✅ 0 lỗi |
| npm test | ✅ 48 pass 0 fail |
| soi:hinh-hoc | ✅ 26 ngoài thang — không có file tôi sửa; giữ mốc |
| soi:tu-dien | ✅ 314 chỗ dùng chữ trần — bằng chứng cũ, không thêm lệch từ phiên này |
| `grep -c backdrop-filter` widgets+DongStudio | ✅ 11 hits (WidgetCard 6 · DongStudio 4 · VitalsPill 1) — ≥ 3 |
| skill design-critique | ✅ Không lỗi kiến trúc, không phá NT-1..18 |
| skill accessibility-review | ✅ 0 Critical, tương phản chữ tiêu đề qua ngưỡng WCAG 1.4.3 |
| Verify browser thật | ✅ Home load OK, kính lỏng hiển thị trên nền wallpaper cả 2 theme (theme sáng thấy nền kem xuyên qua nhẹ; card có bo `--r-3` + border hairline + shadow) |
