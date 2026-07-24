# ĐỀ XUẤT · HỆ LEGEND 4 CHẶNG — chú giải · catalog · spec có cấu trúc — InteriorFlow

> **Trạng thái: ĐỀ XUẤT, CHƯA THỰC THI.** Task B2, docs-only. Mọi khối code là mẫu minh hoạ.
> Nhánh: `feat/legend-research` · Ngày: 2026-07-24 · Mọi khẳng định về code đã verify bằng đọc
> file thật (model.ts, shared-types.ts, furniture.ts, schema.prisma, zone-tool worktree,
> material-notes.ts, PresentDeck.tsx, 3 báo cáo RESEARCH liên quan).

"Legend" theo nghĩa rộng của chủ dự án: **hệ chú giải / catalog / spec có cấu trúc gắn với bản
vẽ và sản phẩm mỗi chặng** — không chỉ bảng màu. 13 ảnh tham khảo user gửi quy về 4 pattern:
① furniture spec sheet kiểu Volumen/Muuto (1 sản phẩm/1 sheet: ảnh + line drawing + kích thước
+ vật liệu + fabric options + giá đa currency) · ② kitchen millwork technical doc (exploded axo
+ đánh số A1-B7 + cutting list + bảng vật liệu + ghi chú thi công + render tham chiếu, 1 trang)
· ③ furniture proposal board (render + moodboard đánh số 1-7 + chú giải tên/brand + palette)
· ④ zone legend (nhóm chức năng + màu — feat/zone-tool đang làm).

---

## Mục lục

0. Tóm tắt cho người bận
1. Hiện trạng đã verify — cái gì ĐÃ CÓ để tựa vào
2. Nhóm X — Xuyên chặng: `ProductSpec` một nguồn dữ liệu (NỀN, làm trước)
3. Nhóm C — CAD: legend ký hiệu · zone legend · schedule tự đếm
4. Nhóm R — Rendering: material legend + palette tự trích
5. Nhóm P — Presenting: spec sheet · proposal board đánh số · millwork template
6. UI pattern phụ (quick-add / chips / overlay / timeline) — xếp loại
7. Bảng tổng hợp ưu tiên + effort + thứ tự làm nền IF2
8. Rủi ro & câu hỏi cần user quyết

---

## 0. TÓM TẮT CHO NGƯỜI BẬN

**Kiến trúc 1 câu:** thêm 1 bảng Prisma additive `ProductSpec` (spec sản phẩm/vật liệu thống
nhất, mirror giá từ Larkbase theo mẫu pull-only đã có) + 2 field optional trên entity CAD
(`BlockEntity.specId`, `HatchEntity.materialRefId` — cái sau đã đề xuất ở
RESEARCH-MATERIAL-BRIDGE) → mọi legend ở cả 3 chặng chỉ là **VIEW dựng tự động từ cùng 1 nguồn**,
CAD → Render → Present không nhập lại.

**Phát hiện then chốt (đã verify):**

