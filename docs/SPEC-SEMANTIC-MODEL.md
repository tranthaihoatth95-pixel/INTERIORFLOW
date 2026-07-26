# SPEC — MÔ HÌNH NGỮ NGHĨA 2D *(semantic 2D model / BIM-lite)*

> **[CẦN HOÀ DUYỆT]** · Thuộc tầng **T1 lõi mã chung**. Đây là quyết định đắt nhất của IF:
> chốt đúng thì Render + Present + Bảng tính rẻ đi; chốt sai thì đắt gấp bội.
> Đọc cùng `IF-CORE-SCHEMA.md` và `IF-ARCHITECTURE-BLUEPRINT-v1.md`.

---

## 1. IF đứng ở đâu

| | AutoCAD | Revit / IFC | **IF** |
|---|---|---|---|
| Lưu gì | Hình học + **tên layer là chuỗi ký tự** | Đối tượng có ý nghĩa, mô hình 3D đầy đủ | Hình học 2D **có ngữ nghĩa** |
| Máy hiểu? | ❌ `A-WALL` chỉ là chữ | ✅ | ✅ ở mức cần |
| Bóc khối lượng | Tay | Tự động | Tự động (2D) |
| Cái giá | Nhẹ nhưng câm | Nặng, chậm | Nhẹ mà biết mình là gì |

**Chỗ đứng**: bản vẽ 2D *biết mình là gì* — giữa bản vẽ câm và mô hình nặng.

## 2. Nguyên tắc gốc — một mô hình, nhiều bản chiếu *(one model, many views)*

Chặng CAD định nghĩa ngữ nghĩa **một lần**; mọi bản vẽ chỉ là **bộ lọc** *(view filter)* của
cùng dữ liệu — KHÔNG phải file riêng:

- MB kỹ thuật (hatch TCVN) · MB vật liệu (ảnh thật) · MB màu zone · MB đèn · MB MEP sơ bộ · mặt cắt

→ Render đọc vật liệu + ánh sáng có sẵn · Present nhận vector · Bảng tính đọc diện tích + mã vật liệu.

## 3. Các lớp ngữ nghĩa — và LUẬT chống mô hình hoá quá mức

> **Luật**: mỗi lớp ngữ nghĩa chỉ thêm khi **đã có nơi tiêu thụ nó**.
> Vi phạm = người vẽ phải khai báo quá nhiều mới vẽ được một nét → bỏ app (bệnh của Revit).

| Pha | Thêm ngữ nghĩa | Nơi tiêu thụ đã có |
|---|---|---|
| **1** | Phòng (tên + diện tích) · vùng vật liệu (`matId`) · loại tường | BOQ · MB vật liệu · checker |
| **2** | Zone công năng · đèn (loại + quang thông lm) | MB màu zone · tính lux · diagram |
| **3** | MEP sơ bộ · thiết bị | MB MEP · phối hợp |
| 4 | Chi tiết cấu tạo | IF2 thi công |

## 4. Vùng tô: màu ≠ vật liệu

- **Màu** = thuộc tính hiển thị. **Vật liệu** = dữ liệu (`matId` → hãng, mã, giá, m²).
- Một vùng, **4 chế độ hiển thị** dùng chung dữ liệu: Kỹ thuật (hatch TCVN) · Trình bày (màu
  đại diện) · Ảnh thật (thumbnail đúng **real-world scale**) · Phân tích (theo nhóm).
- ⚠️ `tiling size (mm)` là trường **bắt buộc** — sai scale là sai cả bản vẽ lẫn render.

## 5. L6 — Vật liệu ↔ Ánh sáng *(moat mới)*

| Mức | Làm được | Chi phí |
|---|---|---|
| 1 · Hình học | Vị trí đèn, vùng phủ, khoảng cách chuẩn → diagram bố trí | Rẻ, 0 credit |
| **2 · Công thức lumen** | **E = (Φ × n × UF × MF) / A** → lux trung bình phòng, so QCVN/TCVN | Rẻ, 0 credit |
| 3 · Mô phỏng vật lý | Vệt sáng, phản xạ thật | ❌ để V-Ray/D5/Dialux |

**Mấu chốt**: công thức mức 2 cần **hệ số phản xạ** *(reflectance)* của trần/tường/sàn — chính là
thuộc tính của vật liệu vừa tô (sơn trắng ~0.8, gỗ sẫm ~0.2). Tô vật liệu xong **biết phòng đủ
sáng chưa**. Không app 2D nào làm được → thêm vào danh sách moat: **L6 Vật liệu ↔ Ánh sáng**.

## 6. Present hưởng lợi — cơ chế kiểu InDesign

