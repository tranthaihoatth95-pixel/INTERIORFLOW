/**
 * app/api/comments/route.ts — Lưu GÓP Ý của user (bấm vào giao diện để comment).
 *
 * Ghi ra file JSON ở gốc dự án (`comments-review.json`) để Claude đọc trực tiếp bằng
 * công cụ file — không cần DB. Dùng cho vòng review app + chặng Present.
 *   GET    → toàn bộ góp ý
 *   POST   → thêm 1 góp ý {text, x, y, route, stage, elementHint}
 *   DELETE → xoá 1 (?id=) hoặc tất cả (?all=1)
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const FILE = path.join(process.cwd(), 'comments-review.json');

interface Comment {
  id: string;
  text: string;
  x: number; // % ngang của viewport khi bấm
  y: number; // % dọc
  route: string;
  stage?: string;
  elementHint?: string;
  ts: number;
}

async function readAll(): Promise<Comment[]> {
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    return JSON.parse(raw) as Comment[];
  } catch {
    return [];
  }
}

async function writeAll(list: Comment[]): Promise<void> {
  await fs.writeFile(FILE, JSON.stringify(list, null, 2), 'utf8');
}

export async function GET() {
  return NextResponse.json({ comments: await readAll() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? '').trim();
  if (!text) return NextResponse.json({ error: 'Trống' }, { status: 400 });
  const list = await readAll();
  const c: Comment = {
    id: `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    text,
    x: Number(body.x ?? 50),
    y: Number(body.y ?? 50),
    route: String(body.route ?? '/'),
    stage: body.stage ? String(body.stage) : undefined,
    elementHint: body.elementHint ? String(body.elementHint).slice(0, 160) : undefined,
    ts: Date.now(),
  };
  list.push(c);
  await writeAll(list);
  return NextResponse.json({ ok: true, comment: c, count: list.length });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get('all')) {
    await writeAll([]);
    return NextResponse.json({ ok: true, count: 0 });
  }
  const id = url.searchParams.get('id');
  const list = (await readAll()).filter((c) => c.id !== id);
  await writeAll(list);
  return NextResponse.json({ ok: true, count: list.length });
}
