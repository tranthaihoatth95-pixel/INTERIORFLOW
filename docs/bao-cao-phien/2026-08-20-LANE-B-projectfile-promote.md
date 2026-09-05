# LANE B — `ProjectFile` + Promote E2E (20/08, night shift)

## ⓪ TIỀN ĐỀ — đo lại tại nguồn, KHÔNG chép từ phiếu

| Tiền đề phiếu | Đo được | Kết luận |
|---|---|---|
| HEAD `c7f3ac8`, main | `git log --oneline -1` → `c7f3ac8` | ✅ đúng |
| `ProjectFile` có thật trong dev.db | `prisma.projectFile.count()` → **0 rows**, chạy OK | ✅ đúng |
| `ProjectFile` 0 caller runtime | `ls app/api/` — không có `project-files` | ✅ đúng |
| `ProjectAssetUsage` API đã LIVE | `app/api/project-asset-usage/{route.ts,[id]/route.ts}` có thật; test sibling 10/10 PASS | ✅ đúng — KHÔNG sửa |
| Dedupe theo `contentHash` | 🔴 **`LibraryAsset` KHÔNG CÓ cột hash** (`schema.prisma:282-321`) | ⛔ không dedupe được — xem ⑦b |

**Tiền đề hạ tầng ⓪b**: `git rev-list --count HEAD..main` = 0 (đang ở chính main). Server 3001
khởi động **20/08 00:54**, `node_modules/.prisma/client` sinh **20/08 00:23** ⇒ server **CÓ** model
mới, **không dính** bẫy 503-delegate-cũ đã ghi ở `project-asset-usage/route.ts`. Không kill/restart.

## ① VIỆC ĐÃ LÀM

**File MỚI (7) — không sửa một dòng nào ngoài vùng sở hữu:**

| File | Vai |
|---|---|
| `app/api/project-files/route.ts` | `POST` upload thô · `GET ?projectId=` list |
| `app/api/project-files/[id]/route.ts` | `DELETE` xoá mềm |
| `app/api/project-files/[id]/promote/route.ts` | `POST` Promote (chỉ lo phiên + quyền + mã lỗi) |
| `app/api/project-files/_lib/luu-file.ts` | sniff MIME + ghi `./uploads` + sha256 |
| `app/api/project-files/_lib/guard.ts` | `loiJson` · `kiemDelegate` · `FILE_SELECT` dùng chung |
| `lib/server/promote.ts` | **lõi Promote** — transaction, idempotency, provenance |
| `lib/server/promote.test.ts` | integration test DB thật, 16 assertions |

`git status` xác nhận **0 file ngoài vùng** bị đụng. Không `git add/commit/push/stash`.

## ② CÁC QUYẾT ĐỊNH + LÝ DO

**a) KHÔNG gọi `saveLibraryAssetFromBuffer` khi upload** — [Đ2] đã nhìn vào trong, kết luận là
*không dùng được*, không phải *chưa tìm*. Ba lý do đo được: ① nó **tạo `LibraryAsset` ngay trong
thân** ⇒ dùng ở bước upload là tạo asset TRƯỚC Promote, phá thẳng contract; ② nó
`isRasterImageKind()` ⇒ **từ chối PDF**, mà PDF là đúng một trong hai ca chính (`usage:'brief'`);
③ nó không trả `contentHash`. **Thứ được REUSE nguyên**: `UPLOAD_DIR ./uploads` ·
`LIBRARY_MAX_BYTES` 25MB · `sniffKind`/`SNIFFED_MIME` · `LIBRARY_USAGES` · khuôn tên file. Không
đẻ thư mục lưu thứ hai.

**b) Promote KHÔNG copy file** — `LibraryAsset.path` trỏ vào ĐÚNG `ProjectFile.path` đã có trên
đĩa. Copy là hai nguồn sự thật cho một vật, và trái luật *bản gốc bất biến, dẫn xuất trỏ về gốc*
(`smart-ingest`). Hệ quả đã ràng: `DELETE` tệp thô là xoá **mềm**, **không** unlink file — unlink
sẽ giết một asset có thể đang được N project khác dùng.

**c) Transaction** — `LibraryAsset` + `ProjectAssetUsage` sinh trong MỘT `prisma.$transaction`.
Nếu asset sinh mà usage hỏng thì project mất dấu tệp của mình *và* asset đã mang tag "đã promote"
⇒ chạy lại cũng không sửa được. Đó là trạng thái kẹt transaction sinh ra để chặn.

**d) Provenance = tag có sẵn, không chế cú pháp mới** — `buildGalleryTag('nguon', …)`
(`gallery-tags.ts:60`), `nguon:` vốn nhận chuỗi tự do ⇒ tag = `nguon:projectfile:<id>`. Kèm
`license:user`.

**e) Vai = `'bim'`, KHÔNG phải `'editor'`** — tsc bắt ngay: repo **không có** vai `editor`; thang
là `viewer(0) < bim(1) < drafter(2) < crea(3) < owner(4)` (`access-policy.ts:16`). `'bim'` = nấc
GHI thấp nhất. Đọc (`GET`) dùng `'viewer'`.

**f) `_lib/guard.ts` chứ không export helper từ `route.ts`** — Next 14 validate danh sách export
của `route.ts`; export thêm hàm thường ở đó là lỗi kiểu lúc build. (Bản đầu tôi làm sai đúng chỗ
này, tsc chưa kịp bắt thì đã tự sửa.)

