# LANE FILES — hai TẦNG (23/08)

Vùng ghi: `app/files/**` (+ 1 dòng đóng dấu ở `app/files/_components/HaiNgan.tsx`). **Không** đụng
`app/globals.css`, `components/nav/**`, `components/home/**`. Không commit, không `git add`.

---

## ⓪a TIỀN ĐỀ — XÁC NHẬN MỘT NỬA, BÁC MỘT NỬA

| Phiếu giả định | Đo tại nguồn | Phán |
|---|---|---|
| “Files hiện KHÔNG có cấu trúc hai tầng” | đúng — `/files` đang là **HAI NGĂN** (`HaiNgan.tsx`, bản chốt *sáng* 17/08) | ✅ xác nhận |
| chủ sở hữu là `components/filemanager/**` | **một nửa**: vỏ màn sống ở `app/files/**` (`page.tsx` · `_components/` · `_lib/`); `components/filemanager/**` là *ruột* (FileManagerShell · TepNguonDuAn · FilesNavigator) | 🔧 đính chính |
| ngăn “phần thô” chưa có | **đã có và đang chạy thật**: `_lib/ngan-tho.ts` + `_components/NganPhanTho.tsx`, đọc `/api/specs` | 🔧 đính chính — **tái dùng, không dựng lại** |

⇒ Việc thật của lượt này là **đổi TRỤC tổ chức của vỏ** (ngăn → tầng) và **treo lại** phần thô vào
đúng chỗ chốt (thư mục *Nhà cung cấp*), không phải viết mới từ đầu.

## ⓪b HẠ TẦNG
`git log --oneline -1` = `c7f3ac8` · `git rev-list --count HEAD..main` = **0**. Đúng mốc, không lệch.

---

## 📐 BẢN VẼ — đã đọc, đã port, và 5 chỗ tôi lệch (khai thẳng)

Đọc `docs/mocks/mock-files-hai-tang.html` (617 dòng, bản chính) · `mock-files-hai-ngan.html` (bản
hiểu sai, chỉ để đối chiếu) · `mock-thu-vien-ke.html` (đầu bên kia của dòng chảy).
**Bản vẽ đúng với phiếu ở cả ba điểm cốt lõi** — 5 thư mục hệ thống, 8 gói Collection+, mã
`COL-<LOẠI>-NNN`. Không có xung đột phiếu ↔ bản vẽ về danh sách.

**Đã port đúng bản vẽ:** lưới thẻ `minmax(260px,1fr)`/`minmax(240px,1fr)` gap 14 · thẻ *ô xem
trước → tên → vai → chân thẻ* · huy hiệu quyền capsule, **Chỉ đọc = viền NÉT ĐỨT** (hình dạng, đọc
được khi in đen trắng) · *Lưu trữ* = viền đậm `--border-strong` · thanh lọc bọc khung `--r-3` nền
`--panel` · **mã monospace ngay dưới tên** ở thẻ Collection+ · nút nhảy `↓ Đến Collection+` capsule
ở đầu tầng ① · hover nâng 1px · **0 chỗ đọc `--accent`**.

| # | Chỗ lệch | Vì sao |
|---|---|---|
| ⓐ | **Số mục là `—`, không phải 126 · 54 · 36…** | số của bản vẽ là số MOCK. Chưa gói nào nối kho ⇒ `—` = *chưa biết*, khác hẳn `0` = *đã đọc, đúng là rỗng*. Bản vẽ quyết HÌNH, không quyết SỐ; bịa số là phá luật cấm dữ liệu giả |
| ⓑ | **3 trục lọc Nguồn · Trạng thái · Cập nhật hiện MỜ kèm lý do** | bản vẽ vẽ cả 4 trục bấm được vì nó có dữ liệu mock. Chưa có gì để lọc ⇒ 4 nút bấm-không-ra-gì là **nút giả** (§9). Lý do đi `aria-describedby` **và** in thành chữ thật cạnh thanh lọc, không đi `title` (bài học 16/08) |
| ⓒ | **Ô xem trước là ô trung tính mang biểu tượng loại**, không phải SVG minh hoạ | chính bản vẽ tự khai *“bản build sẽ thay bằng thumbnail THẬT”*; chưa có kho thumbnail. Vẽ tay giả nội dung là thứ Hoà bác 20/08 |
| ⓓ | **Bỏ dãy avatar + dòng “24 thư mục · cập nhật hôm nay”** | không có nguồn presence/số thật cho 3/5 thư mục. Thay bằng tình trạng THẬT: *đã nối kho* / *chưa nối kho* |
| ⓔ | **Không port thanh công cụ đầu trang của bản vẽ** (ô tìm ⌘K · Nhập tệp · Tạo thư mục · chuông · avatar) và **cặp nút lưới ↔ danh sách** | trong app thật những thứ đó thuộc vỏ `AppShell` — dựng lại là hai bản cùng một việc; kiểu xem danh sách chưa dựng, bày nút ra là hứa suông |

