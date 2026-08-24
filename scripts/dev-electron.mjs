#!/usr/bin/env node
/**
 * scripts/dev-electron.mjs — MỘT LỆNH: mã hiện tại → Electron dev, sửa là thấy ngay.
 *
 * ─── VÌ SAO CÓ ────────────────────────────────────────────────────────────────
 * Bệnh mất nhiều giờ nhất ngày 22/08 không phải lỗi mã, mà là **đo nhầm cổng**. Ba cổng
 * cùng sống và nhìn giống hệt nhau: `:3000` dev (hỏng vì HAI `next dev` cùng ghi `.next`),
 * `:3777` ảnh chụp phát hành ĐÓNG BĂNG, `:3778` build từ mã hiện tại. Sửa nguồn rồi soi
 * `:3777` ⇒ không thấy gì, vì bản đóng gói dựng TRƯỚC lúc sửa. Không ai nói dối; chỉ là
 * không có máy nào trả lời được *"cổng này đang phục vụ MÃ NÀO?"*.
 *
 * Script này trả lời bằng máy, và **DỪNG TO** khi lệch thay vì mở app im lặng.
 *
 * ─── KHÔNG DỰNG STACK THỨ HAI ─────────────────────────────────────────────────
 * `package.json` đã có `electron:dev` (next dev + wait-on + electron). Script này KHÔNG thay
 * nó bằng stack khác — nó bọc đúng ba mảnh đó và vá ba lỗ: cổng gõ cứng `3000`, không watcher
 * cho main/preload, và không có guard danh tính.
 *
 * ─── LÀM GÌ ───────────────────────────────────────────────────────────────────
 *   1. Đếm `next dev` đang chạy trên CÙNG cwd → nhiều hơn một là BÁO, không tự giết.
 *   2. Cổng đã có server → TÁI DÙNG (luật một-server), chưa có → tự khởi động.
 *   3. Healthcheck, rồi hỏi `/api/dev-identity` xem nó phục vụ mã nào.
 *   4. `cwd` lệch ⇒ THOÁT. Đây là guard chống trỏ nhầm worktree/bản đóng băng.
 *   5. Mở Electron trỏ ĐÚNG cổng đó (`ELECTRON_START_URL`) — renderer đi qua HMR của Next.
 *   6. Canh `electron/main.js` + `electron/preload.js` → đổi thì KHỞI ĐỘNG LẠI Electron.
 *      Tiến trình native KHÔNG có HMR; giả vờ có là nói dối, nên ở đây là restart thật.
 *
 * ⛔ CHỈ giết tiến trình DO CHÍNH SCRIPT NÀY đẻ ra. Tiến trình lạ (phiên khác, bản phát hành)
 *    thì BÁO PID rồi để người quyết — giết đồ của người khác là việc của người, không của máy.
 *
 * Chạy: `npm run dev:electron`   ·   cổng khác: `IF_DEV_PORT=3801 npm run dev:electron`
 */
import { spawn, execFileSync } from 'node:child_process';
import { watch, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.IF_DEV_PORT || 3799);
const HOST = '127.0.0.1';
const BASE = `http://${HOST}:${PORT}`;

const log = (m) => console.log(`[dev:electron] ${m}`);
const die = (m) => { console.error(`\n[dev:electron] ⛔ ${m}\n`); process.exit(1); };
const sh = (cmd, args) => { try { return execFileSync(cmd, args, { encoding: 'utf8' }).trim(); } catch { return ''; } };

/* ── 1 · LUẬT MỘT SERVER ──────────────────────────────────────────────────── */
function otherDevServers() {
  // `pgrep next dev` KHÔNG bắt được: tiến trình tên là `node .../next dev` và `next-server`.
  // Một lượt đo bằng `pgrep` đã kết luận NHẦM là chúng đã chết. Phải khớp DÒNG LỆNH (-f).
  const out = sh('pgrep', ['-fl', 'next dev']);
  return out ? out.split('\n').filter(Boolean) : [];
}

