# LICENSE-NOTES — nghĩa vụ giấy phép bên thứ 3 của InteriorFlow

> ⚠️ KHÔNG PHẢI TƯ VẤN PHÁP LÝ. Người viết là engineer (agent), không phải luật sư. Mục đích: ghi
> lại dependency nào mang nghĩa vụ giấy phép, đã làm gì, và việc gì CẦN luật sư xác nhận TRƯỚC KHI
> phát hành thương mại.
>
> Thay thế `docs/archive/LICENSE-NOTES.md` (bản cũ, lập luận "tool nội bộ" đã hết hiệu lực từ
> 25/07 — xem `docs/RESEARCH-DWG-LICENSE.md`). Bản này áp dụng bản nháp ở §7 của file nghiên cứu
> đó, sau khi Hoà duyệt qua lệnh "tiến hành" (28/07). Theo luật versioning của dự án: KHÔNG đè lên
> bản cũ, bản cũ giữ nguyên trong `archive/` làm lịch sử quyết định.

## 0. Định vị sản phẩm (căn cứ cho mọi phân tích dưới đây)

InteriorFlow là **sản phẩm độc lập, hướng tới thị trường global**, dùng cho **mọi studio nội
thất/kiến trúc** — KHÔNG phải tool nội bộ của một công ty (xem `CLAUDE.md`, LUẬT NỀN TẢNG).

