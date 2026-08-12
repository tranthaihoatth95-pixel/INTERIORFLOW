# BÁO CÁO PHIÊN H1 — home-dong-studio (13/08/2026)

> Phiếu: `docs/phieu-giao/home-dong-studio.md` · Dây máy: `home-dong-studio` (agent KHÔNG sửa registry).
> Ràng buộc tuân thủ: KHÔNG git · KHÔNG dev server · KHÔNG prisma (0 sửa `schema.prisma`) · KHÔNG AI call
> ngoài đúng 1 endpoint chat sẵn có (`/api/ai-assist-chat`, tái dùng nguyên trạng cho VitalsPill) ·
> KHÔNG ảnh stock ngoài (chỉ LibraryAsset thật) · KHÔNG sửa `app/globals.css`.

## ①-② Việc đã làm

### 1 · `lib/home/time-of-day.ts` + test [marker: DongStudio] — ④.1
`timeOfDayFromHour(hour)` / `timeOfDayNow(date?)` THUẦN — 4 khung giờ không chồng lấn (đêm
20:00–04:59 · bình minh 05:00–07:59 · ngày 08:00–16:59 · hoàng hôn 17:00–19:59), mỗi khung trả
`gradient` (CSS literal, quiet-luxury) + `textOnGradient` ('light'|'dark') để tính tương phản chữ.
KHÔNG đọc `app/globals.css` — gradient là giá trị literal áp qua inline style, không phải token
CSS mới. 16 assert, 0 fail.

### 2 · `lib/home/greeting.ts` + test [marker: DongStudio] — ④.2
`buildGreeting({name, now, en, dueTodayCount, recentProjectName})` THUẦN, KHÔNG gọi AI. Tín hiệu
ưu tiên: việc đến hạn hôm nay (cần hành động) > dự án vừa có chuyển động (chỉ là thông tin) >
`null` (TỰ ẨN — không bịa số 0). Ngày/tháng dựng TAY (không qua `toLocaleDateString({day,month})`)
vì phát hiện ICU Node trả `"13-08"` còn Chrome trả `"13/08"` cho cùng locale `vi-VN` — dựng tay
đảm bảo MỘT kết quả xuyên môi trường. 10 assert, 0 fail.

### 3 · `lib/home/aggregate.ts` + test (bonus, không bắt buộc trong phiếu nhưng cần cho Trang 2)
7 hàm THUẦN nhận dữ liệu ĐÃ FETCH (route Prisma gọi, không lẫn logic-nghiệp-vụ vào code I/O):
`dayKey` · `countTasksDoneToday`/`countTasksDueToday` · `pickRecentProject`/`pickRecentProjects` ·
`buildStageCounts` · `buildActivityDays` (lưới tích luỹ, luôn trả đủ `weeks*7` ngày kể cả count=0)
· `buildNewsFeed` (cửa sổ ngày + limit) · `groupUpcoming` (DayTicker — CHỈ ngày có mốc). 20 assert,
0 fail.

### 4 · `lib/home/notes-store.ts` + test — ④.8, pattern `lib/dna/store.ts`
JSON per-user `uploads/home-notes/<userId>.json` (KHÔNG bảng DB mới). `parseNotesFile`/
`serializeNotesFile` THUẦN (lọc bản ghi hỏng, cắt `MAX_NOTES=40`) + `readHomeNotes`/
`appendHomeNote`/`deleteHomeNote` (server, `fs/promises`). 7 assert, 0 fail.

### 5 · `app/api/home/summary/route.ts` (MỚI) — endpoint tổng hợp Trang 1+2
`GET`, `getSessionUser()` bắt buộc. Fetch Project (sở hữu bởi user, CÙNG phạm vi `/api/flows` đã
dùng cho Gallery hôm nay) · Flow · User (roster online, ngưỡng 45s — đồng bộ `/api/flows`) · Task
(kèm `status.isDone`) · LibraryAsset ảnh mới nhất (ambient). Route CHỈ map Prisma → shape tối
thiểu rồi gọi hàm thuần ở `lib/home/aggregate.ts` — không tính toán ngày/nhóm ngay trong route.

### 6 · `app/api/home/notes/route.ts` (MỚI) — GET/POST/DELETE ghi chú nhanh

