# BÁO CÁO P-F · BỘ NỀN CHUNG — MỘT TRANG DUYỆT GỘP 5 MỤC

> Phiên P-F, 16/08. Phiếu `docs/phieu-giao/P-F-bo-nen-chung-duyet-truoc.md` + **lệnh sửa ô ④.1
> giữa chừng (bỏ màu đồng)**. Chỉ dựng bản vẽ, không sửa code. Khuôn 6 phần + ⑦b + ⑦c.

## 1 · TỔNG QUAN

Dựng xong `docs/mocks/mock-bo-nen-chung.html` — một trang, năm mục, xem liền mạch.
`soi:tu-dien` **0 lệch** · `check:mocks` **file này 0 lần trong bảng đỏ**.

Nhận lệnh bỏ đồng giữa chừng, đã làm lại toàn bộ phần màu nhấn. Phần đáng giá nhất của đợt này
**không phải ba màu thay** mà là thứ lộ ra khi đi tìm chúng: **phổ màu của IF chỉ còn đúng hai cửa
hue sạch**. Con số đó đổi hẳn cách nên nghĩ về màu nhấn — chi tiết §2.3.

## 2 · CHI TIẾT TỪNG MỤC

### 2.1 · Ô ⓪ + ⓪b

| # | Tiền đề | Kết luận | Bằng chứng |
|---|---|---|---|
| ⓪b | Worktree đúng HEAD, lệch 0 | ✅ | `21371df` · `rev-list --count HEAD..main` = **0** |
| 1 | Theme sáng nền kem `#f2efe9`, ấm ngả vàng | ✅ **XÁC NHẬN** | đo độ vàng nền = **32%** — rất cao cho một mặt nền |
| 2 | `--accent` `#6a57f5` · `--accent-warm` `#c79a63` tự khai chỉ-dùng-login mà đã lan 12 tệp | ✅ **XÁC NHẬN** | `:19` · `:26` + chú thích `:24-25`; `grep -rl` = **đúng 12 tệp** |
| 3 | `--warning` `#d9a34a` 37°, cách đồng 4° | ✅ **XÁC NHẬN** *(kèm bổ sung)* | `:206`. **Bổ sung:** `--warning` có **HAI giá trị** — sáng là `#9a6304` (`:258`). Phiếu chỉ nêu bản tối |
| 4 | Ngưỡng kính P-E 0,82/0,68/0,62/0,35 | ✅ **XÁC NHẬN** | số tôi đo ở P-E — kế thừa, không đo lại |

### 2.2 · Ba bản theme sáng (④.1)

| | A · trung tính lạnh | B · ngà trầm | C · nền trầm ban ngày *(tôi đề xuất)* |
|---|---|---|---|
| Nền | `#f2f3f5` — xám-lam **12%** | `#eceae5` — vàng **10%** | `#e3e5e4` — gần **0%** màu, sáng **89%** |
| Chữ chính | `#1a1c1f` · **17,1:1** | `#1f1d1a` · **16,4:1** | `#1a1c1b` · **16,9:1** |
| Chữ mờ | `#63696f` · **5,0:1** | `#645f57` · **5,3:1** | `#5c605e` · **5,0:1** |
| Điểm yếu | lạnh, dễ ra "phần mềm văn phòng" | cùng họ với bản đang bị chê | **ít tính cách nhất** |

Gốc "sến" đo được: nền kem hiện tại **32% bão hoà vàng**. Cả ba bản hạ về **0–12%**.

**Vì sao tôi đề xuất C:** ① **nền có màu làm sai màu vật liệu** — IF là chỗ ngồi chọn gỗ, đá, sơn;
nền ngả vàng thì mọi mẫu và mọi render trông ấm hơn thực tế (cùng lý do phòng in dùng xám trung
tính) ② **nền hạ một bậc chính là "dìm nền"** chủ dự án yêu cầu — nền 93% gần bằng thẻ trắng nên thẻ
chìm; nền 89% thì thẻ tự nổi, card được trong hơn. Cái mất của C **đã ghi thẳng trong trang**: ít
tính cách nhất, chất riêng phải đến từ chữ ký và ảnh.

