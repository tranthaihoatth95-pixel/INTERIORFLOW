# Báo cáo phiên P — hiệu năng đo (Đợt 5, 13/08/2026)

Phiếu: `docs/phieu-giao/hieu-nang-do.md`. Vùng file: `scripts/bench/**` (mới) · file báo cáo này.
Việc là **ĐO**, không tối ưu — 0 dòng code sản phẩm bị sửa (đã kiểm `git status` cuối phiên, xem mục
"File sửa/tạo"). Không git commit, không dev server, không prisma — đúng ràng buộc ⑤.

## Vì sao việc này — bối cảnh trụ 7

Trụ 7 (Hiệu năng & bền) đói 2 đợt liên tiếp. IF chưa có MỘT con số thật nào về điểm gãy trên Doc
lớn (5.000+ entity) / scene 3D nặng (100k+ tam giác) — R1 Cửa B cần số trước khi cần vá. Phiên này
ra bảng số + xác định nghi phạm; sửa là việc đợt sau.

## File sửa/tạo

| File | Loại | Nội dung |
|---|---|---|
| `scripts/bench/bench-util.ts` | MỚI | `timeMs()` đo `process.hrtime.bigint()`, lặp ≥5 lấy MEDIAN · `printTable()` in bảng dán được · `growthFactor()` tính hệ số phi tuyến. |
| `scripts/bench/gen-doc.ts` | MỚI | `genDoc(targetEntities, seed)` — sinh `Doc` TẤT ĐỊNH (PRNG mulberry32, KHÔNG `Math.random`): lưới phòng W×H, mỗi phòng 4 tường `HatchEntity` poché + 1 `RoomEntity` + 1 `TextEntity` nhãn + 2 `BlockEntity` nội thất (id thật từ `lib/cad/furniture.ts`) + 1 `DimEntity` = 9 entity/phòng. ~2% tường mang `ops` 2 bậc (boolean + arrayLinear); ĐÚNG 1 tường (phòng cuối lưới, cố định) mang `recipe` 10 bước. |
| `scripts/bench/bench-2d.ts` | MỚI | round-trip `exportIdf`/`importIdf` · `findHatchBoundary` (đường CŨ dựng+hỏi mỗi lần so với đường ĐÃ VÁ dựng 1+hỏi N) · `hitTest` · `detectRooms`. Ma trận 500/2.000/5.000, median 5 lần, bảng hệ số tăng trưởng. |
| `scripts/bench/bench-3d.ts` | MỚI | `docToObjScene` (tam giác đếm thật qua `stats.faces`) · `resolveGroupGeometry` trên tường có `ops` · `evalRecipe` trên tường có `recipe` 10 bước. Cùng ma trận + bảng hệ số tăng trưởng. |

Không sửa file nào ngoài `scripts/bench/**` — chỉ ĐỌC (import) `lib/cad/model.ts`, `lib/cad/idf.ts`,
`lib/cad/hatch.ts`, `lib/cad/query.ts`, `lib/cad/room.ts`, `lib/three/cad-to-obj.ts`,
`lib/three/build-ops.ts`, `lib/three/build-recipe.ts`.

## Lệnh chạy lại (dán nguyên văn)

```
$ npx tsc --noEmit
exit=0

$ node_modules/.bin/sucrase-node scripts/bench/bench-2d.ts
$ node_modules/.bin/sucrase-node scripts/bench/bench-3d.ts
```

Cả hai script tự sinh Doc (không cần file `.idf` ngoài), tự in bảng, KHÔNG cần browser/dev server.
`bench-3d.ts` in kèm cảnh báo vô hại của thư viện CSG (`BVH: "maxLeafSize" option has been
deprecated…`, từ `three-bvh-csg` — KHÔNG phải lỗi của phiếu này, đã lọc khỏi bảng dưới).

Đã chạy LẶP LẠI cả hai script 2 lần độc lập để xác nhận tính tất định: mọi số liệu KHÔNG PHỤ THUỘC
THỜI GIAN (số entity, số tam giác, số hits, kích thước JSON, hệ số nhân recipe) **giống hệt nhau
byte-for-byte** giữa các lần chạy; chỉ số ms dao động vài % (nhiễu máy — GC/context-switch, dùng
median 5 lần để giảm ảnh hưởng, đúng ràng buộc phiếu).

