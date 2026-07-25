/**
 * lib/sheets-persist.test.ts — khoá bucket theo DỰ ÁN + di trú bản ghi cũ (sửa rò chéo 25/07).
 * Chạy: node_modules/.bin/sucrase-node lib/sheets-persist.test.ts
 *
 * IndexedDB không có trong Node → dựng fake tối giản ngay trong file (chỉ get/put/delete
 * trên 1 Map), đủ để kiểm hành vi khoá/di trú mà không kéo thêm phụ thuộc.
 */

/* ------------------------- fake IndexedDB ------------------------- */

const store = new Map<string, unknown>();

function fireLater(fn: () => void) {
  queueMicrotask(fn); // handler được gán SAU lời gọi → phải hoãn 1 nhịp
}

function fakeRequest<T>(compute: () => T) {
  const req: Record<string, unknown> = { result: undefined };
  fireLater(() => {
    req.result = compute();
    (req.onsuccess as (() => void) | undefined)?.();
  });
  return req;
}

function makeDb() {
  return {
    objectStoreNames: { contains: () => true },
    createObjectStore: () => undefined,
    close: () => undefined,
    transaction() {
      const tx: Record<string, unknown> = {};
      let ops = 0;
      const done = () => {
        ops -= 1;
        if (ops === 0) fireLater(() => (tx.oncomplete as (() => void) | undefined)?.());
      };
      tx.objectStore = () => ({
        get: (k: string) => fakeRequest(() => store.get(k)),
        put: (v: unknown, k: string) => {
          ops += 1;
          fireLater(() => {
            store.set(k, v);
            done();
          });
        },
        delete: (k: string) => {
          ops += 1;
          fireLater(() => {
            store.delete(k);
            done();
          });
        },
      });
      return tx;
    },
  };
}

(globalThis as Record<string, unknown>).indexedDB = {
  open: () => {
    const req: Record<string, unknown> = { result: makeDb() };
    fireLater(() => (req.onsuccess as (() => void) | undefined)?.());
    return req;
  },
};

import { sheetsKey, loadSheets, saveSheets, clearSheets, type SheetsRecord } from './sheets-persist';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const rec = (name: string): SheetsRecord => ({
  v: 1,
  activeId: 's1',
  ts: 1,
  sheets: [{ id: 's1', name }],
});

async function main() {
  console.log('sheetsKey');
  ok('có projectId → khoá 3 phần', sheetsKey('u1', '/cad-editor', 'prjA') === 'u1::/cad-editor::prjA');
  ok('không projectId → khoá cũ 2 phần', sheetsKey('u1', '/cad-editor') === 'u1::/cad-editor');
  ok('projectId rỗng/space → khoá cũ', sheetsKey('u1', '/cad-editor', '  ') === 'u1::/cad-editor');
  ok('null → khoá cũ', sheetsKey('u1', '/cad-editor', null) === 'u1::/cad-editor');
  ok('hai dự án → hai khoá khác nhau',
    sheetsKey('u1', '/cad-editor', 'A') !== sheetsKey('u1', '/cad-editor', 'B'));
  ok('cùng dự án, khác chặng → khác khoá',
    sheetsKey('u1', '/cad-editor', 'A') !== sheetsKey('u1', '/present-editor', 'A'));

  console.log('\nghi/đọc tách bucket theo dự án');
  store.clear();
  await saveSheets('u1', '/cad-editor', rec('bản vẽ A'), 'prjA');
  await saveSheets('u1', '/cad-editor', rec('bản vẽ B'), 'prjB');
  const a = await loadSheets('u1', '/cad-editor', 'prjA');
  const b = await loadSheets('u1', '/cad-editor', 'prjB');
  ok('dự án A đọc đúng bộ của A', a?.sheets[0].name === 'bản vẽ A');
  ok('dự án B KHÔNG thấy bộ của A', b?.sheets[0].name === 'bản vẽ B');
  ok('dự án lạ → rỗng', (await loadSheets('u1', '/cad-editor', 'prjC')) === null);
  ok('user khác → rỗng', (await loadSheets('u2', '/cad-editor', 'prjA')) === null);

  console.log('\ndi trú bản ghi cũ (khoá 2 phần, trước 25/07)');
  store.clear();
  store.set('u1::/cad-editor', rec('việc đang làm dở'));
  const first = await loadSheets('u1', '/cad-editor', 'prjA');
  ok('dự án mở đầu tiên nhận bản ghi cũ', first?.sheets[0].name === 'việc đang làm dở');
  ok('bucket chung đã bị xoá sau di trú', !store.has('u1::/cad-editor'));
  ok('bản ghi nằm ở bucket dự án A', store.has('u1::/cad-editor::prjA'));
  ok('dự án THỨ HAI không thấy nữa (hết rò chéo)',
    (await loadSheets('u1', '/cad-editor', 'prjB')) === null);

  console.log('\nlề lối cũ + dọn');
  store.clear();
  store.set('u1::/cad-editor', rec('route toàn cục'));
  ok('không truyền projectId → vẫn đọc bucket chung, KHÔNG di trú',
    (await loadSheets('u1', '/cad-editor'))?.sheets[0].name === 'route toàn cục');
  ok('bucket chung còn nguyên', store.has('u1::/cad-editor'));

  store.clear();
  await saveSheets('u1', '/cad-editor', rec('x'), 'prjA');
  await saveSheets('u1', '/cad-editor', rec('y'), 'prjB');
  await clearSheets('u1', '/cad-editor', 'prjA');
  ok('clearSheets chỉ xoá đúng dự án', !store.has('u1::/cad-editor::prjA') && store.has('u1::/cad-editor::prjB'));

  store.clear();
  store.set('u1::/cad-editor::prjA', { v: 1, activeId: 's', ts: 1, sheets: [] });
  ok('bản ghi hỏng (0 sheet) → null', (await loadSheets('u1', '/cad-editor', 'prjA')) === null);

  console.log(`\n${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

void main();
