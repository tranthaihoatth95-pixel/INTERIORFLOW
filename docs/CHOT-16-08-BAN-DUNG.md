# CHỐT 16/08 — BẢN ĐANG CÓ HIỆU LỰC (bảng đè chồng)

> **Vì sao có file này.** Ngày 16/08 Hoà chốt ~20 lần, và **6 chủ đề bị chốt lại 2-3 lượt trong cùng
> một ngày** — lượt sau đè lượt trước, có lượt lật ngược hẳn đề xuất của T. Ai đọc `00-CHOT.md` từ
> trên xuống sẽ gặp **bản ĐẦU trước bản CUỐI**, và tin bản đầu.
>
> File này **không thay** `00-CHOT.md` (vẫn là nhật ký đầy đủ, có lập luận). Đây là **bảng tra một
> dòng**: chủ đề nào có mấy lượt, **bản nào đang dùng**, bản nào **hết hiệu lực**.
>
> **Luật giữ file:** chốt 16/08 nào bị đè về sau thì sửa **ở đây trước**, rồi mới ghi tiếp `00-CHOT`.
> T lập 16/08 sau khi rà lại toàn bộ mục ngày 16/08.

---

## A · SÁU CHỦ ĐỀ BỊ CHỐT NHIỀU LƯỢT — đọc bảng này trước

### A1 · Vitals đứng ở đâu — **3 lượt**

| Lượt | Nội dung | Trạng thái |
|---|---|---|
| ① | Vitals **nhập vào ô tìm kiếm**: một ô hai chế độ, bấm chấm là chuyển Tìm ↔ Hỏi | ⛔ **HẾT HIỆU LỰC** |
| ② | *(cùng lượt)* bỏ pill Vitals riêng lơ lửng | ✅ giữ |
| ③ | **NEO THEO NGỮ CẢNH** — Vitals đứng ở chỗ **tay đang đặt** | ✅ **BẢN DÙNG** |

**Bản dùng, đầy đủ:**
- Ở **Home** (tay ở thanh trên) = **chấm tròn CẠNH ô tìm kiếm**. Ô tìm kiếm **cứ là ô tìm kiếm** — không kiêm hai chế độ. Hai vật riêng.
- Ở **chặng làm việc** (tay ở panel thông số) = **nút tròn RỜI cạnh trục phải**. Chữ *rời* = nổi **cạnh** panel, **không nhét vào trong** panel (nhét vào là lẫn với đám nút chức năng).
- **Hai ràng buộc cứng:** cùng MỘT vật, cùng hình dạng ở mọi chỗ (nó **di chuyển**, không phải ba vật giống nhau) · mỗi màn **đúng một** Vitals.
- **Cách phình:** chuột → **rê vào**, kiểu tai thỏ MacBook, **phải có trễ** (đi ngang qua không được kích hoạt) · cảm ứng → **nhấn giữ**, phải **nở dần trong lúc giữ** (giữ mù 500ms rồi bung = cảm giác máy đơ).
- **Ba nấc:** nhỏ = hỏi đáp · vừa = trả lời · **lớn = CHẾ ĐỘ AGENTIC**.
  🔴 **Đè sổ 12/08**: entry `vitals-3-window` ghi nấc 3 là *"trang phiên đầy đủ, lưới phiên cũ"* — **nay là chế độ agentic**, đổi hẳn bản chất từ *chỗ xem lại* thành *chỗ máy chạy cả chuỗi việc*. Khớp chốt A15: nấc lớn bày **đồ thị chuỗi việc kèm giá + nút duyệt**, KHÔNG phải màn chat phóng to.
- Đĩa lệnh **không đụng**: đĩa lệnh giữ trên **mặt canvas**, Vitals giữ trên **chính nút nó**.

🔧 **Đính chính kèm theo (agent P-E bắt được, T ghi sai):** hằng số nhấn giữ **không** ở `RadialToolMenu.tsx` mà ở **`components/ui/Tooltip.tsx:33,37`**, và tên thật là `TOOLTIP_LONG_PRESS_MS` — tiền tố nói rõ **nó thuộc về Tooltip**. ⇒ IF **CHƯA CÓ** chuẩn nhấn-giữ dùng chung. Cách đúng: tách ra cử chỉ chung, **giữ nguyên giá trị 500ms / 8px**, Tooltip và Vitals cùng đọc một nguồn.

---

### A2 · Nền Home có ảnh hay không — **3 lượt**, T sai 2 lần

