# Chữ — thang, vai trò, và hai giọng nói của IF

> ⚠️ **Khai thật trạng thái**: thang chữ chính tắc (cỡ · cân nặng · elevation) đang là
> **NỢ — `SKILL.md §6` tự khai "OWED BY CLAUDE DESIGN"**. Module này vì thế nêu **luật và cách
> chọn**, không bịa ra một bảng số. Số nào chưa có nguồn thì ghi rõ *"chưa chốt"*.
> Phần tiếng Việt tách riêng: **`typography-vietnamese.md` — đọc cùng, không đọc thay.**

## 1 · CÂU HỎI MODULE NÀY TRẢ LỜI
- Tôi cần thêm một cỡ chữ mới — có được không?
- Chữ trong app và chữ trong hồ sơ nộp khách có phải cùng một giọng?
- Đâu là "chữ kỹ thuật", đâu là "chữ chạy"?
- Vì sao màn của tôi có 11 cỡ chữ mà vẫn thấy thiếu?

## 2 · LUẬT DÙNG ĐƯỢC NGAY

**T-1 · THANG LÀ MỘT DANH SÁCH ĐÓNG.** Cỡ chữ chọn **từ thang**, không chọn tự do. Thêm một cỡ =
sửa thang (một chỗ, có người duyệt), không phải gõ số tại chỗ dùng.
Mốc báo động đo được: **> 6 cỡ trên một màn** là nghi, **> 8 là trôi thang**.

**T-2 · CỠ BUỘC THEO VAI, không theo cảm giác.** Mỗi cỡ trong thang phải có **vai được đặt tên**
(tiêu đề màn · tiêu đề khối · chữ giao diện · chữ phụ · số liệu · nhãn kỹ thuật). Cỡ không có vai
là cỡ thừa. Đây đúng cách `Icon.tsx` đã giải cho icon: **4 cỡ quang học buộc theo hạng điều khiển,
kiểu TypeScript là cổng** — chữ nên đi cùng đường.

**T-3 · CHỮ GIAO DIỆN ĐI QUA TOKEN `--fs-ui`, KHÔNG GÕ SỐ.** Token mật độ đã có thật ở
`app/globals.css:105`: `--fs-ui: 13px` (desktop) → **15px** trên cảm ứng, cùng họ với
`--tap / --row / --gap / --pad-card`. Mọi màn mới khai cỡ bằng `var(...)`, cấm số cứng
(`SPEC-MAT-DO-CON-TRO §5`).

**T-4 · HAI GIỌNG NÓI, TÁCH HẲN.**
| | Giọng **CHROME** (app) | Giọng **SẢN PHẨM** (hồ sơ nộp) |
|---|---|---|
| Nơi | rail · toolbar · panel · thẻ | deck · bảng vật liệu A3 · BOQ · bản vẽ |
| Chất | sans, gọn, mật độ cao, trung tính | editorial: serif được phép, khoảng thở rộng, macro vật liệu |
| Nguồn | NT-1, NT-8 | **NT-12** |
⛔ Cấm bê giọng dashboard vào bản nộp khách, và ngược lại.

**T-5 · CHỮ KỸ THUẬT ≠ CHỮ CHẠY** (chi tiết và lý do ở `typography-vietnamese.md`):
- **Chữ kỹ thuật** — `2400 × 750 mm` · `36.7 m²` · `Ø25` · `±0.000` · mã tờ · toạ độ.
  Được phép: `tabular-nums`, mono, line-height chặt, letter-spacing nén để vừa cột.
- **Chữ chạy** — `Chiều cao 750 mm` · `Phòng khách 36.7 m²` · mọi câu người đọc.
  ⛔ **CẤM để mật độ CAD rò sang đây.**
Ranh giới thực dụng: có **dấu tiếng Việt** hoặc có **từ** ⇒ là chữ chạy.

**T-6 · SỐ LÀ NHÂN VẬT** (NT-7): số liệu nghề dùng big-number + `tabular-nums` để cột số không
nhảy khi giá trị đổi. Số thứ tự (`01/`) làm xương cấu trúc tài liệu.

**T-7 · NHÃN NGẮN — nhưng ngắn không có nghĩa là bỏ nhãn.** Nhãn giao diện ≤ 12 từ, hành động
trước (`SPEC-NGON-NGU-CHI-DAN`). Icon vẫn **luôn có nhãn** ở chỗ cần (xem `iconography.md`); thứ bị
chê là **khối chữ nhỏ và nhiều**, không phải nhãn 1–2 từ.

