# THẺ RESUME BẤM ĐƯỢC — J05 đóng, và một lỗi sản phẩm mới lộ ra

> Lane **04 · DESIGN + 02 · WORKFLOW** · 04/09 · mốc vào `f43de304` → ff-only lên
> `ed19574c` (`origin/integration/2026-09-04`, lệch **218 commit**).

## 1 · Tổng quan

Thẻ tiêu điểm ở Home — đường vào hạng nhất của sản phẩm — **nay làm đúng điều nó hứa**: bấm cả
thân thẻ là về đúng chặng đang dở, bằng chuột **và bằng bàn phím**. Hành trình **J05 PASS trên app
thật**, có hiệu chuẩn hai tầng. Cột KẾT QUẢ ĐÃ LƯU của ma trận đi từ **8/22 → 9/22**.

Kèm theo: lượt chạy đầu tiên làm lộ **một lỗi sản phẩm khác, nằm ngoài thẻ Resume** — resume ghi
thiếu `flowId` khi vào thẳng route studio, khiến thẻ dội về Home. Đã khai `D6`, **không tự vá**
(ngoài vùng ghi của phiếu).

---

## 2 · Chi tiết

### 2.1 · Vùng bấm — quyết thế nào, căn cứ gì

**Chọn: lớp phủ `<Link>` kín cả thẻ** (`.mo-lai`, `position:absolute; inset:0`), là con **trực
tiếp** của `.vat`.

| Phương án | Vì sao loại / chọn |
|---|---|
| bọc cả thẻ trong `<button>` | ⛔ **nút-trong-nút**. Thân `bat-dau` có BA nút lối vào bên trong. Ràng buộc "ca có `href` thì thân là `tom-tat`" chỉ là **quy ước dữ liệu — TypeScript không chặn** |
| một nút nhỏ trong thẻ | vùng chạm ~100×28 trên thẻ **816×546** (đo thật). Đây là tiêu điểm chính của Home (D-DR2); vùng chạm bằng một con chip là tự hạ cấp nó. Và chữ "bấm" ở chân thẻ vẫn trỏ vào cái gì không rõ |
| ✅ **lớp phủ `<Link>`** | cả thẻ bấm được · HTML hợp lệ · **một** tab-stop · `<a href>` thật ⇒ ⌘-click mở tab mới, đích hiện ở thanh trình duyệt, và luật focus toàn app `:where(a[href],…)` (`globals.css:435`) **tự nhận**, không phải chế thêm affordance |

**Cái giá, khai thẳng**: lớp phủ **chặn bôi đen chữ trong thẻ**. Đó là giá cố hữu của *mọi* phương
án "cả thẻ bấm được"; với thân `tom-tat` bốn dòng thì đổi được.

**Chi tiết kỹ thuật suýt sai**: đặt lớp phủ trong `.vat-dau` thì bị `overflow:hidden` + cao cố
định 46px (`home-lock-css.ts:133`) **xén còn dải tiêu đề**. Phải là con trực tiếp của `.vat`.

**Ràng buộc "không nút-trong-nút" do MÁY giữ, không do lời dặn**: `duongMoLai()` trả `null` cho
thân có nút, và test đối chiếu `THAN_CO_NUT` với **chính JSX dựng thân** — thêm một `ThanVat` mới
có nút mà quên khai thì **test đỏ**, không phải chờ ai nhớ.

### 2.2 · Bàn phím thuần — mục đo kỹ nhất

| Câu hỏi | Đo được trên Chromium 1194, app thật |
|---|---|
| Tab tới được không? | ✅ **19 lần Tab** thì tiêu điểm rơi vào `.mo-lai` |
| Enter chạy không? | ✅ `http://localhost:3098/` → `/projects/<id>/cad` |
| Vòng focus lấy từ token nào? | ✅ `2px solid rgb(106, 87, 245)` = `--stroke-focus` + `--focus-ring` (`globals.css:413,418`). **0 hex trong mã**, test canh điều đó |
| Ring có bị xén không? | Dùng **ring TRONG** `outline-offset: calc(-1 * var(--stroke-focus))` — `.vat` có `overflow:hidden` nên ring ngoài **sẽ bị xén**; cùng lý do `.if-focus-inset` tồn tại |

Hover: **chỉ đổi nền + độ nổi, CẤM scale** (thẻ lớn — `SPEC-HOVER-FOCUS-IDF`), nền pha bằng
`color-mix` từ token, vào 180ms ra 120ms. `prefers-reduced-motion` tắt chính hai lớp này (test
canh **đúng khối đó**, không phải "có tồn tại một `@media` nào đó trong tệp").

### 2.3 · J05 đầu-cuối

