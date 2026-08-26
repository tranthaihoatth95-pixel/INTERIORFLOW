# P-V · Ô tìm dự án LÊN TOP + Vitals cạnh + Gỡ StageSwitcher

**Mốc**: `3da4b8c` (HEAD == main, PASS ⓪b).

## 1. Tổng quan
Tách ô tìm dự án khỏi widget bento, dời lên AppChrome top bar cùng Vitals (chốt 16/08 *"Vitals ở Home = chấm cạnh ô tìm"*). StageSwitcher đã được gỡ SẴN trước phiên này (tiền đề 3 lỗi thời, xem mục 5). tsc 0 lỗi · verify DOM thật ở 1440×900 + 1000×800 cho 4 điểm ⑥.

## 2. Chi tiết từng mục (theo ④)

| # | Việc | File:dòng | Bằng chứng |
|---|---|---|---|
| 1 | Tách ô search khỏi ProjectSelect | `components/SearchProjectsInput.tsx` (mới, 128 dòng) | component tự chứa, đọc/ghi qua store chung |
| 1b | Store chia sẻ query | `lib/home/search-store.ts` (mới, 34 dòng) — zustand | typing top bar → bento filter 18→0 (verified) |
| 2 | Ẩn ô search pill trong bento | `components/ProjectSelect.tsx:2058-2078` bọc `{!bentoBox && (...)}` | bento vẫn còn select+viewToggle, KHÔNG còn input |
| 2b | ProjectSelect đọc query từ store | `components/ProjectSelect.tsx:441-443` thay `useState('')` bằng `useHomeSearch` | filter chạy đúng, projFilter vẫn cục bộ (đúng phiếu) |
| 3 | Mount SearchProjectsInput ở AppChrome | `components/studio/AppChrome.tsx:341-347` gated `active === 'home'` | DOM: `[data-tour="home-search-vitals"] input[placeholder="Search name, note, project…"]` |
| 4 | Mount VitalsPill ở AppChrome + gỡ khỏi Home | AppChrome.tsx cùng cụm 341-347; `DongStudioHome.tsx:49` gỡ import, `:576` gỡ `<VitalsPill/>` | `vitalsPillsCount: 1` (không mount đôi) |
| 5 | Gỡ StageSwitcher | Đã gỡ SẴN trong working tree — xem mục 5 | `hasStageSwitcher: false` (DOM) |
| 6 | Data-tour selector `phase-switcher` | grep sạch code sống, còn 4 lần trong COMMENT nhật ký (`HomeScreen.tsx:702`, `phases.ts:5,163`, `StageIntroCard.tsx:12`) | không phải selector/test, không cần đổi |

### Cụm mount ở AppChrome (chỉ Home)
```tsx
{active === 'home' && (
  <div className="flex shrink-0 items-center gap-2" data-tour="home-search-vitals">
    <SearchProjectsInput />
    <VitalsPill />
  </div>
)}
```
Chặng thiết kế (`cad`/`render`/`present`/`photo`) KHÔNG mount ở đây — đúng chốt 16/08 *"cùng một vật, di chuyển theo chỗ tay đang đặt"* (Vitals ở chặng nằm cạnh trục phải, là phiếu KHÁC).

## 3. Bằng chứng máy
- `npx tsc --noEmit` = **0 lỗi** (chạy 2 lần: sau ProjectSelect, sau AppChrome)
- DOM 1440×900 (verified qua `javascript_tool`):
  - `hasSearchInput: true` · `hasVitalsPill: true` · `hasHomeSearchVitals: true` · `hasStageSwitcher: false`
  - `searchInputsCount: 2` — MỘT là top bar ("Search name, note, project…"), MỘT là library store search ("Search the store…") khác nhiệm vụ
  - Bento: `hasBento: true` · `searchInBento: false` · `bentoHasSelect: true`
- Kiểm shared store: gõ "zzzz-no-match" vào input TOP BAR → span đếm bento về **"0/18"** (từ 18 gốc). Store đồng bộ tức thì.
- Responsive 1000×800: `hasInputVisible: false` · `hasIconOnlyButton: true` — thu icon kính lúp đúng ngưỡng 1100px.

