# ĐẶC TẢ MÀN — KHUÔN ĐIỀN

> Khuôn này **NGẮN HƠN** hợp đồng thiết kế, và nó **KHÔNG THAY THẾ** hợp đồng.
>
> | | Đặc tả màn (tệp này) | Hợp đồng thiết kế |
> |---|---|---|
> | trả lời | *màn này LÀ GÌ, và nó nối vào đâu* | *dựng nó thế nào, đến từng token* |
> | soạn khi | **trước** khi brief Claude Design | **sau** khi có bản vẽ |
> | đủ để thi công | ❌ **KHÔNG** | ✅ |
>
> Thi công theo đặc tả màn mà không có hợp đồng = **vi phạm `SKILL.md §3`**.

Chép thành `docs/dac-ta-man/<hệ>-<màn>.md`.

---

## ① ĐỊNH DANH

| | |
|---|---|
| Tên màn (từ vựng chuẩn) | |
| Route | |
| Thuộc `WORKSPACE` nào | |
| Cần một `PROJECT` đang mở không | *(quyết định nó thuộc cụm **XƯỞNG** hay **DỰ ÁN** trên rail)* |
| Thành phần sở hữu lúc chạy | |

⚠️ Từ vựng có **nghĩa cố định** (`SKILL.md §1`). `HOME` không phải dashboard · `SIDEBAR` là
**bản đồ** không phải launcher · `STAGE` là *tiêu điểm/khung nhìn*, **không** phải một vỏ app
riêng · `WORKSPACE` **không** phải kho sự thật thứ hai. Dùng sai từ ⇒ dựng sai thứ.

---

## ② MÀN NÀY LÀ GÌ — và **KHÔNG PHẢI** là gì

| | |
|---|---|
| Một câu: màn này là | |
| Nó **KHÔNG** phải là | |
| Thứ gần giống mà người ta hay nhầm | |

Ô thứ hai không phải thủ tục. `SKILL.md §1` là một bảng **"là / KHÔNG phải"** vì mỗi lần
định nghĩa thiếu vế phủ định, màn ấy trôi về hình mặc định của ngành — Home trôi thành
dashboard **ba lần**.

---

## ③ VIỆC CON NGƯỜI

| | |
|---|---|
| Người dùng tới đây để làm gì | |
| Họ vừa từ đâu tới | |
| Họ đi đâu tiếp | |
| **Việc này xong thì họ RỜI ĐI hay Ở LẠI** | |
| Bao lâu họ ở đây một lượt | |

⚠️ Câu *"rời đi hay ở lại"* quyết định rất nhiều. Home là màn **để rời đi** — cửa loại bỏ của
nó là: *widget nào khiến người dùng ở lại lâu mà không giúp bắt đầu/tiếp tục thì không được
ưu tiên*. 2D là màn **để ở lại** — nên ở đó chrome mới phải nhường canvas.

---

## ④ NHÂN VẬT CHÍNH

| | |
|---|---|
| Đúng MỘT nhân vật chính | |
| Vì sao nó | |
| Thứ hạng nhì, và nó **kém hơn ở điểm nào** | |

---

## ⑤ TRẠNG THÁI CỦA MÀN

Một màn là một **bề mặt có trạng thái**, không phải một hình cố định.

| Trạng thái | Khi nào | Màn làm gì |
|---|---|---|
| | | |

Bắt buộc phải có dòng cho: **chưa có dữ liệu** · **ít hơn dự kiến** · **đọc thất bại /
không rõ** · **không có quyền**.

🔴 *"Đọc thất bại"* **không** được gộp vào *"không có dữ liệu"*. `F-02`: `calm` là lời khẳng
định *"đã kiểm, không có gì cần chú ý"* — 401 làm tiền đề ấy biến mất. Ba trạng thái **riêng
biệt**: đã đọc-sạch · không có ngữ cảnh · **đọc thất bại**.

---

## ⑥ NÓ NỐI VÀO ĐÂU

| | |
|---|---|
| Đọc dữ liệu từ | |
| Ghi vào | |
| Để lại công thức / vết gì | |
| Ai ăn theo thứ nó tạo ra | |

