# BÁO CÁO V1 — VỎ ĐIỀU HƯỚNG: rail hai cụm, ba nấc chi tiết

> Phiên phụ V1 · 17/08 · cây chính (không worktree) · chạy song song V2 và W.
> Phiếu: `docs/phieu-giao/V1-vo-dieu-huong.md` · nguồn cấu trúc: `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md`.

---

## 1 · TỔNG QUAN

Chốt 16/08 *"sidebar là hệ router toàn app"* trước phiên này có **0 dòng mã**; nay có rail hai cụm
mount ở ổ ⓪ của `AppShell`, phủ **cả 5 màn** dùng vỏ chung. Ba nấc chi tiết 28/240/320 là **ba
công năng thật** — nấc rộng nhất bày *tình trạng* lấy từ dữ liệu SỐNG (`lastStage` + tên bản đang
mở), không phải bản phóng to của nấc hẹp. `tsc` 0 · `npm test` **exit 0** · hai máy soi giữ
nguyên mốc · đích ⑤ đạt. Xong trong **1 vòng**, không dùng tới trần 5.

**Ba thứ đáng chú ý hơn cả phần việc:** ① đo trên trình duyệt thật bắt **3 lỗi mà đọc mã không ra**
② bảng màu Sáng trong bản vẽ ban đầu là do tôi **tự chế**, cho ra số tương phản đẹp hơn thực tế
③ một phiên thứ ba đã **commit đè lên file đang làm dở** của cả V1 lẫn V2 (§4).

---

## 2 · CHI TIẾT TỪNG MỤC

### ⓪b Tiền đề hạ tầng — PASS
`git log --oneline -1` = `bde99c4` · `git rev-list --count HEAD..main` = **0** · nhánh `main`.

### ⓪ Tiền đề nghiệp vụ — XÁC NHẬN (kèm một đính chính đường dẫn)

| Khẳng định của phiếu | Đo được | Kết |
|---|---|---|
| Không có component rail/sidebar nào | `components/nav/` không tồn tại; `grep Sidebar` chỉ ra `NotebookSourcesSidebar` (cột nguồn của Sổ tay — khác bản chất) | ✅ |
| `/materials` chỉ với tới từ 2 chỗ | `components/present-editor/boq/BoqErrors.tsx:80` · `app/settings/_components/PixelSettingsShell.tsx:73` — đúng 2 | ✅ |
| Đây là dựng mới | — | ✅ |

🔧 **Phiếu ghi sai một đường dẫn**: vùng ghi khai `components/AppShell.tsx`; đường thật là
**`components/studio/AppShell.tsx`**. Không phải ca bác tiền đề (cùng một file), đã làm tiếp.

### ③ Việc — 7/7

| # | Việc | Kết quả |
|---|---|---|
| 1 | `components/nav/RailDieuHuong.tsx` + `muc-dieu-huong.ts`, marker `[marker: railHaiCum]` | ✅ Bảng khai tách khỏi component để **kiểm được bằng máy**; 46 kiểm trong `muc-dieu-huong.test.ts` đạt hết |
| 2 | Ba nấc = ba công năng, mục nào không có gì để nhìn thì bỏ nấc 320 | ✅ **4 mục cố ý bỏ** (Tổng quan · Chat · Họp · Cài đặt), mỗi mục kèm `viSao` đọc được; test khoá *"bỏ thì phải khai lý do"* |
| 3 | Thu/mở nhớ giữa phiên, cấm auto-hide | ✅ `localStorage` khoá `interiorflow.rail.nac_v1`; **không nghe `resize`** — khác `Navigator.tsx:74-80` có auto-thu, và khác đó là chủ ý (ghi lý do tại chỗ) |
| 4 | Cụm dự án mờ kèm lý do, `aria-disabled` + `aria-describedby` | ✅ 0 chỗ dùng `title`, 0 chỗ dùng thuộc tính `disabled` — đo trên trình duyệt |
| 5 | Chat · Họp mờ kèm lý do, không nút giả | ✅ |
| 6 | Đóng dấu docstring `StageSwitcher.tsx` | ✅ Câu *"TRỤC ĐIỀU HƯỚNG DUY NHẤT"* đóng dấu **hết hiệu lực** tại chỗ + trỏ sang rail |
| 7 | Mock 2 theme · 3 nấc · ca chưa mở dự án · `@dsCard` | ✅ `docs/mocks/mock-rail-hai-cum.html`, 8 rail (28/240/320 × 2 theme + 2 ca trống) |

