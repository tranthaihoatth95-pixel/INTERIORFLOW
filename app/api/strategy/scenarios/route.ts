import { NextResponse } from 'next/server';
import { completeText, nvidiaConfigured, NvidiaFreeExhausted } from '@/lib/ai/providers/nvidia';

/**
 * AI Content Strategist — từ đề bài + Q&A + reference → 3 kịch bản content trình khách,
 * theo NGUYÊN TẮC của user: khai thác để hiểu → hiểu để tư duy logic → biện luận để loại
 * phương án dở → ra 1 phương án TỐT NHẤT + 1 phương án PHÂN VÂN + 1 phương án ĐỂ LOẠI.
 * Dùng NVIDIA LLM free. "Chỉ báo, không tự tụt": hết free → code riêng để UI báo.
 */
const SYSTEM =
  'Bạn là giám đốc sáng tạo một studio nội thất quiet-luxury, tư duy chiến lược sắc bén và ' +
  'trung thực. Bạn không nịnh; bạn biện luận để loại bỏ phương án yếu. Trả lời NGẮN, đúng trọng tâm, tiếng Việt.';

function buildPrompt(brief: string, qa: string, refs: string): string {
  return [
    'Dựa trên dữ liệu dự án dưới đây, đề xuất KỊCH BẢN NỘI DUNG để trình bày với khách.',
    'Tuân thủ nguyên tắc tư duy: (1) khai thác dữ liệu để HIỂU đề bài; (2) hiểu để tư duy LOGIC;',
    '(3) BIỆN LUẬN để loại bỏ hướng dở; (4) đưa ra 1 phương án TỐT NHẤT, 1 phương án PHÂN VÂN',
    '(có mạnh có yếu), và 1 phương án ĐỂ LOẠI (giải thích vì sao loại — để khách thấy mình đã cân nhắc).',
    '',
    '### ĐỀ BÀI / INPUT',
    brief || '(chưa cấp)',
    '',
    '### Q&A VỚI KHÁCH/CHỦ ĐẦU TƯ',
    qa || '(chưa có)',
    '',
    '### REFERENCE (ảnh/tư liệu đã nạp — caption·style·vật liệu)',
    refs || '(chưa có reference)',
    '',
    'CHỈ trả về JSON thuần (không ```), đúng cấu trúc:',
    '{"understanding":"<2-3 câu: mình hiểu đề bài & khách muốn gì>",',
    '"scenarios":[',
    '{"rank":"best","title":"<tên kịch bản>","angle":"<góc tiếp cận 1 câu>","why":"<biện luận vì sao TỐT NHẤT>","outline":["<đề mục slide>","..."]},',
    '{"rank":"uncertain","title":"...","angle":"...","why":"<vì sao PHÂN VÂN: mạnh gì, rủi ro gì>","outline":["..."]},',
    '{"rank":"reject","title":"...","angle":"...","why":"<vì sao ĐỂ LOẠI>","outline":["..."]}',
    ']}',
  ].join('\n');
}

export async function POST(req: Request) {
  const { brief, qa, references } = (await req.json().catch(() => ({}))) as {
    brief?: string; qa?: string; references?: unknown[];
  };
  if (!nvidiaConfigured()) {
    return NextResponse.json(
      { error: 'Chưa nối NVIDIA (NVIDIA_API_KEY). Tạo key free ở build.nvidia.com.', code: 'NVIDIA_NOT_CONFIGURED' },
      { status: 503 },
    );
  }
  const refText = Array.isArray(references)
    ? references
        .map((r) => {
          const a = r as { name?: string; caption?: string; tags?: string[]; usage?: string };
          return `- ${a.name ?? ''}: ${a.caption ?? ''}${a.tags?.length ? ` [${a.tags.join(', ')}]` : ''}${a.usage ? ` (${a.usage})` : ''}`;
        })
        .join('\n')
        .slice(0, 4000)
    : '';
  try {
    const raw = await completeText(buildPrompt(String(brief ?? ''), String(qa ?? ''), refText), SYSTEM);
    const m = raw.match(/\{[\s\S]*\}/);
    let data: unknown;
    try { data = JSON.parse(m ? m[0] : raw); } catch { data = { understanding: raw.slice(0, 500), scenarios: [] }; }
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof NvidiaFreeExhausted) {
      return NextResponse.json(
        { error: 'NVIDIA free đã hết lượt — đổi nguồn thủ công.', code: 'NVIDIA_FREE_EXHAUSTED' },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Lỗi.' }, { status: 502 });
  }
}
