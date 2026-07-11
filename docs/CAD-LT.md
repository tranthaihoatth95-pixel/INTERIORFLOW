# CAD-LT — Tiến độ "tương đương AutoCAD LT" (`/cad-editor`)

Nhánh `feat/cad-lt-parity` (base: `feat/cad-pro-stage1`), làm trong worktree riêng. Mục tiêu:
nâng chặng 1 Layout CAD từ mức sơ phác lên gần với drafting 2D đầy đủ kiểu AutoCAD LT.

## Bảng tiến độ theo Nấc

| Nấc | Nội dung | Trạng thái |
|---|---|---|
| 1 | TRIM/EXTEND/FILLET/CHAMFER/ARRAY/SCALE/STRETCH/BREAK/JOIN/EXPLODE/LENGTHEN | **Đạt** — `lib/cad/modify.ts`, 59 test |
| 2 | OSNAP bổ sung (quadrant/node/nearest/perpendicular/tangent) + polar tracking + grips | **Đạt** — `lib/cad/query.ts` + `lib/cad/grips.ts` (17 test) |
| 3 | DIMENSION đầy đủ (aligned/radius/diameter/angular + continue/baseline) + dim style + DXF thật | **Đạt** — model.ts/render.ts/dxf.ts, DIMENSION entity thật + block ẩn danh |
| 4 | HATCH thật (pick-point boundary trace + pattern) + DXF HATCH | **Đạt (có giới hạn đã biết)** — `lib/cad/hatch.ts`, xem "Giới hạn" bên dưới |
| 5 | Linetype & properties + panel Properties + MATCHPROP + AREA | **Một phần** — lineweight/linetype theo layer đã có (xem dưới); panel Properties/MATCHPROP/AA CHƯA làm |
| 6 | TEXT/MTEXT edit tại chỗ + block attribute | **Chưa** |
| 7 | Layout & in ấn (paper space, khổ giấy, PDF) | **Chưa** — có hằng số ISO 216 tham chiếu (`iso-drafting.ts`) nhưng chưa pipeline |
| 8 | DXF fidelity nâng (BLOCK/INSERT thật, mở rộng test) | **Một phần** — DIMENSION/HATCH đã là entity thật; BLOCK/INSERT furniture vẫn phẳng hoá (cố ý, xem dxf.ts) |

Ngoài 8 nấc gốc, đã làm thêm theo yêu cầu bổ sung giữa chừng (ưu tiên ngang 1-4):
- **Hệ nét ISO 128** (lineweight/linetype theo layer, DXF group 370/LTYPE) — xem `lib/cad/model.ts`
  (`STANDARD_LINEWEIGHTS`, `DEFAULT_LAYERS`), `lib/cad/render.ts` (`DrawStyle.realLineweight`),
  `lib/cad/dxf.ts` (bảng LTYPE + LAYER 370).
- **Demo plan rà lại công năng** — `lib/cad/demo-plan.ts` (lỗi WC chỉ vào được qua bếp đã sửa).
- **Bộ nhớ quy chuẩn + Kiểm chuẩn** — `lib/cad/standards/**` (xem `docs/CAD-STANDARDS.md`).

## Danh sách lệnh + alias (dòng lệnh là first-class citizen)

| Lệnh | Alias | Nấc |
|---|---|---|
| Trim | `TR` | 1 |
| Extend | `EX` | 1 |
| Fillet | `F [bán kính]` | 1 |
| Chamfer | `CHA [d1] [d2]` | 1 |
| Array chữ nhật | `AR` | 1 |
| Array tròn | `ARP` | 1 |
| Scale | `SC` | 1 |
| Stretch | `S` | 1 |
| Break | `BR` | 1 |
| Join | `J` | 1 |
| Explode | `X` | 1 |
| Lengthen | `LEN [delta]` | 1 |
| Polar tracking | `POLAR [góc]` | 2 |
| Dim aligned | `DAL`/`DIM` | 3 |
| Dim radius | `DRA` | 3 |
| Dim diameter | `DDI` | 3 |
| Dim angular | `DAN` | 3 |
| Dim continue | `DCO` | 3 |
| Dim baseline | `DBA` | 3 |
| Dim text height | `DIMTXT [mm]` | 3 |
| Dim arrow size | `DIMASZ [mm]` | 3 |
| Dim scale | `DIMSCALE [hệ số]` | 3 |
| Hatch | `H [pattern] [scale]` | 4 |
| Hatch angle | `HANGLE [góc]` | 4 |

**Đổi so với trước:** `F` ở dòng lệnh trước đây = Zoom Extents (không chuẩn AutoCAD) — nay `F` =
FILLET đúng chuẩn; Zoom Extents dùng `EXT`/`Z` hoặc phím tắt trực tiếp `f` trên canvas (không
qua dòng lệnh, không đổi).

## Test coverage

```
lib/cad/modify.test.ts           59 test — trim/extend/fillet/chamfer/array/scale/stretch/break/join/explode/lengthen
lib/cad/grips.test.ts            17 test — grip line/polyline/rect/circle/arc/text/block
lib/cad/hatch.test.ts            18 test — boundary trace (đơn giản + lồng nhau) + pattern
lib/cad/dxf.roundtrip.test.ts    46 test — round-trip mọi entity + DIMENSION/HATCH thật + lineweight/linetype
lib/cad/standards/checker.test.ts 11 test — rule engine (đo thật + registry integrity)
                                 ─────
                                 151 test, chạy bằng node_modules/.bin/sucrase-node <file>
```

Chạy `npx tsc --noEmit` sạch trước mỗi commit (đã xác nhận qua toàn bộ quá trình).

## DXF fidelity đã phủ

