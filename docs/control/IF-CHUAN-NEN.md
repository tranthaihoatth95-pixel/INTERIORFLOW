# IF · CHUẨN NỀN — thứ máy đo được, để không phải chờ mắt Hoà

> **Hoà chốt 30/08/2026**, và đây là câu đổi cách làm việc:
>
> *"Mọi thứ bây giờ kể cả thẩm mỹ, khi nói đến đều phải lấy ngôn ngữ hình học, bố cục, tỉ lệ tiêu
> chuẩn được nghiên cứu kỹ càng, màu sắc ảnh hưởng thị giác, luật thị giác mà ra mà? Đi nghiên cứu
> cốt lõi nền tảng của ngành về, xác lập quy định và tiêu chuẩn nền cho IF đi, rồi nó tự đo lường
> trên đó. Mọi thứ khác từ thị giác của tôi chỉ làm IF trở nên khác biệt thôi — vì chuẩn là những
> thứ đã được nghiên cứu và ứng dụng rồi, thậm chí đối thủ đang ứng dụng và làm tốt hơn chúng ta.
> Vậy không có lý do gì trông chờ vào tôi cả."*

## 0 · RANH GIỚI — cái gì máy chấm, cái gì mắt chấm

| | |
|---|---|
| **MÁY CHẤM** — luôn luôn, không ngoại lệ | bảo toàn dữ liệu · tương phản · thang chữ · nhịp dọc · thang bo · số lượng màu nhấn · sàn cỡ chữ · vùng bấm |
| **MẮT CHẤM** — và chỉ chừng này | **cá tính**: gu, mood, thứ làm IF *khác biệt* với đối thủ đã đạt chuẩn |

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

## 4 · MÀU — đơn sắc + MỘT màu nhấn

**Nguồn:** `docs/GU-PROFILE.md` §2, chưng cất 11/07 từ 4 board Pinterest của Hoà (~1.500+ pin,
cluster màu k-means). Đây là chỗ **duy nhất** gu cá nhân được phép làm chuẩn — và nó chỉ chốt
*cấu trúc* (bao nhiêu màu), không chốt *màu nào*.

```
đen / trắng / xám  +  ĐÚNG MỘT màu nhấn
```

**Đo IF:** accent `#6a57f5` — tím-indigo. ⚠️ Nó **không nằm trong** bảng màu Hoà thích ở §1
(*greige · kem · champagne · nâu óc chó · đen nhấn · xanh cây điểm*), và tím-indigo là accent mặc
định của gần như mọi SaaS. Đây là câu hỏi mở, đã ghi vào phiếu khảo sát cho lane 05.

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
