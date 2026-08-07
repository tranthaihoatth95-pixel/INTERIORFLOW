/**
 * lib/review/luat/rules-3d.test.ts — kiểm LỚP LUẬT chặng 3D + hợp đồng hai-lớp của khung review.
 * Chạy: node_modules/.bin/sucrase-node lib/review/luat/rules-3d.test.ts
 * (import TƯƠNG ĐỐI toàn chuỗi — cùng lý do boq-group.ts từng vỡ vì alias '@/').
 */
import { luat3d, luatDenHinhHoc, luatDoRoi, luatKhoiHo, UF_UOC_LUONG } from './rules-3d';
import { luatCad } from './cad';
import { gopy } from '../gopy';
import { review3d } from '../index';
import { emptyDoc } from '../../cad/model';
import type { Doc, LineEntity, TextEntity, PolylineEntity } from '../../cad/model';
import { DEFAULT_SUN, DEFAULT_SKY, type RoomLight } from '../../three/lighting';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

let seq = 0;
const eid = () => `e-test-${++seq}`;

function rectWalls(x0: number, y0: number, x1: number, y1: number): LineEntity[] {
  const p = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
  return [0, 1, 2, 3].map((i) => ({ id: eid(), type: 'line' as const, layer: 'l-wall', a: p[i], b: p[(i + 1) % 4] }));
}
function label(at: { x: number; y: number }, text: string): TextEntity {
  return { id: eid(), type: 'text', layer: 'l-text', at, text, h: 200 };
}
function den(id: string, x: number, y: number, lumens: number): RoomLight {
  return { id, kind: 'ceiling', posMm: { x, y, z: 2600 }, lumens, colorK: 4000 };
}
function docPhongNgu(lights: RoomLight[], altitudeDeg = 45): Doc {
  const doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 3000, 3000));
  doc.entities.push(label({ x: 1500, y: 1500 }, 'PHÒNG NGỦ'));
  doc.lighting = { sun: { ...DEFAULT_SUN, altitudeDeg }, sky: { ...DEFAULT_SKY }, rooms: lights };
  return doc;
}

console.log('\n[1] TẤT ĐỊNH — cùng doc chạy 10 lần ra 10 kết quả y hệt (khác lớp góp ý AI)');
{
  const doc = docPhongNgu([den('L1', 1500, 1500, 500), den('L2', 9000, 9000, 800)], -5);
  const poly: PolylineEntity = { id: 'p-ho', type: 'polyline', layer: 'l-wall', points: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 1000 }], closed: false, heightMm: 2700 } as PolylineEntity;
  doc.entities.push(poly);
  const first = JSON.stringify(luat3d(doc));
  let deterministic = true;
  for (let i = 0; i < 9; i++) if (JSON.stringify(luat3d(doc)) !== first) deterministic = false;
  ok('10 lần chạy → 10 chuỗi JSON giống hệt', deterministic);
  ok('có finding thật để phép so không rỗng', JSON.parse(first).length >= 2);
}

console.log('\n[2] (a) đèn ngoài mặt bằng — báo đúng đèn, đèn trong không báo');
{
  const f = luatDenHinhHoc(docPhongNgu([den('trong', 1500, 1500, 500), den('ngoai', 9000, 9000, 500)]));
  ok('đèn 9000,9000 ngoài nhà 3×3m bị báo', f.some((x) => x.ruleId === 'r3d-den-ngoai-mat-bang' && x.moTa.includes('ngoai')));
  ok('đèn trong nhà KHÔNG bị báo', !f.some((x) => x.ruleId === 'r3d-den-ngoai-mat-bang' && x.moTa.includes('trong')));
}

console.log('\n[3] (a) mặt trời lặn + 0 đèn → cảnh tối; có đèn thì thôi');
{
  ok('lặn + 0 đèn → r3d-canh-toi-den', luatDenHinhHoc(docPhongNgu([], -10)).some((x) => x.ruleId === 'r3d-canh-toi-den'));
  ok('lặn + có đèn → không báo', !luatDenHinhHoc(docPhongNgu([den('L', 1500, 1500, 500)], -10)).some((x) => x.ruleId === 'r3d-canh-toi-den'));
}

