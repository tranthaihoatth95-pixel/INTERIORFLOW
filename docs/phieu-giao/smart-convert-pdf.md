# PHIẾU GIAO VIỆC — SC · `smart-convert-pdf` (Smart Convert bậc 1: PDF → deck tách lớp) — 13/08/2026

## ① BỐI CẢNH
Hoà chốt Smart Convert (00-CHOT 13/08): định dạng tĩnh nhập IF hướng tới bản EDITABLE tách lớp, theo bậc thang. Bậc 1 = PDF vector: PDF chứa SẴN chữ thật (nội dung + toạ độ + cỡ) — moi ra thành text sống là TẤT ĐỊNH, không AI. Use-case thật đang chờ: Hoà cần sửa deck PDF dự án thật (dàn lại bố cục + thay phối cảnh) → nhập PDF thành deck IF, sửa, xuất PPTX. Painpoint nghề: deck cũ chỉ có PDF, muốn sửa phải dàn lại từ đầu — mất buổi; bậc 1 biến thành 5 phút.

## ② ĐỌC TRƯỚC
1. `lib/notebook/extract.ts` + `lib/cad/brief-file.ts` — cách repo ĐANG dùng `unpdf` (tái dùng pattern, không chế mới).
2. `lib/present-editor/model.ts` — cấu trúc PresentDoc/slide/element (element ảnh + text đã có đủ — deck IF là ĐÍCH).
3. Đường NHẬP hiện có của Present: grep "PPTX" / "import" trong `components/present-editor/` (nhập PPTX cơ bản + ảnh đã chạy — cắm PDF vào CÙNG cửa, không đẻ cửa mới).
4. Đường XUẤT PPTX sẵn có (không đụng).
5. `components/ui/LightArc` (tiến trình thật khi convert nhiều trang).
6. 00-CHOT [13/08 Smart Convert] — bậc thang + gốc bất biến.

## ③ VÙNG FILE
ĐƯỢC: `lib/present-editor/pdf-import.ts` (MỚI, + test) · điểm cắm trong `components/present-editor/**` (cửa nhập hiện có + tiến trình) · `lib/present-editor/` file phụ nếu cần.
CẤM: `prisma` · `lib/cad` `lib/three` `lib/home` `components/home` `components/library` · đường xuất PPTX (chỉ GỌI, không sửa) · KHÔNG thêm dependency mới (unpdf đủ).

## ④ VIỆC
1. **Parser** `lib/present-editor/pdf-import.ts` — `pdfToDeck(buffer)`: mỗi trang → 1 slide, 3 LỚP:
   - **Nền**: trang render raster (scale đủ nét cho A3/16:9 hiển thị; unpdf render page → PNG) — element ảnh đáy, đánh dấu lớp "Nền gốc" (khoá mặc định).
   - **Chữ**: text items từ unpdf (str + transform → x,y + cỡ font) — GOM items thành khối theo dòng/cận kề (khoảng cách < ngưỡng theo cỡ chữ) thành text element SỐNG đúng vị trí/cỡ; giữ nguyên tiếng Việt có dấu. Mặc định lớp chữ **ẨN** (nền raster đã có chữ — bật lớp chữ + tắt nền khi người dùng muốn dàn lại, tránh chữ đôi); ghi rõ hành vi này trong UI (toggle lớp).
   - **Ảnh**: nếu moi được XObject ảnh nhúng lớn (> ~15% diện tích trang) thì thành element riêng đè đúng vị trí; không moi được thì bỏ qua (nền đã chứa) — KHÔNG cố, ghi thật trong báo cáo.
2. **Trang scan/không có text layer**: nhận diện (0 text items) → chỉ lớp Nền + badge trên slide "Trang scan — chữ cần OCR (bậc 2)". Không bịa chữ.
3. **UI**: cửa nhập hiện có của Present nhận thêm `.pdf`; convert chạy có LightArc + số trang; deck ra mở thẳng editor. PDF nhiều trang (>30) → hỏi phạm vi trang trước khi convert (SPEC-NGON-NGU).
4. **Provenance**: deck ghi nguồn (tên file + "chuyển đổi bậc 1") trong meta sẵn có của PresentDoc nếu có chỗ; không có thì ghi note đầu deck.
5. **Test**: tự SINH PDF fixture nhỏ bằng unpdf/pdf-lib?? — KHÔNG thêm dep: fixture = PDF tối giản viết tay bytes (template PDF 1 trang chữ "Xin chào" toạ độ biết trước, lưu `lib/present-editor/__fixtures__/`) + test pdfToDeck ra đúng text/vị trí/slide count; TUYỆT ĐỐI không commit PDF dự án khách.

## ⑤ RÀNG BUỘC
Không git · không dev server · không prisma · không dep mới · không file khách vào repo · token/thang bo cho UI · chữ Việt dấu giữ nguyên · số trang lớn không treo UI (convert theo lô, yield).

## ⑥ NGHIỆM THU TỰ LÀM
```
npx tsc --noEmit
node_modules/.bin/sucrase-node lib/present-editor/pdf-import.test.ts
grep -rn "pdfToDeck" lib/present-editor components/present-editor | head -5
```

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-13-SC-smart-convert-pdf.md` — khuôn 2 giá trị; nói thẳng: moi được ảnh nhúng không, giới hạn font/kerning khi gom khối chữ; CHƯA LÀM ghi rõ.

## ⑧ DÂY MÁY
Entry `smart-convert-pdf` (dir lib/present-editor, mẫu `pdf-import|pdfToDeck`). Không tự sửa registry.
