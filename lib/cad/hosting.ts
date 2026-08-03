/**
 * lib/cad/hosting.ts — "cửa/cửa sổ HOSTED" (`docs/SO-KIEM-TONG.md` §7, dòng "Cửa/cửa sổ hosted").
 * Đúng kinh Revit: cửa/cửa sổ là CON của đúng 1 tường — không phải khối rời đặt cạnh tường.
 *
 * MỘT hàm trung tâm `syncHostedOpenings(doc)` — RECONCILE lại toàn bộ quan hệ host mỗi khi Doc
 * đổi (thêm/sửa/xoá entity bất kỳ), thay vì viết riêng logic add/update/delete rải rác 3 nơi
 * trong `store.ts`. Idempotent: gọi lại nhiều lần trên CÙNG Doc luôn ra CÙNG kết quả — an toàn gọi
 * sau MỌI thao tác sửa Doc mà không cần biết "cái gì vừa đổi".
 *
 * KHÔNG viết đường dựng hình 3D thứ hai (K1): cutter sinh ra ở đây vẫn là 1 `Entity` bình thường
 * trong `Doc` (đúng khuôn `cutHoleInWall`, `lib/cad/commands.ts`), tường vẫn mang `ops[]` boolean
 * NC-12 y hệt — `lib/three/cad-to-obj.ts` `cutterPositionsMm`/`buildOpCutters` (ĐÃ CÓ) đọc thẳng,
 * chỉ cần dạy nó thêm 2 việc: đọc `elevationMm` làm z0 (thay vì luôn 0) + chấp nhận cutter dạng
 * `PolylineEntity` (đa giác đã xoay đúng góc cửa/cửa sổ) bên cạnh `RectEntity` cũ.
 *
 * Cutter do file này quản mang id tiền tố CỐ ĐỊNH `opening-<blockId>` — tách bạch với cutter do
 * người dùng tự tay "Khoét hốc" (`newId('cutter')`, không có tiền tố này): `syncHostedOpenings`
 * chỉ đụng tới op/cutter mang tiền tố của MÌNH, không bao giờ động vào cutter tay của người dùng.
 *
 * THUẦN (không React/DOM) — test: node_modules/.bin/sucrase-node lib/cad/hosting.test.ts
 */
import type { BlockEntity, Doc, Entity, HatchEntity, Pt } from './model';
import { blockToWorld } from './model';
import { pointInPolygon } from './hatch';
import { BLOCK_MAP } from './furniture';
import { effectiveBlockSize, WALL_LAYER_ID } from './shape-interactions';

/** tiền tố id cutter do file này quản — xem docstring đầu file. */
export const OPENING_CUTTER_PREFIX = 'opening-';

export function openingCutterId(blockId: string): string {
  return `${OPENING_CUTTER_PREFIX}${blockId}`;
}

/** cao độ ĐÁY/ĐỈNH hốc mặc định theo loại — số nghề phổ thông VN (đã dùng ở nhiều spec khác,
 * KHÔNG phải số bịa riêng cho file này): cửa luôn từ sàn (sillMm=0) cao 2100; cửa sổ có bệ 900,
 * cùng đỉnh 2100 (cao thoáng 1200mm). Chưa đọc theo variant/kích thước khai riêng — đủ cho "khoét
 * lỗ thật" hôm nay, tinh chỉnh theo từng cửa/cửa sổ cụ thể là việc UI sau (đúng tinh thần N5). */
export const OPENING_ELEVATION: Record<'door' | 'window', { sillMm: number; headMm: number }> = {
  door: { sillMm: 0, headMm: 2100 },
  window: { sillMm: 900, headMm: 2100 },
};

/** bề dày tường mặc định khi không đo được từ hình học (mm) — cỡ tường gạch 220 phổ thông. */
export const DEFAULT_WALL_THICKNESS_MM = 220;

/** cutter nhô thêm mỗi mặt tường (mm) để CSG subtract cắt sạch xuyên hết bề dày thật, không kẹt
 * mặt phẳng trùng khít (coplanar) — thực hành CSG chuẩn, không phải số tuỳ hứng. */
export const WALL_CUT_MARGIN_MM = 100;

