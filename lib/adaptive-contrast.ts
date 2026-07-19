/**
 * lib/adaptive-contrast.ts — TƯƠNG PHẢN THÍCH ỨNG (dùng chung toàn app).
 *
 * Vấn đề: chữ + logo đè lên ảnh nội thất "nền rối" (nhiều chi tiết, chỗ sáng chỗ tối)
 * → khó đọc. Viền đen dày / khối nền đục thì đọc được nhưng XẤU, phá gu quiet-luxury.
 *
 * Giải pháp 2 tầng, cùng một "kế hoạch tương phản" (ContrastPlan):
 *
 *  TẦNG 1 — ĐO NỀN (khi biết src ảnh): vẽ ảnh thu nhỏ 48×48 vào canvas ẩn, đọc
 *  getImageData vùng ngay dưới chữ → tính (a) độ sáng trung bình và (b) "độ rối"
 *  (độ lệch tuyệt đối trung bình của luminance). Nền sáng → chữ chuyển mực; nền tối
 *  → chữ chuyển kem. Nền càng rối / càng lưng chừng → scrim càng đậm.
 *  Chỉ tính MỘT LẦN mỗi src (có cache), không phải mỗi frame.
 *
 *  TẦNG 2 — CSS THUẦN (khi không biết/không đọc được ảnh: CORS, ảnh ngoài, chữ đè
 *  ảnh đã biến đổi): `planFallback()` cho ngay một plan an toàn theo tone mong muốn.
 *  Mọi lỗi đọc pixel đều rơi về đây (try/catch), không bao giờ vỡ giao diện.
 *
 * Ngôn ngữ hình ảnh: KHÔNG stroke đen, KHÔNG khối nền đục. Chỉ
 *   - scrim mềm: gradient toả rất mượt, ôm sát cụm chữ, biên mờ dần về 0;
 *   - text-shadow tinh tế: bán kính lớn + alpha thấp (như bóng đổ của giấy).
 * Màu chữ lấy từ thang greige ấm của TTT (#F6F2EA / #14110D) — không trắng/đen lạnh.
 */

/** Vùng lấy mẫu, theo TỈ LỆ ảnh (0..1). x/y = góc trên-trái. */
export interface SampleRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ContrastReading {
  /** Độ sáng tương đối trung bình của vùng, 0 (đen) … 1 (trắng). */
  luminance: number;
  /** "Độ rối": độ lệch tuyệt đối trung bình của luminance, 0 (phẳng lì) … ~0.5 (rối). */
  busyness: number;
}

export type ContrastTone = 'light' | 'dark';

export interface ContrastPlan {
  /** 'light' = chữ SÁNG (nền tối) · 'dark' = chữ TỐI (nền sáng). */
  tone: ContrastTone;
  /** Màu chữ/logo — gán thẳng vào `color` (logo IF vẽ bằng currentColor nên ăn theo). */
  color: string;
  /** Màu chữ phụ (mờ hơn 1 nấc) — dùng cho nhãn/kicker. */
  colorMuted: string;
  /** `background` của lớp scrim mềm đặt SAU chữ. '' = không cần scrim. */
  scrim: string;
  /** `text-shadow` tinh tế đi kèm. */
  textShadow: string;
  /** `filter` cho logo SVG (drop-shadow cùng tinh thần với textShadow). */
  logoShadow: string;
}

/* ---------- Bảng màu (thang greige ấm TTT — không trắng/đen lạnh) ---------- */

const INK = '#14110d'; // mực ấm, dùng khi nền SÁNG
const CREAM = '#f6f2ea'; // kem ấm, dùng khi nền TỐI
const INK_RGB = '18,15,11';
const CREAM_RGB = '246,242,234';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/* ---------- Đo nền ---------- */

/** sRGB 0..255 → thành phần tuyến tính (để luminance đúng cảm nhận mắt). */
function linear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

const readingCache = new Map<string, ContrastReading>();

