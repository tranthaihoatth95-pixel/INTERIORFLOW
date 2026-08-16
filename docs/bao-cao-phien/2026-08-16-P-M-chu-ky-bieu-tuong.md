# P-M · Thước `simpleCoChiTiet` + chấm lại 3 chữ ký + biểu tượng tệp

> Phiếu: `docs/phieu-giao/P-M-chu-ky-va-bieu-tuong-tep.md` · Mốc: `0471b54`, lệch main **0**
> Bản vẽ: `docs/mocks/mock-chu-ky-va-bieu-tuong-tep.html` (`@dsCard group="Chữ ký & biểu tượng tệp"`)

---

## 1 · Tổng quan

Biến nguyên tắc *"simple nhưng luôn có những chi tiết thú vị"* thành **thước bảy câu hỏi có/không**, mỗi câu kèm cách kiểm làm được trên app thật; hiệu chuẩn thước bằng ba thứ đã biết trước kết luận; rồi chấm lại ba chữ ký ở `mock-bo-nen-chung.html:752`. **Cả ba đều có chỗ trượt, kể cả PA2 — phương án phiên trước nghiêng về.** Ca biểu tượng tệp giải bằng **đo phổ màu thật** (OKLCH đọc từ `app/globals.css`) chứ không trích lại sổ, ra ba cách kèm hàng bỏ-màu. Không xếp hạng, không cho điểm.

---

## 2 · Chi tiết từng mục

### ⓪ Ba tiền đề — **nhận cả ba**

| # | Kiểm bằng | Kết quả |
|---|---|---|
| 1 | `mock-bo-nen-chung.html:751-752` | ✅ đúng — ba phương án, tiêu đề ghi *"không chọn hộ"* |
| 2 | `CHOT-16-08-BAN-DUNG.md:190` (B12) | ✅ đúng nguyên văn, kể cả câu *"dùng làm thước chấm chữ ký"* |
| 3 | `CHOT-16-08-BAN-DUNG.md:194` (B16) | ✅ đúng — *"tiêu hết hai cửa hue sạch"*, *"2-3 cách, không chọn hộ"* |

**Một sắc thái phải nói, không đủ để bác:** mục 5 tự khai *"không chọn hộ"* nhưng bên trong có nhãn *"tôi nghiêng về cái này"* trên PA2 và câu kết *"tôi nghiêng PA2"*. Không sai luật (nó vẫn kết bằng *"đây là chỗ chủ dự án quyết"*), nhưng nó **đặt sẵn một điểm neo** trước khi Hoà nhìn. Bản vẽ P-M cố ý **không mang nhãn nghiêng nào**, và chỗ trượt nặng nhất tìm được lại rơi đúng vào PA2.

### ⑤ Mã điều khoản — **ba số T ghi đều ĐÚNG**, kiểm lại từng dòng
`[T5]` = `TRIET-LY-IF.md:32` ✅ · `[N1]` = `:53` ✅ · `[Đ2]` = `:72` ✅. (Phiếu ghi *"số T ghi mà sai thì báo lại đúng số"* — không có gì phải sửa.)

### V1 · Thước — bảy câu, năm suy từ lời Hoà, hai phiên này thêm

| Câu | Hỏi | Trượt thì nghĩa là | Nguồn |
|---|---|---|---|
| H1 | Viết được câu người dùng đọc ra, ≤10 từ, có chủ ngữ? | hoa văn | lời Hoà |
| H2 | Bỏ đi thì mất tin gì — tin đó còn ở chỗ khác *trên cùng màn* không? | hoa văn **hoặc nói hai lần** | lời Hoà |
| H3 | Hai bản ghi khác nhau làm nó trông khác nhau? | trang trí | lời Hoà |
| H4 | Đọc ra được không cần ai dạy? | chưa đạt — có đường sửa | lời Hoà |
| H5 | Còn sống ở nấc chi tiết gọn nhất? | chỉ dùng được ở nấc sâu | lời Hoà |
| **H6** | **Bỏ hết màu vẫn đọc được, và kết luận không đổi khi đổi màu nhấn?** | màu là kênh duy nhất | **phiên này thêm** |
| **H7** | **Đứng được trong một khung hình tĩnh (ảnh chụp, trang in)?** | là *cơ chế*, chưa phải *dấu* | **phiên này thêm** |

**H6** không phải ý riêng — nó gộp hai ràng buộc đã có: luật *màu không là kênh duy nhất* + **màu nhấn thứ hai chưa chốt** (A3⑤). **H7** đến từ định vị sản phẩm: hero output là **hồ sơ in ra gửi đi**; chi tiết chỉ sống lúc app chạy thì không đi theo hồ sơ tới tay khách.

