import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';

/**
 * app/api/comfyui-image/route.ts — cầu SAME-ORIGIN duy nhất giữa BROWSER và máy render ComfyUI
 * tự-host (`COMFYUI_URL`), thay cho việc trả thẳng `http://127.0.0.1:8188/view?...` cho client.
 *
 * GỐC BỆNH đã đo 20/08: ComfyUI's aiohttp server 403 MỌI request mang header `Origin` (kể cả
 * cùng máy) — không phải thiếu `--enable-cors-header`, đó chỉ là lối vá tạm cho máy dev đơn lẻ,
 * KHÔNG phải hợp đồng sản phẩm (nhiều máy render, nhiều origin deploy, không thể khoá cứng theo
 * flag khởi động của một tiến trình). Kiến trúc đúng: BROWSER → API cùng origin với IF → ComfyUI
 * (server-to-server, không có Origin nên không đụng 403 — đã xác nhận bằng curl).
 *
 * ⭐ KHÔNG tái dùng `app/api/stock-photos/proxy` — route đó CHẶN host nội bộ (`isPrivateHost`,
 * đúng chức năng chống SSRF cho URL người dùng tự dán). ComfyUI chạy trên 127.0.0.1 CHÍNH LÀ
 * host nội bộ mà route đó cố tình chặn. Route này AN TOÀN HƠN theo cách khác: client KHÔNG được
 * truyền host — chỉ truyền `filename`/`subfolder`/`type` (định danh do CHÍNH ComfyUI sinh ra sau
 * khi chạy xong), host luôn lấy từ `COMFYUL_URL` do SERVER cấu hình. Không có tham số nào cho
 * client tự chọn địa chỉ đích ⇒ không phải một open proxy.
 *
 * `lib/ai/providers/comfyui.ts` `jobStatus()` phát đường dẫn TƯƠNG ĐỐI `/api/comfyui-image?...`
 * thay vì URL tuyệt đối của ComfyUI — trình duyệt tự resolve theo origin của IF, không có bước
 * nào khác phải đổi (node/image UI hiện có đọc `imageUrls[i]` y nguyên, không biết gì đổi).
 */

const MAX_BYTES = 20 * 1024 * 1024;

function comfyuiBase(): string | null {
  const raw = process.env.COMFYUI_URL;
  if (!raw) return null;
  return raw.replace(/\/+$/, '');
}

/** Chỉ nhận tên tệp ComfyUI tự sinh — không dấu `/`, không `..` (chặn path traversal). */
function safeSegment(s: string): boolean {
  return s === '' || (!s.includes('/') && !s.includes('\\') && !s.includes('..'));
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const base = comfyuiBase();
  if (!base) return NextResponse.json({ error: 'COMFYUI_URL chưa cấu hình trên server.' }, { status: 503 });

  const params = new URL(req.url).searchParams;
  const filename = params.get('filename') ?? '';
  const subfolder = params.get('subfolder') ?? '';
  const type = params.get('type') ?? 'output';
  if (!filename || !safeSegment(filename) || !safeSegment(subfolder) || !safeSegment(type)) {
    return NextResponse.json({ error: 'Tham số ảnh không hợp lệ.' }, { status: 400 });
  }

  const upstream = new URL(`${base}/view`);
  upstream.searchParams.set('filename', filename);
  upstream.searchParams.set('subfolder', subfolder);
  upstream.searchParams.set('type', type);

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15_000);
  try {
    // Server → ComfyUI: KHÔNG có header Origin của trình duyệt ở đây (đúng gốc bệnh đã đo) —
    // đây là request thuần server-to-server, giống hệt `fetch` đã dùng ở `jobStatus`/`submitJob`.
    const res = await fetch(upstream.toString(), { signal: ctrl.signal });
    if (!res.ok) return NextResponse.json({ error: `ComfyUI trả HTTP ${res.status}.` }, { status: 502 });
    const ct = (res.headers.get('content-type') ?? 'image/png').toLowerCase();
    if (!ct.startsWith('image/')) return NextResponse.json({ error: 'ComfyUI không trả về ảnh.' }, { status: 502 });

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) return NextResponse.json({ error: 'Ảnh quá lớn (>20MB).' }, { status: 502 });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': ct,
        // Ảnh output ComfyUI bất biến theo (filename,subfolder,type) — cache dài, riêng tư per-session.
        'Cache-Control': 'private, max-age=86400, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Không lấy được ảnh từ máy render ComfyUI.' }, { status: 502 });
  } finally {
    clearTimeout(t);
  }
}
