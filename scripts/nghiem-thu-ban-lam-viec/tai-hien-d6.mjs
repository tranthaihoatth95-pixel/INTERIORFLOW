#!/usr/bin/env node
/**
 * scripts/nghiem-thu-ban-lam-viec/tai-hien-d6.mjs — TÁI HIỆN CÓ KIỂM SOÁT lỗi D6.
 *
 * ⛔ VÌ SAO TỒN TẠI. `docs/delivery/PRODUCT-DEFECTS.md` D6 kết luận nhân quả bằng cách ĐỌC MÃ,
 * và tự khai là chưa dựng lại ca hỏng. Sửa một nguyên nhân chưa chứng minh là cách nhanh nhất
 * để GIẤU lỗi thật. Tệp này dựng ca hỏng rồi ĐỌC TỪ NƠI LƯU THẬT
 * (`localStorage['interiorflow.resume.<uid>']`), không đọc chữ trên màn.
 *
 * BA THẾ GIỚI, cùng một thao tác, khác nhau ĐÚNG một biến — thứ tự gieo định danh:
 *
 *   ① `--the-gioi=deep-link`  hồ sơ SẠCH, đăng nhập bằng API (cookie vào hồ sơ nhưng KHÔNG
 *                             trang nào chạy JS) ⇒ `interiorflow.lastUserId` RỖNG lúc
 *                             `ResumeTracker` chạy. ĐÂY LÀ CA HỎNG TỰ NHIÊN — không bơm gì.
 *   ② `--the-gioi=cham`       như ① nhưng làm CHẬM `/api/auth/me` thêm `--tre` ms. Phóng đại
 *                             cùng cuộc đua để loại giả thuyết "chỉ trùng hợp thời điểm".
 *   ③ `--the-gioi=qua-home`   gieo sẵn `lastUserId` TRƯỚC khi vào studio (mô phỏng luồng đã đi
 *                             qua Home). THẾ GIỚI ĐỐI CHỨNG: nếu ③ cũng thiếu `flowId` thì giả
 *                             thuyết "đua khởi động" SAI và phải đi tìm nguyên nhân khác.
 *
 * ① ② hỏng mà ③ lành ⇒ biến gây lỗi ĐÚNG LÀ thứ tự gieo định danh, không phải thứ khác.
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

const GOC = arg('goc', 'http://localhost:3100');
const DB = arg('db', process.env.G2_DB || '');
const THE_GIOI = arg('the-gioi', 'deep-link');
const TRE = Number(arg('tre', '3000'));
const CHROMIUM = arg('chromium', process.env.G2_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
const HO_SO = path.join(os.tmpdir(), 'd6-ho-so', THE_GIOI);
const TK = { email: 'g2@kiemthu.local', matKhau: 'kiemthu123' };
/**
 * Tên dự án dùng cho lượt chạy. Đổi tên = dự án MỚI, tức **dự án CÒN RỖNG** (chưa có bản vẽ) —
 * đó là một ca khác hẳn: người dùng phải bấm "Tạo bản vẽ mới" trước, và ở ca này bản ghi resume
 * lúc hỏng không phải "thiếu flowId" mà là **KHÔNG CÓ GÌ** (`raw: null`), tức thẻ tiêu điểm ở
 * Home còn không hiện ra để mà bấm. Phải kiểm riêng, không suy từ ca dự án đã có bản vẽ.
 */
const TEN_DU_AN = arg('du-an', 'G2 hanh trinh');

const cho = (ms) => new Promise((r) => setTimeout(r, ms));

/** ĐỌC NƠI LƯU THẬT — bản ghi resume trong localStorage, nguyên văn, không diễn giải. */
function docResume(page, userId) {
  return page.evaluate((uid) => {
    try {
      return {
        raw: localStorage.getItem('interiorflow.resume.' + uid),
        lastUserId: localStorage.getItem('interiorflow.lastUserId'),
      };
    } catch (e) {
      return { raw: null, loi: String(e) };
    }
  }, userId);
}