### 2.3 · ⛔ Bỏ đồng — và thứ lộ ra khi đi tìm màu thay

**Đã bỏ `#c79a63` khỏi vai màu nhấn**, ghi rõ lý do ngay trong trang (mục 1b) để phiên sau không
tưởng là quên. Lý do đúng về màu: **màu ấm bão hoà thấp trên nền xám ra xỉn, ra ố — không ra trầm**;
đồng chỉ sống trên nền kem ấm, mà nền kem ấm vừa bị loại vì sến ⇒ **giữ đồng trong khi làm theme
sáng trung tính là mâu thuẫn tự thân**. Ca soi 4° cũ **tự tan**, đã thay bằng kiểm mới.

⭐ **PHÁT HIỆN CHÍNH CỦA ĐỢT — phổ màu chỉ còn HAI cửa sạch.** Dựng bảng phổ đầy đủ mới thấy:

| Vùng | Ai chiếm | Dùng được? |
|---|---|---|
| ~8–10° | **đỏ · sai chuẩn** (`#e5674f` tối · `#c9341d` sáng) | cấm |
| ~37–38° | **vàng · cần xem lại** (`#d9a34a` · `#9a6304`) | cấm |
| 57–125° | trống — vàng-lục / ô-liu | **loại** — ám vàng, trên nền xám ra ố, **đúng lỗi vừa bỏ đồng** |
| ~145–152° | **xanh · đạt** (`#46b876` · `#107043`) | cấm |
| **168–202°** | TRỐNG | ✔ **cửa 1 — mòng két** |
| 202–322° | tím 262° ± 60 | quá gần tím |
| **322–349°** | TRỐNG | ✔ **cửa 2 — mận** |

🔧 **Một số của phiếu cần đính chính:** phiếu ghi *"cách xa đỏ 25°"*. Đo thật: đỏ ở **8–10°**, không
phải 25°. Không đổi kết luận nào (cả ba hướng đều xa đỏ), nhưng ghi lại cho đúng.

### 2.4 · Ba hướng màu thay — đo trên trang thật

| | ① Mòng két | ② Mận | ③ Một tím hai nấc *(tôi đề xuất)* |
|---|---|---|---|
| Sáng | `#1f7a82` · **5,0:1** | `#8f3a5c` · **7,2:1** | `#6d28d9` · **8,6:1** |
| Tối | `#3aa8b4` · **6,1:1** | `#c4718f` · **6,0:1** | `#c4b5fd` |
| Góc màu | 185° | 336° | cùng tím |
| Cách tím | **77°** | **74°** | 0° — không thêm hue |
| Gần màu nghĩa nhất | xanh đạt **40°** | 🔴 đỏ **33°** | **không hue nào** |

Cả ba **làm được cả chữ lẫn mảng tô** và **đều nhận chữ trắng** — hơn hẳn đồng, vốn chỉ đạt 2,6:1
khi làm chữ nên chỉ làm được nền khối. Đo trên trang: nút ① `rgb(31,122,130)` · ② `rgb(143,58,92)`
· ③ `rgb(109,40,217)`, chữ trắng cả ba.

**Vì sao tôi đề xuất ③ — lý do đến từ chính bảng phổ.** Phổ chỉ còn hai cửa, tức **mỗi màu thêm vào
là đóng thêm một cửa** và ép ba màu nghĩa vào thế chật hơn. Hướng ③ **không tiêu cửa nào**: trên màn
chỉ còn **bốn hue** — tím của app, đỏ/vàng/xanh của nghề. Hệ quả đúng điều đã chốt *"màu luôn mang
nghĩa"*: **bất kỳ mảng màu nào không phải tím thì chắc chắn đang nói một điều gì đó.** Đây là mức
mạnh nhất luật đó có thể đạt.

