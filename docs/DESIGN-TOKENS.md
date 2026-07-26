# DESIGN-TOKENS — audit hệ token UI chrome hiện có

> Báo cáo THUẦN AUDIT: chỉ mô tả/tổ chức lại những gì đang có thật trong code, không đề xuất
> gu thẩm mỹ mới. Không sửa `app/globals.css` hay bất kỳ component nào — chỉ tạo file này.

## 0. Phạm vi & phương pháp

**Trong phạm vi:** `app/globals.css` (nguồn token thật) + mọi `components/**/*.tsx` +
`app/**/*.tsx` (trừ `app/api/**`, không có JSX đáng kể) — tức UI CHROME của chính app
InteriorFlow (nền, panel, chữ, viền, nút, khoảng cách, bo góc, bóng đổ).

**Loại khỏi phạm vi**, kèm lý do (grep xác nhận từng trường hợp trước khi loại):

| Loại trừ | Lý do |
|---|---|
| `lib/cad/materials.ts`, `lib/cad/furniture.ts`, `ZONE_GROUP_META` trong `lib/cad/model.ts` | Màu LÀ dữ liệu (vật liệu/đồ nội thất/nhóm zone), theo đúng đề bài. |
| `knowledge/ttt-design-system/`, `knowledge/ttt-brand/` | Tài liệu TTT dùng khi làm báo cáo CHO TTT — theo LUẬT NỀN TẢNG (`CLAUDE.md`), KHÔNG phải hệ token của sản phẩm. |
| `components/avatar/AvatarRenderer.tsx` (75 hex) | Renderer SVG avatar "búp bê" — mỗi `fill`/`stroke` là khối màu da/tóc/áo lấy từ `lib/avatar.ts` (`BASE_TONES`/`HAIR_COLORS`/`SHIRT_COLORS`) + toán bóng đổ nội bộ. Cùng loại với `materials.ts`: màu LÀ nội dung minh hoạ, không phải chrome. |
| `components/intro/svgs/index.tsx` (31 hex) | Bộ SVG minh hoạ trang trí (không phải panel/nút/field tái dùng). |
| `app/demo-resort/page.tsx` (52 hex), `app/library/ingest/page.tsx` (63 hex) | Route dev-only/nội bộ, tự dựng bảng màu "terminal" riêng cho NỘI DUNG demo sinh ra (`SlideTheme`, `RANK_META`) — đọc đầu file xác nhận: `demo-resort` tự gắn cờ `NEXT_PUBLIC_DEMO`; `library/ingest` là công cụ nạp tham khảo nội bộ. Không phải chrome dùng chung. |
| `components/IntroSequence.tsx`, `components/LoginScreen.tsx` (2 file gốc, KHÔNG nằm trong `components/entry/`/`components/intro/`) | **Code chết** — verify bằng `grep` import: không route/component nào còn import 2 file này (bản sống là `components/intro/IntroSequence.tsx` và `components/entry/LoginScreen.tsx`). Vẫn tính là nợ kỹ thuật (xoá được), không tính vào audit token vì không chạy. |

Sau khi loại, còn **142 file `.tsx`** là "UI chrome đang sống" — đây là phạm vi thật của audit dưới đây.

**Phương pháp**: mọi số liệu lấy bằng `grep -rn`/`grep -c` thật (không ước lượng), lệnh gốc giữ
trong từng mục để verify lại được. `find` liệt kê 142 file scope tại
`/private/tmp/claude-501/.../scratchpad` không được commit — chỉ dùng nội bộ khi audit.

---

## 1. Quét & đếm

### 1.1 Màu — hex/rgba nằm ngoài `var(--...)`

```
grep -ohE '#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b' <142 file> | sort | uniq -c | sort -rn
```
→ **126 mã hex khác nhau, 386 lần dùng** (chưa gộp biến thể hoa/thường, vd `#c79a63` và `#C79A63`
đang bị đếm riêng dù cùng một màu). Cộng thêm rgba() "có màu" (loại các rgba(0,0,0,*)/rgba(255,255,255,*)
gần chắc chắn là bóng đổ/overlay, đã tính ở mục 1.4) → thêm **~65 giá trị rgba khác nhau** không
trùng token nào. **Tổng ước tính ~190 màu chrome khác nhau đang sống trong code.**

