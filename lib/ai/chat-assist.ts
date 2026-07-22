/**
 * lib/ai/chat-assist.ts — logic THUẦN cho "Vitals AI" trên Gallery (app/api/ai-assist-chat).
 * Tách riêng khỏi route để test được mà không cần mock Next.js Request/Response.
 *
 * KHÁC "Chat nhóm" (`ChatMessage`, app/api/chat) — đây là chat 1-người-với-AI để hỏi đáp
 * nhanh/tư vấn nội thất + hướng dẫn dùng app, KHÔNG lưu DB (v1 chỉ giữ trong state client,
 * client gửi kèm lịch sử ngắn mỗi lần gọi).
 */

export type ChatRole = 'user' | 'assistant';
export interface ChatTurn {
  role: ChatRole;
  content: string;
}

/** Giữ tối đa bấy nhiêu lượt gần nhất (kể cả câu hỏi mới) — đủ ngữ cảnh, không phình prompt. */
export const MAX_CHAT_TURNS = 16;
/** Cắt bớt 1 lượt quá dài (người dùng dán cả đoạn văn) — tránh phình token. */
export const MAX_CHAT_MSG_LEN = 4000;

export const CHAT_SYSTEM_PROMPT =
  'Bạn là Vitals — trợ lý AI của InteriorFlow (IF), công cụ vẽ mặt bằng CAD + kiểm tra quy chuẩn nội thất, ' +
  'gồm 3 chặng Drafting CAD (vẽ + kiểm TCVN) · Rendering (ghép ảnh render bằng node) · Presenting (dàn ' +
  'slide trình bày khách), theo gu quiet-luxury của TTT. Vai trò của bạn: (1) tư vấn nội thất nhanh — ' +
  'phong cách, vật liệu, bố cục — súc tích và thực tế; (2) hướng dẫn dùng app khi được hỏi, dựa ĐÚNG mô tả ' +
  'trên, KHÔNG bịa tính năng app không có. Trả lời ngắn gọn, tiếng Việt (trừ khi được hỏi bằng tiếng Anh), ' +
  'giọng điệu tự tin, tiết chế, không sến, không emoji.';

/**
 * System prompt tuỳ CHẶNG — Vitals gọi từ gesture drag-down ở StageSwitcher gửi kèm
 * `stage` để backend chọn prompt "biết mình đang ở đâu". ID nội bộ giữ nguyên
 * `concept/render/present`; `gallery` cho VitalsChatBubble ở ProjectSelect.
 *
 * Giữ cùng bộ khung (danh tính Vitals + tinh thần quiet-luxury + Việt/Anh + KHÔNG
 * emoji) nhưng khoanh vùng chuyên môn theo chặng để câu trả lời tập trung, tối đa
 * ~3 câu.
 */
export type ChatStage = 'concept' | 'render' | 'present' | 'gallery';

const STAGE_BRIEF: Record<ChatStage, string> = {
  concept:
    'Người dùng đang ở chặng DRAFTING CAD. Ưu tiên trả lời về: quy chuẩn TCVN, kỹ thuật vẽ mặt bằng, ' +
    'dossier check (✓/⚠️/✗), layout phòng, kích thước tối thiểu (lối đi/bàn ghế/vệ sinh), tỉ lệ 1:100. ' +
    'Nếu câu hỏi lệch chặng, trả lời ngắn rồi gợi ý về Drafting CAD.',
  render:
    'Người dùng đang ở chặng RENDERING. Ưu tiên trả lời về: materials (đá/gỗ/vải/kim loại), lighting ' +
    '(nguồn sáng chính/phụ/accent, nhiệt độ màu), camera angle (chiều cao mắt, tiêu cự), mood, style ' +
    'photorealism, workflow node canvas ghép ảnh.',
  present:
    'Người dùng đang ở chặng PRESENTING. Ưu tiên trả lời về: brand guideline TTT (cam #F06020 + navy ' +
    '#002850 trên beige #F1ECE3, Archivo + Archivo Expanded, hairline 1px, tracked uppercase), ' +
    'typography, layout slide, cách kể chuyện với khách, dàn trang song ngữ Việt–Anh.',
  gallery:
    'Người dùng đang ở GALLERY (chọn dự án). Trả lời về: workflow, quản lý dự án, chọn chặng phù hợp ' +
    'tiếp theo, tư vấn tổng quan phong cách/vật liệu ở mức bàn phương án.',
};

/** Trả về system prompt hoàn chỉnh cho 1 stage (base prompt + brief chặng + giới hạn 3 câu). */
export function chatSystemPromptFor(stage: ChatStage | undefined): string {
  const s: ChatStage = stage ?? 'gallery';
  return (
    CHAT_SYSTEM_PROMPT +
    '\n\nNGỮ CẢNH CHẶNG: ' +
    STAGE_BRIEF[s] +
    '\n\nGIỚI HẠN: tối đa 3 câu, đi thẳng vào vấn đề, không lan man.'
  );
}

/** Validate `stage` từ payload — không hợp lệ → mặc định 'gallery' (an toàn nhất). */
export function normalizeChatStage(input: unknown): ChatStage {
  if (input === 'concept' || input === 'render' || input === 'present' || input === 'gallery') return input;
  return 'gallery';
}

/**
 * Validate + chuẩn hoá payload `messages` từ client. Trả `null` nếu input không hợp lệ
 * (route → 400). Yêu cầu: mảng khác rỗng, mỗi phần tử có role hợp lệ + content khác rỗng,
 * và LƯỢT CUỐI phải là 'user' (đây là câu hỏi mới cần trả lời).
 */
export function sanitizeChatMessages(input: unknown): ChatTurn[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;

  const cleaned: ChatTurn[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const role = (raw as { role?: unknown }).role;
    const content = (raw as { content?: unknown }).content;
    if (role !== 'user' && role !== 'assistant') continue;
    if (typeof content !== 'string') continue;
    const trimmed = content.trim().slice(0, MAX_CHAT_MSG_LEN);
    if (!trimmed) continue;
    cleaned.push({ role, content: trimmed });
  }

  if (cleaned.length === 0) return null;

  // Giữ N lượt gần nhất — vẫn phải kết thúc bằng 'user' sau khi cắt.
  const tail = cleaned.slice(-MAX_CHAT_TURNS);
  if (tail[tail.length - 1].role !== 'user') return null;

  return tail;
}

/**
 * Gộp lịch sử hội thoại + câu hỏi mới nhất thành 1 prompt cho `completeTextTiered`
 * (hàm này chỉ nhận prompt đơn, không nhận mảng message nhiều vai như OpenAI chat API).
 */
export function buildChatPrompt(messages: ChatTurn[]): string {
  const last = messages[messages.length - 1];
  const history = messages.slice(0, -1);

  const lines: string[] = [];
  if (history.length > 0) {
    lines.push('LỊCH SỬ HỘI THOẠI (gần đây nhất ở dưới):');
    for (const m of history) {
      lines.push(`${m.role === 'user' ? 'Người dùng' : 'Trợ lý'}: ${m.content}`);
    }
    lines.push('');
  }
  lines.push('Trả lời trực tiếp tin nhắn MỚI NHẤT của người dùng dưới đây (dùng lịch sử ở trên làm ngữ cảnh nếu có):');
  lines.push(`Người dùng: ${last.content}`);
  return lines.join('\n');
}