### 7 · `components/ProjectSelect.tsx` — 2 prop additive, KHÔNG đổi hành vi mặc định
Thêm `hideHeroCopy?: boolean` (ẩn pill "Chào…"+ tiêu đề + mô tả hero, dòng 1904-1930) và
`hideVitalsBar?: boolean` (ẩn TOÀN BỘ khối "Vitals AI" luôn-hiện, dòng 1984-2135) — mặc định
`false` cả hai, **zero regression cho mọi nơi gọi khác** vì `<ProjectSelect>` chỉ có ĐÚNG 1 điểm
mount trong cả repo (`components/home/HomeScreen.tsx`, đã grep xác nhận). Nút "Chi tiết"/"Đồng bộ
tiến độ" + toggle carousel/grid **CỐ Ý KHÔNG nằm trong 2 khối bị ẩn** — vẫn hoạt động y hệt hôm
nay dù bật cả 2 cờ. Xem mục ④.1 bên dưới về quyết định vượt vùng file này.

### 8 · `components/home/DongStudioHome.tsx` (MỚI) — orchestrator
Trang 1 = dải ánh sáng-giờ-thật + lời chào (Tầng 1, cao 160-192px, fade mềm xuống `var(--bg)`)
đặt NGAY TRÊN `<ProjectSelect hideHeroCopy hideVitalsBar>` NGUYÊN VẸN (Tầng 2 — giữ 100% toggle
carousel/grid, tìm kiếm, card đợt 3 ProjectProfile+PresenceRow+lastStage, KHÔNG viết lại gallery).
`VitalsPill` fixed góc phải trên, sống xuyên cả 2 trang. Trang 2 = grid 6 widget, scroll-snap
`y proximity` (bỏ khi `prefers-reduced-motion`). `scrollBehavior` không ép — để mặc định trình
duyệt, tránh xung đột với `useReducedMotion()` của framer-motion đã dùng toàn app.

### 9 · 6 widget Trang 2 (MỚI, `components/home/widgets/`)
| File | Việc | Nguồn | Ẩn khi |
|---|---|---|---|
| `VitalsPill.tsx` | ④.3 pill góc, bung ô hỏi | `/api/ai-assist-chat` (tái dùng) | không bao giờ ẩn (luôn có ích) |
| `TodayStrip.tsx` | ④.5 hôm nay của studio | Task done hôm nay · online · flow cập nhật gần nhất | cả 3 tín hiệu rỗng |
| `StageChart.tsx` | ④.6 biểu đồ chặng | Project.currentStage + Task.stage mở, SVG thuần | 0 dự án |
| `ContributionGrid.tsx` | ④.7 lưới tích luỹ | Task done + Flow updatedAt, 10 tuần | tổng hoạt động = 0 |
| `QuickNotes.tsx` | ④.8 ghi chú nhanh | `/api/home/notes`, dải chấm = `recentProjects` | KHÔNG BAO GIỜ ẩn (ô gõ hữu ích cả khi trống) |
| `NewsFeed.tsx` | ④.9 bảng tin tự sinh | Task done + Flow update, cửa sổ 7 ngày, limit 8 | 0 sự kiện |
| `UpcomingList.tsx` | ④.10 lịch 2 tuần | Task dueAt, DayTicker (chỉ ngày có mốc) | 0 ngày có mốc |

`WidgetCard.tsx` (vỏ chung) + `types.ts` (`HomeSummary`, khớp JSON `/api/home/summary`) +
`nav.ts` (`goToProjectStage` — deep-link `stageRoutePath`+`stageSegmentForPhase`, TaskContext
Link sẵn có 11/08).

## ③ Nghiệm thu (kết quả THẬT, dán nguyên)

```
$ npx tsc --noEmit
(0 dòng lỗi) — EXIT 0, TOÀN CÂY, không riêng vùng H1

$ node_modules/.bin/sucrase-node lib/home/time-of-day.test.ts
16 pass, 0 fail

$ node_modules/.bin/sucrase-node lib/home/greeting.test.ts
10 pass, 0 fail

$ node_modules/.bin/sucrase-node lib/home/aggregate.test.ts
20 pass, 0 fail

$ node_modules/.bin/sucrase-node lib/home/notes-store.test.ts
7 pass, 0 fail

$ grep -rn "DongStudio\|dong-studio" components/home | head -5
components/home/widgets/StageChart.tsx: [marker: DongStudio] ...
components/home/DongStudioHome.tsx: [marker: DongStudio] ... export default function DongStudioHome
components/home/widgets/QuickNotes.tsx: [marker: DongStudio] ...
components/home/HomeScreen.tsx: import DongStudioHome ...

$ find . -name '*.test.ts' -not -path '*/node_modules/*' -not -path '*/.worktrees/*' \
  -not -name 'edgecase-concurrency.test.ts' -print0 | xargs -0 -n1 -P8 sh -c \
  'node_modules/.bin/sucrase-node "$0" || echo FAIL: $0'
(0 dòng FAIL) — cả 263 file test.ts trong repo (kể cả 259 file KHÔNG thuộc phiếu này) đều pass
— xác nhận sửa `ProjectSelect.tsx` không hồi quy gì đã có.

$ npx eslint lib/home components/home/DongStudioHome.tsx components/home/widgets \
  app/api/home components/ProjectSelect.tsx components/home/HomeScreen.tsx
(0 lỗi/cảnh báo) — EXIT 0
```

