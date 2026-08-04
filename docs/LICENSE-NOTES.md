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
5. [ ] **MỚI (§9)**: chốt 1 trong 3 hướng Pantone TCX trước khi hiển thị mã Pantone cho khách hàng
   thật — hiện tại chỉ dùng nội bộ/dev là an toàn, RỦI RO nằm ở lúc bật tính năng cho user cuối.
6. [ ] **MỚI (§10)**: KHÔNG nạp block CAD từ 7 nguồn cấm liệt kê ở §10 vào `lib/cad/furniture.ts`
   hay bất kỳ file thư viện block nào — kiểm bằng mắt mọi lần nhập block hàng loạt (C2a).

## 9. Bảng Pantone TCX (`lib/gu/pantone-tcx.json`, F3b — 05/08) — nguồn CHƯA rõ giấy phép

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
