#!/usr/bin/env node
/**
 * scripts/nghiem-thu-ban-lam-viec/do-dinh-danh-sau-mount.mjs — CÂU HỎI QUYẾT ĐỊNH CỦA HỌ BỆNH.
 *
 * Mọi chỗ đọc `effectiveUserId(storeUserId)` ở THÂN RENDER đều dựa vào một giả định chưa ai đo:
 *
 *   "định danh tới muộn thì component sẽ render lại và tự lành"
 *
 * Giả định đó CHỈ đúng nếu `useFlowStore.user` được đặt — vì `getLastUserId()` đọc localStorage,
 * KHÔNG phải state phản ứng, nên bộ đệm được gieo cũng **không kích một lượt render nào**.
 *
 * Tệp này đo thẳng trên app thật, ở lượt vào ĐẦU TIÊN của một deep-link hồ sơ sạch:
 *   · `interiorflow.lastUserId` có được gieo không, và sau bao lâu
 *   · `useFlowStore.getState().user?.id` có được đặt không
 *
 * ⇒ Nếu bộ đệm được gieo mà store KHÔNG có user, thì mọi chỗ đọc thân-render **đứng yên ở giá
 * trị null của lượt render đầu** cho tới khi có thứ khác kích render — đó là họ bệnh, chỉ khác
 * là nó hỏng ÂM THẦM (không dội trang) nên chưa ai thấy.
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
const CHROMIUM = arg('chromium', process.env.G2_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
const TK = { email: 'd7@kiemthu.local', matKhau: 'kiemthu123' };
const RA = 'docs/delivery/anh-duyet-mat/d7';

const cho = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!DB) {
    console.error('⛔ thiếu --db=file:<đường tuyệt đối>');
    process.exit(2);
  }
  const { PrismaClient } = require('@prisma/client');
  const pr = new PrismaClient({ datasources: { db: { url: DB } } });
  const u = await pr.user.findUnique({ where: { email: TK.email }, select: { id: true } });
  const da = u ? await pr.project.findFirst({ where: { userId: u.id, name: 'D7 duong doc' } }) : null;
  await pr.$disconnect();
  if (!u || !da) {
    console.error('⛔ chưa có dữ liệu — chạy tai-hien-d7.mjs trước');
    process.exit(2);
  }

  const hoSo = path.join(os.tmpdir(), 'd7-do-mount');
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
  await page.goto(`${GOC}/projects/${da.id}/${arg('chang','cad')}`, { waitUntil: 'domcontentloaded', timeout: 120000 });

  // Lấy mẫu theo nhịp để biết CÁI NÀO tới trước và tới lúc nào — không chỉ biết "cuối cùng có".
  const mau = [];
  for (let i = 0; i < 24; i++) {
    const m = await page
      .evaluate(() => {
        let dem = null;
        try {
          dem = localStorage.getItem('interiorflow.lastUserId');
        } catch {
          /* localStorage bị chặn */
        }
        const w = window;
        const st = w.__flowStore?.getState?.() ?? null;
        return { dem, storeUser: st?.user?.id ?? null, coStore: !!st };
      })
      .catch(() => null);
    if (m) mau.push({ sau_ms: Date.now() - t0, ...m });
    await cho(700);
  }

  const cuoi = mau[mau.length - 1] ?? {};
  const demTu = mau.find((m) => m.dem)?.sau_ms ?? null;
  const storeTu = mau.find((m) => m.storeUser)?.sau_ms ?? null;
  const kq = {
    userId: u.id,
    duAn: da.id,
    chang: arg('chang', 'cad'),
    demDuocGieo: !!cuoi.dem,
    demGieoLuc_ms: demTu,
    storeCoUser: !!cuoi.storeUser,
    storeCoUserLuc_ms: storeTu,
    coCuaSoStore: !!cuoi.coStore,
    mau,
    /**
     * KẾT LUẬN MÁY RÚT: bộ đệm được gieo mà store KHÔNG có user ⇒ mọi chỗ đọc
     * `effectiveUserId` ở thân render KHÔNG có gì kích render lại ⇒ đứng yên ở null.
     */
    thanRenderTuLanh: !!cuoi.storeUser,
  };
  mkdirSync(RA, { recursive: true });
  writeFileSync(`${RA}/do-dinh-danh-sau-mount-${arg('chang','cad')}.json`, JSON.stringify(kq, null, 2));
  console.log(JSON.stringify({ ...kq, mau: `${mau.length} mẫu (xem tệp json)` }, null, 2));
  console.log(
    kq.thanRenderTuLanh
      ? '\n✅ store CÓ user ⇒ chỗ đọc thân-render tự lành khi render lại'
      : '\n❌ store KHÔNG có user ⇒ chỗ đọc thân-render KHÔNG có gì kích render lại',
  );
  await ctx.close().catch(() => {});
}

main().catch((e) => {
  console.error('💥', e);
  process.exit(3);
});
