# PHIẾU GIAO VIỆC — T2 · `editor-bang-bieu-mau` (Engine bảng — docType Schedule) — Đợt 4, 12/08/2026

## ① BỐI CẢNH NGÀNH
Hồ sơ nội thất thật đầy BẢNG: thống kê cửa, schedule vật liệu/thiết bị, phiếu trình duyệt. Revit có schedule sống theo model — đó là lý do văn phòng lớn không bỏ Revit được. IF hiện chỉ BOQ chạy; các loại hồ sơ dạng bảng khác là thẻ khoá "Sắp có". Painpoint tận gốc: sửa model xong phải sửa bảng bằng tay ở app khác, luôn sót. Một ENGINE BẢNG chung → `schedule` → `spec-sheet` → `approval-form` là 3 mặt tiền (luật một-cỗ-máy-nhiều-mặt-tiền). V1 phiếu này: docType **schedule** sống thật, đọc Doc 2D thật.

## ② ĐỌC TRƯỚC
1. `lib/present-editor/model.ts` — model hồ sơ hiện có; các file `boq*` trong `lib/present-editor/` (boq-xlsx-import, boq-spec-extra…) — engine BOQ để NÂNG, không viết lại.
2. `components/present-editor/boq/**` + `PresentDocTypePicker.tsx` (màn chọn 6 loại — thẻ khoá kèm lý do năng lực) + `PresentSheets.tsx`.
3. `docs/OUTPUT-CAPABILITY-MATRIX-INTERNAL-2026-08-11.md` — ranh giới "chỉ mở khả năng thật".
4. `docs/CHUAN-DAU-RA-NGHE.md` — luật đầu ra (BOQ nguồn giá, chữ sửa được, 0 placeholder).
5. `docs/00-CHOT.md` chốt 07/08 mục 7 (pipeline human-in-loop: ĐÍCH ĐẾN PHẢI SỬA ĐƯỢC) + luật 6 (sửa tay của người dùng không bao giờ bị ghi đè).
6. Cách đọc Doc 2D từ Trình chiếu: tìm đường flow/doc hiện có (PresentEditor đọc CAD Layout — grep `CAD Layout`/`cadLayout` trong components/present-editor).

## ③ VÙNG FILE
ĐƯỢC: `components/present-editor/**` · `lib/present-editor/**`.
CẤM: `prisma/schema.prisma` · `lib/three` · `lib/library` · `components/library` · `lib/cad/**` (đọc được, sửa không) · `lib/dna` · `lib/distill`.

## ④ VIỆC
1. **Trừu tượng engine bảng** từ BOQ: `TableDocEngine` trong `lib/present-editor/` — cột cấu hình theo docType, hàng từ NGUỒN DỮ LIỆU (Doc 2D / nhập tay / import), từng ô sửa được, nhóm + dòng tổng. BOQ chuyển thành MỘT cấu hình của engine (không phá hành vi BOQ hiện có — test BOQ cũ phải còn pass). MARKER: `TableDocEngine`.
2. **docType `schedule` (nhãn hiển thị: "Bảng thống kê")** v1: thống kê CỬA + PHÒNG đọc từ Doc 2D thật của flow (cửa là con tường; room có diện tích) — mỗi hàng giữ `entityId` nguồn (số truy về một nguồn). Doc trống → empty state làm được việc, KHÔNG chặn (luật X2).
3. **Re-sync không ghi đè tay**: nút "Cập nhật từ bản vẽ" — hàng máy gieo được refresh; Ô NGƯỜI ĐÃ SỬA TAY giữ nguyên + đánh dấu (luật 6). Cờ nguồn máy/tay nhìn thấy được.
4. **Mở khoá thẻ** trong PresentDocTypePicker: `schedule` thành thẻ THẬT vào editor; `spec-sheet`/`approval-form` VẪN khoá kèm lý do năng lực (không CTA giả, không nút giả).
5. **Xuất**: XLSX + PDF qua đường xuất sẵn có; chữ trong file xuất sửa được (luật đích-đến-sửa-được).
6. **Test**: build bảng từ Doc mẫu (có cửa/phòng) · re-sync giữ ô tay · round-trip · BOQ regression (chạy lại test boq cũ).

## ⑤ RÀNG BUỘC
Không git · không dev server · không prisma · token + thang bo `--r-*` · 2 theme · SPEC-NGON-NGU (nhãn không jargon: "Bảng thống kê", không "schedule" lộ UI VI) · số liệu không bịa — thiếu thì để trống kèm trạng thái.

## ⑥ NGHIỆM THU TỰ LÀM
```
npx tsc --noEmit
node_modules/.bin/sucrase-node lib/present-editor/boq-xlsx-import.test.ts
node_modules/.bin/sucrase-node lib/present-editor/table-doc-engine.test.ts
grep -rn "TableDocEngine" lib/present-editor components/present-editor | head -5
```

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-12-T2-bang-bieu-mau.md` — khuôn 2 giá trị; lệnh dán nguyên văn; quyết định tự chọn + lý do; CHƯA LÀM nói thẳng; chạm biên (cần sửa lib/cad, cần docType ngoài schedule) → DỪNG + đề xuất lên T.

## ⑧ DÂY MÁY
Entry registry MỚI `editor-bang-bieu-mau` (T đã thêm: dir `lib/present-editor`, mẫu `TableDocEngine`). Không tự sửa registry.
