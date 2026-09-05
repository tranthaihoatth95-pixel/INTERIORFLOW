# LANE B — Ảnh → Khối 3D (năng lực `image-to-3d`) · 20/08

Mốc: `c7f3ac8`. Vùng ghi: `lib/capabilities/image-to-3d.ts` (mới) + test cạnh nó.
Không đụng `compound.ts` · `visual-generate.ts` · `lib/commands/**` · `components/**` · `prisma/**`.

---

## ⓪ TIỀN ĐỀ — kiểm, kết quả

| Tiền đề phiếu | Kiểm | Kết quả |
|---|---|---|
| HEAD = `c7f3ac8` | `git log --oneline -1` | ✅ đúng |
| Tree dirty nhiều file (3 lane) | `git status` | ✅ đúng — `lib/idfc-import/surface-graph.ts` đã `M` TRƯỚC khi tôi vào, **không phải của tôi** |
| `lib/capabilities/compound.ts` có sẵn, tsc 0 | đọc | ✅ 204 dòng; năng lực `image-to-3d` khai `mucSuThat:'suyRa'`, `lenhNoiBo:['vision.measureObjectTiered','idfc.fromPhoto']` |

🔴 **MỘT TIỀN ĐỀ NGẦM CỦA PHIẾU BỊ BÁC** — phiếu viết *"nối đường: ảnh → chạy máy hiểu SẴN CÓ → ra ứng
viên khối 3D"* như thể chỉ cần nối. Đo được: **hai nửa của `lenhNoiBo` không cùng hạng**.
`vision.measureObjectTiered` chạy từ ảnh trần được; `idfc.fromPhoto` thì **KHÔNG** — nó đòi
`VerifiedSpec` (w/d/h + URL trang hãng do NGƯỜI tra tay, `from-photo.ts:47`) *cộng* `FAL_KEY`. Nối nó
vào một luồng "thả ảnh vào là ra khối" là bịa một đầu vào không tồn tại. ⇒ Tôi làm nửa chạy được,
khai thẳng nửa kia là bậc cao hơn còn mồ côi. Không dừng phiếu vì phần chính vẫn thi hành được.

---

## ① LOOK INSIDE — vùng DÀY, không viết mới

### ĐANG CÓ và ĐANG SỐNG (có nơi gọi thật)

| Thứ | file:dòng | Trạng thái |
|---|---|---|
| `measureObjectTiered()` — máy HIỂU ảnh, 4 bậc, trả w/d/h kèm `kind:'measured'\|'inferred'` + `basis` | `lib/vision/single-view-metrology.ts:942` | ✅ LIVE — node `vision.measureobject` (`lib/nodes/defs/metrology.ts:21`) + thẻ việc `measureobject` (`lib/render-studio/task-cards.ts:115`) |
| `calibrateFromImage()` — hiệu chỉnh camera từ 3 điểm tụ | `single-view-metrology.ts:683` | ✅ LIVE — `components/render-studio/ToolModeForm.tsx:180` |
| `buildFurnitureFromMeasurement()` — số đo → nét mặt bằng → `Entity[]` | `lib/vision/to-cad.ts:142` | ✅ LIVE — `ToolModeForm.tsx:974` |
| `orthoViewsToEntities()` — 3 hình chiếu | `to-cad.ts:253` | ✅ LIVE — `ToolModeForm.tsx:1009` |
| `matchTemplate()` ⑤ khớp mẫu theo tỉ lệ w:d | `lib/vision/match-template.ts` | ✅ LIVE — `to-cad.ts:169`, `ToolModeForm.tsx:1008` |
| `buildOrthoViews()` ⑥ | `lib/vision/ortho-projection.ts` | ✅ LIVE qua `to-cad.ts:275` |
| `dimsAreUsable()` / `unusableDimsMessage()` — cổng chặn NaN/∞/≤0 | `to-cad.ts:130` / `:135` | ✅ LIVE |
| `ProvenanceFlag = measured\|inferred\|verified` | `lib/idfc-import/from-photo.ts:35` | ✅ từ vựng chốt 10/08 |
| `Base.heightMm` → `docToObjScene` đùn lăng trụ | `lib/cad/model.ts` · `lib/three/cad-to-obj.ts:698` | ✅ LIVE |
| `ExternalRef{system,externalId,entityType,entityId}`, `system` chuỗi TỰ DO | `prisma/schema.prisma:609` | ✅ bảng có, **0 hàng** |
| `chuanNet()` | `lib/idfc-import/chuan-net.ts` | ✅ LIVE — `components/library/LibrarySheet.tsx` |

