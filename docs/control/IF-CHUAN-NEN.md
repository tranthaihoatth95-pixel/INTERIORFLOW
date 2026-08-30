# IF · CHUẨN NỀN — thứ máy đo được, để không phải chờ mắt Hoà

> **Hoà chốt 30/08/2026**, và đây là câu đổi cách làm việc:
>
> *"Mọi thứ bây giờ kể cả thẩm mỹ, khi nói đến đều phải lấy ngôn ngữ hình học, bố cục, tỉ lệ tiêu
> chuẩn được nghiên cứu kỹ càng, màu sắc ảnh hưởng thị giác, luật thị giác mà ra mà? Đi nghiên cứu
> cốt lõi nền tảng của ngành về, xác lập quy định và tiêu chuẩn nền cho IF đi, rồi nó tự đo lường
> trên đó. Mọi thứ khác từ thị giác của tôi chỉ làm IF trở nên khác biệt thôi — vì chuẩn là những
> thứ đã được nghiên cứu và ứng dụng rồi, thậm chí đối thủ đang ứng dụng và làm tốt hơn chúng ta.
> Vậy không có lý do gì trông chờ vào tôi cả."*

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

## 4 · MÀU — chưa có chuẩn, và **gu KHÔNG phải chuẩn**

🔴 **HẠ CẤP 30/08 — mục này TRƯỚC ĐÂY lấy `docs/GU-PROFILE.md` §2 làm NGUỒN CHUẨN cho luật
"đơn sắc + một màu nhấn". Đó là biến gu cá nhân thành chuẩn ngành, và Hoà bác thẳng:**

> *"Không cần gu trong giai đoạn này, vì chuẩn ngành nên đang chuẩn bị thiết lập. Gu của tôi ⇒
> chỉ là thứ khiến IF trở nên **khác biệt**, và là **một trong những design DNA** được trích xuất
> từ **một designer đầu tiên** IF học thôi."*

⇒ Ba câu, ghi ra để không ai xếp nhầm lần nữa:

| | |
|---|---|
| `GU-PROFILE.md` **là** | **mẫu DNA thiết kế số 1** — trích từ designer đầu tiên IF học. Dữ liệu hiệu chuẩn. |
| `GU-PROFILE.md` **không phải** | chuẩn · nguồn · thang đo · mặc định toàn cầu |
| Nó dùng để | làm IF **khác biệt**, sau khi IF đã đạt chuẩn — **không** thay chuẩn |

**Trạng thái thật của mục MÀU:** `CHƯA CÓ CHUẨN`. Số màu nhấn nên là bao nhiêu, dựa trên nghiên
cứu nào — đó là câu của lĩnh vực `11 · 12` trong bản đồ, đã giao lane 05. **Không dùng gu để lấp
chỗ trống này.**

**Đo IF, giữ lại vì nó là dữ kiện:** accent `#6a57f5` tím-indigo — accent mặc định của gần như
mọi SaaS. Có đúng không thì chờ chuẩn, không chờ gu.

---

## 5 · CÒN THIẾU — nói thẳng, chưa nghiên cứu

Bốn mục dưới đây **chưa** có nguồn và ngưỡng, nên **chưa được dựng cổng**. Ghi ra để chúng không
biến thành "chuẩn" bằng cách im lặng trôi qua.

⚠️ **Mỗi dòng dưới đây kèm LỆNH KIỂM.** Cổng `soi:vang-mat` bắt mục này ngay lần viết đầu, và nó
bắt đúng: một dòng khai thiếu mà không kèm cách đo thì sáu tháng sau không ai biết nó còn đúng hay
đã cũ. Lệnh ở cột phải chạy được, cho ra đúng con số ghi kèm.

| thiếu gì | kiểm bằng |
|---|---|
| **Bố cục** — lưới, tỉ lệ khung, thứ bậc thị giác | `node -e "const s=require('./package.json').scripts; console.log(Object.keys(s).filter(k=>/bo-cuc\|luoi/.test(k)).length)"` → **0** |
| **Luật thị giác Gestalt** — gần nhau · giống nhau · khép kín · liên tục | `node -e "const s=require('./package.json').scripts; console.log(Object.keys(s).filter(k=>/gestalt\|thi-giac/.test(k)).length)"` → **0** |
| **Vùng bấm** — sàn 44px (quy ước Apple HIG / WCAG 2.5.8 là 24px) | `node -e "const s=require('./package.json').scripts; console.log(Object.keys(s).filter(k=>/vung-bam\|tap-target/.test(k)).length)"` → **0** |
| **Chuyển động** — thời lượng, đường cong | có token `--nhip-*` và cổng `F-MOTION-TOKEN` (trần 41) canh **việc dùng token**, nhưng **không** canh giá trị token có đúng nghiên cứu không: `node -e "console.log(require('./scripts/foundation-tran.json')['F-MOTION-TOKEN'])"` → **41** |

Cả bốn đã giao lane `05 · THIẾT KẾ/NC` (`docs/phieu-giao/khao-sat-ux-toan-cau.md`).

---

## 6 · NGUỒN

- WCAG 2.1/2.2 — W3C · APCA — [git.apcacontrast.com](https://git.apcacontrast.com/documentation/WhyAPCA.html)
- [The Easy Intro to APCA](https://git.apcacontrast.com/documentation/APCAeasyIntro.html)
- [APCA Contrast vs WCAG 2 — 2026](https://66colorful.com/blog/apca-contrast/)
- [Vertical Rhythm & Modular Scale — Bounteous](https://www.bounteous.com/insights/2018/03/26/what-font-are-vertical-rhythm-and-modular-scale/)
- [Typography design systems — UX Collective](https://uxdesign.cc/a-better-way-to-create-typography-design-systems-689c851dc616)
- `docs/GU-PROFILE.md` · `docs/LUAT-CHU-VIET-7.1.23-2026-07-31.md`
