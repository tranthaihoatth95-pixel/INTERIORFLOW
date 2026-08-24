# Thiết kế lấy con người làm gốc — CỔNG BẮT BUỘC

> ⭐ Module quan trọng nhất của IF Design School. Đây là **tri thức MỚI**: kiểm kê 23/08
> (`docs/design-campaign/06-DESIGN-KNOWLEDGE-AUDIT.md`) ghi rõ *"chưa từng có luật"* cho lớp lỗi
> **widget lấp chỗ trống**. Ba lớp lỗi kia là lỗi định tuyến; lớp này là lỗ thật.

## 1 · CÂU HỎI MODULE NÀY TRẢ LỜI
- Tôi sắp thêm một widget / thẻ / panel / nút. Nó có xứng đáng tồn tại không?
- Màn này có dữ liệu đẹp và có chỗ trống — sao lại không được lấp?
- Làm sao bác một đề xuất giao diện mà không rơi vào tranh cãi cảm tính?
- Bắt đầu một màn mới thì hỏi gì trước tiên?

## 2 · LUẬT DÙNG ĐƯỢC NGAY

**H-0 · LUẬT CỐT LÕI.** Một phần tử giao diện **KHÔNG xứng đáng tồn tại chỉ vì có dữ liệu, hoặc
vì có chỗ trống**. Câu hỏi cổng, trả lời trước khi vẽ một pixel:

> **"Nó phục vụ VIỆC GÌ của con người?"**
> Không trả lời được bằng một câu có ĐỘNG TỪ và có NGƯỜI → **không thêm**.

Không hợp lệ: *"để màn đỡ trống"* · *"vì ta có bảng này trong DB"* · *"cho sinh động"* ·
*"đối thủ có"* · *"đẹp mà"*. Hợp lệ: *"KTS đang dở việc, cần quay lại đúng chỗ đã dừng."*

**H-1 · MƯỜI HAI CÂU MỞ MÀN.** Mọi quyết định giao diện bắt đầu bằng bảng này, điền được mới vẽ:

| # | Câu | Vì sao cần |
|---|---|---|
| 1 | **Ai** | KTS nội thất, không phải "người dùng" chung chung |
| 2 | **Việc gì** | một động từ, không phải một danh từ |
| 3 | **Bối cảnh** | bàn làm việc · công trường · trước mặt khách |
| 4 | **Tần suất** | mỗi phút / mỗi ngày / mỗi dự án / một lần |
| 5 | **Độ khẩn** | chặn việc khác hay không |
| 6 | **Giá của lỗi** | mất 3 giây hay mất một buổi làm |
| 7 | **Tải nhận thức** | người dùng phải giữ bao nhiêu thứ trong đầu |
| 8 | **Cái gì nên biến mất** | lúc không dùng thì nó có được lùi/ẩn không |
| 9 | **Cái gì phải lùi được** | thao tác nào bắt buộc undo |
| 10 | **Máy phải nhớ gì** | thứ người dùng không nên khai lại lần hai |
| 11 | **Đường tự nhiên nhanh nhất** | đếm số cú bấm của đường đó |
| 12 | **Trên cảm ứng khác gì** | xem `touch-ipad.md` |

**H-2 · TẦN SUẤT QUYẾT ĐỊNH VỊ TRÍ, không phải độ quan trọng cảm tính.** Việc làm mỗi phút phải
nhanh nhất; việc làm mỗi dự án chỉ cần **tìm thấy được**, không cần thường trực.

**H-3 · GIÁ CỦA LỖI QUYẾT ĐỊNH MA SÁT.** Lỗi rẻ + lùi được ⇒ cho làm ngay, có Undo, **không hỏi
xác nhận**. Lỗi đắt + không lùi được ⇒ mới được chặn bằng xác nhận. (Luật *Undo trước, hỏi sau*,
`00-CHOT` 11/08 CẤP 1.)

**H-4 · MÁY NHỚ THAY NGƯỜI.** Thứ người dùng đã chọn một lần (nấc panel, kiểu xem, cỡ thẻ, bố cục
đã kéo) thì máy nhớ. Nhưng phân đúng chỗ lưu: **VẬT + DÂY CHUYỀN lưu chung** (ai mở cũng thấy) ·
**CÁCH BÀY TRÊN MÀN lưu theo máy** (`00-CHOT` 16/08 · `IF-KIEN-TRUC` §9).

**H-5 · MỘT MÀN — MỘT NHÂN VẬT CHÍNH.** Mọi thứ đều nổi bật = FAIL (`IF-MOTION-VISUAL-LAW` §III:
1 Primary + 1 Secondary, còn lại tertiary). Chi tiết ở `visual-hierarchy.md`.

**H-6 · KHÔNG BAO GIỜ BẮT ĐẦU TỪ COMPONENT.** Cấm mở đầu bằng *"ta đã có `WidgetCard`, nhét gì
vào đây"*, hay bằng hình dạng DB. Bắt đầu từ H-1, ra tới component sau.

