/**
 * lib/present-editor/format-painter.test.ts — kiểm PHẦN THUẦN của Format Painter. Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/format-painter.test.ts
 */
import { extractTextFormat, applyTextFormat } from './format-painter';
import { makeText } from './model';

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

// 1) extractTextFormat lấy đúng field định dạng, KHÔNG lấy text/id/frame.
{
  const src = makeText({
    text: 'Nguồn — không được copy sang đích',
    fontSize: 8.4,
    color: '#f06020',
    align: 'right',
    bold: true,
    italic: true,
    underline: true,
    tracking: 2,
    lineHeight: 1.5,
    bullet: true,
    listStyle: 'bullet',
    fontFamily: 'Modern',
  });
  const fmt = extractTextFormat(src);
  ok('extract: fontSize đúng', fmt.fontSize === 8.4);
  ok('extract: color đúng', fmt.color === '#f06020');
  ok('extract: align đúng', fmt.align === 'right');
  ok('extract: bold đúng', fmt.bold === true);
  ok('extract: italic đúng', fmt.italic === true);
  ok('extract: underline đúng', fmt.underline === true);
  ok('extract: tracking đúng', fmt.tracking === 2);
  ok('extract: lineHeight đúng', fmt.lineHeight === 1.5);
  ok('extract: bullet đúng', fmt.bullet === true);
  ok('extract: listStyle đúng', fmt.listStyle === 'bullet');
  ok('extract: fontFamily đúng', fmt.fontFamily === 'Modern');
  ok('extract: KHÔNG có field text', !('text' in fmt));
  ok('extract: KHÔNG có field id', !('id' in fmt));
  ok('extract: KHÔNG có field frame', !('frame' in fmt));
}

// 2) applyTextFormat áp đúng định dạng vào đích, GIỮ NGUYÊN text/id/frame/role của đích.
{
  const src = makeText({
    fontSize: 6.2,
    color: '#002850',
    align: 'center',
    bold: true,
    italic: false,
    underline: true,
    tracking: 1.2,
    lineHeight: 1.3,
    bullet: false,
    listStyle: 'number',
    fontFamily: 'Elegant',
  });
  const fmt = extractTextFormat(src);

  const dest = makeText({
    text: 'Nội dung riêng của đích — PHẢI giữ nguyên',
    fontSize: 3,
    color: '#111111',
    align: 'left',
    bold: false,
    italic: true,
    role: 'title',
  });
  const destId = dest.id;
  const destText = dest.text;
  const destFrame = { ...dest.frame };

  applyTextFormat(dest, fmt);

  ok('apply: fontSize đổi theo nguồn', dest.fontSize === 6.2);
  ok('apply: color đổi theo nguồn', dest.color === '#002850');
  ok('apply: align đổi theo nguồn', dest.align === 'center');
  ok('apply: bold đổi theo nguồn', dest.bold === true);
  ok('apply: italic đổi theo nguồn', dest.italic === false);
  ok('apply: underline đổi theo nguồn', dest.underline === true);
  ok('apply: tracking đổi theo nguồn', dest.tracking === 1.2);
  ok('apply: lineHeight đổi theo nguồn', dest.lineHeight === 1.3);
  ok('apply: listStyle đổi theo nguồn', dest.listStyle === 'number');
  ok('apply: fontFamily đổi theo nguồn', dest.fontFamily === 'Elegant');

  ok('apply: text KHÔNG đổi', dest.text === destText);
  ok('apply: id KHÔNG đổi', dest.id === destId);
  ok('apply: frame KHÔNG đổi', JSON.stringify(dest.frame) === JSON.stringify(destFrame));
  ok('apply: role KHÔNG đổi (không nằm trong định dạng copy)', dest.role === 'title');
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
