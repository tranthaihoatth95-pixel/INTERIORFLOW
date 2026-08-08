/**
 * lib/present-editor/model.ts — MÔ HÌNH DỮ LIỆU của trình dàn trang "Present".
 *
 * Nguyên tắc: model PHẲNG, serialize được (JSON) để:
 *   - lưu/khôi phục dễ,
 *   - export sang PDF (jsPDF) và PPTX (lib/pptx) chỉ là phép ánh xạ thuần.
 *
 * Toạ độ = PHẦN TRĂM của sân khấu (0..100) — mặc định 16:9. Nhờ vậy toán export không phụ
 * thuộc kích thước hiển thị: nhân với W×H sân khấu (PDF/PNG, xem stage-presets.ts) hoặc
 * 13.333×7.5in (PPTX, luôn 16:9 — xem export.ts) là ra. PS-4: deck.stagePreset chọn khổ
 * khác 16:9 (A4/A3 ngang/dọc) — W/H đổi theo, % KHÔNG đổi ý nghĩa.
 *
 * KHÔNG import gì từ store/registry để tránh circular import.
 */

import type { FontPairing } from '@/lib/slides';
import type { StagePresetId } from './stage-presets';

/** Loại phần tử trên slide. */
export type ElementKind = 'image' | 'text' | 'shape';

/**
 * Hình cơ bản cho shape element.
 * Round 3: bổ sung tam giác / đa giác (số cạnh tuỳ chỉnh) / mũi tên — 1 shape cơ bản
 * chỉnh thông số (cạnh/góc bo/số cạnh) cho ra nhiều biến thể (né bản quyền, human-in-loop).
 */
export type ShapeKind = 'rect' | 'ellipse' | 'line' | 'triangle' | 'polygon' | 'arrow';

/**
 * Gradient MỜ (opacity) có hướng cho shape — phủ 1 lớp fade lên fill.
 * Chỉ đổi độ mờ theo trục, KHÔNG đổi màu (màu vẫn là fill). Phản chiếu render.ts + Element.
 *
 * @deprecated (P3/E3, 02/08) — giữ nguyên cho `.idfp` cũ mở được y hệt (KHÔNG xoá/đổi hành vi),
 * nhưng UI mới nên dùng `FillOverlay` (kind='gradient') — 2 màu riêng + opacity + blend, mạnh
 * hơn (OpacityGradient chỉ mờ dần 1 màu fill có sẵn, không đổi màu). Xem CHOT-NGUYEN-LIEU-EDITOR
 * §1 E3 "OpacityGradient hiện tại giữ nguyên (backward-compat), đánh dấu deprecated".
 */
export type GradientDirection = 'ltr' | 'rtl' | 'ttb' | 'btt' | 'center' | 'edges';
export interface OpacityGradient {
  direction: GradientDirection;
  /** độ mờ đầu (0..1) và cuối (0..1) của dải fade. */
  from: number;
  to: number;
}

/**
 * Lớp phủ FILL (P3/E3) — khái niệm THỐNG NHẤT cho `ShapeElement` + `ImageElement`: 1 lớp
 * màu/gradient ĐÈ LÊN fill/ảnh gốc, độ mờ + kiểu hoà trộn RIÊNG. Giải 2 ô ⬜ của audit
 * (28/07): "gradient màu" (kind='gradient', 2 màu thật) và "overlay" (kind='color', vd phủ
 * đen mờ lên ảnh cho chữ đè lên dễ đọc). KHÁC `OpacityGradient` (ở trên, deprecated) — cái đó
 * chỉ mờ DẦN 1 màu fill có sẵn (không đổi màu); cái NÀY là 1 LỚP ĐỘC LẬP, màu riêng, không phụ
 * thuộc màu fill/ảnh bên dưới. Text KHÔNG dùng field này (cố tình KHÔNG khai ở `BaseElement`,
 * chỉ khai riêng trên `ImageElement`/`ShapeElement`, tránh mở khả năng gán nhầm cho
 * `TextElement` — chữ đã có `TextFx.gradient`/`TextFx.blend` riêng, xem trên).
 */
export type FillOverlayKind = 'color' | 'gradient';
/**
 * Bảng hoà trộn AN TOÀN — TÁI DÙNG đúng bộ `TextFx.blend` (dưới) để cả app chỉ có 1 bảng chọn
 * duy nhất (canvas `globalCompositeOperation` + CSS `mix-blend-mode` cùng hiểu các từ khoá này
 * y hệt nhau). 'normal'/bỏ trống = đè bình thường (canvas mặc định 'source-over').
 */
export type FillBlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'difference' | 'luminosity';
export interface FillOverlay {
  kind: FillOverlayKind;
  /** màu đơn (kind='color') hoặc màu ĐẦU dải gradient (kind='gradient'). */
  color: string;
  /** màu CUỐI dải gradient — CHỈ dùng khi kind='gradient'. */
  colorTo?: string;
  /** hướng gradient — tái dùng `GradientDirection` đã có, không thêm bảng hướng thứ 2. Bỏ qua
   * khi kind='color'. Bỏ trống khi kind='gradient' = mặc định 'ltr'. */
  direction?: GradientDirection;
  /** độ mờ lớp phủ (0..1) — NHÂN với `opacity` của chính element (2 lớp mờ cộng dồn, không
   * thay thế). */
  opacity: number;
  blend?: FillBlendMode;
}