⛔ **Lập luận "internal tool, not distributed" trong các bản trước của file này ĐÃ BỊ HUỶ.**
Nó chỉ đúng khi IF là tool nội bộ một pháp nhân (FSF GPL FAQ: *"Is making and using multiple
copies within one organization or company 'distribution'?" — "No, in that case the organization
is just making the copies for itself."*). Với định vị global, mọi bản phát hành ra ngoài — web
công khai, installer, app store — **đều là "conveying"** theo GPL-3 §0.

## 1. Dependency copyleft: `@mlightcad/libredwg-web` (GPL-3.0)

- **Dùng để:** đọc file `.dwg` (binary AutoCAD, không có spec công khai từ Autodesk). Dựa trên
  GNU LibreDWG, biên dịch WASM. Là thư viện open-source khả thi duy nhất cho việc này.
- **License:** GPL-3.0 (**không** phải AGPL — GPL-3 không có điều khoản network/SaaS).
- **⚠️ Package npm KHÔNG kèm file LICENSE/COPYING.** Khi conveying, ta phải tự kèm bản GPL-3
  đầy đủ + copyright notice (MLight Lee + GNU LibreDWG / FSF).
- **⛔ KHÔNG GHI ĐƯỢC DWG.** Build của package dùng `--disable-write`; upstream LibreDWG chỉ
  ghi được r1.2–r2000 và còn "highly unstable". Roadmap IF2 cần export DWG ⇒ phải là ODA SDK.

## 2. Trạng thái tuân thủ hiện tại — CHƯA ĐỦ để phát hành thương mại

| Nghĩa vụ GPL-3 | Điều | Trạng thái |
|---|---|---|
| Kèm bản GPL-3 cho người nhận | §4 | ⬜ **CHƯA LÀM — cần trang "Third-party licenses" trong app (việc code, giao Claude Code)** |
| Giữ nguyên copyright/license notice | §4, §5(a) | ⬜ CHƯA hiện cho user |
| Cung cấp Corresponding Source (hoặc written offer) | §6 | ⬜ CHƯA |
| Ghi rõ phần nào dưới GPL | §5(a) | 🟡 Có trong docs nội bộ (file này) — CHƯA hiện trong app |

> Đúng luật E4 của `IF-MASTER-TREE.md` ("cột Code là sự thật duy nhất"): viết xong file docs này
> KHÔNG có nghĩa là app đã tuân thủ — 4 dòng trên vẫn ⬜ cho tới khi có code thật. Xem
> `docs/HANDOFF-COWORK-2026-07-28.md` cho việc cần Claude Code làm tiếp.

**Đường phát sinh conveying hiện tại:**
1. **Web**: `public/wasm/libredwg-web.wasm` (9 MB) + bundle worker → tải xuống browser của user.
   FSF: JavaScript/WASM browser tải về **là conveying** ("these are conveyed to you").
2. **Desktop**: installer Electron đóng gói nguyên `node_modules` (`package.json > build.files`
   có `node_modules/**/*`, `asar: false`) → binary GPL nằm trong `.exe`/`.dmg` phát cho user.

## 3. Ranh giới code (đã làm tốt — giữ nguyên)

| File | Vai trò |
|---|---|
| `lib/cad/dwg-worker.ts` | **File DUY NHẤT** import package GPL (dòng ~231). Chỉ giao tiếp qua postMessage JSON. |
| `lib/cad/dwg.ts` | Cầu nối, KHÔNG import GPL. `openDwgFile()` là API duy nhất phần còn lại của app dùng. |
| `lib/cad/dwg-map.ts` | `dwgRawDocToDoc()` — map JSON thô → `Doc`. KHÔNG import GPL. Unit-testable. |

⚠️ Cô lập worker là **giảm thiểu rủi ro**, **KHÔNG** phải bảo đảm tuân thủ. Câu "worker có đủ để
tránh derivative work?" là **câu cần hỏi luật sư**, không tự trả lời được.

## 4. Kế hoạch xử lý — 3 tầng (đã duyệt 28/07)

Xem **`docs/RESEARCH-DWG-LICENSE.md`** (nghiên cứu 25/07/2026) cho so sánh đầy đủ 5 đường A-E +
kế hoạch di trú `file:dòng`.

- **Ngay (giao Claude Code, ~0 chi phí):** trang "Third-party licenses" trong app (GPL-3 text đầy
  đủ + copyright notice + written offer Corresponding Source) · thêm attribution cho `jszip`
  (chọn nhánh MIT, không dùng nhánh GPL của dual-license) và `sharp`/libvips (LGPL-3, dynamic
  link, không lây) · thêm `license-checker-rseidelsohn --onlyAllow` vào CI.
- **1 sprint tới — đường A+D:** di trú parse DWG sang server-side (route API mới — đã verify chạy
  nhanh hơn bản browser hiện tại: 351ms/300KB, 1.5s/3.3MB) → user không nhận bản copy nào của
  thư viện GPL ⇒ hết conveying cho bản web. Loại `@mlightcad/*` khỏi installer Electron, trỏ
  Electron gọi API server thay vì chạy local (đánh đổi: mở DWG cần mạng — DXF vẫn offline). Giữ
  nguyên đường DXF (`lib/cad/dxf.ts`) làm fallback sạch giấy phép tuyệt đối — mọi entity IF thật
  sự dùng đều sống sót qua DXF nguyên vẹn.
- **Dài hạn — chỉ khi IF2 thật sự cần GHI DWG** (không mua trước, đúng luật "không xây L khi N
  chưa xong"): hỏi thẳng ODA (Open Design Alliance) qua email — Commercial ($3.000 năm đầu/$2.250
  gia hạn, giới hạn 100 bản) có đủ cho desktop không; Sustaining ($7.500/$4.500, cần cho Drawings
  inWEB SDK nếu web cũng cần ghi DWG) có bắt buộc không; điều khoản chấm dứt hợp đồng (mất quyền
  phân phối bản đã build khi ngừng trả phí) — rủi ro tài chính vĩnh viễn cần tính vào giá bán IF.

**Không làm:** dùng dịch vụ convert cloud bên thứ 3 (CloudConvert/Autodesk APS) làm đường mặc định
— rủi ro vi phạm NDA với khách hàng (bản vẽ kiến trúc của khách rời khỏi tay IF) nặng hơn rủi ro
vi phạm license nhiều.

## 5. Dependency khác

Đã rà **34 dep trực tiếp** (25/07): 25 MIT, 4 Apache-2.0, 1 BSD-3-Clause, 1 ISC,
`jszip` dual `(MIT OR GPL-3.0-or-later)` → **ta chọn MIT** (phải ghi rõ trong attributions).
**Không có** AGPL/SSPL/LGPL-static. `@mlightcad/libredwg-web` là dependency copyleft **duy nhất**.
Nợ còn lại: chưa quét transitive dependencies (~1000 pkg) — chạy
`license-checker-rseidelsohn --onlyAllow 'MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;0BSD;CC0-1.0;Unlicense;Python-2.0;BlueOak-1.0.0'`
một lần trước khi phát hành thương mại, và đưa vào CI.

## 6. Giới hạn kỹ thuật của DWG import (không liên quan license)

- Entity map được: LINE, CIRCLE, ARC, TEXT, MTEXT, LWPOLYLINE, HATCH (boundary thẳng),
  INSERT/MINSERT (flatten ở `dwg-map.ts`), ATTRIB, DIMENSION.
- Chưa hỗ trợ: WIPEOUT, POINT, SPLINE, ELLIPSE, HATCH boundary cong → bỏ qua an toàn, đếm vào
  `skippedEntityCount`, hiện ở status bar.
- Đã có kiểm magic-header `AC10xx` trước khi đưa vào WASM (`hasDwgMagic`) — libredwg-web tự nó
  "khoan dung", trả ok với file rác.
- Lineweight từ DWG dùng suy luận chưa xác nhận chính thức — chỉ ảnh hưởng thẩm mỹ.

## 7. Font nhúng vào PDF: Be Vietnam Pro (OFL — an toàn, khác hẳn ca GPL ở trên)

| Mục | Giá trị |
| --- | --- |
| Font | **Be Vietnam Pro** — Regular (400) + Bold (700) |
| Giấy phép | **SIL Open Font License 1.1** (bản đầy đủ: `public/fonts/OFL.txt`) |
| Bản quyền | Copyright 2021 The Be Vietnam Pro Project Authors |
| Sửa đổi | KHÔNG — giữ nguyên bản upstream |

OFL 1.1 cho phép dùng, nhúng và phân phối lại font kèm phần mềm, kể cả sản phẩm thương mại, và
KHÔNG lây nhiễm giấy phép sang mã nguồn IF. Điều kiện: giữ `public/fonts/OFL.txt` cạnh font,
không bán font tách riêng, không đổi tên font.

## 8. ⛔ Cổng chặn trước khi phát hành thương mại

**KHÔNG** phát hành InteriorFlow (bán, SaaS công khai, app store, phân phối cho khách/đối tác)
trước khi:
1. [ ] Luật sư IP/open-source review xong hướng đã chọn.
2. [ ] Trang "Third-party licenses" có đủ GPL-3 text + notices (nếu còn conveying).
3. [ ] Quyết định dứt điểm về bản Electron (loại package / plugin user tự cài / tuân thủ đầy đủ).
4. [ ] Quét transitive license sạch + có gate trong CI.
5. [x] **(§9) ĐÃ ĐÓNG 05/08**: bỏ hẳn bảng Pantone TCX 2310 mã; máy tra đổi sang nguồn cắm rời
   (`lib/colors/`), app không kèm bảng màu của hãng nào. Việc CÒN LẠI: `git filter-repo` xoá
   `pantone-tcx.json` khỏi lịch sử git + đối chiếu 11 link nguồn của `trend.ts` — xem §9.5.
6. [ ] **MỚI (§10)**: KHÔNG nạp block CAD từ 7 nguồn cấm liệt kê ở §10 vào `lib/cad/furniture.ts`
   hay bất kỳ file thư viện block nào — kiểm bằng mắt mọi lần nhập block hàng loạt (C2a).

## 9. Bảng màu — ĐÃ BỎ BẢNG TRA, GIỮ THAM CHIẾU *(cập nhật 05/08 sau NC-16; bản cũ ở cuối mục)*

> **Trạng thái: ĐÓNG.** Không còn bảng màu nào nhúng trong sản phẩm. Mục này giữ lại vì nó là
> tiền lệ dùng cho MỌI dữ liệu biên soạn về sau (thư viện block, bảng vật liệu, danh mục NCC).

### 9.1 Đã làm gì (05/08)

| | Trước | Sau |
|---|---|---|
| Dữ liệu | `lib/gu/pantone-tcx.json` — **2310 mã** nhúng trong bundle | **XOÁ khỏi git.** App không kèm bảng của ai |
| Hàm tra | `nearestPantone(hex)` — kho gắn cứng bên trong | `nearestColor(hex, source)` / `nearestColors(...)` — **nguồn cắm rời, nạp lúc chạy** |
| Nguồn màu | (không có lựa chọn) | `lib/colors/` — CSV/Excel studio kéo vào · dán clipboard · pull Larkbase của studio |
| Thước đo | ΔE\*76 | **ΔE00 (CIEDE2000)** — ΔE76 sai lệch cảm nhận ở vùng lam/lục |
| Trend | (không có) | `lib/colors/trend.ts` — **vài mã/năm, mỗi mục BẮT BUỘC có link nguồn** |

Hướng (c) của bản cũ ("đổi sang bảng tên trung tính ~2000 tên") **cũng bị loại**: tự đặt lại 2000
tên vẫn là dựng một bộ sưu tập quy mô lớn, chỉ né được tên thương hiệu chứ không né được câu hỏi
"bộ này lấy hình dạng từ đâu ra". Hướng đã chọn là **không giữ bộ sưu tập nào cả**.

### 9.2 VÌ SAO ranh giới nằm ở QUY MÔ BỘ SƯU TẬP, không nằm ở việc hiển thị hay không

Đây là điểm hay bị hiểu ngược ("chỉ cần đừng hiện tên hãng ra là xong") — không phải vậy:

1. **Cái được bảo hộ là BỘ, không phải từng con số.** Một mã hex `#4a5d4e` là một sự kiện, không
   ai độc quyền được. Nhưng *tuyển chọn và sắp xếp* vài nghìn màu thành một hệ — chọn màu nào,
   bỏ màu nào, đặt cạnh nhau thế nào — là lao động biên soạn, và đó chính là lập luận
   **"selection and arrangement"** mà Pantone dùng, và **Jotun dùng nguyên văn** (NC-16).
2. **EU/EEA còn có thêm một tầng nữa: sui generis database right** (Directive 96/9/EC). Quyền này
   tồn tại **ĐỘC LẬP với bản quyền** — nó bảo vệ *khoản đầu tư* để xây CSDL, nên kể cả khi lập
   luận "selection and arrangement" thất bại thì việc rút **"phần đáng kể"** của bộ vẫn bị chặn.
   **Dulux (AkzoNobel) và Jotun đều là công ty EU/EEA** ⇒ dính tầng này.
3. **Dulux còn cấm thẳng bằng chữ**: điều khoản của họ **gọi đích danh việc scraping cho mục đích
   thương mại** ⇒ NC-16 xếp Dulux là **rủi ro cao nhất** trong 6 hãng đã tra.
4. Hệ quả logic: cùng một hành vi "hiển thị mã màu" có thể **hợp lệ ở quy mô nhỏ và vi phạm ở quy
   mô lớn**. Nhắc "Pantone chọn Peach Fuzz làm màu của năm 2024", có dẫn nguồn, là **tham chiếu
   biên tập** — báo chí làm mỗi ngày, không thay thế được sản phẩm của họ. Chép 2310 mã vào phần
   mềm bán ra là **thay thế** chính thứ họ bán. Ranh giới là **QUY MÔ**, không phải màn hình.
5. Vì vậy `lib/colors/trend.ts` có **trần cứng 1 mục/năm + bắt buộc `source`**, và có **test chặn**
   (`registry.test.ts` §5) — luật viết trong comment thì người ta đọc xong quên, luật viết trong
   test thì người ta không vượt qua được.

### 9.3 Vì sao KHÔNG nhúng hãng nào, kể cả hãng "có vẻ dễ tính"

Không tra được điều khoản của **mọi** hãng sơn trên thế giới, và điều khoản đổi bất cứ lúc nào mà
không báo. Nhúng một hãng là mở tiền lệ cho phiên sau nhúng hãng thứ hai. Kiến trúc cắm rời khiến
câu trả lời cho MỌI hãng giống nhau: *IF là cái máy tra, kho là của bạn.*

### 9.4 Có thư yêu cầu gỡ thì làm gì — **đổi config, KHÔNG build lại app**

Dữ liệu nằm ở máy từng studio nên "gỡ" không thể là chuyện phát hành bản mới. Ba mức, tác dụng ngay:

| Mức | Cách | Ai làm |
|---|---|---|
| Máy lẻ | Màn `/colors` → **Chặn theo hãng** (gõ tên hãng) hoặc **Tắt** một bảng | studio, ngay trong IF |
| Phát hành | Biến môi trường `NEXT_PUBLIC_IF_BLOCKED_COLOR_BRANDS` / `NEXT_PUBLIC_IF_DISABLED_COLOR_SOURCES` | vận hành, đổi env rồi khởi động lại |
| Dứt điểm | Xoá tệp `colors.json` trong thư mục dự án / xoá nguồn ở tầng studio | studio |

Env và cấu hình máy **HỢP với nhau, không ghi đè** (`mergeRegistryConfig`) ⇒ thứ đã chặn ở mức
phát hành thì máy lẻ **không tự mở lại được**.

### 9.5 Còn phải làm trước khi phát hành

- [ ] `lib/colors/trend.ts`: **mở lại đủ 11 link nguồn để đối chiếu tên/mã/hex** — phiên code
      05/08 soạn theo hiểu biết sẵn có, **chưa mở link nào** (sandbox không ra ngoài được).
- [ ] Bổ sung mục **năm 2026** (đang khai ở `TREND_MISSING_YEARS`, cố ý để trống chứ không đoán).
- [ ] `git filter-repo` xoá `lib/gu/pantone-tcx.json` khỏi **LỊCH SỬ** git — xoá ở HEAD chưa đủ,
      tệp vẫn nằm trong các commit cũ (gộp chung một lần với việc dọn `/detech` + `__dwg-cancel-
      test.dwg` đã ghi ở `STATUS.md`).
- [ ] `docs/AUDIT-BRAND-PII.md`: thêm dòng "không nhúng bảng màu hãng nào" vào danh sách kiểm.

<details>
<summary>Bản cũ (F3b, 05/08 sáng) — giữ để tra lịch sử quyết định</summary>

### (lưu trữ) 9. Bảng Pantone TCX (`lib/gu/pantone-tcx.json`, F3b — 05/08) — nguồn CHƯA rõ giấy phép

**Việc**: `lib/gu/pantone.ts` `nearestPantone(hex)` tra mã Pantone TCX gần nhất theo ΔE*76 (LAB),
dùng cho cột "Pantone" ở màn Moodboard (F3a). Dữ liệu ở `lib/gu/pantone-tcx.json` — **2310 mã**
(mã · tên · hex), biên soạn lại từ repo GitHub cộng đồng `Margaret2/pantone-colors` (`pantone-
numbers.json`, truy cập 05/08/2026).

⚠️ **KHÔNG PHẢI dữ liệu có giấy phép rõ ràng**:
- Repo nguồn **không có file LICENSE** (`GET /repos/.../license` trả `null` qua GitHub API) — theo
  mặc định GitHub ToS mục D.5, không có license nghĩa là "xem được/fork được trên GitHub" nhưng
  **KHÔNG tự động có quyền dùng lại trong dự án khác**.
- README của chính repo nguồn tự ghi: *"Color names are copyright Pantone; the hex numbers are
  freely available on their website."* — tức tác giả repo cũng thừa nhận TÊN màu là tài sản Pantone,
  chỉ HEX được xem là "công khai để tham chiếu" (không phải tuyên bố cấp phép chính thức).
- Bảng TCX (Textile Color eXtended, hệ Fashion+Home) là hệ màu THƯƠNG MẠI của Pantone LLC — mã số +
  tên gọi hệ thống có thể vướng nhãn hiệu/bản quyền tuỳ mức độ dùng (đặc biệt khi SẢN PHẨM BÁN RA
  hiển thị nguyên "Pantone 13-0752" như tính năng chính, không chỉ tham chiếu nội bộ).

**Trạng thái hiện tại**: dùng làm dữ liệu PHÁT TRIỂN/thử nghiệm (giống cách GPL DWG bị cô lập ở
Worker — xem §1-§4), KHÔNG phải quyết định "được phép ship". `nearestPantone()`/kiến trúc code đã
đúng và tái dùng được ngay khi có nguồn dữ liệu hợp lệ (chỉ cần thay `pantone-tcx.json`, không đổi
API hàm) — tách data khỏi logic đúng mục đích này.

**3 hướng trước khi phát hành thương mại có tính năng Pantone** (chưa chọn, cần luật sư/Hoà quyết,
giống cách §8 xử lý GPL):
(a) Mua giấy phép chính thức (Pantone Connect API/SDK, hoặc Color Manager) — chuẩn nhất, có API
    trả `code`/`name` hợp pháp, thay `pantone-tcx.json` bằng lời gọi API đó.
(b) Xin phép bằng văn bản tác giả `Margaret2/pantone-colors` + tự ý thức đây vẫn KHÔNG giải quyết
    được gốc rễ (tác giả đó cũng không sở hữu quyền với tên Pantone).
(c) Đổi hướng SẢN PHẨM: bỏ nhãn "Pantone", dùng bảng tên màu TỰ ĐẶT (giữ nguyên kiến trúc
    `nearestPantone`, chỉ đổi `pantone-tcx.json` sang bảng tên trung tính) — an toàn tuyệt đối,
    tốn công đặt lại ~2000 tên.

</details>

## 10. Thư viện block CAD (C2a mở rộng `furniture.ts`) — 7 NGUỒN CẤM, đã đọc điều khoản gốc (05/08)

**TUYỆT ĐỐI KHÔNG nạp block/ký hiệu 2D-3D từ 7 nguồn sau vào `lib/cad/furniture.ts`, `lib/cad/
mep.ts`, hay bất kỳ file thư viện block nào của IF:**

| Nguồn | Điều khoản chặn |
|---|---|
| **BIMobject** | Cấm thẳng *"incorporate into a product you provide to a third party"* — nghĩa đen là cấm chính việc IF đang định làm (nạp vào sản phẩm bán cho studio khác). Cấm luôn train AI trên nội dung của họ. |
| **CADforum** | ToS cấm redistribute nội dung tải về ngoài mục đích dùng cá nhân trong CAD của người tải. |
| **Bibliocad** | Cấm redistribute/bán lại block dưới mọi hình thức, kể cả "đã chỉnh sửa". |
| **DWGmodels** | Cùng dòng cấm redistribute như Bibliocad — kho chia sẻ cộng đồng, không phải kho cấp phép lại. |
| **ARCAT** | Nội dung do NHÀ SẢN XUẤT sở hữu (manufacturer content) — ARCAT chỉ trung gian phân phối cho MỘT lần dùng trong hồ sơ dự án, không cấp quyền nhúng vào phần mềm bán ra. |
| **Show It Better** | Bản quyền tác giả gốc (nhiều nghệ sĩ khác nhau), giấy phép chỉ cho dùng trong bản vẽ trình bày, không cho đóng gói lại thành thư viện phân phối. |
| **cad-blocks.net** | Kho tải cộng đồng không có cấp phép lại (no relicensing) — giống nhóm Bibliocad/DWGmodels. |
| **Skalgubbar** (entourage người) | CC BY-NC — cấm dùng THƯƠNG MẠI (NC = NonCommercial), IF định bán nên KHÔNG dùng được dù có ghi nguồn. |

**Dùng được** (đã kiểm giấy phép, an toàn cho sản phẩm thương mại):
- **Openclipart** — CC0 (Public Domain), không điều kiện.
- **Tabler Icons / Lucide / Iconoir** — MIT, cho phép dùng thương mại + sửa đổi, chỉ cần giữ
  notice bản quyền trong mã nguồn (không cần hiện ra UI).

**Ranh giới quan trọng — SỐ ĐO khác HÌNH VẼ:**
Kích thước/tỉ lệ trong Neufert, Panero & Zelnik (*Human Dimension & Interior Space*), hay
dimensions.com là **SỰ THẬT khách quan** (con người cao bao nhiêu, bồn cầu tiêu chuẩn rộng bao
nhiêu mm) — **không có bản quyền**, tự do dùng để tự vẽ block mới ở `lib/cad/furniture.ts`/
`lib/cad/mep.ts` (đúng cách `lib/cad/standards/neufert.ts` đã làm). Điều bị cấm là **đồ lại
NGUYÊN VĂN hình vẽ/block đã có sẵn** từ 7 nguồn trên — đó là tác phẩm có bản quyền của người vẽ,
khác với con số đo đạc phía sau nó.

---

*v2.0 · 2026-07-28 (Cowork, Hoà duyệt "tiến hành") · Thay hoàn toàn bản `archive/LICENSE-NOTES.md`
— áp dụng bản nháp `docs/RESEARCH-DWG-LICENSE.md` §7. Việc code (mục 2, 4) vẫn ⬜, cần Claude Code
— xem `docs/HANDOFF-COWORK-2026-07-28.md`.*
