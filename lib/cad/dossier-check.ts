/**
 * lib/cad/dossier-check.ts — BƯỚC 2 quy trình "CAD thực tế" (21/07, yêu cầu chủ dự án — KTS):
 * sau khi có HIỆN TRẠNG (import DXF/DWG hoặc bản vẽ đang mở), CHECK HỒ SƠ đủ thông tin trước khi
 * nhập đề bài → AI gợi ý option bố trí. HÀM THUẦN — chỉ đọc `doc`, trả checklist + danh sách
 * phòng thật, KHÔNG sửa gì (cùng "hiến pháp" với standards/checker.ts).
 *
 * THIẾT KẾ THỰC DỤNG cho bản vẽ 2D mức sơ phác DD (KHÔNG phải BIM — không đòi thông tin 3D
 * không tồn tại trong DXF 2D):
 *  - Mặt bằng: tường khép kín tạo ≥1 phòng — TÁI DÙNG dò biên DCEL qua findRoomLabels (phòng có
 *    nhãn) + suggestRoomNames (phòng kín chưa nhãn, pick-point = block nội thất bên trong).
 *    KHÔNG viết thuật toán dò biên mới.
 *  - Nhãn tên phòng + DimEntity: có/không.
 *  - Cao độ / Mặt cắt: quét TextEntity theo pattern ký hiệu (±0.000, +3.600, CĐ, CỐT, EL., FFL /
 *    "MẶT CẮT", "SECTION", "A-A"). TRUNG THỰC: file DXF mặt bằng thường KHÔNG chứa mặt cắt/cao
 *    độ — thiếu chỉ là CẢNH BÁO ('warn', "vẫn bố trí được nhưng nên bổ sung"), KHÔNG chặn cứng
 *    luồng. Chỉ 'missing' khi thiếu thứ bắt buộc để bố trí (không có phòng khép kín).
 *
 * `rooms` trả về = các phòng CÓ NHÃN + CÓ BIÊN KÍN (RoomInfo.poly từ checker) — đây là danh sách
 * "phòng thật" mà AiBriefPanel feed cho generateLayoutOptions({ targetRooms }) để option đặt nội
 * thất VÀO phòng hiện trạng thay vì vẽ phòng mới cạnh bản vẽ. Phòng kín chưa nhãn KHÔNG vào danh
 * sách này (không có tên để map với đề bài) — checklist nhắc dùng "Gợi ý tên phòng" trước.
 */

import type { Doc, Entity, Pt } from './model';
import { findRoomLabels } from './standards/checker';
import { suggestRoomNames } from './room-autolabel';
import { BLOCK_MAP } from './furniture';
import { effectiveBlockSize } from './shape-interactions';

export type DossierStatus = 'ok' | 'warn' | 'missing';

export interface DossierItem {
  id: 'plan-rooms' | 'room-labels' | 'dims' | 'elevation' | 'section';
  /** tên hạng mục hiển thị trong checklist. */
  item: string;
  status: DossierStatus;
  note: string;
}

/** 1 phòng THẬT của hiện trạng (có nhãn + biên kín) — đủ dữ liệu để đặt nội thất vào. */
export interface ExistingRoomTarget {
  name: string;
  /** vị trí nhãn (pick-point đã dò ra biên) — dùng zoom-to. */
  at: Pt;
  areaM2: number;
  /** hình bao lòng phòng (AABB của đa giác biên trong — mặt trong tường), mm.
   * Khớp shape `interior` mà placeFurniture (ai-assist.ts) nhận. */
  interior: { ix0: number; iy0: number; ix1: number; iy1: number };
  /** AABB đồ nội thất ĐANG CÓ SẴN trong phòng ({x,y}=tâm, ex/ey=kích thước đầy đủ, mm) — feed
   * TargetRoom.obstacles để solver né đồ hiện trạng thay vì đặt chồng lên (phòng thật thường
   * KHÔNG trống, khác phòng tự sinh). */
  obstacles: { x: number; y: number; ex: number; ey: number }[];
}

