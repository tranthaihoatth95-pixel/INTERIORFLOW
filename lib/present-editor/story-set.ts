/**
 * lib/present-editor/story-set.ts — [storySet] STORY SET v1: "Bộ Hồ Sơ Kể Chuyện Không Gian".
 *
 * Hero output của IF (chốt 11/08 đêm, docs/00-CHOT.md mục "[11/08 đêm — CHỐT HERO OUTPUT]"):
 * hồ sơ dự án "đọc như tạp chí quiet-luxury", 6 chương → dựng thành template family THẬT
 * (~8 trang EditorDeck) trong chặng Trình chiếu:
 *   ①  Bìa editorial serif-kem (REF-VISUAL #1 Booksaw)
 *   ②  DNA board — lưới ảnh + palette + câu ý đồ
 *   ③④ Câu chuyện không gian — ảnh lớn + caption · trang zoning
 *   ⑤⑥ Hình ảnh điện ảnh — full-bleed · so sánh sáng/tối
 *   ⑦  Vật liệu như tạp chí — lưới thẻ ảnh + tên + mã
 *   ⑧  Phụ lục sự thật — bản vẽ + BOQ đính kèm, mọi con số truy về một nguồn
 *
 * Human-in-the-loop: đây là DECK THẬT người dùng sửa tự do sau khi nạp — chữ mẫu tiếng Việt
 * thật (không lorem), mọi khung ảnh hoặc là PLACEHOLDER có nhãn rõ, hoặc (bản MẪU) là ảnh
 * minh hoạ Unsplash để template không "giả trân".
 *
 * ẢNH MINH HOẠ — Unsplash License (unsplash.com/license): dùng miễn phí, không cần attribution.
 * Đây là ảnh minh hoạ CỦA TEMPLATE, người dùng thay bằng ảnh render dự án của mình.
 * Mỗi URL đã verify `curl -sI` → HTTP 200 + content-type image/jpeg (12/08/2026).
 *
 * KHÔNG import store/registry/DOM — thuần, test được bằng sucrase-node (cùng khuôn templates.ts).
 */

import type { EditorDeck, EditorSlide, SlideElement } from './model';
import { makeText, makeImage, makeShape, newId, DEFAULT_ADJUST } from './model';
import { paletteRoles } from './theme-roles';

/* ------------------------------------------------------------------ */
/* Nguyên liệu chung                                                   */
/* ------------------------------------------------------------------ */

/**
 * Palette kem editorial của Story Set — họ giấy #F5F1EA (khớp fallback quiet-luxury của
 * theme-roles.ts, KHÔNG chế màu mới ngoài gu). Người dùng nhuộm lại theo Brand Kit dự án
 * bất cứ lúc nào (rethemeDeck) — template chỉ mang gu khởi điểm.
 */
export const STORY_SET_PALETTE = ['#f5f1ea', '#e7dfd1', '#c7a397', '#8a6f4d', '#4a443a', '#221f1a'];

/** Serif editorial cho display lớn — đúng dải serif đã có trong CURATED_FONTS (fonts.ts). */
const SERIF_DISPLAY = '"Cormorant Garamond", Cormorant, Georgia, "Times New Roman", serif';

/**
 * Ảnh minh hoạ Unsplash cho bản MẪU (lệnh Hoà 12/08: template không được "giả trân").
 * Toàn ảnh nội thất/không gian; index cố định để mỗi chương lấy đúng vai ảnh của nó.
 * Unsplash License — người dùng thay bằng ảnh dự án. Đã verify 200 + image/* (xem đầu file).
 */
export const STORY_SET_SAMPLE_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=75', // 0 hero phòng khách
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=75', // 1 chi tiết ghế/vải
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=75', // 2 phòng khách ấm
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=75', // 3 góc decor
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=75', // 4 căn hộ ban ngày
  'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=1200&q=75', // 5 phòng ngủ tối ấm
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=75', // 6 hành lang/gỗ
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=75', // 7 không gian mở
];

