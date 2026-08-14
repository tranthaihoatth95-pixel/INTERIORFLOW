# BÁO CÁO PHIÊN · DP — D1b vá DF2-F1: ảnh PDF ra kho + chọn trang (2026-08-14)

Phiếu: `docs/phieu-giao/demo-d1b-proxy-pages.md` · entry cha `demo-pdf-render-roundtrip` · KHÔNG git, KHÔNG server mới, KHÔNG dep mới (đã giữ đúng).

## ① Số đo TRƯỚC/SAU — file Westlake THẬT, dán nguyên văn [T0]

File: `~/Downloads/260810_Westlake-Residential_…FULL.pdf` — **477 trang** (⚠️ phiếu ghi "47 trang" — số thật gấp 10; deck >1GB của DF2-F1 là từ chạy nhiều trang raster của chính file này). Chạy `scratchpad/df2-import.ts` (sucrase-node, Node v20.18.1), `pages [15..22]` + `storeImage` ghi PNG ra scratchpad:

```json
{
 "ms": 2044,
 "pages": [15,16,17,18,19,20,21,22],
 "total": 477,
 "slides": 8,
 "imgEls": 41,
 "txtEls": 75,
 "nAssets": 16,
 "storedCount": 16,
 "storedMB": 53.7,
 "deckJsonMB": 0.05,
 "scanPages": [],
 "warnings": [],
 "imageWarnings": []
}
```

| | TRƯỚC (dataURL nhúng, cùng 8 trang) | SAU (storeImage) |
|---|---|---|
| deck JSON | **189,3 MB** (41 element × dataURL lặp) | **0,05 MB** (51.735 byte) ✅ <5MB |
| ảnh | nhúng trong deck | 16 PNG · 53,7 MB **ngoài deck**, PNG hợp lệ (`file` xác nhận, lớn nhất 9,7MB) |
| cảnh báo | `page:0 "tổng ảnh nhúng ~54MB (ngưỡng 20MB)…"` tự nổ đúng | imageWarnings rỗng |

(Số TRƯỚC đo thật bằng `scratchpad/df2-import-before.ts` — cùng pages, không storeImage.)

## ② Việc đã làm

1. **`lib/present-editor/pdf-import.ts`** — lib THUẦN, không gọi API:
   - `rawPixelsToPngBytes()` tách từ `rawPixelsToPngDataUrl()` (1 encoder, 2 vỏ).
   - `PdfImportOptions.pages?: number[]` — danh sách trang tuỳ ý, THẮNG `pageRange`; `normalizePages()` lọc/dedupe/sắp; rỗng-sau-lọc = cả file (không chặn). `parsePagesInput()` hiểu `"15-22,30"` (khoan dung từng phần).
   - `PdfImportOptions.storeImage?: (bytes, meta) => Promise<url>` + `PdfStoredImageMeta` (assetId hash nội dung · name · page · w/h · mime). Encode+store 1 lần/nội dung (ảnh trùng 2 trang = 1 lần gọi). Ném lỗi ở 1 ảnh → ảnh đó fallback dataURL + `imageWarnings` khai rõ; không truyền → hành vi cũ y nguyên + cảnh báo `EMBEDDED_IMAGE_WARN_BYTES` (20MB) cấp file (`page: 0`).
2. **Cửa nhập app** (`components/present-editor/Toolbar.tsx#openPdfFile` — nơi DUY NHẤT gọi `pdfToDeck`, đã grep):
   - `storeImage` thật = **POST `/api/library` sẵn có** (cùng đường LibraryPanel/ProjectSelect; không route mới): bytes→Blob→FileReader dataURL→upload, category `Style dàn trang`, tags `pdf-import`, usage `slide`; trả `/api/library/{id}/file` làm `LinkedAsset.src`. Fail (401/413…) → lib tự fallback + khai trong summary.
   - Prompt chọn trang (>30 trang) đổi sang `parsePagesInput` — gõ được `"15-22,30"`.
   - **Đóng luôn gap D1**: event `present:pdf-import-request` giờ kèm `linkedAssets`; `PresentEditor#onImportPdf` merge vào `deck.linkedAssets` (giữ bản có sẵn, không ghi đè — L5). Trước đây registry bị vứt, mất "sửa 1 lần đổi mọi nơi".
3. Test mới 26 assertion (pages/parsePagesInput/normalizePages · storeImage ra URL, deck 0 dataURL, meta đúng, gọi 1 lần · storeImage lỗi → fallback + warning · bytes↔dataURL nhất quán).

## ③ Nghiệm thu

- `pdf-import.test.ts`: **107 pass · 0 fail** (81 cũ nguyên vẹn + 26 mới).
- `tsc --noEmit`: **0 lỗi**. `npm test` toàn repo: **exit 0**.
- Dev server 3000 sẵn có (không mở mới): `/present-editor` **200** sau sửa (không vỡ runtime import).

## ④ Giới hạn — khai thật

1. **Node 20 gãy operator-list**: pdf.js in `"ignoring errors … page N: transferToFixedLength is not a function"` cho **trang 15–21** (1-based; page 22 sạch) — `ArrayBuffer.prototype.transferToFixedLength` chỉ có từ Node ≥21. pdf.js NUỐT lỗi nội bộ (không ném ra) nên `imageWarnings` rỗng; ảnh vẫn trích được 16 asset/41 element nhưng KHÔNG loại trừ thiếu ảnh lẻ trên các trang đó. Browser (Electron/Chrome ≥114) có hàm này — không bị. Không fix Node theo phiếu.
2. Node script dùng URL giả lập `/uploads/df2/…` (Node không có API app) — đường upload thật `/api/library` chỉ chạy trong browser có đăng nhập; đã smoke 200 route nhưng CHƯA bấm tay trọn vòng import trên browser (cần login + file 111MB qua file-input — ngoài nghiệm thu phiếu). Ảnh/trang nào >25MB sẽ bị `/api/library` 413 → fallback dataURL từng ảnh (Westlake max 9,7MB, chưa đụng trần).
3. PNG stored (không nén) — 53,7MB/16 ảnh là giá của lossless [T0]; proxy nén nhẹ để dành bậc sau (cần canvas/encoder, phiếu cấm dep).
4. Hai script nghiệm thu + `df2-assets/` + `df2-deck.json` nằm ở scratchpad phiên `b779779b…`, không vào repo.
