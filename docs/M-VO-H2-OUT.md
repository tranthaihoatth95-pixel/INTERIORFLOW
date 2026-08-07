# M-VO-H2-OUT — 07/08

Vùng sở hữu: `components/studio/` · `components/notebook/` · `components/photo-editor/` ·
`lib/commands/`. Không đụng `components/nodes/`, `components/present-editor/`.
V6 — **CHƯA COMMIT**, chờ Hoà duyệt.

File thật sự đổi trong phiên này (đối chiếu `git status`, N2):
```
M components/notebook/useNotebook.ts
M components/photo-editor/PhotoEditor.tsx
M components/photo-editor/useDoc.ts
M lib/cad/render-layer-index.test.ts   ← G-VS-02, ngoài 4 vùng sở hữu nhưng brief chỉ đích danh
+ components/notebook/useNotebook.test.ts   (mới)
+ components/photo-editor/PhotoEditor.test.ts (mới)
+ components/photo-editor/useDoc.test.ts     (mới)
```
⚠️ **Trùng file — DỪNG, không đụng** (đúng chỉ dẫn "components/studio dùng CHUNG với phiên
nhãn&màu"): `git status` cho thấy `components/studio/AppChrome.tsx` · `StageSwitcher.tsx` ·
`StatusBar.tsx` đang dirty, `HomeButton.tsx` bị xoá, `ProjectScopeEmptyState.tsx` mới — **KHÔNG
PHẢI do phiên này**, đều liên quan nhãn/chặng (đúng cảnh báo). Không mở, không đọc kỹ, không sửa.

---

## G-M20-08 (`docs/GAP-IF.md:132`) — `PhotoEditor.tsx` mask commit không try/catch — ✅ ĐÃ SỬA

Đo lại trước khi sửa (§0ab): đúng như GAP mô tả — hàm `onInvertMask` (dòng ~272-292, GAP ghi
`:279-291` là đúng phần thân IIFE async bên trong) không có try/catch/finally, không khoá nút,
lệch hẳn khuôn `onExport`/`onWriteBackClick` liền kề CÙNG FILE (dòng 303-334, có
`setBusy`/`try/catch/finally`/`alert` lỗi).

Sửa: bọc IIFE trong try/catch/finally, `setBusy('mask')` trước khi chạy, `alert` báo lỗi nếu
`loadImage`/`getContext('2d')` ném lỗi (ảnh mask hỏng, canvas không có context trên trình duyệt
lạ). Không đổi hành vi đường thành công.

**Test mới** `components/photo-editor/PhotoEditor.test.ts` — quét SOURCE THẬT (không có
jsdom/@testing-library trong repo, đúng khuôn `StoreHydrator.test.ts`): xác nhận thân hàm có
`try`/`catch`/`finally`/`setBusy`/`alert`. **Đối chứng (có răng)**: chép nguyên văn thân hàm CŨ
(trước sửa) vào test, xác nhận bộ quét BẮT ĐƯỢC nó thiếu try/setBusy — chứng minh test không
phải luôn xanh.

Verify: `sucrase-node components/photo-editor/PhotoEditor.test.ts` → **9 ok, 0 fail**.
🟡 **CHƯA verify bằng mắt trên trình duyệt** — xem mục "Blocker §0aa" cuối file.

## G-M20-09 (`docs/GAP-IF.md:133`) — `useNotebook.ts` thiếu `res.ok` — ✅ ĐÃ SỬA 3/3 chỗ còn lại

Đo lại trước khi sửa: `grep -c "res.ok" components/notebook/useNotebook.ts` (trước sửa) = 1
(đúng note cũ "mới vá 1 phần"), 3 chỗ còn thiếu = `uploadFile` (form-data upload) ·
`addTextOrUrl` (thêm nguồn text/URL) · `ask` (hỏi Notebook — đây là chỗ NẶNG NHẤT, sinh đúng bug
mô tả "lỗi HTTP hiện thành câu trả lời RỖNG": `data?.answer ?? ''`).

Sửa: thêm `if (!res.ok) throw new Error(httpErrorMessage(res.status, <ngữ cảnh>))` ngay sau mỗi
`fetch(...)`, TRƯỚC `res.json()` — cả 3 chỗ đều đã có catch bọc sẵn (uploadFile → status:'error';
addTextOrUrl → fallback mock; ask → hiện "Lỗi: …" thay vì rỗng), nên lỗi giờ CHẢY ĐÚNG đường xử
lý sẵn có, không cần dựng nhánh lỗi mới. Tách hàm thuần `httpErrorMessage(status, context)` để
test được không cần dựng `Response` giả.

**Test mới** `components/notebook/useNotebook.test.ts`: ① `httpErrorMessage` — chữ lỗi có mã +
ngữ cảnh, không rỗng, đổi ngữ cảnh ra chữ khác. ② bất biến cấu trúc — quét TOÀN FILE, xác nhận
**cả 4 chỗ gọi JSON đọc thân response** (kể cả `probe()` vốn đã đúng từ trước, dùng kiểu
`if (res.ok) {...}` chứ không phải `if (!res.ok)`) đều được canh trước khi đọc. **Đối chứng (có
răng)**: đưa 1 snippet giả thiếu `res.ok`, xác nhận hàm quét bắt được `unguarded===1`; thêm
`res.ok` vào rồi quét lại ra sạch.

Verify: `sucrase-node components/notebook/useNotebook.test.ts` → **8 ok, 0 fail**.
🟡 **CHƯA verify bằng mắt trên trình duyệt** — xem mục "Blocker §0aa" cuối file.

## G-M20-12 (`docs/GAP-IF.md:136`) — `findByAlias`/VCB viết xong, chưa nối UI — 🔴 CÒN TREO, GHI RÕ LÝ DO

Đo lại: `findByAlias` (`lib/commands/registry.ts:362`) và `parseVcbToken`/`applyVcbToMoveCopy`
(`lib/commands/vcb.ts:42,92`) **đúng như GAP mô tả** — có test (`registry.test.ts`/`vcb.test.ts`)
nhưng 0 nơi gọi ngoài file test:
```
grep -rn "findByAlias\|parseVcbToken\|applyVcbToMoveCopy" --include=*.ts --include=*.tsx . \
  | grep -v node_modules | grep -v .test.ts
→ chỉ ra 2 dòng định nghĩa trong lib/commands/, KHÔNG có nơi gọi
```
Đích nối dây (theo TODO tự thú `registry.ts:389-393`): **`components/cad/CadEditor.tsx`'s
`run()`** — thay map object tự giữ bằng gọi thẳng `findByAlias()`/`.run()`.

**KHÔNG LÀM** — `components/cad/CadEditor.tsx` **ngoài 4 vùng sở hữu** của phiếu này
(`components/studio/`·`components/notebook/`·`components/photo-editor/`·`lib/commands/`), và
brief đầu phiên trước (`M-UI-CAD-OUT.md`, cùng ngày) đã ghi rõ `components/cad/` đang có phiên
khác giữ ("p9 đang giữ lib/cad"). Đây KHÔNG phải "để lửng" — là quyết định có lý do: sửa
`lib/commands/` xong không tự nối được sang UI vì đích nối nằm ngoài quyền. Không tự đoán thêm.
→ Cần ticket riêng giao đúng chủ `components/cad/CadEditor.tsx` để nối dây, hoặc mở rộng phạm vi
phiếu này nếu Hoà muốn 1 phiên làm trọn.

## G-M13-03 (`docs/GAP-IF.md:103`) — `components/print/` chưa mount — ✅ **ĐÃ CÓ NGƯỜI LÀM, SỔ CŨ**

Đo lại TRƯỚC KHI làm gì (đúng luật §0ab "SỔ GAP LÀ ẢNH CHỤP") — brief dặn hỏi TỔNG trước vì phiên
BOQ cũng được giao mục này. Grep thực tế:
```
components/print/ExportPdfDialog.tsx:35  import LineweightTable from './LineweightTable'  (dùng dòng 303)
components/print/ExportPdfDialog.tsx:34  import PaperSheetFrame from './PaperSheetFrame'   (dùng dòng 256)
components/print/ExportPdfDialog.tsx:36  import RadialToolMenu from './RadialToolMenu'     (dùng dòng 290)
components/present-editor/Toolbar.tsx:259   <ExportPdfDialog .../>
components/cad/CadSheets.tsx:913            <ExportPdfDialog .../>
components/cad/CadSheets.tsx:936            comment "VIỆC 4 (07/08, G-M13-03)"
```
Cả 4 component `components/print/` đã được `ExportPdfDialog.tsx` MOUNT (không còn mồ côi), và
`ExportPdfDialog` chính nó mount ở 2 nơi thật (`present-editor/Toolbar.tsx`, `cad/CadSheets.tsx`
— cả hai ngoài vùng sở hữu phiếu này, không đụng). Comment tại `CadSheets.tsx:936` tự dẫn
`G-M13-03`, xác nhận đây LÀ việc vừa làm HÔM NAY bởi 1 phiên khác (khớp cảnh báo "phiên BOQ cũng
được giao mục này").

**Không cần hỏi TỔNG nữa vì việc đã xong** — sổ `GAP-IF.md:103` đang lệch hiện trạng (§0ab),
đúng dòng đầu file "chỉ TỔNG được ghi lại" nên phiên này KHÔNG tự sửa `GAP-IF.md`, chỉ báo ở đây
để TỔNG cập nhật dòng 103 → ✅.

## G-M12-01 (`docs/GAP-IF.md:100`) — `components/` 0% test — ✅ +3 file test trong vùng sở hữu

Đo lại trước khi chọn: trong 4 vùng sở hữu, `lib/commands/` ĐÃ có test (`registry.test.ts` 257
dòng, `vcb.test.ts` 54 dòng) — không phải 0%. `components/studio/` chỉ `checkpoint-core.ts` có
test (`checkpoint-core.test.ts`), phần còn lại (AppChrome/StatusBar/StageSwitcher/LockScreen…) 0
test NHƯNG đa số đang dirty do phiên nhãn&màu — tránh động. `components/notebook/` VÀ
`components/photo-editor/` = **0 test, 0 ngoại lệ** trước phiên này.

Chọn 3 (rủi ro cao nhất, có lý do — không đòi phủ hết):

| # | File | Vì sao chọn ("đường" nào) |
|---|---|---|
| 1 | `components/photo-editor/useDoc.ts` (`reducer`) | **đường mất dữ liệu** — lõi undo/redo của trình chỉnh ảnh; bug ở đây KHÔNG ném lỗi, chỉ âm thầm làm mất/lặp thao tác. Export `reducer` (chỉ để test, hành vi không đổi) |
| 2 | `components/notebook/useNotebook.ts` | **đường mất dữ liệu/câu trả lời** — đúng cặp với G-M20-09 vừa sửa; lỗi HTTP không canh biến thành câu trả lời AI rỗng hoặc nguồn "processing" mãi |
| 3 | `components/photo-editor/PhotoEditor.tsx` (`onInvertMask`) | **đường mất dữ liệu thao tác** — đúng cặp với G-M20-08 vừa sửa; canvas/ảnh async không try/catch = lỗi im lặng, nút không tự khoá |

Không có "đường tiền" trong 4 vùng sở hữu (đã grep `price\|payment\|checkout\|Stripe` trong cả 4
thư mục = 0 kết quả) nên không ép chọn.

Cả 3 file test đều **CÓ ĐỐI CHỨNG** (mục riêng "đối chứng" trong mỗi file) — chứng minh bằng cách
chạy 1 phiên bản SAI (reducer thiếu `.slice`, snippet thiếu `res.ok`, thân hàm CŨ thiếu
try/catch) và xác nhận bộ test/bộ quét bắt được nó, không phải test tự khớp bừa.

Kết quả chạy riêng từng file:
```
useDoc.test.ts        → 18 ok, 0 fail
useNotebook.test.ts   →  8 ok, 0 fail
PhotoEditor.test.ts   →  9 ok, 0 fail
```
`npm test` (toàn repo, sau khi thêm 3 file) → **0 FAIL thật** (1 dòng chứa chữ "FAIL" trong log
là NHÃN của 1 test khác đang xác nhận đúng hành vi "chưa miễn trừ phải FAIL", không phải lỗi).

## G-VS-02 — `lib/cad/render-layer-index.test.ts:36` lỗi tsc DUY NHẤT toàn repo — ✅ ĐÃ SỬA

Rẻ đúng như brief nói: `{scale, tx, ty} as Viewport` ép sai — `interface Viewport`
(`lib/cad/model.ts:1173-1177`) khai `panX`/`panY`, không phải `tx`/`ty`. Sửa 1 dòng:
```
- const V: Viewport = { scale: 0.05, tx: 0, ty: 0 } as Viewport;
+ const V: Viewport = { scale: 0.05, panX: 0, panY: 0 };
```
Bỏ luôn `as Viewport` ép kiểu — nay đúng type tự nhiên, không cần ép.

Verify: `sucrase-node lib/cad/render-layer-index.test.ts` → **8 ok, 0 fail** (không đổi hành vi
test, chỉ sửa object giả cho khớp type thật). `npx tsc --noEmit -p .` → **exit 0, 0 lỗi** (đã
chạy lại SAU KHI thêm 3 file test mới ở trên — ban đầu thêm test có 1 lỗi type ở
`useDoc.test.ts:102`, đã sửa cùng lượt, xem diff file đó).

File ngoài 4 vùng sở hữu nhưng brief chỉ đích danh dòng/lỗi cụ thể — sửa ĐÚNG 1 dòng theo đúng
yêu cầu, không lan sang chỗ khác trong `lib/cad/`.

---

## 🟡 Blocker verify trình duyệt — §0aa `.next` cache chung, KHÔNG phải lỗi của phiên này

Mở `127.0.0.1:3001` (server riêng phiên này, `interiorflow-verify`) → trang trắng
`"missing required error components, refreshing..."`, log server:
```
GET / 500  Error: ENOENT ... .next/server/middleware-manifest.json
```
Đúng triệu chứng `docs/00-BAT-DAU-DOC-DAY.md §0aa` ("nhiều server chung 1 `.next`, ghi đè
manifest của nhau") — lúc đó có ít nhất 2 server khác đang chạy cùng thư mục (cổng 3000, 3002).
Log trước đó còn có lỗi cú pháp thoáng qua ở `components/library/library-sheet-css.ts` (KHÔNG
thuộc vùng sở hữu, không đụng) — kiểm bằng `sucrase.transform()` trực tiếp thì file NÀY PARSE
SẠCH ngay lúc đo → xác nhận đó là ảnh chụp một khoảnh khắc phiên khác đang gõ dở, không phải lỗi
thật còn tồn tại trên đĩa.

Theo đúng §0aa mục 3, cách gỡ là `rm -rf .next` rồi mở lại ĐÚNG 1 server — nhưng `.next` dùng
CHUNG cho mọi cổng trong thư mục này, xoá lúc đang có phiên khác chạy sẽ làm gãy server của họ.
**KHÔNG tự ý xoá** — đây là hành động ảnh hưởng phiên khác, ngoài phạm vi quyết định một mình.

⇒ Đã dừng server riêng của phiên này (`preview_stop`), KHÔNG đụng `.next`. Verify thay bằng:
`npx tsc --noEmit -p .` (0 lỗi) + `npm test` (0 fail thật) + `sucrase.transform()` xác nhận từng
file nguồn còn đụng tới parse sạch. **CHƯA VERIFY bằng mắt trên trình duyệt** cho cả 2 chỗ UI đổi
(nút "Đảo mask" khoá được lúc chạy; thông báo lỗi Notebook hiện đúng chữ) — khai đúng theo N5,
không giả vờ đã xem.

---

## Tổng kết

| Việc | Trạng thái |
|---|---|
| G-M20-08 (mask commit try/catch) | ✅ đã sửa + test có răng — 🟡 chưa verify mắt (blocker §0aa) |
| G-M20-09 (res.ok Notebook, 3/3 chỗ còn lại) | ✅ đã sửa + test có răng — 🟡 chưa verify mắt (blocker §0aa) |
| G-M20-12 (findByAlias/VCB nối UI) | 🔴 còn treo — đích nối ngoài quyền (`components/cad/CadEditor.tsx`), đã ghi rõ lý do + đích cần ticket riêng |
| G-M13-03 (components/print mount) | ✅ đã xong từ TRƯỚC (phiên khác, hôm nay) — sổ GAP-IF.md:103 lệch, báo TỔNG cập nhật |
| G-M12-01 (3 test rủi ro cao nhất) | ✅ xong — 3 file test mới, đủ đối chứng, 35 ca pass |
| G-VS-02 (tsc lỗi duy nhất) | ✅ đã sửa — `npx tsc --noEmit -p .` exit 0 |

`npm test` cuối phiên: 0 fail thật. `npx tsc --noEmit -p .`: **0 lỗi** (đã đo LẠI sau tất cả sửa
đổi trên, không chỉ đo 1 lần đầu).