| # | Phát hiện | Ý nghĩa |
|---|---|---|
| 1 | `BlockDef.meta?: ShapeMeta{price?, vendor?, sku?}` (`lib/cad/shared-types.ts:59`) **đã tồn tại từ Sprint 3 nhưng trống 100%** (khớp nợ kỹ thuật STATUS "meta giá/vendor/sku trống"). | Chỗ cắm spec đã được chừa sẵn — nhưng nó nằm trên BlockDef tĩnh (hardcode trong furniture.ts), KHÔNG scale cho 46 block DXF + asset user upload → cần chuyển lên DB (`ProductSpec`), giữ `ShapeMeta` làm fallback hiển thị. |
| 2 | `Entity.elementType` (wall/slab/column/beam/door/window/furniture — IF2-nền đã merge, `model.ts:73`) + `BlockEntity.block` key | **Schedule tự đếm được NGAY** — filter entities theo elementType/block, group + count. Đây là bước đệm tự nhiên cho IFC IF2-C: schedule chính là "IfcElementQuantity bản 2D". |
| 3 | Zone legend ĐÃ có nền: `ZONE_GROUP_META` 6 nhóm {vi, en, color} + `ZoneEntity.group` trong worktree `feat/zone-tool` (`model.ts:242-255` nhánh đó, wip b20d1d7). | Nhóm C chỉ cần THÊM khối "vẽ legend lên canvas/PDF", không đụng schema zone. |
| 4 | Node `util.materialnote` (name/code/supplier/hex/note nhập tay) + đề xuất `MaterialRef` (Larkbase mirror) + `LibraryAsset.palette` (JSON hex, VLM đã chạy 1450/1515 ảnh) | Material legend chặng Rendering = gom 3 nguồn này thành 1 dải swatch — 0 hạ tầng AI mới. |
| 5 | Presenting xuất PDF qua `buildDeckPdf` (`lib/report-deck.ts`) + TTT design system bắt buộc cho mọi export | Spec sheet / proposal board là **slide template mới** trong pipeline có sẵn, không phải app mới. |
| 6 | Larkbase: mẫu mirror pull-only + `raw` JSON đã chạy thật (`LarkTaskRef`/`LarkPersonRef`), nhưng **base hiện trỏ sai workspace, chưa có bảng vật liệu/sản phẩm** (RESEARCH-MATERIAL-BRIDGE §1.6, Q1 chưa trả lời). | Cột giá của `ProductSpec` thiết kế sẵn nhưng **để trống được** — không chặn C/R/P; móc Larkbase là bước sau khi Q1 chốt. |

**Thứ tự đề xuất (nền IF2):** X1 schema (S) → C1 schedule (M) → C2 symbol legend (S) → R1
material legend (M) → P1 proposal board (M) → P2 spec sheet (M) → P3 millwork template (L, hoãn
được) → X2 móc Larkbase giá (S, chờ Q1).

---

## 1. HIỆN TRẠNG ĐÃ VERIFY

- **`lib/cad/model.ts`** — `Entity` union 9 loại; `Base.elementType?: ElementType` +
  `Base.storey?: string` (IF2-nền, optional, backward-compat); `Layer{lineweight, lineType}`;
  `DEFAULT_LAYERS` 5 lớp chuẩn. KHÔNG có field spec/giá nào trên entity.
- **`lib/cad/shared-types.ts:59`** — `ShapeMeta{price?, vendor?, sku?}`; `furniture.ts` khai
  `BlockDef.meta?: ShapeMeta` nhưng **không BlockDef nào điền** (grep 0 chỗ gán).
- **`docs/CAD-LIBRARY.md`** — 46 block DXF `public/cad-library/manifest.json` có
  `{id, name, category, w, h, source, license}` — cũng KHÔNG giá/vendor/sku.
- **`feat/zone-tool` (wip)** — `ZoneEntity{group: ZoneGroup}` + `ZONE_GROUP_META` 6 nhóm
  song ngữ + màu; `ZonePanel.tsx` đang dở. Legend hiển thị nhóm+màu là phần N-tiếp của A2.
- **Rendering** — `util.materialnote` node nhập tay; `input.guref` node 0-credit đọc
  `GuProfile` (mẫu hình cho `input.materialref` — bridge §7.1); `LibraryAsset.palette`
  JSON hex; `mixPaletteLab` gom cụm LAB.
- **Presenting** — `PresentDeck` → `buildDeckPdf`/`downloadPdf`; template dàn trang +
  perceptron LayoutShelf; export PHẢI theo TTT design system (`knowledge/ttt-design-system/`).
- **Prisma** — `LibraryAsset` không sku/vendor/price; mẫu Larkbase mirror `LarkTaskRef`/
  `LarkPersonRef` (pull-only, `larkRecordId @unique`, `raw` JSON) đã chạy thật.
- **IDF** — `lib/cad/idf.ts` serialize `Doc`; mọi field mới optional ⇒ `.idf` cũ vẫn parse
  (nguyên tắc additive đã áp cho elementType/storey/zone).

---

## 2. NHÓM X — XUYÊN CHẶNG: `ProductSpec` MỘT NGUỒN DỮ LIỆU (làm TRƯỚC)

**Mô tả.** Mọi legend/schedule/spec-sheet đều cần trả lời "sản phẩm/vật liệu này là gì, kích
thước, vật liệu, brand, giá". Hôm nay câu trả lời rải ở 4 chỗ (ShapeMeta trống · manifest 46
block · LibraryAsset · Larkbase chưa có bảng). Đề xuất 1 bảng DB duy nhất, các chặng chỉ THAM
CHIẾU bằng id.

