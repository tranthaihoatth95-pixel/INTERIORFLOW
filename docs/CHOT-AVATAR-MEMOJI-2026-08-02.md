# CHỐT — AVATAR ĐỔI HƯỚNG: MẶT NGƯỜI KIỂU APPLE (bỏ "búp bê nỉ")

> Hoà 02/08: *"BỎ vụ avatar len đi, mình cần nó giống MẶT NGƯỜI của Apple."* + *"cái tròn ava đáng lẽ
> đường kính phải bằng thanh tool, sao lại cái to cái nhỏ"* + *"cài đặt, 3 chấm cho vô chung chỗ với
> avatar"* + *"nghiên cứu avatar setting macOS"*.

## 1 · CHẤT LIỆU — bỏ nỉ, sang da người
| Bỏ hẳn | Thay bằng |
|---|---|
| `feTurbulence` + `feDisplacementMap` (chất lông/nỉ) | **da mịn**: radial gradient 3 chặng rất mềm, không nhiễu |
| Highlight cứng kiểu nhựa bóng | highlight **mềm, rộng**, opacity thấp (≤18%) |
| Bóng đổ đậm | bóng **khuếch tán** dưới cằm/tóc, blur lớn, opacity ≤12% |
| Đầu chibi quá to (rx/ry 58 trên khung 200×240) | tỉ lệ **gần người hơn**: đầu chiếm ~55% chiều cao bust, cổ-vai rõ |
Chuẩn Memoji: **không viền outline đậm · màu phẳng + chuyển sắc rất nhẹ · mắt có tròng + 1 chấm sáng ·
tóc là KHỐI mượt có volume (không vẽ sợi) · miệng/mũi tối giản**.

## 2 · TỈ LỆ & VỊ TRÍ TRONG RAIL (lỗi Hoà chỉ ra)
- Avatar ở rail **đường kính = ĐÚNG cỡ nút rail (44px)** — không to hơn, không nhỏ hơn. Cùng trục giữa.
- Rail = **một cụm duy nhất**: capsule điều hướng + avatar dưới, **cùng chiều rộng**, cách 12px.
- **Gom vào menu avatar** (bấm avatar mở): Hồ sơ · Đổi avatar · Giao diện (sáng/tối) · Cài đặt · Trợ giúp ·
  Đăng xuất. ⇒ **bỏ nút ⚙ và nút ⋯ rời rạc** khỏi rail/header. Một cửa duy nhất cho "chuyện của tôi".

## 3 · TRANG ĐỔI AVATAR — học macOS/Memoji, KHÔNG dùng số
Lỗi hiện tại: kiểu tóc hiện **"1 2 3 … 16"**, áo hiện chữ *"hoodie · len · blazer"* → không ai hình dung được.
Chuẩn Apple:
| Thành phần | Chuẩn |
|---|---|
| Xem trước | **1 avatar lớn duy nhất** ở giữa/trái, nền dịu, cập nhật tức thì |
| Danh mục | **hàng tab ICON** (da · tóc · mắt · kính · mũ · áo), không phải nhãn chữ dài |
| Lựa chọn trong danh mục | **THUMBNAIL VẼ THẬT** của chính đặc điểm đó (hình kiểu tóc, hình gọng kính…) — **cấm số, cấm chữ suông** |
| Màu | dãy **chấm tròn màu**, chọn = viền accent |
| Bố cục | lưới thumbnail đều, cuộn dọc; nút *Ngẫu nhiên* + *Xong* |

## 3b · BÓC ĐẶC ĐIỂM TỪ ẢNH MẪU APPLE (Hoà gửi 4 ảnh Memoji thật 02/08)
| Bộ phận | Đặc điểm PHẢI có | Ghi chú kỹ thuật SVG |
|---|---|---|
| **Khối đầu** | oval hơi vuông, **có volume rõ**: sáng một phía, tối phía đối diện | radial gradient lệch tâm (cx 38% cy 32%) + 1 lớp shading cạnh opacity ~10% |
| **Mũi** ⭐ | **khối tròn nhỏ NHÔ RA**, có bóng đổ ngay dưới — dấu hiệu nhận dạng Memoji rõ nhất | ellipse + highlight nhỏ trên sống + bóng mềm dưới |
| **Mắt** | tròng đen **to**, 1 chấm sáng, mí trên dày rõ | không vẽ lông mi rời |
| **Lông mày** | **khối dày mượt**, bo tròn hai đầu | path bo, không nét mảnh |
| **Tóc** | **KHỐI liền có volume**, chia 3–5 lọn lớn, highlight chạy dọc lọn | cấm vẽ sợi; mỗi lọn 1 path + gradient dọc |
| **Miệng** | nhỏ, môi có độ dày, cười nhẹ | — |
| **Tỉ lệ** | đầu chiếm **~60–65%** chiều cao khung; cổ mảnh; vai chỉ ló nhẹ | Memoji là **bán thân sát mặt**, không phải nửa người |
| **Bóng đổ** | dưới cằm phủ lên cổ · dưới tóc phủ lên trán | blur lớn, opacity ≤12% |
| **Tuyệt đối không** | viền outline đậm · texture · nhiễu · màu bệt phẳng lì | — |

⚠️ **Giới hạn thành thật:** Memoji của Apple là **render 3D thật**; IF dùng SVG 2D nên đích thực tế là
**"flat-3D"** — như ảnh mockup *3D Avatar Generator* Hoà gửi (ảnh 4): sạch, có volume nhờ gradient, KHÔNG
phải raytracing. Đó là mức đạt được và cũng là mức đủ đẹp cho app.

## 3c · GIAO DIỆN CHỌN AVATAR — theo đúng ảnh 4
Bố cục dọc: **［Back］—［Save］** trên cùng · **avatar lớn ở giữa** · **tab danh mục cuộn ngang** có chấm
chỉ báo (Tóc · Râu · Kính · Mũ · Áo…) · **dãy chấm màu tròn** (chọn = viền đen/accent dày) · **lưới
thumbnail là AVATAR THẬT** cùng khuôn mặt, chỉ khác đúng đặc điểm đang xét · mũi tên ⌄ cuộn thêm.

## 4 · Việc phải làm
1. `AvatarRenderer.tsx`: bỏ 2 filter nỉ, làm lại shading da/tóc theo §1, chỉnh tỉ lệ đầu-cổ-vai.
2. `LeftRail.tsx`: avatar 44px cùng trục, gom ⚙ + ⋯ vào menu avatar (§2).
3. `app/settings/avatar`: thay số/chữ bằng **thumbnail render thật** (dùng chính `AvatarRenderer` render mini
   với chỉ đặc điểm đang xét — rẻ, không cần asset ngoài) + tab icon danh mục.

---
*Cowork ghi 02/08/2026 theo chốt Hoà. Thay thế phần "búp bê nhựa/nỉ 3D" trong comment đầu `AvatarRenderer.tsx`.*