### Nấc 320 — cái gì THẬT, cái gì mới khai

| Đã nối nguồn thật | Chưa nối — dòng tình trạng **tự ẩn** |
|---|---|
| **Dự án này** → tên bản đang mở (store) | Bảng việc · Sổ tay |
| **3 chặng** → *"đang dở"*, đọc `lib/shell/last-stage.ts` (cùng khoá card Gallery đang dùng) | **Files · Thư viện** — nguồn nằm trong **vùng ghi của V2** ⇒ khai rồi để đó, **không tự nối** |

⇒ Nấc 320 **không phải kéo dãn**: có 4 mục bày thứ nấc 240 không mang nổi, nhìn thấy được trên ảnh.
Test khoá luôn điều này (*"ít nhất một mục đã nối nguồn thật — nếu không, nấc 320 chỉ là kéo dãn"*).

### Ba lỗi CHỈ ĐO TRÊN TRÌNH DUYỆT MỚI RA

| Lỗi | Vì sao đọc mã không thấy | Sửa |
|---|---|---|
| Nút đổi nấc bị bóp còn **16×32** ở nấc 28 | Mã ghi `width: var(--tap)` (=32) và **trông đúng**; nó co lại vì thiếu `flex-shrink:0` trong khung 28px | Ghim 24px riêng ở nấc đó — vẫn đạt 24×24 của WCAG 2.2 AA, và là số lớn nhất nấc ấy chứa nổi |
| Mục mờ hiện thành **pill trắng** giữa nền tối | Mục mờ là `<button>`, mục dùng được là `<a>`; `.muc` không khai `background` ⇒ nút ăn nền mặc định trình duyệt | Dựng lại nền/viền/phông của nút trong cả bản vẽ lẫn mã |
| Ô giải nghĩa **bị cắt mất** | `.than{overflow:hidden}` cắt thẻ thò ra — đúng hiện tượng khiến `Tooltip.tsx` phải portal ra `document.body` | Bản vẽ mở khoá + ghi rõ *"đừng chép dòng này vào mã"* |

### Tương phản — đo, không đoán

Bộ tính được **hiệu chuẩn trước** trên hai con số đã biết của `--mo-vo-hieu` (**4,01** Tối ·
**3,36** Sáng, `globals.css:288`) rồi mới dùng; sau đó **đối chiếu lại bằng `getComputedStyle`
trên trình duyệt** — hai bên khớp từng số.

| Chỗ | Trước | Sau | Cách sửa (không đụng `--accent*`, không thêm token) |
|---|---|---|---|
| Tên cụm + dòng tình trạng | `--t4` 3,65 / **2,86** ❌ | `--t3` **6,93 / 4,90** ✅ | đổi bậc chữ |
| **Chữ** mục đang mở | `--accent` trên `accent-soft` 3,32 / 3,84 ❌ | `--t1` **14,9 / 13,0** ✅ | màu nhấn rời khỏi CHỮ, ở lại đúng chỗ hợp lệ: **icon + dải đặc 2px** (3,32/3,84 ≥3:1 cho hình) |
| Vòng focus | `--accent-ring` 55% → 1,95 / 2,19 ❌ | `--accent` đặc + đệm **3,76 / 4,61** ✅ | dùng token đã có, đổi chỗ dùng |

⭐ Cái dải 2px vừa là chốt định danh 15/08, vừa **thêm kênh HÌNH DẠNG** cho trạng thái "đang mở" —
nên nó không còn phụ thuộc mỗi việc phân biệt sắc độ.

### ⑤ Đích — đạt hết, 1 vòng

| Đích | Mốc đầu phiên | Kết phiên |
|---|---|---|
| `tsc` | 0 | **0** |
| `npm test` | — | **exit 0**, 0 fail |
| `soi:tu-dien` — lệch nhãn | 4 | **4** (không thêm) |
| `soi:tu-dien` — chữ trần | 273 | **279** — xem ghi chú ngay dưới |
| `soi:hinh-hoc` | 10 ngoài thang | **10** (không thêm) |

