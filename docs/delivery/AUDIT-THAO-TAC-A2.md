# AUDIT THAO TÁC — LÀN A2 · CHẶNG 2D KỸ THUẬT

> Chạy trên app THẬT `http://localhost:3210` (bản `next start`), nhánh `nen-checkpoint`,
> tài khoản `audit@if.test`. Mọi kết luận dưới đây đến từ **thao tác thật bằng Playwright**
> (Chromium 1194), không từ đọc mã — đúng luật `N6`. Đọc mã chỉ dùng để *giải thích* thứ đã thấy.
>
> Ảnh + file đầu ra: `docs/delivery/anh-a2/` · script: `/tmp/a2-*.mjs` · ảnh gốc: `/tmp/a2-anh/`
>
> **KHÔNG sửa một dòng mã sản phẩm nào.** Chỉ tạo báo cáo này + thư mục ảnh.

---

## 1 · BẢNG PHỦ

### 1a · Bốn ca × hai lối nhập

| Ca | Chuột + bàn phím | Cảm ứng (`hasTouch`, `isMobile`) |
|---|---|---|
| **1 · Đường sung sướng** (vẽ · đổi lớp · đổi tỉ lệ · xuất PDF) | ✅ ĐÃ ĐI — vẽ tường (nút + `W ↵`), mở bảng Lớp, đổi tỉ lệ/khổ giấy trong bảng Khung tên, chèn khung tên, xuất 6 PDF thật | 🟡 ĐI MỘT PHẦN — chạm chọn công cụ + vẽ tường bằng ngón: **được**. Chưa đi: đổi lớp, xuất PDF bằng ngón |
| **2 · RỖNG** (bản vẽ chưa có gì) | ✅ ĐÃ ĐI | ✅ ĐÃ ĐI |
| **3 · VÀO NGANG** (dán thẳng URL) | ✅ ĐÃ ĐI — `/cad-editor` khi 0 dự án; `/projects/<id-không-có>/cad` | ⬜ CHƯA — cùng luồng điều hướng, không kỳ vọng khác |
| **4 · QUAY VỀ / BỎ DỞ** | ✅ ĐÃ ĐI — reload cùng tab, đóng hẳn tab rồi mở lại, đo trễ ghi server | ⬜ CHƯA |

### 1b · Bề mặt trong phạm vi

| Bề mặt | Trạng thái | Ghi chú |
|---|---|---|
| Mặt vẽ (canvas) | ✅ ĐÃ ĐI | vẽ tường/phòng, quét lưới hit-test 14.596 điểm, lưới bấm-chọn 28 điểm |
| Thanh công cụ (dock dưới) | ✅ ĐÃ ĐI | đo tràn mép ở 3 khổ màn, thử cuộn bằng bánh xe dọc/ngang, Tab 70 chặng |
| Bảng Lớp | 🟡 ĐI MỘT PHẦN | mở được ở cả 2 lối nhập, đọc 5 lớp. **Chưa** đổi lớp hiện hành / ẩn-hiện / khoá |
| Tab tờ | ✅ ĐÃ ĐI | thêm tờ (1→2), thử chuột phải trên tab |
| Chế độ PAPER / Trình bày | ✅ ĐÃ ĐI | bật/tắt panel Trình bày; khung giấy đến từ bảng Khung tên |
| **Khung tên** | ✅ ĐÃ ĐI KỸ | 10 tổ hợp khổ×hướng × 8 nấc tỉ lệ; chèn thật; soi trong PDF |
| **Hộp thoại Xuất PDF** | ✅ ĐÃ ĐI | 6 lần xuất thật, mở file đo bằng pdf.js |
| Dòng lệnh / bắt điểm | 🟡 ĐI MỘT PHẦN | dòng lệnh `W ↵` chạy đủ 3 đường. **Chưa** kiểm hành vi bắt điểm bằng số đo |

### 1c · Ô CHƯA ĐI — lý do

