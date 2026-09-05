# SOI THỊ GIÁC — 4 MÀN TRÊN APP THẬT (05/09/2026)

> Người chấm: trọng tài thị giác độc lập (skill `if-design-review`). **Không phải người dựng 4 màn này.**
> Khuôn: `.claude/skills/if-design-review/contracts/visual-review-template.md`.

---

## ⓪ ĐỀ BÀI ĐÃ VIẾT LẠI

Người gọi nhờ: *"Chạy skill `if-design-review` để CHẤM 4 màn. Câu hỏi giao cho bạn là: TÌM VI PHẠM VÀ GIẢI THÍCH."*

Skill viết lại thành: **"Tìm vi phạm trên Home · Thiết kế 2D · Thiết kế 3D · Trình chiếu, và giải thích."**

> Đề bài gốc đã ở đúng dạng tìm-vi-phạm — không phải "duyệt giúp". Không cần nắn.
> Người duyệt duy nhất là Hoà; báo cáo này **không** đặt `FINAL HUMAN APPROVED`.

## ① BỀ MẶT ĐANG SOI

| | |
|---|---|
| Màn / route | `/` · `/projects/cmtok3z99…/cad` · `/projects/…/render` · `/projects/…/present` |
| Theme | **sáng** (theme tối CHƯA soi) |
| Bề rộng đo | **1440×900 — chỉ một bề rộng** |
| Trạng thái đăng nhập | đã đăng nhập |
| Dữ liệu | thật, đường `/api/home/summary` (**không** `?demo=` — đã kiểm `do.json`); 1 dự án "Căn hộ Thảo Điền", bản vẽ trống, canvas trống, 0 trang |
| Ảnh đã nhìn | `/tmp/mat-3255/01-home.png` · `02-2d.png` · `03-3d.png` · `04-trinh-bay.png` + 10 vùng phóng to `/tmp/soi/*.png` |
| **Agent đã tự mở ảnh?** | **CÓ** — mở 4 ảnh gốc bằng công cụ Read, rồi cắt+phóng 10 vùng (sharp, `kernel:nearest`) và mở tiếp từng vùng. Không kết luận nào suy từ CSS. |

Nhánh `nen-checkpoint`, HEAD `c95e5e65`, lệch `main` = **0** (⓪b đạt).

## ② HỢP ĐỒNG MÀN

| Màn | Tệp | Trạng thái |
|---|---|---|
| Home | `.claude/skills/if-design/product/home.md` | **CÓ** |
| 2D | `product/2d.md` | **CÓ** |
| 3D | `product/3d.md` | **CÓ** |
| Trình chiếu | `product/present.md` | **CÓ** |

Trích ràng buộc dùng để chấm:
- **Home LÀ** bề mặt vận hành cá nhân; **KHÔNG PHẢI** dashboard · trang phân tích số liệu · nơi trưng bày vật liệu · tường widget. Nhân vật chính = **việc đang dở của người dùng**. Nhóm E (tiện ích cá nhân) **chỉ khi người dùng chủ động bật**.
- **Trình chiếu LÀ** nơi đóng gói, **KHÔNG** sản xuất mới. Nhân vật chính = **trang đang dàn**. Cấm **nút bấm không ra gì**.
- **2D**: trần dải chrome trên canvas = **2** (`examples/BAD/2d-…` §Nguyên tắc thay thế đúng).

## ③ VÍ DỤ XẤU ĐÃ ĐỐI CHIẾU

| Ví dụ | Giống chỗ nào trên ảnh đang soi |
|---|---|
| `BAD/home-tuong-the-23-08.md` | ① *"Cung mặt trời + `3200K` → không việc nào"* ⇒ nay là chip **`15:47 · ánh sáng ban ngày trung tính · 5600K`** (Home, x≈710–1085, y≈65–92). ② *"Biểu đồ mở cổng bằng 'có dự án không' ⇒ ra `3/0 · 0/0 · 0/0`"* ⇒ nay là `Việc đang mở 0` · `Đến hạn hôm nay 0`. ③ *"tiện ích xuất hiện mà người dùng không yêu cầu"* ⇒ nay là kệ **`tôi tự đặt · 2`** |
| `BAD/2d-tuong-thanh-cong-cu.md` | ① nhãn nhóm HOA `VẼ · CẤU KIỆN · SỬA · ĐO & GHI CHÚ` — **y nguyên**. ② cụm ba nút nổi lơ lửng giữa canvas `🖼 ✨ ⬡` — **y nguyên** (x≈700–835, y≈660–698). ③ dock hai hàng — **y nguyên** |
| `BEFORE-AFTER/2d-gop-dai-4-band-xuong-2.md` | dải TRÊN canvas đã 4 → **3**; nhưng trần hợp đồng là **2**, và dải DƯỚI canvas vẫn **4** |
| 3D · Trình chiếu | **KHÔNG có ví dụ xấu cùng loại trong `examples/BAD/**`** ⇒ ghi ⑦b |

## ④ MÁY SOI — phần đo được (app-wide, không riêng 4 màn)

| Lệnh | Kết quả | Ghi chú |
|---|---|---|
| `npm run soi:foundation` | 🔴 **185 vi phạm · exit 1** | `F-ICON-STROKE` 28 · `F-ICON-VIEWBOX` 49 · `F-MOTION-TOKEN` 5 · `F-MAT-VOCAB` 1 · `F-MEP-CUON` 102. Đạt: `F-ICON-SIZE`, `F-NHAN-BIA` |
| `npm run soi:hinh-hoc` | 🟡 exit 0 | 584 tệp · 1136 khai báo bo · **53 ngoài thang (11 giá trị lẻ)** |
| `npm run soi:tu-dien` | 🟢 exit 0 | 0 cặp chữ đá nhau · 🟡 461 chỗ dùng chữ trần (không chặn) |
| `npm run soi:thao-tac` | 🔴 3 lệch · exit 0 | `outline-can-focus-visible` 7× · `cam-hex-inline` **190/trần 190** · `cam-hex-inline-app` **14/trần 14** (hai bánh cóc **đã kịch trần**) |

> **Máy đang ĐỎ ở cấp app.** Theo §3 của skill (*"mắt thấy đẹp không cứu được máy đỏ"*), điều này
> **một mình nó đã chặn PASS** cho cả bốn màn, độc lập với mọi thứ mắt thấy.
> ⚠️ 185 vi phạm là số **toàn repo**, tôi **không** quy hết cho bốn màn này — xem ⑦b.

## ⑤ 23 TRỤC — bảng trạng thái

