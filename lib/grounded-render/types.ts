/**
 * lib/grounded-render/types.ts — GroundedRender ("Render bám ý") · kiểu THUẦN, lát v0.
 *
 * Marker: GroundedRender — entry `grounded-render` (frontier-registry) grep định danh này.
 *
 * Hai khối kiểu:
 *  1. PHIẾU ĐỌC B 4 CẤP (`ReferenceSheet`) — máy đọc ảnh tham khảo B ra phiếu, KTS duyệt/sửa
 *     TỪNG DÒNG trước khi áp (SPEC-GROUNDED-RENDER §2 B3, luật [T5] máy trình phiếu người duyệt).
 *     Cờ dòng dùng ĐÚNG khuôn 3 nấc của lib/distill (`TrangThaiNguon`) — máy suy = 'inferred',
 *     người đã xác nhận/sửa = 'verified'. Phiếu KHÔNG có nấc 'measured' (đọc ảnh luôn là suy).
 *  2. `RegionMask` — mảng có ĐỊNH DANH nền (RegionId-tương-thích, REVIEW-DONG-BO 13/08):
 *     sau này ảnh render từ scene IF chiếu thẳng entity → mask (entityId ↔ regionId), không cần
 *     SAM. v0 mask đến từ node Cắt nền / Mặt nạ đối tượng / vẽ tay.
 *
 * Import TƯƠNG ĐỐI (không `@/…`) để test chạy được bằng sucrase-node (cùng lý do lib/distill).
 */
import type { TrangThaiNguon } from '../distill/types';

/* ───────────────────────── PHIẾU ĐỌC B 4 CẤP ───────────────────────── */

/** 4 cấp của phiếu — đúng thứ tự SPEC-GROUNDED-RENDER §2 B3. */
export type MucPhieu = 'tong-the' | 'tran-tuong-san' | 'vat-lieu' | 'chi-tiet';

export const MUC_PHIEU_META: Array<{ muc: MucPhieu; label: string; labelEn: string }> = [
  { muc: 'tong-the', label: '① Tổng thể (tone · ánh sáng · nước hình)', labelEn: 'Overall (tone · light · finish)' },
  { muc: 'tran-tuong-san', label: '② Trần / tường / sàn (sắc độ từng lớp)', labelEn: 'Ceiling / walls / floor' },
  { muc: 'vat-lieu', label: '③ Mảng vật liệu', labelEn: 'Materials' },
  { muc: 'chi-tiet', label: '④ Chi tiết / cấu kiện / đồ rời', labelEn: 'Details / elements / furniture' },
];

/** Cờ dòng phiếu — tập con của khuôn 3 nấc lib/distill: đọc ảnh không bao giờ là 'measured'. */
export type CoDongPhieu = Extract<TrangThaiNguon, 'inferred' | 'verified'>;

export interface ReferenceSheetLine {
  /** id ổn định trong phiếu (vd 'tong-the.tone') — người sửa dòng nào máy biết dòng đó. */
  id: string;
  muc: MucPhieu;
  /** nhãn dòng cho người đọc (vd 'Tone tổng thể'). */
  label: string;
  /** '' = TRỐNG — chưa nguồn nào nói tới, KHÔNG bịa (luật DistillEngine). */
  value: string;
  flag: CoDongPhieu;
  /** id nguồn đóng góp (khớp DistilledField.nguon) — rỗng khi dòng trống. */
  nguon: string[];
}

export interface ReferenceSheet {
  version: 1;
  /** định danh ảnh B truy ngược được (assetId / đường dẫn / 'anh-b'). */
  imageBId: string;
  lines: ReferenceSheetLine[];
}

/* ───────────────────────── MẢNG ĐỊNH DANH (RegionId) ───────────────────────── */

/** Định danh mảng có nền — chuỗi mở (scene IF sau này chiếu entityId vào đây). */
export type RegionId = string;

/** Bộ mảng gợi ý v0 — đúng danh sách SPEC-GROUNDED-RENDER §2 B2. */
export const REGION_IDS: Array<{ id: RegionId; label: string; labelEn: string }> = [
  { id: 'san', label: 'Sàn', labelEn: 'Floor' },
  { id: 'tuong-trai', label: 'Tường trái', labelEn: 'Left wall' },
  { id: 'tuong-phai', label: 'Tường phải', labelEn: 'Right wall' },
  { id: 'tuong-cuoi', label: 'Tường cuối', labelEn: 'Back wall' },
  { id: 'tran', label: 'Trần', labelEn: 'Ceiling' },
  { id: 'cua', label: 'Cửa', labelEn: 'Door / opening' },
  { id: 'panel', label: 'Panel / ốp', labelEn: 'Panel / cladding' },
  { id: 'fur', label: 'Đồ nội thất', labelEn: 'Furniture' },
  { id: 'den', label: 'Đèn', labelEn: 'Lighting' },
];

export function regionLabelToId(label: string): RegionId {
  const hit = REGION_IDS.find((r) => r.label === label || r.labelEn === label || r.id === label);
  return hit ? hit.id : label.trim().toLowerCase().replace(/\s+/g, '-');
}

