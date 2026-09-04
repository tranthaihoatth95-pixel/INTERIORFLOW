/**
 * lib/smartselect/image-intelligence.ts — LÕI ĐỌC ẢNH THAM KHẢO (thuần, tất định, 0-key).
 *
 * Một ảnh cảm hứng đi qua đây trả về MỘT bản ghi `ImageIntelligence`: không gian · bố cục · gợi ý
 * hình học · trần/tường/sàn · đồ rời tách nền · palette/vật liệu/ánh sáng · độ tin cậy — mỗi
 * trường mang cờ 3 nấc `measured | inferred | verified` (cùng tên đã có ở `lib/distill/types.ts`,
 * không đẻ tên thứ tư) + nguồn truy ngược được.
 *
 * [Đ2] NHÌN VÀO TRONG TRƯỚC — file này KHÔNG có thuật toán thị giác riêng. Nó GHÉP các máy đã có:
 *   · `lib/vision/single-view-metrology.ts` `calibrateFromImage` (3 điểm tụ Manhattan)     — chỉ đọc
 *   · `lib/vision/horizon.ts` `horizonFromCalib`                                             — chỉ đọc
 *   · `lib/render-core/idmask-core.ts` `quantizeIdMap` (median-cut palette)
 *   · `lib/render-core/furniture-extract-core.ts` `extractForeground` (tách nền theo màu viền)
 *   · `lib/gu/inspiration-facets.ts` `extractFacetsFromText` (từ điển VI/EN)
 *
 * LUẬT KHAI THẬT (chốt 15/08 "id trên phối cảnh chỉ phục vụ trình bày, con số đến từ chỗ đo được"):
 *   · `geometry.dimensions` LUÔN `null` — ảnh đơn không có thang đo tuyệt đối; kích thước phải đi
 *     qua neo (`measureObjectTiered`) ở tầng khác, KHÔNG phải ở đây.
 *   · Bề mặt trần/tường KHÔNG có mask thì `available:false` kèm lý do — không vẽ vùng bừa.
 *   · "Sàn" khi chỉ có đường chân trời là VÙNG DƯỚI CHÂN TRỜI (`inferred`), gọi đúng tên như vậy.
 *   · Semantic (không gian/vật liệu/phong cách) chỉ có khi có chữ (tên/tag/caption VLM) — không
 *     có chữ thì để trống, không đoán từ pixel.
 *
 * Ảnh đầu vào là `RgbaImage` (shape của `getImageData()` — không import type DOM, chạy được ở Node
 * để test bằng sucrase-node). Tầng component thu nhỏ ảnh về ≤ 512px trước khi gọi (Hough O(N²)).
 */

import type { RgbaImage, CameraCalib } from '../vision/single-view-metrology';
import { calibrateFromImage } from '../vision/single-view-metrology';
import { horizonFromCalib, type HorizonLine } from '../vision/horizon';
import { quantizeIdMap } from '../render-core/idmask-core';
import { extractForeground } from '../render-core/furniture-extract-core';
import type { TrangThaiNguon } from '../distill/types';
import { extractFacetsFromText, type Facets, type SurfaceKind, SURFACE_KINDS } from '../gu/inspiration-facets';

/* ═══════════════════════════ kiểu kết quả ═══════════════════════════ */

export interface Evidence<T> {
  value: T;
  trangThai: TrangThaiNguon;
  /** 0..1 — độ tin cậy của CHÍNH phép đọc này (không phải xác suất thống kê). */
  confidence: number;
  /** nguồn truy ngược: `pixels:<hàm>` · `vision:<model>` · `text:<tag|name|caption>` · `mask:<ai|user>`. */
  source: string;
}

export interface PaletteSwatch {
  hex: string;
  /** tỉ lệ pixel (0..1). */
  share: number;
}

export interface LightRead {
  key: 'bright' | 'mid' | 'dim';
  temperature: 'warm' | 'neutral' | 'cool';
  /** 0..255 độ sáng trung bình. */
  luminance: number;
  /** độ lệch chuẩn độ sáng (0..~128) — tương phản. */
  contrast: number;
  /** (R−B)/255 trung bình, dương = ấm. */
  warmth: number;
}

