/**
 * scripts/nghiem-thu-ban-lam-viec/mat-ve-2d-cham-toi-duoc.mjs
 * ĐO MẶT VẼ 2D CÓ CHẠM TỚI ĐƯỢC KHÔNG — bù đúng chỗ luật H5 mù.
 *
 * ⛔ VÌ SAO KHÔNG DÙNG THẲNG `soi:cong-cu-chet --cham` (đo 04/09, chạy thật rồi mới kết luận):
 * H5 hỏi *"nút này có bị ai đứng đè lên tâm không"*, và bộ chọn của nó là
 * `button, a[href], input, select, textarea, summary, [role=...], [tabindex]`.
 * `<canvas>` KHÔNG có trong danh sách ⇒ H5 **không bao giờ xét mặt vẽ**. Chạy H5 trên chặng 2D
 * hôm nay ra 2 ca, cả hai ở màn 3D, 0 ca ở 2D — trong khi lớp che trên mặt vẽ là thứ đang chặn
 * người dùng. Luật H5 phát biểu "MỌI phần tử bấm được"; mặt vẽ là bề mặt bấm được QUAN TRỌNG
 * NHẤT của chặng Vẽ, nên đây không phải phạm vi khác — đây là một LỖ của H5.
 *
 * Bộ này hỏi câu ngược lại: *"đứng ở điểm này trên mặt vẽ, cú bấm rơi vào ai?"* — quét lưới
 * điểm, hỏi `document.elementFromPoint`, gom theo thủ phạm. Đo BA ca phiếu nêu:
 *   ca 1 · ô dòng lệnh có bị dock đáy che không
 *   ca 2 · dải nào của mặt vẽ bị lớp khác nuốt `pointerdown`
 *   ca 3 · bấm giữa LÒNG một vùng tô có chọn được nó không (SOLID và không SOLID)
 *
 * ⚠️ Ca 3 KHÔNG phải câu hỏi về lớp che — nó có thể là LUẬT CHỌN HÌNH HỌC (chỉ bắt theo đường
 * biên). Hai bệnh chữa khác nhau hoàn toàn, nên bộ này đo tách: trước hết hỏi `elementFromPoint`
 * (loại trừ lớp che), rồi mới bấm thật và đọc `selection` trong store (hỏi luật chọn).
 *
 * HIỆU CHUẨN bắt buộc (`--tu-kiem`): tự chèn một tấm phủ lên giữa mặt vẽ ⇒ phải ĐỎ; gỡ ra ⇒ phải
 * XANH. Không có bước này thì con số chỉ là lời khai. Phân biệt FAIL (khẳng định sai) với LỖI
 * (hạ tầng ngã ⇒ KHÔNG kết luận) — hai thứ này in ra khác nhau.
 *
 * Chạy:
 *   node scripts/nghiem-thu-ban-lam-viec/mat-ve-2d-cham-toi-duoc.mjs \
 *        --url=http://localhost:3097 --pid=<projectId> [--tu-kiem] [--anh=<thư mục>]
 */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';

const co = (t, m) => {
  const a = process.argv.find((x) => x.startsWith(`--${t}=`));
  return a ? a.slice(t.length + 3) : m;
};
const GOC = co('url', 'http://localhost:3097');
const PID = co('pid', '');
const ANH = co('anh', '');
const TU_KIEM = process.argv.includes('--tu-kiem');
const CHROME = process.env.IF_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
if (!PID) { console.error('thiếu --pid=<projectId>'); process.exit(2); }
if (ANH) mkdirSync(ANH, { recursive: true });

const in_ = (s) => console.log(s);
const ket = { fail: [], loi: [] };

