# Trinh sát 02 — FILE MANAGER + STORAGE + FORMAT ROUTER (nguyên văn báo cáo agent, 19/08)

## 1. `/files`

### 1.1 Cây file
`app/files/page.tsx:32-60` (vỏ AppShell) · `_components/HaiNgan.tsx:53-158` (2 tab) ·
`_components/NganPhanTho.tsx:94-174` · `_lib/ngan-tho.ts:137-158` (`locMonTho`) ·
`components/filemanager/FileManagerShell.tsx:125-773` (thân chính) · `FilesNavigator.tsx` ·
`FmContextMenu.tsx` · `lib/filemanager/real-fs.ts` (FS Access thật) · `local-state.ts`
(localStorage comment + upload stub) · `queries.ts` (cây thư mục thuần) · `types.ts:46-64`
(`FmFile`) · `mock-data.ts:13-17` (đã rút ruột — 3 export rỗng) · `selection.ts`.

### 1.2 Upload đi đâu — FS Access ghi ĐĨA NGƯỜI DÙNG. Không DB, không ./uploads/
- `runUpload()` `FileManagerShell.tsx:378-402` → `writeFileToRoot` (`:387`) →
  `real-fs.ts:113-127` (getFileHandle create + createWritable) — thư mục gốc chọn ở Cài đặt
  (`loadRootFolderHandle` từ `lib/root-folder.ts`).
- **0 lời gọi fetch trong FileManagerShell.tsx.**
- Ghi đĩa lỗi (`unsupported|no-root|no-permission|io`, `real-fs.ts:19-23`) ⇒ fallback bản ghi
  phiên localStorage `interiorflow.filemanager_g4.local_state_v1` (`local-state.ts:10,82-98`),
  id `up-*`, mô tả tự khai "chưa ghi ổ đĩa — bản mock".
- Ba nguồn chồng nhau (`:175-182`): `filesInFolder()` (luôn rỗng — `queries.ts:48-50`) +
  `state.uploaded` + `realFiles`; file đĩa thắng bản trùng tên.

### 1.3 Metadata/status
`FmFile`: id/folderId/name/ext/kind/sizeBytes/addedById/addedByName/source/lifecycle/
thumbnail?/description/matId?/brand?/price?.
- `lifecycle = 'nhap'|'chinh_thuc'|'luu_tru'` (`types.ts:20`) — badge `:74,:707` nhưng **mọi
  nguồn gán cứng `'nhap'`** (`FileManagerShell.tsx:346`, `local-state.ts:91`); 0 đường chuyển.
