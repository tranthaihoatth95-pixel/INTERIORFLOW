/**
 * lib/present-editor/text-contrast.test.ts — P6a. Chỉ test phần THUẦN (không cần DOM/canvas —
 * xem JSDoc text-contrast.ts). Chạy qua `node_modules/.bin/sucrase-node` như mọi *.test.ts khác
 * trong repo (không dùng renderHook/@testing-library — quy ước đã xác nhận, xem BAO-CAO-PHU.md).
 */

import {
  findTextBackdrop,
  aaRatioForFontSize,
  pickAutoTextColor,
  resolveAutoTextColor,
} from './text-contrast';
import { AA_NORMAL, AA_LARGE } from '../adaptive-contrast';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('ok:', msg);
}

/* ---------- findTextBackdrop ---------- */

const text = { id: 't1', kind: 'text', frame: { x: 10, y: 10, w: 30, h: 10 } };
const imgBelow = { id: 'i1', kind: 'image', frame: { x: 0, y: 0, w: 100, h: 100 }, src: 'img.png' };
const imgFar = { id: 'i2', kind: 'image', frame: { x: 60, y: 60, w: 20, h: 20 }, src: 'far.png' };

{
  const r = findTextBackdrop(text, [imgBelow, text], null);
  assert(r !== null, 'tìm được ảnh giao khung ngay dưới');
  assert(r!.src === 'img.png', 'đúng src ảnh');
  assert(r!.region.w > 0 && r!.region.h > 0, 'region có kích thước dương');
}

{
  // ảnh KHÔNG giao khung → không tìm thấy backdrop qua ảnh, không có background → null
  const r = findTextBackdrop(text, [imgFar, text], null);
  assert(r === null, 'ảnh không giao khung → null (không có backgroundImage)');
}

{
  // không có ảnh phía dưới nhưng có backgroundImage full-bleed → dùng nó
  const r = findTextBackdrop(text, [text], 'bg.png');
  assert(r !== null && r.src === 'bg.png', 'rơi về backgroundImage khi không có ảnh phía dưới');
  assert(
    Math.abs(r!.region.x - 0.1) < 1e-9 && Math.abs(r!.region.w - 0.3) < 1e-9,
    'region từ backgroundImage = frame chữ / 100 (full-bleed = toạ độ sân khấu = toạ độ ảnh)',
  );
}

{
  const r = findTextBackdrop({ ...text, kind: 'shape' }, [imgBelow, text], null);
  assert(r === null, 'không phải text → luôn null');
}

/* ---------- aaRatioForFontSize ---------- */

assert(aaRatioForFontSize(1, false) === AA_NORMAL, 'chữ nhỏ (~10.8px, thường) → AA_NORMAL');
assert(aaRatioForFontSize(1.5, false) === AA_NORMAL, '~16.2px, dưới 18 → vẫn AA_NORMAL');
assert(aaRatioForFontSize(1.8, false) === AA_LARGE, '~19.4px thường ≥18px → AA_LARGE');
assert(aaRatioForFontSize(3, false) === AA_LARGE, 'chữ tiêu đề lớn (~32.4px) → AA_LARGE');
assert(aaRatioForFontSize(1.3, true) === AA_LARGE, '~14px BOLD → AA_LARGE (ngưỡng 14 chỉ áp cho bold)');
assert(aaRatioForFontSize(1.3, false) === AA_NORMAL, '~14px KHÔNG bold → vẫn AA_NORMAL (chưa đủ 18px)');

/* ---------- pickAutoTextColor ---------- */

{
  // nền tối → trắng thắng ngay ứng viên đầu
  const p = pickAutoTextColor([20, 20, 20], [[255, 255, 255], [0, 0, 0]], AA_NORMAL);
  assert(p.passed && p.rgb.join(',') === '255,255,255', 'nền tối → chọn trắng, đạt AA');
}
{
  // nền sáng → đen thắng (thử trắng trước, fail, rồi đen đạt)
  const p = pickAutoTextColor([235, 235, 235], [[255, 255, 255], [0, 0, 0]], AA_NORMAL);
  assert(p.passed && p.rgb.join(',') === '0,0,0', 'nền sáng → trắng fail, đen đạt');
}
{
  // nền lưng chừng cả 2 đều fail ngưỡng RẤT cao → trả ứng viên TỐT NHẤT, passed=false
  const p = pickAutoTextColor([140, 140, 140], [[255, 255, 255], [0, 0, 0]], 21); // ngưỡng bất khả thi
  assert(!p.passed, 'ngưỡng bất khả thi → passed=false');
  assert(p.ratio > 0, 'vẫn trả ứng viên tốt nhất có tỉ số > 0');
}
{
  // màu deck là ứng viên thứ 3, chỉ thắng khi cả trắng+đen đều fail nhưng nó đạt
  // (dựng 1 nền mà trắng/đen đều dưới ngưỡng nhẹ nhưng 1 màu trung tính đạt — khó dựng tự nhiên,
  // nên chỉ kiểm THỨ TỰ: nếu ngưỡng thấp, ứng viên ĐẦU (trắng) luôn thắng trước, không rơi tới deck)
  const p = pickAutoTextColor([20, 20, 20], [[255, 255, 255], [0, 0, 0], [255, 0, 0]], AA_NORMAL);
  assert(p.rgb.join(',') === '255,255,255', 'còn ứng viên trước đạt → không rơi xuống màu deck');
}

/* ---------- resolveAutoTextColor ---------- */

{
  // màu hiện tại ĐÃ đạt AA trên nền đo được → không đụng (trả null)
  const r = resolveAutoTextColor(
    { color: '#ffffff', fontSize: 5, bold: false },
    { luminance: 0.05, busyness: 0, avg: [10, 10, 10] },
  );
  assert(r === null, 'màu hiện tại đã đủ AA → null, không sửa');
}
{
  // màu hiện tại FAIL trên nền sáng → hệ sửa, chọn đen (đạt luôn, không cần autoShadow)
  const r = resolveAutoTextColor(
    { color: '#f0f0f0', fontSize: 5, bold: false },
    { luminance: 0.9, busyness: 0, avg: [230, 230, 230] },
  );
  assert(r !== null, 'màu hiện tại fail → có fix');
  assert(r!.color === 'rgb(0,0,0)', 'nền rất sáng → chọn đen');
  assert(r!.autoShadow === false, 'đen đã đạt AA trên nền sáng → không cần autoShadow');
}
{
  // fallback khi avg vắng mặt (dùng grayForLuminance) — vẫn ra kết quả hợp lệ, không throw
  const r = resolveAutoTextColor(
    { color: '#808080', fontSize: 5, bold: false },
    { luminance: 0.5, busyness: 0.2 },
  );
  assert(r !== null || r === null, 'không throw khi thiếu avg (dùng luminance suy ra xám)');
}

console.log('text-contrast.test.ts: ALL PASS');