| Chưa đi | Lý do |
|---|---|
| Xuất **PNG · DXF · .idf · .ifpack** | Hết thời lượng; ưu tiên PDF vì đó là đầu ra bị `CHUAN-DAU-RA-NGHE` ràng buộc chặt nhất |
| Công cụ **Kiểm chuẩn**, Thống kê/Legend, MEP, Lịch sử vẽ | Ngoài trục "mặt vẽ · thanh công cụ · lớp · tờ · khung tên · xuất PDF" |
| Pinch-zoom, chế độ "Ngón vẽ", đĩa lệnh chạm-giữ | Chưa đi |
| Bắt điểm đo bằng số | Chưa dựng được phép đo tin cậy trên `<canvas>` trong thời lượng |
| Đọc màn hình thật (VoiceOver/NVDA), Safari/Firefox | Không có trong môi trường; mọi số a11y dưới đây là **Chromium** |

---

## 2 · LỖI THEO MỨC

### 🔴 P0

---

#### `[A2-01] P0 · Xuất PDF / khung tên · chuột · CA1` — Khung tên tràn ra ngoài mép giấy, chữ bị CẮT CỤT, và **tỉ lệ in ra sai**

**Thấy gì** — Mở file đầu ra thật (`anh-a2/dau-ra-A3-ngang.pdf`, đo bằng pdf.js, trang 2 = 1191×842pt):

| Chuỗi in ra | Đáng lẽ là | Vị trí | Mép giấy |
|---|---|---|---|
| `Tỷ lệ 1:4` | `Tỷ lệ 1:47` | x = 1173…1192 | 1191 → **tràn 1pt** |
| `IF-0` | `IF-01` | x = 1173…1191 | sát mép |
| `Ngày · Da` | `Ngày · Date` | x = 1173…1192 | **tràn 1pt** |

Cả cột phải của khung tên bị ghim ở x = 1173 trong khi giấy hết ở 1191 — **còn 18pt ≈ 6,3 mm** cho cả một cột.
Ở `A2 · Ngang · 1:50` chuỗi in ra là **`Tỷ lệ 1:5`** (cụt từ `1:50`).

> ⚠️ Đây là chỗ nguy hiểm nhất của cả đợt: **một bản vẽ thi công ghi sai tỉ lệ**. Người đọc bản vẽ
> thấy "1:5" trong khi bản vẽ là 1:50 — sai mười lần.

Ảnh: `anh-a2/31-KHUNG-TEN-phong-to.png` (phóng to 4×, thấy rõ `IF-0`, `Tỷ lệ 1:4`, `Ngày · Da` bị mép giấy cắt).

**KHÔNG phải lỗi lệch khổ giấy giữa hai nơi.** Đã thử ca đối chứng: đặt **cùng** `A4 · Ngang · 1:100`
ở **cả** bảng Khung tên **và** hộp thoại PDF (`anh-a2/dau-ra-A4-ngang-dongbo.pdf`) — vẫn tràn:
`XƯ` (cụt từ `XƯỞNG AUDIT`, tràn 7pt), `Hồ s` (cụt từ `Hồ sơ sơ phác · Design Development`).
**5/5 tổ hợp đã thử đều tràn** → trả lời câu Hoà hỏi: **mọi tổ hợp, không phải vài tổ hợp.**

**Đáng lẽ phải gì** — `docs/CHUAN-DAU-RA-NGHE.md` §1:
- *"Khổ giấy đúng ISO 216 (A0–A4), **khung viền đủ**"*
- *"Đủ 9 ô: … MÃ SỐ bản vẽ · tỷ lệ · ngày … **Thiếu ô nào = trượt**"* — ở đây mã số và ngày không
  thiếu ô, mà **bị cắt mất chữ**, còn tệ hơn thiếu vì nó in ra một giá trị SAI mà trông như đúng.

**Cách tái hiện** — 2D → `Bắt đầu ▸ Mở bản demo` → `Công cụ bản vẽ ▸ Khung tên` → khổ A3, hướng Ngang,
tỉ lệ "Vừa khổ" → điền 4 ô → `Chèn khung tên` → `Xuất ▸ Xuất bộ hồ sơ (PDF nhiều tờ)…` → `Xuất 1 tờ ra PDF`
→ mở PDF, soi góc dưới-phải. (Script: `/tmp/a2-26-xuatpdf.mjs`, đo: `/tmp/a2-32-do.mjs`.)

---

#### `[A2-02] P0 · Khung tên · chuột · CA1` — "Vừa khổ" luôn sinh tỉ lệ NGOÀI dãy chuẩn, và cổng máy vẫn phán "Đạt chuẩn"

