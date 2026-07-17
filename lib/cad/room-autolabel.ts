/**
 * lib/cad/room-autolabel.ts — Sprint 4, VIỆC 2: Auto-label phòng (C1 thật).
 *
 * NGUYÊN TẮC (cùng "hiến pháp" với lib/cad/standards/checker.ts): hàm ở đây CHỈ ĐỌC `doc` và
 * TRẢ VỀ đề xuất — KHÔNG BAO GIỜ tự chèn TEXT vào bản vẽ. UI (CadEditor.tsx) hiện đề xuất ra 1
 * panel, user phải bấm "Áp dụng" thì mới thật sự addEntity() một TextEntity mới.
 *
 * checker.findRoomLabels()/classifyRoom() CHỈ phân loại phòng đã có sẵn nhãn TEXT người dùng gõ
 * tay. Việc này làm NGƯỢC: dò các phòng CÓ BIÊN KÍN (findHatchBoundary, tái dùng y hệt checker)
 * nhưng CHƯA có nhãn TEXT nào, rồi đề xuất tên dựa vào (a) loại BlockEntity (đồ nội thất) đặt
 * bên trong phòng đó, và (b) khi không có đồ nội thất nào giúp phân loại — diện tích + tỉ lệ
 * hình dạng (bounding box) làm phỏng đoán yếu hơn.
 *
 * Giới hạn đã biết: cách dò phòng "chưa có nhãn" ở đây dùng vị trí (`at`) của mỗi BlockEntity
 * (TRỪ nhóm 'Kiến trúc' — cửa đi/cửa sổ, xem lý do tại chỗ lọc bên dưới) làm pick-point cho
 * findHatchBoundary — nghĩa là 1 phòng HOÀN TOÀN TRỐNG (không đồ nội thất/cầu thang/thiết bị)
 * sẽ KHÔNG được đề xuất (không có điểm nào để dò biên) — chấp nhận được, cùng triết lý "không đo
 * được thì bỏ qua, không đoán mò" của checker.ts.
 *
 * Đã sửa sau verify UI thật (Sprint 4): ban đầu dùng CẢ block cửa đi/cửa sổ làm pick-point —
 * nhưng cửa nằm NGAY TẠI ô mở trên tường (kẹp giữa 2 nét tường đôi) nên pick-point của nó
 * thường rơi vào 1 mặt kín rất nhỏ của CHÍNH hình học tường (khe nách cửa), không phải mặt
 * phòng — sinh hàng loạt đề xuất "Hành lang"/"WC-Kho" giả với diện tích <2m² trùng vị trí từng
 * cửa. Loại nhóm 'Kiến trúc' khỏi pick-point candidates giải quyết dứt điểm.
 */

import type { Doc, Entity, Pt } from './model';
import { findHatchBoundary, polygonArea } from './hatch';
import { BLOCK_MAP } from './furniture';
import type { BlockGroup } from './shared-types';

export interface RoomNameSuggestion {
  /** vị trí đặt TEXT nếu user bấm áp dụng (centroid biên phòng). */
  at: Pt;
  /** Tên SẼ ĐƯỢC CHÈN nếu user áp dụng — LUÔN khớp quy ước nhãn phòng của app (chữ hoa, khớp
   * `ROOM_NAME_RE`/`classifyRoom` trong checker.ts) để sau khi áp dụng, phòng này được
   * findRoomLabels/GFA/room-count/checkStandards nhận diện đúng như mọi nhãn phòng khác — KHÔNG
   * phải chỉ là text hiển thị suông. */
  suggestedName: string;
  areaM2: number;
  /** 'furniture' = suy từ đồ nội thất bên trong; 'shape' = suy yếu hơn từ diện tích/tỉ lệ. */
  basis: 'furniture' | 'shape';
  /** id các BlockEntity đã dùng để suy luận (rỗng nếu basis='shape') — hiển thị "vì sao" cho user. */
  evidenceBlockIds: string[];
  /** Giải thích/độ tin cậy CHỈ ĐỂ HIỂN THỊ trong panel (không phải 1 phần của TEXT sẽ chèn) —
   * vd "theo 2 đồ nội thất" hay "đoán theo diện tích/hình dạng — chưa chắc, có thể là WC/kho". */
  note: string;
}

// Nhân bản CHÍNH XÁC ngữ nghĩa checker.ROOM_NAME_RE — hằng đó không export, tránh sửa checker.ts
// ngoài phạm vi (chỉ thêm `export` cho classifyRoom/RoomKind, xem checker.ts). suggestedName LUÔN
// phải khớp regex này (test bên dưới enforce) — nếu không, TEXT chèn vào sẽ "câm" với
// findRoomLabels/GFA/room-count dù nhìn giống 1 nhãn phòng.
const ROOM_NAME_RE = /^[\p{Lu}0-9\s.+]+$/u;

