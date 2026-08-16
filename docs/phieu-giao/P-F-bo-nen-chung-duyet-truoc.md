# PHIẾU P-F · BỘ NỀN CHUNG — MỘT TRANG DUYỆT GỘP 5 MỤC

> T soạn 16/08. **Đây là phiếu QUAN TRỌNG NHẤT của đợt giao diện** — Hoà chốt đổi thứ tự:
> *"cho mình duyệt tổng quan trước, cái gì chung hệ thống thì cần đồng bộ và duyệt trước."*
> Duyệt bộ nền xong thì mọi màn sau chỉ là áp vào, không phải cãi lại về màu hay khoảng cách.
> **CHỈ DỰNG BẢN VẼ**, không sửa một dòng code app.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ
1. *"Theme sáng hiện tại là nền kem `#f2efe9` + chữ nâu `#211e19`/`#47423a` — tông ẤM ngả VÀNG."*
2. *"`--accent` hiện là `#6a57f5` (góc màu 247° · sáng 65% · rực 89%); `--accent-warm` là `#c79a63` (33°) và tự khai trong comment là ngoại lệ chỉ dùng nút login, nhưng đã lan ra 12 tệp."*
3. *"`--warning` là `#d9a34a` ở 37° — chỉ cách `--accent-warm` 4°."*
4. *"Bản vẽ P-E (`docs/mocks/mock-sidebar-3-nac-home.html`) đã đo ngưỡng kính: 0,82→9,1:1 · 0,68→5,9:1 · 0,62→4,8:1 · 0,35→2,1:1 trượt."*
→ `[XÁC NHẬN | BÁC BỎ | KHÔNG CÓ BẰNG CHỨNG]` + file:dòng. Bác bỏ thì DỪNG, báo T.

## ⓪b TIỀN ĐỀ HẠ TẦNG
`git log --oneline -1` + `git rev-list --count HEAD..main`. Lệch > 0 → DỪNG NGAY, báo T.

## ① BỐI CẢNH — Hoà chê bản vẽ trước, nguyên văn
> *"chưa tối ưu tốt diện tích màn hình, dẫn đến việc thừa trống nhiều. cần gọn sang nhưng song
> cảm giác 1 widget bị giãn. thiết kế sidebar chưa được tối ưu và thông minh. bộ màu theme sáng
> đang dùng làm mình hoạ sến quá, tone tối ok. tone sáng của bạn làm cho mình cảm giác giống mấy
> cái điện thoại trung quốc. card tinh tế hơn, có thể dìm nền lại, lúc đó card được phép thêm
> opacity, xu hướng 1 card có 2 độ trong. nói chung cần nghiên cứu cho ấn tượng thêm."*

**T đọc ra gốc từng lỗi — đọc kỹ, đây là phần quan trọng nhất của phiếu:**

**① "Thừa trống mà lại có widget bị giãn"** — nghe ngược nhau, nhưng cùng một gốc: **lưới không có
nhịp cột cố định**. Widget co giãn tự do thì cái ít nội dung bị kéo dài, còn khoảng giữa lại hở.

**② "Theme sáng sến, giống điện thoại Trung Quốc"** — gốc là nền kem **quá ấm và quá vàng**. Tông
kem vàng trên màn đọc ra "rẻ tiền" chứ không ra quiet-luxury.

**③ "Card hai độ trong"** — T lục lại 3 ảnh Hoà đã gửi (thẻ đặt phòng trên nền đầm lầy · thẻ
Mountains · thẻ Ravello): **cả ba cùng một cấu tạo** — phần trên ôm ảnh thì **TRONG hơn** để ảnh
sống, phần dưới chứa chữ thì **ĐẶC hơn** để đọc được. Một card, hai vùng, hai độ trong.

**④ ĐÍNH CHÍNH LỜI DẶN CŨ CỦA T** — T từng dặn *"nền để nét, card đặc đều"*. Hoà chọn điểm khác
trên cùng đường cân bằng: **DÌM NỀN xuống thì card được phép TRONG hơn**. Cả hai đều đọc được,
nhưng cách của Hoà cho kết quả tinh tế hơn vì card bớt nặng, nền bớt cạnh tranh. **Làm theo Hoà.**

