/**
 * Bộ dựng prompt cho node `ai.pattern` (Pattern Studio) — TÁCH RIÊNG khỏi node để test
 * tất định bằng sucrase-node (node execute cần canvas/DOM, hàm này thuần chuỗi).
 *
 * ===== VÌ SAO CẦN LỚP NÀY =====
 * Ghi lại từ 16 lần thử thật của người dùng khi cần hoa văn Chăm pa cho vách reception
 * (trượt 15/16). Quy luật trượt của text-to-image:
 *   · tả "hoa văn Chăm"          → ra mandala Ấn Độ
 *   · tả "pattern lặp sang trọng" → ra damask châu Âu / vàng kim kitsch
 *   · tả "phẳng đơn giản"        → ra hoa 4 cánh ngây thơ
 *   · tả "phù điêu"              → ra khối 3D nổi (trong khi cần PHẲNG để in giấy dán tường)
 *   · CHỈ khi neo vào VẬT THỂ CỤ THỂ ("gạch gốm Chăm vuông đắp hoa văn") mới ra đúng motif.
 *
 * Nên lớp này làm 3 việc người dùng không phải biết:
 *  1. NEO VẬT THỂ: từ ô "neo văn hoá" tự sinh cụm vật thể thật (gạch gốm/phù điêu đá/khuôn đúc)
 *     thay vì để chữ "hoa văn <tên dân tộc>" trôi nổi.
 *  2. NEGATIVE CỨNG: luôn chặn mandala / damask / vàng kim kitsch; chọn "Pattern phẳng"
 *     thì chặn thêm mọi từ khoá tạo khối 3D.
 *  3. Dịch các select (dạng · nhịp lặp · tông · màu) sang thuật ngữ mà model hiểu.
 */

export const PATTERN_KINDS = ['Pattern phẳng', 'Phù điêu nổi', 'Mural (tranh cảnh)'] as const;
export const PATTERN_REPEATS = ['Grid', 'So le (half-drop)', 'Thưa', 'Dày', 'Không lặp'] as const;
export const PATTERN_TONES = ['Tone-on-tone', '2 màu', 'Đa sắc'] as const;

export type PatternKind = (typeof PATTERN_KINDS)[number];

/**
 * Negative CỨNG dùng cho mọi lần chạy — đây là danh sách "AI hay chệch sang" đã chẩn thật,
 * không phải negative chung chung về chất lượng ảnh.
 */
export const PATTERN_NEGATIVE_BASE =
  'mandala, india mandala, hindu mandala, kaleidoscope medallion, ' +
  'european baroque damask, victorian damask, rococo scrollwork, ' +
  'floral chinoiserie vintage, vintage wallpaper, shabby chic, ' +
  'kitsch bright gold, gold glitter, metallic gold foil, ' +
  'saturated red orange, neon colors, oversaturated, ' +
  'naive four-petal flower, childish flower, clipart, cartoon, ' +
  'watermark, text, letters, signature, logo, ' +
  'photo of a room, interior photograph, furniture, mockup frame';

/** Chặn thêm khi chọn "Pattern phẳng" — cần in được lên giấy dán tường, KHÔNG khối nổi. */
export const PATTERN_NEGATIVE_FLAT =
  '3d, 3d render, relief, bas-relief, embossed, carved, engraved, ' +
  'cast shadow, drop shadow, depth, bevel, extruded, glossy, ' +
  'specular highlight, sculptural, volumetric lighting, perspective, vanishing point';

/**
 * ⚠️ BÀI HỌC TỪ LẦN CHẠY THẬT (fal `flux/dev/image-to-image`): FLUX **bỏ qua**
 * `negative_prompt`. Lần chạy đầu với ảnh mẫu gạch Chăm + `dạng = Pattern phẳng` vẫn ra
 * PHÙ ĐIÊU NỔI (có bóng, có khối) mặc dù negative đã chặn `relief, cast shadow, bevel…`.
 * → Mọi ràng buộc SỐNG CÒN phải nằm ở prompt DƯƠNG (xem KIND_PROMPT + FLATTEN_FROM_REF).
 * Negative vẫn giữ vì SDXL/ComfyUI (mức oneAI) và một số model khác có đọc.
 */
export function patternNegative(kind: string): string {
  return kind === 'Pattern phẳng'
    ? `${PATTERN_NEGATIVE_BASE}, ${PATTERN_NEGATIVE_FLAT}`
    : PATTERN_NEGATIVE_BASE;
}

const KIND_PROMPT: Record<string, string> = {
  // Diễn đạt DƯƠNG (không dùng "no …") vì FLUX bỏ qua negative VÀ đọc phủ định rất yếu:
  // nói "flat vector fills / even matte / paper print" hiệu quả hơn "no shadow" nhiều.
  'Pattern phẳng':
    'completely flat two-dimensional graphic artwork, uniform flat colour fills with hard clean edges, ' +
    'perfectly even matte surface, vector illustration look, silkscreen print on paper, ' +
    'printed wallpaper design sheet scanned flat, frontal orthographic view, uniform ambient light',
  'Phù điêu nổi':
    'shallow bas-relief ornament panel, carved surface with real depth, ' +
    'raking side light revealing the carving, matte stone or terracotta material',
  'Mural (tranh cảnh)':
    'large-format wall mural artwork, one continuous scene rather than a repeating tile, ' +
    'hand-painted feel, composed for a full wall',
};

/**
 * Câu "dẹt khối" khi ảnh mẫu là ảnh chụp phù điêu/gạch mà đích là pattern PHẲNG
 * (in giấy dán tường). Diễn đạt dương, mô tả kết quả mong muốn thay vì cấm.
 */
