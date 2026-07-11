# CAD-AI-MECHANISM — Cơ chế AI vẽ Layout CAD (chặng 1)

> Tài liệu nghiên cứu + thiết kế cơ chế cho tính năng **"AI mô tả"** ở `/cad-editor`.
> Phạm vi: **sơ phác hồ sơ DD (Design Development)** — bấm 1 nút, từ 1 câu mô tả ra ngay mặt
> bằng có tường/nhãn/nội thất đặt **đúng công năng, không tràn, không nhảy vị trí**. KHÔNG nhắm
> tới CAD chuyên nghiệp (phần đó thuộc app EFC tách rời).
>
> File cài đặt: `lib/cad/ai-assist.ts`. Tái dùng `commands.roomRect`, `furniture.BLOCKS`,
> `model.ts`, và đối chiếu `lib/cad/standards/**`.

---

## 0. Chẩn đoán bản stub cũ (vì sao "vẽ sai + nhảy lung tung")

Bản cũ `describeToEntities` (rule-based 1 hàm) có 5 lỗi gốc:

1. **Sai layer** — đặt block nội thất lên `wallLayer` (`l-wall`) thay vì layer nội thất
   `l-furniture`. → nội thất tô đậm như tường, sai phân cấp nét ISO 128.
2. **Tràn ra ngoài phòng** — công thức `x = origin.x + wallThickness*2 + def.w/2 + i*(def.w+300)`
   xếp mọi món thành **1 hàng ngang từ góc trên-trái**, không đối chiếu bề rộng phòng → phòng hẹp
   hoặc nhiều món thì block chạy xuyên tường ra ngoài.
3. **Chỉ dựng 1 phòng** — không hiểu đề bài nhiều phòng.
4. **Không hiểu công năng** — giường không áp tường, WC không sát tường, bếp lơ lửng… Đặt "cho có".
5. **Không tránh chồng lấn** — các món có thể đè lên nhau.

"Nhảy lung tung" = hệ quả của việc đặt theo **thứ tự tìm thấy từ khoá** + toạ độ không neo theo
hình học phòng. Sửa gốc = tách **parse (có thể ngẫu nhiên/mờ)** khỏi **hình học (phải tất định)**.

---

## 1. DEEP RESEARCH — quy chuẩn & thuật toán vẽ CAD (có trích nguồn)

### 1.1 Quy ước bản vẽ kiến trúc & hệ nét

