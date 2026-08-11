/**
 * lib/cad/label-placer.ts — VIỆC 3 `label-ne-hinh` (docs/CHUAN-DAU-RA-NGHE.md §1 "Chữ & nhãn"):
 * nhãn KHÔNG đè hình học, KHÔNG đè nhau — máy phải né hoặc dùng leader.
 *
 * Hàm THUẦN, không DOM/jsPDF — hai nơi tiêu thụ dùng chung một định nghĩa "đè":
 *   · `lib/cad/pdf.ts` (đường XUẤT PDF) — dời nhãn phòng/chuỗi dim trước khi vẽ ra giấy,
 *     KHÔNG đụng `doc.entities` gốc (cùng triết lý `applyRealScaleToTitleBlock`).
 *   · `lib/print/export-checks.ts` (cổng CHUAN_DAU_RA) — đếm nhãn còn đè sau khi đã né.
 *
 * Thứ tự ưu tiên khi né (theo phiếu): giữ chỗ → dịch quanh vị trí gốc → leader kéo ra ngoài.
 * Giới hạn ghi rõ (không giả vờ đủ): "dịch TRONG PHÒNG" cần biên phòng thật (findHatchBoundary,
 * đắt và cần pick-point) — bản này dịch quanh vị trí gốc theo vòng 8 hướng, chưa ràng vào biên
 * phòng trừ khi caller truyền `bounds`.
 */

import type { Box, Entity, Layer, Pt } from './model';
import { entityBox } from './model';
import { classifyRoom } from './standards/checker';
import { BLOCK_MAP } from './furniture';

/* ─────────────── Gỡ jargon nội bộ khỏi chuỗi hiển thị (VIỆC 2, CHUAN-DAU-RA §1) ─────────────── */

/** Jargon nội bộ ĐÃ BẮT ĐƯỢC trên file xuất thật (11/08) — danh sách TƯỜNG MINH, không dùng
 * regex tham lam xoá nhầm chữ người dùng. Có jargon mới lọt ra file thì thêm 1 dòng ở đây. */
const INTERNAL_JARGON_RES: readonly RegExp[] = [
  /\s*\((?:đã\s+)?rà\s+công\s+năng\)/giu, // "(đã rà công năng)" — bắt trên layout.pdf 11/08
];

/** Gỡ jargon nội bộ khỏi 1 chuỗi sẽ hiển thị cho người ngoài (khung tên, bản in). */
export function stripInternalJargon(s: string): string {
  let out = s;
  for (const re of INTERNAL_JARGON_RES) out = out.replace(re, '');
  return out.replace(/\s{2,}/g, ' ').trim();
}

/* ─────────────────────────────── Hình học va chạm cơ bản ─────────────────────────────── */

/** 2 bbox có giao nhau không (chạm mép + `gap` đệm cũng tính là giao — chữ sát hình vẫn khó đọc). */
export function boxesOverlap(a: Box, b: Box, gap = 0): boolean {
  return a.minX < b.maxX + gap && b.minX < a.maxX + gap && a.minY < b.maxY + gap && b.minY < a.maxY + gap;
}

const shiftBox = (b: Box, dx: number, dy: number): Box => ({
  minX: b.minX + dx,
  minY: b.minY + dy,
  maxX: b.maxX + dx,
  maxY: b.maxY + dy,
});

const boxInside = (b: Box, bounds: Box): boolean =>
  b.minX >= bounds.minX && b.minY >= bounds.minY && b.maxX <= bounds.maxX && b.maxY <= bounds.maxY;

const boxCenter = (b: Box): Pt => ({ x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 });

/* ─────────────────────────────── avoidLabelCollision (marker) ─────────────────────────────── */

export interface LabelBoxInput {
  id: string;
  /** bbox MONG MUỐN của nhãn (world mm, Y-up như Doc). */
  box: Box;
  /** vùng được phép dịch (vd biên phòng) — thiếu = không giới hạn. */
  bounds?: Box;
  /** số vòng dịch tối đa quanh vị trí gốc (mỗi vòng 8 hướng) — mặc định 4. */
  maxRings?: number;
  /** hết chỗ dịch thì có được kéo leader ra ngoài không — mặc định true. */
  allowLeader?: boolean;
  /** có né bbox HÌNH HỌC không (nhãn phòng: có · chuỗi dim: chỉ né nhãn khác) — mặc định true. */
  avoidObstacles?: boolean;
  /** vùng nhãn leader KHÔNG được đáp vào (vd tường bao cả nhà — leader đáp trong phòng KHÁC còn
   * gây hiểu nhầm hơn là đè hình). Thiếu = leader đặt đâu cũng được miễn không đè. */
  leaderClearOf?: Box;
}

