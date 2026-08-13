# PHIẾU GIAO · NC — Triết lý giao diện IF: nghiên cứu top-tier + chưng cất gu Hoà + trả lời bài phân luồng

## THẺ VAI [Đ4]
- **VAI:** NC — agent nghiên cứu giao diện (không code), nuôi nhóm B của đợt Đồng-bộ-DS + entry `luong-theo-viec`.
- **PHẠM VI/TRẦN:** cấp NC. Sản phẩm là MỘT file `docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` + báo cáo. KHÔNG sửa code/mock/spec nào khác.
- **BIÊN → DỪNG:** KHÔNG kết luận thành "chốt" — output là ĐỀ XUẤT trình Hoà; mọi nhận định về xu hướng phải DẪN NGUỒN công khai (luật 12.3-②); ảnh tham khảo là để nắm CƠ CHẾ/NGUYÊN LÝ, cấm đề xuất chép nguyên màn nào.
- **ĐIỀU KHOẢN RUỘT:** [N2] đơn giản ngoài sâu trong · [T4] phân loại lớn→nhỏ group-by · [T8] nhìn bao quát → nghiên cứu triệt để → mới build · [Đ2] đối chiếu nội lực (spec DS đã có) trước khi đề xuất mới.

## ① BỐI CẢNH — đề bài nguyên văn của Hoà (14/08)
"Tham khảo cơ chế, nguyên lý chung để nắm gu… từ dữ liệu nghiên cứu dựa trên những giao diện top đầu về thiết kế để xem triết lý thiết kế giao diện nói chung cũng như những dạng app sáng tạo như IF thì sao? Việc phân luồng như của mình: **cái gì chung thì hiện, tuỳ biến sâu group-by hoặc cử chỉ để hiện**. Mục tiêu **dễ xài, dễ thao tác, tránh cảm giác không biết bắt đầu từ đâu**. Và giao diện phải **thật chuyên nghiệp mới xài cho dân chuyên được**." (Bệnh "không biết bắt đầu từ đâu" = finding F1 dogfood — đã có entry `luong-theo-viec` chờ spec.)

## ② NGUYÊN LIỆU
1. **51 ảnh** `/Users/tranben/Downloads/tham khao ui/*.jpg` — ĐỌC BẰNG MẮT theo lô (Read từng ảnh), đừng tả từng tấm: gom thành CỤM CƠ CHẾ (mỗi cụm: cơ chế gì · xuất hiện ở mấy ảnh · nguyên lý rút ra).
2. **Gu từ 19 ảnh Hoà gửi chat 14/08 (T đã đọc, chưng cất sẵn — dùng làm trục đối chiếu):** dark-first tactile, kính CÓ CHỪNG MỰC làm điểm nhấn (nút capsule kính, dock ấm kiểu macOS, glass gallery visionOS) · số liệu TO như typography chính (follower count, % research, forecast neon) · editorial Swiss mạnh (pitch deck đỏ-đen-trắng, serif italic accent trong heading sáng) · thẻ xếp chồng có CHIỀU SÂU (stacked cards, carousel nghiêng) · tool NỔI QUANH NỘI DUNG (toolbar glass dưới ảnh, color picker popover từ toolbar) · quả cầu vật liệu grid + filter trái (CGBookCase) · trục thời gian dọc phát sáng · presence avatar stack + CTA/badge · màn chọn (avatar picker) sáng pastel viền gradient mảnh · chuẩn giấy ISO A-series làm đồ hoạ kỹ thuật · voice UI tối giản 1 nút (ChatGPT card) · accent ẤM (cam/amber) xuất hiện lặp lại trên nền tối.
3. **Nội lực đã có (đọc để KHÔNG đề xuất trùng):** `docs/SPEC-DESIGN-SYSTEM-IF.md` (§2b-2d) · `docs/SPEC-APPLE-MOTION-MATERIAL.md` · `docs/SPEC-HOVER-FOCUS-IDF.md` · `docs/CHAN-DOAN-DS-MAT-2026-08-14.md` (nhóm B) · `docs/TRIET-LY-IF.md` [N1][N2] · `docs/REF-VISUAL-2026-08-02.md` (khuôn chưng ref có sẵn — nối tiếp đánh số, đừng đẻ khuôn mới) · 00-CHOT mục kien-truc-tool-3-lop + luong-theo-viec.
4. **Web (dẫn nguồn công khai):** triết lý UI của các công cụ TOP cho dân chuyên + sáng tạo — Figma UI3 ("s商 the canvas", progressive disclosure), Linear (keyboard-first, mật độ), Blender 4.x (N-panel/rollout), Rive/Spline (creative tool mới), Apple visionOS/HIG mới (glass đọc-được-trước), Adobe (bài học rối), Notion/Arc (bắt đầu từ việc). Mỗi nguồn ≤3 gạch NGUYÊN LÝ, kèm URL.

## ④ SẢN PHẨM — `docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` (≤220 dòng), khung bắt buộc:
1. **BẢN ĐỒ CỤM CƠ CHẾ từ 51+19 ảnh** (~8-12 cụm, mỗi cụm 2-3 dòng + đếm tần suất — tần suất = trọng số gu Hoà).
2. **5-7 NGUYÊN LÝ triết lý giao diện** rút từ top-tier + ảnh (mỗi nguyên lý: phát biểu 1 câu · nguồn/bằng chứng · IF đang đạt/chưa ở đâu).
3. **TRẢ LỜI THẲNG BÀI PHÂN LUỒNG:** kiến trúc 3 tầng lộ dần cho IF — ①CHUNG LUÔN HIỆN (những việc app thiết kế nào cũng có — danh sách cụ thể) ②GROUP-BY chọn được (gói tác vụ) ③CỬ CHỈ/collapse mở sâu (hover-reveal, chạm-giữ, ⌘K, rollout) — map vào kien-truc-tool-3-lop đã chốt + chỉ rõ mỗi màn hiện tại lệch tầng nào.
4. **CHỐNG "KHÔNG BIẾT BẮT ĐẦU TỪ ĐÂU":** 3-5 cơ chế cụ thể từ nghiên cứu (empty-state làm-được-việc, lối vào theo việc, mồi 1 hành động chính/màn…) — nuôi spec `luong-theo-viec`.
5. **ĐỀ XUẤT KHUÔN NHÓM B** (từ CHAN-DOAN B1-B6): một khuôn thanh công cụ 3 stage · EmptyState chung · thumbnail strip · tab chặng ở trang cấp app — mỗi khuôn 3-5 dòng mô tả + cụm ảnh ref nào chống lưng; đây là ĐẦU VÀO cho mock Claude Design/Figma, chưa phải mock.
6. **3 CẢNH BÁO** (cái gì trong ảnh ref KHÔNG nên bê vào IF, vì sao — vd trang trí tĩnh trái LightState, glass quá đà trái bài học iOS 27).

## ⑤⑥⑦⑧
KHÔNG git · KHÔNG server · KHÔNG code · web đọc có chọn lọc, ưu tiên nguồn chính hãng/bài gốc · báo cáo `docs/bao-cao-phien/2026-08-14-NC-triet-ly-giao-dien.md` (cách làm + nguồn đã đọc + cái KHÔNG tìm được nói thẳng). Dây máy: entry `nc-triet-ly-giao-dien` — T flip sau audit.
