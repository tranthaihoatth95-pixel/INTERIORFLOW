/**
 * lib/ai/providers/ollama.test.ts — kiểm phần TẤT ĐỊNH của provider Ollama local:
 * parse response (2 shape), chọn model, dò khả dụng, completeText (mock fetch — KHÔNG cần
 * Ollama sống). Chạy: node_modules/.bin/sucrase-node lib/ai/providers/ollama.test.ts
 */
import {
  parseChatContent,
  parseModelList,
  resolveOllamaModel,
  isOllamaAvailable,
  completeText,
  OLLAMA_MODEL_DEFAULT,
  OllamaError,
} from './ollama';

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

type FetchImpl = (url: string, init?: unknown) => Promise<Response>;
const realFetch = globalThis.fetch;
function stubFetch(impl: FetchImpl) {
  (globalThis as { fetch: unknown }).fetch = impl as unknown;
}
function restoreFetch() {
  (globalThis as { fetch: unknown }).fetch = realFetch as unknown;
}
/** Response giả tối thiểu (đủ cho adapter dùng .ok/.status/.json/.text). */
function res(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
}

async function main() {
  console.log('parseChatContent — chịu 2 shape (/v1 OpenAI · /api native)');
  ok('OpenAI /v1 {choices[].message.content}', parseChatContent({ choices: [{ message: { content: 'xin chào' } }] }) === 'xin chào');
  ok('native /api {message.content}', parseChatContent({ message: { content: 'chào buổi sáng' } }) === 'chào buổi sáng');
  ok('rỗng → ""', parseChatContent({}) === '');
  ok('content không phải string → ""', parseChatContent({ message: { content: 42 } }) === '');
  ok('choices rỗng → ""', parseChatContent({ choices: [] }) === '');

  console.log('parseModelList — /api/tags {models[].name}');
  ok('rút tên model', JSON.stringify(parseModelList({ models: [{ name: 'llama3:latest' }, { name: 'gemma4:latest' }] })) === '["llama3:latest","gemma4:latest"]');
  ok('không có models → []', parseModelList({}).length === 0);
  ok('name thiếu → lọc bỏ', parseModelList({ models: [{ name: 'a' }, {}] }).length === 1);

  console.log('resolveOllamaModel — ưu tiên env → default → model đầu, KHÔNG tự pull');
  ok('env có & đã kéo → dùng env', resolveOllamaModel(['x', 'llama3:latest'], 'x') === 'x');
  ok('env chưa kéo → bỏ, về default có sẵn', resolveOllamaModel(['llama3:latest'], 'khong-co') === 'llama3:latest');
  ok('không env, default có → default', resolveOllamaModel(['gemma4:latest', 'llama3:latest']) === OLLAMA_MODEL_DEFAULT);
  ok('không env, default vắng → model đầu tiên', resolveOllamaModel(['gemma4:latest']) === 'gemma4:latest');
  ok('available rỗng + env → tin env (server sẽ báo nếu thiếu)', resolveOllamaModel([], 'foo:latest') === 'foo:latest');
  ok('available rỗng, không env → default', resolveOllamaModel([]) === OLLAMA_MODEL_DEFAULT);

  console.log('isOllamaAvailable — TỰ DÒ, không throw');
  stubFetch(async (url) => {
    if (url.endsWith('/api/tags')) return res({ models: [{ name: 'llama3:latest' }] });
    return res({}, 404);
  });
  const up = await isOllamaAvailable();
  ok('server chạy → available true', up.available === true);
  ok('trả kèm danh sách model', up.models.includes('llama3:latest'));

  stubFetch(async () => { throw new Error('ECONNREFUSED'); });
  const down = await isOllamaAvailable();
  ok('server tắt (fetch throw) → available false, không ném', down.available === false && down.models.length === 0);

  stubFetch(async () => res('boom', 500));
  const err5 = await isOllamaAvailable();
  ok('server 500 → available false', err5.available === false);
  restoreFetch();

  console.log('completeText — mock fetch, không cần Ollama sống');
  stubFetch(async (url, init) => {
    ok('gọi đúng endpoint /v1/chat/completions', String(url).endsWith('/v1/chat/completions'));
    const b = JSON.parse((init as { body: string }).body);
    ok('body có model + messages', typeof b.model === 'string' && Array.isArray(b.messages));
    ok('system nằm đầu messages', b.messages[0].role === 'system');
    return res({ choices: [{ message: { content: 'Chân Mộng Nhật Bản' } }] });
  });
  const out = await completeText('Viết tiêu đề', 'Bạn là copywriter');
  ok('trả đúng content', out === 'Chân Mộng Nhật Bản');
  restoreFetch();

  console.log('completeText — lỗi rõ ràng, không mock');
  stubFetch(async () => res('model not found', 404));
  try {
    await completeText('x');
    ok('404 phải throw', false);
  } catch (e) {
    ok('404 → OllamaError nhắc ollama pull', e instanceof OllamaError && (e as Error).message.includes('ollama pull'));
  }
  restoreFetch();

  stubFetch(async () => res({ choices: [{ message: { content: '' } }] }));
  try {
    await completeText('x');
    ok('rỗng phải throw', false);
  } catch (e) {
    ok('response rỗng → OllamaError', e instanceof OllamaError);
  }
  restoreFetch();

  console.log(`\n${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main();
