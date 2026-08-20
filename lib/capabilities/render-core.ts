/**
 * lib/capabilities/render-core.ts — PHẦN THUẦN của năng lực `render`: bảng ba chế độ, khung máy
 * quay, băm bản-sửa-cảnh, bản ghi kết quả, cờ CŨ.
 *
 * TÁCH RIÊNG khỏi `render.ts` vì đúng một lý do: `render.ts` phải chạm zustand + `lib/store` +
 * hàng đợi (React/@xyflow), nên KHÔNG chạy được dưới `sucrase-node` — mà đây lại chính là phần
 * cần test. Cùng khuôn `lib/present-editor/handoff.ts` ("tách THUẦN để test không cần DOM").
 * ⇒ File này: 0 import runtime, 0 React, 0 store. `render.ts` re-export lại toàn bộ để nơi gọi
 *   chỉ cần biết MỘT cửa.
 *
 * Luật của tầng này (chi tiết + negative evidence ở đầu `render.ts`):
 *  ① CẤM KHAI KHỐNG — chế độ nào backend không làm được thì nói thẳng. ⛔ Không có "ray tracing".
 *  ② Nguồn đổi ⇒ CHỈ đánh dấu CŨ, không tự sinh lại (tiền thật, người bấm).
 *  ③ Ảnh/phim không mang con số nào vào BOQ.
 */

/* ══════════════════════════════ ① BA CHẾ ĐỘ — khai THẬT ══════════════════════════════ */

export type CheDoRenderId = 'xemTruocThietKe' | 'xemTruocChatLuong' | 'banCuoi';

export interface CheDoRender {
  id: CheDoRenderId;
  ten: [string, string];
  /** Nói ĐÚNG cái máy làm, không nói cái nghe kêu. Đây là chỗ dễ khai khống nhất. */
  giaiThich: [string, string];
  /** Chuỗi node nội bộ chạy thật. Rỗng = không gọi AI, không tốn gì. */
  lenhNoiBo: string[];
  /** Tổng credit khai sẵn của chuỗi node (registry.ts `creditCost`). */
  credit: number;
  /** Cần nhà cung cấp AI hay không — quyết định nút có mờ khi chưa cấu hình. */
  canProvider: boolean;
  rongPx: number;
}

export const CHE_DO_RENDER: readonly CheDoRender[] = [
  {
    id: 'xemTruocThietKe',
    ten: ['Xem trước thiết kế', 'Design preview'],
    giaiThich: [
      'Chụp đúng khung nhìn 3D đang mở — khối xám, chưa vật liệu, chưa đèn. Tất định, 0 credit.',
      'Captures the exact 3D view — grey massing, no materials, no lighting. Deterministic, free.',
    ],
    lenhNoiBo: [],
    credit: 0,
    canProvider: false,
    rongPx: 1280,
  },
  {
    id: 'xemTruocChatLuong',
    ten: ['Xem trước chất lượng cao', 'High-quality preview'],
    giaiThich: [
      'Khối xám khoá hình học rồi để AI phủ vật liệu và ánh sáng (ai.clay2render). Không phải dò tia.',
      'Locks the massing geometry, then AI adds materials and light (ai.clay2render). Not ray tracing.',
    ],
    lenhNoiBo: ['ai.clay2render'],
    credit: 4,
    canProvider: true,
    rongPx: 1280,
  },
  {
    id: 'banCuoi',
    ten: ['Bản cuối', 'Final'],
    giaiThich: [
      'Như trên rồi phóng to (ai.upscale ×2) cho bản nộp. Vẫn là ảnh AI, không phải ảnh dò tia.',
      'As above, then upscaled ×2 for delivery. Still an AI image, not a ray-traced one.',
    ],
    lenhNoiBo: ['ai.clay2render', 'ai.upscale'],
    credit: 6,
    canProvider: true,
    rongPx: 1600,
  },
] as const;

export function cheDoTheoId(id: CheDoRenderId): CheDoRender {
  const c = CHE_DO_RENDER.find((x) => x.id === id);
  if (!c) throw new Error(`Chế độ render không có trong bảng: ${id}`);
  return c;
}

