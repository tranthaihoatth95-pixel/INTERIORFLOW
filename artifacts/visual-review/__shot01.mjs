import { chromium } from 'playwright';
import { homedir } from 'os'; import { join } from 'path';
const URL='http://localhost:3000';
const ctx = await chromium.launchPersistentContext(join(homedir(),'.if-phien-chup-man'),{headless:true,viewport:{width:1440,height:900},locale:'vi-VN'});
const p = ctx.pages()[0] ?? await ctx.newPage();
// tìm dự án có bản vẽ RỖNG thật, không đoán
await p.goto(URL,{waitUntil:'domcontentloaded'});
const r = await p.request.get(`${URL}/api/flows`);
const d = await r.json();
console.log('flows:', (d.flows||[]).map(f=>`${f.id}|${f.name}|proj=${f.project?.id??'-'}`).slice(0,12).join('\n       '));
await ctx.close();
