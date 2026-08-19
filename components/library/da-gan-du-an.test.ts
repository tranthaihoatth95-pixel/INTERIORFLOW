/**
 * components/library/da-gan-du-an.test.ts — chạy bằng:
 *   node_modules/.bin/sucrase-node components/library/da-gan-du-an.test.ts
 *
 * Mỗi ca dưới đây là MỘT CÁCH HỎNG đã lường trước, không phải một dòng cho đủ lệ:
 *  1. Đã gắn ĐÚNG dự án đang mở ⇒ nút phải hiện "Đã dùng ✓" ngay khi mở panel (bệnh gốc:
 *     trước 20/08 nút chỉ biết sau khi người dùng bấm thử, reload là nói sai lại).
 *  2. Cùng asset nhưng ở dự án KHÁC ⇒ vẫn là CHƯA gắn. Đây là ca dễ hỏng nhất: where-used cố ý
 *     liệt kê mọi dự án, đọc nhầm thành `rows.length > 0` là nút chết ở mọi dự án mới.
 *  3. Chưa tải xong / lỗi (`null`) ⇒ false, và bên gọi TỰ xử trạng thái chờ — hàm này không
 *     được đoán bừa là "đã gắn" khi chưa biết.
 *  4. Không mở dự án nào ⇒ false dù rows đầy (câu hỏi không có nghĩa lúc đó).
 *  5. Nhiều usage cùng một dự án (ref-render + ref-moodboard) vẫn chỉ là "đã gắn", không nhân đôi
 *     ý nghĩa — nút là nhị phân.
 */

import { strict as assert } from 'assert';
import { daGanVaoDuAn, type WhereUsedRow } from './da-gan-du-an';

const hang = (id: string, projectId: string, usage = 'ref-render'): WhereUsedRow => ({
  id,
  projectId,
  usage,
  project: { id: projectId, name: `Dự án ${projectId}` },
});

// 1 — đúng dự án đang mở
assert.equal(daGanVaoDuAn([hang('u1', 'p-A')], 'p-A'), true, '1: gắn đúng dự án phải ra true');

// 2 — cùng asset, dự án khác
assert.equal(daGanVaoDuAn([hang('u1', 'p-A')], 'p-B'), false, '2: dự án khác phải ra false');
assert.equal(
  daGanVaoDuAn([hang('u1', 'p-A'), hang('u2', 'p-C')], 'p-B'),
  false,
  '2b: rows đầy mà không có p-B thì vẫn false (cấm đọc rows.length)',
);

// 3 — chưa tải xong / lỗi
assert.equal(daGanVaoDuAn(null, 'p-A'), false, '3: null phải ra false, không đoán bừa');

// 4 — không mở dự án nào
assert.equal(daGanVaoDuAn([hang('u1', 'p-A')], null), false, '4: không có projectId ⇒ false');
assert.equal(daGanVaoDuAn([hang('u1', 'p-A')], ''), false, '4b: projectId rỗng ⇒ false');

// 5 — nhiều usage cùng dự án
assert.equal(
  daGanVaoDuAn([hang('u1', 'p-A', 'ref-render'), hang('u2', 'p-A', 'ref-moodboard')], 'p-A'),
  true,
  '5: nhiều usage cùng dự án vẫn là true',
);

// rỗng
assert.equal(daGanVaoDuAn([], 'p-A'), false, '6: chưa dự án nào dùng ⇒ false');

console.log('da-gan-du-an.test.ts — OK');
