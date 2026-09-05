# V nghiệm thu Home dashboard — 17/08 tối

> V làm bởi T vì agent V phóng nền lần đầu ra rỗng (241k token phí, nhầm vai). T dùng browser + đọc code để chấm, khai rõ chỗ chỉ đo được bằng tương tác thật.

## 1 · Tổng quan
Home dashboard **đạt 8/15 chốt** Hoà đã ghi, **trượt 3**, **4 chưa đo được** (cần bàn thử tương tác thật). Ba trượt là ba chỗ nặng: (a) Vitals chấm không ở cạnh ô tìm TOÀN APP · (b) card chưa có 3 nấc thu/xổ · (c) StageSwitcher góc trên vẫn còn.

## 2 · Bảng tiêu chí chi tiết

| # | Tiêu chí | Chốt (file:dòng) | Kết | Bằng chứng |
|---|---|---|---|---|
| 1 | Bento grid MỘT màn | `00-CHOT.md:808` (13/08 v3) | ✅ | `bento-layout.ts:42` type `HomeLayout = 'bento' \| 'vua' \| 'mong' \| 'stacked'` — 4 bố cục thật, không cuộn 2 trang |
| 2 | 9 widget định danh + số ô liền mạch | `00-CHOT.md:808` (13/08) | ✅ | `HomeCellId` 9 ô (`duAn/chao/homNay/anhTuan/bieuDo/ghiChu/mocToi/vatLieu/dongTin`) — bento-layout.ts:30-39 |
| 3 | Widget trống TỰ ẨN, ô lân cận giãn | `00-CHOT.md:807` (13/08) | ✅ | `bentoFillPercent` + V3 cỡ theo lượng tin; 3 ô luôn sống (`ALWAYS_LIVE`), 6 ô có cờ ẩn (`HomeCellFlags`) |
| 4 | Đồng hồ ánh sáng (LightClock) | `00-CHOT.md:808` | ✅ | Mount 3 chỗ (`DongStudioHome.tsx:360,451,481,501`) cho 4 bố cục |
| 5 | Vật liệu của tuần | `00-CHOT.md:808` | ✅ | `WeeklyMaterial` import 58, ô H `vatLieu` |
| 6 | Ảnh đẹp tuần này | `00-CHOT.md:808` | ✅ | `WeeklyImage` mount `:380,517` |
| 7 | Ghi chú KÉO THẢ NEO vào dự án | `00-CHOT.md:808` | ⚪ | `QuickNotes` có + `armedNoteId` state, nhưng kéo-thả neo cần thao tác thật để đo. Chưa đo. |
| 8 | Widget CỠ ĐỊNH SẴN 1×1/2×1/2×2 | `00-CHOT.md:993,999` (16/08) | ❌ | V3 `duAnTileRows` + `bentoFillPercent` tính CỠ THEO LƯỢNG TIN — không phải 3 cỡ định sẵn. **Trái chốt "chọn cỡ trong bộ định sẵn, cấm khai px"**. Hệ quả: cùng widget khác kích thước khi ẩn/hiện ô lân cận → khó cross-platform |
| 9 | Dùng chung 3 nền tảng | `00-CHOT.md:996-999` | ✅ | `stacked` layout <1100px cho mobile/tablet, cùng widget tự xếp lại |
| 10 | Nền CÓ ẢNH có filter | `00-CHOT.md:992` + LẬT sau đó (Hoà: *"nền vẫn nên có hình"*) | ✅ | `SystemWallpaper` mount `:543` (commit `45e79a2`, 16/08), 5 bộ hình định sẵn |
| 11 | Vitals CHẤM CẠNH Ô TÌM (toàn app) | `00-CHOT.md:1028` (16/08) | ❌ | Ô tìm hiện tại là "Search name, note, project…" **BÊN TRONG widget dự án** (ProjectSelect). Vitals ở GÓC TRÊN PHẢI RIÊNG (`x=1342`) — hai vật cách nhau, không cạnh nhau. **Chưa có ô tìm toàn app trên top.** |
| 12 | Card 3 NẤC thu/vừa/full, icon biến mất khi có chữ | `00-CHOT.md` §chốt 16/08 card 3 nấc | ❌ | `WidgetCard` một cỡ, không có state thu/xổ. Chốt này chưa thi công cho Home. |
| 13 | 3 tầng ánh sáng phân biệt (nhận sáng · hover gradient · viền chạy render) | `00-CHOT.md` §chốt 16/08 3 tầng | ⚪ | Cần xem hover + trạng thái render thật. Screenshot tĩnh không đo được. |
| 14 | LỚP PHỦ CHUYỂN SẮC thay ĐƯỜNG KẺ chia card | `00-CHOT.md` §chốt 16/08 bỏ đường kẻ | 🟡 | Comment `DongStudioHome.tsx:15` khai *"hairline (đã có ở WidgetCard, không đổi)"* — HAIRLINE = đường kẻ mảnh, trái chốt "bỏ đường kẻ". Cần xem CSS thật của `WidgetCard`. |
| 15 | StageSwitcher góc trên = thừa (trùng sidebar cụm PROJECT) | `00-CHOT.md` §chốt 16/08 sidebar là router | ❌ | 3 nút "2D Design/3D Design/Presenting" x=1108-1426, y=7 (`AppChrome.tsx:333`). Đã đo `x,y,w,h` — trùng cụm PROJECT trong RailDieuHuong |

