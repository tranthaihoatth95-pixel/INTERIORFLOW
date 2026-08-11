# ĐỐI CHIẾU CHẶNG 2 & 3 — HANDOFF-CODEX-2026-08-11 ↔ CODE THẬT (11/08)

> Phương pháp: tách từng khẳng định trong `docs/HANDOFF-CODEX-2026-08-11.md` mục "Chặng 2" và
> "Chặng 3", grep/đọc code trong `components/render-studio/`, `components/three/`, `lib/three/`,
> `lib/render-core/`, `components/nodes/`, `lib/nodes/`, `components/present-editor/`,
> `lib/present-editor/` (+ `lib/materials/`, `lib/vision/`, `lib/cad/`, `lib/ai/` khi khẳng định
> trỏ sang đó). KHÔNG tính `.worktrees/`. Chỉ tin file:dòng, không tin lời spec.
>
> Chấm: ✅ có thật (kèm file:dòng) · 🟡 một phần (ghi thiếu gì) · ⬜ chưa có gì · ❓ không xác minh được.

## Bảng 1 — Chặng 2: 3D, visual, render, camera/video nguồn

| # | Khẳng định | Chấm | Bằng chứng / thiếu gì |
|---|---|---|---|
| 2.1 | Hai shell: Render + Mood + Collab và Vẽ 3D | ✅ | `lib/stage-mode.ts:24` `RenderStageMode = 'render' \| 'model3d'`, persist localStorage; gạt mode `components/render-studio/ModeSwitchCell.tsx:23-31`; phần Mood+Collab có thật trên canvas render: sticky `components/nodes/NoteNode.tsx:14`, comment neo `components/nodes/CommentPin.tsx:5` |
| 2.2 | Vẽ 3D: dựng khối → sửa tay (hướng SketchUp/Max/Revit) | ✅ | `lib/three/build-ops.ts` (9 op, tự thoả KS4 lùi được `:229`), `components/three/Viewport3D.tsx:247` (Array + Ctrl+Z), `components/render-studio/Command3DPanel.tsx`, `lib/three/snap3d.ts`, `lib/three/csg.ts` |
| 2.3 | Vẽ 3D: thao tác **mô tả** → dựng khối (prompt → hình) | ⬜ | grep `prompt` trong `Viewport3D.tsx` + `Command3DPanel.tsx` = 0 dòng; không có đường text-mô-tả → dựng khối trong shell 3D |
| 2.4 | Hình học AI chỉ là đề xuất có ràng buộc/kiểm chứng, không giả chính xác | 🟡 | cờ `inferred`/`semanticProvenance` xuyên scene: `lib/three/cad-to-obj.ts:306,318,322`; số đo có `confidence` `lib/vision/single-view-metrology.ts:76,287`; nhưng "AI sinh hình học" chưa tồn tại nên phần ràng buộc mới áp cho suy đoán ngữ nghĩa/số đo, chưa áp cho geometry AI |
| 2.5 | Cùng Doc 2D↔3D; wall/floor/ceiling/room/type-instance/material ID thống nhất | ✅ | `lib/three/cad-to-obj.ts:18` (đọc `Doc`, `RoomEntity`), `:135-180` entityId/levelId/typeId/heightMm, `:306-322` specId + semanticKind (wall/floor/ceil/room `:234-251`); `specId` là FK mềm ProductSpec trong Doc `lib/cad/model.ts:601,645,711-712` |
| 2.6 | Magic: mô tả khối/cụm furniture để dựng | 🟡 | có máy sinh cụm THAM SỐ: `lib/cad/workstation-clusters.ts:202,293` (clusterSpineL/clusterY, seed KS2 `:629`); chưa có đường "mô tả tự nhiên" → cụm; không UI Magic nào trong render-studio gọi nó bằng prompt |
| 2.7 | Đưa reference/Thẻ gu draft vào tone, vật liệu, bố cục | 🟡 | node `input.guref` `lib/nodes/defs/gu-reference.ts:17-21` + `guRenderPrompt()` ngầm trong node ai.* (`render-v2.ts:89`) — áp vào TONE render có thật; áp vào VẬT LIỆU/BỐ CỤC 3D chưa có |
| 2.8 | Render MVP: sketch/clay/image→render | ✅ | `lib/ai/models.ts:23-33` (sketch = ControlNet canny, clay = ControlNet depth), `lib/nodes/defs/render-v2.ts:108` map 'Clay (trắng)', node sketch2render (`lib/nodes/defs/sketch-node.ts`, grep sketch2render 10 file) |
| 2.9 | Đổi vật liệu | ✅ | node `ai.materialswap` `lib/nodes/registry.ts:574-578` (mask vùng + prompt → inpaint FLUX Fill) |
| 2.10 | Đổi ánh sáng | ✅ | node `ai.relight` `lib/nodes/registry.ts:644-657` (daylight/sunset/đèn ấm, IC-Light v2) |
| 2.11 | Vùng render (chỉnh đúng vùng, còn lại giữ nguyên) | ✅ | node `ai.localedit` `lib/nodes/defs/render-v2.ts:9,105,437` (AI inpaint theo mask / chỉnh pixel tất định `lib/render-core/local-edit-core.ts:76`) |
| 2.12 | Khóa hình học | ✅ | ControlNet canny/depth guide hình học: `lib/ai/models.ts:23-33`, `lib/ai/providers/sd.ts:65,96-99`, comfyui `IF_STRENGTH` `lib/ai/providers/comfyui.ts:58,113` |
| 2.13 | Khóa vùng | ✅ | mask-ops `lib/nodes/mask-ops.ts`, id-mask `lib/render-core/idmask-core.ts:170` (giữ vùng quantize), localedit/materialswap đều mask-based |
| 2.14 | Khóa seed | 🟡 | hạ tầng provider NHẬN seed: `lib/ai/providers/comfyui.ts:84,109-110` (`input.seed`), `lib/ai/providers/nvidia.ts:164,183`; nhưng KHÔNG node/UI nào expose param `seed` cho người dùng khoá/tái dùng (grep `id: 'seed'` trong `lib/nodes/defs/` + `registry.ts` = 0) |
| 2.15 | Nhiều phương án | ✅ | node `ai.batchvariants` `lib/nodes/defs/batch-variants.ts:2,70-72` (2–4 biến thể song song từ cùng 1 ảnh) |
| 2.16 | Upscale | ✅ | node `ai.upscale` `lib/nodes/registry.ts:679-683,702` (ESRGAN, đủ 300dpi in khổ lớn) |
| 2.17 | Lịch sử/checkpoint | 🟡 | undo/redo canvas: `lib/store.ts:47,128-129` (past/future); khung Checkpoint duyệt dùng chung `components/studio/Checkpoint.tsx:4` (acceptGate); nhưng "lịch sử phương án render" dạng timeline/checkpoint riêng cho ảnh render chưa thấy |
| 2.18 | Element extraction: tách furniture/decor/tường/trần/sàn/cụm khỏi ảnh | 🟡 | tách FOREGROUND 1 món: `lib/render-core/furniture-extract-core.ts:66` `extractForeground()` (ước nền + tolerance), node `ai.furnitureextract` dùng ở `lib/nodes/defs/render-v2.ts:395,413`; nhưng là tách nền↔tiền cảnh, KHÔNG phải segmentation ngữ nghĩa từng lớp tường/trần/sàn/cụm |
| 2.19 | Tạo asset riêng, góc nhìn khác, front/side/top | 🟡 | ba hình chiếu CÓ THẬT + nhãn trung thực: `lib/vision/ortho-projection.ts:1-25` (mặt bằng/mặt đứng/mặt bên, mặt bên chỉ hộp bao — tự khai); asset PNG cắt nền có (extract → ảnh mask); "góc nhìn khác" bằng AI (novel view) chưa có |
| 2.20 | Chỉ sinh kích thước khi có mốc chuẩn, ghi confidence | ✅ | `lib/vision/single-view-metrology.ts:19,76,287,430,437` (anchor-based, confidence từng tầng, "ĐỪNG tin mù"); node `vision.measureobject` `lib/nodes/defs/metrology.ts:2-18` (measureObjectTiered, luôn trả số + độ tin thật); luật số đo cưỡng chế bằng kiểu `ortho-projection.ts:5-10` |
| 2.21 | Material extraction: ảnh → swatch/map/thuộc tính/đối tượng | 🟡 | có palette từ ảnh `lib/nodes/registry.ts:890` (`extractPalette`), ghép ảnh↔SKU `lib/materials/warehouse/image-match.ts`, dẹt hoa văn thành stencil `lib/nodes/defs/pattern-flatten.ts`; nhưng ảnh → PBR map/thuộc tính vật liệu (roughness/normal…) CHƯA có — mới là chốt spec 10/08 (`docs/CHOT-ELEMENT-MATERIAL-INTELLIGENCE-2026-08-10.md`) |
| 2.22 | Đổi material ID → cập nhật 3D, mặt bằng, mặt đứng, material board, spec, BOQ | 🟡 | lõi CÓ: `lib/materials/impact.ts` (MaterialImpact + consumers drawing2d/model3d/boq/elevations/materialBoard/presenting `:26-40`, `replaceMaterialReferences()`; test BOQ tự đọc mã mới `impact.test.ts:62`); nhưng UI chưa wire (grep "Impact" trong `components/**.tsx` = 0) — STATUS còn ghi ở "Cổng R1 còn lại" mục 4 |
| 2.23 | Bookmark góc máy | ⬜ | grep `bookmark` toàn lib/components chỉ ra PDF outline (`lib/cad/pdf.ts:594`) và resume-route; không có bookmark viewpoint 3D. `docs/00-CHOT.md` cũng ghi "bookmark góc máy (chờ V2)" |
| 2.24 | Camera path | ✅ | `lib/cad/campath.ts:1-50` (polyline → mẫu điểm/hướng/thời điểm, look-at 3 chế độ), UI đã wire `components/cad/CadEditor.tsx:91,809` (CamPathPanel), sang 3D `lib/three/capture.ts:81` `camPathSampleToThree` |
| 2.25 | Eye-level | ✅ | `lib/three/capture.ts:40-44` `EYE_HEIGHT_MM = 1650` (campath + walk); preset 'eye' 1.5m `lib/three/camera.ts:10,60` |
| 2.26 | Low-angle / tracking | 🟡 | tracking dọc đường cam = campath ✅ (`capture.ts:227,264`); nhưng `CameraKind` chỉ `'eye' \| 'wide' \| 'macro' \| 'top'` (`camera.ts:10`) — KHÔNG có preset low-angle |
| 2.27 | Video nguồn thuộc chặng 2, editor dựng video thuộc chặng 3 | ✅ | chụp dải khung dọc đường cam `lib/three/capture.ts:264` (video bậc 2-b, PNG sequence); chặng 3 video bị khoá đúng như mô tả (xem 3.12) — nhất quán |

