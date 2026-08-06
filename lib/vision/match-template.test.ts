/**
 * lib/vision/match-template.test.ts — bước ⑤ (khớp mẫu) + VIỆC 4 (hàng đợi dựng mẫu).
 *
 * Cách kiểm: dùng CHÍNH số đo danh nghĩa của mẫu trong `lib/cad/furniture.ts` làm đầu vào rồi
 * đòi thuật toán tìm lại đúng mẫu đó — không cần ảnh thật, không cần fixture tự chế. Đây là kiểu
 * "cảnh tổng hợp" giống `single-view-metrology.test.ts` đã làm: dựng ngược từ đáp án đã biết.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/vision/match-template.test.ts
 */
import { BLOCKS } from '../cad/furniture';
import {
  matchTemplate,
  collectCandidates,
  aspectScore,
  groupScore,
  heightScore,
  countExtrema,
  scalePrim,
  fallbackBox,
  makeTemplateRequest,
  mergeTemplateRequests,
  sortTemplateRequests,
  templateRequestKey,
  DEFAULT_MATCH_THRESHOLD,
  FALLBACK_BLOCK_LABEL,
  type TargetDims,
  type TemplateRequest,
} from './match-template';
import type { ObjectSilhouette } from './single-view-metrology';

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

const dims = (widthMm: number, depthMm: number, heightMm: number): TargetDims => ({ widthMm, depthMm, heightMm });

/* ── [1] gom ứng viên ── */
function testCollect() {
  console.log('\n[1] Gom ứng viên từ CẢ HAI nguồn, loại đúng thứ không phải đồ rời');
  const cands = collectCandidates(null);
  ok('có ứng viên từ furniture.ts', cands.length > 10);
  ok('KHÔNG có cửa/cửa sổ (cấu kiện gắn tường, đã có đường riêng)', !cands.some((c) => c.id === 'door' || c.id === 'window'));
  ok('KHÔNG có nhóm Kiến trúc/Điện/Cầu thang', !cands.some((c) => ['Kiến trúc', 'Điện', 'Cầu thang'].includes(c.group)));
  ok('có giường đôi (đồ rời, phải giữ)', cands.some((c) => c.id === 'bedD'));

  // Nguồn thứ hai: manifest .dxf — trộn vào cùng danh sách.
  const withLib = collectCandidates({
    version: 1, generatedAt: '', unit: 'mm', count: 1,
    categories: [{ slug: 'seating', label: 'Ghế' }],
    blocks: [{ id: 'lib-chair', name: 'Ghế thư viện', category: 'seating', categoryLabel: 'Ghế', w: 500, h: 550, file: '', thumb: '', source: '', license: '' }],
  });
  ok('manifest thư viện .dxf được trộn vào (CẢ HAI nguồn, không chỉ BLOCKS)', withLib.length === cands.length + 1);
  ok('ứng viên từ manifest ghi đúng source', withLib.find((c) => c.id === 'lib-chair')?.source === 'library');
}

/* ── [2] tìm lại đúng mẫu từ số đo danh nghĩa của chính nó ── */
function testFindsKnownBlock() {
  console.log('\n[2] Đưa số đo danh nghĩa của một mẫu → phải tìm lại đúng mẫu đó');

  // Giường đôi: w1600 (rộng) × h2000 (SÂU, xem docblock) — cao lấy giữa dải chuẩn nghề.
  const bed = matchTemplate(dims(1600, 2000, 450), { category: 'bedDouble' });
  ok('khớp được (không null)', bed !== null);
  ok('ra đúng "bedD"', bed?.candidate.id === 'bedD');
  ok('điểm rất cao vì trùng cả tỉ lệ lẫn nhóm', (bed?.matchScore ?? 0) > 0.9);
  ok('hệ số kéo giãn = 1 khi số đo trùng danh nghĩa', Math.abs((bed?.scale.sx ?? 0) - 1) < 1e-9 && Math.abs((bed?.scale.sy ?? 0) - 1) < 1e-9);

  const wardrobe = matchTemplate(dims(1800, 600, 2200), { category: 'wardrobe' });
  ok('tủ áo 1800×600 → ra "wardrobe"', wardrobe?.candidate.id === 'wardrobe');

  const coffee = matchTemplate(dims(1200, 600, 400), { category: 'coffeeTable' });
  ok('bàn trà 1200×600 → ra "coffeeTable"', coffee?.candidate.id === 'coffeeTable');
}

