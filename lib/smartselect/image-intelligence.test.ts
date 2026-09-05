/**
 * lib/smartselect/image-intelligence.test.ts — chạy:
 * `node_modules/.bin/sucrase-node lib/smartselect/image-intelligence.test.ts`
 *
 * Ảnh TỰ DỰNG (không tệp ngoài, không mạng): nền phẳng + khối màu = "đồ rời"; nhiễu ngẫu nhiên
 * tất định = "cảnh phức tạp". Kiểm: bằng chứng có/không đúng lúc, KHÔNG BAO GIỜ có kích thước,
 * mask khớp bộ lọc, summary serialize được.
 */
import assert from 'assert';
import type { RgbaImage } from '../vision/single-view-metrology';
import { analyzeImagePixels, availableViews, summarize, viewMask } from './image-intelligence';

let n = 0;
function it(name: string, fn: () => void) {
  fn();
  n++;
  console.log(`  ✓ ${name}`);
}

function blank(w: number, h: number, rgb: [number, number, number]): RgbaImage {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let p = 0; p < w * h; p++) {
    data[p * 4] = rgb[0];
    data[p * 4 + 1] = rgb[1];
    data[p * 4 + 2] = rgb[2];
    data[p * 4 + 3] = 255;
  }
  return { width: w, height: h, data };
}

function rect(img: RgbaImage, x0: number, y0: number, w: number, h: number, rgb: [number, number, number]) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const i = (y * img.width + x) * 4;
      img.data[i] = rgb[0];
      img.data[i + 1] = rgb[1];
      img.data[i + 2] = rgb[2];
    }
  }
}

/** Nhiễu tất định (LCG) — mọi lần chạy cùng một ảnh. */
function noise(w: number, h: number): RgbaImage {
  const data = new Uint8ClampedArray(w * h * 4);
  let s = 12345;
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let p = 0; p < w * h; p++) {
    data[p * 4] = Math.floor(rnd() * 255);
    data[p * 4 + 1] = Math.floor(rnd() * 255);
    data[p * 4 + 2] = Math.floor(rnd() * 255);
    data[p * 4 + 3] = 255;
  }
  return { width: w, height: h, data };
}

console.log('image-intelligence');

const sofa = blank(320, 240, [236, 228, 214]); // nền kem ấm
rect(sofa, 90, 120, 140, 70, [72, 48, 36]); // khối nâu tối ở 1/3 dưới-giữa

it('đồ rời trên nền phẳng → có bằng chứng tách nền, bbox khớp khối, cờ inferred', () => {
  const r = analyzeImagePixels(sofa, { text: 'sofa da nâu phòng khách', calibrate: false });
  assert.strictEqual(r.furniture.available, true);
  assert.strictEqual(r.furniture.trangThai, 'inferred');
  assert.ok(r.furniture.mask && r.furniture.mask.length === 320 * 240);
  assert.ok(r.furniture.bbox && r.furniture.bbox.x <= 90 && r.furniture.bbox.x + r.furniture.bbox.w >= 230);
  assert.ok(r.furniture.coverage > 0.1 && r.furniture.coverage < 0.2, `coverage ${r.furniture.coverage}`);
  assert.ok(r.furniture.confidence > 0.5);
});

it('palette đo từ pixel gồm cả nền lẫn khối; ánh sáng ấm; bố cục ngang', () => {
  const r = analyzeImagePixels(sofa, { calibrate: false });
  assert.strictEqual(r.palette.trangThai, 'measured');
  const hexes = r.palette.value.map((p) => p.hex);
  assert.ok(hexes.length >= 2);
  assert.ok(r.palette.value[0].share > 0.5); // nền chiếm đa số
  assert.strictEqual(r.light.value.temperature, 'warm');
  assert.strictEqual(r.light.trangThai, 'measured');
  assert.strictEqual(r.composition.value.orientation, 'landscape');
});

it('KHÔNG BAO GIỜ có kích thước: geometry.dimensions === null, kể cả khi không hiệu chỉnh', () => {
  const r = analyzeImagePixels(sofa, { calibrate: false });
  assert.strictEqual(r.geometry.dimensions, null);
  assert.strictEqual(r.geometry.calibrated, false);
  assert.ok(r.geometry.note.includes('neo'));
  const r2 = analyzeImagePixels(sofa); // Hough bật — ảnh phẳng không đủ cạnh → lý do, không bịa
  assert.strictEqual(r2.geometry.dimensions, null);
  assert.strictEqual(r2.geometry.calibrated, false);
  assert.ok(typeof r2.geometry.reason === 'string' && r2.geometry.reason.length > 0);
});

