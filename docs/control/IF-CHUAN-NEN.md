# IF · CHUẨN NỀN — thứ máy đo được, để không phải chờ mắt Hoà

> **Hoà chốt 30/08/2026**, và đây là câu đổi cách làm việc:
>
> *"Mọi thứ bây giờ kể cả thẩm mỹ, khi nói đến đều phải lấy ngôn ngữ hình học, bố cục, tỉ lệ tiêu
> chuẩn được nghiên cứu kỹ càng, màu sắc ảnh hưởng thị giác, luật thị giác mà ra mà? Đi nghiên cứu
> cốt lõi nền tảng của ngành về, xác lập quy định và tiêu chuẩn nền cho IF đi, rồi nó tự đo lường
> trên đó. Mọi thứ khác từ thị giác của tôi chỉ làm IF trở nên khác biệt thôi — vì chuẩn là những
> thứ đã được nghiên cứu và ứng dụng rồi, thậm chí đối thủ đang ứng dụng và làm tốt hơn chúng ta.
> Vậy không có lý do gì trông chờ vào tôi cả."*

## 000 · BA TẦNG CHUẨN — Hoà chốt 30/08, và đây là khung của mọi thứ dưới

> *"Ngoài những nguyên lý thị giác bao gồm các **hằng số cơ bản**, thì thiết kế sinh ra để phục vụ
> con người — mà để phục vụ con người thì phải **hiểu họ qua cách họ / cộng đồng / quốc gia phát
> triển**, để **ánh xạ ra thang đo phản ánh**. Nên đội build, IF, và **Vitals** đều phải được trang
> bị đầy đủ kiến thức như thế."*

```
①  HẰNG SỐ           đúng ở mọi nơi, mọi người, mọi thời
                     fovea ~2° · tương phản WCAG · vật lý ánh sáng · số học
                     ⇒ máy chấm, không hỏi ai

②  THANG BỐI CẢNH    ánh xạ từ CÁCH một người / cộng đồng / quốc gia PHÁT TRIỂN
                     nhân trắc theo dân số · chuẩn thiết bị theo thị trường · quy ước nghề
                     theo vùng · thói quen ở theo khí hậu và lịch sử
                     ⇒ máy chấm ĐƯỢC, nhưng phải nạp đúng bối cảnh trước

③  GU                cá nhân — thứ làm KHÁC BIỆT, học SAU CÙNG
```

**Tầng ② là tầng đội build hay bỏ sót nhất**, và nó chính là chỗ hôm nay vừa trả giá: kết luận
*"Neufert sai với người Việt"* chỉ nhìn **một** thang bối cảnh (nhân trắc) mà bỏ **một** thang khác
(chuẩn thiết bị 900). Hai thang cùng thuộc tầng ②, kéo ngược nhau, **không thang nào sai**.

### Hệ quả — ba nơi phải mang tầng ②, không chỉ một

| nơi | phải mang gì |
|---|---|
| **đội build** | biết trục nào thuộc hằng số, trục nào thuộc bối cảnh — để không tuyên "sai" khi chỉ thấy một trục |
| **IF** | tham số bối cảnh phải là **đầu vào có tên** (`percentile dân số dự án` · thị trường thiết bị · vùng quy định), không phải hằng số ẩn trong mã |
| **Vitals** | tư vấn cạnh việc **phải biết bối cảnh dự án đang mở**. Vitals chỉ dựa vào hằng số thì nó khuyên đúng sách mà sai người — đúng lỗi Neufert, chỉ khác là nó nói vào tai người dùng |

⚠️ `IF-CANONICAL` §11 đã chốt Vitals *"kế thừa: dự án · workspace · chặng · vùng chọn · đối tượng
· nguồn · hành động"*. **Thiếu BỐI CẢNH.** Đó là nợ có tên, chưa ai dựng.

---

## 00 · CÂU HỎI PHẢI ĐẶT MỌI LẦN ĐÁNH GIÁ — Hoà chốt 30/08

> *"Làm sao biết trong tất cả hình đó, hình nào **đạt chuẩn ngành** + **đúng gu tôi**?
> Từ sau muốn đánh giá gì thì nhớ đặt ra câu hỏi này để đánh giá."*

Áp cho **mọi** tập, không riêng ảnh — mẫu bản vẽ, thư viện, vật liệu, giao diện, tài liệu.
Và nó có **thứ tự cứng**, không được nhảy cóc:

```
①  QUYỀN + NGUỒN     có được dùng không?     ← không qua thì DỪNG, chưa hỏi tới chuẩn
②  CHUẨN NGÀNH       có đạt chuẩn nghề không?   máy đo
③  GU                có đúng gu ai không?       SAU CÙNG, và chỉ để tạo khác biệt
```

