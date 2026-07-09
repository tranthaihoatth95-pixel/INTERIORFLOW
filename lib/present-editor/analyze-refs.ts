/**
 * lib/present-editor/analyze-refs.ts — "Đọc" ≤5 ảnh reference → RÚT quy tắc bố cục
 * (góp ý #1 & #12). HEURISTIC LOCAL, không cần VLM: đọc pixel để lấy
 *   - palette (màu trội, k-means nhẹ),
 *   - độ sáng nền (nền sáng/tối) → tone,
 *   - tỉ lệ ảnh (ngang/dọc/vuông) → khung ảnh gợi ý,
 *   - "mật độ mảng" (số vùng tương phản mạnh) → ước lượng min/max ảnh & độ đặc chữ.
 *
 * ĐÂY LÀ XẤP XỈ, đủ để "hiểu gu" và gợi ý — KHÔNG phải phân tích bố cục thật.
 * Chỗ cần nâng cấp bằng VLM (đọc font thật, nhận diện lưới) được đánh dấu TODO(VLM).
 *
 * Chạy client-only (cần canvas). Trả về RuleSet gộp từ mọi ảnh.
 */

export interface RefRuleSet {
  /** palette gộp (tối đa 6 hex) — nạp vào deck.palette / spec. */
  palette: string[];
  /** tone tổng: nền sáng hay tối chiếm ưu thế. */
  tone: 'light' | 'warm' | 'dark';
  /** khung ảnh gợi ý (đa số ảnh ref là ngang/dọc/vuông). */
  imageShape: 'landscape' | 'portrait' | 'square';
  /** số ảnh tối thiểu/tối đa gợi ý cho 1 slide (từ mật độ mảng). */
  minImages: number;
  maxImages: number;
  /** độ đặc chữ ước lượng (nhiều mảng nhỏ → chữ dày). */
  textDensity: 'thưa' | 'vừa' | 'dày';
  /** cỡ font tiêu đề gợi ý (% chiều cao) — nền tối/ảnh lớn → tiêu đề lớn hơn. */
  titleScale: number;
  /** ghi chú người-đọc-được: mỗi dòng 1 điều máy "học". */
  notes: string[];
  /** số ảnh đã đọc. */
  count: number;
}

/** Đọc 1 ảnh (data URI) → thống kê thô. */
interface Stat {
  colors: [number, number, number][]; // mẫu màu
  avgLum: number;
  aspect: number; // w/h
  contrastRegions: number; // ước lượng số vùng tương phản
}

async function analyzeOne(dataUrl: string): Promise<Stat | null> {
  try {
    const img = await loadImg(dataUrl);
    const N = 64; // downscale để đọc nhanh
    const canvas = document.createElement('canvas');
    const ar = img.naturalWidth / Math.max(1, img.naturalHeight);
    const w = ar >= 1 ? N : Math.round(N * ar);
    const h = ar >= 1 ? Math.round(N / ar) : N;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    const colors: [number, number, number][] = [];
    let lumSum = 0;
    const lums: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      colors.push([r, g, b]);
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      lums.push(l);
      lumSum += l;
    }
    const avgLum = lumSum / Math.max(1, lums.length);
    // ước lượng vùng tương phản: đếm điểm lệch xa trung bình (biên/mảng).
    let contrast = 0;
    for (const l of lums) if (Math.abs(l - avgLum) > 55) contrast++;
    const contrastRegions = contrast / Math.max(1, lums.length); // 0..1
    return { colors, avgLum, aspect: ar, contrastRegions };
  } catch {
    return null;
  }
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('img load fail'));
    img.src = src;
  });
}

