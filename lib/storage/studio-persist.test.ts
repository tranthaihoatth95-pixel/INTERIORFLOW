/** Test `studio-persist.ts` — chạy: node_modules/.bin/sucrase-node lib/storage/studio-persist.test.ts
 *
 *  Node không có indexedDB → nhánh `idbBlobIo` thật tự no-op (sheets-persist đã guard). Test này
 *  INJECT một IO in-memory qua `opts.io` để kiểm ĐÚNG phần logic của khuôn: cầu di trú một lần,
 *  idempotent, localStorage cũ còn nguyên, kho rỗng sạch, và bản-tay-thắng khi ghi trước hydrate.
 *  Phần IDB thật (transaction/quota) KHÔNG kiểm được ở đây — khai trong báo cáo (CHƯA CHẮC).
 */

// ─── window giả + localStorage giả (đủ getItem/setItem cho readLegacy) ───
class FakeLocalStorage {
  store = new Map<string, string>();
  getItem(k: string): string | null { return this.store.has(k) ? this.store.get(k)! : null; }
  setItem(k: string, v: string): void { this.store.set(k, v); }
}
const fakeWindow = { localStorage: new FakeLocalStorage() };
(globalThis as unknown as { window: typeof fakeWindow }).window = fakeWindow;

import { createStudioBlobStore, type StudioBlobIo } from './studio-persist';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}

/** IO in-memory — đếm số lượt save để kiểm idempotency. */
function makeIo() {
  const db = new Map<string, unknown>();
  let saves = 0;
  const io: StudioBlobIo = {
    async load(route) { return db.has(route) ? db.get(route) : undefined; },
    async save(route, payload) { db.set(route, JSON.parse(JSON.stringify(payload))); saves++; return true; },
  };
  return { io, db, count: () => saves };
}

const LS = 'test.legacy.key';
type Payload = string[];
function makeStore(io: StudioBlobIo) {
  return createStudioBlobStore<Payload>({
    route: '/t',
    readLegacy: () => {
      const raw = fakeWindow.localStorage.getItem(LS);
      if (!raw) return undefined;
      try { const p = JSON.parse(raw); return Array.isArray(p) ? p : undefined; } catch { return undefined; }
    },
    empty: [],
    parse: (v) => (Array.isArray(v) ? (v as Payload) : undefined),
    io,
  });
}

const tick = () => new Promise((r) => setTimeout(r, 0));

async function main() {
  console.log('① round-trip: set → get, và flush xuống IDB');
  {
    const { io, db } = makeIo();
    const s = makeStore(io);
    eq('kho rỗng ban đầu', s.get(), []);
    s.set(['a', 'b']);
    eq('get thấy ngay (sync cache)', s.get(), ['a', 'b']);
    await s.hydrate(); await tick();
    eq('IDB nhận đúng payload', db.get('/t'), ['a', 'b']);
  }

  console.log('② cầu di trú: IDB trống + localStorage cũ có → dời sang IDB, localStorage CÒN NGUYÊN');
  {
    fakeWindow.localStorage.setItem(LS, JSON.stringify(['legacy1', 'legacy2']));
    const { io, db, count } = makeIo();
    const s = makeStore(io);
    eq('đọc sync lần đầu ra bản legacy', s.get(), ['legacy1', 'legacy2']);
    await s.hydrate(); await tick();
    eq('IDB đã có bản di trú', db.get('/t'), ['legacy1', 'legacy2']);
    eq('localStorage cũ KHÔNG bị xoá', fakeWindow.localStorage.getItem(LS), JSON.stringify(['legacy1', 'legacy2']));
    const savesAfterBridge = count();

    console.log('②b idempotent: phiên sau (reset cache) IDB đã có → KHÔNG di trú lại');
    s.__resetForTest();
    // đổi localStorage thành rác — nếu còn di trú lại thì IDB sẽ nhận rác này
    fakeWindow.localStorage.setItem(LS, JSON.stringify(['RAC-KHONG-DUOC-VAO']));
    await s.hydrate(); await tick();
    eq('IDB giữ nguyên bản đã di trú (không đè bằng localStorage)', db.get('/t'), ['legacy1', 'legacy2']);
    eq('không có lượt save mới', count(), savesAfterBridge);
    eq('get() sau hydrate trả bản IDB (canonical)', s.get(), ['legacy1', 'legacy2']);
  }

  console.log('③ IDB trống + localStorage trống = kho rỗng sạch, không ghi bản ghi thừa');
  {
    fakeWindow.localStorage.store.delete(LS);
    const { io, db, count } = makeIo();
    const s = makeStore(io);
    eq('kho rỗng', s.get(), []);
    await s.hydrate(); await tick();
    ok('không tạo bản ghi IDB khi không có gì để dời', !db.has('/t'));
    eq('0 lượt save', count(), 0);
  }

  console.log('④ IDB đã có bản RỖNG (kho từng bị dọn sạch) → dùng nó, không hồi sinh legacy');
  {
    fakeWindow.localStorage.setItem(LS, JSON.stringify(['zombie']));
    const { io, db } = makeIo();
    db.set('/t', []); // marker: kho đã dọn sạch có chủ đích
    const s = makeStore(io);
    await s.hydrate(); await tick();
    eq('kho vẫn rỗng (bản IDB thắng)', s.get(), []);
    eq('IDB vẫn rỗng', db.get('/t'), []);
  }

  console.log('⑤ ghi TRƯỚC khi hydrate xong → bản tay thắng, flush đè lên IDB');
  {
    fakeWindow.localStorage.store.delete(LS);
    const { io, db } = makeIo();
    db.set('/t', ['idb-cu']);
    const s = makeStore(io);
    s.set(['tay-moi']); // chưa hề hydrate — set trước
    await s.hydrate(); await tick();
    eq('cache giữ bản tay', s.get(), ['tay-moi']);
    eq('IDB bị đè bằng bản tay (mới hơn)', db.get('/t'), ['tay-moi']);
  }

  console.log('⑥ payload IDB hỏng (parse fail) → rơi về legacy/rỗng, không throw');
  {
    fakeWindow.localStorage.store.delete(LS);
    const { io, db } = makeIo();
    db.set('/t', { khong: 'phai mang' });
    const s = makeStore(io);
    let threw = false;
    try { await s.hydrate(); await tick(); } catch { threw = true; }
    ok('không throw', !threw);
    eq('kho rỗng an toàn', s.get(), []);
  }

  console.log(`\n${pass} pass, ${fail} fail`);
  if (fail) process.exit(1);
}

void main();
