/* LÔ DUYỆT MẮT — chụp đúng những mặt mà 30 mục "cần mắt Hoà" đang sống trên đó.
 * Khác lượt chụp trước: TẠO DỰ ÁN rồi mới đi, vì 11/30 mục nằm ở ba chặng 2D/3D/Trình bày
 * mà không có dự án thì không vào được.
 * Tên tệp mang MÃ MỤC trong sổ frontier ⇒ Hoà phán "ok/lệch" là ánh xạ thẳng về sổ, không phải
 * dịch qua một lớp mô tả nào. */
import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = process.env.OUT || '/tmp/lo-duyet-mat';
fs.mkdirSync(OUT, { recursive: true });
// Cổng nhận qua CONG — 3210 hay bị làn khác chiếm, và chụp nhầm server của làn khác là
// trình cho Hoà xem MỘT BẢN CODE KHÁC. Đo được 05/09: EADDRINUSE trên 3210.
const CONG = process.env.CONG || '3210';
const BASE = `http://localhost:${CONG}`;

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.setItem('if_intro_seen_v1', '1'); } catch {} });
const p = await ctx.newPage();
const loi = [];
p.on('pageerror', (e) => loi.push(String(e.message).slice(0, 120)));

const email = `lo.mat.${Date.now()}@if.test`, mk = 'MatThuong#2026';
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(() => {});
await p.waitForTimeout(600);
const t = p.locator('input[placeholder*="Tên"]').first(); if (await t.count()) await t.fill('Lô Duyệt');
const i = p.locator('input[placeholder*="Email"]').first(); if (await i.count()) await i.fill(email);
const pw = p.locator('input[type=password]'); for (let k = 0; k < await pw.count(); k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(() => {});
await p.waitForTimeout(7000);
console.log('đăng ký xong →', p.url());

// ── TẠO DỰ ÁN (không có dự án thì ba chặng đều khoá) ──
await p.locator('button:has-text("Tạo dự án mới")').first().click().catch(() => {});
await p.waitForTimeout(2500);
/* 🔴 BẪY: ô `input` ĐẦU TRANG là ô TÌM KIẾM trên thanh trên, không phải ô trong hộp thoại.
 * Lượt đầu tôi điền vào đó rồi tưởng app hỏng. Phải khoanh vùng trong [role=dialog]. */
/* 🔴 BẪY THỨ HAI: trang có HAI [role=dialog]; `.last()` lấy trúng cái KHÔNG chứa nút.
 * Chọn theo NỘI DUNG (hộp nào có nút "Tạo dự án") chứ không theo thứ tự. */
const hop = p.locator('[role=dialog],[aria-modal=true]').filter({ has: p.locator('button:has-text("Tạo dự án")') }).first();
await hop.locator('input[placeholder="Dự án mới"]').first().fill('Căn hộ Thảo Điền').catch(() => {});
await hop.locator('input[placeholder="120"]').first().fill('78').catch(() => {});
/* 🔴 BẪY THỨ TƯ (05/09): `hop` resolve trúng `.pib-scrim` chứ không phải thẻ hộp thoại — scrim
 * cũng mang role=dialog VÀ chứa nút bên trong, nên bộ lọc `has:` khớp nó. Hệ quả dây chuyền:
 * `.last()` trong vòng lặp nhãn cũ chọn trúng một NÚT GỢI Ý mang nguyên câu "…Tạo dự án trước,
 * rồi nhập tệp…" — chữ khớp, nút sai. Bấm thẳng đúng nút thì mất 44 ms và dự án tạo thật.
 * ⇒ Bỏ tick mẫu + cuộn scrim (cả hai vô tác dụng trên scrim và làm nhiễu phép đo), giữ đúng
 * phần cần: điền tên/diện tích rồi bấm nút theo TÊN CHÍNH XÁC. */
await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}/00a-hop-thoai-tao-du-an.png` });
/* 🔴 BẪY THỨ BA (05/09): vòng lặp nhãn cũ trả `daTao=false` — `hop` resolve RỖNG, nên MỌI
 * locator con đều rỗng và vòng lặp im lặng đi qua hết 5 nhãn. Hậu quả nguy hiểm hơn nhiều so
 * với "không tạo được dự án": ba chặng 2D/3D/Trình bày đều chụp trúng Home, và lô ảnh trình cho
 * Hoà sẽ là BỐN ẢNH HOME DÁN NHÃN KHÁC NHAU — tức bộ chụp NÓI DỐI về app.
 * ⇒ Bấm theo TÊN CHÍNH XÁC ở cấp trang, và KIỂM CHỨNG bằng thế giới (hộp thoại biến mất +
 * đếm dự án tăng), không tin một lá cờ boolean. */
const nutTao = p.getByRole('button', { name: 'Tạo dự án', exact: true }).first();
await nutTao.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
await nutTao.click({ timeout: 15000 }).catch((e) => console.log('bấm lỗi:', String(e).slice(0, 90)));
await p.waitForTimeout(4000);
const conHop = await p.locator('[role=dialog],[aria-modal=true]').count();
const soDuAn = await p.evaluate(() => fetch('/api/flows').then((r) => r.json()).then((j) => (Array.isArray(j) ? j.length : (j.flows || []).length)).catch(() => -1));
/* Khẳng định theo THẾ GIỚI (dự án có thật trong CSDL), KHÔNG theo tàn dư giao diện: tấm Thư
 * viện luôn nằm trong DOM với `visibility:hidden` nên `conHop` không bao giờ về 0 — lấy nó
 * làm điều kiện là tự dựng một cổng không bao giờ mở được. `conHop` giữ lại để in ra soi. */
const daTao = soDuAn > 0;
console.log(`đã tạo dự án: ${daTao} (hộp thoại còn ${conHop} · dự án ${soDuAn})`);
if (!daTao) { console.log('⛔ DỪNG — không có dự án thì ba chặng chụp trúng Home, lô ảnh sẽ nói dối.'); process.exit(1); }
console.log('sau tạo dự án →', p.url());
await p.screenshot({ path: `${OUT}/00-sau-tao-du-an.png` });

const MAN = [
  ['01-home',        '/',                 'thẻ Resume · nền theo giờ · presence-avatar-row · project-init-board'],
  ['02-2d',          null,                'pie-menu-2d · toolbar-mot-khuon · panel-handle-chung'],
  ['03-3d',          null,                'dock-3d-that · tool-state-3d · hinh-hoc-v2 · render-queue-live · ghe-3d-window-app'],
  ['04-trinh-bay',   null,                'h4-picker · material-a3 · present-magic-cua-vao · present-task-first'],
  ['05-vat-lieu',    '/materials',        'vat-lieu-mot-vat · material-impact-ui · boq-specid-namespace'],
  ['06-thu-vien',    '/library',          'panel-handle-chung · o-giai-nghia-co-hinh'],
  ['07-gallery',     '/library/gallery',  'gallery-lien-nganh'],
  ['08-viec',        '/tasks',            'tao-viec-tu-day · focus-entity-doc'],
  ['09-files',       '/files',            'hai tầng Files · panel-handle-chung'],
  ['10-cai-dat',     '/settings',         'mat-do-con-tro · hinh-hoc-ap-thang · vùng cuộn có vệt mờ'],
];
/* 🔴 BẪY THỨ NĂM (05/09): ba chặng đi bằng cách BẤM RAIL, và khi cú bấm trượt thì `.catch(()=>{})`
 * nuốt lỗi ⇒ trang không đổi ⇒ ba ảnh chặng đều là ẢNH HOME mang tên khác nhau. Lô ảnh trông
 * đầy đủ mà nói dối — đúng loại hỏng tệ nhất vì mọi dấu hiệu bề mặt đều xanh.
 * ⇒ Sau khi tạo dự án ta CÓ id trong URL; đi thẳng bằng đường dẫn, rồi KIỂM url có đúng chặng
 * không. Sai chặng thì ghi ĐỎ vào bảng, không âm thầm chụp Home. */
/* Lấy id từ API, KHÔNG từ URL: sau khi tạo, app khi thì tự nhảy sang /render, khi thì ở lại `/`
 * (đo được cả hai lượt trong cùng một phiên) ⇒ URL là nguồn CHẬP CHỜN, API là nguồn chắc. */
const idDuAn = await p.evaluate(() => fetch('/api/flows').then((r) => r.json())
  .then((j) => { const ds = Array.isArray(j) ? j : (j.flows || []); const x = ds[0] || {};
    return x.projectId || x.project?.id || x.id || ''; }).catch(() => ''));
console.log('id dự án:', idDuAn || '(không lấy được)');
const DUONG_CHANG = { '02-2d': 'cad', '03-3d': 'render', '04-trinh-bay': 'present' };
const bang = [];
for (const [ten, path, phu] of MAN) {
  loi.length = 0;
  try {
    if (path) { await p.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 45000 }); }
    else {
      if (!idDuAn) { bang.push({ ten, loi: 'KHÔNG CÓ id dự án — bỏ, thà thiếu ảnh còn hơn ảnh sai' }); console.log(`${ten.padEnd(14)} ⛔ không có id dự án`); continue; }
      await p.goto(`${BASE}/projects/${idDuAn}/${DUONG_CHANG[ten]}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    }
    await p.waitForTimeout(4500);
    /* Chờ tới khi trang THÔI quay: bản dev biên dịch route lần đầu mất vài giây, chụp sớm ra
     * ẢNH TRẮNG CÓ VÒNG QUAY — trình cho Hoà xem thì thành "màn trống", sai hẳn sự thật. */
    for (let i = 0; i < 12; i++) {
      const c = await p.evaluate(() => document.body.innerText.trim().length);
      if (c > 50) break;
      await p.waitForTimeout(1500);
    }
    if (!path && !p.url().includes(`/${DUONG_CHANG[ten]}`)) {
      bang.push({ ten, loi: `ĐI TRẬT: mong /${DUONG_CHANG[ten]}, tới ${p.url()}` });
      console.log(`${ten.padEnd(14)} ⛔ ĐI TRẬT → ${p.url()}`);
      continue;
    }
  } catch (e) { bang.push({ ten, loi: 'ĐI KHÔNG TỚI: ' + e.message.slice(0, 60) }); continue; }
  await p.screenshot({ path: `${OUT}/${ten}.png` });
  const d = await p.evaluate(() => ({ url: location.pathname, chu: document.body.innerText.trim().length,
    nut: document.querySelectorAll('button,a[href]').length }));
  bang.push({ ten, phu, ...d, loi: loi.slice(0, 1) });
  console.log(`${ten.padEnd(14)} ${d.url.padEnd(34)} chữ=${String(d.chu).padEnd(5)} nút=${String(d.nut).padEnd(4)} lỗi=${loi.length}`);
}
fs.writeFileSync(`${OUT}/do.json`, JSON.stringify(bang, null, 2));
await b.close();
