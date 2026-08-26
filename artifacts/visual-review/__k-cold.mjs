import { chromium } from 'playwright';
const b = await chromium.launch({headless:true});
const ctx = await b.newContext({viewport:{width:1440,height:900},locale:'vi-VN'}); // KHÔNG dùng hồ sơ đã đăng nhập → đúng đường "mở app lạnh"
const p = await ctx.newPage();
await p.goto('http://localhost:3000',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(5000);
console.log('cold url=', p.url());
await p.screenshot({path:'artifacts/visual-review/K1-cold-ambient.png'});
await b.close();