**Bản vẽ không nói, tôi suy** (một chỗ duy nhất, đáng soi kỹ): *bấm một thẻ thì gì xảy ra*. Bản vẽ
chỉ vẽ mức duyệt. Tôi chọn: **bấm thẻ = mở thư mục NGAY DƯỚI lưới**, lưới vẫn nằm nguyên (không
rời trang, không modal), thẻ đang mở nhận `aria-expanded` + viền đậm + mũi tên xoay. Lý do: giữ
đúng thứ bản vẽ vẽ (lưới duyệt) mà vẫn có chỗ cho nội dung thật chạy.

**Mã loại lấy theo BẢN VẼ** — `MAT · FUR · DET · PLC · DNA · LEA · PRE · PRO`. Bản đầu tôi tự đặt
viết tắt tiếng Việt (`VL · CTD · CNG · HOC · TB · CLM`); bản vẽ đã quyết thì bản vẽ thắng, đã đổi.

---

## Bảng: hai tầng ↔ thành phần dựng

| Tầng | Trục gom | Thành phần | Nguồn dữ liệu |
|---|---|---|---|
| ① Thư mục hệ thống | **QUYỀN** — *ai được động vào cái gì* | `app/files/_components/HaiTang.tsx` (lưới 5 thẻ + thân) | định nghĩa ở `_lib/hai-tang.ts` |
| ①.1 Dự án | Theo dự án | `TepNguonDuAn` + `FileManagerShell` (đang có, **tái dùng**) | `ProjectFile` server + `lib/filemanager/queries` |
| ①.2 Studio dùng chung | Toàn studio | màn trống thật | **chưa nối kho** |
| ①.3 Nhà cung cấp | Biên tập giới hạn | `NganPhanTho` (đang có, **tái dùng** — đây là ngăn “phần thô” cũ, nay treo đúng chỗ) | `/api/specs` → `_lib/ngan-tho.ts` → `lib/materials/ba-mat` |
| ①.4 Đã duyệt | Chỉ đọc (nét đứt) | màn trống thật | **chưa nối kho** |
| ①.5 Lưu trữ | Quản trị viên | màn trống thật | **chưa nối kho** |
| ② Collection+ | **LOẠI VẬT** — *tôi lấy nguyên liệu loại nào* | `app/files/_components/CollectionPlus.tsx` (8 thẻ + thanh lọc) | `_lib/hai-tang.ts`; `DEM_MUC` **cố ý rỗng** |

### Tái dùng được, kèm file:dòng
- `app/files/_lib/ngan-tho.ts:118` `locMonTho()` · `:139` `tomTatNganTho()` — lõi “thô” **không viết lại**.
- `app/files/_components/NganPhanTho.tsx:96` — nguyên khối, chỉ đổi chỗ treo.
- `components/filemanager/RawStyle.tsx` — bơm `:focus-visible` (lớp giả không khai được bằng style nội tuyến).
- `lib/materials/ba-mat.ts` `BaMatText` — khuôn chuỗi `{vi,en}` dùng chung, không đẻ kiểu mới.
- `lib/library/shelves.ts:31` — kỷ luật `count: number | null` (`—` khi chưa có số thật); `_lib/hai-tang.ts` `soHoacGach()` là cùng một luật.
- `components/ui/ToolbarChip.tsx:36-40` — cách nối lý do bằng `aria-disabled` + `aria-describedby` (chép **cách làm**, không mount component vì đây không phải thanh công cụ).

