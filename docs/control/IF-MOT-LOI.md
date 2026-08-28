# Một lỗi — công thức chung, ánh xạ cho cả IF lẫn chúng tôi

`Plane: IF` · phân luồng: `docs/control/BOS-PHAN-LUONG-TRI-NHO.md`


> Hoà 28/08: *"xâu chuỗi lại thì phải logic hoá. Áp dụng công thức chung, ánh xạ giải quyết cho
> trường hợp lỗi của chúng ta, lỗi của IF đi."*
>
> **LOOK INSIDE trước (B25):** khuôn này đã có trong repo, hai chỗ, áp hẹp —
> `lib/ui/trang-thai-tai.ts` (bốn trạng thái tải) và kỷ luật `NOT ASSESSED`.
> Tệp này **CONNECT** hai chỗ đó thành một luật, **không** đẻ khuôn mới.

## 1 · Xâu chuỗi — chín triệu chứng, một hình dạng

| Triệu chứng | Khoảng trống thật | Phỏng đoán được trình bày như sự thật |
|---|---|---|
| Bản vẽ nghề: 12.274 đối tượng → 1 khối | IF không nhận ra tường vẽ bằng hai đường | **im lặng dựng 1 sàn** thay vì nói "tôi mất 99,99%" |
| `Chào Hoa` | tên trong DB là `hoa`, không tin được | **tự viết hoa** thành một cái tên sai |
| Vitals `calm` khi không đọc được dữ liệu | không biết hệ thống ra sao | **khẳng định "đã kiểm, không có gì đáng lo"** |
| Dải dự án `2/2` khi có 17 dự án | chỉ nạp được 2 | **`x/y` khẳng định y là toàn bộ** |
| Modal người-mới cho tài khoản 17 dự án | localStorage trống | **suy ra "người mới"** từ trình duyệt, không từ dữ liệu |
| Máy soi rỗng vẫn báo xanh | chưa ai thử làm hỏng nó | **suy ra "đang canh"** từ "có tồn tại" |
| `export DATABASE_URL` rồi ghi nhầm DB thật | không biết đích thật | **suy ra đích** từ ý định |
| `busy_timeout=0` = "chờ mãi mãi" | chưa đo | **suy ra nhân quả** từ một câu chuyện nghe hợp lý |
| Tôi đòi Hoà một tệp DXF | chưa tra `~/Downloads` | **suy ra "bị chặn"** từ việc mình chưa nhìn |

> ## Công thức chung — một câu
> **Mọi lỗi là: lấp một khoảng trống bằng phỏng đoán, rồi trình bày phỏng đoán như sự thật.**

Ba công thức A/B/C không phải ba lỗi khác nhau. Chúng là **ba mặt của cùng một lỗi**:

| | Lấp khoảng trống nào | Bằng gì |
|---|---|---|
| **A** có mặt ≠ có tác dụng | chưa đo **tác dụng** | suy từ **sự tồn tại** |
| **B** đúng thao tác ≠ đúng đối tượng | chưa đo **đích** | suy từ **ý định** |
| **C** khẳng định > bằng chứng | chưa đo **căn cứ** | suy từ **vẻ hợp lý** |

## 2 · Thuốc chung — một câu

> **Ở mọi chỗ có khoảng trống: ĐO, hoặc nói "chưa biết". Không có cửa thứ ba.**
>
> Và **"chưa biết" phải là một giá trị hạng nhất** — có tên, hiện ra được, đi qua được mọi tầng.
> Cấm một giá trị mặc định lặng lẽ đứng thay chỗ nó.

Đây đúng là cơ chế thế giới đã dùng cho **cùng ca bệnh này**, và nó có tên:

| Cơ chế | Ngành | Nó cấm điều gì |
|---|---|---|
| **`Option` / `Maybe`** (Rust · Haskell · Swift) | ngôn ngữ | không có "null lặng" — trình biên dịch **ép** xử lý nhánh "không có" |
| **Ba trạng thái của `NULL`** (SQL) | dữ liệu | `NULL ≠ 0 ≠ ''` — thiếu **không phải** là rỗng |
| **Make illegal states unrepresentable** | thiết kế kiểu | trạng thái "vừa xanh vừa chưa đo" **không dựng được** |
| **Fail loudly · andon cord** (Toyota · Erlang) | vận hành | hỏng thì **kéo còi và dừng**, không đi tiếp im lặng |
| **Data provenance / lineage** | dữ liệu | mỗi giá trị mang theo **nó từ đâu** — không có số mồ côi |

