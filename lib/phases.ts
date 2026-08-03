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
    // NB: giữ id 'concept' để KHÔNG vỡ store/localStorage cũ — chỉ NHÃN hiển thị đổi.
    // 03/08 CHỐT TÊN vòng cuối (docs/CHOT-TEN-CHANG-MODE-2026-08-03.md mục "VÒNG CUỐI"):
    // "Drafting CAD" → "2D Kỹ thuật" (đặt theo CHIỀU KHÔNG GIAN + MỤC ĐÍCH, không theo động
    // tác tay — 2D/3D là ký hiệu quốc tế, không phải jargon). ID GIỮ NGUYÊN.
    id: 'concept',
    icon: 'concept',
    label: '2D Kỹ thuật',
    tagline: 'Import CAD 2D · vẽ sơ phác · bố trí furniture',
    blurb: 'Dựng mặt bằng 2D: mở/vẽ CAD, bố trí nội thất, rồi đưa layout sang 3D Thiết kế tô vật liệu.',
    // Chặng này chạy ở route riêng (/cad-editor), không có node ưu tiên trên canvas.
    featured: [],
    demo: 'concept',
  },
  {
    // 03/08 CHỐT TÊN vòng cuối — "Rendering" → "3D Thiết kế" (mode Node ↔ 3D, xem
    // CHOT-TEN-CHANG-MODE-2026-08-03.md). ID 'render' GIỮ NGUYÊN.
    id: 'render',
    icon: 'render',
    label: '3D Thiết kế',
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
      // Chọn vùng thông minh đứng ngay trước Material Swap: đó là thứ tự làm việc thật
      // (chọn đúng vách → đổi vật liệu), và là lý do node này ra đời.
      'ai.smartselect',
      'ai.pattern',
      'util.warp',
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
    // 03/08 CHỐT TÊN vòng cuối — "Presenting" → "Trình bày" (không mode, xem file trên). ID
    // 'present' GIỮ NGUYÊN.
    id: 'present',
    icon: 'present',
    label: 'Trình bày',
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

/**
 * Dấu nhận diện THỊ GIÁC của từng chặng — trước đây 3 chặng nhìn y hệt nhau nên người dùng
 * hay quên mình đang đứng ở đâu. Ba tông ĐỀU đã giảm bão hoà (quiet-luxury, không loè loẹt),
 * chỉ dùng ở 2 chỗ rất mảnh: hairline đáy thanh đầu + chấm 4px trên pill chặng đang mở.
 * KHÔNG thay `--accent` của app (accent vẫn là màu hành động dùng chung).
 *   concept — xanh thép, gu bản vẽ kỹ thuật
 *   render  — đồng ấm, gu "lò" sản xuất hình ảnh
 *   present — xanh rêu trầm, gu hồ sơ trình khách
 */
export const STAGE_TINT: Record<Phase, string> = {
  concept: '#6e8ca6',
  render: '#b57a4e',
  present: '#7f8d78',
};

/** Số thứ tự chặng trong pipeline — hiện ở nhãn micro "01 · DRAFTING CAD" trên thanh đầu. */
export const STAGE_INDEX: Record<Phase, string> = {
  concept: '01',
  render: '02',
  present: '03',
};

/** default khi chưa chọn chặng (session cũ / vào thẳng app) — Render là chặng dùng nhiều nhất. */
export const DEFAULT_PHASE: Phase = 'render';

export function isPhase(v: unknown): v is Phase {
  return v === 'concept' || v === 'render' || v === 'present';
}

/**
 * IF2-nền — nhãn hiển thị của chặng, TỰ ĐỔI theo CAD stage cho phase 'concept':
 *   stage='sketch'    → '2D Kỹ thuật · Sơ phác'
 *   stage='technical' → '2D Kỹ thuật · Kỹ thuật'
 *   stage='bim'       → '2D Kỹ thuật · Kỹ thuật' (BIM/cấu kiện KHÔNG còn là mode/chặng riêng
 *                        từ 03/08 CHỐT TÊN vòng cuối — nay là TẦNG DỮ LIỆU nằm dưới cả ba
 *                        chặng, xem CHOT-TEN-CHANG-MODE-2026-08-03.md — nên dùng chung nhãn
 *                        'Kỹ thuật' với 'technical', KHÔNG bịa nhãn "BIM" cho người dùng thấy)
 * Các phase khác giữ nguyên label tĩnh trong PHASES. `cadStage` optional để không phá caller cũ
 * (thiếu ⇒ fallback về `PHASE_MAP[id].label` như trước).
 */
export function phaseLabel(id: Phase, cadStage?: 'sketch' | 'technical' | 'bim'): string {
  if (id !== 'concept' || !cadStage) return PHASE_MAP[id].label;
  if (cadStage === 'technical' || cadStage === 'bim') return '2D Kỹ thuật · Kỹ thuật';
  return '2D Kỹ thuật · Sơ phác';
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
 * Chặng 'concept' = 2D Kỹ thuật ở route riêng, cũng không có node canvas nên không tính ở đây.
 */
export function phaseFromNodes(defTypes: string[]): Phase | null {
  if (defTypes.length === 0) return null;
  const renderSet = new Set(PHASE_MAP.render.featured);
  const renderCount = defTypes.filter((t) => renderSet.has(t)).length;
  return renderCount > 0 ? 'render' : null;
}
