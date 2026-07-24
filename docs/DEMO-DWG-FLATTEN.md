# DEMO — DWG Block-Flatten · Verify kết quả

> Task #8 `feat/dwg-block-flatten` (commit `e65970f`): flatten INSERT/MINSERT/DIMENSION + ATTRIB→TEXT
> trong `lib/cad/dwg-map.ts` (hàm `dwgRawDocToDoc`), dữ liệu block từ `lib/cad/dwg-worker.ts`.
> Verify 24/07 bằng script headless (node + sucrase, cùng code path với worker browser —
> file Master đã đối chiếu headless = browser khớp 100%).

## Kết quả 2 file thật (dự án SDC — Sungroup Beach Club)

| | File Master (bind) | File Xref (Level 22) |
|---|---|---|
| Entity model space (raw) | 497 | 285 |
| Hiển thị TRƯỚC flatten | 489 (INSERT bị bỏ) | 38 |
| Entity SAU flatten | **3.711** | **200.000** (chạm van an toàn) |
| Block definitions | — | 445 |
| Parse (libredwg WASM) | 1,28 s | 4,11 s |
| Flatten | 41 ms | 1,09 s |

### Ghi chú file Xref
- Ước tính flatten đầy đủ ≈ **440k entity** — riêng block `Xr_SDC_DD_ID-Level22-Arch wall`
  (xref kiến trúc nguyên tầng 22 đã bind thành block) chiếm ≈ 414k. Van
  `MAX_FLATTEN_ENTITIES = 200000` cắt đúng thiết kế, không treo, không nổ bộ nhớ.
- Phân bố sau flatten: 183.417 polyline · 9.940 line · 3.089 text · 1.721 circle ·
  1.641 arc · 192 hatch.
- Xref lồng 2 tầng (`ID wall$0$…$0$…`) flatten đúng nhờ đệ quy nested INSERT (depth cap 8).

## Unit test
`lib/cad/dwg-flatten.test.ts` — **36 pass / 0 fail** (`node_modules/.bin/sucrase-node lib/cad/dwg-flatten.test.ts`).
Phủ: translate · scale+rotate · basePoint · nested 2 tầng có rotate · MINSERT mảng 2×3 + rotate ·
CIRCLE/ARC (scale đều giữ arc, lệch trục → polyline) · kế thừa BYBLOCK màu + layer 0 → layer INSERT ·
block tự tham chiếu (cycle guard) · block thiếu/hợp đồng cũ không blocks · DIMENSION (block ẩn danh,
fallback đo, text user gõ) · van 200k.

`npx tsc --noEmit` sạch.

## Nợ còn lại
- **SPLINE trong hatch boundary**: boundary loop kiểu spline chưa tessellate — hatch đó vẽ thiếu viền cong.
- **WIPEOUT**: chưa map (che nền); vùng bị wipeout sẽ nhìn xuyên.
- **Van 200k**: file xref bind nguyên tầng (~440k) bị cắt còn 200k — đủ cho sơ phác DD nhưng
  muốn đủ 100% cần LOD/lazy-load theo block hoặc nâng van + virtualize render.
- File test `.dwg` (dữ liệu dự án) KHÔNG commit vào repo — verify lại thì lấy từ nguồn
  `knowledge/project-references/` hoặc hỏi chủ dự án.
