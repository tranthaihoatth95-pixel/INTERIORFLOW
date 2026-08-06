# PORT-TICKETS — phiếu nối dây thuật toán mồ côi + spec hợp đồng 5 màn trống

> Soạn 06/08/2026. **Không sửa code, không sửa mock, không commit** (luật V6).
> Nguồn: `docs/GAP-IF.md` (53 dòng GAP) · `docs/M1-OUT.md` · `docs/M3-OUT.md` · `docs/M5-OUT.md` ·
> `docs/PHIEU-PORT-GIAO-DIEN-2026-08-06.md`. Luật bắt buộc mọi phiếu: `docs/00-BAT-DAU-DOC-DAY.md`
> **§9** (thiết kế trước — tính năng fill sau) · `docs/SPEC-NGON-NGU-CHI-DAN.md` (chữ hiện ra UI).

## ⚠️ ĐỌC TRƯỚC — repo đang là MỤC TIÊU DI ĐỘNG

Mọi bằng chứng "0 nơi gọi" dưới đây đo bằng `grep` **lúc soạn phiếu (06/08, ~15:20)**. Trong đúng
quãng soạn phiếu, các phiên M1/M2/M3 song song đã ghi vào working tree (chưa commit):

```
?? lib/cad/import-summary.ts   ?? lib/cad/element-infer.ts   ?? lib/cad/poche.ts
?? lib/cad/library-item-resolve.ts   ?? lib/vision/to-cad.ts   ?? lib/ffe/item.ts
 M components/cad/CadEditor.tsx (+395 dòng)   M lib/cad/dxf.ts   M lib/cad/store.ts
```

⇒ **Ba mục ưu tiên trong brief giao phiếu này đã HẾT mồ côi** (PT-01 · PT-02 · PT-03) và hai mục
khác đang được nối dở ở tầng thuần (PT-04 · PT-05). Phiếu vẫn giữ, nhưng đổi nội dung từ *"nối
dây"* sang *"nghiệm thu + phần còn thiếu"*. **Phiên nào cầm phiếu này PHẢI chạy lại lệnh grep
ghi trong từng phiếu trước khi động tay** — con số dưới đây là ảnh chụp, không phải sự thật vĩnh cửu.

---

## 0 · Mục lục

### Phần I — phiếu port (thuật toán đã có, thiếu mặt tiền)

| Mã | Việc | GAP | Phiên | Chặn / không |
|---|---|---|---|---|
| **PT-01** | Báo cáo nạp bản vẽ — nghiệm thu panel vừa nối + đóng §9 | G-M1-02 | M1 | không chặn (đã có UI) |
| **PT-02** | Đọc ngữ nghĩa mặt bằng — còn thiếu NƠI TIÊU THỤ thứ hai (zoning) | G-M1-03 | M1 | **chặn** SP-04 |
| **PT-03** | Zoom đúng cụm vẽ chính — nghiệm thu + lối thoát "xem toàn bộ" | G-M1-04 | M1 | không chặn |
| **PT-04** | Thả món từ Thư viện xuống bản vẽ — **còn 0 chỗ nghe** | G-M3-14 (+ G-M3-15) | M3 | **chặn** T3 bước thả |
| **PT-05** | Món đã đo → block + ba hình chiếu — **còn 0 nút** | G-M3-03 | M3 | **chặn** T2 mắt xích cuối |
| **PT-06** | Ống hút thuộc tính (`matchProps`) — lõi thuần, 0 nơi gọi | (chưa có GAP) | M2 | không chặn |
| **PT-07** | Gõ số SAU thao tác (VCB) — lõi thuần, 0 nơi gọi | (chưa có GAP) · họ hàng G-M2-06 | M2 | không chặn |
| **PT-08** | Xuất vật liệu D5 · V-Ray · suy PBR theo danh mục — 3 module, 0 nơi gọi | (chưa có GAP) | M3 | không chặn |

### Phần II — SPEC hợp đồng cho màn trống (Claude Design dựng mock)

| Mã | Màn | GAP | Phiên | Đã có mock? |
|---|---|---|---|---|
| **SP-01** | Nhập bản vẽ: chọn tệp → tiến độ → huỷ → báo cáo nạp | G-M5-01 | M5 | ❌ 0/57 trang |
| **SP-02** | Inspector CẤU KIỆN (tường · cửa · khối) | G-M5-02 | M5 | 🟡 **có một nửa** — xem SP-02 §a |
| **SP-03** | Nhận đề bài | G-M5-11 | M5 | ❌ (app có panel, mock không có) |
| **SP-04** | Zoning theo chương trình | G-M5-12 | M5 | ❌ 0/57 trang |
| **SP-05** | Bảng kết quả kiểm sau bố trí | G-M5-13 | M5 | ❌ — nhưng **panel Kiểm chuẩn đã có trong code** |

---
---

# PHẦN I — PHIẾU PORT

## PT-01 · Báo cáo nạp bản vẽ — nghiệm thu panel vừa nối, đóng nốt §9

**GAP đóng được:** G-M1-02.

### Thuật toán nguồn
- `lib/cad/dxf.ts` — `parseDxfEx(text, opts)` (dòng 638) trả `{ doc, report }`; kiểu
  `DxfLoadReport` khai ở dòng 456, **8 trường** (brief ghi 7 — trường thứ 8 `elementTypes` vừa
  thêm cùng `element-infer.ts`): `entitiesRead` · `blocksExpanded` · `skipped` · `layers` ·
  `bbox?` · `warnings` · `totalEntities` · `elementTypes`.
- `lib/cad/import-summary.ts` (MỚI, chưa commit) — `droppedContent()` · `importStatusLine()` ·
  `SKIPPED_LABELS` · `SILENT_RECORDS`.

### Bằng chứng — 🔴 **KHÔNG CÒN MỒ CÔI**

```bash
grep -rn "DxfLoadReport" --include="*.ts" --include="*.tsx" lib components app | wc -l
# → 16 dòng (trước 06/08 chỉ có trong lib/)
grep -rn "parseDxfEx" components app
# → components/cad/CadEditor.tsx:29 (import) · :409 (gọi thật)
```

`components/cad/CadEditor.tsx:409` đã gọi `parseDxfEx`, và `DxfImportReportPanel` (cùng file,
~dòng 920–1010) đã dựng bảng "Đọc được" / "Bỏ qua — không có trên bản vẽ". ⇒ Tài liệu
`GAP-IF.md` G-M1-02 và `M1-OUT.md §7` **đã lỗi thời** kể từ working tree 06/08.

### Mock
❌ Chưa có → **spec ở SP-01**. Panel hiện tại dựng thẳng từ code, chưa qua hợp đồng giao diện.

### Component đích
| File | Tồn tại | Việc |
|---|---|---|
| `components/cad/CadEditor.tsx` (2847 dòng) | ✅ `ls` OK | **sửa file có sẵn** — panel `DxfImportReportPanel` đã nằm trong file |
| `lib/cad/import-summary.ts` (215 dòng) | ✅ OK (untracked) | **file mới của phiên M1** — chỉ đọc, đừng dựng bản thứ hai |

### Phiên sở hữu
**M1 (lõi-cad)** — panel sống trong `CadEditor.tsx`, cùng phiên đã viết `import-summary.ts`; tách
sang phiên khác là chia đôi một mạch code đang dở.

### §9 — ô chưa code phải hiện gì
Panel đang thiếu 2 ô mà báo cáo có dữ liệu nhưng chưa dùng:
- Bảng `elementTypes.byLayer` (layer nào bị ĐOÁN thành gì) — hiện được ngay, không phải ô trống.
- Nút sửa lại phân loại sai → **chưa code**. Hiện `disabled`, nhãn nút: **"Sửa phân loại"**,
  lý do dưới nút: **"Chưa sửa được tại đây — mở Inspector để đổi."** (10 từ) + nút thật
  **[Mở Inspector]** đứng cạnh (§9 mục 2: cấm nút giả, luôn kèm nút làm được việc).

### Nghiệm thu
1. Nạp 1 file .dxf có ≥1 bản ghi bị bỏ → panel hiện đúng **tổng số bỏ qua = tổng cột "Số lượng"**
   của bảng "Bỏ qua" (cộng tay khớp, không lệch 1).
2. Nạp file **không bỏ sót gì** → câu "Không bỏ sót bản ghi nào", **không** hiện bảng "Bỏ qua".
3. `Esc` đóng panel; đóng rồi nạp file khác thì panel **mở lại** (không nhớ trạng thái đóng).
4. Chụp **đủ 2 theme** (sáng + tối), chữ Việt đọc được, không tràn ở bề rộng 1440.

