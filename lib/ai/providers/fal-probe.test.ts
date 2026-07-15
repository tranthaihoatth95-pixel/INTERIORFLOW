/**
 * lib/ai/providers/fal-probe.test.ts — kiểm phần TẤT ĐỊNH của probe fal
 * (phân loại lỗi + degrade no-key, KHÔNG gọi mạng). Chạy:
 *   node_modules/.bin/sucrase-node lib/ai/providers/fal-probe.test.ts
 */
import { classifyFalError, probeFal } from './fal';

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
  console.log('classifyFalError — phân loại message fal');
  ok('Exhausted balance → exhausted', classifyFalError('User is locked. Reason: Exhausted balance.') === 'exhausted');
  ok('billing → exhausted', classifyFalError('Payment required: billing issue') === 'exhausted');
  ok('403 forbidden (không nói balance) → bad-key', classifyFalError('Forbidden (403)') === 'bad-key');
  ok('invalid api key → bad-key', classifyFalError('Invalid API key provided') === 'bad-key');
  ok('timeout → error', classifyFalError('Probe timeout 15s — mạng chậm.') === 'error');
  ok('lỗi lạ → error', classifyFalError('ECONNRESET') === 'error');

  console.log('probeFal — degrade khi thiếu key (không gọi mạng)');
  const prev = process.env.FAL_KEY;
  delete process.env.FAL_KEY;
  const r = await probeFal(1000);
  ok('status no-key', r.status === 'no-key');
  ok('detail nhắc .env.local', r.detail.includes('.env.local'));
  if (prev !== undefined) process.env.FAL_KEY = prev;

  console.log(`\n${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main();
