# SPEC — CHUỖI VẬT LIỆU *(material pipeline)*

> **[CẦN HOÀ DUYỆT]** · Đây là moat **L5** (+ **L6** mới) — chuỗi duy nhất không app nào ghép được
> vì không app nào có ATLAS. Nguồn chân lý: **ATLAS Vol.3 trên Lark Base** (bảng MATERIAL);
> repo chỉ giữ **bảng mirror có `syncedAt`**.
> Đọc cùng `SPEC-SEMANTIC-MODEL.md`, `SPEC-IF-LIBRARY.md`.

---

## 1. Một mã vật liệu, BỐN mặt — vì ba thế giới ăn ba loại thức ăn khác nhau

| Thế giới | Cần gì để hoạt động | ⚠️ Điểm mù thường gặp |
|---|---|---|
| CAD 2D | Hatch + thumbnail | — |
| **Render AI (ComfyUI)** | **Ảnh tham chiếu + câu mô tả** | **KHÔNG đọc PBR map** — nhiều người tưởng có PBR là AI dùng được |
| **Render thật (V-Ray/D5)** | **Bộ PBR maps + thông số** | — |

```
mat_oak_natural  ← MỘT mã, BỐN mặt
├── nhận dạng : mã · tên · hãng · NCC · giá · quy cách · thời gian đặt   → BOQ, báo giá
├── mặt CAD   : hatch id · thumbnail · màu đại diện · reflectance        → tô mặt bằng, tính lux
├── mặt AI    : 2–3 ảnh tham chiếu · prompt · negative prompt            → AI render
└── mặt PBR   : albedo · roughness · metallic · normal · AO · height
                 · tiling size (mm) · thông số riêng V-Ray / D5          → .vrmat / D5
```

**Ba mặt đầu gõ tay trên Lark Base là chạy được ngay** — không chờ ai. Mặt PBR nặng, bổ sung dần.

## 2. Chuỗi giá trị — vẽ một lần, năm nơi dùng

```
ATLAS (mat_oak_natural)
 ├─→ CAD      : hatch + thumbnail thật (thay procedural)
 ├─→ AI Render: prompt + ảnh tham chiếu tự động, không gõ tay
 ├─→ V-Ray/D5 : xuất .vrmat / thư viện D5, render thật đúng vật liệu đã chọn
 ├─→ BOQ      : mã · hãng · đơn giá · NCC → bảng khối lượng → báo giá
 └─→ Present  : callout vật liệu trên deck, tự khớp bản vẽ
```

**Đừng cạnh tranh V-Ray/D5 — hãy nuôi chúng.** AI render = nháp nhanh để khách gật đầu (phút) ·
V-Ray/D5 = bản chốt đẹp (giờ). Cùng một mã → khách thấy nháp và bản chốt **cùng loại gỗ, cùng
mã, cùng giá**. Đó mới là thứ không ai có.

⚠️ **Nói thật**: IF **không thể** làm AI render "đẹp đúng như V-Ray". V-Ray đẹp nhờ truy vết tia
sáng vật lý; AI đẹp nhờ đoán từ hàng triệu ảnh. Hai cơ chế khác bản chất, không có núm nào chỉnh
cho bằng. Đừng hứa với khách quá vạch này.

## 3. Vùng tô vật liệu trên mặt bằng — màu ≠ vật liệu

| | **Tô màu** *(fill)* | **Tô vật liệu** *(material zone)* |
|---|---|---|
| Là gì | Một mảng màu | Một **mã** có hoa văn + tên + giá |
| Máy hiểu | `#C8A47E` | `mat_oak_natural` → hãng, mã, đơn giá, m² |
| Đổi vật liệu | Tô lại tay | Đổi mã → **bản vẽ + callout + BOQ tự đổi** |