### 2.1 Schema Prisma (MẪU — additive, không sửa bảng cũ)

```prisma
// ══ MỚI ══ Spec sản phẩm/vật liệu thống nhất — nguồn cho MỌI legend 3 chặng.
model ProductSpec {
  id           String   @id @default(cuid())
  kind         String                     // 'furniture' | 'material' | 'lighting' | 'millwork' | 'fixture'
  name         String                     // "Ghế Volumen Lounge"
  nameEn       String?                    // song ngữ TTT: "Volumen Lounge Chair"
  brand        String?                    // "Muuto"
  sku          String?
  vendor       String?
  // kích thước danh nghĩa mm (khớp BlockDef.w/h; d = sâu, hUp = cao thật 3D cho spec sheet)
  w            Int?
  d            Int?
  hUp          Int?
  materials    String   @default("")      // JSON string[] — ['oak','linen'] (khớp MATERIAL_TERMS gu.ts)
  finishes     String   @default("")      // JSON string[] — fabric/finish options (spec sheet Volumen)
  colorHex     String?                    // swatch chính
  imageAssetId String?                    // FK LibraryAsset — ảnh sản phẩm/swatch (lưu-theo-tham-chiếu)
  drawingBlock String?                    // key BlockDef/manifest id — line drawing top-view CÓ SẴN
  // ---- giá: mirror Larkbase, pull-only, ĐỂ TRỐNG được (Q1 chưa chốt bảng) ----
  priceNote    String?                    // text tự do "1.250.000đ/cái" — chưa chuẩn hoá số (bridge §8)
  currency     String?                    // 'VND' | 'USD' | 'EUR' — đa currency như sheet Volumen
  larkRecordId String?  @unique           // khoá sync nếu record đến từ Larkbase
  raw          String?                    // JSON field gốc Larkbase (mẫu LarkTaskRef)
  note         String?
  createdAt    DateTime @default(now())
  syncedAt     DateTime?

  @@index([kind])
  @@index([sku])
}
```

Vì sao KHÔNG nhét vào `LibraryAsset`: lifecycle khác (asset = file user upload; spec = bản ghi
danh mục, có thể 0 ảnh hoặc nhiều ảnh) — cùng lập luận tách `MaterialRef` ở bridge §2.2.
Vì sao KHÔNG gộp `MaterialRef` (bridge) vào đây: **NÊN GỘP** — `ProductSpec.kind='material'`
phủ đúng vai `MaterialRef`; đề xuất khi build M1 material-bridge thì dùng luôn bảng này thay vì
tạo 2 bảng song song (1 quyết định cho user — xem Q-L2 §8).

### 2.2 Móc vào IDF/entity (MẪU — additive)

```ts
// lib/cad/model.ts — BlockEntity (MẪU)
export interface BlockEntity extends Base {
  // ...field cũ giữ nguyên...
  /** Legend — FK ProductSpec.id; optional, .idf cũ không có vẫn parse. */
  specId?: string;
}
// HatchEntity.materialRefId → đổi tên đích thành ProductSpec (kind='material') nếu Q-L2 = gộp.
```

`.idf` chỉ lưu id (vài chục ký tự) — đúng nguyên tắc lưu-theo-tham-chiếu của `refingest.ts`.
DXF export: ghi `specId` vào XDATA hoặc bỏ qua (không phá round-trip — DXF không cần biết).

### 2.3 Luồng dữ liệu chảy xuyên chặng

```
Larkbase (giá, pull-only, chờ Q1) ─┐
manifest 46 block + BlockDef 16    ─┼→ ProductSpec ←─ user nhập/sửa tay (panel Library)
LibraryAsset (ảnh, palette, VLM)   ─┘        │
                                             ├→ CAD: BlockEntity.specId → schedule đếm + info panel
                                             ├→ Render: materialsToPrompt() + material legend swatch
                                             └→ Present: spec sheet / proposal board / millwork table
```