export interface PlacedLabel {
  id: string;
  /** bbox SAU khi né (bằng box gốc nếu không phải dời). */
  box: Box;
  moved: boolean;
  /** đường leader khi nhãn phải kéo ra ngoài: from = vị trí mới, to = điểm gốc nó chú thích. */
  leader?: { from: Pt; to: Pt };
}

/**
 * VIỆC 3 `label-ne-hinh` — né va chạm nhãn (marker: avoidLabelCollision). Thuần, deterministic,
 * KHÔNG mutate input. Xử lý tuần tự theo thứ tự mảng `labels` (nhãn đứng trước có quyền giữ chỗ
 * trước — caller xếp nhãn quan trọng lên đầu). Mỗi nhãn:
 *   ① giữ nguyên nếu không đè gì;
 *   ② dịch theo vòng 8 hướng bán kính tăng dần (ưu tiên lên/xuống rồi ngang/chéo — nhãn phòng
 *      dời dọc ít gây hiểu nhầm "thuộc phòng bên cạnh" hơn dời ngang);
 *   ③ `allowLeader` → đặt ra ngoài (phía trên-phải, xa dần) + leader trỏ về điểm gốc;
 *   ④ hết cách → GIỮ vị trí gốc, moved=false — cổng kiểm sẽ đếm được nhãn còn đè, không giấu.
 */
export function avoidLabelCollision(labels: LabelBoxInput[], obstacles: Box[]): PlacedLabel[] {
  const placed: PlacedLabel[] = [];
  const GAP = 20; // mm world — đệm tối thiểu giữa chữ và hình để in ra vẫn tách bạch

  for (const l of labels) {
    const avoidObs = l.avoidObstacles !== false;
    const collides = (b: Box): boolean =>
      (avoidObs && obstacles.some((o) => boxesOverlap(b, o, GAP))) ||
      placed.some((p) => boxesOverlap(b, p.box, GAP));

    // ① giữ chỗ
    if (!collides(l.box)) {
      placed.push({ id: l.id, box: l.box, moved: false });
      continue;
    }

    const h = Math.max(1, l.box.maxY - l.box.minY);
    const maxRings = l.maxRings ?? 4;
    // 8 hướng, dọc trước ngang sau (xem docstring). Bước mỗi vòng theo cỡ chữ để nhãn không
    // "bay" xa vô cớ ở vòng đầu. v2: bước 0.9h (trước 1.4h) — phòng nhỏ (WC/Bếp) bước thô sẽ
    // nhảy vọt QUA hết chỗ trống hợp lệ trong `bounds` rồi rơi nhầm xuống leader.
    const DIRS: [number, number][] = [
      [0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1],
    ];
    let found: Box | null = null;
    for (let ring = 1; ring <= maxRings && !found; ring++) {
      const step = ring * h * 0.9;
      for (const [ux, uy] of DIRS) {
        const cand = shiftBox(l.box, ux * step, uy * step);
        if (l.bounds && !boxInside(cand, l.bounds)) continue;
        if (!collides(cand)) {
          found = cand;
          break;
        }
      }
    }
    if (found) {
      placed.push({ id: l.id, box: found, moved: true });
      continue;
    }

    // ③ leader ra ngoài (v2 — trước đây trượt CỐ ĐỊNH lên trên-phải theo bội số cỡ chữ nên nhãn
    //    to bay rất xa và đâm vào chrome trang [hoa gió] — lỗi ④ soi 12/08): đặt nhãn SÁT NGOÀI
    //    `bounds` (biên phòng nếu biết, không thì chính box nhãn), thử 8 hướng — dọc/ngang trước,
    //    chéo sau — khoảng hở tăng dần, lấy ứng viên ĐẦU TIÊN không đè nhãn khác/chướng ngại
    //    (chrome trang nằm trong `obstacles` do caller truyền — leader tự né hoa gió/thước/khung tên).
    if (l.allowLeader !== false) {
      const anchor = boxCenter(l.box);
      const home = l.bounds ?? l.box;
      const CL = Math.max(h, 300); // mm world — khoảng hở tối thiểu giữa nhãn leader và biên phòng
      let done = false;
      for (let k = 1; k <= 4 && !done; k++) {
        for (const [ux, uy] of DIRS) {
          let cand = l.box;
          if (uy > 0) cand = shiftBox(cand, 0, home.maxY + k * CL - cand.minY);
          if (uy < 0) cand = shiftBox(cand, 0, home.minY - k * CL - cand.maxY);
          if (ux > 0) cand = shiftBox(cand, home.maxX + k * CL - cand.minX, 0);
          if (ux < 0) cand = shiftBox(cand, home.minX - k * CL - cand.maxX, 0);
          if (l.leaderClearOf && boxesOverlap(cand, l.leaderClearOf)) continue; // không đáp vào phòng khác
          if (placed.some((p) => boxesOverlap(cand, p.box, GAP))) continue;
          if (avoidObs && obstacles.some((o) => boxesOverlap(cand, o, GAP))) continue;
          // leader bám vào điểm trên MÉP nhãn gần anchor nhất (không còn hardcode góc dưới-trái)
          const from = {
            x: Math.min(Math.max(anchor.x, cand.minX), cand.maxX),
            y: Math.min(Math.max(anchor.y, cand.minY), cand.maxY),
          };
          placed.push({ id: l.id, box: cand, moved: true, leader: { from, to: anchor } });
          done = true;
          break;
        }
      }
      if (placed[placed.length - 1]?.id === l.id) continue;
    }

    // ④ chịu — giữ nguyên, để cổng kiểm đếm được (không âm thầm chồng lên nhãn đã đặt).
    placed.push({ id: l.id, box: l.box, moved: false });
  }
  return placed;
}

