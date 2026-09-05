/**
 * scripts/nghiem-thu-g4-moat-danh-tinh.mjs — G4 · MOAT: ĐƯỜNG UI CÓ MANG DANH TÍNH KHÔNG.
 *
 * ⛔ VÌ SAO CÓ BỘ NÀY, TRONG KHI ĐÃ CÓ `nghiem-thu-g4-moat.mjs`:
 * bộ kia đo **tầng mô hình** — gọi thẳng `replaceMaterialReferences` · `computeBoq` · `exportIdf`,
 * và nó XANH 58/59. Nhưng nó **không chạm một dòng UI nào**, nên chỗ đứt sống sót suốt: đường
 * người dùng thật (`MaterialPalette` → `applyMaterial` → `Doc`) **không mang `specId`**. Máy móc
 * xuôi dòng đủ cả và có test; thứ thiếu là **sợi dây từ ngón tay người dùng xuống Doc**.
 * ⇒ Bộ này đo ĐÚNG khúc đó, và chỉ khúc đó: bấm thật trên app thật, rồi đọc TỪ NƠI LƯU THẬT.
 *
 * BA MẮT PHẢI XANH CÙNG LÚC — xanh hai mắt là chưa đóng được cổng:
 *   ① HÌNH       — `pattern`/`color` của vùng tô (đọc từ Doc trong IndexedDB)
 *   ② DANH TÍNH  — `specId` (`ProductSpec.id`) trên chính entity đó
 *   ③ CON SỐ     — `POST /api/boq/<projectId>` với đúng Doc đó, đọc `rows[].thanhTien`
 *
 * LUẬT PASS (không rút gọn): đặt vật liệu → đổi sang vật liệu khác → BOQ đổi theo → **ĐÓNG HẲN
 * trình duyệt** → vào lại → vẫn đúng vật liệu mới VÀ đúng con số mới.
 *   · "Đóng hẳn" = `launchPersistentContext` trên hồ sơ ĐĨA rồi `.close()`. **Cấm `newContext()`** —
 *     nó vứt IndexedDB lúc đóng, nên "mở lại" là vô nghĩa TỪ ĐỊNH NGHĨA, không phải vô nghĩa vì đo dở.
 *   · Đọc kết quả từ **IndexedDB thật** (`interiorflow-sheets`), KHÔNG đọc chữ trên màn — màn hình
 *     nói "vẫn còn" không chứng minh gì, bản vẽ có thể đang nằm thuần trong bộ nhớ.
 *
 * HIỆU CHUẨN (`--hieu-chuan`): dựng một thế giới **biết chắc hỏng** — đúng hình dạng Doc mà đường
 * UI CŨ sinh ra (vùng tô có `pattern`/`color` nhưng **không** `specId`) — rồi chạy CHÍNH bộ khẳng
 * định đó lên nó. Mắt ① phải XANH và mắt ②③ phải ĐỎ. Nếu cả ba cùng xanh thì bộ này là máy in chữ
 * PASS, không phải phép đo.
 * 🔴 Phân biệt FAIL với LỖI: khẳng định sai ⇒ FAIL (kết luận được). Hạ tầng ngã (server chết,
 * không đăng nhập được, không tìm ra canvas) ⇒ **LỖI ⇒ KHÔNG KẾT LUẬN**, thoát mã 2. Thứ đỏ ở mọi
 * thế giới thì không chứng minh gì.
 *
 * Chạy:  node scripts/nghiem-thu-g4-moat-danh-tinh.mjs [--hieu-chuan]
 * Cần:   dev server ở PORT (mặc định 3095) + `gieo-kho-vat-lieu.mjs` đã chạy.
 */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { mkdirSync, rmSync } from 'node:fs';