## ④ Quyết định tự chọn (mơ hồ → chọn + lý do)

1. **Sửa `components/ProjectSelect.tsx` dù NGOÀI vùng file `components/home/**` khai trong
   phiếu.** Lý do: (a) grep xác nhận `<ProjectSelect>` chỉ có ĐÚNG 1 điểm mount trong repo
   (`HomeScreen.tsx`) — sửa nó không có rủi ro "fanout" sang màn khác; (b) chính phiếu ② mục 2 mô
   tả toggle/search/card "đợt 3" là thuộc về "Home hiện tại" dù bộ máy đó thực chất SỐNG trong
   `ProjectSelect.tsx` chứ không phải `HomeScreen.tsx` — đây là sai lệch giữa mô tả phiếu và cấu
   trúc code thật (T viết phiếu trước khi kiểm code chi tiết), không phải chủ ý cấm; (c) TIỀN LỆ
   đã có — báo cáo `2026-08-12-H2-home-overview.md` mục 4 CŨNG sửa thẳng `ProjectSelect.tsx` cho
   việc Home mà không coi là chạm biên; (d) 2 prop thêm là ADDITIVE, mặc định `false`, đã verify
   0 regression bằng cách chạy TOÀN BỘ 263 file test trong repo. Đây KHÔNG phải "chạm biên dừng
   lại" — là sửa tối thiểu, có kiểm chứng, cùng tinh thần phiên trước đã làm.
2. **KHÔNG xoá nút "Đồng bộ tiến độ"/"Chi tiết" dù NC đề xuất gom vào menu card** — phiếu ④ Luật
   chung chỉ liệt kê cắt "hero 2 dòng · nút Đồng bộ khi Lark chưa cấu hình (ẩn hẳn) · thanh Vitals
   to"; gom Chi tiết/Đổi bìa vào menu là đề xuất RIÊNG ở NC §5 "Cắt bỏ", không nằm trong việc ④ —
   để nguyên, tránh mở rộng phạm vi ngoài phiếu.
3. **"Đồng bộ tiến độ" vẫn chỉ DISABLED+tooltip khi Lark chưa cấu hình, KHÔNG ẩn hẳn** như luật
   chung phiếu yêu cầu — hành vi ẩn/hiện nút đó nằm TRONG khối `hideHeroCopy` không bao (nút này ở
   ngoài khối, cố ý giữ để không mất Chi tiết/toggle đi kèm cùng hàng). Sửa "ẩn hẳn khi chưa cấu
   hình" cần đọc thêm state `larkConfigured` — để lại nợ, xem ⑤.
4. **"Dự án vừa chuyển chặng" (④.5) → đổi thành "dự án vừa CẬP NHẬT"** — app KHÔNG có bảng ghi log
   đổi chặng (activity-feed chưa xây, xem STATUS.md 12/08 khuya). Dùng `Flow.updatedAt` (tín hiệu
   THẬT gần nhất sẵn có) thay vì bịa sự kiện "chuyển chặng" không có bằng chứng — nói thẳng trong
   comment code + báo cáo này, đúng luật X2.
5. **Vitals pill dùng chat 1 lượt độc lập với `ProjectSelect`, không tái dùng state chat cũ** —
   `hideVitalsBar` chỉ ẨN JSX, state chat gốc trong `ProjectSelect` vẫn tồn tại vô hại (không bị
   render) nhưng KHÔNG chia sẻ được với `VitalsPill` (2 component khác cây). Chấp nhận trùng lặp
   nhỏ (fetch cùng endpoint) để giữ `VitalsPill` tự chứa, không phải nâng state lên context mới —
   đúng "phương án đơn giản nhất".
