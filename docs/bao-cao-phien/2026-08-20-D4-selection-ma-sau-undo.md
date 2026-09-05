# Báo cáo D4 (P1) — "Selection ma sau undo": Inspector vẫn mở "2 đối tượng" trên bản vẽ rỗng

**Phiên phụ 20/08/2026 · nhánh main tại `c7f3ac8` · dev server :3001 (không restart) · không chạy lệnh git nào ngoài `git log --oneline -1` theo ô ⓪.**

## ① Tiền đề — kiểm rồi mới làm
- `git log --oneline -1` = `c7f3ac8` ✅ (đúng mốc phiếu).
- Bug do lane QA báo, chưa ai chứng minh cơ chế. Phiếu nghi "có gì đó NẠP LẠI selection sau undo" — **tiền đề này SAI một nửa** (xem ②): không có gì nạp lại selection sau undo; thứ để lại selection ma là một mutation KHÁC quên dọn.

## ② Cơ chế gốc — có bằng chứng
**Kịch bản nguyên văn của QA (vẽ tường → ⌘A → ⌘Z) KHÔNG tái hiện được bug ở tầng store.** Đã thử HAI đường trên app thật :3001, dự án `cmsqu517r0001w9axbunx9m7m`:
1. Dispatch KeyboardEvent tổng hợp (⌘A rồi ⌘Z) → sau undo: `doc.entities = 0`, `selection = []`.
2. **Input thật** (click 2 điểm bằng tool Wall → phím ⌘A, ⌘Z thật qua trình duyệt) → y hệt: `selection = []` sau undo. `undo()`/`redo()` (lib/cad/store.ts:534, :541) đều set `selection: []` và chạy đúng.

**Cơ chế THẬT tạo đúng triệu chứng QA mô tả: `removeLayer` (lib/cad/store.ts:747).** Đây là mutation DUY NHẤT trong store xoá entity mà KHÔNG dọn `selection` (grep đối chiếu: `deleteSelected`:643, `removeIds`:652, `replaceEntities`:664, `undo`:534, `redo`:541, `importDoc`:835, `reset`:892, CadSheets đổi tờ:255 — tất cả đều set `selection: []`; chỉ `removeLayer` không).

**Tái hiện trên app thật (TRƯỚC khi sửa):** vẽ tường → click chọn 1 tường (nở cặp poché = **"2 đối tượng"**, khớp đúng con số QA thấy) → xoá layer `l-wall` trong LayerPanel ⇒ `doc.entities = 0` nhưng `selection = ["e-3-lcq9","e-4-69nw"]` (2 id ma). Screenshot xác nhận: canvas rỗng, Inspector VẪN MỞ, title **"2 đối tượng"**, và vì `CadInspectorPages` tự gate `!selected.length → null` nên panel chỉ còn cái vỏ + title — đúng nguyên văn QA. Đường "gán IFC cho vật đã xoá": `BimAssignBox` nhận `selected` đã lọc nên thực tế không ghi được vào vật chết (`updateEntities` map theo id còn sống) — phần "vẫn cho gán" là vỏ UI mở nhầm, không phải ghi dữ liệu sai.

**Vì sao QA gán nhầm cho ⌘Z:** kịch bản QA nhiều khả năng có bước xoá layer (hoặc undo/redo xen kẽ với xoá layer) mà bản ghi chỉ nhớ ⌘A/⌘Z; con số "2 đối tượng" khớp chính xác cặp poché của MỘT tường được chọn bằng click, không khớp ⌘A (⌘A trên 1 tường 1 đoạn chọn 2, nhưng undo ngay sau đó đã được chứng minh dọn sạch).

## ③ Sửa gì — 2 file, nhỏ nhất có thể
1. **Gốc rễ — `lib/cad/store.ts` `removeLayer`:** tính `doc` sau `syncHostedOpenings` (sync có thể dọn thêm cutter mồ côi ngoài tập expand) rồi lọc `selection = s.selection.filter(id => alive.has(id))`. Cùng khuôn các mutation anh em.
2. **Phòng thủ nơi đọc — `components/studio/CadStageScreen.tsx`:** thêm `aliveSelection` (memo, lọc selection theo id còn trong `doc.entities`); title/gate `inspector`/`onCloseInspector` đọc `aliveSelection` thay selection thô. Mutation tương lai nào quên dọn selection cũng không dựng được Inspector ma nữa. `CadInspectorPages` đã tự phòng thủ sẵn (`:171 if (!selected.length) return null`) — không đụng.

