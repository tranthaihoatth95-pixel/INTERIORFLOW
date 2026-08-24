# Chữ Việt trên giao diện — LỖI NGHĨA, không phải lỗi thẩm mỹ

> ⚠️ **Vừa bị phạm 23/08**: 6 nhãn HOA TOÀN PHẦN trên Trang chủ, trong khi luật cấm đã có từ
> **31/07**. Và cùng ngày, một lỗi nền nặng hơn lộ ra: **bộ chữ không phủ đủ tiếng Việt.**

## 1 · CÂU HỎI MODULE NÀY TRẢ LỜI
- Vì sao chữ hoa toàn phần bị cấm, chứ không phải "nên tránh"?
- Chọn font cho IF thì kiểm gì trước tiên?
- `leading-tight` / `tracking-tight` có dùng được không?
- Chữ số CAD và chữ giao diện khác nhau chỗ nào?

## 2 · LUẬT DÙNG ĐƯỢC NGAY

**V-0 · TẠI SAO LÀ LUẬT.** Tiếng Việt là chữ Latinh **hai tầng dấu**: dấu phụ tạo chữ cái
(`ă â ê ô ơ ư đ`) + dấu thanh chồng lên trên. Dấu thanh **mang nghĩa** —
`ma · má · mà · mả · mã · mạ` là **sáu từ khác nhau**.
⇒ Mọi thao tác **ép chiều cao · ép bề ngang · cắt phần trên** đều có thể **xoá nghĩa**.

**V-1 · CẤM `text-transform: uppercase` trên chuỗi CÓ DẤU.** Chữ hoa cao hơn ⇒ hết chỗ đặt dấu
thanh ⇒ `Ế Ề Ễ` dính nhau hoặc bị cắt cụt.
✅ Cho phép: chuỗi kỹ thuật **không dấu** — `PDF` `DXF` `A3` `CAD` `BIM` `IFC` `XLSX` `mm` `m²`.
Muốn nhấn thì **đậm hơn một nấc** hoặc **nền nhạt**, không dùng chữ hoa.

**V-2 · CẤM `line-height < 1.5` trên chữ Việt.** Dòng dưới đội lên chạm dấu dòng trên.
⛔ `leading-none` (1) · `leading-tight` (1.25) · `leading-snug` (1.375).
✅ Sàn `leading-normal` (1.5); chữ ≤ 13px nên **1.6**. Ngưỡng 1.5 lấy từ **WCAG 1.4.12 Text Spacing**.

**V-3 · CẤM `letter-spacing` ÂM trên chữ Việt.** Dấu chồng làm hộp bao quang học rộng hơn thân
glyph; kéo âm ⇒ dấu chữ này đè thân chữ kia (`ườ` `ẫu` `ợi` hỏng trước tiên).
⛔ `tracking-tight` (−0.025em) · `tracking-tighter` (−0.05em). ✅ Sàn là **0**.
V-2 lo chiều dọc, V-3 lo chiều ngang — **sửa một mà bỏ mục kia thì vẫn hỏng**.

**V-4 · BỘ CHỮ PHẢI PHỦ ĐỦ TIẾNG VIỆT — KIỂM BẰNG BẢNG MÃ, KHÔNG BẰNG MẮT.** ⭐ Ràng buộc mới 23/08.
- Font thiếu khối Unicode **Latin Extended Additional U+1EA0–U+1EF9** ⇒ trình duyệt nhảy font
  **giữa một từ**, chữ có dấu **khác nét** chữ không dấu.
- **Mono** ép mọi glyph vào một bề rộng ⇒ `ư` `ơ` (đã có râu) và dấu thanh bị nén phẳng.
- Chuỗi thử bắt buộc: **`Chữ Việt: ườ ẫu ợi Ế Ề Ễ Ổ Ự Ỳ`** — phải render **một font**, không nhảy nét.
- ✅ `font-mono` chỉ cho chuỗi **không dấu**: toạ độ, mã lệnh, đường dẫn, mã màu, JSON/log.

**V-5 · CẤM Ô CHỮ CẮT PHẦN TRÊN.** Dấu thanh nằm **trên đường ascender**; ô có chiều cao cứng +
`overflow-hidden` **cắt đúng dấu**, mà chữ vẫn đọc được nên **không ai phát hiện** — lỗi im lặng
đúng nghĩa. ✅ Ô cao theo nội dung (`py-*`, không `h-*`); buộc `h-*` thì
**`h ≥ font-size × 1.5 + padding`**.

**V-6 · CỠ SÀN.** Chữ có dấu **≥ 12px**, khuyến nghị **13px**. Dưới 12px không phân biệt được
hỏi ↔ ngã. (Settings body 12.5px là sát sàn.)

**V-7 · CHỮ KỸ THUẬT ↔ CHỮ CHẠY — cấm để mật độ CAD rò sang chữ giao diện.**
| | **CHỮ KỸ THUẬT** | **CHỮ CHẠY** |
|---|---|---|
| Ví dụ | `2400 × 750 mm` · `36.7 m²` · `Ø25` · `±0.000` · `A3` · `1:50` | `Chiều cao 750 mm` · `Phòng khách 36.7 m²` · mọi câu |
| Đặc điểm | không dấu, một dòng, đứng trong ô số liệu | có dấu, có từ, người đọc |
| Được phép | mono · `tabular-nums` · line-height chặt · nén ngang để vừa cột | **không cái nào ở trên** |
| Luật áp | V-1…V-6 **không áp** (vì không dấu) | V-1…V-6 **áp đủ** |
Ranh giới thực dụng: **có dấu tiếng Việt hoặc có từ ⇒ là chữ chạy.**

