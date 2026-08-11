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
    const w = Math.max(1, l.box.maxX - l.box.minX);
    const maxRings = l.maxRings ?? 4;
    // 8 hướng, dọc trước ngang sau (xem docstring). Bước mỗi vòng theo cỡ chữ để nhãn không
    // "bay" xa vô cớ ở vòng đầu.
    const DIRS: [number, number][] = [
      [0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1],
    ];
    let found: Box | null = null;
    for (let ring = 1; ring <= maxRings && !found; ring++) {
      const step = ring * h * 1.4;
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

    // ③ leader ra ngoài: trượt lên trên-phải xa dần, chỉ cần không đè NHÃN khác (leader tồn tại
    //    chính là để được đứng ngoài hình học mà vẫn trỏ đúng chỗ).
    if (l.allowLeader !== false) {
      const anchor = boxCenter(l.box);
      for (let k = 1; k <= 6; k++) {
        const cand = shiftBox(l.box, (maxRings + k) * w * 0.8, (maxRings + k) * h * 1.2);
        if (placed.some((p) => boxesOverlap(cand, p.box, GAP))) continue;
        if (avoidObs && obstacles.some((o) => boxesOverlap(cand, o, GAP))) continue;
        placed.push({
          id: l.id,
          box: cand,
          moved: true,
          leader: { from: { x: cand.minX, y: cand.minY }, to: anchor },
        });
        break;
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

/**
 * Lập kế hoạch DỜI nhãn cho đường xuất PDF: nhãn phòng né hình học (block/hatch) + né nhau,
 * chuỗi dim chỉ né các nhãn khác (dời chuỗi dim xa đường dim là sai nghĩa hơn là chạm hình).
 * Trả Map entityId → độ dời (mm world). Nhãn không phải dời thì KHÔNG có mặt trong Map.
 */
export function planExportLabelShifts(doc: DocSlice, ds: LabelDimStyle): Map<string, ExportLabelShift> {
  const hidden = new Set(doc.layers.filter((l) => !l.visible).map((l) => l.id));
  const visible = doc.entities.filter((e) => !hidden.has(e.layer));

  // Hình học nhãn phải né: đồ nội thất (block) + poché tường (hatch) — đúng 2 thủ phạm trên
  // layout.pdf 11/08 ("PHÒNG NGỦ" gạch qua giường). Line/polyline KHÔNG tính: nét tường bao
  // quanh phòng thì bbox của nó trùm cả phòng, né bbox đó là không còn chỗ đặt nhãn.
  const obstacles: Box[] = visible
    .filter((e) => e.type === 'block' || e.type === 'hatch')
    .map((e) => entityBox(e));

  const labels: LabelBoxInput[] = [];
  for (const e of visible) {
    if (isRoomLabel(e)) {
      labels.push({ id: e.id, box: entityBox(e), maxRings: 4, allowLeader: true, avoidObstacles: true });
    }
  }
  for (const e of visible) {
    if (e.type !== 'dim') continue;
    const box = alignedDimLabelBox(e, ds);
    if (box) labels.push({ id: e.id, box, maxRings: 2, allowLeader: false, avoidObstacles: false });
  }
  if (!labels.length) return new Map();

  const placed = avoidLabelCollision(labels, obstacles);
  const byId = new Map(labels.map((l) => [l.id, l.box]));
  const out = new Map<string, ExportLabelShift>();
  for (const p of placed) {
    if (!p.moved) continue;
    const orig = byId.get(p.id)!;
    out.set(p.id, { dx: p.box.minX - orig.minX, dy: p.box.minY - orig.minY, leader: p.leader });
  }
  return out;
}

/**
 * Cổng CHUAN_DAU_RA (export-checks.ts): SỐ NHÃN còn đè sau khi đã chạy né — tức là các ca máy
 * chịu thua (④ trong avoidLabelCollision), người phải tự dời. 0 = sạch.
 */
export function countUnresolvedLabelCollisions(doc: DocSlice, ds: LabelDimStyle): number {
  const hidden = new Set(doc.layers.filter((l) => !l.visible).map((l) => l.id));
  const visible = doc.entities.filter((e) => !hidden.has(e.layer));
  const obstacles: Box[] = visible
    .filter((e) => e.type === 'block' || e.type === 'hatch')
    .map((e) => entityBox(e));

  const labels: LabelBoxInput[] = [];
  for (const e of visible) if (isRoomLabel(e)) labels.push({ id: e.id, box: entityBox(e), maxRings: 4 });
  for (const e of visible) {
    if (e.type !== 'dim') continue;
    const box = alignedDimLabelBox(e, ds);
    if (box) labels.push({ id: e.id, box, maxRings: 2, allowLeader: false, avoidObstacles: false });
  }
  if (!labels.length) return 0;

  const placed = avoidLabelCollision(labels, obstacles);
  const avoidObsOf = new Map(labels.map((l) => [l.id, l.avoidObstacles !== false]));
  let count = 0;
  for (let i = 0; i < placed.length; i++) {
    const a = placed[i];
    const hitLabel = placed.some((b, j) => j !== i && boxesOverlap(a.box, b.box));
    const hitObs = avoidObsOf.get(a.id)! && obstacles.some((o) => boxesOverlap(a.box, o));
    if (hitLabel || hitObs) count++;
  }
  return count;
}
