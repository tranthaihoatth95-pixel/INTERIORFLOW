/**
 * scripts/proof/asset-representation-scope.mjs — `W1-ASSET-REPRESENTATION-SCOPE-001`.
 *
 * Ba method của `/api/asset-representation` trước lát này chỉ hỏi "có phiên không". Nặng nhất là
 * DELETE: **xoá mềm được bản ghi của người khác** chỉ cần biết `id` — phá dữ liệu, không phải chỉ
 * đọc trộm. GET thì trả cả `provenance` (số đo, người ký, ảnh gốc) và `createdBy`.
 *
 * Đo CẢ HAI nhánh cờ `IF_LIBRARY_SCOPE_ENFORCE` — dùng CHUNG cờ với `GET /api/library/[id]/file`
 * vì hai cửa dẫn vào cùng một cái cây tài nguyên:
 *   · TẮT (mặc định) → kho DÙNG CHUNG, y hệt hôm nay. Lát này không được đổi nó.
 *   · BẬT            → chỉ chủ sở hữu asset / admin.
 *
 * ⚠️ CỔNG HARNESS (F-15) · luật F-17 (khẳng định phải có chủ thể, phải có ca mong THẤY).
 * Chạy:  node scripts/proof/asset-representation-scope.mjs
 */

import { spawn } from 'child_process';
import { SignJWT } from 'jose';
import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TAG = `__proof_arep_${Date.now()}`;
const servers = [];
const ket = [];

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [
    l.slice(0, l.indexOf('=')).trim(),
    l.slice(l.indexOf('=') + 1).trim().replace(/^(['"])([\s\S]*)\1$/, '$2'),
  ]),
);
if (!env.AUTH_SECRET) throw new Error('Không đọc được AUTH_SECRET — dừng.');

function ca(ten, mong, got, ghiChu = '') {
  const dat = JSON.stringify(mong) === JSON.stringify(got);
  ket.push({ ten, dat });
  console.log(`${dat ? '  ok  ' : ' KHÔNG '} ${ten} — mong ${JSON.stringify(mong)}, nhận ${JSON.stringify(got)}`);
  if (!dat && ghiChu) console.log(`         ${ghiChu}`);
  return dat;
}
function chuaDo(ten, lyDo) {
  ket.push({ ten, dat: true, chuaDo: true });
  console.log(`  ⚪    ${ten} — NOT ASSESSED: ${lyDo}`);
}

const cookie = async (sub) =>
  `if_session=${await new SignJWT({ sub }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt()
    .setExpirationTime('1h').sign(new TextEncoder().encode(env.AUTH_SECRET))}`;

async function dungServer(port, extraEnv) {
  const p = spawn('npx', ['next', 'dev', '-p', String(port)], { env: { ...process.env, ...extraEnv }, stdio: 'ignore' });
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

const P = '/api/asset-representation';
const goi = (base, duong, c, init = {}) =>
  fetch(base + duong, { ...init, headers: { ...(c ? { cookie: c } : {}), ...(init.headers ?? {}) } });

async function main() {
  console.log('# W1-ASSET-REPRESENTATION-SCOPE-001 · runtime proof (hai nhánh cờ)\n');

  const mk = (n, isAdmin = false) =>
    prisma.user.create({ data: { email: `${TAG}_${n}@proof.local`, name: `${TAG}_${n}`, passwordHash: 'x', isAdmin } });
  const [chu, khac, quanTri] = await Promise.all([mk('chu'), mk('khac'), mk('admin', true)]);

  const asset = await prisma.libraryAsset.create({
    data: { userId: chu.id, name: `${TAG} ảnh`, path: `${TAG}.png`, mime: 'image/png', category: 'proof' },
  });
  const mkRep = (ghi) =>
    prisma.assetRepresentation.create({
      data: {
        assetId: asset.id, kind: 'spec-from-image', payloadRef: `${TAG}-ref`,
        truthLevel: 'inferred', provenance: JSON.stringify({ bíMật: 'số đo 640mm', nguoiKy: 'hoa' }),
        createdBy: ghi,
      },
    });
  const rep = await mkRep(chu.id);

  const cChu = await cookie(chu.id);
  const cKhac = await cookie(khac.id);
  const cAdmin = await cookie(quanTri.id);
  const Q = `${P}?assetId=${asset.id}`;

  /* ───────── NHÁNH 1 · cờ TẮT — PHẢI y hệt hôm nay ───────── */
  const b1 = await dungServer(3051, {});
  if (!ca('CA 0 · HARNESS: cookie đúc mở được /api/comments', 200, (await goi(b1, '/api/comments', cChu)).status)) {
    throw new Error('HARNESS ĐỎ — dừng.');
  }
  ca('CA 1 · không phiên → 401', 401, (await goi(b1, Q)).status);
  const g1chu = await (await goi(b1, Q, cChu)).json();
  ca('CA 2a · F-17: phản hồi CÓ trường `representations` và là mảng', true, Array.isArray(g1chu?.representations));
  ca('CA 2b · **mong THẤY** — chủ sở hữu đọc được bản ghi của mình', 1, g1chu.representations.length);
  ca('CA 3 · cờ TẮT: người khác VẪN đọc được (kho dùng chung — hành vi hôm nay, KHÔNG được đổi)',
    200, (await goi(b1, Q, cKhac)).status);

  /* ───────── NHÁNH 2 · cờ BẬT ───────── */
  const b2 = await dungServer(3052, { IF_LIBRARY_SCOPE_ENFORCE: '1' });
  if (!ca('CA 4 · HARNESS: server thứ hai sống', 200, (await goi(b2, '/api/comments', cChu)).status)) {
    throw new Error('HARNESS ĐỎ — dừng.');
  }

  // ── authorized
  const g2chu = await (await goi(b2, Q, cChu)).json();
  ca('CA 5 · **mong THẤY** — cờ BẬT: chủ sở hữu VẪN đọc được (không siết bừa)', 1, g2chu.representations?.length ?? 0);
  ca('CA 6 · F-17: bản ghi mang đủ trường và đúng kiểu', true,
    typeof g2chu.representations?.[0]?.provenance === 'string' && typeof g2chu.representations?.[0]?.createdBy === 'string');
  ca('CA 7 · cờ BẬT: admin đọc được (cùng cửa hậu với DELETE /api/library/[id])',
    1, (await (await goi(b2, Q, cAdmin)).json()).representations?.length ?? 0);

  // ── denied
  const r2khac = await goi(b2, Q, cKhac);
  ca('CA 8 · cờ BẬT: người khác BỊ CHẶN → 404 (không 403 — không xác nhận asset tồn tại)', 404, r2khac.status);
  const thanKhac = await r2khac.text();
  ca('CA 9 · và KHÔNG rò rỉ metadata nào trong thân phản hồi (provenance/createdBy/payloadRef)', true,
    !thanKhac.includes('640mm') && !thanKhac.includes(chu.id) && !thanKhac.includes(`${TAG}-ref`) && !thanKhac.includes(rep.id),
    `thân trả về: ${thanKhac.slice(0, 200)}`);
  ca('CA 10 · assetId KHÔNG TỒN TẠI cũng 404 — cùng mã, không phân biệt được với "của người khác"',
    404, (await goi(b2, `${P}?assetId=khong-co-that`, cKhac)).status);

  // ── POST ngoài phạm vi
  const post = await goi(b2, P, cKhac, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ assetId: asset.id, kind: 'spec-from-image', payloadRef: 'x', truthLevel: 'inferred', provenance: '{}' }),
  });
  ca('CA 11 · cờ BẬT: người khác KHÔNG gắn được cách thể hiện vào asset của mình', 404, post.status);
  ca('CA 12 · và DB không mọc thêm hàng nào', 1,
    await prisma.assetRepresentation.count({ where: { assetId: asset.id, deletedAt: null } }));

  // ── DELETE ngoài phạm vi — ca NẶNG NHẤT: phá dữ liệu, không phải đọc trộm
  const del = await goi(b2, `${P}?id=${rep.id}`, cKhac, { method: 'DELETE' });
  ca('CA 13 · cờ BẬT: DELETE của người khác trả `ok` (không rò rỉ bản ghi có thật)…', 200, del.status);
  const conSong = await prisma.assetRepresentation.findFirst({ where: { id: rep.id, deletedAt: null } });
  ca('CA 14 · …nhưng bản ghi VẪN CÒN SỐNG — không xoá được của người khác', true, !!conSong);

  // ── revoked: chủ sở hữu bị xoá mềm asset ⇒ mất đường vào
  await prisma.libraryAsset.update({ where: { id: asset.id }, data: { deletedAt: new Date() } });
  ca('CA 15 · asset bị xoá mềm (thu hồi) → chính CHỦ cũng 404 ngay lần gọi sau, không cần đăng xuất',
    404, (await goi(b2, Q, cChu)).status);
  await prisma.libraryAsset.update({ where: { id: asset.id }, data: { deletedAt: null } });
  ca('CA 16 · khôi phục asset → chủ đọc lại được (chứng minh CA 15 đúng vì thu hồi, không phải vì hỏng)',
    200, (await goi(b2, Q, cChu)).status);

  // ── chủ sở hữu VẪN xoá được của mình (chống siết bừa)
  ca('CA 17 · **mong THẤY** — chủ sở hữu xoá được bản ghi CỦA MÌNH', 200,
    (await goi(b2, `${P}?id=${rep.id}`, cChu, { method: 'DELETE' })).status);
  ca('CA 18 · và bản ghi đó nay đã xoá mềm thật', true,
    !!(await prisma.assetRepresentation.findFirst({ where: { id: rep.id, NOT: { deletedAt: null } } })));

  chuaDo('CA 19 · cross-tenant negative', 'IF chưa có khái niệm tenant — chưa có ranh giới để vượt. Mở lại ở W2-1.');
  chuaDo('CA 20 · Electron đóng gói', 'probe này chạy `next dev`; bậc đóng gói cần bản .app đã ký');
}

async function don() {
  for (const s of servers) s.kill();
  await prisma.assetRepresentation.deleteMany({ where: { payloadRef: { contains: TAG } } });
  await prisma.libraryAsset.deleteMany({ where: { name: { contains: TAG } } });
  const n = await prisma.user.deleteMany({ where: { name: { contains: TAG } } });
  console.log(`\n  (đã xoá ${n.count} user + asset + biểu diễn gắn thẻ ${TAG})`);
}

main()
  .catch((e) => { console.error(e.message); ket.push({ ten: 'CHẠY ĐƯỢC', dat: false }); })
  .finally(async () => {
    await don().catch((e) => console.error('DỌN THẤT BẠI:', e.message));
    await prisma.$disconnect();
    const fail = ket.filter((k) => !k.dat);
    const na = ket.filter((k) => k.chuaDo).length;
    console.log(`\n${ket.length - fail.length - na}/${ket.length - na} ĐẠT · ${na} NOT ASSESSED`);
    process.exit(fail.length ? 1 : 0);
  });
