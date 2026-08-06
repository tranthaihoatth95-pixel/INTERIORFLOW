/**
 * lib/vision/ortho-projection.test.ts — bước ⑥ (chiếu trực giao).
 *
 * Trọng tâm KHÔNG phải "vẽ có ra hình không" mà là **luật số đo**: số ghi trên hình phải đến từ
 * tầng A (`measureObject`), không bao giờ đo lại từ khối đã kéo giãn. Phần [2] chứng minh điều đó
 * bằng cách cố tình đưa vào một khối SAI cỡ rồi đòi số ghi vẫn đúng số đo gốc.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/vision/ortho-projection.test.ts
 */
import {
  buildOrthoViews,
  silhouetteToElevation,
  outlineRect,
  measurementLabel,
  PROVENANCE,
  HIDDEN_FACE_WARNING,
} from './ortho-projection';
import { matchTemplate } from './match-template';
import type { MeasurementResult, MeasurementValue, ObjectSilhouette } from './single-view-metrology';

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

/** Số đo tầng A giả lập: giường đôi rộng 1600 sâu 2000 cao 450, sâu là SUY (ảnh 1 góc). */
const MEASURED: MeasurementResult = {
  width: mv(1600, 48, 'measured', 'Điểm chạm sàn trái/phải mặt nạ.'),
  height: mv(450, 14, 'measured', 'Đáy chạm sàn → đỉnh mặt nạ.'),
  depth: mv(2000, 700, 'inferred', 'Không thấy mặt bên — ước lượng theo tỉ lệ.'),
};

/* ── [1] ba hình, ba nhãn ── */
function testThreeViews() {
  console.log('\n[1] Ba hình chiếu + ba nhãn KHÔNG được trộn');
  const m = matchTemplate({ widthMm: 1600, depthMm: 2000, heightMm: 450 }, { category: 'bedDouble' });
  const views = buildOrthoViews(MEASURED, { match: m });

  ok('đủ ba hình', !!views.plan && !!views.front && !!views.side);
  ok('mỗi hình mang nhãn "Hình chiếu sơ bộ"', [views.plan, views.front, views.side].every((v) => v.provenance.label === 'Hình chiếu sơ bộ'));
  ok('hình chiếu dùng để TRÌNH BÀY', views.plan.provenance.usage.includes('trình bày'));
  ok('khối tham chiếu mang nhãn RIÊNG, không phải nhãn hình chiếu', views.referenceBlock?.provenance.label === 'Khối tham chiếu');
  ok('khối tham chiếu dùng để dựng cảnh/render', views.referenceBlock!.provenance.usage.includes('render'));
  ok('số đo mang nhãn RIÊNG, dùng cho BOQ/đặt xưởng', PROVENANCE.measurement.usage.includes('BOQ'));
  ok('ba nhãn khác nhau hoàn toàn', new Set([PROVENANCE.measurement.label, PROVENANCE.referenceBlock.label, PROVENANCE.projection.label]).size === 3);

  ok('dấu cảnh báo mặt khuất LUÔN có', views.warning === HIDDEN_FACE_WARNING && views.warning.length > 10);
  ok('cùng câu với spec sheet (một giọng, không chế câu thứ hai)', HIDDEN_FACE_WARNING.startsWith('Mặt khuất là suy diễn'));
}

/* ── [2] LUẬT SỐ ĐO — không đo lại từ khối ── */
function testDimensionsComeFromMeasurement() {
  console.log('\n[2] ⛔ Số ghi trên hình LUÔN từ tầng A, KHÔNG đo lại từ khối đã kéo giãn');

  // Khối CỐ TÌNH sai cỡ: khớp mẫu bằng số đo khác hẳn số đo thật ở trên.
  const wrongBlock = matchTemplate({ widthMm: 900, depthMm: 1900, heightMm: 400 }, { category: 'bedSingle' });
  ok('dựng được khối sai cỡ để thử', wrongBlock !== null);

  const views = buildOrthoViews(MEASURED, { match: wrongBlock });
  const planW = views.plan.dimensions.find((d) => d.axis === 'width')!;
  ok('mặt bằng ghi 1600 (số ĐO), KHÔNG phải 900 (số của khối)', planW.value.valueMm === 1600);
  ok('mang nguyên dung sai của phép đo', planW.value.toleranceMm === 48);
  ok('mang nguyên basis của phép đo (không bị viết lại)', planW.value.basis === MEASURED.width.basis);
  ok('mang nguyên kind của phép đo', planW.value.kind === 'measured');

  const sideH = views.side.dimensions.find((d) => d.axis === 'height')!;
  ok('mặt bên ghi 450 (số ĐO), không phải cao của khối', sideH.value.valueMm === 450);

  // Chiều SÂU là số SUY — phải giữ nguyên tính "suy", không bị khối làm cho có vẻ chắc chắn.
  const planD = views.plan.dimensions.find((d) => d.axis === 'depth')!;
  ok('chiều sâu giữ nguyên kind=inferred (khối không "chứng minh" được nó)', planD.value.kind === 'inferred');
  ok('nhãn nguồn của số suy có ghi rõ là suy diễn', planD.provenance.includes('suy diễn'));

  // Sai số hiện theo % thật, không phải số cố định.
  ok('sai số ±3.0% cho 48/1600', measurementLabel(MEASURED.width).includes('3.0%'));
  ok('sai số ±35% cho 700/2000', measurementLabel(MEASURED.depth).includes('35%'));
}