- **Tỉ lệ mặt bằng nội thất**: 1:50 (chi tiết) và 1:100 (tổng thể/căn hộ) là 2 tỉ lệ phổ biến;
  1:100 dùng cho mặt bằng căn hộ/nhà. (nguồn: coohom "Architectural Drafting Standards for 2D
  Floor Plans" — https://www.coohom.com/article/architectural-drafting-standards-for-professional-2d-floor-plans).
- **Hệ nét (lineweight) ISO 128-2:2020**: thang bề dày chuẩn 0.13/0.18/0.25/0.35/0.5/0.7/1.0/1.4/2.0
  mm; tỉ lệ nét đậm:mảnh ≥ 2:1 trong 1 bản vẽ. **ĐÃ khớp** với `STANDARD_LINEWEIGHTS` trong
  `model.ts` và rule `iso128-lineweight-set` / `iso128-thick-thin-ratio` trong
  `standards/iso-drafting.ts`. Phân cấp áp dụng (đã cài ở `DEFAULT_LAYERS`):
  - Tường (bị mặt cắt) 0.5–0.7mm — **đậm nhất**.
  - Nội thất/thiết bị/cửa 0.25–0.35mm — trung.
  - Kích thước/ghi chú/trục 0.13–0.18mm — mảnh.
  → Vì vậy nội thất **BẮT BUỘC** ở layer `l-furniture` (0.3mm), không phải `l-wall` (0.6mm).

### 1.2 Biểu diễn TƯỜNG

- **Tim tường vs mặt tường**: bản vẽ ghi kích thước theo **tim tường (centerline-to-centerline)**
  hoặc **mặt hoàn thiện (finish-to-finish)** tuỳ chuẩn; ký hiệu centerline dùng cho vật đối xứng
  (tường/cột/cửa sổ). (nguồn: cadcrowd "Architectural Symbols for 2D Drawings" —
  https://www.cadcrowd.com/blog/how-do-companies-interpret-architectural-symbols-for-2d-drawings-and-floor-plans/).
  → App dùng **tim tường**: `wallSegment` offset ±t/2 quanh đường tim (đã đúng).
- **Bề dày**: tường bao ~200–220mm, vách ngăn ~100–110mm (khung thực hành VN, đã dùng trong
  `demo-plan.ts`: EXT=210, PART=100). Lòng phòng thông thuỷ = kích thước tim − bề dày.

### 1.3 CỬA đi / cửa sổ

- **Ký hiệu cửa**: 1 nét cắt tường (khung) + **cung quét (arc)** thể hiện chiều mở & vùng cung
  cửa chiếm chỗ. (nguồn: cadcrowd, ở trên; cadauthority "How to Draw a Door in AutoCAD" —
  https://cadauthority.com/how-to/tutorials/draw-door-autocad-guide/). App đã có block `door`
  (khung + cánh + cung) trong `furniture.ts`.
- **Kích thước thông thuỷ (thực hành VN, đã dùng trong demo)**: cửa chính 900mm, cửa phòng 800mm,
  cửa WC 700mm → block `door`/`doorRoom`/`doorWC`. *(số thực hành, chưa gắn 1 điều khoản TCVN cụ thể
  — coi là quy ước dự án).*

### 1.4 Ghi KÍCH THƯỚC, nhãn, lưới trục, khung tên

- **ISO 129** (ghi kích thước): mũi tên/gạch chéo đầu mút, đường gióng vượt đường kích thước 1
  đoạn ngắn, chữ số giữa/trên đường. App có `dimensionChain` + tick 45° (hợp tinh thần chung; số
  liệu cụ thể tick/khoảng vượt **chưa đối chiếu bản gốc** — xem `iso129-dimension-style-minimal`,
  verified=false).
- **ISO 7200** (khung tên): tối thiểu tên/mã dự án, tên bản vẽ, tỉ lệ, ngày, người vẽ. App có
  `titleBlock` (đủ trường; **chưa** đối chiếu bảng trường bắt buộc bản gốc — verified=false).
- **Lưới trục**: số 1,2,3… trục X, chữ A,B,C… trục Y, bong bóng tròn đầu trục — app có `axesGrid`.
- **Khổ giấy ISO 216** (A0–A4) — có trong `standards`, dùng cho pipeline in (Nấc 7, chưa làm).

### 1.5 KHOẢNG LƯU KHÔNG (clearance) & CÔNG NĂNG — phần cốt lõi cho bộ giải

Tổng hợp Neufert / NKBA / thực hành (mm quy đổi từ inch). **Đây là số liệu ĐỊNH HƯỚNG cho DD
sketch, chưa đối chiếu bản in gốc Neufert/Time-Saver → coi là "chưa xác minh cứng"**, nhưng đủ
tin cậy để làm tham số bố cục:

| Quan hệ | Trị số | Nguồn |
|---|---|---|
| Lối đi quanh giường (mỗi bên, tối thiểu) | **≥ 600mm** (Neufert); 750–900mm dùng hằng ngày | homesandgardens; roomsketch3d; hunker |
| Không gian 1 người di chuyển tự do | 600–750mm | roomsketch3d |
| Sofa ↔ bàn trà | 350–450mm (14–18 in) | apartmenttherapy; casagear |
| Ghế bàn ăn kéo ra | 600–900mm (24–36 in) | sicotas; arcedior |
| Lối đi sau ghế ăn (người qua lại) | 1000–1200mm (42–48 in) | vbufurniture; rocabudesigns |
| Lối đi bếp (work aisle) — 1 người | **≥ 1067mm (42 in)** | NKBA Kitchen Planning Guidelines |
| Lối đi bếp — 2 người | **≥ 1219mm (48 in)** | NKBA |
| Tim bồn cầu ↔ tường/thiết bị bên | **≥ 450mm (18 in)** | NKBA Bath Planning Guidelines |
| Khoảng trống trước bồn cầu/lavabo | ≥ 530–600mm (21 in) | NKBA |

Nguồn (URL):
- Neufert bed clearance & bedroom: https://www.homesandgardens.com/interior-design/bedrooms/an-expert-guide-to-bedroom-clearances-measurements-and-spacing ; https://roomsketch3d.com/help/dimensions/clearance-around-furniture ; https://www.hunker.com/13412472/how-much-walking-space-should-be-around-bedroom-furniture/
- Living/dining clearances: https://www.apartmenttherapy.com/dimensions-to-follow-proper-furniture-spacing-basics-149156 ; https://www.sicotas.com/blogs/blogs-sicotas-brand-story/minimum-space-around-dining-table ; https://vbufurniture.com/blogs/furniture-buying-guide/zonal-transition-math ; https://arcedior.com/blog/chair-clearance-behind-dining-tables
- NKBA Kitchen/Bath Planning Guidelines (PDF): https://media.nkba.org/uploads/2022/05/Kitchen-Planning-Guidelines.pdf ; https://media.nkba.org/uploads/2022/05/Bath-Planning-Guidelines.pdf

**Quan hệ LIỀN KỀ (functional adjacency)** — không có 1 con số, là nguyên tắc phân khu (đã ghi
trong `demo-plan.ts` sau khi sửa lỗi thật):
- Bếp cạnh khu ăn (dây chuyền nấu→bày→ăn ngắn).
- **WC/phòng ngủ KHÔNG đi xuyên bếp** — bếp là "phòng cụt" (1 cửa), lối tới WC/ngủ đi qua khách
  hoặc hành lang. (Đây chính là lỗi công năng thật của demo cũ.)
- Phòng ngủ = khối sâu/xa cửa nhất (yên tĩnh).
- Diện tích tối thiểu (TCVN 4451:2012, `standards/vn-residential.ts`): ngủ ≥ 9m², WC ≥ 2.5m²,
  bếp+ăn không tách ≥ 10m² *(số tra qua web, chưa đọc PDF gốc — verified nhưng cần đối chiếu)*.
- Hành lang thoát nạn (QCVN 06:2022/BXD, `standards/vn-fire.ts`): ≥ 1.0m (chung), ≥ 1.2m (F1 >15
  người).

> **Giới hạn scope**: chặng 1 KHÔNG tự sinh đồ thị liền kề tối ưu (đó là bài toán bố cục kiến
> trúc đầy đủ). Ở mức sketch, bộ giải chỉ **xếp phòng cạnh nhau theo lưới** và đặt nội thất đúng
> công năng TRONG từng phòng. Đồ thị liền kề nằm trong JSON schema (mục 2.2) để nâng cấp sau.

---

## 2. CƠ CHẾ AI ĐỀ XUẤT — pipeline 2 tầng

### 2.1 Sơ đồ

```
   Đề bài NL          TẦNG 1: PARSE            JSON trung gian         TẦNG 2: SOLVER            Entity[]
"phòng ngủ 3.4x3.6   ─────────────────►   LayoutSpec { rooms:[…] }  ─────────────────►   walls + labels +
 có giường và tủ,        (LLM / stub)        (có cấu trúc, kiểm            (HÌNH HỌC              furniture blocks
 bếp, wc"                                     chứng được)                TẤT ĐỊNH)             (đúng layer, đúng chỗ)
                     ▲ chỗ DUY NHẤT dùng LLM                      ▲ diệt bug "nhảy/tràn/sai layer"
```

- **Ranh giới trách nhiệm** (điểm mấu chốt):
  - **LLM lo**: hiểu ngôn ngữ tự nhiên mờ/đa dạng → điền đúng `LayoutSpec` (tên, công năng, kích
    thước nếu có, danh sách nội thất). LLM **KHÔNG** sinh toạ độ.
  - **Bộ giải (deterministic) lo**: mọi toạ độ, neo tường, clearance, clamp, tránh chồng, chọn
    layer, xoay block. Cùng `LayoutSpec` → **luôn cùng 1 kết quả** ⇒ không nhảy.
- Hiện tại TẦNG 1 là **stub rule-based** (`parseDescription`) chạy offline/máy yếu. Khi cắm LLM
  thật: thay **duy nhất** `parseDescription` bằng 1 lời gọi `/api/jobs` (adapter AI của app) với
  prompt yêu cầu trả JSON đúng `LayoutSpec`; TẦNG 2 giữ nguyên.

### 2.2 JSON schema trung gian (`LayoutSpec`)

Đã export kiểu TypeScript trong `ai-assist.ts`:

```ts
type RoomFunction = 'bedroom'|'living'|'dining'|'kitchen'|'bath'|'office'|'corridor'|'generic';

interface RoomSpec {
  name:  string;         // tên hiển thị, VD "PHÒNG NGỦ"
  fn:    RoomFunction;   // công năng → quyết định nội thất mặc định + quy tắc đặt
  w:     number;         // bề rộng phủ bì (mm); thiếu → mặc định theo fn
  h:     number;         // chiều sâu phủ bì (mm)
  items: string[];       // id block (khoá trong furniture.ts); thiếu → mặc định theo fn
}

interface LayoutSpec {
  rooms: RoomSpec[];
  // (nâng cấp sau) adjacency?: [number, number][]  // đồ thị liền kề giữa các phòng (chỉ số trong rooms)
}
```

Prompt gợi ý cho LLM (khi cắm thật): *"Trả về JSON đúng schema LayoutSpec. `fn` chọn 1 trong 8 giá
trị. `items` chỉ dùng id block hợp lệ: bedD,bedS,wardrobe,sofa3,sofa2,armchair,dining4/6/8,desk,
kitchenI,toilet,lavabo,bathtub. Nếu người dùng không cho kích thước, để w/h = 0 và bỏ trống items."*

### 2.3 Thuật toán bộ giải bố cục (pseudo-code)

```
function layoutToEntities(spec, origin, wallLayer, textLayer, furnLayer, t):
    entities = []
    cx, cy, rowH = origin.x, origin.y, 0
    ROOM_GAP = max(300, 2t)          # khe giữa phòng để tường không đè nhau
    MAX_ROW  = 12000                 # bề rộng 1 hàng trước khi xuống dòng

    for room in spec.rooms:          # (A) XẾP PHÒNG — row-packing tất định, KHÔNG chồng
        w = max(1000, room.w); h = max(1000, room.h)
        if cx > origin.x and cx + w > origin.x + MAX_ROW:   # xuống hàng
            cx = origin.x; cy += rowH + ROOM_GAP; rowH = 0
        p0 = (cx, cy); p1 = (cx+w, cy+h)

        entities += roomRect(p0, p1, t, room.name, wallLayer, textLayer)   # (B) TƯỜNG + nhãn (tái dùng)

        interior = (p0.x+t/2, p0.y+t/2, p1.x-t/2, p1.y-t/2)               # lòng phòng thông thuỷ
        entities += placeFurniture(room.items, interior, furnLayer)      # (C) NỘI THẤT theo công năng

        cx += w + ROOM_GAP; rowH = max(rowH, h)
    return entities

function placeFurniture(items, interior, furnLayer):        # (C) neo tường + clearance + clamp + chống chồng
    placed = []                                              # AABB các món đã đặt
    cursor = { N,S,C: interior.ix0+GAP_START,  W,E: interior.iy0+GAP_START }   # con trỏ chạy dọc mỗi tường
    for id in items:
        def = BLOCK[id]; anchor = ANCHOR[id]                # anchor = {wall, rot, flush}
        (ex, ey) = footprint(def, anchor.rot)               # extent sau khi xoay (±90° thì hoán w/h)
        back = anchor.flush ? WALL_KEEP : 0                 # món áp tường chừa khe nhỏ tránh đè poché

        # đặt theo tường: N/S/C chạy con trỏ theo X; W/E theo Y
        pos, ok = advanceAlongWall(anchor.wall, cursor, ex, ey, back, interior)
        if not ok: skip(id); continue                       # hết chỗ trên rail → bỏ (báo trong note)
        pos = clampInsideInterior(pos, ex, ey, interior)    # KẸP trong lòng phòng (diệt tràn)
        if overlapsAny(pos, ex, ey, placed): skip(id); continue   # chồng lấn → bỏ (an toàn)
        placed.add(AABB(pos, ex, ey))
        emit block{ layer: furnLayer, block: id, at: pos, rot: anchor.rot }   # ĐÚNG layer nội thất
```

**Bảng ANCHOR (quy tắc công năng)** — mỗi block: áp tường nào + góc xoay để "lưng" quay vào tường:

| Block | Tường | rot | flush | Ý nghĩa |
|---|---|---|---|---|
| bedD/bedS | N | 0 | ✓ | giường đầu áp tường |
| wardrobe | W | +π/2 | ✓ | tủ dọc tường |
| sofa3/sofa2 | W | +π/2 | ✓ | sofa dọc tường, hướng tâm |
| armchair | C (giữa) | 0 | – | ghế bành hướng tâm |
| dining4/6/8 | C (giữa) | 0 | – | bàn ăn giữa phòng |
| desk | N | 0 | ✓ | bàn áp tường |
| kitchenI | S | 0 | ✓ | bếp chữ I chạy dọc tường |
| toilet | E | −π/2 | ✓ | bồn cầu sát tường (gần ống) |
| lavabo | E | −π/2 | ✓ | lavabo sát tường |
| bathtub | N | 0 | ✓ | bồn tắm áp tường |

Hằng số clearance (mm) trong code: `GAP_BETWEEN=250` (khe giữa 2 món cùng tường),
`GAP_START=90` (lề bắt đầu, đủ nhỏ để bếp chữ I chạy gần hết tường), `WALL_KEEP=40` (khe áp tường).

---

## 3. KẾ HOẠCH SỬA `ai-assist.ts` (ĐÃ CÀI ĐẶT xong trong nhánh này)

Ánh xạ lỗi → cách sửa (tất cả nằm gọn trong `lib/cad/ai-assist.ts`, không đụng file dùng chung):

| Lỗi cũ | Sửa | Vị trí |
|---|---|---|
| 1. Sai layer (l-wall) | thêm tham số `furnLayer='l-furniture'` (mặc định khớp `DEFAULT_LAYERS`); block phát ra trên `furnLayer` | `describeToEntities`, `placeFurniture` |
| 2. Tràn ngoài phòng | tính `interior` (lòng thông thuỷ) + `clamp()` toạ độ + con trỏ chạy theo tường, kiểm vượt mép | `layoutToEntities`, `placeFurniture` |
| 3. Chỉ 1 phòng | `parseDescription` tách nhiều mệnh đề → nhiều `RoomSpec`; solver **row-packing** không chồng | `parseDescription`, `layoutToEntities` |
| 4. Không hiểu công năng | bảng `ANCHOR` (áp tường + rot theo công năng) + `DEFAULT_ITEMS`/`DEFAULT_SIZE` theo `RoomFunction` | phần "THAM SỐ CÔNG NĂNG" |
| 5. Chồng lấn | kiểm `aabbOverlap` với các món đã đặt → bỏ + báo trong `note` | `placeFurniture` |

Chữ ký công khai **giữ nguyên** (chỉ thêm tham số tuỳ chọn thứ 6):
```ts
describeToEntities(text, origin, wallLayer, textLayer, wallThickness=110, furnLayer='l-furniture')
```
→ `components/cad/CadEditor.tsx` **không cần đổi** vẫn chạy; nội thất tự về `l-furniture`.

**KHUYẾN NGHỊ cho integrator** (1 dòng, tuỳ chọn): ở `CadEditor.aiAssist()` truyền thêm layer nội
thất thực tế của doc thay vì để mặc định, để robust nếu doc đổi id layer:
```ts
const furnLayer = st.doc.layers.find(l => l.name === 'Nội thất')?.id ?? 'l-furniture';
describeToEntities(desc, origin, wallLayer, textLayer, st.wallThickness, furnLayer);
```

### 3.1 Kiểm chứng đã chạy (deterministic, không cần render)

Transpile `lib/cad/*` → JS và chạy solver với nhiều đề bài; kiểm 3 bất biến: **(a)** mọi block ở
layer `l-furniture`, **(b)** mọi block nằm TRONG lòng phòng (không tràn), **(c)** các phòng KHÔNG
chồng nhau. Kết quả: **0 vi phạm** trên tất cả case (phòng đơn hẹp, WC, căn hộ 4 phòng, phòng
nhỏ nhồi nhiều món, đề bài rỗng → phòng mặc định). `npx tsc --noEmit` **sạch**.

Ví dụ note trả ra (đa phòng):
> `Solver bố cục: 4 phòng — PHÒNG KHÁCH 4.5×3.6m (15.3 m²) · BẾP 3.6×2.7m (9.0 m²) · PHÒNG NGỦ
> 3.6×3.6m (12.2 m²) · WC 2.2×1.8m (3.5 m²). — CHƯA đủ chỗ (đã bỏ để tránh chồng lấn): PHÒNG
> KHÁCH: Ghế bành; PHÒNG NGỦ: Tủ áo.`

---

## 4. GIỚI HẠN & BƯỚC TIẾP (chưa làm — cố ý, để đúng scope DD-sketch)

1. **Bố cục "thưa" ở phòng chật**: khi 2 món áp 2 tường vuông góc đè nhau (VD giường + tủ trong
   phòng 3.4×3.6), solver **bỏ món thứ hai** (an toàn, có báo note) thay vì đặt đè. Chưa có
   fallback "đổi sang tường khác" vì rot đúng cho mỗi (block × tường) cần đối chiếu render — tránh
   sinh block xoay sai. → Nâng cấp sau: bảng rot đầy đủ 4 tường/block + thử tuần tự các tường.
2. **Chưa sinh cửa đi/cửa sổ tự động** giữa các phòng (demo dựng tay). Cần đồ thị liền kề + logic
   "phòng cụt vs xuyên phòng" (mục 1.5) để đặt cửa đúng công năng.
3. **Chưa dùng `standards/checker.ts`** để tự chấm bản vừa sinh (diện tích min, clearance). Dễ nối:
   sau `layoutToEntities`, gọi checker và gắn cảnh báo vào `note`.
4. **Tường CHUNG giữa phòng**: solver dựng mỗi phòng 1 `roomRect` riêng (4 tường) + khe `ROOM_GAP`
   → 2 phòng cạnh nhau có 2 nét tường song song (không dùng chung vách như demo). Chấp nhận ở mức
   sketch; bản CD sau này cần merge vách.
5. **Số clearance (mục 1.5) "chưa xác minh cứng"** với bản in gốc Neufert/Time-Saver — đang dùng
   như tham số định hướng. Trước khi quảng bá "đúng chuẩn" cần đối chiếu bản gốc.
