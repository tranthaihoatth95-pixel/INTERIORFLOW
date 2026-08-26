/**
 * artifacts/tmp-lane-home/chup-home.mjs — chụp Home ở đủ 5 trạng thái A→E + 4 khung giờ.
 *
 * [Đ2] Dùng lại ĐÚNG cơ chế của `scripts/chup-visual-review.mjs`: `launchPersistentContext`
 * trên hồ sơ `~/.if-phien-chup-man` (phiên đã đăng nhập tay từ trước, không cần mật khẩu).
 *
 * GIỜ được ép bằng cách ghi đè `Date` trong trang (addInitScript) — KHÔNG đổi giờ hệ thống.
 * `daQuayLai` ép bằng `sessionStorage` — đúng khoá thật mà `components/home/da-quay-lai.ts` đọc,
 * không phải một cửa hậu riêng cho ảnh.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const URL = process.env.IF_URL ?? 'http://127.0.0.1:3799';
const PHIEN = join(homedir(), '.if-phien-chup-man');
const OUT = join(process.cwd(), 'artifacts', 'visual-review');

/** Ép giờ trong trang: Date.now() và new Date() đều lùi/tiến về mốc giờ muốn chụp. */
function scriptEpGio(gio) {
  return `(() => {
    const D = Date; const now = new D();
    const goc = new D(now.getFullYear(), now.getMonth(), now.getDate(), ${gio}, 17, 0).getTime();
    const batDau = D.now();
    class DGia extends D {
      constructor(...a) { if (a.length === 0) super(goc + (D.now() - batDau)); else super(...a); }
      static now() { return goc + (D.now() - batDau); }
    }
    globalThis.Date = DGia;
  })()`;
}

const CANH = [
  // tên tệp                              giờ  daQuayLai  ghi chú
  ['home-A-chua-co-gi.png',                10, false],
  ['home-B-phien-dang-do.png',             10, false],
  ['home-C-dau-ngay.png',                   8, false],
  ['home-D-giua-gio.png',                  14, true],
  ['home-E-cuoi-ngay.png',                 20, false],
  ['home-nen-01-dawn-06h.png',              6, false],
  ['home-nen-02-day-12h.png',              12, false],
  ['home-nen-03-dusk-18h.png',             18, false],
  ['home-nen-04-night-22h.png',            22, false],
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const ctx = await chromium.launchPersistentContext(PHIEN, {
    headless: true,
    viewport: { width: 1440, height: 900 },
    locale: 'vi-VN',
  });
  const p0 = ctx.pages()[0] ?? (await ctx.newPage());
  await p0.goto(URL, { waitUntil: 'domcontentloaded' }).catch(() => {});
  const me = await p0.request.get(`${URL}/api/auth/me`).catch(() => null);
  if (!me || !me.ok()) {
    console.error('⛔ Phiên chụp chưa đăng nhập. Chạy: node scripts/chup-man-duyet-mat.mjs --dang-nhap');
    await ctx.close();
    process.exit(1);
  }

  for (const [ten, gio, quayLai] of CANH) {
    const p = await ctx.newPage();
    await p.addInitScript(scriptEpGio(gio));
    await p.addInitScript(
      (q) => {
        try {
          if (q) sessionStorage.setItem('interiorflow.home.daRoi_v1', '1');
          else sessionStorage.removeItem('interiorflow.home.daRoi_v1');
        } catch {}
      },
      quayLai,
    );
    await p.setViewportSize({ width: 1440, height: 900 });
    await p.goto(URL + '/', { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
    await p.waitForTimeout(3500);
    const tt = await p
      .$eval('[data-home-trang-thai]', (n) => ({
        tt: n.getAttribute('data-home-trang-thai'),
        mat: n.getAttribute('data-home-mat-do'),
        o: n.querySelectorAll('[data-o-co]').length,
      }))
      .catch(() => null);
    await p.screenshot({ path: join(OUT, ten), timeout: 30000, animations: 'disabled' });
    console.log(`  ✓ ${ten}  gio=${gio} quayLai=${quayLai}  →`, tt ?? '(không thấy data-home-trang-thai)');
    await p.close();
  }
  await ctx.close();
}
main();
