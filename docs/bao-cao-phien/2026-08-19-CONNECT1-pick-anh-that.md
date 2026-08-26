# CONNECT-1 — nối "Pick hình" Openverse/Unsplash thành lưu thật (19/08)

## ① Tiền đề
Xác nhận lại (không chỉ tin phiếu): `app/library/ingest/page.tsx` có `pickIllustrations()` gọi
`POST /api/illustration` (không phải `/api/stock-photos` như phiếu ghi tắt — đây là route thật
đứng sau, `app/api/illustration/route.ts`, nó tự gọi Openverse/Unsplash và cả `photoFromLink`/
`normalizeUnsplash` từ `lib/stock-photos.ts`). Kết quả set vào state `picks: Pick[]`, KHÔNG có
onClick nào ghi xuống `LibraryAsset` — xác nhận đúng: dead-end thật, `grep "POST /api/library"`
trong page cũ = 0.

Cửa ghi DB thật duy nhất: `POST /api/library` (`app/api/library/route.ts`), nhận `dataUrl` (base
64 client tự encode) — KHÔNG nhận URL ngoài. Ảnh Openverse/Unsplash là URL ngoài ⇒ cần đường mới.

⓪b: `git log -1` = `c7f3ac8` (main) — khớp. `app/library/ingest/page.tsx` có dirty hunk R6
(`ingestFile → classify → planUpload`, dòng ~89-105) — ĐÃ ĐỌC KỸ TRƯỚC KHI SỬA, giữ nguyên,
không đụng. Cảnh báo collision giữa phiên (peer báo dòng ~76-82 `hydrateRefManifest()`) — đã kiểm
lại: vùng sửa của tôi (Pick interface ~20-30, state ~70-72, `pickIllustrations`/`useIllustration`
~160-215, JSX render picks ~260-300) không chạm dòng 76-82. `grep -c "hydrateRefManifest"` = 1,
`grep -c "planUpload|classify"` = 1 (comment) — cả hai còn nguyên.

## ② Việc đã làm

**Server — cửa ghi mới, đi qua ĐÚNG MỘT hàm lưu:**
- `lib/server/library-save.ts` (mới) — tách `saveLibraryAssetFromBuffer()` ra khỏi
  `app/api/library/route.ts` (whitelist MIME magic-bytes + trần 25MB + ghi `./uploads` + tạo
  `LibraryAsset`, hành vi giữ nguyên 100% so với route gốc). Import RELATIVE (`./db`, `../img-id`,
  `./mime-sniff`) theo đúng quy ước test sucrase-node của `lib/server/*.ts` khác (không alias `@/`
  — alias làm `sucrase-node` không resolve được, đã tự bắt lỗi này khi chạy test lần đầu và sửa).
- `app/api/library/route.ts` — refactor POST để gọi `saveLibraryAssetFromBuffer` thay vì lặp lại
  logic (sniff/ghi file/prisma.create) tại chỗ. Test targeted + tsc xác nhận hành vi không đổi.
- `app/api/library/from-url/route.ts` (mới) — `POST { url, name, category, tags?, usage? }`: chặn
  SSRF bằng `isFetchableImageUrl()` (REUSE từ `lib/stock-photos.ts`, đúng hàm route
  `/api/stock-photos` action `link` đã dùng — không chế lại), server tự `fetch()` ảnh (timeout 15s,
  kiểm `content-type` bắt đầu `image/`, trần 25MB theo cả `content-length` lẫn buffer thật), rồi
  ghi qua `saveLibraryAssetFromBuffer`.

**Client — nút "Dùng ảnh này" thật, không toast giả:**
- `Pick` interface thêm `downloadLocation?: string` (Unsplash ToS: endpoint đếm tải — server
  `/api/illustration` đã trả field này từ trước, chỉ chưa được frontend giữ lại).
