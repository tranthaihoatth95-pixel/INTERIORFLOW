'use client';

/**
 * components/present-editor/boq/boq-custom-columns.ts — cột người dùng tự thêm vào bảng BOQ
 * (`docs/SPEC-TRINH-BOQ-EDITOR.md` §3: "Người dùng thêm — trần 30 cột, công bố NGAY trong nút
 * thêm cột — đúng 6 kiểu chép Grist-tối-giản": Text · Numeric ₫ · Integer · Choice · Reference→matId
 * · Computed). Port từ `docs/mocks/mock-trinh-boq-2026-08-04.html` popover `.colpop` (§3, pin 4).
 *
 * ⛔ TẦNG UI THUẦN — cố ý KHÔNG đụng `lib/boq/*` (engine `BoqRow`/`computeBoq` không mang các cột
 * này) và KHÔNG đụng `lib/present-editor/*` (đúng ranh giới phiếu port này). Hệ quả: cột thêm ở
 * đây CHƯA vào `totalAmount`, CHƯA xuất `.xlsx`/PDF — việc đó cần sửa engine, để phiếu riêng.
 * Lưu client-side theo `projectId` (localStorage) — cùng cơ chế `COACH_KEY`/`GROUP_MODE_KEY` đã có
 * ở `BoqScreen.tsx`, không có route server, không đụng DB.
 *
 * ⚠️ Kiểu 'computed' (ƒx): `SPEC-TRINH-BOQ-EDITOR.md` §4 ghi rõ "Mini-DSL... PHU thẩm định độ khó
 * parse TRƯỚC KHI vào phiếu code" — CHƯA được duyệt code hoá (CLAUDE.md luật đóng băng #1+#3).
 * Cột kiểu này ĐƯỢC PHÉP TẠO (đúng mock, đúng đủ 6 kiểu trong popover) nhưng mọi ô của nó hiện
 * "—" + giải thích đang chờ duyệt — KHÔNG tự chế công thức.
 */

export type BoqCustomColumnType = 'text' | 'currency' | 'integer' | 'choice' | 'reference' | 'computed';

export interface BoqCustomColumn {
  id: string;
  type: BoqCustomColumnType;
  name: string;
  /** Chỉ dùng cho 'choice' — mặc định đúng ví dụ đơn vị trong mock (m²·m·md·cái·bộ·tấm). */
  choices?: string[];
}

export const BOQ_CUSTOM_COLUMN_CAP = 30;

/** matId (hoặc `kind:matId` khi cần phân biệt dòng đếm/dòng vùng tô trùng matId) → colId → giá trị chữ. */
export type BoqCustomValueMap = Record<string, Record<string, string>>;

const DEFAULT_CHOICES = ['m²', 'm', 'md', 'cái', 'bộ', 'tấm'];

function colKey(projectId: string): string {
  return `if-boq-custom-cols:${projectId}`;
}
function valueKey(projectId: string): string {
  return `if-boq-custom-values:${projectId}`;
}

export function loadBoqCustomColumns(projectId: string): BoqCustomColumn[] {
  try {
    const raw = localStorage.getItem(colKey(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBoqCustomColumns(projectId: string, cols: BoqCustomColumn[]): void {
  try { localStorage.setItem(colKey(projectId), JSON.stringify(cols)); } catch { /* tiện nghi, không chặn nếu lưu lỗi */ }
}

export function loadBoqCustomValues(projectId: string): BoqCustomValueMap {
  try {
    const raw = localStorage.getItem(valueKey(projectId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveBoqCustomValues(projectId: string, values: BoqCustomValueMap): void {
  try { localStorage.setItem(valueKey(projectId), JSON.stringify(values)); } catch { /* tiện nghi, không chặn nếu lưu lỗi */ }
}

/** Tên mặc định khi thêm cột — người dùng đổi tên sau bằng cách sửa trực tiếp header (double-click). */
export function defaultColumnName(type: BoqCustomColumnType, existing: BoqCustomColumn[], tr: (vi: string, en: string) => string): string {
  const base: Record<BoqCustomColumnType, string> = {
    text: tr('Cột chữ', 'Text column'),
    currency: tr('Cột số · ₫', 'Numeric ₫ column'),
    integer: tr('Cột số nguyên', 'Integer column'),
    choice: tr('Cột chọn', 'Choice column'),
    reference: tr('Tham chiếu matId', 'matId reference'),
    computed: tr('Computed ƒx', 'Computed ƒx'),
  };
  const n = existing.filter((c) => c.type === type).length + 1;
  return n > 1 ? `${base[type]} ${n}` : base[type];
}

export function makeBoqCustomColumn(type: BoqCustomColumnType, existing: BoqCustomColumn[], tr: (vi: string, en: string) => string): BoqCustomColumn {
  return {
    id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    type,
    name: defaultColumnName(type, existing, tr),
    choices: type === 'choice' ? DEFAULT_CHOICES : undefined,
  };
}