/**
 * Chế độ này bấm được chưa? Trả `null` nếu được; trả LÝ DO THẬT nếu chưa (nút mờ kèm lý do —
 * §9, không ẩn nút, không nút giả).
 */
export function lyDoKhongBamDuoc(
  cheDo: CheDoRender,
  coProvider: boolean,
  soKhoi: number,
): [string, string] | null {
  if (soKhoi === 0)
    return [
      'Cảnh chưa có khối nào — dựng khối hoặc đùn từ mặt bằng 2D trước.',
      'The scene has no blocks yet — model something or extrude the 2D plan first.',
    ];
  if (cheDo.canProvider && !coProvider)
    return [
      'Chưa có nhà cung cấp AI nào được cấu hình (fal / ComfyUI / SD). Chế độ Xem trước thiết kế vẫn chạy được.',
      'No AI provider configured (fal / ComfyUI / SD). Design preview still works.',
    ];
  return null;
}

/* ══════════════════════════ ② KHUNG MÁY QUAY + BẢN SỬA CỦA CẢNH ══════════════════════ */

/** Khung máy quay ĐÃ ĐO tại thời điểm chụp — không phải preset, là pose thật của viewport. */
export interface KhungMayQuay {
  viTriM: [number, number, number];
  nhinToiM: [number, number, number];
  /** FOV dọc (độ) — đúng thứ `THREE.PerspectiveCamera` đang dùng. */
  fovDoc: number;
  tyLe: number;
  rongPx: number;
  caoPx: number;
}

/** Băm ổn định (FNV-1a 32-bit, hex 8 ký tự) — thuần, cùng đầu vào luôn cùng đầu ra. */
export function bamChuoi(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

const revCache = new WeakMap<object, string>();

/**
 * "Bản sửa" của cảnh = băm nội dung cảnh. KHÔNG có số revision nào trong `Doc` hôm nay (đo 20/08:
 * `Scene3DData` không mang version), nên đo bằng thứ ĐO ĐƯỢC: chính nội dung. Đổi một bức tường
 * là băm đổi ⇒ mọi kết quả gắn băm cũ tự thành CŨ.
 */
export function bamSceneRev(scene: unknown): string {
  if (scene && typeof scene === 'object') {
    const cached = revCache.get(scene as object);
    if (cached) return cached;
    const v = bamChuoi(JSON.stringify(scene));
    revCache.set(scene as object, v);
    return v;
  }
  return bamChuoi(String(scene));
}

/* ══════════════════════════════ ③ BẢN GHI KẾT QUẢ ══════════════════════════════ */

export type LoaiKetQua = 'anh' | 'phim';
export type TrangThaiKetQua = 'xemTruoc' | 'daNhan';

/**
 * MỘT kết quả kèm gia phả. Đây là "định nghĩa đi cùng tệp" (chốt 15/08) — không có trường nào ở
 * đây là số đo công trình; ảnh/phim là `khongPhaiSoDo`.
 */
export interface BanGhiKetQua {
  id: string;
  loai: LoaiKetQua;
  /** URL kết quả (http của provider, hoặc data URI với bản chụp offscreen). */
  url: string;
  ten: string;
  cheDo?: CheDoRenderId;
  camera?: KhungMayQuay;
  /** Băm cảnh LÚC SINH RA — so với băm hiện tại để biết còn mới hay đã cũ. */
  sceneRev: string;
  /** Nhà cung cấp đã chạy thật (hoặc 'khong-ai' với bản chụp offscreen). */
  provider: string;
  credit: number;
  /** Node thật trên canvas đã sinh ra nó — đường "đi tới nguồn" và là gốc của id ổn định. */
  nodeId?: string;
  /** Với phim: id của ảnh đã Nhận làm nguồn. */
  nguonId?: string;
  /** Tham số đã dùng, khai nguyên văn để tái lập được. */
  thamSo: Record<string, string | number>;
  trangThai: TrangThaiKetQua;
  luc: number;
}

/** Kết quả này còn khớp cảnh hiện tại không? Nguồn đổi ⇒ CŨ (luật ②: chỉ đánh dấu, không sinh lại). */
export function laBanCu(bg: BanGhiKetQua, sceneRevHienTai: string | null): boolean {
  if (!sceneRevHienTai) return false;
  return bg.sceneRev !== sceneRevHienTai;
}

