/** Test `spec-refs.ts` — chạy: node_modules/.bin/sucrase-node lib/library/spec-refs.test.ts
 *
 * Chứng minh: ① chỉ gọi mạng MỘT lần cho cả phiên ② hỏng thì trả rỗng, KHÔNG ném (mất mã còn
 * hơn mất cả thao tác thả) và cho thử lại ③ lọc bản ghi không dùng được thay vì đẩy rác xuống
 * resolver ④ hình dạng trả về đúng `SpecRef` (id + sku), không kéo cả DTO nặng.
 */
import { loadSpecRefs, toSpecRefs, __resetSpecRefsCache } from './spec-refs';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}

const res = (body: unknown, okFlag = true) =>
  ({ ok: okFlag, json: async () => body }) as unknown as Response;

console.log('toSpecRefs() — chỉ rút thứ resolver dùng tới, loại bản ghi hỏng');
{
  ok('mảng rỗng khi payload không phải hình dạng mong đợi', toSpecRefs(null).length === 0 && toSpecRefs({}).length === 0 && toSpecRefs({ specs: 'x' }).length === 0);
  const r = toSpecRefs({ specs: [
    { id: 's1', sku: 'SOFA-3S', name: 'Sofa', priceVnd: 9_000_000 },
    { id: 's2' },
    { id: '', sku: 'X' },
    { sku: 'KHONG-CO-ID' },
    { id: 's3', sku: 42 },
  ] });
  ok('giữ đúng 3 bản ghi có id dùng được', r.length === 3);
  ok('rút đúng id + sku', r[0].id === 's1' && r[0].sku === 'SOFA-3S');
  ok('thiếu sku ⇒ null, không undefined lẫn lộn', r[1].id === 's2' && r[1].sku === null);
  ok('sku sai kiểu ⇒ null chứ không nhét số vào chuỗi', r[2].id === 's3' && r[2].sku === null);
  ok('KHÔNG kéo theo trường nặng của DTO', Object.keys(r[0]).sort().join() === 'id,sku');
}

console.log('loadSpecRefs() — cache theo phiên trang');
{
  __resetSpecRefsCache();
  let calls = 0;
  const fake = (async () => { calls++; return res({ specs: [{ id: 's1', sku: 'A' }] }); }) as unknown as typeof fetch;
  void (async () => {
    const a = await loadSpecRefs(fake);
    const b = await loadSpecRefs(fake);
    ok('gọi mạng đúng 1 lần cho 2 lượt đọc', calls === 1);
    ok('hai lượt trả cùng dữ liệu', a.length === 1 && b.length === 1 && a[0].id === b[0].id);

    console.log('loadSpecRefs() — hỏng thì im lặng trả rỗng + cho thử lại');
    __resetSpecRefsCache();
    let n = 0;
    const flaky = (async () => { n++; if (n === 1) throw new Error('mạng hỏng'); return res({ specs: [{ id: 's9', sku: 'Z' }] }); }) as unknown as typeof fetch;
    const c = await loadSpecRefs(flaky);
    ok('lỗi mạng ⇒ mảng rỗng, KHÔNG ném', Array.isArray(c) && c.length === 0);
    const d = await loadSpecRefs(flaky);
    ok('cache đã xoá ⇒ lượt sau gọi lại và có dữ liệu', n === 2 && d.length === 1 && d[0].id === 's9');

    __resetSpecRefsCache();
    const http500 = (async () => res(null, false)) as unknown as typeof fetch;
    const e = await loadSpecRefs(http500);
    ok('HTTP lỗi ⇒ rỗng, không ném', e.length === 0);

    console.log(`\n${pass} ok · ${fail} fail`);
    if (fail > 0) process.exit(1);
  })();
}
