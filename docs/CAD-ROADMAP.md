# CAD chặng 1 (`/cad-editor`) — phạm vi & roadmap

> Viết ban đầu ở phiên nâng cấp "CAD pro stage 1" (nhánh `feat/cad-pro-stage1`). Đã hiệu đính
> mục 0/2/4 (đợt dọn tài liệu nhỏ) để khớp thực tế sau khi `feat/cad-lt-parity` merge — chi tiết
> đầy đủ, cập nhật nhất cho mảng TRIM/FILLET/DIMENSION/HATCH ở `docs/CAD-LT.md`.

## 0. Ranh giới phạm vi (ĐỌC TRƯỚC)

InteriorFlow là 1 app trong hệ sinh thái. Có 1 app **CAD chuyên nghiệp tách rời** (dự án **EFC**)
lo phần CAD đầy đủ cho hồ sơ thi công (CD). Vai trò của chặng 1 `/cad-editor` ở đây **CHỈ dừng ở
mức SƠ PHÁC DD (Design Development)**: vẽ nhanh mặt bằng trình bày được (tường/phòng/cửa/kích
thước cơ bản/nội thất/nhãn phòng + cao độ) đủ để truyền đạt ý đồ thiết kế và handoff sang chặng
Render/Present — **KHÔNG nhắm tới độ chính xác hồ sơ thi công**, không cố thay thế AutoCAD/EFC.

Vì vậy, roadmap **gốc** dưới đây không đề xuất xây kernel CAD nặng — nhưng thực tế sau đó có 1
nhánh riêng (`feat/cad-lt-parity`, đã merge) chủ động đi xa hơn phạm vi DD ban đầu và làm THẬT
phần lớn các mục từng liệt kê ở đây là "không làm": **TRIM/EXTEND/FILLET/CHAMFER/ARRAY/SCALE/
STRETCH/BREAK/JOIN/EXPLODE/LENGTHEN** (`lib/cad/modify.ts`), **DIMENSION entity thật** (4 kiểu
aligned/radius/diameter/angular, `lib/cad/dxf.ts`), **HATCH thật** (pattern ANSI31/32/37/SOLID/
DOTS khi dùng lệnh Hatch riêng, `lib/cad/hatch.ts` + `lib/cad/dxf.ts`) — xem mục 2/4 bên dưới +
**`docs/CAD-LT.md`** (bảng tiến độ theo Nấc, nguồn cập nhật nhất cho mảng này). Vẫn **CHƯA làm**
(đúng như định hướng ban đầu, để ngỏ cho EFC nếu cần): BLOCK/INSERT thật cho furniture (vẫn phẳng
hoá — cố ý), XREF, PDF underlay, dynamic block, layer states, ống lệnh script. Mục "Đã làm" bên
dưới liệt kê đúng những gì phù hợp mức sơ phác DD của phiên gốc; phần bổ sung sau đó xem mục 2/4.

## 1. Đã làm (phiên này)

- **Macro nội thất nhanh** (`lib/cad/commands.ts`, file mới — giữ CadEditor/CadCanvas gọn):
  - `WALL`/`W` — vẽ tường tim-tường theo chuỗi điểm (như Polyline: click nối tiếp, Enter/dblclick
    kết thúc, `C` khép vòng), sinh ra quad tô đặc (`HatchEntity`, poché) + biên nét mảnh. Gõ
    `W 200` để đổi bề dày (mm) trước khi vẽ. Tool mới trong `lib/cad/store.ts` (`wall`,
    `wallThickness`), xử lý click ở `CadCanvas.tsx`.
  - `ROOM` — click 2 góc → tự dựng 4 tường khép vòng (`roomRect()`) + nhãn tên (prompt) + diện
    tích thông thuỷ xấp xỉ (trong tim tường trừ bề dày — **không phải số đo hồ sơ CD**).
  - `D`/`DOOR`, `WIN`/`WINDOW` — đặt nhanh block `door`/`window` có sẵn trong
    `lib/cad/furniture.ts` (không vẽ lại từ đầu). Nút riêng "Đặt cửa" trên toolbar.
  - Toolbar (`CadToolbar.tsx`): thêm nhóm icon Wall/Room + nút Đặt cửa.
