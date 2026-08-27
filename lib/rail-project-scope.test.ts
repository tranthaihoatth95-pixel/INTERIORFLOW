/**
 * lib/rail-project-scope.test.ts — P0 `L2-02`: rail KHÔNG được dán FLOW id vào đường PROJECT.
 *
 * Lane `IF-UXUI-RUNTIME-001` đo trên app thật: ba nút Chặng ghép
 * `/projects/<id>/{cad,render,present}` với một id **không có hàng nào trong bảng `Project`** —
 * nó là một `Flow` tên *"Untitled flow"*, `projectId` rỗng.
 *
 * QUAN HỆ CANONICAL, đo trên dữ liệu thật trước khi sửa:
 *   · `Flow.projectId` là **`String?`** — flow CÓ THỂ không thuộc dự án nào.
 *   · **42/48 flow đang sống KHÔNG có `projectId`.** Flow độc lập là chuyện THƯỜNG.
 *   · App **không có route trang nào** cho một flow độc lập — quét mọi `page.tsx` trong
 *     `app/` cho 0 hit `flows/[id]` ⇒ **PRODUCT MISSING**. Không bịa URL cho ca đó.
 *
 * Tệp này test phần THUẦN của luật chọn phạm vi. Chạy bằng `sucrase-node` (`npm test`).
 */
import assert from 'assert';

let pass = 0;
const ok = (ten: string, dk: boolean) => {
  assert.ok(dk, `THẤT BẠI: ${ten}`);
  pass++;
};

/* ── Bản sao THUẦN của luật đang chạy trong `RailDieuHuong.tsx` ──────────────────────────────
 * Giữ đúng thứ tự ưu tiên và đúng điều kiện. Lệch một chỗ là test canh nhầm thứ.            */
type Resume = { flowId?: string; scopeKind?: 'project' | 'flow' } | null;
type FlowLite = { id: string; updatedAt?: string; project?: { id?: string } | null };

function duAnGanNhatTuResume(r: Resume): string | null {
  return r?.scopeKind === 'project' ? (r.flowId ?? null) : null;
}
function duAnTuMayChu(flows: FlowLite[]): string | null {
  const m = [...flows]
    .filter((f) => !!f.project?.id)
    .sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime())[0];
  return m?.project?.id ?? null;
}
function duAnHieuLuc(o: {
  duong?: string | null; currentProjectId?: string | null; resume?: Resume; flows?: FlowLite[];
}): string | null {
  const trenDuong = /^\/projects\/([^/]+)/.exec(o.duong ?? '')?.[1] ?? null;
  return trenDuong ?? o.currentProjectId ?? duAnGanNhatTuResume(o.resume ?? null)
    ?? duAnTuMayChu(o.flows ?? []) ?? null;
}

/* ═══ CA 1 · flow CÓ dự án → đi bằng `flow.projectId`, KHÔNG bằng `flow.id` ═══ */
{
  const flows: FlowLite[] = [{ id: 'flow-AAA', updatedAt: '2026-08-20', project: { id: 'proj-111' } }];
  const ra = duAnHieuLuc({ flows });
  ok('flow có dự án → dùng project.id', ra === 'proj-111');
  ok('KHÔNG dùng flow.id', ra !== 'flow-AAA');
}

/* ═══ CA 2 · flow ĐỘC LẬP (không projectId) → KHÔNG bịa URL ═══ */
{
  const flows: FlowLite[] = [
    { id: 'flow-BBB', updatedAt: '2026-08-26', project: null },
    { id: 'flow-CCC', updatedAt: '2026-08-25' },
  ];
  ok('mọi flow đều độc lập → null, rail mờ kèm lý do', duAnHieuLuc({ flows }) === null);
  ok('và tuyệt đối không rơi vào flow.id', duAnHieuLuc({ flows }) !== 'flow-BBB');
}

