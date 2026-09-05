# Trí nhớ phiên — 05/09/2026 · nhánh `nen-checkpoint`

> Bản ghi ĐẦY ĐỦ của phiên, viết để người sau đọc là hiểu, không cần mở lại hội thoại.
> Mọi con số dưới đây là **đo tại nguồn trong phiên này**, không chép từ sổ cũ.

---

## 1 · Tổng quan

Phiên làm bốn việc, theo đúng thứ tự đó: ① đóng lỗi hydrat `/settings` ② gỡ bảng màu ấm gõ cứng
ở `/library/ingest` ③ dựng **cổng chấm màn app thật theo design pattern** — thứ trước nay không
tồn tại ④ dựng bộ cài CP mới có toàn bộ việc trong ngày.

Xuyên suốt phiên có một sợi chỉ lặp lại đủ để thành bài học: **máy soi nói sai về thế giới thay
vì đo nó** — hôm nay bắt được thêm bốn ca, trong đó **ba ca là lỗi của chính tôi**, và cả ba đều
do một cỗ máy tự-kiểm hoặc một phiên phụ bắt, không phải do tôi tự thấy.

---

## 2 · Chi tiết từng mục

### 2.1 · Hydrat `/settings` — React #418/#423 · commit `2266d3b5`

**Đo trên bản DEV** (bản rút gọn không nói ở ĐÂU — đó là lý do phải chạy dev):

```
Prop `disabled` did not match. Server: "" Client: "false"
  at LockScreenSettings (components/settings/LockScreenSettings.tsx:31:63)
```

**Gốc.** `LockScreenSettings` đọc `getLastUserId()` (localStorage) ngay trong thân component.
Máy chủ không có localStorage ⇒ `userId=''` ⇒ nút render `disabled=""`, nấc về mặc định 15.
Trình duyệt ở CÙNG lượt render ấy có id ⇒ `disabled=false`, nấc là giá trị đã lưu. React đối
chiếu hai bên rồi **vứt cả cây máy chủ dựng, render lại toàn bộ gốc bằng máy khách**.

**Chữa.** Lượt render đầu của trình duyệt phải giống hệt máy chủ: khởi tạo bằng hằng số, với
xuống localStorage trong `useEffect` (chạy sau khi hydrat xong).

| | trước | sau |
|---|---|---|
| lỗi trên `/settings` | 11 | **2** |
| lỗi thật | #418 ×8 + #423 + 404 | chỉ còn **404** |

404 còn lại là `GET /api/gu/cad-layout-option` — **ĐÚNG HỢP ĐỒNG**, route tự khai ở đầu tệp:
*"404 nếu user chưa có bản ghi cho kind này (client tự hiểu = chưa học gì, KHÔNG coi 404 là lỗi)"*.
Người dùng mới thì chưa có model. Không phải lỗi.

**Không hồi quy D8** — đo bằng `scripts/soi-mat/do-nac-khoa-man.mjs` (hồ sơ đĩa mới tinh → vào
THẲNG `/settings` ở tab mới → bấm nấc 30 → **đóng hẳn** trình duyệt → mở lại):
đĩa `interiorflow.lockIdleMinutes.<uid> = "30"`, màn hiện `30 phút`.

> 🔴 **`tai-hien-d8.mjs` KHÔNG dùng được cho ca này nữa.** Nó lái `input[type=number][min=1][max=180]`,
> mà ô số tự do **đã bị thay bằng dải nấc bấm** từ 22/08 (Lane K). Chạy lên bản hiện tại thì
> `coONhap:false` và kết cục luôn là `ghi-bi-nuot`. Tôi đã chạy nó, nó báo **MẤT**, và suýt nữa
> tin. Bảy tệp bằng chứng của lượt đó giữ lại kèm `README-sau-va-hydrat.md` nói rõ **đó là phép
> đo lỗi thời, không phải bằng chứng hồi quy**.

**Cửa sổ vô hiệu ~3s là CÓ THẬT** (đo: 1000ms nút còn mờ · 3000ms đã mở) — đúng bằng lúc
`/api/auth/me` chưa về. Đó là hành vi đã được thiết kế và đã có lời giải thích cho người dùng.