**Cái mất, nói thẳng** (đã ghi trong trang): ③ **mất cơ chế cặp-màu-đảo-vai-theo-giờ**. Nếu chủ dự
án tiếc cơ chế kể-giờ thì ① là hướng đúng — mòng két là hue duy nhất vừa sạch trên nền xám vừa đủ
xa cả tím lẫn ba màu nghĩa. **Không chọn hộ.**

**Nút "Vào xưởng" màn khoá** — đã vẽ cả ba hướng trên nền ảnh thật (mục 1d), dùng bản SÁNG của màu
+ chữ mực đậm. Kèm ghi chú: đây là chỗ đồng từng làm tốt nhất, nên hướng nào trông yếu hơn đồng rõ
rệt thì đáng cân nhắc lại.

### 2.5 · ⚠️ NGUYÊN TẮC DÙNG KÍNH — sửa giữa chừng, tôi đã làm SAI trước đó

**Câu hỏi *"có ai có nguyên tắc chưa"* — CÓ, và IF đã có từ đầu tháng 8.** Trích vào trang:

| Luật IF | Ở đâu | Vì sao có |
|---|---|---|
| **“Kính là VỎ không là RUỘT”** | `docs/00-CHOT.md:39` — chốt 01/08 | vỏ bọc thì được kính; ruột chứa nội dung thì đặc |
| **“Panel kính nổi PHẢI portal ra ngoài, không lồng trong chrome kính”** | `docs/00-CHOT.md:44` — luật K4, 02/08 | sự cố thật: dropdown trong khung kính tiêu đề ⇒ **xuyên thấu, nhìn không ra** |

Apple nói đúng ba điều y hệt (kính cho lớp điều hướng · cấm kính chồng kính · hai biến thể không
trộn). **IF đi tới cùng kết luận đó trước, bằng một lần vỡ giao diện** — đã ghi rõ trong trang để
phiên sau biết đây là luật cũ chứ không phải luật mới chép về.

🔴 **Bản vẽ của tôi đã vi phạm và đã sửa:** card mẫu cho **mỗi vùng một `backdrop-filter`** ⇒ đúng
ca **kính chồng kính**, phạm K4. Đo lại sau sửa: **`backdrop-filter` trong toàn tệp = 0**, vì card
là **ruột** nên không dùng kính chút nào.

Trang có bảng hai cột **DÙNG KÍNH ↔ KHÔNG DÙNG KÍNH** theo tiêu chí một câu của chủ dự án
(*“chiếm chỗ thì xuất hiện để mọi thứ không ngộp”* ⇒ **kính chỉ cho thứ ĐÈ LÊN nội dung khác**).

⚠️ **Khai thẳng:** bản vẽ Home (`mock-sidebar-3-nac-home.html`) **còn nguyên bệnh này** — thẻ số
liệu và dòng việc ở đó đang là kính dù chúng là ruột. **Chưa sửa** (ưu tiên phiếu này trước theo
đúng chỉ đạo). Đây là nợ, không phải sót.

### 2.5b · Ba tầng ánh sáng (`baTangAnhSang`) — thêm ở lượt cuối

| Tầng | Khi nào | Nghĩa | Hình thức |
|---|---|---|---|
| ① Kính nhận sáng | **luôn luôn** | **CHẤT LIỆU** | mép trên bắt sáng + `backdrop-filter` đổi theo nền · **đứng yên** |
| ② **Quầng sáng quanh viền** | lúc rê chuột | **KHẢ NĂNG** | viền sáng lan ra ngoài, mềm · **ĐỨNG YÊN** · mặt card không đổi |
| ③ Viền chạy liên tục | lúc đang render | **TRẠNG THÁI** | ánh sáng **CHẠY** vòng viền |

🔴 **SỬA lượt cuối — T mô tả tầng ② sai và tôi đã dựng theo bản sai.** T dặn *"gradient nổi trên
bề mặt"*; đúng ra là **quầng sáng lan quanh VIỀN**, mềm, **mặt card không đổi**. Đã sửa CSS: bỏ
`background: linear-gradient(...)` trên mặt, thay bằng `box-shadow` toả ra ngoài mép.

