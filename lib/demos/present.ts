// lib/demos/present.ts — demo CHẶNG PRESENT ("thực tế").
//
// Luồng trình khách 1 bộ slide 16:9: 4 nội dung concept (slide.concept) + 4 ảnh nguồn
// (input.image, nướng thật từ /public/detech) → 4 Slide Composer (Cover · Nội dung + ảnh
// ×2 · Quote), cùng lấy palette từ 1 ảnh style-ref → gom vào Export Deck.
// Thể loại: "Concept Sảnh Khách sạn 5 sao" — sát mảng khách sạn–resort của user.
//
// Ảnh nguồn (input.image) được NƯỚNG done() từ /public/detech nên hiện ngay, không cần
// upload. Các node slide.* (client-side, 0 credit) để IDLE — tự chạy khi bấm "Chạy flow".
// sealHashes() niêm inputHash cho node đã done để Run bỏ qua re-exec.

import { mk, edge, done, sealHashes, type DemoModule, type Seed } from './_shared';

// Nội dung concept (JSON hoá bởi slide.concept.execute → parseContent trong slides.ts).
const C1 = {
  kicker: 'Concept · Khách sạn 5 sao',
  title: 'Sảnh đón — nơi ánh sáng chào khách',
  body: [
    'Trình bày định hướng thiết kế sảnh lễ tân & lounge.',
    'Ngôn ngữ quiet-luxury: đá ấm, gỗ trầm, ánh sáng lọc.',
  ],
};
const C2 = {
  kicker: '01 — Ngôn ngữ vật liệu',
  title: 'Đá ấm, gỗ trầm, đồng hun',
  body: [
    '- Travertine mài dịu cho quầy lễ tân và mảng tường chính',
    '- Gỗ óc chó vân dọc ốp cột, gợi chiều cao sảnh',
    '- Đồng hun cho chi tiết tay nắm, phào và đèn',
    '- Vải mộc tông cát cho ghế lounge, đệm ngồi',
  ],
};
const C3 = {
  kicker: '02 — Ánh sáng & nhịp nghỉ',
  title: 'Sáng theo lớp, dẫn theo bước chân',
  body: [
    '- Ánh sáng gián tiếp hắt trần, không chói mắt khách',
    '- Mặt nước tĩnh phản chiếu, hạ nhịp khu chờ',
    '- Mảng xanh lounge làm điểm dừng cho mắt',
    '- Đèn điểm ấm 2700K giữ không khí về đêm',
  ],
};
const C4 = {
  kicker: '',
  title: 'Sảnh không phải điểm đi qua — mà là ấn tượng đầu tiên được giữ lại.',
  body: ['Định hướng thiết kế · TTT Architects'],
};

function build(): Seed {
  // ---- Ảnh nguồn: nướng done() từ /public/detech (hiện ngay) ----
  const ref = mk('input.image', 40, 60); // style-ref: nguồn palette cho cả deck
  ref.data.params.file = '/detech/mat-palette.png';
  ref.data.run = done('/detech/mat-palette.png');

  const h1 = mk('input.image', 40, 260);
  h1.data.params.file = '/detech/lobby-water.png';
  h1.data.run = done('/detech/lobby-water.png');

  const h2 = mk('input.image', 40, 460);
  h2.data.params.file = '/detech/lounge-green.png';
  h2.data.run = done('/detech/lounge-green.png');

  const h3 = mk('input.image', 40, 660);
  h3.data.params.file = '/detech/pool-zen.png';
  h3.data.run = done('/detech/pool-zen.png');

  // ---- Nội dung concept (client-side, IDLE) ----
  function concept(x: number, y: number, c: typeof C1) {
    const n = mk('slide.concept', x, y);
    n.data.params.kicker = c.kicker;
    n.data.params.title = c.title;
    n.data.params.body = c.body.join('\n');
    return n;
  }
  const c1 = concept(380, 40, C1);
  const c2 = concept(380, 240, C2);
  const c3 = concept(380, 440, C3);
  const c4 = concept(380, 640, C4);

  // ---- Slide Composer ×4 (client-side, IDLE) ----
  function composer(x: number, y: number, layout: string, page: string) {
    const n = mk('slide.composer', x, y);
    n.data.params.layout = layout;
    n.data.params.fonts = 'Editorial';
    n.data.params.mode = 'Sáng';
    n.data.params.brand = 'TTT ARCHITECTS';
    n.data.params.pageNo = page;
    return n;
  }
  const s1 = composer(760, 40, 'Cover', '01');
  const s2 = composer(760, 240, 'Nội dung + ảnh', '02');
  const s3 = composer(760, 440, 'Nội dung + ảnh', '03');
  const s4 = composer(760, 640, 'Quote', '04');

  // ---- Export Deck (client-side, IDLE) ----
  const deck = mk('slide.deck', 1160, 300);
  deck.data.params.deckName = 'Concept-Sanh-KhachSan-5sao-v1';

  const nodes = [ref, h1, h2, h3, c1, c2, c3, c4, s1, s2, s3, s4, deck];
  const edges = [
    // content → composer.content
    edge(c1, 'text', s1, 'content', 'text'),
    edge(c2, 'text', s2, 'content', 'text'),
    edge(c3, 'text', s3, 'content', 'text'),
    edge(c4, 'text', s4, 'content', 'text'),
    // style-ref chung → palette đồng nhất cả deck
    edge(ref, 'image', s1, 'styleref'),
    edge(ref, 'image', s2, 'styleref'),
    edge(ref, 'image', s3, 'styleref'),
    edge(ref, 'image', s4, 'styleref'),
    // hero ảnh
    edge(h1, 'image', s1, 'hero'),
    edge(h2, 'image', s2, 'hero'),
    edge(h3, 'image', s3, 'hero'),
    // composer → deck
    edge(s1, 'image', deck, 'slide1'),
    edge(s2, 'image', deck, 'slide2'),
    edge(s3, 'image', deck, 'slide3'),
    edge(s4, 'image', deck, 'slide4'),
  ];

  sealHashes(nodes, edges);
  return { nodes, edges };
}

export const presentDemo: DemoModule = {
  meta: {
    id: 'present',
    glyph: '▤',
    label: 'Present — Slide khách',
    desc: '4 concept → Slide Composer (Cover · Nội dung · Quote) → Export Deck 16:9',
    phase: 'present',
  },
  build,
};