/* ────────────────── Trích nhãn/hình từ Doc — dùng chung cho pdf.ts + export-checks ────────────────── */

/** DimStyle tối thiểu mà tầng này cần — khớp `CadPdfDimStyle` (pdf.ts) nhưng không import từ đó
 * (tránh vòng: pdf.ts import file này). */
export interface LabelDimStyle {
  textHeight: number;
  dimScale: number;
}

export interface ExportLabelShift {
  dx: number;
  dy: number;
  leader?: { from: Pt; to: Pt };
  /** true = dời CẢ CỤM dim (đường dim + extension + chữ) — sinh bởi `dimOutsideRoom`. Thiếu/false
   * với text = dời chữ nhãn, với dim = chỉ dời riêng chữ (né chữ đè chữ, hành vi v1). */
  wholeDim?: boolean;
}

/** Text entity này có PHẢI nhãn phòng không: `roomType` đã chốt, hoặc chuỗi khớp quy ước nhãn
 * phòng VÀ classifyRoom nhận ra công năng ('other' loại — tránh bắt nhầm chữ khung tên/ghi chú
 * viết hoa như "DỰ ÁN"). Cùng ngữ nghĩa ROOM_NAME_RE của checker (hằng đó không export). */
const ROOM_NAME_RE = /^[\p{Lu}0-9\s.+]+$/u;
function isRoomLabel(e: Entity): boolean {
  if (e.type !== 'text') return false;
  if (e.roomType !== undefined) return true;
  const s = e.text.trim();
  return s.length >= 2 && !/M2|M²/i.test(s) && ROOM_NAME_RE.test(s) && classifyRoom(s) !== 'other';
}

/** bbox chuỗi dim ALIGNED (thẳng/nghiêng) — đúng công thức vị trí chữ của drawDimPdf (pdf.ts):
 * giữa đoạn đã offset, chữ cao `textHeight*dimScale` mm world. Radius/angular hiếm ở mặt bằng,
 * chưa né (ghi rõ, không giả vờ đủ). */
function alignedDimLabelBox(e: Extract<Entity, { type: 'dim' }>, ds: LabelDimStyle): Box | null {
  const kind = e.kind ?? 'aligned';
  if (kind !== 'aligned') return null;
  const dx = e.b.x - e.a.x;
  const dy = e.b.y - e.a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const mid = { x: (e.a.x + e.b.x) / 2 + nx * e.off, y: (e.a.y + e.b.y) / 2 + ny * e.off };
  const h = Math.max(1, ds.textHeight * ds.dimScale);
  const w = String(Math.round(len)).length * 0.6 * h;
  return { minX: mid.x - w / 2, minY: mid.y, maxX: mid.x + w / 2, maxY: mid.y + h };
}

interface DocSlice {
  entities: Entity[];
  layers: Layer[];
}

/* ─────────────────────────────── Biên phòng & tường (v2) ─────────────────────────────── */

/** Hatch có PHẢI poché tường không: `elementType:'wall'` (WallRun/P11) hoặc hatch đặc có `hostId`
 * (wallSegment neo poché vào đường bao từ lúc sinh — G-M1-08; hatch trang trí như thước tỉ lệ,
 * ký hiệu cao độ KHÔNG có hostId). Heuristic rẻ, không dò biên (`findHatchBoundary` đắt). */
function isWallHatch(e: Entity): boolean {
  if (e.type !== 'hatch') return false;
  if (e.elementType === 'wall') return true;
  return e.solid === true && e.hostId !== undefined;
}