/** Kiểu danh sách của text element. */
export type ListStyle = 'none' | 'bullet' | 'number';

/* ------------------------------------------------------------------ */
/* HIỆU ỨNG CHỮ (text effects / typography illustration)               */
/* ------------------------------------------------------------------ */

/**
 * Một lớp bóng đổ của chữ. Toạ độ/độ nhoè tính theo % CHIỀU CAO sân khấu (giống fontSize)
 * để bóng co giãn ĐÚNG tỉ lệ ở mọi khổ + mọi cỡ preview (thumbnail, player, export).
 * Nhiều lớp xếp chồng: phần tử ĐẦU mảng nằm TRÊN (khớp thứ tự CSS text-shadow).
 */
export interface TextShadowLayer {
  /** dịch ngang, % chiều cao sân khấu (âm = sang trái). */
  x: number;
  /** dịch dọc, % chiều cao sân khấu (âm = lên trên). */
  y: number;
  /** độ nhoè, % chiều cao sân khấu (0 = nét cứng). */
  blur: number;
  color: string;
}

/** Hướng chuyển sắc của gradient đổ vào lòng chữ (góc, độ — 0 = trái→phải). */
export interface TextGradient {
  from: string;
  to: string;
  /** góc, độ. 0 = trái→phải, 90 = trên→dưới. */
  angle: number;
}

/**
 * Bộ hiệu ứng typography nâng cao cho MỘT text element (#2 "text effects & typography
 * illustration"). TOÀN BỘ field là tuỳ chọn và `fx` tự nó cũng tuỳ chọn ⇒ deck cũ (không có
 * field này) render Y HỆT như trước — không có đường nào đổi hành vi mặc định.
 *
 * Gu quiet-luxury: mặc định của MỌI hiệu ứng là "tắt"; preset dựng sẵn ở
 * lib/present-editor/text-fx.ts đều tiết chế (bóng mảnh, viền mỏng, gradient cùng tông).
 *
 * Phản chiếu ở BA nơi vẽ chữ — phải sửa đồng bộ cả ba:
 *   1. components/present-editor/Element.tsx  (DOM: editor canvas + player + thumbnail)
 *   2. lib/present-editor/render.ts           (canvas 2D: PDF / PNG / PPTX-ảnh)
 *   3. lib/present-editor/text-fx.ts          (nguồn chung: CSS builder + preset)
 */
export interface TextFx {
  /** giãn/nén khoảng cách TỪ (word-spacing), % chiều cao sân khấu. */
  wordSpacing?: number;
  /** viền chữ (stroke) — bề dày % chiều cao sân khấu, 0/bỏ trống = không viền. */
  strokeWidth?: number;
  strokeColor?: string;
  /** chữ RỖNG: chỉ giữ viền, bỏ ruột. Cần strokeWidth > 0 mới thấy gì. */
  outlineOnly?: boolean;
  /** các lớp bóng đổ (tối đa vài lớp — UI giới hạn 3). */
  shadows?: TextShadowLayer[];
  /** đổ gradient vào lòng chữ (ghi đè `color` khi bật). Không dùng chung outlineOnly. */
  gradient?: TextGradient;
  /** biến đổi hoa/thường. */
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  /** chế độ hoà trộn với lớp dưới (CSS mix-blend-mode / canvas globalCompositeOperation). */
  blend?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'difference' | 'luminosity';
  /**
   * Uốn chữ theo cung tròn — độ cong tính bằng ĐỘ của cung chứa cả dòng chữ.
   * 0/bỏ trống = chữ thẳng (mặc định). Dương = cong lên (nụ cười), âm = cong xuống.
   * GIỚI HẠN CÓ CHỦ Ý: chỉ áp cho text MỘT DÒNG (xuống dòng bị bỏ qua khi uốn) — chữ uốn
   * là chi tiết trang trí tiêu đề, không phải khối body.
   */
  curve?: number;
}

/** Căn chữ ngang. */
export type TextAlign = 'left' | 'center' | 'right';

/** Bộ chỉnh ảnh cơ bản (áp bằng CSS filter khi hiển thị + tái dựng khi export). */
export interface ImageAdjust {
  brightness: number; // %  (100 = gốc)
  contrast: number; // %  (100 = gốc)
  saturate: number; // %  (100 = gốc)
  /** Nhiệt độ: -100 (lạnh) .. 0 .. +100 (ấm) → dịch sang sepia + hue nhẹ. */
  temperature: number;
}

export const DEFAULT_ADJUST: ImageAdjust = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  temperature: 0,
};