⛔ **Không đẻ nguồn sự thật thứ hai.** Màn muốn dữ liệu tiện tay ⇒ nối vào nguồn có sẵn hoặc
mở rộng hợp đồng gần nhất, **không tạo đảo**.

---

## ⑦ NÓ NẰM ĐÂU TRONG BỐN BỀ MẶT

| Bề mặt | Vai | Màn này liên quan thế nào |
|---|---|---|
| **CANVAS** | sơ đồ dây chuyền | |
| **CỬA SỔ CÔNG CỤ** | xưởng của một công đoạn | |
| **CHẶNG** | khung nhìn | |
| **SIDEBAR** | bản đồ | |

Chi tiết: `docs/IF-KIEN-TRUC.md` §2.

---

## ⑧ LỆNH

| | |
|---|---|
| Lệnh nào ở **tầng ①** (thanh chung) | *(tiêu chí: **cùng động tác nghề ở cả 3 chặng** — KHÔNG phải "hay dùng")* |
| Lệnh nào ở **tầng ②** (nhóm lệnh) | *(khuôn **thư mục iOS** = tra thỉnh thoảng · khuôn **ổ Photoshop** = dùng liên tục)* |
| Lệnh nào ở **tầng ③** (cửa sổ công cụ) | |
| Đọc từ registry nào | *(bắt buộc: **`lib/commands/registry.ts`** — cấm khai danh sách riêng)* |

🔴 IF đang có **5 sổ lệnh song song** và `grep "lib/commands"` trong cả ba toolbar = **0**.
Đặc tả mới **không được** đẻ sổ thứ sáu.

---

## ⑨ NGÔN NGỮ

| | |
|---|---|
| Đã có bản VI **và** EN chưa | |
| Nhãn nào > 12 từ | |
| Có jargon nội bộ lọt ra giao diện không | *(⛔ `matId` · `BuildOp` · `idfc` · `D5`…)* |
| Chỗ nào **hoa toàn phần** | *(bắt buộc: không)* |
| Chỗ nào là **thuật ngữ dựng hình giữ tiếng Anh** | *(Array · Bevel · Loft · Extrude… — tên Anh dòng chính + giải thích VI dòng nhỏ)* |

---

## ⑩ ĐÃ CÓ GÌ RỒI — `[Đ2]` nhìn vào trong trước

| Nhu cầu | Primitive gần nhất đã có | `tệp:dòng` | Phủ được bao nhiêu | Việc | Vì sao |
|---|---|---|---|---|---|
| | | | | dùng lại / nối / mở rộng / **MỚI** | |

**MỚI** đòi **bằng chứng phủ định đủ 6 mục**: đã tìm gì · primitive gần nhất · vì sao dùng
lại không đủ · vì sao nối không đủ · vì sao mở rộng không đủ · không tạo đảo.

⛔ Lý do bị cấm: *"làm mới cho sạch"* · *"viết lại cho dễ"* · *"framework mới đẹp hơn"*.

---

## ⑪ TÌNH TRẠNG THIẾT KẾ

| | |
|---|---|
| Trạng thái | `MISSING` / `BRIEFED` / `IN DESIGN` / `CANDIDATE` / `INTERNAL PASS` / `IMPLEMENTED` / `SUPERSEDED` / `REJECTED` / `FINAL HUMAN APPROVED` |
| Artefact thiết kế | |
| Hợp đồng thiết kế | *(**chưa có ⇒ chưa thi công được**)* |
| Bản vẽ nào đã bị thay thế | *(ghi ra — bản bị thay phải **đóng dấu tại chỗ**, không bỏ hoang)* |

⚠️ **Không bao giờ chọn bản vẽ theo tên tệp hay theo thời gian sửa** — giải qua chỉ mục
(`docs/mocks/CLAUDE-DESIGN-CURRENT.md`). Một lần đổi tên token hàng loạt đã **đóng lại dấu
thời gian của 21/36 tệp**; mtime ở đây vô nghĩa.

---

## ⑫ CÂU CHƯA TRẢ LỜI

| Câu | Ai quyết | Chặn việc gì |
|---|---|---|

Mỗi câu ở đây là một ô sẽ thành **`DESIGN MISSING`** nếu thi công chạm vào trước khi có
câu trả lời.
