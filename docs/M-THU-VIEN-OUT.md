# M-THU-VIEN-OUT — phiên Thư viện · `.idfc` (07/08)

> Sở hữu: `lib/library/` · `components/library/` · `components/LibraryPanel.tsx` ·
> `components/NodeLibraryPanel.tsx` · `components/cad-library/` · `lib/materials/` ·
> `components/materials/` · `lib/cad/library-item-resolve.ts` · `lib/cad/block-library.ts` ·
> `public/cad-library/` · `lib/refingest.ts` · `lib/ref-search.ts`.
> **CHƯA COMMIT** (luật V6 — Hoà commit). Thứ tự làm theo đúng phiếu: 1→2→3→(7b chen ngang giữa
> phiên, Hoà giao trực tiếp)→10. VIỆC 4·5·6·7·8·9 CHƯA làm — ghi rõ ở cuối, không tô hồng.

## VIỆC 1 — khảo sát 5 nơi "thư viện" (N8: file:dòng cho mỗi kết luận)

| Nơi | Sống/chết | Bằng chứng |
|---|---|---|
| `lib/library/` (866 dòng, 6 file) | **SỐNG** — nguồn dữ liệu chính | dùng bởi `components/library/*`, `components/render-studio/*`, `components/studio/App*` — `grep -rln "lib/library" components app lib` = 18 file |
| `components/library/LibrarySheet.tsx` (+ 9 file khác, 1.638 dòng) | **SỐNG** — MỘT cửa duy nhất, đã mount thật | `components/studio/AppShell.tsx:32,164` mount trực tiếp `<LibrarySheet stage={libStage}/>`; mở qua `openLibrarySheet()` từ `AppChrome.tsx:159`, `AppCommandPalette.tsx:135`, `AppLogoMenu.tsx:78`, `Object3DInspector.tsx:85`, `Command3DPanel.tsx:320` |
| `components/LibraryPanel.tsx` | **SỐNG** — panel riêng, khác mục đích (Ref nội thất/ngoại thất/Style dàn trang/Vật liệu-Texture, không phải kệ chèn khối) | mount tại `components/home/HomeScreen.tsx:105` `<LibraryPanel />`; hằng `ASSET_MIME` dùng ở `components/FlowCanvas.tsx:29` |
| `components/NodeLibraryPanel.tsx` | **SỐNG** — thư viện NODE (khác đối tượng với LibrarySheet: node xử lý ảnh, không phải khối/cấu kiện) | mount tại `HomeScreen.tsx:94` `const RENDER_NAVIGATOR = <NodeLibraryPanel embedded />`, dùng làm Navigator thật của chặng Thiết kế 3D (`HomeScreen.tsx:643-651`) |
| `components/cad-library/BlockLibraryDemo.tsx` (318 dòng) | **CHẾT** — tự khai "DEMO độc lập" | `grep -rn "BlockLibraryDemo\|cad-library-demo" components app` (trước khi xoá) → CHỈ 2 file tự tham chiếu nhau (`app/cad-library-demo/page.tsx` import nó, nó không được import ở đâu khác). Route `/cad-library-demo` không có nav link nào trỏ tới (`grep -rn "cad-library-demo"` khác `page.tsx` = 0). **⇒ ĐÃ XOÁ cả hai file** (xem VIỆC "dọn xác chết" bên dưới). |

**Kết luận VIỆC 1**: 3 UI thư viện sống song song có LÝ DO tách (khối/cấu kiện · nội dung tham
chiếu-Ref · node xử lý ảnh) — không phải trùng lặp cần gộp thô; `lib/library/` là lớp dữ liệu
chung duy nhất bên dưới `LibrarySheet`. 1 thứ chết đã xoá.

## VIỆC 2 — dựng format `.idfc` (`lib/cad/idfc.ts`, MỚI, 231 dòng)

