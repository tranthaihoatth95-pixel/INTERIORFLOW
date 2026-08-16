# P-P · Kịch bản sidebar — hệ router toàn app

> Phiên phụ P-P · 16/08 · mốc `544999f` (`HEAD..main` = 0) · phiếu
> `docs/phieu-giao/P-P-kich-ban-sidebar-router-toan-app.md`
> Vùng ghi: đúng **2 tệp mới**. **0 dòng code bị sửa.**

---

## 1 · Tổng quan

Đi từ **route thật** (`find app -name page.tsx` = **25 tệp**) thay vì từ sổ, và phát hiện bài toán
sâu hơn phiếu đặt: **“stage cấp app” hôm nay được thi công BA KIỂU không tương thích** — màn thật ·
tấm mở đè · panel trong `/`. Đó mới là gốc của chuyện “bấm vào thì trống”, không phải chuyện
app-vs-dự-án.

Dựng **4 kịch bản khác nhau về CƠ CHẾ** (không phải 4 lớp sơn), mỗi cái đủ **3 nấc × 2 trạng thái
dự án** = 24 mẫu so được cạnh nhau, chấm bằng thước `simpleCoChiTiet` có sẵn.

Bắt được **10 chỗ lệch sổ↔route↔chốt**, trong đó **3 chỗ là ứng viên trực tiếp cho câu “có mục bị
sai lệch” của Hoà**.

---

## 2 · Chi tiết từng mục

### 2.1 · V1 — danh sách stage, và ba loại không được xếp ngang hàng

25 route ≠ 25 stage. Phân loại đo được:

| Nhóm | Số | Gồm |
|---|---|---|
| **Cấp APP** | 12 mục | 9 màn thật · 2 tấm đè · 2 panel (Home đếm 1 lần) |
| **Cấp DỰ ÁN** | 6 | `overview` · `notebook` · `cad` · `render` · `present` · `photo` |
| **Ngoài vỏ** | 3 | `/intro` · `/login` · `/share/[token]` |
| **Redirect lịch sử** | 3 | `/cad-editor` · `/photo-editor` · `/present-editor` |
| **Rác chờ xoá** | 1 | `/dev-bench-3d-2` (tự khai *“KHÔNG phải sản phẩm — xoá sau khi đo xong”*) |

🔴 **Cột LOẠI là phần quan trọng nhất**, vì ba loại này không được xếp ngang hàng trên sidebar:

| Loại | Là gì | Ai thuộc nhóm | Bằng chứng |
|---|---|---|---|
| **màn thật** | có `Navigator` + `Screen`, bọc `AppShell` | Home · Files · Gallery · Ingest · Vật liệu · Màu · Bảng việc · Cài đặt | `MaterialsNavigator`+`MaterialsScreen`, `FilesNavigator`+`FileManagerShell`… |
| **tấm đè** | mở chồng, **không rời màn** | Thư viện · Chat | `app/library/page.tsx:27,32` gọi `markOpenLibraryOnLoad()` rồi `return null` |
| **panel trong `/`** | ô trong Home | Tổng quan · Dự án & Flow | `AppLogoMenu.tsx:63,68` |

### 2.2 · Mười chỗ lệch — ba cái đáng nghi nhất cho câu hỏi của Hoà