async function main() {
  if (!DB) { console.error('⛔ thiếu --db=file:<đường tuyệt đối>'); process.exit(2); }
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  const pr = new PrismaClient({ datasources: { db: { url: DB } } });
  const hash = await bcrypt.hash(TK.matKhau, 10);
  const u = await pr.user.upsert({
    where: { email: TK.email },
    update: { passwordHash: hash },
    create: { email: TK.email, name: 'G2', passwordHash: hash },
    select: { id: true },
  });
  let da = await pr.project.findFirst({ where: { userId: u.id, name: TEN_DU_AN } });
  if (!da) da = await pr.project.create({ data: { userId: u.id, name: TEN_DU_AN } });
  await pr.projectMember.upsert({
    where: { projectId_userId: { projectId: da.id, userId: u.id } },
    update: { role: 'owner' },
    create: { projectId: da.id, userId: u.id, role: 'owner' },
  });
  await pr.$disconnect();

  rmSync(HO_SO, { recursive: true, force: true });
  mkdirSync(HO_SO, { recursive: true });
  const opt = { args: ['--no-sandbox'], viewport: { width: 1440, height: 900 } };
  if (CHROMIUM) opt.executablePath = CHROMIUM;
  const ctx = await chromium.launchPersistentContext(HO_SO, opt);

  if (THE_GIOI === 'cham') {
    // PHÓNG ĐẠI CUỘC ĐUA — làm chậm ĐÚNG đường gieo định danh, không đụng gì khác.
    await ctx.route((url) => String(url).includes('/api/auth/me'), async (route) => {
      await cho(TRE);
      await route.continue();
    });
  }

  // Đăng nhập bằng API: cookie phiên vào hồ sơ, nhưng KHÔNG trang nào chạy JS ⇒ localStorage rỗng.
  const r = await ctx.request.post(`${GOC}/api/auth/login`, { data: { identifier: TK.email, password: TK.matKhau } });
  if (r.status() !== 200) throw new Error(`đăng nhập thất bại ${r.status()}`);
  const userId = (await (await ctx.request.get(`${GOC}/api/auth/me`)).json())?.user?.id;
  if (!userId) throw new Error('không lấy được userId');

  const page = ctx.pages()[0] ?? (await ctx.newPage());

  if (THE_GIOI === 'qua-home') {
    // ĐỐI CHỨNG: gieo sẵn bộ đệm định danh, y như trình duyệt đã đi qua Home/đăng nhập.
    await page.goto(`${GOC}/api/auth/me`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((uid) => localStorage.setItem('interiorflow.lastUserId', uid), userId);
  }

  if (THE_GIOI === 'bookmark-cu') {
    /**
     * ĐƯỜNG ĐUA THỨ HAI, cùng gốc D6 — `components/studio/LegacyStageRedirect.tsx:37` đọc
     * `activeProjectRouteId()` ĐỒNG BỘ trong effect mount (deps `[router, stage]`, chạy đúng
     * một lần), mà hàm đó rơi về `getLastUserId()` (`lib/project-scope.ts:62`). Mở BOOKMARK CŨ
     * `/cad-editor` bằng tab mới ⇒ store rỗng + bộ đệm định danh chưa gieo ⇒ nó dội về
     * `/?notice=choose-project` DÙ resume trên đĩa đã đủ `flowId`.
     *
     * Bước 1 gieo resume hợp lệ bằng đường deep-link bình thường; bước 2 mở hồ sơ SẠCH
     * localStorage-định-danh rồi vào thẳng route cũ — đó mới là ca thật.
     */
    await page.goto(`${GOC}/projects/${da.id}/cad`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(8000);
    // Xoá ĐÚNG bộ đệm định danh, GIỮ resume — dựng lại đúng trạng thái "tab mới, phiên còn hợp lệ".
    await page.evaluate(() => localStorage.removeItem('interiorflow.lastUserId'));
    const resumeTruoc = await docResume(page, userId);
    await page.goto(`${GOC}/cad-editor`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await cho(7000);
    const dich = page.url();
    const ketQuaBm = {
      theGioi: THE_GIOI,
      userId,
      duAn: da.id,
      resumeTruocKhiVao: resumeTruoc.raw,
      dichSauRedirect: dich,
      // BẤT BIẾN: bookmark route cũ phải đưa về ĐÚNG dự án, không dội về Home.
      dat: dich.includes(`/projects/${da.id}/`),
    };
    console.log(JSON.stringify(ketQuaBm, null, 2));
    mkdirSync('docs/delivery/anh-duyet-mat/d6', { recursive: true });
    writeFileSync('docs/delivery/anh-duyet-mat/d6/tai-hien-bookmark-cu.json', JSON.stringify(ketQuaBm, null, 2));
    await page.screenshot({ path: 'docs/delivery/anh-duyet-mat/d6/tai-hien-bookmark-cu.png' }).catch(() => {});
    await ctx.close().catch(() => {});
    console.log(ketQuaBm.dat ? '\n✅ bookmark-cu: về đúng dự án' : `\n❌ bookmark-cu: DỘI VỀ ${dich} — đường đua thứ hai`);
    process.exit(ketQuaBm.dat ? 0 : 1);
  }

  // ⭐ VÀO THẲNG route studio — đúng ca lỗi.
  await page.goto(`${GOC}/projects/${da.id}/cad`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await cho(5000);
  const tao = page.getByRole('button', { name: /Tạo bản vẽ mới/i });
  if (await tao.count().catch(() => 0)) {
    await tao.first().click({ timeout: 8000 }).catch(() => {});
    await tao.first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    await cho(2500);
  }
  await page.waitForSelector('canvas', { timeout: 60000 });
  await cho(3000);
  for (const ten of ['Vẽ ngay', 'Bỏ qua']) {
    try {
      const l = page.getByRole('button', { name: ten, exact: true });
      if (await l.count()) await l.first().click({ timeout: 2500 });
    } catch { /* không có lớp che */ }
  }
  await cho(600);

  // VẼ THẬT một nét — để đường ghi resume của CadSheets chắc chắn đã chạy.
  await page.getByRole('button', { name: 'Đường', exact: true }).first().click();
  await cho(600);
  const b = await page.locator('canvas').first().boundingBox();
  await page.mouse.click(b.x + 180, b.y + 200);
  await cho(350);
  await page.mouse.click(b.x + 440, b.y + 350);
  await cho(350);
  await page.keyboard.press('Escape');
  await cho(7000);

  const sauKhiVe = await docResume(page, userId);

  // QUAY VỀ HOME rồi đọc lại — đúng thao tác người dùng làm trước khi bấm thẻ tiêu điểm.
  await page.goto(`${GOC}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await cho(6000);
  const oHome = await docResume(page, userId);

  const j = sauKhiVe.raw ? JSON.parse(sauKhiVe.raw) : null;
  const jh = oHome.raw ? JSON.parse(oHome.raw) : null;
  const ketQua = {
    theGioi: THE_GIOI,
    userId,
    duAn: da.id,
    sauKhiVe: { raw: sauKhiVe.raw, lastUserId: sauKhiVe.lastUserId, coFlowId: !!j?.flowId },
    oHome: { raw: oHome.raw, lastUserId: oHome.lastUserId, coFlowId: !!jh?.flowId },
    // BẤT BIẾN: resume của route scope dự án PHẢI mang flowId = id dự án đang đứng.
    dat: !!jh?.flowId && jh.flowId === da.id,
  };
  console.log(JSON.stringify(ketQua, null, 2));
  mkdirSync('docs/delivery/anh-duyet-mat/d6', { recursive: true });
  writeFileSync(`docs/delivery/anh-duyet-mat/d6/tai-hien-${THE_GIOI}.json`, JSON.stringify(ketQua, null, 2));
  await page.screenshot({ path: `docs/delivery/anh-duyet-mat/d6/tai-hien-${THE_GIOI}.png` }).catch(() => {});
  await ctx.close().catch(() => {});
  console.log(ketQua.dat ? `\n✅ ${THE_GIOI}: resume ĐỦ flowId` : `\n❌ ${THE_GIOI}: resume THIẾU flowId — tái hiện được D6`);
  process.exit(ketQua.dat ? 0 : 1);
}

main().catch((e) => { console.error('💥', e); process.exit(3); });