🧪 **Con số chữ trần nhích 273 → 279, và tôi KHÔNG lập luận rằng "không phải tôi" — tôi làm thí
nghiệm**: cất `components/nav/` + `mock-rail-hai-cum.html` ra ngoài cây rồi đo lại → **279**; trả
vào → **279**. Đóng góp của V1 = **0**. Phần tăng đến từ tệp `.md` mới do **phiên song song**
(V2/W) thêm vào `docs/phieu-giao` — cùng đúng cách P-L đã làm 16/08 khi gặp ca y hệt.
`grep components/nav|mock-rail-hai-cum` trong đầu ra máy soi = **0 chỗ**.
| `grep "Bảng màu\|Kho vật liệu"` trong mock | — | **0** |
| Bản vẽ tự chấm | — | 0 id trùng · 0 mục mờ thiếu lý do đọc được · 0 `title` · 0 `disabled` · 0 nhóm không tên · 0 nút <24px |

📌 Máy soi từ điển **bắt lỗi của chính tôi**: docstring giải thích *"chuỗi X là sai"* lại **trích
nguyên văn chuỗi X** → +1 lệch nhãn. Đã diễn đạt lại. Ghi ra vì nó chứng minh máy soi chạy đúng
kể cả khi người viết đang nói về chính luật đó.

---

## 3 · TỔNG KẾT

Rốt cuộc phiên này làm **một việc kiến trúc, không phải một việc giao diện**: app từ chỗ là các
route rời nay có một bản đồ chung, và bản đồ ấy **khai bằng dữ liệu** (`muc-dieu-huong.ts`) chứ
không khai bằng JSX — nên mọi quyết định cấu trúc (mục nào tồn tại · thứ tự · mờ vì gì · nấc rộng
bày gì) đều **kiểm được bằng máy**, không phải bằng mắt người đọc lại.

Ba luật của Hoà được biến thành thứ máy giữ, không phải thứ nhắc nhau:
- *"ba nấc là ba công năng, không phải ba cỡ"* → test bắt **phải có mục nối nguồn thật**, và bỏ
  nấc thì **phải khai lý do**.
- *"mờ thì phải nói vì sao"* → test bắt **không đường đi ⟺ có lý do** (hai chiều).
- *"ba thứ đã gỡ khỏi rail"* → test chặn chúng bò lại.

---

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Được:** vùng ghi không tràn sang V2/W; hai máy soi giữ đúng mốc; nấc 320 có nội dung THẬT ở 4
mục nên không rơi vào bẫy kéo dãn; ba lỗi hiển thị bắt được **trước khi** tới mắt Hoà.

**Chưa được — nói thẳng:**

1. 🔴 **Bảng màu Sáng trong bản vẽ ban đầu do tôi TỰ CHẾ** (xám trung tính), không đọc từ
   `globals.css`. Nguy ở chỗ nó cho ra **số tương phản đẹp hơn thực tế** — `--t4` đo 3,41 thay vì
   2,86 thật. Nếu không hiệu chuẩn bộ tính thì đã nộp một bản vẽ *"đạt"* trên một bảng màu không
   tồn tại. Đã sửa theo nguồn (kem ấm `globals.css:262-289`).
   ⇒ **Bài học chung: bản vẽ phải bày thứ ĐANG CHẠY, không bày thứ mình mong nó thành.**

2. 🔴 **Một phiên thứ ba đã commit đè lên file đang làm dở.** HEAD chạy `bde99c4` → `804f17a`
   giữa lượt; commit **`46278fa` (`docs(memory): …`)** nuốt vào 5 tệp mã đang dang dở của **cả V1
   lẫn V2**: `components/nav/muc-dieu-huong.ts` · `muc-dieu-huong.test.ts` · `app/files/_lib/ngan-tho.ts`
   · `ngan-tho.test.ts` · `NganPhanTho.tsx`. Tôi **không chạy lệnh git ghi nào** (phiếu cấm).
   Không hỏng nội dung, nhưng nay có một commit tài liệu mang theo mã nửa chừng của hai phiên.
   ⇒ Đây là `claim-keys-va-cham` **ở cấp COMMIT**, không phải cấp tệp: khoá phạm vi theo tệp không
   chặn nổi một `git add` rộng tay của phiên thứ ba.