| # | Lệch | Bằng chứng |
|---|---|---|
| **8** 🔴 | **Vật liệu · Màu đang là stage, chốt 07/08 nói phải là KỆ trong Thư viện** | Chốt: *“gộp HẾT về một tấm, chia kệ theo loại — Cấu kiện · Vật liệu · Node · Ảnh tham chiếu”*; entry `color-system-packs` gọi Pantone/Jotun/Dulux là **gói nạp**. Code: hai màn thật ngang hàng Files. Và lối vào `/colors` **nằm trong header Vật liệu** — code đã tự thừa nhận Màu là ngăn của Vật liệu, chỉ chưa đi hết đường. |
| **1** 🔴 | **Ba cơ chế mount không tương thích** | xem bảng 2.1 |
| **9** 🔴 | **“Cài đặt” có phải stage làm việc không** | Màn thật về cơ chế, nhưng **không sản xuất gì, không đọc/ghi `.idf`, không nằm trong luồng 0→3**. Ba stage kia đều *nuôi* việc thiết kế. **Không có bằng chứng trong sổ để quyết** — P-P không tự quyết. |
| **2** | **Tiền đề ② của T đúng một nửa: Chat KHÔNG phải “chưa dựng mặt”** | `ChatPanel.tsx` **171 dòng, ĐÃ MOUNT** ở `HomeScreen:117` + `PresentStageScreen:113`. Đúng là không có route, nhưng **có mặt** — vấn đề thật là chỉ sống ở **2/25 màn** và **không địa chỉ hoá được**. |
| **10** | **“Tổng quan” mang BA nghĩa** | `/` (studio) · `/projects/[id]/overview` (dự án) · mục panel `AppLogoMenu:61`. Bản vẽ đề xuất tách tên: **Home** (app) ↔ **Tổng quan** (dự án). |
| **3** | **4/6 workspace sổ khai ở CẤP 0.5 không có route** | Chỉ Files + Bảng việc khớp thẳng route. |
| **4** | **5 stage có route thật mà sổ không nhắc** | `/materials` `/colors` `/library/gallery` `/library/ingest` `/settings`. Ai dựng sidebar theo sổ sẽ **bỏ sót đúng 5 mục này**. |
| **5** | **Comment `AppLogoMenu.tsx:48-49` sai với code ngay dưới nó** | Khai *“4 mục còn lại chỉ mở panel/sheet, ở nguyên route”* — nhưng `:72` Files gọi `router.push('/files')`. |
| **6** | **`[id]` nhận CẢ `Flow.id` LẪN `Project.id`** | `resolveFlowForRouteId` — ⇒ **không đọc thẳng “đang mở dự án nào” từ URL**; bộ chọn dự án phải hỏi qua `scope`. |
| **7** | **Nền `soi:tu-dien` phiếu ghi 212, đo thật 243** | `soi:hinh-hoc` = 10, khớp. |

### 2.3 · V2 — bốn kịch bản, bốn cơ chế

| KB | Cơ chế giải bài-toán-hai-cấp | Chưa mở dự án | Phạm vi | `StageSwitcher` |
|---|---|---|---|---|
| **A** hai khối | cả hai cấp **cùng lúc, khác VÙNG**, ngăn bằng chuyển sắc | khối dưới **đổi hình** thành ô mời | P2 (cả trong chặng) | **ĐỔI VAI** — giữ thân dock |
| **B** đổi ruột | **một lúc một cõi**, thanh trượt đổi ruột | 5 stage **không tồn tại** | P2 | **BỎ** |
| **C** hai cột | cấp thành **TRỤC KHÔNG GIAN** — cột cõi 28px + cột stage | **không có trạng thái “chưa mở”** | **P1 hoặc P2** | bỏ ở P2, giữ ở P1 |
| **D** phẳng + neo | cấp thành **TRẠNG THÁI** bật/mờ trên một danh sách | 5 stage **mờ + ổ khoá**, không đổi chỗ | P1 | **GIỮ** |

### 2.4 · Hai ràng buộc T gửi giữa chừng — P-P xác minh độc lập, **đúng cả bốn**

| Khẳng định | Kết quả kiểm |
|---|---|
| Dock là ổ mount **DUY NHẤT** của Vitals | ✅ `StageSwitcher.tsx:80-81` ghi nguyên văn *“panel mount DUY NHẤT ở đây”*; grep toàn repo: `<VitalsGesturePanel>` chỉ ở `:435`. `StatusBar.tsx:288` ghi rõ **đã bị GỠ** khỏi đó 05/08. |
| Dock gánh ⌘J | ✅ `StageSwitcher.tsx:212` |
| Dashboard **không có** dock | ✅ `AppChrome` chỉ mount ở `AppShell.tsx:139`; `DongStudioHome` **không bọc** `AppShell` |
| `innerWidth >= 1100` là cạm bẫy | ✅ `DongStudioHome.tsx:200` — sidebar chiếm chiều ngang thật nhưng `window.innerWidth` không đổi ⇒ **bố cục tính sai**; phải đo bằng `ResizeObserver` |

⇒ Thêm **câu ⑥ (phạm vi)** và **câu ⑦ (Vitals đi đâu)** vào bảng của cả bốn kịch bản, và **bảng giá
phải trả cho Vitals**:

