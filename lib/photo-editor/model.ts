/**
 * lib/photo-editor/model.ts — MÔ HÌNH DỮ LIỆU của trình chỉnh ảnh raster "Photo".
 *
 * Cùng triết lý với present-editor/model.ts: model PHẲNG, serialize được (JSON) để
 * lưu/khôi phục. Raster của mỗi lớp lưu dạng dataURL (PNG) — composite lại được ở
 * bất kỳ máy nào. Adjustment lớp lưu tham số thuần (số) nên serialize thoải mái.
 *
 * Toạ độ pixel tuyệt đối theo khung tài liệu (document width/height). Mỗi lớp là 1
 * ảnh full-size trùng khung tài liệu (đơn giản hoá composite: không cần offset/lệch).
 *
 * KHÔNG import gì từ store/registry để tránh circular import.
 */

/** Loại lớp. */
export type LayerKind = 'raster' | 'adjustment';

/** Chế độ hoà trộn — map thẳng sang canvas globalCompositeOperation. */
export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'difference'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

/** Danh sách blend hiển thị trong dropdown (kèm nhãn tiếng Việt). */
export const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: 'normal', label: 'Bình thường' },
  { value: 'multiply', label: 'Nhân (tối)' },
  { value: 'screen', label: 'Màn (sáng)' },
  { value: 'overlay', label: 'Phủ' },
  { value: 'soft-light', label: 'Ánh mềm' },
  { value: 'hard-light', label: 'Ánh gắt' },
  { value: 'darken', label: 'Tối hơn' },
  { value: 'lighten', label: 'Sáng hơn' },
  { value: 'color-dodge', label: 'Né sáng' },
  { value: 'color-burn', label: 'Cháy tối' },
  { value: 'difference', label: 'Khác biệt' },
  { value: 'hue', label: 'Sắc độ' },
  { value: 'saturation', label: 'Độ bão hoà' },
  { value: 'color', label: 'Màu' },
  { value: 'luminosity', label: 'Độ sáng' },
];

/** map BlendMode → GlobalCompositeOperation (giống tên, tách ra để type-safe). */
export function blendToComposite(b: BlendMode): GlobalCompositeOperation {
  return b as GlobalCompositeOperation;
}

/* ------------------------------------------------------------------ */
/* Tham số adjustment — thuần số, serialize được.                     */
/* ------------------------------------------------------------------ */

/** Một điểm trên đường cong (0..255 → 0..255). */
export interface CurvePoint {
  x: number;
  y: number;
}

/** Điểm cong mặc định = đường chéo (không đổi). */
export const DEFAULT_CURVE: CurvePoint[] = [
  { x: 0, y: 0 },
  { x: 255, y: 255 },
];

/** Bộ tham số của một adjustment layer. Không dùng field nào = giá trị trung tính. */
export interface AdjustParams {
  /** Độ sáng -100..100 (0 = gốc). */
  brightness: number;
  /** Tương phản -100..100 (0 = gốc). */
  contrast: number;
  /** Bão hoà -100..100 (0 = gốc). */
  saturation: number;
  /** Phơi sáng (exposure) -100..100 (0 = gốc), nhân cấp số nhân. */
  exposure: number;
  /** Cân bằng trắng: nhiệt độ -100 (lạnh) .. 100 (ấm). */
  temperature: number;
  /** Cân bằng trắng: tint -100 (xanh lá) .. 100 (hồng magenta). */
  tint: number;
  /** Levels: điểm đen 0..254 (input). */
  blackPoint: number;
  /** Levels: điểm trắng 1..255 (input). */
  whitePoint: number;
  /** Levels: gamma 0.1..3 (1 = tuyến tính). */
  gamma: number;
  /** HSL theo dải: dịch hue -180..180 (áp toàn ảnh, đơn giản hoá). */
  hueShift: number;
  /** Đường cong luminance (nếu > 2 điểm hoặc lệch chéo → áp LUT). */
  curve: CurvePoint[];
}

export const DEFAULT_ADJUST_PARAMS: AdjustParams = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  temperature: 0,
  tint: 0,
  blackPoint: 0,
  whitePoint: 255,
  gamma: 1,
  hueShift: 0,
  curve: DEFAULT_CURVE.map((p) => ({ ...p })),
};

