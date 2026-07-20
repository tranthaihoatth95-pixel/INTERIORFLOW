import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { completeTextTiered, NvidiaFreeExhausted, NoTextProviderError } from '@/lib/ai/text-tier';

/**
 * app/api/present/text — "✨ Tạo content" cho 1 text layer trên slide.
 *
 * Đề xuất nội dung theo VAI TRÒ (title/kicker/body/free) + ngữ cảnh deck (brand/project) +
 * nội dung hiện có. Giọng quiet-luxury editorial. Chọn tầng: Cloud (NVIDIA free) → Ollama local
 * → (không tầng nào → UI hiện khung stub, human-in-loop). Kết quả kèm `_tier`/`_model` để badge.
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
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Body;
  try {
    const r = await completeTextTiered(buildPrompt(body), SYSTEM);
    // dọn: bỏ ``` và ngoặc kép bao ngoài nếu model lỡ thêm.
    const text = r.text
      .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ''))
      .replace(/^["'\s]+|["'\s]+$/g, '')
      .trim();
    return NextResponse.json({ text, _tier: r.tier, _model: r.model });
  } catch (err) {
    if (err instanceof NoTextProviderError) {
      return NextResponse.json(
        {
          error:
            'Chưa có nguồn AI chữ: thêm NVIDIA_API_KEY (build.nvidia.com) hoặc chạy Ollama local (ollama serve).',
          code: 'NO_TEXT_PROVIDER',
        },
        { status: 503 },
      );
    }
    if (err instanceof NvidiaFreeExhausted) {
      return NextResponse.json(
        { error: 'NVIDIA free đã hết lượt và không thấy Ollama local — thử lại sau hoặc bật Ollama.', code: 'NVIDIA_FREE_EXHAUSTED' },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Lỗi.' }, { status: 502 });
  }
}
