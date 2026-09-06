# ⛔ CHUẨN ĐẦU RA NGHỀ — LUẬT CỨNG cho MỌI SẢN PHẨM IF XUẤT RA (lập 11/08/2026)

> Hoà đặt bài: *"chưa một lần đặt ra tiêu chuẩn khắt khe của ngành làm luật cứng — thế nào là
> chuẩn sản phẩm của một cỗ máy được tối ưu sâu cho ngành nghề."*
> Bài học sinh ra luật: 11/08 lần đầu MỞ FILE ĐẦU RA bằng mắt (layout.pdf) — engine đủ giải
> phẫu bản vẽ nghề nhưng chết vì 3 lỗi trình bày (chữ đè hình · tỷ lệ 1:47 · khung tên lộ
> jargon). Kiểm code không bắt được loại lỗi này — chỉ CHUẨN ĐẦU RA + MỞ FILE mới bắt được.
>
> **LUẬT NGHIỆM THU MỚI (đứng trên mọi phiếu):** frontier nào sinh sản phẩm xuất được thì
> nghiệm thu = MỞ FILE ĐẦU RA soi theo checklist dưới — tsc/test/screenshot KHÔNG đủ.
> Mỗi gạch đầu dòng là điều kiện NHỊ PHÂN (đạt/trượt), ưu tiên máy chặn được.

## §1 · BẢN VẼ KỸ THUẬT (PDF · DXF · in) — khuôn ISO 128 / TCVN 8-30 / thói quen hồ sơ VN

**Tỷ lệ & khổ giấy**
- [ ] Tỷ lệ THUỘC DÃY CHUẨN: 1:1 · 1:2 · 1:5 · 1:10 · 1:20 · 1:25 · 1:50 · 1:100 · 1:200 · 1:500.
      Fit-trang phải BẮT về nấc chuẩn gần nhất (về phía nhỏ hơn) — cấm in số lẻ kiểu "1:47".
- [ ] Khổ giấy đúng ISO 216 (A0–A4), khung viền đủ, mép gáy 20mm khi hồ sơ đóng tập.

**Khung tên** (đọc Brand Kit dự án — không hardcode)
- [ ] Đủ 9 ô: tên dự án · hạng mục · tên bản vẽ · MÃ SỐ bản vẽ · tỷ lệ · ngày · người vẽ ·
      người kiểm · revision. Thiếu ô nào = trượt.
- [ ] KHÔNG jargon nội bộ trong tên bản vẽ (bắt được: "(đã rà công năng)" 11/08).

**Chữ & nhãn**
- [ ] Chiều cao chữ khi IN: dim ≥1.8mm · nhãn phòng ≥2.5mm · tiêu đề ≥3.5mm.
- [ ] Nhãn KHÔNG đè hình học, KHÔNG đè nhau — máy phải né hoặc dùng leader
      (bắt được: "PHÒNG NGỦ" gạch qua giường, "WC 3.6m²" đè thiết bị, 11/08).
- [ ] Nhãn phòng kèm diện tích m² 1 số lẻ; đơn vị dim là mm KHÔNG ghi hậu tố.

**Kích thước (dim)**
- [ ] Dim nằm NGOÀI hình, chuỗi thẳng hàng, tổng ở lớp ngoài cùng
      (bắt được: chuỗi 1850/850/1700/1290/510 nằm trong phòng + chồng nhau, 11/08).
- [ ] Không dim trùng lặp cùng một cạnh; không dim đè trục/bong bóng trục.

**Nét & ký hiệu**
- [ ] Lineweight theo bảng (đã có LineweightTable): tường cắt ~0.5 · thấy ~0.25 · dim/hatch 0.13.
- [ ] In THỬ trắng-đen vẫn phân biệt được mọi lớp (không dựa vào màu).
- [ ] Đủ ký hiệu tối thiểu: cửa có cánh mở · cốt ±0.000 · hoa gió · trục bong bóng · thước tỷ lệ.
- [ ] Poché tường cắt nhất quán toàn bản vẽ.

## §2 · ẢNH RENDER / PHỐI CẢNH
- [ ] ≥300dpi tại khổ in đích (LUAT-300DPI đã có — nay là một dòng của chuẩn này).
- [ ] Tầm mắt 1500–1650mm trừ khi chủ đích ghi rõ góc khác; đứng thẳng 2 điểm tụ (không đổ tường).
- [ ] Soi 100%: không artifact AI (tay ghế biến dạng, vân trôi, chữ giả); không watermark.
- [ ] sRGB; ảnh trong hồ sơ có mã img_ + provenance (từ scene/recipe nào).

## §3 · BOQ / BẢNG TÍNH (XLSX)
- [ ] Mỗi dòng đủ: mã · tên · ĐƠN VỊ CHUẨN (m²/m/cái/bộ) · khối lượng · đơn giá · thành tiền.
- [ ] Khối lượng TRUY được về bản vẽ (provenance); số sửa tay phải mang badge sửa-tay.
- [ ] Đơn giá có NGUỒN + NGÀY; wastage khai rõ %, không cộng ngầm.
- [ ] Tổng cộng khớp tổng dòng; không ô trống lặng lẽ; số tabular, VND không lẻ đồng.
- [ ] File mở bằng Excel thật không lỗi, không mất định dạng cột.

