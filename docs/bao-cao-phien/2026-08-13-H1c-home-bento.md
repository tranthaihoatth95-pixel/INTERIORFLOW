# BÁO CÁO PHIÊN H1c — Home BENTO v3 (13/08/2026)

> Phiếu: `docs/phieu-giao/home-bento-v3.md` · Dây máy: `home-dong-studio` (mở lại chờ v3, KHÔNG
> tự sửa registry — đúng ⑧). Chỉ đạo bổ sung giữa phiên (T gửi, dựa `docs/nc/NC-GU-BENTRAN-PINTEREST-2026-08-13.md`):
> Swiss/editorial + quả cầu vật liệu + sơ đồ kỹ thuật cho Đồng hồ ánh sáng — ĐÃ áp cả 3 mục bắt
> buộc (1-2-3), mục 4 (exploded axon 3 lớp) GHI NỢ như chỉ đạo cho phép. Ràng buộc: KHÔNG git ·
> KHÔNG dev server · KHÔNG prisma · KHÔNG lib animation/chart ngoài · KHÔNG sửa
> `app/globals.css`/`scripts/frontier-registry.mjs` · KHÔNG file ngoài vùng ③.

## ① Sơ đồ ô đã dựng vs sơ đồ phiếu

Lưới CSS Grid thật **12 cột × 3 hàng**, tính tay khớp đúng tỉ lệ ASCII của phiếu (xác minh cột
line-by-line ở cuối mục này):

```
┌────────────────────────────┬──────────────┬──────────────┐
│ A · DỰ ÁN (7c×2h)          │ B · CHÀO+ÁNH │ C · HÔM NAY  │
│ ProjectSelect bentoBox     │ SÁNG (3c×1h) │ (2c×1h)      │
│ hover→lớp kính dữ liệu     ├──────────────┴──────────────┤
│ Tab giữ→bung tất cả        │ D · ẢNH ĐẸP TUẦN NÀY (5c×1h)│
├──────────┬────────┬────────┼──────────────┬──────────────┤
│ E·BIỂU ĐỒ│F·GHI CHÚ│G·MỐC  │ H·VẬT LIỆU   │ I·BẢNG TIN / │
│ (3c×1h)  │(2c×1h) │(2c×1h) │TUẦN (3c×1h)  │LƯỚI (2c×1h)  │
└──────────┴────────┴────────┴──────────────┴──────────────┘
```

**Khớp đúng**: A=7c×2h, B+C=5c chung hàng 1 (3+2), D=5c×1h hàng 2 (đúng cột B+C), hàng 3 trái =
E+F+G chia 7c (đúng dưới A), hàng 3 phải = H+I chia 5c (đúng dưới D). File dựng:
`components/home/DongStudioHome.tsx` (hàm `area()` + biến `bArea/eArea/fAreaLeft/gArea/hArea/iArea`).

**Lệch có ghi lý do:**

1. **Phiếu không chia rõ B/C mỗi ô bao nhiêu cột** (chỉ ghi chung "5c×1h" cho cụm) — chọn **B=3c
   (8-10), C=2c (11-12)**: B (Đồng hồ ánh sáng, có SVG cung + nhãn) cần rộng hơn C (chỉ 1 số +
   vài avatar). Lý do đơn giản nhất, không có chỉ dẫn ngược lại.
2. **Carousel 3D ở ô A bị TẮT** (chỉ còn Grid + tìm kiếm) — carousel dùng
   `width: clamp(240px, 46vw, 460px)`, đơn vị `vw` GẮN VIEWPORT (46% *bề rộng màn hình*, không
   phải bề rộng ô). Nhét vào ô A (~700px trong lưới 12 cột) sẽ ra thẻ ~660px — vỡ hình, tràn ô,
   đè lên ô B/C/D. Sửa carousel sang đơn vị container (`cqw`/`%` container-relative) là việc kích
   thước khác hẳn phạm vi phiếu này (đổi cả POSES/pose offsets theo %, phải kiểm lại phím ←→/Home
   /End/wheel-swipe — ~300 dòng engine). Quyết định: thêm prop `bentoBox` ép `effectiveGrid=true`
   + ẨN nút toggle carousel/grid trong ô A (không hứa nút không chạy đúng, luật §9). Toàn bộ
   logic carousel GIỮ NGUYÊN VĂN trong code, chỉ không gọi tới khi `bentoBox`. Ghi nợ: sửa carousel
   sang đơn vị container nếu sau này cần bật lại 3D trong ô nhỏ.