**Hiệu chuẩn (mục 1b của bản vẽ) — thước ra ba kết quả khác nhau, không phải một:**
đường dọc "hôm nay" **đạt cả bảy** · ô trống nét đứt lúc kéo thả **đạt 6/7** (trượt H7 hợp lệ — nó là phản hồi thao tác, không dự thi chức chữ ký) · quầng sáng tĩnh quanh mọi khung thẻ **trượt**, trùng đúng kết luận của NT-11 đã có sẵn. Đây là bằng chứng thước không tự chế ra để hợp thức hoá.

### V2 · Chấm ba chữ ký — **chỗ trượt của từng cái**

| | Chỗ trượt nói thẳng |
|---|---|
| **PA1 · sống lưng ba chặng** | **Trượt H2**: thanh chặng và nhãn chữ trên cùng màn đã nói y hệt ⇒ bỏ nó đi **không mất tin**, chỉ mất tốc độ đọc — nó là **bản sao**. Trượt thứ hai không đo bằng thước mà bằng định vị: nó mã hoá **cách bày màn hình**, thứ app nào có ba bước cũng vẽ được ⇒ nhận ra *"app có ba chặng"*, không nhận ra InteriorFlow. Bù lại nó **mạnh nhất ở H5**. |
| **PA2 · số có neo** | **Trượt H1, và đo được**: cờ tin cậy trong code có **ba** giá trị `measured \| inferred \| verified` (`lib/dna/types.ts:88`) mà chữ ký chỉ có **hai** hình. Gộp *máy suy* vào *người nhập* là **nói sai** — máy suy chưa ai chịu trách nhiệm, người nhập thì có. ⇒ H1 chỉ đạt cho 2/3 trạng thái thật. Đây là phương án đẹp nhất và cũng là phương án phiên trước nghiêng về; thước vẫn báo trượt. |
| **PA3 · cặp màu kể giờ** | **Trượt bốn câu.** H2: giờ có ở đồng hồ, bỏ đi không mất tin. H4: đổi quá chậm, ngồi cả buổi không thấy nó nói gì. **H6**: là màu và chỉ là màu — mà màu nhấn thứ hai **chưa chốt** nên hôm nay chưa dựng nổi. H7: một ảnh chụp không nói được *"màu này vì đang chiều"*. ⚠️ Trượt **với tư cách chữ ký** ≠ bỏ cơ chế: giữ nó ở vai **bầu không khí**, đã có sẵn ở Home. |
| **PA4 · ngữ pháp nét** *(phiên này thêm)* | Thước gợi ra: PA2 không sai hướng, chỉ **làm chưa hết** — nó áp ngữ pháp nét cho *riêng con số*, trong khi sự thật nó mã hoá đúng cho *mọi thứ*. Nét nói **nguồn** (liền = đo · chấm = máy suy · đứt = người nhập, ba nét ISO kiến trúc sư đọc sẵn), dấu tick nói **đã có người duyệt**. **Ba chỗ trượt tự khai:** ① ba hình phải học, PA2 chỉ hai — nghịch [N2] *đơn giản ngoài* ② nét chấm 1px dễ bị nhìn thành nét liền mờ, **chưa đo trên máy thật** ③ **lệch với code**: union coi `verified` là trạng thái thứ ba loại trừ, hình vẽ coi nó là trục thứ hai chồng lên nguồn — phải chốt một. |

**Không đổi kết luận khi đổi màu nhấn:** PA1 · PA2 · PA4. **Có đổi:** PA3.

### V3 · Biểu tượng tệp — **đo phổ, không tin lời sổ**

Đo bằng **OKLCH** (không gian T đã chốt ở A3) tính từ giá trị đọc thẳng `app/globals.css`:

| Màu nghĩa | Nền tối | Nền sáng | Vùng chắn |
|---|---|---|---|
| `--danger` | 32,5° | 31,7° | 12° – 53° |
| `--warning` | 77,3° | 71,3° | 51° – 97° |
| `--success` | 154,6° | 156,3° | 135° – 176° |
| tím `#7c3aed` | 293,0° | | 233° – 353° (ngưỡng ≥60°) |

