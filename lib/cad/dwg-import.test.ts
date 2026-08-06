/**
 * lib/cad/dwg-import.test.ts — VÒNG ĐỜI nhập DWG (`runDwgImport`, dwg-map.ts).
 *
 * VÌ SAO CÓ FILE NÀY (PHU q8, 05/08): bug đỏ 2.1.6.d "nhập DWG treo vĩnh viễn" đã được vá từ P1
 * (timeout cứng · tiến độ thật · huỷ được · lỗi rõ) NHƯNG **không một dòng nào của vòng đời đó có
 * test** — vì nó nằm trong `dwg.ts`, file chứa `import.meta.url` nên sucrase-node không require
 * nổi (`dwg.test.ts` tự ghi rõ giới hạn này ở docstring). Nay vòng đời đã tách sang `dwg-map.ts`
 * và test được bằng WORKER GIẢ, nên khoá luôn hành vi chống-treo lại để không tái phát.
 *
 * Worker giả = đúng 4 thành viên `DwgWorkerLike` cần dùng; test điều khiển được thời điểm nó trả
 * lời (hoặc KHÔNG BAO GIỜ trả lời — chính là ca bệnh gốc).
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/dwg-import.test.ts
 */
import {
  runDwgImport,
  dwgCancelledMessage,
  DEFAULT_DWG_IMPORT_TIMEOUT_MS,
} from './dwg-map';
import type { DwgWorkerLike, DwgWorkerMessage, DwgImportFile, DwgRawDoc, DwgStage } from './dwg-map';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/* ───────── đồ giả ───────── */

class FakeWorker implements DwgWorkerLike {
  onmessage: ((ev: { data: DwgWorkerMessage }) => void) | null = null;
  onerror: ((ev: { message?: string }) => void) | null = null;
  posts: unknown[] = [];
  terminated = 0;
  postMessage(message: unknown) { this.posts.push(message); }
  terminate() { this.terminated += 1; }
  /** worker "trả lời" — bỏ qua nếu listener đã bị gỡ (đúng như worker mồ côi thật). */
  say(msg: DwgWorkerMessage) { this.onmessage?.({ data: msg }); }
  crash(message: string) { this.onerror?.({ message }); }
}

/** File giả — `arrayBuffer()` phân giải sau `delayMs` để mô phỏng đọc đĩa. */
function fakeFile(name: string, size: number, delayMs = 0, signature = 'AC1032'): DwgImportFile {
  return {
    name,
    size,
    arrayBuffer: () =>
      new Promise<ArrayBuffer>((res) => {
        const buf = new TextEncoder().encode(`${signature}--phan-con-lai`).buffer;
        if (delayMs <= 0) res(buf);
        else setTimeout(() => res(buf), delayMs);
      }),
  };
}

function rawDoc(entities = 3, skipped = 1): DwgRawDoc {
  return {
    entities: Array.from({ length: entities }, (_, i) => ({
      type: 'LINE' as const, layer: '0', a: { x: 0, y: i * 100 }, b: { x: 1000, y: i * 100 },
    })),
    layers: [{ name: '0', colorIndex: 7, off: false, frozen: false, locked: false }],
    skippedEntityCount: skipped,
    totalEntityCount: entities + skipped,
  };
}

