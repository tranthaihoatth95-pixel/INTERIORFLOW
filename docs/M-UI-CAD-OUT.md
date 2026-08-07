# M-UI-CAD-OUT — Sửa 5 lỗi design system (07/08)

Phạm vi: CHỈ `components/cad/RevitSummaryPanel.tsx` + `components/cad/CadToolbar.tsx` (đúng
ownership ticket). Không đụng file nào khác. `tsc --noEmit -p .` — 0 lỗi mới ở 2 file này (lỗi
tsc còn lại của repo nằm ở `lib/cad/render-layer-index.test.ts`, thuộc phiên khác, không liên
quan việc này).

## VIỆC 1+2 — cắt dấu tiếng Việt + chữ quá nhỏ (`RevitSummaryPanel.tsx`)

Sửa TẤT CẢ khai `fontSize` trong file, mỗi dòng đều ≥11.5px + `lineHeight` ≥1.5 tường minh:

| Dòng cũ | Trước | Sau |
|---|---|---|
| `RevitSummaryPanel.tsx:61` (tiêu đề "Cấu kiện BIM") | `10.5`, không khai line-height | `11.5`, `lineHeight:1.5` |
| `RevitSummaryPanel.tsx:63` ("Đã gán X/Y…") | `11.5`, không khai line-height | `11.5`, `lineHeight:1.5` |
| `RevitSummaryPanel.tsx:74` (hàng loại cấu kiện) | `11`, không khai | `11.5`, `lineHeight:1.5` |
| `RevitSummaryPanel.tsx:80` (dòng "Chọn đối tượng…") | `10.5`, không khai | `11.5`, `lineHeight:1.5` |
| `RevitSummaryPanel.tsx:82` (dòng chú thích cuối) | `10`, `lineHeight:1.4` | `11.5`, `lineHeight:1.5` |

Chụp màn N6 (server riêng phiên này, `127.0.0.1:3001`, không đụng cổng 3000/3002 đang chạy của
phiên khác) — mở `/projects/cms3350vn0001w9tu0vwby8y7/cad`, bấm mode "Nội thất":
- **Dark** (mặc định): panel "CẤU KIỆN BIM" đọc rõ, dấu tiếng Việt không bị cắt.
- **Light** (`window.__flowStore.getState().setThemePref('light')`): cùng panel, chữ vẫn rõ ràng.
Cả 2 ảnh đã xem trực tiếp trong phiên (không đính kèm file — theo N6 "chụp màn trình duyệt thật",
đã xác nhận bằng mắt qua `computer{action:"screenshot"}`, không phải suy diễn).

## VIỆC 3 — kính lỏng sai chỗ (`RevitSummaryPanel.tsx:30`)

`backdropFilter: 'blur(14px)'` đã BỎ HẲN — panel này KHÔNG nằm trong 4 chỗ G9 cho phép (toolbelt
canvas 3D · nút "Dựng ảnh" · ViewCube · thanh nổi trên ảnh render). Panel nay dùng nền đặc, không
blur.

**Đếm `backdropFilter:`/`backdrop-filter:` (property thật, không tính comment) TOÀN REPO sau khi
sửa:**
```
grep -rE "backdropFilter:|backdrop-filter:" --include="*.tsx" --include="*.ts" --include="*.css" . | wc -l
→ 60   (trước khi sửa: 61 — đúng 1 chỗ RevitSummaryPanel.tsx vừa gỡ)
```
60 chỗ còn lại nằm ngoài phạm vi 2 file sở hữu của ticket này — liệt kê ở mục VIỆC 7 dưới (phần
trong `components/cad/`), phần còn lại (`app/globals.css`, `components/entry/*`,
`components/present-editor/*`, `components/render-studio/*`, `components/library/*`,
`components/nodes/*`, `lib/motion.ts`, `lib/usePageVisible.ts`…) KHÔNG rà — không thuộc
`components/cad/` như brief giới hạn Việc 7.

## VIỆC 4 — nền chưa đủ đặc (`RevitSummaryPanel.tsx:29`)

`color-mix(in srgb, var(--panel) 92%, transparent)` → nâng lên **96%** (đúng mức `.vitals-pop`).
**Không đổi sang class `.vitals-pop` trực tiếp** — lý do: `.vitals-pop` VẪN mang
`backdrop-filter: blur(20px) saturate(180%)` (xem `app/globals.css:826`), mà VIỆC 3 yêu cầu rõ
"bỏ backdrop-filter, dùng nền đặc" cho đúng panel này (không thuộc 4 chỗ G9). Hai chỉ đạo xung khắc
nếu dùng thẳng class — chọn giữ style cục bộ (đã có sẵn, ít rủi ro hơn sửa shared class), chỉ nâng
opacity + bỏ blur, giữ đúng cấu trúc border/border-radius/padding cũ. Nếu Hoà muốn thống nhất về
đúng `.vitals-pop` (kể cả blur), cần chốt lại vì khác Việc 3.

