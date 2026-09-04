#!/usr/bin/env node
/**
 * scripts/kiem-3d-contro-that.js — BỘ ĐO TRÊN APP THẬT bằng CON TRỎ THẬT (Playwright).
 *
 * VÌ SAO CẦN TỆP NÀY (giữ nguyên lý do của bản 24/08, đã kiểm lại còn đúng):
 * pointer TỔNG HỢP (`element.dispatchEvent(new PointerEvent(...))`) KHÔNG giữ được
 * `setPointerCapture` — mà cả push/pull, gizmo lẫn CỬ CHỈ DỰNG KHỐI của IF đều dựa vào capture
 * (`Scene3DViewer.onPointerDown` → `setPointerCapture`, nhả ở `onPointerUp`). Mọi phép kéo giả
 * bằng JS vì thế thất bại VÌ CÔNG CỤ THỬ, không phải vì app. `page.mouse.*` của Playwright phát
 * sự kiện ở tầng CDP nên là sự kiện TIN CẬY: capture chạy y như tay người, kể cả headless.
 *
 * ⚠️ THAM SỐ HOÁ (04/09) — bản cũ gõ cứng đường dẫn máy tác giả (`/Users/tranben/...`), một
 * `projectId` cụ thể và MẬT KHẨU DEMO TRONG MÃ. Nay tất cả ra biến môi trường; mật khẩu KHÔNG có
 * giá trị mặc định và KHÔNG được ghi vào tệp này — thiếu thì script dừng và nói cách truyền.
 *
 * ⚠️ MỘT GIỚI HẠN PHẢI BIẾT TRƯỚC KHI ĐỌC SỐ: `window.__cadStore` chỉ được gắn khi
 * `process.env.NODE_ENV === 'development'` (`lib/cad/store.ts:926`). Chạy trên BẢN DỰNG THẬT
 * (`next build` + `next start`) thì KHÔNG có nó ⇒ bộ đo này lấy bằng chứng từ thứ NGƯỜI DÙNG
 * NHÌN THẤY: nhãn khung nhìn (`.vplabel` — "Không gian trống" ↔ "Khối xám · chưa vật liệu"),
 * cây đối tượng, Inspector, và ẢNH CHỤP so từng điểm ảnh. Ở đâu đọc được `__cadStore` thì ghi
 * thêm, và ghi rõ nguồn nào đã dùng. Đo bằng mắt máy còn ĐÚNG HƠN đọc kho: kho có dữ liệu mà
 * màn hình không hiện thì vẫn là hỏng.
 *
 * BIẾN MÔI TRƯỜNG
 *   IF_BASE       gốc máy chủ            (mặc định http://localhost:3132)
 *   IF_EMAIL      tài khoản kiểm thử     (mặc định kiem@localhost.test)
 *   IF_MATKHAU    mật khẩu — BẮT BUỘC, không có mặc định, không ghi trong mã
 *   IF_DU_AN      id dự án; trống thì tự tạo và nhớ ở <SHOT_DIR>/du-an.txt
 *   IF_SHOT_DIR   nơi để ảnh + JSON      (mặc định <repo>/.nen-chrome-out — đã gitignore)
 *   IF_DPR        deviceScaleFactor      (mặc định 2 — lỗi cắt cụt viewport CHỈ phát ở retina)
 *   IF_CHROMIUM   đường dẫn Chromium     (mặc định /opt/pw-browsers/chromium)
 *   IF_HEADED=1   hiện cửa sổ trình duyệt
 *
 * CHẠY:  IF_MATKHAU=... node scripts/kiem-3d-contro-that.js <lệnh>
 *   probe        đăng nhập, vào 3D, báo trạng thái
 *   cu-chi       (1) dựng khối bằng cử chỉ: kéo trên mặt sàn · hoàn tác · kéo quá nhỏ
 *   chon-xoa     (2) chọn khối nhiều mặt · viền hộp bao NHÌN THẤY ĐƯỢC · lệnh Xoá
 *   retina       (3) canvas viewport có bị cắt trên DPR cao không
 *   to-present   (4) tờ bản vẽ 2D → Trình chiếu, và sống qua lần tải lại trang
 *   hep          (5) hàng tab bản vẽ ở khổ desktop hẹp (1280×800 · 1152×720)
 *   tat-ca       chạy cả năm
 */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const GOC = path.resolve(__dirname, '..');
const BASE = process.env.IF_BASE || 'http://localhost:3132';
const EMAIL = process.env.IF_EMAIL || 'kiem@localhost.test';
const MATKHAU = process.env.IF_MATKHAU || '';
const OUT = process.env.IF_SHOT_DIR || path.join(GOC, '.nen-chrome-out');
const DPR = Number(process.env.IF_DPR || 2);
const CHROME = process.env.IF_CHROMIUM || '/opt/pw-browsers/chromium';
const HEADED = process.env.IF_HEADED === '1';

if (!MATKHAU) {
  console.error('✖ thiếu IF_MATKHAU. Mật khẩu KHÔNG được ghi trong mã — truyền qua môi trường:');
  console.error('  IF_MATKHAU="<mật khẩu tài khoản kiểm thử>" node scripts/kiem-3d-contro-that.js <lệnh>');
  process.exit(2);
}
fs.mkdirSync(OUT, { recursive: true });

/* ── tiện ích ──────────────────────────────────────────────────────────────────────────────── */
const so = (n) => Math.round(n * 100) / 100;
/** {x,y,w,h} của app → {x,y,width,height} mà Playwright đòi. Trộn hai khuôn là lỗi đã dính. */
const cat = (b) => ({ x: b.x, y: b.y, width: b.w, height: b.h });
function ghiJson(ten, data) {
  const p = path.join(OUT, `${ten}.json`);
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
  return path.relative(GOC, p);
}
async function chup(page, ten, clip) {
  const p = path.join(OUT, `${ten}.png`);
  await page.screenshot({ path: p, clip });
  return path.relative(GOC, p);
}