- `kind` suy từ ĐUÔI tên (`kindFromName` `local-state.ts:44-60`; tự khai "chỉ icon/badge,
  KHÔNG phải Gateway thật" `:56-57`).
- `addedByName` gán cứng 'Bạn' (`:343`), `source:'local'` (`:344`), description câu tĩnh (`:347`).
- Không createdAt/modifiedAt; `lastModified` đọc (`real-fs.ts:146`) rồi VỨT (`:336-349`).

### 1.4 Inspector/preview
- Panel `.insp` có (`:639-755`). **Preview KHÔNG có thật**: `:703` chỉ in chữ đuôi file.
- Grid thumb = cặp màu gradient (`types.ts:57-58`); file đĩa không bao giờ set ⇒ PLACEHOLDER
  (`:85-90`).
- Tab Mô tả/Bình luận (`:720-725`); bình luận localStorage (`local-state.ts:77-80`).
- Ô matId/Hãng/Giá (`:709-715`) — không nguồn nào set ⇒ ô chết.
- Nút "Mở trong InteriorFlow" `:750-752` — **không có onClick, nút câm**.
- Vòng dung lượng: `storageByRoot()` trả toàn 0 (`queries.ts:69-71`) ⇒ ring luôn 0%.

### 1.5 Actions (đo thật)
CÓ: tải lên (folder rw) · đổi tên · tải xuống · xoá (confirm) · chọn nhiều ⌘/shift/mũi tên ·
tìm+lọc kind · grid/list nhớ localStorage · bình luận cục bộ.
KHÔNG: "Mở trong InteriorFlow" (không handler) · tạo thư mục (không tìm thấy handler) ·
di chuyển file giữa folder · **promote → Thư viện**.

### 1.6 Ngăn ② "Phần thô dùng chung"
- Fetch `/api/specs` (`NganPhanTho.tsx:103`) + `loadPbrMap()` localStorage (`:115`).
- "Thô" = mặt `dung3d` chưa `du` (từ ba-mat) — `ngan-tho.ts:137-158`; không cờ DB (`:9-14`).
- **Chỉ đọc, 0 action** (chỉ nút "Đọc lại" `:129-140`); nói "thêm thông số rồi lên Thư viện"
  (`:93-94`) nhưng không có nút làm việc đó.

## 2. `/library/ingest` (`app/library/ingest/page.tsx`, 374 dòng)
- Nhận `image/*,.pdf,.xlsx,.xls,.csv,.dxf,.dwg` (`:292`); `add()` `:89-97` → `ingestFile`.
- Ghi: `saveManifest` autosave (`:85-87`) → `refingest.ts:177-179` → `createStudioBlobStore
  ({route:'/studio-ref-manifest'})` → **IDB** `interiorflow-sheets` khoá
  `studio::/studio-ref-manifest`. Hydrate trước đọc (`:75-82`).
- Xuất: 2 file JSON tải về máy (`:324-325`) — không upload đâu cả.
- Fetch trong file: `/api/vision/caption` :107 · `/api/strategy/scenarios` :135 ·
  `/api/illustration` :155 · (gián tiếp) `/api/pdf/extract` `refingest.ts:130`.
  **KHÔNG có POST /api/library — grep 0.** ✅ claim UX đúng.
- Route sống (link từ `LibraryPanel.tsx:241`); `BulkIngestMode.tsx:44-48` tự khai phần AI
  Strategist VẪN ở trang này, chưa gộp ⇒ **hai đường ingest song song**.

## 3. `app/api/library/**`
| Route | Chức năng |
|---|---|
| GET /api/library (`route.ts:12-41`) | TẤT CẢ asset mọi user, deletedAt null, sort createdAt desc, **không phân trang** |
| POST /api/library (`:55-105`) | tạo LibraryAsset |
| POST /api/library/clip (`clip/route.ts:16-65`) | clip ảnh từ web |
| DELETE /api/library/[id] | xoá MỀM (deletedAt), file đĩa GIỮ |
| GET /api/library/[id]/file | trả bytes, sniff lại mime mỗi lần |

### POST chi tiết
auth :56 · body {name,category,tags,dataUrl,usage,palette,caption,content,w,h} · bắt buộc
name/category/dataUrl `data:` · trần 25MB (413) · **`sniffKind(buf)` magic bytes thật** :74 →
`isRasterImageKind` :75 — **CHỈ PNG/JPEG/WEBP/GIF/AVIF** (`mime-sniff.ts:15,28`; PDF nhận ra
nhưng bị loại) · mime lưu từ sniff :81 · file `uploads/` tên random
`${ts36}_${rand6}.${ext}` :84 — **phẳng, không thư mục con/user/project**.

### Clip route — lệch chính sách
**KHÔNG sniff magic byte** — tin content-type remote (`:32-33`)/prefix dataUrl (`:27`);
server fetch URL https? tuỳ ý **không allowlist** (`:29-30`); `sourceUrl` nhét vào caption
chuỗi "Nguồn: …" (`:57`); tên `clip_*`.

### Dedupe/contentHash — KHÔNG CÓ
Grep contentHash|sha256|createHash|checksum|dedup: 0 trong app/api + schema. (Hit khác domain:
partContentHash idfc, checkSumAdjustment font.) `uploads/` có **1616 mục**.

## 4. Prisma `LibraryAsset` (`schema.prisma:278-314`) — 19 cột
id(cuid) · userId · name(cắt 120) · category(tự do) · **tags CSV một chuỗi** · mime(sniff) ·
path(tên file trong uploads/) · usage(default ref-render, 7 giá trị) · palette(JSON hex) ·
caption(≤400) · content?(chữ PDF ≤20000) · w/h · createdAt · updatedAt · rev · deletedAt ·
lastEditedBy · lastEditedDevice · relation user (Cascade). **Index DUY NHẤT `@@index([deletedAt])`**
— không index userId/usage/createdAt trong khi GET findMany toàn bảng.
**0 cột provenance/origin/hash/projectId/sizeBytes/folderId.** `imgId` dẫn xuất
`imgIdFromKey(id)` tại ranh giới API (cố ý không migrate — comment :279-284).

### `gallery-tags.ts` — 7 namespace ký sinh 1 cột
4 prefix chuẩn (`:40-45`): `nganh:`(5 giá trị) · `license:`(cc0|unsplash|studio|ai|user) ·
`nguon:`(tự do — **không được chứa dấu phẩy** :87-89) · `bosuutap:`(nhiều giá trị). + 3 prefix
khác cùng cột: `shelf:` `thumb:` `code:` (`db-items.ts:12,75`). Chuỗi thật:
`seed-library-minh-hoa.ts:163`. `splitTags` :61 **lowercase mọi tag** ⇒ URL nguồn bị hạ chữ —
**docstring :77 ("giữ nguyên hoa/thường") lệch code**. Gate `canJoinCollection` :101-103.

## 5. `lib/refingest.ts`
- `classify()` :56-63 — **thuần MIME + đuôi, KHÔNG magic byte**: image/pdf/excel/cad/other.
  Là bộ nhận diện THỨ HAI độc lập Gateway và kindFromName ⇒ **3 taxonomy song song**.
- image: dataURL → `makeThumb(360, jpeg .68)` :79-89 → palette; pdf: /api/pdf/extract;
  excel/cad/other: chỉ metadata.
- Callers: `ingestFile()` chỉ 1 caller thật (`ingest/page.tsx:93`); 3 nơi khác chỉ mượn `USAGES`.
- Kết quả: IDB manifest — **không đường nào sang LibraryAsset/DB**.

## 6. Format Router `lib/gateway/**`
- `GatewayFormat` 23 giá trị (`detect.ts:12-35`); `FORMAT_CAPABILITIES` đủ 23 entry.
- **Magic byte CÓ** (`byMagicByte` :105-118): PNG/JPEG/GIF/BMP/WEBP/PDF/DWG("AC" 2 byte — dễ
  false positive)/ZIP-sniff (ifpack/pptx/xlsx :90-103). Magic thắng đuôi :121-133.
  ⚠️ sniffZipContents build chuỗi trên toàn bytes — caller nên slice (chỉ xlsx-parse làm đúng).
- Bảng capability 3 stage × 5 fidelity × import/export — **10/23 format hoàn toàn unavailable**;
  mức `'storage'` khai nhưng 0 entry dùng.
- `routeFormat` :40-47 chặn qua capabilityFor rồi STATIC_ROUTE 11 entry; RouteAction có
  `library-bulk-ingest` :20.
- **CALLERS THẬT: 5, không phải 1** — RenderIOMenus (:25-26,211,225 detect+route, 'render') ·
  MaterialImportWizard (:13-14,70-71 — KHÔNG truyền bytes ⇒ chỉ đuôi) · present Toolbar
  (:83-84,367,372) · CadEditor (:105-106,441,455-456; dòng 441 không bytes) · xlsx-parse
  (:19,47 — slice 8192, không routeFormat).
- `capabilityFor`/`canOperate`/`FORMAT_CAPABILITIES`: **0 caller production**.
- **Bypass hard-code**: `present-editor/Toolbar.tsx:268-273` "ĐẶC CÁCH GATEWAY" — bắt pdf
  TRƯỚC routeFormat vì bảng khai pdf/present=unavailable trong khi app nhập PDF được ⇒
  **bảng capability sai so với thực tế, đường vòng hard-code thay vì sửa bảng**.

## 7. Lifecycle RAW→UNDERSTOOD→PROMOTED — KHÔNG TỒN TẠI
`PROMOTED` 0 · `UNDERSTOOD` 0 · `promote*` 0 · `RAW` 2 hit (ảnh RAW máy ảnh —
`lib/images/smart-ingest.ts:10,166`) · `normalize` ~40 hit toàn chuẩn hoá chuỗi/số.
Gần nhất: `FmLifecycle` (chết) + `MatTrangThai du|chuaDu|chuaCo` (dẫn xuất, không phải trạng
thái file). Dòng chảy Files→cửa sổ→Thư viện nhắc 6 lần trong docstring, 0 dòng code.

## 8. Storage authority
### 8.1 `./uploads/` (ls)
1616 mục cấp 1 (jpeg 1515 · png 76 · jpg 22 · avif 1, phẳng, tên random/clip_/minhhoa_/ghe3d_)
+ `notebook/` RỖNG + `dna/<1 projectId>/`. **Không có .pdf nào** (nhất quán POST chặn PDF).
Ai ghi: api/library route :9,85 · clip :8,46 · notebook source :29 · `lib/dna/store.ts:7,21`
(dna/cards.json) · `lib/home/notes-store.ts:6,17` (home-notes/<userId>.json).
⇒ **4 hệ khác bản chất trộn 1 thư mục** (blob + JSON stores). Backup gộp: `backup-offsite.mjs:31,96-100`.

### 8.2 `disk-sync.ts` — KHÔNG liên quan Files/Library
Hạ tầng đảo nguồn cho CAD/Present: `resolveSourceOfTruth` :44-60 (TIE 2000ms; disk-incomplete
giữ cache) · `createDiskWriter` :80-122 (throttle 3-10s) · `watchProjectPresence` :145-196
(BroadcastChannel 4s/TTL 12s, chỉ cảnh báo). `/files` KHÔNG import nó — ghi đĩa trực tiếp,
không throttle/presence/so-nguồn.

### 8.3 IndexedDB — 5-6 DB
`interiorflow-sheets` (sheets + 4 studio blob routes) · `interiorflow-fonts` ·
`interiorflow-print-upscale` · HANDLE_DB (root-folder) · HANDLE_DB (auto-backup — trùng tên?
chưa chắc). 4 route ký sinh qua `createStudioBlobStore` khoá `studio::<route>`:
`/studio-idfc` · `/studio-colors` · `/studio-brand-kits` · `/studio-ref-manifest`.
`studio-persist.ts:26` — kho per-MÁY.

### 8.4 Cầu W0.3
Hydrate đầu: IDB trống + localStorage cũ có ⇒ dời sang IDB, bản cũ GIỮ NGUYÊN, idempotent.
4 khoá cũ: `if.library.idfc.v1` · `interiorflow.colorSources` · `interiorflow.brandKits`+
`brandKitActive` · `interiorflow.refManifest`.

### 8.5 localStorage còn lại (ngoài cầu)
`interiorflow.filemanager_g4.local_state_v1` (**bình luận người dùng không rebuild được**) ·
`…view_pref_v1` · `if.files.ngan_v1` · PBR map (`pbr-store`). Lớp rủi ro W0.3 sinh ra để đóng
nhưng FM không nằm trong đợt.

### 8.6 Tổng: 5 kho song song, 0 bảng ánh xạ
đĩa người dùng ↔ uploads+SQLite ↔ IDB sheets ↔ IDB phụ ↔ localStorage. Cùng một ảnh có thể
3 kho 3 id (`real-*`, cuid, `ref_*`).

## 9. Thumbnails
- Sinh thật DUY NHẤT: `makeThumb` refingest (chỉ /library/ingest, nằm trong IDB manifest).
- Server KHÔNG sinh (POST chỉ writeFile; GET file trả nguyên bản) ⇒ mọi nơi hiển thị tải ẢNH
  GỐC (db-items :96, GalleryLienNganh :216,348, BoqTable :344); giảm nhẹ = trần 240 món +
  Cache-Control 86400.
- "thumb" nơi khác không phải ảnh: FmFile.thumbnail cặp màu · LibraryItem.thumbnail cặp màu ·
  tag `thumb:<kind>` = loại khung vẽ giả lập (regex tiếng Việt, fallback 'paint').
- Preview /files: không có (chỉ in đuôi).

## 10. BẢNG VERIFY 10 CLAIM UX AUDIT
1 ingest không POST /api/library — **ĐÚNG** · 2 Format Router "1 caller" — **SAI** (5 caller
detect; đúng phần: xlsx-parse là caller duy nhất không routeFormat; capabilityFor mới 0 caller)
· 3 upload /files ghi đĩa FS Access — ĐÚNG · 4 "không metadata/status" — **LỆCH** (type có,
hành vi chết) · 5 "không inspector/preview" — **LỆCH** (inspector CÓ, preview KHÔNG) ·
6 chỉ ảnh raster — ĐÚNG (ngoại lệ clip không sniff) · 7 không dedupe/hash — ĐÚNG ·
8 không provenance — ĐÚNG (nhồi tags CSV) · 9 chưa lifecycle — ĐÚNG · 10 gallery-tags encode
nguồn/license — ĐÚNG.

### Bổ sung ngoài claim
Vòng dung lượng luôn 0 · nút "Mở trong InteriorFlow" câm · Gateway bypass hard-code · 3
taxonomy song song · 7 namespace tag · parseGalleryTags lowercase URL (lệch docstring) ·
GET không phân trang/index thiếu · clip SSRF-shaped · 2 đường ingest song song ·
**BulkIngestMode toast giả cho file không-idfc** (`:158-170` "Đã đưa N tệp vào kho — chờ chủ
studio duyệt" mà không ghi đâu cả).

## 11. CHƯA CHẮC (nguyên văn agent)
/api/specs chưa đọc · ba-mat/resolve chỉ đọc mặt tiền · sheets-persist chưa đọc
onupgradeneeded · root-folder HANDLE_DB hằng chưa đọc (5 hay 6 DB) · LibrarySheet/
GalleryLienNganh chỉ grep · db-items trần chưa đọc số · notebook source route chưa đọc ·
RouteAction sau detect chưa trace (ai implement library-bulk-ingest?) · dev.db root 0 byte —
DATABASE_URL chưa đọc ⇒ chưa đo mồ côi uploads↔rows · prisma/migrations chưa liệt kê.
