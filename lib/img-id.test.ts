/**
 * lib/img-id.test.ts — kiểm nền định danh ảnh chuẩn `img_` (Task #19). Chạy:
 *   node_modules/.bin/sucrase-node lib/img-id.test.ts
 */
import { IMG_ID_PREFIX, newImgId, isImgId, coerceImgId, imgIdFromKey, renderImgId } from './img-id';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log('[1] newImgId — luôn tiền tố img_, độc nhất, không đổi giữa các lần gọi cùng phiên');
const a = newImgId();
const b = newImgId();
ok('tiền tố img_', a.startsWith(IMG_ID_PREFIX) && b.startsWith(IMG_ID_PREFIX));
ok('2 id khác nhau (độc nhất)', a !== b);
ok('isImgId nhận id mới', isImgId(a) && isImgId(b));

console.log('\n[2] isImgId — chỉ true với chuỗi tiền tố img_');
ok('id cũ asset_… → false (khoá thuần, không phải img_)', !isImgId('asset_abc_1'));
ok('cuid → false', !isImgId('clh1abcd0000xyz'));
ok('nullish/không phải string → false', !isImgId(undefined) && !isImgId(null) && !isImgId(42));

console.log('\n[3] coerceImgId — giữ id img_ có sẵn, mint mới khi chưa có (không ép id khác dạng)');
ok('đã img_ → giữ nguyên', coerceImgId(a) === a);
ok('rỗng/null → mint img_ mới', isImgId(coerceImgId('')) && isImgId(coerceImgId(null)));
const cu = 'clh1abcd0000xyz';
ok('cuid (id ổn định khác dạng) → mint MỚI, KHÔNG nuốt cuid', coerceImgId(cu) !== cu && isImgId(coerceImgId(cu)));

console.log('\n[4] imgIdFromKey — phủ khoá ổn định (cuid library) vào không gian img_, TẤT ĐỊNH');
ok('img_<cuid>', imgIdFromKey(cu) === `img_${cu}`);
ok('cùng key → cùng img_ id (ổn định, không random)', imgIdFromKey(cu) === imgIdFromKey(cu));
ok('key đã img_ → giữ nguyên (không lồng img_img_)', imgIdFromKey(a) === a);

console.log('\n[5] renderImgId — id ảnh render tất định theo nodeId, tiền tố img_');
ok('total=1 → img_render:<nodeId>', renderImgId('abc', 0, 1) === 'img_render:abc');
ok('total>1 → img_render:<nodeId>:<index>', renderImgId('abc', 2, 5) === 'img_render:abc:2');
ok('cùng node → cùng id (hội tụ asset qua nhiều slide)', renderImgId('n1', 0, 1) === renderImgId('n1', 0, 1));
ok('id render là img_ hợp lệ', isImgId(renderImgId('abc', 0, 1)));

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} pass / ${fail} fail`);
if (fail > 0) process.exit(1);
