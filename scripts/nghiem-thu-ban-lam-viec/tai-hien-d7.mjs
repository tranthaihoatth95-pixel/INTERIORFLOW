#!/usr/bin/env node
/**
 * scripts/nghiem-thu-ban-lam-viec/tai-hien-d7.mjs — TÁI HIỆN CÓ KIỂM SOÁT lỗi D7 (đường ĐỌC).
 *
 * ⛔ VÌ SAO TÁCH KHỎI `tai-hien-d6.mjs`. D6 là đường **GHI** (resume rơi mất `flowId`); D7 là
 * đường **ĐỌC** (`LegacyStageRedirect` tra resume rồi điều hướng). `tai-hien-d6.mjs` có thế giới
 * `bookmark-cu` dựng được ca hỏng, nhưng **không có đối chứng cùng khuôn** — nó phải so với thế
 * giới `qua-home`, mà thế giới đó chạy một kịch bản KHÁC (vẽ nét, quay về Home) ⇒ hai thế giới
 * lệch nhau NHIỀU HƠN một biến. Tệp này chạy **cùng một hàm** cho cả hai thế giới, khác nhau
 * đúng MỘT boolean.
 *
 *   ① `--the-gioi=lanh-dinh-danh`  đối chứng: bộ đệm `interiorflow.lastUserId` CÒN NGUYÊN.
 *   ② `--the-gioi=nguoi-dinh-danh` ca hỏng:  xoá ĐÚNG bộ đệm đó, GIỮ nguyên mọi thứ khác.
 *   `--the-gioi=ca-hai` chạy lần lượt cả hai trong một lượt (mặc định).
 *
 * Cả hai đi qua `motLuot()` y hệt: cùng user, cùng dự án, cùng bản vẽ, cùng bản ghi resume trên
 * đĩa, cùng thứ tự thao tác. Biến DUY NHẤT là dòng `removeItem('interiorflow.lastUserId')`.
 *
 * ĐỌC TỪ NƠI LƯU THẬT (`localStorage`) + đọc URL đích sau redirect — không đọc chữ trên màn.
 * Kèm đo **LOÉ HOME**: ghi lại mọi đường dẫn trang đi qua (`framenavigated`), để phân biệt "về
 * đúng chỗ" với "về đúng chỗ SAU KHI đã nháy qua Home" — hai thứ khác nhau với mắt người dùng.
 */

import { createRequire } from 'node:module';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const arg = (t, m) => {
  const x = process.argv.find((a) => a.startsWith(`--${t}=`));
  return x ? x.slice(t.length + 3) : m;
};