⭐ **Và cái sửa đó đẻ ra xung đột mới — đã giải:** ② và ③ nay **về cùng một chỗ (đều ở viền)**, nên
lập luận "ba khoảng thời gian rời nhau" của tôi **không còn đủ** để tách chúng. Kênh phân biệt phải
là **CHUYỂN ĐỘNG**: ② **đứng yên** ⇒ *con trỏ đang ở đây* · ③ **chạy vòng** ⇒ *đang render*. Mắt
phân biệt chuyển động nhanh hơn phân biệt màu, nên đây là kênh đúng. Đã dựng hai card kề nhau —
một đứng yên một chạy — để soi tận mắt là không lẫn.

Khoảng-thời-gian-rời-nhau **vẫn đúng và vẫn cần**, chỉ là nay nó là **lớp bảo vệ thứ hai** chứ
không phải lớp duy nhất.

⚠️ **Một hệ quả tôi tự thấy và đã ghi vào trang:** khi bật *giảm chuyển động*, ③ thôi chạy ⇒ ② và ③
trông **gần giống nhau**. Lúc đó **chữ trạng thái ("Đang dựng ảnh") thành kênh phân biệt chính** —
không được bỏ. Nếu bỏ, chế độ giảm chuyển động sẽ mất khả năng phân biệt hai tầng.

📌 **Chỗ này đã KÍN — ghi cho phiên sau:** trong ảnh tham chiếu, quầng sáng đó thực ra nói *"người
khác đang ở node này"* (có nhãn tên). IF nay đã dùng viền sáng cho **khả năng** và viền chạy cho
**trạng thái** ⇒ khi làm cộng tác thật, **presence phải có kênh THỨ BA** (vd avatar nhỏ ghim ở góc
+ tên), **không được lấy lại viền sáng**.

**Giảm chuyển động:** ③ tắt đầu tiên → viền tĩnh màu nhấn, chữ "Đang dựng ảnh" giữ nguyên nên
**không mất nghĩa**.

📌 **Nợ cũ đang trả**, đã trích vào trang: `hover-gradient-kem` · `card-kinh-gradient` (mở 12/08,
chưa ai làm). 🔴 **Đính chính ghi rõ trong trang**: entry hover ghi gradient **KEM** — kem/vàng
vừa bị bỏ cùng ngày vì trên nền xám ra xỉn ⇒ đổi sang **mòng két**. Không im lặng đổi.

### 2.5c · Theme sáng canh theo Apple (lượt cuối, thay ba bản A/B/C)

⭐ **Con số giải thích chữ "sến"** — bằng chứng đắt nhất của cả đợt:

| Nền | R | G | B | Hướng sắc |
|---|---|---|---|---|
| Apple `#F2F2F7` | 242 | 242 | **247** | ngả **LAM** |
| IF hiện tại `#f2efe9` | 242 | 239 | **233** | ngả **VÀNG** |

**Cùng độ sáng, ngược hướng sắc — chênh đúng 14 điểm ở kênh lam.** Đó là toàn bộ khoảng cách
giữa "sạch" và "rẻ tiền", và nó **đo được**.

⚠️ **Khai thật trong trang**: Apple **cố ý không công bố hex**; số dùng là **giá trị đo được** từ
màu hệ thống iOS, không phải bảng Apple phát hành.

**Điều thứ hai mượn:** nền chính là **TRẮNG**, xám `#f2f2f7` chỉ làm **nền nhóm** để lùi ra sau.
**IF trước đây làm ngược** — lấy kem làm nền chính nên nội dung không có gì để nổi lên.

🔧 **Một chỗ tôi cố ý lệch Apple, nói rõ**: `secondaryLabel` của Apple (đen 60%) trên `#f2f2f7`
chỉ đạt **3,3:1 — trượt WCAG AA**. Apple sống được vì có nấc tăng tương phản của hệ điều hành;
IF thì không ⇒ đậm lên `#6c6c70` để đạt **4,7:1**. Canh theo Apple về *hướng sắc và cách xếp lớp*,
**không chép mù độ mờ**.