| Lượt | Nội dung | Trạng thái |
|---|---|---|
| ① | T đề xuất: bỏ ảnh nền, dùng **nền ánh sáng**, vì "ảnh sau lưng thẻ số liệu làm mất đọc" | ⛔ **HOÀ LẬT** |
| ② | **Nền VẪN CÓ HÌNH**, lọc cho hợp lý | ✅ **BẢN DÙNG** |
| ③ | thêm **lớp phủ chuyển sắc cục bộ** — cách thứ ba, tinh tế hơn cả hai cách trên | ✅ **BẢN DÙNG** |

**T sai chỗ nào, ghi để không lặp:** lo **đúng** (chữ trên ảnh khó đọc) nhưng cách giải **sai** — không phải bỏ ảnh mà là xử lý ảnh đúng cách. Cắt tính năng vì sợ khó là đúng thứ T bị cấm. Sai lần hai trong cùng lượt: T dặn *"làm mờ mạnh nền"*, trong khi nền trong **mọi** ảnh tham chiếu đều **SẮC NÉT hoàn toàn**.

**Bản dùng, đầy đủ:**
- Thứ làm chữ đọc được **không phải bôi mờ ảnh** mà là **tấm kính đủ đặc** ở vùng có nội dung. Nền để **nét** — nó là phần đẹp.
- Chữ đứng trên **kính**, không đứng thẳng trên ảnh ⇒ tương phản thành **hằng số không phụ thuộc ảnh**.
- **Thẻ kính KHÔNG phủ kín màn** — chừa lề cho nền thở. Phủ kín thì ảnh nền thành vô nghĩa.
- Kính **rất trong** chỉ dùng chỗ **ít chữ** (thanh công cụ, thanh trạng thái); **không** dùng cho thẻ số liệu.
- **Nấc giảm chói** bắt buộc (NT-16) + cho **tắt hẳn** về màu trơn, **nhớ lựa chọn**.
- ⭐ **Cách thứ ba — lớp phủ chuyển sắc cục bộ:** chỉ dìm **dải có chữ** (vệt tối từ đỉnh xuống cho tiêu đề, từ đáy lên cho dãy số), **khoảng giữa ảnh sống trọn**. ⇒ *"card hai độ trong"* phải hiểu lại: **không** phải hai lớp vật liệu, mà là lớp phủ mạnh ở dải có chữ, **nhạt dần về không** ở vùng ảnh.
- 📏 **Điểm nghiệm thu đo được:** đo tương phản **TẠI CHÂN CHỮ**, **không** đo trung bình cả card.
- ⚠️ Ảnh tham chiếu là **điện thoại ít nội dung**; Home IF là **dashboard dày số liệu** ⇒ không bê nguyên. Bố cục Home phải **cố ý chừa khoảng** — vừa là chuyện đẹp vừa là chuyện đọc được.
- ✅ **Không dựng hệ kính mới** [Đ2]: `mat-panel` + `backdrop-filter` đã dùng thật, đã trả giá qua 4 vòng sửa (K1–K4). Màn khoá đã có nền ảnh + Ken Burns. **Việc là DÙNG LẠI.**

---

### A3 · Màu nhấn thứ hai — **4 lượt**, hai đề xuất của T bị loại

| Lượt | Nội dung | Trạng thái |
|---|---|---|
| ① | T đề xuất **xanh rêu** `#3f6b5a` | ⛔ **HOÀ LOẠI** — 157°, chỉ cách `--success` 145° đúng **12°** ⇒ ăn mất nghĩa "đạt", nút duyệt ↔ huỷ dễ nhầm |
| ② | cặp **tím ↔ vàng đồng** đảo vai theo theme sáng/tối | ⛔ **HẾT HIỆU LỰC** ở phần vàng đồng |
| ③ | **BỎ HẲN vàng đồng** khỏi vai màu nhấn — *"tone vàng mà thêm xám vào là thảm hoạ"* | ✅ **BẢN DÙNG** |
| ④ | T đọc chữ "1" của Hoà thành *"chốt hướng ① mòng két"* | 🔴 **T ĐỌC SAI — Hoà đính chính cuối ngày** |
| ⑤ | **DỰNG CẢ HAI ĐỂ SO BẰNG MẮT**: mòng két ~180–190° ↔ mận trầm ~330–340° | ✅ **BẢN DÙNG** — chưa có màu nào được chốt |

🔴 **T sai lần thứ hai trong ngày, cùng một kiểu:** suy diễn ý định của Hoà từ một ký tự rồi ghi vào sổ như đã chốt. **Hoà nói ngắn không có nghĩa là Hoà đã chốt.** Hai thứ vẫn đứng vững vì Hoà nói thành câu rõ ràng: **bỏ hẳn vàng đồng** và **loại xanh rêu**. Mòng két nay là **ứng viên**, không phải bản dùng — bàn thử ở phiếu P-J.