IF đã có mảnh của cả năm, **áp hẹp**: `lib/ui/trang-thai-tai.ts` phân biệt
`trống ≠ chưa quyền ≠ ngoại tuyến ≠ máy chủ lỗi`; kỷ luật verdict phân biệt
`PASS ≠ PARTIAL ≠ NOT ASSESSED`. **Việc còn lại không phải phát minh — là NỐI.**

## 3 · Ánh xạ — lỗi của IF

| Chỗ | Khoảng trống | Nay phải làm gì |
|---|---|---|
| Nhập bản vẽ | không nhận ra phần lớn nội dung | báo **tỉ lệ sống sót**: `vào → ra` theo từng loại, và **cái gì đã mất**. Không có nhập nào "thành công" mà im lặng mất 99% |
| Lời chào | tên không tin được | **hỏi một lần** (`useDisplayName` đã có), không tự viết hoa |
| Vitals | không đọc được dữ liệu | `chưa biết`, không `calm` — **đã sửa 28/08** |
| Dải dự án | chỉ nạp một phần | nói rõ đang đếm gì + phần còn thiếu — **đã sửa 28/08** |
| Người mới | không đo được | `chua-biet` ⇒ **không chào** — đã sửa 28/08 |
| `.idfc` không có `heightMm` | thiếu tham số | `3d-unresolved` — **không đoán chiều cao**, đã nằm trong `IF-DEC-IDFC-3D-001-v0.2` |

## 4 · Ánh xạ — lỗi của chúng tôi

| Chỗ | Khoảng trống | Nay phải làm gì |
|---|---|---|
| Kết luận | chưa chạy thật | `NOT ASSESSED`, kèm **phạm vi** |
| Máy canh | chưa thử làm hỏng | **ca đột biến** bắt buộc — không đỏ được thì nó không canh gì |
| Thao tác chạm dữ liệu | chưa biết đích | **in đích thật**, dừng chờ xác nhận |
| "Chưa có cái này" | chưa tra kho | tra **ba kho** trước; chưa tra thì nói *"tôi chưa tra"*, không nói *"chưa có"* |
| "Bị chặn, chờ Hoà" | chưa tự thử | **tự thử trước.** Cổng chặn giả tốn của Hoà nhiều hơn một lỗi thật |
| Lời chứng | chỉ nhìn một phần | **khai phạm vi mình KHÔNG nhìn** — `IF-TRAT-TU-MOI.md` §III |

## 5 · Một phép thử duy nhất, dùng được ở mọi chỗ

Trước khi hiện bất kỳ giá trị nào — cho Hoà, hay cho người dùng IF:

> **"Số/chữ này tôi ĐO được, hay tôi SUY ra?"**
> Suy ra ⇒ **nói là suy ra**, hoặc **đừng hiện**.

Chín triệu chứng ở §1 đều trượt đúng phép thử này. Không cái nào cần thông minh hơn để tránh —
chỉ cần hỏi một câu trước khi mở miệng.

---

# GỐC BỆNH THẬT — xâu chuỗi lần ba, 28/08

> Hoà hỏi ba lần. Hai lần đầu tôi trả lời **triệu chứng**. Đây là lần thứ ba.

## Tỉ lệ — đo, không kể

| tạo ra | ÷ | nối vào đường có người đi |
|---|---|---|
| 896 tài liệu `docs/` | | **9** trong bộ nạp |
| 16 máy soi | | **5** chạy trong `npm test` |
| 109 phiên chat · 1,3 GB | | **0** từng mở lại |
| 22 lỗi ghi sổ | | **3** công thức rút ra |
| 8 luật `T1–T8` | | **5** có cổng |
| 907 tệp | | **172 mồ côi** |

Cùng một hình dạng, **không sót trường hợp nào**.

## Một câu

> **Chúng tôi tạo ra thứ ĐÚNG, rồi không nối nó vào con đường người ta THẬT SỰ đi.**

`B25` đúng — không trên đường **nạp**. Hiến pháp đúng — không trên đường **hành vi**. Bốn trạng
thái tải đúng — chỉ nối **một màn**. `~/PROJECT` của Hoà **tốt hơn bản MAIN đề xuất** — không nằm
trên đường của **agent nào**. Bản vá `Untitled` 26/08 đúng — nối **một chỗ trong mười bảy**.

**Không cái nào SAI. Tất cả đều KHÔNG ĐƯỢC NỐI.**

## Vì sao nó lặp mãi — cơ chế tự nuôi

