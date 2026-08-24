# TRƯỚC / SAU · G3 `Vào xưởng` — TỪ NHỰA THÀNH KÍNH, KHÔNG ĐỔI MỘT GIỌT MÀU

**Ba biến thể trong CÙNG MỘT ẢNH. Tôi đã mở nó.**
`artifacts/visual-review/G3-vao-xuong-truoc-sau.png` · 23/08/2026 ·
thi hành: `app/globals.css` `.if-vao-xuong` · luật: `docs/mocks/LUAT-VAT-LIEU-KINH-G0-G3.md` §G3

Bản vẽ giữ **cùng màu gốc `#6a57f5`, cùng cỡ, cùng nền**. Câu đầu tiên của nó:

> *Khác duy nhất ở **CẤU TẠO**.*

## ĐO ĐƯỢC

| Chỉ số | TRƯỚC | SAU | V2 |
|---|---|---|---|
| cấu tạo | tím **là thân nút**, tô phẳng | **phim tím mỏng** dưới **khối kính trong** | phim **thụt vào**, kính có **vành + bề dày** |
| dải đo dưới nút | **2 ô, cùng một màu** | 2 ô, **khác màu** (`TÂM · nhạt` / `RÌA · đặc`) | **3 ô** (`TÂM` / `MÉP PHIM` / `VÀNH KÍNH`) |
| **phép thử "rìa đặc hơn tâm"** | ❌ **TRƯỢT** (tâm = rìa) | ✅ **ĐẠT** | ✅ **ĐẠT** |
| số đo oklab | — | **L 0.647 → 0.353** | ba vùng phân biệt được |
| ánh sáng | **một vệt trắng đắp lên** | hệ quả của khối | hệ quả của khối + vành |
| mắt đọc ra | **NHỰA** | kính | kính có bề dày |
| hàng **cỡ thật 326×44** | có | có | có |

## THỨ ĐÃ ĐỔI THẬT

**Không phải màu. Không phải cỡ. Không phải độ sáng.** Đúng một thứ: **cấu tạo lớp**.

`background: var(--accent)` (một khối màu đặc) → **ba tầng**: phim màu mỏng ở đáy · khối kính
trong có bề dày · mép (sáng trên · tối dưới · vát trong sát rìa).

## VÌ SAO NÓ ĂN TIỀN — cơ chế

### ① Đây là quang học, không phải gu — nên nó tất định

Khối kính trong đặt trên một lớp màu **luôn** có tính chất này: nhìn thẳng xuống tâm là xuyên
qua **ít** kính; nhìn qua rìa cong thì đường quang **dài hơn**, màu cộng dồn nên **đặc lại**.

Không ngoại lệ. Vì thế:

> **Tô phẳng ⇒ tâm = rìa ⇒ mắt đọc ra NHỰA**, dù đắp thêm bao nhiêu vệt sáng.

Vệt sáng là **hệ quả** của cấu tạo, không phải **thay thế** cho nó. Đắp vệt sáng lên một khối
phẳng là vẽ cái bóng của một vật không tồn tại — và mắt bắt được điều đó ngay, dù người xem
không nói ra được vì sao.

### ② Một biến, nên kết luận thuộc về biến ấy

Ba cột cùng màu, cùng cỡ, cùng nền. Nếu chúng khác cả màu lẫn cỡ, người duyệt không thể biết
thứ gì gây ra khác biệt và tranh luận rơi về *"tôi thích cái này hơn"*.

⇒ **Khuôn cho mọi lượt trình phương án vật liệu: cô lập đúng một biến.**

### ③ Bằng chứng nằm TRONG chủ thể — nên không thể bị chặn

Đây là lời giải trực tiếp cho `02-FAILURE-LEDGER` **F-14**: bản cũ đặt một **lưới nét thẳng**
phía sau nút để chứng minh khúc xạ — nhưng nút là `background: var(--accent)` **đục hoàn toàn**
kèm `isolation: isolate`. **Lưới nằm sau một bức tường.** Không một nét nào vào được quang học
của nút.

Bản mới không cần lưới: **mép phim màu bị khối kính nén lại ở hai đầu viên nang**. Đó là nét
thẳng bị bẻ, và nó **không phụ thuộc nền phía sau**.