**Vì sao bỏ đồng — đúng về mặt màu:** màu ấm bão hoà thấp đặt trên nền **xám** thì ra **xỉn/ố**, không ra trầm. `--accent-warm` chỉ sống được trên nền **kem ấm** — mà nền kem ấm chính là thứ vừa bị loại vì *"sến"*. Giữ đồng trong khi làm theme sáng trung tính là **mâu thuẫn tự thân**.

**✅ Một vấn đề tự tan theo:** đồng ở **33°** chỉ cách `--warning` **37°** đúng **4°** — ca đụng nghĩa còn gần hơn cả ca rêu vừa loại. Bỏ đồng là bỏ luôn ca này. ⇒ **Kiểm "nút đồng cạnh cảnh báo vàng" HUỶ**, thay bằng kiểm màu-mới cạnh **cả ba** màu nghĩa.

**Ràng buộc chọn màu thay (vẫn còn hiệu lực cho mọi đề xuất về sau):**
ngoài vùng cấm quanh **cả ba màu nghĩa** (đỏ sai/huỷ · vàng cần-xem-lại · xanh đạt), mỗi bên **±20°** · cách tím `--accent` tối thiểu **60°** · **phải SẠCH trên nền xám** (đây đúng chỗ vàng chết) · không sến, không bão hoà cao.

> 🔴 **ĐÍNH CHÍNH 16/08 — BỘ SỐ GÓC MÀU CŨ Ở DÒNG NÀY LÀ BỘ PHA, ĐỪNG TRÍCH LẠI.**
> Bản đầu ghi *"đỏ ~25° · vàng ~37° · xanh ~145° · tím 262°"*. P-J đo thật: vàng **37,3°** và xanh
> **145,3°** khớp **HSL**, nhưng **đỏ HSL là 9,6°** và **tím HSL là 247,2°** — hai số đó không khớp
> không gian nào. Tức bộ số cũ **trộn hai hệ toạ độ**, T ghi theo trí nhớ. Đúng thứ luật
> *"đọc ra, cấm gõ số nhớ"* sinh ra để chặn — và lại chính T vi phạm.
>
> ⇒ **Từ nay không ai được trích số góc màu từ sổ.** Nguồn duy nhất là **đọc sống từ
> `app/globals.css`** lúc chạy (bàn thử đã làm đúng thế qua `getComputedStyle`).
>
> ⚖️ **T CHỐT KHÔNG GIAN MÀU CHUẨN = OKLCH** (quyền kỹ thuật Hoà uỷ). Đây **không phải quyết định
> mới** — entry `he-mau-2-lop` đã khai *"thang tông 8 nấc sinh từ màu gốc (OKLCH, giữ độ sáng đều
> khi đổi góc màu)"*; nay chỉ **nói rõ ra** vì P-J chứng minh nó **đổi kết quả thật**: ở biên trên
> dải mòng két (190°), **OKLCH cho 67,6° = đạt** còn **HSL cho 57,2° = trượt** ngưỡng 60°.
> **Lý do chọn OKLCH:** ngưỡng *"cách nhau ≥60°"* tồn tại để **mắt phân biệt được**; HSL chia góc
> theo toán chứ không theo mắt (cùng một bước góc, chỗ thì đổi rõ, chỗ thì gần như không thấy),
> nên đo bằng HSL là đo sai đơn vị của chính câu hỏi mình đang hỏi. HSL chỉ giữ vai **đối chiếu**.

**Phổ còn trống — lý do cả ngành dùng lam hoặc tím:** ba vùng đã bị màu nghĩa chiếm; còn trống **lam → mòng két → tím/mận**. Đó gần như là vùng **duy nhất** không mang nghĩa sẵn — và cũng là lý do tím của IF thấy *"quen tay/AI"*: ai cũng bị dồn về một góc phổ.

**Kéo theo, chưa làm:** nút *"Vào xưởng"* ở màn khoá đang màu đồng → đổi theo · **12 tệp** đang dùng `--accent-warm` phải rà lại khi thi công.

---

### A4 · Nền sáng — **1 lượt, nhưng đè cả 3 phương án A/B/C đang treo**

**Bản dùng:** canh theo **Apple**, bỏ ba bản A/B/C, làm **một** bản.

