# VẬT LIỆU — một VẬT, ba mặt

> **[N]** = sự thật từ nguồn · **[IF]** = diễn giải.

## 1 · LÀ GÌ / KHÔNG PHẢI LÀ GÌ

**LÀ** — **một vật, ba mặt**: mặt **thị giác** (thông số PBR để render) · mặt **thương mại** (nhà
cung cấp · khoảng giá · hao hụt) · mặt **2D** (ký hiệu, mẫu tô). Một `matId` cho ra cả ba.

**KHÔNG PHẢI** — ba kho rời · một bảng màu · một thư viện riêng. **[N]** Hoà 16/08: *"vật liệu XUYÊN
BA CHẶNG, không thuộc riêng 3D; **không có thư viện vật liệu riêng**, chỉ có MỘT Thư viện và vật
liệu là một KỆ, màu là một BƯỚC trong kệ ấy."*

> ⭐⭐ **ĐỊNH NGHĨA "ĐỒNG BỘ" — câu định vị cả sản phẩm** **[N]** Hoà 16/08:
> **Đồng bộ KHÔNG PHẢI nối hai thứ lại. Đồng bộ là KHÔNG TÁCH chúng ra ngay từ đầu.**
> Khi một vật liệu mang **cả hai nửa** — render được **VÀ** biết mình là hàng của ai, giá bao nhiêu —
> thì đổi vật liệu trong phối cảnh xong, **bảng khối lượng đúng KHÔNG PHẢI vì có ai đi đồng bộ hai
> bảng, mà vì CHỈ CÓ MỘT VẬT.** Đây là chỗ Revit không có (đẹp không nổi) và Canva không có (không
> thật).

⚠️ **RÀNG BUỘC PHẢI LÀM ĐÚNG NGAY: vật liệu TRỎ TỚI bản ghi thương mại, KHÔNG CHÉP giá vào mình.**
Giá đổi hằng ngày, texture thì không. *"Hiểu được thông tin"* = **trỏ tới được**, không phải chứa.
Và **khoảng giá** thuộc kho chung; **giá chốt** thuộc từng dự án.

## 2 · VIỆC CỦA CON NGƯỜI
Chọn đúng vật liệu (nhìn được vân) · biết nó bao nhiêu tiền và mua ở đâu · đổi nó một lần rồi thấy
bản vẽ · phối cảnh · hồ sơ · dự toán **cùng đổi theo**.

**Bước "lấy mẫu thô" — ca mẫu của dòng chảy Files → cửa sổ → Thư viện:** **[N]** Hoà 16/08
**VÀO** = map texture · nhà cung cấp · khoảng giá (ai cũng thấy, **chưa render được** vì thiếu đúng
thông số mà V-Ray/D5 lúc nào cũng phải đặt) → **XỬ** = trong canvas bằng công cụ: độ bóng · độ mờ ·
phản xạ · quả cầu xem trước → **RA** = một `matId` **render được mà vẫn nhớ gốc gác**.

## 3 · NHÂN VẬT CHÍNH
**Quả cầu vật liệu.** Không phải ô màu phẳng — đây là thứ đã được pin ba lần trong gu cá nhân, và
là cách cả ngành (V-Ray/D5) trình bày vật liệu.

## 4 · ĐƯỢC PHÉP / BỊ TỪ CHỐI
| Được phép | Ghi chú |
|---|---|
| Quả cầu thật, có bậc thang thoái lui | quả cầu → vân sinh theo công thức → ảnh; quả cầu **cũng là đường lui khi WebGL tắt** |
| Tạo vật liệu theo mẫu kiểu D5 (**~8 trường**) | không phải ~40 trường kiểu V-Ray |
| Ba cảnh xem trước theo danh mục | Cầu · Sàn · Vải |
| Mảnh nào thiếu thì trả **rỗng cho mảnh đó** | **không ném lỗi, không bịa mặc định** |

| Bị từ chối | Lý do |
|---|---|
| **Nhồi giá vào bảng thông số PBR** | luật 30/07 cố ý tách hai bên, và **vẫn đúng**: engine render không cần biết giá; giá đổi hằng ngày còn texture thì không. Cách sửa đúng là **thêm KHOÁ NỐI**, không phải trộn |
| Ô màu phẳng thay quả cầu | mất kênh thông tin về chất |
| Ảnh xem trước < ngưỡng đọc được | **141px = quá nhỏ để phân biệt vân sồi với óc chó** |
| Bảng màu đứng riêng trên bản đồ | màu là **một BƯỚC** trong chọn vật liệu |

## 5 · TRẠNG THÁI
Rỗng: *"Kho vật liệu đang trống"*. Trạng thái mẫu tốt đang chạy thật ở ngăn nhà cung cấp:
**10/10 món chưa đủ định nghĩa để render** — nói đúng *cái gì thiếu*, không nói *"không có gì"*.
Mọi trường của mặt thị giác đều **optional có chủ ý**, kèm máy canh trôi hai chiều (thêm trường mà
quên khai là lỗi biên dịch).