/** Các preset grade quiet-luxury. */
export interface AdjustPreset {
  id: string;
  name: string;
  params: Partial<AdjustParams>;
}

export const ADJUST_PRESETS: AdjustPreset[] = [
  {
    id: 'relight-warm',
    name: 'Relight ấm',
    // Sáng nhẹ, ấm lên, tăng nhẹ tương phản để chiều sâu.
    params: { brightness: 6, temperature: 22, contrast: 8, saturation: 4, exposure: 5 },
  },
  {
    id: 'quiet-luxury',
    name: 'Quiet-luxury grade',
    // Giảm bão hoà, nâng gamma nhẹ (mềm tối), ấm vừa, tương phản tiết chế.
    params: { saturation: -14, temperature: 10, contrast: 6, gamma: 1.08, brightness: 3 },
  },
  {
    id: 'clean-neutral',
    name: 'Trung tính sạch',
    params: { temperature: -4, contrast: 4, saturation: -4, brightness: 2 },
  },
];

/* ------------------------------------------------------------------ */
/* Lớp + tài liệu.                                                     */
/* ------------------------------------------------------------------ */

interface BaseLayer {
  id: string;
  kind: LayerKind;
  name: string;
  visible: boolean;
  locked: boolean;
  /** 0..1 */
  opacity: number;
  blend: BlendMode;
  /**
   * Mask theo lớp: dataURL grayscale (trắng = hiện, đen = ẩn) trùng khung tài liệu.
   * null = không mask (hiện toàn bộ). Áp bằng destination-in khi composite lớp.
   */
  mask: string | null;
}

/** Lớp raster: 1 ảnh (dataURL PNG) full khung tài liệu. */
export interface RasterLayer extends BaseLayer {
  kind: 'raster';
  /** dataURL PNG. Rỗng = lớp trong suốt (mới tạo để vẽ). */
  src: string;
}

/** Lớp adjustment: chỉnh màu không phá huỷ các lớp DƯỚI nó. */
export interface AdjustmentLayer extends BaseLayer {
  kind: 'adjustment';
  params: AdjustParams;
}

export type Layer = RasterLayer | AdjustmentLayer;

/**
 * Tài liệu = kích thước khung + danh sách lớp.
 * Thứ tự mảng: index 0 = DƯỚI cùng, cuối mảng = TRÊN cùng (giống present-editor).
 */
export interface PhotoDoc {
  id: string;
  name: string;
  width: number;
  height: number;
  /** màu nền canvas (dưới mọi lớp). */
  background: string;
  layers: Layer[];
}

/* ------------------------------------------------------------------ */
/* Helpers tạo id + lớp mặc định (serialize được).                     */
/* ------------------------------------------------------------------ */

let _seq = 0;
/** id ổn định — KHÔNG gọi ở render body (chỉ trong handler/effect) để hydration-safe. */
export function newId(prefix = 'ly'): string {
  _seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${_seq.toString(36)}`;
}

export function makeRasterLayer(src: string, partial: Partial<RasterLayer> = {}): RasterLayer {
  return {
    id: newId('ras'),
    kind: 'raster',
    name: 'Lớp ảnh',
    visible: true,
    locked: false,
    opacity: 1,
    blend: 'normal',
    mask: null,
    src,
    ...partial,
  };
}

export function makeAdjustmentLayer(
  params: Partial<AdjustParams> = {},
  partial: Partial<AdjustmentLayer> = {},
): AdjustmentLayer {
  return {
    id: newId('adj'),
    kind: 'adjustment',
    name: 'Chỉnh màu',
    visible: true,
    locked: false,
    opacity: 1,
    blend: 'normal',
    mask: null,
    params: { ...DEFAULT_ADJUST_PARAMS, ...params, curve: (params.curve ?? DEFAULT_CURVE).map((p) => ({ ...p })) },
    ...partial,
  };
}

/** Tài liệu rỗng theo kích thước cho trước, có 1 lớp nền trắng. */
export function makeEmptyDoc(width = 1280, height = 800): PhotoDoc {
  return {
    id: newId('doc'),
    name: 'Tài liệu mới',
    width,
    height,
    background: '#ffffff',
    layers: [],
  };
}

/** Bản sao sâu serialize được. */
export function cloneDoc(d: PhotoDoc): PhotoDoc {
  return JSON.parse(JSON.stringify(d));
}