/** So HAI ảnh theo TỪNG ĐIỂM ẢNH — dùng để chứng minh một thứ có THẬT SỰ HIỆN RA hay không.
 *  Băm ảnh chỉ nói "có đổi"; đếm điểm ảnh nói "đổi bao nhiêu, ở đâu" — cần cho câu hỏi
 *  "viền hộp bao có nhìn thấy được không". */
async function soDiemAnh(bufA, bufB) {
  const sharp = require('sharp');
  const a = await sharp(bufA).raw().toBuffer({ resolveWithObject: true });
  const b = await sharp(bufB).raw().toBuffer({ resolveWithObject: true });
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) return { loi: 'khác cỡ' };
  const ch = a.info.channels;
  let khac = 0;
  let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;
  for (let i = 0, px = 0; i < a.data.length; i += ch, px += 1) {
    const d = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
    if (d > 24) {
      khac += 1;
      const x = px % a.info.width, y = (px / a.info.width) | 0;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const tong = a.info.width * a.info.height;
  return {
    diemKhac: khac,
    tong,
    tyLe: so((khac / tong) * 100),
    hop: maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 },
  };
}

/**
 * Đếm điểm ảnh MÀU NHẤN `#6a57f5` (106,87,245) — màu `Box3Helper` của viền hộp bao khi chọn khối
 * (`Scene3DViewer.tsx:505`). Đây là phép đo TRỰC TIẾP cho câu "viền có NHÌN THẤY ĐƯỢC không";
 * so-toàn-ảnh KHÔNG trả lời được câu đó vì hiệu ứng chọn còn kéo theo `fitCameraToScene` (hàm
 * dựng lại cảnh phụ thuộc `selectedId`) làm đổi gần hết khung hình vì lý do khác.
 * Cắt bỏ dải trên 18% (nhãn · ViewCube · nút Toàn cảnh) và dải dưới 25% (dock công cụ có nút tím
 * đang hoạt động) để không đếm nhầm chrome.
 */
async function demMauNhan(buf, w, h) {
  const sharp = require('sharp');
  const y0 = Math.round(h * 0.18), y1 = Math.round(h * 0.75);
  const { data, info } = await sharp(buf)
    .extract({ left: 0, top: y0, width: Math.round(w), height: Math.max(1, y1 - y0) })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let n = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    // dung sai rộng: đường 1px bị khử răng cưa nên hiếm khi trúng đúng giá trị gốc
    if (Math.abs(data[i] - 106) < 60 && Math.abs(data[i + 1] - 87) < 60 && Math.abs(data[i + 2] - 245) < 45 && data[i + 2] - data[i] > 60) n += 1;
  }
  return n;
}

/** Số khối theo CÂY ĐỐI TƯỢNG — huy hiệu đếm cạnh tên tầng (`Object3DTree.tsx:133`). Đây là con
 *  số NGƯỜI DÙNG ĐỌC ĐƯỢC, và là thứ duy nhất phân biệt "xoá 1 trong 2 khối" với "không xoá gì"
 *  (nhãn khung nhìn quá thô: còn 1 khối thì vẫn ghi "Khối xám"). */
async function soKhoiTrenCay(page) {
  return page.evaluate(() => {
    const s = [...document.querySelectorAll('span')].filter(
      (x) => /font-mono/.test(String(x.className || '')) && /^\d+$/.test((x.textContent || '').trim()),
    );
    return s.length ? s.reduce((a, x) => a + Number(x.textContent.trim()), 0) : 0;
  });
}

async function moTrinhDuyet(viewport) {
  const browser = await chromium.launch({
    headless: !HEADED,
    executablePath: CHROME,
    // swiftshader: máy kiểm không có GPU; WebGL2 vẫn chạy (đã đo: "WebGL 2.0 (OpenGL ES 3.0)").
    args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  const ctx = await browser.newContext({
    viewport: viewport || { width: 1600, height: 1000 },
    deviceScaleFactor: DPR,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => loiTrang.push(String(e).slice(0, 200)));
  return { browser, ctx, page };
}
const loiTrang = [];


/**
 * Điều hướng CHẮC TAY. Next hay huỷ lượt đi đang chạy khi một `router.replace` phía client nổ ra
 * cùng lúc (`net::ERR_ABORTED`) — không phải lỗi app, nhưng làm bộ đo chết oan. Thử lại tối đa 3
 * lượt rồi mới chịu thua, và luôn xác nhận bằng URL cuối chứ không tin lượt goto.
 */
async function diToi(page, url, cho = 3000) {
  for (let i = 0; i < 3; i += 1) {
    await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(cho);
    if (page.url().startsWith(url.split('?')[0])) return true;
  }
  return page.url().startsWith(url.split('?')[0]);
}

/** Đăng nhập qua chính API của app (cookie vào đúng context trình duyệt). */
async function dangNhap(page) {
  // ⚠️ PHẢI vào một TRANG THẬT của app trước (không phải `/favicon.ico` như bản cũ): đứng ở
  // trang 404 của tài nguyên tĩnh rồi điều hướng tiếp thì Next huỷ luôn lượt đi
  // (`net::ERR_ABORTED`) và trình duyệt nằm lại chỗ cũ — đã dính, mất một vòng đo.
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  // Hồ sơ trình duyệt trắng tinh sẽ bị đẩy sang /intro; người dùng thật đã xem từ lâu. Đặt cờ là
  // đi thẳng — không phải sửa app cho hợp bộ kiểm.
  await page.evaluate(() => { try { localStorage.setItem('if_intro_seen_v1', '1'); } catch {} }).catch(() => {});
  const ma = await page.evaluate(
    ({ e, m }) =>
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier: e, password: m }),
      }).then((r) => r.status).catch(() => 0),
    { e: EMAIL, m: MATKHAU },
  );
  if (ma !== 200) throw new Error(`đăng nhập thất bại (HTTP ${ma}) — kiểm IF_EMAIL/IF_MATKHAU`);

  /**
   * ⚠️ BƯỚC NÀY KHÔNG THỪA — thiếu nó là bộ đo TỰ TẠO RA một lỗi không có thật (đã dính, và suýt
   * ghi thành lỗi sản phẩm).
   *
   * App có HAI nguồn cho "ai đang đăng nhập": ① cookie phiên (máy chủ cấp, `/api/auth/login` ở
   * trên đã có) ② `localStorage['interiorflow.lastUserId']` — và **lớp LƯU TRỮ bám vào nguồn ②**:
   * `PresentSheets.tsx:322` mở bằng `getLastUserId()`, rỗng thì `:335-338` rẽ nhánh THUẦN
   * IN-MEMORY và `saveSheets()` chặn ngay dòng đầu ⇒ không ghi IndexedDB dòng nào, tải lại là
   * trắng. Khoá ② chỉ được ghi ở `LoginForm.tsx:135` (đăng nhập BẰNG BIỂU MẪU) và
   * `HomeScreen.tsx:264` (ghé Home).
   *
   * Đăng nhập bằng API rồi vào thẳng `/projects/<id>/present` ⇒ cookie hợp lệ, app chạy bình
   * thường, nhưng ② rỗng ⇒ đo ra "mất hồ sơ khi tải lại" trong khi người dùng thật (đăng nhập
   * bằng biểu mẫu) KHÔNG gặp. Ghé Home một lượt để ② được ghi, đưa bộ đo về đúng trạng thái của
   * người dùng thật. Đo xong xác nhận `lastUserId` có giá trị, không tin suông.
   */
  await diToi(page, `${BASE}/`, 4000);
  for (let i = 0; i < 8; i += 1) {
    const uid = await page.evaluate(() => { try { return localStorage.getItem('interiorflow.lastUserId'); } catch { return null; } });
    if (uid) return true;
    await page.waitForTimeout(800);
  }
  console.log('⚠ lastUserId vẫn rỗng sau khi ghé Home — lớp lưu trữ sẽ chạy in-memory, số đo về "tải lại" KHÔNG đáng tin');
  return true;
}

