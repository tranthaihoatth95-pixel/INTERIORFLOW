# IF · CHUẨN BỐ CỤC — lấp bốn lỗ §5 của `IF-CHUAN-NEN.md`

> Lập 05/09/2026. Tệp này **nối tiếp** `docs/control/IF-CHUAN-NEN.md`, không thay nó.
> `IF-CHUAN-NEN` giữ tương phản · thang chữ · sàn chữ Việt · 5 bộ màu. Tệp này giữ **bố cục ·
> vùng bấm · Gestalt · chuyển động** — đúng bốn mảng §5 tự khai là trống, và cả bốn lệnh kiểm
> của nó đều ra **0**.
>
> **Vì sao nó tồn tại:** 05/09 trọng tài phải viết *"ba phát hiện về khoảng trống tôi chỉ chấm
> được bằng hợp đồng màn và ca hỏng cũ, **không bằng ngưỡng đo được** — ai muốn cãi thì hiện
> không có con số nào phân xử."* Không có thước thì mọi tranh cãi thị giác thành cãi gu.

---

## 0 · ĐÃ CÓ — KHÔNG NGHIÊN CỨU LẠI

[Đ2] bắt buộc. Những thứ dưới đây **đã có nguồn chống lưng trong repo**; tệp này **không** đụng
vào, không diễn giải lại, không "cải tiến".

| đã có ở đâu | phủ cái gì | quan hệ với tệp này |
|---|---|---|
| `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` | **NT-1..18**, cột *Nguồn chống lưng* đã đầy (D5 · Corona · Twinmotion · Miro · HIG) | NT-1/NT-2 (một hành động chính · chrome lùi lại) là **thứ bậc định tính**. Tệp này **không** lặp lại chúng, chỉ thêm phần **đo được** |
| `docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` | **KB-1..4** — thanh công cụ một khuôn · EmptyState chung · thumbnail strip · trang cấp app | khuôn thi công, không phải ngưỡng đo |
| `docs/control/IF-CHUAN-NEN.md` §1–§4 | tương phản WCAG 2.2 AA · thang mô-đun · **V-1/2/3/6 sàn chữ Việt** · 5 bộ màu | **V-6 (cỡ chữ ≥12px) thắng mọi chuẩn quốc tế** — §2 dưới đây phải nhường nó |
| `docs/IF-KIEN-TRUC-OS.md` | **N-10** 13 cờ đỏ · **N-11** thứ bậc editorial · **N-16** máy không phán được gu · **N-17** bố cục trước, đánh bóng sau | N-16 là **trần** của tệp này. Đọc §1.3 |
| `app/globals.css` + `lib/ui/nhip.ts` | thang bo 6/10/14/20 · token mật độ `--tap/--row/--gap/--pad-card/--fs-ui` · thang nhịp `--nhip-*` · `--ease-apple` | tệp này **chấm** các giá trị đó, không đặt lại |
| `scripts/soi-hinh-hoc.mjs` | bo góc ngoài thang | ⛔ máy mới **không** đếm `border-radius`. Hai máy cùng đếm một thứ là hai con số cãi nhau |
| `scripts/soi-mat/do-bo-cuc.mjs` | % ô trống theo cột trên app thật | máy đo mới **mở rộng** cách đo này, không đẻ đường thứ hai |
| `docs/delivery/LEGACY-DESIGN-QUARANTINE.md` | 12 hướng đã bị đè | ⛔ không hướng nào trong đó được hồi sinh qua cửa "chuẩn" |

---

## 1 · BỐ CỤC · LƯỚI · THỨ BẬC THỊ GIÁC

### 1.1 · Bảng chuẩn

