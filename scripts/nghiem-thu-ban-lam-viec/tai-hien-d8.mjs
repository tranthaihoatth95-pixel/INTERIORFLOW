#!/usr/bin/env node
/**
 * scripts/nghiem-thu-ban-lam-viec/tai-hien-d8.mjs — TÁI HIỆN CÓ KIỂM SOÁT lỗi D8.
 *
 * ⛔ CÂU HỎI DUY NHẤT CỦA TỆP NÀY, và nó phải trả lời được bằng SỐ ĐỌC TỪ NƠI LƯU THẬT:
 *
 *   "Người dùng đang đăng nhập hợp lệ, mở THẲNG `/settings` ở tab mới, đổi số phút tự khoá,
 *    đóng hẳn trình duyệt, mở lại — thiết lập đó CÒN hay MẤT?"
 *
 * Vì sao câu này là ca đắt nhất của họ bệnh: `LockScreenSettings.tsx:22` chốt giá trị bằng
 * `useState(() => getLockIdleMinutes(userId))` VÀ `commit()` cũng dùng `userId` của lượt render
 * hiện tại; `lib/lockscreen.ts:87` có chốt chặn `if (!userId) return;` ⇒ userId rỗng thì
 * **KHÔNG một byte nào xuống đĩa, và KHÔNG một dòng báo nào**. Mọi chỗ đọc `effectiveUserId`
 * khác chỉ CHẬM (tới muộn rồi lành); riêng chỗ này là MẤT.
 *
 * ── HAI THẾ GIỚI, LỆCH ĐÚNG MỘT BIẾN ──────────────────────────────────────────────────────
 *   ① `--the-gioi=co-dem`     đối chứng: bộ đệm `interiorflow.lastUserId` CÓ SẴN trước khi vào.
 *   ② `--the-gioi=khong-dem`  ca hỏng:  bộ đệm RỖNG (đúng cảnh tab mới/bookmark/F5).
 *
 * Cả hai đi qua `motLuot()` y hệt: cùng user, cùng cookie phiên, cùng route, cùng thao tác, cùng
 * thời gian chờ. Biến DUY NHẤT là `addInitScript` gieo sẵn bộ đệm hay không. KHÔNG dùng cách
 * "đi qua Home trước" làm đối chứng — đường đó lệch nhiều hơn một biến (Home còn `setUser`, còn
 * `hydrate`, còn điều hướng), đúng cái bẫy `tai-hien-d7.mjs` đã ghi lại.
 *
 * ── VÌ SAO PHẢI ĐÓNG HẲN, KHÔNG `reload()` ────────────────────────────────────────────────
 * `launchPersistentContext` trên hồ sơ đĩa: đóng context = đóng hẳn trình duyệt, localStorage
 * còn lại trên đĩa đúng như máy người dùng. `reload()` giữ nguyên tiến trình và có thể đi vòng
 * qua chính lỗi đang đo.
 *
 * ⚠️ BẪY "THẾ GIỚI ĐÃ ẤM": lượt hai dùng LẠI hồ sơ của lượt một nên bộ đệm ĐÃ được app gieo ở
 * lượt một ⇒ lượt hai luôn có định danh. Đó là ĐÚNG Ý ĐỒ (ta muốn biết ở lượt hai người dùng
 * đọc ra số nào), nhưng nó cũng có nghĩa **phép đo quyết định nằm ở LƯỢT VÀO ĐẦU TIÊN** — nên
 * mỗi thế giới dựng hồ sơ MỚI TINH và chỉ đo lần đầu + lần mở lại.
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
const CHON = arg('the-gioi', 'ca-hai');
const CHROMIUM = arg('chromium', process.env.G2_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
const TK = { email: 'd8@kiemthu.local', matKhau: 'kiemthu123' };
const RA = 'docs/delivery/anh-duyet-mat/d8';
/**
 * NHÃN LƯỢT — chống GHI ĐÈ BẰNG CHỨNG. Bản đầu đặt tên tệp theo mỗi tên thế giới, nên lượt
 * chạy SAU KHI VÁ đè mất kết quả lượt TRƯỚC KHI VÁ — tức xoá đúng bằng chứng đắt nhất. Bằng
 * chứng của một phép đo phải sống lâu hơn phép đo đó, nếu không thì báo cáo chỉ còn là lời kể.
 */
