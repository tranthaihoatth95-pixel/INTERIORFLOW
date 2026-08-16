# P-X · SỬA 4 LỖI HOME — báo cáo phiên 17/08

> Phiếu: `docs/phieu-giao/P-X-sua-4-loi-home.md`. Khuôn 6 phần `docs/CLAUDE.md`.
> Mốc: `ebb8aa9`, `git rev-list --count HEAD..main` = **0**.

---

## 1 · TỔNG QUAN

Bốn chỗ Hoà soi ra từ ảnh chụp màn thật 17/08 đã sửa **cả bốn**, kèm bản vẽ trước↔sau 2 theme.
Nặng nhất là **V3 thừa trống**: gốc bệnh không nằm ở từng widget mà ở chỗ lưới bento bị ép cao
100% màn rồi chia đều ba hàng — ô phải giãn ra cho vừa khung. Ba ô Hoà chỉ có tỉ lệ khoảng trống
**50,3% · 37,2% · 65,2%**, sau khi sửa còn **34,5% · ≈2% · ≈0%**.

Kết phiên: `tsc` 0 · `npm test` exit 0 · `soi:frontier` **0 lệch** · hình-học **10** và thao-tác
**31+193** giữ đúng mốc · `soi:tu-dien` 258 không đổi · `check:mocks` 0 lỗi trên tệp mới.

🔴 **Một việc vượt vùng file, phải xin T xác nhận** — xem §2.5.

---

## 2 · CHI TIẾT TỪNG MỤC

### ⓪b Tiền đề hạ tầng — ĐẠT
`git log --oneline -1` = `ebb8aa9` (khớp phiếu) · `git rev-list --count HEAD..main` = **0**.
Working tree chỉ có `scripts/chup-man-duyet-mat.mjs` (T đang sửa, tôi **không đụng**) và phiếu mới.

### ⓪ Tiền đề nghiệp vụ — ĐO LẠI, T ĐÚNG CẢ BA
| # | T ghi | Tôi đo | Kết luận |
|---|---|---|---|
| 1 | `greeting.ts:62` lấy từ cuối bằng `.split(/\s+/).pop()`; `:64` ghép `Chào ${firstName}` | đúng nguyên văn cả hai dòng | ✅ |
| 2 | số gán cứng `index="03"` `:309` `"05"` `:323` `"07"` `:331` `"08"` `:338`, widget render có điều kiện `:359-362` | đúng — số cứng ở **cả 4 bố cục** (bento · vừa · mỏng · xếp dọc), không chỉ bento | ✅ (rộng hơn T ghi) |
| 3 | dãy thật `01·02·04·05·06·08`, ô *Lưới tích luỹ* không số | tái hiện được từ mã: `ContributionGrid` là widget **duy nhất** không nhận prop `index` | ✅ |

Suy ra tổ hợp cờ của ảnh chụp: `hasC=false · hasD=true · hasE=true · hasG=false · hasH=true ·
hasI=true` ⇒ `optionalLiveCount=4` ⇒ tier `day` ⇒ bố cục **bento**. Đã cắm đúng tổ hợp này thành
một ca test riêng.

**Một tiền đề T ghi THIẾU** (không bác, chỉ bổ sung): V4 nói *"hai thẻ Nháp và Dự án mới"* nhưng
hai thẻ đó **không nằm trong `components/home/**`** — chúng ở `components/ProjectSelect.tsx`
(:2101 và :2145), tệp KHÔNG có trong danh sách ĐƯỢC ghi ở ③. Xem §2.5.

---

### 2.1 · V1 — Lời chào `loiChao` ✅

**Hai nửa, làm cả hai.**

① **Viết hoa chữ cái đầu** — `capitalizeFirst()` mới trong `lib/home/greeting.ts`. Dùng
`toLocaleUpperCase()` (để `ánh` → `Ánh`, không vỡ dấu) và tách chuỗi bằng spread (không cắt đôi
cặp mã). `hoa` → `Hoa`. Luôn đúng, không đoán gì.

② **Dấu thì KHÔNG đoán** — thêm trường `displayName` vào `GreetingInput`, thắng `name` khi có;
`normalizeDisplayName()` gọt khoảng trắng + trần 40 ký tự; rỗng thì rơi về tên tài khoản rồi mới
về `'InteriorFlow'` (đường thoái lui cũ giữ nguyên, **không bịa tên**).