**g) Promote lại = 200 lặng lẽ, không 409** — khác có chủ ý với `POST /project-asset-usage` (ở đó
gắn hai lần là 409). Promote **phải idempotent**: bấm lại không được báo lỗi, chỉ không nhân bản.

## ③ NGHIỆM THU

- `npx tsc --noEmit` → **0 lỗi**.
- `lib/server/promote.test.ts` → **16/16 PASS**. Phủ đủ chuỗi phiếu yêu cầu: upload → list →
  promote → LibraryAsset sinh ra → **ProjectAssetUsage tự tạo** → promote lại không nhân bản →
  soft-delete. Cộng thêm 4 ca ngoài yêu cầu: PDF→`brief` · usage gỡ mềm rồi promote lại (hồi sinh
  đúng hàng, không đụng composite unique) · 1 asset dùng ở 2 project · promote tệp đã xoá → 404.
- **DB SẠCH, đếm trước = đếm sau**: `ProjectFile 0=0` · `LibraryAsset 1613=1613` ·
  `ProjectAssetUsage 0=0`. Đĩa cũng sạch: 2 file test ghi ra `./uploads` đã `unlink`.
- Test sibling `project-asset-usage/route.test.ts` → **10/10 PASS** (không regress).
- **curl trên 3001** (read-only, không restart): cả 3 route trả **401 `{"error":"unauthorized"}`**
  ⇒ đã mount + compile sạch (lỗi biên dịch sẽ ra 500/HTML).

## ④ KHÔNG LÀM ĐƯỢC / CÒN NỢ

1. 🔴 **Dedupe theo `contentHash`: KHÔNG LÀM.** `LibraryAsset` không có cột hash; phiếu cấm đổi
   schema. **Đã cân và BÁC** phương án nhét hash vào `tags`: `tags` là CSV free-text không index
   ⇒ quét O(n) (~1.6k hàng), và `contains` còn khớp nhầm tiền tố. *Dedupe sai nguy hiểm hơn không
   dedupe* — nó gắn nhầm project A vào asset của project B. ⇒ cần cột `contentHash` + index trên
   `LibraryAsset` bằng một phiếu schema riêng.
2. ⚠️ **Upload chỉ nhận PNG/JPEG/WEBP/GIF/AVIF/PDF** — đúng thứ `sniffKind` nhận ra. DWG/DXF/XLSX
   chưa nhận (415 kèm lý do rõ). Nới ra là quyết định AN TOÀN (nới whitelist magic-bytes hoặc
   nhận binary không nhận diện được), không làm lén trong phiếu này.
3. ⚠️ **`category` mặc định = `usage`** — `LibraryAsset.category` là chuỗi tự do, kho đang có **11
   giá trị khác nhau** (đo 20/08), không có vocabulary chuẩn để suy. Thà lấy `usage` còn hơn bịa
   một nhãn tiếng Việt nghe-có-vẻ-đúng. UI (Lane C) nên truyền giá trị thật.
4. **BROWSER-PENDING** — chưa gọi được đường có phiên. `curl` chỉ tới được cửa 401; UI thuộc
   Lane C. Cần một lượt duyệt mắt: upload thật → promote → asset hiện trong Thư viện.

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- **Chưa chạy một lần nào qua route thật CÓ PHIÊN.** Mọi khẳng định về hành vi DB đến từ test gọi
  `promoteProjectFile()` trực tiếp + mô phỏng đúng thân handler upload. Nhánh `assertProjectAccess`
  trong 3 route **chưa thực thi lần nào** — chưa có bằng chứng 403 rơi đúng chỗ.
- **Nhánh `url` của POST chưa chạy lần nào.** `isFetchableImageUrl` được reuse nhưng nó là bộ lọc
  cho **ẢNH**; dùng cho tệp thô nói chung có thể chặn nhầm PDF từ URL. Chưa đo.
- **Chưa đo hiệu năng `tags contains`** khi bảng lớn. Ở 1.6k hàng thì không thấy; đây là scan.
- **Ca đua (race)**: hai lượt Promote CÙNG một ProjectFile chạy song song có thể cùng vượt qua
  bước tra tag ⇒ sinh 2 asset. Không có unique constraint nào chặn. Chưa kiểm, và không chặn được
  đúng cách nếu không có cột thật.
- **`prisma.$transaction` với SQLite** — chưa kiểm hành vi rollback bằng một ca lỗi cố ý; chỉ tin
  vào đường thành công.
- Chỉ chạy trên `dev.db` một máy; chưa thử đồng thời với phiên khác đang ghi.

## ⑦c HẠN DÙNG KẾT LUẬN

- Kết luận **"server 3001 không dính bẫy 503"** chỉ đúng với tiến trình đang chạy (start 00:54).
  Restart/regenerate là phải đo lại.
- Kết luận **"không dedupe được"** hết hiệu lực ngay khi `LibraryAsset` có cột `contentHash` —
  lúc đó phải quay lại `lib/server/promote.ts` thay cả cơ chế idempotency (bỏ tag, dùng cột).
- Con số `LibraryAsset 1613` là ảnh chụp 20/08; các lane khác đang ghi song song.
- Ranh giới vai `'bim'` gắn với `ROLE_RANK` hiện tại; đổi thang vai là phải rà lại 3 route.