Theo đúng khuôn `lib/cad/idf.ts` (JSON versioned + bảng migration `fromV→fromV+1`, KHÔNG phát
minh cơ chế version thứ hai — N8):
- `IDFC_VERSION = 1`, `IDFC_MIGRATIONS` rỗng sẵn cho v2 sau này.
- 4 mặt: `IdfcGeom2d` (prims/w/h/anchors/clearance — snapshot TỰ CHỨA, không phụ thuộc registry
  `BLOCKS` của app đích) · `IdfcGeom3d` (heightMm/bevelMm + `matId` hoặc `MaterialPbr` nhúng —
  **K1: không lưu mesh rời, chỉ tham số để 3D SUY TỪ 2D** giống `cad-to-obj.ts`) · `IdfcCommerce`
  (khuôn con `ProductSpec`, `priceVnd: number` vì JSON không có Decimal) · `IdfcMeta`.
- BA RÀNG BUỘC (00-CHOT.md) ghi thẳng trong docstring đầu file, không chỉ trong phiếu:
  1. Một chiều — file chỉ có `exportIdfc`/`importIdfc`, không có hàm ghi ngược.
  2. Bản chèn giữ liên kết qua **FK MỀM có sẵn** `BlockEntity.specId`/`HatchEntity.specId`
     (`lib/cad/model.ts:544,588`) — **KHÔNG thêm field mới vào `model.ts`** (ngoài vùng sở hữu,
     `model.ts` thuộc S6-chuan/p9 theo `00-BAT-DAU-DOC-DAY.md §0l`).
  3. Nhánh tiến độ (`model Task`) CHƯA khai — đúng K4, chờ P1 xong mới nối.
- Test `lib/cad/idfc.test.ts` (MỚI) — **23/23 pass**: round-trip đủ 4 mặt · file tối thiểu (chỉ
  geom2d) · từ chối JSON hỏng/thiếu geom2d/thiếu code · từ chối version tương lai (có lý do cụ
  thể qua `lastImportIdfcError()`) · `migrateIdfc` đứt gãy → null · cô lập `__setCurrentIdfcVersionForTest`.

## VIỆC 3 — nối hình học ↔ dữ liệu (đóng G-A-01 một phần, KHÔNG dùng `.idfc` — xem lý do)

**Phát hiện quan trọng, phải sửa lại một kết luận của báo cáo trước** (§0o — mở file ra đọc,
không tin báo cáo cũ): `docs/M-APPLY-C-OUT.md` (07/08, phiên khác) ghi *"VIỆC 5 (G-A-01) đã đóng
từ 06/08"*. Kiểm bằng cách đọc code thật: `components/library/LibrarySheet.tsx:175` (trước sửa)
gọi `buildSpecRows(displayItem)` — **ĐÚNG MỘT tham số**, không truyền `spec`/`surface`. Nghĩa là
cột thông số ④ tồn tại (đúng), nhưng **KHÔNG BAO GIỜ nối được với `ProductSpec` thật** — Hãng/Đơn
vị/Giá LUÔN hiện "—" bất kể DB có khớp mã hay không. G-A-01 **CHƯA đóng**, chỉ đóng phần khung.

Sửa 2 lớp:
1. **`lib/cad/library-item-resolve.ts`** — thêm tham số thứ 3 `specs?: readonly SpecRef[]` vào
   `resolveLibraryItem()`, dùng lại `matchSpec()` (`lib/library/spec-panel.ts` — CÙNG hàm cột
   thông số ④ đang dùng, để hai đường so khớp không lệch nhau) → `ResolvedLibraryItem.specId`.
   Không truyền `specs` (caller cũ, `LibraryDropBridge.tsx`) ⇒ hành vi y nguyên — additive.
2. **`components/library/LibrarySheet.tsx`** — fetch MỘT LẦN `/api/specs` khi sheet mở lần đầu,
   `matchSpec(displayItem.code, specs)` → `SpecSource` thật → `buildSpecRows(displayItem, source)`.

Test: `lib/cad/library-item-resolve.test.ts` 33/33 (không hồi quy) · `lib/library/spec-panel.test.ts`
32/32 (không hồi quy) · `npx tsc --noEmit -p .` sạch phần của mình.

