// lib/demos/sketch.ts — demo module CHẶNG "SKETCH → ẢNH" (before/after thật).
//
// Luồng: input.image (sketch tay thật) + input.prompt (mô tả quiet-luxury) → ai.sketch2render
// (bake output render THẬT từ /public/demo) → out.gallery (client-side, để idle tự chạy khi Run).
// Node AI được "nướng" (bake) bằng done()/doneText() để hiển thị ngay mà KHÔNG gọi API
// (provider chờ billing). sealHashes() được gọi 1 lần cuối build() để "niêm" inputHash.

import { mk, edge, done, doneText, sealHashes, type DemoModule, type Seed } from './_shared';

// Prompt tiếng Anh thực tế — phòng khách penthouse chung cư cao cấp, tông quiet-luxury
// (dùng chung cho param + bake output text).
const LIVING_PROMPT =
  'quiet luxury high-rise penthouse living room, floor-to-ceiling city view, oak herringbone floor, linen sofa, limewash walls, soft morning light, walnut console, marble coffee table, wool rug, editorial photography';

function build(): Seed {
  // 1. Input sketch thật (ảnh phòng khách vẽ tay).
  const s0 = mk('input.image', 40, 160);
  s0.data.params.file = '/demo/sketch-in.jpg';
  s0.data.run = done('/demo/sketch-in.jpg');

  // 2. Prompt nguồn — bake output text để giữ ổn định, không re-exec.
  const p = mk('input.prompt', 40, 520);
  p.data.params.prompt = LIVING_PROMPT;
  p.data.run = doneText(LIVING_PROMPT);

  // 3. Sketch → Render — bake output render THẬT (sản phẩm before/after).
  const r = mk('ai.sketch2render', 480, 200);
  r.data.params.style = 'Modern Luxury';
  r.data.params.guidance = 15;
  r.data.params.adherence = 0.6;
  r.data.run = done('/demo/sketch-out.png');

  // 4. Save to Gallery — client-side, để IDLE (tự chạy khi Run).
  const g = mk('out.gallery', 900, 200);
  g.data.params.name = 'Penthouse — phòng khách final';

  const nodes = [s0, p, r, g];
  const edges = [
    edge(s0, 'image', r, 'image'),
    edge(p, 'text', r, 'prompt', 'text'),
    edge(r, 'image', g, 'image'),
  ];

  sealHashes(nodes, edges);
  return { nodes, edges };
}

export const sketchDemo: DemoModule = {
  meta: {
    id: 'sketch-to-image',
    glyph: '✎',
    label: 'Sketch → Ảnh',
    desc: 'Sketch tay → render nội thất thật (before/after)',
    phase: 'render',
  },
  build,
};
