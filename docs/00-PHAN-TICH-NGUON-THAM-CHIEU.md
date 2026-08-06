# NGUỒN THAM CHIẾU THẨM MỸ — 13 ảnh Hoà cấp 05/08/2026

Đây là **nguồn sự thật về thẩm mỹ** cho toàn bộ block CAD và bảng trình bày của IF.
Theo §0g: nguồn phải MỞ ĐƯỢC, không phải lời kể. Mọi phiên sau mở thư mục này ra xem,
không mô tả lại cho nhau.

---

## 7 nhóm nội dung

| Nhóm | File | Nội dung | Dùng cho |
|---|---|---|---|
| **A · Cụm bố trí** | `A1-thu-vien-cum-bo-tri-van-phong.png` · `A2-cum-4-ban-chu-thap-net-ky-thuat.png` | ~30 cụm workstation: chữ thập, cong, bán nguyệt, sao 5–6 nhánh, thẳng hàng, lounge, lễ tân | thư viện **cụm** — đơn vị bố trí thật, không phải từng cái bàn |
| **B · Mặt bằng trình bày** | `B1-mat-bang-trinh-bay-mau-cay-nguoi.png` · `B2-cum-dao-tren-nen-mau-be.png` | mặt bằng có màu, cây xanh, người, thảm định vùng nét đứt; cụm đảo trên nền be | chặng **Trình bày** — mặt bằng cho khách xem |
| **C · Mặt đứng** | `C1-thu-vien-mat-dung-co-leader.png` · `C2-canh-mat-dung-phan-lop-do-dam.png` | thư viện người + đồ mặt đứng có leader; cảnh mặt đứng phân lớp độ đậm theo chiều sâu | block **mặt đứng** + cách ghi nhãn |
| **D · Nhân trắc** | `D1-nhan-trac-ban-hop-12-nguoi.png` · `D2-top-view-chi-tiet-cao.png` | bàn họp 12 người 94"×36" có người vẽ chi tiết; 3 cảnh bàn làm việc chi tiết cao | kiểm **kích thước đúng** + mẫu LOD 1/20 |
| **E · Bản vẽ kỹ thuật cụm** | `E1-cum-6-ban-chu-Y-co-dim.png` · `E2-cum-6-ban-120do-co-dim.png` | cụm chữ Y 6955×6023, cụm 120° với dim 1200/600/600 | **kích thước cụm thật** để dựng |
| **F · Ý tưởng vẽ tay** | `F1-mat-bang-y-tuong-ve-tay.png` | 2 phương án so sánh: hàng thẳng vs cụm hữu cơ, nét tay trên nền xanh nhạt | chặng **ý tưởng** — trình bày so sánh phương án |
| **G · Block 3 hình chiếu** | `G1-ghe-banh-3-hinh-chieu.png` · `G2-ghe-banh-3-hinh-chieu-co-dim.png` | ghế bành Top/Front/Side, bản có dim song đơn vị cm+inch | **chuẩn dựng block** — đây là mẫu quan trọng nhất |

---

## Sáu điều rút ra — và chỗ tôi đã làm sai

### 1 · NÉT MẢNH VÀ ĐỀU, không phân cấp đậm nhạt như tôi tưởng

Nhìn `G1`, `G2`, `A2`, `E2`: **toàn bộ block vẽ bằng một cấp nét mảnh**. Không có đường bao đậm
gấp 2–4 lần chi tiết bên trong.

Phân cấp nét (wide 4 : medium 2 : narrow 1 theo JASIS/ISO 128-2) áp cho **BẢN VẼ HOÀN CHỈNH** —
tường cắt đậm, nội thất vừa, dim mảnh. **Không áp cho nội bộ một block.** Trong một block, mọi
nét đều là "medium".

> ⚠️ Tôi đã vẽ ghế Figma với 4 cấp nét bên trong một block. **Sai.** Phải sửa: một cấp nét duy nhất
> cho toàn block; phân cấp chỉ xuất hiện khi block đặt vào bản vẽ cùng tường/dim.

### 2 · CHI TIẾT TIẾT CHẾ — gợi ý, không tả

`G1` ghế bành top view: đường bao ngoài + **3–4 đường cong** gợi nệm. Hết.
`A1` ghế xoay trong cụm: **1 mâm + 1 lưng cong + 2 tay**. Không chân sao, không bánh xe.
`D2` (LOD cao nhất) mới có laptop, chuột, kính, cốc — và đó là ảnh minh hoạ trình bày, không phải
block dùng lại.