### 2.6 · Card — đọc lại theo cách thứ BA (④.2, dựng lại)

Ba cách, và chỉ cách 3 giữ được ảnh:
· cách 1 (kính đặc) → **dìm cả tấm** · cách 2 (dìm nền + card trong) → **vẫn dìm cả tấm**
· ⭐ **cách 3 — lớp phủ chuyển sắc CỤC BỘ**: vệt tối **chỉ ở dải có chữ**, khoảng giữa ảnh **sống trọn**.

**Điểm nghiệm thu — đo TẠI CHÂN CHỮ, không đo trung bình cả card:**

| Vị trí | Độ đặc | Chữ trắng trên ảnh sáng nhất | Kết |
|---|---|---|---|
| Chân chữ tiêu đề (dải đỉnh) | **0,72** | **9,3:1** | ĐẠT |
| Chân dãy số (dải đáy) | **0,78** | **11,1:1** | ĐẠT |
| Giữa ảnh | **0** | không có chữ | ảnh sống trọn |

**Sàn rút ra: lớp phủ tại chân chữ phải ≥ 0,54** thì chữ trắng mới đạt 4,5:1 với *mọi* ảnh (tính
theo ca xấu nhất — ảnh trắng tinh). **Đo trung bình cả card là sai cách** — trung bình đẹp mà chân
chữ mỏng thì chữ vẫn mất.

**Không đường kẻ** — đo trên trang: `hr` trong card = **0**; tách vùng hoàn toàn bằng chuyển sắc.
Giữ đúng ranh giới: **vạch dọc mảnh giữa ba con số VẪN CÒN** (đúng ảnh tham chiếu) — chỉ cấm kẻ ngang.

**Card sổ ra** — đo: thu gọn **172px** ↔ đã sổ **268px**. Phần khó không phải hiệu ứng mà là
**chia cốt lõi ↔ để dành**, trang có bảng riêng, tiêu chí một câu: *cốt lõi = vừa đủ để quyết định
có cần mở ra hay không*.

⭐ **Nối với lưới, không tách rời**: card gọn thì cao đều nhau, lưới xếp chặt theo nhịp cột; card
nhồi thì cái cao cái thấp và chỗ hụt thành mảng trống. **Bấm-thì-sổ-ra chính là thứ giữ cho card đủ
gọn để lưới có nhịp** — nên "thừa trống + widget bị giãn" và "card sổ ra" là **một việc**.

### 2.7 · Lưới (④.3) · Sidebar (④.4) · Chữ ký (④.5)

**Lưới** — TRƯỚC/SAU cùng lượng nội dung. Bản SAU đo được **4 cột đều đúng 154,5px**, ô chiếm số
cột nguyên. Bản TRƯỚC dùng co-giãn-tự-do để thấy đúng bệnh: ô ít chữ bị **kéo dài ngang**, hàng
dưới hụt nên **hở một mảng**. Trang phân biệt rõ **khoảng trống có chủ ý** (lề 20 · khe 12, đều đặn)
≠ **thừa trống** (mảng hở lạc lõng) — hai lời chê của chủ dự án không mâu thuẫn, một cái có nhịp,
một cái không.

**Sidebar** — 5 cơ chế, mỗi cơ chế kèm *"đỡ cho người dùng cái gì"*, trong đó ⑤ là tôi đề thêm:
nhóm "Đang làm" **tự dọn khi đóng dự án** — sidebar không phình theo thời gian mà không bắt ai đi dọn.

**Chữ ký** — ba phương án, không chọn hộ: **PA1 sống lưng ba chặng** · **PA2 số có neo** (số **đo
được** vạch liền, số **người nhập** vạch đứt) · **PA3 cặp màu kể giờ**. Nhận xét nghề: PA1 và PA2
**ghép được**, PA3 chạy nền nên không chọi ai; tôi nghiêng PA2 vì mã hoá **lời hứa lõi** chứ không
phải cách bày màn hình. ⚠️ **PA3 phụ thuộc kết quả chọn màu**: nếu chọn hướng ③ thì PA3 mất nền tảng.

