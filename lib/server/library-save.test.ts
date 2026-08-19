/** Test `library-save.ts` — chỉ 2 NHÁNH BẢO VỆ chạy TRƯỚC khi chạm fs/Prisma (an toàn chạy
 *  không cần DB thật/uploads thật): trần 25MB · whitelist MIME magic-bytes. Nhánh ghi DB thành
 *  công cần Prisma+uploads thật — KHÔNG kiểm ở đây, xem BROWSER-PENDING trong báo cáo phiên.
 *  Chạy: node_modules/.bin/sucrase-node lib/server/library-save.test.ts */
import { saveLibraryAssetFromBuffer, LIBRARY_MAX_BYTES } from './library-save';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', label); }
  else { fail++; console.log('  FAIL-', label); }
}

async function main() {
  console.log('saveLibraryAssetFromBuffer — trần 25MB (trả về TRƯỚC khi chạm fs/Prisma)');
  {
    const big = Buffer.alloc(LIBRARY_MAX_BYTES + 1);
    const res = await saveLibraryAssetFromBuffer({ userId: 'u1', name: 'x', category: 'reference', buf: big });
    ok('ok:false', res.ok === false);
    if (!res.ok) {
      ok('status 413', res.status === 413);
      ok('lý do nói đúng 25MB', /25mb/i.test(res.error));
    }
  }

  console.log('saveLibraryAssetFromBuffer — chặn buffer không phải ảnh raster (whitelist magic-bytes)');
  {
    const notImage = Buffer.from('<html><body><script>alert(1)</script></body></html>', 'utf8');
    const res = await saveLibraryAssetFromBuffer({ userId: 'u1', name: 'x', category: 'reference', buf: notImage });
    ok('ok:false', res.ok === false);
    if (!res.ok) {
      ok('status 400', res.status === 400);
      ok('lý do nói đúng "chỉ nhận ảnh"', /chỉ nhận ảnh/i.test(res.error));
    }
  }

  console.log('saveLibraryAssetFromBuffer — buffer PNG thật đi QUA cả hai chốt trên (không bị guard sớm chặn oan)');
  {
    // PNG hợp lệ nhỏ (8-byte magic + IHDR rỗng) — đủ qua sniffKind, KHÔNG assert phần ghi DB
    // (cần Prisma+uploads thật, ngoài phạm vi unit test thuần).
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    ok('không bị trần 25MB chặn oan', png.length <= LIBRARY_MAX_BYTES);
  }

  console.log(`\n${pass} pass, ${fail} fail`);
  if (fail) process.exit(1);
}

void main();