| chuẩn | ngưỡng | nguồn | đo bằng lệnh | trạng thái cổng |
|---|---|---|---|---|
| **BC-1 · NHỊP LƯỚI** — mọi *khoảng cách* gõ cứng (`padding` · `margin` · `gap`) là bội số **4px** | bội số 4; `\|v\|<4px` = nấc vi mô, tha | Material Design: component trên **lưới nền 8dp**, phần tử nhỏ + chữ trên **4dp** — `m1.material.io/layout/responsive-ui.html`; Android Design *Metrics & Grids*. **Neo cho IF suy từ token của chính IF** (§1.2) | `npm run soi:bo-cuc` | 🟢 **CÓ CỔNG** · bánh cóc `BC-LUOI-4` |
| **BC-2 · ĐỘ DÀI DÒNG** — khối văn xuôi trong **45–75 ký tự/dòng** | 45 ≤ ch ≤ 75 (66 lý tưởng) | Bringhurst, *The Elements of Typographic Style* §2.1.2 — *"anything from 45 to 75 characters is widely regarded as a satisfactory length of line for a single-column page"*. ISBN 978-0-88179-206-5 | tĩnh: `npm run soi:bo-cuc` · sống: `PORT=<cổng> node scripts/soi-mat/do-chuan-bo-cuc.mjs` | 🟢 **CÓ CỔNG** (tĩnh, chỉ đọc được `ch`) · 🟡 phần sống chỉ báo cáo |
| **BC-3 · TỈ LỆ GÓI HỘP** — bao nhiêu % nhóm được tách bằng **vùng chung** (nền/viền/bóng) thay vì bằng khoảng cách | ⛔ **KHÔNG CÓ NGƯỠNG CÓ NGUỒN** | cơ chế thì có nguồn (Palmer 1992, §3), **ngưỡng thì không** | `PORT=<cổng> node scripts/soi-mat/do-chuan-bo-cuc.mjs` → `tiLeGoiHop` | 🔴 **KHÔNG DỰNG CỔNG** — chỉ báo số, xem §1.3 |
| **BC-4 · THỨ BẬC THỊ GIÁC** — cái gì trội, cái gì đỡ, cái gì nền | ⛔ **KHÔNG ĐO ĐƯỢC** | N-16: *"máy không quyết được bố cục · gu · thứ bậc thị giác"* | — | ⛔ **MẮT NGƯỜI** — khai thẳng, không giả vờ đo |

### 1.2 · Vì sao lưới **4** chứ không phải 8 — suy từ token của IF, không bê số của Material

Material đặt component lên 8dp. Nhưng bê thẳng 8 vào IF là **mượn số của người khác rồi gọi là
chuẩn** (điều luật nguồn cấm). Neo đúng phải đến từ hệ của chính IF — đo `app/globals.css`:

```
--gap 8   --pad-card 8px 12px   --row 28   --tap 32   --tap-lg 44   (cảm ứng: 44/44/12/12,16/15)
```

Cả sáu là **bội số 4**. Nhưng **12 · 28 · 44 KHÔNG phải bội số 8**. ⇒ Hệ của IF vốn đã đứng trên
**lưới 4**, và nó tự mâu thuẫn nếu ép lên 8. Lưới 4 là thứ mô tả đúng cái đang có, không phải cái
đi mượn.

⇒ **Mọi giá trị lệch lưới 4 là chỗ đi vòng qua token**, không phải một lựa chọn thiết kế.

### 1.3 · Ranh giới thật của máy — chỗ này phải đọc, không được lướt

Máy soi bố cục **đẩy lùi** đường biên N-16, nó **không xoá** đường biên đó.

| máy làm được | máy KHÔNG làm được |
|---|---|
| khoảng cách có trên lưới không | khoảng cách đó có **đúng chỗ** không |
| dòng dài bao nhiêu ký tự | đoạn đó có **đáng đọc** không |
| bao nhiêu % nhóm gói trong hộp | hộp đó **nên có** hay không |
| nhóm nào có tỉ lệ khoảng cách ngược | **cái gì nên trội** trên màn này |

