# LANE B — MASTER LIBRARY CÓ NỘI DUNG THẬT (22/08)

## LANE B: PASS

Kệ **Cấu kiện (.idfc)** đi từ **0 món → 73 món**, mỗi món truy được về một tệp có thật trong repo,
thumbnail là ảnh `.svg` thật, và cột thông số lộ ra **các mặt của cùng một danh tính**.

| Kiểm | Kết quả |
|---|---|
| `npx tsc --noEmit` (file Lane B) | **0 lỗi** |
| `npm test` (mã thoát) | **0** |
| `lib/idfc-seed/seed.test.ts` | **20 pass · 0 fail** |
| Ảnh nghiệm thu | `artifacts/visual-review/L1-ke-co-hang.png` · `L2-mot-vat-nhieu-mat.png` |

> ⚠️ Chạy `npx tsc --noEmit` toàn repo lúc 10:28 có **2 lỗi ở `components/render-studio/ToolWindow.tsx`**
> (`moiTruongChoDefType`, `getDefinition` chưa khai). Tệp đó **sửa lúc 10:27:58 bởi một lane khác đang
> chạy song song**, nằm ngoài vùng ghi của Lane B và Lane B không import nó.
> Lọc theo đường dẫn Lane B (`lib/idfc-seed` · `components/library` · `scripts/seed-*`): **0 lỗi**.
> Lượt tsc ngay sau khi Lane B sửa xong (trước 10:27) là **0 lỗi toàn repo**.

---

## ⓪ ĐO TRƯỚC — HIỆN TRẠNG THẬT (đúng / sai / thiếu so với phiếu)

| Phiếu nói | Đo được | Phán |
|---|---|---|
| `public/cad-library/manifest.json` — 54 block `.dxf` | **54 block, 108/108 tệp (.dxf + .svg) có thật trên đĩa**, 0 tệp hỏng | ✅ đúng |
| `lib/cad/workstation-clusters.ts` `CLUSTER_SPECS` **20 mục** | **6 mục** (`spine-l · bench-row · cluster-y · cluster-120 · cluster-cross · meeting-table`) | 🔴 **phiếu sai số** |
| `lib/cad/idfc.ts` — định dạng `.idfc` | v3, 12 `IdfcKind`, vỏ `meta` + ruột `body` (union) | ✅ đúng |
| `uploads/` — tài sản thật | 1.775 tệp, trong đó 17 `minhhoa_*` | ✅ có, **nhưng KHÔNG phục vụ công khai** — chỉ ra được qua `/api/library/{id}/file` (cần bản ghi DB). Xem "đã bỏ" bên dưới |
| `prisma/schema.prisma` `LibraryAsset` · `ProductSpec` | có thật; `ProductSpec.matId` **CHƯA migrate** (comment `:498` tự khai) | ✅ đọc, không chạm |
| Kệ `common-idfc` | đọc `idfc-store` (IndexedDB per-máy) ⇒ **máy mới = 0 món** | 🔴 gốc bệnh kệ rỗng |
| `BUILTIN_ITEMS` (`shelves.ts`) | **12 dòng cho đúng 1 kệ** (`cad-kyhieu`), 20 kệ còn lại rỗng | 🔴 12 dòng chữ đứng trước 54 block thật |
| `lib/cad/materials.ts` `MATERIALS` | **13 preset vật liệu 2D** thật (hatchPattern/scale/angle/color) | ✅ |
| Kệ `cad-clusters` | có trong `BAY_OF_SHELF` nhưng **không có trong `STAGE_SHELVES`** — kệ mồ côi | 🟡 ghi nhận, chưa xử (ngoài phạm vi lượt này) |

**Chốt đo:** vấn đề KHÔNG phải "thiếu nội dung" — nội dung đã nằm sẵn trong repo. Vấn đề là
**không có đường nào đưa nó lên kệ**. Nên lượt này không đi mua hàng, chỉ nối đường.

---

## NGUỒN THẬT ĐÃ DÙNG

| Nguồn | Số lượng | Dùng làm gì |
|---|---|---|
| `public/cad-library/manifest.json` + 54 `.dxf` | **54** | `body.geom2d.prims` — **parse thật** bằng `lib/cad/dxf.ts` `parseDxf()`, không gõ tay toạ độ nào |
| 54 `.svg` cùng thư mục | **54** | ảnh xem trước thật (bậc (c) của `ItemThumb`) |
| `lib/cad/materials.ts` `MATERIALS` | **13** | `body.hatch2d` — ký hiệu 2D thật của vật liệu |
| `lib/cad/workstation-clusters.ts` `CLUSTER_SPECS` | **6** | `body.geom2d.prims` sinh bằng hàm với tham số mặc định |
| `lib/cad/hatch.ts` `OPENING_STANDARD_HEIGHT_MM` | 2 hằng | `geom3d.heightMm` — **chỉ** cho cửa/cửa sổ |
| `lib/materials/pbr-from-category.ts` | — | PBR **suy** cho vật liệu, luôn gắn nấc `inferred` |

