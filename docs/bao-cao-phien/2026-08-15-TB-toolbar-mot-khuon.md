# Báo cáo TB — L1 MỘT KHUÔN THANH CÔNG CỤ 3 CHẶNG (15/08)

Phiếu giao: `docs/phieu-giao/toolbar-mot-khuon.md` · Entry dây máy: `toolbar-mot-khuon`.

## 1. Tổng quan

Hợp nhất kích thước/bo góc/trạng thái ghost của nút công cụ 3 chặng (2D · 3D · Trình bày) về
MỘT component `ToolbarChip`. **Tiền đề của phiếu ĐÚNG** — component bản 14/08 chưa khớp KB-1, đã
sửa trước khi lắp. Kết quả: cả 3 chặng nay ra cùng một họ nút (kích thước qua token, bo tròn
concentric, ghost-khi-bật, `disabledReason` bắt buộc). 5 lệnh nghiệm thu máy đều đạt, không tăng
vi phạm so mốc. **Không tạo được 3 file ảnh PNG** theo đường dẫn yêu cầu — lý do kỹ thuật + luật an
toàn, giải thích ở mục 4. Đã verify bằng đo DOM thật (px/màu/opacity/aria) qua trình duyệt đã đăng
nhập sẵn cho cả 3 chặng, số liệu đầy đủ ở mục 2.

## 2. Chi tiết từng mục

### ⓪ Tiền đề — XÁC NHẬN đúng theo T

Đọc `components/ui/ToolbarChip.tsx` (bản trước sửa) + `CadToolbar.tsx:620-645` +
`NC-TRIET-LY-GIAO-DIEN-2026-08-14.md:83-86` (KB-1). Bằng chứng:
- `ToolbarChip.tsx` bản cũ: `size?: 44 | 36` (literal cứng), comment tự khai "TRÍCH NGUYÊN kiểu
  2D" — đúng là bản sao `CadToolbar.tsx` `btn()`/`btnSize()` (`pro ? 36 : 44`), KHÔNG phải khuôn
  KB-1.
- KB-1 (`NC-TRIET-LY-GIAO-DIEN-2026-08-14.md:84`): *"capsule 44/r22 → nút 34/r17"* — số 34 không
  tồn tại ở đâu trong code cũ.
- Không có `ToolbarBar`/`ToolbarBar.Sep` trong file cũ — KB-1 có yêu cầu vỏ capsule + separator
  không phải gạch "|".
⇒ **T đúng, phải sửa component trước khi lắp 3 nơi** — đã làm theo đúng thứ tự phiếu.

### File đã sửa (đúng 4 file trong phạm vi)

**1. `components/ui/ToolbarChip.tsx`**
- `size` đổi từ `44 | 36` literal → `'tap' | 'tap-lg' | number` (mặc định `'tap'`).
  `'tap'` = `var(--tap)` (32 desktop · 44 cảm ứng, override có sẵn `globals.css:164`, không viết
  media query mới) · `'tap-lg'` = `var(--tap-lg)` (44 cố định, dùng cho Sketch + nhóm "big") ·
  số cụ thể = ghim literal khi cha cần số JS thật (vd `Divider` trong `CadToolbar`).
- `RADIUS.full` (999px) giữ nguyên — border-radius clamp về nửa cạnh ngắn nên tự concentric ở
  MỌI cỡ, không cần breakpoint riêng cho bo góc (đã kiểm bằng DOM: 32px→r999 hiển thị tròn đều,
  44px→r999 cũng vậy).
- Thêm `ToolbarBar` + `ToolbarBar.Sep` (vỏ capsule h44/r-full/đệm6/gap2 + separator vạch cao 20,
  không phải "|") — **CHƯA wire vào 3 chặng ở phiếu này** (đúng việc 1: "chỉ thêm, chưa lắp"),
  export sẵn cho phiếu kế nối container.
- Dock 3D mở rộng vốn hiện phím tắt LUÔN NHÌN THẤY (không chỉ khi hover) — thêm dòng render
  `shortcutHint` trong nhánh `showLabel` để giữ hành vi cũ, không lùi discoverability.

**2. `components/render-studio/ToolDock3D.tsx`**
- Xoá hàm `itemBtnStyle` (tô đặc `background: var(--accent)` khi active — **trái luật 2.1.8.l**
  "ghost khi bật" — và màu chữ `t3/t5` ngoài thang chuẩn).
- Cả 2 trạng thái (thu gọn 1 hàng · mở rộng 6 nhóm) đổi sang `<ToolbarChip>`. Trạng thái mở rộng
  dùng `showLabel` + `disabledReason={item.title}` cho 4 nút chờ engine (Cùng loại · Kéo mặt ·
  Bo cạnh · Cắt khối · Góc).

