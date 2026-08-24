# Từ vựng nghề — một chữ một nghĩa, và nghĩa đó có chủ

> Chữ nguy hiểm nhất **không phải chữ lạ** — là chữ nghe quá quen nên **không ai nghĩ phải định
> nghĩa**: `tool` · `card` · `panel` · `kính` · `lớp` · `tầng`.

## 1 · CÂU HỎI MODULE NÀY TRẢ LỜI
- Chữ này trong IF nghĩa là gì? Ai là chủ nghĩa đó?
- Tôi định đặt tên mới cho một khái niệm — có được không?
- Lệnh nghề giữ tiếng Anh hay dịch?
- Làm sao biết mình và người giao việc đang hiểu khác nhau?

## 2 · LUẬT DÙNG ĐƯỢC NGAY

**N-1 · MỘT BẢNG THUẬT NGỮ DUY NHẤT**: `KEY · VI · EN · NGỮ CẢNH · CẤM DÙNG`. Từ điển máy đọc được
là `scripts/soi-tu-dien.mjs`; **chốt một cái tên = thêm entry NGAY LÚC CHỐT**, trước khi code.

**N-2 · TỪ CÓ NGHĨA CỐ ĐỊNH** (`SKILL.md §1` — cột phải là **cấm hiểu thành**):
| Từ | LÀ | KHÔNG PHẢI |
|---|---|---|
| HOME | bề mặt làm việc cá nhân | dashboard dự án · tường thẻ |
| PROJECT | định danh + sự thật gốc | một thư mục |
| WORKSPACE | ngữ cảnh làm việc nối lại được | một kho sự thật thứ hai |
| CANVAS | mặt làm việc nghề | mỗi stage một cái |
| STAGE | tiêu điểm / khung nhìn / chế độ | một vỏ app riêng |
| TOOLWINDOW | xưởng cho một hoạt động | một panel cố định |
| SIDEBAR | **bản đồ** | bệ phóng |
| VITALS | chú ý + suy luận | bảng thông báo |
| ACTIVITY | dòng thời gian | Vitals |
| REVIEW | cửa duyệt theo ngữ cảnh | một route/dashboard |
| DESIGN DNA | trí tuệ thị giác | bảng tin |
| SOURCES | bằng chứng của dự án | trình quản lý tệp chung |
| LIBRARY | định nghĩa nghề tái dùng được | kho riêng của từng stage |

**N-3 · ĐẶT TÊN MỚI: PHẢI KIỂM CODE ĐÃ CÓ TÊN CHƯA.**
> **Đặt tên mới cho thứ đã có tên là đẻ ra một KHÁI NIỆM MA** — nó tồn tại trong đầu người viết sổ,
> không tồn tại với người đọc code.

**N-4 · KHÔNG THĂNG CẤP PLACEHOLDER THÀNH DANH TÍNH.** Thứ chưa đặt tên thì **là chưa đặt tên** —
không phải `Untitled flow` được đưa lên làm tiêu đề.

**N-5 · KHÔNG LỘ JARGON NỘI BỘ RA UI.** Từ điển nội bộ → người dùng: `node` → *khối* ·
`Node MASTER` → *công cụ* · `flow` → *bảng làm việc*. Cấm mã nội bộ, tên nhà cung cấp (`D5`), tên
biến, id kỹ thuật xuất hiện trên màn. Nhãn ≤ 12 từ, **hành động trước**, luôn kèm nút.
⛔ Cấm chữ **"tự động"** trong UI — dùng dấu **Magic ✨** (`CHOT-TACH-AI`).

**N-6 · LỆNH HÌNH HỌC NGHỀ GIỮ TIẾNG ANH** (chốt 08/08): `Array · Bevel · Chamfer · Loft · Sweep ·
Revolve · Mirror · Fillet · Offset · Extrude · Boolean`. Cách hiện: **tên Anh dòng chính + dòng nhỏ
giải nghĩa tiếng Việt** (*"Array / lặp khối theo lưới"*). Ranh giới: **chỉ lệnh dựng hình** — tên
chặng, điều hướng, trạng thái, câu giải thích vẫn theo ngôn ngữ giao diện. **Không trộn VI/EN tuỳ hứng.**