**Verify browser thật** (127.0.0.1:3000, "Dự án mẫu", đăng nhập sẵn, không logout):
- `read_network_requests` xác nhận `GET /api/specs → 200` bắn ra khi mở Thư viện lần đầu.
- Chọn "Cửa 1 cánh 800" (mã `DOOR-S-800`) → cột thông số hiện **Mã: DOOR-S-800** (đúng, không đổi)
  và Hãng/Đơn vị/Giá vẫn "—" — **ĐÚNG**, vì `fetch('/api/specs')` (chạy tay trong console) xác
  nhận DB hiện tại **không có `ProductSpec.sku = 'DOOR-S-800'`** (10 sku thật trong DB: HP-LUX-1400,
  MH-DIN-1200, FJ-PEL-01, IK-MALM-160, IK-SOD-2S, MU-OUT-3S, AC-WRD-2000, LP-PH5-CL, AC-ENG-OAK15,
  SW-TRV-BE). Đây là bằng chứng đường dây CHẠY THẬT (không bịa số), không phải "chưa nối".
- Ảnh chụp: cột thông số hiện đúng số liệu sống, không lỗi console.

**⛔ CHƯA làm — nói thẳng**: `.idfc` (VIỆC 2) và VIỆC 3 hiện **CHƯA nối vào nhau**. VIỆC 3 dùng
thẳng `ProductSpec.sku ↔ SheetItem.code` (cơ chế đã có từ 06/08), KHÔNG qua `.idfc`. Lý do: kệ
Thư viện hiện chưa có nguồn phát sinh file `.idfc` nào (không có nút "Xuất .idfc" / "Nhập .idfc"
ở đâu cả — K4 chưa có nơi tiêu thụ cho luồng file thật) — nối `.idfc` vào UI cần VIỆC riêng
(nút xuất ở Inspector cấu kiện + nút nhập ở kệ), không nằm trong 3 việc phiếu giao rõ theo thứ
tự "logic trước, giao diện sau". `.idfc` sẵn sàng làm ĐÍCH của bước tiếp theo (đóng gói cả 4 mặt
đúng lúc "publish lên kệ" — VIỆC PublishModal.tsx đã có sẵn cửa, chưa nối `.idfc` vào đó).

## VIỆC 7b — dữ liệu mock phải khai rõ, không bày như thật (Hoà giao giữa phiên, ưu tiên trên)

`lib/library/shelves.ts:6-8` tự khai "DỮ LIỆU MOCK" trong comment nhưng UI bày y như thật — số
đếm cứng (1449/46/12/9/31/18…) không khớp `ITEMS_BY_SHELF` thật (vd kệ "Ký hiệu · khối" khai 46,
mảng mock chỉ có 12 dòng — tự nó đã là 2 con số bịa chồng nhau) + 3 preset ánh sáng đối lập
("Nắng chiều"/"Trời phủ mây"/"Đèn đêm") cùng `kind: 'sheet'` → `thumb-kinds.ts:126` (trước sửa)
vẽ **giống hệt nhau**.

Sửa (b) + (c) — (a) "nối kho thật `/api/library`" KHÔNG làm (đó là việc dựng cả tầng backend
mới, ngoài quy mô 1 phiên, ghi vào mục "chưa làm" cuối file):
- **(b)** `ShelfDef.count: number` → `number | null` (`lib/library/shelves.ts:33`); toàn bộ 18
  entry đổi số cứng → `null`; UI (`LibrarySheet.tsx`, 2 chỗ) hiện `s.count ?? '—'`. Thêm cờ
  `LIBRARY_DATA_IS_MOCK = true` (MỘT nguồn duy nhất) + badge "Dữ liệu mẫu" cạnh tiêu đề sheet
  (`LibrarySheet.tsx` sau `<h3>`, CSS `.mocktag` trong `library-sheet-css.ts`) — khi nối kho thật
  chỉ cần đổi cờ này thành `false`, không sửa rải rác.