**Kết quả đo — sổ nói đúng, phiên này nói rõ thêm một chỗ:** số học cho **ba** khoảng trống chứ không phải hai — `176°–233°` (57°) · `353°–12°` (19°, vắt qua hai đầu dải) · `97°–135°` (38°). Cửa thứ ba **trống về số nhưng chết về nghĩa**: nó kẹp giữa *cần xem lại* và *đạt*, mắt đọc thành "gần cảnh báo" hoặc "gần đạt". ⇒ Câu *"chỉ còn hai cửa hue sạch"* **đúng về mặt dùng được**, giữ nguyên.

🔴 **Hệ quả thẳng:** một bộ 5 đuôi tệp cần ~125° để 5 màu nhìn ra khác nhau. Sau khi màu nhấn thứ hai lấy một cửa, phần dùng được còn **chưa tới 40°**. **Không đủ chỗ** — bộ nhiều màu Hoà gửi làm được vì app đó không có hệ màu mang nghĩa để phải né.

| Cách | Được | Mất | Rủi ro luật |
|---|---|---|---|
| **A · chữ + hình dạng** | 0 cửa hue tiêu · thêm đuôi mới không phải xin màu · đuôi tệp là ký hiệu 3–4 ký tự đọc lướt | 5 biểu tượng cùng dải ⇒ phải **đọc**, không **nhìn**; ba hình dạng là trần thật | gần như không — cách duy nhất không xin ngoại lệ |
| **B · nhiều màu, ngoại lệ có phạm vi** | quét 40 tệp nhanh nhất · giống thứ người dùng đã quen | **đo được**: để có 5 màu buộc lấn cả ba vùng nghĩa — `pdf` đỏ đứng cạnh tệp hỏng thật thì hai cái đỏ nói hai chuyện | thủng *màu luôn mang nghĩa*; phải khai luật *"trong ô biểu tượng, màu không mang nghĩa trạng thái"* — ranh giới nằm trong đầu người thiết kế, không trên màn |
| **C · màu mã hoá một trục có nghĩa thật** *(phiên này thêm)* | 0 cửa hue mới · màu **vẫn mang nghĩa** · trả lời đúng câu người dùng hỏi: *"cái nào mở ra sửa được luôn?"* | không cho tốc độ quét theo từng loại; nhóm "nhập vào" vẫn phải đọc đuôi | màu chủ đang mang nghĩa *bấm được/đang chọn* ⇒ phải kiểm riêng ca **một tệp `.idfc` cạnh một tệp đang được chọn** |

**Cả ba đều có hàng bỏ-màu dựng thật trên bản vẽ.** A và C không đổi gì khi bỏ màu; B mất một kênh nhưng vẫn đọc được nhờ đuôi chữ.

**Một ràng buộc tìm ra trong lúc dựng, không có trong phiếu:** bản đầu tô màu cho *cả chữ đuôi tệp*, máy đo ra **3,96 – 4,50:1** ở cỡ 10px — dưới ngưỡng ở cả hai theme. ⇒ **Màu chỉ được ở khung và nền; chữ đuôi giữ màu mực.** Không phải chuyện gu: chữ 10px tô màu nhấn thì không đủ tương phản ở bất kỳ màu nào.

### ⑥ / ⑥b · Nghiệm thu — đạt ở **vòng 5** (trần 5)

| Cửa | Kết quả |
|---|---|
| `soi:tu-dien` | ✅ **0 lệch nhãn** · 212 chữ trần = **đúng mốc baseline**, không tăng |
| `soi:hinh-hoc` | ✅ **10 ngoài thang** — giữ mốc |
| Tương phản chữ | ✅ **519 mục × 2 nền × 3 màu nhấn = 0 mục dưới ngưỡng** (máy đo tự viết, có cộng gộp lớp trong suốt) |
| Mã màu ngoài khối token | ✅ 0 trong CSS. Còn đúng 1 chuỗi `#7c3aed` nằm trong `<code>` của bảng đo — là **dữ liệu được báo cáo**, không phải khai kiểu dáng |
| 1440×900 | ✅ `scrollWidth = clientWidth = 1440`, 0 phần tử vượt biên |
| Chữ Việt | ✅ 0 chỗ `line-height < 1.5` · 0 hoa toàn phần · 0 tracking âm · 0 chữ dưới 10px |
| Token | ✅ 0 `--mat-*` · 0 `--nen-mo-hairline` (đã đổi `--vien-mo` theo chỉ đạo T giữa phiên) |