### KHÔNG thuộc phiếu này
Đưa nạp DXF xuống worker + thanh tiến độ + nút huỷ (G-M1-01) — đó là SP-01 + phiếu riêng.
Không đụng `lib/cad/dwg.ts` (đường DWG đã có tiến độ/huỷ riêng, khác cơ chế).

---

## PT-02 · Đọc ngữ nghĩa mặt bằng — còn thiếu nơi tiêu thụ thứ hai

**GAP đóng được:** G-M1-03 (một nửa đã đóng).

### Thuật toán nguồn
`lib/cad/dxf-plan.ts` — 5 hàm + 3 bảng layer mặc định:
`mainClusterBox()` (dòng 71) · `planGridAxes()` (147) · `planCoreZones()` (210) ·
`planDeclaredAreaM2()` (255) · `planAreaCrossCheck()` (314);
`DEFAULT_STRUCTURE_LAYERS` · `DEFAULT_CORE_LAYERS` · `DEFAULT_GRID_LAYERS`.

### Bằng chứng — 🔴 **KHÔNG CÒN MỒ CÔI (một nửa)**

```bash
grep -rn "dxf-plan" --include="*.ts" --include="*.tsx" lib components app | grep -v "^lib/cad/dxf-plan"
# → 11 dòng; NƠI GỌI THẬT: components/cad/CadEditor.tsx:35 (import 4 hàm) · :416 (mainClusterBox)
#   + lib/cad/import-summary.ts:26
```

Nhưng nơi tiêu thụ **duy nhất** là panel báo cáo nạp — tức kết quả đọc mặt bằng chỉ **hiện ra rồi
thôi**. Không màn nào lấy `PlanGrid` / `CoreZone[]` làm **ràng buộc chia khu**, đúng chỗ
`GAP-IF.md` G-M1-03 nói ("chặng zoning không có đường đi từ bản vẽ vừa nạp").

### Mock
❌ Chưa có màn zoning → **spec ở SP-04**. Không có mock thì đừng code màn — sẽ vẽ lại lần hai.

### Component đích
| File | Tồn tại | Việc |
|---|---|---|
| `components/cad/CadEditor.tsx` | ✅ OK | **sửa file có sẵn** — nơi đã giữ kết quả `plan` trong state |
| `components/cad/AiBriefPanel.tsx` (557 dòng) | ✅ OK | **sửa file có sẵn** — BƯỚC 3 `generateLayoutOptions` là nơi cần lưới trục/lõi cứng làm ràng buộc |
| `lib/cad/ai-assist.ts` (652 dòng) | ✅ OK | **sửa file có sẵn** — `generateLayoutOptions()` dòng 559 chưa nhận tham số lưới trục |

### Phiên sở hữu
**M1 (lõi-cad)** cho phần truyền dữ liệu; màn zoning là M5. Chia mốc: M1 giao **kiểu dữ liệu +
hàm**, M5 giao **màn**. Không để một phiên ôm cả hai.

### §9
Trong `AiBriefPanel` BƯỚC 3, thêm ngay dòng đọc được **trước khi** có tính năng:
- Có lưới trục → chip **"Lưới trục 6×5 · lõi 3 vùng"** (số lấy thật từ `planGridAxes`/`planCoreZones`).
- Chưa có tính năng bám lưới → checkbox `disabled` nhãn **"Bám lưới cột"**, lý do:
  **"Chưa bám được lưới — máy vẫn tránh lõi cứng."** (9 từ) + nút **[Xem lưới trục]** (bật hiện lưới trên canvas).

### Nghiệm thu
1. Nạp 1 file có layer trục → chip hiện đúng **số trục chữ + số trục số** khớp `planGridAxes()`
   chạy tay trên cùng file (so 2 con số, không so "trông có vẻ đúng").
2. Nạp file **không có** layer trục nào → chip **không hiện**, panel không sập, không hiện `0×0`.
3. `planAreaCrossCheck()` trả `null` (2/6 file mẫu là ca này) → UI nói rõ **"Chưa đọc được diện
   tích khung tên"**, không hiện số 0.
4. `tsc -p .` sạch; test `lib/cad/dxf-plan.test.ts` vẫn xanh.

### KHÔNG thuộc phiếu này
Tính diện tích sàn TỪ HÌNH HỌC (G-M1-05, 6/6 file trả `method:'none'`) — thuật toán **chưa có**,
không phải việc nối dây. Đừng gộp.

---

## PT-03 · Zoom đúng cụm vẽ chính — nghiệm thu + lối thoát

**GAP đóng được:** G-M1-04.

### Thuật toán nguồn
`lib/cad/dxf-plan.ts` `mainClusterBox()` + `lib/cad/import-summary.ts` `zoomExtentsPlan()`
(dòng 172) · `zoomFocusStatusLine()` (210) · `ZOOM_FULL_STATUS_LINE` (215).

### Bằng chứng — 🔴 **KHÔNG CÒN MỒ CÔI**

```bash
grep -rn "mainClusterBox" --include="*.ts" --include="*.tsx" lib components app
# → 9 dòng; nơi gọi thật: components/cad/CadEditor.tsx:416 · lib/cad/import-summary.ts:175
```

`CadEditor.tsx:397` có docblock "B2 ZOOM ĐÚNG CỤM VẼ CHÍNH". Cảnh báo trong
`lib/cad/dxf.ts:763` cũng đã trỏ sang `dxf-plan.ts`.

### Mock
Không cần mock riêng — đây là **hành vi**, chỉ cần 1 dòng thanh trạng thái. Chuỗi đã có sẵn
(`ZOOM_FULL_STATUS_LINE = 'Đang xem toàn bộ bản vẽ, kể cả hình để xa.'`).

### Component đích
| File | Tồn tại | Việc |
|---|---|---|
| `components/cad/CadEditor.tsx` | ✅ OK | **sửa file có sẵn** |
| `components/cad/CadCanvas.tsx` (3511 dòng) | ✅ OK | **sửa file có sẵn** — nơi nghe `cad:zoom-extents` (dòng 395) |

### Phiên sở hữu
**M1** — cùng mạch với PT-01/PT-02, và `zoomExtentsPlan()` là file M1 vừa viết.

### §9
Zoom vào cụm chính = **giấu bớt hình** ⇒ bắt buộc có lối thoát nhìn thấy được:
thanh trạng thái hiện **"Đã bỏ N hình để xa ngoài khung nhìn."** kèm nút **[Xem toàn bộ]**.
Cấm im lặng cắt bớt.

### Nghiệm thu
1. File có bản sao parked xa (ca thật đo được: cách gốc ~12 km) → sau khi nạp, bản vẽ **choán
   ≥50% khung nhìn** (trước đây gần như trống).
2. Bấm **[Xem toàn bộ]** → khung nhìn trở về khung bao toàn bộ entity, thanh trạng thái đổi câu.
3. File **không** có hình để xa → hành vi y hệt trước (không hiện câu "đã bỏ N hình"), không hồi quy.
4. `mainClusterBox()` trả `null` (bản vẽ không dùng layer công trình nào) → **giữ nguyên hành vi cũ**,
   không sập.

### KHÔNG thuộc phiếu này
Đổi thuật toán zoom-extents chung của canvas; đụng `lib/cad/model.ts`.

---

## PT-04 · Thả món từ Thư viện xuống bản vẽ — **VẪN CÒN 0 CHỖ NGHE**

**GAP đóng được:** G-M3-14 (chính) · G-M3-15 (một phần: hai cửa thư viện song song).

### Thuật toán / sự kiện nguồn
- `components/library/LibrarySheet.tsx:42` — `export const LIBRARY_INSTANTIATE_EVENT = 'if:library-instantiate'`,
  phát ở dòng **138** trong `instantiate(item)`.
- `components/library/LibrarySheet.tsx:43` — `LIBRARY_APPLY_EVENT = 'if:library-apply'`, phát ở dòng **143**.
- `lib/cad/library-item-resolve.ts` (MỚI, untracked, phiên M3 đang viết) — `resolveLibraryItem()`
  (dòng 85) · `unresolvedMessage()` (100) · `DROPPABLE_ITEM_KINDS` (45). Phần **thuần**, không fetch, không store.
- Kho hình có thật: `lib/cad/furniture.ts` `BLOCKS` (46 block vector, thả ra `BlockEntity` **giữ
  danh tính**) · `public/cad-library/manifest.json` (54 block .dxf, thả ra đường rời — mất danh tính,
  đúng bệnh G-M3-10).

### Bằng chứng — ✅ **VẪN MỒ CÔI** (đo lại 06/08 ~15:25)

