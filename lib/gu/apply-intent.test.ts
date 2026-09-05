/**
 * lib/gu/apply-intent.test.ts — chạy: `node_modules/.bin/sucrase-node lib/gu/apply-intent.test.ts`
 *
 * Khoá 4 hợp đồng: ① intent không mang hình học/kích thước ② áp là GÓP THÊM, không xoá giá trị cũ
 * ③ lớp verified bất khả xâm phạm ④ lùi trả đúng bản trước, không mutate.
 */
import assert from 'assert';
import { newDnaCard } from '../dna/types';
import { verifiedField } from '../distill/types';
import type { ImageIntelligenceSummary } from '../smartselect/image-intelligence';
import { applyIntent, buildIntent, describeChanges, intentHasNoGeometry, intentTagsFromAnalysis, revertIntent } from './apply-intent';

let n = 0;
function it(name: string, fn: () => void) {
  fn();
  n++;
  console.log(`  ✓ ${name}`);
}

function summary(): ImageIntelligenceSummary {
  return {
    width: 1600,
    height: 1000,
    analyzedWidth: 480,
    analyzedHeight: 300,
    palette: [
      { hex: '#e8dccb', share: 0.5 },
      { hex: '#5a3b2a', share: 0.3 },
    ],
    light: { key: 'mid', temperature: 'warm', luminance: 130, contrast: 40, warmth: 0.1 },
    composition: {
      aspect: 1.6,
      orientation: 'landscape',
      brightCentroid: { x: 'center', y: 'middle', fx: 0.5, fy: 0.5 },
      horizonY: 0.55,
      horizonBand: 'eye-level',
    },
    geometry: { calibrated: true, confidence: 0.8, vanishingPoints: 3, reason: null, dimensions: null, note: '', trangThai: 'measured', horizonY: 0.55 },
    surfaces: {
      ceiling: { available: false, coverage: 0, trangThai: 'inferred', confidence: 0, source: 'none' },
      wall: { available: false, coverage: 0, trangThai: 'inferred', confidence: 0, source: 'none' },
      floor: { available: true, coverage: 0.4, trangThai: 'inferred', confidence: 0.5, source: 'geometry:horizon' },
    },
    furniture: { available: true, coverage: 0.15, trangThai: 'inferred', confidence: 0.7, source: 'pixels:extractForeground' },
    semantic: {
      facets: { space: ['living room'], surface: ['floor'], material: ['walnut', 'brass'], light: ['pendant light'], style: ['japandi'], furniture: ['sofa'] },
      trangThai: 'inferred',
      confidence: 0.5,
      source: 'text:name+tags',
      caption: null,
    },
    overallConfidence: 0.7,
  };
}

console.log('apply-intent');

it('tag dựng từ bản đọc chỉ có style:/material:/light:/frame: — thứ Distiller hiểu', () => {
  const tags = intentTagsFromAnalysis(summary(), ['style', 'material', 'light', 'framing']);
  assert.ok(tags.includes('style:japandi'));
  assert.ok(tags.includes('material:walnut') && tags.includes('material:brass'));
  assert.ok(tags.includes('light:warm · mid') && tags.includes('light:pendant light'));
  assert.ok(tags.includes('frame:landscape') && tags.includes('frame:horizon eye-level') && tags.includes('frame:3-point perspective'));
  assert.ok(tags.every((t) => /^(style|material|light|frame):/.test(t)));
});

it('intent không mang hình học/kích thước — kể cả khi bản đọc có bbox/coverage', () => {
  const intent = buildIntent({ imgId: 'img_1', assetName: 'Sofa walnut 2400mm', analysis: summary(), license: 'cc0', rightsAcknowledged: false });
  // tên ảnh có "2400mm" → intent vẫn phải sạch: caption chứa số đo bị coi là hình học ⇒ hàm báo false
  assert.strictEqual(intentHasNoGeometry(intent), false);
  const clean = buildIntent({ imgId: 'img_1', assetName: 'Sofa walnut', analysis: summary(), license: 'cc0', rightsAcknowledged: false });
  assert.strictEqual(intentHasNoGeometry(clean), true);
  assert.strictEqual(clean.geometryPolicy, 'descriptive-only');
  assert.ok(clean.excluded.includes('dimensions'));
  const json = JSON.stringify(clean.sources);
  assert.ok(!json.includes('bbox') && !json.includes('coverage') && !json.includes('mask'));
});

