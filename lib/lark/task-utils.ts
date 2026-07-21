/**
 * lib/lark/task-utils.ts — hàm THUẦN (không I/O) dùng chung cho sync route + panel "Chi tiết".
 * Tách riêng khỏi lib/integrations/providers/lark.ts để test được không cần fetch/DB/env
 * (node_modules/.bin/sucrase-node lib/lark/task-utils.test.ts).
 */

/** Trạng thái chuẩn hoá từ Larkbase "Trạng thái" (fldfhchOp2) — 3 giá trị cố định. */
export type LarkTaskStatus = 'Đang làm' | 'Hoàn thành' | 'Ghi nhận';

export interface LarkTaskLike {
  larkProjectCode: string | null;
  status: string;
  warningLabel: string | null;
  daysLeft: number | null;
  deadline: string | Date | null;
}

/**
 * "Mã DA" bên Larkbase — báo cáo §1.5/§1.4 phát hiện có record giá trị `"Khác"` (chữ, không
 * phải mã dự án số) lẫn trong dữ liệu thật. Quy tắc lọc CỤ THỂ (không phải đoán): chỉ nhận
 * chuỗi TOÀN SỐ; "Khác"/rỗng/khoảng trắng/bất kỳ chữ nào khác → null (KHÔNG coi là 1 project
 * code hợp lệ, tránh gộp nhầm nhiều dự án khác nhau vào chung 1 "dự án ảo" — xem §3 báo cáo).
 */
export function normalizeProjectCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  return /^\d+$/.test(t) ? t : null;
}

/** Thứ hạng khẩn cấp của 1 warningLabel Larkbase — dùng để SORT (không đổi nghĩa chuỗi gốc). */
export function warningRank(label: string | null | undefined): number {
  if (!label) return 3; // không rõ — xếp sau cùng
  if (label.includes('🔴')) return 0; // trễ — khẩn cấp nhất
  if (label.includes('🟡')) return 1; // sắp đến hạn
  if (label.includes('🟢')) return 2; // đúng tiến độ
  if (label.includes('✅')) return 3; // hoàn thành — không còn khẩn cấp
  return 3;
}

/** % tiến độ 1 nhóm larkProjectCode: hoàn thành / tổng (đúng công thức §2.2(c) báo cáo). */
export function computeProgressByCode<T extends { larkProjectCode: string | null; status: string }>(
  tasks: T[],
): Map<string, { done: number; total: number; pct: number }> {
  const byCode = new Map<string, { done: number; total: number }>();
  for (const t of tasks) {
    if (!t.larkProjectCode) continue;
    const cur = byCode.get(t.larkProjectCode) ?? { done: 0, total: 0 };
    cur.total += 1;
    if (t.status === 'Hoàn thành') cur.done += 1;
    byCode.set(t.larkProjectCode, cur);
  }
  const out = new Map<string, { done: number; total: number; pct: number }>();
  for (const [code, v] of byCode) {
    out.set(code, { ...v, pct: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0 });
  }
  return out;
}

/**
 * Cảnh báo đại diện của 1 project code cho pill trên Gallery card — worst-case (khẩn cấp
 * nhất) trong các task CHƯA hoàn thành; toàn bộ đã hoàn thành → "✅ Hoàn thành". Không tự suy
 * diễn/tính lại — chỉ CHỌN 1 chuỗi đã có sẵn từ Larkbase (đúng nguyên tắc §2.1: không tự tính
 * lại % tiến độ/cảnh báo bằng công thức riêng).
 */
export function worstWarningByCode<T extends { larkProjectCode: string | null; status: string; warningLabel: string | null; daysLeft: number | null }>(
  tasks: T[],
): Map<string, string> {
  const byCode = new Map<string, T[]>();
  for (const t of tasks) {
    if (!t.larkProjectCode) continue;
    byCode.set(t.larkProjectCode, [...(byCode.get(t.larkProjectCode) ?? []), t]);
  }
  const out = new Map<string, string>();
  for (const [code, group] of byCode) {
    const open = group.filter((t) => t.status !== 'Hoàn thành' && t.warningLabel);
    if (open.length === 0) {
      const anyLabel = group.find((t) => t.warningLabel)?.warningLabel;
      if (anyLabel) out.set(code, anyLabel);
      continue;
    }
    const worst = [...open].sort((a, b) => {
      const r = warningRank(a.warningLabel) - warningRank(b.warningLabel);
      if (r !== 0) return r;
      return (a.daysLeft ?? 0) - (b.daysLeft ?? 0);
    })[0];
    if (worst.warningLabel) out.set(code, worst.warningLabel);
  }
  return out;
}

export type SortKey = 'project' | 'owner' | 'status' | 'deadline' | 'warning' | 'progress';

/**
 * Sort bảng phẳng tab "Bảng" — mặc định "Deadline gần nhất trước" (đúng brief). `null` deadline
 * luôn xếp CUỐI bất kể chiều sort (không có hạn thì không "gần nhất" theo nghĩa nào cả).
 */
export function sortTaskRows<
  T extends {
    larkProjectName: string;
    ownerAccount: string | null;
    status: string;
    deadline: string | Date | null;
    warningLabel: string | null;
    daysLeft: number | null;
  },
>(rows: T[], key: SortKey = 'deadline', dir: 1 | -1 = 1): T[] {
  const time = (d: string | Date | null): number | null => {
    if (d == null) return null;
    const t = new Date(d).getTime();
    return Number.isFinite(t) ? t : null;
  };
  return [...rows].sort((a, b) => {
    switch (key) {
      case 'project':
        return dir * a.larkProjectName.localeCompare(b.larkProjectName);
      case 'owner':
        return dir * (a.ownerAccount ?? '').localeCompare(b.ownerAccount ?? '');
      case 'status':
        return dir * a.status.localeCompare(b.status);
      case 'warning':
        return dir * (warningRank(a.warningLabel) - warningRank(b.warningLabel));
      case 'progress':
        return dir * ((a.daysLeft ?? 0) - (b.daysLeft ?? 0));
      case 'deadline':
      default: {
        const ta = time(a.deadline);
        const tb = time(b.deadline);
        if (ta === null && tb === null) return 0;
        if (ta === null) return 1; // không có hạn → luôn cuối
        if (tb === null) return -1;
        return dir * (ta - tb);
      }
    }
  });
}
