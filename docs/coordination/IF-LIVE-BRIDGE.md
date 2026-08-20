# IF · LIVE BRIDGE — điểm nối duy nhất MAIN ↔ ChatGPT

> Cập nhật lần cuối: 20/08 đêm, ngay sau khi Wave 1 (A·2D · B·Home+Shell · C·Vitals+Activity+Present · QA) trả kết quả và MAIN checkpoint tập trung. Chi tiết đầy đủ + bằng chứng browser gốc:
> `docs/memory/sessions/2026-08-20/08-truth-map-ux-study/README.md`. File này CHỈ tóm.

## CURRENT
- Git: `main` (remote) = `2dfed16`, KHÔNG nhập. Việc thật ở `backup/2026-08-19-batch0a`, tip mới sau Wave 1 checkpoint (xem commit log — MAIN vừa build từ `1824ddd` + 8 file của 3 lane, cây 2451 file, diff hợp lý — không lặp lại sự cố tree-rỗng lần trước).
- Server :3001, login `demo@if.local`/`demo1234`, demo project `cmsl8prn80001w9i2ud3bfdgr`. tsc 0 sau cả 3 lane (verify độc lập từng bước, không tin báo cáo mù).

## LIVE
Home (ambient/greeting/Resume/project-grid liền mặt + **cá nhân hoá thật: đổi thứ tự/ghim/ẩn widget, lưu qua localStorage, verify end-to-end**) · Files (hai ngăn) · Library (sheet, kệ có số liệu thật) · 2D CAD editor (cursor đổi theo tool: mũi tên ở Chọn/grab ở Pan/crosshair khi vẽ; crosshair-guide tắt khi Chọn/Pan; snap-marker ngữ nghĩa đã có sẵn từ trước, không phải xây mới) · 3D node canvas + capability library · Present editor + idle state đúng chốt · Settings · Vitals ambient→peek anchor (AppChrome 3-vùng xác nhận đúng qua DOM: thứ tự Vitals→Hoạt động→Tài khoản khớp luật LEFT/CENTER/RIGHT) · **Activity/Flow — MỚI, chuông ở cụm phải-trên → Peek (mọc từ gốc, dùng chung nhịp `lib/ui/nhip.ts`) → cột phải đầy đủ (RUNNING/WAITING/NEEDS ATTENTION/FAILED/READY/RECENT COMPLETE), đọc dữ liệu thật từ `useFlowStore` + `useRenderQueue`, KHÔNG lộ tên provider/model** · Rail 2-đảo auto-collapse (xác nhận: mở tay thì KHÔNG tự thu, không cần sửa) · Image→Spec (G1-G4) · Where Used · Tasks/Kanban.

