/**
 * lib/cad/room.ts — G-M2-04 · PHÒNG là cấu kiện thật (`RoomEntity`, model.ts), và hai mã cùng
 * gốc tự đóng theo: G-M2-03 (nhãn m² phải SỐNG — nay mọi ống kính tính từ `boundary` qua
 * `roomAreaM2`, không lưu số chết) · G-M1-05 (diện tích sàn TỪ HÌNH HỌC — nay là tổng lòng
 * phòng đã dò, xem `planAreaCrossCheck` method 'roomSum' ở `dxf-plan.ts`).
 *
 * KHÔNG viết engine dò biên mới — tái dùng đúng bộ đã có và đã test:
 *   - `findRoomLabels(doc)` (`standards/checker.ts`): nhãn TEXT toàn-hoa + biên dò bằng
 *     phân hoạch mặt phẳng (`buildHatchFaceIndex`/`pickHatchFace`, `hatch.ts`).
 *   - `polygonArea` (`hatch.ts`), `ringKey` (`poche.ts` — so hai biên bất biến điểm đầu/chiều).
 *
 * BA LUẬT của spec §6.2/§6.3 (SPEC-TANG-DU-LIEU-CAU-KIEN) mã hoá ở đây:
 *   1. Biên ĐÓNG BĂNG lúc tạo — `detectRooms` trả PROPOSAL, UI duyệt rồi mới addEntities
 *      (một chiều, có undo qua snapshot của store, xem được trước khi chốt).
 *   2. Tường đổi KHÔNG tự sửa biên (L5) — `staleRoomBoundaries` chỉ BÁO, kèm biên mới đề xuất;
 *      người dùng bấm cập nhật thì UI gọi updateEntities.
 *   3. Phòng dò KHÔNG ra biên phải LỘ MẶT (K3) — `detectRooms` trả danh sách `unresolved` kèm
 *      lý do, không im lặng rơi khỏi tổng (đúng vế thứ hai của G-M2-04).
 *
 * THUẦN — không React/store. Test: node_modules/.bin/sucrase-node lib/cad/room.test.ts
 */
import type { Doc, Entity, Pt, RoomEntity, TextEntity } from './model';
import { roomCentroid } from './model';
import { findRoomLabels } from './standards/checker';
import { polygonArea } from './hatch';
import { ringKey } from './poche';
import { newId } from './store';

/** Diện tích lòng phòng (m²) — MỘT nguồn cho mọi ống kính, tính từ biên, không lưu số chết. */
export function roomAreaM2(room: Pick<RoomEntity, 'boundary'>): number {
  if (room.boundary.length < 3) return 0;
  return polygonArea(room.boundary) / 1e6;
}

/** Nhãn hiển thị của phòng trên bản vẽ — TÊN + m² SỐNG (G-M2-03: số đi ra từ boundary, không
 * phải chữ gõ tay). Ống kính 2D (`render.ts` drawRoom) và PDF cùng gọi hàm này — một chỗ format. */
export function roomLabel(room: Pick<RoomEntity, 'boundary' | 'name'>): { title: string; area: string } {
  const m2 = roomAreaM2(room);
  return { title: room.name, area: m2 > 0 ? `${m2.toFixed(2).replace('.', ',')} m²` : '— m²' };
}

export interface RoomProposal {
  /** RoomEntity sẽ được thêm nếu người dùng duyệt mục này. */
  room: RoomEntity;
  /** id TextEntity nhãn cũ sẽ bị GỠ khi duyệt — phòng tự vẽ nhãn sống, giữ chữ cũ là hai số
   * mâu thuẫn cạnh nhau (đúng ca G-M2-03 đo được). Undo trả lại nguyên trạng (store snapshot). */
  replacesTextId: string;
  areaM2: number;
}

export interface RoomUnresolved {
  /** id TextEntity nhãn không dò được biên. */
  textId: string;
  name: string;
  at: Pt;
  /** Lý do bằng chữ người dùng — hiện thẳng lên panel, KHÔNG im lặng (K3). */
  reason: string;
}

export interface RoomDetection {
  proposals: RoomProposal[];
  unresolved: RoomUnresolved[];
  /** Số phòng đã là RoomEntity từ trước (bị bỏ qua, không đề xuất trùng). */
  alreadyRooms: number;
}

/**
 * Dò phòng từ nhãn TEXT + biên kín — TRẢ ĐỀ XUẤT, không tự ghi vào Doc (§6.3: một chiều, xem
 * trước khi chốt). Nhãn đã nằm TRONG biên của một RoomEntity sẵn có thì bỏ qua (idempotent —
 * bấm "Nhận diện phòng" lần 2 không đẻ phòng trùng).
 */
