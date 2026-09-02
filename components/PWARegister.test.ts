/**
 * Test Q-4 — Ở DEV, PWARegister PHẢI CHỦ ĐỘNG GỠ SERVICE WORKER CŨ, không chỉ "không đăng ký".
 * Chạy: node_modules/.bin/sucrase-node components/PWARegister.test.ts
 *
 * ── CA THẬT SINH RA CỔNG NÀY (02/09) ─────────────────────────────────────────────────────────
 * Bản production từng chạy trên CÙNG origin `localhost:3001` ⇒ service worker `iflow-v1` cắm
 * vào origin đó và ở lại trong TỪNG PROFILE TRÌNH DUYỆT đã mở nó. `public/sw.js` cache-first
 * mọi `/_next/static/*`, mà chunk dev KHÔNG có hash trong tên ⇒ SW trả bản CŨ mãi mãi.
 * Câu `if (NODE_ENV !== 'production') return;` đúng nhưng KHÔNG ĐỦ: không đăng ký thêm thì cũng
 * không gỡ cái đã cắm. Hai lane mất trọn một buổi sáng vì đĩa đúng, tiến trình đúng, HTTP đúng,
 * mà màn hình vẫn sai — `rm -rf .next` vô ích, restart dev vô ích, vì độc không nằm trong repo.
 *
 * ── VÌ SAO ĐỌC MÃ NGUỒN ──────────────────────────────────────────────────────────────────────
 * Thứ cần canh là SỰ CÓ MẶT của một đường dọn trong nhánh dev, và mấy ràng buộc quanh nó. Dựng
 * một React tree giả với `navigator.serviceWorker` giả chỉ chứng minh cái giả chạy đúng.
 * ⚠️ Nói thẳng giới hạn: cổng này KHÔNG chứng minh app tự lành trên trình duyệt thật. Bằng
 * chứng đó là mở một profile đang nhiễm và thấy nó nạp bản mới.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const src = readFileSync(path.join(process.cwd(), 'components/PWARegister.tsx'), 'utf8');

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}

/** Thân nhánh DEV — từ chỗ rẽ `NODE_ENV !== 'production'` tới hết khối. Cắt cửa sổ thay vì quét
 *  cả tệp: nhánh PRODUCTION bên dưới cũng nói chuyện với `serviceWorker`, quét cả tệp là ca MÙ
 *  (nó sẽ xanh nhờ mã của nhánh kia). */
function nhanhDev(): string {
  const i = src.indexOf("process.env.NODE_ENV !== 'production'");
  return i < 0 ? '' : src.slice(i, i + 1800);
}

console.log('Q-4 — dev tự gỡ service worker cũ');

