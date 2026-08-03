# SPEC — TẦNG DỮ LIỆU CẤU KIỆN *(một Doc · ba ống kính)*

> **COWORK-DỰNG · 03/08/2026 · đợt 5** (`SO-KIEM-TONG.md` §3 đợt 5 — việc 🔴 ưu tiên 1 của vai).
> Nguồn luật: `CHOT-TEN-CHANG-MODE-2026-08-03.md` mục **VÒNG CUỐI** —
> *"ba chặng là ba ỐNG KÍNH soi vào một nguồn dữ liệu, không phải ba kho dữ liệu."*
> Kế thừa (KHÔNG đập): `SPEC-SEMANTIC-MODEL.md` §2·§3·§4 (ngữ nghĩa 2D — Hoà duyệt 01/08) ·
> `SPEC-3D-CORE.md` §1 (luật ba tầng A/B/C) · `SPEC-VAT-LIEU-PBR-IF.md` (matId/PBR) ·
> `IF-CORE-SCHEMA.md`.
> Phạm vi: **tầng dữ liệu dùng chung**, nền cho `SPEC-DUNG-3D-THONG-NHAT.md` (chưa viết).
> Đây là spec **NGHIỆP VỤ** — Cowork không đụng `lib/`/`components/`; code do CHINH·PHU·G4 làm.

---

## §0 · HIỆN TRẠNG ĐÃ XÁC MINH (đọc code 03/08, không suy đoán)

### §0.1 · Ngữ nghĩa đang nằm ở đâu — và ai đọc

Tất cả đều là field **optional trên `Base`** hoặc trên entity cụ thể (`lib/cad/model.ts`), đúng
nguyên tắc additive: `.idf` cũ không có field vẫn parse.

| Field | Khai ở | Nghĩa | Ai TIÊU THỤ hôm nay (grep 03/08) |
|---|---|---|---|
| `elementType` | `Base` (model.ts:151-181) | lớp IFC: wall·slab·column·beam·door·window·furniture·space·`null` | `schedule.ts` · `dxf.ts` (xdata) · `hatch.ts` · `eyedropper.ts` · `plan-drawon.ts` · `RevitSummaryPanel` · `SchedulePanel` — **KHÔNG có `lib/three/`** |
| `storey` | `Base` | tầng ('GF'/'L1') | `dxf.ts` · `eyedropper.ts` · `CommandPanel` · `CadEditor` — **KHÔNG có `lib/three/`** |
| `wallKind` · `wallStructural` · `wallThicknessMm` | `Base` | tường trong/ngoài · chịu lực · dày thật | `standards/checker.ts` |
| `heightMm` | `Base` | cao đùn khối riêng từng tường | ✅ `cad-to-obj.ts:414` **có đọc** — đường ghi-ngược DUY NHẤT đang chạy đúng |
| `campath` | `Base` | polyline là đường cam | `dxf.ts` · V2 |
| `roomType` | `TextEntity` | công năng phòng | `checker.ts` · `store.ts` · `CadSheets` |
| `specId` | `BlockEntity` + `HatchEntity` | FK mềm → `ProductSpec` (hãng·mã·giá·đơn vị·hao hụt) | `lib/boq/*` · `schedule.ts` · `eyedropper.ts` — **KHÔNG có `lib/three/`** |
| `group` · `label` | `ZoneEntity` | vùng công năng | `render.ts` · legend · `dxf.ts` |

**Kết luận §0.1:** ngữ nghĩa đã có kha khá và **ống kính 2D + Trình bày (BOQ) đọc nó**.
Ống kính 3D thì không — xem §0.2.

### §0.2 · 🔴 Phát hiện gốc — ống kính 3D KHÔNG đọc ngữ nghĩa, nó ĐOÁN LẠI

`lib/three/cad-to-obj.ts` `docToObjScene()` — chữ `elementType` xuất hiện đúng **1 lần và trong
comment** (dòng 71), không có 1 dòng code nào đọc nó. Cách 3D quyết "cái này là tường/phòng/đồ":

