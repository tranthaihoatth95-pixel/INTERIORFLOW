/**
 * scripts/nghiem-thu-v6-doi-vat-lieu.cjs — NGHIỆM THU V6 TRÊN APP THẬT.
 *
 * Chuỗi phải đi trọn, không bỏ mắt xích nào:
 *   WHERE USED → JUMP TO USE → SELECT/DESELECT SCOPE → PREVIEW → EXPLICIT APPLY → SAVE/REOPEN
 *
 * Mọi thứ đi qua ĐƯỜNG NGƯỜI DÙNG: đăng ký bằng API đăng ký thật, dự án tạo bằng API tạo dự án
 * thật, bản vẽ tạo bằng nút "Tạo bản vẽ mới", hình vẽ bằng CHUỘT trên canvas, vật liệu gán bằng
 * kệ "Kho vật liệu · gán mã" của panel thật. `window.__cadStore` chỉ dùng để ĐỌC kết quả (nó là
 * cửa debug sẵn có, chỉ bật ngoài production) — không lượt ghi nào đi qua nó.
 *
 * CHẠY: node scripts/nghiem-thu-v6-doi-vat-lieu.cjs   (cần MỘT dev server, mặc định :3061)
 *   V6_BASE=http://localhost:3061  V6_OUT=<thư-mục-ảnh>
 *
 * ⚠️ Playwright của repo đòi build chromium 1234, máy sandbox có 1194 ⇒ `launch()` trần THẤT BẠI.
 * Phải trỏ `executablePath` như dưới. Và phải dùng HỒ SƠ BỀN trên đĩa: "đóng hẳn trình duyệt rồi
 * mở lại" chỉ có nghĩa khi IndexedDB/cookie sống qua lần đóng — context tạm bị xoá sạch lúc close,
 * lấy đó làm bằng chứng lưu-mở-lại là chứng minh khống.
 */
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = process.env.V6_BASE || 'http://localhost:3061';
const OUT = process.env.V6_OUT || '/tmp/v6/anh';
const HS = process.env.V6_PROFILE || '/tmp/v6/ho-so-chrome';
const CH = {
  executablePath: process.env.IF_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
};
fs.mkdirSync(OUT, { recursive: true });

let pass = 0, fail = 0;
const ok = (l, c, note = '') => {
  c ? (pass++, console.log(`  ĐẠT  - ${l}${note ? ` (${note})` : ''}`))
    : (fail++, console.log(`  ✗KO  - ${l}${note ? ` (${note})` : ''}`));
};
const doc = (p) => p.evaluate(() => window.__cadStore.getState().doc);
const st = (p) => p.evaluate(() => {
  const s = window.__cadStore.getState();
  return { selection: s.selection, status: s.status };
});

