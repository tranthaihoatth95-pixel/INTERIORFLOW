/**
 * lib/present-editor/boq-group.ts — B6 (`docs/PHIEU-TRINH-BOQ-EDITOR.md`): GROUP + SUBTOTAL =
 * SUMMARY-BAR. Nhóm các dòng `BoqRow` đã tính theo TẦNG (`Base.storey` của entity — `lib/cad/
 * model.ts:162`) — spec §6 gốc còn xin nhóm theo "phòng/zone" nhưng `HatchEntity` KHÔNG có
 * `roomId` (đã kiểm code thật, xem §B phiếu) nên v1 CHỈ nhóm theo tầng.
 *
 * (04/08, mở rộng theo chỉ đạo trực tiếp) — nhóm theo PHÒNG nay THÊM VÀO như 1 lựa chọn song song
 * (`groupBoqRowsByRoom`/`groupBoqRows(mode)`), KHÔNG thay thế nhóm theo tầng. Vì `HatchEntity` vẫn
 * không mang `roomId` thật, phép gán "hatch này thuộc phòng nào" LÀ SUY ĐOÁN — tái dùng đúng cỗ
 * máy dò phòng đã có (`findRoomLabels`/`pointInPolygon`, `lib/cad/standards/checker.ts` +
 * `lib/cad/hatch.ts`), KHÔNG viết engine hình học mới: tâm mỗi vùng tô nằm TRONG biên phòng đã dò
 * (`findHatchBoundary`) → gán chắc chắn; không phòng nào chứa tâm đó (hay dự án chưa dò được biên)
 * → rơi về phòng có NHÃN GẦN NHẤT, đánh dấu `inferred:true` để UI lộ mặt (đúng luật cờ suy đoán
 * `SPEC-TANG-DU-LIEU-CAU-KIEN` L4 — không giả vờ chắc chắn).
 *
 * THUẦN — không đọc override/IDB; nhận `rows` (đã hoặc chưa áp override, không quan trọng với hàm
 * này) + `doc` để tra storey/phòng theo entityIds. CẤM cho công thức đọc subtotal (bẫy Airtable,
 * §6 — đây chỉ là số hiển thị, không phải cell sống cho B7/B11 tham chiếu).
 *
 * Import TƯƠNG ĐỐI (không `@/...`) — sửa cùng lúc phát hiện (04/08): file này CÓ `.test.ts` chạy
 * qua `sucrase-node` thẳng (không qua webpack của Next nên KHÔNG hiểu alias `@/`) — bản trên
 * `main` trước đó dùng `@/lib/cad/model` nên `npm test`/`sucrase-node` thật ra ĐÃ LỖI
 * `MODULE_NOT_FOUND` từ trước (đã kiểm: `git show HEAD:lib/present-editor/boq-group.ts` vẫn dùng
 * alias) dù báo cáo commit trước ghi "27/27 pass" — sửa theo đúng quy ước sibling file cùng vai
 * trò `boq-overrides.ts` (import tương đối, có test, chạy thật được).
 */
import type { Doc, Pt } from '../cad/model';
import { pointInPolygon } from '../cad/hatch';
import { findRoomLabels } from '../cad/standards/checker';
import type { BoqRow } from '../boq/model';

export type BoqGroupMode = 'storey' | 'room';

export interface BoqGroup<R extends BoqRow = BoqRow> {
  key: string;
  label: string;
  /** true = dòng này có entityIds vắt qua NHIỀU tầng khác nhau — hiếm, KHÔNG chia đôi số, chỉ
   * đánh dấu để UI hiện rõ "nhiều tầng" thay vì âm thầm gộp sai nhóm. */
  multiStorey: boolean;
  /** true = nhóm gán bằng SUY ĐOÁN (nhóm theo phòng, khi tâm vùng tô không rơi trong biên phòng
   * nào — rơi về nhãn gần nhất) — UI PHẢI lộ badge, không giấu. Luôn `false` cho nhóm theo tầng
   * (storey là field khai báo tay, không suy đoán). */
  inferred: boolean;
  rows: R[];
  subtotalM2: number;
  subtotalAmount: number;
}

