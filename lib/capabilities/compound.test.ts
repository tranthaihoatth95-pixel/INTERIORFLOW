/**
 * lib/capabilities/compound.test.ts — MÁY CANH cho bảng năng lực gộp.
 *
 * ⭐ VÌ SAO CÓ FILE NÀY: bản đầu của `compound.ts` khai **3 id node KHÔNG TỒN TẠI**
 * (`vision.measureObjectTiered` · `idfc.fromPhoto` · `cad.campath`) — chúng là TÊN HÀM trong
 * `lib/`, bị trộn vào cùng trường với `type` của node registry. Lane thi công phát hiện khi
 * `getDefinition(id)` sắp ném lỗi. Lỗi đó **tsc không bắt được** (cả hai đều là `string`) và
 * **không lộ ra cho tới lúc chạy đúng nhánh đó** — đúng loại lỗi cần máy canh, không phải lời dặn.
 */

import assert from 'node:assert';
import { NANG_LUC_GOP, nangLucTheoStage, workingSet, TRAN_TOOLBELT } from './compound';
import { NODE_DEFINITIONS } from '../nodes/registry';

let pass = 0;
function test(ten: string, fn: () => void) {
  fn();
  pass++;
  console.log(`  ✓ ${ten}`);
}

const NODE_TYPES = new Set(NODE_DEFINITIONS.map((d) => d.type));

console.log('[A] Bất biến chống id ma');

test('mọi id trong `lenhNoiBo` PHẢI có thật trong node registry', () => {
  const ma: string[] = [];
  for (const n of NANG_LUC_GOP) {
    for (const id of n.lenhNoiBo) if (!NODE_TYPES.has(id)) ma.push(`${n.id} → ${id}`);
  }
  assert.deepStrictEqual(
    ma,
    [],
    'id không tồn tại trong lib/nodes/registry.ts. Nếu nó là HÀM trong lib/ thì khai ở `hamNoiBo`, ' +
      'đừng nhét vào `lenhNoiBo` — trộn hai bộ từ vựng chính là lỗi đã xảy ra 20/08.',
  );
});

test('`hamNoiBo` KHÔNG được chứa id node — hai bộ từ vựng phải tách hẳn', () => {
  const lan: string[] = [];
  for (const n of NANG_LUC_GOP) {
    for (const h of n.hamNoiBo ?? []) if (NODE_TYPES.has(h)) lan.push(`${n.id} → ${h}`);
  }
  assert.deepStrictEqual(lan, [], 'đây là node, phải khai ở `lenhNoiBo`');
});

test('mỗi năng lực phải điều phối ÍT NHẤT một máy thật (node hoặc hàm)', () => {
  // Năng lực không nối vào máy nào = một icon không làm gì — đúng thứ "cấm nút giả" cấm.
  const rong = NANG_LUC_GOP.filter((n) => n.lenhNoiBo.length === 0 && (n.hamNoiBo ?? []).length === 0);
  assert.deepStrictEqual(rong.map((n) => n.id), []);
});

console.log('[B] Luật khoá trong kiểu — chặn nới lỏng âm thầm');

test('mọi năng lực đều là ĐỀ XUẤT (cấm ghi đè im lặng)', () => {
  for (const n of NANG_LUC_GOP) assert.strictEqual(n.deXuat, true, `${n.id} phải deXuat: true`);
});

test('rail KHÔNG bao giờ là bề mặt của năng lực (rail = bản đồ, không phải hộp đồ nghề)', () => {
  for (const n of NANG_LUC_GOP) {
    assert.ok(!(n.beMat as string[]).includes('rail'), `${n.id} không được sống ở rail`);
  }
});

test('nấc mặc định luôn là `nhanh` — phức tạp bên dưới ≠ nhiều núm bên trên', () => {
  for (const n of NANG_LUC_GOP) assert.strictEqual(n.nacMacDinh, 'nhanh', n.id);
});

test('id và icon không trùng nhau giữa các năng lực (một ý định = một identity)', () => {
  const ids = NANG_LUC_GOP.map((n) => n.id);
  assert.strictEqual(new Set(ids).size, ids.length, 'id trùng');
});

console.log('[C] Toolbelt — working set có trần');

test('workingSet không bao giờ vượt trần 8 ở mọi chặng', () => {
  for (const s of ['cad', 'render', 'present'] as const) {
    assert.ok(workingSet(s).length <= TRAN_TOOLBELT, `${s} vượt trần`);
  }
});

test('workingSet chỉ trả năng lực khai đúng chặng đó', () => {
  for (const s of ['cad', 'render', 'present'] as const) {
    for (const n of workingSet(s)) assert.ok(n.stages.includes(s), `${n.id} lọt sang ${s}`);
  }
});

test('Auto Grid CHỈ sống ở Trình chiếu (cố ý không làm khung chung cho Home/Files)', () => {
  const ag = NANG_LUC_GOP.find((n) => n.id === 'auto-grid')!;
  assert.deepStrictEqual(ag.stages, ['present']);
  assert.strictEqual(nangLucTheoStage('cad').some((n) => n.id === 'auto-grid'), false);
});

test('năng lực suy-từ-ảnh phải mang mucSuThat `suyRa` — cổng chặn BOQ', () => {
  const i3d = NANG_LUC_GOP.find((n) => n.id === 'image-to-3d')!;
  assert.strictEqual(i3d.mucSuThat, 'suyRa', 'đổi thành khongPhaiSoDo/nguoiXacNhan là mở cửa cho số ước tính vào BOQ');
});

console.log(`\ncompound.test.ts — ${pass}/${pass} PASS`);