| Cái gì trong 3D | Suy ra bằng | File:dòng | Rủi ro |
|---|---|---|---|
| **Tường** | hatch trên layer TÊN khớp `/tường\|wall/i` **HOẶC** bất kỳ hatch nào `solid===true \|\| pattern==='SOLID' \|\| !pattern` | `cad-to-obj.ts:286-292, 350-355` | 🔴 xem §0.3 |
| **Phòng** | dò `findHatchBoundary()` tại **tâm mỗi block nội thất**, lọc diện tích ≥1m², khử trùng | `cad-to-obj.ts:392-406` | phòng không có đồ ⇒ **không tồn tại trong 3D**; phòng không có id bền |
| **Nội thất** | `BLOCK_MAP[b.block].group !== 'Kiến trúc'` | `cad-to-obj.ts:357-360` | không dùng `elementType:'furniture'`, không dùng `specId` |
| **Cửa sổ** | `b.block === 'window'` (so chuỗi cứng) | `cad-to-obj.ts:361` | cửa đi (`door`) **không được dựng gì cả** |
| **Sàn** | 1 tấm bbox nở 50mm, dày 100mm | `cad-to-obj.ts:375-385` | không phải sàn lát thật, không mang vật liệu |
| **Vật liệu** | 5 màu phẳng theo `theme` ('clay'/'warm'/'gu') | `cad-to-obj.ts:110-…, themeMats()` | **`specId`/`matId` bị bỏ qua hoàn toàn** |
| **Tầng** | không xử lý — mọi entity dựng chung 1 cao độ 0 | — | `storey` chết trong 3D |

→ Đúng bệnh mà luật VÒNG CUỐI cấm: **hai ống kính đang có hai định nghĩa khác nhau về "tường"**.
2D nói tường bằng `elementType:'wall'` (người dùng khai, `RevitSummaryPanel` đếm); 3D nói tường
bằng tên layer + kiểu hatch. Hai định nghĩa này **chắc chắn sẽ lệch nhau** — và lệch âm thầm.

### §0.3 · Khuyết ①: vùng tô SƠN bị đùn thành tường (suy ra từ code — cần verify tay 5 phút)

Chuỗi bằng chứng:
1. `lib/cad/materials.ts:146-177` — 3 preset sơn (`son-trang`, `son-xam-am`, `son-xanh-reu`) có
   `hatchPattern: 'SOLID'`.
2. Tô sơn lên tường/trần ⇒ sinh `HatchEntity` với `pattern:'SOLID'`, **layer bất kỳ**.
3. `cad-to-obj.ts:350-355` — điều kiện lọc tường có nhánh `|| e.pattern === 'SOLID'`, **không xét
   layer, không xét `elementType`**.
4. ⇒ Vùng sơn đó vào `wallHatches` ⇒ `builder.prism(h.points, 0, 2700)` — **đùn thành khối tường
   cao 2.7m** giữa phòng.

Càng đúng định vị **BIM nội thất** (`CHOT-TEN-CHANG-MODE` §3: lớp hoàn thiện · sàn lát · ốp tường
là hạng mục CHÍNH) thì khuyết này càng nặng: **món hàng chính của IF lại là món 3D hiểu sai nhất.**
⚠️ Chưa chạy tay để nhìn thấy khối sai — PHU verify 1 lần trước khi vá (đừng vá mù).

### §0.4 · Khuyết ②: định danh chỉ có ở nhóm TƯỜNG

`cad-to-obj.ts:66-70` + `:412-416` — `SceneGroup.entityId` **chỉ gán cho group tường**; sàn·phòng·
nội thất·cửa sổ để trống, comment ghi rõ *"chưa có nơi tiêu thụ nên chưa gán"*. Hệ quả: chọn 1 cái
ghế trong 3D thì **không biết nó là entity nào trong Doc** ⇒ không highlight ngược sang 2D, không
mở được Inspector, không sửa được `specId`. Nay đã có nơi tiêu thụ (§8) ⇒ hết lý do để trống.

### §0.5 · Khuyết ③: PHÒNG không phải một thứ có thật trong dữ liệu

"Phòng" hôm nay tồn tại ở **ba dạng rời nhau, không cái nào là bản chính**:

| Dạng | Ở đâu | Có id bền? |
|---|---|---|
| `TextEntity` có `roomType` (nhãn phòng) | Doc | ✅ có id, nhưng chỉ là CHỮ, không có biên |
| `ZoneEntity` (vùng công năng, tô đè) | Doc | ✅ có id + biên, nhưng là lớp PHÂN TÍCH đè lên, không phải phòng thi công |
| polygon dò `findHatchBoundary` mỗi lần dựng 3D | tính lại runtime | ❌ **không id, đổi theo số đồ trong phòng** |

⇒ Không có chỗ nào treo được: trần phòng này cao bao nhiêu · sàn lát vật liệu gì · phào chân
tường loại nào. **Đây chính là nơi BIM nội thất phải sống.** Xem §6.

