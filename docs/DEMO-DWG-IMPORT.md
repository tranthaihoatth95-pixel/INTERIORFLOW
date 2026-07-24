# DEMO — Import DWG (verify 24/07/26)

## Verdict: OK — pipeline chạy thật, render đúng.

Pipeline `openDwgFile()` (lib/cad/dwg.ts) qua Web Worker cô lập
(`lib/cad/dwg-worker.ts` — `@mlightcad/libredwg-web` WASM, GPL cách ly) →
`dwgRawDocToDoc()` map sang `Doc` → `CadEditor.onImportDwgFile` gọi
`importDoc(doc,'replace')` + `cad:zoom-extents`.

## Demo path

1. `/login` → `demo@if.local / demo1234` → `/cad-editor`.
2. Toolbar `Nhập ▾` → `Mở DWG` → chọn file `.dwg` thật.
3. Status bar hiện: `Đã mở <file> — N đối tượng. (skipped/total đối tượng chưa hỗ trợ đã bỏ qua)`.
4. `zoom-extents` tự chạy, layer panel bên phải liệt kê layer thật của file.

## Kết quả verify (worktree `feat/dwg-import-verify`, port 3013)

| File | Kích thước | Total ent. | Parsed | Skipped | Layers hiện | Thời gian |
|---|---|---|---|---|---|---|
| `Mb bố trí tầng 2_Phong ngu Master.dwg` | 305 KB | 497 | **421** | 76 (INSERT/DIMENSION) | A-Furniture · P5 · A-Hatch wall · A-Section · 0 · Defpoints · … | ~4-5s |
| `Xref_MB SA2D.dwg` | 3.3 MB | 285 | 38 | 247 (block-heavy xref) | A-Note · Defpoints · A-Furniture · 0 · A-WALL · A-Hatch wall | ~12-15s |

File 1 (mặt bằng bố trí phòng ngủ): render đủ tường, cửa, nội thất, mảng
hatch — GFA 8.4m² · 34 phòng nhận diện được (`floor-brain` chạy sau import).
File 2 (xref block-heavy) chỉ còn label rời vì phần lớn hình là INSERT
(block reference) — đúng như spec đã cảnh báo ("CHƯA hỗ trợ INSERT" ở
dwg-worker.ts:26). Xref-style DWG cần build block-flatten ở đợt sau.

## Screenshots (live verify 24/07/26)

- Master.dwg: floor plan render đủ tường/cửa/nội thất, 7 layer trong panel
  (A-Furniture, P5, A-Hatch wall, A-Section, 0, Defpoints, P5-PL 19-…).
- Xref.dwg: chỉ còn label + defpoint (đúng do file toàn INSERT block).

Screenshots gốc capture live qua browser MCP, không commit vào repo (giảm
weight). Reproduce: chạy demo path ở trên.

## Giới hạn hiện tại (đã biết, không phải bug)

- INSERT (block reference), DIMENSION, ATTRIB/ATTDEF, WIPEOUT, POINT — bỏ qua an
  toàn, đếm vào `skippedEntityCount`. File xref-heavy sẽ mất nhiều hình.
- HATCH với boundary có cung/spline — bỏ qua (tránh suy đoán hình sai).
- Lineweight sentinel BYLAYER/BYBLOCK/DEFAULT → dùng mặc định layer.

## Ràng buộc pháp lý

`@mlightcad/libredwg-web` = GPL-3.0. Chỉ import trong `lib/cad/dwg-worker.ts`
(Web Worker cô lập, giao tiếp qua postMessage). IF hiện là tool nội bộ TTT —
xem `docs/LICENSE-NOTES.md` trước khi phân phối ra ngoài công ty.

## Đề xuất bước sau

1. Sprint tới: flatten INSERT (giải nén block) → dựng lại hình từ
   `BLOCK_RECORD`. Đây là gap lớn nhất — file kiến trúc thật thường dùng
   block cho ghế/bàn/thiết bị vệ sinh.
2. DIMENSION render mảnh (đường gióng + text đo) — nice-to-have.
3. Test regression tự động: đưa 1 file `.dwg` nhỏ vào `test/fixtures/` +
   vitest chạy `openDwgFile` headless (cần jsdom + polyfill Worker/WASM
   hoặc gọi trực tiếp `parseDwg` nội bộ).
