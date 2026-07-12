# LOGIC-AUDIT — Rà soát logic 3 chặng (Concept/CAD · Render · Present)

> Phạm vi: intro → CAD → Render → Present + luồng human-action (đăng nhập, chọn dự án, handoff,
> điều hướng chặng). **CHỈ báo cáo** — không sửa ngoài phạm vi multi-sheet. Xếp theo mức độ.
> Ngày: 2026-07-12 · nhánh `feat/multi-sheet` (worktree cô lập).

Ký hiệu mức: **[Cao]** dễ gây lỗi/mất dữ liệu thấy được · **[Vừa]** bất nhất/UX khó lường ·
**[Thấp]** dọn dẹp/nợ khái niệm.

---

## A. Điều hướng & mô hình chặng

### A1. [Vừa] Chặng `present` mang hai bản chất chồng nhau (leftover kiến trúc)
`lib/phases.ts` vẫn khai báo `present` với `featured: ['slide.concept','slide.composer','slide.deck',…]`
và `demo:'slide'` — ngụ ý Present là **chặng canvas-node** trên `/`. Nhưng cả `Header.tsx:368` lẫn
`StudioBar.tsx:42` đều route `present` → **`/present-editor`** (studio slide đứng riêng), KHÔNG bao giờ
hiện các node `slide.*` như một chặng canvas.
- Hệ quả: tồn tại **2 trải nghiệm "Present"** — studio `/present-editor` (đường chính) và cụm node
  `slide.*` + `PresentOverlay` trên `/` (đường cũ). `phaseFromNodes` vẫn có thể suy ra `'present'` cho
  một flow, khiến pill "Present" sáng **trong khi đang ở `/`** (canvas), lệch với việc bấm Present lại
  nhảy sang route khác.
- Đề nghị: chốt 1 nguồn sự thật cho "Present" (studio route), và đánh dấu cụm node `slide.*` là
  legacy/ẩn hoặc bỏ khỏi `featured`.

### A2. [Thấp] `workspace` có thể kẹt giá trị `'present'` trên canvas `/`
`store.hydrate()` khôi phục `workspace` từ `localStorage` (`store.ts:401-403`) và `phaseFromNodes` có thể
gán `inferred='present'` khi mở flow nhiều node `slide.*` (`store.ts:345`). Vào `/`, `Header` lấy
`current = workspace ?? DEFAULT_PHASE` → StageSwitcher **sáng "Present"** dù màn đang là FlowCanvas.
Người dùng bấm Present (đang sáng) thì… nhảy route — mâu thuẫn "đang ở đây rồi".
- Đề nghị: khi ở `/`, kẹp `current` về {concept khả dĩ→không, present→render} hoặc coi present là
  "không phải trạng thái của canvas".

### A3. [Thấp] `CommentLayer.tsx:74` đọc thẳng `localStorage['interiorflow.workspace']`
Đọc trực tiếp key store thay vì qua store, default `'app'` — một hằng khác hệ `Phase`. Ghép lỏng, dễ
lệch khi đổi tên key. Đề nghị lấy `useFlowStore(s=>s.workspace)`.

### A4. [Thấp] `StudioBar.go('render')` ghi `localStorage` tay, không qua `setWorkspace`
`StudioBar.tsx:53` `localStorage.setItem('interiorflow.workspace', p)` rồi `router.push('/')`, dựa vào
`hydrate()` đọc lại. Lặp lại logic của `setWorkspace` (`store.ts:295-298`). Hoạt động đúng nhưng có 2 nơi
ghi cùng key → rủi ro phân kỳ về sau. Đề nghị dùng chung `setWorkspace`.

---

## B. Handoff CAD → Render

### B1. [Vừa] Handoff phụ thuộc thứ tự bootstrap; có nhánh im lặng mất node
`toRender()` (`CadEditor.tsx`) stash ảnh vào `sessionStorage` rồi `router.push('/')`.
`applyCadHandoff()` được gọi ở **hai** nơi: `app/page.tsx:103` (nhánh `stageDone==='1'`, sau
`bootstrapWorkspace()`), và `ProjectSelect.tsx:237` (nhánh chưa stageDone). Guard bằng `removeItem` một
lần → chống double-consume tốt. **Nhưng:**
- Nếu `sessionStorage` bị chặn/quota, `stashCadHandoff` trả `false` và code rơi xuống **addNode trực tiếp
  trên `/cad-editor`** (đoạn fallback ở `CadEditor.tsx:118-120`) — node này sẽ bị `loadGraph` đè khi `/`
  hydrate (đúng điều comment cảnh báo). Tức fallback **gần như chắc chắn mất node**, chỉ là "cố cho có".
- Đề nghị: nếu stash fail, giữ ảnh ở `useFlowStore` (memory, sống qua điều hướng client) thay vì addNode
  ngay, và apply sau bootstrap — như đường sessionStorage.

### B2. [Thấp] `applyCadHandoff` ép `workspace='render'` bất kể flow vừa mở
Đúng ý cho handoff, nhưng nếu flow gần nhất là deck present, người dùng bị kéo về render mà không báo.
Chấp nhận được; nên có toast "Đã đưa bản vẽ sang Render".

