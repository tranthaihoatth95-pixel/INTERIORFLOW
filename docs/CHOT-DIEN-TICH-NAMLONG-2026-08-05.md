# CHỐT — NGUỒN DIỆN TÍCH NAM LONG & HƯỚNG XỬ ĐỐI CHIẾU DIỆN TÍCH

Ngày 05/08/2026 · COWORK-TỔNG chốt sau báo cáo phiên PHU "Nạp mặt bằng DXF thật".
Append-only. Không sửa dòng cũ.

---

## 1 · Chốt: PDF khung tên là NGUỒN CHUẨN cho diện tích, không phải DXF

| Sàn | PDF khung tên | Bộ concept TTT 29/05 (p9) | DXF | **CHỐT** |
|---|---|---|---|---|
| 5B | 474 | 474 | 474 | **474** |
| 8 | 448 | 448 | 448 | **448** |
| 9 | 493 | 493 | 493 | **493** |
| 10 | 454 | 454 | 454 | **454** |
| 11 | 474 | 474 | ⚠️ 493 | **474** |
| 12 | 431 | 431 | ⚠️ không có | **431** |
| | | | | **Tổng 6 sàn = 2.774** |

Bộ concept p9 còn ghi thêm, ngoài 6 sàn trên:
GF 146 · L2 262 · **SF (canteen/co-working) 356** · Tổng phạm vi cải tạo **3.392 m²**
(= 262 + 474 + 448 + 493 + 454 + 474 + 431 + 356, không tính GF).

Hoà chốt **bỏ hẳn tầng 2** ⇒ phạm vi làm việc = **3.130 m²** (6 sàn + SF 356).

---

## 2 · Vì sao DXF TANG11 ghi 493 mà không lấy — rác copy-paste, không phải mâu thuẫn

Vật chứng từ báo cáo phiên PHU:

- Chuỗi `493 m2` trong `07_TANG11-TTT.dxf` nằm ở block `A$C4FA96E9C`,
  **không được INSERT nào tham chiếu** ⇒ định nghĩa mồ côi ⇒ **không hiển thị trên bản vẽ**.
- 493 đúng bằng diện tích tầng 9.
- PDF in ra của chính file đó ghi **474**.

⇒ Người vẽ copy file tầng 9 làm tầng 11, sửa khung tên hiển thị thành 474,
định nghĩa block cũ còn sót trong section BLOCKS.

`08_TANG12`: `grep -c "m2"` = 1, không có chuỗi dạng `NNN m2` ⇒ số 431 lấy từ PDF + concept.

### Hệ quả cho `planAreaCrossCheck()`

**Giữ nguyên cơ chế.** Nó không phát hiện lỗi parser — nó phát hiện **rác trong file gốc**.
Đó là giá trị thật, đáng giữ.

**Đổi cách diễn giải cảnh báo:** khi số trong DXF lệch số khung tên PDF, thông điệp phải là
*"nghi block mồ côi sót từ file nguồn khác — đối chiếu PDF"*, KHÔNG phải *"nạp sai"*.

---

## 3 · Chốt: KHÔNG làm planar face finding — hạ xuống sau ship

Phiên PHU đã thử convex hull và **loại bỏ đúng** (lệch +37% TANG11, +50% TANG12 — N4/K3).
Đề xuất tiếp theo là dò mặt phẳng để dựng đa giác sàn từ đoạn rời.

**Không làm.** Ba lý do:

1. Ba nguồn số đã khớp nhau (mục 1). Phép tự tính chỉ để đối chiếu, không phải để dùng.
2. Bản vẽ **không có ranh giới thuê** — đường polyline khép kín lớn duy nhất trong cả 6 file là
   khung giấy trên layer `defpoints` (1.247 m² và 922 m², y hệt nhau ở cả 6 sàn).
   Đường bao sàn vẽ bằng nhiều đoạn rời trên `A-Wall`/`A-Par-Glass`.
3. Thứ zoning thật sự cần là **vùng dùng được**, không phải con số m² — và `mainClusterBox()`
   đã cho: 28,5–34,7 × 26,2–28,1 m (thay cho khung bao thô 12.311 × 15.492 m).

Đổi một thuật toán khó lấy một con số đã có từ ba nguồn là không đáng.
Ghi vào hàng đợi sau ship, không phải bỏ vĩnh viễn.

---

## 4 · Ba việc kế tiếp, xếp theo mức chặn

| # | Việc | Mảng | Vì sao |
|---|---|---|---|
| 1 | **Đo bộ nhớ trong trình duyệt thật**, 1 sàn rồi 6 sàn | PHU | 327 MB heap/sàn (đo bằng Node). Sáu sàn ≈ 2 GB. Đây mới là con số chặn, không phải 0,98 giây. Trình duyệt còn cộng `FileReader`. |
| 2 | **Cảnh báo mất cấu trúc block khi xuất** | PHU | `exportDxf` chưa ghi INSERT. Mở file có block rồi xuất lại ra hình đã phẳng. Không cảnh báo thì đúng kiểu lỗi im lặng làm mất dữ liệu mà phiên này vừa vá. |
| 3 | **Nối `computeHeights()` vào `lib/three/cad-to-obj.ts`** | G4 | `lib/cad/levels.ts` đã xong tầng dữ liệu từ trước, render vẫn `builder.prism(h.points, 0, wallH)` — đùn từ z=0. Mảng G4 đang trống. |

Ba việc tách mảng nên chạy song song được.

---

## 5 · Ghi nhận khác từ báo cáo phiên PHU

- **Lưới cột lệch ±100 mm** vì lấy vị trí *chữ nhãn* chứ không phải tim trục.
  Tổng nhịp 25.200 mm khớp chính xác. Đủ cho zoning; **không đủ** cho ghi kích thước hồ sơ —
  bước đó phải lấy tim trục thật từ đường trục trên `E-DimTruc`.
- **`04_TANG8-TTT.dxf` có 3 bản sao block "SDG" đặt cách gốc 12 km** — đúng nội dung file gốc,
  không phải lỗi parser. `mainClusterBox()` đã xử đúng.
- **Docstring `dxf.ts` khai sai**: nói đọc được POLYLINE/VERTEX nhưng `buildEntity` trả `null`.
  Riêng TANG11 có 2.700 POLYLINE + 19.583 VERTEX trong BLOCKS. Đã vá.
- **Điểm thiết kế tốt cần giữ**: `dxf-plan.ts` để mọi danh sách layer làm **tham số truyền đè**,
  không hardcode — docstring ghi rõ *"tên layer là quy ước của bộ hồ sơ, không phải chuẩn ngành"*.
  Hồ sơ studio khác sẽ khác. Giữ nguyên nguyên tắc này cho mọi module đọc bản vẽ về sau.

---

## 6 · Lỗi của COWORK-TỔNG trong phiếu gốc

Phiếu ghi diện tích 6 sàn mà **không ghi nguồn là PDF khung tên**. Phiên PHU đi tìm trong DXF,
gặp số lệch, phải dừng lại hỏi. Mất một vòng.

**Luật rút ra — bổ sung cho N8:** số liệu đưa vào phiếu phải ghi kèm **nguồn lấy từ đâu**,
không chỉ ghi giá trị. `474 m²` là chưa đủ; phải là `474 m² (khung tên PDF 07_TANG11-TTT-Model.pdf)`.
