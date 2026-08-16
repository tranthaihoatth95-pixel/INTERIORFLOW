/**
 * scripts/chup-man-duyet-mat.mjs — MÁY CHỤP MÀN CHO CỬA DUYỆT MẮT (Hoà chốt 16/08).
 *
 * Đổ ảnh thẳng vào thư mục Google Drive đã sync trên máy:
 *   ~/Library/CloudStorage/GoogleDrive-<email>/Drive của tôi/IF-duyet-mat/01-anh/
 * Hoà mở app Google Drive trên điện thoại xem → thấy sai thì chụp màn + vẽ tay →
 * bỏ vào 02-note-cua-Hoa/ → T vào lấy.
 *
 * VÌ SAO LÀ SCRIPT, KHÔNG PHẢI BẤM TAY: việc này lặp lại MỖI ĐỢT. Bấm tay 100 lần
 * mỗi đợt là thứ chắc chắn sẽ bị bỏ, và bỏ thì nợ nghiệm thu mắt lại phình lên.
 *
 * CHẠY (Hoà chạy trên máy thật — T không được tự nhập mật khẩu):
 *   IF_EMAIL='<email của bạn>' IF_PASSWORD='<mật khẩu>' node scripts/chup-man-duyet-mat.mjs
 *
 * Tuỳ chọn:
 *   IF_URL=http://localhost:3000     (mặc định)
 *   IF_OUT=<thư mục khác>            (mặc định là thư mục Drive ở trên)
 *   IF_LOC=1                         chỉ chụp vài màn để thử nhanh
 *
 * Mật khẩu KHÔNG được ghi vào file nào, không vào git, chỉ sống trong biến môi
 * trường của đúng lệnh đó.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readdirSync, appendFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

/* NHẬT KÝ RA TỆP — để T đọc được khi có sự cố, kể cả lúc Hoà đã đóng cửa sổ.
   Thêm 16/08 sau ca chạy đầu không ra ảnh mà không ai biết hỏng ở đâu. */
const NHAT_KY = join(process.cwd(), 'nhat-ky-chup-man.txt');
try { writeFileSync(NHAT_KY, `— phiên chụp ${new Date().toLocaleString('vi-VN')} —\n`); } catch {}
const goc = console.log, gocLoi = console.error;
console.log = (...a) => { goc(...a); try { appendFileSync(NHAT_KY, a.join(' ') + '\n'); } catch {} };
console.error = (...a) => { gocLoi(...a); try { appendFileSync(NHAT_KY, 'LỖI: ' + a.join(' ') + '\n'); } catch {} };
process.on('uncaughtException', (e) => { console.error(String(e?.stack || e)); process.exit(1); });

const URL_GOC = process.env.IF_URL ?? 'http://localhost:3000';
const EMAIL = process.env.IF_EMAIL ?? '';
const MATKHAU = process.env.IF_PASSWORD ?? '';
const CHI_THU = process.env.IF_LOC === '1';

const OUT =
  process.env.IF_OUT ??
  join(homedir(), 'Library/CloudStorage', thuMucDrive(), 'Drive của tôi/IF-duyet-mat/01-anh');

function thuMucDrive() {
  const goc = join(homedir(), 'Library/CloudStorage');
  const found = readdirSync(goc).find((d) => d.startsWith('GoogleDrive-'));
  if (!found) throw new Error('Không thấy thư mục Google Drive đã sync trong ~/Library/CloudStorage');
  return found;
}

/**
 * DANH SÁCH KHUNG CẦN CHỤP.
 * `ten` phải TỰ NÓI — Hoà xem một mình trên điện thoại, không có ai giải thích cạnh bên.
 * `truoc` = việc phải làm trước khi bấm máy (mở panel, đổi mode, bật tool...).
 */