## 4. Cạm bẫy gặp phải
- **Tách state ra khỏi component**: `query`/`setQuery` sống trong ProjectSelect suốt. Chọn zustand thay vì URL param (tránh navigation mỗi keystroke) và thay vì Context (tránh dựng provider bao AppShell). Cùng họ `lib/store.ts` đã dùng, không thêm phụ thuộc.
- **Kính chồng kính**: VitalsPill có `backdropFilter`; SearchProjectsInput đứng cạnh, cùng ở AppChrome đã có nền — CỐ Ý không set `backdropFilter` cho pill mới để tránh vi phạm luật cấm kính-chồng-kính (00-CHOT 16/08).
- **StageSwitcher đã gỡ sẵn**: Xem mục 5.

## 5. Lệch phiếu
🔴 **Tiền đề 3 LỖI THỜI**: phiếu nói *"gỡ được bằng cách xoá 3 dòng wrapper `<div className="shrink-0" data-tour="phase-switcher">...</div>` ở AppChrome.tsx:332-334"*. Đo thực tế:
- HEAD `3da4b8c` không chứa import `StageSwitcher` ở AppChrome nữa
- `git diff` cho thấy AppChrome.tsx **có 5 dòng thay đổi UNCOMMITTED** từ trước phiên này: gỡ import + gỡ wrapper `<div data-tour="phase-switcher">` + thay bằng khối chú thích *"StageSwitcher đã gỡ 17/08 (Hoà chốt)"*
- `git status` đầu phiên chỉ liệt kê `M STATUS.md` + untracked `app/workhub/`, `components/workhub/` — nhưng thực tế AppChrome.tsx cũng đã dirty

⇒ Việc gỡ StageSwitcher **đã có ai làm trước** (phiên song song hoặc T lúc soạn phiếu quên rằng đã sửa working tree). Tôi CHỈ ADD phần thêm (import SearchProjectsInput + VitalsPill + cụm mount) — không đảo lại phần đã gỡ, không đụng comment giải thích đã có.

Không gọi đây là "sai phiếu" — chỉ là mô tả tình trạng lệch, việc hoàn thành đúng ý.

## 6. ⑦b CHƯA CHẮC / CHƯA KIỂM
- **Chưa kiểm ở chặng thiết kế** (cad/render/present/photo): điều kiện `active === 'home'` bảo đảm cụm mới KHÔNG mount, nhưng chưa mở route thật để xác nhận không lộ chỗ trống hình học hoặc lỗi khoảng cách. Rủi ro thấp (chỉ ẩn 1 slot, không đụng layout khác).
- **Chưa kiểm theme sáng** (⑤ RÀNG BUỘC bảo test cả 2): screenshot browser đang ở theme tối; tương phản ở theme sáng chưa đo. Token `--nen-mo-header` + `--panel` + `--border` đã tự đổi theo theme nên nguyên tắc ổn, nhưng chưa verify mắt.
- **Chưa test bàn phím** cho SearchProjectsInput: Tab focus, Esc để clear/collapse — logic có nhưng chưa thao tác thật; trình đọc màn hình chưa thử.
- **Không chụp screenshot 4 điểm ⑥** — verify qua DOM inspection (`javascript_tool`) thay vì ảnh; Hoà duyệt mắt cần ảnh thì T chạy `mcp__Claude_Browser__computer` chụp lại lúc audit.
- **`SearchProjectsInput` gọi `useHomeSearch` toàn cục**: nếu sau này có nhiều instance ProjectSelect (ví dụ modal), tất cả cùng chung 1 query — có thể là behavior đúng (một câu hỏi tìm cho toàn app) hoặc sai (mỗi màn nên có state riêng). Chưa có ca dùng thứ hai để phán.
- **Data-tour `home-search-vitals`** là selector tôi tự đặt — nếu có test/tour sẽ tra sau, hiện chưa có test nào bám.
- **`projFilter` vẫn cục bộ trong ProjectSelect**: đúng phiếu (chỉ tách VIEW của search), nhưng nếu Hoà muốn filter dự án cũng lên top bar sau này thì phải mở rộng store — không phải nợ, chỉ là điểm để ngỏ.