(async () => {
  fs.rmSync(HS, { recursive: true, force: true });
  const ctx = await chromium.launchPersistentContext(HS, { ...CH, viewport: { width: 1440, height: 900 } });
  const page = ctx.pages()[0] ?? await ctx.newPage();
  page.on('pageerror', (e) => console.log('  [pageerror]', String(e).slice(0, 200)));

  // ── TÀI KHOẢN + DỰ ÁN: đường API thật của app, không chèn thẳng vào DB ──
  const email = `v6-${Date.now()}@thu.local`;
  await page.goto(`${BASE}/login`);
  const reg = await page.evaluate(async ([e]) => {
    const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: e, name: 'V6 Thu', password: 'matkhau123' }) });
    return r.status;
  }, [email]);
  const proj = await page.evaluate(async () => {
    const r = await fetch('/api/flows', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'project', name: 'Thu V6 — đổi vật liệu' }) });
    return r.json().catch(() => null);
  });
  const pid = proj?.project?.id ?? proj?.id;
  console.log(`  đăng ký ${reg} · dự án ${pid}`);
  if (!pid) { console.log('  !! không lấy được id dự án'); await ctx.close(); process.exit(1); }

  // ── VÀO CHẶNG 2D ──
  await page.goto(`${BASE}/projects/${pid}/cad`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__cadStore, null, { timeout: 60000 });
  await page.waitForTimeout(2500);
  // Trạng thái rỗng THẬT: dự án mới chưa có bản vẽ ⇒ bấm đúng nút người dùng bấm.
  const nutTao = page.getByText('Tạo bản vẽ mới', { exact: true }).first();
  if (await nutTao.count()) { await nutTao.click(); await page.waitForTimeout(2500); }
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  ok('vào được chặng 2D, có canvas', !!(await page.$('canvas')));
  await page.screenshot({ path: `${OUT}/v6-00-vao-2d.png` });

  // ── VẼ 4 Ô: rect rồi hatch, bằng CHUỘT ──
  const R = [[300, 200, 450, 320], [500, 200, 650, 320], [300, 380, 450, 500], [500, 380, 650, 500]];
  for (const [x1, y1, x2, y2] of R) {
    await page.keyboard.press('Escape');
    await page.evaluate(() => window.__cadStore.getState().setTool('rect'));
    await page.mouse.click(x1, y1); await page.waitForTimeout(90);
    await page.mouse.click(x2, y2); await page.waitForTimeout(120);
  }
  for (const [x1, y1, x2, y2] of R) {
    await page.keyboard.press('Escape');
    await page.evaluate(() => window.__cadStore.getState().setTool('hatch'));
    await page.mouse.click((x1 + x2) / 2, (y1 + y2) / 2); await page.waitForTimeout(140);
  }
  let d = await doc(page);
  ok('vẽ + tô được 4 vùng bằng chuột', d.entities.filter((e) => e.type === 'hatch').length === 4,
     `${d.entities.filter((e) => e.type === 'hatch').length} hatch`);
  await page.screenshot({ path: `${OUT}/v6-01-bon-vung-to.png` });

  // ── PANEL VẬT LIỆU THẬT ──
  const panelMo = () => page.getByText('Kho vật liệu · gán mã').count().then((n) => n > 0);
  const moPanelVatLieu = async () => {
    // Nút toolbar là TOGGLE — bấm khi panel đang mở là đóng nó. Chỉ bấm khi thật sự đang đóng.
    if (await panelMo()) return;
    await page.getByRole('button', { name: /Vật liệu/ }).first().click();
    await page.waitForTimeout(600);
  };
  // Bấm ĐÚNG dòng của kệ kho: preset thị giác có tên gần giống ("Gỗ óc chó" ⊂ "Sàn gỗ óc chó"),
  // mà preset thì CỐ Ý không trao mã ⇒ khớp theo chuỗi trên cả trang là đo nhầm sang hành vi khác.
  const bamKho = async (ten) => {
    const r = await page.evaluate((t) => {
      const head = [...document.querySelectorAll('div')].find((x) => x.textContent === 'Kho vật liệu · gán mã');
      const b = [...(head?.parentElement?.querySelectorAll('button') ?? [])]
        .find((x) => (x.innerText || '').split('\n')[0].trim() === t);
      if (!b) return null;
      b.scrollIntoView({ block: 'center' });
      const q = b.getBoundingClientRect();
      return { x: q.x + q.width / 2, y: q.y + q.height / 2 };
    }, ten);
    if (!r) throw new Error('không thấy dòng kho: ' + ten);
    await page.mouse.click(r.x, r.y);
    await page.waitForTimeout(500);
  };

  // ── NỀN: gán MỘT vật liệu cho cả 4 ô ──
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.__cadStore.getState().setTool('select'));
  await page.mouse.move(260, 160); await page.mouse.down();
  await page.mouse.move(700, 540, { steps: 12 }); await page.mouse.up();
  await page.waitForTimeout(200);
  ok('marquee chọn được cả 4 vùng tô', (await st(page)).selection.length >= 4);

  await moPanelVatLieu();
  // Kho nạp bất đồng bộ (`loadMaterialPicks`) — chờ nó có dòng rồi mới đọc, đừng đọc lúc còn "Đang đọc kho…".
  await page.waitForFunction(() => {
    const h = [...document.querySelectorAll('div')].find((x) => x.textContent === 'Kho vật liệu · gán mã');
    return (h?.parentElement?.querySelectorAll('button').length ?? 0) >= 2;
  }, null, { timeout: 20000 }).catch(() => {});
  const tenKho = await page.evaluate(() => {
    const head = [...document.querySelectorAll('div')].find((x) => x.textContent === 'Kho vật liệu · gán mã');
    return [...(head?.parentElement?.querySelectorAll('button') ?? [])].map((b) => (b.innerText || '').split('\n')[0].trim());
  });
  ok('kho có ít nhất 2 món để đổi qua lại', tenKho.length >= 2, `${tenKho.length} món`);
  const [VL_A, VL_B] = tenKho;

  await bamKho(VL_A);
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /Áp cho \d+ chỗ|^Áp dụng$/ }).first().click();
  await page.waitForTimeout(600);
  d = await doc(page);
  const coMa = d.entities.filter((e) => e.type === 'hatch' && e.specId);
  const specA = coMa[0]?.specId;
  ok(`nền: gán "${VL_A}" cho cả 4 vùng, cùng một mã`,
     coMa.length === 4 && new Set(coMa.map((e) => e.specId)).size === 1, `${coMa.length}/4 · ${String(specA).slice(0, 12)}`);
  await page.screenshot({ path: `${OUT}/v6-02-bon-vung-cung-vat-lieu.png` });

  // ══════════ CHUỖI V6 ══════════
  console.log('\n── CHUỖI V6 ──');
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.__cadStore.getState().setTool('select'));
  await page.mouse.click(375, 260); await page.waitForTimeout(250);
  ok('chọn đúng MỘT vùng tô trước khi mở bảng', (await st(page)).selection.length === 1);

  await moPanelVatLieu();
  await bamKho(VL_B);
  await page.waitForTimeout(500);
  const hop = page.locator('[role="dialog"][aria-label*="Ảnh hưởng"]').first();
  const dong = hop.locator('li');

  // ① WHERE USED
  ok('WHERE USED — liệt kê ĐỦ 4 chỗ đang dùng, không chỉ vùng đang chọn', (await dong.count()) === 4, `${await dong.count()} dòng`);
  ok('mặc định tick đúng 1 (phạm vi hẹp = vùng đang chọn)', /chọn 1\/4/.test(await hop.innerText()));
  await page.screenshot({ path: `${OUT}/v6-03-where-used-4-cho.png` });

  // ② JUMP TO USE — đẩy mục tiêu RA NGOÀI MÀN trước, nhảy tới thứ đang thấy sẵn thì không chứng minh gì
  const toaDoMan = async (id) => page.evaluate((i) => {
    const s = window.__cadStore.getState(); const e = s.doc.entities.find((x) => x.id === i);
    if (!e || !e.points) return null;
    const v = s.viewport;
    const xs = e.points.map((p) => p.x), ys = e.points.map((p) => p.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    return { x: cx * v.scale + v.panX, y: -cy * v.scale + v.panY, scale: v.scale };
  }, id);
  const man = await page.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { w: r.width, h: r.height }; });
  const trongMan = (t) => !!t && t.x >= 0 && t.x <= man.w + 108 && t.y >= 0 && t.y <= man.h + 122;
  const idDich = await dong.nth(2).getAttribute('data-owner');
  await page.evaluate(() => {
    const s = window.__cadStore.getState();
    s.setViewport({ scale: s.viewport.scale * 9, panX: -4000, panY: -4000 });
  });
  await page.waitForTimeout(400);
  const truocN = await toaDoMan(idDich);
  ok('bàn thử hợp lệ — mục tiêu ĐANG NGOÀI màn trước khi nhảy', !trongMan(truocN),
     `x=${Math.round(truocN?.x)} y=${Math.round(truocN?.y)} · màn ${Math.round(man.w)}×${Math.round(man.h)}`);
  await page.screenshot({ path: `${OUT}/v6-04-truoc-khi-nhay-ngoai-man.png` });

  const camTruoc = JSON.stringify((await st(page)).selection);
  await dong.nth(2).getByRole('button', { name: /Nhảy tới/ }).click();
  await page.waitForTimeout(900);
  const sauN = await toaDoMan(idDich);
  const sJump = await st(page);
  ok('JUMP — mục tiêu vào TRONG màn (đưa vào tầm nhìn, không chỉ chọn)', trongMan(sauN), `x=${Math.round(sauN?.x)} y=${Math.round(sauN?.y)}`);
  ok('JUMP — khung nhìn thật sự đổi', Math.abs(sauN.scale - truocN.scale) > 1e-9, `scale ${truocN.scale.toExponential(2)} → ${sauN.scale.toExponential(2)}`);
  ok('JUMP — đúng đối tượng ĐÓ được chọn', sJump.selection.includes(idDich), `${camTruoc} → ${JSON.stringify(sJump.selection)}`);
  ok('JUMP — dòng trạng thái nói đã tới đâu', /Đã tới/.test(sJump.status || ''), sJump.status);
  ok('JUMP — bảng KHÔNG đóng, danh sách ĐÓNG BĂNG (không trượt theo cú nhảy)', (await dong.count()) === 4);
  await page.screenshot({ path: `${OUT}/v6-05-jump-to-use.png` });

  // ③ SCOPE + ④ PREVIEW
  await dong.nth(1).locator('input[type=checkbox]').check();
  await dong.nth(2).locator('input[type=checkbox]').check();
  await page.waitForTimeout(200);
  let t = await hop.innerText();
  ok('SCOPE — tick được TỪNG chỗ, không còn nhị phân', /chọn 3\/4/.test(t), (t.match(/chọn \d\/\d/) || [''])[0]);
  ok('PREVIEW — con số đi theo phạm vi đang tick (3, không phải 4)', /3 tham chiếu/.test(t) && !/4 tham chiếu/.test(t));
  ok('PREVIEW — nút áp nói thẳng con số sắp đụng', /Áp cho 3 chỗ/.test(t));
  await page.screenshot({ path: `${OUT}/v6-06-scope-3-tren-4.png` });
  await dong.nth(2).locator('input[type=checkbox]').uncheck();
  await page.waitForTimeout(150);
  ok('SCOPE — BỎ tick cũng đi ngược đúng (3 → 2)', /chọn 2\/4/.test(await hop.innerText()));
  await dong.nth(2).locator('input[type=checkbox]').check();
  await page.waitForTimeout(150);

  // ⑤ EXPLICIT APPLY — cửa quyết định của con người
  ok('trước khi bấm Áp — CHƯA có gì bị ghi',
     (await doc(page)).entities.filter((e) => e.type === 'hatch').every((e) => e.specId === specA), '4/4 vẫn mã cũ');
  await hop.getByRole('button', { name: /Áp cho 3 chỗ/ }).click();
  await page.waitForTimeout(700);
  let h = (await doc(page)).entities.filter((e) => e.type === 'hatch');
  const doiSang = h.filter((e) => e.specId && e.specId !== specA);
  const giuNguyen = h.filter((e) => e.specId === specA);
  const specB = doiSang[0]?.specId;
  ok('APPLY — đổi ĐÚNG 3 chỗ', doiSang.length === 3, `${doiSang.length} đổi`);
  ok('APPLY — chỗ bỏ tick KHÔNG bị đụng', giuNguyen.length === 1);
  ok('APPLY — báo đúng con số THẬT SỰ đã đổi', /3 chỗ/.test((await st(page)).status || ''), (await st(page)).status);
  await page.screenshot({ path: `${OUT}/v6-07-sau-khi-ap.png` });

  // ⑤b LỜI HỨA "⌘Z" IN TRÊN CHÍNH HỘP THOẠI — kiểm bằng phím thật, không tin chữ trên nút
  await page.mouse.click(900, 650);
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(700);
  h = (await doc(page)).entities.filter((e) => e.type === 'hatch');
  ok('UNDO — MỘT lần ⌘Z trả lại nguyên trạng (đúng lời hứa in trên hộp thoại)',
     h.every((e) => e.specId === specA), `${h.filter((e) => e.specId === specA).length}/4 về mã cũ`);
  await page.keyboard.press('Control+Shift+z');
  await page.waitForTimeout(700);
  h = (await doc(page)).entities.filter((e) => e.type === 'hatch');
  ok('REDO — làm lại được, về đúng 3 đổi / 1 giữ', h.filter((e) => e.specId === specB).length === 3,
     `${h.filter((e) => e.specId === specB).length} chỗ mang mã mới`);

  // ⑥ SAVE → ĐÓNG HẲN → REOPEN
  const mong = { doi: doiSang.map((e) => e.id).sort(), giu: giuNguyen.map((e) => e.id).sort() };
  await page.waitForTimeout(2500);
  await ctx.close();
  console.log('\n  ── ĐÃ ĐÓNG HẲN TRÌNH DUYỆT ──');
  await new Promise((r) => setTimeout(r, 1200));

  const ctx2 = await chromium.launchPersistentContext(HS, { ...CH, viewport: { width: 1440, height: 900 } });
  const p2 = ctx2.pages()[0] ?? await ctx2.newPage();
  await p2.goto(`${BASE}/projects/${pid}/cad`, { waitUntil: 'domcontentloaded' });
  await p2.waitForFunction(() => !!window.__cadStore, null, { timeout: 60000 });
  await p2.waitForTimeout(4000);
  const h2 = (await doc(p2)).entities.filter((e) => e.type === 'hatch');
  const doi2 = h2.filter((e) => mong.doi.includes(e.id));
  const giu2 = h2.filter((e) => mong.giu.includes(e.id));
  ok('REOPEN — mở lại còn đủ 4 vùng tô', h2.length === 4, `${h2.length} hatch`);
  ok('REOPEN — 3 chỗ đã đổi vẫn mang vật liệu MỚI',
     doi2.length === 3 && doi2.every((e) => e.specId === specB), String(specB).slice(0, 14));
  ok('REOPEN — chỗ cố ý KHÔNG đổi vẫn mang vật liệu CŨ',
     giu2.length === 1 && giu2[0].specId === specA, String(specA).slice(0, 14));
  ok('REOPEN — matId (thứ 3D tra ra vân) cũng sống qua vòng lưu',
     doi2.every((e) => !!e.matId) && new Set(doi2.map((e) => e.matId)).size === 1, `matId=${String(doi2[0]?.matId).slice(0, 14)}`);
  ok('REOPEN — hai nhóm mang HAI matId khác nhau, không lẫn', giu2[0]?.matId !== doi2[0]?.matId,
     `${String(giu2[0]?.matId).slice(0, 10)} ≠ ${String(doi2[0]?.matId).slice(0, 10)}`);
  await p2.screenshot({ path: `${OUT}/v6-08-mo-lai-sau-khi-dong.png` });
  await ctx2.close();

  console.log(`\n== ${pass} đạt · ${fail} không ==`);
  process.exit(fail ? 1 : 0);
})();
