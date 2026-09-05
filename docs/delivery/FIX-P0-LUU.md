# FIX P0-LUU — app nói "Đã lưu" trong khi bản vẽ chưa được lưu

> Làn **P0-LUU** · 05/09 · nhánh `nen-checkpoint`, cây `.claude/worktrees/nen-moi`, mốc `a2a8c6e8`.
> Lỗi gốc: `docs/delivery/AUDIT-THAO-TAC-A2.md` mục **`A2-03`** (P0).
> **Chưa commit.** Ảnh: `docs/delivery/anh-duyet-mat/p0-luu/`.

---

## 0 · Kết luận trước

**Tái hiện được, và tái hiện nặng hơn con số của A2.** Trên app thật, mã trước khi sửa:
nhãn hứa **"Đã lưu lúc 08:55"** ở giây **1,2**, máy chủ có **0 bản sao**, đóng trình duyệt rồi mở
lại đúng URL trên một hồ sơ mới ⇒ **`Bàn vẽ đang trống`**. Công đã mất.

**Gốc bệnh không nằm ở độ trễ.** Nó nằm ở chỗ bản vẽ có **BA** nơi đến mà bộ trạng thái chỉ có
**HAI**, và nhãn đọc kênh SAI:

| # | Nơi đến | Trạng thái đại diện | Quyết định "mất hay không mất khi đổi máy"? |
|---|---|---|---|
| ① | IndexedDB (cache trình duyệt) | `status` · `lastSavedAt` | **không** — chết theo hồ sơ trình duyệt |
| ② | đĩa `.idf` trong thư mục dự án | `diskStatus` · `diskMessage` | có, nhưng **mặc định TẮT** (opt-in) |
| ③ | máy chủ `POST /api/project-files` | 🔴 **KHÔNG CÓ GÌ** | **CÓ — chính là nó** |

Nhãn cũ đọc ① rồi viết *"Đã lưu lúc HH:MM"*. Câu đó **đúng về cache** và **sai về điều người dùng
đang hỏi**. Đây là **cùng một bài học 31/07 lặp lần hai** — chính `lib/save-status.ts` đã ghi trong
docstring của mình: *"'đã lưu' (cache) và 'đã ghi đĩa' là HAI việc, HAI trạng thái, không được
gộp"* — rồi kênh thứ ba mọc thêm mà không ai nới trạng thái.

⇒ Lời giải **mở rộng kỷ luật đã có**, không dựng cơ chế thứ tư: thêm kênh ③ vào đúng bộ trạng thái
ấy, và đổi nhịp đẩy máy chủ từ **đồng hồ treo tường** sang **bám thay đổi**.

## 1 · Tái hiện — đo trên app thật, không đọc mã

**Môi trường**: `next dev` cổng **3215** dựng từ BẢN SAO byte-y-hệt của cây làm việc
(`/tmp/p0-luu-app`, `node_modules` symlink), để **cổng 3210 nguyên vẹn** cho làn khác.
Playwright Chromium 1194, 1440×900. Cùng một máy chủ chạy CẢ hai lượt đo — mã cũ được đặt lại
bằng `git show HEAD:<tệp>` rồi đo, sau đó khôi phục mã mới rồi đo lại. So A/B trên cùng máy,
cùng tải, cùng DB.

> ⚠️ **Cổng 3210 KHÔNG dùng làm mốc "trước" được nữa** — xem §7 (phát hiện ngoài phạm vi).

**Thao tác** (giống ca Hoà mất việc): tạo dự án → *Tạo bản vẽ mới* → chọn **Tường** → click 5 điểm
khép kín → chốt chuỗi. Thước đo "bản vẽ còn hay mất" **không đọc trạng thái nội bộ nào**: đếm điểm
ảnh có nét trên chính `<canvas>` (`toDataURL` → `getImageData`, ngưỡng lệch màu 60).
Chuỗi tường vẽ được cho **19.106 điểm nét**; bàn vẽ trắng cho **≤ 40**.

## 2 · Gốc bệnh — đo được, file:dòng

### 2.1 · Nhịp đẩy máy chủ bám ĐỒNG HỒ, không bám người dùng