3. 🟡 **Rail chưa chạy trên app thật** — phiếu cấm dev server. Mọi kết luận hiển thị lấy từ bản vẽ,
   không phải từ `AppShell` đã mount.

4. 🟡 **Hai cột trái cùng lúc** (ổ ⓪ rail + ổ ② Navigator) ở 5 màn. Đúng thiết kế (bản đồ ≠ nội
   dung chặng) và đã ghi cảnh báo chống-gộp trong docstring, nhưng **chưa ai nhìn bằng mắt** xem ở
   1440px nó có chật không. Đây là món đáng đưa vào lô duyệt mắt trước tiên.

---

## 5 · HƯỚNG XỬ LÝ — nhiều góc

**Về nấc 320 còn trống ở Files/Thư viện:**
- (a) *Để V2 nối khi xong kệ* — đúng ranh giới vùng, nhưng nấc 320 còn 2 mục trơ tới lúc đó.
- (b) *T mở một phiếu nối riêng sau khi V2 đóng* — sạch, nhưng thêm một lượt.
- (c) *Tạm bỏ nấc 320 cho hai mục ấy* — trung thực tuyệt đối, nhưng phải làm lại khi V2 xong.

**Về hai cột trái:**
- (a) *Giữ nguyên, đưa vào lô duyệt mắt* — rẻ, và câu trả lời thuộc về mắt Hoà chứ không thuộc về mã.
- (b) *Mặc định rail ở nấc 28 cho 3 màn chặng* — đỡ chật ngay, nhưng đá vào luật "rail không đổi theo chặng".

**Về commit đè:**
- (a) *Ghi vào sổ, siết `claim-keys` lên cấp commit* — chặn tái phát.
- (b) *Bỏ qua* — nội dung không hỏng, nhưng lần sau có thể nuốt phải mã đang gãy giữa chừng.

---

## 6 · ĐỀ XUẤT

1. **Nấc 320 → chọn (a)**, và để nguyên phần khai `daNoiNguon: false`. Nó là **ô trống có khai
   báo**, đúng luật §9 *"ô trống là bằng chứng còn việc"*; (c) sẽ phải dựng lại, (b) tốn một lượt
   cho thứ V2 sắp chạm tới.
2. **Hai cột trái → chọn (a)**, đưa lên **đầu** lô duyệt mắt. Câu hỏi *"nhìn có chật không"* không
   có cách kiểm bằng máy; (b) là đổi kiến trúc để chữa một nỗi lo **chưa ai xác nhận là có thật**.
3. **Commit đè → chọn (a)**, và cụ thể: siết `claim-keys-va-cham` thêm một vế — *phiên nào commit
   phải liệt kê đường dẫn tường minh, cấm `git add -A`/`git add .` khi có phiên song song*. Ca hôm
   nay là bằng chứng đầu tiên rằng khoá theo tệp là chưa đủ.
4. **T đối chiếu nhãn ba chặng trong hợp đồng §1** với từ điển máy — bảng §1 dùng lối gọi mà
   `soi:tu-dien` báo đỏ trong `components/`. Tôi đã lấy theo bản cuối 07/08 (khớp `StageSwitcher`
   + từ điển) và ghi lý do tại chỗ; **nếu T muốn ngược lại thì phải sửa từ điển máy trước**, không
   sửa mỗi mã.

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM

- **Chưa chạy app thật một dòng nào** (phiếu cấm dev server). Rail đã mount vào `AppShell` và `tsc`
  sạch, nhưng **chưa ai thấy nó vẽ ra trong app**. Mọi số hiển thị lấy từ bản vẽ.
- **Chỉ đo trên một trình duyệt** (nhân Chromium của khung xem trước). Safari/Firefox là **suy**.
- **Chưa thử trình đọc màn hình thật.** Cây trợ năng đúng theo thuộc tính (`aria-disabled` ·
  `aria-describedby` trỏ phần tử ẩn-nhìn-vẫn-đọc-được · `role=group` có tên · `aria-current`),
  nhưng **VoiceOver/NVDA đọc ra sao thì chưa nghe.**
