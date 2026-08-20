# IF · LIVE BRIDGE — điểm nối duy nhất MAIN ↔ ChatGPT

> Cập nhật lần cuối: 20/08 (đêm), sau truth map + UX study bằng trình duyệt thật.
> Chi tiết đầy đủ (bảng trạng thái từng surface, 7 journey có ghi chú, gap map): `docs/memory/sessions/2026-08-20/08-truth-map-ux-study/README.md`.
> File này CHỈ tóm — không lặp lại lịch sử, không diễn giải dài.

## CURRENT
- Git: `main` (remote) = `2dfed16`, KHÔNG nhập. Việc thật nằm ở `backup/2026-08-19-batch0a` tip `9a3934e` (đã push, 26 commit ahead of origin/main). Working tree = đúng bản đó, đã verify byte-for-byte.
- Server chạy sẵn :3001. Login `demo@if.local`/`demo1234`. tsc 0.

## IMPLEMENTED
Home (ambient/greeting/Resume/project-grid) · Files (hai ngăn) · Library (sheet, kệ có số liệu thật) · 2D CAD editor · 3D node canvas + capability library · Present (idle đúng chốt + editor đầy đủ) · Settings · Vitals ambient→peek anchor · Rail 2-đảo auto-collapse · Image→Spec (G1-G4) · Where Used · Tasks/Kanban.

## PARTIAL
Project overview (đứng ngoài shell chung, không rail) · ToolWindow (cụm nổi có, chưa neo điều khiển quanh viền) · Page Setup (cửa có, chưa live preview) · Controlled Edit (region-mask node có, chưa verify UI vẽ mask) · Stale/Impact (chỉ ở Present/linked-asset-recipe, chưa lan Library) · Motion (tab có trong Present, chưa verify pipeline chạy hết).

## MISSING
**Activity/Flow right column — 0 dòng code, P0 ưu tiên cao nhất còn trống.** Widget move/resize/pin/persistence trên Home (auto-layout tất định, không tuỳ biến được) · bell/notification entry ở top-right cluster · Live Sheet Preview.

## UX FINDINGS
1. **B. Returning designer có vòng lặp thừa**: Home→card→overview(ngoài shell)→"Mở canvas"→về lại Home→rail→stage. Nên rút còn 1-2 bước, nhảy thẳng vào stage dang dở.
2. Login "Vào xưởng" vẫn màu đồng/cam — nợ đã biết từ chốt 16/08 ("bỏ hẳn vàng đồng"), chưa thi hành ở màn khoá.
3. 3D: bấm nút "Vẽ 3D" đổi nội dung sidebar nhưng KHÔNG rõ ràng đổi hẳn môi trường canvas — ranh giới "một bộ lệnh hai lối thao tác" (node ↔ tool truyền thống) chưa đọc được bằng mắt trong 1 cú bấm.
4. Home Gallery widget chỉ là 1 ảnh/tuần — chưa phải feed cảm hứng cuộn được như đặc tả P0.2.

## TO CHATGPT
- Cần định nghĩa rõ **"Plan branch"** và phạm vi **Credits UI** trước khi map tiếp — hiện UNKNOWN/DEFER vì không đủ dữ kiện trong code để phân loại đúng.
- Đề xuất P0 kế tiếp theo mức độ trống: Activity/Flow (0 code) > Widget personalization (0 code) > Home→Stage navigation loop (friction đo được) > Page Setup live preview (đã có nền, chỉ thiếu nối).

## DECISIONS
- Giữ nguyên: main chưa nhập cho tới khi demo loop rehearsal xanh (lệnh cũ, còn hiệu lực).
- Task mới nhận giữa lượt (2D Sơ phác/Kỹ thuật mode correction) ưu tiên chạy NGAY sau khi bridge doc này chốt — xem `docs/memory/sessions/2026-08-20/09-*` khi xong.

## NEXT 3
1. Build Activity/Flow: bell ở `CumPhaiTren` → Peek gọn → cột phải đầy đủ.
2. Sơ phác/Kỹ thuật 2D mode — làm morph thật (toolbelt/cursor/constraint/density), không chỉ đổi màu pill.
3. Rút ngắn vòng Home→Stage (bỏ trạm overview-ngoài-shell, hoặc đưa overview vào shell chung).