export interface CompositionRead {
  aspect: number;
  orientation: 'landscape' | 'portrait' | 'square';
  /** vị trí trọng tâm độ sáng theo lưới 1/3 — gợi ý "điểm nhấn sáng nằm đâu". */
  brightCentroid: { x: 'left' | 'center' | 'right'; y: 'top' | 'middle' | 'bottom'; fx: number; fy: number };
  /** vị trí đường chân trời trung bình (0..1 theo chiều cao) — null nếu chưa hiệu chỉnh. */
  horizonY: number | null;
  horizonBand: 'low' | 'eye-level' | 'high' | null;
}

export interface GeometryRead {
  calibrated: boolean;
  /** độ khớp ràng buộc 3 điểm tụ (0..1) — 0 khi chưa hiệu chỉnh. */
  confidence: number;
  horizon: HorizonLine | null;
  vanishingPoints: number;
  reason: string | null;
  /** LUÔN null ở tầng này — kích thước tuyệt đối cần neo (xem `measureObjectTiered`). */
  dimensions: null;
  note: string;
  trangThai: TrangThaiNguon;
}

export interface RegionEvidence {
  available: boolean;
  /** alpha 1 byte/px (0/255), dài w*h — null khi không có bằng chứng. */
  mask: Uint8Array | null;
  /** tỉ lệ pixel vùng (0..1). */
  coverage: number;
  bbox: { x: number; y: number; w: number; h: number } | null;
  trangThai: TrangThaiNguon;
  confidence: number;
  source: string;
  /** lý do song ngữ khi KHÔNG có bằng chứng (hoặc chú thích khi có). */
  reason: [string, string];
}

export interface SemanticRead {
  facets: Facets;
  trangThai: TrangThaiNguon;
  confidence: number;
  source: string | null;
  /** caption VLM (nếu có) — để hiển thị, không phải dữ liệu cấu trúc. */
  caption: string | null;
}

export interface ImageIntelligence {
  /** kích thước ẢNH GỐC (px) — cổng đầu vào đo "quá nhỏ" trên số này, không trên bản thu nhỏ. */
  width: number;
  height: number;
  /** kích thước bản đã đọc (≤ 480px) — mask/bbox tính theo cỡ này. */
  analyzedWidth: number;
  analyzedHeight: number;
  palette: Evidence<PaletteSwatch[]>;
  light: Evidence<LightRead>;
  composition: Evidence<CompositionRead>;
  geometry: GeometryRead;
  surfaces: Record<SurfaceKind, RegionEvidence>;
  furniture: RegionEvidence & { warnings: string[] };
  semantic: SemanticRead;
  /** 0..1 tổng hợp — dùng cho cổng đầu vào, KHÔNG phải điểm chấm (luật 12.3). */
  overallConfidence: number;
}

export interface VlmRead {
  caption?: string;
  style?: string;
  materials?: string[];
  room?: string;
  /** tên model — ghi vào provenance `vision:<model>`. */
  model: string;
}

export interface AnalyzeOptions {
  /** mask bề mặt do người/SAM cung cấp (Smart Select) — có mask thì bề mặt đó thành `measured`. */
  masks?: Partial<Record<SurfaceKind, Uint8Array>>;
  /** chữ sẵn có: tên ảnh · caption · tag thô — nguồn cho semantic 0-key. */
  text?: string;
  /** kết quả VLM (key-gated, tầng gọi tự lấy qua `/api/vision/caption`). */
  vlm?: VlmRead | null;
  /** tắt Hough (ảnh quá to hoặc chỉ cần palette) — mặc định bật. */
  calibrate?: boolean;
  /** kích thước ảnh GỐC khi `img` là bản thu nhỏ — thiếu thì coi `img` là gốc. */
  originalSize?: { width: number; height: number };
}

/* ═══════════════════════════ hằng số ngưỡng ═══════════════════════════ */

/** Ảnh nhỏ hơn cạnh này không đủ cạnh kiến trúc để dò điểm tụ có nghĩa. */
export const MIN_SIDE_FOR_CALIB = 64;
/** Tỉ lệ foreground chấp nhận là "một món đồ rời" (dưới = nhiễu, trên = cả cảnh). */
export const FG_RATIO_RANGE: [number, number] = [0.02, 0.75];
/** Độ lệch màu viền tối đa để tin tách-nền-theo-màu — cùng ngưỡng cảnh báo của `extractForeground`. */
export const MAX_BG_SPREAD = 60;
/** Vùng dưới chân trời chỉ có nghĩa khi chân trời nằm trong khung (không sát mép). */
export const HORIZON_USABLE_RANGE: [number, number] = [0.12, 0.95];

