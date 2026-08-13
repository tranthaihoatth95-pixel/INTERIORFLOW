# PHIẾU GIAO · sửa lệch soi:thao-tac đợt 1 — 3 luật cơ khí (webkit-prefix · keydown né ô nhập · chữ "tự động")

## THẺ VAI [Đ4]
- **VAI:** TT — agent sửa lệch Hệ Luật Thao Tác đợt 1, đưa soi:thao-tac từ 5 lệch → 2 lệch (2 còn lại là hàng đợi có chủ ý: focus-visible 31 file + hex inline 193 — cần mắt design, KHÔNG đụng đợt này).
- **PHẠM VI/TRẦN:** cấp Đ (sửa cơ khí từng chỗ). Vùng: CHỈ các file nằm trong danh sách lệch của 3 luật `kinh-webkit-prefix` · `keydown-ne-o-nhap` · `cam-chu-tu-dong` khi chạy `npm run soi:thao-tac` + `scripts/thao-tac-registry.mjs` (ĐÚNG 1 việc: thêm `esc-only` vào mauThieu luật keydown, xem việc 2) + báo cáo.
- **BIÊN → DỪNG:** ⛔ **KHÔNG đụng bất kỳ file nào trong `components/present-editor/`** (agent HS đang làm song song ở đó — file lệch nào nằm trong đó thì BỎ QUA, ghi vào báo cáo là "nhường đợt sau") · KHÔNG sửa 2 luật hàng đợi · KHÔNG đổi hành vi ngoài đúng lệch được nêu · file nào sửa xong phải chạy lại soi:thao-tac xác nhận hết khớp.
- **ĐIỀU KHOẢN RUỘT:** [N1] tội danh 1/3/4 · [T0] không nới pattern cho sạch giả — sửa CODE cho đúng luật, không sửa luật cho khớp code (ngoại lệ duy nhất là việc 2, đã được T phán có lý do) · [T5] chữ UI chính xác về vai AI.

## ① BỐI CẢNH
Máy soi luật thao tác (P3, vừa ship) phát đầu bắt 5 lệch thật. 3 lệch cơ khí sửa được ngay không cần mắt design: thiếu `-webkit-backdrop-filter` = tablet không blur (bài học K3 TICKET-FIX-KINH) · keydown toàn cục không né ô nhập = gõ chữ kích hoạt phím tắt (chốt hệ phím tắt 10/08) · chữ "tự động" trong UI = cảm giác giả về AI (CHOT-TACH-AI §1-2a).

## ② ĐỌC TRƯỚC
Chạy `npm run soi:thao-tac` lấy danh sách file lệch THẬT (đừng tin số trong phiếu này) · `scripts/thao-tac-registry.mjs` (3 entry luật liên quan) · `docs/CHOT-TACH-AI-VA-CHINH-TAY.md` §2a (vì sao cấm đúng một từ "tự động") · xem 1-2 file đã ĐÚNG luật làm mẫu (grep `-webkit-backdrop-filter` và `isContentEditable` trong components).

## ③ VÙNG FILE
Các file trong danh sách lệch 3 luật trên (TRỪ `components/present-editor/**`) + `scripts/thao-tac-registry.mjs` (1 dòng mauThieu) + `docs/bao-cao-phien/2026-08-13-TT-sua-thao-tac-1.md`.

## ④ VIỆC
1. **kinh-webkit-prefix (~18 file):** mỗi chỗ `backdropFilter`/`backdrop-filter` thêm dòng Webkit tương ứng NGAY CẠNH, cùng giá trị (JSX: `WebkitBackdropFilter` cùng object; CSS: `-webkit-backdrop-filter` dòng trên). Không đổi giá trị blur nào.
2. **keydown-ne-o-nhap (~12 file):** phân loại từng file: (a) listener có phím CHỨC NĂNG (chữ/số/mũi tên/space/⌘X) → thêm guard đầu handler theo mẫu đã có trong repo (né INPUT/TEXTAREA/isContentEditable), hành vi khác giữ nguyên; (b) listener CHỈ Escape (đóng/huỷ) → hành vi đúng chuẩn dialog, KHÔNG thêm guard — thay vào đó ghi marker comment `esc-only` ngay dòng addEventListener; đồng thời sửa `scripts/thao-tac-registry.mjs` luật `keydown-ne-o-nhap`: thêm `esc-only` vào mauThieu (phán quyết T 13/08 tối: Escape là lệnh đóng, không phải phím tắt chức năng — marker chỉ hợp lệ khi listener thật sự chỉ xử Escape, agent kiểm từng ca). `lib/useDismissable.ts` thuộc ca (b).
3. **cam-chu-tu-dong (~17 chỗ):** phân loại TỪNG chỗ, không thay hàng loạt: hành động AI/máy đoán → dùng "Magic"/"máy đề xuất"/"tự co giãn"/"tự ẩn"… theo đúng nghĩa từng chỗ (từ thay phải TẢ ĐÚNG cơ chế, không phải đồng nghĩa che mắt); chỗ nào là văn xuôi mô tả trong comment code (không phải chuỗi UI người dùng thấy) mà máy soi bắt → được phép viết lại câu comment cho khỏi khớp pattern NHƯNG giữ nghĩa. Chuỗi UI đổi thì cập nhật cả bản EN nếu có cặp i18n.
4. Chạy lại `npm run soi:thao-tac`: 3 luật này phải ✅ hết (trừ các file present-editor đã nhường — nếu còn khớp thì dòng tổng ghi rõ trong báo cáo).

## ⑤ RÀNG BUỘC
KHÔNG git · KHÔNG dev server · KHÔNG dep mới · KHÔNG đổi thị giác (blur giữ giá trị, chỉ thêm prefix) · tsc + test liên quan tự chạy.

## ⑥ NGHIỆM THU TỰ LÀM
`npm run soi:thao-tac` — 3 luật mục tiêu hết đỏ (hoặc chỉ còn file present-editor đã nhường, ghi rõ) · `npx tsc --noEmit` 0 lỗi mới · `npm run soi:tu-dien` 0 lệch mới · `npm run check:chot` 0 chặn (luật AI-CAM-TU-TU-DONG không được vỡ ngược).

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-13-TT-sua-thao-tac-1.md` — bảng từng luật: số chỗ sửa / số chỗ nhường present-editor / số ca esc-only · từng chỗ "tự động" đổi thành gì (bảng 2 cột cũ→mới) · output soi:thao-tac sau sửa nguyên văn · CHƯA LÀM nói thẳng.

## ⑧ DÂY MÁY
Không entry mới — hàng đợi này đã ghi trong ten entry `he-luat-thao-tac`. T cập nhật ten entry sau audit.