## ② ĐỌC TRƯỚC
- `app/globals.css` — toàn bộ khối token 2 theme (đây là thứ phiếu này định nghĩa lại).
- `docs/mocks/mock-sidebar-3-nac-home.html` (P-E) — bảng ngưỡng kính đã đo, **kế thừa, đừng đo lại**.
- `docs/mocks/mock-so-2-tim.html` — so `#6a57f5` ↔ `#7c3aed`.
- `docs/00-CHOT.md` mục **16/08**: cặp màu đảo vai theo giờ · nền có hình + kính đặc · 5 điều "chất IF".
- `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` (NT-1..18) + `NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` (KB-1..4).

## ③ VÙNG FILE
✅ `docs/mocks/**` (chỉ tệp phiếu này) · `docs/bao-cao-phien/**`
⛔ **KHÔNG sửa `app/globals.css`, không sửa component nào.** Bản vẽ đề xuất giá trị, Hoà duyệt xong
   mới có phiếu áp vào code.

## ④ VIỆC — dựng `docs/mocks/mock-bo-nen-chung.html`
**MỘT trang, năm mục, xem liền mạch** (Hoà chọn cách này để thấy chúng ăn nhập nhau không).

### ④.1 MÀU — MARKER `boMau`
- **Theme sáng: dựng BA BẢN cạnh nhau** trên cùng một khối giao diện, để Hoà so:
  · **trung tính lạnh** — xám ngà rất nhạt, bỏ hẳn sắc vàng
  · **ngà trầm** — vẫn ấm nhưng hạ hẳn độ vàng, chất *giấy cũ* thay vì *kem*
  · **một bản thứ ba do bạn đề xuất** — bạn là người dựng, có quyền nêu hướng thứ ba, nói rõ lý do
  Mỗi bản ghi mã màu nền/chữ/viền + số tương phản đo được.
- **Theme tối GIỮ NGUYÊN** — Hoà nói *"tone tối ok"*. Đừng đụng.
- **Cặp màu nhấn**: tím ↔ đồng, **đảo vai theo theme** (tối: tím chủ · sáng: đồng chủ). Dùng
  `#7c3aed` (tím shadcn Hoà đã ưng) thay `#6a57f5`; theme tối dùng bản sâu `#6d28d9`.
- 🔴 **Kiểm bắt buộc**: đồng `#c79a63` (33°) chỉ cách `--warning` (37°) **4°**. Dựng đúng ca
  **nút chính màu đồng đứng cạnh cảnh báo vàng ở theme sáng** — nhìn phát biết có nhầm không.
  Nhầm thì nêu đường ra (dời `--warning` sang vàng chanh hơn), **không tự sửa globals.css**.

### ④.2 CARD HAI ĐỘ TRONG — MARKER `cardHaiDoTrong`
- Một card, **hai vùng, hai độ trong**: vùng ảnh trong hơn · vùng chữ đặc hơn.
- **Mức dìm nền** tương ứng: nền dìm bao nhiêu thì card được trong tới đâu. Dựng **thang 3 nấc**
  (nền nét/card đặc ↔ nền dìm vừa/card vừa ↔ nền dìm mạnh/card trong) để thấy đánh đổi.
- **Kế thừa ngưỡng đã đo ở P-E**: từ 0,60 trở lên ở theme tối thì chữ còn đọc được; 0,35 thì trượt
  (2,1:1). Với card 2 độ trong, **ngưỡng chỉ áp cho vùng CÓ CHỮ** — vùng ảnh được trong tự do.
  Nói rõ điều này trong trang, vì đây là chỗ dễ hiểu sai nhất.

### ④.3 LƯỚI & NHỊP — MARKER `luoiNhip` (chữa lỗi ① và lỗi thừa trống)
- Khai **số cột cố định** + khoảng thở + kích thước widget theo **cột nguyên** (1×1 · 2×1 · 2×2 như
  đã chốt). **Widget KHÔNG co giãn tự do** — đó là gốc của "widget bị giãn".
- **Vẽ TRƯỚC/SAU**: bố cục thừa trống hiện tại ↔ bố cục theo nhịp cột. Cho thấy cùng lượng nội dung
  mà bản sau **gọn hơn và không chỗ nào bị kéo dài**.
- ⚠️ Cân với chốt cùng ngày *"chừa lề cho nền thở"*: **khoảng trống CÓ CHỦ Ý ≠ thừa trống**.
  Trang phải phân biệt được hai thứ này, vì Hoà vừa chê thừa trống vừa muốn thấy nền.