## 3 · VÌ SAO — cơ chế con người
Sự chú ý là **ngân sách cố định**. Mỗi vật thêm vào màn lấy đi một phần ngân sách đó từ việc
người dùng thật sự tới đây để làm. Một widget "vô hại vì chỉ hiện thông tin" **không hề vô hại**:
nó vẫn bị quét mắt, vẫn phải đánh giá là "không liên quan", vẫn tốn một nhịp.

Và nó tốn **mỗi lần mở màn**, trong khi việc gỡ chỉ tốn một lần. Đó là lý do cổng đặt ở đầu vào,
không đặt ở vòng dọn dẹp: dọn sau thì phải cãi nhau về gu, chặn trước thì chỉ cần một câu hỏi.

Nguồn chống lưng trong repo: `SKILL.md §0 ROOT LAW` — *"The designer should spend attention on the
design problem, not on operating InteriorFlow."*

## 4 · CA HỎNG THẬT CỦA IF

### Ba ca mẫu — thuộc lòng ba ca này
| Vật | Việc của con người | Phán |
|---|---|---|
| **"Vật liệu của tuần"** | *(không có)* — không ai bắt đầu buổi làm bằng việc xem một vật liệu ngẫu nhiên | ⛔ **LOẠI** |
| **"Ghi chú nhanh"** | **có điều kiện**: người dùng **chủ động ghim** một ghi chú ⇒ hợp lệ. Máy **tự nhét** cho đỡ trống ⇒ LOẠI | ⚠️ **tuỳ nguồn gốc** |
| **"Tiếp tục việc dở"** | có phiên dở thật, KTS quay lại đúng chỗ đã dừng | ✅ **giá trị cao** — là Primary của Home |

Ca "Ghi chú nhanh" là ca đắt nhất: **cùng một widget, hai phán quyết khác nhau**, phân biệt bởi
*ai khởi xướng*. Vật do người dùng đặt vào là công cụ; vật do máy đặt vào để lấp chỗ là rác.

### F-01 (`02-FAILURE-LEDGER.md`) — đồng hồ ánh sáng trên Home
Cung mặt trời + `05:00`/`20:00` + `5600K` vẽ thành **thiết bị đo** trên Home. Không có việc nào của
con người ở đó: KTS không tới Home để đọc nhiệt độ màu. Luật đã sửa: ánh sáng tác động qua **hướng
sáng · cân bằng ấm/lạnh · độ sáng ambient · độ mềm bóng** — người dùng **cảm** giờ, không **đọc**
giờ. (Kelvin được phép sống trong Cài đặt Ánh sáng, nơi người dùng **cố ý** đi chỉnh.)
Đắt ở chỗ: một chú thích ngay trên đoạn mã đã ghi *"thuộc về không khí, không phải widget"* —
**lời khai và mã nói ngược nhau, và chỉ lời khai được đọc.**

### F-02 — "calm" là một KHẲNG ĐỊNH, không phải sự im lặng
Vitals báo `calm` trong khi hai lần đọc đều 401. `calm` nghĩa là *"đã kiểm, không có gì cần chú
ý"* — tiền đề đã mất. Bài học cho module này: **một trạng thái "khoẻ" vẫn là một lời hứa với con
người; phải kiểm tiền đề của nó còn đứng không.**

### 23/08 — tường thẻ trắng trên Trang chủ
Tiếp-tục · Dự án · Ghi chú · Vật liệu · Cảm hứng bày **ngang trọng lượng** thành lưới thẻ. Sai
kép: sai H-0 (có thẻ không có việc) và sai H-5 (không có nhân vật chính). Xem
`editorial-composition.md`.

## 5 · KIỂM THẾ NÀO
Tự chấm — **một câu trả lời "không" là chưa qua cổng**:
1. Mỗi vật nhìn thấy trên màn có một câu *"phục vụ việc … của …"* có động từ không?
2. Vật nào đang ở đây **chỉ vì có dữ liệu**? Gỡ ra thử — người dùng mất việc gì?
3. Nhân vật chính của màn này là gì? Che nó đi, màn còn lý do tồn tại không?
4. Việc làm nhiều nhất có phải đường ngắn nhất không? Đếm số cú bấm.
5. Thao tác nào không lùi được? Nó có xác nhận không? Thao tác lùi được có **bị hỏi thừa** không?
6. Máy có bắt người dùng khai lại thứ họ đã chọn lần trước không?

Máy soi: chưa có máy nào bắt được lớp lỗi này (nó là câu hỏi ngữ nghĩa). **Cổng là người chấm
độc lập**, không phải người vẽ tự chấm — xem `06-DESIGN-KNOWLEDGE-AUDIT.md` mục THIẾU.

## 6 · ĐÀO SÂU
- `.claude/skills/if-design/SKILL.md` §0 ROOT LAW · §16 ACCEPTANCE
- `docs/design-campaign/02-FAILURE-LEDGER.md` — F-01, F-02, F-10
- `docs/design-campaign/06-DESIGN-KNOWLEDGE-AUDIT.md`
- `docs/nc/NC-HOME-CAM-NHAN-*.md` · `docs/design-campaign/dna/HOME-SPEC-2026-08-23.md`
- `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` — Home = Personal Work OS, hero = Resume
