# 2026-08-20 · NGUỒN HÃNG → IDFC — lát cắt dọc đầu tiên (đường B: gói tệp)

> Phiếu: thi công lát cắt dọc đầu tiên theo bản thiết kế
> `docs/memory/sessions/2026-08-20/06-manufacturer-idfc-import/README.md` (đã đọc TRƯỚC khi viết
> dòng nào; ba chốt của nó được tôn trọng nguyên vẹn).

## ⓪ TIỀN ĐỀ — đã kiểm, không bác điều nào

| Giả định của phiếu | Kiểm tại nguồn | Kết |
|---|---|---|
| `ExternalRef` sống, hàm cầu đã bật | `EXTERNAL_REF_TABLE_READY = true`; bảng có thật trong `prisma/dev.db`, **0 hàng** | ✅ |
| `AssetRepresentation` đã có trong DB | `PRAGMA table_info` đủ 11 cột; **0 hàng**; delegate có trong Prisma client | ✅ |
| `ProductSpec` có 10 hàng thật | 10 hàng (Muuto · IKEA · House of Finn Juhl) | ✅ |
| `promoteProjectFile` là cửa ghi sẵn có | `lib/server/promote.ts` — dedupe hash · idempotent · transaction | ✅ |
| Vùng khoá: `components/library/**`, các lane đang chạy | **0 tệp nào trong vùng khoá bị chạm** | ✅ |

Mốc DB trước khi làm (đo bằng `sqlite3 prisma/dev.db`):
`ProjectFile 9 · LibraryAsset 1622 · ProjectAssetUsage 9 · AssetRepresentation 0 · ExternalRef 0 · ProductSpec 10`.

## ① ĐÃ LÀM GÌ

**Vùng ghi** (đúng phiếu, không tràn):

| Tệp | Vai |
|---|---|
| `lib/capabilities/manufacturer-import.ts` | lớp điều phối **THUẦN** — phân loại tệp · đọc kích thước · đọc mã · dựng PHIẾU ỨNG VIÊN · mức sự thật · dựng `.idfc` · khoá danh tính hãng |
| `lib/capabilities/manufacturer-import-apply.ts` | **nửa ghi** — áp quyết định của người duyệt: promote · `ProductSpec` · `AssetRepresentation` · `linkExternalRef` |
| `lib/capabilities/manufacturer-import.test.ts` | 8 nhóm khẳng định, khoá ba luật cứng |
| `app/api/manufacturer-import/_lib/goi.ts` | lấy sự thật phía máy chủ (bản ghi `ProjectFile` + chữ PDF qua `unpdf`) |
| `app/api/manufacturer-import/route.ts` | **cửa dựng phiếu — 0 dòng ghi** |
| `app/api/manufacturer-import/apply/route.ts` | **cửa ghi — chỉ chạy khi có quyết định người** |
| `lib/integrations/external-ref-core.ts` | +1 literal `'productspec'` vào `ExternalEntityType` (additive, **không** migrate — đúng lý do §0v để nó là chuỗi) |

**Không đẻ cái nào trong số này**: model mới · cột mới trong `ProductSpec` · thang mức-sự-thật thứ
hai · cửa ghi `LibraryAsset` thứ hai · parser mới · database hãng thứ hai.

## ② BA LUẬT CỨNG — thành MÁY, không phải lời hứa

1. **CẤM BỊA.** Không mã thật ⇒ `ma = null`, tên rơi về `"Ứng viên sản phẩm"`, `sku` trong DB để
   **NULL**. Mã chỉ nhận khi đứng sau nhãn rõ (`Art. no` · `SKU` · `Mã sản phẩm` · `Model`);
   `IMG_20260820_1130.png` **bị từ chối** (test [2]). Hãng không suy từ tên tệp.
2. **Chuẩn hoá ≠ vẽ lại.** `doiVeMm` chỉ nhân hệ số **nguyên** (mm×1 · cm×10 · m×1000) ⇒ mm→mm trả
   về chính con số đó. **Inch bị TỪ CHỐI** (quy đổi 25,4 là làm tròn = đổi kích thước của hãng) —
   để trống + cảnh báo bắt người duyệt gõ lại.