export interface DossierResult {
  items: DossierItem[];
  rooms: ExistingRoomTarget[];
  /** true = có ≥1 phòng thật (nhãn + biên kín) — generateLayoutOptions có thể bố trí VÀO đó. */
  canLayoutInSitu: boolean;
}

/* Pattern ký hiệu CAO ĐỘ trên TextEntity — bắt các dạng phổ biến trong hồ sơ VN:
 * "±0.000" · "+3.600"/"−0.450" (bắt buộc 3 số lẻ để không nhầm text thường) · "CĐ" · "CAO ĐỘ" ·
 * "CỐT" · "EL." / "EL +3.6" · "FFL" (finished floor level). */
const ELEVATION_RES: RegExp[] = [
  /±\s*\d+[.,]\d{3}/,
  /[+\-−]\s*\d+[.,]\d{3}/,
  /\bCĐ\b/u,
  /CAO\s*ĐỘ/iu,
  /\bCỐT\b/iu,
  /\bEL\.?\s*[+\-−±]?\d/i,
  /\bFFL\b/i,
];

/* Pattern nhãn MẶT CẮT: "MẶT CẮT ..." / "SECTION ..." / text đứng riêng "A-A", "B-B" (cùng chữ
 * cái 2 đầu — đúng quy ước ký hiệu vết cắt). */
const SECTION_RES: RegExp[] = [/MẶT\s*CẮT/iu, /\bSECTION\b/i];
const SECTION_MARK_RE = /^([A-Z])\s*[-–]\s*\1$/;

function interiorOf(poly: Pt[]): { ix0: number; iy0: number; ix1: number; iy1: number } {
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
  return { ix0: minX, iy0: minY, ix1: maxX, iy1: maxY };
}