/**
 * P4/E4 — Filter CHUNG cho MỌI loại phần tử (text/shape/ảnh), `docs/CHOT-NGUYEN-LIEU-EDITOR-
 * 2026-08-01.md` mục E4: `blur · brightness · contrast · saturate` — KHÁC `ImageAdjust` ở trên
 * (vốn CHỈ áp cho `ImageElement`/nền slide, không có `blur`, có thêm `temperature` mà E4 không
 * cần). Đúng chỗ hổng `AUDIT-EDITOR-TOOLKIT.md` §"Làm mờ" nêu: KHÔNG có `blur()` nào áp lên nội
 * dung ảnh/shape/text theo ý người dùng — trước đó `blur` duy nhất trong file là độ nhoè CỦA
 * bóng đổ (`TextShadowLayer.blur`), không phải blur độc lập trên phần tử. `ImageAdjust` GIỮ
 * NGUYÊN không đổi (backward-compat) — 2 field độc lập, có thể cùng áp lên 1 `ImageElement`
 * (CSS/canvas filter ghép chuỗi, xem `elementFilterToCssFilter`/`render.ts#drawImageEl`).
 */
export interface ElementFilter {
  blur: number; // px (0 = không mờ)
  brightness: number; // % (100 = gốc)
  contrast: number; // % (100 = gốc)
  saturate: number; // % (100 = gốc)
}

export const DEFAULT_ELEMENT_FILTER: ElementFilter = {
  blur: 0,
  brightness: 100,
  contrast: 100,
  saturate: 100,
};

/**
 * Chuỗi CSS filter từ `ElementFilter` — dùng cho hiển thị live (`Element.tsx`) VÀ tái dựng khi
 * export (`render.ts`, gán thẳng `ctx.filter` — Canvas hỗ trợ CÙNG cú pháp filter với CSS, xem
 * `adjustToCssFilter` ở trên cùng quy ước). Bỏ trống HOẶC mọi giá trị ở mức GỐC (identity: blur 0,
 * còn lại 100%) → `'none'` — HÀNH VI CŨ giữ nguyên cho phần tử chưa từng chỉnh filter (field mới
 * additive, `.idfp` cũ không có `filter` vẫn render y hệt trước).
 */
export function elementFilterToCssFilter(f: ElementFilter | undefined): string {
  if (!f) return 'none';
  const parts: string[] = [];
  if (f.blur > 0) parts.push(`blur(${f.blur}px)`);
  if (f.brightness !== 100) parts.push(`brightness(${f.brightness}%)`);
  if (f.contrast !== 100) parts.push(`contrast(${f.contrast}%)`);
  if (f.saturate !== 100) parts.push(`saturate(${f.saturate}%)`);
  return parts.length ? parts.join(' ') : 'none';
}

/** Vùng crop tính theo phần trăm của ảnh gốc (0..1). Mặc định = toàn ảnh. */
export interface CropRect {
  x: number; // 0..1
  y: number; // 0..1
  w: number; // 0..1
  h: number; // 0..1
}

export const FULL_CROP: CropRect = { x: 0, y: 0, w: 1, h: 1 };

/**
 * Hình mask hợp lệ cho ẢNH (P1/E2, `docs/CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md`) — tập con của
 * `ShapeKind`, KHÔNG gồm 'rect' (= không cần mask, dùng `radius` như cũ) hay 'line' (không phải
 * vùng khép kín, không cắt ảnh được). 'ellipse' vẽ bằng CSS `ellipse()`/canvas `ctx.ellipse()`
 * riêng (khớp box kể cả không vuông); 3 kiểu còn lại TÁI DÙNG NGUYÊN `polygonPoints01`/
 * `shapeClipPath` đã có cho `ShapeElement` — xem `lib/present-editor/shape-geometry.ts`.
 */
export type ImageMaskShape = 'ellipse' | 'triangle' | 'polygon' | 'arrow';

export interface ImageMask {
  shape: ImageMaskShape;
  /** số cạnh khi shape = 'polygon' (3..12, xem `clampSides`). Bỏ trống = 5 (ngũ giác). */
  sides?: number;
}

/** Khung hình học chung — % của sân khấu. */
export interface Frame {
  x: number; // 0..100  (mép trái)
  y: number; // 0..100  (mép trên)
  w: number; // 0..100
  h: number; // 0..100
  rotation: number; // độ
}

