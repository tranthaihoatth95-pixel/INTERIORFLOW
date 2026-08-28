# COHERENCE-FILES — khu *Tệp nguồn dự án* nhìn là hiểu (20/08)

> Vùng ghi: `components/filemanager/**` · `app/files/**`. Không đụng lane khác, không git, không
> prisma, không `app/globals.css`, không `--accent*`.
> **Trả MAIN: FILES = LIVE · VISUAL COHERENCE = PASS · BROWSER = PASS.**

---

## ⓪ TIỀN ĐỀ — kiểm trước khi làm

| Giả định của phiếu | Đo tại nguồn | Kết |
|---|---|---|
| `git log -1` = `c7f3ac8` | `c7f3ac8` | ✅ |
| API `/api/project-files` (POST/GET · DELETE · promote · file) LIVE | đọc code 4 route | ✅ |
| POST nhận JSON `{projectId,name,dataUrl\|url}` | `route.ts` POST | ✅ |
| `TepNguonDuAn.tsx:154` dùng `useMemo(Math.random)` làm id | đúng, dòng 154 | ✅ |
| Route trả **415** cho DWG/DXF | 415 thật, câu server đo được (mục ⑩ browser) | ✅ |

🔴 **Một giả định của phiếu KHÔNG đúng và nó đổi cách làm việc ②**: *"BẢY TRẠNG THÁI"* ngầm giả
định mọi trạng thái đều gắn được vào một hàng `ProjectFile`. Đo ra: **lượt tải hỏng KHÔNG sinh
`ProjectFile`** (415 chặn trước `prisma.create`) ⇒ ba nấc `Đang tải lên · Không hỗ trợ · Lỗi`
**không có hàng nào để đậu**. Giải: danh sách **LƯỢT THỬ** (`choList`) đứng ngay trên danh sách
tệp, cùng ngôn ngữ huy hiệu. Không có nó thì hoặc phải bịa một hàng giả, hoặc nuốt câu 415 vào
một banner chung — cả hai đều là nói dối trên mặt kính.

---

## ① VIỆC ĐÃ LÀM

**File mới**
- `components/filemanager/tep-nguon-trang-thai.ts` — lõi THUẦN: 3 vật · 7 nấc · lý do nút mờ ·
  khớp tệp↔tài sản · 3 nấc bên phải.
- `components/filemanager/tep-nguon-trang-thai.test.ts` — 30+ khẳng định, gồm **drift-guard**
  `tagNguonTep` ↔ `tagNguonProjectFile` (`lib/server/promote.ts`).

**File sửa**
- `components/filemanager/TepNguonDuAn.tsx` — dựng lại phần nhìn; `useMemo(Math.random)` →
  `useId()`.

### ① BA VẬT — phân biệt bằng mắt
Hai họ ký hiệu **cố ý không giao nhau** (test khoá): vật `□ ◆ ⇄` (danh tính) ↔ trạng thái
`↑ ○ ◐ → ● ⊘ ✕` (mức độ, cùng họ `NganPhanTho.tsx`).

| Huy hiệu | Nghĩa | Vì sao phải tách |
|---|---|---|
| `□` Tệp nguồn dự án | thô, thuộc ĐÚNG MỘT dự án | |
| `◆` Tài sản Thư viện | đã hiểu, dùng lại nhiều dự án | `LibraryAsset` **không mang `projectId`** — vẽ chung một huy hiệu là **nói sai contract Promote** ngay trên mặt kính |
| `⇄` Đang dùng trong dự án này | quan hệ `ProjectAssetUsage` | |

Ba huy hiệu hiện **SONG SONG**, không đè nhau — một tệp có thể mang cả ba cùng lúc.

### ② BẢY NẤC — đủ và THẬT
`Đang tải lên ↑ · Cần xem lại ○ · Sẵn sàng ◐ · Đang đưa vào Thư viện → · Đã vào Thư viện ● ·
Không hỗ trợ ⊘ · Lỗi ✕`. Mỗi nấc = **ký hiệu + chữ**; màu chỉ tô thêm cho hai nấc hỏng ⇒ **bỏ
hết màu vẫn đọc được**.
🔴 `Không hỗ trợ` hiện **NGUYÊN VĂN câu server**, không viết lại. Đo thật (mục ⑩):
> *"Loại file chưa nhận được — v0 chỉ nhận PNG/JPEG/WEBP/GIF/AVIF/PDF. (DWG/DXF/XLSX cần nới
> lib/server/mime-sniff.ts bằng một phiếu riêng.)"*
Câu này **nói thẳng DWG/DXF chưa có** — đúng yêu cầu "không giả vờ hỗ trợ".