Top 15 theo số lần dùng:

| Mã | Lần dùng | File chính | Ghi chú |
|---|---|---|---|
| `#fff` | 74 | rải khắp | text/on-accent, xem 2.1 |
| `#c79a63` | 34 | `components/entry/*`, `components/intro/*`, `ProjectSelect.tsx`, `StageSelect.tsx` | "accent" RIÊNG của luồng login/intro — KHÁC `--accent` (#8b7cf7) |
| `#F06020` | 20 | `components/avatar/AvatarBuilder.tsx`, `app/settings/avatar/page.tsx` | ⚠️ trùng CAM TTT hệ số — xem 3.3 |
| `#F1ECE3` | 15 | như trên | ⚠️ trùng BEIGE TTT hệ số |
| `#8a6f4d` | 15 | `components/entry/cardFaces.tsx` | text-muted riêng của thẻ intro |
| `#ffffff` | 8 | rải rác | trùng nghĩa với `#fff` |
| `#1B1512` | 7 | avatar builder + entry | |
| `#000` | 7 | rải rác | phần lớn trong `rgba(0,0,0,X)` bóng đổ, xem 1.4 |
| `#d4a15a` | 6 | CAD/entry | cảnh báo màu vàng |
| `#FAF7F1` | 6 | avatar builder + settings | ⚠️ trùng CREAM TTT hệ số |
| `#002850` | 6 | avatar builder + settings | ⚠️ trùng NAVY TTT hệ số |
| `#d9cfc2` | 5 | entry | |
| `#b39776` | 5 | entry/cardFaces | |
| `#1c1a17` | 5 | entry | |
| `#1c1409` | 5 | entry | gần trùng `--t1` theme sáng (`#211e19`) |

Đối chiếu mức dùng **token đã có** (đếm `var(--...)` trong cùng 142 file, không tính CSS nội bộ):

| Token | Số lần dùng qua `var()` |
|---|---|
| `--border` | 472 |
| `--accent` | 408 |
| `--t4` | 308 |
| `--t3` | 240 |
| `--t1` | 195 |
| `--t2` | 192 |
| `--field` | 156 |
| `--hover` | 96 |
| `--panel` | 62 |
| `--bg` | 51 |
| `--t5` | 51 |
| `--card` | 42 |
| `--border-strong` | 22 |

→ **Hệ token màu ĐANG được dùng rất nhiều** (tổng >2200 lần qua `var()`) — không phải bỏ hoang.
Vấn đề không phải "không ai dùng token", mà là **~190 màu one-off vẫn tồn tại song song**, tập
trung vào vài cụm cụ thể (mục 2).

Tailwind bảng màu mặc định (không phải arbitrary hex, cũng không phải token) — `bg-red-500`,
`text-emerald-400`, `bg-white`, v.v. — **211 lần dùng, ~30 giá trị khác nhau**, chủ yếu là **màu
trạng thái** (đỏ=lỗi, hổ phách/cam=cảnh báo, lục=thành công, tím/xanh dương=phụ trợ):

| Cụm | Lần dùng (tổng các shade) |
|---|---|
| `red-*` (lỗi) | 18+9+5+5+1+1 = 39 |
| `amber-*`/`orange-*` (cảnh báo) | 8+7+6+6+2+1+1+1+1+1 = 34 |
| `emerald-*` (thành công) | 6+6+5+3+1+1+1 = 23 |
| `violet-*`, `sky-*` (phụ) | 4+3+3+1+1+1+1 = 14 |
| `text-white`/`bg-white`/`bg-black`/`border-white` | 71+6+10+3+1 = 91 |

**Không có token `--danger`/`--warning`/`--success` nào được ĐỊNH NGHĨA trong `app/globals.css`.**
2 nơi duy nhất tham chiếu `var(--danger, ...)` (`components/present-editor/Inspector.tsx:518`,
`components/cad/CadEditor.tsx:635`) dùng **2 giá trị fallback khác nhau** (`#B4462A` vs `#c0604a`)
cho cùng một biến chưa từng được khai báo — token "ma".

### 1.2 Cỡ chữ / độ đậm / họ chữ

**Cỡ chữ** — **KHÔNG có token cỡ chữ nào trong `app/globals.css`** (không `--text-*`/`--font-size-*`).

| Nguồn | Lệnh đếm | Kết quả |
|---|---|---|
| Tailwind scale mặc định (`text-xs`…) | `grep -oE '\btext-(xs\|sm\|base\|lg\|xl\|2xl...)\b'` | 88 `text-xs` · 48 `text-sm` · 2 `text-2xl` · 1 `text-base` = **139** |
| Tailwind arbitrary `text-[Npx]` | `grep -oE '\btext-\[[0-9.]+px\]'` | **324 lần, 21 giá trị khác nhau** — đỉnh: `11px`×104, `10px`×74, `12px`×32, `13px`×30, `9px`×23, `14px`×11, `9.5px`×6, `15px`×6, còn lại 1-3 lần (`7,8,10.5,11.5,12.5,16,17,19,22,26,30,34,36,48px`) |
| Inline `fontSize: N` | `grep -oE 'fontSize\s*:\s*[0-9.]+'` | **504 lần, 22 giá trị khác nhau** — đỉnh: `11`×95, `12`×90, `10.5`×71, `11.5`×56, `10`×49, `13`×47, `12.5`×36, `14`×14, `9.5`×11, `15`×8 — có cả nửa-px (`9.5/10.5/11.5/12.5/13.5/8.5`) cho thấy copy-paste trôi dạt, không phải quyết định thiết kế |

→ **~967 khai báo cỡ chữ, 0% qua token** (vì token không tồn tại). Đây là hạng mục lệch nặng
nhất trong toàn bộ audit — xem chẩn đoán mục 4.

**Độ đậm** — hành vi TỐT hơn nhiều, đã tụ về gần đúng "2 độ đậm":

| Nguồn | Kết quả |
|---|---|
| Tailwind class | `font-medium`×70 · `font-semibold`×68 · `font-bold`×5 |
| Inline `fontWeight:` | `600`×65 · `500`×13 · `700`×6 · `650`×5 · `400`×3 |

→ Thực chất chỉ 2 mức đang dùng thật (medium/500-ish và semibold/600-ish), cộng vài trường hợp
lẻ tẻ 650/700/400. `fontWeight: 650` (5 lần, không phải giá trị CSS chuẩn 100-900 bội 100 — dù
CSS cho phép số lẻ) là ứng viên gộp vào 600 hoặc 700 rõ ràng nhất.

**Họ chữ** — token thật: `--font-sans` = Be Vietnam Pro (`app/layout.tsx:14`, dùng làm
`body { font-family: var(--font-sans), ... }` trong `globals.css:107`). Class `font-sans` chỉ
dùng **7 lần** trong 142 file.

⚠️ **Phát hiện chính**: 6 file sống tự khai **hằng số cục bộ** `SANS`/`MONO`/`DISPLAY` với
CÙNG MỘT chuỗi font-stack (`-apple-system,"SF Pro Display","SF Pro Text","Helvetica Neue",
"Space Grotesk",system-ui,sans-serif` / `"SF Mono","SFMono-Regular",ui-monospace,Menlo,monospace`)
— **hoàn toàn KHÁC** `--font-sans` (Be Vietnam Pro) của phần còn lại của app:

```
grep -n "^const SANS\|^const MONO\|^const DISPLAY" components/**/*.tsx
```
→ `components/ProjectSelect.tsx`, `components/StageSelect.tsx`, `components/entry/LoginScreen.tsx`,
`components/entry/LoginForm.tsx`, `components/entry/cardFaces.tsx`, `components/studio/VitalsGesture.tsx`
— **64 lần dùng sống** (`fontFamily: SANS/MONO/DISPLAY`), tập trung 44 lần riêng trong
`ProjectSelect.tsx`. Toàn bộ luồng chọn dự án/chọn chặng/đăng nhập đang chạy **một hệ chữ song
song, không đăng ký làm token**, trong khi thân app dùng Be Vietnam Pro.

### 1.3 Bo góc

Token thật: `--radius-sm/md/lg/xl` = **10/14/20/28px** (`app/globals.css:22-26`).

| Nguồn | Kết quả |
|---|---|
| `var(--radius-*)` (đúng token) qua Tailwind `rounded-[var(--radius-x)]` | 24 lần |
| `var(--radius-*)` qua inline `borderRadius: 'var(--radius-x)'` | 5 lần |
| **Tổng dùng token** | **29 lần** |
| Tailwind scale MẶC ĐỊNH riêng của Tailwind (`rounded`=4px, `rounded-md`=6px, `rounded-lg`=8px, `rounded-xl`=12px, `rounded-2xl`=16px, `rounded-sm`=2px) — chạy SONG SONG, không liên quan gì đến thang 10/14/20/28 | `rounded`×222 · `rounded-md`×44 · `rounded-lg`×18 · `rounded-xl`×4 · `rounded-sm`×3 · `rounded-2xl`×2 · lẻ tẻ ×7 = **300** |
| Tailwind arbitrary `rounded-[Npx]` | 72(`10px`) · 21(`14px`) · 17(`12px`) · 16(`8px`) · 10(`16px`) · 9(`9px`) · 4(`7px`,`20px`) · 2(`6px`) · lẻ tẻ(`3,4,5,22,24px`) = **162, 14 giá trị khác nhau** |
| Inline `borderRadius: N` (literal, loại `999`) | 95(`8`)·50(`6`)·30(`10`)·25(`7`)·16(`2`)·14(`3`)·13(`5`,`12`)·10(`4`)·9(`9`)·6(`14`)·3(`20`)·3(`11`)·2(`16`) = **276, 13 giá trị khác nhau** |
| `rounded-full`/`borderRadius: 999` (bo tròn — bucket "tròn" riêng, KHÔNG tính lỗi) | 114 + 23 = **137** |

→ **~738 khai báo bo góc KHÔNG qua token** (300+162+276) so với **29 lần qua token** — tỉ lệ tuân
thủ ~4%, THẤP NHẤT trong mọi hạng mục có token đã định nghĩa sẵn. `--radius-xl` (28px) — mức DUY
NHẤT trong 4 mức có tỉ lệ dùng khá (13/29, chủ yếu trong `ProjectSelect.tsx`/`LoginScreen.tsx`/
`StageSelect.tsx` cho khung thẻ lớn) — các mức còn lại gần như không ai gọi bằng tên token.

### 1.4 Bóng đổ (box-shadow)

Token thật: `--shadow-sheet`/`--shadow-pop`/`--shadow-node` (`app/globals.css:64-66`,`92-94`).

```
grep -n "var(--shadow-sheet)\|var(--shadow-pop)\|var(--shadow-node)" <142 file>
```
→ **6 lần dùng token TỔNG CỘNG**, nhưng **3 trong 6 nằm ở 2 file CHẾT** (`components/IntroSequence.tsx`,
`components/LoginScreen.tsx` gốc — mục 0). **Dùng SỐNG chỉ ~3 lần**
(`components/present/PresentViewer.tsx:177`, `components/entry/StackedCards.tsx:71`, và 1 nữa).
`--shadow-node` — **0 lần dùng ở bất cứ đâu ngoài chính định nghĩa của nó** — token định nghĩa
rồi bỏ hoang hoàn toàn (cho cả 2 theme).

Ngược lại, `boxShadow` viết tay không qua token:

| Nguồn | Kết quả |
|---|---|
| Inline `boxShadow: 'rgba(...)'` không dùng `var(--shadow`) | **56 lần**, hầu hết dạng `0 Npx Mpx rgba(0,0,0,X)`, tụ thành 3 tầng: nhẹ (2-8px blur, alpha .05-.3 — bong bóng chat, dropdown nhỏ), vừa (20-30px blur, alpha .18-.3 — palette/menu/panel nổi), nặng (40-80px blur, alpha .3-.8 — modal/intro/editor canvas) |
| Tailwind `shadow`/`shadow-sm`/`shadow-lg`/`shadow-xl`/`shadow-2xl` (thang mặc định Tailwind, không liên quan `--shadow-*`) | `shadow`×26 · `shadow-sm`×12 · `shadow-2xl`×9 · `shadow-xl`×7 · `shadow-lg`×3 = **57** |