**UI đặt đâu:** tab mới "Sản phẩm · Spec" trong panel Library (cạnh Reference) — bảng phẳng
CRUD + nút "Đồng bộ Larkbase" (disabled tới khi Q1). CAD: khi chọn 1 block, property panel hiện
spec (đọc `specId`, fallback `ShapeMeta`) + dropdown "Gán spec".

**Effort: S** (schema + CRUD API + seed từ manifest ~46 dòng + BlockDef 16 dòng). **Ưu tiên #1
— mọi nhóm dưới phụ thuộc.**

---

## 3. NHÓM C — CAD: LEGEND KÝ HIỆU · ZONE LEGEND · SCHEDULE TỰ ĐẾM

### C1 — Schedule (bảng thống kê tự đếm) — nền IFC IF2

**Mô tả.** Door schedule / window schedule / furniture schedule đếm TỰ ĐỘNG từ
`doc.entities`: group theo `elementType` + `block` key (+ `variant`), đếm số lượng, kèm kích
thước từ BlockDef/ProductSpec. Đây là tính năng "CAD sơ phác hồ sơ DD" đúng tầm nhìn EFC
(memory: /cad-editor chỉ cần mức DD, không CAD pro).

```ts
// lib/cad/schedule.ts (MẪU — thuần, test được như dossier-check.ts)
export interface ScheduleRow {
  key: string;          // block key hoặc elementType
  label: string;        // tên hiển thị (BlockDef.name / ProductSpec.name)
  count: number;
  w?: number; h?: number;  // mm danh nghĩa
  specId?: string;      // → kéo sku/vendor/price khi render bảng
}
export function buildSchedule(doc: Doc, filter: ElementType | 'all'): ScheduleRow[] {
  const rows = new Map<string, ScheduleRow>();
  for (const e of doc.entities) {
    if (filter !== 'all' && e.elementType !== filter) continue;
    const key = e.type === 'block' ? `${e.block}:${e.variant ?? ''}` : (e.elementType ?? '');
    if (!key) continue;
    const r = rows.get(key) ?? { key, label: lookupName(key), count: 0, specId: (e as BlockEntity).specId };
    r.count++;
    rows.set(key, r);
  }
  return [...rows.values()].sort((a, b) => b.count - a.count);
}
```

Xuất 2 dạng: (a) **panel bên** (đọc live, click row → highlight entity trên canvas — cơ chế
select đã có), (b) **đóng dấu lên bản vẽ** thành nhóm `text` + `line` entity cạnh khung tên
(dùng lại pipeline PDF `lib/cad/pdf.ts` — bảng in ra được ngay, DXF export được vì chỉ là
text/line thường).

Mock:

```
┌ FURNITURE SCHEDULE ─────────────────────────┐
│ #  Ký hiệu  Tên             SL  KT (mm)  SKU │
│ 1  [sofa]   Sofa 3 chỗ       2  2200×900  —  │
│ 2  [bed-q]  Giường queen     3  1600×2000 —  │
│ 3  [wc]     Bồn cầu          4   700×400  —  │
└──────────────────────────────────────────────┘
```

**UI:** nút "Thống kê" trong CadToolbar (cạnh Layers) mở panel; nút "Đóng dấu vào bản vẽ"
trong panel. **Effort: M** (logic S, nhưng đóng dấu bảng lên canvas + PDF cần layout cẩn thận).
**Ưu tiên #2 — trực tiếp làm nền IF2-C (BIM/IFC quantity).**

### C2 — Legend ký hiệu (door/window/electrical/linetype)

**Mô tả.** Khung chú giải "ký hiệu này nghĩa là gì" tự sinh từ những gì bản vẽ ĐANG dùng:
quét `doc.entities` → tập block key + linetype + hatch pattern thực dùng → vẽ mỗi loại 1 hàng
(thumbnail mini vẽ bằng chính `drawEntity` của `lib/cad/render.ts` — như BlockLibraryDemo đã
chứng minh) + tên từ BlockDef/manifest. KHÔNG hardcode danh sách — legend chỉ chứa cái có mặt.

**Schema:** không cần bảng mới — legend là VIEW thuần từ Doc. Chỉ cần 1 setting per-sheet
`{showLegend: boolean, at: Pt}` lưu trong Doc (field optional mới `legend?: {at: Pt, show:
('blocks'|'linetypes'|'hatches'|'zones')[]}`).