### Bốn chế độ hiển thị — cùng một dữ liệu, một nút chuyển
| Chế độ | Vẽ ra sao | Dùng khi |
|---|---|---|
| **Kỹ thuật** | Hatch nét đen theo TCVN + ký hiệu | Hồ sơ nộp, in trắng đen |
| **Trình bày** | Màu đại diện | Deck khách, MB bố trí |
| **Ảnh thật** | Thumbnail lát nền đúng **real-world scale** | MB lát sàn, ốp tường |
| **Phân tích** | Tô theo nhóm (gỗ / gạch / đá) | Kiểm tra, bóc khối lượng |

⚠️ `tiling size (mm)` là trường **BẮT BUỘC**. Gạch 600×600 mà hiện mỗi viên 2m thì bản vẽ vô
nghĩa — sai scale là sai cả bản vẽ lẫn render.

### Vùng tô tự biết diện tích
`24.5 m² mat_oak_natural` → callout · legend tự sinh · BOQ (m² × đơn giá + hao hụt) ·
prompt AI · gán bề mặt V-Ray/D5.

## 4. L6 — Vật liệu ↔ Ánh sáng *(moat mới)*

| Mức | Làm được | Chi phí |
|---|---|---|
| 1 · Hình học | Vị trí đèn · vùng phủ · khoảng cách chuẩn → diagram bố trí | 0 credit |
| **2 · Công thức lumen** | **E = (Φ × n × UF × MF) / A** → lux trung bình phòng, so QCVN/TCVN | 0 credit |
| 3 · Mô phỏng vật lý | Vệt sáng, phản xạ thật | ❌ để V-Ray/D5/Dialux |

**Mấu chốt**: mức 2 cần **hệ số phản xạ** *(reflectance)* của trần/tường/sàn — chính là thuộc
tính vật liệu vừa tô (sơn trắng ~0.8, gỗ sẫm ~0.2). ⇒ **Tô vật liệu xong biết phòng đủ sáng
chưa.** Không app 2D nào làm được.

> Ghi chú thiết kế: trong render, "đẹp" phân bổ khoảng **ánh sáng 40% · góc máy 25% · vật liệu
> 20% · hậu kỳ 15%**. Muốn đẹp nhanh thì **preset ánh sáng + preset camera** lãi hơn dồn sức vào maps.

### Mặt bằng chiếu sáng *(lighting plan)* — 3 mức, một nguồn dữ liệu

> **KHÔNG phải mô phỏng ánh sáng vật lý** — là hiệu ứng đồ hoạ 2D thuần.
> SVG/Canvas: **0 credit, hiển thị tức thì, không AI, không GPU.**

| Thành phần | Kỹ thuật |
|---|---|
| Nền tối, nét sáng | Đảo màu mặt bằng vector |
| Quầng sáng tròn ở đèn | **Radial gradient** tại toạ độ đèn |
| Vệt sáng dài (LED hắt) | **Linear gradient** dọc theo đường |
| Hai đèn chồng nhau sáng hơn | **Blend mode** screen/add |

**Nguyên liệu IF đã có**: mặt bằng vector + layer ✅ · blend/gradient 🟡 *(nhóm 1 editor toolkit)*
· **đối tượng "đèn" có ngữ nghĩa** (vị trí · loại · quang thông) ⬜ **CHƯA — đây là thứ chặn**
⇒ chính là **Pha 2 mô hình ngữ nghĩa** (`SPEC-SEMANTIC-MODEL.md` §3). Không phải việc mới,
giờ có thêm lý do rất cụ thể để làm.

| Mức | Ra cái gì | Chi phí | Dùng để |
|---|---|---|---|
| **1 · Trang trí** | Quầng sáng đều, đẹp mắt | Rẻ nhất | **Social · deck** — format này viral thật (2.1k likes) |
| **2 · Có căn cứ** | Quầng to nhỏ **theo quang thông + góc chiếu thật** của từng loại đèn | Rẻ | Trình bày CĐT — nhìn là biết đèn nào mạnh |
| **3 · Tính lux** | **Con số** lux từng phòng, so QCVN | Rẻ (lumen method) | Kiểm tra kỹ thuật — **moat L6** |