**N-7 · TÊN CHẶNG — chốt vòng cuối 07/08**: **Thiết kế 2D · Thiết kế 3D · Trình chiếu**.
⚠️ **Khoá kỹ thuật GIỮ NGUYÊN** trong code (`concept` / `render` / `present`; `lib/cad/`,
`components/cad/`, route `/cad`) — đổi khoá là **vỡ localStorage, route, DB**. Chỉ đổi **nhãn**.
⛔ Bỏ chữ **"CAD"** khỏi nhãn người dùng khi nó chỉ **chặng làm việc**; giữ được khi nói **định
dạng tệp** (DWG/DXF).

**N-8 · TÁM TỪ ĐA NGHĨA ĐANG CANH** (`soi:tu-dien`, mức **cảnh báo**, cố ý không chặn build):
`khối · kính · nấc · lớp · tầng · card/thẻ · module · mã điều khoản`. Phát đo được: **205–212 chỗ**
dùng chữ trần.
🔴 **`tool` phải lên ĐẦU hàng siết** — tiêu chí xếp hàng đổi từ *"ít chỗ nhất"* sang **"đã gây thiệt
hại thật"** (xem §4).
🔴 **`widget` · `element` · `node` · `module` đang là BỐN TÊN CHO MỘT THỨ**; bằng chứng lệch đã lan:
`WidgetCard.tsx:20` dùng token `--shadow-node`. **Tên nào thì CHƯA CHỐT** — máy không tự chọn hộ.

**N-9 · TRÍCH MÃ ĐIỀU KHOẢN THÌ PHẢI MỞ FILE ĐỌC SỐ, CẤM NHỚ HỘ.** Nguồn chuẩn `TRIET-LY-IF.md`:
**[Đ1]** ở `:70` = *"tầng sau phải là hệ quả tầng trước"* · **[Đ2]** ở `:72` = *"NHÌN VÀO TRONG
TRƯỚC"*. (Và `[T5]:32` = con người quyết cuối · `[N1]:53` = human-centric.)

**N-10 · VĂN BẢN BỊ THAY PHẢI ĐÓNG DẤU TẠI CHỖ.** File hoang mà đọc như đang sống là bẫy. Chiều
ngược cũng vậy: **đổi tên tài liệu nền thì sửa MỌI con trỏ NGAY LƯỢT ĐÓ** — để lại mẩu chuyển
hướng là **chưa xong việc**.

## 3 · VÌ SAO — cơ chế con người
Từ vựng là **giao thức** giữa người giao việc và người làm. Khi một chữ mang hai nghĩa, cả hai bên
vẫn hiểu **rõ ràng** — chỉ là hiểu hai thứ khác nhau, nên **không ai phát hiện**. Không có tranh
cãi, không có lỗi biên dịch; chỉ có một sản phẩm sai được xây rất cẩn thận.

Dấu hiệu rẻ nhất và sớm nhất để bắt: **mỗi lần Hoà phải nói lại một yêu cầu lần thứ hai, kiểm xem
có phải lệch NGHĨA MỘT CHỮ không.**

## 4 · CA HỎNG THẬT CỦA IF

### ⭐ `tool` — bốn nghĩa, và thiệt hại đo được bằng SÁU PHIẾU
| Nghĩa | Định danh trong code | Bản chất |
|---|---|---|
| chế độ vẽ đang chọn | `setTool` (**166 chỗ**) · `activeTool` · `cadTool` | một **TRẠNG THÁI** |
| thanh công cụ | `ToolDock` · `ToolBtn` · `ToolMenu` | một **VẬT CHỨA NÚT** |
| master tool | `ToolWindow` · `ToolModeForm` · `ToolModeUi` … | một **MINI-APP TRÊN CANVAS** |
| kiến trúc tool 3 lớp | chỉ trong sổ | **TÊN CỦA CẢ HỆ** |

Hoà yêu cầu *"hộp công cụ nổi cạnh vật đang chọn"* / *"master tool phải THUỘC canvas"* từ **01/08**,
nhắc lại **13/08**, **15/08**, **16/08**. **T đọc "tool" bằng nghĩa `ToolDock` rồi đi làm VỎ NÚT
TOOLBAR suốt SÁU PHIẾU.** Hoà: *"cái tôi nói muốn mòn cái repo mà T không hiểu."*
🔴 Và cỗ máy sinh ra để bắt đúng lỗi này **không bắt được nó**: `grep tool scripts/soi-tu-dien.mjs`
= **2**, không phải với tư cách một mục từ điển.

