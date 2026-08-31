# DANH MỤC THANG BỐI CẢNH — tầng ② của `IF-CHUAN-NEN.md` §000

> **Lane 02 · RESEARCH** · phiếu `HO-20260830080217-ebe811f852f7` · 30/08/2026
> Lane này **không ghi mã sản xuất**. Ra chữ và số.

## KẾT LUẬN

`FACT` Đã lập được **14 thang bối cảnh** cho nội thất/kiến trúc, trong đó **9 thang có số đo được
cho VN + ≥2 vùng khác**, 5 thang chỉ có số một phần hoặc `CHƯA CÓ SỐ`.

`FACT` **Không thang nào độc lập.** Đo được **11 cặp kéo ngược**. Ca "Neufert sai với người Việt"
không phải ngoại lệ — nó là **một ô** trong ma trận §2, và có ít nhất **ba cụm** khác cùng dạng
(§3): *bậc thang thoải ⟷ diện tích khan*, *bỏ giày ⟷ tiếp cận không bậc*, *phong thuỷ ⟷ hướng nắng*.

`INFERENCE` Hệ quả nặng nhất không phải "chọn số nào" mà là: **một hệ chỉ mang hằng số sẽ tự tin
sai**. Nó kết luận được, nhanh, và không có chỗ nào để biết mình thiếu trục.

`PROPOSAL` Điều phải dựng: **7 tham số bối cảnh có tên** (§4), là **đầu vào**, không phải hằng số
ẩn trong mã — và Vitals phải đọc được chúng.

---

## 0 · CÁCH ĐỌC — mỗi thang có 6 ô, và ô cuối là ô quan trọng nhất

```
tên · ánh xạ từ đâu · nguồn · số (VN + ≥2 vùng) · KÉO NGƯỢC VỚI · độ tin cậy
```

**Độ tin cậy** — ghi thẳng, vì §0 `IF-CHUAN-NEN` cấm dùng số bẩn làm nền:

| | nghĩa |
|---|---|
| **A** | văn bản gốc / cơ quan thống kê / quy chuẩn — trích được |
| **B** | tổng hợp ngành hoặc nghiên cứu đã xuất bản, chưa mở bản gốc trong phiên này |
| **C** | tổng hợp thương mại (blog nhà sản xuất/bán lẻ) — **dùng làm định hướng, cấm làm cổng** |
| **CHƯA CÓ SỐ** | không truy được trong phiên — **cấm điền bằng suy đoán** |

⚠️ **Mọi ô `C` phải lên `A` trước khi biến thành ngưỡng máy chấm.** Đó là nợ, ghi ở §5.

---

## 1 · DANH MỤC 14 THANG

### T1 · NHÂN TRẮC THEO DÂN SỐ
- **ánh xạ từ** dinh dưỡng + y tế + thu nhập của một dân số qua vài thế hệ
- **nguồn** Tổng điều tra dinh dưỡng 2019–2020 (Bộ Y tế · Viện Dinh dưỡng · TCTK) · NCD-RisC 2019 (Lancet 2020, 2.181 nghiên cứu / 65 triệu người) · ISO 7250 (bộ số đo cơ thể)
- **số**

| vùng | nam trưởng thành trẻ | nữ | tin |
|---|---|---|---|
| **VN** | **168,1 cm** (2020) — từ 164,4 cm (2010) | **156,2 cm** — từ 154,8 cm | **A** |
| Hà Lan | **183,8 cm** (19 tuổi, NCD-RisC) | `CHƯA CÓ SỐ` | B |
| Nhật · Mỹ | `CHƯA CÓ SỐ` — NCD-RisC có, phải tải bộ dữ liệu, không tra được qua tóm tắt | | — |

  ⇒ chênh **VN ↔ Hà Lan = 15,7 cm** trên cùng một mặt bàn bếp.
- **KÉO NGƯỢC VỚI** → **T2** (thiết bị đóng khuôn theo thị trường, không theo người) · **T8** (giường dài 2000 dù người thấp hơn) · **T13** (số nhân trắc hôm nay ≠ số lúc chuẩn được viết)

