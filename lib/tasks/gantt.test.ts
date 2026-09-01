/**
 * Test `gantt.ts` — chạy: node_modules/.bin/sucrase-node lib/tasks/gantt.test.ts
 * (nằm sẵn trên đường `npm test`: `test:sweep` gom mọi `*.test.ts`.)
 *
 * Trục chính: **việc KHÔNG có ngày thì KHÔNG được vẽ**. Đó là chỗ mọi phần mềm
 * Gantt nói dối — gán ngầm "hôm nay" rồi vẽ một thanh trông rất thật. Các ca ②
 * là ca chống đúng chuyện đó; ca ① chỉ neo hình học.
 */
import { docMoc, dungGantt, viecTre } from './gantt';
import type { TaskRow } from '../server/tasks';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log('  ok  -', name);
  } else {
    fail++;
    console.log('  FAIL-', name);
  }
}
const gan = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;

const NGAY = 86_400_000;
const T = (iso: string) => Date.parse(iso);

function viec(id: string, startAt: string | null, dueAt: string | null): TaskRow {
  return {
    id,
    projectId: 'p1',
    title: `việc ${id}`,
    statusId: 's1',
    assigneeIds: [],
    startAt,
    dueAt,
    order: 0,
    stage: null,
    workspaceId: null,
    entityId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

// ── ① Hình học cửa sổ + thanh ────────────────────────────────────────────────
console.log('① cửa sổ và thanh');
{
  const d = dungGantt([
    viec('a', '2026-03-01T00:00:00Z', '2026-03-11T00:00:00Z'),
    viec('b', '2026-03-06T00:00:00Z', '2026-03-21T00:00:00Z'),
  ]);
  ok('cửa sổ ôm từ mốc sớm nhất tới muộn nhất',
    d.cuaSo!.batDau === T('2026-03-01T00:00:00Z') && d.cuaSo!.ketThuc === T('2026-03-21T00:00:00Z'));
  ok('cửa sổ 20 ngày', gan(d.cuaSo!.soNgay, 20));
  ok('thanh đầu bắt từ 0%', gan(d.thanh[0].traiPhanTram, 0));
  ok('thanh a rộng 10/20 = 50%', gan(d.thanh[0].rongPhanTram, 50));
  ok('thanh b bắt ở 5/20 = 25%', gan(d.thanh[1].traiPhanTram, 25));
  ok('thanh b rộng 15/20 = 75%', gan(d.thanh[1].rongPhanTram, 75));
  ok('thanh cuối chạm mép phải',
    gan(d.thanh[1].traiPhanTram + d.thanh[1].rongPhanTram, 100));
  ok('không việc nào bị bỏ', d.khongXepDuoc.length === 0);
}
{
  // mọi việc cùng đúng một mốc ⇒ cửa sổ dẹt, KHÔNG được chia cho 0
  const d = dungGantt([
    viec('a', '2026-03-01T00:00:00Z', '2026-03-01T00:00:00Z'),
    viec('b', '2026-03-01T00:00:00Z', '2026-03-01T00:00:00Z'),
  ]);
  ok('cửa sổ dẹt ⇒ 0 ngày', gan(d.cuaSo!.soNgay, 0));
  ok('cửa sổ dẹt ⇒ mọi % hữu hạn, không NaN',
    d.thanh.every((b) => Number.isFinite(b.traiPhanTram) && Number.isFinite(b.rongPhanTram)));
}

// ── ② KHÔNG BỊA NGÀY — trục chính ────────────────────────────────────────────
console.log('② việc không ngày thì không vẽ');
{
  const d = dungGantt([
    viec('a', '2026-03-01T00:00:00Z', '2026-03-11T00:00:00Z'),
    viec('trong', null, null),
  ]);
  ok('việc không ngày KHÔNG lên dải', d.thanh.every((b) => b.id !== 'trong'));
  ok('nhưng ĐƯỢC GỌI TÊN', d.khongXepDuoc.length === 1 && d.khongXepDuoc[0].id === 'trong');
  ok('lý do nói rõ', d.khongXepDuoc[0].lyDo.includes('chưa có ngày'));
  ok('cửa sổ KHÔNG bị việc trống kéo giãn',
    d.cuaSo!.ketThuc === T('2026-03-11T00:00:00Z'));
}
{
  const d = dungGantt([viec('a', '2026-03-01T00:00:00Z', null)]);
  ok('có bắt đầu nhưng không hạn ⇒ KHÔNG tự gán hạn, bỏ ra kèm lý do',
    d.thanh.length === 0 && d.khongXepDuoc[0].lyDo.includes('chưa có hạn'));
  ok('không xếp được cái nào ⇒ cửa sổ là null, không phải "tuần này"', d.cuaSo === null);
}
{
  const d = dungGantt([viec('a', 'không-phải-ngày', 'cũng-không')]);
  ok('ngày rác ⇒ bỏ ra, không ném', d.thanh.length === 0 && d.khongXepDuoc.length === 1);
  ok('lý do phân biệt được với "chưa có ngày"',
    d.khongXepDuoc[0].lyDo.includes('không đọc được'));
}
ok('danh sách rỗng ⇒ cửa sổ null, không nổ', dungGantt([]).cuaSo === null);

// ── ③ Cột mốc và dữ liệu ngược ───────────────────────────────────────────────
console.log('③ cột mốc · ngược');
{
  const d = dungGantt([viec('m', null, '2026-03-05T00:00:00Z')]);
  ok('chỉ có hạn ⇒ CỘT MỐC, vẫn được vẽ', d.thanh.length === 1 && d.thanh[0].laCotMoc);
  ok('cột mốc có bề rộng 0', gan(d.thanh[0].rongPhanTram, 0));
  ok('cột mốc bắt đầu = kết thúc', d.thanh[0].batDau === d.thanh[0].ketThuc);
}
{
  const d = dungGantt([
    viec('nguoc', '2026-03-20T00:00:00Z', '2026-03-10T00:00:00Z'),
    viec('thang', '2026-03-01T00:00:00Z', '2026-03-05T00:00:00Z'),
  ]);
  const n = d.thanh.find((b) => b.id === 'nguoc')!;
  ok('bắt đầu SAU hạn ⇒ vẫn vẽ (dữ liệu là dữ liệu)', !!n);
  ok('nhưng bị ĐÁNH DẤU ngược', n.nguoc);
  ok('thanh không bao giờ có bề rộng âm', d.thanh.every((b) => b.rongPhanTram >= 0));
  ok('việc bình thường KHÔNG bị đánh dấu ngược',
    d.thanh.find((b) => b.id === 'thang')!.nguoc === false);
  ok('cột mốc không phải là "ngược"',
    dungGantt([viec('m', null, '2026-03-05T00:00:00Z')]).thanh[0].nguoc === false);
}

// ── ④ Thứ tự ổn định ─────────────────────────────────────────────────────────
console.log('④ thứ tự');
{
  const d = dungGantt([
    viec('c', '2026-03-10T00:00:00Z', '2026-03-12T00:00:00Z'),
    viec('a', '2026-03-01T00:00:00Z', '2026-03-02T00:00:00Z'),
    viec('b', '2026-03-05T00:00:00Z', '2026-03-06T00:00:00Z'),
  ]);
  ok('sắp theo mốc bắt đầu', d.thanh.map((b) => b.id).join('') === 'abc');
}
{
  const d = dungGantt([
    viec('dai', '2026-03-01T00:00:00Z', '2026-03-20T00:00:00Z'),
    viec('ngan', '2026-03-01T00:00:00Z', '2026-03-02T00:00:00Z'),
  ]);
  ok('cùng mốc bắt đầu ⇒ việc NGẮN lên trước', d.thanh[0].id === 'ngan');
}
{
  const d = dungGantt([
    viec('z', '2026-03-01T00:00:00Z', '2026-03-02T00:00:00Z'),
    viec('y', '2026-03-01T00:00:00Z', '2026-03-02T00:00:00Z'),
  ]);
  ok('hoà cả mốc lẫn độ dài ⇒ theo id, ổn định', d.thanh.map((b) => b.id).join('') === 'yz');
}

// ── ⑤ docMoc · viecTre ───────────────────────────────────────────────────────
console.log('⑤ docMoc · viecTre');
ok('docMoc null ⇒ null', docMoc(null) === null);
ok('docMoc chuỗi rỗng ⇒ null', docMoc('') === null);
ok('docMoc rác ⇒ null, không NaN rò ra', docMoc('hôm nào đó') === null);
ok('docMoc ISO ⇒ ms đúng', docMoc('2026-03-01T00:00:00Z') === T('2026-03-01T00:00:00Z'));
{
  const d = dungGantt([
    viec('xong', '2026-03-01T00:00:00Z', '2026-03-05T00:00:00Z'),
    viec('dang', '2026-03-01T00:00:00Z', '2026-03-20T00:00:00Z'),
  ]);
  const bayGio = T('2026-03-10T00:00:00Z');
  ok('chỉ việc quá hạn mới là trễ',
    viecTre(d, bayGio).map((b) => b.id).join('') === 'xong');
  ok('đúng mốc hạn thì CHƯA trễ',
    viecTre(d, T('2026-03-05T00:00:00Z')).length === 0);
  ok('bây giờ là THAM SỐ — lùi mốc thì không còn việc trễ nào',
    viecTre(d, T('2026-02-01T00:00:00Z')).length === 0);
  ok('đẩy mốc đủ xa thì mọi việc đều trễ',
    viecTre(d, T('2026-03-20T00:00:00Z') + NGAY).length === 2);
}

console.log(`\ngantt.test.ts — pass ${pass} · fail ${fail}`);
if (fail > 0) process.exit(1);