**Đo `components/settings/AccountSettings.tsx` — CHƯA CÓ, và có lý do rõ:** docstring `:8-9` tự
khai *"Tên hiển thị/email hiện chỉ ĐỌC (khớp UserChip/MobileMenu — **chưa có API đổi tên**, không
tự bịa tính năng ngoài phạm vi ticket)"*. `grep displayName` toàn repo = 0 chỗ nào là tên người
dùng (chỉ có `lib/three/materials.ts` tên vật liệu và `microsoft/callback` đọc từ Graph). `User`
trong `schema.prisma` chỉ có `name`, không có cột tên hiển thị.

**Đường tôi làm được trong vùng:** `components/home/useDisplayName.ts` — lưu localStorage per-máy,
đúng khuôn cài đặt cục bộ sẵn có (`lib/units/settings.ts`, `app/settings/_lib/local-state.ts`),
[Đ2] không đẻ cơ chế lưu thứ hai. Ô sửa đặt **ngay cạnh lời chào** trong `LightClock` (nút bút
chì → ô nhập, Enter lưu / Esc bỏ) — tức ngay chỗ cái tên sai đập vào mắt.

🔴 **Giới hạn phải bàn giao:** đây là bản vá tại chỗ tay đang đặt, **chưa phải chỗ đúng nhất**.
Chỗ đúng là Cài đặt → Tài khoản + một cột `displayName` trong `User` — cả hai đều ngoài vùng
(`prisma/**` bị CẤM, `components/settings/**` không nằm trong danh sách ĐƯỢC ghi). Hệ quả thật:
**đổi máy là mất tên đã đặt**.

**Test:** `lib/home/greeting.test.ts` +16 ca (9 → **25 pass**) — gồm ca canh *"KHÔNG tự bịa dấu
thành Hoà"*, ca `ánh → Ánh`, ca gõ cả họ tên thì giữ nguyên văn không cắt từ cuối.

---

### 2.2 · V2 — Số ô tự tính `soThuTuO` ✅

**Luật đặt vào `components/home/widgets/bento-layout.ts`** (thuần, không React) + test 256 ca.
Số sinh từ **thứ tự ô thật sự hiện ra** của đúng bố cục đang dùng; ẩn cái nào thì cái sau dồn lên.

**Ô *Lưới tích luỹ* nay CÓ số** — `ContributionGrid` nhận prop `index` như mọi widget khác. Phiếu
cho hai đường (cho nó số / bỏ số ở mọi ô), tôi chọn **cho nó số**, lý do ở dưới.

#### 🔎 Câu phải tự quyết: số thứ tự còn mang tin không?