3. **"Lưới tích luỹ studio" (ContributionGrid) không có ô riêng trong ASCII 9-ô của phiếu** —
   phiếu ④ mục giữ nguyên đã lường trước ca này: *"đủ dày thì thay chỗ ô I hoặc thêm hàng"*.
   Chọn **thay chỗ ô I** (không thêm hàng) vì thêm hàng phá thẳng ràng buộc "một màn 1440×900 fit
   không cuộn" ở ①. Quy tắc: `shouldShowActivityGrid(activityDays)` true → ô I hiện
   `ContributionGrid` thay `NewsFeed`; false → `NewsFeed` như thường. Dữ liệu test hiện tại
   (`/api/home/summary`) không đủ dày nên ô I đang hiện `NewsFeed`.

## ② Cử chỉ đã làm (đối chiếu việc ③ phiếu)

| Cử chỉ | Có làm? | Ở đâu |
|---|---|---|
| Hover card ô A: tilt ≤2° + lift 2px | **KHÔNG tilt**, CÓ lift+scale | Xem giải trình dưới |
| Hover card ô A → lớp kính dữ liệu trượt lên (chặng·việc mở·presence) | ✅ | `ProjectSelect.tsx` `renderProjectTile` |
| Giữ **Tab** → lớp dữ liệu bung TẤT CẢ card ô A | ✅ | `DongStudioHome.tsx` (`keydown`/`keyup`/`blur` window listener) + prop `revealAll` |
| Phím **1-9** nhảy 9 dự án đầu (không khi focus input) | ✅ | `ProjectSelect.tsx` (`useEffect` riêng, gate `bentoBox`) |
| Hover gradient KEM cho phần tử chọn được | ⚪ CHƯA — xem mục ⑤ | — |
| Ô B: cung mặt trời cập nhật mỗi phút | ✅ | `LightClock.tsx` + `minuteTick` (interval chung) |
| Ô C: avatar online chấm pulse | ✅ (dạng đồng hành, không đúng pixel từng avatar — xem mục ④) | `TodayStrip.tsx` |
| Ô C: số việc đến hạn "đếm lên" khi mount | ✅ dạng scale+opacity 200ms (không digit-tally — ràng buộc ⑤ chỉ cho transform/opacity) | `TodayStrip.tsx` |
| Ô D: crossfade ≤1 lần/8s | ✅ | `WeeklyImage.tsx` + `eightSecTick` |
| Ô E: cột mọc lên 1 lần khi mount (transform, không opacity) | ✅ | `StageChart.tsx` (`@keyframes stage-chart-grow`, `scaleY`) |
| Ô E: hover cột hiện số | ✅ | `StageChart.tsx` (`hoverPhase` state) |
| Ô F: kéo note thả vào card ô A | ✅ HTML5 DnD | `QuickNotes.tsx` (`draggable`) → `ProjectSelect.tsx` (`onDragOver`/`onDrop`) → PATCH `/api/home/notes` |
| Ô F: fallback click-chọn | ✅ | `armedNoteId`/`onArmNote`/`onNoteDrop` (state nâng lên `DongStudioHome`) |
| Ô G: hover ngày → tooltip tên việc | ✅ (tooltip `title` native, liệt kê MỌI việc kể cả phần "+N") | `UpcomingList.tsx` |
| Ô I: ticker dọc tự trượt chậm, pause khi hover | ✅ CSS `@keyframes` thuần (không JS interval riêng) | `NewsFeed.tsx` |
| `prefers-reduced-motion` = tức thì + tắt pulse/ticker/crossfade/tilt | ✅ | grep xác nhận ở ⑥ |