export const FLATTEN_FROM_REF =
  'redraw the carved motif as flat filled silhouettes: keep only the outlines and shapes, ' +
  'replace every highlight, shadow and moulding with one solid flat colour, ' +
  'as if traced into a two-colour stencil for printing';

const REPEAT_PROMPT: Record<string, string> = {
  Grid: 'regular square grid repeat, motifs aligned in even rows and columns',
  'So le (half-drop)': 'half-drop offset repeat, rows staggered like brick coursing',
  Thưa: 'sparse motif placement, generous empty ground between motifs, calm rhythm',
  Dày: 'dense allover repeat, motifs packed tightly with little empty ground',
  'Không lặp': 'single non-repeating composition, no tiling',
};

const TONE_PROMPT: Record<string, string> = {
  'Tone-on-tone': 'tone-on-tone monochromatic palette, low contrast, motif read by texture not colour',
  '2 màu': 'strict two-colour palette only, one ground and one motif colour',
  'Đa sắc': 'restrained multi-colour palette, muted and harmonious, never garish',
};

/**
 * Neo văn hoá → cụm VẬT THỂ THẬT. Bài học: model chỉ ra đúng motif khi prompt nói tới
 * hiện vật cụ thể (viên gạch, tấm phù điêu, khuôn đúc), không phải tên phong cách chung.
 * Anchor rỗng → trả '' (không nhồi chữ vô nghĩa).
 */
export function culturalAnchor(anchor: string, kind: string): string {
  const a = anchor.trim();
  if (!a) return '';
  const artefact =
    kind === 'Pattern phẳng'
      ? `square fired-clay ${a} ornamental tiles laid in a wall, motifs traced flat from the real tiles`
      : kind === 'Phù điêu nổi'
        ? `carved sandstone ${a} temple panel, motifs copied from the real carved panel`
        : `painted ${a} temple wall scene, motifs copied from surviving wall art`;
  return (
    `ornament documented from ${a} architecture, ${artefact}, ` +
    `museum-accurate ${a} motif vocabulary, not a generic decorative style`
  );
}

/** Danh sách màu người dùng nhập (hex hoặc tên màu) → cụm prompt; bỏ ô trống. */
export function palettePrompt(colors: (string | undefined)[]): string {
  const list = colors.map((c) => String(c ?? '').trim()).filter(Boolean);
  if (!list.length) return '';
  return `colour palette limited to ${list.join(' and ')}`;
}

export interface PatternPromptInput {
  /** mô tả motif người dùng tự viết (ô prompt hoặc input text) */
  prompt: string;
  kind: string;
  repeat: string;
  tone: string;
  anchor: string;
  colors: (string | undefined)[];
  /** có ảnh mẫu nối vào input `reference` hay không — đổi cách diễn đạt */
  hasReference: boolean;
}

/**
 * Ghép prompt cuối. Thứ tự cố ý: neo vật thể trước (mạnh nhất) → motif người dùng tả →
 * dạng → nhịp lặp → tông → màu → khung kỹ thuật. Có reference thì nói rõ "giữ motif của ảnh mẫu".
 */
export function buildPatternPrompt(inp: PatternPromptInput): string {
  const parts: string[] = [];
  if (inp.hasReference) {
    parts.push(
      'keep the exact motif vocabulary, geometry and cultural character of the reference image',
    );
    // Ảnh mẫu gần như luôn là ẢNH CHỤP gạch/phù điêu (có khối). Muốn ra pattern PHẲNG phải
    // nói thẳng "dẹt cái khối đó đi", không thể dựa vào negative (FLUX bỏ qua).
    if (inp.kind === 'Pattern phẳng') parts.push(FLATTEN_FROM_REF);
  }
  const anchor = culturalAnchor(inp.anchor, inp.kind);
  if (anchor) parts.push(anchor);
  const own = inp.prompt.trim();
  if (own) parts.push(own);
  parts.push(KIND_PROMPT[inp.kind] ?? KIND_PROMPT['Pattern phẳng']);
  parts.push(REPEAT_PROMPT[inp.repeat] ?? REPEAT_PROMPT.Grid);
  parts.push(TONE_PROMPT[inp.tone] ?? TONE_PROMPT['Tone-on-tone']);
  const pal = palettePrompt(inp.colors);
  if (pal) parts.push(pal);
  parts.push('high resolution ornament artwork for architectural surface finishes, sharp detail');
  return parts.join(', ');
}

/**
 * Strength img2img theo `dạng`: đổi dạng càng xa ảnh mẫu thì cần strength cao hơn, nhưng
 * phải đủ thấp để không mất motif. Số này từ ý đồ nghiệp vụ: ảnh mẫu thường là ảnh CHỤP
 * gạch/phù điêu (có khối) mà đích lại là pattern PHẲNG → cần đổi nhiều hơn.
 * `keep` (slider "Giữ motif gốc", 0.3–0.9) cho phép người dùng tinh chỉnh quanh mức đó.
 */
export function referenceStrength(kind: string, keep: number): number {
  const k = Number.isFinite(keep) ? Math.max(0.3, Math.min(0.9, keep)) : 0.65;
  // keep cao = giữ ảnh gốc nhiều = strength thấp
  // 0.85 cho Pattern phẳng: đo thật — 0.78 vẫn giữ nguyên khối phù điêu của ảnh mẫu.
  const base = kind === 'Pattern phẳng' ? 0.85 : kind === 'Mural (tranh cảnh)' ? 0.8 : 0.68;
  const strength = base - (k - 0.65) * 0.5;
  return Math.round(Math.max(0.35, Math.min(0.92, strength)) * 100) / 100;
}
