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
  /** 07/08 [M-NHAN-OUT] — nhãn EN đúng CHỐT NGÔN NGỮ (`docs/00-CHOT.md`): concept→'2D Design'
   * · render→'3D Design' · present→'Presenting'. Trước đây `label` chỉ có 1 chuỗi VI, verify
   * browser (đổi `lang='en'` qua `useFlowStore`) bắt được `StageSwitcher.tsx` vẫn hiện tiếng Việt
   * ở giao diện EN — field này + `useT()` ở nơi gọi sửa đúng chỗ đó. */
  labelEn: string;
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
    // 04/08 [P7 ĐỔI TÊN] — "2D Kỹ thuật" → "Thiết kế 2D" (EN "2D Technical" → "2D Design"),
    // Hoà chốt: IF1/IF2 nay gộp chung nên ngữ nghĩa nhãn phải RỘNG hơn "kỹ thuật" đơn thuần
    // (chặng này còn gồm cả Sơ phác, không chỉ vẽ kỹ thuật). ID/khoá mode (sketch/pro/revit)
    // GIỮ NGUYÊN TUYỆT ĐỐI — chỉ đổi NHÃN hiển thị.
    id: 'concept',
    icon: 'concept',
    label: 'Thiết kế 2D',
    labelEn: '2D Design',
    // 07/08 [G-M15 việc 5] — rà theo docs/00-CHOT.md "ĐỊNH NGHĨA BA CHẶNG" (07/08 Hoà chốt):
    // chặng này có 2 mode Sơ phác ↔ Chuyên (Chuyên = gồm luôn Revit 2D) — tagline cũ thiếu cả hai.
    tagline: 'Sơ phác ↔ Chuyên (gồm Revit 2D) · vẽ mặt bằng · bố trí nội thất',
    // G-M15-06 — bỏ chữ "CAD" khỏi nhãn (Hoà chốt 07/08 "có cad là sai thôi"); đo lại (N8):
    // `.blurb` KHÔNG có nơi render nào trong app hiện tại (`grep -rn "\.blurb\b"` chỉ khớp field
    // khác tên trùng ở AiDependencySettings.tsx, không phải PhaseMeta) — sửa trước để không tái
    // sinh lỗi khi có phiên sau nối nó vào UI.
    blurb: 'Dựng mặt bằng 2D: mở/vẽ Thiết kế 2D, bố trí nội thất, rồi đưa layout sang Thiết kế 3D tô vật liệu.',
    // Chặng này chạy ở route riêng (/cad-editor), không có node ưu tiên trên canvas.
    featured: [],
    demo: 'concept',
  },
  {
    // 03/08 CHỐT TÊN vòng cuối — "Rendering" → "3D Thiết kế" (mode Node ↔ 3D, xem
    // CHOT-TEN-CHANG-MODE-2026-08-03.md). ID 'render' GIỮ NGUYÊN.
    // 04/08 [P7 ĐỔI TÊN] — "3D Thiết kế" → "Thiết kế 3D" (EN "3D Design" GIỮ NGUYÊN, chỉ đảo
    // thứ tự VI cho khớp cặp "Thiết kế 2D/Thiết kế 3D"). ID 'render' GIỮ NGUYÊN.
    id: 'render',
    icon: 'render',
    label: 'Thiết kế 3D',
    labelEn: '3D Design',
    // 07/08 [G-M15 việc 5] — tagline cũ thiếu Revit 3D + dựng khối (chốt 07/08: mọi thứ 3D của
    // Revit đẩy sang chặng này, cùng với dựng khối tinh thần 3ds Max).
    tagline: 'Dựng khối (gồm Revit 3D) · Clay → photoreal · chỉnh cục bộ',
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
    // 04/08 [P7 ĐỔI TÊN] — "Trình bày" → "Trình chiếu" (EN "Presenting" GIỮ NGUYÊN). ID
    // 'present' GIỮ NGUYÊN.
    id: 'present',
    icon: 'present',
    label: 'Trình chiếu',
    labelEn: 'Presenting',
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
 * 07/08 [G-M15-02, M-NHAN-OUT] — TRƯỚC ĐÂY gộp tên CHẶNG với tên MODE thành một chuỗi
 * ('Thiết kế 2D · Sơ phác'/'Thiết kế 2D · Kỹ thuật'). Chốt 07/08 (`docs/00-CHOT.md`) tách rõ:
 * tên chặng và tên mode là HAI THỨ khác nhau, không dán vào nhau trên một nhãn — mode đã có dải
 * chọn riêng ở thanh công cụ dưới (08/08: dải này còn 2 nút `Sơ phác ↔ Chuyên` theo chốt 07/08
 * "ĐỊNH NGHĨA BA CHẶNG"; nút "Nội thất"/khoá `revit` đã bỏ khỏi UI, khoá vẫn sống trong store).
 * Đo lại (N8): hàm này KHÔNG
 * có nơi gọi nào trong app (`grep -rn "phaseLabel(" --include=*.tsx --include=*.ts .` chỉ ra
 * đúng 1 kết quả — chính định nghĩa; `StageSwitcher.tsx` dùng thẳng `p.label` tĩnh, KHÔNG gọi hàm
 * này) — không phải bug đang hiện cho người dùng, nhưng chữ ký cũ SAI theo chốt mới nên sửa luôn
 * để phiên sau lỡ gọi không tái sinh lỗi. `cadStage` giữ tham số (không phá chữ ký) nhưng KHÔNG
 * còn ảnh hưởng chuỗi trả về — luôn trả đúng `PHASE_MAP[id].label`.
 */
export function phaseLabel(id: Phase, _cadStage?: 'sketch' | 'technical' | 'bim'): string {
  return PHASE_MAP[id].label;
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
 * Chặng 'concept' = Thiết kế 2D ở route riêng, cũng không có node canvas nên không tính ở đây.
 */
export function phaseFromNodes(defTypes: string[]): Phase | null {
  if (defTypes.length === 0) return null;
  const renderSet = new Set(PHASE_MAP.render.featured);
  const renderCount = defTypes.filter((t) => renderSet.has(t)).length;
  return renderCount > 0 ? 'render' : null;
}