/** Dự án để kiểm. Ưu tiên IF_DU_AN → tệp nhớ → tạo mới qua ĐÚNG đường app dùng (POST /api/flows). */
async function baoDamDuAn(page) {
  if (process.env.IF_DU_AN) return process.env.IF_DU_AN;
  const nho = path.join(OUT, 'du-an.txt');
  if (fs.existsSync(nho)) {
    const id = fs.readFileSync(nho, 'utf8').trim();
    // Thử LẠI vài lượt: ngay sau đăng nhập, trang /login hay tự điều hướng, và một `fetch` rơi
    // đúng lúc đó trả lỗi mạng — tin lượt đầu là đẻ thêm một dự án rác mỗi lần chạy (đã dính).
    for (let i = 0; i < 3 && id; i += 1) {
      const ok = await page
        .evaluate((x) => fetch(`/api/projects/${x}/overview`).then((r) => r.ok).catch(() => null), id)
        .catch(() => null);
      if (ok === true) return id;
      if (ok === false) break; // trả lời rõ ràng là "không còn/không thấy" ⇒ tạo mới
      await page.waitForTimeout(800);
    }
  }
  const id = await page.evaluate(() =>
    fetch('/api/flows', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'project', name: 'KIỂM APP THẬT 04/09' }),
    })
      .then((r) => r.json())
      .then((j) => j?.project?.id || '')
      .catch(() => ''),
  );
  if (!id) throw new Error('không tạo được dự án kiểm thử');
  fs.writeFileSync(nho, id);
  return id;
}

/** Vào chặng 3D, bật mode "Vẽ 3D", đợi canvas WebGL. */
async function mo3D(page, duAn) {
  await diToi(page, `${BASE}/projects/${duAn}/render`, 3500);
  const ve3d = page.locator('button[title^="Vẽ 3D"]').first();
  if (await ve3d.count().catch(() => 0)) { await ve3d.click().catch(() => {}); await page.waitForTimeout(3500); }
  const dong = page.locator('button[aria-label="Đóng Thư viện"]').first();
  if (await dong.count().catch(() => 0)) { await dong.click().catch(() => {}); await page.waitForTimeout(600); }
  await page
    .waitForFunction(() => [...document.querySelectorAll('canvas')].some((c) => c.width > 500), null, { timeout: 30000 })
    .catch(() => {});
  await page.waitForTimeout(1200);
}

/** Hộp của canvas viewport LỚN NHẤT (canvas nhỏ là ViewCube). */
async function hopViewport(page) {
  return page.evaluate(() => {
    const c = [...document.querySelectorAll('canvas')].sort((a, b) => (b.width || 0) - (a.width || 0))[0];
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });
}

/** Nhãn khung nhìn — tín hiệu NGƯỜI DÙNG NHÌN THẤY cho "cảnh có khối hay không"
 *  (`Render3DModeSkeleton.tsx:584`). */
async function nhanKhungNhin(page) {
  return page.evaluate(() => document.querySelector('.vplabel')?.textContent?.trim() || '');
}

/** Số khối theo cây đối tượng + kho (kho chỉ có ở bản dev). Trả cả hai để biết nguồn nào đã nói. */
async function trangThaiKhoi(page) {
  return page.evaluate(() => {
    const w = window;
    let kho = null;
    try { kho = w.__cadStore?.getState?.().doc?.entities?.length ?? null; } catch {}
    const nhan = document.querySelector('.vplabel')?.textContent?.trim() || '';
    return { kho, nhan, coKhoiTheoNhan: /Khối xám/i.test(nhan) };
  });
}