interface BaseElement {
  id: string;
  kind: ElementKind;
  frame: Frame;
  /** z nhỏ = dưới. Mảng elements đã theo thứ tự z nhưng giữ field để tiện. */
  locked?: boolean;
  opacity?: number; // 0..1
  /** ẩn khỏi canvas + export (ô quản lý layer bật/tắt). */
  hidden?: boolean;
  /** tên hiển thị trong ô quản lý layer (đổi được). Bỏ trống = tự đặt theo loại/nội dung. */
  name?: string;
  /**
   * Animation Pane theo object (mở rộng build-in slide-level cũ, xem `EditorSlide.reveal`):
   * ghi đè kiểu build-in RIÊNG cho phần tử này. Bỏ trống = kế thừa `slide.reveal ?? deck.reveal`
   * (HÀNH VI CŨ — mọi phần tử chung 1 kiểu, deck cũ trước tính năng này không có field → chạy
   * y hệt trước). Xem lib/present-editor/motion-present.ts#computeElementRevealTimings.
   */
  elementReveal?: ElementReveal;
  /**
   * Thứ tự xuất hiện khi trình chiếu (số nhỏ hơn = xuất hiện trước). Bỏ trống = suy theo CHỈ SỐ
   * trong mảng `elements` (đúng thứ tự vẽ/HÀNH VI CŨ). Trùng số → giữ nguyên thứ tự mảng gốc
   * (sắp ổn định).
   */
  revealOrder?: number;
  /**
   * Độ trễ RIÊNG (giây) trước khi phần tử này bắt đầu build-in, tính từ lúc slide xuất hiện.
   * Có giá trị → GHI ĐÈ mức trễ tự suy từ `revealOrder` (stagger mặc định). Bỏ trống = tự tính.
   */
  revealDelay?: number;
  /**
   * P2/E1 (nhóm) — id cụm chung, tự sinh (`newId('grp')`), KHÔNG phải id element. Nhiều phần tử
   * cùng `groupId` = 1 cụm: click 1 phần tử trong cụm → chọn CẢ cụm; khoá/xoá/nhân bản/dời áp
   * dụng cho cả cụm khi đang chọn cả cụm (xem `PresentEditor.tsx#onSelectGroupAware` +
   * `onToggleLockSelected`). Bỏ trống = không thuộc cụm nào (HÀNH VI CŨ — `.idfp` cũ không có
   * field này vẫn mở/chạy y hệt trước, mọi phần tử độc lập). Nhân bản (`onDuplicateSelected`/
   * `onPaste`) ánh xạ sang groupId MỚI cho lô bản sao — KHÔNG kế thừa nguyên id gốc (tránh gộp
   * lầm bản sao vào cụm cũ) và KHÔNG xoá trắng (tránh rã lầm cụm của bản sao).
   */
  groupId?: string;
  /**
   * P4/E4 — filter CHUNG cho mọi loại phần tử (blur/brightness/contrast/saturate, xem
   * `ElementFilter` ở trên). Bỏ trống = KHÔNG áp filter (HÀNH VI CŨ, `.idfp` cũ không có field
   * này vẫn render y hệt trước — additive, không phá vỡ file cũ).
   */
  filter?: ElementFilter;
}

export interface ImageElement extends BaseElement {
  kind: 'image';
  src: string; // URL hoặc data URI
  adjust: ImageAdjust;
  crop: CropRect;
  radius?: number; // bo góc, px @1920 quy đổi
  /**
   * Tài sản liên kết (PS-3) — element này là 1 "instance" của `deck.linkedAssets[assetId]`.
   * Sửa nguồn (setLinkedAssetSrc, lib/present-editor/linked-assets.ts) 1 lần → mọi element
   * cùng assetId (ở BẤT KỲ slide nào) đồng loạt cập nhật `src`. Bỏ trống = ảnh độc lập (cũ).
   */
  assetId?: string;
  /**
   * NT4 pha 1 (VIỆC ③, 28/07, PLAN-LIBRARY-GATEWAY.md §4) — tên file THẬT trên máy user, để
   * hiển thị/đối chiếu (KHÔNG phải path hệ điều hành đầy đủ — trình duyệt không cho JS đọc path
   * thật vì lý do bảo mật, giới hạn chung mọi web app). Bỏ trống = ảnh cũ/paste, hoạt động y
   * nguyên như trước khi có field này. Cập nhật qua nút "Cập nhật liên kết" (Inspector.tsx) —
   * user tự chọn lại file, KHÔNG watch nền tự động (pha 2, đợi Electron — xem PLAN §4c).
   */
  diskPath?: string;
  /** true = lần "Cập nhật liên kết" gần nhất user không chọn lại (huỷ) hoặc chọn nhầm file khác. */
  diskPathMissing?: boolean;
  /**
   * Mask ảnh theo hình (P1/E2) — cắt ảnh theo tròn/tam giác/đa giác/mũi tên thay vì chỉ bo góc
   * chữ nhật. Bỏ trống = ảnh chữ nhật/bo góc như cũ (KHÔNG đổi hành vi mặc định — additive). Có
   * mask → `radius` bị BỎ QUA (2 cơ chế cắt không hợp lý cộng dồn, mask chiếm quyền — xem
   * Element.tsx#ImageInner + render.ts#drawImageEl, phải sửa ĐỒNG BỘ CẢ HAI + export.ts cho PPTX).
   */
  mask?: ImageMask;
  /** Lớp phủ FILL (P3/E3) — màu/gradient đè lên ảnh, vd tối ảnh cho chữ đè lên dễ đọc. Vẽ ĐÈ
   * lên ảnh, giới hạn trong đúng vùng đã clip (mask nếu có, không thì khung/bo góc như cũ). */
  fillOverlay?: FillOverlay;
}

