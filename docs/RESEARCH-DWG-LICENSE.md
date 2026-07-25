# RESEARCH — Đường ra cho license GPL-3.0 của thư viện đọc DWG

> ## ⚠️ KHÔNG PHẢI TƯ VẤN PHÁP LÝ
> Đây là **phân tích kỹ thuật** do engineer viết, dựa trên văn bản giấy phép công khai và FAQ
> chính thức của FSF. **KHÔNG phải ý kiến luật sư.** Trước khi phát hành thương mại InteriorFlow
> ra ngoài (bán, SaaS công khai, app store, phân phối cho khách/đối tác), **BẮT BUỘC** phải có
> luật sư sở hữu trí tuệ / open-source compliance xác nhận. Tài liệu này dùng để **chuẩn bị câu
> hỏi cho luật sư** và để chọn hướng kỹ thuật, không dùng để tự kết luận "an toàn".

- **Ngày nghiên cứu:** 25/07/2026
- **Phạm vi:** docs-only. KHÔNG sửa code sản phẩm trong đợt này.
- **Nhánh:** `research/dwg-license` (worktree `interiorflow-wt-dwg-license`, base `feat/present-layout-ml-p1`)

---

## 0. TÓM TẮT CHO NGƯỜI QUYẾT ĐỊNH (đọc 60 giây)

1. **Đường A (parse DWG trên server) là đường ra khả thi nhất, và tôi đã VERIFY được nó chạy.**
   `@mlightcad/libredwg-web` chạy **được trong Node.js** (chính thức, có tài liệu, có test) —
   **không cần đổi package**. Tôi đã chạy thật 2 file DWG của công ty:
   - `Mb bố trí tầng 2_ Phong ngu Master.dwg` (299 KB) → **351 ms**, 497 entity, 25 layer
   - `Xref_MB SA2D.dwg` (3.265 MB) → **1.486 ms**, 285 entity, 17 layer
   → **Server-side NHANH HƠN** bản browser worker hiện tại (~4 s cho file 3.3 MB), không chậm hơn.

2. **Nhưng đường A một mình KHÔNG đủ** — vì bản **Electron desktop vẫn đóng gói nguyên
   `node_modules`** và tự spawn `next start` nội bộ (`electron/main.js:262-270`). Tức là dù route
   parse chạy "server-side", cái server đó **nằm trong máy khách** → vẫn là conveying. Đường A
   phải đi kèm quyết định về Electron (xem §3.4).

3. **Có một lỗi tuân thủ ĐANG TỒN TẠI, độc lập với mọi đường chọn:** package
   `@mlightcad/libredwg-web` **không kèm file LICENSE/COPYING nào** (đã kiểm: `node_modules/@mlightcad/`
   không có file `*LICEN*`/`*COPYING*`). InteriorFlow hiện **phát WASM GPL xuống browser**
   (`public/wasm/libredwg-web.wasm`, 9.0 MB) mà **không kèm text GPL-3, không kèm copyright notice,
   không kèm written offer for source** — GPL-3 §4/§5 yêu cầu những thứ này khi conveying. Đây là
   thiếu sót cụ thể, sửa được ngay, **và nên sửa bất kể chọn đường nào** (nếu còn conveying).

4. **Lập luận "tool nội bộ TTT" trong `docs/LICENSE-NOTES.md` hiện tại đã CHẾT** theo định vị mới
   (IF là sản phẩm global độc lập — xem `CLAUDE.md`, memory `interiorflow-global-product-rule`).
   Bản nháp thay thế ở §7.

5. **Khuyến nghị:** ngắn hạn **A + D** (server-side parse cho web + DXF là đường sạch có sẵn),
   dài hạn **B (ODA Commercial/Sustaining)** khi IF2 cần **GHI/EXPORT DWG** — vì libredwg
   **không ghi được DWG** (§1.3), nên đường A không bao giờ giải quyết được yêu cầu IF2.

---

## 1. HIỆN TRẠNG ĐÃ XÁC MINH

### 1.1 Package và ranh giới code

| Hạng mục | Giá trị |
|---|---|
| Package | `@mlightcad/libredwg-web@0.7.7` |
| License (field `license` trong package.json của package) | `GPL-3.0` — **không phải AGPL** |
| Upstream | GNU LibreDWG (C/C++), biên dịch WASM qua Emscripten |
| File DUY NHẤT import | `lib/cad/dwg-worker.ts:231` (`await import('@mlightcad/libredwg-web')`) |
| Cầu nối không-GPL | `lib/cad/dwg.ts:38` `openDwgFile()` — chỉ `new Worker(...)` + `postMessage` |
| Map JSON → Doc | `lib/cad/dwg-map.ts` (`dwgRawDocToDoc`) — không import package GPL |
| UI gọi | `components/cad/CadEditor.tsx:29` (import), `:229` (`openDwgFile(f)`), handler `onImportDwgFile` ~`:225-239` |
| Kích hoạt gián tiếp | `components/cad/AiBriefPanel.tsx:174` (CustomEvent bấm hộ nút) |
| Binary phát cho browser | `public/wasm/libredwg-web.wasm` — **9.0 MB** |
| Webpack shim | `next.config.mjs:24-29` — `IgnorePlugin(/^node:/)` **chỉ khi `!isServer`** (đã chừa sẵn đường cho route API server!) |

**Ranh giới code đã làm rất tốt.** Vấn đề không phải kiến trúc code — mà là **đường phát hành
binary**.

### 1.2 Vì sao hiện tại LÀ "conveying"

GPL-3 §0 định nghĩa: *to "convey" a work means any kind of propagation that enables other parties
to make or receive copies*. FSF nói rõ về ranh giới server/browser:

> "It is important to note that this only applies to the code running on the server, and not for
> example to the JavaScript programs that your browser may download and run locally — these are
> conveyed to you."
> — FSF Bulletin, *The fundamentals of the AGPLv3*

`public/wasm/libredwg-web.wasm` + bundle worker được **tải xuống browser của user** → user **nhận
một bản copy** → **conveying** → kích hoạt §4/§5/§6 (kèm license text, copyright notice, và cung
cấp *Corresponding Source*, gồm cả script build). Bản Electron cũng conveying (đóng gói binary).

### 1.3 ⛔ libredwg KHÔNG GHI ĐƯỢC DWG — chặn cứng roadmap IF2

