# Render node UX — node mới · hệ tag · Sketch Studio

> Branch `feat/render-nodes-ux` (từ `main`). Phạm vi: `lib/nodes/**`, `lib/sketch/**`,
> `components/sketch/**`, `components/NodeLibraryPanel.tsx`, `components/nodes/**`,
> field OPTIONAL trong `lib/types.ts`. KHÔNG đụng `lib/cad/**`, `app/cad-editor/**`,
> `components/cad/**` (agent khác đang làm — thấy nhiều file đó dirty/untracked trong
> working tree khi làm việc này, ĐÓ KHÔNG PHẢI của branch này, đừng git add/commit chúng).

## 1. Node mới (6 node, `lib/nodes/defs/*.ts` mới + wiring vào barrel `defs/index.ts`)

| File | Node type | Tiêu đề | Tag | Ghi chú |
|---|---|---|---|---|
| `crop-composite.ts` | `util.crop` | Crop & Resize | Tiện ích, Chỉnh sửa | crop % + ép tỉ lệ preset (1:1/4:3/16:9/9:16/3:4), canvas 0 AI |
| `crop-composite.ts` | `util.composite` | Ghép ảnh (Composite) | Tiện ích, Chỉnh sửa | chồng overlay lên base — vị trí/cỡ/mờ/blend mode; dùng để ghép cutout `ai.removebg` lên nền khác |
| `material-notes.ts` | `util.materialnote` | Material Note | Vật liệu, Bố cục/Trình bày | tên · mã/SKU · NCC · hex · ghi chú → 1 thẻ ảnh (canvas) + text mô tả (2 output) |
| `gu-reference.ts` | `input.guref` | Gu Reference | Đầu vào, Vật liệu | kéo hồ sơ **Gu Engine** (`lib/gu.ts`) từ thư viện Reference ra làm node ĐỘC LẬP thay vì ẩn ngầm trong `ai.*`; lọc theo usage (`lib/refingest.ts USAGES`) |
| `batch-variants.ts` | `ai.batchvariants` | Batch Variants | Sinh ảnh AI | 2–4 biến thể style chạy SONG SONG (`Promise.all`) từ 1 ảnh (`styleTransfer`) hoặc chỉ prompt (`moodboard`); tự quản lý tier/mock riêng (không sửa `registry.ts` — `aiImage/aiImages` ở đó là hàm private) |
| `sketch-node.ts` | `util.sketchpad` | Free Sketch | Tiện ích, Chỉnh sửa | node "cổng" giữ data URL đã vẽ ở Sketch Studio; input `background` tuỳ chọn (ảnh để đồ theo) |

Tất cả 0 credit trừ `ai.batchvariants` (3cr, flat — cùng quy ước với `ai.moodboard` 2cr/4-ảnh).

## 2. Hệ TAG chức năng (`lib/nodes/tags.ts` — file MỚI, không đụng `NodeDefinition`)

- 7 tag: `input` (Đầu vào) · `ai-generate` (Sinh ảnh AI) · `edit` (Chỉnh sửa) ·
  `material` (Vật liệu) · `layout-present` (Bố cục / Trình bày) · `utility` (Tiện ích) ·
  `video` (Video).
- `NODE_TAGS: Record<nodeType, NodeTag[]>` — map tay cho **toàn bộ** node hiện có (24 node
  cũ + `render.compare`/`util.watermark` ở `defs/` + 6 node mới). 1 node có thể nhiều tag
  (vd `ai.styletransfer` vừa `ai-generate` vừa `edit`).
- `tagsFor(type)` — fallback `['utility']` nếu node nào lỡ chưa đăng ký (không bao giờ biến
  mất khỏi panel).
- **Vì sao tách file riêng thay vì thêm field `tags` vào `NodeDefinition`**: giảm bề mặt
  đụng `lib/types.ts` (file dùng chung, nhiều agent khác có thể sửa) — mapping ngoài này
  merge nhẹ hơn nhiều so với sửa field trong 1 interface lõi.