const unionBoxes = (boxes: Box[]): Box | null => {
  if (!boxes.length) return null;
  const out: Box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const b of boxes) {
    out.minX = Math.min(out.minX, b.minX);
    out.minY = Math.min(out.minY, b.minY);
    out.maxX = Math.max(out.maxX, b.maxX);
    out.maxY = Math.max(out.maxY, b.maxY);
  }
  return out;
};

/** Even-odd ray cast — đủ cho biên phòng đơn (RoomEntity.boundary là polygon kín không tự cắt). */
function pointInPolygon(p: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/**
 * VIỆC v2 `label-ne-hinh-v2` — biên phòng cho 1 nhãn (marker: labelInRoomBounds): vùng nhãn phòng
 * ĐƯỢC PHÉP dịch, để né nhãn không trôi sang phòng bên cạnh (lỗi ③ soi 12/08).
 *   · Có `RoomEntity.boundary` chứa anchor → bbox biên đó (nguồn phòng ưu tiên, xem model.ts).
 *   · Không có (demo-plan không tạo RoomEntity) → RAY-CAST 4 hướng từ anchor vào bbox các poché
 *     tường: tường gần nhất mỗi phía = biên phòng. Rẻ (O(số tường)), đúng cho mặt bằng trực giao
 *     — nhà xiên/phòng chữ L cho bbox rộng hơn phòng thật, chấp nhận (thà rộng còn hơn dò
 *     `findHatchBoundary` đắt + cần pick-point; ghi rõ, không giả vờ đủ).
 * null = không xác định được (nhãn ngoài nhà / không có tường) — caller bỏ ràng buộc như v1.
 */
export function labelInRoomBounds(anchor: Pt, wallBoxes: Box[], envelope: Box | null, roomBoundaries: Pt[][]): Box | null {
  const PAD = 30; // mm world — nhãn không dí sát mặt tường
  for (const poly of roomBoundaries) {
    if (poly.length >= 3 && pointInPolygon(anchor, poly)) {
      const b: Box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
      for (const p of poly) {
        b.minX = Math.min(b.minX, p.x);
        b.minY = Math.min(b.minY, p.y);
        b.maxX = Math.max(b.maxX, p.x);
        b.maxY = Math.max(b.maxY, p.y);
      }
      const out = { minX: b.minX + PAD, minY: b.minY + PAD, maxX: b.maxX - PAD, maxY: b.maxY - PAD };
      return out.minX < out.maxX && out.minY < out.maxY ? out : null;
    }
  }
  if (!envelope || !wallBoxes.length) return null;
  if (anchor.x <= envelope.minX || anchor.x >= envelope.maxX || anchor.y <= envelope.minY || anchor.y >= envelope.maxY) return null;
  let left = envelope.minX;
  let right = envelope.maxX;
  let bottom = envelope.minY;
  let top = envelope.maxY;
  for (const w of wallBoxes) {
    if (w.minY <= anchor.y && anchor.y <= w.maxY) {
      if (w.minX >= anchor.x) right = Math.min(right, w.minX);
      else if (w.maxX <= anchor.x) left = Math.max(left, w.maxX);
    }
    if (w.minX <= anchor.x && anchor.x <= w.maxX) {
      if (w.minY >= anchor.y) top = Math.min(top, w.minY);
      else if (w.maxY <= anchor.y) bottom = Math.max(bottom, w.maxY);
    }
  }
  const out = { minX: left + PAD, minY: bottom + PAD, maxX: right - PAD, maxY: top - PAD };
  return out.minX < out.maxX && out.minY < out.maxY ? out : null;
}

/* ─────────────────────────────── Dời chuỗi dim ra ngoài nhà (v2) ─────────────────────────────── */

export interface DimOutsideOpts {
  /** bậc thang giữa các lớp dim (mm world) — pdf.ts truyền 8mm giấy × scaleN. */
  stepWorld: number;
  /** vùng world còn nhìn thấy trên trang giấy — dời ra ngoài vùng này là dời vào hư không → BỎ QUA
   * (đếm vào skipped, không dời bừa). Thiếu = không kiểm. */
  pageWorldBox?: Box;
  /** bbox chướng ngại ngoài nhà (hoa gió, thước, chuỗi dim sẵn có…) — lớp dim mới xếp SAU chúng. */
  obstacles?: Box[];
}

export interface DimOutsideResult {
  /** entityId → độ dời CẢ CỤM (mm world). */
  shifts: Map<string, { dx: number; dy: number }>;
  /** số dim nằm trong nhà nhưng KHÔNG dời an toàn được (xiên, hết chỗ trên giấy) — gate warn đếm. */
  skipped: number;
}

type DimSlim = Extract<Entity, { type: 'dim' }>;

/** Điểm giữa đường dim (đã offset) — đúng công thức drawDimPdf. */
function dimLinePoint(e: DimSlim): Pt {
  const dx = e.b.x - e.a.x;
  const dy = e.b.y - e.a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: (e.a.x + e.b.x) / 2 + (-dy / len) * e.off, y: (e.a.y + e.b.y) / 2 + (dx / len) * e.off };
}