**Thấy gì** — Quét đủ 10 tổ hợp khổ × hướng với nấc "Vừa khổ":

```
A0/Ngang 1:15   A1/Ngang 1:22   A1/Dọc 1:29   A2/Ngang 1:32   A2/Dọc 1:42
A3/Ngang 1:47   A3/Dọc  1:62    A4/Ngang 1:70  A4/Dọc  1:92
```

**0/10 rơi vào dãy chuẩn.** Bảng Khung tên còn tự khai: *"Tỉ lệ hiệu dụng: **1:47** — khung tên + PDF
dùng CÙNG con số này."* (`anh-a2/23b-panel-khung-ten.png`).
Đường thoái lui cũng hỏng: chọn `1:10` trên A3 thì panel báo *"1:10 KHÔNG lọt khổ A3 — **PDF sẽ tự fit (1:62)**"*
(`anh-a2/25a-A3-1-10.png`) — tức chỗ chữa lỗi lại đẻ ra một số lẻ khác.

Nặng hơn: hộp thoại xuất vẫn tick xanh **"✓ Đạt chuẩn đầu ra: tỷ lệ · khung tên · nhãn"**
kể cả khi tỉ lệ hiệu dụng là 1:70 (`anh-a2/26a-dialog-truoc-xuat.png`).

**Đáng lẽ phải gì** — `CHUAN-DAU-RA-NGHE.md` §1, nguyên văn:
> *"Tỷ lệ THUỘC DÃY CHUẨN: 1:1 · 1:2 · 1:5 · 1:10 · 1:20 · 1:25 · 1:50 · 1:100 · 1:200 · 1:500.
> **Fit-trang phải BẮT về nấc chuẩn gần nhất (về phía nhỏ hơn) — cấm in số lẻ kiểu "1:47"**."*

Và §6 giao cho máy chặn: *"tỷ lệ ∉ dãy chuẩn … → **chặn** kèm lý do"*, marker `CHUAN_DAU_RA`.
⇒ **Con số "1:47" trong luật không phải ví dụ giả định — nó là đúng con số app đang in ra hôm nay.**
Luật ghi lỗi này "bắt được 11/08"; 05/09 nó vẫn còn, và cổng máy sinh ra để chặn nó thì **đang gật đầu cho qua**.

**Cách tái hiện** — như A2-01, đổi khổ/hướng trong bảng Khung tên và đọc dòng "Tỉ lệ hiệu dụng".
Script quét: `/tmp/a2-24-tyle.mjs`.

---

#### `[A2-03] P0 · Lưu · chuột · CA4` — Báo "Đã lưu" trước khi ghi lên máy chủ **19,6 giây**; đóng tab trong khoảng đó là **mất bản vẽ**

**Thấy gì** — đo bằng đồng hồ, mốc 0 = lúc bấm `Xong` chốt chuỗi tường:

| Mốc | Thời điểm |
|---|---|
| Thanh trạng thái hiện **"Đã lưu lúc 07:5x"** | **1,5 s** |
| `POST /api/project-files` **thật sự** xảy ra | **21,1 s** |
| ⇒ khoảng nói-dối | **19,6 giây** |

Chứng minh mất thật (`/tmp/a2-19-luu.mjs`): tạo dự án mới → vẽ tường → chờ nhãn "Đã lưu" hiện →
chờ thêm 9 s → **đóng hẳn trình duyệt** → mở lại **đúng URL đó** ⇒ `Bàn vẽ đang trống`. Công đã mất.
Chờ đủ 25 s trước khi đóng thì bản vẽ còn nguyên (`/tmp/a2-42-luu-lai.mjs`) — nên đây là **cửa sổ thời gian**, không phải hỏng hẳn.

**Đáng lẽ phải gì** — `docs/ACTIVE-DESIGN-CONTEXT.md` / north star `N-1…N-20`: lời hứa sản phẩm là
*"từ ý tưởng tới sự thật thiết kế — **không đánh rơi ngữ cảnh**"*. Ngoài ra sổ dự án (04/09, mục WorkHub)
đã lập sẵn án lệ cho đúng hạng lỗi này: **"nút nói dối việc nó vừa làm, tệ hơn nút chết"** — nút chết thì
người dùng biết đường mà đi lối khác. Ở đây người dùng được bảo "đã lưu" rồi đóng máy.

