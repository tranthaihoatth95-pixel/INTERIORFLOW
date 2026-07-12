/**
 * 3 CHẶNG MỀM của một pipeline (không phải 3 app rời): Concept → Render → Present.
 * "Mềm" = mỗi chặng chỉ *nhấn mạnh* nhóm node phù hợp + nạp starter-flow, KHÔNG khoá
 * bạn khỏi phần còn lại. Chung 1 canvas / 1 thư viện / 1 project, đi lại tự do.
 * Nguồn chân lý: Header phase-switcher, Node Library (nhóm ★), LoginScreen entry.
 */
export type Phase = 'concept' | 'render' | 'present';

export interface PhaseMeta {
  id: Phase;
  /** icon key — component tự map (tránh phụ thuộc lucide ở lib) */
  icon: Phase;
  label: string;
  /** 1 dòng trên entry / tooltip */
  tagline: string;
  blurb: string;
  /** node type được ưu tiên cho chặng này (hiện nhóm ★ đầu Library) */
  featured: string[];
  /** starter flow nạp khi bắt đầu ở chặng (DemoKind trong store) */
  demo: 'concept' | 'bedroom' | 'slide';
}

export const PHASES: PhaseMeta[] = [
  {
    // NB: giữ id 'concept' để KHÔNG vỡ store/localStorage cũ, nhưng chặng 1 đã đổi
    // bản chất → "Layout CAD" (trình vẽ mặt bằng 2D ở /cad-editor, không phải canvas node).
    id: 'concept',
    icon: 'concept',
    label: 'Layout CAD',
    tagline: 'Import CAD 2D · vẽ sơ phác · bố trí furniture',
    blurb: 'Dựng mặt bằng 2D: mở/vẽ CAD, bố trí nội thất, rồi đưa layout sang Render tô vật liệu.',
    // Chặng này chạy ở route riêng (/cad-editor), không có node ưu tiên trên canvas.
    featured: [],
    demo: 'concept',
  },
  {
    id: 'render',
    icon: 'render',
    label: 'Render',
    tagline: 'Clay → photoreal · chỉnh cục bộ',
    blurb: 'Sản xuất phối cảnh: clay/sketch → AI photoreal, đổi vật liệu, ánh sáng, upscale.',
    featured: [
      'input.image',
      'input.prompt',
      // moodboard/vật liệu (Concept cũ) nay GỘP vào Render
      'ai.moodboard',
      'util.palette',
      'out.moodboard',
      'input.stylepreset',
      'ai.clay2render',
      'ai.sketch2render',
      'ai.styletransfer',
      'ai.emptystaging',
      'ai.materialswap',
      'ai.furniture',
      'ai.relight',
      'ai.upscale',
      'util.maskpainter',
      'util.edit',
      'util.compare',
    ],
    demo: 'bedroom',
  },
  {
    id: 'present',
    icon: 'present',
    label: 'Present',
    tagline: 'Slide · board · spec vật liệu',
    blurb: 'Đóng gói cho khách: dàn slide 16:9, board, xuất deck PDF, chú thích vật liệu.',
    featured: ['slide.concept', 'slide.composer', 'slide.deck', 'out.board', 'out.gallery', 'util.annotate'],
    demo: 'slide',
  },
];

export const PHASE_MAP: Record<Phase, PhaseMeta> = Object.fromEntries(PHASES.map((p) => [p.id, p])) as Record<
  Phase,
  PhaseMeta
>;

/** default khi chưa chọn chặng (session cũ / vào thẳng app) — Render là chặng dùng nhiều nhất. */
export const DEFAULT_PHASE: Phase = 'render';

export function isPhase(v: unknown): v is Phase {
  return v === 'concept' || v === 'render' || v === 'present';
}

/**
 * Suy chặng TRỘI của một flow từ danh sách node đang có — để khi MỞ flow, header
 * phase-switcher khớp nội dung trên canvas (tránh mở flow render mà header vẫn lệch).
 *
 * A1: 'present' là ROUTE riêng (/present-editor), KHÔNG phải trạng thái workspace của
 * canvas '/'. Header/StudioBar bấm Present đều route sang studio, không bao giờ hiện node
 * slide.* như một chặng canvas. Vì vậy phần suy diễn CHỈ xét 'render': mở một flow (kể cả
 * flow nhiều node slide.*) không bao giờ ép workspace='present' để pill Present sáng nhầm
 * khi đang ở canvas. Có node render → 'render'; không có → null (giữ nguyên chặng hiện tại).
 * Chặng 'concept' = Layout CAD ở route riêng, cũng không có node canvas nên không tính ở đây.
 */
export function phaseFromNodes(defTypes: string[]): Phase | null {
  if (defTypes.length === 0) return null;
  const renderSet = new Set(PHASE_MAP.render.featured);
  const renderCount = defTypes.filter((t) => renderSet.has(t)).length;
  return renderCount > 0 ? 'render' : null;
}