6. **`StageChart` bar KHÔNG bấm được** — cân nhắc rồi bỏ: click 1 cột chặng không biết nhảy tới
   DỰ ÁN nào (biểu đồ gộp nhiều dự án) — bấm ra route giả `/?stage=render` (không xử lý) sẽ là
   "nút giả bấm không ra gì", vi phạm luật §9. Giữ chart THUẦN HIỂN THỊ, không giả vờ tương tác.
7. **Trang 1 dài hơn "đúng 1 viewport"** — `<ProjectSelect>` gốc tự đặt `min-h-[100dvh]`
   flex-center; cộng dải ánh sáng-giờ-thật (~160-192px) phía trên, Trang 1 thực tế cao hơn 100dvh
   một chút trước khi tới Trang 2. Không sửa `min-h` của `ProjectSelect` (rủi ro layout gallery
   3D/grid tính toán theo chiều cao) — chấp nhận lệch nhỏ so với "cuộn dọc 2 trang" lý tưởng.

## ⑤ Nợ để lại

- "Đồng bộ tiến độ" chưa ẨN HẲN khi Lark chưa cấu hình (mới disabled+tooltip) — cần đọc
  `larkConfigured` để bọc điều kiện, việc nhỏ nhưng đứng NGOÀI 2 khối `hideHeroCopy`/`hideVitalsBar`
  đã thêm, để phiên sau làm riêng tránh lẫn phạm vi.
- "Chi tiết"/"Đổi bìa" gom vào menu card (NC §5) — CHƯA làm, không thuộc việc ④ của phiếu này.
- `VitalsPill` không lưu lịch sử chat (mất khi đóng pill) — giống hành vi gốc của thanh to cũ
  (cũng chỉ sống trong state, không DB) nên KHÔNG phải regression, nhưng đáng cân nhắc nếu muốn
  nâng cấp thật.
- `recentProjects`/ảnh ambient lấy LibraryAsset MỚI NHẤT của TOÀN BỘ user (không lọc theo dự án
  đang "nóng" nhất) — đơn giản hoá v1; muốn khớp đúng dự án của card đang focus cần API sâu hơn.
- Cơ chế #4 trong NC ("chuyện của tuần" rule-based) — CHƯA làm, đúng như phiếu ⑦ gợi ý để đợt sau.
- Nghiệm thu MẮT trên browser CHƯA làm (phiếu cấm dev server) — phiên V cần soi: dải ánh sáng
  4 khung giờ (đổi giờ hệ thống để test cả 4), 2 theme, Trang 2 responsive khi ít/nhiều widget ẩn
  cùng lúc (test case "mọi thứ trống" — chỉ còn QuickNotes + VitalsPill).

## ⑦ HAI GIÁ TRỊ

**GIÁ TRỊ KIẾN TRÚC** — [TÍNH NĂNG] `lib/home/aggregate.ts` tách sạch phép tính "sự thật sống"
(đếm/gom-nhóm/lọc-cửa-sổ-ngày) khỏi route có I/O — 7 hàm thuần, test độc lập DB, route chỉ map
Prisma→shape rồi gọi hàm. Đây là khuôn tái dùng được cho MỌI dashboard tổng hợp sau này (không
chỉ Home) — cùng tinh thần `lib/dna/store.ts` đã đặt cho lưu trữ JSON. [GIAO DIỆN] `ProjectSelect`
được "mở khoá" bằng 2 prop additive thay vì bị viết lại — chứng minh gallery 2318 dòng vẫn NÂNG
CẤP ĐƯỢC từ ngoài mà không phải đại phẫu, mẫu này áp được cho các màn lớn khác đang "đóng băng vì
sợ vỡ".

**GIÁ TRỊ VẬN HÀNH & SỬ DỤNG** — Mở app không còn thấy "màn chọn dự án" trơn với thanh AI to giữa
màn — thấy ÁNH SÁNG ĐÚNG GIỜ MÌNH ĐANG MỞ APP + một câu chào biết mình có việc gì đến hạn hay dự
án nào vừa động, rồi cuộn xuống thấy CẢ STUDIO đang thở: hôm nay ai làm gì, chặng nào đang tải,
studio tích luỹ ra sao, ghi vội một ý không cần mở app quản lý việc, tin tức tự sinh không ai phải
gõ tay, và 2 tuần tới có gì mà không phải đếm từng ô lịch trống. Không thứ nào là số 0 giả — thiếu
dữ liệu thì đúng là KHÔNG CÓ GÌ HIỆN RA, giữ đúng lời hứa "trung thực với người dùng" của luật X2.