/* ═══ CA 3 · trộn — flow MỚI NHẤT độc lập, flow cũ hơn có dự án ═══ */
{
  const flows: FlowLite[] = [
    { id: 'flow-moi', updatedAt: '2026-08-27', project: null },      // mới nhất, KHÔNG dự án
    { id: 'flow-cu', updatedAt: '2026-08-10', project: { id: 'proj-222' } },
  ];
  // Đây là ca mà bản cũ sai nặng nhất: nó lấy "mới nhất" rồi coi id đó là dự án.
  ok('bỏ qua flow độc lập, lấy flow CÓ dự án mới nhất', duAnHieuLuc({ flows }) === 'proj-222');
}

/* ═══ CA 4 · resume — hai loại danh tính trong CÙNG một trường ═══ */
{
  ok('resume scopeKind=project → nhận', duAnGanNhatTuResume({ flowId: 'proj-333', scopeKind: 'project' }) === 'proj-333');
  ok('resume scopeKind=flow → TỪ CHỐI (đây là flow id)', duAnGanNhatTuResume({ flowId: 'flow-DDD', scopeKind: 'flow' }) === null);
  // Dữ liệu ghi TRƯỚC 27/08 không có `scopeKind`. "Không biết" phải xử như "không dùng được".
  ok('resume KHÔNG có scopeKind (dữ liệu cũ) → TỪ CHỐI', duAnGanNhatTuResume({ flowId: 'khong-ro' }) === null);
  ok('resume rỗng → null', duAnGanNhatTuResume(null) === null);
}

/* ═══ CA 5 · URL thắng tất cả — deep-link và điều hướng lùi ═══ */
{
  const flows: FlowLite[] = [{ id: 'f', updatedAt: '2026-08-27', project: { id: 'proj-999' } }];
  ok('deep-link `/projects/A/cad` thắng mọi nguồn khác',
    duAnHieuLuc({ duong: '/projects/proj-A/cad', currentProjectId: 'proj-B', flows }) === 'proj-A');
  ok('route KHÔNG mang id → rơi xuống currentProjectId',
    duAnHieuLuc({ duong: '/library', currentProjectId: 'proj-B', flows }) === 'proj-B');
  // Điều hướng lùi về `/`: URL không còn id, store có thể đã xoá ⇒ phải rơi tiếp, không giữ id cũ.
  ok('lùi về `/` mà store rỗng → dùng máy chủ (project.id), không dùng flow.id',
    duAnHieuLuc({ duong: '/', currentProjectId: null, flows }) === 'proj-999');
}

/* ═══ CA 6 · dự án bị XOÁ / THU HỒI QUYỀN ═══ */
{
  // `/api/flows` đã lọc theo phạm vi và `deletedAt` ở tầng máy chủ; client nhận được gì thì chỉ
  // có thứ đó. Dự án bị xoá/thu hồi ⇒ KHÔNG còn trong `flow.project` ⇒ chuỗi rơi về null.
  const sauKhiThuHoi: FlowLite[] = [{ id: 'flow-EEE', updatedAt: '2026-08-27', project: null }];
  ok('mất quyền/xoá dự án → null, KHÔNG giữ id cũ đã cache', duAnHieuLuc({ flows: sauKhiThuHoi }) === null);
}

/* ═══ CA 7 · người dùng CHƯA đăng nhập / chưa có gì ═══ */
{
  ok('không đường, không store, không resume, không flow → null', duAnHieuLuc({}) === null);
  ok('danh sách flow rỗng → null', duAnHieuLuc({ flows: [] }) === null);
}

/* ═══ CA 8 · canh chính MÃ SẢN XUẤT, không chỉ bản sao ở trên ═══ */
{
  const src = require('fs').readFileSync('components/nav/RailDieuHuong.tsx', 'utf8')
    .split('\n').filter((l: string) => !/^\s*(\*|\/\/|\/\*)/.test(l)).join('\n');
  ok('chuỗi `duAnHieuLuc` KHÔNG còn `flowId`', !/duAnHieuLuc\s*=[^;]*\bflowId\b/.test(src));
  ok('máy chủ lấy `project.id`, KHÔNG lấy `moiNhat.id`', /moiNhatCoDuAn\?\.project\?\.id/.test(src) && !/setDuAnMayChu\(moiNhat\.id\)/.test(src));
  ok('resume chỉ nhận khi scopeKind === project', /scopeKind === 'project'/.test(src));
}

console.log(`rail-project-scope: ${pass}/${pass} PASS`);