---

### 2.2 · `/library/ingest` — 52 hex ấm về token · commit `832721cc`

**Không phải chuyện lint, cũng không phải chuyện gu.** Chụp app thật hai theme:

| | trước | sau |
|---|---|---|
| theme sáng | khối *"Nhận diện cấu kiện"* SÁNG (dùng token) nằm giữa trang TỐI (hex cứng) — **một màn hai hệ màu** | một hệ |
| theme tối | ổn | ổn |

Bằng chứng: `docs/delivery/anh-duyet-mat/ingest-hex/{truoc,sau}-{dark,light}.png`.

Đổi **52 chỗ, chỉ NỀN/CHỮ/VIỀN**:
kem `#EFE9DC`→`--t1` · nâu đen `#1B1712`/`#151109`/`#0B0906`→`--field`/`--panel`/`--bg` ·
xám ngả ấm `#8B887F`→`--t3` · đồng `#C79A63`→`--accent` (đồng đã bị bỏ khỏi vai màu nhấn 16/08) ·
viền `#33302a`/`#2A261F`/`#3A362F`→`--border`.

**GIỮ NGUYÊN màu NGỮ NGHĨA** vì chúng mang tin chứ không phải bề mặt:
`#7C9A6B` tốt-nhất · `#9A6B84` để-loại · `#6B84A8`/`#A88A5B` nguồn ảnh · `#76b900`/`#9FCB4B` nhánh AI.

Bánh cóc `T-cam-hex-inline-app` **43 → 14** (đã hạ trần).

> ⚠️ **CÒN NỢ, nói thẳng:** màn này vẫn dựng bằng inline style, không dùng component hệ thiết kế.
> Lượt này mới đưa MÀU về đúng nguồn — **chưa phải làm-theo-spec, chưa chấm theo design pattern**.

**Kèm trong cùng commit:** `vercel.json` → `git.deploymentEnabled=false`. Bản dựng Vercel đang đỏ
vì thiếu `AUTH_SECRET` và gửi thông báo mỗi lần đẩy; IF là desktop-first nên bản xem trước web
không phải yêu cầu sản phẩm lúc này. Một dòng, gỡ lại được bằng một commit.

---

### 2.3 · Cổng chấm bản vẽ mọc cửa `data-kenh` · commit `1cf952b2`

`soi:thiet-ke` báo **44 artboard · 45 lỗi**, trong đó **27 là L1 "tè le"** (≥2 họ accent/màn).
Bổ theo cung hue thì ba cụm dày nhất **KHÔNG phải accent mà là token có thật** trong `globals.css`:

| cụm | token | hue |
|---|---|---|
| 0° | `--danger` `#e5674f` | 9,6° — **sát NGOÀI** dải cam 15–50° nên rơi vào đếm |
| 150° | `--success` `#46b876` | 145° |
| 180° | `--mau-ai` `#1f7f88` | 187° (`globals.css:44`) |

Chúng cùng hạng với cam-cảnh-báo mà cổng đã miễn trừ từ đầu: hệ thiết kế **bắt buộc** rải chúng.

> 🔴 **LƯỢT VÁ SAI THỨ NHẤT CỦA TÔI, bị chính `--tu-kiem` bắt.** Tôi định miễn trừ bằng cách ĐỌC
> hue ba token đó từ `globals.css` rồi tha mọi màu trong ±14°. Ca ① đỏ ngay: gizmo trục KHÔNG khai
> `data-truc` có đỏ 5° · lục 140° · lam 215° — hai màu đầu rơi trúng dải danger/success ⇒ **gizmo
> lậu thoát tội**. Miễn trừ theo HUE là **ĐOÁN**, mà đoán thì không tách nổi *"đỏ nguy hiểm"* khỏi
> *"đỏ trục X"*. Luật của chính tệp đó đã trả lời từ 01/09: **KHAI BÁO, KHÔNG SUY ĐOÁN**.