**Đếm chặng 2: ✅ 14 · 🟡 11 · ⬜ 2 · ❓ 0** (27 khẳng định)

## Bảng 2 — Chặng 3: Present/output

| # | Khẳng định | Chấm | Bằng chứng / thiếu gì |
|---|---|---|---|
| 3.1 | Magic giống Canva: nhận Brand Kit + nội dung + hình ảnh | ✅ | `components/present-editor/GenerateFlow.tsx:7` (content + ảnh đều optional, Brand Kit nạp sẵn), `:151,256`; `lib/present-editor/brand-kit.ts`, `brand-kit-disk.ts` |
| 3.2 | AI tự chọn số slide theo nội dung, không giới hạn 7 slide | 🟡 | `slidesFromContent()` `lib/present-editor/content-deck.ts:108-138` tách slide theo heading #/## + tràn sang "(tiếp)" `:13` — số slide theo nội dung, KHÔNG có trần (grep MAX_SLIDE/slice cap = 0); nhưng là heuristic TẤT ĐỊNH, không phải "AI" chọn |
| 3.3 | Đủ content + ảnh → sinh deck nguyên vẹn | ✅ | `content-deck.ts:2-6` (cover + quote + content, rải ảnh nội dung vào từng slide), kicker đọc Brand Kit `:28-36` (hết hardcode DETECH — đối chiếu ghi chú cũ 00-CHOT) |
| 3.4 | Thiếu ảnh: dùng placeholder có note | ✅ | `lib/present-editor/magic-input.ts:13` "Vị trí hình ảnh được để sẵn và có thể thay sau." |
| 3.5 | Thiếu content: sinh dàn ý, tiêu đề, text mẫu có thể sửa | ✅ | `magic-input.ts:1-30` `usesDraftCopy: true` + dàn ý đầy đủ gắn nhãn "Nội dung mẫu — cần chỉnh theo dự án"; cờ đi qua `GenerateFlow.tsx:41` |
| 3.6 | Editor tay: group | ✅ | `lib/present-editor/model.ts:271-278` `groupId` (chọn cả cụm, paste sinh groupId mới); `zorder-group.ts`, `resize-group.ts` |
| 3.7 | Editor tay: mask | ✅ | `model.ts:217,312-315` `ImageMask` (mask chiếm quyền radius); `lib/nodes/mask-ops.ts` phía node |
| 3.8 | Editor tay: fill overlay | ✅ | `model.ts:56-64,318,392-396` `FillOverlay` (color/gradient + opacity + blend); test `fill-overlay.test.ts` |
| 3.9 | Editor tay: filter | ✅ | `model.ts:280-284` `ElementFilter` cho mọi loại phần tử + `elementFilterToCssFilter` `:190-194` (live + export cùng cú pháp) |
| 3.10 | Editor tay: màu nền tùy chỉnh | ✅ | `model.ts:494-499` `background: string` hex "người dùng chỉnh được" + `backgroundImage` full-bleed |
| 3.11 | Editor tay: thao tác bố cục thiết yếu | ✅ | `lib/present-editor/align.ts`, `reorder.ts`, `zorder-group.ts`, `resize-corner.ts`, `format-painter.ts`, `reflow.ts` |
| 3.12 | Năm loại hồ sơ: Deck, Material board, BOQ, Word, Video — chỉ mở loại thật | ✅ | `components/present-editor/PresentDocTypePicker.tsx:20` `Kind = 'deck'\|'material'\|'boq'\|'text'\|'video'`; text/video `enabled: false` + `unavailableReason` lý do năng lực thật `:64-75,129,138`; deck/material/boq mở thật `:92-97` |
| 3.13 | Nhập PPTX cơ bản | ✅ | `lib/present-editor/pptx-import.ts:1-8` (mỗi slide → ảnh nhúng + TextElement, mở khoá nút Toolbar 09/08) |
| 3.14 | Nhập ảnh | ✅ | `components/present-editor/Toolbar.tsx:5` (thêm ảnh), `ReplaceImageDialog.tsx`, `LibraryBrowser.tsx` |
| 3.15 | Nhập IDFP | ✅ | `lib/present-editor/idfp.ts:159` `importIdfp()` + migrate `:48` |
| 3.16 | BOQ nhập XLSX/CSV | ✅ | `lib/present-editor/boq-xlsx-import.ts` (map cột; vá mojibake UTF-8 CSV `:15,369`) |
| 3.17 | Xuất PDF/PPTX/PNG | ✅ | `lib/present-editor/export.ts:40` (PDF), `:68` (PDF theo khổ giấy), `:108` (PNG), `:310` (PPTX từ model) |
| 3.18 | Xuất IDFP | ✅ | `idfp.ts:104` `exportIdfp()` (kèm version/migrations) |
| 3.19 | Xuất XLSX | ✅ | `lib/boq/xlsx.ts:2` (tự dựng OOXML .xlsx thật, 0 package thêm) |
| 3.20 | DOCX/PDF deck CHƯA nhập | ✅ | đúng hiện trạng: `ls lib/present-editor/` không có docx/pdf-import; chỉ có pptx-import — mô tả thật thà |
| 3.21 | Editor Word/Video/HTML chưa hoàn chỉnh | ✅ | đúng hiện trạng: picker khoá text/video với lý do (`PresentDocTypePicker.tsx:64-75`); không có editor HTML trong repo |