- **Nhánh `prefers-reduced-motion` chưa kích hoạt lần nào** — mã có, chưa chạy thử.
- **Nhánh cảm ứng chưa thử**: `--tap`/`--row` nở lên 44 qua media query sẵn có; **chưa đo thật**.
- **`getLastStage` chưa thấy trả giá trị thật trong rail** — đọc đúng khoá mà card Gallery ghi
  (`lib/studio/stage-nav.ts:39`), nhưng chuỗi ghi→đọc chưa chạy sống lần nào trong phiên này.
- **Tương phản là TÍNH + đọc `getComputedStyle`, không phải chụp màn rồi soi pixel.** Nếu có lớp
  bán trong suốt nào chen giữa trong app thật (rail nằm trên `--panel`, đã giả định vậy) thì số đổi.
- **Chưa biết hai cột trái nhìn có chật không** ở 1440×900 — chưa mở app.
- **Chưa đẩy bản vẽ lên Claude Design**: phiên phụ không có `DesignSync` (đã xác nhận 16/08).
  **T đẩy ở bước audit**; marker `<!-- @dsCard group="Điều hướng" -->` đã gắn sẵn dòng đầu.
- **`role="group"` cho hai cụm là lựa chọn của tôi**, không phải chốt của ai. Có thể `role="list"`
  hợp hơn — chưa hỏi, chưa thử với trình đọc màn hình.

## ⑦c · HẠN DÙNG KẾT LUẬN

| Kết luận | Chết khi |
|---|---|
| Mọi số tương phản trong báo cáo này | **theme Sáng đổi sang bản canh-Apple** (đang xếp hàng) ⇒ **phải đo lại toàn bộ**; các số Tối vẫn đúng |
| *"màu nhấn chỉ dùng cho hình, không cho chữ"* | Hoà chốt **màu nhấn thứ hai** — mòng két/mận có tương phản khác, chữ có thể dùng lại được |
| `/materials` và `/colors` cùng sáng ở **Thư viện** | V2 gộp xong hai route đó thành kệ/bước ⇒ hai dòng trong `mucDangMo()` thành thừa, xoá được |
| `mat320.daNoiNguon: false` của Files · Thư viện | V2 mở nguồn ⇒ đổi thành `true` và nối dòng tình trạng |
| *"Chat · Họp mờ vì chưa có trang"* | Ai đó dựng trang chat ⇒ gỡ `chuaCoTrang`, mục tự sống |
| Đường dẫn `components/studio/AppShell.tsx` | Vỏ app được xếp lại lần nữa |
| Số đo hiện trạng ở §2 (2 chỗ tới `/materials`, 25 route…) | Bất kỳ phiên nào thêm route hoặc thêm lối đi |

---

## PHỤ LỤC · TỆP ĐÃ ĐỘNG

**Tạo mới**
- `components/nav/muc-dieu-huong.ts` — bảng khai (hai cụm · ba nấc · lý do mờ · nấc 320 bày gì)
- `components/nav/muc-dieu-huong.test.ts` — 46 kiểm, 7 nhóm
- `components/nav/RailDieuHuong.tsx` — component
- `docs/mocks/mock-rail-hai-cum.html` — bản vẽ, `@dsCard group="Điều hướng"`
- `docs/bao-cao-phien/2026-08-17-V1-vo-dieu-huong.md` — tệp này

**Sửa**
- `components/studio/AppShell.tsx` — thêm ổ ⓪ + cảnh báo chống-gộp ổ ⓪ với ổ ②
- `components/studio/StageSwitcher.tsx` — đóng dấu docstring hết hiệu lực

**KHÔNG đụng** (vùng V2/W): `app/files/**` · `components/library/**` · `app/colors/**` ·
`scripts/` · `components/entry/**` · `app/globals.css`.

⚠️ `git status` **có** hiện các tệp đó là đã sửa — vì V1 và V2 **dùng chung một cây làm việc**,
đó là tay của V2. Bằng chứng V1 không chạm: `git diff --name-only HEAD` giới hạn trong vùng V1 ra
đúng 3 tệp (`muc-dieu-huong.ts` · `AppShell.tsx` **+9 dòng** · `StageSwitcher.tsx` **+15/−2**), và
`grep "RailDieuHuong|railHaiCum|muc-dieu-huong"` trong 4 tệp vùng V2 = **0**.