### ④.4 SIDEBAR THÔNG MINH — MARKER `sidebarThongMinh`
Ba nấc 28/240/320 đã dựng ở P-E — **kế thừa, đừng dựng lại**. Phiếu này chỉ làm phần **THÔNG MINH**,
là thứ Hoà nói còn thiếu. Đề xuất tối thiểu 4 cơ chế, mỗi cơ chế nói rõ *nó tiết kiệm gì cho người dùng*:
- gom theo **việc đang làm**, không gom theo tên chức năng
- mục đang dùng nhiều **nổi lên**, mục chưa dùng được thì **mờ kèm lý do** (không giấu)
- **số đếm chỉ hiện khi > 0**
- nấc thu vẫn **giữ thấy mục đang mở** — thu không được làm mất dấu vị trí
Bạn được đề xuất thêm, nhưng mỗi cái phải trả lời được *"nó đỡ cho người dùng cái gì"*.

### ④.5 CHỮ KÝ THỊ GIÁC — MARKER `chuKyThiGiac`
Hoà nói *"cần nghiên cứu cho ấn tượng thêm"*. Dựng **2–3 phương án chữ ký** — thứ làm người ta nhìn
là biết đây là IF, không lẫn phần mềm khác. Gợi ý một hướng đã có: **"sống lưng ba chặng"** (ba vạch
mã hoá việc đang ở chặng nào) — bạn tự đề xuất ở P-E, phát triển tiếp hoặc thay bằng hướng mạnh hơn.
Ràng buộc: chữ ký phải **mã hoá sự thật của sản phẩm**, không được là hoa văn trang trí.

### ④.6 BẢNG TỰ CHẤM "CHẤT IF"
Cuối trang, tự chấm bộ nền đề xuất theo **5 điều đã chốt**: nền trầm + khoảng thở rộng · đúng một
màu nhấn · bo góc đồng tâm theo thang · chữ tương phản cao không màu mè · màu luôn mang nghĩa.

## ⑤ GIAO DIỆN
Chính trang này LÀ phần giao diện. Thang bo 6/10/14/20 + `--r-full`, concentric
`rInner = max(4, rOuter − pad)`. Mã màu **chỉ được viết trong khối định nghĩa token**, chỗ khác gọi
biến. Lưu `docs/mocks/mock-bo-nen-chung.html`, dòng đầu `<!-- @dsCard group="Nền hệ thống" -->`.
**KHÔNG tự gọi DesignSync** — T đẩy khi audit.

## ⑥ RÀNG BUỘC
- **KHÔNG git · KHÔNG mở dev server · KHÔNG sửa code app.**
- 🔴 **KHÔNG được ra kết quả "sến"** — đây là lời chê đích danh của Hoà. Tránh: chuyển sắc loè loẹt ·
  bóng đổ nhiều tầng · bo góc quá tròn · màu ấm bão hoà cao · hiệu ứng lấp lánh.
- **Không chọn hộ Hoà** ở mục có nhiều phương án (theme sáng, chữ ký). Nêu nhận xét nghề, không chốt.
- Nội dung mẫu **trung tính** — tên dự án bịa, không tên khách thật.
- TRIẾT LÝ: **[T5]** người quyết cuối · **[N2]** đơn giản ngoài sâu trong · **[Đ2]** nhìn vào trong trước.

## ⑦ NGHIỆM THU — ĐIỀU KIỆN ĐÍCH (⑥b), trần 5 vòng
`npm run soi:tu-dien` 0 lệch · `npm run check:mocks` không thêm đỏ so với baseline · mở trang bằng
trình duyệt, **đo bề rộng thật** các khối và **dán số tương phản** của cả 3 bản theme sáng vào báo cáo.

## ⑦b CHƯA CHẮC / CHƯA KIỂM — trống cũng ghi "không có"
## ⑦c HẠN DÙNG KẾT LUẬN

## ⑧ DÂY MÁY
Entry: **`he-mau-2-lop`** · **`hinh-hoc-ap-thang`** · **`dong-bo-ds-mat`**. Agent KHÔNG sửa registry.

## ⑨ ĐỒ NGHỀ
`frontend-design` — **dùng nghiêm túc, đây là phiếu chống "sến" và chống "trông như mẫu dựng sẵn"**,
đúng bài của skill này · `design:design-system` (đây là định nghĩa hệ) · `design:accessibility-review`
(3 bản theme sáng đều phải đo tương phản) · `design:design-critique` (tự chấm 5 trục trước khi nộp).
⛔ CẤM `anthropic-skills:brand-guidelines` · `theme-factory` — chúng áp gu ngoài, chọi hệ token IF.

## Báo cáo
`docs/bao-cao-phien/2026-08-16-P-F-bo-nen-chung.md`, khuôn **6 phần**.