⛔ **HỌC CHUẨN TỪ DỮ LIỆU BẨN = CHUẨN SAI CẢ HỌ.** Hoà, 30/08:
> *"Cái thứ đã bẩn, còn mang đi học làm chuẩn thì chuẩn sai cả họ à?"*

**Ca thật, đo cùng ngày** — tập 1.580 ảnh từng được đề xuất làm nền hiệu chuẩn cho máy đọc gu:

```
1.089 / 1.580   mang dấu pinterest        69%
    8 / 1.580   có khai giấy phép        0,5%
    8 / 1.580   có khai nguồn            0,5%
```

Mà **chính đặc tả máy đọc gu đặt Pinterest vào `hard gate → REJECTED`**, và `docs/IMAGE-SOURCES.md`
§2 giải thích vì sao không có "nguồn Pinterest" thật.
⇒ **Tập hiệu chuẩn sẽ bị chính cái máy nó dùng để hiệu chuẩn từ chối.**

Điều làm lỗi này khác một lỗi thường: **nó VÒNG.** Học chuẩn từ dữ liệu bị loại → rồi lấy chuẩn đó
đi phán dữ liệu mới. Sai một lần thành **sai có hệ thống**, và **không cổng nào bắt được vì cổng
cũng học từ đó**. Đây là biến thể tổ chức của `M-59`: phép đo tự soi mình là phép đo rỗng.

**Hệ quả thi hành:** tập 1.580 ảnh **không được dùng làm nền cho bất kỳ chuẩn nào**. Muốn dùng thì
phải qua ① trước — nghĩa là làm sạch quyền và nguồn, không phải chấm điểm đẹp.

---

## 0a · THỨ TỰ — Hoà chốt 30/08, **không được đảo**

```
①  CHUẨN NGÀNH        làm cho xong trước.  Máy đo được, không hỏi ai.
②  ĐIỀU HƠN CHUẨN     IF vượt chuẩn ở đâu (kiến trúc sẵn có + lợi thế đi sau)
③  HỌC GU             SAU CÙNG.  Đây là thứ làm IF KHÁC BIỆT, không phải nền.
```

> *"Xong hết phần chuẩn → cuối cùng chúng ta sẽ học gu."*

**Hệ quả thi hành, có hiệu lực ngay:**
- `GU-PROFILE.md` và **1.580 ảnh hiệu chuẩn** ra khỏi phạm vi giai đoạn này. Chúng **không bị xoá**
  — vẫn đang nuôi prompt dựng ảnh qua `lib/refingest.ts` · `lib/ref-search.ts` · `LibraryPanel` —
  nhưng **không được dùng làm nguồn chuẩn, không được dùng làm mặc định, không hiệu chuẩn lúc này**.
- Đo 30/08: chúng **đã nằm ngoài mặt tiền Gallery** (0/1.580 có tag `nganh:*`, mà `curatedOnly()` đòi có).
- Phần "học gu" trong `IF-DEC-GU-READER-001` §7 ⇒ **HOÃN**, không phải huỷ.

---

## 0 · RANH GIỚI — cái gì máy chấm, cái gì mắt chấm

| | |
|---|---|
| **MÁY CHẤM** — luôn luôn, không ngoại lệ | bảo toàn dữ liệu · tương phản · thang chữ · nhịp dọc · thang bo · số lượng màu nhấn · sàn cỡ chữ · vùng bấm |
| **MẮT CHẤM** — và chỉ chừng này | **cá tính**: gu, mood, thứ làm IF *khác biệt* với đối thủ đã đạt chuẩn |

> ⛔ **SỰ THẬT BẨN** (Hoà đặt tên 30/08): *"sự thật sau nhiều lần sửa vì hiểu sai là sự thật bẩn."*
> Một con số đã bị nói lại, kế thừa, rồi vá nhiều lượt thì **không được dùng tiếp**, kể cả khi lần
> vá cuối có vẻ đúng — vì không ai còn truy được nó đúng nhờ đo hay nhờ may.
> **Cách chữa duy nhất: ĐO LẠI TỪ NGUỒN, không vá thêm lần nữa.**
> Ca thật cùng ngày: con số *"1.580 ảnh tag `gu-đích`"* — 1.580 đúng nhưng nó đến từ **category**,
> tag `gu-đích` chỉ có **43** ảnh. Lane 00 viết sai, lane 05 kế thừa, và nó suýt thành nền cho tập
> hiệu chuẩn 60/20/20. Ai lọc theo tag sẽ nhận 43 ảnh và **vẫn chạy, không báo lỗi**.
>
> ⛔ **Đánh dấu một việc là "duyệt mắt" khi nó đo được là một dạng lười.**
> Đo 30/08: **5/16** đầu việc trong `scripts/bos-so-viec.mjs` đang gắn nhãn duyệt mắt, và **cả 5
> đều sai** — chúng đo được toàn phần hoặc phần lớn. Cái đầu tiên (`đường nạp DXF`) đã chuyển thành
> máy chấm ngay trong ngày: `lib/cad/chuan-nap.ts`, 5 tiêu chí, 54/54 tệp, 609 thực thể đối chiếu.

