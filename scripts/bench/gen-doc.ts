/**
 * scripts/bench/gen-doc.ts — sinh `Doc` LỚN tất định cho bench (phiếu `hieu-nang-do.md` mục ④.1).
 *
 * Lưới phòng W×H (cùng khuôn `denseDoc()` của `lib/cad/hatch-index.test.ts` — "lưới phòng, mỗi
 * phòng N món đồ" đã là bộ sinh dữ liệu ĐƯỢC CHẤP NHẬN trong repo này cho bench hatch), mở rộng
 * thêm loại entity để khớp mô tả phiếu "hỗn hợp tường/phòng/block/hatch/dim tỉ lệ thật":
 *
 *   mỗi phòng = 4 tường HatchEntity (poché, dải WALL_T mm ra NGOÀI biên phòng — đúng cách lệnh
 *   WALL của app tô đặc) + 1 RoomEntity (biên đã duyệt) + 1 nhãn TextEntity (chữ hoa, cùng tên
 *   RoomEntity — thực tế bản vẽ có cả hai, `findRoomLabels` vẫn quét toàn bộ TEXT bất kể) + 2
 *   BlockEntity nội thất (id thật từ `lib/cad/furniture.ts`) + 1 DimEntity dọc tường nam.
 *   ⇒ 9 entity/phòng. `bestGrid()` chọn lưới cols×rows gần N mục tiêu nhất.
 *
 * ~2% tường "nam" (1 trong `OPS_EVERY` phòng) mang `Base.ops` 2 bậc (boolean khoét lỗ + arrayLinear
 * lặp) — mô phỏng cấu kiện có modifier, KHÔNG đại trà (thực tế modifier stack chỉ dùng cho cấu
 * kiện đặc biệt — cầu thang, vách nan chớp — không phải mọi bức tường). ĐÚNG 1 tường (phòng cuối
 * cùng của lưới, cố định — không phụ thuộc rand) mang `Base.recipe` 10 bước cho bench evalRecipe.
 *
 * TẤT ĐỊNH: `mulberry32` seed cố định (KHÔNG `Math.random`) — cùng (targetEntities, seed) luôn ra
 * `Doc` giống hệt nhau, byte-for-byte qua `exportIdf`.
 */
import type {
  Doc,
  Entity,
  HatchEntity,
  BlockEntity,
  RoomEntity,
  TextEntity,
  DimEntity,
  RectEntity,
  BuildOp,
  BuildRecipe,
  RoomKind,
} from '../../lib/cad/model';
import { DEFAULT_LAYERS } from '../../lib/cad/model';

/** PRNG tất định (Mulberry32) — KHÔNG Math.random, đúng ràng buộc ⑤ của phiếu. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ENTITIES_PER_ROOM = 9; // 4 hatch tường + 1 room + 1 text + 2 block + 1 dim
export const ROOM_W = 4000;
export const ROOM_H = 3500;
export const GAP = 1200; // hành lang giữa các phòng — "mặt bằng lớn" nhiều phòng, không phải 1 khối đặc
const WALL_T = 100;
const OPS_EVERY = 50; // 1/50 phòng ≈ 2% — tường có modifier ops (boolean + arrayLinear)

const BLOCK_IDS = ['sofa2', 'coffeeTable', 'bedS', 'wardrobe', 'desk', 'toilet', 'dining4', 'nightstand'] as const;
const ROOM_KINDS: RoomKind[] = ['bedroom', 'living', 'office', 'kitchen'];

function bestGrid(targetEntities: number): { cols: number; rows: number } {
  const roomsWanted = Math.max(1, Math.round(targetEntities / ENTITIES_PER_ROOM));
  let best = { cols: 1, rows: roomsWanted, diff: Infinity };
  for (let cols = 1; cols <= roomsWanted; cols++) {
    const rows = Math.max(1, Math.round(roomsWanted / cols));
    const diff = Math.abs(cols * rows - roomsWanted);
    if (diff < best.diff) best = { cols, rows, diff };
  }
  return { cols: best.cols, rows: best.rows };
}

export interface GenDocMeta {
  targetEntities: number;
  actualEntities: number;
  cols: number;
  rows: number;
  rooms: number;
  wallHatches: number;
  roomEntities: number;
  blocks: number;
  dims: number;
  texts: number;
  cutters: number;
  /** id các HatchEntity tường mang `ops` 2 bậc (boolean + arrayLinear). */
  opsWallIds: string[];
  /** id HatchEntity tường mang `recipe` 10 bước — null nếu lưới quá nhỏ (< OPS_EVERY phòng). */
  recipeWallId: string | null;
}