`components/cad/CadSheets.tsx` (bản trước sửa, dòng ~566): `window.setInterval(…, 30_000)`,
khởi động lúc **hydrate** — tức pha của nó do lúc **mở dự án** quyết, **không dính gì** tới lúc
người dùng vẽ. Người vẽ xong ngay sau một nhịp phải chờ gần trọn 30 s.

Con số đo được ở đây (mã cũ, cùng máy chủ):

| | đo |
|---|---|
| A2 đo 04/09 | `POST` ở **21,1 s** |
| Lượt này, CA 4 | `POST` ở **25,0 s** |
| Lượt này, CA 1 | **0 lượt POST** trong 48 s theo dõi; máy chủ có **0 bản sao** khi đóng |

⇒ Không phải debounce, không phải hàng đợi, không phải chờ-rảnh. Là **pha của một `setInterval`**.
`components/present-editor/PresentSheets.tsx` (~dòng 454) mắc **y hệt**.

### 2.2 · Đường mở lại đọc từ đâu — và vì sao mất

`CadSheets.tsx` hydrate theo thứ tự: **đĩa** (`resolveAndSyncCadDisk`, mặc định TẮT) → **cache
IndexedDB** (`loadSheets`) → **máy chủ** (`taiBanVeTuMayChu`) và nhánh máy chủ **chỉ chạy khi
`!rec || valid.length === 0`**, tức chỉ khi cache rỗng.

⇒ Ở hồ sơ trình duyệt **mới** (máy khác · vừa xoá dữ liệu duyệt web · ẩn danh · máy vừa cài lại):
cache rỗng ⇒ rơi xuống máy chủ ⇒ **máy chủ chưa có gì** ⇒ `Bàn vẽ đang trống`. **Không có đường
hoà nào để làm** — dữ liệu chưa từng rời khỏi máy cũ.

### 2.3 · Chỗ T đoán đúng, và chỗ tôi phải nói khác

**Giả thuyết của IF COMMAND đúng ở phần cốt lõi**: `lib/save-status.ts` có `status` (IndexedDB) và
`diskStatus` (đĩa), **không có gì cho máy chủ**; nhãn nói đúng về cache, sai về thứ quyết định
mất-hay-không. Tôi xác nhận bằng `grep`: `serverStatus`/`serverSavedAt` **không tồn tại** trước
lượt này, và `StatusBar.tsx:393` dựng câu chỉ từ `saveState` + `lastSavedAt`.

**Hai chỗ tôi phải nói khác — kèm số:**

**① Chữ "đóng tab" trong `A2-03` chưa đủ chính xác, và chênh lệch là điều đáng biết.**
Đóng một TAB rồi mở lại trong **CÙNG trình duyệt** thì IndexedDB **còn nguyên** — bản vẽ về.
Ca mất việc thật sự là **hồ sơ trình duyệt khác/mới**: A2 dùng `browser.close()` rồi khởi chạy lại
Playwright, tức một hồ sơ **trắng** — đúng bằng "máy khác / vừa xoá dữ liệu duyệt web". Tôi đo lại
đúng bằng cách đó và tái hiện được (CA 1: `BAN-VE-TRONG`). Ghi rõ để không ai đọc `A2-03` rồi kết
luận nhầm rằng đóng tab bình thường là mất việc — **và cũng để không ai hạ nhẹ lỗi**: nội dung
nghề nghiệp chỉ tồn tại trong một hồ sơ trình duyệt suốt 25–30 s trong khi app nói đã lưu, thì
đó vẫn đúng là P0.

**② "Hạ độ trễ xuống 2 giây rồi thôi" đúng là sai — nhưng không phải vì con số.**
Vấn đề không phải 30 s hay 2 s: **bất kỳ** độ trễ nào cũng để lại một cửa sổ, và cửa sổ đó chỉ
nguy hiểm vì **nhãn nói dối trong lúc đó**. Nên lời giải phải gồm CẢ HAI vế, và vế nhãn là vế
đóng lỗi:
* nhãn chỉ hứa bền vững **sau khi máy chủ nhận** ⇒ cửa sổ NÓI DỐI về **0**, bất kể độ trễ;
* nhịp đổi từ đồng hồ sang bám-thay-đổi ⇒ cửa sổ CHƯA-CÓ-BẢN-SAO co từ ~30 s xuống ~2,5 s,
  và trong suốt cửa sổ ấy nhãn khai đúng *"Đã lưu trong máy"*.