---

## C. Vòng đăng nhập / chọn dự án / intro

### C1. [Vừa] `stageDone` lưu ở localStorage nhưng gắn máy, không gắn user
`app/page.tsx:96` đọc `interiorflow.stageDone==='1'` để **bỏ qua ProjectSelect**. Cờ này không kèm userId.
Trên máy dùng chung, user B đăng nhập sẽ vào **thẳng canvas** (bỏ chọn dự án) theo dấu của user A, và
`bootstrapWorkspace` mới quyết định flow. Không rò dữ liệu (bootstrap check `localFlowBelongsTo`), nhưng
UX "mất bước chọn dự án" cho user mới. Đề nghị gắn cờ theo `userId`.

### C2. [Thấp] Effect khởi động phụ thuộc `bootRan` ref chống StrictMode double-run
`app/page.tsx:77,101` dùng ref chặn lần 2 của StrictMode. Hợp lý, nhưng nếu `bootstrapWorkspace()` reject,
`bootRan` đã `true` → không thử lại trong phiên. `catch` chỉ set `connectError`. Đề nghị reset `bootRan`
khi lỗi để cho phép thử lại.

---

## D. Chặng Render (canvas node)

### D1. [Thấp] `phaseFromNodes` bỏ qua `concept` là đúng nhưng `demo:'concept'` thành mồ côi
`phases.ts` `concept.demo='concept'` và `concept.featured=[]`. Vì concept chạy ở `/cad-editor` (không phải
canvas), starter-flow 'concept' không còn điểm gọi trên canvas. Nợ khái niệm, không hại. Đề nghị xoá nhánh
demo 'concept' hoặc ghi chú "dead".

### D2. [Thấp] `DEFAULT_PHASE='render'` vs entry mặc định
Khi `workspace=null` (session mới), Header hiện Render. Nhưng luồng người dùng thực đi qua ProjectSelect →
canvas; chưa thấy chỗ chủ động set workspace='render' lúc vào, nên pill Render sáng theo default chứ không
theo hành động. Nhất quán nhưng nên set tường minh khi vào canvas.

---

## E. Chặng Present (studio /present-editor)

### E1. [Vừa] Hardcode thương hiệu còn sót (đã ghi ở STATUS)
`GenerateFlow`/deck build còn `'DETECH · CONCEPT'` hardcode (STATUS "Nợ"). Với multi-sheet, mỗi sheet blank
nay để `brand=''` — không kế thừa nhầm brand khách. Vẫn nên bỏ hardcode ở đường generate.

### E2. [Thấp/đã biết] `detectRegions` ra 21 ô với ảnh moodboard bận
Đã ghi ở STATUS: `buildSlideFromRegions` chưa kẹp số ô về `budget.cells` → slide dư ô rỗng. Không thuộc
phạm vi multi-sheet; giữ trong "Nợ".

### E3. [Thấp] Listener `keydown` cấp `window` của PresentEditor cản đa-pane
`PresentEditor.tsx:707` bind `window` keydown (undo/redo/copy/paste). Là lý do multi-sheet phải giữ **1
instance** (re-key) thay vì mount song song. Muốn split-view Present (pha 2) phải phạm-vi-hoá listener theo
pane focus. Ghi để pha 2 (đã nêu trong MULTI-SHEET-PROPOSAL §6).

---

## F. Multi-sheet (tự-đánh-giá phần vừa thêm)

### F1. [Vừa — giới hạn đã biết] Sheet không sống qua điều hướng route
- CAD: snapshot các sheet nằm trong ref của `CadSheets`; rời `/cad-editor` rồi quay lại → `CadSheets`
  remount, danh sách sheet reset về 1. Doc của **sheet đang active vẫn còn** (do `useCadStore` là singleton
  module-level), nhưng sheet 2..5 mất.
- Present: rời `/present-editor` → `PresentSheets` remount với `makeSampleDeck`, mọi sheet mất (khớp hiện
  trạng editor cũ vốn cũng không auto-persist deck).
- Đây là **giới hạn pha 1 có chủ ý** (chưa persist), đã ghi ở MULTI-SHEET-PROPOSAL §7. Muốn bền qua điều
  hướng cần nâng sheet-state lên store/route-level hoặc localStorage.

### F2. [Thấp] Present đổi tab = fetch lại `/api/library` + reset undo
Do re-key remount PresentEditor (đánh đổi đã ghi ở proposal §3.3). Nội dung deck KHÔNG mất. Chấp nhận pha 1.

---

## Tóm tắt ưu tiên
- Đáng xử trước: **A1** (hai bản chất Present), **B1** (nhánh fallback handoff gần như mất node),
  **C1** (stageDone không theo user).
- Còn lại phần lớn là dọn dẹp khái niệm/ghép lỏng, không gây lỗi chức năng.
- Multi-sheet: chạy đúng, giới hạn "không bền qua route" là chủ ý pha 1.
