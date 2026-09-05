# HOME · BA NGHIÊN CỨU BỐ CỤC — ⚖️ ĐÃ XÉT XONG 04/09

> ## 🔒 TRẠNG THÁI: **ỨNG VIÊN ĐÃ XÉT — KHÔNG PHẢI BẢN ĐANG DÙNG.**
> Hoà đã duyệt cả ba và **không chọn nguyên bản nào**. Quyết định chính thức:
> **HOME = HYBRID B×A, C chỉ làm lớp khí quyển** — xem `docs/delivery/HOME-HYBRID-BA.md`.
> Ba bản dưới đây **bị đè với tư cách ứng viên độc lập**, giữ lại làm **dấu vết lập luận**:
> chúng là chỗ ghi *vì sao* xương sống lấy của B và ngôn ngữ lấy của A.
> ⛔ Không thi công A, B hoặc C nguyên bản. Không trích bản nào làm authority.

> **Bối cảnh:** Hoà phán bản Home hiện tại **TRƯỢT** EXS §6. Nguyên nhân **không phải** khoảng
> cách/màu/chi tiết mà là **MÔ HÌNH BỐ CỤC**: *"một thẻ trắng quá khổ + một cột dashboard phụ"*
> không phải là *"một tiêu điểm"*. Lệnh: **DỪNG thi công**, dựng **ba nghiên cứu** cùng chức năng
> đã duyệt, chỉ khác **bố cục và thứ bậc**, rồi trình mắt trước.
>
> **Trạng thái: CHƯA CÓ DÒNG MÃ NÀO.** Ba tệp dưới là bản vẽ HTML ở khổ thật **1600×900**, dùng
> **token thật chép từ `app/globals.css`** (không chế màu, không chế số), có ảnh **cả hai nền**.

| | Bản vẽ | Ảnh |
|---|---|---|
| **A** BÌA TẠP CHÍ | `docs/mocks/mock-home-nc-A-bia-tap-chi.html` | `…/lo-02-home-nc/mock-home-nc-A-*` |
| **B** DẢI LIÊN TỤC | `docs/mocks/mock-home-nc-B-dai-lien-tuc.html` | `…-B-*` |
| **C** CHIỀU SÂU | `docs/mocks/mock-home-nc-C-chieu-sau.html` | `…-C-*` |

**Chung cho cả ba** — đây là phần *không* thay đổi, đúng lệnh *"vary composition, not product scope"*:
cùng bộ dữ liệu (việc dở · dự án · lời chào · ghi nhanh · số chặng · tin xưởng) · **giữ nguyên
kiến trúc điều hướng đã duyệt** (rail ba cụm, nấc 52/240/320) · không thêm/bớt tính năng nào.

---

## A · BÌA TẠP CHÍ

**① TIÊU ĐIỂM** — công việc đang dở chiếm **~78% bề ngang, tràn từ mép tới mép, KHÔNG có vỏ thẻ**:
không bo, không viền, không bóng. Nó **là trang**, không phải *một thẻ trên trang*. Tên dự án đặt
ở cỡ **56px**, dưới cùng bên trái theo nhịp bìa tạp chí; dải dìm chỉ phủ **chân chữ**, phần ảnh còn
lại giữ nguyên (luật 16/08: *đo tương phản tại chân chữ, không dìm cả tấm*).

**② THÔNG TIN PHỤ** — một cột **372px không có một cái thẻ nào**. Các mục cách nhau bằng **một vạch
mảnh + khoảng trắng**, không bằng vỏ hộp. Lời chào là **chữ**, không phải widget. Số chặng là **ba
con số trần**. Dự án khác là **ba dòng**, không phải ba thẻ ảnh.

**③ RAIL** — thu về **52px** ở Home: Home là chỗ *quay lại làm việc*, không phải chỗ *đi tìm tệp*.

**④ TRẢI NGHIỆM QUAY LẠI** — đọc được ở **một cái liếc**: đang dở gì · dừng lúc nào · đang ở chặng
nào · nút *"Mở lại mặt bằng tầng 2 →"* nói rõ **sẽ mở đúng cái gì**, không phải "Mở lại" chung chung.

**⑤ VÌ SAO KHÔNG PHẢI SaaS** — SaaS dashboard = **nhiều thẻ ngang hạng**. Ở đây **lớp chính có đúng
một mặt phẳng và nó không phải thẻ**; lớp phụ **không có thẻ nào cả**. Bỏ hết chữ đi vẫn còn một
bức ảnh và một dòng tên — đó là bìa, không phải bảng điều khiển.

---

## B · DẢI LIÊN TỤC

**① TIÊU ĐIỂM** — dải trên chiếm **2/3 chiều cao**: chữ bên trái, **hiện vật thật bên phải** — bản
vẽ đang dở, nghiêng **1,1°**, bóng dài. Người dùng nhìn thấy **chính cái mình đang làm**, không
phải một ô màu đại diện cho nó.