/** Nhân bản checker.wallLikeDoc (không export) — lọc 'dim'/'text'/layer trục khỏi hình học dùng
 * để dò biên, cùng lý do: các entity này KHÔNG phải tường thật, vô tình cắt ngang phòng. */
function wallLikeDoc(doc: Doc): Doc {
  const axisLayerIds = new Set(doc.layers.filter((l) => l.name === 'Trục' || l.id === 'l-axis').map((l) => l.id));
  return {
    layers: doc.layers,
    entities: doc.entities.filter((e) => e.type !== 'dim' && e.type !== 'text' && !axisLayerIds.has(e.layer)),
  };
}

/** Nhóm BlockDef.group → tên phòng đề xuất — CHỈ nhóm nào thật sự đặc trưng 1 loại phòng
 * (bỏ qua 'Kiến trúc'/'Cầu thang'/'Thiết bị' — cửa/cửa sổ/cầu thang/máy lạnh/quạt trần xuất
 * hiện ở NHIỀU loại phòng, không giúp phân loại).
 *
 * QUAN TRỌNG: mọi giá trị ở đây PHẢI (a) khớp ROOM_NAME_RE (chữ hoa/số/khoảng trắng/.+/ — KHÔNG
 * dấu "/", ngoặc, gạch ngang…) và (b) chứa đúng từ khoá mà `classifyRoom()` (checker.ts) nhận
 * diện, để sau khi user áp dụng, phòng được xếp loại + tính vào GFA/room-count NHƯ MỌI NHÃN
 * PHÒNG KHÁC — không phải chỉ hiển thị suông. Đối chiếu classifyRoom(): 'NGỦ', 'WC'/'VỆ SINH',
 * 'BẾP', 'KHÁCH', 'VĂN PHÒNG'/'LÀM VIỆC'. Không có kind riêng cho "phòng ăn" trong classifyRoom
 * hiện tại → 'PHÒNG ĂN' sẽ rơi vào kind 'other' (đếm được nhưng không có rule diện tích riêng) —
 * chấp nhận được, KHÔNG tự thêm kind mới vào checker.ts (ngoài phạm vi Sprint 4 này).
 */
const GROUP_TO_ROOM_NAME: Partial<Record<BlockGroup, string>> = {
  'Phòng ngủ': 'PHÒNG NGỦ',
  'Vệ sinh': 'WC',
  'Bếp': 'BẾP',
  'Phòng khách': 'PHÒNG KHÁCH',
  'Phòng ăn': 'PHÒNG ĂN',
  'Làm việc': 'PHÒNG LÀM VIỆC',
};

// Thứ tự phân định khi 2 loại đồ nội thất có SỐ LƯỢNG bằng nhau trong cùng 1 phòng (vd 1 giường
// + 1 sofa trong phòng đa năng nhỏ) — ưu tiên loại "đặc trưng nặng" (giường/bếp/vệ sinh) trước
// loại nội thất chung chung hơn (sofa phòng khách có thể xuất hiện ở phòng đa năng).
const TIEBREAK_ORDER = ['PHÒNG NGỦ', 'WC', 'BẾP', 'PHÒNG KHÁCH', 'PHÒNG ĂN', 'PHÒNG LÀM VIỆC'];

function centroidOf(poly: Pt[]): Pt {
  let x = 0;
  let y = 0;
  for (const p of poly) {
    x += p.x;
    y += p.y;
  }
  const n = Math.max(1, poly.length);
  return { x: x / n, y: y / n };
}

/** khoá canonical cho 1 đa giác biên — dùng để: (a) khử trùng nhiều block cùng rơi vào 1 phòng,
 * (b) so khớp với biên của phòng ĐÃ có nhãn TEXT (bỏ qua, không đề xuất lại). */
function polyKey(poly: Pt[]): string {
  return poly.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('|');
}

function bboxOf(poly: Pt[]): { w: number; h: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of poly) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { w: maxX - minX, h: maxY - minY };
}

/**
 * Đề xuất tên cho các phòng CÓ BIÊN KÍN nhưng CHƯA có nhãn TEXT — CHỈ TRẢ VỀ, không tự sửa doc.
 */
