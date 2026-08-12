# Báo cáo phiên D2 — build-recipe (Công Thức Khối) — 12/08/2026

Phiếu: `docs/phieu-giao/build-recipe.md` · Vùng file: `lib/three/**` · `lib/cad/model.ts` (chỉ field/type quanh `BuildOp`) · `components/render-studio/**`. Không git, không dev server, không prisma, không sửa `scripts/frontier-registry.mjs`.

## File sửa/tạo

| File | Loại | Nội dung |
|---|---|---|
| `lib/cad/model.ts` | SỬA | Thêm `BuildRecipeStep`/`BuildRecipe` (cạnh union `BuildOp`) + field additive `Base.recipe?: BuildRecipe`. Type khai Ở ĐÂY (không phải `lib/three/build-recipe.ts` như câu chữ mục ④.1 phiếu) — lý do ở mục "Quyết định" bên dưới. |
| `lib/three/build-ops.ts` | SỬA (nhỏ) | `export` hàm `repeatGeometry` (trước private) để `evalRecipe` tái dùng thay vì viết lại toán. Không đổi hành vi hàm nào khác. |
| `lib/three/build-recipe.ts` | **MỚI** | `evalRecipe(base, steps)` — evaluator thuần, đúng THỨ TỰ MẢNG (khác `resolveGroupGeometry` ưu tiên cố định theo loại), trả `{geometry, stepErrors}`. `resolveSceneGroupGeometry(g)` — nơi tiêu thụ thật: đọc `g.recipe` khi có ≥1 bước bật, lùi về `resolveGroupGeometry` cũ khi không. Re-export `BuildRecipe`/`BuildRecipeStep`. |
| `lib/three/build-recipe.test.ts` | **MỚI** | 24 test sucrase-node: recipe rỗng · bước disabled · thứ tự mảng đổi hình dạng · boolean thiếu cutter (lỗi cục bộ, không throw, bước sau vẫn chạy) · boolean hợp lệ · 2 bậc thay-hình-gốc (bậc 2 bị flag lỗi) · tham số sai (n<1) · `resolveSceneGroupGeometry` ưu tiên recipe/lùi về `ops[]` · round-trip `Doc` có `recipe` qua `exportIdf`/`importIdf` (cơ chế serialize CÓ SẴN, không viết đường mới) + `.idf` cũ không recipe vẫn mở sạch. |
| `lib/three/cad-to-obj.ts` | SỬA | `SceneGroup.recipe?: BuildRecipe` + `ObjBuilder` (`cur`/`object()`/`flushGroup()`) truyền field qua, CÙNG điều kiện với `ops` hôm nay (chỉ `wallHatches`). `buildOpCutters` tại vòng lặp tường gom cutter cho CẢ `h.ops` lẫn `h.recipe.steps` (bước `boolean` trong recipe cần đúng `opCutters`, nếu không luôn báo "không tìm thấy hình cắt"). |
| `lib/three/obj-scene-to-geometry.ts` | SỬA | Đổi `resolveGroupGeometry` (build-ops.ts) → `resolveSceneGroupGeometry` (build-recipe.ts) ở 2 nơi gọi thật (`buildMergedGeometries`, `buildMassingWalls`). `hasOpsGeometry` mở rộng: group có `recipe` với ≥1 bước bật cũng tách khỏi đường concat-theo-màu (không chỉ boolean như nhánh `ops` cũ). |
| `components/render-studio/Command3DPanel.tsx` | SỬA | Thêm `BuildRecipeSection` (mount trong `EditTab`, dưới 6 mục cũ) — danh sách bước: toggle mắt/xoá/mũi tên đổi thứ tự/sửa tham số (`RecipeStepParamForm`, tái dùng `numCls`/`labCls` — khuôn nhập số đã có trong chính file này, dùng thay vì nhúng `Tool3DBar` — lý do bên dưới). Nút "+ Thêm bước" tối thiểu: Array · Array Radial · Mirror · Bevel · Chamfer. Bước lỗi viền đỏ + `AlertTriangle` + câu lý do (tính bằng chính `evalRecipe`, không viết lại luật lỗi ở UI). |

## Lệnh thật (dán nguyên văn)

