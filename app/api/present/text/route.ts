import { NextResponse } from 'next/server';
import { completeText, nvidiaConfigured, NvidiaFreeExhausted } from '@/lib/ai/providers/nvidia';

/**
 * app/api/present/text — "✨ Tạo content" cho 1 text layer trên slide.
 *
 * Đề xuất nội dung theo VAI TRÒ (title/kicker/body/free) + ngữ cảnh deck (brand/project) +
 * nội dung hiện có. Dùng NVIDIA LLM free (giọng quiet-luxury editorial). "Chỉ báo, không tự
 * tụt": chưa cấu hình key hoặc hết free → trả code để UI hiện khung stub + báo (human-in-loop).
 */
const SYSTEM =
  'Bạn là copywriter của một studio nội thất quiet-luxury, viết tiếng Việt editorial: ' +
  'súc tích, sang, không sến, không sáo rỗng. Trả về ĐÚNG phần chữ được yêu cầu, KHÔNG mở đầu, ' +
  'KHÔNG giải thích, KHÔNG dấu ngoặc kép bao ngoài.';

interface Body {
  role?: 'title' | 'kicker' | 'body' | 'free';
  current?: string;
  brand?: string;
  project?: string;
  /** gợi ý người dùng gõ thêm (nếu có). */
  hint?: string;
}

function buildPrompt(b: Body): string {
  const role = b.role ?? 'free';
  const ctx = [
    b.brand ? `Thương hiệu: ${b.brand}` : '',
    b.project ? `Dự án/chủ đề: ${b.project}` : '',
    b.current?.trim() ? `Nội dung hiện tại (để tinh chỉnh): "${b.current.trim().slice(0, 400)}"` : '',
    b.hint?.trim() ? `Yêu cầu thêm: ${b.hint.trim().slice(0, 200)}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const spec: Record<string, string> = {
    title: 'Viết 1 TIÊU ĐỀ slide ngắn (tối đa ~8 từ), mạnh, gợi hình. Chỉ 1 dòng.',
    kicker:
      'Viết 1 KICKER (nhãn nhỏ trên tiêu đề), 1-3 từ IN HOA gợi chủ đề (vd "CONCEPT 2026").',
    body:
      'Viết 3-4 Ý CHÍNH cho phần thân slide, mỗi ý 1 dòng ngắn (4-9 từ), mỗi ý xuống dòng riêng, ' +
      'KHÔNG đánh số, KHÔNG gạch đầu dòng (app tự thêm).',
    free: 'Viết 1 đoạn chữ ngắn (1-2 câu) phù hợp đặt trên slide trình bày nội thất.',
  };

  return [spec[role], ctx ? `\nNGỮ CẢNH:\n${ctx}` : ''].join('\n').trim();
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!nvidiaConfigured()) {
    return NextResponse.json(
      {
        error: 'Chưa nối NVIDIA (NVIDIA_API_KEY). Tạo key free ở build.nvidia.com rồi thêm vào .env.local.',
        code: 'NVIDIA_NOT_CONFIGURED',
      },
      { status: 503 },
    );
  }
  try {
    const raw = await completeText(buildPrompt(body), SYSTEM);
    // dọn: bỏ ``` và ngoặc kép bao ngoài nếu model lỡ thêm.
    const text = raw
      .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ''))
      .replace(/^["'\s]+|["'\s]+$/g, '')
      .trim();
    return NextResponse.json({ text });
  } catch (err) {
    if (err instanceof NvidiaFreeExhausted) {
      return NextResponse.json(
        { error: 'NVIDIA free đã hết lượt — thử lại sau hoặc đổi nguồn.', code: 'NVIDIA_FREE_EXHAUSTED' },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Lỗi.' }, { status: 502 });
  }
}
