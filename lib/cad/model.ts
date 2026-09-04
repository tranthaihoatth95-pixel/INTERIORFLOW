/**
 * lib/cad/model.ts — MÔ HÌNH dữ liệu bản vẽ 2D (đơn vị: milimét, mm).
 *
 * Trục toạ độ THẾ GIỚI: X sang phải, Y HƯỚNG LÊN (chuẩn CAD). Canvas có Y hướng xuống
 * nên phần render sẽ lật Y (xem viewport helpers cuối file). Mọi entity lưu toạ độ mm thật;
 * chỉ khi vẽ mới đổi sang pixel. Giữ module này THUẦN (không phụ thuộc React/DOM) để test dễ
 * và không dính SSR.
 */

// VIỆC 4 — CHỈ KIỂU (`import type` bị xoá hoàn toàn lúc biên dịch): `Doc.lighting` cần hình dạng
// khai ở `lib/three/lighting.ts`, mà file đó lại đọc `Doc` từ đây. Nhập kiểu-thuần nên KHÔNG có
// cạnh phụ thuộc chạy-thật nào giữa `lib/cad` và `lib/three` ⇒ không vòng lặp import, module này
// vẫn THUẦN đúng như docstring trên.
import type { DocLighting } from '../three/lighting';

export interface Pt {
  x: number;
  y: number;
}

/**
 * Nét vẽ (linetype) — tối thiểu theo ISO 128: continuous (liền), hidden (khuất, gạch ngắn đều),
 * center (trục, chain gạch dài-ngắn-dài), dashed (nét đứt trung), phantom (gạch dài-ngắn-ngắn).
 */
export type LineType = 'continuous' | 'hidden' | 'center' | 'dashed' | 'phantom';

/**
 * Bề dày nét (lineweight, mm) — thang chuẩn hay dùng trong DXF/AutoCAD (khớp enum group 370,
 * xem dxf.ts). Phân cấp theo ISO 128 cho bản vẽ kiến trúc nội thất tỉ lệ 1:50-1:100:
 *   0.13/0.18 — mảnh: kích thước, hatch, nét khuất, trục lưới
 *   0.25/0.35 — trung: thiết bị/nội thất/cửa sổ/đường bao không cắt
 *   0.50/0.70 — đậm: tường bị mặt phẳng cắt qua (mặt bằng) + khung tên/khung bao
 *   1.0/1.4/2.0 — rất đậm: hiếm dùng ở 1:50-1:100, có mặt để đủ dải chuẩn (khung bao khổ lớn
 *   A0/A1, mặt cắt cấu tạo tỉ lệ 1:5-1:20, đường bao công trình trên tổng mặt bằng).
 *
 * 2026-08-05 (S6/T3) — BỔ SUNG 1.4 và 2.0 cho khớp dải đầy đủ ISO 128-2:2020, vốn đã được rule
 * `iso128-lineweight-set` (lib/cad/standards/iso-drafting.ts:18-20) khai đủ 9 giá trị và tự trỏ
 * ngược về hằng số này — trước đó hằng số chỉ có 7, rule trỏ vào thứ không khớp chính nó.
 * ⚠️ `components/cad/CadEditor.tsx:732` chép cứng đúng 7 giá trị cũ thay vì import hằng số này
 * (ngoài vùng file phiên S6, KHÔNG sửa) ⇒ dropdown chọn nét của UI vẫn 7 mục, chưa có 1.4/2.0.
 */
export const STANDARD_LINEWEIGHTS = [0.13, 0.18, 0.25, 0.35, 0.5, 0.7, 1.0, 1.4, 2.0] as const;

/**
 * Chiều cao chữ chuẩn ISO 3098 (mm, ĐO TRÊN GIẤY sau khi in — không phải mm world lưu trong
 * TextEntity.h, vốn là kích thước THẬT ngoài đời ở tỉ lệ 1:1). Quy đổi: h_world = h_iso ×
 * tỉ lệ bản vẽ (VD tỉ lệ 1:50 → muốn chữ cao 3.5mm trên giấy thì h_world = 3.5×50 = 175mm).
 * Cần pipeline in ấn (Nấc 7 — paper space/tỉ lệ khổ giấy) để tự động hoá quy đổi này; hiện tại
 * đây là hằng số THAM CHIẾU cho người vẽ tự chọn khi đặt TEXT/DIM (chưa có UI tự tính).
 */
export const ISO_TEXT_HEIGHTS_MM = [2.5, 3.5, 5, 7, 10] as const;

/** Lớp (layer) — entity mới rơi vào layer hiện hành; ẩn/khoá theo cờ. */
export interface Layer {
  id: string;
  name: string;
  /** màu hex '#rrggbb' — dùng cho mọi entity thuộc layer trừ khi entity tự override. */
  color: string;
  visible: boolean;
  locked: boolean;
  /** bề dày nét mặc định của layer (mm, khổ giấy in — xem STANDARD_LINEWEIGHTS). Thiếu ⇒ 0.25
   * (tương thích ngược với layer cũ tạo trước khi có field này). */
  lineweight?: number;
  /** nét vẽ mặc định của layer. Thiếu ⇒ 'continuous' (tương thích ngược). */
  lineType?: LineType;
}

export type EntityType =
  | 'line'
  | 'polyline'
  | 'rect'
  | 'circle'
  | 'arc'
  | 'text'
  | 'dim'
  | 'block'
  | 'hatch'
  // Zone tool (24/07 — docs GAP-COLOR-FILL, N1 additive): 3 loại mới, `.idf` cũ KHÔNG có
  // các type này nên parse/render như cũ, không breaking.
  | 'ellipse'
  | 'arrow'
  | 'zone'
  // G-M2-04 (07/08, SPEC-TANG-DU-LIEU-CAU-KIEN §6): PHÒNG là một thứ có thật trong dữ liệu.
  // Additive — `.idf` cũ không có type này vẫn parse/render như cũ.
  | 'room';

/**
 * IF2-nền — phân loại phần tử BIM/IFC 4.0 (Quyết định 258/QĐ-TTg). Optional để `.idf` cũ
 * KHÔNG breaking — entity không có `elementType` vẫn parse/render bình thường, chỉ là chưa gán
 * ngữ nghĩa BIM. Union này khớp tập entity IFC hay dùng nhất cho nội thất/kiến trúc phổ thông
 * (IfcWall / IfcSlab / IfcColumn / IfcBeam / IfcDoor / IfcWindow / IfcFurnishingElement); giá trị
 * null CÓ Ý NGHĨA riêng — "đã kiểm và xác định không phải phần tử BIM" (phân biệt với `undefined`
 * = "chưa gán, dữ liệu cũ chưa migrate"). Xem IF1_IF2_BIGPICTURE.md §3, mở rộng khi cần.
 */
export type ElementType =
  | 'wall'
  | 'slab'
  | 'column'
  | 'beam'
  | 'door'
  | 'window'
  | 'furniture'
  /** B1 (24/07) — IfcSpace: vùng không gian/phòng (nhãn phòng, zone). Additive, không breaking. */
  | 'space'
  | null;

/**
 * B1 (24/07) — danh mục ElementType cho UI gán (property panel). `null` có nghĩa riêng
 * "đã kiểm, KHÔNG phải phần tử BIM"; undefined (không có trong list này) = chưa gán.
 * Nhãn song ngữ Việt dẫn trước theo quy ước TTT.
 */
export const ELEMENT_TYPE_OPTIONS: { value: Exclude<ElementType, null> | 'null'; label: string }[] = [
  { value: 'wall', label: 'Tường · IfcWall' },
  { value: 'slab', label: 'Sàn · IfcSlab' },
  { value: 'column', label: 'Cột · IfcColumn' },
  { value: 'beam', label: 'Dầm · IfcBeam' },
  { value: 'door', label: 'Cửa đi · IfcDoor' },
  { value: 'window', label: 'Cửa sổ · IfcWindow' },
  { value: 'furniture', label: 'Nội thất · IfcFurnishingElement' },
  { value: 'space', label: 'Không gian · IfcSpace' },
  { value: 'null', label: 'Không phải phần tử BIM' },
];

/** Công năng phòng — persisted trên TextEntity đóng vai trò nhãn phòng (xem checker.ts
 * ROOM_NAME_RE/classifyRoom). Additive + optional: `.idf` cũ không có field này vẫn parse
 * bình thường; undefined = chưa gán / chưa backfill — dùng classifyRoom(text) làm fallback. */
export type RoomKind =
  | 'bedroom' | 'wc' | 'kitchen' | 'living' | 'corridor' | 'office' | 'assembly'
  | 'technical' | 'boh' | 'other';

/** Danh mục RoomKind cho UI gán (panel chọn công năng phòng). Nhãn song ngữ Việt dẫn trước
 * theo quy ước TTT. */
export const ROOM_KIND_OPTIONS: { value: RoomKind; label: string }[] = [
  { value: 'bedroom', label: 'Phòng ngủ' },
  { value: 'wc', label: 'WC · Vệ sinh' },
  { value: 'kitchen', label: 'Bếp' },
  { value: 'living', label: 'Phòng khách' },
  { value: 'corridor', label: 'Hành lang' },
  { value: 'office', label: 'Văn phòng' },
  { value: 'assembly', label: 'Hội trường · Hội nghị' },
  { value: 'technical', label: 'Kỹ thuật' },
  { value: 'boh', label: 'BOH · Hậu cần' },
  { value: 'other', label: 'Khác' },
];

/** T2 (Semantic Room sprint) — phân loại tường: trong/ngoài. KHÔNG có `WallEntity` riêng trong
 * codebase này — "tường" thể hiện qua 3 kiểu entity khác nhau tuỳ đường vẽ (xem checker.ts
 * `isWallLikeEntity`/`wallLikeDoc` + shape-interactions.ts `extractWallSegments`):
 *   - `LineEntity` bất kỳ layer nào (vẽ tay bằng lệnh LINE — app không ép layer).
 *   - `PolylineEntity` trên layer tường (`WALL_LAYER_ID` — biên nét mảnh do lệnh WALL sinh ra).
 *   - `HatchEntity` trên layer tường (nửa tô đặc/poché do lệnh WALL sinh ra CÙNG lúc với polyline
 *     biên ở trên — 1 đoạn tường WALL-tool = 1 cặp hatch+polyline).
 * Vì vậy field wallKind/wallStructural/wallThicknessMm đặt ở `Base` (không phải field riêng của
 * 1 type) — giống lý do `storey`/`elementType` cũng ở Base: ngữ nghĩa CHỈ có ý nghĩa khi entity
 * đang đóng vai trò tường, không phải mọi entity. Optional, additive: `.idf` cũ không có field
 * vẫn parse bình thường; undefined = chưa phân loại — KHÔNG suy đoán từ hình học (xem lý do
 * "không đoán mò" trong checker.ts: không có DCEL/outer-boundary utility nào trong app này để
 * suy luận tường ngoài từ hình học một cách đáng tin cậy). */
export type WallKind = 'exterior' | 'interior';

/** Danh mục WallKind cho UI gán (panel chọn loại tường). Nhãn song ngữ Việt dẫn trước theo quy
 * ước TTT, cùng mẫu ROOM_KIND_OPTIONS. */
export const WALL_KIND_OPTIONS: { value: WallKind; label: string }[] = [
  { value: 'exterior', label: 'Tường ngoài · Exterior' },
  { value: 'interior', label: 'Vách ngăn · Interior' },
];

/* ───────── LEVEL / TẦNG (VIỆC 1 — `SO-KIEM-TONG.md` §7 dòng "Level/tầng") ───────── */

/**
 * TẦNG THẬT — object mang CAO ĐỘ + THỨ TỰ, đúng khái niệm Level của Revit. Đây là bước lên của
 * `Base.storey` (nhãn chuỗi tự do, `model.ts` phía dưới): `storey='L1'` không nói được L1 cao bao
 * nhiêu, nên §7 sổ kiểm ghi Level "🟡 MỘT PHẦN — CHỈ LÀ NHÃN, không phải object Level mang cao độ".
 *
 * ⛔ KHÔNG XOÁ `storey` — hai field SỐNG SONG SONG, `storey` giữ nguyên cho tương thích ngược
 * (DXF XDATA `IF_STOREY` ở `dxf.ts:547` · bucket cây đối tượng `Object3DTree.tsx` · nhóm BOQ
 * `boq-group.ts` — cả ba vẫn đọc `storey`, không phiên nào phải sửa theo). Khi entity có CẢ HAI:
 * **`levelId` THẮNG** cho mọi câu hỏi về CAO ĐỘ (xem `lib/cad/levels.ts` `resolveElevation`);
 * `storey` vẫn là nhãn hiển thị/nhóm như cũ.
 *
 * additive: `.idf` v1 không có `Doc.levels` vẫn parse (migration v1→v2 tự sinh Level từ tập
 * `storey` đã dùng — `lib/cad/idf.ts` `IDF_MIGRATIONS[1]`).
 */
