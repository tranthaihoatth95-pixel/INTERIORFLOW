# SPEC — RANH GIỚI ARCHINOTE ↔ INTERIORFLOW

> Duyệt 01/08/2026 — đã bị `SPEC-ARCHINOTE-DETAIL-v1.md` thay thế, xem
> `CHOT-DUYET-SPEC-DOT2-2026-08-01.md` §1c. Thay thế phần "đề xuất" trong sơ đồ HTML cũ (sơ đồ đó mô tả ArchiNote
> như app ops — thực tế ArchiNote là **app hiện trường**).
> Đọc cùng `SPEC-KNOWLEDGE-BASE.md`, `IF-CORE-SCHEMA.md`, `IF-ARCHITECTURE-BLUEPRINT-v1.md`.

---

## 1. Cặp đôi: **Hiện trường ↔ Xưởng** *(field ↔ studio)*

| | **ArchiNote** — hiện trường | **InteriorFlow** — xưởng |
|---|---|---|
| Vỏ | **Capacitor** (bọc web hiện có → app native) | **Electron** |
| Thiết bị | 📱 Điện thoại là chính · máy tính xem web | 💻 Desktop |
| Việc | Đo đạc · ảnh/video · ghi chú · tư vấn tại chỗ · tra cứu · điều phối người | Vẽ · vật liệu · render · deck · khối lượng |
| Nhịp | Nhanh, thô, ngay lập tức | Chậm, chính xác đến mm |
| Dữ liệu nặng | Ở máy điện thoại | Ở máy desktop |

Cùng triết lý **local-first + điểm gặp trung tính**, hai vỏ khác nhau vì hai loại thiết bị.
**Không app nào gọi app nào** → bán riêng từng cái được.

## 2. Nguyên tắc chia dữ liệu ⭐

> **Dữ liệu nặng ở lại máy — dữ liệu điều phối bay lên Lark.**

| Loại | Nằm đâu | Vì sao |
|---|---|---|
| Bản vẽ · ảnh gốc · vật liệu · deck | **Máy local** | Nặng, cần offline, cần GPU |
| **Phân công · trạng thái dự án · yêu cầu người · số đo tóm tắt** | **Lark Base** | Nhiều người phải thấy, mọi lúc, mọi máy |
| Sách · quy chuẩn · ATLAS | **Lark + bản tải về máy** | Tra được cả khi mất mạng |

⇒ Dashboard staffing của IF cũng **đọc từ Lark**, không tự giữ → hai app thấy cùng một sự thật
mà không phải sync với nhau.

## 3. Hai luồng một chiều — không bao giờ sửa cùng bản ghi

```
ARCHINOTE (hiện trường)                    INTERIORFLOW (xưởng)
 đo đạc · ảnh · ghi chú · lời khách
        │
        ▼  ⟶ luồng NHẬP ⟶
   ┌──────────────────────────────┐
   │   LARK BASE + NÃO T5         │
   │ hiện trạng · ATLAS vật liệu  │──▶ IF đọc: dựng bản vẽ từ số đo thật
   │ chi tiết điển hình · case    │
   │ PROJECT_STATUS · điều phối   │
   └──────────────────────────────┘
        ▲  ⟵ luồng TRẠNG THÁI ⟵
        │
 ArchiNote đọc: dự án tới đâu, ai rảnh, phương án nào chờ duyệt
```

**Hợp đồng dữ liệu tối thiểu** (bảng `PROJECT_STATUS`): `projectId` · `stage` · `%` · `updatedAt`
· link mở. IF **đẩy khi có mốc** (đóng giai đoạn, xuất deck) — không đẩy liên tục. Không endpoint,
không ai phải bảo trì server.

## 4. Hai trợ lý · Một não