## [1] BENCH 2D — dán nguyên văn

```
=== BENCH 2D — InteriorFlow (Doc lớn, tất định, seed cố định) ===

--- N mục tiêu=500 → thực tế 507 entity (lưới 1×56=56 phòng · tường 224 · block 112 · dim 56 · text 56 · cutter 3) ---
--- N mục tiêu=2000 → thực tế 2004 entity (lưới 1×222=222 phòng · tường 888 · block 444 · dim 222 · text 222 · cutter 6) ---
--- N mục tiêu=5000 → thực tế 5017 entity (lưới 1×556=556 phòng · tường 2224 · block 1112 · dim 556 · text 556 · cutter 13) ---

[1] Round-trip exportIdf → importIdf (median 5 lần, ms)
entity | export ms | import ms | tổng ms | JSON (KB)
-------|-----------|-----------|---------|----------
507    | 0.30      | 0.50      | 0.79    | 77
2004   | 1.20      | 1.76      | 2.96    | 304
5017   | 2.98      | 5.02      | 7.99    | 769

[2] findHatchBoundary — đường CŨ (dựng+hỏi MỖI lần, lệnh H) đo trên mẫu 24 lần gọi (ĐO THẬT) rồi NHÂN RA (SUY RA, ghi rõ) cho đủ #hỏi thật; so với đường ĐÃ VÁ (dựng 1 lần + hỏi ĐỦ #hỏi thật, ĐO THẬT toàn bộ)
entity | #hỏi thật | CŨ ms/lần (đo) | CŨ tổng SUY RA (ms) | VÁ dựng ms (đo) | VÁ hỏi ms (đo) | VÁ tổng ms (đo) | lần nhanh hơn (suy ra ÷ đo)
-------|-----------|----------------|---------------------|-----------------|----------------|-----------------|----------------------------
507    | 112       | 2.037          | 228.15              | 1.90            | 0.09           | 1.98            | 115.0×
2004   | 444       | 8.911          | 3956.48             | 9.37            | 1.31           | 10.69           | 370.3×
5017   | 1112      | 38.370         | 42667.61            | 37.24           | 8.72           | 45.96           | 928.3×

[3] hitTest — 200 điểm tất định/lần (median 5 lần, ms)
entity | #hỏi | tổng ms | µs/hỏi | hits
-------|------|---------|--------|-----
507    | 200  | 16.65   | 83.3   | 28
2004   | 200  | 65.48   | 327.4  | 23
5017   | 200  | 170.78  | 853.9  | 29

[4] detectRooms (findRoomLabels + buildHatchFaceIndex, idempotent — proposals kỳ vọng 0)
entity | ms    | proposals | alreadyRooms | unresolved
-------|-------|-----------|--------------|-----------
507    | 2.86  | 0         | 56           | 0
2004   | 10.21 | 0         | 222          | 0
5017   | 39.51 | 0         | 556          | 0

[5] Hệ số tăng trưởng so N (kỳ vọng O(n) ⇒ hệ số ≈1×; > ~1.5× là nghi phạm phi tuyến)
hàm                                                   | N         | N×    | hệ số thời gian
------------------------------------------------------|-----------|-------|----------------
round-trip (export+import)                            | 507→2004  | 3.95× | 0.94×
round-trip (export+import)                            | 2004→5017 | 2.50× | 1.08×
findHatchBoundary (đường VÁ, dựng+hỏi, ĐO THẬT)       | 507→2004  | 3.95× | 1.36×
findHatchBoundary (đường VÁ, dựng+hỏi, ĐO THẬT)       | 2004→5017 | 2.50× | 1.72×
findHatchBoundary (CŨ, ms/lần gọi — ĐO THẬT trên mẫu) | 507→2004  | 3.95× | 1.11×
findHatchBoundary (CŨ, ms/lần gọi — ĐO THẬT trên mẫu) | 2004→5017 | 2.50× | 1.72×
hitTest                                               | 507→2004  | 3.95× | 0.99×
hitTest                                               | 2004→5017 | 2.50× | 1.04×
detectRooms                                           | 507→2004  | 3.95× | 0.90×
detectRooms                                           | 2004→5017 | 2.50× | 1.55×
```