export interface Level {
  id: string;
  /** tên người dùng thấy, VD 'Tầng trệt' / 'GF' / 'Lửng'. KHÔNG phải khoá — trùng tên hợp lệ. */
  name: string;
  /** cao độ sàn hoàn thiện của tầng này (mm, world Y-up của `Doc`, gốc = ±0.000 công trình). */
  elevationMm: number;
  /** thứ tự xếp trong danh sách tầng (0 = dưới cùng). TÁCH khỏi `elevationMm` có chủ đích: tầng
   * lửng/tầng kỹ thuật có thể cùng cao độ mà vẫn cần thứ tự cố định do người dùng đặt. */
  order: number;
  /** K3 — true = Level SINH TỰ ĐỘNG (migration v1→v2 dựng từ nhãn `storey`, `elevationMm` là 0
   * mặc định vì file v1 KHÔNG mang thông tin cao độ nào). UI phải hiện "suy đoán — chưa khai cao
   * độ" để người dùng biết mà sửa; người dùng sửa cao độ thì XOÁ cờ này. undefined = do người
   * dùng khai thật. */
  inferred?: true;
}

/** Ràng buộc GẮN VÀO TẦNG: cao độ cuối = `Level.elevationMm + offsetMm`. Đổi cao độ Level thì mọi
 * entity gắn vào nó dịch theo — đây là toàn bộ lý do Level tồn tại (§7 dòng "Constraint theo cao
 * độ": trước đây `heightMm` là số tuyệt đối gõ tay, không tham chiếu Level nào). */
export interface LevelConstraint {
  levelId: string;
  /** lệch so với cao độ Level (mm), âm = thấp hơn Level. 0 = đúng mặt Level. */
  offsetMm: number;
}

/**
 * Ràng buộc ĐỈNH — hai kiểu loại trừ nhau, đúng bộ đôi của Revit:
 *  - `{ levelId, offsetMm }` — **Up to level**: đỉnh bám tầng trên, tầng đó đổi cao độ thì đỉnh
 *    đổi theo (tường chạy hết chiều cao thông tầng).
 *  - `{ heightMm }` — **Unconnected height**: cao cố định tính từ ĐÁY đã resolve, không bám tầng
 *    nào (vách lửng, tủ bếp, lan can).
 */
export type TopConstraint = LevelConstraint | { heightMm: number };

/** Thiết lập nghề của một đường camera. Optional để mọi IDF cũ vẫn mở nguyên trạng. */
export interface CameraShotMeta {
  intent: 'low-track' | 'follow' | 'reveal' | 'push-in' | 'orbit';
  cameraHeightM: number;
  lensMm: number;
  speedMmPerSec: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  stabilization: 'locked' | 'soft' | 'handheld';
  ratio: string;
  target?: Pt;
}

interface Base {
  id: string;
  type: EntityType;
  layer: string;
  /** override màu layer (hiếm dùng) */
  color?: string;
  /** override lineweight/lineType của layer (hiếm dùng — giống cơ chế override màu ở trên). */
  lineweight?: number;
  lineType?: LineType;
  /** IF2-nền — tầng chứa entity (BIM storey), VD 'GF' / 'L1' / 'L2'. Optional, `.idf` cũ không
   * có field này vẫn parse bình thường. Chưa có UI gán ở IF1; hiện chỉ nền dữ liệu cho IF2-C. */
  storey?: string;
  /** 3D-5 (`SPEC-3D-CORE.md` push-pull massing, bậc B1 thang BIM `CHOT-HUONG-3D-2026-08-01.md`)
   * — cao độ đùn khối RIÊNG của entity này (mm), ghi ngược từ thao tác kéo-đẩy khối 3D. Chỉ có ý
   * nghĩa khi entity đóng vai trò tường (hatch poché trên layer tường, giống `wallKind`).
   * undefined = dùng cao mặc định của scene (`SceneOptions.wallHeightMm`, hiện 2700) — KHÔNG
   * tự suy đoán. Đây là NGUỒN DUY NHẤT cho cao độ tường trong khối 3D — `docToObjScene()` đọc
   * field này, viewer 3D KHÔNG giữ bản cao độ riêng (luật một nguồn, cấm lặp lại bệnh hai-nguồn
   * đã trả giá ở Brand Kit). */
  heightMm?: number;
  /** IF2-nền — phân loại BIM/IFC 4.0 (xem `ElementType`). Optional, backward-compatible. */
  elementType?: ElementType;
  /** T2 — phân loại tường trong/ngoài (xem `WallKind` phía trên). Chỉ có ý nghĩa khi entity đóng
   * vai trò tường. undefined = chưa phân loại; KHÔNG bao giờ tự suy đoán/mặc định thành
   * 'interior' — xem checker.ts `wallKindSummary` (đếm undefined riêng thành 'unclassified'). */
  wallKind?: WallKind;
  /** T2 — true = tường chịu lực, false/undefined = vách ngăn không chịu lực. Chỉ có ý nghĩa cùng
   * `wallKind` (đã phân loại là tường). */
  wallStructural?: boolean;
  /** T2 — độ dày tường THẬT (mm), khai báo bởi user. Với tường vẽ bằng LINE đơn: hình học
   * KHÔNG mang độ dày nên field này là nguồn duy nhất. Với tường do lệnh WALL sinh (hatch+
   * polyline): độ dày đã BAKED sẵn vào hình học (tham số `t` lúc vẽ, xem commands.ts
   * wallSegment/wallChain) — field này là metadata KHAI BÁO thêm, KHÔNG tự động đo lại/đối
   * chiếu với hình học, có thể lệch nếu user chỉnh geometry sau mà quên cập nhật số này. */
  wallThicknessMm?: number;
  /** V2 (`SPEC-VIDEO-MAT-BANG.md` §2.1) — true = entity là ĐƯỜNG CAM (polyline layer hệ thống
   * `IF_CAMPATH`). Cờ đặt TRÊN entity (không suy từ tên layer) để round-trip DXF an toàn khi
   * layer bị đổi tên tay — xem `applyIfXdata`/`xdataPairs` (`dxf.ts`), cùng khuôn `elementType`. */
  campath?: true;
  /** Cấu hình shot đi cùng chính polyline, không nằm trong một kho video thứ hai. */
  cameraShot?: CameraShotMeta;

  /** NC-12 (`docs/nc/NC-12-bo-lenh-3d-2026-08-03.md` §4.2) — NGĂN XẾP DỰNG HÌNH 3D (tầng ③④⑤
   * `SPEC-DUNG-BO-LENH-3D`). undefined = không có ngăn xếp, ống kính 3D dựng đúng như hôm nay
   * (lăng trụ theo `heightMm`) — `.idf` cũ parse nguyên vẹn, không cần bump `IDF_VERSION` (field
   * optional/additive, cùng khuôn `storey`/`elementType`). LƯU THAM SỐ, KHÔNG BAO GIỜ lưu mesh —
   * hình học derive sống trong cache runtime (`lib/three/build-ops.ts`), không vào `Doc`/`.idf`
   * (K1: một Doc, không kho thứ hai). Đợt đầu chỉ khai ĐÚNG 3 phép có nơi tiêu thụ ngay (luật K4/
   * L7 — 11 phép còn lại của NC-12 §4.2 CHƯA khai vào type cho tới khi có UI thật):
   *  - `extrude` — đã là đường mặc định của `docToObjScene` (đùn theo `heightMm`); khai tên cho
   *    đủ tầng ③, KHÔNG cần derive logic riêng (base geometry ĐÃ LÀ kết quả extrude).
   *  - `boolean` — khoét ổ điện/gờ chỉ tủ/hốc âm tường (`lib/three/csg.ts` + `build-ops.ts`).
   *  - `arrayLinear` — nan chớp/song sắt lặp (tái dùng luật của `modify.ts` `arrayRect()` ở 2D);
   *    KHAI TYPE cho đủ nhưng CHƯA nối derive/render (chưa có UI sinh ra op này — N5). */
  ops?: BuildOp[];

  /** true = bậc thứ i của `ops` đang TẮT (mắt nhắm, kiểu modifier stack Max/Blender). Chỉ số
   * khớp với `ops`. undefined = tất cả đang bật. Chưa có UI bật/tắt (N5, khai cùng đợt để không
   * đẻ field rời sau này). */
  opsDisabled?: number[];

  /** Đợt 4 (12/08) — "Công Thức Khối" (`BuildRecipe`, xem docstring type phía dưới union `BuildOp`
   * trong file này). undefined = không có ngăn xếp, hành vi y hệt hôm nay (`.idf` cũ mở bình
   * thường, KHÔNG cần bump `IDF_VERSION` — additive/optional cùng khuôn `ops`/`storey`). LƯU THAM
   * SỐ, KHÔNG BAO GIỜ lưu mesh (cùng luật K1 đã ghi ở `ops` phía trên) — evaluator+cache sống ở
   * `lib/three/build-recipe.ts`, KHÔNG vào `Doc`/`.idf`. */
  recipe?: BuildRecipe;

  /** VIỆC "cửa/cửa sổ hosted" (`docs/SO-KIEM-TONG.md` §7) — cao độ ĐÁY (mm, tính từ sàn z=0) của
   * khối/hốc mà entity này biểu diễn. Chỉ có ý nghĩa khi entity đóng vai trò CUTTER (`lib/three/
   * cad-to-obj.ts` `cutterPositionsMm` đọc field này làm z0 thay vì luôn cắt từ sàn — trước đây
   * hardcode z0=0, đúng cho cửa nhưng SAI cho cửa sổ có bệ cao) — undefined = 0 (giữ nguyên hành
   * vi cũ, `.idf` cũ không có field vẫn parse/dựng đúng như trước). Cùng tên/tinh thần field
   * `elevationMm` mà `SPEC-VE-REVIT-MODE.md` §A3.3 đã đề xuất cho lớp hoàn thiện (ốp lửng) — TÁI
   * DÙNG một field cho nhiều vai trò cutter/covering, không đẻ field song song (đúng khuôn
   * `heightMm` đã dùng cho cả tường lẫn cutter). */
  elevationMm?: number;

  /** VIỆC 1 — tầng chứa entity, trỏ `Level.id` trong `Doc.levels` (xem `Level` phía trên).
   * THÊM, KHÔNG THAY `storey`: `storey` là NHÃN (còn nguyên, DXF/BOQ/cây đối tượng vẫn đọc),
   * `levelId` là THAM CHIẾU mang cao độ. Có cả hai ⇒ `levelId` thắng về CAO ĐỘ. undefined =
   * chưa gán tầng thật — `resolveElevation()` lùi về `elevationMm` rồi về 0, KHÔNG suy đoán từ
   * `storey` lúc chạy (việc suy đoán chỉ làm MỘT LẦN ở migration v1→v2, có cờ `Level.inferred`). */
  levelId?: string;

  /** VIỆC 2 — ĐÁY gắn vào tầng: `Level.elevationMm + offsetMm`. Mạnh hơn `levelId`+`elevationMm`
   * ở chỗ tách được "thuộc tầng nào" khỏi "cách mặt tầng bao nhiêu" (bệ cửa sổ 900 trên tầng 2:
   * `{levelId:'L2', offsetMm:900}` — sửa cao độ L2 thì bệ đi theo, vẫn giữ đúng 900). undefined =
   * dùng chuỗi lùi của `resolveElevation()`. */
  baseConstraint?: LevelConstraint;

  /** VIỆC 2 — ĐỈNH: bám tầng trên (`{levelId, offsetMm}`) hoặc cao cố định (`{heightMm}`).
   * undefined = lùi về `heightMm` của chính entity (hành vi hôm nay, `cad-to-obj.ts` đọc
   * `h.heightMm`) — KHÔNG đổi gì cho dữ liệu cũ. Xem `lib/cad/levels.ts` `computeHeights()`. */
  topConstraint?: TopConstraint;

