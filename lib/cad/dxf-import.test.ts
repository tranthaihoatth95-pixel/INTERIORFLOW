/**
 * lib/cad/dxf-import.test.ts — G-M1-01: vòng đời nhập DXF (tiến độ · huỷ · quá giờ).
 * Chạy: `node_modules/.bin/sucrase-node lib/cad/dxf-import.test.ts`
 *
 * Test bằng WORKER GIẢ + đồng hồ giả — không đẻ Worker thật, không đọc tệp thật, nên chạy trong
 * mili giây và tất định. Đây đúng lý do `dxf-import.ts` tách khỏi `dxf-open.ts` (file kia có
 * `import.meta.url`, sucrase-node không require nổi — bài học từ `dwg.ts`/`dwg-map.ts` 05/08).
 */

import {
  runDxfImport, dxfProgressLine, dxfTimeoutMessage, DXF_CANCELLED_MESSAGE, DXF_STAGE_LABEL,
  type DxfWorkerLike, type DxfStage,
} from './dxf-import';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean, extra = '') {
  if (cond) { pass += 1; console.log(`  ok  - ${name}`); }
  else { fail += 1; console.log(`  FAIL - ${name}${extra ? ` — ${extra}` : ''}`); }
}

/** Worker giả: giữ listener, cho test tự quyết khi nào "trả lời". */
function fakeWorker() {
  const on: Record<string, ((ev: unknown) => void)[]> = { message: [], error: [] };
  let terminated = false;
  const w: DxfWorkerLike & { posted: unknown[] } = {
    posted: [],
    postMessage(msg) { w.posted.push(msg); },
    addEventListener(type, fn) { on[type].push(fn); },
    terminate() { terminated = true; },
  };
  return {
    worker: w,
    emit: (data: unknown) => on.message.forEach((f) => f({ data })),
    emitError: (message: string) => on.error.forEach((f) => f({ message })),
    isTerminated: () => terminated,
  };
}

/** Đồng hồ giả — test tự đẩy thời gian, nhịp heartbeat gọi tay. */
function fakeClock() {
  let t = 0;
  const ticks: (() => void)[] = [];
  return {
    now: () => t,
    advance: (ms: number) => { t += ms; },
    setInterval: (fn: () => void) => { ticks.push(fn); return ticks.length; },
    clearInterval: () => { /* không cần: test tự gọi beat() */ },
    beat: () => ticks.forEach((f) => f()),
  };
}

