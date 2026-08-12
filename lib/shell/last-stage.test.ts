/**
 * lib/shell/last-stage.test.ts — kiểm đơn vị [marker: lastStage] (chạy bằng sucrase-node,
 * cùng khuôn các *.test.ts trong repo). Node không có localStorage → stub tối thiểu.
 */

import assert from 'node:assert/strict';
import { getLastStage, setLastStage } from './last-stage';

/* stub localStorage tối thiểu cho môi trường node */
const mem = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k: string, v: string) => void mem.set(k, String(v)),
  removeItem: (k: string) => void mem.delete(k),
};

// 1. Chưa ghi → null (card rơi về mặc định 'concept' ở nơi gọi, không bịa ở đây).
assert.equal(getLastStage('p1'), null);

// 2. Ghi rồi đọc lại đúng chặng, đúng khoá per-project.
setLastStage('p1', 'render');
setLastStage('p2', 'concept');
assert.equal(getLastStage('p1'), 'render');
assert.equal(getLastStage('p2'), 'concept');

// 3. Khoá rỗng/null → không ghi, không nổ.
setLastStage('', 'present');
setLastStage(null, 'present');
assert.equal(getLastStage(''), null);
assert.equal(getLastStage(null), null);

// 4. Giá trị hỏng trong storage (tay ai đó sửa) → null, không ném.
mem.set('interiorflow.lastStage.p3', 'khong-phai-phase');
assert.equal(getLastStage('p3'), null);

// 5. Ghi đè: chặng mới thắng chặng cũ.
setLastStage('p1', 'present');
assert.equal(getLastStage('p1'), 'present');

console.log('last-stage.test.ts OK (5 nhóm assert)');
