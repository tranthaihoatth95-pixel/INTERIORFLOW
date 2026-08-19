/** Test `idfc-store.ts` — chạy: node_modules/.bin/sucrase-node lib/library/idfc-store.test.ts
 *  Import TƯƠNG ĐỐI (không `@/…`) theo đúng quy ước các test chạy dưới sucrase-node, khuôn
 *  copy từ `lib/library/spec-panel.test.ts`.
 *
 *  idfc-store.ts đọc/ghi `window.localStorage` — nhưng test chạy trong Node, không có `window`.
 *  Phải tự dựng một localStorage giả và gán vào `globalThis.window` TRƯỚC dòng import module,
 *  nếu không mọi hàm sẽ đi vào nhánh `typeof window === 'undefined'` (câm lặng, không throw)
 *  và test sẽ "pass giả" mà không kiểm được gì thật.
 */

// ─── Dựng localStorage giả (Map trong bộ nhớ) — đủ 2 hàm idfc-store dùng: getItem/setItem ───
class FakeLocalStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  // tiện cho test tự bơm dữ liệu rác thẳng vào ô nhớ, không qua saveIdfcItems
  __raw(key: string, value: string): void {
    this.store.set(key, value);
  }
}

const fakeWindow = { localStorage: new FakeLocalStorage() };
(globalThis as unknown as { window: typeof fakeWindow }).window = fakeWindow;

// import SAU khi window đã có mặt — module đọc `typeof window` lúc hàm chạy (không phải lúc
// import), nhưng gán trước cho chắc, đúng thứ tự thật của app (window luôn có sẵn khi React chạy).
// W0.3 (19/08): store nay cache-in-memory + IndexedDB (studio-persist); trong Node không có
// indexedDB nên nhánh IDB tự no-op — test này kiểm phần CẦU localStorage + logic thuần.
// Mỗi lần bơm __raw phải __resetIdfcStoreForTest() để cache đọc lại từ localStorage (mô phỏng
// phiên trình duyệt mới) — không reset thì cache cũ che mất dữ liệu vừa bơm.
import { loadIdfcStore, saveIdfcItems, removeIdfc, __resetIdfcStoreForTest } from './idfc-store';
import type { ParsedIdfc } from '../cad/idfc';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}

const LS_KEY = 'if.library.idfc.v1';

// ─── Fixture: 2 KIND KHÁC NHAU — chứng minh store không quan tâm loại, chỉ quan tâm meta.code ───
// (i) furniture / ruột 'component' — có geom2d hợp lệ theo IdfcGeom2d
function makeFurniture(code: string, name: string): ParsedIdfc {
  return {
    meta: {
      name,
      code,
      kind: 'furniture',
      createdAt: '2026-08-01T00:00:00.000Z',
      modifiedAt: '2026-08-01T00:00:00.000Z',
      appVersion: 'interiorflow-1.0.0',
    },
    body: {
      type: 'component',
      geom2d: { group: 'Phòng khách', w: 600, h: 800, prims: [] },
    },
  };
}

// (ii) material / ruột 'material' — pbr rỗng vẫn hợp lệ (mọi trường MaterialPbr optional)
function makeMaterial(code: string, name: string): ParsedIdfc {
  return {
    meta: {
      name,
      code,
      kind: 'material',
      createdAt: '2026-08-01T00:00:00.000Z',
      modifiedAt: '2026-08-01T00:00:00.000Z',
      appVersion: 'interiorflow-1.0.0',
    },
    body: { type: 'material', pbr: {} },
  };
}

console.log('loadIdfcStore — kho rỗng (chưa từng lưu gì)');
ok('chưa có key -> mảng rỗng, không throw', Array.isArray(loadIdfcStore()) && loadIdfcStore().length === 0);

console.log('loadIdfcStore — JSON hỏng trong localStorage thì trả [] KHÔNG throw giữa render');
fakeWindow.localStorage.__raw(LS_KEY, '{ dây rợ không phải json hợp lệ [[[');
__resetIdfcStoreForTest();
let threw = false;
let brokenResult: unknown[] = [];
try {
  brokenResult = loadIdfcStore();
} catch {
  threw = true;
}
ok('JSON.parse lỗi không throw ra ngoài', !threw);
eq('JSON hỏng -> kho rỗng', brokenResult, []);