3. **Dẫn xuất mang cờ.** `dungRepGoc` ⇒ `measured` + provenance ghi tệp gốc. `dungRepDanXuat` ⇒
   **luôn `inferred`** + `provenance.derivedFrom = "derived-from:<repId>"`, và test khoá luôn cả
   *"máy không tự ký `verified`"*. Đây là câu "không trình bản vẽ dẫn xuất như bản vẽ của hãng"
   biến thành dữ liệu.

Thêm một thứ máy làm được mà tài liệu không làm được: **`.idfc` TỪ CHỐI dựng khi thiếu hình học**,
thay vì suy một hộp chữ nhật từ w×d — suy hộp là vẽ lại sản phẩm, và cái hộp đó sẽ đi tiếp vào bản
vẽ như thể là hình của hãng.

## ③ CHẠY THẬT — dev server :3001, gói tệp PLACEHOLDER tự tạo

Gói thử **tự dựng bằng byte** (PNG 2×2 + PDF một trang có chữ) — ⛔ không tải gì từ mạng, không
dùng thương hiệu thật. Phiên đăng nhập: ký JWT bằng `AUTH_SECRET` của repo cho user có sẵn.

| Bước | Kết quả thật |
|---|---|
| Nạp 2 tệp qua cửa Files sẵn có | 200 · 2 `ProjectFile` |
| Dựng phiếu **không khai tay** | `hang: null` · `ten: "Ứng viên sản phẩm"` · `neoDuocDanhTinh: false` · 6 cảnh báo · mã đọc được từ nhãn `Art. no:` |
| Dựng phiếu **có khai tay** | đủ 7 mục · `kichThuoc {1200,800,750}` từ `W1200 D800 H750 mm` · xuất xứ truy được từng ô |
| **Huỷ** | `daGhi: false` — **0 dòng ghi**, đếm DB không đổi |
| **Nhận** | `ProductSpec` 1 · `LibraryAsset` 1 (qua promote) · `AssetRepresentation` 2 (`image` + `datasheet`, cả hai `measured`) · `ExternalRef` 1 (`placeholder-workshop` / `PH-CHAIR-01` → `productspec`) |
| **Nhận lần hai** | `specDaCo: true`, **không đẻ bản ghi thứ hai** — đúng chỗ `@@unique([system, externalId])` trả công |

**Dọn sạch:** đã xoá toàn bộ hàng vừa sinh + 2 tệp trong `uploads/`. Đếm lại **trùng khít mốc đầu
phiên**: `ProjectFile 9 · LibraryAsset 1622 · ProjectAssetUsage 9 · AssetRepresentation 0 ·
ExternalRef 0 · ProductSpec 10`.

## ④ VERIFY

- `npx tsc --noEmit` → **0**.
- `lib/capabilities/manufacturer-import.test.ts` → **8 nhóm PASS**.
- Toàn bộ `lib/capabilities/*.test.ts` (7 tệp) → **PASS**.
- Hàng xóm bị đụng: `external-ref.test.ts` **12/12** · `promote.test.ts` **22/22** · `idfc.test.ts`
  **44 pass 0 fail**.
- Chạy thật qua API :3001 (không restart, không git, không prisma).

## ⑤ TRẢ MAIN — bảy dòng