/** block nào là cửa/cửa sổ hosted — đọc thẳng `BlockDef.hosted` (nguồn DUY NHẤT, xem furniture.ts). */
export function isHostableBlock(blockId: string): 'door' | 'window' | undefined {
  return BLOCK_MAP[blockId]?.hosted;
}

function isWallHatch(e: Entity): e is HatchEntity {
  if (e.type !== 'hatch') return false;
  if (e.elementType !== undefined) return e.elementType === 'wall';
  return e.layer === WALL_LAYER_ID;
}

/** Bề dày tường suy từ hình học poché — cạnh NGẮN NHẤT của tứ giác (đúng cho quad `wallSegment()`
 * sinh: 2 cạnh dài = chiều dài đoạn tường, 2 cạnh ngắn = bề dày). Tường vẽ tay không phải tứ giác
 * chuẩn → rơi về mặc định, không đoán bừa hình dạng lạ. */
export function estimateWallThicknessMm(points: Pt[]): number {
  if (points.length < 3) return DEFAULT_WALL_THICKNESS_MM;
  let minLen = Infinity;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len > 1e-6 && len < minLen) minLen = len;
  }
  return Number.isFinite(minLen) ? minLen : DEFAULT_WALL_THICKNESS_MM;
}

/**
 * Tường nào (hatch poché) đang CHỨA điểm `at` — dùng để tự suy `hostId`, KHÔNG bắt người dùng
 * chọn tay. Chỉ xét hatch tường (đã đùn khối 3D thật) — tường vẽ tay bằng LINE đơn không có khối
 * 3D nào để host cửa/cửa sổ vào (giới hạn THẬT của hạ tầng 3D hôm nay — `cad-to-obj.ts` chỉ đùn
 * `wallHatches`, không đụng LineEntity). `wallsById` truyền vào để tái dùng map đã dựng sẵn (tránh
 * quét lại toàn Doc mỗi block khi `syncHostedOpenings` gọi lặp) — bỏ trống thì tự quét.
 */
export function inferWallHost(at: Pt, doc: Doc, wallsById?: Map<string, HatchEntity>): string | undefined {
  if (wallsById) {
    for (const [id, w] of wallsById) if (pointInPolygon(at, w.points)) return id;
    return undefined;
  }
  for (const e of doc.entities) {
    if (isWallHatch(e) && pointInPolygon(at, e.points)) return e.id;
  }
  return undefined;
}

/**
 * Cutter (đa giác ĐÃ XOAY đúng góc block, khớp `blockToWorld` — cùng công thức `blockFootprint`/
 * `blockWorldCorners` dùng ở nơi khác, không tự chế biến hình mới) cho 1 cửa/cửa sổ trên `wall`:
 * rộng = bề rộng THẬT của block (đúng variant đang chọn), sâu = bề dày tường + biên nhô 2 mặt,
 * cao độ đáy/đỉnh theo `OPENING_ELEVATION[kind]`. Id CỐ ĐỊNH theo block (không `newId()`) để gọi
 * lại nhiều lần (block di chuyển) chỉ THAY hình học, không đẻ cutter mới mỗi lần.
 */
export function buildOpeningCutter(block: BlockEntity, wall: HatchEntity, kind: 'door' | 'window'): Entity {
  const { sillMm, headMm } = OPENING_ELEVATION[kind];
  const width = effectiveBlockSize(block).w;
  const depth = estimateWallThicknessMm(wall.points) + WALL_CUT_MARGIN_MM * 2;
  const hw = width / 2;
  const hd = depth / 2;
  const local: Pt[] = [
    { x: -hw, y: -hd },
    { x: hw, y: -hd },
    { x: hw, y: hd },
    { x: -hw, y: hd },
  ];
  const points = local.map((p) => blockToWorld(p, { at: block.at, rot: block.rot, sx: 1, sy: 1 }));
  return {
    id: openingCutterId(block.id),
    type: 'polyline',
    layer: wall.layer,
    points,
    closed: true,
    elevationMm: sillMm,
    heightMm: headMm - sillMm,
  };
}

