# PHUONG-AN-CAU-IDF — cầu dữ liệu IF ↔ ArchiNote qua `.idf`, viết bởi COWORK-PHU (06/08/2026)

**Ràng buộc phiên này:** repo `ttt-tasks` (code ArchiNote thật) KHÔNG được mount — chỉ đọc được
`docs/ARCHINOTE-MAP.md` (khảo sát sẵn, 06/08) + `lib/cad/idf.ts` (đọc trực tiếp trong phiên này).
Mọi điều không kiểm chứng được từ 2 nguồn này gắn nhãn **CHƯA VERIFY**, không suy đoán.

## 1. `.idf` hiện chứa gì — đọc trực tiếp `lib/cad/idf.ts`

```ts
// lib/cad/idf.ts:122-131
interface IdfFile {
  idfVersion: 2;                 // IDF_VERSION, dòng 25
  meta: {
    projectName: string;
    createdAt: string;           // ISO 8601
    modifiedAt: string;
    appVersion: string;
  };
  sheets: IdfSheetData[];        // { id: string; name: string; doc: Doc }
}
```

Đặc điểm quan trọng cho việc thiết kế cầu nối:
- **JSON thuần** (`idf.ts:2`), không zip/binary — dễ đọc/ghi từ app khác (kể cả không có toolchain
  CAD), thuận lợi cho ArchiNote (app điện thoại, không cần hiểu `Doc` đầy đủ để ĐỌC field mới).