| Nhóm | Trục | Home | 2D | 3D | Present |
|---|---|---|---|---|---|
| **A** | A1 việc của con người | **TRƯỢT** | **TRƯỢT** | **TRƯỢT** | **TRƯỢT** |
| **A** | A2 nhân vật chính | ĐẠT | ĐẠT | ĐẠT | **TRƯỢT** |
| **A** | A3 cái gì biến mất được | **TRƯỢT** | **TRƯỢT** | ĐẠT | ĐẠT |
| **A** | A4 tường thẻ (mấy/4) | **TRƯỢT 4/4** | ĐẠT 1/4 | ĐẠT 0/4 | ĐẠT 0/4 |
| **A** | A5 SaaS chung chung | **TRƯỢT** | ĐẠT | ĐẠT | ĐẠT |
| **A** | A6 sự thật dữ liệu | **TRƯỢT** | **TRƯỢT** | **TRƯỢT** | **TRƯỢT** |
| B | B1 thứ bậc | TRƯỢT | ĐẠT | ĐẠT | TRƯỢT |
| B | B2 trọng lượng khung viền | TRƯỢT | ĐẠT | ĐẠT | ĐẠT |
| B | B3 mật độ | TRƯỢT (Home phải *roomy*) | ĐẠT (*compact*) | ĐẠT | TRƯỢT (*editorial* → trắng trơn) |
| B | B4 lộ dần | CHƯA CHỨNG MINH | CHƯA CHỨNG MINH | CHƯA CHỨNG MINH | CHƯA CHỨNG MINH |
| B | B5 mềm dẻo workspace | CHƯA CHỨNG MINH (ảnh tĩnh) | CHƯA CHỨNG MINH | CHƯA CHỨNG MINH | CHƯA CHỨNG MINH |
| C | C1 chữ | TRƯỢT | **TRƯỢT (HOA)** | ĐẠT | ĐẠT |
| C | C2 icon | TRƯỢT | TRƯỢT | **TRƯỢT** | ĐẠT |
| C | C3 chất liệu | ĐẠT | ĐẠT | ĐẠT | ĐẠT |
| C | C4 chuyển động | **CHƯA CHỨNG MINH** (ảnh tĩnh) | CHƯA CHỨNG MINH | CHƯA CHỨNG MINH | CHƯA CHỨNG MINH |
| C | C5 cảm ứng | **CHƯA CHỨNG MINH** | CHƯA CHỨNG MINH | CHƯA CHỨNG MINH | CHƯA CHỨNG MINH |
| C | C6 co giãn | **CHƯA CHỨNG MINH** (1 bề rộng) | **TRƯỢT** (cắt cụt ở 1440) | CHƯA CHỨNG MINH | CHƯA CHỨNG MINH |
| C | C7 thuật ngữ | TRƯỢT | **TRƯỢT** | **TRƯỢT** | **TRƯỢT** |
| D | D1 sự thật dữ liệu | **TRƯỢT** | TRƯỢT | TRƯỢT | **TRƯỢT** |
| D | D2 quyền tác giả AI | không áp dụng (0 kết quả AI trên màn) | n/a | n/a | n/a |
| D | D3 truy nguồn | **TRƯỢT** | CHƯA SOI | CHƯA SOI | CHƯA SOI |
| D | D4 khớp Claude Design | **DESIGN MISSING** | có bản vẽ (PARTIAL) — **chưa đối chiếu** | chưa có bản vẽ cho canvas node | **DESIGN MISSING** |
| E | E1 Apple (6 bài) | 4/6 trượt | 4/6 trượt | 3/6 trượt | 4/6 trượt |
| E | E2 tiền lệ nghề | TRƯỢT | TRƯỢT | TRƯỢT | TRƯỢT |
| E | E3 cá tính IF | TRƯỢT | ĐẠT | TRƯỢT | TRƯỢT |

---

## ⑥ PHÁT HIỆN — xếp theo mức hại

### [H1] PH-01 · Trình chiếu: canvas trắng trơn, **không có trạng thái rỗng nào**

- **THẤY GÌ** — `04-trinh-bay.png`: toàn bộ vùng làm việc x≈295–1440, y≈78–870 (**≈1145×790 px, 71% diện tích màn**) là **trắng tuyệt đối**. Không chữ, không nút, không khung. Thanh trên ghi `0 slide`. Ổ trái in một câu xám nhạt *"Chuyển trang ở dải thumbnail dưới canvas."* — **không có dải thumbnail nào dưới canvas**. Thẻ mách nước góc phải dưới bảo *"Chọn loại hồ sơ → máy dàn sẵn…"* — **không có bộ chọn loại hồ sơ nào trên màn**.
- **LUẬT BỊ PHẠM** — Luật **X2** (`docs/00-CHOT.md`, 03/08): *"KHÔNG MÀN NÀO ĐƯỢC CHẶN… Chặng nào trống thì hiện empty state LÀM ĐƯỢC VIỆC TẠI CHỖ"* · `product/present.md` §5: *"Trạng thái rỗng của bảng khối lượng là mẫu tốt nhất repo… nói cái gì thiếu VÀ vì sao"* — khuôn đó có trong repo và **không được dùng ở đúng bề mặt chính** · `product/present.md` §3: nhân vật chính là **trang đang dàn**; ở đây không có trang nào và cũng không có gì thay thế.
- **HẠI CHO AI, MẤT VIỆC GÌ** — KTS vừa dựng xong bản vẽ, mở Trình chiếu để làm hồ sơ nộp. Màn trắng + hai chỉ dẫn trỏ vào hai thứ không tồn tại. Không có đường nào để bắt đầu. Đây là **chặn việc thật**, không phải chuyện thẩm mỹ.
- **SỬA THEO NGUYÊN TẮC NÀO** — *im lặng thắng bịa đặt, nhưng trắng trơn không phải im lặng — nó là bỏ rơi.* Trạng thái rỗng phải nói **thiếu cái gì · vì sao · làm gì tiếp**, và mọi chỉ dẫn phải có thứ để trỏ vào.

### [H1] PH-02 · 2D: hàng công cụ dưới **bị cắt cụt ngay tại 1440**, không có cửa tràn

- **THẤY GÌ** — `/tmp/soi/e-toolbar-phai.png` (phóng 4×, vùng x 1130–1440 · y 710–820): sau nút bắt điểm (nam châm, đang chọn, nền xanh) còn **một nút nữa bị mép phải màn cắt đúng giữa thân**. Không có dấu `›`, không `…`, không cuộn ngang. Hàng 1 của dock rộng hơn khung nhìn.
- **LUẬT BỊ PHẠM** — `truc/C-ngu-phap.md` C6: *"TRƯỢT: … tràn ngang toàn trang"*, và **Recompose, not shrink** (`FULL → ICON+LABEL → ICON → GROUP → OVERFLOW`) — chuỗi này có nấc `OVERFLOW` chính vì ca này · `LUAT-GIAO-DIEN-BAT-BUOC` ④ nghiệm thu **1440×900** — đây đúng bề rộng nghiệm thu của dự án.
- **HẠI CHO AI, MẤT VIỆC GÌ** — người vẽ mất hẳn (ít nhất) một lệnh: nó không nằm trong menu nào khác nhìn thấy được, và không có gì báo là còn lệnh phía sau. Người dùng **không biết mình đang thiếu gì**.
- **SỬA THEO NGUYÊN TẮC NÀO** — hàng lệnh phải **soạn lại** khi hết chỗ, không được **tràn ra ngoài**. Thứ không đủ chỗ phải đi vào một cửa nhìn thấy được, không biến mất.

### [H2] PH-03 · Home: dải 5 ô màu **gõ cứng** nằm dưới tiêu đề khẳng định *"xưởng đang có"*

- **THẤY GÌ** — `/tmp/soi/d-swatch-stat.png`: dưới nhãn `xưởng đang có` là một dải 5 ô màu đặc (nâu · be · lục xám · xám · kem), rồi tới 4 dòng số **thật**. Dự án vừa tạo, **chưa có một vật liệu nào**.
- **BẰNG CHỨNG MÃ** — `components/home/XuongHome.tsx:492-493`:
  `titVon: 'xưởng đang có'` · `daiMau: ['var(--vl-go)','var(--vl-da)','var(--vl-vai)','var(--vl-kl)','var(--vl-son)']`
  — **mảng hằng, không đọc dữ liệu dự án**; dựng ở `:269-270` với **`aria-hidden="true"`**.
  Bốn dòng số bên dưới thì đọc thật (`summary?.stageChart…`, `:495-498`).
- **LUẬT BỊ PHẠM** — `truc/A-sau-cong.md` A6 + `truc/D-su-that.md` D1: chỉ **REAL** được định hình bố cục; đây là **PLACEHOLDER đội lốt dữ liệu** · `truc/E-dang-cap.md` E3 #5: *"màu LUÔN MANG NGHĨA — trượt khi màu dùng để trang trí"* · `product/home.md` §4: Home **không phải nơi trưng bày vật liệu**.
- **HẠI CHO AI, MẤT VIỆC GÌ** — `aria-hidden="true"` là lời tự thú: dải này **không mang tin**. Nhưng nó đứng dưới một tiêu đề nói *xưởng ĐANG CÓ* và **nằm chung khối với bốn con số thật** — bốn con số thật đang **cho nó mượn uy tín**. KTS liếc qua sẽ tin xưởng có sẵn bảng vật liệu. Đây là dạng nói dối nguy hiểm nhất vì nó **trông như đang hoạt động tốt**.
- **SỬA THEO NGUYÊN TẮC NÀO** — trang trí **không được đứng dưới một tiêu đề khẳng định sự thật**, và không được trộn vào khối dữ liệu thật. Không có vật liệu thì **không có dải**.