/** Kéo bằng CON TRỎ THẬT. steps cao để app nhận đủ pointermove (xem trước cử chỉ cần chúng). */
async function keo(page, x1, y1, x2, y2, steps = 24) {
  await page.mouse.move(x1, y1);
  await page.waitForTimeout(120);
  await page.mouse.down();
  await page.waitForTimeout(120);
  await page.mouse.move(x2, y2, { steps });
  await page.waitForTimeout(180);
  await page.mouse.up();
  await page.waitForTimeout(900);
}

/* ── (1) CỬ CHỈ DỰNG KHỐI ──────────────────────────────────────────────────────────────────── */
async function lenhCuChi(page, duAn) {
  const kq = { muc: '1 · dựng khối bằng cử chỉ 3D', anh: [], doDuoc: {} };
  await mo3D(page, duAn);
  const box = await hopViewport(page);
  kq.doDuoc.viewport = box ? `${so(box.w)}×${so(box.h)}` : null;
  if (!box) { kq.ketQua = 'KHÔNG ĐO ĐƯỢC'; kq.vuong = 'không tìm thấy canvas viewport'; return kq; }

  kq.doDuoc.nhanTruoc = await nhanKhungNhin(page);
  kq.anh.push(await chup(page, '1a-truoc-khi-dung'));

  // Lối chính của màn 3D rỗng: nút "Bắt đầu trong 3D" đóng card chào + cầm sẵn công cụ tường.
  const batDau = page.locator('button', { hasText: /Bắt đầu trong 3D|Start in 3D/ }).first();
  kq.doDuoc.coNutBatDau = (await batDau.count().catch(() => 0)) > 0;
  if (kq.doDuoc.coNutBatDau) { await batDau.click().catch(() => {}); await page.waitForTimeout(1500); }

  const box2 = (await hopViewport(page)) || box;
  const cx = box2.x + box2.w * 0.5;
  const cy = box2.y + box2.h * 0.62; // thấp hơn tâm: chắc chắn rơi trên MẶT SÀN, không phải chân trời

  // ① kéo THẬT — mong đợi: nhãn đổi sang "Khối xám · chưa vật liệu"
  const anhTruoc = await page.screenshot({ clip: cat(box2) });
  await keo(page, cx - box2.w * 0.16, cy, cx + box2.w * 0.16, cy - box2.h * 0.06);
  await page.waitForTimeout(1200);
  const sauKeo = await trangThaiKhoi(page);
  kq.doDuoc.sauKhiKeo = sauKeo;
  kq.anh.push(await chup(page, '1b-sau-khi-keo'));
  const anhSau = await page.screenshot({ clip: cat(box2) });
  kq.doDuoc.doiHinh = await soDiemAnh(anhTruoc, anhSau);

  const daTao = sauKeo.coKhoiTheoNhan || (sauKeo.kho !== null && sauKeo.kho > 0);
  kq.doDuoc.khoiDaSinh = daTao;

  // ② HOÀN TÁC
  if (daTao) {
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(1600);
    const sauUndo = await trangThaiKhoi(page);
    kq.doDuoc.sauHoanTac = sauUndo;
    kq.doDuoc.hoanTacLuiDuoc = !sauUndo.coKhoiTheoNhan && (sauUndo.kho === null || sauUndo.kho === 0);
    kq.anh.push(await chup(page, '1c-sau-hoan-tac'));
  }

  // ③ KÉO QUÁ NHỎ — ngưỡng MIN_KICH_THUOC_MM = 20mm. Không đọc được kho ở bản dựng thật nên đo
  //    theo thứ nhìn thấy: kéo 1 điểm ảnh KHÔNG được sinh khối. Kèm ước lượng mm/điểm-ảnh suy từ
  //    cú kéo lớn ở trên để nói rõ 1px tương ứng bao nhiêu mm — nếu 1px ≥ 20mm thì phép thử này
  //    KHÔNG kết luận được về ngưỡng, và phải khai đúng như vậy.
  if (kq.doDuoc.coNutBatDau) {
    const lai = page.locator('button', { hasText: /Bắt đầu trong 3D|Start in 3D/ }).first();
    if (await lai.count().catch(() => 0)) { await lai.click().catch(() => {}); await page.waitForTimeout(1200); }
  }
  const nhanTruocNho = await nhanKhungNhin(page);
  await keo(page, cx, cy, cx + 1, cy, 2);
  await page.waitForTimeout(1000);
  const sauNho = await trangThaiKhoi(page);
  kq.doDuoc.keoQuaNho = { nhanTruoc: nhanTruocNho, nhanSau: sauNho.nhan, kho: sauNho.kho };
  kq.doDuoc.keoNhoBiHuy = sauNho.nhan === nhanTruocNho;
  kq.anh.push(await chup(page, '1d-keo-qua-nho'));

  kq.ketQua = daTao ? (kq.doDuoc.hoanTacLuiDuoc === false ? 'FAIL' : 'PASS') : 'FAIL';
  return kq;
}

