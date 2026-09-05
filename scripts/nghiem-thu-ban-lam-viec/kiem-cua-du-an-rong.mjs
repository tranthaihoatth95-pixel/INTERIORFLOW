#!/usr/bin/env node
/**
 * scripts/nghiem-thu-ban-lam-viec/kiem-cua-du-an-rong.mjs
 * KIỂM CỬA "DỰ ÁN CHƯA CÓ BẢN VẼ" TRÊN APP THẬT — lỗi chặn D-J04b.
 *
 * Ba câu hỏi, mỗi câu một phép đo, đọc sự thật từ CSDL chứ không đọc chữ trên màn:
 *   ① bấm "Tạo bản vẽ mới" xong màn CÓ TỰ ĐỔI không (canvas hiện ra, KHÔNG cần tải lại trang)?
 *   ② nút có còn kẹt chữ "Đang tạo…" không?
 *   ③ BẤM HAI LẦN thật nhanh thì có đẻ ra bản vẽ mồ côi thứ hai không?
 *
 * Câu ③ là câu bộ G2 không hỏi: bản cũ vừa kẹt màn vừa dùng `busy` state làm khoá, mà state bị
 * đóng băng trong closure của `useCallback` ⇒ hai cú bấm sát nhau có thể cùng thấy `false`.
 * Người dùng gặp màn kẹt thì phản xạ đầu tiên LÀ bấm lại — nên đây không phải ca hiếm.
 *
 * Chạy:
 *   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
 *   node scripts/nghiem-thu-ban-lam-viec/kiem-cua-du-an-rong.mjs \
 *     --goc=http://localhost:3096 --db=file:/duong/tuyet/doi/prisma/dev.db [--chang=cad|present]
 *
 * ⛔ `--db` PHẢI tuyệt đối: `@prisma/client` là symlink nên Prisma nạp `.env` theo đường THẬT
 * của module, không theo thư mục đang đứng — worktree quên là ghi nhầm vào CSDL repo chính.
 */
