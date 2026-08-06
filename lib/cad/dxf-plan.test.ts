/**
 * lib/cad/dxf-plan.test.ts — VIỆC 4 phiếu DXF Nam Long (05/08).
 * Chạy: `node_modules/.bin/sucrase-node lib/cad/dxf-plan.test.ts`
 *
 * Doc dựng bằng tay theo ĐÚNG hình dạng đo được ở 6 file thật (tên layer `A-Column`/`E-DimTruc`/
 * `E-Stair`/`E-Wc`/`defpoints`, nhãn trục B·B1·C·D·2D·E, khung giấy trên `defpoints`).
 */

import type { Doc, Entity, Layer } from './model';
import {
  mainClusterBox, planGridAxes, planCoreZones, planDeclaredAreaM2, planAreaCrossCheck,
} from './dxf-plan';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean, extra = '') {
  if (cond) { pass++; console.log(`  ok  - ${name}`); }
  else { fail++; console.log(`  FAIL - ${name}${extra ? ` — ${extra}` : ''}`); }
}

const LAYS = ['A-Column', 'A-Wall', 'E-DimTruc', 'E-Stair', 'E-Wc', 'defpoints', 'A-Par-Glass'];
const layers: Layer[] = LAYS.map((n) => ({ id: `l-${n}`, name: n, color: '#fff', visible: true, locked: false }));
let n = 0;
const id = () => `e${++n}`;
const line = (layer: string, x1: number, y1: number, x2: number, y2: number): Entity =>
  ({ id: id(), type: 'line', layer: `l-${layer}`, a: { x: x1, y: y1 }, b: { x: x2, y: y2 } });
const text = (layer: string, x: number, y: number, t: string): Entity =>
  ({ id: id(), type: 'text', layer: `l-${layer}`, at: { x, y }, text: t, h: 250 });
const poly = (layer: string, pts: [number, number][], closed = true): Entity =>
  ({ id: id(), type: 'polyline', layer: `l-${layer}`, points: pts.map(([x, y]) => ({ x, y })), closed });
const doc = (entities: Entity[]): Doc => ({ entities, layers });

console.log('\n[1] Cụm vẽ chính — bỏ bản sao parked xa (ca thật 04_TANG8: cách 12 km)');
{
  const near = [line('A-Column', 0, 0, 30_000, 0), line('A-Wall', 0, 0, 0, 25_000), line('A-Wall', 30_000, 0, 30_000, 25_000)];
  const far = [line('A-Wall', 12_000_000, 0, 12_010_000, 0), line('A-Wall', -2_700_000, 12_500_000, -2_690_000, 12_500_000)];
  const r = mainClusterBox(doc([...near, ...far]));
  ok('dựng được cụm', !!r);
  ok('khung bao ~30×25 m, không dính bản sao xa', !!r && r.box.maxX - r.box.minX === 30_000 && r.box.maxY - r.box.minY === 25_000,
    r ? `${r.box.maxX - r.box.minX}×${r.box.maxY - r.box.minY}` : '');
  ok('đếm đúng số hình bị loại', r?.droppedFar === 2, String(r?.droppedFar));
}
{
  ok('doc không có layer công trình nào → null, không sập', mainClusterBox(doc([text('E-DimTruc', 0, 0, 'B')])) === null);
}