```
$ npx tsc --noEmit
exit=0

$ node_modules/.bin/sucrase-node lib/three/build-recipe.test.ts
… (24 dòng "ok")
24 pass, 0 fail

$ node_modules/.bin/sucrase-node lib/three/build-ops.test.ts
… (không regression)
74 pass, 0 fail

$ grep -rn "BuildRecipe" lib/three | head -5
lib/three/cad-to-obj.ts:18:import type { Doc, Entity, HatchEntity, BlockEntity, Pt, BuildOp, BuildRecipe, RoomEntity } from '../cad/model';
lib/three/cad-to-obj.ts:198:  recipe?: BuildRecipe;
lib/three/cad-to-obj.ts:313:  private cur: { …; recipe?: BuildRecipe } | null = null;
lib/three/cad-to-obj.ts:325:  object(name: string, mat: Mat, meta?: { …; recipe?: BuildRecipe }) {
lib/three/build-recipe.ts:3: * "Công Thức Khối" (BuildRecipe), CẤP 1 xuyên app …
```

Ngoài 4 lệnh ⑥ yêu cầu, đã tự chạy thêm để đảm bảo KHÔNG regression (mọi vùng đụng tới):

```
$ for f in lib/three/*.test.ts lib/cad/*.test.ts; do node_modules/.bin/sucrase-node "$f"; done
→ TOÀN BỘ 13 file lib/three/*.test.ts + 82 file lib/cad/*.test.ts: 0 fail (build-ops 74·
  build-recipe 24 mới· cad-to-obj 79· obj-scene-to-geometry 10· cad-to-obj-levels 25· cad-core-b1 47…)

$ npx eslint components/render-studio/Command3DPanel.tsx lib/three/build-recipe.ts lib/three/cad-to-obj.ts lib/three/build-ops.ts lib/three/obj-scene-to-geometry.ts lib/cad/model.ts
✖ 1 problem (0 errors, 1 warning) → đã SỬA (bọc `steps` bằng useMemo riêng), chạy lại 0 warning.
```

## Quyết định tự chọn (kèm lý do — không dừng hỏi giữa chừng)

1. **`BuildRecipeStep`/`BuildRecipe` khai TRONG `lib/cad/model.ts`, KHÔNG khai trong `lib/three/build-recipe.ts` như câu chữ mục ④.1** — `lib/three/build-recipe.ts` RE-EXPORT lại 2 type đó nên nơi gọi vẫn viết đúng `import { BuildRecipe, evalRecipe } from 'lib/three/build-recipe'`, hình dạng type Y HỆT hợp đồng. Lý do đổi VỊ TRÍ khai (không đổi HÌNH DẠNG): `model.ts` là lõi thuần — toàn bộ file có luật bất thành văn "KHÔNG import `three` dưới bất kỳ hình thức nào" (ghi rõ nhiều nơi, vd docstring đầu `cad-to-obj.ts`). Nếu khai type ở `build-recipe.ts` rồi `model.ts` `import type` ngược lại, dù bị TypeScript erase lúc runtime, compiler vẫn phải nạp cả cây import của `build-recipe.ts` (kéo theo `three`, `csg.ts`…) lúc biên dịch `model.ts` — phá đúng ranh giới "lõi dùng được cả nơi không có three.js" mà file đó tuyên bố khắp nơi. Vùng file ③ cho phép model.ts "thêm field/type quanh vùng BuildOp" — tôi coi đây đúng phạm vi đó.
2. **`obj-scene-to-geometry.ts` gọi `resolveSceneGroupGeometry` (build-recipe.ts) thay vì sửa thẳng `resolveGroupGeometry` (build-ops.ts) để nó tự đọc `recipe`** — nếu sửa ngược, `build-ops.ts` phải `import` từ `build-recipe.ts`, mà `build-recipe.ts` LẠI import các hàm thuần từ `build-ops.ts` (đúng luật "không viết lại toán" mục ④.2) ⇒ vòng lặp import giữa 2 file cùng thư mục. Giữ CHIỀU MỘT CHIỀU: `obj-scene-to-geometry.ts` → `build-recipe.ts` → `build-ops.ts`. Hành vi cuối giống hệt câu chữ phiếu ("resolveGroupGeometry đọc recipe khi có") — chỉ khác nơi hàm đó được export ra.
3. **2 bậc "thay-hình-gốc" (taper/bevelEx/sweep/revolve/loft) cùng bật trong MỘT recipe ⇒ bậc thứ 2 bị coi là LỖI** (khác `resolveGroupGeometry` gốc: N4, âm thầm chỉ lấy bậc đầu). Lý do: mục ⑤/luật vận hành 8 (`docs/CLAUDE.md`) cấm "âm thầm ship geometry sai" — ngăn xếp có UI hiển thị lỗi thì PHẢI báo, không được lặng lẽ nuốt như cơ chế cũ (cơ chế cũ không có chỗ hiển thị lỗi nên đành N4).
4. **Không cache trong `evalRecipe`/`resolveSceneGroupGeometry`** (khác `resolveGroupGeometry` có `meshCache`). Lý do: nơi gọi thật (`buildMergedGeometries`/`buildMassingWalls`) chạy trong hiệu ứng theo `scene` đổi, KHÔNG mỗi frame (đã đọc `Scene3DViewer.tsx` xác nhận) — thêm cache lúc chưa có bằng chứng chậm là tối ưu sớm. Để lại cho đợt sau nếu đo thấy cần.
5. **UI chỉ có form "Sửa tham số" cho 4 loại: `arrayLinear`/`arrayRadial`/`mirror`/`bevelEx`** — đúng "tối thiểu" mục ④.4. `taper`/`sweep`/`revolve`/`loft`/`boolean`/`extrude` NẾU có sẵn trong recipe (vd nhập từ `.idf` ngoài) vẫn toggle/xoá/đổi thứ tự được, chỉ không có form sửa tại chỗ — cùng khoảng hở đã ghi ở `TaperSection`/`SweepSection` hiện có (chưa có UI vẽ tiết diện nhiều điểm ở BẤT KỲ đâu trong app).
6. **Nút "+ Thêm bước" dùng `entityFootprintMm()` (export sẵn từ `lib/cad/commands.ts`) để NƯỚNG `polyMm` cho Bevel/Chamfer** — IMPORT (đọc) hàm thuần có sẵn, KHÔNG sửa file đó (ngoài vùng ③). Không tái tạo logic nướng đa giác.
7. **"Tái dùng khuôn nhập số Tool3DBar" đọc là tái dùng STYLE (các hằng `numCls`/`labCls` đã dùng xuyên suốt chính `Command3DPanel.tsx`, khớp 100% inputs của Tool3DBar), KHÔNG nhúng component `Tool3DBar`** — `Tool3DBar` là thanh nổi đáy viewport của máy trạng thái công cụ (đợt 3), khác bề mặt UI (panel sidebar cuộn dọc). Nhúng nguyên component vào đây sẽ lệch bố cục, còn style thì đã đúng 1 khuôn.
8. **`hasOpsGeometry` (`obj-scene-to-geometry.ts`) mở rộng để bắt CẢ recipe** (không chỉ boolean) nhưng KHÔNG sửa nhánh `ops[]` cũ (vẫn chỉ bắt boolean) — phát hiện một khoảng hở CÓ TRƯỚC ticket này: group có `ops` array/mirror/shape (không boolean) lọt qua đường concat-theo-màu dùng `g.positions` thô, không phản ánh các bậc đó trong `buildMergedGeometries`. Đây là bug tồn tại độc lập với `recipe`, sửa nó KHÔNG thuộc phạm vi phiếu — ghi rõ dưới đây và đề xuất T mở phiếu riêng.

