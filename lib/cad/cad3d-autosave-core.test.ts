/**
 * lib/cad/cad3d-autosave-core.test.ts — TÍCH HỢP THẬT cho fix "mode 3D Thiết kế không autosave"
 * (`docs/TECH-DEBT.md`): sửa Doc ở mode 3D → chờ autosave debounce THẬT (1200ms) → đọc lại từ
 * IndexedDB (fake, cùng kỹ thuật `lib/sheets-persist.test.ts`) → khớp.
 *
 * Test ĐÚNG `cad3d-autosave-core.ts` (cốt lõi thuần) — KHÔNG phải `cad3d-autosave.ts` (hook,
 * cần `next/navigation`/React, không chạy được ngoài trình duyệt — xem docstring 2 file đó).
 *
 * Dùng `useCadStore` THẬT (Zustand, không cần DOM) + `localStorage`/`indexedDB` fake tối giản
 * (không kéo thêm phụ thuộc jsdom/fake-indexeddb, đúng khuôn `sheets-persist.test.ts`).
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/cad3d-autosave-core.test.ts
 */

/* ------------------------- fake localStorage ------------------------- */
const ls = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => (ls.has(k) ? ls.get(k)! : null),
  setItem: (k: string, v: string) => void ls.set(k, v),
  removeItem: (k: string) => void ls.delete(k),
};

/* ------------------------- fake IndexedDB (copy kỹ thuật sheets-persist.test.ts) ------------------------- */
const idbStore = new Map<string, unknown>();