  /** VIỆC 3 — trỏ `WallType.id` trong `Doc.wallTypes` (Type/Instance kiểu Revit). Giá trị khai
   * TRÊN INSTANCE (`wallThicknessMm`/`wallKind`/`specId`) **THẮNG** giá trị của Type — xem
   * `lib/cad/wall-types.ts` `resolveWallParams()`. undefined = 100% instance như hôm nay. */
  typeId?: string;

  /**
   * VIỆC 1.5 phiếu DXF (05/08) — TÊN BLOCK gốc khi entity này sinh ra từ việc LÀM PHẲNG một
   * INSERT của file DXF (`lib/cad/dxf.ts` `expandInsert`). Giữ tên block ĐỊNH NGHĨA TRỰC TIẾP
   * (không phải cả chuỗi lồng) — đủ để truy ngược "hình này từ đâu ra" mà không phình bộ nhớ với
   * bản vẽ hàng vạn entity.
   *
   * undefined = entity vẽ tay trong app, hoặc nằm thẳng ở section ENTITIES (không qua block).
   * Additive: `.idf` cũ không có field này vẫn parse y nguyên.
   *
   * Nơi tiêu thụ (K4 — không khai field chết): `DxfLoadReport.blocksExpanded` đối soát theo tên ·
   * `lib/cad/dxf-plan.ts` `planAreaCrossCheck()` loại hình khung tên/ghi chú ra khỏi đường bao ·
   * test `dxf-insert.test.ts` khẳng định nhãn không rơi qua các cấp lồng.
   */
  srcBlock?: string;

  /**
   * A1 · G-M1-06 (06/08) — **DANH TÍNH CỦA MỘT BẢN CHÈN**, KHÔNG phải tên block.
   *
   * `srcBlock` trả lời "hình này thuộc block TÊN GÌ"; nó KHÔNG tách được bản chèn này với bản
   * chèn kia. Ca thật đo trên hồ sơ mặt bằng: 1 tên block bị chèn 18 lần ⇒ 828 hình phẳng mang
   * CÙNG một chuỗi `srcBlock` ⇒ không có cách nào chọn/di chuyển/đếm **MỘT** cấu kiện.
   * `srcInsertId` là mã DUY NHẤT của TỪNG LẦN CHÈN (kể cả từng ô của mảng rows/cols của cùng một
   * record INSERT), nên "chọn 1 hình → nở ra đúng cụm của nó" mới làm được.
   *
   * Dạng chuỗi (do `lib/cad/dxf.ts` `expandInsert` cấp, xem `INSERT_ID_*` ở đó):
   *   - `i7`            — bản chèn thứ 7 ở section ENTITIES.
   *   - `i7#2.1`        — ô (cột 2, hàng 1) của mảng do chính record INSERT đó khai.
   *   - `i7#2.1/13`     — bản chèn CON (record thứ 13 trong định nghĩa block) nằm trong ô trên.
   * ⇒ cha–con truy được bằng `parentInsertId()` phía dưới; KHÔNG cần thêm field thứ hai.
   *
   * undefined = entity vẽ tay trong app hoặc nằm thẳng ở ENTITIES (không qua INSERT nào).
   * Additive: `.idf` cũ không có field vẫn parse y nguyên.
   *
   * Nơi tiêu thụ (K4 — không khai field chết): `expandIdsByInsertGroup()` ngay dưới (store.ts
   * `select`/`selectInsertGroup` gọi) · `exportDxfEx()` dựng lại BLOCK+INSERT (G-M1-07).
   */
  srcInsertId?: string;

  /**
   * A5 · G-M1-09 (06/08) — **true = `elementType` do MÁY SUY, không phải người khai.**
   *
   * Luật K3: suy đoán phải LỘ RA, không được giả vờ là khai báo. Ngữ nghĩa khớp đúng cờ cùng tên
   * đang dùng lúc chạy ở `lib/three/cad-to-obj.ts` (`inferred = h.elementType === undefined`) và
   * `Level.inferred` phía trên — chỉ khác là cờ này LƯU ĐƯỢC (`.idf`, XDATA DXF `IF_INFERRED`).
   *
   * Bất biến: `inferred` chỉ có nghĩa khi ĐI KÈM `elementType`. Người dùng gán tay `elementType`
   * ⇒ PHẢI xoá cờ này (khai báo thắng suy đoán). Bộ suy (`lib/cad/element-infer.ts`) KHÔNG BAO
   * GIỜ đè lên entity đã có `elementType` sẵn.
   */
  inferred?: true;

  /**
   * A3 · G-M1-08 (06/08) — **id của VẬT CHỦ mà entity này neo vào.** Nâng lên `Base` (trước đây
   * chỉ khai riêng ở `BlockEntity`, xem dưới — khai báo cũ GIỮ NGUYÊN, cùng kiểu nên hợp lệ) vì
   * nay có ĐÚNG HAI quan hệ neo, cùng một ngữ nghĩa "con trỏ về vật chủ", cùng một khuôn
   * reconcile-idempotent-sau-mọi-mutation:
   *
   *   - `BlockEntity.hostId`  → id `HatchEntity` TƯỜNG chủ của cửa/cửa sổ (`lib/cad/hosting.ts`
   *     `syncHostedOpenings`, `SO-KIEM-TONG.md` §7).
   *   - `HatchEntity.hostId`  → id `PolylineEntity` ĐƯỜNG BAO mà vùng tô (poché) bám theo
   *     (`lib/cad/poche.ts` `syncPocheAnchors`, G-M1-08). Trước đây hai nửa của một quad tường
   *     không có gì nối ⇒ dời một nửa là tường rách (đo được 450mm, `docs/M2-OUT.md` §2).
   *
   * KHÔNG BAO GIỜ gõ tay — cả hai đều do hàm reconcile tự suy và tự xoá. undefined = chưa neo /
   * không thuộc quan hệ neo nào (đại đa số entity). `.idf` cũ không có field ⇒ reconcile tự ghép
   * lại ở lần mở đầu tiên, không cần bump `IDF_VERSION`.
   */
  hostId?: string;
}

/* ───────── A1 — truy vết danh tính bản chèn (dùng chung cho store/export/test) ───────── */

/** Ký tự tách CẤP LỒNG trong `srcInsertId` (block con nằm trong block cha). */
export const INSERT_ID_NEST_SEP = '/';
/** Ký tự tách Ô MẢNG (rows/cols) trong `srcInsertId`. */
export const INSERT_ID_CELL_SEP = '#';

/**
 * Bản chèn CHA của `srcInsertId` — undefined khi đây đã là bản chèn ở cấp ngoài cùng.
 * `'i7#2.1/13'` → `'i7#2.1'`; `'i7#2.1'` → undefined (ô mảng vẫn là bản chèn cấp ngoài cùng).
 */
export function parentInsertId(insertId: string): string | undefined {
  const k = insertId.lastIndexOf(INSERT_ID_NEST_SEP);
  return k < 0 ? undefined : insertId.slice(0, k);
}

/** Chuỗi tổ tiên từ gần nhất ra ngoài cùng — `['i7#2.1', 'i7']`. Rỗng khi đã ở cấp ngoài cùng. */
export function insertIdAncestors(insertId: string): string[] {
  const out: string[] = [];
  let cur = parentInsertId(insertId);
  while (cur) { out.push(cur); cur = parentInsertId(cur); }
  return out;
}

/**
 * A2 · người tiêu thụ NGAY của `srcInsertId` — nở tập id đang chọn ra CẢ CỤM của bản chèn.
 *
 * Chọn 1 đường trong một bản chèn ⇒ nhận trọn bản chèn đó (đúng cảm giác "một cấu kiện là một
 * vật"), và CHỈ bản chèn đó — bản chèn khác của CÙNG tên block KHÔNG bị lem vào (đó chính là
 * điều `srcBlock` không làm được).
 *
 * **Mặc định nở ĐÚNG một cấp — bản chèn của chính hình đó, không leo lên cha.** Đo trên hồ sơ
 * thật mới thấy vì sao: block ẩn danh của AutoCAD lồng rất sâu, leo tới cấp ngoài cùng biến một
 * cú bấm thành 104 hình thuộc 5 bản chèn khác nhau — người dùng bấm cái ghế mà cầm cả góc phòng.
 * Muốn hành vi "bấm cái ghế = cầm cả cụm bàn" thì truyền `{ outermost: true }` (leo tới bản chèn
 * ngoài cùng); đó là lựa chọn của UI, không phải mặc định áp cho mọi đường chọn.
 *
 * THUẦN — không đụng store; `ids` không thuộc bản chèn nào thì giữ nguyên, không mất.
 */
export function expandIdsByInsertGroup(
  ids: Iterable<string>,
  doc: Doc,
  opts: { outermost?: boolean } = {},
): string[] {
  const want = new Set<string>();
  const byId = new Map(doc.entities.map((e) => [e.id, e]));
  for (const id of ids) {
    const e = byId.get(id);
    if (!e?.srcInsertId) continue;
    if (!opts.outermost) { want.add(e.srcInsertId); continue; }
    const chain = insertIdAncestors(e.srcInsertId);
    want.add(chain.length ? chain[chain.length - 1] : e.srcInsertId);
  }
  if (!want.size) return [...ids];
  const out = new Set<string>(ids);
  for (const e of doc.entities) {
    if (!e.srcInsertId) continue;
    if (want.has(e.srcInsertId)) { out.add(e.id); continue; }
    if (!opts.outermost) continue;
    for (const anc of insertIdAncestors(e.srcInsertId)) {
      if (want.has(anc)) { out.add(e.id); break; }
    }
  }
  return [...out];
}

/** NC-12 §4.2 — một bậc trong ngăn xếp dựng hình 3D. Thuần dữ liệu JSON, KHÔNG chứa hình học đã
 * tính (xem docstring `Base.ops`). `withRef`/`pathRef`/`sectionRefs` là id của entity KHÁC trong
 * CÙNG `Doc` (K1 — một nguồn, không type hình học riêng).
 *
 * MỞ KHO 08/08 (`docs/DOI-CHIEU-42-SPEC-2026-08-08.md` §1#1) — 6 biến thể MỚI, đủ nuôi 9 hàm
 * engine THUẦN đã viết xong+test 07/08 (`lib/three/build-ops.ts`, tầng ③④⑤ `SPEC-DUNG-BO-LENH-3D`)
 * mà trước đó 0 nơi gọi vì union chỉ có 3 biến thể cũ. ADDITIVE — 3 biến thể cũ (`extrude`/
 * `boolean`/`arrayLinear`) giữ NGUYÊN VĂN, `.idf` cũ chỉ chứa 3 biến thể đó vẫn parse/chạy y hệt
 * (JSON thuần, discriminant `op` không đổi tên field nào đã có — xem test round-trip
 * `build-ops.test.ts` "MỞ KHO — .idf cũ (chỉ 3 op cũ)…").
 *
 * `arrayRadial`/`mirror` là bậc MODIFIER (chạy TRÊN hình học đã có, không cần biết đa giác gốc) —
 * cùng tầng với `arrayLinear`, xem thứ tự modifier stack ở `resolveGroupGeometry`.
 *
 * `bevelEx`/`taper`/`sweep`/`revolve`/`loft` là bậc THAY-HÌNH-GỐC (replace) — 5 hàm này cần dữ
 * liệu hình học (đa giác/tiết diện/đường dẫn) mà `SceneGroup` (`lib/three/cad-to-obj.ts`) KHÔNG
 * giữ lại sau khi tam-giác-hoá (chỉ còn `positions` phẳng). Khác `extrude.bevel` (đọc `h.points`
 * SỐNG tại `cad-to-obj.ts`, file đó ngoài vùng đợt mở kho này) — 5 bậc trên NƯỚNG (bake) hình học
 * cần thiết NGAY LÚC người dùng đặt lệnh (`lib/cad/commands.ts` `setEntityTaper`/`setEntityBevelEx`
 * đọc đa giác của entity tại thời điểm gọi), lưu thẳng vào tham số của op. Đánh đổi: đa giác gốc
 * đổi SAU khi đặt lệnh (sửa tay tường) không tự cập nhật lại — cùng lớp giới hạn với `h` (tham
 * khảo, không phải nguồn đọc lại) đã ghi ở `extrude`. Cao độ (z0/z1) vẫn đọc SỐNG từ
 * `SceneGroup.heightMm`/`baseMm` — không nướng, đổi tầng/kéo cao vẫn cập nhật đúng. */
