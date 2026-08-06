/**
 * lib/cad/dwg-flatten-guard.test.ts — VIỆC 2 (PHU, 05/08), bug đỏ 2.1.6.d "nhập DWG treo vĩnh viễn".
 *
 * ĐIỀU FILE NÀY KHOÁ LẠI — "LỖ #3: vùng không ai canh" (xem docstring `runDwgImport`):
 * bản cũ chạy `finish(() => resolve({ doc: dwgRawDocToDoc(msg.doc), … }))`. `finish()` gỡ SẠCH
 * bộ canh gác (`clearInterval(heartbeat)` · `clearTimeout(hardTimeout)` · gỡ listener `abort`)
 * **trước khi** hàm bung block chạy. Bung block là vòng lặp ĐỒNG BỘ trên main thread ⇒ suốt thời
 * gian đó: không timeout nào cắt được · không dòng trạng thái nào nhúc nhích · nút Huỷ bấm không
 * ăn. Đúng nghĩa "app đứng im, không biết vì sao" — và `worker.terminate()` ở nhánh quá giờ
 * KHÔNG cứu được, vì lúc đó worker đã trả kết quả xong và đang rảnh.
 *
 * Kèm theo: trần `MAX_FLATTEN_ENTITIES` bản cũ cắt ngắn HOÀN TOÀN IM LẶNG (2 chỗ `return` trần,
 * 0 chỗ báo) — người dùng nhận bản vẽ thiếu hình mà tưởng file mình hỏng.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/dwg-flatten-guard.test.ts
 */
import {
  runDwgImport,
  flattenDwgRawDoc,
  dwgRawDocToDoc,
  DWG_STAGE_LABEL,
  MAX_FLATTEN_ENTITIES,
  DEFAULT_FLATTEN_BUDGET_MS,
} from './dwg-map';
import type { DwgWorkerLike, DwgWorkerMessage, DwgImportFile, DwgRawDoc, DwgStage } from './dwg-map';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/* ───────── đồ giả (cùng khuôn `dwg-import.test.ts`) ───────── */

class FakeWorker implements DwgWorkerLike {
  onmessage: ((ev: { data: DwgWorkerMessage }) => void) | null = null;
  onerror: ((ev: { message?: string }) => void) | null = null;
  terminated = 0;
  postMessage() { /* không cần giữ */ }
  terminate() { this.terminated += 1; }
  say(msg: DwgWorkerMessage) { this.onmessage?.({ data: msg }); }
}

function fakeFile(name: string, size: number): DwgImportFile {
  return {
    name,
    size,
    arrayBuffer: () => Promise.resolve(new TextEncoder().encode('AC1032--phan-con-lai').buffer),
  };
}

function line(i: number) {
  return { type: 'LINE' as const, layer: '0', a: { x: i, y: 0 }, b: { x: i + 100, y: 50 } };
}
function ins(name: string, x: number) {
  return {
    type: 'INSERT' as const, layer: '0', name, at: { x, y: 0 },
    sx: 1, sy: 1, rot: 0, cols: 1, rows: 1, colSpacing: 0, rowSpacing: 0,
  };
}

/** Cây INSERT lồng nhau — hình dạng file xref bệnh lý mà 2 cái trần sinh ra để chặn. */
function nestedRaw(depth: number, fan: number, leaf: number, roots: number): DwgRawDoc {
  const blocks: Record<string, { basePoint: { x: number; y: number }; entities: ReturnType<typeof line>[] }> = {};
  for (let d = 0; d < depth; d++) {
    const kids: unknown[] = [];
    for (let i = 0; i < leaf; i++) kids.push(line(i));
    if (d > 0) for (let f = 0; f < fan; f++) kids.push(ins(`B${d - 1}`, f * 10));
    blocks[`B${d}`] = { basePoint: { x: 0, y: 0 }, entities: kids as ReturnType<typeof line>[] };
  }
  return {
    entities: Array.from({ length: roots }, (_, r) => ins(`B${depth - 1}`, r * 5000)),
    layers: [{ name: '0', colorIndex: 7, off: false, frozen: false, locked: false }],
    blocks: blocks as DwgRawDoc['blocks'],
    skippedEntityCount: 0,
    totalEntityCount: roots,
  };
}

function flatRaw(n: number): DwgRawDoc {
  return {
    entities: Array.from({ length: n }, (_, i) => line(i)),
    layers: [{ name: '0', colorIndex: 7, off: false, frozen: false, locked: false }],
    skippedEntityCount: 0,
    totalEntityCount: n,
  };
}

async function rejectMessage(p: Promise<unknown>): Promise<string> {
  try { await p; return '__KHÔNG REJECT__'; } catch (e) { return e instanceof Error ? e.message : String(e); }
}

/* ───────── [1] Trần SỐ LƯỢNG không còn cắt ngắn im lặng ───────── */
function testTranSoLuong() {
  console.log('\n[1] Chạm trần số lượng → PHẢI nói ra, không cắt im lặng');
  const { doc, report } = flattenDwgRawDoc(nestedRaw(8, 6, 30, 20), { maxEntities: 5_000 });
  ok('dừng đúng ở trần', doc.entities.length <= 5_000 && doc.entities.length >= 4_000);
  ok('cờ truncated = "count"', report.truncated === 'count');
  ok('CÓ câu cho người dùng (không rỗng)', report.message.length > 0);
  ok('câu nói rõ bản vẽ CHƯA ĐỦ', report.message.includes('CHƯA ĐỦ'));
  ok('câu mách nước việc phải làm (tách xref/block)', /xref|block/i.test(report.message));
  ok('câu KHÔNG lộ tên hằng nội bộ', !report.message.includes('MAX_FLATTEN_ENTITIES'));
  ok('entityCount khớp doc thật', report.entityCount === doc.entities.length);

  const tron = flattenDwgRawDoc(flatRaw(500));
  ok('bung TRỌN VẸN → truncated "none"', tron.report.truncated === 'none');
  ok('bung trọn vẹn → KHÔNG có câu cảnh báo thừa', tron.report.message === '');
  ok('trần mặc định vẫn là 200.000, công khai', MAX_FLATTEN_ENTITIES === 200_000);
}