| Câu hỏi | Ai | Nguồn |
|---|---|---|
| Chi tiết chống thấm ban công điển hình? | **ArchiNote** | Lark — chi tiết điển hình |
| Case tương tự xử lý sao ngoài công trường? | **ArchiNote** | Lark — case công trường |
| "Ốp lam gỗ" tiếng Anh là gì? | **ArchiNote** | Từ điển KTS |
| Mẫu đá này còn hàng, giá bao nhiêu? | **ArchiNote** | ATLAS |
| Nói nhanh 3 hướng cho khách | **ArchiNote** | AI sinh nhanh + gu |
| Hành lang đủ rộng thoát nạn chưa? | **Vitals (IF)** | Checker + bản vẽ |
| Tô sàn phòng ngủ gỗ sồi | **Vitals (IF)** | Bản vẽ |
| Dự án Nord tới giai đoạn nào? | **Cả hai** | Lark `PROJECT_STATUS` |

**Nguyên tắc**: ArchiNote trả lời *"cái gì · ở đâu · thế nào"* — Vitals trả lời *"trên bản vẽ này thì sao"*.
Trợ lý nào không biết thì **nói thẳng + chỉ đường** ("phần đó nằm ở app kia").
⚠️ **Đổi tên**: "AI Vitat" của ArchiNote trùng "Vitals" của IF → đổi thành **Trợ lý điều hành / Ops Assistant**.

## 5. Điều phối người — 5 thứ, không hơn

Bài toán: điều người khi người quyết định đang đi vắng.
1. Ai đang gánh gì · ai sắp rảnh · 2. Dự án nào thiếu người (cờ đỏ) · 3. Nút **xin/trả người**
(mấy ngày, việc gì) · 4. **Duyệt 1 chạm** trên điện thoại · 5. **Nhật ký điều phối**.
KHÔNG làm Gantt/Kanban đầy đủ — đây là **ô cửa sổ nhìn về nhà**, không phải app quản lý dự án.

## 6. Số đo — độ tin cậy đi kèm số đo ⭐

| Cách đo | Sai số | Dùng được cho |
|---|---|---|
| **LiDAR** (iPhone Pro) | ±2–5 cm | Khối phòng, hình dạng, bố cục sơ bộ. ❌ **không** dùng cho TKKT/đặt hàng |
| **Laser Bluetooth** (Disto/Bosch) | **±1–2 mm** | ✅ Mọi thứ, kể cả TKKT |
| Nhập tay | ±5–10 mm | Kiểm tra, bổ sung |

**Quy trình chuẩn** *(scan-to-BIM)*: ① LiDAR quét 2 phút ra khối thô → ② laser đo điểm chính
(dài tường · cao trần · lọt cửa · hốc) → ③ số laser **ghi đè** số LiDAR tại cạnh đó → ④ IF dựng
bản vẽ: khối LiDAR làm nền, số laser làm chuẩn.

### ⭐ Vai trò thật của điện thoại: **màn hình + sổ ghi có định vị** — KHÔNG phải thiết bị đo

> Máy laser cho ra **CON SỐ**. Điện thoại cho biết con số đó **ĐO CÁI GÌ, Ở ĐÂU**.
> Điểm mù kinh điển: về studio nhìn danh sách `3250 · 2780 · 4100` — không ai nhớ số nào là tường nào.

| # | Điện thoại làm | Máy đo chuyên dụng có? |
|---|---|---|
| 1 | **Ảnh tại điểm đo** | ❌ |
| 2 | **Neo số vào không gian** *(AR anchor)* — dán đúng cạnh trên khối phòng | ❌ |
| 3 | **Ghi chú tại chỗ** — giọng nói · chữ · khoanh vùng trên ảnh | ❌ |
| 4 | ⭐ **Đối chiếu THIẾU SỐ ngay tại hiện trường** — LiDAR biết phòng có mấy cạnh → so số đã bắn → báo *"còn 3 cạnh chưa đo"* | ❌ |

**#4 là moat thật**: nỗi đau lớn nhất của khảo sát không phải đo chậm, mà là **về studio dựng bản
vẽ mới phát hiện thiếu kích thước → phải quay lại công trường** (dự án ở đảo/tỉnh xa = mất cả ngày).