## 3 · Đã sửa gì

Ba mảnh, tất cả **mở rộng thứ đã có** — không thêm kho lưu, không thêm route, không thêm cơ chế
thứ tư (§B25 *EXTEND NEAREST CONTRACT*, luật K1 *một việc một chỗ*).

### 3.1 · `lib/save-status.ts` — thêm KÊNH ③, và một hàm THUẦN dựng nhãn

* `ServerSyncState = 'off' | 'pending' | 'syncing' | 'synced' | 'error'` + `serverStatus` /
  `serverSavedAt` / `serverMessage`, **cùng khuôn** `diskStatus`/`diskMessage` đã có.
  Nấc khác biệt duy nhất là **`'pending'`** — *"đã nằm trong máy, chưa lên máy chủ"*. Thiếu đúng
  nấc đó thì không có cách nào nói câu *"mới lưu được trong máy thôi"* cho đúng.
* `nhanTrangThaiLuu()` — hàm THUẦN dựng câu chữ, **bốn nhánh không chồng nhau**, xếp theo quy tắc
  *"nói điều YẾU NHẤT còn đúng"*:

| trạng thái | câu | hứa bền vững? |
|---|---|---|
| đang ghi (cache hoặc máy chủ) | `Đang lưu…` | không |
| máy chủ hỏng + còn thay đổi treo | `Chưa lưu lên máy chủ` ⚠ | không |
| máy chủ CHƯA nhận trạng thái này (`pending`/`off`) | `Đã lưu trong máy HH:MM` | không |
| máy chủ ĐÃ nhận | `Đã lưu lúc HH:MM` | **có** |
| chưa ghi được gì (`lastSavedAt === null`) | *không hiện gì* | — |

⚠️ Hàng cuối cũng là một lỗi cũ: nhánh trước là `lastSavedAt ? 'Đã lưu lúc …' : 'Đã lưu'` — chuỗi
`'Đã lưu'` trống trơn ấy khai một lần lưu **không hề xảy ra** (`onSavingChange(false)` vẫn chạy khi
`getRecord()` trả `null`).

⚠️ **Mốc giờ lấy từ MÁY CHỦ** (`serverSavedAt`), không lấy mốc cache — nếu không thì câu hứa bền
vững lại đeo một con số của kênh khác.

### 3.2 · `lib/sheets-persist.ts` — `taoNhipSaoLuuMayChu()`

Đặt cạnh `createSheetsAutosaver` (đúng nơi mọi lịch-ghi của app đã ở), thay `setInterval(30_000)`:

* **bám thay đổi**: `touch()` khi tài liệu đổi thật, debounce **`TRE_SAO_LUU_MAY_CHU_MS = 2500`**;
* **giãn cách tối thiểu `GIAN_CACH_SAO_LUU_MAY_CHU_MS = 12_000`** giữa hai lần gửi THÀNH CÔNG;
* **đếm PHIÊN BẢN** thay vì cờ `dirty` — thay đổi đến giữa chuyến bay không bị nuốt;
* hỏng thì báo `'error'` **kèm lý do thật** rồi **tự thử lại**, không im lặng;
* `flushNow()` cho ⌘S (bỏ qua giãn cách) · `flushKhiRoiTrang()` đồng bộ cho `pagehide`.

**Vì sao vẫn phải có giãn cách — và tại sao nó KHÔNG dựng lại cửa sổ nói dối.**
`POST /api/project-files` **tạo bản ghi MỚI mỗi lần** (không ghi đè — cố ý, để còn lịch sử lùi về).
Bỏ hẳn giãn cách thì một giờ vẽ liên tục đẻ tới ~1.400 hàng `ProjectFile` + 1.400 bản sao trọn bản
vẽ trong `./uploads`. Bảng chi phí ở ca **xấu nhất** (người sửa hình liên tục suốt một giờ):

| | nhịp | trần bản ghi/giờ | cửa sổ chưa-có-bản-sao |
|---|---|---|---|
| trước | đồng hồ 30 s | ~120 | **~30 s** |
| sau | đổi + debounce 2,5 s, giãn cách 12 s | ~300 (**2,5×**) | **~2,5 s** (**12×** ngắn hơn) |
| (bỏ giãn cách) | đổi + debounce 2,5 s | ~1.400 | ~2,5 s |

