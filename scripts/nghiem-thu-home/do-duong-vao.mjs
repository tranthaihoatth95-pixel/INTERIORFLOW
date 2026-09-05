/** Bấm một dự án ở bậc KỀ BÊN thì đi đâu? Nút không có đường chạy thật = TRƯỢT (§4 bàn giao). */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
const GOC = 'http://localhost:3031';

const bh = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await bh.newContext({ viewport: { width: 1600, height: 900 } });
const api = await ctx.newPage();
await api.request.post(`${GOC}/api/auth/login`, { data: { identifier: 'tho@interiorflow.test', password: 'matkhau123' } });
const me = await (await api.request.get(`${GOC}/api/auth/me`)).json();
const flows = await (await api.request.get(`${GOC}/api/flows`)).json();
const pid = flows.projects?.[0]?.id;
console.log('dự án đầu:', pid, flows.projects?.[0]?.name);
await api.goto(GOC);
await api.evaluate((id) => {
  try {
    localStorage.setItem(`interiorflow.tourDone.${id}`, '1');
  } catch {}
}, me.user.id);
await api.close();

const page = await ctx.newPage();
const lichSu = [];
page.on('framenavigated', (f) => { if (f === page.mainFrame()) lichSu.push(f.url().replace(GOC, '')); });

// A · vào thẳng URL overview
await page.goto(`${GOC}/projects/${pid}/overview`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
console.log('A · vào thẳng /projects/<id>/overview → dừng ở:', page.url().replace(GOC, ''));
console.log('A · lịch sử điều hướng:', JSON.stringify(lichSu));

// B · từ Home bấm mục kề bên
lichSu.length = 0;
await page.goto(GOC, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const href = await page.evaluate(() => {
  const b = document.querySelector('.xuong-home .ke-ben');
  return b ? b.getAttribute('data-href') ?? 'nút không mang href (điều hướng bằng mã)' : 'không có mục kề bên';
});
console.log('B · mục kề bên:', href);
await page.click('.xuong-home .ke-ben');
await page.waitForTimeout(2500);
console.log('B · sau khi bấm → dừng ở:', page.url().replace(GOC, ''));
console.log('B · lịch sử điều hướng:', JSON.stringify(lichSu));
await bh.close();