### ③ BA HÀNH ĐỘNG mỗi hàng
`Đưa vào Thư viện` · `Mở tài sản trong Thư viện` · `Đang dùng ở đâu`. Mọi nút mờ đi qua MỘT khuôn
`NutLyDo` → `aria-disabled` + `aria-describedby` trỏ vào `.if-tooltip-a11y`, **`title` = null**
(đo trong browser). Không nút giả: nút chưa đủ điều kiện có lý do THẬT, không phải câu chung.

### ④ NGỮ PHÁP BÊN PHẢI — ba nấc là ba CÔNG NĂNG
Dùng `PanelFlank side="right"` (tay cầm thu/mở dùng chung, nhớ localStorage) — **không dựng
inspector thứ hai**. Mỗi nấc trả lời MỘT câu khác (test khoá: ba câu hỏi không được trùng):

| Nấc | Câu hỏi | Thêm lớp tin gì |
|---|---|---|
| Xem lướt | *Nó là gì?* | huy hiệu + câu ranh giới của từng vật |
| Xem kỹ | *Nó là tệp nào?* | MIME · ngày · người tải · vân tay nội dung |
| **Xem sâu** | *Nó dính vào đâu?* | **QUAN HỆ** — Đi tới nguồn · Đang dùng ở đâu |

Nấc `sâu` mang thứ hai nấc kia **KHÔNG THỂ** có: nó phải hỏi máy chủ. Đúng luật 16/08 *"size to
là BỔ SUNG CHI TIẾT"*, không phải phóng to.

### Sửa kèm — lỗi có sẵn ở `:154`
`useMemo(() => Math.random()…)` → `useId()`. Id ngẫu nhiên lệch server↔client ⇒ hydration
mismatch **và** `aria-describedby` của nút mờ **trỏ hụt ở render đầu** — tức lý do nút mờ không
tới được trình đọc màn hình đúng lúc cần nhất. Console trong lượt verify: **0 cảnh báo
hydration/aria**.

---

## ② VÌ SAO LÀM THẾ — hai chỗ đáng cãi

**Trạng thái "đã vào Thư viện" phải sống qua RELOAD, mà server không nói.**
`GET /api/project-files` (FILE_SELECT, `_lib/guard.ts:48`) không trả cờ promote, và `ProjectFile`
**không có** cột `promotedAt`/`assetId` (Promote đánh dấu bằng **tag provenance**
`nguon:projectfile:<id>` trên `LibraryAsset` — `lib/server/promote.ts` khai rõ vì sao). ⇒ Muốn
hàng còn nhớ sau khi tải lại trang thì chỉ còn một đường: **khớp tag bên phía tài sản** qua
`GET /api/library`.
- **Cái giá, khai thẳng**: mỗi lần mount (và chỉ khi có ≥1 tệp) tải **cả kho** — đo 20/08 là
  **1.613 hàng**. Hỏng thì **im lặng bỏ qua**, không chặn khu.
- **Đường sạch**: thêm cờ promote vào `FILE_SELECT`. **Nằm ngoài vùng ghi của phiếu** ⇒ không tự
  làm. Đây là việc nên mở phiếu.
- Khớp theo **TỪNG tag** (cắt dấu phẩy, bỏ hoa/thường) chứ không `includes` cả chuỗi — test có ca
  `pf-123` vs `pf-12345`: khớp nhầm tiền tố sẽ **gắn nhầm tệp vào tài sản của dự án khác**.

**Không dựng cửa mới cho "Mở tài sản trong Thư viện".** Gọi `openLibrarySheet()` — cửa DUY NHẤT
đã có (`lib/library/use-library-sheet.ts`, mount sẵn trong `AppShell`). 🟡 **Hạn chế thật:** sheet
**chưa focus được một asset cụ thể** (không có tham số assetId), nên nút mở *Thư viện*, không mở
*đúng ô đó*. Thêm focus-by-asset phải sửa `components/library/**` — **lane khác đang khoá**. Bù
lại: nấc `Xem sâu` có link thẳng tới tài sản, nên đường tới vật không bị cụt.

---

## ③ NGHIỆM THU

### Máy
- `npx tsc --noEmit` → **0**.
- `npx tsx components/filemanager/tep-nguon.test.ts` → **OK, không hồi quy**.
- `npx tsx components/filemanager/tep-nguon-trang-thai.test.ts` → **OK** (mới).
- Không hex gõ cứng, không `#fff`, không `--accent*` (chỉ xuất hiện trong MỘT dòng comment).
  Bo góc chỉ dùng thang token: `--r-1` ×1 · `--r-2` ×7 · `--r-3` ×2 · `--r-full` ×1.