2,5× dung lượng ở ca xấu nhất, đổi lấy cửa sổ ngắn đi 12 lần — với thứ mà chính mã nguồn gọi là
*"sự thật nghề nghiệp: mất deck thì dựng lại được, mất bản vẽ là mất công việc"*, đây là phía đúng
để nghiêng. **Và trong suốt lúc chờ giãn cách, trạng thái là `'pending'` ⇒ nhãn nói đúng.**
Hai hằng số được **export + có test khoá giá trị** để đổi là phải đổi cả lời khai.

### 3.3 · Nơi gọi

* `components/cad/CadSheets.tsx` — nhịp mới; `touch()` ở đúng chỗ đang `saver.touch('doc')` và ở
  chỗ cấu trúc tờ đổi; **`pagehide` thêm cạnh `beforeunload`** (Safari/iOS không chạy
  `beforeunload` khi đóng tab); ⌘S ép cả ba đích; đẩy **lượt đầu ngay khi mở dự án** (dự án
  mở-rồi-đóng-không-sửa trước đây vĩnh viễn không có bản sao).
  · pan/zoom **cố ý KHÔNG** đánh thức nhịp máy chủ — `.idf` sao lưu không mang viewport.
  · Câu ⌘S đổi `Đã lưu — HH:MM` → **`Đã lưu trong máy — HH:MM`** (lúc bấm ⌘S chỉ IndexedDB là
  chắc chắn xong ngay).
* `components/present-editor/PresentSheets.tsx` — cùng khuôn. **Cố ý KHÔNG khai `goiKhiRoiTrang`**:
  deck mang ảnh dataURL nên gói tin thường vượt trần 64 KiB của `sendBeacon`/`keepalive` — thà
  không có đường đó còn hơn có mà im lặng hỏng.
* `lib/cad/cad3d-autosave-core.ts` — **khai thẳng `'off'`**. Mode 3D không có kênh máy chủ; không
  đặt `'off'` thì `serverStatus` giữ giá trị cũ do màn 2D để lại, và nhãn tiếp tục hứa cho những
  nét mà máy chủ chưa từng thấy — đúng loại nói dối này, chỉ khác chỗ đứng.
* `components/studio/StatusBar.tsx` — đọc câu từ `nhanTrangThaiLuu()`; `giaiThich` vào `Tooltip`
  đã có; mức cảnh báo **luôn kèm chữ** (*"Chưa lưu lên máy chủ"*), không dựa vào màu.

### 3.4 · Luật thành thứ MÁY canh, không phải lời dặn

`lib/save-status.test.ts` quét **toàn bộ 60 tổ hợp** `SaveState × lastSavedAt × ServerSyncState ×
serverSavedAt` và khẳng định: **không tổ hợp nào cho ra lời hứa bền vững khi máy chủ chưa nhận**,
và **chỉ** nhánh hứa mới được nói `"Đã lưu lúc"`. Thêm một trạng thái mới mà quên xử lý ⇒ đỏ ngay.
`lib/sheets-persist-nhip-may-chu.test.ts` khoá 4 tính chất của nhịp (bám-thay-đổi · không báo
`'synced'` khi còn treo · không nuốt thay đổi giữa chuyến bay · hỏng thì nói thật + thử lại).

## 4 · Bảng bốn ca — TRƯỚC / SAU, đo trên app thật

Cùng máy chủ `next dev` 3215, cùng tài khoản, cùng thao tác. "Mã cũ" = 6 tệp đặt lại bằng
`git show HEAD:<tệp>`; "mã mới" = bản đã sửa. Thước "còn bản vẽ" = điểm ảnh có nét trên canvas.

### CA 1 — vẽ → đóng ngay khi nhãn hứa "Đã lưu lúc" → mở lại trên hồ sơ MỚI  ✅