**Luồng hiện trường**:
```
① LiDAR quét 1–2' → khối phòng thô hiện trên màn hình
② Chĩa máy vào tường, bắn laser → số qua Bluetooth vào app
③ App dán số vào ĐÚNG cạnh đang chĩa + chụp ảnh + đóng dấu vị trí
④ Nói 1 câu ghi chú nếu cần
⑤ Màn hình: cạnh XANH = đã đo · cạnh XÁM = chưa → đo nốt TRƯỚC KHI RỜI
⑥ Có sóng → đẩy Lark → IF dựng bản vẽ (số laser là chuẩn)
```


**Metadata mỗi số đo**: `giá trị` · `cách đo` (lidar/laser/manual) · `sai số ±` · `ai đo` ·
`khi nào` · `đã kiểm chưa`.

**Hiển thị trong IF**:
| Nguồn | Thể hiện |
|---|---|
| Laser | Nét chuẩn, số đen — dùng thoải mái |
| LiDAR | **Nét đứt + số cam** — cảnh báo sơ bộ |
| Xuất bản vẽ kỹ thuật còn cạnh cam | **Checker chặn**: *"Còn N kích thước sơ bộ chưa đo laser"* |

⚠️ Giới hạn LiDAR phải cảnh báo trong app: **không đọc được kính/gương/bề mặt bóng · sai số tích
luỹ khi quét phòng dài · phòng tối gây nhiễu**.

## 7. Bốn thứ bắt buộc của app hiện trường
1. **Ghi được khi mất sóng** *(offline-first)* — tầng hầm, nhà đang xây, đảo
2. **Hàng đợi gửi nền** *(background upload queue)* — đóng app vẫn đẩy tiếp
3. **Nén trước khi gửi** — bản nén đi trước, bản gốc chờ wifi
4. **Tự gắn ngữ cảnh**: dự án · vị trí · thời gian · người ghi — về nhà mới phân loại thì không ai làm

Món 4 là thứ nuôi bánh đà: ảnh hiện trường **tự biết** thuộc dự án nào → nạp Lark → về IF,
không ai gõ lại.

---
## 8. Định vị & an toàn hiện trường — TÁCH LÀM HAI

| | **A · Vị trí công trình** | **B · An toàn nhân sự** |
|---|---|---|
| Dữ liệu | Tĩnh — địa chỉ, toạ độ dự án | **Động — vị trí con người** |
| Rủi ro | Không | ⚠️ **Pháp lý + lòng tin nhân viên** |

### A · Vị trí công trình — làm ngay
Bản đồ + nút chỉ đường khi mở dự án. Giá trị đi kèm: ảnh/ghi chú **tự gắn toạ độ** → tự biết
thuộc công trình nào · **chấm công tại công trường** *(geofence check-in)* · cơ sở tính công tác
phí · nhật ký công trường có bằng chứng vị trí.

### B · An toàn nhân sự — ⚠️ thiết kế sai thành giám sát

> **Theo dõi vị trí liên tục là GIÁM SÁT, không phải AN TOÀN.** Làm sai → nhân viên tắt app
> hoặc để điện thoại ở nhà → mất luôn tính năng.

| | ❌ Giám sát | ✅ An toàn *(lone worker safety)* |
|---|---|---|
| Cách chạy | Nền liên tục | **Nhân viên chủ động bật khi vào công trường, tắt khi ra** |
| Ai xem được | Quản lý xem bất cứ lúc nào | **Chỉ hiện khi quá hạn báo an toàn** |
| Lưu bao lâu | Vĩnh viễn | **Tự xoá sau 7–30 ngày** |

**Mô hình chuẩn**: báo an toàn định kỳ *(safety check-in)* — bấm "đã tới", app hỏi lại sau N giờ,
**quá hạn không xác nhận mới báo động** về văn phòng. Kèm nút **SOS** gửi vị trí tức thì.

⚖️ **Nghị định 13/2023/NĐ-CP**: dữ liệu vị trí là dữ liệu cá nhân — cần **đồng ý rõ ràng**, nêu rõ
mục đích, cho phép rút lại. Bán ra nước ngoài thì GDPR chặt hơn. Làm đúng từ đầu rẻ hơn sửa sau.

### Lưu ý kỹ thuật
1. **Google Maps API tính tiền theo lượt gọi** → dùng **ảnh bản đồ tĩnh** *(static map)* cho màn
   hình dự án, chỉ mở bản đồ tương tác khi bấm "chỉ đường". Hoặc Mapbox/OpenStreetMap rẻ hơn.