**T-8 · MỘT BỘ CHỮ, VÀ NÓ PHẢI PHỦ ĐỦ TIẾNG VIỆT.** Ràng buộc cứng từ 23/08 — kiểm bằng **bảng
mã**, không bằng mắt. Xem `typography-vietnamese.md` T V-4.

**T-9 · CỠ SÀN.** Chữ **có dấu ≥ 12px**, khuyến nghị **13px**. Dưới 12px thì dấu hỏi/ngã không
phân biệt được trên màn thường. Body 12.5px của Settings là **sát sàn, không được nhỏ hơn**.

## 3 · VÌ SAO — cơ chế con người
Thang chữ là cách rẻ nhất để **nói thứ bậc mà không cần chữ giải thích**. Nhưng nó chỉ hoạt động
khi các nấc **cách nhau đủ để nhận ra**: 13 và 14 đứng cạnh nhau không phải hai bậc, chúng là một
bậc bị nhiễu. Đó là lý do 11 cỡ trên một màn vẫn cho cảm giác "phẳng lì" — nhiều cỡ mà **không có
bậc nào rõ**.

Và lý do thang phải là danh sách đóng, không phải hướng dẫn: mỗi người chọn một cỡ **hợp lý riêng**
thì tổng thể vẫn hỏng. Đây là kết luận đo được của IF ở mảng icon (`Icon.tsx`): cỡ phân bố
13×332 · 15×186 · 12×183 · 11×83 — *"không phải 213 tệp cẩu thả, mà là thiếu PRIMITIVE"*.
Chữ đang mắc **đúng bệnh đó**, chỉ là chưa có primitive tương ứng.

## 4 · CA HỎNG THẬT CỦA IF
- **`01-CLINICAL-UI-AUDIT` B4**: 4 → **11** cỡ chữ. Files và Library **11 cỡ mỗi màn**, 2D 10, vỏ
  chung 4. *"Không phải thang, mà là tích tụ."* Hạng PARTIAL (hệ thống).
- **14/08 · gốc bệnh font Times**: biến font khai mà **không định nghĩa** ⇒ cả app render serif
  thường trực từ trước tới nay. Một dòng khai thiếu, hỏng toàn bộ giọng chữ.
- **23/08 · Geist thiếu 10/10 ký tự Việt dấu chồng** (`app/layout.tsx:11-22`) ⇒ mỗi từ bị vá bằng
  hai font. Chi tiết ở `typography-vietnamese.md`.
- **23/08 · 6 nhãn HOA TOÀN PHẦN trên Trang chủ** — vi phạm luật có từ 31/07.
- **`01-CLINICAL-UI-AUDIT` B1**: `Untitled flow` ở lớp vỏ **10/13 màn** — chữ placeholder được
  thăng cấp thành danh tính sản phẩm (`SKILL.md §12` cấm thẳng điều này).
- **`SKILL.md §6`** tự khai token nền **còn nợ** — nghĩa là mọi màn đang tự chế thang. Đây là lỗi
  hệ thống đang mở, không phải lỗi của một màn.

## 5 · KIỂM THẾ NÀO
1. Đếm cỡ chữ riêng biệt trên màn: `> 6` nghi, `> 8` trôi. (`npm run soi:foundation`)
2. Mỗi cỡ đang dùng gọi tên được **vai** của nó không?
3. `grep -n "font-size: *[0-9]" ` trong file vừa sửa — còn số cứng nào không dùng `var(--fs-ui)`?
4. Chuỗi nào là chữ kỹ thuật, chuỗi nào là chữ chạy? Có chuỗi chạy nào đang đeo `tabular-nums`,
   mono, hay `leading-tight` không?
5. Màn đang ở giọng CHROME hay giọng SẢN PHẨM? Có trộn không?
6. Chữ nhỏ nhất trên màn là bao nhiêu px? Có dấu không? (< 12px + có dấu ⇒ sai)
7. Có chuỗi placeholder nào đang đứng ở vị trí danh tính không?

## 6 · ĐÀO SÂU
- `.claude/skills/if-design/knowledge/typography-vietnamese.md` — **đọc cùng, bắt buộc**
- `docs/LUAT-CHU-VIET-7.1.23-2026-07-31.md`
- `docs/SPEC-MAT-DO-CON-TRO.md` §3–§5 — 5 token mật độ, `--fs-ui`
- `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` NT-7 · NT-8 · NT-12
- `docs/SPEC-NGON-NGU-CHI-DAN.md` — 5 luật viết nhãn · từ điển nội bộ → người dùng
- `.claude/skills/if-design/SKILL.md` §6 (nợ token) · §12 (ngôn ngữ)