**Tạo ra** thì nhìn thấy được: có tệp, có commit, có cái để trình. **Nối dây** thì không sinh ra
gì để nhìn. Nên **ai cũng tạo, không ai nối**. Đống chưa nối càng lớn thì người sau càng không tin
được cái gì, nên **lại tạo tiếp**.

⇒ Đây cũng là lời giải cho câu Hoà nói: *"tôi hay đẻ máy vì các bạn không nhớ."* **Không phải Hoà
tham công cụ.** Vì chưa cái nào được nối nên cái nào cũng như chưa có.

## Quan hệ với công thức cũ

Công thức *"lấp khoảng trống bằng phỏng đoán rồi trình bày như sự thật"* (mục trên) là **HỆ QUẢ**,
không phải gốc: khi thứ đúng **có tồn tại** mà không nằm trên đường ta đi, ta **không tìm ra nó**,
nên ta đoán. **Đoán là triệu chứng. Không nối dây là bệnh.**

## Ca chẩn đoán tự soi — mạnh nhất trong ngày

**11 trên 16 máy soi chưa bao giờ chạy.** Tức chính **cơ chế được rao giảng cả ngày — CỔNG — thì
bản thân nó không được nối** ở 11/16 trường hợp. Một máy canh không nằm trên đường thi công thì
nó không canh gì cả; nó chỉ là một tệp.

## Thuốc — và nó không phải viết thêm luật

> **Cấm tạo ra thứ gì mà không nối nó vào một con đường có người đi.**
> **Nối dây là PHẦN VIỆC, không phải phần dọn dẹp sau.**

Áp ngay trong lượt phát hiện, không hẹn:
· **8 máy xanh đã nối vào `npm test`** (`soi:frontier` · `hinh-hoc` · `tu-dien` · `contract` ·
  `that` · `cam-dien` · `kho-tai-lieu` · `visual-source`). `npm test` nay 48 giây — chậm hơn, và
  đó **đúng là cái giá phải trả**.
· **3 máy đang đỏ** (`check:mocks` · `soi:thao-tac` · `soi:design-school`) **không** nối vào —
  nối lúc này là chặn mọi lane. Chúng thành **nợ CÓ SỐ**: `npm run no:chua-noi` in ra tên chúng.
  **Sửa cho xanh rồi nối; cấm nới luật để nối được.**

## Đã thử BÁC BỎ giả thuyết — 28/08, Hoà yêu cầu

*"Đã test xác suất chưa? Xem bản thân có bị nhầm lẫn trí nhớ nữa không?"*

Khớp mọi ca **không phải là đúng** — đó chính là lớp lỗi C. Nên thử giết giả thuyết:
**nếu "nối dây" là gốc, thì thứ ĐÃ NỐI phải giữ được và thứ CHƯA NỐI phải vỡ.**

| dây loại gì | kết quả đo |
|---|---|
| cổng **CHẶN** — `T8` `F-NHAN-BIA` | **giữ** · 0 vi phạm |
| cổng **CẢNH BÁO** — `T4` `soi:thu-muc` | **vẫn 4 vi phạm** nguyên đó |
| cổng **CẢNH BÁO** — `T5` `L6` | 37 commit / 16 mốc — đỡ hơn, vẫn hụt |
| **không cổng** — `T2` `B25` | 13 vi phạm trong một ngày |

**Giả thuyết không chết, nhưng bị SỬA — và bản sửa quan trọng hơn bản gốc:**

> Không phải *"nối hay không nối"*. Là **"nối bằng dây gì"**.
> **Dây cảnh báo không dẫn điện.**

⚠️ Và đây là chỗ tự soi: **cả ngày 28/08 tôi dựng toàn cổng CẢNH BÁO** — `L6` · `L7` ·
`soi:thu-muc` · `soi:giay-phep` — rồi gọi chúng là **cổng**. Chúng là **nửa sợi dây**. Bảng
`T1–T8` trong `IF-TRAT-TU-MOI.md` ghi chúng là ✅ **có cổng**; đúng hơn phải là 🟡 **có nửa**.

Lý do chọn cảnh báo thay vì chặn đều thật (chặn ngay là đỏ vĩnh viễn cho mọi lane — `F-02`).
Nhưng lý do đúng **không biến nửa dây thành dây**. Đường đi đúng: **cảnh báo là trạm tạm, phải có
ngày hạn để lên chặn** — chưa có ngày hạn thì nó nằm đó mãi, và ta tưởng đã nối.
