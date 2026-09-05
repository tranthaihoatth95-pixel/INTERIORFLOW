/* CHỨNG MINH "MÁY KHÔNG NÓI DỐI VỀ UV" — hướng · tỉ lệ vật lý · sống sót qua tải lại.
 *
 * ⛔ VÌ SAO KHÔNG DÙNG ẢNH GỖ: ảnh gỗ hỏng kiểu gì cũng "trông vẫn giống gỗ" — lật ngang, xoay
 * 90°, sai tỉ lệ 3 lần, mắt vẫn đọc ra gỗ. Nó là ảnh dò TỒI. Ảnh chẩn đoán thì mọi sai lệch đều
 * thành một câu đọc được: chữ `IF` nằm ngửa · góc `1` không ở trên-trái · vạch `100 mm` đo ra
 * không phải 100 mm.
 *
 * Quy ước ảnh: `public/textures/chan-doan/chan-doan-512.png`, **1 chu kỳ = 400×400 mm**.
 *
 * ⛔ KHÔNG SỬA MÃ SẢN PHẨM để chạy phép thử này. Ảnh đi vào hệ qua ĐÚNG cửa người dùng dùng:
 * tầng STUDIO của kho PBR (`if.materials.pbr.v1`) đè lên tầng hạt giống — cùng đường mà cửa sổ
 * chất liệu render ghi. Cửa nào người dùng không đi được thì phép thử đó không chứng minh gì.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = process.env.OUT || '/tmp/chan-doan-uv';
const CONG = process.env.CONG || '3277';
const BASE = `http://localhost:${CONG}`;
/** matId gỗ sồi hạt giống — gõ cứng ở `lib/materials/hat-giong.ts`, vĩnh viễn. */
const MAT_ID = 'f77b3a78-f2e3-4b19-b70f-20643c8a6243';
const CHU_KY_MM = 400;
fs.mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(({ matId, chuKy }) => {
  try {
    localStorage.setItem('if_intro_seen_v1', '1');
    localStorage.setItem('interiorflow.theme', 'dark');
    localStorage.setItem('if.materials.pbr.v1', JSON.stringify({
      [matId]: {
        baseColor: '#ffffff', roughness: 0.6, metallic: 0, typeId: 'go',
        baseColorMapUrl: '/textures/chan-doan/chan-doan-512.png',
        uvScaleMm: { w: chuKy, h: chuKy },
      },
    }));
  } catch {}
}, { matId: MAT_ID, chuKy: CHU_KY_MM });

const p = await ctx.newPage();
const loi = [];
p.on('pageerror', (e) => loi.push(String(e.message).slice(0, 120)));

async function doiYen() {
  let truoc = -1, yen = 0;
  for (let k = 0; k < 18; k++) {
    const s = await p.evaluate(() => ({
      chu: document.body.innerText.trim().length,
      quay: !!document.querySelector('[class*=animate-spin],[class*=spinner],[aria-busy=true]'),
    }));
    if (s.chu > 60 && s.chu === truoc && !s.quay) { if (++yen >= 2) break; } else yen = 0;
    truoc = s.chu;
    await p.waitForTimeout(1200);
  }
  await p.waitForTimeout(1000);
}

/** Mở panel ba mặt của hàng đầu rồi sang nấc soi khổ thật; đo dải bằng SỐ. */
async function moVaDo(nhan) {
  await p.goto(BASE + '/materials', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await doiYen();
  await p.locator('tbody tr').first().locator('button').filter({ hasText: /2D|3D|Giá/ }).first().click().catch(() => {});
  await p.waitForTimeout(1800);
  await p.locator('[data-nac="inspect"]').first().click().catch(() => {});
  await p.waitForTimeout(2200);
  const d = await p.evaluate((chuKy) => {
    const el = document.querySelector('[data-nen-van]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const [wTxt, hTxt] = (cs.backgroundSize || '').split(' ');
    const tileW = parseFloat(wTxt), tileH = parseFloat(hTxt);
    return {
      anh: cs.backgroundImage.replace(/^url\(["']?|["']?\)$/g, '').split('/').slice(-1)[0],
      rongDai: Math.round(r.width * 10) / 10,
      coNen: cs.backgroundSize,
      lap: cs.backgroundRepeat,
      /* TỈ LỆ VẬT LÝ: một chu kỳ ảnh phủ `chuKy` mm ⇒ px trên mỗi mm = tileW / chuKy. */
      pxTrenMm: Math.round((tileW / chuKy) * 1000) / 1000,
      /* Ô cờ 4×4 nên một chu kỳ phải VUÔNG — lệch là UV bị bóp. */
      vuong: Math.abs(tileW - tileH) < 1.5,
      soTamNgang: Math.round((r.width / tileW) * 100) / 100,
    };
  }, CHU_KY_MM);
  await p.screenshot({ path: `${OUT}/${nhan}.png` });
  console.log(nhan, JSON.stringify(d));
  return d;
}

const lan1 = await moVaDo('01-lan-dau');
/* THOÁT HẲN rồi mở lại: tab mới, không giữ lại state trong bộ nhớ — chỉ còn thứ đã LƯU. */
await p.goto('about:blank');
await p.waitForTimeout(500);
const lan2 = await moVaDo('02-sau-khi-mo-lai');

const giong = JSON.stringify(lan1) === JSON.stringify(lan2);
console.log(`\nSỐNG SÓT QUA TẢI LẠI: ${giong ? 'Y HỆT' : '🔴 LỆCH'}`);
console.log(`lỗi trang: ${loi.length}`);
fs.writeFileSync(`${OUT}/do.json`, JSON.stringify({ chuKyMm: CHU_KY_MM, lan1, lan2, giong, loi }, null, 2));
await b.close();