it('cảnh nhiễu (nền phức tạp) → đồ rời KHÔNG có bằng chứng, có lý do song ngữ', () => {
  const r = analyzeImagePixels(noise(200, 150), { calibrate: false });
  assert.strictEqual(r.furniture.available, false);
  assert.strictEqual(r.furniture.mask, null);
  assert.ok(r.furniture.reason[0].length > 0 && r.furniture.reason[1].length > 0);
});

it('trần/tường không có mask → unavailable kèm lý do; có mask → measured, coverage đúng', () => {
  const r = analyzeImagePixels(sofa, { calibrate: false });
  assert.strictEqual(r.surfaces.ceiling.available, false);
  assert.strictEqual(r.surfaces.wall.available, false);
  assert.ok(r.surfaces.wall.reason[0].includes('mask'));
  const wallMask = new Uint8Array(320 * 240);
  for (let p = 0; p < 320 * 100; p++) wallMask[p] = 255; // 100 hàng đầu = tường
  const r2 = analyzeImagePixels(sofa, { calibrate: false, masks: { wall: wallMask } });
  assert.strictEqual(r2.surfaces.wall.available, true);
  assert.strictEqual(r2.surfaces.wall.trangThai, 'measured');
  assert.ok(Math.abs(r2.surfaces.wall.coverage - 100 / 240) < 1e-6);
  assert.strictEqual(viewMask(r2, 'wall'), wallMask);
});

it('bộ lọc chỉ bật khi có bằng chứng; nút mờ mang lý do', () => {
  const r = analyzeImagePixels(sofa, { calibrate: false });
  const views = availableViews(r);
  const by = (id: string) => views.find((v) => v.id === id)!;
  assert.strictEqual(by('original').available, true);
  assert.strictEqual(by('furniture').available, true);
  assert.strictEqual(by('bg-removed').available, true);
  assert.strictEqual(by('ceiling').available, false);
  assert.ok(by('ceiling').reason[0].length > 0);
  assert.strictEqual(by('floor').available, false);
  assert.strictEqual(by('material').available, true);
  assert.strictEqual(viewMask(r, 'furniture'), r.furniture.mask);
  assert.strictEqual(viewMask(r, 'ceiling'), null);
  assert.strictEqual(viewMask(r, 'original'), null);
});

it('semantic: không chữ → rỗng, nguồn null; có chữ → inferred nguồn text; có VLM → nguồn vision:<model>', () => {
  const r0 = analyzeImagePixels(sofa, { calibrate: false });
  assert.strictEqual(r0.semantic.source, null);
  assert.strictEqual(r0.semantic.confidence, 0);
  const r1 = analyzeImagePixels(sofa, { calibrate: false, text: 'japandi bedroom' });
  assert.deepStrictEqual(r1.semantic.facets.style, ['japandi']);
  assert.deepStrictEqual(r1.semantic.facets.space, ['bedroom']);
  assert.strictEqual(r1.semantic.source, 'text:name+tags');
  const r2 = analyzeImagePixels(sofa, {
    calibrate: false,
    vlm: { caption: 'Sảnh khách sạn đá marble', style: 'quiet luxury', materials: ['marble', 'brass'], room: 'lobby', model: 'vlm-x' },
  });
  assert.strictEqual(r2.semantic.source, 'vision:vlm-x');
  assert.ok(r2.semantic.facets.material.includes('marble') && r2.semantic.facets.material.includes('brass'));
  assert.deepStrictEqual(r2.semantic.facets.space, ['lobby']);
  assert.strictEqual(r2.semantic.caption, 'Sảnh khách sạn đá marble');
  assert.ok(r2.overallConfidence > r0.overallConfidence);
});

it('summary serialize được, không mang mask, không mang kích thước', () => {
  const r = analyzeImagePixels(sofa, { calibrate: false, text: 'sofa' });
  const s = summarize(r);
  const json = JSON.stringify(s);
  assert.ok(!json.includes('"mask"'));
  assert.ok(!json.includes('"dimensions":{'));
  assert.strictEqual(s.geometry.dimensions, null);
  assert.strictEqual(s.furniture.available, true);
  assert.strictEqual(s.palette.length, r.palette.value.length);
});

it('kích thước gốc đi vào width/height (cổng đo trên gốc), bản thu nhỏ vào analyzedWidth/Height', () => {
  const r = analyzeImagePixels(sofa, { calibrate: false, originalSize: { width: 3200, height: 2400 } });
  assert.strictEqual(r.width, 3200);
  assert.strictEqual(r.height, 2400);
  assert.strictEqual(r.analyzedWidth, 320);
  assert.strictEqual(r.analyzedHeight, 240);
  const s = summarize(r);
  assert.strictEqual(s.width, 3200);
  assert.strictEqual(s.analyzedWidth, 320);
  const r0 = analyzeImagePixels(sofa, { calibrate: false });
  assert.strictEqual(r0.width, 320);
});

console.log(`${n} test PASS — image-intelligence`);
