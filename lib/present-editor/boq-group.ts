/**
 * lib/present-editor/boq-group.ts — B6 (`docs/PHIEU-TRINH-BOQ-EDITOR.md`): GROUP + SUBTOTAL =
 * SUMMARY-BAR. Nhóm các dòng `BoqRow` đã tính theo TẦNG (`Base.storey` của entity — `lib/cad/
 * model.ts:162`) — spec §6 gốc còn xin nhóm theo "phòng/zone" nhưng `HatchEntity` KHÔNG có
 * `roomId` (đã kiểm code thật, xem §B phiếu) nên nhóm-theo-phòng LÙI SANG v2 (cần cờ `inferred`
 * lộ mặt theo `SPEC-TANG-DU-LIEU-CAU-KIEN` L4) — v1 CHỈ nhóm theo tầng, đúng như phiếu đã sửa.
 *
 * THUẦN — không đọc override/IDB; nhận `rows` (đã hoặc chưa áp override, không quan trọng với hàm
 * này) + `doc` để tra storey theo entityIds. CẤM cho công thức đọc subtotal (bẫy Airtable, §6 —
 * đây chỉ là số hiển thị, không phải cell sống cho B7/B11 tham chiếu).
 */
import type { Doc } from '@/lib/cad/model';
import type { BoqRow } from '@/lib/boq/model';

export interface BoqGroup<R extends BoqRow = BoqRow> {
  key: string;
  label: string;
  /** true = dòng này có entityIds vắt qua NHIỀU tầng khác nhau — hiếm, KHÔNG chia đôi số, chỉ
   * đánh dấu để UI hiện rõ "nhiều tầng" thay vì âm thầm gộp sai nhóm. */
  multiStorey: boolean;
  rows: R[];
  subtotalM2: number;
  subtotalAmount: number;
}

export const NO_STOREY_LABEL = 'Chưa gán tầng';
export const MULTI_STOREY_LABEL = 'Nhiều tầng';
const NO_STOREY_KEY = '__none__';
const MULTI_STOREY_KEY = '__multi__';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function rowStoreyGroup(entityIds: string[], storeyById: Map<string, string | undefined>): { key: string; label: string; multi: boolean } {
  const storeys = new Set(entityIds.map((id) => storeyById.get(id) || ''));
  if (storeys.size > 1) return { key: MULTI_STOREY_KEY, label: MULTI_STOREY_LABEL, multi: true };
  const only = storeys.values().next().value ?? '';
  if (!only) return { key: NO_STOREY_KEY, label: NO_STOREY_LABEL, multi: false };
  return { key: only, label: only, multi: false };
}

/** Nhóm `rows` theo tầng — thứ tự nhóm = thứ tự GẶP LẦN ĐẦU trong `rows` (ổn định, không phụ
 * thuộc thứ tự duyệt Map nội bộ). Σ `subtotalAmount` các nhóm LUÔN = tổng `thanhTien` của toàn bộ
 * `rows` truyền vào (phép chia đúng nghĩa "partition", không hàm nào cộng thiếu/thừa — N3). */
export function groupBoqRowsByStorey<R extends BoqRow>(rows: R[], doc: Doc): BoqGroup<R>[] {
  const storeyById = new Map(doc.entities.map((e) => [e.id, e.storey]));
  const order: string[] = [];
  const groups = new Map<string, BoqGroup<R>>();

  for (const row of rows) {
    const { key, label, multi } = rowStoreyGroup(row.entityIds, storeyById);
    let g = groups.get(key);
    if (!g) {
      g = { key, label, multiStorey: multi, rows: [], subtotalM2: 0, subtotalAmount: 0 };
      groups.set(key, g);
      order.push(key);
    }
    g.rows.push(row);
    g.subtotalM2 = round2(g.subtotalM2 + row.m2);
    g.subtotalAmount += row.thanhTien;
  }

  return order.map((k) => groups.get(k) as BoqGroup<R>);
}