| | mã cũ (`HEAD a2a8c6e8`) | mã mới |
|---|---|---|
| vẽ được | ✅ 19.106 điểm nét | ✅ 19.106 điểm nét |
| nhãn hứa bền vững lúc | **1,2 s** | **2,9 s** |
| `POST /api/project-files` sau khi vẽ | **24,5 s** [200] | **2,5 s** [200] |
| POST thừa lúc mở dự án | 0 | **0** |
| bản sao máy chủ **tại giây 1,2** (lúc nhãn hứa) | 🔴 **0** | ✅ đã có |
| **cửa sổ nói dối** | 🔴 **23,3 giây** | ✅ **0 giây** (nhãn đi SAU máy chủ 0,4 s) |
| nhãn lúc đóng | 🔴 `Đã lưu lúc 08:55` | ✅ `Đã lưu lúc 09:36` |
| **mở lại hồ sơ mới** | 🔴 **`Bàn vẽ đang trống` — MẤT BẢN VẼ** | ✅ **CÒN NGUYÊN** (59.511 điểm nét) |

### CA 2 — vẽ → đóng NGAY (trước khi nhãn kịp nói)  ✅

| | mã cũ | mã mới |
|---|---|---|
| nhãn ngay lúc đóng | `Đang lưu…` | `Đang lưu…` |
| có hứa bền vững? | ✅ không | ✅ không |
| mở lại hồ sơ mới | mất — **không hứa trước** nên không lừa | mất — **không hứa trước** nên không lừa |

> ⚠️ Ca này **cố ý vẫn mất** ở cả hai bên, và đó là kết quả ĐÚNG: `browser.close()` của Playwright
> giết tiến trình nên **không có sự kiện rời trang nào chạy** — tương đương mất điện đột ngột.
> Điều phải đạt là *app không hứa gì trước đó*, và nó đạt. Đường rời-trang-có-báo-trước đo riêng ở
> CA 2b.

### CA 3 — chặn `POST /api/project-files` (mạng hỏng)  ✅

| | mã cũ | mã mới |
|---|---|---|
| số lượt POST thử trong 32 s | **0** (đồng hồ 30 s chưa tới lượt) | **5** (thử lại như thiết kế) |
| nhãn cuối | 🔴 `Đã lưu lúc 08:56` | ✅ `Chưa lưu lên máy chủ` (mức cảnh báo) |
| nói "Đã lưu lúc" khi máy chủ hỏng? | 🔴 **CÓ — nói dối** | ✅ **KHÔNG** |

### CA 4 — vẽ bằng BÀN PHÍM → chờ đủ lâu → tải lại  ✅

| | mã cũ | mã mới |
|---|---|---|
| vẽ bằng bàn phím (`W ↵` rồi click) | ✅ 6.637 điểm nét | ✅ 6.637 điểm nét |
| `POST` sau khi vẽ | **25,0 s** | **7,6 s** |
| nhãn | `Đã lưu lúc 08:56` (từ ~1 s — hứa sớm) | `Đã lưu lúc 09:35` (sau khi máy chủ nhận) |
| sau **tải lại cùng tab** | (không đo được — xem ghi chú) | ✅ **còn nguyên** (49.644 điểm) |
| mở lại **hồ sơ mới** | 🔴 mất | ✅ **còn nguyên** (50.708 điểm) |

> 🔧 **Một khiếm khuyết của chính bộ đo, khai ra**: lượt "mã cũ" đầu tiên, bước vẽ-bằng-bàn-phím
> **không vẽ được gì** (39 điểm nét) — thiếu một cú click đưa tiêu điểm vào vùng vẽ thì
> *type-anywhere* (`CadCanvas.tsx:2888`) không nhận chữ. Đó là lỗi của kịch bản đo, **không phải
> của app**: sau khi thêm cú click, cùng thao tác cho 6.637 điểm nét. Hai hàng "sau tải lại" của
> cột mã cũ vì thế không có số dùng được — hàng `POST 25,0 s` và hàng nhãn vẫn đo đúng.

### CA 2b — rời trang có báo trước (`pagehide` → `sendBeacon`)

| | mã cũ | mã mới |
|---|---|---|
| có đường sống sót lúc rời trang? | 🔴 **không có** (`grep sendBeacon\|keepalive\|pagehide` = 0) | ✅ có |

### CA 2b — rời trang NGAY (đường sống sót `sendBeacon`)

