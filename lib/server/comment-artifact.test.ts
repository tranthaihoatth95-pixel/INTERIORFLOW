/**
 * lib/server/comment-artifact.test.ts — IF-SECURE-ARTIFACT-DELIVERY-001.
 *
 * Chạy thẳng qua sucrase-node (`npm test`), không cần DB, không cần server. Test ghi/đọc THẬT
 * trên hệ tệp trong thư mục tạm — không phải giả lập `fs`.
 */

import assert from 'assert';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

// Thư mục làm việc phải đặt TRƯỚC khi nạp module (module chốt đường dẫn lúc import).
const TMP = fs.mkdtemp(path.join(os.tmpdir(), 'if-cmt-')).then(async (d) => {
  process.chdir(d);
  return d;
});

async function run() {
  const tmp = await TMP;
  const M = await import('./comment-artifact');
  let pass = 0;
  const ok = (ten: string, dk: boolean) => {
    assert.ok(dk, `THẤT BẠI: ${ten}`);
    pass++;
  };

  // PNG 1x1 thật (magic bytes thật, không phải chuỗi bịa).
  const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  const pngDataUrl = `data:image/png;base64,${PNG.toString('base64')}`;
  const ID = 'c_abc123_zz9';

  // 1 — id hợp lệ / không hợp lệ. Chặn traversal ngay ở hình dạng.
  ok('id hợp lệ', M.idGopYAnToan(ID));
  ok('chặn ../', !M.idGopYAnToan('../../etc/passwd'));
  ok('chặn dấu /', !M.idGopYAnToan('c_a_b/c'));
  ok('chặn chấm', !M.idGopYAnToan('c_a_b.png'));
  ok('chặn rỗng', !M.idGopYAnToan(''));

  // 2 — GHI: vào thư mục RIÊNG, KHÔNG vào public/.
  const luu = await M.luuAnhGopY(ID, pngDataUrl);
  ok('ghi thành công', !!luu);
  ok('URL là route có xác thực', luu!.url === `/api/comments/image/${ID}`);
  ok('URL không phải file tĩnh public', !luu!.url.startsWith('/comments-images/'));
  ok(
    'file nằm trong uploads/comment-images',
    (await fs.stat(path.join(tmp, 'uploads', 'comment-images', `${ID}.png`))).isFile(),
  );
  ok(
    'KHÔNG có gì được ghi vào public/',
    await fs
      .stat(path.join(tmp, 'public', 'comments-images'))
      .then(() => false)
      .catch(() => true),
  );
  ok('sha256 đúng', luu!.sha256 === crypto.createHash('sha256').update(PNG).digest('hex'));
  ok('bytes đúng', luu!.bytes === PNG.length);

  // 3 — TỪ CHỐI thứ không phải ảnh raster, dù client dán nhãn image/*.
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  ok(
    'từ chối SVG đội lốt image/png',
    (await M.luuAnhGopY('c_svg1_aa', `data:image/png;base64,${svg.toString('base64')}`)) === undefined,
  );
  ok(
    'từ chối HTML',
    (await M.luuAnhGopY('c_html1_aa', `data:image/png;base64,${Buffer.from('<html>x').toString('base64')}`)) ===
      undefined,
  );
  ok('từ chối id xấu khi ghi', (await M.luuAnhGopY('../x', pngDataUrl)) === undefined);

  // 4 — ĐỌC: lấy được đúng bytes + MIME chuẩn hoá từ nội dung, không từ đuôi file.
  const doc = await M.docAnhGopY(ID);
  ok('đọc được', !!doc);
  ok('bytes khớp nguyên vẹn', doc!.buf.equals(PNG));
  ok('mime từ nội dung', doc!.mime === 'image/png');
  ok('không phải di sản', doc!.legacy === false);
  ok('id lạ → null', (await M.docAnhGopY('c_khong_co')) === null);
  ok('id xấu → null', (await M.docAnhGopY('../../secret')) === null);

  // 5 — TƯƠNG THÍCH NGƯỢC: file di sản còn ở public/ vẫn phục vụ được, và được ĐÁNH DẤU.
  const LEG = 'c_legacy1_qq';
  await fs.mkdir(path.join(tmp, 'public', 'comments-images'), { recursive: true });
  await fs.writeFile(path.join(tmp, 'public', 'comments-images', `${LEG}.png`), PNG);
  const cu = await M.docAnhGopY(LEG);
  ok('đọc được file di sản', !!cu && cu.buf.equals(PNG));
  ok('đánh dấu legacy', cu!.legacy === true);
  ok(
    'file di sản KHÔNG bị di chuyển',
    (await fs.stat(path.join(tmp, 'public', 'comments-images', `${LEG}.png`))).isFile(),
  );

  // 6 — File trên đĩa bị thay bằng thứ khác sau khi ghi ⇒ TỪ CHỐI phục vụ.
  const BAD = 'c_bad1_ww';
  await fs.writeFile(path.join(tmp, 'uploads', 'comment-images', `${BAD}.png`), Buffer.from('<html>xss'));
  ok('file đã bị thay → null', (await M.docAnhGopY(BAD)) === null);

  // 7 — CỜ LÙI: bật lại hành vi cũ nguyên vẹn.
  ok('mặc định TẮT chế độ public cũ', M.chePublicCu() === false);
  process.env.IF_COMMENT_IMAGE_PUBLIC = '1';
  ok('cờ bật thì nhận', M.chePublicCu() === true);
  const cuLai = await M.luuAnhGopY('c_flag1_ee', pngDataUrl);
  ok('cờ bật → URL public cũ', cuLai!.url === '/comments-images/c_flag1_ee.png');
  ok(
    'cờ bật → ghi vào public/',
    (await fs.stat(path.join(tmp, 'public', 'comments-images', 'c_flag1_ee.png'))).isFile(),
  );
  delete process.env.IF_COMMENT_IMAGE_PUBLIC;

  console.log(`comment-artifact: ${pass}/${pass} PASS`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