### 🔴 MỒ CÔI — có code, 0 nơi gọi ngoài test (grep 20/08)

| Mồ côi | file | Vì sao chưa nối |
|---|---|---|
| `importFromPhoto()` · `buildIdfcFromPhoto()` | `lib/idfc-import/from-photo.ts:242` / `:89` | Đòi `VerifiedSpec` do người tra tay + `FAL_KEY`. **Bậc cao hơn** của cùng ý định, không chạy từ ảnh trần. Không nối ở lượt này |
| `buildSurfaceGraph()` | `lib/idfc-import/surface-graph.ts` (1302 dòng) | 0 nơi gọi |
| `applyPartLock()` | `lib/idfc-import/part-lock.ts` (454 dòng) | 0 nơi gọi |
| `detectHorizon()` | `lib/vision/horizon.ts` (120 dòng) | 0 nơi gọi |

### THIẾU — và là toàn bộ nội dung file mới

Không thiếu thuật toán nào. Thiếu đúng **trạng thái ỨNG VIÊN + cửa người duyệt + cổng BOQ + móc biểu
diễn**. Máy hiểu ảnh đã sống, nhưng nó chỉ biết ĐỔ THẲNG `Entity[]` vào bản vẽ 2D — không có chỗ nào
trong repo giữ một kết quả ở trạng thái *"máy đề xuất, người chưa gật"*.

---

## ② LÀM GÌ

`lib/capabilities/image-to-3d.ts` (≈330 dòng) + `image-to-3d.test.ts`. Thuần: **0 mạng · 0 DOM ·
0 prisma · 0 ghi `Doc`** (hai chữ "prisma" trong file là docstring, đã grep xác nhận).

```
ảnh (LibraryAsset|ProjectFile) + loại đồ + mặt nạ/neo
   → demXetDauVao()        cổng: đủ điều kiện chưa, không đủ thì TỪ CHỐI KÈM LÝ DO
   → measureObjectTiered()  [SẴN CÓ]  w/d/h + measured|inferred + basis
   → dimsAreUsable()        [SẴN CÓ]  chặn NaN/∞/≤0
   → buildFurnitureFromMeasurement() [SẴN CÓ] → Entity[] nét mặt bằng
   → gắn heightMm           ⇒ docToObjScene đùn lăng trụ = KHỐI 3D, không engine mới
   → UngVienKhoi3D{ trangThai:'deXuat' }        ← MÁY DỪNG Ở ĐÂY
   → nhanUngVien(người ký) | boUngVien()        ← CỬA NGƯỜI
   → duocDoVaoDoc() · duocVaoBoq() · bieuDienCuaUngVien()
```

**Vì sao "khối" là nét mặt bằng + `heightMm` chứ không phải mesh** — không phải để đi tắt: đó đúng là
cách IF biểu diễn khối 3D hôm nay (`cad-to-obj.ts:698` đùn theo `heightMm`; `BuildRecipe`/`ops` là
ngăn xếp nâng cao trên chính nó). Sinh mesh sẽ phải gọi fal TRELLIS = mạng + credit + không tất định.