```
vẽ ở chặng 2D → về Home → Tab 19 → Enter → /projects/<id>/cad
→ ĐÓNG HẲN trình duyệt (launchPersistentContext trên hồ sơ đĩa)
→ mở lại Home → thẻ vẫn trỏ "/projects/<id>/cad"
```

**Đọc từ nơi lưu thật**, không đọc chữ trên màn: `localStorage['interiorflow.resume.<uid>']`
(`lib/resume.ts:25`) — sau khi mở lại vẫn là `{route:'/cad-editor', flowId:'cmtnh6d33…'}`.
Không dùng `newContext()` (nó vứt IndexedDB lúc đóng ⇒ "mở lại" vô nghĩa từ định nghĩa) và
**không có `reload()` nào** trong đường đo.

Bằng chứng: `docs/delivery/anh-duyet-mat/j05/` — 3 ảnh + `ket-qua.json`. Cả 4 tệp
`git check-ignore` **rc=1** (được theo dõi).

### 2.4 · Hiệu chuẩn — hai tầng, vì tầng một chưa đủ

| Thế giới hỏng | Kết quả | Đỏ ở khẳng định nào |
|---|---|---|
| chặn `localStorage.setItem` cho khoá resume | ❌ FAIL | ⓪ *"resume không ghi chặng 2D"* — mới chỉ chứng minh bộ **đọc được nơi lưu thật** |
| **gỡ hẳn lớp phủ trong mã** (`duongMoLai` trả `null`) | ❌ FAIL | ① *"Home có việc đang dở nhưng thẻ KHÔNG có lớp phủ bấm được"* — **đúng khẳng định trung tâm** |
| cắm lại dây | ✅ PASS | — |

Tầng hai là tầng đáng kể: nếu chỉ chạy tầng một thì bộ đo có thể **mù hoàn toàn với chính lớp
phủ** mà vẫn báo "hiệu chuẩn đạt". Và ở lượt gỡ dây, **chân thẻ tự đổi** sang *"chưa đủ dấu vết
để quay lại — chọn một dự án ở cột bên"* — chứng minh cơ chế một-nguồn chạy thật, chứ không phải
hai chuỗi rời nhau tình cờ khớp.

Không **thoái hoá**: thế giới lành PASS, thế giới hỏng FAIL, và đỏ vì **khẳng định** chứ không vì
hạ tầng (khung tự phân biệt FAIL với LỖI).

### 2.5 · Một nguồn cho lời hứa

Trước: `chanCuoi` gõ cứng *"bấm để về đúng chỗ bạn rời đi"*, `href` **không ai tiêu thụ** — hai
nửa rời nhau nên có trạng thái *hứa mà không làm*. Nay **cùng đọc `duongMoLai()`**, nên không còn
trạng thái nào mà một nửa hứa còn nửa kia im.

Kèm phát hiện khi viết hàm: `resumeHref()` trả **`/`** cho ca `stage==='render'` không có
`routeId` (`resume-card.ts:101`) — ở Home thì `/` chính là **trang đang đứng**, tức nút giả
bấm-đứng-yên. Đã chặn, có test.

### 2.6 · 🔴 D6 — lỗi sản phẩm mới, ngoài phạm vi, KHÔNG tự vá

Lượt chạy J05 **đầu tiên FAIL**, và đó là lỗi thật chứ không phải lỗi bộ đo:

```
resume ghi ra: {"route":"/cad-editor","sheetId":"cadsheet-0"}   ← THIẾU flowId
⇒ routeId = null ⇒ resumeHref() = "/cad-editor" ⇒ LegacyStageRedirect dội về "/"
```

Gốc: `ResumeTracker.tsx:41-44` `if (!userId) return;` — bỏ qua lượt ghi khi `lastUserId` chưa kịp
gieo (đua với `lib/danh-tinh-phien.ts`, docstring `:202` **tự khai** thứ tự đó), và nó **chỉ chạy
lại khi `pathname` đổi** ⇒ không ai ghi lại. `computeResumePatch()` **đúng** — chỗ đứt ở người gọi.

Cùng gốc với **D1** (định danh neo vào `localStorage` thay vì phiên máy chủ), khác biểu hiện: D1
làm *mất việc*, D6 làm *mất đường quay lại*. Đã khai `docs/delivery/PRODUCT-DEFECTS.md` **D6**.
`components/entry/**` nằm ngoài vùng ghi của phiếu ⇒ khai, không vá.

J05 đi **đúng luồng của nó** (mở app ở Home → vào chặng → về Home) nên không dính D6; nhánh
deep-link là **J16**, mà J16 đo IndexedDB chứ không đo resume ⇒ **chưa hành trình nào canh D6**.

