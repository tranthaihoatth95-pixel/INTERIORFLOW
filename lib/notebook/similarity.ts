/**
 * lib/notebook/similarity.ts — cosine similarity + top-k retrieval trong Node.
 *
 * Option 🅐: giữ embedding dưới dạng JSON string trong SQLite, load về Node,
 * so sánh cosine bằng vòng lặp. Với vài nghìn chunk/project (một dự án nội thất
 * hiếm khi vượt), đủ nhanh (~10ms cho 5k × 1024-dim vector). Chỉ khi lên chục
 * nghìn mới cần pgvector/sqlite-vss.
 */

export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (!n) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export interface ScoredChunk<T> {
  item: T;
  score: number;
}

/**
 * Trả về top-k item xếp theo cosine giảm dần với query vector.
 * `getVector` để caller quyết lấy embedding ra sao (parse JSON, cache trước…).
 */
export function topK<T>(
  query: number[],
  items: T[],
  getVector: (item: T) => number[] | null,
  k = 5,
): ScoredChunk<T>[] {
  const scored: ScoredChunk<T>[] = [];
  for (const item of items) {
    const v = getVector(item);
    if (!v || v.length === 0) continue;
    scored.push({ item, score: cosineSimilarity(query, v) });
  }
  scored.sort((x, y) => y.score - x.score);
  return scored.slice(0, Math.max(1, k));
}