## VIỆC 5 — `--t4` trượt tương phản (`RevitSummaryPanel.tsx:80,82`)

Đổi `var(--t4)` → `var(--t3)`. Đo bằng WCAG luminance formula thật (không đoán), qua
`getComputedStyle` trên trang chạy thật (`127.0.0.1:3001`, mode Nội thất):

| Theme | `--t3` / `--panel` | `--t4` / `--panel` (bug cũ, để đối chiếu) |
|---|---|---|
| Light | **4.90:1** ✅ (≥4.5 đạt) | 2.86:1 ❌ |
| Dark | **6.93:1** ✅ | 3.65:1 ❌ |

`--t4` xác nhận đúng là dưới ngưỡng ở cả 2 theme — khớp mô tả bug, đã sửa đúng chỗ.

## VIỆC 6 — dải mode "Sơ phác · Kỹ thuật · Nội thất" trôi nổi (`CadToolbar.tsx`, `ModeSwitch`)

**KHÔNG tự chọn, đề xuất 2 phương án, chờ Hoà chốt:**

**a) Gắn vào cụm chặng trên header, dưới nút "Thiết kế 2D"**
- Ưu: đúng cấu trúc phân cấp `docs/00-CHOT.md` "ĐỊNH NGHĨA BA CHẶNG" — chặng là cấp cha, mode là
  cấp con, gộp visual = gộp đúng ngữ nghĩa. Người dùng nhìn header một lần thấy hết "đang ở chặng
  nào, mode nào".
- Nhược: `CadToolbar.tsx` (sở hữu ticket này) KHÔNG chứa header/`StageSwitcher` — header nằm ở
  layer khác (`components/studio/StageSwitcher.tsx` theo STATUS.md). Việc này kéo theo sửa file
  ngoài 2 file được giao, cần ticket riêng.
- `ModeSwitch` hiện đang là 1 component độc lập trong `CadToolbar.tsx` (dòng 512-571) — tách ra
  làm prop nhận từ header là refactor có rủi ro, ảnh hưởng mọi chỗ dùng `CadToolbar`.

**b) Giữ vị trí hiện tại (trên toolbelt nổi giữa canvas), thêm nhãn nhóm cho biết thuộc chặng nào**
- Ưu: đúng đúng 2 file sở hữu, sửa gọn trong `CadToolbar.tsx` — thêm 1 `<GroupLabel>` kiểu
  "THIẾT KẾ 2D" phía trên/cạnh `ModeSwitch` (cùng pattern `GroupBlock` đã có ở file, dòng 500-507).
- Nhược: không giải quyết triệt để — nhãn "THIẾT KẾ 2D" lặp lại thông tin đã có trên header (dư
  thừa thị giác), và dải mode vẫn trông "trôi nổi" tách khỏi cụm chặng như Hoà mô tả, chỉ thêm chữ
  giải thích chứ không đổi cấu trúc.

Đề xuất cá nhân (KHÔNG tự quyết, chỉ nêu để Hoà cân nhắc): (a) đúng bản chất hơn nhưng cần ticket
mở rộng sang `StageSwitcher`/header — nên làm cùng lúc dọn luôn nhãn lỗi "Thiết kế 2D · Sơ phác"
gộp chặng+mode đã ghi ở `docs/00-CHOT.md` mục "🔴 LỖI NHÃN ĐANG CÓ" (dòng `G-M15-02`) — hai bug
cùng nguồn, sửa chung 1 lần đỡ phải động header 2 lần.

## VIỆC 7 — quét `components/cad/` tìm lỗi cùng họ (CHỈ LIỆT KÊ, KHÔNG SỬA — ngoài 2 file sở hữu)

Grep 3 lệnh trên toàn `components/cad/`, loại trừ 2 file đã sửa. Số lượng khớp lớn — đây LÀ bug hệ
thống, không phải cá biệt.

