# PHIẾU ĐỢT 8 — MULTI-SHEET BƯỚC 3·4·5 (2026-08-03)

Tiếp `docs/nc/NC-13-multisheet-autodesk-2026-08-03.md` §4. Bước 1+2 XONG ở `8ebb16e`
(`Sheet`/`Viewport2D` trong `model.ts:844-885` · `sheet-migrate.ts` + test).

Hoà đã CHỐT 2 quyết định thiết kế (03/08 đêm) — không hỏi lại:

## Q1 · Offset gộp: KHÔNG dùng hằng số — tính theo bbox
Lý do (tra AutoCAD): model space đặt hình học ở TOẠ ĐỘ THẬT, dự án lớn dùng XREF chèn tại toạ độ
thật — không có "khoảng cách nhân tạo". Sheet cũ của IF không mang quan hệ không gian thật nên
buộc phải xếp, nhưng xếp theo KÍCH THƯỚC THẬT chứ không theo số cứng:

```
for mỗi sheet cũ (theo thứ tự tab):
   đo bbox thật của Doc sheet đó
   đặt kề sheet trước theo trục X
   khe hở = 20% cạnh X của bbox LỚN NHẤT trong cả bộ (tối thiểu 5 000mm)
```
Căn hộ 14m → gộp sát nhau; resort/khách sạn khối 120m → tự giãn. Không ai phải đoán con số.
Ghi `sourceSheetName` + offset đã áp vào mỗi Sheet sinh ra, để truy ngược được.

## Q2 · Tương thích: MỘT CHIỀU + sao lưu (đúng cách AutoCAD làm)
Tra được: *"AutoCAD is backward compatible, but not forward compatible"* — bản mới đọc file cũ,
bản cũ KHÔNG đọc file mới; escape hatch là "Save As bản cũ". Autodesk cũng chỉ đổi format 3-5 năm
một lần (2013-2017 chung format, 2018-2022 chung format), không nhỏ giọt hằng năm.

IF làm y vậy:
- Bản mới MỞ ĐƯỢC `.idf` cũ → tự chạy `sheet-migrate.ts`.
- Bản cũ KHÔNG cần mở được file mới. Không viết bộ chuyển ngược.
- **TRƯỚC KHI chuyển, tự lưu bản sao `<tên>_v1-cu.idf` cạnh file gốc** — file gốc còn nguyên,
  bản cũ vẫn mở được nó. Báo cho người dùng biết đã lưu ở đâu, KHÔNG lặng lẽ.
- `IDF_VERSION` bump MỘT LẦN cho cả đợt này. Không bump lắt nhắt.

---

# VIỆC

## D1 — SheetTabBar đọc `Sheet[]`, bỏ hoán store
`components/cad/CadSheets.tsx` — hiện mỗi sheet ôm nguyên `doc: Doc` + `past[]` + `future[]`
(dòng ~58-66), đổi tab thì HOÁN nội dung store. Đây là chỗ NGƯỢC LUẬT K1 (đẻ N nguồn).

Sau khi sửa: MỘT `Doc` duy nhất trong store, `Sheet[]` chỉ giữ metadata + `viewports`.
Đổi tab = đổi khung nhìn (pan/zoom tới `centerMm` của viewport), KHÔNG đụng `Doc`.
Undo/redo giờ là MỘT dòng lịch sử chung — đúng như AutoCAD (undo không theo tab).

## D2 — Gỡ trần 5 ở CẢ HAI chỗ
- `components/cad/CadSheets.tsx:53` `MAX_SHEETS = 5`
- `components/present-editor/PresentSheets.tsx:76` + 9 chỗ dùng (`slice(0, MAX_SHEETS)`,
  thông báo "bỏ N hồ sơ vượt trần", `max={MAX_SHEETS}`, `status=`…)
Gỡ hết. Sheet nay chỉ vài trăm byte metadata, không còn lý do chặn.
⚠️ `PresentSheets` là chặng Trình bày (deck slides) — cấu trúc KHÁC CadSheets, đọc kỹ trước khi
sửa, KHÔNG áp máy móc cùng một bản vá.

## D3 — Bump `IDF_VERSION` + đường nạp file cũ
- Nhận diện file cũ (có `sheets[].doc`) → sao lưu `<tên>_v1-cu.idf` → chạy `sheet-migrate.ts`
  → nạp bản mới. Báo trên UI: đã gộp N tờ, bản gốc lưu ở đâu.
- File mới ghi theo cấu trúc `Doc` + `Sheet[]`.
- Test: mở file cũ 5 sheet → đủ 5 Sheet, không mất entity nào, bbox không chồng nhau.

---

# RÀNG BUỘC
- Đây là việc động vào ĐỊNH DẠNG FILE người dùng lưu ra đĩa. Làm chậm, test dày.
- KHÔNG viết bộ chuyển ngược. KHÔNG giữ 2 định dạng song song.
- Làm D1 → báo cáo → mới sang D2, D3. Đừng làm một cục.
- Không đụng `lib/three/*` (chặng 3D vừa xong cửa hosted `d57067a`).

# NGHIỆM THU
- Mở file `.idf` CŨ thật (5 sheet) → 5 tờ hiện đủ, hình không chồng, bản sao `_v1-cu.idf` có thật.
- Tạo 12 tờ mới → không bị chặn, app không chậm rõ rệt.
- Sửa tường ở tờ 1 → sang tờ 2 thấy ĐỔI THEO (bằng chứng đã về một nguồn — luật K1).
- Undo sau khi đổi tab → hoàn tác đúng thao tác gần nhất, không loạn.
- `npx tsc --noEmit -p .` sạch · ghi hash vào `docs/SO-KIEM-TONG.md` (append-only).