**② THÔNG TIN PHỤ** — 🔴 **BỎ HẲN CỘT PHẢI.** Chẩn đoán: *"nghĩa địa widget"* sinh ra từ **cái
cột**, không phải từ từng widget — có cột thì widget sẽ xếp hàng vào. Bỏ cột đi thì thông tin phụ
buộc phải nén xuống **một hàng phim dự án** + **một dòng nền duy nhất** (giờ giấc · số chặng · tin
xưởng · ghi nhanh, tất cả trên một dòng).

**③ RAIL** — giữ **52px**, và nay nó là **vật đứng duy nhất bên trái**, không còn cạnh tranh với
một cột thứ hai bên phải.

**④ TRẢI NGHIỆM QUAY LẠI** — mạnh nhất trong ba bản: bản vẽ hiện ra ở cỡ đủ để **nhận ra mình đang
ở đâu trong bản vẽ đó** trước khi bấm.

**⑤ VÌ SAO KHÔNG PHẢI SaaS** — không có cột widget, không có lưới thẻ, **không có ô nào bo góc ở
lớp chính** ngoài chính bản vẽ. Ba dải phân hạng bằng **cỡ chữ và khoảng trắng**, không bằng viền.

---

## C · CHIỀU SÂU

**① TIÊU ĐIỂM** — **đúng MỘT vật có vỏ trên cả màn**: tấm việc-đang-dở, nổi trên nền, bóng dài
**96px**. Mọi thứ khác đứng thẳng trên nền.

**② THÔNG TIN PHỤ** — **bốn cụm chữ ở bốn vùng lề**, không hộp, không nền, không viền. Nền là
**ánh sáng theo giờ** — cơ chế IF đã có (`LightClock`), không phải hình dán.

**③ RAIL** — **52px**, và vì nền là ánh sáng chứ không phải mặt phẳng đặc, rail đọc ra như **nổi
trên** nền chứ không phải **cắt** nền làm hai.

**④ TRẢI NGHIỆM QUAY LẠI** — tấm chính mang **ảnh + tên + chỗ dừng + một việc kế tiếp cụ thể**
(*"chưa gán vật liệu sàn"*) — nói được **vì sao nên quay lại**, không chỉ *cái gì đang dở*.

**⑤ VÌ SAO KHÔNG PHẢI SaaS** — SaaS dựng thứ bậc bằng **đường viền và ô**; bản này dựng bằng **độ
sâu và cỡ**. Đếm số vật có vỏ trên màn: **một**. Dashboard nào cũng ≥5.

---

## BỐN CÂU HOÀ ĐÃ ĐẶT — cả ba bản trả lời thế nào

| Đáng có thẻ lớn thường trực không? | A | B | C |
|---|---|---|---|
| Lời chào | chữ trong cột nền | **một mảnh của dòng đáy** | chữ ở lề trên-phải |
| Ghi nhanh | ô một dòng, viền đứt | **một mảnh của dòng đáy** | một dòng ở lề dưới-phải |
| Số chặng | ba số trần | **một mảnh của dòng đáy** | ba số ở lề phải |
| Tin xưởng | ba dòng | **một mảnh của dòng đáy** | hai dòng ở lề phải |

⇒ **Không bản nào giữ chúng làm thẻ lớn.** Khác nhau ở mức độ: **B nén mạnh nhất** (tất cả về một
dòng), **A giữ chúng đọc được nhất**, **C ở giữa và dựa vào khoảng trắng nhiều nhất**.

## ⚠️ KHAI THẲNG — những gì bản vẽ này CHƯA chứng minh
1. **Ảnh dự án là gradient dựng tay**, không phải render thật. Bố cục đúng không thì thấy được;
   ảnh thật vào có "nặng" hơn không thì **chưa biết**.
2. **Chưa có trạng thái RỖNG** (chưa dự án nào · chưa việc dở nào). A và C dựa vào một ảnh lớn —
   **chưa có ảnh thì hai bản đó yếu đi nhiều**, đây là rủi ro thật của cả hai.
3. **Chưa có khổ hẹp.** Ba bản chỉ vẽ 1600×900.
4. **Chưa đo tương phản** từng chuỗi chữ; mới chọn token đã đạt sẵn, chưa chạy máy đo.
5. **Chưa có chuyển động, chưa có trạng thái trỏ vào.**
6. Nhãn tím ①②③ trên ảnh là **chú giải cho phiếu duyệt**, KHÔNG thuộc sản phẩm.

## SAU KHI HOÀ CHỌN
Chọn một hướng (hoặc ghép: *"lấy tiêu điểm của B, lớp nền của A"*) → khi đó mới dựng bản vẽ chi
tiết cho hướng đó (trạng thái rỗng · khổ hẹp · hover · đo tương phản) → **rồi mới code**.
⛔ Không thi công bản nào trước khi Hoà chọn.