/** Check hồ sơ hiện trạng — hàm thuần, tất định, chỉ đọc doc. */
export function checkDossier(doc: Doc): DossierResult {
  const items: DossierItem[] = [];
  const empty = doc.entities.length === 0;

  // ── Mặt bằng: phòng khép kín (tái dùng DCEL qua findRoomLabels + suggestRoomNames) ──
  const labeled = findRoomLabels(doc);
  const withBoundary = labeled.filter((r) => r.areaM2 !== null && r.poly && r.poly.length >= 3);
  // phòng kín CHƯA nhãn — chỉ dò được khi có block nội thất bên trong làm pick-point (giới hạn
  // đã ghi ở đầu room-autolabel.ts, chấp nhận: không đoán mò phòng trống).
  const unlabeled = empty ? [] : suggestRoomNames(doc);
  const closedCount = withBoundary.length + unlabeled.length;

  if (empty) {
    items.push({ id: 'plan-rooms', item: 'Mặt bằng — phòng khép kín', status: 'missing', note: 'Bản vẽ trống — import hồ sơ CAD hoặc vẽ hiện trạng trước.' });
  } else if (closedCount >= 1) {
    items.push({ id: 'plan-rooms', item: 'Mặt bằng — phòng khép kín', status: 'ok', note: `Dò được ${closedCount} phòng có biên kín (${withBoundary.length} có nhãn, ${unlabeled.length} chưa nhãn).` });
  } else {
    items.push({ id: 'plan-rooms', item: 'Mặt bằng — phòng khép kín', status: 'missing', note: 'Có hình học nhưng không dò được phòng khép kín nào — kiểm tra tường hở/thiếu nhãn + nội thất làm điểm dò.' });
  }

  // ── Nhãn tên phòng ──
  if (withBoundary.length >= 1) {
    items.push({ id: 'room-labels', item: 'Nhãn tên phòng', status: 'ok', note: `${withBoundary.length} phòng có nhãn tên: ${withBoundary.map((r) => r.name).join(', ')}.` });
  } else if (unlabeled.length >= 1) {
    items.push({ id: 'room-labels', item: 'Nhãn tên phòng', status: 'warn', note: 'Có phòng kín nhưng CHƯA nhãn tên — dùng "Gợi ý tên phòng" gắn nhãn trước; AI cần tên phòng để map đề bài vào đúng phòng.' });
  } else {
    items.push({ id: 'room-labels', item: 'Nhãn tên phòng', status: empty ? 'missing' : 'warn', note: 'Chưa có nhãn tên phòng (TEXT chữ hoa trong phòng).' });
  }

  // ── Kích thước (DimEntity) ──
  const hasDim = doc.entities.some((e) => e.type === 'dim');
  items.push(
    hasDim
      ? { id: 'dims', item: 'Kích thước (DIM)', status: 'ok', note: 'Bản vẽ có đường kích thước.' }
      : { id: 'dims', item: 'Kích thước (DIM)', status: empty ? 'missing' : 'warn', note: 'Chưa thấy đường kích thước — vẫn bố trí được nhưng nên bổ sung trước khi ra hồ sơ.' },
  );

  // ── Cao độ + Mặt cắt: quét TextEntity ──
  const texts = doc.entities.filter((e): e is Extract<Entity, { type: 'text' }> => e.type === 'text');
  const elevHit = texts.find((t) => ELEVATION_RES.some((re) => re.test(t.text)));
  items.push(
    elevHit
      ? { id: 'elevation', item: 'Cao độ', status: 'ok', note: `Thấy ký hiệu cao độ: "${elevHit.text.trim()}".` }
      : { id: 'elevation', item: 'Cao độ', status: 'warn', note: 'Chưa thấy ký hiệu cao độ (±0.000 / +3.600 / CĐ / CỐT / EL.) — mặt bằng 2D thường không có; vẫn bố trí được nhưng nên bổ sung.' },
  );

  const secHit = texts.find((t) => SECTION_RES.some((re) => re.test(t.text)) || SECTION_MARK_RE.test(t.text.trim().toUpperCase()));
  items.push(
    secHit
      ? { id: 'section', item: 'Mặt cắt', status: 'ok', note: `Thấy nhãn mặt cắt: "${secHit.text.trim()}".` }
      : { id: 'section', item: 'Mặt cắt', status: 'warn', note: 'Chưa thấy mặt cắt (MẶT CẮT / SECTION / A-A) — file mặt bằng thường không kèm; vẫn bố trí được nhưng nên bổ sung hồ sơ.' },
  );

  // ── Danh sách phòng thật cho bước 3 (bố trí VÀO hiện trạng) ──
  // Đồ nội thất có sẵn: mọi BlockEntity có TÂM nằm trong lòng phòng → AABB (xoay/scale đã tính)
  // làm obstacle cho solver. Block cửa/cửa sổ ('Kiến trúc') đặt NGAY TRÊN tường — tâm nằm ngoài
  // AABB lòng phòng nên tự loại, không cần lọc riêng.
  const blockEnts = doc.entities.filter((e): e is Extract<Entity, { type: 'block' }> => e.type === 'block');
  const rooms: ExistingRoomTarget[] = withBoundary.map((r) => {
    const interior = interiorOf(r.poly as Pt[]);
    const obstacles = blockEnts
      .filter((e) => e.at.x >= interior.ix0 && e.at.x <= interior.ix1 && e.at.y >= interior.iy0 && e.at.y <= interior.iy1)
      .map((e) => {
        const { w, h } = effectiveBlockSize(e, BLOCK_MAP);
        const ww = w * Math.abs(e.sx || 1);
        const hh = h * Math.abs(e.sy || 1);
        const c = Math.abs(Math.cos(e.rot || 0));
        const s = Math.abs(Math.sin(e.rot || 0));
        return { x: e.at.x, y: e.at.y, ex: ww * c + hh * s, ey: ww * s + hh * c };
      });
    return { name: r.name, at: r.at, areaM2: r.areaM2 as number, interior, obstacles };
  });

  return { items, rooms, canLayoutInSitu: rooms.length > 0 };
}
