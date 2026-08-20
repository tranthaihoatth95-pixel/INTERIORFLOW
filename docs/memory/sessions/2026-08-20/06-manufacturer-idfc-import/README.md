# 06 · NGUỒN HÃNG → IDFC — phân loại LOOK INSIDE + thiết kế lát cắt dọc đầu tiên

> 20/08. Chỉ soi vùng liên quan (không audit toàn repo). Mọi dòng dưới đây ĐO TẠI NGUỒN trong phiên.

## 1 · Phân loại — REUSE nhiều hơn hẳn dự kiến

| Việc cần | Cái đã có | Bằng chứng | Loại |
|---|---|---|---|
| Bản ghi sản phẩm hãng | **`ProductSpec`** — `brand · sku · vendor · w/d/hUp · materials · finishes · colorHex · currency · unit · matId · imageAssetId · drawingBlock · raw` | `schema.prisma`; **10 hàng THẬT** đang sống: Muuto `MU-OUT-3S` · IKEA `IK-SOD-2S` · House of Finn Juhl `FJ-PEL-01` | **REUSE** |
| Danh tính nguồn ngoài (mã hãng ↔ vật trong IF) | **`ExternalRef`** — `system` chuỗi TỰ DO (cố ý không enum) + `@@unique([system, externalId])` + `@@index([entityType, entityId])`, hàm cầu `findExternalId`/`findCoreEntity`/`linkExternalRef` đã bật (`EXTERNAL_REF_TABLE_READY = true`) | `lib/integrations/external-ref.ts` · **0 hàng** (bàn trống, chưa ai dùng) | **REUSE** ⭐ |
| Nhiều cách thể hiện của MỘT sản phẩm (Plan/Front/Side/Section/Proxy3D/Detailed3D) | **`AssetRepresentation`** vừa soạn cho cửa duyệt 02 — `kind` chuỗi tự do · `payloadRef` · `truthLevel` · `provenance` · `verifiedBy` | `prisma/schema.prisma` (chờ Hoà push) | **REUSE** ⭐ |
| Chuỗi tệp → duyệt → thư viện | `ProjectFile` → `promoteProjectFile()` → `LibraryAsset` → `ProjectAssetUsage`, UI sống ở `/files` | `lib/server/promote.ts` · commit `922af7e`/`fc84a6b` | **REUSE** |
| Tải tệp từ URL ngoài, chặn SSRF | `isFetchableImageUrl` — chặn giao thức lạ · loopback · link-local · dải riêng; **cố ý KHÔNG kiểm đuôi tệp** ⇒ dùng được cho URL trang sản phẩm, chỉ khác chỗ kiểm content-type ở route | `lib/stock-photos.ts:107-125` · route mẫu `app/api/library/from-url/route.ts` | **EXTEND** (thêm nhánh cho phi-ảnh, KHÔNG viết guard thứ hai) |
| Đọc DWG/DXF | `lib/cad/dwg.ts` + `dwg-map.ts` (libredwg-web, có timeout/worker) | đang chạy thật ở đường nhập CAD | **CONNECT** (chưa nối vào đường sản phẩm) |
| Gói `.idfc` | `IdfcKind` 12 loại · `SELLABLE_KINDS` · `IDFC_MIGRATIONS` · body union theo kind | `lib/cad/idfc.ts` | **REUSE** |
| Nguồn gốc + giấy phép | thẻ `nguon:` · `license:` (chuỗi tự do, có bộ đọc) | `lib/library/gallery-tags.ts:42-43` | **REUSE** |

**NEW thật sự cần** (đã có bằng chứng phủ định): đúng **một** lớp điều phối `lib/capabilities/manufacturer-import.ts` —
nhận nguồn (URL · gói tệp · bộ tay) → dựng **PHIẾU ỨNG VIÊN SẢN PHẨM** → trình người duyệt → gọi các máy có sẵn ở trên.
Không có database hãng thứ hai, không có model mới, không có parser mới.

## 2 · Ba chốt thiết kế (MAIN quyết, có lý do)

**① `ExternalRef` là khoá danh tính hãng — KHÔNG thêm cột vào `ProductSpec`.**
`system='andreuworld'` + `externalId='<mã sản phẩm hãng>'` → trỏ tới `entityType='productspec'` + `entityId`.
Được cả ba thứ miễn phí: chống nhập trùng (unique), tra ngược, và thêm hãng mới **không phải migrate**
— đúng câu file đó tự khai. Đây là lý do §0v tách bảng cầu từ đầu; nay mới có người dùng.

**② Không đẻ cột identity mới trong lượt này.** §3 đòi *collection/family · variant · sourceUrl · sourceRevision ·
license · importedAt · verification*. Lượt đầu: `sourceUrl`/`revision`/`importedAt` đi qua `ExternalRef` +
thẻ `nguon:`/`license:`; `collection/variant` tạm nằm trong `ProductSpec.raw` (JSON gốc, đúng vai của nó).
Lý do: schema đang chờ Hoà chạy MỘT lệnh cho `contentHash` + `AssetRepresentation` — nhồi thêm cột vào
cùng lượt là tăng rủi ro cho lần chạy đó. Cột riêng (nếu cần) là phiếu sau, khi đã biết dùng thật ra sao.

**③ Mức sự thật ánh xạ thẳng vào `AssetRepresentation.truthLevel`, không đẻ thang thứ hai.**
§6 đòi 6 trạng thái; ta có sẵn `measured|inferred|verified` + `provenance` + `verifiedBy`:
· hãng cấp 2D thật ⇒ `measured` + `provenance` ghi rõ tệp gốc
· IF sinh 2D từ 3D của hãng ⇒ `inferred` + provenance `derived-from:<repId>` — **đây chính là điều
  "không được trình bản vẽ dẫn xuất như bản vẽ của hãng"**, và nó thành **dữ liệu máy đọc được**,
  không phải lời hứa trong tài liệu
· người kiểm và ký ⇒ `verified` + `verifiedBy` — theo đúng cửa duyệt 03 (chỉ chiều GÕ LẠI SỐ mới lên `verified`).

## 3 · Lát cắt dọc đầu tiên — phạm vi CỐ Ý HẸP
**1 sản phẩm, đường B (gói tệp hãng), không đường A (URL).** Lý do: đường URL đụng điều kiện truy cập của
từng hãng (§12 cấm mọi kiểu vượt rào) ⇒ phải đọc điều khoản từng nguồn trước, đó là việc pháp lý chứ không
phải việc code. Gói tệp do người dùng tự có sẵn thì không có câu hỏi đó. Đường A mở sau, khi đã chốt nguồn nào
cho phép tải máy.

## 4 · Trạng thái
🔶 **CHƯA THI CÔNG** — 3 lane đang chạy (trần 3 writer): Dựng ảnh · Kết xuất/Chuyển động · Bộ tư liệu sạch.
Phiếu này đã soạn xong, bắn ngay khi có chỗ trống.

## ⑦b CHƯA CHẮC
- Chưa mở thử một gói tệp hãng THẬT nào (chưa có tệp mẫu trong máy) ⇒ chưa biết `dwg.ts` đọc được block sản phẩm của họ tới đâu.
- `isFetchableImageUrl` mới đọc mã, chưa chạy thử với URL phi-ảnh.
- 10 hàng `ProductSpec` là dữ liệu mẫu cũ — chưa kiểm chúng có `.idfc`/representation nào kèm không.

## ⑦c HẠN DÙNG
Hết hạn khi lát cắt đầu chạy xong, hoặc khi Hoà chốt nguồn hãng cụ thể (lúc đó phần đường A phải viết lại).
