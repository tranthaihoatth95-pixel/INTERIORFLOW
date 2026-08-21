'use client';

/**
 * lib/render-studio/controlled-edit-apply.ts — phần CHẠM CANVAS của Controlled Edit (Cân trắng).
 * Tách khỏi `controlled-edit.ts` (thuần, chạy được bằng sucrase-node) vì tệp này cần DOM
 * (Image/canvas) — client-only, không test bằng sucrase-node được (đúng khuôn `imaging.ts`).
 *
 * TÁI DÙNG `applyAdjust()` của trình chỉnh ảnh Photo Editor (`lib/photo-editor/imaging.ts`) —
 * KHÔNG viết phép chỉnh màu thứ hai. Chỉ đổi 2 tham số (temperature/tint), phần còn lại của
 * `AdjustParams` giữ nguyên giá trị trung tính (`DEFAULT_ADJUST_PARAMS`).
 */

import { applyAdjust, loadImage, makeCanvas } from '@/lib/photo-editor/imaging';
import { DEFAULT_ADJUST_PARAMS, type AdjustParams } from '@/lib/photo-editor/model';
import type { EditRegion, WhiteBalanceParams } from './controlled-edit';

/**
 * Áp Cân trắng CHỈ trong `region` (toạ độ pixel ảnh gốc) — vùng còn lại giữ NGUYÊN VẸN, không
 * chạm tới. Đây là "controlled" của Controlled Edit: biến đổi tất định, khoanh vùng rõ ràng,
 * không phải máy tự quyết áp toàn ảnh.
 *
 * Trả về dataURL PNG kích thước GIỮ NGUYÊN ảnh gốc (không crop, không resize).
 */
export async function applyWhiteBalanceToRegion(
  srcDataUrl: string,
  region: EditRegion,
  params: WhiteBalanceParams,
): Promise<string> {
  const img = await loadImage(srcDataUrl);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không lấy được context 2D để chỉnh ảnh.');
  ctx.drawImage(img, 0, 0, w, h);

  const rx = Math.max(0, Math.round(region.x));
  const ry = Math.max(0, Math.round(region.y));
  const rw = Math.max(1, Math.min(w - rx, Math.round(region.width)));
  const rh = Math.max(1, Math.min(h - ry, Math.round(region.height)));

  const full: AdjustParams = { ...DEFAULT_ADJUST_PARAMS, temperature: params.temperature, tint: params.tint };
  const patch = ctx.getImageData(rx, ry, rw, rh);
  applyAdjust(patch, full); // mutate tại chỗ — CHỈ vùng này, phần ảnh còn lại không bị đọc/ghi.
  ctx.putImageData(patch, rx, ry);

  return canvas.toDataURL('image/png');
}