**Giải trình "tilt" bị bỏ:** `docs/SPEC-HOVER-FOCUS-IDF.md` dòng 38 ghi luật cứng *"Một hiệu ứng
một lúc. Không vừa scale vừa đổi màu vừa xoay."* Card ô A đã dùng `translateY(-2px) scale(1.02)`
(ĐÚNG bảng tra dòng 26 "Thẻ nội dung"). Thêm `rotateX/rotateY` vào cùng lúc là VI PHẠM trực tiếp
luật đó — mà phiếu ②.2 lại ghi rõ *"số scale/ms lấy từ bảng tra, không tự chế"*. Hai chỉ dẫn mâu
thuẫn nhau → ưu tiên luật cứng của spec thiết kế (SPEC-HOVER-FOCUS-IDF) hơn câu mô tả rời trong
ASCII của phiếu tính năng, vì spec là nguồn có bảng tra CÓ SỐ, còn "tilt ≤2°" là câu tự do không
kèm công thức. "Lớp kính dữ liệu trượt lên" (transform khác, phần tử khác — không cộng dồn lên
CÙNG MỘT phần tử đang scale) thay thế đúng vai "cử chỉ mới" mà không phá luật.

## ③ Widget tự ẩn trong dữ liệu hiện tại (đo lúc viết báo cáo — dữ liệu dev thay đổi theo phiên)

Không chạy được server để đo trực tiếp (đúng ràng buộc "KHÔNG dev server") — liệt kê ĐIỀU KIỆN ẩn
của từng ô, đối chiếu bằng đọc code + test thuần, KHÔNG đoán số liệu:

| Ô | Ẩn khi | Hàm quyết định |
|---|---|---|
| C · Hôm nay | `dueTodayCount=0` VÀ `tasksDoneToday=0` VÀ không ai online | `todayHasSignal()` (mới, export từ `TodayStrip.tsx`) |
| D · Ảnh tuần | `/api/library` không có asset nào `usage:'ref-render'` | `pickWeeklyImages()` rỗng |
| E · Biểu đồ chặng | 0 dự án | `stageChartHasSignal()` (mới, export từ `StageChart.tsx`) |
| G · Mốc sắp tới | Không Task nào có `dueAt` trong 14 ngày tới | `upcomingHasSignal()` (mới, export từ `UpcomingList.tsx`) |
| H · Vật liệu tuần | `/api/library` không có asset nào `usage:'material'` | `weeklyMaterial === null` |
| I · Bảng tin/Lưới | Không có tin VÀ lưới tích luỹ chưa đủ dày (`shouldShowActivityGrid`) | `newsHasSignal()` + `showActivityInI` |
| A, B, F | KHÔNG BAO GIỜ ẩn (luôn có "+Dự án mới"/lời chào/ô gõ) | — |

⚠️ **`/api/library` không trả `createdAt`** (route ngoài vùng ③, không được sửa) → ô D lọc theo
`usage='ref-render'` và GIỮ THỨ TỰ trả về (server đã `orderBy: createdAt desc`), KHÔNG lọc cứng
"trong 7 ngày lịch" như tên gọi "tuần này" gợi ý — nói thẳng trong comment `weekly-picks.ts` +
`WeeklyImage.tsx`, không bịa ngày giả.

## ④ Quyết định tự chọn khác (mơ hồ → đơn giản nhất, có lý do)

- **Ô C đổi số CHÍNH** từ "việc XONG hôm nay" (v2) sang "việc ĐẾN HẠN hôm nay" — khớp đúng chữ
  ASCII "HÔM NAY / việc đến hạn" + việc ④.2 "số việc đến hạn đếm lên". `tasksDoneToday` (v2) hạ
  xuống dòng phụ, KHÔNG bị xoá dữ liệu.
- **Chấm pulse online** không chèn vào TỪNG avatar của `PresenceRow` — file đó ngoài vùng ③. Thay
  bằng 1 chấm pulse ĐỒNG HÀNH cạnh nhãn "online" (cùng ý nghĩa "có người đang sống").
- **`openTasksByProject`** (số "việc mở" cho lớp kính ô A) — thêm field mới vào
  `/api/home/summary` (đường trong vùng ③), tính từ `tasks` đã fetch sẵn, 0 request mới.
- **Quả cầu vật liệu (ô H)** không có PBR thật trong `LibraryAsset` — đoán loại (wood/stone/…) từ
  `category`/`tags` bằng từ khoá VI/EN (`guessMaterialKind`, thuần, có test), mặc định `paint` khi
  không khớp. Tái dùng NGUYÊN VẸN `MaterialSphere`/`material-preview.ts`/`tintFor` (đã có sẵn cho
  kệ Thư viện) — đúng luật "một cỗ máy nhiều mặt tiền", không viết render riêng.
