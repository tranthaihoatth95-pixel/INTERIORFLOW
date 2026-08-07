# M-BUILD-OPS-OUT — báo cáo phiên CODE build-ops (07/08, G-M17-02)

Sở hữu: `lib/three/build-ops.ts` · `lib/three/csg.ts` (+ `build-ops.test.ts` — test của file sở hữu).
**KHÔNG chạm**: `components/three` · `components/render-studio` · `lib/materials` · `lib/cad` ·
`lib/three/cad-to-obj.ts` — đã kiểm `git status --short lib/three/` chỉ 2 file `M`:
`build-ops.ts` + `build-ops.test.ts`. `csg.ts` đọc, KHÔNG cần sửa (booleanOp đủ dùng).
**V6: KHÔNG commit** — chỉ sửa file + báo cáo. Không đụng git.

## Tóm tắt — mỗi dòng một bằng chứng (N8)

| Việc | Hàm | Vị trí | Test đo hình học |
|---|---|---|---|
| **1 BEVEL** | `prismBeveledEx()` — bán kính mm · segments · edges `'all'/'vertical'/'top'` | `build-ops.ts:295` | ring 45° co đúng `5·(1−cos45°)≈1.464mm` (`build-ops.test.ts`, khối "segments=4") |
| **1 CHAMFER** | `prismChamfered()` = bevel 1 đoạn, cùng cỗ máy | `build-ops.ts:350` | nắp trên co ĐÚNG 5mm mỗi phía, vai z=95 giữ nguyên bề rộng |
| **1 fillet 2D** | `filletPolygonMm()` — bo góc đứng, tiếp tuyến `t=r·tan(θ/2)` | `build-ops.ts:242` | vuông 100 r=10: 20 đỉnh, tiếp tuyến (10,0)/(0,10), điểm cung cách tâm đúng r |
| **2 ARRAY lưới** | `arrayGrid()` nx×ny×nz, bước mm từng trục CAD | `build-ops.ts:387` | 2×3×1 bước (500,400): ×6 vertex, bbox 600×900 đúng |
| **2 ARRAY tròn** | `arrayRadial()` quanh trục đứng, sweepDeg tuỳ chọn | `build-ops.ts:418` | n=4: bản i=1 nằm ĐÚNG toạ độ quay CCW 90° (100,−50)→(50,100) |
| **2 MIRROR** | `mirrorGeometry()` mặt gương ⊥ trục CAD tại `atMm` | `build-ops.ts:446` | qua x=0: bbox −200..200, `withOriginal:false` chỉ còn phía soi |
| **3 SWEEP** | `sweepProfile()` — tiết diện quét dọc polyline, miter phân giác | `build-ops.ts:471` | phào 50×80 dọc 3000mm: bbox đúng 3 chiều; rẽ L: mép ngoài góc x=2025 đúng |
| **3 REVOLVE** | `revolveProfile()` — dùng `THREE.LatheGeometry` sẵn có | `build-ops.ts:537` | trụ r=50 cao 700 tâm (1000,1000): bbox 950..1050 cả 2 trục |
| **3 LOFT** | `loftSections()` — chuỗi tiết diện nhiều cao độ | `build-ops.ts:561` | đáy 400→nắp 200 đo đúng; KHÁC số đỉnh → hình rỗng, không sập |
| **4 TAPER** | `prismTapered()` — co đỉnh `topInsetMm` mm thật | `build-ops.ts:583` | 60×60 co 20: đỉnh 20..40mm; co 999 → rơi về lăng trụ thẳng |
| nền chung | `TriSink` (tam giác mm→BufferGeometry m) · `replicate()` (ma trận, det<0 tự đảo winding) | `build-ops.ts:144` · `:358` | mirror không lộn mặt tam giác (đảo thứ tự đỉnh khi det<0) |

**Quy ước chung** (ghi ở docstring khối "BỘ LỆNH DỰNG HÌNH MỞ RỘNG", `build-ops.ts` sau
`resolveGroupGeometry`): mọi tham số = **SỐ THẬT mm hệ CAD**, mọi hàm trả `BufferGeometry` hệ
three mét Y-up qua `cadToThreeM` — trộn thẳng với hình học từ `SceneGroup.positions`.
**Không thư viện ngoài** — chỉ `three` (MIT, dep sẵn, đã đối chiếu `docs/LICENSE-NOTES.md` §5).

## Verify

- `node_modules/.bin/sucrase-node lib/three/build-ops.test.ts` → **51 pass, 0 fail**
  (16 test cũ resolveGroupGeometry/cache/arrayLinear giữ nguyên xanh + 35 test mới ĐO hình học:
  toạ độ vertex, bbox, đếm ring — không phải "chạy không lỗi").
- `csg.test.ts` 6/6 · `cad-to-obj.test.ts` 74 pass **1 fail CŨ đã biết** (entityId nội thất,
  STATUS.md ghi từ trước — không phải hồi quy phiên này).