**Cách tái hiện** — 2D → vẽ vài đoạn tường → `Xong` → đợi thấy "Đã lưu lúc …" → đóng tab trong vòng ~15 s →
mở lại cùng URL. Script đo trễ: `/tmp/a2-43-do-tre.mjs`.

> 🔧 **Tôi đã tự sửa một kết luận sai của chính mình ở đây.** Vòng đo đầu tôi kết luận "0 yêu cầu ghi lên
> server, bản vẽ chỉ nằm trong IndexedDB" — **sai**, vì cửa sổ quan sát của tôi chỉ 6 s, ngắn hơn độ trễ 21 s.
> Ghi lại để không ai trích con số đầu ấy.

---

### 🟠 P1

---

#### `[A2-04] P1 · Xuất PDF · CA1` — **Chữ đè hình** và chữ tràn khỏi hộp khung tên trong bản nộp

**Thấy gì** (`anh-a2/35-A4-khung-ten.png`, phóng to 5×): đường trục dọc (trục ⑥) **chạy xuyên qua** dòng
`MẶT BẰNG BỐ TRÍ NỘI THẤT — SƠ PHÁC DD (đã rà công năng)`, cắt giữa `PH|ÁC` và giữa `(đã r|à công năng`.
Dòng đó còn **tràn khỏi chính hộp khung tên của nó**. Dòng `VẼ: InteriorFlow` cũng bị một nét xuyên qua.

**Đáng lẽ phải gì** — `CHUAN-DAU-RA-NGHE.md` §1: *"Nhãn **KHÔNG đè hình học**, KHÔNG đè nhau — máy phải né
hoặc dùng leader"*. Đây đúng lớp lỗi mà luật ghi là đã bắt 11/08.

**Cách tái hiện** — như A2-01, mở PDF và soi vùng khung tên demo.

---

#### `[A2-05] P1 · Xuất PDF · CA1` — Chữ in ra nhỏ hơn ngưỡng nghề: **41/67 đoạn dưới 1,8 mm**

**Thấy gì** — đo chiều cao chữ khi in trên trang A3 của `dau-ra-A3-ngang.pdf`:

| Chuỗi | Cao khi in | Ngưỡng luật | Kết |
|---|---|---|---|
| `H.LANG` | 1,41 mm | nhãn phòng ≥ 2,5 mm | trượt |
| `12.2 m² (cạnh ngắn ≥3.0m)` | 1,50 mm | ≥ 2,5 mm | trượt |
| `36.7 m²` | 1,60 mm | ≥ 2,5 mm | trượt |
| nhãn ô khung tên (`DỰ ÁN · PROJECT`…) | 1,41 mm | dim ≥ 1,8 mm | trượt |
| `XƯỞNG AUDIT` (tiêu đề) | 2,50 mm | tiêu đề ≥ 3,5 mm | trượt |

**41 trên 67** đoạn chữ của tờ nằm dưới 1,8 mm — tức dưới cả ngưỡng thấp nhất trong luật.

**Đáng lẽ phải gì** — `CHUAN-DAU-RA-NGHE.md` §1: *"Chiều cao chữ khi IN: dim ≥1.8mm · nhãn phòng ≥2.5mm ·
tiêu đề ≥3.5mm."*

---

#### `[A2-06] P1 · Xuất PDF · CA1` — Bản nộp mang chữ nội bộ và chữ DEMO

**Thấy gì** — trích thẳng từ text layer của PDF:
- `MẶT BẰNG BỐ TRÍ NỘI THẤT — SƠ PHÁC DD **(đã rà công năng)**`
- `**CĂN HỘ MẪU — DEMO**`
- trang 1 (mục lục) mang tên bộ hồ sơ là `**Untitled flow**`

**Đáng lẽ phải gì** — ba điều khoản, cả ba đều đã có sẵn:
- `CHUAN-DAU-RA-NGHE.md` §1: *"KHÔNG jargon nội bộ trong tên bản vẽ (**bắt được: "(đã rà công năng)" 11/08**)"*
  — chuỗi bị nêu đích danh trong luật vẫn còn nguyên trong đầu ra.