Hai bằng chứng độc lập:

1. **Build của chính package này tắt write:** trong `node_modules/@mlightcad/libredwg-web/package.json`,
   script `build:prepare` chạy `emconfigure ../configure ... --disable-write ...`. Tức WASM
   InteriorFlow đang dùng **được biên dịch KHÔNG có write support**, không có cách bật lại từ npm.
2. **Upstream cũng chưa dùng được:** manual GNU LibreDWG 0.13.4 — `--enable-write` là *experimental,
   under construction and highly unstable*; `dwgwrite` *"can only create r1.2–r2000 DWG files"*,
   *"AutoCAD may fail to import it"*, và *"R2010–R2018 writing leads to CRC errors still"*.

**Kết luận:** nếu IF2 cần **xuất DWG cho khách** (chuyện bình thường trong hồ sơ DD), thì **đường A,
C, D, E đều không giải quyết được** — chỉ **B (ODA)** làm được. Đây là yếu tố quyết định lộ trình dài hạn.

### 1.4 Lỗi tuân thủ đang tồn tại (sửa được ngay, chi phí ~0)

| Thiếu | GPL-3 điều | Trạng thái |
|---|---|---|
| Text GPL-3 đầy đủ kèm theo bản phát hành | §4 ("keep intact all notices... give all recipients a copy of this License") | ❌ Không có. Package npm cũng không ship LICENSE. |
| Copyright notice của tác giả (MLight Lee) + upstream LibreDWG/FSF | §4, §5(a) | ❌ Không hiện ở đâu trong app |
| Corresponding Source hoặc written offer | §6 | ❌ Không có |
| Ghi rõ "phần này dưới GPL-3" cho user | §5(a) | ❌ Chỉ có trong `docs/` nội bộ, user không thấy |

→ **Việc nên làm ngay bất kể chọn đường nào** (nếu vẫn còn conveying): thêm trang
"Third-party licenses" trong app + kèm bản GPL-3 + link tarball source của libredwg-web đúng version.

---

## 2. BẢNG SO SÁNH 5 ĐƯỜNG

| | **A · Server-side parse** | **B · ODA Drawings SDK** | **C · ODA File Converter (CLI)** | **D · Chỉ nhận DXF** | **E · Convert cloud bên thứ 3** |
|---|---|---|---|---|---|
| **Chi phí tiền** | **$0** license. Chi phí hạ tầng: CPU parse trên server (1.5 s/file 3.3 MB) | Commercial **$3.000 năm 1 / $2.250 gia hạn** (giới hạn 100 bản redistribution). Web/SaaS cần **Sustaining $7.500 / $4.500** | **$0** nếu non-commercial. **Commercial ⇒ phải là ODA member** ⇒ về giá = B | **$0** | ~**$0,008/phút** (CloudConvert, gói $8/tháng = 1.000 phút). APS: 0,1 token/job "simple" |
| **Pháp lý** | ⚠️ Tốt cho web (không conveying nếu user không nhận copy). GPL-3 **không** có điều khoản network (đó là điểm AGPL vá). ❌ **Không** giải quyết Electron nếu Electron còn đóng gói package | ✅ Sạch nhất. License thương mại, không copyleft. ⚠️ Hết subscription = **mất quyền phân phối kể cả bản đã build** | ❌ **KHÔNG được redistribute** — "all rights reserved", non-member chỉ non-commercial. Chỉ khả thi khi **user tự tải tự cài** | ✅ Sạch tuyệt đối — `lib/cad/dxf.ts` là code của IF, không dep GPL | ⚠️ Sạch về copyleft. ❌ **Rủi ro bảo mật/hợp đồng NDA** là vấn đề lớn hơn pháp lý license |
| **UX** | ✅ Giữ nguyên nút "Mở DWG". ⚠️ **Mất offline** (đang là app Electron desktop!). Cần upload file lên server (hồ sơ khách rời máy) | ✅ Tốt nhất — native, đầy đủ entity, có cả inWEB chạy trong browser | ❌ Kém — user phải tải + cài binary ngoài, app dò đường dẫn, khác nhau Win/Mac | ❌ Kém — kiến trúc sư gửi DWG là mặc định; bắt họ SaveAs DXF từng file | ❌ Chậm (round-trip mạng) + phải giải thích với khách "file của anh đi qua server Đức" |
| **Đọc / Ghi** | Đọc ✅ / **Ghi ❌** (§1.3) | Đọc ✅ / **Ghi ✅** (create from scratch, edit, save any version) | Đọc ✅ / Ghi ✅ (chỉ convert version + DWG↔DXF, không API) | Đọc DXF ✅ / Ghi DXF ✅ (đã có) / DWG ❌ | Đọc ✅ / Ghi ✅ (qua convert) |
| **Web-compat** | ✅ Node route (đã verify chạy) | ⚠️ Drawings SDK = **C++ only** (Win/Linux/macOS/Android/iOS). Web cần **Drawings inWEB SDK** (WASM), thuộc **Sustaining+** | ❌ Binary desktop, không web | ✅ | ✅ |
| **Rủi ro lớn nhất** | Electron desktop + mất offline + không ghi DWG | Tiền + lock-in subscription | Không phân phối được ⇒ UX chết | Mất tính năng khách cần | Upload hồ sơ kiến trúc của khách lên bên thứ 3 |

---

## 3. ĐƯỜNG A — CHI TIẾT + KẾ HOẠCH DI TRÚ

### 3.1 Luận điểm pháp lý (có nguồn)

**Luận điểm:** GPL-3 kích hoạt nghĩa vụ khi **conveying** (phát bản copy). Chạy libredwg trên
server của mình rồi chỉ trả về **dữ liệu** (JSON entity) thì user **không nhận bản copy nào** của
libredwg → không conveying → **không phát sinh nghĩa vụ mở source app**.

Nguồn xác minh (tra ngày 25/07/2026):