/** Hàm chạy TRONG trang — quét lưới điểm trên mặt vẽ, gom theo thủ phạm. */
const QUET_MAT_VE = (buoc) => {
  const cv = document.querySelector('canvas');
  if (!cv) return { loi: 'không thấy <canvas> nào trên trang' };
  const r = cv.getBoundingClientRect();
  const mo = (el) => {
    if (!el) return 'null';
    const cls = typeof el.className === 'string' ? el.className : (el.className?.baseVal ?? '');
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls.trim().split(/\s+/).slice(0, 2).join('.') : ''}`;
  };
  /**
   * 🔴 HAI LOẠI CHE, KHÔNG ĐƯỢC GỘP — nếu gộp thì máy soi báo quá tay và người ta học cách bỏ
   * qua nó (đúng cách ba máy soi khác đã hỏng trong ngày 04/09):
   *   · THẤY ĐƯỢC — dock kính, nút, thanh công cụ: có nền/viền, người dùng NHÌN THẤY nó nằm đó và
   *     không kỳ vọng bấm xuyên qua. Dock nổi đè mặt vẽ là thiết kế đã chốt (03/08, dock kính dưới).
   *   · TRONG SUỐT — hộp bố cục rỗng, không nền không viền: người dùng thấy mặt vẽ, bấm vào lại
   *     rơi vào hư không. **Đây mới là lỗi.**
   * Phân loại bằng chính style đã tính, không đoán theo tên class.
   */
  const trongSuot = (el) => {
    for (let e = el, i = 0; e && e !== document.body && i < 4; e = e.parentElement, i++) {
      const cs = getComputedStyle(e);
      const bg = cs.backgroundColor || '';
      const coNen = bg && bg !== 'transparent' && !/rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(bg);
      const coAnh = cs.backgroundImage && cs.backgroundImage !== 'none';
      const coVien = parseFloat(cs.borderTopWidth || '0') > 0 || parseFloat(cs.borderBottomWidth || '0') > 0;
      const coBong = cs.boxShadow && cs.boxShadow !== 'none';
      const coMo = cs.backdropFilter && cs.backdropFilter !== 'none';
      if (coNen || coAnh || coVien || coBong || coMo) return false;
      if (['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'SVG', 'PATH', 'CIRCLE', 'SPAN'].includes(e.tagName)) return false;
    }
    return true;
  };

  const tong = { xet: 0, toi: 0, che: 0, cheTrongSuot: 0 };
  const thuPham = new Map();
  for (let y = r.y + 4; y < r.y + r.height - 4; y += buoc) {
    for (let x = r.x + 4; x < r.x + r.width - 4; x += buoc) {
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
      const top = document.elementFromPoint(x, y);
      if (!top) continue;
      tong.xet++;
      // ĐẠT khi cú bấm rơi vào chính mặt vẽ, hoặc vào con của nó.
      if (top === cv || cv.contains(top)) { tong.toi++; continue; }
      tong.che++;
      const ts = trongSuot(top);
      if (ts) tong.cheTrongSuot++;
      const k = mo(top);
      const cu = thuPham.get(k) ?? { so: 0, yMin: 1e9, yMax: -1e9, xMin: 1e9, xMax: -1e9, ten: '', trongSuot: ts };
      cu.so++;
      cu.yMin = Math.min(cu.yMin, y); cu.yMax = Math.max(cu.yMax, y);
      cu.xMin = Math.min(cu.xMin, x); cu.xMax = Math.max(cu.xMax, x);
      if (!cu.ten) cu.ten = (top.getAttribute?.('aria-label') || (top.textContent || '').trim().slice(0, 36) || '');
      thuPham.set(k, cu);
    }
  }
  return {
    canvas: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    tong,
    thuPham: [...thuPham.entries()]
      .map(([k, v]) => ({ nut: k, ...v, yMin: Math.round(v.yMin), yMax: Math.round(v.yMax), xMin: Math.round(v.xMin), xMax: Math.round(v.xMax) }))
      .sort((a, b) => b.so - a.so),
  };
};

const b = await chromium.launch({ executablePath: CHROME });
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
{
  const p = await ctx.newPage();
  const r = await p.request.post(`${GOC}/api/auth/login`, { data: { identifier: 'kiem@localhost.test', password: 'matkhau123' } });
  if (!r.ok()) { ket.loi.push(`login ${r.status()} — màn sau có thể là màn đăng nhập, KHÔNG kết luận`); }
  const me = await (await p.request.get(`${GOC}/api/auth/me`)).json().catch(() => ({}));
  await p.goto(GOC);
  await p.evaluate((id) => { try { localStorage.setItem(`interiorflow.tourDone.${id}`, '1'); } catch {} }, me?.user?.id ?? '');
  await p.close();
}
const page = await ctx.newPage();
await page.goto(`${GOC}/projects/${PID}/cad`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(3200);
/* VÀO ĐÚNG TRẠNG THÁI LÀM VIỆC — đo được 04/09: dự án chưa có bản vẽ nào thì chặng 2D KHÔNG
   dựng `<canvas>`, nó dựng màn rỗng "Tạo bản vẽ mới / Nhập bản vẽ có sẵn". Bộ đo cũ
   (`soi-2d.mjs`) tìm nút "Vẽ ngay" — tên đó nay không còn. Không bước này thì mọi phép đo trả
   "không thấy canvas" và ta tưởng app hỏng, trong khi app đang đúng. */
for (const ten of [/Tạo bản vẽ mới|New drawing/, /Vẽ ngay|Start drawing/]) {
  const n = page.getByRole('button', { name: ten });
  if (await n.count().catch(() => 0)) { await n.first().click().catch(() => {}); await page.waitForTimeout(1200); }
}
await page.waitForTimeout(1500);

in_('🔎 MẶT VẼ 2D — CHẠM TỚI ĐƯỢC KHÔNG');
in_(`   ${GOC}/projects/${PID}/cad · khung nhìn 1600×900`);

/* ── HIỆU CHUẨN ─────────────────────────────────────────────────────────── */
let hieuChuan = null;
if (TU_KIEM) {
  const truoc = await page.evaluate(QUET_MAT_VE, 40);
  if (truoc.loi) { ket.loi.push(`hiệu chuẩn: ${truoc.loi}`); }
  else {
    await page.evaluate(() => {
      const cv = document.querySelector('canvas');
      const r = cv.getBoundingClientRect();
      const d = document.createElement('div');
      d.id = '__tam-hieu-chuan';
      Object.assign(d.style, {
        position: 'fixed', left: `${r.x + r.width / 2 - 90}px`, top: `${r.y + r.height / 2 - 60}px`,
        width: '180px', height: '120px', background: 'rgba(255,0,0,.25)', zIndex: '99999',
      });
      document.body.appendChild(d);
    });
    const trong = await page.evaluate(QUET_MAT_VE, 40);
    await page.evaluate(() => document.getElementById('__tam-hieu-chuan')?.remove());
    const sau = await page.evaluate(QUET_MAT_VE, 40);
    hieuChuan = {
      truoc: truoc.tong.che, khiChe: trong.tong.che, sau: sau.tong.che,
      DAT: trong.tong.che > truoc.tong.che && sau.tong.che === truoc.tong.che,
    };
    in_(`\n🧪 HIỆU CHUẨN — che giữa mặt vẽ: ${hieuChuan.truoc} → ${hieuChuan.khiChe} → gỡ ${hieuChuan.sau}`
      + `   ${hieuChuan.DAT ? '✅ ĐẠT' : '❌ KHÔNG ĐẠT — đừng tin số dưới'}`);
    if (!hieuChuan.DAT) ket.loi.push('hiệu chuẩn không đạt');
  }
}

/* ── CA 2 · dải nào của mặt vẽ bị nuốt ──────────────────────────────────── */
const q = await page.evaluate(QUET_MAT_VE, 12);
if (q.loi) {
  ket.loi.push(`ca 2: ${q.loi}`);
  in_(`\n❗ CA 2 — LỖI (không kết luận): ${q.loi}`);
} else {
  const pct = q.tong.xet ? ((q.tong.che / q.tong.xet) * 100).toFixed(1) : '—';
  const pctTs = q.tong.xet ? ((q.tong.cheTrongSuot / q.tong.xet) * 100).toFixed(1) : '—';
  in_(`\n■ CA 2 · LỚP CHE TRÊN MẶT VẼ  (canvas ${q.canvas.w}×${q.canvas.h} tại ${q.canvas.x},${q.canvas.y})`);
  in_(`   điểm xét ${q.tong.xet} · tới được mặt vẽ ${q.tong.toi}`);
  in_(`   bị che TỔNG ${q.tong.che} (${pct}%) — trong đó THẤY ĐƯỢC ${q.tong.che - q.tong.cheTrongSuot} (dock/nút, hợp lệ)`);
  in_(`   🎯 CHE TRONG SUỐT ${q.tong.cheTrongSuot} (${pctTs}%) ← đây mới là lỗi`);
  if (!q.thuPham.length) in_('   ✅ không lớp nào đứng trên mặt vẽ');
  for (const t of q.thuPham) {
    in_(`   ${t.trongSuot ? '🔴 TRONG SUỐT' : '·  thấy được '} ${t.so} điểm — ${t.nut}${t.ten ? ` "${t.ten.replace(/\s+/g, ' ')}"` : ''}`);
    in_(`        dải x ${t.xMin}–${t.xMax} · y ${t.yMin}–${t.yMax}`);
  }
  if (q.tong.cheTrongSuot > 0) ket.fail.push(`ca 2 · ${q.tong.cheTrongSuot}/${q.tong.xet} điểm mặt vẽ bị hộp TRONG SUỐT nuốt`);
}

/* ── CA 1 · ô dòng lệnh có bấm tới được không ───────────────────────────── */
const oLenh = await page.evaluate(() => {
  const el = document.querySelector('input[placeholder*="lệnh" i],input[aria-label*="lệnh" i],input[placeholder*="command" i]');
  if (!el) return { co: false };
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
  const top = document.elementFromPoint(cx, cy);
  const mo = (e) => e ? `${e.tagName.toLowerCase()}${typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}` : 'null';
  return {
    co: true,
    hop: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    hien: cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) !== 0,
    tamRoiVao: mo(top),
    dat: top === el || el.contains(top) || (top && top.contains(el)),
  };
});
in_('\n■ CA 1 · Ô DÒNG LỆNH');
if (!oLenh.co) { in_('   ⚠️ không thấy ô lệnh trên DOM — không kết luận'); ket.loi.push('ca 1: không thấy ô lệnh'); }
else {
  in_(`   hộp ${oLenh.hop.x},${oLenh.hop.y} ${oLenh.hop.w}×${oLenh.hop.h} · hiện=${oLenh.hien} · tâm rơi vào ${oLenh.tamRoiVao}`);
  if (oLenh.dat) in_('   ✅ bấm vào tâm ô lệnh là trúng ô lệnh');
  else { in_('   🔴 tâm ô lệnh bị vật khác đứng đè'); ket.fail.push('ca 1 · ô lệnh bị che'); }
}

/* ── CA 3 · bấm giữa LÒNG một vùng tô ───────────────────────────────────── */
in_('\n■ CA 3 · CHỌN VÙNG TÔ BẰNG CÚ BẤM GIỮA LÒNG');
/**
 * Có đang chọn được vật nào không — đọc CHỮ TRÊN MÀN của trục phải, không đoán theo nút.
 * (Đo 04/09: không chọn ⇒ "Chưa chọn đối tượng nào để xoá"; có chọn ⇒ "… — N đối tượng".)
 */
const dangChon = () => page.evaluate(() => {
  const t = document.body.innerText || '';
  if (/—\s*\d+\s*đối tượng/.test(t)) return true;
  if (/Chưa chọn đối tượng nào/.test(t)) return false;
  return null;                                  // không đọc được ⇒ KHÔNG kết luận
});
const ca3 = await (async () => {
  const cv = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  if (!cv) return { loi: 'không thấy canvas' };
  // Chọn một ô trống ở GIỮA mặt vẽ, tránh mọi dải bị che đã đo ở ca 2.
  const ox = Math.round(cv.x + cv.w * 0.45);
  const oy = Math.round(cv.y + cv.h * 0.32);
  const goLenh = async (lenh) => {
    const o = page.locator('input[placeholder*="lệnh" i], input[aria-label*="lệnh" i]').first();
    await o.click({ timeout: 5000 }).catch(() => {});
    await o.fill(lenh).catch(() => {});
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  };
  await goLenh('REC');
  await page.mouse.click(ox - 140, oy - 90); await page.waitForTimeout(300);
  await page.mouse.click(ox + 140, oy + 90); await page.waitForTimeout(600);
  await page.keyboard.press('Escape');
  await goLenh('HATCH');
  await page.mouse.click(ox, oy);                       // 1 điểm trong vùng kín ⇒ tô
  await page.waitForTimeout(1000);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  /* Cú bấm rơi vào ai — loại trừ lớp che TRƯỚC, rồi mới hỏi luật chọn. */
  const roiVao = await page.evaluate(({ x, y }) => {
    const top = document.elementFromPoint(x, y);
    const cv2 = document.querySelector('canvas');
    return { la: top ? top.tagName.toLowerCase() : 'null', laMatVe: !!(top && (top === cv2 || cv2?.contains(top))) };
  }, { x: ox, y: oy });

  /* HAI PHÉP BẤM, cùng một vùng tô — đây là phần phân biệt hai bệnh:
     · giữa LÒNG  — cách mọi cạnh ~90-140px
     · trên BIÊN  — ngay cạnh dưới của hình chữ nhật vừa vẽ
     Lòng KHÔNG chọn được mà biên CHỌN ĐƯỢC ⇒ chắc chắn là LUẬT CHỌN HÌNH HỌC (bắt theo biên),
     không phải lớp che (lớp che thì cả hai đều trượt). */
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  await page.mouse.click(ox, oy); await page.waitForTimeout(500);
  const chonOLong = await dangChon();
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  await page.mouse.click(ox, oy + 90); await page.waitForTimeout(500);
  const chonOBien = await dangChon();
  return { ox, oy, roiVao, chonOLong, chonOBien };
})();
if (ca3.loi) { in_(`   ⚠️ ${ca3.loi} — không kết luận`); ket.loi.push(`ca 3: ${ca3.loi}`); }
else {
  in_(`   bấm tại ${ca3.ox},${ca3.oy} · cú bấm rơi vào <${ca3.roiVao.la}> · là mặt vẽ = ${ca3.roiVao.laMatVe}`);
  in_(`   chọn được khi bấm GIỮA LÒNG = ${ca3.chonOLong} · khi bấm TRÊN BIÊN = ${ca3.chonOBien}`);
  if (!ca3.roiVao.laMatVe) {
    in_('   🔴 KẾT LUẬN: LỚP CHE — có vật khác đứng trên đúng điểm đó');
    ket.fail.push('ca 3 · lớp che trên vùng tô');
  } else if (ca3.chonOLong === false && ca3.chonOBien === true) {
    in_('   🔴 KẾT LUẬN: LUẬT CHỌN HÌNH HỌC — hit-test chỉ bắt theo ĐƯỜNG BIÊN, không bắt theo lòng');
    in_('      bằng chứng mã: `lib/cad/query.ts:366` nhánh `hatch` chỉ `nearestOnSeg` trên `entSegments`,');
    in_('      không có phép kiểm điểm-trong-đa-giác. Cùng một nhánh cho SOLID và không-SOLID.');
    ket.fail.push('ca 3 · luật chọn hình học: bấm giữa lòng vùng tô không chọn được');
  } else if (ca3.chonOLong === true) {
    in_('   ✅ bấm giữa lòng CHỌN ĐƯỢC — ca 3 không còn');
  } else {
    in_('   ⚠️ không kết luận: cả lòng lẫn biên đều không chọn được ⇒ hỏng ở chỗ khác (vẽ/tô)');
    ket.loi.push('ca 3: cả lòng lẫn biên đều không chọn được');
  }
}

if (ANH) await page.screenshot({ path: `${ANH}/2d-mat-ve.png` }).catch(() => {});

in_('\n── KẾT');
in_(`   FAIL (khẳng định sai) ${ket.fail.length}`);
for (const f of ket.fail) in_(`     🔴 ${f}`);
in_(`   LỖI (hạ tầng ngã ⇒ KHÔNG kết luận) ${ket.loi.length}`);
for (const l of ket.loi) in_(`     ⚠️ ${l}`);
if (TU_KIEM && !hieuChuan?.DAT) in_('   ⚠️ HIỆU CHUẨN KHÔNG ĐẠT — mọi số trên đây chưa được bảo chứng.');

await b.close();
process.exit(ket.fail.length ? 1 : 0);
