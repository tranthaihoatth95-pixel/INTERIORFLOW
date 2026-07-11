'use client';

/**
 * Kiểm tra + chuẩn hoá ảnh người dùng nạp vào chặng Render.
 *
 * Vì sao cần: lỡ nạp TIFF nặng (hoặc HEIC/RAW/PSD…) sẽ (1) KHÔNG hiển thị được trên
 * trình duyệt (Chrome không decode TIFF → ảnh vỡ im lặng), (2) base64 phình ~1.37× nhét
 * vào flow → autosave phình, treo/quota, (3) fal/ComfyUI cũng từ chối. → chặn sớm, báo rõ,
 * và với ảnh JPG/PNG/WEBP quá lớn thì tự thu nhỏ để flow nhẹ.
 */

/** Trần dung lượng file nguồn (byte) — trên mức này từ chối, tránh nhét base64 khổng lồ vào flow. */
export const RENDER_MAX_BYTES = 25 * 1024 * 1024; // 25 MB
/** Cạnh dài tối đa giữ lại — lớn hơn sẽ thu nhỏ + nén JPEG cho flow nhẹ. */
export const RENDER_MAX_DIM = 4096;

const OK_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const OK_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);

/** Định dạng ảnh nhưng trình duyệt/nhà render không dùng được — bắt riêng để báo tên rõ. */
const BAD_LABEL: Record<string, string> = {
  tiff: 'TIFF', tif: 'TIFF',
  heic: 'HEIC', heif: 'HEIF',
  bmp: 'BMP',
  psd: 'PSD (Photoshop)',
  svg: 'SVG',
  raw: 'RAW', cr2: 'RAW', cr3: 'RAW', nef: 'RAW', arw: 'RAW', dng: 'RAW', orf: 'RAW', rw2: 'RAW',
};
const BAD_MIME = new Set([
  'image/tiff', 'image/heic', 'image/heif', 'image/bmp', 'image/vnd.adobe.photoshop', 'image/svg+xml',
]);

/** Lỗi nạp ảnh — thông điệp đã tiếng Việt, hiển thị thẳng cho user. */
export class ImageIngestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageIngestError';
  }
}

function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i < 0 ? '' : name.slice(i + 1).toLowerCase();
}

function humanSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new ImageIngestError('Không đọc được file (có thể đang hỏng).'));
    fr.readAsDataURL(file);
  });
}

/** Thu nhỏ + nén JPEG nếu cạnh dài vượt RENDER_MAX_DIM. Ảnh nhỏ giữ nguyên (không nén lại tránh mờ). */
function downscaleIfNeeded(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = Math.max(img.naturalWidth, img.naturalHeight);
      if (!maxDim) {
        reject(new ImageIngestError('Ảnh rỗng hoặc không giải mã được.'));
        return;
      }
      if (maxDim <= RENDER_MAX_DIM) {
        resolve(dataUrl);
        return;
      }
      const k = RENDER_MAX_DIM / maxDim;
      const w = Math.round(img.naturalWidth * k);
      const h = Math.round(img.naturalHeight * k);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new ImageIngestError('Trình duyệt không dựng được canvas để thu nhỏ ảnh.'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () =>
      reject(
        new ImageIngestError(
          'Không giải mã được ảnh — file có thể hỏng hoặc định dạng trình duyệt không đọc được (thử JPG/PNG/WEBP).',
        ),
      );
    img.src = dataUrl;
  });
}

/**
 * Nhận File từ input, trả dataURL sạch để gắn vào node. Ném ImageIngestError (thông điệp
 * tiếng Việt) khi định dạng không hỗ trợ / quá nặng / không decode được.
 */
export async function readRenderImage(file: File): Promise<string> {
  const ext = extOf(file.name);
  const mime = file.type;

  // 1) Chặn định dạng "là ảnh nhưng không dùng được" — báo đúng tên (TIFF/HEIC/RAW/PSD…).
  if (BAD_LABEL[ext] || BAD_MIME.has(mime)) {
    const label = BAD_LABEL[ext] || mime.split('/')[1]?.toUpperCase() || mime;
    throw new ImageIngestError(
      `Định dạng ${label} không render được — hãy xuất sang JPG, PNG hoặc WEBP rồi nạp lại.`,
    );
  }

  // 2) Allowlist (mime rỗng vẫn cho qua nếu đuôi hợp lệ; cả 2 không rõ → từ chối).
  const looksOk = OK_MIME.has(mime) || OK_EXT.has(ext) || (!mime && !ext);
  if (!looksOk) {
    throw new ImageIngestError(
      `Chỉ nhận ảnh JPG · PNG · WEBP cho chặng Render (file “${file.name}”).`,
    );
  }

  // 3) Trần dung lượng — chặn trước khi đọc để không phình bộ nhớ.
  if (file.size > RENDER_MAX_BYTES) {
    throw new ImageIngestError(
      `Ảnh nặng ${humanSize(file.size)} — vượt giới hạn ${humanSize(RENDER_MAX_BYTES)}. Giảm kích thước/độ phân giải rồi nạp lại.`,
    );
  }

  // 4) Decode + thu nhỏ nếu quá lớn (bắt cả PNG dưới trần byte nhưng kích thước khổng lồ).
  const dataUrl = await readAsDataUrl(file);
  return downscaleIfNeeded(dataUrl);
}