### §0.6 · Khuyết ④: Trình bày nhận ẢNH, không nhận dữ liệu

`lib/cad/present-handoff.ts:24-32` — payload sang `/present-editor` là `dataUrl` (ảnh snapshot) +
`snapshot` chuỗi. Đây là **ống kính thứ ba đang cầm bản sao chết**, đúng thứ luật VÒNG CUỐI cấm.
⚠️ Sắc thái: ảnh render **là sản phẩm đầu ra hợp lệ** để dán vào deck — không phải lỗi. Lỗi là khi
Trình bày muốn biết *diện tích phòng / mã vật liệu* thì nó **chỉ có ảnh**. BOQ (`lib/boq/compute.ts`)
đã làm ĐÚNG (đọc thẳng `doc.entities` + `specId`) — chuẩn hoá theo BOQ, không theo present-handoff.

---

## §1 · LUẬT NỀN (chốt — dùng để bác mọi đề xuất sau)

| # | Luật | Hệ quả kiểm được |
|---|---|---|
| **L1** | **Một `Doc` duy nhất.** Không có "model 3D", không có "dữ liệu present". | Không được thêm state hình học ngoài `useCadStore.doc` |
| **L2** | **Ống kính = HÀM THUẦN** `lens(doc, opts) → view`. Không cache bền, không ghi ngược trong lúc derive. | `docToObjScene` đã thuần — giữ; mọi ống kính mới theo đúng khuôn |
| **L3** | **Ngữ nghĩa KHAI BÁO thắng ngữ nghĩa SUY ĐOÁN.** Có `elementType` thì mọi ống kính phải nghe nó; hết. | Xoá dần nhánh đoán theo tên layer (§2.3) |
| **L4** | **Suy đoán được phép, nhưng phải LỘ MẶT.** Khi phải đoán, gắn cờ `inferred` và UI hiện "suy đoán". | Người dùng biết chỗ nào dữ liệu yếu |
| **L5** | **Ghi ngược chỉ qua LỆNH, không qua ống kính.** Kéo cao tường ở 3D = phát 1 lệnh sửa `entity.heightMm`; sau đó Doc đổi ⇒ derive lại. | Đúng đường `onPushPull` đang chạy (§4) |
| **L6** | **Không đồng bộ 2 chiều, không copy, không xuất-nhập giữa các chặng.** | Cấm mọi hàm tên `syncXtoY` |
| **L7** | Field mới chỉ thêm khi **đã có nơi tiêu thụ** (giữ nguyên luật `SPEC-SEMANTIC-MODEL` §3 — chống bệnh Revit). | Mỗi field ở §2 phải chỉ ra được người ăn |

---

## §2 · ENTITY NÀO MANG NGỮ NGHĨA — bảng chuẩn

### §2.1 · Ba tầng thông tin trên một entity

```
① HÌNH HỌC   points/at/r/w-h …        ← luôn có, mọi ống kính đều dùng
② NGỮ NGHĨA  elementType · storey · wallKind · roomType · specId · heightMm
                                       ← KHAI BÁO; ống kính đọc để biết render THÀNH GÌ
③ TRÌNH BÀY  color · lineweight · lineType · pattern · opacity
                                       ← CHỈ ống kính 2D dùng (xem §5)
```
Không được trộn: `color` không bao giờ là nguồn để biết "cái này là tường".

### §2.2 · Ai được mang `elementType` nào (chốt — hết mơ hồ)

| `elementType` | Entity được phép mang | Ống kính 2D vẽ ra | Ống kính 3D dựng ra |
|---|---|---|---|
| `wall` | `hatch` (poché) · `polyline` (biên) · `line` (tường 1 nét) | nét đậm 0.5-0.7 + poché | lăng trụ đứng cao `heightMm ?? scene.wallHeightMm` |
| `slab` | `hatch` · `polyline` kín | biên sàn | tấm dày `thicknessMm ?? 100`, mặt trên z=0 |
| `column` · `beam` | `hatch` · `rect` · `circle` | nét đậm | lăng trụ (beam: cao treo — chưa spec, xem §10) |
| `door` | `block` | ký hiệu cánh mở | **lỗ trên tường + tấm cánh** (nay đang bỏ qua) |
| `window` | `block` | ký hiệu 2-3 nét | tấm kính bệ 800→2200 (đang cứng, cho tham số hoá) |
| `furniture` | `block` | line-drawing top-view | proxy box footprint × `furnitureHeightMm` |
| `space` | `zone` · **`room` (mới, §6)** | vùng tô + nhãn | sàn phòng + trần phòng |
| `null` | mọi entity | vẽ như hình học thuần | **bỏ qua** (không dựng khối) |
| `undefined` | mọi entity | vẽ như hình học thuần | chạy nhánh SUY ĐOÁN + gắn `inferred` (§2.3) |

