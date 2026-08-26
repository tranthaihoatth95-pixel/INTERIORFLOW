# R7 — REVIEWDECK NHẬN SLIDES THẬT (PresentEditor → ReviewPanel) · 19/08/2026

Phiên phụ Execution/Runtime Integration. Dây CONNECT Đợt 0 (`docs/IF-INTEGRATED-EXECUTION-MAP.md` · `reviewDeck: DISCONNECTED`). Đóng nợ p3c 08/08 "chặng deck chờ mở cửa đọc slides".

## ⓪b REALITY
- HEAD: `c7f3ac8` (đúng mốc T bàn giao). Working tree 91 file dirty của các phiên khác — vùng R7 (components/review · components/present-editor/PresentEditor.tsx · components/studio/AppShell.tsx · lib/review) SẠCH trước khi bắt đầu; file dirty gần nhất là `lib/present-editor/boq-*` + `brand-kit.ts` (lane BOQ/materials, không giao file nào với R7).
- ReviewPanel mount DUY NHẤT: `components/studio/AppShell.tsx:192` (`<ReviewPanel stage={active} />`, ổ mép phải).
- Engine sẵn: `lib/review/index.ts:78-82` `reviewDeck({slides?, deBai})` · adapter `lib/review/luat/deck.ts` (`luatDeck(slides)` → `evaluateDeck` của `lib/present-editor/layout-check.ts`) — engine ĐÃ SỐNG, chỉ thiếu slides.
- Deck truth owner: **`useEditor` (useReducer) trong instance `PresentEditor`** (`components/present-editor/useEditor.ts:111`). `PresentSheets` mirror qua `liveDeck.current` (ref, để lưu khi đổi tab); `.idfp`/autosave là DẪN XUẤT. Chỉ MỘT PresentEditor mount tại một thời điểm (PresentSheets re-key theo activeId, docstring :6-8).
- Câu "Chưa nối được hồ sơ đang mở" tồn tại thật: `components/review/ReviewPanel.tsx:195-202` (trước sửa) + comment :97-100 (`reviewDeck({deBai:null})` không slides).
- Cầu hiện hữu qua biên PresentEditor: họ CustomEvent `present:*` (idfp/pptx/pdf import-export, `present:force-save-request`) + effect `onDeckChange` (`PresentEditor.tsx:153-155`).

## Bảng NO-REBUILD
| Need | Existing Primitive | Evidence file:line | Coverage | Action | Why |
|---|---|---|---|---|---|
| Engine kiểm deck | `reviewDeck`/`luatDeck`/`evaluateDeck` | lib/review/index.ts:78 · luat/deck.ts:17 · layout-check.ts:98 | ĐỦ | REUSE, 0 sửa | luật đã có, tất định |
| Cầu deck→panel qua biên component | họ CustomEvent `present:*` | PresentEditor.tsx:245-265, 415-431 | pattern có, kênh review chưa | THÊM 2 event cùng họ (`present:deck-review-state` · `present:deck-review-request`) | contract hiện hữu của repo cho đúng biên này; KHÔNG store mới |
| Điểm phát mỗi lần deck đổi | effect `onDeckChange` sẵn có | PresentEditor.tsx:153-155 | có | effect sibling cùng deps | truth owner phát, không ai khác |
| Nhảy-tới slide | `ed.selectSlide` (memo `[]`, ổn định) | useEditor.ts:175,182 | có | listener `present:goto-slide` | đường select sẵn có, cùng khuôn `cad:goto-box` |
| Nút "Tới chỗ này" cho finding deck | `dungTheLuat.coNutToiCho` | lib/review/hien-thi-luat.ts:220 | thiếu nhánh `slide` | +1 điều kiện `viTri.slide` | không có thì hoặc nút giả hoặc nút ẩn |
| Bất biến snapshot | reducer `cloneDeck` mỗi mutate | useEditor.ts:57-63 | có sẵn | không làm gì | tham chiếu đã phát ra không bao giờ bị mutate lại |

## Before → After
- **Before**: ReviewPanel chặng present gọi `reviewDeck({deBai:null})` → luat=[] + câu "chưa nối, phiếu sau nối"; header hiện "0 vi phạm" (sai — không có gì được kiểm).
- **After**: PresentEditor phát `present:deck-review-state {slides}` mỗi khi `ed.deck.slides` đổi + trả lời `present:deck-review-request` (qua ref, không re-bind) + phát `{slides:null}` khi unmount. ReviewBody (chỉ khi chang='deck') nghe rồi hỏi; giữ **THAM CHIẾU** mảng slides (không clone, không persist) → `reviewDeck({slides})`. Nhảy-tới: finding deck bấm "Tới chỗ này" → `present:goto-slide` → `ed.selectSlide(slide-1)`.
- **Truth owner KHÔNG đổi**: vẫn useEditor; review chỉ đọc; không mutate (test [4] deep-equal), không đường ghi mới nào.

