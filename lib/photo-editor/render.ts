/**
 * lib/photo-editor/render.ts — Composite engine cho trình chỉnh ảnh raster.
 *
 * Ánh xạ PhotoDoc (model phẳng) → 1 canvas kết quả. Mỗi lớp raster vẽ vào 1 canvas
 * offscreen riêng (cache theo src), rồi composite lên canvas chính với opacity + blend
 * + mask. Adjustment layer chỉnh MÀU của "kết quả đang tích luỹ bên dưới" (không phá
 * huỷ), giới hạn theo mask nếu có.
 *
 * Cache: giữ map src(dataURL) → canvas để không decode lại mỗi frame khi chỉ đổi opacity.
 * Chỉ chạy client (đụng canvas). Bất đồng bộ vì decode ảnh.
 */

import type { PhotoDoc, Layer, RasterLayer, AdjustmentLayer } from './model';
import { blendToComposite } from './model';
import { makeCanvas, loadImage, applyAdjust, adjustIsNeutral } from './imaging';

/** Cache decode: dataURL/URL → canvas đã vẽ đúng kích thước gốc ảnh. */
const _rasterCache = new Map<string, HTMLCanvasElement>();
/** Cache mask: dataURL → canvas grayscale. */
const _maskCache = new Map<string, HTMLCanvasElement>();

/** Xoá cache khi cần giải phóng (vd đóng editor). */
export function clearRenderCache(): void {
  _rasterCache.clear();
  _maskCache.clear();
}

async function rasterCanvas(src: string): Promise<HTMLCanvasElement | null> {
  if (!src) return null;
  const hit = _rasterCache.get(src);
  if (hit) return hit;
  try {
    const img = await loadImage(src);
    const c = makeCanvas(img.naturalWidth || img.width, img.naturalHeight || img.height);
    c.getContext('2d')!.drawImage(img, 0, 0);
    _rasterCache.set(src, c);
    return c;
  } catch {
    return null;
  }
}

async function maskCanvas(src: string): Promise<HTMLCanvasElement | null> {
  const hit = _maskCache.get(src);
  if (hit) return hit;
  try {
    const img = await loadImage(src);
    const c = makeCanvas(img.naturalWidth || img.width, img.naturalHeight || img.height);
    c.getContext('2d')!.drawImage(img, 0, 0);
    _maskCache.set(src, c);
    return c;
  } catch {
    return null;
  }
}

/**
 * Composite toàn bộ tài liệu vào `target` (đã set width/height = doc). Nếu không truyền
 * target sẽ tự tạo canvas mới đúng kích thước tài liệu và trả về.
 */
export async function renderDoc(
  doc: PhotoDoc,
  target?: HTMLCanvasElement,
): Promise<HTMLCanvasElement> {
  const out = target ?? makeCanvas(doc.width, doc.height);
  out.width = doc.width;
  out.height = doc.height;
  const ctx = out.getContext('2d')!;
  ctx.clearRect(0, 0, doc.width, doc.height);

  // nền
  if (doc.background && doc.background !== 'transparent') {
    ctx.fillStyle = doc.background;
    ctx.fillRect(0, 0, doc.width, doc.height);
  }

  for (const layer of doc.layers) {
    if (!layer.visible || layer.opacity <= 0) continue;
    if (layer.kind === 'raster') {
      await compositeRaster(ctx, doc, layer);
    } else {
      await compositeAdjustment(ctx, doc, layer);
    }
  }
  return out;
}