⇒ **Nguyên tắc tổng quát, áp cho mọi mẫu vật chứng minh:** bằng chứng ở **ngoài** chủ thể luôn
mang rủi ro *"bề mặt không nhận được nó"*. Bằng chứng ở **trong** thì không có rủi ro đó.

### ④ Hàng cỡ thật — bản vẽ tự chống lại sức thuyết phục của chính nó

Bản vẽ đặt hàng **326×44** ngay dưới, kèm cảnh báo:

> ⚠️ *Hàng dưới mới là thứ người dùng thật sự thấy. Bản vẽ to ở trên chỉ để soi cấu tạo.*

Phóng to gấp sáu thì **mọi** phương án đều thuyết phục. Ở cỡ thật, khác biệt nhỏ hơn nhiều —
nhưng vẫn đọc được (TRƯỚC phẳng; SAU và V2 có mép đặc).

⇒ **Bản vẽ phóng to là công cụ SOI, không phải công cụ DUYỆT.** Mọi bản vẽ vật liệu phải kèm
hàng cỡ thật, nếu không ta đang duyệt một thứ không ai sẽ nhìn thấy.

## ⭐ BÀI HỌC ĐẮT NHẤT — kết luận đầu tiên của ledger đã SAI, và Hoà lật nó

Sau khi tìm ra khuyết tật (bằng chứng không chạm được chủ thể), ledger tự kết luận:

> *nếu nó không khúc xạ được môi trường thì gọi nó là thấu kính là nói quá — nó là một khối
> tím đục có đèn bên trong.*

Hoà lật:

> *"nếu màu tím là cả cục kính lỏng thì chắc chắn ko ra. hình dung kính lỏng trong đè lên
> 1 lớp mỏng màu tím."*

Lỗi **chưa bao giờ ở tham vọng. Nó ở CÁCH DỰNG.**

| | Kết luận rẻ | **Kết luận đúng** |
|---|---|---|
| làm gì | **hạ lời khẳng định** xuống cho khớp artefact | **sửa artefact** cho khớp lời khẳng định |
| kết quả | mất một chữ ký sản phẩm | có một chữ ký sản phẩm |
| trông thế nào | **rất hợp lý ở từng bước** | tốn công hơn |

> **Hạ tham vọng xuống cho vừa một bản dựng hỏng là cách trông đàng hoàng nhất để đánh mất
> chữ ký của một sản phẩm — vì từng bước lập luận đều sạch sẽ.**

Ghi lại vì nó **sẽ** tái diễn: mỗi lần một thứ đẹp khó dựng, sẽ luôn có một lập luận gọn gàng
chứng minh rằng ta *"không thật sự cần nó"*.

## KHÔNG ĐƯỢC CHÉP GÌ

- ⛔ **Chưa có bản chốt giữa SAU và V2.** Trạng thái: 🟡 **CANDIDATE — chờ mắt Hoà trên
  Electron**. Sắc độ/độ đặc cụ thể là **quyền của Claude Design**; MAIN chỉ dựng đúng mô hình
  vật lý Hoà đã đặc tả, **không tự chọn thẩm mỹ**.
- ⛔ **Đừng lấy `L 0.647 → 0.353` làm hằng số.** Số đo của **một** cấu tạo với **một** màu.
  Thứ mang đi được là **phép thử**, không phải cặp số.
- ⛔ **Đừng chép G3 sang bề mặt thứ hai.** *"G3 xuất hiện khắp nơi ⇒ TOÀN BỘ THANG BẬC SỤP.
  Hiếm chính là thứ tạo ra giá trị của nó."*
- ⛔ **Đừng thêm quầng sáng ngoài.** Cấm tường minh; **G3 zero-glow vẫn là G3**.
- ⛔ **Đừng đọc "kính có cấu tạo" thành "kính dày hơn".** `REF-DNA` S7: không ảnh tham chiếu
  nào có G3 khối dày.

## PHÉP NGHIỆM THU — dán vào mọi hợp đồng có G3

> **Lấy màu ở TÂM và ở SÁT RÌA. Rìa phải ĐẶC hơn tâm. Bằng nhau ⇒ TRƯỢT.**
> Đo trong **oklab**, không đo trong HSL. Và **phải kèm hàng cỡ thật.**

Đọc kèm: `BAD/kinh-soc-thu-va-gel-tim.md` · `GOOD/kinh-g1-g3-dung-cau-tao.md` ·
`02-FAILURE-LEDGER.md` F-14.
