# PHIẾU GIAO VIỆC — H1d · Home bento v4 "co giãn theo độ dày dữ liệu" — 13/08/2026

## ① BỐI CẢNH
Hoà soi bento v3 THEME SÁNG: "thấy ghê". T đo từ ảnh chụp: 6 lỗi — 9 hộp rỗng ruột (dữ liệu studio mỏng: 1 dự án·0 việc·1 người mà widget vẫn bày) · card dự án VỠ (mất tên, avatar HO lặp 2 lần chồng nhau) · "Ảnh đẹp tuần" ăn ảnh SEED Unsplash (giả trân) · ô 01 khoảng trắng mênh mông + gradient tím lạc + VI/EN·(i) lơ lửng · cung mặt trời mảnh vô hình · theme sáng trắng-trên-trắng thiếu phân tầng. NGUYÊN TẮC MỚI (chốt từ lời chê): **bento co giãn theo ĐỘ DÀY DỮ LIỆU — mỏng thì rút còn ít ô đầy đặn, không bao giờ bày hộp trống.**

## ② ĐỌC TRƯỚC
1. Code v3: `components/home/DongStudioHome.tsx` + `widgets/**` + `lib/home/aggregate.ts` (ngưỡng shouldShow*).
2. `components/ProjectSelect.tsx` phần projectGroups/card (bug tên + avatar lặp nằm đây).
3. `docs/nc/NC-HOME-DELIGHT-2026-08-13.md` mục Bẫy (số 0 tròn, giả trân) + `NC-GU-BENTRAN` (Swiss, khoảng thở CÓ CHỦ ĐÍCH ≠ trống rỗng).
4. `lib/library/gallery-tags.ts` (lọc seed: tag `demo,minh-hoa`).

## ③ VÙNG FILE
ĐƯỢC: `components/home/**` · `components/ProjectSelect.tsx` · `lib/home/**` · `app/api/home/**`.
CẤM: globals.css · prisma · mọi thư mục khác.

## ④ VIỆC
1. **NGƯỠNG DÀY-MỎNG cho TỪNG widget** (hằng số + test trong lib/home): Hôm-nay cần ≥2 tín hiệu thật (việc đến hạn/xong + người online NGOÀI bản thân — 1 mình xem app không phải "hôm nay của studio") · Biểu đồ chặng cần ≥2 dự án có hoạt động · Bảng tin cần ≥2 sự kiện 7 ngày · Mốc cần ≥1 dueDate · **Ảnh tuần: CHỈ ảnh user thật (LOẠI tag `demo,minh-hoa` seed), không có → ẨN** · Vật liệu tuần: chỉ khi kho có vật liệu user dùng/ghim, seed không tính. Widget dưới ngưỡng = KHÔNG RENDER.
2. **Grid RÚT GỌN đẹp theo số ô sống**: định nghĩa sẵn 3 layout nấc — ĐẦY (7-9 ô như v3) · VỪA (4-6 ô) · **MỎNG (2-3 ô: ô Dự án lớn + ô Chào/ánh-sáng gộp + Ghi chú)** — chọn nấc theo số widget sống, ô luôn kín lưới không lỗ. Trạng thái MỎNG phải ĐẸP NHẤT vì đó là ngày-đầu của mọi studio (và là cái Hoà đang nhìn).
3. **Fix card dự án (bug)**: tên dự án LUÔN hiện (đè lớp tối gradient dưới ảnh cover nếu cần), MỘT PresenceRow duy nhất (diệt avatar lặp), card theme sáng không đen thui (cover thiếu → nền giấy + tên to, không khối đen).
4. **Ô 01 gọn**: bỏ gradient tím nền; VI/EN + (i) dời về góc thống nhất (cạnh Vitals pill); nội dung ô 01 chiếm trọn (search + lưới card + ngăn Nháp) — không còn "biển trắng dưới đáy" (grid card auto-fill, ô co theo).
5. **Cung mặt trời đậm chất sơ đồ**: nét 2px + chấm mặt trời 8-10px + fill nhẹ dưới cung; nhãn rút ngắn ("BAN NGÀY · 5600K"); lời chào + cung + 1 dòng dữ liệu thật (nếu có) là MỘT khối gắn kết, không rời rạc.
6. **Theme sáng phân tầng**: nền trang giấy ấm (token có sẵn), ô card trắng + border thật + bóng 1 lớp (một-khối-một-bóng §2c) — hết trắng-trên-trắng. Kiểm CẢ 2 THEME.
7. Test lib/home cập nhật ngưỡng; tsc; KHÔNG đổi hành vi route/khoá cũ.

## ⑤ RÀNG BUỘC
Như phiếu v3 (không git/server/prisma/lib ngoài/stock; reduce-motion; không streak). Seed/minh-hoạ TUYỆT ĐỐI không được lên Home.

## ⑥ NGHIỆM THU TỰ LÀM
```
npx tsc --noEmit
for f in lib/home/*.test.ts; do node_modules/.bin/sucrase-node "$f"; done
grep -n "demo,minh-hoa\|minh-hoa" lib/home components/home -r | head
```

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-13-H1d-home-v4.md` — đối chiếu từng lỗi 1-6; khai layout nấc nào hiện với dữ liệu hiện tại của máy Hoà (dự kiến: MỎNG).

## ⑧ DÂY MÁY
Entry `home-dong-studio` (T sẽ mở lại `chua` chờ v4). Không tự sửa registry.
