/**
 * lib/site/quyen.test.ts — QUYỀN SỬA SỰ THẬT ĐỊA ĐIỂM (chỉ thị §3A).
 *
 * Ca này TỪNG KHÔNG AI KIỂM ĐƯỢC: máy chỉ có một tài khoản nên câu *"chỉ chủ dự án đổi được vị
 * trí"* nằm trong mã mà chưa từng hiện ra màn hình. Không dựng tài khoản giả trong CSDL (ghi DB
 * đang bị chặn, và bịa dữ liệu để test là tự lừa mình) — thay vào đó kiểm **tất định** đúng ba
 * mắt xích tạo nên bảo đảm đó, mỗi mắt xích một cách:
 *   ① thang quyền: `crea` < `owner` ⇒ so sánh cấp phải TRẢ FALSE
 *   ② lớp lỗi: thiếu quyền → `AccessError(403)` → `accessErrorPayload` phải ra đúng 403
 *   ③ tuyến đường: PATCH của route site phải đòi `'owner'`, GET chỉ cần `'viewer'`
 * Ba mắt xích khép lại thành: người không phải chủ PATCH → 403, hồ sơ không đổi.
 */
import { readFileSync } from 'fs';
import { ROLE_RANK, type ProjectRole } from '../server/access-policy';
// ⚠️ KHÔNG import `../server/access` — tệp đó kéo theo Prisma qua alias `@/`, mà bộ chạy test
// (`sucrase-node`) không phân giải alias ⇒ nạp là chết. Phần lớp-lỗi vì thế kiểm bằng ĐỌC MÃ
// (mục [2b]) thay vì gọi hàm; phần THANG QUYỀN vẫn gọi hàm thật vì `access-policy` là tệp thuần.

let fail = 0;
const ok = (m: string, c: unknown) => { if (c) console.log(`  ok  - ${m}`); else { console.log(`  FAIL - ${m}`); fail++; } };

console.log('\n[1] THANG QUYỀN — sửa sự thật gốc của dự án là việc của CHỦ');
{
  const du = (co: ProjectRole, can: ProjectRole) => ROLE_RANK[co] >= ROLE_RANK[can];
  ok('viewer KHÔNG đủ quyền owner', !du('viewer', 'owner'));
  ok('drafter KHÔNG đủ quyền owner', !du('drafter', 'owner'));
  ok('⭐ crea (cao thứ nhì) VẪN KHÔNG đủ quyền owner', !du('crea', 'owner'));
  ok('owner thì đủ', du('owner', 'owner'));
  ok('nhưng ĐỌC thì viewer là đủ', du('viewer', 'viewer'));
}

console.log('\n[2b] LỚP LỖI — thiếu quyền ném đúng 403, không phải 500 chung chung');
{
  const a = readFileSync('lib/server/access.ts', 'utf8');
  ok('so cấp không đủ → ném AccessError(403)', /ROLE_RANK\[role\] < ROLE_RANK\[minRole\]\) throw new AccessError\(403/.test(a));
  ok('không phải member → 404 chứ không 403 (không lộ dự án có tồn tại)', /AccessError\(404/.test(a));
  ok('accessErrorPayload chỉ nhận AccessError, lỗi thường re-throw', /e instanceof AccessError \? \{ status: e\.status/.test(a));
}

console.log('\n[3] TUYẾN ĐƯỜNG — route site đòi đúng cấp quyền');
{
  const r = readFileSync('app/api/projects/[id]/site/route.ts', 'utf8');
  const get = r.slice(r.indexOf('export async function GET'), r.indexOf('export async function PATCH'));
  const patch = r.slice(r.indexOf('export async function PATCH'));
  ok('GET đòi viewer', /assertProjectAccess\([^)]*'viewer'\)/.test(get));
  ok('⭐ PATCH đòi OWNER', /assertProjectAccess\([^)]*'owner'\)/.test(patch));
  ok('PATCH kiểm quyền TRƯỚC khi đọc thân yêu cầu', patch.indexOf('assertProjectAccess') < patch.indexOf('req.json'));
  ok('PATCH kiểm quyền TRƯỚC khi ghi', patch.indexOf('assertProjectAccess') < patch.indexOf('ghiHoSo'));
  ok('lỗi quyền đi qua accessErrorPayload, không nuốt im lặng', /accessErrorPayload/.test(r));
}

console.log('\n[4] HỆ QUẢ: KHÔNG ĐỦ QUYỀN THÌ KHÔNG CÓ ĐƯỜNG NÀO CHẠM `ghiHoSo`');
{
  const r = readFileSync('app/api/projects/[id]/site/route.ts', 'utf8');
  const patch = r.slice(r.indexOf('export async function PATCH'));
  // `assertProjectAccess` NÉM lỗi; nó đứng trước `ghiHoSo` trong cùng khối try ⇒ ném là nhảy
  // thẳng xuống catch, không có nhánh nào đi vòng qua nó tới chỗ ghi.
  ok('chỉ có MỘT chỗ gọi ghiHoSo', (patch.match(/ghiHoSo\(/g) ?? []).length === 1);
  ok('chỗ ghi nằm SAU cửa quyền trong cùng khối try', patch.indexOf('assertProjectAccess') < patch.indexOf('ghiHoSo('));
}

console.log(fail ? `\n❌ ${fail} kiểm HỎNG` : '\n✅ Tất cả kiểm ĐẠT');
if (fail) process.exit(1);
