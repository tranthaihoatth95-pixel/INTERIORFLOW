# SPEC · BỘ LỆNH DỰNG HÌNH 3D — gia phả đầy đủ
**Hoà chốt 03/08/2026**, bác đề xuất cắt gọn của TỔNG. Nguyên văn: *"Modifier stack, boolean mesh chi tiết nên giữ, dựng nội thất mà không có mấy cái đó là vứt... những lệnh sketchup hoặc 3D thuộc gia phả to và là nền móng modifier chi tiết khối."*

## §0 · VÌ SAO KHÔNG ĐƯỢC CẮT
Ảnh cuối do AI vẽ ⇒ **không cần** đèn IES/GI/bounce (ảnh không render bằng đèn).
Nhưng **hình khối thì AI không bịa ra được** — nó chỉ tô lên hình mình đưa. Đồ nội thất là thứ hình phức tạp nhất trong ngành: chân bàn tiện tròn (lathe) · tay vịn cầu thang (sweep) · phào chỉ (sweep theo path) · nan chớp (array) · gờ chỉ tủ (boolean) · ghế đối xứng (symmetry).
⇒ **Cắt công cụ dựng hình = cắt chính điểm nhấn nội thất của IF.**

## §1 · SÁU TẦNG — thứ tự làm từ trên xuống
| Tầng | Lệnh | Vì sao cần cho nội thất |
|---|---|---|
| **① Hệ phẳng 2D (profile)** | line · polyline · rect · circle · arc · ellipse · polygon · spline · **offset** · trim/extend · fillet/chamfer · mirror 2D | Mọi khối 3D bắt đầu từ một tiết diện. Đây là NỀN — làm trước hết. Phần lớn ĐÃ CÓ ở chặng 2D, tái dùng engine, không viết lại |
| **② Khối cơ bản 3D** | box · cylinder · cone · sphere · torus · tube · plane · pyramid · wedge | Dựng nhanh khối thô: bàn, tủ, bệ, gối |
| **③ Sinh khối từ tiết diện** | **extrude** (đùn thẳng) · **lathe/revolve** (xoay quanh trục) · **sweep** (quét theo đường) · **loft** (nối nhiều tiết diện) · bevel · shell/thickness | Chân bàn tiện = lathe · phào chỉ + tay vịn = sweep · ghế cong = loft. **Không có tầng này thì không dựng được đồ.** |
| **④ Biến đổi (modifier)** | **symmetry/mirror 3D** · **array** thẳng·tròn·theo path · bend · taper · twist · FFD (lồng biến dạng) · noise | Ghế đối xứng · nan chớp · song sắt · bậc thang lặp · rèm uốn |
| **⑤ Boolean** | union · subtract · intersect · split | Khoét lỗ ổ điện, gờ chỉ tủ, hốc âm tường, lỗ khoá |
| **⑥ Cấu kiện tham số** | tường · cửa · cửa sổ · **cầu thang thẳng / gấp khúc / XOẮN** · lan can · phào chỉ · trần thả · tủ bếp module | Gõ thông số ra khối ngay, không dựng tay. Cầu thang xoắn là ví dụ điển hình: dựng tay rất lâu, tham số hoá thì 5 giây |

## §2 · CAMERA — phải đạt mức V-Ray
Hoà: *"camera chưa đặt được như V-Ray, cần bổ sung, cái đó rất cần cho góc nhìn, view, video"*.
| Cần | Vì sao |
|---|---|
| **Tiêu cự thật (mm)** — 18/24/35/50/85 | Dân nghề nghĩ bằng tiêu cự, không bằng "góc mở". Nội thất hay dùng 24-35mm |
| **Chỉnh đứng / 2 điểm tụ** (two-point perspective) | Ảnh nội thất chuyên nghiệp **đường đứng phải thẳng đứng**. Thiếu cái này là lộ ngay ảnh nghiệp dư |
| **Tầm mắt** mặc định 1 600–1 650mm | Chuẩn ảnh kiến trúc |
| **Safe frame + tỉ lệ khung** (16:9 · 3:2 · 4:5 · 1:1 · A3 ngang) | Canh khung trước khi render, không cắt cụt đồ |
| **Khẩu độ / xoá phông (DOF)** | Ảnh cận cảnh vật liệu |
| **Dịch trục (shift/tilt)** | Lấy trọn trần mà không ngửa máy |
| **Lưu điểm nhìn có tên** + duyệt lại | Bộ ảnh khách duyệt phải chụp cùng góc qua nhiều lần sửa |
| **Đường quay (camera path)** + keyframe | Nuôi video chặng Trình bày. Lõi `lib/cad/campath.ts` ĐÃ CÓ (`CamPathResult`) |

## §3 · RANH GIỚI — cái gì vẫn KHÔNG làm
Đèn IES · GI/bounce · exposure vật lý (ảnh cuối do AI) · mô phỏng vải/vật lý · animation nhân vật · UV unwrap thủ công (dùng triplanar tự động, đã chốt ở `SPEC-VAT-LIEU-PBR-IF`).

## §4 · LUẬT ÁP CHO CẢ BỘ LỆNH
1. **X1** — dựng ở 3D vẫn ghi vào **MỘT Doc**, sinh entity 2D tương ứng khi có thể.
2. **Tái dùng engine chặng 2D**, không viết lại hình học (nút Tường đã làm đúng: gọi `wallSegment()`).
3. **§0c ba mảng** — mỗi lệnh phải có: phím tắt · gọi được từ ⌘K · đường chạm tương đương.
4. **Nhập số chính xác** cho mọi lệnh (bài học 3ds Max) — không lệnh nào chỉ kéo áng chừng.
5. **Bắt điểm 3D** (đầu mút · giữa cạnh · tâm mặt · vuông góc · trên mặt phẳng) — thiếu cái này thì đặt đồ sát tường luôn lệch.
