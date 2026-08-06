/**
 * lib/cad/plan-depth.test.ts — test phân lớp độ đậm theo chiều sâu (VIỆC 3, phiên S4).
 * Chạy: `node_modules/.bin/sucrase-node lib/cad/plan-depth.test.ts`
 */

import type { Doc, Entity } from './model';
import {
  applyDepthFade, depthBandOf, depthFadeSpec, mixHex, parseHex,
  DEFAULT_DEPTH_BANDS,
} from './plan-depth';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${extra ? ' — ' + extra : ''}`); }
};

function mkElevation(): Doc {
  const entities: Entity[] = [
    { id: 'c1', type: 'line', layer: 'S-CUT', a: { x: 0, y: 0 }, b: { x: 100, y: 0 } },
    { id: 'v1', type: 'line', layer: 'S-VIEW', a: { x: 0, y: 10 }, b: { x: 100, y: 10 } },
    { id: 'f1', type: 'line', layer: 'S-FAR', a: { x: 0, y: 20 }, b: { x: 100, y: 20 } },
    { id: 'x1', type: 'line', layer: 'OTHER', a: { x: 0, y: 30 }, b: { x: 100, y: 30 } },
  ];
  return {
    id: 'd', name: 'elev', unit: 'mm',
    layers: [
      { id: 'S-CUT', name: 'cut', color: '#2b2b2b', visible: true, locked: false, lineweight: 0.7 },
      { id: 'S-VIEW', name: 'view', color: '#2b2b2b', visible: true, locked: false, lineweight: 0.7 },
      { id: 'S-FAR', name: 'far', color: '#2b2b2b', visible: true, locked: false, lineweight: 0.7 },
      { id: 'OTHER', name: 'other', color: '#123456', visible: true, locked: false, lineweight: 0.5 },
    ],
    entities,
  } as unknown as Doc;
}

console.log('\n[1] Màu — parse + pha');
{
  ok('#rrggbb', JSON.stringify(parseHex('#204080')) === JSON.stringify([32, 64, 128]));
  ok('#rgb rút gọn', JSON.stringify(parseHex('#f0a')) === JSON.stringify([255, 0, 170]));
  ok('chuỗi hỏng ⇒ null (không đoán)', parseHex('xyz') === null);
  ok('pha t=0 giữ nguyên', mixHex('#000000', '#ffffff', 0) === '#000000');
  ok('pha t=1 thành đích', mixHex('#000000', '#ffffff', 1) === '#ffffff');
  ok('pha t=0.5 ra giữa', mixHex('#000000', '#ffffff', 0.5) === '#808080');
  ok('màu hỏng ⇒ trả nguyên màu gốc, không crash', mixHex('nope', '#ffffff', 0.5) === 'nope');
}

console.log('\n[2] Tra dải — CHỈ theo layer khai báo (K3)');
{
  const doc = mkElevation();
  ok('S-CUT ⇒ depth 0', depthBandOf(doc.entities[0])?.depth === 0);
  ok('S-VIEW ⇒ depth 1', depthBandOf(doc.entities[1])?.depth === 1);
  ok('S-FAR ⇒ depth 2', depthBandOf(doc.entities[2])?.depth === 2);
  ok('layer lạ ⇒ null, KHÔNG đoán chiều sâu', depthBandOf(doc.entities[3]) === null);
  ok('mặc định khớp 3 layer S2 sinh ra', DEFAULT_DEPTH_BANDS.map((b) => b.layerId).join(',') === 'S-CUT,S-VIEW,S-FAR');
}

console.log('\n[3] Lớp TRƯỚC nét rõ · lớp SAU chìm vào nền (nguồn C2)');
{
  const d0 = depthFadeSpec('#000000', 0.7, 0);
  const d1 = depthFadeSpec('#000000', 0.7, 1);
  const d2 = depthFadeSpec('#000000', 0.7, 2);
  ok('lớp 0 GIỮ NGUYÊN màu (nét rõ)', d0.color === '#000000' && d0.fade === 0);
  ok('lớp 0 giữ nguyên bề dày', d0.lineweightMm === 0.7);
  ok('càng xa càng nhạt', d1.fade > d0.fade && d2.fade > d1.fade, `${d0.fade}/${d1.fade}/${d2.fade}`);
  ok('càng xa nét càng mảnh', d2.lineweightMm < d1.lineweightMm && d1.lineweightMm < d0.lineweightMm);
  ok('không bao giờ pha quá trần (lớp xa vẫn nhìn thấy)', depthFadeSpec('#000000', 0.7, 99).fade <= 0.82);
}

console.log('\n[4] Chỉ dùng ĐỘ ĐẬM NÉT — không bóng đổ, không alpha');
{
  const { doc } = applyDepthFade(mkElevation());
  const keys = new Set<string>();
  for (const e of doc.entities) for (const k of Object.keys(e)) keys.add(k);
  ok('không đẻ trường opacity/alpha/shadow/blur nào',
    !['opacity', 'alpha', 'shadow', 'blur'].some((k) => keys.has(k)), [...keys].join(','));
}

console.log('\n[5] ⛔ KHÔNG đụng toạ độ (cùng lời hứa với plan-present)');
{
  const src = mkElevation();
  const before = JSON.stringify(src.entities);
  const { doc } = applyDepthFade(src);
  ok('Doc gốc bất biến', JSON.stringify(src.entities) === before);
  let drift = '';
  for (const o of src.entities) {
    const p = doc.entities.find((e) => e.id === o.id)!;
    const a = { ...o } as Record<string, unknown>; const b = { ...p } as Record<string, unknown>;
    delete a.color; delete a.lineweight; delete b.color; delete b.lineweight;
    if (JSON.stringify(a) !== JSON.stringify(b)) drift += `${o.id} `;
  }
  ok('mọi trường hình học giữ nguyên', drift === '', drift);
}

console.log('\n[6] Entity ngoài dải — GIỮ NGUYÊN và KHAI THẬT (K3/N5)');
{
  const { doc, report } = applyDepthFade(mkElevation());
  const other = doc.entities.find((e) => e.id === 'x1')!;
  ok('entity layer lạ không bị tô mờ', other.color === undefined && other.lineweight === undefined);
  ok('đếm đúng số entity bỏ qua', report.untouched === 1, String(report.untouched));
  ok('và ghi rõ vào notes', report.notes.some((n) => n.includes('không thuộc dải')));
  ok('đếm đúng từng dải', report.perBand['Nét cắt · Cut'] === 1 && report.perBand['Xa · Far'] === 1,
    JSON.stringify(report.perBand));
}

console.log('\n[7] Bản vẽ KHÔNG phải mặt đứng — nói thẳng, không im lặng');
{
  const plain = { ...mkElevation(), entities: [mkElevation().entities[3]] } as Doc;
  const { report } = applyDepthFade(plain);
  ok('báo rõ chưa có gì để phân lớp', report.notes.some((n) => n.includes('chưa phải mặt đứng')));
}

console.log(`\nplan-depth.test.ts — ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