| KB | Dock | Nợ Vitals trước khi ship |
|---|---|---|
| A | đổi vai, **giữ thân** | **0** — ổ mount, ⌘J, cử chỉ còn nguyên cả ba |
| B | **bỏ** | **3 việc**: dời ổ mount sang nút Vitals cạnh trục phải · ⌘J vào `hotkey-registry` · cử chỉ kéo-xuống → nhấn-giữ 500ms |
| C | tuỳ phạm vi | **hoãn được** — P1 nợ 0, trả 3 việc khi lên P2 |
| D | giữ | **0** — đổi lại giữ luôn hai trục song song |

### 2.5 · V4 — chấm bằng thước có sẵn (không chế thước thứ hai)

Vật được chấm = **chi tiết mang cơ chế** của mỗi kịch bản.

| | A chuyển sắc | B ô đỉnh cõi | C cột cõi | D độ mờ |
|---|---|---|---|---|
| H1 nói một câu | ĐẠT | ĐẠT | ĐẠT | ĐẠT |
| H2 bỏ đi mất tin | **MẤP MÉ** (trùng tin với hàng neo) | ĐẠT | ĐẠT | ĐẠT |
| H3 đổi theo dữ liệu | ĐẠT | ĐẠT | ĐẠT | **MẤP MÉ** (nhị phân) |
| H4 đọc không cần dạy | ĐẠT | ĐẠT | ĐẠT | ĐẠT |
| **H5 sống ở 28px** | **MẤP MÉ** | **MẤP MÉ** | **ĐẠT MẠNH** | **TRƯỢT** |
| H6 bỏ màu vẫn đọc | ĐẠT | ĐẠT | ĐẠT | **TRƯỢT** (ổ khoá biến mất ở 28px) |
| H7 khung hình tĩnh | ĐẠT | **TRƯỢT** (cơ chế là chuyển động) | ĐẠT | ĐẠT |

**Ba trong bốn “MẤP MÉ” đều rơi vào H5** — xác nhận đúng cảnh báo của phiếu: 28px là chỗ sidebar hay chết.

⚠️ **B trượt H7 vì cơ chế của nó nằm ở chuyển động** ⇒ nếu Hoà duyệt bằng **ảnh trong thư mục
Drive**, B là kịch bản **bị thiệt bởi cách duyệt**, không phải bởi bản thân nó. Nói ra để cách duyệt
không âm thầm loại một phương án.

### 2.6 · Vòng tự đóng ⑦b — 3 vòng, trần 5

| Vòng | Hỏng vì gì | Sửa |
|---|---|---|
| 1 | `--t4` = **3,26** (sáng) / 3,65 (tối), dưới 4,5 — mà đang gánh **chữ mang tin** (phụ đề · nhãn nhóm · nhãn nấc · dòng lý do mục khoá) | nâng mọi chữ trong CSS từ `--t4` → `--t3`; giữ `--t4` cho chấm nền (vật đồ hoạ, ngưỡng 3:1) |
| 2 | Phép đo **sai**: nền trong suốt `--chu-mem` bị tính như đục | viết lại phép đo — **trộn alpha theo ngăn xếp nền** rồi mới tính |
| 3 | Đo đúng ra **2 lỗi thật**: `--t3` trên nền phớt màu = 3,36–3,72 ở theme sáng | `.note.canh th/td` và `.m.on .phu` lên `--t2` |

**Kết quả cuối:**

| Cửa | Kết quả |
|---|---|
| Tương phản chữ | **0 lỗi** cả hai theme (đo có chờ transition ổn định) |
| Tràn ngang 1440×900 | **không** (`scrollWidth` 1272 < 1440) |
| Mẫu dựng | **24** = 4 kịch bản × 3 nấc × 2 trạng thái |
| Bảng trả lời | 8 dòng/kịch bản (5 câu + ⑥ + ⑦ + `StageSwitcher`) |
| Bàn phím | 222/235 mục có `tabindex`; **13 mục thiếu đúng là 13 mục bị khoá** — chủ đích |
| `soi:tu-dien` | 243 → **243**, không tăng |
| `soi:hinh-hoc` | **10**, giữ mốc |
| Hex ngoài khối khai token | **0** |
| Tệp ghi | đúng **2**, đều mới |

---

## 3 · Tổng kết lại vấn đề

Câu hỏi phiếu đặt là *“hai cấp, một thanh”*. Đo xong thì bài toán thật **không phải hai cấp mà là ba
loại**: có thứ là **màn**, có thứ là **tấm đè**, có thứ là **panel**. Xếp chúng ngang hàng trên một
thanh là sai ở tầng cơ chế — và đó nhiều khả năng chính là **“mục bị sai lệch”** Hoà nhìn thấy: mục
*Thư viện* đứng cạnh *Files* trông như hai thứ cùng loại, nhưng bấm vào thì một cái **đưa đi**, một
cái **đè lên**.

