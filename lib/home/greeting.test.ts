/** Test `greeting.ts` — chạy: node_modules/.bin/sucrase-node lib/home/greeting.test.ts */
import { buildGreeting, normalizeDisplayName, capitalizeFirst, DISPLAY_NAME_MAX } from './greeting';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}

const NOW = new Date(2026, 7, 13, 9, 0); // Thứ Năm 13/08/2026

console.log('buildGreeting() — có tên → chào bằng tên; ngày tháng đi kèm');
{
  const r = buildGreeting({ name: 'Trần Hoà', now: NOW, en: false, dueTodayCount: 0 });
  ok('headline chứa "Chào Hoà"', r.headline.startsWith('Chào Hoà'));
  ok('headline chứa ngày 13/08', r.headline.includes('13/08'));
}

console.log('buildGreeting() — không tên → chào chung, không lỗi/không rỗng');
{
  const r = buildGreeting({ name: null, now: NOW, en: false, dueTodayCount: 0 });
  ok('headline không rỗng', r.headline.length > 0);
  ok('headline chứa InteriorFlow', r.headline.includes('InteriorFlow'));
}

console.log('buildGreeting() — có việc đến hạn hôm nay → tín hiệu SỐ VIỆC, không quote sáo');
{
  const r = buildGreeting({ name: 'Hoà', now: NOW, en: false, dueTodayCount: 3 });
  ok('signal đúng số việc', r.signal === '3 việc đến hạn hôm nay');
}

console.log('buildGreeting() — 1 việc thì số ít (EN), không "1 tasks"');
{
  const r = buildGreeting({ name: 'Hoà', now: NOW, en: true, dueTodayCount: 1 });
  ok('EN số ít đúng ngữ pháp', r.signal === '1 task due today');
}

/* v2 (13/08 home-dong-studio-v2.md ④.3): test cũ "không việc đến hạn nhưng có dự án vừa động →
 * dùng tín hiệu dự án" ĐÃ XOÁ — hành vi đó chính là lỗi #4 (1 sự kiện Flow.updatedAt lặp ở 3
 * widget với 3 cách đọc giờ khác nhau). `recentProjectName` bị bỏ khỏi GreetingInput; giờ không
 * có việc đến hạn thì signal LUÔN null (không còn nhánh dự phòng "vừa có chuyển động"), xem
 * test kế — sự kiện đó chỉ còn sống ở NewsFeed. */

console.log('buildGreeting() — không có việc đến hạn → signal null (TỰ ẨN, không bịa số 0, KHÔNG còn nói thay flow/project)');
{
  const r = buildGreeting({ name: 'Hoà', now: NOW, en: false, dueTodayCount: 0 });
  ok('signal = null', r.signal === null);
}

console.log('buildGreeting() — dueTodayCount âm/NaN không throw, coi như 0');
{
  const r1 = buildGreeting({ name: 'Hoà', now: NOW, en: false, dueTodayCount: -5 });
  const r2 = buildGreeting({ name: 'Hoà', now: NOW, en: false, dueTodayCount: NaN });
  ok('âm → null', r1.signal === null);
  ok('NaN → null', r2.signal === null);
}

/* ─── v5 (17/08) → 🔴 LẬT NGƯỢC 28/08 ──────────────────────────────────────────────────────
 * Bản 17/08 chốt: *"viết hoa thì máy làm được, dấu thì không"* — và bốn ca dưới đây từng
 * **khẳng định** `Chào Hoa`.
 *
 * **Chính bài kiểm đã khoá cứng cái sai suốt 11 ngày.** Cổng có, đã nối, chạy mỗi `npm test` —
 * nhưng nó **canh đúng cái lỗi**. Hoà chụp màn 28/08: app gọi anh là **`Hoa`**, tên thật **`Hoà`**.
 *
 * Sai không nằm ở chữ hoa. Sai ở chỗ `capitalizeFirst` là **một phép biến đổi chế ra sự tự tin**:
 * lấy giá trị không kiểm được rồi làm nó **trông như đã xác nhận**. `hoa` để nguyên thì người
 * dùng thấy lạ và tự sửa; `Hoa` thì **trông đúng và sai vĩnh viễn**.
 *
 * ⇒ Luật mới: máy **chỉ hiển thị thứ nó đo được**. Tên người thì chỉ người gõ mới đúng. */