console.log('\n[2] Lưới cột — nhãn trục thật của Nam Long');
{
  // trục X: nhãn chữ nằm CÙNG HÀNG (y = -28100), khoảng cách theo đúng nhịp đo được
  const xs: [string, number][] = [['B', 197_500], ['B1', 199_628], ['C', 205_890], ['D', 214_240], ['2D', 220_168], ['E', 222_700]];
  const ys: [string, number][] = [['6', -24_500], ['5', -16_096], ['4', -7_704], ['3', -4_826], ['2', -1_880]];
  const ents = [
    ...xs.map(([t, x]) => text('E-DimTruc', x, -28_100, t)),
    ...ys.map(([t, y]) => text('E-DimTruc', 194_200, y, t)),
    text('E-DimTruc', 210_000, -10_000, 'PANTRY'), // tên phòng — KHÔNG được coi là nhãn trục
  ];
  const g = planGridAxes(doc(ents));
  ok('đủ 6 trục chữ, đúng thứ tự trái→phải', g.xAxes.map((a) => a.label).join(' ') === 'B B1 C D 2D E', g.xAxes.map((a) => a.label).join(' '));
  ok('đủ 5 trục số, đúng thứ tự dưới→trên', g.yAxes.map((a) => a.label).join(' ') === '6 5 4 3 2', g.yAxes.map((a) => a.label).join(' '));
  ok('nhịp X đúng từng bước', JSON.stringify(g.xSpansMm) === JSON.stringify([2128, 6262, 8350, 5928, 2532]), JSON.stringify(g.xSpansMm));
  ok('TỔNG nhịp X = 25.200 mm (khớp số phiếu ghi)', g.xSpansMm.reduce((s, v) => s + v, 0) === 25_200, String(g.xSpansMm.reduce((s, v) => s + v, 0)));
  ok('chữ dài (tên phòng) không lọt vào trục', !g.xAxes.some((a) => a.label === 'PANTRY') && !g.yAxes.some((a) => a.label === 'PANTRY'));
}
{
  const g = planGridAxes(doc([line('A-Wall', 0, 0, 1, 1)]));
  ok('không có nhãn trục → mảng rỗng + cảnh báo, không đoán', g.xAxes.length === 0 && g.warnings.length > 0);
}

console.log('\n[3] Lõi cứng — tách cụm, hai buồng thang hai đầu không gộp làm một');
{
  const ents = [
    line('E-Stair', 0, 0, 3200, 0), line('E-Stair', 0, 0, 0, 3000),
    line('E-Stair', 40_000, 0, 43_200, 0), line('E-Stair', 40_000, 0, 40_000, 3000),
    line('E-Wc', 10_000, 10_000, 21_700, 10_000), line('E-Wc', 10_000, 10_000, 10_000, 18_200),
  ];
  const zones = planCoreZones(doc(ents));
  ok('ra 3 vùng lõi (2 thang + 1 WC), không gộp', zones.length === 3, String(zones.length));
  const stairs = zones.filter((z) => z.layer === 'E-Stair');
  ok('2 buồng thang tách riêng', stairs.length === 2, String(stairs.length));
  ok('vùng lớn nhất đứng đầu (WC 11,7×8,2 m)', zones[0].layer === 'E-Wc', zones[0].layer);
  ok('mỗi vùng khai layer nguồn', zones.every((z) => LAYS.includes(z.layer)));
}

/* §0h — MỌI SỐ DƯỚI ĐÂY LÀ HƯ CẤU (sàn 500 m² tròn, khung giấy 40×25 m).
 * Bản đầu của file này dùng đúng diện tích sàn thật + đúng kích thước khung giấy thật của bộ hồ sơ
 * khách. Đó là "số liệu dự án" — §0h HG3 xếp vào cột CẤM, và phép kiểm §0h #2 đòi grep số liệu
 * khách trong `lib/` ra 0. Số cụ thể nằm ở `docs/CHOT-DIEN-TICH-NAMLONG-2026-08-05.md` mục 1 —
 * đúng chỗ của nó. HÌNH DẠNG bài kiểm không đổi, chỉ đổi con số. */
console.log('\n[4] Diện tích khai trong khung tên');
{
  ok('đọc "500 m2"', planDeclaredAreaM2(doc([text('A-Par-Glass', 0, 0, '500 m2')]))?.areaM2 === 500);
  ok('đọc "1.234,5 m²" kiểu VN', planDeclaredAreaM2(doc([text('A-Par-Glass', 0, 0, '1.234,5 m²')]))?.areaM2 === 1234.5);
  ok('không có thì trả null, không đoán', planDeclaredAreaM2(doc([text('A-Par-Glass', 0, 0, 'PANTRY')])) === null);
}