/* ── [3] kéo giãn ── */
function testDeform() {
  console.log('\n[3] Kéo giãn mẫu về đúng số đo (c)');
  // Giường đôi thật rộng 1800 sâu 2100 — mẫu danh nghĩa 1600×2000.
  const m = matchTemplate(dims(1800, 2100, 450), { category: 'bedDouble' });
  ok('vẫn ra bedD dù lệch cỡ (khớp theo TỈ LỆ, không theo cỡ tuyệt đối)', m?.candidate.id === 'bedD');
  ok('sx = 1800/1600', Math.abs((m?.scale.sx ?? 0) - 1800 / 1600) < 1e-9);
  ok('sy = 2100/2000', Math.abs((m?.scale.sy ?? 0) - 2100 / 2000) < 1e-9);

  // Nét sau kéo giãn phải phủ đúng khung mới.
  const pts = (m?.prims ?? []).flatMap((p) => (p.k === 'poly' ? p.pts : p.k === 'line' ? [p.a, p.b] : []));
  const maxX = Math.max(...pts.map((p) => Math.abs(p.x)));
  const maxY = Math.max(...pts.map((p) => Math.abs(p.y)));
  ok('nét đã giãn phủ đúng nửa bề rộng mới (±1mm)', Math.abs(maxX - 900) < 1);
  ok('nét đã giãn phủ đúng nửa bề sâu mới (±1mm)', Math.abs(maxY - 1050) < 1);

  // circle khi giãn KHÔNG đều phải bẻ thành poly (Prim không có elip) — không được để lại circle sai hình.
  const circ = scalePrim({ k: 'circle', c: { x: 0, y: 0 }, r: 100 }, 2, 1);
  ok('giãn không đều: circle → poly (không giả vờ vẫn tròn)', circ.k === 'poly');
  if (circ.k === 'poly') {
    const bx = Math.max(...circ.pts.map((p) => Math.abs(p.x)));
    const by = Math.max(...circ.pts.map((p) => Math.abs(p.y)));
    ok('poly thay thế đúng hình elip (bán trục 200 × 100)', Math.abs(bx - 200) < 1 && Math.abs(by - 100) < 1);
  }
  const circUniform = scalePrim({ k: 'circle', c: { x: 0, y: 0 }, r: 100 }, 2, 2);
  ok('giãn ĐỀU: giữ nguyên circle (nét sạch)', circUniform.k === 'circle' && circUniform.r === 200);
}

/* ── [4] KHÔNG ép khớp bừa (e) ── */
function testNoForcedMatch() {
  console.log('\n[4] Dưới ngưỡng → trả null, KHÔNG ép khớp bừa (yêu cầu e)');
  // Vật cực dài và mảnh (10m × 0.1m) — không mẫu nội thất nào có tỉ lệ này.
  const weird = matchTemplate(dims(10000, 100, 300), { category: 'other' });
  ok('vật tỉ lệ dị thường → null', weird === null);

  // Ngưỡng cao vô lý thì kể cả mẫu khớp hoàn hảo cũng phải trả null (ngưỡng có tác dụng thật).
  const strict = matchTemplate(dims(1600, 2000, 450), { category: 'bedDouble', threshold: 1.01 });
  ok('ngưỡng 1.01 → null kể cả khi khớp gần hoàn hảo (ngưỡng không phải trang trí)', strict === null);

  ok('số đo không hợp lệ (rộng 0) → null', matchTemplate(dims(0, 500, 500)) === null);
  ok('ngưỡng mặc định nằm trong khoảng hợp lý', DEFAULT_MATCH_THRESHOLD > 0.5 && DEFAULT_MATCH_THRESHOLD < 0.9);
}

