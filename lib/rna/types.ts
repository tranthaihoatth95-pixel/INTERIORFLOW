/**
 * lib/rna/types.ts — IfRna v0 (P6, phiếu `docs/phieu-giao/if-rna-v0.md`): HỆ THUỘC TÍNH TỰ MÔ TẢ,
 * học Blender RNA/DNA (BAN-THIET-KE-HE-THONG-IF §3): data tự khai metadata (nhãn · đơn vị ·
 * miền · nhóm · lan truyền) → UI TỰ SINH từ định nghĩa, không code tay từng ô nhập [T2].
 *
 * v0 CHỈ proof trên MaterialPbr (`material-pbr.rna.ts` + `components/materials/RnaPanel.tsx`).
 * ⛔ KHÔNG RNA-hoá BuildOp/.idfc ở bậc này — thành công đo được mới nhân rộng (phiếu §BIÊN).
 *
 * QUY ƯỚC HÀNH VI v0 (để panel tự sinh GIỮ ĐÚNG hành vi panel tay cũ, không sáng tác):
 *  · `anTheo` chứa `'suyDoan'` ⇒ người dùng chỉnh trường này là XOÁ cờ `suyDoan` — giá trị
 *    thành KHAI BÁO (K3), đúng semantics `setRoughness`/`setTransparency` của material-edit.ts.
 *    Logic nằm ở `ifRnaWrite` (thuần, test được) — panel chỉ gọi, không tự chế.
 *  · `min`/`max` ⇒ clamp lúc ghi (cùng semantics Math.min/max của panel tay).
 *  · Trường giá trị là OBJECT (vd emissive{color,intensity}) — def vẫn khai đủ (kind = LOẠI Ô
 *    NHẬP của scalar đang chỉnh) nhưng v0 panel KHÔNG tự ghi được sub-path ⇒ phải qua renderer
 *    tuỳ chỉnh hoặc giữ tay [T0 khai thật]. Đề xuất nới type (duongDan?) ghi ở báo cáo, CHƯA làm.
 */

/** Chuỗi song ngữ — panel render qua tr(vi, en) của lib/i18n. */
export interface IfRnaText {
  vi: string;
  en: string;
}

/** LOẠI Ô NHẬP — khớp 5 khuôn control panel tay đang dùng (slider/number · color · toggle ·
 * select · nút nạp ảnh). */
export type IfRnaKind = 'number' | 'color' | 'bool' | 'enum' | 'texture';

export interface IfRnaField<T> {
  /** typed key của T — gõ sai tên trường là tsc đỏ ngay tại định nghĩa. */
  key: keyof T & string;
  label: IfRnaText;
  kind: IfRnaKind;
  /** đơn vị hiển thị (vd 'mm') — không đổi giá trị lưu. */
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  /** nhóm hiển thị — panel gom + collapse theo nhóm [Đ6]. */
  group: IfRnaText;
  moTa?: IfRnaText;
  /** key khác cần re-render/lan truyền khi trường này đổi (xem QUY ƯỚC đầu file về 'suyDoan'). */
  anTheo?: readonly (keyof T & string)[];
}

/** Số chữ số thập phân hiển thị suy từ step (0.01 → 2, 0.1 → 1, 1 → 0) — panel tay cũ dùng
 * toFixed(2)/toFixed(1) tay từng chỗ; giờ suy MỘT chỗ từ metadata. */
export function ifRnaDecimals(field: IfRnaField<never>): number {
  const step = field.step ?? 0.01;
  if (step >= 1) return 0;
  if (step >= 0.1) return 1;
  return 2;
}

/**
 * GHI một giá trị scalar vào field — thuần, không DOM, test khoá parity với material-edit.ts:
 * clamp theo min/max + xoá cờ `suyDoan` nếu anTheo khai (bằng đúng `setRoughness`).
 * Trả object MỚI (không sửa tại chỗ — KS4 lùi được, cùng kỷ luật material-edit.ts).
 */
export function ifRnaWrite<T extends object>(field: IfRnaField<T>, value: T, v: unknown): T {
  let x = v;
  if (field.kind === 'number' && typeof x === 'number') {
    if (field.min !== undefined) x = Math.max(field.min, x);
    if (field.max !== undefined) x = Math.min(field.max, x as number);
  }
  const next = { ...value, [field.key]: x } as T;
  if ((field.anTheo as readonly string[] | undefined)?.includes('suyDoan')) {
    delete (next as Record<string, unknown>).suyDoan;
  }
  return next;
}

/** Tra def theo key — cho chỗ GIỮ TAY vẫn đọc nhãn/miền từ MỘT nguồn (sửa registry là chỗ tay
 * đổi theo, không còn chuỗi chép đôi). Thiếu key là throw ngay lúc dev, không im lặng. */
export function ifRnaField<T>(defs: readonly IfRnaField<T>[], key: keyof T & string): IfRnaField<T> {
  const f = defs.find((d) => d.key === key);
  if (!f) throw new Error(`IfRna: không có định nghĩa cho key "${key}"`);
  return f;
}