### T2 · CHUẨN KÍCH THƯỚC THIẾT BỊ THEO THỊ TRƯỜNG
- **ánh xạ từ** dây chuyền sản xuất + kênh nhập khẩu của một thị trường — **không** ánh xạ từ cơ thể người dùng cuối
- **nguồn** tổng hợp nhà sản xuất/bán lẻ (Whirlpool · KitchenAid · Maytag · hướng dẫn tủ bếp EU/UK/US) — **toàn bộ mức C**
- **số**

| vùng | mặt bếp | hốc lắp máy rửa chén | tin |
|---|---|---|---|
| **VN** | thực tế đi theo hàng nhập — `CHƯA CÓ SỐ` cho một chuẩn nội địa | theo hàng nhập EU hoặc US | — |
| EU / UK | **900–915 mm** | ~**820 mm** cao × **600 mm** rộng | C |
| Mỹ | **36 in = 914,4 mm** | rộng **24 in**, hốc cao **34½–36 in = 876–914 mm** | C |
| Nhật | chuẩn **850 mm**, hệ system kitchen chọn **800–950 mm** | `CHƯA CÓ SỐ` | C |

  ⇒ Nhật là **phản ví dụ quan trọng**: một thị trường lớn **có** cho chuẩn thiết bị chạy theo nhân trắc, và còn có công thức dân dụng `chiều cao ÷ 2 + 5 cm` (C). Nên "thiết bị buộc phải 900" **không phải hằng số** — nó là đặc tính của **thị trường EU/US**, không phải của vật lý.
- **KÉO NGƯỢC VỚI** → **T1** (đây đúng cặp Hoà chỉ ra) · **T9** (mô-đun tấm) · **T4** (thiết bị 600 mm ăn vào bếp căn hộ nhỏ)

### T3 · QUY ƯỚC NGHỀ THEO VÙNG
- **ánh xạ từ** trường phái đào tạo + hệ tiêu chuẩn quốc gia + phần mềm thống trị thị trường đó
- **nguồn** ISO 128 / ASME Y14.3 · JIS · ISO 216 (khổ A) / ANSI-Arch · ISO 13567 · BS 1192 – Uniclass · AIA CAD Layer Guidelines
- **số / giá trị**

| trục | VN | Mỹ · Canada | Nhật | tin |
|---|---|---|---|---|
| phép chiếu | **góc thứ nhất** (theo ISO, như châu Âu/TQ/Ấn/Nga) | **góc thứ ba** (ASME Y14.3) | **góc thứ ba** ⚠ nguồn mâu thuẫn: có nguồn nói JIS lịch sử từng dùng góc thứ nhất | B |
| khổ giấy | ISO A (A0–A4) | ANSI / Arch | ISO A | B |
| đơn vị · tỉ lệ | mm · 1:50 · 1:100 | ft-in · 1/4″=1′-0″ | mm | B |
| quy ước lớp | chưa có chuẩn quốc gia bắt buộc — `CHƯA CÓ SỐ` | AIA CAD Layer Guidelines | JIS | B |

  ⇒ Đây là thang **không có số**, chỉ có **quy ước** — nhưng nó là thang **gây hỏng nhanh nhất** khi sai, vì bản vẽ đọc sai chiều thì mọi số bên trong đều vô nghĩa.
- **KÉO NGƯỢC VỚI** → **trao đổi tệp**: chọn quy ước bản địa thì đúng người đọc, sai máy đối tác; chọn ISO thì ngược lại · **T9** (đơn vị vẽ ≠ đơn vị mua vật liệu)

### T4 · DIỆN TÍCH Ở BÌNH QUÂN ĐẦU NGƯỜI
- **ánh xạ từ** mật độ dân số + giá đất + giai đoạn phát triển kinh tế
- **nguồn** Điều tra dân số và nhà ở giữa kỳ 2024 (TCTK) · Chính quyền HK (LCQ22, 2023) · tổng hợp quốc tế
- **số**

