// lib/library/thumb-kinds.ts — LOẠI MÓN + VÂN PROCEDURAL cho ô xem trước Thư viện.
//
// 🔴 Vì sao có file này (Hoà chê 04/08): bản cũ có 12 GRADIENT GIẢ 2 màu trơn trong `shelves.ts`,
// mỗi món một gradient bịa — trông như ảnh vật liệu thật nhưng không phải, và mọi món cùng loại
// lại khác màu vô nghĩa. Bậc thang thay thế (chốt TỔNG):
//   a) có `MaterialSphere` → PNG quả cầu render thật        ← đích, dùng cho kệ vật liệu
//   b) chưa có cầu        → VÂN PROCEDURAL theo LOẠI + icon  ← file này
//   c) ATLAS sync có ảnh  → ảnh thật cột "Ảnh"               ← `SheetItem.imageUrl`, ưu tiên cao nhất
//
// Nguyên tắc để không lặp lại lỗi cũ: tông màu gắn theo **LOẠI**, KHÔNG theo từng món. Mọi món gỗ
// dùng chung một tông gỗ cho tới khi có màu thật từ ATLAS — thà nói "đây là nhóm gỗ" cho đúng còn
// hơn bịa 12 màu khác nhau. Loại KHÔNG phải vật liệu (khối CAD, template) dùng token trung tính
// theo theme, không tô màu bịa.

import type { CSSProperties } from 'react';

/** Loại món — quyết định vân, icon, và có render quả cầu hay không. */
export type ThumbKind =
  // vật liệu — có quả cầu (bậc a)
  | 'wood' | 'stone' | 'metal' | 'paint' | 'fabric' | 'glass'
  // khối/ký hiệu CAD — trung tính
  | 'block' | 'furniture' | 'sanitary' | 'misc'
  // template chặng Trình bày — trung tính
  | 'page' | 'sheet';

const MATERIAL_KINDS: ThumbKind[] = ['wood', 'stone', 'metal', 'paint', 'fabric', 'glass'];

/** Loại này có quả cầu vật liệu không (bậc a)? */
export function isMaterialKind(kind: ThumbKind): boolean {
  return MATERIAL_KINDS.includes(kind);
}

/** Tông theo LOẠI (không theo món) — dùng cho cả vân procedural lẫn màu gốc quả cầu khi ATLAS
 * chưa trả màu thật. Cố định theo loại vật liệu nên KHÔNG đổi theo theme (cùng lý do badge phạm
 * vi: vật liệu là vật thật, không phải chrome của app). */
const TINT: Partial<Record<ThumbKind, { base: string; line: string; hi: string }>> = {
  wood: { base: '#a07c53', line: '#7d5c3a', hi: '#c2a077' },
  stone: { base: '#cfc9bd', line: '#a9a294', hi: '#e8e4dc' },
  metal: { base: '#b0b4b9', line: '#8d9298', hi: '#dfe3e7' },
  paint: { base: '#ddd8d0', line: '#c2bcb2', hi: '#f2efe9' },
  fabric: { base: '#bdb09a', line: '#9b8f7c', hi: '#d8cdb9' },
  glass: { base: '#bcd0d6', line: '#9db4bc', hi: '#e7f1f4' },
};

/** Cặp màu gốc cho quả cầu (bậc a) — sáng/tối của cùng một tông loại. */
export function tintFor(kind: ThumbKind): [string, string] {
  const t = TINT[kind];
  return t ? [t.base, t.line] : ['#9a9a9a', '#6f6f6f'];
}

// Nét vẽ trung tính cho loại KHÔNG phải vật liệu — bám token chữ nên tự đúng cả 2 theme.
// Bám --t3 (Sáng #726c62 · Tối #9e9ea8) — token DUY NHẤT đủ tương phản với nền ô ở CẢ 2 theme.
// Bản đầu dùng --t5: ở theme Sáng --t5 là #b8b1a7, pha loãng trên nền --field #f4f1eb thì mất
// hút, ô nhìn như trống trơn (bắt được khi verify 04/08).
const INK = 'color-mix(in srgb, var(--t3) 45%, transparent)';
const INK_SOFT = 'color-mix(in srgb, var(--t3) 26%, transparent)';

/**
 * Vân procedural theo loại (bậc b) — trả style đặt thẳng lên ô `.th`.
 * Gỗ = vân dọc · Đá = lấm tấm · Vải = dệt chéo · Kim loại = xước góc hẹp ·
 * Kính = vệt sáng chéo · Sơn = phẳng + ánh mềm. Loại phi-vật-liệu = lưới/nhịp trung tính.
 */