Nên `data-kenh` đi đúng cửa cũ. Tự kiểm **6 → 9 ca**, 9 pass 0 fail:
- ⑦ khai thì miễn trừ
- ⑧ **cùng ba màu ấy mà không khai thì VẪN bắt** — chính ca đã bắt lượt vá sai; ai quay lại lối
  tha-theo-hue là đỏ ngay
- ⑨ khai rồi vẫn không rò ra chrome UI

---

### 2.4 · ⭐ Cổng MỚI: chấm MÀN APP THẬT · commit `c26f5a4b` + `4ac58424`

**Khoảng trống đóng ở đây.** `cong-thiet-ke.mjs` chấm BẢN VẼ; bánh cóc chấm MÃ NGUỒN.
**Không cỗ nào chấm thứ người dùng nhìn thấy.** Hệ quả đo được ngay trong ngày: `/library/ingest`
sơn cứng cả một bảng màu nhiều tháng — không cổng nào kêu, vì bánh cóc chỉ **ĐẾM** hex chứ không
biết chúng hợp thành cái gì trên màn.

`scripts/soi-mat/cham-pattern.mjs` mở route thật, đọc màu **đã tính** (`getComputedStyle`) của mọi
phần tử nhìn thấy được, áp đúng luật L1 của cổng bản vẽ, bỏ qua khối khai `data-kenh`/`data-truc`/
`data-mau-vat-lieu`.

Kết quả (cả hai theme): **7 màn · 0 màn tè le**.

`scripts/lib/mau-ho.mjs` — tách lõi `hexToHsl`/`rgbToHsl`/`gomHoAccent`/`boQuaChuan` dùng chung.
Viết hai bản cho hai mặt tiền là đúng bệnh `may-soi-dong-dang` sinh ra để bắt.

> 🔴 **HAI LỖI NGƯỢC CHIỀU CỦA TÔI, cặp này mới là bài học:**
> **② PHÂN KỲ.** Bản đầu `cham-pattern` không mang theo luật bỏ qua cam-cảnh-báo/vật liệu ⇒ cùng
> một màu, cùng một luật, hai cỗ máy phán khác nhau (theme sáng báo oan "Vật liệu" và "Cài đặt").
> **③ ĐỒNG BỘ GIẢ.** Sửa xong ② tôi bê luôn **trần 12 lần/họ** sang — nó báo `/settings` vượt trần
> (hue 210° × 19). Truy: `rgb(24,106,220)` = `#186adc` **chính là `--accent` trình duyệt tính ra
> lúc chạy** (accent đi theo bộ hình nền — QĐ Hoà 01/09), tức 19 chỗ đó là MỘT accent dùng đúng
> chỗ trên một trang đầy công tắc. ⇒ Gỡ trần khỏi mặt tiền app.
> **Luật rút ra:** trần đếm-lần hợp cho BẢN VẼ (artboard tĩnh, mỗi nét là một lựa chọn của người
> vẽ), KHÔNG hợp cho MÀN APP (số lần đi theo số phần tử đang hiển thị). Luật CHUNG là *"một họ
> accent"*; luật ĐẾM LẦN thì mỗi corpus một ngưỡng.

> ⚠️ **SỰ THẬT DỄ ĐỌC NHẦM, tìm ra khi truy ③:** `app/globals.css:19` khai `--accent: #6a57f5`
> (**tím**) nhưng app ĐANG CHẠY tính ra **`#186adc` (lam)**. Ai chỉ đọc tệp khai báo sẽ tin app
> màu tím. `--mau-ai` thì đúng như khai: `#1f7f88`.

---

### 2.5 · Bộ cài — trạng thái thật

**Đã có, tải được ngay** — `v0.1.0`, phát hành 05/09 09:51 giờ VN, máy dựng tự đẩy lên:

| tệp | cỡ | lượt tải |
|---|---|---|
| `InteriorFlow-0.1.0-arm64.dmg` (Mac Apple Silicon) | 268 MB | 7 |
| `InteriorFlow-Setup-0.1.0.exe` (Windows x64) | 213 MB | 0 |

→ https://github.com/tranthaihoatth95-pixel/INTERIORFLOW/releases/tag/v0.1.0

