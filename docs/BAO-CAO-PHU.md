# BÁO CÁO — CODE PHỤ (worktree `nhanh-phu`)

> APPEND-ONLY (LUẬT-VAN-HANH-LOOP §1.3) — chỉ thêm mục mới ở CUỐI file, không sửa mục cũ.
> Mỗi mục: commit · test/số đo · 💭 chưa chắc · ⛔ CẦN HOÀ (nếu có) · SẴN SÀNG COMMIT ·
> HÀNG ĐỢI CÒN LẠI. Hoà chạy lệnh merge/commit trên máy thật theo nhịp 1-2 lần/ngày.

---

## [09:07 02/08] P1 · E2 — Mask ảnh theo hình — XONG (chờ commit tay)

**Việc**: nối `shapeClipPath()`/`polygonPoints01()` (đã có, `shape-geometry.ts:65`) cho
`ImageElement` — mask tròn/tam giác/đa giác/mũi tên, bake đủ PDF/PNG/PPTX
(`docs/CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md` §1 E2).

- **Commit**: CHƯA commit — worktree không chạy được lệnh git từ sandbox (đã xác nhận trước đó,
  `LUAT-VAN-HANH-LOOP.md` §3 "hết chiến tranh lock"). Khối lệnh + danh sách file ở mục
  **SẴN SÀNG COMMIT** cuối phần này.
- **Test/số đo**:
  - `lib/present-editor/shape-geometry.test.ts` (MỚI, 14 case) — `sucrase-node`: **14 ok, 0 fail**.
  - `npx tsc --noEmit -p .` (toàn repo) — **sạch, 0 lỗi**.
  - `npx eslint` trên 7 file đã sửa — **sạch, 0 cảnh báo**.
  - `npm test` (toàn repo, ~100 file `*.test.ts` qua `xargs -P8`) — **0 fail, exit code 0**.
- 💭 **Chưa chắc**:
  1. Hero PPTX (`export.ts#maskedImageDataUri`) nướng mask theo tỉ lệ **CROP** của ảnh
     (`el.crop`), KHÔNG theo tỉ lệ khung hero cố định trong `lib/pptx.ts` (khối phải
     "Nội dung + ảnh", ~0.44×(7.5 hoặc 5.5)in). pptxgenjs `sizing:{type:'cover'}` sẽ tự
     crop/scale PNG này lần nữa để khớp khung đó — ĐÚNG NHƯ đường cũ xử lý ảnh hero không-mask
     (không thêm lệch mới), nhưng CHƯA xuất thử 1 file .pptx thật rồi mở bằng mắt để xác nhận
     hình mask không bị cắt xén khó coi ở khung rất lệch tỉ lệ. Chỉ có test đơn vị cho phần
     hình học thuần (`shape-geometry.test.ts`), KHÔNG có test đầu-cuối cho `export.ts` (cần
     DOM/canvas thật + pptxgenjs, ngoài khả năng `sucrase-node`).
  2. Chưa có ô xem trước mask kiểu "quick panel" riêng cho ảnh (như `ShapeQuickPanel.tsx` có
     cho shape) — chỉ chỉnh được qua Inspector. Không phải thiếu sót của phạm vi P1 (CHOT doc
     không yêu cầu quick panel), nêu ra để Hoà biết nếu muốn thêm ở việc sau.
- Không có mục ⛔ CẦN HOÀ — không đụng quyết định cơ chế/giao diện/chuẩn nghề ngoài những gì
  `CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md` đã duyệt sẵn.

**Chi tiết đổi (đọc nhanh)**:
- `model.ts`: `ImageMaskShape` ('ellipse'|'triangle'|'polygon'|'arrow') + `ImageMask` +
  `ImageElement.mask?` — additive, `.idfp` cũ mở y nguyên.
- `shape-geometry.ts`: `imageMaskClipPath()` (CSS, ellipse dùng `ellipse()` riêng, 3 kiểu còn
  lại TÁI DÙNG `shapeClipPath`) + `imageMaskCanvasPath()` (canvas path, cùng nguồn đỉnh
  `polygonPoints01`) — không viết lại hình học lần 2, giữ 1 nguồn sự thật canvas+CSS như
  file đã tự đặt quy ước.
- `Element.tsx#ImageInner`: áp `clipPath` khi có `el.mask` (bỏ qua `radius`).
- `render.ts#drawImageEl`: `ctx.clip()` theo mask thay vì `roundRectPath` khi có `el.mask` —
  bake tự động cho CẢ PDF và PNG (2 đường đó đều đi qua `renderEditorSlide`).
- `export.ts`: `pickHero()` đổi trả `ImageElement | string | null` (từ `string | null`) để đọc
  được `.mask`; thêm `heroToDataUri()` + `maskedImageDataUri()` — bake PNG trong-suốt cho hero
  PPTX khi có mask, KHÔNG mask thì giữ nguyên `toDataUri()` cũ (0 đổi hành vi cho deck cũ).
- `Inspector.tsx`: thêm `<select>` chọn hình mask + slider số cạnh (khi polygon) vào bảng
  thuộc tính ảnh, khoá (không ẩn) slider "Bo góc" khi đang có mask.

**SẴN SÀNG COMMIT** — 7 file (6 sửa + 1 mới):
```
lib/present-editor/model.ts
lib/present-editor/shape-geometry.ts
lib/present-editor/shape-geometry.test.ts        (MỚI)
lib/present-editor/render.ts
lib/present-editor/export.ts
components/present-editor/Element.tsx
components/present-editor/Inspector.tsx
```

Lệnh (chạy trên máy thật, trong `~/Downloads/interiorflow-phu`, nhánh `nhanh-phu`):
```
cd ~/Downloads/interiorflow-phu
git add lib/present-editor/model.ts lib/present-editor/shape-geometry.ts \
  lib/present-editor/shape-geometry.test.ts lib/present-editor/render.ts \
  lib/present-editor/export.ts components/present-editor/Element.tsx \
  components/present-editor/Inspector.tsx
git commit -m "feat(present-editor): P1/E2 — mask ảnh theo hình (tròn/tam giác/đa giác/mũi tên)

- model.ts: ImageMaskShape + ImageMask, ImageElement.mask (additive, .idfp cũ không vỡ)
- shape-geometry.ts: imageMaskClipPath (CSS) + imageMaskCanvasPath (canvas), tái dùng
  polygonPoints01/shapeClipPath sẵn có cho ShapeElement — không viết lại hình học lần 2
- Element.tsx#ImageInner: áp clip-path khi có mask (bỏ qua radius)
- render.ts#drawImageEl: clip theo mask khi bake PDF/PNG (renderEditorSlide)
- export.ts: pickHero trả ImageElement, heroToDataUri/maskedImageDataUri bake PNG
  trong-suốt cho hero PPTX khi có mask; không mask giữ nguyên toDataUri cũ
- Inspector.tsx: chọn hình mask + số cạnh polygon trong bảng thuộc tính ảnh

Test: shape-geometry.test.ts (mới) 14/14 ok. tsc sạch. eslint sạch. npm test toàn repo
100 file, 0 fail, exit 0.

Theo docs/CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md §1 E2."
```

---

## [02/08] P2 · E1 — Nhóm phần tử — XONG PHẦN LÕI, 1 mục ⛔ CẦN HOÀ (chờ commit tay)

**Việc**: `groupId?` trên `BaseElement`, chọn 1 phần tử trong cụm → chọn cả cụm, khoá/xoá/
nhân bản/dời/copy-paste cascade cả cụm, Nhóm/Bỏ nhóm (menu chuột phải + Inspector), LayerPanel
hiện dấu hiệu cụm (`docs/CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md` §1 E1).

- **Commit**: CHƯA commit — lý do như P1 (worktree không chạy được git từ sandbox). Khối lệnh +
  danh sách file ở mục **SẴN SÀNG COMMIT** cuối phần này.
- **Test/số đo**:
  - `lib/present-editor/model-group.test.ts` (MỚI, 12 case) — `sucrase-node`: **12 ok, 0 fail**.
  - `npx tsc --noEmit -p .` (toàn repo) — **sạch, 0 lỗi** (1 vòng sửa: icon `lucide-react` không
    nhận prop `title` trực tiếp ở bản đang cài — bọc `<span title=…>` quanh icon thay vì truyền
    thẳng, xong sạch).
  - `npx eslint` trên 6 file đã sửa — **sạch, 0 lỗi** (1 warning CŨ, KHÔNG do việc này: dòng
    watermark `<img>` ở `EditorCanvas.tsx:311`, có từ trước, ngoài phạm vi P2).
  - `npm test` (toàn repo, 117 file `*.test.ts`) — **0 dòng "N ok, M fail" với M>0, exit code 0**.