- **Bộ trình bày DD** (vẫn trong `commands.ts`, rẻ vì chỉ là entity tĩnh — không phải kernel):
  `axesGrid` (lưới trục số/chữ + bong bóng tròn), `titleBlock` (khung tên góc phải-dưới),
  `northArrow` (mũi tên Bắc), `scaleBar` (thước tỉ lệ), `dimensionChain` (chuỗi kích thước ngoài
  dùng lại `DimEntity` đã có). Gộp cả 4 qua `addPresentationKit(doc, box, info)`.
- **Demo data** (`lib/cad/demo-plan.ts`, file mới): căn hộ mẫu 1PN + bếp + WC ~9.0×6.6m — tường
  bao + 3 vách ngăn, 4 cửa đi, 6 cửa sổ, 9 block nội thất, nhãn phòng + diện tích + cao độ
  N.P.T ±0.000, chuỗi kích thước 2 cạnh ngoài, đủ bộ trình bày (lưới trục/khung tên/mũi tên
  Bắc/thước tỉ lệ). Nút **"Mở bản demo"** trên thanh file `CadEditor.tsx` (hỏi xác nhận nếu bản vẽ
  hiện tại không rỗng, dùng `importDoc(..., 'replace')` nên Undo được).
- **AI-assist tối giản, rule-based** (`lib/cad/ai-assist.ts`, file mới — **CỐ TÌNH không cầu kỳ**
  theo phạm vi đã chốt): `describeToEntities(text, ...)` tách kích thước "4x3.5" (mét) + từ khoá
  nội thất (giường/tủ/sofa/bàn ăn/bồn cầu…) từ 1 câu mô tả → sinh 1 phòng (`roomRect`) + đặt tối đa
  3 block khớp từ khoá. Nút "AI mô tả" (dùng `window.prompt`, không xây panel riêng). **Chỗ cắm
  LLM thật** đã ghi rõ trong comment đầu file `ai-assist.ts` — thay nội dung hàm bằng 1 lời gọi
  `/api/jobs` (adapter AI đã có sẵn ở app chính) khi cần, không đổi chữ ký hàm.
- **DXF export/import** (`lib/cad/dxf.ts`, viết lại) — mức "đủ mở sạch để handoff", không phủ hết
  entity DXF (xem §2 dưới). Chi tiết ở đầu file `dxf.ts`.
- **Model**: thêm `HatchEntity` (`lib/cad/model.ts`) cho poché tường — cập nhật đủ mọi switch liên
  quan (`geometry.ts` translate/rotate/mirror, `store.ts` scaleEntity, `query.ts` snap/hit-test/
  window-select, `render.ts` vẽ tô đặc).

## 2. DXF — mức "đủ dùng để handoff", KHÔNG phủ hết entity

> **Cập nhật (nhánh `feat/cad-lt-parity`, đã merge):** phần Dimension/Hatch mô tả "lossy có chủ
> đích" bên dưới là hiện trạng của phiên gốc — SAU ĐÓ đã được nâng lên entity THẬT. Xem
> `docs/CAD-LT.md` mục "DXF fidelity đã phủ" để biết trạng thái mới nhất; 2 gạch đầu dòng Hatch/
> Dimension bên dưới được sửa lại cho khớp thực tế hiện tại, các gạch còn lại vẫn đúng như cũ.

`exportDxf()` sinh: `HEADER` ($ACADVER=AC1015, $INSUNITS=4mm, $EXTMIN/$EXTMAX) + `TABLES` (bảng
`LAYER` — mọi entity đều tham chiếu 1 layer có khai báo, tránh lỗi "orphan layer" kinh điển) +
`ENTITIES` (LINE/LWPOLYLINE/CIRCLE/ARC/TEXT/DIMENSION/HATCH). Đơn giản hoá có chủ đích:

- **Block furniture → phẳng hoá** thành LINE/POLYLINE/CIRCLE/ARC ở toạ độ world (không có
  `BLOCKS`/`BLOCK_RECORD`/`INSERT` thật) — mất "tính block" khi mở ở CAD khác, nhưng cấu trúc file
  đơn giản hơn nhiều và không có gì để hỏng. **Vẫn đúng như cũ** — chưa làm BLOCK/INSERT thật cho
  furniture (xem §4).
- **Hatch: 2 trường hợp khác nhau.** Poché tường tự sinh từ lệnh `WALL` (không đặt `pattern`) vẫn
  xuất đường bao LWPOLYLINE khép kín, KHÔNG tô — giữ nguyên hành vi cũ, ưu tiên an toàn cấu trúc.
  Nhưng lệnh `Hatch` (`H`, Nấc 4) riêng — pick 1 điểm trong vùng kín, dò biên thật + chọn pattern
  ANSI31/ANSI32/ANSI37/SOLID/DOTS — xuất entity `HATCH` THẬT (boundary path + pattern/scale/góc
  đúng chuẩn acad.pat), xem `lib/cad/hatch.ts` + `lib/cad/dxf.ts` (case `'HATCH'`).
- **Dimension: nay xuất entity `DIMENSION` THẬT** (aligned/radius/diameter/angular) + block ẩn
  danh `*Dn` chứa hình vẽ (gióng/kích thước/mũi tên/text) trong `BLOCKS`/`BLOCK_RECORD` của
  `TABLES` — không còn chỉ LINE+TEXT rời như trước. Xem `lib/cad/dxf.ts` (case `'DIMENSION'`,
  ghi chú "Nấc 3").
- **Tên layer bỏ dấu tiếng Việt** (`Tường`→`Tuong`…) khi ghi vào `TABLES`/entity — vì symbol name
  trong DXF cũ hẹp ký tự hơn nội dung TEXT thường; nội dung TEXT (nhãn phòng, ghi chú) **vẫn giữ
  tiếng Việt có dấu** vì đó chỉ là dữ liệu chuỗi (group code 1), không phải symbol name.

**Đã test bằng gì**: `lib/cad/dxf.roundtrip.test.ts` (chạy bằng
`node_modules/.bin/sucrase-node lib/cad/dxf.roundtrip.test.ts` — repo chưa có Jest/Vitest, dùng
`sucrase-node` sẵn có trong `node_modules` để không đụng `package.json`). Số ban đầu (phiên gốc)
là 28/28 assertion: round-trip 1:1 cho line/polyline/rect/circle/arc/text, hành vi lossy có chủ
đích cho dim/hatch/block đúng như tài liệu hoá lúc đó, cấu trúc SECTION/TABLE cân bằng, layer
routing đúng sau round-trip. **Sau nâng cấp DIMENSION/HATCH thật (`feat/cad-lt-parity`), file này
đã lên 46 test** (bổ sung round-trip cho DIMENSION/HATCH thật + lineweight/linetype) — xem
`docs/CAD-LT.md` mục "Test coverage" cho số hiện tại của toàn bộ mảng CAD-LT.

**CHƯA test**: mở file thật trong AutoCAD/BricsCAD/LibreCAD (môi trường này không có 3 phần mềm
đó) — chỉ tự-kiểm bằng parser tự viết của chính app. Đề nghị dev mở thử 1 lần bằng mắt (xuất DXF từ
demo plan, mở ở 1 trong 3 phần mềm) trước khi tin tưởng hoàn toàn.

## 3. Bug đã sửa trong lúc đọc code

1. **`parseDxf()` luôn seed sẵn 4 layer mặc định của app** (`Tường/Nội thất/Kích thước/Ghi chú`)
   trước khi đọc file — vì tên layer bị bỏ dấu lúc export (`Tuong`…) không khớp lại tên có dấu gốc,
   mọi lần import (kể cả tự export rồi mở lại) đều dư ra layer rỗng trùng lặp. Sửa: parse bắt đầu
   từ danh sách layer RỖNG, chỉ tạo layer theo đúng nội dung file (fallback về `'0'` nếu file rỗng
   để `currentLayer` không bị `undefined`).
