# M-IDFC-OUT — p13 vòng 3: `.idfc` có nơi tiêu thụ + tấm MỘT thư viện 4 ngăn · 07/08 đêm

> Vùng: `lib/cad/idfc.ts` · `lib/materials/` · `components/library/` · `components/materials/`.
> **CHƯA COMMIT** (V6). Verify browser thật trên server 3000 (dùng lại theo memory
> dev-server-ports — server 3006 riêng dính §0aa 5 tiến trình chung `.next`). Mỗi kết luận 1 dòng
> file:dòng (N8). §0ab: mọi việc đều ĐO trước khi làm — 2/5 việc hoá ra đã xong, không làm lại.

## BẢNG CUỐI LƯỢT (§V7)

| Việc | Trạng thái | Số đo |
|---|---|---|
| 1 `.idfc` một tệp = một cấu kiện | ✅ XONG phần THIẾU (nơi tiêu thụ) — format P7 đã dựng, KHÔNG làm lại | nhập: 1 file tốt → "✓ Ghế bành Pelican · FJ-PEL-01", 1 file hỏng → lỗi CỤ THỂ "thiếu hoặc hỏng phần hình học 2D" ngay trên dòng; kệ đếm 0→**1**; cột thông số hiện **giá 120 000 000/cái đọc TỪ FILE** (Unit "cái" chỉ có trong file — DB cột Unit đang "—", chứng minh nguồn); xuất: nút "Xuất .idfc" chỉ hiện khi resolve được BlockDef |
| 2 Gộp thư viện MỘT tấm 4 ngăn | ✅ tầng NHÓM — cột kệ nay 4 ngăn Cấu kiện · Vật liệu · Node · Ảnh tham chiếu (+ ngăn tạm thứ 5, xem dưới) | ảnh chụp 2 ngôn ngữ (COMPONENTS/MATERIALS/NODES/REFERENCE IMAGES/TEMPLATES & DOCUMENTS · CẤU KIỆN/VẬT LIỆU/NODE/ẢNH THAM CHIẾU/MẪU & HỒ SƠ) |
| 3 Thẻ quá nhỏ (G-M19-01) | ✅ **ĐÃ LÀM TỪ TRƯỚC** (phiên "07/08 CHIỀU") — chỉ VERIFY, không code | đo code: `library-sheet-css.ts:152-155` (--lib-card-min 122/168/232) · tấm `min(960px…)` (:66) · `LibrarySheet.tsx:62-66` (localStorage `if-library-card-size`, mặc định md) — chụp đủ 3 nấc Small/Medium/Large |
| 4 Vật liệu chẻ ba vòng 2 | ✅ nối `surface` vào cột thông số ④ | "Roughness **0.45**" + thanh bar hiện từ pbr NHÚNG TRONG `.idfc`; Gloss "—" đúng (không clearcoat — KHÔNG suy 1−nhám, hai đại lượng vật lý khác nhau, N4) |
| 5 (nếu còn) G-A-01/04/05 · G-M18-02 | ⚪ KHÔNG đụng | G-M18-02 đụng `lib/three` — phiên 3D hoạt động trong ngày (ve3d-css sửa 16:25), đúng luật DỪNG; G-A-01 đã đóng thêm một nấc qua VIỆC 4 (nhám/bóng nay có nguồn); G-A-04/05 là việc SỬA MOCK — phiếu này cấm sửa mock |
| Verify vân | ✅ chụp TRƯỚC (cầu trơn xám) / SAU (vân gỗ dải + mắt gỗ rõ) | nạp qua đúng nút "Ảnh vân màu" (DataTransfer→input→change) |
| tsc | ✅ **0 lỗi** toàn repo | kể cả lỗi cũ `render-layer-index.test.ts` đã được làn khác sửa trong ngày |

## Chi tiết VIỆC 1 — sợi dây `.idfc` (G-M16-01→04 đóng phần lõi)

Đo trước (§0ab): `lib/cad/idfc.ts` (P7, 07/08 sáng) đã có ĐỦ format 4 mặt + version/migration +
23 test — cái THIẾU là **0 nơi tiêu thụ** (M-THU-VIEN-OUT hàng đợi V7 ghi rõ). Vòng này nối đúng
2 đầu dây đó, KHÔNG đổi `IDFC_VERSION`, không sửa format:

1. **NHẬP** — `components/library/BulkIngestMode.tsx`: nhận diện đuôi `.idfc` ("Cấu kiện IF"),
   parse THẬT ngay lúc thả (`importIdfc` + `lastImportIdfcError` — lỗi cụ thể hiện tại dòng,
   không đợi bấm nút), "Đưa vào kho" ghi vào **`lib/library/idfc-store.ts` (MỚI)** — kho studio
   localStorage, upsert theo `meta.code`, cùng mẫu `pbr-store.ts`; file hỏng KHÔNG vào kho.