⚠️ **`null` ≠ `undefined`** — model.ts:151-181 đã định nghĩa rõ, ống kính 3D phải phân biệt:
`null` = "đã kiểm, không phải cấu kiện" ⇒ im lặng bỏ qua; `undefined` = "chưa gán" ⇒ đoán + báo.

### §2.3 · Thang ưu tiên khi quyết "cái này là gì" (thay cho nhánh `||` hiện tại)

```
1. entity.elementType != null            → dùng, DỪNG          (khai báo)
2. entity.elementType === null           → không phải cấu kiện, DỪNG
3. undefined → chạy inferElementType(e, doc):
     a. hatch trên layer id 'l-wall'                → wall,  inferred
     b. hatch có specId + spec.kind==='material'    → covering (lớp hoàn thiện), inferred   ← VÁ §0.3
     c. block có BLOCK_MAP[...].group==='Kiến trúc' → theo def, inferred
     d. block khác                                  → furniture, inferred
     e. còn lại                                     → null, inferred
```
**Bỏ hẳn** hai nhánh `e.solid === true` và `!e.pattern` khỏi điều kiện tường — đó là gốc khuyết §0.3.
Nhánh `/tường|wall/i` theo TÊN layer: giữ tạm cho `.idf` cũ, gắn `inferred`, hẹn xoá sau backfill (§9-P4).

### §2.4 · Field CẦN THÊM (mỗi cái phải có nơi tiêu thụ — luật L7)

| Field | Ở đâu | Vì sao | Nơi tiêu thụ ngay |
|---|---|---|---|
| `thicknessMm?: number` | `Base` | sàn/trần dày bao nhiêu; nay hardcode 100 | ống kính 3D §2.2 · BOQ khối lượng m³ |
| `elevationMm?: number` | `Base` | cao độ ĐÁY so với cốt tầng (bệ cửa sổ, trần thả, phào) | 3D (thay hằng số 800/2200) |
| `'covering'` vào `ElementType` | model.ts:151 | `IfcCovering` — lớp hoàn thiện trần·sàn·ốp = **hạng mục chính của BIM nội thất** (`CHOT-TEN-CHANG-MODE` §4) | 3D (dán lên mặt, KHÔNG đùn) · BOQ (đã có `specId`) · NC-11 ánh xạ IFC |
| `roomId?: string` | `Base` | entity thuộc phòng nào | 3D gom theo phòng · BOQ theo phòng · Trình bày bảng vật liệu A3 theo phòng |
| `inferred?: true` | `SceneGroup` (không lưu vào `.idf`) | cờ RUNTIME của L4 | UI hiện badge "suy đoán" |

`'covering'` là **đề xuất chờ NC-11** (COWORK-NC đang tra IFC 4.3) — TỔNG duyệt sau khi NC về;
đừng code trước.

---

## §3 · BA ỐNG KÍNH — CÙNG MỘT ENTITY, BA CÁCH ĐỌC

| Entity mẫu | **2D Kỹ thuật** | **3D Thiết kế** | **Trình bày** |
|---|---|---|---|
| hatch `wall` dày 100, `heightMm` 2700 | poché đặc + biên nét 0.6 | lăng trụ cao 2700, xám trơn | dài tường (m) → BOQ sơn/ốp |
| hatch `covering` + `specId` sàn gỗ | hatch ANSI31 màu preset | **texture PBR dán lên mặt sàn**, không đùn | m² × giá × hao hụt → dòng BOQ · ô trong bảng vật liệu A3 |
| block `furniture` + `specId` | line-drawing top-view + số hiệu | proxy box (glTF nếu có) | dòng "cái" trong BOQ · thẻ sản phẩm |
| block `door` | ký hiệu cánh mở 90° | lỗ trên tường + cánh | thống kê cửa |
| room `space` (§6) | biên + nhãn "PHÒNG KHÁCH 24.5m²" | sàn + trần phòng, khung camera | tiêu đề nhóm mọi bảng |
| `dim` / `text` | ✅ vẽ đúng như đang có | ❌ **không tồn tại** | chỉ khi in bản vẽ 2D vào hồ sơ |
| camera / campath | polyline mảnh trên layer `IF_CAMPATH` | ✅ đường bay thật | nguồn footage video |