- **`--fs-2xl` không tồn tại** trong `app/globals.css` (chỉ có tới `--fs-xl` 28px) — số to ô C
  dùng `--fs-xl`, không tự chế token mới.

## ⑤ Ghi nợ (không kịp trong đợt này, GHI RÕ không giả bộ đã xong)

1. **Hover gradient KEM** (ref #15, entry `hover-gradient-kem`) — phiếu ⑧ ghi *"áp MỘT PHẦN, T
   ghi chú, không flip"*; đợt này ưu tiên 3 mục bắt buộc của chỉ đạo giữa phiên (Swiss/quả
   cầu/sơ đồ kỹ thuật) nên chưa thêm lớp `::before` radial kem lên các phần tử chọn được của
   bento. Công thức đã có sẵn ở `docs/mocks/mock-vitals-3-window-2026-08-12.html` (`.kcard::before`)
   — việc kế chỉ là áp `color-mix(in srgb, var(--accent-warm) …, var(--paper) …)` lên card/ô, tái
   dùng token thật đã tồn tại (`--accent-warm`, `--paper`).
2. **Biểu đồ chặng exploded-axon 3 lớp** (mục 4 chỉ đạo giữa phiên, coordinator cho phép ghi nợ) —
   `StageChart.tsx` vẫn là bar chart SVG, ĐÚNG SỐ LIỆU, chỉ chưa đổi hình thức kể chuyện.
3. **Tactile Huly Dial** — không có control dạng dial/segmented cần trong 9 ô này (carousel toggle
   đã ẩn ở ô A); áp phần "viền sáng mảnh khi active" ở 2 chỗ nhỏ: chip note đang "armed" (ô F,
   `outline + box-shadow accent-soft`) và card đang gắn note (viền `--accent`). Không dựng dial
   mới vì không có nơi tiêu thụ thật trong phạm vi 9 ô.

## ⑥ Nghiệm thu tự làm (kết quả THẬT)

```
$ npx tsc --noEmit
(0 dòng lỗi, exit 0)

$ for f in lib/home/*.test.ts; do node_modules/.bin/sucrase-node "$f"; done
aggregate.test.ts       27 pass, 0 fail
format-time.test.ts      9 pass, 0 fail
greeting.test.ts         9 pass, 0 fail
notes-store.test.ts      7 pass, 0 fail
time-of-day.test.ts     28 pass, 0 fail   (thêm sunPosition() + kelvin/lightLabel)
weekly-picks.test.ts    16 pass, 0 fail   (MỚI — isoWeekNumber/pickWeeklyItem/pickWeeklyImages/guessMaterialKind)
→ TỔNG 96 pass, 0 fail — v2 test giữ nguyên pass, thêm 25 assertion mới.

$ grep -n "prefers-reduced-motion\|useReducedMotion" components/home/DongStudioHome.tsx components/home/widgets/*.tsx
→ NewsFeed.tsx · TodayStrip.tsx · StageChart.tsx · WeeklyImage.tsx đều có (ticker/pulse/count-in/
  bar-grow/crossfade — đúng 5 chỗ animate liệt kê ở ràng buộc ⑤). ProjectSelect.tsx (ngoài phạm vi
  grep của lệnh phiếu vì không nằm trong components/home/**) đã tự kiểm riêng — dùng biến `reduce`
  có sẵn của file, áp cho translate/scale + lớp kính dữ liệu hover.

$ npx eslint <10 file đã sửa>
→ 0 lỗi, 0 cảnh báo (sau khi sửa 1 lỗi unused-var + thêm eslint-disable no-img-element theo đúng
  quy ước sẵn có của repo).
```

**KHÔNG mở được browser thật** (ràng buộc phiếu: KHÔNG dev server) — mọi kiểm chứng ở trên là máy
(tsc/test/lint) + đọc code tay theo `docs/CHUAN-DAU-RA-NGHE.md` tinh thần "nghiệm thu = mở file
đầu ra", nhưng KHÔNG áp dụng được ở đây vì Home không xuất file — cổng nghiệm thu MẮT (browser)
cần một phiên khác chạy `preview_start`/browser thật, đúng luật "T không tự mở dev server".