Đo riêng, vì `browser.close()` của Playwright giết tiến trình nên **không chạy `pagehide`** —
lấy nó để đo beacon là đo sai. Ở đây rời trang bằng `goto('about:blank')`: đúng vòng đời
`pagehide` + `visibilitychange:hidden` mà một tab bị đóng đi qua.
Mã cũ **không có đường này** (`grep sendBeacon|keepalive|pagehide` trong `CadSheets.tsx` và
`sheets-persist.ts` ở `HEAD` = **0**).

**Đo được (mã mới)**: vẽ xong → rời trang sau **0,6 s** (trước cả nhịp trễ 2,5 s) ⇒ bản sao trên
máy chủ **0 → 3 bản, 8 entity**. `sendBeacon` lúc `pagehide` cứu được lượt cuối.
⚠️ Chỉ đúng khi gói tin **≤ 60 KB** — xem §6 (chưa chắc).

### Độ trễ — bảng gọn

| | mã cũ | mã mới |
|---|---|---|
| A2 đo 04/09 | 21,1 s | — |
| CA 4 lượt này | **25,0 s** | **7,6 s** |
| CA 1 lượt này | **24,5 s** | **2,5 s** |
| cửa sổ nói dối | **23,3 s** | **0 s** ở mọi ca |

Con số **23,3 s** khớp sát **19,6 s** mà A2 đo hôm 04/09 — cùng bệnh, cùng bậc, chênh nhau đúng
bằng pha ngẫu nhiên của một `setInterval` 30 s. Lượt đo đầu của tôi ghi *"≥48 s, không POST lần
nào"*: đó là **bộ đo hụt**, không phải app tệ hơn — vòng lặp thoát ngay khi thấy nhãn nên chỉ quan
sát được 1,2 s. Đã sửa vòng lặp rồi đo lại; số dùng là **24,5 s**.

> 🔧 **Một bug của chính bản sửa, bắt được khi đo — ghi lại vì nó là bài học chung.**
> Lượt đo đầu tiên của mã mới cho POST ở **10,0 s** chứ không phải 2,5 s. Nguyên nhân: nhịp cập
> nhật đồng hồ giãn cách **kể cả cho lượt `khongGuiGi`** (lượt lúc mở dự án, không gửi gì vì bản vẽ
> còn rỗng) ⇒ nét vẽ đầu tiên bị chính cái đồng hồ ấy chặn 12 s. Giãn cách sinh ra để hạn chế
> **số bản ghi trên máy chủ** — không có bản ghi nào thì không có gì để hạn chế. Sửa: chỉ tính từ
> một lượt GHI THẬT ⇒ đo lại được **2,5 s**, đúng con số thiết kế. Đã khoá bằng test
> *"lượt khongGuiGi KHÔNG khoá đồng hồ giãn cách"*.
> **Nếu chỉ chạy test và đọc mã thì không bao giờ thấy con số 10,0 s này.**

## 5 · Máy kiểm

| | kết quả |
|---|---|
| `npx tsc --noEmit` | **0 lỗi** (toàn repo, kể cả tệp của làn khác) |
| `lib/save-status.test.ts` (mới) | **11 pass** — quét 60 tổ hợp trạng thái |
| `lib/sheets-persist-nhip-may-chu.test.ts` (mới) | **14 pass** |
| `lib/sheets-persist.test.ts` (cũ, cùng tệp) | **28 pass · 0 fail** |
| `lib/cad/cad3d-autosave-core.test.ts` (cũ) | **30 pass · 0 fail** |
| `lib/disk-sync.test.ts` (cũ, kênh ② liền kề) | **14 ok · 0 fail** |
| `npx eslint` 6 tệp đã sửa | sạch |

`npm test` đầy đủ **cố ý KHÔNG chạy** — đang đỏ vì một trần khác, không liên quan làn này.

## 6 · ⑦b CHƯA CHẮC / CHƯA KIỂM — bắt buộc khai

1. **Chỉ Chromium 1194.** Không thử Safari/Firefox. Đường `pagehide` được thêm CHÍNH VÌ Safari/iOS
   không chạy `beforeunload` — mà **đúng cái lý do đó lại chưa được kiểm trên Safari**.