**Vòng nào hỏng vì gì:** V1 mã màu `rgba/hsl` ngoài khối token + chữ 9px + `line-height` tiêu đề 1,3–1,45 · V2 máy đo của chính tôi bỏ qua alpha nên báo sai hàng loạt · V3 hai lỗi tương phản **thật** (`.nguon` 4,16 trong ô tiêu đề bảng · `.duoi` 3,96–4,50 khi tô màu) · V4 lệch giữa hình và số: dải chắn màu chủ vẽ theo ±20° trong khi bảng ghi ±60° · V5 đổi tên token theo T, kiểm lại toàn bộ.

---

## 3 · Tổng kết lại vấn đề

Trước phiên này, *"chi tiết phải mang tin"* là một câu **đúng nhưng không dùng được** — không ai cãi nó, và cũng không ai bị nó chặn. Bảy câu hỏi + cách kiểm biến nó thành cửa: chi tiết nào không viết ra được một câu, hoặc bỏ đi mà không mất gì, thì **trượt**, dù đẹp.

Chấm xong thì bức tranh khác hẳn ấn tượng ban đầu: **không có phương án nào sạch**. PA1 trượt vì nói lại điều màn hình đã nói. PA2 — cái đẹp nhất — trượt vì **hai hình cho ba trạng thái**, và đây là lỗi *nói sai*, không phải lỗi thẩm mỹ. PA3 trượt bốn câu và là cái duy nhất **đổi kết luận theo màu nhấn chưa chốt**. Đúng chỗ đó thước sinh lợi: nó tìm ra PA4 — không phải ý mới mà là **PA2 làm cho hết**.

Ca biểu tượng tệp thì lời giải nằm ở **phép đo**, không ở tranh luận: phổ còn chưa tới 40° sau khi màu nhấn lấy một cửa, mà 5 đuôi tệp cần ~125°. Con số đó đóng câu hỏi *"có nên nhiều màu không"* nhanh hơn mọi lập luận về gu.

---

## 4 · Đánh giá khách quan

**Được:** thước bắt được thứ mắt không bắt — hai lỗi tương phản 4,16 và 4,50 chênh ngưỡng vài phần trăm, nhìn thì không thấy. Thước cũng **tự chứng minh nó phân biệt được** (hiệu chuẩn ra ba kết quả khác nhau) và **tự chứng minh nó không nới** (PA2 vẫn trượt). Số góc màu đo sống, không trích sổ — đúng luật lập ra sau ca bộ-số-pha.

**Chưa được:**
- **Thước chấm không tới phần định vị.** Điểm trượt nặng nhất của PA1 — *"nó mã hoá cách bày màn hình, ai cũng vẽ được"* — **không câu nào trong bảy câu bắt được**; tôi phải nói bằng lời ngoài thước. Đây là lỗ thật của thước, không phải chỗ tôi lười thêm câu: câu hỏi *"thứ này có riêng của IF không"* trả lời được bằng có/không nhưng **không kiểm được bằng cách nào cả** — nó cần biết đối thủ vẽ gì.
- **H4 phụ thuộc người thật.** Cách kiểm là hỏi một kiến trúc sư chưa xem tài liệu. Chưa hỏi ai. Mọi ô H4 trong bảng là **suy đoán có lý do**, không phải đo.
- **PA4 chưa qua mắt ai**, và nó có một lệch với code chưa giải (`verified` là trạng thái thứ ba hay trục thứ hai).
- Nét chấm mảnh trên màn thường **chưa đo**.

---

## 5 · Hướng xử lý — hai góc

**Hướng ①: Hoà chọn một chữ ký ngay ở lô duyệt mắt tới.**
*Ưu:* đóng được một mục đang treo, hai cái còn lại khai tử tường minh, hết rơi rớt. *Nhược:* PA3 đang bị chấm trong điều kiện **thiếu một dữ kiện** (màu nhấn chưa chốt) — chọn lúc này là chọn khi một ứng viên chưa dựng được đầy đủ.

**Hướng ②: tách làm hai nhịp — chốt PA1↔PA2/PA4 trước, để PA3 lại chờ màu.**
*Ưu:* PA1 và PA2/PA4 **không phụ thuộc màu nào**, chấm được trọn hôm nay; PA3 vốn không tranh chỗ với chúng (một cái là nền, hai cái kia là dấu) nên hoãn nó **không chặn gì**. *Nhược:* thêm một lần Hoà phải quay lại chủ đề này.

---

## 6 · Đề xuất

**Chọn hướng ②.** Lý do không phải để né quyết định mà vì **bảng đo nói thế**: dòng cuối bảng đối chiếu — *"đổi kết luận khi đổi màu nhấn?"* — chỉ có **một** cột ghi *có*, và đúng cột PA3. Ba cột kia đã chín. Ép chọn cả ba cùng lúc là để một dữ kiện thiếu kéo lùi hai quyết định đã đủ dữ kiện.

