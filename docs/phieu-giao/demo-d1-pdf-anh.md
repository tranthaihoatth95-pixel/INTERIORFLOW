# PHIẾU GIAO · D1 — LỚP ẢNH cho pdfToDeck: rã cấu kiện ảnh có phả hệ (demo-pdf-render-roundtrip mảnh 1)

## THẺ VAI [Đ4]
- **VAI:** D1 — agent lib Trình chiếu, bật lớp ẢNH cho Smart Convert (bậc 1c).
- **PHẠM VI/TRẦN:** cấp Đ. Vùng: `lib/present-editor/pdf-import.ts` + `pdf-import.test.ts` + (nếu cần type) `lib/present-editor/model.ts` CHỈ THÊM field optional. KHÔNG đụng components, KHÔNG đụng linked-assets.ts ruột (chỉ GỌI API sẵn).
- **BIÊN → DỪNG:** KHÔNG dep mới (unpdf sẵn — extractImages ghi chú tại pdf-import.ts:24) · lớp NỀN raster vẫn là nợ 1b, KHÔNG cố giải · ảnh trích quá nặng (>~2MB/ảnh) thì downscale? KHÔNG — giữ nguyên gốc [T0], ghi cảnh báo kích thước vào báo cáo.
- **ĐIỀU KHOẢN RUỘT:** [T1] ảnh là linked asset MỘT nguồn · [T0] provenance thật (file/trang/bbox) · [T6] test tất định.

## ① BỐI CẢNH
Dogfood #2: PDF concept của khách → deck. Bậc 1 hiện chỉ có lớp CHỮ; ảnh render/phối cảnh trong PDF bị bỏ rơi — trong khi đó là cấu kiện đắt nhất để vòng chỉnh-phối-cảnh chạy. Cần: mỗi ảnh nhúng trong PDF thành `ImageElement` đặt ĐÚNG bbox trên slide + đăng ký `deck.linkedAssets[assetId]` với provenance {nguồn pdf, trang, bbox} — "rã cấu kiện thành slide phả hệ" đúng lời Hoà.

## ② ĐỌC TRƯỚC
`lib/present-editor/pdf-import.ts` TOÀN BỘ (đặc biệt header hạn chế 1-2 + cách dựng TextElement bbox) · `lib/present-editor/linked-assets.ts` (attachElementToAsset — mint assetId cách nào) · `model.ts:294-460` (ImageElement.assetId + LinkedAsset) · unpdf docs extractImages (node_modules/unpdf README/d.ts).

## ④ VIỆC (marker `pdfImageLayer`)
1. `extractImages` per trang → mỗi ảnh: ImageElement {bbox theo toạ độ trang như lớp chữ đang làm, src=dataURL} + `attachElementToAsset` với assetId tất định (hash nội dung ảnh — trùng ảnh 2 trang = CÙNG asset, đúng tinh thần linked) + provenance ghi vào LinkedAsset (thêm field optional `provenance?: {loai:'pdf', file, page, bbox}` nếu model chưa có).
2. Trang có ảnh + chữ: thứ tự z ảnh DƯỚI chữ. Ảnh không bbox tin cậy (transform lạ) → đặt full-slide phía dưới + cờ `inferred` trong provenance, khai thật.
3. Test: PDF fixture có ảnh nhúng (tự sinh fixture nhỏ bằng pdf-lib có sẵn? nếu repo không có pdf-lib thì lấy fixture nhị phân nhỏ tự tạo — không tải mạng) — round-trip: n ảnh vào → n element + assetId tất định + provenance đúng trang.
4. `npx tsc --noEmit` 0 · test pdf-import cũ 0 vỡ · sucrase test mới pass.

## ⑦⑧
Báo cáo `docs/bao-cao-phien/2026-08-14-D1-pdf-anh.md` (+ giới hạn thật: định dạng ảnh nào unpdf không trích được thì ghi). KHÔNG git/server/dep. Entry cha `demo-pdf-render-roundtrip` — T flip sau dogfood.
