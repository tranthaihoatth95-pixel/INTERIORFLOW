// lib/demos/clay.ts — demo "thực tế" CHẶNG CLAY RENDER → ẢNH.
//
// Luồng 3 bước có hậu kỳ 4K, sản phẩm THẬT nướng từ /public/demo (không gọi API):
//   Clay render (input) ─┐
//                        ├─▶ Clay → Photoreal ─▶ Upscale 4K ─▶ Save to Gallery
//   Prompt (input) ──────┘
//
// Các node AI được "nướng" output thật qua done()/doneText(); node Gallery để IDLE
// (client-side tự chạy khi Run). sealHashes() được gọi 1 lần cuối build() để "niêm"
// inputHash → "Chạy flow" bỏ qua re-exec (tránh gọi provider chưa có balance).

import { mk, edge, done, doneText, sealHashes, type DemoModule, type Seed } from './_shared';

// Prompt tiếng Anh thực tế cho render nội thất photoreal, tông quiet-luxury —
// phòng khách căn hộ cao cấp / penthouse.
const CLAY_PROMPT =
  'photorealistic interior render of a warm minimalist high-end apartment living room, oak herringbone floor, ' +
  'walnut joinery, limewash plaster walls, linen upholstered sofa, travertine coffee table, ' +
  'soft natural daylight from a large window with sheer curtains, quiet luxury editorial mood, ' +
  'physically-based rendering, global illumination, realistic materials and soft shadows, ' +
  '8k, architectural photography';

function build(): Seed {
  // 1. Clay render đầu vào (ảnh khối trắng thật xuất từ 3ds Max).
  const c0 = mk('input.image', 40, 200);
  c0.data.params.file = '/demo/clay-in.jpg';
  c0.data.run = done('/demo/clay-in.jpg');

  // 2. Prompt nguồn — mô tả phối cảnh photoreal.
  const p = mk('input.prompt', 40, 560);
  p.data.params.prompt = CLAY_PROMPT;
  p.data.run = doneText(CLAY_PROMPT);

  // 3. Clay → Photoreal: khoá hình khối, thêm vật liệu/ánh sáng thật.
  const c1 = mk('ai.clay2render', 460, 200);
  c1.data.params.style = 'Modern Luxury'; // giá trị có thật trong STYLE_OPTIONS, hợp gu quiet-luxury
  c1.data.params.preserve = 16; // bám khối chặt (depth guidance mặc định)
  c1.data.run = done('/demo/clay-out.png');

  // 4. Upscale 4K thật (ESRGAN 4x → 4864×3328).
  const c2 = mk('ai.upscale', 880, 200);
  c2.data.params.scale = '4';
  c2.data.run = done('/demo/clay-4k.jpg');

  // 5. Save to Gallery — client-side, để IDLE (tự chạy khi Run).
  const g = mk('out.gallery', 1280, 200);
  g.data.params.name = 'Phối cảnh căn hộ cao cấp — 4K';

  const nodes = [c0, p, c1, c2, g];
  const edges = [
    edge(c0, 'image', c1, 'image'),
    edge(p, 'text', c1, 'prompt', 'text'),
    edge(c1, 'image', c2, 'image'),
    edge(c2, 'image', g, 'image'),
  ];

  sealHashes(nodes, edges);
  return { nodes, edges };
}

export const clayDemo: DemoModule = {
  meta: { id: 'clay-to-image', glyph: '◲', label: 'Clay → Ảnh 4K', desc: 'Clay render → photoreal → upscale 4K thật', phase: 'render' },
  build,
};