| vùng | m²/người | tin |
|---|---|---|
| **VN** | **26,6** (2024; +3,4 so với 2019) — chung cư **21,1** · nhà riêng lẻ **26,8** | **A** |
| Hồng Kông | **~15** | B |
| Nhật | **~30–45** (dải, chưa chốt được một con số cơ quan) | B |
| Mỹ | **~65–85** (các nguồn lệch nhau nhiều) | C |

  ⚠️ **CẢNH BÁO SỰ THẬT BẨN**: cùng năm 2024 đang lưu hành **hai** con số — **26,6 m²** (TCTK, điều tra giữa kỳ) và **29 m²** (báo dẫn nguồn ngành xây dựng). **Chưa hoà giải.** Dùng 26,6 vì truy được tới thông cáo TCTK; ghi 29 để người sau không tưởng mình tìm ra số mới.
- **KÉO NGƯỢC VỚI** → **T7** (luật bậc thang thoải ăn diện tích) · **T8** (giường 2000 trong phòng nhỏ) · **T2** (thiết bị chuẩn EU chiếm chỗ) · **mọi khoảng lưu không nhân trắc**: chuẩn lối đi 900–1200 mm không đặt vừa vào 21,1 m²/người

### T5 · QUY MÔ HỘ GIA ĐÌNH
- **ánh xạ từ** cấu trúc gia đình + tuổi kết hôn + tỉ lệ hộ độc thân
- **nguồn** Điều tra dân số và nhà ở giữa kỳ 2024 (TCTK) · Statistical Handbook of Japan · thống kê châu Âu
- **số**

| vùng | người/hộ | tin |
|---|---|---|
| **VN** | **3,5** — thành thị **3,4** · nông thôn **3,6** | **A** |
| Nhật | **2,25** (2021) | B |
| Phần Lan | **1,9** (2024, thấp nhất châu Âu) | B |
| Mỹ · Thuỵ Điển | `CHƯA CÓ SỐ` | — |

  ⇒ Đây là thang quyết định **số chỗ ngồi bàn ăn · số phòng ngủ · dung tích lưu trữ · số bồn rửa** — và nó chênh **gần gấp đôi** giữa VN và Phần Lan.
- **KÉO NGƯỢC VỚI** → **T4** (hộ đông × diện tích/người thấp = tổng diện tích căn vẫn nhỏ) · **T14** (nhiều thế hệ chung nhà là chuẩn mực ở VN, là ngoại lệ ở Bắc Âu)

### T6 · CHIỀU CAO THÔNG THUỶ THEO QUY CHUẨN
- **ánh xạ từ** khí hậu (thông gió đối lưu) + luật xây dựng + kinh tế xây (mỗi cm trần là tiền)
- **nguồn** QCVN 04:2021/BXD mục 2.2 · IRC (Mỹ)
- **số**

| vùng | phòng ở | bếp · vệ sinh | hầm/kỹ thuật | tin |
|---|---|---|---|---|
| **VN** | **≥ 2,60 m** | **≥ 2,30 m** | **≥ 2,00 m** | B (qua bản trích, chưa mở PDF gốc) |
| Mỹ (IRC) | `CHƯA XÁC MINH TRONG PHIÊN` | | | — |
| Nhật · EU | `CHƯA CÓ SỐ` | | | — |

- **KÉO NGƯỢC VỚI** → **T10** (nhiệt đới muốn trần cao để đối lưu ⟷ điều hoà muốn thể tích nhỏ để đỡ tốn điện) · **T4** (trần cao đắt hơn trên đất đắt)

### T7 · BẬC THANG THEO BỘ LUẬT VÙNG
- **ánh xạ từ** khẩu vị rủi ro của cơ quan quản lý + tồn kho công trình cũ + diện tích sẵn có
- **nguồn** TCVN/QCVN (qua bản trích) · IRC R311.7.5 (Mỹ) · Approved Document K (Anh)
- **số**