| Tầng liên kết | Đổi 1 chỗ → đổi ở đâu | Nền đã có |
|---|---|---|
| Style chữ/màu *(shared styles)* | Toàn deck | `theme-roles.ts` |
| Master trang *(master page)* | Mọi trang cùng loại | `DECK_STANDARDS` |
| **Liên kết sống về CAD** *(live link)* | Sửa bản vẽ → mặt bằng trong deck tự cập nhật | ⬜ — moat, Canva/Gamma không thể có |

**Vector xuyên suốt — có một chỗ đứt**: CAD → Present giữ vector (in A3 300dpi sắc nét, đổi màu
được). Ảnh AI render là **raster**, không vector hoá được. ⇒ Nghẽn 1344px chỉ ảnh hưởng ảnh render,
KHÔNG ảnh hưởng bản vẽ — mặt bằng vật liệu in A3 nét ngay hôm nay.

## 7. Bảng tính / khái toán hưởng lợi

Vùng tô biết diện tích + `matId` → BOQ tự sinh (m² × đơn giá + hao hụt) → báo giá.
Cùng lúc: callout trên bản vẽ · legend tự sinh · prompt AI · xuất `.vrmat`/D5. Một lần vẽ, năm nơi dùng.

---

## 8. LLM ↔ HÌNH HỌC — phân vai bắt buộc

### Bằng chứng lỗi (ảnh layout AI sinh, 26/07)
- Đồ nội thất **đè lên tường** bếp
- **Tổng chuỗi kích thước sai**: 1850 + 3700 + 1850 = 7400 ≠ **7200** ghi bên cạnh
- **Nhãn chồng nhau** ("PHÒNG NGỦ 12.1m²" đè ghi chú; 1700/850/1290 chồng)
- Thiết bị **tràn ra ngoài ranh phòng** (bếp 5.7m²)
- Vạch **thang tỉ lệ không đều**

⇒ Đây là **lỗi TOÁN HỌC**, không phải lỗi thẩm mỹ. Chứng minh: **LLM không tính — nó chỉ viết ra
số nhìn "hợp lý"**. LLM sinh ra chữ, không sinh ra hình; nó đọc `x: 3200` như một chuỗi ký tự.

### Phân vai

| Việc | Ai làm |
|---|---|
| Hiểu đề bài ("căn hộ 2PN, bếp mở, ưu tiên view") | **LLM** ✅ |
| Suy luận công năng ("phòng ngủ nên nằm phía đông") | **LLM** ✅ |
| Chọn ý định ("sofa dựa tường bắc, bàn trà ở giữa") | **LLM** ✅ |
| **Tính toạ độ x/y** | **CODE** — LLM **tuyệt đối không** viết ra số toạ độ |
| **Kiểm chồng lấn · lối đi · ranh phòng** | **CODE** |
| **Đặt nhãn tránh đè** | **CODE** |
| **Cộng chuỗi kích thước** | **CODE** |

> ⭐ **LLM là kiến trúc sư trưởng ra quyết định. CODE là hoạ viên cầm bút.**
> Kiến trúc sư trưởng không tự đo từng milimet.

### Bốn lớp bắt buộc

```
① LLM → Ý ĐỊNH có cấu trúc (JSON, KHÔNG có số x/y)
   { phòng: "ngủ", vị_trí: "đông-bắc", diện_tích_mong_muốn: 12,
     đồ: [{ loại: "giường đôi", dựa_tường: "bắc", cách_mm: 0 }] }
        ↓
② SOLVER — chia ô + đặt đồ theo RÀNG BUỘC, TÍNH toạ độ
   (dựa tường · giữa 2 vật · lối đi ≥900mm · không chồng)
        ↓
③ VALIDATOR — kiểm: chồng lấn (SAT đã có) · lối đi · trong ranh phòng · tổng kích thước khớp
   Sai → tự đẩy ra, tối đa 3 vòng. Vẫn sai → **BÁO LỖI, KHÔNG vẽ ra bản sai.**
        ↓
④ RENDERER — vẽ nét · đặt nhãn **tránh đè** (label collision avoidance)
   · chuỗi kích thước **TỰ CỘNG TỪ HÌNH HỌC**, không bao giờ nhận số gõ tay
```

**Lớp ②③④ là code thuần**: 0 credit · chạy tức thì · kết quả **lặp lại được** (cùng đầu vào ra
cùng kết quả). **~90% chất lượng bản vẽ nằm ở ba lớp này, không nằm ở LLM.**

⚠️ **Luật kích thước liên kết** *(associative dimension)*: chuỗi kích thước **tự cộng từ hình học**,
vẽ ra bao nhiêu ghi bấy nhiêu ⇒ không bao giờ có chuyện 7400 ≠ 7200.

**Từ khoá**: constraint solver · space partitioning · label placement algorithm ·
associative dimensions · generate-then-verify · rectangle packing.

---

*v1.1 (thêm §8 LLM ↔ Hình học — phân vai bắt buộc) · 2026-07-26 · Ben soạn theo ý Hoà. Thuộc T1 — sửa phải qua duyệt.*