🔴 **BC-3 CÓ SỐ MÀ KHÔNG CÓ NGƯỠNG, và tôi cố ý không bịa ngưỡng.**
Đo được 05/09 trên app thật: nhóm tách bằng **vùng chung** áp đảo nhóm tách bằng **khoảng cách**
— Home 14/18 · Files 11/14 · Cài đặt 6/8. Con số này **gợi đúng** cờ đỏ N-10 `thẻ-cho-mọi-thứ`,
nhưng *"bao nhiêu phần trăm là quá nhiều"* **không có nguồn công bố nào trả lời**. Đặt một con số
ở đây là đúng thứ mục §2 ranh giới vai cấm: *im lặng bịa một chuẩn để lấp chỗ trống*.
⇒ Số này **trình cho mắt Hoà**, không chặn cổng.

### 1.4 · Đo hiện trạng — app THẬT, 05/09

**Tĩnh** (`npm run soi:bo-cuc`, 584 tệp `components/` + `app/`):

```
BC-1  2786 lệch / 5072 khoảng cách đã xét        ⇒ 55% NGOÀI LƯỚI
      theo họ:  css 1184 · jsx 793 · tailwind-nửa-nấc 791 · tailwind-tuỳ-ý 18
      giá trị:  6px×1142 · 10px×706 · 14px×241 · 5px×217 · 7px×166 · 9px×125
      top tệp:  CadEditor 145 · files-mock-css 73 · library-sheet-css 73 · Inspector 47
BC-2  0 lệch / 4 khai báo max-width theo `ch`     ⇒ ĐẠT
```

⭐ **Nguồn lớn nhất của lệch KHÔNG phải ai đó chọn số xấu — là THANG PHỤ CỦA TAILWIND lệch thang
của IF.** `gap-1.5`=6px (230 nơi) · `py-1.5`=6px (126) · `px-2.5`=10px (104). Cộng nửa nấc = **791
/ 2786**. Đây là lỗi hệ thống, phải chữa bằng hệ thống (luật 7), không phải sửa từng chỗ.

**Sống** (`scripts/soi-mat/do-chuan-bo-cuc.mjs`, 1440×900, tài khoản thật, 1 dự án thật) — xem §5.

### 1.5 · Ba thứ mắt thấy 05/09 mà **chưa chuẩn nào phủ**

Khai ra để chúng không trôi qua thành "đạt" bằng cách im lặng. Cả ba đọc từ ảnh app thật
`/tmp/mat-3255/`:

1. **Ô mồ côi cuối lưới.** `/files` xếp 5 thẻ trên lưới 4 cột ⇒ thẻ thứ 5 đứng một mình, để trống
   ~843px ngang. Đo được (số phần tử mod số cột), **chưa có nguồn** nói bao nhiêu là hỏng.
2. **Hộp rỗng do ép bằng chiều cao.** `/settings`: thẻ *Giao diện* và *Nơi lưu file* nằm cùng hàng,
   thẻ trái thừa ~250px đáy trống. Trúng cờ đỏ N-10 `hộp rỗng khổng lồ` — nhưng đó là **cờ**, không
   phải ngưỡng.
3. **Cùng một tình huống, hai cách xử.** `/cad` canvas trống **có** EmptyState; `/present` canvas
   trống ~1135×785 **không có gì**. Đây là lệch **KB-2** (EmptyState chung) đã chốt từ 14/08, không
   phải chuẩn mới.

---

## 2 · VÙNG BẤM

