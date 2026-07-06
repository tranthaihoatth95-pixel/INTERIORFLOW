// Demo seeds — 3 flow mẫu "one-click" cho InteriorFlow.
//
// Mỗi demo dựng sẵn node + edge + params đã tune, người dùng chỉ cần bấm Run
// (hoặc xem kết quả mock khi AI provider chưa có balance).
//
// Module thuần: chỉ dựng { nodes, edges } bằng đúng node id + param id có thật
// trong registry. Không import i18n (tránh circular). Áp vào canvas qua
// applyDemoSeed() — dùng API công khai của store (snapshot + setState).

import { getDefinition, defaultParams } from '@/lib/nodes/registry';
import { useFlowStore, nextId, edgeStyleFor, type FlowNode } from '@/lib/store';

export type DemoSeedId = 'material-moodboard' | 'sketch-to-image' | 'slide-deck';

export interface DemoSeedMeta {
  id: DemoSeedId;
  /** Nhãn ngắn (VI) cho nút launcher */
  label: string;
  /** Mô tả 1 dòng cho tooltip / phụ đề */
  desc: string;
  /** Emoji/glyph nhỏ đứng đầu nút */
  glyph: string;
}

// ---- helper dựng node/edge (bám đúng pattern loadDemoFlow trong store) ----

function mk(defType: string, x: number, y: number): FlowNode {
  const def = getDefinition(defType);
  return {
    id: nextId('node'),
    type: 'interior',
    position: { x, y },
    data: { defType, params: defaultParams(def), run: { status: 'idle', progress: 0 } },
  };
}

function edge(a: FlowNode, ah: string, b: FlowNode, bh: string, dt = 'image') {
  return {
    id: nextId('edge'),
    source: a.id,
    sourceHandle: ah,
    target: b.id,
    targetHandle: bh,
    style: edgeStyleFor(dt),
  };
}

function svg(body: string, w = 768, h = 512) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`,
  )}`;
}

interface Seed {
  nodes: FlowNode[];
  edges: ReturnType<typeof edge>[];
}

// =====================================================================
// 1. MOODBOARD — VẬT LIỆU / MATERIAL
//    ref vật liệu → Color Palette (trích HEX) + Moodboard Gen (4 concept)
//    → Export Board (ghép presentation board)
// =====================================================================
function seedMaterialMoodboard(): Seed {
  // Ảnh ref bảng vật liệu quiet-luxury: đá ấm, gỗ sồi, óc chó, linen, đồng
  const materialRef = svg(
    `<rect width="768" height="512" fill="#efe9df"/>
<rect x="0"   y="0"   width="192" height="512" fill="#e8ddca"/>
<rect x="192" y="0"   width="192" height="512" fill="#b8926a"/>
<rect x="384" y="0"   width="192" height="512" fill="#6f5b40"/>
<rect x="576" y="0"   width="192" height="512" fill="#3a332a"/>
<rect x="60"  y="60"  width="72"  height="392" fill="#d9cfc2"/>
<rect x="636" y="60"  width="72"  height="392" fill="#a8763f"/>
<text x="384" y="490" text-anchor="middle" font-family="system-ui" font-size="20" fill="#5a5348">material board — đá ấm · sồi · óc chó · linen · đồng</text>`,
  );
  const ref = mk('input.image', 40, 140);
  ref.data.params.file = materialRef;

  const palette = mk('util.palette', 460, 40);

  const style = mk('input.stylepreset', 40, 520);
  style.data.params.style = 'Wabi-sabi';

  const mood = mk('ai.moodboard', 460, 360);
  mood.data.params.style = 'Wabi-sabi';

  const board = mk('out.board', 900, 220);
  board.data.params.projectName = 'Moodboard — Vật liệu';
  board.data.params.studioName = 'TTT Architects';

  return {
    nodes: [ref, palette, style, mood, board],
    edges: [
      edge(ref, 'image', palette, 'image'),
      edge(style, 'text', mood, 'prompt', 'text'),
      edge(mood, 'image1', board, 'image1'),
      edge(mood, 'image2', board, 'image2'),
      edge(mood, 'image3', board, 'image3'),
      edge(mood, 'image4', board, 'image4'),
    ],
  };
}