### Browser THẬT — :3001, dự án *Nháp*, 1440×900
🔴 **Chrome của phiên này KHÔNG dùng được**: renderer đóng băng trên `localhost:3001`
(`Runtime.evaluate` timeout 45s, tab bật về `chrome://newtab`), và **`/settings` — màn KHÔNG mount
component này — cũng đóng băng y hệt** ⇒ là bệnh môi trường, không phải bệnh của thay đổi này.
Đo kèm: `Load Avg 49.95`, PhysMem còn 87M, `/files` có lúc mất **51s** mới trả.
⇒ Chạy bằng **Playwright** (đã có sẵn trong repo, `1.62.1`), server 3001 **không restart**.
Phiên: ký JWT bằng chính `AUTH_SECRET` trong `.env` cho user có sẵn — **không nhập mật khẩu ở
đâu**, cookie chỉ sống trong context tạm.

| # | Kịch bản | Kết quả ĐO ĐƯỢC |
|---|---|---|
| ① | mở `/files` | khu render, chọn được dự án *Nháp* từ danh sách THẬT |
| ② | tải PNG thật | `□ Tệp nguồn dự án` + `○ Cần xem lại` |
| ③ | nút *Đưa vào Thư viện* lúc chưa xem | `aria-disabled=true`, lý do = *"Xem tệp rồi đánh dấu \"Đã xem\"…"*, **`title`=null** |
| ④ | nút *Đang dùng ở đâu* lúc chưa promote | `aria-disabled=true`, lý do = *"Quan hệ sử dụng chỉ có sau khi đưa vào Thư viện."* |
| ⑤ | tick *Đã xem* | nấc đổi `○ Cần xem lại` → `◐ Sẵn sàng`, nút mở khoá |
| ⑥ | bấm promote | bắt được nấc trung gian `→ Đang đưa vào Thư viện` |
| ⑦ | sau promote | `□` + **`◆ Tài sản Thư viện`** + `● Đã vào Thư viện`; nút *Mở tài sản* hết mờ |
| ⑧ | *Đang dùng ở đâu* | where-used THẬT: **"Nháp · Ảnh tham chiếu render"**; huy hiệu mọc thêm `⇄ Đang dùng trong dự án này` |
| ⑨ | ba nấc phải | `luot`→"Nó là gì?" · `ky`→"Nó là tệp nào?" (image/png · 11:56:40 20/8/2026 · người tải · vân tay) · `sau`→"Nó dính vào đâu?" (Đi tới nguồn + Đang dùng ở đâu) |
| ⑩ | tải `.txt` | `⊘ Không hỗ trợ` + **nguyên văn** câu server (trích ở §① ②) + nút *Bỏ qua* |
| ⑪ | **tải lại trang** | `□` + `◆ Tài sản Thư viện` + `● Đã vào Thư viện` **vẫn còn** ⇒ đường khớp tag chạy thật |

Console: **0 lỗi** ngoài đúng một dòng `415 (Unsupported Media Type)` — chính là lượt `.txt`, tức
bằng chứng chứ không phải lỗi. Ảnh: `shot-1…shot-6` (scratchpad).

### VISUAL COHERENCE
Đặt cạnh **Trang chủ · 2D · 3D · Trình chiếu** (cùng `AppShell`, cùng rail hai cụm) và cạnh hai
láng giềng ruột thịt trong chính `/files` — ngăn *Phần thô dùng chung* và `FileManagerShell`:
- cùng thẻ `--pad-card` / `--r-3` / `--card` / `--border`; cùng pill `--r-full`; cùng thang chữ
  `--fs-ui` / `--fs-2xs`; nút cùng `--tap` / `--r-2`;
- huy hiệu **cùng họ ký hiệu hình học** với `NganPhanTho.tsx` (`○ ◐ ●`) — không đẻ ngôn ngữ thứ hai;
- tay cầm panel phải là `PanelFlank` dùng chung, không phải bản chép tay;
- nút mờ đi `--mo-vo-hieu`, không hằng số `0.5` tại chỗ.
⇒ **PASS** — nhìn ảnh không đọc ra "app khác".

---

## ④ DỌN SẠCH — số trước/sau, tự đo mốc