export type BuildOp =
  | { op: 'extrude'; h: number; bevel?: number }
  | { op: 'boolean'; kind: 'union' | 'subtract' | 'intersect'; withRef: string }
  | { op: 'arrayLinear'; n: number; dx: number; dy: number; dz: number }
  /** Mảng VÒNG TRÒN quanh trục đứng qua (centerXMm,centerYMm) — `lib/three/build-ops.ts` `arrayRadial`. */
  | { op: 'arrayRadial'; n: number; centerXMm: number; centerYMm: number; sweepDeg?: number }
  /** Đối xứng gương qua mặt phẳng vuông góc 1 trục CAD tại `atMm` — `build-ops.ts` `mirrorGeometry`. */
  | { op: 'mirror'; axis: 'x' | 'y' | 'z'; atMm: number; withOriginal?: boolean }
  /** Bo/vát cạnh NÂNG CAO (nhiều đoạn chia, chọn cạnh trên/đứng/cả hai) — khác `extrude.bevel` (vát
   * phẳng đơn giản, 1 đoạn, chỉ cạnh trên). `polyMm` = đa giác đáy NƯỚNG lúc đặt lệnh (xem docstring
   * union phía trên). `build-ops.ts` `prismBeveledEx`. */
  | { op: 'bevelEx'; polyMm: Pt[]; radiusMm: number; segments: number; edges: 'all' | 'vertical' | 'top' }
  /** Lăng trụ thu nhỏ dần lên đỉnh (chân bàn côn) — `polyMm` đáy NƯỚNG lúc đặt lệnh. `build-ops.ts`
   * `prismTapered`. */
  | { op: 'taper'; polyMm: Pt[]; topInsetMm: number }
  /** Quét tiết diện dọc đường dẫn (phào chỉ, tay vịn) — `profileMm`/`pathMm` NƯỚNG lúc đặt lệnh
   * (không đọc lại hình entity gốc). `build-ops.ts` `sweepProfile`. */
  | { op: 'sweep'; profileMm: Pt[]; pathMm: { x: number; y: number; z?: number }[]; closed?: boolean }
  /** Xoay tiết diện quanh trục đứng (chân bàn tiện, lọ) — `profileMm` do người dùng khai (chưa có
   * UI vẽ tiết diện nhiều điểm, xem `Command3DPanel.tsx`). `build-ops.ts` `revolveProfile`. */
  | { op: 'revolve'; profileMm: Pt[]; centerXMm: number; centerYMm: number; segments?: number; sweepDeg?: number }
  /** Nối chuỗi tiết diện ở nhiều cao độ (chụp đèn côn, đảo bếp vát) — mọi tiết diện PHẢI cùng số
   * đỉnh (xem `loftSections`). `build-ops.ts` `loftSections`. */
  | { op: 'loft'; sections: { polyMm: Pt[]; zMm: number }[] };

/** Đợt 4 (12/08) — "Công Thức Khối" (BuildRecipe), CẤP 1 `00-CHOT.md` 11/08: BIẾN `ops[]` phía
 * trên (thứ tự CỐ ĐỊNH theo LOẠI, xem `resolveGroupGeometry`) thành NGĂN XẾP THẬT — mỗi bước tự
 * `enabled` (mắt nhắm/mở, không xoá mất tham số), tự `id` (sửa/xoá/kéo đúng ĐÚNG bậc, không đoán
 * theo index — index đổi khi người dùng kéo thứ tự), `label?` (tuỳ chọn, đặt tên bước cho dễ đọc,
 * vd "Vát chân bàn"). KHÔNG THAY `Base.ops`/`opsDisabled` — hai cơ chế CÙNG TỒN TẠI, entity có thể
 * mang cả hai; nơi tiêu thụ (`lib/three/build-recipe.ts` `resolveSceneGroupGeometry`) ưu tiên
 * `recipe` khi có bước bật, lùi về `ops[]` khi không. Lý do giữ riêng, không "nâng cấp" `ops[]`
 * tại chỗ: `ops[]`/`opsDisabled` đã persist trong `.idf` thật của người dùng — đổi HÌNH DẠNG field
 * đó là vỡ dữ liệu cũ; `recipe` là field additive mới, `.idf` cũ không có vẫn mở nguyên.
 *
 * Type khai Ở ĐÂY (không phải `lib/three/build-recipe.ts` dù đó là nơi có evaluator+UI) để giữ
 * đúng ranh giới lớp đã ghi khắp file này: `model.ts` là lõi THUẦN, không phụ thuộc `three` dưới
 * bất kỳ hình thức nào (kể cả type-only import ngược) — xem docstring đầu `cad-to-obj.ts` "file
 * NÀY KHÔNG import three... đúng ranh giới thuần TS". `lib/three/build-recipe.ts` RE-EXPORT hai
 * type này để nơi gọi vẫn `import { BuildRecipe, evalRecipe } from 'lib/three/build-recipe'`. */
export interface BuildRecipeStep {
  id: string;
  op: BuildOp;
  enabled: boolean;
  label?: string;
}

/** Ngăn xếp — thứ tự MẢNG là thứ tự ÁP DỤNG THẬT (khác `ops[]` ưu tiên theo loại), người dùng đổi
 * bằng mũi tên lên/xuống ở UI (`Command3DPanel.tsx`). */
export interface BuildRecipe {
  steps: BuildRecipeStep[];
}

export interface LineEntity extends Base {
  type: 'line';
  a: Pt;
  b: Pt;
}

export interface PolylineEntity extends Base {
  type: 'polyline';
  points: Pt[];
  closed: boolean;
}

/** Rect lưu 1 góc + rộng/cao (w,h có thể âm). Vẽ như 4 cạnh. */
export interface RectEntity extends Base {
  type: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CircleEntity extends Base {
  type: 'circle';
  c: Pt;
  r: number;
}

/** Cung tròn: từ a1 → a2 (radian, ngược chiều kim đồng hồ trong hệ Y-up). */
export interface ArcEntity extends Base {
  type: 'arc';
  c: Pt;
  r: number;
  a1: number;
  a2: number;
}

export interface TextEntity extends Base {
  type: 'text';
  at: Pt;
  text: string;
  /** chiều cao chữ (mm) */
  h: number;
  /** Công năng phòng đã CHỐT (persisted) — đối tác lưu bền của classifyRoom(text) suy luận từ
   * chuỗi text. Optional: undefined = chưa gán/chưa backfill, checker.ts fallback classifyRoom().
   * Chỉ có ý nghĩa khi entity này ĐÓNG VAI TRÒ nhãn phòng (xem ROOM_NAME_RE trong checker.ts). */
  roomType?: RoomKind;
}

/** Loại dimension (Nấc 3). Thiếu `kind` (dữ liệu cũ) ⇒ coi như 'aligned' (tương thích ngược). */
export type DimKind = 'aligned' | 'radius' | 'diameter' | 'angular';

/**
 * Dimension — Nấc 3 mở rộng 4 kiểu, vẫn dùng chung a/b/off (+ c cho angular) để KHÔNG phá vỡ
 * mọi chỗ đang xử lý 'dim' như 1 đối tượng "2 điểm" (translate/rotate/mirror/hitTest…):
 *  - aligned  (DAL): a/b = 2 điểm đo, off = độ lệch đường kích thước (mm, dấu = phía).
 *  - radius   (DRA): a = tâm, b = điểm trên đường tròn/cung (xác định hướng leader); r = |a-b|.
 *  - diameter (DDI): giống radius nhưng vẽ xuyên tâm (điểm đối xứng qua a).
 *  - angular  (DAN): c = đỉnh góc; a/b = điểm bất kỳ trên mỗi cạnh (chỉ lấy HƯỚNG từ c); off =
 *    bán kính cung đo góc.
 */
export interface DimEntity extends Base {
  type: 'dim';
  kind?: DimKind;
  a: Pt;
  b: Pt;
  /** độ lệch đường ghi kích thước (aligned) HOẶC bán kính cung đo (angular), mm */
  off: number;
  /** CHỈ dùng khi kind==='angular': đỉnh góc */
  c?: Pt;
}

/** Thể hiện 1 block furniture: key tra trong lib/cad/furniture.ts + phép biến hình. */
export interface BlockEntity extends Base {
  type: 'block';
  block: string;
  at: Pt;
  /** góc xoay (radian) */
  rot: number;
  /** tỉ lệ; sx<0 = lật gương ngang */
  sx: number;
  sy: number;

  // ---- MỚI (Sprint 3, B2 — xem SHAPE-SCHEMA.md) ----
  /** id của ShapeVariant (lib/cad/furniture.ts) đang chọn; thiếu = variant mặc định (w/h/prims gốc). */
  variant?: string;
  /** true khi overlap object khác — tính lại mỗi lần render/move (lib/cad/shape-interactions.ts),
   * KHÔNG phải dữ liệu bền vững, KHÔNG serialize vào .idf/DXF. */
  collision?: boolean;

  // ---- MỚI (Hệ Legend X1 — docs/PROPOSAL-LEGEND-SYSTEM.md §2.2) ----
  /** FK mềm ProductSpec.id (bảng Prisma) — schedule/legend/spec-sheet đọc sku/brand/giá qua id
   * này. Optional + chỉ là chuỗi id ⇒ `.idf` cũ không có field vẫn parse bình thường (nguyên
   * tắc additive như elementType/storey); DXF export bỏ qua (không phá round-trip). */
  specId?: string;

