/**
 * Integration test cho pipeline chunk + similarity (KHÔNG gọi mạng NVIDIA).
 * Chạy: node_modules/.bin/sucrase-node lib/notebook/rag.integration.test.ts
 *
 * Kiểm tra: giả lập vector "embedding" theo hash từ text → cosine top-k phải
 * trả về đúng chunk chứa câu hỏi. Đủ để chắc pipeline lắp ráp không đảo thứ tự.
 */
import assert from 'assert';
import { chunkText } from './chunk';
import { cosineSimilarity, topK } from './similarity';

// Fake embed: bag-of-words 128 dim (hash mỗi word → bit).
function fakeEmbed(text: string): number[] {
  const v = new Array(128).fill(0);
  for (const w of text.toLowerCase().split(/\s+/)) {
    let h = 0;
    for (let i = 0; i < w.length; i += 1) h = (h * 31 + w.charCodeAt(i)) | 0;
    v[Math.abs(h) % 128] += 1;
  }
  // L2 normalize
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / n);
}

// 1. cosine hai vector cùng hướng ~ 1, vuông góc ~ 0
{
  const a = [1, 0, 0];
  const b = [1, 0, 0];
  const c = [0, 1, 0];
  assert.strictEqual(cosineSimilarity(a, b), 1);
  assert.strictEqual(cosineSimilarity(a, c), 0);
}

// 2. Pipeline: chunk 3 đoạn, query nội dung đoạn 2 → top-1 phải là đoạn 2
{
  // 3 đoạn ~60 từ mỗi đoạn → với targetTokens=50 sẽ ra ~3-4 chunk (min 50).
  const filler = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo';
  const doc =
    `Đoạn một nói về ánh sáng tự nhiên và giếng trời trong sảnh đón ${filler}. ` +
    `Đoạn hai bàn về vật liệu travertine ốp mặt bar quầy lễ tân màu vàng ngà ${filler}. ` +
    `Đoạn ba đề cập nội thất phòng ngủ với gỗ óc chó ${filler}.`;
  const chunks = chunkText(doc, { targetTokens: 50, overlapTokens: 0 });
  assert.ok(chunks.length >= 3, `expected >=3 chunks, got ${chunks.length}`);

  const withVec = chunks.map((c) => ({ ...c, vec: fakeEmbed(c.content) }));
  const q = fakeEmbed('travertine ốp mặt bar quầy lễ tân');
  const hits = topK(q, withVec, (x) => x.vec, 1);
  assert.strictEqual(hits.length, 1);
  assert.match(hits[0].item.content, /travertine/);
  assert.ok(hits[0].score > 0.3, `expected top-1 score > 0.3, got ${hits[0].score}`);
}

// 3. Với embedding rỗng, chunk bị skip
{
  const items = [
    { content: 'a', vec: [1, 0] },
    { content: 'b', vec: [] },
    { content: 'c', vec: [0, 1] },
  ];
  const hits = topK([1, 0], items, (x) => x.vec, 5);
  assert.strictEqual(hits.length, 2, 'chunk vec rỗng phải bị loại');
}

console.log('OK — rag.integration.test.ts (3/3)');