console.log('buildGreeting() — KHÔNG tô vẽ tên tài khoản, hiện đúng thứ đang lưu');
{
  const r = buildGreeting({ name: 'hoa', now: NOW, en: false, dueTodayCount: 0 });
  ok('hiện NGUYÊN VĂN "Chào hoa" — thứ đang lưu, không tô vẽ', r.headline.startsWith('Chào hoa'));
  ok('KHÔNG tự viết hoa thành "Hoa" (trông đúng, sai vĩnh viễn)', !r.headline.startsWith('Chào Hoa'));
  ok('KHÔNG tự bịa dấu thành "Hoà"', !r.headline.includes('Hoà'));
}

console.log('buildGreeting() — chữ có dấu cũng giữ NGUYÊN, không đụng vào');
{
  const r = buildGreeting({ name: 'nguyễn ánh', now: NOW, en: false, dueTodayCount: 0 });
  ok('"ánh" giữ nguyên "ánh", máy không sửa tên người', r.headline.startsWith('Chào ánh'));
}

console.log('buildGreeting() — tên người dùng TỰ ĐẶT thắng tên tài khoản, giữ nguyên từng chữ');
{
  const r = buildGreeting({ name: 'hoa', displayName: 'Hoà', now: NOW, en: false, dueTodayCount: 0 });
  ok('dùng đúng tên đã gõ', r.headline.startsWith('Chào Hoà'));
  const r2 = buildGreeting({ name: 'hoa', displayName: 'Trần Thái Hoà', now: NOW, en: false, dueTodayCount: 0 });
  ok('gõ cả họ tên thì giữ NGUYÊN VĂN, không cắt lấy từ cuối', r2.headline.startsWith('Chào Trần Thái Hoà'));
}

console.log('buildGreeting() — tên tự đặt rỗng/toàn khoảng trắng → rơi về tên tài khoản, KHÔNG rỗng');
{
  const r = buildGreeting({ name: 'hoa', displayName: '   ', now: NOW, en: false, dueTodayCount: 0 });
  ok('rơi về tên tài khoản NGUYÊN VĂN', r.headline.startsWith('Chào hoa'));
  const r2 = buildGreeting({ name: null, displayName: null, now: NOW, en: false, dueTodayCount: 0 });
  ok('không tên nào cả → vẫn "InteriorFlow", không bịa', r2.headline.includes('InteriorFlow'));
}

console.log('normalizeDisplayName() — gọt khoảng trắng, cắt trần, rỗng thành null');
{
  ok('gộp khoảng trắng giữa', normalizeDisplayName('  Trần   Thái  Hoà ') === 'Trần Thái Hoà');
  ok('rỗng → null', normalizeDisplayName('') === null);
  ok('toàn khoảng trắng → null', normalizeDisplayName('\n\t  ') === null);
  ok('null/undefined không throw', normalizeDisplayName(null) === null && normalizeDisplayName(undefined) === null);
  ok(`cắt đúng trần ${DISPLAY_NAME_MAX} ký tự`, (normalizeDisplayName('x'.repeat(200)) ?? '').length === DISPLAY_NAME_MAX);
}

console.log('capitalizeFirst() — không đụng phần còn lại, không vỡ với chuỗi rỗng');
{
  ok('chỉ chữ đầu lên hoa', capitalizeFirst('hoa lan') === 'Hoa lan');
  ok('đã hoa sẵn thì giữ nguyên', capitalizeFirst('Hoà') === 'Hoà');
  ok('chuỗi rỗng không throw', capitalizeFirst('') === '');
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