export interface StorySetOptions {
  /** Tên dự án in trên bìa. Bỏ trống = "Tên dự án". */
  projectName?: string;
  /** Một dòng tagline dưới tên. */
  tagline?: string;
  /** Palette ghi đè (Brand Kit dự án). Bỏ trống = palette kem Story Set. */
  palette?: string[];
  /** Ảnh của NGƯỜI DÙNG theo thứ tự ưu tiên — có thì thay chỗ ảnh minh hoạ. */
  images?: string[];
  /**
   * true (mặc định) = khung ảnh của bản MẪU dùng ảnh minh hoạ Unsplash;
   * false = mọi khung ảnh là placeholder có nhãn "Thả ảnh render vào đây".
   */
  sampleImages?: boolean;
}

type Roles = ReturnType<typeof paletteRoles>;

/** Ảnh thứ i: ưu tiên ảnh người dùng → ảnh mẫu (nếu bật) → undefined (placeholder). */
function pick(opts: StorySetOptions, i: number): string | undefined {
  const user = opts.images?.filter(Boolean) ?? [];
  if (user.length) return user[i % user.length];
  if (opts.sampleImages === false) return undefined;
  return STORY_SET_SAMPLE_IMAGES[i % STORY_SET_SAMPLE_IMAGES.length];
}

/**
 * Khung ảnh: có src → ảnh thật; chưa có → placeholder NHÃN RÕ ("Thả ảnh render vào đây")
 * — không phải ô xám câm, người dùng biết phải làm gì (SPEC-NGON-NGU-CHI-DAN: luôn nói hành động).
 */
function photoFrame(
  src: string | undefined,
  frame: SlideElement['frame'],
  c: Roles,
  label = 'Thả ảnh render vào đây',
  radius = 2,
): SlideElement[] {
  if (src) return [makeImage(src, { frame, radius })];
  const els: SlideElement[] = [
    makeShape('rect', {
      frame,
      fill: c.muted,
      stroke: 'transparent',
      strokeWidth: 0,
      radius,
      opacity: 0.4,
    }),
  ];
  els.push(
    makeText({
      text: label,
      role: 'free',
      frame: { x: frame.x + 2, y: frame.y + frame.h / 2 - 2.5, w: frame.w - 4, h: 5, rotation: 0 },
      fontSize: Math.min(1.9, Math.max(1.4, frame.w / 14)),
      color: c.dark,
      align: 'center',
      opacity: 0.65,
    }),
  );
  return els;
}

const slide = (templateId: string, background: string, elements: SlideElement[]): EditorSlide => ({
  id: newId('sld'),
  background,
  elements,
  templateId,
});

/* ------------------------------------------------------------------ */
/* buildStorySetDeck                                                   */
/* ------------------------------------------------------------------ */