- **(c)** Thêm 5 `ThumbKind` mới `light-gold`/`light-overcast`/`light-night`/`light-dawn`/
  `light-studio` (`lib/library/thumb-kinds.ts`) — mỗi preset một **BỐ CỤC** gradient khác nhau
  (không chỉ đổi màu): mặt trời góc dưới-phải cho nắng chiều · phẳng lì không điểm sáng cho trời
  phủ mây · nền đen + đốm sáng rải rác cho đèn đêm · dải chân trời cho nắng sớm · phẳng đều cho
  studio. + icon riêng (`Sun`/`Cloud`/`Moon`/`Sunrise`/`Aperture`, `ItemThumb.tsx`). Cập nhật
  `ITEMS_BY_SHELF['render-preset']` (`shelves.ts`) dùng đúng kind mới thay vì `'sheet'` chung.

**Verify browser thật** (127.0.0.1:3000, cả 2 theme qua `window.__flowStore.getState().setThemePref()`):
chụp 5 thẻ preset — Nắng chiều (vàng cam, mặt trời góc dưới phải) / Trời phủ mây (xám phẳng) /
Đèn đêm (nền đen + đốm vàng) / Nắng sớm (hồng chân trời) / Studio trắng (xám đều, icon khẩu độ) —
**phân biệt được bằng mắt, không cần đọc chữ**. Badge "Dữ liệu mẫu" hiện rõ cạnh "Thư viện", mọi
số đếm kệ hiện "—". 0 lỗi console cả 2 theme.

Test không hồi quy: `library-item-resolve.test.ts` 33/33 · `spec-panel.test.ts` 32/32 ·
`npx tsc --noEmit -p .` sạch phần của mình.

## VIỆC 10 — vá nhãn nợ P0

- `lib/library/types.ts:87,88` — `render: { label: 'Render' }` → `'Thiết kế 3D'` ·
  `present: { label: 'Present' }` → `'Trình chiếu'` (khớp bộ tên chính thức `00-BAT-DAU-DOC-DAY.md §1`).
- `components/LibraryPanel.tsx:25` — **đã đổi từ trước phiên này** (`'CAD / Sketch'` →
  `'Thiết kế 2D / Sketch'`, xác nhận bằng `git diff` thấy sẵn trong working tree, không phải việc
  của phiên này) — `grep -rn "'CAD\|CAD /"` lại toàn bộ 8 file sở hữu: chỉ còn `lib/refingest.ts:45`
  (`'CAD / Bản vẽ'`, **GIỮ NGUYÊN đúng chỉ đạo phiếu** — đây là nhãn LOẠI TỆP, không phải nhãn
  chặng) và comment code (không lộ UI). `lib/ref-search.ts:253` (`PHASE_CATEGORIES`) đã tự khớp
  `'Thiết kế 2D / Sketch'` sẵn — không cần sửa thêm, 2 chuỗi đã đồng bộ.
- Dọn xác chết VIỆC 1: xoá `app/cad-library-demo/page.tsx` + `components/cad-library/BlockLibraryDemo.tsx`
  (thư mục rỗng theo sau tự dọn) — grep xác nhận trước khi xoá: 0 nơi khác tham chiếu.

`npx tsc --noEmit -p .` sạch (chỉ còn 1 lỗi CŨ đã biết, `lib/cad/render-layer-index.test.ts(36,21)`,
không liên quan — thuộc làn khác).

## File đã sửa/thêm/xoá (phiên này)

| File | Việc |
|---|---|
| `lib/cad/idfc.ts` (MỚI) | VIỆC 2 — format `.idfc` |
| `lib/cad/idfc.test.ts` (MỚI) | VIỆC 2 — 23 test |
| `lib/cad/library-item-resolve.ts` | VIỆC 3 — tham số `specs` + `SpecRef` + `specId` |
| `components/library/LibrarySheet.tsx` | VIỆC 3 (fetch specs + `displaySpecSource`) · VIỆC 7b (badge mock + `?? '—'`) |
| `lib/library/shelves.ts` | VIỆC 7b — `count: number\|null`, 18 số cứng → `null`, cờ `LIBRARY_DATA_IS_MOCK`, 5 preset đổi `kind` |
| `lib/library/thumb-kinds.ts` | VIỆC 7b — 5 `ThumbKind` + tint + texture + label mới |
| `components/library/ItemThumb.tsx` | VIỆC 7b — icon cho 5 kind mới |
| `components/library/library-sheet-css.ts` | VIỆC 7b — `.mocktag` |
| `lib/library/types.ts` | VIỆC 10 — `STAGE_META` render/present |
| `app/cad-library-demo/page.tsx` (XOÁ) | VIỆC 1/10 — xác nhận chết |
| `components/cad-library/BlockLibraryDemo.tsx` (XOÁ) | VIỆC 1/10 — xác nhận chết |