- §4: *"0 placeholder sót: `{{ }}` · lorem · **"Untitled"** · ảnh xám mẫu."*
- `docs/CONTENT-RULES.md`: nội dung app thật · demo · dự án khách **không được trộn**.

---

#### `[A2-07] P1 · Khung tên · CA1` — Hai khung tên cùng tồn tại trên một tờ, ghi **hai tỉ lệ mâu thuẫn**

**Thấy gì** — sau khi `Chèn khung tên`, tờ có **cả** khung tên demo (`CĂN HỘ MẪU — DEMO … Tỷ lệ 1:100 …
VẼ: InteriorFlow`) **lẫn** khung tên vừa chèn (`XƯỞNG AUDIT … Tỷ lệ 1:4[7]`). Không có cảnh báo, không
thay thế, không hỏi. Hai con số tỉ lệ khác nhau trên cùng một bản vẽ.
Ô `HẠNG MỤC · CATEGORY` để trống; `Rev: —` và `Người vẽ: —` ở dải dưới vẫn là gạch ngang dù đã điền người vẽ.

**Đáng lẽ phải gì** — `CHUAN-DAU-RA-NGHE.md` §1 *"Đủ 9 ô … Thiếu ô nào = trượt"*; và lẽ thường nghề:
một tờ bản vẽ có đúng một khung tên, đúng một tỉ lệ.

Ảnh: `anh-a2/31-KHUNG-TEN-phong-to.png`.

---

#### `[A2-08] P1 · Điều hướng · chuột · CA3+CA4` — Vào ngang `/cad-editor` khi chưa có dự án đẻ ra "Việc đang dở" GIẢ, bấm vào là vòng lặp kín

**Thấy gì** — đo tuần tự trên tài khoản 0 dự án:

| Bước | Kết quả |
|---|---|
| Ngay sau đăng nhập | Home ghi *"chưa có việc nào đang dở"* ✔ |
| Vào `/cad-editor` | bị đẩy về `/` kèm toast *"Chọn dự án trước · Choose a project first"* |
| Quay lại Home | Home **nay ghi** *"Việc đang dở — bạn rời khỏi hôm nay · chặng Thiết kế 2D"* + nút *"mở lại chỗ cũ"* |
| Bấm *"mở lại chỗ cũ"* (`<a href="/cad-editor">`) | lại bị đẩy về `/` + cùng toast → **thẻ resume vẫn còn** ⇒ vòng lặp |

Ngược lại: làm việc **thật** trong `/projects/<id>/cad` rồi quay ra Home thì **không** sinh thẻ resume nào.
Tức thẻ resume bám `/cad-editor` (cửa bị chặn) chứ không bám chặng 2D của dự án — sai cả hai chiều.

**Đáng lẽ phải gì** — hai căn cứ:
- `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` + chốt 04/09 (D-DR2): **Home hero = Resume**. Tiêu điểm
  chính của Home đang trỏ vào một việc không tồn tại.
- `00-CHOT` luật **X2**: *"KHÔNG MÀN NÀO ĐƯỢC CHẶN VÌ 'CHƯA LÀM BƯỚC TRƯỚC' … chặng nào trống thì hiện
  **empty state LÀM ĐƯỢC VIỆC TẠI CHỖ**"*. Đẩy người dùng về Home kèm toast là **chặn**, không phải empty state.

Ảnh: `anh-a2/05-home-resume-gia.png`. Script: `/tmp/a2-05-resume.mjs`.

---

#### `[A2-09] P1 · Thanh công cụ · chuột · CA1` — 5 nút cuối của dock nằm NGOÀI màn 1440, chuột thường không cuộn tới được

**Thấy gì** — ở 1440×900, các nút `Kéo màn hình` · `Xem vừa màn` · `Xoá` · `Hoàn tác` · `Làm lại` có mép phải
1496 / 1544 / 1601 / 1649 / **1697** px — tràn tới **257px ngoài màn** (`anh-a2/08-mat-2D.png`).
Dock nằm trong `.cad-pill-scroll` (`overflow-x:auto`, nội dung 1582 / khung 1292).

Thử cuộn: **bánh xe DỌC → `scrollLeft` đứng yên ở 0**; chỉ cuộn ngang (trackpad hai ngón / Shift+bánh xe)
mới chạy. Dấu hiệu duy nhất là dải mờ 18px ở hai mép — không có nút mũi tên, không thanh cuộn nhìn thấy
(`scrollbarHeight = 0`).
Ở 1680×1050 vẫn còn 1 nút tràn; ở 1280×800 dock xếp lại nên không tràn.