// =====================================================================
// 2. SKETCH → ẢNH / SKETCH-TO-IMAGE
//    1 sketch → 3 nhánh Sketch→Render với guidance thoáng / vừa / chặt
//    (loose 6 · medium 12 · strict 18) → Export Board so sánh
// =====================================================================
function seedSketchToImage(): Seed {
  const livingSketch = svg(
    `<rect width="1024" height="683" fill="#faf8f4"/>
<g stroke="#4a443c" stroke-width="3" fill="none">
<line x1="0" y1="470" x2="1024" y2="470"/>
<rect x="70" y="90" width="884" height="380"/>
<line x1="70" y1="360" x2="954" y2="360"/>
<rect x="150" y="180" width="240" height="180"/>
<line x1="150" y1="240" x2="390" y2="240"/>
<rect x="470" y="250" width="330" height="120" rx="10"/>
<line x1="470" y1="320" x2="800" y2="320"/>
<rect x="500" y="260" width="90" height="40" rx="12"/>
<rect x="610" y="260" width="90" height="40" rx="12"/>
<rect x="840" y="150" width="90" height="210"/>
<line x1="885" y1="150" x2="885" y2="360"/>
<ellipse cx="560" cy="560" rx="300" ry="55"/>
<circle cx="512" cy="120" r="30"/>
<line x1="512" y1="90" x2="512" y2="60"/>
</g>
<text x="512" y="655" text-anchor="middle" font-family="system-ui" font-size="22" fill="#8a8378">sketch — phòng khách</text>`,
    1024,
    683,
  );
  const img = mk('input.image', 40, 260);
  img.data.params.file = livingSketch;

  const prompt = mk('input.prompt', 40, 620);
  prompt.data.params.prompt =
    'warm minimalist living room, oak herringbone floor, linen sofa, limewash plaster walls, large window with sheer curtains and soft morning light, low walnut media console, wool rug, ceramic vases, quiet luxury editorial photography';

  // 3 mức bám sketch — guidance là param thật của ai.sketch2render (min 1, max 20)
  const loose = mk('ai.sketch2render', 480, 40);
  loose.data.params.style = 'Scandinavian';
  loose.data.params.guidance = 6; // thoáng — AI tự do diễn giải

  const medium = mk('ai.sketch2render', 480, 300);
  medium.data.params.style = 'Scandinavian';
  medium.data.params.guidance = 12; // vừa — cân bằng

  const strict = mk('ai.sketch2render', 480, 560);
  strict.data.params.style = 'Scandinavian';
  strict.data.params.guidance = 18; // chặt — bám sát hình khối sketch

  const board = mk('out.board', 900, 300);
  board.data.params.projectName = 'Sketch → Ảnh · Thoáng / Vừa / Chặt';
  board.data.params.studioName = 'TTT Architects';

  return {
    nodes: [img, prompt, loose, medium, strict, board],
    edges: [
      edge(img, 'image', loose, 'image'),
      edge(img, 'image', medium, 'image'),
      edge(img, 'image', strict, 'image'),
      edge(prompt, 'text', loose, 'prompt', 'text'),
      edge(prompt, 'text', medium, 'prompt', 'text'),
      edge(prompt, 'text', strict, 'prompt', 'text'),
      edge(loose, 'image', board, 'image1'),
      edge(medium, 'image', board, 'image2'),
      edge(strict, 'image', board, 'image3'),
    ],
  };
}