### File mới / sửa
| File | Việc |
|---|---|
| `app/files/_lib/hai-tang.ts` (mới, thuần) | 5 thư mục + 8 gói + `maCollection`/`docMaCollection` + 4 trục lọc + 3 mức chia sẻ + `tomTatCollection`/`soHoacGach` |
| `app/files/_lib/hai-tang.test.ts` (mới) | **36 pass · 0 fail** |
| `app/files/_components/HaiTang.tsx` (mới) | vỏ hai tầng, lưới 5 thẻ, thân, nút nhảy |
| `app/files/_components/CollectionPlus.tsx` (mới) | tầng ②, thanh lọc, 8 thẻ |
| `app/files/page.tsx` (sửa) | `HaiNgan` → `HaiTang`; cuộn dồn về một chỗ (bỏ hai vùng cuộn lồng nhau, nếu không nút nhảy hết đường tới đích) |
| `app/files/_components/HaiNgan.tsx` (sửa 1 khối) | **đóng dấu ⛔ LỖI THỜI tại chỗ** (luật *văn bản bị thay không bỏ hoang*). Nay 0 nơi mount — MAIN quyết xoá hẳn hay giữ làm dấu vết |

### Test canh cái gì (không chỉ canh chạy đúng)
① hai tầng là hai **TRỤC** — bắt mỗi bảng khai đủ trường đặc trưng (`quyen` ↔ `maLoai`); gộp hai
tầng thành một danh sách là rụng một trường ⇒ đỏ. ② mã đệm 3 chữ số, **quá 999 thì dài ra chứ
không quay vòng** (mã trùng = hỏng khoá nối). ③ `null` ≠ `0` — hai câu tổng phải khác hẳn nhau.
④ trục lọc không dùng được **bắt buộc có lý do**, và lý do không được hứa “sắp có”. ⑤ *Chỉ đọc*
mang dáng **nét đứt** (canh đúng quyết định của bản vẽ). ⑥ chữ **“chợ đầu mối”** không được sống
lại ở bất kỳ chuỗi nào của màn này (Hoà bỏ 16/08).

---

## Nghiệm thu

- `npx tsc --noEmit` — **0 lỗi ngoài `components/nav/**`** (2–4 lỗi ở đó là của lane RAIL đang sửa
  song song, không phải của lượt này; chúng đổi số giữa hai lần chạy vì file đang bị ghi).
- Test: `hai-tang` 36/0 · `ngan-tho` 25/0 · `tep-nguon` OK · `tep-nguon-trang-thai` OK. Không thêm fail.
  *(Không chạy trọn `npm test`: script đó gọi `tsc` cả repo nên sẽ đỏ vì lane RAIL.)*
- `npm run soi:tu-dien` — **0 lệch mới** từ file của lượt này (10 lệch nhãn còn lại là nợ cũ nơi khác).
- `npm run soi:hinh-hoc` — file mới **0 radius ngoài thang**; 7 chỗ lệch trong `components/filemanager/`
  là nợ cũ của `files-mock-css.ts` (4) và `FilesNavigator.tsx` (3, `rounded-[8px]`), tôi không chạm.
- Ảnh app thật 1440×900 → `artifacts/visual-review/`:
  `files-tang1-du-an.png` · `files-tang1-nha-cung-cap.png` (dữ liệu THẬT: *10/10 món chưa đủ định
  nghĩa để render*) · `files-tang1-trong-da-duyet.png` (**trạng thái rỗng thật**) ·
  `files-tang2-collection-plus.png` · `files-tang2-loc-theo-loai.png` ·
  `files-tang1-nen-toi.png` · `files-tang2-nen-toi.png` (đủ **hai nền**, luật L5).

### 🔴 Phiếu sai một tiền đề hạ tầng — cách tôi xử
`http://127.0.0.1:3799` **không tồn tại**. Cổng duy nhất đang mở là **3778** (`next-server`, cùng
repo, chạy từ 20:59 hôm qua) và nó **đã chết máy biên dịch**: `/files` phục vụ bản cũ, `.next/server/app/files/page.js`
đứng ở 00:57 và không đổi sau khi `touch` + 3 lần gọi lại — đúng bệnh `.next` hỏng đã ghi trong STATUS.
Tôi **không kill server của phiên khác** và **không mở server thứ hai trên `.next` dùng chung** (đó
chính là cơ chế đẻ ra bệnh này). Cách đi: rsync mã nguồn sang bản sao trong scratchpad
(symlink `node_modules`/`prisma`/`public`, **`.next` riêng**), chạy `next dev -p 3799` ở đó, chụp,
rồi **tắt** (`pkill`, đã xác nhận cổng đóng). Đăng nhập dùng hồ sơ trình duyệt sẵn có
`~/.if-phien-chup-man` (`scripts/chup-visual-review.mjs:17`) — `AUTH: 200`, không nhập mật khẩu.
Script chụp là tệp tạm, **đã xoá**.