async function probe(path) {
  try {
    const r = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(3000) });
    return r.ok ? await r.json().catch(() => ({})) : null;
  } catch { return null; }
}

/* ── 2 · GUARD DANH TÍNH ──────────────────────────────────────────────────── */
async function assertCurrentSource() {
  const id = await probe('/api/dev-identity');
  if (!id) {
    die(`Cổng ${PORT} có trả lời nhưng KHÔNG có /api/dev-identity.\n` +
        `   Gần như chắc chắn đây là BẢN ĐÓNG GÓI/ĐÓNG BĂNG (route đó trả 404 ở production),\n` +
        `   hoặc server của thư mục khác. KHÔNG mở Electron vào đây — đo trên nó là đo mã cũ.`);
  }
  if (id.cwd !== ROOT) {
    die(`SAI CÂY NGUỒN.\n   server cwd: ${id.cwd}\n   repo này  : ${ROOT}\n` +
        `   Cổng ${PORT} đang phục vụ một worktree khác. Đổi IF_DEV_PORT hoặc dừng server đó.`);
  }
  const head = sh('git', ['rev-parse', 'HEAD']);
  if (id.head && head && id.head !== head) {
    log(`⚠️ HEAD server ${id.head.slice(0, 8)} ≠ repo ${head.slice(0, 8)} — server khởi động ở commit khác.`);
  }
  log(`✅ MÃ HIỆN TẠI · ${BASE} · pid ${id.pid} · ${id.branch}@${(id.head || '').slice(0, 8)}${id.dirty ? ' (dirty)' : ''}`);
  return id;
}


/** Ai đang giữ khoá một-instance — GỌI TÊN, không đoán. Trả về text đã thụt lề sẵn. */
function timChuKhoa() {
  const ra = [];
  const goi = sh('pgrep', ['-fl', 'InteriorFlow.app/Contents/MacOS']);
  if (goi) ra.push(...goi.split('\n').filter(Boolean).map((d) => `     · BẢN ĐÓNG GÓI — ${d.slice(0, 88)}`));
  const dev = sh('pgrep', ['-fl', 'node_modules/.bin/electron']);
  for (const d of dev.split('\n').filter(Boolean)) {
    const pid = d.split(/\s+/)[0];
    if (pid === String(process.pid)) continue;
    ra.push(`     · ELECTRON DEV khác — pid ${pid}`);
  }
  return ra.length ? ra.join('\n') : '     · (không tìm thấy — khoá có thể vừa được nhả, thử chạy lại)';
}

/* ── 3 · CHẠY ─────────────────────────────────────────────────────────────── */
const children = [];
let electron = null;
let restarting = false;

function startNext() {
  log(`khởi động next dev trên ${PORT}…`);
  const p = spawn('npx', ['next', 'dev', '-p', String(PORT), '-H', HOST], {
    cwd: ROOT, stdio: 'inherit', env: { ...process.env },
  });
  children.push(p);
  return p;
}