  // ---- MỚI (`docs/SO-KIEM-TONG.md` §7 "cửa/cửa sổ hosted" — đúng kinh Revit: cửa/cửa sổ là
  // CON của tường, không phải khối rời) ----
  /** id của `HatchEntity` tường CHỦ — chỉ có ý nghĩa khi `block` là cửa/cửa sổ (`BlockDef.hosted`,
   * `lib/cad/furniture.ts`). KHÔNG bao giờ gõ tay: `lib/cad/hosting.ts` `syncHostedOpenings()` tự
   * suy ra bằng vị trí (điểm `at` có nằm trong dải bề dày hatch tường không) mỗi khi entity được
   * thêm/sửa, và tự xoá field này khi block bị kéo ra khỏi mọi tường. undefined = không phải cửa/
   * cửa sổ, HOẶC là cửa/cửa sổ nhưng chưa/không nằm trên tường nào (đặt rời, vẫn hợp lệ — không ép
   * buộc). `.idf` cũ không có field này ⇒ coi như chưa host, `syncHostedOpenings()` tự suy lại lần
   * mở đầu tiên (an toàn ngược, không cần bump IDF_VERSION). */
  hostId?: string;
}

/**
 * Vùng tô đặc (poché tường / fill mặt bằng). Biên là 1 đa giác đơn giản (lồi hoặc gần-lồi —
 * đủ cho quad tường do lệnh WALL sinh ra). Xuất DXF: tam-giác-hoá quạt từ đỉnh 0 thành các
 * entity SOLID (an toàn ở mọi bản DXF, không cần bảng BLOCK_RECORD như HATCH thật).
 */
/** Pattern hatch (Nấc 4). Thiếu `pattern` (dữ liệu cũ — poché tường từ WALL) ⇒ coi như SOLID
 * đặc, giữ đúng hành vi cũ (tô đặc, không đường gạch). */
export type HatchPattern = 'SOLID' | 'ANSI31' | 'ANSI32' | 'ANSI37' | 'DOTS';

export interface HatchEntity extends Base {
  type: 'hatch';
  points: Pt[];
  /** true = tô đặc. Khi có `pattern`, field này chỉ còn ý nghĩa lịch sử (giữ tương thích ngược
   * với dữ liệu cũ); ưu tiên đọc `pattern` nếu có. */
  solid?: boolean;
  pattern?: HatchPattern;
  /** tỉ lệ khoảng cách nét gạch (1 = mặc định ~60mm/nét); chỉ áp dụng khi pattern != SOLID. */
  patternScale?: number;
  /** góc nét gạch, độ (0-360); chỉ áp dụng khi pattern != SOLID/DOTS. */
  patternAngle?: number;
  /** Zone tool (N1) — độ mờ per-entity 0–1, thay hardcode globalAlpha 0.9 trong render.ts.
   * Thiếu ⇒ 0.9 (GIỮ NGUYÊN hành vi cũ, backward-compat). Chỉ áp cho SOLID/DOTS. */
  opacity?: number;
  /** BOQ ENGINE (02/08) — FK mềm ProductSpec.id, neo vùng tô này vào 1 vật liệu thật (kind
   * 'material'). Đây là hiện thân của "matId" nói ở `SPEC-SEMANTIC-MODEL.md` §4/§7 — dùng lại
   * ĐÚNG tên field + khuôn `BlockEntity.specId` phía trên (không bịa field song song mới) để
   * cùng 1 cơ chế tra ProductSpec ở mọi loại entity. Optional, additive: `.idf` cũ không có field
   * vẫn parse bình thường; undefined = vùng tô CHƯA gán vật liệu — `lib/boq/` phải báo lỗi rõ,
   * KHÔNG tự suy đoán/tính bừa (xem lib/boq/compute.ts). Chưa có UI gán ở IF1; hạ tầng dữ liệu
   * đi trước, UI gán vật liệu cho vùng tô là việc khác, không thuộc phạm vi việc này. */
  specId?: string;
}

/* ───────── WallRun (P11, `SPEC-VE-REVIT-MODE.md` §2) — location line của tường ───────── */

/**
 * Cạnh nào của tường ĐỨNG YÊN khi đổi bề dày (đúng khái niệm Location Line của Revit). "trái/
 * phải" tính THEO CHIỀU VẼ `path` (từ điểm đầu → điểm cuối, quay 90° CCW ra "trái" — chuẩn world
 * Y-up của file này), KHÔNG đoán trong/ngoài công trình (app này không có DCEL suy luận exterior
 * đáng tin cậy — cùng lý do `WallKind` phía trên không tự suy đoán).
 *  - 'center' — `path` là TIM tường, bề dày chia đều 2 bên.
 *  - 'left'/'right' — `path` CHÍNH LÀ mặt đó, bề dày dồn hết sang phía kia.
 */
export type WallLocationLine = 'center' | 'left' | 'right';

/**
 * `SPEC-VE-REVIT-MODE.md` §2 — lớp THAM SỐ đứng TRÊN lớp hình học hatch+polyline hiện có. Trước
 * đây `wallChain()`/`wallSegment()` sinh hình rồi VỨT path ngay (mỗi đoạn độc lập, không sửa lại
 * được — xem `SO-KIEM-TONG.md` §7 dòng "Location line tường"). `WallRun` giữ `path` SỐNG làm
 * nguồn sự thật parametric: đổi `thicknessMm`/`locationLine` rồi regen geometry (`commands.ts`
 * `regenWallRun`) mà cạnh `locationLine` đang chọn ĐỨNG YÊN đúng toạ độ — path không đổi, chỉ
 * offset ra biên đổi theo `t` mới (xem công thức `wallLocationOffsets` ở `commands.ts`).
 *
 * TỐI GIẢN cho ĐÚNG việc này (P11, "cơ chế đầu tiên") — CHƯA có:
 *  - `typeId`/`WallType` catalog (Type/Instance, §6 SPEC-VE-REVIT-MODE) — `thicknessMm` nằm
 *    thẳng trên run như instance, chưa có "1 chỗ đổi cả dự án đổi theo".
 *  - `openings` hosted cửa/cửa sổ (§4) — hosted hiện đi qua `BlockEntity.hostId`/`hosting.ts`,
 *    KHÔNG liên quan gì tới WallRun (2 cơ chế độc lập, chưa nối).
 *  - Nối tự sạch nhiều đoạn (§3 miter/bevel/T-trim) — mỗi đoạn `path` hiện sinh quad ĐỘC LẬP
 *    (giống `wallChain` cũ), góc nối có thể còn hở/chồng — việc RIÊNG, chưa làm ở đây.
 *  - Level/tầng constraint (§7 SO-KIEM-TONG) — WallRun không tham chiếu Level nào.
 *
 * additive: field mới trong `Doc`, `.idf` cũ không có `wallRuns` vẫn parse bình thường (mảng rỗng/
 * undefined = doc chưa có run nào — tường cũ vẫn tồn tại dưới dạng hatch+polyline rời như trước,
 * KHÔNG ép migrate lên WallRun).
 */
export interface WallRun {
  id: string;
  /** đường tham chiếu — CHÍNH LÀ cạnh `locationLine` đang chọn (không LUÔN LUÔN là tim hình học;
   * khi `locationLine` là 'left'/'right' thì `path` nằm đúng mặt đó, xem docstring type ở trên).
   * Đây là dữ liệu SỐNG duy nhất — `entityIds` chỉ là bản DERIVE, xoá đi sinh lại mỗi lần regen,
   * không bao giờ là nguồn sự thật (K1 — một nguồn). */
  path: Pt[];
  closed: boolean;
  thicknessMm: number;
  locationLine: WallLocationLine;
  layer: string;
  /** id các entity (hatch+polyline, 2 cái mỗi đoạn `path`) hiện đang THỂ HIỆN run này — regen
   * xoá đúng đám id cũ, thay bằng đám id mới trong MỘT snapshot (không rơi rớt entity mồ côi). */
  entityIds: string[];
}

/* ───────── WALL TYPE (VIỆC 3 — Type vs Instance, `SO-KIEM-TONG.md` §7 dòng "Type vs Instance") ───────── */

/**
 * MỘT LỚP trong cấu tạo tường (lõi + hoàn thiện) — đây là chỗ IF đầu tư sâu hơn thiên hạ theo
 * định vị "BIM nội thất" (`00-BAT-DAU-DOC-DAY.md` §1): lớp hoàn thiện (ốp gỗ · sơn · gạch) mới là
 * thứ nội thất quan tâm, Revit gọi là Structure editor.
 *
 * Thứ tự trong mảng = thứ tự lớp từ MẶT TRÁI sang MẶT PHẢI theo chiều vẽ (cùng quy ước
 * `WallLocationLine` phía trên — không đoán trong/ngoài công trình).
 */
export interface WallTypeLayer {
  /** tên lớp người dùng thấy, VD 'Ốp gỗ sồi' / 'Gạch 100' / 'Vữa trát'. */
  name: string;
  thicknessMm: number;
  /** FK mềm `ProductSpec.id` — vật liệu THẬT của lớp này (cùng khuôn `HatchEntity.specId`). */
  specId?: string;
  /** true = lớp KẾT CẤU (lõi chịu lực). Nhiều nhất 1 lớp nên đánh dấu — nhưng KHÔNG ép ở tầng
   * type (không có nơi tiêu thụ để kiểm), `resolveWallParams()` chỉ đọc, không phán. */
  core?: true;
}

/**
 * TYPE tường dùng chung cả dự án — "1 chỗ đổi, mọi bản sao đổi theo". Trước đây `wallKind`/
 * `wallThicknessMm`/`specId` nằm THẲNG trên từng entity ⇒ 100% instance, đổi bề dày 1 loại tường
 * phải sửa tay từng đoạn (đúng hiện trạng §7 ghi).
 *
 * ⚠️ LUẬT GHI ĐÈ (giống Revit): giá trị khai trên INSTANCE **thắng** giá trị của Type. Type là
 * MẶC ĐỊNH, không phải xiềng — `resolveWallParams()` trả về cả giá trị cuối lẫn NGUỒN của nó
 * ('instance' | 'type' | 'none') để UI hiện được chấm "đã override".
 *
 * additive: `.idf` cũ không có `Doc.wallTypes` vẫn parse — entity không `typeId` chạy y như trước.
 */
export interface WallType {
  id: string;
  name: string;
  /** bề dày TỔNG của type (mm). Khi có `layers`, đây là con số CHÍNH THỨC dùng để dựng hình —
   * `layers` là cấu tạo chi tiết; lệch tổng thì `resolveWallParams()` báo `layersMismatchMm`,
   * KHÔNG tự sửa số nào (N4 — không gán bừa). */
  thicknessMm: number;
  kind: WallKind;
  layers?: WallTypeLayer[];
  /** FK mềm `ProductSpec.id` — vật liệu mặc định của type (instance có `specId` thì instance thắng). */
  specId?: string;
}

/* ───────── Zone tool (N1 — GAP-COLOR-FILL) — entity ellipse/arrow/zone ───────── */

/** Ellipse THẬT (khác tool 'ellipse' cũ vốn xấp xỉ PolylineEntity 48 điểm): tâm + 2 bán trục
 * (mm) + góc xoay quanh tâm (rad, optional). Dùng làm biên zone oval + hình học độc lập. */
export interface EllipseEntity extends Base {
  type: 'ellipse';
  c: Pt;
  rx: number;
  ry: number;
  rot?: number;
}

/** Mũi tên tự do (circulation flow) — polyline 2+ điểm, đầu mũi tên tam giác ở đầu/cuối path.
 * Nét đứt: đặt `lineType: 'dashed'` (kế thừa Base) như mọi entity khác. */
export interface ArrowEntity extends Base {
  type: 'arrow';
  path: Pt[];
  /** mũi tên ở ĐIỂM ĐẦU path (mặc định false). */
  headStart?: boolean;
  /** mũi tên ở ĐIỂM CUỐI path (mặc định true). */
  headEnd?: boolean;
  /** kích thước đầu mũi tên (mm, mặc định 250). */
  headSize?: number;
}

/** 6 nhóm chức năng VN hoá (chốt 24/07): Khu ướt · Khu sinh hoạt chung · Khu riêng tư ·
 * Khu làm việc · Ban công/loggia · Phụ trợ/kỹ thuật. */
export type ZoneGroup = 'wet' | 'social' | 'private' | 'work' | 'balcony' | 'service';

/** Metadata hiển thị của từng nhóm zone — nguồn sự thật CHUNG cho render (màu fill), legend
 * panel và DXF export. Màu pastel hài hoà trên cả nền sáng/tối, opacity mặc định 0.4. */
export const ZONE_GROUP_META: Record<ZoneGroup, { vi: string; en: string; color: string }> = {
  wet: { vi: 'Khu ướt', en: 'Wet area', color: '#6FB5DC' },
  social: { vi: 'Khu sinh hoạt chung', en: 'Social', color: '#E9C46A' },
  private: { vi: 'Khu riêng tư', en: 'Private', color: '#E39A80' },
  work: { vi: 'Khu làm việc', en: 'Work', color: '#95BF7B' },
  balcony: { vi: 'Ban công / loggia', en: 'Balcony · Loggia', color: '#7FC9B4' },
  service: { vi: 'Phụ trợ / kỹ thuật', en: 'Service · MEP', color: '#A695C9' },
};

export const ZONE_GROUPS: ZoneGroup[] = ['wet', 'social', 'private', 'work', 'balcony', 'service'];

/** mặc định opacity zone (chốt 24/07: 40%). */
export const ZONE_DEFAULT_OPACITY = 0.4;

/**
 * Zone = vùng chức năng phủ đè mặt bằng ("mapa de zonas"). Biên là ellipse HOẶC polygon
 * (đúng 1 field được set — hỗ trợ CẢ 2, chốt 24/07). Màu lấy theo `group` qua ZONE_GROUP_META
 * (entity.color vẫn override được như mọi entity). Zone KHÔNG phải hình học thi công — render
 * ĐÈ TRÊN geometry, DƯỚI dimension/text (xem drawEntities trong render.ts).
 */
export interface ZoneEntity extends Base {
  type: 'zone';
  polygon?: Pt[];
  ellipse?: { c: Pt; rx: number; ry: number; rot?: number };
  /** nhãn chức năng in trên zone, VD "PHÒNG KHÁCH". */
  label: string;
  /** nhãn phụ tiếng Anh (optional, in nhỏ dưới label chính). */
  labelEn?: string;
  group: ZoneGroup;
  /** 0–1, mặc định ZONE_DEFAULT_OPACITY. */
  opacity: number;
  /** override vị trí nhãn; thiếu = centroid biên. */
  labelPos?: Pt;
}

/** Xấp xỉ biên zone thành polygon (ellipse → N điểm, có xoay). Dùng chung cho hit-test/bbox/
 * DXF export/centroid — 1 công thức duy nhất, không lệch nhau. */
export function zoneBoundaryPoints(z: ZoneEntity, segments = 32): Pt[] {
  if (z.polygon && z.polygon.length >= 3) return z.polygon;
  if (z.ellipse) return ellipseBoundaryPoints(z.ellipse.c, z.ellipse.rx, z.ellipse.ry, z.ellipse.rot ?? 0, segments);
  return [];
}

/** N điểm trên biên ellipse tâm c, bán trục rx/ry, xoay `rot` rad quanh tâm. */
export function ellipseBoundaryPoints(c: Pt, rx: number, ry: number, rot = 0, segments = 32): Pt[] {
  const n = Math.max(8, segments);
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = rx * Math.cos(t);
    const y = ry * Math.sin(t);
    pts.push({ x: c.x + x * cos - y * sin, y: c.y + x * sin + y * cos });
  }
  return pts;
}