export function detectRooms(doc: Doc): RoomDetection {
  const existing = doc.entities.filter((e): e is RoomEntity => e.type === 'room');
  const existingKeys = new Set(existing.map((r) => ringKey(r.boundary)));
  const texts = new Map<string, TextEntity>();
  for (const e of doc.entities) if (e.type === 'text') texts.set(`${e.at.x}|${e.at.y}|${e.text.trim()}`, e);

  const proposals: RoomProposal[] = [];
  const unresolved: RoomUnresolved[] = [];
  let alreadyRooms = 0;

  for (const info of findRoomLabels(doc)) {
    // tìm lại TextEntity gốc của nhãn (findRoomLabels trả name/at, không trả id)
    const src = texts.get(`${info.at.x}|${info.at.y}|${info.name}`);
    if (!src) continue; // nhãn không truy được entity gốc — bỏ qua an toàn, không bịa
    if (!info.poly || info.poly.length < 3) {
      unresolved.push({
        textId: src.id,
        name: info.name,
        at: info.at,
        reason: 'Không dò được biên kín quanh nhãn này — tường quanh phòng chưa khép vòng, hoặc nhãn đặt ngoài phòng. Phòng này KHÔNG có trong tổng diện tích.',
      });
      continue;
    }
    if (existingKeys.has(ringKey(info.poly))) { alreadyRooms += 1; continue; }
    const room: RoomEntity = {
      id: newId('e'),
      type: 'room',
      layer: src.layer,
      elementType: 'space',
      boundary: info.poly.map((p) => ({ x: p.x, y: p.y })),
      name: info.name,
      roomKind: info.kind,
      labelPos: { ...info.at },
    };
    proposals.push({ room, replacesTextId: src.id, areaM2: polygonArea(info.poly) / 1e6 });
  }
  return { proposals, unresolved, alreadyRooms };
}

/** Một phòng có biên ĐÃ CŨ so với tường hiện tại (kèm biên mới đề xuất). */
export interface StaleRoomBoundary {
  roomId: string;
  name: string;
  /** m² theo biên đang lưu (số đang hiện). */
  frozenAreaM2: number;
  /** m² theo tường hiện tại. */
  currentAreaM2: number;
  /** Biên mới dò được — UI bấm "Cập nhật biên" thì áp qua updateEntities. */
  newBoundary: Pt[];
}

/**
 * G-M2-03 vế "không ai bắt lỗi" — soi phòng nào biên đóng băng đã LỆCH so với tường hiện tại.
 * CHỈ BÁO, không tự sửa (L5). Dò lại bằng chính bộ máy `findRoomLabels` (phân hoạch mặt phẳng
 * một lần cho cả Doc) rồi so `ringKey` với biên đang lưu; phòng dò không ra biên mới (tường đã
 * mở toang) KHÔNG coi là stale — không có gì đáng tin hơn để đề xuất (K3).
 */
export function staleRoomBoundaries(doc: Doc): StaleRoomBoundary[] {
  const rooms = doc.entities.filter((e): e is RoomEntity => e.type === 'room');
  if (!rooms.length) return [];
  // Doc "giả nhãn": mỗi phòng đóng góp 1 text tại labelPos/centroid để findRoomLabels dò biên
  // tại đúng chỗ đó — tái dùng nguyên bộ lọc tường/trục của checker, không nhân bản.
  const probes: Entity[] = rooms.map((r) => ({
    id: `__room-probe-${r.id}`,
    type: 'text',
    layer: r.layer,
    at: r.labelPos ?? roomCentroid(r),
    text: `PROBE ${r.id.toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
    h: 250,
  } as Entity));
  const probeDoc: Doc = {
    ...doc,
    entities: [...doc.entities.filter((e) => e.type !== 'room' && e.type !== 'text'), ...probes],
  };
  const found = new Map(findRoomLabels(probeDoc).map((i) => [`${i.at.x}|${i.at.y}`, i]));
  const out: StaleRoomBoundary[] = [];
  for (const r of rooms) {
    const at = r.labelPos ?? roomCentroid(r);
    const info = found.get(`${at.x}|${at.y}`);
    if (!info?.poly || info.poly.length < 3) continue; // tường mở toang — không đề xuất bừa
    if (ringKey(info.poly) === ringKey(r.boundary)) continue;
    out.push({
      roomId: r.id,
      name: r.name,
      frozenAreaM2: roomAreaM2(r),
      currentAreaM2: polygonArea(info.poly) / 1e6,
      newBoundary: info.poly.map((p) => ({ x: p.x, y: p.y })),
    });
  }
  return out;
}

/** Tổng diện tích lòng phòng của cả bản vẽ (m²) — người tiêu thụ: `planAreaCrossCheck`
 * method 'roomSum' (G-M1-05) + StatusBar. 0 khi chưa nhận diện phòng nào. */
export function totalRoomAreaM2(doc: Doc): number {
  let sum = 0;
  for (const e of doc.entities) if (e.type === 'room') sum += roomAreaM2(e);
  return sum;
}
