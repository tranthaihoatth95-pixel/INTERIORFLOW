/**
 * lib/nodes/families.test.ts — khoá "MỌI node thật đều có họ" bằng cách QUÉT SOURCE THẬT
 * (`registry.ts` + `defs/*.ts`), không tin bảng `NODE_FAMILY` tự khai đủ. Không import
 * `registry.ts` (kéo `@/lib/ai/*` — sucrase-node không resolve alias; xem macro.test.ts).
 * Chạy: node_modules/.bin/sucrase-node lib/nodes/families.test.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { FAMILY_META, FAMILY_ORDER, NODE_FAMILY, familyColor, familyOf, nodeTypesOfFamily } from './families';
import { GROUP_META } from './groups';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/** Mọi `type: '<id>'` khai ở cấp NodeDefinition trong registry.ts + defs/*.ts. Regex khớp
 * đúng dòng `    type: 'x.y',` (4 khoảng trắng đầu dòng — cấp trường của object literal node),
 * KHÔNG khớp `type:` lồng sâu hơn (vd `dataType`). */
function scanNodeTypes(): string[] {
  const dir = path.join(__dirname);
  const files = [path.join(dir, 'registry.ts'), ...fs.readdirSync(path.join(dir, 'defs'))
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && f !== 'index.ts')
    .map((f) => path.join(dir, 'defs', f))];
  const out = new Set<string>();
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/^ {4}type: '([a-z0-9]+\.[a-z0-9]+)',/gm)) out.add(m[1]);
  }
  return [...out];
}

const real = scanNodeTypes();
ok(`quét được ≥ 45 node thật (${real.length})`, real.length >= 45);

const missing = real.filter((t) => !(t in NODE_FAMILY));
ok(`mọi node thật đều có họ (thiếu: ${missing.join(', ') || 'không'})`, missing.length === 0);

const stale = Object.keys(NODE_FAMILY).filter((t) => !real.includes(t));
ok(`bảng họ không có id ma (thừa: ${stale.join(', ') || 'không'})`, stale.length === 0);

ok('9 họ, thứ tự = dòng chảy nghề, bắt đầu Nguồn kết thúc Trình bày',
  FAMILY_ORDER.length === 9 && FAMILY_ORDER[0] === 'source' && FAMILY_ORDER[8] === 'present');
ok('mỗi họ có meta VI+EN', FAMILY_ORDER.every((f) => FAMILY_META[f].label && FAMILY_META[f].labelEn && FAMILY_META[f].blurb));
ok('màu họ MƯỢN từ groups.ts (không hex mới)',
  FAMILY_ORDER.every((f) => Object.values(GROUP_META).some((g) => g.color === familyColor(f))));
ok('mỗi họ có ít nhất 1 node', FAMILY_ORDER.every((f) => nodeTypesOfFamily(f).length >= 1));
ok('BOQ chỉ chứa bảng món (chỉ nhận số đo được)', nodeTypesOfFamily('boq').join() === 'util.ffetable');
ok('id lạ → render (đường lùi dữ liệu cũ, không sập)', familyOf('x.khong-ton-tai') === 'render');

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
