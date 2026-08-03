/**
 * lib/cad/eyedropper.test.ts — chạy: node_modules/.bin/sucrase-node lib/cad/eyedropper.test.ts
 */
import { matchProps, matchPropsOne, DEFAULT_MATCH_PROP_FIELDS, type StyleFields } from './eyedropper';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

// [1] Copy đủ 5 field mặc định, KHÔNG đụng field khác (id/points giữ nguyên).
{
  const source = { layer: 'l-wall-2', color: '#ff0000', lineweight: 2, lineType: 'dashed', specId: 'spec-gach' };
  const target = { id: 'e1', type: 'hatch', points: [{ x: 0, y: 0 }], layer: 'l-floor', specId: undefined };
  const out = matchPropsOne(source, target as never);
  ok('layer copy đúng', out.layer === 'l-wall-2');
  ok('color copy đúng', (out as StyleFields).color === '#ff0000');
  ok('specId copy đúng', out.specId === 'spec-gach');
  ok('id KHÔNG bị đụng', (out as { id: string }).id === 'e1');
  ok('points KHÔNG bị đụng', (out as { points: unknown[] }).points.length === 1);
}

// [2] Nguồn KHÔNG có specId → đích bị đặt undefined (match thật, không giữ giá trị cũ).
{
  const source = { layer: 'l-a' }; // specId undefined trên nguồn
  const target = { id: 'e2', type: 'hatch', specId: 'spec-cu-can-mat' };
  const out = matchPropsOne(source, target as never);
  ok('specId đích bị xoá theo nguồn (match thật, không giữ giá trị cũ)', out.specId === undefined);
}

// [3] fields hẹp — chỉ copy layer, các field khác KHÔNG đổi.
{
  const source = { layer: 'l-b', color: '#00ff00', specId: 'spec-x' };
  const target = { id: 'e3', type: 'block', layer: 'l-old', color: '#0000ff', specId: 'spec-giu-nguyen' };
  const out = matchPropsOne(source, target as never, ['layer']);
  ok('chỉ layer đổi', out.layer === 'l-b');
  ok('color GIỮ NGUYÊN (không nằm trong fields hẹp)', out.color === '#0000ff');
  ok('specId GIỮ NGUYÊN (không nằm trong fields hẹp)', out.specId === 'spec-giu-nguyen');
}

// [4] matchProps nhiều đích cùng lúc — trả mảng mới, KHÔNG sửa tại chỗ mảng targets gốc.
{
  const source = { layer: 'l-c' };
  const targets = [
    { id: 'e4', type: 'hatch', layer: 'l-x' },
    { id: 'e5', type: 'hatch', layer: 'l-y' },
  ];
  const targetsSnapshot = JSON.stringify(targets);
  const out = matchProps(source, targets as never);
  ok('cả 2 đích đổi layer', out[0].layer === 'l-c' && out[1].layer === 'l-c');
  ok('mảng targets gốc KHÔNG bị sửa tại chỗ (immutable)', JSON.stringify(targets) === targetsSnapshot);
  ok('trả về ĐỐI TƯỢNG MỚI (khác reference)', out[0] !== targets[0]);
}

ok('DEFAULT_MATCH_PROP_FIELDS đủ 5 field theo spec (lớp/nét×3/matId)', DEFAULT_MATCH_PROP_FIELDS.length === 5);

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