> ⚠️ Tôi vẽ chân sao 5 nhánh + 5 bánh xe nét đứt ở mức 1/20. **Thừa.** Bản vẽ thật không ai vẽ.

### 3 · ĐƠN VỊ BỐ TRÍ LÀ **CỤM**, KHÔNG PHẢI TỪNG MÓN

`A1` cho thấy thư viện thật tổ chức theo cụm: cụm 4 chỗ chữ thập, cụm 6 chỗ chữ Y, cụm 120°,
cụm cong, cụm bán nguyệt. `E1`/`E2` cho kích thước cụm thật:

| Cụm | Kích thước bao | Module |
|---|---|---|
| 6 bàn chữ Y | **6955 × 6023 mm** | cánh 600+60+600, nhịp 1200 |
| 6 bàn 120° | — | 1200 × 600, góc **120°**, vách 600 |

> Đây là thứ tôi thiếu hẳn: phiếu block của tôi liệt kê từng cái bàn rời. Phải thêm **nhóm CỤM**
> — đó mới là thứ KTS kéo vào mặt bằng.

### 4 · MẶT BẰNG TRÌNH BÀY: nền xám nhạt + cây xanh + người + thảm nét đứt

`B1` — công thức rõ:
- nền sàn **xám rất nhạt**, tường/lõi **đen đặc**
- **cây xanh lá** là điểm màu duy nhất, rải theo cụm, tán vẽ tự do bất đối xứng
- **người nhìn từ trên** đặt ở vài chỗ — cho cảm giác sống và cho tỉ lệ
- **thảm định vùng = hình tròn nét đứt** phủ dưới cụm ghế
- đường cong hữu cơ cho vách và bàn, không vuông góc hết

`B2` — biến thể: mỗi cụm là **một đảo trên nền màu be**, hình nền tự do ôm lấy cụm, có nhãn
tên phòng ngay trên đảo. Đây chính là cách "tụ về tâm mà vẫn có toạ độ không gian" Hoà nói.

### 5 · LEADER LINE: mảnh, nghiêng, nhãn chữ hoa giãn rộng

`C1` — leader nét rất mảnh, nghiêng **~30–60°**, không mũi tên, nhãn **chữ hoa cỡ nhỏ, letter-spacing rộng**,
đặt cuối dây. Nhiều leader giữ **cùng một tập góc**, không cắt nhau.

Khớp đúng ISO 128-22: leader thuộc nhóm nét mảnh nhất; landing = 20 × độ dày nét; chữ cách nét
2 × độ dày nét; cấm cắt nhau.

### 6 · PHÂN LỚP ĐỘ ĐẬM THEO CHIỀU SÂU (mặt đứng)

`C2` — cùng một cảnh, lớp **trước** nét rõ và trắng đặc, lớp **sau** nét mờ hơn hẳn, chìm vào nền.
Đây là aerial perspective áp cho line drawing. Không dùng bóng đổ, chỉ dùng độ đậm nét.

---

## Bảng kích thước rút được từ ảnh

| Món | Kích thước | Nguồn |
|---|---|---|
| Bàn họp 12 người | **94″ × 36″** = 2388 × 914 mm | `D1` (ghi trên ảnh) |
| Cụm 6 bàn chữ Y | **6955 × 6023 mm** | `E1` |
| Bàn trong cụm 120° | **1200 × 600 mm**, vách 600, góc 120° | `E2` |
| Bàn chữ Y — cánh | **600 + 60 + 600 mm** | `E1` |
| Ghế bành | rộng **630**, sâu **530**, cao lưng **380**, cao ngồi **150**, sâu ghế **550**, tổng sâu **580** mm | `G2` (song đơn vị cm/inch) |

---

## Việc phải sửa ngay

1. **Ghế Figma vẽ lại**: một cấp nét, bỏ chân sao và bánh xe, giữ mâm + lưng + 2 tay.
2. **Thêm nhóm CỤM vào phiếu block** — 6 cụm tối thiểu: chữ thập 4 chỗ · chữ Y 6 chỗ · 120° 6 chỗ ·
   thẳng hàng bench · bán nguyệt · lounge.
3. **Bộ block người** — nhìn từ trên và mặt đứng. `B1`, `C1`, `C2`, `D1`, `D2` đều có người.
   Không có người thì mặt bằng chết.
4. **Bộ cây** — tán tự do bất đối xứng, không răng cưa đều.
5. **Thảm định vùng** — hình tròn/tự do nét đứt, là công cụ zoning.
6. **Chế độ trình bày cho mặt bằng**: nền xám nhạt · lõi đen đặc · cây xanh · người · thảm nét đứt.
