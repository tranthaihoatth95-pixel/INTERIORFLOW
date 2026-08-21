/**
 * pointer3d.js — bộ kiểm 3D bằng CON TRỎ THẬT (Playwright trusted events).
 *
 * Vì sao cần: pointer tổng hợp (`dispatchEvent`) KHÔNG giữ được `setPointerCapture`, mà cả
 * push/pull lẫn gizmo của IF đều dựa vào pointer capture ⇒ mọi phép thử kéo bằng JS đều thất bại
 * VÌ CÔNG CỤ THỬ, không phải vì app. Playwright `mouse.*` phát sự kiện tin cậy ở tầng CDP nên
 * capture hoạt động y như tay người.
 *
 * Chạy: node pointer3d.js <lệnh>
 *   shot <tên>      chỉ chụp
 *   probe           đăng nhập, vào 3D, báo trạng thái
 *   drag            thử kéo gizmo/khối (Move) và báo trước/sau
 */
const { chromium } = require('playwright');
const path = require('path');

const BASE = process.env.IF_BASE || 'http://localhost:3000';
const PROJ = 'cmsl8prn80001w9i2ud3bfdgr';
const OUT = process.env.SHOT_DIR || '/Users/tranben/Downloads/interiorflow/present-demo/screens';

async function login(page) {
  // Đặt cờ "đã xem intro" TRƯỚC khi vào '/': hồ sơ Playwright trắng tinh ⇒ HomeScreen tự
  // `router.replace('/intro')`, mà route đó đang 404 trên máy chủ dev (3 tiến trình `next dev`
  // cùng giẫm một thư mục `.next` — bệnh đã ghi trong sổ). Người dùng thật đã xem intro từ lâu
  // nên KHÔNG gặp; chỉ hồ sơ mới mới rơi vào. Đặt cờ là đi thẳng màn đăng nhập, không phải sửa
  // app cho hợp bộ kiểm.
  await page.goto(`${BASE}/favicon.ico`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.evaluate(() => localStorage.setItem('if_intro_seen_v1', '1')).catch(() => {});
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  // Bỏ qua intro nếu có
  for (let i = 0; i < 3; i++) {
    const skip = page.locator('button', { hasText: /SKIP|Bỏ qua/i }).first();
    if (await skip.count().catch(() => 0)) { await skip.click().catch(() => {}); await page.waitForTimeout(600); }
  }
  // Ô định danh nhận diện bằng PLACEHOLDER (form không có type="email"); ô mật khẩu là
  // `PasswordInput` nên có thể đang ở chế độ hiện chữ ⇒ tìm theo placeholder trước, type sau.
  const ident = page.locator('input[placeholder*="Email"], input[placeholder*="email"]').first();
  if (await ident.count().catch(() => 0)) {
    await ident.fill('demo@if.local').catch(() => {});
    const pwd = page
      .locator('input[placeholder*="Mật khẩu"], input[placeholder*="Password"], input[type="password"]')
      .first();
    await pwd.fill('demo1234').catch(() => {});
    await page.waitForTimeout(300);
    const go = page.locator('button[type="submit"]').first();
    if (await go.count().catch(() => 0)) await go.click().catch(() => {});
    else await pwd.press('Enter').catch(() => {});
  }
  // chờ auth thật
  for (let i = 0; i < 30; i++) {
    const me = await page.evaluate(() => fetch('/api/auth/me').then((r) => r.ok).catch(() => false));
    if (me) return true;
    await page.waitForTimeout(1000);
  }
  return false;
}

/** Vào chặng 3D, chuyển sang mode Vẽ 3D, đợi canvas WebGL lớn xuất hiện. */
async function open3D(page) {
  await page.goto(`${BASE}/projects/${PROJ}/render`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  const ve3d = page.locator('button[title^="Vẽ 3D"]').first();
  if (await ve3d.count().catch(() => 0)) { await ve3d.click().catch(() => {}); await page.waitForTimeout(4000); }
  // đóng tấm Thư viện nếu tự mở
  const close = page.locator('button[aria-label="Đóng Thư viện"]').first();
  if (await close.count().catch(() => 0)) { await close.click().catch(() => {}); await page.waitForTimeout(800); }
  await page.waitForFunction(() => [...document.querySelectorAll('canvas')].some((c) => c.width > 500), null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
  return page.locator('canvas').first();
}

/** Hộp của canvas viewport (canvas LỚN nhất — canvas nhỏ là ViewCube). */
async function viewportBox(page) {
  return page.evaluate(() => {
    const c = [...document.querySelectorAll('canvas')].sort((a, b) => (b.width || 0) - (a.width || 0))[0];
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });
}

async function inspectorText(page) {
  // Đọc theo DẤU HIỆU NỘI DUNG (nhãn loại khối in hoa + dòng "Đã chọn trong khung nhìn"), không
  // theo vị trí panel: bề rộng cửa sổ đổi là mọi phép lọc theo toạ độ sai ngay (đã dính 1 lần).
  // ⚠️ BẪY ĐÃ DÍNH: bắt từ chữ hoa đầu tiên rồi cắt 160 ký tự thì luôn tóm nhầm nhãn "KHỐI" của
  // rail bên trái và KHÔNG BAO GIỜ tới được Inspector ⇒ báo "không trúng" trong khi app chọn
  // đúng (ảnh chụp chứng minh). Nay tìm DẤU HIỆU CHỌN trên TOÀN BỘ body, không cắt cửa sổ.
  return page.evaluate(() => {
    const t = (document.body.innerText || '').replace(/\n+/g, ' | ');
    const i = t.indexOf('Đã chọn trong khung nhìn');
    if (i >= 0) return t.slice(Math.max(0, i - 160), i + 40);
    return '';
  });
}

/**
 * Ảnh chụp TRẠNG THÁI THẬT của Doc: id + cao độ + toạ độ. Đây là thứ dùng để khẳng định, KHÔNG
 * dùng pixel: xoay camera cũng đổi pixel, chỉ Doc mới phân biệt "khối đổi" với "máy ảnh đổi".
 */
async function docSnapshot(page) {
  return page.evaluate(() => {
    try {
      const ents = window.__cadStore?.getState?.().doc?.entities ?? [];
      return ents.map((e) => ({
        id: e.id,
        h: e.heightMm ?? null,
        // điểm đầu tiên tìm được — đủ để thấy khối có DỜI CHỖ hay không
        p: e.points?.[0] ? [Math.round(e.points[0].x), Math.round(e.points[0].y)] : null,
      }));
    } catch {
      return [];
    }
  });
}

/** Số khối trong Doc — nguồn thật để phân biệt "tạo/xoá" với "chỉ xoay camera". */
async function entityCount(page) {
  return page.evaluate(() => {
    const w = window;
    try {
      return w.__cadStore?.getState?.().doc?.entities?.length ?? null;
    } catch {
      return null;
    }
  });
}

/** Ảnh chụp cảnh dạng chuỗi để so "có đổi hình không" — dùng screenshot buffer, không đọc pixel
 *  WebGL (canvas không bật preserveDrawingBuffer nên đọc thẳng ra trắng). */
async function sceneHash(page) {
  const box = await viewportBox(page);
  if (!box) return null;
  const buf = await page.screenshot({ clip: { x: box.x, y: box.y, width: Math.min(box.w, 1200), height: Math.min(box.h, 700) } });
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
}

async function main() {
  const cmd = process.argv[2] || 'probe';
  // HEADLESS: bộ kiểm chạy nền, không chiếm màn hình người dùng. Sự kiện chuột của Playwright
  // vẫn là TIN CẬY ở chế độ này (phát qua CDP, không phải dispatchEvent) nên pointer capture —
  // thứ gizmo/push-pull phụ thuộc — vẫn hoạt động y như tay người.
  const browser = await chromium.launch({ headless: process.env.HEADED !== '1' });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const log = [];
  try {
    const ok = await login(page);
    log.push(`login: ${ok}`);
    if (!ok) throw new Error('login failed');
    await open3D(page);
    const box = await viewportBox(page);
    log.push(`viewport: ${box ? `${Math.round(box.w)}x${Math.round(box.h)}` : 'NONE'}`);
    if (!box) throw new Error('no viewport');

    // Fit view cho khung chuẩn
    const fit = page.locator('button.fitbtn').first();
    if (await fit.count().catch(() => 0)) { await fit.click().catch(() => {}); await page.waitForTimeout(1200); }

    let cx = box.x + box.w * 0.45;
    let cy = box.y + box.h * 0.45;

    if (cmd === 'gate') {
      // ── CỔNG 3D CƠ BẢN: chọn → kéo (di/push-pull) → xoá → hoàn tác, đo bằng STORE THẬT ──
      // GIEO MẦM: hồ sơ Playwright là trắng tinh (Doc 3D nằm ở IndexedDB của TỪNG trình duyệt,
      // không ở DB máy chủ) ⇒ cảnh trống. Tạo sẵn một bức tường bằng LỆNH SỐ đang có, để phép
      // thử chọn/kéo/xoá/hoàn tác đứng độc lập, chạy lại từ số 0 lần nào cũng ra như nhau.
      let n0 = await entityCount(page);
      if (!n0) {
        const openCmd = page.locator('button[title="Mở bảng lệnh 3D"]').first();
        if (await openCmd.count().catch(() => 0)) { await openCmd.click().catch(() => {}); await page.waitForTimeout(1000); }
        // "Thêm tường" = nút mở form tường trong tab Tạo (khác nút "Tường" ở dock công cụ).
        const wall = page.locator('button', { hasText: /Thêm tường/ }).first();
        if (await wall.count().catch(() => 0)) { await wall.click().catch(() => {}); await page.waitForTimeout(1400); }
        const make = page.locator('button', { hasText: /^Tạo tường$/ }).first();
        if (await make.count().catch(() => 0)) { await make.click().catch(() => {}); await page.waitForTimeout(1800); }
        else {
          log.push(`DEBUG nút sau khi mở form: ${JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => (b.textContent || '').trim()).filter((t) => t && t.length < 20).slice(0, 40)))}`);
        }
        n0 = await entityCount(page);
        log.push(`gieo mầm tường (lệnh số) → entities: ${n0}`);
        const fit2 = page.locator('button.fitbtn').first();
        if (await fit2.count().catch(() => 0)) { await fit2.click().catch(() => {}); await page.waitForTimeout(1400); }
      }
      log.push(`entities ban đầu: ${n0}`);

      // CHỌN bằng con trỏ thật — QUÉT LƯỚI thay vì đoán một điểm: sau `fit` khối nằm đâu trong
      // khung là do camera quyết, đoán giữa màn là cách chắc chắn trượt (đã trượt 2 lượt). Dừng
      // ngay khi Inspector báo đã chọn — đó là tín hiệu THẬT của app, không phải suy từ pixel.
      let hitAt = null;
      outer: for (const fy of [0.42, 0.5, 0.58, 0.34]) {
        for (const fx of [0.5, 0.42, 0.58, 0.34, 0.66]) {
          const px = box.x + box.w * fx;
          const py = box.y + box.h * fy;
          await page.mouse.move(px, py);
          await page.mouse.down();
          await page.mouse.up();
          await page.waitForTimeout(450);
          const t = await inspectorText(page);
          if (/Đã chọn trong khung nhìn|TƯỜNG\s*\|\s*Cao/.test(t)) { hitAt = { fx, fy, px, py }; break outer; }
        }
      }
      log.push(`CHỌN: ${hitAt ? `trúng tại ${hitAt.fx}/${hitAt.fy}` : 'KHÔNG trúng khối nào'}`);
      if(!hitAt){ await page.screenshot({path:'/Users/tranben/Downloads/interiorflow/present-demo/screens/_debug-no-hit.png'}); log.push('đã chụp _debug-no-hit.png'); }
      if (hitAt) { cx = hitAt.px; cy = hitAt.py; }
      await page.waitForTimeout(600);
      const sel = await page.evaluate(() => {
        try {
          return window.__cadStore ? null : null;
        } catch {
          return null;
        }
      });
      void sel;
      log.push(`CHỌN → inspector: ${JSON.stringify(await inspectorText(page))}`);

      // KÉO thật: giữ chuột trên khối, di lên (push/pull mặt trên hoặc gizmo)
      const doc0 = await docSnapshot(page);
      const h0 = await sceneHash(page);
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      for (let i = 1; i <= 14; i++) {
        await page.mouse.move(cx, cy - i * 7);
        await page.waitForTimeout(35);
      }
      await page.mouse.up();
      await page.waitForTimeout(1500);
      const doc1 = await docSnapshot(page);
      const hChanged = JSON.stringify(doc0.map((e) => e.h)) !== JSON.stringify(doc1.map((e) => e.h));
      const pChanged = JSON.stringify(doc0.map((e) => e.p)) !== JSON.stringify(doc1.map((e) => e.p));
      log.push(
        `KÉO: pixel đổi=${h0 !== (await sceneHash(page))} · CAO ĐỘ đổi=${hChanged} · VỊ TRÍ đổi=${pChanged}` +
          ` → ${hChanged || pChanged ? 'ĐỔI KHỐI THẬT (không phải xoay máy ảnh)' : 'CHỈ máy ảnh đổi, khối không đụng'}`,
      );
      log.push(`  cao độ: ${JSON.stringify(doc0.map((e) => e.h))} → ${JSON.stringify(doc1.map((e) => e.h))}`);

      // NUDGE: gizmo hiện tại KHÔNG kéo được — mỗi trục là một nút "dời 100mm" (Viewport3D.tsx
      // onNudge). Kiểm đúng thứ đang có, thay vì kết luận "Move hỏng" khi thực ra Move chưa từng
      // là thao tác kéo.
      const gizX = page.locator('g[aria-label="Kéo theo trục X"]').first();
      const docN0 = await docSnapshot(page);
      if (await gizX.count().catch(() => 0)) {
        await gizX.click().catch(() => {});
        await page.waitForTimeout(1200);
        const docN1 = await docSnapshot(page);
        const moved = JSON.stringify(docN0.map((e) => e.p)) !== JSON.stringify(docN1.map((e) => e.p));
        log.push(`NUDGE trục X (nút 100mm): vị trí đổi=${moved} · ${JSON.stringify(docN0.map((e) => e.p))} → ${JSON.stringify(docN1.map((e) => e.p))}`);
      } else {
        log.push('NUDGE: KHÔNG thấy gizmo trục X trên màn');
      }

      // XOÁ qua thanh lệnh (mở "Thêm" rồi bấm Xoá)
      const them = page.locator('button', { hasText: /^Thêm$/ }).first();
      if (await them.count().catch(() => 0)) { await them.click().catch(() => {}); await page.waitForTimeout(700); }
      const del = page.locator('button[title="Xoá"], button[aria-label="Xoá"]').first();
      if (await del.count().catch(() => 0)) {
        await del.click().catch(() => {});
        await page.waitForTimeout(1400);
      }
      const doc2 = await docSnapshot(page);
      const n1 = doc2.length;
      const goneIds = doc1.filter((a) => !doc2.some((b) => b.id === a.id)).map((e) => e.id);
      // Đường 3D xoá ĐÚNG MỘT entity (id đang chọn); đường 2D `deleteSelected()` xoá theo
      // `useCadStore.selection` nên thường cuốn cả cụm ⇒ số id biến mất là dấu hiệu phân biệt.
      log.push(`XOÁ: ${n0} → ${n1} · số khối biến mất=${goneIds.length} → ${goneIds.length === 1 ? 'ĐI ĐƯỜNG 3D (đúng khối đang chọn)' : 'đi đường 2D/cụm'}`);

      // HOÀN TÁC
      const undo = page.locator('button[title*="Hoàn tác"], button[aria-label*="Hoàn tác"]').first();
      if (await undo.count().catch(() => 0)) { await undo.click().catch(() => {}); await page.waitForTimeout(1400); }
      const n2 = await entityCount(page);
      log.push(`HOÀN TÁC: ${n1} → ${n2} (khôi phục=${n2 === n0})`);
    }

    if (cmd === 'probe' || cmd === 'drag') {
      // 1) CHỌN bằng con trỏ thật
      const before = await sceneHash(page);
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.up();
      await page.waitForTimeout(1200);
      const insp = await inspectorText(page);
      log.push(`select → inspector: ${JSON.stringify(insp.split('\n').slice(0, 4).join(' | '))}`);

      // 2) KÉO thật (push/pull hoặc gizmo) — giữ chuột, di từng bước như tay người
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      for (let i = 1; i <= 12; i++) {
        await page.mouse.move(cx + i * 8, cy - i * 6);
        await page.waitForTimeout(35);
      }
      await page.mouse.up();
      await page.waitForTimeout(1500);
      const after = await sceneHash(page);
      log.push(`drag: sceneChanged=${before !== after} (${before} → ${after})`);
      log.push(`after-drag inspector: ${JSON.stringify((await inspectorText(page)).split('\n').slice(0, 4).join(' | '))}`);
    }

    if (cmd === 'shot') {
      const name = process.argv[3] || 'shot';
      await page.screenshot({ path: path.join(OUT, `${name}.png`) });
      log.push(`shot saved: ${name}.png`);
    }
  } catch (e) {
    log.push(`ERROR: ${e.message}`);
  } finally {
    console.log(log.join('\n'));
    await browser.close();
  }
}
main();