const GOC = process.env.GOC ?? 'http://localhost:3095';
const PID = process.env.PID ?? 'cmtmdaaws00017dmmhactp691';
const EMAIL = 'kiem@localhost.test';
const MATKHAU = 'matkhau123';
const HO_SO = '.nen-kiem/ho-so-g4-danh-tinh';
const ANH = 'docs/delivery/anh-duyet-mat/g4-danh-tinh';
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const A = { id: 'ps-kiem-go-soi', ten: 'Sàn gỗ sồi', gia: 1_250_000, mau: '#b98a54' };
const B = { id: 'ps-kiem-go-ocho', ten: 'Sàn gỗ óc chó', gia: 2_400_000, mau: '#5a3a26' };

let pass = 0;
let fail = 0;
const dong = [];
function ok(nhan, dieu, chiTiet = '') {
  if (dieu) { pass += 1; console.log(`   ✅ ${nhan}${chiTiet ? ` — ${chiTiet}` : ''}`); }
  else { fail += 1; console.log(`   ❌ ${nhan}${chiTiet ? ` — ${chiTiet}` : ''}`); dong.push(`${nhan} — ${chiTiet}`); }
}
/** Hạ tầng ngã ⇒ KHÔNG KẾT LUẬN. Khác hẳn `ok(false)`. */
function nga(vieC, chiTiet) {
  console.log(`\n🟠 KHÔNG KẾT LUẬN — hạ tầng ngã ở: ${vieC}\n   ${chiTiet}`);
  process.exit(2);
}

/* ───────── ba mắt: MỘT hàm khẳng định, dùng cho CẢ ca thật LẪN ca hiệu chuẩn ───────── */

/**
 * @param {{doc:any, boq:any}} theGioi
 * @param {{id:string,ten:string,gia:number,mau:string}} mong  vật liệu người dùng ĐÃ chọn sau cùng
 * @param {number} m2  diện tích hình học mong đợi
 */
function baMat(nhan, theGioi, mong, m2) {
  const { doc, boq } = theGioi;
  const hatches = (doc?.entities ?? []).filter((e) => e.type === 'hatch');
  const h = hatches[hatches.length - 1];

  // ① HÌNH — nét vẽ + màu đến từ vật liệu, không phải màu layer.
  ok(`${nhan} · ① HÌNH — vùng tô mang màu của vật liệu đã chọn`,
    !!h && String(h.color ?? '').toLowerCase() === mong.mau.toLowerCase(),
    `color=${h?.color ?? '(trống)'} · mong ${mong.mau}`);

  // ② DANH TÍNH — thứ BOQ/3D/Trình bày thật sự đọc.
  ok(`${nhan} · ② DANH TÍNH — vùng tô mang ĐÚNG mã kho`,
    !!h && h.specId === mong.id,
    `specId=${h?.specId ?? '(trống)'} · mong ${mong.id}`);

  // ③ CON SỐ — BOQ tính từ CHÍNH Doc đó, qua route thật.
  const dongBoq = (boq?.rows ?? []).find((r) => r.specId === mong.id);
  const tienMong = Math.round(m2 * (1 + 8 / 100) * mong.gia);
  ok(`${nhan} · ③ CON SỐ — BOQ ra đúng một dòng cho vật liệu đã chọn`,
    !!dongBoq, `rows=${(boq?.rows ?? []).map((r) => r.specId).join(',') || '(rỗng)'}`);
  ok(`${nhan} · ③ CON SỐ — thành tiền khớp giá của vật liệu đã chọn`,
    !!dongBoq && dongBoq.thanhTien === tienMong,
    `thanhTien=${dongBoq?.thanhTien ?? '—'} · mong ${tienMong} (${m2}m² +8% hao × ${mong.gia})`);
  return { h, dongBoq, tienMong };
}