Cụ thể: đưa Hoà **PA1 ↔ PA2 ↔ PA4** trước (ba cái đứng cạnh nhau trên bản vẽ, cùng điều kiện, cùng thước), và ghi PA3 là **chờ màu nhấn**, không phải *bỏ*. Với biểu tượng tệp thì **cách A và C chốt được ngay** (cả hai tiêu 0 cửa hue), còn **cách B phải chờ** vì vùng cấm của nó đổi ngay khi màu nhấn thứ hai lấy mất một cửa.

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM

1. **Câu nào của Hoà, câu nào tôi thêm** — H1..H5 suy từ lời Hoà (B12 + ảnh timeline); **H6 và H7 là tôi thêm**, lý do ghi ngay trên bản vẽ để Hoà bác được đúng câu. Nếu Hoà bỏ H7 thì **PA3 gỡ được một điểm trượt** (còn ba).
2. **Thước có lỗ, và tôi biết lỗ ở đâu** — nó **không chấm được phần định vị** ("thứ này có riêng của IF không"). Điểm trượt nặng nhất của PA1 nằm ngoài thước. Chưa vá vì chưa nghĩ ra cách kiểm tất định; thêm một câu không kiểm được sẽ làm hỏng chính thước.
3. **H4 chưa đo trên người thật** — cách kiểm là hỏi một kiến trúc sư chưa xem tài liệu, **chưa hỏi ai**. Mọi ô H4 là suy đoán.
4. **Cửa hue: tôi ĐO, không tin sổ.** OKLCH tính từ giá trị đọc `app/globals.css`. Đo ra **ba** khoảng trống chứ không phải hai; cửa thứ ba (97–135°) tôi **loại bằng lập luận ngữ nghĩa, không bằng số** — chỗ này là phán đoán của tôi, Hoà có thể không đồng ý.
5. **Ngưỡng "5 màu cần ~25°/màu"** là con số tôi đặt ra, **không trích từ nghiên cứu nào**. Nếu ngưỡng thật nhỏ hơn thì kết luận *"không đủ chỗ"* của cách B yếu đi.
6. **Nét chấm 1px chưa đo trên màn thật** — PA4 phụ thuộc chỗ này.
7. **PA4 lệch với code**: `verified` là trạng thái thứ ba loại trừ (`lib/dna/types.ts:88`) hay trục thứ hai chồng lên nguồn? Tôi vẽ theo cách thứ hai, **chưa ai chốt**.
8. **Chỗ nào đổi nếu màu nhấn chốt khác đi:** PA3 phải chấm lại từ đầu (H6 hôm nay trượt vì **hai** lý do trộn: bản chất là màu, **và** màu chưa có — có màu rồi phải tách hai lý do đó ra) · cách B phải đo lại vùng cấm · cách C không đổi vì nó dùng màu chủ tím, không dùng màu thứ hai.
9. **Không chạy `tsc`/test** — phiếu không yêu cầu, và phiên này không đụng code.

---

## ⑦c · HẠN DÙNG KẾT LUẬN

**Hết đúng khi:**
- **Màu nhấn thứ hai được chốt** → PA3 chấm lại; cách B đo lại vùng cấm; bảng phổ ở mục 3a phải vẽ lại vì một cửa hue vừa bị lấy.
- **Theme sáng đổi sang bản canh-Apple thật trong code** → mọi số tương phản trên bản vẽ đo trên **bản đề xuất**, chưa phải bản đang chạy.
- **Hoà chọn một chữ ký** → hai cái còn lại thành **nợ chết**, phải **khai tử tường minh** trong sổ ("PA… bỏ, vì…"). Bỏ hoang thì vài tuần nữa có người dựng lại và tưởng là ý mới.
- **Union cờ tin cậy đổi hình dạng** → PA2 và PA4 đều neo vào `measured | inferred | verified`.
- **Có người trả lời được H4** → mọi ô H4 hiện là suy đoán, đo xong có thể lật.

---

## ⑧ Dây máy
`khung-mot-khuon` (ký hiệu nghề — PA4 dùng đúng ba nét ISO, đây là ca thật đầu tiên) · `he-mau-2-lop` (số đo cửa hue ở mục 3a) · `hinh-hoc-ap-thang` (chỉ dùng thang 6/10/14/20 + capsule). **Không sửa registry** — T flip sau audit.
