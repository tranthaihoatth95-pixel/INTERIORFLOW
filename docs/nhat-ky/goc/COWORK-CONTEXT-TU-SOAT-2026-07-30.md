# Cowork tự soát — lỗi lặp lại, kiến thức thiếu, và cơ chế thẩm mỹ

> Tài liệu này viết cho **chính tôi ở phiên sau**, không phải cho Hoà đọc để khen. Nó ghi lại
> những chỗ tôi sai trong ngày 29-30/07, phân loại theo **kiểu lỗi** chứ không theo sự cố, và
> rút thành luật tự áp.

---

## PHẦN A · Sáu kiểu lỗi tôi lặp lại

### A1 · Tôi tin GREP và SPEC, thay vì đọc KIỂU DỮ LIỆU và ĐIỂM MOUNT

| Sự cố | Hậu quả |
|---|---|
| Khai "theme toggle trùng 3 chỗ" — đếm kết quả grep, không kiểm nơi component được mount. Thực tế `<Header/>` và `<StudioBar>` **không bao giờ cùng tồn tại** | Suýt bắt gộp hai thứ vốn đã đúng |
| Viết ví dụ BOQ *"cửa 900×2200 = 1,98 m²"* dựa vào `BlockDef.h`, **không đọc định nghĩa kiểu**. `h` là **độ sâu mặt bằng**, không phải chiều cao elevation | Sẽ trừ **0,81 m² thay vì 1,89 m²** — sai hơn gấp đôi, **âm thầm**, và là tiền thật. Claude Code bắt được |
| Khuyên "IF làm nguồn sự thật cho task" mà chưa đọc `IF-ARCHITECTURE-COMPASS.md` | Phá luật kiến trúc đã chốt, và phá luôn khả năng bán riêng từng app |

> **Luật A1:** Trước khi viết BẤT KỲ con số ví dụ nào, **đọc định nghĩa kiểu của biến đó**.
> Trước khi nói "trùng lặp", **kiểm điểm mount / điều kiện render**, không đếm grep.
> Grep cho biết *chuỗi ký tự ở đâu*, không cho biết *cái gì chạy cùng lúc*.

---

### A2 · Tôi chọn cái ĐÚNG VỀ LÝ THUYẾT thay vì cái CHẠY ĐƯỢC trên đầu vào thật

| Sự cố | Hậu quả |
|---|---|
| Chọn **điểm tụ Manhattan** để đo ảnh — đẹp về toán, nhưng cần cạnh thẳng dài 2 phương. Render nội thất đẹp thì **rèm, thảm cong, ánh sáng loang**, gần như không có cạnh thẳng | Bấm Render ra **chữ đỏ**. Hoà phải chỉ ra |
| Đề xuất **pill nổi trên canvas** cho "Chạy flow" | Chính pattern đó ở chặng 1 **đã va chạm 3 lần**. Tôi đề xuất thứ sẽ tạo va chạm thứ tư |
| Dựng wireframe rồi trình bày như thiết kế | *"giao diện non nghề này sẽ không bao giờ được sử dụng"* |

> **Luật A2:** Với mọi cơ chế, hỏi trước: **"đầu vào xấu nhất mà người dùng thật sẽ đưa vào là gì?"**
> Rồi thiết kế **thang tụt bậc không-bao-giờ-fail**, đừng thiết kế đường lý tưởng rồi báo lỗi khi
> lệch. Một nút bấm ra chữ đỏ là một tính năng chết.

---

### A3 · Tôi khẳng định trước, tra sau

| Sự cố | Sự thật |
|---|---|
| *"Va chạm quy trình gần như không ai làm"* | Ngành có tên chuẩn: **4D clash**. Đã phân loại từ lâu |
| Viết khổ giấy *"A2/A3/A4"* trong brief | `PaperKey` chỉ có `A3 | A2 | A1`. Không có A4 |

> **Luật A3:** Câu có chữ *"không ai"*, *"đầu tiên"*, *"chưa từng"* — **tra trước khi viết**.
> Nói quá một lần là mất uy tín cho cả những chỗ nói đúng.

---

### A4 · Tôi sửa TRIỆU CHỨNG ĐO ĐƯỢC, bỏ qua CẤU TRÚC

| Sự cố | Cấu trúc thật |
|---|---|
| Ticket `7.3.31` nhắm `fontWeight` làm 3 nút nhảy | Hoà chỉ ra: **cả headbar phải hợp nhất** — hai component riêng mới là gốc |
| Chẩn "overlap do thiếu `overflow-hidden`" | Gốc là **`shrink-0` nằm trong hộp `flex-1 min-w-0`** — hộp co, con không co, tràn ra. Không clip được vì clip cắt popover |

> **Luật A4:** Khi thấy một triệu chứng, hỏi **"cái gì cho phép triệu chứng này tồn tại?"** —
> hỏi ít nhất hai lớp. Sửa lớp đo được là sẽ gặp lại nó dưới hình dạng khác.

---

### A5 · Tôi gây tác dụng phụ ở môi trường không thuộc về mình