## [2] BENCH 3D — dán nguyên văn (đã lọc dòng cảnh báo BVH vô hại)

```
=== BENCH 3D — InteriorFlow (docToObjScene / resolveGroupGeometry / evalRecipe) ===

[1] docToObjScene (median 5 lần, ms) — tam giác ĐẾM THẬT qua stats.faces
entity | ms    | faces(tam giác) | verts | walls | furniture | rooms | #warnings
-------|-------|-----------------|-------|-------|-----------|-------|----------
507    | 15.46 | 2358            | 3144  | 224   | 112       | 56    | 0
2004   | 25.85 | 9330            | 12440 | 888   | 444       | 222   | 0
5017   | 72.12 | 23358           | 31144 | 2224  | 1112      | 556   | 0

Mốc 100.000 tam giác ở ~5.000 entity (đo thật 23358 faces): CHƯA đạt qua đường docToObjScene thường (không recipe/ops).

[2] resolveGroupGeometry — tường mang ops 2 bậc (boolean subtract + arrayLinear ×3), ~2% tổng số tường
entity | #tường có ops | tổng ms | ms/tường | tổng tam giác kết quả
-------|---------------|---------|----------|----------------------
507    | 1             | 3.49    | 3.492    | 117
2004   | 4             | 4.81    | 1.202    | 468
5017   | 11            | 5.49    | 0.499    | 1287

[3] evalRecipe — 1 tường đại diện (Doc N=5000), recipe 10 bước (KHÔNG scale theo N)
chỉ số                      | giá trị
----------------------------|--------
ms (median 5 lần)           | 4.46
tam giác GỐC (trước recipe) | 12
tam giác SAU (10 bước)      | 7920
hệ số nhân                  | 660.0×
#bước lỗi (kỳ vọng 0)       | 0

[4] Hệ số tăng trưởng so N (kỳ vọng O(n) ⇒ hệ số ≈1×)
hàm                         | N         | N×    | hệ số thời gian
----------------------------|-----------|-------|----------------
docToObjScene               | 507→2004  | 3.95× | 0.42×
docToObjScene               | 2004→5017 | 2.50× | 1.11×
resolveGroupGeometry (tổng) | 507→2004  | 3.95× | 0.35×
resolveGroupGeometry (tổng) | 2004→5017 | 2.50× | 0.46×
```

## Điểm gãy phi tuyến — nghi phạm kèm bằng chứng số

### 🔴 Nghi phạm #1 — `pickHatchFace()` (`lib/cad/hatch.ts:502`): vòng lặp TUYẾN TÍNH qua TOÀN BỘ
mặt (`faces`) MỖI LẦN hỏi, không có cấu trúc không gian (R-tree/lưới) cắt bớt ứng viên trước khi
`pointInPolygon`.

Bằng chứng: bảng `[2]` bench-2d, cột "VÁ hỏi ms" (thời gian của RIÊNG bước hỏi N lần, KHÔNG tính
dựng chỉ mục):

| N (entity) | #hỏi (~ tỉ lệ N) | #mặt (~ tỉ lệ N) | VÁ hỏi ms | hệ số so N |
|---|---|---|---|---|
| 507→2004 | 112→444 (×3,95) | ~56→222 phòng (×3,95) | 0,09→1,31 (×14,6) | **3,7×** |
| 2004→5017 | 444→1112 (×2,50) | ~222→556 phòng (×2,50) | 1,31→8,72 (×6,7) | **2,7×** |