console.log('\n[4] (b) độ rọi nối vn-lighting — phòng ngủ 9m², minLux 100');
{
  // 500lm × UF / 9m² ≈ 22 lux < 100 → báo; 5000lm ≈ 222 lux > 100 → không báo thiếu.
  const thieu = luatDoRoi(docPhongNgu([den('L', 1500, 1500, 500)]));
  const du = luatDoRoi(docPhongNgu([den('L', 1500, 1500, 5000)]));
  const f = thieu.find((x) => x.ruleId === 'r3d-do-roi-bedroom');
  ok('500lm/9m² dưới mức → báo vàng', !!f && f.muc === 'vang');
  ok('finding mang chuaKiemChung (rule gốc verified:false + UF ước lượng)', f?.chuaKiemChung === true);
  ok('nguồn ghi rõ công thức ước lượng', !!f?.nguon.includes(String(UF_UOC_LUONG)));
  ok('5000lm/9m² đủ → không báo', !du.some((x) => x.ruleId === 'r3d-do-roi-bedroom'));
}

console.log('\n[5] (c) khối hở — polyline heightMm không khép kín');
{
  const doc = emptyDoc();
  const ho: PolylineEntity = { id: 'p-ho', type: 'polyline', layer: 'l-wall', points: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 1000 }], closed: false, heightMm: 2700 } as PolylineEntity;
  const kin: PolylineEntity = { id: 'p-kin', type: 'polyline', layer: 'l-wall', points: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 1000 }], closed: true, heightMm: 2700 } as PolylineEntity;
  doc.entities.push(ho, kin);
  const f = luatKhoiHo(doc);
  ok('đường hở đùn cao → r3d-khoi-ho', f.some((x) => x.ruleId === 'r3d-khoi-ho' && x.viTri?.entityId === 'p-ho'));
  ok('đường kín không báo', !f.some((x) => x.viTri?.entityId === 'p-kin'));
  ok('có cách sửa cụ thể (UI hiện nút Sửa)', f.every((x) => x.ruleId !== 'r3d-khoi-ho' || !!x.cachSua));
}

console.log('\n[6] HAI LỚP TÁCH — góp ý bị chặn có lý do, không trộn vào lớp luật');
{
  const g = gopy('3d', null);
  ok('chưa có đề bài → findings rỗng + lý do chặn', g.findings.length === 0 && !!g.biChan?.includes('đề bài'));
  const r = review3d({ doc: docPhongNgu([], -10), deBai: null });
  ok('review3d: luat[] có finding, gopy[] rỗng, gopyBiChan có lý do', r.luat.length > 0 && r.gopy.length === 0 && !!r.gopyBiChan);
  ok('mọi finding lớp luật đều dẫn được nguồn', r.luat.every((x) => x.nguon.length > 0));
  ok('kiểu FindingGopy không có chỗ khai mức đỏ/vàng (kiểm compile-time — dòng này chỉ xác nhận runtime rỗng)', r.gopy.every((x) => !('muc' in x)));
}

console.log('\n[7] adapter 2D — Violation của checker dịch đủ trường');
{
  const doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 2500, 3000));
  doc.entities.push(label({ x: 1250, y: 1500 }, 'PHÒNG NGỦ'));
  const f = luatCad(doc);
  const v = f.find((x) => x.ruleId === 'vn-res-bedroom-min-area');
  ok('phòng ngủ 7.5m² → finding lớp luật', !!v);
  ok('muc thuộc {do, vang}', f.every((x) => x.muc === 'do' || x.muc === 'vang'));
  ok('vị trí zoom-tới đi theo', !!v?.viTri?.mm);
}

console.log(`\nKẾT QUẢ: ${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
