/**
 * lib/cad/poche-import.test.ts — G-M1-08 vòng 2: neo vùng tô cho bản vẽ **NHẬP TỪ NGOÀI**.
 * Chạy: `node_modules/.bin/sucrase-node lib/cad/poche-import.test.ts`
 *
 * Ca của `poche.test.ts` là tường do CHÍNH IF vẽ (hatch + polyline sinh cùng lúc, trùng khít từng
 * đỉnh). File này khoá ca KHÁC HẲN — hình dạng đo được trong hồ sơ AutoCAD thật:
 *
 *   1 cột = 1 đường bao 4 đỉnh + **10 mảng tô 5 đỉnh** chồng lên nhau, cùng lớp, cùng bản chèn,
 *   khác nhau mỗi `pattern` (ANSI31 ×7 · ANSI37 · SOLID · DOTS — người vẽ chồng nhiều lớp gạch
 *   để ra sắc độ). Đỉnh thứ 5 của mảng tô nằm GIỮA cạnh trên: điểm chia cạnh do phần mềm CAD
 *   chèn, KHÔNG thêm hình gì.
 *
 * Hai luật cũ chặn mất ca này, và cả hai đều là luật đúng-cho-ca-cũ:
 *   ① `sameRing` đòi BẰNG SỐ ĐỈNH  ⇒ 4 vs 5 là "khác vòng" ⇒ 0/126 mảng tô neo được
 *   ② "1 chủ ↔ 1 con"              ⇒ neo được 1 trong 10, dời cột thì 9 mảng ở lại chỗ cũ
 *
 * Số đo thật sau khi sửa (6/6 file): **0 → 80–90 mảng tô neo được mỗi file**, dời đường bao thì
 * 10/10 mảng đi theo. Ghi ở `docs/M1-OUT.md` PHẦN 4.
 */

import type { Doc, Entity, Layer, Pt } from './model';
import { normalizeRing, sameRing, syncPocheAnchors, expandIdsWithPoche, propagatePocheEdits, pochePartnerIds } from './poche';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean, extra = '') {
  if (cond) { pass += 1; console.log(`  ok  - ${name}`); }
  else { fail += 1; console.log(`  FAIL - ${name}${extra ? ` — ${extra}` : ''}`); }
}

const layers: Layer[] = [
  { id: 'L-col', name: 'A-Column', color: '#fff', visible: true, locked: false },
  { id: 'L-oth', name: 'A-Wall', color: '#fff', visible: true, locked: false },
];
const doc = (entities: Entity[]): Doc => ({ entities, layers });

/** Đúng hình dạng đo được: cột 750×750, đường bao 4 đỉnh. */
const CORNERS: Pt[] = [
  { x: 222394.12, y: -15630.602 },
  { x: 222394.12, y: -16380.602 },
  { x: 223144.12, y: -16380.602 },
  { x: 223144.12, y: -15630.602 },
];
/** Vòng của mảng tô: y hệt, CỘNG một đỉnh chia cạnh trên (thẳng hàng, không thêm hình). */
const WITH_SPLIT: Pt[] = [...CORNERS, { x: 222760.282, y: -15630.602 }];

const outline = (id: string, pts: Pt[], layer = 'L-col'): Entity =>
  ({ id, type: 'polyline', layer, points: pts, closed: true });
const fill = (id: string, pts: Pt[], pattern: string, layer = 'L-col'): Entity =>
  ({ id, type: 'hatch', layer, points: pts, pattern } as Entity);

const PATTERNS = ['ANSI31', 'ANSI31', 'ANSI31', 'ANSI31', 'ANSI31', 'ANSI31', 'ANSI31', 'ANSI37', 'SOLID', 'DOTS'];
const column = (): Entity[] => [outline('o1', CORNERS), ...PATTERNS.map((p, i) => fill(`h${i}`, WITH_SPLIT, p))];