| chuẩn | ngưỡng | nguồn | đo bằng lệnh | trạng thái cổng |
|---|---|---|---|---|
| **VB-1 · SÀN AA** — đích chạm ≥ **24×24 CSS px** | 24×24, **Level AA** | **WCAG 2.2 SC 2.5.8 Target Size (Minimum)** — `w3.org/TR/WCAG22/#target-size-minimum` | `PORT=<cổng> node scripts/soi-mat/do-chuan-bo-cuc.mjs` → `duoi24` | 🟡 **ĐO SỐNG, chưa bánh cóc** — §2.2 |
| **VB-2 · MIỄN TRỪ KHOẢNG CÁCH** — đích <24px vẫn đạt nếu vòng tròn ⌀24 đặt giữa hộp bao **không cắt** vòng/đích khác | tâm-tới-tâm ≥ 24px | cùng SC 2.5.8, mệnh đề *Spacing* | cùng lệnh → `duoi24ThieuKhoangCach` | 🟡 đo sống · **xấp xỉ**, xem ⑦b |
| **VB-3 · SÀN CẢM ỨNG** — con trỏ thô thì ≥ **44×44** | 44×44 | **Apple HIG** (trích nguyên văn `developer.apple.com/design/tips`: *"Create controls that measure at least 44 points x 44 points so they can be accurately tapped with a finger."*) · **WCAG 2.1 SC 2.5.5** Target Size (Enhanced), **Level AAA** | cùng lệnh → `duoi44`, chạy trong ngữ cảnh `(hover:none) and (pointer:coarse)` | ✅ **IF ĐÃ THI HÀNH BẰNG TOKEN** — §2.1 |

### 2.1 · Một chỗ dễ chấm oan — **44 KHÔNG phải sàn của desktop**

Đo sống ra *"84% đích < 44px trên Home"*. Con số đó **đúng mà vô nghĩa** nếu đọc sai: 44 là ngưỡng
cho **ngón tay**, không phải cho chuột. Đây đúng **tầng ② thang bối cảnh** mà `IF-CHUAN-NEN` §000
cảnh báo — chấm bằng một thang khi bối cảnh thuộc thang khác.

✅ **IF đã làm đúng và làm bằng token**, `app/globals.css`:

```
:root                                        --tap: 32px   --tap-lg: 44px
@media (hover:none) and (pointer:coarse)     --tap: 44px   --row: 44px   --tap-chinh: 56px
```

⇒ **VB-1 (24) áp cho MỌI con trỏ** — nó là AA, không phân biệt thiết bị.
⇒ **VB-3 (44) chỉ áp khi con trỏ thô.** Chấm bản desktop bằng 44 là bịa một lỗi không có.

### 2.2 · Vì sao chưa dựng bánh cóc cho vùng bấm
Kiểm lại: `grep -c 'vung-bam\|tap-target' scripts/foundation-tran.json` → **0** khoá trần.

Kích thước đích **không đọc được từ mã tĩnh** — nó là kết quả của lớp CSS + nội dung + khung chứa
lúc chạy. Một cổng tĩnh đoán con số này sẽ báo oan hàng loạt, đúng kiểu hỏng đã trả giá **bốn lần
trong ngày 05/09**. ⇒ Đo sống trước, đủ chuỗi ổn định rồi mới khoá trần. Khai thẳng còn hơn dựng
một cổng không tin được.

---

## 3 · GESTALT

### 3.1 · Bảng chuẩn

