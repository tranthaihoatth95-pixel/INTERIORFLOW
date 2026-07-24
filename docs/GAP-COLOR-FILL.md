# GAP — Tô mặt bằng "Mapa de Zonas" (color-fill zones)

> Điều tra: 24/07/2026 · Nhánh `feat/floorplan-color-fill` · Kết luận: **NEEDS-UPGRADE**

## Bối cảnh — nhu cầu người dùng

Người dùng cần công cụ vẽ "mapa de zonas" trên mặt bằng CAD (như bản Brazil tham
chiếu): những bong bóng oval / vệt màu bán trong suốt phủ theo chức năng phòng
(VARANDA · SALA · QUARTO · SUITE · COZINHA · BANHEIRO), gộp theo nhóm chức năng
(Área Molhada · Social · Íntima · Trabalho), có legend chấm màu ở góc và mũi tên
đứt nét thể hiện luồng lưu thông (circulation flow). Tuỳ chọn đè lên ảnh vệ tinh
site (aerial photo + đổ bóng cây) làm bối cảnh.

## Điều tra codebase — cái gì đang có

Đã audit `lib/cad/model.ts`, `lib/cad/hatch.ts`, `lib/cad/render.ts`,
`components/cad/CadToolbar.tsx`, `components/cad/CadCanvas.tsx`, `lib/cad/store.ts`.

Tóm tắt:

| Cần | Đang có | Đủ chưa |
|---|---|---|
| Vùng đa giác tô đặc | `HatchEntity` (polygon + SOLID/ANSI31/32/37/DOTS) | ✅ đủ cho đa giác |
| Bong bóng OVAL / hình tự do phủ đè | Chỉ `hatch` tạo bằng **pick-point trace** biên vùng kín (`traceHatchBoundary`). Không có entity ellipse. Không có luồng "vẽ polygon tự do rồi fill". Zone thường CẮT NGANG tường + chồng lấn phòng → pick-point KHÔNG bao giờ tìm được biên đúng | ❌ thiếu |
| Opacity 30–50 % | `hatch` SOLID hardcode `globalAlpha = 0.9` trong `render.ts:213`, không có field opacity per-entity | ❌ thiếu |
| Nhãn chức năng đi kèm zone (VARANDA/SALA…) | `TextEntity` rời — không liên kết với hatch. `Base.elementType` chỉ có 7 giá trị BIM (wall/slab/…), không có "zone" | ❌ thiếu |
| Nhóm chức năng (Wet/Social/Private/Work) | Chưa có khái niệm | ❌ thiếu |
| Legend góc canvas | Chưa có panel legend theo nhóm chức năng | ❌ thiếu |
| Mũi tên circulation đứt nét | `LineType: 'dashed'` có sẵn cho line/polyline, NHƯNG mũi tên chỉ vẽ được ở `dim` (leader) và `northArrow` (block). Không có entity "arrow" tự do | ❌ thiếu |
| Ảnh vệ tinh nền (aerial photo) | `PhotoEmbed` là thumbnail rời chấm điểm — KHÔNG phải raster background trải theo world coord. Không có "site image layer" | ❌ thiếu |

**Chốt:** 6 trên 8 hạng mục thiếu. Bịt bằng công cụ có sẵn (dùng nhiều hatch pick-point + text rời + polyline dashed) sẽ ra bản vẽ sai lệch hoàn toàn về hình học lẫn ngữ nghĩa — không đáng làm.

## Đề xuất upgrade — tách thành 3 nhóm

### N1 — SCHEMA (additive, không phá `.idf` cũ)

`lib/cad/model.ts`:

```ts
// Thêm vào EntityType union
export type EntityType = ... | 'ellipse' | 'arrow' | 'zone';

export interface EllipseEntity extends Base {
  type: 'ellipse';
  c: Pt;         // tâm
  rx: number;    // bán trục ngang (mm)
  ry: number;    // bán trục dọc (mm)
  rot?: number;  // rad, xoay quanh tâm
}

export interface ArrowEntity extends Base {
  type: 'arrow';
  path: Pt[];              // 2+ điểm (thẳng hoặc bẻ khúc). Có thể spline sau.
  headStart?: boolean;     // mũi tên đầu path
  headEnd?: boolean;       // mũi tên cuối path (mặc định true)
  headSize?: number;       // mm, default 250
  // lineType kế thừa Base — dùng 'dashed' cho circulation flow
}

// Zone = hatch chuyên biệt có nhãn chức năng + nhóm
export type ZoneGroup = 'wet' | 'social' | 'private' | 'work' | 'circulation' | 'service' | null;
export interface ZoneEntity extends Base {
  type: 'zone';
  // 3 kiểu biên (chỉ 1 field được set):
  polygon?: Pt[];                                  // vùng tự do
  ellipse?: { c: Pt; rx: number; ry: number; rot?: number };
  rect?: { x: number; y: number; w: number; h: number };
  label: string;                                   // "VARANDA" / "SALA JANTAR"
  group: ZoneGroup;                                // để legend gom nhóm & tô cùng màu
  opacity: number;                                 // 0–1, khuyến nghị 0.35
  labelPos?: Pt;                                   // override vị trí text, mặc định = centroid
}

// Mở rộng HatchEntity (backward-compat): thêm opacity per-entity
export interface HatchEntity extends Base {
  ...
  opacity?: number; // 0–1. Mặc định 0.9 (giữ hành vi cũ). CHỈ áp cho SOLID/DOTS.
}
```