export interface TextElement extends BaseElement {
  kind: 'text';
  text: string;
  /** cỡ chữ tính theo % chiều cao sân khấu (vd 5 = 54px @1080). */
  fontSize: number;
  color: string;
  align: TextAlign;
  bold: boolean;
  italic: boolean;
  /** gạch chân (như Word). Phản chiếu ở render.ts (canvas) + export PPTX. */
  underline?: boolean;
  /** khoảng cách chữ (letter-spacing) px @1080. */
  tracking?: number;
  lineHeight?: number; // hệ số
  /** danh sách bullet — mỗi dòng (\n) là 1 gạch đầu dòng "• " (giữ để tương thích cũ). */
  bullet?: boolean;
  /**
   * Kiểu danh sách (mới, ưu tiên hơn `bullet`):
   *   'bullet' → "•  " mỗi dòng, 'number' → "1.  2.  3." auto đánh số. 'none' = không.
   * Nếu không có, suy từ `bullet` (true → 'bullet').
   */
  listStyle?: ListStyle;
  /**
   * Ghi đè bộ chữ riêng cho element này (chuỗi font-family CSS, xem lib/present-editor/fonts).
   * Bỏ trống = kế thừa bộ chữ của deck (FontPairing).
   */
  fontFamily?: string;
  /** vai trò ngữ nghĩa để export PPTX map về SlideContent (title/body/kicker). */
  role?: 'title' | 'kicker' | 'body' | 'free';
  /**
   * Hiệu ứng typography nâng cao (viền/bóng/gradient/uốn…). Bỏ trống = chữ phẳng như cũ.
   * Xem `TextFx` phía trên + lib/present-editor/text-fx.ts.
   */
  fx?: TextFx;
  /**
   * P6a (04/08, TICKET-PRESENT-UI-GON, Hoà chốt) — TRUE nếu `color` hiện tại do HỆ THỐNG tự
   * chọn (carve-out CÓ ĐIỀU KIỆN của luật cũ "không tự đổi màu chữ" — xem Element.tsx#TextInner
   * và lib/present-editor/text-contrast.ts). Mặc định TRUE cho text MỚI (`makeText()`) — hệ tự
   * dò AA khi chữ đè ảnh và màu hiện có KHÔNG đạt, chọn trắng/đen/màu deck (ưu tiên đúng thứ tự
   * đó), CHỈ khi thiếu mới đụng. Ngay khi người dùng tự bấm color-picker 1 lần (TextToolbar.tsx/
   * Inspector.tsx) → hệ đặt về FALSE VĨNH VIỄN, không bao giờ tự sửa lại màu đó nữa. Phần tử CŨ
   * (mở lại .idfp trước 04/08) không có field này → undefined → coi như FALSE, giữ nguyên hành
   * vi/màu đã có — không hồi tố.
   */
  colorAuto?: boolean;
  /**
   * P6a (04/08) — bật lại vệt sương (scrim) sau chữ khi đè ảnh, hành vi CŨ trước ticket này.
   * Mặc định TẮT (undefined/false) kể từ 04/08 — đổi hành vi CÓ CHỦ Ý theo ticket, KHÔNG hồi tố
   * cho slide cũ (mở lại .idfp cũ vẫn ra đúng y như trước: không field này = không có sương y
   * hệt hành vi cũ vốn cũng phụ thuộc `overImage`, không phải field, nên .idfp cũ không đổi gì
   * khi mở lại — chỉ có DECK MỚI TẠO SAU NGÀY NÀY mới thấy sương tắt mặc định). true = bật.
   */
  scrimEnabled?: boolean;
  /**
   * P6a (04/08) — TRUE khi hệ đã tự chọn màu (colorAuto) nhưng NGAY CẢ ứng viên tốt nhất
   * (trắng/đen/màu deck) vẫn KHÔNG đạt AA trên nền đo được — thêm text-shadow MẢNH để tách chữ
   * khỏi nền, theo đúng "text-shadow mảnh chỉ khi vẫn thiếu" trong ticket. Chỉ hệ tự đặt (cùng
   * lúc với colorAuto correction), không có control tay riêng.
   */
  autoShadow?: boolean;
}

export interface ShapeElement extends BaseElement {
  kind: 'shape';
  shape: ShapeKind;
  fill: string; // dùng cho rect/ellipse/triangle/polygon/arrow
  stroke: string;
  strokeWidth: number; // px @1080
  radius?: number; // bo góc rect
  /** số cạnh cho shape 'polygon' (3..12). Bỏ trống = 5 (ngũ giác). */
  sides?: number;
  /** @deprecated gradient MỜ có hướng phủ lên fill — dùng `fillOverlay` (kind='gradient') cho
   * UI mới, field này giữ nguyên chỉ để `.idfp` cũ mở đúng (xem `OpacityGradient` ở trên). */
  gradient?: OpacityGradient;
  /** Lớp phủ FILL (P3/E3) — màu/gradient ĐỘC LẬP đè lên `fill`, độ mờ + hoà trộn riêng. */
  fillOverlay?: FillOverlay;
}

export type SlideElement = ImageElement | TextElement | ShapeElement;

/** Góc đặt logo/watermark cấp deck. */
export type WatermarkCorner = 'tl' | 'tr' | 'bl' | 'br';

/**
 * Logo/watermark CẤP DECK (PS-1 / G.7) — hiện trên MỌI slide ở 1 góc, bật/tắt được.
 * Là tài sản dùng chung (không phải element của 1 slide) → không nằm trong `slide.elements`,
 * render riêng sau lớp element ở canvas + export (render.ts). `src` = dataURL/URL logo.
 */