/** bbox đường dim (đã offset + độ dời cụm) nới thêm cỡ chữ — làm chướng ngại cho nhãn/leader. */
function dimLineBox(e: DimSlim, textH: number, s: { dx: number; dy: number }): Box {
  const dx = e.b.x - e.a.x;
  const dy = e.b.y - e.a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const oa = { x: e.a.x + nx * e.off + s.dx, y: e.a.y + ny * e.off + s.dy };
  const ob = { x: e.b.x + nx * e.off + s.dx, y: e.b.y + ny * e.off + s.dy };
  return {
    minX: Math.min(oa.x, ob.x) - textH / 2,
    minY: Math.min(oa.y, ob.y) - textH / 2,
    maxX: Math.max(oa.x, ob.x) + textH / 2,
    maxY: Math.max(oa.y, ob.y) + textH,
  };
}

/**
 * VIỆC v2 `label-ne-hinh-v2` — chuỗi dim linear nằm TRONG lòng nhà thì dời CẢ CỤM ra ngoài mép
 * tường bao gần nhất (marker: dimOutsideRoom; CHUAN-DAU-RA §1 "Dim nằm NGOÀI hình" — lỗi ② soi
 * 12/08: chuỗi 1850/850/1700/1290/510 nằm trong phòng). Chỉ xử lý dim ALIGNED TRỰC GIAO (ngang/
 * dọc) — dim xiên trong nhà hình học không an toàn để tự dời → giữ nguyên + đếm `skipped`.
 * Cả CHUỖI (các dim cùng trục, cùng đường dim) dời chung một độ dời → giữ thẳng hàng; nhiều
 * chuỗi cùng phía xếp bậc thang `stepWorld`, bắt đầu SAU mọi chướng ngại sẵn có phía đó.
 * Dim người vẽ đã đặt ngoài nhà: KHÔNG đụng.
 */
export function dimOutsideRoom(dims: DimSlim[], envelope: Box | null, opts: DimOutsideOpts): DimOutsideResult {
  const out: DimOutsideResult = { shifts: new Map(), skipped: 0 };
  if (!envelope) return out;
  const EPS = 1;
  interface Info { e: DimSlim; axis: 'h' | 'v'; line: number; lo: number; hi: number }
  const inside: Info[] = [];
  for (const e of dims) {
    if ((e.kind ?? 'aligned') !== 'aligned') continue;
    const p = dimLinePoint(e);
    const isIn = p.x > envelope.minX + EPS && p.x < envelope.maxX - EPS && p.y > envelope.minY + EPS && p.y < envelope.maxY - EPS;
    if (!isIn) continue;
    const horiz = Math.abs(e.a.y - e.b.y) < 1e-6;
    const vert = Math.abs(e.a.x - e.b.x) < 1e-6;
    if (!horiz && !vert) {
      out.skipped++; // dim xiên trong nhà — không dời bừa
      continue;
    }
    inside.push(horiz
      ? { e, axis: 'h', line: p.y, lo: Math.min(e.a.x, e.b.x), hi: Math.max(e.a.x, e.b.x) }
      : { e, axis: 'v', line: p.x, lo: Math.min(e.a.y, e.b.y), hi: Math.max(e.a.y, e.b.y) });
  }
  if (!inside.length) return out;

  // Gom CHUỖI: cùng trục + cùng đường dim (làm tròn mm).
  const groups = new Map<string, Info[]>();
  for (const i of inside) {
    const key = `${i.axis}:${Math.round(i.line)}`;
    const g = groups.get(key);
    if (g) g.push(i);
    else groups.set(key, [i]);
  }

  // Chia nhóm theo (trục, phía mép gần nhất) rồi xếp bậc thang từ mép ra.
  const bySide = new Map<string, { line: number; infos: Info[] }[]>();
  for (const g of groups.values()) {
    const { axis, line } = g[0];
    const near = axis === 'v'
      ? (envelope.maxX - line <= line - envelope.minX ? 'max' : 'min')
      : (envelope.maxY - line <= line - envelope.minY ? 'max' : 'min');
    const key = `${axis}:${near}`;
    const arr = bySide.get(key) ?? [];
    arr.push({ line, infos: g });
    bySide.set(key, arr);
  }

  const step = Math.max(1, opts.stepWorld);
  for (const [key, arr] of bySide) {
    const [axis, side] = key.split(':') as ['h' | 'v', 'max' | 'min'];
    // Nhóm gần mép nhất giữ lớp trong cùng (giữ đúng thứ tự chi tiết→tổng của người vẽ).
    arr.sort((a, b) => (side === 'max' ? b.line - a.line : a.line - b.line));
    const edge = axis === 'v' ? (side === 'max' ? envelope.maxX : envelope.minX) : (side === 'max' ? envelope.maxY : envelope.minY);
    const spanLo = Math.min(...arr.flatMap((g) => g.infos.map((i) => i.lo)));
    const spanHi = Math.max(...arr.flatMap((g) => g.infos.map((i) => i.hi)));
    let base = edge;
    for (const ob of opts.obstacles ?? []) {
      const lateralHit = axis === 'v' ? ob.minY <= spanHi && ob.maxY >= spanLo : ob.minX <= spanHi && ob.maxX >= spanLo;
      if (!lateralHit) continue;
      if (side === 'max') {
        const c = axis === 'v' ? ob.maxX : ob.maxY;
        if ((axis === 'v' ? ob.maxX : ob.maxY) > edge - EPS) base = Math.max(base, c);
      } else {
        const c = axis === 'v' ? ob.minX : ob.minY;
        if ((axis === 'v' ? ob.minX : ob.minY) < edge + EPS) base = Math.min(base, c);
      }
    }
    arr.forEach((g, idx) => {
      const target = side === 'max' ? base + step * (idx + 1) : base - step * (idx + 1);
      const pb = opts.pageWorldBox;
      if (pb && (axis === 'v' ? target < pb.minX || target > pb.maxX : target < pb.minY || target > pb.maxY)) {
        out.skipped += g.infos.length; // trang giấy không còn chỗ — giữ nguyên, không dời vào hư không
        return;
      }
      for (const i of g.infos) {
        out.shifts.set(i.e.id, axis === 'v' ? { dx: target - g.line, dy: 0 } : { dx: 0, dy: target - g.line });
      }
    });
  }
  return out;
}