it('layersTouched chỉ gồm lớp có giá trị mới; chọn mặt → lớp tương ứng', () => {
  const all = buildIntent({ imgId: 'img_1', assetName: 'Sofa', analysis: summary(), license: 'cc0', rightsAcknowledged: false });
  assert.ok(all.layersTouched.includes('mauTyLe') && all.layersTouched.includes('anhSang') && all.layersTouched.includes('vatLieuMatId'));
  assert.ok(!all.layersTouched.includes('yDo') && !all.layersTouched.includes('rangBuocDoTin'));
  const onlyPalette = buildIntent({ imgId: 'img_1', assetName: 'Sofa', analysis: summary(), license: 'cc0', rightsAcknowledged: false, aspects: ['palette'] });
  assert.deepStrictEqual(onlyPalette.layersTouched.filter((k) => k !== 'anhNguon'), ['mauTyLe']);
});

it('áp = GÓP THÊM: giữ giá trị cũ, thêm mới, gộp nguồn; lớp verified giữ nguyên và được báo', () => {
  const card = newDnaCard('p1', 'PA1', '2026-01-01T00:00:00.000Z');
  card.layers.mauTyLe = { values: ['#111111'], trangThai: 'inferred', nguon: ['img_0'] };
  card.layers.vatLieuMatId = verifiedField(['oak']);
  const intent = buildIntent({ imgId: 'img_1', assetName: 'Sofa', analysis: summary(), license: 'cc0', rightsAcknowledged: false });
  const preview = describeChanges(card, intent);
  const mau = preview.find((c) => c.layer === 'mauTyLe')!;
  assert.deepStrictEqual(mau.added, ['#e8dccb', '#5a3b2a']);
  const vl = preview.find((c) => c.layer === 'vatLieuMatId')!;
  assert.strictEqual(vl.skippedVerified, true);

  const res = applyIntent(card, intent, '2026-01-02T00:00:00.000Z');
  assert.deepStrictEqual(res.after.layers.mauTyLe.values, ['#111111', '#e8dccb', '#5a3b2a']);
  assert.deepStrictEqual(res.after.layers.mauTyLe.nguon, ['img_0', 'img_1']);
  assert.strictEqual(res.after.layers.mauTyLe.trangThai, 'inferred');
  assert.deepStrictEqual(res.after.layers.vatLieuMatId, verifiedField(['oak']));
  assert.strictEqual(res.after.updatedAt, '2026-01-02T00:00:00.000Z');
  assert.strictEqual(res.after.layers.yDo.values.length, 0);
});

it('lùi được: before không bị mutate, revert trả đúng bản trước; áp lại lần 2 không nhân đôi giá trị', () => {
  const card = newDnaCard('p1', 'PA1', '2026-01-01T00:00:00.000Z');
  const snapshot = JSON.stringify(card);
  const intent = buildIntent({ imgId: 'img_1', assetName: 'Sofa', analysis: summary(), license: 'cc0', rightsAcknowledged: false });
  const res = applyIntent(card, intent);
  assert.strictEqual(JSON.stringify(card), snapshot);
  assert.strictEqual(revertIntent(res), card);
  const again = applyIntent(res.after, intent);
  assert.deepStrictEqual(again.after.layers.mauTyLe.values, res.after.layers.mauTyLe.values);
  assert.strictEqual(again.changes.length, 0);
});

console.log(`${n} test PASS — apply-intent`);