/* ── (2) CHỌN · VIỀN HỘP BAO · XOÁ ─────────────────────────────────────────────────────────── */
async function lenhChonXoa(page, duAn) {
  const kq = { muc: '2 · chọn / viền hộp bao / xoá khối 3D', anh: [], doDuoc: {} };
  await mo3D(page, duAn);
  let box = await hopViewport(page);
  if (!box) { kq.ketQua = 'KHÔNG ĐO ĐƯỢC'; kq.vuong = 'không có canvas'; return kq; }

  // cần MỘT khối để chọn — dựng bằng chính cử chỉ vừa kiểm ở mục 1
  if (!(await trangThaiKhoi(page)).coKhoiTheoNhan) {
    /* Cầm công cụ tường. HAI đường, vì đường thứ nhất chỉ tồn tại LẦN ĐẦU: nút "Bắt đầu trong 3D"
       nằm trên card chào, mà card chào đã đóng thì không quay lại (mục 1 chạy trước trong lượt
       `tat-ca` đã đóng nó) ⇒ mục này từng báo KHÔNG ĐO ĐƯỢC vì thừa hưởng trạng thái của mục
       trước. Đường thứ hai — nút `Wall` ở bảng lệnh trái — luôn có. */
    const batDau = page.locator('button', { hasText: /Bắt đầu trong 3D|Start in 3D/ }).first();
    if (await batDau.count().catch(() => 0)) { await batDau.click().catch(() => {}); await page.waitForTimeout(1400); }
    else {
      const wall = page.locator('button', { hasText: /^\s*Wall/ }).first();
      if (await wall.count().catch(() => 0)) { await wall.click().catch(() => {}); await page.waitForTimeout(1200); }
    }
    box = (await hopViewport(page)) || box;
    const cx = box.x + box.w * 0.5, cy = box.y + box.h * 0.62;
    await keo(page, cx - box.w * 0.16, cy, cx + box.w * 0.16, cy - box.h * 0.06);
    await page.waitForTimeout(1400);
  }
  kq.doDuoc.coKhoiDeChon = (await trangThaiKhoi(page)).coKhoiTheoNhan;
  if (!kq.doDuoc.coKhoiDeChon) { kq.ketQua = 'KHÔNG ĐO ĐƯỢC'; kq.vuong = 'không dựng được khối để chọn'; return kq; }

  const fit = page.locator('button.fitbtn').first();
  if (await fit.count().catch(() => 0)) { await fit.click().catch(() => {}); await page.waitForTimeout(1400); }
  box = (await hopViewport(page)) || box;
  kq.doDuoc.soKhoiBanDau = await soKhoiTrenCay(page);
  kq.anh.push(await chup(page, '2a-truoc-khi-chon', cat(box)));
  const anhChuaChon = await page.screenshot({ clip: cat(box) });
  kq.doDuoc.mauNhanTruocChon = await demMauNhan(anhChuaChon, box.w * DPR, box.h * DPR);

  // Quét NHIỀU ĐIỂM để chạm cả mặt đỉnh lẫn mặt đứng — mục tiêu là chứng minh KHÔNG chỉ mặt trên
  // mới bấm được. Ghi lại mọi điểm đã thử, kể cả điểm trượt.
  const diem = [];
  let daChon = false;
  for (const fy of [0.40, 0.48, 0.56, 0.64]) {
    for (const fx of [0.36, 0.46, 0.56, 0.66]) {
      await page.mouse.click(box.x + box.w * fx, box.y + box.h * fy);
      await page.waitForTimeout(480);
      const trung = await page.evaluate(() => /Đã chọn trong khung nhìn/.test(document.body.innerText || ''));
      diem.push({ fx, fy, trung });
      if (trung) { daChon = true; break; }
    }
    if (daChon) break;
  }
  kq.doDuoc.quetChon = diem;
  kq.doDuoc.soDiemDaThu = diem.length;
  kq.doDuoc.chonDuoc = daChon;
  kq.anh.push(await chup(page, '2b-sau-khi-chon', cat(box)));

  // VIỀN HỘP BAO — đếm điểm ảnh MÀU NHẤN, không so cả khung hình (xem docstring `demMauNhan`).
  const anhDaChon = await page.screenshot({ clip: cat(box) });
  kq.doDuoc.mauNhanSauChon = await demMauNhan(anhDaChon, box.w * DPR, box.h * DPR);
  kq.doDuoc.vienHopBaoThemDiem = kq.doDuoc.mauNhanSauChon - kq.doDuoc.mauNhanTruocChon;
  kq.doDuoc.vienHopBaoNhinThayDuoc = kq.doDuoc.vienHopBaoThemDiem > 500;

  // LỆNH XOÁ — đo RIÊNG hai mặt tiền, vì chúng có thể hỏng độc lập:
  //   ① PHÍM `Delete`  ② CHIP "Xoá" trên thanh công cụ
  const docChip = () =>
    page.evaluate(() => {
      const b = [...document.querySelectorAll('button,[role="button"]')].find(
        (e) => /^(Xoá|Delete)$/i.test(((e.getAttribute('aria-label') || e.textContent || '')).trim()),
      );
      if (!b) return { co: false };
      return { co: true, moDi: b.getAttribute('aria-disabled') === 'true' || !!b.disabled };
    });
  kq.doDuoc.chipXoaKhiDangChon = await docChip();

  const truoc = await soKhoiTrenCay(page);
  await page.keyboard.press('Delete');
  await page.waitForTimeout(1600);
  const sauPhim = await soKhoiTrenCay(page);
  kq.doDuoc.xoaBangPhim = { truoc, sau: sauPhim, chay: sauPhim < truoc };
  kq.anh.push(await chup(page, '2c-sau-phim-delete', cat(box)));

  // Chip chỉ được thử KHI phím đã trượt — để biết "hỏng cả hai" hay "chỉ hỏng đường bàn phím".
  if (kq.doDuoc.xoaBangPhim.chay) {
    kq.doDuoc.xoaBangChip = { thu: false, lyDo: 'phím đã xoá được, không cần thử tới chip' };
  } else {
    const chip = page.locator('[aria-label="Xoá"]').first();
    const coChip = (await chip.count().catch(() => 0)) > 0;
    if (coChip) { await chip.click({ force: true }).catch(() => {}); await page.waitForTimeout(1600); }
    const sauChip = await soKhoiTrenCay(page);
    kq.doDuoc.xoaBangChip = { thu: true, coChip, sau: sauChip, chay: coChip && sauChip < truoc };
  }
  kq.doDuoc.nhanSauXoa = await nhanKhungNhin(page);
  kq.doDuoc.xoaDuoc = kq.doDuoc.xoaBangPhim.chay || kq.doDuoc.xoaBangChip.chay === true;
  kq.anh.push(await chup(page, '2d-sau-khi-xoa', cat(box)));

  // PASS đòi ĐỦ BA: chọn được · viền hộp bao hiện ra · xoá chạy BẰNG PHÍM. Cố ý tính phím vào
  // điều kiện: chip chạy mà phím câm vẫn là năng lực hụt một mặt tiền đã khai (`key:['Delete']`).
  kq.ketQua = kq.doDuoc.chonDuoc && kq.doDuoc.vienHopBaoNhinThayDuoc && kq.doDuoc.xoaBangPhim.chay ? 'PASS' : 'FAIL';
  return kq;
}

