# R9b — Frame.rotation handle · REFUSE (tiền đề sai — handle ĐÃ TỒN TẠI)

**Ngày:** 2026-08-19 · **Lane:** Present · **HEAD đo:** `c7f3ac8` (main) ✓ khớp ⓪b
**Kết luận:** ⓪ TIỀN ĐỀ BỊ BÁC → DỪNG theo đúng phiếu. **0 file code bị sửa.**

## ① Conflict
Phiếu (theo `docs/IF-INTEGRATED-EXECUTION-MAP.md` §3) khẳng định: *"Frame.rotation: render sẵn,
0 handle xoay"* → giao việc THÊM 1 handle xoay. Đo tại nguồn: **handle xoay đã có, đầy đủ, đang
được EditorCanvas dùng cho mọi phần tử.** Làm theo phiếu = dựng handle thứ hai cho thứ đã có
(tội N8 / vi phạm luật NO-REBUILD §B25 — nhảy NEW trong vùng DÀY Present).

## ② Evidence (file:dòng, đo 19/08 tại HEAD c7f3ac8)
- `components/present-editor/Element.tsx:4` — docstring tự khai: *"1 phần tử trên sân khấu +
  handle kéo/resize/**xoay**"*.
- `Element.tsx:381-400` — handle `'rot'`: chấm TRÒN 14px `background: var(--accent)`,
  `cursor: 'grab'`, treo TRÊN khung (top −26) — **đã phân biệt hình dạng + con trỏ** với 8 handle
  resize vuông (`handleStyle`, borderRadius 3, cursor `*-resize`).
- `Element.tsx:266-270` — kéo = xoay quanh TÂM frame (`atan2` từ tâm), **snap 5°** luôn bật.
- `Element.tsx:305-316` (`onPointerUp`) — commit qua CÙNG đường `onFrame(frame, live)` như resize;
  comment `:162` còn ghi rõ fix lastFrame *"xoay là dễ thấy nhất"* — đường này đã được vá riêng
  cho ca xoay.
- `components/present-editor/EditorCanvas.tsx:27` — import `Element` từ `./Element`; `:684-685`
  comment đối chiếu: *"Khác Element.tsx (resize 1 phần tử, **8 handle + xoay**)"*.
- `PresentEditor.tsx:634` `onFrame` — mutate tập trung, undo được (đường chung của move/resize/xoay).
- Không animation trong nhánh xoay → `prefers-reduced-motion` không có gì phải xử.

## ③ Canonical owner
`docs/IF-INTEGRATED-EXECUTION-MAP.md` §3 mang dòng SAI HIỆN TRẠNG — cần MAIN sửa dòng đó
(đóng dấu tại chỗ, luật 15/08 "văn bản bị thay phải đóng dấu"). Code owner: lane Present,
`components/present-editor/Element.tsx`.

## ④ Existing primitive
`Element.tsx` handle `'rot'` + `dragState` + `onFrame` — trọn pattern pointer phiếu yêu cầu
tái dùng, đã sống từ trước (được vá lastFrame cho ca xoay từ P5/2.2.91).

## ⑤ Safer alternative
Nếu ý đồ thật của R9b là **Shift = bậc 15°** (phiếu ghi "kéo = xoay tự do; Shift = bậc 15°"
trong khi hiện trạng là *luôn snap 5°, không đọc Shift*): đó là EXTEND ~2 dòng trong đúng nhánh
`st.handle === 'rot'` (`Element.tsx:270` — `const step = e.shiftKey ? 15 : 5`... hoặc tự do khi
không Shift, tuỳ MAIN chốt hành vi). Mở phiếu MỚI với tiền đề đúng ("handle ĐÃ có, chỉ đổi luật
snap") — không phải phiếu "thêm handle".

## ⑦b CHƯA CHẮC
- Chưa chạy browser (phiếu cấm — worker khác giữ pane): mọi kết luận là đọc mã. Kịch bản browser
  cho phiên verify: mở 1 deck → chọn 1 phần tử → thấy chấm tròn tím trên đỉnh khung → kéo →
  phần tử xoay quanh tâm theo bậc 5° → thả → Cmd+Z hoàn tác được → so hình dạng/con trỏ chấm
  tròn vs 8 handle vuông.
- Chưa kiểm multi-select: GroupResizeOverlay cố ý KHÔNG có xoay (comment `:685`) — đó là chủ đích
  cũ, không phải thiếu.

## ⑦c HẠN DÙNG
Kết luận đúng tại HEAD `c7f3ac8`. Nếu MAIN muốn hành vi Shift/tự-do khác 5° thì cần chốt hành vi
trước khi mở phiếu EXTEND.

## Kiểm tra bàn giao
- `git diff components/present-editor/PresentEditor.tsx | grep -c "present:"` = **10** — hunk R7
  còn nguyên, không đụng.
- Không git add/commit/stash. Không sửa file code nào.
