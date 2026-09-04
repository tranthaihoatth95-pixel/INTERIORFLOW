/**
 * app/api/asset-representation/_lib/kiem.test.ts — kiểm body POST/PATCH thuần (không DB).
 * Chạy: node_modules/.bin/sucrase-node app/api/asset-representation/_lib/kiem.test.ts
 */
import { kiemBodyPatch, kiemBodyTao, DB_KINDS } from './kiem';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
const err = (b: unknown) => { const r = kiemBodyTao(b); return r.ok ? '' : r.error; };

console.log('kiemBodyTao');
{
  ok('từ vựng kind có 10 mục, gồm 5 tên schema khai', DB_KINDS.length === 10 && ['plan', 'elevation', 'section', 'model3d', 'image'].every((k) => DB_KINDS.includes(k)));
  ok('null ⇒ lỗi', /object/.test(err(null)));
  ok('mảng ⇒ lỗi', /object/.test(err([])));
  ok('thiếu assetId', /assetId/.test(err({ kind: 'plan', payloadRef: 'x' })));
  ok('kind lạ ⇒ lỗi nêu từ vựng', /không thuộc từ vựng/.test(err({ assetId: 'a', kind: 'hologram', payloadRef: 'x' })));
  ok('thiếu payloadRef', /payloadRef/.test(err({ assetId: 'a', kind: 'plan' })));
  ok('payloadRef dataURL ⇒ cấm', /dataURL/.test(err({ assetId: 'a', kind: 'plan', payloadRef: 'data:image/png;base64,AAAA' })));
  ok('payloadRef quá dài ⇒ lỗi', /quá/.test(err({ assetId: 'a', kind: 'plan', payloadRef: 'x'.repeat(3000) })));
  ok('truthLevel verified qua POST ⇒ cấm', /verified/.test(err({ assetId: 'a', kind: 'plan', payloadRef: 'x', truthLevel: 'verified' })));
  ok('truthLevel lạ ⇒ lỗi', /truthLevel/.test(err({ assetId: 'a', kind: 'plan', payloadRef: 'x', truthLevel: 'sure' })));
  const r = kiemBodyTao({ assetId: ' a ', kind: 'model3d', payloadRef: ' https://x/y.glb ', provenance: { source: 'glb:bounds' } });
  ok('hợp lệ: trim + mặc định inferred + provenance JSON hoá', r.ok && r.data.assetId === 'a' && r.data.payloadRef === 'https://x/y.glb' && r.data.truthLevel === 'inferred' && JSON.parse(r.data.provenance).source === 'glb:bounds');
  const m = kiemBodyTao({ assetId: 'a', kind: 'bounds', payloadRef: 'inline:xAssetFamily.bounds', truthLevel: 'measured', provenance: 'chuỗi' });
  ok('measured + provenance chuỗi giữ nguyên', m.ok && m.data.truthLevel === 'measured' && m.data.provenance === 'chuỗi');
  const n = kiemBodyTao({ assetId: 'a', kind: 'plan', payloadRef: 'x' });
  ok('không provenance ⇒ chuỗi rỗng (khớp @default)', n.ok && n.data.provenance === '');
}

console.log('kiemBodyPatch');
{
  ok('{verify:true} ⇒ ok', kiemBodyPatch({ verify: true }).ok);
  ok('{verify:false} ⇒ lỗi', !kiemBodyPatch({ verify: false }).ok);
  ok('{truthLevel:"verified"} không phải đường ký ⇒ lỗi', !kiemBodyPatch({ truthLevel: 'verified' }).ok);
  ok('null ⇒ lỗi', !kiemBodyPatch(null).ok);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