const NHAN = arg('nhan', 'mac-dinh');
/** Số phút người dùng gõ vào. Cố ý KHÁC mặc định 15 để phân biệt "còn" với "về mặc định". */
const PHUT_MOI = 42;
const KHOA_PHUT = (uid) => `interiorflow.lockIdleMinutes.${uid}`;

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
  await pr.$disconnect();
  return { userId: u.id };
}

/** Đọc TỪ NƠI LƯU THẬT — không đọc chữ trên màn, không tin state trong bộ nhớ. */
async function docDia(page, uid) {
  return page.evaluate(
    ({ khoa }) => {
      let phut = null;
      let dem = null;
      let moiKhoaPhut = [];
      try {
        phut = localStorage.getItem(khoa);
        dem = localStorage.getItem('interiorflow.lastUserId');
        moiKhoaPhut = Object.keys(localStorage).filter((k) => k.startsWith('interiorflow.lockIdleMinutes'));
      } catch {
        /* localStorage bị chặn */
      }
      const st = window.__flowStore?.getState?.() ?? null;
      return { phutTrenDia: phut, dem, moiKhoaPhut, storeUser: st?.user?.id ?? null, coStore: !!st };
    },
    { khoa: KHOA_PHUT(uid) },
  );
}

/** Số đang hiện trong ô nhập "Tự khoá sau … phút" — thứ MẮT người dùng thấy. */
async function docO(page) {
  return page.evaluate(() => {
    const o = document.querySelector('input[type="number"][min="1"][max="180"]');
    return o ? o.value : null;
  });
}

