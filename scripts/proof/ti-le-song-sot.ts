/** Khám đường thật: DXF của Hoà → Doc → 3D → BOQ. Chạy đúng mã sản xuất. */
import { readFileSync } from 'node:fs';
import { parseDxfEx } from '../../lib/cad/dxf';
import { docToObjScene } from '../../lib/three/cad-to-obj';

const duong = process.argv[2];
const t0 = Date.now();
const raw = readFileSync(duong, 'latin1');
console.log(`TỆP  ${duong.split('/').pop()}  ${(raw.length/1048576).toFixed(2)} MB`);

let doc: any, report: any;
try {
  const kq = parseDxfEx(raw);
  doc = kq.doc; report = kq.report;
} catch (e: any) {
  console.log(`🔴 CHẾT Ở BƯỚC 1 — đọc DXF: ${e.message}`);
  process.exit(1);
}
const tParse = Date.now() - t0;
const loai: Record<string, number> = {};
for (const e of doc.entities) loai[e.type] = (loai[e.type] ?? 0) + 1;
console.log(`\n① ĐỌC DXF  ${tParse} ms`);
console.log(`   entity dựng được : ${doc.entities.length}`);
console.log(`   layer            : ${doc.layers?.length ?? 0}`);
console.log(`   loại             : ${Object.entries(loai).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}×${v}`).join(' · ') || '(không có)'}`);
if (report) {
  const bo = (report as any).skipped ?? (report as any).skippedCount;
  console.log(`   BỎ QUA           : ${bo ?? '?'}`);
  const w = (report as any).warnings ?? [];
  if (w.length) console.log(`   cảnh báo         : ${w.slice(0,3).join(' | ')}`);
}

const t1 = Date.now();
let scene: any;
try {
  scene = docToObjScene(doc, {});
} catch (e: any) {
  console.log(`\n🔴 CHẾT Ở BƯỚC 2 — dựng 3D: ${e.message}`);
  process.exit(1);
}
const g = scene.groups ?? scene.scene?.groups ?? [];
console.log(`\n② DỰNG 3D  ${Date.now()-t1} ms`);
console.log(`   nhóm khối 3D     : ${g.length}`);
const theoTen: Record<string, number> = {};
for (const x of g) { const k = String(x.name).split('_')[0]; theoTen[k]=(theoTen[k]??0)+1; }
console.log(`   phân loại        : ${Object.entries(theoTen).map(([k,v])=>`${k}×${v}`).join(' · ') || '(RỖNG)'}`);
if (scene.warnings?.length) console.log(`   cảnh báo         : ${scene.warnings.slice(0,3).join(' | ')}`);
console.log(`\nTỔNG ${Date.now()-t0} ms`);

// tên layer thật trong bản vẽ của Hoà
console.log('\n③ LAYER THẬT:', (doc.layers ?? []).map((l: any) => l.name ?? l.id).join(' · '));