→ **113 lần bypass vs ~3 lần dùng token sống** — tỉ lệ tuân thủ **<3%**, hạng mục tệ nhất tính
theo tỉ lệ (dù radius tệ hơn về số tuyệt đối). Giá trị literal `0 8px 30px rgba(0,0,0,.18)` lặp
lại y hệt ở 3 file khác nhau (`ShapePalette.tsx`, `cad/HistoryPanel.tsx`, `cad/SchedulePanel.tsx`)
— gần khớp với `--shadow-pop` bản dark hiện tại.

### 1.5 Khoảng cách (padding/margin/gap)

```
grep -oE '\b(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|space-[xy])-\[[0-9.]+(px|rem|em|%)\]'
```
→ **0 kết quả.** Không có một giá trị Tailwind spacing arbitrary (`p-[13px]` kiểu) nào trong toàn
bộ phạm vi — **hạng mục tuân thủ TỐT NHẤT**. Toàn bộ 1159 lần dùng utility spacing đều nằm trên
thang mặc định 4px/2px-bước của Tailwind (`gap-1.5`×102, `gap-2`×76, `py-1.5`×66, `px-2`×62,
`py-2`×61, `px-2.5`×57, `px-4`×51, `px-3`×46...).

Inline style `padding`/`gap` (trong các component nặng inline style — CAD, present-editor,
`CommentLayer.tsx`, intro) fragment hơn nhiều: `gap: 6`×117, `gap: 4`×58, `gap: 8`×39,
`gap: 10`×24, `gap: 5`×21, `gap: 12`×19 — và các giá trị lẻ phá nhịp-4 như `gap: 5/7/9/18` xuất
hiện rải rác (~362 khai báo `padding:` inline tổng cộng, nhiều giá trị lẻ px). Đây là fragment
thật nhưng KHÔNG lan rộng bằng font-size/radius/shadow — tập trung đúng vào các file style-nặng
đã nêu, không phải lỗi hệ thống.