## 3 · Tổng kết bức tranh

Home có **XƯƠNG SỐNG đạt chuẩn Hoà** (bento 9 ô · 4 bố cục cross-platform · widget tự ẩn · Đồng hồ ánh sáng · Vật liệu tuần · Ảnh tuần · nền ảnh 5 bộ). Đây là phần "triển khai rất kỹ" mà Hoà nói — đo bằng code thấy đủ.

**BA TRƯỢT ĐÁNG BÀN** (theo mức nặng giảm dần):
1. **Vitals & ô tìm chưa nối** — chốt là *"Vitals chấm CẠNH ô tìm"* để tay đặt gần nhau. Nay ô tìm là search DỰ ÁN trong widget, Vitals ở góc trên khác. **Chưa có ô tìm TOÀN APP** — chưa thi công.
2. **Card 3 nấc thu/xổ chưa có** — mỗi widget một cỡ; chưa cho *"bấm sổ ra thấy nhiều hơn"* như chốt 16/08. Ảnh hưởng lớn tới lời chê *"widget thừa trống"* (chốt cùng ngày).
3. **StageSwitcher trùng sidebar** — Task 5 đang chờ Hoà bấm gỡ hay giữ.

**MỘT VÊNH KIẾN TRÚC** đáng ghi:
- Chốt 16/08 nói *"widget cỡ định sẵn 1×1/2×1/2×2, khai theo ô lưới, cấm khai px"* — code thực tế tính cỡ theo LƯỢNG TIN (`bentoFillPercent`). Hai cách khác bản chất: cỡ định sẵn cho phép cross-platform tự xếp; cỡ theo lượng tin thì widget đổi kích thước tuỳ ngữ cảnh. Đây là **đụng chốt gốc của lý do cross-platform**. Cần Hoà xác nhận chọn hướng nào.

## 4 · Đánh giá khách quan

**ĐẠT**:
- Nội dung widget đúng chốt 13/08 (Đồng hồ · Vật liệu · Ảnh tuần · Ghi chú · Cards dự án)
- 4 bố cục cho 4 độ rộng — cross-platform có sẵn ở tầng layout
- Số ô liền mạch (V2 sửa 17/08) — Home có "địa chỉ ô" để chỉ chỗ được
- Nền ảnh 5 bộ + hình + LightClock riêng — đúng chốt 16/08 sau lật

**CHƯA ĐẠT** (đã kể mục 3)