/* ── (3) VIEWPORT TRÊN MÀN RETINA ──────────────────────────────────────────────────────────── */
async function lenhRetina(page, duAn) {
  const kq = { muc: '3 · viewport 3D không bị cắt trên retina', anh: [], doDuoc: { dpr: DPR } };
  await mo3D(page, duAn);
  const d = await page.evaluate(() => {
    const c = [...document.querySelectorAll('canvas')].sort((a, b) => (b.width || 0) - (a.width || 0))[0];
    if (!c) return null;
    const oc = c.closest('.vpscene') || c.parentElement;
    const ov = c.closest('.vp3d') || oc;
    const r = c.getBoundingClientRect();
    const rc = oc.getBoundingClientRect();
    const rv = ov.getBoundingClientRect();
    const cs = getComputedStyle(c);
    return {
      dprThat: window.devicePixelRatio,
      canvasHienThi: { w: r.width, h: r.height },
      canvasBoDem: { w: c.width, h: c.height },
      oChua: { w: rc.width, h: rc.height },
      khungNgoai: { w: rv.width, h: rv.height },
      cssWidth: cs.width, cssHeight: cs.height, display: cs.display,
    };
  });
  if (!d) { kq.ketQua = 'KHÔNG ĐO ĐƯỢC'; kq.vuong = 'không có canvas'; return kq; }
  const tranW = so(d.canvasHienThi.w - d.oChua.w);
  const tranH = so(d.canvasHienThi.h - d.oChua.h);
  kq.doDuoc = {
    ...kq.doDuoc, ...d,
    tranNgang: tranW, tranDoc: tranH,
    tyLeBoDem: so(d.canvasBoDem.w / Math.max(1, d.canvasHienThi.w)),
  };
  // Khớp = hiển thị bằng ô chứa (sai số ≤1px do làm tròn bố cục).
  kq.doDuoc.khop = Math.abs(tranW) <= 1 && Math.abs(tranH) <= 1;
  kq.anh.push(await chup(page, '3a-viewport-retina'));
  kq.ketQua = kq.doDuoc.khop ? 'PASS' : 'FAIL';
  return kq;
}


/**
 * Chặng 2D của một dự án MỚI mở ra ở màn rỗng ("… chưa có bản vẽ nào") — hàng tab và nút
 * "Gửi sang Trình chiếu" chỉ tồn tại KHI đã có ít nhất một bản vẽ. Bấm "Tạo bản vẽ mới" cho tới
 * khi hàng tab xuất hiện; trả về việc có bản vẽ hay không để nơi gọi khai KHÔNG ĐO ĐƯỢC thay vì
 * đoán.
 */
async function baoDamCoBanVe(page) {
  for (let i = 0; i < 3; i += 1) {
    const daCo = await page.locator('button', { hasText: /Gửi sang Trình chiếu/ }).count().catch(() => 0);
    if (daCo) return true;
    const tao = page.locator('button', { hasText: /^\s*Tạo bản vẽ mới\s*$/ }).first();
    if (!(await tao.count().catch(() => 0))) return false;
    await tao.click().catch(() => {});
    await page.waitForTimeout(3500);
  }
  return (await page.locator('button', { hasText: /Gửi sang Trình chiếu/ }).count().catch(() => 0)) > 0;
}

