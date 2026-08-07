import assert from 'node:assert';
import { shouldIgnoreIncomingChange, resolveWriteConflict, LOOP_WINDOW_MS, IDF_WRITER } from './anti-loop';

let pass = 0;
function test(name: string, fn: () => void) {
  fn();
  pass++;
  console.log(`  ✓ ${name}`);
}

test('IF vừa ghi 10s trước → bỏ qua thay đổi đến từ hệ ngoài', () => {
  const now = 1_000_000;
  const stamp = { lastWriteBy: IDF_WRITER, lastWriteAt: new Date(now - 10_000) };
  assert.strictEqual(shouldIgnoreIncomingChange(stamp, now), true);
});

test('IF ghi đúng 60s trước (chạm biên) → KHÔNG bỏ qua (cửa sổ nửa mở, tránh kẹt vĩnh viễn)', () => {
  const now = 1_000_000;
  const stamp = { lastWriteBy: IDF_WRITER, lastWriteAt: new Date(now - LOOP_WINDOW_MS) };
  assert.strictEqual(shouldIgnoreIncomingChange(stamp, now), false);
});

test('IF ghi 59.9s trước → vẫn trong cửa sổ, bỏ qua', () => {
  const now = 1_000_000;
  const stamp = { lastWriteBy: IDF_WRITER, lastWriteAt: new Date(now - (LOOP_WINDOW_MS - 100)) };
  assert.strictEqual(shouldIgnoreIncomingChange(stamp, now), true);
});

test('lastWriteBy null (chưa từng ghi 2 chiều) → không bỏ qua gì cả', () => {
  const now = 1_000_000;
  assert.strictEqual(shouldIgnoreIncomingChange({ lastWriteBy: null, lastWriteAt: null }, now), false);
});

test('lastWriteBy là chính hệ ngoài (không phải idf) → không bỏ qua — đây là thay đổi thật của họ', () => {
  const now = 1_000_000;
  const stamp = { lastWriteBy: 'lark', lastWriteAt: new Date(now - 1000) };
  assert.strictEqual(shouldIgnoreIncomingChange(stamp, now), false);
});

test('resolveWriteConflict: bản mới hơn thắng, log rõ ai thua', () => {
  const idf = { source: 'idf', updatedAt: new Date(2000) };
  const lark = { source: 'lark', updatedAt: new Date(1000) };
  const r = resolveWriteConflict(idf, lark);
  assert.strictEqual(r.winner.source, 'idf');
  assert.strictEqual(r.loser.source, 'lark');
  assert.ok(r.reason.includes('lark'));
});

test('resolveWriteConflict: hoà giờ → bên gọi đầu (a) thắng, deterministic', () => {
  const t = new Date(5000);
  const a = { source: 'idf', updatedAt: t };
  const b = { source: 'lark', updatedAt: t };
  const r = resolveWriteConflict(a, b);
  assert.strictEqual(r.winner.source, 'idf');
});

console.log(`${pass}/${pass} pass (lib/integrations/anti-loop.test.ts)`);