2. **Bản đồ phải cache được** — công trường mất sóng vẫn xem được vùng đã tải.

---

## 9. THU THẬP HIỆN TRƯỜNG NÂNG CAO — panorama · ghi âm · phân tích từ toạ độ

### 9.1 ⭐ Phân tích hiện trạng từ TOẠ ĐỘ — toán thuần, 0 credit *(giá trị cao nhất)*

| Suy ra được | Bằng gì | Chi phí |
|---|---|---|
| **Hướng nắng · quỹ đạo mặt trời** theo mùa/giờ | Thuật toán vị trí mặt trời từ vĩ độ + ngày *(SunCalc)* | **0đ, chính xác 100%** |
| **Bóng đổ** theo giờ | Cùng phép toán | 0đ |
| **Hướng gió chủ đạo** *(windrose)* | Khí tượng lịch sử (Open-Meteo) hoặc **QCVN 02:2022** số liệu khí hậu VN | Gần 0đ |
| Nhiệt độ · độ ẩm · mưa theo tháng | Cùng nguồn | 0đ |
| **Hướng view đẹp** (biển/núi/đường/công trình) | Bản đồ + độ cao + hướng | Rẻ |
| Bối cảnh xung quanh | Ảnh vệ tinh + street view | Rẻ |

⇒ Đây chính là trang **"SITE & CONTEXT"** trong deck concept thật (địa hình · khí hậu · giá trị
bối cảnh). Hiện làm tay: tìm ảnh, tra số liệu, viết chữ. Sinh tự động từ toạ độ ⇒ **một chương
hồ sơ ra trong 30 giây**.

⚠️ **Giới hạn giữ**: chỉ làm **diagram 2D** (sun path · hướng gió · bóng đổ đơn giản).
Mô phỏng bóng đổ 3D theo giờ là việc của Rhino/Grasshopper — **không đua**.

### 9.2 Ghi âm thay gõ — đã chín, làm được ngay

Nhu cầu thật: ngoài công trường tay cầm thước/máy đo, **không gõ được**.
```
Bấm ghi → nói → thả tay
  → chuyển thành chữ tự động (STT, tiếng Việt tốt)
  → gắn vào: ảnh vừa chụp · vị trí trên mặt bằng · toạ độ GPS
  → GIỮ CẢ file âm thanh gốc
```
**Giữ file gốc là bắt buộc** — chữ hoá sai thì còn bản gốc nghe lại; ngữ điệu và chi tiết bị chữ
hoá bỏ sót vẫn còn.

### 9.3 Panorama — giá trị ở chỗ GẮN VÀO MẶT BẰNG

Chụp panorama không mới. Cái đắt: **click một điểm trên mặt bằng → xem panorama chụp tại đúng
điểm đó** (Street View nội bộ của công trình).

| Bậc | Cách |
|---|---|
| **N** | Panorama camera điện thoại + **ghim toạ độ trên mặt bằng** |
| P | Camera 360 rời (Insta360 · Ricoh Theta) qua Bluetooth |
| L | Nhiều điểm → đi lại giữa các điểm như Street View |

**Lợi ích thật**: không phải quay lại công trường. Ba tháng sau cần kiểm chiều cao dầm — mở
panorama ra xem, khỏi đi 300km.

### 9.4 Cả ba nuôi CHẶNG 0
```
ArchiNote hiện trường
  ├─ toạ độ   → nắng · gió · view · khí hậu ─┐
  ├─ panorama ghim trên mặt bằng ────────────┤→ CHẶNG 0 Ý TƯỞNG
  ├─ ghi âm → chữ ───────────────────────────┤   (trang Site & Context TỰ SINH)
  └─ ảnh + số đo laser ──────────────────────┘        ↓
                                               CAD dựng từ số thật
```

---

*v1.2 (thêm §9 thu thập hiện trường nâng cao — panorama · ghi âm · phân tích toạ độ) · 2026-07-26 · Ben soạn theo ý Hoà.*