Bốn ràng buộc đã thành **máy chặn**, không phải câu trong docstring:
- **Cờ suy không rò**: `nacThapNhat()` — một chiều `inferred` kéo cả món xuống. Máy sinh **không bao
  giờ** tự đặt `verified`; chỉ `nhanUngVien(nguoiXacNhan)` nâng được, và ném lỗi nếu người ký rỗng.
- **BOQ**: `duocVaoBoq()` false trừ khi đã duyệt **và** không chiều nào còn `inferred`. Không tham số tắt.
- **Không nhân bản asset**: `bieuDienCuaUngVien().entityId === nguon.id` — hàng `ExternalRef`, 0 cột mới, 0 asset mới.
- **Không xoá dấu vết máy**: mỗi chiều giữ `flagMay` (cờ máy gốc) + `basis` cũ kể cả sau khi người sửa tay.

🔴 **Cổng quan trọng nhất — từ chối thay vì dựng khối bịa.** Bậc 1 của `measureObjectTiered` là *dải
chuẩn nghề theo loại đồ*: nó **không đọc ảnh một pixel nào**, trả trung điểm dải cho mọi cái ghế bành
trên đời. Trả kết quả đó dưới nhãn "khối 3D từ ảnh này" là nói dối bằng hình. ⇒ không mặt nạ + không
neo + không rộng-biết ⇒ **TỪ CHỐI**, kèm 3 đường thoát cụ thể.

**Một bug thật bắt được lúc viết test**: số NGƯỜI DÙNG NHẬP mà hỏng (`knownWidthMm: NaN`, `realMm: -5`)
bị nuốt **âm thầm** — máy tụt xuống bậc thấp hơn rồi vẫn trả khối, người dùng tưởng số mình gõ đã được
dùng. Đã sửa **code**, không sửa kỳ vọng test.

---

## ③ Reused / Extended / New

| | Tên thật |
|---|---|
| **REUSED** (gọi nguyên, 0 sửa) | `measureObjectTiered` · `FURNITURE_SIZE_PRIORS` · `buildFurnitureFromMeasurement` · `measurementToTarget` · `dimsAreUsable` · `unusableDimsMessage` · `ProvenanceFlag` · `MeasurementValue/Result` · `ObjectSilhouette` · `Base.heightMm` · hình dạng `ExternalRef` · `nangLucTheoId` |
| **EXTENDED** | không có — 0 file sẵn có bị sửa |
| **NEW** | `lib/capabilities/image-to-3d.ts` + test. Negative evidence: xem §① — thứ mới duy nhất là trạng thái ứng viên + 3 cổng, không nơi nào trong repo có |

---

## ④ Verify

| | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ **exit 0** |
| Test mới `image-to-3d.test.ts` | ✅ **56 pass · 0 fail** |
| 10 test hàng xóm (`lib/vision/*` + `lib/idfc-import/*`) | ✅ **444 pass · 0 fail** (horizon 48 · hough 7 · match-template 59 · ortho 43 · metrology 46 · to-cad 63 · chuan-net 74 · from-photo 26 · part-lock 23 · surface-graph 55) |
| **BROWSER** | ⚠️ **KHÔNG CHẠY ĐƯỢC — khai thẳng, không nhận PASS** |
| DB `LibraryAsset` / `ProjectFile` / `ProjectAssetUsage` / `ExternalRef` | **1613 / 0 / 0 / 0 trước = 1613 / 0 / 0 / 0 sau** (`prisma/dev.db`, tự đo hai đầu) |

**Vì sao browser không chạy được, hai lý do độc lập:**
1. **Không có bề mặt để bấm.** Mọi `components/**` đụng được (render-studio · three · library · nav)
   đều thuộc lane khác. Module mới chưa có nơi gọi ⇒ **không tồn tại nút nào** dẫn tới nó.
