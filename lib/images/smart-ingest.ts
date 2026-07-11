'use client';

/**
 * Kéo–thả / nạp ảnh THÔNG MINH: tự chuyển định dạng cho phù hợp môi trường máy (trình duyệt
 * + máy render) NHƯNG giữ gần như mọi thông số gốc (độ phân giải, pixel, alpha).
 *
 * Nguyên tắc:
 *  1) File đã web-safe (JPG/PNG/WEBP/GIF/AVIF/BMP/SVG) + trong ngưỡng → GIỮ NGUYÊN bytes gốc
 *     (không nén lại, 0 mất mát). Chỉ thu nhỏ khi vượt trần cạnh canvas.
 *  2) File không web-safe (TIFF/HEIC/PSD/RAW…): thử decode NATIVE trước (Safari đọc được
 *     TIFF/HEIC) → nếu máy không đọc được thì dùng decoder chuyên biệt (utif cho TIFF, ag-psd
 *     cho PSD) → dựng canvas → xuất PNG (giữ pixel) hoặc JPEG chất lượng cao nếu ảnh lớn.
 *  3) Luôn giữ full-res tới MAX_DIM; vượt thì thu nhỏ đúng tỉ lệ + ghi chú.
 *  4) Ghi lại metadata gốc (định dạng, dung lượng, kích thước) để báo cho user.
 */

/** Cạnh dài tối đa giữ lại (trần canvas an toàn + flow không quá nặng). Vượt → thu nhỏ. */
export const MAX_DIM = 8192;
/** Trần dung lượng nguồn để không OOM khi decode (ảnh kiến trúc rất nặng vẫn nên chặn ngưỡng). */
export const MAX_SOURCE_BYTES = 100 * 1024 * 1024; // 100 MB
/** Trên ngưỡng megapixel này, ảnh KHÔNG alpha xuất JPEG 0.95 (gần như vô tổn thất, flow nhẹ). */
const JPEG_ABOVE_MP = 4;

const WEB_SAFE_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp', 'image/svg+xml',
]);
const WEB_SAFE_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'bmp', 'svg']);
/** Định dạng có thể chứa alpha → giữ PNG để không mất trong suốt. */
const ALPHA_CAPABLE = new Set(['image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'psd']);
const RAW_EXT = new Set(['cr2', 'cr3', 'nef', 'arw', 'dng', 'orf', 'rw2', 'raf', 'srw', 'pef']);

export interface SmartImportMeta {
  originalName: string;
  originalFormat: string;
  originalBytes: number;
  sourceWidth: number;
  sourceHeight: number;
  width: number;
  height: number;
  targetFormat: 'passthrough' | 'png' | 'jpeg';
  converted: boolean;
  downscaled: boolean;
  /** Câu tóm tắt tiếng Việt để hiện toast. */
  note: string;
}

export interface SmartImportResult {
  dataUrl: string;
  meta: SmartImportMeta;
}

export class SmartImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SmartImportError';
  }
}

function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i < 0 ? '' : name.slice(i + 1).toLowerCase();
}
function humanSize(b: number): string {
  return b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;
}
function formatLabel(mime: string, ext: string): string {
  if (mime && mime.startsWith('image/')) return mime.split('/')[1].toUpperCase();
  return (ext || 'file').toUpperCase();
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new SmartImportError('Không đọc được file (có thể đang hỏng).'));
    fr.readAsDataURL(file);
  });
}

function dims(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new SmartImportError('Không giải mã được ảnh.'));
    img.src = dataUrl;
  });
}

