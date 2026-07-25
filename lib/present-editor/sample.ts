/**
 * lib/present-editor/sample.ts — Deck MẪU để mở /present-editor phát triển & test.
 *
 * `makeSampleDeck()` trả về deck Atelier Nord · Lumen Villa 8 slide (quiet-luxury editorial, ảnh
 * /demo/*) — dùng để CHỨNG MINH chất lượng trình dàn trang. Định nghĩa ở ./akh-sample.
 *
 * Deck 4 slide gọn (ảnh /public/covers) vẫn giữ ở `makeShortDemoDeck()` để dev nhanh.
 *
 * ⛔ LUẬT TRUNG TÍNH: mọi deck mẫu trong file này dùng studio/dự án HƯ CẤU (Atelier Nord ·
 * Lumen Villa · Nord Complex). KHÔNG đưa tên khách thật vào deck mẫu của sản phẩm.
 */

import type { EditorDeck } from './model';
import { BUILTIN_TEMPLATES } from './templates';
import { makeAkhIkiDeck } from './akh-sample';
export { makeEnsoDemoDeck } from './demo-enso-sample';

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

/** Deck mặc định editor = Atelier Nord generic (proof quiet-luxury, ảnh /demo).
 *  Deck dài hơn (makeEnsoDemoDeck) / gọn hơn (makeShortDemoDeck) chỉ mở TƯỜNG MINH khi cần
 *  — xem docs/CONTENT-RULES.md §3. */
export function makeSampleDeck(): EditorDeck {
  return makeAkhIkiDeck();
}

/** Deck DEMO 4 slide gọn (giữ để đối chiếu / dev nhanh). Studio + dự án hư cấu. */
export function makeShortDemoDeck(): EditorDeck {
  const slides = [
    tpl('cover').build({
      kicker: 'ATELIER NORD — CONCEPT 2026',
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
    brand: 'ATELIER NORD · NỘI THẤT',
    project: 'Nord Residence — Không gian trưng bày',
    fonts: 'Editorial',
    palette: PALETTE,
    slides,
  };
}
