# IF · LIVE BRIDGE — điểm nối duy nhất MAIN ↔ ChatGPT

> Cập nhật lần cuối: 20/08 đêm, sau Wave 2 (D·3D · E·Files/Library/Review) checkpoint. Wave 1
> (A·2D · B·Home+Shell · C·Vitals+Activity+Present · QA) đã checkpoint trước đó. Chi tiết đầy đủ
> + bằng chứng browser gốc: `docs/memory/sessions/2026-08-20/08-truth-map-ux-study/README.md`.
> File này CHỈ tóm.

## CURRENT
- Git: `main` (remote) `2dfed16`, KHÔNG nhập. Việc thật ở `backup/2026-08-19-batch0a`, tip sau Wave 2 (build từ Wave 1 tip + 3 file Lane D, cây >2000 file, diff hợp lý — checkpoint có guard chặn tree rỗng sau sự cố lần đầu trong phiên).
- Server :3001, login `demo@if.local`/`demo1234`, demo project `cmsl8prn80001w9i2ud3bfdgr`. tsc 0 sau cả Wave 1+2 (verify độc lập từng lane, không tin báo cáo mù).
- Có 1 file test thật để lại trong demo project (Lane E, `lane-e-test-upload.png`) làm bằng chứng Promote chạy được — có nút Xoá nếu cần dọn.

## LIVE
Toàn bộ mục LIVE của Wave 1 (xem lịch sử file này qua git nếu cần đối chiếu) **cộng thêm**:
- **3D selection feedback** — chọn tường trong khung nhìn 3D thật: mesh tint accent-purple + khung Box3Helper, tree row + Inspector mở cạnh đó (Cao/Tầng/Vật liệu/Đổi vật liệu/Khoét hốc/Vát cạnh/Nhân bản dãy) — sửa đúng lỗ hổng duy nhất mà truth-map từng flag ("3D PASS trừ phản hồi chọn").
- **Image→Spec đã lên khung nhìn 3D** — `StageToolbelt stage="render"` được mount lần đầu trong `Render3DModeSkeleton.tsx`; capability `image-to-3d` đã khai `stages:['cad','render']` từ trước nhưng chưa có chỗ neo — nay bấm được từ cả 2D lẫn 3D.
- **Files→Review→Promote→Library→Where-Used — xác nhận THẬT, không phải đọc code**: Lane E upload 1 file thật qua UI thật, tick "Đã xem" → "Đưa vào Thư viện" → xác nhận badge đổi đúng, reload vẫn giữ, "Đang dùng ở đâu" trả đúng dữ liệu, mở được trong Library sheet. Đây là lần đầu luồng này được click-through thật trong phiên.
- Node-canvas ⇄ viewport 3D transition — xác nhận ĐÃ có crossfade thật (`ModeShell.tsx`, `AnimatePresence`/`springPop`, có guard `prefers-reduced-motion`) — KHÔNG phải teleport như nghi ngờ ban đầu, không cần sửa.

## PARTIAL
Project overview (ngoài shell chung) · ToolWindow (chưa neo quanh viền) · Page Setup (chưa live preview lớn — Lane C không kịp, Wave 2 cũng không chạm) · Controlled Edit (region-mask node có, chưa verify UI vẽ mask) · Stale/Impact (chỉ cục bộ Present) · Widget resize/drag tự do (chỉ reorder qua nút, cố ý — xem DECISIONS Wave 1) · Gallery Home widget (vẫn 1 ảnh/tuần) · Activity progress % thật (còn dạng không-đo-được) · **Library Browse→Object Passport→Technical Verify** (hiện chỉ 1 cột chi tiết duy nhất khi click, chưa tách 2 tầng mật độ khác nhau — Lane E chẩn đúng chỗ, chưa sửa vì file đang có edit dở từ nơi khác) · **3D selection cho đồ nội thất/cửa sổ** (chỉ tường được — đồ khác gộp chung 1 draw-call theo màu, giới hạn kiến trúc thật, không phải bug nhỏ) · **Review verdict persistence** (schema `ProjectFile.reviewState/reviewedAt/reviewedBy` đã viết trong `prisma/schema.prisma`, uncommitted từ TRƯỚC phiên này — CHƯA migrate vào DB thật, checkbox "Đã xem" hiện vẫn chỉ là state phía client).