2. **Chưa thử trong Electron thật.** `navigator.sendBeacon` có trong Chromium của Electron, nhưng
   vòng đời cửa sổ Electron khác tab trình duyệt — chưa đo.
3. **Beacon chỉ mới đo với bản vẽ NHỎ.** Gói tin của chuỗi 4 tường nằm xa dưới trần 60 KB. **Chưa
   đo ngưỡng thật**, và với hồ sơ 12.600 entity (hồ sơ mà chú thích vá-lag 01/09 nhắc tới) gói tin
   gần như chắc chắn **vượt trần ⇒ beacon KHÔNG cứu**. Ở đó thứ bảo vệ người dùng là nhịp 2,5 s +
   nhãn nói thật, không phải beacon. Chưa có test nào canh ngưỡng này.
4. **Chưa thử tắt máy/mất điện đột ngột.** CA 2 (`browser.close()`) là thứ gần nhất, và ở đó **vẫn
   mất** — đúng như thiết kế, vì không sự kiện rời trang nào chạy.
5. **Chưa đo dưới tải thật.** Máy đo đang chạy 3–6 `next dev` cùng lúc và **đã bị OOM giết một
   lần** (`dmesg`: `Killed process … (chrome)`). Con số 2,5 s / 7,6 s vì thế là **trần trên**;
   trên máy rảnh sẽ nhanh hơn, chưa đo.
6. **Chặng Trình bày (`PresentSheets`) chỉ kiểm bằng test + đọc mã**, chưa thao tác trên app thật.
   Nhánh deck lớn (ảnh dataURL) hoàn toàn chưa đo.
7. **Mode 3D (`cad3d-autosave-core`) chưa mở trên app.** Câu `'off'` mới thêm chỉ được suy từ mã.
8. **Trần ~300 bản ghi/giờ là TÍNH, không phải ĐO** — suy từ hai hằng số, chưa chạy một giờ vẽ thật
   để đếm.
9. **Chưa thử hai tab cùng mở một dự án** với nhịp mới (cơ chế `watchProjectPresence` chỉ cảnh báo,
   không khoá — không đổi ở lượt này, nhưng nay có thêm một đường ghi máy chủ nhanh hơn).
10. **Chưa thử trình đọc màn hình.** Nhãn mới có `Tooltip` (`aria-describedby` sẵn có) nhưng chưa
    kiểm bằng cây trợ năng thật.

## 7 · Phát hiện ngoài phạm vi — ghi lại, KHÔNG tự sửa

1. 🔴 **Cổng 3210 (`next start`) đã hỏng hẳn — mọi chunk trả 500.** Đo: `GET
   /_next/static/chunks/*.js` → **500** cho ~40 tệp liên tiếp. Nguyên nhân gần như chắc chắn là
   một `next dev` chạy TRONG cây worktree dùng chung đã ghi đè `.next` của bản dựng sẵn. ⇒ Mọi làn
   đang được dặn "nghiệm thu ở 3210" cần biết: **3210 không còn dùng làm mốc được**, phải dựng lại
   (`next build`) hoặc mỗi làn tự dựng bản sao. Tôi không sửa vì `.next` là tài nguyên chung.
2. 🔴 **CSDL dev (`prisma/dev.db`) bị một làn khác khôi phục về bản cũ giữa buổi.** Đo: tài khoản
   tạo lúc 09:11 **biến mất khỏi cả hai CSDL**, trong khi tài khoản tạo 08:46 còn. Bộ đo của tôi
   nay tự đăng ký lại khi login 401, nhưng **mọi làn dùng dữ liệu dev để nghiệm thu đều có thể mất
   dữ liệu giữa chừng mà không nhận ra**.
3. 🟡 **Container bị OOM giết tiến trình** (`dmesg`: `oom_memcg=…/claude-code-bash`, giết cả
   `next-server` lẫn `chrome`). Sáu `next dev` cùng lúc trong một cgroup 14 GB. Đây là lý do một
   lượt đo bị "Page crashed" giữa chừng.
4. 🟡 **`components/cad/CadSheets.tsx:1307` — `'onChange' is defined but never used`** (eslint
   error). **Có sẵn từ trước lượt này**, không phải do tôi; nằm trong vùng ghi của tôi nhưng ngoài
   phạm vi lỗi P0 nên không đụng.