console.log('loadIdfcStore — JSON hợp lệ nhưng KHÔNG PHẢI mảng (vd object) cũng trả [] an toàn');
fakeWindow.localStorage.__raw(LS_KEY, JSON.stringify({ not: 'an array' }));
__resetIdfcStoreForTest();
eq('JSON hợp lệ nhưng không phải mảng -> []', loadIdfcStore(), []);

// dọn sạch trước khối test upsert — mỗi khối test tự chủ, không phụ thuộc thứ tự chạy trước
fakeWindow.localStorage.__raw(LS_KEY, JSON.stringify([]));
__resetIdfcStoreForTest();

console.log('saveIdfcItems — lưu 2 món 2 LOẠI KHÁC NHAU, kho không quan tâm kind');
const now1 = new Date('2026-08-08T10:00:00.000Z');
const countAfterFirstSave = saveIdfcItems([makeFurniture('SOFA-01', 'Sofa 3 chỗ'), makeMaterial('OAK-114', 'Gỗ sồi')], now1);
eq('lưu 2 món mới -> đếm ra 2', countAfterFirstSave, 2);
eq('kho đọc lại có đúng 2 món', loadIdfcStore().length, 2);

console.log('saveIdfcItems — storedAt được gắn = mốc thời gian truyền vào (tham số `now`)');
const stored = loadIdfcStore();
const sofa = stored.find((s) => s.meta.code === 'SOFA-01');
ok('SOFA-01 có mặt', !!sofa);
eq('storedAt = now1.toISOString()', sofa?.storedAt, now1.toISOString());

console.log('saveIdfcItems — UPSERT theo meta.code: nhập lại CÙNG MÃ = ĐÈ bản cũ, KHÔNG nhân đôi');
const now2 = new Date('2026-08-08T11:00:00.000Z');
const countAfterUpsert = saveIdfcItems([makeFurniture('SOFA-01', 'Sofa 3 chỗ (bản sửa)')], now2);
eq('vẫn 2 món sau khi đè trùng mã (không tăng lên 3)', countAfterUpsert, 2);
const afterUpsert = loadIdfcStore();
eq('kho vẫn đúng 2 món', afterUpsert.length, 2);
const sofaAfter = afterUpsert.find((s) => s.meta.code === 'SOFA-01');
eq('tên đã đổi theo bản mới (đè, không giữ bản cũ)', sofaAfter?.meta.name, 'Sofa 3 chỗ (bản sửa)');
eq('storedAt cập nhật theo lần lưu sau', sofaAfter?.storedAt, now2.toISOString());
const oakUntouched = afterUpsert.find((s) => s.meta.code === 'OAK-114');
eq('món KHÔNG trùng mã (OAK-114) không bị đụng tới', oakUntouched?.meta.name, 'Gỗ sồi');
eq('storedAt của OAK-114 giữ nguyên mốc lần lưu đầu (không bị ghi đè lây)', oakUntouched?.storedAt, now1.toISOString());

console.log('saveIdfcItems — lưu thêm món mới (mã chưa từng có) thì CỘNG DỒN vào kho cũ, không thay hết');
const countAfterAdd = saveIdfcItems([makeFurniture('CHAIR-09', 'Ghế ăn')], new Date('2026-08-08T12:00:00.000Z'));
eq('2 món cũ + 1 món mới = 3', countAfterAdd, 3);

console.log('removeIdfc — xoá ĐÚNG 1 món theo code, không đụng món khác');
removeIdfc('SOFA-01');
const afterRemove = loadIdfcStore();
eq('còn lại 2 món', afterRemove.length, 2);
ok('SOFA-01 đã biến mất', afterRemove.every((s) => s.meta.code !== 'SOFA-01'));
ok('OAK-114 vẫn còn', afterRemove.some((s) => s.meta.code === 'OAK-114'));
ok('CHAIR-09 vẫn còn', afterRemove.some((s) => s.meta.code === 'CHAIR-09'));

console.log('removeIdfc — xoá mã KHÔNG TỒN TẠI thì kho giữ nguyên, không lỗi');
let removeThrew = false;
try {
  removeIdfc('KHONG-CO-MA-NAY');
} catch {
  removeThrew = true;
}
ok('xoá mã lạ không throw', !removeThrew);
eq('kho không đổi số lượng', loadIdfcStore().length, 2);

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
