import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { completeTextTiered, NvidiaFreeExhausted, NoTextProviderError } from '@/lib/ai/text-tier';
import {
  sanitizeChatMessages,
  buildChatPrompt,
  chatSystemPromptFor,
  normalizeChatStage,
  sanitizeBrandContext,
} from '@/lib/ai/chat-assist';
import { sanitizeDocContext } from '@/lib/ai/doc-context';
import { sanitizeViolations } from '@/lib/ai/violations-context';

/**
 * app/api/ai-assist-chat — "Vitals AI" trên Gallery (thanh chat luôn hiện phía trên thẻ dự án):
 * hỏi đáp nhanh/tư vấn nội thất + hướng dẫn dùng app.
 * KHÁC "Chat nhóm" (app/api/chat, ChatMessage — chat người-với-người).
 *
 * v1: KHÔNG lưu DB — client gửi kèm lịch sử hội thoại ngắn mỗi lần gọi, state chỉ sống
 * trong React (mất khi đóng panel/reload, chấp nhận được cho v1).
 *
 * Chọn tầng: Cloud (NVIDIA free) → Ollama local → lỗi typed cho UI hiện banner rõ ràng
 * (ĐÚNG pattern app/api/present/text, app/api/strategy/scenarios — "CHỈ BÁO, KHÔNG tự tụt
 * âm thầm/giả vờ trả lời").
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    messages?: unknown;
    stage?: unknown;
    brand?: unknown;
    docContext?: unknown;
    violations?: unknown;
  };
  const messages = sanitizeChatMessages(body?.messages);
  if (!messages) {
    return NextResponse.json(
      { error: 'Thiếu tin nhắn hợp lệ — cần ít nhất 1 câu hỏi (role "user").' },
      { status: 400 },
    );
  }
  const stage = normalizeChatStage(body?.stage);
  // Brand Kit sống ở localStorage client → client gửi kèm mỗi lượt. Không có = prompt tự nói
  // "dự án chưa có Brand Kit" (VIỆC 4 · docs/SPEC-VITALS-AI.md §2).
  const brand = sanitizeBrandContext(body?.brand);
  // VIỆC 5 (05/08) — trạng thái bản vẽ + kết quả kiểm quy chuẩn. `Doc` sống ở client (CAD store,
  // không qua server) nên client PHẢI gửi kèm bản TÓM TẮT, giống hệt đường đi của `brand` ở trên.
  // Cả hai đi qua sanitize (cắt trần cứng, bỏ mục hỏng) — không tin payload client.
  // Không gửi = 2 khối này rỗng, prompt y hệt trước, không hồi quy.
  const docContext = sanitizeDocContext(body?.docContext);
  const violations = sanitizeViolations(body?.violations);

  try {
    const r = await completeTextTiered(buildChatPrompt(messages), chatSystemPromptFor(stage, brand, docContext, violations), { maxTokens: 500 });
    const reply = r.text.trim();
    return NextResponse.json({ reply, _tier: r.tier, _model: r.model });
  } catch (err) {
    if (err instanceof NoTextProviderError) {
      return NextResponse.json(
        {
          error:
            'Chưa cấu hình AI: thêm NVIDIA_API_KEY (build.nvidia.com) hoặc chạy Ollama local (ollama serve).',
          code: 'NO_TEXT_PROVIDER',
        },
        { status: 503 },
      );
    }
    if (err instanceof NvidiaFreeExhausted) {
      return NextResponse.json(
        {
          error: 'AI tạm hết lượt miễn phí (NVIDIA) và không thấy Ollama local — thử lại sau.',
          code: 'NVIDIA_FREE_EXHAUSTED',
        },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Lỗi.' }, { status: 502 });
  }
}
