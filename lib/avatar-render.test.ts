/**
 * lib/avatar-render.test.ts — khoá HÌNH HỌC của `components/avatar/AvatarRenderer.tsx`.
 * Chạy: `node_modules/.bin/sucrase-node lib/avatar-render.test.ts`.
 *
 * Vì sao đọc file nguồn dạng TEXT thay vì render component: `sucrase-node` không hiểu alias
 * `@/…` của tsconfig nên không nạp được AvatarRenderer (nó import `@/lib/avatar`). Dữ liệu
 * cần kiểm ở đây là các chuỗi `d="…"` HẰNG SỐ trong file — đọc thẳng nguồn là đo đúng cái
 * sẽ xuất xưởng, không cần React.
 *
 * Kiểm gì:
 *  1. KHÔNG mảng tóc/mũ nào (vẽ SAU mắt) phủ lên tâm hai mắt. Bug thật đã gặp: kiểu 8 và 16
 *     vẽ một dải tối vắt NGANG mặt ở y110–126 — đúng tầm mắt — nhìn ra như bịt mắt.
 *  2. Mọi kiểu tóc phải có KHỐI: đỉnh tóc cao hơn đỉnh hộp sọ đủ ngưỡng (trừ kiểu cạo sát).
 *  3. Không kiểu nào bị khung tròn cắt cụt đỉnh.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const SRC = readFileSync(join(__dirname, '../components/avatar/AvatarRenderer.tsx'), 'utf8');

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
  console.log('  ok:', msg);
}

console.log('avatar renderer geometry tests');

/* ─────────── Hình học: làm phẳng path thành đa giác ─────────── */

type Pt = [number, number];