**Ba điều phải nói trước khi mở:**
1. **Chưa ký số.** Mac: chuột phải → *Open*. Windows: SmartScreen → *More info* → *Run anyway*.
   Đúng kỳ vọng bản nội bộ.
2. **Chưa ai mở gói nào trên máy thật.** Máy dựng chỉ chứng minh gói mở được dưới Xvfb (HTTP 200 ·
   CSDL tự dựng 24/24 bảng · 0 `.env` · 0 CSDL · 0 `.claude` lọt vào gói). Mở trên Mac của Hoà là
   **phép đo cuối chưa ai chạy**.
3. **`v0.1.0` dựng từ nhánh integration** — nhánh đó khi thiếu `AUTH_SECRET` thì **âm thầm ký phiên
   bằng hằng số nằm công khai trong mã**. Nhánh checkpoint **chặn thẳng**. Đây là lý do đáng so hai
   bản, không phải chuyện gu.

**Bộ cài MỚI đang dựng:** gộp việc 05/09 vào nhánh `dung-checkpoint` (commit `d96a24d8`), bump
`0.1.0-cp` → **`0.1.1-cp`**. Xung đột khi gộp **chỉ ở phần DANH TÍNH** (tên workflow · nhánh kích
hoạt · tên `.app` · tên artifact) — giữ nguyên phía CP, vì đó là lý do bản CP **cài SONG SONG được
mà không đè dữ liệu** bản integration (`appId com.interiorflow.cp`).

---

## 3 · Tổng kết lại vấn đề

Một bức tranh chung, không phải bốn việc rời:

**Repo có 32 cổng máy, nhưng chúng chấm SỔ và chấm MÃ — không cổng nào chấm THỨ NGƯỜI DÙNG NHÌN
THẤY.** `/library/ingest` sống nhiều tháng với một bảng màu thứ hai; `/settings` ném 9 lỗi hydrat
mỗi lần mở; cả hai đều **xanh trên mọi cổng**. Việc lớn nhất phiên này không phải hai bản vá đó,
mà là **dựng mặt tiền thứ ba của phép chấm: đo trên trình duyệt thật**.

Và trong lúc dựng nó, chính tôi phạm đủ ba kiểu sai mà cỗ máy ấy sinh ra để bắt: **đoán thay vì
khai báo**, **để hai mặt tiền phân kỳ**, **ép hai corpus khác bản chất về cùng một con số**.

---

## 4 · Đánh giá khách quan

**Được:**
- Hai lỗi có thật, đo được trước và sau, có ảnh làm bằng.
- Cổng mới chạy trên app thật, không phải đọc mã.
- Ba lỗi của tôi đều bị bắt **trước khi có ai tin con số** — cơ chế tự-kiểm và quyền-bác-lại đang
  sinh lời thật.

**Chưa được / rủi ro:**
- `soi:thiet-ke` **không nằm trong CI** (CI chỉ chạy `npm test` + 4 cổng `soi:frontier`/`contract`/
  `cam-dien`/`hinh-hoc` + `build`) ⇒ cổng thiết kế đỏ lâu nay mà không chặn ai. `cham-pattern`
  cũng chưa vào CI (nó cần server đang chạy).
- **`cham-pattern` là SÀN, không phải trần** — chỉ thấy phần tử ĐANG hiển thị; panel đóng, tab
  chưa mở, trạng thái lỗi chưa xảy ra thì không vào phép đo. Ba chặng 2D/3D/Trình bày **chưa đo**
  (cần có dự án trước).
- 44 bản vẽ `.dc.html` + `canvas.json` ở gốc repo là **một canvas Claude Design**, thiết kế lần cuối
  **26/08** — trước cả north star `N-1…N-20` (04/09). `ACTIVE-DESIGN-CONTEXT.md` **không liệt nó là
  thẩm quyền** (thẩm quyền là `EXS-A…L` + `REF-VISUAL-EXS` + `docs/mocks/`). ⇒ đang chấm một corpus
  chưa được khai là thẩm quyền. **Chưa quyết**, ghi ra để không ai đánh bóng nhầm lịch sử.
