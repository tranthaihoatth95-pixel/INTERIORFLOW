/**
 * lib/vision/to-cad.test.ts — CẦU NỐI ⑤/⑥ → bản vẽ (G-M3-03).
 *
 * Trọng tâm KHÔNG phải "có ra hình không" mà là ba luật dễ vỡ nhất khi nối dây:
 *   [1] khớp được mẫu ⇒ nét mẫu ĐÃ KÉO GIÃN đúng số đo, không phải hộp bao;
 *   [2] trượt ngưỡng ⇒ vẫn ra hình (hộp bao) + NÓI THẬT điểm gần nhất + đẻ MỘT DÒNG VIỆC cho
 *       thư viện — cấm im lặng;
 *   [3] ba hình chiếu xếp KHÔNG chồng nhau và món rời (`FfeItem`) mang đủ số đo + độ tin cậy để
 *       lên được bảng FF&E/BOQ.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/vision/to-cad.test.ts
 */
import {
  buildFurnitureFromMeasurement,
  orthoViewsToEntities,
  measurementToTarget,
  measurementConfidence,
  ORTHO_GAP_MM,
} from './to-cad';
import { DEFAULT_MATCH_THRESHOLD } from './match-template';
import type { MeasurementResult, MeasurementValue } from './single-view-metrology';
import { __resetFfeIdSeq } from '../ffe/item';

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

const mv = (valueMm: number, toleranceMm: number, kind: 'measured' | 'inferred', basis = 'test'): MeasurementValue => ({
  valueMm, toleranceMm, kind, basis,
});

/** Ghế bành: rộng 900 · sâu 850 · cao 800 — cỡ nằm đúng dải mẫu `armchair` trong BLOCKS. */
const ARMCHAIR: MeasurementResult = {
  width: mv(900, 27, 'measured', 'Điểm chạm sàn trái/phải mặt nạ.'),
  depth: mv(850, 300, 'inferred', 'Không thấy mặt bên — ước lượng theo tỉ lệ.'),
  height: mv(800, 24, 'measured', 'Đáy chạm sàn → đỉnh mặt nạ.'),
};

/** Vật cỡ quái dị, không mẫu nào gần: dài 4200 · sâu 120 · cao 2400. */
const ODDITY: MeasurementResult = {
  width: mv(4200, 100, 'measured'),
  depth: mv(120, 40, 'measured'),
  height: mv(2400, 60, 'measured'),
};

/* ── [1] khớp được mẫu ⇒ nét mẫu kéo giãn ĐÚNG số đo ── */
function testMatched() {
  console.log('\n[1] Khớp được mẫu → entity thật trên bản vẽ, đúng cỡ đã đo');
  __resetFfeIdSeq();
  const r = buildFurnitureFromMeasurement({ measurement: ARMCHAIR, at: { x: 0, y: 0 }, category: 'armchair' });

  ok('có khớp mẫu (điểm ≥ ngưỡng)', r.match !== null && r.bestScore >= DEFAULT_MATCH_THRESHOLD);
  ok('KHÔNG rơi về hộp bao', r.usedFallback === false);
  ok('sinh ra entity thật', r.entities.length > 0);
  ok('entity nằm ở layer nội thất', r.entities.every((e) => e.layer === 'l-furniture'));
  ok('mọi entity có id (luật #5: không id thì không ship)', r.entities.every((e) => !!e.id));
  ok('câu báo nói rõ giống mẫu nào bao nhiêu %', /giống mẫu/i.test(r.label) && /%/.test(r.label));
  ok('khớp được thì KHÔNG đẻ dòng việc cho thư viện', r.request === null);

  // Nét đã kéo giãn phải nằm gọn trong khung rộng×sâu đã đo (±1mm sai số làm tròn).
  const pts: { x: number; y: number }[] = [];
  for (const e of r.entities) {
    if (e.type === 'polyline') pts.push(...e.points);
    else if (e.type === 'line') pts.push(e.a, e.b);
    else if (e.type === 'circle' || e.type === 'arc') pts.push({ x: e.c.x - e.r, y: e.c.y - e.r }, { x: e.c.x + e.r, y: e.c.y + e.r });
  }
  const w = Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));
  const d = Math.max(...pts.map((p) => p.y)) - Math.min(...pts.map((p) => p.y));
  ok(`bề rộng nét ≈ 900mm đã đo (đo được ${w.toFixed(1)})`, Math.abs(w - 900) <= 1);
  ok(`bề sâu nét ≈ 850mm đã đo (đo được ${d.toFixed(1)})`, Math.abs(d - 850) <= 1);
}

