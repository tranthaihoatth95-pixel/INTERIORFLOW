/**
 * scripts/proof/identity-boundary.mjs — IDENTITY BOUNDARY PROBE (Wave 1, Hoà mở 26/08).
 *
 * Hoà: *"R1 không chờ 'Electron hoàn hảo' mới làm access. Tạo Identity Boundary Probe hẹp: xác
 * minh identity/session/access primitive ở Electron current runtime."*
 *
 * ⚠️ PHẠM VI CHÍNH XÁC CỦA BẰNG CHỨNG NÀY — đọc kỹ trước khi trích dẫn:
 * Probe chạy `next start` THẬT với `NODE_ENV=production` và dựng môi trường **y hệt cách
 * `electron/main.js` dựng nó**: cwd = thư mục userData (không phải gốc repo), `DATABASE_URL` trỏ
 * tuyệt đối vào `<userData>/dev.db`, `AUTH_SECRET` lấy từ `<userData>/config.json` (auto-sinh +
 * persist, `electron/main.js:222-225`). Đây là **runtime sản xuất thật của tiến trình server** —
 * đúng tiến trình mà Electron spawn.
 * KHÔNG bao gồm: binary `.app` đã đóng gói, `prisma db push` lúc khởi động, cửa sổ Electron,
 * auto-update. Những thứ đó vẫn `NOT ASSESSED`.
 * ⇒ Nhãn đúng cho kết quả này: `PASS — production server runtime (Electron-equivalent env)`.
 * KHÔNG được gọi là `PASS — Electron packaged`.
 *
 * ⚠️ CỔNG HARNESS (F-15) ở CA 0.
 *
 * Yêu cầu: đã chạy `npx next build` (probe không tự build).
 * Chạy:  node scripts/proof/identity-boundary.mjs
 */

import { spawn } from 'child_process';
import { SignJWT } from 'jose';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, symlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import crypto from 'crypto';
import path from 'path';

const REPO = process.cwd();

/**
 * ⚠️ PHÁT HIỆN THẬT, ĐÃ LÀM ĐỎ PROBE MỘT LƯỢT: `next start <dir>` nạp `<dir>/.env`.
 * Chạy probe thẳng trên gốc repo thì server đọc **AUTH_SECRET của repo**, không đọc
 * `<userData>/config.json` — nên ca "thiếu AUTH_SECRET" KHÔNG BAO GIỜ đỏ và ta đã có thể kết
 * luận sai rằng fail-closed không hoạt động (hoặc tệ hơn: rằng nó hoạt động, vì lý do sai).
 *
 * Bản đóng gói KHÔNG có `.env`: `package.json → build.files` liệt kê `electron/`, `.next/`,
 * `prisma/`, `public/`, `node_modules/`, `next.config.mjs`, `package.json` — **không có `.env`**,
 * và `.env` còn nằm trong `.gitignore`. ⇒ Để trung thực với bản đóng gói, probe dựng một appRoot
 * TẠM: symlink đúng những thứ được đóng gói, KHÔNG có `.env`.
 */
const APP_ROOT = (() => {
  const d = mkdtempSync(path.join(tmpdir(), 'if-approot-'));
  for (const n of ['.next', 'node_modules', 'prisma', 'public'])
    symlinkSync(path.join(REPO, n), path.join(d, n));
  for (const n of ['package.json', 'next.config.mjs']) copyFileSync(path.join(REPO, n), path.join(d, n));
  return d;
})();
const ket = [];
const servers = [];

function ca(ten, mong, got) {
  const dat = JSON.stringify(mong) === JSON.stringify(got);
  ket.push({ ten, dat });
  console.log(`${dat ? '  ok  ' : ' KHÔNG '} ${ten} — mong ${JSON.stringify(mong)}, nhận ${JSON.stringify(got)}`);
  return dat;
}
function chuaDo(ten, lyDo) {
  ket.push({ ten, dat: true, chuaDo: true });
  console.log(`  ⚪    ${ten} — NOT ASSESSED: ${lyDo}`);
}