export function suggestRoomNames(doc: Doc): RoomNameSuggestion[] {
  const boundaryDoc = wallLikeDoc(doc);

  // 1) các phòng ĐÃ có nhãn TEXT hợp lệ → biên của chúng bị loại khỏi đề xuất (đã có tên rồi).
  const labeledKeys = new Set<string>();
  for (const e of doc.entities) {
    if (e.type !== 'text') continue;
    const s = e.text.trim();
    if (s.length < 2 || /M2|M²/i.test(s) || !ROOM_NAME_RE.test(s)) continue;
    const poly = findHatchBoundary(boundaryDoc, e.at);
    if (poly) labeledKeys.add(polyKey(poly));
  }

  // 2) gom mọi BlockEntity theo biên phòng chứa nó (pick-point = vị trí đặt block) — BỎ QUA
  // nhóm 'Kiến trúc' (cửa đi/cửa sổ): các block này đặt NGAY TẠI ô mở trên tường (giữa 2 nét
  // tường đôi), nên pick-point của chúng thường rơi vào khe tường/góc nách cửa (1 mặt kín NHỎ
  // của chính hình học tường, không phải phòng) thay vì mặt phòng thật — verify UI thật phát
  // hiện lỗi này (nhiều đề xuất "Hành lang" diện tích <2m² giả, trùng vị trí các cửa) → sửa
  // bằng cách loại nhóm 'Kiến trúc' khỏi danh sách pick-point. Đồ nội thất thật (giường/sofa/
  // bếp/tủ…) và Cầu thang/Thiết bị vẫn dùng được vì luôn đặt HẲN trong lòng phòng.
  const groups = new Map<string, { poly: Pt[]; blocks: Array<{ id: string; block: string }> }>();
  for (const e of doc.entities as Entity[]) {
    if (e.type !== 'block') continue;
    if (BLOCK_MAP[e.block]?.group === 'Kiến trúc') continue;
    const poly = findHatchBoundary(boundaryDoc, e.at);
    if (!poly || poly.length < 3) continue;
    const key = polyKey(poly);
    if (labeledKeys.has(key)) continue; // phòng này đã có nhãn — bỏ qua
    const g = groups.get(key);
    if (g) g.blocks.push({ id: e.id, block: e.block });
    else groups.set(key, { poly, blocks: [{ id: e.id, block: e.block }] });
  }

  const suggestions: RoomNameSuggestion[] = [];
  for (const { poly, blocks } of groups.values()) {
    const areaM2 = polygonArea(poly) / 1e6;
    const at = centroidOf(poly);

    // đếm theo nhóm nội thất "đặc trưng phòng" (bỏ qua Kiến trúc/Cầu thang/Thiết bị)
    const countByName = new Map<string, number>();
    const evidenceByName = new Map<string, string[]>();
    for (const b of blocks) {
      const def = BLOCK_MAP[b.block];
      if (!def) continue;
      const name = GROUP_TO_ROOM_NAME[def.group];
      if (!name) continue;
      countByName.set(name, (countByName.get(name) ?? 0) + 1);
      evidenceByName.set(name, [...(evidenceByName.get(name) ?? []), b.id]);
    }

    if (countByName.size > 0) {
      let best = '';
      let bestCount = -1;
      for (const [name, count] of countByName) {
        const better =
          count > bestCount ||
          (count === bestCount && TIEBREAK_ORDER.indexOf(name) < TIEBREAK_ORDER.indexOf(best));
        if (better) {
          best = name;
          bestCount = count;
        }
      }
      const evidence = evidenceByName.get(best) ?? [];
      suggestions.push({
        at,
        suggestedName: best,
        areaM2,
        basis: 'furniture',
        evidenceBlockIds: evidence,
        note: `theo ${evidence.length} đồ nội thất`,
      });
      continue;
    }

    // (a) không có đồ nội thất đặc trưng nào → phỏng đoán YẾU HƠN từ diện tích + tỉ lệ hình dạng.
    // suggestedName VẪN phải là 1 nhãn phòng "sạch" (khớp ROOM_NAME_RE + classifyRoom) — độ
    // KHÔNG chắc chắn của phỏng đoán này chỉ thể hiện ở `note` (hiển thị panel), không lẫn vào
    // TEXT sẽ chèn.
    const { w, h } = bboxOf(poly);
    const longSide = Math.max(w, h);
    const shortSide = Math.max(1, Math.min(w, h));
    const aspect = longSide / shortSide;
    let shapeGuess: string;
    let note: string;
    if (aspect >= 3) {
      shapeGuess = 'HÀNH LANG';
      note = 'đoán theo hình dạng dài & hẹp — chưa có đồ nội thất để xác nhận';
    } else if (areaM2 < 5) {
      shapeGuess = 'WC';
      note = 'đoán theo diện tích nhỏ — chưa có đồ nội thất để xác nhận, có thể là WC hoặc kho';
    } else {
      shapeGuess = 'PHÒNG';
      note = 'chưa xác định được loại phòng — chưa có đồ nội thất để xác nhận, chỉ đoán theo diện tích';
    }
    suggestions.push({ at, suggestedName: shapeGuess, areaM2, basis: 'shape', evidenceBlockIds: [], note });
  }

  return suggestions;
}