2. **KỆ THẬT** — `LibrarySheet.tsx`: kệ mới `common-idfc` ("Cấu kiện (.idfc)", `shelves.ts:76`)
   đọc idfc-store (không phải mock `ITEMS_BY_SHELF`), đếm SỐ THẬT, nạp lại mỗi lần mở sheet/đổi
   mode. Cột thông số ④ ưu tiên `commerce` TRONG FILE (giá đi theo file giữa dự án — đúng
   G-M16-03 "③ Trình chiếu: giá·thông số"), thiếu mới rơi về khớp sku DB.
3. **XUẤT** — nút "Xuất .idfc" ở cột thông số (`LibrarySheet.tsx`, cạnh "Sửa bản sao"): gói
   ① geom2d từ `BlockDef` thật (`resolveLibraryItem` — nút CHỈ hiện khi resolve được, không hứa
   suông) + ② geom3d = PBR của matId=code nếu kho `pbr-store` có + ③ commerce từ spec khớp sku →
   tải file `<code>.idfc`. MỘT CHIỀU giữ nguyên (ràng buộc 1 idfc.ts — không có đường ghi ngược).

Tiến độ (nhánh 5 của G-M16-04): vẫn CHỜ `model Task` (K4, phiếu P1) — đúng ràng buộc 3 idfc.ts.

## Chi tiết VIỆC 2 — 4 ngăn (G-M16-02 đóng tầng NHÓM)

`lib/library/shelves.ts`: `ShelfBay`/`BAYS`/`BAY_OF_SHELF` — kệ hiện có xếp vào 4 ngăn chốt;
`LibrarySheet.tsx` cột kệ render theo ngăn (kệ vẫn TỰ LỌC THEO CHẶNG — ngăn là tầng nhóm hiển
thị, không phải tầng dữ liệu; kệ "Văn phòng · Cụm bàn" giữ tính chất sinh-lúc-chạy, xếp vào ngăn
Cấu kiện).
- ⚠️ **Ngăn tạm thứ 5 "Mẫu & hồ sơ"** cho 8 kệ template (khung tên/form/mẫu trang/brand/theme) —
  chốt 4 ngăn không gọi tên nhóm này, tôi KHÔNG tự bịa cách xếp. **Cần Hoà xếp**: nhét vào ngăn
  nào, hay chốt thành ngăn thứ 5 chính thức?
- ⚠️ G-M3-15 (54 block `.dxf` chưa hiện trong Thư viện) thuộc phiếu **p2** — `docs/M-BOQ-OUT.md`
  CHƯA tồn tại lúc đo. Tôi KHÔNG đụng phần nạp block (tầng dữ liệu của ngăn Cấu kiện chừa sẵn chỗ
  cho p2 đổ vào). Gộp `NodeLibraryPanel`/`LibraryPanel` vào tấm (phần còn lại của "gộp HẾT") là
  việc kiến trúc lớn hơn — chưa làm, ghi treo.

## CHƯA VERIFY / còn treo
- Kéo-thả 1 cấu kiện `.idfc` từ kệ xuống bản vẽ (đường `LIBRARY_INSTANTIATE_EVENT` — chuỗi nghe
  bên CadEditor, ngoài vùng; món idfc mang kind 'block' nên đi đường có sẵn, CHƯA bấm thử).
- Nút "Xuất .idfc" đã render đúng điều kiện (resolve DOOR-S-800 được) nhưng file tải xuống nằm
  trong sandbox browser — CHƯA mở lại file XUẤT THẬT để round-trip (đã round-trip bằng file tự
  dựng đúng schema; export dùng cùng `exportIdfc` đã có 23 test round-trip của P7).
- Ngăn tạm "Mẫu & hồ sơ" chờ Hoà xếp (trên).
- Dọn sạch sau verify: `if.library.idfc.v1` + `if.materials.pbr.v1` trên origin 3000 = null (đo).

## File đụng vòng này
| File | Việc |
|---|---|
| `lib/library/idfc-store.ts` (MỚI) | kho cấu kiện studio |
| `lib/library/shelves.ts` | kệ `common-idfc` + `BAYS`/`BAY_OF_SHELF` |
| `components/library/BulkIngestMode.tsx` | nhập `.idfc` thật + lỗi tại dòng |
| `components/library/LibrarySheet.tsx` | cột kệ 4 ngăn · kệ idfc đọc kho thật · spec ưu tiên commerce file · surface từ pbr (VIỆC 4) · nút Xuất .idfc |

Không đụng: `lib/cad/idfc.ts` (đo xong thấy đủ — không sửa format) · `lib/cad` hình học ·
`lib/boq` · `prisma` · `lib/three` · mock.