Giấy phép đi kèm từng món: **CC0 — tài sản gốc của dự án InteriorFlow** (chép từ `manifest.json`).

---

## SỐ MÓN LÊN KỆ — theo `kind`

| kind | Số | Từ đâu |
|---|---|---|
| `furniture` | 28 | phòng khách 7 · phòng ăn 5 · phòng ngủ 8 · văn phòng 8 |
| `fitout` | 16 | cửa 6 · cây cảnh 3 · cầu thang 2 · cột 2 · xe 2 · ký hiệu 1 |
| `material` | 13 | `MATERIALS` |
| `millwork` | 11 | bếp 5 + 6 cụm bàn |
| `fixture` | 5 | vệ sinh |
| **Tổng** | **73** | bỏ qua 0 |

Trên app thật: cột kệ hiện **73**, chân tấm ghi *"73 mục trong kệ Cấu kiện (.idfc)"*.

---

## MỘT VẬT — NHIỀU MẶT: bằng chứng

**Món: `BLK-ARCH-DOOR-SINGLE` — "Cửa đi 1 cánh"** (ảnh `L2-mot-vat-nhieu-mat.png`)

Cột thông số hiện, dưới **MỘT** danh tính:

```
CÁC MẶT CỦA MÓN NÀY   [ Mặt 2D ] [ Mặt 3D ] [ Ảnh xem trước ]
Danh tính              BLK-ARCH-DOOR-SINGLE
Nguồn                  /cad-library/cua/arch-door-single.dxf
Giấy phép              CC0 — tự do sử dụng/sửa/phân phối
Độ tin cậy · geom2d    measured
Độ tin cậy · kichThuoc measured
Độ tin cậy · cao       inferred
```

· **mặt 2D** = `body.geom2d.prims`, parse từ chính tệp `.dxf` đó → `measured`
· **mặt 3D** = `body.geom3d.heightMm = 2100`, lấy từ `OPENING_STANDARD_HEIGHT_MM` → `inferred`
  (dải chuẩn ngành, **không phải** số đo của món này — nên không được nhận `measured`)
· **mặt ảnh** = `.svg` thật cùng thư mục

**Không phải nhãn khai tay.** `matBieuDienCua()` (`lib/idfc-seed/index.ts`) **đọc ra** danh sách mặt
từ chính dữ liệu: mặt 2D chỉ hiện khi `prims.length > 0`, mặt 3D chỉ hiện khi có `heightMm`/`pbr`/`matId`,
mặt thương mại chỉ hiện khi có `commerce`. Test `[8c]` `[8d]` khoá đúng điều này ⇒ **không có cách nào
khoe một mặt mà đằng sau trống**.

**Không nhân bản danh tính:** một `.idfc` = một `meta.code`. Test `[2]` khoá không trùng mã;
test `[9a]` khoá `tronKhoMam()` không nhân đôi khi studio nhập bản cùng mã — **bản studio đè bản
đi-kèm-bản-cài**, không ngược lại (người dùng sửa được thứ app phát cho).

---

## ĐÃ BỎ KHẲNG ĐỊNH GIẢ NÀO

| Bỏ gì | Vì sao |
|---|---|
| **Giá / dữ liệu thương mại** | Repo **không có** nguồn giá cho 73 món này ⇒ **0 món mang `commerce`**. Test `[6]` chặn cứng: món mầm mọc giá là test đỏ. Một con số bịa ở đây đi thẳng vào báo giá gửi khách. |
| **Số lượt dùng / "Trending" / "Phổ biến"** | Không có lịch sử dùng thật ⇒ **không dựng dòng nào**. Không bịa số, cũng không hiện ô "—" giả vờ sắp có. |
| **`geom3d` cho món không phải cửa** | Repo chỉ có số cao thật cho cửa/cửa sổ. 67 món còn lại **không có mặt 3D** — và giao diện nói đúng như vậy, không vẽ chip "Mặt 3D" cho có. |
| **Nấc `verified`** | Kho mầm **không tự phong** "người đã duyệt". Test `[5b]` chặn. Chưa ai duyệt mắt thì nấc cao nhất là `measured`. |
| **Nấc tin cậy thứ tư** | Đúng 3 nấc `measured / inferred / verified`. Test `[5a]` chặn. |
| **`uploads/minhhoa_*` (17 ảnh)** | Định đưa lên kệ, rồi **bỏ**: `uploads/` không phục vụ công khai (chỉ qua `/api/library/{id}/file`, cần bản ghi DB mà lượt này bị chặn ghi DB). Trỏ URL vào đó là **dựng món trỏ vào hư không**. 17 ảnh này vốn đã lên kệ `Ảnh & tài sản` qua đường `LibraryAsset` sẵn có. |
| **Kho thứ hai** | `lib/idfc-seed` **không** là kho mới: món là đúng `ParsedIdfc`, chảy qua đúng kệ `common-idfc` cũ, đúng `ItemThumb` cũ, đúng cột thông số cũ. Không thêm kệ, không thêm route, không thêm bảng. |
| **Món trỏ vào tệp không tồn tại** | Script `existsSync` từng tệp; parse ra 0 hình thì **bỏ món**. Test `[3b]` kiểm lại mọi đường dẫn public. Lượt này bỏ 0. |