**KHÔNG đụng**: `prisma/schema.prisma` (không cần cho .idfc — chủ ý dùng FK mềm có sẵn) ·
`lib/cad/model.ts` · `lib/cad/*` phần khác · `lib/three` · `components/three` · `lib/boq` ·
`lib/ffe` · `docs/mocks/*` (trừ đọc).

## ⛔ CHƯA LÀM — không tô hồng, ghi rõ vì sao

- **VIỆC 4 (G-A-01 mở rộng)** — nối tay UI để NGƯỜI DÙNG gán mã khớp giữa món trên kệ và
  `ProductSpec` khi chưa trùng mã tự động (hiện chỉ tự khớp theo `code === sku`, không có màn sửa
  tay khi lệch). Chưa làm — cần thiết kế màn riêng (ngoài quy mô phiên).
- **VIỆC 5 (gộp 5 thư viện về 1 tấm)** — VIỆC 1 khảo sát cho thấy 3 UI sống có LÝ DO tách (khối
  vs Ref vs Node), **không phải gộp thô là đúng** — cần Hoà xác nhận lại ý "MỘT tấm" có còn đúng
  sau khi thấy 3 UI phục vụ 3 mục đích khác nhau, hay ý gộp chỉ áp cho các kệ BÊN TRONG
  `LibrarySheet` (đã gộp từ 04/08, xem `shelves.ts:12-14` "GỘP vật liệu về MỘT kệ").
- **VIỆC 6** — đã đọc `M-APPLY-C-OUT.md` (VIỆC 1+2 của phiên p5, 07/08) — xác nhận ĐÚNG chốt
  (transform-origin 50% 50%, cột kệ 214px, cột thông số trượt-width), KHÔNG sửa lại, không lặp
  công.
- **VIỆC 7 (hiển thị đủ w×d×h trên thẻ, dấu hiệu tham số hoá)** — CHƯA làm. `SheetItem` hiện
  không có field w/d/h (chỉ `name`/`code`/`kind`) — cần thêm field + nguồn dữ liệu thật trước khi
  vẽ, đúng thứ tự "logic trước giao diện" của phiếu; ưu tiên bị VIỆC 7b (Hoà giao giữa phiên) lấn.
- **VIỆC 8 (G-A-04, 4 khối `dc-import` thiếu)** — `docs/M-APPLY-C-OUT.md` VIỆC 3 (07/08, phiên
  khác) đã ghi "đã đóng từ 06/08". Chưa tự kiểm lại trong phiên này (ngoài giờ làm việc, ưu tiên
  VIỆC 1-3 + 7b + 10 theo đúng thứ tự phiếu) — ghi CHƯA VERIFY, không chép nguyên báo cáo cũ (N1).
- **VIỆC 9 (G-A-05 mock cãi chốt)** — cùng lý do VIỆC 8, `M-APPLY-C-OUT.md` VIỆC 4 (07/08) ghi đã
  đóng phần lớn. CHƯA VERIFY lại trong phiên này.

## VÒNG 2 (cùng ngày, Hoà bảo "làm tiếp cho xong") — VIỆC 8·9·7·4

