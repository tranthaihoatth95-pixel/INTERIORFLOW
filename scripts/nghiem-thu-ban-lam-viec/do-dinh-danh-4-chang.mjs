#!/usr/bin/env node
/**
 * scripts/nghiem-thu-ban-lam-viec/do-dinh-danh-4-chang.mjs — ĐO HỒI QUY HAI CHIỀU của lượt hợp
 * nhất định danh D8.
 *
 * Vì sao phải đo BỐN chặng chứ không chỉ chặng đang sửa: `/present` hiện LÀNH nhờ đường riêng
 * của nó (`PresentStageScreen.tsx:62` tự hỏi `/api/auth/me` rồi `setUser`), tức app đang chạy
 * HAI cơ chế định danh song song. Hợp nhất về một cơ chế mà tầng chung chưa gánh nổi thì
 * `/present` rơi vào đúng bệnh của `/cad` — hồi quy ngược chiều, và là loại hồi quy không ai
 * thấy ngay vì nó hỏng ÂM THẦM.
 *
 * Đo ở LƯỢT VÀO ĐẦU TIÊN của một hồ sơ đĩa SẠCH (mỗi chặng một hồ sơ riêng): đó là cảnh
 * tab mới / bookmark / F5 — cảnh duy nhất bệnh này xuất hiện. Hồ sơ dùng lại là "thế giới đã
 * ấm", bộ đệm sẵn có, bộ đo sẽ báo PASS ngay cả trước khi vá.
 *
 * Đọc HAI thứ, không đọc chữ trên màn:
 *   · `interiorflow.lastUserId` — bộ đệm (nguồn cho các đường đọc-một-lần-lúc-mount)
 *   · `window.__flowStore.getState().user?.id` — thứ mọi chỗ đọc THÂN RENDER phụ thuộc
 * Cái thứ hai mới là câu hỏi của lượt này: bộ đệm có mà store rỗng thì thân render đứng yên.
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

const GOC = arg('goc', 'http://localhost:3104');
const DB = arg('db', process.env.G2_DB || '');
const NHAN = arg('nhan', 'truoc-va');
const CHROMIUM = arg('chromium', process.env.G2_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
const TK = { email: 'd8@kiemthu.local', matKhau: 'kiemthu123' };
const TEN_DU_AN = 'D8 hop nhat';
const RA = 'docs/delivery/anh-duyet-mat/d8';
/** Trần chờ. Định danh phải tới trong tầm này, nếu không thì với người dùng nó là "không tới". */
const TRAN_MS = 12000;

const cho = (ms) => new Promise((r) => setTimeout(r, ms));

async function dungDuLieu() {
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  const pr = new PrismaClient({ datasources: { db: { url: DB } } });
  const hash = await bcrypt.hash(TK.matKhau, 10);
  const u = await pr.user.upsert({
    where: { email: TK.email },
    update: { passwordHash: hash },
    create: { email: TK.email, name: 'D8', passwordHash: hash },
    select: { id: true },
  });
  let da = await pr.project.findFirst({ where: { userId: u.id, name: TEN_DU_AN } });
  if (!da) da = await pr.project.create({ data: { userId: u.id, name: TEN_DU_AN } });
  await pr.projectMember.upsert({
    where: { projectId_userId: { projectId: da.id, userId: u.id } },
    update: { role: 'owner' },
    create: { projectId: da.id, userId: u.id, role: 'owner' },
  });
  let fl = await pr.flow.findFirst({ where: { projectId: da.id } });
  if (!fl) {
    fl = await pr.flow.create({
      data: { projectId: da.id, userId: u.id, name: 'D8 ban ve', graphJson: '{"nodes":[],"edges":[]}' },
    });
  }
  await pr.$disconnect();
  return { userId: u.id, duAn: da.id };
}