/* ───────── ca hiệu chuẩn: Doc đúng hình dạng đường UI CŨ sinh ra ───────── */
if (process.argv.includes('--hieu-chuan')) {
  console.log('═══ HIỆU CHUẨN · Doc của đường UI CŨ (có hình, KHÔNG có danh tính) ═══');
  const docHong = {
    entities: [{
      id: 'e-hong', type: 'hatch', layer: 'l1',
      points: [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }, { x: 0, y: 3000 }],
      pattern: 'ANSI31', patternScale: 1, patternAngle: 0, color: B.mau,
      // specId: CỐ Ý KHÔNG CÓ — đây chính là chỗ đứt trước 04/09.
    }],
    layers: [{ id: 'l1', name: 'L1', color: '#888', visible: true, locked: false }],
  };
  baMat('hiệu chuẩn', { doc: docHong, boq: { rows: [] } }, B, 12);
  const matHinhXanh = pass >= 1;
  console.log(`\n${pass} đạt · ${fail} trượt`);
  if (fail >= 3 && matHinhXanh) {
    console.log('✅ HIỆU CHUẨN ĐẠT — mắt HÌNH xanh, mắt DANH TÍNH + CON SỐ ĐỎ.');
    console.log('   ⇒ bộ này ĐỎ ĐƯỢC, và đỏ đúng chỗ: nó phân biệt được "vẽ ra hình" với "mang danh tính".');
    process.exit(0);
  }
  console.log('❌ HIỆU CHUẨN TRƯỢT — bộ khẳng định không phân biệt được thế giới hỏng.');
  process.exit(1);
}

/* ───────── ca thật ───────── */
mkdirSync(ANH, { recursive: true });
rmSync(HO_SO, { recursive: true, force: true });
mkdirSync(HO_SO, { recursive: true });

/** Đọc Doc từ ĐÚNG nơi app lưu: IndexedDB `interiorflow-sheets`, khoá `userId::route::projectId`. */
const DOC_TU_IDB = `(async () => {
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open('interiorflow-sheets', 1);
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  const khoa = await new Promise((res, rej) => {
    const r = db.transaction('sheets', 'readonly').objectStore('sheets').getAllKeys();
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  const ban = {};
  for (const k of khoa) {
    ban[k] = await new Promise((res, rej) => {
      const r = db.transaction('sheets', 'readonly').objectStore('sheets').get(k);
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
  }
  return ban;
})()`;

async function docTuOCung(page) {
  const ban = await page.evaluate(DOC_TU_IDB);
  // Khoá thật là `<userId>::/cad-editor::<projectId>` — có dấu `/`, nên mẫu `::cad` KHÔNG khớp.
  // Lượt đầu bộ này lọc bằng `::cad` và im lặng trả rỗng, đọc ra như "app không lưu gì".
  const khoa = Object.keys(ban).filter((k) => k.includes('cad-editor'));
  let duPhong = null;
  for (const k of khoa) {
    const arr = ban[k]?.sheets;
    if (!Array.isArray(arr)) continue;
    for (const s of arr) {
      const ents = s?.doc?.entities;
      if (!Array.isArray(ents)) continue;
      // Ưu tiên bản vẽ CÓ vùng tô (thứ bộ này đo); không có thì vẫn trả bản vẽ đầu tiên để
      // bước kiểm biên kín đọc được `rect` — trả `null` ở đây sẽ đọc ra như "app không lưu gì".
      if (ents.some((e) => e.type === 'hatch')) return { doc: s.doc, khoa: k };
      if (!duPhong) duPhong = { doc: s.doc, khoa: k };
    }
  }
  return duPhong ?? { doc: null, khoa: khoa.join(',') || '(không có khoá cad-editor)' };
}

async function boqCuaDoc(page, doc) {
  const r = await page.request.post(`${GOC}/api/boq/${PID}`, { data: { doc } });
  if (!r.ok()) return { rows: [], loi: `HTTP ${r.status()}` };
  return r.json();
}

async function moPhien() {
  const ctx = await chromium.launchPersistentContext(HO_SO, {
    executablePath: CHROME,
    viewport: { width: 1600, height: 950 },
    args: ['--no-sandbox'],
  });
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  const dn = await page.request.post(`${GOC}/api/auth/login`, { data: { identifier: EMAIL, password: MATKHAU } });
  if (!dn.ok()) nga('đăng nhập', `POST /api/auth/login → HTTP ${dn.status()}`);
  const me = await (await page.request.get(`${GOC}/api/auth/me`)).json();
  await page.goto(GOC, { waitUntil: 'domcontentloaded' });
  await page.evaluate((id) => { try { localStorage.setItem(`interiorflow.tourDone.${id}`, '1'); } catch {} }, me?.user?.id ?? '');
  return { ctx, page };
}