- **Có sẵn cơ chế migration versioned** (`IDF_MIGRATIONS`, `idf.ts:72-97`) — bump `IDF_VERSION` +
  viết 1 hàm nâng cấp `fromV → fromV+1` là pattern đã chứng minh dùng được (v1→v2 đã làm thật cho
  `Doc.levels`, `idf.ts:46-66`). Thêm trường mới cho ArchiNote nên đi theo đúng pattern này.
  `IDF_VERSION` là hằng số **cứng ở `IDF_APP_VERSION = 'interiorflow-1.0.0'`** — mọi app khác đọc/ghi
  `.idf` phải tôn trọng field `idfVersion` để biết cách parse (đã có cơ chế từ chối file "mới hơn
  app" ở `idf.ts:196-203`).
- **`Doc` mỗi sheet có `entities[]`/`layers[]`** (kiểm hợp lệ tối thiểu ở `isValidDoc`, `idf.ts:171-176`)
  — cấu trúc chi tiết bên trong `entities`/`Base`/`levelId` **CHƯA VERIFY sâu trong phiên này** (chỉ
  đọc `idf.ts`, không đọc toàn bộ `lib/cad/model.ts` — 1.273 dòng theo `ARCHINOTE-MAP.md:163`, ngoài
  phạm vi thời gian phiên này).
- **KHÔNG có field nào mang tên hệ ngoài/nguồn dữ liệu** — đã xác nhận qua `00-BAT-DAU-DOC-DAY.md
  §0v`: `grep -na "external\|source\|origin" lib/cad/idf.ts` = **0**. Đây chính là khoảng trống cần
  lấp để `.idf` gánh được vai trò cầu nối.

## 2. ArchiNote cần gửi lên gì — theo `ARCHINOTE-MAP.md`

Theo tầm nhìn sản phẩm (`ARCHINOTE-MAP.md §0` câu 5, §5 bảng đối chiếu spec): ArchiNote là "máy THU"
với module **② Hiện trường** — đo đạc (LiDAR/laser), **ảnh điểm đo**, **ghi âm** (chuyển giọng nói
thành text), panorama, SunCalc. **Hiện trạng code: MODULE NÀY = 0%** (`ARCHINOTE-MAP.md:205`:
`grep -rni "lidar\|panorama\|suncalc\|whisper" ttt-tasks/src/` → 0 kết quả). Module DUY NHẤT có thật
là **① Điều phối** (Kanban/Gantt/Lịch — đọc Lark, không liên quan CAD/`.idf`).

⇒ **Điểm mấu chốt của VIỆC 6: bản thân tính năng "gửi đo đạc/ảnh/ghi âm" CHƯA TỒN TẠI ở phía
ArchiNote.** File này thiết kế **hình dạng dữ liệu ArchiNote SẼ gửi khi module đó được xây**, không
phải mô tả luồng đang chạy — cần nói rõ với Hoà đây là spec CHUẨN BỊ TRƯỚC (đúng luật §9 "thiết kế
trước — tính năng fill sau" của `00-BAT-DAU-DOC-DAY.md`), không phải audit hiện trạng.

Suy luận nhu cầu dữ liệu từ tên module (LiDAR/laser đo đạc, ảnh điểm đo, ghi âm STT):
- **Đo đạc**: 1 giá trị số (khoảng cách/kích thước) + đơn vị + gắn với 1 điểm/2 điểm trong không gian.
- **Ảnh hiện trường**: file ảnh + toạ độ chụp (nếu có GPS/AR anchor) + thời điểm + optional ghi chú.
- **Ghi âm**: file audio + bản chuyển văn bản (STT) + thời điểm + optional gắn với vị trí đang đứng.

## 3. Bảng khớp/lệch giữa nhu cầu 2 bên

| Nhu cầu ArchiNote (gửi lên) | `.idf` hiện có tương ứng? | Lệch |
|---|---|---|
| Đo đạc gắn với 1 điểm/đối tượng trong bản vẽ | `Doc.entities[]` có toạ độ hình học, nhưng **không có khái niệm "điểm đo hiện trường"** tách biệt khỏi entity CAD đã vẽ | ❌ Thiếu hẳn 1 loại dữ liệu — đo hiện trường KHÁC entity CAD (entity là kết quả đã vẽ, đo hiện trường là NGUYÊN LIỆU thô để vẽ/đối chiếu) |
| Ảnh hiện trường gắn vị trí | Không có trường ảnh nào trong `IdfFile`/`IdfMeta` hiện tại (đọc `idf.ts` — 0 field kiểu `photos`) | ❌ Thiếu — `CLAUDE.md` LUẬT NỀN TẢNG mục 5 nói `.idf` có "photos" trong docstring gốc (`idf.ts:1-6` liệt "entities/layers/markups/photos") nhưng **không thấy field `photos` trong `IdfFile`/`IdfSheetData` interface thật** (`idf.ts:109-131`) — **có thể `photos` nằm TRONG `Doc` (chưa đọc `model.ts` để xác nhận) — CHƯA VERIFY**, cần đọc `lib/cad/model.ts` mới chắc |
| Ghi âm + transcript | Không thấy field nào | ❌ Thiếu hoàn toàn |
| Nguồn dữ liệu (app nào, thiết bị nào tạo ra mẩu dữ liệu này) | Không có (đúng phát hiện §0v — 0 field external/source) | ❌ Thiếu — đây là lỗ hổng CHUNG cho mọi loại dữ liệu ngoài, không riêng ArchiNote |
| Đồng bộ 2 chiều trạng thái dự án (`PROJECT_STATUS`: `projectId`/`stage`/`%`/`updatedAt`) — spec gốc định qua Lark | `.idf.meta` có `projectName`/`modifiedAt`, KHÔNG có `stage`/`%` tiến độ | 🟡 Một phần — `IdfMeta` có thể mở rộng, nhưng L-EXT2 đòi kênh này chuyển từ Lark sang `.idf`, đây là thay đổi kiến trúc lớn hơn chỉ thêm field |

## 4. Cần thêm gì vào `.idf` để đóng khoảng lệch — đề xuất `IdfFieldNote`

**Nguyên tắc thiết kế:** ArchiNote là app điện thoại, KHÔNG có (và không nên cần) hiểu cấu trúc
`Doc`/`entities` đầy đủ của IF chỉ để gửi 1 ảnh hiện trường. Field mới nên là **1 khối rời, cộng
thêm (additive)**, không đòi ArchiNote phải parse/ghi vào `entities[]` — IF (máy có đủ ngữ cảnh CAD)
mới là bên "tiêu hoá" field note thành entity thật nếu cần (đúng K1 "một nguồn", không phải "ArchiNote
tự ý sửa Doc").

```ts
// Đề xuất bump IDF_VERSION → 3, thêm field CỘNG THÊM (optional, additive — file .idf v2 cũ vẫn
// đọc được bình thường, không phá dữ liệu hiện có, đúng pattern migrateV2ToV3 nối theo migrateV1ToV2).
interface IdfFieldNote {
  id: string;
  kind: 'measurement' | 'photo' | 'audio';
  capturedAt: string;              // ISO 8601 — lúc ArchiNote ghi nhận, KHÔNG phải lúc sync
  source: ExternalRefLite;         // xem §4.1 — bắt buộc, để biết note này từ đâu ra
  sheetId?: string;                // gắn với 1 sheet cụ thể nếu biết (optional — hiện trường có thể chưa rõ đang ở sheet nào)
  entityId?: string;                // gắn với 1 entity CAD đã có, nếu KTS đã xác định được (optional)
  position?: { xMm: number; yMm: number; levelId?: string }; // toạ độ THÔ trong hệ .idf, nếu ArchiNote có AR anchor/định vị được
  measurement?: { valueMm: number; label?: string };          // chỉ có khi kind === 'measurement'
  photoRef?: { fileName: string; note?: string };              // chỉ có khi kind === 'photo' — file ảnh KHÔNG nhúng base64 vào .idf (phình file), xem §5 cơ chế đính kèm
  audioRef?: { fileName: string; transcript?: string };        // chỉ có khi kind === 'audio'
  resolved: boolean;               // KTS đã "tiêu hoá" note này thành entity/quyết định thật hay chưa — mặc định false
}

// L-EXT1: KHÔNG đặt tên hãng. "source" chỉ ghi hệ nội bộ của chính IF ("archinote"), không phải
// nhà cung cấp thứ 3 — nhưng để nhất quán với ExternalRef đã có (prisma/schema.prisma:482-...),
// dùng CÙNG HÌNH DẠNG rút gọn, không phải bảng riêng (vì .idf là file JSON rời, không phải DB row):
interface ExternalRefLite {
  system: 'archinote';             // cố định — nếu sau này có app thu thập khác, thêm giá trị mới, không đổi field
  deviceId?: string;                // optional, để phân biệt nhiều điện thoại cùng gửi vào 1 dự án
}
```

### 4.1 Vì sao `source`/`ExternalRefLite` bắt buộc

Đây chính là field còn thiếu mà §0v đã chỉ ra (0 field external trong `idf.ts` hiện tại). KHÔNG lặp
lại lỗi cũ (tên hãng trong tên CỘT) — ở đây `system` là 1 giá trị STRING TỰ DO bên trong field, đúng
khuôn `ExternalRef.system` đã dùng cho Prisma (`prisma/schema.prisma:485-486`: *"chuỗi tự do do
adapter khai, cố ý KHÔNG enum"*) — tái dùng convention đã có, không phát minh khuôn mới.

## 5. Lớp cache cục bộ ArchiNote cần — chống "mất mạng = trắng màn hình"

`ARCHINOTE-MAP.md:130` xác nhận hiện trạng: *"Toàn bộ ở Lark, không có bản sao local. Mất mạng =
trắng màn."* — đúng với module ① Điều phối (đọc Lark), nhưng module ② Hiện trường (chưa xây) LÀ NƠI
vấn đề này nghiêm trọng nhất trong thực tế: kiến trúc sư đứng tại công trường, thường **không có
mạng ổn định** — đây là use case chính đáng lẽ PHẢI offline-first ngay từ đầu.

**Đề xuất 3 tầng cho module Hiện trường (áp dụng khi module này được xây, không phải sửa module ①
hiện tại — ngoài phạm vi VIỆC 6):**

1. **Ghi cục bộ trước, đồng bộ sau (local-first ghi)**: mọi `IdfFieldNote` tạo ra ở ArchiNote ghi
   NGAY vào storage cục bộ trên điện thoại (SQLite/IndexedDB tuỳ nền tảng — **CHƯA VERIFY** ArchiNote
   dùng nền tảng nào để lưu cục bộ, vì `ttt-tasks` không mount được; theo `ARCHINOTE-MAP.md:13`
   ArchiNote là **Next.js web app** hiện tại, chưa có Capacitor/app di động thật — `AN-0.4` = 0%,
   `ARCHINOTE-MAP.md:196`). File ảnh/audio lưu vào bộ nhớ máy, KHÔNG chờ upload xong mới coi là
   "đã lưu" — khớp tinh thần offline-first #1 đã dùng ở VIỆC 2.
2. **Hàng đợi đồng bộ (sync queue)**: khi có mạng lại, gom các `IdfFieldNote` chưa gửi thành 1 gói,
   xuất ra dạng file phụ trợ — ví dụ `<project>.idfnotes.json` (mảng `IdfFieldNote[]`, KHÔNG phải
   `.idf` đầy đủ vì ArchiNote không có `Doc`/sheet để ghép) — và chuyển giao cho IF qua **kênh
   `.idf`** theo đúng L-EXT2 (không qua Lark): cách chuyển giao cụ thể (AirDrop/thư mục dùng chung/
   upload lên server nội bộ của IF rồi IF tải về) **CHƯA VERIFY được lựa chọn nào phù hợp nhất** —
   đây là quyết định hạ tầng cần Hoà/TỔNG chọn dựa trên network thật của studio, ngoài phạm vi kỹ
   thuật thuần của VIỆC 6.
3. **Nhập vào IF (bên nhận)**: IF đọc `<project>.idfnotes.json`, hiển thị danh sách note "chưa tiêu
   hoá" (`resolved: false`) cho KTS duyệt — mỗi note có thể: (a) bấm "tạo entity từ note này" (IF tự
   sinh entity CAD dựa trên `measurement`/`position`, đặt `resolved: true`), hoặc (b) "chỉ lưu tham
   khảo" (giữ nguyên trong `.idf.fieldNotes[]`, không sinh entity) — đúng **§0e KS3 "duyệt theo
   phần"**: không bắt IF tự động nuốt mọi note thành bản vẽ mà không qua mắt người.

## 6. Chưa kiểm chứng được (CHƯA VERIFY)

- Cấu trúc đầy đủ `Doc`/`entities`/`Base` trong `lib/cad/model.ts` (1.273 dòng, không đọc trong
  phiên này) — đặc biệt liệu `Doc` đã có sẵn field `photos`/`markups` như docstring đầu `idf.ts:1-6`
  liệt kê hay chưa (docstring và interface `IdfFile` thật KHÔNG khớp nhau ở điểm này — cần đọc
  `model.ts` để xác nhận field `photos` nằm ở đâu, hay chỉ là mô tả dự định chưa hiện thực).
- ArchiNote lưu cục bộ bằng công nghệ gì (không mount được `ttt-tasks/src`) — chỉ biết qua
  `ARCHINOTE-MAP.md` rằng hiện KHÔNG có tầng cache nào (`AN-0.5 Offline-first = 0%`), chưa biết kế
  hoạch kỹ thuật cụ thể nếu có.
- Cơ chế chuyển giao file `.idfnotes.json` giữa 2 app (mạng nội bộ? cloud storage trung gian? cắm dây?)
  — đây là quyết định hạ tầng, phiên này chỉ đề xuất HÌNH DẠNG dữ liệu, không quyết đường truyền.
- `PROJECT_STATUS` (đồng bộ trạng thái dự án 2 chiều) — theo L-EXT2 phải chuyển từ Lark sang `.idf`,
  nhưng đây là thay đổi lớn hơn phạm vi field note (đụng tới module ① Điều phối đang hoạt động thật
  bằng Lark) — KHÔNG đề xuất thiết kế lại trong file này, chỉ ghi nhận đây là việc khác, lớn hơn.