console.log('\n[5] Đối chiếu diện tích — KHÔNG bịa số khi thiếu đường bao (K3/N4)');
{
  // Đúng hình dạng 6 file thật: chỉ có khung giấy trên defpoints, không có ranh giới sàn.
  const ents = [
    text('A-Par-Glass', 0, 0, '500 m2'),
    poly('defpoints', [[0, 0], [40_000, 0], [40_000, 25_000], [0, 25_000]]),
    line('A-Column', 0, 0, 30_000, 0), line('A-Wall', 0, 0, 0, 25_000),
  ];
  const cc = planAreaCrossCheck(doc(ents));
  ok('đọc được số khai', cc.declaredM2 === 500);
  ok('KHÔNG trả diện tích tự tính khi chỉ có khung giấy', cc.computedM2 === null && cc.method === 'none', `${cc.computedM2}/${cc.method}`);
  ok('không gắn cờ nghi ngờ sai (vì chưa so được, khác với "so xong thấy lệch")', cc.suspect === false);
  ok('ghi lý do rõ ràng', cc.notes.some((t) => t.includes('đường bao')), JSON.stringify(cc.notes));
}
{
  // Có ranh giới thật, khớp số khai → không nghi ngờ.
  const ents = [
    text('A-Par-Glass', 0, 0, '500 m2'),
    poly('A-Wall', [[0, 0], [30_000, 0], [30_000, 16_700], [0, 16_700]]),
    line('A-Column', 0, 0, 30_000, 0),
  ];
  const cc = planAreaCrossCheck(doc(ents));
  ok('tính được diện tích từ đường bao khép kín', cc.method === 'closedBoundary' && Math.abs((cc.computedM2 ?? 0) - 501) < 1, String(cc.computedM2));
  ok('lệch dưới 3% → không nghi ngờ', cc.suspect === false, String(cc.deltaPercent));
}
{
  const ents = [
    text('A-Par-Glass', 0, 0, '500 m2'),
    poly('A-Wall', [[0, 0], [30_000, 0], [30_000, 20_000], [0, 20_000]]), // 600 m² = +20,0%
    line('A-Column', 0, 0, 30_000, 0),
  ];
  const cc = planAreaCrossCheck(doc(ents));
  ok('lệch quá 3% → gắn cờ nghi ngờ + ghi số lệch', cc.suspect === true && Math.abs((cc.deltaPercent ?? 0) - 20.0) < 0.1, String(cc.deltaPercent));

  /* VIỆC 2 phiếu S1 (05/08) — KHOÁ CÂU CHỮ.
   * `docs/CHOT-DIEN-TICH-NAMLONG-2026-08-05.md` mục 2 chốt: hàm này KHÔNG phát hiện lỗi parser,
   * nó phát hiện RÁC TRONG FILE GỐC (định nghĩa block copy từ file khác còn sót trong BLOCKS,
   * mang con số của bản vẽ nguồn). Câu cũ — "nghi nạp thiếu hình hoặc chọn nhầm đường bao" — đổ
   * lỗi cho bộ đọc, khiến người dùng đi sửa nhầm thứ. */
  const note = cc.notes.join(' ');
  ok('cảnh báo NÊU ĐÚNG nghi vấn: block mồ côi từ file nguồn khác', note.includes('block mồ côi'), note);
  ok('cảnh báo BẢO ĐỐI CHIẾU KHUNG TÊN PDF', /đối chiếu khung tên trong PDF/i.test(note), note);
  ok('cảnh báo TUYỆT ĐỐI không đổ lỗi cho bộ đọc',
    !/nạp sai|nạp thiếu|lỗi đọc file|đọc sai/i.test(note), note);
  ok('vẫn giữ con số lệch để người dùng tự lượng định', /20\.0%/.test(note), note);
}

console.log(`\ndxf-plan.test.ts — ${pass} pass, ${fail} fail`);
if (fail) process.exitCode = 1;
