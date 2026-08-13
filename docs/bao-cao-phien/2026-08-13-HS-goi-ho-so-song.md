# BÁO CÁO PHIÊN · HS — goi-ho-so-song (P4 Gói Hồ Sơ Sống v0) · 13/08/2026

**Vai:** HS (Đ4) · **Phiếu:** `docs/phieu-giao/goi-ho-so-song.md` · **Marker:** `HoSoSong`

## 1 · File tạo / sửa

| File | Loại | Nội dung |
|---|---|---|
| `lib/ho-so-song/types.ts` | MỚI | Kiểu thuần: `HoSoSongManifest` (version 1 · kenh[] loai viewer/nganh/ruot · sha256 · provenance) + `HoSoSongInput` nhận artifact ĐÃ SINH SẴN |
| `lib/ho-so-song/manifest.ts` | MỚI | `toBytes` · `sha256Hex` (WebCrypto, tiền lệ upscale-cache) · `taoKenh` · `taoManifest` — thuần, không Date.now |
| `lib/ho-so-song/viewer-template.ts` | MỚI | `renderViewerHtml` — index.html TỰ CHỨA: JSON nhúng `<script type="application/json">` (KHÔNG fetch — fetch qua giao thức file bị chặn, đúng phiếu ④.3), ảnh đường tương đối `out/images/`, bảng BOQ tóm tắt, khai kênh VẮNG, song ngữ tĩnh, tone be/xám-đen (giá trị chép từ globals.css, ghi chú nguồn), 0 request ngoài, chỉ chữ "Tạo bởi InteriorFlow" nhỏ [T3] |
| `lib/ho-so-song/pack.ts` | MỚI | `packHoSoSong(input): Promise<Blob>` (hợp đồng ④.2) + `buildHoSoSong` trả bytes+manifest cho test/script + `hoSoSongFileName` (`ho-so-<slug>-<yyyymmdd>.zip`, ⑤). jszip import động, không dep mới. Thiếu toàn bộ artifact → ném lỗi rõ |
| `lib/ho-so-song/ho-so-song.test.ts` | MỚI | 22 test thuần node |
| `components/present-editor/Toolbar.tsx` | **ĐIỂM CẮM UI DUY NHẤT** | Mục "Gói Hồ Sơ (.zip) · Living Dossier" trong IOMenu xuất + handler `exportHoSoSong` |

KHÔNG đụng file nào khác. KHÔNG git. KHÔNG dev server. KHÔNG schema DB. KHÔNG sửa registry.

## 2 · Cách điểm cắm gom artifact (một cỗ máy nhiều mặt tiền [T2])