```bash
grep -rn "LIBRARY_INSTANTIATE_EVENT\|if:library-instantiate" --include="*.ts" --include="*.tsx" lib components app \
  | grep -v "^components/library/LibrarySheet.tsx" | grep -v "^lib/cad/library-item-resolve.ts"
# → 0 dòng   (⇒ 1 chỗ phát, 0 chỗ nghe)

grep -rn "LIBRARY_APPLY_EVENT\|if:library-apply" --include="*.ts" --include="*.tsx" lib components app
# → 2 dòng, CẢ HAI trong LibrarySheet.tsx (khai + phát)  ⇒ cũng 0 chỗ nghe
```

### 🔴 Vật cản thật, phải xử trước khi nối dây
`SheetItem` (`lib/library/shelves.ts:63`) chỉ có `id · shelfId · name · code · kind · scope ·
mechanic · imageUrl? · recent?` — **không có khoá nào trỏ tới hình học**. Và chính đầu file
`shelves.ts:6` tự khai: *"DỮ LIỆU MOCK: số đếm trên kệ (46/12/9/31/18…) và danh sách món là dữ liệu
vật mẫu, CHƯA nối kho thật"*. ⇒ Nối tai nghe mà kệ vẫn phục vụ dữ liệu mock thì thả ra **hình sai
tên**, tệ hơn hiện trạng. `resolveLibraryItem()` giải bằng cách **đối chiếu theo tên/mã** — chấp
nhận được cho pha 1, nhưng phải hiện rõ khi không khớp, không thả bừa.

### Mock
🟡 Có: `docs/mocks/mock-if-thu-vien.html` (trang ĐỎ ở cửa kiểm — **sửa cho xanh trước khi port**,
luật §0.1 của phiếu port giao diện). Trang này dựng đủ 6 kệ có số lượng.
⛔ **KHÔNG** dùng `docs/mocks/Thư viện.dc.html` — trỏ 4 trang con không tồn tại, ruột chết dữ liệu
(G-M5-05).

### Component đích
| File | Tồn tại | Việc |
|---|---|---|
| `components/cad/CadEditor.tsx` | ✅ OK | **sửa file có sẵn** — thêm listener cạnh 7 listener `cad:*` đã có (dòng 107/108/213/223/224/2150/2151), **cùng idiom**, không đẻ cơ chế mới |
| `components/library/LibrarySheet.tsx` (357 dòng) | ✅ OK | **sửa file có sẵn** — toast hiện đang nói dối ("Đã tạo bản làm việc") khi chưa ai nghe; đổi theo kết quả thật |
| `lib/library/shelves.ts` | ✅ OK | **sửa file có sẵn** — thêm khoá trỏ kho hình (hoặc để `resolveLibraryItem` khớp theo mã, ghi rõ chọn cách nào) |
| `lib/cad/library-item-resolve.ts` | ✅ OK (untracked) | **file mới của phiên M3** — chỉ dùng, đừng viết bản thứ hai |
| `components/library/ClusterPanel.tsx` (341 dòng) | ✅ OK | **đối chiếu, không sửa** — đây là đường ĐANG CHẠY THẬT (gọi thẳng `addEntities()`), dùng làm mẫu |

### Phiên sở hữu
**M3 (nội thất · thư viện · BOQ)** — sở hữu cả `lib/library/*`, `lib/cad/block-library.ts` và
`library-item-resolve.ts` vừa viết; listener trong `CadEditor.tsx` là phần giao, phải phối với M1
(xem "Rủi ro va chạm" cuối file).

### §9
- Món **khớp kho ①** (`BLOCKS`) → thả `BlockEntity` thật, không cần ô trống nào.
- Món **chỉ khớp kho ②** (.dxf) → thả được nhưng mất danh tính ⇒ dòng nhắc:
  **"Món này thả ra đường rời — chưa đếm được vào bảng."** (11 từ) + nút **[Hiểu rồi]**.
- Món **không khớp kho nào** → **cấm thả bừa**. Nhãn nút "Dùng" chuyển `disabled`, lý do:
  **"Chưa có hình cho món này."** (6 từ) + nút **[Báo thiếu]** ghi vào hàng đợi thư viện.
- Kệ đang phục vụ dữ liệu mock → chip **"Dữ liệu mẫu"** ngay cạnh tên kệ (§9 mục 4: không xoá ô
  trống cho gọn mắt).

### Nghiệm thu
1. Mở Thư viện → bấm "Dùng" trên **1 món khớp kho ①** → có **BlockEntity** mới trong `doc.entities`
   (đọc `window.__cadStore`), **`type === 'block'`**, và thấy hình trên canvas.
2. Bảng thống kê (`SchedulePanel`) đếm đúng **+1** đúng tên món, **không** rơi vào "Chưa phân loại".
3. Bấm "Dùng" trên món **không khớp kho nào** → **không có entity nào được thêm** (`doc.entities.length`
   không đổi) và UI nói đúng câu §9, **không** hiện toast "Đã tạo bản làm việc".
4. `Ctrl/⌘Z` một lần → món vừa thả biến mất (đi qua đúng đường `addEntities` có lịch sử).

### KHÔNG thuộc phiếu này
- Sửa việc block .dxf bị làm phẳng mất danh tính (G-M3-10 / G-M1-06) — đó là việc `srcInsertId`,
  phiếu riêng của M1.
- Gộp panel "Nội thất (block)" trong `CadEditor.tsx` và trang `/cad-library-demo` về một cửa
  (G-M3-15 phần còn lại) — làm SAU khi thả chạy được, kẻo xoá cửa cũ trước khi cửa mới hoạt động.
- `LIBRARY_APPLY_EVENT` (áp preset lên vật đang chọn) — cùng bệnh nhưng khác việc, tách phiếu.

---

## PT-05 · Món đã đo → block + ba hình chiếu — **VẪN CHƯA CÓ NÚT**

**GAP đóng được:** G-M3-03.

### Thuật toán nguồn
- `lib/vision/match-template.ts` (496 dòng) — `matchTemplate(target, opts)` (dòng 339), bước ⑤
  khớp block thư viện theo tỉ lệ w:d. Có ngưỡng chặn (dòng 103): dưới ngưỡng trả `null`, **không ép khớp bừa**.
- `lib/vision/ortho-projection.ts` (232 dòng) — bước ⑥ ba hình chiếu.
- `lib/vision/to-cad.ts` (229 dòng, MỚI untracked, phiên M3 đang viết) — cầu nối sang
  `clusterPrimsToEntities` của `lib/cad/block-library.ts`.

### Bằng chứng — ✅ **VẪN MỒ CÔI ở tầng UI**

```bash
grep -rn "match-template\|ortho-projection\|matchTemplate" --include="*.ts" --include="*.tsx" components app
# → 0 dòng   (chỉ lib/ tự gọi nhau: ortho-projection.ts:32 import match-template)

grep -rn "lib/vision/to-cad\|from './to-cad'" --include="*.ts" --include="*.tsx" components app lib | grep -v to-cad.test
# → 0 dòng
```

Trùng khớp `M3-OUT.md §1b`. Lưu ý cho phiên sau: quét mồ côi theo **từng file** sẽ bỏ sót cặp này
vì hai file import lẫn nhau — phải quét theo **cụm** (không có ai ngoài cụm gọi vào).

### Mock
❌ Chưa có (G-M5-07: trang `tool-window-sketch2photo.html` tả việc KHÁC — phác thảo → ảnh thật).
Cửa sổ công cụ bốc tách/đo món chưa có hợp đồng. **Không nằm trong 5 màn VIỆC 2**; ghi vào mục
"Chưa làm" cuối file để đặt phiếu spec riêng.

### Component đích
| File | Tồn tại | Việc |
|---|---|---|
| `components/render-studio/ToolModeForm.tsx` (698 dòng) | ✅ OK | **sửa file có sẵn** — đây là nơi đã gọi `exportMeasurementSpecSheet` (dòng 18), tức nơi "món đã đo" đang sống |
| `lib/vision/to-cad.ts` | ✅ OK (untracked) | **file mới của phiên M3** |
| `lib/cad/block-library.ts` | ✅ OK | **đọc, không sửa** — `clusterPrimsToEntities()` dòng 203 |

### Phiên sở hữu
**M3** — sở hữu vision + thư viện block, và đang viết `to-cad.ts`.

### §9
Sau khi đo xong 1 món, `ToolModeForm` phải hiện **cả ba nút** dù mới code được một:
- **[Xuất phiếu số đo]** — đã chạy (`measurement-spec-sheet.ts`).
- **[Tìm block giống]** — nối `matchTemplate()`.
- **[Vẽ ba hình chiếu]** — nối `ortho-projection.ts`; chưa nối thì `disabled` + lý do:
  **"Chưa vẽ được — cần block khớp trước."** (7 từ).