export function thumbTexture(kind: ThumbKind): CSSProperties {
  const t = TINT[kind];
  switch (kind) {
    case 'wood':
      return {
        background: `repeating-linear-gradient(91deg, ${t!.line} 0 1px, transparent 1px 7px),
                     repeating-linear-gradient(89deg, ${t!.hi} 0 1px, transparent 1px 13px),
                     ${t!.base}`,
      };
    case 'stone':
      return {
        background: `radial-gradient(circle at 22% 32%, ${t!.line} 0 1.6px, transparent 2.2px),
                     radial-gradient(circle at 68% 58%, ${t!.line} 0 2px, transparent 2.6px),
                     radial-gradient(circle at 44% 82%, ${t!.hi} 0 1.4px, transparent 2px),
                     ${t!.base}`,
        backgroundSize: '27px 23px, 35px 31px, 19px 17px',
      };
    case 'fabric':
      return {
        background: `repeating-linear-gradient(45deg, ${t!.line} 0 1px, transparent 1px 6px),
                     repeating-linear-gradient(-45deg, ${t!.hi} 0 1px, transparent 1px 6px),
                     ${t!.base}`,
      };
    case 'metal':
      return {
        background: `repeating-linear-gradient(100deg, ${t!.line} 0 1px, transparent 1px 3px),
                     linear-gradient(100deg, ${t!.hi} 0%, ${t!.base} 38%, ${t!.base} 62%, ${t!.hi} 100%)`,
      };
    case 'glass':
      return {
        background: `linear-gradient(118deg, transparent 28%, ${t!.hi} 40%, transparent 50%),
                     linear-gradient(118deg, transparent 62%, ${t!.hi} 71%, transparent 80%),
                     ${t!.base}`,
      };
    case 'paint':
      return {
        background: `radial-gradient(120% 88% at 30% 18%, ${t!.hi} 0%, transparent 62%), ${t!.base}`,
      };
    case 'block':
      // lưới kiểu bản vẽ — đúng ngữ cảnh ký hiệu CAD
      return {
        background: `repeating-linear-gradient(0deg, ${INK_SOFT} 0 1px, transparent 1px 11px),
                     repeating-linear-gradient(90deg, ${INK_SOFT} 0 1px, transparent 1px 11px),
                     var(--field)`,
      };
    case 'furniture':
      return {
        background: `repeating-linear-gradient(45deg, ${INK_SOFT} 0 1px, transparent 1px 9px), var(--field)`,
      };
    case 'sanitary':
      return {
        background: `radial-gradient(circle at 50% 50%, ${INK_SOFT} 0 1.3px, transparent 1.8px), var(--field)`,
        backgroundSize: '12px 12px',
      };
    case 'page':
      // nhịp dòng chữ — gợi trang tài liệu
      return {
        background: `repeating-linear-gradient(180deg, ${INK} 0 1px, transparent 1px 8px), var(--field)`,
        backgroundSize: '58% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundColor: 'var(--field)',
      };
    case 'sheet':
      // khung bố cục — 2 mảng lệch nhau, gợi trang có ảnh + chú thích
      return {
        background: `linear-gradient(180deg, ${INK_SOFT} 0 58%, transparent 58%),
                     repeating-linear-gradient(180deg, transparent 0 62%, ${INK} 62% calc(62% + 1px), transparent calc(62% + 1px) 74%),
                     var(--field)`,
        backgroundSize: '62% 100%, 62% 100%, auto',
        backgroundRepeat: 'no-repeat, no-repeat, repeat',
        backgroundPosition: 'center, center, center',
      };
    default:
      return { background: 'var(--field)' };
  }
}

/** Nhãn loại (tooltip ô xem trước) — chữ người dùng, không phải mã nội bộ. */
export const KIND_LABEL: Record<ThumbKind, [string, string]> = {
  wood: ['Gỗ', 'Wood'],
  stone: ['Đá', 'Stone'],
  metal: ['Kim loại', 'Metal'],
  paint: ['Sơn', 'Paint'],
  fabric: ['Vải', 'Fabric'],
  glass: ['Kính', 'Glass'],
  block: ['Ký hiệu bản vẽ', 'Drawing symbol'],
  furniture: ['Nội thất', 'Furniture'],
  sanitary: ['Thiết bị vệ sinh', 'Sanitary'],
  misc: ['Khối phụ trợ', 'Helper block'],
  page: ['Mẫu trang', 'Page template'],
  sheet: ['Mẫu bố cục', 'Layout template'],
};