### 2.7 · Máy kiểm

| | rc | kết quả |
|---|---|---|
| `npx tsc --noEmit` | 0 | sạch |
| `npm test` | 0 | **0 fail** trên 266 suite |
| `soi:frontier` | 0 | **0 LỆCH** |
| `soi:hinh-hoc` | 0 | **32** — giữ mốc |
| `soi:tu-dien` | 0 | **322** — giữ mốc |
| `soi:cong-cu-chet` | 0 | **40 ca** |

🔴 **Mốc `soi:cong-cu-chet` trong phiếu ghi 41, đo được 40 — đã truy, không bỏ qua.** Chạy chính
máy soi đó trên **mốc `HEAD` sạch** (`git archive` ra `/tmp/moc-head`) cũng ra **40** ⇒ con số 41
là số **trước khi merge 218 commit**; đóng góp của lượt này = **0**. Đo, không lập luận.

`git status --short` rỗng trước khi commit; dev server 3098 đã tắt (`curl` **rc=7**); 3097 của
lane khác **không đụng tới**.

**CSDL repo chính khớp mốc sạch chính xác**: `User 1 · Project 4 · Flow 5 · Member 3 · File 2 ·
Credit 1`. Dấu vết của lượt này (+1 user `g2@kiemthu.local`, +1 dự án) nằm **trong CSDL của lane**
— chứng minh `DATABASE_URL` tuyệt đối đã chặn được đường rò qua symlink `@prisma/client`.

---

## 3 · Tổng kết

Một thẻ, ba thứ được đóng cùng lúc: **hành vi** (bấm được, chuột lẫn bàn phím), **tính trung
thực** (lời hứa và đường dây dùng chung một nguồn, nên không thể lệch), và **máy canh** (test
khoá ràng buộc nút-trong-nút + hành trình J05 khoá đầu-cuối, có hiệu chuẩn hai tầng).

Giá trị lớn nhất của lượt này **không phải cái nút** — mà là việc chạy nó tới cùng đã **lôi ra D6**,
một lỗi P1 mà bốn hành trình PASS trước đó không chạm tới. Đúng điều luật PASS nhắm tới: chỉ chạy
thật mới thấy đường dây đứt ở đoạn cuối.

---

## 4 · Đánh giá khách quan

**Được**
- J05 PASS **có hiệu chuẩn hai tầng**, trong đó tầng gỡ-dây-trong-mã là tầng thật sự chứng minh.
- Bàn phím là **đường đo chính**, không phải phần phụ kiểm sau.
- Ràng buộc kiến trúc (không nút-trong-nút) thành **khẳng định test**, không thành docstring.
- Không rò ghi sang CSDL repo chính — chứng minh bằng số đếm, không bằng `mtime`.

**Chưa**
- 🟡 **Chỉ đo Chromium 1194.** Safari/WebKit — nơi `:has()` và `color-mix` có lịch sử khác — **chưa
  chạm**. Hover và ring là suy, không phải đo, trên trình duyệt đó.
- 🟡 **Chưa thử trình đọc màn hình thật.** `aria-label` đúng cấu trúc nhưng chưa ai nghe nó đọc ra.
- 🟡 **`prefers-reduced-motion` chưa kích hoạt lần nào** — nhánh có, test canh nó bao đúng hai lớp
  mới, nhưng **chưa chạy với cờ bật**.
- 🟡 **Hover chưa có ảnh.** Đây là delta thị giác thật (nền đổi + bóng đậm lên) mà mắt chưa duyệt.
- 🟡 **J05 chỉ đo ca `tom-tat`.** Ca `bat-dau` (Home có dự án nhưng máy này chưa có việc dở) và ca
  Home rỗng **chưa vào hành trình** — mới có test đơn vị.
- 🔴 **Ngoài phạm vi, thấy thì khai**: thân thẻ ở ảnh `J05-1` để **~300px trống** dưới bảng bốn
  dòng — sát cờ đỏ **N-10 "hộp rỗng khổng lồ"**. Phiếu cấm thiết kế lại Home nên **không đụng**,
  nhưng đây là thứ mắt sẽ thấy ngay khi duyệt.
- **Không làm J01/J02/J03** — quyết định có lý do, xem §5.

---

## 5 · Hướng xử lý — hai góc

**Vì sao không thêm hành trình thứ hai trong lượt này.** J01 (đăng ký) **ghi thêm hàng `User` vào
CSDL** — chính là phép đếm mà §⑤ dùng để chứng minh không rò ghi. Đổi một hành trình phụ lấy việc
làm mờ bằng chứng zero-loss là **không đáng**. J02 phụ thuộc `AUTH_SECRET` của Electron (ngoài
trình duyệt), J03 là D3 đang mở. Phiếu cũng nói thẳng: *một hành trình đi trọn hơn ba cái nửa
đường*.