| chuẩn | ngưỡng | nguồn | đo bằng lệnh | trạng thái cổng |
|---|---|---|---|---|
| **GT-1 · HÌNH DẠNG CỦA LUẬT** — nhóm hoá theo khoảng cách là chuyện **TỈ LỆ**, không phải số px tuyệt đối | luật phải viết bằng **tỉ lệ** | **Kubovy & Wagemans 1995**, *Grouping by Proximity and Multistability in Dot Lattices*, **Psychological Science** — *Pure Distance Law*: sức nhóm hoá **suy giảm theo hàm mũ của khoảng cách TƯƠNG ĐỐI**. DOI `10.1111/j.1467-9280.1995.tb00597.x` | — (là luật về *cách viết luật*) | ✅ đã thi hành trong GT-2 |
| **GT-2 · SÀN CỨNG** — khoảng **giữa-nhóm** phải **lớn hơn** khoảng **trong-nhóm** | tỉ lệ `giữa/trong` **> 1** | suy thẳng từ nguyên lý gần nhau (Wertheimer 1923; Palmer & Rock) + PDL. **Không có hằng số nào bịa thêm** | `PORT=<cổng> node scripts/soi-mat/do-chuan-bo-cuc.mjs` → `nhomTiDuoi1` | 🟡 đo sống, chưa bánh cóc — mẫu còn nhỏ |
| **GT-3 · NGƯỠNG DỄ CHỊU** — tỉ lệ ≥ **1,5** | ≥ 1,5 | ⛔ **KHÔNG CÓ NGUỒN — đây là QUY ƯỚC CỦA IF**, không phải chuẩn ngành | cùng lệnh | 🔴 **không chặn** — nhãn quy ước, ai cũng cãi được |
| **GT-4 · VÙNG CHUNG MIỄN TRỪ GT-2** — nhóm tách bằng nền/viền/bóng thì khe = 0 là **ĐÚNG** | khe 0 hợp lệ khi có vùng chung | **Palmer 1992**, *Common region: a new principle of perceptual grouping*, **Cognitive Psychology** 24(3):436-447, PMID `1516361` | đã cài trong máy đo (bỏ qua nhóm có vùng chung) | ✅ đã thi hành |

### 3.2 · 🔴 MỘT NGUỒN BỊ BÁC — ghi lại để không ai nhặt lại

Tra Gestalt gặp con số này lặp trên nhiều blog thiết kế:

> *"Palmer's proximity studies (1992) found that elements placed within 40 pixels were grouped
> together 89% of the time, while elements beyond 120 pixels were perceived as separate groups
> in 94% of cases."*

**Nó KHÔNG có trong Palmer 1992.** Bài đó là *Common region: a new principle of perceptual
grouping* (Cognitive Psychology 24:436-447) — nó đề xuất nguyên lý **vùng chung**, không công bố
ngưỡng px nào. Ba lượt tra (ERIC · PubMed · ScienceDirect · Scholarpedia) **không lượt nào** thấy
40px/120px/89%.

⇒ **Cấm dùng bộ số này.** Nó có đủ hình dạng của một chuẩn — có tên, có năm, có phần trăm — nên nó
trôi qua audit rất dễ. Và nó **sai đúng chỗ nguy hiểm**: một ngưỡng **px tuyệt đối**, trong khi
khoa học thật (PDL, GT-1) nói nhóm hoá là **tương đối**. Chép nó vào là đóng đinh một con số sai
bản chất vào nền của app.

📌 Đây chính là ca luật nguồn nói tới: *"cấm mượn con số của một app rồi gọi nó là chuẩn"* — bản
nặng hơn, vì đây là mượn con số **của một bài báo không hề nói câu đó**.

---

## 4 · CHUYỂN ĐỘNG

### 4.1 · Bảng chuẩn

| chuẩn | ngưỡng | nguồn | đo bằng lệnh | trạng thái cổng |
|---|---|---|---|---|
| **CD-1 · TRẦN LUỒNG SUY NGHĨ** — mọi chuyển động **không lặp** phải kết thúc **< 1s** | < 1000ms | **NN/g — Nielsen, *Response Time Limits*** (`nngroup.com/articles/response-times-3-important-limits/`): *"1.0 second is about the limit for the user's flow of thought to stay uninterrupted"*. Gốc: Miller 1968 · Card et al 1991; Nielsen, *Usability Engineering*, ISBN 978-0-12-518406-9 | `node scripts/kiem-nhip.mjs` (§4.2) | ✅ **ĐẠT 5/5** |
| **CD-2 · TRONG THANG CÔNG BỐ** — giá trị nhịp nằm trong dải Material 3 | 50ms ≤ v ≤ 1000ms | **Material 3** duration token `short1`=50 … `extra-long`; các nấc đã đối chiếu: short1 50 · short2 100 · medium1 250 · medium2 300 · long1 450 · long2 500 | cùng lệnh | ✅ **ĐẠT 5/5** |
| **CD-3 · MỘT ĐƯỜNG CONG** — cả app dùng đúng một đường cong | 1 | `lib/ui/nhip.ts` tự khai + `--ease-apple` | `grep -c 'cubic-bezier(0.32, 0.72, 0, 1)' app/globals.css` | ✅ đã có, `F-MOTION-TOKEN` canh việc **dùng token** |
| **CD-4 · VÒNG LẶP NỀN được miễn CD-1** | — | CD-1 nói về **phản hồi một thao tác**; vòng quay chờ không phải phản hồi | — | ✅ đã ghi sẵn trong `foundation-tran` `_siet-05-09` |