## CHƯA LÀM — nói thẳng

- **`recipe` chỉ chảy qua tường/`HatchEntity`** (`cad-to-obj.ts` `wallHatches.forEach`) — CÙNG điều kiện với `ops` hôm nay ("chỉ tường/HatchEntity truyền vào hôm nay", docstring `Base.ops`). Nội thất (`BlockEntity`) chưa nối `recipe`/`ops` vào `SceneGroup` — việc khác, không mở rộng ở đây để giữ đúng khuôn đã có.
- **Không có form "Thêm bước" cho Taper/Sweep/Revolve/Loft/Boolean/Extrude** trong Build Recipe UI — thiếu UI vẽ tiết diện nhiều điểm (chưa có ở BẤT KỲ đâu trong app, kể cả 6 mục `ops[]` cũ — `TaperSection` gõ 1 số `topInsetMm`, KHÔNG vẽ tiết diện; Sweep chỉ chữ nhật MVP). Đây là khoảng hở đã biết trước, không phải phát sinh mới.
- **`hasOpsGeometry` nhánh `ops[]` cũ vẫn chỉ bắt boolean** (không array/mirror/shape không-boolean) — bug CÓ TRƯỚC, phát hiện khi đọc code chuẩn bị cho ticket này, KHÔNG sửa (ngoài phạm vi `build-recipe.md`). **Đề xuất T**: mở phiếu riêng sửa `hasOpsGeometry` nhánh `ops[]` để nhất quán với nhánh `recipe` mới sửa đúng ở đây.
- **Không cache `evalRecipe`** — xem "Quyết định" #4. Nếu đo thấy chậm ở scene lớn nhiều recipe, thêm `Map` cache theo `entityId` + hash (cùng khuôn `meshCache` trong `build-ops.ts`) là việc đợt sau, không làm trước khi có bằng chứng.
- **Chưa soi bằng browser thật** — phiếu cấm dev server; nghiệm thu mắt (UI Build Recipe chạy đúng trên viewport thật: kéo thứ tự, xem geometry đổi theo, lỗi hiện đỏ) là việc phiên V.
- **Registry không sửa** (đúng ô⑧) — `build-recipe` còn `trangThai:'chua'` trong registry cho tới khi T lật sau audit.

