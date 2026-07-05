'use client';
/**
 * SD-portable chạy client-side bằng WebGPU (engine 'sd' + runtime 'webgpu' của oneAI).
 * Chạy THẲNG trên thiết bị (Mac M/iPad/Snapdragon) — 0 cài đặt, không rời máy.
 *
 * SEAM (05/07): mới có detection + điểm rẽ. Pipeline model thật (SD-Turbo/SDXL-Turbo ONNX
 * qua WebGPU, tải model ~1–2GB, cache) là CHUNK SAU. Hiện `webgpuGenerate` ném WebGpuNotReady
 * để registry tự fallback sang mock — không lỗi, không giả vờ đã chạy AI.
 */
import type { AiTask } from '@/lib/ai/models';

export function webgpuAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

export class WebGpuNotReady extends Error {}

/** Sinh ảnh SD trong trình duyệt. STUB: chưa nạp model → luôn ném (registry mock). */
export async function webgpuGenerate(
  _task: AiTask,
  _input: Record<string, unknown>,
  _onProgress: (p: number) => void,
): Promise<string[]> {
  if (!webgpuAvailable()) {
    throw new WebGpuNotReady('Thiết bị không hỗ trợ WebGPU — đổi runtime "Server SD" hoặc mức AI khác.');
  }
  // TODO(chunk sau): nạp SD-Turbo ONNX + chạy pipeline WebGPU, trả data-URI PNG.
  throw new WebGpuNotReady('WEBGPU_PENDING');
}