/* ── [2] trượt ngưỡng ⇒ vẫn ra hình + NÓI THẬT + đẻ dòng việc ── */
function testFallbackNeverSilent() {
  console.log('\n[2] ⛔ Không khớp được mẫu — cấm im lặng');
  __resetFfeIdSeq();
  // Có khai loại đồ ⇒ chấm được ≥2 tiêu chí, nhưng cỡ quái dị ⇒ điểm thấp, trượt ngưỡng thật.
  const r = buildFurnitureFromMeasurement({ measurement: ODDITY, at: { x: 1000, y: 2000 }, category: 'armchair', now: 1700000000000 });

  ok('không nhận mẫu nào (dưới ngưỡng)', r.match === null);
  ok('VẪN ra hình để làm việc tiếp (hộp bao)', r.entities.length > 0 && r.usedFallback === true);
  ok('câu báo nói rõ đây là khối tạm', /khối tạm/i.test(r.label));
  ok('câu báo nói THẬT điểm mẫu gần nhất', /gần nhất mới \d+%/.test(r.label));
  ok('đẻ MỘT DÒNG VIỆC cho thư viện (không thất bại im lặng)', r.request !== null);
  ok('dòng việc mang đúng ba số đo', r.request!.dims.widthMm === 4200 && r.request!.dims.depthMm === 120 && r.request!.dims.heightMm === 2400);
  ok('dòng việc dùng mốc thời gian CALLER truyền (test tất định)', r.request!.requestedAt === 1700000000000);

  const xs = r.entities.flatMap((e) => (e.type === 'polyline' ? e.points.map((p) => p.x) : []));
  ok('hộp bao thả ĐÚNG điểm yêu cầu (tâm x=1000)', Math.abs((Math.max(...xs) + Math.min(...xs)) / 2 - 1000) < 1);
}

/* ── [2b] BẪY ĐÃ ĐO ĐƯỢC: không khai loại đồ ⇒ chỉ còn 1 tiêu chí ⇒ "giống 100%" giả ── */
function testThinEvidenceRejected() {
  console.log('\n[2b] ⛔ Điểm khớp chỉ dựa trên MỘT tiêu chí thì KHÔNG được nhận');
  __resetFfeIdSeq();
  // Y hệt ca [2] nhưng KHÔNG khai `category`: engine chỉ chấm được tỉ lệ mặt bằng, trọng số dồn
  // hết vào nó ⇒ điểm 100% với một cái "Gương". Cửa tiêu thụ phải từ chối.
  const r = buildFurnitureFromMeasurement({ measurement: ODDITY, at: { x: 0, y: 0 }, now: 1 });

  ok('engine VẪN chấm điểm rất cao (bằng chứng bẫy có thật)', r.bestScore >= 0.95);
  ok('cầu nối gắn cờ chứng cứ mỏng', r.thinEvidence === true);
  ok('KHÔNG nhận mẫu dù điểm 100%', r.match === null && r.usedFallback === true);
  ok('câu báo KHÔNG khoe số % giả', !/\d+%/.test(r.label));
  ok('câu báo nói đúng lý do (mới khớp được tỉ lệ)', /tỉ lệ/.test(r.label));
  ok('vẫn đẻ dòng việc cho thư viện', r.request !== null);
}

/* ── [2c] 🔴 SỐ ĐO HỎNG — vòng kiểm phản biện 06/08 đo được: bản đầu ra entity với 4/4 điểm
       KHÔNG HỮU HẠN mà vẫn báo thành công. Entity NaN vào Doc phá render/DXF, và bộ ghi .xlsx
       ném lỗi ở tận cuối dây (lúc xuất hồ sơ) — rất xa chỗ thật sự sai. ── */
function testBadDimsRejected() {
  console.log('\n[2c] ⛔ Số đo NaN / vô cực / 0 / âm — cấm ra hình, cấm báo thành công');
  const bad: [string, number, number, number][] = [
    ['NaN cả ba', NaN, NaN, NaN],
    ['vô cực bề rộng', Infinity, 800, 750],
    ['tất cả 0', 0, 0, 0],
    ['số âm', -500, -300, -200],
  ];
  for (const [label, w, d, h] of bad) {
    __resetFfeIdSeq();
    const m: MeasurementResult = { width: mv(w, 1, 'measured'), depth: mv(d, 1, 'measured'), height: mv(h, 1, 'measured') };
    const r = buildFurnitureFromMeasurement({ measurement: m, at: { x: 0, y: 0 }, category: 'armchair', now: 1 });
    ok(`${label}: KHÔNG sinh entity nào`, r.entities.length === 0);
    ok(`${label}: gắn cờ số đo hỏng`, r.invalidDims === true);
    ok(`${label}: câu báo nói rõ chưa dùng được`, /chưa dùng được/.test(r.label));
    ok(`${label}: KHÔNG khoe khớp mẫu`, r.match === null && !/giống mẫu/i.test(r.label));

    const o = orthoViewsToEntities(m, { x: 0, y: 0 });
    ok(`${label}: ba hình chiếu cũng KHÔNG dựng`, o.entities.length === 0 && o.invalidDims === true);
  }
  // Chốt an toàn ngược lại: số đo tốt KHÔNG bị cờ oan.
  const good = buildFurnitureFromMeasurement({ measurement: ARMCHAIR, at: { x: 0, y: 0 }, category: 'armchair' });
  ok('số đo tốt không bị gắn cờ hỏng', good.invalidDims === false && good.entities.length > 0);
  ok('mọi toạ độ entity đều hữu hạn', good.entities.every((e) => JSON.stringify(e).indexOf('null') === -1));
}