export const NO_STOREY_LABEL = 'Chưa gán tầng';
export const MULTI_STOREY_LABEL = 'Nhiều tầng';
const NO_STOREY_KEY = '__none__';
const MULTI_STOREY_KEY = '__multi__';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** 06/08 (G-M3-09): `subtotalM2` là DIỆN TÍCH — chỉ cộng dòng `kind:'area'`. Từ khi `computeBoq`
 * sinh cả dòng ĐẾM (cái/bộ), cộng thẳng `row.m2` sẽ ra con số "18 cái + 24,6 m² = 42,6 m²", vô
 * nghĩa và không ai phát hiện. Dòng đếm vẫn nằm trong nhóm, vẫn cộng vào `subtotalAmount` (tiền
 * thì cộng chung được) — chỉ không cộng vào ô m². Dòng cũ/dòng test không khai `kind` ⇒ coi như
 * 'area' (giữ nguyên hành vi trước 06/08, không hồi quy). */
function areaOf<R extends BoqRow>(row: R): number {
  return row.kind === 'count' ? 0 : row.m2;
}

function rowStoreyGroup(entityIds: string[], storeyById: Map<string, string | undefined>): { key: string; label: string; multi: boolean } {
  const storeys = new Set(entityIds.map((id) => storeyById.get(id) || ''));
  if (storeys.size > 1) return { key: MULTI_STOREY_KEY, label: MULTI_STOREY_LABEL, multi: true };
  const only = storeys.values().next().value ?? '';
  if (!only) return { key: NO_STOREY_KEY, label: NO_STOREY_LABEL, multi: false };
  return { key: only, label: only, multi: false };
}

/** Nhóm `rows` theo tầng — thứ tự nhóm = thứ tự GẶP LẦN ĐẦU trong `rows` (ổn định, không phụ
 * thuộc thứ tự duyệt Map nội bộ). Σ `subtotalAmount` các nhóm LUÔN = tổng `thanhTien` của toàn bộ
 * `rows` truyền vào (phép chia đúng nghĩa "partition", không hàm nào cộng thiếu/thừa — N3). */
export function groupBoqRowsByStorey<R extends BoqRow>(rows: R[], doc: Doc): BoqGroup<R>[] {
  const storeyById = new Map(doc.entities.map((e) => [e.id, e.storey]));
  const order: string[] = [];
  const groups = new Map<string, BoqGroup<R>>();

  for (const row of rows) {
    const { key, label, multi } = rowStoreyGroup(row.entityIds, storeyById);
    let g = groups.get(key);
    if (!g) {
      g = { key, label, multiStorey: multi, inferred: false, rows: [], subtotalM2: 0, subtotalAmount: 0 };
      groups.set(key, g);
      order.push(key);
    }
    g.rows.push(row);
    g.subtotalM2 = round2(g.subtotalM2 + areaOf(row));
    g.subtotalAmount += row.thanhTien;
  }

  return order.map((k) => groups.get(k) as BoqGroup<R>);
}

export const NO_ROOM_LABEL = 'Chưa gán phòng';
export const MULTI_ROOM_LABEL = 'Nhiều phòng';
const NO_ROOM_KEY = '__no-room__';
const MULTI_ROOM_KEY = '__multi-room__';

function polygonCentroid(poly: Pt[]): Pt {
  let sx = 0;
  let sy = 0;
  for (const p of poly) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / poly.length, y: sy / poly.length };
}

function dist2(a: Pt, b: Pt): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

interface RoomAssign {
  key: string;
  label: string;
  inferred: boolean;
}

/** Gán 1 điểm (tâm vùng tô) vào phòng — TRONG biên phòng đã dò ⇒ chắc chắn; không phòng nào
 * chứa ⇒ phòng có nhãn GẦN NHẤT, `inferred:true`. `rooms` rỗng (dự án chưa có nhãn phòng nào) ⇒
 * "Chưa gán phòng", không suy đoán mù (không có gì để suy đoán TỪ). */