## 6 · CHỐT ĐÃ KÝ
| Ngày | Chốt |
|---|---|
| 30/07 | Tách mặt thị giác ↔ mặt thương mại — **cố ý**, và vẫn đúng |
| 03/08 | `matId` = PBR chuẩn glTF (khớp D5 + Enscape; V-Ray dịch qua); quả cầu = mặt cầu + môi trường phòng, cache ảnh |
| 07/08 | ⭐ **VẬT LIỆU LÀ GỐC** — furniture cũng làm bằng vật liệu, nên sửa vật liệu thì furniture đổi theo. Ba mảnh phải có **KHOÁ NỐI** |
| 10/08 | Ảnh → cấu kiện/vật liệu nháp, cờ ba nấc *đo được / suy ra / đã xác minh*, đổi định danh hai chiều có xem-trước-tác-động |
| 15/08 | **BOQ chỉ nhận số ĐO ĐƯỢC** — không cột "tạm tính", không cờ độ tin; người sửa tay chỉnh sau |
| 16/08 | Không có thư viện vật liệu riêng; màu là một bước; định nghĩa "đồng bộ" (§1) |
| 19/08 | Định danh đổi: `matId` nay là **định danh riêng của IF**, không còn bằng mã hàng của nhà cung cấp |

## 7 · CA HỎNG THẬT
**① Vật liệu bị CHẺ BA, không mảnh nào biết mảnh nào** (đo 07/08, ghi thành mục sổ riêng). Mặt thị
giác có 14 thông số nhưng **0 giá, 0 nhà cung cấp**; mặt thương mại có giá nhưng **0 thông số
render**; mặt 2D có mẫu tô nhưng **0 khoá nối**. Grep tên bản ghi thương mại trong thư mục vật liệu
= **2 dòng chú thích, 0 dòng mã**.

**② Và đây là ca hỏng CỦA SỔ, đắt hơn:** câu *"0 code"* đó được **chép lại** vào phiên 16/08 như một
phép đo mới. Đo lại tại nguồn 17/08: **hàm nối ba mặt CÓ THẬT từ chiều 07/08** — trả đủ ba mặt, có
test. Số "0" đúng cho phép đo **buổi sáng** 07/08; hàm sinh **buổi chiều** cùng ngày.
⇒ Không phải *chưa có dây* mà là **dây có, chưa cắm điện**.
**[IF] Luật: số CHÉP LẠI không phải PHÉP ĐO. Đo tại nguồn, đừng nhớ hộ máy.**

**③ Cắm điện tới đâu: đúng HAI nơi gọi ngoài test** — màn vật liệu và ngăn thô của Files. **Cả hai
vẫn gọi bằng mã hàng cũ, chưa chuyển sang định danh mới của IF** ⇒ nợ định danh đang treo, và đường
tương thích cũ đang được giữ có chủ ý.

**④ Màn vật liệu không có lối vào trên bản đồ** — vào qua nhóm "Nâng cao" trong cài đặt.
**[IF] Một kho tài sản trung tâm nằm sau một mục cài đặt là sai chỗ** — nhưng chốt 16/08 đã trả lời:
nó **phải là một KỆ của Thư viện**, không phải một mục rail. Việc còn lại là **nối kệ**, không phải
thêm mục.

## 8 · ĐÀO SÂU
| Cần gì | Đọc đâu |
|---|---|
| Mặt thị giác + máy canh trôi | `lib/materials/schema.ts` |
| Hàm nối ba mặt (thuần, nguồn tiêm qua tham số) | `lib/materials/resolve.ts` — đọc docstring, nó khai cả lịch sử định danh |
| Nơi gọi thật | `components/materials/MaterialsScreen.tsx` · `app/files/_lib/ngan-tho.ts` |
| Quả cầu (3 nơi mount) | `components/three/MaterialSphere.tsx` |
| Spec PBR + quả cầu | `docs/SPEC-VAT-LIEU-PBR-IF.md` |
| Chốt "vật liệu là gốc" + ba mảnh + khoá nối | `docs/00-CHOT.md` [07/08 khuya] |
| Ảnh → cấu kiện/vật liệu | `docs/CHOT-ELEMENT-MATERIAL-INTELLIGENCE-2026-08-10.md` |

**🔴 CHƯA GIẢI:**
- **Bước "lấy mẫu thô" chưa có cửa sổ công cụ.** Đây là ca mẫu Hoà mô tả rõ nhất, và **chưa dựng**.
- **Nợ định danh** — hai nơi gọi còn dùng mã cũ.
- **Bảng màu vẫn là một route riêng**, trong khi chốt nói nó là **một BƯỚC** bên trong chọn vật liệu.
- **Gói hệ màu hãng** (Pantone · Jotun · Dulux) đã chốt là **gói nạp ngoài** (app trung tính, studio
  tự nạp, ánh xạ về `matId`, có nhãn nguồn) — **chưa dựng**.
- Panel thông số vật liệu **TỰ SINH từ định nghĩa** (đã chứng minh chạy được) — đây là khuôn nên
  nhân rộng cho các panel khác, **chưa ai nhân**.