**V-8 · KHÔNG TRỘN VI/EN TUỲ HỨNG.** Lệnh hình học nghề quốc tế giữ tiếng Anh (`Mirror` `Array`
`Offset` `Fillet` `Extrude` `Boolean`) — dân 3ds Max/SketchUp đọc là hiểu, và IF bán global.
Cách hiện: **tên Anh dòng chính + dòng nhỏ giải nghĩa tiếng Việt**. Tên chặng · điều hướng ·
trạng thái · câu giải thích thì theo ngôn ngữ giao diện. Cấm dịch máy nguyên văn.

## 3 · VÌ SAO — cơ chế con người
Người Việt đọc **hình dạng cả từ**, và dấu thanh là một phần của hình dạng đó. Khi dấu bị cắt, bị
đè, hoặc bị vá bằng một font khác, người đọc không "thấy xấu" — họ **đọc chậm lại** và đôi khi
**đọc sai từ**. Đó là lý do luật này phải cưỡng chế bằng máy, không phải "lưu ý khi review":
người vẽ (thường quen mắt) sẽ không phát hiện, còn người đọc thì không biết diễn đạt là sai ở đâu.

Nguồn: `vietnamesetypography.com` (Donny Trương) · Google Fonts *Diacritics guide* ·
W3C **WCAG 1.4.12**.

## 4 · CA HỎNG THẬT CỦA IF

### ⭐ 23/08 · Geist không đánh vần được tiếng Việt — `app/layout.tsx:11-22`
Hoà gửi ảnh màn thật: **"Thiêt kê 2D" · "gân nhât" · "Quyêt định"** — mất sạch dấu chồng.
Đo tại nguồn bằng `fontTools` (đọc `cmap`):
| Font | Kết quả |
|---|---|
| `app/fonts/GeistVF.woff` | **thiếu 10/10** — `ế ề ấ ầ ộ ự ữ ạ ị` |
| `public/fonts/BeVietnamPro-Regular` | **đủ 10/10** |

**Gốc bệnh là một câu chú thích**: *"Hệ điều hành tự fallback glyph tiếng Việt"*. Fallback theo
GLYPH **có chạy**, nhưng nó thay **từng ký tự một** bằng font mặc định của hệ (**serif**) ⇒ một từ
bị vá bằng hai font: `"Thi"` Geist + `"ế"` Times. Kết quả: chữ **vừa mất dấu vừa ra serif** —
đúng hai thứ Hoà chê suốt hai tuần, và **cả hai chỉ là MỘT nguyên nhân**.

> ⚠️ **Bài học**: khai `fallback` **không cứu được font THIẾU BẢNG MÃ**. Fallback lo lúc font
> **tải hỏng**; nó không lo được lúc font **tải xong mà không có chữ**. Hai lỗi khác nhau, một
> dòng comment gộp làm một.

BeVietnamPro đã nằm trong repo từ **26/07**, có OFL, **chưa ai cắm** — nay đã cắm.
🟡 Đây là **vá đúng nghĩa**, không phải chọn typeface: bộ chữ chính thức vẫn thuộc quyền Claude
Design. **Ràng buộc bắt buộc từ nay: phải phủ đủ tiếng Việt, kiểm bằng `npm run soi:foundation`.**

### 23/08 · 6 nhãn HOA TOÀN PHẦN trên Trang chủ
Vi phạm V-1, luật có từ 31/07. Chẩn tại `06-DESIGN-KNOWLEDGE-AUDIT`: **không máy nào canh, và
không có ví dụ xấu để đối chiếu**. Đây là lý do module này phải kèm ví dụ hình.

### Ca đã biết từ 31/07
`StatusBadge` trong `components/notebook/NotebookSourcesSidebar.tsx` — *"Đang xử lý" / "Sẵn sàng" /
"Lỗi"* đeo `uppercase`. Và `2.2.85` (bỏ mono ở nhãn node) chỉ là **một triệu chứng** của V-4.

## 5 · KIỂM THẾ NÀO
1. `npm run soi:foundation` — cổng font/nhịp/icon.
2. Dán chuỗi thử **`Chữ Việt: ườ ẫu ợi Ế Ề Ễ Ổ Ự Ỳ`** vào màn đang dựng: có nhảy nét không?
3. `grep -rn "uppercase" components/ app/` — mỗi chỗ, chuỗi đó có dấu không?
4. `grep -rn "leading-none\|leading-tight\|leading-snug\|tracking-tight" components/ app/`
5. `grep -rn "h-\[\?[0-9]\+" ` quanh badge/chip có chữ Việt — có `overflow-hidden` kèm không?
6. Chữ nhỏ nhất có dấu trên màn: ≥ 12px chưa?
7. Với font mới bất kỳ: **đọc `cmap` bằng fontTools**, không "nhìn thấy hiện ra là được".

## 6 · ĐÀO SÂU
- `docs/LUAT-CHU-VIET-7.1.23-2026-07-31.md` — bản đủ 5 mục, có nguồn
- `app/layout.tsx:11-22` — chú thích đo tại nguồn ngày 23/08 (đọc nguyên văn)
- `.claude/skills/if-design/knowledge/typography.md` — thang, vai, hai giọng
- `docs/00-CHOT.md` 08/08 — thuật ngữ lệnh dựng hình giữ tiếng Anh (V-8)
