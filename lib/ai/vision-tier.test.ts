/**
 * Test phần THUẦN của tầng thị giác — chạy: node_modules/.bin/sucrase-node lib/ai/vision-tier.test.ts
 * Không gọi mạng: `pickVisionModel` (chọn model đọc ảnh, KHÔNG gửi ảnh cho model chữ) + hợp đồng
 * `readImageTiered` khi không có provider nào (lỗi typed, không mock).
 */
import { pickVisionModel, OLLAMA_VISION_NAME_RE } from './providers/ollama';
import { readImageTiered, NoVisionProviderError } from './vision-tier';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}

console.log('pickVisionModel — chỉ chọn model thị giác');
{
  ok('llama3 chữ thuần → null', pickVisionModel(['llama3:latest', 'gemma:7b'], '') === null);
  ok('llava được chọn', pickVisionModel(['llama3:latest', 'llava:13b'], '') === 'llava:13b');
  ok('llama3.2-vision được chọn', pickVisionModel(['llama3.2-vision:11b'], '') === 'llama3.2-vision:11b');
  ok('env thắng khi đã kéo', pickVisionModel(['llava:13b', 'moondream:latest'], 'moondream:latest') === 'moondream:latest');
  ok('env chưa kéo → rơi về model khớp tên', pickVisionModel(['llava:13b'], 'minicpm-v') === 'llava:13b');
  ok('danh sách rỗng + env → vẫn thử env', pickVisionModel([], 'llava:7b') === 'llava:7b');
  ok('danh sách rỗng không env → null', pickVisionModel([], '') === null);
  ok('regex nhận qwen2.5vl', OLLAMA_VISION_NAME_RE.test('qwen2.5vl:7b'));
}

console.log('readImageTiered — không provider nào → NoVisionProviderError (không mock)');
(async () => {
  const savedKey = process.env.NVIDIA_API_KEY;
  const savedBase = process.env.OLLAMA_BASE_URL;
  delete process.env.NVIDIA_API_KEY;
  // trỏ Ollama vào cổng chắc chắn không có gì để probe fail nhanh
  process.env.OLLAMA_BASE_URL = 'http://127.0.0.1:1';
  try {
    await readImageTiered('data:image/png;base64,AA==', 'x');
    ok('phải ném', false);
  } catch (err) {
    ok('ném NoVisionProviderError', err instanceof NoVisionProviderError);
    ok('lý do nhắc phần đo pixel vẫn chạy', (err as Error).message.includes('đo pixel'));
  } finally {
    if (savedKey !== undefined) process.env.NVIDIA_API_KEY = savedKey;
    if (savedBase !== undefined) process.env.OLLAMA_BASE_URL = savedBase; else delete process.env.OLLAMA_BASE_URL;
  }
  console.log(`\n${pass} pass · ${fail} fail`);
  if (fail > 0) process.exit(1);
})();
