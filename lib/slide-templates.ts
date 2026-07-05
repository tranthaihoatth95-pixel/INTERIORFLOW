/**
 * lib/slide-templates.ts — Bộ preset trình bày (design-system slide) cho pipeline
 * Present của InteriorFlow. Khai báo BẰNG TOKEN: font (SANS), lưới, màu, vị trí
 * ảnh/chữ. Mục tiêu: giảm rủi ro slide lệch — mọi slide render dựa vào một khung
 * chung, nhất quán tỉ lệ & khoảng trống kiểu editorial quiet-luxury.
 *
 * LUẬT FONT: chỉ SANS hiện đại, KHÔNG serif. Không webfont ngoài.
 *
 * File này CHỈ THÊM export mới — không đụng lib/slides.ts. Pipeline có thể map
 * preset.layout sang renderer sẵn có, hoặc đọc trực tiếp token để dựng canvas.
 */

/* ---------- Nền tảng: khổ, lưới, font, màu ---------- */

/** Khổ chuẩn 16:9 (px) — trùng với renderer hiện tại (1920×1080). */
export const SLIDE_W = 1920;
export const SLIDE_H = 1080;

/**
 * Font hệ thống — SANS, không chân. `display` cho tiêu đề, `body` cho nội dung,
 * `mono` cho nhãn/số kỹ thuật. Tất cả là stack an toàn, không cần tải webfont.
 */
export const SLIDE_FONTS = {
  display: '-apple-system,"SF Pro Display","Helvetica Neue","Space Grotesk",system-ui,sans-serif',
  body: '-apple-system,"SF Pro Text","Helvetica Neue","Inter",system-ui,sans-serif',
  mono: '"SF Mono","SFMono-Regular",ui-monospace,Menlo,monospace',
} as const;

/** Lưới cột editorial: 12 cột, máng 40px, lề an toàn 120px. */
export const SLIDE_GRID = {
  columns: 12,
  gutter: 40,
  margin: 120,
} as const;

/** Nhịp chữ (px) theo thang display quiet-luxury. */
export const SLIDE_TYPE = {
  kicker: { size: 22, weight: 600, tracking: 0.24, upper: true }, // nhãn nhỏ giãn chữ
  display: { size: 132, weight: 700, tracking: -0.03, leading: 1.02 }, // tiêu đề lớn
  title: { size: 72, weight: 600, tracking: -0.02, leading: 1.08 },
  body: { size: 30, weight: 400, tracking: 0, leading: 1.5 },
  quote: { size: 64, weight: 500, tracking: -0.01, leading: 1.25 },
  caption: { size: 22, weight: 500, tracking: 0.02 },
} as const;

/**
 * Bảng màu preset — trỏ về SlideTheme của pipeline (bg/text/muted/accent/palette).
 * Ở đây chỉ khai token vị trí/kết cấu; màu thực lấy từ theme runtime (themeFromRef).
 * Giá trị dưới là fallback warm-stone để preview khi chưa có ảnh ref.
 */
export const SLIDE_FALLBACK_THEME = {
  bg: '#f5f1ea',
  text: '#221f1a',
  muted: '#8a8378',
  accent: '#8a6f4d',
  palette: ['#f5f1ea', '#dad0c7', '#c7a397', '#8a6f4d', '#635c45', '#221f1a'],
} as const;

/* ---------- Kiểu dữ liệu preset ---------- */

/** Tên preset — mở rộng SlideLayout gốc ('Cover' | 'Nội dung + ảnh' | 'Quote'). */
export type SlideTemplateId = 'Cover' | 'Nội dung + ảnh' | 'Quote' | 'Moodboard' | 'So sánh';

/** Vùng hình chữ nhật, đơn vị PHẦN TRĂM khổ slide (0–100) để renderer tự scale. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Vị trí một khối văn bản trong preset. */
export interface TextSlot {
  role: 'kicker' | 'display' | 'title' | 'body' | 'quote' | 'caption' | 'pageNo';
  rect: Rect;
  align: 'left' | 'center' | 'right';
  /** map sang khoá SLIDE_TYPE để lấy size/weight/tracking. */
  type: keyof typeof SLIDE_TYPE;
  /** màu lấy từ theme: 'text' | 'muted' | 'accent' | 'onImage'. */
  color: 'text' | 'muted' | 'accent' | 'onImage';
}