import { createRequire } from 'node:module';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const arg = (t, m) => {
  const v = process.argv.find((a) => a.startsWith(`--${t}=`));
  return v ? v.slice(t.length + 3) : m;
};
const GOC = arg('goc', 'http://localhost:3096');
const DB = arg('db', process.env.G2_DB || '');
const CHANG = arg('chang', 'cad');
const CHROMIUM = arg('chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
const TK = { email: 'g2@kiemthu.local', matKhau: 'kiemthu123' };
const cho = (ms) => new Promise((r) => setTimeout(r, ms));

if (!DB.startsWith('file:')) {
  console.error('⛔ thiếu --db=file:<đường tuyệt đối tới dev.db>');
  process.exit(2);
}

const ket = [];
const ghi = (ten, dat, vi) => {
  ket.push({ ten, dat, vi });
  console.log(`${dat ? '✅ ĐẠT ' : '❌ TRƯỢT'} ${ten}\n   ${vi}`);
};

async function main() {
  const pr = new PrismaClient({ datasources: { db: { url: DB } } });
  const hash = await bcrypt.hash(TK.matKhau, 10);
  const u = await pr.user.upsert({
    where: { email: TK.email },
    update: { passwordHash: hash },
    create: { email: TK.email, name: 'G2', passwordHash: hash },
    select: { id: true },
  });

  // MỘT dự án RỖNG mới tinh cho mỗi lượt — đúng tình huống người dùng vừa tạo dự án xong.
  const ten = `Cua rong ${CHANG} ${Date.now()}`;
  const da = await pr.project.create({ data: { userId: u.id, name: ten } });
  await pr.projectMember.upsert({
    where: { projectId_userId: { projectId: da.id, userId: u.id } },
    update: { role: 'owner' },
    create: { projectId: da.id, userId: u.id, role: 'owner' },
  });
  const demFlow = () => pr.flow.count({ where: { projectId: da.id, deletedAt: null } });
  console.log(`· dự án rỗng ${da.id} · chặng ${CHANG} · flow ban đầu ${await demFlow()}`);

  const hoSo = path.join(os.tmpdir(), `cua-rong-${Date.now()}`);
  mkdirSync(hoSo, { recursive: true });
  const ctx = await chromium.launchPersistentContext(hoSo, {
    args: ['--no-sandbox'],
    viewport: { width: 1440, height: 900 },
    executablePath: CHROMIUM,
  });
  const page = ctx.pages()[0] ?? (await ctx.newPage());

  try {
    const me = await ctx.request.get(`${GOC}/api/auth/me`);
    if (!(await me.json())?.user) {
      const r = await ctx.request.post(`${GOC}/api/auth/login`, {
        data: { identifier: TK.email, password: TK.matKhau },
      });
      if (!r.ok()) throw new Error(`đăng nhập hỏng: ${r.status()}`);
    }

    await page.goto(`${GOC}/projects/${da.id}/${CHANG}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(5000);

    const tao = page.getByRole('button', { name: /Tạo bản vẽ mới/i });
    const soNut = await tao.count().catch(() => 0);
    if (!soNut) {
      ghi('cửa dự-án-rỗng hiện ra', false, 'không thấy nút "Tạo bản vẽ mới" — không vào được ca kiểm');
      return;
    }
    ghi('cửa dự-án-rỗng hiện ra', true, 'thấy nút "Tạo bản vẽ mới" trên dự án chưa có bản vẽ');

    // ③ BẤM HAI LẦN — hai cú sát nhau, không đợi giữa chừng.
    await tao.first().click({ timeout: 8000 });
    await tao
      .first()
      .click({ timeout: 1200, force: true })
      .catch(() => {}); // cú thứ hai có thể trượt vì màn đã đổi — đó là kết quả TỐT
    const bamHai = true;

    // ① màn TỰ ĐỔI, không tải lại trang.
    // Bất biến là "MÀN RỖNG BIẾN MẤT", KHÔNG phải "có <canvas>": chặng Trình bày không dựng
    // canvas nào — đợi canvas ở đó là đo sai vật, và nó báo TRƯỢT ở một chặng đang chạy đúng.
    let tuDoi = true;
    await tao
      .first()
      .waitFor({ state: 'hidden', timeout: 30000 })
      .catch(() => {
        tuDoi = false;
      });
    await cho(3000);
    ghi(
      'màn tự nhường chỗ cho chặng, KHÔNG cần tải lại trang',
      tuDoi,
      tuDoi
        ? 'màn rỗng biến mất ngay sau khi bấm — không gọi reload lần nào'
        : 'hết 30s màn rỗng vẫn đứng đó (đúng triệu chứng D-J04b)',
    );

    // ② không còn kẹt chữ "Đang tạo…"
    const conKet = await page.getByText(/Đang tạo…|Creating…/).count().catch(() => 0);
    ghi(
      'nút không kẹt ở trạng thái "Đang tạo…"',
      conKet === 0,
      conKet === 0 ? 'không còn chữ "Đang tạo…" trên màn' : `vẫn còn ${conKet} chỗ hiện "Đang tạo…"`,
    );

    // ③ đọc SỰ THẬT: đúng MỘT bản vẽ được sinh cho dự án này
    await cho(2000);
    const soFlow = await demFlow();
    ghi(
      'bấm hai lần KHÔNG đẻ bản vẽ thừa',
      soFlow === 1,
      `dự án có ${soFlow} bản vẽ sau khi bấm ${bamHai ? 'HAI' : 'một'} lần (đúng phải là 1)`,
    );
  } finally {
    await ctx.close().catch(() => {});
    rmSync(hoSo, { recursive: true, force: true });
    await pr.$disconnect();
  }
}

main()
  .then(() => {
    const truot = ket.filter((k) => !k.dat).length;
    console.log(`\n${ket.length - truot}/${ket.length} đạt`);
    process.exit(truot ? 1 : 0);
  })
  .catch((e) => {
    console.error('💥', e?.message || e);
    process.exit(2);
  });