⚠️ **Va chạm hai-phiên-chung-git giữa vòng 1 và vòng 2**: mở lại `components/library/LibrarySheet.tsx`
thấy đã có sẵn (KHÔNG phải tôi viết): "BA NẤC CỠ THẺ" (`CARD_SIZE_OPTIONS`/`cardSize`/`formatDims`,
đúng chốt `00-CHOT.md` "TẤM THƯ VIỆN: NỚI 960px + BA NẤC CỠ THẺ") + `.idfc` đã nâng lên **v2**
(vỏ chung/ruột theo loại, `IDFC_KINDS` 11 loại) + nút "Xuất .idfc" đã nối vào cột thông số. Đây là
việc THẬT, có test (`idfc.test.ts` nay 36/36, không phải 23 tôi viết ban đầu), `tsc` sạch —
**KHÔNG revert, không viết đè** (§0d giữ-cái-đang-tốt). Chỉ thêm additive lên trên.

### VIỆC 8 — verify lại G-A-04 (KHÔNG cần sửa)
`grep -n "dc-import" "docs/mocks/Thư viện.dc.html"` → **0 kết quả sống**, chỉ 2 dòng comment
`[06/08 · gỡ G-A-04]` xác nhận đã nội hoá. **Đúng như M-APPLY-C-OUT.md ghi — xác nhận lại, không sửa.**

### VIỆC 9 — verify lại G-A-05 (KHÔNG cần sửa)
`library-sheet-css.ts:109` `.shelf{width:214px}` (không phải 186) · `:69-70`
`transform-origin:50% 50%` + `translate(-50%,10px) scale(.97)` (nổi tại chỗ, không phải ngăn kéo
dính đáy) · 186px chỉ còn trong 2 dòng comment lịch sử. **Đúng như M-APPLY-C-OUT.md ghi — xác
nhận lại, không sửa.**

### VIỆC 7 — phần còn thiếu: dấu hiệu "có tham số"
Phần w×d×h (chốt lớn) **đã có sẵn** (xem cảnh báo va chạm trên). Phần phiếu gốc còn đòi mà chưa
ai làm: *"dấu hiệu cấu kiện có tham số (co giãn) vs hình cứng"*. Thêm:
- `LibrarySheet.tsx` (trong `.map` render lưới, gate `cardSize==='lg'` — cùng nhịp hiệu năng với
  `dims` đã có, không gọi `resolveLibraryItem` cho mọi thẻ ở mọi nấc): `hasVariants = resolveLibraryItem(...).via==='blockdef' && !!def.variants?.length`.
- Badge `.badge.param` (`library-sheet-css.ts`, góc dưới-trái, tông `--success`, đối xứng với badge
  phạm vi góc trên-phải) — chữ "Tham số"/"Param", tooltip giải thích. Chỉ kho ① (`BLOCKS`, giữ
  danh tính) tính được field `variants`; kho ②(.dxf phẳng) **không đoán bừa** "có tham số".

### VIỆC 4 — màn gán mã tay khi kệ ↔ kho vật liệu không khớp tự động
Thêm cơ chế LOCAL (không PATCH `ProductSpec.sku` — cửa đó **chặn admin**, `app/api/specs/[id]/route.ts`
`requireAdmin`, đúng luật T1/T2 tiền/giá dùng chung không sửa tuỳ tiện):
- `lib/library/local-state.ts` — thêm `specLinks: Record<itemId, specId>` vào `LocalState` +
  `linkSpec()`/`unlinkSpec()` (KS4: gán rồi vẫn bỏ gán được, không phải hành động một chiều).
- `LibrarySheet.tsx` — `displaySpecSource` giờ có 3 tầng ưu tiên: **`.idfc` file-embedded** (cao
  nhất, dữ liệu đi theo file) → **gán tay** (`state.specLinks`) → **khớp mã tự động** (`matchSpec`,
  thấp nhất, có thể sai). Khối `.splink` mới (dưới dòng lý do "—", `missingSpecCount>0`): chưa
  gán thì hiện `<select>` liệt kê toàn bộ `specs` đã tải, chọn xong gọi `linkSpec` ngay (KS3: chọn
  rõ ràng, không tự đoán); đã gán thì hiện "Đã gán tay: <tên> · Bỏ gán".
- CSS `.splink` (`library-sheet-css.ts`) — cùng khối `.speccol`, vùng chạm `select`/`button` dùng
  `--tap` (≥44px, G8: đây là lối THAY THẾ chứ không phải đường duy nhất — kéo thả vẫn nguyên).