/** Đưa canvas về giới hạn cạnh + xuất dataURL theo alpha/độ lớn. */
function encodeCanvas(
  source: HTMLCanvasElement | ImageBitmap,
  sw: number,
  sh: number,
  hasAlpha: boolean,
): { dataUrl: string; w: number; h: number; downscaled: boolean; format: 'png' | 'jpeg' } {
  const scale = Math.min(1, MAX_DIM / Math.max(sw, sh));
  const w = Math.round(sw * scale);
  const h = Math.round(sh * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new SmartImportError('Trình duyệt không dựng được canvas.');
  ctx.drawImage(source as CanvasImageSource, 0, 0, w, h);
  const mp = (w * h) / 1_000_000;
  const useJpeg = !hasAlpha && mp > JPEG_ABOVE_MP;
  const format: 'png' | 'jpeg' = useJpeg ? 'jpeg' : 'png';
  const dataUrl = useJpeg ? canvas.toDataURL('image/jpeg', 0.95) : canvas.toDataURL('image/png');
  return { dataUrl, w, h, downscaled: scale < 1, format };
}

/** Thử decode bằng khả năng gốc của trình duyệt (bao phủ web-safe + TIFF/HEIC trên Safari). */
async function nativeDecode(file: File): Promise<ImageBitmap | null> {
  if (typeof createImageBitmap !== 'function') return null;
  try {
    return await createImageBitmap(file);
  } catch {
    return null;
  }
}

async function decodeTiff(file: File): Promise<{ bmp: ImageData; w: number; h: number }> {
  const mod = (await import('utif')) as unknown as Record<string, unknown>;
  // utif là CommonJS → hàm có thể nằm ở mod hoặc mod.default tuỳ interop.
  const UTIF = (
    typeof mod.decode === 'function' ? mod : (mod.default as Record<string, unknown>)
  ) as {
    decode: (b: ArrayBuffer) => Array<Record<string, number>>;
    decodeImage: (b: ArrayBuffer, ifd: Record<string, number>) => void;
    toRGBA8: (ifd: Record<string, number>) => Uint8Array;
  };
  const buf = await file.arrayBuffer();
  const ifds = UTIF.decode(buf);
  if (!ifds.length) throw new SmartImportError('File TIFF không có trang ảnh nào.');
  const first = ifds[0];
  UTIF.decodeImage(buf, first);
  const rgba = UTIF.toRGBA8(first);
  const w = Number(first.width);
  const h = Number(first.height);
  if (!w || !h) throw new SmartImportError('TIFF không đọc được kích thước.');
  return { bmp: new ImageData(new Uint8ClampedArray(rgba), w, h), w, h };
}

async function decodePsd(file: File): Promise<{ canvas: HTMLCanvasElement; w: number; h: number }> {
  const { readPsd } = await import('ag-psd');
  const psd = readPsd(await file.arrayBuffer());
  if (!psd.canvas) throw new SmartImportError('PSD không dựng được ảnh hợp nhất (composite).');
  return { canvas: psd.canvas, w: psd.width, h: psd.height };
}

/**
 * Nạp 1 File → dataURL sạch + metadata. Ném SmartImportError (tiếng Việt) khi không thể xử.
 */
export async function smartImportImage(file: File): Promise<SmartImportResult> {
  const ext = extOf(file.name);
  const mime = file.type;
  const label = formatLabel(mime, ext);

  if (file.size > MAX_SOURCE_BYTES) {
    throw new SmartImportError(
      `File nặng ${humanSize(file.size)} — vượt trần ${humanSize(MAX_SOURCE_BYTES)}. Giảm dung lượng rồi thử lại.`,
    );
  }
  if (RAW_EXT.has(ext)) {
    throw new SmartImportError(
      `Ảnh RAW (${label}) cần chuyển sang JPG/PNG/TIFF trên máy trước (Lightroom/Preview) — trình duyệt không giải mã RAW.`,
    );
  }

  const isWebSafe = WEB_SAFE_MIME.has(mime) || WEB_SAFE_EXT.has(ext);

  // ── (1) Web-safe: giữ nguyên bytes nếu trong ngưỡng cạnh; chỉ đụng khi quá lớn ──
  if (isWebSafe) {
    const dataUrl = await readAsDataUrl(file);
    // SVG: vector, giữ nguyên, không cần đo pixel.
    if (mime === 'image/svg+xml' || ext === 'svg') {
      return {
        dataUrl,
        meta: {
          originalName: file.name, originalFormat: label, originalBytes: file.size,
          sourceWidth: 0, sourceHeight: 0, width: 0, height: 0,
          targetFormat: 'passthrough', converted: false, downscaled: false,
          note: `Giữ nguyên ${label} (vector).`,
        },
      };
    }
    const { w, h } = await dims(dataUrl);
    if (Math.max(w, h) <= MAX_DIM) {
      return {
        dataUrl,
        meta: {
          originalName: file.name, originalFormat: label, originalBytes: file.size,
          sourceWidth: w, sourceHeight: h, width: w, height: h,
          targetFormat: 'passthrough', converted: false, downscaled: false,
          note: `Giữ nguyên ${label} ${w}×${h}px (không nén lại).`,
        },
      };
    }
    // quá lớn → thu nhỏ (dùng ImageBitmap để vẽ)
    const bmp = await nativeDecode(file);
    if (!bmp) throw new SmartImportError('Ảnh quá lớn và không thu nhỏ được.');
    const enc = encodeCanvas(bmp, w, h, ALPHA_CAPABLE.has(mime));
    bmp.close?.();
    return {
      dataUrl: enc.dataUrl,
      meta: {
        originalName: file.name, originalFormat: label, originalBytes: file.size,
        sourceWidth: w, sourceHeight: h, width: enc.w, height: enc.h,
        targetFormat: enc.format, converted: true, downscaled: true,
        note: `${label} ${w}×${h}px → ${enc.format.toUpperCase()} ${enc.w}×${enc.h}px (thu nhỏ vừa canvas).`,
      },
    };
  }

  // ── (2) Không web-safe: native trước (Safari đọc TIFF/HEIC), rồi decoder chuyên biệt ──
  const native = await nativeDecode(file);
  if (native) {
    const enc = encodeCanvas(native, native.width, native.height, ALPHA_CAPABLE.has(mime));
    const nw = native.width, nh = native.height;
    native.close?.();
    return {
      dataUrl: enc.dataUrl,
      meta: {
        originalName: file.name, originalFormat: label, originalBytes: file.size,
        sourceWidth: nw, sourceHeight: nh, width: enc.w, height: enc.h,
        targetFormat: enc.format, converted: true, downscaled: enc.downscaled,
        note: `${label} → ${enc.format.toUpperCase()} ${enc.w}×${enc.h}px (giữ độ phân giải gốc${enc.downscaled ? ', thu nhỏ vừa canvas' : ''}).`,
      },
    };
  }

  if (mime === 'image/tiff' || ext === 'tiff' || ext === 'tif') {
    const { bmp, w, h } = await decodeTiff(file);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d')!.putImageData(bmp, 0, 0);
    const enc = encodeCanvas(canvas, w, h, false);
    return {
      dataUrl: enc.dataUrl,
      meta: {
        originalName: file.name, originalFormat: 'TIFF', originalBytes: file.size,
        sourceWidth: w, sourceHeight: h, width: enc.w, height: enc.h,
        targetFormat: enc.format, converted: true, downscaled: enc.downscaled,
        note: `TIFF ${w}×${h}px → ${enc.format.toUpperCase()} ${enc.w}×${enc.h}px (giữ pixel gốc${enc.downscaled ? ', thu nhỏ vừa canvas' : ''}).`,
      },
    };
  }

  if (mime === 'image/vnd.adobe.photoshop' || ext === 'psd' || ext === 'psb') {
    const { canvas, w, h } = await decodePsd(file);
    const enc = encodeCanvas(canvas, w, h, true);
    return {
      dataUrl: enc.dataUrl,
      meta: {
        originalName: file.name, originalFormat: 'PSD', originalBytes: file.size,
        sourceWidth: w, sourceHeight: h, width: enc.w, height: enc.h,
        targetFormat: enc.format, converted: true, downscaled: enc.downscaled,
        note: `PSD ${w}×${h}px → PNG ${enc.w}×${enc.h}px (hợp nhất lớp, giữ trong suốt${enc.downscaled ? ', thu nhỏ vừa canvas' : ''}).`,
      },
    };
  }

  if (mime === 'image/heic' || mime === 'image/heif' || ext === 'heic' || ext === 'heif') {
    throw new SmartImportError(
      `Ảnh HEIC/HEIF: trình duyệt này không giải mã được (Safari trên Mac thì được). Mở bằng Preview → xuất JPG/PNG rồi kéo lại.`,
    );
  }

  throw new SmartImportError(
    `Không nhận dạng được “${file.name}” là ảnh dùng được. Hãy dùng JPG · PNG · WEBP · TIFF · PSD.`,
  );
}