`pickHatchFace` là **O(#hỏi × #mặt)**: cả #hỏi (số nội thất) VÀ #mặt (số phòng) đều tỉ lệ thuận với
N ⇒ tổng chi phí bước hỏi tỉ lệ **O(N²)**. Khớp số đo: N×2,50 nhưng thời gian bước hỏi ×6,7 ≈ 2,50²
= 6,25 (lệch 7% — đúng bậc bình phương, không phải bậc 1). Đây LÀ điểm gãy thật, KHÁC với lỗi đã vá
05/08 ghi ở `docs/TECH-DEBT.md` (lỗi cũ: dựng lại chỉ mục MỖI lần hỏi — đã vá, xác nhận "VÁ dựng ms"
trong bảng chỉ tăng gần tuyến tính 1,36×/1,72× so N, không phải bình phương). Nghi phạm MỚI nằm ở
CHÍNH bước hỏi sau khi đã có chỉ mục — bbox-prefilter (`hatch.ts:511`) giảm bớt nhưng không đổi bậc
độ phức tạp vì vẫn duyệt tuần tự toàn bộ mảng `faces`.

Người tiêu thụ thật của `pickHatchFace` theo vòng lặp N-hỏi: `lib/three/cad-to-obj.ts:649`
(`docToObjScene`, 1 lần hỏi/món nội thất) và `lib/cad/standards/checker.ts:144`
(`findRoomLabels`, 1 lần hỏi/nhãn TEXT) — cả hai đều nằm trên đường THẬT app đang chạy (không phải
đường giả lập trong bench). `detectRooms` (bảng `[4]`, gọi `findRoomLabels` bên trong) cũng lộ dấu
hiệu tương tự — hệ số 1,55× ở 2004→5017, trên ngưỡng 1,5× nhưng nhẹ hơn phép đo trực tiếp ở trên
(vì phần lớn thời gian `detectRooms` là dựng chỉ mục 1 lần + so `ringKey`, không lặp hỏi nhiều như
bench `[2]` trực tiếp).

**Không sửa ở phiên này** (đúng luật "ĐO, không TỐI ƯU") — đề xuất phiên sau: thêm bbox chỉ mục
không gian (grid cố định hoặc R-tree nhẹ) cho `HatchFaceIndex.bboxes` để lọc trước `pointInPolygon`,
biến bậc `O(#hỏi × #mặt)` thành gần `O(#hỏi × log #mặt)`.

### 🟡 Nghi phạm #2 — đường CŨ `findHatchBoundary(doc, pick)` (dựng+hỏi mỗi lần bấm)

Không phải điểm gãy MỚI — đây LÀ đúng cái đã đo và vá 05/08 (`docs/TECH-DEBT.md`), phiên này CHỈ
xác nhận vá còn đứng vững trên Doc mới (hỗn hợp nhiều loại entity hơn `denseDoc()` gốc, có thêm
`RoomEntity`/`DimEntity` góp đoạn biên). Số đo mẫu 24 lần gọi thật: chi phí/lần gọi tăng từ 2,0ms
(N=507) → 38,4ms (N=5017), tức **19× chậm hơn cho 10× entity** — vẫn xấp xỉ tuyến tính theo #đoạn
biên (không phải bình phương), khớp với "vá đợt 1" (spatial grid cho `splitAtIntersections`) đã có
sẵn. NẾU dùng đường này thay vì chỉ mục (VD lệnh H bấm 1.112 lần liền — không thực tế nhưng để có
số): SUY RA (không đo trực tiếp, ghi rõ) ~42,7 giây, so với đường VÁ đo thật chỉ 46ms — **928× chậm
hơn**. Không phải bug mới; ghi lại để phiên sau không lo nhầm đường CŨ vẫn đang chạy trong sản phẩm
(không — chỉ `findHatchBoundary` export cho lệnh H 1-điểm-bấm mới dùng đường này, đúng thiết kế).

### 🟢 `docToObjScene` — KHÔNG có dấu hiệu phi tuyến trong dải đã đo

Hệ số tăng trưởng 0,42×/1,11× (bảng `[4]` bench-3d) — điểm đầu (N=507→2004) dưới 1× là hiệu ứng khởi
động JIT (lần chạy N=507 luôn LÀ lệnh gọi ĐẦU TIÊN của `docToObjScene` trong tiến trình node, các
module `three`/`three-bvh-csg` mới nạp lần đầu). Điểm thứ hai (2004→5017, ×2,50 N ⇒ ×1,11 thời gian)
mới phản ánh đúng hành vi ổn định — GẦN tuyến tính, dưới ngưỡng nghi phạm. Tam giác sinh ra tỉ lệ
thuận N như kỳ vọng (2.358 → 9.330 → 23.358).

### ⚠️ Ghi chú đo — `resolveGroupGeometry` mẫu nhỏ (N=507 chỉ có 1 tường mang `ops`)

Hệ số ms/tường GIẢM dần khi N tăng (3,49 → 1,20 → 0,50 ms/tường) — **KHÔNG đọc là "càng nhiều entity
càng nhanh"**. Nguyên nhân nhiều khả năng là khởi động nguội của `three-bvh-csg`/BVH (lần CSG ĐẦU
TIÊN trong tiến trình luôn có phần dựng cấu trúc nội bộ lần đầu, không tái diễn ở lần sau) — mẫu ở
N=507 chỉ CÓ 1 tường mang `ops` nên median 5 lần vẫn dính trọn chi phí khởi động đó, còn N=5017 có
11 tường (nhiều lần CSG hơn) nên chi phí khởi động bị pha loãng. Bench đã tự vá lỗi đo nghiêm trọng
hơn (cache `meshCache` theo `entityId` trong `build-ops.ts` khiến 4/5 lần lặp bị "ăn cache" gần 0ms
nếu gọi liên tiếp cùng group — đã sửa bằng cách nhân bản `entityId` DUY NHẤT mỗi lần lặp để LUÔN
buộc tính CSG thật, xem comment trong `bench-3d.ts`). Số liệu SAU khi vá là số THẬT (cache-lạnh mỗi
lần), nhưng cỡ mẫu ở N=507 (1 tường) quá nhỏ để kết luận xu hướng — cần N lớn hơn hoặc lặp riêng
nhiều tường hơn ở đợt sau nếu muốn kết luận chắc.

