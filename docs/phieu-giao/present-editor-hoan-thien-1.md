# PHIẾU GIAO · present-editor hoàn thiện #1 — kênh PDF cho Gói Hồ Sơ + trả 7 chỗ thao-tac đã nhường

## THẺ VAI [Đ4]
- **VAI:** PE — agent nhánh Trình chiếu, trả 2 món nợ khai thật của đợt trước trong CÙNG vùng present-editor.
- **PHẠM VI/TRẦN:** cấp Đ. Vùng: `components/present-editor/**` + `lib/present-editor/export.ts` + báo cáo. KHÔNG file nào khác.
- **BIÊN → DỪNG:** KHÔNG đụng `lib/ho-so-song/**` (pack.ts đã nhận `pdf?: Blob` sẵn — chỉ NỐI từ phía caller) · KHÔNG đổi hành vi export hiện có (biến thể Blob là ADDITIVE) · KHÔNG đụng 2 luật hàng đợi mắt-design (focus-visible, hex inline).
- **ĐIỀU KHOẢN RUỘT:** [T1] gói là đích của cùng nguồn · [T0] nợ đã khai thì trả có bằng chứng · [N1] tội 1/3/4.

## ① BỐI CẢNH
Đợt trước để lại 2 nợ khai thật cùng nằm trong present-editor: ① Gói Hồ Sơ Sống thiếu kênh PDF vì `exportDeckToPdf` không trả Blob (HS đề xuất biến thể additive) — gói giao khách đang vắng tầng② quan trọng nhất; ② 7 chỗ lệch soi:thao-tac (TT nhường vì HS làm song song): Toolbar.tsx (webkit prefix) · EditorCanvas.tsx, SlidePlayer.tsx, boq/BoqScreen.tsx (keydown né ô nhập) · Inspector.tsx:659,1168, TextToolbar.tsx:272 (chữ "tự động").

## ② ĐỌC TRƯỚC
`lib/present-editor/export.ts` (đường PDF hiện có — tìm điểm tách bytes/Blob trước khi save) · `components/present-editor/Toolbar.tsx` handler "Gói Hồ Sơ (.zip)" (HS viết 13/08 — đọc để nối đúng) · `lib/ho-so-song/types.ts` + `pack.ts` interface (CHỈ đọc) · `scripts/thao-tac-registry.mjs` 3 luật liên quan + 1-2 file TT đã sửa làm mẫu (grep `WebkitBackdropFilter`, `isContentEditable`, bảng nhãn trong `docs/bao-cao-phien/2026-08-13-TT-sua-thao-tac-1.md`).

## ③ VÙNG FILE
`lib/present-editor/export.ts` · `components/present-editor/{Toolbar,EditorCanvas,SlidePlayer,Inspector,TextToolbar}.tsx` · `components/present-editor/boq/BoqScreen.tsx` · `docs/bao-cao-phien/2026-08-13-PE-hoan-thien-1.md`.

## ④ VIỆC
1. `export.ts`: thêm biến thể trả `Blob`/bytes cho đường xuất PDF deck (tách phần dựng khỏi phần save-file; hàm cũ gọi biến thể mới rồi save như cũ — 0 đổi hành vi; nếu đường hiện tại phụ thuộc DOM/print thì chọn cách khả thi nhất và NÓI THẬT giới hạn trong báo cáo, không ép).
2. `Toolbar.tsx`: handler Gói Hồ Sơ gọi biến thể mới, đưa `pdf` vào `packHoSoSong` → manifest hết khai vắng "pdf" khi xuất được; PDF lỗi thì kênh vẫn vắng + khai trong viewer (fail-open, không chặn gói).
3. Trả 7 chỗ thao-tac đúng khuôn TT: webkit prefix cùng giá trị · guard né ô nhập theo khuôn repo (SlidePlayer chú ý: phím trình chiếu ←/→/Esc — nếu màn trình chiếu không có ô nhập thật thì guard vẫn thêm cho đúng luật, hành vi không đổi) · nhãn "tự động" đổi đúng nghĩa từng chỗ, cập nhật cặp EN nếu có.
4. Chạy `npm run soi:thao-tac`: 3 luật kinh-webkit-prefix · keydown-ne-o-nhap · cam-chu-tu-dong phải ✅ HOÀN TOÀN (0 file còn khớp).

## ⑤ RÀNG BUỘC
KHÔNG git · KHÔNG dev server · KHÔNG dep · không đổi thị giác/blur · tsc + test liên quan (export/present-editor + lib/ho-so-song test phải vẫn pass) · soi:tu-dien 0 lệch mới.

## ⑥ NGHIỆM THU TỰ LÀM
tsc 0 lỗi mới · test present-editor + ho-so-song pass · soi:thao-tac 3 luật ✅ hoàn toàn · SINH LẠI GÓI MẪU có kênh PDF bằng script node (mượn `scratchpad/tao-goi-mau.ts` sẵn có, thêm pdf fixture bytes) ra `/private/tmp/claude-501/-Users-tranben-Downloads-interiorflow/b779779b-76b3-4e9c-ba44-69dbf50c46a5/scratchpad/ho-so-mau-pdf.zip` — T mở mắt khi audit; nếu biến thể Blob phụ thuộc browser thật thì nói thẳng, T verify browser sau.

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-13-PE-hoan-thien-1.md` — khuôn chuẩn + bảng 7 chỗ thao-tac (chỗ → sửa gì) + cách tách Blob trong export.ts + output soi:thao-tac nguyên văn.

## ⑧ DÂY MÁY
Không entry mới — trả nợ đã ghi trong ten entry `goi-ho-so-song` + `he-luat-thao-tac`. T cập nhật ten 2 entry sau audit.