---

## ĐÃ LÀM — tệp

**Mới**
- `scripts/seed-library-idfc.mjs` — sinh kho mầm từ 3 nguồn thật. Chạy: `node scripts/seed-library-idfc.mjs`
- `lib/idfc-seed/seed.generated.ts` (243 KB, sinh tự động — không sửa tay)
- `lib/idfc-seed/types.ts` — `SeedProvenance` (gia phả) + `MatBieuDien` (các mặt)
- `lib/idfc-seed/index.ts` — `tronKhoMam` · `matBieuDienCua` · `giaPhaCua` · `anhXemTruocCua` · `laKhoMam`
- `lib/idfc-seed/seed.test.ts` — 20 khẳng định, chặn 4 tội bịa
- `scripts/seed-library-chup.mjs` — chụp nghiệm thu trên app thật

**Sửa**
- `components/library/LibrarySheet.tsx` — `idfcItems` đi qua `tronKhoMam()`; món mầm gắn `imageUrl`
  (`.svg` thật); chip lọc phạm vi nay lọc theo đúng `scope` từng món; thêm mục **"Các mặt của món này"**
  + nguồn + giấy phép + độ tin cậy trong cột thông số
- `components/library/library-sheet-css.ts` — `.spmat` / `.spmatchip` (chip chữ, không icon trần,
  không màu riêng — phổ màu đã mang nghĩa đỏ/vàng/xanh)

**Không chạm:** `prisma/schema.prisma` (chỉ đọc) · `app/api/**` · `components/home|nav|studio/**` ·
`lib/site|voice|auth/**`. Không chạy `prisma migrate` / `db push`. Không `git` gì.

---

## CHƯA CHẮC / CHƯA KIỂM

1. **Phân loại `kind` là CHỌN, không phải đo.** `IdfcKind` có 12 loại và **không có loại cho ký hiệu
   bản vẽ**. Cầu thang · cột · xe · ký hiệu · cây cảnh đang xếp `fitout` + thẻ `ky-hieu-ban-ve`.
   Chúng **không phải hàng mua-bán** — bảng khối lượng mà đếm chúng thành đồ phải mua là sai.
   Cố ý **không** xếp thành `furniture` để lỗi này không im lặng. Cần Hoà chốt loại đúng.
2. **`BlockGroup` chỉ có 10 giá trị, không có nhóm trung tính** ⇒ cột · cây · xe · ký hiệu xếp
   `'Kiến trúc'` theo nhóm gần nhất. Là chọn, không phải phân loại đo được.
3. **PBR của 13 vật liệu là SUY** (`inferPbrFromCategory`, luôn `suyDoan:true`) — mới có
   `roughness` + `metallic`, chưa có trường PBR nào đo thật. Đã gắn `inferred` + thẻ `pbr:suy-doan`.
4. **Chưa thử kéo–thả một món mầm xuống bản vẽ.** `library-item-resolve.ts` có nhánh `via:'idfc'`
   đọc `body.geom2d` — trên lý thuyết chạy được, **chưa chạy thật lần nào** trong lượt này.
   Đây là rủi ro lớn nhất còn lại: kệ đầy mà kéo không xuống thì vẫn là kệ vẽ.
5. **Chỉ chụp ở 1440×900, theme sáng, 1 trình duyệt (Chromium headless).** Chưa soi theme tối,
   chưa soi khổ hẹp, chưa thử trình đọc màn hình cho mục "Các mặt".
6. **Chưa kiểm ảnh hưởng hiệu năng.** `seed.generated.ts` 243 KB nạp tĩnh vào bundle client
   (`LibrarySheet` là `'use client'`). Chưa đo bundle trước/sau, chưa thử tách `dynamic import`.
7. **Kệ `cad-clusters` vẫn mồ côi** (có trong `BAY_OF_SHELF`, không trong `STAGE_SHELVES`).
   6 cụm bàn hiện đứng ở kệ `common-idfc` — đúng chỗ, nhưng kệ mồ côi kia chưa ai dọn.
8. **20 kệ khác vẫn rỗng** (`cad-sheet` · `cad-room` · `cad-hatch` · `present-*` · `common-brand` …).
   Lượt này cố ý làm **trọn một kệ** thay vì rải mỏng — thà một kệ thật còn hơn năm kệ vẽ.
9. **`ProductSpec.matId` chưa migrate** nên chưa món mầm nào nối được sang mặt thương mại thật.
   Đó là lý do thật của "0 món có `commerce`", ngoài lý do "repo không có bảng giá".
10. **Số 73 chưa qua mắt Hoà.** Xong-máy, chưa xong-mắt.