### NodeLibraryPanel.tsx — nhóm lại theo tag
- Bỏ nhóm theo `category` kỹ thuật (INPUT/AI_GENERATE/AI_EDIT/SLIDE/UTILITY/OUTPUT), thay
  bằng nhóm theo `NodeTag` (`TAG_ORDER`) — đúng theo yêu cầu "việc muốn làm" thay vì tầng
  hệ thống. `category` gốc vẫn giữ nguyên trong `NodeDefinition` (dùng ở nơi khác, vd
  `hiddenByTier` lọc AI theo `category === 'AI_GENERATE' | 'AI_EDIT'`).
- Chip lọc tag ngay dưới ô tìm kiếm (`Tất cả` + 7 chip màu theo `TAG_META`), 1 chip active
  tại 1 thời điểm — kết hợp được với ô tìm kiếm text.
- Node ★ theo chặng (`phase.featured`) giữ nguyên như cũ, không đổi.
- Giữ `CATEGORY_META`/`NodeCategory` nguyên trạng ở `lib/types.ts` (không xoá, chỗ khác
  còn dùng).

## 3. Sketch Studio — cơ chế vẽ tay tự do

**Không tái dùng MaskPainterModal/AnnotateModal** — cơ chế riêng theo đúng yêu cầu, nhưng
học UI pattern (modal `mat-card` + `fade`/`modalScale`, Esc để đóng, nút Lưu ghi vào param).

- `lib/sketch/palette.ts` — `SKETCH_PALETTE` (16 màu bút vẽ: line-art + tông vật liệu quiet-
  luxury sẵn có trong app + vài accent đánh dấu) + color-picker `<input type="color">` bổ trợ.
- `lib/sketch/sketchStore.ts` — Zustand **RIÊNG** (`useSketchStore`) chỉ giữ
  `openNodeId`. Tách khỏi `lib/store.ts` (store dùng chung) — seam an toàn, 0 nguy cơ xung
  đột merge. Lưu tranh vẽ dùng thẳng `useFlowStore.getState().updateParam(nodeId, 'sketch',
  dataUrl)` — action đã có sẵn, không cần thêm gì vào `lib/store.ts`.
- `components/sketch/SketchCanvas.tsx` — canvas 2D thuần: brush/eraser (freehand, undo theo
  cả nét), line/rect/ellipse (rubber-band preview ở canvas overlay riêng, commit khi thả
  chuột), undo/redo (stack snapshot PNG, cap 30), `backgroundImage` (ảnh mờ 45% để đồ theo)
  + `initialDrawing` (mở lại sửa tiếp — vẽ nguyên độ đậm chồng lên trên). Responsive qua
  `aspect-ratio` CSS (độ phân giải canvas thật cố định 960×640 cho chất lượng, hiển thị co
  giãn theo khung modal).
- `components/sketch/SketchToolbar.tsx` — 5 tool (brush/eraser/line/rect/ellipse), palette
  swatch + color picker, độ dày nét, undo/redo/clear.
- `components/sketch/SketchStudioModal.tsx` — ghép canvas+toolbar, **portal ra
  `document.body`** (`createPortal`) — bắt buộc vì node cha (`InteriorNode`) là
  `motion.div` có transform khi animate → `position:fixed` bên trong bị "giam" theo
  ancestor có transform nếu không portal (bug y hệt đã gặp với `MobileMenu`, xem
  `RESUME.md` mục 10.C). Đọc ảnh nền từ input port `background` cùng kỹ thuật
  `useSourceImage` của Mask/Annotate.

### Wiring vào node + panel
- `lib/types.ts`: thêm 1 union variant OPTIONAL vào `ParamDef` — `{ kind: 'sketch'; id;
  label }`. Không đổi/xoá variant cũ nào.
- `components/nodes/InteriorNode.tsx`: `ParamField` thêm nhánh `param.kind === 'sketch'`
  (cùng UI pattern mask/annotate: thumbnail nếu đã vẽ + nút "Vẽ tay"/"Sửa vẽ" gọi
  `useSketchStore.getState().open(nodeId)`).
- `components/NodeLibraryPanel.tsx`: mount `<SketchStudioModal />` làm sibling của
  `AnimatePresence` (component này LUÔN mount trong `app/page.tsx`, chỉ nội dung ẩn/hiện —
  tránh phải sửa `app/page.tsx`, ngoài phạm vi commit). Modal tự portal nên vị trí gọi
  không ảnh hưởng.

