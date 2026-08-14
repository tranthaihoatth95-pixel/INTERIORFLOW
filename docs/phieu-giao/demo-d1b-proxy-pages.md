# PHIẾU GIAO · D1b — vá DF2-F1: ảnh PDF ra kho ngoài deck (proxy nhẹ) + chọn trang khi import

## THẺ VAI [Đ4]
- VAI: DP — agent vá nóng dogfood DF2, theo luật Smart Ingest (gốc bất biến + proxy hiển thị).
- PHẠM VI/TRẦN: `lib/present-editor/pdf-import.ts` (+test) + cửa nhập PDF phía components (file nào gọi pdfToDeck — grep, khai rõ) + (nếu cần) 1 route API upload TÁI DÙNG đường /api/library hoặc uploads sẵn có — KHÔNG schema mới, KHÔNG dep mới.
- BIÊN → DỪNG: KHÔNG đụng magic-perspective/linked-assets ruột · đường Node/test giữ hành vi cũ (ảnh nhỏ fixture vẫn dataURL được — test 81 không vỡ) · không làm proxy được ở môi trường nào thì fallback dataURL + CẢNH BÁO kích thước, khai thật.
- ĐIỀU KHOẢN RUỘT: [T1] gốc bất biến một chỗ · [T0] số đo trước/sau · smart-ingest chốt 11/08.

## ① BỐI CẢNH
DF2 chạy file thật 47 trang: deck nhúng dataURL PNG lossless → >1GB JSON, Node sập ("Invalid string length"), browser sẽ chết tab tương tự. Cần: ảnh GỐC đẩy ra kho (uploads/LibraryAsset — đường library-data-that 12/08 đã dùng), `LinkedAsset.src` = URL (+ proxy nhẹ nếu rẻ); deck JSON còn cỡ KB. Kèm: option `pages?: number[]` cho pdfToDeck để dogfood nhập đúng các trang cần (bếp/khách/vệ sinh) thay vì cả 47.

## ④ VIỆC
1. `pdfToDeck(buffer, name, opts?: { pages?: number[] })` — lọc trang, additive, test.
2. Đường ảnh: callback `opts.storeImage?: (bytes, meta) => Promise<string /*url*/>` — lib THUẦN không tự gọi API; caller components truyền hàm upload (tái dùng đường upload LibraryAsset/uploads sẵn có, DataOrigin/license user). Không có storeImage → hành vi cũ (dataURL) + `imageWarnings` cảnh báo tổng KB khi vượt ngưỡng (~20MB).
3. Cửa nhập PDF trong app: truyền storeImage thật + (UI nhỏ) cho chọn khoảng trang nếu rẻ — không rẻ thì tham số mặc định tất cả + khai.
4. Nghiệm thu: test cũ 81 + mới pass · tsc 0 · chạy script Node (scratchpad/df2-import.ts — sửa gọi pages [15..22] + storeImage ghi file ra scratchpad) trên FILE WESTLAKE THẬT: phải ra deck JSON < 5MB, in số {slides, imgEls, nAssets, tổng MB ảnh đã lưu ngoài} — dán nguyên văn báo cáo.

## ⑦⑧
Báo cáo `docs/bao-cao-phien/2026-08-14-DP-proxy-pages.md`. KHÔNG git/server. Entry cha demo-pdf-render-roundtrip.
