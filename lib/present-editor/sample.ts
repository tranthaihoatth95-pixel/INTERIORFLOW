/**
 * lib/present-editor/sample.ts — Deck MẪU để mở /present-editor phát triển & test.
 *
 * Dùng ảnh render Detech có sẵn trong /public/covers (0 mạng, 0 AI). Nếu thư viện
 * Reference trống, editor vẫn chạy với deck này + template builtin.
 */

import type { EditorDeck } from './model';
import { BUILTIN_TEMPLATES } from './templates';

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

export function makeSampleDeck(): EditorDeck {
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
