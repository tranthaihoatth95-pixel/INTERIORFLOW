# M-PHÁP-LÝ-OUT — phiên CODE, 07/08/2026

> Phạm vi giao: PHẦN A (GPL-3 compliance) + PHẦN B (trung tính thương hiệu), theo brief phiên.
> Luật: N8 (mỗi kết luận 1 dòng `file:dòng`), N6 (chụp màn cho việc 1·4·5), LUẬT SỐ 0 (đo trước
> khi nói) — mọi dòng dưới đây đã `grep`/đọc file thật, KHÔNG suy từ trí nhớ hay từ docs cũ.

## Tóm tắt 1 dòng
PHẦN A (VIỆC 1-3) đã **XONG TỪ TRƯỚC** (phiên khác, có thể 05-06/08) — kiểm lại, xác nhận đúng,
chụp màn thật. PHẦN B: VIỆC 5·6·8·9 cũng đã xong từ trước (không phải phiên này) — `AUDIT-BRAND-
PII.md` (quét 25/07) đã **lỗi thời** ở các mục đó. VIỆC 4 sửa THẬT trong phiên này. VIỆC 7 = liệt
kê, không xoá (đúng chỉ đạo KS4 lùi được).

---

## PHẦN A · Tuân thủ GPL-3

### VIỆC 1 — trang "Third-party licenses" — ✅ ĐÃ CÓ, ĐÃ VERIFY
- `app/settings/licenses/page.tsx:1-171` — trang đầy đủ 4 khối: phạm vi GPL · written offer ·
  license khác · toàn văn GPL-3.
- `lib/legal/third-party-licenses.ts:8-11` — `GPL_SCOPE_FILES` chỉ đúng 2 mục
  (`lib/cad/dwg-worker.ts`, `public/wasm/libredwg-web.wasm`).
- `lib/legal/third-party-licenses.ts:13-17` — `GPL_COPYRIGHT_NOTICE` ghi rõ MLight Lee + GNU
  LibreDWG/FSF.
- `lib/legal/gpl-3-0-text.ts:1-13,17` — toàn văn GPL-3, header tự khai "tải 06/08/2026, curl trực
  tiếp, KHÔNG qua model tóm tắt" (689 dòng, đã đếm `wc -l`).
- `lib/legal/third-party-licenses.ts:42-71` — `OTHER_LICENSES`: jszip (MIT, chọn nhánh) · sharp/
  libvips (LGPL-3, dynamic link) · Be Vietnam Pro (OFL 1.1).
