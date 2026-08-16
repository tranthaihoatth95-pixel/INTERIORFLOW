# PHIẾU P-E · SIDEBAR 3 NẤC + HOME DẪN THEO VIỆC + TAY CẦM DÙNG CHUNG

> T soạn 16/08 theo khuôn `docs/HOP-DONG-PHOI-HOP-T.md` §3. **Đợt này CHỈ DỰNG BẢN VẼ** —
> không sửa một dòng code app. Hoà duyệt mắt xong mới có phiếu thi công.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ
1. *"`components/ui/PanelHandle*` KHÔNG tồn tại — tay cầm thu/mở panel dùng chung mà Hoà chốt 07/08 làm mẫu cho toàn app vẫn chưa ai dựng."*
2. *"Home hiện là lưới ô đều nhau chứa thông tin trạng thái (lời chào · cung mặt trời chỉ giờ · ghi chú nhanh · khối dự án), KHÔNG có dòng việc nào để người dùng bước vào."*
3. *"Chốt 03/08 (`docs/SPEC-CAD-SHELL-V3.md`) đã BỎ rail chỉ-có-icon, lý do: Apple HIG không có khái niệm này, Keynote/Final Cut đều dùng một sidebar CÓ CHỮ."*
4. *"`docs/SPEC-PANEL-ROLLOUT-IDF.md` CẤM auto-hide (bị chê nhiều nhất ở cả 4 phần mềm 3D khảo sát), thu thì phải còn dải mỏng CÓ NHÃN."*
→ `[XÁC NHẬN | BÁC BỎ | KHÔNG CÓ BẰNG CHỨNG]` + file:dòng. Bác bỏ thì DỪNG, báo T.

## ⓪b TIỀN ĐỀ HẠ TẦNG
`git log --oneline -1` + `git rev-list --count HEAD..main`. Lệch > 0 → DỪNG NGAY, báo T.

## ① BỐI CẢNH — lời Hoà, nguyên văn
*"trang dashboard xấu quá, vào rồi xong không biết đi đâu tiếp theo luôn"* + hỏi về *"sidebar 3 nấc
3 size từ nhỏ tới full"*, kèm **7 ảnh tham chiếu**.

T đọc 7 ảnh, rút 2 điều:
1. **Rail của Gemini và Quantum Creative đều CÓ CHỮ dưới icon** — tức sidebar thu nhỏ vẫn giữ nhãn.
   ⇒ làm 3 nấc được mà KHÔNG phá chốt 03/08, miễn nấc hẹp giữ chữ.
2. ⭐ **KHÔNG ảnh dashboard nào là lưới widget đều nhau.** Tất cả đều có **MỘT DÒNG VIỆC làm trung
   tâm** (danh sách task có tiến độ · người tham gia · giờ), cột phải mới là widget phụ. Và mọi
   sidebar đều đeo **SỐ** ("12 Unread", "8 New") — con số là thứ dẫn mắt.
   ⇒ Home IF trống vì nó bày **trạng thái**, không bày **việc**.

## ② ĐỌC TRƯỚC
- `docs/SPEC-CAD-SHELL-V3.md` — chốt bỏ rail icon, lý do đầy đủ.
- `docs/SPEC-PANEL-ROLLOUT-IDF.md` — cấm auto-hide, thu về dải mỏng có nhãn, rollout, ghim.
- `docs/00-CHOT.md` mục **07/08 §10** (tay cầm thu/mở = mẫu chung toàn app, kèm bảng đo 0/7 · 2/20 · 2/18 · 3/31 · 5/10 · 1/2) · mục **13/08** Home bento v3 · mục **16/08** widget 3 cỡ định sẵn + dùng chung 3 nền tảng.
- `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` (NT-1..18) + `NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` (KB-1..4) — **cửa nghiệm thu**.
- `components/home/` (Home hiện tại) · `components/AppShell.tsx` · `app/globals.css` (token).

## ③ VÙNG FILE
✅ `docs/mocks/**` (chỉ tệp của phiếu này) · `docs/bao-cao-phien/**`
⛔ **KHÔNG sửa một dòng code app nào.** Không `components/`, không `app/`, không `lib/`.
   Đợt này chỉ dựng bản vẽ. Đọc code thoải mái để lấy token và số đo thật.

## ④ VIỆC — dựng `docs/mocks/mock-sidebar-3-nac-home.html`

### ④.1 SIDEBAR BA NẤC — MARKER `sidebar3Nac`
| Nấc | Rộng | Thấy gì |
|---|---|---|
| **Thu** | dải ~28px | vạch dọc + **nhãn xoay đứng** + tay cầm. **KHÔNG được biến mất** |
| **Vừa** ⭐ mặc định | ~240px | icon **kèm chữ**, các nhóm chính, **số đếm** |
| **Rộng** | ~320px | thêm nhóm phụ · xem trước · số đếm chi tiết |

⚠️ **KHÔNG có nấc "chỉ icon trần"** — phạm chốt 03/08. Nấc hẹp nhất vẫn phải đọc được là mục gì.
Chuyển nấc phải **êm** (180–220ms, chỉ `transform`, không animate `opacity` — luật G1), và
`prefers-reduced-motion` thì đổi thẳng.