**Đáng lẽ phải gì** — *nhận định của tôi, không có điều khoản*: `Xem vừa màn` (zoom-fit) là lệnh dùng
hằng ngày; người dùng chuột rời (không trackpad) không có đường tới nó bằng chuột. `Xoá`/`Hoàn tác`/`Làm lại`
may mắn có bản sao ở hàng dưới, `Xem vừa màn` và `Kéo màn hình` thì không.

**Điểm sáng:** bàn phím **không** dính lỗi này — Tab đi qua đủ **40** nút của dock và trình duyệt tự cuộn
nút đang focus vào màn (đo được: `Xem vừa màn` sau khi focus có mép phải 1254 < 1440).

---

### 🟡 P2

---

#### `[A2-10] P2 · Cảm ứng · CA1` — 45 vùng chạm nhỏ hơn 44px, gồm **toàn bộ thanh lệnh trên**

**Thấy gì** — ở `hasTouch:true, isMobile:true` 1024×768:

| Nút | Kích thước |
|---|---|
| `Mở tệp` · `Xuất` · `Bắt đầu` · `Công cụ bản vẽ` · `Tỉ lệ` · `Trình bày` | cao **30px** |
| `Mở lại Lớp` | 28×28 |
| thêm tờ `+` | 26×26 |
| `Gửi sang Trình chiếu` | cao 26 |
| `Vitals` | cao 24 |
| tay nắm `Mở bảng kiểm` | rộng **14px** |

Tổng 45 mục dưới 44px. Dock dưới thì **đúng** 44×44 — nên đây là lệch cục bộ ở thanh trên, không phải toàn app.

**Đáng lẽ phải gì** — chốt 03/08 (`SPEC-MAT-DO-CON-TRO` §5): 5 token `--tap/--row/--gap/--pad-card/--fs-ui`
đổi theo con trỏ, cảm ứng override qua `(hover:none) and (pointer:coarse)`. Thanh lệnh trên rõ ràng chưa nhận override.

**Điểm sáng:** vẽ tường **bằng ngón** chạy được (chạm nút `Tường` → chạm 3 điểm → `Xong` → bản vẽ hết trống).

Ảnh: `anh-a2/40a-camung-1024.png`.

---

#### `[A2-11] P2 · Mặt vẽ · chuột` — Lớp phủ trong suốt ăn **18,6%** diện tích mặt vẽ

**Thấy gì** — quét `elementFromPoint` 14.596 điểm trên hình chữ nhật canvas (1318×712 tại 1440×900):
**2.712 điểm (18,6%)** rơi trúng phần tử **không phải canvas** mà vẫn nhận chuột.
Thủ phạm lớn nhất là `.cad-pill-scroll` — nền `rgba(0,0,0,0)`, `pointer-events:auto`, hộp 1292×56 tại y=710,
cộng hàng pill thứ hai ⇒ dải đáy ~y 710→813 (~100px ≈ 14% chiều cao mặt vẽ) nằm **đè lên** bản vẽ và nuốt cú bấm,
kể cả **khe trống giữa hai hàng pill** — chỗ nhìn thì thấy bản vẽ, bấm thì trúng thanh công cụ.

**Đáng lẽ phải gì** — *nhận định của tôi, không có điều khoản.*

> 🔍 **Phần thứ hai câu hỏi của Hoà — "bấm vào giữa lòng một vùng tô có chọn được không" — KHÔNG tái hiện được.**
> Lưới 28 điểm rải khắp mặt bằng demo: **28/28 đều chọn được**. Vòng thử đầu tôi thấy 2 điểm "không chọn được"
> nhưng đó là **lỗi phép đo của tôi** (đọc nhãn nút `Xoá` quá sớm), không phải lỗi app. Ghi rõ ở đây để
> không ai đi sửa một lỗi không có.

---

#### `[A2-12] P2 · Xuất PDF` — Hộp thoại xuất bày **UUID thô** làm tên tờ