### [H2] PH-04 · Home: hai dòng cùng chữ *"trong xưởng"* đếm **hai đơn vị khác nhau**, không dòng nào ghi đơn vị

- **THẤY GÌ** — trong cùng một danh sách: `Dự án trong xưởng · 1` và `Đang trong xưởng · 1`. Cùng cụm từ, cùng giá trị, cách nhau hai dòng. Bên cột phải, ô `đang trong xưởng` lặp lại **chỉ mỗi số `1`**, không đơn vị.
- **BẰNG CHỨNG MÃ** — `XuongHome.tsx:495` `'Dự án trong xưởng'` ← `stageChart.reduce(projects)` = **số DỰ ÁN**; `:498` `'Đang trong xưởng'` ← `summary?.today.online.length` = **số NGƯỜI đang online**.
- **LUẬT BỊ PHẠM** — D1 (giá trị phải đọc đúng thứ nó là) · `truc/C-ngu-phap.md` C7 (nhãn phải là ngôn ngữ sản phẩm, không mơ hồ) · `truc/A-sau-cong.md` A3 (*"ô lặp lại điều đã nói ở nơi khác trên cùng màn"*).
- **HẠI CHO AI, MẤT VIỆC GÌ** — người dùng đọc bốn dòng như bốn phép đo cùng họ. Một trong bốn là **hiện diện con người**, ba dòng kia là **khối lượng việc**. Đọc nhầm "có 1 người đang trong xưởng" thành "có 1 việc trong xưởng" là sai về bản chất, và với đội nhiều người thì con số này sẽ **nhảy theo người vào/ra** mà không ai hiểu vì sao.
- **SỬA THEO NGUYÊN TẮC NÀO** — mỗi con số phải nói **đơn vị của nó**; hai phép đo khác họ không được đứng cùng một danh sách với nhãn gần trùng nhau.

### [H2] PH-05 · Home: thẻ tự nói ngược mình — *"chưa có việc nào đang dở"* cạnh *"1 thứ đang chờ bạn"*

