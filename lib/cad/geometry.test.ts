/**
 * lib/cad/geometry.test.ts — kiểm hình học cho translate/rotate/mirror/offset + Sprint 4
 * copy-paste bàn phím (pasteEntities). Chạy bằng:
 *   node_modules/.bin/sucrase-node lib/cad/geometry.test.ts
 * (cùng pattern modify.test.ts — không Jest/Vitest, không phải file production).
 */
import { translateEntity, rotateEntity, mirrorEntity, withNewId, offsetEntity, pasteEntities } from './geometry';
import type { LineEntity, RectEntity, BlockEntity, Entity } from './model';
import { newId } from './store';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
function approx(a: number, b: number, eps = 0.5): boolean {
  return Math.abs(a - b) <= eps;
}

const LAY = 'l-wall';
function L(a: { x: number; y: number }, b: { x: number; y: number }): LineEntity {
  return { id: newId('e'), type: 'line', layer: LAY, a, b };
}
function B(at: { x: number; y: number }): BlockEntity {
  return { id: newId('e'), type: 'block', layer: LAY, block: 'sofa2', at, rot: 0, sx: 1, sy: 1 };
}

/* ── Sprint 4: pasteEntities (copy-paste bàn phím Ctrl+C/Ctrl+V) ── */
function testPasteEntities() {
  console.log('\n[Sprint4] pasteEntities — bản sao id mới, dịch nhẹ, không đè bản gốc');

  const line = L({ x: 0, y: 0 }, { x: 100, y: 0 });
  const block = B({ x: 500, y: 500 });
  const src: Entity[] = [line, block];

  const pasted = pasteEntities(src);
  ok('trả về đúng số lượng entity', pasted.length === 2);
  ok('id mới khác id gốc (line)', pasted[0].id !== line.id);
  ok('id mới khác id gốc (block)', pasted[1].id !== block.id);
  ok('id không trùng giữa các bản dán', pasted[0].id !== pasted[1].id);

  const pl = pasted[0] as LineEntity;
  ok('mặc định dịch +20mm trục X (line.a)', approx(pl.a.x, line.a.x + 20, 0.01));
  ok('mặc định dịch +20mm trục Y (line.a)', approx(pl.a.y, line.a.y + 20, 0.01));
  ok('mặc định dịch +20mm trục X (line.b)', approx(pl.b.x, line.b.x + 20, 0.01));

  const pb = pasted[1] as BlockEntity;
  ok('block dịch đúng at.x', approx(pb.at.x, block.at.x + 20, 0.01));
  ok('block dịch đúng at.y', approx(pb.at.y, block.at.y + 20, 0.01));
  ok('block giữ nguyên rot/scale khi paste (không xoay/co giãn)', pb.rot === block.rot && pb.sx === block.sx && pb.sy === block.sy);

  // dx/dy tuỳ chỉnh (VD dán tại vị trí con trỏ chuột)
  const pastedCustom = pasteEntities([line], 300, -150);
  const pc = pastedCustom[0] as LineEntity;
  ok('dx/dy tuỳ chỉnh áp dụng đúng', approx(pc.a.x, line.a.x + 300, 0.01) && approx(pc.a.y, line.a.y - 150, 0.01));

  // paste 2 lần liên tiếp từ CÙNG nguồn (clipboard không đổi giữa các lần dán) → 2 bộ id khác nhau
  const p1 = pasteEntities(src);
  const p2 = pasteEntities(src);
  ok('2 lần dán liên tiếp cho 2 bộ id hoàn toàn khác nhau', p1[0].id !== p2[0].id && p1[1].id !== p2[1].id);

  ok('không sửa đổi entity gốc (line.a giữ nguyên)', line.a.x === 0 && line.a.y === 0);
  ok('không sửa đổi entity gốc (block.at giữ nguyên)', block.at.x === 500 && block.at.y === 500);
}

testPasteEntities();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
