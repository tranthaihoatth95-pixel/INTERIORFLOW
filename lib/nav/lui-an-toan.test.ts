/**
 * lib/nav/lui-an-toan.test.ts — khoá LÕI THUẦN của `tinhDau`, tức phần quyết định
 * "bấm Quay lại có bật ra khỏi app không".
 * Chạy: `node_modules/.bin/sucrase-node lib/nav/lui-an-toan.test.ts`
 *
 * 🔴 CA SỐ 1 LÀ CA HOÀ GẶP, và nó là lý do cả tệp này tồn tại: tab mới + dán thẳng URL cho
 * `history.length === 2`, nên MỌI lá chắn `history.length > 1` đều qua. Test phải khẳng định
 * ĐƯỜNG CHÍNH chạy đúng (idx 0 ⇒ không lui), chứ không chỉ khẳng định "có trả về đường thoái lui"
 * — bài học `calibrateFromImage` 15/08: test ghi nhận đúng hành vi HỎNG làm kỳ vọng thì test
 * xanh mà bug vẫn sống.
 */
import { tinhDau, type DauLichSu } from './lui-an-toan';

let pass = 0;
const loi: string[] = [];
function ok(ten: string, dieu: boolean, them = '') {
  if (dieu) { pass++; console.log(`  ok  - ${ten}`); }
  else { loi.push(ten); console.log(`  FAIL- ${ten}${them ? ` — ${them}` : ''}`); }
}
/** Có đường lui hay không — đúng phép mà `coDuongLui()` dùng. */
const lui = (d: DauLichSu) => d.idx > 0;

console.log('\nlui-an-toan — lõi thuần `tinhDau`\n');

console.log('[1] VÀO NGANG (dán URL / mở link người khác gửi) — ca A1-01');
{
  // Tab mới: ô `about:blank` + ô vừa mở ⇒ length 2. Lá chắn cũ `>1` QUA ở đây; ta phải KHÔNG lui.
  const d = tinhDau(undefined, undefined, null, 2);
  ok('ô đầu chuỗi mang idx 0', d.idx === 0, `idx=${d.idx}`);
  ok('KHÔNG có đường lui dù history.length = 2', !lui(d));
  ok('length 2 (lá chắn cũ `>1`) đúng là qua được ⇒ chứng minh lá chắn cũ hỏng', 2 > 1);
  // Tab đã lướt nhiều nơi rồi mới dán URL IF: length to, vẫn phải là ô đầu chuỗi IF.
  ok('length 9 mà vẫn không lui (ô phía sau là trang NGOÀI)', !lui(tinhDau(undefined, undefined, null, 9)));
}

console.log('\n[2] ĐI TRONG APP — đường chính phải chạy được');
{
  const a = tinhDau(undefined, undefined, null, 2);              // vào ngang → idx 0
  const b = tinhDau(undefined, undefined, a, 3);                 // push sang trang 2 (length +1)
  ok('push ⇒ idx tiến một bậc', b.idx === 1, `idx=${b.idx}`);
  ok('CÓ đường lui ở trang thứ hai', lui(b));
  const c = tinhDau(undefined, undefined, b, 4);
  ok('push tiếp ⇒ idx = 2', c.idx === 2, `idx=${c.idx}`);
  ok('vẫn có đường lui', lui(c));
}

console.log('\n[3] BACK/FORWARD — ô được khôi phục giữ nguyên dấu cũ');
{
  // Next `restore-reducer` đặt preserveCustomHistoryState=true ⇒ dấu còn trên ô.
  ok('back về ô 0 ⇒ đọc lại đúng 0, và hết đường lui', !lui(tinhDau(0, 2, { idx: 2, len: 4 }, 4)));
  ok('forward tới ô 1 ⇒ đọc lại đúng 1', tinhDau(1, 3, { idx: 0, len: 2 }, 4).idx === 1);
  ok('dấu cũ THẮNG trí nhớ, không tính lại theo length', tinhDau(0, 2, { idx: 5, len: 9 }, 40).idx === 0);
}

console.log('\n[4] REPLACE — đè lên ô cũ thì KHÔNG được tiến bậc');
{
  // Ca thật: `/colors` vào ngang → `router.replace('/')`. Nếu tính nhầm thành push thì trang `/`
  // mang idx 1 ⇒ báo "có đường lui" trong khi ô phía sau là trang NGOÀI ⇒ lại bật ra about:blank.
  const goc = tinhDau(undefined, undefined, null, 2);            // /colors vào ngang, idx 0
  const sau = tinhDau(undefined, undefined, goc, 2);             // replace: length KHÔNG đổi
  ok('replace ⇒ idx đứng yên', sau.idx === 0, `idx=${sau.idx}`);
  ok('replace từ ô đầu chuỗi ⇒ vẫn KHÔNG có đường lui', !lui(sau));
  const b = tinhDau(undefined, undefined, goc, 3);               // push
  ok('replace ở giữa chuỗi cũng đứng yên', tinhDau(undefined, undefined, b, 3).idx === b.idx);
}

console.log('\n[5] BA LẦN LUI SAU KHI VÀO NGANG — ca ③ của phiếu, không được lọt ra ngoài');
{
  let d = tinhDau(undefined, undefined, null, 2);                // vào ngang
  d = tinhDau(undefined, undefined, d, 3);                       // +1 trang
  d = tinhDau(undefined, undefined, d, 4);                       // +1 trang nữa  ⇒ idx 2
  ok('đang ở bậc 2', d.idx === 2, `idx=${d.idx}`);
  d = tinhDau(2 - 1, 3, d, 4); ok('lui lần 1 ⇒ bậc 1, còn lui được', lui(d) && d.idx === 1);
  d = tinhDau(0, 2, d, 4);     ok('lui lần 2 ⇒ bậc 0', d.idx === 0);
  ok('lui lần 3 KHÔNG được gọi back ⇒ đi đường dự phòng, không lọt ra ngoài', !lui(d));
}

console.log('\n[6] GÓC KHUẤT — trần 50 của Chromium, sai về phía AN TOÀN');
{
  // Ở trần, push không làm length tăng ⇒ ta đọc nhầm thành replace ⇒ idx đứng yên.
  const d = tinhDau(undefined, undefined, { idx: 7, len: 50 }, 50);
  ok('trần length ⇒ idx đứng yên (báo THIẾU đường lui)', d.idx === 7);
  ok('báo thiếu vẫn còn lui được ở bậc 7 ⇒ không ai bị kẹt', lui(d));
  // Ô đầu chuỗi thiếu `ifLen` (state cũ / bị Safari chặn ghi) ⇒ vẫn đọc được idx.
  ok('thiếu ifLen vẫn đọc được idx', tinhDau(3, undefined, null, 8).idx === 3);
}

console.log(`\n${loi.length === 0 ? '✅' : '❌'} lui-an-toan: ${pass} pass · ${loi.length} fail`);
if (loi.length) process.exit(1);
