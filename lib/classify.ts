'use client';
/**
 * Auto phân loại ảnh Reference — LỚP LOCAL (0 AI, tức thì khi upload).
 * Trả về 1 trong 6 "kind" + độ tin. Lớp VLM (NVIDIA) sẽ tinh lại ca chưa chắc.
 *
 * 6 kind ↔ field `usage` sẵn có (khỏi đổi schema):
 *   layout(dàn trang)→'layout' · space(không gian)→'ref-render' · furniture→'furniture'
 *   drawing(bản vẽ/sketch/CAD)→'cad' · material(vật liệu)→'material' · other→'brief'
 */

export type RefKind = 'layout' | 'space' | 'furniture' | 'drawing' | 'material' | 'other';

export const KIND_TO_USAGE: Record<RefKind, string> = {
  layout: 'layout',
  space: 'ref-render',
  furniture: 'furniture',
  drawing: 'cad',
  material: 'material',
  other: 'brief',
};

export const KIND_LABEL: Record<RefKind, string> = {
  layout: 'Dàn trang / template',
  space: 'Không gian',
  furniture: 'Furniture / đồ rời',
  drawing: 'Bản vẽ / Sketch / CAD',
  material: 'Vật liệu / Texture',
  other: 'Khác',
};

export interface ClassifyResult {
  kind: RefKind;
  usage: string;
  confidence: number; // 0..1 — thấp = nên nhờ VLM / người duyệt
  features: Record<string, number>;
}

/** Đọc ảnh về canvas nhỏ rồi trích đặc trưng thống kê. */
async function analyze(dataUrl: string, size = 128) {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error('img load fail'));
    im.src = dataUrl;
  });
  const w0 = img.naturalWidth || img.width;
  const h0 = img.naturalHeight || img.height;
  const scale = Math.min(1, size / Math.max(w0, h0));
  const W = Math.max(8, Math.round(w0 * scale));
  const H = Math.max(8, Math.round(h0 * scale));
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, W, H);
  const { data } = ctx.getImageData(0, 0, W, H);

  let white = 0,
    dark = 0,
    satSum = 0,
    n = W * H;
  const lum: number[] = new Array(n);
  const colorKeys = new Map<string, number>();
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const mx = Math.max(r, g, b),
      mn = Math.min(r, g, b);
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    lum[p] = l;
    satSum += mx === 0 ? 0 : (mx - mn) / mx;
    if (r > 240 && g > 240 && b > 240) white++;
    if (l < 70) dark++;
    // palette thô: lượng tử 5 bit/kênh
    colorKeys.set(`${r >> 5}-${g >> 5}-${b >> 5}`, 1);
  }
  // mật độ cạnh: gradient ngang+dọc trên luminance
  let edge = 0;
  for (let y = 1; y < H; y++) {
    for (let x = 1; x < W; x++) {
      const p = y * W + x;
      const gx = Math.abs(lum[p] - lum[p - 1]);
      const gy = Math.abs(lum[p] - lum[p - W]);
      if (gx + gy > 60) edge++;
    }
  }
  // mảng phẳng: tỉ lệ ô 8×8 gần như đồng màu (variance thấp) → đặc trưng dàn trang
  let flatBlocks = 0,
    totalBlocks = 0;
  for (let by = 0; by + 8 <= H; by += 8) {
    for (let bx = 0; bx + 8 <= W; bx += 8) {
      totalBlocks++;
      let mean = 0;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) mean += lum[(by + y) * W + bx + x];
      mean /= 64;
      let v = 0;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const d = lum[(by + y) * W + bx + x] - mean; v += d * d; }
      if (v / 64 < 40) flatBlocks++;
    }
  }
  // nền đồng nhất ở biên (đặc trưng furniture/đồ rời chụp trên nền phẳng)
  const cornerL = [lum[0], lum[W - 1], lum[(H - 1) * W], lum[H * W - 1]];
  const cornerMean = cornerL.reduce((a, b) => a + b, 0) / 4;
  const cornerVar = cornerL.reduce((a, b) => a + (b - cornerMean) ** 2, 0) / 4;

  return {
    whiteRatio: white / n,
    darkRatio: dark / n,
    avgSat: satSum / n,
    edgeDensity: edge / n,
    paletteCount: colorKeys.size,
    flatRatio: totalBlocks ? flatBlocks / totalBlocks : 0,
    cornerUniform: cornerVar < 300 && cornerMean > 150 ? 1 : 0, // nền sáng đồng nhất
    aspect: W / H,
  };
}

/** Phân loại 1 ảnh (dataURL) → kind + usage + độ tin. Không ném lỗi (fallback 'space'). */
export async function classifyImage(dataUrl: string): Promise<ClassifyResult> {
  let f: Awaited<ReturnType<typeof analyze>>;
  try {
    f = await analyze(dataUrl);
  } catch {
    return { kind: 'space', usage: 'ref-render', confidence: 0, features: {} };
  }
  const feats = f as unknown as Record<string, number>;
  const pick = (kind: RefKind, confidence: number): ClassifyResult => ({
    kind,
    usage: KIND_TO_USAGE[kind],
    confidence,
    features: feats,
  });

  // CHỦ Ý: chỉ auto-gán LOCAL cho 2 ca tách CHẮC bằng thống kê; còn lại default 'space'
  // (độ tin thấp) để lớp VLM / người duyệt tinh lại — KHÔNG đoán bừa layout/furniture.

  // 1) BẢN VẼ / SKETCH / CAD (tách chắc): nền trắng nhiều + gần đơn sắc + có nét đen mảnh.
  if (f.whiteRatio > 0.5 && f.avgSat < 0.12 && f.darkRatio > 0.008 && f.darkRatio < 0.45) {
    return pick('drawing', Math.min(0.95, 0.65 + f.whiteRatio * 0.35));
  }
  // 2) VẬT LIỆU / TEXTURE (chặt để khỏi nuốt nhầm): kết cấu RẤT đều, gần như không cạnh mạnh,
  //    palette rất hẹp, không nền trắng, khung ~vuông.
  if (f.edgeDensity < 0.05 && f.paletteCount < 45 && f.whiteRatio < 0.12 && f.aspect > 0.75 && f.aspect < 1.4) {
    return pick('material', 0.6);
  }
  // Còn lại → KHÔNG GIAN (mặc định, độ tin thấp). Layout/furniture cần VLM/người phân biệt
  // (heuristic thống kê không tách nổi — layout nền tối/sáng đều có).
  return pick('space', 0.35);
}