## 4. Demo trong app

- Node mới hiện trong Node Library, nhóm theo tag (verify bằng mắt: mở panel → thấy 7 chip
  tag + node dưới từng nhóm).
- 2 nút quick-action trong Node Library (dưới ô tìm ⌘K):
  - **"Vẽ tay nhanh"** — thêm 1 node `util.sketchpad` giữa canvas rồi mở Sketch Studio
    ngay lập tức.
  - **"Demo: Vẽ tay → Render"** — seed 3 node đã NỐI DÂY sẵn: `util.sketchpad` →
    `ai.sketch2render` ← `input.prompt` (prompt Japandi mẫu), rồi mở Sketch Studio cho
    node sketch. Minh hoạ trọn pipeline sketch→render mà KHÔNG cần thêm `DemoKind` mới
    vào `lib/store.ts` (dùng `addNode`/`updateParam`/`onConnect` có sẵn — đọc
    `useFlowStore.getState().nodes.at(-1)` ngay sau mỗi `addNode()` vì `set()` của
    zustand chạy đồng bộ).

## 5. Verify đã làm / CHƯA làm

- ✅ `npx tsc --noEmit` sạch (toàn project, nhiều lần trong lúc build).
- ✅ `npx eslint` sạch trên toàn bộ file mới/sửa.
- ✅ Verify mắt 1 lần: mở Node Library trên `/` (chặng Render) → thấy đúng 7 chip tag màu
  + nút "Vẽ tay nhanh"/"Demo: Vẽ tay → Render" + nhóm ★ Chặng Render như cũ.
- ⚠️ **CHƯA verify mắt đầy đủ**: thao tác vẽ thật trong Sketch Studio (brush/eraser/line/
  rect/ellipse/undo-redo/lưu), node `util.crop`/`util.composite`/`util.materialnote`/
  `input.guref`/`ai.batchvariants` chạy thực tế trên canvas, nút "Demo: Vẽ tay → Render"
  wiring đúng 2 edge. Lý do: máy này đang có **1 agent khác chạy song song** trên
  `lib/cad/**`/`components/cad/**` dùng CHUNG dev server + browser preview (không phải
  worktree cô lập) — thấy real-time collab cursor + canvas bị agent kia điều hướng giữa
  chừng (đổi route sang `/cad-editor`, thêm node mới vào flow đang mở). Dừng thao tác
  browser sớm để tránh giẫm chân/đè lên việc của agent kia. **Phiên chính nên test lại
  bằng mắt**, đặc biệt: Sketch Studio vẽ+lưu, và output ảnh của `util.crop`/`util.composite`
  không bị lệch khi ảnh nguồn có tỉ lệ khác canvas gốc.

## 6. Rủi ro / lưu ý khi merge

- `lib/types.ts`: CHỈ thêm 1 union variant OPTIONAL cho `ParamDef` (`kind: 'sketch'`) —
  không đổi field cũ. Nếu branch khác cũng thêm variant mới cho `ParamDef` cùng lúc, merge
  conflict ở đúng đoạn union (nhỏ, dễ resolve tay: giữ cả 2 variant).
  KHÔNG đụng `NodeDefinition`, `ExecContext`, `CATEGORY_META`, `DATA_TYPE_COLORS`.
  KHÔNG đụng `lib/store.ts` — Sketch Studio dùng store riêng (`lib/sketch/sketchStore.ts`)
  + action có sẵn của store chính, nên 0 rủi ro merge ở `lib/store.ts`.
- `lib/nodes/defs/index.ts`: chỉ thêm 5 dòng import + 5 phần tử spread — đúng seam có sẵn,
  xung đột nếu có (agent khác cũng thêm defs mới) chỉ là merge dòng liền kề, dễ resolve.
- `components/NodeLibraryPanel.tsx` đổi khá nhiều (chip tag thay category, 2 nút quick
  action, mount modal) — nếu có branch khác cũng sửa file này cùng lúc (vd branch apple-
  design polish trước đây), xung đột sẽ RÕ nhưng không sâu (khác đoạn: header/style vs
  đây là phần nhóm danh sách + nút mới).
