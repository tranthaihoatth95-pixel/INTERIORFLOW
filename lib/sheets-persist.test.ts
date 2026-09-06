/**
 * lib/sheets-persist.test.ts — khoá bucket theo DỰ ÁN + di trú bản ghi cũ (sửa rò chéo 25/07).
 * Chạy: node_modules/.bin/sucrase-node lib/sheets-persist.test.ts
 *
 * IndexedDB không có trong Node → dựng fake tối giản ngay trong file (chỉ get/put/delete
 * trên 1 Map), đủ để kiểm hành vi khoá/di trú mà không kéo thêm phụ thuộc.
 *
 * BỔ SUNG 01/09 (vá lag): khối test autosaver — tách lưu ĐẦY (`touch('doc')`, stringify trọn
 * bản ghi) / lưu NHẸ (`touch('viewport')`, vá viewport vào bản sạch cũ qua `applyLight`,
 * KHÔNG stringify doc), bậc không hạ, và lượt nhẹ đầu tiên chưa có chỗ dựa thì rơi về lưu đầy.
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

import { sheetsKey, loadSheets, saveSheets, clearSheets, createSheetsAutosaver, type SheetsRecord } from './sheets-persist';

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

/** đợi các microtask/macrotask của fake IDB + promise put giải quyết xong. */
const tick = () => new Promise((r) => setTimeout(r, 10));

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

  /* ---------------- autosaver — tách lưu ĐẦY / lưu NHẸ (vá lag 01/09) ---------------- */
  console.log('\nautosaver — lưu ĐẦY vs lưu NHẸ');
  store.clear();
  let getRecordCalls = 0;
  const savedBytes: number[] = [];
  let savedLight = 0;
  const docLon = { entities: [{ id: 'e1', mo_ta: 'doc thật, chỉ được stringify ở lượt lưu ĐẦY' }] };
  const live = { viewport: { scale: 1, panX: 0, panY: 0 }, currentLayer: 'l-wall' };
  const getRecord = (): SheetsRecord => {
    getRecordCalls += 1;
    return {
      v: 1,
      activeId: 's1',
      ts: Date.now(),
      sheets: [{ id: 's1', name: 'Bản vẽ 1', doc: docLon, viewport: live.viewport, currentLayer: live.currentLayer }],
    };
  };
  const saver = createSheetsAutosaver('u1', '/cad-editor', getRecord, {
    projectId: 'prjX',
    onSaved: (bytes) => savedBytes.push(bytes),
    onSavedLight: () => { savedLight += 1; },
    applyLight: (last) => ({
      ...last,
      ts: Date.now(),
      sheets: [{ ...last.sheets[0], viewport: live.viewport, currentLayer: live.currentLayer }],
    }),
  });
  const KEY = 'u1::/cad-editor::prjX';
  const recNow = () => store.get(KEY) as SheetsRecord | undefined;

  // ① lượt viewport ĐẦU TIÊN của phiên (chưa có bản đầy nào làm chỗ dựa) → rơi về lưu đầy.
  saver.touch('viewport');
  saver.flush();
  await tick();
  ok('① viewport-touch khi chưa có bản đầy → lưu ĐẦY (an toàn trước)', savedBytes.length === 1 && getRecordCalls === 1 && savedLight === 0);
  ok('① bản ghi nằm trong IDB', recNow()?.sheets[0].id === 's1');

  // ② pan/zoom sau đó → lưu NHẸ: không gọi getRecord (tức không stringify doc), viewport mới vào IDB.
  live.viewport = { scale: 2, panX: 9, panY: -9 };
  saver.touch('viewport');
  saver.flush();
  await tick();
  const sau2 = recNow();
  ok('② lưu nhẹ KHÔNG gọi getRecord / không đếm byte, chỉ báo onSavedLight', getRecordCalls === 1 && savedBytes.length === 1 && savedLight === 1);
  ok('② viewport MỚI nằm trong bản ghi', (sau2?.sheets[0].viewport as { scale: number }).scale === 2);
  ok('② doc vẫn NGUYÊN trong bản ghi (không mất dữ liệu)', (sau2?.sheets[0].doc as { entities: { id: string }[] }).entities[0].id === 'e1');

  // ③ bậc không hạ: viewport rồi doc trước khi ghi → MỘT lượt lưu ĐẦY.
  live.viewport = { scale: 3, panX: 1, panY: 1 };
  saver.touch('viewport');
  saver.touch('doc');
  saver.flush();
  await tick();
  ok('③ doc-touch không bị viewport-touch hạ cấp → lưu ĐẦY', getRecordCalls === 2 && savedBytes.length === 2);
  ok('③ viewport mới nhất vẫn vào theo lượt đầy', (recNow()?.sheets[0].viewport as { scale: number }).scale === 3);

  // ④ applyLight từ chối (vd đổi tab, id lệch) → rơi về lưu đầy, không mất lượt.
  const saver2 = createSheetsAutosaver('u1', '/cad-editor', getRecord, {
    projectId: 'prjX',
    onSaved: (bytes) => savedBytes.push(bytes),
    onSavedLight: () => { savedLight += 1; },
    applyLight: () => null,
  });
  saver2.touch('doc');
  saver2.flush();
  await tick();
  const callsTruoc = getRecordCalls;
  saver2.touch('viewport');
  saver2.flush();
  await tick();
  ok('④ applyLight trả null → lượt viewport vẫn ra lưu ĐẦY', getRecordCalls === callsTruoc + 1);
  saver2.dispose();

  // ⑤ flush khi không dirty → không ghi gì thêm (hành vi cũ).
  const bytesTruoc = savedBytes.length;
  const lightTruoc = savedLight;
  saver.flush();
  await tick();
  ok('⑤ flush không dirty → im lặng', savedBytes.length === bytesTruoc && savedLight === lightTruoc);
  saver.dispose();

  // ⑥ dispose huỷ thay đổi treo — không ghi sau khi dispose (hành vi cũ giữ nguyên).
  const saver3 = createSheetsAutosaver('u1', '/cad-editor', getRecord, { projectId: 'prjY' });
  saver3.touch('doc');
  saver3.dispose();
  await tick();
  ok('⑥ dispose trước debounce → không ghi bucket mới', !store.has('u1::/cad-editor::prjY'));

  /**
   * ⑦ `flushCho` — CHỖ DỰA CỦA LUẬT "chỉ buông tay khi hàng đã hạ cánh" (06/09).
   * Khác `flush()` đúng hai điểm, và cả hai đều phải đúng nếu không cầu 2D→Trình chiếu mất dữ
   * liệu trở lại: (a) ghi CẢ KHI không có thay đổi treo — người gọi hỏi "đã bền chưa" chứ không
   * hỏi "có gì mới không"; (b) resolve SAU khi bản ghi đã nằm trong kho, không phải trước.
   */
  const saver4 = createSheetsAutosaver('u1', '/present-editor', getRecord, { projectId: 'prjZ' });
  ok('⑦a chưa flushCho thì bucket chưa có gì', !store.has('u1::/present-editor::prjZ'));
  const daGhi = await saver4.flushCho();
  ok('⑦b flushCho ghi CẢ KHI không dirty (flush thường thì im lặng)', daGhi === true);
  ok('⑦c resolve xong thì bản ghi ĐÃ nằm trong kho, không phải "sắp có"',
    store.has('u1::/present-editor::prjZ'));
  saver4.dispose();

  console.log(`\n${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

void main();