/* ═══════════════════════════ helpers ═══════════════════════════ */

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function hex(r: number, g: number, b: number): string {
  const h = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function readPalette(img: RgbaImage): Evidence<PaletteSwatch[]> {
  const q = quantizeIdMap(img.data, img.width, img.height, 6);
  const sw = q.palette
    .map((rgb, i) => ({ hex: hex(rgb[0], rgb[1], rgb[2]), share: q.share[i] ?? 0 }))
    .sort((a, b) => b.share - a.share);
  return { value: sw, trangThai: 'measured', confidence: 1, source: 'pixels:quantizeIdMap' };
}

function readLight(img: RgbaImage): Evidence<LightRead> {
  const { data, width, height } = img;
  const n = width * height;
  const stride = Math.max(1, Math.floor(n / 200_000));
  let sum = 0;
  let sumSq = 0;
  let warm = 0;
  let count = 0;
  for (let p = 0; p < n; p += stride) {
    const i = p * 4;
    if ((data[i + 3] ?? 255) < 128) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    sum += l;
    sumSq += l * l;
    warm += r - b;
    count++;
  }
  if (count === 0) {
    return {
      value: { key: 'mid', temperature: 'neutral', luminance: 0, contrast: 0, warmth: 0 },
      trangThai: 'measured',
      confidence: 0,
      source: 'pixels:luminance',
    };
  }
  const mean = sum / count;
  const variance = Math.max(0, sumSq / count - mean * mean);
  const contrast = Math.sqrt(variance);
  const warmth = warm / count / 255;
  return {
    value: {
      key: mean > 170 ? 'bright' : mean < 80 ? 'dim' : 'mid',
      temperature: warmth > 0.06 ? 'warm' : warmth < -0.06 ? 'cool' : 'neutral',
      luminance: mean,
      contrast,
      warmth,
    },
    trangThai: 'measured',
    confidence: 1,
    source: 'pixels:luminance',
  };
}

function readGeometry(img: RgbaImage, enabled: boolean): GeometryRead {
  const note = 'Không có kích thước tuyệt đối — ảnh đơn cần neo (single-view metrology) mới ra số.';
  if (!enabled || Math.min(img.width, img.height) < MIN_SIDE_FOR_CALIB) {
    return {
      calibrated: false,
      confidence: 0,
      horizon: null,
      vanishingPoints: 0,
      reason: enabled ? 'Ảnh quá nhỏ để dò cạnh kiến trúc.' : 'Bỏ qua hiệu chỉnh (tắt).',
      dimensions: null,
      note,
      trangThai: 'inferred',
    };
  }
  const calib = calibrateFromImage(img);
  if ('needsManualScale' in calib) {
    return {
      calibrated: false,
      confidence: 0,
      horizon: null,
      vanishingPoints: 0,
      reason: calib.reason,
      dimensions: null,
      note,
      trangThai: 'inferred',
    };
  }
  const c = calib as CameraCalib;
  return {
    calibrated: true,
    confidence: clamp01(c.confidence),
    horizon: horizonFromCalib(c),
    vanishingPoints: 3,
    reason: null,
    dimensions: null,
    note,
    trangThai: 'measured',
  };
}

function readComposition(img: RgbaImage, light: LightRead, geometry: GeometryRead): Evidence<CompositionRead> {
  const { data, width, height } = img;
  const aspect = width / Math.max(1, height);
  const orientation: CompositionRead['orientation'] = aspect > 1.08 ? 'landscape' : aspect < 0.92 ? 'portrait' : 'square';
  // Trọng tâm độ sáng (đã trừ nền trung bình để không kéo về giữa) — chỉ là số đo, không phải "ý đồ".
  const stride = Math.max(1, Math.floor((width * height) / 100_000));
  let wsum = 0;
  let wx = 0;
  let wy = 0;
  for (let p = 0; p < width * height; p += stride) {
    const i = p * 4;
    const l = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    const w = Math.max(0, l - light.luminance);
    if (w <= 0) continue;
    const x = p % width;
    const y = Math.floor(p / width);
    wsum += w;
    wx += w * x;
    wy += w * y;
  }
  const fx = wsum > 0 ? wx / wsum / Math.max(1, width - 1) : 0.5;
  const fy = wsum > 0 ? wy / wsum / Math.max(1, height - 1) : 0.5;
  const third = (v: number, a: 'left' | 'top', b: 'center' | 'middle', c: 'right' | 'bottom') =>
    v < 1 / 3 ? a : v > 2 / 3 ? c : b;
  const horizonY = geometry.horizon ? (geometry.horizon.y0 + geometry.horizon.y1) / 2 : null;
  const horizonBand: CompositionRead['horizonBand'] =
    horizonY == null ? null : horizonY < 0.38 ? 'high' : horizonY > 0.62 ? 'low' : 'eye-level';
  return {
    value: {
      aspect,
      orientation,
      brightCentroid: {
        x: third(fx, 'left', 'center', 'right') as 'left' | 'center' | 'right',
        y: third(fy, 'top', 'middle', 'bottom') as 'top' | 'middle' | 'bottom',
        fx,
        fy,
      },
      horizonY,
      horizonBand,
    },
    trangThai: 'measured',
    confidence: 1,
    source: 'pixels:brightCentroid+horizon',
  };
}

function bboxOf(mask: Uint8Array, width: number, height: number): { coverage: number; bbox: RegionEvidence['bbox'] } {
  let count = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -1;
  let maxY = -1;
  const w = width || Math.max(1, Math.round(Math.sqrt(mask.length)));
  const h = height || Math.max(1, Math.floor(mask.length / w));
  for (let p = 0; p < mask.length; p++) {
    if (mask[p] < 128) continue;
    count++;
    const x = p % w;
    const y = Math.floor(p / w);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (count === 0) return { coverage: 0, bbox: null };
  return { coverage: count / (w * h), bbox: { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } };
}
function unavailable(reason: [string, string], source = 'none'): RegionEvidence {
  return { available: false, mask: null, coverage: 0, bbox: null, trangThai: 'inferred', confidence: 0, source, reason };
}

function readSurfaces(img: RgbaImage, geometry: GeometryRead, masks: AnalyzeOptions['masks']): Record<SurfaceKind, RegionEvidence> {
  const { width, height } = img;
  const n = width * height;
  const out = {} as Record<SurfaceKind, RegionEvidence>;
  for (const kind of SURFACE_KINDS) {
    const provided = masks?.[kind];
    if (provided && provided.length === n) {
      const { coverage, bbox } = bboxOf(provided, width, height);
      out[kind] =
        coverage > 0.005
          ? {
              available: true,
              mask: provided,
              coverage,
              bbox,
              trangThai: 'measured',
              confidence: 1,
              source: 'mask:provided',
              reason: ['Vùng do người/Smart Select đánh dấu.', 'Region marked by user/Smart Select.'],
            }
          : unavailable(['Mask cung cấp rỗng.', 'Provided mask is empty.'], 'mask:provided');
      continue;
    }
    if (kind === 'floor' && geometry.horizon) {
      const { y0, y1 } = geometry.horizon;
      const mid = (y0 + y1) / 2;
      if (mid >= HORIZON_USABLE_RANGE[0] && mid <= HORIZON_USABLE_RANGE[1]) {
        const mask = new Uint8Array(n);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const hy = (y0 + ((y1 - y0) * x) / Math.max(1, width - 1)) * height;
            if (y > hy) mask[y * width + x] = 255;
          }
        }
        const { coverage, bbox } = bboxOf(mask, width, height);
        out[kind] = {
          available: coverage > 0.02,
          mask,
          coverage,
          bbox,
          trangThai: 'inferred',
          confidence: clamp01(geometry.confidence * 0.6),
          source: 'geometry:horizon',
          reason: [
            'Vùng DƯỚI đường chân trời — gồm cả đồ và chân tường, chưa tách riêng sàn.',
            'Zone BELOW the horizon — includes furniture and lower walls, floor not isolated yet.',
          ],
        };
        continue;
      }
      out[kind] = unavailable(
        ['Đường chân trời sát mép ảnh — vùng sàn không có nghĩa.', 'Horizon sits at the image edge — floor zone is meaningless.'],
        'geometry:horizon',
      );
      continue;
    }
    out[kind] = unavailable(
      kind === 'floor'
        ? ['Chưa dò được đường chân trời — cần mask hoặc ảnh có cạnh kiến trúc rõ.', 'No horizon detected — needs a mask or clearer architectural edges.']
        : ['Cần mask phân vùng (Smart Select) — không suy trần/tường từ pixel trần.', 'Needs a segmentation mask (Smart Select) — ceiling/wall are not guessed from raw pixels.'],
    );
  }
  return out;
}