/* ── [5] từng tiêu chí ── */
function testCriteria() {
  console.log('\n[5] Bốn tiêu chí chấm điểm — từng cái đúng bản chất');
  const c = collectCandidates(null).find((x) => x.id === 'bedD')!;

  ok('tỉ lệ trùng → 1 điểm', Math.abs(aspectScore(dims(1600, 2000, 400), c) - 1) < 1e-9);
  ok('tỉ lệ lệch gấp đôi → 0.5 điểm', Math.abs(aspectScore(dims(3200, 2000, 400), c) - 0.5) < 1e-9);
  ok('đối xứng: gầy gấp đôi = béo gấp đôi', Math.abs(aspectScore(dims(800, 2000, 400), c) - aspectScore(dims(1600, 1000, 400), c)) < 1e-9);

  ok('đúng nhóm → 1', groupScore('bedDouble', c) === 1);
  ok('sai nhóm → 0', groupScore('diningTable', c) === 0);
  ok('chưa biết loại → null (bỏ tiêu chí, KHÔNG chấm 0 oan)', groupScore(undefined, c) === null);
  ok('loại "other" → null (không ánh xạ bừa sang một nhóm)', groupScore('other', c) === null);

  ok('cao trong dải chuẩn nghề → 1', heightScore(dims(1600, 2000, 450), 'bedDouble') === 1);
  ok('cao lệch xa dải → giảm', (heightScore(dims(1600, 2000, 1500), 'bedDouble') ?? 1) < 0.5);

  // Cực trị: hình vuông có 4 góc; thêm đỉnh giữa cạnh (thẳng hàng) KHÔNG được đếm thành góc.
  const square = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
  ok('hình vuông → 4 cực trị', countExtrema(square) === 4);
  const withCollinear = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
  ok('đỉnh thẳng hàng KHÔNG đếm là cực trị (chống nhiễu răng cưa mặt nạ)', countExtrema(withCollinear) === 4);

  // Tiêu chí không đánh giá được phải bị LOẠI khỏi tổng, không kéo điểm xuống.
  const withCat = matchTemplate(dims(1600, 2000, 450), { category: 'bedDouble' });
  const noCat = matchTemplate(dims(1600, 2000, 450), {});
  ok('không biết loại vẫn khớp được bằng tỉ lệ (trọng số chia lại, không chấm 0 oan)', noCat !== null);
  ok('biết loại thì điểm cao hơn hoặc bằng', (withCat?.matchScore ?? 0) >= (noCat?.matchScore ?? 0));
}

/* ── [6] lý do khớp cho UI (d) ── */
function testReasons() {
  console.log('\n[6] Trả lý do khớp để UI hiện "giống mẫu X 82%" (yêu cầu d)');
  const m = matchTemplate(dims(1600, 2000, 450), { category: 'bedDouble' });
  ok('có mảng lý do', (m?.reasons.length ?? 0) > 0);
  ok('mọi lý do đều có câu chữ đọc được', (m?.reasons ?? []).every((r) => typeof r.label === 'string' && r.label.length > 5));
  ok('mọi lý do có điểm trong [0,1]', (m?.reasons ?? []).every((r) => r.score >= 0 && r.score <= 1));
  ok('tổng trọng số các tiêu chí dùng được = 1 (đã chia lại)', Math.abs((m?.reasons ?? []).reduce((s, r) => s + r.weight, 0) - 1) < 1e-9);
  ok('matchScore quy ra % được', Math.round((m?.matchScore ?? 0) * 100) >= 90);

  // Tín hiệu "độ rườm rà" chỉ tham gia khi CÓ mặt nạ.
  const sil: ObjectSilhouette = { front: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 60 }, { x: 0, y: 60 }] };
  const withSil = matchTemplate(dims(1600, 2000, 450), { category: 'bedDouble', silhouette: sil });
  ok('có mặt nạ → tiêu chí complexity xuất hiện trong lý do', (withSil?.reasons ?? []).some((r) => r.key === 'complexity'));
  ok('không mặt nạ → KHÔNG có tiêu chí complexity', !(m?.reasons ?? []).some((r) => r.key === 'complexity'));
}