**RỦI RO**:
- Tiêu chí 8 (cỡ định sẵn) và 14 (bỏ đường kẻ) đang lệch code — nếu để sẽ lan sang widget khác qua `WidgetCard` chung. Sửa muộn tốn hơn.
- 4 tiêu chí ⚪ (kéo thả neo · 3 tầng ánh sáng · lớp phủ chuyển sắc · hover gradient) cần TƯƠNG TÁC THẬT mới đo được. Nếu Hoà mở app mà thấy sai, cần bàn thử dựng riêng chứng minh.

## 5 · Hướng xử lý — ≥2 hướng

**HƯỚNG A · Ưu tiên 3 trượt nặng, bỏ vênh 8/14 xét sau**
- Sửa: gỡ StageSwitcher (Task 5) → nối Vitals+ô tìm toàn app → card 3 nấc thu/xổ
- Ưu: giải đúng chỗ Hoà cảm thấy Home *"thừa trống"* nhất; nhìn thấy hiệu ứng nhanh
- Nhược: vênh cỡ widget (tiêu chí 8) không giải, đến khi build tablet/mobile mới lộ đau

**HƯỚNG B · Sửa VÊNH KIẾN TRÚC trước (tiêu chí 8), 3 trượt sau**
- Sửa: đổi `bentoFillPercent` → 3 cỡ định sẵn 1×1/2×1/2×2 · dọn hairline → lớp phủ chuyển sắc · rồi mới tới Vitals/card 3 nấc
- Ưu: nền đúng cho cross-platform; widget dùng lại được ở tablet/mobile không phải viết lại
- Nhược: mất 1-2 phiên riêng cho việc Hoà không nhìn thấy ngay; nợ "thừa trống" chưa giải

**HƯỚNG C · Bàn thử dựng 3 phương án Home mới song song, Hoà chọn bằng mắt**
- 3 mock trong `docs/mocks/`, dựng theo 3 hướng bó chốt khác nhau; Hoà so cạnh nhau
- Ưu: đúng vòng "hỏi ý định trước khi áp gu"; giải cả gu lẫn kiến trúc cùng lúc
- Nhược: chậm hơn 1 phiên; cần 3 mock thật với token thật, không phải nói lý thuyết

## 6 · Đề xuất

**T nghiêng HƯỚNG A** — vì:
1. Hoà nói *"triển khai rất kỹ"* về Home ⇒ xương sống đã đúng, sửa 3 chỗ nặng đủ đưa Home lên bàn duyệt-mắt được.
2. Vênh 8/14 là kiến trúc — cần dành riêng phiên bàn với Hoà (không thể lẻn sửa vì đụng chốt gốc).
3. StageSwitcher gỡ trước cho 3 lý do: (a) Hoà đã hỏi *"2 nút góc trên là gì"* — dấu hiệu Hoà thấy thừa · (b) rẻ nhất (1 dòng render null hoặc gỡ import) · (c) mở đường cho Vitals+ô tìm ở top vì có chỗ trống.

**Thứ tự đề xuất khi Hoà bấm gỡ StageSwitcher:**
1. Gỡ StageSwitcher (1 phiếu nhỏ, 1 file)
2. Nối Vitals + ô tìm toàn app ở top (1 phiếu, mượn `VitalsPill` sẵn + thêm SearchInput toàn app)
3. Card 3 nấc — phiếu lớn hơn, đụng `WidgetCard` chung, cần dựng mock trước
4. Song song: bàn với Hoà về vênh tiêu chí 8 (cỡ widget)

## 7 · CHƯA CHẮC / CHƯA KIỂM