console.log('[1] NHÁNH DEV CÓ ĐƯỜNG DỌN THẬT');
{
  const dev = nhanhDev();
  ok('tìm được nhánh dev', dev.length > 0);
  /* ⚠️ Ca này phải đo CÂU LỆNH THẬT, không được quét cả tệp.
   * Bản đầu viết `!/!== 'production'\)\s*return;/.test(src)` và nó ĐỎ trong khi mã đã đúng —
   * vì chính chú thích trong `PWARegister.tsx` TRÍCH NGUYÊN VĂN câu mã cũ để giải thích vì sao
   * nó không đủ. Cổng bắt nhầm lời giải thích của chính mình.
   * ⇒ Bẫy chung của mọi cổng đọc-mã: tệp nào ghi lại lịch sử của nó thì văn xuôi có chứa mã cũ.
   * Đo bằng ký tự NGAY SAU điều kiện: `{` là có thân, `return` là nhánh trần. */
  ok('nhánh dev KHÔNG còn là `return` trần — có thân', (() => {
    const dieuKien = "if (process.env.NODE_ENV !== 'production')";
    const i = src.indexOf(dieuKien);
    if (i < 0) return false;
    return src.slice(i + dieuKien.length).trimStart().startsWith('{');
  })());
  ok('có gỡ đăng ký service worker', /getRegistrations\(\)/.test(dev) && /\.unregister\(\)/.test(dev));
  ok('có xoá cache (gỡ đăng ký một mình KHÔNG xoá thứ đã cache)', /caches\.delete\(/.test(dev));
  ok('duyệt hết mọi cache, không xoá mỗi một khoá đoán trước', /caches\.keys\(\)/.test(dev));
}

console.log('[2] TẢI LẠI ĐÚNG MỘT LẦN — và chỉ khi thật sự đang bị lái');
{
  const dev = nhanhDev();
  /* Gỡ đăng ký KHÔNG rút SW ra khỏi trang ĐANG mở; phải tải lại. Nhưng tải lại vô điều kiện thì
   * mọi lượt dev đều tự reload vô cớ. */
  ok('chỉ tải lại khi có serviceWorker.controller', /serviceWorker\.controller/.test(dev) && /location\.reload\(\)/.test(dev));
  ok('… và chỉ khi thật sự có bản đăng ký để gỡ', /regs\.length\s*>\s*0/.test(dev));
  /* 🔴 Chốt chặn vòng lặp phải là sessionStorage, KHÔNG phải biến trong module: sau reload,
   * module dựng lại từ đầu nên biến nào cũng về mặc định — đúng công thức lặp vô hạn. */
  ok('chốt chặn lặp dùng sessionStorage (sống qua reload)', /sessionStorage\.getItem\(/.test(dev) && /sessionStorage\.setItem\(/.test(dev));
  ok('đặt cờ TRƯỚC khi reload, không phải sau', (() => {
    const iSet = dev.indexOf('sessionStorage.setItem');
    const iReload = dev.indexOf('location.reload');
    return iSet > 0 && iReload > 0 && iSet < iReload;
  })());
}

console.log('[3] KHÔNG ĐƯỢC LÀM CHẾT APP KHI TRÌNH DUYỆT TỪ CHỐI');
{
  const dev = nhanhDev();
  /* Chế độ riêng tư có thể NÉM ngay khi đọc `sessionStorage`/`caches`. Không bọc thì cả vỏ app
   * trắng màn — cái giá lớn hơn nhiều so với việc còn sót một service worker. */
  ok('nhánh dev bọc try/catch', /try\s*\{/.test(dev) && /catch/.test(dev));
  ok('có kiểm `caches` tồn tại trước khi dùng', /'caches' in window/.test(dev));
  ok('vẫn giữ chốt `serviceWorker` in navigator ở đầu', /'serviceWorker' in navigator/.test(src));
  /* Luật K5 của repo: cấm catch rỗng. Ở đây im lặng là CỐ Ý, nên phải có chữ nói vì sao. */
  ok('catch không rỗng câm — có chú thích nói vì sao im lặng', /catch\s*\{[^}]*\/\*/.test(dev) || /catch\s*\{\s*\n\s*\/\//.test(dev));
}

console.log('[4] KHÔNG ĐỤNG NHÁNH PRODUCTION');
{
  ok('vẫn đăng ký SW ở production', /serviceWorker\.register\('\/sw\.js'/.test(src));
  ok('vẫn giữ cơ chế SKIP_WAITING', /SKIP_WAITING/.test(src));
  ok('vẫn giữ reload khi controller đổi (bản mới lên)', /controllerchange/.test(src));
}

console.log('[5] ĐỐI CHỨNG — bản CŨ phải bị bắt (cổng luôn xanh là cổng vô dụng)');
{
  const cu = "    // Không đăng ký ở môi trường dev để tránh cache làm nhiễu hot-reload.\n    if (process.env.NODE_ENV !== 'production') return;";
  ok('bản CŨ là return trần ⇒ ca [1] bắt được', /!== 'production'\)\s*return;/.test(cu));
  ok('bản CŨ không gỡ đăng ký ⇒ ca [1] bắt được', !/getRegistrations/.test(cu));
  ok('bản CŨ không xoá cache ⇒ ca [1] bắt được', !/caches\.delete/.test(cu));
  ok('bản THẬT khác bản CŨ ở đúng điểm đang canh', /getRegistrations/.test(nhanhDev()));
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