**Đọc bảng này theo hàng, không theo cột** — một hàng = một sự thật, ba cách nhìn. Ống kính nào
cần một sự thật *chưa có trong hàng* thì phải thêm vào Doc (§2.4), **không tự đẻ dữ liệu riêng**.

---

## §4 · "SỬA BÊN NÀY BÊN KIA ĐỔI" — cơ chế chính xác

### §4.1 · Không phải đồng bộ. Là DERIVE LẠI.

```
người dùng thao tác ở ống kính bất kỳ
        ↓  phát LỆNH (không sửa view)
   useCadStore.doc  ← MỘT BẢN DUY NHẤT
        ↓ derive (hàm thuần, chạy lại khi doc đổi)
  ┌─────────────┬──────────────────┬──────────────────┐
  │ render.ts   │ docToObjScene()  │ boq/compute.ts   │
  │ (2D)        │ (3D)             │ (Trình bày)      │
  └─────────────┴──────────────────┴──────────────────┘
```
Không có mũi tên nào giữa ba ô dưới. Đó là toàn bộ nội dung của luật.

### §4.2 · Đường ghi-ngược DUY NHẤT đã chạy đúng — dùng làm khuôn

Push-pull 3D (`components/three/Scene3DViewer.tsx:20, 61, 266`): kéo mặt tường → viewer chỉ đổi
`scale.y` **tạm trong lúc kéo**; **nhả chuột mới** gọi `onPushPull(entityId, newHeightMm)` **một
lần** → ghi `entity.heightMm` → `docToObjScene` dựng lại. Comment dòng 21 ghi rõ *"component KHÔNG
tự ghi Doc"*.

**Đây là hợp đồng mẫu cho MỌI thao tác ghi-ngược từ ống kính 3D:**

| Bước | Bắt buộc |
|---|---|
| 1 | Trong lúc kéo: chỉ đổi **hiển thị**, không đụng Doc (không spam undo stack) |
| 2 | Kết thúc thao tác: gọi **một** callback `(entityId, giá trị mới)` |
| 3 | Callback ghi Doc qua **lệnh có undo** — không `doc.entities[i].x = ...` trực tiếp |
| 4 | Kẹp biên bằng **hàm dùng chung** (mẫu `clampWallHeight`, cad-to-obj.ts:336) — không copy hằng số sang viewer |
| 5 | Doc đổi ⇒ derive lại toàn bộ. Không patch view tại chỗ |

### §4.3 · Bảng thao tác ghi-ngược cần có (P2, §9)

| Thao tác ở 3D | Ghi vào | Trạng thái |
|---|---|---|
| Kéo cao tường | `entity.heightMm` | ✅ đã có |
| Gán vật liệu lên mặt | `entity.specId` | ⬜ chưa — **ưu tiên 1** (nối 3D vào BOQ) |
| Di/xoay đồ | `BlockEntity.at` · `.rot` | ⬜ chưa |
| Đổi dày sàn/trần | `entity.thicknessMm` (mới) | ⬜ chờ §2.4 |
| Đặt cam / vẽ đường cam | polyline `campath:true` | ⬜ xem `SPEC-DUNG-CAMERA.md` |

---

## §5 · CÁI GÌ CHỈ SỐNG Ở MỘT ỐNG KÍNH (chốt — đừng ép dùng chung)

| Chỉ ở **2D Kỹ thuật** | Chỉ ở **3D Thiết kế** | Chỉ ở **Trình bày** |
|---|---|---|
| `dim` (kích thước) | góc camera / orbit / walk | bố cục trang, lưới slide |
| `text`, ký hiệu cửa, mũi tên hướng mở | ánh sáng, HDRI, phơi sáng | thứ tự trang, chuyển cảnh |
| `hatch.pattern` + `patternScale/Angle` | `SceneTheme` ('clay'/'warm'/'gu') | chữ thuyết minh, chú thích khách |
| `lineweight`, `lineType` | trạng thái cắt lớp (`sectionMm`) | prompt render AI đã dùng |
| `printScale`, `paperKey`, khung tên | `ceiling` bật/tắt | Brand Kit áp lên hồ sơ |
| `zone` (lớp phân tích đè) | ảnh render output (URL CDN) | timeline video |

**Luật §5:** ba cột này **KHÔNG được leo vào `Base`**. Chúng thuộc *tuỳ chọn ống kính* (`SceneOptions`,
`Doc.printScale`, state editor). Ai định thêm `Base.cameraAngle` là đã hiểu sai luật VÒNG CUỐI.

