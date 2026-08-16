/** Test `resume-card.ts` — chạy: node_modules/.bin/sucrase-node components/home/widgets/resume-card.test.ts
 *
 * [marker: vietDangDo] Hai câu nghiệm thu ĐO ĐƯỢC của phiếu P-N nằm ở đây:
 *   ① widget TỰ ẨN khi không có việc dở  → `buildResumeCard()` phải trả null
 *   ② về đúng chỗ cũ ≤ 2 cú bấm          → `resumeHref()` phải ra ĐÚNG MỘT đường dẫn có đích
 */
import { buildResumeCard, resumeHref, daysAgoLabel, type ResumeLite } from './resume-card';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}

const NOW = new Date(2026, 7, 16, 10, 0, 0).getTime();
const day = (n: number) => NOW - n * 86_400_000;

console.log('① TỰ ẨN — không có việc dở thì KHÔNG dựng thẻ (widget không hiện khung rỗng)');
{
  eq('chưa từng có resume (người dùng lần đầu)', buildResumeCard(null, { now: NOW }), null);
  eq('resume undefined', buildResumeCard(undefined, { now: NOW }), null);
  // Đứng ở '/' mà chưa từng lưu `phase` = chưa thật sự vào canvas lần nào ⇒ không có "việc dở".
  eq(
    "route '/' không kèm phase → không suy ra chặng nào",
    buildResumeCard({ route: '/', ts: day(1) }, { now: NOW }),
    null,
  );
  eq(
    'route lạ (đã gỡ khỏi app) → không dựng thẻ, không đoán bừa',
    buildResumeCard({ route: '/khong-ton-tai', ts: day(1) }, { now: NOW }),
    null,
  );
}

console.log('② CHẶNG suy từ ĐÚNG nguồn — route studio thắng, rồi mới tới phase');
{
  const r = (route: string): ResumeLite => ({ route, flowId: 'p1', ts: day(2) });
  eq("'/cad-editor' → concept", buildResumeCard(r('/cad-editor'), { now: NOW })?.stage, 'concept');
  eq("'/present-editor' → present", buildResumeCard(r('/present-editor'), { now: NOW })?.stage, 'present');
  // Khớp `activeToPhase()` của lib/studio/stage-nav.ts: sửa ảnh thuộc chặng 3D, không phải chặng thứ tư.
  eq("'/photo-editor' → render (KHÔNG phải chặng riêng)", buildResumeCard(r('/photo-editor'), { now: NOW })?.stage, 'render');
  eq(
    "'/' + phase='present' → present (đứng canvas nhưng workspace là Trình chiếu)",
    buildResumeCard({ route: '/', phase: 'present', flowId: 'p1', ts: day(1) }, { now: NOW })?.stage,
    'present',
  );
  eq(
    'route studio ĐÈ phase cũ còn sót (merge nông của saveResume)',
    buildResumeCard({ route: '/cad-editor', phase: 'render', ts: day(1) }, { now: NOW })?.stage,
    'concept',
  );
}

console.log('③ TÊN DỰ ÁN — tra được thì lấy, KHÔNG tra được thì null (cấm bịa)');
{
  const recentProjects = [{ id: 'p1', name: 'Căn hộ Thảo Điền' }, { id: 'p2', name: 'Văn phòng Q7' }];
  eq(
    'khớp id → lấy đúng tên',
    buildResumeCard({ route: '/cad-editor', flowId: 'p1', ts: day(1) }, { recentProjects, now: NOW })?.projectName,
    'Căn hộ Thảo Điền',
  );
  eq(
    'id không có trong danh sách → null, không đoán tên gần đúng',
    buildResumeCard({ route: '/cad-editor', flowId: 'zzz', ts: day(1) }, { recentProjects, now: NOW })?.projectName,
    null,
  );
  eq(
    'store đang mở dự án khác → ưu tiên store (URL/store là nguồn sự thật hơn resume cũ)',
    buildResumeCard({ route: '/cad-editor', flowId: 'p1', ts: day(1) }, { recentProjects, currentProjectId: 'p2', now: NOW })
      ?.projectName,
    'Văn phòng Q7',
  );
}

console.log('④ SỐ NGÀY — có dấu thời gian thì đếm thật, ts=0 thì nói KHÔNG BIẾT');
{
  const at = (ts: number) => buildResumeCard({ route: '/cad-editor', flowId: 'p1', ts }, { now: NOW })?.daysAgo;
  eq('ghi cách đây 2 ngày', at(day(2)), 2);
  eq('ghi trong hôm nay → 0', at(NOW - 3 * 3_600_000), 0);
  eq('bản ghi cũ không có ts → null (KHÔNG hoá thành 1970)', at(0), null);
  eq('ts ở tương lai (lệch giờ máy) → kẹp về 0, không ra số âm', at(NOW + 86_400_000), 0);
}

console.log('⑤ ĐƯỜNG VỀ — đúng MỘT cú bấm, luôn có đích');
{
  const card = (route: string, flowId?: string) =>
    buildResumeCard({ route, flowId, ts: day(1) }, { now: NOW })!;
  eq('concept + có dự án → route scope dự án', resumeHref(card('/cad-editor', 'p1')), '/projects/p1/cad');
  eq('present + có dự án', resumeHref(card('/present-editor', 'p1')), '/projects/p1/present');
  eq('photo → chặng 3D của dự án', resumeHref(card('/photo-editor', 'p1')), '/projects/p1/render');
  eq('id có ký tự lạ → encode, không vỡ URL', resumeHref(card('/cad-editor', 'a b/c')), '/projects/a%20b%2Fc/cad');
  // Không có id thì vẫn phải có đích — route cũ là cầu redirect tự tra lại dự án.
  eq('concept không có id → route cũ', resumeHref(card('/cad-editor')), '/cad-editor');
  eq('present không có id → route cũ', resumeHref(card('/present-editor')), '/present-editor');
  eq('render không có id → route toàn cục', resumeHref(card('/photo-editor')), '/');
  ok(
    'mọi đường về đều KHÁC RỖNG (không có ca nào bấm mà không đi đâu)',
    ['/cad-editor', '/present-editor', '/photo-editor'].every((r) => resumeHref(card(r, 'p1')).length > 1),
  );
}

console.log('⑥ CÂU THỜI GIAN — song ngữ, thiếu nguồn thì im lặng');
{
  eq('0 ngày VI', daysAgoLabel(0, false), 'hôm nay');
  eq('1 ngày VI', daysAgoLabel(1, false), 'hôm qua');
  eq('3 ngày VI', daysAgoLabel(3, false), '3 ngày trước');
  eq('3 ngày EN', daysAgoLabel(3, true), '3 days ago');
  eq('null → không có câu nào', daysAgoLabel(null, false), null);
}

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
