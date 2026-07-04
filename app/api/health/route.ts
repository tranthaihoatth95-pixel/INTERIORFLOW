import { NextResponse } from 'next/server';
import { falConfigured } from '@/lib/ai/providers/fal';
import { comfyuiConfigured } from '@/lib/ai/providers/comfyui';

export async function GET() {
  // `fal` giữ lại cho tương thích cũ; thêm map provider cho núm AI-tier.
  const fal = falConfigured();
  const comfyui = comfyuiConfigured();
  return NextResponse.json({ fal, comfyui, providers: { fal, comfyui } });
}
