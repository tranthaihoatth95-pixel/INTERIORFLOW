/**
 * Test cho lib/notebook/chunk.ts
 * Chạy: node_modules/.bin/sucrase-node lib/notebook/chunk.test.ts
 */
import assert from 'assert';
import { chunkText, chunkPages } from './chunk';

// 1. Text ngắn hơn target → 1 chunk duy nhất
{
  const out = chunkText('hello world foo bar', { targetTokens: 100 });
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].tokens, 4);
}

// 2. Text ~1000 word với target=500 overlap=50 → 2-3 chunk, có overlap
{
  const words = Array.from({ length: 1000 }, (_, i) => `w${i}`).join(' ');
  const out = chunkText(words, { targetTokens: 500, overlapTokens: 50 });
  assert.ok(out.length >= 2, `expected >=2 chunks, got ${out.length}`);
  assert.strictEqual(out[0].index, 0);
  // Chunk 2 phải bắt đầu bằng 50 word cuối chunk 1
  const c1Last50 = out[0].content.split(' ').slice(-50).join(' ');
  const c2First50 = out[1].content.split(' ').slice(0, 50).join(' ');
  assert.strictEqual(c1Last50, c2First50, 'overlap phải trùng 50 từ cuối chunk 1 với 50 từ đầu chunk 2');
}

// 3. Text rỗng → 0 chunk
{
  assert.deepStrictEqual(chunkText(''), []);
  assert.deepStrictEqual(chunkText('   \n\n  '), []);
}

// 4. chunkPages giữ số trang
{
  const pages = [
    { page: 1, text: 'trang 1 abc def ghi' },
    { page: 2, text: 'trang 2 xyz uvw' },
  ];
  const out = chunkPages(pages, { targetTokens: 100 });
  assert.strictEqual(out.length, 2);
  assert.strictEqual(out[0].page, 1);
  assert.strictEqual(out[1].page, 2);
  assert.strictEqual(out[0].index, 0);
  assert.strictEqual(out[1].index, 1);
}

// 5. Overlap = 0 vẫn hoạt động
{
  const words = Array.from({ length: 300 }, (_, i) => `w${i}`).join(' ');
  const out = chunkText(words, { targetTokens: 100, overlapTokens: 0 });
  assert.strictEqual(out.length, 3);
  assert.strictEqual(out[0].tokens + out[1].tokens + out[2].tokens, 300);
}

console.log('OK — chunk.test.ts (5/5)');