| vùng | cổ bậc (h) | mặt bậc (b) | công thức | tin |
|---|---|---|---|---|
| **VN** | lối vào có bậc **≤ 150 mm** | **≥ 300 mm** | **600 ≤ b + 2h ≤ 660** | C ⚠ chưa mở văn bản gốc |
| Mỹ (IRC) | **≤ 196 mm** (7¾″) | **≥ 254 mm** (10″) | lệch giữa các bậc ≤ 9,5 mm | B |
| Anh (Part K) | **≤ 220 mm** | **≥ 220 mm** | **550 ≤ 2h + b ≤ 700**, dốc ≤ 42° | B |

  ⇒ Cùng một cầu thang lên 3,0 m: VN cần **≥ 20 bậc**, Anh cho phép **14 bậc**. Chênh **~1,8 m chiều dài sàn**.
- **KÉO NGƯỢC VỚI** → **T4** (VN vừa có luật thang tốn diện tích nhất **vừa** có diện tích/người thấp nhất trong ba vùng so sánh — **đây là mâu thuẫn cấu trúc, không phải lỗi ai**) · **T6**

### T8 · CHUẨN GIƯỜNG / NỆM THEO THỊ TRƯỜNG
- **ánh xạ từ** ngành sản xuất chăn ga nội địa (khoá cứng hơn cả giường) + thói quen ngủ
- **nguồn** tổng hợp nhà bán lẻ VN/US/EU/JP — **mức C**
- **số**

| vùng | đôi phổ thông | đơn | tin |
|---|---|---|---|
| **VN** | **1600 × 2000** · **1800 × 2000** · lớn nhất **2000 × 2200** | | C |
| Mỹ | Queen **60 × 80 in = 1524 × 2032** · King **76 × 80 in** | Twin **38 × 75 in** | B |
| EU lục địa | **140 / 160 × 200** (dài cố định **2000**) | | B |
| Nhật | double **1400 × 1950** · king **1800 × 1950** | single **970 × 1950** | C |

  ⇒ Nhật là vùng **duy nhất** trong bảng có chiều dài **1950**, ngắn hơn 50 mm.
- **KÉO NGƯỢC VỚI** → **T1** (người VN thấp hơn người EU nhưng dùng **cùng** chiều dài 2000 — chuẩn ga gối khoá, không phải cơ thể khoá) · **T4** (giường 1800×2000 trong phòng ngủ căn hộ 21,1 m²/người)

### T9 · MÔ-ĐUN TẤM VẬT LIỆU & BƯỚC KHUNG
- **ánh xạ từ** hệ đơn vị lịch sử của thị trường sản xuất tấm
- **nguồn** Canadian Wood Council · tổng hợp ngành ván
- **số**

| thị trường | tấm | bước khung | tin |
|---|---|---|---|
| Bắc Mỹ | **1220 × 2440** (4×8 ft; ⚠ 4 ft = **1219,2** mm, **không** bằng 1220) | **16″ = 406 mm** · **24″ = 610 mm** o.c. | B |
| hệ mét | **1200 × 2400** | **600 mm** | B |
| EU lục địa | **1250 × 2500** | | B |
| **VN** | thị trường có **cả ba** — `CHƯA CÓ SỐ` về tỉ lệ | | — |

  ⇒ Vẽ lưới **600** rồi mua tấm **1220**: dư **20 mm** mỗi tấm, tích luỹ thành cắt vụn thật.
- **KÉO NGƯỢC VỚI** → **T2** (tủ bếp muốn bội số tấm ⟷ mặt bếp muốn khớp thiết bị) · **T3** (đơn vị vẽ ≠ đơn vị mua)

### T10 · NHIỆT ĐỘ DỄ CHỊU THEO PHƯƠNG THỨC THÔNG GIÓ
- **ánh xạ từ** khí hậu + thói quen thích nghi + mức phổ cập điều hoà
- **nguồn** ASHRAE 55 (mô hình thích ứng) · nghiên cứu công trình thông gió tự nhiên vùng nhiệt đới ẩm
- **số**