- `matchTemplate` trả `null` → **cấm** hiện block gần đúng. Câu: **"Không có block nào đủ giống."**
  (6 từ) + nút **[Thêm vào thư viện]**.

### Nghiệm thu
1. Món có kích thước khớp 1 block trong manifest → **[Tìm block giống]** ra đúng block đó, kèm
   **số** độ lệch tỉ lệ (không phải chữ "khớp").
2. Món kích thước bịa (vd 9999×9999) → ra đúng câu "không đủ giống", **không** đề xuất block nào.
3. **[Vẽ ba hình chiếu]** → 3 nhóm entity vào `doc`, ba hình **không chồng lên nhau** (so bbox).
4. `tsc -p .` sạch; test cũ của `match-template` / `ortho-projection` vẫn xanh.

### KHÔNG thuộc phiếu này
Bốc tách **N món** trong một ảnh (G-M3-01) và kiểu dữ liệu BẢNG cho luồng node (G-M3-02) — thuật
toán chưa có, không phải nối dây.

---

## PT-06 · Ống hút thuộc tính (`matchProps`) — lõi thuần, 0 nơi gọi

**GAP:** chưa có dòng trong `GAP-IF.md`. Nguồn yêu cầu: `docs/SPEC-LENH-VE-IF.md` §3/§4 khuyết ①
(AutoCAD MATCHPROP — chính docblock ghi *"rẻ mà được yêu nhất"*).

### Thuật toán nguồn
`lib/cad/eyedropper.ts` (60 dòng) — `matchProps()` (dòng 46) · `matchPropsOne()` (58) ·
`DEFAULT_MATCH_PROP_FIELDS` (38) = `['layer','color','lineweight','lineType','specId']`.

### Bằng chứng — ✅ MỒ CÔI

```bash
grep -rln "eyedropper\|matchProps" --include="*.ts" --include="*.tsx" lib components app | grep -v eyedropper.ts
# → 0 dòng
```