async function motLuot({ ten, gieoDem, duLieu }) {
  const hoSo = path.join(os.tmpdir(), 'd8-ho-so', ten);
  rmSync(hoSo, { recursive: true, force: true });
  mkdirSync(hoSo, { recursive: true });
  const opt = { args: ['--no-sandbox'], viewport: { width: 1440, height: 900 } };
  if (CHROMIUM) opt.executablePath = CHROMIUM;

  // ── LƯỢT MỘT: vào thẳng /settings, đổi số, đóng hẳn ───────────────────────────────────
  let ctx = await chromium.launchPersistentContext(hoSo, opt);
  // Đăng nhập bằng API: cookie phiên vào hồ sơ đĩa, KHÔNG trang nào chạy JS ⇒ localStorage rỗng.
  const r = await ctx.request.post(`${GOC}/api/auth/login`, {
    data: { identifier: TK.email, password: TK.matKhau },
  });
  if (r.status() !== 200) {
    await ctx.close();
    throw new Error(`đăng nhập thất bại ${r.status()}`);
  }
  // ── BIẾN DUY NHẤT giữa hai thế giới ───────────────────────────────────────────────────
  if (gieoDem) {
    await ctx.addInitScript(
      ({ uid }) => {
        try {
          localStorage.setItem('interiorflow.lastUserId', uid);
        } catch {
          /* bỏ qua */
        }
      },
      { uid: duLieu.userId },
    );
  }

  let page = ctx.pages()[0] ?? (await ctx.newPage());
  await page.goto(`${GOC}/settings`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await cho(9000);

  const truocKhiGo = { ...(await docDia(page, duLieu.userId)), oHienThi: await docO(page) };

  /**
   * Gõ số mới — đúng cách người dùng làm, để `onChange` chạy như thật.
   *
   * 🔴 BA KẾT CỤC, KHÔNG PHẢI HAI — và bộ đo phải phân biệt được cả ba, nếu không nó biến một
   * LỖI HẠ TẦNG thành một FAIL (hoặc ngược lại, tệ hơn):
   *   ① ghi được          → đĩa có số
   *   ② ghi BỊ NUỐT       → gõ được, ô hiện số mới, đĩa vẫn rỗng ⇐ đây là bệnh D8
   *   ③ KHÔNG CHO GÕ      → ô vô hiệu vì chưa có định danh ⇐ đây là lớp phòng thủ, KHÔNG phải bệnh
   * Bản đầu của tệp này gọi thẳng `fill()`, mà `fill()` CHỜ phần tử enabled rồi mới gõ ⇒ gặp
   * kết cục ③ nó ném timeout sau 30 s và thoát mã 3. Đọc ra thì như hạ tầng hỏng, trong khi thật
   * ra app đang làm ĐÚNG. Nay đọc `disabled` TRƯỚC, ghi vào kết quả, không ném.
   */
  const o = page.locator('input[type="number"][min="1"][max="180"]').first();
  const coO = (await o.count()) > 0;
  const oBiVoHieu = coO ? await o.isDisabled().catch(() => false) : false;
  if (coO && !oBiVoHieu) {
    await o.fill(String(PHUT_MOI));
    await o.blur().catch(() => {});
    await cho(1200);
  }

  const sauKhiGo = { ...(await docDia(page, duLieu.userId)), oHienThi: await docO(page) };
  mkdirSync(RA, { recursive: true });
  await page.screenshot({ path: `${RA}/d8-${NHAN}-${ten}-luot1.png` }).catch(() => {});

  // ĐÓNG HẲN — không reload, không newContext.
  await ctx.close();
  await cho(1500);

  // ── LƯỢT HAI: mở lại CÙNG hồ sơ đĩa, vào lại /settings, đọc xem còn gì ────────────────
  ctx = await chromium.launchPersistentContext(hoSo, opt);
  page = ctx.pages()[0] ?? (await ctx.newPage());
  await page.goto(`${GOC}/settings`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await cho(9000);
  const sauKhiMoLai = { ...(await docDia(page, duLieu.userId)), oHienThi: await docO(page) };
  await page.screenshot({ path: `${RA}/d8-${NHAN}-${ten}-luot2.png` }).catch(() => {});
  await ctx.close().catch(() => {});

  const kq = {
    theGioi: ten,
    gieoDem,
    userId: duLieu.userId,
    coONhap: coO,
    oBiVoHieu,
    /** Ba kết cục, đọc thẳng ra chữ để báo cáo khỏi phải suy. */
    ketCuc: oBiVoHieu ? 'khong-cho-go' : sauKhiGo.phutTrenDia === String(PHUT_MOI) ? 'ghi-duoc' : 'ghi-bi-nuot',
    phutDaGo: PHUT_MOI,
    truocKhiGo,
    sauKhiGo,
    sauKhiMoLai,
    /**
     * BẤT BIẾN: gõ 42 rồi đóng hẳn mở lại thì ô phải hiện 42 VÀ đĩa phải có 42.
     * Đọc ô là để bắt ca "đĩa có mà màn không đọc ra"; đọc đĩa là để bắt ca "màn nhớ tạm".
     */
    dat: sauKhiMoLai.phutTrenDia === String(PHUT_MOI) && sauKhiMoLai.oHienThi === String(PHUT_MOI),
  };
  writeFileSync(`${RA}/tai-hien-d8-${NHAN}-${ten}.json`, JSON.stringify(kq, null, 2));
  return kq;
}

async function hamNong() {
  for (const u of ['/settings', '/']) await fetch(`${GOC}${u}`, { redirect: 'manual' }).catch(() => {});
  await cho(2500);
}

async function main() {
  if (!DB) {
    console.error('⛔ thiếu --db=file:<đường tuyệt đối>');
    process.exit(2);
  }
  const duLieu = await dungDuLieu();
  await hamNong();
  const cacThe =
    CHON === 'ca-hai'
      ? [
          { ten: 'co-dem', gieoDem: true },
          { ten: 'khong-dem', gieoDem: false },
        ]
      : [{ ten: CHON, gieoDem: CHON === 'co-dem' }];

  const ds = [];
  for (const t of cacThe) {
    const kq = await motLuot({ ...t, duLieu });
    ds.push(kq);
    console.log(JSON.stringify(kq, null, 2));
    console.log(
      kq.dat
        ? `\n✅ ${kq.theGioi}: gõ ${PHUT_MOI} → đóng hẳn → mở lại vẫn ${PHUT_MOI}`
        : `\n❌ ${kq.theGioi}: MẤT — đĩa=${kq.sauKhiMoLai.phutTrenDia} ô=${kq.sauKhiMoLai.oHienThi}`,
    );
  }
  mkdirSync(RA, { recursive: true });
  writeFileSync(`${RA}/tai-hien-d8-tong-${NHAN}.json`, JSON.stringify({ luc: new Date().toISOString(), ds }, null, 2));
  process.exit(ds.every((k) => k.dat) ? 0 : 1);
}

main().catch((e) => {
  console.error('💥', e);
  process.exit(3);
});