/* ── [7] VIỆC 4 — hàng đợi dựng mẫu mới ── */
function testQueue() {
  console.log('\n[7] Không khớp được → MỘT DÒNG VIỆC cho thư viện, không im lặng bỏ qua');
  const d = dims(10000, 100, 300);
  ok('có nét dự phòng hộp bao', fallbackBox(d).length === 1);
  const pts = fallbackBox(d)[0].k === 'poly' ? (fallbackBox(d)[0] as { pts: { x: number; y: number }[] }).pts : [];
  ok('hộp bao đúng rộng × sâu, gốc tâm', Math.max(...pts.map((p) => p.x)) === 5000 && Math.max(...pts.map((p) => p.y)) === 50);
  ok('nhãn khối tạm cố định, nói rõ là tạm', FALLBACK_BLOCK_LABEL.includes('tạm'));

  const r1 = makeTemplateRequest({ category: 'armchair', dims: dims(800, 820, 900), bestScore: 0.4, now: 1_000 });
  ok('dòng việc có nhãn loại đọc được', r1.categoryLabel === 'Ghế bành');
  ok('đếm bắt đầu từ 1', r1.count === 1);
  ok('không khai loại → gom vào "other", không rơi mất', makeTemplateRequest({ dims: d, bestScore: 0.1, now: 1 }).category === 'other');

  // Đo lại đúng chiếc ghế đó (lệch vài mm) KHÔNG được đẻ dòng thứ hai.
  // ⚠️ Ca CHỐNG HỒI QUY: 820 vs 834 rơi hai bên biên làm tròn bậc 50 (→800 và →850) nên `id` KHÁC
  // nhau. Gộp phải theo ĐỘ GẦN, không theo khoá bằng nhau — xem REQUEST_MERGE_TOLERANCE_RATIO.
  const r2 = makeTemplateRequest({ category: 'armchair', dims: dims(812, 834, 905), bestScore: 0.35, now: 2_000 });
  ok('hai lần đo lệch vài mm CÓ THỂ ra id khác (đúng bản chất làm tròn — nên id không phải cách gộp)',
    templateRequestKey('armchair', dims(800, 820, 900)) !== templateRequestKey('armchair', dims(812, 834, 905)));
  const q1 = mergeTemplateRequests([], r1);
  const q2 = mergeTemplateRequests(q1, r2);
  ok('gộp vào dòng cũ, không đẻ dòng mới', q2.length === 1);
  ok('đếm cộng dồn', q2[0].count === 2);
  ok('giữ mốc thời gian mới nhất', q2[0].requestedAt === 2_000);
  ok('giữ điểm THẤP nhất (thiếu nặng nhất nổi lên trước)', q2[0].bestScore === 0.35);

  const farSameCat = makeTemplateRequest({ category: 'armchair', dims: dims(1400, 900, 950), bestScore: 0.3, now: 2_500 });
  ok('cùng loại nhưng CỠ KHÁC HẲN → dòng riêng (không gộp bừa cả loại vào một dòng)', mergeTemplateRequests(q2, farSameCat).length === 2);

  const other = makeTemplateRequest({ category: 'wardrobe', dims: dims(2000, 600, 2200), bestScore: 0.2, now: 3_000 });
  const q3 = mergeTemplateRequests(q2, other);
  ok('loại khác → dòng riêng', q3.length === 2);

  const sorted = sortTemplateRequests(q3);
  ok('xếp: hỏi nhiều lần lên trước', sorted[0].category === 'armchair');
  const tie: TemplateRequest[] = [
    { ...other, count: 2, bestScore: 0.5 },
    { ...r1, count: 2, bestScore: 0.1 },
  ];
  ok('cùng số lần → cái thư viện thiếu nặng nhất lên trước', sortTemplateRequests(tie)[0].bestScore === 0.1);
}

function main() {
  testCollect();
  testFindsKnownBlock();
  testDeform();
  testNoForcedMatch();
  testCriteria();
  testReasons();
  testQueue();
  console.log(`\n${pass} ok, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main();