⚠️ Apple **cố ý không công bố hex** (màu của họ thích ứng theo chế độ + độ tương phản). Con số dưới là **đo được từ hệ thống** — phải khai đúng như vậy, đừng ghi như thể Apple công bố.

⭐ **Con số giải thích chữ "sến" — bằng chứng đắt nhất của cả đợt màu:**

| | R | G | B | ngả về |
|---|---|---|---|---|
| Apple `#F2F2F7` | 242 | 242 | **247** | **lam nhẹ** |
| IF hiện tại `#f2efe9` | 242 | 239 | **233** | **vàng** |

**Cùng độ sáng, ngược hướng sắc.** Chênh đúng **14 điểm ở kênh lam** — và 14 điểm đó là toàn bộ khoảng cách giữa *"sạch"* và *"rẻ tiền"*. ⇒ Lời chê của Hoà nay **đo được**, không còn là cảm giác.

**Mượn thêm một cách làm của Apple:** nền chính là **TRẮNG THUẦN**; xám nhạt chỉ dùng cho **nền NHÓM** — xám để *lùi ra sau*, nội dung đứng trên trắng. Ngược với IF đang lấy kem làm nền chính.

---

### A5 · Card thu gọn ↔ sổ ra — **3 lượt**

| Lượt | Nội dung | Trạng thái |
|---|---|---|
| ① | bản vẽ dựng **172px ↔ 268px** (kéo giãn chiều cao) | ⛔ **HOÀ CHÊ ĐÚNG** — kéo giãn thì mới là cùng-một-thứ-to-nhỏ-khác-nhau |
| ② | **hai NGÔN NGỮ trình bày**, không phải hai chiều cao | ✅ **BẢN DÙNG** |
| ③ | nâng từ 2 trạng thái lên **BA NẤC**, và ba nấc là **nhịp chung toàn app** | ✅ **BẢN DÙNG** |

**Bản dùng, đầy đủ:**
- **mặc định** = nói bằng **ký hiệu** (icon + số), lướt 1 giây nắm tổng quát
- **vừa** = tiêu đề + một hai dòng chữ, khi dừng lại muốn biết thêm
- **full** = đoạn văn đầy đủ, đọc kỹ
- ⭐ **Điểm tinh tế nhất: khi sổ ra thì ICON BIẾN MẤT** — không phải icon ở lại rồi thêm chữ bên cạnh. Có chữ rồi thì icon thành thừa; giữ lại là **nói cùng một điều hai lần**. Luật này áp **từ nấc VỪA trở đi**.
- **Ba ràng buộc:** ① thu gọn là **nén CÁCH NÓI**, không phải **cắt NỘI DUNG** — thứ chỉ hiện lúc sổ ra phải khai rõ là thông tin phụ ② chuyển liền mạch: icon mờ dần và chữ hiện lên **cùng vị trí** (thấy *nó nở ra*, không phải *nó đổi thành cái khác*) ③ thu gọn = vừa đủ để quyết định **có cần mở hay không**.
- 🔴 **Ràng buộc quan trọng nhất:** nấc mặc định phải **GỌN và TƯƠM TẤT**, **đủ tự thân** — KHÔNG được là bản cắt xén chờ mở ra mới thành hình. **Cửa nghiệm thu:** che hai nấc kia đi, nấc mặc định vẫn phải đứng được một mình.
- **Phần khó là bảng cốt-lõi ↔ để-dành** (mục nào ở thu gọn thành icon gì, ở sổ ra thành câu chữ nào) — **không phải** phần chiều cao hay hiệu ứng.

⭐ **Ba nấc = nhịp của toàn app**, không phải ba giải pháp riêng lẻ: **sidebar** 3 nấc (28/240/320) · **kiến trúc tool** 3 lớp (thanh chung / gói lệnh / master node) · **card** 3 nấc. Mọi thứ thu/xổ được đều theo nhịp này, **không đẻ nhịp thứ hai**.

✅ **Card ba nấc ĐÃ LÀM XONG** ở lượt trước (mặc định→vừa→full, bảng dịch ba cột, chấm chỉ nấc, aria-label, cửa nghiệm thu "tươm tất"). T từng ghi nhầm nó vào danh sách nợ — **phiên sau đừng dựng lại**, đó đúng tội N8.

---

### A6 · Ba tầng ánh sáng — **2 lượt**, T mô tả sai tầng ②

| Lượt | Nội dung | Trạng thái |
|---|---|---|
| ① | T mô tả tầng ② là *"gradient nổi trên BỀ MẶT"* | ⛔ **HOÀ CHỈ ĐÍCH DANH LÀ SAI** |
| ② | tầng ② là **quầng sáng lan quanh VIỀN**, mềm và ấm, **mặt card KHÔNG đổi** | ✅ **BẢN DÙNG** |