**Hai lần** chạy `git status` qua bridge → tạo `.git/index.lock` mà sandbox **không có quyền xoá**
→ **chặn đúng lệnh commit của Hoà**.

> **Luật A5:** Qua bridge chỉ chạy lệnh **thuần đọc**. `git status` · `git diff` **làm mới index
> và tạo lock** — cấm. Chỉ dùng `git log`, `git show`, `grep`, `sed -n`.
> Nguyên tắc rộng hơn: **không bao giờ mutate môi trường mà mình không dọn được.**

---

### A6 · Tôi hỏi thứ đã có đáp án, và giao tiếp thiếu nhãn

Hai luật ra đời từ chính lỗi của tôi:
- **Luật #10** — thứ thuộc tiêu chuẩn nghề thì **tra rồi làm, không hỏi**. (Tôi đã hỏi Hoà có nên
  thêm A4 và khổ dọc — trong khi ISO 216 đã trả lời từ lâu.)
- **Luật #11** — mọi khối dán cho Claude Code **phải có nhãn**. (Tôi gửi nhiều khối liền không nói
  cái nào dùng, cái nào bỏ → *"gửi 1 đống như 2 tin trên ai mà hiểu"*.)
- **Luật #12** — chỉ Claude Code cấp mã. (Tôi và nó cùng gán `7.1.21` → va số.)

---

## PHẦN B · Kiến thức nghề tôi còn thiếu cho dự án này

### B1 · ⭐ Nét bản vẽ kiến trúc — và vì sao nó giải thích luôn phản hồi thẩm mỹ của Hoà

Trong bản vẽ kiến trúc, **thứ bậc được thể hiện bằng ĐỘ ĐẬM NÉT**, không bằng khung viền:

| Lớp | Nét | Nghĩa |
|---|---|---|
| Đường cắt qua vật liệu | **đậm nhất** | mặt phẳng cắt |
| Cạnh vật thể phía sau | vừa | khối |
| Bề mặt, hoa văn, hatch | mảnh | vật liệu |
| Kích thước, ghi chú, trục | mảnh nhất | thông tin phụ |
| **Poché** — tô đặc phần bị cắt | **khối đen đặc** | **"chỗ này bị cắt qua"** |

**Hai hệ quả tôi đã bỏ lỡ suốt phiên:**

**① Kiến trúc sư đánh giá chất lượng bản vẽ bằng thứ bậc nét TRƯỚC KHI đọc nội dung.** Nét đều nhau
= người vẽ không hiểu nghề. Đó là lý do Hoà nói *"nét không xài nét đơn"* — và cũng là lý do
*"bớt frame lại đi"*: **trong ngôn ngữ của họ, phân cấp làm bằng ĐỘ ĐẬM và KHOẢNG TRỐNG, không làm
bằng hộp.** Giao diện đầy khung viền đọc như bản vẽ nét đều — nghiệp dư.

**② Khối tô đặc trong ngôn ngữ của họ CÓ NGHĨA — nó là poché, nghĩa "bị cắt".** Nên một nút tím tô
đặc nằm trên bản vẽ không phải "nút nổi bật", mà là **nhiễu ngữ nghĩa**. Đó chính xác là điều Hoà
phản đối ba lần (`Chạy flow`, `Số liệu` bật, thẻ gu) mà tôi mất tới lần thứ ba mới hiểu.

→ **Luật:** trên nền bản vẽ, trạng thái bật = **viền + tint**, không phải khối đặc. Tô đặc để dành
cho thứ thật sự mang nghĩa.

### B2 · ⭐ Typography tiếng Việt — chỗ này ảnh hưởng trực tiếp tới sản phẩm

Tiếng Việt có **dấu chồng** (dấu phụ + dấu thanh trên cùng một chữ), điều Latin không có. Theo tài
liệu chuẩn của Donny Trương:

| Ràng buộc | Hệ quả cho UI |
|---|---|
| Dấu **không được chạm** chữ liền kề | **Cấm tracking âm**, cấm font condensed cho tiếng Việt |
| Dấu phải **đủ đậm và đủ lớn** ngang với chữ gốc — vì dấu mang **nghĩa**, không phải trang trí | Chữ quá nhỏ làm **mất nghĩa**, không chỉ khó đọc |
| `ư` và `ơ` hay đi cùng nhau (*trương · trường*) — **sừng phải cùng chiều cao** | Font chọn ẩu là chữ nhảy |
| **Chữ HOA rất chật chỗ đặt dấu** | ⚠️ **Hạn chế `text-transform: uppercase` cho tiếng Việt dài.** IF đang dùng ở `StatusBadge` — nên soát lại |
| Dấu ăn lên **không gian phía trên** | **`line-height` tối thiểu 1.5**, không dùng 1.2 kiểu Latin |

**Và đây là lý do sâu của mã `2.2.85`** (bỏ font mono ở nhãn node): font mono ép mọi ký tự vào cùng
bề rộng ô → **dấu tiếng Việt bị ép, chạm nhau, hoặc bị cắt**. Không phải chuyện thẩm mỹ, là chuyện
**đọc sai chữ**.