/* ─────────────────────────────── Dựng kế hoạch chung (v2) ─────────────────────────────── */

export interface PlanExportOpts {
  /** mẫu số tỉ lệ in (1:N) — quy đổi bậc thang dim 8mm giấy → mm world. Mặc định 100. */
  scaleN?: number;
  /** vùng world nhìn thấy trên trang — xem DimOutsideOpts.pageWorldBox. */
  pageWorldBox?: Box;
}

const AREA_TEXT_RE = /m²|m2/i;

interface PlanBuilt {
  labels: LabelBoxInput[];
  obstacles: Box[];
  /** id đơn vị nhãn (= id nhãn tên phòng) → các entityId cùng dời (tên + dòng m²). */
  unitMembers: Map<string, string[]>;
  dim: DimOutsideResult;
}

/** Gom toàn bộ input cho avoidLabelCollision từ 1 Doc — dùng chung cho đường xuất PDF và cổng kiểm
 * (một định nghĩa, hai nơi tiêu thụ — cùng triết lý v1). */
function buildPlan(doc: DocSlice, ds: LabelDimStyle, opts: PlanExportOpts): PlanBuilt {
  const hidden = new Set(doc.layers.filter((l) => !l.visible).map((l) => l.id));
  const visible = doc.entities.filter((e) => !hidden.has(e.layer));

  const wallBoxes = visible.filter(isWallHatch).map((e) => entityBox(e));
  const envelope = unionBoxes(wallBoxes);
  const roomBoundaries = visible.flatMap((e) => (e.type === 'room' ? [e.boundary] : []));

  // ① Đơn vị nhãn phòng: tên + dòng diện tích "x.x m²" ngay dưới (cùng cột, cách ≤3.5 cỡ chữ) dời
  //    CHUNG — lỗi ① soi 12/08: v1 chỉ dời tên, dòng m² đứng lại đè thiết bị WC/mặt bàn bếp.
  const roomLabels = visible.filter(isRoomLabel) as Extract<Entity, { type: 'text' }>[];
  const areaTexts = visible.filter(
    (e): e is Extract<Entity, { type: 'text' }> => e.type === 'text' && AREA_TEXT_RE.test(e.text) && !isRoomLabel(e),
  );
  const claimed = new Set<string>();
  const unitMembers = new Map<string, string[]>();
  const unitBoxes = new Map<string, Box>();
  for (const rl of roomLabels) {
    const nameBox = entityBox(rl);
    let pair: Extract<Entity, { type: 'text' }> | null = null;
    for (const t of areaTexts) {
      if (claimed.has(t.id)) continue;
      const dyDown = rl.at.y - t.at.y;
      if (Math.abs(t.at.x - rl.at.x) <= 600 && dyDown > 0 && dyDown <= rl.h * 3.5) {
        if (!pair || dyDown < rl.at.y - pair.at.y) pair = t;
      }
    }
    if (pair) claimed.add(pair.id);
    unitMembers.set(rl.id, pair ? [rl.id, pair.id] : [rl.id]);
    unitBoxes.set(rl.id, pair ? unionBoxes([nameBox, entityBox(pair)])! : nameBox);
  }

  // ② Chướng ngại: block (bbox THẬT từ hình học BLOCK_MAP — bbox xấp xỉ ±1200 của entityBox phủ
  //    2.4m quanh MỌI cửa/thiết bị làm phòng nhỏ "kín đặc giả", nhãn WC không còn chỗ hợp lệ nào)
  //    + mọi hatch + text ghi chú khác (nhãn không được dời đè lên ghi chú) + CHROME trang (mọi
  //    entity nằm trọn NGOÀI tường bao: hoa gió, thước tỉ lệ, khung tên, bong bóng trục — leader
  //    phải né, lỗi ④) + đường dim (sau khi đã dời cụm ra ngoài — nhãn phòng không đè chuỗi dim).
  const obstacles: Box[] = [];
  for (const e of visible) {
    if (e.type === 'block') obstacles.push(preciseBlockBox(e));
    else if (e.type === 'hatch') obstacles.push(entityBox(e));
    else if (e.type === 'text') {
      if (!unitMembers.has(e.id) && !claimed.has(e.id)) obstacles.push(entityBox(e));
    } else if (envelope && e.type !== 'dim' && e.type !== 'room') {
      const b = entityBox(e);
      if (Number.isFinite(b.minX) && !boxesOverlap(b, envelope)) obstacles.push(b); // chrome ngoài nhà
    }
  }

  // ③ Dời chuỗi dim trong nhà ra ngoài (bậc thang 8mm giấy/lớp). Chuỗi dim NGOÀI nhà sẵn có cũng
  //    là chướng ngại xếp bậc — lớp mới không được đè lên lớp người vẽ đã đặt.
  const dimEntities = visible.filter((e): e is DimSlim => e.type === 'dim');
  const stepWorld = 8 * (opts.scaleN ?? 100);
  const textHPre = Math.max(1, ds.textHeight * ds.dimScale);
  const outsideDimBoxes: Box[] = [];
  if (envelope) {
    for (const e of dimEntities) {
      if ((e.kind ?? 'aligned') !== 'aligned') continue;
      const p = dimLinePoint(e);
      const isOut = p.x <= envelope.minX || p.x >= envelope.maxX || p.y <= envelope.minY || p.y >= envelope.maxY;
      if (isOut) outsideDimBoxes.push(dimLineBox(e, textHPre, { dx: 0, dy: 0 }));
    }
  }
  const dim = dimOutsideRoom(dimEntities, envelope, { stepWorld, pageWorldBox: opts.pageWorldBox, obstacles: [...obstacles, ...outsideDimBoxes] });

  // ④ Đường dim (vị trí SAU dời) thành chướng ngại cho nhãn phòng/leader.
  for (const e of dimEntities) {
    if ((e.kind ?? 'aligned') !== 'aligned') continue;
    obstacles.push(dimLineBox(e, textHPre, dim.shifts.get(e.id) ?? { dx: 0, dy: 0 }));
  }

  // ⑤ Nhãn: đơn vị nhãn phòng (ràng biên phòng) trước, rồi chữ của dim CHƯA dời cụm (né chữ đè
  //    chữ như v1 — dim đã dời cụm đứng ở bậc thang riêng, không cần né thêm).
  const labels: LabelBoxInput[] = [];
  for (const rl of roomLabels) {
    const box = unitBoxes.get(rl.id)!;
    const bounds = labelInRoomBounds(boxCenter(entityBox(rl)), wallBoxes, envelope, roomBoundaries);
    labels.push({
      id: rl.id,
      box,
      ...(bounds ? { bounds } : {}),
      // leader phải đáp NGOÀI nhà (envelope) — đáp vào phòng bên cạnh còn dễ hiểu nhầm hơn đè hình.
      ...(envelope && bounds ? { leaderClearOf: envelope } : {}),
      maxRings: 6,
      allowLeader: true,
      avoidObstacles: true,
    });
  }
  for (const e of dimEntities) {
    if (dim.shifts.has(e.id)) continue;
    const box = alignedDimLabelBox(e, ds);
    if (box) labels.push({ id: e.id, box, maxRings: 2, allowLeader: false, avoidObstacles: false });
  }
  return { labels, obstacles, unitMembers, dim };
}