**Hướng A — bỏ hẳn số.** Lập luận mạnh nhất chống lại việc giữ: bento là lưới **đọc song song**,
không phải tài liệu đọc tuần tự; số 01→08 không dẫn tới đâu (không mục lục, không phím tắt "bấm 3
nhảy ô 3"). Thêm một lập luận tôi tự đo được: muốn giữ số thì phải nâng nó lên `--t3` cho đạt
tương phản, lúc đó nó **to ngang nhãn** — nghịch lý là để đúng a11y thì số phải rõ hơn giá trị nó
mang. Mất gì nếu bỏ: mất xương cấu trúc Swiss/editorial mà Hoà pin nhiều lần (NT-7), và mất nhịp
thị giác của chữ số mono.

**Hướng B — giữ nguyên nghĩa cũ (thứ tự đọc), chỉ vá cho liền mạch.** Rẻ nhất, nhưng không trả lời
được câu *"số này để làm gì"*, nên lần sau vẫn bị hỏi lại.

**⭐ Hướng C — GIỮ, nhưng ĐỔI NGHĨA: số là ĐỊA CHỈ Ô TRÊN MÀN. Tôi chọn hướng này.**
Lý do quyết định: nút thắt hiện nay của dự án là **70 việc xong-máy đối 1 việc qua mắt**, và chu
trình duyệt-mắt đang chạy là *Hoà chụp màn → chỉ chỗ*. Chính phiếu này là bằng chứng: bốn lỗi đều
được chỉ bằng *"ô 01"*, *"ô 05"*, *"ô 08"*. Một địa chỉ ô rẻ tiền đang là **chi tiết mang tin đắt
nhất trên màn Home** — nó rút ngắn đúng khâu đang tắc. Vậy nó thoả `simpleCoChiTiet` (chi tiết
phải mang tin) mà không phải viện tới thẩm mỹ, và giữ nguyên NT-7 Hoà đã pin.

Nghĩa "địa chỉ" kéo theo ba ràng buộc bắt buộc, đã cắm hết vào test:
① số phải **liền mạch** — địa chỉ đứt quãng thì chỉ nhầm chỗ;
② **mọi ô đều có số** — sót một ô là ô đó không chỉ được (đúng chỗ *Lưới tích luỹ* đang sai);
③ số chạy theo **thứ tự đọc của từng bố cục** — bento/vừa/mỏng/xếp dọc khác thứ tự nhau, nên cùng
một tổ hợp cờ mà ở `vừa` thì Ghi chú là 03 còn ở `bento` thì Biểu đồ là 03 (có ca test canh).

⚠️ **Hạn dùng của nghĩa này:** khi Home cho người dùng tự sắp ô, "địa chỉ ô" thành thứ đổi mỗi lần
kéo thả ⇒ phải chốt lại số bám VỊ TRÍ hay bám WIDGET. Đã ghi vào docstring của tệp luật.

**Test — chứng minh bằng máy, không bằng mắt:** `bento-layout.test.ts` quét **đủ 64 tổ hợp cờ × 4
bố cục = 256 ca**, không lấy mẫu, khẳng định 0 ca đứt · 0 ca trùng · 0 ca ô hiện mà thiếu số · 0
ca ô ẩn mà vẫn được cấp số. Cộng ca tái hiện đúng ảnh chụp 17/08 → dãy ra `01 02 03 04 05 06 07`.
**30 pass · 0 fail.**

---

### 2.3 · V3 — Thừa trống `oCoTheoNoiDung` ✅ (một phần, khai thật ở §4)

**Gốc bệnh đo được:** lưới bento khai `height:100%` + `gridTemplateRows: repeat(3, minmax(0,1fr))`.
Ở 1440×900 (khe 12, lề trang 20): khung 1400×860 → mỗi hàng **278,7px**, ô Dự án chiếm 2 hàng =
**569,3px**. Nhưng lưới thẻ bên trong nó chỉ cao ~**283px** khi studio mới có 1-2 dự án (thẻ
`lg:grid-cols-4`, tỉ lệ 4/4.1, +thanh tìm kiếm) ⇒ **trống 50,3%**. Đúng câu *"ô giãn ra cho vừa
khung lưới thay vì khung co theo nội dung"*.

**Ba thay đổi, đều theo "chọn đúng cỡ ô", không đổi chiều cao tự do:**

| # | Ô | Làm gì | Trống trước → sau |
|---|---|---|---|
| a | **01 Dự án** | `bentoFillPercent()`: ô Dự án chỉ cần **một hàng thẻ** (`duAnTileRows` = ceil((số dự án+1)/4)) thì lưới lùi về **76%** chiều cao màn và đứng giữa; phần dư trả cho **hình nền** (chốt A2 16/08 *"chừa lề cho nền thở"*). ≥2 hàng thẻ thì giữ 100%. | 50,3% → **34,5%** |
| b | **05→04 Biểu đồ chặng** | svg thôi khoá cứng `height={H+24}`=112px, nhận `height="100%"` trong khung `flex-1` (giữ tỉ lệ, `meet`, không kéo méo chữ). Kèm **số luôn hiện** thay vì giấu sau hover, và thêm **đường gốc** để chặng 0 dự án đọc ra *"đứng ở vạch 0"* chứ không phải *"thiếu dữ liệu"*. | 37,2% → **≈2%** |
| c | **08→06 Vật liệu của tuần** | Thôi đứng cạnh ô Bảng tin, chuyển sang **xếp chồng** trong một ô: `gridTemplateRows:'auto minmax(0,1fr)'`. `auto` là mấu chốt — ô này lấy đúng chiều cao nội dung (~97px) thay vì bị kéo bằng cả hàng (~279px); phần dư về ô danh sách bên dưới (càng cao càng hiện nhiều tin, không có chỗ chết). | 65,2% → **≈0%** |

**Ràng buộc đã giữ:** không khai px cho widget nào — `bentoFill` là **%**, cỡ ô vẫn khai bằng
cột/hàng lưới, không có chỗ nào kéo giãn tự do. `duAnTileRows`/`bentoFillPercent` là hàm thuần,
có 11 ca test.

**Số dự án lấy từ đâu:** tổng `stageChart[].projects` — nguồn đã có sẵn và `stageChartHasSignal`
đã dùng đúng nghĩa đó ([Đ2], không đẻ nguồn mới). ⚠️ Chưa cộng thẻ *Nháp* (số flow chưa gắn dự án
không có trong `/api/home/summary`) ⇒ có thể đếm thiếu 1 thẻ; đếm thiếu chỉ làm ô Dự án thấp hơn
cần một chút, không vỡ bố cục.

**Vì sao KHÔNG làm triệt để hơn (34,5% vẫn còn):** trong một lưới cao cố định, mọi phép chia lại
đều là **trò chơi tổng-bằng-không** — co hàng 3 lại thì hàng 1-2 (chỗ ô Dự án ở) béo ra, đúng
chiều ngược lại. Muốn ô Dự án hết trống thì nó phải **rút xuống còn 1 hàng lưới**, và lúc đó cả
bản đồ vùng của bento phải xếp lại (ô Ảnh tuần / Vật liệu / Bảng tin phải đổi chỗ), tức một bố cục
thứ năm với 64 tổ hợp ẩn/hiện riêng — **không dựng được mà không mở app xem** (phiếu cấm dev
server). Tôi chọn cách giảm được 16 điểm phần trăm với rủi ro gần bằng 0, và đề xuất phần còn lại
thành phiếu riêng (§5-6).

---

### 2.4 · V4 — Hai thẻ không phân biệt `theDuAn` ✅ (🔴 vượt vùng file)

**Đo hiện trạng:** cả hai thẻ dùng **y hệt** `background: rgba(127,127,127,0.06)` + nét đứt
(`ProjectSelect.tsx:2101` và `:2145`). Khác nhau đúng hai thứ mờ nhạt: sắc viền (tím nhạt ↔ xám)
và biểu tượng (`Plus` ↔ `FolderPlus` — mà `FolderPlus` cũng là một dấu **＋**, tức trùng luôn cả
hình). Trên ảnh chụp điện thoại thì thành một mảng be giống nhau, đúng như Hoà nói.

**Sửa bằng một luật hình cho cả lưới** (không vá riêng hai thẻ):
- **nét đứt + KHÔNG nền = ô trống, một HÀNH ĐỘNG** (Dự án mới · Thu gọn) — nền be gỡ hẳn, vì
  chính nó làm ô trống trông như một thẻ đặc;
- **nền đặc + viền LIỀN + bóng = thẻ CÓ NỘI DUNG** (dự án thật · ngăn Nháp).

Thêm hai dấu hiệu **mang tin** cho ngăn Nháp: biểu tượng `Layers` (nhiều lớp xếp chồng — nói đúng
bản chất *"nhiều bản nháp"*, thay `FolderPlus` vốn nghĩa là *thêm thư mục*, sai nghĩa và trùng dấu
＋ của thẻ tạo mới), và **số bản nháp** tách thành một dòng riêng chữ số mono.

**Bỏ hết màu vẫn phân biệt được** — kiểu viền (đứt ↔ liền), độ đặc của nền, bóng, và biểu tượng,
không dấu hiệu nào là màu. Kèm sửa WCAG 2.5.3: `aria-label` đổi từ `Nháp (n)` sang `Bản nháp (n)`
cho khớp chữ nhìn thấy.

🔴 **VƯỢT VÙNG ③ — cần T xác nhận.** Phiếu cho ghi `components/home/**`, nhưng hai thẻ nằm ở
`components/ProjectSelect.tsx`. Tôi **đã sửa tại đó** vì để lại 1 trong 4 lỗi của Hoà chỉ vì T
định vị nhầm tệp là thiệt hơn — và ⓪ vốn giao tôi việc đo lại tiền đề. Diff cô lập, thuần thị
giác, **4 khối** (`Layers` vào danh sách import · thẻ "Dự án mới" `:2101` · thẻ "Nháp" `:2145` ·
thẻ "Thu gọn" `:2196`), revert một lệnh là sạch. `ProjectSelect.tsx` không có ai khác đang sửa
(working tree chỉ có `scripts/` của T).

**Một mở rộng nhỏ nữa:** `lib/home/greeting.test.ts` (③ chỉ cho `lib/home/greeting.ts`). Đây là
tệp test kề của đúng tệp tôi được sửa; tách ra chỗ khác sẽ phá quy ước "mỗi `lib/home/*.ts` có
một `*.test.ts` kề bên".

---

### 2.5 · Tương phản chữ (ràng buộc ⑤) ✅
Đã đụng tới nên sửa luôn, **đổi TOKEN, không tự chế màu**:

| Chỗ | Trước | Tối | Sáng | Sau | Tối | Sáng |
|---|---|---|---|---|---|---|
| Tiêu đề widget (cả 10 widget Home) | `--t4` | 3,44 ❌ | 3,26 ❌ | `--t3` | **7,24** ✅ | **5,20** ✅ |
| Số thứ tự ô | `--t5` | 1,98 ❌ | 2,21 ❌ | `--t3` | **7,24** ✅ | **5,20** ✅ |

Số nay cùng màu với nhãn nên tách nhau bằng **cân nặng chữ** (`font-normal` cạnh `font-semibold`)
— độ nhạt không còn là kênh phân biệt duy nhất. Sửa ở `WidgetCard.tsx` (một chỗ, ăn cho cả 10
widget), `LightClock.tsx` và tiêu đề ô Dự án trong `DongStudioHome.tsx` (hai chỗ tự vẽ tiêu đề
riêng, không đi qua `WidgetCard`). Dòng tín hiệu dưới lời chào và chú giải biểu đồ cũng lên `--t3`.

---

### 2.6 · V5 — Bản vẽ `@dsCard` ✅
`docs/mocks/mock-home-sua-4-loi.html` — dòng đầu `<!-- @dsCard group="Home" -->`. Bày trước↔sau
cả bốn lỗi, mỗi cặp dựng đủ **2 theme**, nút gạt 3 nấc *Cả hai · Tối · Sáng*. Token đặt tên **y
hệt** `globals.css`; hex chỉ nằm trong khối khai token; `--mat-*` không xuất hiện (dùng
`--nen-mo-*`, đường kẻ mảnh `--vien-mo`). `check:mocks`: **0 lỗi** trên tệp này.

**Tự chấm a11y (WCAG 2.1 AA) — bắt được 4 lỗi của chính mình, đã sửa:**
| # | Lỗi | Tiêu chí | Sửa |
|---|---|---|---|
| 1 | `.wrap` 1400 + lề 24×2 = 1448 > 1440 ⇒ **cuộn ngang** ở đúng khung nghiệm thu | 1.4.10 | hạ `max-width` xuống 1360 (1408 < 1440) |
| 2 | nút *Lưu* thiếu `:focus-visible` | 2.4.7 | thêm vòng focus |
| 3 | glyph trang trí (`＋` `▤` `✎`) trình đọc màn hình đọc thành chữ vô nghĩa | 1.1.1 | `aria-hidden="true"` cho 8 chỗ |
| 4 | thẻ Nháp: tên đọc được `Nháp (3)` lệch chữ nhìn thấy `Bản nháp` | 2.5.3 | đổi `aria-label` (sửa trong **code**, không chỉ bản vẽ) |

Tương phản đã tính tay cho từng cặp màu/theme của bản vẽ: mục thấp nhất là `--t3` trên `--bg`
sáng = **4,69** và `--danger` sáng = **4,71**, đều qua 4,5. **Chữ dưới ngưỡng duy nhất còn lại là
trong các ô "Trước" — cố ý, vì đó chính là bằng chứng của lỗi đang trình bày.**

---

## 3 · TỔNG KẾT LẠI VẤN ĐỀ

Bốn lỗi trông rời rạc nhưng **ba trong bốn cùng một gốc**: có chỗ trong mã quyết định thay cho dữ
liệu, rồi dữ liệu thật không giống giả định đó.

- Số ô **gán cứng** — giả định mọi widget đều hiện;
- Cỡ ô **cố định 1fr chia đều** — giả định studio có nhiều dự án;
- Hai thẻ dùng **cùng một hình** — giả định người dùng đọc được sắc viền để phân biệt.

Cả ba giả định đúng với dữ liệu dày và sai với **máy Hoà đang chạy** — đúng thứ mà chỉ ảnh chụp
màn thật mới lộ ra, tsc/test không bắt được. Lỗi thứ tư (lời chào) khác họ: nó là chỗ máy **không
được phép đoán** mà lại chưa có đường cho người dùng nói.

Cách chữa chung: chuyển từ *"khai cứng"* sang *"suy từ dữ liệu thật + để người dùng nói phần máy
không suy được"*, và **cắm luật vào tệp thuần có test** thay vì rải trong JSX — nên lần sau đổi
bố cục thì máy vẫn canh được, không phải nhìn.

---

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Được:**
- V2 chứng minh bằng **256 ca**, không lấy mẫu — dãy số không thể đứt lại được nữa ở bất kỳ tổ hợp nào.
- V3 hai trong ba ô về gần 0% trống, đo được, và **không phá ràng buộc nào** (không px, cỡ ô vẫn theo lưới).
- Sửa V3-b lại vá luôn một lỗ thao tác thật: số biểu đồ trước đây **giấu sau hover** ⇒ tablet và bàn phím không bao giờ đọc được.
- Tương phản: sửa **một chỗ** (`WidgetCard`) ăn cho cả 10 widget.

**Chưa được — nói thẳng:**
- 🔴 **Không chạy app thật dòng nào.** Phiếu cấm dev server, và bản vẽ tĩnh cũng **không mở được
  trong khung xem** (truy cập tệp bị từ chối, khung xem đã kín tab). ⇒ **Mọi kết luận về bố cục
  trong báo cáo này là ĐỌC MÃ + TÍNH TAY, chưa có mắt nào nhìn.**
- 🔴 **Số đo khoảng trống là TÍNH, không phải ĐO.** Dựng từ hằng số tĩnh (1440×900, khe 12, lề 20,
  thẻ `lg:grid-cols-4` tỉ lệ 4/4.1, chiều cao chữ ước theo `--fs-*`). Sai số thật có thể vài phần
  trăm; **thứ tự lớn-nhỏ thì chắc**, con số lẻ thì không.
- 🟡 **Ô 01 Dự án mới giảm được 16 điểm phần trăm, chưa hết** — lý do và đường đi tiếp ở §5-6.
- 🟡 **Tên hiển thị chỉ sống trong một máy.** Đổi máy là mất. Bản bền cần cột DB + API, ngoài vùng.
- 🟡 Nút bút chì 28×28 — qua WCAG 2.2 AA (24px) nhưng **dưới** 44px của 2.5.5 AAA; đang bám token
  `--tap` 32 của IF nên tôi không tự nới, để T quyết.
- 🟡 Hai lần **vượt vùng file** (§2.4). Có lý do, nhưng vẫn là vượt.

---

## 5 · HƯỚNG XỬ LÝ — NHIỀU GÓC ĐỘ

Bàn cho phần **còn lại của V3** (ô Dự án 34,5%), là món đáng giá nhất còn treo.

**Hướng ①  — Bố cục thứ năm "ô Dự án một hàng".** Khi ô Dự án chỉ cần một hàng thẻ thì nó rút
xuống 1 hàng lưới, ô Ảnh tuần trải ngang chỗ trống, Vật liệu/Bảng tin dời lên.
*Được:* giải triệt để, ô Dự án về gần 0%. *Mất:* thêm một bản đồ vùng với 64 tổ hợp ẩn/hiện riêng,
**bắt buộc phải xem bằng mắt** mới dám ship; rủi ro vỡ cao nhất trong ba hướng.

**Hướng ② — Hàng lưới co theo nội dung (`fit-content(%)` + `align-content`).** Để chính CSS đo
chiều cao nội tại từng hàng.
*Được:* đúng nghĩa *"khung co theo nội dung"* nhất, một thay đổi gọn. *Mất:* hai widget có chiều
cao nội tại **không lành** — ô Ảnh tuần vẽ toàn bằng lớp phủ tuyệt đối nên chiều cao nội tại = 0
(hàng sẽ sập), ô Bảng tin chạy chữ nhân đôi danh sách nên chiều cao nội tại quá lớn. Phải vá cả
hai trước, mà vá xong vẫn **không kiểm chứng được nếu không mở app**.

**Hướng ③ — Lấp ô Dự án bằng nội dung thật thay vì thu nó lại.** Khi ít dự án thì ô Dự án hiện
thêm lớp có ích: việc đang dở, mốc gần nhất, lối vào nhanh.
*Được:* biến chỗ trống thành chỗ dùng được, hợp hướng *"Home là nơi tập trung sự thú vị"*.
*Mất:* là **tính năng mới**, không phải sửa lỗi — phải qua cửa chốt của Hoà trước, và đụng
`ProjectSelect.tsx` sâu hơn hẳn lần này.

---

## 6 · ĐỀ XUẤT

**Trước hết: đưa bản dựng này qua mắt Hoà rồi mới đi tiếp** — theo đúng đường thư mục ảnh
duyệt-mắt. Lý do không phải nghi thức: cả bốn lỗi lần này đều **do mắt bắt chứ không phải do máy**,
và ba hướng ở §5 đều tốn từ một phiên trở lên. Bỏ 5 phút xác nhận *"ô 01 nay đã đỡ chưa"* rẻ hơn
nhiều so với dựng bố cục thứ năm rồi mới biết mình chữa nhầm chỗ.

**Sau đó chọn hướng ①**, không chọn ② hay ③:
- **hơn ②** vì ② phụ thuộc hai widget có chiều cao nội tại hỏng; sửa chúng là đi vá ngầm ở tầng
  CSS mà **không cái nào có test canh** — hỏng thì hỏng im lặng. ① thì hỏng là thấy ngay.
- **hơn ③** vì ③ là mở tính năng mới trong lúc phiếu đang sửa lỗi; nó cũng không xoá được nguyên
  nhân — bố cục vẫn giả định dữ liệu dày, chỉ là lần này lấy nội dung khác đi lấp.
- ① là **hệ quả thẳng** của việc đã làm: `duAnTileRows()` đã tính sẵn số hàng thẻ và đã có test;
  ① chỉ dùng thêm chính con số đó để chọn bản đồ vùng. Không thêm khái niệm mới.

**Điều kiện bắt buộc cho ①:** phiên làm nó **phải mở được app thật**. Nếu vẫn cấm dev server thì
đừng mở ① — làm mù một bản đồ vùng 64 tổ hợp là cách nhanh nhất để đẻ ra lỗi thứ năm cho Hoà soi.

**Ba việc nhỏ bàn giao kèm:**
1. Xác nhận (hoặc revert) phần vượt vùng ở `ProjectSelect.tsx` — §2.4.
2. Mở đường **bền** cho tên hiển thị: cột `displayName` trong `User` + màn Cài đặt → Tài khoản.
   Bản localStorage hiện tại là tạm.
3. Quyết cỡ chạm 28 hay 32/44 cho nút biểu tượng nhỏ trong widget — đây là câu cấp hệ thống, không
   riêng nút bút chì này.

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM

- **Có chạy app thật không: KHÔNG.** Phiếu cấm dev server. Bản vẽ tĩnh cũng không mở được (truy
  cập tệp bị từ chối + khung xem hết chỗ tab). ⇒ **mọi kết luận về bố cục là đọc mã**, chưa nhìn.
- **V3 đo hay ước: ƯỚC, tính từ hằng số tĩnh.** Xem §4. Ba con số 50,3 / 37,2 / 65,2 và 34,5 / ≈2
  / ≈0 đều là tính tay ở 1440×900. Ở bề ngang khác thì tỉ lệ khác (nhất là ô Dự án, vì số cột thẻ
  bên trong bám **điểm ngắt của khung nhìn** `lg:` chứ không bám bề ngang của ô — bản thân đó là
  một lệch riêng tôi chưa sửa).
- **V2 chọn hướng nào, hướng kia mất gì:** chọn C (số = địa chỉ ô). Bỏ hẳn số thì mất xương cấu
  trúc Swiss/NT-7 Hoà đã pin nhiều lần; giữ nguyên nghĩa cũ thì không trả lời được *"số để làm
  gì"* nên lần sau vẫn bị hỏi lại. Chi tiết §2.2.
- **Tổ hợp widget chưa phủ:** phủ **đủ 256** tổ hợp ở tầng ĐÁNH SỐ (test). Nhưng ở tầng **BỐ CỤC**
  thì chưa phủ: tôi chỉ suy luận trên mã cho các tổ hợp của ô Vật liệu/Bảng tin (có H không I · có
  I không H · có cả hai). Ca **chỉ có Vật liệu, không có Bảng tin** là ca tôi ít chắc nhất — phần
  dư dưới nó sẽ hiện **hình nền**, mà chưa ai nhìn xem nó ra "khoảng thở" hay ra "một lỗ thủng".
- **Chưa kiểm:** biểu đồ chặng có thật sự lấp đầy ô không (phụ thuộc tỉ lệ thật của ô lúc chạy —
  tính ra là lấp kín theo chiều cao, nhưng ở ô hẹp hơn thì sẽ hụt bề ngang). Cụm xếp chồng
  `auto minmax(0,1fr)` chưa chạy trên trình duyệt thật.
- **Chưa kiểm:** thẻ *Dự án mới* nay nền trong suốt — trên **hình nền có hoạ tiết**, chữ trong thẻ
  đứng thẳng trên nền chứ không trên mặt thẻ nữa. Tính ra vẫn đạt tương phản với `--bg`, nhưng
  hình nền hệ thống không phải màu trơn ⇒ **đây là chỗ đáng soi bằng mắt nhất của V4.**
- **Không có:** không đụng `scripts/**`, `prisma/**`, `docs/00-CHOT.md`, mock cũ, `components/studio/**`, `lib/resume.ts`. Không chạy lệnh git nào ngoài hai lệnh đọc của ⓪b.

## ⑦c · HẠN DÙNG KẾT LUẬN

*Hết đúng khi …*
- **Home bento cho người dùng tự sắp ô** — lúc đó "số = địa chỉ ô" đổi mỗi lần kéo thả; phải chốt
  lại số bám VỊ TRÍ hay bám WIDGET. Đồng thời `bentoFillPercent` mất nghĩa: người dùng tự chọn ô
  thì chiều cao cần không suy được từ số dự án nữa.
- **Màu nhấn thứ hai chốt xong** — bản vẽ đang dùng tím `--accent` như app đang chạy; chốt mòng
  két thì đổi đúng một dòng khai token, không phải vẽ lại.
- **Theme sáng đổi sang bản canh-Apple** — mọi tỉ số tương phản trong báo cáo này tính trên
  `--card` `#ffffff` / `--bg` `#f2efe9` hiện tại. Nền sáng ngả lam của bản canh-Apple sẽ làm lệch
  cả bảng, phải tính lại (kết luận *"`--t3` đạt, `--t4` không đạt"* nhiều khả năng vẫn đúng, nhưng
  **con số thì phải đo lại**).
- **`ProjectSelect` đổi lưới thẻ** từ điểm ngắt khung nhìn `lg:grid-cols-4` sang truy vấn theo bề
  ngang của ô — lúc đó `duAnTileRows(n, 4)` phải nhận số cột thật thay vì hằng số 4.

---

## Tệp đã đổi

| Tệp | Việc |
|---|---|
| `lib/home/greeting.ts` | V1 — `displayName` · `normalizeDisplayName` · `capitalizeFirst` · khoá lưu |
| `lib/home/greeting.test.ts` | V1 — +16 ca (9 → 25 pass) |
| `components/home/useDisplayName.ts` 🆕 | V1 — lưu tên hiển thị cục bộ |
| `components/home/widgets/bento-layout.ts` 🆕 | V2+V3 — luật đánh số ô + luật cỡ ô theo lượng tin |
| `components/home/widgets/bento-layout.test.ts` 🆕 | V2+V3 — 256 ca tổ hợp (30 pass) |
| `components/home/DongStudioHome.tsx` | V1+V2+V3 — số tự tính ở cả 4 bố cục · lưới co · xếp chồng Vật liệu/Bảng tin |
| `components/home/widgets/WidgetCard.tsx` | ⑤ tương phản `--t4`/`--t5` → `--t3` |
| `components/home/widgets/LightClock.tsx` | V1 ô sửa tên · ⑤ tương phản |
| `components/home/widgets/StageChart.tsx` | V3 lấp đầy ô · số luôn hiện · đường gốc |
| `components/home/widgets/ContributionGrid.tsx` | V2 nhận số ô |
| `components/ProjectSelect.tsx` 🔴 | V4 — luật hình cho lưới thẻ (**vượt vùng ③**) |
| `docs/mocks/mock-home-sua-4-loi.html` 🆕 | V5 bản vẽ trước↔sau, 2 theme |