export interface DeckWatermark {
  src: string;
  corner: WatermarkCorner;
  /** bề rộng logo tính theo % chiều RỘNG sân khấu (vd 12 = 12% × 1920). */
  sizePct: number;
  /** độ mờ 0..1. */
  opacity: number;
  /** khoảng lề từ mép sân khấu, % chiều rộng (mặc định ~3). */
  marginPct?: number;
  enabled: boolean;
}

/**
 * T2 (`docs/SPEC-TRINH-ONG-KINH-DU-LIEU.md` §3 "Ảnh dẫn xuất phải mang công thức") — CÔNG THỨC
 * để dựng lại 1 `LinkedAsset` từ Doc CAD SỐNG, chỉ áp cho nhóm 🟨 "ẢNH CÓ CÔNG THỨC" trong bảng
 * phân loại §2 của spec đó (mặt bằng/zone-map dán vào deck) — KHÔNG áp cho ảnh render 3D/ảnh
 * chụp thật (🟩 ẢNH, không có Doc nào đứng sau để tái tạo). `kind` khớp đúng 2 hàm xuất ảnh THUẦN
 * đã có sẵn ở `lib/cad/render.ts` (renderDocToDataURL / renderZoneMapToDataURL, xem
 * `lib/present-editor/linked-asset-recipe.ts#renderRecipeImage`) — không phát minh cách render
 * thứ ba.
 */
export interface LinkedAssetRecipe {
  kind: 'cad-plan' | 'zone-map';
  /** dự án NGUỒN của bản vẽ — recipe neo theo dự án lúc TẠO ảnh, không phải dự án đang mở lúc
   * xem lại (chèn ảnh chéo dự án vẫn refresh đúng bản vẽ gốc). */
  projectId: string;
  /** sheet nguồn, nếu dự án có nhiều bản vẽ (câu hỏi treo §5 #2 của spec) — bỏ trống = sheet
   * đang hoạt động lúc render (đủ cho đa số dự án 1-sheet hiện nay). */
  sheetId?: string;
  /** độ rộng ảnh render (px, tham số `maxPx` của renderDocToDataURL/renderZoneMapToDataURL) —
   * giữ lại để "Làm mới từ bản vẽ" ra đúng độ nét như lúc tạo, không đoán lại. */
  widthPx: number;
  /**
   * Vân tay Doc (`boqFingerprint`, `lib/boq/cache.ts` — CHỈ IMPORT, không đụng file đó) tại
   * THỜI ĐIỂM ảnh này được render lần gần nhất. So với vân tay Doc HIỆN TẠI (tính lại mỗi lần
   * cần biết) để phát hiện "bản vẽ đã đổi từ lúc chèn ảnh" — KHÔNG tự động render lại (L5: không
   * ghi ngược/tự đổi sau lưng), chỉ báo cờ, người dùng tự bấm "Làm mới". Rỗng = chưa đo được lúc
   * tạo (asset vẫn hợp lệ, chỉ không so sánh được — không chặn gì).
   */
  fingerprint: string;
}

/**
 * Tài sản liên kết (PS-3) — gộp "smart object" (Photoshop) + "component instance"
 * (Figma) làm MỘT khái niệm: nhiều `ImageElement.assetId` (ở nhiều slide khác nhau) trỏ
 * chung 1 bản ghi ở đây. Sửa `src` một lần (qua `setLinkedAssetSrc`, lib/present-editor/
 * linked-assets.ts) → mọi element tham chiếu đồng loạt cập nhật. Registry sống ở cấp deck
 * (giống `watermark`) — không phải element của 1 slide.
 */
export interface LinkedAsset {
  id: string;
  /** ảnh nguồn hiện tại (dataURL/URL) — mọi element cùng assetId hiển thị đúng ảnh này. */
  src: string;
  /** tên gợi nhớ để chọn lại trong panel (vd "Logo TTT", "Ảnh render sảnh"). */
  name?: string;
  updatedAt: number;
  /**
   * T2 — bỏ trống = ảnh KHÔNG sinh từ Doc CAD (render 3D/ảnh chụp — hợp lệ, KHÔNG phải lỗi, xem
   * bảng phân loại §2 SPEC-TRINH-ONG-KINH-DU-LIEU). Có giá trị = ảnh "có công thức": Inspector
   * cho phép "Làm mới từ bản vẽ" + cảnh báo khi Doc đã đổi từ lúc render. Additive — asset cũ
   * (mọi asset trước 08/08) không có field này vẫn hoạt động y nguyên như trước.
   */
  recipe?: LinkedAssetRecipe;
}

/**
 * Hiệu ứng chuyển động (motion) kiểu Apple — chọn cho từng slide.
 * CHỈ ảnh hưởng khi TRÌNH CHIẾU (preview động), KHÔNG đổi model tĩnh nên PDF/PPTX bỏ qua.
 * Giữ trong model để serialize được + lưu/khôi phục.
 */