Ranh giới xám — chốt luôn để khỏi cãi:
- `Doc.printScale` / `paperKey` / `studioName` **đang nằm trong `Doc`** dù là 2D-only. **Giữ nguyên**,
  vì đó là thuộc tính của *tờ bản vẽ*, không phải của entity. Không nhân rộng mẫu này.
- `campath` là polyline thật trong Doc (`Base.campath`) — **đúng**, vì nó là hình học có toạ độ,
  2D vẽ được (mặt bằng đường bay), 3D bay theo. Không phải 3D-only.

---

## §6 · 🔴 PHÒNG — cấu kiện còn thiếu, và là chỗ BIM NỘI THẤT phải sống

### §6.1 · Vì sao bắt buộc phải có

`CHOT-TEN-CHANG-MODE` §3: hạng mục chính của IF là **trần · sàn lát · lớp hoàn thiện · tủ bếp**.
Cả bốn đều là *thuộc tính của MỘT PHÒNG*, không phải của một nét vẽ. Không có "phòng" trong dữ
liệu thì không treo được chúng vào đâu ⇒ định vị moat chỉ nằm trên giấy.

### §6.2 · Đề xuất `RoomEntity` (chờ TỔNG duyệt + đối chiếu NC-11)

```ts
export interface RoomEntity extends Base {
  type: 'room';
  elementType?: 'space';        // IfcSpace
  boundary: Pt[];               // biên KÍN, mm — sự thật duy nhất về biên phòng
  name: string;                 // "PHÒNG KHÁCH"
  roomKind?: RoomKind;          // TÁI DÙNG type đã có (model.ts) — không đẻ union mới
  floorSpecId?: string;         // sàn lát        → ProductSpec kind:'material'
  ceilingSpecId?: string;       // trần
  skirtingSpecId?: string;      // phào chân tường
  ceilingHeightMm?: number;     // trần thả — undefined = theo cao tường
}
```
| Câu hỏi | Trả lời |
|---|---|
| Sao không dùng `ZoneEntity`? | Zone là **lớp phân tích đè lên** (`model.ts`: *"KHÔNG phải hình học thi công"*, opacity 0.4, 6 nhóm màu). Nhồi vật liệu thi công vào zone = trộn hai nhịp sống, đúng lỗi đã tránh ở `MaterialDef` vs `ProductSpec`. |
| Sao không dùng `TextEntity.roomType`? | Chữ không có biên ⇒ không tính được m² sàn. |
| Biên vẽ tay hay tự dò? | **Tự dò** bằng `findHatchBoundary` đã có, nhưng **đóng băng thành `boundary` khi tạo phòng** — từ đó biên là dữ liệu, không phải phép đoán chạy lại mỗi frame. Tường đổi ⇒ hiện nút "cập nhật biên", KHÔNG tự sửa (đúng L5). |
| Ba ống kính đọc ra sao? | 2D: biên + nhãn + m². 3D: sàn `floorSpecId` + trần `ceilingSpecId` ở `ceilingHeightMm`. Trình bày: **hàng đầu của mọi bảng** — BOQ nhóm theo phòng, bảng vật liệu A3 một trang một phòng. |

### §6.3 · Đường di cư (không phá dữ liệu cũ)
Doc cũ không có `room` ⇒ ba ống kính chạy y như hôm nay (2D không vẽ gì thêm; 3D vẫn dò
`findHatchBoundary` như cũ, gắn `inferred`; BOQ không nhóm). Người dùng bấm **"Nhận diện phòng"**
→ dò biên → sinh `RoomEntity` + gán `roomId` ngược cho entity nằm trong biên. Một chiều, có undo,
xem được trước khi chốt.

---

## §7 · VẬT LIỆU — MỘT NEO, BA MẶT BIỂU HIỆN

Hôm nay có **bốn** thứ mang tiếng "vật liệu", dễ nhầm:

| Thứ | Là gì | File | Nhịp sống |
|---|---|---|---|
| `MaterialDef` | vật liệu **thị giác 2D** (pattern·màu·texture procedural) | `lib/cad/materials.ts` | đổi theo thiết kế |
| `MaterialDef.pbr` | tham số **render thật** | `lib/materials/schema.ts` | đổi theo engine |
| `ProductSpec` | vật liệu **thương mại** (hãng·mã·giá·đơn vị·hao hụt) | `prisma/schema.prisma:359-399` | đổi theo NCC |
| `SceneTheme` | 5 màu phẳng cho khối thô 3D | `cad-to-obj.ts` | không phải vật liệu — là *chế độ xem* |

