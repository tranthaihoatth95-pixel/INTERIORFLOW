/**
 * lib/present-editor/standards.ts — CHUẨN ĐỊNH LƯỢNG cho "slide cân đối".
 *
 * Lan can (guardrail) cho layout tự sinh: không trống quá, không chật quá. Mọi số theo
 * % SÂN KHẤU 0..100 (1920×1080 → 1%W=19.2px, 1%H=10.8px). `fontSize` theo %H (5 = 54px).
 *
 * Nguồn: quy ước ngành (12-col grid · 6×6 rule · safe-zone 5% · bento 6–9 ô · whitespace
 * ≥40%/hero ≥60%) quy sang % + đối chiếu ngược diện tích các template thật trong templates.ts.
 * KHÔNG phụ thuộc model — chỉ là dữ liệu, import ở đâu cũng được.
 */

export interface Range {
  min: number;
  max: number;
  ideal?: number;
}

/** Ngân sách cho 1 archetype layout. */
export interface LayoutBudget {
  cells: Range; // số ô lưới — dùng làm TRẦN kẹp khi ảnh mẫu dò ra quá nhiều ô vụn (region-layout)
  images: Range; // số hình
  textBlocks: Range; // số khối text
  imageAreaPct: Range; // % diện tích ảnh trên slide
  whitespacePct: Range; // % khoảng trắng mục tiêu
  bleed?: boolean; // true → bỏ qua ngưỡng "chật quá" (ảnh nền tràn cố ý)
}

export interface DeckStandards {
  stage: { w: number; h: number; pxPerPctW: number; pxPerPctH: number };
  grid: {
    columns: number;
    marginPctW: Range;
    marginPctH: Range;
    gutterPctW: Range;
    spacingStepsPctH: number[]; // bội số 8px quy sang %H
    proximityNearMaxPctH: number;
    proximityFarMinPctH: number;
    snapX: number[]; // đường cột snap khi margin 6% + 12 cột
  };
  type: {
    blocksPerSlide: Range;
    titlePctH: Range;
    titleHeroPctH: Range;
    bodyPctH: Range;
    captionPctH: Range;
    lineHeightBody: Range;
    lineHeightDisplay: Range;
    lineLenChars: Range;
    titleWordsMax: number;
    /** ≤ số từ này → tiêu đề giữ cỡ lớn nhất trong dải; dài hơn thì co dần về min. */
    titleWordsIdeal: number;
    bulletsMax: number;
    wordsPerBulletMax: number;
    bodyWordsMax: number;
    charsPerPctWBody: number; // ước lượng wrap/tràn: ~ký tự trên 1%W ở body
  };
  whitespace: {
    targetPct: Range;
    heroTargetPct: Range;
    tooEmptyAbovePct: number; // whitespace > mốc này = TRỐNG QUÁ
    tooDenseBelowPct: number; // whitespace < mốc này = CHẬT QUÁ
  };
  byLayout: Record<string, LayoutBudget>;
}

const R = (min: number, max: number, ideal?: number): Range => ({ min, max, ...(ideal !== undefined ? { ideal } : {}) });

export const DECK_STANDARDS: DeckStandards = {
  stage: { w: 1920, h: 1080, pxPerPctW: 19.2, pxPerPctH: 10.8 },
  grid: {
    columns: 12,
    marginPctW: R(5, 8, 6),
    marginPctH: R(5, 10, 6),
    gutterPctW: R(1.25, 2.5, 1.75),
    spacingStepsPctH: [0.42, 0.83, 1.25, 1.67, 2.5, 3.33, 4.44, 5.93],
    proximityNearMaxPctH: 1.5,
    proximityFarMinPctH: 4.4,
    snapX: [6, 17, 28, 39, 50, 61, 72, 83, 94],
  },
  type: {
    blocksPerSlide: R(1, 4),
    titlePctH: R(4.5, 10),
    titleHeroPctH: R(7, 10),
    bodyPctH: R(2.2, 3.2),
    captionPctH: R(1.6, 2.6),
    lineHeightBody: R(1.35, 1.6),
    lineHeightDisplay: R(1.05, 1.25),
    lineLenChars: R(45, 60),
    titleWordsMax: 10,
    titleWordsIdeal: 5,
    bulletsMax: 6,
    wordsPerBulletMax: 6,
    bodyWordsMax: 30,
    charsPerPctWBody: 1.9,
  },
  whitespace: {
    targetPct: R(40, 60),
    heroTargetPct: R(55, 75),
    tooEmptyAbovePct: 72,
    tooDenseBelowPct: 30,
  },
  byLayout: {
    cover: { cells: R(2, 3), images: R(1, 1), textBlocks: R(2, 3), imageAreaPct: R(40, 50), whitespacePct: R(45, 58) },
    'dark-cover': { cells: R(1, 2), images: R(1, 1), textBlocks: R(2, 3), imageAreaPct: R(40, 55), whitespacePct: R(45, 60) },
    'content-image': { cells: R(2, 3), images: R(1, 1), textBlocks: R(2, 3), imageAreaPct: R(28, 40), whitespacePct: R(42, 55) },
    'two-column': { cells: R(2, 3), images: R(0, 0), textBlocks: R(3, 4), imageAreaPct: R(0, 0), whitespacePct: R(40, 52) },
    grid: { cells: R(4, 4), images: R(3, 4), textBlocks: R(1, 1), imageAreaPct: R(55, 66), whitespacePct: R(28, 45) },
    quote: { cells: R(1, 1), images: R(0, 0), textBlocks: R(1, 2), imageAreaPct: R(0, 0), whitespacePct: R(60, 75) },
    'full-bleed': { cells: R(1, 1), images: R(1, 1), textBlocks: R(1, 2), imageAreaPct: R(90, 100), whitespacePct: R(0, 100), bleed: true },
    'section-divider': { cells: R(2, 2), images: R(0, 1), textBlocks: R(2, 6), imageAreaPct: R(0, 50), whitespacePct: R(50, 65) },
    agenda: { cells: R(2, 2), images: R(0, 1), textBlocks: R(2, 6), imageAreaPct: R(0, 50), whitespacePct: R(50, 65) },
    moodboard: { cells: R(5, 9), images: R(3, 6), textBlocks: R(4, 6), imageAreaPct: R(50, 65), whitespacePct: R(28, 48) },
    triptych: { cells: R(3, 3), images: R(3, 3), textBlocks: R(1, 2), imageAreaPct: R(38, 48), whitespacePct: R(42, 55) },
    'big-stat': { cells: R(3, 3), images: R(0, 0), textBlocks: R(4, 4), imageAreaPct: R(0, 0), whitespacePct: R(45, 60) },
    'catalog-index': { cells: R(6, 6), images: R(6, 6), textBlocks: R(3, 4), imageAreaPct: R(45, 62), whitespacePct: R(28, 45) },
    closing: { cells: R(1, 1), images: R(0, 0), textBlocks: R(1, 3), imageAreaPct: R(0, 0), whitespacePct: R(60, 78) },
  },
};

/** Ngân sách fallback khi templateId lạ — dùng dải "slide nội dung" trung tính. */
export const DEFAULT_BUDGET: LayoutBudget = {
  cells: R(1, 4),
  images: R(0, 2),
  textBlocks: R(1, 4),
  imageAreaPct: R(0, 50),
  whitespacePct: R(40, 60),
};

export function budgetFor(templateId?: string): LayoutBudget {
  return (templateId && DECK_STANDARDS.byLayout[templateId]) || DEFAULT_BUDGET;
}