export interface RegionMask {
  id: RegionId;
  label: string;
  /** data-URI/URL PNG trắng-đen (TRẮNG = vùng áp) — cùng chuẩn mask inpaint hiện có. */
  maskRef: string;
}

/* ───────────────────────── encode / decode phiếu ───────────────────────── */

/** Phiếu trống đủ 4 cấp — dùng khi máy đọc CHƯA nối được (điền tay), không giả kết quả. */
export function emptyReferenceSheet(imageBId: string): ReferenceSheet {
  const lines: ReferenceSheetLine[] = [
    { id: 'tong-the.tone', muc: 'tong-the', label: 'Tone & không khí', value: '', flag: 'inferred', nguon: [] },
    { id: 'tong-the.phong-cach', muc: 'tong-the', label: 'Phong cách', value: '', flag: 'inferred', nguon: [] },
    { id: 'tong-the.loai-phong', muc: 'tong-the', label: 'Loại không gian', value: '', flag: 'inferred', nguon: [] },
    { id: 'tran-tuong-san.tran', muc: 'tran-tuong-san', label: 'Trần', value: '', flag: 'inferred', nguon: [] },
    { id: 'tran-tuong-san.tuong', muc: 'tran-tuong-san', label: 'Tường', value: '', flag: 'inferred', nguon: [] },
    { id: 'tran-tuong-san.san', muc: 'tran-tuong-san', label: 'Sàn', value: '', flag: 'inferred', nguon: [] },
    { id: 'vat-lieu.chinh', muc: 'vat-lieu', label: 'Vật liệu chính', value: '', flag: 'inferred', nguon: [] },
    { id: 'chi-tiet.diem-nhan', muc: 'chi-tiet', label: 'Chi tiết / điểm nhấn', value: '', flag: 'inferred', nguon: [] },
  ];
  return { version: 1, imageBId, lines };
}

/** Phiếu → chuỗi JSON (pretty) — dạng chạy trên dây text giữa các node, người sửa trực tiếp được. */
export function encodeReferenceSheet(sheet: ReferenceSheet): string {
  return JSON.stringify(sheet, null, 2);
}

const MUC_HOP_LE = new Set<string>(['tong-the', 'tran-tuong-san', 'vat-lieu', 'chi-tiet']);
const FLAG_HOP_LE = new Set<string>(['inferred', 'verified']);

/**
 * Chuỗi (người có thể đã sửa tay) → phiếu. Trả `{ sheet }` hoặc `{ error }` chữ rõ ràng —
 * KHÔNG throw để node tự quyết cách báo; KHÔNG lặng lẽ trả phiếu rỗng khi JSON hỏng.
 */
export function decodeReferenceSheet(text: string): { sheet?: ReferenceSheet; error?: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { error: 'Phiếu không phải JSON hợp lệ — kiểm tra lại phần vừa sửa (thiếu dấu phẩy/ngoặc?).' };
  }
  const j = raw as Partial<ReferenceSheet>;
  if (j.version !== 1 || !Array.isArray(j.lines)) {
    return { error: 'Phiếu sai cấu trúc (cần {version:1, imageBId, lines:[…]}).' };
  }
  const lines: ReferenceSheetLine[] = [];
  for (const l of j.lines) {
    const ln = l as Partial<ReferenceSheetLine>;
    if (typeof ln.id !== 'string' || !MUC_HOP_LE.has(String(ln.muc))) {
      return { error: `Dòng phiếu hỏng (id "${String(ln.id)}") — mỗi dòng cần id + muc hợp lệ.` };
    }
    lines.push({
      id: ln.id,
      muc: ln.muc as MucPhieu,
      label: typeof ln.label === 'string' ? ln.label : ln.id,
      value: typeof ln.value === 'string' ? ln.value : '',
      flag: FLAG_HOP_LE.has(String(ln.flag)) ? (ln.flag as CoDongPhieu) : 'inferred',
      nguon: Array.isArray(ln.nguon) ? ln.nguon.map(String) : [],
    });
  }
  return { sheet: { version: 1, imageBId: typeof j.imageBId === 'string' ? j.imageBId : 'anh-b', lines } };
}

/** Phiếu → văn bản người đọc (hiện trong node/panel) — nhóm theo 4 cấp, dòng trống ghi rõ. */
export function sheetToText(sheet: ReferenceSheet): string {
  const out: string[] = [];
  for (const meta of MUC_PHIEU_META) {
    const lines = sheet.lines.filter((l) => l.muc === meta.muc);
    if (lines.length === 0) continue;
    out.push(meta.label);
    for (const l of lines) {
      const flag = l.flag === 'verified' ? '✓ đã duyệt' : '· máy suy, chờ duyệt';
      out.push(`  ${l.label}: ${l.value || '(trống — điền tay nếu cần)'}  [${flag}]`);
    }
  }
  return out.join('\n');
}

/** Các giá trị đã có của một cấp (bỏ dòng trống) — node dựng chỉ dẫn inpaint đọc từ đây. */
export function sheetValues(sheet: ReferenceSheet, muc: MucPhieu): string[] {
  return sheet.lines.filter((l) => l.muc === muc && l.value.trim()).map((l) => l.value.trim());
}
