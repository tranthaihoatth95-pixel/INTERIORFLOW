# Cảm ứng & iPad — desktop KHÔNG PHẢI tablet phóng to/thu nhỏ

## 1 · CÂU HỎI MODULE NÀY TRẢ LỜI
- Làm bản tablet riêng hay dùng chung một bản?
- Cỡ chạm bao nhiêu? Lấy ở đâu?
- Chức năng đang nằm sau hover thì trên iPad tới bằng đường nào?
- Chuột và ngón tay khác nhau ở chỗ nào ngoài kích thước?

## 2 · LUẬT DÙNG ĐƯỢC NGAY

**TC-0 · CẢM ỨNG LÀ MỘT LỚP THAO TÁC, KHÔNG PHẢI MỘT BẢN RIÊNG** (chốt 11/08, CẤP 0):
Desktop Electron = bản chuẩn đầy đủ · Web = cổng kết nối · **Touch = LỚP**. Không fork giao diện.

**TC-1 · MỘT THIẾT KẾ, NĂM TOKEN ĐỔI THEO CON TRỎ** — đã nằm thật ở `app/globals.css:105`:
| Token | Desktop | Cảm ứng |
|---|---|---|
| `--tap` (nút icon) | 32px | **44px** |
| `--row` (dòng danh sách) | 28px | **44px** |
| `--gap` | 8px | 12px |
| `--pad-card` | 8px 12px | 12px 16px |
| `--fs-ui` | 13px | **15px** |
Điều kiện chuyển: **`@media (hover: none) and (pointer: coarse)`** — tái dùng đúng điều kiện đã có
ở `globals.css` cho tooltip tĩnh.
⛔ **Không dùng bề rộng màn** để đoán cảm ứng: iPad rất rộng, laptop cảm ứng vẫn báo `hover: hover`.
⛔ Mọi màn mới khai cỡ bằng `var(--tap/--row/--gap)`, **cấm số cứng**.

**TC-2 · CẤM GIAO DIỆN QUAN TRỌNG CHỈ TỚI ĐƯỢC BẰNG HOVER.** Ngón tay không có trạng thái "đang rê".
Mọi thứ hiện-khi-hover phải có **ít nhất một đường khác**: nhấn giữ · nút thường trực · menu ngữ
cảnh · `⌘K`. (`SPEC-HOVER-FOCUS-IDF` luật 8: *tablet không giấu sau hover*.)

**TC-3 · NHẤN GIỮ = 500ms / trượt cho phép 8px.** Giá trị đang có trong repo là
`TOOLTIP_LONG_PRESS_MS` ở **`components/ui/Tooltip.tsx:33,37`**.
🔴 **Nhưng đó là hằng số CỦA TOOLTIP, không phải cử chỉ dùng chung** — tiền tố nói rõ điều đó.
⇒ IF **CHƯA CÓ** chuẩn nhấn-giữ chung; dùng lại hằng số của tooltip cho việc khác là **sai ngữ
nghĩa**. Cách đúng: tách `lib/gesture/long-press.ts` (hoặc token), **giữ nguyên 500ms / 8px**,
mọi nơi đọc một nguồn.
Kèm: trong lúc giữ **phải nở dần** — giữ mù 500ms rồi bung là cảm giác máy đơ.

**TC-4 · KHÁC BIỆT KHÔNG PHẢI CHỈ KÍCH THƯỚC:**
| | Chuột | Ngón tay |
|---|---|---|
| Trạng thái trung gian | có hover | **không có** |
| Độ chính xác | ~1px | ~8–10mm, **tâm chạm lệch** |
| Che khuất | không | **ngón che chính thứ đang bấm** |
| Nhiều điểm | không | pinch · hai ngón · pan |
| Bàn phím | luôn sẵn | có thể không có |
⇒ Menu ngữ cảnh và popover trên cảm ứng phải mở **lệch khỏi điểm chạm** (thường lên trên), không
mở đúng dưới ngón.

**TC-5 · `title` CỦA TRÌNH DUYỆT LÀ VÔ HÌNH TRÊN CẢM ỨNG.** Không dùng `title` để chở thông tin
cần thiết (vd lý do nút bị mờ) — đi đường `aria-describedby` + phần tử ẩn. Xem `accessibility.md`.

**TC-6 · ĐĨA LỆNH TRÊN CANVAS ↔ NHẤN GIỮ TRÊN CHÍNH NÚT — hai chỗ khác nhau, đừng trộn.**
Đĩa lệnh (radial) sống trên **mặt canvas**; nhấn giữ để bung một điều khiển sống trên **chính nút đó**.