const run = async () => {
  console.log('\n[1] Đường thuận — worker trả kết quả, promise resolve, KHÔNG bỏ rơi worker');
  {
    const f = fakeWorker();
    const c = fakeClock();
    const orphaned: string[] = [];
    const p = runDxfImport('DXF', 'mat-bang.dxf', {}, {
      spawn: () => f.worker, orphan: (_w, st) => orphaned.push(st), now: c.now,
      setInterval: c.setInterval, clearInterval: c.clearInterval,
    });
    ok('đã gửi nội dung tệp sang worker', (f.worker.posted[0] as { text: string })?.text === 'DXF');
    f.emit({ kind: 'done', doc: { entities: [], layers: [] }, report: { totalEntities: 0 } });
    const res = await p;
    ok('resolve đúng doc', Array.isArray(res.doc.entities));
    ok('KHÔNG bỏ rơi worker khi xong bình thường', orphaned.length === 0);
  }

  console.log('\n[2] Tiến độ — mốc giai đoạn CÓ THẬT + đếm giây (không bịa phần trăm)');
  {
    const f = fakeWorker();
    const c = fakeClock();
    const seen: { stage: DxfStage; elapsedMs: number }[] = [];
    const status: string[] = [];
    const p = runDxfImport('DXF', 'a.dxf', { onProgress: (x) => seen.push(x) }, {
      spawn: () => f.worker, orphan: () => {}, onStatus: (t) => status.push(t),
      now: c.now, setInterval: c.setInterval, clearInterval: c.clearInterval,
    });
    c.advance(1000); c.beat();
    ok('nhịp 1 giây có báo tiến độ', seen.length === 1 && seen[0].elapsedMs === 1000, JSON.stringify(seen));
    ok('giai đoạn đầu là "đang đọc tệp"', seen[0].stage === 'reading');
    f.emit({ kind: 'stage', stage: 'parsing' });
    ok('worker báo mốc → đổi giai đoạn', seen[seen.length - 1].stage === 'parsing');
    ok('câu trạng thái có tên tệp + số giây + lối thoát', /a\.dxf/.test(status[0]) && /giây/.test(status[0]) && /Huỷ/.test(status[0]), status[0]);
    ok('KHÔNG có phần trăm giả trong câu', !status.some((t) => /%/.test(t)));
    f.emit({ kind: 'done', doc: { entities: [], layers: [] }, report: {} });
    await p;
  }

  console.log('\n[3] Huỷ — reject đúng câu, và BỎ RƠI worker (không terminate ngay)');
  {
    const f = fakeWorker();
    const c = fakeClock();
    const orphaned: DxfStage[] = [];
    let abortFn: (() => void) | null = null;
    const signal = { aborted: false, addEventListener: (_t: 'abort', fn: () => void) => { abortFn = fn; } };
    const p = runDxfImport('DXF', 'to.dxf', { signal }, {
      spawn: () => f.worker, orphan: (_w, st) => orphaned.push(st), now: c.now,
      setInterval: c.setInterval, clearInterval: c.clearInterval,
    });
    c.advance(3000);
    abortFn!();
    let msg = '';
    await p.catch((e: Error) => { msg = e.message; });
    ok('reject với câu huỷ', msg === DXF_CANCELLED_MESSAGE, msg);
    ok('có bỏ rơi worker', orphaned.length === 1, JSON.stringify(orphaned));
    ok('KHÔNG terminate() ngay (luật đã chốt ở đường DWG)', !f.isTerminated());
  }
  {
    // huỷ TRƯỚC khi kịp chạy
    const f = fakeWorker();
    const p = runDxfImport('DXF', 'x.dxf', { signal: { aborted: true, addEventListener: () => {} } }, {
      spawn: () => f.worker, orphan: () => {},
    });
    let msg = '';
    await p.catch((e: Error) => { msg = e.message; });
    ok('huỷ trước khi chạy cũng reject sạch', msg === DXF_CANCELLED_MESSAGE);
  }

  console.log('\n[4] Quá giờ — dừng, báo rõ tệp nào kẹt ở giai đoạn nào');
  {
    const f = fakeWorker();
    const c = fakeClock();
    const orphaned: DxfStage[] = [];
    const p = runDxfImport('DXF', 'nang.dxf', { timeoutMs: 5000 }, {
      spawn: () => f.worker, orphan: (_w, st) => orphaned.push(st), now: c.now,
      setInterval: c.setInterval, clearInterval: c.clearInterval,
    });
    f.emit({ kind: 'stage', stage: 'parsing' });
    c.advance(5000); c.beat();
    let msg = '';
    await p.catch((e: Error) => { msg = e.message; });
    ok('reject vì quá giờ', /Quá 5 giây/.test(msg), msg);
    ok('câu lỗi nêu tên tệp', /nang\.dxf/.test(msg));
    ok('câu lỗi nêu giai đoạn đang kẹt', /dựng hình/i.test(msg), msg);
    ok('quá giờ cũng bỏ rơi worker', orphaned.length === 1);
  }

  console.log('\n[5] Lỗi từ worker — không nuốt, không throw kiểu lạ');
  {
    const f = fakeWorker();
    const p = runDxfImport('DXF', 'hong.dxf', {}, { spawn: () => f.worker, orphan: () => {} });
    f.emit({ kind: 'error', message: 'Không đọc được bản vẽ: hỏng' });
    let msg = '';
    await p.catch((e: Error) => { msg = e.message; });
    ok('reject đúng câu của worker', msg === 'Không đọc được bản vẽ: hỏng', msg);
  }
  {
    const f = fakeWorker();
    const p = runDxfImport('DXF', 'crash.dxf', {}, { spawn: () => f.worker, orphan: () => {} });
    f.emitError('boom');
    let msg = '';
    await p.catch((e: Error) => { msg = e.message; });
    ok('worker chết cũng ra câu tiếng Việt', /Bộ đọc bản vẽ gặp lỗi: boom/.test(msg), msg);
  }
  {
    const p = runDxfImport('DXF', 'x.dxf', {}, { spawn: () => { throw new Error('không đẻ được'); }, orphan: () => {} });
    let msg = '';
    await p.catch((e: Error) => { msg = e.message; });
    ok('không đẻ nổi worker cũng reject sạch, không văng', /Không mở được bộ đọc bản vẽ/.test(msg), msg);
  }

  console.log('\n[6] Câu chữ ra UI — không lộ tên hàm/field nội bộ');
  {
    const line = dxfProgressLine('nha-pho.dxf', 'parsing', 4200);
    ok('nói việc + tệp + giây', line === 'Đang dựng hình nha-pho.dxf — 4 giây. Bấm Huỷ để dừng.', line);
    ok('không lộ jargon', !/worker|parse|entity|DXF ASCII/i.test(line));
    ok('3 nhãn giai đoạn đều là tiếng Việt', Object.values(DXF_STAGE_LABEL).every((v) => /[a-zA-ZÀ-ỹ]/.test(v) && !/parsing|reading/i.test(v)));
    ok('câu quá giờ nói được LÀM GÌ TIẾP', /Đã dừng/.test(dxfTimeoutMessage('a.dxf', 'parsing', 60000)));
  }

  console.log(`\ndxf-import.test.ts — ${pass} pass, ${fail} fail`);
  if (fail) process.exit(1);
};

run();