- **CI `kiem` đang ĐỎ trên `c26f5a4b`** — và **không phải do phiên này**: `soi:ban --chan` thoát 1
  vì "MÙ", nó không đọc được sổ phiếu `/home/runner/PROJECT/SHARED/LOG/agent-handoffs.jsonl` (đường
  dẫn không tồn tại trên máy CI). Cùng lệnh chạy tại máy này thì thoát 0. **Chưa truy xong.**

---

## 5 · Hướng xử lý — nhiều góc

**Cho `soi:ban` đỏ trên CI:**
- (a) Cho `--chan` coi "MÙ" là **cảnh báo**, không phải lỗi — nhanh, nhưng làm mất luôn tín hiệu.
- (b) Cấp cho CI một sổ phiếu rỗng hợp lệ để nó soi được thật — đúng bản chất hơn, tốn hơn.
- (c) Bỏ `soi:ban` khỏi `test:so-sach` trên CI, giữ ở máy có sổ — thành thật nhất về phạm vi.

**Cho corpus bản vẽ:**
- (a) Khai rõ trong `ACTIVE-DESIGN-CONTEXT.md` canvas 44 bản vẽ là *lịch sử*, và cổng chỉ chấm nó
  ở mức không-chặn.
- (b) Nâng nó lên thẩm quyền bằng cách chấm lại theo `N-1…N-20` — tốn mắt Hoà, là tài nguyên khan
  nhất.

**Cho `cham-pattern`:**
- (a) Mở rộng sang ba chặng (cần tạo dự án trong kịch bản).
- (b) Đưa vào CI bằng cách dựng server trong workflow.

---

## 6 · Đề xuất

1. **`soi:ban` → hướng (c)**, vì nó là câu trả lời TRUNG THỰC: máy không có sổ thì không phán được,
   và giả vờ phán được (hướng a) đúng là thứ luật repo cấm. Hướng (b) hợp lý nhưng dựng sổ giả để
   qua cổng thì lại là một kiểu bịa khác.
2. **Corpus bản vẽ → hướng (a)**, vì đánh bóng 27 bản vẽ vẽ trước north star là đánh bóng lịch sử —
   đúng thứ `CONTEXT DETOX` 04/09 cấm.
3. **`cham-pattern` → mở rộng ba chặng TRƯỚC, vào CI SAU.** Giá trị nằm ở chỗ nó soi được màn nghề
   (2D/3D/Trình bày) — đó mới là nơi IF khác mọi app khác, và là nơi chưa cỗ máy nào rờ tới.

---

## 7 · Việc còn treo

| việc | trạng thái |
|---|---|
| Lane dán nhãn `data-kenh` cho 27 bản vẽ | **đang chạy**, 16/27 tệp đã đụng, chốt mốc an toàn `d7a3f752` |
| Bộ cài `0.1.1-cp` | **đang dựng** từ `d96a24d8` |
| CI `kiem` đỏ vì `soi:ban` MÙ | **chưa truy xong** |
| Mở bộ cài trên máy Mac thật | **chưa ai làm** |
| Ba chặng 2D/3D/Trình bày chưa qua `cham-pattern` | chưa |
| Repo để riêng tư | **tôi không có quyền** |

---

## 8 · Commit trong phiên (nhánh `nen-checkpoint`)

```
2266d3b5  fix(hydrat)      /settings đọc localStorage lúc render → #418/#423, 11 lỗi còn 2
832721cc  fix(ingest)      một màn hai hệ màu — 52 hex ấm về token; tắt triển khai Vercel
1cf952b2  feat(cong-tk)    cửa khai báo `data-kenh` + 3 ca tự kiểm (6→9, 9 pass)
c26f5a4b  feat(cham-pattern) chấm MÀN APP THẬT + tách lõi gom họ màu
4ac58424  fix(cham-pattern)  dùng chung luật BỎ QUA; KHÔNG bê trần đếm-lần của bản vẽ sang app
d7a3f752  wip(bản vẽ)      lane dán nhãn — mốc an toàn, chưa nghiệm thu
```

Nhánh `dung-checkpoint`: `d96a24d8  merge(cp)` — gộp để dựng bộ cài mới.