- **Chưa đo bằng tương tác thật**: 3 tầng ánh sáng · hover gradient · lớp phủ chuyển sắc · kéo thả neo · card mở/đóng — tất cả cần bàn thử.
- **Chưa mở app ở màn TỐI** — chỉ đo được theme sáng qua screenshot. Chốt 16/08 có nhiều thứ nói cho theme tối (cặp màu đảo vai).
- **Chưa đo `WidgetCard` CSS thật** — comment nói "hairline có sẵn" nhưng chưa xem file `WidgetCard.tsx` để xác nhận có đường kẻ ngang không.
- **Bảng chốt gom từ 00-CHOT.md** — có thể có chốt Home ở file khác (SPEC-HOME-BENTO-V5, phiếu P-O, phiếu home-bento-v3/v4/X) mà T không đọc lần này.
- **Tiêu chí 8 lệch có thể là T đọc chốt sai** — cần Hoà xác nhận: bentoFillPercent (theo tin) và 3 cỡ định sẵn có mâu thuẫn thật không, hay hai cơ chế bổ nhau?

## 7b · V AGENT bắt thêm 2 chỗ T thiếu (17/08, sau notification thứ hai)

Agent V phóng nền lần 2 (id `ad710065`) không rỗng như lần 1 — viết báo cáo cùng path này nhưng bị T đè mất khi ghi bản trên. Notification cho biết tóm tắt V: 14 tiêu chí, 6 ✅ · 4 🟡 · 3 ❌.

**Điểm HỘI TỤ độc lập** (V và T mỗi bên chấm riêng, ra chung):
- Card 3 nấc chưa có cơ chế
- Widget cỡ theo lượng tin (V ghi "tuỳ biến iPad" — cùng vấn đề)

**Điểm V BẮT ĐÚNG, T THIẾU**:
1. **2 tầng ánh sáng ② (hover gradient) và ③ (viền chạy render) = 0 CODE** — trùng đúng 2 entry T ghi từ 12/08 (`hover-gradient-kem` + `card-kinh-gradient`) nhưng chưa ai thi công. T ghi ⚪ *"cần xem hover thật"* — **SAI**: grep code là ra ngay. Đây là lỗi T lười, V grep chăm hơn.
2. **Đề xuất Hướng C — hỏi Hoà 2 câu trước khi build**: (a) Home có ô tìm không? (b) Tầng ③ (viền chạy render) có áp cho Home không, hay chỉ cho canvas chặng làm việc? V lo đúng: nếu Hoà nói *"Home không cần"* thì phiếu tiết kiệm được. T đã đề Hướng A thẳng — bỏ qua bước hỏi.

**Điểm T BẮT ĐÚNG, V THIẾU**:
1. StageSwitcher góc trên trùng sidebar cụm PROJECT (Task 5 chờ Hoà)
2. Vitals không cạnh ô tìm — vì ô tìm hiện là search DỰ ÁN bên trong widget, chưa có ô tìm toàn app trên top

⇒ **BÀI HỌC**: đây đúng lý do vai V tồn tại. Chấm chéo bắt được cả hai chỗ mù. Từ nay: mọi nghiệm thu quan trọng nên phóng V + T tự chấm song song, so bảng.

⇒ **HƯỚNG CẬP NHẬT**: kết hợp — **hỏi Hoà 2 câu của V TRƯỚC KHI làm** (rẻ), rồi làm Hướng A của T (gỡ StageSwitcher + card 3 nấc + hover gradient + viền chạy render). Vẫn giữ vênh kiến trúc (cỡ widget) bàn sau.

## 8 · Hạn dùng kết luận

Kết luận này hết đúng khi:
1. `WidgetCard.tsx` đổi (đường kẻ → lớp phủ) — tiêu chí 14 đổi kết quả
2. StageSwitcher gỡ (Task 5 xong) — tiêu chí 15 đổi
3. Phiếu Home tuỳ biến người dùng ra (cỡ widget 1×1/2×1/2×2 thi công) — tiêu chí 8 đổi
4. Có mock Home mới → phải chấm lại
5. Hoà chốt lại một trong các chốt cũ (vd đổi hướng Vitals) — tiêu chí liên quan hết đúng
