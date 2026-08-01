# Từ 1 ảnh phối cảnh → món đồ có kích thước → mặt bằng/đứng/bên

> Việc Hoà nêu là việc **khó nhất từ đầu phiên tới giờ**. Có phần làm được rất tốt, có phần
> **không thể chính xác về mặt toán học**, và trộn hai phần đó vào nhau là cách nhanh nhất để
> giao cho xưởng một con số sai.
>
> Tài liệu này tách rõ ba nhóm: **ĐO được · SUY được · KHÔNG THỂ**, rồi đề xuất lát cắt ship trước.

---

## 1 · Một sự thật toán học phải nói trước

**Một tấm ảnh KHÔNG chứa thang đo tuyệt đối.**

Một mô hình nhà búp bê và một căn phòng thật, chụp đúng góc, cho **ảnh giống hệt nhau**. Không có
thuật toán nào — kể cả AI mạnh nhất — lấy được milimét từ pixel nếu không có **ít nhất một mốc dài
đã biết**. Đây là *scale ambiguity* trong thị giác đơn ảnh, không phải giới hạn công nghệ sẽ hết
sau vài năm.

→ **Nhưng Hoà đã tự nghĩ ra đúng lời giải** khi viết *"dựa trên ISO chuẩn"*: neo thang đo bằng
**vật có kích thước chuẩn** trong chính khung hình.

| Vật neo | Kích thước chuẩn | Độ tin |
|---|---|---|
| Cửa đi | cao **2000–2200 mm** | ★★★ cao nhất, gần như luôn có trong phối cảnh nội thất |
| Bậc thang | **150–180 mm**/bậc | ★★★ |
| Gạch lát | module **300/600/800 mm** | ★★★ nếu đếm được mạch |
| Mặt bàn ăn/làm việc | **750 mm** | ★★ |
| Mặt ngồi ghế | **400–450 mm** | ★★ |
| Ổ cắm / công tắc | **300 / 1200 mm** so nền | ★★ |
| Chiều cao máy ảnh (render nội thất) | **1500–1600 mm** | ★★★ — **đây là mốc mạnh nhất**, xem §3② |

---

## 2 · Ba nhóm — phải giữ tách bạch trong sản phẩm

| Nhóm | Nội dung | Bản chất |
|---|---|---|
| 🟢 **ĐO** | Cạnh thấy được, nằm trên mặt phẳng đã hiệu chỉnh | **Phép đo** có sai số ước lượng được |
| 🟡 **SUY** | Chiều sâu món đồ, mặt khuất, chi tiết bị che | **Nội suy** — hợp lý nhưng không phải sự thật |
| 🔴 **KHÔNG THỂ** | Cấu tạo bên trong, vật liệu lõi, liên kết, dung sai lắp ráp | **Không có trong ảnh.** Đừng vờ có |

⚠️ **Luật sản phẩm đề xuất:** mọi số ở nhóm 🟡 phải hiện **khác màu + có dấu ~**, và bản vẽ xuất ra
phải đóng dấu *"Mặt khuất là suy diễn — kiểm tra trước khi sản xuất"*. Nghề này sai một con số là
mất tiền thật; và đúng tinh thần Hoà đã nói: **kiến trúc sư không chấp nhận quá trình không kiểm soát.**

---

## 3 · Dây chuyền 7 bước

### ① Hiệu chỉnh máy ảnh từ chính ảnh (vanishing points)

Nội thất là môi trường **Manhattan** (gần như mọi cạnh song song 3 trục vuông góc) → dò được **3 điểm
tụ**, từ đó ra **tiêu cự + hướng máy + mặt phẳng sàn**. Đây là CV cổ điển, **tất định, 0 credit**,
không cần AI.

→ Đây là bước quan trọng nhất và cũng là bước rẻ nhất. Không có nó thì mọi bước sau chỉ là đoán.

### ② Neo thang đo — mẹo mạnh nhất: chiều cao máy ảnh

Phối cảnh nội thất gần như luôn đặt máy ở **tầm mắt 1500–1600 mm**. Biết mặt sàn (bước ①) + chiều cao
máy ⇒ **có ngay thang đo mét cho mọi điểm nằm trên sàn**.

Kết hợp thêm 1–2 vật neo ở §1 để **kiểm chéo**. Ba nguồn khớp nhau trong ±5% ⇒ tin. Lệch quá ⇒ báo
người dùng chọn tay.

### ③ Phát hiện + tách món đồ

Segment theo từ khoá mở (sofa, bàn, tủ, đèn…). Món đồ được tách ra khỏi nền, có mặt nạ chính xác tới
pixel. **IF đã có `ai.furnitureextract` và `ai.removebg`** — không phải xây từ đầu.

### ④ Ước lượng chiều sâu

Mô hình depth đơn ảnh cho **bản đồ độ sâu**; loại "metric" cho luôn đơn vị mét (sai số ~10–20%).
Dùng để tách món đồ khỏi mặt phẳng và ước lượng bề dày.

⚠️ Sai số này là lý do bước ② phải neo lại bằng vật chuẩn — **đừng tin depth làm nguồn thang đo chính**.

### ⑤ Dựng khối 3D từng món

Image-to-3D hiện đã dùng được thật: **TRELLIS.2** (Microsoft) và **Hunyuan3D v3.x** (Tencent) là 2 dòng
mạnh nhất hiện nay, sinh mesh có texture từ một ảnh.

**Nhưng phải nhớ: mặt sau món đồ KHÔNG có trong ảnh — nó được sinh ra.** Đúng, hợp lý, nhưng là
suy diễn. Ghi nhóm 🟡.