/** Trọng tâm (centroid trung bình đỉnh — đủ cho vị trí nhãn) của biên zone. */
export function zoneCentroid(z: ZoneEntity): Pt {
  if (z.ellipse) return { ...z.ellipse.c };
  const pts = z.polygon ?? [];
  if (!pts.length) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const p of pts) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / pts.length, y: sy / pts.length };
}

/**
 * G-M2-04 (07/08) — PHÒNG là CẤU KIỆN THẬT trong `Doc`, theo đúng `SPEC-TANG-DU-LIEU-CAU-KIEN`
 * §6.2. Trước đây "phòng" sống ở 3 dạng rời không dạng nào là bản chính (nhãn TEXT không biên ·
 * ZoneEntity là lớp PHÂN TÍCH đè lên · polygon dò lại mỗi lần dựng 3D, không id) ⇒ không chỗ nào
 * treo được trần/sàn/phào, diện tích là chữ chết (G-M2-03), sàn không tính được từ hình học
 * (G-M1-05).
 *
 * BẤT BIẾN — đọc kỹ trước khi sửa:
 *  - `boundary` là biên KÍN ĐÃ ĐÓNG BĂNG lúc tạo phòng (dò bằng `pickHatchFace`, xem
 *    `lib/cad/room.ts` `detectRooms`) — từ đó biên là DỮ LIỆU, không phải phép đoán chạy lại mỗi
 *    frame. Tường đổi ⇒ UI hiện "biên cũ so với tường" (`roomBoundaryStale`), người dùng bấm cập
 *    nhật, KHÔNG tự sửa (luật L5 ghi-ngược-chỉ-qua-lệnh).
 *  - Diện tích KHÔNG lưu — mọi ống kính tính từ `boundary` qua `roomAreaM2()` (một nguồn, hết
 *    cảnh nhãn m² chết G-M2-03).
 *  - KHÁC `ZoneEntity`: zone là lớp phân tích trình bày (opacity, nhóm màu); room là cấu kiện
 *    dữ liệu (IfcSpace). Không trộn (xem bảng so sánh trong spec §6.2).
 *  - Field vật liệu phòng (floorSpecId/ceilingSpecId/skirtingSpecId/ceilingHeightMm trong spec)
 *    CHƯA khai ở đây — luật K4/L7: chưa có ống kính nào tiêu thụ (3D lens ngoài vùng phiên khai
 *    field này). Thêm khi nơi tiêu thụ có thật, đừng khai trước.
 */
export interface RoomEntity extends Base {
  type: 'room';
  /** IfcSpace — `detectRooms` luôn gán 'space'. Kiểu để rộng `ElementType` (không siết literal)
   * vì panel BIM gán hàng loạt (`BimAssignBox`) áp chung mọi entity đang chọn — siết ở đây là
   * vỡ kiểu chỗ đó; ngữ nghĩa đúng vẫn là 'space', ghi ở docstring thay vì ở type. */
  elementType?: ElementType;
  /** Biên KÍN của lòng phòng, mm world — sự thật duy nhất về biên (xem docstring trên). */
  boundary: Pt[];
  /** Tên phòng, quy ước chữ hoa như nhãn TEXT cũ — "PHÒNG KHÁCH". */
  name: string;
  /** Công năng — TÁI DÙNG RoomKind đã có (không đẻ union mới). */
  roomKind?: RoomKind;
  /** Vị trí nhãn trên bản vẽ; thiếu = centroid boundary. */
  labelPos?: Pt;
}

/** Centroid trung bình đỉnh của biên phòng — vị trí nhãn mặc định (cùng công thức zoneCentroid). */
export function roomCentroid(r: RoomEntity): Pt {
  if (!r.boundary.length) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const p of r.boundary) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / r.boundary.length, y: sy / r.boundary.length };
}

export type Entity =
  | LineEntity
  | PolylineEntity
  | RectEntity
  | CircleEntity
  | ArcEntity
  | TextEntity
  | DimEntity
  | BlockEntity
  | HatchEntity
  | EllipseEntity
  | ArrowEntity
  | ZoneEntity
  | RoomEntity;

/**
 * Sprint 7 — Việc 3 (Markup overlay): ghim ghi chú KH đặt trên bản vẽ. KHÔNG phải hình học
 * (không vào Entity union) — annotation rời, không ảnh hưởng vẽ tường/phòng/hatch/DXF export.
 * Toạ độ world mm giống entity khác nên pan/zoom/scale-all vẫn đúng vị trí ghim.
 */
export interface MarkupPin {
  id: string;
  at: Pt;
  text: string;
  /** màu ghim, hex '#rrggbb'. */
  color: string;
  /** epoch ms lúc tạo — hiện trong tooltip. */
  ts: number;
}

/**
 * Sprint 7 — Việc 4 (Photo embed): ảnh hiện trường gắn tại 1 điểm trên bản vẽ (thumbnail nhỏ,
 * click xem full-size). Cũng là annotation rời như MarkupPin — KHÔNG vào Entity union.
 * `src` là data URL (giống pattern ảnh khác trong app — xem components/studio/UploadButton.tsx).
 */
export interface PhotoEmbed {
  id: string;
  at: Pt;
  src: string;
  caption?: string;
  ts: number;
}

/**
 * Zone tool (N3) — lớp ảnh site/aerial do user tự upload, TRẢI THEO WORLD BOUNDS (mm) nên
 * pan/zoom/scale-all đúng vị trí (khác PhotoEmbed vốn là thumbnail cố định px tại 1 điểm).
 * Render TRƯỚC mọi entity (nền dưới cùng). Optional — `.idf` cũ không có field này.
 */
export interface SiteImage {
  src: string; // data URL
  /** góc dưới-trái theo world mm (Y-up). */
  x: number;
  y: number;
  /** kích thước world mm. */
  w: number;
  h: number;
  /** 0–1, mặc định 0.6. */
  opacity: number;
  visible: boolean;
}

export interface Model3DResource {
  /** Đường dẫn tương đối mà manifest glTF dùng; file picker thường chỉ cấp basename. */
  name: string;
  dataUrl: string;
  sizeBytes: number;
}

/** Tệp/gói mô hình 3D gốc do người dùng nhập. Lưu NGUỒN, không lưu mesh dẫn xuất: viewer parse
 * lại khi cần nên `.idf`/autosave vẫn có đúng một nguồn sự thật. Union giữ GLB P0 tương thích. */
export type Model3DSource = {
  id: string;
  name: string;
  sizeBytes: number;
  importedAt: string;
} & (
  | { format: 'glb'; dataUrl: string }
  | { format: 'gltf'; entryName: string; resources: Model3DResource[] }
  | { format: 'obj'; entryName: string; mtlName?: string; resources: Model3DResource[] }
);

export interface Doc {
  entities: Entity[];
  layers: Layer[];
  /** Sprint 7 — annotation rời (markup + ảnh); optional để tương thích ngược dữ liệu cũ. */
  markups?: MarkupPin[];
  photos?: PhotoEmbed[];
  /** Zone tool — ảnh aerial nền (optional, backward-compat). */
  siteImage?: SiteImage | null;
  /** Mô hình 3D ngoại nhập, tự vào autosave/.idf cùng Doc. Mesh hiển thị luôn là dữ liệu dẫn xuất. */
  model3dSources?: Model3DSource[];
  /**
   * B1 (24/07) — TỈ LỆ IN per-sheet: N của "1:N" (20/25/50/100/200…). undefined = auto-fit
   * (hành vi cũ nguyên vẹn — fitBox/fitScaleLabel). Lưu trong Doc nên tự per-sheet (mỗi sheet
   * giữ Doc riêng) + tự vào .idf (JSON). Xem STANDARD_SCALES/fixedScaleViewport bên dưới.
   */
  printScale?: number;
  /** B1 (24/07) — khổ giấy in per-sheet. undefined = A3 (mặc định cũ). */
  paperKey?: PaperKey;
  /** 2.1.8.m (30/07, Luật #10 — chuẩn AutoCAD Page Setup/ISO 5457) — hướng giấy, TRỤC ĐỘC LẬP với
   * `paperKey` (khổ và hướng không phải cùng 1 trục — "A3 ngang"/"A3 dọc" là 2 lựa chọn của CÙNG
   * khổ A3, không phải 2 khổ khác nhau). undefined = mặc định theo khổ, xem `defaultPaperOrientation()`. */
  paperOrientation?: PaperOrientation;
  /**
   * Tên studio/công ty in ở khung tên — NHẬN DIỆN CỦA DỰ ÁN, không phải của app (luật nền
   * tảng: IF là sản phẩm độc lập, không nhúng cứng studio nào). Nguồn: Brand Kit dự án
   * (`getActiveBrandKit().name`) hoặc user gõ tay ở TitleBlockPanel. undefined/'' = để trống.
   * Lưu trong Doc ⇒ tự vào .idf, per-sheet. .idf cũ không có field này ⇒ khung tên trống, hợp lệ.
   */
  studioName?: string;
  /** P11 (`SPEC-VE-REVIT-MODE.md` §2) — tường mode Revit giữ tim/location line sống (xem
   * `WallRun` phía trên). undefined/mảng rỗng = doc chưa có run nào — tường vẽ ở sketch/pro
   * (`wallChain`/`wallSegment`) KHÔNG tạo WallRun, vẫn là hatch+polyline rời như trước. */
  wallRuns?: WallRun[];
  /** VIỆC 1 — danh sách TẦNG THẬT của bản vẽ này (xem `Level`). undefined/rỗng = chưa có tầng
   * nào; entity vẫn dựng từ z=0 y như hôm nay. `.idf` v1 (không có field này) được migration
   * v1→v2 sinh tự động từ tập `Base.storey` đã dùng — xem `lib/cad/idf.ts`. */
  levels?: Level[];
  /** VIỆC 3 — catalog Type tường dùng chung trong bản vẽ này (xem `WallType`). undefined/rỗng =
   * chưa có type nào, tường 100% instance như trước. */
  wallTypes?: WallType[];
  /** VIỆC 4 — nắng · bầu trời · đèn trong nhà (`lib/three/lighting.ts`). undefined = chưa cấu
   * hình; `buildLightRig()` trả bộ mặc định, dựng hình không đổi.
   * ⚠️ `import type` (chỉ KIỂU, bị xoá lúc biên dịch) nên KHÔNG tạo phụ thuộc chạy-thật
   * `lib/cad` → `lib/three` — tránh vòng lặp import, vì `lighting.ts` lại đọc `Doc` từ file này. */
  lighting?: DocLighting;
}

/* ───────────────────────── B1 — tỉ lệ bản vẽ chuẩn + khổ giấy (paper-space cơ bản) ───────────────────────── */

/**
 * 2.1.8.m (30/07, Luật #10) — SỬA lỗi gốc "nướng hướng giấy vào tuple kích thước": trước đây
 * `PAPER_SIZES_MM` lưu SẴN dạng ngang (A3=[420,297]), coi "khổ" và "hướng" là 1 trục — thiếu A0/A4
 * chỉ là TRIỆU CHỨNG, không phải bệnh gốc. Chuẩn AutoCAD Page Setup/ISO 5457: khổ giấy (A0-A4) và
 * hướng (ngang/dọc) là HAI TRỤC ĐỘC LẬP — cùng 1 khổ A3 có thể ngang HOẶC dọc, không phải 2 khổ
 * khác nhau ("A3-ngang" KHÔNG phải khổ giấy thứ 6). Sửa: `PAPER_SIZES_MM` lưu CHUẨN DỌC [ngắn,
 * dài] (đúng cách ISO 216 công bố khổ giấy), `paperSizeMm(key, orientation)` hoán vị khi ngang.
 */