| trạng huống | nhiệt độ trung tính | tin |
|---|---|---|
| mô hình tĩnh ASHRAE 55-2004 | **24 °C**, nới **+1 °C** cho vùng nhiệt đới ⇒ ~**25 °C** | B |
| thông gió tự nhiên, nhiệt đới ẩm (đo thực) | **26,2 – 29,9 °C** | B |
| toà vận hành bằng điều hoà | kỳ vọng **ấm hơn ~1,5 °C** so với dự báo ASHRAE 55 | B |

  ⇒ Chênh tới **~5 °C** giữa hai chế độ **trên cùng một cơ thể người**. Thang này không đo khí hậu — nó đo **cách người ta sống trong khí hậu đó**.
- **KÉO NGƯỢC VỚI** → **T6** (trần cao đối lưu ⟷ thể tích điều hoà) · **T11** (vỏ mở ⟷ vỏ kín) · **T2** (chuẩn thiết bị điều hoà nhập theo mô hình tĩnh)

### T11 · THÓI QUEN Ở THEO KHÍ HẬU — vỏ mở / vỏ kín
- **ánh xạ từ** khí hậu + lịch sử phát triển nhà ở + giá điện
- **nguồn** phái sinh từ T10; **chưa có bộ số riêng** — `CHƯA CÓ SỐ` cho các trục định lượng (tỉ lệ diện tích bán ngoài trời, giờ mở cửa sổ/năm)
- **giá trị định tính**: VN — ban công · giếng trời · sân trong · phơi đồ ngoài trời là mặc định · Bắc Âu — vỏ kín, thu hồi nhiệt · Vùng vịnh — vỏ kín hoàn toàn, điều hoà 12 tháng
- **KÉO NGƯỢC VỚI** → **T10** · **quy chuẩn năng lượng** (vỏ càng kín càng đạt điểm, mà nhà thông gió tự nhiên lại **không** cần đạt theo cách đó)

### T12 · BỎ GIÀY TRONG NHÀ
- **ánh xạ từ** tập quán + khí hậu ẩm/bùn + tôn giáo
- **nguồn** ADA 2010 §303 (ngưỡng) — **A** cho vế đối lập; vế genkan `CHƯA CÓ SỐ`
- **số**

| | giá trị | tin |
|---|---|---|
| ngưỡng cửa trên lối tiếp cận (ADA) | **≤ 13 mm (½″)**; cải tạo cho tới **19 mm (¾″)** nếu vát ≤ 1:2. Chênh cao **> 13 mm** ⇒ **bắt buộc** dốc/ram | **A** |
| chênh cao genkan Nhật | `CHƯA CÓ SỐ` — không truy được trong phiên | — |
| VN | bỏ giày phổ biến, **không** có chuẩn chênh cao lối vào — `CHƯA CÓ SỐ` | — |

- **KÉO NGƯỢC VỚI** → **tiếp cận không bậc**: văn hoá bỏ giày **muốn** một bậc chuyển sạch/bẩn, luật tiếp cận **cấm** bậc đó vượt 13 mm. Hai bên đều có lý; **không bên nào sai**.

### T13 · XU HƯỚNG THẾ TỤC — thang theo THỜI GIAN, không theo nơi chốn
- **ánh xạ từ** cải thiện dinh dưỡng/y tế qua các thế hệ
- **nguồn** Tổng điều tra dinh dưỡng 2019–2020
- **số**: **VN nam +3,7 cm / 10 năm** (164,4 → 168,1); **nữ +1,4 cm / 10 năm** (154,8 → 156,2) — **A**
- ⇒ Một chuẩn nhân trắc viết năm 2005 lệch với người 2026 **khoảng một cỡ nút bấm**. Thang bối cảnh **hết hạn**, khác hằng số.
- **KÉO NGƯỢC VỚI** → **T1** (số nào là "người Việt": người hôm nay hay dải phục vụ 30 năm?) · **T2** (thiết bị đã đóng khuôn thì không đuổi theo được) · **tồn kho công trình cũ**