**Đếm chặng 3: ✅ 20 · 🟡 1 · ⬜ 0 · ❓ 0** (21 khẳng định)

## 5 lệch đáng chú ý nhất

1. **"Bookmark góc máy" — Codex nói CÓ trong Camera/video, code ⬜ hoàn toàn.** Grep toàn repo chỉ ra bookmark PDF outline (`lib/cad/pdf.ts:594`); `docs/00-CHOT.md` cũng tự khai "bookmark góc máy (chờ V2)". Mô tả đọc như năng lực hiện có, thực tế là hàng đợi.
2. **"Magic: mô tả khối/cụm furniture để dựng" — không có đường prompt→build nào trong shell 3D.** Cả `Viewport3D.tsx` lẫn `Command3DPanel.tsx` không có ô prompt; cái gần nhất là hàm sinh cụm THAM SỐ `workstation-clusters.ts` (thuộc chặng 2D, không nhận mô tả tự nhiên). Câu này của Codex là định hướng, không phải hiện trạng.
3. **"Material extraction hai chiều" — mỗi chiều chỉ được một nửa.** Chiều ảnh→vật liệu: mới có palette màu + ghép SKU, chưa có ảnh→PBR map/thuộc tính (spec 10/08 mới chốt, chưa code). Chiều đổi ID→cập nhật: lõi `lib/materials/impact.ts` đầy đủ và có test, nhưng **chưa có UI nào gọi** (grep "Impact" trong components = 0) — chính STATUS còn xếp "Material Impact preview" vào Cổng R1 chưa xong.
4. **"Khóa hình học/vùng/seed" — seed là mắt xích yếu.** Hình học (ControlNet) và vùng (mask) có thật; seed chỉ tồn tại ở tầng provider (`comfyui.ts:84`, `nvidia.ts:183`) — không node/param UI nào cho người dùng khoá hay tái dùng seed, nghĩa là tính năng "giữ nguyên phương án, chỉnh tiếp" chưa dùng được từ UI.
5. **Chiều ngược — code CÓ mà mô tả KHÔNG nhắc:** dây chuyền đo đạc `single-view-metrology.ts` (958 dòng, 4 tầng phương pháp + confidence) và `ortho-projection.ts` (ba hình chiếu mang nhãn trung thực từng hình) mạnh và trưởng thành hơn hẳn một dòng "chỉ sinh kích thước khi có mốc chuẩn"; tương tự Section extract (`components/render-studio/SectionExtractPanel.tsx`, `lib/three/section-entities.ts`) và pattern hoa văn (`pattern-flatten/warp/prompt`) hoàn toàn vắng mặt trong mô tả chặng 2 của Codex.

---
*Lập 11/08/2026 bằng grep/đọc code trực tiếp trên `main` @ `fc3036d` (working tree có sửa UI chưa commit — không ảnh hưởng các file đã trích). Không sửa file nào khác, không commit.*
