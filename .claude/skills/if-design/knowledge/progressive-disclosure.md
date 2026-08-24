# Lộ dần thông tin — ba nấc là NHỊP CHUNG của IF

## 1 · CÂU HỎI MODULE NÀY TRẢ LỜI
- Thu gọn và xổ ra khác nhau ở chỗ nào? Có phải chỉ là cao/thấp?
- Cái gì thuộc nấc mặc định, cái gì để dành?
- Mọi thứ có bắt buộc phải có đủ ba nấc không?
- Giấu bớt đi thì người dùng còn tìm thấy không?

## 2 · LUẬT DÙNG ĐƯỢC NGAY

**P-0 · BA NẤC LÀ BA CÔNG NĂNG, KHÔNG PHẢI BA CỠ.** (Hoà chốt 16/08)
> **Mỗi nấc trả lời MỘT CÂU HỎI KHÁC. Nấc to THÊM MỘT LỚP TIN, không phóng to lớp cũ.**

**P-1 · HAI NGÔN NGỮ, KHÔNG PHẢI HAI CHIỀU CAO.**
- **Thu gọn** nói bằng **KÝ HIỆU** — icon + số, đọc lướt một giây, nắm tổng quát.
- **Xổ ra** nói bằng **VĂN BẢN** — tiêu đề + câu chữ, đọc để hiểu.
- ⭐ **Khi xổ ra, ICON BIẾN MẤT.** Có chữ rồi thì icon là nhiễu và là nói-hai-lần.

Ví dụ chuẩn: `🕐 2 ngày · 📐 78 m² · ✓ 3/5` ⟷ *"**Căn hộ Thảo Điền** — dở từ 2 ngày trước · 78 m²
· đã xong 3 trong 5 bước. Đang dựng phối cảnh phòng khách, còn chờ duyệt vật liệu sàn."*

**P-2 · CỬA NGHIỆM THU HAI VẾ** — vế hai mới là vế chặn kéo dãn:
1. Che nấc to đi → **nấc nhỏ vẫn đứng được một mình**, gọn và tươm tất.
2. Nấc to phải có thứ nấc nhỏ **KHÔNG THỂ** có — **không phải** thứ nấc nhỏ có mà bé hơn.

**P-3 · KHÔNG PHẢI THỨ GÌ CŨNG XỨNG BA NẤC.** Mục không có gì để nhìn (vd Cài đặt) thì nấc thứ ba
là kéo dãn ⇒ **bỏ**, để hai nấc. **Ba nấc là NHỊP CHUNG, không phải HẠN NGẠCH.**

**P-4 · NẤC TO NHẤT THƯỜNG LÀ MẶT NHÌN.** Ở nấc rộng nhất, một mục thôi là dòng menu — nó thành
**mặt nhìn của chính nội dung nó dẫn tới** (Kho vật liệu → cột ô tròn vật liệu; một chặng → màn
dang dở; Files → thư mục gần đây + ảnh xem trước).
⚠️ **Nấc-hình có NGƯỠNG DƯỚI đo được**: ảnh xem trước **141px là quá nhỏ** để phân biệt vân sồi
với óc chó (đo 07/08) — nên thang thẻ Thư viện chốt 122 / **168 mặc định** / 232.

**P-5 · BA NẤC ĐÃ ÁP Ở BA CHỖ, giữ chung một nhịp:**
| Nơi | Nấc 1 | Nấc 2 | Nấc 3 |
|---|---|---|---|
| Sidebar | 28px *tôi đang ở đâu* | 240px *tôi đi đâu được* (thêm CHỮ) | 320px *ở đó đang có gì* (thêm HÌNH/TRẠNG THÁI) |
| Cửa sổ công cụ | thu — *có công đoạn này, xong chưa* | vừa — **làm việc** | toàn màn — **làm việc chi li** |
| Card | gọn — ký hiệu | vừa — tiêu đề + vài dòng | đầy — đoạn văn |

**P-6 · GIẤU THÌ PHẢI CÒN TÌM THẤY.** Thứ ẩn phải tới được bằng **ít nhất hai đường**: một đường
nhìn thấy (tay cầm/nhãn) và một đường bàn phím (`⌘K`, phím tắt). ⛔ **CẤM auto-hide** — bị chửi
nhiều nhất ở cả 4 app chuyên nghiệp đã khảo (`SPEC-PANEL-ROLLOUT §2f`).

**P-7 · LỘ DẦN ≠ CẮT NỘI DUNG.** Thu gọn là **nén cách nói**, không phải bỏ bớt sự thật. Thứ chỉ
sống ở nấc to phải khai rõ là **thông tin phụ**; thông tin có hậu quả (cảnh báo, lỗi, số tiền) không
được nằm sau một cú bấm.