function assignRoom(centroid: Pt, rooms: ReturnType<typeof findRoomLabels>): RoomAssign {
  for (const room of rooms) {
    if (room.poly && pointInPolygon(centroid, room.poly)) {
      return { key: room.name, label: room.name, inferred: false };
    }
  }
  if (!rooms.length) return { key: NO_ROOM_KEY, label: NO_ROOM_LABEL, inferred: false };
  let nearest = rooms[0];
  let best = dist2(centroid, nearest.at);
  for (const room of rooms.slice(1)) {
    const d = dist2(centroid, room.at);
    if (d < best) { best = d; nearest = room; }
  }
  return { key: nearest.name, label: nearest.name, inferred: true };
}

function rowRoomGroup(entityIds: string[], pointById: Map<string, Pt>, rooms: ReturnType<typeof findRoomLabels>): { key: string; label: string; multi: boolean; inferred: boolean } {
  const assigns = entityIds
    .map((id) => pointById.get(id))
    .filter((p): p is Pt => !!p)
    .map((p) => assignRoom(p, rooms));

  if (!assigns.length) return { key: NO_ROOM_KEY, label: NO_ROOM_LABEL, multi: false, inferred: false };
  const keys = new Set(assigns.map((a) => a.key));
  if (keys.size > 1) return { key: MULTI_ROOM_KEY, label: MULTI_ROOM_LABEL, multi: true, inferred: true };
  return { key: assigns[0].key, label: assigns[0].label, multi: false, inferred: assigns[0].inferred };
}

/** Nhóm `rows` theo PHÒNG (suy đoán — xem docstring đầu file). Σ subtotal luôn khớp tổng, cùng
 * bất biến N3 như `groupBoqRowsByStorey`. */
export function groupBoqRowsByRoom<R extends BoqRow>(rows: R[], doc: Doc): BoqGroup<R>[] {
  const rooms = findRoomLabels(doc);
  // ĐIỂM ĐẠI DIỆN của mỗi entity để hỏi "nằm trong phòng nào": vùng tô → tâm đa giác (như cũ);
  // MÓN RỜI (`BlockEntity`, 06/08 G-M3-09) → chính điểm đặt `at`. Không thêm món rời vào đây thì
  // mọi dòng ghế/bàn rơi hết vào "Chưa gán phòng" dù bản vẽ có nhãn phòng đầy đủ — dùng CHUNG
  // `assignRoom` sẵn có, không viết cỗ máy dò phòng thứ hai.
  const pointById = new Map<string, Pt>();
  for (const e of doc.entities) {
    // hatch 0 đỉnh (dữ liệu hỏng) → BỎ, không set: `polygonCentroid` sẽ ra NaN và `pointInPolygon`
    // với NaN im lặng trả false ⇒ dòng rơi nhóm sai mà không ai biết (giữ đúng guard cũ).
    if (e.type === 'hatch') { if (e.points.length > 0) pointById.set(e.id, polygonCentroid(e.points)); }
    else if (e.type === 'block') pointById.set(e.id, e.at);
  }

  const order: string[] = [];
  const groups = new Map<string, BoqGroup<R>>();

  for (const row of rows) {
    const { key, label, multi, inferred } = rowRoomGroup(row.entityIds, pointById, rooms);
    let g = groups.get(key);
    if (!g) {
      g = { key, label, multiStorey: multi, inferred, rows: [], subtotalM2: 0, subtotalAmount: 0 };
      groups.set(key, g);
      order.push(key);
    }
    g.rows.push(row);
    g.subtotalM2 = round2(g.subtotalM2 + areaOf(row));
    g.subtotalAmount += row.thanhTien;
  }

  return order.map((k) => groups.get(k) as BoqGroup<R>);
}

/** Điểm vào chung cho UI — chọn hàm nhóm theo `mode` (segmented control Tầng ↔ Phòng). */
export function groupBoqRows<R extends BoqRow>(rows: R[], doc: Doc, mode: BoqGroupMode): BoqGroup<R>[] {
  return mode === 'room' ? groupBoqRowsByRoom(rows, doc) : groupBoqRowsByStorey(rows, doc);
}