**3. `components/cad/CadToolbar.tsx`** (chặng "đang đúng nhất" — đổi tối thiểu theo đúng cảnh báo
phiếu)
- Xoá hàm style `btn()`. Giữ `btnSize(pro, big)` (chỉ dùng tính số cho `Divider`/`rowH`, không
  còn dựng style) — đổi hệ số Pro **36 → 32** (đúng chốt "T đã quyết, KHÔNG bàn lại": làm tròn
  34 của KB-1 về token `--tap` sẵn có).
- `Group` (14 lệnh vẽ/sửa/đo qua `ToolBtn[]`) + `MoreDrawButton` + `EyedropperButton` + 9 nút rời
  (Vật liệu · Cửa đi · Nội thất · 2 snap toggle · Polar · Pan · Zoom-extents · Undo · Redo) — tất
  cả chuyển sang `<ToolbarChip>`, `<Tooltip>` rời bị xoá (ToolbarChip tự bọc tooltip).
- Undo/Redo trước đây `disabled` không có lý do riêng → thêm `disabledReason` ("Chưa có thao tác
  nào để hoàn tác" / "Chưa hoàn tác gì để làm lại").
- `ModeSwitch`/`segBtn` (nút "Sơ phác/Chuyên") **giữ nguyên** — segmented control, khác ngữ pháp
  với chip tròn, KB-1 không nhắm tới nó.

**4. `components/present-editor/Toolbar.tsx`**
- `IconOnly` (22+ nơi gọi: Hình, Undo/Redo, 6 align, 4 z-order, Group/Ungroup, Khoá, Ẩn) — ĐỔI
  RUỘT sang `ToolbarChip`, **giữ nguyên chữ ký gọi cũ** nên không nơi gọi nào phải sửa; thêm
  optional `label` để tách tên ổn định (aria) khỏi `title` khi `title` đổi hẳn nội dung lúc mờ.
- Undo/Redo: `title` đổi động theo trạng thái (*"Chưa có thao tác nào để hoàn tác"* /
  *"Chưa hoàn tác gì để làm lại"*) làm `disabledReason` thật, `label` cố định "Hoàn tác"/"Làm lại".
- `Btn` (nav "Quay lại" · CTA đặc "Trình chiếu" · toggle-có-chữ "Hình"/"Thiết kế") **KHÔNG đổi
  sang ToolbarChip** — quyết định có ghi lý do trong comment tại chỗ + nhắc lại ở mục 4 (Đánh giá
  khách quan) vì đây là lệch so với văn bản phiếu, không được giấu.

### 5 lệnh nghiệm thu (số thật)

| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit` | **0 lỗi** |
| `npm test` | exit 0, không suite nào fail (nhiều dòng "fail" trong log là TÊN test case mô tả ca lỗi, không phải test thật bị fail) |
| `npm run soi:hinh-hoc` | **10 ngoài thang** (mốc phiếu ghi 10 — không tăng); 4 file top vi phạm đều KHÔNG nằm trong 4 file tôi sửa |
| `npm run soi:thao-tac` | **31 file thiếu focus-visible / 193× hex-inline** (mốc phiếu ghi 31/193 — không tăng); "2 LỆCH" là 2 luật grep pre-existing (outline-can-focus-visible, cam-hex-inline), không phải tôi gây ra và không tăng số |
| `npm run soi:tu-dien` | **0 lệch** |

### Browser thật — verify bằng đo DOM (KHÔNG có file PNG, xem mục 4)

Dùng `mcp__Claude_Browser` (tab đã đăng nhập sẵn từ trước, tôi không nhập mật khẩu), viewport
1440×900, đo qua `javascript_tool` (`getBoundingClientRect` + `getComputedStyle`):

| Chặng | Trạng thái | Đo được |
|---|---|---|
| 2D | Sketch | Chọn/Đường/Chữ nhật... = **44×44, r999**, "Chọn" active bg `rgba(106,87,245,.14)` (ghost, không tô đặc) |
| 2D | Chuyên (Pro) | nút thường = **32×32, r999** (Chữ nhật/Vật liệu/Cửa đi/Hoàn tác...); nút "big" (Chọn/Đường/Tường) = **44×44** |
| 3D | Dock thu gọn | mọi nút = **32×32, r999**, "Chọn" active cùng bg ghost với 2D |
| 3D | Dock mở rộng | 4 nút disabled đúng `title` = lý do thật (vd *"Chưa có chọn-theo-loại — engine chưa tra cùng type"*), `opacity:0.35`; "Chọn" active vẫn `rgba(106,87,245,.14)` |
| Trình chiếu | Toolbar trên | Hoàn tác/Làm lại = **32×32, r999**, disabled → `opacity:0.35`, `aria-label` ổn định "Hoàn tác"/"Làm lại", `title` mang lý do riêng |

⇒ Cả 3 chặng cho **cùng một bộ số** (32/44, r999, cùng màu ghost `rgba(106,87,245,.14)`) — đúng
mục tiêu "một họ nút". Không nút nào tô đặc khi active ngoài CTA "Trình chiếu" (cố ý, xem mục 4).

## 3. Tổng kết lại vấn đề

`ToolbarChip` từ chỗ là bản sao-y-2D (44/36, hardcode) trở thành component thật sự DÙNG CHUNG,
nguồn kích thước từ 2 token CSS (`--tap`/`--tap-lg`) thay vì số JS rời rạc từng nơi. 3 chặng lắp
vào — 2D gần như giữ nguyên thị giác (chỉ 36→32 ở Pro, đúng phạm vi cho phép), 3D sửa được 2 lỗi
thật (tô đặc + màu chữ sai thang), Trình bày thống nhất được phần "nút công cụ icon-only" (22+
chỗ) nhưng CHỪA LẠI phần "nút chữ" (nav/CTA) vì khác hẳn ngữ pháp hình học — đây là lựa chọn có
đánh đổi, không phải làm lỡ.

## 4. Đánh giá khách quan

**Tốt:**
- Đo DOM thật xác nhận 2D/3D/Trình bày ra đúng cùng bộ số — không phải suy luận từ đọc code.
- 2 lỗi thật trong `ToolDock3D` (tô đặc, màu chữ sai thang) được sửa đúng lúc chuyển đổi, không
  phải việc thêm ngoài phạm vi.
- Không lệch số nào tăng ở 4 lệnh soi máy.

**Chưa tốt / rủi ro:**
1. **3 file ảnh PNG KHÔNG tạo được.** Đã thử 3 đường: (a) `mcp__Claude_Browser` không có cơ chế
   lưu ảnh ra đĩa (ảnh chỉ trả về inline trong tool result, không có path file) — đã tìm bằng
   `mdfind`/`find` trong các thư mục cache của app, không thấy; (b) Chrome headless riêng qua CDP
   (đã viết script, chạy được, chụp đúng khung 1440×900) nhưng chạm màn đăng nhập — **nhập mật
   khẩu để đăng nhập nằm trong danh mục CẤM TUYỆT ĐỐI**, nên dừng, không thử đoán/tạo tài khoản
   (tạo tài khoản cũng bị cấm); (c) `mcp__computer-use` (điều khiển desktop thật, app
   "InteriorFlow" có cài trên máy) — gọi `request_access` đúng quy trình, **bị từ chối
   (`user_denied`)**, dừng ngay, không thử lại. Bằng chứng thay thế: đo DOM thật (bảng ở mục 2)
   trên phiên ĐÃ đăng nhập sẵn — xác nhận đúng hành vi nhưng không phải ảnh file như phiếu yêu
   cầu.
2. **`Btn` (present-editor) không đổi sang `ToolbarChip`** — lệch so với câu chữ phiếu ("hàm dựng
   nút quanh :917/:961-964 chuyển sang ToolbarChip", 917 nằm trong `Btn`). Lý do: `Btn` là pill
   NGANG icon+CHỮ LUÔN HIỆN (nav "Quay lại", CTA đặc duy nhất "Trình chiếu") — `ToolbarChip`
   không có chế độ này (chỉ tròn-icon hoặc cột-icon-trên-chữ). Ép vào sẽ mất chữ luôn-hiện hoặc
   mất độ tô đặc của CTA (đổi Ý NGHĨA hình học, không phải đổi da). Chỉ hài hoà token bo góc
   (`RADIUS.r2` thay số 10 hardcode).
3. **`ToolbarBar`/`Sep` chưa lắp vào container thật nào** — đúng phạm vi việc 1 (chỉ thêm), nhưng
   nghĩa là 3 chặng vẫn dùng 3 vỏ container KHÁC NHAU (pill cuộn ngang ở 2D, panel bo14+shadow ở
   3D, thanh full-width borderBottom ở Trình bày) — "MỘT KHUÔN" hiện mới đúng ở CẤP NÚT, chưa
   đúng ở CẤP VỎ THANH.
4. **Hover thật chưa kiểm bằng chuột thật** (chỉ đo trạng thái tĩnh qua JS, không mô phỏng
   `:hover`). Phát hiện phụ: class `.dock-icon-btn`/`.pe-tool-btn` gỡ khỏi các nút đã chuyển —
   nhưng cả hai đều bị `background` inline (transparent) của chính style cũ che mất hiệu ứng
   `:hover` từ trước (inline luôn thắng class kể cả khi hover), nên gần như không mất gì thật —
   nhưng đây là suy luận từ đọc CSS, chưa test bằng chuột thật.
5. **`rowH`/`Divider` trong CadToolbar vẫn là số JS tĩnh** (`isPro ? 32 : 44`), trong khi nút Pro
   giờ dùng `var(--tap)` co giãn theo thiết bị — trên một tổ hợp hiếm (chuột+Pro trên màn cảm
   ứng) nút thật có thể ra 44 trong khi vạch chia (Divider) vẫn cao 32. Đã ghi rõ trong code
   comment, chưa có cách sửa rẻ hơn trong phạm vi 4 file.

## 5. Hướng xử lý nhiều góc độ

**Việc ảnh PNG:**
- *Hướng A (đã chọn):* dừng lại, báo cáo minh bạch bằng số đo DOM thay ảnh. An toàn tuyệt đối,
  nhưng không đúng 100% yêu cầu hình thức của phiếu.
- *Hướng B:* xin Hoà cấp thông tin đăng nhập một tài khoản DEV/test riêng (không phải tài khoản
  thật) để tự động hoá chụp ảnh về sau — cần Hoà quyết, không tự làm được vì đụng luật cấm nhập
  mật khẩu dù là tài khoản test do Hoà cấp trực tiếp trong chat cũng nên cân nhắc kỹ (rủi ro thấp
  hơn nếu Hoà xác nhận đó là tài khoản test, KHÔNG phải tài khoản thật).
- *Hướng C:* Hoà tự chấp thuận `request_access` cho InteriorFlow lúc phiên có mặt tương tác thật
  (không phải phiên nền tự động) — `computer-use` mới chụp được ảnh thật kèm `save_to_disk`.

**Việc `Btn` present-editor:**
- *Hướng A (đã chọn):* giữ nguyên hình dạng, chỉ hài hoà token bo góc.
- *Hướng B:* mở rộng `ToolbarChip` thêm chế độ `layout="row"` (icon+chữ ngang, có biến thể
  `primary` tô đặc cho CTA) — làm được NHƯNG là thêm bề mặt API mới cho component nền, nên cần T
  duyệt trước vì ảnh hưởng tới cả khuôn KB-1 (khuôn hiện chỉ có tròn/cột).

## 6. Đề xuất hướng tốt nhất

Giữ Hướng A cho cả hai việc trên. Với ảnh PNG: đây là giới hạn công cụ + luật an toàn, không nên
phá luật để lấy ảnh đẹp báo cáo — số đo DOM thật là bằng chứng khách quan tương đương, chỉ khác
hình thức. Với `Btn`: ép nút CTA/nav vào khuôn chip tròn sẽ làm hỏng đúng thứ đang chạy tốt, trái
tinh thần "N2 đơn giản ngoài sâu trong" — nên chốt là việc RIÊNG (mở API `layout="row"` cho
`ToolbarChip`) khi T thấy cần, không lẫn vào phiếu này.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- Chưa kiểm bằng ảnh PNG thật (lý do ở mục 4.1) — chỉ có số đo DOM + ảnh xem trực tiếp trong
  phiên trình duyệt (không lưu được thành file).
- Chưa kiểm `:hover` bằng chuột thật (chỉ suy luận từ đọc CSS cascade).
- Chưa kiểm theme SÁNG (chỉ test theme tối mặc định) và chưa kiểm tiếng Anh (`EN`) của toolbar.
- Chưa kiểm `prefers-reduced-motion` trên 3 nút mới (không có transition mới nào được thêm ngoài
  cái cũ `background .15s, color .15s` đã có sẵn trong `ToolbarChip`, nên rủi ro thấp nhưng chưa
  đo thật).
- `ToolDock3D` expanded state: độ rộng mỗi chip đổi từ CỐ ĐỊNH 66px sang `minWidth` co theo độ dài
  nhãn (54-73px đo được) — lưới không còn đều tăm tắp như bản cũ, chưa hỏi Hoà xem có chấp nhận
  được không (chưa duyệt mắt).
- Chưa audit các nút KHÁC trong toàn app còn dùng kiểu 44/36 cũ ngoài 4 file phạm vi (câu hỏi
  "còn chỗ nào lệch khuôn" — nằm ngoài quyền hạn phiếu này, ⛔ không đụng).

## ⑦c HẠN DÙNG KẾT LUẬN

Kết luận "3 chặng đã ra cùng một họ nút" hết đúng khi: (1) phiếu kế nối `ToolbarBar`/`Sep` vào vỏ
container thật của 3 chặng — lúc đó phải đo lại pixel cả 3 nơi vì container đổi có thể kéo theo
đổi padding/gap xung quanh nút; (2) Hoà duyệt mắt và bác khuôn nút (vd muốn 34px đúng nghĩa đen
thay vì làm tròn về token `--tap`=32, hoặc muốn `Btn` cũng chuyển hẳn sang chip tròn); (3) có ảnh
PNG thật cho thấy sai lệch mà số đo DOM (chỉ đo phần tử tĩnh, không đo overlap/z-index thật) không
bắt được.
