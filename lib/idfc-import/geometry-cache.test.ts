/**
 * lib/idfc-import/geometry-cache.test.ts — cache có trần: LRU theo byte + số mục, mục quá trần bị từ chối.
 * Chạy: node_modules/.bin/sucrase-node lib/idfc-import/geometry-cache.test.ts
 */
import { BoundedGeometryCache } from './geometry-cache';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
const bytes = (n: number, fill = 1) => new Uint8Array(n).fill(fill);

(async () => {
  console.log('geometry-cache');
  const c = new BoundedGeometryCache({ maxBytes: 100, maxEntries: 3 });
  ok('set 40 ⇒ true', c.set('a', bytes(40)));
  ok('set 40 ⇒ true', c.set('b', bytes(40)));
  ok('stats 80 bytes/2 mục', c.stats().bytes === 80 && c.stats().entries === 2);
  ok('set 40 nữa ⇒ đuổi a (cũ nhất)', c.set('c', bytes(40)) && !c.has('a') && c.has('b') && c.has('c'));
  ok('bytes ≤ trần sau đuổi', c.stats().bytes <= 100 && c.stats().evictions === 1);
  c.get('b'); // chạm b ⇒ c thành cũ nhất
  c.set('d', bytes(40));
  ok('LRU: chạm b thì c bị đuổi, b còn', c.has('b') && !c.has('c') && c.has('d'));
  ok('mục > trần bị từ chối, không đuổi ai', !c.set('big', bytes(101)) && c.stats().entries === 2);
  ok('thay cùng khoá trừ byte cũ', c.set('b', bytes(10)) && c.stats().bytes === 50);
  ok('trần số mục', (() => { const k = new BoundedGeometryCache({ maxBytes: 1000, maxEntries: 2 }); k.set('1', bytes(1)); k.set('2', bytes(1)); k.set('3', bytes(1)); return k.stats().entries === 2 && !k.has('1'); })());
  ok('byte trả về đúng tham chiếu (không copy/sửa)', (() => { const k = new BoundedGeometryCache({ maxBytes: 10 }); const v = bytes(3, 7); k.set('x', v); return k.get('x') === v; })());
  ok('delete + clear', c.delete('b') && !c.has('b') && (c.clear(), c.stats().bytes === 0 && c.stats().entries === 0));
  let loads = 0;
  const k = new BoundedGeometryCache({ maxBytes: 100 });
  const load = async () => { loads += 1; return bytes(5); };
  await k.getOrLoad('g', load);
  await k.getOrLoad('g', load);
  ok('getOrLoad tải đúng 1 lần', loads === 1 && k.stats().hits === 1 && k.stats().misses === 1);
  let threw = false;
  try { new BoundedGeometryCache({ maxBytes: 0 }); } catch { threw = true; }
  ok('maxBytes 0 ⇒ throw lúc dựng', threw);

  console.log(`\n${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
})();