function readFurniture(img: RgbaImage, textFacets: Facets): RegionEvidence & { warnings: string[] } {
  const { width, height } = img;
  const res = extractForeground(img.data, width, height);
  const n = width * height;
  const mask = new Uint8Array(n);
  for (let p = 0; p < n; p++) mask[p] = res.data[p * 4 + 3] >= 128 ? 255 : 0;
  const { coverage, bbox } = bboxOf(mask, width, height);
  const spreadOk = res.bg.spread <= MAX_BG_SPREAD;
  const ratioOk = coverage >= FG_RATIO_RANGE[0] && coverage <= FG_RATIO_RANGE[1];
  const available = spreadOk && ratioOk && !!bbox;
  const confidence = available ? clamp01(1 - res.bg.spread / MAX_BG_SPREAD) * (textFacets.furniture.length > 0 ? 1 : 0.8) : 0;
  return {
    available,
    mask: available ? mask : null,
    coverage,
    bbox: available ? bbox : null,
    trangThai: 'inferred',
    confidence,
    source: 'pixels:extractForeground',
    reason: available
      ? ['Tách theo màu viền — mép có thể lem, kiểm bằng mắt.', 'Isolated by edge colour — edges may bleed, check visually.']
      : !spreadOk
        ? ['Nền phức tạp (cảnh toàn phòng) — không tách đồ rời bằng màu viền được.', 'Busy background (full room) — furniture cannot be isolated by edge colour.']
        : ['Không có vật thể tách biệt rõ (quá nhỏ hoặc chiếm cả khung).', 'No clearly separated object (too small or fills the frame).'],
    warnings: res.warnings,
  };
}

