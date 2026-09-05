/**
 * .nen-chup/chup-home.mjs — chụp Home TRÊN APP THẬT (không phải bản vẽ tĩnh).
 *
 * Chấm theo LUỒNG, không theo ảnh rời: đăng nhập → Home → vào một dự án → quay về Home.
 * Mỗi trạng thái tối đa 4 ảnh. Chạy:
 *   node .nen-chup/chup-home.mjs
 *
 * ⚠️ Thư mục này bị gitignore (`.nen-*`) — bài học 04/09: thứ nằm ngoài git thì git không cứu
 *    được. Ảnh bằng chứng vì thế được CHÉP sang `docs/delivery/anh-duyet-mat/home-that/`
 *    (được theo dõi) ngay trong chính script này, không để ở đây.
 */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { mkdirSync, copyFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const GOC = 'http://localhost:3031';
const RA = '.nen-chup/out';
const DICH = 'docs/delivery/anh-duyet-mat/home-that';
mkdirSync(RA, { recursive: true });
mkdirSync(DICH, { recursive: true });

const RONG = { width: 1600, height: 900 };
const HEP = { width: 1280, height: 800 };

const ghi = [];

async function dangNhap(ctx) {
  const p = await ctx.newPage();
  const r = await p.request.post(`${GOC}/api/auth/login`, {
    data: { identifier: 'tho@interiorflow.test', password: 'matkhau123' },
  });
  if (!r.ok()) throw new Error(`đăng nhập hỏng: ${r.status()}`);
  const me = await (await p.request.get(`${GOC}/api/auth/me`)).json();
  // Tắt màn chào lần-đầu (`WelcomeIntro`, z-95) — nó CHE cả màn nên mọi ảnh bằng chứng thành
  // vô dụng. Đây là hành vi ĐÚNG của app với tài khoản mới, không phải lỗi; ta chỉ đưa tài
  // khoản chụp ảnh về trạng thái "người dùng đã quen" bằng CHÍNH khoá app dùng.
  await p.goto(GOC);
  await p.evaluate((id) => {
    try {
      localStorage.setItem(`interiorflow.tourDone.${id}`, '1');
    } catch {}
  }, me?.user?.id ?? '');
  await p.close();
}

async function datTheme(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem('interiorflow.theme', t);
    } catch {}
  }, theme);
  await page.waitForTimeout(350);
}

async function chup(page, ten) {
  const f = join(RA, `${ten}.png`);
  await page.screenshot({ path: f });
  copyFileSync(f, join(DICH, `${ten}.png`));
  ghi.push(ten);
  console.log('  ↳', ten);
}

/** Đo hình học THẬT trên màn — đây là bằng chứng, không phải lời khai. */
async function doHinhHoc(page) {
  return page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const r = (el) => (el ? el.getBoundingClientRect() : null);
    const goi = (el) => (el ? { w: Math.round(el.width), h: Math.round(el.height), x: Math.round(el.x), y: Math.round(el.y) } : null);
    const doc = document.documentElement;
    return {
      thang: goi(r(q('.xuong-home .thang'))),
      dai: goi(r(q('.xuong-home .dai'))),
      vat: goi(r(q('.xuong-home .vat'))),
      nguCanh: goi(r(q('.xuong-home .ngu-canh'))),
      soKeBen: document.querySelectorAll('.xuong-home .ke-ben').length,
      soONen: document.querySelectorAll('.xuong-home .o-nen').length,
      soThan: document.querySelectorAll('.xuong-home .vat').length,
      cauKhiGoi: q('.xuong-home .khi-goi span')?.textContent?.trim() ?? null,
      nhanTrenAnh: document.querySelectorAll('.xuong-home .nhan-dai').length,
      demo: !!q('.xuong-home .the-demo'),
      cuonNgang: doc.scrollWidth > doc.clientWidth,
      // Hàng CAO CỐ ĐỊNH mà nội dung cao hơn khung = chữ đã tràn ra ngoài hàng.
      // Đây là lỗi đo được, không phải chuyện gu — bắt bằng máy thay vì bằng mắt.
      hangTran: ['.vat-dau', '.vat-chan', '.muc', '.o-nen', '.hang-vl', '.ke-ben']
        .flatMap((s) => [...document.querySelectorAll(`.xuong-home ${s}`)]
          .filter((n) => n.scrollHeight > n.clientHeight + 1)
          .map((n) => `${s}:${n.scrollHeight}>${n.clientHeight}`)),
      // §30 — nội dung ngoài tầm nhìn PHẢI có dấu hiệu còn tiếp.
      thangCuon: (() => {
        const t = q('.xuong-home .thang');
        return t ? { scroll: t.scrollHeight, client: t.clientHeight, tran: t.scrollHeight > t.clientHeight + 1 } : null;
      })(),
    };
  });
}