/** k-means rất nhẹ (few iterations) → k màu trội. */
function quantize(colors: [number, number, number][], k: number): string[] {
  if (!colors.length) return [];
  // khởi tạo tâm cách đều theo bước
  const step = Math.max(1, Math.floor(colors.length / k));
  let centers = Array.from({ length: k }, (_, i) => colors[(i * step) % colors.length]);
  for (let iter = 0; iter < 4; iter++) {
    const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);
    for (const c of colors) {
      let best = 0;
      let bd = Infinity;
      for (let j = 0; j < k; j++) {
        const d =
          (c[0] - centers[j][0]) ** 2 + (c[1] - centers[j][1]) ** 2 + (c[2] - centers[j][2]) ** 2;
        if (d < bd) {
          bd = d;
          best = j;
        }
      }
      sums[best][0] += c[0];
      sums[best][1] += c[1];
      sums[best][2] += c[2];
      sums[best][3] += 1;
    }
    centers = sums.map((s, j) =>
      s[3] ? ([s[0] / s[3], s[1] / s[3], s[2] / s[3]] as [number, number, number]) : centers[j],
    );
  }
  // sắp theo độ sáng để palette có gradient sáng→tối
  return centers
    .sort((a, b) => lum(a) - lum(b))
    .map((c) => rgbToHex(c));
}

function lum(c: [number, number, number]): number {
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function rgbToHex(c: [number, number, number]): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${h(c[0])}${h(c[1])}${h(c[2])}`;
}

/** Rút quy tắc gộp từ ≤5 ảnh reference. */
export async function analyzeReferences(dataUrls: string[]): Promise<RefRuleSet | null> {
  const urls = dataUrls.slice(0, 5);
  const stats = (await Promise.all(urls.map(analyzeOne))).filter(Boolean) as Stat[];
  if (!stats.length) return null;

  const allColors = stats.flatMap((s) => s.colors);
  const palette = quantize(allColors, 6);

  const avgLum = stats.reduce((a, s) => a + s.avgLum, 0) / stats.length;
  const tone: RefRuleSet['tone'] = avgLum < 90 ? 'dark' : avgLum < 165 ? 'warm' : 'light';

  // khung ảnh đa số
  const shapes = stats.map((s) => (s.aspect > 1.2 ? 'landscape' : s.aspect < 0.83 ? 'portrait' : 'square'));
  const imageShape = mode(shapes) as RefRuleSet['imageShape'];

  const avgContrast = stats.reduce((a, s) => a + s.contrastRegions, 0) / stats.length;
  // mật độ mảng cao → nhiều ảnh / chữ dày; thấp → tối giản.
  const textDensity: RefRuleSet['textDensity'] =
    avgContrast > 0.34 ? 'dày' : avgContrast > 0.2 ? 'vừa' : 'thưa';
  const minImages = avgContrast > 0.34 ? 2 : 1;
  const maxImages = avgContrast > 0.34 ? 4 : avgContrast > 0.2 ? 3 : 2;
  const titleScale = tone === 'dark' ? 7 : avgContrast < 0.2 ? 6.5 : 5.5;

  const notes = [
    `Palette: ${palette.length} màu trội — nạp vào bảng màu deck.`,
    `Nền chủ đạo: ${tone === 'dark' ? 'tối (tương phản cao)' : tone === 'warm' ? 'ấm/trung tính' : 'sáng, tối giản'}.`,
    `Khung ảnh ưu thế: ${imageShape === 'landscape' ? 'ngang' : imageShape === 'portrait' ? 'dọc' : 'vuông'}.`,
    `Số ảnh/slide gợi ý: ${minImages}–${maxImages} (mật độ mảng ${textDensity}).`,
    `Cỡ tiêu đề gợi ý: ~${titleScale.toFixed(1)}% chiều cao slide.`,
    'TODO(VLM): đọc FONT thật & nhận diện lưới cần mô hình thị giác — hiện xấp xỉ bằng pixel.',
  ];

  return {
    palette,
    tone,
    imageShape,
    minImages,
    maxImages,
    textDensity,
    titleScale,
    notes,
    count: stats.length,
  };
}

function mode<T>(arr: T[]): T {
  const m = new Map<T, number>();
  for (const a of arr) m.set(a, (m.get(a) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0][0];
}
