/**
 * scripts/proof/secure-artifact-delivery.mjs — CHỨNG MINH TRÊN RUNTIME cho
 * IF-SECURE-ARTIFACT-DELIVERY-001. Không phải test đơn vị: gọi HTTP THẬT vào một Next server
 * đang chạy, đúng đường mà trình duyệt đi.
 *
 * ⚠️ HARNESS CŨNG PHẢI ĐƯỢC CHỨNG MINH (bài học F-15, xem `docs/design-campaign/02-FAILURE-LEDGER.md`).
 * Ca 0 dưới đây tồn tại CHỈ để chứng minh cookie do harness đúc THẬT SỰ xác thực được. Nếu bỏ ca 0,
 * mọi ca "authorized" phía sau có thể xanh vì lý do sai (server 401 hết, và ta lại đọc nhầm là
 * "chặn đúng"). Ca 0 mà đỏ thì toàn bộ kết quả bên dưới VÔ NGHĨA — script dừng ngay, không báo PASS.
 *
 * Chạy:  node scripts/proof/secure-artifact-delivery.mjs [http://127.0.0.1:3011]
 */

import { SignJWT } from 'jose';
import { readFileSync } from 'fs';

const BASE = process.argv[2] || 'http://127.0.0.1:3011';

// Đọc AUTH_SECRET đúng như server đọc — không đoán, không hardcode.
const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [
      l.slice(0, l.indexOf('=')).trim(),
      // Next tự bóc dấu nháy bao quanh giá trị .env; harness phải bóc y hệt, nếu không
      // secret lệch một cặp nháy và MỌI ca "authorized" đỏ vì lý do sai. Đã sập đúng ca này.
      l
        .slice(l.indexOf('=') + 1)
        .trim()
        .replace(/^(['"])([\s\S]*)\1$/, '$2'),
    ]),
);
const SECRET = env.AUTH_SECRET;
if (!SECRET) throw new Error('Không đọc được AUTH_SECRET từ .env — dừng, không giả vờ chạy được.');
const COOKIE_NAME = 'if_session';

async function mintCookie(sub) {
  const t = await new SignJWT({ sub })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(SECRET));
  return `${COOKIE_NAME}=${t}`;
}

async function mintExpired(sub) {
  const t = await new SignJWT({ sub })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
    .sign(new TextEncoder().encode(SECRET));
  return `${COOKIE_NAME}=${t}`;
}

const ket = [];
async function ca(ten, mong, fn) {
  let got;
  try {
    got = await fn();
  } catch (e) {
    got = `LỖI: ${e.message}`;
  }
  const dat = got === mong;
  ket.push({ ten, mong, got, dat });
  console.log(`${dat ? '  ok  ' : ' KHÔNG '} ${ten} — mong ${mong}, nhận ${got}`);
  return dat;
}

const status = async (p, cookie) =>
  (await fetch(BASE + p, { headers: cookie ? { cookie } : {}, redirect: 'manual' })).status;

const SUB = process.env.PROOF_USER_ID;

async function main() {
  console.log(`# IF-SECURE-ARTIFACT-DELIVERY-001 · runtime proof · ${BASE}\n`);

  if (!SUB) {
    console.error('Thiếu PROOF_USER_ID (id user thật trong dev.db). Không đoán id — dừng.');
    process.exit(2);
  }

  const good = await mintCookie(SUB);

  // ── CA 0 — CHỨNG MINH HARNESS. Cookie đúc ra phải thật sự mở được một route có xác thực.
  const harnessOk = await ca('CA 0 · HARNESS: cookie đúc mở được GET /api/comments', 200, () =>
    status('/api/comments', good),
  );
  if (!harnessOk) {
    console.error(
      '\n⛔ HARNESS ĐỎ. Cookie không xác thực được ⇒ mọi ca "authorized" bên dưới sẽ 401 vì lý do ' +
        'SAI. Không báo PASS. Đây đúng là bẫy đã sập một lần ở F-15 (module rỗng vẫn "LOADED").',
    );
    process.exit(1);
  }

  // ── Các ca thật.
  await ca('CA 1 · KHÔNG phiên → ảnh bị chặn', 401, () => status('/api/comments/image/c_abc123_zz9'));
  await ca('CA 2 · CÓ phiên, id không tồn tại → 404 (không lộ tồn tại)', 404, () =>
    status('/api/comments/image/c_abc123_zz9', good),
  );
  await ca('CA 3 · phiên HẾT HẠN → chặn', 401, async () =>
    status('/api/comments/image/c_abc123_zz9', await mintExpired(SUB)),
  );
  await ca('CA 4 · chữ ký RÁC → chặn', 401, () =>
    status('/api/comments/image/c_abc123_zz9', `${COOKIE_NAME}=rac.rac.rac`),
  );
  await ca('CA 5 · traversal `..%2f..%2fetc%2fpasswd` (có phiên) → 404, không đọc file', 404, () =>
    status('/api/comments/image/..%2f..%2fetc%2fpasswd', good),
  );
  await ca('CA 6 · id có đuôi file → 404 (id không phải tên file)', 404, () =>
    status('/api/comments/image/c_abc123_zz9.png', good),
  );

  // ── CA 7-10 · ĐƯỜNG THẬT END-TO-END: đăng ảnh qua POST rồi đọc lại qua route mới.
  // Ghi thêm 1 góp ý vào `comments-review.json` (thêm, không sửa hàng cũ) và XOÁ ở cuối.
  const PNG =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const post = await fetch(BASE + '/api/comments', {
    method: 'POST',
    headers: { cookie: good, 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'proof IF-SECURE-ARTIFACT-DELIVERY-001', image: `data:image/png;base64,${PNG}` }),
  });
  const tao = await post.json();
  const url = tao?.comment?.image;
  const cid = tao?.comment?.id;

  await ca('CA 7 · POST trả URL là route CÓ XÁC THỰC, không phải file tĩnh', true, () =>
    typeof url === 'string' && url.startsWith('/api/comments/image/'),
  );
  await ca('CA 8 · CÓ phiên → đọc được ảnh vừa đăng', 200, () => status(url, good));
  await ca('CA 9 · KHÔNG phiên → CHÍNH ảnh đó bị chặn', 401, () => status(url));
  await ca('CA 10 · đường CŨ `/comments-images/<id>.png` không còn phục vụ ảnh này', true, async () => {
    const r = await fetch(`${BASE}/comments-images/${cid}.png`, { redirect: 'manual' });
    return r.status !== 200;
  });
  await ca('CA 11 · header nosniff + cache private', true, async () => {
    const r = await fetch(BASE + url, { headers: { cookie: good } });
    return (
      r.headers.get('x-content-type-options') === 'nosniff' &&
      (r.headers.get('cache-control') || '').includes('private') &&
      r.headers.get('content-type') === 'image/png'
    );
  });

  if (cid) {
    await fetch(`${BASE}/api/comments?id=${cid}`, { method: 'DELETE', headers: { cookie: good } });
    console.log(`  (đã xoá góp ý chứng minh ${cid} — comments-review.json trả về nguyên trạng)`);
  }

  const fail = ket.filter((k) => !k.dat);
  console.log(`\n${ket.length - fail.length}/${ket.length} ĐẠT`);
  if (fail.length) process.exit(1);
}

main();