const KHUNG = [
  // ── Cửa vào ──────────────────────────────────────────────────────────────
  { ten: '00-01-man-khoa', url: '/login', khongCanDangNhap: true },
  { ten: '00-02-intro-mo-app', url: '/intro', khongCanDangNhap: true },

  // ── Tổng quan ────────────────────────────────────────────────────────────
  { ten: '01-01-home-tong-quan-du-an', url: '/' },
  { ten: '01-02-files-cho-dau-moi', url: '/files' },
  { ten: '01-03-bang-viec', url: '/tasks' },

  // ── Thư viện ─────────────────────────────────────────────────────────────
  { ten: '02-01-thu-vien-tong', url: '/library' },
  { ten: '02-02-thu-vien-gallery', url: '/library/gallery' },
  { ten: '02-03-thu-vien-nhap-tep', url: '/library/ingest' },
  { ten: '02-04-vat-lieu', url: '/materials' },
  { ten: '02-05-bang-mau', url: '/colors' },

  // ── Chặng 1 · Thiết kế 2D ────────────────────────────────────────────────
  { ten: '10-01-2d-toan-man', url: '/cad-editor', cho: 2500 },
  { ten: '10-02-2d-du-an', url: '/projects/:id/cad', cho: 2500 },

  // ── Chặng 2 · Thiết kế 3D ────────────────────────────────────────────────
  { ten: '20-01-3d-toan-man', url: '/projects/:id/render', cho: 3000 },
  { ten: '20-02-3d-ban-lam-viec-node', url: '/projects/:id/render', cho: 3000 },

  // ── Chặng 3 · Trình chiếu ────────────────────────────────────────────────
  { ten: '30-01-trinh-chieu-toan-man', url: '/present-editor', cho: 2500 },
  { ten: '30-02-trinh-chieu-du-an', url: '/projects/:id/present', cho: 2500 },
  { ten: '30-03-sua-anh', url: '/photo-editor', cho: 2000 },
  { ten: '30-04-anh-du-an', url: '/projects/:id/photo', cho: 2000 },

  // ── Trong dự án ──────────────────────────────────────────────────────────
  { ten: '40-01-du-an-tong-quan', url: '/projects/:id/overview' },
  { ten: '40-02-du-an-so-tay', url: '/projects/:id/notebook' },

  // ── Cài đặt ──────────────────────────────────────────────────────────────
  { ten: '50-01-cai-dat', url: '/settings' },
  { ten: '50-02-cai-dat-anh-dai-dien', url: '/settings/avatar' },
  { ten: '50-03-cai-dat-gioi-thieu', url: '/settings/about' },
  { ten: '50-04-cai-dat-giay-phep', url: '/settings/licenses' },
];

/* PHIÊN ĐĂNG NHẬP LƯU SẴN — Hoà gõ mật khẩu MỘT LẦN vào đúng ô đăng nhập của app,
   không bao giờ phải đặt nó vào dòng lệnh (dòng lệnh còn bị lưu vào lịch sử gõ). */
const PHIEN = join(homedir(), '.if-phien-chup-man');
const MO_DANG_NHAP = process.argv.includes('--dang-nhap');

/**
 * Dọn lớp che trước khi bấm máy — sửa 16/08 sau khi Hoà mở lô đầu trên điện thoại.
 *
 * 🔴 VÌ SAO CẦN: cả lô 17 ảnh đầu đều có hộp chào "InteriorFlow — từ bản vẽ tới hồ sơ trình
 * khách" nằm GIỮA màn, kèm scrim làm TỐI TOÀN BỘ nền. Ảnh vẫn là app thật, đã đăng nhập —
 * nhưng soi qua lớp mờ thì KHÔNG đánh giá được màu, tương phản hay nhịp, tức mất đúng thứ
 * lô ảnh này sinh ra để soi. Chụp mà không dọn lớp che = chụp một lô không dùng được.
 *
 * Cách dọn: bấm đúng nút "Bỏ qua"/"Đóng" nếu có (giữ nguyên đường người dùng thật), không
 * xoá DOM bằng tay — xoá tay thì ảnh không còn phản ánh app thật nữa.
 * Không thấy lớp che nào thì trả về ngay, không chờ, không báo lỗi.
 */
