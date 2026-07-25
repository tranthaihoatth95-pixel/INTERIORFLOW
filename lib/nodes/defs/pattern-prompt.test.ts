/**
 * lib/nodes/defs/pattern-prompt.test.ts — khoá lại các BÀI HỌC từ 16 lần thử hoa văn Chăm:
 * negative luôn chặn mandala/damask/vàng kim; chọn "Pattern phẳng" thì chặn cả từ khoá 3D;
 * neo văn hoá phải sinh ra VẬT THỂ cụ thể (gạch/phù điêu), không để tên phong cách trôi nổi.
 * Chạy: node_modules/.bin/sucrase-node lib/nodes/defs/pattern-prompt.test.ts
 */
import {
  buildPatternPrompt,
  patternNegative,
  culturalAnchor,
  palettePrompt,
  referenceStrength,
  PATTERN_NEGATIVE_FLAT,
} from './pattern-prompt';

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

console.log('patternNegative — chặn đúng thứ AI hay chệch sang');
{
  const flat = patternNegative('Pattern phẳng');
  const relief = patternNegative('Phù điêu nổi');
  for (const bad of ['mandala', 'damask', 'chinoiserie', 'kitsch bright gold', 'saturated red orange']) {
    ok(`luôn chặn "${bad}"`, flat.includes(bad) && relief.includes(bad));
  }
  ok('Pattern phẳng chặn thêm khối 3D', flat.includes('3d') && flat.includes('relief') && flat.includes('cast shadow') && flat.includes('bevel'));
  ok('Phù điêu KHÔNG chặn 3D (cần khối)', !relief.includes(PATTERN_NEGATIVE_FLAT));
}

console.log('culturalAnchor — neo vào VẬT THỂ THẬT');
{
  const flat = culturalAnchor('Chăm pa', 'Pattern phẳng');
  ok('có tên nền văn hoá', flat.includes('Chăm pa'));
  ok('neo vào viên gạch gốm cụ thể', flat.includes('fired-clay') && flat.includes('tiles'));
  ok('nói rõ không phải style chung', flat.includes('not a generic decorative style'));
  const relief = culturalAnchor('Khmer', 'Phù điêu nổi');
  ok('phù điêu neo vào tấm đá chạm', relief.includes('carved sandstone') && relief.includes('panel'));
  const mural = culturalAnchor('Đông Sơn', 'Mural (tranh cảnh)');
  ok('mural neo vào tranh tường', mural.includes('painted') && mural.includes('wall'));
  ok('anchor rỗng → chuỗi rỗng', culturalAnchor('   ', 'Pattern phẳng') === '');
}

console.log('palettePrompt');
ok('gộp 2 màu', palettePrompt(['#C9BCA8', '#6B4A2F']).includes('#C9BCA8 and #6B4A2F'));
ok('bỏ ô trống', palettePrompt(['#111', '', undefined]) === 'colour palette limited to #111');
ok('không màu → rỗng', palettePrompt(['', undefined]) === '');

console.log('buildPatternPrompt');
{
  const p = buildPatternPrompt({
    prompt: 'đường xoắn kép',
    kind: 'Pattern phẳng',
    repeat: 'Grid',
    tone: '2 màu',
    anchor: 'Chăm pa',
    colors: ['#C9BCA8', '#6B4A2F'],
    hasReference: false,
  });
  ok('có mô tả người dùng', p.includes('đường xoắn kép'));
  ok('tự thêm "completely flat two-dimensional" (user không phải tả)', p.includes('completely flat two-dimensional graphic'));
  ok('diễn đạt DƯƠNG (FLUX bỏ qua negative) — không dùng "no shadow"', p.includes('perfectly even matte surface') && !p.includes('no relief'));
  ok('dịch nhịp lặp Grid', p.includes('regular square grid repeat'));
  ok('dịch tông 2 màu', p.includes('two-colour palette'));
  ok('neo vật thể đứng TRƯỚC mô tả', p.indexOf('fired-clay') < p.indexOf('đường xoắn kép'));
}
{
  const withRef = buildPatternPrompt({
    prompt: '',
    kind: 'Pattern phẳng',
    repeat: 'So le (half-drop)',
    tone: 'Tone-on-tone',
    anchor: 'Chăm pa',
    colors: [],
    hasReference: true,
  });
  ok('có reference → yêu cầu giữ motif ảnh mẫu', withRef.startsWith('keep the exact motif vocabulary'));
  ok('reference + phẳng → có câu "dẹt khối"', withRef.includes('flat filled silhouettes') && withRef.includes('stencil'));
  ok('half-drop dịch đúng', withRef.includes('half-drop offset repeat'));
}
{
  const mural = buildPatternPrompt({
    prompt: 'cảnh vũ nữ',
    kind: 'Mural (tranh cảnh)',
    repeat: 'Không lặp',
    tone: 'Đa sắc',
    anchor: '',
    colors: [],
    hasReference: false,
  });
  ok('mural = không lặp', mural.includes('non-repeating'));
  ok('anchor rỗng thì không nhồi chữ', !mural.includes('documented from'));
}

console.log('referenceStrength');
{
  const flat = referenceStrength('Pattern phẳng', 0.65);
  const relief = referenceStrength('Phù điêu nổi', 0.65);
  ok('phẳng cần đổi nhiều hơn phù điêu', flat > relief);
  ok('giữ motif cao → strength thấp', referenceStrength('Pattern phẳng', 0.9) < flat);
  ok('giữ motif thấp → strength cao', referenceStrength('Pattern phẳng', 0.3) > flat);
  ok('phẳng ≥ 0.8 (đo thật: 0.78 vẫn giữ khối phù điêu)', referenceStrength('Pattern phẳng', 0.65) >= 0.8);
  ok('luôn trong khoảng an toàn 0.35–0.92', [0, 0.3, 0.65, 0.9, 5, NaN].every((k) => {
    const s = referenceStrength('Pattern phẳng', k);
    return s >= 0.35 && s <= 0.92;
  }));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
