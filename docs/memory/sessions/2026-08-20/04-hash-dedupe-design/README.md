# 04 · THIẾT KẾ HASH/DEDUPE cho LibraryAsset — trả lời 5 câu Hoà đặt TRƯỚC khi đụng schema

> 20/08. Human gate: schema chỉ đổi sau khi Hoà duyệt bản này. Mọi con số dưới đây ĐO TẠI NGUỒN
> trong phiên, không chép sổ.

## Dữ kiện đo được (nền cho mọi câu trả lời)

| Dữ kiện | Bằng chứng |
|---|---|
| `ProjectFile.contentHash` đã có, = **sha256 hex của binary gốc** | `app/api/project-files/_lib/luu-file.ts:63` `bamContentHash(buf)` · `schema.prisma:662` |
| `LibraryAsset` KHÔNG có cột hash, CÓ `userId` | `schema.prisma` model LibraryAsset |
| Kho 1613 asset thuộc **3 user**: 1538 · 74 · 1 | groupBy userId trên dev.db thật |
| **Trùng nội dung ĐÃ tồn tại trong kho**: "Ảnh PDF trang 15 — Westlake" ×7, "detech-ref-z8026160" ×2 (heuristic name+size) | query dev.db 20/08 |
| **File chết đã tồn tại**: asset weekly-image trả 410 (file mất khỏi đĩa) | ca D5 Golden Loop QA 20/08 |
| License/provenance sống trong `tags`: `license:` + `nguon:` (chuỗi tự do) | `lib/library/gallery-tags.ts:42-43` |

## ① Hash BINARY GỐC hay normalized?

**BINARY GỐC (sha256 raw bytes) — dùng lại đúng hàm `bamContentHash` của ProjectFile, không viết hàm thứ hai.**
- Normalized (re-encode, bỏ EXIF) phá tính kiểm chứng: hash không còn xác minh được đúng file trên
  đĩa — mất luôn công dụng "phát hiện file hỏng/mất" (ca 410 vừa xảy ra là ca thật cần nó).
- "Cùng ảnh khác encode/resize" là bài **tìm-tương-tự** (perceptual hash), KHÔNG phải bài định danh —
  hai câu hỏi khác nhau, trộn vào một cột là trộn hai nghĩa (đúng bệnh từ-đa-nghĩa). Perceptual để
  sau, nếu làm thì là cột/hệ khác (nối vision-backbone).
- Đồng bộ định nghĩa hai đầu: ProjectFile đã hash binary gốc ⇒ LibraryAsset cùng định nghĩa thì
  promote so trực tiếp `pf.contentHash === asset.contentHash`, 0 chi phí tính lại.

## ② Scope dedupe: user / org / global?

**PER-USER (userId + contentHash).**
- Đo thật: asset mang `userId`, 3 user đang sở hữu riêng. **Dedupe global = rò tài sản chéo user**:
  user B upload trùng bytes với asset của user A thì được "dùng chung" hàng của A — sai quyền.
- Org CHƯA tồn tại trong schema (grep orgId/studioId = 0 trên model asset) — không thiết kế trước
  cho thứ chưa có (đúng bài ArchiNote 07/08). Khi có org model thì nới scope là additive.

## ③ Provenance/license khác nhau — có dedupe không?

**KHÔNG dedupe im lặng.** License/nguon nằm trong `tags` của MỘT hàng — gộp hai nguồn khác license
vào một hàng là một license đè/mất license kia, đúng loại rủi ro LICENSE-NOTES đang canh (bài GPL).
- Luật v1: chỉ auto-dedupe khi **cùng userId + cùng contentHash + cùng lớp `license:`**. Khác
  license/provenance ⇒ tạo hàng mới, khai thẳng "trùng bytes nhưng khác nguồn" (có thể hiện badge
  cho người quyết gộp tay sau).
- Đây chính là lý do **UNIQUE(hash) trần không bao giờ diễn đạt được đúng luật nghiệp vụ** — ràng
  buộc DB không biết license.

## ④ Backfill 1613 asset cũ?

**Backfill được, nhưng kết quả sẽ KHÔNG sạch — và đó là dữ liệu quý, không phải lỗi:**
- Đọc từng file trên đĩa → sha256 → điền cột. File **mất/chết (ca 410)** ⇒ hash để **NULL** — thêm
  một lý do cột phải nullable, và backfill report chính là **bản kiểm kê file chết** miễn phí.
- Trùng thật đã có sẵn (×7 Westlake) ⇒ backfill xong sẽ có nhóm cùng hash — **UNIQUE áp lúc này là
  fail ngay**. Report phải liệt kê nhóm trùng để người quyết gộp/giữ (đụng gu-đích/moodboard đang
  tham chiếu — không auto-merge).
- Thứ tự: schema push (human gate, Hoà chạy) → backfill script (đọc-tính-điền, không xoá gì, chạy
  được trong phiên) → report {đã hash n · file mất m · nhóm trùng k}.

## ⑤ Collision policy?

- sha256 đụng ngẫu nhiên ≈ 0 (không thiết kế cho nó). "Collision" THẬT của bài này là **cùng bytes
  nhưng khác nghĩa** (khác user · khác license) — xử ở ③②.
- Luật cứng: **hash trùng chỉ là TÍN HIỆU ỨNG VIÊN**, code application phải kiểm scope + license
  rồi mới coi là cùng vật. **Không bao giờ auto-merge hai hàng đã tồn tại** — dedupe chỉ áp lúc
  NHẬP (promote/upload tra trước khi tạo), hàng cũ trùng nhau là việc của người qua report ④.
- Race 2 promote song song: không cần UNIQUE để chặn — promote đã idempotent qua tag
  `nguon:projectfile:<id>`; ca hai NGUỒN khác nhau cùng bytes đua nhau thì tệ nhất là 2 hàng trùng,
  rơi vào đúng bucket ④, không mất dữ liệu.

## ĐỀ XUẤT CHỐT (khớp hướng Hoà nêu, thêm chi tiết đo được)

```prisma
// LibraryAsset — thêm:
contentHash String?            // sha256 hex binary gốc, cùng định nghĩa ProjectFile.contentHash
@@index([userId, contentHash]) // tra dedupe luôn scoped per-user ⇒ index composite, không index trần
```
1. **Nullable + index composite** `[userId, contentHash]` (không index hash trần — mọi lookup đều
   scoped, index trần là index sai câu hỏi).
2. **Dedupe application-level** tại cửa nhập (promote + saveLibraryAssetFromBuffer): cùng
   userId + hash + license ⇒ reuse assetId, append `nguon:` mới; khác ⇒ hàng mới.
3. **UNIQUE: nhiều khả năng KHÔNG BAO GIỜ thêm.** Kể cả sau audit sạch, UNIQUE([userId,contentHash])
   vẫn cấm ca hợp lệ "trùng bytes khác license". Chỉ xem lại nếu sau này license tách khỏi tags
   thành cột và vào được khoá. Ghi thẳng để phiên sau không "tiện tay" thêm.
4. Backfill sau push, kèm report kiểm kê (④).

## ⑦b CHƯA CHẮC
- Heuristic trùng đo bằng name+size, chưa hash thật — con số nhóm trùng thật chỉ biết sau backfill.
- Chưa đo bao nhiêu file mất trên đĩa (chỉ có 1 ca 410 làm bằng chứng tồn tại).

## ⑦c HẠN DÙNG
Hết hạn khi Hoà duyệt và schema push xong (chuyển thành phiếu backfill), hoặc khi org model ra đời (xét lại ②).