**Bản dùng:**

| Tầng | Khi nào | **NGHĨA** | Hình thức |
|---|---|---|---|
| ① kính nhận sáng | luôn luôn | **CHẤT LIỆU** — vật liệu thật, có chiều sâu | mép trên bắt sáng · bề mặt đổi theo thứ nằm dưới |
| ② viền sáng **ĐỨNG YÊN** | rê chuột vào | **KHẢ NĂNG** — cái này bấm được | quầng sáng lan quanh viền, buông ra về như cũ |
| ③ viền **CHẠY** vòng | đang render | **TRẠNG THÁI** — đang chạy | ánh sáng chạy liên tục quanh viền |

🔴 **Ba tầng không được lẫn nhau — đây là ĐIỂM NGHIỆM THU, không phải trang trí.** Bản vẽ phải dựng cả ba cạnh nhau, nhìn phát phân biệt được.

⚠️ **Xung đột lộ ra và cách giải:** ② và ③ **cùng ở viền** ⇒ phân biệt bằng **CHUYỂN ĐỘNG**, không bằng chỗ đứng (mắt phân biệt chuyển động nhanh hơn phân biệt màu).

**① là phần MỚI:** *"nhận ánh sáng và bị ảnh hưởng"* = kính **không** phải lớp mờ tĩnh — phải **đổi theo thứ nằm dưới** (đúng việc `backdrop-filter` làm, không phải phủ màu cố định) + **bắt sáng ở mép**. Đây là khác biệt giữa *kính thật* và *ô mờ mờ*. Vẫn giữ **kính chỉ ở lớp VỎ** — làm kính thật hơn ≠ dùng kính nhiều hơn.

✅ **② và ③ là NỢ CŨ từ 12/08**, không phải ý mới: entry `hover-gradient-kem` và `card-kinh-gradient`. Hoà nhất quán suốt 4 ngày.
🔴 **Đính chính:** entry hover ghi *"gradient KEM ấm"* — **kem/vàng đã bị bỏ** (A3) ⇒ gradient hover đổi sang **màu nhấn mới (mòng két)**.

📌 **Chỗ này đã kín, ghi để phiên sau biết:** trong ảnh tham chiếu, quầng sáng viền thực ra là **NGƯỜI KHÁC đang ở node** (có nhãn tên + con trỏ màu). Khi IF làm cộng tác thật thì **presence cần KÊNH THỨ BA**, không được lấy lại viền sáng.

`prefers-reduced-motion`: tầng ③ là thứ **đầu tiên phải tắt**, thay bằng dấu hiệu tĩnh.

---

## B · CHỐT MỘT LƯỢT — không đè ai, chép gọn để khỏi mở lại `00-CHOT`