### 4.2 · Kết — **mảng ④ ĐẠT, và đây là mảng duy nhất đạt sẵn**

`lib/ui/nhip.ts` khai 5 nhịp theo **vai trò**, không theo cỡ hình:

| nhịp | ms | < 1000 (CD-1) | trong 50–1000 (CD-2) |
|---|---|---|---|
| `bam` phản hồi bấm | 130 | ✅ | ✅ |
| `vien` viên ngữ cảnh | 170 | ✅ | ✅ |
| `bang` bảng nở từ viên | 220 | ✅ | ✅ |
| `nguCanh` chuyển ngữ cảnh sâu | 300 | ✅ | ✅ |
| `bienHinh` biến hình lớn | 460 | ✅ | ✅ |

⇒ §5 của `IF-CHUAN-NEN` ghi *"có cổng canh **dùng** token, không canh **giá trị** token có đúng
nghiên cứu không"*. **Nay đã canh, và giá trị đúng.** Lỗ này đóng bằng một phép kiểm, không phải
bằng một đợt sửa mã.

⚠️ **Một chỗ dễ chấm oan, ghi trước:** ngưỡng **0,1s** của NN/g nói về lúc **phản hồi BẮT ĐẦU**
(*"directly causing something to happen"*), **không** phải thời lượng animation. `bam = 130ms` là
thời gian hiệu ứng *chạy xong*, còn nó *bắt đầu* ngay khi bấm. Dùng 0,1s để phán 130ms là sai là
so hai đại lượng khác nhau.

---

## 5 · ĐO SỐNG HIỆN TRẠNG — app thật, 1440×900, 05/09

Lệnh: `PORT=3255 MAN='HOME:/,FILES:/files' node scripts/soi-mat/do-chuan-bo-cuc.mjs`
Tài khoản thật, 1 dự án thật, 1440×900, nền sáng.

**Lượt chạy trọn vẹn đã nghiệm thu (2 màn — Home + Files):**

```
vùng bấm   : 4 đích <24px · 40 đích <44px / 48 đích
             0 đích <24px KHÔNG đủ khoảng cách 24px       ⇒ SC 2.5.8 mệnh đề spacing: ĐẠT
nhịp lưới  : 208 / 391 khoảng cách TÍNH RA ngoài lưới 4px  ⇒ 53%
độ dài dòng: 2 / 3 khối văn bản ngoài 45–75ch             ⇒ /files có khối 119ch
gestalt    : 1 / 7 nhóm có tỉ lệ giữa/trong < 1
             25 nhóm tách bằng VÙNG CHUNG thay vì khoảng cách  ⇒ tiLeGoiHop /files = 79%
```