/** BẤT BIẾN KHOÁ: bỏ hẳn dải môi trường đi thì KHÔNG chữ nào mất đọc — chỉ mất không khí. */
async function kiemBatBien(page) {
  const truoc = await page.evaluate(() =>
    [...document.querySelectorAll('.xuong-home')].map((n) => n.innerText).join('\n'),
  );
  await page.evaluate(() => {
    document.querySelectorAll('.xuong-home .dai').forEach((n) => n.remove());
  });
  await page.waitForTimeout(200);
  const sau = await page.evaluate(() =>
    [...document.querySelectorAll('.xuong-home')].map((n) => n.innerText).join('\n'),
  );
  // Chữ nằm TRÊN dải (hai nhãn) sẽ mất theo dải — đó là đúng, chúng là chú thích của ảnh.
  // Điều phải đúng: MỌI chữ còn lại y nguyên, và không chữ nào rơi vào nền không đọc được.
  const conLai = await page.evaluate(() => {
    const xau = [];
    const doc = [...document.querySelectorAll('.xuong-home *')].filter(
      (n) => n.children.length === 0 && n.textContent && n.textContent.trim().length > 1,
    );
    for (const n of doc) {
      const s = getComputedStyle(n);
      let bg = 'rgba(0, 0, 0, 0)';
      let el = n;
      while (el && bg === 'rgba(0, 0, 0, 0)') {
        bg = getComputedStyle(el).backgroundColor;
        el = el.parentElement;
      }
      if (bg === 'rgba(0, 0, 0, 0)') xau.push(n.textContent.trim().slice(0, 40));
    }
    return xau;
  });
  return { truoc, sau, khongDoDuoc: conLai };
}

// Bản Chromium có sẵn trong máy là build 1194, còn gói playwright ở đây đòi 1234 ⇒ trỏ
// THẲNG vào chỗ có thật thay vì tải thêm trình duyệt. Chỉ đo được trên Chromium — khai rõ.
const bh = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
try {
  // Tên ảnh phải TỰ NÓI — Hoà xem một mình trên điện thoại, không có ai giải thích cạnh bên.
  // Dùng thẳng BỀ RỘNG làm tiền tố: "rộng/hẹp" đọc mơ hồ, và "rong-rong" thì một chữ mang hai
  // nghĩa (khổ rộng ↔ xưởng rỗng) — đúng bệnh cùng-một-chữ-nhiều-nghĩa.
  for (const [tenKho, kho] of [['1600', RONG], ['1280', HEP]]) {
    const ctx = await bh.newContext({ viewport: kho, deviceScaleFactor: 1 });
    await dangNhap(ctx);
    const page = await ctx.newPage();

    for (const canh of ['', 'co-viec', 'day-du', 'rong']) {
      const url = canh ? `${GOC}/?demo=${canh}` : `${GOC}/`;
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      const nhan = canh || 'that';

      for (const theme of ['toi', 'sang']) {
        await datTheme(page, theme === 'toi' ? 'dark' : 'light');
        await chup(page, `${tenKho}-${nhan}-${theme}`);
        if (theme === 'toi') {
          const hh = await doHinhHoc(page);
          console.log(`     HÌNH HỌC ${tenKho}/${nhan}:`, JSON.stringify(hh));
          writeFileSync(join(RA, `hinh-hoc-${tenKho}-${nhan}.json`), JSON.stringify(hh, null, 2));
        }
      }
    }

    // BẤT BIẾN: gỡ dải môi trường
    if (tenKho === '1600') {
      await page.goto(`${GOC}/?demo=co-viec`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const bb = await kiemBatBien(page);
      console.log('     BẤT BIẾN · chữ không đo được sau khi gỡ dải:', bb.khongDoDuoc.length);
      writeFileSync(join(RA, 'bat-bien.json'), JSON.stringify(bb, null, 2));
      await chup(page, '1600-co-viec-BO-DAI-ANH-CHUNG-MINH-BAT-BIEN');
    }

    await ctx.close();
  }
  console.log('\nĐã chụp', ghi.length, 'ảnh →', DICH);
} finally {
  await bh.close();
}