**UI:** lệnh `LEGEND` trong command bar + mục trong menu Xuất; kéo-thả vị trí như MarkupPin.
**Effort: S** (tái dùng renderer + đã có mẫu thumbnail SVG cad-library). **Ưu tiên #3.**

### C3 — Zone legend (ĐÃ CÓ Ở A2 — chỉ ghi nhận, không làm lại)

`feat/zone-tool` đang build `ZoneEntity` + `ZONE_GROUP_META` + ZonePanel. Việc của hệ Legend:
khi C2 build khung legend chung thì zone legend trở thành **1 section trong cùng khung** (nhóm
màu + tên vi·en + tổng diện tích zone — `zoneBoundaryPoints` → shoelace area, hàm hình học
đã có kiểu tương tự trong geometry.ts). **Effort: S (sau khi A2 merge). Không khởi động trước
khi A2 xong — tránh giẫm worktree.**

---

## 4. NHÓM R — RENDERING: MATERIAL LEGEND + PALETTE TỰ TRÍCH

### R1 — Material legend (dải swatch + nguồn node)

**Mô tả.** Với mỗi ảnh render output, hiện dải chú giải vật liệu: swatch màu/ảnh + tên + node
nguồn (materialnote nào, guref nào, hatch nào từ CAD). Ba nguồn gộp theo thứ tự tin cậy:

1. `HatchEntity.materialRefId/specId` từ Doc CAD nối vào flow (chính xác nhất — user đã gán).
2. Node `util.materialnote` trong cùng flow (nhập tay).
3. Palette tự trích từ ảnh output (`LibraryAsset.palette` pipeline có sẵn — VLM + LAB cluster)
   — fallback khi 2 nguồn trên trống, đánh dấu "tự trích" để user biết là đoán.

```
┌ VẬT LIỆU · MATERIALS ──────────────────────────────┐
│ ██ Travertine — sàn      (từ hatch CAD · spec #12) │
│ ██ Gỗ sồi / Oak — ốp     (node Material Note)      │
│ ██ #C9B8A3 — tường       (tự trích từ ảnh)         │
└─────────────────────────────────────────────────────┘
```

**Schema:** không bảng mới — legend là VIEW; kết quả "tự trích" lưu vào field JSON có sẵn của
FlowVersion snapshot (mẫu bridge §6.2) để không tính lại mỗi lần mở.

**UI:** section "Vật liệu" trong panel thuộc tính node ảnh output + toggle "kèm legend khi
export PNG" (compose dải swatch dưới ảnh — canvas compose đã có ở crop-composite node).
**Effort: M.** **Ưu tiên #4** (sau X1; KHÔNG chờ Larkbase — nguồn 2+3 chạy được ngay).

### R2 — Palette board tự trích (phụ, gộp vào R1)

`buildGuProfile`/`mixPaletteLab` đã gom palette từ N ảnh. Thêm nút "Xuất palette board" từ 1
nhóm ảnh render → 1 ảnh PNG dải màu + mã hex (TTT style) để thả vào Presenting. **Effort: S,
làm cùng R1.**

---

## 5. NHÓM P — PRESENTING: SPEC SHEET · PROPOSAL BOARD · MILLWORK TEMPLATE

Cả 3 là **slide template mới** trong pipeline `buildDeckPdf` có sẵn, bắt buộc theo TTT design
system (Archivo, beige `#F1ECE3`, hairline keyline, song ngữ `·`).

### P1 — Furniture proposal board (đánh số tự động) — làm TRƯỚC trong nhóm P

**Mô tả.** Pattern ảnh ③: render không gian + lưới sản phẩm đánh số 1-7 + chú giải tên/brand
+ palette. Điểm ăn tiền: **số thứ tự sinh TỰ ĐỘNG** từ Doc CAD của cùng project — mỗi
`BlockEntity.specId` distinct = 1 số; ảnh sản phẩm kéo từ `ProductSpec.imageAssetId`; palette
từ R2. User chỉ chọn ảnh render chính + sắp lại thứ tự nếu muốn.