// =====================================================================
// 3. SLIDE DECK (pipeline SLIDE local)
//    2 Concept Content → 2 Slide Composer (Cover + Nội dung) → Export Deck
//    + ref brand dùng chung cho palette/hero của slide
// =====================================================================
function seedSlideDeck(): Seed {
  const brandRef = svg(
    '<rect width="768" height="512" fill="#f2ede4"/><rect y="160" width="768" height="120" fill="#d9cfc2"/><rect y="280" width="768" height="90" fill="#b39776"/><rect y="370" width="768" height="80" fill="#6f5b40"/><rect y="450" width="768" height="62" fill="#2b2620"/><circle cx="620" cy="90" r="46" fill="#c7a397"/>',
  );
  const ref = mk('input.image', 40, 60);
  ref.data.params.file = brandRef;

  const c1 = mk('slide.concept', 40, 420);
  c1.data.params.kicker = 'Concept · Master bedroom';
  c1.data.params.title = 'SERENE';
  c1.data.params.body = 'Phòng ngủ Japandi 22m² — tĩnh, ấm, đủ.\nĐá ấm, gỗ sồi, vải linen thô.';

  const c2 = mk('slide.concept', 40, 800);
  c2.data.params.kicker = 'Định hướng vật liệu';
  c2.data.params.title = 'Chất liệu & ánh sáng';
  c2.data.params.body =
    '- Sàn gỗ sồi ghép xương cá, tường vữa mịn tông kem\n- Rèm 2 lớp: voan + linen chắn sáng\n- Đèn 2700K, wall-wash quanh đầu giường\n- Đầu giường gỗ óc chó bo cong, nệm bọc bouclé';

  const s1 = mk('slide.composer', 460, 200);
  s1.data.params.layout = 'Cover';
  s1.data.params.fonts = 'Editorial';
  s1.data.params.brand = 'TTT Architects';
  s1.data.params.pageNo = '01';

  const s2 = mk('slide.composer', 460, 700);
  s2.data.params.layout = 'Nội dung + ảnh';
  s2.data.params.fonts = 'Editorial';
  s2.data.params.brand = 'TTT Architects';
  s2.data.params.pageNo = '02';

  const deck = mk('slide.deck', 900, 450);
  deck.data.params.deckName = 'Concept-SERENE-bedroom';

  return {
    nodes: [ref, c1, c2, s1, s2, deck],
    edges: [
      edge(c1, 'text', s1, 'content', 'text'),
      edge(c2, 'text', s2, 'content', 'text'),
      edge(ref, 'image', s1, 'styleref'),
      edge(ref, 'image', s2, 'styleref'),
      edge(ref, 'image', s2, 'hero'),
      edge(s1, 'image', deck, 'slide1'),
      edge(s2, 'image', deck, 'slide2'),
    ],
  };
}

// ---- registry của các demo ----

const BUILDERS: Record<DemoSeedId, () => Seed> = {
  'material-moodboard': seedMaterialMoodboard,
  'sketch-to-image': seedSketchToImage,
  'slide-deck': seedSlideDeck,
};

export const DEMO_SEEDS: DemoSeedMeta[] = [
  {
    id: 'material-moodboard',
    glyph: '◑',
    label: 'Moodboard — Vật liệu',
    desc: 'Ảnh vật liệu → palette HEX + 4 concept → board',
  },
  {
    id: 'sketch-to-image',
    glyph: '✎',
    label: 'Sketch → Ảnh',
    desc: 'Sketch → render 3 mức bám: thoáng / vừa / chặt',
  },
  {
    id: 'slide-deck',
    glyph: '▤',
    label: 'Slide Deck',
    desc: 'Concept → Slide Composer → Export Deck (PDF 16:9)',
  },
];

/** Dựng graph của demo rồi áp vào canvas (snapshot để undo được). */
export function applyDemoSeed(id: DemoSeedId): void {
  const build = BUILDERS[id];
  if (!build) return;
  const { nodes, edges } = build();
  const store = useFlowStore.getState();
  store.snapshot();
  useFlowStore.setState({ nodes, edges });
}