---

## 1 · TƯƠNG PHẢN — WCAG 2.2, và người kế nhiệm của nó

**Nguồn:** WCAG 2.1/2.2 (W3C) · APCA (Advanced Perceptual Contrast Algorithm).

| | mức | ngưỡng |
|---|---|---|
| chữ thường | AA | **4,5 : 1** |
| chữ lớn (≥18pt hoặc ≥14pt đậm) | AA | **3 : 1** |
| thành phần không phải chữ (viền ô nhập, icon mang nghĩa) | AA | **3 : 1** |
| chữ thường | AAA | **7 : 1** |

**Điều phải biết, không được bỏ:** tỉ lệ WCAG 2.x là **công thức toán thuần**, không phải phép đo
tri giác. Nhiều cặp màu **đạt WCAG mà vẫn khó đọc thật**. APCA sinh ra để vá đúng chỗ đó — nó tính
`Lc` (Lightness Contrast) có kể tới cỡ chữ, độ đậm, và chữ sáng-trên-nền-tối khác chữ tối-trên-nền-sáng.

⚠️ **Trạng thái thật của APCA, tháng 4/2026:** phần tương phản đã bị **rút khỏi bản nháp WCAG 3
từ 7/2023** để đánh giá thêm; bản nháp hiện ghi thuật toán tương phản của WCAG 3 **chưa chốt**.
⇒ IF lấy **WCAG 2.2 AA làm sàn CHẶN**, và ghi `Lc` của APCA làm **số tham khảo**, không chặn.
Chốt một thứ chưa chốt là tự tạo nợ.

*Bối cảnh: báo cáo WebAIM Million 2026 đo được **83,9%** trong một triệu trang chủ hàng đầu vẫn
trượt tương phản WCAG 2. Đạt sàn này không phải thành tích — nó là mức tối thiểu mà phần lớn web
chưa đạt.*

---

## 2 · THANG CHỮ — thang mô-đun, một tỉ lệ duy nhất

**Nguồn:** modular scale — một dãy số sinh ra bằng cách nhân liên tiếp một **tỉ lệ duy nhất** với
cỡ nền. Các tỉ lệ có tên trong nghề: Major second 1,125 · Minor third 1,2 · Major third 1,25 ·
Perfect fourth 1,333 · Golden 1,618.
Điểm cốt lõi: chọn cỡ **từ thang** thì chúng hoà nhau; chọn bằng mắt thì không.

### Đo IF, 30/08 — **KHÔNG ĐẠT**

```
thang chữ   12 · 14 · 16 · 20 · 28
tỉ lệ giữa các nấc   1,167 · 1,143 · 1,25 · 1,400      lệch max–min  0,257
khớp nhất: Minor third / Major third — sai trung bình 0,085  (vẫn lớn)

thang bo    6 · 10 · 14 · 20
tỉ lệ giữa các nấc   1,667 · 1,400 · 1,429             lệch max–min  0,267
khớp nhất: Golden 1,618 — sai trung bình 0,152         (rất lớn)
```

**Phán quyết:** cả hai thang của IF là **số chọn bằng mắt**, không phải thang mô-đun. Một thang
mô-đun đúng nghĩa có **một** tỉ lệ; IF có bốn tỉ lệ khác nhau trong cùng một thang.

⚠️ **Chưa sửa vội.** Đổi thang chữ là đổi diện mạo **mọi màn**, và nó phải đi cùng việc nâng sàn
12px (772/850 vi phạm) — làm rời hai lần là dựng lại giao diện hai lần. Ghi ra đây để nó thôi
là điều không ai biết.

---

## 3 · SÀN CHỮ VIỆT — chặt hơn mọi chuẩn quốc tế

Tiếng Việt chồng **hai tầng dấu** (`ế` `ộ` `ữ`), nên quy tắc viết cho tiếng Anh **gãy**:

| | luật | vì sao | trạng thái |
|---|---|---|---|
| **V-1** | cấm viết HOA chuỗi có dấu | HOA cắt mất dấu ⇒ đọc sai nghĩa | có cổng |
| **V-2** | line-height ≥ **1,5** | dấu tầng trên đụng dòng trên | có cổng |
| **V-3** | letter-spacing ≥ **0** | âm là dấu chồng lên chữ bên cạnh | có cổng |
| **V-6** | cỡ chữ ≥ **12px** | dưới ngưỡng, dấu thành một chấm mờ | có cổng · **772 vi phạm** |

⚠️ Một thang chữ hợp mọi chuẩn quốc tế mà phạm V-6 thì **không dùng được**. Bốn luật này thắng.

---

## 4 · MÀU — **HỆ ĐÃ CHỐT 30/08**: 5 bộ, mỗi bộ là *hình nền + bảng màu* đi liền

🔴 **CHỐT 31/08 (Hoà, 17:24): `--accent` dẫn xuất từ BỘ đang chọn nay là LUẬT, hết trạng thái nợ.**
5 nền mặc định = **5 bộ, mỗi bộ một accent**; ảnh tự chọn → **trích màu qua cổng tương phản AA**,
**fail-closed** về bộ gần nhất. Áp cho **CẢ** accent phần-máy-suy-ra trên canvas Giấy Mực
(xem `IF-GIAY-MUC.md`). Accent hằng số `#6a57f5` **chính thức có án thay thế**.

> Hoà chốt: *"Hệ màu accent tôi đã chốt rồi. Sẽ có các bảng màu gắn với hình nền sẵn có, ứng với
> **5 phong cách và cá tính nghệ thuật đặc trưng**. Ai thích chọn gì thì cài cái đó. Cả hệ, phần
> nào có thể **tinh chỉnh trong range giá trị mà design system cho phép** thì đổi theo, để tạo ra
> combo cá nhân hoá — cảm giác tối ưu cho sở thích người dùng, **nhưng thực chất vẫn rất tuân thủ
> luật chung, không phạm**."*

### Ba điều kiến trúc rút ra — đây không phải một tuỳ chọn, nó đổi cách dựng token

| | |
|---|---|
| **Bộ = hình nền + bảng màu, đi liền** | không phải hai thứ chọn rời. Đúng hình ảnh Hoà đưa trước đó: *Home **mặc** cái áo wallpaper, thay lúc nào cũng được*. |
| **Token nền phải DẪN XUẤT từ bộ đang chọn** | không được cố định cứng. Base tự mang gu thì **mọi wallpaper khoác lên đều bị nhuộm**. |
| **Tự do có RANGE, và range là luật** | người dùng chỉnh được, nhưng chỉ trong khoảng design system cho phép. **Tự do trong khung, không phải tự do khỏi khung.** |

### Hệ quả thi hành

- Câu *"base nên trung tính bao nhiêu"* mà lane 00 để mở 30/08 ⇒ **đã có lời**: base trung tính
  **đủ để không nhuộm** wallpaper; sắc thái đến từ **bộ**, không từ token cứng.
- Accent `#6a57f5` hiện tại **không còn là hằng số** — nó là accent của **một** bộ trong năm.
- 🔴 **SỬA 30/08 — DÒNG CŨ SAI HIỆN TRẠNG.** Nguyên văn: *"Cần dựng, chưa có: ① khai báo 5 bộ
  ② range ③ cổng canh"*. Mục ① **đã có từ 16/08**: `lib/wallpaper/sets.ts` khai đúng năm bộ, sinh
  bằng mã, kèm **240 phép đo** tương phản trong `contrast.test.ts`. Viết "chưa có" về một thứ đã
  chạy 14 ngày là N8 ở dạng đắt nhất — suýt dựng lại từ đầu.
  Thiếu thật là **nửa BẢNG MÀU** của câu "bộ = hình nền + bảng màu đi liền" (`sets.ts` cố ý không
  mang màu nhấn), cộng ② và ③. **Cả ba nay đã dựng** — lane 04, 30/08:
  `lib/wallpaper/mau-bo.ts` + `mau-bo.test.ts` (51 pass, 8 ca đột biến, trên đường `npm test`).
  ⇒ **Lời chứng đầy đủ, ba câu hỏi ①②③ và khoảng trống không che: `docs/control/IF-HE-5-BO-MAU.md`.**
  ⚠️ Còn nợ: `--accent` trong `globals.css` **chưa** dẫn xuất từ bộ đang chọn — xem §4/§5 tệp đó.