- `useIllustration(p, idx)`: bỏ qua pick `source==='reference'` (đã có sẵn trong Thư viện) và pick
  thiếu `url`; gọi `POST /api/library/from-url` với tag `nguon:<source>` +
  `license:<credit.license>` dựng qua `buildGalleryTag()` (REUSE `lib/library/gallery-tags.ts` —
  KHÔNG tự chế cú pháp tag mới, đúng chỉ đạo); nếu Unsplash và có `downloadLocation` thì ping
  `POST /api/stock-photos {action:'use'}` (REUSE, có sẵn từ trước — chỉ chưa ai gọi từ luồng này).
  Kết quả THẬT set vào `notice` (báo lỗi HTTP thật từ server nếu fail) — không có toast bịa.
- Nút mỗi thẻ pick (chỉ hiện với `source!=='reference'`) có 4 trạng thái thật:
  `idle → Dùng ảnh này` / `saving → Đang lưu…` (disabled) / `done → ✓ Đã vào Thư viện` (disabled,
  chặn lưu trùng) / `error → ↺ Thử lại`. State theo index (`picksSave: Record<number, SaveState>`)
  — reset về `{}` mỗi lần `pickIllustrations()` chạy lại (tránh state cũ dính sang lượt search mới).

**Test mới:** `lib/server/library-save.test.ts` — 2 nhánh bảo vệ chạy TRƯỚC khi chạm fs/Prisma
(trần 25MB · whitelist MIME magic-bytes reject non-image) + 1 khẳng định PNG hợp lệ không bị chặn
oan bởi trần size. 7/7 pass. KHÔNG mock fetch/Unsplash thật — nhánh ghi DB thành công không kiểm ở
đây (cần Prisma+uploads thật), khai rõ ở ⑦b.

**Openverse license lệch enum — cố ý, không sửa:** `GalleryLicense` chỉ nhận
`'cc0'|'unsplash'|'studio'|'ai'|'user'`. Openverse trả license thô kiểu `"BY 4.0"`/`"CC0"` —
`buildGalleryTag('license', p.license)` vẫn ghi tag `license:by 4.0` (chuỗi tự do, hợp lệ vì hàm
build không kiểm whitelist), nhưng `parseGalleryTags()` sau đó đọc field `license` ra `null` vì
không khớp whitelist (đúng luật N4 "thà null còn hơn bịa" đã có sẵn trong `gallery-tags.ts`).
KHÔNG mở rộng whitelist license — đó là quyết định thuộc `docs/hoa-noi/` (giấy phép chuẩn hoá),
ngoài scope phiếu này; tag vẫn LƯU ĐÚNG giá trị gốc, chỉ chưa được `parseGalleryTags` NHẬN DIỆN.

## ③ KHÔNG làm — "Đề xuất nguồn mới" ở Gallery
`lib/library/gallery-local-state.ts` (localStorage riêng máy, dead-end tương tự) — **CHƯA LÀM**,
để lại nguyên cho phiếu sau. Lý do: hết dư địa an toàn trong 1 lượt (route mới + refactor route cũ
+ UI mới đã chạm 3 file lõi cùng lúc trong repo có ~132 file dirty của các phiên khác đang chạy
song song — thêm một luồng ghi thứ hai (khác bảng/khác cơ chế persist hẳn — localStorage vs
Prisma) làm tăng rủi ro va chạm phạm vi mà không kiểm chứng kỹ được). Cần đọc trước khi làm:
`lib/library/gallery-local-state.ts` (93 dòng) — chưa đọc nội dung, chỉ biết tồn tại từ phiếu.

## ④ Nghiệm thu máy
- `npm run tsc` — pass, 0 lỗi.
- Test targeted: `lib/server/library-save.test.ts` (mới, 7/7) ·
  `lib/library/gallery-tags.test.ts` (27/27, không đổi) · `lib/stock-photos.test.ts` (13/13,
  không đổi) · `lib/server/mime-sniff.test.ts` (22/22, không đổi) — tất cả chạy lại sau refactor
  `app/api/library/route.ts` để xác nhận không đổi hành vi.