### fontSize < 11.5 (chữ Việt có dấu) — CHƯA SỬA
`AiBriefPanel.tsx` (≥14 chỗ, dòng 335·346·381·389·391·398·403·445·469·473·477·531) ·
`CadCanvas.tsx:3248` · `CamPathControlPanel.tsx:32,126` · `CamPathPanel.tsx:49` ·
`CadEditor.tsx` (≥25 chỗ, dòng 1431-2947, dày đặc nhất — file lớn nhất trong nhóm) ·
`HistoryPanel.tsx:60,85` · `PlanPresentPanel.tsx:84` · `SchedulePanel.tsx` (6 chỗ) ·
`MaterialPalette.tsx` (9 chỗ, một số xuống tới `9.5px`) · `ZonePanel.tsx` (10 chỗ).

### `color: var(--t4)` làm màu chữ (cần đo lại tương phản từng chỗ) — CHƯA SỬA
`AiBriefPanel.tsx` (6 chỗ) · `HistoryPanel.tsx` (2 chỗ) · `CadEditor.tsx` (≥18 chỗ) ·
`CamPathControlPanel.tsx` (2 chỗ) · `MaterialPalette.tsx` (4 chỗ) · `SchedulePanel.tsx` (7 chỗ) ·
`ZonePanel.tsx` (6 chỗ). Vì `--t4`/`--panel` đã đo ra <4.5:1 ở CẢ 2 theme (xem Việc 5), TOÀN BỘ
danh sách này nhiều khả năng cùng lỗi — cần rà từng chỗ vì có thể nằm trên nền khác `--panel`
(vd `--field`) nên số đo có thể khác.

### `backdropFilter` ngoài 4 chỗ G9 cho phép — CHƯA SỬA (chỉ liệt kê file, chưa xác nhận từng chỗ
có đúng vi phạm G9 hay không — có thể là panel hợp lệ dùng `.vitals-pop`, cần đọc từng dòng)
`AiBriefPanel.tsx` · `CadEditor.tsx` · `CamPathPanel.tsx` · `CadToolbelt.tsx` ·
`CamPathControlPanel.tsx` · `MaterialPalette.tsx` · `HistoryPanel.tsx` · `ZonePanel.tsx` ·
`SchedulePanel.tsx` · `PlanPresentPanel.tsx`.

### nền lớp nổi < 96% (`color-mix(... var(--panel) N%)`, N<96) — CHƯA SỬA
`AiBriefPanel.tsx:501` (92%) · `CadEditor.tsx:2917` (82%) · `CamPathControlPanel.tsx:23` (92%) ·
`CamPathPanel.tsx:44,57` (92%) · `HistoryPanel.tsx:97` (82%) · `PlanPresentPanel.tsx:75` (92%) ·
`SchedulePanel.tsx:211` (82%) · `MaterialPalette.tsx:208,226` (82%/92%) · `ZonePanel.tsx:24` (92%).

⛔ Không ghi vào `docs/GAP-IF.md` theo đúng §0u. Danh sách trên chỉ nằm ở đây, chờ chủ file từng
phiên (không phải phiên này) xử lý.

---

## VIỆC 8 (tin nhắn giữa phiên) — TABLET: XUNG ĐỘT PHẠM VI, CHƯA LÀM

Yêu cầu mới (`--tap-xl`, bút lực nhấn, cử chỉ hai ngón) đụng **`app/globals.css`** và
**`components/cad/CadCanvas.tsx`** — CẢ HAI đều ngoài 2 file sở hữu của ticket này
(`RevitSummaryPanel.tsx` + `CadToolbar.tsx`), và brief gốc ghi rõ:

> CẤM chạm mọi thứ khác — nhiều phiên đang chạy song song.
> ⚠️ p9 đang giữ `lib/cad` — CHỈ sửa 2 file `components/cad` nêu trên, không lan.

`CadCanvas.tsx` là engine 2D chính (theo `docs/00-CHOT.md` "chủ mảng `components/cad/*`: UI shell
= CHINH · engine (`CadCanvas`·`CadSheets`·tools) = PHU") — rất có khả năng đang bị 1 phiên khác
giữ cùng lúc, y hệt tình huống "hai phiên chung `.git`" đã xảy ra nhiều lần (`STATUS.md` "🔴 PHIÊN
SAU PHẢI BIẾT"). Sửa file này ngoài ticket có rủi ro đụng phiên khác đang chạy song song.

→ **KHÔNG làm VIỆC 8** trong phiên này. Cần Hoà xác nhận mở rộng phạm vi ticket (hoặc giao ticket
riêng đúng chủ 2 file kia) trước khi động `globals.css`/`CadCanvas.tsx`. Giữ nguyên khuyến nghị
`docs/mocks/Chế độ Phác thảo.dc.html` làm nguồn — chưa đọc file này trong phiên (ngoài phạm vi).
