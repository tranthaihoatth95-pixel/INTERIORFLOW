# PHIẾU GIAO VIỆC — H1 · `home-dong-studio` (HOME "Dòng Studio" — dashboard live 2 trang cuộn) — Đợt 5, 13/08/2026

## ① BỐI CẢNH NGÀNH
Hoà chốt 13/08: Home = hướng TỔNG QUAN, thông tin từ các chặng hiện tổng quát hết ở đây, dashboard dạng **widget LIVE**, cuộn dọc 2 trang; tiêu chí cảm nhận: **"người ta muốn trở về"** — một nơi chốn, không phải bảng điều khiển. Home hiện tại là màn "chọn flow": hero to, Vitals chiếm giữa màn, card flow lẻ trộn card dự án — cái thừa đứng giữa, cái thiếu vắng mặt. Nghiên cứu nền: `docs/nc/NC-HOME-CAM-NHAN-2026-08-12.md` (7 nguyên tắc) + báo cáo NC delight 13/08 (8 cơ chế — tóm trong phiếu này, mục ④).

## ② ĐỌC TRƯỚC
1. `docs/nc/NC-HOME-CAM-NHAN-2026-08-12.md` — 7 nguyên tắc (tiếp tục trước tổng kết · số đi kèm hình · timeline là sự thật sống · ẩn theo ngữ cảnh · trống = khoảnh khắc dạy · tách lớp nội bộ/trình khách · mật độ co giãn bằng đổi dạng).
2. `components/home/HomeScreen.tsx` — Home hiện tại (giữ được gì: toggle carousel/grid TICKET-GALLERY-TOGGLE, tìm kiếm, card dự án đợt 3 với ProjectProfile + PresenceRow + lastStage).
3. `app/page.tsx` — điểm mount.
4. Nguồn dữ liệu thật đã có: model `Task` + TaskContext (stage/workspaceId/entityId) · `ProjectProfile` (quy mô/loại hình/start) · PresenceRow/presence · `LibraryAsset` (ảnh, `imgIdFromKey`) · flow/Doc revisions (updatedAt). Grep đường API tương ứng trong `app/api/`.
5. `lib/dna/store.ts` — pattern lưu JSON per-project không bảng mới (dùng cùng pattern cho ghi chú nhanh per-user).
6. `docs/00-CHOT.md` [12/08 ref Siri] — Vitals pill (khuôn §4b: pill nhỏ → thẻ kết quả, KHÔNG chatbot toàn màn) + [13/08 chốt kép].
7. `app/globals.css:60-75` thang bo + token (CHỈ ĐỌC — file thuộc phiếu H3, không sửa).

## ③ VÙNG FILE
ĐƯỢC: `components/home/**` · `app/page.tsx` · `lib/home/**` (MỚI — aggregate/greeting/time-of-day) · `app/api/home/**` (MỚI — endpoint tổng hợp) · `lib/home/*.test.ts`.
CẤM: `app/globals.css` (phiếu H3 đang sửa — style riêng của Home viết trong components/home, dùng token var sẵn có) · `components/ui/**` `components/library/**` `components/cad/**` `components/render-studio/**` `components/present-editor/**` `components/dashboard/**` · `prisma/schema.prisma` (TUYỆT ĐỐI — v1 KHÔNG bảng mới) · `docs/mocks/**`.

## ④ VIỆC — bố cục 2 trang + 6 cơ chế (chọn từ NC theo độ bền cao/chi phí thấp)