### 2.6 · Một mâu thuẫn trong phiếu, tôi tự xử và khai ra

Ô ④.1 vừa nói *"Theme tối GIỮ NGUYÊN — đừng đụng"* vừa nói *"theme tối dùng bản sâu `#6d28d9`"*.
**Tôi đọc là: giữ nguyên bộ NỀN/CHỮ tối (thứ Hoà khen), còn màu NHẤN đổi theo chỉ đạo mới.** Đã làm
đúng thế. Nếu đọc sai thì sửa chỉ là một dòng.

## 3 · TỔNG KẾT LẠI VẤN ĐỀ

Bốn lời chê nghe như bốn việc, đo ra chỉ **hai gốc**: **gốc thị giác** — nền quá vàng (32%), gây cả
"sến" lẫn "giống điện thoại Trung Quốc"; **gốc cấu trúc** — lưới không có nhịp cột, gây cả "thừa
trống" lẫn "widget bị giãn" cùng lúc. Sửa hai gốc thì bốn triệu chứng tắt cùng nhau — đúng lý do
việc này đáng duyệt trước mọi màn cụ thể.

Lệnh bỏ đồng giữa chừng hoá ra **không phải một việc phát sinh mà là hệ quả tất yếu** của gốc thứ
nhất: khi đã bỏ nền kem ấm thì đồng mất chỗ đứng. Và khi buộc phải đi tìm màu thay, mới lộ ra thứ
đáng giá nhất đợt này — **phổ màu của IF gần như đã đầy**. Đó là lý do câu hỏi thật không còn là
*"chọn màu nào"* mà là *"có nên tiêu nốt một cửa hue hay không"*.

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Tốt**
- Không dừng ở việc đề xuất ba màu mà **dựng bảng phổ đầy đủ** — nhờ đó thấy chỉ còn hai cửa, và
  loại được vùng 57–125° bằng đúng lý do vừa làm đồng chết (tránh lặp lỗi ngay trong cùng đợt).
- Bắt được `--warning` có hai giá trị, và đính chính con số "đỏ 25°" của phiếu (thật: 8–10°).
- Mỗi hướng có **khoảng cách tới cả ba màu nghĩa**, không chỉ tới tím — nên phát hiện được ② mận
  gần đỏ nhất (33°), thứ dễ bỏ sót nếu chỉ đo với tím.
- Mọi số đều đo trên trang thật, không chỉ khai trong CSS.

**Chưa tốt / rủi ro**
- ⚠️ **Ba hướng màu KHÔNG cùng loại lựa chọn.** ① và ② là chọn hue; ③ là **bỏ hẳn khái niệm màu thứ
  hai**. So ba thứ này cạnh nhau hơi khập khiễng — chủ dự án đang được hỏi hai câu (*màu nào?* và
  *có cần màu thứ hai không?*) trong một bảng. Tôi bày vậy vì phổ không còn cửa thứ ba thật, nhưng
  đây là chỗ dễ gây nhầm và tôi nói trước.
- ⚠️ **Chưa thấy ba màu trên khối lượng nội dung thật** — ô mẫu 455px không thay được một màn Home
  đầy số liệu.
- ⚠️ **Bản C có thể bị chê "nhạt"**; A và C có thể trông hơi giống nhau nếu không soi kỹ (khác thật
  ở độ sáng nền 95% ↔ 89%).
- ⚠️ Số tương phản **tính tay**, chưa đo bằng máy — xem ⑦b.
- Sidebar và chữ ký là **đề xuất trên giấy**, chưa thử trên dữ liệu dự án đông việc.

## 5 · HƯỚNG XỬ LÝ — NHIỀU GÓC ĐỘ

**Hướng A — chốt cả nền lẫn màu nhấn ngay từ trang này.**
· Ưu: mở khoá toàn bộ hàng đợi giao diện; mọi màn sau chỉ là áp vào.
· Nhược: đang hỏi hai câu khác loại trong một lượt (nền nào · có cần màu thứ hai không), dễ chốt vội.