const GOC = arg('goc', 'http://localhost:3101');
const DB = arg('db', process.env.G2_DB || '');
const CHON = arg('the-gioi', 'ca-hai');
const CHROMIUM = arg('chromium', process.env.G2_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
const TK = { email: 'd7@kiemthu.local', matKhau: 'kiemthu123' };
const TEN_DU_AN = arg('du-an', 'D7 duong doc');
const RA = 'docs/delivery/anh-duyet-mat/d7';

const cho = (ms) => new Promise((r) => setTimeout(r, ms));

async function dungDuLieu() {
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  const pr = new PrismaClient({ datasources: { db: { url: DB } } });
  const hash = await bcrypt.hash(TK.matKhau, 10);
  const u = await pr.user.upsert({
    where: { email: TK.email },
    update: { passwordHash: hash },
    create: { email: TK.email, name: 'D7', passwordHash: hash },
    select: { id: true },
  });
  let da = await pr.project.findFirst({ where: { userId: u.id, name: TEN_DU_AN } });
  if (!da) da = await pr.project.create({ data: { userId: u.id, name: TEN_DU_AN } });
  await pr.projectMember.upsert({
    where: { projectId_userId: { projectId: da.id, userId: u.id } },
    update: { role: 'owner' },
    create: { projectId: da.id, userId: u.id, role: 'owner' },
  });
  // Dự án PHẢI có bản vẽ — dự án rỗng là ca khác hẳn (màn "Tạo bản vẽ mới"), không trộn vào đây.
  let fl = await pr.flow.findFirst({ where: { projectId: da.id } });
  if (!fl) {
    fl = await pr.flow.create({
      data: { projectId: da.id, userId: u.id, name: 'D7 ban ve', graphJson: '{"nodes":[],"edges":[]}' },
    });
  }
  await pr.$disconnect();
  return { userId: u.id, duAn: da.id, flow: fl.id };
}

/**
 * MỘT lượt đo. `xoaDinhDanh` là BIẾN DUY NHẤT giữa hai thế giới — mọi dòng khác chạy y hệt.
 */
async function motLuot({ ten, xoaDinhDanh, duLieu }) {
  const hoSo = path.join(os.tmpdir(), 'd7-ho-so', ten);
  rmSync(hoSo, { recursive: true, force: true });
  mkdirSync(hoSo, { recursive: true });
  const opt = { args: ['--no-sandbox'], viewport: { width: 1440, height: 900 } };
  if (CHROMIUM) opt.executablePath = CHROMIUM;
  const ctx = await chromium.launchPersistentContext(hoSo, opt);

  // Đăng nhập bằng API: cookie phiên vào hồ sơ đĩa, KHÔNG trang nào chạy JS.
  const r = await ctx.request.post(`${GOC}/api/auth/login`, {
    data: { identifier: TK.email, password: TK.matKhau },
  });
  if (r.status() !== 200) {
    await ctx.close();
    throw new Error(`đăng nhập thất bại ${r.status()}`);
  }

  const page = ctx.pages()[0] ?? (await ctx.newPage());

  // ── BƯỚC 1: gieo bản ghi resume HỢP LỆ bằng đường deep-link bình thường ────────────────
  await page.goto(`${GOC}/projects/${duLieu.duAn}/cad`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await cho(9000);
  const resumeTruoc = await page.evaluate(
    (uid) => ({
      raw: localStorage.getItem('interiorflow.resume.' + uid),
      lastUserId: localStorage.getItem('interiorflow.lastUserId'),
    }),
    duLieu.userId,
  );

  // ── BIẾN DUY NHẤT ─────────────────────────────────────────────────────────────────────
  if (xoaDinhDanh) {
    await page.evaluate(() => localStorage.removeItem('interiorflow.lastUserId'));
  }

  // ── BƯỚC 2: mở BOOKMARK route cũ. Ghi lại MỌI đường đi qua để bắt "loé Home". ──────────
  const chang = [];
  const nghe = (f) => {
    if (f === page.mainFrame()) chang.push({ url: f.url(), t: Date.now() });
  };
  page.on('framenavigated', nghe);
  const t0 = Date.now();
  await page.goto(`${GOC}/cad-editor`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await cho(12000);
  page.off('framenavigated', nghe);

  const dich = page.url();
  const duong = chang.map((c) => ({ url: c.url.replace(GOC, ''), sau_ms: c.t - t0 }));
  // "Loé Home" = có một chặng dừng ở Home/`?notice=` TRƯỚC khi tới đích dự án.
  const iDich = duong.findIndex((d) => d.url.startsWith(`/projects/${duLieu.duAn}/`));
  const loeHome = iDich > 0 && duong.slice(0, iDich).some((d) => d.url === '/' || d.url.startsWith('/?'));

  const kq = {
    theGioi: ten,
    xoaDinhDanh,
    userId: duLieu.userId,
    duAn: duLieu.duAn,
    resumeTruocKhiVao: resumeTruoc.raw,
    lastUserIdTruocKhiVao: xoaDinhDanh ? null : resumeTruoc.lastUserId,
    duongDiQua: duong,
    dichSauRedirect: dich.replace(GOC, ''),
    loeHome,
    // BẤT BIẾN: bookmark route cũ phải đưa về ĐÚNG dự án, và KHÔNG được loé Home dọc đường.
    dat: dich.includes(`/projects/${duLieu.duAn}/`) && !loeHome,
  };
  mkdirSync(RA, { recursive: true });
  writeFileSync(`${RA}/tai-hien-${ten}.json`, JSON.stringify(kq, null, 2));
  await page.screenshot({ path: `${RA}/tai-hien-${ten}.png` }).catch(() => {});
  await ctx.close().catch(() => {});
  return kq;
}

/**
 * HÂM NÓNG MÁY CHỦ — bắt buộc, và nó suýt làm hỏng phép đo.
 *
 * Lượt chạy ĐẦU TIÊN trả `resumeTruocKhiVao: null` cho thế giới đối chứng: dev server biên dịch
 * route lần đầu mất ~3 giây, ăn hết ngân sách chờ, nên resume CHƯA KỊP ghi. Tức hai thế giới lệch
 * nhau HAI biến (bộ đệm định danh **và** máy chủ nguội/ấm) ⇒ đối chứng đó không chứng minh được
 * gì. Nay biên dịch trước cả ba route để mọi thế giới đều chạy trên máy chủ ĐÃ ẤM.
 */
async function hamNong(duAn) {
  for (const u of [`/cad-editor`, `/projects/${duAn}/cad`, `/`]) {
    await fetch(`${GOC}${u}`, { redirect: 'manual' }).catch(() => {});
  }
  await cho(1500);
}

async function main() {
  if (!DB) {
    console.error('⛔ thiếu --db=file:<đường tuyệt đối>');
    process.exit(2);
  }
  const duLieu = await dungDuLieu();
  await hamNong(duLieu.duAn);
  const cacThe =
    CHON === 'ca-hai'
      ? [
          { ten: 'lanh-dinh-danh', xoaDinhDanh: false },
          { ten: 'nguoi-dinh-danh', xoaDinhDanh: true },
        ]
      : [{ ten: CHON, xoaDinhDanh: CHON === 'nguoi-dinh-danh' }];

  const ds = [];
  for (const t of cacThe) {
    const kq = await motLuot({ ...t, duLieu });
    ds.push(kq);
    console.log(JSON.stringify(kq, null, 2));
    console.log(
      kq.dat
        ? `\n✅ ${kq.theGioi}: về đúng dự án, không loé Home`
        : `\n❌ ${kq.theGioi}: đích=${kq.dichSauRedirect} loéHome=${kq.loeHome}`,
    );
  }
  writeFileSync(`${RA}/tai-hien-tong.json`, JSON.stringify({ luc: new Date().toISOString(), ds }, null, 2));
  process.exit(ds.every((k) => k.dat) ? 0 : 1);
}

main().catch((e) => {
  console.error('💥', e);
  process.exit(3);
});