## UI 3 trạng thái (yêu cầu ③)
1. Không có hồ sơ mở (PresentEditor chưa/không mount — màn chọn loại, BOQ, sheet mới): header "**chưa kiểm**" + câu "Không có hồ sơ nào đang mở trong trình dàn trang… đây không phải '0 vi phạm'."
2. Hồ sơ mở, 0 trang: "Hồ sơ đang mở chưa có trang nào — chưa có gì để kiểm."
3. Hồ sơ mở có trang: review thật; 0 finding → "Không phát hiện vi phạm nào trên hồ sơ đang mở." / có finding → thẻ luật vàng DECK_STANDARDS.* + nút Tới chỗ này.
(Lỗi đọc kiểu I/O không tồn tại ở đường này — không đọc đĩa/mạng, chỉ nhận tham chiếu in-memory; trạng thái "không trả lời" rơi về #1, khai đúng là chưa kiểm.)

## Files modified
- `components/present-editor/PresentEditor.tsx` (+33): 2 effect + 1 ref — phát state / trả lời request / goto-slide / unmount-null.
- `components/review/ReviewPanel.tsx` (+61/−14): state `deckSlides` + listener + request; `reviewDeck({slides})`; header "chưa kiểm"; 3 khối message; `nhayToi` nhánh deck.
- `lib/review/hien-thi-luat.ts` (+3/−1): `coNutToiCho` thêm `viTri.slide`.
- `lib/review/luat/deck.test.ts` (MỚI, 13 ca).

## Test (sucrase-node)
- `lib/review/luat/deck.test.ts`: **13 pass 0 fail** — 0/1/nhiều slide · slides undefined không nổ · finding thật đủ hợp đồng (nguon `DECK_STANDARDS.whitespace`, ruleId `deck-whitespace-empty`, viTri.slide 1-index) · coNutToiCho bật nhờ slide · KHÔNG mutate slides (JSON deep-equal trước–sau) · tất định 2 lần y hệt.
- Test lân cận không vỡ: `hien-thi-luat.test.ts` 61 ok · `layout-check.test.ts` 14 ok.
- `npx tsc --noEmit` exit 0 · `npm run soi:frontier` **0 LỆCH** exit 0.

## Browser verify — ĐÃ VERIFY SỐNG (server 3001, HMR nhận code mới)
Dự án "Nháp" → `/projects/cmsl4b5ux0001w9jlrgo2q41t/present`:
1. Màn chọn loại hồ sơ (editor chưa mount) → mở Bảng kiểm: header "chưa kiểm" + câu "Không có hồ sơ nào đang mở…" ✅ (screenshot trong phiên)
2. "Tạo hồ sơ trống" (1 slide trắng) → panel LIVE ra 2 finding vàng thật (Trống quá 100%>72% · Số khối chữ 0 ngoài dải 1–4) ✅
3. "+ Thêm slide" → panel tự cập nhật 3 finding (slide 2 template khác → finding khác) ✅ — re-review theo từng thay đổi deck.
4. Bấm "Tới chỗ này" của finding slide 1 khi đang đứng slide 2 → strip + canvas nhảy về slide 1 ✅
5. Thêm sheet "Hồ sơ 2" (editor unmount → picker) → panel về "chưa kiểm"/"không có hồ sơ" ✅; quay lại "Hồ sơ 1" → finding trở lại ✅
- Console: 0 lỗi React, 0 "Maximum update depth"; chỉ 2 lỗi 404 resource CÓ TRƯỚC ở trang Home (không thuộc đường R7 — thay đổi này không phát request mạng nào).
- Dọn: đã đóng tab "Hồ sơ 2"; deck trống 2 slide còn lại trong dự án "Nháp" (autosave) — vô hại, T xoá nếu muốn.

## ⑥b Trạng thái đích
`reviewDeck: DISCONNECTED → LIVE` (máy xanh + browser verify sống đủ 5 kịch bản). **Chưa flip trong `IF-INTEGRATED-EXECUTION-MAP.md`** — theo phiếu, T flip sau khi duyệt.

## ⑦b CHƯA CHẮC / CHƯA KIỂM
- Chỉ verify trên dev server 3001 (Chromium, phiên khác mở, HMR) — chưa build production, chưa Electron.
- `deckSlides` giữ tham chiếu mảng cũ khi panel mở mà editor đứng yên — an toàn nhờ reducer clone-mỗi-mutate; nếu ai sau này mutate deck TẠI CHỖ ngoài reducer thì bất biến này vỡ (không có máy canh, chỉ test [4] canh phía review).
- ReviewBody chỉ nghe khi mount (panel mở) — panel đóng thì không tính gì (đúng thiết kế PanelFlank), nhưng nghĩa là số đếm không sống khi panel thu (hành vi cũ y vậy, không đổi).
- 2 lỗi 404 ở Home chưa truy nguồn (ngoài phạm vi, có trước lượt này).
- Sự kiện `present:goto-slide` tên mới — nếu phiên khác sau này đặt event trùng tên khác nghĩa sẽ va (họ `present:*` chưa có sổ đăng ký tên event).

## ⑦c HẠN DÙNG
Đúng tới khi: PresentEditor/useEditor còn là owner deck (nếu deck dời sang store/route khác thì cầu event phải dời theo owner mới) · PresentSheets còn giữ bất biến "1 PresentEditor mount/lượt" · `evaluateDeck` còn là kho luật deck duy nhất.

## Anti-loss delta (liệt kê, T ghi)
- Report này → `docs/bao-cao-phien/2026-08-19-R7-reviewdeck-slides.md` (đã lưu).
- Flip `reviewDeck → LIVE` trong `IF-INTEGRATED-EXECUTION-MAP.md` — chờ T duyệt.
- Nợ nhỏ mới lộ: sổ đăng ký tên event `present:*` chưa tồn tại (2 tên mới thêm bằng literal đúng pattern cũ) — nếu họ event phình tiếp, đáng một hằng số chung.
- Deck trống 2 slide còn nằm trong dự án "Nháp" (sản phẩm của bước verify).