## PARTIAL
Project overview (ngoài shell chung — chưa ai sửa, nhưng Home giờ đã BỎ QUA nó khi click thẳng vào stage dang dở, xem UX FINDINGS #1) · ToolWindow (chưa neo điều khiển quanh viền) · Page Setup (Lane C không kịp chạm — vẫn nguyên trạng thái cũ, chưa live preview lớn) · Controlled Edit (region-mask node có, chưa verify UI vẽ mask) · Stale/Impact (chỉ cục bộ Present, chưa lan Library) · Widget resize/drag thật (chỉ có reorder qua nút, KHÔNG có kéo-thả tự do — CỐ Ý, xem DECISIONS) · Gallery taste feed (vẫn 1 ảnh/tuần, chưa multi-image) · Activity progress % thật (mọi mục đang hiện dạng KHÔNG-ĐO-ĐƯỢC — đúng luật cấm bịa số, `RenderQueueJob.progress` có sẵn trong data model nhưng chưa nối qua).

## MISSING
Live Sheet Preview lớn trong Page Setup · social-notification inbox (khác Activity — Activity là tiến độ việc, cái này là "ai vừa @ bạn/duyệt xong" — CumPhaiTren.tsx tự khai còn thiếu, không bị bỏ sót) · widget kéo-thả tự do (thay bằng nút thứ tự — xem DECISIONS) · 2D near-pointer contextual actions (Offset/Align/Material xuất hiện cạnh vật đang chọn) — chưa bắt đầu.

## REJECTED
Old synthetic specimen visual (thư viện FUR mẫu vẽ tay) — đã tách khỏi critical path theo chốt 20/08 chiều, KHÔNG hồi sinh. Widget resize theo lưới 9-ô tự do (brief cũ) — bị luật 20/08 "cấm lưới thẻ đều, trượt nếu Home giống dashboard SaaS" đè, xem DECISIONS.

## UX FINDINGS
1. Home→card→overview→"Mở canvas"→Home→rail→stage: **ĐÃ SỬA** — Lane B xác nhận `ProjectSelect.tsx` từ trước đã có `enterAtLastStage()` nhảy thẳng vào stage dang dở, bỏ qua overview; không cần code thêm, chỉ là phiên trước chưa kiểm bằng browser thật.
2. Login "Vào xưởng" vẫn màu đồng/cam — nợ đã biết (chốt 16/08 bỏ vàng đồng), CHƯA giao lane nào — đợi Wave 2/3.
3. 3D: bấm "Vẽ 3D" đổi sidebar nhưng ranh giới đổi hẳn môi trường canvas chưa rõ trong 1 cú bấm — CHƯA giao (Lane D, Wave 2).
4. ⚠️ **Auto-redirect về Home khi đứng yên trên stage — QA gắn cờ SEVERITY CAO NHẤT, nhưng MAIN đã tái hiện lại SAU khi 3 lane dừng hot-save và KHÔNG còn xảy ra** (đứng yên 8s+ trên `/projects/.../cad`, không redirect). Cả 3 agent A/B/C lẫn QA đều độc lập ghi nhận hiện tượng này TRONG LÚC 3 lane đang đồng thời lưu file lớn (CadCanvas.tsx/DongStudioHome.tsx/AppChrome.tsx) — khớp đúng dấu hiệu Next.js dev server bị "HMR full-reload storm" khi nhiều tiến trình lưu file lớn gần như cùng lúc trên MỘT dev server dùng chung, không phải lỗi ứng dụng. Kết luận tạm: **NHIỀU KHẢ NĂNG là nhiễu môi trường đa-agent, không phải bug thật** — nhưng CHƯA đủ chắc để đóng hẳn; đề xuất một lượt QA riêng, KHÔNG chạy song song lane nào khác, xác nhận lại trước khi gạch bỏ khỏi sổ.

## DECISIONS
- **Widget resize KHÔNG theo lưới 9-ô tự do như brief cũ mô tả** — Lane B phát hiện xung đột với chốt 20/08 mới hơn ("cấm lưới thẻ đều"); giữ nguyên layout hiện tại (grid dọc theo tín hiệu), chỉ thêm CÁ NHÂN HOÁ THẬT (thứ tự/ghim/ẩn, có lưu). Đây là quyết định của Lane B, MAIN đồng ý vì đúng luật đang có hiệu lực gần nhất thắng.
- Naming: "Chuyên" (2D pro mode label) GIỮ NGUYÊN — thuật ngữ đã khoá qua nhiều vòng chốt (00-CHOT 07/08 "bản cuối, thay mọi mô tả trước", đè "Kỹ thuật" từ 03/08). Lane A không đổi, không phản đối.
- Motion Relationship Law (SOURCE→TRANSFORMATION→RESULT, origin-based transitions) — **GHI NHẬN, CHƯA THI CÔNG**, chờ Wave rảnh tay theo đúng chỉ đạo "record now, execute when capacity frees". Áp cho: Visual Generate/Image→Spec/Sketch→Technical/2D→3D/Controlled Edit/Present placement/Vitals/Activity — 8 luồng cụ thể trong brief gốc.
- StatusBar.tsx (bottom-edge snap-list dài, đè-mode) là sở hữu chung (`components/studio/`), không thuộc lane nào trong Wave 1 — Lane A tìm đúng chỗ sửa (dòng 44-60) nhưng không tự động đụng vì ngoài phạm vi được giao. Cần giao rõ ở Wave 2.

## TO CHATGPT
- Cần định nghĩa **"Plan branch"** và phạm vi **Credits UI** — vẫn UNKNOWN/DEFER.
- Auto-redirect-to-Home (xem UX FINDINGS #4) cần một lượt QA CÔ LẬP (không lane nào khác chạy song song) để đóng hẳn — MAIN không tự làm ngay vì ưu tiên hiện tại là mở Wave 2 theo đúng "reuse freed writer capacity", không phải vì coi nhẹ nó.
- Wave 2 đề xuất mở ngay (writer capacity đã rảnh cả 3 lane): Lane D (3D selection feedback + Image→Spec entry + Spec Portal), Lane E (Files/Library/Review gap thật), Lane F (Demo Spine nối thật). Wave 3 (Plan branch/Manufacturer/Settings polish/Electron RC) đợi Demo Spine xanh.

## NEXT 3
1. Mở Wave 2: Lane D (3D) + Lane E (Files/Library/Review) song song — file ownership disjoint với Wave 1 (3D chưa ai chạm, Files/Library chỉ Lane B từng đọc không sửa).
2. Một lượt QA cô lập xác nhận đóng/mở hẳn phát hiện auto-redirect (#4) trước khi Wave 2 kết thúc.
3. Sau Wave 2: Lane F Demo Spine nối thật (Sketch→Visual Generate→Controlled Edit→Accept→Image→Spec→Present→Home) — điều kiện duy nhất để nhập `main`.