## §4 · DECK / HỒ SƠ TRÌNH CHIẾU (PDF · PPTX)
- [ ] Chữ body ≥18pt cho trình chiếu; tương phản đạt AA trên MỌI nền ảnh (autoColor P6a).
- [ ] Ảnh đủ pixel cho khổ xuất (không vỡ); chữ trong PPTX SỬA ĐƯỢC sau xuất.
- [ ] Brand Kit dự án áp đúng (logo/màu/font khách) — 0 vết thương hiệu studio khác.
- [ ] 0 placeholder sót: `{{ }}` · lorem · "Untitled" · ảnh xám mẫu.
- [ ] Trang có số trang + revision hồ sơ.

## §5 · VĂN BẢN / HỒ SƠ GIẤY (khi editor Văn bản ra đời — chuẩn viết TRƯỚC, đúng luật §9)
- [ ] Font nhúng trong PDF; lề chuẩn; >10 trang phải có mục lục; số trang từ trang 2.
- [ ] Biến động (tên dự án/khách/ngày) điền từ dữ liệu dự án — 0 chỗ gõ tay trùng lặp.

## §6 · CƠ CHẾ THI HÀNH — hai tầng, rẻ
1. **Máy chặn lúc xuất** (mở rộng `lib/print/export-checks.ts` đã có): tỷ lệ ∉ dãy chuẩn ·
   khung tên thiếu ô · nhãn giao hình học (bbox test) · placeholder sót · dpi thiếu · tổng BOQ
   lệch → chặn kèm lý do + nút sửa. Marker code: `CHUAN_DAU_RA`.
2. **Mắt người theo checklist** — dialog xuất hiện checklist §1-§5 thu gọn; người xuất tick.
   Registry frontier: mọi entry sinh file xuất phải kèm dòng "nghiệm thu = mở file".

> Luật này là con đẻ của LUẬT 300DPI + §2c chống-ngô-nghê + LUẬT NGÔN NGỮ — gom về MỘT cửa:
> sản phẩm ra khỏi IF là mang chuẩn nghề, không mang dấu "máy làm".

---

## §7 · LẦN SOI FILE THẬT — 06/09/2026 (lane OUTPUT TRUTH)

Dựng dữ liệu **qua app thật** (vẽ 2 vùng tô, gán 2 vật liệu kho có giá), xuất qua **đúng nút
người dùng bấm**, rồi **mở từng tệp ra đọc**. Tệp gốc + ảnh: `docs/ship/anh/dau-ra-2026-09-06/`.
Đọc `.xlsx` bằng `openpyxl` (bộ đọc độc lập, không phải bộ ghi của IF); đo khổ PDF từ `/MediaBox`;
đếm pixel trang A3 bằng Pillow.

**Dữ liệu thật đã dựng** — `hatch` mang ĐỦ HAI danh tính (`specId` cuid kho + `matId` UUID vật liệu):
`ps-truth-go-soi` 4400×2900mm · `ps-truth-terrazzo` 1677,69×1102,48mm.

### §3 · BOQ / XLSX — 3 ĐẠT · 2 KHÔNG ĐẠT · 1 phần

| dòng checklist | phán | bằng chứng |
|---|---|---|
| mã · tên · đơn vị chuẩn · khối lượng · đơn giá · thành tiền | **ĐẠT** | 10 cột, `G='m2'`, không cột nào rỗng ngoài "Ảnh" |
| khối lượng truy được về bản vẽ | **ĐẠT trên màn · KHÔNG ĐẠT trong tệp** | màn: "LẤY TỪ 1 vùng tô" + "Bấm để xem trên bản vẽ". Tệp: 0 dấu vết |
| **số sửa tay mang badge sửa-tay** | 🔴 **KHÔNG ĐẠT** | sửa 12,76 → 20 m²: tệp ghi `F2=20`, **giống hệt ô đo được**; `12.76` biến mất khỏi zip; grep `sửa/tay/override/mô hình/comment` = 0 |
| đơn giá có **NGUỒN + NGÀY** | 🔴 **KHÔNG ĐẠT** | không có cột nguồn/ngày; `MaterialSpecLite` không mang `priceNote`/`syncedAt` — rụng ngay ở tầng tính |
| hao hụt khai rõ %, không cộng ngầm | **ĐẠT** | cột I = 8 và 5, tách khỏi đơn giá |
| tổng khớp tổng dòng | **ĐẠT** | `J4 = =SUM(J2:J3)` — công thức SỐNG, không phải số chết |
| không ô trống lặng lẽ | **PHẦN** | `E2`/`E3` (cột Ảnh) trống câm trong tệp (màn hiện "—") |
| số tabular · VND không lẻ đồng | **ĐẠT** | `#,##0" đ"` cho tiền · `#,##0.00` cho khối lượng |
| mở bằng bộ đọc thật không lỗi | **ĐẠT (có 1 cảnh báo)** | openpyxl mở được; cảnh báo *"Workbook contains no default style"* — `styles.xml` thiếu `<cellStyles>` |
| 0 placeholder | **ĐẠT** | quét `{{ }}`/lorem/Untitled/NaN/undefined trên toàn zip = 0 |