### B3 · Từ vựng BIM tôi phải dùng đúng

`IFC` (ISO 16739) · `openBIM` · `federated model` (mô hình hợp nhất) · `ISO 19650` ·
`hard clash` / `soft clash` / `4D clash` · `poché` · `single-source publishing` · `preflight`.

---

## PHẦN C · Cơ chế thẩm mỹ — rút từ chính lời Hoà sửa tôi

Đây là phần giá trị nhất, vì nó đến từ **phản hồi thật của một người làm nghề**, không phải sách vở.

| Hoà nói | Nguyên lý đằng sau |
|---|---|
| *"bớt frame lại đi"* | Phân cấp bằng **khoảng trống + độ đậm**, không bằng hộp lồng hộp (B1①) |
| *"nhìn không fresh, ko hiện đại"* | Hộp lồng hộp + khoảng trống giả + góc bo đều = ngôn ngữ template |
| *"cảm giác bị AI chỗ chữ"* | Chữ đều một cỡ, một sắc độ, khoảng cách máy móc. **Người thật viết có nhịp** |
| *"cần êm, hiện tại cực đoan quá"* | Chuyển động phải có **khối lượng**: chậm→nhanh→chậm, không tuyến tính, không giật |
| *"nét không xài nét đơn, các element phải hoà nhập"* | Nhiều độ đậm nét; các phần tử chia chung một nguồn sáng / một khối |
| *"bụi sáng mịn thật mịn, không thô"* | **`arc()` có cạnh cứng.** Hạt phải là sprite gradient dựng sẵn + bloom nhiều lớp |
| *"dòng 2 trở xuống chìm dần vào nền"* | **Mờ dần (`mask-image`) hơn cắt cụt.** Cắt cụt là mất thông tin; mờ dần là còn ngữ cảnh |
| *"icon vòng tròn lồng nhau ko thể hiện tinh thần moodboard"* | Icon phải mang **tinh thần của việc**, không phải hình học trừu tượng cho đẹp |
| *"thẻ gu coi chừng tác dụng ngược vì người dùng thường không hiểu"* | **Đừng dùng ẩn dụ nội bộ ra mặt tiền.** Người ngoài không có từ điển của mình |
| *"khắc khe với chính sản phẩm... người luôn quan trọng cảm xúc, ấn tượng, chất"* | Đối tượng này **đọc được sự cẩu thả trong 2 giây**. Chi tiết nhỏ không phải trang trí — nó là **bằng chứng năng lực** |
| Nhãn debug `span 4` / `nhóm` lọt ra UI | **Không bao giờ để dấu vết công cụ lọt ra mặt tiền.** Một chuỗi debug xoá sạch uy tín cả màn hình |

### Ba luật thẩm mỹ tôi tự áp từ nay

**① Ảnh là chủ, giao diện là tớ.** Ở chặng làm hình, mọi thứ không phải ảnh phải lùi lại — kể cả
nút hành động chính.

**② Không có khối màu đặc nào cạnh tranh với nội dung.** Muốn nhấn thì dùng viền + tint. Tô đặc
dành cho lúc thật sự phải hét.

**③ Trạng thái phải ĐỌC được, không chỉ BẤM được.** Nút không cho biết *"có gì thay đổi chưa"*
là nút nói dối — như `Chạy flow` nhấp nháy rồi không làm gì.

---

## PHẦN D · Checklist tự kiểm trước khi tôi mở miệng

| Trước khi… | Phải làm |
|---|---|
| viết số ví dụ | đọc **định nghĩa kiểu** của biến đó (A1) |
| nói "trùng lặp" | kiểm **điểm mount / điều kiện render** (A1) |
| đề xuất cơ chế | hỏi **"đầu vào xấu nhất là gì?"** + thiết kế thang tụt bậc (A2) |
| viết "không ai / đầu tiên / chưa từng" | **tra** (A3) |
| sửa một triệu chứng | hỏi **hai lớp** "cái gì cho phép nó tồn tại?" (A4) |
| chạy lệnh qua bridge | chỉ **thuần đọc**. Cấm `git status`, `git diff` (A5) |
| hỏi Hoà | có phải **tiêu chuẩn nghề** không? Nếu có → tra rồi làm (Luật #10) |
| gửi khối lệnh | **có nhãn** DÁN CHO / KHI / THAY (Luật #11) |
| đề xuất mã số | **không.** Claude Code cấp (Luật #12) |
| trình bày thiết kế | **đủ frame chưa? có khối đặc nào át nội dung không? có chuỗi debug nào lọt không?** (Phần C) |
| viết tiếng Việt trên UI | `line-height` ≥ 1.5 · không tracking âm · hạn chế chữ HOA · không font mono (B2) |

---

*Cowork tự soát, 30/07/2026. Nguồn tra cứu ghi ở tin nhắn kèm. Tài liệu này nên được đọc lại ở
đầu mỗi phiên làm việc với dự án IDF.*
