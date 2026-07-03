import { NextResponse } from 'next/server';
import { falConfigured } from '@/lib/ai/providers/fal';

export async function GET() {
  return NextResponse.json({ fal: falConfigured() });
}