function readSemantic(text: string | undefined, vlm: VlmRead | null | undefined): SemanticRead {
  const parts: string[] = [];
  if (text) parts.push(text);
  if (vlm) parts.push(vlm.caption ?? '', vlm.style ?? '', vlm.room ?? '', ...(vlm.materials ?? []));
  const joined = parts.filter(Boolean).join(' · ');
  const facets = extractFacetsFromText(joined);
  const any = (Object.keys(facets) as Array<keyof Facets>).some((k) => facets[k].length > 0);
  const source = vlm ? `vision:${vlm.model}` : text ? 'text:name+tags' : null;
  return {
    facets,
    trangThai: 'inferred',
    confidence: any ? (vlm ? 0.7 : 0.5) : 0,
    source: any ? source : null,
    caption: vlm?.caption?.trim() || null,
  };
}

/* ═══════════════════════════ hàm chính ═══════════════════════════ */

export function analyzeImagePixels(img: RgbaImage, opts: AnalyzeOptions = {}): ImageIntelligence {
  const palette = readPalette(img);
  const light = readLight(img);
  const geometry = readGeometry(img, opts.calibrate !== false);
  const composition = readComposition(img, light.value, geometry);
  const semantic = readSemantic(opts.text, opts.vlm);
  const surfaces = readSurfaces(img, geometry, opts.masks);
  const furniture = readFurniture(img, semantic.facets);

  // Tổng hợp: palette/ánh sáng luôn đo được (0.2) · hình học (0.3) · đồ rời/bề mặt (0.2) ·
  // ngữ nghĩa (0.3). Không phải điểm chấm — chỉ để cổng đầu vào phân biệt "đọc được gì".
  const regionScore = Math.max(
    furniture.available ? furniture.confidence : 0,
    ...SURFACE_KINDS.map((k) => (surfaces[k].available ? surfaces[k].confidence : 0)),
  );
  const overallConfidence = clamp01(0.2 + 0.3 * geometry.confidence + 0.2 * regionScore + 0.3 * semantic.confidence);

  return {
    width: opts.originalSize?.width ?? img.width,
    height: opts.originalSize?.height ?? img.height,
    analyzedWidth: img.width,
    analyzedHeight: img.height,
    palette,
    light,
    composition,
    geometry,
    surfaces,
    furniture,
    semantic,
    overallConfidence,
  };
}

/* ═══════════════════════════ bộ lọc hiển thị ═══════════════════════════ */

