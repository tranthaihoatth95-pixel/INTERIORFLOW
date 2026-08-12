# PHIẾU GIAO VIỆC — H1c · Home BENTO v3 (một màn, widget động, cử chỉ) — 13/08/2026

## ① BỐI CẢNH
Hoà chốt v3: *"cuộn 2 trang không ổn — tổng quan chia lưới BENTO, mỗi thẻ thiết kế như MỘT WIDGET ĐỘNG, thêm nhiều cử chỉ tương tác cho sinh động, thêm widget/thông tin sáng tạo."* v2 đã đúng NỘI DUNG (card dự án, sự kiện không lặp, tự ẩn) — v3 đổi BỐ CỤC + THÊM SỨC SỐNG. Không làm lại nội dung đã đạt, chỉ xếp lại + làm động.

## ② ĐỌC TRƯỚC
1. Code v2: `components/home/DongStudioHome.tsx` + `widgets/**` + `components/ProjectSelect.tsx` (projectGroups + ngăn Nháp vừa làm) + `lib/home/**`.
2. `docs/SPEC-HOVER-FOCUS-IDF.md` — bảng tra 9 loại phần tử (thẻ 1.02 + lift 2px 200ms · chip 1.04 · nút chỉ đổi nền 120ms · vào chậm ra nhanh · CẤM scale phần tử lớn).
3. `docs/00-CHOT.md` [12/08 ref #15] hover gradient KEM cho phần tử chọn được + [13/08 chốt v3].
4. `docs/SPEC-DESIGN-SYSTEM-IF.md` §2c chống ngô nghê (một-khối-một-bóng, nhịp, bo đồng tâm) + thang `--r-*`.
5. `lib/home/time-of-day.ts` (gradient giờ — nguồn cho Đồng hồ ánh sáng).
6. Đường API kho vật liệu/ảnh: `lib/library/` + `/api/library` (cho 2 widget mới — chỉ ĐỌC).

## ③ VÙNG FILE
ĐƯỢC: `components/home/**` · `components/ProjectSelect.tsx` · `lib/home/**` · `app/api/home/**` · `app/page.tsx`.
CẤM: `app/globals.css` · `prisma/schema.prisma` · components khác · thư viện chart/animation NGOÀI (CSS + SVG + spring sẵn có của repo thôi).

## ④ VIỆC

### 1 · Lưới bento MỘT MÀN (desktop 1440×900 fit không cuộn; <1100px xếp lại, cuộn tự nhiên)
Grid 12 cột × 3 hàng (khoảng cách `--gap`), bo `--r-3`/`--r-4`, một-khối-một-bóng:
```
┌────────────────────────────┬──────────────┬──────────────┐
│ A · DỰ ÁN (7c × 2h)        │ B · CHÀO +   │ C · HÔM NAY  │
│ card dự án image-forward   │ ĐỒNG HỒ ÁNH  │ việc đến hạn │
│ + ngăn Nháp (giữ v2)       │ SÁNG (5c×1h) │ + ai online  │
│ hover → lớp kính dữ liệu   ├──────────────┴──────────────┤
│                            │ D · ẢNH ĐẸP TUẦN NÀY (5c×1h)│
├──────────┬────────┬────────┼──────────────┬──────────────┤
│ E · BIỂU │ F · GHI│ G · MỐC│ H · VẬT LIỆU │ I · BẢNG TIN │
│ ĐỒ CHẶNG │ CHÚ TOT│ SẮP TỚI│ CỦA TUẦN     │ ticker dọc   │
└──────────┴────────┴────────┴──────────────┴──────────────┘
```
Tỉ lệ ô được phép nắn ±1 cột cho đẹp; Ô A là ô CHỦ — to nhất, không ô nào cạnh tranh. Vitals pill fixed góc (giữ). Nền toàn trang = gradient ánh-sáng-theo-giờ (giữ) nhưng MỜ/trầm — thẻ bento nổi trên nền.

### 2 · Mỗi thẻ = widget ĐỘNG (động CÓ NGHĨA — dữ liệu thở, không trang trí)
- A: ảnh cover ambient-tint; hover card → tilt ≤2° + lift 2px (đúng bảng tra) + lớp kính dữ liệu trượt lên (chặng · việc mở · presence); click → lastStage.
- B: **Đồng hồ ánh sáng** (widget sáng tạo #1, đúng nghề): cung SVG bình minh→hoàng hôn, chấm mặt trời ở vị trí giờ hiện tại, nhãn sắc ánh sáng ("ánh sáng chiều ấm 3200K" — map từ time-of-day); cập nhật mỗi phút (1 interval duy nhất toàn trang, cleanup đủ).
- C: avatar online có chấm pulse nhẹ (CSS, tắt khi reduce-motion); số việc đến hạn đếm lên (count-up 1 lần khi mount).
- D: **Ảnh đẹp tuần này** (widget sáng tạo #2): ảnh LibraryAsset mới nhất 7 ngày (usage ref/render), crossfade khi có nhiều ảnh (≤1 lần/8s); trống → tự ẩn, ô A giãn ra chiếm chỗ.
- E: cột chặng mọc lên 1 lần khi mount (transform, không animate opacity — luật G1); hover cột hiện số.
- F: ghi chú Tot giữ v2 + CỬ CHỈ MỚI: kéo một chấm note thả vào card dự án ở ô A → note gắn dự án đó (dùng HTML5 DnD, có fallback click-chọn; lưu qua notes-store sẵn có thêm trường projectId).
- G: mốc DayTicker giữ v2, hover ngày → tooltip tên việc.
- H: **Vật liệu của tuần** (widget sáng tạo #3): 1 vật liệu từ kho (chọn tất định theo số tuần — không random), swatch/ảnh + tên + click mở Thư viện; kho trống → tự ẩn.
- I: bảng tin giữ v2, thành ticker dọc tự trượt chậm (pause khi hover; reduce-motion = danh sách tĩnh).

### 3 · Cử chỉ toàn trang
Hover gradient KEM cho mọi phần tử chọn được trong bento (ref #15 — nổi kem ấm, không đổi chrome); giữ **Tab** → lớp dữ liệu bung trên TẤT CẢ card ô A cùng lúc (hướng C đã phác); phím **1-9** nhảy nhanh vào 9 dự án đầu (chỉ khi không focus input); mọi transition theo spring/preset SPEC-APPLE-MOTION, vào chậm ra nhanh; `prefers-reduced-motion` = mọi thứ tức thì + tắt pulse/ticker/crossfade/tilt.

### 4 · Giữ nguyên (không đụng nội dung đã đạt v2)
Gom dự án + ngăn Nháp · rule lời chào sạch · sự kiện một-nơi · timeAgo một nguồn · ngưỡng tự ẩn lưới tích luỹ (lưới tích luỹ KHÔNG vào bento khi dưới ngưỡng; đủ dày thì thay chỗ ô I hoặc thêm hàng) · widget trống tự ẩn và Ô LÂN CẬN GIÃN chiếm chỗ (grid không để lỗ thủng).

### 5 · Test
`lib/home` test mới: chọn-vật-liệu-tuần tất định · chọn-ảnh-tuần · map giờ→vị trí mặt trời; test v2 giữ pass.

## ⑤ RÀNG BUỘC
Như phiếu gốc + v2 (không git/server/prisma/AI/stock/globals.css/lib ngoài). Animation: CHỈ transform/opacity compositor, không layout-thrash; 1 interval toàn trang; không thư viện mới.

## ⑥ NGHIỆM THU TỰ LÀM
```
npx tsc --noEmit
for f in lib/home/*.test.ts; do node_modules/.bin/sucrase-node "$f"; done
grep -n "prefers-reduced-motion\|useReducedMotion" components/home/DongStudioHome.tsx components/home/widgets/*.tsx | head
```

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-13-H1c-home-bento.md` — sơ đồ ô đã dựng vs sơ đồ phiếu (lệch ô nào ghi lý do); danh sách cử chỉ đã làm; widget tự ẩn trong dữ liệu hiện tại; khuôn 2 giá trị.

## ⑧ DÂY MÁY
Entry `home-dong-studio` (mở lại chờ v3). Hover kem = áp MỘT PHẦN entry `hover-gradient-kem` (T ghi chú, không flip). Không tự sửa registry.