/** bbox THẬT của block từ hình học BLOCK_MAP (transform đủ at/rot/sx/sy); block lạ rơi về bbox
 * xấp xỉ của entityBox. */
function preciseBlockBox(e: Extract<Entity, { type: 'block' }>): Box {
  const def = BLOCK_MAP[e.block];
  if (!def) return entityBox(e);
  const box: Box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const cos = Math.cos(e.rot);
  const sin = Math.sin(e.rot);
  const grow = (lp: Pt) => {
    const x = lp.x * e.sx;
    const y = lp.y * e.sy;
    const wx = e.at.x + x * cos - y * sin;
    const wy = e.at.y + x * sin + y * cos;
    box.minX = Math.min(box.minX, wx);
    box.minY = Math.min(box.minY, wy);
    box.maxX = Math.max(box.maxX, wx);
    box.maxY = Math.max(box.maxY, wy);
  };
  for (const prim of def.prims) {
    if (prim.k === 'line') {
      grow(prim.a);
      grow(prim.b);
    } else if (prim.k === 'poly') {
      prim.pts.forEach(grow);
    } else if (prim.k === 'circle') {
      grow({ x: prim.c.x - prim.r, y: prim.c.y - prim.r });
      grow({ x: prim.c.x + prim.r, y: prim.c.y + prim.r });
    } else {
      // arc: bbox THẬT của cung (sample dọc sweep) — bao cả vòng tròn biến cung mở cửa 800 thành
      // chướng ngại ma 1600×1600 phủ kín hành lang/WC, đẩy nhãn thành leader oan (soi 12/08).
      let sweep = prim.a2 - prim.a1;
      while (sweep <= 0) sweep += Math.PI * 2;
      const N = 16;
      for (let i = 0; i <= N; i++) {
        const a = prim.a1 + (sweep * i) / N;
        grow({ x: prim.c.x + prim.r * Math.cos(a), y: prim.c.y + prim.r * Math.sin(a) });
      }
    }
  }
  return Number.isFinite(box.minX) ? box : entityBox(e);
}