---

## Token / việc cần MAIN gộp

1. 🔴 **`--focus-ring` KHÔNG TỒN TẠI trong `app/globals.css`.** `HaiNgan.tsx:38` (17/08) khai
   `outline: var(--focus-ring)` ⇒ **giá trị rỗng ⇒ trình duyệt bỏ qua cả dòng** ⇒ vòng focus “đã
   sửa” suốt tuần qua thật ra vẫn là vòng mặc định. Bản vẽ CÓ khai token này trong khối token của
   nó, app thì chưa. Tôi né bằng `2px solid var(--t1)` (token có thật, không tự chế hex) vì
   `globals.css` là của lane MÀU. **Đề nghị lane MÀU nạp `--focus-ring` cho cả hai nền**, rồi tôi
   đổi 3 dòng CSS về token chung.
2. Bản vẽ dùng `--focus-ring` cho `:focus-visible` toàn trang — cùng một việc, nên nạp một lần ở
   `globals.css` chứ đừng để mỗi màn tự khai.
3. Khi có kho **thumbnail thật**, chỗ duy nhất phải sửa là ô xem trước trong `HaiTang.tsx` /
   `CollectionPlus.tsx`; khi một gói nối kho thì sửa đúng hằng `DEM_MUC` trong `CollectionPlus.tsx`.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- **Ảnh chụp từ BẢN SAO trong scratchpad**, không phải từ cây làm việc chính (server chính hỏng).
  Mã nguồn đã rsync đúng trước lượt chụp cuối, nhưng **chưa ai mở `/files` trên server chính** sau
  thay đổi này. Nếu server chính được khởi động lại thì nên soi lại một lượt.
- **Ô xem trước 16/9 (tầng ①) và 4/3 (tầng ②) trống rỗng chiếm rất nhiều chiều dọc** — bản vẽ lấp
  chỗ đó bằng SVG, tôi thì không có gì thật để lấp. Hệ quả đo được trên ảnh: nội dung thật của
  thư mục đang mở bắt đầu ở khoảng **y ≈ 650–690px**, tức gần hết màn 900. **Chưa hỏi Hoà.** Hai
  đường ra: nối thumbnail thật, hoặc xin duyệt một băng xem trước mỏng hơn (đổi số của bản vẽ ⇒
  phải có người duyệt, tôi không tự đổi).
- **Kéo-thả bằng bàn phím chưa làm** — bản vẽ tự khai “sẽ nối ở phiên build”; lượt này không có
  thao tác kéo-thả nào nên chưa tới lượt, nhưng nợ vẫn còn đó.
- **Chưa thử trình đọc màn hình thật**; a11y ở đây là suy từ vai trò/thuộc tính, không phải đo.
  Riêng nhánh `aria-disabled` thì chép đúng cách đã được đo thật ở phiếu P-G 16/08.
- **`prefers-reduced-motion` chưa kích hoạt lần nào để xem** — có nhánh tĩnh (hover bỏ `transform`,
  cuộn `behavior:'auto'`), nhưng chưa chạy với cờ bật.
- **Chỉ đo trên Chromium (playwright)** — Safari/Firefox là suy. `aspect-ratio` và `scrollIntoView`
  đều an toàn ở cả ba, nhưng tôi chưa mở.
- **Chưa đo tương phản bằng số** cho các chuỗi mới; tất cả đều dùng `--t1/--t2/--t3` theo đúng
  ngưỡng đã đo ở lượt trước (`--t4` chỉ dùng cho chữ phụ không mang nghĩa), nhưng đó là **kế thừa
  số cũ, không phải phép đo mới**.
- **Thư mục *Dự án* vẫn kéo theo dữ liệu của `lib/filemanager/mock-data.ts`** qua `FileManagerShell`
  — nợ có sẵn, ngoài vùng phiếu, tôi không đụng. Nói ra để không ai tưởng lượt này đã dọn.