| mảng | số đo | đọc thế nào |
|---|---|---|
| **VB-1** đích < 24px | 4 đích; **0 ca thiếu khoảng cách 24px** | sàn AA **đạt qua mệnh đề spacing**. Ca đáng soi bằng mắt: tay cầm panel **14×858** (`.pe-panel-toggle`) — rộng 14px, dưới sàn, nhưng hình thuôn dài nên phép "vòng tròn giữa hộp bao" **không đại diện tốt** (xem ⑦b·4) |
| **VB-3** đích < 44px | 40/48 | ✅ **đúng theo thiết kế** — desktop dùng `--tap:32`, 44 chỉ áp khi con trỏ thô (§2.1). Đây **không** phải lỗi |
| **BC-1** nhịp lưới | 53% ngoài lưới | khớp hướng với số tĩnh 55%. Đo 6 màn ở lượt trước cho tới **73%** ở `/materials` (`10px×122`) |
| **BC-2** độ dài dòng | 2/3 khối ngoài dải; `/files` **119ch** | ⚠️ cổng tĩnh báo **0** vì nó chỉ đọc được `max-width` khai bằng `ch`. **Tĩnh và sống bù nhau, không thay nhau** — đây là bằng chứng cụ thể cho câu đó |
| **GT-2** tỉ lệ nhóm | 1/7 tỉ lệ < 1 | sau khi trừ nhóm tách bằng vùng chung. Lượt 5 màn trước cũng **1** ca |
| **BC-3** tỉ lệ gói hộp | `/files` **79%** · lượt 5 màn: Home 14/18 · Files 11/14 · Cài đặt 6/8 | số cao — **gợi** cờ đỏ N-10 `thẻ-cho-mọi-thứ`, **không phán** (§1.3) |

---

## 6 · ⑦b · CHƯA CHẮC / CHƯA KIỂM

1. 🔴 **NĂM NGUỒN GỐC KHÔNG TẢI ĐƯỢC TỪ MÔI TRƯỜNG NÀY** — `w3.org` · `m3.material.io` ·
   `m1.material.io` · `m2.material.io` · `nngroup.com` · `webtypography.net` đều bị chặn ở tầng
   proxy. Số của WCAG 2.5.8 (24px) · 2.5.5 (44px) · lưới Material 4/8dp · dải nhịp M3 · ba mốc
   thời gian NN/g **lấy từ nguồn thứ cấp trích lại**, không phải từ bản gốc. Chúng là những con số
   rất phổ biến và ba nguồn thứ cấp độc lập khớp nhau, **nhưng tôi không tự tay đọc bản gốc**.
   **Ngoại lệ đã đọc trực tiếp:** Apple HIG 44pt (`developer.apple.com/design/tips`, trích nguyên
   văn) · Kubovy & Wagemans 1995 (trang tạp chí) · Palmer 1992 (ERIC/PubMed).
   ⇒ Ai chạy được ngoài proxy nên **xác minh lại 5 dòng đó**.
2. **Bringhurst §2.1.2** — số hiệu mục lấy theo bản web-applied (`webtypography.net/2.1.2`, không
   tải được). Nội dung 45–75/66 khớp nhiều nguồn; **số hiệu mục thì chưa tự kiểm**.
3. **Xấp xỉ ký tự/dòng** dùng `bề rộng ký tự ≈ 0,5 × cỡ chữ`. Đủ dùng để so 119ch với 75ch, **không
   đủ** để cãi nhau ở ranh giới 74 ↔ 76.
4. **VB-2 xấp xỉ ở đích thuôn dài.** Miễn trừ khoảng cách của 2.5.8 tính vòng tròn đặt giữa **hộp
   bao**; với tay cầm 14×858 thì tâm hộp bao không đại diện cho hình. Ca này **phải mắt người**.
5. **Mẫu Gestalt còn nhỏ** — sau khi trừ nhóm có vùng chung, chỉ còn **2–4 nhóm/màn** đủ điều kiện
   xét proximity thuần. **Không đủ để khoá trần**, đó là lý do GT-2 chưa có bánh cóc.
6. **Chưa đo ở khổ khác 1440×900, chưa đo nền tối, chưa đo `(pointer:coarse)`.** Mọi kết luận về
   VB-3 ở ngữ cảnh cảm ứng là **suy từ token**, không phải đo.
7. **Chưa mở 3 màn chặng** (`/cad` `/render` `/present`) trong máy đo — chúng đòi dự án; ảnh tĩnh
   thì có, số thì chưa.
