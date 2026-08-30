# IF · HỆ 5 BỘ MÀU — năm bộ nào · phủ ai · range tới đâu

> Trả phiếu `HO-20260830074652-df7c3a1f135b` + đính chính `HO-20260830080949-fe7462715fba`.
> Lane `04 · DESIGN`, 30/08/2026. Nền luật: `IF-CHUAN-NEN.md` §4 (Hoà chốt 30/08).
> Ba vật tách bạch, theo đúng đính chính của MAIN — **số 5 chỉ áp vào vật thứ hai**:
> kho chuẩn để HỌC *không giới hạn* · **bộ dựng sẵn SHIP KÈM bản cài = 5** ·
> bộ người dùng TỰ TẠO trong range *không giới hạn*.

---

## 0 · KẾT LUẬN TRƯỚC

**`FACT` — nửa việc của phiếu này đã tồn tại từ 16/08, không ai trong control plane biết.**
`IF-CHUAN-NEN.md` §4 ghi *"cần dựng, chưa có: ① khai báo 5 bộ"*. Sai. `lib/wallpaper/sets.ts`
đã khai **đúng năm bộ**, sinh bằng mã, kèm `contrast.test.ts` chạy **240 phép đo** trên
5 bộ × 4 thời điểm × 2 theme × 2 bề mặt × 3 bậc chữ. Đây là N8 ở dạng đắt nhất: suýt dựng lại
một thứ đã chạy thật 14 ngày.

