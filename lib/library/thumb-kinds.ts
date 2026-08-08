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
  | 'page' | 'sheet'
  // VIỆC 7b (07/08) — preset dựng ảnh, MỖI kiểu ánh sáng một vân RIÊNG. Trước đây cả 5 preset
  // (Nắng chiều/Trời phủ mây/Đèn đêm/Nắng sớm/Studio trắng) đều khai `kind:'sheet'` ⇒ 3 ánh sáng
  // đối lập nhau vẽ ra CÙNG một khung xám — không ai phân biệt được preset nào là preset nào chỉ
  // bằng nhìn ô xem trước (bắt được khi Hoà kiểm bằng mắt, đúng luật §0m "thứ thuần thị giác phải
  // qua mắt người"). Đây vẫn là VÂN PROCEDURAL (bậc b) — preset THẬT có ảnh preview riêng thì
  // dùng `imageUrl` (bậc c, ưu tiên cao hơn, xem `ItemThumb`), 5 loại này chỉ là placeholder có
  // NGHĨA thay vì ô xám vô nghĩa.
  | 'light-gold' | 'light-overcast' | 'light-night' | 'light-dawn' | 'light-studio';

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
  stone: { base: '#eceae6', line: '#b9b5ad', hi: '#ffffff' }, // đá mài: trắng LẠNH, bóng
  metal: { base: '#b0b4b9', line: '#8d9298', hi: '#dfe3e7' },
  paint: { base: '#e7dfd0', line: '#cfc6b6', hi: '#f6f1e7' }, // sơn: trắng ngà ẤM, matte
  fabric: { base: '#bdb09a', line: '#9b8f7c', hi: '#d8cdb9' },
  glass: { base: '#bcd0d6', line: '#9db4bc', hi: '#e7f1f4' },
  // 5 preset ánh sáng (VIỆC 7b) — tông đi thẳng theo TÊN preset, không phải màu bịa: vàng cam low
  // sun (nắng chiều) · xám xanh phẳng không đổ bóng (trời phủ mây) · navy gần đen + đốm ấm cửa sổ
  // (đèn đêm) · hồng-tím nhạt đường chân trời (nắng sớm) · trắng xám trung tính đều (studio).
  'light-gold': { base: '#f2b25a', line: '#c47f2c', hi: '#ffe1a8' },
  'light-overcast': { base: '#c7cdd3', line: '#9aa3ab', hi: '#e4e8eb' },
  'light-night': { base: '#171a2b', line: '#0b0d18', hi: '#e8b64a' },
  'light-dawn': { base: '#f0c9c2', line: '#d99a9c', hi: '#fbe6d8' },
  'light-studio': { base: '#e9e9e6', line: '#c9c9c4', hi: '#ffffff' },
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
    // 5 preset ánh sáng — mỗi preset một BỐ CỤC gradient khác nhau (không chỉ đổi màu nền), để
    // "nhìn là phân biệt được" kể cả khi chụp ảnh xám (in đen trắng) — vị trí sáng/tối mã hoá
    // thêm thông tin ngoài màu, giống tinh thần TB2 "nét không phải style, nét là thông tin".
    case 'light-gold':
      // mặt trời thấp góc dưới-phải, quầng sáng lớn — đặc trưng golden hour.
      return {
        background: `radial-gradient(circle at 78% 82%, ${t!.hi} 0%, ${t!.base} 38%, transparent 70%), ${t!.base}`,
      };
    case 'light-overcast':
      // phẳng lì, không điểm sáng nào — đúng cảm giác trời phủ mây, không đổ bóng.
      return { background: `linear-gradient(180deg, ${t!.hi} 0%, ${t!.base} 100%)` };
    case 'light-night':
      // nền gần đen + các đốm sáng ấm rải rác (đèn cửa sổ ban đêm).
      return {
        background: `radial-gradient(circle at 24% 30%, ${t!.hi} 0 2px, transparent 3px),
                     radial-gradient(circle at 62% 55%, ${t!.hi} 0 1.6px, transparent 2.4px),
                     radial-gradient(circle at 82% 22%, ${t!.hi} 0 1.4px, transparent 2px),
                     ${t!.base}`,
        backgroundSize: '30px 26px, 22px 20px, 26px 24px',
      };
    case 'light-dawn':
      // dải chân trời ngang, sáng dần lên trên — nắng sớm còn thấp.
      return {
        background: `linear-gradient(0deg, ${t!.hi} 0%, ${t!.base} 45%, ${t!.line} 100%)`,
      };
    case 'light-studio':
      // sáng đều toàn khung, gần như không gradient — ánh sáng studio dàn đều triệt bóng.
      return { background: t!.base };
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
  'light-gold': ['Nắng chiều', 'Golden hour'],
  'light-overcast': ['Trời phủ mây', 'Overcast'],
  'light-night': ['Đèn đêm', 'Night lighting'],
  'light-dawn': ['Nắng sớm', 'Dawn'],
  'light-studio': ['Studio trắng', 'White studio'],
};