- **Ruột JSON** = `.idfp` đầy đủ mọi sheet qua `exportIdfp` + `getActiveBrandKit` (chính đường nút "Toàn bộ project") → `data/deck.json` — nhập lại được bằng `importIdfp` [T5].
- **Ảnh trang** = `renderEditorSlide` từng slide deck đang mở (chính engine PDF/PNG) → `out/images/trang-NN.jpg`.
- **BOQ** = CÙNG đường `BoqXlsxImportDialog` (getProjectDoc + POST `/api/boq/[id]`) → `boqResultToXlsxBuffer` → `out/boq.xlsx` + bảng tóm tắt cho viewer. Best-effort: lỗi/thiếu Doc → BỎ QUA kênh, không chặn [T0].
- Deck đọc từ persist CÙNG bucket/route PresentSheets (`useSheetsBucketId` + `/present-editor`) — Toolbar không giữ deck trong props, đây là đường không phải nới props/đụng file thứ hai.
- Toast đi kênh `present:idfp-export-done` có sẵn (PresentEditor#onDone — cùng cách `.pptx` nhập mượn kênh, không viết toast mới, không sửa PresentEditor).
- Mọi import ĐỘNG — không bấm thì bundle không tải jszip/render.

## 3 · Kết quả lệnh thật

- `npx tsc --noEmit` → **0 lỗi** (output rỗng).
- `node_modules/.bin/sucrase-node lib/ho-so-song/ho-so-song.test.ts` → **22 pass, 0 fail**: round-trip zip → manifest đúng số kênh (5, pdf vắng không có entry giả) · sha256 mọi kênh khớp đúng byte (kể cả index.html) · taoLuc tất định từ caller · viewer chứa JSON nhúng + regex khoá `https?://` = 0 + không `fetch(` · escape `</script>` · tên ảnh bẩn chống path-traversal · thiếu toàn bộ artifact ném lỗi rõ.
- `npm run soi:tu-dien` → **✅ 0 lệch định nghĩa**.
- **GÓI MẪU** (script fixture node thuần, PNG thật 800×450 tự dựng):
  `/private/tmp/claude-501/-Users-tranben-Downloads-interiorflow/b779779b-76b3-4e9c-ba44-69dbf50c46a5/scratchpad/ho-so-mau.zip`
  (bản đã giải nén cạnh đó: `…/scratchpad/ho-so-mau-mo/` — mở `index.html` soi trực tiếp; script sinh: `…/scratchpad/tao-goi-mau.ts`).
  Ruột kiểm thật: 6 kênh viewer+deck+boq+3 ảnh · `"vang":["pdf"]` · 0 chuỗi giao thức web trong index.html · manifest version 1, provenance interiorflow.

## 4 · Quyết định + lý do

1. **Manifest nhúng trong viewer KHÔNG chứa entry của chính index.html** (gà–trứng sha): viewer nhúng kênh tầng ②③; `manifest.json` cuối mới mang đủ cả entry viewer (sha thật). Test khoá cả hai.
2. **`buildHoSoSong` (bytes) tách khỏi `packHoSoSong` (Blob)** — hợp đồng phiếu giữ nguyên `Promise<Blob>`, bản bytes để test/script node soi ruột không cần Blob→ArrayBuffer vòng vèo.
3. **BOQ tóm tắt truyền riêng (`boqTomTat`)** — viewer không thể đọc xlsx; bảng đọc-được đi kèm file chuẩn ngành, không thay nó.
4. Toast mượn kênh `present:idfp-export-done` thay vì thêm prop/event mới — giữ đúng trần MỘT file điểm cắm.

## 5 · CHƯA LÀM — nói thẳng [T0]

- **Kênh PDF trong gói**: `exportDeckToPdf` hiện `doc.save()` thẳng xuống đĩa, KHÔNG trả Blob — muốn gói PDF phải sửa `lib/present-editor/export.ts` (CẤM theo phiếu, chỉ GỌI). Viewer ghi rõ kênh vắng "pdf". → đề xuất T.
- **Chưa nghiệm thu mắt trên app thật** (mở browser bấm nút): phiếu cấm dev server; đường code là các engine đã có + tsc/test sạch, nhưng xong-MÁY ≠ xong-MẮT — cần lượt duyệt mắt (T mở gói mẫu + một lượt bấm thật trên app khi có server).
- **BOQ xlsx trong gói KHÔNG kèm ảnh vật liệu** (BoqScreen có nạp ảnh matId trước khi xuất; handler này bỏ khâu nạp ảnh cho gọn v0 — bảng số + công thức SUM vẫn đủ).
- Gói mẫu dùng `boqXlsx` fixture 8 byte (đánh dấu trong script) — xlsx thật chỉ sinh được qua `/api/boq` trên app chạy.
- Entry registry `goi-ho-so-song`: KHÔNG đụng (T flip sau audit, đúng ⑧).

## 6 · Khuôn 2 giá trị (§1c)

- **① Kiến trúc app** [tính năng]: `.zip` 3 tầng thoái lui là ĐÍCH mới của một nguồn [T1] — ruột `.idfp` nhập lại được nghĩa là gói không bao giờ là ngõ cụt định dạng (bài học Adobe); sha256 cho kiểm toàn vẹn không cần app. [giao diện]: một mục menu trong cửa xuất sẵn có, không màn mới.
- **② Vận hành/giá trị IF** [tính năng]: KTS giao khách MỘT file — khách mở index.html xem ngay, kỹ thuật mở xlsx/ảnh, máy đọc JSON; hết cảnh PDF/ảnh/bảng rời thất lạc lẫn nhau. [giao diện]: viewer tone be/mực đọc như bìa hồ sơ, khai thật kênh vắng — người nhận không bao giờ tưởng nhầm gói đủ.

## 7 · Điểm chạm biên → đề xuất lên T

1. **`export.ts` cần biến thể trả Blob** (vd `exportDeckToPdfBlob` hoặc option `{ output: 'blob' }`) để gói đủ kênh PDF — additive, 1 hàm, ngoài vùng phiếu này.
2. **Route `/api/boq` phụ thuộc server chạy** — bản Electron offline thuần cần đường tính BOQ client-side nếu muốn gói BOQ khi không có server (liên chặng, cấp T).
3. Khi mở phiếu `.idfc`/Story Set: viewer này có thể thành MẶT TIỀN chung cho "xem gói" (Story Set 6 chương xuất cùng khuôn zip 3 tầng) — đừng đẻ viewer thứ hai.
