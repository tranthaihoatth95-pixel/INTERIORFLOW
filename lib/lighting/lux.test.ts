/**
 * lib/lighting/lux.test.ts — đo SỐ THẬT công thức E=(Φ·UF·MF)/A + verdict tham khảo VN_LIGHTING.
 * Chạy bằng sucrase-node như mọi *.test.ts (import tương đối, không alias @/).
 */
import {
  roomLuxEstimate,
  luxVerdict,
  roomLuxReport,
  DEFAULT_UTILIZATION_FACTOR,
  DEFAULT_MAINTENANCE_FACTOR,
} from './lux';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}
function gan(a: number, b: number, eps = 1e-9): boolean {
  return Math.abs(a - b) < eps;
}
const den = (lumens: number) => ({ lumens });

function testCongThucCoBan() {
  console.log('\n[1] Công thức cơ bản — phòng 20m², 4 đèn 800lm (ca nghiệm thu phiếu)');
  // Φ=3200 · UF=0.4 · MF=0.8 → 1024 lm hữu ích / 20 m² = 51.2 lux
  const lux = roomLuxEstimate([den(800), den(800), den(800), den(800)], 20);
  ok('mặc định UF=0.4 MF=0.8 → 51.2 lux', gan(lux, 51.2));
  ok('hằng mặc định đúng giá trị khai (0.4 / 0.8)',
    DEFAULT_UTILIZATION_FACTOR === 0.4 && DEFAULT_MAINTENANCE_FACTOR === 0.8);
  // UF=MF=1 (lý tưởng, không tổn hao) → 3200/20 = 160 lux
  ok('UF=1 MF=1 → 160 lux', gan(roomLuxEstimate([den(800), den(800), den(800), den(800)], 20, { uf: 1, mf: 1 }), 160));
  // đổi UF/MF tay: UF=0.5 MF=0.9 → 3200·0.45/20 = 72
  ok('UF=0.5 MF=0.9 → 72 lux', gan(roomLuxEstimate([den(1600), den(1600)], 20, { uf: 0.5, mf: 0.9 }), 72));
}

function testInputXau() {
  console.log('\n[2] Input xấu — không throw, không bịa số');
  ok('phòng rỗng đèn → 0 lux', roomLuxEstimate([], 20) === 0);
  ok('diện tích 0 → NaN (không có phòng 0 m²)', Number.isNaN(roomLuxEstimate([den(800)], 0)));
  ok('diện tích âm → NaN', Number.isNaN(roomLuxEstimate([den(800)], -5)));
  ok('diện tích NaN → NaN', Number.isNaN(roomLuxEstimate([den(800)], NaN)));
  // đèn lumens ≤ 0 / NaN bị bỏ qua: chỉ còn 800lm, UF=MF=1, 10m² → 80
  ok('đèn lumens ≤0/NaN bị bỏ qua', gan(roomLuxEstimate([den(800), den(-100), den(0), den(NaN)], 10, { uf: 1, mf: 1 }), 80));
  // UF ngoài [0,1] bị kẹp: uf=2 → 1 · 1000lm/10m² = 100
  ok('UF>1 kẹp về 1', gan(roomLuxEstimate([den(1000)], 10, { uf: 2, mf: 1 }), 100));
  ok('UF âm kẹp về 0 → 0 lux', roomLuxEstimate([den(1000)], 10, { uf: -3, mf: 1 }) === 0);
  ok('UF=NaN rơi về mặc định 0.4', gan(roomLuxEstimate([den(1000)], 10, { uf: NaN, mf: 1 }), 40));
}

function testVerdictThamKhao() {
  console.log('\n[3] Verdict tham khảo VN_LIGHTING — advisory, dẫn nguồn, không bịa');
  // phòng ngủ 100–150 lux
  const thieu = luxVerdict(51.2, 'bedroom');
  ok('51.2 lux phòng ngủ → below', thieu?.status === 'below');
  ok('verdict mang đúng dải 100–150', thieu?.minLux === 100 && thieu?.maxLux === 150);
  ok('verdict advisory + CHƯA verified (đúng cờ nguồn vn-lighting.ts)',
    thieu?.advisory === true && thieu?.verified === false);
  ok('verdict dẫn ruleId để UI trích nguồn', thieu?.ruleId === 'vn-lighting-bedroom-lux-reference');
  ok('source nói rõ KHÔNG phải trích TCVN', (thieu?.source ?? '').includes('KHÔNG phải trích TCVN'));
  ok('120 lux phòng ngủ → within', luxVerdict(120, 'bedroom')?.status === 'within');
  ok('200 lux phòng ngủ → above', luxVerdict(200, 'bedroom')?.status === 'above');
  // phòng khách 150–300 · bếp 300–500
  ok('160 lux phòng khách → within', luxVerdict(160, 'living')?.status === 'within');
  ok('160 lux bếp → below (dải 300–500)', luxVerdict(160, 'kitchen')?.status === 'below');
  ok('lux NaN → null, không bịa verdict', luxVerdict(NaN, 'living') === null);
}

function testReportGop() {
  console.log('\n[4] roomLuxReport — gộp ước lượng + đối chiếu');
  const r = roomLuxReport([den(800), den(800), den(800), den(800)], 20, 'bedroom');
  ok('lux khớp roomLuxEstimate (51.2)', gan(r.lux, 51.2));
  ok('verdict below', r.verdict?.status === 'below');
  const khongKind = roomLuxReport([den(800)], 10);
  ok('không truyền roomKind → verdict null, lux vẫn có', khongKind.verdict === null && Number.isFinite(khongKind.lux));
  const phongHong = roomLuxReport([den(800)], 0, 'living');
  ok('phòng 0m² → lux NaN VÀ verdict null (NaN không so được)', Number.isNaN(phongHong.lux) && phongHong.verdict === null);
}

testCongThucCoBan();
testInputXau();
testVerdictThamKhao();
testReportGop();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