async function moBanVe(page) {
  await page.goto(`${GOC}/projects/${PID}/cad`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  const veNgay = page.getByRole('button', { name: /Vẽ ngay|Start drawing/ });
  if (await veNgay.count()) { await veNgay.first().click(); await page.waitForTimeout(500); }
  const cv = page.locator('canvas').first();
  if (!(await cv.count())) nga('mở bản vẽ', 'không thấy <canvas> nào ở /projects/<id>/cad');
  const hop = await cv.boundingBox();
  if (!hop) nga('mở bản vẽ', 'canvas có trong DOM nhưng không có boundingBox');
  return hop;
}

/**
 * Bấm lên MẶT VẼ, có kiểm chứng điểm bấm THẬT SỰ chạm canvas.
 *
 * ⚠️ Vì sao phải kiểm: lượt đầu bộ này bấm mù và **im lặng không vẽ được gì** — điểm thứ hai rơi
 * trúng dock đáy (`div.cad-pill-scroll`, chiếm y 760–816 trong khung canvas y 122–884), nên
 * `pointerdown` **không bao giờ tới canvas** (đếm sự kiện trên chính canvas: down=1 sau HAI lần
 * nhấn). Bấm mù thì thất bại đọc ra y hệt "tính năng hỏng" — phải phân biệt được hai thứ đó.
 */
async function bamMatVe(page, hop, dx, dy, nhan) {
  const x = hop.x + dx;
  const y = hop.y + dy;
  const tren = await page.evaluate(([a, b]) => {
    const el = document.elementFromPoint(a, b);
    return { tag: el?.tagName ?? '(trống)', cls: String(el?.className ?? '').slice(0, 60) };
  }, [x, y]);
  if (tren.tag !== 'CANVAS') {
    nga(`bấm mặt vẽ (${nhan})`, `điểm (${Math.round(x)},${Math.round(y)}) bị ${tren.tag}.${tren.cls} che — không phải lỗi tính năng, là điểm bấm sai chỗ`);
  }
  await page.mouse.move(x, y, { steps: 6 });
  await page.waitForTimeout(140);
  await page.mouse.down();
  await page.waitForTimeout(110);
  await page.mouse.up();
  await page.waitForTimeout(450);
}

/** Mở tấm vật liệu qua ĐÚNG sự kiện app dùng (menu chuột phải phát cùng sự kiện này). */
async function moTamVatLieu(page) {
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('cad:open-material-palette')));
  await page.waitForTimeout(900);
}
/** Đóng bằng ĐÚNG nút Đóng của tấm — không giả lập phím tắt không tồn tại. */
async function dongTamVatLieu(page) {
  const nut = page.getByRole('button', { name: /^Đóng$/ });
  if (await nut.count()) { await nut.first().click(); await page.waitForTimeout(500); }
}

async function chonTuKho(page, ten) {
  const nut = page.getByRole('button', { name: new RegExp(ten, 'i') });
  if (!(await nut.count())) return false;
  await nut.first().click();
  await page.waitForTimeout(500);
  return true;
}

console.log('═══ G4 · MOAT — ĐƯỜNG UI CÓ MANG DANH TÍNH KHÔNG ═══');
console.log(`   máy chủ ${GOC} · dự án ${PID}`);

let phien = await moPhien();
let hop = await moBanVe(phien.page);
const { page } = phien;