⭐ **SỐ HỌC TỰ KIỂM TAY ĐƯỢC — ĐẠT, và đây là điểm mạnh nhất của bảng.**
`12,76 × 1,08 × 1.250.000 = 17.226.000` = đúng `J2`. `1,85 × 1,05 × 890.000 = 1.728.825` = đúng `J3`.
Tổng = 18.954.825 = đúng `J4`. Tính tay từ diện tích THÔ (1,8496 m²) ra 1.728.470 — **lệch 355đ**,
và bảng **đúng**, người soi sai: `compute.ts:94-105` cố ý nhân từ m² ĐÃ LÀM TRÒN để mọi con số in
ra bấm máy tính lại được. Ghi lại để lần sau không báo nhầm đây là lỗi.

### §4 · A3 PDF — khổ giấy ĐẠT · nội dung CHƯA CÓ

🔴 **HAI ĐƯỜNG PDF, một đường ra sai khổ:**

| nút | hàm | khổ đo từ `/MediaBox` | phán |
|---|---|---|---|
| **"PDF"** | `exportDeckToPdf` (`unit:'px'`) | 3621×2560 pt = **1277,5×903,1 mm** | 🔴 **KHÔNG ĐẠT ISO 216** — gấp ~3 lần A3; ảnh nhúng 2716×1920 ⇒ **54 dpi** |
| **"PDF in 300dpi (A3/A4)"** | `exportDeckToPdfAtPaperSize` (`unit:'mm'`) | 1190,6×841,9 pt = **420,0×297,0 mm** | ✅ **ĐẠT** — ảnh 4960×3506 ⇒ **299,96 dpi**, đúng LUẬT 300DPI |

Người dùng chọn "Bảng vật liệu A3" rồi bấm mục tên **"PDF"** thì ra tệp KHÔNG phải A3. Nhãn phụ có
ghi *"đúng khổ đã chọn (màn hình/chiếu)"*, nhưng tên mục là "PDF" trần.

🔴 **NỘI DUNG: NOT IMPLEMENTED — trang A3 TRẮNG TRƠN.**
Đếm pixel cả hai tệp: **17.389.760 px, đúng 1 màu `(255,255,255)`, 100,000%**. Không phải lỗi trích
ảnh — trên màn slide cũng trống, canvas hiện cửa "Bắt đầu hồ sơ trình khách".
`PresentSheets.tsx:691` tự khai đúng: *"`material-a3` không hứa một editor vật liệu riêng"* — nó chỉ
là trình dàn trang ở khổ A3. ⇒ **Nhãn "Bảng vật liệu A3" hứa nhiều hơn thứ giao ra.**
Hệ quả cho câu "danh tính vật liệu trên bảng có khớp BOQ không": **trên bảng không có vật liệu nào** —
dù màn chọn hồ sơ ngay trước đó đã đếm đúng *"2 vật liệu · 2 dòng BOQ"*.

### Danh tính vật liệu — chỗ ĐÚNG và chỗ ĐỨT

✅ **ĐÚNG:** đường UI mang đủ hai danh tính xuống `Doc`; BOQ tra ra đúng tên/NCC/mã SP/giá; 0 dòng
mồ côi; 0 lỗi. Sổ 07/08 ghi *"`lib/materials`↔`ProductSpec` = 0 code"* — nay đã có dây và dây chạy.

🔴 **ĐỨT 1 — ảnh vật liệu không đi theo `matId`.** `boqImageUrl()` (`boq-spec-extra.ts:62`) chỉ đọc
`imageAssetId`. Hàng kho trỏ đúng `matId` của "Gỗ sồi tự nhiên" (có `/mau-vat-lieu/go-soi-trang.png`)
vẫn ra cột Ảnh trống. Danh tính tới được, **tài sản thị giác thì không**.

🔴 **ĐỨT 2 — vật liệu hạt giống không lên BOQ được.** `POST /api/boq/[projectId]:60` chỉ đọc
`prisma.productSpec.findMany()`; nó **không trộn `kho-mo-dau.ts`** như 5 mặt tiền kia. Vật liệu ship
kèm bản cài (`specId` dạng `hat-giong:<uuid>`, **cố ý không mang giá** theo luật 2.1.9.i) sẽ rơi vào
`spec-not-found`. ⇒ Máy sạch, chưa nhập kho: chọn được vật liệu, tô được, **không ra dòng BOQ nào**.
(Lượt này né được vì đã gieo kho có giá — tức đo ở ca TỐT NHẤT.)

> **Việc phải làm, theo thứ tự tiền mất:** ① cột/ghi chú "sửa tay" + số máy vào XLSX ② nhãn "PDF"
> không được ra tệp sai khổ khi deck là A4/A3 ③ nguồn+ngày đơn giá ④ trộn hạt giống vào route BOQ
> ⑤ nội dung cho Bảng vật liệu A3 (hoặc đổi nhãn cho đúng thứ đang giao).