function fireLater(fn: () => void) {
  queueMicrotask(fn);
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
        get: (k: string) => fakeRequest(() => idbStore.get(k)),
        put: (v: unknown, k: string) => {
          ops += 1;
          fireLater(() => {
            idbStore.set(k, v);
            done();
          });
        },
        delete: (k: string) => {
          ops += 1;
          fireLater(() => {
            idbStore.delete(k);
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

/* ------------------------- test ------------------------- */
import { useCadStore } from './store';
import { emptyDoc, type Doc, type HatchEntity } from './model';
import { loadSheets, saveSheets, sheetsKey, type SheetsRecord } from '../sheets-persist';
import { saveResume } from '../resume';
import { startCad3DAutosave, viewportLanhManh, type PersistedCadSheet } from './cad3d-autosave-core';
import { isBucketHydrated, markBucketHydrated, __resetHydrationForTest } from './cad-doc-hydration';

const ROUTE = '/cad-editor';
const USER = 'u-test';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function wallDoc(id: string): Doc {
  const wall: HatchEntity = {
    id,
    type: 'hatch',
    layer: 'l-wall',
    points: [
      { x: 0, y: 0 },
      { x: 4000, y: 0 },
      { x: 4000, y: 200 },
      { x: 0, y: 200 },
    ],
    solid: true,
    heightMm: 2700,
  };
  return { entities: [wall], layers: emptyDoc().layers };
}

function resetStoreTo(doc: Doc) {
  useCadStore.setState({ doc, past: [], future: [], selection: [], viewport: { scale: 0.08, panX: 300, panY: 400 }, currentLayer: 'l-wall' });
}

async function main() {
  console.log('A. Chưa từng có sheet nào (đi thẳng vào mode 3D, chưa mở 2D lần nào) — khởi tạo + autosave THẬT');
  {
    idbStore.clear();
    __resetHydrationForTest();
    const bucket = 'bucket-a';
    resetStoreTo(emptyDoc());

    const handle = startCad3DAutosave(USER, bucket);
    await sleep(50); // để nhánh bootstrap async chạy xong (loadSheets rỗng → tạo sheet mặc định)
    ok('bucket đã đánh dấu hydrated', isBucketHydrated(bucket));

    // "Khoét hốc" — sửa Doc y hệt thao tác thật trong mode 3D.
    useCadStore.setState({ doc: wallDoc('wall-A') });

    await sleep(1300); // debounce autosaver tối thiểu 1200ms — CHỜ THẬT, không giả lập timer
    const rec = await loadSheets<PersistedCadSheet>(USER, ROUTE, bucket);
    ok('có bản ghi trong IndexedDB sau autosave', !!rec);
    ok('sheet mặc định "cadsheet-0"', rec?.sheets[0]?.id === 'cadsheet-0');
    ok('doc đã lưu ĐÚNG entity vừa sửa (wall-A)', rec?.sheets[0]?.doc?.entities?.[0]?.id === 'wall-A');
    handle.dispose();
  }

  console.log('\nB. Bucket ĐÃ hydrate (giả lập vừa rời 2D) — KHÔNG được nạp đè bản cũ trên đĩa');
  {
    idbStore.clear();
    __resetHydrationForTest();
    const bucket = 'bucket-b';
    const staleOnDisk: SheetsRecord = {
      v: 1,
      activeId: 'cadsheet-0',
      ts: 1,
      sheets: [{ id: 'cadsheet-0', name: 'Bản vẽ 1', doc: wallDoc('wall-STALE'), viewport: { scale: 0.08, panX: 0, panY: 0 }, currentLayer: 'l-wall' }],
    };
    await saveSheets(USER, ROUTE, staleOnDisk, bucket);

    const liveDoc = wallDoc('wall-LIVE-IN-MEMORY');
    resetStoreTo(liveDoc);
    // đánh dấu bucket NHƯ THỂ CadSheets (2D) vừa hydrate xong trong phiên này.
    markBucketHydrated(bucket);

    const handle = startCad3DAutosave(USER, bucket);
    await sleep(50);
    ok(
      'store KHÔNG bị nạp đè bởi bản cũ trên đĩa (vẫn wall-LIVE-IN-MEMORY)',
      useCadStore.getState().doc.entities[0]?.id === 'wall-LIVE-IN-MEMORY',
    );
    handle.dispose();
  }

  console.log('\nC. Chưa hydrate + có sẵn bản ghi cũ (F5 rơi thẳng vào mode 3D) — PHẢI nạp lại từ IndexedDB');
  {
    idbStore.clear();
    __resetHydrationForTest();
    const bucket = 'bucket-c';
    const savedWithHole: SheetsRecord = {
      v: 1,
      activeId: 'cadsheet-0',
      ts: 1,
      sheets: [
        {
          id: 'cadsheet-0',
          name: 'Bản vẽ 1',
          doc: {
            entities: [
              {
                ...wallDoc('wall-C').entities[0],
                ops: [{ op: 'boolean', kind: 'subtract', withRef: 'cutter-1' }],
              },
            ],
            layers: emptyDoc().layers,
          },
          viewport: { scale: 0.08, panX: 0, panY: 0 },
          currentLayer: 'l-wall',
        },
      ],
    };
    await saveSheets(USER, ROUTE, savedWithHole, bucket);
    resetStoreTo(emptyDoc()); // mô phỏng doc mặc định sau reload — CHƯA nạp gì

    const handle = startCad3DAutosave(USER, bucket);
    await sleep(50);
    const doc = useCadStore.getState().doc;
    ok('store đã nạp ĐÚNG entity đã lưu (F5 → hốc còn nguyên)', doc.entities[0]?.id === 'wall-C');
    ok('nạp đúng cả `ops` (hốc đã khoét)', JSON.stringify(doc.entities[0]?.ops) === JSON.stringify([{ op: 'boolean', kind: 'subtract', withRef: 'cutter-1' }]));
    handle.dispose();
  }

  console.log('\nD. dispose() flush NGAY — không cần đợi debounce 1200ms (ca "đóng tab/rời mode ngay lập tức")');
  {
    idbStore.clear();
    __resetHydrationForTest();
    const bucket = 'bucket-d';
    resetStoreTo(emptyDoc());
    const handle = startCad3DAutosave(USER, bucket);
    await sleep(50);
    useCadStore.setState({ doc: wallDoc('wall-D') });
    handle.dispose(); // KHÔNG sleep 1200ms — mô phỏng rời mode ngay sau khi sửa
    await sleep(50); // chỉ đợi promise saveSheets() bên trong flush() giải quyết xong
    const rec = await loadSheets<PersistedCadSheet>(USER, ROUTE, bucket);
    ok('dispose() ép ghi ngay, không mất thay đổi cuối', rec?.sheets[0]?.doc?.entities?.[0]?.id === 'wall-D');
  }

  console.log('\nE. KHÔNG đụng sheet KHÁC (bản vẽ 2..5) trong cùng bản ghi');
  {
    idbStore.clear();
    __resetHydrationForTest();
    const bucket = 'bucket-e';
    const twoSheets: SheetsRecord = {
      v: 1,
      activeId: 'cadsheet-0',
      ts: 1,
      sheets: [
        { id: 'cadsheet-0', name: 'Bản vẽ 1', doc: wallDoc('wall-E1'), viewport: { scale: 0.08, panX: 0, panY: 0 }, currentLayer: 'l-wall' },
        { id: 'cadsheet-1', name: 'Bản vẽ 2', doc: wallDoc('wall-E2-KHONG-DUOC-DUNG'), viewport: { scale: 0.08, panX: 0, panY: 0 }, currentLayer: 'l-wall' },
      ],
    };
    await saveSheets(USER, ROUTE, twoSheets, bucket);
    saveResume(USER, { route: '/cad-editor', sheetId: 'cadsheet-0' });
    resetStoreTo(wallDoc('wall-E1'));
    markBucketHydrated(bucket); // đã "hydrate" — mode 3D chỉ ghi tiếp, không nạp lại

    const handle = startCad3DAutosave(USER, bucket);
    await sleep(50);
    useCadStore.setState({ doc: wallDoc('wall-E1-SUA') });
    await sleep(1300);
    const rec = await loadSheets<PersistedCadSheet>(USER, ROUTE, bucket);
    handle.dispose();
    ok('sheet ĐANG hoạt động (cadsheet-0) được cập nhật', rec?.sheets.find((s) => s.id === 'cadsheet-0')?.doc?.entities?.[0]?.id === 'wall-E1-SUA');
    ok('sheet KHÁC (cadsheet-1) giữ NGUYÊN', rec?.sheets.find((s) => s.id === 'cadsheet-1')?.doc?.entities?.[0]?.id === 'wall-E2-KHONG-DUOC-DUNG');
  }

  console.log('\nF. Chưa đăng nhập (userId rỗng) — không làm gì, không sập, dispose() an toàn');
  {
    idbStore.clear();
    __resetHydrationForTest();
    const bucket = 'bucket-f';
    resetStoreTo(emptyDoc());
    const handle = startCad3DAutosave('', bucket);
    useCadStore.setState({ doc: wallDoc('wall-F') });
    await sleep(1300);
    const rec = await loadSheets<PersistedCadSheet>(USER, ROUTE, bucket);
    ok('không ghi gì (chưa đăng nhập, đúng hành vi CadSheets)', rec === null);
    let threw = false;
    try {
      handle.dispose();
      handle.flushNow();
    } catch {
      threw = true;
    }
    ok('dispose()/flushNow() không throw', !threw);
  }

  console.log('\nG. Bản ghi IDB mang VIEWPORT THỜI-BUG (scale âm) — KHÔNG được sống lại + bản lưu được DỌN (vá 01/09)');
  {
    idbStore.clear();
    __resetHydrationForTest();
    const bucket = 'bucket-g';
    // Đúng hình hài viewport bệnh đo được 31/08: `fitBox()` trên canvas 150×75 (DPR 2) cho
    // scale −0,003025 — CadSheets đã autosave nó vào IDB trước khi 81dd7dd7 vá đường /cad.
    const hong: SheetsRecord = {
      v: 1,
      activeId: 'cadsheet-0',
      ts: 1,
      sheets: [{ id: 'cadsheet-0', name: 'Bản vẽ 1', doc: wallDoc('wall-G'), viewport: { scale: -0.003025, panX: 75, panY: 37.5 }, currentLayer: 'l-wall' }],
    };
    await saveSheets(USER, ROUTE, hong, bucket);
    resetStoreTo(emptyDoc()); // F5 rơi thẳng vào mode 3D — store còn viewport mặc định lành

    const handle = startCad3DAutosave(USER, bucket);
    await sleep(50);
    const vp = useCadStore.getState().viewport;
    ok('doc vẫn nạp bình thường (wall-G)', useCadStore.getState().doc.entities[0]?.id === 'wall-G');
    ok('viewport thời-bug KHÔNG sống lại: scale > 0, hữu hạn', Number.isFinite(vp.scale) && vp.scale > 0);
    ok('rơi về DEFAULT_VIEWPORT như mở mới (scale 0.08)', vp.scale === 0.08 && vp.panX === 300 && vp.panY === 400);

    // DỌN: bản lưu hỏng phải bị ghi đè bằng bản lành ngay trong lượt hydrate (không đợi người
    // dùng sửa gì) — lần mở sau đọc IDB là sạch.
    await sleep(1300);
    const rec = await loadSheets<PersistedCadSheet>(USER, ROUTE, bucket);
    const vpLuu = rec?.sheets.find((s) => s.id === 'cadsheet-0')?.viewport;
    ok('bản ghi IDB đã được dọn: scale lưu > 0, hữu hạn', !!vpLuu && Number.isFinite(vpLuu.scale) && vpLuu.scale > 0);
    handle.dispose();
  }

  console.log('\nG2. ĐỐI CHỨNG — viewport lưu LÀNH MẠNH vẫn áp nguyên vẹn (guard không chặn oan)');
  {
    idbStore.clear();
    __resetHydrationForTest();
    const bucket = 'bucket-g2';
    const lanh: SheetsRecord = {
      v: 1,
      activeId: 'cadsheet-0',
      ts: 1,
      sheets: [{ id: 'cadsheet-0', name: 'Bản vẽ 1', doc: wallDoc('wall-G2'), viewport: { scale: 0.5, panX: 12, panY: 34 }, currentLayer: 'l-wall' }],
    };
    await saveSheets(USER, ROUTE, lanh, bucket);
    resetStoreTo(emptyDoc());
    const handle = startCad3DAutosave(USER, bucket);
    await sleep(50);
    const vp = useCadStore.getState().viewport;
    ok('viewport lành áp NGUYÊN (0.5 / 12 / 34)', vp.scale === 0.5 && vp.panX === 12 && vp.panY === 34);
    handle.dispose();
  }

  console.log('\nH. viewportLanhManh — điều kiện well-formed (thuần)');
  {
    const goc = { panX: 0, panY: 0 };
    ok('scale 0.08 mặc định ⇒ lành', viewportLanhManh({ scale: 0.08, ...goc }));
    ok('biên dưới 1e-6 ⇒ lành', viewportLanhManh({ scale: 1e-6, ...goc }));
    ok('biên trên 1e6 ⇒ lành', viewportLanhManh({ scale: 1e6, ...goc }));
    ok('scale ÂM (bệnh thật −0.003025) ⇒ hỏng', !viewportLanhManh({ scale: -0.003025, ...goc }));
    ok('scale 0 ⇒ hỏng', !viewportLanhManh({ scale: 0, ...goc }));
    ok('scale NaN ⇒ hỏng', !viewportLanhManh({ scale: NaN, ...goc }));
    ok('scale Infinity ⇒ hỏng', !viewportLanhManh({ scale: Infinity, ...goc }));
    ok('scale dưới sàn (1e-7) ⇒ hỏng', !viewportLanhManh({ scale: 1e-7, ...goc }));
    ok('scale vượt trần (1e7) ⇒ hỏng', !viewportLanhManh({ scale: 1e7, ...goc }));
    ok('panX NaN ⇒ hỏng', !viewportLanhManh({ scale: 0.08, panX: NaN, panY: 0 }));
    ok('panY Infinity ⇒ hỏng', !viewportLanhManh({ scale: 0.08, panX: 0, panY: Infinity }));
    ok('null/undefined ⇒ hỏng', !viewportLanhManh(null) && !viewportLanhManh(undefined));
  }

  console.log('\nsheetsKey — cùng khoá bucket với CadSheets (không phải "cơ chế thứ hai")');
  ok('cùng công thức khoá `userId::/cad-editor::bucketId`', sheetsKey(USER, ROUTE, 'bucket-a') === `${USER}::${ROUTE}::bucket-a`);

  console.log(`\n${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

void main();