---

## 2. Hợp nhất — cụm màu nên gộp

Chỉ liệt các cụm ≥3 lần dùng (đề bài) hoặc rõ ràng là bản sao của token có sẵn. Không đề xuất
token cho: minh hoạ avatar/SVG trang trí (đã loại ở mục 0), sắc thái vật liệu (ngoài phạm vi).

| Cụm màu hiện có | Vai trò thật | Gộp vào |
|---|---|---|
| `#f4efe6`(7)·`#efe9df`(3)·`#f6f2ea`(2)·`#F1ECE3`(15, xem 3.3)·`#FAF7F1`(6, xem 3.3) | Nền/panel ấm sáng — **gần trùng byte** với `--bg` theme sáng (`#f2efe9`) và `--panel` theme sáng (`#faf8f4`) đã có sẵn | `var(--bg)` / `var(--panel)` — đang bị phát minh lại bằng hex mới thay vì tham chiếu token light-theme sẵn có |
| `#211e19`(3, TRÙNG BYTE với `--t1` theme sáng)·`#1c1409`(5)·`#1B1512`(7)·`#141210`(3)·`#221f1a`(4)·`#1a1a1a`(2) | Chữ chính/nền tối ấm | `var(--t1)` — hoặc nếu cụm entry/login muốn giữ tông ấm riêng, đặt tên rõ ràng `--entry-ink` thay vì hex rời rạc |
| `#8a6f4d`(15)·`#6f5b40`(4)·`#4b3c28`(3)·`#b39776`(5) | Chữ phụ/nhãn trên thẻ intro (nâu vàng ấm) | `var(--t3)`/`var(--t4)` nếu chấp nhận theo hệ chính, hoặc token mới `--entry-text-muted` nếu cụm intro là "da" riêng có chủ đích |
| `#c79a63`(34)·`#C79A63`(2, trùng chữ hoa)·`#d4a15a`(6)·`#c08a5a`(2)·`#a87b45`·`#a98d67`·`#e0a83a`(2) + `rgba(199,154,99,*)` (10+ chỗ, đã dùng làm nền động `.if-dyn-*` trong `globals.css`) | "Accent" vàng ấm CHỈ của luồng login/intro/chọn dự án — KHÁC hẳn `--accent` (#8b7cf7 tím) mà phần còn lại của app dùng 408 lần | Đặt tên rõ vai trò: **`--entry-accent`** (không lẫn với `--accent` của app chính) — không nên âm thầm gộp vào `--accent` vì đổi tông sẽ đổi cả nhận diện màn hình vào cửa |
| `#8b7cf7`(3, TRÙNG BYTE `--accent`) + `rgba(139,124,247,*)`(~8 chỗ, TRÙNG rgb của `--accent`) | Bản sao thủ công của accent chính | `var(--accent)` / `var(--accent-ring)` / `var(--accent-soft)` — đang tự tính lại rgb thay vì tham chiếu |
| `#fff`(74)·`#ffffff`(8)·`bg-white`(6)·`text-white`(71)·`border-white`(3) | Chữ/icon TRẮNG CỐ ĐỊNH trên nền media/ảnh/gradient tối hoặc trên nút `--accent` đặc — hợp lệ vì không đổi theo theme | Nếu là "chữ trên nút accent": nên đặt tên `--text-on-accent: #fff`. Nếu là "chữ trên ảnh/video nền" (login backdrop, intro, canvas overlay): giữ nguyên literal — đây là trường hợp loại trừ hợp lý (không nên ép qua `--t1` vì `--t1` đổi theo theme, chữ trên ảnh thì không) |
| `#000`(7)·`#000000`(4)·`bg-black`(10) | Scrim/nền media cố định tối | Tương tự trên — giữ literal nếu là overlay ảnh/video, không phải panel |
| **Đỏ**: `#ef4444`·`#e5674f`·`#B4443A`·`#c0392b`·`#e5806b`·`#e14a3a`·`#c0604a` + Tailwind `red-*`(39 lần) | Trạng thái LỖI | `--state-error` (chưa tồn tại) |
| **Cam/hổ phách**: `#f59e0b`·`#fbbf24`·`#f97316`·`#d4a15a` + Tailwind `amber-*`/`orange-*`(34 lần) | Trạng thái CẢNH BÁO | `--state-warning` (chưa tồn tại) |
| **Lục**: `#22c55e`·`#22a06b`·`#38d66b`·`#3D7A57`·`#4a9c6d` + Tailwind `emerald-*`(23 lần) | Trạng thái THÀNH CÔNG | `--state-success` (chưa tồn tại) |
| `var(--danger, #B4462A)` / `var(--danger, #c0604a)` (2 chỗ, 2 fallback khác nhau cho biến CHƯA khai báo) | Lỗi cục bộ CAD/Inspector | Khai báo thật `--danger`/`--state-error` trong `:root`, xoá fallback kép |

⚠️ **Không phải vấn đề token — vấn đề chính sách thương hiệu** (ghi nhận vì grep tự phát hiện,
không phải mục tiêu chính của audit này): `#F06020`(20 lần)/`#002850`(6 lần)/`#F1ECE3`(15 lần)/
`#FAF7F1`(6 lần) trong `components/avatar/AvatarBuilder.tsx` + `app/settings/avatar/page.tsx`
là **trùng byte-chính-xác** với cam/navy/beige/cream TTT (`knowledge/ttt-brand/`). Theo LUẬT NỀN
TẢNG của `CLAUDE.md` ("TUYỆT ĐỐI KHÔNG nhúng cứng thương hiệu TTT... vào sản phẩm"), đây là
hardcode ngoài phạm vi Brand Kit dự án. Không sửa trong task này (report-only), chỉ ghi nhận.

---

## 3. Bảng ánh xạ token theo vai trò

Đối chiếu vào tên đã có trong `app/globals.css` — KHÔNG bịa hệ tên song song.

| Vai trò | Token đã có | Tuân thủ | Bypass chính |
|---|---|---|---|
| Nền trang | `--bg` | 51 lần qua `var()` | `#F1ECE3`/`#FAF7F1`/`#f4efe6` (near-dup, mục 2) |
| Nền panel | `--panel` | 62 lần | tương tự trên |
| Nền card | `--card` | 42 lần | — |
| Nền field/input | `--field` | 156 lần | — (tốt) |
| Nền hover | `--hover` | 96 lần | — (tốt) |
| Viền nhạt | `--border` | 472 lần | ít bypass, hạng mục màu TỐT NHẤT |
| Viền đậm | `--border-strong` | 22 lần | — |
| Chữ chính | `--t1` | 195 lần | `#211e19`(trùng), `#1c1409`, `#1B1512` (cụm entry, mục 2) |
| Chữ phụ 1 | `--t2` | 192 lần | — |
| Chữ phụ (muted) | `--t3` | 240 lần | `#8a6f4d` cụm entry |
| Chữ mờ | `--t4` | 308 lần | — |
| Chữ rất mờ | `--t5` | 51 lần | — |
| Nhấn (accent) | `--accent`/`--accent-strong`/`--accent-soft`/`--accent-ring` | 408 lần | `#c79a63` — KHÔNG phải bypass của `--accent`, mà là accent THỨ HAI chưa có tên (cụm entry/login, mục 2) |
| Bo góc | `--radius-sm/md/lg/xl` (10/14/20/28) | 29 lần | 738 lần không qua token (thang Tailwind mặc định 4/6/8/12/16 chạy song song + hex rời rạc) |
| Bóng đổ | `--shadow-sheet/pop/node` | ~3 lần SỐNG (+3 lần trong code chết) | 113 lần; `--shadow-node` chết hoàn toàn (0 nơi dùng) |
| Cỡ chữ | **KHÔNG có token** | 0% | 967 khai báo rải rác 30+ giá trị |
| Độ đậm | **KHÔNG có token**, nhưng hội tụ tự nhiên | ~2 mức thật (500-ish/600-ish) | `fontWeight:650`(5) lệch nhịp |
| Họ chữ | `--font-sans` (Be Vietnam Pro) | 7 lần qua class `font-sans` | 64 lần `SANS`/`MONO`/`DISPLAY` cục bộ = hệ chữ song song (SF Pro/Space Grotesk/SF Mono) trong toàn bộ luồng login/chọn dự án/chọn chặng |
| Trạng thái lỗi/cảnh báo/thành công | **KHÔNG có token** (`var(--danger,...)` tham chiếu biến chưa khai báo, 2 fallback khác nhau) | 0% | ~91 lần Tailwind state-color + ~15 hex rời |
| Khoảng cách | Không có token riêng, dùng thang Tailwind mặc định | Rất tốt (0 arbitrary bypass qua class) | Chỉ lệch ở inline style (362 khai báo, có giá trị lẻ) |

---

## 4. Chẩn đoán cuối

**Số màu chrome khác nhau đang sống**: **~126 mã hex + ~65 rgba màu ≈ 190 giá trị**, so với mục
tiêu 9 màu của dự án (1 nền · 1 panel · 1 chữ chính · 1 chữ phụ · 1 nhấn · 1 viền · 3 trạng thái)
→ **gấp ~21 lần**. Nhóm cần gộp cụ thể (đã liệt chi tiết ở mục 2):

1. Nền/panel ấm sáng (`#F1ECE3`/`#FAF7F1`/`#f4efe6`/`#efe9df`/`#f6f2ea`) → `var(--bg)`/`var(--panel)`
2. Chữ chính tối ấm (`#211e19`/`#1c1409`/`#1B1512`/`#141210`/`#221f1a`) → `var(--t1)`
3. Chữ phụ nâu vàng (`#8a6f4d`/`#6f5b40`/`#4b3c28`/`#b39776`) → `var(--t3)`/`var(--t4)`
4. "Accent" vàng ấm cụm entry (`#c79a63` + biến thể + `rgba(199,154,99,*)`) → token MỚI `--entry-accent` (không trộn với `--accent` tím của app chính — đây là 2 nhận diện khác nhau, cần chủ dự án xác nhận có chủ đích hay không)
5. Bản sao tay của accent chính (`#8b7cf7`, `rgba(139,124,247,*)`) → `var(--accent)`/`var(--accent-ring)`
6. Cụm trạng thái đỏ/cam/lục (Tailwind `red-*`/`amber-*`/`emerald-*` + hex tương ứng) → `--state-error`/`--state-warning`/`--state-success` (3 token hoàn toàn chưa tồn tại)
7. Trắng/đen cố định trên media (`#fff`/`text-white`/`#000`/`bg-black`) → giữ nguyên có chủ đích (không đổi theo theme), đặt tên `--text-on-accent`/`--text-on-media` nếu muốn chính thức hoá thay vì literal rời rạc

**Hạng mục lệch nhất: CỠ CHỮ (font-size).** Lý do xếp trên cả bo góc/bóng đổ dù bo góc có tỉ lệ
tuân thủ thấp hơn (4% vs áng chừng tương đương): font-size là hạng mục DUY NHẤT không có bất kỳ
token nào tồn tại để đối chiếu (radius/shadow ít nhất có token, chỉ là bị lơ), với số lần khai
báo cao nhất trong toàn bộ audit (~967, cao hơn hẳn radius ~738 và màu ~190) và độ phân mảnh sâu
nhất (30+ giá trị riêng biệt, kể cả bước nửa-px 9.5/10.5/11.5/12.5/13.5 cho thấy trôi dạt copy-
paste chứ không phải chủ đích thiết kế).

**Xếp hạng lệch (tệ → khá)**: cỡ chữ (0% có token) > bo góc (~4%) > bóng đổ (<3% nhưng số tuyệt
đối thấp hơn) > màu (token tồn tại và ĐƯỢC dùng nhiều — vấn đề là ~190 one-off cộng thêm, không
phải token bị bỏ quên) > độ đậm (hội tụ tự nhiên về ~2 mức) > khoảng cách (tốt nhất — 0 bypass
qua class Tailwind).

### Đối chiếu bảng mục tiêu

| Nhóm | Mục tiêu | Thực tế hiện có |
|---|---|---|
| Màu | 9 | ~190 (gấp 21×); token tồn tại + được dùng mạnh (>2200 lần qua `var()`), nhưng cụm entry/login chạy accent + nền + chữ RIÊNG hoàn toàn song song |
| Chữ | 1 font · 5 cỡ (12·14·16·20·28) · 2 độ đậm | 2 họ chữ sống song song (Be Vietnam Pro chính thức vs SF Pro/Space Grotesk/SF Mono cục bộ, 64 lần) · ~30 cỡ chữ khác nhau, không token nào · độ đậm đã tự hội tụ đúng ~2 mức |
| Khoảng cách | 4·8·12·16·24·32·48 | Qua Tailwind class: đúng thang, 0 giá trị lẻ — ĐẠT. Qua inline style: lệch nhịp ở phần nhỏ file dùng style nặng |
| Bo góc | 8·16·24·tròn | 4 mức token khai báo (10·14·20·28) nhưng chỉ 29/767 lần dùng gọi đúng tên; phần còn lại dùng thang Tailwind riêng (4·6·8·12·16) hoặc số tự do (2-24px, gần như mọi số nguyên) — "tròn"/pill (137 lần) là bucket DUY NHẤT khớp mục tiêu |
| Bóng | 1 nhẹ · 1 nổi · 1 kính | 3 token khai báo đúng tinh thần (`--shadow-sheet`=nổi/sheet, `--shadow-pop`=popover, `--shadow-node`=canvas) nhưng dùng sống ~3 lần; `--shadow-node` chết hoàn toàn; 113 lần bypass tụ tự nhiên thành đúng 3 tầng nhẹ/vừa/nặng — nghĩa là 3-tier ĐÃ tồn tại trong thực tế dùng, chỉ chưa được đặt tên/tham chiếu lại |

---

## 5. Xác nhận phạm vi thực hiện

- Chỉ tạo `docs/DESIGN-TOKENS.md` (file này). Không sửa `app/globals.css`, không sửa bất kỳ
  component nào.
- Không chạy `git add`/`git commit`.
