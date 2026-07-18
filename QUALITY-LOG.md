# QUALITY-LOG — InteriorFlow (18/07)

> ⚠️ File `SESSION_18-07-2026_KNOWLEDGE.md` được yêu cầu đọc TRƯỚC các phase — đã tìm kỹ ở
> `~/Downloads` và project root, **KHÔNG tồn tại**. Đã tiếp tục 4 phase theo chỉ dẫn cụ thể còn
> lại (không phụ thuộc nội dung file thiếu). Nếu file này quan trọng, cần chủ dự án cung cấp lại.

## 1. Phase 1 — Load project knowledge
Copy vào `knowledge/` (từ `~/Downloads/knowledge/`, commit `3f43473`):
- `knowledge/ttt-design-system/` — SKILL.md, readme.md, styles.css
- `knowledge/project-references/` — 4 PDF (Sungroup mood, Sungroup ConceptID, HV Office, Detech) — **~121MB, cân nhắc Git LFS nếu repo phình to sau này**
- `knowledge/ttt-brand/` — 5 file HTML (TTT Brand Guideline: gốc/in/VI/VI-Dark/VI-EN)

`CLAUDE.md` thêm mục "Project Knowledge" + "TTT Design System Rules" (5 quy tắc: brand mode,
màu #F06020/#002850/#F1ECE3, font Archivo only, song ngữ Việt·Anh, hairline keyline).

## 2. Phase 2 — 4 bug đợt 1 (commit `7bb6d2f` + merge `feat/smart-tooltips`)

| Bug | Kết quả | Chi tiết |
|---|---|---|
| 2a — slider "Chỉnh màu" cắt chữ | **KHÔNG SỬA (không phải bug thật)** | Xác minh 3 lần độc lập: đọc code `AdjustPanel.tsx`+`ImageEditor.tsx`, đọc CSS `.if-slider`, và DOM `textContent` thật qua browser — không tìm ra nguyên nhân code. Kết luận: artifact đọc ảnh chụp màn hình nhỏ (font 11px bị nén), dữ liệu/render thật đầy đủ. |
| 2b — PS-2 "Của tôi" không hiện | **ĐÃ SỬA, verify live browser** | Nguyên nhân thật: `LayoutShelf.tsx` state `generated` khởi tạo `false` mỗi lần mount → toàn bộ kệ mẫu (gồm nút "Lưu mẫu") bị ẩn sau `<GenerateFlow>` cho tới khi generate xong 1 lần trong phiên. Thêm nút "Bỏ qua, xem mẫu có sẵn →" (`GenerateFlow.tsx`, prop `onSkip` mới) — kệ mẫu + "Lưu mẫu" luôn với tới được. Đã xác nhận bằng mắt trên trình duyệt thật: bấm "Bỏ qua" → kệ mẫu hiện ngay, nút "Lưu mẫu" xuất hiện. |
| 2c — đổi Khổ trình bày làm ảnh đè chữ | **ĐÃ SỬA, có test tái hiện đúng bug** | Nguyên nhân thật: `reflow.ts` — text thêm qua "Thêm chữ" mặc định `role:'free'` nên chỉ được CLAMP biên (đúng triết lý tự-do-đặt-vị-trí), KHÔNG né ảnh cấu trúc vừa dàn lại vào ô mới → ảnh đè hoàn toàn lên chữ. Thêm `avoidImageOverlap()`: nếu ảnh đè >50% diện tích phần tử tự do, đẩy xuống dưới (hoặc lên trên) ảnh — giữ nguyên triết lý tự do vị trí, chỉ né trường hợp bị che kín. Test mới `[13]` tái hiện đúng kịch bản Tester phát hiện tuần trước, PASS. |
| 2d — merge `feat/smart-tooltips` | **ĐÃ MERGE** (commit riêng trước Phase 2, giữ lịch sử git rõ ràng) | Clean merge, 0 conflict. Tooltip.tsx dùng chung áp vào 4 toolbar chính. |

Verify sau mỗi bug: `npx tsc --noEmit` 0 lỗi · **50/50 file test PASS** (chạy lại toàn bộ, không chỉ file đụng tới). Không có mục nào BLOCKED/rollback.

## 3. Phase 3 — ARCHITECT-REVIEW.md (commit `117d89a`)
**16/16 file PASS, 0 FIXABLE, 0 REDESIGN.** Toàn bộ UI thao tác nội bộ 3 chặng (Present/Photo-editor/
CAD/Studio) tuân thủ tinh thần TTT Design System — token màu/font nhất quán (`--accent` tím
quiet-luxury toàn app, quyết định app-wide có chủ đích, không phải lỗi), hairline 1px, whitespace
hợp lý, không serif/underline. Chi tiết đầy đủ → `ARCHITECT-REVIEW.md`.

## 4. Phase 4 — Builder
0 mục FIXABLE từ Phase 3 → không có gì để sửa. Không tạo commit (tránh commit rỗng/sai nội dung
"apply FIXABLE" khi không có mục nào để áp).

## 5. Kết luận

**App CÒN THIẾU trước khi dùng cho người dùng thật, nhưng đã tiến bộ rõ so với audit trước.**
2/4 bug chặn thật (2b, 2c) đã sửa và verify — bao gồm cả bug nghiêm trọng nhất tuần trước (nội dung
vô hình khi đổi khổ trình bày). Thiết kế UI nội bộ (Phase 3) đã đạt chuẩn, không cần sửa gì thêm.
Còn lại từ audit 18/07 CHƯA đụng tới trong đợt này: **Brand Kit "áp cả deck" chỉ áp 1 slide** + **bug
tương phản màu làm tiêu đề vô hình sau khi áp theme** (Luồng E) — đây là 2 bug độc lập, KHÔNG nằm
trong danh sách 4 bug được giao lần này, cần một đợt vá riêng. Khuyến nghị: chạy Agent Tester (luồng
người dùng thật) ở phiên sau như đã định, ưu tiên xác nhận lại 2b/2c đã hết bug thật (không chỉ qua
test đơn vị) và đo lại Luồng E (Brand Kit) trước khi kết luận sẵn sàng hoàn toàn.