Chồng lên đó là **hai chỗ code và chốt đang phân kỳ** (Vật liệu · Màu đáng lẽ là kệ) và **một chỗ
chưa ai định nghĩa** (Cài đặt có phải stage không).

Ràng buộc Vitals đến giữa chừng làm lộ một **đánh đổi thẳng** mà trước đó không ai thấy: kịch bản
nào **đóng được** mâu thuẫn hai-trục thì **phải trả nợ Vitals**; kịch bản nào **không nợ** thì hoặc
giữ dock dưới tên khác, hoặc giữ nguyên mâu thuẫn. **C là cái duy nhất cho phép hoãn quyết định.**

---

## 4 · Đánh giá khách quan

**Được:**
- V1 đi từ route thật nên bắt được 10 lệch, trong đó 3 lệch **không ai từng đối chiếu**.
- Bốn kịch bản khác nhau thật ở cơ chế — kiểm được bằng cột `StageSwitcher` (đổi vai · bỏ · tuỳ · giữ) và cột phạm vi (P2 · P2 · cả hai · P1).
- Vòng 2 bắt được **chính phép đo của mình sai** — nếu không thì đã sửa thiết kế theo số ảo, hoặc khai đạt trên số ảo.

**Chưa được / rủi ro:**
- **Không mở app thật** (phiếu cấm dev server) ⇒ mọi kết luận về điều hướng hiện tại là **đọc mã**.
- **Không xem được bản vẽ ở độ phân giải tử tế** — pane dựng ở ~108×68px và không cắt vùng được. Cấu trúc + tương phản xác minh **bằng DOM**, không bằng mắt. **Đây là lỗ nghiệm thu thật**, T phải soi lại khi đẩy lên Claude Design.
- Cỡ chữ nhỏ nhất là **11px** (`--fs-2xs`) — đúng sàn token của hệ, nhưng dày đặc ở nấc 320.
- **Ký hiệu nghề** dùng trong bản vẽ là **đề xuất mới**, không phải tài sản sẵn có (thanh công cụ hiện 11/11 lucide) — đã khai rõ trong mock.
- Vài số **tự chọn không nguồn**: chiều cao mẫu 398px, khoảng ngăn 26/34px, nút cột cõi 22px. Ba nấc 28/240/320 thì **có nguồn**.

---

## 5 · Hướng xử lý — nhiều góc độ

**Hướng ① — Hoà chọn kịch bản trước, dọn danh sách stage sau.**
Nhanh, có cái để nhìn ngay. Nhưng nếu sau đó Vật liệu · Màu rút về làm kệ thì **số mục đổi**, mà
theo bảng đã đo: A nhẹ đi · B ngắn lại · C **không đổi gì** · D **xấu đi**. Tức chọn kịch bản trước
là chọn trên một danh sách sắp thay đổi.

**Hướng ② — Chốt “mục nào là stage” trước, rồi mới chọn kịch bản.**
Đúng thứ tự nhân quả, nhưng chặn Hoà lại ở một câu hỏi khô (Vật liệu là kệ hay stage?) trong khi
Hoà đang muốn nhìn hình.

**Hướng ③ — Tách làm hai lượt duyệt: lượt hình trước, lượt danh sách sau.**
Hoà duyệt **cơ chế** (bốn kịch bản) ở lượt này, danh sách stage để lượt sau. Được cái Hoà chỉ phải
nhìn một thứ mỗi lần — đúng luật hỏi-gộp. Rủi ro: cơ chế và danh sách **không độc lập** (bảng “số
kịch bản không khoá” chứng minh điều đó), nên có thể phải quay lại.

---

## 6 · Đề xuất hướng tốt nhất — **③, với một điều chỉnh**

Duyệt **cơ chế trước**, nhưng **kèm ngay bảng “số mục đổi thì kịch bản nào đổi theo”** (đã có sẵn
trong mock, mục *“Số kịch bản không khoá”*). Như vậy Hoà chọn cơ chế mà **vẫn thấy được** nó chịu
được thay đổi danh sách tới đâu — không phải chọn mù rồi quay lại.