## Mốc 100.000 tam giác — trả lời trực tiếp

**CHƯA đạt** qua đường `docToObjScene` thường ở N=5.000 entity: 23.358 tam giác (đo thật). Ở tốc độ
tăng gần tuyến tính hiện tại, cần khoảng N≈21.000 entity (SUY RA bằng phép chia tuyến tính đơn giản
23.358→100.000 ⇒ ×4,28 ⇒ N≈5.017×4,28≈21.500 — ghi rõ đây là NGOẠI SUY, chưa đo trực tiếp ở N đó)
để một mặt bằng THƯỜNG (không modifier) chạm mốc.

**NHƯNG** modifier stack (recipe 10 bước) đổi hoàn toàn phép tính: 1 tường đại diện đo thật nhân
660× tam giác (12 → 7.920). Ở N=5.017, có 11 tường mang `ops` đơn giản (2 bậc, không phải 10 bước)
— NẾU cả 11 tường đó dùng `recipe` 10 bước ĐẦY ĐỦ như tường đại diện (SUY RA bằng phép nhân số đo
thật, không đo trực tiếp 11 tường riêng): 11 × 7.920 ≈ 87.120 tam giác chỉ từ nhóm tường đặc biệt
đó, cộng vào 23.358 tam giác nền (trừ đi 11×12=132 tam giác gốc của chính 11 tường đó đã tính
trong nền) ⇒ tổng ≈ 23.358 − 132 + 87.120 ≈ **110.346 tam giác — VƯỢT mốc 100k** dù entity count vẫn
chỉ 5.017 (không đổi). Kết luận: **mốc 100k tam giác không phải hàm của SỐ ENTITY mà là hàm của
SỐ ENTITY × MỨC ĐỘ MODIFIER — một dự án 5.000 entity với vài chục cấu kiện dùng modifier sâu (cầu
thang, vách nan chớp, phào chỉ lặp) có thể vượt mốc dễ dàng, trong khi cùng 5.000 entity không
modifier còn cách mốc rất xa.**

## Kệ ảnh 1.500 món — hàng đợi, KHÔNG bịa số

Đúng ràng buộc ⑤ của phiếu: kệ ảnh (virtualized image library, 1.500 món) cần đo bằng scroll/render
thật trong DOM/browser (layout thrash, ảnh giải mã, virtualization windowing) — KHÔNG đo được bằng
node thuần (không có DOM/canvas/IntersectionObserver trong sucrase-node). **Chưa đo — hàng đợi**,
cần phiên có quyền browser (Playwright/Puppeteer thật hoặc devtools) để đo FPS scroll + thời gian
decode ảnh + memory tại 1.500 món. Không có số nào bịa ra ở đây.