**Hướng B — tách hai câu: chốt NỀN trước, màu nhấn sau.**
· Ưu: nền là thứ ba bản khác nhau rõ và dễ quyết; màu nhấn phụ thuộc nền (mòng két trên nền A khác
hẳn trên nền B) nên quyết sau là đúng thứ tự nhân quả.
· Nhược: hai lượt duyệt mắt.

**Hướng C — chọn 2 bản nền lọt vòng trong, dựng Home thật cho cả hai rồi chốt cả nền lẫn màu.**
· Ưu: đúng cách người ta chọn màu — nhìn trên nội dung thật, không trên ô mẫu. Giảm hẳn rủi ro
"chọn xong mới thấy chán", mà cái giá của việc đó là soi lại toàn bộ màn đã áp.
· Nhược: tốn nhất — thêm một vòng dựng và một vòng duyệt.

## 6 · ĐỀ XUẤT — CHỌN HƯỚNG B

**Chốt nền trước (A/B/C), màu nhấn để lượt sau.**

Vì sao B chứ không A: hai câu này **có quan hệ nhân quả một chiều** — nền quyết định màu nhấn nào
sống được (chính bài học đồng vừa chứng minh: đồng chết vì nền đổi, không phải vì bản thân nó xấu).
Hỏi ngược lại hoặc hỏi cùng lúc là mời một lỗi y hệt lặp lại.

Vì sao B chứ không C: C đúng về nguyên tắc nhưng **đắt gấp đôi**, và phần lớn giá trị của nó nằm ở
việc thấy màu trên nội dung thật — thứ vẫn làm được ở lượt hai của hướng B, khi ấy chỉ còn một nền
duy nhất nên rẻ hơn hẳn.

Ba việc kèm theo:
1. **Khi hỏi màu nhấn, hỏi rõ hai tầng**: trước hết *"có cần màu thứ hai không"* (③ hay không ③),
   rồi mới *"màu nào"* (① hay ②). Bày ba cái ngang nhau như hiện tại là trộn hai câu.
2. **Xác nhận cách tôi đọc mâu thuẫn ④.1** (§2.6) — sai thì sửa một dòng.
3. Nếu chốt ③: **PA3 chữ ký (cặp màu kể giờ) mất nền tảng**, phải chọn lại giữa PA1 và PA2.

---

## ⑦ NGHIỆM THU — nguyên văn

```
$ npm run soi:tu-dien
✅ 0 lệch định nghĩa

$ npm run check:mocks
TỔNG: 114 file quét · 76 file ĐỎ · 140 loại lỗi · 944 lần vi phạm
# grep "bo-nen-chung" = 0 lần  →  FILE NÀY KHÔNG ĐỎ.
# Baseline lúc bắt đầu: 112 file · 75 đỏ · 941 vi phạm.
# +2 file / +1 đỏ / +3 vi phạm KHÔNG PHẢI của tôi:
#   grep "mock-so-2-tim" = 2 lần → file phiên khác vừa thêm, và đó là file đỏ mới.

$ Đo ba hướng màu nhấn trên trình duyệt (viewport 1440×1000):
teal: --nhan=#1f7a82 | --nhan-toi=#3aa8b4 | nút nền=rgb(31,122,130)  chữ=rgb(255,255,255)
man : --nhan=#8f3a5c | --nhan-toi=#c4718f | nút nền=rgb(143,58,92)   chữ=rgb(255,255,255)
mono: --nhan=#6d28d9 | --nhan-toi=#c4b5fd | nút nền=rgb(109,40,217)  chữ=rgb(255,255,255)
còn dùng #c79a63: CHỈ trong chú thích giải thích vì sao bỏ — không còn trong vai màu nhấn.

$ Đo ba bản nền + ca màu nghĩa:
Bản A: nền=rgb(242,243,245) | cảnh báo=rgb(154,99,4)
Bản B: nền=rgb(236,234,229) | cảnh báo=rgb(154,99,4)
Bản C: nền=rgb(227,229,228) | cảnh báo=rgb(154,99,4)

$ Đo lưới bản SAU:
cols = 154.5px 154.5px 154.5px 154.5px      (4 cột đều, không ô nào co giãn tự do)

$ Đo card kiểu mới (sau khi sửa theo nguyên tắc kính):
thu gọn cao: 172px          |  đã sổ cao: 268px
card có backdrop-filter?  KHÔNG (đúng — card là ruột, không phải vỏ)
dải đỉnh: linear-gradient(rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.44) 46%, rgba(0,0,0,0) 100%)
dải đáy : linear-gradient(0deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.5) 42%, rgba(0,0,0,0) 100%)
số đường kẻ ngang trong card: 0
# Giữa hai dải KHÔNG có lớp phủ nào → ảnh sống trọn.

$ grep -c "backdrop-filter" docs/mocks/mock-bo-nen-chung.html
0
# Trước khi sửa: 2 (hai vùng của card mỗi vùng một lớp) = ca KÍNH CHỒNG KÍNH, phạm K4.

$ Cân bằng thẻ HTML sau khi thay cả một khối lớn: lệch = 0
```

