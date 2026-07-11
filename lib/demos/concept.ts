// lib/demos/concept.ts — demo CHẶNG CONCEPT ("thực tế").
//
// Luồng: brief thiết kế (Text Prompt) → Moodboard Gen (AI, 4 concept sảnh khách sạn 5 sao)
// → tách 2 nhánh: Moodboard Collage (board editorial) + Color Palette (trích HEX).
// Node AI được "nướng" output THẬT từ /public/demo (mood1..4.jpg) qua doneMulti/doneText
// nên hiển thị ngay, không cần gọi provider. 2 node client-side (collage + palette)
// để IDLE — tự chạy khi bấm Run. sealHashes() niêm inputHash để "Chạy flow" bỏ qua node đã done.

import { mk, edge, doneText, doneMulti, sealHashes, type DemoModule, type Seed } from './_shared';

// Brief thiết kế thực tế (EN, giàu chi tiết) — sảnh khách sạn / resort 5 sao, đúng thể loại
// user hay làm. Dùng cho cả param prompt và output text đã nướng.
const BRIEF =
  'Quiet-luxury 5-star resort lobby lounge, double-height space with a sculptural reception desk. ' +
  'Indochine-modern character — dark tropical walnut joinery, fluted timber screens, rattan and ' +
  'travertine, warm brass accents, natural stone flooring. Layered arrival sequence, statement ' +
  'pendant chandelier, lush indoor planting, deep linen sofas and lounge chairs. Muted earth ' +
  'palette — plaster beige, greige, bronze, forest green. Grand yet calm, editorial hospitality ' +
  'photography, soft diffused daylight through tall glazing, long shadows, 35mm.';

function build(): Seed {
  // 1. Brief nguồn (đã nướng text để ổn định, không re-exec)
  const m1 = mk('input.prompt', 40, 120);
  m1.data.params.prompt = BRIEF;
  m1.data.run = doneText(BRIEF);

  // 2. Moodboard Gen (AI) — bake 4 concept thật từ /public/demo
  const mb = mk('ai.moodboard', 440, 120);
  mb.data.params.style = 'Indochine';
  mb.data.run = doneMulti({
    image1: '/demo/mood1.jpg',
    image2: '/demo/mood2.jpg',
    image3: '/demo/mood3.jpg',
    image4: '/demo/mood4.jpg',
  });

  // 3. Moodboard Collage — client-side, để IDLE (tự chạy khi Run)
  const coll = mk('out.moodboard', 880, 60);
  coll.data.params.title = 'RESORT LOBBY';
  coll.data.params.sub = 'DESIGN DIRECTION';
  coll.data.params.eyebrow = 'MOODBOARD · ĐỊNH HƯỚNG · KHÁCH SẠN 5★';
  coll.data.params.layout = 'Sắp chữ (Justified)';

  // 4. Color Palette — client-side, để IDLE (tự chạy khi Run)
  const pal = mk('util.palette', 880, 420);

  const nodes = [m1, mb, coll, pal];
  const edges = [
    edge(m1, 'text', mb, 'prompt', 'text'),
    edge(mb, 'image1', coll, 'img1'),
    edge(mb, 'image2', coll, 'img2'),
    edge(mb, 'image3', coll, 'img3'),
    edge(mb, 'image4', coll, 'img4'),
    edge(mb, 'image1', pal, 'image'),
  ];

  sealHashes(nodes, edges);
  return { nodes, edges };
}

export const conceptDemo: DemoModule = {
  meta: {
    id: 'concept',
    glyph: '◐',
    label: 'Concept — Định hướng',
    desc: 'Brief sảnh khách sạn 5★ → 4 concept (AI) → Moodboard board + palette',
    // Moodboard/vật liệu đã GỘP vào chặng Render (Concept cũ bỏ khỏi canvas).
    phase: 'render',
  },
  build,
};
