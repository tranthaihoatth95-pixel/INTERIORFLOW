/**
 * lib/ai/providers/nvidia.test.ts — kiểm phần TẤT ĐỊNH của adapter NVIDIA image-gen
 * (parser response, sniff mime, aspect map, degrade khi thiếu key — KHÔNG gọi mạng). Chạy:
 *   node_modules/.bin/sucrase-node lib/ai/providers/nvidia.test.ts
 */
import {
  b64ToDataUri,
  extractImageB64,
  nvidiaAspect,
  nvidiaImageModel,
  NVIDIA_IMAGE_MODEL_DEFAULT,
  generateImage,
  NvidiaError,
} from './nvidia';

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

async function main() {
  console.log('extractImageB64 — chịu cả 2 shape SD3/SDXL');
  ok('SD3 {image}', extractImageB64({ image: 'aGVsbG8=' }) === 'aGVsbG8=');
  ok('SDXL {artifacts:[{base64}]}', extractImageB64({ artifacts: [{ base64: 'Zm9v' }] }) === 'Zm9v');
  ok('OpenAI-ish {b64_json}', extractImageB64({ b64_json: 'YmFy' }) === 'YmFy');
  ok('rỗng → null', extractImageB64({}) === null);
  ok('image không phải string → null', extractImageB64({ image: 42 }) === null);
  ok('artifacts rỗng → null', extractImageB64({ artifacts: [] }) === null);

  console.log('b64ToDataUri — sniff magic bytes');
  ok('PNG (iVBOR…)', b64ToDataUri('iVBORw0KGgo=').startsWith('data:image/png;base64,'));
  ok('JPEG (/9j/…)', b64ToDataUri('/9j/4AAQSkZJRg==').startsWith('data:image/jpeg;base64,'));
  ok('không rõ → mặc định png', b64ToDataUri('AAAA').startsWith('data:image/png;base64,'));

  console.log('nvidiaAspect — map tỉ lệ khung node → aspect_ratio hợp lệ');
  ok('16:9 giữ nguyên', nvidiaAspect('16:9') === '16:9');
  ok('9:16 (dọc) giữ nguyên', nvidiaAspect('9:16') === '9:16');
  ok('1:1 giữ nguyên', nvidiaAspect('1:1') === '1:1');
  ok('tỉ lệ lạ → 16:9', nvidiaAspect('7:5') === '16:9');
  ok('undefined → 16:9', nvidiaAspect(undefined) === '16:9');

  console.log('nvidiaImageModel — model chốt + override env');
  const prevModel = process.env.NVIDIA_IMAGE_MODEL;
  delete process.env.NVIDIA_IMAGE_MODEL;
  ok('mặc định = SD3 medium', nvidiaImageModel() === NVIDIA_IMAGE_MODEL_DEFAULT);
  ok('chốt đúng model', NVIDIA_IMAGE_MODEL_DEFAULT === 'stabilityai/stable-diffusion-3-medium');
  process.env.NVIDIA_IMAGE_MODEL = 'black-forest-labs/flux.1-dev';
  ok('env override ăn', nvidiaImageModel() === 'black-forest-labs/flux.1-dev');
  if (prevModel === undefined) delete process.env.NVIDIA_IMAGE_MODEL;
  else process.env.NVIDIA_IMAGE_MODEL = prevModel;

  console.log('generateImage — degrade RÕ khi thiếu NVIDIA_API_KEY (không gọi mạng)');
  const prevKey = process.env.NVIDIA_API_KEY;
  delete process.env.NVIDIA_API_KEY;
  try {
    await generateImage({ prompt: 'japandi living room' });
    ok('throw khi thiếu key', false);
  } catch (err) {
    ok('throw NvidiaError', err instanceof NvidiaError);
    ok('message nhắc build.nvidia.com', err instanceof Error && err.message.includes('build.nvidia.com'));
  }
  if (prevKey !== undefined) process.env.NVIDIA_API_KEY = prevKey;

  console.log(`\n${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main();