export type InspirationView = 'original' | 'furniture' | 'bg-removed' | 'ceiling' | 'wall' | 'floor' | 'material';

export interface ViewAvailability {
  id: InspirationView;
  available: boolean;
  label: [string, string];
  reason: [string, string];
  trangThai: TrangThaiNguon;
}

/** Danh sách bộ lọc + có bằng chứng hay không — UI chỉ bật nút khi `available`, nút mờ mang lý do
 * (luật "nút mờ kèm lý do", không có nút giả). */
export function availableViews(r: ImageIntelligence): ViewAvailability[] {
  const sf = (k: SurfaceKind, label: [string, string]): ViewAvailability => ({
    id: k,
    available: r.surfaces[k].available,
    label,
    reason: r.surfaces[k].reason,
    trangThai: r.surfaces[k].trangThai,
  });
  return [
    { id: 'original', available: true, label: ['Ảnh gốc', 'Original'], reason: ['', ''], trangThai: 'measured' },
    {
      id: 'furniture',
      available: r.furniture.available,
      label: ['Chỉ đồ rời', 'Furniture only'],
      reason: r.furniture.reason,
      trangThai: r.furniture.trangThai,
    },
    {
      id: 'bg-removed',
      available: r.furniture.available,
      label: ['Đã cắt nền', 'Background removed'],
      reason: r.furniture.reason,
      trangThai: r.furniture.trangThai,
    },
    sf('ceiling', ['Chỉ trần', 'Ceiling only']),
    sf('wall', ['Chỉ tường', 'Wall only']),
    sf('floor', ['Sàn / vùng dưới chân trời', 'Floor / below-horizon zone']),
    {
      id: 'material',
      available: r.palette.value.length > 0,
      label: ['Vật liệu & màu', 'Material & colour'],
      reason: ['Palette đo từ pixel; vật liệu chỉ có khi có chữ/VLM.', 'Palette measured from pixels; materials only when text/VLM exists.'],
      trangThai: 'measured',
    },
  ];
}

/** Mask (0/255, w*h) cho một bộ lọc — null khi không có bằng chứng hoặc bộ lọc không cần mask. */
export function viewMask(r: ImageIntelligence, view: InspirationView): Uint8Array | null {
  switch (view) {
    case 'furniture':
    case 'bg-removed':
      return r.furniture.available ? r.furniture.mask : null;
    case 'ceiling':
    case 'wall':
    case 'floor':
      return r.surfaces[view].available ? r.surfaces[view].mask : null;
    default:
      return null;
  }
}

/** Bản tóm tắt KHÔNG mask (serialize được, lưu localStorage / gửi sang Thẻ DNA). */
export interface ImageIntelligenceSummary {
  width: number;
  height: number;
  analyzedWidth: number;
  analyzedHeight: number;
  palette: PaletteSwatch[];
  light: LightRead;
  composition: CompositionRead;
  geometry: Omit<GeometryRead, 'horizon'> & { horizonY: number | null };
  surfaces: Record<SurfaceKind, { available: boolean; coverage: number; trangThai: TrangThaiNguon; confidence: number; source: string }>;
  furniture: { available: boolean; coverage: number; trangThai: TrangThaiNguon; confidence: number; source: string };
  semantic: SemanticRead;
  overallConfidence: number;
}

export function summarize(r: ImageIntelligence): ImageIntelligenceSummary {
  const { horizon, ...geoRest } = r.geometry;
  const surfaces = {} as ImageIntelligenceSummary['surfaces'];
  for (const k of SURFACE_KINDS) {
    const s = r.surfaces[k];
    surfaces[k] = { available: s.available, coverage: s.coverage, trangThai: s.trangThai, confidence: s.confidence, source: s.source };
  }
  return {
    width: r.width,
    height: r.height,
    analyzedWidth: r.analyzedWidth,
    analyzedHeight: r.analyzedHeight,
    palette: r.palette.value,
    light: r.light.value,
    composition: r.composition.value,
    geometry: { ...geoRest, horizonY: horizon ? (horizon.y0 + horizon.y1) / 2 : null },
    surfaces,
    furniture: {
      available: r.furniture.available,
      coverage: r.furniture.coverage,
      trangThai: r.furniture.trangThai,
      confidence: r.furniture.confidence,
      source: r.furniture.source,
    },
    semantic: r.semantic,
    overallConfidence: r.overallConfidence,
  };
}