Không viết lại store, không state mới, không đổi hành vi chọn/undo nào khác.

## ④ Bằng chứng sau sửa (app thật :3001, HMR + hard reload)
- Kịch bản QA nguyên văn (input thật): vẽ tường → ⌘A → ⌘Z ⇒ `entities 0 · selection []` ✅.
- Kịch bản gốc rễ: chọn 1 tường (`selection = 2`) → `removeLayer('l-wall')` ⇒ `entities 0 · selection []` (trước sửa: 2 id ma) ✅.
- Kịch bản phòng thủ: reload sạch → nhét thẳng `setState({selection:['ma-1','ma-2']})` (giả lập mutation tương lai quên dọn) ⇒ **không `<aside>` Inspector nào mount, không h2 "N đối tượng" nào xuất hiện**, dù store vẫn giữ 2 id ma ✅.
- Dọn rác: kết phiên store về đúng trạng thái đầu — 0 entity, 5 layer mặc định (`l-wall/l-furniture/l-dim/l-text/l-axis`), selection 0, past 0. Không dự án mới nào được tạo.

## ⑤ Máy kiểm
- `npx tsc --noEmit` → **0 lỗi**.
- Test targeted (chạy đúng runner `sucrase-node` của repo — vitest không đọc được khuôn test này): `cad-core-b1.test.ts` **47 pass** (có ca undo giữ printScale) · `sprint9-mode.test.ts` **56 pass** · `cad3d-autosave-core.test.ts` **13 pass** · 0 fail.

## ⑥ Phát hiện ngoài phạm vi (không sửa, ghi lại)
- **Animation đóng/mở Inspector đông cứng khi tab bị ẩn**: `InspectorSlot` (AppShell.tsx:228) dùng AnimatePresence + framer-motion 12.42.2 driver tự lái WAAPI qua rAF; tab hidden ⇒ rAF treo ⇒ exit đứng ở opacity giữa chừng, enter đứng ở opacity 0. **Chỉ quan sát được trong pane trình duyệt bị ẩn** (document.hidden=true, đo `document.getAnimations()` thấy ASIDE currentTime đứng ở 43ms trong khi animation khác chạy 76301ms) — người dùng tab hiện hình không gặp. KHÔNG phải cơ chế bug D4, nhưng nếu về sau có báo "panel lơ lửng sau khi chuyển tab" thì đây là chỗ soi.

## ⑦b CHƯA CHẮC / CHƯA KIỂM
- Chưa chứng minh được kịch bản THẬT mà QA đã bấm — chỉ chứng minh (a) đường ⌘A→⌘Z sạch, (b) removeLayer tạo ra đúng triệu chứng từng chữ. Nếu QA còn log/video thì đối chiếu lại được.
- `updateEntities` → `syncHostedOpenings` về lý thuyết có thể dọn cutter mồ côi đang được chọn (id chết mà selection giữ) — chưa dựng được ca thật; lớp phòng thủ ở CadStageScreen đã che, nhưng store thì chưa lọc ở đường này.
- Chỉ đo trên Chromium (pane Claude Browser); Safari/Firefox chưa thử. Test tự động cho `removeLayer` lọc selection CHƯA viết (repo không có store.test.ts sẵn; thêm file test mới nằm ngoài phạm vi ghi tối thiểu của phiếu — nên bổ sung ở phiếu test kế).
- Animation-freeze mục ⑥ chưa kiểm trên tab hiện hình.

## ⑦c HẠN DÙNG KẾT LUẬN
- Kết luận "removeLayer là mutation duy nhất không dọn selection" đo tại `c7f3ac8` + working tree 20/08; thêm mutation mới vào store sau ngày này thì phải grep lại. Lớp phòng thủ `aliveSelection` chỉ che CadStageScreen (route 2D); màn khác đọc selection thô (vd `CadEditor` SelectionInfoPanel route cũ) chưa có lớp này.