**`FACT` — thứ THẬT SỰ thiếu là NỬA CÒN LẠI của câu "bộ = hình nền + bảng màu đi liền".**
`sets.ts` **cố ý** không mang màu nhấn (chú thích trong tệp: bão hoà ≤ 0,12 để *"không bộ nào bị
khoá vào màu nhấn"*, vì lúc đó màu nhấn thứ hai chưa chốt). Chốt 30/08 lật đúng điều đó.
⇒ Lượt này dựng: `lib/wallpaper/mau-bo.ts` (bảng màu + RANGE + cổng) và
`lib/wallpaper/mau-bo.test.ts` (**51 phép kiểm, 0 fail**, nằm sẵn trên đường `npm test`).

**`FACT` — `npm test` đang ĐỎ trước lượt này, vì một lỗi thuộc đúng phạm vi phiếu.**
`--card` theme sáng đổi `#ffffff` → `#fdfdff` ngày 30/08 (bản vá luật trung tính), nhưng bản sao
token trong `lib/wallpaper/contrast.ts` không đổi theo. Drift-guard bắt được, và nó là thứ **duy
nhất** bắt được. Đã sửa → `contrast.test.ts` **23 pass / 0 fail**.

**`ONLY-USER` — một khoảng trống KHÔNG lấp được bằng kỹ thuật, cần Hoà quyết.** Xem §3b:
gu ấm quiet-luxury của chính Hoà (`GU-PROFILE.md` §1) **bị luật màu nghĩa của IF chặn về mặt cấu
trúc**, không phải vì ai quên nó.

---

## 1 · ① NĂM BỘ NÀO — ánh xạ phong cách, có nguồn

Năm bộ **không phải năm màu của cùng một thứ**: mỗi bộ là một **cơ chế ánh sáng** khác nhau
(`WallpaperLayer` trong `lib/wallpaper/types.ts`), và mỗi cơ chế đó vốn đã là một hiện tượng có
tên trong lịch sử nghệ thuật. Việc của lượt này là **gọi đúng tên nó** và gắn một màu nhấn hợp.

| bộ | cơ chế ánh sáng | phong cách · **nguồn** | accent | cá tính — người dùng kiểu gì |
|---|---|---|---|---|
| **Chân trời** `chan-troi` | quầng sáng chạy dọc chân trời theo mặt trời thật | **Trường màu · ánh sáng là chủ thể** — Mark Rothko (color field) · James Turrell, *Skyspace* | `#6a57f5` h247,2° | làm việc trong không khí và ánh sáng trước khi làm việc trong đường nét |
| **Ô cửa** `o-cua` | một vệt nắng nghiêng theo giờ, phần còn lại lùi vào tối | **Sáng-tối tương phản · nội thất Bắc Âu** — Caravaggio (tenebrism) → Vilhelm Hammershøi | `#c42e8d` h322° | dựng cảnh bằng MỘT nguồn sáng và chấp nhận phần còn lại tối |
| **Bình độ** `binh-do` | chỉ nét và lưới, không giả vờ có chiều sâu | **Kiến tạo · trường phái Thuỵ Sĩ** — Müller-Brockmann, *Grid Systems* · bản in lam (cyanotype) | `#186adc` h215° | tin bản vẽ hơn phối cảnh; đọc công trình bằng nét trước khi bằng ảnh |
| **Tầng sâu** `tang-sau` | các lớp lùi dần, càng xa càng nhạt và ngả lạnh | **Thuỷ mặc · phối cảnh khí quyển** — sơn thuỷ 山水 / sumi-e · Leonardo, *prospettiva aerea* | `#a43dc7` h285° | nghĩ theo lớp và khoảng lùi, không theo mặt phẳng đơn |
| **Mặt phẳng** `mat-phang` | một tấm vật liệu, ánh sáng liếm ngang từ mép | **Tối giản vật liệu · wabi-sabi** — Donald Judd · Tadao Ando (bê tông trần) | `#587723` h82° | để vật liệu tự nói; ghét thêm chi tiết không mang tin |

**Accent bộ mặc định giữ nguyên từng byte `#6a57f5`.** Cố ý: *"accent không còn là hằng số"*
không được kéo theo việc app đổi mặt lúc chưa ai chọn gì. Đổi mặc định là quyết định của Hoà,
không phải hệ quả phụ của một lượt kỹ thuật. Một phép kiểm canh đúng điều đó
(`--accent` trong `globals.css` **phải bằng** accent của `WALLPAPER_SETS[0]`).

**Vì sao accent `mat-phang` là rêu 82° chứ không phải đồng/champagne** — đây là số, không phải gu:
bốn vùng cấm (danger 10° · warning 37° · success 145° · AI 187°, mỗi vùng ±20°) **bịt kín dải
350°–57°**. Toàn bộ phổ đồng · champagne · nâu ấm nằm trong đó. Ô trống duy nhất còn lại ở nửa ấm
là **57°–125°**, tức rêu/patina. Không phải chọn tuỳ hứng — là chỗ duy nhất còn chỗ.

---

## 2 · ③ RANGE — người dùng chỉnh được gì, tới đâu, VÌ SAO tới đó

Sáu token, khai trong `TOKEN_CHINH_DUOC` (`lib/wallpaper/mau-bo.ts`). Mỗi biên kèm **nhãn nguồn**,
và nhãn thứ ba cố ý xấu xí để không ai đọc nhầm một chốt sản phẩm thành một hằng số nghiên cứu.

| token | range | nguồn | biên DƯỚI vì sao | biên TRÊN vì sao |
|---|---|---|---|---|
| `accentHue` | 0–360° **trừ 4 vùng ±20°** | LUẬT-IF | hue không đổi độ đọc ⇒ không có lý do WCAG nào để khoá. **Đây là chỗ cá nhân hoá THẬT** | trừ danger 10° · warning 37° · success 145° · AI 187°. Đứng trong đó là **mượn nghĩa** của một màu đã có nghĩa |
| `accentSat` | 0,35 – 0,92 | 🟡 **CHỐT SẢN PHẨM — CHƯA CÓ NGUỒN** | dưới 0,35, với L bị ép vào cửa sổ hẹp, accent đọc ra như xám ngả màu ⇒ *"đơn sắc + 1 accent"* sập thành *"đơn sắc"* | trần 0,92 chứa accent hiện hành (0,885) và chừa biên. Nghi ngờ đang treo: trên màn P3 màu sát mép gam rung so với nền trung tính — **chưa đo** |
| `accentL` | **TÍNH ĐƯỢC**, không phải cặp số | **WCAG 2.2** | chỗ accent bắt đầu lẫn vào `--card` TỐI (§1.4.11, sàn 3,0) | chỗ SỚM NHẤT trong hai luật gãy: chữ trắng trên accent tụt dưới 4,5 (§1.4.3) **hoặc** accent lẫn vào `--card` SÁNG (§1.4.11) |
| `nenHue` | 0–360° **trừ 3 vùng ±20°** | LUẬT-IF | tự do, trừ vùng cấm | trừ **BA** vùng (danger · warning · success) — **không** trừ màu AI: nền bão hoà ≤ 0,12 gần vô sắc, không đủ sắc để mượn nghĩa |
| `nenSat` | 0 – 0,12 | LUẬT-IF | 0 = trung tính thuần, luôn hợp lệ | 0,12 là luật ② đã có sẵn trong `sets.ts`: trên mức đó **nền tự mang gu và mọi wallpaper khoác lên đều bị nhuộm** |
| `nacGiamChoi` | 0 · 1 · 2 | LUẬT-IF | 0 = kính như thường | 2 = tắt hẳn kính về màu trơn. Nấc này **cắt ánh kim, không bao giờ cắt độ đọc** |

### 2b · Điều quan trọng nhất của cả bảng: **RANGE trên trục sáng KHÔNG phải một cặp số gõ tay**

`khoangSang(hue, sat)` tính cửa sổ hợp lệ cho **từng cặp** (hue, sat), vì ba bất đẳng thức kẹp
hai đầu và kẹp theo cách phụ thuộc màu:

```
chữ trắng đọc được TRÊN accent          ⇒ accent phải đủ TỐI    ← chặn biên TRÊN
accent phân biệt được với --card sáng   ⇒ đủ TỐI                ← chặn biên TRÊN
accent phân biệt được với --card tối    ⇒ đủ SÁNG               ← chặn biên DƯỚI
```

**Đo được, in ra mỗi lần chạy test:**

| bộ | cửa sổ L hợp lệ | rộng | chữ trắng / accent | vs card sáng | vs card tối |
|---|---|---|---|---|---|
| `chan-troi` | 0,620 … 0,665 | **0,045** | 4,90 | 4,83 | 3,54 |
| `o-cua` | 0,440 … 0,510 | **0,070** | 5,09 | 5,01 | 3,41 |
| `binh-do` | 0,445 … 0,515 | **0,070** | 5,08 | 5,00 | 3,42 |
| `tang-sau` | 0,475 … 0,545 | **0,070** | 5,16 | 5,08 | 3,36 |
| `mat-phang` | 0,280 … 0,325 | **0,045** | 5,15 | 5,07 | 3,37 |

⇒ **Trục sáng gần như KHÔNG có tự do — rộng nhất 0,070 trên thang 0…1.** Nói thẳng con số này
cho người dùng còn hơn hứa một thanh trượt rồi kẹp họ về chỗ khác. **Tự do thật nằm ở trục HUE.**

### 2c · Cổng — thiếu mục này thì "không phạm luật chung" chỉ là lời chúc

`soiCombo()` trả danh sách lỗi kèm **số đo**, và **không tự kẹp**. Kẹp im lặng là cách một luật
biến thành lời chúc: người dùng tưởng mình đang chỉnh, hệ thì đang âm thầm nắn về chỗ khác, và
không ai học được biên nằm ở đâu. Muốn kẹp thì gọi `kep()` — quyết định của chỗ gọi.

`mau-bo.test.ts` có **hai nửa bắt buộc**, thiếu nửa hai thì tệp chỉ chứng minh cổng biết im lặng:

- **nửa ①** cổng phải **XANH** với năm combo mặc định — không báo oan. *(5/5 sạch)*
- **nửa ②** cổng phải **ĐỎ** với **tám ca đột biến**, và đỏ **đúng khoá**: hue đè danger · hue đè
  màu AI · bão hoà dưới sàn · L quá sáng (chữ trắng trượt) · L quá tối (lẫn card tối) · nền bão
  hoà 0,30 · nấc 3 · setId không có thật. *(8/8 bắt đúng khoá)*

Hai lỗi thật do chính test bắt trong lượt viết, giữ lại làm lời chứng trong mã:
**đệ quy đẩy hue treo vô hạn** (danger 10° và warning 37° chồng nhau ⇒ 31° ↔ 16° không dừng) và
**kẹp làm xê dịch một combo đã hợp lệ** (`247.2 → 247.20000000000005` — hàm kẹp mà xê dịch giá
trị đúng thì mọi lần lưu thành một lần sửa).

---

## 3 · ② PHỦ AI — và nhóm nào KHÔNG bộ nào phủ

| nhóm người dùng | bộ phủ | ghi chú |
|---|---|---|
| dựng bản vẽ kỹ thuật 2D · CAD | **Bình độ** | ánh xạ trực tiếp: nét, lưới, không chiều sâu giả |
| làm vật liệu · chi tiết · mẫu | **Mặt phẳng** | ánh sáng liếm mép là đúng cách nhìn một mẫu vật liệu |
| concept · moodboard · không khí | **Chân trời**, **Tầng sâu** | hai cách khác nhau: khí quyển mở ↔ lớp lùi dần |
| trình bày với khách | **Ô cửa** | một nguồn sáng, phần còn lại lùi tối — nền không tranh với nội dung |
| quản lý · dự toán · bảng số | *không bộ nào nhắm riêng* | phục vụ gián tiếp bằng `nacGiamChoi = 2` (kính đặc, tương phản thành hằng số) |

### 3b · 🔴 KHOẢNG TRỐNG LỚN NHẤT — và nó bị chặn bằng CẤU TRÚC, không phải bị quên

**Cả năm bộ có nền nằm ở nửa LẠNH: hue 205°–248°, bão hoà ≤ 0,11.** Về hình học chúng là năm cá
tính; **về nhiệt độ màu chúng là MỘT.** Nhóm không được phủ, nói thẳng:

> **Người có gu ấm — quiet-luxury Á Đông: greige · kem · champagne · nâu óc chó · đồng.**
> Đó chính là `GU-PROFILE.md` §1, **DNA số 1 của Hoà**. `IF-CHUAN-NEN.md` §4 viết nó *"có thể trở
> thành MỘT trong năm bộ"*.

**Nhưng đo được: nó KHÔNG thể, nếu không sửa một luật.** Bốn vùng cấm ±20° bịt kín dải
**350°–57°**, và toàn bộ phổ champagne · đồng · nâu ấm nằm trong đó — cho cả accent lẫn nền.
Không có chỗ hợp lệ nào để đặt một bộ ấm theo nghĩa của `GU-PROFILE`.

Thêm một mâu thuẫn có tên: `sets.ts` viện **chốt 03/08 *"hai nhiệt độ — InteriorFlow LẠNH"*** để
giải thích vì sao không có bộ ấm nào. Chốt 30/08 mở cửa cho GU thành một trong năm. **Hai chốt
của cùng một người, ngược nhau.** Máy không được tự chọn chốt nào thắng.

**`ONLY-USER` — ba đường, tôi KHÔNG tự đi đường nào (nới một cổng là M-52):**

| | đường | cái giá |
|---|---|---|
| **A** | giữ nguyên — năm bộ lạnh, GU §1 ở ngoài | gu số 1 của chủ sản phẩm không có trong sản phẩm |
| **B** ⭐ | **bán kính cấm co theo bão hoà**: `r = 20° × min(1, sat / 0,35)`. Ở nền sat 0,11 ⇒ r ≈ 6,3° — một greige 45° hợp lệ, còn một đỏ bão hoà vẫn bị cấm đúng như cũ | phải chứng minh bằng ca đột biến rằng màu nghĩa **không** mất trọng lượng; là **nới** một cổng đang chạy |
| **C** | dời một màu nghĩa | đụng vào thứ cả app đang đọc — đắt nhất |

Khuyến nghị mặc định: **B**, vì lý do gốc của vùng cấm là *"nền ngả đỏ thì cảnh báo đỏ mất trọng
lượng"* — mà **trọng lượng đó tỉ lệ với bão hoà**, nên một bán kính cố định vốn đã là xấp xỉ thô.
Chờ Hoà gật rồi mới chạm cổng.

### 3c · Hai khoảng trống nhỏ hơn, cũng nói thẳng

- **Người cần tương phản CAO (WCAG AAA 7:1).** Không bộ nào nhắm. Đo được từ `contrast.test.ts`:
  bậc chữ `--t3` trên pill kính theme sáng đạt **4,58–4,80** — qua AA, còn **rất xa** AAA. Muốn
  phục vụ nhóm này thì cần một nấc thứ ba trong `nacGiamChoi` hoặc một bộ riêng, **chưa có**.
- **Phân biệt bộ bằng màu với người mù màu.** Hai accent gần nhau nhất cách **32°**
  (`binh-do` 215° ↔ `chan-troi` 247°) — với người khó phân biệt lam-tím thì hai bộ này đọc ra
  gần như nhau. Rủi ro thấp vì **bộ vẫn phân biệt bằng HÌNH HỌC**, không chỉ bằng màu; ghi ra để
  không ai sau này dùng accent làm dấu hiệu phân biệt duy nhất.

---

## 4 · ĐÃ LÀM GÌ — và CHƯA làm gì (đọc kỹ mục dưới, đừng đọc mục trên rồi tưởng xong)

**Có biên nhận:**

| việc | bằng chứng |
|---|---|
| sửa drift-guard `--card` sáng | `lib/wallpaper/contrast.ts` · `contrast.test.ts` **23 pass / 0 fail** (trước: 22/1) |
| khai bảng màu 5 bộ + RANGE + cổng | `lib/wallpaper/mau-bo.ts` |
| cổng có hai nửa, 8 ca đột biến | `lib/wallpaper/mau-bo.test.ts` **51 pass / 0 fail** — nằm sẵn trên đường `npm test` |
| không phá gì đang chạy | `npm run tsc` sạch · `npm run soi:trung-tinh` xanh · `sets.test.ts` xanh |

**🔴 CHƯA LÀM — nói trước để không ai tưởng đã xong:**

1. **`mau-bo.ts` CHƯA nối vào `app/globals.css`.** `--accent` trong CSS vẫn là hằng số `#6a57f5`.
   Chọn bộ khác **chưa** đổi màu nhấn của app. Nối token là một lượt ghi vào bề mặt cả app đang
   dùng — cần một writer sản xuất, không làm lén trong một phiếu thiết kế (luật 2).
2. **Chưa có mặt nhìn để người dùng chỉnh.** `WallpaperSettings.tsx` mới cho chọn bộ + nấc giảm
   chói; sáu token của §2 chưa có thanh trượt nào.
3. **Chưa soi trên app thật.** Mọi số ở đây là số **tính được**, không phải ảnh chụp màn. Theo
   luật nghiệm thu của bàn 04 (`docs/control/ban/04.md`), phần **cá tính** vẫn phải qua mắt.
4. **Biên `accentSat` chưa có nguồn nghiên cứu** — đã khai nhãn 🟡, không giấu.

---

## 5 · VIỆC TIẾP THEO — đúng thứ tự phụ thuộc

1. **Hoà quyết §3b** (A / B / C). Mọi việc dưới đây không phụ thuộc mục này, trừ việc có bộ ấm hay không.
2. Nối `--accent` + dải trung tính dẫn xuất từ bộ đang chọn vào `globals.css` (một writer sản xuất).
3. Dựng mặt chỉnh 6 token, mỗi thanh trượt **hiện biên và hiện lý do biên** — range là luật thì
   người dùng phải đọc được luật, không phải đụng tường rồi đoán.
4. Chụp app thật cả hai theme × 5 bộ → `if-design-review` sáu cổng (nghiệm thu của bàn 04).
5. Đo lại nghi ngờ P3 ở trần `accentSat` 0,92, rồi thay nhãn 🟡 bằng nguồn hoặc bằng số.

---

## 6 · NGUỒN

- WCAG 2.2 §1.4.3 (chữ 4,5:1) · §1.4.11 (thành phần phi chữ 3:1) — W3C
- Josef Müller-Brockmann, *Grid Systems in Graphic Design* · Leonardo da Vinci, *prospettiva aerea*
- Mark Rothko · James Turrell (*Skyspace*) · Caravaggio · Vilhelm Hammershøi · Donald Judd · Tadao Ando
- Trong repo: `lib/wallpaper/sets.ts` (năm bộ, 16/08) · `lib/wallpaper/contrast.ts` (đo tại chân
  chữ) · `docs/phieu-giao/P-O-5-bo-hinh-nen-dong.md` · `docs/control/IF-CHUAN-NEN.md` §4 ·
  `docs/GU-PROFILE.md` §1–§2
