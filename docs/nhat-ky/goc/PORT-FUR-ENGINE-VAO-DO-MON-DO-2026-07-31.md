# Port FUR ENGINE v3.1 → "Đo món đồ" của IF

> Hoà đã có một hệ chạy thật trên Google Flow (**FUR ENGINE v3.1**), đã xử lý **~130 món / 21 phòng**
> cho dự án `PRESIDENTIAL 220303-RVR-SML-L23`. IF làm cùng việc đó nhưng **sai**.
> Tài liệu này đối chiếu hai bên và chỉ ra chỗ phải sửa.
>
> **Nguồn:** ảnh màn hình FUR ENGINE (ITEM-01 sofa · ITEM-02 bàn trà · ITEM-03 ghế bành mây)
> + ảnh spec sheet IF ngày 31/07.

---

## 1 · Bằng chứng: IF tự khai nó không đo

Spec sheet IF in ra, nguyên văn phần giải thích:

| Trường | Giá trị | Nhãn | Giải thích IF tự in ra |
|---|---|---|---|
| Rộng | 1274 ±255 mm | 🟢 **ĐO** | *"Tỉ lệ rộng/cao khung bao mặt nạ × **cao chuẩn nghề** 'Sofa 2 chỗ' (850mm)"* |
| Sâu | ~875 ±75 mm | 🟡 SUY | *"Dải chuẩn nghề 'Sofa 2 chỗ' — ảnh 2D không thấy mặt sau"* |
| Cao | 850 ±50 mm | 🟢 **ĐO** | *"**Cao chuẩn nghề** 'Sofa 2 chỗ' — chưa có neo thật"* |

**Ba lỗi, xếp theo mức nghiêm trọng:**

⛔ **① Sai món.** Người dùng chọn `Giường King`. Máy dùng chuẩn `Sofa 2 chỗ`. Lựa chọn của người
dùng **không tới được** bộ ước lượng, hoặc bộ nhận diện tự quyết và ghi đè. Giường King ≈ 1800×2000;
máy trả 1274×875 — đó là số của sofa.

⛔ **② Nhãn nói dối.** `Cao 850` **chính là hằng số neo** in ngược ra, gắn nhãn 🟢 ĐO. `Rộng` là
tỉ lệ **nhân với chính hằng số đó** — cũng gắn 🟢 ĐO. Không có phép đo nào xảy ra. Nhãn đúng của
cả ba dòng là **SUY**. Kèm `±255mm` (±20%) mà vẫn xanh — sai lệch đó không phải "đo".

⚠️ **③ Không có bằng chứng nhìn được.** Ảnh đưa vào là **cả phòng** (giường, ghế băng, tủ, bàn,
đèn). Không có khung bao, không có mặt nạ hiện lên ảnh ⇒ người dùng **không có cách nào biết máy
đã nhìn vào vật nào**. Trả về một con số tự tin mà không kiểm được còn tệ hơn trả về tay không.

---

## 2 · FUR ENGINE v3.1 làm gì — 7 bước

Đọc từ ảnh màn hình thật:

| # | Bước | Bằng chứng trên ảnh |
|---|---|---|
| 1 | **Nhận diện TẤT CẢ món trong phòng** | Ảnh hiện trường xám, **khung số 1→8** phủ lên |
| 2 | **Người dùng chọn 1 món** | Khung đang chọn **tô xanh** (①sofa · ②bàn trà · ③ghế bành) |
| 3 | **CROP GỐC** | Ảnh cắt riêng món khỏi phối cảnh |
| 4 | **CUTOUT** | Tách nền |
| 5 | **HERO SHOT** | Dựng lại ảnh sạch nền trắng |
| 6 | **BẢN VẼ KỸ THUẬT A3** | Top Plan · Front Elevation · Side Elevation · Section, có dim + khung tên (`GHẾ BÀNH MÂY · TC-03 · 1:20`) |
| 7 | **SPEC SHEET** | `ITEM-01/02/03`, gắn Dự án · Loại phòng · Màu · Vị trí · SL |

Trường dữ liệu: `W · D · H` **+ `CAO MẶT (SH)` riêng** (vd sofa 3200×2400×850).

