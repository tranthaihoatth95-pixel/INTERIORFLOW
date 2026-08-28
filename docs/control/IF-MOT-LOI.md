# Một lỗi — công thức chung, ánh xạ cho cả IF lẫn chúng tôi

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