- `npx tsc --noEmit -p .` toàn repo chạy nền → **exit 0**.
- **Nghiệm thu N6 thị giác**: `docs/screenshots/build-ops-dot1-2026-08-07.png` (+ bản `.svg` CÓ
  NHÃN chữ cạnh bên) — 6 panel render TỪ CHÍNH BufferGeometry các hàm trả về (rasterizer isometric
  + flat-shading thuần Node trong scratchpad, không vẽ minh hoạ tay): ① hộp cạnh sắc · ② chamfer
  5mm · ③ bevel r5 seg6 (so cạnh trước/sau thấy rõ mặt vát ↔ vành bo tròn) · ④ sweep phào chữ L ·
  ⑤ revolve chân bàn tiện · ⑥ taper côn. Đã mở ảnh xem thật trước khi báo (§0o); đã kiểm byte
  PNG (mọi pixel nền = 246, filter row = 0 — vệt đỏ khi xem qua tool đọc ảnh là artifact viewer).

## Hai phát hiện kỹ thuật đáng tiền

1. **`insetPolygonMm` (cad-to-obj.ts:75) KHÔNG phải offset thật** — nó dịch mỗi ĐỈNH `d` mm theo
   phân giác (kế thừa `offsetEntity` hatch): góc vuông chỉ lùi MẶT `d/√2 ≈ 0,707d`. "Vát 5mm"
   qua nó thực tế chỉ vát ~3,54mm. Lệnh mới cam kết mm thật (TB1 §0f) nên viết
   `offsetPolygonInwardMm()` (`build-ops.ts:180`) — mỗi CẠNH lùi đúng `d`, đỉnh = giao 2 cạnh đã
   lùi. **KHÔNG sửa `insetPolygonMm`** (ngoài vùng + `prismBeveled` cũ đang dựa ngữ nghĩa cũ,
   đổi là đổi hình người dùng đã lưu). ⚠️ Hệ quả cần TỔNG biết: bevel CŨ qua
   `setEntityBevel`/`prismBeveled` đang vát non ~29% so số khai — sửa hay giữ là quyết định
   riêng (đổi hình dữ liệu cũ), KHÔNG tự quyết trong phiên này.
2. **Bẫy co-quá-đà đối xứng**: co vượt nửa bề rộng làm đa giác LỘN QUA TÂM nhưng chiều duyệt vẫn
   CCW → check `signedArea>0` (cách `insetPolygonMm` đang dùng) KHÔNG bắt được. Bắt bằng test
   thật (vuông 60 co 999 → đỉnh phình ±939mm), chặn bằng tiêu chí "cạnh sau offset phải CÙNG
   CHIỀU cạnh gốc" (`build-ops.ts:180`, khối comment "Bẫy co-quá-đà ĐỐI XỨNG").

## Quyết định tự chọn (không dừng hỏi, ghi lý do)

- **CHƯA nối vào `ops[]`/`BuildOp`** — kiểu `BuildOp` sống ở `lib/cad/model.ts:446` (vùng CẤM
  `lib/cad`). Các hàm là TẦNG ENGINE thuần; nối persist (`ops[]` union mới) + UI (Inspector/
  Command3DPanel — vùng S2/components) là việc phiên sau. Đúng thứ tự luật vận hành 7 "năng lực
  → nút → AI": năng lực đã có + test; nút chưa có thì §9 đã có sẵn 11 nút `disabled` trong
  `ToolDock3D.tsx` (M-3D-OUT 2b) chờ nối — trong đó "Bo cạnh" nay ĐÃ có engine.
- **KS4 (lùi được)**: hàm thuần không ghi `Doc`, không mutate input (`replicate`/`TriSink` đều
  tạo mảng mới) — tham số đổi là gọi lại ra hình mới; undo thật nằm ở tầng `ops[]` khi nối sau.
- **Loft KHÁC số đỉnh trả hình RỖNG** thay vì tự resample — resample tự động dễ xoắn thầm lặng
  (đỉnh ghép lệch), thà caller kiểm `count===0` và báo người dùng.
- **Bevel edges='all' KHÔNG bo cạnh ĐÁY** — khối nội thất đặt trên sàn, cạnh chạm sàn không nhìn
  thấy; ghi rõ trong docstring `prismBeveledEx`, không phải bỏ sót.
- **`arrayRadial` vòng kín chia n** (bản cuối không đè bản đầu), vòng hở chia n−1 — khớp hành vi
  Radial Array của 3ds Max.

## CHƯA VERIFY / còn treo

- 🟡 Chưa nhìn thấy trong APP THẬT — chưa có đường UI gọi tới (chưa nối `ops[]`, xem trên); ảnh
  nghiệm thu là render trực tiếp từ BufferGeometry, không phải chụp màn app.
- 🟡 `sweepProfile` chưa xử lý path 3D nghiêng (z đổi giữa đường — profile luôn dựng đứng theo
  phương Z, tay vịn cầu thang DỐC sẽ bị tiết diện trượt đứng thay vì vuông góc dốc). Phào chỉ/
  nẹp chân tường (path ngang, ca dùng hằng ngày) đúng hoàn toàn. Ghi để đợt sau, không giấu.
- 🟡 `filletPolygonMm` với đa giác LÕM: công thức phân giác đúng cho cả góc lồi/lõm về mặt toán,
  test mới chỉ đo đa giác lồi (vuông) — ca lõm CHƯA VERIFY bằng test.
- File scratch (renderer + debug) nằm trong scratchpad phiên, tự huỷ — không rác repo.