/** Composite 1 lớp raster (opacity + blend + mask). */
async function compositeRaster(
  ctx: CanvasRenderingContext2D,
  doc: PhotoDoc,
  layer: RasterLayer,
): Promise<void> {
  const rc = await rasterCanvas(layer.src);
  if (!rc) return;

  // dựng lớp full khung (cùng mask nếu có) trong canvas tạm để áp opacity/blend gọn
  const tmp = makeCanvas(doc.width, doc.height);
  const tctx = tmp.getContext('2d')!;
  // ảnh gốc đã vẽ theo kích thước gốc; ở đây ta scale về khung tài liệu (stretch full)
  tctx.drawImage(rc, 0, 0, doc.width, doc.height);

  if (layer.mask) {
    const mc = await maskCanvas(layer.mask);
    if (mc) {
      tctx.globalCompositeOperation = 'destination-in';
      // dùng luminance mask: vẽ mask, kênh alpha lấy từ độ sáng → cần chuyển.
      // Đơn giản: mask đã lưu ở kênh alpha (PNG trong suốt) => vẽ thẳng.
      tctx.drawImage(mc, 0, 0, doc.width, doc.height);
      tctx.globalCompositeOperation = 'source-over';
    }
  }

  ctx.save();
  ctx.globalAlpha = layer.opacity;
  ctx.globalCompositeOperation = blendToComposite(layer.blend);
  ctx.drawImage(tmp, 0, 0);
  ctx.restore();
}

/**
 * Composite 1 adjustment layer: đọc pixel hiện có của `ctx` (kết quả các lớp dưới),
 * áp params, rồi vẽ đè phần đã chỉnh (giới hạn theo mask + opacity để blend mượt).
 */
async function compositeAdjustment(
  ctx: CanvasRenderingContext2D,
  doc: PhotoDoc,
  layer: AdjustmentLayer,
): Promise<void> {
  if (adjustIsNeutral(layer.params)) return;
  const W = doc.width;
  const H = doc.height;

  // ảnh nguồn = trạng thái hiện tại
  const src = ctx.getImageData(0, 0, W, H);
  // bản đã chỉnh
  const adjusted = new ImageData(new Uint8ClampedArray(src.data), W, H);
  applyAdjust(adjusted, layer.params);

  // Đưa bản chỉnh vào canvas tạm để có thể áp mask + opacity khi vẽ đè.
  const tmp = makeCanvas(W, H);
  const tctx = tmp.getContext('2d')!;
  tctx.putImageData(adjusted, 0, 0);

  if (layer.mask) {
    const mc = await maskCanvas(layer.mask);
    if (mc) {
      tctx.globalCompositeOperation = 'destination-in';
      tctx.drawImage(mc, 0, 0, W, H);
      tctx.globalCompositeOperation = 'source-over';
    }
  }

  ctx.save();
  ctx.globalAlpha = layer.opacity;
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(tmp, 0, 0);
  ctx.restore();
}

/** Render tài liệu ra dataURL để export (PNG giữ trong suốt, JPEG nền phẳng). */
export async function exportDoc(
  doc: PhotoDoc,
  format: 'png' | 'jpeg',
  quality = 0.92,
): Promise<string> {
  const c = await renderDoc(doc);
  if (format === 'jpeg') {
    // JPEG không có alpha → nền trắng
    const flat = makeCanvas(doc.width, doc.height);
    const fx = flat.getContext('2d')!;
    fx.fillStyle = doc.background && doc.background !== 'transparent' ? doc.background : '#ffffff';
    fx.fillRect(0, 0, doc.width, doc.height);
    fx.drawImage(c, 0, 0);
    return flat.toDataURL('image/jpeg', quality);
  }
  return c.toDataURL('image/png');
}

/** Đọc dataURL PNG hiện có của 1 lớp raster (để chỉnh sửa trực tiếp). */
export async function layerToCanvas(
  layer: Layer,
  docW: number,
  docH: number,
): Promise<HTMLCanvasElement> {
  const c = makeCanvas(docW, docH);
  if (layer.kind === 'raster' && layer.src) {
    const rc = await rasterCanvas(layer.src);
    if (rc) c.getContext('2d')!.drawImage(rc, 0, 0, docW, docH);
  }
  return c;
}

/** Vô hiệu cache 1 src khi lớp thay đổi (sau khi vẽ/heal…). */
export function invalidate(src: string): void {
  _rasterCache.delete(src);
  _maskCache.delete(src);
}
