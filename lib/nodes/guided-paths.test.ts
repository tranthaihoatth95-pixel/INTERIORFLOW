/**
 * lib/nodes/guided-paths.test.ts — hợp đồng đường dẫn khoá bằng SOURCE THẬT của registry:
 * mọi defType/handle/dataType trong 5 đường dẫn được đối chiếu với `registry.ts` + `defs/*.ts`
 * (đọc file, không import — registry kéo `@/lib/ai/*`, sucrase-node không resolve).
 * Chạy: node_modules/.bin/sucrase-node lib/nodes/guided-paths.test.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import type { NodeDefinition, PortDef } from '../types';
import { GUIDED_PATHS, guidedPathById, pathReadiness, planGuidedPath, planTerminals, type DefLookup } from './guided-paths';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/* ── Dựng lookupDef TỪ SOURCE THẬT: khối `type: 'x.y'` … tới `type:` kế; cổng khai dạng
 *    `{ id: 'a', label: '…', dataType: 't' }` (khuôn chung toàn registry). ── */
function realLookup(): DefLookup {
  const dir = __dirname;
  const files = [path.join(dir, 'registry.ts'), ...fs.readdirSync(path.join(dir, 'defs'))
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && f !== 'index.ts')
    .map((f) => path.join(dir, 'defs', f))];
  const blocks = new Map<string, string>();
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    const re = /^ {4}type: '([a-z0-9]+\.[a-z0-9]+)',/gm;
    const hits: { t: string; at: number }[] = [];
    for (const m of src.matchAll(re)) hits.push({ t: m[1], at: m.index ?? 0 });
    hits.forEach((h, i) => blocks.set(h.t, src.slice(h.at, hits[i + 1]?.at ?? src.length)));
  }
  const ports = (block: string, section: 'inputs' | 'outputs'): PortDef[] => {
    const start = block.indexOf(`${section}:`);
    if (start < 0) return [];
    const other = section === 'inputs' ? 'outputs:' : 'params:';
    const end = block.indexOf(other, start);
    const seg = block.slice(start, end < 0 ? undefined : end);
    return [...seg.matchAll(/\{ id: '([^']+)', label: '[^']*', dataType: '([a-z]+)' \}/g)]
      .map((m) => ({ id: m[1], label: m[1], dataType: m[2] as PortDef['dataType'] }));
  };
  return (t) => {
    const b = blocks.get(t);
    if (!b) throw new Error(`no node ${t}`);
    const credit = /creditCost: (\d+)/.exec(b);
    const title = /title: '([^']+)'/.exec(b);
    return {
      type: t, title: title?.[1] ?? t, category: 'UTILITY', description: '',
      inputs: ports(b, 'inputs'), outputs: ports(b, 'outputs'), params: [],
      creditCost: credit ? Number(credit[1]) : 0, execute: async () => ({}),
    } as NodeDefinition;
  };
}

const lookup = realLookup();

ok('có 5 đường dẫn, id không trùng', GUIDED_PATHS.length === 5 && new Set(GUIDED_PATHS.map((p) => p.id)).size === 5);

for (const p of GUIDED_PATHS) {
  const plan = planGuidedPath(p, lookup, { x: 100, y: 50 });
  ok(`[${p.id}] 0 lệch hợp đồng với registry thật (${plan.issues.join(' | ') || 'sạch'})`, plan.issues.length === 0);
  ok(`[${p.id}] đủ node = đủ bước, đủ dây`, plan.nodes.length === p.steps.length && plan.edges.length === p.edges.length);
  ok(`[${p.id}] đi qua ≥ 2 họ (${plan.families.join('>')})`, plan.families.length >= 2);
  ok(`[${p.id}] mỗi bước có lý do VI+EN`, p.steps.every((s) => s.why && s.whyEn));
  const again = planGuidedPath(p, lookup, { x: 100, y: 50 });
  ok(`[${p.id}] lập kế hoạch 2 lần ra y hệt (tất định)`, JSON.stringify(again) === JSON.stringify(plan));
  const pos = new Set(plan.nodes.map((n) => `${n.position.x},${n.position.y}`));
  ok(`[${p.id}] không 2 node chồng vị trí`, pos.size === plan.nodes.length);
  ok(`[${p.id}] có ≥1 node cuối để chạy`, planTerminals(plan).length >= 1);
}

const zero = planGuidedPath(guidedPathById('anh-do-bang-mon')!, lookup);
ok('đường Ảnh→Đo→Bảng món = 0 credit, chạy được cả ở mức Không AI', zero.creditTotal === 0 && pathReadiness(zero, 1).ok);
const clay = planGuidedPath(guidedPathById('khoi-trang-den-slide')!, lookup);
ok('đường Khối trắng tốn credit (4+2) và bị khoá ở mức 1, mở ở mức 2', clay.creditTotal === 6 && !pathReadiness(clay, 1).ok && pathReadiness(clay, 2).ok);
ok('cuối đường Khối trắng là deck', planTerminals(clay).join() === 'deck');

/* ── hợp đồng cạnh: lệch kiểu / thiếu cổng / 2 dây 1 cổng / vòng — phải báo, không dựng ── */
const bad = planGuidedPath({
  ...GUIDED_PATHS[0], id: 'bad',
  steps: [
    { key: 'a', defType: 'input.image', why: '', whyEn: '' },
    { key: 'b', defType: 'util.ffetable', why: '', whyEn: '' },
    { key: 'c', defType: 'khong.co', why: '', whyEn: '' },
  ],
  edges: [
    { from: 'a', fromHandle: 'image', to: 'b', toHandle: 'measurement' }, // image → text: lệch
    { from: 'a', fromHandle: 'image', to: 'b', toHandle: 'cutout' },
    { from: 'a', fromHandle: 'image', to: 'b', toHandle: 'cutout' }, // 2 dây 1 cổng
    { from: 'a', fromHandle: 'nope', to: 'b', toHandle: 'cutout' }, // thiếu cổng ra
  ],
}, lookup);
ok('lệch kiểu image→text bị bắt', bad.issues.some((i) => i.includes('≠')));
ok('2 dây vào 1 cổng bị bắt', bad.issues.some((i) => i.includes('nhận 2 dây')));
ok('cổng ra không tồn tại bị bắt', bad.issues.some((i) => i.includes('không có cổng ra')));
ok('node không có trong registry bị bắt', bad.issues.some((i) => i.includes('không có trong registry')));
ok('readiness từ chối khi có lệch', !pathReadiness(bad, 4).ok);

const cyc = planGuidedPath({
  ...GUIDED_PATHS[0], id: 'cyc',
  steps: [
    { key: 'a', defType: 'ai.upscale', why: '', whyEn: '' },
    { key: 'b', defType: 'ai.upscale', why: '', whyEn: '' },
  ],
  edges: [
    { from: 'a', fromHandle: 'image', to: 'b', toHandle: 'image' },
    { from: 'b', fromHandle: 'image', to: 'a', toHandle: 'image' },
  ],
}, lookup);
ok('vòng lặp bị bắt', cyc.issues.some((i) => i.includes('vòng lặp')));

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