**Chốt:** `entity.specId` (→ `ProductSpec.id`) là **NEO DUY NHẤT** trên entity.
`MaterialDef.atlasRecordId` (materials.ts:47-56) đã nối `MaterialDef ↔ ProductSpec` — dùng đường đó,
**cấm thêm field `matId` song song** (`SPEC-SEMANTIC-MODEL` §4 gọi nó là `matId`, code hiện thực
bằng `specId` — cùng một thứ, xem docstring `HatchEntity.specId`; các phiên sau **đừng tạo cái thứ hai**).

Ba ống kính đọc cùng một `specId`:

| Ống kính | Đọc gì từ `specId` | Không đọc gì |
|---|---|---|
| 2D | `MaterialDef` → pattern·màu·scale | giá, PBR |
| 3D | `MaterialDef.pbr` → albedo/rough/normal + `tiling size` | giá, pattern 2D |
| Trình bày | `ProductSpec` → giá·đơn vị·hao hụt·quy cách | pattern, PBR |

⚠️ `tiling size (mm)` là **bắt buộc** (`SPEC-SEMANTIC-MODEL` §4: *"sai scale là sai cả bản vẽ lẫn
render"*) — 2D và 3D phải đọc **cùng một con số**, không mỗi bên một hằng số.

`SceneTheme` giữ nguyên vai trò **chế độ xem khối thô** (`SPEC-3D-CORE` §2 chốt 3: xám trơn, chống
trượt thành engine). Khi entity **có** `specId` và người dùng bật chế độ "vật liệu thật" thì mới
dùng PBR. Mặc định vẫn xám trơn — không đổi chốt cũ.

---

## §8 · ĐỊNH DANH & CHỌN XUYÊN ỐNG KÍNH

Vá khuyết §0.4. Hợp đồng:

| Quy tắc | Nội dung |
|---|---|
| **Đ1** | **Mọi `SceneGroup` phải có `entityId`** — sàn·phòng·nội thất·cửa sổ không được để trống nữa. Group tổng hợp (nhiều entity gộp) mang `entityIds: string[]`. |
| **Đ2** | Đặt tên group theo `<Loại>_<entityId>`, không theo số thứ tự (`Wall_1` đổi số khi thêm/xoá entity ⇒ vỡ mọi thứ neo theo tên — đang là bom hẹn giờ ở `cad-to-obj.ts:412`). |
| **Đ3** | **Trạng thái chọn sống ở tầng Doc** (`selectedIds: string[]` trong store), không trong viewer. Chọn ở 3D → set store → 2D tự sáng theo. Cùng khuôn `onPushPull`. |
| **Đ4** | Entity không dựng được khối (dim/text) **không sinh group** — chọn nó ở 3D là vô nghĩa, đúng §5. |
| **Đ5** | `RoomEntity.id` là khoá nhóm xuyên ba ống kính (`entity.roomId`). |

Đ3 mở khoá đúng điểm sáng Revit mà `CHOT-TEN-CHANG-MODE` §5 đòi: *"chọn 1 ghế → chọn hết ghế cùng
loại"* = lọc `entities.filter(e => e.block === ghế.block)` trên Doc, **không phải thuật toán 3D**.
Có Đ1-Đ3 rồi thì tính năng đó gần như miễn phí.

---

## §9 · LỘ TRÌNH — phiếu cho code (theo thứ tự, không nhảy cóc)

| # | Việc | Ai | Chặn bởi | Ghi chú |
|---|---|---|---|---|
| **P0** | Verify tay khuyết §0.3 (tô sơn SOLID → xem 3D có khối lạ không). Kết quả ghi vào `BAO-CAO-PHU` | PHU | — | 5 phút. **Đừng vá trước khi thấy** |
| **P1** | `inferElementType()` theo thang §2.3 · bỏ 2 nhánh `solid`/`!pattern` · trả kèm cờ `inferred` | PHU | P0 | Hàm thuần trong `lib/cad/`, có test — đúng luật tầng A `SPEC-3D-CORE` §1 |
| **P2** | `docToObjScene` đọc `elementType` trước, đoán sau; **mọi group có `entityId`** (Đ1-Đ2) | PHU | P1 | Không đổi chữ ký `docToObjScene` — hợp đồng `SPEC-3D-CORE` §3 |
| **P3** | `selectedIds` xuyên ống kính (Đ3) + badge "suy đoán" (L4) | G4 | P2 | Mở khoá chọn-theo-ngữ-nghĩa |
| **P4** | UI gán `elementType` hàng loạt + backfill `.idf` cũ | G4 | P3 | Xong mới xoá được nhánh đoán theo tên layer |
| **P5** | `RoomEntity` (§6) + lệnh "Nhận diện phòng" | PHU | P4 · TỔNG duyệt §6.2 | 🔴 nền của BIM nội thất |
| **P6** | 3D đọc `specId` → PBR; ghi ngược gán vật liệu (§4.3) | PHU | P5 · `SPEC-VAT-LIEU-PBR-IF` | Nối 3D vào BOQ — vòng khép kín đầu tiên |
| **P7** | Trình bày đọc thẳng Doc thay vì chỉ ảnh (§0.6) | G4 | P5 | Ảnh vẫn giữ cho deck; thêm đường dữ liệu |

**Chưa mở P0** thì mọi thứ sau đều là đoán. Bắt đầu từ P0.

---

## §10 · KHÔNG LÀM (chống phình)

- ❌ Không dựng bảng/DB riêng cho "cấu kiện 3D" — vi phạm L1.
- ❌ Không đồng bộ 2 chiều, không `syncDocToScene`, không diff/merge giữa các chặng — L6.
- ❌ Không đọc/ghi IFC ở spec này — **chờ NC-11** (COWORK-NC). Spec này chỉ dọn nhà để lúc IFC về
  thì ánh xạ được. Code IFC sớm = làm lại.
- ❌ Không dựng `beam` treo cao, không cầu thang, không MEP 3D — chưa có nơi tiêu thụ (L7).
- ❌ Không PBR mặc định — chốt "xám trơn" của `SPEC-3D-CORE` §2 vẫn sống; PBR là chế độ bật.
- ❌ Không đổi khoá kỹ thuật `sketch/pro/revit` · `concept/render/present` (vỡ persist — đợt 5 §CHINH).

---

## §11 · TREO — cần TỔNG/Hoà chốt trước khi code

| # | Câu hỏi | Chặn việc |
|---|---|---|
| 1 | Thêm `'covering'` vào `ElementType` — chờ NC-11 xác nhận ánh xạ `IfcCovering` rồi mới thêm? | §2.4 · P1 |
| 2 | `RoomEntity` là entity mới (vào `Entity` union, ảnh hưởng DXF/`.idf` round-trip) hay bảng phụ trong `Doc` (`Doc.rooms?: Room[]`, an toàn hơn cho round-trip)? **Nghiêng về bảng phụ** — phòng không phải hình học vẽ ra. | §6.2 · P5 |
| 3 | Sau P4, có xoá hẳn nhánh đoán theo tên layer không, hay giữ vĩnh viễn cho file nhập từ DXF ngoài? | §2.3 · P4 |
| 4 | `SceneTheme` xám trơn vs PBR: ai bật/tắt — người dùng, hay tự bật khi ≥X% entity có `specId`? | §7 · P6 |

---

## §12 · ĐÍNH CHÍNH FILE CŨ (§0d — ghi dấu, không đập)

| File | Đính chính |
|---|---|
| `SPEC-CHANG2-UI-2MODE.md` | Tên "2MODE" **nay sai** theo VÒNG CUỐI 03/08: chặng 3D Thiết kế có 2 chế độ **Node ↔ 3D**; nội dung §1-§5 vẫn dùng được, chỉ đổi cách gọi tên chặng. Đề nghị TỔNG chèn 1 dòng đầu file (Cowork không sửa file của vai khác). |
| `SPEC-3D-CORE.md` §0 | Ghi *"IF hai TẦNG… IF1/IF2"* — nay định vị là **một app, ba ống kính**, không còn hai tầng sản phẩm. Luật kỹ thuật §1-§4 **vẫn đúng nguyên**, chỉ cách gọi lỗi thời. |
| `cad-to-obj.ts:66-71` | Comment *"chưa có nơi tiêu thụ nên chưa gán `entityId`"* — **nay đã có** (§8 Đ1-Đ3). |

---
*COWORK-DỰNG soạn 03/08/2026 · đợt 5. Nền cho `SPEC-DUNG-3D-THONG-NHAT.md` (đợt 4, chưa viết —
làm sau khi §2/§6 được duyệt, vì bộ công cụ 3D phụ thuộc tập cấu kiện chốt ở đây).*