/* ───────── [2] Trần THỜI GIAN — cái mà trần số lượng KHÔNG bắt được ───────── */
function testTranThoiGian() {
  console.log('\n[2] Trần thời gian — vòng lặp đồng bộ tự cắt (setTimeout không cắt nổi)');
  // Đồng hồ TIÊM: nhảy 1ms mỗi lần hỏi ⇒ tất định, không phụ thuộc tốc độ máy.
  let clock = 0;
  const { doc, report } = flattenDwgRawDoc(nestedRaw(8, 6, 30, 20), {
    maxEntities: 10_000_000, // cố ý để trần ĐẾM không bao giờ chạm — chỉ trần GIỜ được phép cắt
    budgetMs: 50,
    now: () => (clock += 1),
  });
  ok('cờ truncated = "time" (KHÔNG phải "count")', report.truncated === 'time');
  ok('vẫn giữ được hình đã bung, không trả rỗng', doc.entities.length > 0);
  ok('CÓ câu cho người dùng', report.message.length > 0);
  ok('câu nói rõ số giây đã cắt', report.message.includes('50') || /\d+ giây/.test(report.message));
  ok('câu mách nước xuất phẳng (flatten/bind xref)', /phẳng|flatten|bind/i.test(report.message));
  ok('trần giờ mặc định công khai', DEFAULT_FLATTEN_BUDGET_MS === 15_000);

  // Ca lành: cùng dữ liệu, ngân sách rộng ⇒ KHÔNG được cắt oan.
  let clock2 = 0;
  const lanh = flattenDwgRawDoc(nestedRaw(4, 3, 10, 2), {
    budgetMs: 1_000_000,
    now: () => (clock2 += 1),
  });
  ok('ngân sách rộng → không cắt oan', lanh.report.truncated === 'none' && lanh.report.message === '');
}

/* ───────── [3] Chữ ký CŨ 1 tham số vẫn sống (dwg2dxf ngoài repo dùng) ───────── */
function testChuKyCu() {
  console.log('\n[3] `dwgRawDocToDoc(raw)` 1 tham số — caller NGOÀI repo (~/Downloads/dwg2dxf)');
  const doc = dwgRawDocToDoc(flatRaw(120));
  ok('vẫn trả thẳng Doc (không phải {doc,report})', Array.isArray(doc.entities) && doc.entities.length === 120);
  ok('vẫn dựng layer', doc.layers.length >= 1);
}

/* ───────── [4] LỖ #3 — bung block nằm TRONG vùng canh gác ───────── */
async function testVungCanhGac() {
  console.log('\n[4] LỖ #3 — giai đoạn bung block phải CÓ TÊN, CÓ báo, và nằm TRONG vùng canh gác');
  ok('"flattening" có nhãn tiếng Việt trong bảng giai đoạn', typeof DWG_STAGE_LABEL.flattening === 'string' && DWG_STAGE_LABEL.flattening.length > 0);

  const worker = new FakeWorker();
  const statuses: string[] = [];
  const stages: DwgStage[] = [];
  const p = runDwgImport(
    fakeFile('to-va-long.dwg', 9_699_556),
    { timeoutMs: 5_000, onProgress: (i) => stages.push(i.stage) },
    {
      spawn: () => worker,
      orphan: () => { /* không dùng ở ca này */ },
      onStatus: (t) => statuses.push(t),
    },
  );
  await Promise.resolve();
  await new Promise((r) => setTimeout(r, 5));
  worker.say({ kind: 'result', ok: true, doc: nestedRaw(5, 3, 8, 3) } as DwgWorkerMessage);
  const res = await p;

  ok('có báo giai đoạn "flattening" (trước đây KHÔNG tồn tại)', stages.includes('flattening'));
  ok('có dòng trạng thái nhắc bước bung block', statuses.some((s) => s.includes(DWG_STAGE_LABEL.flattening)));
  ok('kết quả mang theo tường trình bung block', res.flatten !== undefined && typeof res.flatten.truncated === 'string');
  ok('file lành → tường trình rỗng, không doạ người dùng', res.flatten.message === '');
  ok('worker vẫn được terminate sau khi xong', worker.terminated === 1);
  ok('doc có hình thật', res.doc.entities.length > 0);

  // Bung block ném lỗi ⇒ reject có TÊN FILE, không nuốt im lặng.
  const w2 = new FakeWorker();
  const p2 = runDwgImport(
    fakeFile('block-hong.dwg', 1234),
    { timeoutMs: 5_000 },
    { spawn: () => w2, orphan: () => {}, onStatus: () => {} },
  );
  await new Promise((r) => setTimeout(r, 5));
  // `layers` = null ⇒ vòng `for (const l of raw.layers)` ném ngay trong bước bung.
  w2.say({ kind: 'result', ok: true, doc: { ...flatRaw(3), layers: null } } as unknown as DwgWorkerMessage);
  const msg = await rejectMessage(p2);
  ok('lỗi lúc bung block → reject có TÊN FILE', msg.includes('block-hong.dwg'));
  ok('lỗi lúc bung block → nói rõ đang bung block/xref', /bung block|xref/i.test(msg));
}

async function main() {
  testTranSoLuong();
  testTranThoiGian();
  testChuKyCu();
  await testVungCanhGac();
  console.log(`\n${pass} ok, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

void main();
