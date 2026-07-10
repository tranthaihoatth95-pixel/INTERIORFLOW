/**
 * lib/present-editor/sample.ts — Deck MẪU để mở /present-editor phát triển & test.
 *
 * `makeSampleDeck()` giờ trả về deck AKH-IKI 8 slide (chuẩn quiet-luxury editorial, ảnh
 * /demo/*) — dùng để CHỨNG MINH chất lượng trình dàn trang. Định nghĩa ở ./akh-sample.
 *
 * Deck DETECH cũ (ảnh /public/covers) vẫn giữ ở `makeDetechDeck()` để tiện đối chiếu.
 */

import type { EditorDeck } from './model';
import { BUILTIN_TEMPLATES } from './templates';
import { makeAkhIkiDeck } from './akh-sample';
import { makeDetechEnsoDeck } from './detech-sample';

const PALETTE = ['#EFE9DC', '#C2AD86', '#8A6A3A', '#6E4A2E', '#3B352F', '#28211A'];
const COVERS = [
  '/covers/render_00.jpeg',
  '/covers/render_03.jpeg',
  '/covers/render_04.jpeg',
  '/covers/render_05.jpeg',
];

function tpl(id: string) {
  return BUILTIN_TEMPLATES.find((t) => t.id === id)!;
}

/** Deck mặc định editor. TẠM trỏ deck Detech ENSŌ để TEST present bằng nội dung thật.
 *  (đổi về makeAkhIkiDeck() nếu muốn deck proof quiet-luxury.) */
export function makeSampleDeck(): EditorDeck {
  return makeDetechEnsoDeck();
}

/** Deck DETECH 4 slide cũ (giữ để đối chiếu / dev nhanh). */
export function makeDetechDeck(): EditorDeck {
  const slides = [
    tpl('cover').build({
      kicker: 'DETECH — CONCEPT 2026',
      title: 'Không gian sống, kể theo ánh sáng',
      body: ['Bộ trình bày concept nội thất', 'Ngôn ngữ quiet-luxury, vật liệu ấm'],
      images: [COVERS[0]],
      palette: PALETTE,
    }),
    tpl('content-image').build({
      kicker: '01 — Ý NIỆM',
      title: 'Tối giản mà ấm, sang mà tĩnh',
      body: [
        'Bảng vật liệu trầm — đá, gỗ và vải mộc.',
        'Đường nét gọn, khối hình rõ ràng.',
        'Mỗi không gian giữ một nhịp nghỉ cho mắt.',
      ],
      images: [COVERS[1]],
      palette: PALETTE,
    }),
    tpl('grid').build({
      title: 'Bảng hình tham chiếu',
      images: COVERS,
      palette: PALETTE,
    }),
    tpl('quote').build({
      title: 'Ánh sáng là vật liệu đắt nhất của một căn phòng.',
      body: ['Studio nội thất'],
      palette: PALETTE,
    }),
  ];

  return {
    id: 'sample',
    brand: 'DETECH · NỘI THẤT',
    project: 'Detech — Không gian trưng bày',
    fonts: 'Editorial',
    palette: PALETTE,
    slides,
  };
}
