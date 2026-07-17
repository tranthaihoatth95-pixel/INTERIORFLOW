import { NextResponse } from 'next/server';

/**
 * Proxy server-side sang dwg-parse-service (repo/giấy phép RIÊNG — xem docs/LICENSE-NOTES.md).
 * InteriorFlow KHÔNG import package GPL nào để đọc .dwg — chỉ gọi dịch vụ ngoài qua HTTP như 1
 * network service (arms-length), forward bytes file → nhận JSON đã parse → trả thẳng cho client
 * (client tự map JSON→Doc bằng lib/cad/dwg.ts, code đó không GPL).
 *
 * Không check auth (giống /api/pdf/extract) — service tự host local, không phải API ngoài tốn
 * phí cần chặn người vô danh (khác /api/render/nvidia-image); hành vi khớp Worker cũ trước đây
 * cũng không yêu cầu đăng nhập.
 *
 * `DWG_SERVICE_URL` là biến MÔI TRƯỜNG SERVER (KHÔNG prefix NEXT_PUBLIC_ — cùng quy ước các tích
 * hợp khác trong .env.example) trỏ tới dwg-parse-service, VD http://localhost:4500 lúc dev.
 * Chưa cấu hình / service không chạy → 501/502 kèm message rõ ràng, KHÔNG chặn phần còn lại của
 * app (giống pattern /api/render/fbx với Blender).
 */

const MAX_BODY_BYTES = 50 * 1024 * 1024; // 50MB — chặt hơn giới hạn 100MB của service (an toàn kép)

export async function POST(req: Request) {
  const serviceUrl = process.env.DWG_SERVICE_URL;
  if (!serviceUrl) {
    return NextResponse.json(
      {
        error:
          'Chưa cấu hình dịch vụ đọc DWG (DWG_SERVICE_URL trong .env.local) — chạy dwg-parse-service ' +
          '(repo riêng, xem docs/LICENSE-NOTES.md) rồi trỏ URL vào đó. Trong lúc đó dùng "Mở DXF".',
        code: 'DWG_SERVICE_MISSING',
      },
      { status: 501 },
    );
  }

  const buffer = await req.arrayBuffer();
  if (buffer.byteLength === 0) {
    return NextResponse.json({ error: 'File rỗng.' }, { status: 400 });
  }
  if (buffer.byteLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'File quá lớn (>50MB).' }, { status: 413 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${serviceUrl.replace(/\/$/, '')}/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: buffer,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Không kết nối được dwg-parse-service tại ${serviceUrl}: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 },
    );
  }

  const data = await upstream.json().catch(() => null);
  if (!data) {
    return NextResponse.json({ error: `dwg-parse-service trả về không hợp lệ (HTTP ${upstream.status}).` }, { status: 502 });
  }
  // Forward nguyên trạng { ok, doc } hoặc { ok:false, error } — client (lib/cad/dwg.ts) tự đọc.
  return NextResponse.json(data, { status: upstream.ok ? 200 : upstream.status });
}