/* ── (4) TỜ BẢN VẼ → TRÌNH CHIẾU ───────────────────────────────────────────────────────────── */
async function lenhToPresent(page, duAn) {
  const kq = { muc: '4 · bản vẽ → Trình chiếu', anh: [], doDuoc: {} };
  await diToi(page, `${BASE}/projects/${duAn}/cad`, 5000);
  kq.doDuoc.daCoSanBanVe = (await page.locator('button', { hasText: /Gửi sang Trình chiếu/ }).count().catch(() => 0)) > 0;
  await baoDamCoBanVe(page);
  kq.anh.push(await chup(page, '4a-chang-2d'));

  const nut = page.locator('button', { hasText: /Gửi sang Trình chiếu/ }).first();
  kq.doDuoc.coNutGui = (await nut.count().catch(() => 0)) > 0;
  if (!kq.doDuoc.coNutGui) {
    kq.ketQua = 'KHÔNG ĐO ĐƯỢC';
    kq.vuong = 'chặng 2D không có bản vẽ nào nên hàng tab + nút gửi không tồn tại';
    return kq;
  }
  await nut.click();

  /* ① CẦU RA — tờ có được ghi sang kho vận chuyển không, và mang theo NHỮNG GÌ.
     ⚠️ PHẢI BẮT NHANH: kho này là CONSUME-ONCE. Khi chặng Trình chiếu đã có hồ sơ sẵn thì
     `CongThietLapTrang` mount ngay và tiêu thụ tờ trong vài trăm mili-giây — đọc ở mốc +1500ms là
     thấy rỗng và tưởng "cầu ra hỏng" (đã dính). Nên dò 100ms một lần, lấy giá trị đầu tiên bắt
     được. Bắt hụt KHÔNG phải bằng chứng hỏng — xem cách tính kết luận ở cuối hàm. */
  let stash = null;
  for (let i = 0; i < 30 && !stash; i += 1) {
    stash = await page
      .evaluate(() => { try { return sessionStorage.getItem('interiorflow.toBanVeHandoff'); } catch { return null; } })
      .catch(() => null);
    if (!stash) await page.waitForTimeout(100);
  }
  kq.doDuoc.cauRa = (() => {
    if (!stash) return { coTo: false };
    try {
      const t = JSON.parse(stash)[0];
      return {
        coTo: true, khoGiay: t.khoGiay, huong: t.huong, le: t.le,
        tyLe: t.tyLe ? `1:${t.tyLe.n}` : null,
        tenBanVe: t.khungTen?.tenBanVe ?? null, duAnKhungTen: t.khungTen?.duAn ?? null,
        neoChang: t.neo?.chang ?? null, coNeoDocId: !!t.neo?.docId,
      };
    } catch { return { coTo: true, loi: 'không đọc được JSON' }; }
  })();

  await page.waitForTimeout(5000);
  kq.doDuoc.urlSauGui = page.url();
  if (!/\/present/.test(page.url())) await diToi(page, `${BASE}/projects/${duAn}/present`, 4000);

  /**
   * ⚠️ CỬA NHẬN CHỈ MOUNT KHI ĐÃ CÓ HỒ SƠ. `CongThietLapTrang` nằm trong `PresentEditor`; dự án
   * chưa có deck nào thì chặng Trình chiếu đứng ở màn CHỌN MẪU và cửa nhận chưa dựng ⇒ đo lúc đó
   * sẽ báo "mất tờ" oan. Tờ KHÔNG mất (còn nguyên trong sessionStorage, consume-once chưa chạy) —
   * nên ở đây tạo hồ sơ trống rồi mới đo.
   */
  const taoTrong = page.locator('text=Tạo hồ sơ trống').first();
  kq.doDuoc.phaiTaoHoSoTruoc = (await taoTrong.count().catch(() => 0)) > 0;
  if (kq.doDuoc.phaiTaoHoSoTruoc) { await taoTrong.click().catch(() => {}); await page.waitForTimeout(6000); }

  /** Đọc mặt CỬA NHẬN. Regex KHÔNG PHÂN BIỆT HOA/THƯỜNG — panel viết nhãn bằng `text-transform`
   *  nên `innerText` trả về "KHỔ GIẤY", bắt bằng /Khổ giấy/ là trượt (đã dính một lượt). */
  const docCua = async () => {
    await page.waitForTimeout(1500);
    return page.evaluate(() => {
      const t = document.body.innerText || '';
      const chip = /Thiết lập trang\s*([A-Z]\d)\s*[·.]?\s*(1\s*:\s*\d+)/i.exec(t);
      return {
        coCuaNhanTo: /thiết lập trang/i.test(t),
        chipKho: chip ? chip[1] : null,
        chipTyLe: chip ? chip[2].replace(/\s/g, '') : null,
        coKhungTen: /khung tên/i.test(t),
        coKhoGiay: /khổ giấy/i.test(t),
        coTyLeBanVe: /tỉ lệ bản vẽ/i.test(t),
        coDuongVe2D: /quay lại 2d/i.test(t),
        nguon: (/Nguồn:\s*([^\n]+)/i.exec(t) || [])[1] || null,
      };
    });
  };
  kq.doDuoc.benTrinhChieu = await docCua();
  kq.anh.push(await chup(page, '4c-trinh-chieu-nhan-to'));

  // ② TẢI LẠI TRANG rồi mở lại — cầu consume-once từng làm MẤT tờ khi component dựng hai lần.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(9000);
  kq.doDuoc.sauTaiLai = await docCua();
  kq.anh.push(await chup(page, '4d-sau-tai-lai'));

  const b = kq.doDuoc.benTrinhChieu, r = kq.doDuoc.sauTaiLai, c = kq.doDuoc.cauRa;
  // Bắt được cầu ra ⇒ đối chiếu ĐÚNG hai đầu. Bắt hụt (bị tiêu thụ quá nhanh) ⇒ KHÔNG kết luận
  // hỏng, chỉ khai là không quan sát được; bằng chứng lúc đó là giá trị hợp lệ ở bên NHẬN.
  kq.doDuoc.mangDungTyLeVaKho = c.coTo
    ? b.chipKho === c.khoGiay && b.chipTyLe === c.tyLe
    : 'không quan sát được cầu ra (tiêu thụ quá nhanh) — đối chiếu bằng giá trị bên nhận';
  kq.doDuoc.benNhanCoGiaTriThat = !!b.chipKho && !!b.chipTyLe;
  kq.doDuoc.songQuaTaiLai = !!r.coCuaNhanTo && r.chipKho === b.chipKho && r.chipTyLe === b.chipTyLe;
  const hopCauRa = c.coTo ? kq.doDuoc.mangDungTyLeVaKho === true : kq.doDuoc.benNhanCoGiaTriThat;
  kq.ketQua = b.coCuaNhanTo && hopCauRa && b.coKhungTen && kq.doDuoc.songQuaTaiLai ? 'PASS' : 'FAIL';
  return kq;
}