⭐ **Cùng một layer đèn nuôi cả ba.** Studio khác phải vẽ tay mặt bằng đẹp *rồi lại* tính lux
riêng bằng Dialux. IF làm một lần.
Mức 2 hơn hẳn cách vẽ tay: quầng sáng **theo đèn thật đã chọn trong ATLAS** ⇒ nhìn ra chỗ thiếu
sáng mà chưa cần tính.

**Nối tiếp**: mặt bằng chiếu sáng + Animated Layout loại 5 (ngày↔đêm) = một trong những nội dung
social mạnh nhất của studio nội thất.

## 5. Chuẩn chung để dùng được cả V-Ray lẫn D5

**PBR** *(Physically Based Rendering)* là ngôn ngữ chung mọi engine hiện đại. Lưu ATLAS theo
chuẩn PBR (gốc: **MaterialX `.mtlx`** hoặc **glTF PBR**), rồi xuất từng engine:

| Engine | Xuất | Độ khớp |
|---|---|---|
| V-Ray | `.vrmat` / VRayMtl | 🟢 cao |
| D5 Render | thư viện D5 / glTF | 🟢 cao (D5 vốn PBR-based) |
| SketchUp / 3ds Max | qua engine tương ứng | 🟡 |

⚠️ **Không có convert 1:1 hoàn hảo** — V-Ray có subsurface, clearcoat, anisotropy mà D5 không map
hết. Xử đúng: ATLAS giữ **bản PBR gốc** làm chân lý, xuất kèm **ghi chú hao hụt** *(conversion notes)*.

## 6. Nguồn map — hợp pháp

| Nguồn | Ghi chú |
|---|---|
| **Hãng vật liệu VN** (An Cường, Đồng Tâm, Vicostone…) | Thường cho tải texture sản phẩm — **tốt nhất, đúng thị trường, có mã có giá** |
| ambientCG · Poly Haven | **CC0** — dùng thương mại thoải mái |
| Tự chụp / tự scan | Sạch tuyệt đối |
| ❌ Chaos Cosmos / thư viện trả phí của V-Ray | **Không phát lại trong app** — vi phạm giấy phép |

Trường **nguồn + giấy phép** trong schema chính là để chặn việc này.

## 7. ⚠️ KHÔNG xây node editor vật liệu trong IF

Shader graph editor là dự án cỡ **một app riêng**, trong khi 99% designer nội thất chỉ cần
**chọn vật liệu có sẵn + chỉnh 3 thứ** (màu · độ bóng · kích thước lặp) — đó là **form đơn giản**,
không phải graph.

| Bậc | Nội dung |
|---|---|
| **N** | Duyệt kho · xem trước · gán vào bề mặt CAD · xuất `.vrmat`/D5 |
| **P** | Chỉnh nhanh màu · độ bóng · tiling · **tự sinh prompt AI từ mã vật liệu** |
| **L** | Mini node graph trộn 2 vật liệu — **chỉ khi có người thật đòi** |

## 8. Lộ trình

| Khi nào | Làm gì |
|---|---|
| **Bây giờ** | Chốt schema 4 mặt (T1, rẻ, không đụng UI) |
| **Song song** | Nhập **ATLAS Vol.3 Lark Base** — 30–50 vật liệu hay dùng nhất, đủ 3 mặt đầu 🔴 ưu tiên 1 |
| Sau nền CAD | Bậc N: kho vật liệu + vùng tô + gán bề mặt + xuất V-Ray/D5 |
| Sau cùng | Mặt PBR đầy đủ · L6 tính lux · mini node graph nếu thật cần |

---

*v1.1 (thêm §4 Mặt bằng chiếu sáng — 3 mức, một nguồn dữ liệu) · 2026-07-26 · Ben soạn theo ý Hoà.*