```
┌────────────────────────────────┬──────────────┐
│                                │ ① Sofa Muuto  │
│      [render không gian]       │ ② Bàn trà oak │
│      (marker ①②③ đè lên ảnh,   │ ③ Đèn floor   │
│       kéo-thả vị trí tay)      │ ④ Thảm linen  │
│                                ├──────────────┤
├────────────────────────────────┤ ██ ██ ██ ██  │
│ NỘI THẤT ĐỀ XUẤT · PROPOSAL    │  palette      │
└────────────────────────────────┴──────────────┘
```

**Schema:** slide data JSON trong deck hiện có (`{renderAssetId, items: [{specId, n, marker?:
Pt}], paletteHex[]}`) — không bảng mới. **UI:** template mới trong LayoutShelf (perceptron học
được luôn vì cùng cơ chế `tpl:*`). **Effort: M.** **Ưu tiên #5.**

### P2 — Spec sheet generator (kiểu Volumen/Muuto)

**Mô tả.** Pattern ①: 1 trang/1 sản phẩm — ảnh (`imageAssetId`) + line drawing top-view (vẽ
từ `drawingBlock` bằng renderer CAD, xuất SVG như thumbnail cad-library đã làm) + bảng kích
thước w/d/hUp + materials/finishes chips + giá `priceNote`+`currency` (đa currency = nhiều dòng
ProductSpec cùng sku, hoặc để 1 dòng — đủ cho M1). Sinh hàng loạt: chọn N spec → N trang PDF
phụ lục sau deck chính.

**UI:** trong tab "Sản phẩm · Spec" (X1) nút "Xuất spec sheet"; trong Presenting: mục "Phụ lục
spec" khi build deck. **Effort: M** (layout 1 trang TTT + loop; line drawing tái dùng 100%).
**Ưu tiên #6.**

### P3 — Millwork technical doc template — HOÃN ĐƯỢC (L)

**Mô tả.** Pattern ②: exploded axonometric + đánh số A1-B7 + cutting list + bảng vật liệu +
construction notes + render tham chiếu trên 1 trang. Phần **tự động hoá được ngay**: bảng
cutting list + bảng vật liệu (đọc ProductSpec kind='millwork' + con của nó) + khung layout TTT.
Phần **KHÔNG tự động được với stack hiện tại**: exploded axo — IF chưa có 3D (IF2-B three.js
viewer mới ở mức chờ Sprint); M1 chỉ chừa ô "user thả ảnh axo vẽ ngoài (3ds Max/SketchUp)".

**Schema:** cần quan hệ cha-con component: thêm `ProductSpec.parentId?` + `partCode?`
('A1'…'B7') + `cutW/cutD/cutT` (kích thước phôi) — 4 cột additive, chỉ migrate khi làm P3.
**Effort: L** (form nhập component nhiều dòng + layout dày đặc). **Ưu tiên #8 — hoãn tới khi
có dự án millwork thật cần; đừng xây trước nhu cầu (bài học Q7 bridge).**

---

## 6. UI PATTERN PHỤ (từ 13 ảnh) — XẾP LOẠI, KHÔNG THUỘC HỆ LEGEND

| Pattern | Xếp loại | Ghi chú |
|---|---|---|
| Canvas quick-add (Image/Frame/Video, phím A/F) | UX chặng Rendering — việc riêng, KHÔNG legend | Đáng làm nhưng thuộc nhóm gesture/canvas; đề xuất ghi vào IF-FEATURE-UPGRADES khi tới lượt |
| Attachment chips trong chat input | Thuộc Chat FULL (RESEARCH-CHAT-FULL) | Chờ ACCESS-CONTROL M1 xong theo lộ trình đã chốt |
| Generating-image overlay trên canvas | Rendering UX polish | Đã có pattern generating ở node; chỉ là skin |
| Design-phases timeline | Present/Home dashboard | Ghép được vào catalog 4 chặng đã build (4stages-catalog) |

Nêu ở đây để trả lời đủ 13 ảnh; KHÔNG đưa vào phạm vi hệ Legend — tránh trôi scope.

---

## 7. BẢNG TỔNG HỢP — ƯU TIÊN · EFFORT · PHỤ THUỘC