7b. 🔴 **BẢN HỢP NHẤT của máy đo mới chạy trọn trên 2 MÀN, không phải 6.** Số của 6 màn (`/materials`
   73%, `/library` 84ch…) đến từ **hai lượt chạy trước khi hợp nhất** — cùng phép đo, nhưng không
   phải cùng một lần chạy. Nguyên nhân rất tầm thường và đáng ghi: tôi phóng nhiều phiên Chromium
   liên tiếp, **máy cạn RAM (13,5/16 GB, load 32) và máy chủ dev 3255 bị hạ**. Đã dựng lại 3255 và
   chạy lại để nghiệm thu bản hợp nhất. ⇒ Ai cần con số 6 màn trong **một** lượt thì chạy lại lệnh
   với `MAN` đầy đủ, **từng vài màn một**.
8. `soi:bo-cuc` **chưa nối vào `npm test`.** Nó chạy được và có trần, nhưng chưa nằm trên đường ai
   cũng đi qua ⇒ theo đúng bài học `_siet-30-08` (*"máy soi ngoài cổng là máy soi không tồn tại"*),
   nó **chưa thật sự chặn được ai**. Việc nối là quyết định của bàn thi công, không phải của bàn này.
9. **2786 chưa được audit toàn phần.** Tôi mở **16 dòng** thật (`library-sheet-css.ts` ·
   `CadEditor.tsx`) ⇒ 16/16 dương thật, 0 báo oan. 16 mẫu **không chứng minh** cả 2786 đều đúng.
10. **`ProjectSelect.tsx` (46 vi phạm) nằm trong sổ mã chết** của `LEGACY-DESIGN-QUARANTINE` §mã
    chết. Trần 2786 vì thế **gánh cả nợ của mã không ai chạy** — dọn mã chết sẽ hạ trần mà không
    sửa gì thật.

---

## 7 · NGUỒN

- **WCAG 2.2** SC 2.5.8 Target Size (Minimum), AA — `w3.org/TR/WCAG22/#target-size-minimum`
- **WCAG 2.1** SC 2.5.5 Target Size (Enhanced), AAA — `w3.org/TR/WCAG21/#target-size`
- **Apple HIG / Design Tips** — `developer.apple.com/design/tips` *(đọc trực tiếp)*
- **Material Design** lưới 8dp/4dp — `m1.material.io/layout/responsive-ui.html`
- **Material Design 3** easing & duration tokens — `m3.material.io/styles/motion/easing-and-duration/tokens-specs`
- **Nielsen**, *Response Time Limits* — `nngroup.com/articles/response-times-3-important-limits/`;
  *Usability Engineering*, ISBN 978-0-12-518406-9
- **Bringhurst**, *The Elements of Typographic Style*, §2.1.2 — ISBN 978-0-88179-206-5
- **Kubovy & Wagemans (1995)**, *Grouping by Proximity and Multistability in Dot Lattices*,
  Psychological Science — DOI `10.1111/j.1467-9280.1995.tb00597.x`
- **Palmer (1992)**, *Common region: a new principle of perceptual grouping*,
  Cognitive Psychology 24(3):436-447 — PMID `1516361`
- ⛔ **BỊ BÁC:** *"Palmer 1992 · 40px/120px/89%"* — xem §3.2, con số này không tồn tại trong bài gốc.
  Kiểm chưa ai chép nó vào repo: `grep -rn "40 pixel" docs/ --exclude=IF-CHUAN-BO-CUC.md` → **0 dòng**.
  Kiểm bài gốc: mở `pubmed.ncbi.nlm.nih.gov/1516361/` + `eric.ed.gov/?id=EJ450926` — cả hai mô tả
  bài là *đề xuất nguyên lý vùng chung*, không nêu ngưỡng px nào.
  ⚠️ Cờ `--exclude` là bắt buộc: **chính tệp này** có chứa chuỗi đó (để cảnh báo), nên bỏ cờ đi
  thì lệnh tự bắt trúng mình và trả ra 3 — đúng kiểu hỏng đã xảy ra 4 lần ngày 05/09.