Chọn ③ thay vì ① vì ① giấu mất sự phụ thuộc; chọn ③ thay vì ② vì ② bắt Hoà trả lời một câu kỹ
thuật trước khi thấy hình, mà **băng thông duyệt mắt của Hoà là tài nguyên khan hiếm nhất**
(cảnh báo đỏ đã ghi trong `DOI-CHIEU-3-TRUONG-PHAI`).

**Ba việc T nên làm khi audit**, xếp theo giá trị:
1. **Soi bản vẽ ở độ phân giải thật** khi đẩy lên Claude Design — P-P không xem được bằng mắt.
2. **Đưa Lệch 8 (Vật liệu · Màu: kệ hay stage) lên Hoà cùng lúc với bốn kịch bản** — nó rất có thể chính là câu trả lời cho “mục nào sai lệch”.
3. **Ghép với kết quả phiên nghiên cứu đối thủ** — P-P chỉ làm phần đo-từ-route, không đợi.

---

## ⑧b · CHƯA CHẮC

| Mục | Nội dung |
|---|---|
| **Có mở app thật không** | **KHÔNG.** Phiếu cấm dev server. Mọi kết luận về điều hướng hiện tại là **ĐỌC MÃ**. |
| **Có xem bản vẽ bằng mắt không** | **KHÔNG ở độ phân giải dùng được** — pane dựng ~108×68px, không hỗ trợ cắt vùng. Cấu trúc, tương phản, tràn ngang, bàn phím đều xác minh **bằng đo DOM**. **Chưa ai nhìn bản vẽ này bằng mắt người.** |
| **Stage không chắc thuộc cấp nào** | `/library/ingest` — có thể thuộc *một dự án*; xếp cấp app **theo route, chưa xác minh nghiệp vụ**. · `/materials` + `/colors` — **code nói stage, chốt nói kệ**, P-P **không chọn hộ**. · `/settings` — có thể là **tiện ích** chứ không phải stage; **không có bằng chứng trong sổ**. |
| **Thước chấm không tới** | Thước đo **một chi tiết**, không đo **chi phí thao tác lặp lại** — thứ phân biệt B và C rõ nhất (một bước ↔ hai bước, trả mỗi lần dùng). Muốn so chỗ đó phải **đếm cú bấm trên đường đi thật**, việc khác. |
| **Số tự chọn không nguồn** | Chiều cao mẫu **398px** · khoảng ngăn **26/34px** · nút cột cõi **22px**. Số liệu phụ đề (218 matId · 41 tệp · 7 việc) là **giả để minh hoạ H3**. Ba nấc 28/240/320 **có nguồn**. |
| **Chưa kiểm** | Không chạy `tsc`/test (không đụng code). Không kiểm bản vẽ ở màn hẹp hơn 1440. Không xác minh phím `Tab` chạy thật — chỉ đếm `tabindex` trong DOM. |

## ⑧c · HẠN DÙNG

Hết đúng khi: ① **Hoà chọn một kịch bản** ⇒ ba cái còn lại phải **khai tử tường minh**, không bỏ
hoang · ② **Chat được cấp route riêng** ⇒ Lệch 2 đóng, mọi ô “③ Chat” đổi nghĩa · ③ **Ba cơ chế
mount được hoà giải** ⇒ câu ⑤ mất lý do tồn tại, bốn kịch bản **phải chấm lại** · ④ **Vitals dời
khỏi dock** ⇒ ràng buộc ⑦ tan, B và C·P2 **hết nợ**, bảng giá phải chấm lại · ⑤ **Vật liệu · Màu
được quyết là kệ hay stage** ⇒ số mục đổi, D đổi nhiều nhất · ⑥ **bản tablet/điện thoại khởi động**
⇒ sidebar vỡ đầu tiên khi màn hẹp, riêng C có hai cột nên đo lại trước nhất · ⑦ **`/dev-bench-3d-2`
bị xoá** ⇒ “25 route” thành 24.

---

## Tệp đã tạo

| Tệp | Nội dung |
|---|---|
| `docs/mocks/mock-kich-ban-sidebar.html` | Bản vẽ — marker `@dsCard group="Kịch bản sidebar"`, 2 theme có nút gạt, token thật, 24 mẫu sidebar |
| `docs/bao-cao-phien/2026-08-16-P-P-kich-ban-sidebar.md` | Báo cáo này |

**0 dòng code bị sửa. Không đụng vùng của hai phiên phụ khác. Không git, không dev server.**