/* ── (5) HÀNG TAB Ở KHỔ HẸP ────────────────────────────────────────────────────────────────── */
async function lenhHep(duAn) {
  const kq = { muc: '5 · hàng tab bản vẽ ở khổ desktop hẹp', anh: [], doDuoc: { khoDo: [] } };
  for (const kho of [{ width: 1280, height: 800 }, { width: 1152, height: 720 }]) {
    const { browser, page } = await moTrinhDuyet(kho);
    try {
      await dangNhap(page);
      await diToi(page, `${BASE}/projects/${duAn}/cad`, 5500);
      if (!(await baoDamCoBanVe(page))) {
        kq.doDuoc.khoDo.push({ kho: `${kho.width}×${kho.height}`, coNut: false });
        continue;
      }
      /* ÉP HÀNG TAB CHỊU TẢI. Một tờ thì không gì tràn được — câu hỏi thật là "nút mới có bóp
         chết hàng tab khi có nhiều tờ không". Thêm tờ tới khi dải tab bắt đầu phải cuộn, trần 8
         lượt để không chạy vô tận. */
      const them = page.locator('button[aria-label="Thêm bản vẽ"], button[title="Thêm bản vẽ"]').first();
      kq.doDuoc.coNutThem = (await them.count().catch(() => 0)) > 0;
      let daThem = 0;
      for (let i = 0; i < 8 && kq.doDuoc.coNutThem; i += 1) {
        await them.click().catch(() => {});
        await page.waitForTimeout(900);
        daThem += 1;
      }
      await page.waitForTimeout(1500);

      const d = await page.evaluate(() => {
        const nut = [...document.querySelectorAll('button')].find((e) => /Gửi sang Trình chiếu/.test(e.textContent || ''));
        if (!nut) return { coNut: false };
        const rN = nut.getBoundingClientRect();
        // HÀNG TAB = tổ tiên đầu tiên RỘNG HƠN HẲN nút (nút nằm trong ổ phải hẹp, đi lên 1-2 bậc
        // vẫn chỉ là ổ phải — đã đo nhầm một lượt vì lấy đúng ổ đó làm "hàng").
        let hang = nut.parentElement;
        for (let i = 0; i < 6 && hang; i += 1) {
          const r = hang.getBoundingClientRect();
          if (r.width > rN.width * 2.5) break;
          hang = hang.parentElement;
        }
        const rH = hang.getBoundingClientRect();
        const oTab = hang.firstElementChild;
        const rT = oTab.getBoundingClientRect();
        const soTab = oTab.querySelectorAll('button').length;
        return {
          coNut: true,
          soTab,
          nut: { x: Math.round(rN.left), w: Math.round(rN.width), phai: Math.round(rN.right) },
          hang: { x: Math.round(rH.left), w: Math.round(rH.width), phai: Math.round(rH.right), cao: Math.round(rH.height) },
          oTab: { w: Math.round(rT.width), cuonNgang: oTab.scrollWidth, tran: oTab.scrollWidth - oTab.clientWidth },
          nutBiCat: rN.right > rH.right + 1 || rN.left < rH.left - 1,
          nutHepDi: Math.round(rN.width) < 90,
          bodyTran: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          rongCuaSo: window.innerWidth,
        };
      });
      const anh = await chup(page, `5-tab-${kho.width}x${kho.height}`);
      kq.anh.push(anh);
      /* VỠ = một trong bốn: nút bị cắt ra ngoài hàng · hàng cao gấp đôi (đã xuống dòng) · trang
         cuộn ngang · nút bị bóp hẹp tới mức mất chữ. Dải tab TRÀN thì KHÔNG tính là vỡ nếu nó
         cuộn được — đó là hành vi đúng của một dải tab nhiều tờ. */
      const vo = !d.coNut || d.nutBiCat || d.hang.cao > 60 || d.bodyTran > 0 || d.nutHepDi;
      kq.doDuoc.khoDo.push({ kho: `${kho.width}×${kho.height}`, daThemTo: daThem, ...d, vo, anh });
    } finally {
      await browser.close();
    }
  }
  const doDu = kq.doDuoc.khoDo.every((k) => k.coNut);
  kq.ketQua = !doDu ? 'KHÔNG ĐO ĐƯỢC' : kq.doDuoc.khoDo.some((k) => k.vo) ? 'FAIL' : 'PASS';
  if (!doDu) kq.vuong = 'không thấy nút "Gửi sang Trình chiếu" ở một trong hai khổ';
  return kq;
}

/* ── điều phối ─────────────────────────────────────────────────────────────────────────────── */
async function main() {
  const cmd = process.argv[2] || 'probe';
  const tatCa = cmd === 'tat-ca';
  const ketQua = [];
  const canTrinhDuyetChung = tatCa || ['probe', 'cu-chi', 'chon-xoa', 'retina', 'to-present'].includes(cmd);

  let duAn = null;
  if (canTrinhDuyetChung || cmd === 'hep') {
    const { browser, page } = await moTrinhDuyet();
    try {
      await dangNhap(page);
      duAn = await baoDamDuAn(page);
      console.log(`· dự án kiểm thử: ${duAn}`);
      if (cmd === 'probe') {
        await mo3D(page, duAn);
        const box = await hopViewport(page);
        console.log(`· viewport: ${box ? `${so(box.w)}×${so(box.h)}` : 'KHÔNG CÓ'}`);
        console.log(`· nhãn khung nhìn: "${await nhanKhungNhin(page)}"`);
        console.log(`· ảnh: ${await chup(page, '0-probe')}`);
      }
      // Mỗi mục dùng TRANG SẠCH (goto lại) để không thừa hưởng trạng thái của mục trước.
      if (tatCa || cmd === 'retina') ketQua.push(await lenhRetina(page, duAn));
      if (tatCa || cmd === 'cu-chi') ketQua.push(await lenhCuChi(page, duAn));
      if (tatCa || cmd === 'chon-xoa') ketQua.push(await lenhChonXoa(page, duAn));
      if (tatCa || cmd === 'to-present') ketQua.push(await lenhToPresent(page, duAn));
    } finally {
      await browser.close();
    }
  }
  if (tatCa || cmd === 'hep') ketQua.push(await lenhHep(duAn));

  if (ketQua.length) {
    const bao = { luc: new Date().toISOString(), base: BASE, dpr: DPR, duAn, loiTrang: loiTrang.slice(0, 20), muc: ketQua };
    const tep = ghiJson(`ket-qua-${cmd}`, bao);
    console.log(`\n${'='.repeat(70)}`);
    for (const m of ketQua) console.log(`${String(m.ketQua).padEnd(16)} ${m.muc}${m.vuong ? `  ← ${m.vuong}` : ''}`);
    console.log(`${'='.repeat(70)}\nJSON: ${tep}`);
    if (loiTrang.length) console.log(`⚠ lỗi trang: ${loiTrang.length} (xem JSON)`);
  }
}

main().catch((e) => { console.error('✖', e.message); process.exit(1); });