/* ── [3] món rời mang đủ dữ liệu để lên bảng FF&E/BOQ ── */
function testFfeItem() {
  console.log('\n[3] Món rời sinh ra phải đủ dữ liệu cho bảng FF&E/BOQ');
  __resetFfeIdSeq();
  const r = buildFurnitureFromMeasurement({
    measurement: ARMCHAIR,
    at: { x: 0, y: 0 },
    category: 'armchair',
    name: 'Ghế bành phòng chờ',
    room: 'Sảnh lễ tân',
    imageUrl: 'blob:test-anh-phoi-canh',
  });

  ok('có id món', /^ffe_/.test(r.item.id));
  ok('giữ đúng tên người dùng đặt', r.item.name === 'Ghế bành phòng chờ');
  ok('đơn vị mặc định là ĐẾM (cái), không phải m²', r.item.unit === 'cai' && r.item.qty === 1);
  ok('mang trường PHÒNG (G-M3-08)', r.item.room === 'Sảnh lễ tân');
  ok('mang trường ẢNH (G-M3-11)', r.item.imageUrl === 'blob:test-anh-phoi-canh');
  ok('mang ba số đo đã làm tròn mm', r.item.w === 900 && r.item.d === 850 && r.item.hUp === 800);
  ok('độ tin cậy = suy đoán vì sâu là inferred', r.item.confidence === 'inferred');
  ok('truy vết được về entity trên bản vẽ', (r.item.entityIds ?? []).length === r.entities.length);
  ok('nguồn gốc ghi rõ là bốc từ ảnh', r.item.source === 'vision');

  ok('cả ba số đo đều measured ⇒ độ tin "measured"', measurementConfidence(ODDITY) === 'measured');
  const t = measurementToTarget(ARMCHAIR);
  ok('đổi số đo sang TargetDims đúng trục', t.widthMm === 900 && t.depthMm === 850 && t.heightMm === 800);
}

/* ── [4] ba hình chiếu xuống bản vẽ, KHÔNG chồng nhau ── */
function testOrtho() {
  console.log('\n[4] Ba hình chiếu xếp hàng ngang, không chồng nhau');
  const r = orthoViewsToEntities(ARMCHAIR, { x: 0, y: 0 });

  ok('đủ ba hình', r.placements.length === 3);
  ok('đúng thứ tự đọc bản vẽ: bằng → đứng → bên', r.placements.map((p) => p.kind).join(',') === 'plan,front,side');
  ok('có entity cho cả ba hình', r.entities.length > 0);
  ok('dấu cảnh báo mặt khuất LUÔN kèm theo', r.warning.startsWith('Mặt khuất là suy diễn'));

  let overlap = false;
  for (let i = 1; i < r.placements.length; i++) {
    const a = r.placements[i - 1];
    const b = r.placements[i];
    const gap = (b.at.x - b.extentMm.w / 2) - (a.at.x + a.extentMm.w / 2);
    if (gap < ORTHO_GAP_MM - 0.001) overlap = true;
  }
  ok(`khoảng hở giữa các hình ≥ ${ORTHO_GAP_MM}mm`, !overlap);

  const totalW = r.placements.reduce((s, p) => s + p.extentMm.w, 0) + ORTHO_GAP_MM * 2;
  const left = r.placements[0].at.x - r.placements[0].extentMm.w / 2;
  const right = r.placements[2].at.x + r.placements[2].extentMm.w / 2;
  ok('hàng ba hình canh giữa quanh điểm thả', Math.abs((left + right) / 2) < 1 && Math.abs(right - left - totalW) < 1);
  ok('mặt bên LUÔN khai rõ là hộp bao (không giả vờ hình thật)', r.placements[2].isBoundingOutlineOnly === true);
}

function main() {
  testMatched();
  testFallbackNeverSilent();
  testThinEvidenceRejected();
  testBadDimsRejected();
  testFfeItem();
  testOrtho();
  console.log(`\n${pass} ok, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main();
