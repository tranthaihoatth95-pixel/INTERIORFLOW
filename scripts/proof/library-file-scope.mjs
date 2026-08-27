/**
 * scripts/proof/library-file-scope.mjs — runtime proof cho R8 (Wave 1 · W1-1):
 * `GET /api/library/[id]/file` — phạm vi ĐỌC + chặn path traversal.
 *
 * Chứng minh CẢ HAI nhánh cờ, vì cả hai đều là hành vi sản xuất:
 *   · cờ TẮT (mặc định)  → kho DÙNG CHUNG, người khác vẫn đọc được. Đây là hành vi hôm nay và
 *     lát này KHÔNG được đổi nó.
 *   · cờ BẬT             → chỉ chủ sở hữu / admin. Đây là hành vi sẽ bật sau khi có tenant.
 * Traversal thì KHÔNG có cờ: chặn ở cả hai nhánh.
 *
 * ⚠️ CỔNG HARNESS (F-15) ở CA 0. Cần HAI dev server để đo hai nhánh cờ — script tự dựng.
 *
 * Chạy:  node scripts/proof/library-file-scope.mjs
 */

import { spawn } from 'child_process';
import { SignJWT } from 'jose';
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import path from 'path';
import { moDbTam } from './_db-tam.mjs';

// Cách ly khỏi `prisma/dev.db` THẬT — xem `_db-tam.mjs` (cổng #12 của lane QA phát hành).
const db = await moDbTam('library-file-scope');
const prisma = db.prisma;
const TAG = `__proof_lib_${Date.now()}`;
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [
      l.slice(0, l.indexOf('=')).trim(),
      l.slice(l.indexOf('=') + 1).trim().replace(/^(['"])([\s\S]*)\1$/, '$2'),
    ]),
);
if (!env.AUTH_SECRET) throw new Error('Không đọc được AUTH_SECRET — dừng.');

const cookie = async (sub) =>
  `if_session=${await new SignJWT({ sub })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(env.AUTH_SECRET))}`;

const ket = [];
function ca(ten, mong, got) {
  const dat = mong === got;
  ket.push({ ten, dat });
  console.log(`${dat ? '  ok  ' : ' KHÔNG '} ${ten} — mong ${mong}, nhận ${got}`);
  return dat;
}

const servers = [];
async function dungServer(port, extraEnv) {
  const p = spawn('npx', ['next', 'dev', '-p', String(port)], {
    env: { ...process.env, ...db.env, ...extraEnv },
    stdio: 'ignore',
  });
  servers.push(p);
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/api/comments`);
      if (r.status === 401 || r.status === 200) return `http://127.0.0.1:${port}`;
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Server ${port} không lên`);
}

const status = async (base, p, c) =>
  (await fetch(base + p, { headers: c ? { cookie: c } : {}, redirect: 'manual' })).status;

async function main() {
  console.log('# R8 · GET /api/library/[id]/file · runtime proof (hai nhánh cờ)\n');

  // ── Dựng dữ liệu thật ─────────────────────────────────────────────────────
  const mk = (n, isAdmin = false) =>
    prisma.user.create({
      data: { email: `${TAG}_${n}@proof.local`, name: `${TAG}_${n}`, passwordHash: 'x', isAdmin },
    });
  const [chu, khac, quanTri] = await Promise.all([mk('chu'), mk('khac'), mk('admin', true)]);

  const UP = path.join(process.cwd(), 'uploads');
  mkdirSync(UP, { recursive: true });
  const ten = `${TAG}.png`;
  writeFileSync(path.join(UP, ten), PNG);

  const assetOk = await prisma.libraryAsset.create({
    data: { userId: chu.id, name: `${TAG} ảnh`, path: ten, mime: 'image/png', category: 'proof' },
  });
  // Bản ghi ĐỘC: `path` chứa `../` — mô phỏng dữ liệu hỏng/bị chèn. Không có chốt chặn thì route
  // đọc được file ngoài `uploads/`.
  const assetDoc = await prisma.libraryAsset.create({
    data: {
      userId: chu.id, name: `${TAG} độc`, path: '../../../../etc/passwd',
      mime: 'image/png', category: 'proof',
    },
  });

  const cChu = await cookie(chu.id);
  const cKhac = await cookie(khac.id);
  const cAdmin = await cookie(quanTri.id);
  const P = (a) => `/api/library/${a.id}/file`;

  // ── NHÁNH 1 · cờ TẮT (mặc định) ───────────────────────────────────────────
  const b1 = await dungServer(3021, {});
  const cong1 = ca('CA 0 · HARNESS (cờ TẮT): cookie đúc mở được /api/comments', 200,
    await status(b1, '/api/comments', cChu));
  if (!cong1) throw new Error('HARNESS ĐỎ — dừng, không báo ĐẠT.');

  ca('CA 1 · không phiên → chặn', 401, await status(b1, P(assetOk)));
  ca('CA 2 · chủ sở hữu đọc được', 200, await status(b1, P(assetOk), cChu));
  ca('CA 3 · cờ TẮT: người khác VẪN đọc được (kho dùng chung — KHÔNG đổi hành vi hôm nay)', 200,
    await status(b1, P(assetOk), cKhac));
  ca('CA 4 · traversal bị chặn dù cờ TẮT → 410, không trả /etc/passwd', 410,
    await status(b1, P(assetDoc), cChu));

  // ── NHÁNH 2 · cờ BẬT ──────────────────────────────────────────────────────
  const b2 = await dungServer(3022, { IF_LIBRARY_SCOPE_ENFORCE: '1' });
  const cong2 = ca('CA 5 · HARNESS (cờ BẬT): server thứ hai sống', 200,
    await status(b2, '/api/comments', cChu));
  if (!cong2) throw new Error('HARNESS ĐỎ — dừng.');

  ca('CA 6 · cờ BẬT: chủ sở hữu vẫn đọc được', 200, await status(b2, P(assetOk), cChu));
  ca('CA 7 · cờ BẬT: người khác BỊ CHẶN → 404 (không 403, không xác nhận tồn tại)', 404,
    await status(b2, P(assetOk), cKhac));
  ca('CA 8 · cờ BẬT: admin đọc được (cùng cửa hậu với DELETE)', 200,
    await status(b2, P(assetOk), cAdmin));
  ca('CA 9 · cờ BẬT: traversal vẫn 410', 410, await status(b2, P(assetDoc), cChu));
  ca('CA 10 · cờ BẬT: không phiên vẫn 401', 401, await status(b2, P(assetOk)));

  // Nội dung trả về đúng là ảnh, không phải trang lỗi 200.
  const r = await fetch(b2 + P(assetOk), { headers: { cookie: cChu } });
  ca('CA 11 · bytes trả về đúng nguyên vẹn ảnh gốc', true,
    Buffer.from(await r.arrayBuffer()).equals(PNG) && r.headers.get('content-type') === 'image/png');
}

async function don() {
  for (const s of servers) s.kill();
  await prisma.libraryAsset.deleteMany({ where: { name: { contains: TAG } } });
  const n = await prisma.user.deleteMany({ where: { name: { contains: TAG } } });
  rmSync(path.join(process.cwd(), 'uploads', `${TAG}.png`), { force: true });
  console.log(`\n  (đã xoá ${n.count} user + asset + file gắn thẻ ${TAG})`);
}

main()
  .catch((e) => {
    console.error(e.message);
    ket.push({ ten: 'CHẠY ĐƯỢC', dat: false });
  })
  .finally(async () => {
    await don().catch((e) => console.error('DỌN THẤT BẠI:', e.message));
    await db.dong();
    const fail = ket.filter((k) => !k.dat);
    console.log(`\n${ket.length - fail.length}/${ket.length} ĐẠT`);
    process.exit(fail.length ? 1 : 0);
  });
