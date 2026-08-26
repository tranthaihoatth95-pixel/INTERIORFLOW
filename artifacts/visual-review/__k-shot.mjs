import { chromium } from 'playwright';
import { homedir } from 'os'; import { join } from 'path';
const URL='http://localhost:3000';
const OUT='artifacts/visual-review/';
const ctx = await chromium.launchPersistentContext(join(homedir(),'.if-phien-chup-man'),{headless:true,viewport:{width:1440,height:900},locale:'vi-VN'});
const p = ctx.pages()[0] ?? await ctx.newPage();
p.on('pageerror', e=>console.log('PAGEERR', e.message));
await p.goto(URL,{waitUntil:'domcontentloaded'});
const d = await (await p.request.get(`${URL}/api/flows`)).json();
const f = (d.flows||[])[0];
const target = `${URL}/projects/${f.project.id}/cad`;
await p.goto(target,{waitUntil:'domcontentloaded'});
await p.waitForTimeout(6000);
const urlTruoc = p.url();

// DẤU VẾT chứng minh KHÔNG tải lại / KHÔNG unmount workspace
await p.evaluate(()=>{ window.__kMark = 'K-'+Date.now(); window.__kCanvas = document.querySelector('canvas'); });
const truoc = await p.evaluate(()=>({mark:window.__kMark, canvas:!!window.__kCanvas, canvasConnected: window.__kCanvas?.isConnected}));
console.log('TRUOC KHOA', urlTruoc, JSON.stringify(truoc));
await p.screenshot({path:OUT+'K0-workspace-truoc-khoa.png'});

await p.keyboard.press('Meta+Shift+L');
await p.waitForTimeout(1200);
console.log('KHI KHOA url=', p.url(), 'mode=', await p.locator('[data-lockscreen-root]').getAttribute('data-lock-mode'));
console.log('   con o DOM:', JSON.stringify(await p.evaluate(()=>({mark:window.__kMark, canvasConnected: window.__kCanvas?.isConnected}))));
console.log('   co o email tren mat khoa?', await p.locator('[data-lockscreen-root] input[type=email]').count());
console.log('   co o mat khau tren mat khoa?', await p.locator('[data-lockscreen-root] input[type=password]').count());
await p.screenshot({path:OUT+'K2-lock-face.png'});

// Mở lại → lật sang mặt xác thực
await p.locator('[data-lockscreen-root] button', {hasText:'Mở lại'}).first().click();
await p.waitForTimeout(900);
console.log('SAU LAT mode=', await p.locator('[data-lockscreen-root]').getAttribute('data-lock-mode'));
await p.screenshot({path:OUT+'K2b-the-xac-thuc.png'});

// STUB /api/auth/login — KHÔNG dùng mật khẩu thật, chỉ chứng minh đường mở-lại→về-chỗ-cũ.
await p.route('**/api/auth/login', r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true})}));
await p.locator('#if-mk-mo-khoa').fill('kiem-thu-khong-phai-mat-khau-that');
await p.keyboard.press('Enter');
await p.waitForTimeout(1500);
const sau = await p.evaluate(()=>({mark:window.__kMark, canvasConnected: window.__kCanvas?.isConnected}));
console.log('SAU MO LAI url=', p.url(), 'khoa con?', await p.locator('[data-lockscreen-root]').count(), JSON.stringify(sau));
console.log('URL GIU NGUYEN?', p.url()===urlTruoc);
await p.screenshot({path:OUT+'K3-unlock-resume.png'});
await ctx.close();