Migration: 0 (mọi field mới đều optional; entity `zone`/`ellipse`/`arrow` chỉ xuất hiện ở doc mới).

### N2 — RENDER + LƯU TRỮ

`lib/cad/render.ts`:
- Case `'ellipse'`: `ctx.ellipse(c, rx, ry, rot, 0, 2π)`; stroke/fill theo layer.
- Case `'arrow'`: vẽ polyline theo `path` (dùng `dash pattern` từ `lineType`) + `drawArrowHead` (đã có, dòng 266) tại đầu/cuối theo flag.
- Case `'zone'`: nội bộ = vẽ biên (polygon hoặc ellipse) → fill với `globalAlpha = zone.opacity` → vẽ label tại `labelPos ?? centroid(biên)` bằng font in đậm HOA (như tham chiếu Brazil). Màu lấy theo `group` qua `ZONE_GROUP_COLORS`:

```ts
export const ZONE_GROUP_COLORS: Record<Exclude<ZoneGroup, null>, string> = {
  wet: '#4FB3E8',         // xanh nước (Área Molhada)
  social: '#F5C542',       // vàng (Social)
  private: '#E88A6B',      // hồng cam (Íntima)
  work: '#7EC46E',         // xanh lá (Trabalho)
  circulation: '#B8B8B8',  // xám (đường đi)
  service: '#8E7CC3',      // tím (Serviço)
};
```

DXF export: `zone` → tam-giác-hoá polygon → SOLID + TEXT (đã có pattern như HatchEntity export hiện tại). `ellipse` → polyline 32 điểm. `arrow` → polyline + 2 line đầu mũi tên.

IDF (`lib/cad/idf.ts`): serialize thẳng 3 entity type mới (JSON schema đang mở rộng).

### N3 — UI TOOLBAR + LEGEND + AERIAL

Toolbar (`components/cad/CadToolbar.tsx`):
- Tool `Z` — Zone: mở dropdown chọn `group` (Wet/Social/Private/Work/Circulation/Service) → click 2 điểm vẽ ellipse (drag từ tâm ra) → nhập label → tạo `ZoneEntity`. Preset opacity 0.35, có slider.
- Tool `A` — Arrow: click chuỗi điểm → Enter kết thúc → tạo `ArrowEntity` với `lineType: 'dashed'`, `headEnd: true`. Có nút toggle "head cả 2 đầu" (song hướng).

Panel `ZonesLegend` (mới, hiển thị khi doc có ≥1 zone):
- Đọc mọi `ZoneEntity`, gom theo `group` → hiện chấm màu + tên nhóm (song ngữ VI · Brazil label). Click hàng zone → highlight zone đó trên canvas.
- Tuân TTT design (Archivo, keyline 1px, uppercase tracked). Sample:
  ```
  ● WET AREA · KHU ƯỚT     Cozinha, Banheiros
  ● SOCIAL · SINH HOẠT     Sala, Varanda, Sala jantar
  ● PRIVATE · RIÊNG TƯ     Quarto, Suite
  ● CIRCULATION · GIAO THÔNG (dashed arrows)
  ```

Aerial photo layer (`SiteImageEntity` hoặc mở rộng `PhotoEmbed`):
- Field `worldBounds: {x, y, w, h}` (thay vì chỉ 1 điểm at) → ảnh trải theo world coord, pan/zoom đúng.
- Layer đặc biệt `l-site` render TRƯỚC mọi entity khác, có checkbox ẩn/hiện + slider opacity riêng.
- Đổ bóng cây: dùng `ellipse` màu đen opacity 0.15 vẽ trên layer `l-site-shade`.

## Ước lượng khối lượng (1 agent)

- N1 schema + type + migration test: **0.5 ngày**
- N2 render + IDF/DXF export + snapshot test: **1 ngày**
- N3 UI toolbar (Zone + Arrow tool) + Legend panel + aerial photo layer: **1.5 ngày**

Tổng ~3 ngày. Có thể chia 2 agent song song (N1+N2 vs N3 UI) sau khi khoá schema.

## Deliverable phiên này

- `docs/GAP-COLOR-FILL.md` (file này) — báo cáo gap chi tiết.
- `docs/mocks/mapa-de-zonas.html` — mock HTML minh hoạ visual mong muốn (dùng SVG thuần, KHÔNG hardcode vào CAD engine). Mở bằng browser để xem.
- **Không sửa `lib/cad/`** — chờ user duyệt schema N1 trước khi phóng agent code.

## Câu hỏi cần user chốt trước khi implement

1. **Kiểu biên zone ưu tiên:** OVAL (như Brazil ref, mềm mại) vs polygon tự do vs cả 2? Ảnh hưởng UX toolbar.
2. **Nhóm chức năng:** giữ 4 nhóm chuẩn Brazil (Wet/Social/Private/Work) hay VN hoá (Khối ướt/Sinh hoạt/Riêng tư/Làm việc/Giao thông/Dịch vụ = 6 nhóm)?
3. **Aerial photo:** cần import từ Google Maps screenshot / KML tile, hay chỉ upload PNG rồi kéo góc?
4. **Xuất Presenting:** zone + legend có xuất PDF/PPTX Present stage luôn không (cần patch `present-handoff.ts`)?
