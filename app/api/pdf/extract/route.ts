import { NextResponse } from 'next/server';
import { extractText, getDocumentProxy } from 'unpdf';

// Bóc chữ PDF (đề bài/hồ sơ dự án) để AI đọc được. Chạy Node (unpdf, không cần native deps).
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Thiếu file PDF.' }, { status: 400 });
  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buf);
    const { text, totalPages } = await extractText(pdf, { mergePages: true });
    const clean = String(text).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    return NextResponse.json({ text: clean.slice(0, 20000), pages: totalPages, truncated: clean.length > 20000 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Không đọc được PDF.' }, { status: 502 });
  }
}
