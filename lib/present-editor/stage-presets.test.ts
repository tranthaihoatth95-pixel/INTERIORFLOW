/**
 * lib/present-editor/stage-presets.test.ts — kiểm NGUỒN DUY NHẤT kích thước sân khấu (PS-4).
 * Chạy: node_modules/.bin/sucrase-node lib/present-editor/stage-presets.test.ts
 */
import { STAGE_PRESETS, STAGE_PRESET_ORDER, DEFAULT_STAGE_PRESET, stageFor, isLandscape } from './stage-presets';
import { DECK_STANDARDS } from './standards';

let pass = 0;
let fail = 0;
const ok = (label: string, cond: boolean) => {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
};

console.log('[1] 16:9 giữ NGUYÊN 1920×1080 (KHÔNG đổi hành vi so trước PS-4)');
{
  const s = STAGE_PRESETS['16:9'];
  ok('w=1920', s.w === 1920);
  ok('h=1080', s.h === 1080);
  ok('pxPerPctW=19.2', s.pxPerPctW === 19.2);
  ok('pxPerPctH=10.8', s.pxPerPctH === 10.8);
  ok('DEFAULT_STAGE_PRESET = 16:9', DEFAULT_STAGE_PRESET === '16:9');
  ok('DECK_STANDARDS.stage TRỎ VÀO cùng preset (1 nguồn — gộp nợ kỹ thuật)', DECK_STANDARDS.stage.w === s.w && DECK_STANDARDS.stage.h === s.h);
}

console.log('[2] Đủ 5 khổ, đúng thứ tự hiển thị');
{
  ok('5 khổ', STAGE_PRESET_ORDER.length === 5);
  ok('có 16:9', STAGE_PRESET_ORDER.includes('16:9'));
  ok('có A4 ngang/dọc, A3 ngang/dọc', ['a4-landscape', 'a4-portrait', 'a3-landscape', 'a3-portrait'].every((id) => STAGE_PRESET_ORDER.includes(id as never)));
  for (const id of STAGE_PRESET_ORDER) {
    const s = STAGE_PRESETS[id];
    ok(`${id}: pxPerPctW khớp w/100`, Math.abs(s.pxPerPctW - s.w / 100) < 1e-9);
    ok(`${id}: pxPerPctH khớp h/100`, Math.abs(s.pxPerPctH - s.h / 100) < 1e-9);
    ok(`${id}: có nhãn tiếng Việt`, typeof s.label === 'string' && s.label.length > 0);
  }
}

console.log('[3] A4/A3 đúng tỉ lệ giấy ISO 216 (1:√2), ngang/dọc là NGHỊCH ĐẢO nhau');
{
  const SQRT2 = Math.SQRT2;
  const a4l = STAGE_PRESETS['a4-landscape'];
  const a4p = STAGE_PRESETS['a4-portrait'];
  const a3l = STAGE_PRESETS['a3-landscape'];
  const a3p = STAGE_PRESETS['a3-portrait'];
  ok('A4 ngang w/h ≈ √2 (sai số <1%)', Math.abs(a4l.w / a4l.h - SQRT2) / SQRT2 < 0.01);
  ok('A3 ngang w/h ≈ √2 (sai số <1%)', Math.abs(a3l.w / a3l.h - SQRT2) / SQRT2 < 0.01);
  ok('A4 dọc = A4 ngang xoay (w/h hoán đổi)', a4p.w === a4l.h && a4p.h === a4l.w);
  ok('A3 dọc = A3 ngang xoay (w/h hoán đổi)', a3p.w === a3l.h && a3p.h === a3l.w);
  ok('A3 gấp ĐÔI DIỆN TÍCH A4 (mỗi cạnh dài gấp √2, sai số <1%)', Math.abs((a3l.w * a3l.h) / (a4l.w * a4l.h) - 2) < 0.02);
}

console.log('[4] Khổ MÀN HÌNH, KHÔNG nhảy lên độ phân giải in 300dpi');
{
  // 300dpi thật của A3 (297×420mm) sẽ ~4961×3508px — mọi khổ ở đây phải NHỎ HƠN NHIỀU.
  for (const id of STAGE_PRESET_ORDER) {
    const s = STAGE_PRESETS[id];
    ok(`${id}: cạnh dài < 3000px (không phải cỡ in 300dpi)`, Math.max(s.w, s.h) < 3000);
  }
}

console.log('[5] stageFor() — an toàn ngược (id lạ/rỗng → 16:9)');
{
  ok('undefined → 16:9', stageFor(undefined).id === '16:9');
  ok('null → 16:9', stageFor(null).id === '16:9');
  ok('id lạ → 16:9 (deck cũ trước PS-4 hoặc dữ liệu hỏng không vỡ)', stageFor('not-a-real-id').id === '16:9');
  ok('id hợp lệ → đúng preset', stageFor('a3-portrait').id === 'a3-portrait');
}

console.log('[6] isLandscape()');
{
  ok('16:9 là ngang', isLandscape(STAGE_PRESETS['16:9']));
  ok('A4 ngang là ngang', isLandscape(STAGE_PRESETS['a4-landscape']));
  ok('A4 dọc KHÔNG phải ngang', !isLandscape(STAGE_PRESETS['a4-portrait']));
  ok('A3 dọc KHÔNG phải ngang', !isLandscape(STAGE_PRESETS['a3-portrait']));
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
