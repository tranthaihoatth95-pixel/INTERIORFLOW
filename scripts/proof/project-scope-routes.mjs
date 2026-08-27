/**
 * scripts/proof/project-scope-routes.mjs — Wave 1 · W1-3/W1-4.
 * Chứng minh trên runtime HTTP cho ba route list sau khi nối cửa phạm vi:
 * `/api/dashboard` · `/api/flows` · `/api/home/summary`.
 *
 * Đo CẢ HAI nhánh cờ, vì cả hai đều là hành vi sản xuất:
 *   · cờ TẮT (mặc định) → **y hệt hôm nay**. Đây là ca quan trọng nhất: lát này không được phép
 *     đổi thứ người dùng đang thấy khi chưa bật.
 *   · cờ BẬT           → siết rò rỉ ngang, VÀ sửa under-fetch (người được mời thấy dự án).
 *
 * ⚠️ CỔNG HARNESS (F-15) ở CA 0.
 * Chạy:  node scripts/proof/project-scope-routes.mjs
 */

import { spawn } from 'child_process';
import { SignJWT } from 'jose';
import { readFileSync } from 'fs';
import { moDbTam } from './_db-tam.mjs';

// Cách ly khỏi `prisma/dev.db` THẬT — xem `_db-tam.mjs` (cổng #12 của lane QA phát hành).
const db = await moDbTam('project-scope-routes');
const prisma = db.prisma;
const TAG = `__proof_scope_rt_${Date.now()}`;
const servers = [];
const ket = [];

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

function ca(ten, mong, got) {
  const dat = JSON.stringify(mong) === JSON.stringify(got);
  ket.push({ ten, dat });
  console.log(`${dat ? '  ok  ' : ' KHÔNG '} ${ten} — mong ${JSON.stringify(mong)}, nhận ${JSON.stringify(got)}`);
  return dat;
}

const cookie = async (sub) =>
  `if_session=${await new SignJWT({ sub })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(env.AUTH_SECRET))}`;