function startElectron() {
  log('mở Electron…');
  const p = spawn('npx', ['electron', '.'], {
    cwd: ROOT, stdio: 'inherit',
    env: { ...process.env, ELECTRON_START_URL: BASE, IF_DEV_SOURCE: ROOT },
  });
  children.push(p);
  const openedAt = Date.now();
  p.on('exit', (code) => {
    if (restarting) return;
    // 🔴 CA THẬT 22/08: Electron thoát NGAY với mã 0 và KHÔNG in gì. Nhìn ra như "chạy xong",
    // thật ra là `app.requestSingleInstanceLock()` (electron/main.js:504) thấy đã có instance
    // khác — bản ĐÓNG GÓI đang mở — nên `app.quit()` ở :506. Mã 0 + im lặng là tổ hợp tệ nhất:
    // người dùng thấy "không có gì xảy ra". Nói thẳng nguyên nhân thay vì để họ đoán.
    if (Date.now() - openedAt < 5000 && code === 0) {
      console.error(
        `\n[dev:electron] ⛔ Electron thoát ngay (mã 0) — KHOÁ MỘT-INSTANCE.\n` +
        `   electron/main.js:504 requestSingleInstanceLock() → :506 app.quit() khi đã có instance khác.\n` +
        // 🔴 BẢN CŨ ĐOÁN THỦ PHẠM RỒI ĐOÁN SAI (23/08): nó khẳng định "bản đóng gói đang mở",
        // trong khi thật ra là một `dev:electron` khác đang chạy. Người đọc đi tìm bản đóng gói,
        // không thấy, rồi bế tắc. ⇒ ĐỪNG ĐOÁN — ĐI TÌM VÀ GỌI TÊN. Cùng họ F-03/F-14: khẳng định
        // không có phép đo chống lưng thì tệ hơn là không khẳng định gì.
        `   ĐANG GIỮ KHOÁ:\n${timChuKhoa()}\n` +
        `   Nếu đó là cửa sổ bạn đang dùng thì KHÔNG cần mở thêm — nó đã trỏ đúng ${BASE}, sửa nguồn là thấy ngay.\n`,
      );
      shutdown(1);
      return;
    }
    log(`Electron thoát (${code}) — dừng luôn dev server.`);
    shutdown(0);
  });
  return p;
}

function watchNative() {
  const files = ['electron/main.js', 'electron/preload.js'].map((f) => join(ROOT, f)).filter(existsSync);
  let timer = null;
  for (const f of files) {
    watch(f, () => {
      clearTimeout(timer);
      // Gộp nhiều sự kiện ghi thành một lần restart — trình soạn thảo hay bắn 2-3 lần/lưu.
      timer = setTimeout(() => {
        log('main/preload đổi → KHỞI ĐỘNG LẠI Electron (tiến trình native không có HMR).');
        restarting = true;
        const old = electron;
        // 🔴 BUG TÔI TỰ GÂY RA RỒI TỰ BẮT (22/08): bản đầu `kill()` rồi `setTimeout(…, 400)`.
        // 400ms KHÔNG đủ để Electron nhả KHOÁ MỘT-INSTANCE. Instance mới thấy khoá còn bị giữ
        // bởi chính instance đang chết → `app.quit()` ngay (main.js:506) → guard thoát-nhanh
        // của tôi tưởng là "bản đóng gói đang mở" → shutdown(1) → GIẾT LUÔN dev server.
        // Một hằng số thời gian đoán bừa đã biến việc sửa một dòng comment thành sập cả môi
        // trường dev. ⇒ ĐỢI SỰ KIỆN THẬT, đừng đoán thời gian.
        const relaunch = () => {
          if (!restarting) return;
          restarting = false;
          electron = startElectron();
        };
        if (old && !old.killed) {
          old.once('exit', () => setTimeout(relaunch, 250)); // 250ms cho OS nhả khoá
          try { old.kill(); } catch { relaunch(); }
          // Lưới an toàn: tiến trình không chịu chết thì vẫn đi tiếp, đừng treo im lặng.
          setTimeout(() => { if (restarting) relaunch(); }, 8000);
        } else relaunch();
      }, 300);
    });
  }
  log(`canh ${files.length} tệp native → tự khởi động lại.`);
}

function shutdown(code = 0) {
  for (const c of children) { try { c.kill(); } catch { /* đã chết */ } }
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

(async () => {
  const strays = otherDevServers();
  if (strays.length) {
    log(`⚠️ đã có ${strays.length} tiến trình \`next dev\`:`);
    for (const s of strays) log(`     ${s}`);
    log('   KHÔNG tự giết (có thể là của phiên khác). Nhiều server cùng ghi một `.next` sẽ làm hỏng nó.');
  }

  const alive = await probe('/api/health');
  if (alive) log(`cổng ${PORT} đã có server — TÁI DÙNG, không mở cái thứ hai.`);
  else {
    startNext();
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      if (await probe('/api/health')) break;
      if (i === 59) die(`next dev không lên sau 60s trên ${PORT}.`);
    }
  }

  await assertCurrentSource();
  electron = startElectron();
  watchNative();
})();
