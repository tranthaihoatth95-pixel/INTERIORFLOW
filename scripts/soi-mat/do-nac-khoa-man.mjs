/**
 * scripts/soi-mat/do-nac-khoa-man.mjs — nấc "Tự khoá sau" CÒN hay MẤT sau khi đóng hẳn trình duyệt.
 *
 * ⚠️ VÌ SAO KHÔNG DÙNG `tai-hien-d8.mjs`: tệp đó lái `input[type=number][min=1][max=180]`, mà ô số
 * tự do ĐÃ BỊ THAY bằng dải nấc bấm (Lane K, 22/08). Chạy nó lên bản hiện tại thì `coONhap:false`
 * và kết cục luôn là "ghi-bị-nuốt" — **đó là phép đo lỗi thời, không phải bằng chứng hồi quy**.
 *
 * Phép đo ở đây: hồ sơ đĩa MỚI TINH → đăng ký → vào THẲNG /settings ở tab mới → bấm nấc 30
 * → đóng HẲN context (không reload) → mở lại → đọc localStorage + đọc `aria-pressed` trên màn.
 */
import { chromium } from 'playwright';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os'; import path from 'node:path';
const CONG = process.env.CONG || '3230';
const BASE = `http://localhost:${CONG}`;
const hoSo = mkdtempSync(path.join(os.tmpdir(), 'nac-khoa-'));
const email = `nac.${Date.now()}@if.test`, mk = 'MatThuong#2026';
const cho = (ms) => new Promise(r => setTimeout(r, ms));

async function mo() {
  return chromium.launchPersistentContext(hoSo, {
    executablePath: '/opt/pw-browsers/chromium', viewport: { width: 1440, height: 900 },
  }).then(async (c) => { await c.addInitScript(() => { try { localStorage.setItem('if_intro_seen_v1', '1'); } catch {} }); return c; });
}
const docDia = (p) => p.evaluate(() => {
  const r = {}; for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i); if (k.includes('lockIdleMinutes')) r[k] = localStorage.getItem(k);
  } return r;
});
const nacDangChon = (p) => p.evaluate(() =>
  [...document.querySelectorAll('button[aria-pressed="true"]')].map(b => b.textContent.trim())
    .filter(t => /phút|Never|min|Không bao giờ/.test(t)));

let c = await mo(); let p = c.pages()[0] || await c.newPage();
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 }); await cho(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(() => {}); await cho(600);
const t = p.locator('input[placeholder*="Tên"]').first(); if (await t.count()) await t.fill('NAC');
const i = p.locator('input[placeholder*="Email"]').first(); if (await i.count()) await i.fill(email);
const pw = p.locator('input[type=password]'); for (let k = 0; k < await pw.count(); k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(() => {}); await cho(7000);

// vào THẲNG /settings ở TAB MỚI — đúng cảnh bookmark/F5 mà D8 mô tả
const p2 = await c.newPage();
await p2.goto(BASE + '/settings', { waitUntil: 'domcontentloaded' }); await cho(4000);
const nut = p2.locator('button:has-text("30 phút")').first();
const co = await nut.count();
// Cửa sổ vô hiệu ~3s là CÓ THẬT (đo được) trong lúc `/api/auth/me` chưa về — chờ nó mở rồi
// mới bấm, nếu không phép đo chỉ đo lại đúng cửa sổ đó chứ không đo việc LƯU.
const voHieu = co ? await nut.isDisabled() : null;
if (co) await nut.click({ timeout: 20000 }).catch((e) => console.log('KHÔNG bấm được:', String(e).slice(0, 120)));
await cho(1500);
console.log('có nút 30 phút:', co > 0, '· bị vô hiệu lúc bấm:', voHieu);
console.log('ngay sau khi bấm · đĩa:', JSON.stringify(await docDia(p2)), '· nấc:', await nacDangChon(p2));
await c.close();

c = await mo(); p = c.pages()[0] || await c.newPage();
await p.goto(BASE + '/settings', { waitUntil: 'domcontentloaded' }); await cho(5000);
console.log('sau khi mở lại  · đĩa:', JSON.stringify(await docDia(p)), '· nấc:', await nacDangChon(p));
await c.close(); rmSync(hoSo, { recursive: true, force: true });