interface Spy {
  host: Parameters<typeof runDwgImport>[2];
  worker: FakeWorker;
  orphaned: { stage: DwgStage; elapsedMs: number }[];
  statuses: string[];
}
function spyHost(worker = new FakeWorker(), spawnThrows?: string): Spy {
  const orphaned: Spy['orphaned'] = [];
  const statuses: string[] = [];
  return {
    worker,
    orphaned,
    statuses,
    host: {
      spawn: () => { if (spawnThrows) throw new Error(spawnThrows); return worker; },
      orphan: (_w, stage, elapsedMs) => { orphaned.push({ stage, elapsedMs }); },
      onStatus: (t) => statuses.push(t),
    },
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function rejectMessage(p: Promise<unknown>): Promise<string> {
  try { await p; return '__KHÔNG REJECT__'; } catch (e) { return e instanceof Error ? e.message : String(e); }
}

/* ───────── [1] CA BỆNH GỐC 2.1.6.d — worker KHÔNG BAO GIỜ trả lời ───────── */
async function testTreoVinhVien() {
  console.log('\n[1] Bug đỏ 2.1.6.d — worker im lặng vĩnh viễn (convertEx kẹt) PHẢI bị timeout cắt');
  const s = spyHost();
  const t0 = Date.now();
  // Worker giả nhận buffer rồi im re — đúng hành vi `convertEx` kẹt trong WASM đồng bộ.
  const msg = await rejectMessage(runDwgImport(fakeFile('ket-cung.dwg', 9_699_556), { timeoutMs: 300 }, s.host));
  const elapsed = Date.now() - t0;

  ok('KHÔNG treo vĩnh viễn — reject trong khoảng timeout', elapsed >= 300 && elapsed < 3000);
  ok('thông báo có TÊN FILE', msg.includes('ket-cung.dwg'));
  ok('thông báo có KÍCH THƯỚC đọc được (MB)', /9\.\d MB/.test(msg));
  ok('thông báo có PHIÊN BẢN DWG đọc từ header', msg.includes('AutoCAD 2018–2024'));
  ok('thông báo nói rõ ĐANG Ở GIAI ĐOẠN NÀO', msg.includes('đọc nhị phân') || msg.includes('chuyển sang danh sách'));
  ok('thông báo có gợi ý xử lý cho người dùng', msg.includes('thử lại với file'));
  ok('worker bị terminate() khi quá giờ (không phải bỏ rơi)', s.worker.terminated === 1);
  ok('KHÔNG đẩy vào hồ mồ côi ở nhánh timeout (đúng thiết kế hiện tại)', s.orphaned.length === 0);
  ok('mặc định 60s vẫn là hằng số công khai', DEFAULT_DWG_IMPORT_TIMEOUT_MS === 60_000);
}

/* ───────── [2] Tiến độ CÓ THẬT — heartbeat chạy kể cả khi worker im ───────── */
async function testTienDo() {
  console.log('\n[2] Tiến độ — heartbeat 1s vẫn báo dù worker KHÔNG phản hồi (không đứng hình)');
  const s = spyHost();
  const seen: { stage: DwgStage; elapsedMs: number }[] = [];
  const p = runDwgImport(
    fakeFile('cham.dwg', 21 * 1024 * 1024),
    { timeoutMs: 2400, onProgress: (i) => seen.push(i) },
    s.host,
  );
  await sleep(1200);
  // worker mới báo chuyển giai đoạn sau khi đã chạy 1 nhịp
  s.worker.say({ kind: 'progress', stage: 'converting' });
  await sleep(1100);
  const msg = await rejectMessage(p);

  ok('có ít nhất 2 nhịp tiến độ trước khi hết giờ', seen.length >= 2);
  ok('elapsedMs tăng dần', seen.length >= 2 && seen[seen.length - 1].elapsedMs > seen[0].elapsedMs);
  ok('nhịp SAU khi worker báo chuyển giai đoạn mang stage="converting"', seen.some((i) => i.stage === 'converting'));
  ok('status bar mặc định cũng được ghi', s.statuses.length >= 2 && s.statuses[0].includes('cham.dwg'));
  ok('progress KHÔNG settle promise — vẫn chạy tới timeout', msg.includes('quá 2s chưa xong'));
}

/* ───────── [3] Huỷ giữa chừng — BỎ RƠI worker, không terminate (Hoà chốt §11c) ───────── */
async function testHuyGiuaChung() {
  console.log('\n[3] Người dùng bấm Huỷ giữa `converting` — bỏ rơi worker, KHÔNG terminate()');
  const s = spyHost();
  const ac = new AbortController();
  const p = runDwgImport(fakeFile('to.dwg', 9_699_556), { timeoutMs: 5000, signal: ac.signal }, s.host);
  await sleep(30);
  s.worker.say({ kind: 'progress', stage: 'converting' });
  ac.abort();
  const msg = await rejectMessage(p);

  ok('reject đúng câu huỷ', msg === dwgCancelledMessage({ name: 'to.dwg' }));
  ok('worker được BỎ RƠI (không terminate) — chống treo tab §11c', s.orphaned.length === 1 && s.worker.terminated === 0);
  ok('ghi lại đúng giai đoạn lúc bị huỷ', s.orphaned[0].stage === 'converting');
  await sleep(60);
  ok('worker mồ côi trả lời muộn KHÔNG làm promise settle lần 2', true); // không throw = đạt
  s.worker.say({ kind: 'result', ok: true, doc: rawDoc() });
}

/* ───────── [4] LỖ #1 đã vá — huỷ TRONG LÚC đọc buffer thì KHÔNG được giao việc nữa ───────── */
async function testKhongGiaoViecSauKhiHuy() {
  console.log('\n[4] 🔴 Lỗ đã vá: huỷ trong lúc `file.arrayBuffer()` chạy ⇒ CẤM postMessage sau đó');
  const s = spyHost();
  const ac = new AbortController();
  // buffer mất 120ms mới đọc xong; người dùng huỷ ở 30ms.
  const p = runDwgImport(fakeFile('huy-som.dwg', 9_699_556, 120), { timeoutMs: 5000, signal: ac.signal }, s.host);
  await sleep(30);
  ac.abort();
  const msg = await rejectMessage(p);
  await sleep(200); // để nhánh .then của arrayBuffer chạy xong

  ok('reject đúng câu huỷ', msg === dwgCancelledMessage({ name: 'huy-som.dwg' }));
  ok('KHÔNG postMessage sau khi đã huỷ (worker mồ côi không khởi động convertEx)', s.worker.posts.length === 0);
  ok('worker chưa nhận việc ⇒ terminate() thay vì chiếm chỗ hồ mồ côi', s.worker.terminated === 1 && s.orphaned.length === 0);
}

/* ───────── [5] LỖ #2 đã vá — signal đã abort NGAY từ đầu ───────── */
async function testHuyTruocKhiChay() {
  console.log('\n[5] 🔴 Lỗ đã vá: signal.aborted ngay lúc gọi ⇒ worker còn rảnh, terminate không bỏ rơi');
  const s = spyHost();
  const ac = new AbortController();
  ac.abort();
  const msg = await rejectMessage(runDwgImport(fakeFile('huy-truoc.dwg', 1000), { signal: ac.signal }, s.host));

  ok('reject đúng câu huỷ', msg === dwgCancelledMessage({ name: 'huy-truoc.dwg' }));
  ok('worker rảnh → terminate(), KHÔNG chiếm 1 trong 2 chỗ hồ mồ côi', s.worker.terminated === 1 && s.orphaned.length === 0);
  ok('không giao việc gì cho worker', s.worker.posts.length === 0);
}

/* ───────── [6] Đường thành công ───────── */
async function testThanhCong() {
  console.log('\n[6] Đường thành công — map ra Doc + trả đúng số đếm + dọn worker');
  const s = spyHost();
  const p = runDwgImport(fakeFile('ok.dwg', 224 * 1024), { timeoutMs: 5000 }, s.host);
  await sleep(20);
  ok('worker ĐƯỢC giao buffer đúng 1 lần', s.worker.posts.length === 1);
  s.worker.say({ kind: 'result', ok: true, doc: rawDoc(3, 1) });
  const res = await p;

  ok('trả về Doc có entity', res.doc.entities.length === 3);
  ok('skippedEntityCount đúng', res.skippedEntityCount === 1);
  ok('totalEntityCount đúng', res.totalEntityCount === 4);
  ok('worker được dọn sau khi xong', s.worker.terminated === 1);
}

/* ───────── [7] Các ngả lỗi — không bao giờ "lỗi lạ" ───────── */
async function testCacNgaLoi() {
  console.log('\n[7] Ngả lỗi — worker báo lỗi · worker chết · không đẻ được worker');
  {
    const s = spyHost();
    const p = runDwgImport(fakeFile('hong.dwg', 500), { timeoutMs: 5000 }, s.host);
    await sleep(20);
    s.worker.say({ kind: 'result', ok: false, error: 'Chữ ký DWG không hợp lệ trong "hong.dwg".' });
    ok('lỗi từ worker được chuyển nguyên văn', (await rejectMessage(p)).includes('Chữ ký DWG không hợp lệ'));
  }
  {
    const s = spyHost();
    const p = runDwgImport(fakeFile('crash.dwg', 500), { timeoutMs: 5000 }, s.host);
    await sleep(20);
    s.worker.crash('out of memory');
    const m = await rejectMessage(p);
    ok('worker chết → câu tiếng Việt, không phải lỗi lạ', m.startsWith('Worker đọc DWG lỗi:') && m.includes('out of memory'));
  }
  {
    const s = spyHost(new FakeWorker(), 'Worker is not defined');
    const m = await rejectMessage(runDwgImport(fakeFile('x.dwg', 1), {}, s.host));
    ok('không đẻ được worker → câu tiếng Việt', m.startsWith('Không khởi tạo được worker đọc DWG:'));
  }
}

async function main() {
  await testTreoVinhVien();
  await testTienDo();
  await testHuyGiuaChung();
  await testKhongGiaoViecSauKhiHuy();
  await testHuyTruocKhiChay();
  await testThanhCong();
  await testCacNgaLoi();
  console.log(`\n${pass} ok, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

void main();