async function motChang({ ten, duong, duLieu }) {
  const hoSo = path.join(os.tmpdir(), 'd8-4chang', `${NHAN}-${ten}`);
  rmSync(hoSo, { recursive: true, force: true });
  mkdirSync(hoSo, { recursive: true });
  const opt = { args: ['--no-sandbox'], viewport: { width: 1440, height: 900 } };
  if (CHROMIUM) opt.executablePath = CHROMIUM;
  const ctx = await chromium.launchPersistentContext(hoSo, opt);
  const r = await ctx.request.post(`${GOC}/api/auth/login`, {
    data: { identifier: TK.email, password: TK.matKhau },
  });
  if (r.status() !== 200) {
    await ctx.close();
    throw new Error(`đăng nhập thất bại ${r.status()}`);
  }
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  const t0 = Date.now();
  await page.goto(`${GOC}${duong}`, { waitUntil: 'domcontentloaded', timeout: 120000 });

  const mau = [];
  while (Date.now() - t0 < TRAN_MS) {
    const m = await page
      .evaluate(() => {
        let dem = null;
        try {
          dem = localStorage.getItem('interiorflow.lastUserId');
        } catch {
          /* bị chặn */
        }
        const st = window.__flowStore?.getState?.() ?? null;
        return { dem, storeUser: st?.user?.id ?? null, coStore: !!st };
      })
      .catch(() => null);
    if (m) mau.push({ sau_ms: Date.now() - t0, ...m });
    await cho(500);
  }
  const cuoi = mau[mau.length - 1] ?? {};
  const kq = {
    chang: ten,
    duong,
    demGieoLuc_ms: mau.find((m) => m.dem)?.sau_ms ?? null,
    storeCoUserLuc_ms: mau.find((m) => m.storeUser)?.sau_ms ?? null,
    demCuoi: !!cuoi.dem,
    storeCuoi: !!cuoi.storeUser,
    /** BẤT BIẾN của lượt này: CẢ HAI phải có trong trần chờ. Thiếu store = thân render đứng yên. */
    dat: !!cuoi.dem && !!cuoi.storeUser,
  };
  await ctx.close().catch(() => {});
  return kq;
}

async function hamNong(duAn) {
  for (const u of ['/settings', `/projects/${duAn}/cad`, `/projects/${duAn}/render`, `/projects/${duAn}/present`, `/projects/${duAn}/photo`]) {
    await fetch(`${GOC}${u}`, { redirect: 'manual' }).catch(() => {});
  }
  await cho(3000);
}

async function main() {
  if (!DB) {
    console.error('⛔ thiếu --db=file:<đường tuyệt đối>');
    process.exit(2);
  }
  const duLieu = await dungDuLieu();
  await hamNong(duLieu.duAn);
  const cac = [
    { ten: 'settings', duong: '/settings' },
    { ten: 'cad', duong: `/projects/${duLieu.duAn}/cad` },
    { ten: 'render', duong: `/projects/${duLieu.duAn}/render` },
    { ten: 'present', duong: `/projects/${duLieu.duAn}/present` },
    { ten: 'photo', duong: `/projects/${duLieu.duAn}/photo` },
  ];
  const ds = [];
  for (const c of cac) {
    const kq = await motChang({ ...c, duLieu });
    ds.push(kq);
    console.log(
      `${kq.dat ? '✅' : '❌'} ${kq.chang.padEnd(9)} đệm=${String(kq.demGieoLuc_ms).padStart(5)}ms  store=${String(kq.storeCoUserLuc_ms).padStart(5)}ms`,
    );
  }
  mkdirSync(RA, { recursive: true });
  writeFileSync(`${RA}/do-4-chang-${NHAN}.json`, JSON.stringify({ nhan: NHAN, luc: new Date().toISOString(), ds }, null, 2));
  console.log(`\n${ds.filter((k) => k.dat).length}/${ds.length} chặng có ĐỦ cả bộ đệm lẫn store.user`);
  process.exit(ds.every((k) => k.dat) ? 0 : 1);
}

main().catch((e) => {
  console.error('💥', e);
  process.exit(3);
});
