/**
 * lib/notebook/rag.ts — RAG pipeline cho Vitals chat ở scope project.
 *
 * Flow:
 *  1. Embed câu hỏi (input_type='query').
 *  2. Load mọi chunk của project notebook (kèm sourceId/title/page/embedding JSON).
 *  3. Cosine top-k.
 *  4. Build prompt: system = `chatSystemPromptFor(stage)` + phần "Context từ tài liệu
 *     project" + "Yêu cầu trả lời có trích nguồn dạng [n]".
 *  5. Gọi `completeTextTiered` (cloud NVIDIA → Ollama).
 *  6. Trả `{ answer, sources: [{ sourceId, sourceTitle, page?, snippet, score }] }`.
 *
 * KHÔNG dùng streaming ở P1 (khớp pattern ai-assist-chat hiện tại).
 */

import { prisma } from '../server/db';
import { embedOne, NoEmbedProviderError } from './embed';
import { cosineSimilarity } from './similarity';
import { chatSystemPromptFor, type ChatStage } from '../ai/chat-assist';
import { completeTextTiered, NoTextProviderError, NvidiaFreeExhausted } from '../ai/text-tier';

export interface RagSourceHit {
  sourceId: string;
  sourceTitle: string;
  page: number | null;
  snippet: string;
  score: number;
}

export interface RagResult {
  answer: string;
  sources: RagSourceHit[];
  tier: 'cloud' | 'local' | 'none';
  model: string;
  /** Prompt system tổng hợp đã dùng — trả về cho UI debug/badge. */
  stagePrompt: string;
}

export interface RagOpts {
  topK?: number;
  stage?: ChatStage;
  /** Cắt snippet trong response (ký tự). Mặc định 240. */
  snippetChars?: number;
}

/** Cắt snippet quanh chunk cho UI hiển thị (không cắt giữa từ). */
function toSnippet(content: string, max = 240): string {
  const s = content.replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return s.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

/**
 * Retrieval-only (không LLM). Dùng cho debug hoặc UI "search notebook".
 */
export async function retrieveTopK(
  notebookId: string,
  question: string,
  k = 5,
): Promise<RagSourceHit[]> {
  const qVec = await embedOne(question, 'query');
  const chunks = await prisma.notebookChunk.findMany({
    where: { notebookId },
    include: { source: { select: { id: true, title: true } } },
  });
  const scored = chunks
    .map((c) => {
      let vec: number[] | null = null;
      try {
        vec = JSON.parse(c.embedding) as number[];
      } catch {
        vec = null;
      }
      return {
        chunk: c,
        score: vec ? cosineSimilarity(qVec, vec) : -1,
      };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, k));

  return scored.map((s) => ({
    sourceId: s.chunk.sourceId,
    sourceTitle: s.chunk.source.title,
    page: s.chunk.page ?? null,
    snippet: toSnippet(s.chunk.content),
    score: Number(s.score.toFixed(4)),
  }));
}

/**
 * Full RAG. Trả về `{ answer, sources, tier, model, stagePrompt }`.
 * Nếu notebook rỗng → fallback về plain chat (không context), sources = [].
 */
export async function ragAnswer(
  notebookId: string,
  question: string,
  opts: RagOpts = {},
): Promise<RagResult> {
  const k = Math.max(1, Math.min(opts.topK ?? 5, 12));
  const stagePrompt = chatSystemPromptFor(opts.stage);

  // 1. Retrieve
  let hits: RagSourceHit[] = [];
  try {
    hits = await retrieveTopK(notebookId, question, k);
  } catch (err) {
    if (err instanceof NoEmbedProviderError) {
      // Không có key embed → không retrieve được, nhưng vẫn trả lời không context.
      hits = [];
    } else {
      throw err;
    }
  }

  // 2. Build system prompt = stage prompt + RAG context block
  let systemPrompt = stagePrompt;
  if (hits.length > 0) {
    const ctxBlock = hits
      .map(
        (h, i) =>
          `[${i + 1}] Nguồn: "${h.sourceTitle}"${h.page ? ` (trang ${h.page})` : ''}\n${h.snippet}`,
      )
      .join('\n\n');
    systemPrompt =
      stagePrompt +
      '\n\n' +
      '════ TÀI LIỆU DỰ ÁN (đọc trước khi trả lời) ════\n' +
      ctxBlock +
      '\n\n' +
      '⚑ Luật trả lời:\n' +
      '- Ưu tiên dùng thông tin từ TÀI LIỆU DỰ ÁN ở trên.\n' +
      '- Trích nguồn bằng dấu [số] khớp với đoạn (vd "…theo [1]"). KHÔNG bịa số ngoài phạm vi trên.\n' +
      '- Nếu tài liệu không đủ để trả lời, nói rõ "Tài liệu dự án chưa đề cập" trước khi đưa hiểu biết chung.';
  }

  // 3. LLM
  try {
    const r = await completeTextTiered(question, systemPrompt, { maxTokens: 600 });
    return {
      answer: r.text.trim(),
      sources: hits,
      tier: r.tier,
      model: r.model,
      stagePrompt,
    };
  } catch (err) {
    if (err instanceof NoTextProviderError) {
      return {
        answer: '⚠️ Chưa cấu hình AI (thiếu NVIDIA_API_KEY và không tìm thấy Ollama local).',
        sources: hits,
        tier: 'none',
        model: 'none',
        stagePrompt,
      };
    }
    if (err instanceof NvidiaFreeExhausted) {
      return {
        answer: '⚠️ AI tạm hết lượt free NVIDIA và không có Ollama local — thử lại sau.',
        sources: hits,
        tier: 'none',
        model: 'none',
        stagePrompt,
      };
    }
    throw err;
  }
}