- `git diff --stat`: `app/library/ingest/page.tsx` +85/-3 (giữ nguyên hunk R6 —
  `grep -c "planUpload|classify"` = 1) · `app/api/library/route.ts` +12/-40 (rút gọn nhờ REUSE
  helper) · 2 file mới: `lib/server/library-save.ts`, `app/api/library/from-url/route.ts`,
  `lib/server/library-save.test.ts`.

## ⑤ BROWSER-PENDING (chưa mở trình duyệt trong phiên này)
Kịch bản kiểm tay khi có máy thật:
1. Vào `/library/ingest` → gõ từ khoá vào ô "Hình minh hoạ" (vd `warm minimalist bedroom oak`) →
   bấm "◆ Pick hình".
2. Với 1 thẻ nguồn **Unsplash** hoặc **Openverse** (không phải Reference): bấm "Dùng ảnh này".
   Kỳ vọng: nút chuyển "Đang lưu…" → "✓ Đã vào Thư viện"; banner `notice` hiện dòng thật
   `Đã lưu "<tên>" vào Thư viện.`
3. Mở `GET /api/library` (hoặc panel Thư viện trong app) → xác nhận asset mới xuất hiện, `tags`
   chứa `nguon:unsplash`/`nguon:openverse` + `license:<...>`, `category: 'reference'`.
4. Với pick Unsplash có `downloadLocation`: kiểm log server hoặc Network tab thấy 1 request
   `POST /api/stock-photos {action:'use'}` bắn kèm (không chặn UI nếu lỗi).
5. Bấm lại "✓ Đã vào Thư viện" lần 2 → phải disabled, không tạo bản ghi trùng.
6. Thử URL ảnh chết/404 (giả lập bằng cách sửa tạm `p.url` qua devtools) → kỳ vọng nút "↺ Thử lại"
   + banner báo lỗi thật (không phải "thành công giả").

## ⑥ Trả MAIN
- File sửa: `app/library/ingest/page.tsx`, `app/api/library/route.ts`.
- File mới: `lib/server/library-save.ts`, `app/api/library/from-url/route.ts`,
  `lib/server/library-save.test.ts`.
- Không đụng: schema Prisma, `lib/refingest.ts`, `lib/gateway/`, ownership/Project relation.
- KHÔNG git add/commit/push — theo luật.

## ⑦b Chưa chắc / chưa kiểm
- Chưa chạy app thật trên browser (xem ⑤) — mọi khẳng định về hành vi UI dựa trên đọc code +
  tsc pass, KHÔNG phải quan sát trực tiếp.
- Chưa kiểm CORS/Content-Type thật của ảnh Unsplash/Openverse khi server `fetch()` — giả định
  header `content-type: image/*` đúng chuẩn cả hai CDN (Unsplash Images CDN, Openverse tự phục vụ
  qua nguồn gốc rất đa dạng — Openverse trả `foreign_landing_url` khác `url`/`thumbnail`, có thể
  một số nguồn Openverse chặn hotlink hoặc trả content-type lạ khiến route từ-chối-hợp-lý, chưa
  test tay với ảnh Openverse thật).
- `content-length` header có thể thiếu ở một số CDN — route đã có fallback kiểm `ab.byteLength`
  sau khi tải xong (không tin tưởng tuyệt đối vào header), nhưng nghĩa là ảnh rất lớn vẫn tải hết
  về RAM trước khi bị từ chối (chấp nhận được ở quy mô 1 ảnh/lượt, chưa đánh giá dưới tải cao).
- "Đề xuất nguồn mới" ở Gallery (`lib/library/gallery-local-state.ts`) hoàn toàn CHƯA ĐỘNG —
  không rõ mức độ dead-end giống hệt hay khác cơ chế.

## ⑦c Hạn dùng kết luận
Kết luận "R6 hunk còn nguyên" và "peer collision không chạm vùng sửa" đúng tại thời điểm commit
`c7f3ac8` + trạng thái dirty lúc kiểm (19/08). Repo có ~132 file dirty từ nhiều phiên song song —
nếu phiên khác tiếp tục sửa `app/library/ingest/page.tsx` sau báo cáo này, cần đọc lại diff trước
khi tin các dòng số nêu trên.