### ⑥ Chiếu trực giao → mặt bằng · đứng · bên

Có mesh rồi thì **bước này chính xác tuyệt đối và rẻ**: đặt camera trực giao 6 hướng, render ra nét.
Không phải AI, không phải đoán — thuần hình học.

→ **IF đã có sẵn hạ tầng**: `lib/three/cad-to-obj.ts`, node `three.camera` (đổi góc phối cảnh),
node `three.cad2fbx` (*"dựng khối 3D đúng kích thước thật… 0 credit, 100% tất định"*).

### ⑦ Ghi kích thước + đẩy sang chặng 1

Nét trực giao + số đo → đưa thẳng vào CAD của IF (đã có engine dim, layer, khung tên, `polygonArea`).
Từ đó ăn theo toàn bộ đường có sẵn: `.idf`, xuất PDF nhiều tờ, BOQ.

---

## 4 · 🔥 Lát cắt SHIP TRƯỚC — vì Hoà nói gấp

**Đừng làm cả 7 bước.** Bước ⑤ (dựng 3D) là bước đắt nhất, chậm nhất, và **kém tin nhất**.

> **Lát cắt 1 — "ĐO ĐƯỢC MÓN ĐỒ TRONG ẢNH"**: chỉ bước ① + ② + ③ + ⑦.
> Không 3D. Không sinh góc mới. Chỉ: khoanh món đồ → ra **rộng × sâu × cao** kèm sai số → xuất
> **spec sheet** có ảnh + số đo.

Vì sao lát cắt này đúng:

| | |
|---|---|
| **Tất định** | Bước ① và ② là hình học thuần, **0 credit**, chạy offline, không phụ thuộc nhà cung cấp AI |
| **Đúng phần "đo"** | Toàn bộ nằm ở nhóm 🟢, không có gì bịa |
| **Đã có 70% hạ tầng** | `ai.furnitureextract` · `ai.removebg` · engine CAD có dim · `out.board` để xuất spec sheet |
| **Bán được ngay** | Designer chụp/render một góc → ra bảng kích thước gửi xưởng. Đó là việc hằng ngày |
| **Nối thẳng BOQ** | Có kích thước ⇒ có khối lượng ⇒ nối `2.1.9.p` đã chốt |

**Lát cắt 2** (sau): thêm ⑤ + ⑥ → mặt bằng/đứng/bên + góc phối cảnh khác.

---

## 5 · Rủi ro phải biết trước

| Rủi ro | Xử |
|---|---|
| **Ảnh không có vật neo nào** (cận cảnh một món giữa nền trắng) | Bước ① thất bại. Phải cho người dùng **nhập tay 1 kích thước đã biết** rồi suy phần còn lại |
| **Ống kính góc rộng / méo** | Phối cảnh render thường có distortion. Phải khử trước bước ① |
| **Ảnh AI sinh ra không nhất quán hình học** | Ảnh render AI hay có đường thẳng không thật thẳng ⇒ điểm tụ lệch. Cảnh báo khi độ khớp thấp |
| **Món đồ bị che một phần** | Kích thước theo phương bị che chuyển sang nhóm 🟡 |
| **Người dùng tin số rồi đặt hàng** | ⚠️ **Rủi ro tiền thật.** Bắt buộc dấu cảnh báo + sai số hiện rõ, không giấu |

---

## 6 · Đề xuất mã + thứ tự

| Mã đề xuất | Việc | Chi phí |
|---|---|---|
| **`2.2.9x` a** | Hiệu chỉnh máy ảnh từ ảnh (3 điểm tụ → tiêu cự + mặt sàn) — **tất định, 0 credit** | Trung bình |
| **`2.2.9x` b** | Neo thang đo (cao máy 1500-1600 + vật chuẩn, kiểm chéo, báo độ lệch) | Rẻ sau (a) |
| **`2.2.9x` c** | Khoanh món → ra R×S×C kèm sai số, nhóm 🟢/🟡 rõ ràng | Trung bình |
| **`2.2.9x` d** | Xuất **spec sheet** (ảnh + số đo + cảnh báo) — dùng lại `out.board` | Rẻ |
| — | ⑤ dựng 3D + ⑥ chiếu trực giao | **Đợt 2** |

Mã cụ thể do Claude Code đề xuất và kiểm trùng — tôi chưa cấp.

---

## 7 · Câu chốt

Hoà mô tả đúng dây chuyền, kể cả chi tiết tinh nhất (*"dựa trên ISO chuẩn"* — đó chính xác là cách
duy nhất lấy được thang đo từ một ảnh). Chỗ duy nhất cần nắn:

> **Đừng gộp "đo" với "dựng" vào một tính năng.** Đo là khoa học, có sai số nói ra được, bán được
> ngay. Dựng là suy diễn, đẹp, nhưng không được phép giả làm phép đo.

Ship phần **đo** trước — nó vừa nhanh hơn, vừa là phần khách trả tiền.

Từ khoá tra thêm: `single-view metrology` · `vanishing point camera calibration` · `Manhattan world
assumption` · `monocular metric depth` · `scale ambiguity` · `open-vocabulary segmentation` ·
`image-to-3D TRELLIS Hunyuan3D` · `orthographic projection from mesh` · `anthropometric size priors`.

---

*Cowork, 30/07/2026. Hạ tầng IF đã có, đã xác minh: `lib/three/cad-to-obj.ts` · node `three.camera`
· `three.cad2fbx` (0 credit, tất định) · `ai.furnitureextract` · `ai.removebg` · `out.board` ·
`lib/cad/hatch.ts polygonArea` · engine dim/layer/khung tên chặng 1.*