function cacheKey(src: string, r: SampleRegion): string {
  // src có thể là dataURL rất dài → chỉ lấy đầu+cuối làm khoá (đủ phân biệt trong 1 phiên)
  const s = src.length > 128 ? `${src.slice(0, 64)}~${src.length}~${src.slice(-32)}` : src;
  return `${s}|${r.x.toFixed(2)},${r.y.toFixed(2)},${r.w.toFixed(2)},${r.h.toFixed(2)}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    // Ảnh cùng origin (/wallpapers, /covers, dataURL) không cần cái này, nhưng ảnh ngoài
    // có CORS header thì nhờ nó mà KHÔNG taint canvas. Ảnh ngoài không có header →
    // getImageData ném SecurityError → bắt ở readImageRegion, rơi về plan CSS.
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

/** Cạnh canvas lấy mẫu — 48px là quá đủ cho một giá trị trung bình, đọc pixel gần như tức thì. */
const SAMPLE_SIZE = 48;

/**
 * Đọc độ sáng + độ rối của một VÙNG ảnh (toạ độ theo tỉ lệ ảnh gốc).
 *
 * Lưu ý: nơi hiển thị thường dùng `object-cover` nên vùng nhìn thấy có thể lệch chút
 * so với vùng ảnh gốc. Ở đây cố tình lấy mẫu vùng RỘNG (vd cả dải đáy, cả khối giữa)
 * nên độ lệch crop không làm đổi giá trị trung bình một cách đáng kể — đổi lại tránh
 * được việc phải biết tỉ lệ khung mọi nơi gọi.
 *
 * Trả `null` nếu không đọc được (canvas bị taint, ảnh hỏng, chạy phía server…).
 */
export async function readImageRegion(
  src: string,
  region: SampleRegion,
): Promise<ContrastReading | null> {
  if (typeof window === 'undefined' || !src) return null;
  const key = cacheKey(src, region);
  const hit = readingCache.get(key);
  if (hit) return hit;

  try {
    const img = await loadImage(src);
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return null;

    const sx = clamp01(region.x) * iw;
    const sy = clamp01(region.y) * ih;
    const sw = Math.max(1, clamp01(region.w) * iw);
    const sh = Math.max(1, clamp01(region.h) * ih);

    const canvas = document.createElement('canvas');
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

    const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const lums: number[] = [];
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const l =
        0.2126 * linear(data[i]) + 0.7152 * linear(data[i + 1]) + 0.0722 * linear(data[i + 2]);
      lums.push(l);
      sum += l;
    }
    const mean = sum / lums.length;
    let dev = 0;
    for (const l of lums) dev += Math.abs(l - mean);

    const reading: ContrastReading = { luminance: mean, busyness: dev / lums.length };
    readingCache.set(key, reading);
    return reading;
  } catch {
    // canvas taint (ảnh ngoài không CORS) / ảnh hỏng → để nơi gọi dùng plan CSS
    return null;
  }
}

/**
 * Gộp một lớp phủ phẳng ĐÃ CÓ SẴN vào số đo.
 *
 * Vì sao cần: nhiều chỗ trong app đã đắp sẵn scrim cố định lên ảnh (vd `PhotoScrim` ở
 * màn login: đen ~0.34–0.62). `readImageRegion` đọc ảnh GỐC, không thấy lớp phủ đó —
 * nếu lấy thẳng số đo ấy đi quyết định tone thì sẽ kết luận "nền sáng" trong khi mắt
 * người đang nhìn thấy một nền đã tối đi nhiều, và chữ sẽ bị đảo sang màu mực trên nền tối.
 *
 * @param overlayLuminance độ sáng lớp phủ (0 = đen, 1 = trắng)
 * @param alpha độ đục lớp phủ 0..1
 */
export function compositeOver(
  reading: ContrastReading,
  overlayLuminance: number,
  alpha: number,
): ContrastReading {
  const a = clamp01(alpha);
  return {
    luminance: reading.luminance * (1 - a) + clamp01(overlayLuminance) * a,
    // lớp phủ cũng làm phẳng bớt chi tiết → nền bớt "rối" đi đúng bằng tỉ lệ đó
    busyness: reading.busyness * (1 - a),
  };
}

/* ---------- Từ số đo → kế hoạch tương phản ---------- */

/**
 * Độ đậm scrim: dày lên khi nền RỐI (busyness cao) hoặc khi nền LƯNG CHỪNG
 * (luminance quanh 0.5 — vùng chữ sáng lẫn chữ tối đều khó đọc).
 * Trần 0.58 để scrim vẫn còn là "màn sương", không thành khối đục.
 */
function scrimStrength(reading: ContrastReading, base: number): number {
  const midness = 1 - Math.abs(reading.luminance - 0.5) * 2; // 0 ở hai cực, 1 ở giữa
  const raw = base + reading.busyness * 1.25 + midness * 0.22;
  return Math.min(0.58, Math.max(base, raw));
}

/** Hình dạng scrim — quyết định gradient bao quanh chữ. */
export type ScrimShape =
  /** cụm chữ đứng giữa một vùng thoáng (logo login) — quầng elip toả đều. */
  | 'halo'
  /** dải chữ nằm ở đáy khung ảnh (caption thẻ dự án) — gradient dựng đứng. */
  | 'bottom'
  /** chip/nhãn nhỏ (A/B ở Render) — nền bo tròn rất mềm. */
  | 'chip';

function scrimCss(tone: ContrastTone, alpha: number, shape: ScrimShape): string {
  // scrim NGƯỢC tone chữ: chữ kem → sương tối; chữ mực → sương sáng.
  const rgb = tone === 'light' ? INK_RGB : CREAM_RGB;
  const a = (k: number) => `rgba(${rgb},${(alpha * k).toFixed(3)})`;
  if (shape === 'bottom') {
    // biên trên tan hẳn về 0 — không có mép ngang lộ ra trên ảnh
    return `linear-gradient(180deg, ${a(0)} 0%, ${a(0.34)} 38%, ${a(0.82)} 72%, ${a(1)} 100%)`;
  }
  if (shape === 'chip') {
    return `radial-gradient(120% 120% at 50% 50%, ${a(1)} 0%, ${a(0.9)} 55%, ${a(0)} 100%)`;
  }
  // halo — elip rộng, tâm đậm nhất, tan dần tuyệt đối ở mép (không thấy đường viền)
  return `radial-gradient(58% 62% at 50% 50%, ${a(1)} 0%, ${a(0.62)} 42%, ${a(0.24)} 68%, ${a(0)} 100%)`;
}

function shadowCss(tone: ContrastTone, alpha: number): string {
  const rgb = tone === 'light' ? INK_RGB : CREAM_RGB;
  // 2 lớp: 1 lớp sát (tách chữ khỏi hạt nhiễu của ảnh) + 1 lớp toả rộng alpha thấp
  // (như bóng đổ mềm) — cả hai đều KHÔNG tạo cảm giác viền.
  return [
    `0 1px 2px rgba(${rgb},${(alpha * 0.5).toFixed(3)})`,
    `0 0 22px rgba(${rgb},${(alpha * 0.42).toFixed(3)})`,
  ].join(', ');
}

function logoShadowCss(tone: ContrastTone, alpha: number): string {
  const rgb = tone === 'light' ? INK_RGB : CREAM_RGB;
  return `drop-shadow(0 1px 2px rgba(${rgb},${(alpha * 0.55).toFixed(3)})) drop-shadow(0 0 16px rgba(${rgb},${(alpha * 0.4).toFixed(3)}))`;
}

function buildPlan(tone: ContrastTone, alpha: number, shape: ScrimShape): ContrastPlan {
  return {
    tone,
    color: tone === 'light' ? CREAM : INK,
    colorMuted: tone === 'light' ? 'rgba(246,242,234,0.72)' : 'rgba(20,17,13,0.68)',
    scrim: alpha > 0.02 ? scrimCss(tone, alpha, shape) : '',
    textShadow: shadowCss(tone, alpha),
    logoShadow: logoShadowCss(tone, alpha),
  };
}

export interface PlanOptions {
  shape?: ScrimShape;
  /** Sàn độ đậm scrim (nền phẳng, dễ đọc vẫn giữ chút sương cho chắc). Mặc định 0.18. */
  baseAlpha?: number;
  /** Ngưỡng đảo tone: luminance vượt ngưỡng → chữ TỐI. Mặc định 0.42. */
  threshold?: number;
}

/**
 * Số đo → kế hoạch. Ngưỡng mặc định 0.42 (thấp hơn 0.5) vì chữ sáng trên nền lưng chừng
 * vẫn đọc tốt hơn chữ tối, nhờ scrim tối cộng thêm.
 */
export function planFromReading(reading: ContrastReading, opts: PlanOptions = {}): ContrastPlan {
  const { shape = 'halo', baseAlpha = 0.18, threshold = 0.42 } = opts;
  const tone: ContrastTone = reading.luminance > threshold ? 'dark' : 'light';
  return buildPlan(tone, scrimStrength(reading, baseAlpha), shape);
}

/**
 * Plan CSS thuần — khi không đo được nền (CORS/ảnh ngoài/chưa load) hoặc khi chỉ biết
 * "chữ đang đè lên ảnh nào đó". `tone` là tone chữ MONG MUỐN (thường suy từ màu chữ
 * hiện có, xem `toneForColor`). Scrim đậm hơn plan đo được một nhịp vì phải phòng
 * trường hợp xấu nhất.
 */
export function planFallback(tone: ContrastTone, opts: PlanOptions = {}): ContrastPlan {
  const { shape = 'halo', baseAlpha = 0.34 } = opts;
  return buildPlan(tone, baseAlpha, shape);
}

/** Suy tone từ một màu chữ đã có (#rgb/#rrggbb/rgb()) — chữ sáng → 'light'. */
export function toneForColor(color: string | undefined): ContrastTone {
  const rgb = parseColor(color);
  if (!rgb) return 'light';
  const l = 0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2]);
  return l > 0.42 ? 'light' : 'dark';
}

/** Parse tối giản: #rgb, #rrggbb, rgb()/rgba(). Không nhận diện được → null. */
export function parseColor(color: string | undefined): [number, number, number] | null {
  if (!color) return null;
  const c = color.trim().toLowerCase();
  if (c.startsWith('#')) {
    const hex = c.slice(1);
    if (hex.length === 3) {
      const [r, g, b] = hex.split('');
      return [parseInt(r + r, 16), parseInt(g + g, 16), parseInt(b + b, 16)];
    }
    if (hex.length === 6 || hex.length === 8) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
    return null;
  }
  const m = c.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const parts = m[1].split(/[,/\s]+/).filter(Boolean).map(Number);
    if (parts.length >= 3 && parts.slice(0, 3).every((n) => Number.isFinite(n))) {
      return [parts[0], parts[1], parts[2]];
    }
  }
  return null;
}

/** Hai khung có giao nhau không (toạ độ % sân khấu) — dùng cho Present: chữ đè ảnh? */
export function framesOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Chỉ dùng trong test — xoá cache số đo. */
export function __clearContrastCache() {
  readingCache.clear();
}