2. Ngay cả bề mặt hàng xóm cũng không assert được: `:3001` trả `200` cho `/` (1,2s) và `/login`
   (7,9s) nhưng `get_page_text` **timeout `document_idle` 45s ba lần liên tiếp** (`/projects` → 404,
   15,3s). Dev server đang gánh 3 lane. Tôi **không** suy ra kết luận từ mã thay cho việc mở mắt nhìn.

Dữ liệu thử: **không sinh dòng nào** — module không import prisma, test thuần trong tiến trình.

---

## ⑤ Trả MAIN (§32)

- **Image→3D = PARTIAL.** Lõi + cửa duyệt + cổng BOQ + móc biểu diễn: chạy, có test, tsc sạch.
  Bề mặt bấm được: **chưa có**, chặn bởi ranh giới lane chứ không phải bởi kỹ thuật.
- **Reused/Extended/New**: xem bảng §③. New = đúng 1 file + test.
- **BROWSER = KHÔNG CHẠY** (không phải FAIL, không phải PASS) — lý do ở §④.
- **Nối tiếp rẻ nhất**: một nút trong Toolbelt của LANE A gọi `deXuatKhoi3D()` → panel Xem trước
  (`tomTatUngVien`) → Nhận/Bỏ → `duocDoVaoDoc()` rồi mới `addEntities`. Lõi đã sẵn, phần còn lại là vỏ.

### 🔴 PHÁT HIỆN LIÊN LANE — CỬA DUYỆT ĐANG ĐƯỢC XÂY HAI LẦN (MAIN xử, tôi không tự gộp)

Cuối lượt, `lib/capabilities/` xuất hiện `nguon-anh.ts` (10:19, lane khác). Đọc ra: nó giữ
`deXuat[]` / `daNhan[]` + `nhanDeXuat()` / `boDeXuat()` — **cùng một cỗ máy** với `trangThai:
'deXuat'|'daNhan'|'daBo'` + `nhanUngVien()` / `boUngVien()` của tôi. Hai lane, hai hiện thực, một
cơ chế: *máy đề xuất → người xem → nhận/bỏ*.

Tin tốt: **từ vựng đã trùng khít** (`deXuat`/`daNhan`) dù hai lane không nói chuyện với nhau — dấu
hiệu khuôn `ProposalSheet` (chốt 13/08) là đẳng cấu thật, không phải trùng hợp. Tin xấu: đây đúng
tín hiệu ① của `may-soi-dong-dang` (*hai kiểu cùng hình dạng, khác tên*) và nếu để hai bản sống
song song thì chúng sẽ phân kỳ — bản này thêm "sửa tay trước khi ký", bản kia thêm "so cạnh nhau",
rồi không bản nào có đủ cả hai.

**Tôi cố ý KHÔNG gộp**: `nguon-anh.ts` là vùng ghi của lane khác, và chọn hình dạng chung cho cửa
duyệt là quyết định cấp kiến trúc (biên liên chặng) — theo phân tầng 12/08 thì sub-agent chạm biên
là **dừng và đề xuất lên trên**. Khác biệt thật cần cân khi gộp: bản của tôi mang thêm **cờ 3 nấc
per-chiều + cổng BOQ** (thứ ảnh/phim không cần vì `mucSuThat:'khongPhaiSoDo'`) ⇒ khuôn chung phải
để chỗ cho *"đề xuất này có mang con số hay không"*, đừng ép một hình dạng phẳng.

### 🔴 Cần Hoà quyết (2 việc, đều là cửa người)

1. **Hình dạng schema cho "một asset, nhiều biểu diễn"** — tôi **không thêm cột** (schema là human
   gate), dùng tạm `ExternalRef`. Nhưng `ExternalRef` chỉ neo được `(system, externalId) → (entityType,
   entityId)`: nó nói được *"ảnh này có một biểu diễn tên X"* mà **không lưu được bản thân khối**, cũng
   không phân biệt biểu diễn 2D với 3D bằng một trường có kiểu. Đề xuất cho phiếu sau:
   `AssetRepresentation{ assetId, kind:'2d'|'3d'|'mesh', payloadRef, provenance, verifiedBy }`.
   Hệ quả nếu để nguyên: khối đã duyệt **không persist được** qua phiên.