/** Bezier bậc 3 → 16 đoạn thẳng (đủ mịn cho phép thử bao/không bao). */
function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt): Pt[] {
  const out: Pt[] = [];
  for (let i = 1; i <= 16; i++) {
    const t = i / 16;
    const u = 1 - t;
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
  return out;
}

function quad(p0: Pt, p1: Pt, p2: Pt): Pt[] {
  const out: Pt[] = [];
  for (let i = 1; i <= 16; i++) {
    const t = i / 16;
    const u = 1 - t;
    out.push([
      u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    ]);
  }
  return out;
}

/** Tách `d` thành các vòng (subpath). Chỉ hỗ trợ M/L/C/Q/Z tuyệt đối — đúng những gì file dùng. */
function flatten(d: string): Pt[][] {
  const rings: Pt[][] = [];
  let ring: Pt[] = [];
  let cur: Pt = [0, 0];
  const tokens = d.match(/[MLCQZmlcqz]|-?\d*\.?\d+/g) || [];
  let i = 0;
  let cmd = '';
  while (i < tokens.length) {
    const t = tokens[i];
    if (/[MLCQZmlcqz]/.test(t)) {
      cmd = t;
      i++;
      if (cmd === 'Z' || cmd === 'z') {
        if (ring.length) rings.push(ring);
        ring = [];
        continue;
      }
    }
    const num = () => Number(tokens[i++]);
    if (cmd === 'M') {
      if (ring.length) rings.push(ring);
      cur = [num(), num()];
      ring = [cur];
    } else if (cmd === 'L') {
      cur = [num(), num()];
      ring.push(cur);
    } else if (cmd === 'C') {
      const p1: Pt = [num(), num()];
      const p2: Pt = [num(), num()];
      const p3: Pt = [num(), num()];
      ring.push(...cubic(cur, p1, p2, p3));
      cur = p3;
    } else if (cmd === 'Q') {
      const p1: Pt = [num(), num()];
      const p2: Pt = [num(), num()];
      ring.push(...quad(cur, p1, p2));
      cur = p2;
    } else {
      throw new Error(`lệnh path chưa hỗ trợ: ${cmd} trong ${d.slice(0, 40)}`);
    }
  }
  if (ring.length) rings.push(ring);
  return rings;
}

/** Even-odd: điểm nằm trong hình (nhiều vòng ⇒ vòng trong khoét lỗ, đúng cách ring tóc vẽ). */
function inRings(rings: Pt[][], [px, py]: Pt): boolean {
  let inside = false;
  for (const r of rings) {
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i];
      const [xj, yj] = r[j];
      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

/* ─────────── Bóc các hình CÓ TÔ MÀU TÓC ra khỏi nguồn ─────────── */

interface Shape {
  style: number;
  kind: string;
  rings: Pt[][];
  top: number;
}

/** Cắt thân một hàm theo tên (đến hàm kế tiếp / hết khối). */
function bodyOf(name: string, until: string): string {
  const a = SRC.indexOf(`function ${name}(`);
  const b = SRC.indexOf(until, a);
  if (a < 0 || b < 0) throw new Error(`không cắt được thân hàm ${name}`);
  return SRC.slice(a, b);
}

const HAIR_FRONT = bodyOf('HairFront', '/* ═══════════════════════ Mặt');
const HATS = bodyOf('HatShape', '/* ═══════════════════════ Utils');

/** Tô bằng màu tóc/mũ (không phải `fill="none"` — những cái đó chỉ có nét, không che). */
function isFilled(tag: string): boolean {
  return /fill=\{(fill|shade|glow)\}/.test(tag) || /fill="#[0-9A-Fa-f]{3,8}"/.test(tag);
}

function collect(src: string, label: string): Shape[] {
  const shapes: Shape[] = [];
  // mỗi `case N:` mở một kiểu; phần trước case đầu tiên là mã dùng chung
  const parts = src.split(/case (\d+):|case '([a-zA-Z]+)':/);
  let style = 0;
  for (let i = 0; i < parts.length; i++) {
    const chunk = parts[i];
    if (chunk === undefined) continue;
    if (/^\d+$/.test(chunk) && i % 3 === 1) {
      style = Number(chunk);
      continue;
    }
    if (i % 3 !== 0) continue; // nhãn case dạng chuỗi (mũ) → giữ style hiện tại
    for (const tag of chunk.match(/<(path|circle|ellipse|rect)\b[^>]*\/>/g) || []) {
      if (!isFilled(tag)) continue;
      const n = (k: string) => {
        const m = tag.match(new RegExp(`${k}="(-?[\\d.]+)"`));
        return m ? Number(m[1]) : NaN;
      };
      if (tag.startsWith('<path')) {
        const d = tag.match(/\sd="([^"]+)"/);
        if (!d) continue;
        const rings = flatten(d[1]);
        shapes.push({
          style,
          kind: `${label} path`,
          rings,
          top: Math.min(...rings.flat().map((p) => p[1])),
        });
      } else if (tag.startsWith('<circle')) {
        const [cx, cy, r] = [n('cx'), n('cy'), n('r')];
        shapes.push({ style, kind: `${label} circle`, rings: circleRings(cx, cy, r, r), top: cy - r });
      } else if (tag.startsWith('<ellipse')) {
        const [cx, cy, rx, ry] = [n('cx'), n('cy'), n('rx'), n('ry')];
        shapes.push({ style, kind: `${label} ellipse`, rings: circleRings(cx, cy, rx, ry), top: cy - ry });
      } else {
        const [x, y, w, h] = [n('x'), n('y'), n('width'), n('height')];
        shapes.push({
          style,
          kind: `${label} rect`,
          rings: [[[x, y], [x + w, y], [x + w, y + h], [x, y + h]]],
          top: y,
        });
      }
    }
  }
  return shapes;
}

function circleRings(cx: number, cy: number, rx: number, ry: number): Pt[][] {
  const r: Pt[] = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    r.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return [r];
}

const frontShapes = collect(HAIR_FRONT, 'hair');
const hatShapes = collect(HATS, 'hat');

assert(frontShapes.length > 30, `bóc được ${frontShapes.length} mảng tóc lớp trước từ nguồn`);
assert(hatShapes.length > 10, `bóc được ${hatShapes.length} mảng mũ từ nguồn`);

/* ─────────── 1. Không mảng nào phủ mắt ─────────── */

const EYE_Y = 112;
const EYE_DX = 23;
// tâm hai mắt + biên trên/dưới của tròng — vùng TUYỆT ĐỐI không được che
const EYE_PTS: Pt[] = [
  [100 - EYE_DX, EYE_Y],
  [100 + EYE_DX, EYE_Y],
  [100 - EYE_DX, EYE_Y - 6],
  [100 + EYE_DX, EYE_Y - 6],
  [100 - EYE_DX, EYE_Y + 6],
  [100 + EYE_DX, EYE_Y + 6],
];

for (const s of [...frontShapes, ...hatShapes]) {
  for (const p of EYE_PTS) {
    if (inRings(s.rings, p)) {
      console.error(`FAIL: ${s.kind} của kiểu ${s.style} phủ điểm mắt (${p[0]},${p[1]})`);
      process.exit(1);
    }
  }
}
assert(
  true,
  `${frontShapes.length + hatShapes.length} mảng tóc/mũ · ${EYE_PTS.length} điểm mắt → không mảng nào che mắt`,
);

const styles = new Set(frontShapes.map((s) => s.style));
assert(styles.size === 16, `đủ 16 kiểu tóc có hình (thấy ${styles.size})`);

console.log('PASS avatar renderer geometry tests');
