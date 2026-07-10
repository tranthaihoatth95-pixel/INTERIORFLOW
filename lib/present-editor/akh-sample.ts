/**
 * lib/present-editor/akh-sample.ts — Deck MẪU chuẩn "AKH-IKI showunit" để CHỨNG MINH
 * chất lượng trình dàn trang Present (quiet-luxury editorial nội thất).
 *
 * Bám sát 2 deck tham khảo thật (test-input/4. Present tham khao):
 *   - MOODBOARD: bìa tối điện ảnh + serif mảnh, tab-label header + breadcrumb, lưới 4 cột
 *     triết lý, moodboard collage, material board (tiêu đề serif dọc), palette vật liệu.
 *   - 3D PERSPECTIVE: bìa full-bleed, hero phối cảnh + caption, mặt bằng kỹ thuật.
 *
 * Model PHẲNG (EditorDeck) → tái dùng ĐƯỢC: mở /present-editor, export PDF/PPTX, và dựng
 * lại nguyên xi ra HTML proof (test-input/_results/present/deck.html).
 *
 * Ảnh: dùng /demo/* (đã phục vụ ở http://localhost:3000/demo/* và có trên đĩa public/demo/*).
 * KHÔNG hardcode gu — palette đá ấm/xanh trầm/đồng lấy từ chính bộ tham khảo.
 */

import type { EditorDeck } from './model';
import { BUILTIN_TEMPLATES } from './templates';

/** Palette gu quiet-luxury: kem đá → be → đồng → nâu trầm → than → mực. */
export const AKH_PALETTE = ['#EFE9DC', '#C9B79A', '#A98A5B', '#6E5A3E', '#3B4038', '#211E1A'];

/** Ảnh demo phục vụ tại /demo/* (dùng cho hero, moodboard, vật liệu). */
export const DEMO = {
  hero1: '/demo/clay-4k.jpg',
  hero2: '/demo/clay-out.png',
  sketch: '/demo/sketch-out.png',
  mood1: '/demo/mood1.jpg',
  mood2: '/demo/mood2.jpg',
  mood3: '/demo/mood3.jpg',
  mood4: '/demo/mood4.jpg',
};

function tpl(id: string) {
  const t = BUILTIN_TEMPLATES.find((x) => x.id === id);
  if (!t) throw new Error(`template không tồn tại: ${id}`);
  return t;
}

/**
 * Deck 8 slide theo mạch AKH-IKI:
 *   1. dark-cover        — bìa tối điện ảnh, hero + serif mảnh căn giữa.
 *   2. section-divider   — trang phân mục (số lớn "01" + tiêu đề).
 *   3. full-bleed        — hero phối cảnh 3D tràn viền + caption dưới.
 *   4. grid4-philosophy  — lưới 4 cột triết lý (header tab-label + breadcrumb + hairline).
 *   5. moodboard-board   — moodboard hero + hàng swatch vật liệu.
 *   6. material-flatlay  — bảng vật liệu: tiêu đề serif dọc + strip màu + nhãn hex.
 *   7. compare           — so sánh 2 phương án (đã fix divider dọc).
 *   8. catalog-index     — danh mục nội thất (nhãn hạng mục + lưới ảnh) đóng deck.
 */
export function makeAkhIkiDeck(): EditorDeck {
  const P = AKH_PALETTE;
  const slides = [
    tpl('dark-cover').build({
      kicker: 'Design Framework · Draft Moodboard',
      title: 'IKI VILLAGE',
      images: [DEMO.hero1],
      palette: P,
    }),
    tpl('section-divider').build({
      kicker: 'Phần 01',
      title: 'Cơ sở hình thành ý tưởng',
      body: [
        'Ngôn ngữ hiện đại, tiết chế — nhấn mạnh nhịp đứng, lớp, chiều sâu.',
        'Dòng chảy liên tục, mềm mại, kết nối các khối như một hệ sinh thái.',
      ],
      palette: P,
    }),
    tpl('full-bleed').build({
      kicker: 'Concept Design Proposal · Interior',
      title: 'Không gian sống kể theo ánh sáng',
      images: [DEMO.hero2],
      palette: P,
    }),
    tpl('grid4-philosophy').build({
      kicker: 'Triết lý thiết kế',
      title: 'IKI VILLAGE — Moodboard',
      body: ['Mang lại giá trị', 'Cá nhân trong cộng đồng', 'Cân bằng & bền vững', 'Phát triển theo tầng sống'],
      images: [DEMO.mood1, DEMO.mood2, DEMO.mood3, DEMO.mood4],
      palette: P,
    }),
    tpl('moodboard-board').build({
      kicker: 'Design Framework',
      title: 'Bảng cảm hứng không gian',
      body: ['Đá ấm', 'Gỗ sồi', 'Vải mộc', 'Đồng thau'],
      images: [DEMO.hero1, DEMO.mood1, DEMO.mood2, DEMO.mood3, DEMO.mood4],
      palette: P,
    }),
    tpl('material-flatlay').build({
      kicker: 'Material Board',
      title: 'Bảng vật liệu',
      body: ['Đá kem', 'Gỗ trầm', 'Đồng thau', 'Xanh rêu', 'Than chì'],
      images: [DEMO.mood4],
      palette: P,
    }),
    tpl('compare').build({
      title: 'Hai hướng cảm xúc',
      body: [
        'Vitalis — năng động, kết nối, chuyển động',
        'Nhịp sống rõ ràng, hiện đại',
        'Harmonie — cân bằng, chiều sâu, an trú',
        'Ấm cúng, đa thế hệ',
      ],
      images: [DEMO.mood2, DEMO.mood3],
      palette: P,
    }),
    tpl('catalog-index').build({
      title: 'Danh mục không gian',
      body: ['Phòng khách', 'Phòng ngủ', 'Bếp & đảo'],
      images: [DEMO.hero1, DEMO.hero2, DEMO.sketch, DEMO.mood1, DEMO.mood2, DEMO.mood3],
      palette: P,
    }),
  ];

  return {
    id: 'akh-iki',
    brand: 'AKH · IKI VILLAGE',
    project: 'IKI Village — Show Unit Moodboard',
    fonts: 'Elegant',
    palette: P,
    slides,
    transition: 'fade',
    reveal: 'rise',
  };
}