5. 🟡 **`pkill -f`/`pgrep -f` tự khớp CHÍNH NÓ.** Tôi dính đúng cái bẫy mà `docs/00-CHOT.md` 04/09
   đã ghi thành luật ("máy soi nào quét văn bản thì phải tự loại trừ chính nó"): `pgrep -f
   "next-server"` khớp luôn dòng lệnh bash đang chạy lệnh đó, cho ra một PID không phải server.
   Lần thứ tư cùng một cơ chế. Cách đúng đã dùng ở đây: lọc theo `readlink /proc/<pid>/cwd`.

## 8 · Ảnh — `docs/delivery/anh-duyet-mat/p0-luu/`

Cặp đối chiếu đắt nhất là **CA 3**: cùng một màn hình, cùng một khoảnh khắc (mạng bị chặn),
cùng chuỗi tường —

| ảnh | mã | nhãn ở góc phải thanh trạng thái |
|---|---|---|
| `TRUOC-ca3-mang-hong.png` | cũ | 🔴 **`Đã lưu lúc 09:40`** — trong khi máy chủ không nhận được gì |
| `SAU-ca3-mang-hong.png` | mới | ✅ **`Chưa lưu lên máy chủ`** (mức cảnh báo) |

| ảnh | nội dung |
|---|---|
| `TRUOC-ca1-nhan-truoc-khi-dong-tab.png` · `SAU2-ca1-nhan-truoc-khi-dong-tab.png` | nhãn ngay trước khi đóng tab |
| `TRUOC-ca1-mo-lai-ho-so-moi.png` · `SAU-ca1-mo-lai-ho-so-moi.png` · `SAU2-ca1-mo-lai-ho-so-moi.png` | mở lại trên hồ sơ trình duyệt MỚI |
| `SAU-ca2-nhan-luc-dong-som.png` | nhãn lúc đóng rất sớm — `Đang lưu…`, không hứa gì |
| `SAU-ca2b-truoc-khi-roi.png` | ngay trước khi rời trang (đường beacon) |
| `SAU-ca4-ban-phim-truoc-tai-lai.png` · `SAU-ca4-sau-tai-lai.png` | lối BÀN PHÍM, trước/sau tải lại |

## 9 · Tệp đã đụng (CHƯA COMMIT)

```
M lib/save-status.ts                          +131
M lib/sheets-persist.ts                       +177
M lib/cad/cad3d-autosave-core.ts               +10
M components/studio/StatusBar.tsx           +64/−...
M components/cad/CadSheets.tsx                +124
M components/present-editor/PresentSheets.tsx  +86
? lib/save-status.test.ts                      (mới)
? lib/sheets-persist-nhip-may-chu.test.ts      (mới)
? docs/delivery/FIX-P0-LUU.md                  (mới)
? docs/delivery/anh-duyet-mat/p0-luu/          (mới, 12 ảnh)
```

Không `git add`, không `stash`, không `checkout`, không `reset` — ba làn khác đang dùng chung cây.

## 10 · Chạy lại bộ đo

Bản sao app dùng-xong-bỏ đã dọn (`/tmp/p0-luu-app`), server riêng đã tắt, **cổng 3210 giữ nguyên**.
Kịch bản đo còn ở `/tmp/p0/` (`lib.mjs` · `10-bon-ca.mjs` bốn ca · `11-beacon.mjs`), nhật ký thô
đã lưu vào `do-TRUOC-bon-ca.txt` / `do-SAU-bon-ca.txt` cạnh ảnh.

Dựng lại: chép cây làm việc sang một thư mục tạm (bỏ `node_modules`/`.next`/`.git`), symlink
`node_modules`, `next dev` ở một cổng rảnh, rồi
`P0_NHAN=SAU P0_CA=1,2,3,4 IF_URL=http://localhost:<cổng> node /tmp/p0/10-bon-ca.mjs`.
Lượt "mã cũ" đặt lại 6 tệp bằng `git show HEAD:<tệp>` vào bản sao — **không đụng cây làm việc**.

> ⚠️ Bộ đo tự đăng ký lại tài khoản khi login trả 401: CSDL dev là tài nguyên dùng chung và đã bị
> một làn khác khôi phục về bản cũ giữa buổi (xem §7).