export interface GenDocResult {
  doc: Doc;
  meta: GenDocMeta;
}

export function genDoc(targetEntities: number, seed = 20260813): GenDocResult {
  const rand = mulberry32(seed);
  const { cols, rows } = bestGrid(targetEntities);
  const layers = DEFAULT_LAYERS.map((l) => ({ ...l }));
  const entities: Entity[] = [];
  let uid = 0;
  const nextId = (p: string) => `${p}${uid++}`;

  const opsWallIds: string[] = [];
  let recipeWallId: string | null = null;
  let cutterCount = 0;

  const totalRooms = cols * rows;
  let roomIdx = 0;

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x0 = i * (ROOM_W + GAP);
      const y0 = j * (ROOM_H + GAP);
      const x1 = x0 + ROOM_W;
      const y1 = y0 + ROOM_H;
      roomIdx += 1;

      const southId = nextId('w');
      const wallDefs: { id: string; pts: { x: number; y: number }[] }[] = [
        { id: southId, pts: [{ x: x0 - WALL_T, y: y0 - WALL_T }, { x: x1 + WALL_T, y: y0 - WALL_T }, { x: x1 + WALL_T, y: y0 }, { x: x0 - WALL_T, y: y0 }] },
        { id: nextId('w'), pts: [{ x: x0 - WALL_T, y: y1 }, { x: x1 + WALL_T, y: y1 }, { x: x1 + WALL_T, y: y1 + WALL_T }, { x: x0 - WALL_T, y: y1 + WALL_T }] },
        { id: nextId('w'), pts: [{ x: x0 - WALL_T, y: y0 }, { x: x0, y: y0 }, { x: x0, y: y1 }, { x: x0 - WALL_T, y: y1 }] },
        { id: nextId('w'), pts: [{ x: x1, y: y0 }, { x: x1 + WALL_T, y: y0 }, { x: x1 + WALL_T, y: y1 }, { x: x1, y: y1 }] },
      ];

      const isRecipeRoom = roomIdx === totalRooms && totalRooms >= OPS_EVERY;
      const isOpsRoom = !isRecipeRoom && roomIdx % OPS_EVERY === 0;

      let southOps: BuildOp[] | undefined;
      let southRecipe: BuildRecipe | undefined;

      if (isOpsRoom || isRecipeRoom) {
        const cutW = ROOM_W * 0.2;
        const cutX0 = x0 + ROOM_W * 0.4;
        const cutterId = nextId('cut');
        cutterCount += 1;
        const cutter: RectEntity = { id: cutterId, type: 'rect', layer: 'l-wall', x: cutX0, y: y0 - WALL_T, w: cutW, h: WALL_T };
        entities.push(cutter);

        if (isOpsRoom) {
          southOps = [
            { op: 'boolean', kind: 'subtract', withRef: cutterId },
            { op: 'arrayLinear', n: 3, dx: 0, dy: 0, dz: 60 },
          ];
          opsWallIds.push(southId);
        } else {
          const midX = (x0 + x1) / 2;
          const midY = (y0 + y1) / 2;
          const cutterId2 = nextId('cut');
          cutterCount += 1;
          entities.push({ id: cutterId2, type: 'rect', layer: 'l-wall', x: cutX0, y: y0 - WALL_T, w: cutW * 0.6, h: WALL_T });
          southRecipe = {
            steps: [
              { id: 's1', enabled: true, op: { op: 'extrude', h: 0 } },
              { id: 's2', enabled: true, op: { op: 'boolean', kind: 'subtract', withRef: cutterId } },
              { id: 's3', enabled: true, op: { op: 'arrayLinear', n: 2, dx: 0, dy: 0, dz: 80 } },
              { id: 's4', enabled: true, op: { op: 'mirror', axis: 'x', atMm: midX } },
              { id: 's5', enabled: true, op: { op: 'boolean', kind: 'subtract', withRef: cutterId2 } },
              { id: 's6', enabled: true, op: { op: 'arrayLinear', n: 2, dx: 0, dy: 0, dz: 40 } },
              { id: 's7', enabled: true, op: { op: 'mirror', axis: 'y', atMm: midY } },
              { id: 's8', enabled: true, op: { op: 'arrayRadial', n: 3, centerXMm: midX, centerYMm: midY, sweepDeg: 180 } },
              { id: 's9', enabled: true, op: { op: 'arrayLinear', n: 2, dx: 0, dy: 0, dz: 20 } },
              { id: 's10', enabled: true, op: { op: 'mirror', axis: 'y', atMm: midY + 50 } },
            ],
          };
          recipeWallId = southId;
        }
      }

      for (const w of wallDefs) {
        const h: HatchEntity = {
          id: w.id,
          type: 'hatch',
          layer: 'l-wall',
          points: w.pts,
          solid: true,
          pattern: 'SOLID',
          ...(w.id === southId && southOps ? { ops: southOps } : {}),
          ...(w.id === southId && southRecipe ? { recipe: southRecipe } : {}),
        };
        entities.push(h);
      }

      const boundary = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
      const roomName = `PHÒNG ${String(roomIdx).padStart(4, '0')}`;
      entities.push({
        id: nextId('r'),
        type: 'room',
        layer: 'l-wall',
        elementType: 'space',
        boundary,
        name: roomName,
        roomKind: ROOM_KINDS[Math.floor(rand() * ROOM_KINDS.length)],
      } as RoomEntity);

      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;
      entities.push({ id: nextId('t'), type: 'text', layer: 'l-text', at: { x: cx, y: cy }, text: roomName, h: 250 } as TextEntity);

      for (let k = 0; k < 2; k++) {
        const blockId = BLOCK_IDS[(roomIdx * 2 + k) % BLOCK_IDS.length];
        const fx = x0 + 400 + rand() * (ROOM_W - 800);
        const fy = y0 + 400 + rand() * (ROOM_H - 800);
        entities.push({ id: nextId('b'), type: 'block', layer: 'l-furniture', block: blockId, at: { x: fx, y: fy }, rot: 0, sx: 1, sy: 1 } as BlockEntity);
      }

      entities.push({ id: nextId('d'), type: 'dim', layer: 'l-dim', a: { x: x0, y: y0 }, b: { x: x1, y: y0 }, off: -300 } as DimEntity);
    }
  }

  const doc: Doc = { entities, layers, markups: [], photos: [] };
  const count = (t: Entity['type']) => entities.filter((e) => e.type === t).length;

  return {
    doc,
    meta: {
      targetEntities,
      actualEntities: entities.length,
      cols,
      rows,
      rooms: totalRooms,
      wallHatches: count('hatch'), // cutter là type 'rect', không lẫn vào đếm hatch
      roomEntities: count('room'),
      blocks: count('block'),
      dims: count('dim'),
      texts: count('text'),
      cutters: cutterCount,
      opsWallIds,
      recipeWallId,
    },
  };
}

/** Bbox lưới (mm) — dùng để rải điểm hỏi tất định trong `bench-2d.ts` mà không phải quét lại
 * toàn bộ entity. */
export function gridBboxMm(meta: GenDocMeta): { minX: number; minY: number; maxX: number; maxY: number } {
  return {
    minX: -WALL_T,
    minY: -WALL_T,
    maxX: meta.cols * (ROOM_W + GAP),
    maxY: meta.rows * (ROOM_H + GAP),
  };
}
