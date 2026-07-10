// public/__testcases/runner.js — harness DEV-ONLY test prompt chặng Render.
//
// Chạy trong trình duyệt (dev). Chặn fetch để bắt payload `POST /api/jobs`
// mà node AI gửi provider → đọc được đúng chuỗi `input.prompt` + tham số,
// không tốn credit, không cần balance.
//
// Stub:
//   /api/health  → báo fal sẵn sàng (để node đi nhánh provider thật, không mock)
//   /api/jobs    → BẮT payload rồi throw '__CAPTURED__' (dừng ngay, khỏi poll)
//   /api/library → reject → gu = '' (fetchGuProfile tự nuốt lỗi) → prompt sạch
//   còn lại      → cho đi thẳng (node client-side vẫn tải được ảnh)
//
// Dùng: const { runAll } = await import('/__testcases/runner.js');
//       await runAll(['/__testcases/render-a.json', ...]);

const TEXT_HANDLE = /prompt|text|content|note/i;

function wrapInputs(raw) {
  const inputs = {};
  for (const [k, v] of Object.entries(raw || {})) {
    inputs[k] = { dataType: TEXT_HANDLE.test(k) ? 'text' : 'image', value: v };
  }
  return inputs;
}

function assertCase(c, { captured, jobCalled, err, out }) {
  const E = c.expect || {};
  const fails = [];

  if (E.expectThrow) {
    if (!err) fails.push(`kỳ vọng throw chứa "${E.expectThrow}" nhưng node chạy xong`);
    else if (err.includes('__CAPTURED__')) fails.push(`kỳ vọng throw "${E.expectThrow}" nhưng node đã gọi provider`);
    else if (!err.includes(E.expectThrow)) fails.push(`throw sai: mong "${E.expectThrow}", nhận "${err}"`);
    return fails;
  }

  if (E.expectNoJob) {
    if (jobCalled) fails.push('node client-side nhưng ĐÃ gọi /api/jobs');
    if (err && !/__STUB__|__CAPTURED__/.test(err)) fails.push(`lỗi bất ngờ: ${err}`);
    for (const k of E.expectOutputKeys || []) {
      if (!out || !(k in out)) fails.push(`thiếu output "${k}"`);
    }
    return fails;
  }

  if (!captured) {
    fails.push(`không bắt được payload /api/jobs (err=${err ?? 'none'})`);
    return fails;
  }

  const inp = captured.input || {};
  const prompt = String(inp.prompt ?? '');

  if (E.task && captured.task !== E.task) fails.push(`task="${captured.task}" ≠ "${E.task}"`);
  if (E.promptEquals && prompt !== E.promptEquals) {
    fails.push(`promptEquals lệch\n      got: ${prompt}\n      exp: ${E.promptEquals}`);
  }
  for (const s of E.promptIncludes || []) {
    if (!prompt.includes(s)) fails.push(`prompt THIẾU "${s}"`);
  }
  for (const s of E.promptExcludes || []) {
    if (prompt.includes(s)) fails.push(`prompt CHỨA chuỗi cấm "${s}"`);
  }
  for (const k of E.inputKeys || []) {
    if (!(k in inp)) fails.push(`thiếu input key "${k}"`);
  }
  for (const [k, v] of Object.entries(E.inputEquals || {})) {
    // client absolutize URL tương đối trước khi submit (lib/ai/client.ts) —
    // spec ghi '/demo/…' thì chấp nhận cả bản đã absolutize origin + '/demo/…'.
    const matchesAbsolutized =
      typeof v === 'string' && v.startsWith('/') && inp[k] === new URL(v, window.location.origin).href;
    if (inp[k] !== v && !matchesAbsolutized) {
      fails.push(`input.${k}=${JSON.stringify(inp[k])} ≠ ${JSON.stringify(v)}`);
    }
  }
  if (E.negativeNonEmpty && !String(inp.negative_prompt ?? '').trim()) fails.push('negative_prompt RỖNG');

  return fails;
}

export async function runAll(specUrls) {
  const R = window.__nodeRegistry;
  if (!R) throw new Error('Thiếu window.__nodeRegistry (chỉ có ở dev).');

  const origFetch = window.fetch.bind(window);

  // Nạp spec bằng fetch GỐC, trước khi stub.
  const cases = [];
  for (const u of specUrls) {
    const res = await origFetch(u);
    if (!res.ok) throw new Error(`Không nạp được spec ${u} (HTTP ${res.status})`);
    cases.push(...(await res.json()));
  }

  const results = [];
  for (const c of cases) {
    let captured = null;
    let jobCalled = false;
    let err = null;
    let out = null;

    window.fetch = async (url, opts) => {
      const u = String(url && url.url ? url.url : url);
      if (u.includes('/api/health')) {
        return new Response(JSON.stringify({ fal: true, comfyui: false, sd: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (u.includes('/api/jobs') && opts && opts.method === 'POST') {
        jobCalled = true;
        captured = JSON.parse(opts.body);
        throw new Error('__CAPTURED__');
      }
      if (u.includes('/api/library')) throw new Error('__STUB__'); // gu = ''
      return origFetch(url, opts);
    };

    try {
      const def = R.getDefinition(c.node);
      const ctx = {
        nodeId: 'test',
        inputs: wrapInputs(c.inputs),
        params: { ...R.defaultParams(def), ...(c.params || {}) },
        onProgress: () => {},
        aiTier: 4, // provider 'fal'
      };
      out = await def.execute(ctx);
    } catch (e) {
      err = String((e && e.message) || e);
    } finally {
      window.fetch = origFetch;
    }

    const fails = assertCase(c, { captured, jobCalled, err, out });
    results.push({
      node: c.node,
      label: c.label,
      pass: fails.length === 0,
      fails,
      prompt: captured?.input?.prompt ?? null,
    });
  }

  const passed = results.filter((r) => r.pass).length;
  return { total: results.length, passed, failed: results.length - passed, results };
}
