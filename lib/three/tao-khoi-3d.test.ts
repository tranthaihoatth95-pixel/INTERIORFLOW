/**
 * lib/three/tao-khoi-3d.test.ts — TOÁN THUẦN của cử chỉ dựng khối 3D.
 *
 * Vì sao tệp này tồn tại (bản 24/08 KHÔNG có): cả cử chỉ dựng khối chỉ có ĐÚNG phần này kiểm được
 * mà không cần WebGL — raycast con trỏ→mặt sàn, mesh xem trước, pointer capture đều nằm trong
 * `Scene3DViewer` và cần canvas thật. Không viết test ở đây thì cả tính năng không có một khẳng
 * định máy nào, và lỗi lệch trục/lệch đơn vị (loại lỗi đắt nhất của hệ toạ độ) sẽ chỉ lộ ra bằng
 * mắt trên app.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/three/tao-khoi-3d.test.ts
 */
import type { HatchEntity, PolylineEntity } from '../cad/model';
import {
  threeMToCadMm,
  hinhChuNhatMm,
  daGiacDeuMm,
  duLonDeGhi,
  entityTuCuChi,
  MIN_KICH_THUOC_MM,
  CYLINDER_SIDES,
  WALL_THICKNESS_MM,
  DEFAULT_HEIGHT_MM,
} from './tao-khoi-3d';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log('[1] threeMToCadMm — đổi đơn vị ĐÚNG CHIỀU (m→mm, Y-lên→Y-Bắc)');
{
  const c = threeMToCadMm({ x: 1.5, y: 2.7, z: -3 });
  ok('x: mét → milimét, giữ dấu', c.x === 1500);
  // Đây là chỗ dễ sai nhất: y_cad = −z_three. Bỏ dấu trừ thì cả mặt bằng lật gương theo trục X
  // mà hình vẫn "trông hợp lý" trong khung nhìn ⇒ không bắt được bằng mắt.
  ok('y_cad = −z_three (z=−3m → y=+3000mm)', c.y === 3000);
  ok('z_cad = y_three (cao độ)', c.z === 2700);
  const nguoc = threeMToCadMm({ x: 0, y: 0, z: 4 });
  ok('z dương → y_cad ÂM (không phải trị tuyệt đối)', nguoc.y === -4000);
  ok('làm tròn về mm nguyên', threeMToCadMm({ x: 0.00049, y: 0, z: 0 }).x === 0);
}

console.log('\n[2] ngưỡng MIN_KICH_THUOC_MM = 20 — chặn cú bấm lỡ tay');
{
  ok('ngưỡng đúng 20mm', MIN_KICH_THUOC_MM === 20);
  ok('19mm → CHẶN', duLonDeGhi(19) === false);
  ok('20mm → cho qua (biên tính là đủ)', duLonDeGhi(20) === true);
  ok('âm 25mm → cho qua (kéo ngược chiều vẫn là hình)', duLonDeGhi(-25) === true);
  ok('hai cạnh, một cạnh hụt → CHẶN', duLonDeGhi(5000, 10) === false);
  ok('hai cạnh đều đủ → cho qua', duLonDeGhi(5000, 3000) === true);
  ok('0 → CHẶN (click không kéo)', duLonDeGhi(0) === false);
}

console.log('\n[3] hinhChuNhatMm — chuẩn hoá hai góc kéo, kéo hướng nào cũng ra một hình');
{
  const xuoi = hinhChuNhatMm({ x: 0, y: 0 }, { x: 3000, y: 2000 });
  const nguoc = hinhChuNhatMm({ x: 3000, y: 2000 }, { x: 0, y: 0 });
  ok('4 đỉnh', xuoi.length === 4);
  ok('bắt đầu từ góc (min,min)', xuoi[0].x === 0 && xuoi[0].y === 0);
  ok('kéo ngược chiều ra ĐÚNG cùng một hình', JSON.stringify(xuoi) === JSON.stringify(nguoc));
  ok('cạnh 1 đi theo X (không phải đường chéo)', xuoi[1].x === 3000 && xuoi[1].y === 0);
  ok('đỉnh đối là (max,max)', xuoi[2].x === 3000 && xuoi[2].y === 2000);
}