- Vào được từ `app/settings/about/page.tsx:61,81` ("Giấy phép bên thứ ba" → `/settings/licenses`)
  VÀ từ Cài đặt → Nâng cao (xác nhận bằng `get_page_text` route `/settings`: mục "Giấy phép bên
  thứ ba … Xem giấy phép" có mặt).
- **CHỤP MÀN THẬT** (127.0.0.1:3007, server riêng phiên này `interiorflow-phaply` port 3007):
  route `/settings/licenses` render đủ 4 khối, cả bảng `GPL_SCOPE_FILES`, written-offer + banner
  cảnh báo đỏ, 3 license khác, và pre-block toàn văn GPL-3 cuộn được.

### VIỆC 2 — Corresponding Source / written offer — ✅ ĐÃ CHỌN đường (b)
- `lib/legal/third-party-licenses.ts:19-39` — `GPL_WRITTEN_OFFER` (đường b, written offer, đúng
  §6(b) GPL-3) — `textVi`/`textEn` cam kết cung cấp Corresponding Source ≥3 năm.
- `app/settings/licenses/page.tsx:113-126` — render offer + banner đỏ khi `contactPlaceholder`
  chưa điền.
- 🟡 **CHƯA ĐỦ HIỆU LỰC PHÁP LÝ**: `lib/legal/third-party-licenses.ts:29`
  `contactPlaceholder: '[KÊNH LIÊN HỆ CHƯA CHỐT — điền trước khi phát hành thương mại]'` — chưa có
  kênh liên hệ thật. Đây là việc CẦN **Hoà chốt** (chưa có domain/email hỗ trợ công khai nào tồn
  tại trong repo, đã grep xác nhận trước đó) — không phải lỗi code, code đã tự cảnh báo đúng.

### VIỆC 3 — ranh giới code — ✅ SẠCH, không có chỗ thứ hai import GPL
`grep -rn "libredwg" lib components app` → chỉ có **1 file thật sự `import`**:
`lib/cad/dwg-worker.ts:277` (`await import('@mlightcad/libredwg-web')`), dùng ở
`lib/cad/dwg-worker.ts:281,286,296`. Mọi chỗ khác khớp từ khoá chỉ là COMMENT giải thích ranh
giới, KHÔNG import: `lib/three/csg.ts:4` · `lib/cad/dwg-map.ts:3,235,360,370` ·
`lib/cad/dwg.ts:4,38` · `lib/legal/third-party-licenses.ts:10-11,16` ·
`lib/legal/gpl-3-0-text.ts:7,9` · `components/cad/CadEditor.tsx:498`. Không có vi phạm.

---

## PHẦN B · Trung tính thương hiệu

### VIỆC 4 — tên khách trong `lib/filemanager/mock-data.ts` — ✅ SỬA TRONG PHIÊN NÀY
Trước: `lib/filemanager/mock-data.ts:48,50,56` (`id: 'proj-detech'`, `name: '2026-06 Detech
Complex'`, `id: 'detech-input'`) + `:214-216` (`id: 'f-detech-input-1'`, `folderId:
'detech-input'`, `name: 'Detech-brief-khach.pdf'`).
Sau: đổi sang `proj-riverside` / `'2026-06 Riverside Office'` / `riverside-input` /
`f-riverside-input-1` / `'brief-khach.pdf'`. `grep -n "detech\|Detech" lib/filemanager/mock-
data.ts` sau sửa = **0 kết quả**. `grep -rn "proj-detech\|detech-input\|f-detech" lib components
app` = **0 kết quả** (không còn chỗ nào tham chiếu id cũ).
🟡 **CHƯA CHỤP MÀN được**: `grep -rln "FM_FOLDERS\|FM_FILES" app components lib | grep -v mock-
data` → chỉ có `app/settings/_components/StorageCard.tsx:10` import, và dòng
`app/settings/_components/StorageCard.tsx:129` chỉ dùng `FM_FILES.length` (đếm SỐ, không render
tên). Hiện KHÔNG có route/màn nào trong app thật vẽ ra tên file/folder từ file này — không có gì
để chụp. Xác nhận bằng đọc source + grep, không phải bằng mắt trên UI (đúng N5: ghi rõ thay vì
giả vờ).
`npx tsc --noEmit -p .` sau sửa: **0 lỗi mới** (lỗi duy nhất còn lại `lib/cad/render-layer-index.
test.ts:36` — pre-existing, ngoài phạm vi VIỆC 4, không liên quan `mock-data.ts`).

### VIỆC 5 — `content-deck.ts:113` hardcode `'DETECH · CONCEPT'` — ✅ ĐÃ XONG TỪ TRƯỚC (không phải phiên này)
`grep -n "DETECH\|CONCEPT" lib/present-editor/content-deck.ts` = **0 kết quả**.
`lib/present-editor/content-deck.ts:110-118` — `slidesFromContent(text, images, palette, fonts,
coverKicker = '')`: `coverKicker` là THAM SỐ (mặc định rỗng), lấy từ Brand Kit/tên dự án của
caller — đúng yêu cầu VIỆC 5 (đọc Brand Kit dự án đang mở, không hardcode tên khách nào).

### VIỆC 6 — package.json / installer / cert — ✅ ĐÃ XONG TỪ TRƯỚC
`grep -ni "ttt" package.json installers/*` = **0 kết quả**.
- `package.json:6` `"author": "InteriorFlow"` · `package.json:76` `"copyright": "InteriorFlow"` ·
  `package.json:74` `"appId": "com.interiorflow.app"`.
- `package.json:54` `licenseNotes` đã viết lại bằng tiếng Anh, đúng định vị global, tự ghi rõ
  "UNRESOLVED: … MUST be re-licensed, replaced, or fully isolated … BEFORE any external
  distribution" — không còn lập luận "internal tool".
- `installers/windows-electron-builder.json:19,32` `certificateSubjectName` đã đổi thành
  `${env.CSC_SUBJECT_NAME}` (biến môi trường), không hardcode "TTT Architects" nữa; dòng `:36`
  ghi chú hướng EV cert HSM cloud.
- `installers/android-bubblewrap.md:27,70,97` `package_name`/Application ID =
  `com.interiorflow.app`.
- `installers/windows/HUONG-DAN-CAI.md` — `grep -n "TTT\|PC-TTTA"` = **0 kết quả** (hostname máy
  nội bộ + câu "nội bộ TTT" trong `AUDIT-BRAND-PII.md` đã bị xoá).

### VIỆC 7 — 53 ảnh render khách — LIỆT KÊ, KHÔNG XOÁ (theo chỉ đạo, chờ Hoà duyệt)
Đếm lại thực tế trên đĩa (khác con số "53" trong ticket cũ — số đó đã lỗi thời):

| Thư mục | Số file | Đang được import bởi (route/lib sống) |
|---|---|---|
| `public/detech/` | **18** (`ls public/detech \| wc -l`) — `apt-1..4.png`, `enso-circle.png`, `enso-garden.png`, `iki-banner.*`, `lobby-water.png`, `lounge-green.png`, `mat-moodboard.*`, `mat-palette.png`, `mat-travertine.*`, `mat-walnut.*`, `meditation.jpg`, `pool-zen.png`, `tower-dusk.png`, `tower-night.*`, `wellness.png` | `lib/present-editor/demo-enso-sample.ts` · `lib/demos/present.ts` · `components/intro/TitleSequence.tsx` |
| `public/covers/` | **5** (`ls public/covers \| wc -l`) — `render_00.jpeg`, `render_03.jpeg`, `render_04.jpeg`, `render_05.jpeg`, `render_10.jpeg` | `lib/present-demo.ts` · `lib/present-editor/sample.ts` · `components/ProjectSelect.tsx` · `components/StageSelect.tsx` · `components/entry/cardFaces.tsx` · `components/nodes/InteriorNode.tsx` |
| `public/wallpapers/ttt-*.jpg` | **0** — thư mục `public/wallpapers/` **KHÔNG CÒN TỒN TẠI** trên đĩa (`ls` → "No such file or directory") | chỉ còn 1 dòng comment CHẾT nhắc tới nó: `components/entry/LoginBackdrop.tsx:8` |

**Tổng ảnh còn thật sự tồn tại + đang được import: 23 file** (18+5), không phải 53 — mục
wallpapers trong `AUDIT-BRAND-PII.md`/ticket cũ đã lỗi thời, dọn dẹp trước đó đã xoá hết.
⚠️ **Rủi ro cao nhất còn lại**: `public/covers/` được `components/ProjectSelect.tsx` dùng — đây
là MÀN SỐNG (chọn dự án sau đăng nhập), ảnh là render Detech thật theo ghi chú cũ
(`lib/present-demo.ts` — bản trước 07/08 đã đổi brand chữ sang "Atelier Nord" ở VIỆC 5/9, nhưng
BẢN THÂN 5 file ảnh JPEG trong `public/covers/` **chưa bị thay** — chỉ chữ đổi, ảnh vẫn là ảnh
cũ). **CHƯA XOÁ theo đúng chỉ đạo KS4** — chờ Hoà duyệt trước khi xoá/thay ảnh.

### VIỆC 8 — mật khẩu test trong comment — ✅ ĐÃ XONG TỪ TRƯỚC
`components/IntroSequence.tsx:21` hiện tại: *"Tài khoản test: dùng tài khoản seed của máy dev
(xem scripts/seed-admin.ts) — KHÔNG ghi thông tin đăng nhập vào code."* — không còn email/mật
khẩu thật nào trong comment. `grep -n "mật khẩu\|password"` trong file không ra credential cụ thể.

### VIỆC 9 — 3 route mẫu công khai — ✅ ĐÃ XONG TỪ TRƯỚC
- `app/demo-amanoi/` — **KHÔNG TỒN TẠI** (`ls` → "No such file or directory").
- `"IKI Village"` — `grep -rn "IKI Village" lib app` = **0 kết quả**.
- `app/present/page.tsx:1-24` — route `/present` còn tồn tại nhưng đã dùng deck HƯ CẤU: comment
  tự khai `:14-17` *"route SHOWCASE demo (deck mẫu Atelier Nord, nội dung hư cấu), TÁCH khỏi app
  thật"*. `lib/present-demo.ts:65-66` `brand: 'ATELIER NORD · NỘI THẤT'`,
  `project: 'Nord Residence — Không gian trưng bày'` — không còn tên khách thật trong chữ.
  (Ảnh nền của route này vẫn dùng `public/covers/*` — xem cảnh báo ở VIỆC 7.)

---

## Ghi chú cho phiên sau

1. **`docs/AUDIT-BRAND-PII.md` (quét 25/07/2026) đã LỖI THỜI đáng kể** — các mục đỏ về
   `content-deck.ts`, `package.json`, `installers/*`, `/demo-amanoi`, `AMANOI`, mật khẩu
   `IntroSequence.tsx` đã được sửa bởi (các) phiên sau 25/07, KHÔNG cần làm lại. File đó KHÔNG
   nằm trong phạm vi sở hữu phiên này (không sửa), nhưng phiên sau nên biết trước khi tin nó.
2. **Việc thật còn lại cho luật sư/Hoà, không phải code**: điền kênh liên hệ thật vào
   `GPL_WRITTEN_OFFER.contactPlaceholder` (VIỆC 2) · quyết định đường A+D (di trú DWG parse sang
   server, xem `docs/LICENSE-NOTES.md §4`) · duyệt xoá/thay `public/covers/*` (VIỆC 7).
3. Không đụng `lib/cad` · `components/cad` · `lib/three` · `components/three` · `lib/boq` ·
   `lib/ffe` · `lib/materials` · `components/library` · `prisma` — đúng CẤM của brief.