export type SlideTransition =
  | 'none' // cắt cứng
  | 'fade' // tan mờ
  | 'slide' // trượt ngang kiểu iOS
  | 'push' // đẩy (slide cũ ra, mới vào)
  | 'zoom' // phóng nhẹ (Magic Move rút gọn)
  | 'rise'; // trồi lên + blur tan (keynote Apple)

/** Kiểu build-in cho các phần tử của 1 slide (áp lần lượt khi slide xuất hiện). */
export type ElementReveal =
  | 'none'
  | 'fade' // hiện mờ đồng loạt
  | 'rise' // trồi lên lần lượt (stagger)
  | 'zoom'; // phóng nhẹ lần lượt

/** Một slide = nền + danh sách phần tử (thứ tự mảng = thứ tự vẽ, cuối = trên cùng). */
export interface EditorSlide {
  id: string;
  background: string; // màu nền (hex) — người dùng chỉnh được
  /** ảnh nền full-bleed (tuỳ chọn) — nằm dưới mọi element. */
  backgroundImage?: string | null;
  backgroundAdjust?: ImageAdjust;
  elements: SlideElement[];
  /** template gốc đã áp (để hiển thị/gợi ý). */
  templateId?: string;
  /** hiệu ứng chuyển VÀO slide này (mặc định kế thừa deck.transition). */
  transition?: SlideTransition;
  /** kiểu build-in cho phần tử của slide (mặc định kế thừa deck.reveal). */
  reveal?: ElementReveal;
}

/** Deck = nhiều slide + brand + bộ chữ + palette gu. */
export interface EditorDeck {
  id: string;
  brand: string;
  project: string;
  fonts: FontPairing;
  /** palette gu (6 màu) — dùng cho picker màu nhanh. */
  palette: string[];
  slides: EditorSlide[];
  /** hiệu ứng chuyển slide mặc định cho cả deck (slide có thể ghi đè). */
  transition?: SlideTransition;
  /** kiểu build-in phần tử mặc định cho cả deck. */
  reveal?: ElementReveal;
  /** logo/watermark cấp deck (PS-1 / G.7) — hiện trên mọi slide, bật/tắt được. */
  watermark?: DeckWatermark;
  /** registry tài sản liên kết (PS-3) — key = assetId, tham chiếu bởi ImageElement.assetId. */
  linkedAssets?: Record<string, LinkedAsset>;
  /**
   * Khổ trình bày (PS-4) — bỏ trống = '16:9' (deck cũ trước PS-4 không có field này, hành vi
   * KHÔNG đổi). Xem lib/present-editor/stage-presets.ts (nguồn duy nhất kích thước sân khấu)
   * + lib/present-editor/reflow.ts (dàn lại element khi đổi khổ).
   */
  stagePreset?: StagePresetId;
  /**
   * FONT NGƯỜI DÙNG TẢI LÊN, NHÚNG THEO DECK (#1). Giữ ngay trong model để font đi THEO
   * dự án: đóng/mở lại, đổi máy, xuất/nhập JSON deck đều còn font — khác hẳn thư viện font
   * cấp trình duyệt (chỉ sống trên đúng máy đó). Xem lib/present-editor/custom-fonts.ts.
   * Bỏ trống = deck không dùng font tải lên (mọi deck cũ).
   */
  customFonts?: EmbeddedFont[];
}

/**
 * Font người dùng tải lên, đã nhúng dataURL — serialize được nên đi kèm deck qua IndexedDB
 * (lib/sheets-persist.ts) và qua xuất/nhập JSON.
 */
export interface EmbeddedFont {
  /** tên hiển thị trong dropdown, vd "Söhne (tải lên)". */
  label: string;
  /** chuỗi font-family CSS dùng thẳng cho `TextElement.fontFamily` + ctx.font. */
  stack: string;
  /** tên face đơn (không dấu nháy) — dùng cho fontFace khi xuất PPTX. */
  face: string;
  /** dữ liệu font base64 (data:font/...). */
  dataUrl: string;
  /** cỡ file gốc (byte) — hiện trong UI để user biết deck đang nặng bao nhiêu. */
  bytes: number;
}

/* ------------------------------------------------------------------ */
/* Helpers tạo id + phần tử mặc định (đều serialize được).             */
/* ------------------------------------------------------------------ */