- Luật đã có vẫn thắng: hai cổng `soi:trung-tinh` (mặt nền và bóng cùng họ) và WCAG 2.2 AA
  **áp cho MỌI bộ** — một bộ đẹp mà chữ không đọc được vẫn là bộ hỏng.

⚠️ **`GU-PROFILE.md` vẫn KHÔNG phải nguồn ở đây.** Nó là **DNA số 1**, có thể trở thành **một
trong năm bộ**, không phải cái khuôn của cả năm.

---

## 5 · BỐN MẢNG TỪNG TRỐNG — ĐÃ LẤP 05/09, và phần nào CHƯA lấp

🔴 **MỤC NÀY ĐÃ VIẾT LẠI 05/09.** Bản cũ khai bốn mảng *"chưa có nguồn và ngưỡng, nên chưa được
dựng cổng"*, kèm bốn lệnh kiểm đều ra **0**. Nay chuẩn + ngưỡng + nguồn nằm ở
**`docs/control/IF-CHUAN-BO-CUC.md`**. Để nguyên dòng "chưa có" khi thứ đó đã có là đúng cơ chế
đẻ ra tội **N8** — mục này từng bị dính một lần rồi (§4, ca `lib/wallpaper/sets.ts`).

| mảng | trạng thái | kiểm bằng |
|---|---|---|
| **Bố cục** — lưới · thứ bậc thị giác | 🟢 **CÓ CỔNG** (nhịp lưới 4px + độ dài dòng) · ⛔ **thứ bậc thị giác vẫn thuộc MẮT** (N-16) | `node -e "const s=require('./package.json').scripts; console.log(Object.keys(s).filter(k=>/bo-cuc\|luoi/.test(k)).length)"` → **2** · `npm run soi:bo-cuc` |
| **Gestalt** — gần nhau · vùng chung | 🟡 **CÓ NGƯỠNG + ĐO SỐNG, chưa bánh cóc** (mẫu còn nhỏ: 2–4 nhóm/màn đủ điều kiện) | `PORT=<cổng> node scripts/soi-mat/do-chuan-bo-cuc.mjs` → `nhomTiDuoi1` |
| **Vùng bấm** | 🟡 **CÓ NGƯỠNG + ĐO SỐNG, chưa bánh cóc** — kích thước đích không đọc được tĩnh | cùng lệnh trên → `duoi24` · `duoi24ThieuKhoangCach` |
| **Chuyển động** — giá trị token có đúng nghiên cứu không | ✅ **ĐẠT 5/5** — 130·170·220·300·460ms đều < 1s (NN/g) và trong dải Material 3 | `node -e "const s=require('fs').readFileSync('lib/ui/nhip.ts','utf8'); console.log([...s.matchAll(/^\s*(bam\|vien\|bang\|nguCanh\|bienHinh):\s*(\d+)/gm)].filter(m=>+m[2]<50\|\|+m[2]>=1000).length)"` → **0** |

**Đo hiện trạng 05/09 — con số đau nhất:** `npm run soi:bo-cuc` ra **2786 / 5072 (55%)** khoảng
cách gõ cứng nằm ngoài lưới 4px. Nguồn lớn nhất **không phải** ai đó chọn số xấu, mà là **thang
phụ của Tailwind** (`gap-1.5`=6px · `px-2.5`=10px…) lệch thang của IF: **791/2786**.

⚠️ **Ba chỗ vẫn CHƯA có chuẩn, khai thẳng** (chi tiết `IF-CHUAN-BO-CUC` §1.3 · §1.5):
**thứ bậc thị giác** (N-16 — mắt người) · **tỉ lệ gói hộp** (đo được, **không có ngưỡng công bố**)
· **ô mồ côi cuối lưới** và **hộp rỗng do ép chiều cao** (thấy bằng mắt trên app thật, chưa có nguồn).

---

## 6 · NGUỒN

- WCAG 2.1/2.2 — W3C · APCA — [git.apcacontrast.com](https://git.apcacontrast.com/documentation/WhyAPCA.html)
- [The Easy Intro to APCA](https://git.apcacontrast.com/documentation/APCAeasyIntro.html)
- [APCA Contrast vs WCAG 2 — 2026](https://66colorful.com/blog/apca-contrast/)
- [Vertical Rhythm & Modular Scale — Bounteous](https://www.bounteous.com/insights/2018/03/26/what-font-are-vertical-rhythm-and-modular-scale/)
- [Typography design systems — UX Collective](https://uxdesign.cc/a-better-way-to-create-typography-design-systems-689c851dc616)
- `docs/GU-PROFILE.md` · `docs/LUAT-CHU-VIET-7.1.23-2026-07-31.md`