| # | Chốt | Câu cốt lõi |
|---|---|---|
| B1 | **Nguyên tắc dùng kính** | Kính chỉ ở **lớp VỎ** (khung ngoài · thanh công cụ · panel nổi · sidebar), **ruột ĐẶC** · **một tầng kính, không hai** · kính xuất hiện **khi nó ĐÈ LÊN cái khác**; không đè lên gì thì cứ đặc. ⭐ IF đã có luật này từ **01/08** (*"kính là VỎ không là RUỘT"*) + **K4 02/08** (*panel kính nổi PHẢI portal, không lồng trong chrome kính*) — tự đi tới cùng kết luận với Apple bằng đường đau thương; luật nằm trong sổ mà bản vẽ quên thi hành. |
| B2 | **Bỏ đường kẻ chia card** | Tách vùng bằng **chuyển sắc**, không bằng đường kẻ. ⚠️ Ranh giới: cấm đường kẻ **NGANG** chia card thành khối; **không cấm** vạch **dọc** mảnh phân tách các con số cùng hàng. |
| B3 | **Card sổ ra khi bấm** | Mặc định chỉ hiện phần cốt lõi. **Không nhồi hết vào card** — đây cũng là lời giải cho *"thừa trống + widget bị giãn"*: card gọn thì lưới chặt theo. |
| B4 | **Thanh tiến trình** | **Mọi việc đang chạy đều phải có thanh.** Hình thức: **dãy vạch nhỏ liên tiếp** (không phải khối đặc), phần đã chạy sáng, **điểm sáng ở đầu mút**, phần chưa chạy xám mờ. 🔴 **HAI LOẠI, cấm bịa %**: đo được → số thật + % + thời gian còn lại · **không đo được → dạng KHÁC HẲN, chạy vô hạn, KHÔNG có số**. **Phân vai:** viền chạy = *"card này đang chạy"* nhìn **từ xa** · thanh = *"còn bao lâu"* nhìn **gần**. Một card có cả hai, không đánh nhau. |
| B5 | **Ưu tiên ký hiệu hơn chữ** | Hoà chê **chữ NHỎ và NHIỀU**, không phải chê nhãn. Ranh giới: *đừng dùng ĐOẠN CHỮ để giải thích thứ mà MỘT KÝ HIỆU nói được.* Ký hiệu thắng ở chỗ **lướt qua** (card nấc gọn · thanh công cụ · trạng thái) · chữ giữ nguyên ở chỗ **dừng lại đọc** (ô giải nghĩa · nấc full · thông báo lỗi · trích điều khoản). **Nhãn 1-2 từ VẪN GIỮ.** ⛔ Không nới luật cứng: hình/màu **không được là kênh duy nhất**. |
| B6 | **Ô giải nghĩa có HÌNH** | Trục phải vào bộ nền. Ô hiện **bên cạnh**, không che mục đang trỏ, gồm **tiêu đề → HÌNH MINH HOẠ THAO TÁC → câu mô tả**. ⭐ Nó là **chỗ lý do của lệnh mờ sống** (luật *"lệnh chưa đủ điều kiện hiện mờ kèm lý do"* trước nay không có chỗ đặt lý do). Tab Cơ bản/Nâng cao = nhịp hai tầng, **cùng một sổ lệnh**. [Đ2] mở rộng `components/ui/Tooltip.tsx`, cấm cơ chế thứ hai. |
| B7 | **Dropdown có ô tìm + gõ-tiếp** | Dropdown dài **phải có ô tìm**, không bắt cuộn. Kèm gõ-tiếp (gõ vài chữ, phần còn lại hiện mờ, Enter là xong). ⚠️ IF **CHƯA CÓ** — chốt 03/08 đã đo *"thiếu hẳn từ vựng chuột+bàn phím… type-ahead"*, grep = 0. |
| B8 | **Phím tắt hiện trong menu** | Dạy phím tắt **tại chỗ dùng**. ⭐ Menu = **mặt tiền thứ tư** của sổ lệnh chung (cùng tooltip · ⌘K · bảng ⌘/) — **đọc chung một nguồn**, cấm gõ tay phím tắt vào menu. Mục đang chọn có **chấm tròn** (hình dạng, không chỉ màu). |
| B9 | **Kéo thả module** | Nội dung là module kéo thả được, không phải bố cục chết. Cùng **một** cơ chế cho Home bento · card ba nấc · Present editor — đừng đẻ ba kiểu. ⭐ **Ô trống nét đứt** là chi tiết **mang tin** (trả lời *"thả ra thì nó nằm đâu"*), không phải hiệu ứng. 🔴 **Phải làm được bằng bàn phím** (chọn → mũi tên dời → Enter thả) — nối lỗ ❌ a11y đang mở. |
| B10 | **Ba cỡ widget định sẵn** | 1×1 · 2×1 · 2×2, **không kéo giãn tự do** (Apple cũng vậy). ⭐ **Lý do THẬT, mạnh hơn lý do thẩm mỹ:** widget khai theo **Ô LƯỚI** chứ không theo pixel ⇒ lưới hẹp lại trên điện thoại thì chúng **tự xếp lại**. Tức ba-cỡ-định-sẵn là **ĐIỀU KIỆN** để widget chạy trên cả ba nền tảng — **đừng nới ra vì tưởng chỉ là chuyện gu.** Người chọn **widget nào · đặt đâu · cỡ nào · ẩn cái gì**; **máy giữ** lưới bento · khoảng thở · bo góc · nhịp. |
| B11 | **Dashboard dùng chung xuyên nền tảng** | Home + bộ widget là **tài sản dùng chung** cho desktop · tablet · di động. Không dựng bản riêng. Ghép với luật CẤP 0 (**touch là LỚP thao tác, không phải bản riêng**, 11/08) + **5 token mật độ** đổi theo con trỏ (03/08, đã nằm `globals.css:105`). |
| B12 | **"Simple nhưng có chi tiết thú vị"** | Tổng thể cực gọn, chi tiết thì sống. ⭐⭐ **Điểm chung của mọi chi tiết đáng giữ: chúng MANG THÔNG TIN, không phải hoa văn** — thú vị vì *nói được điều gì đó*, không vì đẹp. ⇒ Dùng làm **thước chấm chữ ký thị giác**: chữ ký nào không mang tin thì **loại, dù đẹp**. Mở rộng luật *màu luôn mang nghĩa* + LightState thành: **mọi chi tiết thị giác đều phải mang tin.** |
| B13 | **Hệ màu 3 lớp + biên độ tự do** | ① **màu của IF** (logo · màn khoá · bộ cài) = **khoá cứng** ② **màu vỏ làm việc** = KTS tự chọn **trong biên** ③ **màu của dự án** (Brand Kit) = **tự do**. Cơ chế: **người chọn HƯỚNG, máy giữ HỆ** — chọn màu, máy tự sinh cả thang tông ⇒ **không có cách nào chọn ra app đọc không nổi**. **Khoá không cho đụng:** màu nền/chữ · **màu mang nghĩa nghề** · thang bo · luật ánh-sáng-chỉ-mang-trạng-thái. ⚠️ Lý do khoá màu-nghĩa: đổi đỏ thành hồng nhạt cho dịu mắt thì cảnh báo *"hành lang thiếu 150 mm"* mất hết trọng lượng — **hỏng NGHỀ, không phải hỏng thẩm mỹ.** |
| B14 | **Vùng cấm nhìn thấy được** | Núm màu hiện **ba dải cấm gạch chéo** (±20° quanh góc màu **thật** của từng màu nghĩa, đọc từ `globals.css`, **không gõ số cứng**); kéo vào là máy chặn kèm lý do tiếng người; dưới núm hiện **số** khoảng cách tới màu nghĩa gần nhất. ⇒ Biến *"tự do trong phạm vi cho phép"* từ khái niệm thành **thao tác**, và phạm vi đó **nhìn thấy được** thay vì nằm trong đầu T. |
| B15 | **Bảng việc / timeline** | **6 tab trên cùng một dự án** (Overview · Boards · List · Timeline · Activities · Files) = **đúng luật một-nguồn-nhiều-mặt-tiền**, nay có hình đối chiếu. 🆕 **Tay nắm ở mép thanh việc** — kéo thả không chỉ **dời chỗ** mà còn **đổi khoảng thời gian**. **Đường dọc "hôm nay"** lặp lần thứ hai trong ngày ⇒ xác nhận là chi tiết mang tin. ⚠️ **Chấm màu định danh dự án** = màu của **DỰ ÁN do người dùng đặt** (lớp ③ Brand Kit), **không phải** màu hệ thống lớp ② ⇒ không đụng phát hiện *phổ chỉ còn hai cửa sạch*. Khai ranh giới này **một lần** trong bộ nền, kẻo mỗi lần thêm màu lại cãi từ đầu. |
| B16 | **Chấm màu / biểu tượng tệp nhiều màu** | Ca thật đầu tiên thử vào luật *màu luôn mang nghĩa*: bộ biểu tượng tệp mỗi loại một màu **tiêu hết hai cửa hue sạch**. Ba đường, bản vẽ nêu 2-3 cách **không chọn hộ Hoà**: ① phân loại bằng **chữ + hình dạng** (đuôi tệp in trên biểu tượng), màu một dải ② cho nhiều màu **chỉ trong vùng biểu tượng tệp**, khai là **ngoại lệ có phạm vi** — biểu tượng tệp là **NỘI DUNG**, không phải phần tử giao diện ③ hướng khác. |
| B17 | **Cửa duyệt mắt qua Drive** | Hai chiều: `Drive/IF-duyet-mat/01-anh/` (T ghi) ↔ `02-note-cua-Hoa/` (Hoà ghi). Hoà xem trên app Drive điện thoại, **chụp màn + vẽ tay Markup** rồi bỏ vào thư mục note. 🔴 **Đính chính giả định:** Drive → Google Photos **không còn tự đồng bộ** (Google cắt 7/2019) ⇒ dùng app Drive, **bỏ hướng Photos**. Tên ảnh phải **tự nói** (`2D-02-truc-phai-lop.png`) vì Hoà xem một mình. Ước **70–110 khung** khi tính cả mode + panel. |
| B18 | **Bảng tổng các phiên** | MỘT bảng, xếp cố định: **🟡 ĐỀ XUẤT (chờ Hoà gật) luôn trên cùng, tô nổi** → 🔵 đang chạy → ✅ xong-máy → 👁 xong-mắt. ⛔ **Không đẻ sổ thứ hai** — `ship:map` đã sinh bảng từ `frontier-registry`; thêm nhãn `phien` cho entry = **mặt tiền mới trên cỗ máy cũ**. |
| B19 | **Vai T đổi + phiên phụ phải có mặt** | T = phiên **CHÍNH** (nghiên cứu · trao đổi · kiểm chứng · **điều phối phiên phụ**), T **thôi ôm việc build**. ⛔ **Không phiên phụ nào được không có mặt** — cấm phiên *"chỉ lõi, mặt tính sau"*, đó đúng là cơ chế đẻ ra 68 việc xong-máy đối 1 việc qua mắt. |
| B20 | **Context engineering** | Đối chiếu bài gốc Anthropic: IF **đã đi đúng cả 4 kỹ thuật** (compaction ↔ `memory/LATEST.md` · note-taking ngoài context ↔ `bao-cao-phien/` + registry · just-in-time retrieval ↔ luật bản nén *chỉ tên + đường dẫn + một câu* · sub-agent context sạch ↔ mô hình T) ⇒ **không thêm tầng quy trình mới**, chỉ vá đúng lỗ ca thật chỉ ra. |
| B21 | **Bốn kiểu vòng lặp** | IF dùng 1/4 (turn-based). ⭐ Câu đắt nhất: **"a judge closes the loop"**. IF **giàu trọng tài máy nhất** (5 máy soi + tsc + test + `lib/review` + LUẬT chuẩn đầu ra + agent V) **nhưng cả 10 đứng NGOÀI vòng** — agent tự khai, T soi sau, vòng đóng bằng **tay T**. ⇒ Chuyển phiếu sang **đích + trần vòng** thì vòng **tự đóng**, T chỉ soi cái đã sạch. |