### T14 · TÍN NGƯỠNG & ĐỊNH HƯỚNG
- **ánh xạ từ** hệ tín ngưỡng vùng
- **nguồn** `CHƯA CÓ SỐ` — không truy được một chuẩn định lượng nào trong phiên
- **giá trị định tính**: VN/TQ — phong thuỷ (hướng nhà, bếp không đối cửa, giường không đối gương) · Ấn Độ — Vastu Shastra · vùng Hồi giáo — hướng qibla
- **KÉO NGƯỢC VỚI** → **tối ưu hướng nắng theo khí hậu**: ở VN, khí hậu nói *tránh Tây, ưu Nam*; phong thuỷ có thể chỉ định hướng khác theo tuổi gia chủ. Hai ràng buộc **chỉ hai hướng khác nhau trên cùng một mảnh đất** — và đây chính là loại xung đột IF **không được phép tự xử**.

---

## 2 · MA TRẬN KÉO NGƯỢC — 11 cặp đo được

| # | thang A | thang B | kéo nhau ở đâu | cụ thể |
|---|---|---|---|---|
| 1 | T1 nhân trắc | T2 thiết bị | chiều cao mặt bếp | 800–850 ⟷ 900 · **ca gốc của phiếu này** |
| 2 | T1 | T8 giường | chiều dài giường | người thấp hơn ⟷ ga gối khoá 2000 |
| 3 | T1 | T13 thế tục | "người Việt" là ai | 164,4 (2010) ⟷ 168,1 (2020) |
| 4 | T4 diện tích | T7 bậc thang | mét vuông | luật thang VN tốn nhất ⟷ diện tích/người thấp nhất |
| 5 | T4 | T8 | phòng ngủ | 21,1 m²/người ⟷ giường 1800×2000 |
| 6 | T4 | T2 | bếp | căn hộ nhỏ ⟷ thiết bị 600 mm chuẩn EU |
| 7 | T5 hộ | T4 | tổng diện tích | 3,5 người/hộ × 26,6 m² ⟷ mô hình 2,25 người/hộ của đồ nội thất nhập |
| 8 | T6 trần | T10 nhiệt | thể tích phòng | đối lưu muốn cao ⟷ điều hoà muốn thấp |
| 9 | T10 | T11 vỏ | vận hành | thông gió tự nhiên ⟷ vỏ kín đạt chuẩn năng lượng |
| 10 | T12 bỏ giày | tiếp cận | ngưỡng cửa | cần một bậc ⟷ ADA ≤ 13 mm |
| 11 | T14 tín ngưỡng | hướng nắng | hướng nhà | tuổi gia chủ ⟷ tránh Tây ưu Nam |
| ⊕ | T3 quy ước | trao đổi tệp | chiều đọc bản vẽ | góc 1 ⟷ góc 3 — sai là **mọi số bên trong vô nghĩa** |
| ⊕ | T9 mô-đun | T2 · T3 | cắt vật liệu | lưới 600 ⟷ tấm 1220 ⟷ đơn vị vẽ |

---

## 3 · BA CỤM XUNG ĐỘT CÙNG DẠNG VỚI CA "NEUFERT"

Cùng dạng nghĩa là: **hai ràng buộc thật, kéo ngược, không bên nào sai**, và kết luận trần một vế
sẽ làm người đọc tưởng có bên đúng bên sai.

**Cụm A — bậc thang VN.** Luật đòi bậc thoải nhất trong ba vùng (`h ≤ 150 · b ≥ 300`) trong khi
diện tích/người thấp nhất (26,6 m², chung cư 21,1). Lên 3,0 m: VN **≥ 20 bậc**, Anh **14 bậc**,
chênh **~1,8 m sàn**. Chọn theo luật thì mất phòng; chọn theo diện tích thì phạm luật. `INFERENCE`

**Cụm B — ngưỡng cửa nhà bỏ giày.** Văn hoá cần bậc chuyển sạch/bẩn; ADA cấm chênh cao vượt
**13 mm** trên lối tiếp cận. Không có số dung hoà — có **hai** yêu cầu, và người ở phải chọn. `FACT`