/** Dựng trọn bộ Story Set v1 (8 trang) thành một EditorDeck sửa tự do. */
export function buildStorySetDeck(opts: StorySetOptions = {}): EditorDeck {
  const palette = opts.palette && opts.palette.length ? opts.palette : [...STORY_SET_PALETTE];
  const c = paletteRoles(palette);
  const cream = c.light;
  const project = (opts.projectName || 'Tên dự án').trim() || 'Tên dự án';
  const tagline = opts.tagline || 'Một không gian kể câu chuyện của người sống trong nó';
  const slides: EditorSlide[] = [];

  /* ① BÌA — editorial serif-kem, căn giữa, nhiều khoảng thở (ref #1 Booksaw). */
  slides.push(
    slide('story-cover', cream, [
      makeText({
        text: 'HỒ SƠ THIẾT KẾ NỘI THẤT',
        role: 'kicker',
        frame: { x: 20, y: 16, w: 60, h: 5, rotation: 0 },
        fontSize: 1.9,
        color: c.accent,
        align: 'center',
        bold: true,
        tracking: 6,
      }),
      makeText({
        text: project,
        role: 'title',
        frame: { x: 8, y: 30, w: 84, h: 26, rotation: 0 },
        fontSize: 11,
        color: c.dark,
        align: 'center',
        lineHeight: 1.04,
        fontFamily: SERIF_DISPLAY,
      }),
      makeShape('line', {
        frame: { x: 46, y: 60, w: 8, h: 0.4, rotation: 0 },
        stroke: c.accent,
        strokeWidth: 2,
      }),
      makeText({
        text: tagline,
        role: 'body',
        frame: { x: 20, y: 64, w: 60, h: 8, rotation: 0 },
        fontSize: 2.4,
        color: c.dark,
        align: 'center',
        italic: true,
        lineHeight: 1.4,
        fontFamily: SERIF_DISPLAY,
        opacity: 0.85,
      }),
      makeText({
        text: 'BỘ HỒ SƠ KỂ CHUYỆN · STORY SET',
        role: 'free',
        frame: { x: 25, y: 88, w: 50, h: 4, rotation: 0 },
        fontSize: 1.4,
        color: c.dark,
        align: 'center',
        tracking: 4,
        opacity: 0.55,
      }),
    ]),
  );

  /* ② DNA BOARD — lưới 6 ô ảnh + cột palette 5 swatch + câu ý đồ. */
  {
    const els: SlideElement[] = [
      makeText({
        text: 'CHƯƠNG 01 · DNA CỦA DỰ ÁN',
        role: 'kicker',
        frame: { x: 5, y: 5, w: 60, h: 4, rotation: 0 },
        fontSize: 1.8,
        color: c.accent,
        bold: true,
        tracking: 3,
      }),
      makeText({
        text: 'Chất liệu của câu chuyện',
        role: 'title',
        frame: { x: 5, y: 10, w: 62, h: 9, rotation: 0 },
        fontSize: 4.8,
        color: c.dark,
        fontFamily: SERIF_DISPLAY,
      }),
    ];
    // lưới 3×2 ảnh mood bên trái
    const cellW = 20.5;
    const cellH = 34;
    const gap = 1.6;
    for (let r = 0; r < 2; r++) {
      for (let col = 0; col < 3; col++) {
        const i = r * 3 + col;
        els.push(
          ...photoFrame(
            pick(opts, i),
            { x: 5 + col * (cellW + gap), y: 22 + r * (cellH + gap), w: cellW, h: cellH, rotation: 0 },
            c,
            'Thả ảnh mood vào đây',
          ),
        );
      }
    }
    // cột phải: 5 swatch + câu ý đồ
    const chips = palette.slice(0, 5);
    chips.forEach((hex, i) => {
      els.push(
        makeShape('rect', {
          frame: { x: 73 + i * 4.6, y: 24, w: 4, h: 7, rotation: 0 },
          fill: hex,
          stroke: 'transparent',
          strokeWidth: 0,
          radius: 1,
        }),
      );
    });
    els.push(
      makeText({
        text: 'BẢNG MÀU CHỦ ĐẠO',
        role: 'free',
        frame: { x: 73, y: 32.5, w: 22, h: 3.5, rotation: 0 },
        fontSize: 1.4,
        color: c.dark,
        tracking: 2,
        opacity: 0.6,
      }),
      makeText({
        text: 'Ấm mà không nặng. Gỗ sồi tự nhiên, vải thô màu kem và ánh sáng xiên buổi chiều — ba chất liệu giữ nhịp cho toàn bộ không gian.',
        role: 'body',
        frame: { x: 73, y: 40, w: 22, h: 34, rotation: 0 },
        fontSize: 2,
        color: c.dark,
        lineHeight: 1.55,
        italic: true,
        fontFamily: SERIF_DISPLAY,
      }),
      makeText({
        text: 'Sửa câu ý đồ theo dự án của bạn — đây là chữ ký DNA của mỗi công trình.',
        role: 'free',
        frame: { x: 73, y: 78, w: 22, h: 12, rotation: 0 },
        fontSize: 1.5,
        color: c.dark,
        lineHeight: 1.5,
        opacity: 0.55,
      }),
    );
    slides.push(slide('story-dna', cream, els));
  }

  /* ③ CÂU CHUYỆN KHÔNG GIAN — ảnh lớn + cột caption. */
  slides.push(
    slide('story-space', cream, [
      ...photoFrame(pick(opts, 2), { x: 5, y: 8, w: 56, h: 84, rotation: 0 }, c),
      makeText({
        text: 'CHƯƠNG 02 · CÂU CHUYỆN KHÔNG GIAN',
        role: 'kicker',
        frame: { x: 65, y: 14, w: 30, h: 4, rotation: 0 },
        fontSize: 1.7,
        color: c.accent,
        bold: true,
        tracking: 2.5,
      }),
      makeText({
        text: 'Phòng khách — nơi mọi lối đi gặp nhau',
        role: 'title',
        frame: { x: 65, y: 20, w: 30, h: 16, rotation: 0 },
        fontSize: 4,
        color: c.dark,
        lineHeight: 1.15,
        fontFamily: SERIF_DISPLAY,
      }),
      makeShape('line', {
        frame: { x: 65, y: 39, w: 7, h: 0.4, rotation: 0 },
        stroke: c.accent,
        strokeWidth: 2,
      }),
      makeText({
        text: 'Sofa quay về phía cửa sổ lớn để giữ ánh sáng tự nhiên làm nhân vật chính. Kệ gỗ chạy suốt bức tường dài vừa là chỗ trưng bày, vừa dẫn mắt về phía bàn ăn — một đường kể chuyện liền mạch từ cửa vào đến ban công.',
        role: 'body',
        frame: { x: 65, y: 43, w: 30, h: 34, rotation: 0 },
        fontSize: 2.1,
        color: c.dark,
        lineHeight: 1.6,
      }),
      makeText({
        text: 'Ảnh: góc nhìn tầm mắt 1.55m · ánh sáng 16h chiều',
        role: 'free',
        frame: { x: 65, y: 84, w: 30, h: 5, rotation: 0 },
        fontSize: 1.5,
        color: c.dark,
        opacity: 0.55,
        italic: true,
      }),
    ]),
  );

  /* ④ ZONING — khung sơ đồ placeholder + ghi chú (nối từ chặng 2D). */
  slides.push(
    slide('story-zoning', cream, [
      makeText({
        text: 'CHƯƠNG 02 · PHÂN VÙNG CÔNG NĂNG',
        role: 'kicker',
        frame: { x: 5, y: 6, w: 60, h: 4, rotation: 0 },
        fontSize: 1.8,
        color: c.accent,
        bold: true,
        tracking: 3,
      }),
      makeText({
        text: 'Mặt bằng kể trước, hình ảnh kể sau',
        role: 'title',
        frame: { x: 5, y: 11, w: 62, h: 9, rotation: 0 },
        fontSize: 4.4,
        color: c.dark,
        fontFamily: SERIF_DISPLAY,
      }),
      // khung zoning LUÔN là placeholder có nhãn — sơ đồ phải lấy từ bản vẽ thật của dự án,
      // template không giả một mặt bằng "trông như thật" (CONTENT-RULES: không trộn demo/thật).
      ...photoFrame(
        undefined,
        { x: 5, y: 23, w: 60, h: 68, rotation: 0 },
        c,
        'Thả sơ đồ zoning / mặt bằng bố trí từ chặng 2D vào đây',
      ),
      makeText({
        text: 'Khách — bếp — ăn nhìn nhau trong một trục mở\nPhòng ngủ lùi về dải yên tĩnh phía trong\nKho + phụ trợ gom về lõi kỹ thuật, giấu khỏi tầm mắt',
        role: 'body',
        frame: { x: 69, y: 26, w: 26, h: 40, rotation: 0 },
        fontSize: 2,
        color: c.dark,
        lineHeight: 1.7,
        listStyle: 'bullet',
      }),
      makeText({
        text: 'Sơ đồ nối từ bản vẽ 2D của dự án — cập nhật bản vẽ thì thay ảnh mới tại đây.',
        role: 'free',
        frame: { x: 69, y: 72, w: 26, h: 14, rotation: 0 },
        fontSize: 1.5,
        color: c.dark,
        lineHeight: 1.5,
        opacity: 0.55,
      }),
    ]),
  );

  /* ⑤ HÌNH ẢNH ĐIỆN ẢNH — full-bleed, chữ đè đáy. */
  {
    const hero = pick(opts, 4);
    const s: EditorSlide = {
      id: newId('sld'),
      background: c.dark,
      backgroundImage: hero ?? null,
      backgroundAdjust: { ...DEFAULT_ADJUST, brightness: 80 },
      elements: [],
      templateId: 'story-cinema',
    };
    if (!hero) {
      s.elements.push(
        makeText({
          text: 'Thả ảnh render toàn cảnh vào nền trang này (nút "Ảnh nền" của slide)',
          role: 'free',
          frame: { x: 20, y: 42, w: 60, h: 6, rotation: 0 },
          fontSize: 2,
          color: c.light,
          align: 'center',
          opacity: 0.7,
        }),
      );
    }
    s.elements.push(
      makeText({
        text: 'CHƯƠNG 03 · HÌNH ẢNH',
        role: 'kicker',
        frame: { x: 6, y: 74, w: 60, h: 4, rotation: 0 },
        fontSize: 1.8,
        color: '#ffffff',
        bold: true,
        tracking: 4,
      }),
      makeText({
        text: 'Ánh sáng kể giờ trong ngày',
        role: 'title',
        frame: { x: 6, y: 79, w: 76, h: 13, rotation: 0 },
        fontSize: 6.5,
        color: '#ffffff',
        lineHeight: 1.05,
        fontFamily: SERIF_DISPLAY,
      }),
    );
    slides.push(s);
  }

  /* ⑥ SO SÁNH SÁNG/TỐI — 2 ảnh cạnh nhau. */
  slides.push(
    slide('story-daynight', cream, [
      makeText({
        text: 'Cùng một góc — hai thời khắc',
        role: 'title',
        frame: { x: 5, y: 7, w: 70, h: 8, rotation: 0 },
        fontSize: 4.2,
        color: c.dark,
        fontFamily: SERIF_DISPLAY,
      }),
      ...photoFrame(pick(opts, 3), { x: 5, y: 19, w: 44, h: 62, rotation: 0 }, c, 'Thả ảnh ban ngày vào đây'),
      ...photoFrame(pick(opts, 5), { x: 51, y: 19, w: 44, h: 62, rotation: 0 }, c, 'Thả ảnh buổi tối vào đây'),
      makeText({
        text: 'BAN NGÀY · 10H',
        role: 'kicker',
        frame: { x: 5, y: 83, w: 44, h: 4, rotation: 0 },
        fontSize: 1.6,
        color: c.accent,
        bold: true,
        tracking: 3,
      }),
      makeText({
        text: 'BUỔI TỐI · 20H',
        role: 'kicker',
        frame: { x: 51, y: 83, w: 44, h: 4, rotation: 0 },
        fontSize: 1.6,
        color: c.accent,
        bold: true,
        tracking: 3,
      }),
      makeText({
        text: 'Ánh sáng ban ngày phô vật liệu; đèn buổi tối thu không gian lại quanh bàn ăn.',
        role: 'body',
        frame: { x: 5, y: 88, w: 90, h: 6, rotation: 0 },
        fontSize: 2,
        color: c.dark,
        opacity: 0.75,
        italic: true,
      }),
    ]),
  );

  /* ⑦ VẬT LIỆU NHƯ TẠP CHÍ — lưới 6 thẻ (ảnh + tên + mã). */
  {
    const els: SlideElement[] = [
      makeText({
        text: 'CHƯƠNG 04 · VẬT LIỆU',
        role: 'kicker',
        frame: { x: 5, y: 5, w: 60, h: 4, rotation: 0 },
        fontSize: 1.8,
        color: c.accent,
        bold: true,
        tracking: 3,
      }),
      makeText({
        text: 'Bảng vật liệu chính',
        role: 'title',
        frame: { x: 5, y: 10, w: 62, h: 8, rotation: 0 },
        fontSize: 4.4,
        color: c.dark,
        fontFamily: SERIF_DISPLAY,
      }),
      makeText({
        text: 'Tên + mã nối về thư viện vật liệu của dự án — đổi vật liệu ở đây, BOQ ở phụ lục đổi theo.',
        role: 'free',
        frame: { x: 60, y: 11.5, w: 35, h: 6, rotation: 0 },
        fontSize: 1.6,
        color: c.dark,
        align: 'right',
        lineHeight: 1.4,
        opacity: 0.6,
      }),
    ];
    const mats: { name: string; code: string }[] = [
      { name: 'Gỗ sồi tự nhiên', code: 'VL-01 · WD-OAK-N' },
      { name: 'Đá thạch anh kem', code: 'VL-02 · ST-QTZ-CR' },
      { name: 'Vải thô linen', code: 'VL-03 · FB-LIN-04' },
      { name: 'Sơn hiệu ứng đất', code: 'VL-04 · PT-CLAY-2' },
      { name: 'Kim loại đồng mờ', code: 'VL-05 · MT-BRS-M' },
      { name: 'Gạch men vân đá', code: 'VL-06 · TL-STN-60' },
    ];
    const cellW = 28.5;
    const cellH = 26;
    const gap = 2.5;
    mats.forEach((m, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 5 + col * (cellW + gap);
      const y = 21 + row * (cellH + 12.5);
      els.push(...photoFrame(pick(opts, i + 1), { x, y, w: cellW, h: cellH, rotation: 0 }, c, 'Thả ảnh mẫu vật liệu'));
      els.push(
        makeText({
          text: m.name,
          role: 'body',
          frame: { x, y: y + cellH + 1.5, w: cellW, h: 4.5, rotation: 0 },
          fontSize: 2.1,
          color: c.dark,
          bold: true,
        }),
        makeText({
          text: m.code,
          role: 'free',
          frame: { x, y: y + cellH + 6, w: cellW, h: 3.5, rotation: 0 },
          fontSize: 1.5,
          color: c.dark,
          tracking: 1,
          opacity: 0.55,
        }),
      );
    });
    slides.push(slide('story-materials', cream, els));
  }

  /* ⑧ PHỤ LỤC SỰ THẬT — bản vẽ + BOQ đính kèm, nối từ nguồn. */
  slides.push(
    slide('story-appendix', cream, [
      makeText({
        text: 'CHƯƠNG 05 · PHỤ LỤC SỰ THẬT',
        role: 'kicker',
        frame: { x: 5, y: 6, w: 60, h: 4, rotation: 0 },
        fontSize: 1.8,
        color: c.accent,
        bold: true,
        tracking: 3,
      }),
      makeText({
        text: 'Mọi con số truy về một nguồn',
        role: 'title',
        frame: { x: 5, y: 11, w: 70, h: 9, rotation: 0 },
        fontSize: 4.4,
        color: c.dark,
        fontFamily: SERIF_DISPLAY,
      }),
      // hai khung đính kèm — LUÔN placeholder: dữ liệu thật phải đến từ bản vẽ/BOQ của dự án.
      ...photoFrame(
        undefined,
        { x: 5, y: 24, w: 44, h: 56, rotation: 0 },
        c,
        'Thả bản vẽ kỹ thuật (PDF/ảnh xuất từ chặng 2D) vào đây',
      ),
      ...photoFrame(
        undefined,
        { x: 51, y: 24, w: 44, h: 56, rotation: 0 },
        c,
        'Thả bảng BOQ (xuất từ Bảng tính BOQ) vào đây',
      ),
      makeText({
        text: 'BẢN VẼ KỸ THUẬT ĐÍNH KÈM',
        role: 'kicker',
        frame: { x: 5, y: 81.5, w: 44, h: 4, rotation: 0 },
        fontSize: 1.6,
        color: c.accent,
        bold: true,
        tracking: 2,
      }),
      makeText({
        text: 'BOQ — KHỐI LƯỢNG & NGUỒN GIÁ',
        role: 'kicker',
        frame: { x: 51, y: 81.5, w: 44, h: 4, rotation: 0 },
        fontSize: 1.6,
        color: c.accent,
        bold: true,
        tracking: 2,
      }),
      makeText({
        text: 'Hai khung này nối từ nguồn của dự án: bản vẽ lấy từ chặng 2D, khối lượng và giá lấy từ BOQ. Đổi vật liệu ở chương 4 thì cập nhật lại hai tài liệu nguồn rồi thay ảnh tại đây.',
        role: 'body',
        frame: { x: 5, y: 87, w: 90, h: 8, rotation: 0 },
        fontSize: 1.8,
        color: c.dark,
        lineHeight: 1.5,
        opacity: 0.7,
      }),
    ]),
  );

  return {
    id: newId('deck'),
    docType: 'deck',
    brand: '',
    project,
    fonts: 'Editorial',
    palette,
    slides,
  };
}