2. **`titleBlock()` phát sinh `TEXT` rỗng** khi không truyền `date`/`author` — vô hại khi vẽ nhưng
   thừa entity + fail 1 assertion sanity-check (text rỗng). Sửa: chỉ push entity khi có nội dung.
3. **3 lỗi lint tồn tại sẵn trên `main`** (không phải do phiên này gây ra, tiện sửa vì rẻ):
   `Tool` import thừa không dùng + `useEffect` import thừa không dùng (`CadCanvas.tsx`/
   `CadEditor.tsx`), `let px` không bao giờ gán lại → đổi `const` (`CadCanvas.tsx` `drawGrid`).

## 4. Còn lại / rủi ro (KHÔNG phải việc của chặng 1 — để ngỏ cho EFC nếu cần)

- ~~TRIM/EXTEND/FILLET/CHAMFER, HATCH pattern thật, DIMENSION chuẩn AutoCAD~~ — **ĐÃ LÀM** (nhánh
  `feat/cad-lt-parity`, đã merge, ngoài phạm vi DD ban đầu của roadmap này): TRIM/EXTEND/FILLET/
  CHAMFER/ARRAY/SCALE/STRETCH/BREAK/JOIN/EXPLODE/LENGTHEN có thật trong `lib/cad/modify.ts` (test
  `lib/cad/modify.test.ts`, 59 assertion); DIMENSION entity thật (4 kiểu) + HATCH entity thật
  (pattern ANSI31/32/37/SOLID/DOTS qua lệnh `Hatch` riêng) trong `lib/cad/dxf.ts` (test
  `lib/cad/dxf.roundtrip.test.ts`, 46 assertion — không phải `sprint10-precision.test.ts`, file đó
  là 1 việc khác của Sprint 10: nhập toạ độ chính xác + polygon/ellipse/spline/divide-measure).
  Xem bảng tiến độ đầy đủ ở `docs/CAD-LT.md`.
- Vẫn **CHƯA làm**, đúng như định hướng ban đầu, để ngỏ cho EFC nếu cần: BLOCK/INSERT thật cho
  furniture (vẫn phẳng hoá — cố ý), XREF, PDF underlay, dynamic block, layer states, ống lệnh
  script, STYLE table cho text, TEXT/MTEXT edit tại chỗ, paper space/in ấn thật, panel
  Properties/MATCHPROP/AREA (xem Nấc 5-8 "Chưa"/"Một phần" trong `docs/CAD-LT.md`).
- AI-assist mới rule-based (regex kích thước + từ khoá) — không hiểu câu phức tạp/nhiều phòng
  cùng lúc; đủ cho demo nhanh 1 phòng, không phải NLU thật.
- WALL/ROOM không cắt lỗ tường tại vị trí cửa (chỉ đặt chồng block cửa lên tường) — chấp nhận được
  ở mức sơ phác trình bày, không phải kỹ thuật chính xác.
- Toolbar pill (`CadToolbar.tsx`) tràn ở khung rất hẹp (~<500px) — không wrap, không có overflow
  menu; chỉ quan sát khi test ở viewport hẹp, chưa sửa (ngoài phạm vi chính của phiên này, cần dịp
  làm responsive riêng).
- Demo plan: hướng mở cửa/hướng đặt vài món nội thất là ước lượng hợp lý theo công thức xoay của
  `blockLocalToWorld`, đã verify bằng mắt qua trình duyệt (grid/tường/nhãn/kích thước/khung tên/
  thước tỉ lệ hiển thị đúng) nhưng CHƯA soi từng món nội thất ở độ phóng to cao — dev nên tự mở
  `/cad-editor` → "Mở bản demo" → phóng to kiểm từng phòng nếu cần dùng demo này cho khách xem.