### Mock
🟡 Một phần: `docs/mocks/mock-cad-shell-v5.html` có dock công cụ dưới (7 công cụ) — thêm 1 công cụ
vào đúng dock đó, **không** đẻ toolbar mới. Trang này **sạch** ở cửa kiểm (Bảng A #A3).

### Component đích
| File | Tồn tại | Việc |
|---|---|---|
| `components/cad/CadToolbar.tsx` (601 dòng) | ✅ OK | **sửa file có sẵn** — thêm nút, dùng `fire('cad:…')` như dòng 453 |
| `components/cad/CadCanvas.tsx` (3511 dòng) | ✅ OK | **sửa file có sẵn** — bắt 2 lần click (nguồn → đích) |
| `lib/cad/store.ts` (949 dòng) | ✅ OK | **sửa file có sẵn** — gọi `updateEntities` để vào lịch sử hoàn tác |

### Phiên sở hữu
**M2 (hành vi sửa)** — đúng mảng "lệnh sửa hình trên canvas".

### §9
Trường `specId` (mã vật liệu) chép theo hay không là lựa chọn, không phải mặc định ẩn:
hộp nhỏ khi bật công cụ, 5 ô tick **hiện đủ 5 trường**, ô nào chưa nối thì `disabled` kèm lý do
tại chỗ. Câu mách nước: **"Bấm vật nguồn, rồi bấm vật cần đổi."** (8 từ).

### Nghiệm thu
1. Hút từ 1 đường sang 3 đường → cả 3 đổi đúng **layer + màu + lineweight**, hình học **không đổi**
   (so toạ độ trước/sau).
2. Bỏ tick `specId` → mã vật liệu của đích **giữ nguyên**.
3. `⌘Z` một lần hoàn tác **cả 3** đường (một bước lịch sử, không phải ba).
4. `Esc` giữa chừng → thoát công cụ, không sửa gì.

### KHÔNG thuộc phiếu này
Chép thuộc tính BIM/`elementType` (đó là phân loại, docblock `eyedropper.ts` cố ý loại ra).

---

## PT-07 · Gõ số SAU thao tác (VCB) — lõi thuần, 0 nơi gọi

**GAP:** chưa có dòng riêng; họ hàng gần nhất là G-M2-06 (lệnh sửa hình không có bản xem trước).
Nguồn yêu cầu: `docs/SPEC-LENH-VE-IF.md` §1/§4 khuyết ② (SketchUp Value Control Box).

### Thuật toán nguồn
`lib/commands/vcb.ts` (103 dòng) — `parseVcbToken()` (dòng 42) · `applyVcbToMoveCopy()` (92) ·
`VcbToken` (33) · `MoveCopyPlan` (73). Nhận `3x` (nhân bản 3 lần) và `/3` (chia đều, giữ tổng khoảng).

### Bằng chứng — ✅ MỒ CÔI

```bash
grep -rln "commands/vcb\|parseVcbToken\|applyVcbToMoveCopy" --include="*.ts" --include="*.tsx" lib components app | grep -v "vcb.ts"
# → 0 dòng
```

Docblock của chính file đã ghi: phần trạng thái "ô VCB đang mở cho thao tác nào" là **state UI**,
cố ý để ngoài — tức file này **sinh ra để chờ một nơi gọi chưa từng tồn tại**.

### Mock
🟡 Một phần: `mock-cad-shell-v5.html` có thanh chân trang; `mock-cad-revit-2026-08-03.html` có
dòng lệnh `⌘Gõ lệnh: W · D · WD · ROOM · RL`. Ô VCB đứng **cùng chỗ** đó, không thêm vùng mới.

### Component đích
| File | Tồn tại | Việc |
|---|---|---|
| `components/cad/CadCanvas.tsx` | ✅ OK | **sửa file có sẵn** — nơi giữ thao tác đang chạy |
| `components/cad/CadToolbelt.tsx` (57 dòng) | ✅ OK | **sửa file có sẵn** — file nhỏ, đã dùng idiom `cad:cmd-key`/`cad:cmd-focus` |
| `lib/commands/vcb.ts` | ✅ OK | **đọc, không sửa** |

### Phiên sở hữu
**M2 (hành vi sửa)** — đây đúng là "sửa xong rồi gõ số chỉnh lại".

### §9
Ô VCB phải hiện **ngay cả khi chưa nối đủ lệnh**: hiện mờ với nhãn
**"Gõ số để chỉnh lại"**; lệnh nào chưa nhận VCB thì khi kết thúc thao tác ô ghi:
**"Lệnh này chưa nhận số — dùng Dời hoặc Nhân bản."** (10 từ).

### Nghiệm thu
1. Dời một vật đại → gõ `1200` → Enter → khoảng dời đúng **1200 mm** (đo toạ độ).
2. Gõ tiếp `800` (chưa bắt đầu thao tác kế) → **chỉnh lại** thành 800, **không** cộng dồn thành 2000.
3. Gõ `3x` → ra **3 bản**, khoảng cách bằng khoảng vừa kéo.
4. Gõ `/3` → tổng khoảng **giữ nguyên**, chia đều 3 khoảng.
5. Gõ chữ bậy (`abc`) → ô báo lỗi tại chỗ, **không** sửa gì trong `doc`.

### KHÔNG thuộc phiếu này
Bản xem trước (bóng vật sắp dời, G-M2-06) — cùng lệnh nhưng khác việc, tách phiếu để không phình.

---

## PT-08 · Xuất vật liệu D5 · V-Ray · suy PBR theo danh mục — 3 module, 0 nơi gọi

**GAP:** chưa có dòng trong `GAP-IF.md` (phát hiện mới của phiếu này).
Nguồn yêu cầu: `docs/SPEC-VAT-LIEU-PBR-IF.md` §1 và §4 mục 2.

### Thuật toán nguồn
- `lib/materials/export-d5.ts` (69 dòng) — dịch `MaterialPbr` → tham số D5 (gần passthrough).
- `lib/materials/export-vray.ts` (131 dòng) — dịch sang V-Ray (có bảng đổi nghĩa công tắc).
- `lib/materials/pbr-from-category.ts` (89 dòng) — suy roughness/metallic từ TÊN DANH MỤC (pha 1,
  chờ đo thật).

### Bằng chứng — ✅ MỒ CÔI cả ba

```bash
grep -rn "export-d5\|export-vray\|pbr-from-category\|exportD5\|exportVray\|pbrFromCategory" \
  --include="*.ts" --include="*.tsx" lib components app | grep -v "\.test\.ts"
# → 9 dòng, TẤT CẢ là chú thích trong docblock (schema.ts:5,75,78 · materials.ts:61 · và 3 file tự nhắc mình)
# → 0 dòng gọi hàm thật
```

### Mock
🟡 `docs/mocks/mock-material-sphere-2026-08-03.html` (sạch, Bảng A #A7) tả quả cầu xem trước —
chưa tả **nút xuất**. Cần bổ sung 1 cụm nút vào trang đó, không dựng trang mới.

### Component đích
| File | Tồn tại | Việc |
|---|---|---|
| `components/materials/MaterialFormModal.tsx` (227 dòng) | ✅ OK | **sửa file có sẵn** — nơi sửa 1 vật liệu, chỗ tự nhiên của nút "Xuất cho…" |
| `components/materials/MaterialsScreen.tsx` (172 dòng) | ✅ OK | **sửa file có sẵn** — xuất cả lô |
| `components/library/LibrarySheet.tsx` | ✅ OK | **sửa file có sẵn** — kệ "Vật liệu ATLAS" |

### Phiên sở hữu
**M3** — sở hữu kho vật liệu + thư viện.

### §9
Ba đích xuất phải **hiện đủ ba** ngay cả khi mới nối một:
**[Xuất D5]** · **[Xuất V-Ray]** · **[Xuất glTF]**. Đích chưa nối để `disabled` kèm lý do riêng
từng cái (§9 cấm dùng chung một câu "đang làm").
Vật liệu **suy PBR theo danh mục** (chưa đo thật) phải mang chip **"Số suy đoán"** — luật K3
(khai báo thắng suy đoán, phải lộ cờ `inferred` ra UI).

### Nghiệm thu
1. Xuất 1 vật liệu → tệp ra có **đúng tên trường theo quy ước D5** (`albedo`, không phải `baseColor`).
2. Vật liệu thiếu trường PBR → xuất ra **giá trị mặc định trung tính** (`schema.ts:75`), không phải `undefined`.
3. Vật liệu suy từ danh mục → UI hiện chip "Số suy đoán"; khai số thật → chip **biến mất**.
4. `tsc -p .` sạch; test cũ của 3 module vẫn xanh.

### KHÔNG thuộc phiếu này
Sửa `lib/materials/schema.ts` (hình dạng `MaterialPbr`) · đụng ATLAS sync (`lib/lark/*`).

---
---

# PHẦN II — SPEC HỢP ĐỒNG (cho Claude Design dựng mock)

> **Trước khi viết mỗi spec, đã grep `docs/mocks/*.html` (57 trang, không kể `_archinote/`).**
> Lệnh và kết quả ghi ngay trong từng spec. Trang nào có sẵn thì trỏ tới, không viết thừa.
> Mọi spec: **2 theme bắt buộc** (`data-theme` sáng + tối, luật giao diện ②) · biến màu qua CSS var
> (`--panel` `--border` `--t1` `--t4` `--accent` `--field`), cấm hex tự chế (luật ④) · icon `lucide`.
> **TRUNG TÍNH**: mọi số liệu mẫu là số bịa tròn trịa, không tên khách, không tên studio, không hồ sơ thật.

## Hệ kích thước đang dùng (đo trong repo — spec phải bám, không tự chế)

| Loại panel | Bề rộng | Nguồn đo |
|---|---|---|
| Inspector dính cạnh phải | **236 px** | `docs/mocks/mock-cad-shell-v5.html` `.insp{width:236px}` |
| Panel nổi hẹp | **280 px** | `components/cad/CadEditor.tsx:1386`, `:1525` |
| Panel nổi vừa | **320–340 px** | `CamPathPanel.tsx:33` (320) · `CadEditor.tsx:1750`, `:1905` (340) |
| Panel nổi rộng | **360–380 px** | `SchedulePanel.tsx:104` (360) · `CadEditor.tsx:1999` (380) |
| Hộp thoại giữa màn | **min(520px, 100% − 32px)** | panel báo cáo nạp trong `CadEditor.tsx` |
| Nhịp dòng | `--row: 28px` (gọn) / `44px` (thoáng) | `mock-cad-shell-v5.html` |

---

## SP-01 · Màn NHẬP BẢN VẼ — chọn tệp → tiến độ → huỷ → báo cáo nạp

**GAP:** G-M5-01. **Phiên:** M5 (giao diện), dữ liệu từ M1.

### a. Đã có mock chưa? — **KHÔNG**

```bash
cd docs/mocks && grep -ril "nhập bản vẽ\|báo cáo nạp\|tiến độ nhập\|nhập tệp\|Nhập DXF" *.html
# → 0 kết quả (57 trang)
```

### b. Bố cục
Hộp thoại nổi **giữa-trên**, `top:70`, `width: min(520px, 100% − 32px)`, `maxHeight: calc(100% − 100px)`,
cuộn dọc trong ruột. Vỏ **cùng khuôn** với panel xuất DXF đã có (đầu panel + nút ✕), không đẻ khuôn thứ hai.
**Ba trạng thái nối tiếp trong CÙNG một hộp**, không nhảy sang hộp khác:

```
① CHỌN TỆP → ② ĐANG NẠP (tiến độ + huỷ) → ③ BÁO CÁO NẠP
                        ↘ ④ LỖI
```

### c. Danh sách trường — lấy đúng từ `DxfLoadReport` (`lib/cad/dxf.ts:456`), cấm bịa trường mới

**Trạng thái ① Chọn tệp**
| Nhãn hiện trên UI | Kiểu | Nguồn |
|---|---|---|
| (vùng thả) "Kéo bản vẽ vào đây" | — | — |
| [Chọn tệp] | nút | mở `<input type=file>` sẵn có của `CadEditor` |
| "Nhận .dxf · .dwg" | chữ phụ | — |

**Trạng thái ② Đang nạp**
| Nhãn | Kiểu | Nguồn |
|---|---|---|
| Tên tệp | chữ | `File.name` |
| Dung lượng | chữ, MB 1 số lẻ | `File.size` |
| Giai đoạn | chữ | **giai đoạn thật**, không phải % giả — đường DWG đã có 2 mốc `reading` / `converting` (`lib/cad/dwg.ts`); đường DXF **chưa có** ⇒ xem §e |
| Đã chạy | chữ, giây | nhịp 1 s (đường DWG đã làm vậy) |
| [Huỷ] | nút | `AbortController` — cơ chế đã có ở `openDwgFile(opts.signal)` |

**Trạng thái ③ Báo cáo nạp** — 8 trường của `DxfLoadReport`, ánh xạ 1-1:
| Nhãn hiện trên UI | Kiểu | Trường nguồn |
|---|---|---|
| "Đã đọc **N** hình từ *tên tệp*" | câu | `totalEntities` |
| Bảng **Đọc được**: Loại hình \| Số hình | bảng 2 cột | `entitiesRead` (khoá `line/polyline/circle/arc/text/hatch/dim/…` → nhãn Việt qua bảng `DXF_TYPE_VI` đã có trong `CadEditor.tsx`) |
| "N lớp · N tên block · N lần chèn đã rã thành hình" | câu phụ | `layers` + `blocksExpanded` |
| Bảng **Bỏ qua — không có trên bản vẽ**: Loại bản ghi \| Số lượng | bảng 2 cột, **ẩn khi rỗng** | `skipped` (nhãn Việt qua `SKIPPED_LABELS`, `lib/cad/import-summary.ts:35`) |
| Danh sách **Cảnh báo** | danh sách chữ | `warnings` |
| **Đoán phân loại**: N hình được đoán · bảng "layer → loại" | bảng | `elementTypes.inferredCount` + `elementTypes.byLayer` |
| Khung bao | chữ, m ×2 | `bbox` |
| "Đã bỏ **N** hình để xa ngoài khung nhìn." + [Xem toàn bộ] | câu + nút | `zoomExtentsPlan()` (`import-summary.ts:172`) |

**Trạng thái ④ Lỗi**: 1 câu "điều gì hỏng + cách thoát", **có tên tệp + kích thước + phiên bản DXF/DWG**
(bảng `DWG_VERSION_NAMES` đã có) + nút [Chọn tệp khác]. Cấm câu đổ lỗi người dùng.

### d. Trạng thái & §9
| Ca | Hiện gì |
|---|---|
| Rỗng (chưa chọn) | vùng thả + [Chọn tệp] |
| Đang chạy | tiến độ + [Huỷ] **luôn bấm được** |
| Không bỏ sót gì | câu "Không bỏ sót bản ghi nào", **giấu** bảng Bỏ qua |
| Không đoán được layer nào | giấu bảng "Đoán phân loại", **không** hiện `0` |
| §9 — sửa phân loại sai | nút `disabled` **"Sửa phân loại"**, lý do **"Chưa sửa được tại đây — mở Inspector để đổi."** + nút thật **[Mở Inspector]** |
| §9 — tiến độ đường DXF | đường DXF hiện **chưa chạy worker** (G-M1-01) ⇒ vẽ ô tiến độ nhưng ghi **"Đang nạp — chưa huỷ được ở bản vẽ DXF."** (9 từ), nút [Huỷ] `disabled`. **Cấm giấu ô này cho gọn** — nó là bằng chứng còn việc |

### e. Nút và việc mỗi nút làm
`[Chọn tệp]` mở hộp chọn · `[Huỷ]` phát abort, đóng hộp, **không** đổi bản vẽ đang mở ·
`[Xem toàn bộ]` zoom về khung bao đầy đủ · `[Mở Inspector]` mở dải trang Inspector ·
`[Đóng]`/`Esc` đóng hộp, giữ nguyên bản vẽ vừa nạp.

### f. 2 theme
Chụp đủ sáng + tối cho **cả 4 trạng thái** (4 ảnh × 2 = 8 ảnh). Bảng số dùng `tabular-nums`.

---

## SP-02 · Inspector CẤU KIỆN (tường · cửa · khối)

**GAP:** G-M5-02. **Phiên:** M5.

### a. Đã có mock chưa? — 🟡 **CÓ MỘT NỬA. Đây là đính chính GAP-IF.**

```bash
cd docs/mocks && grep -ril "inspector" *.html   # → 10 trang
```

`docs/mocks/mock-cad-revit-2026-08-03.html` **đã vẽ trọn Inspector TƯỜNG** (đọc markup thật, không suy từ ảnh):
`<aside class="insp">` — tiêu đề *Tường · W-02* + 5 nhóm: **Đặt theo** (Tim tường / Mặt trong /
Mặt ngoài) · **Loại · dùng chung** (tên loại + Dày + ô vật liệu) · **Riêng cái này** (Cao / Chân /
Dài / Hướng) · **Nối tường** · **Trong tường này** (liệt kê cửa con D-02 900×2 200).

⇒ Câu trong `GAP-IF.md` G-M5-02 *"Mock CAD duy nhất có Inspector chỉ vẽ trang phòng"* **SAI**.
`PHIEU-PORT-GIAO-DIEN` #A5 đã nói gần đúng ("ứng viên gần nhất") nhưng vẫn nhẹ tay.
**Việc thật còn thiếu: trang CỬA và trang KHỐI, không phải trang tường.**

### b. Code đã đi trước mock — đừng port ngược
`components/studio/CadInspectorPages.tsx` (147 dòng) đã là **dải 4 trang** theo selection:
`Khối` (block) · `Phòng` (nhãn text khớp `ROOM_NAME_RE`) · `Tường` (`isWallLikeEntity`) · `Chung` (mọi selection).
Ruột tái dùng `BimAssignBox` / `RoomTypeBox` / `WallTypePanel` (export từ `CadEditor.tsx`) +
`ShapeInfoPanel`. Nhớ bố cục rollout theo **loại vật** (`kindKey = 'cad.block' | 'cad.room' | 'cad.wall' | 'cad.generic'`).

### c. Việc của mock mới
Bổ sung **trang CỬA** và **trang KHỐI** vào đúng dải 4 trang đó, cùng ngôn ngữ hình với trang Tường
đã vẽ trong `mock-cad-revit`. Bề rộng **236 px** (khớp `.insp` của `mock-cad-shell-v5.html`).

| Trang | Nhóm | Trường (nhãn Việt) | Nguồn dữ liệu thật |
|---|---|---|---|
| **Cửa** | Loại · dùng chung | Loại cửa · Rộng · Cao | `BlockEntity` + `BLOCK_MAP` (`lib/cad/furniture.ts`) |
| | Riêng cái này | Chiều mở · Cao ngưỡng | `Space` đảo chiều — đã ghi trong mock revit |
| | Tường chủ | tên tường chứa cửa + [Chọn tường] | `hostId` (`lib/cad/hosting.ts` `syncHostedOpenings`) |
| **Khối** | Thông tin | Tên · Mã · Rộng×Sâu | `BLOCK_MAP` |
| | Biến thể | danh sách biến thể | `ShapeInfoPanel` |
| | Vật liệu | ô swatch + [Đổi vật liệu] | `specId` — mở Thư viện kệ `render-mat` |
| | Thống kê | "Có N cái trong bản vẽ" + [Chọn tất cả] | `SelectSameKindButton` (đã có) |
| **Chung** (giữ) | BIM · IFC | `elementType` + cờ **Suy đoán** | `elementTypes` của `DxfLoadReport` (K3) |

### d. Trạng thái & §9
| Ca | Hiện gì |
|---|---|
| Không chọn gì | **Inspector không tồn tại trong DOM-flow**, canvas rộng hết cỡ (mock v5 đã làm đúng: `.insp{display:none}`) |
| Chọn nhiều loại khác nhau | chỉ còn trang **Chung** |
| `elementType` là suy đoán | chip **"Suy đoán"** cạnh giá trị + nút [Khai đúng] |
| §9 — lịch sử sửa cấu kiện | **chưa code** ⇒ trang có ô trống nhãn "Lịch sử sửa", `disabled`, lý do **"Chưa ghi lịch sử theo cấu kiện."** (6 từ) + nút thật **[Mở lịch sử bản vẽ]** (`HistoryPanel` đã có) |
| §9 — số khai ≠ hình vẽ (G-M2-08) | khai 220 mm mà vẽ 100 mm ⇒ dòng đỏ **"Số khai lệch hình vẽ — 220 với 100."** + nút [Lấy theo hình] |

### e. 2 theme — bắt buộc cả 4 trang × 2 = 8 ảnh.

---

## SP-03 · Màn NHẬN ĐỀ BÀI

**GAP:** G-M5-11. **Phiên:** M5.

### a. Đã có mock chưa? — **KHÔNG (chỉ có nhãn rời)**

```bash
cd docs/mocks && grep -ril "đề bài\|brief" *.html
# → 4 trang, nhưng đọc markup thật thì chỉ là NHÃN, không phải màn:
#   mock-mood-collab.html : <span class="tag">ĐỀ BÀI</span> (một thẻ sticky trên canvas)
#   mock-library.html     : <div class="mmn">Đề bài</div> (một nút trên bản đồ màn)
#   mock-designsystem-stagemap.html · mock-files-polished.html : chỉ nhắc chữ
```

### b. Code đã có gì (spec phải bám, không bịa)
`components/cad/AiBriefPanel.tsx` (557 dòng) — panel **4 bước** đang lọt trong màn vẽ:
BƯỚC 1 hiện trạng (nhập hồ sơ CAD **hoặc** dùng bản vẽ đang mở) · BƯỚC 2 tự chạy
`lib/cad/dossier-check.ts` · BƯỚC 3 `generateLayoutOptions()` sinh 3 phương án, chấm điểm bằng
`checkStandards()` · BƯỚC 4 bấm **Nhận** → `PairwisePerceptron` học.
Lời giải thích từng phương án có sẵn: `explainLayoutOption()` (`lib/cad/ai-layout-feedback.ts:61`).

### c. Bố cục đề nghị
Màn **toàn chiều rộng** (không phải panel nổi) vì đây là bước MỞ ĐẦU, chưa có bản vẽ để nhìn.
Ba cột: trái **đề bài** (360 px) · giữa **3 phương án** (thẻ ngang) · phải **lý do & điểm** (320 px).

| Vùng | Trường (nhãn Việt) | Kiểu | Nguồn |
|---|---|---|---|
| Đề bài | Ô nhập lời | chữ nhiều dòng | `parseDescription()` (`lib/cad/ai-assist.ts`) |
| | Số người | số | (chưa có trường — xem §9) |
| | Danh sách phòng cần có | thẻ thêm/bớt | `TargetRoom[]` |
| | Tỉ lệ quy đổi | số | `scaleFactor` (đã có) |
| Hiện trạng | [Nhập hồ sơ CAD] / [Dùng bản vẽ đang mở] | 2 nút | BƯỚC 1 |
| | Kết quả check hồ sơ | danh sách | `dossier-check.ts`, `rooms.length` |
| Phương án | 3 thẻ, mỗi thẻ: hình thu nhỏ · điểm · số vi phạm | thẻ | `LayoutOption` + `checkStandards` |
| Lý do | danh sách câu | chữ | `explainLayoutOption()` |

### d. Trạng thái & §9
| Ca | Hiện gì |
|---|---|
| Rỗng | ô nhập + 1 câu mời + [Nhập hồ sơ CAD] (khuôn "Trống", `SPEC-NGON-NGU-CHI-DAN` §2) |
| Không có hiện trạng | **KHÔNG chặn** (luật X2) — vẫn sinh phương án, ghi rõ **"Chưa có hiện trạng — máy vẽ tường mới."** (8 từ) |
| Dò không ra phòng nào | **"Chưa dò được phòng nào có biên kín."** (7 từ) + nút [Xem cách khép biên] |
| §9 — trường **Số người** | dữ liệu chưa có đường đi (G-M3-16: số nhân sự → số chỗ chưa tồn tại) ⇒ ô nhập được nhưng dưới ghi **"Chưa dùng để tính số chỗ."** (6 từ) + nút [Vì sao?] |
| §9 — duyệt theo phần (KS3) | **cấm** nút "Nhận cả gói"; mỗi phòng trong phương án có ô tick riêng. Chưa code thì tick `disabled` + lý do **"Chưa chọn lẻ từng phòng được."** (6 từ) |

### e. 2 theme · nút
`[Sinh phương án]` · `[Nhận]` (áp vào bản vẽ + dạy máy) · `[Sinh lại]` · `[Vì sao?]` (mở lý do).
**Seed phải hiện ra** và chép được (luật KS2 §0e).

---

## SP-04 · ZONING theo chương trình

**GAP:** G-M5-12 (khoảng trống lớn nhất của T3). **Phiên:** M5, dữ liệu M1.
**Chặn bởi:** PT-02 (phải có đường truyền `PlanGrid`/`CoreZone[]` ra khỏi panel báo cáo nạp).

### a. Đã có mock chưa? — **KHÔNG, tuyệt đối**

```bash
cd docs/mocks && grep -ril "zoning\|chia khu\|xếp tầng\|bảng diện tích\|phân khu" *.html
# → 0 kết quả (57 trang)
```
Lưu ý: panel `ZonePanel.tsx` đang có trong repo là **zone MÀU để trình bày**, việc khác — đừng nhầm.

### b. Bố cục
Màn chia đôi: trái **bản vẽ có phủ khu** (co giãn) · phải **bảng số** (380 px, mức "panel nổi rộng").
Dưới bảng số là **thanh xếp tầng** (ngang, cao 44 px/tầng).

### c. Bốn khối nội dung — bám thứ đã có trong code

**① Chia khu**
| Nhãn | Kiểu | Nguồn thật |
|---|---|---|
| Lưới trục | "6 trục chữ · 5 trục số" | `planGridAxes()` (`lib/cad/dxf-plan.ts:147`) |
| Lõi cứng | "N vùng" + tô khác màu | `planCoreZones()` (`:210`) |
| Cụm vẽ chính | "28,5 × 26,2 m" | `mainClusterBox()` (`:71`) |
| Khu đã chia | danh sách tên khu | `LayoutSpec` của `ai-assist.ts` |

**② Bảng diện tích từng khu**
| Cột | Kiểu | Nguồn |
|---|---|---|
| Khu | chữ | `TargetRoom.name` |
| Diện tích (m²) | số, `tabular-nums` | ⚠️ **chưa tính được từ hình học** (G-M1-05: 6/6 file trả `method:'none'`) |
| Tỉ lệ (%) | số | tính từ cột trên |
| Nguồn số | chip: *khung tên* / *hình học* / *khai tay* | `planDeclaredAreaM2()` (`:255`) |

**③ Đối chiếu số người ↔ diện tích**
| Cột | Nguồn |
|---|---|
| Khu · Số người · m²/người · Chuẩn áp · Đạt/Không | `checkStandards()` + `INTL_OCCUPANT_LOAD` (`lib/cad/standards/intl-occupant-load.ts`) + `NEUFERT` (`neufert.ts`) + `checkMeetingArea()` (`lib/cad/workstation-clusters.ts:463`, TCVN 4601 1,8 m²/người) |

**④ Xếp bộ phận theo tầng** — cột dọc mỗi tầng, kéo-thả khu giữa các tầng. Nguồn: `Base.storey`
(optional, `lib/cad/model.ts`).

### d. Trạng thái & §9
| Ca | Hiện gì |
|---|---|
| Chưa nạp bản vẽ | **KHÔNG chặn** (X2) — vẫn chia khu trên khung trống, ghi **"Chưa có mặt bằng — đang chia trên khung trống."** (8 từ) + [Nhập bản vẽ] |
| Không đọc được lưới trục | ẩn khối ①, hiện **"Chưa đọc được lưới trục của bản vẽ này."** (8 từ) |
| §9 — **cột Diện tích** | thuật toán chưa có (G-M1-05) ⇒ ô hiện `—` + chú **"Chưa đo được từ hình — khai tay."** (7 từ) + ô nhập tay bên cạnh. **CẤM giấu cột này** |
| §9 — **xếp tầng** | chưa code ⇒ thanh tầng vẽ đủ, kéo-thả `disabled`, lý do **"Chưa xếp được — mỗi bản vẽ một tầng."** (8 từ) |
| §9 — ràng buộc "không cắt vách ngang cột" | chưa có `elementType` khai báo (G-M1-09) ⇒ checkbox `disabled`, lý do **"Chưa biết đâu là cột — cần khai loại."** (8 từ) + nút [Khai loại theo lớp] |

### e. Nút
`[Chia khu tự động]` · `[Thêm khu]` · `[Kiểm lại]` (chạy `checkStandards`) · `[Xuất bảng]`.

### f. 2 theme · số dùng `tabular-nums` · bảng rộng phải cuộn ngang trong khung riêng, thân trang không cuộn ngang.

---

## SP-05 · BẢNG KẾT QUẢ KIỂM sau bố trí

**GAP:** G-M5-13. **Phiên:** M5.

### a. Đã có mock chưa? — **KHÔNG.** Nhưng 🔴 **đính chính GAP-IF**

```bash
cd docs/mocks && grep -ril "kết quả kiểm\|lối đi\|clearance\|va chạm\|m²/người" *.html
# → 0 kết quả
grep -rn "checkStandards" --include="*.tsx" components app        # → CadEditor.tsx:1651,1678,1683 · AiBriefPanel.tsx:252
grep -rln "Kiểm chuẩn" --include="*.tsx" components app           # → 4 file (StatusBar · CadEditor · CadCanvas · AiBriefPanel)
```

⇒ Câu *"giao diện chưa có bảng nào để đổ kết quả kiểm"* **không đúng**: panel **Kiểm chuẩn
(TCVN/QCVN/ISO)** đã tồn tại và chạy — `StandardsPanel` khai ở `CadEditor.tsx:1643`, render ở
`:1754` (panel nổi `right:12 · top:400 · width:340 · maxHeight:50vh`), có sẵn cả đường xuất kết quả
(`:1678`) và đường đẩy số vi phạm sang `StatusBar`.
**Việc thật là MỞ RỘNG panel đó**, không dựng màn thứ hai — đúng luật "một cỗ máy nhiều mặt tiền".

### b. Bố cục
Giữ nguyên panel nổi **340 px** đã có. Thêm **hai lớp**: dải tóm tắt trên đầu (đạt/không, theo nhóm)
và bảng chi tiết cuộn dưới.

### c. Trường — bám kiểu `Violation` (`lib/cad/standards/checker.ts:31`), cấm bịa trường mới
| Nhãn hiện trên UI | Kiểu | Trường nguồn |
|---|---|---|
| Mức | chip 3 màu | `severity` |
| Nhóm | chữ | `category` |
| Nội dung | 1 câu | `message` |
| Chuẩn áp | chữ | `source` + `ruleId` |
| Đã đối chiếu | dấu tick | `verified` |
| (bấm dòng → nhảy tới) | — | `at?: Pt` (đã có sẵn để click-zoom) |
| Lưu ý mốc thời gian | chữ nhỏ | `asOfNote?` — panel **nên** hiện, hiện chưa hiện |

Bốn nhóm mà G-M5-13 đòi, ánh xạ vào `category`: **Lối đi** · **Khoảng cách** · **Diện tích/người**
(có sẵn qua `INTL_OCCUPANT_LOAD` + `checkMeetingArea`) · **Va chạm** (⚠️ chưa có luật — xem §9).

### d. Trạng thái & §9
| Ca | Hiện gì |
|---|---|
| Chưa chạy | [Kiểm ngay] + 1 câu mời |
| 0 vi phạm | **"Không thấy lỗi nào với bộ chuẩn đang chọn."** (9 từ) — **không** viết "đạt chuẩn" (khác nghĩa) |
| §9 — nhóm **Va chạm** | chưa có luật ⇒ hàng nhóm vẫn hiện, số đếm `—`, lý do **"Chưa dò va chạm — cần khối 3D."** (7 từ) |
| §9 — `asOfNote` | hiện ngay dưới `message`, chữ nhỏ. Không có thì không hiện dòng trống |
| §9 — sửa tự động | `suggestFix()` (`lib/cad/standards/fix-suggest.ts:148`) **đã được panel gọi thật** (`CadEditor.tsx:70` import, `:1805` gọi) và trả `null` cho luật chưa có gợi ý ⇒ mock chỉ cần vẽ đúng **hai trạng thái** của dòng đó: có gợi ý (chữ gợi ý + nút) và `null` (**"Luật này chưa có cách sửa sẵn."** — 7 từ). Đừng vẽ như thể tính năng chưa có |

### e. Nút
`[Kiểm ngay]` · `[Chọn bộ chuẩn]` · `[Sửa giúp]` · `[Xuất kết quả]` (đường xuất đã có ở `CadEditor.tsx:1678`).

### f. 2 theme — chip mức độ phải đọc được ở **cả hai nền**; đây đúng chỗ 19 trang mock chỉ-một-theme đã hỏng.

---
---

# 3 · Thứ tự đề xuất

1. **PT-04** (thả món xuống bản vẽ) — mồ côi THẬT, chặn bước cuối của T3, và tầng thuần
   (`library-item-resolve.ts`) vừa xong nên chỉ còn phần nối. Rẻ nhất trong nhóm còn mồ côi.
2. **PT-05** (món đo → block) — mồ côi THẬT, đóng mắt xích cuối T2; `to-cad.ts` vừa viết.
3. **SP-01** (spec màn nhập bản vẽ) — panel đã tồn tại trong code mà chưa có hợp đồng; viết hợp
   đồng **theo code hiện có** trước khi ai đó vẽ lại từ đầu (đúng luật §0.2 của phiếu port giao diện).
4. **SP-02** (Inspector cấu kiện) — chỉ còn **2 trang** (Cửa, Khối) chứ không phải cả bộ; trang
   Tường đã có mock, dải 4 trang đã có code.
5. **PT-01 · PT-03** — nghiệm thu hai thứ vừa nối, **trước khi phiên M1 commit**, kẻo lên `main`
   rồi mới phát hiện lệch.
6. **PT-02 → SP-04** — cặp phụ thuộc: không truyền được `PlanGrid` ra ngoài thì màn zoning chỉ là hình vẽ.
7. **SP-05** — sửa nhẹ, mở rộng panel đã có.
8. **SP-03** — panel 4 bước đã chạy, chỉ thiếu hợp đồng; hoãn được.
9. **PT-06 · PT-07 · PT-08** — không chặn task nào, làm khi có chỗ trống.

# 4 · Chưa làm / chưa chắc — nói rõ, không giấu

### 4.1 · Tài liệu SAI so với code thật (báo thẳng, không im lặng sửa cho khớp)
| Chỗ ghi sai | Sự thật đo được |
|---|---|
| `GAP-IF.md` G-M1-02 · G-M1-03 · G-M1-04 "0 nơi gọi" | **Đã nối** trong working tree 06/08 (`CadEditor.tsx:35,409,416` + `lib/cad/import-summary.ts`). Chưa commit ⇒ `git log` chưa thấy |
| `PHIEU-PORT-GIAO-DIEN` #A1 *"`CamPathControlPanel` + `CamPathPreview` — cả 2 có sẵn, **0 nơi gọi**"* | **SAI từ 02/08.** `components/cad/CamPathPanel.tsx` (commit `bc3d3e7`, 02/08, *"nối CamPathPreview + CamPathControlPanel vào /cad-editor thật"*) gọi cả hai; `CadEditor.tsx:85` import, `:692` mount thật. ⇒ **A1 không còn là "món rẻ nhất còn lại"**, gạch khỏi hàng đợi |
| `GAP-IF.md` G-M5-02 *"Mock CAD duy nhất có Inspector chỉ vẽ trang phòng"* | `mock-cad-revit-2026-08-03.html` **đã vẽ trọn Inspector Tường** 5 nhóm (đọc markup, xem SP-02 §a). Thiếu là trang **Cửa** và **Khối** |
| `GAP-IF.md` G-M5-13 *"giao diện chưa có bảng nào để đổ kết quả kiểm"* | Panel **Kiểm chuẩn** đã có và chạy (`CadEditor.tsx:1651/1678/1683`). Thiếu là 4 nhóm phân loại + nhóm "Va chạm" chưa có luật |
| `M5-OUT.md` / phiếu port: "67 trang mock" | Nay còn **57 trang** trong `docs/mocks/*.html` — 10 trang app song song đã dời sang `docs/mocks/_archinote/` (đang staged, phiên mock song song làm). Mọi con số "x/67" trong 2 tài liệu đó **cần tính lại** |

### 4.2 · Chỗ tôi phải ĐOÁN
- **Phiên sở hữu**: `docs/SO-KIEM-TONG.md §2` chia mảng theo CHINH/PHU/G4/COWORK, còn brief giao
  việc này dùng M1/M2/M3/M5. Tôi gán theo **mảng chức năng** trong brief (M1 lõi-cad · M2 hành vi
  sửa · M3 nội thất/thư viện/BOQ · M5 giao diện), **không** đối chiếu lại bảng §2. Nếu hai hệ ký
  hiệu này khác nhau thì cột "Phiên sở hữu" cần soát lại.
- **PT-06 · PT-07 · PT-08 không có dòng GAP** — tôi tự xếp là "thuật toán mồ côi" theo bằng chứng
  grep, chưa ai duyệt là việc cần làm. Có thể chúng cố ý nằm chờ (`vcb.ts` tự khai phần UI để ngoài).
- **Bề rộng panel** cho 5 màn spec: tôi chọn theo bậc thang đo được trong repo (236/280/320/340/380/520).
  `docs/SPEC-DESIGN-SYSTEM-IF.md` có thể quy định khác — chưa đọc file đó trong vòng này.
- **Câu chữ §9** tôi viết mới theo 5 luật của `SPEC-NGON-NGU-CHI-DAN` (≤12 từ, động từ đầu, kèm nút).
  Chưa qua "test 3 giây" với người không làm dev (luật §5 của spec đó).

### 4.3 · Chưa làm
- **Chưa mở trình duyệt**, chưa chạy `npm test`, chưa chạy `tsc` — vòng này chỉ đọc code + grep.
- **Chưa mở 57 trang mock bằng trình duyệt.** SP-02 §a và SP-05 §a đọc **markup thật** (python đọc
  chuỗi, không phải nhìn ảnh); các trang khác chỉ grep tên.
- **Chưa quét mồ côi toàn repo có hệ thống.** Cách quét theo-file bỏ sót cụm tự-gọi-nhau (đúng ca
  `match-template` ↔ `ortho-projection`). Danh sách PT-06/07/08 là kết quả một lượt quét thô
  `lib/**/*.ts`, không phải kiểm kê đầy đủ. Các module còn lại trong lượt quét đó, **chưa xác minh**:
  `lib/cad/plan-depth.ts` (đã được `PlanPresentPanel.tsx:42` xử lý ĐÚNG §9 — `disabled` kèm lý do,
  không cần phiếu) · `lib/cad/shape-mocks.ts` (nghi là giàn giáo sprint cũ, nên xoá chứ không nối) ·
  `lib/ai/web-lookup.ts` · `lib/cad/dwg-worker.ts` (dương tính giả — nạp qua `new Worker(new URL())`) ·
  các file `index.ts` (dương tính giả — import theo thư mục).
- **`lib/ffe/item.ts` + `lib/nodes/defs/ffe-table.ts`** (untracked, tạo 06/08) hiện **0 nơi gọi**,
  nhưng là việc **đang chạy dở** của phiên M3 (nhắm G-M3-02/04) ⇒ **cố ý không đặt phiếu**, tránh
  hai phiên cùng nối một dây.

### 4.4 · Rủi ro va chạm hai phiên chung `.git` (luật session #5)
`components/cad/CadEditor.tsx` là điểm chạm của **PT-01 · PT-02 · PT-03 · PT-04** và đang bị phiên
M1 sửa (+395 dòng chưa commit). Đừng để hai phiên cùng mở file này. Đề nghị: **M1 commit trước**
(cụm ngắn, `git commit -- <pathspec>`), rồi M3 mới thêm listener của PT-04.

---
*Soạn 06/08/2026. Không sửa code, không sửa mock, không commit. Mỗi con số trong file này có lệnh
kèm theo — chạy lại lệnh đó trước khi tin.*
