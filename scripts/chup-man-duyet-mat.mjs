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
import { mkdirSync, writeFileSync, readdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

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

async function main() {
  if (!EMAIL || !MATKHAU) {
    console.error(
      '\n⛔ Thiếu tài khoản. Chạy lại:\n' +
        "   IF_EMAIL='<email>' IF_PASSWORD='<mật khẩu>' node scripts/chup-man-duyet-mat.mjs\n",
    );
    process.exit(1);
  }

  mkdirSync(OUT, { recursive: true });
  console.log(`📂 Đổ ảnh vào: ${OUT}\n`);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // ảnh nét khi Hoà zoom trên điện thoại
    locale: 'vi-VN',
  });
  const page = await ctx.newPage();

  // ── Đăng nhập một lần, dùng chung cho mọi khung ───────────────────────────
  await page.goto(URL_GOC, { waitUntil: 'domcontentloaded' });
  const res = await page.request.post(`${URL_GOC}/api/auth/login`, {
    data: { identifier: EMAIL, password: MATKHAU, remember: true },
  });
  if (!res.ok()) {
    console.error(`⛔ Đăng nhập hỏng (${res.status()}): ${await res.text()}`);
    await browser.close();
    process.exit(1);
  }
  console.log('✅ Đăng nhập xong\n');

  // ── Lấy một dự án thật để chụp các màn cần dự án ──────────────────────────
  let duAnId = process.env.IF_PROJECT_ID ?? '';
  if (!duAnId) {
    const r = await page.request.get(`${URL_GOC}/api/projects`);
    if (r.ok()) {
      const js = await r.json().catch(() => null);
      const ds = Array.isArray(js) ? js : (js?.projects ?? js?.items ?? []);
      duAnId = ds?.[0]?.id ?? '';
    }
  }
  if (duAnId) console.log(`📁 Dùng dự án: ${duAnId}\n`);
  else console.log('⚠️  Không lấy được dự án — bỏ qua các màn cần dự án\n');

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

    const tep = join(OUT, `${k.ten}.png`);
    await page.screenshot({ path: tep, fullPage: false });
    n++;
    console.log(`  📸 ${k.ten}`);
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