console.log('\n[1] normalizeRing — bỏ đỉnh thẳng hàng, KHÔNG đổi hình');
{
  ok('5 đỉnh (1 đỉnh chia cạnh) → 4 đỉnh', normalizeRing(WITH_SPLIT).length === 4, String(normalizeRing(WITH_SPLIT).length));
  ok('4 đỉnh gốc giữ nguyên', normalizeRing(CORNERS).length === 4);
  // đỉnh trùng lặp (vòng "đóng bằng cách lặp đỉnh đầu") cũng phải sạch
  ok('đỉnh cuối trùng đỉnh đầu bị bỏ', normalizeRing([...CORNERS, { ...CORNERS[0] }]).length === 4);
  // tam giác thật KHÔNG bị bào mòn
  const tri: Pt[] = [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 0, y: 800 }];
  ok('tam giác giữ đủ 3 đỉnh', normalizeRing(tri).length === 3);
  // vòng suy biến (mọi đỉnh thẳng hàng) trả NGUYÊN, không tự biến thành đoạn thẳng
  const flat: Pt[] = [{ x: 0, y: 0 }, { x: 500, y: 0 }, { x: 1000, y: 0 }, { x: 1500, y: 0 }];
  ok('vòng suy biến trả nguyên, không nuốt mất hình', normalizeRing(flat).length >= 3);
  // đỉnh lệch THẬT (2mm > sai số 0.5mm) thì PHẢI giữ — không được bào mất góc thật
  const bump: Pt[] = [...CORNERS.slice(0, 3), { x: 223144.12, y: -15630.602 }, { x: 222760, y: -15628 }];
  ok('đỉnh lệch 2,6mm là hình THẬT, không bị bỏ', normalizeRing(bump).length === 5, String(normalizeRing(bump).length));
}

console.log('\n[2] sameRing — 4 đỉnh và 5 đỉnh CÙNG hình thì phải bằng nhau');
{
  ok('vòng cột: 4 đỉnh ≡ 5 đỉnh', sameRing(CORNERS, WITH_SPLIT));
  ok('vòng khác hình vẫn KHÁC', !sameRing(CORNERS, CORNERS.map((p) => ({ x: p.x + 50, y: p.y }))));
}

console.log('\n[3] Neo — 1 đường bao nhận CẢ 10 mảng tô');
{
  const d = syncPocheAnchors(doc(column()));
  const anchored = d.entities.filter((e) => e.type === 'hatch' && e.hostId === 'o1');
  ok('cả 10 mảng tô neo vào đúng đường bao', anchored.length === 10, String(anchored.length));
  ok('đường bao trả về đủ 10 con', pochePartnerIds(d, 'o1').length === 10, String(pochePartnerIds(d, 'o1').length));
  ok('mảng tô trả về đúng 1 chủ', pochePartnerIds(d, 'h0').length === 1);
  ok('idempotent — chạy lại không đổi', syncPocheAnchors(d) === d);
}

console.log('\n[4] Dời đường bao → CẢ 10 mảng tô đi theo (ca bệnh gốc)');
{
  const d = syncPocheAnchors(doc(column()));
  const moved = { ...(d.entities.find((e) => e.id === 'o1') as Extract<Entity, { type: 'polyline' }>) };
  moved.points = CORNERS.map((p) => ({ x: p.x + 1000, y: p.y }));
  const after = propagatePocheEdits({ ...d, entities: d.entities.map((e) => (e.id === 'o1' ? moved : e)) }, ['o1']);
  const fills = after.entities.filter((e): e is Extract<Entity, { type: 'hatch' }> => e.type === 'hatch');
  const theoDung = fills.filter((h) => Math.abs(Math.min(...h.points.map((p) => p.x)) - (222394.12 + 1000)) < 1e-6);
  ok('10/10 mảng tô về đúng vị trí mới', theoDung.length === 10, `${theoDung.length}/10`);
}

console.log('\n[5] Chọn 1 mảng tô = cầm cả cụm (đường bao + 9 mảng anh em)');
{
  const d = syncPocheAnchors(doc(column()));
  const sel = expandIdsWithPoche(['h3'], d);
  ok('nở ra đủ 11 hình', sel.size === 11, String(sel.size));
  ok('có đường bao trong đó', sel.has('o1'));
  ok('có cả mảng anh em', sel.has('h0') && sel.has('h9'));
}

console.log('\n[6] KHÔNG neo bừa — hai đường bao trùng vòng thì thà bỏ (K3)');
{
  const d = syncPocheAnchors(doc([outline('o1', CORNERS), outline('o2', CORNERS), fill('h1', WITH_SPLIT, 'SOLID')]));
  ok('mơ hồ ⇒ không neo', !d.entities.some((e) => e.type === 'hatch' && e.hostId));
}
{
  // khác LỚP thì không phải một cấu kiện — không ghép
  const d = syncPocheAnchors(doc([outline('o1', CORNERS, 'L-col'), fill('h1', WITH_SPLIT, 'SOLID', 'L-oth')]));
  ok('khác lớp ⇒ không neo', !d.entities.some((e) => e.type === 'hatch' && e.hostId));
}
{
  // mảng tô không có đường bao nào (ca thật: 36–71 mảng/file trên lớp `htch`) ⇒ để yên, không bịa
  const d = syncPocheAnchors(doc([fill('h1', WITH_SPLIT, 'SOLID')]));
  ok('không có đường bao ⇒ để yên, không bịa chủ', !d.entities.some((e) => e.type === 'hatch' && e.hostId));
}

console.log(`\npoche-import.test.ts — ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
