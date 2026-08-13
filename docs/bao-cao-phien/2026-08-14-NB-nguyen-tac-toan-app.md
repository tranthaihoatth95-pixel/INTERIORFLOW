# BÁO CÁO PHIÊN NB · nc-nguyen-tac-toan-app (14/08/2026)

## Sản phẩm
- `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` — đúng khung 6 mục của phiếu, 18 nguyên tắc NT-1..18, 5 cụm mới K13-K17, 8 lệch L1-L8.

## Cách lấy dữ liệu Pinterest (và giới hạn — nói thẳng)
1. Browser pane mở 3 board public của @Bentran_tth. KHÔNG login/pin/tương tác tài khoản (đúng trần vai).
2. **Pinterest chặn 2 tầng:** viewport hẹp (mobile) → auth-wall toàn màn; viewport desktop → modal đăng ký + **khoá cuộn trang** (scrollY ghim 0). Vì vậy KHÔNG cuộn được nhiều lượt như phiếu dự kiến.
3. Đường vòng: đọc JSON SSR (`script PWS`) của từng trang board → rút được **~25 pin gần nhất/board** (URL ảnh i.pinimg + dominant color + kích thước). Board thật có 1.684 / 123 / 1.033 ghim — mẫu là LỚP MỚI NHẤT, trùng đúng giai đoạn Hoà đang nghĩ về IF nên trọng số gu cao, nhưng KHÔNG đại diện toàn bộ lịch sử board.
4. Đọc mắt: navigate thẳng từng ảnh i.pinimg.com 564x → screenshot từng tấm (contact-sheet tự dựng bị pane đóng băng compositor — bỏ). Pin đã xem: **U 22/24 · W 11/24 · B 10/24 = 43 pin đọc mắt thật**, chọn phủ đều dominant-color/aspect cho W và B. 32 URL còn lại chưa xem mắt (đã có màu chủ đạo + tỉ lệ từ JSON).
5. Đếm tần suất [T0]: chỉ đếm pin ĐÃ XEM MẮT; con số trong bảng mục 1 là đếm tay từng tấm, có mã pin (U/W/B + số) truy lại được.

## Kỹ thuật pane (để phiên sau đỡ mất 30')
- Screenshot tí hon/đóng băng sau khi inject JS đổi DOM → **đừng dựng contact-sheet trong pane**; tab mới + navigate thẳng ảnh là đường ổn định duy nhất. `UnknownVizError` thi thoảng — retry 1 lần là qua.
- Viewport thật của pane là 732×1408; resize 1280×800 làm screenshot bị scale nhỏ khó đọc.

## Web bổ sung (đều có nguồn trong file NC)
- D5: toolbar 3 vùng theo luồng nhập→dựng→xuất · shortcut hint đáy viewport · render queue batch · PiP camera.
- Corona/Chaos LightMix: chỉnh từng đèn trong+sau render ngay trong VFB, preset kịch bản `.conf` — khớp đề xuất "đổi giờ sau render" đã duyệt 01/08.
- Twinmotion: footer nhãn-bấm thu/mở panel · media strip thumbnail đáy viewport.
- Miro Video calls BETA: call chạy TRONG board, avatar/tile là lớp nổi — chỉ rút phần hiển thị, ranh giới "IF không xây engine call" ghi rõ trong NT-13.

## Thiếu gì / treo gì
- 32 pin chưa đọc mắt (Pinterest khoá cuộn) — nếu Hoà muốn phủ sâu hơn: cách rẻ nhất là Hoà export board hoặc gửi ảnh chụp màn board theo lô như đợt 19 ảnh chat.
- FigJam call-trong-canvas: không tìm được tài liệu hiển thị chi tiết công khai (Miro đủ làm bằng chứng cho khuôn thumbnail-nổi-trên-canvas).
- Board rất ít pin về BẢNG TÍNH/BOQ và VIDEO EDITOR — 2 loại trình bày này chưa có bằng chứng gu từ board, NC file không bịa thêm (mục 3 chỉ phủ technical/mood/vật liệu như phiếu hỏi).

## Đề xuất cho T
- K14 (chrome kỹ thuật đánh số, 10 pin) mạnh đến mức đáng nâng thành CHỮ KÝ THỊ GIÁC IF trong DS — đứng cạnh thang bo §2d.
- K6 = 0/43: thêm bằng chứng để giữ cứng luật "kính là vỏ" khi có ai đề xuất kính hoá chrome.
- Entry `nc-nguyen-tac-toan-app` sẵn sàng flip sau audit của T.