/**
 * Lập kế hoạch DỜI nhãn cho đường xuất PDF (v2): đơn vị nhãn phòng (tên + m²) né hình học thật +
 * ràng biên phòng, chuỗi dim trong nhà dời CẢ CỤM ra ngoài, leader né chrome trang.
 * Trả Map entityId → độ dời (mm world). Nhãn không phải dời thì KHÔNG có mặt trong Map.
 */
export function planExportLabelShifts(doc: DocSlice, ds: LabelDimStyle, opts: PlanExportOpts = {}): Map<string, ExportLabelShift> {
  const { labels, obstacles, unitMembers, dim } = buildPlan(doc, ds, opts);
  const out = new Map<string, ExportLabelShift>();
  for (const [id, s] of dim.shifts) out.set(id, { dx: s.dx, dy: s.dy, wholeDim: true });
  if (!labels.length) return out;

  const placed = avoidLabelCollision(labels, obstacles);
  const byId = new Map(labels.map((l) => [l.id, l.box]));
  for (const p of placed) {
    if (!p.moved) continue;
    const orig = byId.get(p.id)!;
    const dx = p.box.minX - orig.minX;
    const dy = p.box.minY - orig.minY;
    const members = unitMembers.get(p.id) ?? [p.id];
    members.forEach((id, i) => {
      // leader chỉ vẽ 1 lần — gắn vào nhãn tên (member đầu), dòng m² đi theo cùng độ dời.
      out.set(id, i === 0 ? { dx, dy, leader: p.leader } : { dx, dy });
    });
  }
  return out;
}

/**
 * Cổng CHUAN_DAU_RA (export-checks.ts): SỐ NHÃN còn đè sau khi đã chạy né + số dim trong nhà máy
 * KHÔNG dời an toàn được (xiên/hết chỗ giấy) — các ca máy chịu thua, người phải tự dời. 0 = sạch.
 */
export function countUnresolvedLabelCollisions(doc: DocSlice, ds: LabelDimStyle, opts: PlanExportOpts = {}): number {
  const { labels, obstacles, dim } = buildPlan(doc, ds, opts);
  if (!labels.length) return dim.skipped;

  const placed = avoidLabelCollision(labels, obstacles);
  const avoidObsOf = new Map(labels.map((l) => [l.id, l.avoidObstacles !== false]));
  let count = dim.skipped;
  for (let i = 0; i < placed.length; i++) {
    const a = placed[i];
    const hitLabel = placed.some((b, j) => j !== i && boxesOverlap(a.box, b.box));
    const hitObs = avoidObsOf.get(a.id)! && obstacles.some((o) => boxesOverlap(a.box, o));
    if (hitLabel || hitObs) count++;
  }
  return count;
}