**Thấy gì** — khung xem trước trong `Xuất bộ hồ sơ` ghi tiêu đề tài liệu là
`5f2e8900-b6b4-4e05-b2ed-5eec7cb61f68` (`anh-a2/21-hop-thoai-ho-so.png`).

**Đáng lẽ phải gì** — `docs/SPEC-NGON-NGU-CHI-DAN.md`, luật viết số 2: **CẤM jargon nội bộ lộ UI**.

---

#### `[A2-13] P2 · Khung tên` — Nhãn menu và tiêu đề bảng dùng chữ **tiếng Tây Ban Nha**: "cajetín"

**Thấy gì** — `Công cụ bản vẽ ▸ **Khung tên · Chèn cajetín vào góc dưới-phải bản vẽ**`, và tiêu đề bảng là
**`Khung tên (cajetín)`** (`anh-a2/23b-panel-khung-ten.png`). *Cajetín* là tiếng Tây Ban Nha.

**Đáng lẽ phải gì** — `CLAUDE.md` LUẬT NỀN TẢNG mục 5: giao diện hỗ trợ **VI/EN**. Tiếng thứ ba lọt vào
nhãn người dùng thấy là ngoài hệ.

---

#### `[A2-14] P2 · Tab tờ · 404 · thanh trạng thái` — Ba chỗ lẫn ngôn ngữ / lộ placeholder

| Chỗ | Thấy gì | Đáng lẽ |
|---|---|---|
| Đếm tờ (góc phải trên) | **"2 sheet"** | chính hộp thoại xuất đã dùng **"1 tờ"** — trong cùng một màn, hai thứ tiếng cho cùng một khái niệm |
| Trang 404 của chặng 2D | Toàn văn tiếng Việt, nút cuối là **"Home"** (`anh-a2/44b-404.png`) | VI/EN nhất quán |
| Thanh trạng thái dưới-trái | **"Untitled flow"** trong khi dự án tên *"Audit A2 2D"* | không lộ placeholder; chuỗi này còn **chảy thẳng vào trang mục lục PDF** (xem A2-06) |

*Căn cứ: `SPEC-NGON-NGU-CHI-DAN` (cấm jargon/khuôn chữ lệch) + `CHUAN-DAU-RA-NGHE` §4 (0 placeholder).*

---

#### `[A2-15] P2 · Tab tờ · chuột` — Chuột phải trên tab tờ không có gì

**Thấy gì** — bấm chuột phải lên tab `Bản vẽ 2`: không menu, không *Đổi tên / Nhân đôi / Xoá tờ*.

**Đáng lẽ phải gì** — chốt 03/08 (`SPEC-MAT-DO-CON-TRO`) đã đo và ghi nhận đúng thiếu sót này:
*"thiếu hẳn từ vựng chuột+bàn phím (chuột phải, shift-click, marquee, mũi tên, type-ahead)"*. Vẫn còn.

---

#### `[A2-16] P2 · Bàn phím` — 7/70 chặng Tab không có vòng focus nhìn thấy

**Thấy gì** — đi 70 chặng Tab từ mặt vẽ, đọc `outline` + `box-shadow` của `activeElement`: **7 chặng**
có `outline: none / 0px` và không có box-shadow thay thế. Chúng gom về 3 phần tử, trong đó có nút
`InteriorFlow · Thiết kế 2D` trên thanh đỉnh.

**Đáng lẽ phải gì** — WCAG 2.4.7 + lỗ ❌ *a11y audit* đang mở trong `STATUS.md`.

> ⚠️ **Số này là SÀN, không phải trần.** Phép đo của tôi chỉ nhìn `outline` và `box-shadow`; phần tử dùng
> cách đánh dấu khác (đổi nền, viền giả) có thể bị tôi đếm nhầm là "không có", và ngược lại. Chỉ Chromium.

---

## 3 · NHỮNG THỨ CHẠY ĐÚNG (ghi lại để không ai đi "sửa")