## Chạm biên liên chặng

Không có — mọi sửa đổi nằm trong `lib/three/**`, `lib/cad/model.ts` (chỉ field/type quanh `BuildOp`), `components/render-studio/**`. Có ĐỌC (import, không sửa) `lib/cad/commands.ts` (`entityFootprintMm`) và `lib/cad/store.ts` (`newId`) — cả hai là hàm thuần đã export sẵn, không đụng file.

**Đề xuất lên T (quan sát kiến trúc, không phải lỗi của phiếu này):** `Base` (`lib/cad/model.ts`) đã có SẴN một cặp field `ops?: BuildOp[]` + `opsDisabled?: number[]` mang docstring "kiểu modifier stack Max/Blender" — nhưng `opsDisabled` có **0 nơi tiêu thụ** trong toàn repo (đã `grep` xác nhận trước khi bắt đầu viết code). Ticket này dựng MỘT CƠ CHẾ THỨ HAI (`recipe: BuildRecipe`) có đủ enabled/id/thứ-tự-mảng — đúng những gì `opsDisabled` định làm nhưng chưa ai nối. Hai cơ chế nay CÙNG TỒN TẠI (đúng hợp đồng phiếu — không được đổi hình dạng `ops`/`opsDisabled` đã persist). Về sau nếu `recipe` chứng minh đủ tốt, T có thể cân nhắc: ① khai tử `opsDisabled` (chưa ai dùng, xoá không vỡ gì) ② hoặc viết migration `ops[]`+`opsDisabled[]` → `recipe.steps[]` một lần cho entity cũ. Không tự quyết ở đây vì đụng tới quyết định giữ/bỏ field đã persist — thuộc thẩm quyền kiến trúc T.

## 2 GIÁ TRỊ (khuôn §1c HOP-DONG)

**Kiến trúc.**
- [tính năng] `BuildOp` từ "nướng chết" một lần (`ops[]`, ưu tiên CỐ ĐỊNH theo loại — sai 1 tham số phải dựng lại) thành NGĂN XẾP THẬT: mỗi bước tự `id`/`enabled`/`label`, thứ tự MẢNG là thứ tự áp dụng thật (đổi được bằng kéo lên/xuống). Evaluator thuần (`evalRecipe`) không viết lại toán — 100% gọi hàm đã có ở `build-ops.ts`/`csg.ts`, chỉ đổi CÁCH DUYỆT (tuần tự theo mảng thay vì ưu tiên theo loại). Lỗi cục bộ từng bước (`stepErrors`), không crash, không âm thầm sai — đúng luật vận hành 8.
- [giao diện] Panel `Build Recipe` (Command3DPanel, tab Sửa) là MẶT TIỀN thứ 7 song song 6 mục `ops[]` cũ — không thay, không xung đột: entity nào dùng `recipe` thì `recipe` thắng khi có bước bật, còn không thì 6 mục cũ + `ops[]` chạy y nguyên. Đây là xương cho `.idfc` "sửa một chỗ, cả ba chặng cập nhật" (00-CHOT 11/08) — bước sau này gắn `label` người-đọc-được (vd "Vát chân bàn") chính là chỗ neo tên gọi nghiệp vụ vào từng bậc kỹ thuật.

**Vận hành-sử dụng.**
- [tính năng] Designer sửa lỗi 1 tham số bằng cách BẬT/TẮT/SỬA đúng bước đó, không phải xoá-dựng-lại cả khối (nỗi đau Hoà nêu ở ①: "chân bàn tiện, phào chỉ… dựng nội thất mà không có mấy cái đó là vứt"). Ctrl+Z lùi được vì mọi ghi đi qua `updateEntities` sẵn có — không cơ chế undo riêng.
- [giao diện] Danh sách bước có mắt (bật/tắt), mũi tên (đổi thứ tự), thùng rác (xoá), viền đỏ + câu lý do ngắn khi bước lỗi (vd "không tìm thấy hình cắt cho withRef=…", "chỉ 1 bậc thay-hình-gốc có tác dụng mỗi lần"). Nút "+ Array / + Array Radial / + Mirror / + Bevel / + Chamfer" thêm bước mới với tham số mặc định hợp lý (tâm/mặt gương suy từ bbox khối đang chọn, không bắt gõ tay từ 0) — đúng tinh thần các mục 6 khối cũ đã làm.