---

## C · BA ĐÍNH CHÍNH GIỮA NGÀY — dễ đọc nhầm nhất

| # | T/sổ từng ghi | Sự thật | Vì sao đáng ghi |
|---|---|---|---|
| C1 | hằng số nhấn giữ ở `components/print/RadialToolMenu.tsx` | **`components/ui/Tooltip.tsx:33,37`**, tên `TOOLTIP_LONG_PRESS_MS` ⇒ IF **chưa có** chuẩn nhấn-giữ chung | T grep ra con số rồi **suy địa chỉ theo trí nhớ** thay vì đọc kết quả grep. **Luật: đã grep thì đọc đường dẫn trong kết quả, đừng nhớ hộ máy.** |
| C2 | *"giao diện phải tạo qua MCP Claude Design"* — hiểu là **phiên phụ** tự đẩy | **Phiên phụ KHÔNG có `DesignSync`** (P-A và P-B độc lập báo *"No matching deferred tools found"*; phiên phụ cũng không chạy được OAuth vì không tương tác) ⇒ **phiên phụ dựng mock trong `docs/mocks/`, T đẩy khi audit** | Luật giữ nguyên tinh thần, **đổi người bấm nút**. Ô ⑤ khuôn phiếu sửa theo. |
| C3 | *"card ba nấc"* nằm trong danh sách nợ | **Đã xong ở lượt trước** | Brief theo danh sách cũ là bắt dựng lại thứ đã có — **đúng tội N8**. |