export type PaperKey = 'A0' | 'A1' | 'A2' | 'A3' | 'A4';
export type PaperOrientation = 'portrait' | 'landscape';

/** Khổ giấy ISO 216 CHUẨN DỌC [ngắn, dài] (mm) — dùng `paperSizeMm()` để lấy kích thước HIỆU
 * DỤNG theo hướng, ĐỪNG đọc thẳng tuple này làm [rộng, cao] (đó chính là lỗi gốc đã sửa ở đây). */
export const PAPER_SIZES_MM: Record<PaperKey, [number, number]> = {
  A0: [841, 1189],
  A1: [594, 841],
  A2: [420, 594],
  A3: [297, 420],
  A4: [210, 297],
};

/** ISO 5457 — hướng MẶC ĐỊNH theo khổ khi Doc chưa chọn tường minh: A0-A3 ngang (bản vẽ kỹ
 * thuật/mặt bằng), A4 dọc (biểu mẫu/mục lục — khớp trang mục lục `buildSheetSetPdf` đã dùng). */
export function defaultPaperOrientation(key: PaperKey): PaperOrientation {
  return key === 'A4' ? 'portrait' : 'landscape';
}

/** Kích thước giấy HIỆU DỤNG [rộng, cao] (mm) — khổ + hướng, 2 trục độc lập ghép lại. Đây là hàm
 * DUY NHẤT được đọc kích thước giấy để vẽ/xuất — mọi nơi khác PHẢI qua đây (Luật Đồng Bộ #6),
 * không tự hoán vị `PAPER_SIZES_MM` tay (dễ hoán nhầm chiều, xem lịch sử lỗi ở docstring trên). */
export function paperSizeMm(key: PaperKey, orientation: PaperOrientation): [number, number] {
  const [short, long] = PAPER_SIZES_MM[key];
  return orientation === 'landscape' ? [long, short] : [short, long];
}

/** Thang tỉ lệ kiến trúc chuẩn (1:N) — ISO 5455 / thực hành hồ sơ nội thất. */
export const STANDARD_SCALES = [10, 20, 25, 50, 100, 200, 500] as const;

/**
 * VIỆC 1 `ty-le-chuan` (docs/CHUAN-DAU-RA-NGHE.md §1) — dãy nấc tỉ lệ IN đầy đủ theo LUẬT:
 * 1:1 · 1:2 · 1:5 + STANDARD_SCALES (10…500). KHÔNG sửa `STANDARD_SCALES` (UI/`suggestStandardScale`
 * đang dùng, đổi là lệch hành vi chỗ khác) — chỉ GHÉP thêm 3 nấc nhỏ mà LUẬT liệt kê cho bản vẽ
 * chi tiết (1:1/1:2/1:5 dùng cho detail đồ mộc, chưa gặp ở mặt bằng nhưng dãy chuẩn phải đủ).
 */
export const PRINT_SCALE_STEPS: readonly number[] = [1, 2, 5, ...STANDARD_SCALES];

/** N có phải một nấc tỉ lệ in chuẩn không — cổng kiểm CHUAN_DAU_RA dùng (export-checks.ts). */
export function isStandardPrintScale(n: number): boolean {
  return PRINT_SCALE_STEPS.includes(n);
}

/**
 * VIỆC 1 `ty-le-chuan` — BẮT tỉ lệ fit-trang về nấc chuẩn GẦN NHẤT VỀ PHÍA NHỎ HƠN (N lớn hơn):
 * bản vẽ thu nhỏ lại một chút thì chắc chắn vẫn lọt giấy, còn phóng to là tràn. `rawN` là N thô
 * từ auto-fit (vd 47.3 nghĩa là "1:47.3") → trả nấc chuẩn (47.3 → 50 · 12 → 20 · 200 → 200).
 * Vượt cả 1:500 → trả 500 (caller phải tự kiểm `fitsAtScale` — bản vẽ cỡ đó không lọt khổ nào,
 * cổng CHUAN_DAU_RA sẽ báo thay vì im lặng in số lẻ).
 */
export function snapPrintScale(rawN: number): number {
  if (!Number.isFinite(rawN) || rawN <= 0) return 100;
  // 1e-9: N đã LÀ nấc chuẩn nhưng lệch epsilon do phép chia float thì vẫn giữ đúng nấc đó.
  for (const n of PRINT_SCALE_STEPS) if (n >= rawN - 1e-9) return n;
  return PRINT_SCALE_STEPS[PRINT_SCALE_STEPS.length - 1];
}

/**
 * Gợi ý tỉ lệ CHUẨN nhỏ nhất (chi tiết nhất) mà bản vẽ vẫn lọt khổ giấy: N chuẩn đầu tiên
 * ≥ 1/fitScale. Vượt cả 1:500 → trả 500 (bản vẽ cực lớn, người dùng tự cân nhắc).
 */
export function suggestStandardScale(box: Box | null, paperMm: [number, number], margin: number): number {
  const b = box ?? { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };
  const { scale } = fitBox(b, paperMm[0], paperMm[1], margin);
  if (!Number.isFinite(scale) || scale <= 0) return 100;
  const need = 1 / scale;
  for (const n of STANDARD_SCALES) if (n >= need - 1e-9) return n;
  return STANDARD_SCALES[STANDARD_SCALES.length - 1];
}

/**
 * Viewport in Ở TỈ LỆ CỐ ĐỊNH 1:N ("plot to scale" thay vì "fit to paper"): scale = 1/N
 * (mm-giấy trên mỗi mm-world), bản vẽ căn GIỮA khổ giấy. Cùng hệ toạ độ worldToScreen như
 * fitBox nên pdf.ts dùng thẳng, dimension/text nhân v.scale tự đúng cỡ giấy.
 */
export function fixedScaleViewport(box: Box | null, paperMm: [number, number], scaleN: number): Viewport {
  const b = box ?? { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };
  const scale = 1 / Math.max(1, scaleN);
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  return { scale, panX: paperMm[0] / 2 - cx * scale, panY: paperMm[1] / 2 + cy * scale };
}

/** Bản vẽ có LỌT khổ giấy ở tỉ lệ 1:N không (trừ lề)? Dùng để pdf.ts fallback auto-fit an toàn. */
export function fitsAtScale(box: Box | null, paperMm: [number, number], margin: number, scaleN: number): boolean {
  const b = box ?? { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };
  const bw = (b.maxX - b.minX) / Math.max(1, scaleN);
  const bh = (b.maxY - b.minY) / Math.max(1, scaleN);
  return bw <= paperMm[0] - margin * 2 && bh <= paperMm[1] - margin * 2;
}

/**
 * Nhãn tỉ lệ HIỆU DỤNG của 1 Doc: printScale đã chọn (và còn lọt giấy) → "1:N" chuẩn;
 * chưa chọn/không lọt → fitScaleLabel (auto-fit, hành vi cũ). UI khung tên + pdf.ts dùng CHUNG
 * hàm này nên 2 con số không bao giờ lệch nhau.
 */
export function docScaleLabel(doc: Doc, paperMm: [number, number], margin: number): string {
  const box = docBox(doc);
  if (doc.printScale && fitsAtScale(box, paperMm, margin, doc.printScale)) return `1:${doc.printScale}`;
  return fitScaleLabel(box, paperMm, margin);
}

/** Khổ giấy hiệu dụng của Doc (mm) — paperKey+paperOrientation per-sheet. Doc cũ không có 2
 * field này (trước khi 2.1.8.m tách hướng) → A3 NGANG (khớp hành vi cũ nguyên vẹn — tương thích
 * ngược, xem defaultPaperOrientation('A3')==='landscape'). */
export function docPaperMm(doc: Doc): [number, number] {
  const key = doc.paperKey ?? 'A3';
  return paperSizeMm(key, doc.paperOrientation ?? defaultPaperOrientation(key));
}

export const DEFAULT_LAYERS: Layer[] = [
  { id: 'l-wall', name: 'Tường', color: '#47423a', visible: true, locked: false, lineweight: 0.6, lineType: 'continuous' },
  { id: 'l-furniture', name: 'Nội thất', color: '#c08a5a', visible: true, locked: false, lineweight: 0.3, lineType: 'continuous' },
  { id: 'l-dim', name: 'Kích thước', color: '#7aa2c4', visible: true, locked: false, lineweight: 0.15, lineType: 'continuous' },
  { id: 'l-text', name: 'Ghi chú', color: '#9a9488', visible: true, locked: false, lineweight: 0.15, lineType: 'continuous' },
  { id: 'l-axis', name: 'Trục', color: '#8a7a9a', visible: true, locked: false, lineweight: 0.13, lineType: 'center' },
];

/** V2 — tên layer hệ thống cho đường cam (§2.1). KHÔNG có trong `DEFAULT_LAYERS` — tự tạo bằng
 * `ensureLayerByName()` (store.ts) khi user vẽ đường cam đầu tiên, không seed sẵn mọi doc. */
export const CAMPATH_LAYER_NAME = 'IF_CAMPATH';
export const CAMPATH_LAYER_COLOR = '#3b82f6';

export function emptyDoc(): Doc {
  return { entities: [], layers: DEFAULT_LAYERS.map((l) => ({ ...l })), markups: [], photos: [] };
}

/* ───────────────────────── hình học tiện ích ───────────────────────── */

export function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Biến đổi 1 điểm LOCAL (mm, gốc tâm block) sang WORLD theo phép biến hình của BlockEntity:
 * scale → rotate → translate (khớp `blockLocalToWorld` trong lib/cad/render.ts — dùng CHUNG
 * công thức này ở lib/cad/grips.ts + lib/cad/shape-interactions.ts để không lệch nhau).
 */
export function blockToWorld(local: Pt, xf: { at: Pt; rot: number; sx: number; sy: number }): Pt {
  const x = local.x * xf.sx;
  const y = local.y * xf.sy;
  const cos = Math.cos(xf.rot);
  const sin = Math.sin(xf.rot);
  return { x: xf.at.x + x * cos - y * sin, y: xf.at.y + x * sin + y * cos };
}

export function mid(a: Pt, b: Pt): Pt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Khoảng cách từ điểm p đến đoạn thẳng a-b + điểm gần nhất trên đoạn. */
export function nearestOnSeg(p: Pt, a: Pt, b: Pt): { pt: Pt; d: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const pt = { x: a.x + t * dx, y: a.y + t * dy };
  return { pt, d: dist(p, pt) };
}

/** Giao 2 đoạn thẳng (nếu có, trong biên đoạn). null nếu song song / không cắt. */
export function segIntersect(a: Pt, b: Pt, c: Pt, d: Pt): Pt | null {
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const denom = r.x * s.y - r.y * s.x;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / denom;
  const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / denom;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { x: a.x + t * r.x, y: a.y + t * r.y };
}

/**
 * Điểm `p` có nằm TRONG đa giác `poly` không (even-odd, ray-casting chuẩn).
 *
 * 🏠 VÌ SAO Ở ĐÂY chứ không ở `hatch.ts` (dời 04/09): nó là hình học thuần, và `query.ts` cần
 * nó để `hitTest` bắt được cú bấm GIỮA LÒNG vùng tô. Nhưng `hatch.ts` đã `import { entSegments }
 * from './query'` ⇒ để nguyên chỗ cũ thì `query → hatch → query` thành vòng import. `model.ts`
 * là tầng dưới cùng cả hai đều đã nhập, nên đây mới là nhà đúng. `hatch.ts` XUẤT LẠI hai hàm
 * này nên 6 nơi đang nhập từ `./hatch` không phải đổi dòng nào.
 * ⚠️ `lib/cad/label-placer.ts:248` còn một bản chép riêng — nợ cũ, KHÔNG đụng trong lượt này để
 * khỏi trộn hai việc; ai dọn thì xoá bản đó và nhập từ đây.
 */