**TC-7 · KIỂU XEM MẶC ĐỊNH ĐỌC TỪ CÙNG MỘT NGUỒN.** `matchMedia('(hover: none) and (pointer:
coarse)')` — **một nguồn sự thật** với token mật độ, không thêm biến mới.

**TC-8 · KÉO THẢ PHẢI LÀM ĐƯỢC KHÔNG CẦN KÉO.** Trên cảm ứng lẫn bàn phím: chọn → dời → thả.
Xem `accessibility.md`.

## 3 · VÌ SAO — cơ chế con người
Hover là một **trạng thái thăm dò**: chuột cho phép người dùng "hỏi" giao diện mà chưa cam kết.
Ngón tay không có nấc đó — mọi chạm đều là **cam kết**. Nên giao diện thiết kế quanh hover sẽ, trên
cảm ứng, biến mọi cú thăm dò thành một hành động thật; người dùng học được rằng chạm là **rủi ro**,
rồi họ chạm ít đi và dùng ít tính năng đi.

Còn lý do phải là **một thiết kế, năm token** thay vì hai bản: hai bản luôn phân kỳ — sửa một bên
quên bên kia là chuyện chắc chắn xảy ra, đúng như bài học `CLAUDE.md` rút ra khi gộp
`AGENTS.md`/`CLAUDE.md` về một nguồn.

Với IF còn một lý do nghề: iPad là thiết bị **ở công trường và trước mặt khách**, nơi cần **xem và
duyệt** hơn là dựng. Nên thứ phải chạy tốt trên cảm ứng trước hết là Review Gate, Present, Thư
viện — không phải toàn bộ bộ lệnh dựng hình.

## 4 · CA HỎNG THẬT CỦA IF
- **02/08 · K3**: `ImageEditor` thiếu tiền tố Webkit ⇒ **tablet không blur**. Lỗi chỉ lộ trên
  thiết bị thật.
- **23/08 · ToolbarChip nút mờ**: lý do bị mờ nhét vào `title` ⇒ **câm trên cảm ứng**, và trình đọc
  màn hình đọc không nhất quán. Đã chuyển sang `aria-disabled` + `aria-describedby`.
- **16/08 · T ghi sai địa chỉ hằng số nhấn giữ**: T khai nó ở `components/print/RadialToolMenu.tsx`
  — tệp đó có **0 dòng** về long-press; số thật ở `Tooltip.tsx:33,37`. Sai kép: sai địa chỉ **và**
  sai bản chất (hằng số của tooltip ≠ cử chỉ chung).
  ⭐ Bài học chung: **đã grep thì đọc đường dẫn trong kết quả, đừng nhớ hộ máy.**
- **03/08 · đo thật**: `grep` toàn repo cho `onContextMenu` / `shiftKey` / `onKeyDown` = **0 kết
  quả** ⇒ IF thiếu hẳn từ vựng chuột+bàn phím (chuột phải · shift-click · marquee · mũi tên ·
  type-ahead · kéo tệp từ Finder). Nút rail 42 vs 44 lệch nhau; `max-width:1440px` bỏ trống màn 27".
- **Bẫy còn mở**: nhiều chỗ hiện-khi-hover chưa có đường thứ hai — chưa kiểm hết, xem §5.

## 5 · KIỂM THẾ NÀO
1. Mở DevTools ở chế độ cảm ứng **và reload** (gate lúc tải phải chạy lại) — token có đổi không?
2. `grep -rn "hover:" ` trong file đang dựng: mỗi chỗ, kể ra **đường thứ hai** trên cảm ứng.
3. `grep -rn "title=" components/` — chỗ nào đang chở thông tin cần thiết bằng `title`?
4. Đo cỡ chạm thật: mọi mục tương tác ≥ **44px** ở chế độ cảm ứng chưa?
5. `grep -rn "[0-9]\+px" ` trong CSS mới — còn số cứng nào lẽ ra phải là `var(--tap/--row/--gap)`?
6. Menu ngữ cảnh mở ra có bị ngón che không?
7. Nhấn giữ: có phản hồi **nở dần trong lúc giữ** không?

## 6 · ĐÀO SÂU
- `docs/SPEC-MAT-DO-CON-TRO.md` — §3 token, §5 chốt, bằng chứng "thiếu từ vựng chuột+bàn phím"
- `app/globals.css:105` — 5 token mật độ đang sống
- `docs/SPEC-HOVER-FOCUS-IDF.md` — 8 luật chung, luật "tablet không giấu sau hover"
- `components/ui/Tooltip.tsx:33,37` — 500ms / 8px (đọc kèm cảnh báo TC-3)
- `docs/00-CHOT.md` 11/08 CẤP 0 — Touch là LỚP, không phải bản riêng