### ④.2 TAY CẦM DÙNG CHUNG — MARKER `PanelHandle`
Dựng **một** khuôn tay cầm, dùng cho cả 3 nấc. Đây là mẫu Hoà chốt 07/08 cho **toàn app**:
dải dọc mảnh sát mép, giữa có mũi tên `›`/`‹`, chiếm gần 0 diện tích, vị trí đoán được, một cú bấm.
Vẽ đủ trạng thái: thường · hover · đang kéo · bàn phím focus.
Ghi rõ trong trang: nó sẽ dùng lại ở panel Thư viện (0/7 panel hiện có tay cầm), 2D, 3D, Trình chiếu.

### ④.3 HOME DẪN THEO VIỆC — MARKER `homeDanViec`
Đổi từ **lưới ô đều nhau** sang **hai cột**:
- **Cột chính (trái, rộng)** — **DÒNG VIỆC ĐANG DỞ**. Mỗi dòng: tên việc · dự án · **bấm vào nhảy
  thẳng đến chỗ đang dừng** (đúng chặng, đúng đối tượng). Ví dụ nội dung: *"Tiếp bản vẽ mặt bằng —
  Căn hộ Thảo Điền · dở 2 ngày"* · *"3 việc đến hạn tuần này"* · *"5 phối cảnh chờ duyệt"*.
- **Cột phụ (phải, hẹp)** — widget: ghi chú nhanh · đồng hồ ánh sáng · vật liệu của tuần.
  Widget **giữ 3 cỡ định sẵn** (1×1 · 2×1 · 2×2) như đã chốt, chỉ thôi làm nhân vật chính.

⚠️ Nội dung mẫu phải **TRUNG TÍNH** — tên dự án bịa, không dùng tên khách thật nào.

### ④.4 SỐ ĐẾM DẪN HƯỚNG — MARKER `soDemSidebar`
Mỗi mục sidebar đeo số việc đang chờ. Quy tắc: **0 thì không hiện số** (đừng bày số 0 gây nhiễu);
số lớn hơn 99 thì hiện `99+`. Màu số **KHÔNG** dùng màu nghĩa nghề (đỏ/vàng/xanh) trừ khi nó thật
sự mang nghĩa đó — mặc định dùng nền trung tính.

### ④.5 TRẠNG THÁI TRỐNG
Vẽ luôn Home lúc **chưa có việc nào** — người dùng mới, dự án mới. Không được để trắng trơn:
phải có lối đi tiếp (tạo dự án · mở tệp · xem thư viện). Đây là ca dễ bỏ quên nhất và cũng là ca
Hoà gặp đầu tiên.

### ④.6 BA NẤC × HAI THEME, XẾP CẠNH NHAU
Trang phải cho **thấy cả 3 nấc cùng lúc** để so, và đủ **2 theme sáng + tối**.

## ⑤ GIAO DIỆN
Chính trang này LÀ phần giao diện của phiếu. Token lấy nguyên văn `app/globals.css`
(nền/chữ/viền/bo góc/`--tap`), **cấm hardcode hex ngoài khối định nghĩa token**, thang bo 6/10/14/20
+ `--r-full`, concentric `rInner = max(4, rOuter − pad)`. NT-8: icon luôn có nhãn.
Lưu `docs/mocks/mock-sidebar-3-nac-home.html`, dòng đầu `<!-- @dsCard group="Khung app" -->`.
**KHÔNG tự gọi DesignSync** (phiên phụ không có tool đó) — T đẩy khi audit.

## ⑥ RÀNG BUỘC
- **KHÔNG git · KHÔNG mở dev server · KHÔNG sửa code app.**
- Chữ theo từ điển (`npm run soi:tu-dien` 0 lệch), cấm chữ "tự động", cấm jargon lộ UI.
- **Không chọn hộ Hoà** — được nêu nhận xét nghề, không được chốt.
- TRIẾT LÝ: **[N1]** người quyết cuối · **[N2]** đơn giản ngoài sâu trong · **[Đ1]** nhìn vào trong
  trước (dùng token + khuôn sẵn có, cấm đẻ hệ mới).

## ⑦ NGHIỆM THU — ĐIỀU KIỆN ĐÍCH (⑥b), trần 5 vòng
`npm run soi:tu-dien` 0 lệch · `npm run check:mocks` 0 vi phạm · mở trang bằng trình duyệt, **bấm
thử đủ 3 nấc ở cả 2 theme**, dán số đo bề rộng thật vào báo cáo.
Chưa đạt thì tự sửa rồi chạy lại; quá 5 vòng thì dừng, nộp bảng vòng-nào-hỏng-vì-gì.

## ⑦b CHƯA CHẮC / CHƯA KIỂM — trống cũng ghi "không có"
## ⑦c HẠN DÙNG KẾT LUẬN

## ⑧ DÂY MÁY
Entry: **`panel-handle-chung`** (nợ 07/08) · **`luong-theo-viec`** (bệnh gốc F1) · **`home-bento`**.
Agent KHÔNG tự sửa registry — T flip sau audit.

## ⑨ ĐỒ NGHỀ
`design:design-system` · `frontend-design` (**quan trọng nhất — Hoà chê "xấu", cần bản vẽ có chủ
kiến chứ không phải mẫu dựng sẵn**) · `design:design-critique` (tự chấm trước khi nộp, trục *ấn
tượng đầu* và *usability* là then chốt) · `design:accessibility-review` (nấc thu phải đọc được bằng
bàn phím và trình đọc màn hình).
⛔ CẤM `anthropic-skills:brand-guidelines` (áp nhận diện Anthropic, trái luật trung tính của IF).

## Báo cáo
`docs/bao-cao-phien/2026-08-16-P-E-sidebar-home.md`, khuôn **6 phần**.