## ⑦b · CHƯA CHẮC / CHƯA KIỂM

1. **Số tương phản TÍNH TAY, chưa đo bằng máy đo màu**; không tính `saturate(180%)` của lớp kính.
   Thứ hạng và kết luận chắc; **con số lẻ nên đo lại** trước khi thành luật.
2. **Chưa thấy ba màu nhấn trên nội dung thật** — chỉ trên ô mẫu và một nút.
3. **Chưa mô phỏng mù màu.** Ca đáng lo nhất giờ là **② mận ↔ đỏ sai chuẩn (33°)** — với người mù
   màu đỏ-lục, hai thứ này có thể lại gần nhau hơn con số hue gợi ý. **Chưa kiểm.**
4. **Chưa kiểm ở khổ hẹp** (máy tính bảng / điện thoại) — chỉ xem ở 1440.
5. **Chưa kiểm bằng trình đọc màn hình.**
6. **Hướng ③ tôi chưa kiểm được một điều quan trọng**: khi cả app chỉ còn một hue, các trạng thái
   *đang chọn · đang hover · đang bật* có đủ chỗ để phân biệt nhau bằng độ đậm không. Trên ô mẫu thì
   đủ; trên màn dày widget thì **chưa biết**.
7. **Không có ý kiến** về việc có nên dời `--warning` hay không — đó là `globals.css`, ngoài quyền
   phiên phụ. Sau khi bỏ đồng thì lý do dời cũng yếu hẳn đi.
8. Tên dự án trong bản vẽ là **bịa** (Thảo Điền — địa danh chung, không phải tên khách).

## ⑦c · HẠN DÙNG KẾT LUẬN

- **Bảng phổ "chỉ còn hai cửa" hết đúng ngay khi đổi bất kỳ màu nghĩa nào hoặc đổi tím.** Nó là hàm
  của bốn góc màu hiện tại; đổi một cái là phải dựng lại bảng, **đừng bê kết luận cũ sang**.
- Con số **5,0 / 7,2 / 8,6:1** gắn với đúng ba mã màu đề xuất; chỉnh sắc độ là phải tính lại.
- Kết luận **"cả ba nhận chữ trắng"** chỉ đúng với bản SÁNG/ĐẬM đã chọn; nếu ai làm nhạt màu đi để
  "dịu mắt" thì chữ trắng hỏng ngay — đúng bài học đồng.
- Bảng ba bản nền hết đúng nếu đổi `--t1`/`--t3` — tương phản là hàm của **cặp (chữ, nền)**.
- Ngưỡng kính 0,60/0,53 kế thừa từ P-E, cùng hạn dùng đã ghi ở đó.
- **Đây là bản ĐỀ XUẤT, chưa phải chốt.** Mọi giá trị chỉ thành luật sau khi chủ dự án chọn và có
  phiếu áp vào `globals.css`; trước đó `globals.css` vẫn là nguồn sự thật.