## MISSING
Live Sheet Preview lớn trong Page Setup · social-notification inbox · 2D near-pointer contextual actions (Offset/Align cạnh vật đang chọn) · **Spec Portal to Present** (không có nút "gửi sang Trình chiếu" nào cạnh dữ liệu Spec/BOQ — Lane D xác nhận gap thật, thuộc phạm vi Present, chưa ai nhận).

## REJECTED
Old synthetic specimen visual (FUR vẽ tay) — không hồi sinh. Widget resize lưới 9-ô tự do — bị luật 20/08 đè.

## DECISIONS
(Giữ nguyên từ Wave 1: naming "Chuyên", widget resize theo luật mới, Motion Relationship Law ghi nhận chờ thi công.)
- **KHÔNG chạy `prisma migrate`/`generate` cho `ProjectFile.reviewState` dù schema đã sẵn** — đúng luật CLAUDE.md (cấm agent tự chạy khi lệch DB thật, sự cố 19/08 làm mẫu). Đây là CỬA THẬT cần Hoà chạy tay.
- StatusBar.tsx (bottom-edge dày ở 2D Chuyên, Lane A chẩn từ Wave 1) và Library 3-tầng mật độ (Lane E chẩn Wave 2) đều là fix ĐÃ CHẨN ĐÚNG CHỖ, chưa ai sửa — ưu tiên Wave 3.

## UX FINDINGS (mới, ngoài các mục Wave 1 đã đóng)
- Auto-redirect-về-Home: KHÔNG tái hiện trong Wave 2 (chỉ 2 lane chạy song song thay vì 3) — củng cố thêm giả thuyết "nhiễu môi trường đa-agent lúc lưu file đồng thời", chưa đủ mẫu để đóng hẳn nhưng không còn là chặn đường.
- Lane E ghi nhận: click Library 2 lần liên tiếp từng nhảy lạc sang stage 3D của CÙNG dự án — nghi cùng họ với hiện tượng auto-redirect (trạng thái điều hướng client dễ vỡ khi nhiều tab/lane cùng origin), chưa điều tra riêng.

## TO CHATGPT
- Cần định nghĩa "Plan branch", phạm vi Credits UI — vẫn UNKNOWN/DEFER.
- Đề xuất Wave 3: Lane F (Demo Spine nối thật đầu-cuối) là ưu tiên số 1 — mọi mảnh rời (Visual Generate, Controlled Edit, Image→Spec, Promote, Activity/Flow) giờ đã LIVE riêng lẻ, việc còn lại là NỐI chúng thành một luồng thật, không phải xây thêm mảnh mới. Song song có thể mở 1 lane nhỏ xử 2 gap đã-chẩn-đúng-chỗ (StatusBar bottom-edge · Library 2-tầng mật độ) nếu muốn giữ 3 lane bận.
- Cửa thật cần Hoà: chạy migration cho `ProjectFile.reviewState` (lệnh cụ thể trong prisma/schema.prisma, agent không tự chạy).

## NEXT 3
1. Mở Wave 3 — Lane F Demo Spine (Sketch→Visual Generate→Controlled Edit→Accept→Image→Spec→Present→Home) là điều kiện duy nhất để nhập `main`; đây là việc lớn nhất còn lại.
2. Hoà chạy migration `ProjectFile.reviewState` khi rảnh (không chặn Wave 3, review vẫn dùng được ở dạng client-only trong lúc chờ).
3. Một lượt QA cô lập (không lane nào chạy song song) xác nhận đóng hẳn nghi vấn auto-redirect trước khi diễn tập demo loop cuối cùng.