/* ── [3] mặt bằng ── */
function testPlan() {
  console.log('\n[3] Mặt bằng — nét mẫu thật khi khớp, hộp bao khi không');
  const m = matchTemplate({ widthMm: 1600, depthMm: 2000, heightMm: 450 }, { category: 'bedDouble' });
  const withMatch = buildOrthoViews(MEASURED, { match: m });
  ok('có mẫu → KHÔNG phải chỉ hộp bao', withMatch.plan.isBoundingOutlineOnly === false);
  ok('nét mặt bằng phong phú hơn 1 hình chữ nhật', withMatch.plan.prims.length > 1);
  ok('basis nêu tên mẫu + % giống', withMatch.plan.basis.includes('%') && withMatch.plan.basis.includes('Giường'));

  const noMatch = buildOrthoViews(MEASURED, { match: null });
  ok('không mẫu → đánh dấu chỉ-hộp-bao (UI vẽ nét đứt)', noMatch.plan.isBoundingOutlineOnly === true);
  ok('không mẫu → đúng 1 hình chữ nhật', noMatch.plan.prims.length === 1);
  ok('không mẫu → nói thẳng lý do', noMatch.plan.basis.includes('Không khớp được mẫu'));
  ok('không mẫu → referenceBlock = null (không bịa ra khối)', noMatch.referenceBlock === null);
  ok('khung mặt bằng = rộng × sâu', noMatch.plan.extentMm.w === 1600 && noMatch.plan.extentMm.h === 2000);
}

/* ── [4] mặt đứng dựng từ mặt nạ thật ── */
function testFrontFromSilhouette() {
  console.log('\n[4] Mặt đứng — dựng từ CHÍNH mặt nạ món đồ, không phải từ mẫu');

  // Mặt nạ hình chữ L (px ảnh, y hướng XUỐNG như toạ độ ảnh).
  const sil: ObjectSilhouette = {
    front: [{ x: 10, y: 10 }, { x: 90, y: 10 }, { x: 90, y: 40 }, { x: 50, y: 40 }, { x: 50, y: 90 }, { x: 10, y: 90 }],
  };
  const views = buildOrthoViews(MEASURED, { match: null, silhouette: sil });
  ok('có mặt nạ → mặt đứng KHÔNG phải hộp bao', views.front.isBoundingOutlineOnly === false);
  ok('giữ đủ 6 đỉnh của mặt nạ (đường bao thật, không đơn giản hoá)', views.front.prims[0].k === 'poly' && (views.front.prims[0] as { pts: unknown[] }).pts.length === 6);
  ok('basis nói rõ là xấp xỉ tuyến tính, không giấu', views.front.basis.includes('nắn tuyến tính'));

  const pts = (views.front.prims[0] as { pts: { x: number; y: number }[] }).pts;
  const w = Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));
  const h = Math.max(...pts.map((p) => p.y)) - Math.min(...pts.map((p) => p.y));
  ok('đường bao phủ đúng rộng đã ĐO (1600mm)', Math.abs(w - 1600) < 1);
  ok('đường bao phủ đúng cao đã ĐO (450mm)', Math.abs(h - 450) < 1);

  // Lật trục Y: đáy mặt nạ (y px LỚN nhất) phải thành đáy hình (y mm NHỎ nhất).
  const bottomPx = sil.front.filter((p) => p.y === 90);
  ok('có điểm đáy trong mặt nạ để kiểm', bottomPx.length === 2);
  ok('đáy mặt nạ → đáy hình (trục Y đã lật đúng chiều CAD)', Math.min(...pts.map((p) => p.y)) === -225);

  const noSil = buildOrthoViews(MEASURED, { match: null });
  ok('không mặt nạ → mặt đứng rơi về hộp bao, có đánh dấu', noSil.front.isBoundingOutlineOnly === true);
  ok('không mặt nạ → nói rõ vì sao', noSil.front.basis.includes('Chưa có mặt nạ'));

  ok('mặt nạ suy biến (2 điểm) → null, không dựng bừa', silhouetteToElevation([{ x: 0, y: 0 }, { x: 1, y: 1 }], 100, 100) === null);
  ok('rộng/cao = 0 → null', silhouetteToElevation(sil.front, 0, 100) === null);
}

/* ── [5] mặt bên luôn thật thà là hộp bao ── */
function testSideAlwaysBounding() {
  console.log('\n[5] Mặt bên — luôn chỉ hộp bao, nói thẳng vì sao');
  const m = matchTemplate({ widthMm: 1600, depthMm: 2000, heightMm: 450 }, { category: 'bedDouble' });
  const sil: ObjectSilhouette = { front: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 0, y: 50 }] };
  const views = buildOrthoViews(MEASURED, { match: m, silhouette: sil });

  ok('có mẫu VÀ có mặt nạ, mặt bên VẪN chỉ là hộp bao (không vờ vẽ được)', views.side.isBoundingOutlineOnly === true);
  ok('nêu đúng hai lý do: ảnh 1 góc + thư viện là 2D nhìn từ trên', views.side.basis.includes('một góc') && views.side.basis.includes('2D nhìn từ trên'));
  ok('khung mặt bên = sâu × cao', views.side.extentMm.w === 2000 && views.side.extentMm.h === 450);
  ok('mặt bên ghi kích thước sâu + cao (không ghi rộng)', views.side.dimensions.map((d) => d.axis).sort().join(',') === 'depth,height');

  const rect = outlineRect(2000, 450);
  ok('hộp bao gốc TÂM, đúng nửa cạnh', rect[0].k === 'poly' && (rect[0] as { pts: { x: number; y: number }[] }).pts[2].x === 1000);
}

function main() {
  testThreeViews();
  testDimensionsComeFromMeasurement();
  testPlan();
  testFrontFromSilhouette();
  testSideAlwaysBounding();
  console.log(`\n${pass} ok, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main();