/** Dựng userData y như `electron/main.js:118-129` + `:222-225`. */
function dungUserData(secret) {
  const dir = mkdtempSync(path.join(tmpdir(), 'if-userdata-'));
  mkdirSync(path.join(dir, 'uploads'), { recursive: true });
  const db = path.join(dir, 'dev.db');
  // Nguồn là `prisma/dev.db` (theo DATABASE_URL trong .env) — KHÔNG phải `dev.db` ở gốc repo:
  // tệp gốc repo là 0 byte, và chép nó ra thì server chạy trên DB RỖNG, mọi ca danh tính đỏ vì
  // "không tìm thấy user" chứ không phải vì chữ ký. Đã sập đúng ca này.
  // Chép CẢ WAL/SHM: SQLite ở chế độ WAL giữ các hàng mới nhất trong `dev.db-wal`. Chép mỗi
  // `dev.db` là được một bản THIẾU — user vừa tạo sẽ không có, và mọi ca danh tính đỏ vì lý do
  // sai (401 vì "không tìm thấy user", không phải vì chữ ký). Đã sập đúng ca này.
  for (const hau of ['', '-wal', '-shm']) {
    const src = path.join(REPO, 'prisma', `dev.db${hau}`);
    if (existsSync(src)) copyFileSync(src, `${db}${hau}`);
  }
  // AUTH_SECRET auto-sinh + persist — đúng hành vi electron/main.js khi config chưa có khoá.
  const cfg = secret === null ? {} : { AUTH_SECRET: secret ?? crypto.randomBytes(32).toString('hex') };
  writeFileSync(path.join(dir, 'config.json'), JSON.stringify(cfg, null, 2));
  return { dir, db, secret: cfg.AUTH_SECRET ?? null };
}

async function start(port, ud) {
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    DATABASE_URL: `file:${ud.db}`,
    PORT: String(port),
  };
  // AUTH_SECRET CHỈ được đặt khi config có — ca thiếu khoá phải thiếu THẬT, không được rơi về
  // biến môi trường của shell đang chạy probe (đó là đường false-green kinh điển).
  delete env.AUTH_SECRET;
  if (ud.secret) env.AUTH_SECRET = ud.secret;

  // ⚠️ KHÔNG dùng `npx next`: cwd của tiến trình này là userData (ngoài repo), nên `npx` đi tải
  // Next MỚI NHẤT từ mạng (đo được: 16.3.3) thay vì bản 14.2.35 của repo — server "Ready" rồi
  // chết ở request đầu. Cổng harness bắt được. Gọi thẳng binary trong repo, đúng như Electron
  // dùng bản Next đóng gói kèm.
  // Gọi thẳng module `next` trong repo. KHÔNG dùng `npx`: cwd là userData (ngoài repo) nên `npx`
  // đi tải Next MỚI NHẤT từ mạng (đo được 16.3.3) thay vì 14.2.35 của repo — server "Ready" rồi
  // chết ở request đầu. Cổng harness bắt được lượt đó.
  const p = spawn(process.execPath, [
    path.join(REPO, 'node_modules', 'next', 'dist', 'bin', 'next'),
    'start', APP_ROOT, '-p', String(port),
  ], {
    cwd: ud.dir, // ← điểm mấu chốt: cwd = userData, KHÔNG phải gốc repo
    env,
    stdio: 'ignore',
  });
  servers.push(p);
  for (let i = 0; i < 45; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/api/comments`);
      return { base: `http://127.0.0.1:${port}`, status: r.status };
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return { base: `http://127.0.0.1:${port}`, status: 0 };
}

const cookie = async (sub, secret, name = 'if_session') =>
  `${name}=${await new SignJWT({ sub })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret))}`;

const st = async (base, p, c) =>
  (await fetch(base + p, { headers: c ? { cookie: c } : {}, redirect: 'manual' })).status;