| Hướng | Ưu | Nhược |
|---|---|---|
| **A · đóng D6 trước** (định danh lấy từ phiên máy chủ, `localStorage` hạ xuống bộ đệm) | đóng luôn **D1 P0** — cùng gốc; sửa một lần, hai lỗi tắt | chạm `components/entry/**` + `lib/danh-tinh-phien.ts`, là vùng nhiều lane đọc; cần phiếu riêng |
| **B · thêm khẳng định `flowId` vào J16 trước** | rẻ, thuần bộ đo, biến D6 thành thứ **máy canh** thay vì dòng chữ trong sổ | không sửa gì cho người dùng — D6 vẫn sống |
| **C · đưa thẻ Resume qua cửa mắt** (ảnh hover + reduced-motion + ca rỗng) | mở khoá cột 👁 (đang **1/78**) | không đóng lỗi nào |

## 6 · Đề xuất

**B trước, rồi A.**

B là **một khẳng định trong bộ đo đã chạy được** — vài dòng, biến D6 từ *ghi trong sổ* thành *máy
báo đỏ khi tái phát*. Bài học đã trả giá ba lần trong ngày (trạng thái cũ tự lan; máy soi báo quá
tay; `ProjectFile=0`) đều cùng một hình dạng: **thứ không có máy canh thì trôi**. D6 hiện **chưa
hành trình nào canh** — đó là rủi ro lớn hơn bản thân lỗi.

A đáng làm ngay sau, và đáng làm **một lần cho cả D1+D6** — nhưng nó là phiếu riêng, vùng ghi
khác, và `PRODUCT-DEFECTS` D1 đã cảnh báo sẵn: *"cấm sửa kiểu vá điểm, đây là lần thứ ba cùng một
họ bệnh"*. Ghép D6 vào cùng lượt sửa D1 làm lập luận mạnh hơn: hai biểu hiện, một gốc.

C xếp sau vì băng thông mắt Hoà là tài nguyên khan nhất — nên gộp thẻ Resume vào **cùng lô** với
các quyết định thị giác Home khác, thay vì tiêu một lượt duyệt cho một cái nút.

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM

- Chỉ **Chromium 1194**. Safari/Firefox: **chưa chạm** — `:has()` cho hover và `color-mix` cho nền
  là hai chỗ dễ khác nhất.
- **Chưa thử trình đọc màn hình** (VoiceOver/NVDA). `aria-label` đúng cấu trúc, chưa ai nghe.
- **`prefers-reduced-motion` chưa chạy với cờ bật thật** — chỉ có test canh nhánh CSS tồn tại và
  bao đúng hai lớp mới.
- **Hover/press chưa có ảnh** — mắt chưa duyệt delta thị giác.
- Ca `bat-dau` và Home rỗng: **test đơn vị có, hành trình chưa**.
- Con số Tab **19** phụ thuộc số phần tử focus được **trước** thẻ; đổi rail/thanh trên là đổi.
  Khẳng định không neo vào 19 (nó dò tới `tran = 40`), nhưng con số trong báo cáo thì có hạn dùng.
- `soi:cong-cu-chet` **40 ca** vẫn là **sàn**: máy tự khai *"chứng minh CÓ ĐƯỜNG MOUNT, KHÔNG
  chứng minh BẤM VÀO CÓ VIỆC XẢY RA"*.
- D6: đã đo **triệu chứng + đọc mã gốc**, **chưa** dựng lại ca hỏng có kiểm soát để chứng minh
  nhân quả. Kết luận nhân quả là **đọc mã**, không phải thí nghiệm.

## ⑦c · HẠN DÙNG KẾT LUẬN

| Kết luận | Hết hạn khi |
|---|---|
| ring hiện đúng ở `.mo-lai` | **nâng Tailwind v4** hoặc đảo `@tailwind utilities` xuống cuối `globals.css` — cảnh báo hẹn giờ đã ghi trong `thao-tac-registry.mjs` |
| lớp phủ không đè nút nào | có `ThanVat` mới mang nút mà quên khai `THAN_CO_NUT` — **test canh**, hết hạn thì đỏ |
| J05 PASS | đổi cách ghi resume, đổi `resumeHref`, hoặc đổi lớp `.vat`/`.mo-lai` trong CSS |
| CSDL repo chính khớp mốc sạch | bất kỳ lane nào chạy Prisma trên nó — số này đúng **tại thời điểm đo**, không phải mãi mãi |
| "40 ca công cụ chết" | mỗi lần merge nhánh tích hợp |