1. **GPL-3 §0, định nghĩa:** *"To 'propagate' a work means to do anything with it that requires
   permission under applicable copyright law, **except executing it on a computer**... To 'convey' a
   work means any kind of propagation that **enables other parties to make or receive copies**."*
   → Chạy trên máy mình = execute, **không** phải propagate.
   ([gnu.org/licenses/gpl-3.0](https://www.gnu.org/licenses/gpl-3.0.html))

2. **FSF GPL FAQ — "A company is running a modified version of a GPLed program on a web site. Does
   the GPL say they must release their modified sources?"**
   *"The GPL permits anyone to make a modified version and use it without ever distributing it to
   others."* (FAQ nói tiếp: muốn bịt trường hợp này thì dùng **AGPL**.)
   ([gnu.org/licenses/gpl-faq.html](https://www.gnu.org/licenses/gpl-faq.html))

3. **FSF Bulletin — The fundamentals of the AGPLv3:** *"Using a program over a network is not
   'conveying'."* + xác nhận ranh giới: điều này **chỉ áp dụng cho code chạy trên server**, KHÔNG
   áp dụng cho JavaScript/WASM mà browser tải về — *"these are conveyed to you"*.
   ([fsf.org/bulletin/2021/fall/the-fundamentals-of-the-agplv3](https://www.fsf.org/bulletin/2021/fall/the-fundamentals-of-the-agplv3))

4. **AGPL tồn tại chính vì lỗ này:** GNU AGPL-3 §13 thêm nghĩa vụ "network interaction" — bằng
   chứng rằng **GPL-3 thường KHÔNG có** nghĩa vụ đó.
   ([en.wikipedia.org/wiki/GNU_Affero_General_Public_License](https://en.wikipedia.org/wiki/GNU_Affero_General_Public_License))

5. **FSF GPL FAQ — "Is making and using multiple copies within one organization or company
   'distribution'?"** *"No, in that case the organization is just making the copies for itself."*
   → Đây là điều `LICENSE-NOTES.md` cũ dựa vào; nó **đúng** nhưng **chỉ đúng khi IF thật là tool
   nội bộ**. Với IF global, điều còn dùng được là (2)(3), không phải (5).

**⚠️ Giới hạn của luận điểm này:**
- Nó **không** miễn cho việc phát binary xuống browser (WASM hiện tại) hay đóng gói vào installer.
- Nó **không** miễn nếu ta *modify* libredwg rồi phát bản đã sửa (ta không sửa — chỉ gọi API).
- Có tranh luận trong giới về việc "trả dữ liệu do GPL program sinh ra" có tạo derivative work
  không. Với DWG parse, output là **dữ liệu của user** (toạ độ bản vẽ của chính họ), không phải code
  hay tài sản của libredwg — nhưng **đây chính xác là điểm cần luật sư xác nhận**.

### 3.2 Có cần đổi package? — KHÔNG. Đã verify.

`@mlightcad/libredwg-web` **hỗ trợ Node.js chính thức**:
- README §"Usage with node.js": `LibreDwg.create('./node_modules/@mlightcad/libredwg-web/wasm/')`
- `package.json`: `"engines": { "node": ">=20" }`, `"main": "./dist/libredwg-web.umd.cjs"` (CJS),
  `"exports".require` có sẵn, và có `"test": "node --test test/node-api.test.mjs"`.
- README dòng 3: *"It can be used in browser and Node.js environments."*

**Kết quả chạy thật (Node v20.18.1, macOS, 25/07/2026):**

| File | Size | import | wasm init | dwg_read_data | convertEx | **tổng** | entities | layers |
|---|---|---|---|---|---|---|---|---|
| `Mb bố trí tầng 2_ Phong ngu Master.dwg` | 299 KB | 14 ms | 78 ms | 108 ms | 151 ms | **351 ms** | 497 | 25 |
| `Xref_MB SA2D.dwg` | 3.265 MB | 9 ms | 30 ms | 245 ms | 1.202 ms | **1.486 ms** | 285 | 17 |

→ Số entity/layer **khớp chính xác** với con số đã ghi trong `docs/LICENSE-NOTES.md` (497 entity /
25 layer cho file 305 KB). **Không cần** `libredwg` native/`node-libredwg` — WASM chạy tốt trong Node
và không cần toolchain build C++ trên server.

→ **Timing qua HTTP hoàn toàn chấp nhận được**: parse chỉ 1,5 s cho file 3,3 MB (nhanh hơn bản
browser ~4 s vì Node JIT/heap tốt hơn worker). Cộng upload 3,3 MB (~1–3 s tuỳ mạng) → tổng ~3–5 s,
tương đương hiện tại.

### 3.3 Kế hoạch di trú cụ thể (file:dòng)

**Nguyên tắc: giữ nguyên `DwgRawDoc` làm hợp đồng dữ liệu.** Vì `lib/cad/dwg-map.ts` đã tách khỏi
worker và chỉ nhận JSON thô, việc đổi *transport* (postMessage → HTTP) gần như không đụng vào logic
map. Đây là món quà từ kiến trúc cũ — dùng nó.

#### Bước 1 — Tạo route API mới `app/api/cad/dwg/route.ts` (file MỚI)
Sao khuôn `app/api/pdf/extract/route.ts:6-21` (đã có sẵn pattern multipart + auth):
```
POST /api/cad/dwg    Content-Type: multipart/form-data, field "file"
→ 200 { ok: true, doc: DwgRawDoc }     (JSON, y hệt payload postMessage hiện tại)
→ 400 { error }  thiếu file / sai magic "AC10xx"
→ 401 { error: 'unauthorized' }        getSessionUser() (giống pdf/extract:7-8)
→ 413 { error }  quá giới hạn size
→ 502 { error }  libredwg throw
```
- **Nội dung route** = copy nguyên `parseDwg()` từ `lib/cad/dwg-worker.ts:225-291` + các helper
  `flattenHatchPath` (`:98-112`), `mapEntity` (`:115-184`), `mapAttrib` (`:190-197`),
  `mapEntityMulti` (`:201-212`), `hasDwgMagic` (`:219-223`). **Logic không đổi 1 dòng.**
- **Chỉ đổi 1 dòng:** `lib/cad/dwg-worker.ts:235` `LibreDwg.create('/wasm')` →
  `LibreDwg.create(path.join(process.cwd(), 'node_modules/@mlightcad/libredwg-web/wasm/'))`.
  (⚠️ Trong Electron `cwd = userData` — xem cảnh báo §3.4; trên server thường thì `cwd` = app root.)
- **Bắt buộc** `export const runtime = 'nodejs'` (WASM + `node:fs` không chạy trên Edge runtime).
- Đặt `export const maxDuration = 60` (Vercel serverless mặc định 10 s — 1,5 s parse thì thoải mái,
  nhưng file 20 MB có thể vượt).
- **Đổi types**: chuyển các `export interface DwgRaw*` sang nơi trung lập. Hiện chúng khai báo ở
  `lib/cad/dwg-worker.ts:37-93` **và** khai báo lại độc lập trong `lib/cad/dwg-map.ts` (cố ý, để giữ
  ranh giới). Giữ nguyên cách này — route import type từ `dwg-map.ts`, **không** để `dwg-map.ts`
  import từ route.

#### Bước 2 — Đổi `lib/cad/dwg.ts:38-78` `openDwgFile()`
Bỏ toàn bộ khối `new Worker(...)` (`:40-69`) + `file.arrayBuffer()` (`:71-77`), thay bằng:
```
const fd = new FormData(); fd.append('file', file);
const res = await fetch('/api/cad/dwg', { method: 'POST', body: fd });
const json = await res.json();
if (!res.ok || !json.ok) throw new Error(json.error ?? 'Không đọc được file .dwg');
return { doc: dwgRawDocToDoc(json.doc), skippedEntityCount: ..., totalEntityCount: ... };
```
- **Signature `openDwgFile(file: File): Promise<OpenDwgResult>` GIỮ NGUYÊN** → `CadEditor.tsx:229`
  và `AiBriefPanel.tsx:174` **không phải sửa gì**. Đây là điểm quan trọng nhất của kế hoạch: bề mặt
  thay đổi chỉ **2 file** (`dwg.ts` + route mới) + 1 file xoá.
- Giữ nguyên contract "không bao giờ throw lỗi lạ, message tiếng Việt" (comment `dwg.ts:33-37`) —
  UI `CadEditor.tsx:237-238` hiển thị `err.message` trực tiếp.

#### Bước 3 — Xoá `lib/cad/dwg-worker.ts` + `public/wasm/libredwg-web.wasm`
- Xoá `public/wasm/libredwg-web.wasm` (9,0 MB) → **hết conveying qua web**, và bundle web nhẹ đi 9 MB.
- Xoá `next.config.mjs:24-29` (khối `IgnorePlugin(/^node:/)`) — nó tồn tại **chỉ vì** phải bundle
  package này cho worker browser. Bỏ worker ⇒ bỏ shim. Kiểm `npm run build` sau khi bỏ.
- ⚠️ **Nợ liên đới:** `~/Downloads/dwg2dxf/cli.js` require `lib/cad/dwg-map.ts` — **không ảnh hưởng**
  (nó không dùng worker). Nhưng CLI đó tự import libredwg riêng; nó là repo khác, ngoài phạm vi.

#### Bước 4 — Giới hạn & bảo vệ (mới, chưa có hiện tại)
| Việc | Giá trị đề xuất | Lý do |
|---|---|---|
| Giới hạn size upload | **25 MB** | File 3,3 MB parse 1,5 s; 25 MB ≈ 10 s, còn trong `maxDuration` |
| Kiểm magic trước khi đọc buffer | đã có `hasDwgMagic` — **giữ, chạy TRƯỚC** khi cấp WASM heap | libredwg-web "khoan dung" với file rác (comment `dwg-worker.ts:214-218`) |
| Không ghi file lên đĩa server | parse từ `ArrayBuffer` trong RAM, không `writeFile` | Hồ sơ khách không được lưu lại trên server |
| Rate limit theo user | ví dụ 20 file/phút | WASM `INITIAL_MEMORY=1GB` (xem `build:wasm` script) — DoS dễ |
| Auth | `getSessionUser()` giống `app/api/pdf/extract/route.ts:7` | Không để endpoint parse công khai |
| Log | **KHÔNG log tên file / nội dung** | Hồ sơ kiến trúc của khách |

#### Bước 5 — Ảnh hưởng UX phải nói với user
| Trước | Sau |
|---|---|
| Parse chạy trong browser, **file không rời máy** | File **upload lên server** app |
| **Chạy offline được** (Electron) | **Cần mạng** để mở DWG |
| ~4 s (file 3,3 MB) | ~3–5 s (1,5 s parse + upload) |
| Tải 9 MB WASM lần đầu | Không tải gì |

→ **Điểm đau thật:** IF hiện là app **Electron desktop**. "Mở DWG cần internet" là bước lùi rõ với
kiến trúc sư ngồi công trường. Xem §3.4.

### 3.4 ⛔ RỦI RO CÒN LẠI (a) — Bản Electron desktop

**Vấn đề:** `electron/main.js:262-270` spawn `next start` từ `node_modules/next` **đóng gói trong
app**; `package.json > build.files` có `"node_modules/**/*"` và `"asar": false`. Nghĩa là
`@mlightcad/libredwg-web` (+ 9 MB wasm) **nằm trong file `.exe`/`.dmg` phát cho user** → **conveying
đầy đủ**, y như trước. Server-side parse **không tự động cứu bản desktop**.

Ba lối xử lý, xếp theo mức sạch:

| # | Cách | Sạch GPL? | Offline? | Công |
|---|---|---|---|---|
| **A1** | **Electron gọi API server đám mây** (`NEXT_PUBLIC_DWG_API` trỏ ra ngoài) + **loại package khỏi installer** (`"!node_modules/@mlightcad/**"` trong `build.files`) | ✅ Không conveying | ❌ Mất offline cho DWG (DXF vẫn offline) | Nhỏ |
| **A2** | **Tách plugin user tự cài**: app không kèm gì; nếu user muốn mở DWG, app hướng dẫn tải "InteriorFlow DWG Bridge" (repo GPL-3 riêng, source công khai) và cài. App chỉ gọi qua HTTP localhost/CLI | ✅ Sạch — user tự lấy bản GPL từ nguồn GPL; app chính không phân phối | ✅ Giữ offline | Trung bình–lớn (repo mới, updater, UX cài đặt, Win+Mac) |
| **A3** | **Vẫn kèm trong installer nhưng TUÂN THỦ đầy đủ**: kèm text GPL-3, copyright notice, và **written offer + tarball Corresponding Source** của libredwg-web 0.7.7 | ✅ nếu làm đủ | ✅ | Nhỏ về code, **cần luật sư** vì đây là vùng "cô lập worker có đủ tránh derivative work?" |

**Đánh giá của tôi:** **A1 cho bản web/SaaS + A2 cho bản desktop** là combo bền nhất. A3 nghe rẻ
nhưng nó chính là chỗ tranh chấp "mere aggregation vs derivative work" — không nên đặt sản phẩm
thương mại lên đó mà chưa có luật sư.

**Lưu ý kỹ thuật nếu chọn A3/A1:** trong Electron `cwd = userData` (comment `electron/main.js:17-18`)
nên `process.cwd()` **không** trỏ tới `node_modules` — phải dùng `appRoot` (biến đã có trong
`main.js`) truyền qua env, không dùng `process.cwd()`.

### 3.5 Rủi ro còn lại (b) — WASM build cho browser có chạy Node không?

**Đã trả lời dứt điểm: CÓ, chạy tốt.** (§3.2, có số liệu đo thật.) Không cần đổi package.
Không cần `libredwg` native/`node-libredwg`. Lý do nó chạy: Emscripten glue của package có **nhánh
Node riêng** dùng `node:fs`/`node:path`/`node:url` — chính nhánh đó là thứ `next.config.mjs:24-29`
phải `IgnorePlugin` khi bundle cho browser. Trên server, nhánh đó là nhánh **được dùng**.

---

## 4. ĐƯỜNG B — ODA (giá thật, tra 25/07/2026)

### 4.1 Membership (opendesign.com/oda-membership)

| Tier | Năm đầu | Gia hạn | Được gì |
|---|---|---|---|
| **Commercial** | **$3.000** | **$2.250** | Core Package: 2D CAD (**DWG**, DGN), 3D CAD (STEP/IGES/JT/QIF), BIM (IFC), Visualize + Publish. **Giới hạn 100 bản redistribution** |
| **Sustaining** | **$7.500** | **$4.500** | Core Package**+**: thêm **inWEB tech** (Drawings inWEB SDK, CDE SDK, Visualize inWEB SDK). **Redistribution KHÔNG giới hạn, seat dev KHÔNG giới hạn, cho phép web/SaaS** |
| **Founding** | **$37.500** | **$18.000** | Như Sustaining + **source code access** |

**Extensions** (chỉ Sustaining/Founding): $6.250 (BimRv, BimNw, Mechanical) → $40.000 (Scan-to-BIM).

### 4.2 Những điều PHẢI biết trước khi chọn B

- **Drawings SDK nằm trong Core Package** → **Commercial $3.000/$2.250 là đủ** để đọc+ghi DWG cho
  bản **desktop**. Đây rẻ hơn nhiều so với mức $25k–$50k mà search engine hay trả về — **con số
  $25.000/năm (Standard) và $50.000/năm (Premium) từ 01/01/2026 chỉ áp cho MCAD SDK**, không phải
  Drawings SDK. (Nguồn: blog ODA "MCAD SDK Membership Update", 10/2025 — bài này nói rõ *"addresses
  only MCAD SDK licensing changes"*.) **⚠️ Cần confirm bằng email trực tiếp với ODA** trước khi lấy
  con số này làm cơ sở ngân sách.
- **Web app dùng được không?** Drawings SDK bản thường là **C++ only** (Windows/Linux/macOS/Android/iOS
  — **không** có binding JS/WASM). Muốn chạy trong browser phải dùng **Drawings inWEB SDK** (chuyển
  C++ → WebAssembly, API gần giống desktop SDK, **đọc + ghi + tạo mới DWG trong browser**, deploy được
  trên private cloud/Azure/AWS) — và inWEB **thuộc Sustaining trở lên** ⇒ **$7.500 năm đầu /
  $4.500 gia hạn** là mức thật cho InteriorFlow (vì IF là web app + Electron).
- **Đọc + GHI DWG: CÓ.** Drawings SDK: *"Access 100% of the data in DWG and DGN"*, *"Create new DWG
  or DGN files from scratch"*, edit, *"Save to any supported version"*. → **Đây là đường DUY NHẤT
  phục vụ được yêu cầu GHI DWG của IF2.**
- **Không có royalty per-seat** ở Sustaining/Founding (unlimited redistribution + unlimited dev
  seats). Commercial thì **có trần 100 bản** — với sản phẩm global bán ra, 100 bản là hết rất nhanh.
- **Không thấy chương trình Startup/Small-business** nào công bố trên trang membership. **Nên hỏi
  trực tiếp** — nhiều consortium kiểu này có giá khởi nghiệp không niêm yết.
- **⛔ Lock-in nguy hiểm:** ODA licence theo **annual subscription**, và *"in case of termination of
  the subscription you lose the right to distribute ODA-based products, **even if developed during
  the validity of the license**"*. Nghĩa là ngừng trả $4.500/năm ⇒ **phải rút sản phẩm khỏi thị
  trường**. Đây là nghĩa vụ tài chính vĩnh viễn, phải đưa vào mô hình giá của IF.

---

## 5. ĐƯỜNG C, D, E — đánh giá ngắn

### C · ODA File Converter (binary free standalone)

- **Redistribute: KHÔNG ĐƯỢC.** Free download nhưng license *all-rights-reserved*; **non-member chỉ
  được dùng cho ứng dụng NON-COMMERCIAL**. Dùng thương mại ⇒ phải là ODA member ⇒ chi phí về bằng B
  (mà lại được ít hơn B rất nhiều).
- **Nếu user tự cài** (giống cách `ezdxf` addon `odafc` làm): app dò binary rồi `spawn` CLI.
  - Windows: `C:\Program Files\ODA\ODAFileConverter <ver>\ODAFileConverter.exe`
  - macOS: `/Applications/ODAFileConverter.app/Contents/MacOS/ODAFileConverter`
  - CLI nhận **thư mục** (in-dir out-dir version type recurse audit) → phải tạo temp dir, không nhận
    file lẻ; ⇒ luồng: temp-in → spawn → đọc `.dxf` temp-out → `parseDxf()` → xoá temp.
- **UX**: user phải tự tải + cài + app phải hướng dẫn khi không tìm thấy. **Không chạy được trong
  bản web** (chỉ Electron). Với "sản phẩm global bán ra", bắt user cài binary bên thứ ba là điểm trừ nặng.
- **Kết luận:** chỉ dùng làm **đường phụ tự nguyện** (giống `~/Downloads/dwg2dxf` hiện tại), **không**
  làm đường chính.

### D · Chỉ nhận DXF

- **Chi phí license: $0. Sạch tuyệt đối** — `lib/cad/dxf.ts` là code của IF, `parseDxf` đã dùng ở
  `CadEditor.tsx:209`.
- **Mất gì so với DWG:**
  - DWG là binary native, nén, **full fidelity**; DXF là interchange text-based, *"may lose some
    object-specific data"*.
  - **Custom/proxy objects** (AEC, Civil 3D, MEP, Plant) → thành proxy hoặc mất. Nội thất/kiến trúc
    hay dùng **AEC objects của AutoCAD Architecture** → đây là mất mát thật, không lý thuyết.
  - Xref, một số annotation/dynamic block behavior kém bền qua DXF.
  - DXF **to hơn nhiều** (text) → file 3,3 MB DWG có thể thành 20–40 MB DXF, ảnh hưởng upload/parse.
- **Nhưng lưu ý quan trọng cho IF:** phạm vi entity mà IF hiện map (`dwg-worker.ts:23-30`) chỉ là
  LINE/CIRCLE/ARC/TEXT/MTEXT/LWPOLYLINE/HATCH/INSERT/ATTRIB/DIMENSION — **tất cả đều sống sót qua
  DXF nguyên vẹn**. IF chưa dùng gì mà DXF làm mất. ⇒ **Về mặt dữ liệu IF thật sự cần, D KHÔNG mất
  gì.** Chi phí của D là **100% UX**: user phải SaveAs.
- **Kết luận:** D là **an toàn dự phòng bắt buộc phải giữ**, không phải đường chính. Nó là cái đảm
  bảo IF vẫn hoạt động khi mọi đường DWG bị chặn.

### E · Dịch vụ convert ngoài — ⛔ RỦI RO BẢO MẬT NGHIÊM TRỌNG

**Giá:**
- **CloudConvert**: từ **$8/tháng = 1.000 conversion minutes @ $0,0080/phút**; unlimited file size,
  unlimited concurrent; có volume discount. Hỗ trợ DWG/DXF sẵn.
- **Autodesk Platform Services (Model Derivative)**: **0,1 token/job "simple"** (DWG là simple; chỉ
  Revit/IFC/Navisworks là "complex" 0,5 token). ⚠️ APS đã công bố **tăng giá** Model Derivative +
  Automation API. Ưu điểm: DWG do chính Autodesk parse ⇒ fidelity cao nhất.
- **Zamzar**: tier tương tự, ít minh bạch hơn về data handling.

**Đánh giá bảo mật — đây là lý do tôi khuyên KHÔNG:**

| Rủi ro | Mức | Ghi chú |
|---|---|---|
| **Hồ sơ kiến trúc của khách hàng rời khỏi tay ta sang bên thứ 3** | 🔴 Cao | Mặt bằng, kích thước, tên dự án, tên khách, có khi cả layout an ninh của khách sạn/villa. Đây **không** phải file rác — nó là tài sản của khách. |
| **Vi phạm NDA với khách** | 🔴 Cao | Hợp đồng thiết kế hạng sang gần như luôn có NDA. Gửi bản vẽ qua CloudConvert/Autodesk **mà không có sub-processor clause** là vi phạm hợp đồng — nặng hơn vi phạm license nhiều. |
| **Nghĩa vụ GDPR/PDPD** khi IF bán ra global | 🟠 Trung bình | Phải khai bên thứ 3 là **sub-processor** trong DPA, phải cho khách opt-out. |
| **Metadata trong DWG** | 🟠 Trung bình | DWG mang tên tác giả, đường dẫn máy, lịch sử. Không sanitize được trước khi upload (chưa parse thì chưa biết có gì). |
| Uptime/lock-in | 🟡 Thấp | Có SLA |

CloudConvert có điểm cộng thật (công ty Đức, **GDPR**, **SOC 2**, không bán/mine data khách,
2FA + audit log) — nhưng **rào cản không phải là họ có đáng tin không, mà là ta có QUYỀN gửi file
của khách đi không.** Câu trả lời mặc định: **không, chưa có consent bằng văn bản của khách.**

**Kết luận E:** chỉ chấp nhận được ở dạng **opt-in tường minh từng file**, có dialog cảnh báo rõ
("File này sẽ được gửi tới CloudConvert (Đức) để chuyển đổi"), tắt mặc định, và có DPA. **Không bao
giờ** làm đường mặc định. Nếu bắt buộc phải có convert cloud, **self-host** ODA inWEB trên private
cloud (§4.2) sạch hơn hẳn về mặt hồ sơ khách.

---

## 6. RÀ DEPENDENCY COPYLEFT KHÁC

Đã đọc field `license` trong `node_modules/<pkg>/package.json` của **toàn bộ 34 dep trực tiếp**
(dependencies + devDependencies) của `package.json`:

| License | Số pkg | Nguy hiểm copyleft? |
|---|---|---|
| MIT | 25 | ✅ Không |
| Apache-2.0 | 4 (`@prisma/client`, `prisma`, `sharp`, `typescript`) | ✅ Không |
| BSD-3-Clause | 1 (`bcryptjs`) | ✅ Không |
| ISC | 1 (`lucide-react`) | ✅ Không |
| `(MIT OR GPL-3.0-or-later)` | 1 (**`jszip`**) | ⚠️ Xem dưới |
| **GPL-3.0** | 1 (**`@mlightcad/libredwg-web`**) | 🔴 **CÓ — vấn đề duy nhất** |

**Kết luận: chỉ có MỘT dependency copyleft nguy hiểm.** Không có AGPL, không có SSPL, không có
LGPL-với-static-link nào trong dep trực tiếp.

**Chi tiết cần biết:**
- **`jszip` — dual license `(MIT OR GPL-3.0-or-later)`.** Không phải vấn đề: dual license nghĩa là
  **ta được chọn**, và ta chọn **MIT**. ✅ **Việc cần làm:** ghi rõ trong trang third-party licenses
  của app rằng "jszip — used under the MIT license" để tránh hiểu nhầm khi audit.
- **Việc chưa làm (nợ, ngoài phạm vi đợt này):** chưa quét **transitive** dependencies (~1000 pkg).
  Rủi ro thấp (dep trực tiếp toàn ecosystem MIT lớn) nhưng trước khi phát hành thương mại **nên**
  chạy một lần:
  ```
  npx license-checker-rseidelsohn --summary --production
  npx license-checker-rseidelsohn --production --onlyAllow 'MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;0BSD;CC0-1.0;Unlicense;Python-2.0;BlueOak-1.0.0'
  ```
  và đưa nó vào CI để chặn dep copyleft mới lọt vào sau này.
- **Ghi chú `next`:** MIT nhưng có một số component/font script riêng — không phải copyleft, bỏ qua.
- **`sharp`**: Apache-2.0, nhưng bundle **libvips (LGPL-3)** ở dạng shared library — LGPL + dynamic
  link **không** lây copyleft. ✅ Không phải vấn đề, nhưng nên có trong file attributions.

---

## 7. BẢN NHÁP `docs/LICENSE-NOTES.md` MỚI (chưa áp — chỉ đề xuất)

> ⚠️ Đây là **nội dung đề xuất**. File gốc `docs/LICENSE-NOTES.md` **CHƯA bị sửa** trong đợt research
> này. Áp khi user duyệt.

```markdown
# LICENSE-NOTES — nghĩa vụ giấy phép bên thứ 3 của InteriorFlow

> ⚠️ KHÔNG PHẢI TƯ VẤN PHÁP LÝ. Người viết là engineer. Mục đích: ghi lại dependency nào mang
> nghĩa vụ giấy phép, đã làm gì, và việc gì CẦN luật sư xác nhận TRƯỚC KHI phát hành thương mại.

## 0. Định vị sản phẩm (căn cứ cho mọi phân tích dưới đây)

InteriorFlow là **sản phẩm độc lập, hướng tới thị trường global**, dùng cho **mọi studio nội
thất/kiến trúc** — KHÔNG phải tool nội bộ của một công ty (xem CLAUDE.md, LUẬT NỀN TẢNG).

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
| Kèm bản GPL-3 cho người nhận | §4 | ❌ Chưa |
| Giữ nguyên copyright/license notice | §4, §5(a) | ❌ Chưa hiện cho user |
| Cung cấp Corresponding Source (hoặc written offer) | §6 | ❌ Chưa |
| Ghi rõ phần nào dưới GPL | §5(a) | ❌ Chỉ có trong docs nội bộ |

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

## 4. Kế hoạch xử lý đã chốt

Xem **`docs/RESEARCH-DWG-LICENSE.md`** (nghiên cứu 25/07/2026) — so sánh 5 đường + kế hoạch di trú.

- **Ngắn hạn:** chuyển parse DWG sang **server-side** (route `app/api/cad/dwg`) → user không nhận
  bản copy nào ⇒ không conveying cho bản web. Đã verify libredwg-web chạy tốt trong Node
  (299 KB → 351 ms; 3,3 MB → 1,5 s). Đồng thời **loại package khỏi installer Electron**.
- **Ngắn hạn, chi phí ~0:** thêm trang "Third-party licenses" trong app (GPL-3 text + notices +
  written offer) cho bất kỳ đường nào còn conveying.
- **Dài hạn:** đánh giá **ODA membership** khi IF2 cần GHI DWG (Commercial $3.000/$2.250 cho
  desktop; **Sustaining $7.500/$4.500** nếu cần inWEB cho web). ⚠️ Lock-in: hết subscription là
  mất quyền phân phối kể cả bản đã build.
- **Luôn giữ:** đường **DXF** (`lib/cad/dxf.ts`, `parseDxf`) — sạch giấy phép 100%, và mọi entity
  IF đang dùng đều sống sót qua DXF. Đây là fallback bắt buộc.

## 5. Dependency khác

Đã rà **34 dep trực tiếp**: 25 MIT, 4 Apache-2.0, 1 BSD-3-Clause, 1 ISC,
`jszip` dual `(MIT OR GPL-3.0-or-later)` → **ta chọn MIT** (phải ghi rõ trong attributions).
**Không có** AGPL/SSPL/LGPL-static. `@mlightcad/libredwg-web` là dependency copyleft **duy nhất**.
Nợ: chưa quét transitive — chạy `license-checker-rseidelsohn --onlyAllow ...` và đưa vào CI trước
khi phát hành.

## 6. Giới hạn kỹ thuật của DWG import (không liên quan license)

- Entity map được: LINE, CIRCLE, ARC, TEXT, MTEXT, LWPOLYLINE, HATCH (boundary thẳng),
  INSERT/MINSERT (flatten ở `dwg-map.ts`), ATTRIB, DIMENSION.
- Chưa hỗ trợ: WIPEOUT, POINT, SPLINE, ELLIPSE, HATCH boundary cong → bỏ qua an toàn, đếm vào
  `skippedEntityCount`, hiện ở status bar.
- Đã có kiểm magic-header `AC10xx` trước khi đưa vào WASM (`hasDwgMagic`) — libredwg-web tự nó
  "khoan dung", trả ok với file rác.
- Lineweight từ DWG dùng suy luận chưa xác nhận chính thức — chỉ ảnh hưởng thẩm mỹ.

## 7. ⛔ CỔNG CHẶN trước khi phát hành thương mại

**KHÔNG** phát hành InteriorFlow (bán, SaaS công khai, app store, phân phối cho khách/đối tác)
trước khi:
1. [ ] Luật sư IP/open-source review xong hướng đã chọn.
2. [ ] Trang "Third-party licenses" có đủ GPL-3 text + notices (nếu còn conveying).
3. [ ] Quyết định dứt điểm về bản Electron (loại package / plugin user tự cài / tuân thủ đầy đủ).
4. [ ] Quét transitive license sạch + có gate trong CI.
```

---

## 8. KHUYẾN NGHỊ CÓ LỘ TRÌNH

### Bây giờ (chi phí ~0, không cần luật sư, làm được ngay)
1. **Sửa lỗi tuân thủ đang tồn tại** — trang "Third-party licenses" trong app: GPL-3 full text,
   copyright notice của MLight Lee + GNU LibreDWG/FSF, written offer cho Corresponding Source
   (`@mlightcad/libredwg-web@0.7.7` tarball + wasm build script). Cộng attributions cho jszip (MIT),
   sharp/libvips (LGPL-3 dynamic). **Đây là việc rẻ nhất, giá trị cao nhất, và đúng bất kể chọn đường nào.**
2. **Viết lại `docs/LICENSE-NOTES.md`** theo §7 — bỏ lập luận "internal tool" đã chết.
3. **Thêm license gate vào CI** (`license-checker-rseidelsohn --onlyAllow`) — chặn copyleft mới lọt vào.

### Ngắn hạn (1 sprint) — Đường **A + D**
4. **Di trú parse sang server** theo §3.3 (2 file sửa, 1 route mới, 1 file xoá, 9 MB asset xoá).
   Bề mặt nhỏ vì `openDwgFile()` giữ nguyên signature. Đã verify khả thi + nhanh hơn hiện tại.
5. **Loại `@mlightcad/*` khỏi installer Electron** (`"!node_modules/@mlightcad/**"` trong
   `build.files`) + Electron trỏ vào API server ⇒ hết conveying cả 2 đường. **Đánh đổi phải nói với
   user: mở DWG cần mạng.**
6. **Giữ nguyên đường DXF** làm fallback offline + đường sạch tuyệt đối. Nếu user offline, UI nên
   nói rõ: "Không có mạng — dùng nút Mở DXF, hoặc SaveAs DXF trong AutoCAD."

### Dài hạn — Đường **B** khi IF2 cần GHI DWG
7. **Email ODA hỏi trực tiếp** (đừng dựa vào trang web):
   - Drawings SDK có nằm trong Core Package của tier **Commercial ($3.000/$2.250)** không?
   - **Drawings inWEB SDK** giá thật cho một web app + Electron desktop? Có bắt buộc Sustaining không?
   - Có **chương trình Startup/Small-business** không niêm yết?
   - Điều khoản termination: hết subscription có thật là mất quyền phân phối bản đã build?
   - Có royalty/per-seat/per-deployment nào ẩn không?
8. **Khi có giá thật**, so với doanh thu dự kiến IF. Nếu ODA khả thi → **thay libredwg hoàn toàn**
   (giải quyết một lượt: license sạch, ghi DWG được, fidelity cao hơn, chạy được cả web qua inWEB,
   offline lại được). Nếu không khả thi → IF2 export **DXF thay vì DWG** và nói rõ với khách.

### Không làm
- ❌ **E (convert cloud bên thứ 3) làm đường mặc định** — vi phạm NDA khách nặng hơn vi phạm license.
- ❌ **C (ODA File Converter) làm đường chính** — không redistribute được, non-commercial only.
- ❌ **A3 (vẫn kèm GPL trong installer, "cô lập worker là đủ")** cho bản thương mại — đó chính là
  vùng tranh chấp pháp lý, không nên đặt sản phẩm lên đó mà chưa có luật sư.

---

## 9. NGUỒN (tra 25/07/2026)

**Pháp lý / GPL**
- [GNU GPL v3 (§0 định nghĩa propagate/convey)](https://www.gnu.org/licenses/gpl-3.0.html)
- [FSF — Frequently Asked Questions about the GNU Licenses](https://www.gnu.org/licenses/gpl-faq.html)
- [FSF Bulletin — The fundamentals of the AGPLv3](https://www.fsf.org/bulletin/2021/fall/the-fundamentals-of-the-agplv3)
- [Wikipedia — GNU Affero General Public License](https://en.wikipedia.org/wiki/GNU_Affero_General_Public_License)
- [Vendure — Busting The Myth of GPL](https://vendure.io/blog/busting-the-myth-of-gpl) (phân tích cộng đồng, không phải nguồn chính thức)

**libredwg / thư viện**
- [GNU LibreDWG manual 0.13.4 — Programs (write status)](https://www.gnu.org/software/libredwg/manual/html_node/Programs.html)
- [LibreDWG README (upstream)](https://github.com/LibreDWG/libredwg/blob/master/README)
- [@mlightcad/libredwg-web trên npm](https://www.npmjs.com/package/@mlightcad/libredwg-web)
- [mlightcad/libredwg-web GitHub](https://github.com/mlightcad/libredwg-web)
- [mlightcad — Parsing AutoCAD DWG Files in the Browser without Relying on the Backend](https://medium.com/@mlightcad/parsing-autocad-dwg-files-in-the-browser-without-relying-on-the-backend-9067c5d9abf0)

**ODA**
- [ODA Membership (bảng tier + giá)](https://www.opendesign.com/oda-membership)
- [ODA Pricing](https://www.opendesign.com/pricing) *(trả 406 khi fetch tự động — cần mở tay)*
- [ODA Drawings SDK](https://www.opendesign.com/products/drawings)
- [ODA — Drawings inWEB SDK announcement (10/2024)](https://www.opendesign.com/blog/2024/october/drawings-inweb-sdk-oda)
- [ODA — MCAD SDK Membership Update (10/2025, giá $25k/$50k CHỈ cho MCAD)](https://www.opendesign.com/blog/2025/october/mcad-sdk-membership-update)
- [ODA File Converter (guest files)](https://www.opendesign.com/guestfiles/oda_file_converter)
- [ezdxf — ODA File Converter Support (đường dẫn binary Win/Mac/Linux)](https://ezdxf.readthedocs.io/en/stable/addons/odafc.html)

**DXF vs DWG**
- [Vectorworks 2026 — DXF/DWG and DWF file formats](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/DXFDWG/DXF_DWG_and_DWF_file_formats.htm)
- [CADInterop — CAD Data Interoperability around DXF or DWG](https://www.cadinterop.com/en/formats/neutral-format/dxf-dwg.html)

**Convert cloud**
- [CloudConvert — Security & Compliance](https://cloudconvert.com/security)
- [CloudConvert — DWG to DXF](https://cloudconvert.com/dwg-to-dxf)
- [Autodesk Platform Services — Model Derivative API](https://aps.autodesk.com/en/docs/model-derivative/v2)
- [APS — Forge Pricing Explained #3 (token cost per API)](https://aps.autodesk.com/blog/forge-pricing-explained-3-what-does-each-forge-api-cost)
- [APS — Business Model Evolution (tăng giá Model Derivative)](https://aps.autodesk.com/blog/aps-business-model-evolution)