## ⑦ Khuôn 2 giá trị (HOP-DONG-PHOI-HOP-T §1c)

**① Kiến trúc app** [giao diện]: MỘT lưới CSS Grid tường minh 12×3 thay 2 route cuộn trang —
giảm 1 tầng điều hướng (`scrollSnapType`), tăng 1 lớp tính toán bố cục (6 biến `*Area`, bounded
cho đúng 9 ô, KHÔNG phải engine bento tổng quát — nợ kỹ thuật nếu sau này thêm ô thứ 10 phải viết
lại tay). [tính năng]: `ProjectSelect` học thêm 1 chế độ nhúng (`bentoBox`) tái dùng 100% logic
chọn/tạo/tìm dự án — không nhân đôi engine, đúng luật "một cỗ máy nhiều mặt tiền". `notes-store`
học thêm 1 hàm ghi (`setHomeNoteProject`) — vẫn 1 file JSON/user, không bảng DB mới.

**② Vận hành-sử dụng + giá trị IF** [giao diện]: Home hiện gói TRỌN thông tin quan trọng trong
MỘT màn nhìn thấy hết (không phải cuộn xuống mới biết có gì) — đúng tinh thần "workspace bàn theo
việc" (Phiếu 5 Ô). Gu Swiss/mono/hairline làm Home đọc như bảng điều khiển chuyên nghiệp thay vì
dashboard chung chung. [tính năng]: 3 widget MỚI (Đồng hồ ánh sáng, Ảnh đẹp tuần này, Vật liệu của
tuần) đều đọc DỮ LIỆU THẬT đã có sẵn trong hệ (thời gian hệ thống, kho `/api/library`) — không
phải trang trí, là cửa sổ nhìn vào những gì app đã biết mà trước đây không có mặt tiền nào hiện
ra. Kéo-thả ghi chú vào dự án là bước đầu của "Dây Việc–Ngữ Cảnh" (TaskContext Link) ở lớp NHẸ
nhất (ghi chú tự do, chưa phải Task) — không cần đợi engine neo-ngữ-cảnh lớn hơn để có giá trị
ngay hôm nay.

## ⑧ File đã sửa/thêm

**Thêm mới:** `components/home/widgets/LightClock.tsx` · `WeeklyImage.tsx` · `WeeklyMaterial.tsx` ·
`lib/home/weekly-picks.ts` + `.test.ts` · `docs/bao-cao-phien/2026-08-13-H1c-home-bento.md`.

**Sửa:** `components/home/DongStudioHome.tsx` (viết lại toàn bộ bố cục) · `components/ProjectSelect.tsx`
(`bentoBox`/`openTasksByProject`/`onNoteDrop`/`armedNoteId`/`revealAll` + hover data-layer + digit-key
+ drag/drop) · `components/home/widgets/{WidgetCard,TodayStrip,StageChart,QuickNotes,UpcomingList,NewsFeed}.tsx` ·
`lib/home/time-of-day.ts` (+test) · `lib/home/notes-store.ts` · `components/home/widgets/types.ts` ·
`app/api/home/summary/route.ts` · `app/api/home/notes/route.ts`.

**Không đụng:** `app/globals.css` · `prisma/schema.prisma` · `scripts/frontier-registry.mjs` ·
`components/ui/PresenceRow.tsx` · `app/api/library/route.ts` · `lib/library/thumb-kinds.ts` (chỉ
IMPORT/đọc, không sửa) · `app/page.tsx` (không cần đụng, đúng dự đoán của phiếu H1b trước).

## ⑨ Đề xuất 3 việc tiếp theo

1. Áp hover-gradient-kem (ref #15) lên toàn bộ phần tử chọn được trong bento — mục ⑤.1 ghi nợ,
   công thức đã có sẵn, chỉ còn thao tác lắp.
2. Cổng nghiệm thu MẮT thật (browser) cho toàn bộ 9 ô + 2 theme + <1100px — phiên này chỉ máy-kiểm
   được, cần phiên riêng bật preview.
3. Sửa carousel 3D (`ProjectSelect.tsx`) sang đơn vị container-relative để có thể bật lại trong ô A
   nhỏ nếu Hoà muốn giữ trải nghiệm 3D ở Home (hiện đã tắt an toàn, không xoá code).