| | trước lượt | sau lượt | delta của tôi |
|---|---|---|---|
| `ProjectFile` | 0 | **9** | **0** |
| `LibraryAsset` | 1613 | **1622** | **0** |
| `ProjectAssetUsage` | 0 | **9** | **0** |
| tệp trong `./uploads` | 1616 | **1625** | **0** |

⚠️ **Chín hàng chênh lệch KHÔNG phải của tôi** — chúng do một lane khác tạo TRONG lúc lượt này
chạy (9 `ProjectFile` tên *"Gỗ sồi trắng"*, *"Đá terrazzo xám"*, *"Tham chiếu · ánh sáng sớm"*…).
Tôi xoá **đúng 2 `ProjectFile` + 1 `LibraryAsset` + 1 `ProjectAssetUsage` + 2 tệp `uploads`** do
lượt verify sinh ra, tra bằng id cụ thể (không xoá theo khoảng thời gian — suýt quét nhầm hàng của
lane kia). Script + ảnh nằm trong scratchpad, **không có tệp tạm nào để lại trong repo**.

---

## ⑤ CÒN NỢ — nói thẳng, không vẽ nút cho thứ chưa có

| Món | Hiện trạng backend |
|---|---|
| Focus đúng một asset khi mở Thư viện | **CHƯA CÓ** — `openLibrarySheet` chỉ nhận `shelfId`/`stage`. Sửa phải vào `components/library/**` (lane khoá). |
| Cờ promote trong `GET /api/project-files` | **CHƯA CÓ** — đang phải khớp tag qua cả kho `/api/library`. |
| Dedupe theo `contentHash` khi promote | **CHƯA CÓ** — `LibraryAsset` không có cột hash (`promote.ts` khai rõ). Hai tệp cùng nội dung ⇒ hai tài sản. |
| DWG/DXF/XLSX | **CHƯA CÓ** — 415 thật. UI **không** vẽ nút/nhánh nào giả vờ nhận. |
| Gỡ tệp khỏi dự án (xoá `usage`) từ khu này | `DELETE /api/project-asset-usage/[id]` có thật, **UI chưa gắn** — cố ý, ngoài 3 hành động phiếu giao. Không vẽ nút chết. |

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- **Chỉ đo THEME hiện hành của app** (nền sáng). `emulateMedia({colorScheme:'light'})` không đổi
  gì vì app theo cờ theme riêng, không theo `prefers-color-scheme`. Nền tối **suy** từ chỗ mọi màu
  đều là token — **chưa nhìn bằng mắt**.
- **`prefers-reduced-motion` chưa kích hoạt lần nào.** `LightBar` tự lo nhánh này, tôi không thêm
  chuyển động mới — nhưng đó là *suy*, không phải *đo*.
- **Chỉ Chromium.** Safari/Firefox là suy.
- **Chưa thử trình đọc màn hình thật.** Đã đo `aria-disabled`/`aria-describedby`/`title=null` bằng
  DOM; *"trình đọc màn hình đọc đúng câu đó"* thì chưa chứng minh.
- **Nấc `Lỗi ✕` trên hàng tệp chưa gặp ca thật** — chỉ có test lõi. Nấc `Lỗi` ở *lượt thử* cũng
  chưa gặp (mọi lượt hỏng trong lượt verify đều rơi vào 415).
- **Con số 1.613 tài sản** là đo lúc bắt đầu lượt; nó đang tăng do lane khác. Chi phí của đường
  khớp tag vì thế **sẽ tăng theo kho**, không đứng yên.
- **Chưa đo hiệu năng** khi một dự án có hàng trăm `ProjectFile` (mọi dự án hiện có ≤9).
- Kết luận *"Chrome đóng băng là bệnh môi trường"* dựa trên ca `/settings` cũng đóng băng +
  `Load Avg ~50`. Mạnh, nhưng **không phải chứng minh tuyệt đối**.

## ⑦c HẠN DÙNG KẾT LUẬN

- *"Trạng thái promote phải khớp qua tag"* — **hết hiệu lực ngay khi** `FILE_SELECT` mọc cờ
  promote. Lúc đó **xoá đường `/api/library`**, đừng giữ cả hai.
- *"Không có nút focus asset trong Thư viện"* — hết hiệu lực khi `openLibrarySheet` nhận `assetId`.
- Bảng 7 nấc gắn với hành vi HIỆN TẠI của route. Server đổi mã lỗi (vd nhận DWG) ⇒ **đọc lại route
  trước khi tin bảng này**.
- Số đếm DB ở §④ đúng cho **11:5x ngày 20/08**; lane khác đang ghi liên tục — phiên sau phải **tự
  đo mốc**, cấm chép số này.
