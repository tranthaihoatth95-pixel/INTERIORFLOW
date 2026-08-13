# PHIẾU GIAO · capture-nut — nối kho chờ dây `captureSequence`: nút Xuất PNG sequence trong 3D

## THẺ VAI [Đ4]
- **VAI:** CS — agent nhánh 3D/xuất, nối kho-chờ-dây lớn nhất còn lại (captureSequence — mở tầng① SPEC-TRINH-VIDEO-EDITOR, "khoảng trống thật lớn nhất" theo SPEC-DUNG-CAMERA).
- **PHẠM VI/TRẦN:** cấp Đ. Vùng: `components/render-studio/**` (nút + dialog xuất) + báo cáo. `lib/three/capture.ts` CHỈ GỌI, không sửa (trừ khi thiếu export nhỏ — khi đó additive 1 dòng, khai rõ).
- **BIÊN → DỪNG:** KHÔNG xây trình dựng video (chặng 3 chỉ trình chiếu — chốt 13/08; việc này CHỈ là xuất chuỗi PNG từ đường camera) · KHÔNG đụng CamPath engine ruột · route `app/dev-bench-3d-2` để nguyên (bench giữ làm bench).
- **ĐIỀU KHOẢN RUỘT:** [T5] xem trước + huỷ được (captureSequence đã có AbortSignal — dùng) · [N1] tội ④: tiến độ thật, không spinner giả — dùng LightArc sẵn có · [T0] khai thật giới hạn (chỉ png, cần campath).

## ① BỐI CẢNH
`captureSequence()` (lib/three/capture.ts:276) + `planCaptureSequenceFrames()` viết xong từ 03/08, có bench, streaming onFrame + AbortSignal + frameCount — nhưng 0 nút UI gọi, người dùng KHÔNG xuất được chuỗi khung hình từ đường camera đã vẽ. Đây là 1 trong 2 kho chờ-dây cuối (soi:contract 13/08). Nối nút = mở tầng① luồng video 0-credit (chuỗi PNG → dựng ngoài).

## ② ĐỌC TRƯỚC
`lib/three/capture.ts` (đầu file + chữ ký captureSequence/planCaptureSequenceFrames — đọc kỹ contract onFrame/AbortSignal/frameCount) · `app/dev-bench-3d-2/page.tsx` (cách gọi ĐÚNG đã chạy — chép cách dùng, không chép UI bench) · viewer 3D hiện có trong components/render-studio (mount ở đâu, lấy scene + campath từ đâu — grep `docToObjScene|CamPath`) · `components/ui/LightArc` (tiến độ) · `docs/SPEC-VIDEO-MAT-BANG.md` (bậc 1-2: layer IF_CAMPATH, tầm mắt 1650).

## ③ VÙNG FILE
`components/render-studio/**` (1 nút vào chỗ hợp ngữ cảnh chế độ 3D + 1 dialog/flow xuất nhỏ) + `docs/bao-cao-phien/2026-08-14-CS-capture-nut.md`.

## ④ VIỆC
1. Nút "Xuất chuỗi ảnh (PNG)" ở đúng ngữ cảnh 3D (cạnh các nút xuất/chụp hiện có — tìm cụm nút thật, không chế toolbar mới). Điều kiện chạy: có campath/đường camera; THIẾU thì nút mờ + lý do (luật hiện-mờ-kèm-lý-do), KHÔNG ẩn.
2. Flow xuất: chọn số khung (mặc định theo duration campath) → chạy captureSequence streaming, LightArc tiến độ thật (frame i/n), nút Huỷ nối AbortSignal → khung ảnh tải về dạng nhiều file PNG hoặc gói .zip qua jszip sẵn có (chọn đường RẺ nhất, khai lý do).
3. Tên file: `<slug>-khung-###.png`, 0 jargon; chuỗi UI song ngữ tr().
4. Kiểm: tsc 0 · test liên quan 0 vỡ · `npm run soi:contract` — entry capture-sequence phải chuyển CÓ DÂY (tự chạy xem, KHÔNG sửa contract-registry — T flip trạng thái cho-day→co-day sau audit) · soi:tu-dien 0 lệch mới.

## ⑤ RÀNG BUỘC
KHÔNG git · KHÔNG server mới · KHÔNG dep · KHÔNG login browser (verify bằng tsc/test; verify mắt T làm sau) · không đổi hành vi viewer hiện có.

## ⑥⑦⑧
Nghiệm thu + báo cáo khuôn chuẩn về `docs/bao-cao-phien/2026-08-14-CS-capture-nut.md` (kèm: nút đặt ở file nào dòng nào, vì sao chỗ đó; giới hạn khai thật). Dây máy: entry frontier `capture-nut` (đợt 1, DocCore) + contract `capture-sequence` — T flip cả hai sau audit.