**Cụm C — hướng nhà.** Khí hậu nhiệt đới và phong thuỷ có thể chỉ **hai hướng khác nhau**. Trục
khí hậu đo được, trục tín ngưỡng `CHƯA CÓ SỐ` — **nhưng không đo được không có nghĩa là không có
thật**, và một hệ chỉ chấm trục đo được sẽ im lặng xoá mất trục kia. `INFERENCE`

---

## 4 · HỆ QUẢ CHO SẢN PHẨM — 7 tham số bối cảnh phải CÓ TÊN

`PROPOSAL` Ghi để bên thiết kế/kiến trúc biết. Lane 02 **không** dựng.

| # | tham số | kiểu | mặc định an toàn | thang nó nuôi |
|---|---|---|---|---|
| 1 | `percentile_dan_so` — dải nhân trắc phục vụ | dân số + percentile (vd `VN · P5–P95`) | dân số dự án, **không** phải dân số người vẽ | T1 · T13 |
| 2 | `thi_truong_thiet_bi` | `EU` · `US` · `JP` · `hon-hop` | `hon-hop` (VN thật là hỗn hợp) | T2 · T9 |
| 3 | `vung_quy_dinh` — bộ luật áp dụng | mã vùng | vùng công trình | T6 · T7 · T12 |
| 4 | `quy_uoc_ban_ve` | góc chiếu · khổ giấy · đơn vị · quy ước lớp | theo `vung_quy_dinh` | T3 |
| 5 | `che_do_van_hanh_nhiet` | `thong-gio-tu-nhien` · `dieu-hoa` · `hon-hop` | `hon-hop` | T10 · T11 · T6 |
| 6 | `cau_truc_ho` — số người, số thế hệ | số | theo dự án, **không** theo trung bình quốc gia | T5 |
| 7 | `rang_buoc_tin_nguong` | danh sách mở | rỗng | T14 |

**Ba ràng buộc thi hành** — theo `IF-CANONICAL` §8b:
1. **Đầu vào, không phải hằng số ẩn.** Một số bối cảnh nằm cứng trong mã là một số **không ai đổi
   được và không ai biết là có**.
2. **Máy NÊU đủ trục · người CHỌN · không ÉP.** Khi hai thang kéo ngược, IF bày ra **cả hai** kèm
   lý do rồi lùi lại. Cảnh báo chỉ nêu một vế là **ép người dùng bằng cách giấu thông tin**.
3. **Vitals phải đọc được 7 tham số này.** `IF-CANONICAL` §11 hiện chốt Vitals kế thừa *dự án ·
   workspace · chặng · vùng chọn · đối tượng · nguồn · hành động* — **thiếu bối cảnh**. Vitals chỉ
   có hằng số thì nó khuyên **đúng sách mà sai người**, và nói thẳng vào tai người dùng.

---

## 5 · NỢ CÓ TÊN — phải lên hạng trước khi thành cổng

| nợ | hiện | cần |
|---|---|---|
| toàn bộ **T2** (thiết bị) đang ở mức **C** | blog nhà sản xuất | catalog kỹ thuật hoặc EN/JIS gốc — **T2 là vế thắng trong ca gốc, mà nó lại là vế yếu nguồn nhất** |
| **T7 VN** `600 ≤ b+2h ≤ 660` mức **C** | bản trích | mở QCVN/TCVN gốc |
| **T6 VN** mức **B** | bản trích điều 2.2 | mở PDF QCVN 04:2021/BXD |
| **T4** hai số 26,6 ⟷ 29 | chưa hoà giải | truy nguồn số 29 |
| **T1** Nhật · Mỹ `CHƯA CÓ SỐ` | tóm tắt không trả số | tải bộ dữ liệu NCD-RisC |
| **T12** genkan `CHƯA CÓ SỐ` | — | chuẩn nhà ở Nhật |
| **T11 · T14** `CHƯA CÓ SỐ` định lượng | — | có thể **không tồn tại** dạng số — nếu vậy phải ghi rõ là **thang chỉ định tính**, không im lặng bỏ |