### Kiểm tĩnh vòng 2
`npx tsc --noEmit -p .` — **sạch** (chỉ còn lỗi CŨ `render-layer-index.test.ts`, không liên quan).
`spec-panel.test.ts` 32/32 · `library-item-resolve.test.ts` 33/33 · `idfc.test.ts` 36/36 — không
hồi quy.

### 🔴 CHƯA VERIFY browser vòng 2 — nói thật, không bịa ảnh
Server dùng chung `127.0.0.1:3000` (nhiều phiên khác đang ghi file đồng thời — HMR liên tục 404
`main-app.js`/`app-pages-internals.js`/`layout.css` do version-hash lệch giữa các lần build) —
**thử lại 6 lần trong ~40 giây, trang vẫn kẹt ở spinner, không load được để chụp**. Đây là hiện
tượng hạ tầng dùng chung (nhiều Claude Code session cùng sửa file trong repo không-worktree), không
phải lỗi trong code của tôi (bằng chứng: `tsc` sạch, logic mới bám ĐÚNG khuôn `dims`/`resolveLibraryItem`
đã verify sống ở vòng 1).

**Kiểm bằng script thuần thay browser** (`resolveLibraryItem` không đụng DOM, chạy được ngoài
trình duyệt) — chạy `itemsFor()` qua MỌI kệ mock hiện có, đối chiếu `def.variants`:
**0/12+ món trên mọi kệ hiện tại khớp được với 1 trong 3 block CÓ `variants`** trong `furniture.ts`
(`sofaCorner`/`bedS`/`bedD`) — tên trên kệ mock ("Giường 1m6", "Sofa 3 chỗ"…) không đủ khớp tên
với "Sofa góc"/"Giường đơn"/"Giường đôi". ⇒ **Badge "Tham số" đúng logic nhưng KHÔNG có cơ hội
hiện ra với bộ dữ liệu mock đang có** — không phải lỗi code, là giới hạn dữ liệu mẫu (cùng họ vấn
đề VIỆC 7b: mock không đại diện đủ trường hợp thật). Phiên sau muốn thấy badge sống: đổi 1 dòng
`ITEMS_BY_SHELF['cad-kyhieu']` (`shelves.ts`) thành `['Sofa góc', 'SOFA-CN', 'furniture']` (khớp
đúng tên `sofaCorner`) để verify, hoặc chờ kho thật có block mang biến thể đúng tên.

Phần gán mã tay (VIỆC 4) verify được bằng mắt khi server ổn định: mở món chưa khớp mã → thấy
dropdown "Chọn trong kho vật liệu…" dưới dòng lý do "—" → chọn xong cột thông số cập nhật ngay +
nút "Bỏ gán" trả về đúng trạng thái tự khớp theo mã như trước.

## Hàng đợi cho phiên sau (V7)

1. Nối `.idfc` (VIỆC 2) vào luồng THẬT — export ở `PublishModal.tsx` (đã có cửa "publish"), import
   ở nút "Nạp hàng loạt" (`BulkIngestMode.tsx` đã có sẵn khung). Hiện `.idfc` chỉ là format, CHƯA
   có nút nào sinh/đọc file `.idfc` thật — đúng K4, phải thêm nơi tiêu thụ trước khi mở rộng field.
2. VIỆC 4/5/7/8/9 còn treo — VIỆC 5 cần Hoà xác nhận lại phạm vi trước khi code (đừng gộp nhầm 3
   UI có lý do tách).
3. VIỆC 1 khảo sát bắt thêm 1 hồ nghi: 2 báo cáo trước (`M-APPLY-C-OUT.md`) claim "đã đóng" 2 việc
   (G-A-01, G-A-04/05) mà khi mở code ra đọc thì G-A-01 KHÔNG đúng (buildSpecRows gọi thiếu tham
   số) — phiên sau mở lại G-A-04/G-A-05 nên tự đọc code, đừng chỉ tin dòng "đã đóng" trong sổ.
