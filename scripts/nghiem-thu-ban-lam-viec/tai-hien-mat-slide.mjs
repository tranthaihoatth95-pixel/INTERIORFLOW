/**
 * scripts/nghiem-thu-ban-lam-viec/tai-hien-mat-slide.mjs
 * TÁI HIỆN TẤT ĐỊNH hai triệu chứng "mất slide" của cầu 2D → Trình chiếu.
 *
 *   ① ảnh bản vẽ vào deck KHÔNG CHẮC CHẮN (trượt 2/4 lượt: soSlide:1 · anhThat:0)
 *   ② `reload()` NGAY sau khi chèn ⇒ mất slide, mất luôn qua đóng-mở
 *
 * Vì sao script này tồn tại thay vì đo bằng `luong-trinh-chieu.mjs`: vòng nghề đầy đủ tốn ~3 phút
 * một lượt và trộn 10 mắt xích, không tách được NGUYÊN NHÂN. Bản này chỉ chạy ĐÚNG khúc bàn giao,
 * và quan trọng nhất là **ghi TRỤC THỜI GIAN** (DOM ↔ IndexedDB, mỗi 250 ms) — chỉ trục thời gian
 * mới phân biệt được "chèn rồi bị đè" với "chưa kịp ghi thì reload".
 *
 * Chạy:  IF_URL=http://localhost:3021 node scripts/nghiem-thu-ban-lam-viec/tai-hien-mat-slide.mjs
 * BẤT BIẾN NÓ CANH (thứ đo được mỗi lượt, không phụ thuộc may rủi của `beforeunload`):
 *   **nguồn bàn giao KHÔNG được biến mất trước khi deck chứa nó đã ghi bền.**
 *   Đo TRƯỚC khi sửa: buông tay ms 7987 · ghi bền ms 9273 ⇒ VI PHẠM (cửa sổ 1,3 s).
 *   Đo SAU khi sửa:  buông tay và ghi bền rơi cùng một mẫu ⇒ không vi phạm.
 *
 * Biến:  CA=cho|reload   (cho = để yên quan sát · reload = nạp lại NGAY khi slide vừa hiện lên màn)
 *        RELOAD_MS=7400  (ca thứ ba: nạp lại đúng MỐC ĐỒNG HỒ sau lúc bấm — dùng để QUÉT vùng
 *                         nguy hiểm giữa "handoff đã mất" và "deck đã ghi bền")
 *        LUOT=5          (số lượt lặp — nghiệm thu đòi 5/5)
 */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { rmSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const GOC = process.env.IF_URL ?? 'http://localhost:3021';
const CA = process.env.CA ?? 'cho';
const RELOAD_MS = process.env.RELOAD_MS ? Number(process.env.RELOAD_MS) : 0;
const LUOT = Number(process.env.LUOT ?? 1);
const TK = { identifier: 'kiem@localhost.test', password: 'matkhau123' };
const THAM_SO = {
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
  viewport: { width: 1600, height: 900 },
};
const RA = 'docs/ship/anh';
mkdirSync(RA, { recursive: true });
/** Giữ TRỌN nhật ký ra tệp: lượt trượt chỉ giải thích được bằng TRỤC THỜI GIAN đầy đủ, mà trục đó
 *  quá dài để đọc trên màn. Không có nó thì mỗi lần trượt lại phải chạy lại 12 phút để nhìn. */
const nhatKy = [];
const ghi = (o) => { nhatKy.push(o); console.log(JSON.stringify(o)); };

/** Deck THẬT trong IndexedDB (cùng kho `sheets-persist` app dùng), route `/present-editor`. */
const deckIdb = (page) => page.evaluate(() => new Promise((res) => {
  let xong = false;
  const tra = (v) => { if (!xong) { xong = true; res(v); } };
  setTimeout(() => tra({ loi: 'idb-treo' }), 2000);
  try {
    const req = indexedDB.open('interiorflow-sheets', 1);
    req.onerror = () => tra(null);
    req.onsuccess = () => {
      const db = req.result;
      // ĐÓNG kết nối sau mỗi lượt đọc. Vòng lấy mẫu mở IDB 4 lần/giây suốt 16 s; để hở là tích
      // hàng chục kết nối sống trong trang đang đo — bộ đo không được là một biến của phép đo.
      const dong = () => { try { db.close(); } catch { /* đã đóng */ } };
      const st = db.transaction('sheets', 'readonly').objectStore('sheets');
      const all = st.getAll(); const keys = st.getAllKeys();
      all.onsuccess = () => keys.onsuccess = () => {
        const i = keys.result.findIndex((k) => String(k).includes('/present-editor'));
        if (i < 0) { dong(); return tra({ khoa: null }); }
        const sheets = all.result[i]?.sheets ?? [];
        const els = [];
        for (const sh of sheets) for (const sl of (sh.deck?.slides ?? [])) for (const e of (sl.elements ?? [])) els.push(e);
        tra({
          khoa: String(keys.result[i]),
          soSlide: sheets.reduce((n, sh) => n + (sh.deck?.slides?.length ?? 0), 0),
          anhThat: els.filter((e) => e.kind === 'image' && typeof e.src === 'string' && e.src.startsWith('data:image')).length,
          // Dấu vết phân biệt "bản ghi bị ĐÈ bằng deck trắng" với "chưa kịp ghi": deck trắng mới
          // dựng luôn là ĐÚNG 1 tờ / 1 slide / id `presheet-0`, và mang `slideId` ngẫu nhiên.
          hoSo: sheets.map((sh) => `${sh.id}:${sh.deck?.slides?.length ?? 0}`).join(','),
          idSlide: sheets.flatMap((sh) => (sh.deck?.slides ?? []).map((sl) => String(sl.id))).join(','),
        });
        dong();
      };
    };
  } catch { tra(null); }
}));

/** Deck đang SỐNG trên màn — dải slide dưới cùng. Phân biệt "chưa chèn" với "chèn rồi mất". */
const deckDom = (page) => page.evaluate(() => {
  // SlideStrip.tsx:85 đặt `title="Slide N"` cho mỗi ô — móc DOM ỔN ĐỊNH duy nhất của dải slide.
  const strip = document.querySelectorAll('[title^="Slide "]');
  return { oSlideDom: strip.length, url: location.pathname };
});

/** Còn hàng trong sessionStorage không — phân biệt "chưa tiêu thụ" với "tiêu thụ rồi mất đích". */
const conHang = (page) => page.evaluate(() => {
  try { const v = sessionStorage.getItem('interiorflow.cadPresentHandoff'); return v ? v.length : 0; } catch { return -1; }
});

async function motLuot(n) {
  const HO_SO = join(tmpdir(), `if-tai-hien-${n}`);
  rmSync(HO_SO, { recursive: true, force: true });
  const ctx = await chromium.launchPersistentContext(HO_SO, THAM_SO);
  const p0 = await ctx.newPage();
  const r = await p0.request.post(`${GOC}/api/auth/login`, { data: TK });
  if (!r.ok()) throw new Error('login ' + r.status());
  const me = await (await p0.request.get(`${GOC}/api/auth/me`)).json();
  await p0.goto(GOC);
  await p0.evaluate((id) => { try { localStorage.setItem(`interiorflow.tourDone.${id}`, '1'); } catch {} }, me?.user?.id ?? '');
  const req = p0.request;
  // 🧱 §11.7 — fixture TỔNG HỢP · ẨN DANH · TRUNG TÍNH.
  const pr = await req.post(`${GOC}/api/flows`, { data: { type: 'project', name: 'Van phong nho — fixture trung tinh' } });
  const PID = (await pr.json()).project.id;
  await req.post(`${GOC}/api/flows`, { data: { projectId: PID, name: 'Mat bang tang tret' } });
  await p0.close();

  const page = await ctx.newPage();
  const loi = [];
  page.on('pageerror', (e) => loi.push('PAGEERROR ' + String(e).slice(0, 160)));

  // ── B1 · deck có sẵn 1 slide (đúng trạng thái người dùng thật: đã mở hồ sơ trình bày) ──
  await page.goto(`${GOC}/projects/${PID}/present`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  /**
   * ⚠️ B1 PHẢI CHẮC CHẮN, không được "bấm rồi tin". Deck rỗng ⇒ `PresentSheets` hiện màn chọn
   * loại hồ sơ ⇒ `PresentEditor` KHÔNG mount ⇒ cầu 2D→Trình chiếu không có chỗ hạ cánh. Lượt đo
   * nào rơi vào đó sẽ báo "mất slide" trong khi thứ hỏng là BỘ ĐO. Chờ tới khi IndexedDB thật sự
   * có deck; không có thì DỪNG và nói rõ là lỗi fixture.
   */
  const batDau = page.getByRole('button', { name: /Bắt đầu trình bày/ });
  await batDau.first().waitFor({ timeout: 45000 }).catch(() => {});
  if (await batDau.count()) { await batDau.first().click({ force: true }); }
  let truoc = null;
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(1000);
    truoc = await deckIdb(page).catch(() => null);
    if (truoc && (truoc.soSlide ?? 0) >= 1) break;
  }
  ghi({ luot: n, moc: 'B1 deck nền', ...(truoc ?? {}) });
  if (!truoc || (truoc.soSlide ?? 0) < 1) {
    ghi({ luot: n, KET: 'HỎNG FIXTURE', vi: 'không dựng nổi deck nền — chưa đo được gì về cầu 2D→Trình chiếu' });
    await ctx.close();
    return null;
  }

  // ── B2 · 2D có bản vẽ thật ──
  await page.goto(`${GOC}/projects/${PID}/cad`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  const m = page.getByRole('button', { name: /^Bắt đầu$/ });
  if (await m.count()) { await m.first().click({ force: true }); await page.waitForTimeout(800); }
  const muc = page.getByRole('menuitem', { name: /Mẫu dự án/ });
  if (await muc.count()) { await muc.first().click({ force: true }); await page.waitForTimeout(1800); }
  const vp = page.getByRole('button', { name: /^Văn phòng/ });
  if (await vp.count()) { await vp.first().click({ force: true }); await page.waitForTimeout(2500); }

  // ── B3 · BẤM "Đưa ảnh bản vẽ sang Trình chiếu" rồi bám TRỤC THỜI GIAN ──
  const t0 = Date.now();
  const mx = page.getByRole('button', { name: /^Xuất$/ });
  if (await mx.count()) { await mx.first().click({ force: true }); await page.waitForTimeout(700); }
  const mi = page.getByRole('menuitem', { name: /Đưa ảnh bản vẽ sang Trình chiếu/ });
  const daBam = await mi.count() > 0;
  if (daBam) await mi.first().click({ force: true });

  const truc = [];
  let daReload = false;
  for (let i = 0; i < 64; i++) {          // 16 giây, mỗi 250 ms
    await page.waitForTimeout(250);
    let d = null, dom = null, hang = null;
    /**
     * ⚠️ THỨ TỰ ĐỌC LÀ MỘT PHẦN CỦA PHÉP ĐO, KHÔNG PHẢI CHI TIẾT VẶT — đọc `hang` TRƯỚC `idb`.
     *
     * Ba lời gọi này không nguyên tử. Bản đầu đọc IDB trước rồi mới đọc sessionStorage; nếu lượt
     * ghi rơi vào GIỮA hai lời gọi thì mẫu đó có `anhThat` cũ (0) đi kèm `hang` mới (0) ⇒ máy báo
     * VI PHẠM trong khi app làm đúng (đo được: lượt 4 báo lệch đúng 260 ms = tròn một nhịp lấy
     * mẫu, mà kết cục vẫn 2 slide / 1 ảnh).
     *
     * Đọc `hang` trước thì báo oan là BẤT KHẢ: điều app bảo đảm là "xoá nguồn CHỈ SAU khi ghi
     * xong", nên nếu `hang(t₁) = 0` thì bản ghi đã bền từ lúc ≤ t₁, và lần đọc IDB ở t₂ > t₁ chắc
     * chắn thấy nó. Chiều ngược lại — bỏ sót một vi phạm THẬT — chỉ xảy ra nếu cửa sổ nguy hiểm
     * ngắn hơn khoảng lệch giữa hai lời gọi (vài chục ms); cửa sổ thật đo được là 1,3 s.
     */
    try { hang = await conHang(page); d = await deckIdb(page); dom = await deckDom(page); } catch { /* điều hướng giữa chừng */ }
    if (d && dom) truc.push({ ms: Date.now() - t0, ...dom, ...d, hang });
    if (RELOAD_MS && !daReload && Date.now() - t0 >= RELOAD_MS) {
      daReload = true;
      truc.push({ ms: Date.now() - t0, moc: `↻ RELOAD @${RELOAD_MS}ms` });
      await page.reload({ waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(4000);
    }
    /* CA reload: nạp lại NGAY khi slide mới vừa HIỆN TRÊN MÀN — đúng động tác người dùng thật
       (thấy tờ bản vẽ xuất hiện rồi bấm F5). Không mò theo đồng hồ. */
    if (CA === 'reload' && !daReload && dom && dom.oSlideDom >= 2) {
      daReload = true;
      truc.push({ ms: Date.now() - t0, moc: '↻ RELOAD NGAY khi slide vừa hiện' });
      await page.reload({ waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(4000);
    }
  }

  /**
   * CÂU HỎI NGHIỆM THU LÀ CÂU HỎI CỦA NGƯỜI DÙNG: "tờ bản vẽ tôi vừa gửi có nằm trong hồ sơ
   * trình bày không?" ⇒ luôn kết thúc bằng cách MỞ ĐÚNG chặng Trình chiếu rồi mới đo. Bộ đo cũ
   * đo ngay tại chỗ trang đang đứng — nạp lại trang cắt ngang lúc điều hướng là nó đo nhầm màn
   * (đã trượt đúng kiểu đó ở lượt quét RELOAD_MS=7500, url kết thúc ở `/cad`).
   */
  await page.goto(`${GOC}/projects/${PID}/present`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(8000);
  const cuoi = await deckIdb(page);
  const domCuoi = await deckDom(page);

  /**
   * BẤT BIẾN — cái đo được mỗi lượt, không phụ thuộc may rủi: **nguồn bàn giao KHÔNG được biến
   * mất trước khi deck chứa nó đã ghi bền.** `hang` 1→0 trước khi IndexedDB có ảnh = có một cửa
   * sổ mà tờ bản vẽ không tồn tại ở đâu bền cả.
   */
  const mau = truc.filter((t) => t.hang !== null && t.hang !== undefined);
  const tBuongTay = mau.find((t) => t.hang === 0)?.ms ?? null;
  const tGhiBen = truc.find((t) => (t.anhThat ?? 0) >= 1)?.ms ?? null;
  const viPham = tBuongTay !== null && (tGhiBen === null || tBuongTay < tGhiBen);

  ghi({ luot: n, moc: 'B3 trục thời gian', daBam, truc });
  ghi({ luot: n, moc: 'B4 bất biến', tBuongTay, tGhiBen, viPhamBatBien: viPham });
  ghi({ luot: n, moc: 'B5 chốt', ...cuoi, ...domCuoi, loi: loi.slice(0, 4) });
  const dat = !!cuoi && cuoi.anhThat >= 1 && cuoi.soSlide >= 2 && !viPham;
  ghi({ luot: n, KET: dat ? 'ĐẠT' : 'KHÔNG ĐẠT', ca: CA, reloadMs: RELOAD_MS || null });
  await ctx.close();
  return dat;
}

let dat = 0, hong = 0;
for (let i = 1; i <= LUOT; i++) {
  const r = await motLuot(i);
  if (r === null) hong++; else if (r) dat++;
}
ghi({ TONG: `${dat}/${LUOT - hong}`, hongFixture: hong, ca: CA, reloadMs: RELOAD_MS || null });
writeFileSync(`${RA}/tc-mat-slide-${CA}${RELOAD_MS ? `-${RELOAD_MS}` : ''}.json`, JSON.stringify(nhatKy, null, 1));
process.exit(hong === 0 && dat === LUOT ? 0 : 1);