/**
 * RECONCILE toàn bộ quan hệ host trong `doc` — gọi sau MỌI thao tác thêm/sửa/xoá entity (store.ts
 * `addEntities`/`updateEntities`/`deleteSelected`/`removeIds`). Làm ĐÚNG 3 việc, idempotent:
 *  1. Mỗi block cửa/cửa sổ → suy lại `hostId` từ vị trí HIỆN TẠI (tự gán/tự xoá, không giữ giá
 *     trị cũ nếu block đã di chuyển ra khỏi tường hoặc tường đã bị xoá).
 *  2. Mỗi tường → dựng lại ĐÚNG tập op boolean "của mình" (tiền tố `opening-`) khớp các cửa/cửa sổ
 *     đang host trên nó; MỌI op khác (cutter tay "Khoét hốc") giữ nguyên, không đụng.
 *  3. Cutter (`opening-<blockId>`) → thêm/thay hình học mới/xoá theo đúng danh sách còn host.
 */
export function syncHostedOpenings(doc: Doc): Doc {
  const wallsById = new Map<string, HatchEntity>();
  for (const e of doc.entities) if (isWallHatch(e)) wallsById.set(e.id, e);

  const hostableBlocks = doc.entities.filter(
    (e): e is BlockEntity => e.type === 'block' && !!isHostableBlock(e.block),
  );

  const hostByBlockId = new Map<string, string>();
  const cuttersById = new Map<string, Entity>();
  for (const block of hostableBlocks) {
    const hostId = inferWallHost(block.at, doc, wallsById);
    if (!hostId) continue;
    hostByBlockId.set(block.id, hostId);
    const wall = wallsById.get(hostId)!;
    const kind = isHostableBlock(block.block)!;
    cuttersById.set(block.id, buildOpeningCutter(block, wall, kind));
  }

  const nextEntities: Entity[] = [];
  for (const e of doc.entities) {
    if (e.type === 'block' && isHostableBlock(e.block)) {
      const hostId = hostByBlockId.get(e.id);
      if (hostId === e.hostId) {
        nextEntities.push(e);
      } else if (hostId) {
        nextEntities.push({ ...e, hostId });
      } else {
        const { hostId: _drop, ...rest } = e;
        nextEntities.push(rest as Entity);
      }
      continue;
    }
    if (isWallHatch(e)) {
      const manualOps = (e.ops ?? []).filter(
        (op) => !(op.op === 'boolean' && op.withRef.startsWith(OPENING_CUTTER_PREFIX)),
      );
      const managedOps = hostableBlocks
        .filter((b) => hostByBlockId.get(b.id) === e.id)
        .map((b) => ({ op: 'boolean' as const, kind: 'subtract' as const, withRef: openingCutterId(b.id) }));
      const nextOps = [...manualOps, ...managedOps];
      if (nextOps.length) nextEntities.push({ ...e, ops: nextOps });
      else {
        const { ops: _drop, ...rest } = e;
        nextEntities.push(rest as Entity);
      }
      continue;
    }
    if (e.id.startsWith(OPENING_CUTTER_PREFIX)) continue; // cutter cũ do mình quản — chèn lại bản mới ở dưới (nếu còn host)
    nextEntities.push(e);
  }
  for (const cutter of cuttersById.values()) nextEntities.push(cutter);

  return { ...doc, entities: nextEntities };
}

/**
 * Mở rộng tập id sắp xoá để gồm CẢ cửa/cửa sổ con của mọi tường trong `ids` (+ cutter của chúng) —
 * "Xoá tường → xoá theo cửa/cửa sổ con" (đúng kinh Revit). Suy lại `inferWallHost` TƯƠI (không tin
 * `block.hostId` cũ) — đúng cả khi gọi trước lúc `syncHostedOpenings` từng chạy lần nào.
 */
export function expandDeleteWithHostedChildren(ids: Iterable<string>, doc: Doc): Set<string> {
  const toDelete = new Set(ids);
  for (const e of doc.entities) {
    if (e.type !== 'block' || !isHostableBlock(e.block)) continue;
    const hostId = inferWallHost(e.at, doc);
    if (hostId && toDelete.has(hostId)) {
      toDelete.add(e.id);
      toDelete.add(openingCutterId(e.id));
    }
  }
  return toDelete;
}