**P-8 · CHUYỂN NẤC PHẢI LIỀN MẠCH.** Icon mờ dần và chữ hiện lên **cùng vị trí** — người dùng phải
thấy *nó nở ra*, không phải *nó đổi thành thứ khác* (`IF-MOTION-VISUAL-LAW §0`: nở từ nguồn, không
teleport; xem `motion.md`).

**P-9 · MÁY NHỚ NẤC — nhưng nhớ ĐÚNG CHỖ.** Nấc và cỡ kéo tay là **cách bày trên màn của tôi** ⇒
lưu **theo máy**, không vào tệp dự án. Vật và dây chuyền mới lưu chung (`IF-KIEN-TRUC §9`).

## 3 · VÌ SAO — cơ chế con người
Trí nhớ làm việc giữ được vài mục một lúc. Bày hết mọi thứ không phải là "minh bạch", nó là đẩy
việc lọc sang cho người dùng — và họ phải lọc **lại từ đầu mỗi lần mở màn**.

Nhưng giấu sai cũng đắt ngang: thứ tìm không ra thì coi như không tồn tại, và người dùng **học một
lần rồi mang định kiến đó mãi** ("app này không làm được X"). Nên lộ dần phải trả cả hai phía: bớt
tải **và** giữ đường tìm.

Còn lý do ba nấc phải là ba công năng: nếu chỉ khác cỡ thì người dùng **không có lý do để đổi nấc**
— họ chọn một nấc rồi ở đó mãi, và hai nấc kia là mã chết.

## 4 · CA HỎNG THẬT CỦA IF
- **16/08 · Hoà bác bản dựng card 172px ↔ 268px**: *"cái thu gọn và sổ không thể chỉ khác về độ
  kéo dãn được"*. Đây là ca sinh ra P-0.
- **16/08 · lỗi lặp lại**: sửa cho card xong nhưng **vẫn giữ tư duy cũ khi sang sidebar và cửa sổ
  công cụ** ⇒ Hoà phải nói lần hai. Bài học: sửa một ca mà không sửa **tư duy đẻ ra ca đó** thì nó
  mọc lại ở chỗ khác.
- **16/08 · T hỏi sai tầng**: T định thu vệ tinh của cửa sổ công cụ vào tay nắm. Hoà bác — **mở cửa
  sổ LÀ hành vi bày ra, đóng cửa sổ LÀ hành vi giấu đi**; giấu vệ tinh là gói lần thứ hai cùng một
  thứ. Gốc lỗi: T bỏ trống **tầng nhóm lệnh** rồi đổ tại vệ tinh — chữa triệu chứng ở sai tầng.
- **L4 (`NC-NGUYEN-TAC-GIAO-DIEN` mục 6)**: Present phơi 4 nút thường trực trên mỗi thumbnail —
  tầng sâu bị phơi thay vì hiện theo ngữ cảnh, trái NT-4.
- **3ds Max (né, không lặp)**: lưu trạng thái thu/mở **theo sub-mode** ⇒ panel nhảy loạn. IF khoá
  theo **LOẠI VẬT** (`SPEC-PANEL-ROLLOUT §2b`).

## 5 · KIỂM THẾ NÀO
1. Viết ra **câu hỏi** mà mỗi nấc trả lời. Hai nấc cùng một câu hỏi ⇒ một trong hai là kéo dãn.
2. Che nấc to: nấc nhỏ có tươm tất và tự đứng được không?
3. Liệt kê thứ **chỉ có** ở nấc to. Danh sách rỗng ⇒ bỏ nấc đó.
4. Khi xổ ra, icon còn nằm cạnh chữ không? Còn ⇒ vi phạm P-1.
5. Mỗi thứ đã ẩn: kể ra **hai** đường tới nó. Chỉ có một ⇒ chưa đạt P-6.
6. Có auto-hide ở đâu không? Có ⇒ sai.
7. Nấc-hình có đạt ngưỡng dưới không (mốc tham chiếu 168px cho thumbnail vật liệu)?

## 6 · ĐÀO SÂU
- `docs/SPEC-PANEL-ROLLOUT-IDF.md` §2a–2f — ba cơ chế rollout, ghim, thu gọn
- `docs/00-CHOT.md` 16/08 — "ba nấc là ba công năng" · "hai ngôn ngữ" · "nấc to nhất là mặt nhìn"
- `docs/00-CHOT.md` 07/08 — ba nấc cỡ thẻ Thư viện 122/168/232, lý do ngưỡng
- `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` NT-4