async function main() {
  console.log('# IDENTITY BOUNDARY PROBE · production runtime, env dựng như electron/main.js\n');

  ca('CA -1 · appRoot tạm KHÔNG có .env (trung thực với bản đóng gói)', false,
    existsSync(path.join(APP_ROOT, '.env')));
  if (!existsSync(path.join(REPO, '.next', 'BUILD_ID'))) {
    console.error('⛔ Chưa có bản build production (.next/BUILD_ID). Chạy `npx next build` trước.');
    process.exit(2);
  }

  const { PrismaClient } = await import('@prisma/client');
  const pr = new PrismaClient();
  const u = await pr.user.findFirst({ select: { id: true } });
  await pr.$disconnect();
  if (!u) throw new Error('dev.db không có user nào — không dựng được ca danh tính.');

  // ── A · CÓ AUTH_SECRET (đường Electron bình thường) ────────────────────────
  const udA = dungUserData();
  const A = await start(3031, udA);

  const cong = ca('CA 0 · HARNESS: server production LÊN và trả lời (không phải 0/ECONNREFUSED)', true, A.status !== 0);
  if (!cong) {
    console.error('\n⛔ HARNESS ĐỎ — server không lên. Không báo ĐẠT cho ca nào phía sau.');
    return;
  }

  ca('CA 1 · production + có AUTH_SECRET → KHỞI ĐỘNG được (fail-closed KHÔNG bắn nhầm)', 401, A.status);
  const cA = await cookie(u.id, udA.secret);
  ca('CA 2 · cookie ký bằng secret của userData → xác thực được (tên cookie `if_session`)', 200,
    await st(A.base, '/api/comments', cA));
  ca('CA 3 · cookie ký bằng secret KHÁC → bị từ chối', 401,
    await st(A.base, '/api/comments', await cookie(u.id, crypto.randomBytes(32).toString('hex'))));
  ca('CA 4 · hằng số công khai `dev-secret-change-me` KHÔNG mở được cửa ở production', 401,
    await st(A.base, '/api/comments', await cookie(u.id, 'dev-secret-change-me')));
  ca('CA 5 · tài nguyên private (R3) vẫn chặn khi không phiên, trong runtime này', 401,
    await st(A.base, '/api/comments/image/c_abc123_zz9'));
  ca('CA 6 · tài nguyên private (R3) có phiên → 404 đúng (id không tồn tại), không 500', 404,
    await st(A.base, '/api/comments/image/c_abc123_zz9', cA));

  // cwd = userData: đây là chỗ đường CŨ `public/comments-images/` chết, còn đường mới sống.
  const post = await fetch(A.base + '/api/comments', {
    method: 'POST',
    headers: { cookie: cA, 'content-type': 'application/json' },
    body: JSON.stringify({
      text: 'identity-boundary probe',
      image:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    }),
  });
  const cm = (await post.json())?.comment;
  ca('CA 7 · cwd=userData: ghi ảnh góp ý và ĐỌC LẠI được qua route có xác thực', 200,
    cm?.image ? await st(A.base, cm.image, cA) : 0);
  ca('CA 8 · đường CŨ `/comments-images/<id>.png` KHÔNG phục vụ được ở runtime này (đúng như đo: cwd=userData thì Next không thấy)',
    true, cm?.id ? (await st(A.base, `/comments-images/${cm.id}.png`)) !== 200 : false);
  if (cm?.id) await fetch(`${A.base}/api/comments?id=${cm.id}`, { method: 'DELETE', headers: { cookie: cA } });

  // ── B · KHỞI ĐỘNG LẠI cùng userData: phiên phải SỐNG SÓT ───────────────────
  servers.pop()?.kill();
  await new Promise((r) => setTimeout(r, 1500));
  const B = await start(3032, udA);
  ca('CA 9 · mở lại app (server mới, cùng userData) → cookie CŨ vẫn hợp lệ (secret persist)', 200,
    await st(B.base, '/api/comments', cA));

  // ── C · THIẾU AUTH_SECRET ở production → PHẢI FAIL-CLOSED ──────────────────
  const udC = dungUserData(null);
  const C = await start(3033, udC);
  ca('CA 10 · production THIẾU AUTH_SECRET → route TỪ CHỐI phục vụ (500), KHÔNG ký bằng hằng số công khai',
    500, C.status);
  ca('CA 11 · và cookie đúc bằng hằng số công khai vẫn KHÔNG vào được', true,
    (await st(C.base, '/api/comments', await cookie(u.id, 'dev-secret-change-me'))) !== 200);

  chuaDo('CA 12 · binary Electron đã đóng gói (.app)', 'probe này chạy tiến trình server, không chạy vỏ Electron đã ký/đóng gói');
  chuaDo('CA 13 · `prisma db push` lúc khởi động + auto-update', 'ngoài phạm vi Identity Boundary; cần bản đóng gói thật');
  chuaDo('CA 14 · cross-tenant negative', 'IF chưa có khái niệm tenant — chưa có ranh giới để vượt (Wave 2-1)');
}

main()
  .catch((e) => {
    console.error(e);
    ket.push({ ten: 'CHẠY ĐƯỢC', dat: false });
  })
  .finally(() => {
    for (const s of servers) s.kill();
    const fail = ket.filter((k) => !k.dat);
    const na = ket.filter((k) => k.chuaDo).length;
    console.log(`\n${ket.length - fail.length - na}/${ket.length - na} ĐẠT · ${na} NOT ASSESSED`);
    process.exit(fail.length ? 1 : 0);
  });