⚠️ **Danh mục này là BẢN ĐỒ TRỤC, không phải bộ ngưỡng.** Không ô nào ở đây được biến thành cổng
máy chấm trước khi lên hạng **A**. Áp sớm là lặp đúng lỗi *chuẩn sai cả họ*.

---

## NGUỒN

Nhân trắc VN — [Bộ Y tế công bố Tổng điều tra dinh dưỡng 2019–2020](http://t5g.org.vn/cong-bo-ket-qua-tong-dieu-tra-dinh-duong-2019-2020) · [Nhân Dân](https://nhandan.vn/chieu-cao-o-nhom-thanh-nien-18-tuoi-tang-manh-post642075.html) ·
NCD-RisC — [dữ liệu chiều cao](https://www.ncdrisc.org/data-downloads-height.html) · [Lancet 2020](https://pubmed.ncbi.nlm.nih.gov/33160572/) ·
Nhà ở & hộ VN — [TCTK · Điều tra dân số và nhà ở giữa kỳ 2024](https://www.nso.gov.vn/du-lieu-va-so-lieu-thong-ke/2025/01/thong-cao-bao-chi-ket-qua-dieu-tra-dan-so-va-nha-o-giua-ky-nam-2024/) · [VnExpress 26,6 m²](https://vnexpress.net/dien-tich-nha-o-binh-quan-26-6-m2-moi-nguoi-4836873.html) · [VietnamPlus 29 m² ⚠](https://www.vietnamplus.vn/nam-2024-dien-tich-nha-o-binh-quan-dau-nguoi-dat-29m2-post1039641.vnp) ·
Diện tích ở quốc tế — [HK LCQ22](https://www.info.gov.hk/gia/general/202303/29/P2023032900422p.htm) · [Housing in Hong Kong](https://en.wikipedia.org/wiki/Housing_in_Hong_Kong) ·
Hộ Nhật — [Statistical Handbook of Japan 2024](https://www.stat.go.jp/english/data/handbook/pdf/2024all.pdf) ·
QCVN 04:2021/BXD — [bản trích thuvienphapluat](https://thuvienphapluat.vn/phap-luat/chieu-cao-thong-thuy-toi-thieu-trong-nha-chung-cu-la-bao-nhieu-met-can-ho-chung-cu-phai-dam-bao-co--447809-21916.html) ·
Bậc thang — [so sánh 12 nước · DataDrivenAEC](https://datadrivenaec.com/insights/stair-code-requirements-international-comparison) · [IRC riser/tread](https://resources.viewrail.com/code-compliance/stair-code/tread-depth-and-risers) ·
Mặt bếp & thiết bị — [kích thước tủ bếp EU/UK/US](https://arcadium3d.com/articles/standard-kitchen-cabinet-sizes-eu-uk-us) · [bếp Nhật 80–95 cm](https://www.yes-reform.co.jp/column_en/what-is-the-convenient-height-for-kitchens-and-washbasins) · [Whirlpool · kích thước máy rửa chén](https://www.whirlpool.com/blog/kitchen/dishwasher-dimensions.html) ·
Giường — [Bed size · Wikipedia](https://en.wikipedia.org/wiki/Bed_size) · [chuẩn quốc tế](https://www.nectarsleep.com/posts/international-mattress-sizes-guide) ·
Tấm & khung — [Canadian Wood Council · Plywood Sizes](https://cwc.ca/wp-content/uploads/2019/03/Plywood-Sizes.pdf) ·
Phép chiếu — [góc 1 vs góc 3](https://xometry.pro/en/articles/first-angle-third-angle-projection/) · [JIS](https://ideagroupvn.com/first-angle-vs-third-angle-projection-jis-drawing/) ·
Nhiệt — [ASHRAE 55 thích ứng](https://www.simscale.com/blog/what-is-ashrae-55-thermal-comfort/) · [công trình thông gió tự nhiên nhiệt đới](https://www.tandfonline.com/doi/full/10.1080/09613218.2023.2256430) ·
Ngưỡng cửa — [US Access Board · Chapter 4](https://www.access-board.gov/ada/chapter/ch04/)