| Chặng | Trạng thái | Lý do một dòng |
|---|---|---|
| **Package entry** | **LIVE** | `POST /api/manufacturer-import` nhận gói `ProjectFile` có thật của một dự án; id client gửi đều tra lại, sai dự án/đã xoá thì khai thẳng. |
| **Parse** | **PARTIAL** | Ảnh + PDF chạy thật (chữ PDF qua `unpdf`, mã theo nhãn, kích thước mm/cm/m). **DWG/DXF BLOCKED** — hai cửa cùng đóng: `luu-file.ts` chỉ nhận whitelist `sniffKind`, và `lib/cad/dwg.ts` đọc DWG bằng **Web Worker** nên không chạy ở máy chủ. |
| **Normalize** | **LIVE** | Chỉ đổi đơn vị bằng hệ số nguyên · chuẩn tên/danh mục/siêu dữ liệu; inch bị từ chối thay vì làm tròn; test khoá "mm→mm không đổi số". |
| **Review** | **LIVE** | Phiếu đủ 7 mục · bốn nút Nhận/Sửa/Giữ một phần/Huỷ, **không có mặc định**; cửa dựng phiếu và cửa ghi là hai route tách hẳn ⇒ không thể có promote im lặng. |
| **IDFC** | **PARTIAL** | `dungIdfcTuPhieu` dựng + round-trip qua `importIdfc` khi CÓ `geom2d` của hãng (test [7]); không có hình học thì **cố ý từ chối**. Hình học chỉ đến từ DWG/DXF — đang BLOCKED, nên đầu-cuối chưa ra `.idfc`. |
| **Library** | **LIVE** | Qua `promoteProjectFile` (cửa ghi duy nhất) + `AssetRepresentation` cho từng cách thể hiện; **không nhân bản `LibraryAsset`**; nhập lại cùng gói không đẻ hàng thứ hai. |
| **Provenance** | **LIVE** | `truthLevel` + `provenance` JSON cho từng thể hiện · `ExternalRef` neo `(hãng, mã)` · `ProductSpec.raw` giữ bộ sưu tập/biến thể/giấy phép/nguồn/ai gõ lại ô nào. |

## ⑥ ĐỀ XUẤT BƯỚC KẾ (không tự làm)

1. **Mở cửa DXF** — một phiếu AN TOÀN riêng: nới `mime-sniff` cho DXF (ASCII, không script) +
   một đường đọc DXF chạy được ở máy chủ. Đây là **điều kiện duy nhất** để IDFC lên LIVE.
2. **Giao diện cửa duyệt** — hiện đang là API trần; tầng trình bày Thư viện đang khoá chờ bản vẽ
   native của Hoà, nên cố ý chưa dựng mặt.
3. **Đường A (URL hãng)** — vẫn để đóng cho tới khi Hoà chốt nguồn nào cho phép tải máy.

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- **Chưa mở một gói tệp HÃNG THẬT nào.** Toàn bộ chạy thật dùng PDF/PNG tôi tự dựng byte. Datasheet
  thật có bố cục cột, bảng, nhiều đơn vị lẫn lộn — khuôn đọc mã/kích thước hiện tại **chắc chắn sẽ
  bắt hụt**, và tôi không biết hụt bao nhiêu phần trăm.
- **PDF ảnh quét chưa thử.** `unpdf` sẽ trả chữ rỗng; đường lùi (báo "phải gõ tay") có code nhưng
  chưa chạy qua một tệp quét thật.
- **Không đo hiệu năng.** Gói 20 tệp PDF lớn đọc tuần tự — chưa biết mất bao lâu, chưa có timeout.
- **Chỉ thử với 1 sản phẩm, 2 tệp.** Ca nhiều biến thể cùng mã, ca hai người nhập song song cùng
  `(hãng, mã)` (đua ghi) chưa thử; `linkExternalRef` idempotent nhưng `ProductSpec.create` thì có
  thể đẻ hai hàng nếu hai lượt chạy chen nhau trước khi hàng đầu được neo.
- **`giu-mot-phan` và `sua`** đã có code + đi qua tsc nhưng **chưa chạy thật qua API** (chỉ chạy
  `huy` và `nhan`).
- Việc mở rộng `ExternalEntityType` không cần migrate là **suy từ schema** (cột `entityType String`)
  + đã chạy thật một hàng — nhưng chưa ai rà xem có nơi nào đang `switch` trên union đó và sẽ
  thiếu nhánh mới.

## ⑦c HẠN DÙNG KẾT LUẬN

- Mọi kết luận về **Parse** hết hạn ngay khi mở được một gói tệp hãng thật đầu tiên — lúc đó phải
  đo lại tỷ lệ đọc trúng, và rất có thể phải viết lại phần đọc kích thước.
- Dòng **IDFC = PARTIAL** hết hạn khi cửa DXF mở; lúc đó phải chạy lại đầu-cuối chứ không suy.
- Bảng vùng-khoá và mốc đếm DB đúng cho **20/08**; phiên sau phải tự đo lại, không chép số này.