### ⭐ `master tool` ↔ `ToolWindow` — sổ đẻ tên thứ hai cho thứ code đã đặt tên
`"master tool"` = **0 lần trong code**, **26 lần trong sổ**. `ToolWindow` = **13 chỗ trong code**,
**0 trong sổ**. **Hai tên KHÔNG GIAO NHAU Ở ĐÂU CẢ** ⇒ T đọc sổ, tưởng là khái niệm mới chưa có, đi
tìm không thấy, làm việc khác.
✅ Chốt: tên là **`cửa sổ công cụ`**; code giữ `ToolWindow`; *"master tool"* **khai tử**.
⭐ Bằng chứng đắt nhất cho việc máy soi phải quét **cả sổ lẫn code rồi ĐỐI CHIẾU** — quét riêng từng
bên thì **mỗi bên đều nhất quán**, không bên nào báo lỗi.

### Các ca khác
- **`01-CLINICAL-UI-AUDIT` B1** — `Untitled flow` trên **10/13** bề mặt (vi phạm N-4). Nó là tên
  mặc định **thật** (`ProjectSelect.tsx:739` · `FlowsPanel.tsx:85` · `WelcomeIntro.tsx:51`), nhưng
  ở **vỏ ứng dụng** đọc ra là *"app chưa biết mình đang mở cái gì"*. Vấn đề là **chỗ hiển thị**.
- **Settings dính jargon `D5`** — tên nhà cung cấp lộ ra UI (vi phạm N-5).
- **`[Đ1]` bị trích sai trên diện rộng** — cả hệ trích **nguyên văn câu của [Đ2] rồi gán số [Đ1]**;
  dạng sai khó thấy nhất vì **câu trích thì đúng**. Lan tới 9 phiếu + 4 tệp code + `00-CHOT` +
  registry. Gốc bệnh: một chỗ liệt kê **tên** 6 điều hành mà **không gán số**.
- **`--mat-*` ↔ `matId`** — cách nhau **đúng một dấu gạch**, một bên là MÀU, một bên là tiền nối
  `ProductSpec.sku`. Đã đổi `--mat-*` → `--nen-mo-*` (114 dòng/43 tệp) rồi tiếp `--vien-mo`.
- **`--nen-mo-hairline` — tên cấn**: nó là **đường kẻ**, không phải nền (đọc 80/80 chỗ: 76 là
  `border`/`divide`/`ring`, **0/80** làm mặt nền) ⇒ đổi `--vien-mo`.

## 5 · KIỂM THẾ NÀO
1. `npm run soi:tu-dien` — nhãn lệch (chặn) + chữ trần đa nghĩa (cảnh báo).
2. Trước khi đặt tên mới: `grep -rn "<khái niệm>" lib components` — code đã có tên chưa? (N-3)
3. Chữ đang viết có nằm trong 8 từ đa nghĩa không? Có nói rõ nghĩa nào không?
4. Trích mã điều khoản: đã **mở `TRIET-LY-IF.md` đọc số** hay đang nhớ? (N-9)
5. Có chuỗi placeholder nào đang đứng ở vị trí danh tính không? (N-4)
6. Có jargon/tên nhà cung cấp/id kỹ thuật nào lộ trên UI không? (N-5)
7. Có phải Hoà đang nói lại yêu cầu **lần thứ hai** không? ⇒ nghi lệch nghĩa một chữ.

## 6 · ĐÀO SÂU
- `scripts/soi-tu-dien.mjs` — từ điển máy đọc được, 8 lớp đa nghĩa + lý do từng dòng
- `.claude/skills/if-design/SKILL.md` §1 (bảng nghĩa cố định) · §12 (ngôn ngữ)
- `docs/IF-ARCHITECTURE-BLUEPRINT.md` B3 (26 term canonical) · B20 (30 cặp KHÔNG-PHẢI-LÀ)
- `docs/SPEC-NGON-NGU-CHI-DAN.md` — 5 luật viết nhãn, 4 khuôn thông điệp, từ điển nội bộ→người dùng
- `docs/nc/NC-TU-DA-NGHIA-2026-08-16.md` — 8 từ đo được, bảng §V5
- `docs/00-CHOT.md` 07/08 (tên chặng, bỏ chữ CAD) · 08/08 (lệnh giữ tiếng Anh) · 16/08 (ca `tool`)