## Quyết định tự chọn khi gặp mơ hồ (kèm lý do)

1. **Tỉ lệ mix entity/phòng (4 tường·1 room·1 text·2 block·1 dim = 9/phòng)** — phiếu chỉ nói
   "hỗn hợp tỉ lệ thật", không cho số cụ thể. Chọn khuôn GIỐNG `denseDoc()` đã có sẵn trong
   `lib/cad/hatch-index.test.ts` (lưới phòng, đã là dữ liệu ĐƯỢC CHẤP NHẬN cho bench hatch trong
   repo này) rồi bổ sung thêm loại entity còn thiếu (room/text/dim) — đơn giản nhất, nhất quán với
   quy ước đã có, không phát minh khuôn dữ liệu mới.
2. **Wall = HatchEntity poché** (không tách riêng polyline biên) — đúng NGHĨA ĐEN trong codebase
   này: docstring `model.ts:150-152` xác nhận tường THẬT VẼ TAY qua lệnh WALL sinh ra
   hatch+polyline CẶP, nhưng bản thân "tường" trong 3D (`wallHatches` filter ở `cad-to-obj.ts:579`)
   CHỈ đọc `HatchEntity` — dùng đúng loại entity mà pipeline 3D thật sự tiêu thụ, không thêm
   polyline dư thừa không ai đọc.
