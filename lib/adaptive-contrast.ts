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
  /** Màu TRUNG BÌNH của vùng (sRGB 0..255) — dùng làm tint kính ~20% (Việc 2, cùng 1 lần đọc). */
  avg?: [number, number, number];
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
    let rs = 0;
    let gs = 0;
    let bs = 0;
    for (let i = 0; i < data.length; i += 4) {
      const l =
        0.2126 * linear(data[i]) + 0.7152 * linear(data[i + 1]) + 0.0722 * linear(data[i + 2]);
      lums.push(l);
      sum += l;
      rs += data[i];
      gs += data[i + 1];
      bs += data[i + 2];
    }
    const mean = sum / lums.length;
    let dev = 0;
    for (const l of lums) dev += Math.abs(l - mean);
    const n = lums.length;

    const reading: ContrastReading = {
      luminance: mean,
      busyness: dev / lums.length,
      avg: [Math.round(rs / n), Math.round(gs / n), Math.round(bs / n)],
    };
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

/* ============================================================================
 * TẦNG 3 — TƯƠNG PHẢN CHỮ TRONG CARD KÍNH (20/07 · login-glass)
 *
 * Vì sao phải thêm: hai tầng trên lo chữ ĐÈ THẲNG lên ảnh (logo, nhãn INTERIORFLOW).
 * Chữ nằm TRONG card kính lỏng là chuyện khác — giữa chữ và ảnh còn 2 lớp nữa
 * (PhotoScrim + màng kính), và card trước đây lấy màu chữ phụ từ bộ biến
 * `--t3/--t4/--t5` vốn là thang XÁM LẠNH dựng cho nền sáng. Trên card kính tối,
 * `rgb(100,100,110)` chỉ đạt 1.12 — chìm nghỉm.
 *
 * Cách chữa: KHÔNG chọn màu bằng mắt nữa. Đo nền → suy ra độ sáng hiệu dụng ngay
 * sau chữ → GIẢI NGƯỢC ra bộ 5 bậc chữ CÙNG MỘT TÔNG (kem ấm hoặc mực ấm), mỗi bậc
 * là màu đã "dẹt" alpha (rgb() đặc) nên hiển thị đúng bằng con số đã tính. Bậc nào
 * mờ quá ngưỡng thì tự kéo lên — phân cấp chỉ được phép NHẠT ĐI TRONG GIỚI HẠN,
 * không bao giờ được phép rơi xuống dưới AA.
 *
 * Khi nền quá sáng đến mức ngay cả kem đặc cũng không đủ 4.5 (ttt-06 là ca xấu nhất),
 * lever thứ hai vào cuộc: một lớp sương mực RẤT CỤC BỘ trong lòng card, đậm ở giữa —
 * nơi có chữ — và tan ở rìa, nên viền/góc card vẫn nhìn xuyên thấy ảnh. Ưu tiên
 * ĐỌC ĐƯỢC trước, nhưng trả giá ở chỗ ít lộ nhất.
 * ========================================================================== */

export type RGB = [number, number, number];

/** Ngưỡng WCAG AA: chữ thường ≥4.5, chữ lớn (≥18px hoặc ≥14px bold) ≥3.0. */
export const AA_NORMAL = 4.5;
export const AA_LARGE = 3.0;

/** Cỡ chữ nhỏ nhất được phép cho nhãn phụ trong card (bỏ hẳn 9.5px). */
export const MIN_LABEL_PX = 11;

const CREAM_RGB_T: RGB = [246, 242, 234];
const INK_RGB_T: RGB = [20, 17, 13];

/** Độ sáng tương đối WCAG của một màu đặc. */
export function relLuminance(rgb: RGB): number {
  return 0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2]);
}