- LINE/LWPOLYLINE/CIRCLE/ARC/TEXT — round-trip 1:1 (từ trước).
- **DIMENSION thật** (Nấc 3): entity DIMENSION + block ẩn danh `*Dn` (BLOCKS + BLOCK_RECORD
  trong TABLES) cho cả 4 kind (aligned/radius/diameter/angular).
- **HATCH thật** (Nấc 4): entity HATCH khi hatch có `pattern` (tên pattern chuẩn acad.pat/
  ansi.pat: ANSI31/ANSI32/ANSI37/SOLID/DOTS). Hatch KHÔNG có `pattern` (poché tường cũ từ WALL)
  vẫn xuất đường bao LWPOLYLINE như trước (không phá hành vi cũ).
- **LTYPE + LAYER.370** (hệ nét): bảng LTYPE 5 nét chuẩn + mỗi LAYER mang lineweight/linetype
  thật; entity dùng "ByLayer" mặc định (không ghi lặp 370/6 trừ khi có override riêng).
- **CHƯA làm** (Nấc 8 nếu làm tiếp): BLOCK/INSERT thật cho furniture (vẫn phẳng hoá — quyết định
  có chủ đích, xem đầu file dxf.ts), STYLE table cho text.

## Giới hạn đã biết (phát hiện qua debug thủ công, không phải suy đoán)

**~~Boundary-trace của HATCH không đáng tin cậy với phòng có T-junction~~ — ĐÃ SỬA**
(commit fix/hatch-t-junction): thay quy tắc rẽ-góc-nhỏ-nhất cục bộ trong `lib/cad/hatch.ts`
bằng DCEL liệt kê mặt TOÀN CỤC (sắp nửa-cạnh theo góc quanh từng đỉnh, next = đứng trước twin,
mặt hữu hạn = diện tích đại số dương) + cắt đoạn cả khi giao kiểu chạm-đầu-mút/thẳng-hàng + khử
cạnh trùng hatch/polyline của cùng wallSegment. Phòng kề chữ T ("PHÒNG KHÁCH + ĂN", "BẾP" trong
`demo-plan.ts`) giờ dò đúng — khoá bằng test [7]/[8] `hatch.test.ts` + [7]/[8] `checker.test.ts`.
Các quad tường không vát góc vẫn tạo "khe hở" nhỏ ở góc/chữ T (mặt thật của phân hoạch) nhưng
chỉ được trả về khi pick TRÚNG khe đó.

## Cần verify MẮT trên browser (agent không có preview trong phiên làm việc này)

- Toàn bộ UI mới: toolbar nhóm MODIFY (12 icon), nhóm MEASURE mở rộng (6 loại dim), nút Hatch,
  nút Kiểm chuẩn + panel, 2 select lineweight/linetype trong Layer panel.
- Tương tác 2-click của FILLET/CHAMFER/JOIN/BREAK (preview vẽ đúng, click thứ 2 áp dụng đúng).
- Grip kéo trực tiếp (line/polyline/rect/circle/arc/text/block) — render + drag mượt, không giật.
- Polar tracking guide khi vẽ (hiện qua rubber-band snap, chưa có tia dẫn hướng riêng — xem
  ghi chú trong CadCanvas.tsx `applyDirectionConstraint`).
- Render dimension 4 kiểu (tick 45°, mũi tên radius/diameter, cung angular) — đúng vị trí/hướng.
- Hatch pattern (ANSI31/32/37/DOTS) hiển thị đúng trên canvas, không chỉ SOLID.
- Lineweight/linetype hiển thị đúng trên canvas ở nhiều mức zoom (dash pattern scale theo
  viewport.scale, tối thiểu 1px).
- Mặt bằng demo mới (nút "Mở bản demo") — kiểm bằng mắt bố cục công năng, cửa/cửa sổ, nội thất
  không chồng lấn (đã kiểm bằng script tọa độ tạm thời, xoá sau khi verify — không phải thay thế
  cho việc nhìn bằng mắt).
- Panel Kiểm chuẩn: chạy trên bản demo, xem danh sách vi phạm (dự kiến 0 violation rõ ràng vì
  NGỦ/WC đạt chuẩn; KHÁCH/BẾP có thể không đo được do giới hạn boundary-trace nêu trên).

## Rủi ro khi merge với `feat/cad-pro-stage1` gốc

- **model.ts**: `DimEntity`/`HatchEntity`/`Layer` mở rộng field optional — an toàn ngược, nhưng
  nếu nhánh gốc cũng sửa các interface này song song, cần merge tay cẩn thận (không phải chỉ
  auto-merge).
- **DEFAULT_LAYERS**: thêm layer thứ 5 "Trục" (`l-axis`) — nếu nhánh gốc có logic cứng giả định
  đúng 4 layer mặc định (`doc.layers[0..3]` theo index thay vì tìm theo tên), cần rà lại.
- **query.ts/geometry.ts/store.ts**: tách case `'line'`/`'dim'` (trước gộp chung) để xử lý field
  `c` mới của dim angular — hành vi cho `'line'` không đổi, chỉ `'dim'` có thêm xử lý.
- **commands.ts**: `axesGrid` đổi layer từ `'l-dim'` sang `'l-axis'` — nếu nhánh gốc có test/kỳ
  vọng cứng vào layer cũ cho lưới trục, cần cập nhật.
- **furniture.ts**: thêm 2 block mới (`doorRoom`/`doorWC`), không sửa/xoá block cũ — rủi ro thấp.
- Push lên `feat/cad-lt-parity` (nhánh mới, không phải `feat/cad-pro-stage1`) — merge vào nhánh
  gốc là bước làm SAU, chưa thực hiện trong phiên này (theo đúng luật cô lập worktree).