- 💭 **Chưa chắc**:
  1. **Quy ước khoá cả cụm** khi lựa chọn LẪN cả khoá/mở khoá (vd 2/3 phần tử đang khoá, 1 mở):
     chọn "còn ≥1 phần tử MỞ khoá trong lựa chọn → khoá HẾT; đã khoá hết → mở HẾT" (khớp cảm
     giác Figma, tránh trạng thái lẫn lộn khi bấm 1 nút) — chưa hỏi ý Hoà trước khi làm, là suy
     luận hợp lý nhất tự quyết theo LUAT-VAN-HANH-LOOP (không phải quyết định cơ chế/giao diện
     lớn), nêu ra để Hoà biết quy ước nếu thấy lệch ý muốn thì đổi dễ (1 hàm, 1 chỗ).
  2. **LayerPanel "hiện cây nhóm"** — CHOT doc chỉ ghi 1 dòng, không tả cơ chế. Đã làm bản RÚT
     GỌN: vạch màu trái + icon nhỏ trên MỖI dòng thuộc cụm (màu theo hash `groupId`, xem
     `LayerPanel.tsx#groupHue`) — KHÔNG dựng cây lồng nhau/kéo các dòng cùng cụm về sát nhau
     (phần tử trong cụm KHÔNG đảm bảo liền kề trong mảng nếu trước đó dùng "Tiến 1 bậc"/"Lùi 1
     bậc" riêng lẻ — z-order đơn lẻ hiện KHÔNG cascade, xem ⛔ mục 2 dưới). Chưa xem được bằng
     mắt (sandbox không có trình duyệt) — chỉ xác nhận qua đọc code + tsc/eslint.
  3. Click chọn cả cụm CHỈ áp cho click/chuột-phải trên canvas (`onSelectGroupAware`, bọc quanh
     `ed.select`) — dòng trong ô Lớp (LayerPanel) vẫn chọn TỪNG phần tử riêng (không mở rộng cả
     cụm), khớp cách Figma cho chọn 1 lớp con trong cụm từ panel layer mà không kéo cả cụm.
     Quyết định phạm vi, không phải thiếu sót — nêu ra để Hoà biết nếu muốn đổi.
- ⛔ **CẦN HOÀ** (2 mục — KHÔNG dừng cả chuỗi, đã tự sang P3 theo LUAT-VAN-HANH-LOOP §2 vì P3
  không phụ thuộc 2 mục này):
  1. **"Kéo-resize cả cụm" (chưa làm)** — hiện tay chỉnh cỡ (resize handle) CHỈ hiện khi chọn 1
     phần tử (`Element.tsx` khoá `!multi`, có TỪ TRƯỚC, không phải P2 gây ra) — resize nhiều
     phần tử cùng lúc là tính năng MỚI HOÀN TOÀN (toán bounding-box chung + scale tỉ lệ từng
     phần tử theo box đó), đụng đúng phần sống động nhất của app (kéo-thả chuột thật, 21.5k
     dòng đang chạy — Hoà dặn giữ nguyên) mà sandbox KHÔNG cách nào test được (cần chuột thật
     trên trình duyệt). CHOT doc không tả cơ chế. 3 phương án, Hoà chọn:
     - (a) Bbox chung, 4 tay góc + 4 tay cạnh, scale tỉ lệ từng phần tử theo box — đúng chuẩn
       Figma/Canva nhất, nhưng đụng nhiều nhất vào toán resize hiện có.
     - (b) Như (a) nhưng CHỈ 4 tay góc (bỏ tay cạnh) — giảm ca biên (kéo lệch 1 trục khi nhiều
       phần tử có aspect khác nhau), ít việc hơn (a).
     - (c) HOÃN hẳn ở P2 — cụm dời/khoá/xoá/nhân bản được nhưng CHƯA resize-cùng-lúc, ghi thành
       1 hạng mục riêng (P-item mới) khi Hoà chốt được cơ chế + có máy thật để test tay.
     Đề xuất: **(c)** — an toàn nhất với ràng buộc hiện tại (không sandbox-test được tương tác
     chuột), các phần còn lại của E1 đã xong đủ dùng.
  2. **Z-order đơn lẻ (`onZOrder`/"Tiến 1 bậc" v.v.) KHÔNG cascade cả cụm** — có TỪ TRƯỚC P2
     (không phải lỗi P2 gây ra), CHOT doc's mục E1 không liệt kê z-order trong danh sách cascade
     cần làm — để NGUYÊN (không tự sửa) vì z-order tác động thứ tự vẽ TOÀN slide (không chỉ cụm
     đang chọn), rủi ro tự suy sai ý Hoà muốn "z-order cả cụm" nghĩa là gì (dời cả cụm lên/xuống
     giữ nguyên thứ tự NỘI BỘ cụm, hay đẩy từng phần tử lên 1 bậc độc lập). Hỏi Hoà nếu muốn có.

**Chi tiết đổi (đọc nhanh)**:
- `model.ts`: `BaseElement.groupId?` (additive) + `duplicateElementsPreservingGroups()` — ánh xạ
  groupId CŨ→MỚI theo LÔ khi nhân bản/dán (không gộp lầm vào cụm gốc, không rã lầm cụm bản sao).
- `PresentEditor.tsx`: `onSelectGroupAware` (bọc `ed.select`, canvas-only — chọn cả cụm khi click
  đúng phần tử có `groupId`) · `onGroupSelected`/`onUngroupSelected` (gộp ≥2 phần tử/rã mọi cụm
  có mặt trong lựa chọn) · `onToggleLockSelected` (khoá/mở khoá cascade, thay `ed.updateSelected`
  chỉ đụng 1 phần tử) · `onDuplicateSelected`/`onPaste` đổi sang `duplicateElementsPreservingGroups`.
- `EditorCanvas.tsx`: `onGroup`/`onUngroup` prop mới, thêm mục "Nhóm"/"Bỏ nhóm" vào CẢ 2 nhánh
  menu chuột phải (ảnh + shape/text), ẩn/hiện theo `selectedIds`/`groupId` hiện có.
- `Inspector.tsx`: khối "Nhóm" mới (nút Nhóm khi chọn ≥2, nút Bỏ nhóm khi lựa chọn có `groupId`)
  · nút Khoá đổi sang gọi `onToggleLockSelected` (cascade) thay vì `onUpdateSelected` (1 phần tử).
- `LayerPanel.tsx`: vạch màu trái + icon nhỏ (`groupHue()`, hash chuỗi→hue) cho dòng thuộc cụm —
  THUẦN hiển thị, không đổi thứ tự/dữ liệu.

**SẴN SÀNG COMMIT** — 6 file (5 sửa + 1 mới):
```
lib/present-editor/model.ts
lib/present-editor/model-group.test.ts                (MỚI)
components/present-editor/PresentEditor.tsx
components/present-editor/EditorCanvas.tsx
components/present-editor/Inspector.tsx
components/present-editor/LayerPanel.tsx
```

Lệnh (chạy trên máy thật, trong `~/Downloads/interiorflow-phu`, nhánh `nhanh-phu`):
```
cd ~/Downloads/interiorflow-phu
git add lib/present-editor/model.ts lib/present-editor/model-group.test.ts \
  components/present-editor/PresentEditor.tsx components/present-editor/EditorCanvas.tsx \
  components/present-editor/Inspector.tsx components/present-editor/LayerPanel.tsx
git commit -m "feat(present-editor): P2/E1 — nhóm phần tử (chọn/khoá/xoá/nhân bản/dời cả cụm)

- model.ts: BaseElement.groupId (additive) + duplicateElementsPreservingGroups() ánh xạ
  groupId CŨ→MỚI theo lô khi nhân bản/dán (không gộp lầm vào cụm gốc)
- PresentEditor.tsx: onSelectGroupAware (canvas chọn cả cụm) + onGroupSelected/
  onUngroupSelected + onToggleLockSelected (khoá cascade cả cụm, thay updateSelected 1 phần
  tử) + onDuplicateSelected/onPaste dùng duplicateElementsPreservingGroups
- EditorCanvas.tsx: mục Nhóm/Bỏ nhóm trong menu chuột phải (cả nhánh ảnh + shape/text)
- Inspector.tsx: khối Nhóm/Bỏ nhóm + nút Khoá đổi sang cascade cả cụm
- LayerPanel.tsx: vạch màu + icon THUẦN hiển thị cho dòng thuộc cụm (groupHue, hash)

Test: model-group.test.ts (mới) 12/12 ok. tsc sạch. eslint sạch (1 warning cũ không liên
quan). npm test toàn repo 117 file, 0 fail, exit 0.

⛔ CHƯA làm (cần Hoà chọn cơ chế, xem docs/BAO-CAO-PHU.md mục P2):
- Resize cả cụm cùng lúc (kéo tay chỉnh cỡ nhiều phần tử) — 3 phương án chờ chọn
- Z-order đơn lẻ (Tiến 1 bậc/…) chưa cascade cả cụm — hỏi ý trước khi đổi (có từ trước P2)

Theo docs/CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md §1 E1."
```

## [02/08] E1 bổ sung · Resize NHÓM theo tỉ lệ — XONG (chờ commit tay)

**Việc**: Hoà chốt giữa chuỗi (không đợi P3 xong): "kéo góc khung bao nhóm/multi-select → SCALE
CẢ CỤM theo tỉ lệ — mọi phần tử con co giãn cùng tỉ lệ, giữ bố cục tương đối, chữ scale font
theo (chuẩn Figma/Canva). KHÔNG làm khung đổi con giữ nguyên." Đã ghi vào
`docs/CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md` (bản main). Đây là câu trả lời cho mục ⛔ "resize cả
cụm" mà P2 để treo (3 phương án đề xuất trước đó) — **GIẢI QUYẾT XONG, gỡ khỏi hàng chờ**.

**Commit**: CHƯA (sandbox không chạy được git trong worktree — xem lệnh SẴN SÀNG COMMIT bên dưới).

**Cách làm**: thêm 1 file toán THUẦN (`resize-group.ts`, tách khỏi component để test bằng
sucrase-node, cùng chỗ đứng với `resize-corner.ts` — resize 1 phần tử). Chỉ hiện 4 handle GÓC
cho khung bao cả cụm (không có cạnh n/s/e/w, không có xoay) — kéo góc LUÔN giữ tỉ lệ (khác resize
1 phần tử: ở đó Shift mới giữ tỉ lệ, cụm thì không có lựa chọn tự do, tránh méo bố cục). Toán:
- `groupBoundingBox(frames)` — khung bao nhỏ nhất chứa hết phần tử đang chọn.
- `scaleGroupByCorner(bbox, handle, dxPct)` — khung bao MỚI khi kéo góc, góc đối diện đứng yên
  (neo), trả kèm `scale` (hệ số dùng chung cho mọi phần tử con).
- `scaleMemberFrame(frame, oldBbox, newBbox, scale, fontSize?)` — frame mới của 1 phần tử: giữ
  NGUYÊN offset tới mép trái/trên khung bao (nhân theo `scale`) + w/h riêng nhân `scale`;
  `fontSize` (nếu là TextElement) cũng nhân `scale`. Cả w/h/fontSize đều chặn dưới (3%/1) để
  không co về 0/âm khi kéo quá tay.
- UI: `EditorCanvas.tsx#GroupResizeOverlay` (component nội bộ, mới) — vẽ khung bao nét đứt + 4
  handle góc khi `multi` (≥2 phần tử chọn, kể cả chọn cả cụm qua `onSelectGroupAware` P2), bắt
  pointer y hệt style Element.tsx nhưng đơn giản hơn (không cần hack "0-delta = giữ nguyên" của
  `onFrameMany` — pointerup truyền thẳng delta THẬT của lần move cuối).
- `PresentEditor.tsx#onGroupResize` — callback mới, cùng dạng snapshot-ref với `onFrameMany`
  (chụp bbox + frame/fontSize từng phần tử lúc bắt đầu kéo), gọi 3 hàm THUẦN trên rồi
  `ed.updateSlide(...)`. Phần tử KHOÁ bị loại khỏi lô scale (giống `onFrameMany` loại khoá khỏi
  dời nhóm).

**Test/số đo**:
- `resize-group.test.ts` (MỚI) — 24/24 ok (sucrase-node): hợp khung bao, khung bao mới khi kéo
  góc (cả 2 hướng nw/se, xác nhận góc đối diện đứng yên), chặn dưới 3% khi kéo co cực mạnh, giữ
  vị trí tương đối + nhân kích thước theo scale, fontSize nhân theo scale (và bỏ qua khi không
  truyền), chặn dưới cho w/h/fontSize.
- `npx tsc --noEmit -p .` → sạch (0 lỗi), 1 lần chạy, không cần sửa gì thêm.
- `npx eslint` trên 6 file đụng tới → sạch, 1 warning KHÔNG liên quan (đã có từ trước, `<img>`
  watermark trong EditorCanvas.tsx, không phải do việc này).
- `npm test` (full suite) → `REAL_EXIT=0`, không thấy dòng nào khớp mẫu fail > 0 (đã grep loại
  trừ ", 0 fail").

**💭 Chưa chắc / tự quyết**:
1. Multi-select TỰ DO (rê chuột chọn nhiều phần tử KHÔNG cùng `groupId`, không qua Nhóm chính
   thức) cũng hiện khung resize-tỉ-lệ này — vì `multi` vốn đã là `selectedIds.length > 1` từ P2
   (bao trùm cả 2 trường hợp: chọn cả 1 cụm hay chọn tự do nhiều phần tử rời). Hoà chỉ nói rõ
   "kéo góc NHÓM" — hiểu rộng ra cho cả multi-select tự do vì đúng chuẩn Figma/Canva (multi-
   select resize luôn scale đồng bộ, không riêng gì nhóm chính thức) và tận dụng được đúng 1 khối
   `multi` đã có sẵn, không phải rẽ 2 nhánh logic khác nhau. Nếu Hoà muốn TÁCH riêng (chỉ nhóm
   chính thức mới cho resize-tỉ-lệ, multi-select tự do thì KHÔNG) — báo để tách điều kiện.
2. CHỈ 4 handle góc, không có cạnh (n/s/e/w) và không có xoay cho khung bao cả cụm — vì Hoà chỉ
   nói "kéo góc". Cạnh (kéo 1 trục, méo cụm) và xoay cả cụm không nằm trong yêu cầu, cố tình
   không làm để khỏi lấn qua quyết định thiết kế Hoà chưa chốt.
3. `strokeWidth` của shape (đơn vị % chiều CAO SÂN KHẤU, không phải % của riêng shape đó — xem
   `render.ts`) KHÔNG được nhân theo `scale` khi cụm scale — nghĩa là viền shape sẽ trông "dày/
   mỏng khác tỉ lệ" so với thân shape sau khi resize cụm nhiều lần. Không sửa vì Hoà không nhắc
   tới viền, và sửa đụng vào cách `strokeWidth` được định nghĩa (ảnh hưởng ngoài phạm vi resize
   nhóm) — nêu ra để Hoà biết, không tự ý đổi định nghĩa field.

**Chi tiết đổi**:
- `lib/present-editor/resize-group.ts` — MỚI: `GroupFrame`, `groupBoundingBox`,
  `scaleGroupByCorner`, `scaleMemberFrame` (thuần, có JSDoc giải thích quy ước neo góc).
- `lib/present-editor/resize-group.test.ts` — MỚI: 24 test case.
- `components/present-editor/EditorCanvas.tsx` — import `groupBoundingBox`; prop
  `onGroupResize?`; component mới `GroupResizeOverlay` (khung bao nét đứt + 4 handle góc); render
  khi `multi && onGroupResize`.
- `components/present-editor/PresentEditor.tsx` — import 3 hàm + type `GroupFrame` từ
  `resize-group.ts`; ref `groupResizeStartRef`; callback `onGroupResize` (mới); truyền
  `onGroupResize={onGroupResize}` xuống `<EditorCanvas>`.

**SẴN SÀNG COMMIT** (Hoà chạy trong worktree `interiorflow-phu` trên máy thật):
```bash
git add lib/present-editor/resize-group.ts lib/present-editor/resize-group.test.ts \
  components/present-editor/EditorCanvas.tsx components/present-editor/PresentEditor.tsx
git commit -m "feat(present-editor): E1 bổ sung — resize nhóm theo tỉ lệ (kéo góc)

Chốt giữa chuỗi 02/08 (docs/CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md): kéo góc khung
bao cả cụm/multi-select giờ SCALE CẢ CỤM theo tỉ lệ thay vì không làm gì (P2 để
treo mục này). Mọi phần tử con giữ vị trí tương đối trong khung bao + kích thước
riêng cùng nhân 1 hệ số scale; TextElement.fontSize cũng nhân theo scale. Chuẩn
Figma/Canva multi-select resize (chỉ góc, luôn giữ tỉ lệ, không có cạnh/xoay cho
cả cụm).

- lib/present-editor/resize-group.ts (mới): groupBoundingBox, scaleGroupByCorner,
  scaleMemberFrame — toán thuần, test bằng sucrase-node.
- lib/present-editor/resize-group.test.ts (mới): 24 test case.
- components/present-editor/EditorCanvas.tsx: GroupResizeOverlay (khung bao + 4
  handle góc khi multi), prop onGroupResize.
- components/present-editor/PresentEditor.tsx: callback onGroupResize (snapshot-
  ref cùng kiểu onFrameMany), truyền xuống EditorCanvas.

tsc sạch, eslint sạch (1 warning cũ không liên quan), npm test 117 file 0 fail."
```

## [04/08] P3 · E3 lớp phủ fill (shape + ảnh) — XONG (chờ commit tay)

**Việc**: Lớp phủ FILL cho shape và ảnh — `{kind: 'color'|'gradient', color, colorTo?, direction?,
opacity, blend?}` (`FillOverlay`, model.ts đã có từ trước) — vẽ ĐÈ lên trên fill/ảnh gốc, cùng
vùng clip (mask ảnh / đa giác shape), ăn khớp canvas (xuất PDF/PNG/PPTX-hero) VÀ CSS (xem trước
live) ra CÙNG một hình. Toàn bộ chuỗi: `render.ts` (canvas vẽ shape + ảnh) → `shape-geometry.ts`
(CSS `fillOverlayCss`) → `Element.tsx` (preview live) → `export.ts` (bake vào ảnh hero khi xuất
PPTX) → `Inspector.tsx` (UI chỉnh: kiểu/màu/hướng/opacity/blend).

**Commit**: CHƯA — hạn chế sandbox (không chạy git trong worktree). Đã soạn lệnh bên dưới.

**Cách làm**:
- `render.ts#drawShapeEl`: dựng lại path fill (`shapeFillPath`, hàm mới tách ra dùng CHUNG cho
  fill gốc + overlay — path canvas không tái dùng được sau `ctx.fill()`) rồi fill lần 2 với style
  riêng của overlay. `line` không có path khép kín → bỏ qua overlay (khớp cách `line` vốn không có
  `fill`/`GradientControls`).
- `render.ts#drawImageEl`: overlay vẽ TRƯỚC `ctx.restore()`, TÁI DÙNG clip (mask/bo góc) đang có
  hiệu lực — chỉ cần `ctx.fillRect`, không phải dựng lại path clip lần 2.
- `shape-geometry.ts#fillOverlayCss` (mới, thuần) — chuỗi CSS `background` mirror CHÍNH XÁC toán
  canvas: 'center' đậm giữa (colorTo) mờ dần rìa (color); 'edges' đối xứng color→colorTo→color;
  hướng khác color→colorTo theo `dirAngle` (cũng export mới).
- **Đổi kiến trúc (tự quyết, xem 💭 mục 1)**: `applyFillOverlayStyle` + `makeOverlayGradient`
  CHUYỂN từ `render.ts` sang `shape-geometry.ts` (đứng cạnh `fillOverlayCss`) — HÀNH VI GIỮ
  NGUYÊN 100%, chỉ đổi file cư trú + nơi import (`render.ts` và `export.ts` giờ import từ
  `shape-geometry.ts` thay vì định nghĩa/tự export).
- `Element.tsx` — `ImageInner` (giờ trả Fragment) và `ShapeInner` đều thêm 1 `<div>` overlay
  tuyệt đối, cùng `clipPath`/`borderRadius` với lớp fill/ảnh gốc, `background` từ `fillOverlayCss`
  (gradient) hoặc `overlay.color` thẳng (color), `mixBlendMode`, `pointerEvents:'none'`. Trường
  hợp không có overlay → render Y HỆT trước (nhánh `{overlay && (...)}`).
- `export.ts#maskedImageDataUri` — thêm tham số `overlay?: FillOverlay`, bake bằng
  `applyFillOverlayStyle` + `ctx.fillRect` sau khi vẽ ảnh (trước khi `toDataURL`). `heroToDataUri`
  gọi hàm này khi hero có `mask` HOẶC `fillOverlay` (trước chỉ xét `mask`).
- `Inspector.tsx` — component `FillOverlayControls<T>` MỚI (generic, dùng chung cho
  `ImageInspector` VÀ `ShapeInspector`, tránh lặp ~140 dòng UI 2 lần) — toggle bật/tắt, chọn
  kiểu (Màu/Gradient), 2 `ColorRow` (màu đầu/cuối khi gradient), lưới 6 nút hướng, thanh trượt
  opacity, dropdown blend. `ImageInspector` thêm prop `palette` (trước chưa có, cần cho
  `ColorRow`).

**Test/số đo**:
- `lib/present-editor/fill-overlay.test.ts` (MỚI) — 19/19 ok (sucrase-node): `fillOverlayCss` 4
  hướng tuyến tính + center/edges + colorTo rỗng dùng lại color; `applyFillOverlayStyle` qua ctx
  GIẢ — kind color (fillStyle thẳng, không tạo gradient), alpha nhân dồn baseAlpha×opacity, chặn
  opacity [0,1], blend đổi đúng composite, kind gradient hướng ltr (tham số
  createLinearGradient + thứ tự stop) và center (tham số createRadialGradient + thứ tự stop) —
  đối chiếu ĐÚNG thứ tự stop với `fillOverlayCss` để xác nhận canvas/CSS ra cùng hình.
- `npx tsc --noEmit -p .` → sạch (0 lỗi).
- `npx eslint` trên 10 file đụng tới (gồm cả các file P3 lẫn E1-bổ-sung để chắc không đá nhau) →
  sạch, 0 lỗi, 1 warning CŨ không liên quan (`<img>` watermark, EditorCanvas.tsx).
- `npm test` (full suite, 117+ file) → `REAL_EXIT=0`, đã xác nhận `fill-overlay.test.ts` THẬT SỰ
  chạy trong log (19 ok, 0 fail đúng vị trí, không lẫn với các file khác trùng số ok/fail).

**💭 Chưa chắc / tự quyết**:
1. Đầu tiên viết `fill-overlay.test.ts` import thẳng `applyFillOverlayStyle` từ `render.ts` —
   VỠ ngay ở `sucrase-node` (`Cannot find module '@/lib/imaging'`, vì `render.ts` import
   `loadImage` từ `@/lib/imaging` và `sucrase-node` KHÔNG resolve alias `@/*` — thử cả
   `tsconfig-paths/register` cũng không được vì `tsconfig.json` thiếu `baseUrl`). Không có test
   nào trong repo trước giờ import trực tiếp `render.ts` (đã grep xác nhận) — đây là lần đầu đụng
   giới hạn này. Thay vì sửa hạ tầng test toàn cục (thêm `baseUrl`/register global — rủi ro ảnh
   hưởng CẢ repo, ngoài phạm vi P3), tôi CHUYỂN `applyFillOverlayStyle`+`makeOverlayGradient`
   sang `shape-geometry.ts` — đúng tinh thần đã có sẵn của file đó (nơi ở của mọi hàm "đụng canvas
   nhưng KHÔNG đụng `document`/`Image`", xem `imageMaskCanvasPath` cùng file, đã test kiểu ctx
   giả từ P1). HÀNH VI 100% giữ nguyên, chỉ đổi nơi import — xác nhận qua tsc+eslint+full suite
   sạch. Nếu Hoà thấy việc này lấn qua "quyết định kiến trúc" ngoài thẩm quyền, báo để revert
   (tách hàm test riêng thay vì di chuyển).
2. PPTX xuất chỉ bake overlay vào ẢNH HERO (1 ảnh lớn nhất/backgroundImage của slide) — theo đúng
   kiến trúc pre-existing đã ghi nhận ở P1 (không có renderer PPTX riêng cho từng `ShapeElement`).
   Overlay trên 1 SHAPE riêng lẻ (không phải hero) sẽ KHÔNG lên PPTX — chỉ lên đường raster
   (PDF/PNG, full-bleed, đã có sẵn ở `render.ts`). Không phải lỗi mới, giới hạn có từ trước.
3. **Re-flag mục bị xoá nhầm**: báo cáo E1-bổ-sung trước (mục "HÀNG ĐỢI CÒN LẠI" cũ, dòng số 6)
   gộp CHUNG 2 ý "resize cả cụm" VÀ "z-order cascade cho multi-selection" dưới 1 dấu ⛔ từ P2.
   Chốt của Hoà ("Mục ⛔ 'P2 resize cascade' bạn để lại: đã được câu chốt này giải") CHỈ giải mục
   RESIZE — tôi xoá NGUYÊN dòng đó, vô tình làm mất luôn ý z-order (chưa được Hoà nhắc tới). Đưa
   lại vào hàng đợi bên dưới, đánh dấu ⛔ CẦN HOÀ — z-order (Tiến 1 bậc/Lùi 1 bậc/…) khi đang chọn
   nhiều phần tử: áp lên TỪNG phần tử đã chọn (mỗi phần tử tự đổi 1 bậc trong mảng), hay coi cả
   cụm là 1 khối rồi chỉ đổi vị trí khối đó? Chưa làm, chờ Hoà chốt hướng.

**Chi tiết đổi**:
- `lib/present-editor/render.ts` — `drawShapeEl` (tách `shapeFillPath` + pass overlay),
  `drawImageEl` (pass overlay tái dùng clip); XOÁ `applyFillOverlayStyle`/`makeOverlayGradient`
  (chuyển sang shape-geometry.ts); import `applyFillOverlayStyle` từ `./shape-geometry`.
- `lib/present-editor/shape-geometry.ts` — `dirAngle` đổi thành export; MỚI: `fillOverlayCss`
  (export), `makeOverlayGradient` (nội bộ), `applyFillOverlayStyle` (export).
- `lib/present-editor/fill-overlay.test.ts` — MỚI: 19 test case.
- `components/present-editor/Element.tsx` — `ImageInner` (Fragment + overlay div),
  `ShapeInner` (Fragment + overlay div khi có overlay).
- `lib/present-editor/export.ts` — import `applyFillOverlayStyle` từ `./shape-geometry` (thay vì
  `./render`); `maskedImageDataUri` thêm tham số `overlay?`; `heroToDataUri` gọi khi có
  `mask` HOẶC `fillOverlay`.
- `components/present-editor/Inspector.tsx` — `FillOverlayControls<T>` (mới, generic dùng chung
  Image/Shape); `ImageInspector` thêm prop `palette`; cả 2 Inspector gắn control này vào Panel.

**SẴN SÀNG COMMIT** (Hoà chạy trong worktree `interiorflow-phu` trên máy thật):
```bash
git add lib/present-editor/render.ts lib/present-editor/shape-geometry.ts \
  lib/present-editor/fill-overlay.test.ts lib/present-editor/export.ts \
  components/present-editor/Element.tsx components/present-editor/Inspector.tsx
git commit -m "feat(present-editor): P3/E3 — lớp phủ fill cho shape + ảnh

Overlay {kind: color|gradient, color, colorTo?, direction?, opacity, blend?} vẽ
đè lên fill/ảnh gốc, cùng vùng clip (mask ảnh / đa giác shape) — canvas (xuất
PDF/PNG/PPTX-hero) và CSS (xem trước live) ra CÙNG một hình.

- render.ts: drawShapeEl (tách shapeFillPath dùng chung fill gốc + overlay, path
  canvas không tái dùng được sau ctx.fill()), drawImageEl (tái dùng clip đang có
  hiệu lực, không dựng lại path lần 2).
- shape-geometry.ts: fillOverlayCss (CSS, mới) + applyFillOverlayStyle +
  makeOverlayGradient CHUYỂN từ render.ts sang đây (hành vi giữ nguyên) — vì hàm
  chỉ cần CanvasRenderingContext2D, không đụng @/lib/imaging như phần còn lại
  của render.ts, nên tách ra để test được qua sucrase-node (render.ts import
  @/lib/imaging, sucrase-node không resolve alias @/*, không có test nào trong
  repo từng import thẳng render.ts trước đây).
- fill-overlay.test.ts (mới): 19 test case — fillOverlayCss thuần + ctx giả cho
  applyFillOverlayStyle, đối chiếu thứ tự stop khớp giữa canvas và CSS.
- Element.tsx: ImageInner/ShapeInner thêm overlay div (Fragment), cùng clip với
  lớp gốc, không overlay thì render y hệt trước.
- export.ts: maskedImageDataUri bake overlay vào ảnh hero khi xuất PPTX.
- Inspector.tsx: FillOverlayControls (generic, dùng chung Image/Shape) — kiểu,
  màu, hướng, opacity, blend.

tsc sạch, eslint sạch (1 warning cũ không liên quan), npm test full suite 0 fail."
```

## [04/08] z-order NHÓM cho multi-selection (chốt giữa chuỗi, giải mục ⛔ P2 còn sót) — XONG (chờ commit tay)

**Việc**: Hoà chốt "z-order nhóm" (`docs/CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md`): khi đang chọn
NHIỀU phần tử, bấm Tiến 1 bậc/Lùi 1 bậc/Lên trước cùng/Ra sau cùng phải dịch CẢ CỤM cùng nhau,
GIỮ NGUYÊN thứ tự z nội bộ giữa các phần tử đã chọn (chuẩn Figma) — thay vì hành vi cũ chỉ dịch
1 phần tử. Đây là mục ⛔ bị xoá nhầm khỏi hàng đợi ở báo cáo E1-bổ-sung (02/08), Hoà nhắc lại và
chốt hướng giữa chuỗi hôm nay.

**Commit**: CHƯA — hạn chế sandbox (không chạy git trong worktree). Đã soạn lệnh bên dưới.

**Cách làm**:
- Phát hiện gốc rễ bug: `PresentEditor.tsx#onZOrder` (gốc) đọc `ed.selectedId` — theo
  `useEditor.ts`, đây CHỈ là phần tử được chọn CUỐI CÙNG trong `selectedIds` (dòng
  `selectedId = state.selectedIds[state.selectedIds.length - 1]`), KHÔNG phải "đang chọn đúng 1
  phần tử". Multi-select bấm Tiến/Lùi trước đây chỉ âm thầm dịch phần tử chọn cuối, các phần tử
  khác trong lô đứng yên — không báo lỗi, dễ bỏ sót khi review.
- `lib/present-editor/zorder-group.ts` (mới, thuần) — `reorderZOrderGroup(elements, selectedIds,
  dir)`: front/back gom hết phần tử đã chọn (giữ thứ tự tương đối) rồi đẩy nguyên khối ra
  đầu/cuối mảng; forward/backward gom các phần tử đã chọn thành từng KHỐI LIỀN KỀ (run) trong
  mảng gốc, mỗi khối dịch 1 bậc bằng cách hoán đổi với ĐÚNG 1 phần tử không-chọn ngay sát nó
  (forward xử lý từ khối cuối mảng về đầu, backward ngược lại — tránh khối đã xử lý làm lệch chỉ
  số khối chưa xử lý, các khối tách biệt luôn cách nhau ≥1 phần tử không-chọn nên an toàn). Chọn
  đúng 1 phần tử → kết quả Y HỆT thuật toán đơn gốc (đơn là trường hợp riêng của thuật toán
  chung, không phải nhánh code khác).
- `PresentEditor.tsx#onZOrder` — đổi từ đọc `ed.selectedId` (đơn) sang `ed.selectedIds` (mảng),
  gọi thẳng `reorderZOrderGroup` rồi gán `s.elements = ...` bên trong `ed.updateSlide` (cùng kiểu
  gán lại mảng như `onDeleteSelected` đã làm — `s.elements = s.elements.filter(...)`).

**Test/số đo**:
- `lib/present-editor/zorder-group.test.ts` (MỚI) — 17/17 ok (sucrase-node): 1 phần tử khớp thuật
  toán gốc (forward/backward/front/back + biên đã ở đỉnh/đáy), khối liền kề dịch cùng nhau giữ
  thứ tự nội bộ (thứ tự TRUYỀN vào `selectedIds` không ảnh hưởng kết quả — luôn lấy theo vị trí
  trong mảng gốc), 2 khối rời rạc dịch ĐỘC LẬP nhau, front/back giữ thứ tự tương đối của CẢ 2 phía
  (đã chọn lẫn còn lại), biên chọn rỗng/chọn hết/không mutate mảng gốc.
- `npx tsc --noEmit -p .` → sạch (0 lỗi).
- `npx eslint` trên 3 file đụng tới → sạch, 0 lỗi, 0 warning.
- `npm test` (full suite) → `REAL_EXIT=0`, xác nhận `zorder-group.test.ts` THẬT SỰ chạy trong log
  (17 ok đúng vị trí, không dòng nào khớp mẫu FAIL/not ok trong toàn log).

**💭 Chưa chắc / tự quyết**:
1. Không lọc phần tử KHOÁ (`el.locked`) ra khỏi lô z-order — khác với resize/dời nhóm (P2/E1 bổ
   sung) vốn loại phần tử khoá khỏi thao tác. Giữ nguyên vì `onZOrder` GỐC (đơn phần tử) cũng
   chưa từng lọc khoá — không tự ý thêm hành vi mới ngoài phạm vi "sửa cho đúng multi-select".
   Nếu Hoà muốn khoá cũng chặn z-order, báo riêng.

**Chi tiết đổi**:
- `lib/present-editor/zorder-group.ts` — MỚI: `ZOrderable`, `reorderZOrderGroup` (thuần, JSDoc
  giải thích thuật toán khối liền kề).
- `lib/present-editor/zorder-group.test.ts` — MỚI: 17 test case.
- `components/present-editor/PresentEditor.tsx` — import `reorderZOrderGroup`; `onZOrder` đổi
  sang đọc `ed.selectedIds`, gọi hàm thuần thay vì tự tính chỉ số splice.

**SẴN SÀNG COMMIT** (Hoà chạy trong worktree `interiorflow-phu` trên máy thật):
```bash
git add lib/present-editor/zorder-group.ts lib/present-editor/zorder-group.test.ts \
  components/present-editor/PresentEditor.tsx
git commit -m "fix(present-editor): z-order nhóm cho multi-selection (chuẩn Figma)

Chốt giữa chuỗi 04/08 (docs/CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md mục 'z-order
nhóm'), giải nốt mục ⛔ P2 còn sót (bị xoá nhầm khỏi hàng đợi ở báo cáo E1-bổ-sung
02/08). Bug gốc: onZOrder cũ đọc ed.selectedId — chỉ là phần tử được chọn CUỐI
CÙNG (xem useEditor.ts), nên multi-select bấm Tiến/Lùi trước đây chỉ dịch 1 phần
tử, các phần tử khác trong lô im lìm.

- lib/present-editor/zorder-group.ts (mới): reorderZOrderGroup — front/back gom
  cả lô giữ thứ tự tương đối; forward/backward gom lô thành từng khối liền kề,
  mỗi khối nhảy qua ĐÚNG 1 hàng xóm không-chọn, các khối tách biệt dịch độc lập
  nhau. 1 phần tử chọn = khớp y hệt thuật toán đơn gốc.
- lib/present-editor/zorder-group.test.ts (mới): 17 test case.
- PresentEditor.tsx: onZOrder đọc ed.selectedIds (mảng) thay vì ed.selectedId.

tsc sạch, eslint sạch, npm test full suite 0 fail."
```

**HÀNG ĐỢI CÒN LẠI** (sống trong file này, không sống trong chat) — bản 04/08 trước P4, THAY bằng
bản mới ngay dưới mục P4 · E4 phía sau.

## [04/08] P4 · E4 filter phần tử (blur/brightness/contrast/saturate) — XONG (chờ commit tay)

**Việc**: `docs/CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md` mục E4 — thêm filter CHUNG cho mọi loại
phần tử (text/shape/image): mờ (blur), sáng (brightness), tương phản (contrast), bão hoà
(saturate). Khác với `ImageAdjust` (sáng/tương phản/bão hoà/**nhiệt độ**) vốn CHỈ có ở ảnh —
audit `docs/AUDIT-EDITOR-TOOLKIT.md` xác nhận blur hoàn toàn chưa có trong toolkit, và
brightness/contrast/saturate trước đây chỉ áp được cho ảnh, không có ở shape/text.

**Commit status**: CHƯA commit — chờ Hoà chạy lệnh bên dưới trên máy thật.

**Cách làm**:
- `model.ts` — thêm `ElementFilter{blur,brightness,contrast,saturate}`, hằng
  `DEFAULT_ELEMENT_FILTER` (mọi giá trị = mặc định không đổi gì), hàm thuần
  `elementFilterToCssFilter` (object → chuỗi CSS `filter`, bỏ field ở giá trị mặc định, `blur=0`
  luôn bị bỏ dù có mặt). Thêm `filter?: ElementFilter` (ADDITIVE — optional) vào `BaseElement`.
- `Element.tsx` — xem-trước LIVE: gán `filter: elementFilterToCssFilter(el.filter)` vào `style`
  của `<div>` NGOÀI CÙNG (dùng chung cho text/shape/image). CSS `filter` trên phần tử cha áp
  SAU (chồng lên trên) filter đã có sẵn ở phần tử con (`ImageInner` có `adjustToCssFilter` riêng
  trên thẻ `<img>`) — không đụng/không override lẫn nhau, tự động ghép đúng.
- `render.ts` (đường xuất PDF/PNG/PPTX) — bake filter vào canvas qua `ctx.filter`:
  - `drawTextEl`, `drawShapeEl`: trước đây KHÔNG có `ctx.filter` nào — thêm thẳng
    `ctx.filter = elementFilterToCssFilter(el.filter)`.
  - `drawImageEl`: đã có `ctx.filter = adjustToCssFilter(el.adjust)` (ImageAdjust, riêng ảnh) —
    phải GHÉP với filter mới, không được ghi đè. Thêm hàm `composeFilters(...)` (mới, cục bộ
    trong render.ts) nối nhiều chuỗi filter CSS thành 1, bỏ qua các chuỗi `'none'` (canvas
    `ctx.filter` không hiểu `"none none"`). `drawImageEl` gọi
    `composeFilters(adjustToCssFilter(el.adjust), elementFilterToCssFilter(el.filter))`.
- `Inspector.tsx` — thêm `FilterControls` (mirror `AdjustControls`/`Slider` có sẵn) với 4 slider
  Mờ/Sáng/Tương phản/Độ bão hoà, gắn vào Panel "Sắp xếp" DÙNG CHUNG (đã render 1 lần bất kể
  `selected.kind`, không lặp lại code cho từng loại phần tử). `el.filter` là optional (ADDITIVE)
  — hiển thị mặc định `DEFAULT_ELEMENT_FILTER` khi chưa có, chỉ GHI `el.filter` khi người dùng
  thật sự kéo slider (không tự động tạo object rỗng khi mở Inspector).

**Test/số đo**:
- `lib/present-editor/element-filter.test.ts` (MỚI) — 10/10 ok (sucrase-node): `undefined` → 'none',
  mọi field mặc định → 'none' (kể cả object tường minh), từng field riêng ra đúng 1 cụm CSS,
  `blur=0` luôn bị bỏ dù field khác đã đổi, ghép đủ 4 field đúng thứ tự
  `blur → brightness → contrast → saturate` cách nhau 1 dấu cách.
- `npx tsc --noEmit -p .` → sạch (0 lỗi).
- `npx eslint` trên 5 file đụng tới (`render.ts model.ts element-filter.test.ts Inspector.tsx
  Element.tsx`) → sạch, 0 lỗi, 0 warning.
- `npm test` (full suite) → `EXIT:0`, xác nhận `element-filter.test.ts` THẬT SỰ chạy trong log
  (10/10 ok đúng vị trí, không dòng FAIL/not-ok thật nào trong toàn log — vài dòng chứa chữ
  "FAIL"/"Error" là NỘI DUNG test khác đang test thông báo lỗi giả lập, đã soát kỹ).

**💭 Chưa chắc / tự quyết**:
1. `FilterControls` gắn vào Panel "Sắp xếp" chung — CÙNG chỗ z-order/opacity/căn lề, KHÔNG tạo
   Panel riêng "Hiệu ứng lọc". Lý do: filter là thuộc tính chung mọi loại phần tử giống opacity,
   đặt cạnh nhau hợp lý hơn tách riêng — nhưng đây là quyết định về BỐ CỤC UI, Hoà có thể muốn vị
   trí khác (vd Panel riêng, hoặc đặt gần AdjustControls trong ảnh). Dễ di chuyển nếu cần.
2. Khoảng giá trị slider Mờ (blur) chọn 0–40px (áng chừng theo % chiều cao sân khấu tương tự cách
   `strokeWidth`/`fontSize` dùng đơn vị "%..H", nhưng blur ở đây dùng thẳng đơn vị px của canvas
   xuất — CHƯA có tiền lệ trong repo để đối chiếu). Nếu 40px quá to/nhỏ so với slide thật, báo lại
   để chỉnh.
3. Range Sáng/Tương phản (20–200%) và Bão hoà (0–250%) LẤY Y HỆT range đã có sẵn của
   `AdjustControls` (ảnh) cho nhất quán cảm giác kéo — không tự nghĩ range mới.

**Chi tiết đổi**:
- `lib/present-editor/model.ts` — thêm `ElementFilter`, `DEFAULT_ELEMENT_FILTER`,
  `elementFilterToCssFilter`; thêm `filter?: ElementFilter` vào `BaseElement` (cuối interface,
  additive).
- `lib/present-editor/render.ts` — thêm hàm cục bộ `composeFilters`; `drawTextEl`/`drawShapeEl`
  thêm `ctx.filter = elementFilterToCssFilter(el.filter)`; `drawImageEl` ghép
  `adjustToCssFilter(el.adjust)` + `elementFilterToCssFilter(el.filter)` qua `composeFilters`;
  import `elementFilterToCssFilter` từ `./model`.
- `lib/present-editor/element-filter.test.ts` — MỚI: 10 test case cho `elementFilterToCssFilter`.
- `components/present-editor/Element.tsx` — `style` (dùng chung mọi loại phần tử) thêm
  `filter: elementFilterToCssFilter(el.filter)`; import `elementFilterToCssFilter`.
- `components/present-editor/Inspector.tsx` — import `ElementFilter`, `DEFAULT_ELEMENT_FILTER`;
  thêm `<Sub>Hiệu ứng lọc</Sub>` + `<FilterControls .../>` vào Panel "Sắp xếp"; thêm component
  `FilterControls` (mirror `AdjustControls`).

**SẴN SÀNG COMMIT** (Hoà chạy trong worktree `interiorflow-phu` trên máy thật):
```bash
git add lib/present-editor/model.ts lib/present-editor/render.ts \
  lib/present-editor/element-filter.test.ts \
  components/present-editor/Element.tsx components/present-editor/Inspector.tsx
git commit -m "feat(present-editor): filter phần tử — blur/brightness/contrast/saturate (E4)

docs/CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md mục E4. Filter CHUNG cho mọi loại
phần tử (text/shape/image), tách biệt với ImageAdjust (sáng/tương phản/bão
hoà/nhiệt độ, riêng ảnh, không đổi). ADDITIVE — BaseElement.filter là optional,
phần tử cũ không có field vẫn hoạt động y hệt trước (elementFilterToCssFilter
trả 'none' khi undefined).

- model.ts: ElementFilter, DEFAULT_ELEMENT_FILTER, elementFilterToCssFilter
  (thuần, bỏ field ở giá trị mặc định, blur=0 luôn bỏ).
- Element.tsx: xem-trước LIVE qua CSS filter trên wrapper div dùng chung, chồng
  đúng lên adjustToCssFilter riêng của ảnh (không override).
- render.ts: bake vào canvas xuất PDF/PNG/PPTX — drawTextEl/drawShapeEl thêm
  ctx.filter mới hoàn toàn; drawImageEl ghép với adjustToCssFilter cũ qua hàm
  composeFilters mới (tránh ghi đè, tránh chuỗi 'none none' canvas không hiểu).
- Inspector.tsx: FilterControls (4 slider: Mờ/Sáng/Tương phản/Độ bão hoà) trong
  Panel Sắp xếp dùng chung.
- element-filter.test.ts (mới): 10 test case cho elementFilterToCssFilter.

tsc sạch, eslint sạch, npm test full suite 0 fail."
```

**HÀNG ĐỢI CÒN LẠI** (sống trong file này, không sống trong chat) — bản trước P5, THAY bằng bản
mới ngay dưới mục P5 phía sau.

## [04/08] P5 · Toolbar nổi 2.2.91 (thu khi kéo) — XONG (chờ commit tay)

**Việc**: `docs/IF-FEATURE-TREE.md` mã `2.2.91` — thanh công cụ nổi của phần tử đang chọn
(`TextToolbar.tsx`, Present) trước đây KHÔNG tự thu khi kéo, bám theo con trỏ và ĐÈ lên vùng
đang thao tác (Hoà phát hiện qua ảnh chụp lúc verify roundtrip 4.1.b/B2 — không phải bug do B2
gây ra, hành vi có sẵn từ trước). PHẠM VI BẮT BUỘC của spec gốc: sửa ở TẦNG NGUYÊN LIỆU dùng
chung, KHÔNG vá riêng trong `TextToolbar.tsx` (để CAD/Render dựng toolbar-nổi tương tự sau này
không dính lại đúng lỗi).

**Commit status**: CHƯA commit — chờ Hoà chạy lệnh bên dưới trên máy thật.

**Cách làm**:
- `lib/useFloatingToolbarVisibility.ts` (MỚI) — nguyên liệu dùng CHUNG, hook nhận `(dragging,
  livePos)` trả `{hidden, pos}`. `hidden` đi thẳng theo `dragging` (KHÔNG debounce bằng
  setTimeout — cảm giác "trễ nhẹ" nằm ở CSS `transition` phía component, xem JSDoc trong file
  giải thích vì sao debounce-trước-khi-đổi-state sẽ làm thanh phản hồi CHẬM lúc bắt đầu kéo,
  còn CSS transition mới đúng thứ triệt "nhấp nháy"). `pos` ĐÓNG BĂNG lúc `dragging===true`,
  chỉ đồng bộ lại theo `livePos` khi `dragging===false` (bắt đúng thời điểm "vừa thả" vì effect
  chạy lại khi `dragging` đổi giá trị) — giải chi tiết bắt buộc ④ "tính lại vị trí CHỈ lúc THẢ".
- `Element.tsx` — thêm ngưỡng PIXEL con trỏ thật `DRAG_ACTIVE_THRESHOLD_PX = 4` (chi tiết ①,
  KHÁC với ngưỡng `0.1%` sân khấu đã có sẵn cho field `moved` — field đó hiện KHÔNG được đọc ở
  đâu khác nên giữ nguyên, không đụng). Đo trong `onPointerMove` (KHÔNG phải `onPointerDown` —
  bấm để CHỌN sẽ làm thanh chớp tắt nếu ẩn ngay từ đó), gọi `onDragActiveChange(true)` ĐÚNG 1
  LẦN khi vừa vượt ngưỡng (cờ `activeNotified` trong `dragState`, tránh gọi lặp mỗi pointermove
  — hot path). Áp dụng cho MỌI `handle` (move/resize/rot), không chỉ 'move' — chi tiết ②. Gọi
  `onDragActiveChange(false)` ở `onPointerUp` nếu đã từng báo true.
- `EditorCanvas.tsx` — thêm state `dragActive` (mọi `<Element>` cùng gọi `setDragActive` qua
  `onDragActiveChange` — chỉ 1 element kéo được tại 1 thời điểm nhờ pointer capture nên không
  cần phân biệt ai đang kéo). Gọi `useFloatingToolbarVisibility(dragActive, liveTextToolbarPos)`
  — `liveTextToolbarPos` GIỮ NGUYÊN công thức `leftPct`/`topPct`/`below` cũ (không đổi số/luật
  lật xuống `y < 16`), chỉ đổi CHỖ tính (gom vào 1 object thay vì 3 biểu thức rời). Truyền
  `pos`/`hidden` từ hook xuống `<TextToolbar>` thay vì tính thẳng từ `soleTextEl.frame`.
- `TextToolbar.tsx` — thêm prop `hidden`; style thêm `opacity`/`transition`/`pointerEvents` đổi
  theo `hidden` — 80ms lúc ẩn (nhanh, phản hồi ngay khi bắt đầu kéo) / 150ms lúc hiện lại (chậm
  hơn 1 chút, đúng "CÓ TRỄ NHẸ" trong spec).

**Test/số đo**:
- `npx tsc --noEmit -p .` → sạch (0 lỗi).
- `npx eslint` trên 4 file đụng tới → 0 lỗi. 1 WARNING duy nhất trong `EditorCanvas.tsx`
  (`no-img-element`, dòng watermark `<img>`) — CÓ SẴN TỪ TRƯỚC, không phải do đợt này (không
  đụng dòng đó, chỉ thêm import + state + prop ở chỗ khác trong cùng file).
- `npm test` (full suite) → `EXIT:0`, không dòng FAIL/not-ok thật nào trong toàn log.
- **KHÔNG có test file mới** cho `useFloatingToolbarVisibility.ts` — hook chỉ bọc
  `useState`/`useEffect` thuần React (không có logic thuật toán để tách ra test bằng
  sucrase-node như `elementFilterToCssFilter`/`reorderZOrderGroup`), và repo KHÔNG có tiền lệ
  test hook React nào (đã `grep -rl "renderHook\|@testing-library"` toàn repo → rỗng, không có
  hạ tầng render hook để test). Xác nhận đúng bằng tsc+eslint+test suite (không vỡ chỗ khác) +
  đọc lại code 2 lượt, KHÔNG xác nhận bằng browser-verify thật (chỉ code phụ trong sandbox,
  không chạy được trình duyệt) — nếu Hoà verify tay thấy sai cảm giác thời lượng/ngưỡng, báo lại.

**💭 Chưa chắc / tự quyết**:
1. Áp ngưỡng-kéo cho CẢ handle `'rot'` (xoay), không chỉ move/resize — spec gốc chỉ nêu rõ 2
   trạng thái "di chuyển HOẶC tay nắm co giãn (resize)", không nhắc xoay. Quyết định gộp luôn vì
   vấn đề gốc (toolbar đè/giật vị trí khi kéo) xảy ra Y HỆT khi xoay — tách riêng sẽ để lọt đúng
   1 kiểu thao tác gây lại đúng triệu chứng đang sửa. Nếu Hoà muốn xoay KHÔNG ẩn thanh, báo riêng
   (đổi 1 điều kiện trong `onPointerMove`).
2. **KHÔNG debounce setTimeout** cho `hidden` — đọc "mờ đi ~80ms / hiện lại ~150ms CÓ TRỄ NHẸ
   (không trễ → tay rung là nhấp nháy)" là chỉ ĐỘ DÀI CSS transition (thời gian đổi opacity), chứ
   không phải khoảng CHỜ trước khi bắt đầu đổi. Suy luận: debounce-trước-khi-hiện-ẩn sẽ làm thanh
   phản hồi CHẬM ngay lúc BẮT ĐẦU kéo (ì) — còn easing CSS mượt qua thời gian đó vốn ĐÃ đủ để
   không có bước nhảy giật cục nào cho mắt bắt là "nhấp nháy" dù tay rung dao động quanh ngưỡng.
   Nếu Hoà browser-verify thấy vẫn nhấp nháy thật (vd tay rung đúng lúc ngưỡng 4px dao động qua
   lại rất nhanh khiến `hidden` đổi giá trị nhanh hơn 80ms → transition bị "cắt ngang" liên tục),
   đây là chỗ cần thêm debounce THẬT trong hook — chưa browser-verify được (sandbox không có
   trình duyệt), báo lại nếu thấy.
3. `dragActive` gộp CHUNG cho mọi `<Element>` (không phân theo id) — đúng với case hiện tại (chỉ
   1 toolbar, chỉ 1 phần tử kéo được cùng lúc nhờ pointer capture) nhưng nếu sau này có NHIỀU
   toolbar-nổi-độc-lập cùng lúc trên 1 màn (vd CAD + Present cùng hiện đồng thời, hiếm) thì
   `dragActive` dùng chung sẽ ẩn CẢ 2 dù chỉ 1 cái đang bị kéo đè — chưa có ca thật nào trong app
   để cần xử lý (đúng luật CLAUDE.md #4 — không xây cho ca chưa tồn tại), ghi TODO trong đầu để
   không quên nếu ca đó xuất hiện.

**Chi tiết đổi**:
- `lib/useFloatingToolbarVisibility.ts` — MỚI: `useFloatingToolbarVisibility<T>(dragging, livePos)
  → {hidden, pos}`.
- `components/present-editor/Element.tsx` — thêm prop `onDragActiveChange`; hằng
  `DRAG_ACTIVE_THRESHOLD_PX`; `dragState` thêm field `activeNotified`; `onPointerMove` đo ngưỡng
  4px + gọi callback 1 lần; `onPointerUp` gọi callback `false` nếu đã từng `true`.
- `components/present-editor/EditorCanvas.tsx` — import hook; state `dragActive`; tính
  `liveTextToolbarPos`; gọi hook; `<Element>` thêm `onDragActiveChange={setDragActive}`;
  `<TextToolbar>` đổi sang đọc `textToolbarPos`/`textToolbarHidden` từ hook thay vì tính thẳng.
- `components/present-editor/TextToolbar.tsx` — thêm prop `hidden`; style thêm
  `opacity`/`transition`/`pointerEvents` theo `hidden`.

**SẴN SÀNG COMMIT** (Hoà chạy trong worktree `interiorflow-phu` trên máy thật):
```bash
git add lib/useFloatingToolbarVisibility.ts components/present-editor/Element.tsx \
  components/present-editor/EditorCanvas.tsx components/present-editor/TextToolbar.tsx
git commit -m "fix(present-editor): toolbar nổi tự thu khi kéo (2.2.91)

docs/IF-FEATURE-TREE.md mã 2.2.91. TextToolbar trước đây bám theo con trỏ và
đè lên vùng đang thao tác khi kéo (di chuyển/resize/xoay) — spec bắt buộc sửa
ở tầng nguyên liệu dùng chung, không vá riêng trong TextToolbar.tsx, để
CAD/Render dựng toolbar-nổi tương tự sau này không dính lại đúng lỗi.

- lib/useFloatingToolbarVisibility.ts (mới): hook dùng chung — hidden đi
  thẳng theo dragging (CSS transition lo phần mờ/hiện mượt, không debounce
  setTimeout); pos đóng băng lúc đang kéo, chỉ đồng bộ lại đúng lúc thả.
- Element.tsx: ngưỡng 4px PIXEL thật trước khi coi là 'đang kéo' (đo ở
  pointermove, không phải pointerdown — bấm để chọn không còn làm thanh chớp
  tắt); áp cho mọi handle (move/resize/rot), không chỉ move.
- EditorCanvas.tsx: dragActive tổng hợp từ mọi Element; TextToolbar đọc vị
  trí/hidden từ hook thay vì tính thẳng từ frame sống mỗi render.
- TextToolbar.tsx: opacity/transition/pointerEvents theo hidden (80ms ẩn,
  150ms hiện).

tsc sạch, eslint sạch (1 warning có sẵn từ trước, không liên quan), npm test
full suite 0 fail. Không có test tự động cho hook (không có logic thuật toán
để tách test thuần, repo chưa có hạ tầng render-hook) — cần Hoà browser-verify
cảm giác thời lượng/ngưỡng thật trên máy."
```

## [04/08] P6 · TICKET-PRESENT-UI-GON — DỪNG, cần Hoà quyết (⛔ x2) — chưa viết code

**Việc**: đọc `docs/TICKET-PRESENT-UI-GON-2026-08-01.md` (P6a bỏ vệt scrim sau chữ, P6b toolbar
đầy tay), đọc `lib/adaptive-contrast.ts` (632 dòng, module dùng chung toàn app), đọc lại logic
scrim hiện có trong `Element.tsx` (dòng ~425-650), đọc `Toolbar.tsx` (353 dòng) để lên kế hoạch
P6b. Không viết code — 2 điểm dưới đây đều rơi vào điều kiện dừng của LUAT-VAN-HANH-LOOP
("quyết định cơ chế/giao diện/chuẩn nghề thật"), không phải lỗi thực thi (không tính vào "hỏng
2 lần").

- **Commit**: không có gì để commit — giai đoạn này chỉ đọc + phân tích.
- **Test/số đo**: không áp dụng (chưa sửa file nào).

**⛔ CẦN HOÀ #1 — P6a đá luật cứng có sẵn trong code**:
Ticket viết "CHỌN MÀU CHỮ tương phản với nền đã đo (trắng/đen/màu deck)". Nhưng `Element.tsx`
đang có comment luật cứng, viết rõ từ trước (không phải tôi tự đặt ra):
> "ở Present, MÀU CHỮ LÀ QUYẾT ĐỊNH THIẾT KẾ của người dùng (họ tự chọn trong Inspector) —
> tuyệt đối KHÔNG tự đổi màu chữ của họ."
Hai điều này ngược nhau thẳng: ticket bảo tự chọn màu chữ theo nền đo được, luật cũ cấm đúng
việc đó. Tôi KHÔNG tự ý chọn bên nào — đây đúng dạng "quyết định chuẩn nghề" phải hỏi.
- Nếu Hoà xác nhận **giữ luật cũ** (không tự đổi màu chữ): P6a chỉ còn phần không đụng luật —
  hạ vệt scrim (sương mờ sau chữ) thành TUỲ CHỌN, mặc định TẮT, không xoá năng lực (đúng câu
  "Vệt scrim hạ thành tuỳ chọn TẮT mặc định — không xoá năng lực" trong ticket) — việc này làm
  được ngay, không xung đột.
- Nếu Hoà xác nhận **ticket đúng, đổi luật cũ**: cần thêm cơ chế tự chọn màu chữ theo độ sáng nền
  đo được — nhưng Present hiện CHỈ dùng tầng 2 (CSS fallback, không đo pixel thật) của
  `adaptive-contrast.ts`, phần đo pixel thật (tầng 1 `readImageRegion`) tồn tại trong file nhưng
  Present chưa dùng. Muốn AA-gate đúng nghĩa ("text-shadow MẢNH chỉ khi độ tương phản vẫn
  thiếu") cần nối Present vào tầng 1 — việc lớn hơn 1 dòng sửa, cần Hoà xác nhận có muốn làm
  trong đợt này hay để việc riêng.
- Dù chọn hướng nào: chỗ export (PDF/PNG/PPTX qua `render.ts`) phải khớp đúng những gì hiện trên
  màn — sẽ tự kiểm khi code xong.

**⛔ CẦN HOÀ #2 — P6b là quyết định bố cục UI thật, không phải nối dây cơ học**:
Ticket muốn gom "Sắp xếp" (align/distribute/z-order/group/khoá-ẩn) và "Hiệu ứng" (màu chữ/
fill(E3)/mask(E2)/filter(E4)/opacity/shadow) lên `Toolbar.tsx` (thanh trên) theo cụm, thu gọn
thành menu ▾ ở màn hẹp — "KHÔNG thêm năng lực mới, chỉ đưa lên mặt tiền". Nhưng các năng lực đó
HIỆN ĐANG sống ở `Inspector.tsx` (panel phải) và `TextToolbar.tsx` (thanh nổi riêng cho chữ) —
không phải trên `Toolbar.tsx`. Việc này là:
1. Một thiết kế bố cục UI thật (cụm nào, thứ tự nào, icon/nhãn gì, ngưỡng thu gọn màn hẹp bao
   nhiêu px) — không có "đáp án đúng duy nhất" suy ra máy móc từ ticket, cần gu của Hoà.
2. "Điều kiện xong" của cả P6a lẫn P6b ghi rõ **so ảnh chụp Hoà đã khoanh** — sandbox này không
   có trình duyệt, tôi không thể tự chấm bài mình đúng/sai theo ảnh chụp đó. Viết ~300-500 dòng
   UI mới rồi để Hoà mới phát hiện sai bố cục sẽ tốn công sửa nhiều hơn là hỏi trước 1 câu.

**Đề xuất của tôi (chờ Hoà gật hoặc chỉnh)**: khi có xác nhận, tôi làm theo thứ tự an toàn —
(a) P6a phần không xung đột (scrim → tuỳ chọn, mặc định tắt) trước, xong ngay;
(b) P6b: bắt đầu bằng 1 cụm dễ nhất/ít rủi ro nhất trước (vd chỉ thêm z-order + khoá/ẩn — đã có
sẵn logic ở EditorCanvas/Inspector, chỉ cần nút gọi lại — vào `Toolbar.tsx`), để Hoà xem ảnh
chụp xác nhận đúng hướng rồi mới làm tiếp cụm "Hiệu ứng" (phức tạp hơn, cần nối Inspector's
fill/mask/filter handlers qua Toolbar) — tránh làm hết 1 lần rồi sai hướng toàn bộ.

**HÀNG ĐỢI CÒN LẠI** (sống trong file này, không sống trong chat):
1. **P6 — CHỜ HOÀ TRẢ LỜI 2 ⛔ Ở TRÊN** trước khi viết code tiếp (P6a phần scrim-tuỳ-chọn có thể
   làm ngay nếu Hoà chỉ cần gật đầu nhanh; P6b cần Hoà xem thử 1 cụm trước khi làm hết).
2. Merge phần ĐÃ XONG (P1→P5, xem khối lệnh ngay dưới) — không cần chờ P6, Hoà chạy được ngay.
   P6 sẽ là 1 (hoặc vài) commit + merge riêng SAU khi làm xong, tách khỏi đợt merge này.

---

## [04/08] Lệnh merge nhanh-phu → main (P1–P5, KHÔNG gồm P6 — P6 đang chờ Hoà quyết ở trên)

**Điều kiện trước khi chạy**: đã `git add`+`git commit` bằng TỪNG khối lệnh trong mục
"SẴN SÀNG COMMIT" của các phần P1, P2, E1-bổ-sung, P3, z-order-nhóm, P4, P5 phía trên trong file
này (mỗi phần có sẵn khối lệnh riêng — soát lại nếu commit nào chưa chạy tay thì chạy trước).

**Danh sách commit gộp vào nhánh `nhanh-phu` (đối chiếu — không phải lệnh, để Hoà tự kiểm trước
khi merge)**:
| # | Việc | File chính đã đổi |
|---|---|---|
| 1 | P1 · E2 mask ảnh | model.ts, shape-geometry.ts(+test), render.ts, export.ts, Element.tsx, Inspector.tsx |
| 2 | P2 · E1 group/ungroup | (xem mục P2 phía trên, file cụ thể trong SẴN SÀNG COMMIT của mục đó) |
| 3 | E1 bổ sung 02/08 · resize theo nhóm giữ tỉ lệ | (xem mục tương ứng phía trên) |
| 4 | P3 · E3 fill overlay | (xem mục tương ứng phía trên) |
| 5 | z-order nhóm 04/08 | (xem mục tương ứng phía trên) |
| 6 | P4 · E4 filter phần tử | model.ts, render.ts, element-filter.test.ts(mới), Inspector.tsx |
| 7 | P5 · toolbar nổi 2.2.91 | useFloatingToolbarVisibility.ts(mới), Element.tsx, EditorCanvas.tsx, TextToolbar.tsx |

**Lệnh (chạy trên máy thật)**:
```bash
cd ~/Downloads/interiorflow
git fetch --all 2>/dev/null || true   # bỏ qua nếu repo không có remote, chỉ có local worktree

# xem trước danh sách commit sẽ gộp, đối chiếu với bảng trên
git log main..nhanh-phu --oneline

# xem trước danh sách file sẽ đổi trên main sau merge
git diff main..nhanh-phu --stat

# merge thật (Hoà xác nhận sẽ 3-way sạch, không đụng brand-kit)
git checkout main
git merge nhanh-phu -m "merge: nhanh-phu P1-P5 (mask ảnh, group, resize-nhóm, fill overlay, z-order nhóm, filter phần tử, toolbar nổi 2.2.91)"

# sau merge: chạy lại kiểm tra trên main cho chắc (không bắt buộc nhưng nên làm)
npx tsc --noEmit -p .
npm test
```
Nếu `git log main..nhanh-phu --oneline` ra danh sách khác bảng trên (thiếu/thừa commit) — DỪNG,
đối chiếu lại trước khi merge thật, đừng chạy `git merge` khi số dòng không khớp.

P6 sẽ merge riêng bằng lệnh tương tự (nhánh `nhanh-phu` tiếp tục nhận thêm commit P6 sau khi Hoà
trả lời 2 mục ⛔) — không cần đợi P6 mới merge phần này.

---

## [04/08] P6a — AA tự chọn màu chữ + scrim tuỳ chọn tắt mặc định — XONG (chờ commit tay)

**Việc**: Hoà đã chốt cả 2 mục ⛔ ở entry trước (carve-out đúng phạm vi cho luật "không tự đổi
màu chữ": chỉ áp khi FAIL AA + text chưa ai chỉnh tay; scrim hạ tuỳ chọn tắt mặc định, giữ năng
lực). Làm đúng theo lệnh Hoà, KHÔNG tự suy diễn thêm:
- Khi chữ FAIL WCAG AA với nền/ảnh đo THẬT (tầng 1 `readImageRegion`, đã có sẵn trong
  `adaptive-contrast.ts` nhưng Present trước giờ chưa dùng tới) → hệ TỰ chọn màu dễ đọc
  (trắng → đen → màu deck, ĐÚNG thứ tự Hoà nêu) làm mặc định; text-shadow MẢNH chỉ thêm khi
  NGAY CẢ ứng viên tốt nhất vẫn không đạt AA.
- Màu đã đủ contrast → KHÔNG đụng. User tự chọn màu tay (TextToolbar hoặc Inspector) → khoá cơ
  chế tự sửa cho riêng chữ đó VĨNH VIỄN (≤2 click để đổi lại, đúng yêu cầu).
- Vệt scrim cũ (sương mờ sau chữ) hạ thành toggle trong Inspector, mặc định **TẮT** — công thức/
  năng lực cũ giữ nguyên 100%, chỉ đổi điều kiện bật.
- Export PDF/PNG (bake qua `render.ts`) và PPTX (cả 2 nhánh "content" đọc `el.color` thẳng lẫn
  nhánh "image" bake qua `render.ts`) đều tự động ăn đúng màu đã chốt — kiến trúc "đo 1 lần, ghi
  thẳng vào `el.color`+`el.autoShadow`" (xem JSDoc đầu `text-contrast.ts`) khiến 2 nơi này KHÔNG
  cần đo lại pixel, tự động khớp preview.

- **Commit**: CHƯA commit — worktree không chạy được git từ sandbox. Khối lệnh ở mục
  **SẴN SÀNG COMMIT** cuối phần này.
- **Cách làm**:
  1. `model.ts` — thêm `TextElement.colorAuto?/scrimEnabled?/autoShadow?`; `makeText()` mặc
     định `colorAuto: true` cho text MỚI (file `.idfp` cũ có `colorAuto === undefined` → coi
     như `false`, KHÔNG bị đụng tới — chỉ text tạo sau khi có bản này mới có hiệu ứng an toàn).
  2. `lib/present-editor/text-contrast.ts` (MỚI, hàm THUẦN, không DOM) — `findTextBackdrop` (dò
     ảnh/nền để đo, tách riêng khỏi `textOverImage` cũ trong Element.tsx để không đụng 3 nơi
     đang gọi hàm đó), `aaRatioForFontSize`, `pickAutoTextColor`, `autoShadowCss`/
     `autoShadowCanvasLayers`, `resolveAutoTextColor` (orchestrator — trả `null` nếu màu hiện
     tại đã đạt AA).
  3. `EditorCanvas.tsx` — 1 `useEffect` MỚI: với mỗi text `colorAuto === true`, tìm nền qua
     `findTextBackdrop`, đo bằng `readImageRegion` (đã có sẵn, tầng 1), tính fix qua
     `resolveAutoTextColor`, ghi thẳng vào element qua `onUpdateText` đã có sẵn. Có guard
     `cancelled` (huỷ nếu effect chạy lại giữa lúc đang đo async) + guard `colorAuto !== true`
     lúc ghi (phòng trường hợp user tự chọn màu ĐÚNG lúc đang chờ đo xong). Chữ ký phụ thuộc
     dùng chuỗi đã làm tròn % khung (không phải object `slide` sống) để KHÔNG chạy lại mỗi khung
     hình lúc kéo/resize — chỉ chạy lại khi lệch đủ 1% hoặc danh sách đổi thật.
  4. `render.ts#buildTextPaint` — nối `autoShadowCanvasLayers(...)` vào CUỐI mảng `shadows` khi
     `el.autoShadow` (thứ tự khớp `paintWithFx` vẽ mảng NGƯỢC — cuối mảng = vẽ trước = nằm dưới
     cùng, khớp thứ tự CSS `[fxShadow, plan?.textShadow, autoShadowCss(...)]` ở Element.tsx).
  5. `Element.tsx` — scrim giờ cần `overImage && el.scrimEnabled === true` (trước: chỉ cần
     `overImage`); `textShadow` gộp thêm `autoShadowCss(el.color)` khi `el.autoShadow`.
  6. `TextToolbar.tsx` + `Inspector.tsx` — cả 2 chỗ pick màu tay đều set thêm
     `t.colorAuto = false`; `Inspector.tsx` thêm 1 toggle text-button "Sương sau chữ (khi đè
     ảnh)" bind `el.scrimEnabled`.
- **Test/số đo**:
  - `lib/present-editor/text-contrast.test.ts` (MỚI, 22 case, thuần logic — không cần DOM/canvas,
    đúng quy ước repo) — `sucrase-node`: **22 ok, 0 fail**.
  - `npx tsc --noEmit -p .` (toàn repo) — **sạch, 0 lỗi**.
  - `npx eslint` trên 8 file đã sửa (`model.ts`, `text-contrast.ts`(+test), `render.ts`,
    `Element.tsx`, `TextToolbar.tsx`, `Inspector.tsx`, `EditorCanvas.tsx`) — **0 lỗi**, 1 warning
    (Next `no-img-element` ở `EditorCanvas.tsx:391`, KHÔNG liên quan việc này — `<img>` có sẵn
    từ trước, không phải dòng tôi thêm).
  - `npm test` (toàn repo qua `xargs -P8`) — **exit code 0**, không có dòng FAIL thật (chỉ có log
    giả lập lỗi có chủ đích của các test khác, ví dụ "BlenderMissingError"/"NoTextProviderError"
    — đúng tên test, không phải test của việc này).
- 💭 **Chưa chắc**:
  1. `deckAccentColor` (ứng viên màu thứ 3, "màu deck") CHỈ truyền được ở `EditorCanvas.tsx` qua
     prop `palette?.[0]` (màu đầu bảng màu deck) — `SlideStrip.tsx`/`PlayerElements.tsx` không có
     prop `palette` sẵn nên KHÔNG truyền được ứng viên deck ở 2 nơi đó. Không sao vì 2 file này
     chỉ ĐỌC `el.color` đã chốt sẵn (không tự đo/tự sửa) — nhưng ghi ra đây để Hoà biết nếu sau
     này muốn dùng `palette?.[0]` khác đi (vd theo brand-kit thay vì màu đầu bảng).
  2. Chưa xuất thử 1 file PDF/PNG/PPTX thật rồi so mắt màu chữ auto-fix với màn hình (sandbox
     không có canvas thật cho `readImageRegion`/trình duyệt để chạy Present hết luồng) — chỉ có
     test đơn vị cho phần hình học/logic thuần (`text-contrast.test.ts`) và tsc/eslint cho phần
     còn lại. Rủi ro thấp vì kiến trúc "đo 1 lần, ghi thẳng" khiến render.ts/export.ts tự động ăn
     đúng dữ liệu đã chốt, không có đường nào tính lại khác đi — nhưng vẫn là điều CHƯA tự mắt
     xác nhận được trong sandbox.
  3. Ngưỡng AA theo cỡ chữ (`aaRatioForFontSize`) dùng quy đổi gần đúng `fontSizePct * 10.8` (ước
     lượng px @1080, theo đúng quy ước "5 = 54px @1080" đã ghi sẵn trong `model.ts`) — TƯƠNG ĐỐI
     theo % sân khấu nên không lệ thuộc độ phân giải xuất cụ thể, nhưng đây vẫn là một quy đổi
     xấp xỉ (không phải đo px thật lúc render) — nêu ra để Hoà biết nếu WCAG cần chính xác tuyệt
     đối thì cách này chưa phải đo px thật.
- Không có mục ⛔ CẦN HOÀ — phạm vi cơ chế đã được Hoà chốt rõ, không còn quyết định nghề/UI nào
  cần hỏi thêm cho riêng P6a.

**Chi tiết đổi (đọc nhanh)**:
- `lib/present-editor/model.ts` — thêm 3 field `TextElement` (`colorAuto?/scrimEnabled?/
  autoShadow?`, mỗi field kèm JSDoc), `makeText()` mặc định `colorAuto: true`.
- `lib/present-editor/text-contrast.ts` (MỚI) — module hàm thuần cho P6a.
- `lib/present-editor/text-contrast.test.ts` (MỚI) — 22 assertion.
- `lib/present-editor/render.ts` — import `autoShadowCanvasLayers`; `buildTextPaint()` nối thêm
  layer bóng khi `el.autoShadow`.
- `components/present-editor/Element.tsx` — import `autoShadowCss`; scrim gate theo
  `scrimEnabled`; `textShadow` gộp thêm `autoShadowCss`.
- `components/present-editor/TextToolbar.tsx` — `onPick` màu tay set `colorAuto = false`.
- `components/present-editor/Inspector.tsx` — `ColorRow onChange` set `colorAuto = false`; thêm
  toggle `scrimEnabled`.
- `components/present-editor/EditorCanvas.tsx` — import `readImageRegion`/`findTextBackdrop`/
  `resolveAutoTextColor`; thêm `useMemo` chữ ký phụ thuộc + `useEffect` sửa màu tự động.

**SẴN SÀNG COMMIT**:
```bash
cd ~/Downloads/interiorflow-phu
git add lib/present-editor/model.ts \
        lib/present-editor/text-contrast.ts \
        lib/present-editor/text-contrast.test.ts \
        lib/present-editor/render.ts \
        components/present-editor/Element.tsx \
        components/present-editor/TextToolbar.tsx \
        components/present-editor/Inspector.tsx \
        components/present-editor/EditorCanvas.tsx
git commit -m "feat(present): P6a - tu chon mau chu AA-safe + scrim tuy chon tat mac dinh

- text moi (colorAuto=true mac dinh) tu sua mau khi FAIL WCAG AA voi nen do that
  (trang->den->mau deck, dung thu tu Hoa chot), text-shadow manh chi khi van thieu
- khong dung chu da du contrast, khong de mau user da tu chon (chon tay = khoa
  colorAuto vinh vien)
- scrim (suong sau chu) ha thanh toggle mac dinh TAT, giu nguyen nang luc cu
- export PDF/PNG/PPTX tu dong an dung mau da chot (kien truc do-1-lan-ghi-thang)
- tests: text-contrast.test.ts moi (22 case), tsc/eslint/npm test sach"
```

**HÀNG ĐỢI CÒN LẠI** (sống trong file này, không sống trong chat):
1. **P6b bước 1** — XONG, xem entry ngay dưới. **DỪNG theo lệnh Hoà** — chờ Hoà gật ảnh đúng
   hướng trước khi đụng cụm "Hiệu ứng" (màu chữ/fill/mask/filter).
2. Sau khi P6a + P6b-bước-1 đều đã commit tay: cập nhật lại khối lệnh merge cuối cùng ở mục
   "Lệnh merge nhanh-phu → main" phía trên (hiện mới có P1-P5, chưa gồm P6).

---

## [04/08] P6b bước 1 — cụm "Sắp xếp" lên Toolbar.tsx — XONG, DỪNG chờ Hoà duyệt ảnh

**Việc**: đúng theo lệnh Hoà — CHỈ gom cụm "Sắp xếp" (align · z-order · group · khoá) lên
`Toolbar.tsx`, nối lại NGUYÊN VẸN 5 hàm đã có sẵn trong `PresentEditor.tsx` (đang phục vụ
`Inspector.tsx`): `onZOrder`, `onAlignSelection`, `onGroupSelected`, `onUngroupSelected`,
`onToggleLockSelected` — không viết thêm 1 dòng logic nghiệp vụ mới, chỉ thêm 1 lối gọi thứ 2
cho cùng các hàm đó. Xong → **DỪNG NGAY** theo đúng lệnh, KHÔNG đụng cụm "Hiệu ứng".

- **Commit**: CHƯA commit — worktree không chạy được git từ sandbox. Khối lệnh ở mục
  **SẴN SÀNG COMMIT** cuối phần này.
- **Cách làm**:
  1. `Toolbar.tsx` — thêm import icon (`ArrowUp/ArrowDown/ChevronsUp/ChevronsDown/
     AlignStartVertical/.../Group/Ungroup/Lock/Unlock` — CÙNG bộ icon `Inspector.tsx` đã dùng
     cho các nút tương đương, giữ nhất quán hình ảnh) + `type EditorSlide` + `type AlignMode as
     GroupAlignMode` (từ `lib/present-editor/align.ts`, cùng nguồn Inspector.tsx đã import).
  2. Thêm 6 prop MỚI vào `Props`: `slide?`, `selectedIds: string[]`, `onZOrder`,
     `onAlignSelection`, `onGroup`, `onUngroup`, `onToggleLock` — chữ ký giống HỆT prop cùng tên
     trong `Inspector.tsx` (không bịa chữ ký khác cho cùng khái niệm).
  3. Trong component: tính `multiCount`/`selectedGroupCount`/`anyUnlocked` từ `slide`+
     `selectedIds` — CÙNG công thức Inspector.tsx đang dùng (dòng ~204-213/~815-821 file đó),
     chỉ chép lại phép tính (không phải logic MỚI, Inspector cũng tự tính từ 2 prop thô này chứ
     không nhận sẵn số đã tính).
  4. Render 1 cụm `IconOnly` mới (dùng LUÔN component `IconOnly` sẵn có trong chính
     `Toolbar.tsx`, không tạo kiểu nút mới) ngay sau cụm hình khối, trước Divider "Mẫu": 6 nút
     căn (trái/giữa-ngang/phải/trên/giữa-dọc/dưới, `disabled` khi `multiCount<2`) → 4 nút
     z-order (trước cùng/tiến 1/lùi 1/sau cùng, `disabled` khi `multiCount<1`) → nút Nhóm
     (`disabled` khi `multiCount<2`) → nút Bỏ nhóm (`disabled` khi `selectedGroupCount<1`) →
     1 nút Khoá/Mở khoá đổi icon theo `anyUnlocked` (`disabled` khi `multiCount<1`).
  5. `PresentEditor.tsx` — nối 6 prop mới vào `<Toolbar .../>` (dòng ~1595): `slide={ed.slide}`,
     `selectedIds={ed.selectedIds}`, và 5 hàm ĐÃ CÓ SẴN truyền y nguyên (`onZOrder`,
     `onAlignSelection`, `onGroupSelected`→`onGroup`, `onUngroupSelected`→`onUngroup`,
     `onToggleLockSelected`→`onToggleLock`) — không tạo hàm mới, không đụng logic bên trong các
     hàm đó (vẫn y hệt hành vi khi gọi từ Inspector.tsx).
- **Mô tả ảnh chụp** (sandbox không có trình duyệt để chụp thật — mô tả bằng lời để Hoà hình
  dung, xem trên máy thật để duyệt bằng mắt): Thanh công cụ trên cùng, SAU cụm 5 icon hình khối
  (vuông/tròn/tam giác/đa giác/mũi tên/đường thẳng) và TRƯỚC nút "Mẫu" — thêm 1 dải ~11 icon
  vuông 38×38px cùng kiểu `IconOnly` đã có (khung bo góc nhạt, icon `lucide-react` 15px, nền xám
  nhạt khi bật/xám mờ khi disabled): 6 icon căn (kiểu chữ "I" có gạch ở 2 đầu, quen thuộc kiểu
  Figma/Canva) sát nhau không có gạch phân cách, rồi 4 icon z-order (mũi tên đơn/kép lên-xuống),
  rồi icon Nhóm (2 hình chồng) + icon Bỏ nhóm (2 hình tách), rồi 1 icon khoá đơn (đổi hình ổ khoá
  đóng/mở tuỳ trạng thái chọn). KHÔNG có menu ▾ thu gọn ở màn hẹp (ticket gốc có nhắc, nhưng Hoà
  chỉ chốt bước 1 là gom cụm phẳng — thu-gọn-màn-hẹp để dành quyết định sau khi Hoà gật hướng
  này đã đúng). Khi KHÔNG chọn gì: toàn bộ 11 nút xám mờ/disabled (khớp trạng thái "chưa có gì
  để sắp xếp"). Khi chọn 1 phần tử: 6 nút căn + Nhóm vẫn mờ (cần ≥2), 4 nút z-order + Khoá sáng
  lên dùng được. Khi chọn ≥2: toàn bộ sáng (trừ Bỏ nhóm nếu chưa ai thuộc cụm nào).
- **Test/số đo**:
  - `npx tsc --noEmit -p .` (toàn repo) — **sạch, 0 lỗi**.
  - `npx eslint components/present-editor/Toolbar.tsx components/present-editor/
    PresentEditor.tsx` — **sạch, 0 lỗi, 0 warning**.
  - `npm test` (toàn repo qua `xargs -P8`) — **exit code 0**, không có dòng FAIL thật.
- 💭 **Chưa chắc**:
  1. Ticket P6b liệt kê cụm là "align · z-order · group · khoá/**ẩn**" — chữ "ẩn" (hide hàng
     loạt cho cả lựa chọn) KHÔNG có logic sẵn nào để nối (chỉ có `LayerPanel.tsx#onToggleHidden`
     ẩn/hiện TỪNG phần tử 1 trong ô Lớp, không phải thao tác hàng loạt cho cả `selectedIds` như
     `onToggleLockSelected`). Theo đúng lệnh "logic đã có ở EditorCanvas/Inspector — chỉ nối nút
     gọi lại", tôi KHÔNG tự viết thêm 1 hàm `onToggleHideSelected` mới (đó sẽ là năng lực MỚI,
     không phải nối dây) — cụm hiện tại chỉ có "Khoá" (đúng nghĩa, có sẵn), thiếu phần "Ẩn"
     hàng loạt. Nếu Hoà muốn có nút Ẩn hàng loạt thật, đây là việc riêng cần Hoà xác nhận trước
     (thêm 1 hàm mới trong PresentEditor.tsx, không còn là "chỉ nối dây" nữa).
  2. Vị trí đặt cụm (sau hình khối, trước Mẫu) là lựa chọn của tôi dựa theo luồng tự nhiên
     "thêm nội dung → sắp xếp nội dung → chọn mẫu" — KHÔNG có chỉ dẫn vị trí cụ thể trong ticket/
     lệnh Hoà. Đây chính là điểm Hoà cần xem ảnh/máy thật để gật hoặc chỉnh, đúng tinh thần
     "làm từng cụm + gửi ảnh" Hoà đã đặt ra cho bước này.
- Không có mục ⛔ CẦN HOÀ mới (mục 💭 #1 ở trên là điểm THÔNG BÁO, không phải chặn — cụm vẫn hoạt
  động đầy đủ với 10/11 nút, chỉ thiếu "Ẩn" hàng loạt do không có logic sẵn để nối).

**Chi tiết đổi (đọc nhanh)**:
- `components/present-editor/Toolbar.tsx` — thêm import icon/type; 6 prop mới trong `Props`;
  tính `multiCount/selectedGroupCount/anyUnlocked`; render cụm 11 `IconOnly` mới.
- `components/present-editor/PresentEditor.tsx` — nối 6 prop mới vào `<Toolbar .../>`, dùng lại
  nguyên 5 hàm đã có (`onZOrder`/`onAlignSelection`/`onGroupSelected`/`onUngroupSelected`/
  `onToggleLockSelected`).

**SẴN SÀNG COMMIT**:
```bash
cd ~/Downloads/interiorflow-phu
git add components/present-editor/Toolbar.tsx \
        components/present-editor/PresentEditor.tsx
git commit -m "feat(present): P6b buoc 1 - cum Sap xep len Toolbar.tsx

- noi 5 ham da co san (onZOrder/onAlignSelection/onGroupSelected/onUngroupSelected/
  onToggleLockSelected) vao Toolbar.tsx qua 6 prop moi, khong viet logic nghiep vu moi
- cum icon: can theo nhau (6) - thu tu lop (4) - nhom/bo nhom (2) - khoa (1), gating
  giong het cong thuc Inspector.tsx dang dung
- DUNG theo lenh Hoa, chua dung cum Hieu ung (mau chu/fill/mask/filter)
- tests: tsc/eslint/npm test sach"
```

**HÀNG ĐỢI CÒN LẠI** (sống trong file này, không sống trong chat):
1. **DỪNG — chờ Hoà xem ảnh/máy thật, gật hướng cụm "Sắp xếp"** trước khi làm cụm "Hiệu ứng"
   (màu chữ/fill/mask/filter) của P6b. Nếu Hoà muốn nút "Ẩn" hàng loạt thật (mục 💭 #1) — cần
   xác nhận trước vì đó là logic MỚI, không phải nối dây.
2. Sau khi P6a + P6b-bước-1 đều đã commit tay: cập nhật lại khối lệnh merge cuối cùng ở mục
   "Lệnh merge nhanh-phu → main" phía trên (hiện mới có P1-P5, chưa gồm P6).

---

## [02/08] P6c — sửa kính lỏng/mờ (K1/K2/K3, TICKET-FIX-KINH-LONG-2026-08-02) — XONG

**Việc**: Hoà báo "mấy cái kính lỏng bị lỗi" — đọc `docs/TICKET-FIX-KINH-LONG-2026-08-02.md`
(Cowork đã chẩn từ code trước, ghi rõ gốc lỗi + hướng sửa). Sửa đúng theo ticket, ƯU TIÊN trước
cả hàng đợi P6a/P6b đang chờ (P6a + P6b-bước-1 CŨ vẫn giữ nguyên trạng "đã xong, chờ Hoà" — 2
việc đó KHÔNG bị đụng lại trong đợt này).

- **Gốc lỗi (đúng như ticket chẩn, xác nhận lại từ code)**: `opacity` đặt ở WRAPPER cha
  (`TextToolbar.tsx` dòng ~205 cũ) — khi opacity<1, phần tử đó trở thành TỔ TIÊN có opacity phân
  số, tự tạo 1 "backdrop root" cô lập theo spec filter-effects-2. Trong lúc fade 80-150ms, MỌI
  `backdrop-filter` bên trong (pill/note/popover) không còn lấy được nền THẬT phía sau nữa —
  chúng lấy nền của backdrop root cô lập đó (gần như trong suốt/xám) → blur "chết", nhìn như
  kính hỏng/nháy xám đúng lúc đang mờ dần. Đây là hành vi CSS chuẩn (không phải bug trình duyệt),
  self-opacity (đặt Ở CHÍNH phần tử có backdrop-filter) thì KHÔNG bị — chỉ ancestor mới gây.
- **Commit**: CHƯA commit — worktree không chạy được git từ sandbox. Khối lệnh ở mục
  **SẴN SÀNG COMMIT** cuối phần này.
- **Cách làm**:
  1. **K1** (`TextToolbar.tsx`) — bỏ `opacity`/`transition` khỏi style wrapper `.pe-textbar`
     (chỉ còn giữ `pointerEvents`). Thêm hàm thuần `glassFade(hidden?)` (1 nguồn timing duy
     nhất, tránh lệch số giữa các nơi gọi) trả `{opacity, transition}` với ĐÚNG timing cũ (80ms
     ẩn/150ms hiện — không đổi số, chỉ đổi CHỖ áp). Merge `glassFade(hidden)` vào style của
     TỪNG element kính: `.pe-pill` (`{...pillWrap, ...glassFade(hidden)}`), `note`
     (`{...noteStyle, ...glassFade(hidden)}`), và `ColorPopover` (nhận thêm prop `hidden`, tự
     merge vào style của chính nó).
  2. **K2** (`ColorPopover`) — xác nhận lại bằng đọc code: component render là SIBLING của
     `.pe-pill` (đứng SAU thẻ đóng `</div>` của pill trong JSX `TextToolbar`, KHÔNG lồng bên
     trong) — đúng như ghi chú gốc trong file, không phải sửa cấu trúc, chỉ cần xác nhận (đã
     ghi rõ lại thành comment tại chỗ để không ai hiểu lầm lần sau). Phần "áp cùng fix opacity"
     làm chung với bước K1 ở trên (thêm prop `hidden` + `glassFade`).
  3. **K3** (`ImageEditor.tsx:176`) — thêm `WebkitBackdropFilter: 'blur(6px)'` cạnh
     `backdropFilter: 'blur(6px)'` đã có sẵn — đúng 1 dòng, đúng vị trí ticket chỉ.
- **Test/số đo**:
  - `npx tsc --noEmit -p .` (toàn repo) — **sạch, 0 lỗi**.
  - `npx eslint components/present-editor/TextToolbar.tsx components/present-editor/
    ImageEditor.tsx` — **sạch, 0 lỗi, 0 warning**.
  - `npm test` (toàn repo qua `xargs -P8`) — **exit code 0**, 0 dòng `FAIL`.
- 💭 **Chưa chắc**:
  1. **"Verify browser thật (kéo thả thật)" trong "Điều kiện xong" của ticket — CHƯA làm được**
     trong sandbox (không có trình duyệt/canvas thật để kéo phần tử và nhìn bằng mắt). Đã kiểm
     LOGIC CSS kỹ (đúng cơ chế backdrop-root cô lập theo spec, đúng pattern K1 đang áp lại cho
     K1-note/K2-popover, K3 đúng vị trí/tên field) và tsc/eslint/test sạch — nhưng đây KHÔNG
     thay thế được việc Hoà tự kéo thử trên máy thật/tablet Safari (đúng ngữ cảnh K3 nhắm tới)
     để xác nhận blur không còn nháy xám. Đây là 1 mục "Điều kiện xong" ticket liệt kê mà tôi
     KHÔNG tự chấm được — cần Hoà xác nhận sau khi merge + chạy thử.
  2. `ColorPopover` trước giờ không có khái niệm "hidden" (luôn hiện full khi `colorOpen`) — sau
     K1/K2 nó VẪN theo đúng `hidden` của toolbar cha (mờ cùng lúc pill mờ khi đang kéo phần tử).
     Hành vi này ĐÚNG tinh thần ticket (kính đồng bộ theo cùng 1 trạng thái ẩn/hiện) nhưng
     không có dòng nào trong ticket nói RÕ popover phải ăn theo `hidden` hay không — suy luận
     hợp lý nhất từ "áp cùng fix opacity như K1", nêu ra để Hoà biết nếu có ý khác.
- Không có mục ⛔ CẦN HOÀ — 3 điểm K1/K2/K3 đều đã có hướng sửa rõ trong ticket, không phải
  quyết định cơ chế/UI mới.

**Chi tiết đổi (đọc nhanh)**:
- `components/present-editor/TextToolbar.tsx` — wrapper bỏ opacity/transition (chỉ còn
  pointerEvents); thêm hàm `glassFade(hidden?)`; áp vào `.pe-pill`/`note`/`ColorPopover`;
  `ColorPopover` nhận thêm prop `hidden`.
- `components/present-editor/ImageEditor.tsx` — thêm `WebkitBackdropFilter: 'blur(6px)'` dòng
  ~176 (cạnh `backdropFilter` đã có).

**SẴN SÀNG COMMIT**:
```bash
cd ~/Downloads/interiorflow-phu
git add components/present-editor/TextToolbar.tsx \
        components/present-editor/ImageEditor.tsx
git commit -m "fix(present): P6c kinh long

- K1: doi opacity/transition tu wrapper cha xuong CHINH cac element kinh
  (pillWrap/noteStyle/ColorPopover qua ham glassFade()) - opacity o to tien tao
  backdrop root co lap (spec filter-effects-2), khien backdrop-filter ben trong
  mat nen that trong luc fade 80-150ms -> blur chet/nhay xam. Self-opacity thi
  khong bi. Giu nguyen timing 80ms an / 150ms hien.
- K2: xac nhan ColorPopover la sibling cua pill (khong nam trong overflowX:auto
  cua pill), ap cung fix glassFade qua prop hidden moi.
- K3: ImageEditor.tsx:176 them WebkitBackdropFilter cho backdropFilter da co san
  (Safari/iPad truoc do khong blur, overlay chi con mang toi phang).
- tests: tsc/eslint/npm test sach"
```

**HÀNG ĐỢI CÒN LẠI** (sống trong file này, không sống trong chat):
1. P6c chờ Hoà chạy commit + **tự kéo thử trên máy thật/tablet** để xác nhận hết nháy xám (mục
   💭 #1 — sandbox không verify được phần này).
2. P6a/P6b-bước-1 **vẫn giữ nguyên trạng cũ** — DỪNG chờ Hoà xem ảnh/máy thật, gật hướng cụm
   "Sắp xếp" trước khi làm cụm "Hiệu ứng" của P6b (không có gì mới ở mục này trong đợt P6c).
3. Sau khi P6a + P6b-bước-1 + P6c đều đã commit tay: cập nhật lại khối lệnh merge cuối cùng ở
   mục "Lệnh merge nhanh-phu → main" phía trên (hiện mới có P1-P5, chưa gồm P6).