export function pointInPolygon(p: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect = yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Diện tích tuyệt đối (shoelace) — dùng để chọn vòng NHỎ NHẤT khi nhiều vòng đều hợp lệ. */
export function polygonArea(poly: Pt[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

export interface Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function growBox(box: Box, p: Pt) {
  box.minX = Math.min(box.minX, p.x);
  box.minY = Math.min(box.minY, p.y);
  box.maxX = Math.max(box.maxX, p.x);
  box.maxY = Math.max(box.maxY, p.y);
}

/**
 * A3 · G-M1-07 — "VÂN TAY" HÌNH HỌC của 1 entity: chuỗi đại diện đúng phần hình (toạ độ/bán
 * kính/góc/chữ), KHÔNG gồm id·layer·màu·ngữ nghĩa. Đổi màu hay gán `elementType` ⇒ vân tay KHÔNG
 * đổi; dời/kéo/xoay/sửa đỉnh ⇒ đổi.
 *
 * Dùng ở `store.ts` `updateEntities` để trả lời đúng một câu: *hình này có còn y như lúc nạp từ
 * block không?* Còn ⇒ giữ `srcInsertId`, lúc xuất được dựng lại thành INSERT. Đã sửa ⇒ gỡ
 * `srcInsertId` (hình đã RỜI khỏi bản chèn), xuất phẳng như trước. Đây là ranh giới "chưa bị sửa"
 * mà `planReblock` (`dxf.ts`) dựa vào — cố ý đặt ở `model.ts` để CẢ HAI phía đọc cùng một định
 * nghĩa, không mỗi nơi tự đoán một kiểu.
 *
 * Loại hình không liệt kê ⇒ trả chuỗi theo `entityBox` (đủ bắt mọi phép dời/co) — thà nhạy quá
 * (gỡ nhầm `srcInsertId`, mất block, hình vẫn đúng) còn hơn bỏ sót (giữ block cho hình đã đổi ⇒
 * xuất ra SAI hình).
 */
export function entityGeomSignature(e: Entity): string {
  const n = (v: number) => (Number.isFinite(v) ? v.toString() : 'x');
  const pts = (ps: Pt[]) => ps.map((p) => `${n(p.x)},${n(p.y)}`).join(';');
  switch (e.type) {
    case 'line': return `line ${n(e.a.x)},${n(e.a.y)} ${n(e.b.x)},${n(e.b.y)}`;
    case 'polyline': return `poly ${e.closed ? 1 : 0} ${pts(e.points)}`;
    case 'hatch': return `hatch ${pts(e.points)}`;
    case 'rect': return `rect ${n(e.x)},${n(e.y)} ${n(e.w)}x${n(e.h)}`;
    case 'circle': return `circle ${n(e.c.x)},${n(e.c.y)} ${n(e.r)}`;
    case 'arc': return `arc ${n(e.c.x)},${n(e.c.y)} ${n(e.r)} ${n(e.a1)} ${n(e.a2)}`;
    case 'text': return `text ${n(e.at.x)},${n(e.at.y)} ${n(e.h)} ${e.text}`;
    default: {
      const b = entityBox(e);
      return `${e.type} ${n(b.minX)},${n(b.minY)} ${n(b.maxX)},${n(b.maxY)}`;
    }
  }
}

/** Bao hình của 1 entity (xấp xỉ với block/text). */
export function entityBox(e: Entity): Box {
  const box: Box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  switch (e.type) {
    case 'line':
      growBox(box, e.a);
      growBox(box, e.b);
      break;
    case 'dim':
      growBox(box, e.a);
      growBox(box, e.b);
      if (e.c) growBox(box, e.c);
      break;
    case 'polyline':
      e.points.forEach((p) => growBox(box, p));
      break;
    case 'rect':
      growBox(box, { x: e.x, y: e.y });
      growBox(box, { x: e.x + e.w, y: e.y + e.h });
      break;
    case 'circle':
    case 'arc':
      growBox(box, { x: e.c.x - e.r, y: e.c.y - e.r });
      growBox(box, { x: e.c.x + e.r, y: e.c.y + e.r });
      break;
    case 'text':
      growBox(box, e.at);
      growBox(box, { x: e.at.x + e.text.length * e.h * 0.6, y: e.at.y + e.h });
      break;
    case 'block':
      // xấp xỉ: block chuẩn ~2000mm; scale áp vào. Đủ cho zoom-extents.
      growBox(box, { x: e.at.x - 1200 * Math.abs(e.sx), y: e.at.y - 1200 * Math.abs(e.sy) });
      growBox(box, { x: e.at.x + 1200 * Math.abs(e.sx), y: e.at.y + 1200 * Math.abs(e.sy) });
      break;
    case 'hatch':
      e.points.forEach((p) => growBox(box, p));
      break;
    case 'ellipse': {
      // bao hình chặt của ellipse xoay: nửa-rộng = √(rx²cos²θ + ry²sin²θ), nửa-cao tương tự.
      const rot = e.rot ?? 0;
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      const hw = Math.hypot(e.rx * cos, e.ry * sin);
      const hh = Math.hypot(e.rx * sin, e.ry * cos);
      growBox(box, { x: e.c.x - hw, y: e.c.y - hh });
      growBox(box, { x: e.c.x + hw, y: e.c.y + hh });
      break;
    }
    case 'arrow':
      e.path.forEach((p) => growBox(box, p));
      break;
    case 'zone':
      zoneBoundaryPoints(e).forEach((p) => growBox(box, p));
      break;
    case 'room':
      e.boundary.forEach((p) => growBox(box, p));
      break;
  }
  return box;
}

/** Bao hình toàn bản vẽ; null nếu rỗng. */
export function docBox(doc: Doc): Box | null {
  if (!doc.entities.length) return null;
  const box: Box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const e of doc.entities) {
    const b = entityBox(e);
    if (Number.isFinite(b.minX)) {
      box.minX = Math.min(box.minX, b.minX);
      box.minY = Math.min(box.minY, b.minY);
      box.maxX = Math.max(box.maxX, b.maxX);
      box.maxY = Math.max(box.maxY, b.maxY);
    }
  }
  return Number.isFinite(box.minX) ? box : null;
}

/* ───────────────────────── viewport (world mm ↔ screen px) ───────────────────────── */

/** scale = px trên mỗi mm; pan = vị trí px của gốc toạ độ (world 0,0) trên canvas. */
export interface Viewport {
  scale: number;
  panX: number;
  panY: number;
}

export function worldToScreen(v: Viewport, w: Pt): Pt {
  return { x: w.x * v.scale + v.panX, y: -w.y * v.scale + v.panY };
}

export function screenToWorld(v: Viewport, s: Pt): Pt {
  return { x: (s.x - v.panX) / v.scale, y: (v.panY - s.y) / v.scale };
}

/** Zoom quanh 1 điểm màn hình (giữ điểm world dưới con trỏ cố định). */
export function zoomAt(v: Viewport, screen: Pt, factor: number, min = 0.002, max = 20): Viewport {
  const w = screenToWorld(v, screen);
  const scale = Math.max(min, Math.min(max, v.scale * factor));
  return { scale, panX: screen.x - w.x * scale, panY: screen.y + w.y * scale };
}

/** Fit bao hình vào khung (Zoom Extents) với lề. */
export function fitBox(box: Box, width: number, height: number, pad = 60): Viewport {
  const bw = Math.max(1, box.maxX - box.minX);
  const bh = Math.max(1, box.maxY - box.minY);
  const scale = Math.min((width - pad * 2) / bw, (height - pad * 2) / bh);
  const cx = (box.minX + box.maxX) / 2;
  const cy = (box.minY + box.maxY) / 2;
  return { scale, panX: width / 2 - cx * scale, panY: height / 2 + cy * scale };
}

/**
 * M0 fix (docs/RESEARCH-TECHNICAL-DRAWING-PIPELINE.md §1.6/§4) — tỉ lệ "1:N" THẬT suy ra từ
 * `fitBox()` cho 1 khổ giấy cụ thể, dùng để khoá lỗi khung tên ghi tỉ lệ gõ tay không khớp tỉ lệ
 * in thật. N làm tròn: nguyên nếu ≥10, 1 chữ số thập phân nếu <10 (bản vẽ rất nhỏ/khổ rất lớn).
 * KHÔNG phải `suggestScale()` kiến trúc chuẩn của M1 (chưa duyệt, xem §2.2) — đây chỉ là con số
 * auto-fit thật đúng với những gì `fitBox()` sẽ dùng khi xuất PDF, không neo vào tập 1:20/50/100/…
 */
export function fitScaleLabel(box: Box | null, paperMm: [number, number], margin: number): string {
  const b = box ?? { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };
  const { scale } = fitBox(b, paperMm[0], paperMm[1], margin);
  if (!Number.isFinite(scale) || scale <= 0) return '1:100';
  const n = 1 / scale;
  const rounded = n >= 10 ? Math.round(n) : Math.round(n * 10) / 10;
  return `1:${rounded}`;
}

/* ───────────────────────── NC-13 (docs/nc/NC-13-multisheet-autodesk-2026-08-03.md) —
   Sheet/Viewport2D kiểu Autodesk (model space ↔ paper space) ─────────────────────────
   BƯỚC 1 (2026-08-03) — CHỈ KHAI KIỂU. Chưa ai dùng: `CadSheets.tsx` vẫn hoán store theo
   `Doc[]` như cũ (mỗi sheet 1 Doc riêng), KHÔNG đụng. Hai type dưới đây mô tả mô hình ĐÍCH
   (§3 NC-13): MỘT Doc duy nhất (đúng luật K1 — một nguồn, xem SO-KIEM-TONG.md §6d) + N Sheet
   NHẸ (chỉ metadata) mỗi Sheet có 1+ Viewport2D LÀ CỬA SỔ soi vào đúng Doc đó, không giữ bản
   sao hình học. Xem `lib/cad/sheet-migrate.ts` (BƯỚC 2) cho bộ chuyển từ mô hình cũ sang đây. */

/** Khung tên tối thiểu — field nào chưa có giá trị thì để chuỗi rỗng, KHÔNG optional (khớp §3:
 * mọi Sheet đều CÓ khung tên, chỉ là có thể trống, không phải "có Sheet không có khung tên"). */
export interface SheetTitleBlock {
  project: string;
  drawnBy: string;
  date: string;
  revision: string;
}

/**
 * Ô nhìn TRÊN GIẤY — soi vào Doc, KHÔNG chứa bản sao hình học (đúng nguyên lý Autodesk §1 NC-13:
 * "giấy không bao giờ giữ bản sao hình học"). Sửa Doc → mọi Viewport2D đang soi vào chỗ đó tự
 * đổi theo, vì chỉ lưu toạ độ nhìn chứ không lưu entity.
 */
export interface Viewport2D {
  id: string;
  /** vị trí + kích thước ô nhìn TRÊN TỜ GIẤY, mm giấy (gốc trên-trái, khớp quy ước layout PDF
   * hiện có — KHÁC trục Y-up của world mm bên dưới, cố ý: đây là toạ độ GIẤY không phải WORLD). */
  rectOnPaper: { x: number; y: number; w: number; h: number };
  /** điểm world (mm, Y-up, cùng hệ `Doc.entities`) đặt ở TÂM ô nhìn — "nhìn vào chỗ nào của Doc". */
  centerMm: Pt;
  /** TỈ LỆ IN — N của "1:N" (giống `Doc.printScale`/`STANDARD_SCALES`, KHÔNG phải zoom màn hình,
   * KHÔNG phải phân số 1/N — lưu thẳng N, vd 100 nghĩa là 1:100). */
  scale: number;
  locked: boolean;
  /** tắt/bật lớp riêng cho ô này (kiểu Revit view filter) — khoá = `Layer.id`, `false` = ẩn ở
   * viewport NÀY thôi (không đụng `Layer.visible` chung của Doc). Thiếu key = theo Layer chung. */
  layerOverrides?: Record<string, boolean>;
}

/**
 * MỘT TỜ trong bộ hồ sơ — metadata NHẸ (vài trăm byte), không ôm Doc/undo nào (đây là điểm khác
 * mô hình cũ `IdfSheetData` ở `idf.ts`, vốn mỗi sheet giữ nguyên 1 `Doc` — xem NC-13 §2 "Hậu quả
 * kéo theo"). Không giới hạn số Sheet (`MAX_SHEETS` đã gỡ hẳn ở D2 đợt 8, 04/08).
 */
export interface Sheet {
  id: string;
  name: string;
  /** số hiệu tờ hiển thị trên khung tên, vd "A-01" — KHÁC `id` (id là khoá kỹ thuật, number là
   * chữ người dùng gõ/đánh số lại tuỳ ý, có thể trùng tạm thời khi đang sắp xếp lại thứ tự). */
  number: string;
  paper: PaperKey;
  orientation: PaperOrientation;
  titleBlock: SheetTitleBlock;
  viewports: Viewport2D[];
}