**TRANG 1 (viewport đầu) — "nơi chốn":**
1. **Ánh sáng theo giờ thật** (cơ chế bền nhất NC): nền trang 1 đổi sắc độ theo giờ hệ thống (bình minh/ngày/hoàng hôn/đêm — bảng ánh xạ giờ→gradient trong `lib/home/time-of-day.ts`, thuần, có test). Có ảnh render của dự án thì ảnh làm nền mờ + tint; không có thì gradient thuần — KHÔNG ảnh stock ngoài. MARKER: `DongStudio` (component gốc `components/home/DongStudioHome.tsx` hoặc tương đương).
2. **Lời chào dữ liệu thật** (không quote sáo): "Chào <tên> · <thứ, ngày>" + 1 dòng từ dữ liệu thật: việc đến hạn hôm nay/dự án vừa có chuyển động (rule trong `lib/home/greeting.ts`, có test; KHÔNG gọi AI). Không có gì đáng nói → chỉ lời chào (tự ẩn).
3. **Vitals pill** góc — thu từ thanh to hiện tại về pill (khuôn Siri §4b), bấm bung ô hỏi; KHÔNG chiếm giữa màn.
4. **Card dự án "còn sống"**: giữ card đợt 3 (ProjectProfile + PresenceRow + lastStage) nâng: cover tự lấy ảnh MỚI NHẤT của dự án (LibraryAsset theo project nếu suy được, fallback cover hiện tại); flow lẻ chưa gắn dự án gom vào MỘT ngăn "Nháp" thu gọn cuối dải; giữ toggle carousel/grid.

**TRANG 2 (cuộn xuống, fit ~1 viewport) — "studio đang thở":**
5. **Dải "hôm nay của studio"**: việc xong hôm nay · ai online · dự án vừa chuyển chặng — click nhảy đúng ngữ cảnh (deep-link TaskContext sẵn có).
6. **Biểu đồ chặng** (thông tin từ các chặng): mỗi chặng 2D/3D/Trình chiếu một cột/ô — số dự án đang ở chặng + việc mở; SVG thuần, không thư viện chart.
7. **Lưới tích luỹ studio** (GitHub-graph, CẤM streak/phạt): ô ngày × ~10 tuần, đậm theo hoạt động thật (Task xong + flow updatedAt, aggregate trong `app/api/home`); ngôn ngữ TÍCH LUỸ, không "giữ chuỗi".
8. **Ghi chú nhanh kiểu Tot**: dải chấm màu theo dự án gần dùng + 1 ô gõ ngay (2 giây, không form); lưu JSON per-user theo pattern `lib/dna/store.ts` (`uploads/home-notes/<userId>.json`).
9. **Bảng tin studio TỰ SINH** (không CMS): card từ sự kiện thật gần đây — flow có revision mới, việc xong, dự án chuyển chặng (query dữ liệu sẵn có, không bảng event mới); trống → tự ẩn cả khối.
10. **Lịch/mốc 2 tuần tới**: Task có dueDate sắp tới, nhóm theo ngày (kiểu DayTicker: chỉ hiện ngày CÓ mốc, bỏ ngày trống).

**Luật chung:** widget nào thiếu dữ liệu → TỰ ẨN cả khối (không số 0, không khung trống); vùng trống lớn → 1 câu + 1 nút hành động (teachable moment). Cuộn trang 1→2 mượt, `prefers-reduced-motion` = không hiệu ứng. Cắt bỏ khỏi Home cũ: hero 2 dòng, nút "Đồng bộ tiến độ" khi Lark chưa cấu hình (ẩn hẳn), thanh Vitals to. KHÔNG đụng route/khoá localStorage cũ ngoài Home.

## ⑤ RÀNG BUỘC
Không git · không dev server · không prisma · không AI call · không ảnh stock ngoài (ảnh chỉ từ kho dự án) · token màu/bo qua CSS var · 2 theme · song ngữ qua `lib/i18n` nếu Home cũ đã dùng · SPEC-NGON-NGU (≤12 từ, có nút, không jargon) · không ngôn ngữ streak/điểm số.

## ⑥ NGHIỆM THU TỰ LÀM
```
npx tsc --noEmit
node_modules/.bin/sucrase-node lib/home/time-of-day.test.ts
node_modules/.bin/sucrase-node lib/home/greeting.test.ts
grep -rn "DongStudio\|dong-studio" components/home | head -5
```

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-13-H1-home-dong-studio.md` — khuôn 2 giá trị §1c; widget nào LÀM/widget nào TỰ ẨN vì thiếu nguồn dữ liệu (nói thẳng); quyết định + lý do; hàng đợi đề xuất (vd "chuyện của tuần" rule-based — cơ chế #4 NC để đợt sau).

## ⑧ DÂY MÁY
Entry `home-dong-studio` (dir components/home, mẫu `DongStudio|dong-studio`). Không tự sửa registry.