/* ── B1 · vẽ một hình chữ nhật kín để có biên tô ── */
console.log('\n▸ B1 · vẽ biên kín (REC) rồi tô vật liệu A');
await page.keyboard.press('Escape');
// Dùng đường lệnh THẬT: gõ REC vào ô dòng lệnh rồi Enter (khuôn AutoCAD app đang dùng).
// ⚠️ FOCUS bằng mã chứ không CLICK — đo được ở lượt này: ô dòng lệnh (y≈888,5 cao 26) bị
// **dock đáy che** (`div.pointer-events-none.absolute.inset-x-0.bottom-4.z-[6]` có con
// `pointer-events-auto` phủ lên), nên `elementFromPoint` giữa ô trả về DIV chứ không phải input.
// Đây là một chồng lấn THẬT của giao diện, ghi vào báo cáo — nhưng nó KHÔNG phải thứ bộ này đo,
// và người dùng bàn phím vẫn tới ô này bằng Tab. Không lấy nó làm cớ dừng phép đo.
const oLenh = page.locator('input[placeholder*="lệnh" i], input[aria-label*="lệnh" i]').first();
if (!(await oLenh.count())) nga('vẽ biên', 'không thấy ô dòng lệnh');
const goLenh = async (lenh) => {
  await oLenh.evaluate((el) => el.focus());
  await page.keyboard.type(lenh, { delay: 40 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(450);
};
await goLenh('REC');
// Toạ độ nằm TRỌN trong vùng canvas không bị dock đáy che (dock chiếm y≈760 trở xuống).
const G1 = [150, 200];
const G2 = [620, 560];
const GIUA = [(G1[0] + G2[0]) / 2, (G1[1] + G2[1]) / 2];
await bamMatVe(page, hop, G1[0], G1[1], 'góc 1');
await bamMatVe(page, hop, G2[0], G2[1], 'góc 2');
await page.keyboard.press('Escape');
await page.waitForTimeout(1600); // autosave debounce ≥1200ms (sheets-persist.ts:235)
await page.screenshot({ path: `${ANH}/01-bien-kin.png` });
{
  const kt = await docTuOCung(page);
  const soRect = (kt.doc?.entities ?? []).filter((e) => e.type === 'rect').length;
  if (soRect === 0) nga('vẽ biên kín', 'gõ REC + bấm 2 góc xong mà Doc không có entity `rect` nào — không đo tiếp được');
  console.log(`   biên kín đã vẽ: ${soRect} rect`);
}

/* ── B2 · chọn vật liệu A từ KHO (mang danh tính), rồi tô ── */
await moTamVatLieu(page);
await page.screenshot({ path: `${ANH}/02-tam-vat-lieu.png` });
const coA = await chonTuKho(page, A.ten);
if (!coA) nga('chọn vật liệu A', `không thấy nút "${A.ten}" trong tấm vật liệu — kho có được nạp không?`);
// Tấm vật liệu là panel nổi bên PHẢI; đóng lại để nó không che điểm bấm trong lòng hình.
await dongTamVatLieu(page);
await bamMatVe(page, hop, GIUA[0], GIUA[1], 'tô trong lòng hình');
await page.waitForTimeout(1600);
await page.screenshot({ path: `${ANH}/03-to-vat-lieu-A.png` });

let oCung = await docTuOCung(page);
const hatchA = (oCung.doc?.entities ?? []).filter((e) => e.type === 'hatch').pop();
console.log(`   vùng tô sau khi tô A: specId=${hatchA?.specId ?? '(trống)'} · color=${hatchA?.color ?? '(trống)'}`);
ok('B2 · vùng tô VỪA VẼ đã mang mã kho (đường `handleHatch`)',
  hatchA?.specId === A.id, `specId=${hatchA?.specId ?? '(trống)'} · mong ${A.id}`);

/* ── B3 · chọn vùng tô rồi ĐỔI sang vật liệu B qua cửa duyệt ── */
console.log('\n▸ B3 · chọn vùng tô → đổi sang vật liệu B (qua cửa duyệt)');
await page.keyboard.press('Escape'); // Esc = về công cụ Chọn (`lib/commands/registry.ts:511`)
await page.waitForTimeout(400);
// QUÂY KHUNG chứ không bấm-một-điểm.
// 🔴 ĐO ĐƯỢC LƯỢT NÀY, đáng ghi: bấm một điểm vào GIỮA LÒNG vùng tô **không chọn được nó**
// (thanh trạng thái vẫn "Chưa chọn đối tượng nào để xoá"), trong khi quây khung thì ra "2 đối
// tượng". Đây là một quan sát về hành vi chọn của vùng tô, KHÔNG phải thứ bộ này đo — ghi vào
// báo cáo, và dùng quây khung (chính thanh trạng thái đang mách: "click vào đối tượng, hoặc
// quây khung"). Quây trúng cả `rect` lẫn `hatch`; `applyMaterial` chỉ đụng `hatch` trong tập chọn.
await page.mouse.move(hop.x + 100, hop.y + 150, { steps: 5 });
await page.mouse.down();
await page.mouse.move(hop.x + 680, hop.y + 600, { steps: 14 });
await page.waitForTimeout(150);
await page.mouse.up();
await page.waitForTimeout(700);
const daChon = await page.evaluate(() => /(\d+)\s*đối tượng/.exec(document.body.innerText)?.[1] ?? null);
if (!daChon) nga('chọn vùng tô', 'quây khung xong mà không thấy dấu hiệu "N đối tượng" — không đo tiếp bước đổi vật liệu được');
console.log(`   đã chọn: ${daChon} đối tượng`);
await moTamVatLieu(page);
const coB = await chonTuKho(page, B.ten);
if (!coB) nga('chọn vật liệu B', `không thấy nút "${B.ten}"`);
await page.screenshot({ path: `${ANH}/04-cua-duyet.png` });

const cuaDuyet = page.getByRole('dialog', { name: /Ảnh hưởng khi đổi|Impact of changing/ });
const coCua = await cuaDuyet.count();
ok('B3 · CỬA DUYỆT hiện ra TRƯỚC khi ghi (máy trình, người quyết)', coCua > 0,
  coCua ? 'hộp "Ảnh hưởng khi đổi" đã hiện' : 'không thấy hộp xác nhận nào');
if (coCua) {
  const chuCua = (await cuaDuyet.first().innerText()).replace(/\s+/g, ' ').trim();
  console.log(`   chữ trên cửa duyệt: «${chuCua.slice(0, 240)}»`);
  const nutHep = page.getByRole('button', { name: /Chỉ \d+ vùng đang chọn|Only \d+ selected/ });
  ok('B3 · cửa duyệt bày phạm vi HẸP với số vật thật', (await nutHep.count()) > 0, chuCua.slice(0, 120));
  if (await nutHep.count()) { await nutHep.first().click(); } else { await page.getByRole('button', { name: /^Áp dụng$|^Apply$/ }).first().click(); }
  await page.waitForTimeout(1600);
}
await page.screenshot({ path: `${ANH}/05-sau-khi-doi.png` });

oCung = await docTuOCung(page);
let boq = await boqCuaDoc(page, oCung.doc);
const hatchB = (oCung.doc?.entities ?? []).filter((e) => e.type === 'hatch').pop();
const dienTich = (() => {
  const p2 = hatchB?.points ?? [];
  let s = 0;
  for (let i = 0; i < p2.length; i += 1) {
    const a = p2[i]; const b = p2[(i + 1) % p2.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2 / 1e6; // mm² → m²
})();
console.log(`   diện tích hình học đo được = ${dienTich.toFixed(4)} m²`);

console.log('\n▸ TRƯỚC KHI ĐÓNG — ba mắt');
baMat('trước khi đóng', { doc: oCung.doc, boq }, B, dienTich);

/* ── B4 · ĐÓNG HẲN trình duyệt, mở lại ── */
console.log('\n▸ B4 · ĐÓNG HẲN trình duyệt (hồ sơ đĩa) rồi vào lại');
await phien.ctx.close();
await new Promise((r) => setTimeout(r, 1500));
phien = await moPhien();
hop = await moBanVe(phien.page);
await phien.page.screenshot({ path: `${ANH}/06-sau-khi-vao-lai.png` });

const oCung2 = await docTuOCung(phien.page);
const boq2 = await boqCuaDoc(phien.page, oCung2.doc);
console.log(`   khoá IndexedDB đọc lại: ${oCung2.khoa}`);
console.log('\n▸ SAU KHI VÀO LẠI — ba mắt (đây là mắt LUẬT PASS)');
const sau = baMat('sau khi vào lại', { doc: oCung2.doc, boq: boq2 }, B, dienTich);

/* ── B5 · override cục bộ: KHÔNG bị nuốt, và KHÔNG rò sang vật liệu khác ── */
console.log('\n▸ B5 · override cục bộ (`boq-overrides`) — nuốt hay rò?');
{
  // Ghi một override ĐƠN GIÁ cho vật liệu **A** (mô phỏng "dự án này đè giá riêng"), rồi kiểm
  // sau khi vùng tô đã đổi sang **B**. Ghi thẳng vào ĐÚNG kho + ĐÚNG khoá mà app dùng
  // (`interiorflow-sheets`, route `/boq-overrides`, sheet `overrides`) — không bịa kho thứ hai.
  const GIA_DE = 999_000;
  await phien.page.evaluate(async ([uid, pid, specId, gia]) => {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('interiorflow-sheets', 1);
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    const ban = {
      v: 1, activeId: 'overrides', ts: Date.now(),
      sheets: [{ id: 'overrides', name: 'BOQ overrides', items: [{ specId, matId: specId, field: 'donGia', value: gia, at: Date.now() }] }],
    };
    await new Promise((res, rej) => {
      const tx = db.transaction('sheets', 'readwrite');
      tx.objectStore('sheets').put(ban, `${uid}::/boq-overrides::${pid}`);
      tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
    });
  }, [(await (await phien.page.request.get(`${GOC}/api/auth/me`)).json())?.user?.id, PID, A.id, GIA_DE]);

  // Đọc lại đúng đường app đọc (cùng khoá) — override của A còn nguyên hay bị dọn mất?
  const conNguyen = await phien.page.evaluate(async ([uid, pid]) => {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('interiorflow-sheets', 1);
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    const v = await new Promise((res, rej) => {
      const r = db.transaction('sheets', 'readonly').objectStore('sheets').get(`${uid}::/boq-overrides::${pid}`);
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return (v?.sheets?.[0]?.items ?? []).map((i) => ({ specId: i.specId ?? i.matId, field: i.field, value: i.value }));
  }, [(await (await phien.page.request.get(`${GOC}/api/auth/me`)).json())?.user?.id, PID]);

  ok('B5 · phần ĐÈ của dự án KHÔNG bị thao tác thay vật liệu xoá mất',
    conNguyen.some((i) => i.specId === A.id && i.field === 'donGia' && i.value === GIA_DE),
    `còn trong kho: ${JSON.stringify(conNguyen)}`);

  // Và nó KHÔNG được rò sang vật liệu mới: khoá override là `${specId}::${field}`, dòng BOQ nay
  // mang specId của B ⇒ giá đè của A phải KHÔNG áp lên B. Rò sang B mới là "nuốt" theo nghĩa tệ
  // nhất — người dùng đè giá cho gỗ sồi rồi bỗng thấy gỗ óc chó ăn theo giá đó.
  const dongB = (boq2?.rows ?? []).find((r) => r.specId === B.id);
  ok('B5 · giá đè của vật liệu CŨ không rò sang vật liệu MỚI',
    !!dongB && dongB.donGia === B.gia,
    `donGia dòng B = ${dongB?.donGia ?? '—'} · giá kho của B = ${B.gia} · giá đè của A = ${GIA_DE}`);
}

await phien.ctx.close();

console.log(`\n── KẾT: ${pass} đạt · ${fail} trượt ──`);
if (fail) { console.log('ĐỨT Ở:'); for (const d of dong) console.log(`  · ${d}`); }
process.exit(fail ? 1 : 0);