console.log('\n[4] daGiacDeuMm — đủ 32 đỉnh, khép kín, nội tiếp đúng bán kính');
{
  const r = 1000;
  const p = daGiacDeuMm({ x: 500, y: -700 }, r);
  ok(`đúng ${CYLINDER_SIDES} đỉnh`, p.length === CYLINDER_SIDES);
  // KHÉP KÍN = vòng tròn KHÔNG lặp lại điểm đầu ở cuối (polyline mang cờ `closed`, xem
  // `ellipsePoints`). Lặp điểm là lỗi thật: `prism()` sẽ dựng một mặt bên suy biến.
  ok('không lặp điểm đầu ở cuối', p[0].x !== p[p.length - 1].x || p[0].y !== p[p.length - 1].y);
  const dTuTam = p.map((q) => Math.hypot(q.x - 500, q.y + 700));
  ok('mọi đỉnh nằm trên đường tròn bán kính r (sai số làm tròn ≤1mm)', dTuTam.every((d) => Math.abs(d - r) <= 1));
  // Chu vi đa giác 32 cạnh = 2πr·sin(π/32)/(π/32) ≈ 0,9984·2πr — kiểm để bắt trường hợp vòng lặp
  // chỉ chạy nửa vòng (i/n thay vì i/n*2π), lỗi này vẫn cho ra đủ 32 đỉnh nên đếm không bắt được.
  let chuVi = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    chuVi += Math.hypot(b.x - a.x, b.y - a.y);
  }
  ok('chu vi ≈ 99,8% chu vi đường tròn (vòng lặp đi TRỌN 2π)', Math.abs(chuVi / (2 * Math.PI * r) - 0.9984) < 0.005);
  ok('bán kính 0 được kẹp lên 1mm, không sinh NaN', daGiacDeuMm({ x: 0, y: 0 }, 0).every((q) => Number.isFinite(q.x) && Number.isFinite(q.y)));
  ok('mm nguyên', p.every((q) => Number.isInteger(q.x) && Number.isInteger(q.y)));
}

console.log('\n[5] entityTuCuChi — đường bao đúng elementType, và ĐI QUA tool3d (không engine thứ hai)');
{
  const kiem = (nhan: string, ents: ReturnType<typeof entityTuCuChi>) => {
    const hatch = ents.find((e) => e.type === 'hatch') as HatchEntity | undefined;
    const outline = ents.find((e) => e.type === 'polyline') as PolylineEntity | undefined;
    ok(`${nhan}: đúng 1 hatch + 1 polyline`, ents.length === 2 && !!hatch && !!outline);
    if (!hatch || !outline) return;
    // `docToObjScene` lọc khối đùn được ở `cad-to-obj.ts:579-581` bằng ĐÚNG hai điều kiện này.
    // Sai một trong hai thì khối ghi vào Doc mà khung nhìn không dựng ra gì.
    ok(`${nhan}: hatch elementType='wall'`, hatch.elementType === 'wall');
    ok(`${nhan}: hatch solid`, hatch.solid === true);
    ok(`${nhan}: outline elementType='wall' + closed`, outline.elementType === 'wall' && outline.closed === true);
    ok(`${nhan}: hatch neo vào outline qua hostId (dời nửa không rách khối)`, hatch.hostId === outline.id);
    ok(`${nhan}: cả hai mang heightMm`, hatch.heightMm === DEFAULT_HEIGHT_MM && outline.heightMm === DEFAULT_HEIGHT_MM);
    ok(`${nhan}: đúng layer nơi gọi đưa vào`, hatch.layer === 'L-TEST' && outline.layer === 'L-TEST');
    ok(`${nhan}: id hatch ≠ id outline`, hatch.id !== outline.id);
  };

  kiem('tường', entityTuCuChi({ tool: 'wall', aMm: { x: 0, y: 0 }, bMm: { x: 4000, y: 0 }, thicknessMm: WALL_THICKNESS_MM, heightMm: DEFAULT_HEIGHT_MM }, 'L-TEST'));
  kiem('hộp', entityTuCuChi({ tool: 'box', aMm: { x: 0, y: 0 }, bMm: { x: 3000, y: 2000 }, heightMm: DEFAULT_HEIGHT_MM }, 'L-TEST'));
  kiem('trụ', entityTuCuChi({ tool: 'cylinder', centerMm: { x: 0, y: 0 }, radiusMm: 600, heightMm: DEFAULT_HEIGHT_MM }, 'L-TEST'));
}