3. **~2% tường mang `ops`, 1 tường mang `recipe` 10 bước (không scale theo N)** — modifier stack là
   tính năng cho CẤU KIỆN ĐẶC BIỆT (cầu thang, vách nan chớp — xem `CHOT` 03/08 "dựng nội thất mà
   không có mấy cái đó là vứt"), KHÔNG đại trà trên mọi tường của một mặt bằng 5.000 entity thật.
   Đo tỉ lệ 100% (mọi tường đều recipe 10 bước) sẽ ra con số không phản ánh cách designer THẬT sử
   dụng tính năng, dễ gây hoảng — chọn tỉ lệ nhỏ + phần "SUY RA nếu áp rộng hơn" ghi rõ ràng thay vì
   đo trực tiếp một kịch bản không thực tế.
4. **Mẫu 24 lần gọi cho đường CŨ `findHatchBoundary`** (không lặp ĐỦ số nội thất thật, có thể tới
   1.112 lần ở N=5.000) — chạy đủ số lần thật × 5 rep sẽ mất ~7 phút chỉ để đo lại điều ĐÃ CHỨNG
   MINH trong `hatch-index.test.ts` (không phải mục tiêu phiếu — mục tiêu là đo đường THẬT app đang
   chạy). Đo mẫu thật (không suy đoán per-call) rồi NHÂN RA, ghi rõ ràng "SUY RA" trong mọi cột liên
   quan — không trộn số đo thật với số suy ra trong cùng một cột.
5. **`REPS=5`** (đúng sàn tối thiểu phiếu, không hơn) — đã đủ để median ổn định (chạy lặp lại toàn
   bộ 2 script 2 lần độc lập, mọi số liệu không-phải-thời-gian khớp tuyệt đối, số liệu thời gian
   dao động dưới ~15%) — không cần REPS cao hơn cho mục tiêu "tìm điểm gãy" (khác mục tiêu "đo chính
   xác tuyệt đối 1 con số", vốn không phải yêu cầu của phiếu này).

## 2 GIÁ TRỊ (khuôn §1c HOP-DONG)

**Kiến trúc.**
- [tính năng] Xác nhận bằng số: vá 05/08 (dựng chỉ mục 1 lần + hỏi N lần thay vì dựng lại mỗi lần)
  vẫn đứng vững trên Doc hỗn hợp mới, NHƯNG lộ ra một tầng chi phí thứ hai CHƯA từng đo:
  `pickHatchFace` tự nó là O(#hỏi × #mặt) vì duyệt tuyến tính toàn bộ mảng `faces` mỗi lần hỏi —
  đây là nghi phạm phi tuyến THẬT SỰ (không phải nghi ngờ), có công thức + số đo khớp bậc hai rõ
  ràng, khác hẳn phần đã vá. `docToObjScene`/tam giác cơ bản tăng gần tuyến tính trong dải đã đo —
  KHÔNG phải chỗ cần lo ở quy mô 500-5.000 entity thường.
- [tính năng] Mốc "100.000 tam giác" không phải hàm 1 biến (số entity) như tên gọi hay bị hiểu nhầm
  — nó là hàm CỦA CẶP (số entity, mức độ modifier). Một `BuildRecipe` 10 bước có thể nhân 660× tam
  giác của MỘT cấu kiện — vài chục cấu kiện dùng modifier sâu trên một mặt bằng 5.000 entity đã đủ
  vượt mốc, trong khi mặt bằng thường (0 modifier) cần ~21.000 entity mới chạm.

**Vận hành-sử dụng.**
- [tính năng] Với người dùng thật: mặt bằng dày đặc (nhiều phòng/nội thất) mà THƯỜNG XUYÊN bấm lệnh
  H (vẽ hatch tay, dò biên 1 điểm) vẫn AN TOÀN (đường CŨ chỉ chạy 1 lần/lần bấm, không lặp hàng
  nghìn lần) — rủi ro thật nằm ở các THAO TÁC HÀNG LOẠT tự động gọi `pickHatchFace` nhiều lần trong
  một khung hình/một lần render (dựng 3D toàn bộ mặt bằng, nhận diện phòng hàng loạt) — cả hai đã có
  trong code (`docToObjScene`, `detectRooms`) và đều lộ dấu hiệu tăng nhanh hơn tuyến tính khi N lớn.
- [tính năng] Với designer dùng modifier stack (Công Thức Khối): mỗi bước `arrayLinear`/`arrayRadial`/
  `mirror` NHÂN tam giác, không CỘNG — xếp chồng 5-6 bước nhân (đúng như recipe mẫu ở đây) ra hệ số
  hàng trăm lần chỉ trên MỘT cấu kiện. Không phải lỗi (đúng ý đồ modifier stack), nhưng là điều nên
  CẢNH BÁO người dùng khi họ xếp nhiều bước nhân liên tiếp trên cấu kiện lặp lại nhiều lần trong mặt
  bằng (VD nan chớp lặp 50 lần × mirror × array trong cùng 1 recipe) — vượt mốc tam giác nhanh hơn
  trực giác "N entity nhỏ thì scene nhẹ".

## CHƯA LÀM — nói thẳng

- **Không sửa `pickHatchFace`** dù đã xác định rõ nghi phạm — đúng luật "ĐO, không TỐI ƯU" của
  phiếu. Đề xuất phiên sau (nếu T duyệt mở phiếu vá): thêm chỉ mục không gian (grid cố định theo
  bbox, không cần thư viện ngoài) vào `HatchFaceIndex` để giảm bậc từ O(#mặt) xuống gần O(log #mặt)
  mỗi lần hỏi.
- **Kệ ảnh 1.500 món chưa đo** — cần browser thật (Playwright/devtools), ghi hàng đợi, không bịa số
  (đúng mục ⑤ phiếu).
- **`resolveGroupGeometry` mẫu N=507 chỉ có 1 tường** — không đủ để kết luận xu hướng ms/tường, chỉ
  ghi nhận nghi ngờ "khởi động nguội BVH", chưa xác nhận (cần lặp N tường cố định ở mọi kích cỡ Doc
  để tách bạch "khởi động nguội" khỏi "chi phí thật theo N", việc đợt sau nếu cần).
- **Chưa đo Doc > 5.000 entity** (đúng ma trận phiếu yêu cầu 500/2.000/5.000) — ngoại suy N≈21.000
  cho mốc 100k tam giác đường thường là TÍNH TOÁN từ số đo, không phải đo trực tiếp, ghi rõ trong
  mục tương ứng.
- **Registry không sửa** (đúng ô⑧ phiếu) — `hieu-nang-do` chờ T lật sau audit.

## Chạm biên liên chặng

Không có — mọi việc nằm gọn trong `scripts/bench/**` (mới) + báo cáo. Chỉ ĐỌC (import) các hàm thuần
đã export sẵn từ `lib/cad/**`/`lib/three/**`, không sửa file nào trong hai thư mục đó.