async function dungServer(port, extraEnv) {
  const p = spawn('npx', ['next', 'dev', '-p', String(port)], { env: { ...process.env, ...db.env, ...extraEnv }, stdio: 'ignore' });
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

const j = async (base, p, c) => (await fetch(base + p, { headers: { cookie: c } })).json();

async function main() {
  console.log('# W1-3/W1-4 · phạm vi ba route list · runtime proof (hai nhánh cờ)\n');

  const mk = (n, isAdmin = false) =>
    prisma.user.create({
      data: { email: `${TAG}_${n}@proof.local`, name: `${TAG}_${n}`, passwordHash: 'x', isAdmin },
    });
  const [A, B, admin] = await Promise.all([mk('A'), mk('B'), mk('admin', true)]);

  const mkP = (chu, n) =>
    prisma.project.create({
      data: {
        name: n, lastEditedBy: chu.id, user: { connect: { id: chu.id } },
        members: { create: { userId: chu.id, role: 'owner', lastEditedBy: chu.id } },
      },
    });
  const pA = await mkP(A, `${TAG} của A`);
  const pB = await mkP(B, `${TAG} của B`);
  // Dự án của B, MỜI A vào — đây là ca under-fetch: hôm nay A KHÔNG thấy nó.
  const pMoi = await mkP(B, `${TAG} B mời A`);
  await prisma.projectMember.create({ data: { projectId: pMoi.id, userId: A.id, role: 'viewer', lastEditedBy: B.id } });
  await prisma.flow.create({ data: { name: `${TAG} flow B`, userId: B.id, projectId: pB.id, graphJson: '{}' } });
  // `/api/home/summary` trả `recentProjects` — dựng từ FLOW, nên dự án không có flow thì không
  // bao giờ xuất hiện. Phải có flow trong dự án được mời, nếu không ca "thấy dự án được mời" đo
  // vào chỗ trống. (Lượt đầu tôi đọc `h.projects` — trường KHÔNG TỒN TẠI: hai ca xanh trên
  // `undefined`, đúng họ false-green F-15 nhưng ở tầng KHẲNG ĐỊNH thay vì tầng harness.)
  await prisma.flow.create({ data: { name: `${TAG} flow mời`, userId: B.id, projectId: pMoi.id, graphJson: '{}' } });

  const cA = await cookie(A.id);
  const cAdmin = await cookie(admin.id);
  const ten = (arr) => (arr ?? []).map((x) => x.name);
  const coB = (arr) => ten(arr).some((n) => n === `${TAG} của B`);
  const coMoi = (arr) => ten(arr).some((n) => n === `${TAG} B mời A`);
  const roster = (t) => (t ?? []).some((u) => u.name === `${TAG}_B`);
  /** Khẳng định TRƯỜNG CÓ THẬT trước khi khẳng định nội dung — chống xanh-trên-`undefined`. */
  const coTruong = (o, k) => Array.isArray(o?.[k]);

  // ── NHÁNH 1 · cờ TẮT — PHẢI y hệt hôm nay ────────────────────────────────
  const b1 = await dungServer(3041, {});
  if (!ca('CA 0 · HARNESS: cookie đúc mở được /api/dashboard', true,
    !!(await j(b1, '/api/dashboard', cA))?.stats)) {
    throw new Error('HARNESS ĐỎ — dừng.');
  }

  const d1 = await j(b1, '/api/dashboard', cA);
  ca('CA 1 · cờ TẮT · dashboard: A VẪN thấy dự án của B (hành vi hôm nay, KHÔNG được đổi)', true, coB(d1.projects));
  ca('CA 2 · cờ TẮT · dashboard: roster VẪN có B', true, roster(d1.team));
  const f1 = await j(b1, '/api/flows', cA);
  ca('CA 3 · cờ TẮT · flows: A KHÔNG thấy dự án được mời (đúng lỗi under-fetch hôm nay)', false, coMoi(f1.projects));
  const h1 = await j(b1, '/api/home/summary', cA);
  ca('CA 4a · summary TRẢ VỀ trường `recentProjects` (chống khẳng định trên undefined)', true,
    coTruong(h1, 'recentProjects'));
  ca('CA 4b · cờ TẮT · summary: cũng KHÔNG thấy dự án được mời', false, coMoi(h1.recentProjects));

  // ── NHÁNH 2 · cờ BẬT ─────────────────────────────────────────────────────
  const b2 = await dungServer(3042, { IF_PROJECT_SCOPE_ENFORCE: '1' });
  if (!ca('CA 5 · HARNESS: server thứ hai sống', true, !!(await j(b2, '/api/dashboard', cA))?.stats)) {
    throw new Error('HARNESS ĐỎ — dừng.');
  }

  const d2 = await j(b2, '/api/dashboard', cA);
  ca('CA 6 · cờ BẬT · dashboard: A KHÔNG còn thấy dự án riêng của B', false, coB(d2.projects));
  ca('CA 7 · cờ BẬT · dashboard: A VẪN thấy dự án B MỜI mình (siết đúng chỗ, không siết bừa)', true, coMoi(d2.projects));
  // B nằm TRONG phạm vi của A (hai người cùng ở dự án `B mời A`) ⇒ B PHẢI còn trong roster.
  // Đây là ca chống "siết bừa": lọc roster không được cắt mất người thật sự cùng làm việc.
  ca('CA 8 · cờ BẬT · roster GIỮ B vì B cùng dự án với A (không siết bừa)', true, roster(d2.team));
  ca('CA 9 · cờ BẬT · dashboard: flow của B (dự án riêng) không lọt vào hoạt động gần đây', false,
    ten(d2.flows).includes(`${TAG} flow B`));

  const f2 = await j(b2, '/api/flows', cA);
  ca('CA 10 · cờ BẬT · flows: A THẤY dự án được mời (under-fetch ĐÃ SỬA)', true, coMoi(f2.projects));
  ca('CA 11 · cờ BẬT · flows: A không thấy dự án riêng của B', false, coB(f2.projects));
  const h2 = await j(b2, '/api/home/summary', cA);
  ca('CA 12 · cờ BẬT · summary: A THẤY dự án được mời (under-fetch ĐÃ SỬA)', true, coMoi(h2.recentProjects));
  ca('CA 13 · cờ BẬT · summary: A không thấy dự án riêng của B', false, coB(h2.recentProjects));

  // Admin: cửa hậu phải GIỮ, nếu không lát này là hồi quy mất-sạch-dashboard.
  const dAd = await j(b2, '/api/dashboard', cAdmin);
  ca('CA 14 · cờ BẬT · admin KHÔNG là member vẫn thấy dự án của cả A và B (không hồi quy)', true,
    coB(dAd.projects) && ten(dAd.projects).includes(`${TAG} của A`));

  ca('CA 15 · cờ BẬT · stats vẫn dựng được (không vỡ hình dạng phản hồi)', true,
    typeof d2.stats?.projects === 'number' && typeof d2.stats?.flows === 'number');
}

async function don() {
  for (const s of servers) s.kill();
  await prisma.flow.deleteMany({ where: { name: { contains: TAG } } });
  await prisma.projectMember.deleteMany({ where: { project: { name: { contains: TAG } } } });
  await prisma.project.deleteMany({ where: { name: { contains: TAG } } });
  const n = await prisma.user.deleteMany({ where: { name: { contains: TAG } } });
  console.log(`\n  (đã xoá ${n.count} user + dự án/flow gắn thẻ ${TAG})`);
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