**Chỗ quyết định thành/bại là bước 1–3.** Cắt món ra khỏi ảnh phòng = **loại bỏ mọi nhầm lẫn**.
IF đang bỏ trọn ba bước này và đo thẳng trên ảnh phòng — đó là gốc của lỗi ①.

---

## 3 · ⭐ Chỗ IF có thể HƠN Flow, không chỉ bằng

Bản vẽ A3 của FUR ENGINE ghi rõ **"(AI GENERATED)"** — nó là **ảnh**, không phải hình học.
Con số `4500mm` trên đó là **chữ được vẽ ra**, không phải kích thước suy từ nét. Dùng để duyệt
ý tưởng thì tốt; đưa xuống xưởng thì rủi ro — nét và số có thể không khớp nhau, dù khung tên ghi 1:20.

**IF có `lib/cad/` — một bộ dựng hình vector thật.**

⇒ IF không nên bắt chước "AI vẽ bản vẽ". IF nên: lấy `W·D·H·SH` từ bản ghi → **dựng bản vẽ VECTOR
thật** (mặt bằng, mặt đứng, mặt bên, mặt cắt) bằng `lib/cad` → xuất `.dxf`/PDF **đúng tỉ lệ theo
định nghĩa, không theo may rủi**.

Đây là khác biệt cấu trúc, không phải khác biệt độ tinh xảo: **Flow buộc phải vẽ giả vì không có
bộ dựng hình. IF có.** Và nó khớp thẳng với luật `task-cards.ts` đã ghi sẵn:
*"TUYỆT ĐỐI không cho AI vẽ minh hoạ giả"*.

---

## 4 · Việc phải làm, xếp theo thứ tự

| # | Việc | Vì sao trước |
|---|---|---|
| **1** | **Nhãn trung thực** — hằng số neo ⇒ luôn `SUY`, không bao giờ `ĐO`. Chỉ được `ĐO` khi có **neo thật do người dùng nhập hoặc bấm 2 điểm**. `±` > 10% ⇒ không được xanh | Rẻ nhất, sửa được ngay, và là lỗi **mất niềm tin**. Làm trước cả việc sửa số |
| **2** | **Khung bao đánh số phủ lên ảnh** — nhận diện tất cả món, đánh số, cho bấm chọn | Vừa là bằng chứng nhìn được (③), vừa là cách chọn đúng món (①). **Một việc giải hai lỗi** |
| **3** | **CROP + CUTOUT trước khi đo** | Gốc của lỗi ①. Sau bước 2 thì gần như miễn phí |
| **4** | **`Loại đồ` là quyền tối cao** — máy nhận diện khác ý người dùng thì **nói ra**, không tự ghi đè im lặng | Lỗi im lặng là loại nguy hiểm nhất |
| **5** | **Thêm trường `SH` (cao mặt)** vào bản ghi | Vừa là trường dữ liệu, vừa là **neo tỉ lệ tốt nhất** cho đồ ngồi |
| **6** | **Bản vẽ VECTOR từ `lib/cad`**, không phải ảnh AI | §3 — đây là chỗ IF hơn |
| **7** | **Chặn xuất Spec Sheet** khi mọi chiều đều `SUY` hoặc `±` > 15% | Spec sheet ngụ ý "đưa xuống xưởng được". ±20% thì không |

**Việc 1 làm được ngay, không chờ gì cả.** Việc 2–3 là đợt chính.

---

## 5 · Còn thiếu — phải lấy từ Flow

Chưa có bản gốc **prompt của FUR ENGINE v3.1**. Cần chép nguyên văn:
- prompt từng chặng CROP · HERO · DRAWING
- đoạn nói về cách suy `W/D/H/SH` — neo lấy từ đâu, có phủ lưới đếm ô không
- quy tắc sinh mã món (`PRE-04-01`, `ITEM-01`, `TC-03`)
- mẫu PDF A3 "Vinh Fur"

⚠️ Khi lấy: tool đang chạy thật (phòng 4/21, ~130 món, còn 2,5–3 tiếng) — **chỉ đọc, không bấm
"DỪNG XỬ LÝ", không lưu, không sửa**.

---

*Cowork, 31/07/2026. Đối chiếu ảnh FUR ENGINE v3.1 (ITEM-01/02/03) với spec sheet IF cùng ngày.*