let _seq = 0;
/** id ổn định, KHÔNG dùng Math.random ở render body (hydration-safe khi gọi trong handler). */
export function newId(prefix = 'el'): string {
  _seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${_seq.toString(36)}`;
}

export function makeText(partial: Partial<TextElement> = {}): TextElement {
  return {
    id: newId('txt'),
    kind: 'text',
    frame: { x: 8, y: 8, w: 50, h: 12, rotation: 0 },
    text: 'Nhập nội dung',
    fontSize: 5,
    color: '#221f1a',
    align: 'left',
    bold: false,
    italic: false,
    underline: false,
    tracking: 0,
    lineHeight: 1.2,
    bullet: false,
    role: 'free',
    opacity: 1,
    // P6a (04/08) — text MỚI mặc định để hệ tự dò AA khi đè ảnh (xem TextElement.colorAuto).
    // `...partial` đứng SAU nên caller (template/region-layout) vẫn override được nếu cần.
    colorAuto: true,
    ...partial,
  };
}

export function makeImage(src: string, partial: Partial<ImageElement> = {}): ImageElement {
  return {
    id: newId('img'),
    kind: 'image',
    frame: { x: 10, y: 10, w: 40, h: 50, rotation: 0 },
    src,
    adjust: { ...DEFAULT_ADJUST },
    crop: { ...FULL_CROP },
    radius: 0,
    opacity: 1,
    ...partial,
  };
}

export function makeShape(shape: ShapeKind, partial: Partial<ShapeElement> = {}): ShapeElement {
  return {
    id: newId('shp'),
    kind: 'shape',
    shape,
    frame: { x: 20, y: 20, w: 30, h: 20, rotation: 0 },
    fill: shape === 'line' ? 'transparent' : '#8a6f4d',
    stroke: '#8a6f4d',
    strokeWidth: shape === 'line' ? 3 : 0,
    radius: 0,
    // đa giác mặc định 5 cạnh (ngũ giác) — chỉnh xuống 3 = tam giác, tăng lên = lục/thất giác…
    sides: shape === 'polygon' ? 5 : undefined,
    opacity: 1,
    ...partial,
  };
}

/** Kiểu danh sách hiệu dụng của 1 text element (suy từ listStyle mới hoặc bullet cũ). */
export function effectiveListStyle(el: {
  listStyle?: ListStyle;
  bullet?: boolean;
}): ListStyle {
  if (el.listStyle) return el.listStyle;
  return el.bullet ? 'bullet' : 'none';
}

/**
 * Áp tiền tố danh sách (bullet "•  " / số "1.  ") vào từng DÒNG LOGIC của text.
 * Dùng CHUNG cho canvas (Element/EditorCanvas) và export (render.ts) để 1 nguồn sự thật.
 */
export function decorateListText(text: string, style: ListStyle): string {
  if (style === 'none') return text;
  let n = 0;
  return text
    .split('\n')
    .map((line) => {
      if (!line.trim()) return line;
      if (style === 'bullet') return `•  ${line}`;
      n += 1;
      return `${n}.  ${line}`;
    })
    .join('\n');
}

/** Bản sao sâu, serialize được (đủ cho model phẳng). */
export function cloneDeck(d: EditorDeck): EditorDeck {
  return JSON.parse(JSON.stringify(d));
}

/**
 * Nhân bản 1 element: sao sâu + cấp id mới + dời nhẹ (2%) để thấy được bản mới.
 * Dùng cho Ctrl+D và paste. `offset=false` khi paste vào slide khác (giữ nguyên vị trí).
 */
export function duplicateElement(el: SlideElement, offset = true): SlideElement {
  const copy: SlideElement = JSON.parse(JSON.stringify(el));
  copy.id = newId(el.kind);
  if (offset) {
    copy.frame = {
      ...copy.frame,
      x: Math.min(copy.frame.x + 2, 95),
      y: Math.min(copy.frame.y + 2, 95),
    };
  }
  copy.locked = false; // bản sao luôn mở khoá cho tiện chỉnh
  return copy;
}

/**
 * Nhân bản 1 LÔ phần tử (Ctrl+D nhiều phần tử đang chọn / dán nhiều phần tử đã sao chép) —
 * ánh xạ groupId CŨ → groupId MỚI nhất quán TRONG LÔ này (P2/E1 "nhóm"). Bản sao của các phần
 * tử cùng cụm gốc vẫn dính cụm VỚI NHAU, nhưng KHÔNG kế thừa đúng groupId gốc (tránh gộp lầm
 * bản sao vào cụm cũ đang tồn tại) và KHÔNG bị xoá trắng groupId (tránh rã lầm cụm của bản
 * sao). Phần tử không thuộc cụm nào (`groupId` rỗng) thì bản sao cũng vậy — không đổi hành vi
 * cho deck cũ trước tính năng nhóm.
 */
export function duplicateElementsPreservingGroups(els: SlideElement[], offset = true): SlideElement[] {
  const groupMap = new Map<string, string>();
  return els.map((el) => {
    const copy = duplicateElement(el, offset);
    if (el.groupId) {
      let ng = groupMap.get(el.groupId);
      if (!ng) {
        ng = newId('grp');
        groupMap.set(el.groupId, ng);
      }
      copy.groupId = ng;
    }
    return copy;
  });
}

/** Chuỗi CSS filter từ ImageAdjust — dùng cho hiển thị live VÀ tái dựng khi export. */
export function adjustToCssFilter(a: ImageAdjust | undefined): string {
  if (!a) return 'none';
  const parts = [
    `brightness(${a.brightness}%)`,
    `contrast(${a.contrast}%)`,
    `saturate(${a.saturate}%)`,
  ];
  // Nhiệt độ: ấm → sepia + hue nhẹ về vàng; lạnh → hue về xanh.
  if (a.temperature > 0) parts.push(`sepia(${Math.min(a.temperature, 100) * 0.6}%)`);
  else if (a.temperature < 0) parts.push(`hue-rotate(${a.temperature * 0.6}deg)`);
  return parts.join(' ');
}