/* ═══════════ VIỆC 3 phiếu M-IDFC-2 (07/08 khuya) — ÁNH XẠ ThumbKind ↔ IdfcKind ═══════════
 *
 * Trước phiếu này có BA hệ phân loại chồng chéo không ánh xạ được nhau (ThumbKind 12 ·
 * IdfcMeta.kind v1 5 · BlockGroup 10). Chốt 11.4: `IdfcKind` (lib/cad/idfc.ts) là trục
 * DUY NHẤT "nó là cái gì"; BlockGroup giữ làm trục ② "dùng ở đâu" — ĐỘC LẬP, không trộn.
 * ThumbKind từ nay là HÌNH THỨC Ô XEM TRƯỚC, không phải hệ phân loại: ánh xạ THUMB→KIND là
 * n→1 (6 thumb vật liệu wood/stone/… đều là kind 'material'), chiều ngược KIND→THUMB chọn một
 * hình thức mặc định.
 *
 * 🔴 08/08 — `.idfc` lên v3, thêm `IdfcKind` thứ 12 **`preset`** (00-CHOT.md mục 08/08, ĐÃ
 * DUYỆT). 5 thumb `light-*` (preset dựng ảnh) TRƯỚC đây phải mượn tạm `asset` vì chốt 11.4 chưa
 * có kind riêng cho chúng — nay gỡ chỗ mượn, map đúng `preset`.
 */
import type { IdfcKind } from '../cad/idfc';

export function idfcKindOfThumb(t: ThumbKind): IdfcKind {
  switch (t) {
    case 'wood': case 'stone': case 'metal': case 'paint': case 'fabric': case 'glass':
      return 'material';
    case 'furniture': return 'furniture';
    case 'sanitary': return 'fixture';
    case 'block': case 'misc':
      // ký hiệu/khối CAD chung (cửa, người tỉ lệ, cây…) — cấu kiện vật lý trung tính nhất là
      // 'furniture'; phân loại tinh hơn (cửa → fitout?) cần dữ liệu thật từng món, không đoán ở tầng thumb.
      return 'furniture';
    case 'page': case 'sheet': return 'page';
    case 'light-gold': case 'light-overcast': case 'light-night': case 'light-dawn': case 'light-studio':
      return 'preset'; // v3 — kind riêng cho preset dựng ảnh, không còn mượn 'asset'
  }
}

/** Hình thức ô xem trước MẶC ĐỊNH cho mỗi kind — dùng khi dựng SheetItem từ file .idfc
 * (BulkIngest/kệ). Vật liệu chọn 'paint' trung tính vì loại gỗ/đá thật nằm trong pbr.typeId —
 * ItemThumb đường vật liệu tự đọc pbr, giá trị này chỉ là fallback. */
export const THUMB_OF_IDFC_KIND: Record<IdfcKind, ThumbKind> = {
  material: 'paint',
  furniture: 'furniture',
  millwork: 'furniture',
  fitout: 'misc',
  fixture: 'sanitary',
  soft: 'fabric',
  page: 'page',
  video: 'sheet',
  doc: 'sheet',
  asset: 'misc',
  brandkit: 'sheet',
  // 'light-studio' (phẳng đều, trung tính) làm mặc định — không chọn tông màu mạnh (gold/night)
  // để đại diện chung cho MỌI preset, tránh ngụ ý sai "preset nào cũng ấm/tối".
  preset: 'light-studio',
};

/** Nhãn tiếng Việt · English cho `IdfcKind` — nơi tiêu thụ: ngăn lọc theo loại của kệ
 * "Cấu kiện (.idfc)" (`LibrarySheet.tsx`, VIỆC .idfc v3 08/08). Thứ tự khớp `IDFC_KINDS`. */
export const IDFC_KIND_LABEL: Record<IdfcKind, [string, string]> = {
  material: ['Vật liệu', 'Material'],
  furniture: ['Đồ rời', 'Furniture'],
  millwork: ['Đồ mộc đóng', 'Millwork'],
  fitout: ['Chi tiết hoàn thiện', 'Fit-out'],
  fixture: ['Thiết bị cố định', 'Fixture'],
  soft: ['Đồ vải', 'Soft furnishing'],
  page: ['Mẫu trang', 'Page template'],
  video: ['Mẫu video', 'Video template'],
  doc: ['Văn bản', 'Document'],
  asset: ['Ảnh tham chiếu', 'Reference asset'],
  brandkit: ['Bộ nhận diện', 'Brand kit'],
  preset: ['Preset dựng ảnh', 'Render preset'],
};