- **THẤY GÌ** — trên **cùng một thẻ**: tiêu đề phụ *"chưa có việc nào đang dở trên máy này"* · viên bên phải *"1 thứ đang chờ"* · dòng chân *"**1** thứ đang chờ bạn"* · và trong danh sách ngay giữa thẻ *"Việc đang mở · **0**"*, *"Đến hạn hôm nay · **0**"*. Cột phải thì ghi dự án *"chưa có việc mở"*.
- **BẰNG CHỨNG MÃ** — `XuongHome.tsx:479` `chip: \`${vat.length} thứ đang chờ\`` và `:502` `{ manh: String(vat.length), nhe: 'thứ đang chờ bạn' }` — `vat` là thang chú ý, **dự án vừa tạo cũng là một `vat`**.
- **LUẬT BỊ PHẠM** — D1 loại 3 **FALSE CALM đảo chiều** (`02-FAILURE-LEDGER.md` F-02: khẳng định trạng thái trên một tiền đề đã hỏng) · `product/home.md` §4: *"không mang tin thì không được chiếm chỗ"* · A6 (`0` debris).
- **HẠI CHO AI, MẤT VIỆC GÌ** — "1 thứ đang chờ **bạn**" là câu tạo áp lực. Nó được sinh ra từ việc *tồn tại một dự án*, không phải từ việc *có ai đó cần bạn làm gì*. Người dùng đi tìm thứ đang chờ, không thấy, và lần sau sẽ **thôi tin mọi con số đếm việc trong app**.
- **SỬA THEO NGUYÊN TẮC NÀO** — *có dữ liệu* không đồng nghĩa *có gì để nói*. Cổng phải hỏi **"có gì đang chờ người này không"**, không hỏi **"có bao nhiêu bản ghi"**. (Đây đúng bài học #6 của `BAD/home-tuong-the-23-08.md`, chưa được áp.)

### [H2] PH-06 · Trình chiếu: **UNKNOWN bị quy về một khẳng định** — ổ trái nói chắc trong khi thanh trên nói `0 slide`

- **THẤY GÌ** — `/tmp/soi/j-panel-trai.png`: ổ trái in *"Chuyển trang ở dải thumbnail dưới canvas."* trong khi cách đó ~20px thanh trên ghi **`0 slide`** và canvas trắng trơn.
- **BẰNG CHỨNG MÃ** — `components/present-editor/ho-so-status.ts:19-27`: `coHoSo: boolean | null`, `null` = **"CHƯA BIẾT (chưa hydrate)"**, chính sách khai trong docstring là *"nơi đọc giữ nguyên câu cũ, **không đoán hộ**"*. Nhưng ở `PresentNavigator.tsx:66-74` nhánh là `coHoSo === false ? <câu trung thực> : <câu khẳng định>` ⇒ **cả `true` LẪN `null` đều ra câu khẳng định**. "Giữ nguyên câu cũ" chính **là** đoán hộ, vì câu cũ là một lời khẳng định.
- **LUẬT BỊ PHẠM** — `02-FAILURE-LEDGER.md` **F-02** (*"`calm` là một KHẲNG ĐỊNH… đọc hỏng ⇒ **unknown**, tuyệt đối không map về calm"*) · `product/present.md` §4 *"nút bấm không ra gì"* / chỉ dẫn phải có thứ để trỏ vào.
- **HẠI CHO AI, MẤT VIỆC GÌ** — chú thích ngay trên đoạn mã (`PresentNavigator.tsx:60-64`) **đã mô tả đúng lỗi này từ 20/08** và đã dựng nhánh sửa; nhánh đó không chạy vì `null` rơi vào vế sai. Người dùng nhận một chỉ dẫn tự tin trỏ vào hư không — đúng thứ chú thích nói là phải diệt.
- **SỬA THEO NGUYÊN TẮC NÀO** — **chưa biết là một trạng thái thứ ba**, không được gộp vào trạng thái tốt. Đường thoái lui của một cờ ba giá trị phải là **câu trung thực**, không phải câu lạc quan.

### [H2] PH-07 · 3D: watermark **"React Flow"** của thư viện hiện trong sản phẩm

- **THẤY GÌ** — `/tmp/soi/h-reactflow.png` (phóng 5×): chữ **`React Flow`** xám nằm ở góc trái dưới canvas, x≈110–160 · y≈853–866.
- **BẰNG CHỨNG MÃ** — `components/FlowCanvas.tsx:648` `proOptions={{ hideAttribution: false }}` · `:651` `attributionPosition="bottom-left"`. **Đây là lựa chọn tường minh**, không phải sót.
- **LUẬT BỊ PHẠM** — `truc/C-ngu-phap.md` C7 (từ vựng/định danh kỹ thuật lộ ra UI) · **LUẬT NỀN TẢNG** `CLAUDE.md` (IF là sản phẩm độc lập bán ra — UI mang nhận diện riêng của IF, tách khỏi thứ khác) · E3 (che logo đi vẫn phải là IF — ở đây che logo IF thì còn logo của **hãng khác**).
- **HẠI CHO AI, MẤT VIỆC GÌ** — KTS trình màn này cho khách; trên bản vẽ 3D của họ có tên một thư viện phần mềm. Với định vị "sản phẩm bán ra", đây là vết nhận diện của bên thứ ba trong bề mặt bán hàng.
- **SỬA THEO NGUYÊN TẮC NÀO** — bề mặt sản phẩm chỉ mang nhận diện của sản phẩm và của dự án người dùng. ⚠️ **Việc gỡ hay giữ có mặt pháp lý** (điều khoản attribution của `@xyflow/react`) — theo tiền lệ kỷ luật GPL/`libredwg` ở `docs/LICENSE-NOTES.md`, đây là câu **phải tra điều khoản rồi mới quyết**, không phải câu tự ý gỡ. Tôi nêu vi phạm thị giác; **không** kê đơn.

### [H2] PH-08 · 3D: `0 nút · 0 nối sai` — vụn `0/0`, và "nút" là từ dịch của `node`

- **THẤY GÌ** — thanh trạng thái đáy, mép phải (x≈1345–1440, **bị mép màn cắt một phần**): `0 nút · 0 nối sai`.
- **LUẬT BỊ PHẠM** — A6 liệt kê thẳng **`0/0`** vào danh sách TRƯỢT NGAY · C7 (từ vựng nội bộ lộ UI).
- **HẠI CHO AI, MẤT VIỆC GÌ** — trên canvas trống, hai số 0 không nói được gì ngoài việc chứng minh bộ đếm tồn tại. Nó chiếm chỗ vĩnh viễn ở thanh trạng thái để nói *"chưa có gì"* — điều mà canvas trống đã nói rõ hơn.
- **SỬA THEO NGUYÊN TẮC NÀO** — bộ đếm chỉ được hiện khi **có gì để đếm**; im lặng thắng bịa đặt.

### [H3] PH-09 · Home: **F-01 sống lại** — `5600K` in ra chữ, và máy canh F-01 **không thể nhìn thấy nó**

- **THẤY GÌ** — Home, chip chữ đơn cách ở đỉnh vùng nội dung (x≈710–1085, y≈65–92): **`15:47 · ánh sáng ban ngày trung tính · 5600K`**.
- **BẰNG CHỨNG MÃ** — `components/home/XuongHome.tsx:535` `nhanDaiPhai: \`${dongHo} · ${gio.lightLabel[0]}\`` ← `lib/home/time-of-day.ts:49` `lightLabel: ['ánh sáng ban ngày trung tính · 5600K', …]`.
- **LUẬT BỊ PHẠM** — `02-FAILURE-LEDGER.md` **F-01** (*Symptom: sun arc + `05:00`/`20:00` + **`5600K`** ticks rendered on Home*; **Corrected law**: *"The user **feels** the hour; **never reads it**"*; ngoại lệ **chỉ** cho Wallpaper/Lighting settings) · `product/home.md` §6 chốt 22/08 · `BAD/home-tuong-the-23-08.md` (*"Không ai mở IF để tra nhiệt độ màu của hoàng hôn"*).
- **CƠ CHẾ — đây là phần đáng giá nhất của phát hiện này.** F-01 phạm vi **SYSTEM**, đã *"removed by deletion"* tại **6 chỗ mount**. Máy canh chống tái phát là `components/home/widgets/light-clock.test.ts` — nó `readFileSync` **đúng hai tệp**: `LightClock.tsx` và `DongStudioHome.tsx` (`:27-28`), rồi grep `/\d{4}K|tod\.kelvin/`. **Lỗi mọc lại ở tệp thứ ba (`XuongHome.tsx`) nên máy canh báo xanh.** Và `LightClock.tsx:110` còn ghi *"🔴 22/08 — BỎ HẬU TỐ KELVIN. Con số kelvin là ngôn ngữ THIẾT BỊ"* — **hai tệp cùng một sản phẩm, hai quyết định ngược nhau**, tệp bị canh thì tuân, tệp không bị canh thì phạm.
  Đây đúng họ bệnh mà `CLAUDE-DESIGN-CURRENT.md:39` tự ghi: *"đóng dấu TỆP mà quên CON TRỎ"* — lần này là **canh CHỖ CŨ mà quên CANH LUẬT**.
- **HẠI CHO AI, MẤT VIỆC GÌ** — ngoài việc chiếm chỗ vô nghĩa: nó làm **sổ nợ nói dối**. F-01 đang mang trạng thái đã đóng; ai đọc sổ sẽ tin lỗi này đã hết.
- **SỬA THEO NGUYÊN TẮC NÀO** — máy canh một lỗi phạm vi SYSTEM phải canh **cả bề mặt**, không canh **danh sách tệp đã biết**. Canh theo tệp thì lỗi chỉ cần **đổi chỗ ở** là thoát.

### [H3] PH-10 · Ba màn có **HAI cửa Vitals cùng lúc**

- **THẤY GÌ** — 2D · 3D · Trình chiếu đều có: ① khẩu độ mép trên (`/tmp/soi/a-vitals.png`) **và** ② viên `Vitals ●` ở thanh trạng thái đáy (x≈674–766, y≈874–896). Home chỉ có ①.
- **LUẬT BỊ PHẠM** — chốt 16/08 (`00-CHOT.md`): *"mỗi màn đúng MỘT Vitals — **cấm** vừa có chấm ở thanh tìm kiếm vừa có nút ở trục phải cùng lúc"* · **D-DR1** 04/09: chỗ đứng vật lý là **TOP EDGE**, chỗ khác **SUPERSEDED**.
- **HẠI CHO AI, MẤT VIỆC GÌ** — người dùng phải học **hai** đường tới cùng một trợ lý và không đường nào nói mình khác gì đường kia; và vì D-DR1 đã chốt một chỗ đứng, cái thứ hai là **nợ chưa dọn hiện ra mặt người dùng**. Chạm 3/4 bề mặt ⇒ hỏng kiến trúc, sẽ mọc lại.
- **SỬA THEO NGUYÊN TẮC NÀO** — một năng lực, một chỗ đứng vật lý trên mỗi màn. Khi một chốt bị đè, **thứ bị đè phải bị gỡ**, không được sống song song.

### [H3] PH-11 · 2D: **bảy dải chrome** quanh canvas — trần hợp đồng là **hai**

- **THẤY GÌ** — trên canvas: ① vỏ app (y 0–41) · ② dải tab `Bản vẽ 1 · + · 1 sheet · Gửi sang Trình chiếu` (41–78) · ③ thanh `Mở tệp · Xuất · Bắt đầu · Công cụ bản vẽ · Tỉ lệ · Trình bày` (78–120). Dưới canvas: ④ dock hàng 1 (715–765) · ⑤ dock hàng 2 (770–815) · ⑥ dòng lệnh `⌘ Lệnh…` (838–865) · ⑦ thanh trạng thái (872–900).
- **LUẬT BỊ PHẠM** — `BAD/2d-tuong-thanh-cong-cu.md` §Nguyên tắc thay thế đúng: *"**Trần dải chrome trên canvas: 2.** Muốn dải thứ ba thì phải nêu dải nào biến mất"* · chốt 13/08 kiến trúc tool 3 tầng (tầng ② nhóm lệnh **vẫn chưa dựng**, nên tầng ① vẫn gánh hết).
- **HẠI CHO AI, MẤT VIỆC GÌ** — bản audit 22/08 đếm **7 dải**; hôm nay vẫn **7** (dải nhắc đã gộp, nhưng dòng lệnh và thanh trạng thái tách đôi). Sau hai tuần, **con số không đổi** — nghĩa là cơ chế tích tụ chưa bị chặn, chỉ bị sắp xếp lại.
- **SỬA THEO NGUYÊN TẮC NÀO** — phải **đếm tổng số dải thành một con số trong hợp đồng** và bắt mỗi dải mới khai dải nào biến mất. Không ai đếm thì nó tăng.

### [H3] PH-12 · 2D: nhãn nhóm **HOA TOÀN PHẦN tiếng Việt** — luật có từ 31/07, phạm lần thứ ba

- **THẤY GÌ** — `/tmp/soi/f-toolbar-caps.png` (phóng 3×): `VẼ` · `CẤU KIỆN` · `SỬA` · `ĐO & GHI CHÚ`. Ở cỡ thật, dấu chồng của `Ấ` và `Ệ` trong `CẤU KIỆN` dồn lên đường cao chữ hoa.
- **LUẬT BỊ PHẠM** — `docs/LUAT-CHU-VIET-7.1.23-2026-07-31.md`: **cấm hoa toàn phần**, vì dấu chồng tiếng Việt **mang nghĩa** · đã là vi phạm #7 trong `BAD/2d-tuong-thanh-cong-cu.md` · đã là ca thật *"6 nhãn HOA trên Home 23/08"*.
- **HẠI CHO AI, MẤT VIỆC GÌ** — đọc chậm hơn ở đúng nơi mắt phải liếc nhanh nhất. Nhưng cái hại lớn hơn là **hệ thống**: luật này đã bị phạm ở Home (23/08), được sửa ở Home, và **vẫn nguyên ở 2D** — tức nó được sửa **theo nơi bị bắt**, không sửa theo luật.
- **SỬA THEO NGUYÊN TẮC NÀO** — sửa ở **primitive**, đừng vá ở nơi dùng (bài học #7 của `BAD/home-tuong-the-23-08.md`: *"một chữ `uppercase` trong primitive dùng chung đẻ ra sáu lỗi trên màn"*). Và luật chữ Việt cần **một máy canh**, vì hiện **không máy nào canh nó**.

### [H3] PH-13 · Home: kệ **`tôi tự đặt`** nói người dùng đã tự đặt, nhưng người dùng chưa đặt gì

- **THẤY GÌ** — `/tmp/soi/b-widget-tu-dat.png`: nhãn `tôi tự đặt` · đếm `2` · hai ô `dự án trong xưởng → 1 · 0 việc mở` và `đang trong xưởng → 1`. Tài khoản này vừa tạo đúng một dự án và chưa đụng vào Home.
- **BẰNG CHỨNG MÃ** — nội dung đến từ `bo.widget` ← `widgetTuThat(summary)` (`XuongHome.tsx:548`), tức **do app cấp**; cách bày `bay` mặc định là `KE_RONG = { thuTu: [], an: [] }` (`lib/home/ke-widget-store.ts:35`), tức **người dùng chưa sắp gì**.
- **LUẬT BỊ PHẠM** — `truc/A-sau-cong.md` A1 ô 5: *"'Người dùng có thể bật' ≠ 'người dùng đã chủ động bật'. Widget hiện **mặc định** mà biện minh bằng ô 5 ⇒ vi phạm"* · `product/home.md` §2: *"chỉ xuất hiện khi người dùng **chủ động** bật/ghim. **Không có mục cá nhân nào mặc định**"* · và ở đây nặng hơn một bậc: **chính giao diện đứng ra khẳng định quyền tác giả hộ người dùng**.
- **HẠI CHO AI, MẤT VIỆC GÌ** — hai ô này lặp lại y nguyên hai dòng đã có ở thẻ giữa (PH-04), nên chúng **không thêm tin**; và cái nhãn khiến người dùng tưởng mình đã cấu hình gì đó, nên sẽ không đi tìm chỗ tắt.
- **SỬA THEO NGUYÊN TẮC NÀO** — *"mặc định phải được **thiết kế**, không được **rơi ra**"* (`BAD/home-tuong-the-23-08.md` ⑦). Và nhãn không được khẳng định một hành động mà người dùng chưa làm.

### [H3] PH-14 · Home: dải bốn cột *"việc này đi từ đâu tới"* — giáo lý sản phẩm đóng đinh vĩnh viễn

- **THẤY GÌ** — `/tmp/soi/c-band-4-cot.png`: 4 cột **bằng nhau về bề rộng, trọng lượng, chất liệu, khe**, ngăn bằng vạch dọc mảnh: `bước 1 Vị trí và đề bài` · `bước 2 Ý tưởng và thẻ DNA` · `bước 3 Bản vẽ · khối · phối cảnh` · `bước 4 Hồ sơ giao khách`, kèm viên `một nguồn — ba chặng soi vào`. **Không một chữ nào thuộc về dự án của người dùng.**
- **LUẬT BỊ PHẠM** — A1 (không rơi vào ô nào trong 5 ô hợp lệ) · A3 (xoá đi **không mất khả năng nào**) · **A4 hội đủ 4/4 dấu hiệu tường thẻ** · `BAD/2d-…` ⑤: *"một câu trả lời cho câu hỏi hỏi-một-lần **không được chiếm chỗ vĩnh viễn**"*.
- **HẠI CHO AI, MẤT VIỆC GÌ** — chiếm ~150px đáy màn Home mãi mãi để nói với người dùng một điều họ đã biết sau lần thứ hai mở app. Với `product/home.md` **cửa loại bỏ** (*widget nào khiến người dùng ở lại Home lâu mà không giúp hiểu tình hình · bắt đầu · tiếp tục · quyết định*), dải này trượt trọn.
- **SỬA THEO NGUYÊN TẮC NÀO** — chỗ của lời giới thiệu là **trạng thái rỗng** hoặc **lần đầu dùng**, không phải đồ nội thất thường trực.

### [H3] PH-15 · 2D: cụm ba nút nổi lơ lửng giữa canvas — **y nguyên ca đã viết thành ví dụ xấu**

- **THẤY GÌ** — `02-2d.png`, x≈700–835 · y≈660–698: viên nổi chứa ba biểu tượng không nhãn (thêm-ảnh · lấp lánh · khối), đứng giữa canvas, **không neo vào vật nào** (canvas đang trống, không có gì để neo).
- **LUẬT BỊ PHẠM** — `BAD/2d-tuong-thanh-cong-cu.md` ④ nguyên văn: *"điều khiển không neo vào ngữ cảnh thì trở thành đồ nội thất"* · chốt: điều khiển ngữ cảnh **bám vật đang chọn**, hiện khi có chọn, biến mất khi bỏ chọn · NT-8 (icon giao diện luôn có nhãn) · biểu tượng "lấp lánh" là cửa AI **không nhãn**.
- **HẠI CHO AI, MẤT VIỆC GÌ** — người dùng phải nhớ tuyệt đối *"chỗ đó có ba nút"*, và ba nút này che chính nhân vật chính. Đã bị viết thành ví dụ xấu chuẩn của repo và **vẫn còn** ⇒ theo `02-FAILURE-LEDGER` (*same class twice = process failure*) đây là hỏng ở quy trình, không ở lần này.
- **SỬA THEO NGUYÊN TẮC NÀO** — điều khiển ngữ cảnh neo vào vật; không có vật thì không có điều khiển.

### [H3] PH-16 · Cùng một khái niệm, **bốn cặp tên khác nhau** giữa các chặng

- **THẤY GÌ** — ① 2D: `Bàn vẽ đang trống` ↔ 3D: `Canvas đang trống` (cùng khái niệm, một Việt một Anh). ② 2D: tab `Bản vẽ 1` ↔ bộ đếm `1 sheet` **trên cùng một hàng**. ③ Present: tab `Hồ sơ 1` ↔ bộ đếm `0 slide`. ④ Present: *"dải **thumbnail** dưới **canvas**"* — hai từ Anh trong một câu Việt. Thêm: thẻ mách nước 3D dùng `photoreal`.
- **LUẬT BỊ PHẠM** — C7: *"trộn VI/EN tuỳ tiện trong cùng cụm"*; ngoại lệ tiếng Anh **chỉ** cho tên lệnh dựng hình quốc tế (Array · Bevel · Loft…), `sheet`/`slide`/`canvas`/`thumbnail` **không** nằm trong ngoại lệ đó (chốt 08/08) · E3 (ba chặng không được đọc ra như ba app).
- **HẠI CHO AI, MẤT VIỆC GÌ** — người dùng học một từ ở 2D rồi gặp từ khác ở 3D cho **cùng một thứ**; chi phí học lại do IF gây ra. Đây là bản sao ở tầng **danh từ** của bệnh 5-sổ-lệnh ở tầng **động từ** (`Xoay RO/RO/Q`).
- **SỬA THEO NGUYÊN TẮC NÀO** — một khái niệm, một tên, ở mọi mặt tiền. ⚠️ `soi:tu-dien` hiện **không bắt được** cặp `sheet`/`slide`/`canvas` — xem ⑦b.

### [H3] PH-17 · 3D: chấm **hổ phách không nhãn** cạnh `Việc`

- **THẤY GÌ** — `/tmp/soi/i-dot-viec.png` (phóng 5×): một chấm tròn đặc màu hổ phách (x≈1326–1337, y≈58–69) đứng cạnh nút `Việc ⌄`. Không nhãn, không số, không chú giải. Dự án trống, chưa có việc nào.
- **LUẬT BỊ PHẠM** — C2, loại **"dấu trạng thái"**: *"**bắt buộc kèm nhãn chữ**"* · `if-design/SKILL.md` §6 *"Colour must never be the only carrier of meaning"* · E3 #5 (màu luôn mang nghĩa) — hổ phách trong bảng màu IF là dải `--warning` = *"cần xem lại"*.
- **HẠI CHO AI, MẤT VIỆC GÌ** — nếu nó là cảnh báo: người dùng biết *có gì đó không ổn* mà không biết gì, trên một dự án chưa có gì. Nếu nó **không** phải cảnh báo: nó đang mượn màu cảnh báo cho việc khác — làm hỏng ý nghĩa của màu vàng ở mọi chỗ còn lại trong app.
- **SỬA THEO NGUYÊN TẮC NÀO** — màu không bao giờ là kênh duy nhất; dấu trạng thái phải nói được nó đang nói về cái gì.

### [H3] PH-18 · Khẩu độ Vitals: cùng một vật, **ba toạ độ khác nhau**, và gần như vô hình

- **THẤY GÌ** — `/tmp/soi/a-vitals.png` (phóng 5×): viên bo hai góc dưới, treo từ mép trên, nền **gần trùng màu thanh trên**, giữa là một glyph xám nhạt gồm các vòng tròn chồng nhau. Không nhãn. Tâm ngang: **2D 767 · 3D 767 · Home 840 · Present 861** — cùng một vật **di dời tới 94px** giữa các màn.
- **LUẬT BỊ PHẠM** — chốt 16/08: *"cùng MỘT vật, cùng một hình dạng ở mọi chỗ — nó là một vật DI CHUYỂN theo ngữ cảnh, không phải ba vật giống nhau"* · E3 (chữ ký thị giác phải ổn định) · NT-8 (icon luôn có nhãn) · E1 bài 6 (**đọc được trước đã**).
- **HẠI CHO AI, MẤT VIỆC GÌ** — EXS §7 đặt khẩu độ mép trên làm **chữ ký của sản phẩm**. Một chữ ký mà mắt không thấy và tay không đoán được chỗ thì không phải chữ ký. Người dùng mới **sẽ không biết là có Vitals**.
- **SỬA THEO NGUYÊN TẮC NÀO** — vật mang vai chữ ký phải **nhìn thấy được** và **đứng yên**. Vị trí neo phải là một quy tắc, không phải hệ quả của bố cục từng màn.
- ⚠️ **TRI THỨC MỚI** — tôi **không tra được** luật nào quy định **toạ độ ngang** của khẩu độ. D-DR1 chốt *mép trên*, không chốt *chỗ nào trên mép trên*. Xem ⑦b vùng trống #2.

### [H3] PH-19 · D4 — Home và Trình chiếu: **DESIGN MISSING**

- **THẤY GÌ** — giải qua chỉ mục `docs/mocks/CLAUDE-DESIGN-CURRENT.md` (không chọn theo tên tệp/mtime, đúng §D4):
  - **Home** — mọi bản vẽ đều đã chết: `claude-home-living-canvas-final.html` 🔴 CHẶN + SUPERSEDED · `…-v2.html` ⛔ SUPERSEDED 23/08 · `claude-home-first-use.html` ⛔ REJECTED, *"CẤM dựng, CẤM xin duyệt lại"* · `Home.dc.html` NOT STARTED + SUPERSEDED. Còn lại chỉ là **spec chữ** (`HOME-SPEC-2026-08-23.md`), không phải bản vẽ.
  - **Trình chiếu** — `:74` *"D5 · Present Template Browser — **0 `.dc.html`**; chưa có bộ mẫu thật — HÀNG ĐỢI"*. Đúng bề mặt tôi chụp (chỗ đáng lẽ là bộ chọn mẫu).
- **LUẬT BỊ PHẠM** — `truc/D-su-that.md` D4: **DESIGN MISSING ⇒ H3 — *"MAIN không được tự lấp, phải trả về"***.
- **HẠI CHO AI, MẤT VIỆC GÌ** — hai bề mặt đang chạy trước mắt người dùng **không có bản vẽ nguồn còn hiệu lực**. Mọi tranh luận về chúng sẽ là tranh luận về gu, vì không có vật để đối chiếu. PH-01 (Present trắng trơn) là hệ quả trực tiếp: chỗ trống trên màn **chính là** chỗ trống trong chỉ mục.
- **SỬA THEO NGUYÊN TẮC NÀO** — không có bản vẽ mồ côi, cũng không có **mã nhìn-thấy-được mồ côi**. Bề mặt không có bản vẽ hiệu lực thì trả về khâu thiết kế, không tự lấp bằng CSS.

### [H4] PH-20 · Home: dòng số bị **đường kẻ ngang** chia khối, và hai họ chữ trong một ô

- **THẤY GÌ** — `/tmp/soi/d-swatch-stat.png`: bốn dòng số ngăn nhau bằng **đường kẻ ngang** chạy hết bề rộng. `/tmp/soi/b-widget-tu-dat.png`: trong **cùng một ô**, `dự án trong xưởng` là chữ đơn cách còn `0 việc mở` là chữ thường; và số `1` cỡ lớn đứng **sát** cụm `0 việc mở` cỡ nhỏ, không dấu ngăn ⇒ liếc nhanh đọc thành **"10 việc mở"**.
- **LUẬT BỊ PHẠM** — chốt 16/08 (`00-CHOT.md`): *"không thích đường kẻ ngăn một cái rẹt chia card"* — tách vùng bằng **chuyển sắc/khoảng trống**; ranh giới đã ghi rõ: cấm **đường kẻ NGANG chia card thành khối**, chỉ tha vạch dọc mảnh · C1 (thang chữ, tính nhất quán nội bộ).
- **HẠI CHO AI, MẤT VIỆC GÌ** — hai con số dính nhau là lỗi đọc thật, không phải chuyện gu.
- **SỬA THEO NGUYÊN TẮC NÀO** — hai con số cạnh nhau phải có **khoảng thở hoặc đơn vị** ngăn giữa; một ranh giới chỉ cần một kênh.

### [H4] PH-21 · 2D: lệnh **không làm gì được vẫn đen đậm** — và 3D thì làm ngược lại

- **THẤY GÌ** — `/tmp/soi/g-hang2-trangthai.png`: trên bản vẽ **hoàn toàn trống**, `Hoàn tác` · `Làm lại` · `Xong` · `Huỷ` hiển thị **cùng độ đậm** với `Ortho`, `Lệnh`. Trong khi ở 3D (`03-3d.png`, x≈635–695) `Hoàn tác`/`Làm lại` **đã làm mờ** đúng cách.
- **LUẬT BỊ PHẠM** — chốt 10/08 (`00-CHOT.md`): *"Lệnh chưa đủ điều kiện chạy phải **hiện mờ kèm lý do**, không gán phím giả"* · §9 *"Cấm nút giả bấm không ra gì"* · E2 luật **MỘT SỔ LỆNH** (một lệnh = một nhãn = một ngữ pháp trạng thái).
- **HẠI CHO AI, MẤT VIỆC GÌ** — `Xong`/`Huỷ` không có thao tác nào để kết thúc hay huỷ. Người dùng bấm và không có gì xảy ra — sau vài lần họ **thôi tin trạng thái bật/tắt của toàn thanh công cụ**. Việc 3D làm đúng còn 2D làm sai chứng minh đây là **hai sổ lệnh**, không phải một.
- **SỬA THEO NGUYÊN TẮC NÀO** — một lệnh, một ngữ pháp trạng thái ở mọi mặt tiền.

### [H4] PH-22 · 2D: **một chỉ dẫn in hai lần** trên cùng màn

- **THẤY GÌ** — thẻ giữa canvas: *"Gõ W ↵ để vẽ tường ngay tại chỗ…"*; thẻ mách nước góc phải dưới: *"Gõ W ↵ vẽ tường · F8 khoá ngang dọc"*. Hai vật, cùng một câu, cùng lúc, cách nhau ~400px.
- **LUẬT BỊ PHẠM** — A3 (*"ô lặp lại điều đã nói ở nơi khác trên cùng màn"*) · E1 bài 5 **tiết chế** (*≥2 thứ cùng đòi chú ý ở cùng hạng*).
- **HẠI CHO AI, MẤT VIỆC GÌ** — hai lời mời cạnh tranh khiến người dùng dừng lại để chọn giữa hai thứ giống nhau.
- **SỬA THEO NGUYÊN TẮC NÀO** — một thông điệp, một chỗ.

### [H4] PH-23 · Trình chiếu: ổ trái ~650px trống, chỉ dẫn đứng ở chỗ đáng lẽ là tiêu đề

- **THẤY GÌ** — ổ trái x 75–295: câu chỉ dẫn xám nhạt canh giữa ở đỉnh (chỗ tiêu đề ổ), hai mục danh sách **không nhóm, không tiêu đề nhóm**, rồi **~650px trống** tới đáy.
- **LUẬT BỊ PHẠM** — B3 mật độ (Present phải **editorial**) · `product/present.md` §5 (khuôn trạng thái rỗng phải **giải thích cơ chế**).
- **HẠI CHO AI, MẤT VIỆC GÌ** — người dùng không biết ổ này để làm gì và bao giờ nó có nội dung.
- **SỬA THEO NGUYÊN TẮC NÀO** — chỗ trống là **vật liệu bố cục**, không phải chỗ đợi; nhưng nó phải được **cố ý**, và ổ phải tự khai nó sẽ chứa gì.

### [H4] PH-24 · Home: nền — thứ hợp đồng gọi là *quan trọng nhất* — bị che gần hết

- **THẤY GÌ** — lưới caro xanh lam chỉ nhìn thấy ở một dải hẹp x≈270–1100, **y 45–175** (~130px). Từ y≈175 xuống đáy, các thẻ đục che kín. Vùng trái x 0–265 là xám phẳng, không lưới.
- **LUẬT BỊ PHẠM** — `product/home.md` §6 chốt 23/08: *"**Nền = màn hình nền theo thời gian thực** — thứ **quan trọng nhất** của Home"* · bài học #5 của `BAD/home-…`: *"Nền phải NHÌN THẤY ĐƯỢC mới tính là nền"*.
- **HẠI CHO AI, MẤT VIỆC GÌ** — thứ được chốt là quan trọng nhất còn lại một dải trang trí. Nền vẽ đúng (lưới **lam**, đúng chốt tránh lục 145°) nhưng bị bố cục nuốt.
- **SỬA THEO NGUYÊN TẮC NÀO** — *"màn càng rộng thì khoảng âm càng lớn, không phải thẻ càng dãn"* (chốt 20/08).

---

## ✅ NHỮNG THỨ LÀM ĐÚNG — ghi lại, vì trọng tài không chỉ đếm lỗi

1. **Nút `Nhập từ tệp` mờ kèm lý do thật** (Home) — `XuongHome.tsx:563-565` khai thẳng *"CHƯA CÓ đường tạo dự án thẳng từ tệp ⇒ mờ kèm lý do, không nút giả"*. Đúng luật cấm nút giả.
2. **Kỷ luật dữ liệu mẫu** — `lib/home/xuong-demo.ts` chỉ chạy khi URL có `?demo=`, mọi khung đeo nhãn `demo · dữ liệu mẫu`, và docstring **cấm tường minh** dùng nó làm đường thoái lui khi API lỗi. Ảnh tôi soi đi đường thật. Đây là chỗ repo này làm tốt hơn phần lớn dự án.
3. **Bày lại widget bằng bàn phím** (`XuongHome.tsx:765-…`) — kéo thả không phải kênh duy nhất; cỡ ô định sẵn 1×1/2×1, không kéo giãn tự do. Đúng cả chốt 16/08 lẫn ràng buộc trợ năng.
4. **Trạng thái rỗng của 2D trung thực** — *"Bàn vẽ đang trống"* + phím thật + đường mở tệp. Đúng khuôn.
5. **3D làm mờ Hoàn tác/Làm lại đúng cách** — tiếc là 2D không theo (PH-21).
6. **Canvas 2D vẫn là nhân vật chính** — chrome không nuốt canvas; A2 đạt.
7. **Chú thích mã trung thực** — `PresentNavigator.tsx:60-64` và `ho-so-status.ts` mô tả đúng lỗi của chính mình. PH-06 tìm ra được **là nhờ** sự trung thực đó.

---

## ⑦ KẾT LUẬN

| Màn | Phán | Vì sao |
|---|---|---|
| **Home** | **FAIL** | H2 ×3 (PH-03·04·05) + trượt cổng A1·A3·A4·A5·A6 |
| **Thiết kế 2D** | **FAIL** | H1 (PH-02) + trượt cổng A1·A3·A6 |
| **Thiết kế 3D** | **FAIL** | H2 ×2 (PH-07·08) + trượt cổng A1·A6 |
| **Trình chiếu** | **FAIL** | H1 ×3 (PH-01) + H2 (PH-06) + trượt cổng A1·A2·A6 |

**Bốn màn đều FAIL.** Ba đường độc lập cùng dẫn tới đó, mỗi đường đủ một mình:
1. có H1/H2 trên cả bốn màn;
2. trượt cổng nhóm A trên cả bốn màn;
3. **máy soi đang đỏ** (`soi:foundation` exit 1) — theo §3, máy đỏ thì mắt không cứu được.

⛔ Bản soi này **không** đặt `FINAL HUMAN APPROVED` — chỉ Hoà đặt. Và nó chưa mở đường tới
`INTERNAL PASS` cho màn nào.

**Ba lỗi đáng chữa trước, vì chúng là CƠ CHẾ chứ không phải chỗ hỏng:**
- **PH-09** — máy canh một lỗi phạm vi SYSTEM lại canh theo **danh sách tệp**; lỗi đổi tệp là thoát. Còn giữ kiểu canh này thì mọi lỗi đã đóng đều có thể sống lại mà sổ vẫn báo xanh.
- **PH-19** — hai bề mặt đang chạy **không có bản vẽ hiệu lực**. Không sửa chỗ này thì mọi vòng sau là tranh luận gu.
- **PH-11 + PH-12 + PH-15** — ba lỗi ở 2D đã được viết thành **ví dụ xấu chuẩn của repo** và vẫn còn nguyên. Ví dụ xấu đang không được đọc lúc dựng.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

**Trục chưa soi / chưa chứng minh được:**
- **C4 chuyển động — CHƯA CHỨNG MINH.** Chỉ có ảnh tĩnh. Không đo được `FROM THE CENTER`, morph giữ danh tính, nhịp ms, hay nhánh `prefers-reduced-motion`. **Không màn nào được tính là đạt C4.**
- **C5 cảm ứng — CHƯA CHỨNG MINH.** Không có thiết bị chạm; không đo được đích chạm ≥44px từ ảnh tĩnh (và repo tự khai **chưa có cổng máy** cho vùng bấm — xem vùng trống #7).
- **C6 co giãn — CHƯA CHỨNG MINH ở 3 màn.** Chỉ có **một** bề rộng (1440). Skill ghi rõ: một ảnh ⇒ không được PASS trục này. Riêng 2D thì TRƯỢT vì đã tràn **ngay tại** 1440, không cần bề rộng thứ hai.
- **B4 lộ dần · B5 mềm dẻo workspace — CHƯA CHỨNG MINH.** Không thao tác được panel trên ảnh tĩnh: 9 khả năng ToolWindow (`move · dock · undock · resize · collapse · pin · auto-hide · focus · close`) đều **chưa kiểm**; trạng thái thu/mở có nhớ giữa phiên hay không **chưa kiểm**.
- **D2 quyền tác giả AI — KHÔNG ÁP DỤNG** ở bốn màn này (không có kết quả AI nào trên màn). Chưa kiểm ProposalSheet ở đâu cả.
- **D3 truy nguồn — chỉ soi được Home.** Không tìm thấy `Go-to-Source · Where-Used · Blast-Radius` trên bất kỳ màn nào trong bốn màn, nhưng ba màn kia **chưa có nội dung để truy nguồn**, nên tôi **không** quy thành vi phạm.
- **D4 với 2D và 3D — CHƯA ĐỐI CHIẾU.** Bản vẽ có tồn tại (`2D Kỹ thuật.dc.html` PARTIAL · `3D Dựng khối.dc.html` PARTIAL) nhưng **tôi chưa mở chúng** để phán KHỚP hay DRIFT. Riêng 3D: ảnh tôi soi là **canvas node**, còn bản vẽ tên là *"Dựng khối"* — **có thể là hai bề mặt khác nhau**, chưa xác minh.

**Trạng thái chưa xem:** hover · focus · đang tải · lỗi · `prefers-reduced-motion` · **theme tối (cả 4 màn đều chỉ có theme sáng)** · Home ở bốn trạng thái còn lại (B quay-lại-có-việc-dở · C đầu ngày · D tạt về · E cuối ngày) — tôi chỉ thấy trạng thái gần **A · chưa có gì**.

**Bề rộng chưa đo:** mọi bề rộng ≠ 1440. Đặc biệt **1100px** (bản vẽ Home có artboard 1100) và mọi khổ hẹp.

**Thứ suy chứ không đo:**
- Nút bị cắt ở 2D: tôi **thấy** nó bị cắt, **chưa thử bấm**. Kết luận *"không với tới được"* là suy luận từ chỗ không có cửa tràn nào nhìn thấy được.
- Ý nghĩa chấm hổ phách ở 3D: **chưa truy được ra mã.** Tôi grep không ra nguồn. Nhận định *"hổ phách = dải `--warning`"* là đối chiếu bảng màu, không phải đọc mã của chính chấm đó.
- Đếm dải chrome 2D = 7: phụ thuộc cách đếm. Nếu tính dòng lệnh + thanh trạng thái là **một** dải thì là 6. Bản audit 22/08 đếm chúng là một; tôi đếm hai vì chúng là hai hàng tách rời trên ảnh. **Dù đếm cách nào cũng vượt trần 2.**
- Kệ `tôi tự đặt`: tôi truy được nội dung do `widgetTuThat(summary)` cấp và `bay` mặc định rỗng. Tôi **chưa đọc thân hàm `widgetTuThat`**, nên chưa loại trừ 100% khả năng máy chủ chỉ gửi widget người dùng đã bật ở nơi khác.
- 185 vi phạm `soi:foundation` là số **toàn repo**; tôi **chưa phân bổ** xem bao nhiêu rơi vào 4 màn này. Tôi dùng nó để chặn PASS ở cấp app, **không** dùng làm phát hiện riêng của màn nào.

**Hợp đồng màn / ví dụ xấu thiếu:**
- **Không có `examples/BAD/**` cho 3D và cho Trình chiếu.** Hai màn này tôi chấm **không có ví dụ xấu cùng loại để đối chiếu bằng hình** — đúng thứ skill §1 bước 3 bắt phải có. Đây là lỗ của bộ chuẩn, không phải của màn.
- `examples/GOOD/` có `2d-canvas-truoc.md` và `home-living-canvas.md` — **tôi chưa mở**, vì phiên này là tìm-vi-phạm; nhưng ghi ra để không ai tưởng đã đối chiếu.

**Luật chưa tra được nguồn (ghi là TRI THỨC MỚI, không bịa):**
- Toạ độ ngang của khẩu độ Vitals (PH-18).
- Ngữ pháp trạng thái tắt/mờ **thống nhất giữa các chặng** (PH-21): có luật *"mờ kèm lý do"*, **không** có luật buộc hai chặng dùng cùng một ngữ pháp.

**Vùng trống của bộ chuẩn — quan trọng ngang vi phạm:**

| # | Vùng trống | Bằng chứng |
|---|---|---|
| 1 | **Khi một chốt bị đè, điều khoản nào của nó còn sống?** D-DR1 đè *chỗ đứng* của Vitals; điều khoản *"mỗi màn đúng MỘT Vitals"* gắn vào mô hình đã bị đè ⇒ PH-10 chỉ sai **ngầm**. Không luật nào nói cách kế thừa điều khoản khi superseded. | PH-10 |
| 2 | **Không có luật cho vị trí neo ngang của khẩu độ Vitals** — chốt chỉ nói *mép trên*. | PH-18 |
| 3 | **Trần số dải chrome sống trong một tệp `examples/`, không trong hợp đồng màn** ⇒ không cưỡng chế được, không máy nào đếm. | PH-11 |
| 4 | **Không có luật/máy nào canh cặp nhãn cùng gốc từ nhưng khác ĐƠN VỊ.** `soi:tu-dien` canh nhãn lệch từ điển, không canh *"Dự án trong xưởng" ≠ "Đang trong xưởng"*. | PH-04 |
| 5 | **`sheet` · `slide` · `canvas` · `thumbnail` không nằm trong từ điển máy** — `soi:tu-dien` báo 0 cặp đá nhau trong khi bốn cặp VI/EN đang sống trên màn. | PH-16 |
| 6 | **Luật chữ Việt (31/07) không có máy canh nào** — nên nó bị phạm ở Home (23/08), sửa ở Home, và vẫn nguyên ở 2D. | PH-12 |
| 7 | **Bốn mảng repo TỰ KHAI chưa có chuẩn** (`docs/control/IF-CHUAN-NEN.md` §5, mỗi dòng kèm lệnh kiểm cho ra **0**): **bố cục/lưới · Gestalt · vùng bấm 44px · giá trị token chuyển động**. ⇒ PH-01 (trắng 71% màn), PH-23 (650px trống), PH-24 (nền bị che) tôi **chỉ chấm được bằng hợp đồng màn và ca hỏng cũ**, không bằng ngưỡng đo được. Nếu ai muốn cãi ba phát hiện đó, hiện **không có con số nào để phân xử**. | PH-01·23·24 |
| 8 | **Không có ví dụ xấu cho 3D và Present** (xem trên). | PH-01·06·07·08·17 |

## ⑦c HẠN DÙNG KẾT LUẬN

Bản soi hết hiệu lực khi **bất kỳ** điều nào xảy ra:
- `components/home/XuongHome.tsx` · `components/present-editor/PresentNavigator.tsx` · `components/present-editor/ho-so-status.ts` · `components/FlowCanvas.tsx` · thanh công cụ 2D đổi;
- chỉ mục `docs/mocks/CLAUDE-DESIGN-CURRENT.md` có bản vẽ mới cho Home hoặc Present (PH-19 phải chấm lại);
- trần bánh cóc `soi:thao-tac` hoặc `scripts/foundation-tran.json` đổi;
- token nền / thang chữ mới ban hành.

**Ảnh đã soi chụp lúc:** 05/09/2026 ~15:47–15:49 (giờ trong ảnh Home: `15:47`), nhánh `nen-checkpoint` @ `c95e5e65`, cổng 3255, 1440×900, theme sáng.
