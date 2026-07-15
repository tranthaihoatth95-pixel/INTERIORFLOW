/**
 * lib/ai/text-tier.test.ts — kiểm LOGIC CHỌN TẦNG chữ: Cloud (NVIDIA) → Ollama local → lỗi typed
 * cho route lo lõi tất định. Mock fetch định tuyến theo URL (nvidia vs localhost) + điều khiển
 * NVIDIA_API_KEY. KHÔNG phụ thuộc NVIDIA/Ollama sống.
 * Chạy: node_modules/.bin/sucrase-node lib/ai/text-tier.test.ts
 */
import { completeTextTiered, NoTextProviderError, NvidiaFreeExhausted } from './text-tier';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const realFetch = globalThis.fetch;
function stubFetch(impl: (url: string, init?: unknown) => Promise<Response>) {
  (globalThis as { fetch: unknown }).fetch = impl as unknown;
}
function restoreFetch() { (globalThis as { fetch: unknown }).fetch = realFetch as unknown; }
function res(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
}
const isNvidia = (u: string) => u.includes('integrate.api.nvidia.com');
const isOllamaTags = (u: string) => u.includes('localhost:11434') && u.endsWith('/api/tags');
const isOllamaChat = (u: string) => u.includes('localhost:11434') && u.endsWith('/v1/chat/completions');

async function withKey<T>(key: string | undefined, fn: () => Promise<T>): Promise<T> {
  const prev = process.env.NVIDIA_API_KEY;
  const prevModel = process.env.OLLAMA_MODEL;
  if (key === undefined) delete process.env.NVIDIA_API_KEY;
  else process.env.NVIDIA_API_KEY = key;
  delete process.env.OLLAMA_MODEL; // để resolveOllamaModel dùng danh sách probe
  try { return await fn(); }
  finally {
    if (prev === undefined) delete process.env.NVIDIA_API_KEY; else process.env.NVIDIA_API_KEY = prev;
    if (prevModel === undefined) delete process.env.OLLAMA_MODEL; else process.env.OLLAMA_MODEL = prevModel;
  }
}

async function main() {
  console.log('Tầng 1 — Cloud (có key) chạy trước');
  await withKey('fake-key', async () => {
    stubFetch(async (url) => {
      if (isNvidia(url)) return res({ choices: [{ message: { content: 'Bản concept quiet-luxury' } }] });
      return res({}, 404);
    });
    const r = await completeTextTiered('viết concept');
    ok('có key → tier cloud', r.tier === 'cloud');
    ok('trả text cloud', r.text === 'Bản concept quiet-luxury');
    ok('kèm model cloud', r.model.length > 0);
  });
  restoreFetch();

  console.log('Tầng 2 — không key → Ollama local');
  await withKey(undefined, async () => {
    stubFetch(async (url) => {
      if (isOllamaTags(url)) return res({ models: [{ name: 'llama3:latest' }] });
      if (isOllamaChat(url)) return res({ choices: [{ message: { content: 'Concept local' } }] });
      return res({}, 404);
    });
    const r = await completeTextTiered('viết concept');
    ok('không key + Ollama sống → tier local', r.tier === 'local');
    ok('trả text local', r.text === 'Concept local');
    ok('model local = llama3:latest', r.model === 'llama3:latest');
  });
  restoreFetch();

  console.log('Cloud lỗi/hết lượt → TỤT xuống Ollama');
  await withKey('fake-key', async () => {
    stubFetch(async (url) => {
      if (isNvidia(url)) return res('rate limit', 429); // NvidiaFreeExhausted
      if (isOllamaTags(url)) return res({ models: [{ name: 'gemma4:latest' }] });
      if (isOllamaChat(url)) return res({ choices: [{ message: { content: 'Local cứu viện' } }] });
      return res({}, 404);
    });
    const r = await completeTextTiered('viết concept');
    ok('cloud hết lượt + Ollama sống → tier local', r.tier === 'local');
    ok('dùng model có sẵn (gemma4)', r.model === 'gemma4:latest');
  });
  restoreFetch();

  console.log('Cloud hết lượt & KHÔNG có Ollama → ném NvidiaFreeExhausted');
  await withKey('fake-key', async () => {
    stubFetch(async (url) => {
      if (isNvidia(url)) return res('rate limit', 429);
      throw new Error('ECONNREFUSED'); // Ollama tắt
    });
    try {
      await completeTextTiered('x');
      ok('phải ném', false);
    } catch (e) {
      ok('ném NvidiaFreeExhausted (route → 429)', e instanceof NvidiaFreeExhausted);
    }
  });
  restoreFetch();

  console.log('Không key & không Ollama → NoTextProviderError (route → lõi tất định)');
  await withKey(undefined, async () => {
    stubFetch(async () => { throw new Error('ECONNREFUSED'); });
    try {
      await completeTextTiered('x');
      ok('phải ném', false);
    } catch (e) {
      ok('ném NoTextProviderError', e instanceof NoTextProviderError);
      ok('message nhắc cả NVIDIA lẫn Ollama', e instanceof Error && e.message.includes('NVIDIA') && e.message.toLowerCase().includes('ollama'));
    }
  });
  restoreFetch();

  console.log('Cloud trả rỗng → tụt xuống Ollama');
  await withKey('fake-key', async () => {
    stubFetch(async (url) => {
      if (isNvidia(url)) return res({ choices: [{ message: { content: '' } }] });
      if (isOllamaTags(url)) return res({ models: [{ name: 'llama3:latest' }] });
      if (isOllamaChat(url)) return res({ choices: [{ message: { content: 'Local thay thế' } }] });
      return res({}, 404);
    });
    const r = await completeTextTiered('x');
    ok('cloud rỗng → tier local', r.tier === 'local' && r.text === 'Local thay thế');
  });
  restoreFetch();

  console.log(`\n${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main();