| Thứ | Kết quả đo |
|---|---|
| **Empty state chặng 2D** | *"Bàn vẽ đang trống — Gõ W ↵ để vẽ tường ngay tại chỗ, hoặc mở file có sẵn (.idf · .dxf · .dwg)"* + nút `Nhập bản vẽ`. **Làm được việc tại chỗ** ⇒ đúng luật X2. |
| **Dòng lệnh `W ↵`** | Chạy đủ **3 đường**: gõ vào ô Lệnh · bấm nút `Lệnh` rồi gõ · gõ thẳng khi con trỏ ở canvas. Cả 3 đều đổi công cụ sang `Tường`. |
| Phím tắt một-ký-tự trần (`w`,`l`,`r`…) | Không có — nhưng đó là **quy ước dòng lệnh kiểu AutoCAD**, không phải lỗi. (Vòng đo đầu tôi suýt báo sai thành lỗi.) |
| **Bàn phím đi hết dock** | 40/40 nút, trình duyệt tự cuộn nút off-screen vào màn. |
| **Vẽ bằng ngón** | Chạy. |
| **Bảng Lớp** | Mở được ở cả chuột lẫn cảm ứng; 5 lớp, mỗi lớp có mắt ẩn/hiện + khoá (`anh-a2/41-lop-CHUOT.png`). |
| **Thêm tờ** | 1 sheet → 2 sheet. |
| Khu **"CHƯA LÀM ĐƯỢC"** trong panel Trình bày | 4 mục khai thẳng là chưa làm, không giả vờ chạy — đúng luật §9 *"cấm nút giả, cấm xoá ô trống cho gọn mắt"*. |
| Cảnh báo tỉ lệ không lọt khổ | Có, và nói rõ hệ quả — cơ chế đúng, chỉ tiếc con số nó đề nghị lại ngoài dãy chuẩn (A2-02). |
| Chọn đối tượng trên mặt vẽ | 28/28 điểm chọn được. |

---

## 4 · CHƯA CHẮC / CHƯA ĐI ĐƯỢC

1. **Bảng Lớp mới chỉ MỞ, chưa VẬN HÀNH.** Chưa đổi lớp hiện hành, chưa ẩn/hiện, chưa khoá, chưa kiểm
   nét có đổi theo lớp không. Đây là lỗ phủ lớn nhất còn lại trong phạm vi A2.
2. **`.pe-layer-row:hover .pe-layer-actions{opacity:1}`** — tìm được 10 luật CSS ẩn/hiện phụ thuộc `:hover`
   (cảm ứng không kích hoạt được), 3 trong đó là của IF. **Nhưng** trong chặng 2D tôi đếm được **0** phần tử
   `.pe-layer-actions` ⇒ nhiều khả năng chúng thuộc present-editor, **không** thuộc bảng Lớp của A2.
   Chưa xác minh ở chặng 3 — để làn khác.
3. **Chỉ Chromium 1194.** Không có Safari/Firefox, không có trình đọc màn hình thật. Mọi số a11y là sàn.
4. **Bắt điểm (snap) chưa kiểm bằng số.** Nút bật/tắt có, hành vi bám điểm chưa đo — cần phép đo toạ độ
   trên `<canvas>` mà tôi chưa dựng kịp.
5. **Chỉ kiểm đầu ra PDF.** PNG · DXF · .idf · .ifpack chưa mở file lần nào ⇒ chưa nói được gì về chúng.
6. **Con số "5/5 tổ hợp đều tràn khung tên"** là 5 tổ hợp tôi thử (A3-Ngang-fit, A4-Ngang-fit, A4-Dọc-100,
   A3-Dọc-100, A2-Ngang-50, + ca đồng bộ A4-Ngang-100). Chưa quét đủ 10 khổ×hướng × 8 tỉ lệ ở mức **xuất file**
   (mới quét đủ ở mức *đọc tỉ lệ hiệu dụng*).
7. **Trong lúc đo, ba làn audit khác chạy song song trên cùng cây.** Tôi không sửa mã, nhưng dữ liệu dự án
   trong DB có thể bị làn khác đụng. Các số về *dự án/tờ* nên đọc như ảnh chụp một thời điểm.
8. **Hai lần tôi tự bác kết luận của chính mình** (mất-dữ-liệu-hoàn-toàn → thật ra là trễ 19,6 s;
   "vùng tô nuốt click" → không tái hiện). Cả hai đều do **đo lại**, không do lập luận. Nếu có chỗ nào
   trong báo cáo này còn sai, nhiều khả năng nó cùng hạng: **cửa sổ quan sát quá ngắn** hoặc **phép đo proxy**.

---

*Làn A2 · 05/09/2026 · chỉ audit, không sửa mã.*