console.log('\n[6] entityTuCuChi — hình học ra đúng vật, không lệch loại');
{
  const tuong = entityTuCuChi({ tool: 'wall', aMm: { x: 0, y: 0 }, bMm: { x: 4000, y: 0 }, thicknessMm: 200, heightMm: 2700 }, 'L');
  const tHatch = tuong.find((e) => e.type === 'hatch') as HatchEntity;
  ok('tường: quad 4 đỉnh', tHatch.points.length === 4);
  ok('tường: mang wallThicknessMm THẬT (số vào BOQ, không bịa)', tHatch.wallThicknessMm === 200);
  const beRong = Math.max(...tHatch.points.map((p) => p.y)) - Math.min(...tHatch.points.map((p) => p.y));
  ok('tường: bề dày trải đúng 200mm ngang trục vẽ', beRong === 200);

  const hop = entityTuCuChi({ tool: 'box', aMm: { x: 3000, y: 2000 }, bMm: { x: 0, y: 0 }, heightMm: 2700 }, 'L');
  const hHatch = hop.find((e) => e.type === 'hatch') as HatchEntity;
  ok('hộp: 4 đỉnh', hHatch.points.length === 4);
  ok('hộp: kéo NGƯỢC vẫn ra hình dương 3000×2000, không âm', Math.max(...hHatch.points.map((p) => p.x)) === 3000 && Math.min(...hHatch.points.map((p) => p.x)) === 0);
  // Hộp KHÔNG có khái niệm bề dày tường — để số bịa ở đó là chảy thẳng vào bảng khối lượng.
  ok('hộp: KHÔNG mang wallThicknessMm', hHatch.wallThicknessMm === undefined);

  const tru = entityTuCuChi({ tool: 'cylinder', centerMm: { x: 100, y: 100 }, radiusMm: 600, heightMm: 2700 }, 'L');
  const cHatch = tru.find((e) => e.type === 'hatch') as HatchEntity;
  ok(`trụ: đáy ${CYLINDER_SIDES} cạnh (cùng số với đường xem trước)`, cHatch.points.length === CYLINDER_SIDES);
  ok('trụ: KHÔNG mang wallThicknessMm', cHatch.wallThicknessMm === undefined);
  const dMax = Math.max(...cHatch.points.map((p) => Math.hypot(p.x - 100, p.y - 100)));
  ok('trụ: bán kính đúng 600mm', Math.abs(dMax - 600) < 1);
}

console.log('\n[7] xem trước ≡ kết quả — đa giác vẽ ra và đa giác ghi vào Doc là một');
{
  // Đây là bất biến giữ cho người dùng không bị "kéo ra hình này, thả ra hình khác".
  const xemTruoc = daGiacDeuMm({ x: 0, y: 0 }, 600);
  const ghi = (entityTuCuChi({ tool: 'cylinder', centerMm: { x: 0, y: 0 }, radiusMm: 600, heightMm: 2700 }, 'L')
    .find((e) => e.type === 'hatch') as HatchEntity).points;
  ok('cùng số đỉnh', xemTruoc.length === ghi.length);
  ok('mọi đỉnh trùng nhau trong 1mm (chỉ khác phần làm tròn)', xemTruoc.every((p, i) => Math.abs(p.x - ghi[i].x) <= 1 && Math.abs(p.y - ghi[i].y) <= 1));

  const xtHop = hinhChuNhatMm({ x: 500, y: 500 }, { x: -1500, y: 2500 });
  const ghiHop = (entityTuCuChi({ tool: 'box', aMm: { x: 500, y: 500 }, bMm: { x: -1500, y: 2500 }, heightMm: 2700 }, 'L')
    .find((e) => e.type === 'hatch') as HatchEntity).points;
  ok('hộp: xem trước và bản ghi trùng khít từng đỉnh', JSON.stringify(xtHop) === JSON.stringify(ghiHop));
}

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
