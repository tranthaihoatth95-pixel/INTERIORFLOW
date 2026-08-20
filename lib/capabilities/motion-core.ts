/**
 * lib/capabilities/motion-core.ts — PHẦN THUẦN của năng lực `motion`: bảng ý định chuyển động,
 * thời lượng, chất lượng, và phép ghép prompt.
 *
 * Tách khỏi `motion.ts` cùng một lý do như `render-core.ts`: `motion.ts` chạm store/hàng đợi nên
 * không chạy được dưới `sucrase-node`, mà đây mới là phần cần test. 0 import runtime.
 *
 * ⛔ Mọi giá trị ở đây phải TRÙNG KHỚP tham số node `ai.image2video` (lib/nodes/registry.ts:561).
 *    Thêm một giá trị node không nhận = nút giả.
 */

/* ══════════════════════════════ Ý ĐỊNH CHUYỂN ĐỘNG ══════════════════════════════ */

export type YDinhChuyenDongId = 'toiTruoc' | 'lui' | 'lia' | 'nangLen' | 'quanhVat' | 'dungYen';

export interface YDinhChuyenDong {
  id: YDinhChuyenDongId;
  ten: [string, string];
  /** Mẩu prompt tiếng Anh nhồi vào param `motion` của `ai.image2video`. */
  prompt: string;
}

/**
 * Sáu ý định — ngôn ngữ MÁY QUAY của nghề, không phải thuật ngữ mô hình. Cố ý ít: mỗi dòng thêm
 * là một thứ người dùng phải đọc (§18 "phức tạp bên dưới ≠ nhiều núm bên trên").
 */
export const Y_DINH_CHUYEN_DONG: readonly YDinhChuyenDong[] = [
  {
    id: 'toiTruoc',
    ten: ['Tiến vào phòng', 'Dolly in'],
    prompt: 'slow cinematic dolly forward into the room, subtle parallax, stable horizon',
  },
  {
    id: 'lui',
    ten: ['Lùi ra', 'Dolly out'],
    prompt: 'slow cinematic dolly backward revealing the whole room, stable horizon',
  },
  {
    id: 'lia',
    ten: ['Lia ngang', 'Pan'],
    prompt: 'slow smooth horizontal camera pan across the interior, stable horizon',
  },
  {
    id: 'nangLen',
    ten: ['Nâng máy', 'Crane up'],
    prompt: 'slow crane up movement, camera rising gently, stable horizon',
  },
  {
    id: 'quanhVat',
    ten: ['Vòng quanh vật', 'Orbit'],
    prompt: 'slow orbit around the main furniture piece, consistent lighting',
  },
  {
    id: 'dungYen',
    ten: ['Máy đứng yên', 'Locked off'],
    prompt: 'locked-off static camera, only ambient light and fabric move very subtly',
  },
] as const;

export function yDinhTheoId(id: YDinhChuyenDongId): YDinhChuyenDong {
  const y = Y_DINH_CHUYEN_DONG.find((x) => x.id === id);
  if (!y) throw new Error(`Ý định chuyển động không có trong bảng: ${id}`);
  return y;
}

/** Thời lượng — ĐÚNG hai giá trị `VIDEO_DURATIONS` của node (registry.ts:167). Không thêm giá trị
 * node không nhận. */
export const THOI_LUONG = ['5s', '10s'] as const;
export type ThoiLuong = (typeof THOI_LUONG)[number];

/** Chất lượng — ĐÚNG `VIDEO_MODELS` của node (registry.ts:166). */
export const CHAT_LUONG_VIDEO = ['Kling 2.5 Turbo Pro (nhanh)', 'Kling 2 Master (chất lượng)'] as const;
export type ChatLuongVideo = (typeof CHAT_LUONG_VIDEO)[number];

/** Credit của một lượt — khai sẵn ở node (`creditCost: 8`). Không đoán, không nội suy theo giây. */
export const CREDIT_MOT_LUOT_VIDEO = 8;

/** Ghép prompt chuyển động: ý định trước, mô tả thêm của người dùng sau. Thuần, test được. */
export function dungPromptChuyenDong(id: YDinhChuyenDongId, moTaThem = ''): string {
  const extra = moTaThem.trim();
  const base = yDinhTheoId(id).prompt;
  return extra ? `${base}, ${extra}` : base;
}