/** Vùng ảnh (hero, moodboard cell, ảnh so sánh). */
export interface ImageSlot {
  id: string;
  rect: Rect;
  /** cách phủ ảnh: 'cover' cắt lấp đầy, 'contain' vừa khung. */
  fit: 'cover' | 'contain';
  /** có scrim tối để chữ đè lên đọc được không. */
  scrim?: boolean;
  radius?: number;
}

/** Dải màu palette (swatch spec vật liệu). */
export interface SwatchSlot {
  rect: Rect;
  /** số ô lấy từ theme.palette (mặc định 5–6). */
  count: number;
}

export interface SlideTemplate {
  id: SlideTemplateId;
  label: string;
  /** mô tả ngắn cho UI chọn preset. */
  hint: string;
  /** nền: dùng theme.bg sáng, hay theme darkest (nền tối biên tập). */
  surface: 'light' | 'dark';
  text: TextSlot[];
  images: ImageSlot[];
  swatches: SwatchSlot[];
}

/* ---------- 5 preset design-system ---------- */

export const SLIDE_TEMPLATES: Record<SlideTemplateId, SlideTemplate> = {
  /** Bìa: khối chữ lớn trái, ảnh hero phải (nếu có). */
  Cover: {
    id: 'Cover',
    label: 'Bìa',
    hint: 'Tiêu đề lớn + ảnh hero — mở đầu bộ slide.',
    surface: 'light',
    text: [
      { role: 'kicker', rect: { x: 6.25, y: 16, w: 40, h: 4 }, align: 'left', type: 'kicker', color: 'accent' },
      { role: 'display', rect: { x: 6.25, y: 30, w: 46, h: 40 }, align: 'left', type: 'display', color: 'text' },
      { role: 'body', rect: { x: 6.25, y: 74, w: 40, h: 12 }, align: 'left', type: 'body', color: 'muted' },
      { role: 'pageNo', rect: { x: 6.25, y: 91, w: 20, h: 4 }, align: 'left', type: 'caption', color: 'muted' },
    ],
    images: [{ id: 'hero', rect: { x: 52, y: 0, w: 48, h: 100 }, fit: 'cover' }],
    swatches: [],
  },

  /** Nội dung + ảnh: chữ trái (list/đoạn), ảnh minh hoạ phải. */
  'Nội dung + ảnh': {
    id: 'Nội dung + ảnh',
    label: 'Nội dung + ảnh',
    hint: 'Tiêu đề + đoạn/gạch đầu dòng, ảnh minh hoạ bên phải.',
    surface: 'light',
    text: [
      { role: 'kicker', rect: { x: 6.25, y: 14, w: 40, h: 4 }, align: 'left', type: 'kicker', color: 'accent' },
      { role: 'title', rect: { x: 6.25, y: 22, w: 44, h: 16 }, align: 'left', type: 'title', color: 'text' },
      { role: 'body', rect: { x: 6.25, y: 44, w: 44, h: 42 }, align: 'left', type: 'body', color: 'text' },
      { role: 'pageNo', rect: { x: 6.25, y: 91, w: 20, h: 4 }, align: 'left', type: 'caption', color: 'muted' },
    ],
    images: [{ id: 'hero', rect: { x: 56, y: 12, w: 37.75, h: 76 }, fit: 'cover', radius: 16 }],
    swatches: [],
  },

  /** Quote: nền tối biên tập, câu trích căn giữa, dấu nháy accent. */
  Quote: {
    id: 'Quote',
    label: 'Trích dẫn',
    hint: 'Câu nói/nguyên tắc thiết kế — nền tối, căn giữa.',
    surface: 'dark',
    text: [
      { role: 'kicker', rect: { x: 20, y: 22, w: 60, h: 4 }, align: 'center', type: 'kicker', color: 'accent' },
      { role: 'quote', rect: { x: 16, y: 34, w: 68, h: 32 }, align: 'center', type: 'quote', color: 'text' },
      { role: 'caption', rect: { x: 20, y: 72, w: 60, h: 5 }, align: 'center', type: 'caption', color: 'muted' },
    ],
    images: [],
    swatches: [],
  },

  /** Moodboard: lưới 3×2 ảnh + dải palette + nhãn style. */
  Moodboard: {
    id: 'Moodboard',
    label: 'Moodboard',
    hint: 'Lưới ảnh tham khảo + palette vật liệu.',
    surface: 'light',
    text: [
      { role: 'kicker', rect: { x: 6.25, y: 8, w: 40, h: 4 }, align: 'left', type: 'kicker', color: 'accent' },
      { role: 'title', rect: { x: 6.25, y: 13, w: 60, h: 8 }, align: 'left', type: 'title', color: 'text' },
      { role: 'pageNo', rect: { x: 6.25, y: 91, w: 20, h: 4 }, align: 'left', type: 'caption', color: 'muted' },
    ],
    // lưới 3 cột × 2 hàng trong vùng an toàn (x 6.25→93.75, y 26→82)
    images: [
      { id: 'm0', rect: { x: 6.25, y: 26, w: 28, h: 27 }, fit: 'cover', radius: 12 },
      { id: 'm1', rect: { x: 36, y: 26, w: 28, h: 27 }, fit: 'cover', radius: 12 },
      { id: 'm2', rect: { x: 65.75, y: 26, w: 28, h: 27 }, fit: 'cover', radius: 12 },
      { id: 'm3', rect: { x: 6.25, y: 55, w: 28, h: 27 }, fit: 'cover', radius: 12 },
      { id: 'm4', rect: { x: 36, y: 55, w: 28, h: 27 }, fit: 'cover', radius: 12 },
      { id: 'm5', rect: { x: 65.75, y: 55, w: 28, h: 27 }, fit: 'cover', radius: 12 },
    ],
    swatches: [{ rect: { x: 6.25, y: 86, w: 87.5, h: 4 }, count: 6 }],
  },

  /** So sánh: hai cột trước/sau (hoặc phương án A/B) đối xứng. */
  'So sánh': {
    id: 'So sánh',
    label: 'So sánh',
    hint: 'Hai phương án / trước–sau, đối xứng hai cột.',
    surface: 'light',
    text: [
      { role: 'kicker', rect: { x: 6.25, y: 9, w: 87.5, h: 4 }, align: 'center', type: 'kicker', color: 'accent' },
      { role: 'title', rect: { x: 6.25, y: 14, w: 87.5, h: 8 }, align: 'center', type: 'title', color: 'text' },
      { role: 'caption', rect: { x: 6.25, y: 82, w: 40, h: 5 }, align: 'center', type: 'caption', color: 'muted' },
      { role: 'caption', rect: { x: 53.75, y: 82, w: 40, h: 5 }, align: 'center', type: 'caption', color: 'muted' },
    ],
    images: [
      { id: 'left', rect: { x: 6.25, y: 26, w: 42, h: 52 }, fit: 'cover', radius: 14 },
      { id: 'right', rect: { x: 51.75, y: 26, w: 42, h: 52 }, fit: 'cover', radius: 14 },
    ],
    swatches: [],
  },
};

/** Danh sách preset cho UI (giữ thứ tự có ý nghĩa kể chuyện). */
export const SLIDE_TEMPLATE_ORDER: SlideTemplateId[] = [
  'Cover',
  'Nội dung + ảnh',
  'Moodboard',
  'So sánh',
  'Quote',
];

/** Lấy preset an toàn, fallback về Cover nếu id lạ. */
export function getSlideTemplate(id: string): SlideTemplate {
  return SLIDE_TEMPLATES[id as SlideTemplateId] ?? SLIDE_TEMPLATES.Cover;
}

/** Đổi rect %→px theo khổ slide, để renderer canvas dùng trực tiếp. */
export function rectToPx(r: Rect, w = SLIDE_W, h = SLIDE_H) {
  return {
    x: (r.x / 100) * w,
    y: (r.y / 100) * h,
    w: (r.w / 100) * w,
    h: (r.h / 100) * h,
  };
}