2. **Ký = `verified` có đủ không?** Hiện `nhanUngVien()` nâng cả ba chiều lên `verified` khi người bấm
   Nhận, kể cả khi họ không sửa số nào. Đọc theo đúng chữ Hoà 15/08 (*"người dùng xác nhận thì ghi
   verified"*). Nhưng nó mở cửa BOQ cho một con số máy suy mà người chỉ **liếc rồi gật**. Hai đường:
   (a) giữ nguyên — tin chữ ký; (b) chỉ `verified` chiều nào người **gõ lại số**, chiều chỉ-gật giữ
   `inferred` và đứng ngoài BOQ. Tôi nghiêng (b) vì nó khớp luật *"BOQ chỉ nhận số đo được"* chặt hơn,
   nhưng đây là chốt nghiệp vụ, không phải chốt kỹ thuật.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- **Chưa chạy trên app thật một dòng nào.** Mọi kết luận về hành vi đến từ test trong tiến trình + đọc
  mã. Riêng khẳng định *"nét mặt bằng + `heightMm` ⇒ ống kính 3D đùn ra lăng trụ nhìn thấy được"* là
  **suy từ `cad-to-obj.ts:698`, CHƯA nhìn tận mắt**. Nếu sai thì sai ở đúng chỗ đắt nhất (khối rỗng).
- **Chưa thử với mặt nạ THẬT** từ `ai.furnitureextract`. Mặt nạ trong test là chữ nhật tự dựng ⇒ chưa
  biết bậc 4 (`tryTier4`) có kích hoạt trên ảnh thật không, và `hopBaoTam` thực tế bật bao nhiêu phần trăm.
- **Chưa đo tỉ lệ TỪ CHỐI trên ảnh thật.** Cổng luật ③ có thể chặt tới mức đa số ảnh KTS thả vào đều bị
  từ chối (vì chưa tách nền) — đúng về mặt trung thực, có thể sai về mặt dùng được. Phải đo mới biết.
- **`ExternalRef` mới chỉ là HÌNH DẠNG object** khớp cột; chưa hàng nào được ghi, chưa kiểm ràng buộc
  `@@unique([system, externalId])` khi chạy lại đề xuất trên cùng một ảnh (khả năng đụng unique — id
  ứng viên có `genId` tiêm được nên chưa chốt được là ổn định hay ngẫu nhiên).
- **Danh sách mồ côi là SÀN, không phải TRẦN**: grep theo tên hàm xuất khẩu, mù với gọi động/re-export.
- **`ProjectFile` = 0 hàng** trong DB này ⇒ nhánh `loai:'projectFile'` chưa có dữ liệu thật nào để thử.

## ⑦c HẠN DÙNG KẾT LUẬN

- Bảng LIVE/MỒ CÔI: đúng tại `c7f3ac8` ngày 20/08. **Hai lane đang chạy song song** — LANE C sở hữu
  `components/render-studio/**` (nơi 4 hàm `to-cad` đang sống) ⇒ cột "LIVE" có thể đổi trong ngày.
- Số đếm DB: đúng tại thời điểm đo, trên `prisma/dev.db` của máy này.
- Quyết định *"khối = nét mặt bằng + heightMm"*: hết hiệu lực khi `BuildRecipe` có đường sinh tự động
  (entry `xuong-hoa-van-parametric`) hoặc khi mesh TRELLIS được nối — lúc đó phải chọn lại bậc biểu diễn.
- Đề xuất `AssetRepresentation`: phải đo lại sau khi H9 (Workspace/Canvas) chốt — `ProjectAssetUsage`
  đã có hai cột `workspaceId`/`canvasId` transitional, bảng mới đừng lặp lại cùng nợ.