/** Tỉ số tương phản WCAG giữa hai màu đặc — luôn ≥1. */
export function contrastRatio(a: RGB, b: RGB): number {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** Tương phản của một màu đặc so với một NỀN chỉ biết độ sáng (nền phẳng tương đương). */
export function contrastVsLuminance(fg: RGB, bgLuminance: number): number {
  const lf = relLuminance(fg);
  const hi = Math.max(lf, bgLuminance);
  const lo = Math.min(lf, bgLuminance);
  return (hi + 0.05) / (lo + 0.05);
}

/** Đắp `fg` với độ đục `alpha` lên `bg` — đúng phép trộn alpha của trình duyệt (trong sRGB). */
export function blend(fg: RGB, alpha: number, bg: RGB): RGB {
  const a = clamp01(alpha);
  return [
    Math.round(fg[0] * a + bg[0] * (1 - a)),
    Math.round(fg[1] * a + bg[1] * (1 - a)),
    Math.round(fg[2] * a + bg[2] * (1 - a)),
  ];
}

/** sRGB tuyến tính → giá trị kênh 0..255 (nghịch đảo của `linear`). */
function fromLinear(v: number): number {
  const c = clamp01(v);
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(s * 255);
}

/**
 * Một màu XÁM có đúng độ sáng `L` — dùng làm "nền phẳng tương đương" khi ta chỉ đo
 * được độ sáng trung bình chứ không giữ màu. Trộn alpha trên nền xám tương đương cho
 * kết quả sai lệch không đáng kể so với nền màu thật ở dải màu trầm của bộ wallpaper.
 */
export function grayForLuminance(L: number): RGB {
  const c = fromLinear(clamp01(L));
  return [c, c, c];
}

/** `rgb(r,g,b)` — màu ĐẶC, không alpha: hiển thị đúng bằng con số đã tính. */
export function rgbCss(rgb: RGB): string {
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

/**
 * Độ đục NHỎ NHẤT của `fg` trên `bg` để đạt `ratio`. Trả `null` nếu ngay cả alpha 1
 * cũng không đủ (nền quá gần màu chữ → phải hạ nền xuống bằng scrim).
 * Tìm nhị phân 24 vòng: sai số alpha < 1e-7, thừa sức cho 8-bit.
 */
export function minAlphaForRatio(fg: RGB, bg: RGB, ratio: number): number | null {
  if (contrastRatio(blend(fg, 1, bg), bg) < ratio) return null;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (contrastRatio(blend(fg, mid, bg), bg) >= ratio) hi = mid;
    else lo = mid;
  }
  return hi;
}

/* ---------- Mô hình các lớp giữa ẢNH và CHỮ TRONG CARD ---------- */

/**
 * Các hằng số này PHẢI khớp với `.lq-card` / `PhotoScrim` trong CSS. Đặt ở đây để mô
 * hình tính toán và giao diện dùng CHUNG một bộ số — đổi CSS thì đổi luôn ở đây,
 * test sẽ bắt được nếu lệch.
 */
export const CARD_STACK = {
  /**
   * PhotoScrim + màng kính hợp lại. HIỆU CHỈNH theo số chủ dự án đo TRỰC TIẾP trên màn
   * hình: ttt-05 raw 0.1901 → hiệu dụng 0.152. Ở chuỗi này 0.25 cho ~0.146 (lệch <0.01,
   * nghiêng phía an toàn = coi nền hơi tối hơn thực → không phóng đại tương phản kem).
   * Đây KHÔNG phải alpha CSS của PhotoScrim (radial 0.34→0.62) mà là alpha đen TƯƠNG
   * ĐƯƠNG khi gộp cả kính, để một con số suy ra đúng cái mắt thấy.
   */
  photoScrimAlpha: 0.25,
  /**
   * Màng kính `.lq-card` — trắng rất mỏng, trung bình trên toàn mặt card.
   * 21/07 glass-polish: CSS hạ film 0.06/0.03 → 0.04/0.02 và tint 0.20 → 0.14 (card
   * trong hơn). Hằng số hạ 0.055 → 0.045 nhưng CỐ Ý giữ CAO hơn trung bình CSS thật
   * (~0.03): mô hình coi nền SÁNG hơn thực → giải chữ kem đậm hơn cần → nghiêng an toàn.
   */
  glassFilmAlpha: 0.045,
  /**
   * Inner-shadow trắng 20% + (21/07) vệt phản chiếu chéo 115° mới ở ::before —
   * nhích 0.045 → 0.05 để mô hình ôm cả lớp sheen mới (cũng nghiêng phía sáng/an toàn).
   */
  innerGlowAlpha: 0.05,
} as const;

/**
 * Biên an toàn: thiết kế token như thể nền SÁNG hơn mô hình một nhịp. Mô hình đã hiệu
 * chỉnh khớp số đo, nhưng ảnh có chỗ sáng cục bộ + sai số mô hình → cộng 0.02 vào nền
 * khi giải alpha. Hệ quả: tương phản THỰC (tính lại trên nền mô hình) luôn NHỈNH hơn
 * ngưỡng, có đệm cho đời thực.
 */
const DESIGN_LUM_MARGIN = 0.02;

/**
 * Ảnh (độ sáng đo được) → độ sáng NGAY SAU CHỮ trong card, TRƯỚC lớp sương nội bộ.
 * Kiểm chứng: ttt-05 đo thô 0.1901 → mô hình cho ~0.146, khớp số 0.152 chủ dự án đo
 * trực tiếp trên màn hình (lệch < 0.01, nghiêng phía an toàn).
 */
export function cardBackdropLuminance(rawLuminance: number): number {
  const photo = grayForLuminance(clamp01(rawLuminance));
  const afterScrim = blend([0, 0, 0], CARD_STACK.photoScrimAlpha, photo);
  const afterGlass = blend([255, 255, 255], CARD_STACK.glassFilmAlpha, afterScrim);
  const afterGlow = blend([255, 255, 255], CARD_STACK.innerGlowAlpha, afterGlass);
  return relLuminance(afterGlow);
}

/* ---------- Kế hoạch chữ trong card ---------- */

export interface CardTextTokens {
  /** chữ chính (giá trị nhập, tab đang chọn). */
  t1: string;
  /** chữ phụ đậm (nhãn, tiêu đề nhóm). */
  t2: string;
  /** nhãn thường ("Ghi nhớ đăng nhập"). */
  t3: string;
  /** nhãn mờ ("Quên mật khẩu?", tab không chọn, placeholder). */
  t4: string;
  /** nhãn mờ nhất ("HOẶC TIẾP TỤC VỚI"). */
  t5: string;
}

export interface CardTextPlan {
  tone: ContrastTone;
  /** Độ sáng ảnh đo được (chưa qua lớp nào). */
  rawLuminance: number;
  /** Độ sáng hiệu dụng ngay sau chữ, SAU lớp sương nội bộ — nền để tính tương phản. */
  bgLuminance: number;
  /** Độ đục lớp sương nội bộ trong card (0 = không cần, card trong hoàn toàn). */
  scrimAlpha: number;
  /** `background` của lớp sương nội bộ — đậm giữa, tan ở rìa. '' khi không cần. */
  scrim: string;
  tokens: CardTextTokens;
  /** Tương phản thực tế từng bậc — để in bảng kiểm và cho test khẳng định. */
  ratios: Record<keyof CardTextTokens, number>;
  /** Viền hairline / nền hover / nền ô nhập — cùng hệ tông, không xám lạnh. */
  border: string;
  hover: string;
  field: string;
}

/**
 * Thang phân cấp MONG MUỐN (độ đục của màu tông trên nền hiệu dụng). Đây chỉ là
 * NGUYỆN VỌNG thẩm mỹ — mỗi bậc sẽ bị kéo lên nếu không đạt ngưỡng.
 */
const RAMP: Array<[keyof CardTextTokens, number]> = [
  ['t1', 1.0],
  ['t2', 0.9],
  ['t3', 0.82],
  ['t4', 0.74],
  ['t5', 0.68],
];

/**
 * Trần độ sáng nền trong card. Chọn 0.11: kem đặc trên nền này cho 5.4 — dư ~20% so
 * với 4.5, đủ đệm cho sai số mô hình (đo được lệch <0.01) và cho chỗ ảnh sáng cục bộ.
 */
const CARD_BG_CEILING = 0.11;
/** Sàn độ sáng nền khi tone SÁNG (card sữa trên nền linen) — chữ mực cần nền đủ sáng. */
const CARD_BG_FLOOR_LIGHT = 0.55;
/** Trần độ đục sương nội bộ — quá mức này card thành khối đục, phá gu "rất trong". */
const MAX_CARD_SCRIM = 0.42;

export interface CardTextOptions {
  /** Ngưỡng tương phản bắt buộc cho MỌI bậc. Mặc định AA_NORMAL (4.5). */
  ratio?: number;
  /** Ép tone thay vì suy từ độ sáng (vd preset 'linen' luôn sáng). */
  tone?: ContrastTone;
}

/**
 * Đo được độ sáng ảnh → bộ chữ trong card đảm bảo mọi bậc ≥ ngưỡng.
 *
 * @param rawLuminance độ sáng ảnh nền đo bằng `readImageRegion` (0..1). Với nền phẳng
 *   (preset gradient, nền động sinh bằng code) thì truyền thẳng độ sáng đã biết.
 */
export function planCardText(rawLuminance: number, opts: CardTextOptions = {}): CardTextPlan {
  const ratio = opts.ratio ?? AA_NORMAL;
  const raw = clamp01(rawLuminance);
  const tone: ContrastTone = opts.tone ?? (cardBackdropLuminance(raw) > 0.42 ? 'dark' : 'light');
  const isCream = tone === 'light';
  const textRgb = isCream ? CREAM_RGB_T : INK_RGB_T;
  // sương NGƯỢC tông chữ: chữ kem → sương mực; chữ mực → sương kem
  const scrimRgb = isCream ? INK_RGB_T : CREAM_RGB_T;

  const backdrop = isCream
    ? cardBackdropLuminance(raw)
    : // tone sáng: card là màng sữa dày, nền hiệu dụng gần như chỉ còn màu màng.
      // 21/07 glass-polish: CSS hạ màng sữa 0.62/0.48 → 0.55/0.42 → hằng số 0.62 → 0.55
      // (giữ đúng stop ĐẬM nhất; nền mô hình TỐI hơn thực một nhịp = an toàn cho chữ mực).
      relLuminance(blend([255, 255, 255], 0.55, grayForLuminance(raw)));

  // ——— Lever 1: sương nội bộ, chỉ dùng ĐÚNG LƯỢNG CẦN, thường là 0 ———
  let scrimAlpha = 0;
  let bg = grayForLuminance(backdrop);
  const needsScrim = isCream ? backdrop > CARD_BG_CEILING : backdrop < CARD_BG_FLOOR_LIGHT;
  if (needsScrim) {
    const target = isCream ? CARD_BG_CEILING : CARD_BG_FLOOR_LIGHT;
    // tìm alpha nhỏ nhất kéo nền về phía đích
    let lo = 0;
    let hi = MAX_CARD_SCRIM;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      const l = relLuminance(blend(scrimRgb, mid, grayForLuminance(backdrop)));
      if (isCream ? l <= target : l >= target) hi = mid;
      else lo = mid;
    }
    scrimAlpha = hi;
    bg = blend(scrimRgb, scrimAlpha, grayForLuminance(backdrop));
  }
  const bgLuminance = relLuminance(bg);

  // ——— Lever 2: giải ngược từng bậc, bậc nào hụt thì kéo lên ———
  // Giải alpha trên nền "an toàn" = nền mô hình đẩy sáng thêm DESIGN_LUM_MARGIN (chữ
  // kem) / tối bớt (chữ mực), để tương phản thực luôn có đệm trên ngưỡng.
  const designBg = isCream
    ? grayForLuminance(clamp01(bgLuminance + DESIGN_LUM_MARGIN))
    : grayForLuminance(clamp01(bgLuminance - DESIGN_LUM_MARGIN));
  const floor = minAlphaForRatio(textRgb, designBg, ratio);
  const tokens = {} as CardTextTokens;
  const ratios = {} as Record<keyof CardTextTokens, number>;
  for (const [key, wish] of RAMP) {
    // floor === null ⇒ ngay cả màu đặc cũng không đủ (đã kịch trần sương) → dùng đặc,
    // đây là mức tốt nhất còn làm được; test sẽ báo nếu kịch bản này xảy ra thật.
    const alpha = floor === null ? 1 : Math.max(wish, floor);
    const color = blend(textRgb, alpha, designBg);
    tokens[key] = rgbCss(color);
    ratios[key] = Math.round(contrastRatio(color, bg) * 100) / 100;
  }

  // viền / hover / ô nhập: cùng hệ tông, luôn là màu chữ pha rất loãng (không xám lạnh)
  const tRgb = textRgb.join(',');
  return {
    tone,
    rawLuminance: raw,
    bgLuminance,
    scrimAlpha: Math.round(scrimAlpha * 1000) / 1000,
    scrim:
      scrimAlpha > 0.01
        ? `radial-gradient(118% 108% at 50% 50%, rgba(${scrimRgb.join(',')},${scrimAlpha.toFixed(3)}) 0%, rgba(${scrimRgb.join(',')},${(scrimAlpha * 0.9).toFixed(3)}) 58%, rgba(${scrimRgb.join(',')},${(scrimAlpha * 0.42).toFixed(3)}) 100%)`
        : '',
    tokens,
    ratios,
    border: `rgba(${tRgb},${isCream ? 0.2 : 0.18})`,
    hover: `rgba(${tRgb},${isCream ? 0.1 : 0.07})`,
    field: `rgba(${tRgb},${isCream ? 0.06 : 0.5})`,
  };
}