async function donLopChe(page) {
  const nhan = ['Bỏ qua', 'Skip', 'Đóng', 'Close', 'Để sau'];
  for (const t of nhan) {
    const nut = page.getByRole('button', { name: t, exact: false }).first();
    try {
      if (await nut.isVisible({ timeout: 250 })) {
        await nut.click({ timeout: 1500 });
        await page.waitForTimeout(400); // chờ scrim tan hẳn, kẻo chụp trúng lúc đang mờ dần
        return true;
      }
    } catch {
      /* không có nút đó — thử nhãn kế */
    }
  }
  return false;
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  const ctx = await chromium.launchPersistentContext(PHIEN, {
    headless: !MO_DANG_NHAP,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // ảnh nét khi Hoà zoom trên điện thoại
    locale: 'vi-VN',
  });
  const browser = ctx.browser() ?? { close: () => ctx.close() };
  const page = ctx.pages()[0] ?? (await ctx.newPage());

  // ── Lối 1: mở cửa sổ thật cho Hoà đăng nhập tay, rồi ghi nhớ phiên ────────
  if (MO_DANG_NHAP) {
    console.log('\n🔓 Cửa sổ vừa mở — Hoà đăng nhập như bình thường.');
    console.log('   Vào được rồi thì ĐÓNG CỬA SỔ. Phiên sẽ được ghi nhớ cho lần sau.\n');
    await page.goto(URL_GOC, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForEvent('close', { timeout: 0 }).catch(() => {});
    await ctx.close().catch(() => {});
    console.log('✅ Đã ghi nhớ phiên. Giờ chạy lại KHÔNG kèm --dang-nhap là máy tự chụp.\n');
    return;
  }

  console.log(`📂 Đổ ảnh vào: ${OUT}\n`);

  // ── Lối 2: dùng phiên đã nhớ; chỉ dùng biến môi trường nếu Hoà cố ý đặt ───
  await page.goto(URL_GOC, { waitUntil: 'domcontentloaded' });
  if (EMAIL && MATKHAU) {
    const res = await page.request.post(`${URL_GOC}/api/auth/login`, {
      data: { identifier: EMAIL, password: MATKHAU, remember: true },
    });
    if (!res.ok()) {
      console.error(`⛔ Đăng nhập hỏng (${res.status()}): ${await res.text()}`);
      await ctx.close();
      process.exit(1);
    }
    console.log('✅ Đăng nhập bằng tài khoản đưa qua lệnh\n');
  }

  // Kiểm phiên bằng API — chắc chắn hơn soi URL, vì màn intro render ngay tại `/`
  // nên URL không đổi và cách soi cũ không bắt được (ca thật 16/08: chụp trọn lô
  // ở trạng thái chưa đăng nhập, kho nào cũng 0 mục mà không ai biết).
  let chuaDangNhap = true;
  try {
    const me = await page.request.get(`${URL_GOC}/api/auth/me`);
    chuaDangNhap = !me.ok();
  } catch {
    /* không gọi được thì cứ coi như chưa, thà dừng còn hơn chụp cả lô rỗng */
  }
  if (chuaDangNhap) {
    console.error(
      '\n⛔ CHƯA ĐĂNG NHẬP — app đang đứng ở màn khoá nên không chụp được bên trong.\n' +
        '   Chạy MỘT LẦN lệnh này, đăng nhập bằng tay rồi đóng cửa sổ:\n' +
        '     node scripts/chup-man-duyet-mat.mjs --dang-nhap\n' +
        '   Sau đó chạy lại lệnh chụp bình thường.\n',
    );
    await ctx.close();
    process.exit(1);
  }
  console.log('✅ Phiên đăng nhập còn hiệu lực\n');

  // ── Lấy một dự án thật để chụp các màn cần dự án ──────────────────────────
  /* Lấy id dự án — sửa 17/08 sau khi lô đầu BỎ 7 KHUNG.
     🔴 GỐC BỆNH: bản cũ gọi `GET /api/projects` — **route đó KHÔNG TỒN TẠI**
     (`app/api/projects/` chỉ có `[id]/`, không có endpoint danh sách) ⇒ luôn rỗng ⇒ lặng lẽ bỏ
     đúng 7 khung QUAN TRỌNG NHẤT: 2D · 3D · Trình chiếu · Tổng quan · Sổ tay. Máy chạy "thành
     công" 17 ảnh mà thiếu hẳn ba chặng — kiểu hỏng tệ nhất vì nó KHÔNG kêu.
     Nay thử ba đường, và **NÓI RÕ đường nào ăn** để lần sau hỏng thì biết hỏng ở đâu. */
  let duAnId = process.env.IF_PROJECT_ID ?? '';
  let nguon = duAnId ? 'biến môi trường' : '';

  if (!duAnId) {
    // ① /api/flows — route CÓ THẬT (`app/api/flows/route.ts`), dùng cookie của trình duyệt.
    const r = await page.request.get(`${URL_GOC}/api/flows`).catch(() => null);
    if (r?.ok()) {
      const js = await r.json().catch(() => null);
      const ds = Array.isArray(js) ? js : (js?.flows ?? js?.items ?? js?.projects ?? []);
      const it = ds?.[0];
      duAnId = it?.projectId ?? it?.project?.id ?? it?.id ?? '';
      if (duAnId) nguon = '/api/flows';
    }
  }

  if (!duAnId) {
    // ② Vét từ chính trang Home — thứ NGƯỜI DÙNG thật sự thấy. Chậm hơn nhưng không phụ thuộc
    //    hình dạng API, nên không chết lặng khi API đổi.
    await page.goto(URL_GOC, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(2500);
    duAnId = await page
      .evaluate(() => {
        const a = document.querySelector('a[href*="/projects/"]');
        const m = a?.getAttribute('href')?.match(/\/projects\/([^/?#]+)/);
        return m?.[1] ?? '';
      })
      .catch(() => '');
    if (duAnId) nguon = 'vét từ trang Home';
  }

  if (duAnId) console.log(`📁 Dùng dự án: ${duAnId}  (nguồn: ${nguon})\n`);
  else {
    console.log('⚠️  KHÔNG lấy được id dự án — sẽ bỏ 7 khung của ba chặng.');
    console.log('    Chạy lại kèm:  IF_PROJECT_ID=<id> node scripts/chup-man-duyet-mat.mjs');
    console.log('    (mở app, vào một dự án, chép id trên thanh địa chỉ)\n');
  }

  const ds = CHI_THU ? KHUNG.slice(0, 4) : KHUNG;
  const bo = [];
  let n = 0;

  for (const k of ds) {
    if (k.url.includes(':id') && !duAnId) {
      bo.push(`${k.ten} — không có dự án`);
      continue;
    }
    const url = URL_GOC + k.url.replace(':id', duAnId);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    } catch {
      // networkidle không tới được (app có polling) — vẫn chụp cái đang thấy
    }
    await page.waitForTimeout(k.cho ?? 1200);
    await donLopChe(page);

    // Một khung hỏng KHÔNG được làm chết cả lô — ghi lại rồi đi tiếp.
    const tep = join(OUT, `${k.ten}.png`);
    try {
      await page.screenshot({ path: tep, timeout: 20000, animations: 'disabled' });
      n++;
      console.log(`  📸 ${k.ten}`);
    } catch (e) {
      const ly = String(e?.message ?? e).split('\n')[0];
      bo.push(`${k.ten} — ${ly}`);
      console.error(`  ⚠️  bỏ ${k.ten}: ${ly}`);
    }
  }

  // ── Tờ mục lục để Hoà biết đang xem gì, đối chiếu tên khi note ────────────
  const mucLuc = [
    '# LÔ ẢNH DUYỆT MẮT — InteriorFlow',
    '',
    `Chụp lúc: ${new Date().toLocaleString('vi-VN')}`,
    `Khổ màn: 1440×900 · độ nét gấp đôi`,
    '',
    '## Cách note ngược cho T',
    'Thấy chỗ nào sai: **chụp màn hình + vẽ khoanh** rồi bỏ vào thư mục `02-note-cua-Hoa`.',
    'Giữ nguyên phần mã đầu tên ảnh (vd `20-01`) để T biết đang nói màn nào.',
    '',
    '## Danh sách',
    ...ds.map((k) => `- \`${k.ten}\` — ${k.url}`),
    '',
    ...(bo.length ? ['## Không chụp được', ...bo.map((b) => `- ${b}`)] : []),
  ].join('\n');
  writeFileSync(join(OUT, '00-00-MUC-LUC.md'), mucLuc);

  await browser.close();
  console.log(`\n✅ Xong ${n} ảnh → ${OUT}`);
  if (bo.length) console.log(`⚠️  Bỏ ${bo.length} khung: ${bo.join(' · ')}`);
  console.log('\nMở app Google Drive trên điện thoại, vào IF-duyet-mat/01-anh là thấy.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