---

## D · SÁU NỢ BÀN GIAO — thứ tự đúng (đã trừ C3)

| # | Nợ | Trạng thái 16/08 |
|---|---|---|
| 1 | **Ô giải nghĩa + trục phải** — hình minh hoạ là phần chính, không phải chữ | phiếu **P-G** đang chạy |
| 2 | **Thanh tiến trình** — hai loại, cấm bịa % | phiếu **P-H** đang chạy |
| 3 | **Nguyên tắc `simpleCoChiTiet`** — dùng làm thước chấm lại 3 phương án chữ ký | chưa mở |
| 4 | **Trim màu về riêng mòng két** | chưa mở — chờ A3④ xác nhận |
| 5 | **Mục biểu tượng tệp** — 2-3 cách xử màu (B16) | chưa mở |
| 6 | ~~Chép phần card ba nấc vào báo cáo~~ | ✅ đã xong (C3) |

🔴 **Cạm bẫy đã xác minh, kèm nợ #1:** `components/ui/ToolbarChip.tsx:137` `if (disabled) return button;` — **đúng ca cần ô giải nghĩa nhất lại là ca duy nhất đi vòng qua Tooltip**, lý do nhét vào `title` (mà `title` không hiện trên cảm ứng, trình đọc màn hình đọc không nhất quán).

---

*Lập 16/08. Chốt 16/08 nào bị đè về sau: sửa file này TRƯỚC, rồi mới ghi tiếp `00-CHOT.md`.*