| # | Việc | Nhóm | Effort | Phụ thuộc | Vì sao thứ tự này |
|---|---|---|---|---|---|
| 1 | **X1** `ProductSpec` schema + CRUD + seed manifest/BlockDef + tab Library | X | **S** | — | Nền của mọi thứ dưới; additive, 0 rủi ro |
| 2 | **C1** Schedule tự đếm (panel + đóng dấu bản vẽ + PDF) | CAD | **M** | X1 (nhẹ — chạy được cả khi spec trống) | Nền IF2-C IFC quantity; giá trị hồ sơ DD ngay |
| 3 | **C2** Legend ký hiệu tự sinh + khung legend chung | CAD | **S** | — | Rẻ, tái dùng renderer; khung chứa luôn C3 |
| 4 | **C3** Zone legend vào khung chung | CAD | **S** | A2 merge + C2 | Không giẫm worktree zone-tool đang chạy |
| 5 | **R1+R2** Material legend 3 nguồn + palette board | Render | **M** | X1 | Không chờ Larkbase (nguồn 2+3 độc lập) |
| 6 | **P1** Proposal board đánh số tự động | Present | **M** | X1 (+C1 helper đếm) | Deliverable khách thấy ngay, demo mạnh |
| 7 | **P2** Spec sheet generator Volumen-style | Present | **M** | X1, P1 (layout chung) | |
| 8 | **X2** Móc Larkbase giá (sync pull-only vào ProductSpec) | X | **S** | 🔴 Q1 bridge (bảng vật liệu Larkbase chưa tồn tại) | Chỉ là script sync theo mẫu LarkTaskRef |
| 9 | **P3** Millwork doc template + parentId component | Present | **L** | X1, P2, nhu cầu thật | Hoãn — thiếu 3D exploded, ROI chưa rõ |

Ước lượng thô: đợt 1 (X1+C1+C2) ≈ 1 sprint agent; đợt 2 (R1+P1+P2) ≈ 1 sprint; X2/C3 lắt nhắt
ghép chuyến; P3 để ngỏ.

---

## 8. RỦI RO & CÂU HỎI CẦN USER QUYẾT

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Schema đẻ 2 bảng trùng vai (`ProductSpec` vs `MaterialRef` của bridge) | Trung | Q-L2 quyết GỘP trước khi agent nào build trước |
| Schedule đếm sai khi entity chưa gán elementType (dữ liệu cũ undefined) | Thấp | Hàng "Chưa phân loại (n)" trong bảng + nút gán nhanh — biến thành công cụ migrate elementType luôn |
| Đóng dấu bảng/legend lên canvas phá layout khi bản vẽ đổi | Thấp | Legend/schedule là entity text/line thường — user xoá/regenerate; kèm nút "Cập nhật lại" |
| Giá đa currency phức tạp hoá sớm | Thấp | M1: 1 priceNote + 1 currency/dòng; đa currency = tính năng sau |
| Spec sheet cần line drawing mà asset upload không có `drawingBlock` | Trung | Ô drawing để trống được (sheet vẫn hợp lệ); gợi ý block gần nhất theo category |

**Câu hỏi:**

| # | Câu hỏi | Khuyến nghị |
|---|---|---|
| Q-L1 | Chốt thứ tự bảng §7 — đợt 1 phóng X1+C1+C2 cùng 1 agent? | Có — 3 việc dính nhau, 1 worktree |
| Q-L2 | GỘP `MaterialRef` (bridge) vào `ProductSpec(kind='material')` hay 2 bảng riêng? | **GỘP** — 1 nguồn, tránh 2 picker/2 sync |
| Q-L3 | Schedule đóng dấu lên bản vẽ bằng entity thường (xoá/sửa được, có thể lệch khi Doc đổi) hay object sống tự cập nhật? | Entity thường + nút regenerate cho M1 — object sống cần dirty-tracking, để IF2 |
| Q-L4 | Spec sheet đa currency: cần thật (khách quốc tế) hay 1 currency đủ? | 1 currency M1; hỏi lại khi có dự án ngoại tệ |
| Q-L5 | P3 millwork: có dự án thật nào cần trong 2 tháng tới không? | Nếu không → giữ hoãn |

---

*Hết. Không có thay đổi code nào kèm theo tài liệu này.*
