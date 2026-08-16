# PHIẾU GIAO · NC-2 — BỘ NGUYÊN TẮC GIAO DIỆN IF cấp TOÀN APP (lướt 3 board Pinterest của Hoà)

## THẺ VAI [Đ4]
- **VAI:** NB — agent nghiên cứu giao diện #2, chưng cất 3 board Pinterest của chính Hoà thành BỘ NGUYÊN TẮC thống nhất cấp toàn app (Hoà: "chúng ta sẽ thống nhất các nguyên tắc giao diện app cho IF trước").
- **PHẠM VI/TRẦN:** cấp NC, không code. Sản phẩm: `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` + báo cáo. Board Pinterest chỉ XEM/cuộn — không pin, không login, không tương tác tài khoản.
- **BIÊN → DỪNG:** đây là ĐỀ XUẤT trình Hoà, không phải chốt · videocall: IF ĐÃ CHỐT không tự xây engine call (11/08) — chỉ rút cơ chế UI hiển thị người/presence trong workspace, ghi rõ ranh giới · Pinterest chặn/không mở được → dùng phần đã cào được + nói thẳng thiếu gì.
- **ĐIỀU KHOẢN RUỘT:** [T4] tổng→chi tiết, phân loại lớn→nhỏ · [N2] · [T0] tần suất thật, không bịa · [Đ2] đối chiếu NC-1 + NC-GU-BENTRAN cũ, nối tiếp không lặp.

## ② NGUYÊN LIỆU & CÁCH LÀM
1. **3 board Pinterest của Hoà** (browser pane, cuộn mỗi board nhiều lượt cho ảnh nạp — public không cần login):
   - pinterest.com/Bentran_tth/uxui-design/ (gu UI chủ đích)
   - pinterest.com/Bentran_tth/what-i-see/ (mắt hàng ngày)
   - pinterest.com/Bentran_tth/background/ (nền/không khí)
   Cách đọc: screenshot theo trang cuộn, mỗi lượt ghi cơ chế theo TỪ VỰNG CỤM K1-K12 của `docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` (mở rộng thêm cụm mới nếu gặp — đánh K13+), đếm tần suất. Board của CHÍNH Hoà = trọng số gu cao nhất, ghi riêng cột "board nào".
2. **Nội lực đọc trước:** NC-TRIET-LY-GIAO-DIEN (nền — KHÔNG lặp lại, chỉ mở rộng) · NC-GU-BENTRAN-PINTEREST-2026-08-13.md (đợt cào trước — nối tiếp) · SPEC-CHANG2-UI-2MODE (workspace/Miro) · SPEC-VITALS-UNIFIED · CHOT-VITALS-LM-CHAT (khuôn Siri) · docs/REVIEW-DONG-BO + kien-truc-tool-3-lop.
3. **Web bổ sung có nguồn** cho 2 mảng Hoà nêu thêm: tool 3D + RENDER chuyên (D5 Render, Enscape, Twinmotion, Chaos Vantage/Corona interactive — UI viewport render, LightMix, hàng đợi render, so sánh A/B) · videocall-trong-workspace (Miro/FigJam/Zoom-in-canvas — chỉ phần hiển thị).

## ④ SẢN PHẨM — `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` (≤250 dòng), khung bắt buộc:
1. **THU HOẠCH 3 BOARD** — bảng cụm cơ chế × tần suất × board; cụm MỚI (K13+) tách riêng.
2. **CƠ CHẾ THEO CẤP ỨNG DỤNG** (mỗi cấp 3-6 nguyên tắc + ảnh/nguồn chống lưng):
   a. TOÀN APP: hệ workspace, dashboard/tổng quan, điều hướng cấp app, presence/videocall-trong-canvas.
   b. STAGE/luồng sử dụng: vào việc → làm → xuất, chuyển stage.
   c. HỆ NÚT · PHÍM · KÝ HIỆU: phân hạng nút (chính/phụ/nguy), khuôn phím tắt hiển thị, iconography (1 bộ, nét, size), badge/trạng thái.
3. **CƠ CHẾ VISUAL THEO LOẠI TRÌNH BÀY** — câu hỏi đích danh của Hoà, mỗi loại 4-6 nguyên tắc:
   a. TECHNICAL (bản vẽ, spec, số): nền gì, lưới, mono/tabular, mật độ, nhãn.
   b. MOOD/ĐỊNH HƯỚNG (ảnh cảm hứng, moodboard, storyline): full-bleed, chữ đè ảnh, nhịp thở, ambient.
   c. VẬT LIỆU/SPEC/FUR: quả cầu-swatch-macro texture, bảng thông số cạnh ảnh, spec sheet.
4. **TOOL 3D + RENDER** (mở rộng NC 3D đã có): viewport chrome, control nổi theo đối tượng, hàng đợi render, LightMix/so sánh A/B — map vào mode Vẽ 3D + Render Studio hiện có.
5. **BỘ NGUYÊN TẮC GIAO DIỆN IF v1** — TỔNG HỢP CUỐI: ~12-18 nguyên tắc đánh số NT-1…, mỗi cái 1 câu + phạm vi áp + nguồn (ảnh board/top-tier/spec có sẵn) — đây là văn bản Hoà sẽ duyệt để thành CHUẨN trước khi mock; nối các khuôn KB-1..4 của NC-1 vào dưới nguyên tắc tương ứng.
6. **LỆCH HIỆN TẠI** — 5-8 chỗ app đang trái nguyên tắc nào (đối chiếu CHAN-DOAN-DS-MAT, không lặp cái đã sửa).

## ⑤⑥⑦⑧
KHÔNG git/code/login/pin · ảnh chỉ rút cơ chế, cấm chép nguyên màn · báo cáo `docs/bao-cao-phien/2026-08-14-NB-nguyen-tac-toan-app.md` (số pin đã xem mỗi board, cách đếm, thiếu gì nói thẳng). Dây máy: entry `nc-nguyen-tac-toan-app` — T flip sau audit.
